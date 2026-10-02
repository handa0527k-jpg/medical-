/**
 * Acting and camera helpers for the motion-capture story films: expression keyframes, faces with
 * blinking and voice-driven lips, smooth spans, and camera moves with a breath of handheld drift.
 */
import { L } from './kit';
import { noise } from './cine';
import { blinkAt, type Face } from './rig';
import { camera, type V3 } from './mocap';

export type Expr = Partial<Face>;
const sm = (u: number) => u * u * (3 - 2 * u);
/** 0 → 1 between a and b, smoothstepped */
export const span = (t: number, a: number, b: number) => sm(Math.max(0, Math.min(1, (t - a) / (b - a || 1e-6))));

/** expression at t from keyframes [time, expr]; each key eases in over `ease` s and holds until changed */
export function keys(t: number, ks: [number, Expr][], ease = 0.45): Expr {
  let cur: Expr = {};
  for (const [k, e] of ks) {
    if (t < k) break;
    const u = sm(Math.min(1, (t - k) / ease));
    const next: Expr = { ...cur };
    for (const [n, val] of Object.entries(e) as [keyof Face, number][]) next[n] = (cur[n] ?? 0) + (val - (cur[n] ?? 0)) * u;
    cur = next;
  }
  return cur;
}
/** a face: natural blinks (seeded per character), lips from `mouth` (0..1), plus an expression */
export function face(t: number, seed: number, mouth: number, e: Expr = {}): Face {
  return { ...e, blink: Math.max(blinkAt(t, seed), e.blink ?? 0), mouth: Math.max(e.mouth ?? 0, mouth * 0.9) };
}
/** a camera moving from p0 to p1 over [a, b] (eased), aimed at target (→ t1), with handheld drift */
export function shotCam(t: number, a: number, b: number, p0: V3, p1: V3, target: V3, f: number, hand = 1, t1?: V3) {
  const u = sm(Math.max(0, Math.min(1, (t - a) / Math.max(0.01, b - a))));
  const hx = noise(t * 0.35, 3) * 0.012 * hand, hy = noise(t * 0.3, 8) * 0.008 * hand;
  const tg = t1 ? [L(target[0], t1[0], u), L(target[1], t1[1], u), L(target[2], t1[2], u)] : target;
  return camera({ x: L(p0[0], p1[0], u) + hx, y: L(p0[1], p1[1], u) + hy, z: L(p0[2], p1[2], u), tx: tg[0] + hx * 0.5, ty: tg[1] + hy * 0.5, tz: tg[2], f });
}
/** pick the shot whose `until` has not passed yet */
export function pick<T extends { until: number }>(shots: T[], t: number): [T, number] {
  const i = shots.findIndex((s) => t < s.until); const k = i < 0 ? shots.length - 1 : i; return [shots[k], k];
}
/** facing angle (rad, 0 = +z toward the camera side) from one floor point to another */
export const faceTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
