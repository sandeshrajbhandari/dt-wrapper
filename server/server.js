const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const axios = require('axios');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3001;
const DRAWTHINGS_API_URL = 'http://localhost:7860';
const CACHE_DIR = path.join(__dirname, 'cache');
const MAX_CACHE_SIZE = 30;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory cache to track files
class MediaCache {
  constructor(maxSize = 30) {
    this.cache = new Map(); // key -> { filename, timestamp, metadata }
    this.maxSize = maxSize;
  }

  async add(key, filename, metadata = {}) {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      const oldestEntry = this.cache.get(oldestKey);
      
      try {
        await fs.unlink(path.join(CACHE_DIR, oldestEntry.filename));
        console.log(`Removed cached file: ${oldestEntry.filename}`);
      } catch (error) {
        console.error(`Error removing cached file: ${error.message}`);
      }
      
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      filename,
      timestamp: Date.now(),
      metadata
    });
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  list() {
    return Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }

  async clear() {
    for (const [key, entry] of this.cache.entries()) {
      try {
        await fs.unlink(path.join(CACHE_DIR, entry.filename));
      } catch (error) {
        console.error(`Error removing cached file: ${error.message}`);
      }
    }
    this.cache.clear();
  }
}

const mediaCache = new MediaCache(MAX_CACHE_SIZE);

// Ensure cache directory exists
async function initializeCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log(`Cache directory initialized: ${CACHE_DIR}`);
  } catch (error) {
    console.error(`Error creating cache directory: ${error.message}`);
    process.exit(1);
  }
}

// Generate unique filename
function generateFilename(extension = 'png') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  return `${timestamp}_${random}.${extension}`;
}

// Create cache key from request parameters
function createCacheKey(requestData) {
  const sortedData = JSON.stringify(requestData, Object.keys(requestData).sort());
  return crypto.createHash('md5').update(sortedData).digest('hex');
}

// Save base64 image to file
async function saveBase64Image(base64Data, filename) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(CACHE_DIR, filename);
    await fs.writeFile(filePath, buffer);
    return filePath;
  } catch (error) {
    throw new Error(`Error saving image: ${error.message}`);
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    cacheSize: mediaCache.cache.size,
    maxCacheSize: MAX_CACHE_SIZE,
    timestamp: new Date().toISOString()
  });
});

// Generate image endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const requestData = req.body;
    const cacheKey = createCacheKey(requestData);

    // Check if we have cached result
    if (mediaCache.has(cacheKey)) {
      const cachedEntry = mediaCache.get(cacheKey);
      const filePath = path.join(CACHE_DIR, cachedEntry.filename);
      
      try {
        const fileBuffer = await fs.readFile(filePath);
        const base64Image = fileBuffer.toString('base64');
        
        return res.json({
          success: true,
          cached: true,
          images: [`data:image/png;base64,${base64Image}`],
          metadata: cachedEntry.metadata,
          cacheKey
        });
      } catch (error) {
        // File not found, remove from cache and continue with generation
        mediaCache.cache.delete(cacheKey);
        console.log(`Cached file not found, regenerating: ${cachedEntry.filename}`);
      }
    }

    // Filter out tea_cache_end if it's -1 (as done in the reference code)
    // -1 isn't supported by the DrawThings API, so we need to remove it
    let filteredRequestData = { ...requestData };
    if (filteredRequestData.tea_cache_end === -1) {
      const { tea_cache_end, ...dataWithoutTeaCacheEnd } = filteredRequestData;
      filteredRequestData = dataWithoutTeaCacheEnd;
      console.log('Filtered out tea_cache_end: -1 (not supported by DrawThings API)');
    }

    // Make request to DrawThings API
    console.log('Request data being sent to DrawThings:', JSON.stringify(filteredRequestData, null, 2));
    console.log(`Making request to DrawThings API for cache key: ${cacheKey}`);
    
    const endpoint = filteredRequestData.init_images ? 'img2img' : 'txt2img';
    const response = await axios.post(`${DRAWTHINGS_API_URL}/sdapi/v1/${endpoint}`, filteredRequestData, {
      timeout: 120000, // 2 minute timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.images || response.data.images.length === 0) {
      console.log('DrawThings API response:', JSON.stringify(response.data, null, 2));
      throw new Error('No images generated by DrawThings API');
    }

    // Save the first generated image
    const base64Image = response.data.images[0];
    const filename = generateFilename('png');
    await saveBase64Image(base64Image, filename);

    // Add to cache
    await mediaCache.add(cacheKey, filename, {
      prompt: requestData.prompt || 'No prompt provided',
      generatedAt: new Date().toISOString(),
      parameters: {
        steps: requestData.steps,
        cfg_scale: requestData.cfg_scale,
        width: requestData.width,
        height: requestData.height,
        sampler_name: requestData.sampler_name
      }
    });

    console.log(`Generated and cached image: ${filename}`);

    res.json({
      success: true,
      cached: false,
      images: [`data:image/png;base64,${base64Image}`],
      metadata: {
        filename,
        generatedAt: new Date().toISOString(),
        prompt: requestData.prompt || 'No prompt provided'
      },
      cacheKey
    });

  } catch (error) {
    console.error('Error generating image:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: 'DrawThings API is not available. Please ensure it\'s running on port 7860.',
        code: 'SERVICE_UNAVAILABLE'
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(408).json({
        success: false,
        error: 'Request timeout. Image generation took too long.',
        code: 'TIMEOUT'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

// Get cached file by key
app.get('/api/cache/:key', async (req, res) => {
  try {
    const cacheKey = req.params.key;
    
    if (!mediaCache.has(cacheKey)) {
      return res.status(404).json({
        success: false,
        error: 'Cached file not found'
      });
    }

    const cachedEntry = mediaCache.get(cacheKey);
    const filePath = path.join(CACHE_DIR, cachedEntry.filename);
    
    const fileBuffer = await fs.readFile(filePath);
    const base64Image = fileBuffer.toString('base64');
    
    res.json({
      success: true,
      image: `data:image/png;base64,${base64Image}`,
      metadata: cachedEntry.metadata
    });

  } catch (error) {
    console.error('Error retrieving cached file:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all cached files
app.get('/api/cache', (req, res) => {
  try {
    const cacheList = mediaCache.list();
    res.json({
      success: true,
      cache: cacheList,
      totalFiles: cacheList.length,
      maxSize: MAX_CACHE_SIZE
    });
  } catch (error) {
    console.error('Error listing cache:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear cache
app.delete('/api/cache', async (req, res) => {
  try {
    await mediaCache.clear();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve cached files directly (optional route for direct file access)
app.get('/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(CACHE_DIR, filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(filePath);
    
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    await initializeCacheDir();
    
    app.listen(PORT, () => {
      console.log(`🚀 DrawThings Backend Server running on port ${PORT}`);
      console.log(`📁 Cache directory: ${CACHE_DIR}`);
      console.log(`🗄️  Max cache size: ${MAX_CACHE_SIZE} files`);
      console.log(`🔗 DrawThings API: ${DRAWTHINGS_API_URL}`);
      console.log('\nAvailable endpoints:');
      console.log(`  GET  /health - Health check`);
      console.log(`  POST /api/generate - Generate images`);
      console.log(`  GET  /api/cache - List cached files`);
      console.log(`  GET  /api/cache/:key - Get specific cached file`);
      console.log(`  DELETE /api/cache - Clear all cache`);
      console.log(`  GET  /files/:filename - Direct file access`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Server terminated');
  process.exit(0);
});

startServer();