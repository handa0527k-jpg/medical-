/**
 * Light and darkness over a finished frame: a darkness layer with holes cut by light sources (laptop
 * screen, flashlight, emergency exit sign, city glow), a coloured glow pass, flashlight cones, and
 * fluorescent ceiling panels that can flicker.
 */
import { g, W, H } from './kit';

let mask: HTMLCanvasElement | null = null;
const mctx = () => { if (!mask) { mask = document.createElement('canvas'); mask.width = W; mask.height = H; } return mask.getContext('2d')!; };

export interface Lamp { x: number; y: number; r: number; k: number; col?: string; /** squash vertically */ sy?: number }
export interface Beam { x: number; y: number; ang: number; spread: number; len: number; k: number; spot?: { x: number; y: number; rx: number; ry: number } }

/** darken everything by `level` (0..1) except where lamps and beams light it */
export function darkness(level: number, lamps: Lamp[], beams: Beam[] = [], tint = '5,8,18') {
  if (level <= 0) return;
  const m = mctx();
  m.globalCompositeOperation = 'source-over'; m.clearRect(0, 0, W, H);
  m.fillStyle = `rgba(${tint},${level})`; m.fillRect(0, 0, W, H);
  m.globalCompositeOperation = 'destination-out';
  for (const l of lamps) {
    if (l.k <= 0) continue;
    m.save(); m.translate(l.x, l.y); m.scale(1, l.sy ?? 1);
    const gr = m.createRadialGradient(0, 0, 0, 0, 0, l.r); gr.addColorStop(0, `rgba(0,0,0,${l.k})`); gr.addColorStop(0.45, `rgba(0,0,0,${l.k * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = gr; m.beginPath(); m.arc(0, 0, l.r, 0, 7); m.fill(); m.restore();
  }
  for (const b of beams) {
    if (b.k <= 0) continue;
    m.save(); m.translate(b.x, b.y); m.rotate(b.ang);
    const gr = m.createLinearGradient(0, 0, b.len, 0); gr.addColorStop(0, `rgba(0,0,0,${b.k * 0.9})`); gr.addColorStop(1, `rgba(0,0,0,${b.k * 0.25})`);
    m.fillStyle = gr; m.beginPath(); m.moveTo(0, -4); m.lineTo(b.len, -b.len * Math.tan(b.spread)); m.lineTo(b.len, b.len * Math.tan(b.spread)); m.lineTo(0, 4); m.closePath(); m.fill();
    m.restore();
    if (b.spot) { m.save(); m.translate(b.spot.x, b.spot.y); m.scale(1, b.spot.ry / b.spot.rx); const sg = m.createRadialGradient(0, 0, 0, 0, 0, b.spot.rx); sg.addColorStop(0, `rgba(0,0,0,${b.k})`); sg.addColorStop(1, 'rgba(0,0,0,0)'); m.fillStyle = sg; m.beginPath(); m.arc(0, 0, b.spot.rx, 0, 7); m.fill(); m.restore(); }
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(mask!, 0, 0); g.restore();
  // coloured glow of each source on top
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'screen';
  for (const l of lamps) {
    if (!l.col || l.k <= 0) continue;
    g.save(); g.translate(l.x, l.y); g.scale(1, l.sy ?? 1);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, l.r * 0.8); gr.addColorStop(0, l.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = Math.min(1, l.k); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, l.r * 0.8, 0, 7); g.fill(); g.restore();
  }
  for (const b of beams) {
    if (b.k <= 0) continue;
    g.save(); g.translate(b.x, b.y); g.rotate(b.ang); g.globalAlpha = 0.16 * b.k;
    const gr = g.createLinearGradient(0, 0, b.len, 0); gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(1, 'rgba(255,248,220,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -3); g.lineTo(b.len, -b.len * Math.tan(b.spread)); g.lineTo(b.len, b.len * Math.tan(b.spread)); g.lineTo(0, 3); g.closePath(); g.fill(); g.restore();
    if (b.spot) { g.save(); g.translate(b.spot.x, b.spot.y); g.scale(1, b.spot.ry / b.spot.rx); g.globalAlpha = 0.35 * b.k; const sg = g.createRadialGradient(0, 0, 0, 0, 0, b.spot.rx); sg.addColorStop(0, 'rgba(255,246,215,1)'); sg.addColorStop(1, 'rgba(255,246,215,0)'); g.fillStyle = sg; g.beginPath(); g.arc(0, 0, b.spot.rx, 0, 7); g.fill(); g.restore(); }
  }
  g.restore();
}

/** flicker of fluorescent tubes coming back on (0 → 1 with stutters), deterministic in t */
export function tubeFlicker(t: number, t0: number, seed = 0) {
  const u = t - t0; if (u < 0) return 0; if (u > 1.4) return 1;
  const steps = [0.0, 0.08, 0.16, 0.3, 0.42, 0.7, 0.78, 1.0].map((x) => x + (seed % 3) * 0.04);
  const on = [1, 0, 1, 0, 0.6, 0, 1, 1];
  let k = 0; for (let i = 0; i < steps.length; i++) if (u >= steps[i]) k = on[i];
  return k;
}
/** film grain + vignette (cheap, deterministic) */
export function finish(t: number, vig = 0.5, grainK = 0.05) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${vig})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  if (grainK > 0) { const s = Math.floor(t * 24) * 7919 + 1; for (let i = 0; i < 1400; i++) { const x = (s * (i + 1) * 9301) % W, y = (s * (i + 7) * 49297) % H; g.fillStyle = i % 2 ? `rgba(255,255,255,${grainK * 0.45})` : `rgba(0,0,0,${grainK * 0.6})`; g.fillRect(x, y, 1.5, 1.5); } }
  g.restore();
}
