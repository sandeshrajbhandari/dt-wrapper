# DrawThings API Troubleshooting Guide

## Common Issues and Solutions

### 1. 500 Internal Server Error

**Problem**: Getting a 500 error when making requests to `/sdapi/v1/txt2img`

**Solutions**:
- Make sure DrawThings is running and the API is enabled
- Check if the model file exists: `dreamshaper_v8_q6p_q8p.ckpt`
- Verify the LoRA file exists: `tcd_sd_v1.5_lora_f16.ckpt`
- Try with a simpler prompt first

### 2. Connection Refused

**Problem**: Cannot connect to `http://localhost:7859`

**Solutions**:
- Start DrawThings application
- Enable API in DrawThings settings
- Check if port 7859 is not blocked by firewall
- Verify DrawThings is listening on the correct port

### 3. JavaScript Errors in iframe-index.bundle.js

**Problem**: Errors about `photoURL` being null

**Solutions**:
- These errors are likely from DrawThings UI components
- They shouldn't affect the API functionality
- Check browser console for more specific error details

## Setup Instructions

### 1. Install DrawThings
- Download from: https://drawthings.ai/
- Install and launch the application

### 2. Enable API
- Open DrawThings
- Go to Settings → API
- Enable the API server
- Set port to 7859 (default)

### 3. Download Required Models
- Download `dreamshaper_v8_q6p_q8p.ckpt` model
- Download `tcd_sd_v1.5_lora_f16.ckpt` LoRA file
- Place them in the DrawThings models directory

### 4. Test API Connection
```bash
# Install node-fetch if needed
npm install node-fetch

# Run the test script
node test-api.js
```

### 5. Start the React App
```bash
npm run dev
```

## API Parameters Explained

The current configuration uses:
- **Model**: `dreamshaper_v8_q6p_q8p.ckpt` - A quantized DreamShaper model
- **LoRA**: `tcd_sd_v1.5_lora_f16.ckpt` - A LoRA for enhanced quality
- **Steps**: 4 - Low step count for faster generation
- **Sampler**: 9 - DPM++ 2M Karras sampler
- **Guidance Scale**: 1 - Low guidance for more creative results

## Debugging

1. Check browser console for detailed error messages
2. Use the test script to verify API connectivity
3. Try simpler API calls first (like `/sdapi/v1/options`)
4. Check DrawThings logs for server-side errors

## Alternative Models

If the current model doesn't work, try these alternatives:
- `sd_xl_base_1.0.safetensors` (SDXL Base)
- `realistic_vision_v5.1.safetensors` (Realistic Vision)
- `deliberate_v3.safetensors` (Deliberate)

Update the `model` parameter in the API request accordingly. 