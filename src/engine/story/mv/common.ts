/**
 * Opening / ending music videos for the story anime — shared toolkit.
 *
 * - The songs (魔王魂, free with credit) are analysed offline (production/opening-ending): bar lines,
 *   strong percussive hits and the song sections are in music.json, so every cut lands on the music.
 * - Characters are simplified to coloured silhouettes driven by motion capture (CMU) so that they move
 *   exactly like people do; the story's own frames are reused as "flashback" stills.
 */
import { CL, L, W, H, bindCtx, g } from '../kit';
import type { SceneDraw, StoryDef } from '../types';
import type { StoryTimeline } from '../timeline';
import { J, camera, type Camera, type Pose3, type V3 } from '../mocap';
import music from './music.json';

export const MUSIC = music as unknown as { op: Song; ed: Song };
export interface Song { file: string; title: string; len: number; end: number; bars: number[]; hits: [number, number][]; sec: Record<string, number> }

export interface MvCtx { def: StoryDef; draw: Record<string, SceneDraw>; tl: StoryTimeline; key: string }

export const GOTHIC = '"Zen Kaku Gothic New", "Hiragino Sans", sans-serif';
export const MINCHO = '"Zen Old Mincho", "Hiragino Mincho ProN", serif';
export const HAND = '"Klee One", "Zen Kaku Gothic New", sans-serif';

/* ---------- music ---------- */
/** index of the bar containing t, and the phase 0..1 inside it */
export function barAt(s: Song, t: number): [number, number] {
  const b = s.bars; let i = 0; while (i + 1 < b.length && b[i + 1] <= t) i++;
  const len = (b[i + 1] ?? b[i] + (b[1] - b[0])) - b[i];
  return [i, CL((t - b[i]) / len)];
}
/** time of bar n (extrapolated past the analysed range) */
export function bar(s: Song, n: number) { const b = s.bars, d = b[1] - b[0]; return n < b.length ? b[Math.max(0, n)] : b[b.length - 1] + (n - b.length + 1) * d; }
/** index of the bar line nearest to t */
export function barNear(s: Song, t: number) { const [i, ph] = barAt(s, t); return ph > 0.5 ? i + 1 : i; }
/** split the bars between section times a and b into n shots; the shot containing t, with its bar-aligned start and end */
export function shot(s: Song, a: number, b: number, n: number, t: number) {
  const b0 = barNear(s, a), b1 = barNear(s, b), edge = (k: number) => bar(s, b0 + Math.round((k * (b1 - b0)) / n));
  let i = 0; while (i + 1 < n && edge(i + 1) <= t) i++;
  const t0 = edge(i), t1 = edge(i + 1);
  return { i, t0, t1, u: t - t0, len: t1 - t0 };
}
/** the song's section times moved onto their nearest bar lines (the song's own end stays as analysed) */
export function sections(s: Song): Record<string, number> { return Object.fromEntries(Object.entries(s.sec).map(([k, v]) => [k, k === 'end' || k === 'intro' ? v : bar(s, barNear(s, v))])); }
/** the nearest strong hit to t (within ±0.35 s), else t */
export function snap(s: Song, t: number) { let best = t, bd = 0.35; for (const [h] of s.hits) { const d = Math.abs(h - t); if (d < bd) { bd = d; best = h; } } return best; }
/** 1 at a strong hit, decaying quickly (for little pulses on the beat) */
export function pulse(s: Song, t: number, decay = 7) { let p = 0; for (const [h, st] of s.hits) { if (h > t) break; const k = Math.exp(-(t - h) * decay) * Math.min(1, st / 4); if (k > p) p = k; } return p; }

/* ---------- easing ---------- */
export const ease = {
  out: (x: number) => 1 - Math.pow(1 - CL(x), 3),
  inOut: (x: number) => { x = CL(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  back: (x: number) => { x = CL(x) - 1; return x * x * (2.70158 * x + 1.70158) + 1; },
};
export const span = (t: number, a: number, b: number, e: (x: number) => number = ease.inOut) => e(CL((t - a) / (b - a || 1e-6)));

/* ---------- stills from the film ---------- */
const stills = new Map<string, HTMLCanvasElement>();
/** a frame of scene `id` at fraction `at` of the scene, painted once into an offscreen canvas */
export function still(c: MvCtx, id: string, at = 0.3): HTMLCanvasElement {
  const k = `${c.key}:${id}:${at}`;
  let cv = stills.get(k);
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const main = g;
  bindCtx(ctx);
  try { const d = c.tl.end[id] - c.tl.start[id]; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); c.draw[id]?.(d * at, d); } catch { /* a broken still stays black */ }
  bindCtx(main);
  stills.set(k, cv);
  return cv;
}

/* ---------- text ---------- */
export function text(s: string, x: number, y: number, size: number, col: string, a = 1, align: CanvasTextAlign = 'center', font = GOTHIC, weight = 800, stroke?: string) {
  if (a <= 0 || !s) return;
  g.save(); g.globalAlpha *= CL(a); g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.textBaseline = 'alphabetic';
  if (stroke) { g.lineJoin = 'round'; g.strokeStyle = stroke; g.lineWidth = Math.max(3, size * 0.16); g.strokeText(s, x, y); }
  g.fillStyle = col; g.fillText(s, x, y); g.restore();
}
/** text revealed character by character (p 0..1) */
export function typed(s: string, x: number, y: number, size: number, col: string, p: number, align: CanvasTextAlign = 'center', font = GOTHIC, stroke?: string) {
  const n = Math.round(CL(p) * [...s].length); text([...s].slice(0, n).join(''), x, y, size, col, 1, align, font, 800, stroke);
}
/** wrap Japanese text to lines of at most `max` characters, breaking after punctuation when possible */
export function wrap(s: string, max: number): string[] {
  const out: string[] = []; let cur = '';
  for (const ch of [...s]) { cur += ch; if ([...cur].length >= max || (/[。、）」]/.test(ch) && [...cur].length > max * 0.7)) { out.push(cur); cur = ''; } }
  if (cur) { if (out.length && [...cur].length <= 2) out[out.length - 1] += cur; else out.push(cur); } // no orphaned 「）」
  return out;
}
export const plain = (html: string) => html.replace(/<[^>]+>/g, '');

/* ---------- colour ---------- */
export function hex(c: string, a = 1) { const m = /^#?([0-9a-f]{6})$/i.exec(c); if (!m) return c; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
export function mixHex(a: string, b: string, k: number) {
  const p = (h: string) => { const n = parseInt(h.replace('#', ''), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const A = p(a), B = p(b); return `rgb(${A.map((x, i) => Math.round(L(x, B[i], k))).join(',')})`;
}

/* ---------- silhouettes (simplified people, motion-captured movement) ---------- */
/**
 * A person as a flat silhouette: tapered limbs and torso from the 23 captured joints, a round head.
 * No face is drawn, so the figure reads clearly at any size and only the (natural) movement speaks.
 * `rim` adds a light edge on the side of the key light.
 */
export function silhouette(cam: Camera, pose: Pose3, col: string, o: { rim?: string; rimSide?: number; scale?: number; accent?: string } = {}) {
  const P = pose.p.map((q) => cam.proj(q));
  const q = (n: keyof typeof J) => P[J[n]];
  const sc = q('pelvis').s;
  const limb = (a: { x: number; y: number }, b: { x: number; y: number }, ra: number, rb: number, c = col) => {
    const ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2, cs = Math.cos(ang), sn = Math.sin(ang);
    const wa = ra * sc, wb = rb * sc;
    g.fillStyle = c; g.beginPath();
    g.moveTo(a.x + cs * wa, a.y + sn * wa); g.lineTo(b.x + cs * wb, b.y + sn * wb);
    g.arc(b.x, b.y, wb, ang, ang + Math.PI, true); g.lineTo(a.x - cs * wa, a.y - sn * wa);
    g.arc(a.x, a.y, wa, ang + Math.PI, ang + 2 * Math.PI, true); g.closePath(); g.fill();
  };
  // far limbs a touch darker so the body reads in depth
  const farL = q('hipL').d > q('hipR').d;
  const dark = mixHex(col.startsWith('#') ? col : '#333333', '#000000', 0.22);
  const leg = (s: 'L' | 'R', c: string) => { limb(q(`hip${s}`), q(`knee${s}`), 0.075, 0.058, c); limb(q(`knee${s}`), q(`ankle${s}`), 0.056, 0.042, c); limb(q(`ankle${s}`), q(`toe${s}`), 0.04, 0.03, c); };
  const arm = (s: 'L' | 'R', c: string) => { limb(q(`shoulder${s}`), q(`elbow${s}`), 0.048, 0.04, c); limb(q(`elbow${s}`), q(`wrist${s}`), 0.04, 0.032, c); limb(q(`wrist${s}`), q(`hand${s}`), 0.034, 0.03, c); };
  const far: 'L' | 'R' = farL ? 'L' : 'R', near: 'L' | 'R' = farL ? 'R' : 'L';
  leg(far, dark); arm(far, dark);
  // torso: pelvis → chest → neck, with shoulder and hip width
  const hipW = Math.hypot(q('hipL').x - q('hipR').x, q('hipL').y - q('hipR').y);
  g.fillStyle = col; g.beginPath();
  g.moveTo(q('shoulderL').x, q('shoulderL').y); g.lineTo(q('shoulderR').x, q('shoulderR').y);
  g.lineTo(q('hipR').x, q('hipR').y); g.lineTo(q('hipL').x, q('hipL').y); g.closePath(); g.fill();
  limb(q('pelvis'), q('chest'), 0.13, 0.15); limb(q('chest'), q('neck'), 0.15, 0.06);
  void hipW;
  leg(near, col);
  limb(q('neck'), q('neck2'), 0.045, 0.045);
  // head
  const hc = q('head'), nk = q('neck2');
  const hx = (hc.x + nk.x) / 2, hy = (hc.y + nk.y) / 2 - 0.02 * sc, hr = 0.115 * sc;
  g.fillStyle = col; g.beginPath(); g.ellipse(hx, hy, hr * 0.92, hr, Math.atan2(hc.x - nk.x, nk.y - hc.y), 0, 7); g.fill();
  arm(near, col);
  if (o.accent) { // a scarf / sash band at the neck in the character's accent colour
    g.strokeStyle = o.accent; g.lineWidth = 0.05 * sc; g.lineCap = 'round'; g.beginPath(); g.moveTo(q('shoulderL').x, q('shoulderL').y - 0.02 * sc); g.lineTo(q('shoulderR').x, q('shoulderR').y - 0.02 * sc); g.stroke();
  }
  if (o.rim) {
    const side = o.rimSide ?? -1;
    g.save(); g.globalCompositeOperation = 'source-atop'; g.strokeStyle = o.rim; g.lineWidth = 0.02 * sc;
    g.beginPath(); g.ellipse(hx + side * hr * 0.15, hy, hr * 0.9, hr, 0, side < 0 ? Math.PI * 0.6 : -Math.PI * 0.4, side < 0 ? Math.PI * 1.4 : Math.PI * 0.4); g.stroke(); g.restore();
  }
  // contact shadow
  // contact shadow on the floor (y = 0) under the body: it stays on the ground and shrinks when the person leaves it
  const pv = pose.p[J.pelvis], fl = cam.proj([pv[0], 0, pv[2]] as V3), lift = Math.max(0, Math.min(pose.p[J.ankleL][1], pose.p[J.ankleR][1]) - 0.08);
  const ks = 1 / (1 + lift * 3);
  g.fillStyle = `rgba(0,0,0,${0.2 * ks})`; g.beginPath(); g.ellipse(fl.x, fl.y + 0.02 * fl.s, 0.3 * fl.s * ks, 0.05 * fl.s * ks, 0, 0, 7); g.fill();
}
/** a side-on camera looking at a strip of floor: x across the screen, figures stand on y = 0 */
export const sideCam = (x: number, h = 1.0, dist = 6, f = 620, z = 0) => camera({ x, y: h, z: z + dist, tx: x, ty: h - 0.05, tz: z, f });
export type { V3 };
