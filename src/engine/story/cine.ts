/**
 * Cinematic helpers for story scenes: easing with anticipation and overshoot, seeded noise,
 * cached offscreen paintings, light (shafts, bloom), depth blur, dust, rain, film grain and grading.
 * Everything is a pure function of the scene time, so any playback position redraws the same frame.
 * Draws into the kit's bound context `g`. Only scenes that import this module use it.
 */
import { bindCtx, CL, g, H, L, W } from './kit';

/* ---------- timing ---------- */
export const ease = {
  inOut: (t: number) => { t = CL(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  out: (t: number) => 1 - Math.pow(1 - CL(t), 3),
  in: (t: number) => Math.pow(CL(t), 3),
  /** ends past the target and settles back (follow-through) */
  back: (t: number, s = 1.6) => { t = CL(t) - 1; return t * t * ((s + 1) * t + s) + 1; },
  /** pulls back first, then moves (anticipation) and settles with a little overshoot */
  antic: (t: number, s = 1.4) => { t = CL(t); const c = s * 1.525; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2 : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2; },
  /** damped spring settle 0→1 */
  settle: (t: number, k = 6, f = 2.2) => { t = Math.max(0, t); return 1 - Math.exp(-k * t) * Math.cos(f * Math.PI * t); },
};
/** 0→1 between a and b, eased */
export const span = (t: number, a: number, b: number, e: (x: number) => number = ease.inOut) => e(CL((t - a) / (b - a)));

/* ---------- seeded randomness ---------- */
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** smooth 1-D value noise in [-1, 1] */
export function noise(t: number, seed = 0) { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return L(hash(i + seed * 57), hash(i + 1 + seed * 57), u) * 2 - 1; }
/** gentle handheld drift (px) */
export const handheld = (t: number, amp: number, seed = 0): [number, number, number] => [noise(t * 0.7, seed) * amp, noise(t * 0.6, seed + 9) * amp * 0.7, noise(t * 0.4, seed + 3) * amp * 0.0006];

/* ---------- offscreen paintings (static layers painted once) ---------- */
const store = new Map<string, HTMLCanvasElement>();
export function cached(key: string, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let cv = store.get(key);
  if (!cv) { cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d')!; paint(c); store.set(key, cv); }
  return cv;
}

/* ---------- camera ---------- */
export interface Cam { x: number; y: number; z: number; r?: number }
/** draw world content so that world point (cam.x, cam.y) sits at the centre, zoomed by cam.z; depth < 1 moves less (parallax) */
export function shot(cam: Cam, depth: number, fn: () => void) {
  g.save();
  const z = 1 + (cam.z - 1) * depth;
  g.translate(W / 2, H / 2); g.rotate((cam.r || 0) * depth); g.scale(z, z);
  g.translate(-(W / 2 + (cam.x - W / 2) * depth), -(H / 2 + (cam.y - H / 2) * depth));
  fn();
  g.restore();
}

/* ---------- light ---------- */
/** a soft beam of light from (x1, y1, width w1) to (x2, y2, width w2) */
export function shaft(x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, col: string, a: number) {
  if (a <= 0) return;
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = CL(a);
  const gr = g.createLinearGradient(x1, y1, x2, y2); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x1 - w1 / 2, y1); g.lineTo(x1 + w1 / 2, y1); g.lineTo(x2 + w2 / 2, y2); g.lineTo(x2 - w2 / 2, y2); g.closePath(); g.fill();
  g.restore();
}
export function glow(x: number, y: number, r: number, col: string, a = 1, mode: GlobalCompositeOperation = 'screen') {
  if (a <= 0) return;
  g.save(); g.globalCompositeOperation = mode; g.globalAlpha = CL(a);
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
/** shade a region with a colour using multiply (shadows) */
export function shade(fn: () => void, col: string, a: number) { g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = CL(a); g.fillStyle = col; fn(); g.restore(); }

/**
 * Draw with a depth-of-field blur: the content is painted at reduced resolution into a scratch canvas
 * and scaled back up with smoothing. Cheap, the same in every browser (no canvas `filter` needed),
 * and deterministic. Assumes the target canvas is W×H with no device-pixel scaling.
 */
const scratch: HTMLCanvasElement[] = [];
let nest = 0;
export function blurred(px: number, fn: () => void) {
  if (px < 0.6 || typeof document === 'undefined') return fn();
  const k = 1 + px * 0.55;
  const w = Math.ceil(W / k), h = Math.ceil(H / k);
  const cv = (scratch[nest] ??= document.createElement('canvas'));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const c = cv.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
  const outer = g, m = outer.getTransform();
  c.setTransform(m.a / k, m.b / k, m.c / k, m.d / k, m.e / k, m.f / k);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  nest++; bindCtx(c);
  try { fn(); } finally { bindCtx(outer); nest--; }
  outer.save(); outer.setTransform(1, 0, 0, 1, 0, 0); outer.imageSmoothingEnabled = true; outer.imageSmoothingQuality = 'high';
  outer.drawImage(cv, 0, 0, w, h, 0, 0, w * k, h * k); outer.restore();
}

/* ---------- atmosphere ---------- */
/** dust motes drifting inside a box; brighter where `lit(x, y)` returns more */
export function dust(t: number, box: [number, number, number, number], n: number, seed: number, lit: (x: number, y: number) => number, size = 1.6) {
  const r = rng(seed);
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), sp = 0.15 + r() * 0.5, ph = r() * 50, s = size * (0.5 + r());
    const x = box[0] + ((bx * box[2] + noise(t * 0.08 * sp + ph, i) * 60 + t * 6 * sp) % box[2] + box[2]) % box[2];
    const y = box[1] + ((by * box[3] + t * 9 * sp + noise(t * 0.1 + ph, i + 7) * 30) % box[3] + box[3]) % box[3];
    const a = lit(x, y) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.3 + ph)));
    if (a < 0.02) continue;
    g.globalAlpha = CL(a); g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
  }
  g.restore();
}
/** rain streaks; depth 0 (far, thin, slow) → 1 (near, long, fast) */
export function rainfall(t: number, depth: number, n: number, seed: number, col = 'rgba(190,210,235,') {
  const r = rng(seed);
  const len = L(10, 46, depth), sp = L(500, 1500, depth), lw = L(0.7, 2.2, depth), a = L(0.25, 0.5, depth);
  g.save(); g.strokeStyle = col + a + ')'; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i < n; i++) {
    const x0 = r() * (W + 200) - 100, y0 = r() * (H + 200), off = r() * 1000;
    const y = ((y0 + (t * sp + off)) % (H + 120)) - 60, x = x0 - (y / H) * 70 * depth;
    g.moveTo(x, y); g.lineTo(x - len * 0.18, y + len);
  }
  g.stroke(); g.restore();
}
/** concentric ripples on a wet floor */
export function ripples(t: number, box: [number, number, number, number], n: number, seed: number) {
  const r = rng(seed);
  g.save(); g.strokeStyle = 'rgba(200,220,240,.35)'; g.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * box[2], y = box[1] + r() * box[3], ph = r(), p = (t * 0.9 + ph) % 1;
    g.globalAlpha = (1 - p) * 0.7; g.beginPath(); g.ellipse(x, y, 2 + p * 16, (2 + p * 16) * 0.28, 0, 0, 7); g.stroke();
  }
  g.restore();
}

/* ---------- film finish ---------- */
let grainTile: HTMLCanvasElement | null = null;
/** subtle animated film grain (24 changes per second) */
export function grain(t: number, a = 0.06) {
  grainTile ??= cached('grain', 256, 256, (c) => { const r = rng(7); const im = c.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const v = 110 + r() * 145; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } c.putImageData(im, 0, 0); });
  const f = Math.floor(t * 24), ox = (f * 97) % 256, oy = (f * 61) % 256;
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'overlay';
  for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) g.drawImage(grainTile, x, y);
  g.restore();
}
/** colour grade: lift shadows toward a cool tone, warm the highlights, darken the edges */
export function grade(cool = 'rgba(30,50,80,', warm = 'rgba(255,190,120,', k = 1) {
  g.save();
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = cool + 0.35 * k + ')'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.45, W * 0.75);
  gr.addColorStop(0, warm + 0.18 * k + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'multiply';
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 1.0);
  v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(1, `rgba(40,40,52,${1 - 0.55 * k})`);
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  g.restore();
}
/** letterbox bars (0..1 = how far they are in) */
export function letterbox(k: number, h = 46) { if (k <= 0) return; g.fillStyle = '#000'; g.fillRect(0, 0, W, h * k); g.fillRect(0, H - h * k, W, h * k); }
/** cross-fade a colour over the frame (flash / dip) */
export function wash(col: string, a: number, mode: GlobalCompositeOperation = 'source-over') { if (a <= 0) return; g.save(); g.globalCompositeOperation = mode; g.globalAlpha = CL(a); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }
