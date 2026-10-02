/**
 * Scene 3「書庫の糸巻き」(chromatin): through the gate into the archive → Histo: "quiet, please" →
 * she winds DNA onto histone spools (nucleosome) → 10 nm beads on a string; DNA cut in multiples of
 * ~200 bp → H1, 30 nm fibre, loops, higher helix → euchromatin (open, readable) vs heterochromatin
 * (sealed, inactive) → constitutive / facultative → the Barr body → "kept even if not read".
 */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { perform, reach, lookAt, headCentre, J, v, type Take, type V3, type Camera } from '../../../../../engine/story/mocap';
import { drawActor } from '../../../../../engine/story/body';
import { darkness, finish } from '../../../../../engine/story/light';
import { face, keys, pick, shotCam, span, faceTo } from '../../../../../engine/story/act';
import { HEIGHT, HISTO, TAG } from '../cast';
import { cues, mouthIn } from '../film';
import { ENTRANCE, TABLE, archive, archiveLamps, spool3 } from '../sets/archive';
import { blueprint, callout, dim, dip, txt, MINCHO } from '../sets/ink';
import { boxAt, carryBox } from './props';

const { c, e, d } = cues('archive');
const H_SPOT: V3 = [TABLE[0] + 0.1, 0, TABLE[2] - 0.75];
const T_STOP: V3 = [-0.2, 0, 0.15];
const START: V3 = [ENTRANCE[0], 0, ENTRANCE[2] + 0.8];

const TAG_T: Take[] = [
  { clip: 'walk', at: 0.2, from: 0.2, x: START[0], z: START[2], face: faceTo(START, T_STOP), travel: true, h: HEIGHT.TAG },
  { clip: 'stand2', at: 8.6, from: 1, x: T_STOP[0], z: T_STOP[2], face: faceTo(T_STOP, H_SPOT), h: HEIGHT.TAG, blend: 0.9 },
  { clip: 'stand', at: 40, from: 5, x: T_STOP[0], z: T_STOP[2], face: faceTo(T_STOP, H_SPOT) - 0.2, h: HEIGHT.TAG, blend: 1.5 },
];
const HIS_T: Take[] = [
  { clip: 'coil', at: -3, from: 0, x: H_SPOT[0], z: H_SPOT[2], face: faceTo(H_SPOT, [TABLE[0], 0, TABLE[2] + 1]), h: HEIGHT.HISTO },
  { clip: 'stand2', at: c[1] - 0.6, from: 3, x: H_SPOT[0], z: H_SPOT[2], face: faceTo(H_SPOT, T_STOP), h: HEIGHT.HISTO, blend: 0.8 },
  { clip: 'coil', at: c[2] - 0.2, from: 4, x: H_SPOT[0], z: H_SPOT[2], face: faceTo(H_SPOT, [TABLE[0], 0, TABLE[2] + 1]), h: HEIGHT.HISTO, blend: 0.8 },
  { clip: 'explain', at: c[4] - 0.3, from: 1, x: H_SPOT[0], z: H_SPOT[2], face: faceTo(H_SPOT, T_STOP), h: HEIGHT.HISTO, blend: 0.8 },
  { clip: 'explain', at: c[6] - 0.3, from: 6, x: H_SPOT[0], z: H_SPOT[2], face: faceTo(H_SPOT, T_STOP), h: HEIGHT.HISTO, blend: 0.8 },
  { clip: 'stand2', at: e[6] + 0.3, from: 4, x: H_SPOT[0], z: H_SPOT[2], face: faceTo(H_SPOT, T_STOP), h: HEIGHT.HISTO, blend: 1.0 },
];

function tag(t: number, hisHead: V3) {
  const p = perform(TAG_T, t);
  const toH = v.norm(v.sub(H_SPOT, p.p[J.pelvis]));
  const box = carryBox(p, t < 8.6 ? v.norm([toH[0], 0, toH[2]]) : toH, 0.26);
  const hc = headCentre(p);
  // looks up at the shelves while walking in, then at Histo
  lookAt(p, [hc[0] + 1.5, 4.5, -6], span(t, 1.5, 3) * (1 - span(t, 6.5, 7.5)));
  lookAt(p, hisHead, span(t, 7.5, 8.5));
  return { p, box };
}
function histo(t: number, tagHead: V3) {
  const p = perform(HIS_T, t);
  // "静かにね": finger to lips
  const sh = span(t, c[1] + 1.4, c[1] + 1.9) * (1 - span(t, c[1] + 3.6, c[1] + 4.2));
  const hc = headCentre(p);
  if (sh > 0) reach(p, 'R', v.add(hc, v.add(v.mul(v.norm(v.sub(tagHead, hc)), 0.12), [0, -0.09, 0])), sh);
  const winding = (t > c[2] - 0.2 && t < c[4] - 0.3) || t < c[1] - 0.6;
  lookAt(p, winding ? [TABLE[0], 0.95, TABLE[2]] : tagHead, 0.85);
  return { p, winding };
}
const tagFace = (t: number) => face(t, 1, mouthIn('archive', 'タグ', t), keys(t, [[0, { brow: 0.4, wide: 0.3 }], [c[1], { brow: 0.3, wide: 0, smile: 0.2 }], [c[8] - 0.3, { smile: 0.35, brow: 0.2, tilt: 0.05 }]]));
const hisFace = (t: number) => face(t, 4, mouthIn('archive', 'ヒスト', t), keys(t, [[0, { gazeY: 0.6 }], [c[1], { smile: 0.55, gazeY: 0, brow: 0.2 }], [c[2], { smile: 0.2, gazeY: 0.6 }], [c[4], { smile: 0.3, gazeY: 0 }], [c[9], { smile: 0.7, blink: 0.3 }]]));

/** the spool she is winding, between her hands */
function windingSpool(cam: Camera, p: ReturnType<typeof histo>['p'], t: number) {
  const l = p.p[J.handL], r = p.p[J.handR];
  const m: V3 = [(l[0] + r[0]) / 2, Math.max(0.9, (l[1] + r[1]) / 2), (l[2] + r[2]) / 2];
  spool3(cam, m, 0.12, t * 2, 0.6);
}

/* ---------- inserts ---------- */
function beads(u: number) {
  g.drawImage(blueprint(), 0, 0);
  // an electron micrograph look: grey field, beads on a string
  g.save(); g.beginPath(); g.rect(80, 120, 560, 460); g.clip();
  g.fillStyle = '#8a8a86'; g.fillRect(80, 120, 560, 460);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},.05)`; g.fillRect(80 + ((i * 97) % 560), 120 + ((i * 61) % 460), 3, 3); }
  const k = span(u, 0.3, 2);
  g.strokeStyle = '#2a2a28'; g.lineWidth = 2.5; g.beginPath();
  for (let s = 0; s <= 60 * k; s++) { const x = 110 + s * 8.5, y = 350 + Math.sin(s * 0.35) * 60 + Math.cos(s * 0.13) * 40; if (s) g.lineTo(x, y); else g.moveTo(x, y); }
  g.stroke();
  for (let s = 3; s <= 60 * k; s += 5) { const x = 110 + s * 8.5, y = 350 + Math.sin(s * 0.35) * 60 + Math.cos(s * 0.13) * 40; g.fillStyle = '#1e1e1c'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); }
  g.restore();
  g.strokeStyle = '#555'; g.lineWidth = 3; g.strokeRect(80, 120, 560, 460);
  txt('電子顕微鏡で見ると', 360, 100, 24, '#bfe0ff', span(u, 0.2, 0.8));
  dim(120, 610, 240, 610, '', 0);
  txt('太さ 約10 nm ＝ ビーズを糸でつないだ姿', 360, 630, 24, '#ffe2a8', span(u, 2.4, 3.2));
  // the ladder: DNA cut in multiples of ~200 bp
  const gl = span(u, 7.5, 8.5);
  if (gl > 0) {
    g.globalAlpha = gl; g.fillStyle = '#121a2c'; g.fillRect(820, 150, 260, 420); g.globalAlpha = 1;
    [1, 2, 3, 4, 5, 6].forEach((n, i) => { const y = 520 - Math.log(n) / Math.log(6) * 320; const a = span(u, 8.5 + i * 0.35, 9 + i * 0.35); g.fillStyle = `rgba(255,236,190,${a * (1 - i * 0.12)})`; g.fillRect(900, y, 110, 9); txt(`${n * 200}`, 880, y + 9, 18, '#bfe0ff', a, 'right'); });
    txt('塩基対', 1060, 140, 18, '#bfe0ff', gl);
    txt('200塩基対の倍数で切れる', 950, 610, 24, '#ffe2a8', span(u, 10.5, 11.3));
    txt('1970年代 → ヌクレオソームという単位', 950, 650, 20, '#cbbce8', span(u, 12, 12.8));
  }
  txt('ヌクレオソーム', W / 2, 56, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}
function folding(u: number) {
  g.drawImage(blueprint(), 0, 0);
  const steps: [string, (x: number, y: number, k: number) => void][] = [
    ['10 nm（ビーズと糸）', (x, y, k) => { g.strokeStyle = '#7fc6ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 80, y); g.lineTo(x + 80, y); g.stroke(); for (let i = -3; i <= 3; i++) { g.fillStyle = '#b48ad8'; g.beginPath(); g.arc(x + i * 24, y, 9 * k, 0, 7); g.fill(); } }],
    ['H1で束ねる → 30 nm線維', (x, y, k) => { for (let i = 0; i < 16; i++) { const a = i * 0.9; g.fillStyle = '#b48ad8'; g.beginPath(); g.arc(x - 70 + i * 9.5, y + Math.sin(a) * 20 * k, 9, 0, 7); g.fill(); } g.fillStyle = '#ffd36b'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(x - 66 + i * 19, y, 3.5, 0, 7); g.fill(); } }],
    ['ループにする', (x, y, k) => { g.strokeStyle = '#b48ad8'; g.lineWidth = 9; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(x - 60 + i * 30, y - 20 * k, 13, 38 * k, 0, 0, 7); g.stroke(); } g.strokeStyle = '#ffe2a8'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 80, y + 20); g.lineTo(x + 80, y + 20); g.stroke(); }],
    ['さらに らせんに畳む', (x, y, k) => { g.strokeStyle = '#9b74c8'; g.lineWidth = 16; g.beginPath(); for (let s = 0; s <= 40; s++) { const a = s * 0.5; g.lineTo(x - 70 + s * 3.5, y + Math.sin(a) * 34 * k); } g.stroke(); }],
  ];
  steps.forEach(([name, fn], i) => {
    const k = span(u, 0.4 + i * 2.4, 1.4 + i * 2.4); if (k <= 0) return;
    const x = 200 + i * 300, y = 360;
    g.globalAlpha = k; fn(x, y, k); g.globalAlpha = 1;
    txt(name, x, y + 120, 22, '#ffe2a8', k);
    if (i < 3) { g.fillStyle = `rgba(191,224,255,${k})`; g.beginPath(); g.moveTo(x + 128, y); g.lineTo(x + 112, y - 9); g.lineTo(x + 112, y + 9); g.fill(); }
  });
  txt('畳み方', W / 2, 56, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}
function barr(u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cx = W / 2, cy = 370, r = 230;
  g.fillStyle = 'rgba(180,160,220,.12)'; g.beginPath(); g.ellipse(cx, cy, r, r * 0.85, 0, 0, 7); g.fill();
  g.strokeStyle = '#a492cc'; g.lineWidth = 4; g.beginPath(); g.ellipse(cx, cy, r, r * 0.85, 0, 0, 7); g.stroke();
  // the active X: loose; the inactive X: a small dense clump at the rim
  const a1 = span(u, 0.8, 1.8);
  g.strokeStyle = `rgba(127,198,255,${a1})`; g.lineWidth = 4; g.beginPath(); for (let s = 0; s < 40; s++) g.lineTo(cx - 60 + Math.sin(s * 0.7) * 50 + s * 2, cy - 40 + Math.cos(s * 0.5) * 50); g.stroke();
  txt('X染色体', cx - 40, cy + 110, 22, '#bfe0ff', a1);
  const a2 = span(u, 3.5, 4.5), bx = cx + r * 0.78, by = cy - r * 0.4;
  g.fillStyle = `rgba(90,60,140,${a2})`; g.beginPath(); g.ellipse(bx, by, 26 * a2, 16 * a2, -0.6, 0, 7); g.fill();
  callout('封をされたもう1本 ＝ Barr小体（核の縁に小さく固まる）', 900, 130, bx, by, span(u, 6, 6.8), '#ffe2a8', 22);
  txt('女性の細胞の核', W / 2, 56, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}

/* ---------- shots ---------- */
type Shot = { from: number; until: number; cam?: (t: number) => Camera; insert?: (u: number) => void };
const SHOTS: Shot[] = [
  { from: 0, until: c[1] - 0.2, cam: (t) => shotCam(t, 0, c[1], [3.6, 2.8, 6.2], [2.4, 2.0, 4.8], [-2.2, 1.6, -4], 760, 0.6, [-0.4, 1.4, -1]) },
  { from: c[1] - 0.2, until: c[2] - 0.2, cam: (t) => shotCam(t, c[1], c[2], [-0.9, 1.5, 1.3], [-0.75, 1.5, 1.1], [1.5, 1.45, -1.9], 1050) },
  { from: c[2] - 0.2, until: c[3] - 0.2, cam: (t) => shotCam(t, c[2], c[3], [1.9, 1.35, 0.4], [1.75, 1.25, 0.1], [1.45, 0.98, -1.4], 1100, 0.8, [1.45, 1.05, -1.6]) },
  { from: c[3] - 0.2, until: c[4] - 0.2, insert: beads },
  { from: c[4] - 0.2, until: c[5] - 0.2, insert: folding },
  { from: c[5] - 0.2, until: c[6] - 0.2, cam: (t) => shotCam(t, c[5], c[6], [3.0, 1.7, 3.4], [3.5, 2.5, 2.2], [7.8, 2.3, -2.2], 800, 0.5, [7.8, 3.6, -2.2]) },
  { from: c[6] - 0.2, until: c[7] - 0.2, cam: (t) => shotCam(t, c[6], c[7], [-0.6, 1.5, 1.2], [-0.4, 1.5, 0.9], [1.6, 1.4, -1.8], 1000) },
  { from: c[7] - 0.2, until: c[8] - 0.2, insert: barr },
  { from: c[8] - 0.2, until: c[9] - 0.2, cam: (t) => shotCam(t, c[8], c[9], [1.1, 1.55, -0.6], [1.0, 1.55, -0.5], [-0.2, 1.52, 0.15], 1250) },
  { from: c[9] - 0.2, until: d + 1, cam: (t) => shotCam(t, c[9], d, [0.85, 1.52, 0.15], [0.95, 1.52, -0.05], [1.5, 1.45, -1.95], 1150) },
];

export function archiveScene(t: number, dd: number) {
  const [shot, i] = pick(SHOTS, t);
  if (shot.insert) { shot.insert(t - shot.from); finish(t, 0.45, 0.03); }
  else {
    const cam = shot.cam!(t);
    const h0 = perform(HIS_T, t), t0 = perform(TAG_T, t);
    const tg = tag(t, headCentre(h0)), hs = histo(t, headCentre(t0));
    archive(cam, t);
    const order = [
      { d: v.len(v.sub(tg.p.p[J.chest], cam.pos)), f: () => { drawActor(cam, { look: TAG, pose: tg.p, face: tagFace(t), t, light: 1 }); boxAt(cam, tg.box.c, tg.box.fwd); } },
      { d: v.len(v.sub(hs.p.p[J.chest], cam.pos)), f: () => { drawActor(cam, { look: HISTO, pose: hs.p, face: hisFace(t), t, light: -1 }); if (hs.winding) windingSpool(cam, hs.p, t); } },
    ].sort((a, b) => b.d - a.d);
    order.forEach((o) => o.f());
    darkness(0.5, archiveLamps(cam, t));
    if (i === 5) {
      const u = t - shot.from;
      const open = cam.proj([7.55, 2.04, -1.2]), sealed = cam.proj([7.55, 4.74, -2.4]);
      callout('正染色質：ゆるいループのまま開いている（読める）', open.x - 330, open.y + 150, open.x, open.y, span(u, 1.5, 2.3), '#bfe0ff', 22);
      callout('異染色質：固く畳まれ封をされた箱（転写されない）', sealed.x - 300, sealed.y - 70, sealed.x, sealed.y, span(u, 7, 7.8), '#ffe2a8', 22);
    }
    if (i === 6) {
      const u = t - shot.from;
      txt('構造的：いつも封をしたまま', 330, 110, 26, '#ffe2a8', span(u, 4.5, 5.3));
      txt('条件的：ときどき封をする', 330, 152, 26, '#bfe0ff', span(u, 7, 7.8));
    }
    finish(t, 0.55, 0.035);
  }
  SHOTS.forEach((s, k) => { if (k > 0) dip(t, s.from, 0.22, 0.55); });
  if (t < 0.7) { g.fillStyle = `rgba(4,5,8,${1 - t / 0.7})`; g.fillRect(0, 0, W, H); }
  void dd; void L; void e; void H;
}
