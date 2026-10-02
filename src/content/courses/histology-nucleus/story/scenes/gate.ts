/**
 * Scene 2「八本柱の門」 (nuclear pore complex): Tag walks up with his box → Poa greets him and checks it →
 * the structure (8 × 3 rings, 30–100 nm) → the 9 nm channel → what goes in / what comes out → "which are
 * more?" — "I've never counted" (a laugh) → the nuclear basket and the lamina → Tag goes through.
 */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { perform, reach, lookAt, headCentre, J, v, type Take, type V3, type Camera } from '../../../../../engine/story/mocap';
import { drawActor } from '../../../../../engine/story/body';
import { darkness, finish } from '../../../../../engine/story/light';
import { face, keys, pick, shotCam, span, faceTo } from '../../../../../engine/story/act';
import { HEIGHT, POA, TAG } from '../cast';
import { cues, mouthIn } from '../film';
import { GATE_Y, GUARD_SPOT, WALL_Z, MOAT, gateLamps, gateSet } from '../sets/gate';
import { arrow, blueprint, callout, dim, dip, txt, MINCHO } from '../sets/ink';

const { c, e, d } = cues('gate');
const TAG_STOP: V3 = [-0.45, 0, -0.55];
const IN_GATE: V3 = [0, 0, WALL_Z - MOAT - 0.6];

/* ---------- performances ---------- */
const TAG_T: Take[] = [
  { clip: 'walk', at: -1, from: 0, x: -5.5, z: -0.3, face: faceTo([-5.5, 0, -0.3], TAG_STOP), travel: true, h: HEIGHT.TAG },
  { clip: 'stand2', at: 5.2, from: 0.5, x: TAG_STOP[0], z: TAG_STOP[2], face: faceTo(TAG_STOP, GUARD_SPOT), h: HEIGHT.TAG, blend: 0.8 },
  { clip: 'stand', at: 30, from: 3, x: TAG_STOP[0], z: TAG_STOP[2], face: faceTo(TAG_STOP, GUARD_SPOT) + 0.15, h: HEIGHT.TAG, blend: 1.2 },
  { clip: 'laugh', at: c[7] + 3.6, from: 2.6, x: TAG_STOP[0], z: TAG_STOP[2], face: faceTo(TAG_STOP, GUARD_SPOT), h: HEIGHT.TAG, blend: 0.6 },
  { clip: 'stand2', at: c[7] + 6.0, from: 2, x: TAG_STOP[0], z: TAG_STOP[2], face: faceTo(TAG_STOP, GUARD_SPOT), h: HEIGHT.TAG, blend: 0.9 },
  { clip: 'walk', at: e[9] + 0.2, from: 0.3, x: TAG_STOP[0], z: TAG_STOP[2], face: faceTo(TAG_STOP, IN_GATE), travel: true, h: HEIGHT.TAG, blend: 0.6 },
];
const POA_T: Take[] = [
  { clip: 'stand', at: -2, from: 0, x: GUARD_SPOT[0], z: GUARD_SPOT[2], face: 0.3, h: HEIGHT.POA },
  { clip: 'stand', at: 3.0, from: 6, x: GUARD_SPOT[0], z: GUARD_SPOT[2], face: faceTo(GUARD_SPOT, TAG_STOP), h: HEIGHT.POA, blend: 1.4 },
  { clip: 'explain', at: c[3] - 0.3, from: 2.0, x: GUARD_SPOT[0], z: GUARD_SPOT[2], face: faceTo(GUARD_SPOT, TAG_STOP) + 0.35, h: HEIGHT.POA, blend: 0.8 },
  { clip: 'stand', at: e[3] + 0.4, from: 9, x: GUARD_SPOT[0], z: GUARD_SPOT[2], face: faceTo(GUARD_SPOT, TAG_STOP), h: HEIGHT.POA, blend: 1.0 },
  { clip: 'laugh', at: c[7] + 2.3, from: 2.0, x: GUARD_SPOT[0], z: GUARD_SPOT[2], face: faceTo(GUARD_SPOT, TAG_STOP), h: HEIGHT.POA, blend: 0.5 },
  { clip: 'stand', at: c[7] + 5.6, from: 4, x: GUARD_SPOT[0], z: GUARD_SPOT[2], face: faceTo(GUARD_SPOT, TAG_STOP), h: HEIGHT.POA, blend: 1.0 },
  { clip: 'explain', at: c[9] - 0.2, from: 4.0, x: GUARD_SPOT[0], z: GUARD_SPOT[2], face: faceTo(GUARD_SPOT, TAG_STOP) - 0.4, h: HEIGHT.POA, blend: 0.8 },
];

function tagPose(t: number, poaHead: V3) {
  const p = perform(TAG_T, t);
  // the box in both hands: held at the belly while walking, held out at "荷物を見せて", then back
  const pel = p.p[J.pelvis], ch = p.p[J.chest];
  const fwd = v.norm(v.sub(poaHead, ch)); const flat = v.norm([fwd[0], 0, fwd[2]]);
  const offer = span(t, c[1] + 2.0, c[1] + 2.8) * (1 - span(t, c[2] + 1.0, c[2] + 2.0));
  const boxC: V3 = v.add(v.lerp(pel, ch, 0.55), v.mul(flat, L(0.24, 0.42, offer)));
  const side: V3 = v.norm(v.cross(flat, [0, 1, 0]));
  const carry = t < e[9] + 3 ? 1 : 0;
  if (carry) { reach(p, 'L', v.add(boxC, v.mul(side, -0.16)), 1); reach(p, 'R', v.add(boxC, v.mul(side, 0.16)), 1); }
  lookAt(p, poaHead, span(t, c[0] + 0.5, c[0] + 1.8) * (1 - span(t, e[9] + 0.3, e[9] + 0.8)));
  // a glance into the gate's channel when Poa talks about it
  lookAt(p, [0, GATE_Y, WALL_Z - MOAT], span(t, c[3] + 1.2, c[3] + 1.8) * (1 - span(t, c[3] + 4.5, c[3] + 5.2)));
  return { p, boxC, flat, carry };
}
function poaPose(t: number, tagHead: V3) {
  const p = perform(POA_T, t);
  lookAt(p, tagHead, span(t, 1.2, 2.6) * 0.95);
  // he leans to look into the box (nod), then gestures at the channel
  const chk = span(t, c[1] + 2.6, c[1] + 3.2) * (1 - span(t, c[1] + 5.0, c[1] + 5.8));
  if (chk > 0) { lookAt(p, v.add(tagHead, [0, -0.55, 0]), chk); reach(p, 'R', v.add(tagHead, [0.15, -0.5, 0.05]), chk * 0.7); }
  const point = span(t, c[3] + 0.6, c[3] + 1.3) * (1 - span(t, c[3] + 5.0, c[3] + 5.8));
  if (point > 0) { reach(p, 'L', [0.55, GATE_Y - 0.1, WALL_Z + 0.2], point * 0.9); lookAt(p, [0, GATE_Y, WALL_Z - MOAT], point * 0.8); }
  // pats the wall: "鉄筋のおかげで"
  const pat = span(t, c[9] + 0.4, c[9] + 1.0) * (1 - span(t, c[9] + 3.4, c[9] + 4.0));
  if (pat > 0) { const bump = Math.max(0, Math.sin((t - c[9]) * 7)) * 0.04; reach(p, 'L', [GUARD_SPOT[0] + 0.15, 1.35 + bump, WALL_Z + 0.05], pat); lookAt(p, [GUARD_SPOT[0] + 0.2, 1.6, WALL_Z], pat * 0.6); }
  return p;
}
const tagFace = (t: number) => face(t, 1, mouthIn('gate', 'タグ', t), keys(t, [
  [0, { smile: 0.2 }], [c[1], { smile: 0.4, brow: 0.2 }], [c[3] + 1, { brow: 0.4, wide: 0.2 }],
  [c[6] - 0.3, { brow: 0.6, smile: 0.35, tilt: 0.06 }], [c[7] + 2.4, { smile: 0.85, blink: 0.5 }], [c[7] + 5, { smile: 0.45, blink: 0 }],
]));
const poaFace = (t: number) => face(t, 5, mouthIn('gate', 'ポア', t), keys(t, [
  [0, { smile: 0.15 }], [c[1], { smile: 0.5, brow: 0.2 }], [c[1] + 5.6, { smile: 0.25 }],
  [c[3], { brow: 0.3, smile: 0.2 }], [c[7], { brow: 0.4, smile: 0.4, gazeY: -0.3 }], [c[7] + 2.2, { smile: 0.9, blink: 0.6, gazeY: 0 }], [c[7] + 5, { smile: 0.4, blink: 0 }],
  [c[9], { smile: 0.3, brow: 0.1 }],
]));

/** the courier's box (cardboard with a stamped label) */
function boxAt(cam: Camera, cpos: V3, flat: V3) {
  const side = v.norm(v.cross(flat, [0, 1, 0]));
  const w = 0.2, dpt = 0.14, h = 0.18;
  const P = (dx: number, dy: number, dz: number) => cam.proj(v.add(cpos, v.add(v.mul(side, dx), v.add([0, dy, 0], v.mul(flat, dz)))));
  const poly = (pts: ReturnType<typeof P>[], col: string) => { g.fillStyle = col; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath(); g.fill(); };
  poly([P(-w, h, -dpt), P(w, h, -dpt), P(w, h, dpt), P(-w, h, dpt)], '#d9a066');
  const camSide = v.dot(v.sub(cam.pos, cpos), flat) > 0;
  poly([P(-w, -h, camSide ? dpt : -dpt), P(w, -h, camSide ? dpt : -dpt), P(w, h, camSide ? dpt : -dpt), P(-w, h, camSide ? dpt : -dpt)], '#c4874f');
  const sx = v.dot(v.sub(cam.pos, cpos), side) > 0 ? w : -w;
  poly([P(sx, -h, -dpt), P(sx, -h, dpt), P(sx, h, dpt), P(sx, h, -dpt)], '#a8703e');
  const a = P(0, h, -dpt), b = P(0, h, dpt); g.strokeStyle = '#f2d39a'; g.lineWidth = Math.max(1, a.s * 0.015); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
}

/* ---------- inserts ---------- */
/** the pore complex: top view assembling 8 subunits, side view with three rings; 30–100 nm */
function structure(t: number, u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cx = 360, cy = 340, R = 150;
  // top view: eight subunits arriving one by one
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, k = span(u, 0.6 + i * 0.25, 1.1 + i * 0.25);
    if (k <= 0) continue;
    const r = L(R * 1.6, R, k);
    g.save(); g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.rotate(a);
    g.globalAlpha = k; g.fillStyle = '#9c86d0'; g.beginPath(); g.ellipse(0, 0, 44, 32, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-10, -8, 16, 10, 0, 0, 7); g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
  const ch = span(u, 3, 3.8);
  if (ch > 0) { const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 70); gr.addColorStop(0, `rgba(255,226,170,${ch})`); gr.addColorStop(1, 'rgba(255,226,170,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 70, 0, 7); g.fill(); }
  txt('上から見ると', cx, 120, 24, '#bfe0ff', span(u, 0.2, 1));
  txt('8つの部品のリング', cx, 590, 26, '#ffe2a8', span(u, 2.6, 3.4));
  // side view: three rings stacked in the double membrane
  const sx = 900, sy = 340, sv = span(u, 4.2, 5.2);
  if (sv > 0) {
    g.globalAlpha = sv;
    g.fillStyle = '#4a3f62'; g.fillRect(sx - 260, sy - 110, 190, 24); g.fillRect(sx + 70, sy - 110, 190, 24);
    g.fillRect(sx - 260, sy + 86, 190, 24); g.fillRect(sx + 70, sy + 86, 190, 24);
    g.fillStyle = '#1b1530'; g.fillRect(sx - 260, sy - 86, 190, 172); g.fillRect(sx + 70, sy - 86, 190, 172);
    g.globalAlpha = 1;
    const rings: [number, string, string][] = [[-118, '細胞質側のリング', '#b3a2dd'], [0, '中央のリング', '#9c86d0'], [118, '核質側のリング', '#8473b8']];
    rings.forEach(([dy, name, col], i) => {
      const k = span(u, 5 + i * 0.7, 5.6 + i * 0.7); if (k <= 0) return;
      g.globalAlpha = k; g.fillStyle = col; g.beginPath(); g.ellipse(sx - 90, sy + dy, 26, 20, 0, 0, 7); g.ellipse(sx + 90, sy + dy, 26, 20, 0, 0, 7); g.fill(); g.globalAlpha = 1;
      callout(name, sx + 340 - 40, sy + dy - 6, sx + 118, sy + dy, k, '#ffe2a8', 20);
    });
    txt('横から見ると ＝ リングが3つ重なる', sx, 120, 24, '#bfe0ff', sv);
    dim(sx - 120, sy + 170, sx + 120, sy + 170, '全体 30〜100 nm', span(u, 8, 9));
    txt('外核膜', sx - 300, sy - 92, 18, '#cbbce8', sv, 'right'); txt('内核膜', sx - 300, sy + 104, 18, '#cbbce8', sv, 'right');
  }
  txt('核膜孔複合体', W / 2, 60, 34, '#ffffff', span(u, 0.1, 0.8), 'center', MINCHO);
  void t;
}
/** what goes in and what comes out, through a cutaway of the double wall */
function traffic(t: number, u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cx = W / 2, my = 360;
  // membranes with a pore
  g.fillStyle = '#4a3f62'; g.fillRect(0, my - 70, cx - 70, 22); g.fillRect(cx + 70, my - 70, W, 22); g.fillRect(0, my + 48, cx - 70, 22); g.fillRect(cx + 70, my + 48, W, 22);
  g.fillStyle = '#1b1530'; g.fillRect(0, my - 48, cx - 70, 96); g.fillRect(cx + 70, my - 48, W, 96);
  g.fillStyle = '#9c86d0'; [[-70, -59], [70, -59], [-70, 59], [70, 59], [-70, 0], [70, 0]].forEach(([dx, dy]) => { g.beginPath(); g.ellipse(cx + dx, my + dy, 16, 14, 0, 0, 7); g.fill(); });
  txt('細胞質', 160, 150, 26, '#cbbce8', 1); txt('核の中', 160, 610, 26, '#ffe2a8', 1);
  // incoming: from the top down through the pore
  const inK = span(u, 0.2, 1);
  const inItems: [string, string][] = [['ヌクレオチド', '#7fc6ff'], ['ヒストン', '#b48ad8'], ['リボソーム蛋白質', '#e8a05a']];
  inItems.forEach(([n, col], i) => {
    const ph = ((t * 0.35 + i * 0.33) % 1);
    const x = cx - 22 + i * 22, y = L(150, 600, ph);
    g.globalAlpha = inK * Math.sin(ph * Math.PI); g.fillStyle = col; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.globalAlpha = 1;
    txt(n, 330, 210 + i * 40, 24, col, span(u, 0.8 + i * 1.6, 1.6 + i * 1.6), 'left');
  });
  arrow(300, 200, 300, 300, '#bfe0ff', span(u, 0.4, 1.2), 3); txt('入る', 260, 260, 26, '#bfe0ff', inK, 'right');
  // outgoing (from 10 s): from the bottom up
  const outK = span(u, 10.2, 11);
  const outItems: [string, string][] = [['mRNA', '#ff8fb0'], ['tRNA', '#ffb26b'], ['リボソームの亜粒子', '#ffe08a']];
  outItems.forEach(([n, col], i) => {
    const ph = ((t * 0.32 + i * 0.33 + 0.5) % 1);
    const x = cx + 30 - i * 22, y = L(600, 150, ph);
    g.globalAlpha = outK * Math.sin(ph * Math.PI); g.fillStyle = col;
    if (i < 2) { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); for (let k = 0; k < 6; k++) g.lineTo(x + Math.sin(k + t * 3) * 6, y + k * 6); g.stroke(); } else { g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    txt(n, W - 330, 470 + i * 40, 24, col, span(u, 10.8 + i * 1.6, 11.6 + i * 1.6), 'right');
  });
  arrow(W - 300, 560, W - 300, 460, '#ffe2a8', span(u, 10.4, 11.2), 3); txt('出る', W - 260, 520, 26, '#ffe2a8', outK, 'left');
}
/** the nuclear basket under the gate and the lamina behind the inner wall */
function basket(t: number, u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cx = W / 2, my = 250;
  g.fillStyle = '#4a3f62'; g.fillRect(0, my - 60, cx - 60, 18); g.fillRect(cx + 60, my - 60, W, 18); g.fillRect(0, my + 40, cx - 60, 18); g.fillRect(cx + 60, my + 40, W, 18);
  g.fillStyle = '#9c86d0'; [[-60, -51], [60, -51], [-60, 49], [60, 49]].forEach(([dx, dy]) => { g.beginPath(); g.ellipse(cx + dx, my + dy, 14, 12, 0, 0, 7); g.fill(); });
  // basket: eight filaments joined by a distal ring
  const bk = span(u, 0.6, 2.2);
  g.strokeStyle = `rgba(255,226,170,${bk})`; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) { const x0 = cx - 55 + i * 22; g.beginPath(); g.moveTo(x0, my + 60); g.quadraticCurveTo(x0 + (cx - x0) * 0.3, my + 140, cx - 30 + i * 12, my + 190); g.stroke(); }
  g.beginPath(); g.ellipse(cx, my + 192, 34, 8, 0, 0, 7); g.stroke();
  callout('核バスケット（かご）', cx + 260, my + 170, cx + 40, my + 170, span(u, 1.5, 2.5));
  // lamina: a meshwork lining the inner membrane, chromatin holding on to it
  const lm = span(u, 5.5, 7.5);
  if (lm > 0) {
    g.strokeStyle = `rgba(150,210,255,${lm})`; g.lineWidth = 2;
    for (let x = 20; x < W - 20; x += 36) { if (Math.abs(x - cx) < 80) continue; g.beginPath(); g.moveTo(x, my + 64); g.lineTo(x + 36, my + 92); g.moveTo(x + 36, my + 64); g.lineTo(x, my + 92); g.stroke(); }
    callout('核ラミナ（ラミン ＝ 中間径フィラメントの網）', 330, my + 200, 250, my + 80, lm, '#bfe0ff', 22);
    const ck = span(u, 9, 10.5);
    if (ck > 0) { g.strokeStyle = `rgba(180,140,220,${ck})`; g.lineWidth = 6; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { const x0 = 120 + i * 260; g.beginPath(); g.moveTo(x0, my + 92); for (let k = 1; k < 8; k++) g.lineTo(x0 + Math.sin(k * 1.3 + i) * 40, my + 92 + k * 34); g.stroke(); } txt('染色質がつかまる', 930, 640, 24, '#cbbce8', ck); }
  }
  txt('門の内側と、壁の裏', W / 2, 60, 32, '#ffffff', span(u, 0.1, 0.8), 'center', MINCHO);
  void t;
}

/* ---------- shots ---------- */
type Shot = { until: number; cam?: (t: number) => Camera; insert?: (t: number, u: number) => void; from: number };
const SHOTS: Shot[] = [
  { from: 0, until: c[1] - 0.25, cam: (t) => shotCam(t, 0, c[1], [0.8, 1.75, 8.6], [0.4, 1.6, 6.6], [0, 1.35, -2.4], 820) },
  { from: c[1] - 0.25, until: c[2] - 0.2, cam: (t) => shotCam(t, c[1], c[2], [-2.5, 1.55, 1.9], [-2.3, 1.55, 1.7], [1.3, 1.5, -1.0], 900) },
  { from: c[2] - 0.2, until: c[3] - 0.25, insert: structure },
  { from: c[3] - 0.25, until: c[4] - 0.2, cam: (t) => shotCam(t, c[3], c[4], [-1.05, 1.58, 1.65], [-0.75, 1.56, 1.25], [1.0, 1.5, -1.0], 980, 1, [0.7, 1.45, -1.4]) },
  { from: c[4] - 0.2, until: c[6] - 0.3, insert: traffic },
  { from: c[6] - 0.3, until: c[7] - 0.2, cam: (t) => shotCam(t, c[6], c[7], [0.75, 1.5, 0.8], [0.7, 1.5, 0.7], [-0.55, 1.5, -0.35], 1150) },
  { from: c[7] - 0.2, until: c[8] - 0.25, cam: (t) => shotCam(t, c[7], c[8], [-1.0, 1.55, 0.9], [-0.9, 1.55, 0.6], [1.55, 1.55, -1.2], 1050) },
  { from: c[8] - 0.25, until: c[9] - 0.25, insert: basket },
  { from: c[9] - 0.25, until: d + 1, cam: (t) => shotCam(t, c[9], d, [2.6, 1.6, 4.2], [1.4, 1.5, 3.2], [0, 1.4, -2.6], 820) },
];

export function gate(t: number, dd: number) {
  const [shot, i] = pick(SHOTS, t);
  if (shot.insert) { shot.insert(t, t - shot.from); finish(t, 0.45, 0.03); }
  else {
    const cam = shot.cam!(t);
    const p0 = perform(POA_T, t), t0 = perform(TAG_T, t);
    const tg = tagPose(t, headCentre(p0)), po = poaPose(t, headCentre(t0));
    gateSet(cam, t, { channel: 0.55 + 0.35 * span(t, c[3], c[3] + 1.5) * (1 - span(t, e[3], e[3] + 1)), highlight: 0 });
    const dT = v.len(v.sub(tg.p.p[J.chest], cam.pos)), dP = v.len(v.sub(po.p[J.chest], cam.pos));
    const drawTag = () => { drawActor(cam, { look: TAG, pose: tg.p, face: tagFace(t), t, light: 1 }); if (tg.carry) boxAt(cam, tg.boxC, tg.flat); };
    const drawPoa = () => drawActor(cam, { look: POA, pose: po, face: poaFace(t), t, light: -1 });
    if (dT > dP) { drawTag(); drawPoa(); } else { drawPoa(); drawTag(); }
    darkness(0.62, gateLamps(cam, t));
    finish(t, 0.55, 0.035);
  }
  SHOTS.forEach((s, k) => { if (k > 0) dip(t, s.from, 0.22, 0.55); });
  if (t < 0.7) { g.fillStyle = `rgba(4,5,8,${1 - t / 0.7})`; g.fillRect(0, 0, W, H); }
  if (t > dd - 0.8) { g.fillStyle = `rgba(4,5,8,${(t - (dd - 0.8)) / 0.8})`; g.fillRect(0, 0, W, H); }
  void i; void d;
}
