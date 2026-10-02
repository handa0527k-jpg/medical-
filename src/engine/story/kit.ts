/**
 * Drawing kit for the story anime (hand-drawn, watercolour-like canvas scenes, 1280×720).
 * Scene code imports `g` (the live 2D context) and these helpers; the player binds the context.
 */
export let g: CanvasRenderingContext2D;
export function bindCtx(ctx: CanvasRenderingContext2D) { g = ctx; }

export const W = 1280, H = 720;
export const HAND = '"Klee One", "Zen Kaku Gothic New", sans-serif';
export const L = (a: number, b: number, t: number) => a + (b - a) * t;
export const CL = (t: number) => Math.max(0, Math.min(1, t));
export const EZ = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
/** 0→1 as t goes from a to b */
export const seg = (t: number, a: number, b: number) => CL((t - a) / (b - a));
export const row = (n: number, x0: number, w: number, gap: number) => Array.from({ length: n }, (_, i) => x0 + i * (w + gap));

export function rr(x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function alpha(a: number, f: () => void) { if (a <= 0) return; const k = g.globalAlpha; g.globalAlpha = k * CL(a); f(); g.globalAlpha = k; }

/* ---------- sky & land ---------- */
export function sky(c1: string, c2: string, c3: string) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, c1); gr.addColorStop(0.6, c2); gr.addColorStop(1, c3); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
export function sun(x: number, y: number, r: number, col: string, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 4); gr.addColorStop(0, col); gr.addColorStop(0.25, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.globalAlpha = a * 0.55; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 4, 0, 7); g.fill(); g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.globalAlpha = 1;
}
export function moon(x: number, y: number, r: number) { sun(x, y, r, '#f6f0d6', 0.9); g.fillStyle = 'rgba(200,190,160,.35)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.2, r * 0.22, 0, 7); g.arc(x + r * 0.25, y + r * 0.3, r * 0.15, 0, 7); g.fill(); }
export function stars(t: number, n = 70, a = 1) { for (let i = 0; i < n; i++) { const x = (i * 197) % W, y = (i * 89) % 380, k = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i)); g.fillStyle = `rgba(255,250,225,${k * a})`; g.beginPath(); g.arc(x, y, 1 + (i % 3) * 0.6, 0, 7); g.fill(); } }
export function cloud(x: number, y: number, s: number, col = '#ffffff', a = 0.9) {
  g.globalAlpha = a; g.fillStyle = col;
  [[0, 0, 60], [55, -22, 50], [105, 0, 56], [40, 18, 52], [-45, 12, 40], [150, 16, 36]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); g.fill(); });
  g.globalAlpha = a * 0.5; g.fillStyle = 'rgba(120,140,170,.35)'; g.beginPath(); g.ellipse(x + 50 * s, y + 46 * s, 150 * s, 18 * s, 0, 0, 7); g.fill(); g.globalAlpha = 1;
}
export function clouds(t: number, col = '#ffffff', a = 0.9) { for (let i = 0; i < 5; i++) { const x = ((i * 330 + t * (8 + i * 2)) % 1700) - 260; cloud(x, 90 + (i % 3) * 55, 0.7 + (i % 2) * 0.35, col, a); } }
export function hills(col1: string, col2: string, y: number) {
  g.fillStyle = col1; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 40) g.lineTo(x, y - 40 * Math.sin(x / 260) - 20 * Math.sin(x / 90)); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = col2; g.beginPath(); g.moveTo(0, y + 40); for (let x = 0; x <= W; x += 40) g.lineTo(x, y + 30 - 30 * Math.sin(x / 200 + 1.5)); g.lineTo(W, H); g.lineTo(0, H); g.fill();
}
export function ground(y: number, tint = '#6e5640') {
  const gr = g.createLinearGradient(0, y, 0, H); gr.addColorStop(0, '#7aa35a'); gr.addColorStop(0.12, '#5f8648'); gr.addColorStop(0.14, tint); gr.addColorStop(1, '#3f3024'); g.fillStyle = gr; g.fillRect(0, y, W, H - y);
  g.strokeStyle = 'rgba(255,240,200,.18)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, y + 40 + i * 14); for (let x = 0; x <= W; x += 60) g.lineTo(x, y + 40 + i * 14 + 4 * Math.sin(x / 70 + i)); g.stroke(); }
}
export function grass(y: number, t: number, wind = 1, n = 140, col = '#4f7c3d') {
  g.strokeStyle = col; g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = ((i * 97) % W) + (i % 7), h = 10 + ((i * 13) % 16), sway = Math.sin(t * 1.6 + i * 0.7) * 5 * wind + 4 * wind; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sway * 0.4, y - h * 0.6, x + sway, y - h); g.stroke(); }
}
export function wind(t: number, k = 1, col = 'rgba(255,255,255,.7)') {
  g.strokeStyle = col; g.lineWidth = 2.5; g.lineCap = 'round';
  for (let i = 0; i < 6 * k; i++) { const p = (t * (0.25 + i * 0.03) * k + i * 0.17) % 1; const x = L(-200, W + 200, p), y = 140 + ((i * 83) % 380); g.globalAlpha = Math.sin(p * Math.PI) * 0.8; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 60, y - 18, x + 120, y + 18, x + 190, y - 4); g.stroke(); }
  g.globalAlpha = 1;
}
export function rain(t: number, k = 1) { g.strokeStyle = 'rgba(210,225,240,.55)'; g.lineWidth = 1.6; for (let i = 0; i < 120 * k; i++) { const x = (i * 53 + t * 90) % (W + 100) - 50, y = (i * 71 + t * 900) % (H + 40) - 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y + 22); g.stroke(); } }
export function motes(t: number, n = 26, col = '255,236,170') {
  for (let i = 0; i < n; i++) { const x = (i * 211 + Math.sin(t * 0.4 + i) * 40) % W, y = 120 + ((i * 137) % 460) + Math.sin(t * 0.7 + i * 2) * 12, a = 0.35 + 0.35 * Math.sin(t * 2 + i); g.fillStyle = `rgba(${col},${a})`; g.beginPath(); g.arc(x, y, 2 + (i % 3), 0, 7); g.fill(); }
}
export function water(y: number, t: number, c1 = '#5f9fb8', c2 = '#2d5d74') {
  const gr = g.createLinearGradient(0, y, 0, H); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, y, W, H - y);
  g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { const yy = y + 16 + i * 22; g.beginPath(); for (let x = 0; x <= W; x += 30) g.lineTo(x, yy + 4 * Math.sin(x / 50 + t * 1.5 + i)); g.stroke(); }
}
export function vignette(a = 0.35, warm = false) { const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, warm ? `rgba(80,30,0,${a})` : `rgba(10,20,15,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
/** an indoor room: wall, floor boards and a window of light */
export function room(wall: string, floor: string, t: number, lightA = 0.25) {
  g.fillStyle = wall; g.fillRect(0, 0, W, H); g.fillStyle = floor; g.fillRect(0, 520, W, 200);
  g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; for (let x = -60; x < W; x += 90) { g.beginPath(); g.moveTo(x + 60, 520); g.lineTo(x, H); g.stroke(); }
  g.fillStyle = `rgba(255,244,210,${lightA})`; g.beginPath(); g.moveTo(860, 0); g.lineTo(1060, 0); g.lineTo(820 + Math.sin(t * 0.2) * 6, 720); g.lineTo(520, 720); g.fill();
}

/* ---------- characters ---------- */
export function face(x: number, y: number, s: number, look = 0, happy = true) {
  g.fillStyle = '#2b2622'; g.beginPath(); g.arc(x - 8 * s + look, y, 3.2 * s, 0, 7); g.arc(x + 8 * s + look, y, 3.2 * s, 0, 7); g.fill();
  g.strokeStyle = '#2b2622'; g.lineWidth = 2 * s; g.beginPath();
  if (happy) g.arc(x + look, y + 6 * s, 6 * s, 0.15 * Math.PI, 0.85 * Math.PI); else { g.moveTo(x - 5 * s + look, y + 11 * s); g.lineTo(x + 5 * s + look, y + 11 * s); }
  g.stroke(); g.fillStyle = 'rgba(230,120,120,.45)'; g.beginPath(); g.arc(x - 15 * s + look, y + 6 * s, 4 * s, 0, 7); g.arc(x + 15 * s + look, y + 6 * s, 4 * s, 0, 7); g.fill();
}

export interface ChibiOpt {
  body?: string; line?: string;
  shape?: 'box' | 'round' | 'drop' | 'tall';
  hat?: 'cap' | 'brim' | 'beret' | 'crown' | 'leaf' | 'helmet' | 'band' | 'none';
  hatCol?: string;
  glow?: string;
  happy?: boolean;
  /** bobbing speed; 0 = still */
  bob?: number;
  run?: boolean;
  look?: number;
  /** accessory drawn in body-local coordinates (s = scale) */
  extra?: (s: number) => void;
}
/** A small round-bodied original character. (x, y) = feet. */
export function chibi(x: number, y: number, s: number, t: number, o: ChibiOpt = {}) {
  const bob = o.run ? Math.abs(Math.sin(t * 9)) * 8 * s : Math.sin(t * (o.bob ?? 2)) * 3 * s;
  g.save(); g.translate(x, y - bob);
  g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(0, 4 * s + bob, 26 * s, 6 * s, 0, 0, 7); g.fill();
  if (o.glow) { const gl = g.createRadialGradient(0, -36 * s, 4, 0, -36 * s, 72 * s); gl.addColorStop(0, o.glow); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, -36 * s, 72 * s, 0, 7); g.fill(); }
  g.fillStyle = o.body || '#fbf2e2'; g.strokeStyle = o.line || '#6b5a48'; g.lineWidth = 2.5;
  const shp = o.shape || 'box';
  if (shp === 'round') { g.beginPath(); g.ellipse(0, -32 * s, 30 * s, 32 * s, 0, 0, 7); g.fill(); g.stroke(); }
  else if (shp === 'drop') { g.beginPath(); g.moveTo(0, -74 * s); g.bezierCurveTo(30 * s, -44 * s, 32 * s, 0, 0, 0); g.bezierCurveTo(-32 * s, 0, -30 * s, -44 * s, 0, -74 * s); g.fill(); g.stroke(); }
  else if (shp === 'tall') { rr(-20 * s, -82 * s, 40 * s, 82 * s, 16 * s); g.fill(); g.stroke(); }
  else { rr(-24 * s, -62 * s, 48 * s, 62 * s, 16 * s); g.fill(); g.stroke(); }
  const top = shp === 'tall' ? -82 * s : shp === 'drop' ? -60 * s : shp === 'round' ? -62 * s : -62 * s;
  const hc = o.hatCol || '#6b5a48';
  g.fillStyle = hc;
  switch (o.hat) {
    case 'cap': rr(-26 * s, top - 12 * s, 52 * s, 16 * s, 7 * s); g.fill(); g.fillRect(4 * s, top, 30 * s, 5 * s); break;
    case 'brim': g.beginPath(); g.ellipse(0, top, 32 * s, 8 * s, 0, 0, 7); g.fill(); rr(-16 * s, top - 18 * s, 32 * s, 20 * s, 8 * s); g.fill(); break;
    case 'beret': g.beginPath(); g.ellipse(-4 * s, top - 2 * s, 28 * s, 10 * s, -0.15, 0, 7); g.fill(); break;
    case 'crown': g.beginPath(); g.moveTo(-18 * s, top + 2 * s); g.lineTo(-18 * s, top - 14 * s); g.lineTo(-9 * s, top - 6 * s); g.lineTo(0, top - 18 * s); g.lineTo(9 * s, top - 6 * s); g.lineTo(18 * s, top - 14 * s); g.lineTo(18 * s, top + 2 * s); g.fill(); break;
    case 'leaf': g.fillStyle = '#6f9a4f'; g.beginPath(); g.ellipse(-8 * s, top - 6 * s, 20 * s, 8 * s, -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(12 * s, top - 4 * s, 12 * s, 6 * s, 0.4, 0, 7); g.fill(); break;
    case 'helmet': g.beginPath(); g.arc(0, top + 6 * s, 27 * s, Math.PI, 0); g.fill(); break;
    case 'band': g.fillRect(-25 * s, top + 10 * s, 50 * s, 7 * s); break;
    default: break;
  }
  const fy = shp === 'tall' ? -54 * s : shp === 'drop' ? -26 * s : shp === 'round' ? -34 * s : -36 * s;
  face(0, fy, s * 0.9, o.look ?? (o.run ? 4 * s : Math.sin(t) * 2 * s), o.happy ?? true);
  o.extra?.(s);
  g.restore();
}

/* ---------- labels ---------- */
/** corner label for a scene ("structure ＝ analogy"); fades out after ~10 s */
export function label(text: string, t: number, col: string) {
  const a = CL(t * 2) * (1 - seg(t, 9, 10)); if (a <= 0) return;
  g.globalAlpha = a; g.font = `600 28px ${HAND}`; const w = g.measureText(text).width + 44;
  g.fillStyle = 'rgba(255,252,242,.9)'; rr(36, 30, w, 54, 27); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(62, 57, 9, 0, 7); g.fill(); g.fillStyle = '#2b2622'; g.fillText(text, 80, 66); g.globalAlpha = 1;
}
export function nameTag(text: string, x: number, y: number, col: string, a = 1) {
  if (a <= 0) return; g.globalAlpha = CL(a); g.font = `600 22px ${HAND}`; const w = g.measureText(text).width + 26;
  g.fillStyle = 'rgba(255,252,242,.92)'; rr(x - w / 2, y - 18, w, 34, 17); g.fill(); g.strokeStyle = col; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = '#2b2622'; g.textAlign = 'center'; g.fillText(text, x, y + 7); g.textAlign = 'left'; g.globalAlpha = 1;
}
/** handwritten text */
export function hand(text: string, x: number, y: number, size: number, col: string, a = 1, align: CanvasTextAlign = 'left') {
  if (a <= 0) return; g.globalAlpha = CL(a); g.font = `600 ${size}px ${HAND}`; g.fillStyle = col; g.textAlign = align; g.fillText(text, x, y); g.textAlign = 'left'; g.globalAlpha = 1;
}
/** closing title card */
export function endCard(title: string, t: number, at: number) {
  const a = seg(t, at, at + 4); if (a <= 0) return;
  g.globalAlpha = a; g.fillStyle = 'rgba(255,248,232,.92)'; rr(340, 130, 600, 124, 24); g.fill();
  g.fillStyle = '#3a2a1e'; g.textAlign = 'center'; g.font = `600 44px ${HAND}`; g.fillText(title, 640, 196); g.font = `500 22px ${HAND}`; g.fillText('おわり', 640, 234); g.textAlign = 'left'; g.globalAlpha = 1;
}
/** opening title card (first seconds of the first scene) */
export function titleCard(title: string, sub: string, t: number) {
  const a = seg(t, 0.3, 1.5) * (1 - seg(t, 6, 8)); if (a <= 0) return;
  g.globalAlpha = a; g.fillStyle = 'rgba(20,18,16,.5)'; g.fillRect(0, 250, W, 170);
  g.fillStyle = '#fff8e8'; g.textAlign = 'center'; g.font = `600 54px ${HAND}`; g.fillText(title, 640, 330); g.font = `500 22px ${HAND}`; g.fillStyle = '#f2dcb8'; g.fillText(sub, 640, 378); g.textAlign = 'left'; g.globalAlpha = 1;
}
/** a glowing bead (small molecules, signals) */
export function bead(x: number, y: number, r: number, col: string, glow = '#ffe08a') { g.save(); g.shadowColor = glow; g.shadowBlur = r * 3; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); }
export function arrow(x1: number, y1: number, x2: number, y2: number, col: string, w = 4) {
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 16 * Math.cos(a - 0.4), y2 - 16 * Math.sin(a - 0.4)); g.lineTo(x2 - 16 * Math.cos(a + 0.4), y2 - 16 * Math.sin(a + 0.4)); g.fill();
}
