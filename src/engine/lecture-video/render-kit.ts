/** Shared pieces of the lecture-film renderer (render.ts, render-film.ts). */
import type { Intensity, Plan, SceneDef, TimedScene, WanShot } from './types';
import type { Pen } from './pen';
import { INK, diplococcus } from './diagrams';
import { H, W } from './gekiga';
import { bindCtx } from '../story/kit';
import { perform } from '../story/mocap';
import { sideCam, silhouette } from '../story/mv/common';

export type Layer = 'plate' | 'overlay' | 'full';
export const CL = (x: number) => Math.max(0, Math.min(1, x));
export const rnd = (i: number) => { const x = Math.sin(i * 91.17 + 7.3) * 43758.5453; return x - Math.floor(x); };

export interface RC {
  g: CanvasRenderingContext2D; p: Pen; plan: Plan; sc: SceneDef; ts: TimedScene;
  /** picture time (held during a freeze) */ t: number;
  /** wall time */ real: number;
  k: Intensity; layer: Layer; shot: WanShot;
  ev: (ref: string) => number;
  /** 0..1 progress of `dur` seconds after an event (0 before it) */
  u: (ref: string, dur: number) => number;
}

export function hall(rc: RC) {
  const { g, t } = rc;
  const gr = g.createLinearGradient(0, -200, 0, H + 200); gr.addColorStop(0, '#1b1e24'); gr.addColorStop(0.7, '#0c0d10'); gr.addColorStop(1, '#050506');
  g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
  // a shaft of light from the upper right through the dust
  g.save(); g.globalCompositeOperation = 'lighter';
  const sh = g.createLinearGradient(1150, -100, 500, 760); sh.addColorStop(0, 'rgba(255,240,205,0.30)'); sh.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = sh; g.beginPath(); g.moveTo(980, -200); g.lineTo(1260, -200); g.lineTo(760, 900); g.lineTo(280, 900); g.fill();
  for (let i = 0; i < 90; i++) {
    const x = (rnd(i) * 1500 - 100 + t * (6 + rnd(i * 3) * 10)) % 1500 - 100, y = (rnd(i * 7) * 900 - 80 + Math.sin(t * 0.6 + i) * 12);
    g.fillStyle = `rgba(255,245,220,${0.25 + 0.5 * rnd(i * 11)})`; g.beginPath(); g.arc(x, y, 0.8 + rnd(i * 5) * 2, 0, 7); g.fill();
  }
  g.restore();
}

export function voidInk(rc: RC) {
  const { g, t } = rc;
  g.fillStyle = '#050505'; g.fillRect(-600, -400, W + 1200, H + 800);
  for (let i = 0; i < 7; i++) {
    const x = 640 + Math.sin(t * 0.3 + i * 1.7) * 420, y = 360 + Math.cos(t * 0.25 + i * 2.1) * 220, r = 260 + 80 * Math.sin(t * 0.4 + i);
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(60,58,52,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

export function micro(rc: RC) {
  const { g, t, p } = rc;
  const gr = g.createRadialGradient(640, 330, 50, 640, 360, 900); gr.addColorStop(0, '#20302f'); gr.addColorStop(1, '#040707');
  g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
  // out-of-focus diplococci drifting in the fluid (what Wan will animate for real)
  g.save(); g.filter = (g.filter === 'none' ? '' : g.filter + ' ') + 'blur(7px)';
  for (let i = 0; i < 9; i++) {
    const x = (rnd(i) * 1600 - 160 + t * (10 + 14 * rnd(i * 2))) % 1600 - 160, y = rnd(i * 5) * 760 - 20;
    p.save(); p.translate(x, y); p.rotate(rnd(i * 9) * 6 + t * 0.15); p.scale(0.7 + rnd(i * 4) * 0.8); p.alpha(0.35);
    diplococcus(p, { capsule: rnd(i * 3) > 0.5 ? 0.6 : 0, fill: '#5d7a74', ink: '#0d1515' }); p.restore();
  }
  g.restore();
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(190,255,235,${0.15 + 0.35 * rnd(i * 13)})`; g.beginPath(); g.arc((rnd(i) * 1500 + t * 18) % 1500 - 110, (rnd(i * 17) * 800 + Math.sin(t + i) * 10) - 40, 1 + rnd(i * 3) * 1.6, 0, 7); g.fill(); }
}

export function streaks(rc: RC) {
  const { g, t } = rc;
  g.fillStyle = '#0a0a0c'; g.fillRect(-600, -400, W + 1200, H + 800);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const y = rnd(i) * 720, x = ((rnd(i * 3) * 1800 + t * (60 + 80 * rnd(i))) % 1900) - 400; const gr = g.createLinearGradient(x, y, x + 500, y); gr.addColorStop(0, 'rgba(255,200,140,0)'); gr.addColorStop(0.5, 'rgba(255,200,140,0.18)'); gr.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = gr; g.fillRect(x, y, 500, 3 + rnd(i * 7) * 6); }
  g.restore();
}

export const label = (p: Pen, s: string, x: number, y: number, size: number, o: { fill?: string; align?: CanvasTextAlign; a?: number; font?: 'gothic' | 'brush' | 'mincho' | 'hand' } = {}) =>
  p.text(s, x, y, { size, font: o.font ?? 'gothic', weight: 900, fill: o.fill ?? '#fff', stroke: INK, strokeW: size * 0.22, align: o.align ?? 'left', opacity: o.a ?? 1 });

export function slate(rc: RC, x = 70, y = 40, w = 1140, h = 560) {
  const { g } = rc;
  g.fillStyle = '#2d1f14'; g.fillRect(x - 16, y - 16, w + 32, h + 32);
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#22322d'); gr.addColorStop(1, '#16221f');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 30;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + 160 + i * 230, y + 380 + (i % 2) * 60, 150, 3.6, 5.6); g.stroke(); }
  g.fillStyle = '#1a120c'; g.fillRect(x - 16, y + h + 4, w + 32, 14);
}

export function lecturer(rc: RC, sx: number, face: number) {
  if (!rc.sc.lecturer) return;
  const { g, ts, t } = rc;
  const pose = perform([{ clip: 'explain', at: ts.t0 - 0.6, from: 0.4, x: 0, z: 0, face }], t);
  bindCtx(g);
  g.save(); g.translate(sx - W / 2, 175);
  silhouette(sideCam(0, 1.0, 6, 900), pose, '#050505', { rim: 'rgba(255,255,255,0.9)', rimSide: face > 0 ? 1 : -1 });
  g.restore();
}
