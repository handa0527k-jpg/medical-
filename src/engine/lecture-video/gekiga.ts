/**
 * 劇画 effects, drawn in screen space over the picture: 集中線 (focus lines), スピード線, 衝撃, 擬音,
 * 白黒反転, スクリーントーン, and the camera (push / crash zoom / whip pan / pull back / hold / shake).
 * They change how hard the film hits — never the figures (those are identical in every intensity).
 */
import type { CamMove, Intensity, TimedScene } from './types';
import { at } from './timing';
import { FONTS } from './pen';

export const W = 1280, H = 720;
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const CL = (x: number) => Math.max(0, Math.min(1, x));
export const ease = {
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outExpo: (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  back: (x: number) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};

/* ---------- camera ---------- */
export interface CamState { x: number; y: number; z: number; rot: number }
interface Resolved { t: number; d: number; m: CamMove; hold: number; rot: number; z: number; e: (x: number) => number }
function resolve(moves: CamMove[], ts: TimedScene, k: Intensity): Resolved[] {
  let flip = 1;
  return moves.map((m) => {
    let d = m.dur ?? 0, hold = m.hold ?? 0, z = m.z, rot = m.rot ?? 0, e = ease.inOut;
    if (m.move === 'crash' || m.move === 'whip') e = ease.outExpo;
    if (m.move === 'pull') e = ease.outCubic;
    if (k === 'standard') {
      if (m.move === 'crash') { d = Math.max(0.7, d * 3.2); e = ease.inOut; z = 1 + (z - 1) * 0.7; }
      if (m.move === 'whip') { d = Math.max(0.5, d * 2.6); e = ease.inOut; }
      if (m.move === 'pull') d = Math.max(0.6, d * 2);
      hold = 0;
    } else if (k === 'ultra') {
      z = m.move === 'set' ? z : 1 + (z - 1) * 1.15;
      if (m.move === 'crash') { rot = (flip *= -1) * 0.055; hold *= 1.3; }
      if (m.move === 'whip') rot = (flip *= -1) * 0.03;
    }
    return { t: at(ts, m.at), d, m, hold, rot, z, e };
  }).sort((a, b) => a.t - b.t);
}
function stateAt(rs: Resolved[], t: number, upto = rs.length): CamState {
  let s: CamState = { x: W / 2, y: H / 2, z: 1, rot: 0 };
  for (let i = 0; i < upto; i++) {
    const r = rs[i];
    if (r.t > t) break;
    const target = { x: r.m.x, y: r.m.y, z: r.z, rot: r.rot };
    if (r.m.move === 'set' || r.d <= 0) { s = target; continue; }
    const from = stateAt(rs, r.t, i);
    const k = r.e(CL((t - r.t) / r.d));
    s = { x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k, z: from.z + (target.z - from.z) * k, rot: from.rot + (target.rot - from.rot) * k };
  }
  return s;
}
export function camera(moves: CamMove[], ts: TimedScene, t: number, k: Intensity) {
  const rs = resolve(moves, ts, k);
  const holds = rs.filter((r) => r.hold > 0).map((r) => [r.t + r.d, r.t + r.d + r.hold] as const);
  const h = holds.find(([a, b]) => t >= a && t < b);
  return { cam: stateAt(rs, h ? h[0] : t), frozen: h ? h[0] : null };
}
export function applyCam(g: CanvasRenderingContext2D, c: CamState, shake: [number, number]) {
  g.translate(W / 2 + shake[0], H / 2 + shake[1]); g.rotate(c.rot); g.scale(c.z, c.z); g.translate(-c.x, -c.y);
}
export function shakeAt(t: number, wins: { t: number; d: number }[], k: Intensity): [number, number] {
  const amp = k === 'ultra' ? 16 : k === 'gekiga' ? 9 : 0;
  let x = 0, y = 0;
  for (const w of wins) {
    const u = (t - w.t) / w.d; if (u < 0 || u > 1) continue;
    const a = amp * (1 - u) * (1 - u), f = Math.floor(t * 60);
    x += (rnd(f) - 0.5) * 2 * a; y += (rnd(f + 99) - 0.5) * 2 * a;
  }
  return [x, y];
}

/* ---------- lines ---------- */
/** 集中線: wedges from the frame edge toward (cx, cy), leaving a clear centre; jitters every 2 frames */
export function focusLines(g: CanvasRenderingContext2D, cx: number, cy: number, a: number, density: number, t: number, col = '#000') {
  if (a <= 0) return;
  const f = Math.floor(t * 12), n = Math.round(90 * density), R = 1500;
  g.save(); g.globalAlpha *= CL(a); g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + (rnd(i + f * 7) - 0.5) * 0.05;
    const inner = 220 + rnd(i * 3 + f) * 170, w = 0.004 + rnd(i * 5 + f) * 0.012;
    g.beginPath();
    g.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
    g.lineTo(cx + Math.cos(ang - w) * R, cy + Math.sin(ang - w) * R);
    g.lineTo(cx + Math.cos(ang + w) * R, cy + Math.sin(ang + w) * R);
    g.fill();
  }
  g.restore();
}
/** horizontal speed lines (a whip pan) */
export function speedLines(g: CanvasRenderingContext2D, a: number, t: number, col = 'rgba(255,255,255,0.85)') {
  if (a <= 0) return;
  const f = Math.floor(t * 24);
  g.save(); g.globalAlpha *= CL(a); g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const y = rnd(i + f * 3) * H, len = 200 + rnd(i * 7 + f) * 600, x = rnd(i * 11 + f) * (W + len) - len;
    g.lineWidth = 1 + rnd(i * 13) * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
  g.restore();
}
/** 衝撃: a white burst with black spikes */
export function impact(g: CanvasRenderingContext2D, cx: number, cy: number, u: number, k: Intensity) {
  if (u < 0 || u > 1) return;
  const s = k === 'ultra' ? 1.3 : 1;
  g.save();
  g.globalAlpha = (1 - u) * 0.9;
  const r = (80 + 700 * ease.outExpo(u)) * s;
  g.strokeStyle = '#fff'; g.lineWidth = 26 * (1 - u) + 2; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#000';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + rnd(i) * 0.2, r0 = r * 0.55, r1 = r * (1.1 + rnd(i * 3) * 0.4);
    g.beginPath(); g.moveTo(cx + Math.cos(a - 0.03) * r0, cy + Math.sin(a - 0.03) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a + 0.03) * r0, cy + Math.sin(a + 0.03) * r0); g.fill();
  }
  g.restore();
}
/** 擬音: hand-lettered sound word — thick black edge, white body, popped in and trembling */
export function onoma(g: CanvasRenderingContext2D, text: string, x: number, y: number, u: number, k: Intensity) {
  if (u < 0 || u > 1) return;
  const size = (k === 'ultra' ? 150 : 118) * (1 + 0.5 * (1 - ease.back(CL(u * 5))));
  const a = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25;
  const jit = (rnd(Math.floor(u * 40)) - 0.5) * (k === 'ultra' ? 8 : 4);
  g.save(); g.globalAlpha *= CL(a); g.translate(x + jit, y - jit); g.rotate(-0.16); g.transform(1, 0, -0.18, 1, 0, 0);
  g.font = `400 ${size}px ${FONTS.impact}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = '#000'; g.lineWidth = size * 0.26; g.strokeText(text, 0, 0);
  g.strokeStyle = '#fff'; g.lineWidth = size * 0.1; g.strokeText(text, 0, 0);
  g.fillStyle = '#111'; g.fillText(text, 0, 0);
  g.restore();
}
/** スクリーントーン: halftone dots that gather toward the edges and the bottom (cached), plus an ink vignette */
let toneCv: HTMLCanvasElement | null = null;
export function tone(g: CanvasRenderingContext2D, a: number) {
  if (a <= 0) return;
  if (!toneCv) {
    toneCv = document.createElement('canvas'); toneCv.width = W; toneCv.height = H;
    const x = toneCv.getContext('2d')!;
    for (let yy = 0; yy < H; yy += 7) for (let xx = (yy / 7) % 2 ? 3.5 : 0; xx < W; xx += 7) {
      const dx = (xx - W / 2) / (W / 2), dy = (yy - H * 0.42) / (H / 2), r = Math.min(1, Math.hypot(dx * 0.9, dy));
      const rad = Math.max(0, (r - 0.45) * 3.4);
      if (rad > 0.2) { x.fillStyle = '#000'; x.beginPath(); x.arc(xx, yy, Math.min(3.2, rad), 0, Math.PI * 2); x.fill(); }
    }
  }
  g.save(); g.globalAlpha = a * 0.55; g.drawImage(toneCv, 0, 0);
  const m = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H / 2, W * 0.72);
  m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,0.85)');
  g.globalAlpha = a; g.fillStyle = m; g.fillRect(0, 0, W, H); g.restore();
}
export function flash(g: CanvasRenderingContext2D, a: number, col = '#fff') { if (a <= 0) return; g.save(); g.globalAlpha = CL(a); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }
export function invert(g: CanvasRenderingContext2D) { g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); }
export function grain(g: CanvasRenderingContext2D, t: number, a: number) {
  if (a <= 0) return;
  const f = Math.floor(t * 24);
  g.save(); g.globalAlpha = a;
  for (let i = 0; i < 260; i++) { g.fillStyle = rnd(i + f) > 0.5 ? '#fff' : '#000'; g.fillRect(rnd(i * 3 + f) * W, rnd(i * 7 + f) * H, 1.5, 1.5); }
  g.restore();
}
