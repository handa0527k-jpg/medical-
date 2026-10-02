/**
 * The assembly rooms (nucleolus): a round workshop in pink light with three concentric zones on the
 * floor — the pale fibrillar centre (rDNA loops hang from a frame), the dense fibrillar ring, and the
 * granular ring where finished subunits pile up. Nor's workbench stands at the granular ring; the
 * archive corridor (dark) opens behind the entrance arch.
 */
import { g, W, H } from '../../../../../engine/story/kit';
import { noise } from '../../../../../engine/story/cine';
import type { Camera, V3 } from '../../../../../engine/story/mocap';
import { box, quad, seg, use, P } from '../../../../../engine/story/set3d';
import type { Lamp } from '../../../../../engine/story/light';

export const CENTRE: V3 = [0, 0, -2.5];
export const R_FC = 1.1, R_DFC = 2.0, R_GC = 3.3;
export const BENCH: V3 = [2.2, 0, -0.2];
export const ARCH: V3 = [-4.2, 0, 1.6];
const ROOM = 6;

function disc(r0: number, r1: number, col: string, y = 0.01) {
  const pts: V3[] = [];
  for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; pts.push([CENTRE[0] + Math.sin(a) * r1, y, CENTRE[2] + Math.cos(a) * r1]); }
  for (let i = 48; i >= 0; i--) { const a = (i / 48) * Math.PI * 2; pts.push([CENTRE[0] + Math.sin(a) * r0, y, CENTRE[2] + Math.cos(a) * r0]); }
  quad(pts, col);
}
/** a ribosomal subunit (a lumpy ball), `big` = large subunit */
export function subunit(cam: Camera, p: V3, big: boolean, a = 1) {
  const q = cam.proj(p); if (q.d < 0.2 || a <= 0) return; const s = (big ? 0.16 : 0.11) * q.s;
  g.globalAlpha = a; g.fillStyle = big ? '#e8a05a' : '#f2c27a'; g.beginPath(); g.arc(q.x, q.y, s, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,240,210,.5)'; g.beginPath(); g.arc(q.x - s * 0.3, q.y - s * 0.3, s * 0.35, 0, 7); g.fill(); g.globalAlpha = 1;
}

export function workshop(cam: Camera, t: number, o: { flow?: number } = {}) {
  use(cam);
  g.fillStyle = '#0d080c'; g.fillRect(0, 0, W, H);
  // room shell
  quad([[-ROOM, 0, -ROOM - 2.5], [ROOM, 0, -ROOM - 2.5], [ROOM, 0, ROOM], [-ROOM, 0, ROOM]], '#2a1a22');
  quad([[-ROOM, 0, -ROOM - 2.5], [ROOM, 0, -ROOM - 2.5], [ROOM, 4.5, -ROOM - 2.5], [-ROOM, 4.5, -ROOM - 2.5]], '#33202a');
  quad([[-ROOM, 0, -ROOM - 2.5], [-ROOM, 0, ROOM], [-ROOM, 4.5, ROOM], [-ROOM, 4.5, -ROOM - 2.5]], '#2c1c25');
  quad([[ROOM, 0, -ROOM - 2.5], [ROOM, 0, ROOM], [ROOM, 4.5, ROOM], [ROOM, 4.5, -ROOM - 2.5]], '#2c1c25');
  quad([[-ROOM, 4.5, -ROOM - 2.5], [ROOM, 4.5, -ROOM - 2.5], [ROOM, 4.5, ROOM], [-ROOM, 4.5, ROOM]], '#1a1016');
  // entrance arch on the left wall (dark corridor of the archive beyond)
  quad([[-ROOM + 0.01, 0, ARCH[2] - 0.8], [-ROOM + 0.01, 0, ARCH[2] + 0.8], [-ROOM + 0.01, 2.4, ARCH[2] + 0.8], [-ROOM + 0.01, 2.4, ARCH[2] - 0.8]], '#07050a');
  // the three zones
  disc(R_DFC, R_GC, '#4a2a3a');
  for (let i = 0; i < 160; i++) { const a = i * 2.39996, r = R_DFC + 0.1 + ((i * 37) % 100) / 100 * (R_GC - R_DFC - 0.2); const q = P([CENTRE[0] + Math.sin(a) * r, 0.03, CENTRE[2] + Math.cos(a) * r]); g.fillStyle = 'rgba(240,170,190,.55)'; g.beginPath(); g.arc(q.x, q.y, Math.max(1, q.s * 0.035), 0, 7); g.fill(); }
  disc(R_FC, R_DFC, '#7a3550');
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const p0 = P([CENTRE[0] + Math.sin(a) * (R_FC + 0.05), 0.03, CENTRE[2] + Math.cos(a) * (R_FC + 0.05)]), p1 = P([CENTRE[0] + Math.sin(a + 0.15) * (R_DFC - 0.05), 0.03, CENTRE[2] + Math.cos(a + 0.15) * (R_DFC - 0.05)]); g.strokeStyle = 'rgba(255,160,190,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke(); }
  disc(0, R_FC, '#e9d6c8');
  // the frame over the centre with rDNA loops (blue) hanging
  const fr = (dx: number, dz: number): V3 => [CENTRE[0] + dx, 2.6, CENTRE[2] + dz];
  [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]].forEach(([dx, dz]) => seg([CENTRE[0] + dx, 0, CENTRE[2] + dz], fr(dx, dz), '#5a4a50', 3));
  seg(fr(-0.8, 0), fr(0.8, 0), '#5a4a50', 3);
  for (let k = 0; k < 5; k++) {
    const x = -0.6 + k * 0.3;
    g.strokeStyle = 'rgba(120,190,255,.85)'; g.lineWidth = 2; g.beginPath();
    for (let s = 0; s <= 20; s++) { const y = 2.6 - s * 0.09, q = P([CENTRE[0] + x + Math.sin(s * 0.6 + k + t) * 0.06, y, CENTRE[2] + Math.cos(s * 0.5 + k) * 0.06]); if (s) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }
    g.stroke();
    // pink rRNA strands growing off each gene (the "Christmas tree")
    for (let s = 2; s < 18; s += 2) { const y = 2.6 - s * 0.09, b = P([CENTRE[0] + x, y, CENTRE[2]]); const len = (s / 18) * 0.35 * b.s; g.strokeStyle = 'rgba(255,140,180,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + len * 0.7, b.y + len * 0.3); g.stroke(); }
  }
  // subunits drifting outward across the granular ring (toward the arch)
  const flow = o.flow ?? 0.5;
  for (let i = 0; i < 14; i++) {
    const ph = ((t * 0.05 * (0.6 + flow) + i / 14) % 1), a = i * 2.2;
    const r = R_DFC + 0.2 + ph * (R_GC - R_DFC + 1.6);
    subunit(cam, [CENTRE[0] + Math.sin(a) * r, 0.18, CENTRE[2] + Math.cos(a) * r], i % 2 === 0, Math.min(1, (1 - ph) * 3));
  }
  // Nor's workbench
  const [bx, , bz] = BENCH;
  box([bx - 0.8, 0.82, bz - 0.4], [bx + 0.8, 0.9, bz + 0.4], { top: '#8a5a48', front: '#5a3a2e', left: '#4a2e24', right: '#4a2e24', back: '#5a3a2e' });
  box([bx - 0.75, 0, bz - 0.35], [bx + 0.75, 0.82, bz + 0.35], { front: '#3a2420', left: '#2e1c18', right: '#2e1c18' });
  [[-0.5, -0.1], [-0.3, 0.12]].forEach(([dx, dz], i) => subunit(cam, [bx + dx, 1.02, bz + dz], i === 0));
}

export function workshopLamps(cam: Camera, t: number): Lamp[] {
  use(cam);
  const c = P([CENTRE[0], 1.2, CENTRE[2]]), b = P([BENCH[0], 1.2, BENCH[2]]);
  return [
    { x: c.x, y: c.y, r: 4.2 * c.s, k: 0.9 + 0.05 * noise(t * 2, 1), col: 'rgba(255,150,190,.35)', sy: 0.75 },
    { x: b.x, y: b.y, r: 2.4 * b.s, k: 0.8, col: 'rgba(255,200,170,.25)' },
  ];
}
