/**
 * Scene 1「原本と写し」: Jin shows the slip and asks what a copy is → Deo: original (DNA) / copy (RNA)
 * / product (protein) on the desk → Avery's notebook (1944) → one smudged letter can travel all the way
 * to disease → Deo slides his brass loupe across the desk (→ letters).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, glow, grade, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure, type Pose } from '../../../../../engine/story/rig';
import { DEO, JIN } from '../cast';
import { HAND, MINCHO, bust, cues, deskBg, deskSet, inkArrow, lampPool, page, sheet, slip, softBg, tableTop, txt, blinkAt, talk } from '../sets';

const { c, e, d } = cues('library');

function deo(t: number, extra: Partial<Pose> = {}): Pose {
  return { x: 1060, y: 700, s: 570, dir: -1, t, yaw: -0.4, light: -1, noLegs: true, blink: blinkAt(t, 4), gazeX: -0.6, gazeY: 0.15,
    mouth: Math.max(talk(t, c[1], e[1]), talk(t, c[4], e[4]), talk(t, c[6], e[6])), armN: { at: [960, 486], grip: 0.3 }, armF: { at: [1120, 492], grip: 0.3 }, ...extra };
}
function jin(t: number, extra: Partial<Pose> = {}): Pose {
  const show = span(t, 0.2, 1.4, ease.out) * (1 - span(t, e[0] + 0.3, e[0] + 1.2, ease.inOut));
  return { x: 430, y: 860, s: 580, dir: 1, t, yaw: 0.45, light: 1, blink: blinkAt(t, 1), mouth: Math.max(talk(t, c[0], e[0]), talk(t, c[3], e[3])),
    gazeX: 0.8, gazeY: 0.1,
    armN: { at: [L(500, 600, show), L(560, 400, show)], grip: 1 }, holdN: (hx, hy) => slip(hx + 30, hy - 10, 74, -0.2 + show * 0.15),
    armF: { hand: [0.35, 1.15], grip: 1 }, holdF: (hx, hy) => page(hx + 10, hy - 26, 40, -0.1, 1),
    ...extra };
}

/** desk two-shot */
function twoShot(t: number, push = 0) {
  const hh = handheld(t, 1.8, 21);
  shot({ x: 640 + hh[0] + push * 40, y: 360 + hh[1], z: 1 + push * 0.06 }, 1, () => deskSet(t, () => drawFigure(DEO, deo(t)), () => drawFigure(JIN, jin(t))));
}

/** top-down desk: the original (chained ledger), the copy (pink sheet through the slot), the product (folded form) */
function flow(t: number) {
  const u = t - c[2];
  const cam = { x: L(440, 760, span(u, 1, 17, ease.inOut)), y: 360, z: 1.04 };
  shot(cam, 1, () => {
    g.drawImage(tableTop(), -200, 0, W + 400, H);
    lampPool(640, 300, 700, 0.9);
    // the original: a heavy blue ledger chained to the desk
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(200, 190, 300, 230, 12); g.fill();
    g.fillStyle = '#2e4a72'; rr(190, 176, 300, 230, 12); g.fill(); g.fillStyle = '#e9e0c8'; rr(196, 182, 288, 10, 3); g.fill();
    g.strokeStyle = '#c9a050'; g.lineWidth = 4; g.strokeRect(210, 196, 260, 200);
    txt('DNA', 340, 300, 54, '#f2e6c8'); txt('原本（核の中）', 340, 350, 24, '#f2e6c8', 1, 'center', MINCHO, 400);
    g.strokeStyle = '#8a8f9a'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(170 - i * 22, 300 + Math.sin(i) * 6, 12, 7, 0.3, 0, 7); g.stroke(); }
    // the copy comes off the ledger and slides out through a brass slot
    const cp = span(u, 3.5, 7.5, ease.inOut);
    inkArrow(500, 290, 640, 290, '#d14d7c', span(u, 2.5, 3.6));
    g.fillStyle = '#7a5a2a'; rr(690, 210, 26, 170, 6); g.fill(); g.fillStyle = '#c9a050'; rr(694, 214, 18, 162, 4); g.fill(); g.fillStyle = '#1a120c'; rr(699, 240, 8, 110, 3); g.fill();
    g.save(); g.translate(L(560, 760, cp), 290); g.rotate(-0.04);
    g.fillStyle = '#f6d8e2'; rr(-70, -46, 140, 92, 6); g.fill(); g.strokeStyle = '#d14d7c'; g.lineWidth = 2; g.strokeRect(-62, -38, 124, 76);
    txt('RNA', 0, 2, 34, '#a32a5a'); txt('写し', 0, 32, 18, '#a32a5a', 1, 'center', MINCHO, 400); g.restore();
    // outside the slot: the product
    const pr = span(u, 9, 12, ease.back);
    inkArrow(800, 290, 930, 290, '#3a9b69', span(u, 8, 9.2));
    if (pr > 0) {
      g.save(); g.translate(1060, 290); g.scale(pr, pr); g.rotate(Math.sin(t * 0.5) * 0.05);
      g.fillStyle = '#3a9b69'; g.beginPath(); for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283; const r = 70 + (i % 2) * 22 + Math.sin(i * 1.7) * 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, -20); g.quadraticCurveTo(0, -60, 30, 10); g.quadraticCurveTo(50, 40, -10, 40); g.stroke();
      g.restore();
      txt('蛋白質', 1060, 420, 30, '#e8f5ea', pr); txt('完成品（形と働き）', 1060, 452, 20, '#cfe8d4', pr, 'center', MINCHO, 400);
    }
    // the name of the flow
    const nm = span(u, 13.5, 15);
    if (nm > 0) { g.fillStyle = `rgba(20,14,10,${0.55 * nm})`; rr(330, 60, 620, 70, 35); g.fill(); txt('セントラルドグマ　DNA → RNA → 蛋白質', 640, 106, 30, '#ffe8c0', nm); }
  });
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
}

/** Avery's notebook: three dishes of R strain + S-strain fractions; only DNA turns them S */
function avery(t: number) {
  const u = t - c[4];
  g.drawImage(deskBg(), -200, 0, W * 1.3, H * 1.3); glow(1000, 200, 700, 'rgba(255,190,110,.5)', 1);
  const hh = handheld(t, 3, 22);
  sheet(640 + hh[0], 310 + hh[1], 900, 520, -0.02, (_w, h) => {
    txt('1944　Avery　肺炎球菌の形質転換', 0, -h / 2 + 64, 32, '#2a2320', span(u, 0.3, 1));
    txt('R株（病原性なし）に、S株の成分を一つずつ加える', 0, -h / 2 + 108, 22, '#5a4a40', span(u, 1.5, 2.2), 'center', HAND, 600);
    const parts: [string, number][] = [['蛋白質', 4.5], ['RNA', 6.5], ['DNA', 8.5]];
    parts.forEach(([n, at], i) => {
      const x = -280 + i * 280, y = 40, a = span(u, at - 1, at);
      if (a <= 0) return;
      g.globalAlpha = a;
      g.fillStyle = 'rgba(200,215,225,.6)'; g.beginPath(); g.ellipse(x, y, 110, 70, 0, 0, 7); g.fill(); g.strokeStyle = '#6a7a86'; g.lineWidth = 3; g.stroke();
      const sChange = n === 'DNA' ? span(u, at + 0.8, at + 2.5) : 0;
      for (let k = 0; k < 9; k++) { const cx2 = x - 60 + (k % 3) * 60, cy2 = y - 30 + Math.floor(k / 3) * 30; const rad = L(9, 13, sChange); g.fillStyle = sChange > 0.5 ? '#f4f0d8' : '#c8c2a2'; g.beginPath(); g.arc(cx2, cy2, rad, 0, 7); g.fill(); if (sChange > 0.5) { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(cx2 - 3, cy2 - 4, 3, 0, 7); g.fill(); } }
      txt(`＋ ${n}`, x, y - 96, 28, n === 'DNA' ? '#3f6aa8' : '#5a4a40', 1, 'center', HAND, 600);
      txt(sChange > 0.5 ? 'S株に変わる' : 'R株のまま', x, y + 108, 24, sChange > 0.5 ? '#b03232' : '#6a6058', n === 'DNA' ? span(u, at + 1.5, at + 2.3) : span(u, at + 0.3, at + 1), 'center', HAND, 600);
      g.globalAlpha = 1;
    });
    const fin = span(u, 12, 13.2);
    if (fin > 0) { g.strokeStyle = `rgba(176,50,50,${fin})`; g.lineWidth = 4; g.beginPath(); g.ellipse(280, 40, 140, 92, 0, 0, 7); g.stroke(); txt('形質を変えたのは DNA だけ', 0, h / 2 - 40, 30, '#b03232', fin, 'center', HAND, 600); }
  }, 'gen-avery');
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
}

/** a long scroll: one letter's error spreads molecule → cell → tissue → individual → disease */
function cascade(t: number) {
  const u = t - c[5];
  const cam = { x: L(300, 980, span(u, 2, 12, ease.inOut)), y: 360, z: 1.05 };
  shot(cam, 1, () => {
    g.drawImage(tableTop(), -300, 0, W + 600, H);
    lampPool(640, 330, 900, 0.85);
    sheet(640, 330, 1500, 300, 0, (w) => {
      const st: [string, (x: number) => void][] = [
        ['分子', (x) => { for (let s2 = 0; s2 < 2; s2++) { g.strokeStyle = s2 ? '#3f6aa8' : '#d14d7c'; g.lineWidth = 5; g.beginPath(); for (let y = -60; y <= 60; y += 4) g.lineTo(x + Math.sin(y / 14 + s2 * Math.PI) * 24, y - 10); g.stroke(); } }],
        ['細胞', (x) => { g.fillStyle = '#f2c6cf'; g.beginPath(); g.ellipse(x, -10, 70, 54, 0, 0, 7); g.fill(); g.fillStyle = '#9b6fb8'; g.beginPath(); g.arc(x + 8, -10, 22, 0, 7); g.fill(); }],
        ['組織', (x) => { for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#f2c6cf' : '#ecb9c4'; rr(x - 75 + (k % 3) * 50, -50 + Math.floor(k / 3) * 46, 46, 42, 8); g.fill(); g.fillStyle = '#9b6fb8'; g.beginPath(); g.arc(x - 52 + (k % 3) * 50, -29 + Math.floor(k / 3) * 46, 8, 0, 7); g.fill(); } }],
        ['個体', (x) => { g.fillStyle = '#5a4a40'; g.beginPath(); g.arc(x, -50, 18, 0, 7); g.fill(); rr(x - 22, -30, 44, 70, 14); g.fill(); }],
        ['疾患', (x) => { g.fillStyle = '#5a4a40'; g.beginPath(); g.arc(x, -50, 18, 0, 7); g.fill(); rr(x - 22, -30, 44, 70, 14); g.fill(); g.strokeStyle = '#b03232'; g.lineWidth = 5; g.beginPath(); g.arc(x + 34, -40, 16, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x + 34, -50); g.lineTo(x + 34, -30); g.moveTo(x + 24, -40); g.lineTo(x + 44, -40); g.stroke(); }],
      ];
      st.forEach(([n, fn], i) => {
        const x = -w / 2 + 170 + i * 290, a = span(u, 2 + i * 2, 3 + i * 2);
        if (a <= 0) return; g.globalAlpha = a; fn(x); txt(n, x, 100, 32, i === 4 ? '#b03232' : '#2a2320'); g.globalAlpha = 1;
        if (i < 4) inkArrow(x + 95, -10, x + 195, -10, '#7a6a5a', span(u, 3 + i * 2, 3.8 + i * 2));
      });
      // the spreading ink stain from the first letter
      const stain = span(u, 1, 12);
      g.fillStyle = `rgba(60,40,30,${0.12 * stain})`; g.beginPath(); g.ellipse(-w / 2 + 170 + stain * 580, 20, 80 + stain * 600, 90, 0, 0, 7); g.fill();
    }, 'gen-scroll');
  });
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
}

/** Deo slides the brass loupe across; Jin takes it; we dive into the lens */
const LOUPE_A: [number, number] = [930, 482], LOUPE_B: [number, number] = [640, 488];
function loupeHandoff(t: number) {
  const slide = span(t, c[6] + 1.6, c[6] + 3.2, ease.out);
  const grabT = e[6] - 0.3;
  const lx = L(LOUPE_A[0], LOUPE_B[0], slide), ly = L(LOUPE_A[1], LOUPE_B[1], slide);
  const reach = span(t, grabT - 0.8, grabT, ease.back), lift = span(t, grabT + 0.1, grabT + 1.1, ease.inOut);
  const hasIt = t >= grabT;
  const drawLoupe = (x: number, y: number, s: number) => { g.strokeStyle = '#b8892c'; g.lineWidth = 6 * s; g.fillStyle = 'rgba(210,230,240,.45)'; g.beginPath(); g.arc(x, y, 22 * s, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#5a3a1c'; rr(x + 18 * s, y - 5 * s, 44 * s, 10 * s, 4 * s); g.fill(); };
  shot({ x: 640, y: 360, z: 1.03 + span(t, c[6], d, ease.inOut) * 0.05 }, 1, () => deskSet(t, () => drawFigure(DEO, deo(t, slide < 1 && t > c[6] + 1.2 ? { lean: 0.12, armN: { at: [lx + 30, ly - 4], grip: 0.6 } } : {})), () => {
    if (!hasIt) drawLoupe(lx, ly, 1);
    drawFigure(JIN, jin(t, { gazeX: 1, gazeY: 0.6, armN: hasIt ? { at: [L(LOUPE_B[0], 540, lift), L(LOUPE_B[1], 400, lift)], grip: 1 } : { at: [L(520, LOUPE_B[0] + 20, reach), L(560, LOUPE_B[1], reach)], grip: L(0.2, 0.9, reach) },
      holdN: hasIt ? (hx, hy) => drawLoupe(hx + 30, hy - 10, 1.1) : undefined }));
  }));
  // iris into the lens
  const iris = span(t, d - 1.6, d - 0.1, ease.in);
  if (iris > 0) { const r = L(900, 2, iris); g.save(); g.fillStyle = '#050405'; g.beginPath(); g.rect(0, 0, W, H); g.moveTo(560 + r, 380); g.arc(560, 380, r, 0, Math.PI * 2, true); g.fill(); g.restore(); }
}

export function library(t: number) {
  if (t < c[1] - 0.2) twoShot(t);
  else if (t < c[2] - 0.2) {
    // Deo close-up: the rule of the house
    g.drawImage(softBg('deo', 380, 900, 1.6, 'rgba(10,6,10,.45)'), 0, 0); glow(260, 300, 600, 'rgba(255,190,110,.55)', 1);
    const hh = handheld(t, 2, 23);
    bust(DEO, 720 + hh[0], 300 + hh[1], 330, { yaw: -0.35, tilt: 0.05, gazeX: -0.6, gazeY: 0.1, mouth: talk(t, c[1], e[1]), blink: blinkAt(t, 4), brow: 0.1 }, t, -1);
    grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  } else if (t < c[3] - 0.2) flow(t);
  else if (t < c[4] - 0.2) {
    g.drawImage(softBg('jin', 0, 900, 1.6, 'rgba(10,6,10,.45)'), 0, 0); glow(1100, 260, 600, 'rgba(255,190,110,.6)', 1);
    const hh = handheld(t, 2, 24);
    bust(JIN, 560 + hh[0], 320 + hh[1], 330, { yaw: 0.32, tilt: -0.02, gazeX: 0.7, gazeY: -0.1, mouth: talk(t, c[3], e[3]), blink: blinkAt(t, 1), brow: 0.5 }, t, 1);
    grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  } else if (t < c[5] - 0.2) avery(t);
  else if (t < c[6] - 0.2) cascade(t);
  else loupeHandoff(t);
  // soft dips between cuts
  [c[1], c[2], c[3], c[4], c[5], c[6]].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.6));
  grain(t, 0.06);
  void H;
}
