/**
 * Scene 3「糸巻きと製本」: Jin walks into the deep stacks and finds Octa winding the original onto spools
 * (histone octamer, ~140 bp → nucleosome 11 nm) → spacer + H1 → chromatin → a bound volume (chromosome)
 * → the shelf of 46 (22 pairs + sex chromosomes, numbered by length) → centromere positions → the gap
 * where the page belongs; Octa loosens the spool and the page goes back → a crash down the aisle (→ meiosis).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { dust, ease, glow, grade, grain, handheld, noise, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { JIN, OCTA } from '../cast';
import { HAND, MINCHO, aisle, bust, cues, inkArrow, lampPool, page, slip, softBg, tableTop, txt, blinkAt, talk } from '../sets';

const { c, e, d } = cues('pack');
const HIS = ['#b48ad8', '#8a5cc2', '#d6b0e8', '#9b74c8']; // H2A H2B H3 H4

/** one nucleosome: eight histone beads (4 kinds × 2) with the DNA wrapped ~1.7 times */
function spool(x: number, y: number, r: number, t: number, wrap = 1, labels = 0) {
  for (let ring = 1; ring >= 0; ring--) for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + t * 0.4, bx = x + Math.cos(a) * r * 0.42 + (ring ? r * 0.12 : -r * 0.12), by = y + Math.sin(a) * r * 0.24 + (ring ? -r * 0.12 : r * 0.12);
    g.fillStyle = ring ? shadeK(HIS[i], 0.75) : HIS[i]; g.beginPath(); g.arc(bx, by, r * 0.32, 0, 7); g.fill();
    if (labels > 0 && ring === 0) txt(['H2A', 'H2B', 'H3', 'H4'][i], bx, by + r * 0.1, r * 0.22, '#2a1d38', labels);
  }
  // the wrapped DNA (two strands) — drawn as 1.7 loops of a tilted ellipse
  if (wrap > 0) {
    for (let s2 = 0; s2 < 2; s2++) {
      g.strokeStyle = s2 ? '#2e6db0' : '#d14d7c'; g.lineWidth = Math.max(2, r * 0.06); g.beginPath();
      const turns = 1.7 * wrap;
      for (let k = 0; k <= 80 * turns; k++) { const a = (k / 80) * Math.PI * 2 - Math.PI; const px = x + Math.cos(a) * r * 0.9, py = y + Math.sin(a) * r * 0.55 + (k / 80 - 0.85) * r * 0.5 + (s2 ? r * 0.05 : -r * 0.05); if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    }
  }
}
const shadeK = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16); return `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`; };
/** a straight stretch of DNA (two strands twisting) */
function dnaLine(x1: number, y1: number, x2: number, y2: number, t: number, w = 6) {
  const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1);
  g.save(); g.translate(x1, y1); g.rotate(ang);
  for (let s2 = 0; s2 < 2; s2++) { g.strokeStyle = s2 ? '#2e6db0' : '#d14d7c'; g.lineWidth = w * 0.45; g.beginPath(); for (let x = 0; x <= len; x += 5) g.lineTo(x, Math.sin(x / 9 + t * 2 + s2 * Math.PI) * w); g.stroke(); }
  g.restore();
}
/** a bound volume = a chromosome: two sister arms joined at the centromere (pos 0..1 from the top) */
function volume(x: number, y: number, h: number, col: string, cen = 0.5, label = '') {
  const w = h * 0.16;
  [-1, 1].forEach((s2) => { g.fillStyle = col; rr(x + s2 * w * 0.55 - w / 2, y - h / 2, w, h, w / 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 6; k++) g.fillRect(x + s2 * w * 0.55 - w / 2 + 2, y - h / 2 + h * (0.1 + k * 0.14), w - 4, h * 0.03); });
  g.fillStyle = '#ffd36b'; g.beginPath(); g.ellipse(x, y - h / 2 + h * cen, w * 1.05, w * 0.32, 0, 0, 7); g.fill();
  if (label) txt(label, x, y + h / 2 + 30, Math.max(14, h * 0.14), '#f2e6c8');
}

function walkIn(t: number) {
  const k = span(t, 0.3, c[1] - 0.6, (u) => u * u * (3 - 2 * u));
  const x = L(120, 560, k), moving = t < c[1] - 0.6;
  const par = k * 260;
  g.drawImage(aisle('pack', 0.6), -par * 0.3 - 60, 0, W * 1.15, H);
  lampPool(980, 420, 520, 0.9);
  // Octa at her winding bench under the lamp
  g.fillStyle = '#3a2516'; rr(880, 520, 340, 30, 6); g.fill(); g.fillStyle = '#24170e'; g.fillRect(900, 550, 20, 170); g.fillRect(1180, 550, 20, 170);
  g.fillStyle = '#6b4a2c'; g.beginPath(); g.ellipse(1050, 470, 70, 46, 0, 0, 7); g.fill(); spool(1050, 470, 56, t, 1);
  drawFigure(OCTA, { x: 1150, y: 700, s: 420, dir: -1, t, yaw: -0.5, light: -1, blink: blinkAt(t, 2), gazeX: -0.6, gazeY: 0.5, armN: { at: [1090 + Math.cos(t * 3) * 26, 470 + Math.sin(t * 3) * 26], grip: 0.8 }, armF: { at: [1040, 520], grip: 0.6 } });
  drawFigure(JIN, { x, y: 700, s: 430, dir: 1, t, yaw: 0.6, light: 1, blink: blinkAt(t, 1), walk: moving ? { p: (x - 120) / (430 * 0.115), amt: CL(Math.min(t * 2, (c[1] - 0.6 - t) * 2)) } : undefined,
    gazeX: 0.6, armF: { hand: [0.3, 1.1], grip: 1 }, holdF: (hx, hy) => page(hx + 10, hy - 26, 34, -0.1, 1), armN: moving ? undefined : { hand: [0.5, 1.2], grip: 1 }, holdN: (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) });
  // a near bookcase sliding past (parallax)
  g.fillStyle = '#0b0709'; rr(L(700, -200, k), -20, 120, H + 40, 6); g.fill();
  dust(t, [600, 200, 600, 400], 50, 41, (px, py) => CL(1 - Math.hypot(px - 980, py - 420) / 420));
}

function macro(t: number, u: number) {
  // the bench seen from close: the original pulled from the left and wound onto spools
  shot({ x: 640 + L(0, 120, span(u, 0, 16)), y: 360, z: 1.05 }, 1, () => {
    g.drawImage(tableTop('gen-bench'), -200, 0, W + 400, H);
    lampPool(700, 280, 760, 0.9);
    const n = Math.min(4, Math.floor(span(u, 1, 10) * 4 + 1));
    const xs = [380, 640, 900, 1160];
    dnaLine(-100, 330, xs[0] - 80, 330, t, 10);
    for (let i = 0; i < n; i++) {
      const born = span(u, 1 + i * 2.2, 2.5 + i * 2.2, ease.back);
      g.save(); g.translate(xs[i], 330); g.scale(born, born); spool(0, 0, 92, t * 0.2, span(u, 1.5 + i * 2.2, 3 + i * 2.2), i === 0 ? span(u, 4, 5.5) : 0); g.restore();
      if (i < n - 1) dnaLine(xs[i] + 82, 330, xs[i + 1] - 82, 330, t, 10);
    }
    const lb = span(u, 8, 9.5);
    txt('ヒストン八量体（H2A・H2B・H3・H4 が 2個ずつ）', 640, 110, 30, '#ffe8c0', span(u, 5, 6.2));
    txt('DNA 約140塩基対が巻き付く ＝ ヌクレオソーム', 640, 500, 32, '#ffe8c0', lb);
    if (lb > 0) { g.strokeStyle = `rgba(255,232,192,${lb})`; g.lineWidth = 2; g.beginPath(); g.moveTo(380 - 92, 222); g.lineTo(380 + 92, 222); g.moveTo(288, 214); g.lineTo(288, 230); g.moveTo(472, 214); g.lineTo(472, 230); g.stroke(); txt('直径 約11 nm', 380, 206, 24, '#ffe8c0', lb, 'center', HAND, 600); }
  });
}

function fold(t: number, u: number) {
  // spacer + H1 → chromatin fibre → a bound volume
  const toFibre = span(u, 6, 10, ease.inOut), toBook = span(u, 12, 16, ease.inOut);
  shot({ x: 640, y: 360, z: L(1.05, 0.95, toFibre) }, 1, () => {
    g.drawImage(tableTop('gen-bench'), -200, 0, W + 400, H);
    lampPool(640, 300, 760, 0.9);
    if (toFibre < 1) {
      g.save(); g.globalAlpha = 1 - toFibre;
      const xs = [280, 520, 760, 1000];
      xs.forEach((x, i) => { spool(x, 330, 80, t * 0.2, 1); if (i < 3) { dnaLine(x + 72, 330, xs[i + 1] - 72, 330, t, 9); const h1 = span(u, 2.5 + i * 0.5, 3.2 + i * 0.5, ease.back); if (h1 > 0) { g.fillStyle = '#e0b040'; rr(x + 60, 300, 26 * h1, 60 * h1, 8); g.fill(); } } });
      txt('スペーサー 20〜60塩基対', 640, 230, 28, '#ffe8c0', span(u, 0.6, 1.6));
      txt('H1ヒストン ＝ 留め金', 640, 450, 28, '#ffd36b', span(u, 3, 4));
      g.restore();
    }
    if (toFibre > 0 && toBook < 1) {
      g.save(); g.globalAlpha = toFibre * (1 - toBook);
      for (let i = 0; i < 40; i++) { const a = i * 0.9, x = 260 + i * 19, y = 330 + Math.sin(a) * 40; g.fillStyle = HIS[i % 4]; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); }
      txt('折りたたまれて クロマチン', 640, 470, 32, '#ffe8c0');
      g.restore();
    }
    if (toBook > 0) {
      g.save(); g.globalAlpha = toBook;
      volume(640, 320, L(120, 300, toBook), '#8a5cc2', 0.42);
      txt('分裂のときは 染色体（幅 約1400 nm）', 640, 120, 32, '#ffe8c0', span(u, 15, 16.2));
      g.restore();
    }
  });
}

function shelf46(u: number) {
  const pan = span(u, 0.5, 12, ease.inOut);
  shot({ x: L(520, 860, pan), y: 360, z: 1.0 }, 1, () => {
    g.drawImage(softBg('shelf', 400, 300, 1.4, 'rgba(10,6,10,.6)'), -200, 0, W + 400, H);
    g.fillStyle = '#3a2516'; g.fillRect(-200, 470, W + 600, 26);
    for (let i = 0; i < 24; i++) {
      const x = 30 + i * 58, hgt = i < 22 ? L(250, 70, i / 21) : (i === 22 ? 160 : 60), col = i < 22 ? '#7d5aa8' : i === 22 ? '#d14d7c' : '#2e6db0';
      const a = span(u, 0.5 + i * 0.25, 1 + i * 0.25);
      g.globalAlpha = a;
      [-1, 1].forEach((s2) => { if (i === 23 && s2 === 1) return; g.fillStyle = s2 < 0 ? col : shadeK(col.length === 7 ? col : '#7d5aa8', 0.8); rr(x + s2 * 13 - 11, 470 - hgt, 22, hgt, 5); g.fill(); });
      txt(i < 22 ? String(i + 1) : i === 22 ? 'X' : 'Y', x, 526, 22, '#f2e6c8');
      g.globalAlpha = 1;
    }
    txt('46冊 ＝ 常染色体 22対 ＋ 性染色体（XY または XX）', 700, 100, 32, '#ffe8c0', span(u, 5, 6.2));
    txt('長い順に 1番〜22番', 700, 146, 26, '#e8d0a8', span(u, 7, 8), 'center', HAND, 600);
  });
}

function centromeres(u: number) {
  g.drawImage(softBg('shelf', 400, 300, 1.4, 'rgba(10,6,10,.6)'), 0, 0);
  lampPool(640, 300, 700, 0.8);
  const kinds: [string, number][] = [['メタセントリック', 0.5], ['サブメタセントリック', 0.33], ['アクロセントリック', 0.08]];
  kinds.forEach(([n, cpos], i) => { const a = span(u, 1 + i * 2.2, 2 + i * 2.2, ease.back); if (a <= 0) return; g.save(); g.translate(330 + i * 310, 330); g.scale(a, a); volume(0, 0, 280, '#8a5cc2', cpos); g.restore(); txt(n, 330 + i * 310, 530, 26, '#ffe8c0', a); });
  txt('綴じ目 ＝ セントロメアの位置', 640, 110, 32, '#ffe8c0', span(u, 0.3, 1.2));
}

function putBack(t: number) {
  // over Jin's shoulder: the gap in the volume, the spool loosens, the page slides home
  const u = t - (c[6] - 0.2);
  const loosen = span(t, c[7] + 0.5, c[7] + 2, ease.inOut), slideIn = span(t, c[7] + 2.2, c[7] + 3.6, ease.out), seal = span(t, c[7] + 3.6, c[7] + 4.4);
  g.drawImage(softBg('shelf', 400, 300, 1.4, 'rgba(10,6,10,.55)'), 0, 0);
  lampPool(760, 300, 700, 1);
  const hh = handheld(t, 2, 43);
  shot({ x: 640 + hh[0], y: 360 + hh[1], z: 1 + span(u, 0, 8) * 0.06 }, 1, () => {
    // the open volume with a missing page slot
    g.fillStyle = '#5a3d7a'; rr(560, 140, 420, 360, 10); g.fill(); g.fillStyle = '#efe3c8'; rr(580, 156, 380, 330, 6); g.fill();
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(40,35,30,.35)'; g.fillRect(610, 186 + i * 32, 320 - (i % 3) * 40, 5); }
    const gapGlow = (1 - seal) * (0.5 + 0.5 * Math.sin(t * 4));
    g.fillStyle = `rgba(30,20,15,${0.8 * (1 - slideIn)})`; rr(700, 156, 30, 330, 3); g.fill();
    glow(715, 320, 160, 'rgba(255,214,120,.7)', gapGlow * 0.8);
    // the spool above, loosening (turns back) and tightening again
    g.save(); g.translate(1100, 220); g.rotate(-loosen * 2 + seal * 2); spool(0, 0, 70, t * 0.2, 1 - loosen * 0.5 + seal * 0.5); g.restore();
    // the page in Jin's hand slides into the slot
    page(L(420, 715, slideIn), L(380, 320, slideIn), L(80, 30, slideIn), L(-0.2, 0, slideIn), L(1, 0.12, slideIn), seal);
    if (seal > 0) glow(715, 320, 260, 'rgba(255,230,160,.8)', seal * (1 - span(t, c[7] + 4.4, c[7] + 5.4)));
  });
  // Jin's shoulder in the foreground (soft) and Octa's hands on the spool crank
  g.save(); g.globalAlpha = 0.95; g.fillStyle = JIN.topShade; g.beginPath(); g.moveTo(-40, H); g.bezierCurveTo(0, 560, 160, 520, 300, 560); g.bezierCurveTo(380, 590, 420, 660, 430, H); g.fill(); g.fillStyle = JIN.hair; g.beginPath(); g.ellipse(170, 470, 110, 120, -0.2, 0, 7); g.fill(); g.restore();
  txt('ここに、一枚', 715, 120, 28, '#ffe8c0', span(t, c[6] + 1, c[6] + 2) * (1 - seal), 'center', HAND, 600);
}

function crash(t: number) {
  const u = t - (c[8] - 0.2), fall = span(u, 0.4, 2.2);
  const shake = Math.exp(-Math.max(0, u - 0.6) * 4) * (u > 0.6 ? 4 : 0);
  shot({ x: 640 + Math.sin(t * 50) * shake, y: 360 + Math.cos(t * 43) * shake, z: 1.0 }, 1, () => {
    g.drawImage(aisle('pack', 0.4), -60, 0, W * 1.1, H);
    // far down the aisle, a stack of books tumbles
    for (let i = 0; i < 10; i++) { const k = CL(fall * 1.4 - i * 0.05); const x = 860 + (i % 3) * 22 + k * (i % 2 ? 60 : -40), y = 300 + i * 6 + k * k * 120, r = k * (i % 2 ? 2 : -1.5); g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = ['#6d3b33', '#3f4f63', '#71603e', '#4c3c5e'][i % 4]; rr(-18, -6, 36, 12, 2); g.fill(); g.restore(); }
    if (u > 0.8) for (let i = 0; i < 30; i++) { const p = CL((u - 0.8) * 0.6), a = i * 0.7; glow(860 + Math.cos(a) * p * 140, 420 + Math.sin(a) * p * 40 - p * 30, 30, 'rgba(200,180,150,.35)', (1 - p) * 0.8, 'source-over'); }
    // Jin and Octa turn toward the sound
    const turn = span(u, 0.9, 1.5, ease.out);
    drawFigure(JIN, { x: 380, y: 720, s: 440, dir: 1, t, yaw: L(0.3, 0.75, turn), light: 1, gazeX: L(0.2, 1, span(u, 0.7, 0.9)), brow: turn * 0.8, mouth: turn * 0.15, blink: 0, armN: { hand: [0.5, 1.2], grip: 1 }, holdN: (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) });
    drawFigure(OCTA, { x: 220, y: 720, s: 420, dir: 1, t, yaw: L(-0.2, 0.7, turn), light: 1, gazeX: L(-0.3, 1, span(u, 0.8, 1.0)), brow: turn * 0.6, blink: 0 });
  });
}

export function pack(t: number, dd: number) {
  if (t < c[1] - 0.2) walkIn(t);
  else if (t < c[2] - 0.2) {
    g.drawImage(softBg('octa', 520, 700, 1.5, 'rgba(10,6,10,.45)'), 0, 0); glow(980, 300, 600, 'rgba(255,190,110,.6)', 1);
    const hh = handheld(t, 2, 42);
    g.save(); g.globalAlpha = 0.6; spool(1080, 300, 120, t * 0.2, 1); g.restore();
    bust(OCTA, 560 + hh[0], 320 + hh[1], 330, { yaw: 0.3, gazeX: -0.5, gazeY: 0.1, mouth: talk(t, c[1], e[1]), blink: blinkAt(t, 2), smile: 0.4 }, t, 1);
  } else if (t < c[3] - 0.2) macro(t, t - (c[2] - 0.2));
  else if (t < c[4] - 0.2) fold(t, t - (c[3] - 0.2));
  else if (t < c[5] - 0.2) shelf46(t - (c[4] - 0.2));
  else if (t < c[6] - 0.2) centromeres(t - (c[5] - 0.2));
  else if (t < c[8] - 0.2) putBack(t);
  else crash(t);
  [c[1], c[2], c[3], c[4], c[5], c[6], c[8]].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.55));
  wash('#050405', 1 - span(t, 0, 0.8));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  grain(t, 0.06);
  void dd; void d; void H; void noise; void inkArrow; void MINCHO;
}
