// DrawThings API configurations for different models
import jsonConfigs from './configs.json';

export const drawThingsConfigs = {
  // Default configuration (current one)
  default: {
    steps: 4,
    model: "dreamshaper_v8_q6p_q8p.ckpt",
    loras: [
      {
        file: "tcd_sd_v1.5_lora_f16.ckpt",
        weight: 1
      }
    ],
    strength: 1,
    sampler: "TCD",
    height: 512,
    width: 512,
    seed: 2994401011,
    guidance_scale: 1,
    controls: [],

    negative_prompt: "",
    
    stage_2_shift: 1,
    speed_up_with_guidance_embed: true,
    t5_text: null,
    image_guidance: 1.5,
    
    clip_weight: 1,
    shift: 1,
    clip_l_text: null,
    tiled_diffusion: false,
    hires_fix_height: 448,
    resolution_dependent_shift: true,
    mask_blur: 1.5,

    num_frames: 14,
    seed_mode: "Scale Alike",
    tea_cache_end: -1,
    image_prior_steps: 5,
    separate_clip_l: false,
    motion_scale: 127,
    
    diffusion_tile_overlap: 128,
    guidance_embed: 3.5,
    hires_fix_width: 448,
    hires_fix: false,
    separate_t5: false,
    hires_fix_strength: 0.699999988079071,
    tea_cache_threshold: 0.0599999986588955,
    start_frame_guidance: 1,
    tea_cache_start: 5,
    crop_left: 0,
    clip_skip: 1,
    negative_original_width: 512,
    refiner_start: 0.850000023841858,
    target_width: 512,
    separate_open_clip_g: false,
    batch_count: 1,
    decoding_tile_width: 640,
    crop_top: 0,
    diffusion_tile_width: 1024,
    negative_prompt_for_image_prior: true,
    sharpness: 0,
    stage_2_guidance: 1,
    stochastic_sampling_gamma: 0.3,
    original_height: 512,
    preserve_original_after_inpaint: true,
    decoding_tile_overlap: 128,
    target_height: 512,
    tiled_decoding: false,
    diffusion_tile_height: 1024,
    zero_negative_prompt: false,
    decoding_tile_height: 640,
    negative_aesthetic_score: 2.5,
    tea_cache: false,
    batch_size: 1,
    fps: 5,
    negative_original_height: 512,
    upscaler: null,
    upscaler_scale: 0,
    refiner_model: null,
    t5_text_encoder_decoding: true,
    seed: 2994401011,
    open_clip_g_text: null,
    tea_cache_max_skip_steps: 3,
    aesthetic_score: 6,
    mask_blur_outset: 0,
    causal_inference: 0,
    guiding_frame_noise: 0.0199999995529652,
    original_width: 512
  },
  // JSON-provided configs merged below
  ...jsonConfigs
};

// Helper function to get a specific configuration
export const getConfig = (configName = 'default') => {
  const config = drawThingsConfigs[configName];
  if (!config) {
    console.warn(`Configuration "${configName}" not found, using default`);
    return drawThingsConfigs.default;
  }
  
  // Remove tea_cache_end if it's -1 (as done in the original code)
  // -1 isnt supported by the api, so we need to remove it
  if (config.tea_cache_end === -1) {
    const { tea_cache_end, ...configWithoutTeaCacheEnd } = config;
    return configWithoutTeaCacheEnd;
  }
  
  return config;
};

// Helper function to get available configuration names
export const getAvailableConfigs = () => {
  return Object.keys(drawThingsConfigs);
}; 