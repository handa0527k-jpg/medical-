/**
 * Scene 4「配り間違い」: the crash was Mei's cart. Jin runs in → Mei sorts 46 into 23 (meiosis) → each
 * volume copied into sister chromatids → division I separates homologues, division II the sisters → Jin
 * spots two volumes stuck together in one crate (nondisjunction → trisomy / monosomy) → 13, 18, 21 →
 * the oocyte crate waiting under an hourglass → Jin pulls the two apart → the clock says 2:00 (→ read).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { dust, ease, glow, grade, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { JIN, MEI } from '../cast';
import { HAND, aisle, brassClock, bust, cues, inkArrow, lampPool, slip, softBg, tableTop, txt, blinkAt, talk } from '../sets';

const { c, e, d } = cues('meiosis');
const PAT = '#3f6aa8', MAT = '#c25478', OTHER = '#5a9a6a';

/** a closed book lying or standing: w × h, rotated, with a spine band */
function book(x: number, y: number, w: number, h: number, rot: number, col: string) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,.35)'; rr(-w / 2 + 4, -h / 2 + 5, w, h, 3); g.fill();
  g.fillStyle = col; rr(-w / 2, -h / 2, w, h, 3); g.fill();
  g.fillStyle = 'rgba(255,240,200,.75)'; g.fillRect(-w / 2 + 3, -h / 2 + h * 0.18, w - 6, Math.max(2, h * 0.05)); g.fillRect(-w / 2 + 3, h / 2 - h * 0.24, w - 6, Math.max(2, h * 0.05));
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-w / 2, -h / 2, w * 0.3, h);
  g.restore();
}
/** a chromosome as one or two bound volumes (sister chromatids) joined at the centromere */
function chrom(x: number, y: number, h: number, col: string, sisters = 2, rot = 0, a = 1) {
  if (a <= 0) return;
  const w = h * 0.2;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  const xs = sisters === 2 ? [-w * 0.55, w * 0.55] : [0];
  xs.forEach((sx) => { g.fillStyle = col; rr(sx - w / 2, -h / 2, w, h, w / 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; for (let k = 0; k < 5; k++) g.fillRect(sx - w / 2 + 2, -h / 2 + h * (0.12 + k * 0.17), w - 4, h * 0.035); });
  g.fillStyle = '#ffd36b'; g.beginPath(); g.ellipse(0, -h * 0.08, sisters === 2 ? w * 1.05 : w * 0.6, w * 0.3, 0, 0, 7); g.fill();
  g.restore();
}
/** a wooden crate seen from above, labelled */
function crate(x: number, y: number, w: number, h: number, label = '', a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(0,0,0,.4)'; rr(x - w / 2 + 6, y - h / 2 + 8, w, h, 8); g.fill();
  g.fillStyle = '#7a5332'; rr(x - w / 2, y - h / 2, w, h, 8); g.fill();
  g.fillStyle = '#3a2516'; rr(x - w / 2 + 12, y - h / 2 + 12, w - 24, h - 24, 4); g.fill();
  g.strokeStyle = 'rgba(255,220,170,.25)'; g.lineWidth = 2; rr(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4, 7); g.stroke();
  g.restore();
  if (label) txt(label, x, y + h / 2 + 30, 22, '#f2e6c8', a, 'center', HAND, 600);
}
/** the distribution cart, tipped by `tip` (0..1) */
function cart(x: number, y: number, tip: number) {
  g.save(); g.translate(x, y); g.rotate(-tip * 0.12);
  g.fillStyle = '#2a1a10'; [-110, 110].forEach((wx) => { g.beginPath(); g.arc(wx, 66, 18, 0, 7); g.fill(); });
  g.fillStyle = '#6b4a2c'; rr(-150, -40, 300, 96, 8); g.fill(); g.fillStyle = '#4a3220'; rr(-150, 30, 300, 20, 4); g.fill();
  g.strokeStyle = '#8a6a44'; g.lineWidth = 6; g.beginPath(); g.moveTo(150, -40); g.lineTo(190, -110); g.stroke();
  for (let i = 0; i < 6; i++) book(-110 + i * 40, -64, 30, 52, (i % 2 ? 0.08 : -0.05) + tip * 0.3, i % 2 ? MAT : PAT);
  g.restore();
}

/* ---------- shots ---------- */
function spill(t: number) {
  const run = span(t, 0.2, 2.3, (u) => u * u * (3 - 2 * u)), x = L(-120, 430, run), moving = t < 2.3;
  const fallB = span(t, 0.5, 1.1, ease.in), thud = t > 1.1 ? Math.exp(-(t - 1.1) * 7) * 3 : 0;
  shot({ x: L(560, 680, run) + Math.sin(t * 60) * thud, y: 360, z: 1.02 }, 1, () => {
    g.drawImage(aisle('mei', 0.55), -80, 0, W * 1.15, H);
    lampPool(1000, 380, 560, 0.9);
    // the floor and the spilled books
    g.fillStyle = 'rgba(20,12,8,.5)'; g.fillRect(-200, 590, W + 400, 200);
    [[760, 616, 0.6, PAT], [850, 640, -0.3, MAT], [690, 650, 1.4, MAT], [940, 630, 2.2, PAT], [820, 600, 0.1, PAT]].forEach(([bx, by, r, col]) => book(bx as number, by as number, 70, 46, r as number, col as string));
    book(L(1090, 1000, fallB), L(470, 630, fallB), 46, 70, L(0, 1.9, fallB), MAT);
    // Mei kneels behind the cart, gathering
    drawFigure(MEI, { x: 1110, y: 790, s: 520, dir: -1, t, yaw: L(-0.2, -0.6, span(t, 1.2, 1.8)), light: -1, noLegs: true, blink: blinkAt(t, 5), mouth: talk(t, c[0], e[0]),
      gazeX: L(0.2, -0.8, span(t, 1.2, 1.8, ease.out)), gazeY: 0.2, brow: 0.6, smile: 0.1,
      armN: { at: [1000, 500], grip: 0.9 }, holdN: (hx, hy) => book(hx - 10, hy - 10, 40, 60, 0.3, PAT), armF: { at: [1150, 510], grip: 0.5 } });
    cart(1080, 550, 1);
    drawFigure(JIN, { x, y: 690, s: 460, dir: 1, t, yaw: 0.6, light: 1, blink: blinkAt(t, 1), lean: moving ? 0.12 : L(0.12, 0, span(t, 2.3, 3, ease.settle)),
      walk: moving ? { p: (x + 120) / (440 * 0.1), amt: CL(Math.min(t * 3, (2.3 - t) * 3)) } : undefined, gazeX: 0.8, gazeY: 0.3, brow: 0.5,
      armN: { hand: [0.5, 1.15], grip: 1 }, holdN: (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) });
    dust(t, [600, 420, 600, 300], 50, 61, (px, py) => CL(1 - Math.hypot(px - 900, py - 640) / 380));
  });
}

/** the sorting table from above: 23 pairs, then one of each pair goes to each of two crates */
function sorting(t: number, u: number) {
  shot({ x: 640, y: 360, z: L(1.0, 1.06, span(u, 0, 10, ease.inOut)) }, 1, () => {
    g.drawImage(tableTop('gen-sort'), -100, 0, W + 200, H);
    lampPool(640, 300, 760, 0.95);
    const split = span(u, 4, 8, ease.inOut);
    crate(260, 330, 300, 320, '', split); crate(1020, 330, 300, 320, '', split);
    for (let i = 0; i < 23; i++) {
      const col = i % 8, row = Math.floor(i / 8), hh = L(80, 30, i / 22);
      const x0 = 400 + col * 68, y0 = 210 + row * 120;
      const tx = 165 + (i % 6) * 38, ty = 220 + Math.floor(i / 6) * 70;
      [[PAT, -12, 0], [MAT, 12, 1]].forEach(([colr, off, side]) => {
        const dx = side ? tx + 760 : tx, k = CL(split * 1.3 - (i / 23) * 0.3);
        g.save(); g.translate(L(x0 + (off as number), dx, k), L(y0, ty, k)); book(0, 0, 18, hh * L(1, 0.6, k), 0, colr as string); g.restore();
      });
    }
    txt('46冊 → 23冊ずつ', 640, 90, 36, '#ffe8c0', span(u, 2, 3));
    txt('減数分裂', 640, 520, 34, '#ffd36b', span(u, 7.5, 8.5));
  });
  void t;
}

/** Mei explains; then an insert: one volume is copied into two sisters, joined at the centromere */
function sisters(t: number, u: number) {
  if (u < 4.6) {
    g.drawImage(softBg('mei', 520, 760, 1.5, 'rgba(10,6,10,.45)'), 0, 0); glow(1000, 280, 620, 'rgba(255,190,110,.55)', 1);
    const hh = handheld(t, 2, 44);
    bust(MEI, 600 + hh[0], 320 + hh[1], 330, { yaw: 0.3, gazeX: -0.4, gazeY: 0.1, mouth: talk(t, c[2], e[2]), blink: blinkAt(t, 5), smile: 0.35 }, t, 1);
    return;
  }
  const v = u - 4.6;
  g.drawImage(tableTop('gen-sort'), 0, 0); lampPool(640, 300, 700, 0.95);
  const cp = span(v, 0.3, 2.2, ease.inOut);
  shot({ x: 640, y: 340, z: 1.1 - cp * 0.05 }, 1, () => {
    chrom(L(640, 640, cp), 300, 300, PAT, cp > 0.5 ? 2 : 1);
    if (cp > 0 && cp < 1) { g.fillStyle = `rgba(255,240,200,${0.8 * Math.sin(cp * Math.PI)})`; g.fillRect(560, 150 + cp * 300 - 4, 160, 8); }
    txt('写しをとって 2冊に ＝ 姉妹染色分体', 640, 110, 32, '#ffe8c0', span(v, 1.6, 2.6));
    txt('そして 2回に分けて配る', 640, 520, 30, '#ffd36b', span(v, 3.5, 4.5), 'center', HAND, 600);
  });
}

/** division I and II on the table: homologues part, then sisters part → four gametes, one volume each */
function divisions(t: number, u: number, bad = false) {
  shot({ x: 640, y: 350, z: 1.0 }, 1, () => {
    g.drawImage(tableTop('gen-sort'), -100, 0, W + 200, H);
    lampPool(640, 280, 780, 0.95);
    const m1 = span(u, bad ? 2 : 3, bad ? 5 : 7, ease.inOut), m2 = bad ? 0 : span(u, 8.5, 12, ease.inOut);
    // the pair
    if (!bad) {
      txt('父から', 470, 180, 22, '#a8c4f0', span(u, 0.5, 1.5) * (1 - m1), 'center', HAND, 600);
      txt('母から', 810, 180, 22, '#f0a8c0', span(u, 0.5, 1.5) * (1 - m1), 'center', HAND, 600);
      txt('第一分裂：相同染色体が分かれる', 640, 56, 30, '#ffe8c0', span(u, 3, 4) * (1 - span(u, 8, 8.6)));
      txt('第二分裂：姉妹染色分体が分かれる', 640, 60, 30, '#ffe8c0', span(u, 8.6, 9.4) * (1 - span(u, 13, 13.6)));
      txt('配偶子には 各巻が1冊ずつ', 640, 60, 32, '#ffd36b', span(u, 13.6, 14.4));
    } else {
      txt('不分離', 640, 60, 34, '#ff9a8a', span(u, 0, 1));
    }
    const lab = bad ? 1 - span(u, 10, 10.6) : 0;
    crate(330, 290, 260, 200, '', span(u, 1, 2)); crate(950, 290, 260, 200, '', span(u, 1, 2));
    txt('2冊', 330, 424, 26, '#f2e6c8', lab, 'center', HAND, 600); txt('0冊', 950, 424, 26, '#f2e6c8', lab, 'center', HAND, 600);
    // pair positions → crates
    const pX = bad ? L(600, 310, m1) : L(600, 330, m1), mX = bad ? L(680, 370, m1) : L(680, 950, m1);
    const py = L(170, 290, m1);
    if (m2 <= 0) { chrom(pX, py, 150, PAT); chrom(mX, py, 150, MAT); }
    if (bad) { if (m1 > 0.2 && m1 < 1) glow(640, 260, 80, 'rgba(255,90,70,.7)', 0.6); }
    // division II: each crate → two gamete boxes below, one sister each
    if (m2 > 0) {
      [[330, PAT], [950, MAT]].forEach(([cx, col]) => {
        const x0 = cx as number;
        [-1, 1].forEach((s2) => {
          crate(x0 + s2 * 150, 480, 140, 130, '', m2);
          chrom(L(x0 + s2 * 16, x0 + s2 * 150, m2), L(290, 476, m2), L(150, 100, m2), col as string, 1);
        });
      });
    }
    if (bad) {
      // fertilisation adds one more from the partner
      const f = span(u, 8, 11, ease.out), res = span(u, 10.5, 12);
      if (f > 0) {
        [[330, 2], [950, 0]].forEach(([cx]) => { chrom(L(cx as number + 200, cx as number + 70, f), L(480, 290, f), 130, OTHER, 1, 0, f); });
        txt('＋1（受精）', 640, 300, 26, '#b8e0c0', span(u, 8, 9), 'center', HAND, 600);
      }
      txt('3冊 ＝ トリソミー', 330, 450, 34, '#ffd36b', res);
      txt('1冊 ＝ モノソミー', 950, 450, 34, '#ffd36b', res);
    }
  });
  void t;
}

/** Jin, close, noticing; the crate with two volumes stuck together in the foreground */
function noticing(t: number, u: number) {
  g.drawImage(softBg('mei', 520, 760, 1.5, 'rgba(10,6,10,.5)'), 0, 0); glow(900, 300, 600, 'rgba(255,190,110,.5)', 1);
  const hh = handheld(t, 2.2, 45), turn = span(u, 0.2, 1.2, ease.antic);
  bust(JIN, 380 + hh[0], 300 + hh[1], 320, { yaw: L(0.1, 0.5, turn), gazeX: L(0, 0.9, turn), gazeY: 0.55, brow: 0.6, mouth: talk(t, c[4], e[4]), blink: blinkAt(t, 1) }, t, 1);
  // crate (sharp, foreground right)
  g.save(); g.translate(930, 400); g.rotate(-0.06);
  g.fillStyle = '#7a5332'; rr(-200, -110, 400, 260, 10); g.fill(); g.fillStyle = '#2e1d11'; rr(-180, -96, 360, 120, 6); g.fill();
  book(-30, -50, 46, 120, -0.05, MAT); book(16, -50, 46, 120, 0.04, MAT);
  g.strokeStyle = '#ffd36b'; g.lineWidth = 3; g.beginPath(); g.moveTo(-6, -100); g.lineTo(-6, 0); g.stroke();
  g.restore();
  glow(930, 350, 150, 'rgba(255,214,120,.6)', 0.5 + 0.3 * Math.sin(t * 4));
}

/** the shelf of 22: only 13, 18 and 21 light up */
function survivors(t: number, u: number) {
  g.drawImage(softBg('shelf', 400, 300, 1.4, 'rgba(10,6,10,.62)'), 0, 0);
  const hh = handheld(t, 1.6, 46);
  bust(MEI, 1130 + hh[0], 330 + hh[1], 300, { yaw: -0.35, gazeX: -0.7, gazeY: 0.2, mouth: talk(t, c[6], e[6]), blink: blinkAt(t, 5), smile: 0.1, brow: 0.3 }, t, -1);
  shot({ x: 640 + L(0, 40, span(u, 0, 8)), y: 360, z: 1 }, 1, () => {
    g.fillStyle = '#3a2516'; g.fillRect(30, 470, 700, 22);
    for (let i = 0; i < 22; i++) {
      const n = i + 1, x = 60 + i * 31, hgt = L(240, 80, i / 21), lit = [13, 18, 21].indexOf(n);
      const on = lit >= 0 ? span(u, 3.6 + lit * 1.1, 4.2 + lit * 1.1, ease.back) : 0;
      g.fillStyle = lit >= 0 ? `rgb(${Math.round(L(90, 230, on))},${Math.round(L(70, 170, on))},${Math.round(L(120, 90, on))})` : 'rgba(110,90,140,.55)';
      rr(x - 13, 470 - hgt, 26, hgt, 4); g.fill();
      if (on > 0) glow(x, 470 - hgt / 2, 90, 'rgba(255,200,110,.6)', on * 0.8);
      txt(String(n), x, 520, lit >= 0 ? 24 : 16, lit >= 0 ? '#ffd36b' : 'rgba(240,230,200,.5)');
    }
    txt('生まれてくることができる 常染色体トリソミー', 400, 110, 28, '#ffe8c0', span(u, 1, 2));
    txt('13番・18番・21番', 400, 160, 34, '#ffd36b', span(u, 6.5, 7.3));
  });
}

/** the oocyte crate waiting under an hourglass */
function waiting(t: number, u: number) {
  const push = span(u, 0, 11, ease.inOut);
  shot({ x: 640, y: 340, z: L(1, 1.12, push) }, 1, () => {
    g.drawImage(softBg('shelf', 400, 300, 1.4, 'rgba(10,6,10,.6)'), 0, 0);
    lampPool(560, 300, 620, 0.9);
    g.fillStyle = '#3a2516'; g.fillRect(200, 470, 760, 22);
    // crate with the pair still together (paused in prophase I)
    g.fillStyle = '#7a5332'; rr(300, 330, 300, 140, 8); g.fill(); g.fillStyle = '#2e1d11'; rr(316, 344, 268, 60, 4); g.fill();
    chrom(420, 330, 110, PAT); chrom(480, 330, 110, MAT);
    txt('卵子', 450, 446, 28, '#f2e6c8');
    // hourglass
    const hx = 760, hy = 360, sand = (u / 11 + t * 0.01) % 1;
    g.fillStyle = '#8a6a2c'; rr(hx - 70, hy - 120, 140, 14, 4); g.fill(); rr(hx - 70, hy + 106, 140, 14, 4); g.fill();
    g.strokeStyle = 'rgba(220,235,245,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx - 56, hy - 106); g.quadraticCurveTo(hx - 50, hy - 10, hx - 4, hy); g.quadraticCurveTo(hx - 50, hy + 10, hx - 56, hy + 106); g.moveTo(hx + 56, hy - 106); g.quadraticCurveTo(hx + 50, hy - 10, hx + 4, hy); g.quadraticCurveTo(hx + 50, hy + 10, hx + 56, hy + 106); g.stroke();
    g.fillStyle = '#e6c27a'; const top = 80 * (1 - sand), bot = 80 * sand;
    g.beginPath(); g.moveTo(hx - 40 * (1 - sand) - 6, hy - 6 - top * 0.9); g.lineTo(hx + 40 * (1 - sand) + 6, hy - 6 - top * 0.9); g.lineTo(hx, hy - 4); g.fill();
    g.beginPath(); g.moveTo(hx - 50, hy + 104); g.lineTo(hx + 50, hy + 104); g.lineTo(hx, hy + 104 - bot); g.fill();
    g.fillRect(hx - 1.5, hy - 4, 3, 104);
    txt('減数第一分裂の前期で、長く待つ', 600, 110, 30, '#ffe8c0', span(u, 1, 2));
    // a small rising curve: age → nondisjunction
    const gr = span(u, 6.5, 9.5);
    if (gr > 0) {
      g.strokeStyle = 'rgba(255,232,192,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(930, 300); g.lineTo(930, 440); g.lineTo(1150, 440); g.stroke();
      g.strokeStyle = '#ff9a8a'; g.lineWidth = 4; g.beginPath(); for (let k = 0; k <= 30 * gr; k++) { const p = k / 30; g.lineTo(930 + p * 220, 436 - Math.pow(p, 3) * 130); } g.stroke();
      txt('年齢', 1100, 470, 20, '#f2e6c8', gr, 'center', HAND, 600); txt('不分離', 980, 290, 20, '#ff9a8a', gr, 'center', HAND, 600);
    }
  });
}

/** Jin pulls the two stuck volumes apart and hands one to Mei */
function fixIt(t: number, u: number) {
  const pull = span(u, 0.5, 1.6, ease.antic), give = span(u, 2.2, 3.4, ease.out);
  shot({ x: 720, y: 450, z: 1.32 + span(u, 0, 6) * 0.05 }, 1, () => {
    g.drawImage(aisle('mei', 0.55), -80, 0, W * 1.15, H);
    lampPool(760, 380, 560, 0.95);
    drawFigure(MEI, { x: 990, y: 790, s: 500, dir: -1, t, yaw: -0.5, light: -1, noLegs: true, blink: blinkAt(t, 5), gazeX: L(-0.6, -0.9, give), gazeY: 0.3, smile: L(0.1, 0.7, give),
      armN: { at: [L(900, 780, give), L(560, 470, give)], grip: L(0.3, 1, give) }, armF: { at: [1040, 560], grip: 0.5 } });
    cart(880, 570, 0.15);
    const bA: [number, number] = [L(690, 640, pull), 470], bB: [number, number] = [L(700, L(740, 790, give), pull), L(470, 450, give)];
    drawFigure(JIN, { x: 560, y: 730, s: 450, dir: 1, t, yaw: 0.6, light: 1, blink: blinkAt(t, 1), mouth: talk(t, c[8], e[8]), gazeX: L(0.6, 0.9, give), gazeY: L(0.6, 0.1, span(u, 3.5, 4.4)), smile: span(u, 3.6, 4.6) * 0.4,
      armF: { at: [bA[0], bA[1] + 20], grip: 1 }, holdF: (hx, hy) => book(hx, hy - 24, 34, 60, -0.1, MAT),
      armN: { at: [bB[0], bB[1] + 20], grip: 1 }, holdN: (hx, hy) => book(hx, hy - 24, 34, 60, 0.12, MAT) });
  });
}

/** the clock says 2:00; Jin looks down at the slip and turns back toward the scriptorium */
function twoAM(t: number, u: number) {
  if (u < 3.4) {
    const push = span(u, 0, 3.4, ease.inOut);
    g.drawImage(softBg('mei', 520, 760, 1.5, 'rgba(10,6,10,.6)'), 0, 0);
    shot({ x: 640, y: 330, z: L(1, 1.25, push) }, 1, () => { lampPool(640, 330, 500, 0.9); brassClock(640, 360, 150, 2, 0); });
    return;
  }
  const v = u - 3.4;
  g.drawImage(softBg('mei', 520, 760, 1.5, 'rgba(10,6,10,.5)'), 0, 0); glow(900, 300, 600, 'rgba(255,190,110,.5)', 1);
  const hh = handheld(t, 1.8, 47), look = span(v, 0.6, 1.6, ease.inOut);
  bust(JIN, 520 + hh[0] + look * 40, 310 + hh[1], 320, { yaw: L(0.4, 0.15, look), gazeX: L(0.3, 0.2, look), gazeY: L(0.1, 0.9, look), tilt: look * 0.08, blink: blinkAt(t, 1) }, t, 1);
  slip(L(820, 780, look), L(640, 560, look), 200, -0.12);
}

export function meiosis(t: number, dd: number) {
  if (t < c[1] - 0.2) spill(t);
  else if (t < c[2] - 0.2) sorting(t, t - (c[1] - 0.2));
  else if (t < c[3] - 0.2) sisters(t, t - (c[2] - 0.2));
  else if (t < c[4] - 0.2) divisions(t, t - (c[3] - 0.2));
  else if (t < c[5] - 0.2) noticing(t, t - (c[4] - 0.2));
  else if (t < c[6] - 0.2) divisions(t, t - (c[5] - 0.2), true);
  else if (t < c[7] - 0.2) survivors(t, t - (c[6] - 0.2));
  else if (t < c[8] - 0.2) waiting(t, t - (c[7] - 0.2));
  else if (t < c[9] - 0.2) fixIt(t, t - (c[8] - 0.2));
  else twoAM(t, t - (c[9] - 0.2));
  [c[1], c[2], c[2] + 4.6, c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[9] + 3.4].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.55));
  wash('#050405', 1 - span(t, 0, 0.6));
  wash('#050405', span(t, d - 1.2, d));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  grain(t, 0.06);
  void dd; void H; void inkArrow;
}
