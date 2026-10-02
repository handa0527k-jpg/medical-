/**
 * Scene 1「午前二時の本社ビル」: 2 a.m., the cell city asleep; Tag walks the rough-ER corridor with his
 * box → his name and job → "the box is a little heavy tonight" → the double wall and the moat (outer /
 * inner nuclear membrane, perinuclear space) → the outer wall runs straight into the rough ER →
 * inside: chromatin, nucleolus, nucleoplasm → H&E (all purple) → methyl green–pyronin (DNA green, RNA pink).
 */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { perform, lookAt, headCentre, J, v, type Take, type V3, type Camera } from '../../../../../engine/story/mocap';
import { drawActor } from '../../../../../engine/story/body';
import { darkness, finish } from '../../../../../engine/story/light';
import { face, keys, pick, shotCam, span } from '../../../../../engine/story/act';
import { HEIGHT, TAG } from '../cast';
import { cues, mouthIn } from '../film';
import { CORR_X, GATE_Z, HQ, H_IN, H_OUT, R_IN, R_OUT, city, cityLamps } from '../sets/city';
import { blueprint, callout, dip, txt, MINCHO } from '../sets/ink';
import { boxAt, carryBox } from './props';

const { c, d } = cues('hq');
const Z0 = 27;
const TAG_T: Take[] = [{ clip: 'walk', at: -1.5, from: 0, x: 0.35, z: Z0, face: Math.PI, travel: true, h: HEIGHT.TAG }];
const tagZ = (t: number) => perform(TAG_T, t).p[J.pelvis][2];

function tag(t: number) {
  const p = perform(TAG_T, t);
  const fwd: V3 = [0, 0, -1];
  // "箱は少し重い": he hitches the box up once
  const hitch = span(t, c[2] + 0.6, c[2] + 1.0) * (1 - span(t, c[2] + 1.0, c[2] + 1.6));
  const box = carryBox(p, fwd, 0.26, hitch * 0.08);
  const hc = headCentre(p);
  lookAt(p, v.add(box.c, [0, 0, 0]), span(t, c[2] + 0.2, c[2] + 0.8) * (1 - span(t, c[2] + 2.2, c[2] + 3.0)) * 0.7);
  lookAt(p, [hc[0] + 0.5, H_IN * 0.6, HQ[2]], span(t, c[3] - 1, c[3]) * 0.6);
  return { p, box };
}
const tagFace = (t: number) => face(t, 1, mouthIn('hq', 'タグ', t), keys(t, [[0, { smile: 0.15 }], [c[2], { smile: 0.4, brow: 0.2, gazeY: 0.3 }], [c[2] + 3, { smile: 0.3, gazeY: 0 }]]));

/* ---------- inserts ---------- */
function inside(u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cx = W / 2, cy = 380, r = 250;
  g.fillStyle = 'rgba(200,180,230,.08)'; g.beginPath(); g.ellipse(cx, cy, r + 26, r * 0.82 + 26, 0, 0, 7); g.fill();
  g.strokeStyle = '#a492cc'; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, cy, r + 14, r * 0.82 + 14, 0, 0, 7); g.stroke(); g.beginPath(); g.ellipse(cx, cy, r, r * 0.82, 0, 0, 7); g.stroke();
  // nucleoplasm, chromatin threads (dense clumps at the rim), nucleolus
  const np = span(u, 2.6, 3.4); g.fillStyle = `rgba(160,140,210,${0.18 * np + 0.05})`; g.beginPath(); g.ellipse(cx, cy, r - 4, r * 0.82 - 4, 0, 0, 7); g.fill();
  const ch = span(u, 0.4, 1.4);
  if (ch > 0) {
    g.strokeStyle = `rgba(190,160,240,${0.8 * ch})`; g.lineWidth = 2.5;
    for (let k = 0; k < 14; k++) { g.beginPath(); let x = cx + Math.cos(k * 2.1) * r * 0.6, y = cy + Math.sin(k * 2.7) * r * 0.45; g.moveTo(x, y); for (let s = 0; s < 14; s++) { x += Math.cos(k + s * 0.9) * 16; y += Math.sin(k * 1.7 + s * 1.1) * 14; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = `rgba(120,90,170,${0.9 * ch})`; for (let k = 0; k < 12; k++) { const a = k * 0.53; g.beginPath(); g.ellipse(cx + Math.cos(a) * (r - 22), cy + Math.sin(a) * (r * 0.82 - 20), 22, 10, a, 0, 7); g.fill(); }
  }
  const nu = span(u, 1.6, 2.4); if (nu > 0) { g.fillStyle = `rgba(110,70,150,${nu})`; g.beginPath(); g.arc(cx + 70, cy - 30, 58 * nu, 0, 7); g.fill(); }
  callout('染色質', 220, 200, cx - 150, cy - 60, ch); callout('核小体', 1060, 210, cx + 110, cy - 50, nu); callout('核質', 1040, 600, cx + 130, cy + 120, np);
  txt('本社の中', W / 2, 64, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}
/** a field of cells under the microscope; k = 0 H&E → 1 methyl green–pyronin */
function microscope(u: number, k: number) {
  g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, W, H);
  const cx = W / 2, cy = 360, R = 330;
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
  const bg = k < 0.5 ? '#f3d6e2' : '#f5ece8'; g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const cyto = (a: number) => (k < 0.5 ? `rgba(225,120,160,${a})` : `rgba(230,140,170,${a * 0.75})`);
  const chromCol = k < 0.5 ? '#5a2f86' : '#2f8a4a', nuclCol = k < 0.5 ? '#4a2470' : '#d23a6a';
  for (let i = 0; i < 9; i++) {
    const x = cx - 260 + (i % 3) * 260 + ((i * 37) % 40), y = cy - 230 + Math.floor(i / 3) * 230 + ((i * 53) % 30);
    g.fillStyle = cyto(0.55 + 0.1 * (i % 2)); g.beginPath(); g.ellipse(x, y, 120, 96, i * 0.4, 0, 7); g.fill();
    g.fillStyle = k < 0.5 ? 'rgba(110,60,150,.55)' : 'rgba(80,160,100,.35)'; g.beginPath(); g.ellipse(x, y, 52, 44, 0, 0, 7); g.fill();
    g.fillStyle = chromCol; for (let s = 0; s < 9; s++) { g.beginPath(); g.arc(x + Math.cos(s * 2.4 + i) * 34, y + Math.sin(s * 1.9 + i) * 28, 6, 0, 7); g.fill(); }
    g.fillStyle = nuclCol; g.beginPath(); g.arc(x + 10, y - 6, 12, 0, 7); g.fill();
  }
  g.restore();
  g.strokeStyle = '#222'; g.lineWidth = 18; g.beginPath(); g.arc(cx, cy, R + 9, 0, 7); g.stroke();
  if (k < 0.5) {
    txt('HE 染色', 150, 300, 40, '#ffffff', span(u, 0.1, 0.7), 'center', MINCHO); txt('ヘマトキシリン', 150, 350, 22, '#e3c8ff', span(u, 0.3, 0.9)); txt('・エオジン', 150, 380, 22, '#ffc0d8', span(u, 0.3, 0.9));
    txt('染色質も', 1130, 330, 28, '#e3c8ff', span(u, 2.5, 3.3)); txt('核小体も 紫', 1130, 370, 28, '#e3c8ff', span(u, 2.5, 3.3));
  } else {
    txt('MG・P 染色', 150, 300, 36, '#ffffff', span(u, 0.1, 0.7), 'center', MINCHO); txt('メチルグリーン', 150, 350, 22, '#9eeab2', span(u, 0.3, 0.9)); txt('・ピロニン', 150, 380, 22, '#ffb0cc', span(u, 0.3, 0.9));
    txt('DNA ＝ 緑', 1130, 330, 32, '#7ee09a', span(u, 4.5, 5.3)); txt('RNA ＝ ピンク', 1130, 380, 32, '#ff9ec0', span(u, 6.0, 6.8));
  }
}

/* ---------- shots ---------- */
type Shot = { from: number; until: number; cam?: (t: number) => Camera; insert?: (u: number) => void };
const SHOTS: Shot[] = [
  { from: 0, until: c[1] - 0.2, cam: (t) => shotCam(t, 0, c[1], [9, 16, 44], [6, 7.5, 36], [0, 4, -30], 820, 0.5, [0, 2.5, -20]) },
  { from: c[1] - 0.2, until: c[2] - 0.2, cam: (t) => { const z = tagZ(t); return shotCam(t, c[1], c[2], [3.6, 1.45, z + 1.4], [3.6, 1.45, z + 0.6], [0.3, 1.2, z - 0.4], 900); } },
  { from: c[2] - 0.2, until: c[3] - 0.2, cam: (t) => { const z = tagZ(t); return shotCam(t, c[2], c[3], [0.0, 1.55, z - 2.6], [0.05, 1.55, z - 2.2], [0.35, 1.45, z], 1100); } },
  { from: c[3] - 0.2, until: c[4] - 0.2, cam: (t) => shotCam(t, c[3], c[4], [26, 19, -10], [24, 17, -14], [4, 4, -34], 800) },
  { from: c[4] - 0.2, until: c[5] - 0.2, cam: (t) => shotCam(t, c[4], c[5], [9, 5, -12], [7, 4, -15], [1.6, 1.5, GATE_Z + 1], 820) },
  { from: c[5] - 0.2, until: c[6] - 0.2, insert: inside },
  { from: c[6] - 0.2, until: c[7] - 0.2, insert: (u) => microscope(u, 0) },
  { from: c[7] - 0.2, until: d + 1, insert: (u) => microscope(u, 1) },
];

export function hq(t: number, dd: number) {
  const [shot] = pick(SHOTS, t);
  if (shot.insert) { shot.insert(t - shot.from); finish(t, 0.45, 0.03); }
  else {
    const cam = shot.cam!(t);
    const tg = tag(t);
    city(cam, t);
    if (cam.pos[1] < 5 || shot === SHOTS[0]) { drawActor(cam, { look: TAG, pose: tg.p, face: tagFace(t), t, light: 1 }); boxAt(cam, tg.box.c, tg.box.fwd); }
    darkness(0.55, cityLamps(cam, t));
    // callouts on the walls
    if (shot === SHOTS[3]) {
      const u = t - shot.from, a = Math.PI * 0.42;
      const o = cam.proj([HQ[0] + Math.sin(a) * R_OUT, H_OUT, HQ[2] + Math.cos(a) * R_OUT]);
      const m = cam.proj([HQ[0] + Math.sin(a) * (R_OUT + R_IN) / 2, 0.2, HQ[2] + Math.cos(a) * (R_OUT + R_IN) / 2]);
      const i = cam.proj([HQ[0] + Math.sin(a) * R_IN, H_IN * 0.8, HQ[2] + Math.cos(a) * R_IN]);
      callout('外核膜（外壁）', o.x + 230, o.y - 60, o.x, o.y, span(u, 2.5, 3.3));
      callout('核周囲腔（堀）', m.x + 250, m.y + 70, m.x, m.y, span(u, 6.5, 7.3));
      callout('内核膜（内壁）', i.x - 40, i.y - 110, i.x, i.y, span(u, 4.0, 4.8));
    }
    if (shot === SHOTS[4]) {
      const u = t - shot.from, j = cam.proj([CORR_X, 1.5, GATE_Z + 3]), w = cam.proj([CORR_X + 3, 3.5, GATE_Z - 0.6]);
      callout('粗面小胞体の廊下（壁の粒 ＝ リボソーム）', j.x - 120, j.y + 150, j.x, j.y, span(u, 1, 1.8));
      callout('外壁とそのままつながっている', w.x + 120, w.y - 90, w.x, w.y, span(u, 4, 4.8));
    }
    finish(t, 0.55, 0.035);
  }
  SHOTS.forEach((s, k) => { if (k > 0) dip(t, s.from, 0.22, 0.55); });
  // opening: from black, the time caption
  if (t < 1.4) { g.fillStyle = `rgba(4,5,8,${1 - t / 1.4})`; g.fillRect(0, 0, W, H); }
  const cap = span(t, 1.2, 2.2) * (1 - span(t, c[1] - 1.5, c[1] - 0.5));
  if (cap > 0) txt('午前2時', 70, 640, 30, '#f4efe6', cap, 'left');
  void dd; void L;
}
