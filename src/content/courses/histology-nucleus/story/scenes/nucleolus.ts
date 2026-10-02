/**
 * Scene 4「組立室の三つの部屋」(nucleolus): pink light at the back of the archive → Nor: "put it there…
 * not bad" → the three rooms (fibrillar centre, dense fibrillar component, granular component) → rDNA in
 * the fibrillar centre (nucleolar organizer), RNA polymerase I → the radioactive uridine trail →
 * subunits assembled from rRNA + the ribosomal proteins Tag brought → "a long way round" → they leave
 * through Poa's gate; the ribosome is finished outside.
 */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { perform, reach, lookAt, headCentre, J, v, type Take, type V3, type Camera } from '../../../../../engine/story/mocap';
import { drawActor } from '../../../../../engine/story/body';
import { darkness, finish } from '../../../../../engine/story/light';
import { face, keys, pick, shotCam, span, faceTo } from '../../../../../engine/story/act';
import { HEIGHT, NOR, TAG } from '../cast';
import { cues, mouthIn } from '../film';
import { ARCH, CENTRE, R_DFC, R_FC, R_GC, subunit, workshop, workshopLamps } from '../sets/workshop';
import { arrow, blueprint, callout, dip, txt, MINCHO } from '../sets/ink';
import { boxAt, carryBox } from './props';

const { c, d } = cues('nucleolus');
const START: V3 = [ARCH[0] - 1.2, 0, ARCH[2]];
const T_STOP: V3 = [1.25, 0, 0.85];
const N_SPOT: V3 = [2.3, 0, -1.05];
const BOX_ON_BENCH: V3 = [1.8, 1.07, 0.0];

const TAG_T: Take[] = [
  { clip: 'walk', at: 0.6, from: 0.1, x: START[0], z: START[2], face: faceTo(START, T_STOP), travel: true, h: HEIGHT.TAG },
  { clip: 'stand2', at: 8.6, from: 2, x: T_STOP[0], z: T_STOP[2], face: faceTo(T_STOP, N_SPOT), h: HEIGHT.TAG, blend: 0.9 },
  { clip: 'stand', at: 30, from: 7, x: T_STOP[0], z: T_STOP[2], face: faceTo(T_STOP, N_SPOT), h: HEIGHT.TAG, blend: 1.5 },
];
const NOR_T: Take[] = [
  { clip: 'stand', at: -3, from: 9, x: N_SPOT[0], z: N_SPOT[2], face: faceTo(N_SPOT, [0, 0, 1.5]), h: HEIGHT.NOR },
  { clip: 'stand', at: c[1] - 0.8, from: 1, x: N_SPOT[0], z: N_SPOT[2], face: faceTo(N_SPOT, T_STOP), h: HEIGHT.NOR, blend: 1.0 },
  { clip: 'explain', at: c[4] - 0.3, from: 3, x: N_SPOT[0], z: N_SPOT[2], face: faceTo(N_SPOT, T_STOP), h: HEIGHT.NOR, blend: 0.8 },
  { clip: 'stand', at: c[7] - 0.3, from: 3, x: N_SPOT[0], z: N_SPOT[2], face: faceTo(N_SPOT, T_STOP), h: HEIGHT.NOR, blend: 1.0 },
];

function tag(t: number, norHead: V3) {
  const p = perform(TAG_T, t);
  const put = span(t, c[1] + 3.2, c[1] + 4.3);
  let box: { c: V3; fwd: V3 } | null = null;
  if (t < c[1] + 4.3) {
    const fwd = t < 8.6 ? v.norm(v.sub(T_STOP, START)) : v.norm(v.sub(BOX_ON_BENCH, p.p[J.pelvis]));
    const held = carryBox(p, fwd, 0.26);
    box = { c: v.lerp(held.c, BOX_ON_BENCH, put), fwd: held.fwd };
    if (put > 0) { const side = v.norm(v.cross(held.fwd, [0, 1, 0])); reach(p, 'L', v.add(box.c, v.mul(side, -0.17)), 1); reach(p, 'R', v.add(box.c, v.mul(side, 0.17)), 1); }
  }
  const hc = headCentre(p);
  lookAt(p, [CENTRE[0], 1.6, CENTRE[2]], span(t, 2.5, 4) * (1 - span(t, 7.5, 8.5)));
  lookAt(p, norHead, span(t, 8.2, 9.2));
  lookAt(p, BOX_ON_BENCH, span(t, c[1] + 3.0, c[1] + 3.5) * (1 - span(t, c[1] + 4.6, c[1] + 5.2)) * 0.8);
  void hc;
  return { p, box };
}
function nor(t: number, tagHead: V3) {
  const p = perform(NOR_T, t);
  // he lifts a part out of the box and holds it to the light
  const dig = span(t, c[1] + 4.8, c[1] + 5.5) * (1 - span(t, c[1] + 8.4, c[1] + 9.2));
  const hold = span(t, c[1] + 5.6, c[1] + 6.3);
  if (dig > 0) reach(p, 'R', v.lerp(v.add(BOX_ON_BENCH, [0, 0.12, 0]), v.add(headCentre(p), [0.0, -0.12, 0.32]), hold), dig);
  lookAt(p, tagHead, span(t, c[1] - 0.8, c[1]) * 0.95);
  if (dig > 0) lookAt(p, v.lerp(BOX_ON_BENCH, p.p[J.handR], hold), dig);
  return { p, part: dig > 0.5 && hold > 0.3 };
}
const tagFace = (t: number) => face(t, 1, mouthIn('nucleolus', 'タグ', t), keys(t, [[0, { brow: 0.3, wide: 0.2 }], [c[1], { brow: 0.1, wide: 0, smile: 0.2 }], [c[6] - 0.3, { smile: 0.5, brow: 0.3 }], [c[7], { smile: 0.35 }]]));
const norFace = (t: number) => face(t, 6, mouthIn('nucleolus', 'ノル', t), keys(t, [[0, { brow: -0.2 }], [c[1] + 5.6, { brow: 0.3, gazeY: 0.2 }], [c[1] + 6.4, { smile: 0.55, brow: 0.1 }], [c[4], { smile: 0.2 }], [c[7], { smile: 0.5, blink: 0.25 }]]));

/* ---------- inserts ---------- */
function rdna(u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cx = 640, cy = 380;
  g.fillStyle = 'rgba(233,214,200,.12)'; g.beginPath(); g.arc(cx, cy, 250, 0, 7); g.fill();
  txt('線維中心', cx, cy + 290, 24, '#e9d6c8', span(u, 0.2, 0.8));
  // a gene stretched across, polymerases marching along with growing pink rRNA
  const gk = span(u, 0.5, 1.5);
  g.strokeStyle = `rgba(120,190,255,${gk})`; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 300, cy); g.lineTo(cx + 300, cy); g.stroke();
  callout('リボソームRNAの遺伝子をもつDNA ＝ 核小体形成領域', cx - 150, cy - 230, cx - 220, cy, span(u, 2.5, 3.3), '#bfe0ff', 22);
  const pk = span(u, 6.5, 7.5);
  for (let i = 0; i < 12; i++) {
    const x = cx - 270 + i * 46, len = 14 + i * 13 * pk;
    if (pk <= 0) break;
    g.fillStyle = `rgba(120,220,150,${pk})`; g.beginPath(); g.arc(x, cy, 8, 0, 7); g.fill();
    g.strokeStyle = `rgba(255,140,180,${pk})`; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, cy - 8); for (let s = 0; s <= 10; s++) g.lineTo(x + Math.sin(s * 0.9 + i) * 5, cy - 8 - (s / 10) * len); g.stroke();
  }
  callout('RNAポリメラーゼⅠ', cx + 330, cy + 120, cx + 236, cy + 8, span(u, 8, 8.8), '#9eeab2', 22);
  callout('リボソームRNA（写し取られる）', cx + 300, cy - 210, cx + 236, cy - 120, span(u, 10, 10.8), '#ff9ec0', 22);
  txt('線維中心の仕事', W / 2, 56, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}
function pulse(u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cx = 560, cy = 380;
  const ring = (r0: number, r1: number, col: string) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r1, 0, 7); g.arc(cx, cy, r0, 0, 7, true); g.fill(); };
  ring(150, 240, 'rgba(240,170,190,.18)'); ring(85, 150, 'rgba(200,80,120,.3)'); ring(0, 85, 'rgba(233,214,200,.25)');
  txt('線維中心', cx, cy + 6, 20, '#e9d6c8', 1); txt('線維部', cx, cy - 112, 20, '#ff9ec0', 1); txt('顆粒部', cx, cy - 190, 20, '#f2c27a', 1); txt('核質', cx + 330, cy - 200, 22, '#bfe0ff', 1);
  // the label travels outward: FC → DFC → GC → nucleoplasm
  const stops: [number, number][] = [[0, 30], [3, 118], [6, 196], [9, 300]];
  let r = 30; for (let i = 0; i < stops.length - 1; i++) { const k = span(u, 1.5 + stops[i][0], 1.5 + stops[i + 1][0]); r = L(r, stops[i + 1][1], k); }
  const on = span(u, 0.6, 1.4);
  for (let i = 0; i < 10; i++) { const a = i * 0.63 + u * 0.15; g.fillStyle = `rgba(255,236,120,${on})`; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, 7, 0, 7); g.fill(); }
  const steps = ['線維中心', '線維部', '顆粒部', '核質'];
  steps.forEach((s, i) => { const k = span(u, 1.5 + i * 3, 2.3 + i * 3); txt(s, 1010, 230 + i * 70, 26, i === 3 ? '#bfe0ff' : '#ffe2a8', k); if (i) arrow(1010, 186 + i * 70, 1010, 206 + i * 70, '#ffe2a8', k, 3); });
  txt('放射性ウリジンの印を追う', W / 2, 56, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}
function assemble(u: number) {
  g.drawImage(blueprint(), 0, 0);
  // rRNA ribbons (pink) + ribosomal proteins (orange beads from Tag's box) → two subunits
  const ink = span(u, 0.4, 1.2);
  g.strokeStyle = `rgba(255,140,180,${ink})`; g.lineWidth = 6; for (let k = 0; k < 2; k++) { g.beginPath(); for (let s = 0; s <= 30; s++) g.lineTo(150 + s * 9, 260 + k * 120 + Math.sin(s * 0.6 + k) * 18); g.stroke(); }
  txt('リボソームRNA', 280, 220, 24, '#ff9ec0', ink);
  const pk = span(u, 2, 3);
  g.fillStyle = `rgba(232,160,90,${pk})`; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(170 + (i % 7) * 36, 520 + Math.floor(i / 7) * 34, 12, 0, 7); g.fill(); }
  txt('リボソーム蛋白質（タグが運んだ部品）', 290, 610, 22, '#f2c27a', pk);
  const mk = span(u, 4, 6.5);
  arrow(560, 380, 720, 380, '#ffe2a8', mk, 4);
  if (mk > 0.5) {
    const k = (mk - 0.5) * 2;
    g.globalAlpha = k;
    g.fillStyle = '#e8a05a'; g.beginPath(); g.ellipse(900, 330, 120, 90, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,140,180,.6)'; for (let s = 0; s < 6; s++) { g.beginPath(); g.arc(860 + s * 18, 320 + Math.sin(s) * 30, 10, 0, 7); g.fill(); }
    g.fillStyle = '#f2c27a'; g.beginPath(); g.ellipse(900, 500, 80, 56, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,140,180,.6)'; for (let s = 0; s < 4; s++) { g.beginPath(); g.arc(875 + s * 18, 498 + Math.sin(s) * 18, 8, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    txt('大亜粒子', 1080, 340, 26, '#ffe2a8', k, 'left'); txt('小亜粒子', 1020, 510, 26, '#ffe2a8', k, 'left');
  }
  txt('顆粒部で組み合わせる', W / 2, 56, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}

/* ---------- shots ---------- */
type Shot = { from: number; until: number; cam?: (t: number) => Camera; insert?: (u: number) => void };
const SHOTS: Shot[] = [
  { from: 0, until: c[1] - 0.2, cam: (t) => shotCam(t, 0, c[1], [4.2, 2.8, 4.8], [3.4, 2.2, 3.8], [-3.6, 1.1, 0.6], 780, 0.6, [-0.6, 1.2, 0.4]) },
  { from: c[1] - 0.2, until: c[2] - 0.2, cam: (t) => shotCam(t, c[1], c[2], [4.0, 1.6, 2.2], [3.7, 1.55, 1.8], [1.7, 1.3, -0.15], 900) },
  { from: c[2] - 0.2, until: c[3] - 0.2, cam: (t) => shotCam(t, c[2], c[3], [0.6, 6.4, 3.4], [0.3, 5.8, 2.6], [CENTRE[0], 0, CENTRE[2]], 760) },
  { from: c[3] - 0.2, until: c[4] - 0.2, insert: rdna },
  { from: c[4] - 0.2, until: c[4] + 4.2, cam: (t) => shotCam(t, c[4], c[4] + 4.2, [0.5, 1.62, 0.4], [0.6, 1.62, 0.25], [2.3, 1.62, -1.05], 1150) },
  { from: c[4] + 4.2, until: c[5] - 0.2, insert: (u) => pulse(u + 4.4) },
  { from: c[5] - 0.2, until: c[6] - 0.2, insert: assemble },
  { from: c[6] - 0.2, until: c[7] - 0.2, cam: (t) => shotCam(t, c[6], c[7], [2.55, 1.55, -0.2], [2.45, 1.55, -0.1], [1.25, 1.5, 0.85], 1150) },
  { from: c[7] - 0.2, until: c[8] - 0.2, cam: (t) => shotCam(t, c[7], c[8], [0.8, 1.64, 0.1], [0.9, 1.64, -0.02], [2.3, 1.66, -1.05], 1300) },
  { from: c[8] - 0.2, until: d + 1, cam: (t) => shotCam(t, c[8], d, [3.6, 3.6, 4.6], [2.6, 3.0, 4.0], [-3.8, 0.6, 1.0], 780) },
];

export function nucleolusScene(t: number, dd: number) {
  const [shot, i] = pick(SHOTS, t);
  if (shot.insert) { shot.insert(t - shot.from); finish(t, 0.45, 0.03); }
  else {
    const cam = shot.cam!(t);
    const n0 = perform(NOR_T, t), t0 = perform(TAG_T, t);
    const tg = tag(t, headCentre(n0)), nr = nor(t, headCentre(t0));
    workshop(cam, t, { flow: i === 9 ? 1.5 : 0.5 });
    const boxNow = tg.box ?? { c: BOX_ON_BENCH, fwd: v.norm(v.sub(BOX_ON_BENCH, T_STOP)) };
    const order = [
      { d: v.len(v.sub(tg.p.p[J.chest], cam.pos)), f: () => drawActor(cam, { look: TAG, pose: tg.p, face: tagFace(t), t, light: 1 }) },
      { d: v.len(v.sub(nr.p.p[J.chest], cam.pos)), f: () => { drawActor(cam, { look: NOR, pose: nr.p, face: norFace(t), t, light: -1 }); if (nr.part) subunit(cam, v.add(nr.p.p[J.handR], [0, 0.04, 0]), false); } },
      { d: v.len(v.sub(boxNow.c, cam.pos)), f: () => boxAt(cam, boxNow.c, boxNow.fwd) },
    ].sort((a, b) => b.d - a.d);
    order.forEach((o) => o.f());
    darkness(0.45, workshopLamps(cam, t));
    if (i === 2) {
      const u = t - shot.from, at = (r: number, a: number) => cam.proj([CENTRE[0] + Math.sin(a) * r, 0.05, CENTRE[2] + Math.cos(a) * r]);
      const f = at(R_FC * 0.4, 2.2), dd2 = at((R_FC + R_DFC) / 2, 1.0), gg = at((R_DFC + R_GC) / 2, -0.9);
      callout('線維中心', f.x - 260, f.y - 120, f.x, f.y, span(u, 1.4, 2.0), '#f4e6dc');
      callout('線維部', dd2.x + 220, dd2.y - 90, dd2.x, dd2.y, span(u, 3.0, 3.6), '#ff9ec0');
      callout('顆粒部', gg.x - 240, gg.y + 90, gg.x, gg.y, span(u, 4.6, 5.2), '#f2c27a');
    }
    if (i === 9) {
      const u = t - shot.from, a = cam.proj([ARCH[0] - 1.8, 1.4, ARCH[2]]);
      callout('亜粒子は門（核膜孔）から細胞質へ', a.x + 200, a.y - 150, a.x, a.y, span(u, 1, 1.8));
      txt('リボソームが完成するのは、外に出てから', W / 2, 660, 26, '#ffe2a8', span(u, 5.5, 6.3));
    }
    finish(t, 0.5, 0.035);
  }
  SHOTS.forEach((s, k) => { if (k > 0) dip(t, s.from, 0.22, 0.55); });
  void dd; void H;
}
