/**
 * Sets drawn through the same camera as the actors, so dollies and pans give true parallax:
 * floor/wall quads, boxes (desks, cabinets, machines), and a few office props. Painter's order is
 * decided by the scene (far → near).
 */
import { g } from './kit';
import type { Camera, V3 } from './mocap';
import { v } from './mocap';

let cam: Camera;
export const use = (c: Camera) => { cam = c; };
export const P = (p: V3) => cam.proj(p);

export function quad(pts: V3[], fill: string | CanvasGradient, stroke?: string) {
  const q = pts.map((p) => cam.proj(p));
  if (q.some((x) => x.d < 0.06)) return;
  g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath();
  g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
}
/** a box from (x0,y0,z0) to (x1,y1,z1); visible faces only. cols: top, front(+z), back(-z), left(-x), right(+x) */
export function box(a: V3, b: V3, cols: { top?: string; front?: string; back?: string; left?: string; right?: string; bottom?: string }) {
  const [x0, y0, z0] = a, [x1, y1, z1] = b, c = cam.pos;
  if (cols.back && c[2] < z0) quad([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], cols.back);
  if (cols.front && c[2] > z1) quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], cols.front);
  if (cols.left && c[0] < x0) quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], cols.left);
  if (cols.right && c[0] > x1) quad([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], cols.right);
  if (cols.top && c[1] > y1) quad([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], cols.top);
  if (cols.bottom && c[1] < y0) quad([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], cols.bottom);
}
/** a line in 3-D */
export function seg(a: V3, b: V3, col: string, w = 1) {
  const p = cam.proj(a), q = cam.proj(b); if (p.d < 0.06 || q.d < 0.06) return;
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
}
/** carpet tiles on the floor between x0..x1, z0..z1 */
export function carpet(x0: number, x1: number, z0: number, z1: number, base: string, line: string, step = 0.6) {
  quad([[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], base);
  for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) seg([x, 0, z0], [x, 0, z1], line, 1);
  for (let z = Math.ceil(z0 / step) * step; z <= z1; z += step) seg([x0, 0, z], [x1, 0, z], line, 1);
}

/* ---------- office props ---------- */
export function desk(x: number, z: number, w = 1.4, d = 0.75, h = 0.72, top = '#cfc8bc', body = '#9a9388') {
  box([x - w / 2, h - 0.03, z - d / 2], [x + w / 2, h, z + d / 2], { top, front: body, left: body, right: body, back: body });
  // modesty panel and legs
  box([x - w / 2 + 0.03, 0.12, z - d / 2 + 0.02], [x + w / 2 - 0.03, h - 0.03, z - d / 2 + 0.05], { front: '#7a746a', back: '#7a746a', top: '#7a746a' });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => box([x + sx * (w / 2 - 0.05) - 0.025, 0, z + sz * (d / 2 - 0.05) - 0.025], [x + sx * (w / 2 - 0.05) + 0.025, h - 0.03, z + sz * (d / 2 - 0.05) + 0.025], { front: '#5d5850', left: '#4d4842', right: '#4d4842' }));
}
/** a laptop on a desk: base at (x, y, z), screen tilted back; `glow` 0..1 draws the lit screen */
export function laptop(x: number, y: number, z: number, glow: number, screen?: (corners: { x: number; y: number }[]) => void, face = 0) {
  const w = 0.34, d = 0.24, c = Math.cos(face), s = Math.sin(face);
  const R = (dx: number, dy: number, dz: number): V3 => [x + dx * c + dz * s, y + dy, z - dx * s + dz * c];
  quad([R(-w / 2, 0.02, -d / 2), R(w / 2, 0.02, -d / 2), R(w / 2, 0.02, d / 2), R(-w / 2, 0.02, d / 2)], '#3c3f46');
  const back = [R(-w / 2, 0.02, -d / 2), R(w / 2, 0.02, -d / 2), R(w / 2, 0.24, -d / 2 - 0.06), R(-w / 2, 0.24, -d / 2 - 0.06)];
  quad(back, '#2a2d33');
  const inset = [R(-w / 2 + 0.015, 0.03, -d / 2 - 0.002), R(w / 2 - 0.015, 0.03, -d / 2 - 0.002), R(w / 2 - 0.015, 0.232, -d / 2 - 0.058), R(-w / 2 + 0.015, 0.232, -d / 2 - 0.058)];
  const q = inset.map((p) => cam.proj(p));
  // the screen faces +z (toward the user sitting in front)
  const facing = v.dot(v.norm(v.sub(cam.pos, R(0, 0.12, -d / 2))), [s, 0, c]) > 0;
  if (facing) {
    g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath();
    g.fillStyle = glow > 0 ? `rgba(${Math.round(40 + 160 * glow)},${Math.round(60 + 170 * glow)},${Math.round(90 + 160 * glow)},1)` : '#101216'; g.fill();
    if (screen && glow > 0) { g.save(); g.clip(); screen(q); g.restore(); }
  }
}
export function chair(x: number, z: number, face: number, col = '#2d3138') {
  const c = Math.cos(face), s = Math.sin(face);
  const R = (dx: number, dy: number, dz: number): V3 => [x + dx * c + dz * s, dy, z - dx * s + dz * c];
  // base star + post
  seg(R(0, 0.06, 0), R(0, 0.42, 0), '#1c1e22', 3);
  [0, 1, 2, 3, 4].forEach((i) => { const a = (i / 5) * Math.PI * 2; seg(R(0, 0.06, 0), R(Math.cos(a) * 0.28, 0.04, Math.sin(a) * 0.28), '#1c1e22', 3); });
  quad([R(-0.24, 0.46, -0.24), R(0.24, 0.46, -0.24), R(0.24, 0.46, 0.22), R(-0.24, 0.46, 0.22)], col);
  quad([R(-0.23, 0.52, -0.27), R(0.23, 0.52, -0.27), R(0.21, 1.02, -0.32), R(-0.21, 1.02, -0.32)], col);
}
export function monitorStack(x: number, z: number, y: number) {
  box([x - 0.25, y, z - 0.03], [x + 0.25, y + 0.32, z + 0.02], { front: '#1a1c20', back: '#2a2c30', top: '#2a2c30', left: '#222', right: '#222' });
  box([x - 0.03, y - 0.1, z - 0.02], [x + 0.03, y, z + 0.01], { front: '#2a2c30' });
}
