/**
 * Scene 6「一文字の誤植」: Jin brings the copy to Taipo, the proofreader → "first, doubt" → silent (CGA→AGA,
 * both Arg) → missense: conservative (GAC→GAA, Asp→Glu) / non-conservative (CGA→GGA, Arg→Gly), nonsense →
 * not every difference is an error: SNPs (~3.47 million in one genome) → ALDH2, Glu487Lys → "should I fix
 * it?" → "copy it as the original says" → Jin writes the letter as it is (→ jump).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, glow, grade, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { JIN, TAIPO } from '../cast';
import { HAND, aisle, bust, cues, lampPool, sheet, slip, softBg, tableTop, txt, blinkAt, talk } from '../sets';

const { c, e, d } = cues('typo');
const BASE: Record<string, string> = { A: '#e2566f', T: '#3f86d1', G: '#3a9b69', C: '#e6b23a' };
const GREEN_LAMP = 'rgba(160,230,180,.5)';

function cards(s: string, x: number, y: number, size: number, hl = -1, a = 1) {
  if (a <= 0) return;
  [...s].forEach((ch, i) => { const cx = x + (i - (s.length - 1) / 2) * size * 1.08; g.globalAlpha = a; g.fillStyle = i === hl ? '#ffe08a' : BASE[ch] || '#888'; rr(cx - size * 0.48, y - size * 0.62, size * 0.96, size * 1.12, size * 0.16); g.fill(); g.globalAlpha = 1; txt(ch, cx, y + size * 0.3, size * 0.78, i === hl ? '#3a2a1e' : '#fff', a, 'center', HAND, 600); });
}
function redPen(x: number, y: number, a: number, s = 1) {
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  g.fillStyle = '#9a2a2a'; rr(-6, -170, 12, 150, 5); g.fill(); g.fillStyle = '#c9a050'; g.fillRect(-6, -34, 12, 10);
  g.fillStyle = '#3a2a2a'; g.beginPath(); g.moveTo(-6, -24); g.lineTo(6, -24); g.lineTo(0, 0); g.fill();
  g.restore();
}
/** a codon change row: before → after, the amino acids under each */
function change(y: number, from: string, to: string, aa1: string, aa2: string, note: string, a: number, hl: number, col = '#ffe8c0') {
  if (a <= 0) return;
  cards(from, 380, y, 44, -1, a); cards(to, 760, y, 44, a > 0.6 ? hl : -1, a);
  g.strokeStyle = `rgba(255,232,192,${a})`; g.lineWidth = 3; g.beginPath(); g.moveTo(490, y - 6); g.lineTo(640, y - 6); g.stroke(); g.fillStyle = `rgba(255,232,192,${a})`; g.beginPath(); g.moveTo(652, y - 6); g.lineTo(636, y - 14); g.lineTo(636, y + 2); g.fill();
  txt(aa1, 380, y + 56, 22, '#cfe8d4', a, 'center', HAND, 600); txt(aa2, 760, y + 56, 22, aa2 === '終止' ? '#ffb0a0' : '#cfe8d4', a, 'center', HAND, 600);
  txt(note, 1040, y + 8, 26, col, a, 'center', '"Zen Old Mincho", serif', 700);
}

/** Jin brings the copy to the proofreader's desk under a green-shaded lamp */
function desk(t: number) {
  const k = span(t, 0.2, 3.5, (u) => u * u * (3 - 2 * u)), x = L(120, 470, k), moving = t < 3.5;
  shot({ x: L(600, 660, k), y: 370, z: L(1, 1.05, span(t, 0, 8)) }, 1, () => {
    g.drawImage(aisle('typo', 0.5), -80, 0, W * 1.15, H);
    glow(940, 360, 520, GREEN_LAMP, 0.8); lampPool(940, 420, 380, 0.8);
    drawFigure(TAIPO, { x: 1000, y: 760, s: 500, dir: -1, t, yaw: -0.4, light: -1, noLegs: true, blink: blinkAt(t, 6), mouth: talk(t, c[0], e[0]), gazeX: L(-0.2, -0.8, span(t, 2.5, 3.5)), gazeY: 0.3,
      armN: { at: [880, 500], grip: 0.9 }, holdN: (hx, hy) => redPen(hx, hy + 6, 0.5, 0.5), armF: { at: [1060, 510], grip: 0.4 } });
    // the desk
    g.fillStyle = '#4a3220'; g.beginPath(); g.moveTo(700, 500); g.lineTo(W + 20, 490); g.lineTo(W + 20, 530); g.lineTo(690, 538); g.fill();
    g.fillStyle = '#24170e'; g.fillRect(690, 536, W - 670, H - 536);
    // green banker's lamp
    g.fillStyle = '#8a6a2c'; g.fillRect(1116, 430, 8, 64); g.fillStyle = '#1f5a3c'; g.beginPath(); g.moveTo(1050, 436); g.quadraticCurveTo(1120, 390, 1190, 436); g.fill();
    glow(1120, 440, 60, 'rgba(255,230,180,.9)', 1);
    drawFigure(JIN, { x, y: 720, s: 460, dir: 1, t, yaw: 0.6, light: 1, blink: blinkAt(t, 1), walk: moving ? { p: (x - 120) / (460 * 0.11), amt: CL(Math.min(t * 2, (3.5 - t) * 2)) } : undefined,
      gazeX: 0.7, gazeY: 0.25, armN: moving ? { hand: [0.5, 1.2], grip: 1 } : { at: [L(560, 720, span(t, 3.5, 4.6, ease.out)), 470], grip: 1 },
      holdN: (hx, hy) => sheetMini(hx + 30, hy - 10), armF: { hand: [0.3, 1.1], grip: 1 }, holdF: (hx, hy) => slip(hx + 10, hy - 10, 50, -0.1) });
  });
}
function sheetMini(x: number, y: number) { g.save(); g.translate(x, y); g.rotate(-0.1); g.fillStyle = '#efe3c8'; rr(-40, -28, 80, 56, 3); g.fill(); g.fillStyle = 'rgba(40,35,30,.5)'; for (let i = 0; i < 4; i++) g.fillRect(-30, -16 + i * 10, 56 - (i % 2) * 14, 2); g.restore(); }

/** the codon cards on the green blotter, the red pen hovering */
function blotter(u: number, fn: () => void, penAt: [number, number] | null) {
  g.drawImage(tableTop('gen-typo'), 0, 0);
  g.fillStyle = 'rgba(30,70,50,.55)'; rr(140, 60, 1000, 500, 12); g.fill();
  glow(640, 260, 700, GREEN_LAMP, 0.35); lampPool(640, 260, 760, 0.7);
  fn();
  if (penAt) redPen(penAt[0], penAt[1], 0.55);
  void u;
}

function silent(t: number, u: number) {
  const hh = handheld(t, 1.2, 61);
  g.save(); g.translate(hh[0], hh[1]);
  const flip = span(u, 2.5, 3.3, ease.inOut);
  blotter(u, () => {
    txt('CGA → AGA', 640, 120, 32, '#ffe8c0', span(u, 0.3, 1.2));
    cards('CGA', 400, 280, 70); txt('アルギニン', 400, 380, 28, '#cfe8d4', span(u, 1, 2), 'center', HAND, 600);
    // the first letter flips C → A
    g.save(); g.translate(880, 280); g.scale(Math.max(0.05, Math.abs(1 - flip * 2)), 1); g.translate(-880, -280);
    cards(flip < 0.5 ? 'CGA' : 'AGA', 880, 280, 70, flip < 0.5 ? -1 : 0); g.restore();
    txt('アルギニン', 880, 380, 28, '#cfe8d4', span(u, 4, 5), 'center', HAND, 600);
    txt('＝', 640, 300, 48, '#ffe8c0', span(u, 4.5, 5.3));
    txt('サイレント変異（アミノ酸は変わらない）', 640, 490, 32, '#ffd36b', span(u, 6.5, 7.5));
  }, [L(980, 820, span(u, 1, 2.5, ease.antic)), L(140, 220, span(u, 1, 2.5, ease.antic))]);
  g.restore();
}

function kinds(t: number, u: number) {
  const hh = handheld(t, 1, 62);
  g.save(); g.translate(hh[0], hh[1]);
  blotter(u, () => {
    txt('ミスセンス変異：別のアミノ酸に替わる', 640, 96, 30, '#ffe8c0', span(u, 0.3, 1.3));
    change(175, 'GAC', 'GAA', 'アスパラギン酸', 'グルタミン酸', '保存的置換', span(u, 3.5, 4.5), 2, '#b8e0c0');
    txt('性質が似ている', 1040, 209, 20, '#b8e0c0', span(u, 8, 9), 'center', HAND, 600);
    change(280, 'CGA', 'GGA', 'アルギニン', 'グリシン', '非保存的置換', span(u, 11, 12), 0, '#ffd0a0');
    txt('性質が違う', 1040, 314, 20, '#ffd0a0', span(u, 16, 17), 'center', HAND, 600);
    change(385, 'CGA', 'TGA', 'アルギニン', '終止', 'ナンセンス変異', span(u, 20, 21), 0, '#ffb0a0');
  }, null);
  g.restore();
}

/** Taipo, then the long strip of one genome studded with small marks (SNPs) and a counter */
function snp(t: number, u: number) {
  if (u < 4.2) {
    g.drawImage(softBg('typo', 600, 520, 1.5, 'rgba(10,6,10,.45)'), 0, 0); glow(900, 280, 600, GREEN_LAMP, 0.5); glow(900, 280, 600, 'rgba(255,190,110,.4)', 1);
    const hh = handheld(t, 2, 63);
    bust(TAIPO, 560 + hh[0], 320 + hh[1], 320, { yaw: 0.25, gazeX: -0.3, gazeY: 0.1, mouth: talk(t, c[3], e[3]), blink: blinkAt(t, 6), smile: 0.3, brow: 0.2 }, t, 1);
    return;
  }
  const v = u - 4.2, pan = span(v, 0, 7, ease.inOut);
  shot({ x: L(500, 780, pan), y: 330, z: 1 }, 1, () => {
    g.drawImage(tableTop('gen-typo'), -200, 0, W + 400, H); lampPool(640, 280, 760, 0.85);
    sheet(640, 300, 1500, 220, 0, (w) => {
      const r = (i: number) => (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const n = Math.floor(span(v, 0.3, 5.5) * 220);
      for (let i = 0; i < n; i++) { const x = -w / 2 + 30 + Math.abs(r(i)) * (w - 60), y = -60 + Math.abs(r(i + 500)) * 120; g.fillStyle = i % 3 ? '#c25478' : '#3f6aa8'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
    }, 'gen-snp');
  });
  const cnt = Math.round(span(v, 0.3, 5.5, ease.out) * 3470000);
  txt('一塩基多型（SNP）＝ 書き方のクセ', 640, 100, 32, '#ffe8c0', span(v, 0, 1));
  txt(`約 ${cnt.toLocaleString('ja-JP')} か所`, 640, 500, 38, '#ffd36b', span(v, 0.3, 1));
}

/** ALDH2: acetaldehyde → acetate; Glu487Lys; two copies → hardly breaks it down */
function aldh2(t: number, u: number) {
  g.drawImage(softBg('typo', 600, 520, 1.5, 'rgba(10,6,10,.62)'), 0, 0);
  const hh = handheld(t, 1, 64);
  shot({ x: 640 + hh[0], y: 340 + hh[1], z: L(1, 1.04, span(u, 0, 18)) }, 1, () => {
    sheet(640, 290, 1100, 420, -0.01, (w, h) => {
      txt('ALDH2　二日酔いの番人', 0, -h / 2 + 52, 34, '#2a2320', span(u, 0.2, 1.2));
      const fl = span(u, 2, 5);
      txt('アセトアルデヒド', -270, -80, 28, '#7a3a2a', span(u, 2, 3));
      if (fl > 0) { g.strokeStyle = '#3a9b69'; g.lineWidth = 5; g.beginPath(); g.moveTo(-90, -90); g.lineTo(L(-90, 110, fl), -90); g.stroke(); if (fl > 0.95) { g.fillStyle = '#3a9b69'; g.beginPath(); g.moveTo(126, -90); g.lineTo(108, -100); g.lineTo(108, -80); g.fill(); } txt('ALDH2', 10, -106, 22, '#3a9b69', fl, 'center', HAND, 600); }
      txt('酢酸', 230, -80, 28, '#2a6a4a', span(u, 4.5, 5.5));
      // the variant
      const vr = span(u, 7.5, 8.5);
      txt('487番目', -300, -10, 26, '#5a4a40', vr, 'center', HAND, 600);
      txt('グルタミン酸（Glu）', -60, -10, 26, '#3a9b69', vr, 'center', HAND, 600);
      txt('→', 120, -10, 28, '#5a4a40', span(u, 9, 9.6));
      txt('リシン（Lys）', 260, -10, 26, '#b03232', span(u, 9.3, 10.2), 'center', HAND, 600);
      // two copies, both Lys
      const two = span(u, 11.5, 12.8);
      if (two > 0) {
        [-1, 1].forEach((s2) => { g.globalAlpha = two; g.fillStyle = s2 < 0 ? '#3f6aa8' : '#c25478'; rr(-330 + s2 * 34, 30, 28, 100, 14); g.fill(); g.fillStyle = '#b03232'; g.beginPath(); g.arc(-330 + s2 * 34, 80, 12, 0, 7); g.fill(); g.globalAlpha = 1; });
        txt('Lys型を2つもつ', -100, 90, 26, '#5a4a40', two, 'center', HAND, 600);
      }
      const res = span(u, 14, 15.2);
      txt('→ ほとんど分解できず、お酒が飲めない', 160, 150, 26, '#b03232', res, 'center', HAND, 600);
      void w;
    }, 'gen-aldh');
  });
}

/** Jin finishes the copy with his own pen: the letter as the original says */
function writeIt(u: number) {
  const pull = span(u, 2.5, 6, ease.inOut);
  g.drawImage(tableTop('gen-typo'), 0, 0); lampPool(640, 280, 760, 0.95);
  shot({ x: L(700, 640, pull), y: L(300, 340, pull), z: L(1.35, 1, pull) }, 1, () => {
    sheet(640, 310, 560, 360, 0.02, () => {
      txt('写し（原本から）', 0, -120, 26, '#5a4a40', 1, 'center', HAND, 600);
      txt('… 486  487  488 …', 0, -60, 22, '#8a7a6a', 1, 'center', HAND, 600);
      cards('AAA', 0, 20, 52, -1);
      const ink = span(u, 0.4, 1.8);
      if (ink > 0) { g.save(); g.beginPath(); g.rect(-120, 70, 240 * ink, 60); g.clip(); txt('原本どおり', 0, 112, 30, '#2a2320', 1, 'center', HAND, 600); g.restore(); }
    }, 'gen-copy');
    // Jin's black pen, writing, then lifting
    const lift = span(u, 2, 2.8, ease.out);
    g.save(); g.translate(L(560, 760, span(u, 0.4, 1.8)), 430 - lift * 40); g.rotate(0.5);
    g.fillStyle = '#2a1e18'; rr(-5, -150, 10, 130, 4); g.fill(); g.fillStyle = '#c9a050'; g.fillRect(-5, -30, 10, 10); g.fillStyle = '#3a3a40'; g.beginPath(); g.moveTo(-5, -20); g.lineTo(5, -20); g.lineTo(0, 0); g.fill();
    g.restore();
    // the red pen lies unused, to the side
    redPen(1080, 520, 1.3, 0.9);
    slip(260, 470, 150, -0.2);
  });
}

export function typo(t: number, dd: number) {
  if (t < c[1] - 0.2) desk(t);
  else if (t < c[2] - 0.2) silent(t, t - (c[1] - 0.2));
  else if (t < c[3] - 0.2) kinds(t, t - (c[2] - 0.2));
  else if (t < c[4] - 0.2) snp(t, t - (c[3] - 0.2));
  else if (t < c[5] - 0.2) aldh2(t, t - (c[4] - 0.2));
  else if (t < c[6] - 0.2) {
    g.drawImage(softBg('typo', 600, 520, 1.5, 'rgba(10,6,10,.45)'), 0, 0); glow(980, 280, 600, 'rgba(255,190,110,.45)', 1);
    const hh = handheld(t, 2, 65);
    bust(JIN, 560 + hh[0], 320 + hh[1], 320, { yaw: 0.45, gazeX: 0.8, gazeY: 0.2, mouth: talk(t, c[5], e[5]), blink: blinkAt(t, 1), brow: 0.7 }, t, 1);
    redPen(940, 640, 0.4, 1.2);
  } else if (t < c[7] - 0.2) {
    g.drawImage(softBg('typo', 600, 520, 1.5, 'rgba(10,6,10,.45)'), 0, 0); glow(900, 280, 600, GREEN_LAMP, 0.5);
    const hh = handheld(t, 2, 66), u = t - (c[6] - 0.2);
    bust(TAIPO, 680 + hh[0], 320 + hh[1], 320, { yaw: -0.25, gazeX: -0.5, gazeY: 0.15, mouth: talk(t, c[6], e[6]), blink: blinkAt(t, 6), smile: L(0.2, 0.6, span(u, 3, 5)), tilt: -0.05 }, t, -1);
  } else writeIt(t - (c[7] - 0.2));
  [c[1], c[2], c[3], c[3] + 4.2, c[4], c[5], c[6], c[7]].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.55));
  wash('#050405', 1 - span(t, 0, 0.6));
  wash('#050405', span(t, d - 1, d));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  grain(t, 0.06);
  void dd; void H;
}
