/**
 * The eight-pillar gate (nuclear pore complex) in the head office's double wall, at night.
 * World: the plaza (cytoplasm) is z > WALL_Z; the outer wall (outer nuclear membrane) at WALL_Z, the
 * moat (perinuclear space), the inner wall (inner nuclear membrane) at WALL_Z − MOAT. The gate is an
 * octagon of eight pillars, three rings deep (cytoplasmic, central, nuclear), with a narrow lit channel.
 */
import { g, W, H } from '../../../../../engine/story/kit';
import { noise } from '../../../../../engine/story/cine';
import type { Camera, V3 } from '../../../../../engine/story/mocap';
import { box, quad, seg, use, P } from '../../../../../engine/story/set3d';
import type { Lamp } from '../../../../../engine/story/light';

export const WALL_Z = -3, MOAT = 0.9, GATE_R = 1.55, GATE_Y = 1.45;
export const GUARD_SPOT: V3 = [1.5, 0, -0.75];
const oct = (r: number, z: number, y = GATE_Y, x = 0): V3[] => Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; return [x + Math.cos(a) * r, y + Math.sin(a) * r, z] as V3; });

/** night sky + city glow behind the head office (screen space) */
function sky(cam: Camera, t: number) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#060912'); gr.addColorStop(0.7, '#141a30'); gr.addColorStop(1, '#22213a');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = ((i * 197 - cam.pos[0] * 20) % W + W) % W, y = (i * 89) % 260; g.fillStyle = `rgba(255,250,225,${0.25 + 0.4 * Math.abs(Math.sin(t * 0.6 + i))})`; g.fillRect(x, y, 1.5, 1.5); }
}

export function gateSet(cam: Camera, t: number, o: { open?: number; channel?: number; highlight?: number } = {}) {
  use(cam);
  sky(cam, t);
  const WZ = WALL_Z, IZ = WALL_Z - MOAT;
  // the head office wall: tall, faintly lilac, lit from below by lanterns
  const wall = (z: number, col: string) => quad([[-14, 0, z], [14, 0, z], [14, 7, z], [-14, 7, z]], col);
  wall(IZ, '#3a3150');
  wall(WZ, '#4a3f62');
  // windows of the upper floors (the office is awake at 2 a.m.)
  for (let x = -12; x <= 12; x += 1.6) for (let y = 3.6; y < 6.8; y += 1.1) {
    if (Math.abs(x) < 2.6 && y < 4.4) continue;
    const on = Math.abs(Math.sin(x * 3.1 + y * 7.7)) > 0.72;
    quad([[x - 0.45, y, WZ + 0.01], [x + 0.45, y, WZ + 0.01], [x + 0.45, y + 0.6, WZ + 0.01], [x - 0.45, y + 0.6, WZ + 0.01]], on ? `rgba(255,214,150,${0.55 + 0.1 * noise(t * 0.5 + x, y)})` : '#2c2640');
  }
  // the plaza (cytoplasm) and its paving
  quad([[-14, 0, WZ], [14, 0, WZ], [14, 0, 12], [-14, 0, 12]], '#1d1a28');
  for (let z = WZ + 0.8; z < 12; z += 0.8) seg([-14, 0, z], [14, 0, z], 'rgba(0,0,0,.25)', 1);
  for (let x = -14; x <= 14; x += 0.8) seg([x, 0, WZ], [x, 0, 12], 'rgba(0,0,0,.18)', 1);
  // the opening through both walls: the moat seen in between, and the lit interior beyond
  const front = oct(GATE_R, WZ + 0.02), inner = oct(GATE_R, IZ + 0.02);
  quad(front, '#120f1c');
  quad(inner, '#1a1426');
  // channel light from the inside (nucleoplasm), the narrow central passage
  const c = P([0, GATE_Y, IZ - 0.2]);
  const k = o.channel ?? 0.6;
  const cg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, 0.9 * c.s); cg.addColorStop(0, `rgba(255,226,170,${0.9 * k})`); cg.addColorStop(0.35, `rgba(240,170,200,${0.4 * k})`); cg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = cg; g.beginPath(); g.arc(c.x, c.y, 0.9 * c.s, 0, 7); g.fill();
  // three rings, eight pillars each (nuclear ring, central/spoke ring, cytoplasmic ring), far → near
  const hl = o.highlight ?? 0;
  const ring = (z: number, r: number, col: string, w: number) => {
    const pts = oct(r, z);
    g.strokeStyle = col; g.lineWidth = Math.max(2, P([0, GATE_Y, z]).s * w); g.lineJoin = 'round';
    g.beginPath(); pts.forEach((p, i) => { const q = P(p); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }); g.closePath(); g.stroke();
    pts.forEach((p) => { const q = P(p); const s = q.s * 0.17; g.fillStyle = col; g.beginPath(); g.arc(q.x, q.y, s, 0, 7); g.fill(); g.fillStyle = `rgba(255,236,190,${0.25 + 0.6 * hl})`; g.beginPath(); g.arc(q.x - s * 0.3, q.y - s * 0.3, s * 0.35, 0, 7); g.fill(); });
  };
  ring(IZ - 0.05, GATE_R * 0.98, '#7a6aa0', 0.12);
  ring((WZ + IZ) / 2, GATE_R * 0.8, '#8a7ab4', 0.1); // spoke ring narrows the passage
  // spokes toward the centre (the narrow channel)
  oct(GATE_R * 0.8, (WZ + IZ) / 2).forEach((p) => { const a = P(p), b = P([p[0] * 0.25, GATE_Y + (p[1] - GATE_Y) * 0.25, p[2]]); g.strokeStyle = 'rgba(160,140,200,.55)'; g.lineWidth = Math.max(1.5, a.s * 0.05); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); });
  ring(WZ + 0.05, GATE_R, '#a492cc', 0.14);
  // cytoplasmic filaments hanging out from the front ring
  oct(GATE_R, WZ + 0.06).forEach((p, i) => { const a = P(p), sway = Math.sin(t * 0.9 + i) * 0.06; const b = P([p[0] * 1.08 + sway, p[1] - 0.55, p[2] + 0.35]); g.strokeStyle = 'rgba(190,170,230,.6)'; g.lineWidth = Math.max(1.2, a.s * 0.025); g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo((a.x + b.x) / 2 + 6, (a.y + b.y) / 2, b.x, b.y); g.stroke(); });
  // the guard's booth and two lanterns
  box([2.5, 0, WZ + 0.1], [3.6, 2.3, WZ + 1.1], { front: '#2a3550', left: '#223048', top: '#1c2840', right: '#223048' });
  quad([[2.7, 1.1, WZ + 1.11], [3.4, 1.1, WZ + 1.11], [3.4, 1.8, WZ + 1.11], [2.7, 1.8, WZ + 1.11]], 'rgba(255,214,150,.85)');
  [-2.4, 2.1].forEach((x) => { box([x - 0.05, 0, WZ + 0.35], [x + 0.05, 2.4, WZ + 0.45], { front: '#1a1a22', left: '#121218', right: '#121218' }); const l = P([x, 2.55, WZ + 0.4]); g.fillStyle = 'rgba(255,220,160,.95)'; g.beginPath(); g.arc(l.x, l.y, Math.max(2, l.s * 0.11), 0, 7); g.fill(); });
}

/** light sources of the gate set on screen */
export function gateLamps(cam: Camera, t: number, channel = 0.6): Lamp[] {
  use(cam);
  const c = P([0, GATE_Y, WALL_Z - MOAT]);
  const ls: Lamp[] = [{ x: c.x, y: c.y, r: 2.4 * c.s, k: 0.75 * channel + 0.1, col: 'rgba(255,214,170,.35)' }];
  [-2.4, 2.1].forEach((x, i) => { const l = P([x, 2.5, WALL_Z + 0.4]); ls.push({ x: l.x, y: l.y + 0.8 * l.s, r: 3.2 * l.s, k: 0.85 + 0.05 * noise(t * 3, i), col: 'rgba(255,200,130,.35)', sy: 0.9 }); });
  const b = P([3.05, 1.45, WALL_Z + 1.2]); ls.push({ x: b.x, y: b.y, r: 1.6 * b.s, k: 0.6, col: 'rgba(255,214,150,.25)' });
  return ls;
}
