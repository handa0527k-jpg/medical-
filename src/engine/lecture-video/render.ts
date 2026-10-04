/**
 * The lecture film renderer (1280×720). One function draws any moment of the plan in one of three layers:
 *   plate   — what Wan 2.2 replaces: the world behind the figure (or the subject of a "feature" shot).
 *             Text-free; its first frame per shot is the Wan keyframe (image-to-video start image).
 *   overlay — MEDSTUDY's exact figure, board, labels, lecturer and 劇画 FX on transparency (laid over Wan by FFmpeg).
 *   full    — plate + overlay: the animatic shown in MEDSTUDY and used when no Wan clip exists yet.
 */
import type { BoardOp } from '../board/types';
import type { SingleQuestion } from '../../content/types';
import type { Intensity, Plan, SceneDef, Timing, TimedScene, WanShot } from './types';
import { at } from './timing';
import { CanvasPen, type Pen } from './pen';
import { CHALK, INK, chalkBox, chalkOp, diplococcus, dish, opBox, tube, type ChalkMap } from './diagrams';
import { H, W, applyCam, camera, ease, flash, focusLines, grain, impact, invert, onoma, shakeAt, speedLines, tone } from './gekiga';
import { RANK, shows } from './edit';
import { bindCtx } from '../story/kit';
import { perform } from '../story/mocap';
import { sideCam, silhouette } from '../story/mv/common';

export type Layer = 'plate' | 'overlay' | 'full';
const CL = (x: number) => Math.max(0, Math.min(1, x));
const rnd = (i: number) => { const x = Math.sin(i * 91.17 + 7.3) * 43758.5453; return x - Math.floor(x); };

interface RC {
  g: CanvasRenderingContext2D; p: Pen; plan: Plan; sc: SceneDef; ts: TimedScene;
  /** picture time (held during a freeze) */ t: number;
  /** wall time */ real: number;
  k: Intensity; layer: Layer; shot: WanShot;
  ev: (ref: string) => number;
  /** 0..1 progress of `dur` seconds after an event (0 before it) */
  u: (ref: string, dur: number) => number;
}

export function sceneAt(timing: Timing, t: number) {
  const i = Math.max(0, timing.scenes.findIndex((s) => t < s.t1));
  return i < 0 || t >= timing.total ? timing.scenes.length - 1 : i;
}
export function activeShot(sc: SceneDef, ts: TimedScene, t: number): WanShot {
  let cur = sc.shots[0];
  for (const s of sc.shots) if ((s.from === 'start' ? ts.t0 : at(ts, s.from)) <= t + 1e-6) cur = s;
  return cur;
}

export function renderFrame(g: CanvasRenderingContext2D, plan: Plan, timing: Timing, t: number, layer: Layer = 'full') {
  const idx = sceneAt(timing, t), sc = plan.scenes[idx], ts = timing.scenes[idx];
  const k = plan.intensity;
  const { cam, frozen } = camera(sc.cams, ts, t, k);
  const pt = frozen ?? t;
  const ev = (ref: string) => at(ts, ref);
  const rc: RC = { g, p: new CanvasPen(g), plan, sc, ts, t: pt, real: t, k, layer, shot: activeShot(sc, ts, t), ev, u: (ref, d) => CL((pt - ev(ref)) / d) };
  const shakeWins = sc.fx.filter((f) => f.kind === 'shake' && shows(f.min, k)).map((f) => ({ t: ev(f.at), d: f.dur }));
  const shake = shakeAt(t, shakeWins, k);

  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (layer === 'overlay') g.clearRect(0, 0, W, H); else { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }

  // ---- plate (the Wan layer): world, or the subject of a feature shot
  if (layer !== 'overlay') {
    g.save();
    g.filter = k === 'ultra' ? 'grayscale(0.75) contrast(1.35) brightness(0.92)' : k === 'gekiga' ? 'saturate(0.7) contrast(1.18)' : 'none';
    applyCam(g, cam, shake);
    PLATE[sc.visual]?.(rc);
    g.restore();
    if (sc.fx.some((f) => f.kind === 'tone' && shows(f.min, k))) tone(g, k === 'ultra' ? 0.9 : 0.65);
    grain(g, t, RANK[k] * 0.05);
  }
  // ---- overlay (MEDSTUDY): exact figure, board, labels, lecturer, FX
  if (layer !== 'plate') {
    g.save(); applyCam(g, cam, shake); FIGURE[sc.visual]?.(rc); g.restore();
    fx(rc, layer);
  }
  // cut between scenes: a quick flash on the first frames (gekiga and up)
  if (idx > 0 && RANK[k] >= 1) flash(g, (1 - CL((t - ts.t0) / 0.12)) * 0.7);
  g.restore();
}

/* ---------- FX (screen space) ---------- */
function fx(rc: RC, layer: Layer) {
  const { g, sc, k, real } = rc;
  for (const f of sc.fx) {
    if (!shows(f.min, k) || f.kind === 'tone' || f.kind === 'shake') continue;
    const t0 = rc.ev(f.at), u = (real - t0) / f.dur;
    if (u < 0 || u > 1) continue;
    const cx = f.x ?? W / 2, cy = f.y ?? H / 2;
    if (f.kind === 'focus') focusLines(g, W / 2, H / 2, u < 0.8 ? 1 : (1 - u) / 0.2, k === 'standard' ? 0.45 : k === 'gekiga' ? 1 : 1.5, real, k === 'standard' ? 'rgba(0,0,0,0.55)' : '#000');
    if (f.kind === 'speed') speedLines(g, 1 - u, real);
    if (f.kind === 'impact') impact(g, W / 2, H / 2, u, k);
    if (f.kind === 'onoma' && f.text) onoma(g, f.text, cx, cy, u, k);
    if (f.kind === 'flash') flash(g, 1 - u);
    if (f.kind === 'invert' && layer === 'full') invert(g);
  }
}

/* ---------- plates ---------- */
const PLATE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'board-question': hall, 'board-summary': hall, 'board-generic': hall,
  'title-question': voidInk, 'result-card': voidInk,
  strains: micro, tubes: bench, plates: (rc) => (rc.shot.mode === 'feature' ? capsuleFeature(rc) : bench(rc)),
  'exam-point': streaks, quiz: streaks,
};
function hall(rc: RC) {
  const { g, t } = rc;
  const gr = g.createLinearGradient(0, -200, 0, H + 200); gr.addColorStop(0, '#1b1e24'); gr.addColorStop(0.7, '#0c0d10'); gr.addColorStop(1, '#050506');
  g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
  // a shaft of light from the upper right through the dust
  g.save(); g.globalCompositeOperation = 'lighter';
  const sh = g.createLinearGradient(1150, -100, 500, 760); sh.addColorStop(0, 'rgba(255,240,205,0.30)'); sh.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = sh; g.beginPath(); g.moveTo(980, -200); g.lineTo(1260, -200); g.lineTo(760, 900); g.lineTo(280, 900); g.fill();
  for (let i = 0; i < 90; i++) {
    const x = (rnd(i) * 1500 - 100 + t * (6 + rnd(i * 3) * 10)) % 1500 - 100, y = (rnd(i * 7) * 900 - 80 + Math.sin(t * 0.6 + i) * 12);
    g.fillStyle = `rgba(255,245,220,${0.25 + 0.5 * rnd(i * 11)})`; g.beginPath(); g.arc(x, y, 0.8 + rnd(i * 5) * 2, 0, 7); g.fill();
  }
  g.restore();
}
function voidInk(rc: RC) {
  const { g, t } = rc;
  g.fillStyle = '#050505'; g.fillRect(-600, -400, W + 1200, H + 800);
  for (let i = 0; i < 7; i++) {
    const x = 640 + Math.sin(t * 0.3 + i * 1.7) * 420, y = 360 + Math.cos(t * 0.25 + i * 2.1) * 220, r = 260 + 80 * Math.sin(t * 0.4 + i);
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(60,58,52,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
function micro(rc: RC) {
  const { g, t, p } = rc;
  const gr = g.createRadialGradient(640, 330, 50, 640, 360, 900); gr.addColorStop(0, '#20302f'); gr.addColorStop(1, '#040707');
  g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
  // out-of-focus diplococci drifting in the fluid (what Wan will animate for real)
  g.save(); g.filter = (g.filter === 'none' ? '' : g.filter + ' ') + 'blur(7px)';
  for (let i = 0; i < 9; i++) {
    const x = (rnd(i) * 1600 - 160 + t * (10 + 14 * rnd(i * 2))) % 1600 - 160, y = rnd(i * 5) * 760 - 20;
    p.save(); p.translate(x, y); p.rotate(rnd(i * 9) * 6 + t * 0.15); p.scale(0.7 + rnd(i * 4) * 0.8); p.alpha(0.35);
    diplococcus(p, { capsule: rnd(i * 3) > 0.5 ? 0.6 : 0, fill: '#5d7a74', ink: '#0d1515' }); p.restore();
  }
  g.restore();
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(190,255,235,${0.15 + 0.35 * rnd(i * 13)})`; g.beginPath(); g.arc((rnd(i) * 1500 + t * 18) % 1500 - 110, (rnd(i * 17) * 800 + Math.sin(t + i) * 10) - 40, 1 + rnd(i * 3) * 1.6, 0, 7); g.fill(); }
}
function bench(rc: RC) {
  const { g, t } = rc;
  g.fillStyle = '#07080a'; g.fillRect(-600, -400, W + 1200, H + 800);
  const top = g.createLinearGradient(0, 420, 0, 900); top.addColorStop(0, '#2a2620'); top.addColorStop(1, '#0a0908');
  g.fillStyle = top; g.fillRect(-600, 430, W + 1200, 700);
  g.strokeStyle = '#000'; g.lineWidth = 6; g.beginPath(); g.moveTo(-600, 430); g.lineTo(W + 600, 430); g.stroke();
  // spotlight sweeping slowly
  const sx = 640 + Math.sin(t * 0.5) * 120;
  const sp = g.createRadialGradient(sx, 380, 20, sx, 420, 620); sp.addColorStop(0, 'rgba(255,236,200,0.36)'); sp.addColorStop(1, 'rgba(255,236,200,0)');
  g.fillStyle = sp; g.fillRect(-600, -400, W + 1200, H + 800);
  // hatching in the dark corners (ink)
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.4;
  for (let i = 0; i < 60; i++) { const x = -100 + i * 26; g.beginPath(); g.moveTo(x, 720); g.lineTo(x + 120, 600); g.stroke(); }
}
function capsuleFeature(rc: RC) {
  const { g, p, t } = rc;
  const gr = g.createRadialGradient(640, 360, 40, 640, 360, 820); gr.addColorStop(0, '#2d3a2f'); gr.addColorStop(1, '#030403');
  g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
  const k = ease.outCubic(rc.u('term', 1.6));
  p.save(); p.translate(640, 380); p.rotate(-0.12 + Math.sin(t * 0.8) * 0.03); p.scale(3.1);
  diplococcus(p, { capsule: k, fill: '#d8cfb6', lw: 3 }); p.restore();
  // capsule material condensing from the fluid
  for (let i = 0; i < 40; i++) {
    const a = rnd(i) * Math.PI * 2, r0 = 520 - 300 * k * (0.6 + 0.4 * rnd(i * 3));
    g.fillStyle = `rgba(240,245,225,${0.5 * (1 - k)})`; g.beginPath(); g.arc(640 + Math.cos(a) * r0, 380 + Math.sin(a) * r0 * 0.55, 2 + rnd(i * 5) * 3, 0, 7); g.fill();
  }
}
function streaks(rc: RC) {
  const { g, t } = rc;
  g.fillStyle = '#0a0a0c'; g.fillRect(-600, -400, W + 1200, H + 800);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const y = rnd(i) * 720, x = ((rnd(i * 3) * 1800 + t * (60 + 80 * rnd(i))) % 1900) - 400; const gr = g.createLinearGradient(x, y, x + 500, y); gr.addColorStop(0, 'rgba(255,200,140,0)'); gr.addColorStop(0.5, 'rgba(255,200,140,0.18)'); gr.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = gr; g.fillRect(x, y, 500, 3 + rnd(i * 7) * 6); }
  g.restore();
}

/* ---------- figure layer ---------- */
const FIGURE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'board-question': boardQuestion, 'title-question': titleQuestion,
  strains, tubes: tubesFig, plates: platesFig,
  'board-summary': boardSummary, 'result-card': resultCard, 'exam-point': examPoint, quiz: quizFig, 'board-generic': boardGeneric,
};
const label = (p: Pen, s: string, x: number, y: number, size: number, o: { fill?: string; align?: CanvasTextAlign; a?: number; font?: 'gothic' | 'brush' | 'mincho' | 'hand' } = {}) =>
  p.text(s, x, y, { size, font: o.font ?? 'gothic', weight: 900, fill: o.fill ?? '#fff', stroke: INK, strokeW: size * 0.22, align: o.align ?? 'left', opacity: o.a ?? 1 });

function slate(rc: RC, x = 70, y = 40, w = 1140, h = 560) {
  const { g } = rc;
  g.fillStyle = '#2d1f14'; g.fillRect(x - 16, y - 16, w + 32, h + 32);
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#22322d'); gr.addColorStop(1, '#16221f');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 30;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + 160 + i * 230, y + 380 + (i % 2) * 60, 150, 3.6, 5.6); g.stroke(); }
  g.fillStyle = '#1a120c'; g.fillRect(x - 16, y + h + 4, w + 32, 14);
}
function lecturer(rc: RC, sx: number, face: number) {
  if (!rc.sc.lecturer) return;
  const { g, ts, t } = rc;
  const pose = perform([{ clip: 'explain', at: ts.t0 - 0.6, from: 0.4, x: 0, z: 0, face }], t);
  bindCtx(g);
  g.save(); g.translate(sx - W / 2, 175);
  silhouette(sideCam(0, 1.0, 6, 900), pose, '#050505', { rim: 'rgba(255,255,255,0.9)', rimSide: face > 0 ? 1 : -1 });
  g.restore();
}

function boardQuestion(rc: RC) {
  const { p } = rc;
  slate(rc);
  const ops = (rc.sc.data?.board as BoardOp[]) ?? [];
  const m: ChalkMap = { bx: 1620, by: 280, sx: 640, sy: 230, k: 1.15 };
  ops.forEach((op, i) => chalkOp(p, op, m, rc.u(`start+${0.2 + i * 0.45}`, 0.45)));
  // the "？" pulses once it is asked
  const q = ops.find((o) => o.id === 'c-q');
  if (q && rc.u('q-dna', 0.01) > 0) { const b = opBox(q, m); chalkBox(p, b.x - 24, b.y - 14, b.w + 48, b.h + 28, rc.u('q-dna+0.3', 0.4), CHALK.y); }
  lecturer(rc, 230, Math.PI / 2 * 0.7);
}
function titleQuestion(rc: RC) {
  const { p } = rc;
  label(p, '遺伝を担っている物質は', 640, 230, 56, { align: 'center', font: 'brush', a: rc.u('start+0.2', 0.6) });
  label(p, '本当に DNA なのか', 640, 330, 74, { align: 'center', font: 'brush', fill: CHALK.y, a: rc.u('q-dna-0.3', 0.3) });
  const k = rc.u('q-dna', 0.25);
  if (k > 0) label(p, '？', 640, 470, 120 + 60 * (1 - ease.back(k)), { align: 'center', font: 'brush', a: k });
}

function strains(rc: RC) {
  const { g, p, t } = rc;
  // two manga panels split on a diagonal, thick ink borders and a white gutter
  const panel = (pts: [number, number][], fill: string) => {
    g.save(); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
    g.fillStyle = fill; g.fill(); g.lineJoin = 'miter';
    g.lineWidth = 16; g.strokeStyle = '#f4f0e4'; g.stroke(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore();
  };
  panel([[24, 24], [700, 24], [584, 696], [24, 696]], 'rgba(10,18,16,0.35)');
  panel([[730, 24], [1256, 24], [1256, 696], [614, 696]], 'rgba(10,10,14,0.35)');
  const cell = (x: number, y: number, s: number, cap: number, i: number) => {
    p.save(); p.translate(x + Math.sin(t * 0.7 + i) * 6, y + Math.cos(t * 0.5 + i * 2) * 5); p.rotate(Math.sin(t * 0.3 + i) * 0.12 + (i % 3) * 0.35 - 0.2); p.scale(s);
    diplococcus(p, { capsule: cap }); p.restore();
  };
  cell(330, 430, 1.45, 1, 0); cell(140, 560, 0.75, 1, 1); cell(500, 590, 0.8, 1, 2);
  cell(950, 440, 1.45, 0, 3); cell(1140, 590, 0.75, 0, 4); cell(780, 600, 0.8, 0, 5);
  // 1944 stamp
  const ys = rc.u('year', 0.18);
  if (ys > 0) {
    p.save(); p.translate(640, 92); p.rotate(-0.08); p.scale(1 + 0.6 * (1 - ease.outExpo(ys)));
    p.rect(-170, -52, 340, 104, { fill: 'rgba(250,244,230,0.94)', stroke: '#b3261e', width: 7 }, 10);
    p.text('1944', 0, -14, { size: 50, font: 'impact', weight: 400, fill: '#b3261e', align: 'center' });
    p.text('エイブリー／肺炎球菌', 0, 30, { size: 24, font: 'gothic', weight: 900, fill: '#1b1b1b', align: 'center' });
    p.restore();
  }
  // labels: S on 'S', R on 'R' (material: slide 14, cues c01-0029 / c01-0030)
  const s = rc.u('S', 0.22), r = rc.u('R', 0.22);
  if (s > 0) {
    label(p, 'S株', 70, 200, 84 * (1 + 0.4 * (1 - ease.outExpo(s))), { fill: CHALK.y });
    label(p, '被膜あり・表面が滑らか', 70, 268, 30, { a: s });
    label(p, '病原性あり', 70, 312, 30, { fill: '#ff7a66', a: Math.max(rc.u('S-path', 0.2), rc.u('S+0.4', 0.2)) });
    // leader to the capsule
    const c = rc.u('S+0.5', 0.3);
    if (c > 0) { p.line([[470, 330], [470 - 40 * c, 330 + 40 * c]], { stroke: '#fff', width: 3 }); label(p, '被膜', 480, 326, 28, { a: c }); }
  }
  if (r > 0) {
    label(p, 'R株', 1200, 200, 84 * (1 + 0.4 * (1 - ease.outExpo(r))), { fill: '#e6e6e6', align: 'right' });
    label(p, '被膜なし・表面が滑らかでない', 1200, 268, 30, { align: 'right', a: r });
    label(p, '病原性なし', 1200, 312, 30, { align: 'right', fill: '#9fd0ff', a: Math.max(rc.u('R-path', 0.2), rc.u('R+0.4', 0.2)) });
  }
}

const TUBE_X = [200, 420, 640, 860, 1080];
const PARTS = ['DNA', 'RNA', '脂質', 'タンパク質', '炭水化物'];
const PART_CUE = ['t-dna', 't-rna', 't-lip', 't-pro', 't-carb'];
function tubesFig(rc: RC) {
  const { p, g } = rc;
  // rack
  p.rect(110, 330, 1060, 22, { fill: '#2a2018', stroke: INK, width: 5 });
  label(p, 'S株の成分', 640, 62, 40, { align: 'center', fill: CHALK.y, a: rc.u('extract', 0.3) });
  TUBE_X.forEach((x, i) => {
    tube(p, x, 110, 270, ease.outCubic(rc.u(`extract+${0.25 + i * 0.12}`, 0.6)), 'rgba(214,196,150,0.75)');
    // name tag slams in when it is said
    const k = rc.u(PART_CUE[i], 0.18);
    if (k > 0) {
      p.save(); p.translate(x, 245); p.rotate((i % 2 ? 1 : -1) * 0.04); p.scale(1 + 1.3 * (1 - ease.outExpo(k))); p.alpha(CL(k * 4));
      p.rect(-62, -26, 124, 52, { fill: 'rgba(250,246,234,0.97)', stroke: INK, width: 4 }, 6);
      p.text(PARTS[i], 0, 1, { size: PARTS[i].length > 3 ? 23 : 30, font: 'gothic', weight: 900, fill: i === 0 ? '#b3261e' : '#1b1b1b', align: 'center' });
      p.restore();
    }
    // R株 dishes below, and the drop
    const d = rc.u('add', 0.01);
    if (d > 0) {
      dish(p, x, 505, 62, 0, i + 1);
      label(p, 'R株', x + 70, 470, 22, { a: rc.u('add', 0.3) });
      const f = rc.u(`add+${i * 0.09}`, 0.38);
      if (f > 0 && f < 1) { g.fillStyle = 'rgba(225,215,180,0.95)'; g.beginPath(); g.ellipse(x, 395 + 100 * ease.inOut(f), 6, 9, 0, 0, 7); g.fill(); }
      if (f >= 1) { const s = rc.u(`add+${i * 0.09 + 0.38}`, 0.35); if (s < 1) p.ellipse(x, 500, 10 + 40 * s, (10 + 40 * s) * 0.4, 0, { stroke: '#fff', width: 3, opacity: 1 - s }); }
    }
  });
}

function platesFig(rc: RC) {
  const { p } = rc;
  if (rc.shot.mode === 'feature') {
    // labels only — the picture is Wan's (or the animatic's) close-up
    const k = rc.u('term', 0.25);
    if (k > 0) {
      p.save(); p.translate(640, 170); p.scale(1 + 0.8 * (1 - ease.outExpo(k)));
      p.text('形質転換', 0, 0, { size: 104, font: 'brush', weight: 400, fill: '#fff', stroke: INK, strokeW: 20, align: 'center' });
      p.restore();
      label(p, 'R株 → S株', 640, 252, 34, { align: 'center', fill: CHALK.y, a: rc.u('term+0.5', 0.3) });
      const c = rc.u('term+1.0', 0.3);
      if (c > 0) { p.line([[860, 300], [800, 330]], { stroke: '#fff', width: 3, opacity: c }); label(p, '被膜', 870, 292, 28, { a: c }); }
    }
    return;
  }
  const morph = ease.inOut(rc.u('only-dna+0.15', 1.2));
  TUBE_X.forEach((x, i) => {
    dish(p, x, 330, 92, i === 0 ? morph : 0, i + 3);
    p.rect(x - 70, 400, 140, 44, { fill: 'rgba(250,246,234,0.95)', stroke: INK, width: 4 }, 6);
    p.text(PARTS[i], x, 422, { size: PARTS[i].length > 3 ? 22 : 28, font: 'gothic', weight: 900, fill: i === 0 ? '#b3261e' : '#1b1b1b', align: 'center' });
    label(p, 'R株', x - 92, 248, 22, { a: 1 - rc.u(i === 0 ? 'only-dna+0.3' : 'only-dna+0.9', 0.3) });
  });
  label(p, '各成分を加えた R株', 640, 70, 34, { align: 'center', a: rc.u('start', 0.4) });
  const s = rc.u('only-dna+0.6', 0.2);
  if (s > 0) { p.save(); p.translate(205, 238); p.rotate(-0.07); p.scale(1 + 0.6 * (1 - ease.outExpo(s))); p.text('S株に変化', 0, 0, { size: 40, font: 'gothic', weight: 900, fill: CHALK.y, stroke: INK, strokeW: 9, align: 'center' }); p.restore(); }
  const n = rc.u('only-dna+1.0', 0.3);
  if (n > 0) for (let i = 1; i < 5; i++) label(p, 'R株のまま', TUBE_X[i], 230, 26, { align: 'center', fill: '#cfcfcf', a: n });
}

function boardSummary(rc: RC) {
  const { p } = rc;
  slate(rc);
  const ops = (rc.sc.data?.board as BoardOp[]) ?? [];
  const m: ChalkMap = { bx: 60, by: 840, sx: 150, sy: 120, k: 1.0 };
  const last = ops.find((o) => o.id === 'av-c');
  ops.filter((o) => o !== last).forEach((op, i) => chalkOp(p, op, m, rc.u(`start+${i * 0.12}`, 0.35)));
  if (last) {
    chalkOp(p, last, m, rc.u('box-0.7', 0.8));
    const b = opBox(last, m), redAt = rc.sc.beats.some((x) => x.segs.some((s) => s.cue === 'red')) ? 'red' : 'box+0.35';
    chalkBox(p, b.x - 18, b.y - 12, b.w + 36, b.h + 24, rc.u(redAt, 0.45), CHALK.r);
  }
  lecturer(rc, 1170, -Math.PI / 2 * 0.7);
}
function resultCard(rc: RC) {
  const { p } = rc;
  p.rect(240, 70, 800, 430, { fill: 'rgba(245,240,226,0.95)', stroke: INK, width: 8 }, 6);
  p.text('S株の成分を加えた R株は', 640, 118, { size: 30, font: 'gothic', weight: 900, fill: '#1b1b1b', align: 'center' });
  PARTS.forEach((x, i) => {
    const y = 180 + i * 58, a = rc.u(`start+${0.2 + i * 0.15}`, 0.25);
    p.line([[280, y + 29], [1000, y + 29]], { stroke: '#999', width: 1.5, opacity: a });
    p.text(x, 330, y, { size: 32, font: 'gothic', weight: 900, fill: i === 0 ? '#b3261e' : '#1b1b1b', opacity: a });
    p.text(i === 0 ? 'S株に変わる' : 'R株のまま', 960, y, { size: 30, font: 'gothic', weight: 900, fill: i === 0 ? '#b3261e' : '#555', align: 'right', opacity: a });
  });
  const s = rc.u('box', 0.2);
  if (s > 0) { p.save(); p.translate(640, 560); p.rotate(-0.05); p.scale(1 + 0.7 * (1 - ease.outExpo(s))); p.rect(-260, -48, 520, 96, { fill: 'rgba(255,255,255,0.0)', stroke: '#b3261e', width: 8 }, 12); p.text('遺伝の本体＝DNA', 0, 0, { size: 52, font: 'brush', weight: 400, fill: '#ff5a45', stroke: INK, strokeW: 8, align: 'center' }); p.restore(); }
}
function examPoint(rc: RC) {
  const { p } = rc;
  const d = rc.sc.data as { result: string; conclusion: string };
  const card = (y: number, head: string, body: string, a: number, hot: boolean) => {
    if (a <= 0) return;
    p.save(); p.translate(640, y); p.scale(1 + 0.4 * (1 - ease.outExpo(a)));
    p.rect(-470, -70, 940, 140, { fill: hot ? 'rgba(179,38,30,0.92)' : 'rgba(245,240,226,0.95)', stroke: INK, width: 8 }, 8);
    p.text(head, -430, 0, { size: 34, font: 'gothic', weight: 900, fill: hot ? '#fff' : '#b3261e' });
    p.text(body, 40, 0, { size: 46, font: 'gothic', weight: 900, fill: hot ? '#fff' : '#1b1b1b', align: 'center' });
    p.restore();
  };
  card(210, '結果', d.result, rc.u('exam', 0.2), false);
  card(420, '結論', d.conclusion, rc.u('box', 0.2), true);
}
function quizFig(rc: RC) {
  const { p } = rc;
  const q = rc.sc.data?.question as SingleQuestion | undefined;
  if (!q) return;
  p.rect(80, 40, 1120, 560, { fill: 'rgba(245,240,226,0.96)', stroke: INK, width: 8 }, 8);
  const stem = q.stem.replace(/<[^>]+>/g, '');
  const lines: string[] = []; for (let i = 0; i < stem.length; i += 34) lines.push(stem.slice(i, i + 34));
  lines.slice(0, 3).forEach((ln, i) => p.text(ln, 120, 90 + i * 40, { size: 28, font: 'gothic', weight: 700, fill: '#1b1b1b' }));
  const ans = rc.u('answer', 0.25);
  q.options.forEach((o, i) => {
    const y = 250 + i * 66, dim = ans > 0 && !o.correct ? 0.35 : 1;
    p.text(`${'ABCDE'[i]}．${o.text.replace(/<[^>]+>/g, '')}`, 150, y, { size: 28, font: 'gothic', weight: 700, fill: '#1b1b1b', opacity: dim });
    if (o.correct && ans > 0) p.ellipse(168, y, 34 + 20 * (1 - ease.outExpo(ans)), 30, 0, { stroke: '#d0251a', width: 7 });
  });
}
function boardGeneric(rc: RC) {
  const { p, sc } = rc;
  slate(rc);
  const lines = (sc.data?.lines as string[]) ?? [];
  const segs = sc.beats.flatMap((b) => b.segs);
  lines.forEach((ln, i) => {
    const cue = segs[Math.min(i, segs.length - 1)]?.cue ?? 'start';
    const r = rc.u(cue, 0.9), ch = [...ln];
    p.text(ch.slice(0, Math.round(ch.length * r)).join(''), 140, 140 + i * 92, { size: ch.length > 22 ? 40 : 52, font: 'hand', weight: 600, fill: i === 0 ? CHALK.y : CHALK.w });
  });
}
