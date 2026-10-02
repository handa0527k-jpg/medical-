/**
 * Motion-capture clips (CMU Graphics Lab, converted by tools/amc2json.py) placed in a 3-D set and
 * viewed through a pinhole camera.
 *
 * A character's performance is a list of `Take`s on the scene clock. Each take plays a window of a
 * clip, placed at a spot on the floor and turned to a facing; consecutive takes cross-fade (pose
 * blending in joint space). Walk takes may loop a gait cycle and keep the clip's own root travel, so
 * the feet never skate. Small corrections (reach a prop, look at someone) are layered on top with
 * two-bone IK and look-at, never by inventing a whole motion.
 */
export type V3 = [number, number, number];
export interface Clip { stature?: number; fps: number; joints: string[]; frames: number[][][]; headFwd: number[][]; src: string; loop?: { a: number; b: number } }

export const J = {
  pelvis: 0, hipL: 1, kneeL: 2, ankleL: 3, toeL: 4, hipR: 5, kneeR: 6, ankleR: 7, toeR: 8,
  waist: 9, chest: 10, thorax: 11, neck: 12, neck2: 13, head: 14,
  shoulderL: 15, elbowL: 16, wristL: 17, handL: 18, shoulderR: 19, elbowR: 20, wristR: 21, handR: 22,
} as const;
export type JointName = keyof typeof J;
export const NJ = 23;

const clips: Record<string, Clip> = {};
const files = import.meta.glob('./motion/clips/*.json', { eager: true, import: 'default' }) as Record<string, Clip>;
for (const [p, c] of Object.entries(files)) clips[p.split('/').pop()!.replace('.json', '')] = c;
export function clip(id: string): Clip { const c = clips[id]; if (!c) throw new Error(`no clip ${id}`); return c; }
export const clipIds = () => Object.keys(clips);

/* ---------- vector helpers ---------- */
export const v = {
  add: (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k],
  lerp: (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k],
  len: (a: V3) => Math.hypot(a[0], a[1], a[2]),
  norm: (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  dot: (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
};
const rotY = (p: V3, a: number): V3 => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };

/** facing of a pose (yaw, radians; 0 = +z) from the hip line */
function facingOf(f: number[][]) {
  const l = f[J.hipL], r = f[J.hipR];
  const side: V3 = [l[0] - r[0], 0, l[2] - r[2]];
  // the figure's left is +x when it faces +z, so forward = side × up
  const fw = v.cross(side, [0, 1, 0]);
  return Math.atan2(fw[0], fw[2]);
}

/** one frame of a clip at local time u (s), linearly interpolated; looping clips wrap their cycle */
function rawFrame(c: Clip, u: number): { f: number[][]; head: V3; travel: V3 } {
  const n = c.frames.length;
  let x = u * c.fps, travel: V3 = [0, 0, 0];
  if (c.loop && x > c.loop.b) {
    const { a, b } = c.loop, T = b - a, k = Math.floor((x - a) / T);
    const fa = c.frames[a][0], fb = c.frames[b][0];
    travel = v.mul([fb[0] - fa[0], 0, fb[2] - fa[2]], k);
    x = a + ((x - a) % T);
  }
  x = Math.max(0, Math.min(n - 1, x));
  const i = Math.floor(x), k = x - i, j = Math.min(n - 1, i + 1);
  const A = c.frames[i], B = c.frames[j];
  const f = A.map((p, q) => [p[0] + (B[q][0] - p[0]) * k, p[1] + (B[q][1] - p[1]) * k, p[2] + (B[q][2] - p[2]) * k]);
  const ha = c.headFwd[i], hb = c.headFwd[j];
  return { f, head: [ha[0] + (hb[0] - ha[0]) * k, ha[1] + (hb[1] - ha[1]) * k, ha[2] + (hb[2] - ha[2]) * k], travel };
}

export interface Take {
  clip: string;
  /** scene time at which the take starts */
  at: number;
  /** window of the clip (s); `to` may exceed the clip on looping walks */
  from?: number; to?: number;
  /** playback rate (1 = as captured) */
  rate?: number;
  /** where the pelvis starts on the floor (x, z) and which way the figure faces (rad, 0 = toward camera, +π/2 = screen right) */
  x: number; z: number; face: number;
  /** keep the clip's root travel (walks) or pin the pelvis over (x, z) */
  travel?: boolean;
  /** lift/lower the whole body (e.g. a higher chair), metres */
  dy?: number;
  /** cross-fade into this take (s) */
  blend?: number;
  /** the character's standing height (m): the capture is scaled to it */
  h?: number;
}
export interface Pose3 { p: V3[]; head: V3 }

/** pose of one take at scene time t (world coordinates) */
function takePose(tk: Take, t: number): Pose3 {
  const c = clip(tk.clip), from = tk.from ?? 0, rate = tk.rate ?? 1;
  const end = tk.to ?? c.frames.length / c.fps;
  const u = from + Math.max(0, t - tk.at) * rate;
  const r0 = rawFrame(c, from), r = rawFrame(c, c.loop && !tk.to ? u : Math.min(u, end));
  const base = r0.f[J.pelvis], face0 = facingOf(r0.f);
  const turn = tk.face - face0;
  const sc = tk.h && c.stature ? tk.h / c.stature : 1;
  const p = r.f.map((q) => {
    let rel: V3 = [q[0] - base[0] + r.travel[0], q[1] + (tk.dy ?? 0), q[2] - base[2] + r.travel[2]];
    if (!tk.travel) { const pel = r.f[J.pelvis]; rel = [q[0] - pel[0], q[1] + (tk.dy ?? 0), q[2] - pel[2]]; }
    const w = rotY([rel[0] * sc, (rel[1] - (tk.dy ?? 0)) * sc + (tk.dy ?? 0), rel[2] * sc], turn);
    return [w[0] + tk.x, w[1], w[2] + tk.z] as V3;
  });
  return { p, head: rotY(r.head, turn) };
}

const blendPose = (a: Pose3, b: Pose3, k: number): Pose3 => ({ p: a.p.map((q, i) => v.lerp(q, b.p[i], k)), head: v.norm(v.lerp(a.head, b.head, k)) });

/** a character's pose at scene time t from its takes (sorted by `at`) */
export function perform(takes: Take[], t: number): Pose3 {
  let i = 0; while (i + 1 < takes.length && takes[i + 1].at <= t) i++;
  const cur = takePose(takes[i], t);
  if (i > 0) {
    const bl = takes[i].blend ?? 0.45, k = (t - takes[i].at) / bl;
    if (k < 1) { const s = k * k * (3 - 2 * k); return blendPose(takePose(takes[i - 1], t), cur, s); }
  }
  return cur;
}

/* ---------- corrections ---------- */
/** two-bone IK in 3-D: move the wrist of one arm to `target`, bending the elbow toward `pole` */
export function reach(pose: Pose3, side: 'L' | 'R', target: V3, k: number, pole: V3 = [0, -1, -0.3]) {
  if (k <= 0) return;
  const S = pose.p[J[`shoulder${side}`]], E = pose.p[J[`elbow${side}`]], Wr = pose.p[J[`wrist${side}`]], Hd = pose.p[J[`hand${side}`]];
  const a = v.len(v.sub(E, S)), b = v.len(v.sub(Wr, E));
  const T = v.lerp(Wr, target, k);
  let d = v.sub(T, S); let dl = v.len(d); const mx = (a + b) * 0.999;
  if (dl > mx) { d = v.mul(v.norm(d), mx); dl = mx; }
  const dir = v.norm(d);
  const cosA = Math.max(-1, Math.min(1, (a * a + dl * dl - b * b) / (2 * a * dl || 1)));
  const sinA = Math.sqrt(1 - cosA * cosA);
  // bend plane from the pole (current elbow direction mixed with the hint)
  const cur = v.sub(E, S); const hint = v.norm(v.add(v.mul(cur, 0.5), pole));
  const perp = v.norm(v.sub(hint, v.mul(dir, v.dot(hint, dir))));
  const E2 = v.add(S, v.add(v.mul(dir, a * cosA), v.mul(perp, a * sinA)));
  const W2 = v.add(S, d);
  const hv = v.sub(Hd, Wr), H2 = v.add(W2, v.mul(v.norm(v.sub(W2, E2)), v.len(hv)));
  pose.p[J[`elbow${side}`]] = E2; pose.p[J[`wrist${side}`]] = W2; pose.p[J[`hand${side}`]] = H2;
}
/** turn the face toward a point (blend k) */
export function lookAt(pose: Pose3, target: V3, k: number) {
  if (k <= 0) return;
  const h = pose.p[J.head], n = pose.p[J.neck2];
  const c: V3 = [(h[0] + n[0]) / 2, (h[1] + n[1]) / 2, (h[2] + n[2]) / 2];
  pose.head = v.norm(v.lerp(pose.head, v.norm(v.sub(target, c)), k));
}
/** head centre (between upper neck and crown) */
export const headCentre = (pose: Pose3): V3 => { const h = pose.p[J.head], n = pose.p[J.neck2]; return [(h[0] + n[0]) / 2, (h[1] + n[1]) / 2 + 0.02, (h[2] + n[2]) / 2]; };

/* ---------- camera ---------- */
export interface Cam { x: number; y: number; z: number; /** look-at point */ tx: number; ty: number; tz: number; /** focal length in px */ f: number; roll?: number }
export interface Proj { x: number; y: number; d: number; s: number }
export function camera(c: Cam) {
  const fwd = v.norm([c.tx - c.x, c.ty - c.y, c.tz - c.z]);
  const right = v.norm(v.cross(fwd, [0, 1, 0]));
  const up = v.cross(right, fwd);
  const cr = Math.cos(c.roll ?? 0), sr = Math.sin(c.roll ?? 0);
  const proj = (p: V3): Proj => {
    const d = v.sub(p, [c.x, c.y, c.z]);
    const z = Math.max(0.05, v.dot(d, fwd)), x = v.dot(d, right), y = v.dot(d, up);
    const sx = (x * c.f) / z, sy = (y * c.f) / z;
    return { x: 640 + sx * cr - sy * sr, y: 360 - (sx * sr + sy * cr), d: z, s: c.f / z };
  };
  return { proj, fwd, right, up, pos: [c.x, c.y, c.z] as V3 };
}
export type Camera = ReturnType<typeof camera>;

/** pelvis height of a clip at local time u (to seat standing-captured upper-body takes on a chair) */
export function pelvisY(id: string, u = 0, h?: number) { const c = clip(id); const i = Math.min(c.frames.length - 1, Math.max(0, Math.round(u * c.fps))); return c.frames[i][J.pelvis][1] * (h && c.stature ? h / c.stature : 1); }
/** dy that puts the pelvis of `id` (at local time u) at height y */
export const seatAt = (id: string, u: number, y: number, h?: number) => y - pelvisY(id, u, h);
