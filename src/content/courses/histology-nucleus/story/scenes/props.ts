/** Props shared by the scenes: Tag's cardboard box (carried in both hands). */
import { g } from '../../../../../engine/story/kit';
import { reach, J, v, type Camera, type Pose3, type V3 } from '../../../../../engine/story/mocap';

/** put both hands on a box held in front of the belly; `out` = how far forward (m), `lift` = raise (m) */
export function carryBox(p: Pose3, fwd: V3, out = 0.26, lift = 0) {
  const pel = p.p[J.pelvis], ch = p.p[J.chest];
  const flat = v.norm([fwd[0], 0, fwd[2]]);
  const c: V3 = v.add(v.add(v.lerp(pel, ch, 0.55), v.mul(flat, out)), [0, lift, 0]);
  const side = v.norm(v.cross(flat, [0, 1, 0]));
  reach(p, 'L', v.add(c, v.mul(side, -0.17)), 1); reach(p, 'R', v.add(c, v.mul(side, 0.17)), 1);
  return { c, fwd: flat };
}
/** the box itself (cardboard, tape across the lid) */
export function boxAt(cam: Camera, cpos: V3, flat: V3, s = 1) {
  const side = v.norm(v.cross(flat, [0, 1, 0]));
  const w = 0.2 * s, dpt = 0.14 * s, h = 0.17 * s;
  const P = (dx: number, dy: number, dz: number) => cam.proj(v.add(cpos, v.add(v.mul(side, dx), v.add([0, dy, 0], v.mul(flat, dz)))));
  const poly = (pts: ReturnType<typeof P>[], col: string) => { g.fillStyle = col; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.fill(); };
  const toCam = v.sub(cam.pos, cpos);
  if (cam.pos[1] > cpos[1] + h) poly([P(-w, h, -dpt), P(w, h, -dpt), P(w, h, dpt), P(-w, h, dpt)], '#d9a066');
  const fz = v.dot(toCam, flat) > 0 ? dpt : -dpt;
  poly([P(-w, -h, fz), P(w, -h, fz), P(w, h, fz), P(-w, h, fz)], '#c4874f');
  const sx = v.dot(toCam, side) > 0 ? w : -w;
  poly([P(sx, -h, -dpt), P(sx, -h, dpt), P(sx, h, dpt), P(sx, h, -dpt)], '#a8703e');
  if (cam.pos[1] > cpos[1] + h) { const a = P(0, h, -dpt), b = P(0, h, dpt); g.strokeStyle = '#f2d39a'; g.lineWidth = Math.max(1, a.s * 0.015); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
  const lb = P(0, 0.02, fz); g.fillStyle = 'rgba(250,245,230,.85)'; g.fillRect(lb.x - lb.s * 0.06, lb.y - lb.s * 0.035, lb.s * 0.12, lb.s * 0.07);
}
