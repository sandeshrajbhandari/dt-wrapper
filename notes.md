## test server.js

curl -s -X POST http://localhost:3001/api/generate -H "Content-Type: application/json" -d '{"prompt": "a beautiful sunset over mountains", "model": "dreamshaper_v8_q6p_q8p.ckpt", "steps": 4, "sampler": "TCD", "height": 512, "width": 512, "seed": 2994401011, "guidance_scale": 1, "loras": [{"file": "tcd_sd_v1.5_lora_f16.ckpt", "weight": 1}], "tea_cache_end": -1, "num_frames": 14, "motion_scale": 127, "fps": 5}' | head -c 400
