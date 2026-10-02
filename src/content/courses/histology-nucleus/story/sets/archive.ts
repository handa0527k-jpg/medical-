/**
 * The archive inside the head office: tall shelves of spools (DNA wound on histone spools), a winding
 * table under a lamp, the inner side of the gate as the entrance (back left). Open, loosely wound spools
 * glow softly (euchromatin, readable); sealed boxes sit dark on the upper shelves (heterochromatin).
 */
import { g, W, H } from '../../../../../engine/story/kit';
import { noise } from '../../../../../engine/story/cine';
import type { Camera, V3 } from '../../../../../engine/story/mocap';
import { box, quad, seg, use, P } from '../../../../../engine/story/set3d';
import type { Lamp } from '../../../../../engine/story/light';

export const TABLE: V3 = [1.4, 0, -1.2];
export const ENTRANCE: V3 = [-5.2, 0, -5.4];
const BACK = -6, LEFT = -8, RIGHT = 8, TOP = 6;

/** one spool (eight-bead histone core with ~1.7 turns of DNA) at a world point, radius r (m) */
export function spool3(cam: Camera, p: V3, r: number, t: number, glow = 0, sealed = false) {
  const q = cam.proj(p); if (q.d < 0.2) return; const s = r * q.s;
  if (sealed) { g.fillStyle = '#3b3048'; g.fillRect(q.x - s * 1.2, q.y - s * 1.1, s * 2.4, s * 2.2); g.fillStyle = '#c94a4a'; g.fillRect(q.x - s * 0.3, q.y - s * 1.1, s * 0.6, s * 2.2); return; }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + t * 0.3; g.fillStyle = ['#b48ad8', '#8a5cc2', '#d6b0e8', '#9b74c8'][i]; g.beginPath(); g.arc(q.x + Math.cos(a) * s * 0.42, q.y + Math.sin(a) * s * 0.3, s * 0.5, 0, 7); g.fill(); }
  g.strokeStyle = `rgba(120,190,255,${0.75 + 0.25 * glow})`; g.lineWidth = Math.max(1, s * 0.12); g.beginPath(); g.ellipse(q.x, q.y, s * 0.98, s * 0.62, -0.3, 0, Math.PI * 1.7); g.stroke();
  if (glow > 0) { const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, s * 2.4); gr.addColorStop(0, `rgba(190,220,255,${0.35 * glow})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, s * 2.4, 0, 7); g.fill(); }
}

/** a shelf unit along a wall: rows of spools; the top rows hold sealed boxes */
function shelves(cam: Camera, t: number, x0: number, x1: number, z: number, side: 'back' | 'left' | 'right') {
  const wood = '#4a3428', dark = '#2e2018';
  const pt = (u: number, y: number, dz = 0): V3 => (side === 'back' ? [x0 + (x1 - x0) * u, y, z + dz] : side === 'left' ? [z + dz, y, x0 + (x1 - x0) * u] : [z - dz, y, x0 + (x1 - x0) * u]);
  quad([pt(0, 0), pt(1, 0), pt(1, TOP - 0.4), pt(0, TOP - 0.4)], dark);
  for (let r = 0; r < 6; r++) {
    const y = 0.3 + r * 0.9;
    quad([pt(0, y, 0.45), pt(1, y, 0.45), pt(1, y + 0.05, 0.45), pt(0, y + 0.05, 0.45)], wood);
    const n = Math.round(Math.abs(x1 - x0) / 0.42);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, sealed = r >= 4 || (r === 3 && (i * 7) % 5 === 0);
      spool3(cam, pt(u, y + 0.24, 0.25), 0.15, t + i * 0.3, sealed ? 0 : 0.3 + 0.2 * Math.sin(t * 0.8 + i + r), sealed);
    }
  }
}

export function archive(cam: Camera, t: number, o: { lampK?: number } = {}) {
  use(cam);
  g.fillStyle = '#0b0910'; g.fillRect(0, 0, W, H);
  quad([[LEFT, TOP, BACK], [RIGHT, TOP, BACK], [RIGHT, TOP, 8], [LEFT, TOP, 8]], '#120e18');
  quad([[LEFT, 0, BACK], [RIGHT, 0, BACK], [RIGHT, 0, 8], [LEFT, 0, 8]], '#241b22');
  for (let z = BACK; z < 8; z += 0.5) seg([LEFT, 0, z], [RIGHT, 0, z], 'rgba(0,0,0,.25)', 1);
  quad([[LEFT, 0, BACK], [LEFT, 0, 8], [LEFT, TOP, 8], [LEFT, TOP, BACK]], '#1a1420');
  quad([[RIGHT, 0, BACK], [RIGHT, 0, 8], [RIGHT, TOP, 8], [RIGHT, TOP, BACK]], '#1a1420');
  quad([[LEFT, 0, BACK], [RIGHT, 0, BACK], [RIGHT, TOP, BACK], [LEFT, TOP, BACK]], '#1d1624');
  // entrance: the inner face of the gate (eight lights), back left
  const ec = P([ENTRANCE[0], 1.5, BACK + 0.02]);
  const eg = g.createRadialGradient(ec.x, ec.y, 0, ec.x, ec.y, 1.6 * ec.s); eg.addColorStop(0, 'rgba(255,220,170,.55)'); eg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = eg; g.beginPath(); g.arc(ec.x, ec.y, 1.6 * ec.s, 0, 7); g.fill();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const q = P([ENTRANCE[0] + Math.cos(a) * 1.1, 1.5 + Math.sin(a) * 1.1, BACK + 0.03]); g.fillStyle = '#b8a6e0'; g.beginPath(); g.arc(q.x, q.y, Math.max(1.5, q.s * 0.1), 0, 7); g.fill(); }
  shelves(cam, t, -3.4, RIGHT - 0.2, BACK, 'back');
  shelves(cam, t, BACK + 0.2, 6, LEFT, 'left');
  shelves(cam, t, BACK + 0.2, 6, RIGHT, 'right');
  // the winding table, a spool stand, a lamp
  const [tx, , tz] = TABLE;
  box([tx - 0.9, 0.74, tz - 0.45], [tx + 0.9, 0.8, tz + 0.45], { top: '#6b4a34', front: '#4a3224', left: '#3a281c', right: '#3a281c', back: '#4a3224' });
  [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]].forEach(([dx, dz]) => box([tx + dx - 0.04, 0, tz + dz - 0.04], [tx + dx + 0.04, 0.74, tz + dz + 0.04], { front: '#2e2018', left: '#241810', right: '#241810' }));
  box([tx + 0.55, 0.8, tz - 0.15], [tx + 0.6, 1.3, tz - 0.1], { front: '#8a6a2c', left: '#6a5020', right: '#6a5020' });
  const lp = P([tx + 0.4, 1.32, tz - 0.12]); g.fillStyle = '#1f5a3c'; g.beginPath(); g.ellipse(lp.x, lp.y, 0.2 * lp.s, 0.08 * lp.s, 0, Math.PI, 0); g.fill();
  g.fillStyle = `rgba(255,232,180,${o.lampK ?? 1})`; g.beginPath(); g.arc(lp.x, lp.y + 0.02 * lp.s, 0.05 * lp.s, 0, 7); g.fill();
  // spools waiting on the table and a long ribbon of DNA off the edge
  [[-0.6, 0.1], [-0.35, -0.12], [-0.1, 0.12]].forEach(([dx, dz], i) => spool3(cam, [tx + dx, 0.92, tz + dz], 0.11, t + i, 0.2));
  g.strokeStyle = 'rgba(120,190,255,.8)'; g.lineWidth = 2; g.beginPath();
  for (let k = 0; k <= 30; k++) { const q = P([tx - 0.9 - k * 0.05, 0.8 - Math.min(0.78, k * k * 0.0015), tz + 0.1 + Math.sin(k * 0.6 + t) * 0.05]); if (k) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }
  g.stroke();
}

export function archiveLamps(cam: Camera, t: number): Lamp[] {
  use(cam);
  const l = P([TABLE[0] + 0.4, 1.0, TABLE[2]]), e = P([ENTRANCE[0], 1.5, BACK]);
  return [
    { x: l.x, y: l.y, r: 2.6 * l.s, k: 0.95 + 0.04 * noise(t * 3, 1), col: 'rgba(255,214,150,.4)', sy: 0.85 },
    { x: e.x, y: e.y, r: 2.4 * e.s, k: 0.6, col: 'rgba(255,214,170,.25)' },
    { x: W / 2, y: H * 0.4, r: 900, k: 0.25, sy: 0.6 },
  ];
}
