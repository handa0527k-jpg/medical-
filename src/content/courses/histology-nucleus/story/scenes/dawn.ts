/**
 * Scene 7「夜明けの出荷」: at the gate the subunits leave for the cytoplasm; the small subunit takes the
 * mRNA, the large one joins → a ribosome → a recap of the night (double wall, eight-pillar gate, rebar,
 * spool archive, three-room workshop, the day it split, the branch that keeps renewing) → "the head
 * office is not the building but the flow of work" → "home to sleep" → morning light reaches the
 * windows one by one; title and credits.
 */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { perform, lookAt, headCentre, J, v, type Take, type V3, type Camera } from '../../../../../engine/story/mocap';
import { drawActor } from '../../../../../engine/story/body';
import { darkness, finish } from '../../../../../engine/story/light';
import { face, keys, pick, shotCam, span } from '../../../../../engine/story/act';
import { HEIGHT, TAG } from '../cast';
import { cues, mouthIn } from '../film';
import { GATE_Z, HQ, H_IN, R_IN, city, cityLamps } from '../sets/city';
import { gateSet } from '../sets/gate';
import { archive } from '../sets/archive';
import { workshop, subunit } from '../sets/workshop';
import { blueprint, dip, txt, MINCHO } from '../sets/ink';
import { hall } from './split';
import { landscape } from './branch';
import { camera } from '../../../../../engine/story/mocap';

const { c, d } = cues('dawn');
const TAG_T: Take[] = [
  { clip: 'walk', at: c[2] - 1.5, from: 0.3, x: -0.4, z: GATE_Z + 3, face: 0, travel: true, h: HEIGHT.TAG },
  { clip: 'stretch', at: c[3] - 0.3, from: 0.3, x: -0.4, z: GATE_Z + 3 + 0.93 * (c[3] - c[2] + 1.2), face: 0.25, h: HEIGHT.TAG, blend: 0.7 },
];

/* ---------- the ribosome assembles (insert) ---------- */
function ribosome(u: number) {
  g.drawImage(blueprint(), 0, 0);
  const y = 430;
  const m = span(u, 0.4, 1.4);
  g.strokeStyle = `rgba(255,140,180,${m})`; g.lineWidth = 6; g.beginPath(); for (let s = 0; s <= 80; s++) g.lineTo(140 + s * 12.5, y + Math.sin(s * 0.4) * 6); g.stroke();
  txt('mRNA', 160, y + 50, 24, '#ff9ec0', m, 'left');
  const sm = span(u, 2.5, 4.5), lg = span(u, 6, 8.5);
  g.fillStyle = '#f2c27a'; g.beginPath(); g.ellipse(L(640, 640, sm), L(150, y + 20, sm), 90, 50, 0, 0, 7); g.globalAlpha = Math.max(0.15, sm); g.fill(); g.globalAlpha = 1;
  txt('小亜粒子', 640 + 200, L(150, y + 30, sm), 24, '#f2c27a', Math.max(0.2, sm), 'left');
  g.fillStyle = '#e8a05a'; g.globalAlpha = Math.max(0.15, lg); g.beginPath(); g.ellipse(640, L(120, y - 70, lg), 130, 80, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  txt('大亜粒子', 640 + 200, L(130, y - 70, lg), 24, '#e8a05a', Math.max(0.2, lg), 'left');
  const done = span(u, 9, 10);
  if (done > 0) { const gr = g.createRadialGradient(640, y - 30, 0, 640, y - 30, 220); gr.addColorStop(0, `rgba(255,230,170,${0.5 * done})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(640, y - 30, 220, 0, 7); g.fill(); txt('リボソームの完成（細胞質で）', W / 2, 650, 30, '#ffe2a8', done); }
  txt('門の外で', W / 2, 60, 32, '#ffffff', span(u, 0.1, 0.6), 'center', MINCHO);
}

/* ---------- recap montage: one look at each place, in the order the narration names them ---------- */
const RECAP_TEXT = '二重の外壁、八本柱の門、壁の裏の鉄筋。糸巻きの書庫と、三つの部屋の組立室。ふたつに分かれる日と、入れ替わりつづける支社。';
const PARTS = ['二重の外壁', '八本柱の門', '壁の裏の鉄筋', '糸巻きの書庫', '三つの部屋の組立室', 'ふたつに分かれる日', '入れ替わりつづける支社'];
const CUTS = (() => { const total = RECAP_TEXT.length; return PARTS.map((p) => RECAP_TEXT.indexOf(p) / total); })();
function recap(t: number, u: number, len: number) {
  let k = CUTS.length - 1; while (k > 0 && u / len < CUTS[k] - 0.02) k--;
  const w = u - CUTS[k] * len, drift = w * 0.12;
  switch (k) {
    case 0: city(camera({ x: 20 - drift, y: 15, z: -6, tx: 3, ty: 4, tz: -34, f: 760 }), t, { dawn: 0.6 }); break;
    case 1: gateSet(camera({ x: 0.4 + drift * 0.3, y: 1.6, z: 5.5 - drift, tx: 0, ty: 1.45, tz: -3, f: 800 }), t, { channel: 0.8, highlight: 0.8 }); break;
    case 2: { g.drawImage(blueprint(), 0, 0); g.strokeStyle = 'rgba(150,210,255,.9)'; g.lineWidth = 2.5; for (let x = 60; x < W; x += 44) { g.beginPath(); g.moveTo(x - drift * 20, 300); g.lineTo(x + 44 - drift * 20, 360); g.moveTo(x + 44 - drift * 20, 300); g.lineTo(x - drift * 20, 360); g.stroke(); } g.fillStyle = '#4a3f62'; g.fillRect(0, 270, W, 26); break; }
    case 3: archive(camera({ x: 3.5 - drift, y: 2.4, z: 5, tx: -1, ty: 2, tz: -5, f: 780 }), t); break;
    case 4: workshop(camera({ x: 0.5, y: 6 - drift, z: 3.2, tx: 0, ty: 0, tz: -2.5, f: 760 }), t, { flow: 1 }); break;
    case 5: hall(camera({ x: -4 + drift, y: 2.5, z: 5, tx: 0, ty: 0.8, tz: -1, f: 760 }), t, 0.8); break;
    default: landscape(camera({ x: -6 + drift, y: 3, z: 9, tx: 2, ty: 3, tz: -4, f: 740 }), t, 0.8);
  }
  g.fillStyle = 'rgba(255,200,150,.12)'; g.fillRect(0, 0, W, H);
  txt(PARTS[k], W / 2, 640, 34, '#fff3e0', Math.min(1, w * 3), 'center', MINCHO);
}

/* ---------- end title and credits ---------- */
function endTitle(a: number) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(8,8,14,.55)'; g.fillRect(0, 0, W, H); g.restore();
  txt('午前二時の本社ビル', W / 2, 300, 56, '#fff6e8', a, 'center', MINCHO);
  txt('組織学「核・細胞周期」', W / 2, 352, 22, '#e8dccb', a);
  const cr = ['モーション：CMU Graphics Lab Motion Capture Database（mocap.cs.cmu.edu）／NSF EIA-0196217', '音楽：Kevin MacLeod（incompetech.com）Licensed under Creative Commons: By Attribution 4.0', '効果音：Kenney（kenney.nl, CC0）・自作の合成音 ／ 声：音声合成'];
  cr.forEach((s, i) => txt(s, W / 2, 470 + i * 30, 15, '#cfc6b8', a * 0.9));
}

/* ---------- shots ---------- */
type Shot = { from: number; until: number; cam?: (t: number) => Camera; insert?: (t: number, u: number) => void };
const SHOTS: Shot[] = [
  { from: 0, until: 4.6, cam: (t) => shotCam(t, 0, 4.6, [1.2, 1.8, GATE_Z + 9], [0.8, 1.7, GATE_Z + 7.5], [0, 1.6, GATE_Z], 820) },
  { from: 4.6, until: c[1] - 0.2, insert: (_t, u) => ribosome(u + 1.5) },
  { from: c[1] - 0.2, until: c[2] - 0.2, insert: (t, u) => recap(t, u, c[2] - c[1]) },
  { from: c[2] - 0.2, until: c[3] - 0.2, cam: (t) => shotCam(t, c[2], c[3], [2.6, 1.7, GATE_Z + 16], [2.4, 1.7, GATE_Z + 15], [-0.4, 1.3, GATE_Z + 6], 820) },
  { from: c[3] - 0.2, until: c[4] - 0.2, cam: (t) => { const z = perform(TAG_T, t).p[J.pelvis][2]; return shotCam(t, c[3], c[4], [0.4, 1.55, z + 2.2], [0.3, 1.55, z + 2.0], [-0.4, 1.5, z], 1100); } },
  { from: c[4] - 0.2, until: d + 2, cam: (t) => shotCam(t, c[4], d, [9, 4, 20], [6, 6.5, 12], [HQ[0], H_IN * 0.55, HQ[2]], 760) },
];

export function dawnScene(t: number, dd: number) {
  const [shot, i] = pick(SHOTS, t);
  if (shot.insert) { shot.insert(t, t - shot.from); finish(t, 0.4, 0.03); }
  else {
    const cam = shot.cam!(t);
    const morning = 0.55 + 0.45 * (t / d);
    const lit = i === 5 ? span(t, c[4] + 0.6, c[4] + 6.2) : 0;
    city(cam, t, { dawn: morning, windows: i === 5 ? 0 : 0.6, litOrder: lit });
    if (i === 0) for (let k = 0; k < 10; k++) { const ph = ((t * 0.18 + k / 10) % 1); subunit(cam, [Math.sin(k * 2.1) * 0.8, 1.1 + Math.cos(k * 1.3) * 0.4, GATE_Z + 0.3 + ph * 7], k % 2 === 0, Math.min(1, (1 - ph) * 3)); }
    if (t >= c[2] - 1.5) {
      const p = perform(TAG_T, t);
      const hqLook: V3 = [HQ[0], H_IN * 0.6, HQ[2] + R_IN];
      lookAt(p, hqLook, span(t, c[2] + 3, c[2] + 4) * (1 - span(t, c[2] + 6.5, c[2] + 7.5)));
      drawActor(cam, { look: TAG, pose: p, face: face(t, 1, mouthIn('dawn', 'タグ', t), keys(t, [[0, { smile: 0.25 }], [c[3] + 0.8, { blink: 0.8, mouth: 0.6 }], [c[3] + 2.4, { blink: 0, mouth: 0, smile: 0.45 }]])), t, light: 1 });
      void headCentre; void v;
    }
    darkness(0.35 * (1 - morning), cityLamps(cam, t));
    // the morning sun coming over the city
    g.save(); g.globalCompositeOperation = 'screen'; const sg = g.createRadialGradient(W * 0.82, H * 0.32, 0, W * 0.82, H * 0.32, 700); sg.addColorStop(0, `rgba(255,210,150,${0.35 * morning})`); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(0, 0, W, H); g.restore();
    finish(t, 0.45, 0.03);
  }
  SHOTS.forEach((s, k) => { if (k > 0) dip(t, s.from, 0.22, 0.5); });
  endTitle(span(t, d - 6.2, d - 4.6));
  void dd; void cityLamps;
}
