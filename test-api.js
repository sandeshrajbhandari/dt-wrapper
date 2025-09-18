// Test image edit (img2img) against DrawThings API
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

async function testImageEdit() {
  const baseUrl = 'http://localhost:7860';
  const assetPath = path.join(
    '/Users/sandeshrajbhandari/Documents/dt-wrapper',
    'src/assets/taylor-qwen-test.png'
  );

  try {
    console.log('Reading source image...');
    const fileBuffer = await fs.readFile(assetPath);
    const base64Image = fileBuffer.toString('base64');

    // Minimal Qwen edit configuration
    const params = {
      model: 'qwen_image_edit_1.0_q6p.ckpt',
      loras: [
        {
          file: 'qwen_image_edit_1.0_lightning_4_step_v1.0_lora_f16.ckpt',
          weight: 1,
        },
      ],
      sampler: 'UniPC Trailing',
      steps: 4,
      strength: 1,
      width: 1024,
      height: 1024,
      prompt: '',
      init_images: [base64Image],
    };

    console.log('Sending img2img request to DrawThings...');
    const res = await fetch(`${baseUrl}/sdapi/v1/img2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    if (!data?.images?.length) {
      throw new Error('No images returned by API');
    }

    const outputB64 = data.images[0];
    const outFile = path.join(
      '/Users/sandeshrajbhandari/Documents/dt-wrapper/server/cache',
      `test_edit_${Date.now()}.png`
    );
    await fs.writeFile(outFile, Buffer.from(outputB64, 'base64'));
    console.log('✅ Image edit completed. Saved to:', outFile);
  } catch (error) {
    console.log('❌ Image edit test failed');
    console.log('Error:', error.message);
    console.log('\nHints:');
    console.log('1. Ensure DrawThings is running and API enabled on port 7860.');
    console.log('2. Make sure the Qwen edit model/loras exist in DrawThings.');
    console.log('3. Check the asset path exists:', assetPath);
  }
}

testImageEdit();