/** 2-D helpers for the explanatory inserts of「午前二時の本社ビル」: night blueprint paper, labels, arrows. */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { cached, noise } from '../../../../../engine/story/cine';

export const MINCHO = '"Zen Old Mincho", "Hiragino Mincho ProN", serif';
export const SANS = '"Zen Kaku Gothic New", sans-serif';

/** dark-blue drafting paper with a faint grid (the head office's own blueprints) */
export const blueprint = () => cached('nuc-blueprint', W, H, (c) => {
  const gr = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 900); gr.addColorStop(0, '#16233d'); gr.addColorStop(1, '#0a1020');
  c.fillStyle = gr; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(140,180,240,.07)'; c.lineWidth = 1;
  for (let x = 0; x < W; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y < H; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
});
export function txt(s: string, x: number, y: number, size: number, col: string, a = 1, align: CanvasTextAlign = 'center', font = SANS, weight = 700) {
  if (a <= 0) return; g.save(); g.globalAlpha *= Math.min(1, a); g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = align;
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 6; g.fillText(s, x, y); g.restore();
}
/** a label with a leader line to a point */
export function callout(s: string, x: number, y: number, px: number, py: number, a: number, col = '#ffe2a8', size = 24) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(px, py); g.lineTo(x, y + 6); g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(px, py, 3.5, 0, 7); g.fill(); g.restore();
  txt(s, x, y, size, col, a);
}
export function arrow(x1: number, y1: number, x2: number, y2: number, col: string, p: number, w = 4) {
  if (p <= 0) return; const x = L(x1, x2, Math.min(1, p)), y = L(y1, y2, Math.min(1, p));
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.stroke();
  if (p >= 0.98) { const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 16 * Math.cos(a - 0.45), y2 - 16 * Math.sin(a - 0.45)); g.lineTo(x2 - 16 * Math.cos(a + 0.45), y2 - 16 * Math.sin(a + 0.45)); g.fill(); }
  g.restore();
}
/** soft particles drifting (molecules, dust) */
export function motesAt(t: number, n: number, seed: number, area: [number, number, number, number], col: string, a = 1) {
  for (let i = 0; i < n; i++) {
    const x = area[0] + ((i * 97 + seed * 31) % 1000) / 1000 * area[2] + noise(t * 0.2 + i, seed) * 30;
    const y = area[1] + ((i * 61 + seed * 17) % 1000) / 1000 * area[3] + noise(t * 0.17 + i * 3, seed + 1) * 24;
    g.fillStyle = col; g.globalAlpha = a * (0.3 + 0.7 * Math.abs(Math.sin(t * 0.7 + i))); g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}
/** a dimension line with end ticks and a label */
export function dim(x1: number, y1: number, x2: number, y2: number, label: string, a: number, col = '#bfe0ff') {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 1.6;
  const ang = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(ang) * 8, ny = Math.cos(ang) * 8;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.moveTo(x1 - nx, y1 - ny); g.lineTo(x1 + nx, y1 + ny); g.moveTo(x2 - nx, y2 - ny); g.lineTo(x2 + nx, y2 + ny); g.stroke();
  g.restore();
  txt(label, (x1 + x2) / 2 - Math.sin(ang) * 22, (y1 + y2) / 2 + Math.cos(ang) * 22 + 8, 22, col, a);
}
/** fade-from/to-black helper */
export function dip(t: number, at: number, w = 0.25, k = 0.6) { const a = Math.max(0, 1 - Math.abs(t - at) / w) * k; if (a > 0) { g.fillStyle = `rgba(4,5,8,${a})`; g.fillRect(0, 0, W, H); } }
export { H };
