/**
 * Scene 5「本社をふたつに」(mitosis): moving day in the head office → Spin: "pack everything, we're
 * moving" → prophase → the chromosome (short/long arm, centromere, kinetochore; 46 = 23 pairs) →
 * prometaphase and metaphase → Spin: "pull on three, the same on both sides" → anaphase A and B →
 * telophase → "moving nights smell a little lonely".
 */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { perform, reach, lookAt, headCentre, J, v, type Take, type V3, type Camera } from '../../../../../engine/story/mocap';
import { drawActor, type BodyLook } from '../../../../../engine/story/body';
import { darkness, finish } from '../../../../../engine/story/light';
import { face, keys, pick, shotCam, span, faceTo } from '../../../../../engine/story/act';
import { box as box3, quad, seg, use, P } from '../../../../../engine/story/set3d';
import { HEIGHT, SPIN, TAG } from '../cast';
import { cues, mouthIn } from '../film';
import { arrow, blueprint, callout, dip, txt, MINCHO } from '../sets/ink';

const { c, d } = cues('split');
const MOVER: BodyLook = { ...TAG, cap: '#3a9b69', top: '#5a6a5a', topShade: '#454f45', topTrim: '#343c34', hair: '#2a2420', hairStyle: 'short' };
const MOVER2: BodyLook = { ...SPIN, top: '#6a5a8a', topShade: '#4f4468', topTrim: '#3a3250', hairStyle: 'bob', hair: '#3a2a20' };

const T_SPOT: V3 = [-2.2, 0, 1.6], S_SPOT: V3 = [0.6, 0, -0.6];
const TAG_T: Take[] = [{ clip: 'stand', at: -5, from: 1, x: T_SPOT[0], z: T_SPOT[2], face: faceTo(T_SPOT, S_SPOT), h: HEIGHT.TAG }];
const SPIN_T: Take[] = [
  { clip: 'stand2', at: -5, from: 0, x: S_SPOT[0], z: S_SPOT[2], face: faceTo(S_SPOT, T_SPOT) + 0.4, h: HEIGHT.SPIN },
  { clip: 'wave', at: c[1] - 0.4, from: 0.1, x: S_SPOT[0], z: S_SPOT[2], face: faceTo(S_SPOT, [0, 0, 4]), h: HEIGHT.SPIN, blend: 0.4 },
  { clip: 'stand2', at: c[1] + 2.4, from: 2, x: S_SPOT[0], z: S_SPOT[2], face: faceTo(S_SPOT, [0, 0, 4]), h: HEIGHT.SPIN, blend: 0.7 },
  // moving day: she hauls on the rope toward the left pole
  { clip: 'pull', at: c[5] - 0.3, from: 0.2, x: -1.8, z: -0.4, face: Math.PI / 2, h: HEIGHT.SPIN, blend: 0.5 },
];
const MOVERS: { look: BodyLook; takes: Take[] }[] = [
  { look: MOVER, takes: [{ clip: 'walk', at: -2, from: 0, x: 4.5, z: -2.2, face: -Math.PI / 2 - 0.15, travel: true, h: 1.72 }] },
  { look: MOVER2, takes: [{ clip: 'walk_casual', at: -1, from: 0, x: -4.8, z: -3.4, face: Math.PI / 2 + 0.1, travel: true, h: 1.6 }] },
  // the partner on the other rope (right pole)
  { look: MOVER, takes: [{ clip: 'pull', at: c[5] - 0.3, from: 0.5, x: 2.4, z: -0.4, face: -Math.PI / 2, h: 1.72 }] },
];

export function hall(cam: Camera, t: number, rope: number) {
  use(cam);
  g.fillStyle = '#0d0b10'; g.fillRect(0, 0, W, H);
  quad([[-9, 0, -7], [9, 0, -7], [9, 0, 7], [-9, 0, 7]], '#2a2430');
  for (let x = -9; x <= 9; x += 1) seg([x, 0, -7], [x, 0, 7], 'rgba(0,0,0,.2)', 1);
  quad([[-9, 0, -7], [9, 0, -7], [9, 5, -7], [-9, 5, -7]], '#2e2836');
  quad([[-9, 0, -7], [-9, 0, 7], [-9, 5, 7], [-9, 5, -7]], '#262030'); quad([[9, 0, -7], [9, 0, 7], [9, 5, 7], [9, 5, -7]], '#262030');
  // stacks of boxes everywhere (moving day), and empty shelves behind
  for (let i = 0; i < 18; i++) {
    const x = -8 + ((i * 37) % 160) / 10, z = -6.2 + ((i * 53) % 50) / 10, n = 1 + (i % 3);
    if (Math.abs(x) < 3 && z > -2) continue;
    for (let k = 0; k < n; k++) box3([x - 0.3, k * 0.42, z - 0.25], [x + 0.3, k * 0.42 + 0.4, z + 0.25], { top: '#d9a066', front: '#c4874f', left: '#a8703e', right: '#a8703e', back: '#c4874f' });
  }
  // the central stack the two ropes pull apart (the chromosomes on the "equator")
  const sep = rope;
  [-1, 1].forEach((s) => box3([s * (0.35 + sep * 1.1) - 0.3, 0, -0.65], [s * (0.35 + sep * 1.1) + 0.3, 0.85, -0.15], { top: '#e0b070', front: '#cc8f55', left: '#b07a44', right: '#b07a44', back: '#cc8f55' }));
  if (t > c[5] - 1) { const a = P([-1.6, 1.0, -0.4]), b = P([-0.35 - sep * 1.1, 0.6, -0.4]), a2 = P([2.2, 1.0, -0.4]), b2 = P([0.35 + sep * 1.1, 0.6, -0.4]); g.strokeStyle = '#d8c79a'; g.lineWidth = Math.max(2, a.s * 0.03); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.moveTo(a2.x, a2.y); g.lineTo(b2.x, b2.y); g.stroke(); }
  // ceiling lamps
  for (let x = -6; x <= 6; x += 4) { const q = P([x, 4.6, -1]); g.fillStyle = 'rgba(255,230,190,.9)'; g.beginPath(); g.ellipse(q.x, q.y, 0.5 * q.s, 0.12 * q.s, 0, 0, 7); g.fill(); }
}

/* ---------- the cell through mitosis (insert) ---------- */
type Stage = 'pro' | 'chromo' | 'meta' | 'ana' | 'telo';
function chrom(x: number, y: number, s: number, rot: number, col: string, sisters = true, sep = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  const arm = (dx: number) => { g.fillStyle = col; g.beginPath(); g.ellipse(dx, -s * 0.35, s * 0.13, s * 0.35, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(dx, s * 0.55, s * 0.13, s * 0.5, 0, 0, 7); g.fill(); };
  if (sisters) { arm(-s * 0.13 - sep); arm(s * 0.13 + sep); } else arm(0);
  g.fillStyle = '#ffd36b'; g.beginPath(); g.ellipse(0, 0, sisters && sep < 0.01 ? s * 0.18 : s * 0.1, s * 0.06, 0, 0, 7); g.fill();
  g.restore();
}
function mitosis(stage: Stage, u: number) {
  g.drawImage(blueprint(), 0, 0);
  const cx = 640, cy = 380;
  const pole = (x: number, y: number, a: number) => { if (a <= 0) return; g.globalAlpha = a; g.fillStyle = '#9eeab2'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.strokeStyle = 'rgba(158,234,178,.5)'; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const ang = i * 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * 30, y + Math.sin(ang) * 30); g.stroke(); } g.globalAlpha = 1; };
  if (stage === 'pro') {
    g.strokeStyle = 'rgba(164,146,204,.9)'; g.lineWidth = 4; g.setLineDash([]); g.beginPath(); g.ellipse(cx, cy, 250, 210, 0, 0, 7); g.stroke();
    const k = span(u, 0.8, 4);
    for (let i = 0; i < 6; i++) {
      const x = cx - 150 + (i % 3) * 150, y = cy - 70 + Math.floor(i / 3) * 140;
      g.strokeStyle = `rgba(190,160,240,${1 - k})`; g.lineWidth = 3; g.beginPath(); for (let s2 = 0; s2 < 20; s2++) g.lineTo(x + Math.sin(s2 * 0.9 + i) * 40, y + Math.cos(s2 * 0.7 + i) * 40); g.stroke();
      if (k > 0) chrom(x, y, 70 * k, i * 0.7, `rgba(180,140,230,${k})`);
    }
    const nu = 1 - span(u, 3.5, 5.5); if (nu > 0) { g.fillStyle = `rgba(110,70,150,${nu})`; g.beginPath(); g.arc(cx + 30, cy + 10, 40, 0, 7); g.fill(); }
    const cs = span(u, 6, 8.5); pole(L(cx - 20, cx - 330, cs), cy - 260 * (1 - cs) + 0, 1); pole(L(cx + 20, cx + 330, cs), cy - 260 * (1 - cs), 1);
    const sp = span(u, 8.5, 10.5); if (sp > 0) { g.strokeStyle = `rgba(158,234,178,${0.6 * sp})`; g.lineWidth = 1.5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx - 330, cy); g.quadraticCurveTo(cx, cy + i * 50, cx - 330 + 660 * sp, cy); g.stroke(); } }
    txt('染色質 → 凝縮して 染色体', 300, 680, 24, '#e3c8ff', span(u, 1.5, 2.3)); txt('核小体が消える', 640, 680, 24, '#e3c8ff', span(u, 4, 4.8)); txt('中心体が分かれ 紡錘糸が伸びる', 990, 680, 24, '#9eeab2', span(u, 7, 7.8));
    txt('前期', W / 2, 56, 34, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
  }
  if (stage === 'chromo') {
    chrom(cx - 120, cy - 30, 250, 0, '#b48ad8');
    callout('短腕', cx + 160, cy - 200, cx - 80, cy - 110, span(u, 1, 1.8));
    callout('長腕', cx + 160, cy + 160, cx - 80, cy + 160, span(u, 2.5, 3.3));
    callout('くびれ ＝ セントロメア', cx + 220, cy - 30, cx - 70, cy, span(u, 4, 4.8));
    const kk = span(u, 6.5, 7.3); if (kk > 0) { g.fillStyle = `rgba(255,140,90,${kk})`; g.fillRect(cx - 120 - 70, cy - 10, 18, 20); g.fillRect(cx - 120 + 52, cy - 10, 18, 20); g.strokeStyle = `rgba(158,234,178,${kk})`; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 190, cy); g.lineTo(cx - 400, cy - 30); g.stroke(); }
    callout('動原体（紡錘糸がつかむ取っ手）', cx + 230, cy + 70, cx - 120 + 70, cy, kk);
    txt('ヒトの染色体は 46本 ＝ 23対', 980, 600, 28, '#ffe2a8', span(u, 10.5, 11.3));
    txt('染色体', W / 2, 56, 34, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
  }
  if (stage === 'meta') {
    const env = 1 - span(u, 0.5, 3); g.strokeStyle = `rgba(164,146,204,${env})`; g.lineWidth = 4; g.setLineDash([16, 10]); g.beginPath(); g.ellipse(cx, cy, 250, 210, 0, 0, 7); g.stroke(); g.setLineDash([]);
    pole(cx - 330, cy, 1); pole(cx + 330, cy, 1);
    const line = span(u, 5.5, 8.5);
    for (let i = 0; i < 6; i++) {
      const sx = cx - 120 + (i % 3) * 120 + (i > 2 ? 40 : 0), sy = cy - 110 + i * 44;
      const x = L(sx, cx, line), y = L(sy + (i % 2) * 30, cy - 130 + i * 52, line);
      chrom(x, y, 60, L(i * 0.6, Math.PI / 2, line), '#b48ad8');
      const att = span(u, 2.5 + i * 0.2, 3.2 + i * 0.2);
      if (att > 0) { g.strokeStyle = `rgba(158,234,178,${0.7 * att})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - 330, cy); g.lineTo(x - 8, y); g.moveTo(cx + 330, cy); g.lineTo(x + 8, y); g.stroke(); }
    }
    if (line > 0.5) { g.strokeStyle = 'rgba(255,226,168,.5)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(cx, cy - 220); g.lineTo(cx, cy + 220); g.stroke(); g.setLineDash([]); }
    txt('前中期：核膜が消え、紡錘糸が結びつく', W / 2, 640, 26, '#e3c8ff', span(u, 1, 1.8) * (1 - span(u, 5.5, 6)));
    txt('中期：赤道板の上に一列に並ぶ', W / 2, 640, 26, '#ffe2a8', span(u, 6, 6.8));
    txt('前中期・中期', W / 2, 56, 34, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
  }
  if (stage === 'ana') {
    const a = span(u, 1, 5), b = span(u, 7, 10.5);
    const px = L(330, 430, b);
    pole(cx - px, cy, 1); pole(cx + px, cy, 1);
    for (let i = 0; i < 6; i++) {
      const y = cy - 130 + i * 52;
      [-1, 1].forEach((s) => { const x = cx + s * L(10, px - 60, a) + s * (b * 0); chrom(x, L(y, cy + (y - cy) * 0.5, a), 60, Math.PI / 2, '#b48ad8', false); g.strokeStyle = 'rgba(158,234,178,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + s * px, cy); g.lineTo(x, L(y, cy + (y - cy) * 0.5, a)); g.stroke(); });
    }
    txt('姉妹染色分体が分かれ、両極へ', W / 2, 600, 26, '#e3c8ff', span(u, 0.5, 1.3));
    txt('後期A：染色体が極へ動く', 360, 660, 24, '#ffe2a8', span(u, 4, 4.8)); txt('後期B：極と極が離れていく', 920, 660, 24, '#9eeab2', span(u, 7.5, 8.3));
    txt('後期', W / 2, 56, 34, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
  }
  if (stage === 'telo') {
    const k = span(u, 0.5, 4.5), n = span(u, 4, 7);
    const pinch = L(250, 40, k);
    g.strokeStyle = '#a492cc'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy - pinch * 0.9); g.bezierCurveTo(cx - 200, cy - 260, cx - 520, cy - 230, cx - 520, cy); g.bezierCurveTo(cx - 520, cy + 230, cx - 200, cy + 260, cx, cy + pinch * 0.9); g.bezierCurveTo(cx + 200, cy + 260, cx + 520, cy + 230, cx + 520, cy); g.bezierCurveTo(cx + 520, cy - 230, cx + 200, cy - 260, cx, cy - pinch * 0.9); g.stroke();
    [-1, 1].forEach((s) => { g.strokeStyle = `rgba(164,146,204,${n})`; g.lineWidth = 3; g.beginPath(); g.ellipse(cx + s * 280, cy, 120 * n + 1, 100 * n + 1, 0, 0, 7); g.stroke(); for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(190,160,240,${0.5 + 0.5 * n})`; g.beginPath(); for (let s2 = 0; s2 < 14; s2++) g.lineTo(cx + s * 280 - 60 + s2 * 9, cy - 50 + i * 30 + Math.sin(s2 + i) * 10); g.stroke(); } });
    txt('細胞質がくびれて分かれる', 400, 660, 24, '#e3c8ff', span(u, 1, 1.8)); txt('それぞれの側で 核が組み立て直される', 900, 660, 24, '#ffe2a8', span(u, 4.5, 5.3));
    txt('終期', W / 2, 56, 34, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
  }
}

/* ---------- shots ---------- */
type Shot = { from: number; until: number; cam?: (t: number) => Camera; insert?: (u: number) => void };
const SHOTS: Shot[] = [
  { from: 0, until: c[1] - 0.2, cam: (t) => shotCam(t, 0, c[1], [-5.5, 2.6, 6.0], [-4.6, 2.0, 5.0], [0.5, 1.0, -1.5], 760) },
  { from: c[1] - 0.2, until: c[2] - 0.2, cam: (t) => shotCam(t, c[1], c[2], [-1.2, 1.5, 2.6], [-1.0, 1.5, 2.2], [0.6, 1.45, -0.6], 980) },
  { from: c[2] - 0.2, until: c[3] - 0.2, insert: (u) => mitosis('pro', u) },
  { from: c[3] - 0.2, until: c[4] - 0.2, insert: (u) => mitosis('chromo', u) },
  { from: c[4] - 0.2, until: c[5] - 0.2, insert: (u) => mitosis('meta', u) },
  { from: c[5] - 0.2, until: c[6] - 0.2, cam: (t) => shotCam(t, c[5], c[6], [0.2, 1.7, 5.2], [0.2, 1.6, 4.4], [0.2, 0.9, -0.4], 820) },
  { from: c[6] - 0.2, until: c[7] - 0.2, insert: (u) => mitosis('ana', u) },
  { from: c[7] - 0.2, until: c[8] - 0.2, insert: (u) => mitosis('telo', u) },
  { from: c[8] - 0.2, until: d + 1, cam: (t) => shotCam(t, c[8], d, [-0.75, 1.62, 0.95], [-0.9, 1.62, 1.0], [-2.2, 1.58, 1.6], 1200) },
];

export function splitScene(t: number, dd: number) {
  const [shot, i] = pick(SHOTS, t);
  if (shot.insert) { shot.insert(t - shot.from); finish(t, 0.45, 0.03); }
  else {
    const cam = shot.cam!(t);
    const rope = span(t, c[5] + 1.6, c[5] + 4.6);
    hall(cam, t, rope);
    const tp = perform(TAG_T, t), sp = perform(SPIN_T, t);
    lookAt(tp, headCentre(sp), 0.9);
    lookAt(sp, headCentre(tp), span(t, 0, 1) * (1 - span(t, c[1] - 0.5, c[1])));
    if (t > c[5] - 0.3) { reach(sp, 'L', [-1.1, 1.0, -0.4], 0.9); reach(sp, 'R', [-1.0, 0.95, -0.4], 0.9); }
    const actors: { d: number; f: () => void }[] = [
      { d: v.len(v.sub(tp.p[J.chest], cam.pos)), f: () => drawActor(cam, { look: TAG, pose: tp, face: face(t, 1, mouthIn('split', 'タグ', t), keys(t, [[0, { brow: 0.3, wide: 0.2 }], [c[8] - 0.3, { sad: 0.6, smile: 0.2, gazeY: 0.3 }]])), t, light: 1 }) },
      { d: v.len(v.sub(sp.p[J.chest], cam.pos)), f: () => drawActor(cam, { look: SPIN, pose: sp, face: face(t, 2, mouthIn('split', 'スピン', t), keys(t, [[0, { smile: 0.5 }], [c[5], { brow: 0.5, smile: 0.3 }]])), t, light: -1 }) },
    ];
    MOVERS.forEach((m, k) => {
      if (k === 2 && t < c[5] - 0.5) return;
      const p = perform(m.takes, t);
      if (k === 2) { reach(p, 'L', [1.6, 1.0, -0.4], 0.9); reach(p, 'R', [1.5, 0.95, -0.4], 0.9); }
      actors.push({ d: v.len(v.sub(p.p[J.chest], cam.pos)), f: () => drawActor(cam, { look: m.look, pose: p, face: face(t, 9 + k, 0, { smile: 0.2 }), t }) });
    });
    actors.sort((a, b) => b.d - a.d).forEach((a) => a.f());
    use(cam);
    const lamp = P([0, 3.5, -1]);
    darkness(0.3, [{ x: lamp.x, y: lamp.y, r: 9 * lamp.s, k: 0.9, col: 'rgba(255,220,180,.15)', sy: 0.6 }]);
    if (i === 5) txt('せーの！', 640, 120, 40, '#ffe2a8', span(t, c[5] + 1.2, c[5] + 1.6) * (1 - span(t, c[5] + 3, c[5] + 3.6)));
    finish(t, 0.5, 0.035);
  }
  SHOTS.forEach((s, k) => { if (k > 0) dip(t, s.from, 0.22, 0.55); });
  void dd; void arrow; void H;
}
