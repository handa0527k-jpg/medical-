/**
 * Wan 2.2 prompts and ComfyUI workflows.
 *
 * Wan is asked for motion, light, camera and texture in a gekiga (劇画) look — never for text, labels or
 * exact anatomy. Each shot starts from a MEDSTUDY keyframe (image-to-video), so the composition and
 * structures come from MEDSTUDY's exact figure and Wan only animates it.
 *
 * Workflows are written in ComfyUI's API format with the node names and settings of ComfyUI's official
 * Wan 2.2 templates (Wan22ImageToVideoLatent for TI2V 5B; WanImageToVideo + two KSamplerAdvanced passes
 * for the 14B high/low-noise I2V pair). They are generated, not executed, here — the Windows side posts
 * them to a local ComfyUI (http://127.0.0.1:8188/prompt).
 */
import type { Intensity, Plan, SceneDef, Timing, WanShot } from './types';
import { at } from './timing';

export type WanProfile = 'ti2v-5b' | 'i2v-14b';
export const WAN_PROFILES: Record<WanProfile, { label: string; w: number; h: number; fps: number; maxFrames: number; note: string }> = {
  'ti2v-5b': { label: 'Wan 2.2 TI2V 5B（軽量・24fps）', w: 1280, h: 704, fps: 24, maxFrames: 121, note: 'VRAM 8GB〜（ComfyUIのオフロード使用）。1280×704・最大121フレーム（約5秒）' },
  'i2v-14b': { label: 'Wan 2.2 I2V 14B（高品質・16fps）', w: 1280, h: 720, fps: 16, maxFrames: 81, note: 'VRAM 24GB 推奨（fp8）。1280×720・最大81フレーム（約5秒）。FFmpegで24fpsへ変換' },
};

const STYLE = 'gekiga manga style animation, bold hand-inked black lines, heavy cross-hatched shadows, high contrast chiaroscuro, limited desaturated palette with deep blacks, dramatic composition, cinematic, 1980s Japanese gekiga illustration texture';
const CAMERA: Record<Intensity, string> = {
  standard: 'smooth slow camera dolly-in, steady framing',
  gekiga: 'fast push-in that stops abruptly, dramatic low angle, strong perspective, sudden held frame',
  ultra: 'violent crash zoom, whip pan, extreme perspective, dutch angle, sudden freeze then explosive motion',
};
/** Wan's own default negative prompt (from the official template) without 风格/作品/画作 — we do want a drawn style */
const WAN_NEG_ZH = '色调艳丽，过曝，静态，细节模糊不清，字幕，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走';
const NEG_EN = 'text, letters, numbers, captions, subtitles, labels, watermark, logo, signature, speech bubbles, writing, symbols, deformed structures, extra objects, cartoon faces on cells, cute mascot, pastel colors, oversaturated, photorealistic skin, gore, blood';

export function wanPrompt(sc: SceneDef, shot: WanShot, intensity: Intensity) {
  const motion = sc.cams.filter((c) => c.move !== 'set').map((c) => c.note).join(' / ');
  const positive = [
    shot.subject + '.',
    `Camera: ${CAMERA[intensity]}.`,
    `Look: ${STYLE}.`,
    shot.mode === 'background' ? 'The centre of the frame stays calm and darker (an exact figure will be laid over it).' : 'The subject fills the frame.',
    `Accuracy: ${shot.accuracy}.`,
  ].join(' ');
  const negative = [shot.avoid, NEG_EN, WAN_NEG_ZH].filter(Boolean).join(', ');
  return { positive, negative, cameraJa: motion };
}

export interface ShotTime { scene: string; shot: string; t0: number; t1: number; dur: number; frames: number }
/** shot boundaries from the timing; frames rounded up to Wan's 4n+1 and capped at the model's maximum */
export function shotTimes(plan: Plan, timing: Timing, profile: WanProfile): ShotTime[] {
  const P = WAN_PROFILES[profile], out: ShotTime[] = [];
  for (const sc of plan.scenes) {
    const ts = timing.scenes.find((x) => x.id === sc.id)!;
    const starts = sc.shots.map((s) => (s.from === 'start' ? ts.t0 : at(ts, s.from)));
    sc.shots.forEach((s, i) => {
      const t0 = starts[i], t1 = i + 1 < starts.length ? starts[i + 1] : ts.t1, dur = Math.max(0.5, t1 - t0);
      const frames = Math.min(P.maxFrames, 4 * Math.ceil((dur * P.fps) / 4) + 1);
      out.push({ scene: sc.id, shot: s.id, t0, t1, dur, frames });
    });
  }
  return out;
}

/** ComfyUI API-format workflow for one shot */
export function comfyWorkflow(o: { profile: WanProfile; positive: string; negative: string; image: string; frames: number; prefix: string; seed: number; fast?: boolean }) {
  const P = WAN_PROFILES[o.profile];
  if (o.profile === 'ti2v-5b') {
    return {
      '1': { class_type: 'UNETLoader', inputs: { unet_name: 'wan2.2_ti2v_5B_fp16.safetensors', weight_dtype: 'default' }, _meta: { title: 'Wan 2.2 TI2V 5B' } },
      '2': { class_type: 'CLIPLoader', inputs: { clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', type: 'wan', device: 'default' } },
      '3': { class_type: 'VAELoader', inputs: { vae_name: 'wan2.2_vae.safetensors' } },
      '4': { class_type: 'ModelSamplingSD3', inputs: { model: ['1', 0], shift: 8 } },
      '5': { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: o.positive }, _meta: { title: 'positive' } },
      '6': { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: o.negative }, _meta: { title: 'negative' } },
      '7': { class_type: 'LoadImage', inputs: { image: o.image }, _meta: { title: 'MEDSTUDY keyframe' } },
      '8': { class_type: 'Wan22ImageToVideoLatent', inputs: { vae: ['3', 0], width: P.w, height: P.h, length: o.frames, batch_size: 1, start_image: ['7', 0] } },
      '9': { class_type: 'KSampler', inputs: { model: ['4', 0], positive: ['5', 0], negative: ['6', 0], latent_image: ['8', 0], seed: o.seed, steps: 20, cfg: 5, sampler_name: 'uni_pc', scheduler: 'simple', denoise: 1 } },
      '10': { class_type: 'VAEDecode', inputs: { samples: ['9', 0], vae: ['3', 0] } },
      '11': { class_type: 'SaveWEBM', inputs: { images: ['10', 0], filename_prefix: o.prefix, codec: 'vp9', fps: P.fps, crf: 18 } },
    };
  }
  const steps = o.fast ? 4 : 20, mid = o.fast ? 2 : 10, cfg = o.fast ? 1 : 3.5;
  const wf: Record<string, unknown> = {
    '1': { class_type: 'UNETLoader', inputs: { unet_name: 'wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors', weight_dtype: 'default' }, _meta: { title: 'high noise' } },
    '2': { class_type: 'UNETLoader', inputs: { unet_name: 'wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors', weight_dtype: 'default' }, _meta: { title: 'low noise' } },
    '3': { class_type: 'CLIPLoader', inputs: { clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', type: 'wan', device: 'default' } },
    '4': { class_type: 'VAELoader', inputs: { vae_name: 'wan_2.1_vae.safetensors' } },
    '5': { class_type: 'ModelSamplingSD3', inputs: { model: [o.fast ? '20' : '1', 0], shift: 5 } },
    '6': { class_type: 'ModelSamplingSD3', inputs: { model: [o.fast ? '21' : '2', 0], shift: 5 } },
    '7': { class_type: 'CLIPTextEncode', inputs: { clip: ['3', 0], text: o.positive }, _meta: { title: 'positive' } },
    '8': { class_type: 'CLIPTextEncode', inputs: { clip: ['3', 0], text: o.negative }, _meta: { title: 'negative' } },
    '9': { class_type: 'LoadImage', inputs: { image: o.image }, _meta: { title: 'MEDSTUDY keyframe' } },
    '10': { class_type: 'WanImageToVideo', inputs: { positive: ['7', 0], negative: ['8', 0], vae: ['4', 0], width: P.w, height: P.h, length: o.frames, batch_size: 1, start_image: ['9', 0] } },
    '11': { class_type: 'KSamplerAdvanced', inputs: { model: ['5', 0], add_noise: 'enable', noise_seed: o.seed, steps, cfg, sampler_name: 'euler', scheduler: 'simple', positive: ['10', 0], negative: ['10', 1], latent_image: ['10', 2], start_at_step: 0, end_at_step: mid, return_with_leftover_noise: 'enable' } },
    '12': { class_type: 'KSamplerAdvanced', inputs: { model: ['6', 0], add_noise: 'disable', noise_seed: o.seed, steps, cfg, sampler_name: 'euler', scheduler: 'simple', positive: ['10', 0], negative: ['10', 1], latent_image: ['11', 0], start_at_step: mid, end_at_step: 10000, return_with_leftover_noise: 'disable' } },
    '13': { class_type: 'VAEDecode', inputs: { samples: ['12', 0], vae: ['4', 0] } },
    '14': { class_type: 'SaveWEBM', inputs: { images: ['13', 0], filename_prefix: o.prefix, codec: 'vp9', fps: P.fps, crf: 18 } },
  };
  if (o.fast) {
    wf['20'] = { class_type: 'LoraLoaderModelOnly', inputs: { model: ['1', 0], lora_name: 'wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors', strength_model: 1 } };
    wf['21'] = { class_type: 'LoraLoaderModelOnly', inputs: { model: ['2', 0], lora_name: 'wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors', strength_model: 1 } };
  }
  return wf;
}

/** stable per-shot seed so a re-run gives the same clip */
export const seedOf = (s: string) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
