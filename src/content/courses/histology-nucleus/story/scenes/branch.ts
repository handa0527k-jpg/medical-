/**
 * Scene 6「小腸支社の四十八時間」(cell renewal): at dawn Tag drops by the small-intestine branch → Stem:
 * "in two days almost everyone is new" → three kinds of cell populations (renewing / static /
 * expanding, G0) → the stem cell at the bottom of the crypt → progenitors multiply and differentiate →
 * newcomers climb the villus in ~48 h and are shed at the tip → BrdU marks → "short?" — "what matters is
 * to climb all the way".
 */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { noise } from '../../../../../engine/story/cine';
import { perform, lookAt, headCentre, J, v, type Take, type V3, type Camera } from '../../../../../engine/story/mocap';
import { drawActor, type BodyLook } from '../../../../../engine/story/body';
import { darkness, finish } from '../../../../../engine/story/light';
import { face, keys, pick, shotCam, span, faceTo } from '../../../../../engine/story/act';
import { quad, seg, use, P } from '../../../../../engine/story/set3d';
import { HEIGHT, STEM, TAG } from '../cast';
import { cues, mouthIn } from '../film';
import { arrow, blueprint, callout, dip, txt, MINCHO } from '../sets/ink';

const { c, d } = cues('branch');
const VIL: V3 = [3.2, 0, -5], VR = 1.9, VH = 9;          // the villus (a tall finger)
const CRYPT: V3 = [-1.0, 0, -1.6], CR = 1.6, CD = 1.1;   // the crypt (a pit), depth CD
const S_SPOT: V3 = [CRYPT[0] + 0.2, 0, CRYPT[2] + 0.1];
const T_STOP: V3 = [-1.6, 0, 1.4];
const NEW: BodyLook = { ...TAG, cap: '#7fb8d8', top: '#8aa9bf', topShade: '#6a889c', topTrim: '#506a7c', hair: '#3a2a20', hairStyle: 'short' };

const TAG_T: Take[] = [
  { clip: 'walk_casual', at: -1, from: 0, x: -6.5, z: 3.2, face: faceTo([-6.5, 0, 3.2], T_STOP), travel: true, h: HEIGHT.TAG },
  { clip: 'stand2', at: 7.6, from: 0, x: T_STOP[0], z: T_STOP[2], face: faceTo(T_STOP, S_SPOT), h: HEIGHT.TAG, blend: 0.9 },
  { clip: 'stand', at: 40, from: 2, x: T_STOP[0], z: T_STOP[2], face: faceTo(T_STOP, S_SPOT), h: HEIGHT.TAG, blend: 1.5 },
];
const STEM_T: Take[] = [
  { clip: 'stand2', at: -3, from: 0, x: S_SPOT[0], z: S_SPOT[2], face: faceTo(S_SPOT, T_STOP), h: HEIGHT.STEM, dy: -CD },
  { clip: 'wave', at: c[1] - 0.2, from: 0.1, x: S_SPOT[0], z: S_SPOT[2], face: faceTo(S_SPOT, T_STOP), h: HEIGHT.STEM, dy: -CD, blend: 0.4 },
  { clip: 'stand2', at: c[1] + 2.3, from: 2, x: S_SPOT[0], z: S_SPOT[2], face: faceTo(S_SPOT, T_STOP), h: HEIGHT.STEM, dy: -CD, blend: 0.8 },
  { clip: 'explain', at: c[4] - 0.3, from: 2, x: S_SPOT[0], z: S_SPOT[2], face: faceTo(S_SPOT, T_STOP), h: HEIGHT.STEM, dy: -CD, blend: 0.8 },
  { clip: 'stand2', at: c[4] + 5, from: 3, x: S_SPOT[0], z: S_SPOT[2], face: faceTo(S_SPOT, T_STOP), h: HEIGHT.STEM, dy: -CD, blend: 1.0 },
];

/** the climbing path: a spiral ramp around the villus, u = 0 (bottom) … 1 (tip) */
function onPath(u: number): { p: V3; face: number } {
  const turns = 1.6, a = u * turns * Math.PI * 2 + 0.6, r = VR + 0.35;
  const p: V3 = [VIL[0] + Math.sin(a) * r, u * (VH - 0.8), VIL[2] + Math.cos(a) * r];
  return { p, face: a + Math.PI / 2 };
}

export function landscape(cam: Camera, t: number, dawn: number) {
  use(cam);
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, `rgb(${L(20, 70, dawn)},${L(26, 80, dawn)},${L(48, 130, dawn)})`); sk.addColorStop(0.65, `rgb(${L(40, 220, dawn)},${L(36, 150, dawn)},${L(60, 150, dawn)})`); sk.addColorStop(1, `rgb(${L(50, 250, dawn)},${L(40, 200, dawn)},${L(60, 160, dawn)})`);
  g.fillStyle = sk; g.fillRect(0, 0, W, H);
  // far villi on the horizon (silhouettes)
  const hz = P([cam.pos[0] + cam.fwd[0] * 150, 0, cam.pos[2] + cam.fwd[2] * 150]).y;
  g.fillStyle = `rgba(${L(30, 120, dawn)},${L(20, 80, dawn)},${L(40, 110, dawn)},.85)`;
  for (let i = 0; i < 16; i++) { const x = ((i * 113 - cam.pos[0] * 6) % 1500 + 1500) % 1500 - 100, w = 34 + (i % 4) * 10, h = 70 + (i % 5) * 26; g.beginPath(); g.moveTo(x - w, hz + 4); g.lineTo(x - w, hz - h + w); g.arc(x, hz - h + w, w, Math.PI, 0); g.lineTo(x + w, hz + 4); g.fill(); }
  // ground (mucosa)
  quad([[-40, 0, -60], [40, 0, -60], [40, 0, 20], [-40, 0, 20]], `rgb(${L(40, 150, dawn)},${L(30, 100, dawn)},${L(44, 110, dawn)})`);
  for (let z = -60; z < 20; z += 1.5) seg([-40, 0, z], [40, 0, z], 'rgba(0,0,0,.12)', 1);
  // the crypt: a round pit with a glowing floor
  const rim: V3[] = [], floor: V3[] = [];
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; rim.push([CRYPT[0] + Math.sin(a) * CR, 0.01, CRYPT[2] + Math.cos(a) * CR]); floor.push([CRYPT[0] + Math.sin(a) * CR * 0.8, -CD, CRYPT[2] + Math.cos(a) * CR * 0.8]); }
  quad(rim, '#2a1a24'); quad(floor, `rgba(255,214,150,${0.35 + 0.1 * noise(t, 4)})`);
  // the villus: a tall rounded finger with the ramp spiralling up
  for (let i = 0; i < 36; i++) {
    const a0 = (i / 36) * Math.PI * 2, a1 = ((i + 1) / 36) * Math.PI * 2, am = (a0 + a1) / 2;
    const nx = Math.sin(am), nz = Math.cos(am); const mid: V3 = [VIL[0] + nx * VR, VH / 2, VIL[2] + nz * VR];
    if (v.dot([nx, 0, nz], v.sub(cam.pos, mid)) <= 0) continue;
    const lit = 0.6 + 0.4 * Math.max(0, -nx * 0.6 + nz * 0.7);
    quad([[VIL[0] + Math.sin(a0) * VR, 0, VIL[2] + Math.cos(a0) * VR], [VIL[0] + Math.sin(a1) * VR, 0, VIL[2] + Math.cos(a1) * VR], [VIL[0] + Math.sin(a1) * VR, VH, VIL[2] + Math.cos(a1) * VR], [VIL[0] + Math.sin(a0) * VR, VH, VIL[2] + Math.cos(a0) * VR]], `rgb(${Math.round(L(90, 235, dawn) * lit)},${Math.round(L(60, 170, dawn) * lit)},${Math.round(L(80, 180, dawn) * lit)})`);
  }
  const tip = P([VIL[0], VH, VIL[2]]); g.fillStyle = `rgb(${Math.round(L(100, 240, dawn))},${Math.round(L(70, 180, dawn))},${Math.round(L(90, 190, dawn))})`; g.beginPath(); g.ellipse(tip.x, tip.y, VR * tip.s, VR * tip.s * 0.6, 0, Math.PI, 0); g.fill();
  g.strokeStyle = 'rgba(255,240,220,.45)'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k <= 80; k++) { const q = onPath(k / 80); const pp = P(q.p); if (k) g.lineTo(pp.x, pp.y); else g.moveTo(pp.x, pp.y); } g.stroke();
}

/* ---------- inserts ---------- */
function threeTypes(u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cols: [string, string, string[], string][] = [
    ['更新性', '入れ替わりつづける', ['表皮', '消化管上皮', '血液をつくる系統'], '#9eeab2'],
    ['静止性', '一生勤める', ['神経細胞', '心筋細胞'], '#bfe0ff'],
    ['拡張性', 'ふだんはG0期で休み、必要なときに増える', ['肝臓', '腎臓'], '#ffe2a8'],
  ];
  cols.forEach(([name, sub, ex, col], i) => {
    const x = 220 + i * 420, k = span(u, 0.8 + i * 6, 1.8 + i * 6); if (k <= 0) return;
    g.globalAlpha = k; g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x - 190, 140, 380, 470); g.globalAlpha = 1;
    txt(name, x, 200, 36, col, k, 'center', MINCHO);
    txt(sub, x, 244, sub.length > 14 ? 17 : 21, '#e0dde8', k);
    ex.forEach((e, j) => txt(e, x, 320 + j * 50, 26, col, span(u, 2 + i * 6 + j * 0.8, 2.6 + i * 6 + j * 0.8)));
    // a tiny picture of the behaviour
    const py = 520;
    if (i === 0) for (let s = 0; s < 6; s++) { const ph = ((u * 0.3 + s / 6) % 1); g.fillStyle = `rgba(158,234,178,${k * Math.sin(ph * Math.PI)})`; g.beginPath(); g.arc(x - 120 + ph * 240, py, 12, 0, 7); g.fill(); }
    if (i === 1) { g.fillStyle = `rgba(191,224,255,${k})`; for (let s = 0; s < 3; s++) { g.beginPath(); g.arc(x - 60 + s * 60, py, 14, 0, 7); g.fill(); } }
    if (i === 2) { const grow = 0.5 + 0.5 * Math.max(0, Math.sin(u * 0.8)); g.fillStyle = `rgba(255,226,168,${k})`; for (let s = 0; s < 2 + Math.round(grow * 3); s++) { g.beginPath(); g.arc(x - 80 + s * 40, py, 12, 0, 7); g.fill(); } }
  });
  txt('細胞の集団の三つの型', W / 2, 60, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}
function crypt(u: number, part: 1 | 2) {
  g.drawImage(blueprint(), 0, 0);
  // a crypt (U-shape) opening onto the base of a villus
  const cx = 520, by = 600;
  g.strokeStyle = '#d8b0c8'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 120, 160); g.lineTo(cx - 120, by - 60); g.arc(cx, by - 60, 120, Math.PI, 0, true); g.lineTo(cx + 120, 160); g.stroke();
  const cell = (x: number, y: number, col: string, a = 1) => { g.fillStyle = col; g.globalAlpha = a; g.beginPath(); g.ellipse(x, y, 20, 16, 0, 0, 7); g.fill(); g.globalAlpha = 1; };
  // stem cells at the bottom
  [-50, 0, 50].forEach((dx) => cell(cx + dx, by - 22 - Math.abs(dx) * 0.3, '#ffd36b'));
  callout('幹細胞（陰窩の底）', cx + 330, by - 10, cx + 50, by - 30, span(u, part === 1 ? 0.5 : 0, part === 1 ? 1.3 : 0.1), '#ffd36b');
  if (part === 1) {
    const k = span(u, 3, 6);
    cell(cx - 90 * k, by - 30 - 40 * k, '#ffd36b');            // one stays a stem cell
    cell(cx + 30 + 60 * k, by - 40 - 160 * k, '#9eeab2', k);    // one becomes a progenitor and leaves
    arrow(cx + 20, by - 50, cx + 80, by - 190, '#9eeab2', k, 3);
    txt('自分と同じ細胞を残しながら', 980, 300, 24, '#ffd36b', span(u, 4, 4.8)); txt('前駆細胞を送り出す', 980, 340, 24, '#9eeab2', span(u, 6, 6.8));
  } else {
    const k = span(u, 1, 6), n = Math.round(1 + k * 7);
    for (let i = 0; i < n; i++) cell(cx + (i % 2 ? 60 : -60), by - 80 - i * 50, i < 3 ? '#9eeab2' : `rgba(191,224,255,1)`, 1);
    txt('前駆細胞：自分と同じ者は残さない', 980, 260, 22, '#9eeab2', span(u, 0.5, 1.3));
    txt('陰窩の中で増え、分化して', 980, 310, 22, '#bfe0ff', span(u, 3.5, 4.3));
    txt('終細胞になる', 980, 360, 26, '#bfe0ff', span(u, 7.5, 8.3));
  }
  txt('陰窩', W / 2, 60, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}
function brdu(u: number) {
  g.drawImage(blueprint(), 0, 0);
  // three moments: the labelled cells (orange nuclei) start in the crypt and move up the villus
  const panels: [string, number][] = [['印をつけた直後', 0], ['しばらく後', 0.5], ['約48時間後', 1]];
  panels.forEach(([name, ph], i) => {
    const k = span(u, 1 + i * 2.5, 2 + i * 2.5); if (k <= 0) return;
    const x = 240 + i * 400, base = 600;
    g.globalAlpha = k; g.strokeStyle = '#d8b0c8'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 60, base); g.lineTo(x - 60, 210); g.arc(x, 210, 60, Math.PI, 0); g.lineTo(x + 60, base); g.stroke();
    for (let s = 0; s < 14; s++) { const y = base - 20 - s * 28; const lab = Math.abs(s / 13 - ph) < 0.12; g.fillStyle = lab ? '#ff9a4a' : 'rgba(200,190,220,.5)'; [-1, 1].forEach((sd) => { g.beginPath(); g.ellipse(x + sd * 46, y, 9, 11, 0, 0, 7); g.fill(); }); }
    g.globalAlpha = 1; txt(name, x, 660, 22, '#ffe2a8', k);
  });
  txt('BrdU：DNAを合成している細胞に取り込まれる印', W / 2, 120, 24, '#ff9a4a', span(u, 0.2, 1));
  txt('抗体で印を追えば、誰がどこで生まれ、どこへ向かったかがわかる', W / 2, 160, 20, '#e0dde8', span(u, 7.5, 8.3));
  txt('印を追う', W / 2, 60, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}

/* ---------- shots ---------- */
type Shot = { from: number; until: number; cam?: (t: number) => Camera; insert?: (u: number) => void };
const SHOTS: Shot[] = [
  { from: 0, until: c[1] - 0.2, cam: (t) => shotCam(t, 0, c[1], [-8, 3.2, 9.5], [-6, 2.4, 8], [1.5, 2.6, -4], 760) },
  { from: c[1] - 0.2, until: c[2] - 0.2, cam: (t) => shotCam(t, c[1], c[2], [-2.3, 1.35, 0.7], [-2.1, 1.3, 0.5], [S_SPOT[0], 0.35, S_SPOT[2]], 850) },
  { from: c[2] - 0.2, until: c[3] - 0.2, insert: threeTypes },
  { from: c[3] - 0.2, until: c[4] - 0.2, insert: (u) => crypt(u, 1) },
  { from: c[4] - 0.2, until: c[4] + 3.8, cam: (t) => shotCam(t, c[4], c[4] + 3.8, [-1.0, 1.1, 1.1], [-0.9, 1.05, 0.9], [S_SPOT[0], 0.45, S_SPOT[2]], 1150) },
  { from: c[4] + 3.8, until: c[5] - 0.2, insert: (u) => crypt(u + 3.8, 2) },
  { from: c[5] - 0.2, until: c[6] - 0.2, cam: (t) => shotCam(t, c[5], c[6], [-2.5, 2.0, 8.5], [-1.0, 5.5, 7.5], [VIL[0], 2.5, VIL[2]], 720, 0.6, [VIL[0], VH - 1, VIL[2]]) },
  { from: c[6] - 0.2, until: c[7] - 0.2, insert: brdu },
  { from: c[7] - 0.2, until: c[8] - 0.2, cam: (t) => shotCam(t, c[7], c[8], [-0.6, 1.4, 0.4], [-0.7, 1.42, 0.5], [T_STOP[0], 1.55, T_STOP[2]], 1150) },
  { from: c[8] - 0.2, until: d + 1, cam: (t) => shotCam(t, c[8], d, [-1.7, 1.15, 0.6], [-1.65, 1.12, 0.45], [S_SPOT[0], 0.45, S_SPOT[2]], 1150) },
];

export function branchScene(t: number, dd: number) {
  const [shot, i] = pick(SHOTS, t);
  if (shot.insert) { shot.insert(t - shot.from); finish(t, 0.45, 0.03); }
  else {
    const cam = shot.cam!(t);
    const dawn = 0.25 + 0.45 * (t / d);
    landscape(cam, t, dawn);
    const tp = perform(TAG_T, t), sp = perform(STEM_T, t);
    lookAt(tp, headCentre(sp), span(t, 6, 7.5)); lookAt(sp, headCentre(tp), span(t, 4, 6) * 0.9);
    const actors: { d: number; f: () => void }[] = [
      { d: v.len(v.sub(tp.p[J.chest], cam.pos)), f: () => drawActor(cam, { look: TAG, pose: tp, face: face(t, 1, mouthIn('branch', 'タグ', t), keys(t, [[0, { smile: 0.2 }], [c[7], { brow: 0.4, sad: 0.3, smile: 0.15 }], [c[8] + 4, { smile: 0.45, sad: 0 }]])), t, light: 1 }) },
      { d: v.len(v.sub(sp.p[J.chest], cam.pos)), f: () => drawActor(cam, { look: STEM, pose: sp, face: face(t, 8, mouthIn('branch', 'ステム', t), keys(t, [[0, { smile: 0.5 }], [c[8], { smile: 0.75, blink: 0.25 }]])), t, light: -1 }) },
    ];
    // newcomers climbing the villus (each at its own place on the ramp), the one at the tip falls away
    if (i === 0 || i === 6) {
      for (let k = 0; k < 6; k++) {
        const u = ((t * 0.035 + k / 6) % 1), q = onPath(u);
        const pose = perform([{ clip: 'climb', at: 0, from: ((t * 0.9 + k * 1.3) % 5.5), x: q.p[0], z: q.p[2], face: q.face, h: 1.6, dy: q.p[1] }], 0);
        const fade = u > 0.94 ? 1 - (u - 0.94) / 0.06 : 1;
        actors.push({ d: v.len(v.sub(pose.p[J.chest], cam.pos)), f: () => { g.save(); g.globalAlpha = Math.max(0, fade); drawActor(cam, { look: NEW, pose, face: { smile: 0.3 }, t }); g.restore(); } });
      }
    }
    actors.sort((a, b) => b.d - a.d).forEach((a) => a.f());
    use(cam);
    const cg = P([CRYPT[0], -0.5, CRYPT[2]]);
    darkness(0.35 * (1 - dawn * 0.6), [{ x: cg.x, y: cg.y, r: 3.5 * cg.s, k: 0.9, col: 'rgba(255,214,150,.3)' }, { x: W / 2, y: H * 0.3, r: 1000, k: 0.6 * dawn, sy: 0.5 }]);
    if (i === 6) {
      const u = t - shot.from, tip = cam.proj([VIL[0], VH, VIL[2]]), base = cam.proj([VIL[0] - VR, 0.3, VIL[2] + VR]);
      callout('絨毛をのぼり、約48時間で先端へ', tip.x + 240, tip.y - 40, tip.x + 20, tip.y, span(u, 1, 1.8));
      callout('先端で剥がれ落ちる', tip.x + 260, tip.y + 70, tip.x + 30, tip.y + 20, span(u, 4.5, 5.3));
      void base;
    }
    finish(t, 0.5, 0.03);
  }
  SHOTS.forEach((s, k) => { if (k > 0) dip(t, s.from, 0.22, 0.55); });
  void dd;
}
