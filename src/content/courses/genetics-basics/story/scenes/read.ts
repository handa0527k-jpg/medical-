/**
 * Scene 5「読み飛ばすページ」: the scriptorium. Jin shows the slip; Spra opens the original at the gene →
 * promoter (start mark and direction) → the gene laid out (promoter, 5'UTR, exons/introns, 3'UTR, poly-A
 * signal) → "copy everything?" → the precursor copy, introns cut out, exons joined (mature mRNA) → read three
 * letters at a time, AUG … stop → only ~1.3 % codes for protein → Jin's pen stops at word 487 (→ typo).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { dust, ease, glow, grade, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { JIN, SPRA } from '../cast';
import { HAND, aisle, bust, cues, lampPool, sheet, slip, softBg, tableTop, txt, blinkAt, talk } from '../sets';

const { c, e, d } = cues('read');
const BASE: Record<string, string> = { A: '#e2566f', U: '#8a5cc2', G: '#3a9b69', C: '#e6b23a', T: '#3f86d1' };

/** the gene as coloured segments (kind, relative length) */
const GENE: [string, number][] = [['prom', 1.2], ['utr5', 0.7], ['ex', 1.1], ['in', 1.6], ['ex', 0.9], ['in', 1.9], ['ex', 1.0], ['utr3', 0.8], ['pa', 0.5]];
const COL: Record<string, string> = { prom: '#8a8f9a', utr5: '#d8c9a0', ex: '#3f6aa8', in: '#b9ad98', utr3: '#d8c9a0', pa: '#c25478' };
const NAME: Record<string, string> = { prom: 'プロモーター', utr5: "5'UTR", ex: 'エクソン', in: 'イントロン', utr3: "3'UTR", pa: 'ポリAシグナル' };
function geneBar(x: number, y: number, w: number, h: number, only?: (k: string) => boolean, a = 1) {
  const tot = GENE.reduce((s, [, l]) => s + l, 0); let px = x;
  g.save(); g.globalAlpha *= a;
  GENE.forEach(([k, l]) => { const sw = (l / tot) * w; if (!only || only(k)) { g.fillStyle = COL[k]; rr(px + 1, y - h / 2, sw - 2, h, 4); g.fill(); if (k === 'in') { g.strokeStyle = 'rgba(90,70,50,.35)'; g.lineWidth = 2; for (let q = px + 6; q < px + sw - 4; q += 12) { g.beginPath(); g.moveTo(q, y - h / 2 + 3); g.lineTo(q + 8, y + h / 2 - 3); g.stroke(); } } } px += sw; });
  g.restore();
  return (i: number) => { let s = x; for (let j = 0; j < i; j++) s += (GENE[j][1] / tot) * w; return [s, s + (GENE[i][1] / tot) * w]; };
}
function pen(x: number, y: number, a: number) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = '#2a1e18'; rr(-5, -150, 10, 130, 4); g.fill(); g.fillStyle = '#c9a050'; g.fillRect(-5, -30, 10, 10);
  g.fillStyle = '#3a3a40'; g.beginPath(); g.moveTo(-5, -20); g.lineTo(5, -20); g.lineTo(0, 0); g.fill();
  g.restore();
}
function scissors(x: number, y: number, s: number, open: number, rot: number) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  [-1, 1].forEach((k) => { g.save(); g.rotate(k * open * 0.35); g.fillStyle = '#c9ced6'; g.beginPath(); g.moveTo(0, 0); g.lineTo(90, k * 6); g.lineTo(0, k * 10); g.fill(); g.strokeStyle = '#b8892c'; g.lineWidth = 6; g.beginPath(); g.ellipse(-30, k * 18, 20, 12, 0, 0, 7); g.stroke(); g.restore(); });
  g.fillStyle = '#5a4a3a'; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill();
  g.restore();
}
function letters(s: string, x: number, y: number, size: number, hl = -1, a = 1) {
  [...s].forEach((ch, i) => { const cx = x + i * size * 1.05; g.fillStyle = i === hl ? '#ffe08a' : BASE[ch] || '#888'; g.globalAlpha = a; rr(cx - size * 0.48, y - size * 0.62, size * 0.96, size * 1.1, size * 0.16); g.fill(); g.globalAlpha = 1; txt(ch, cx, y + size * 0.3, size * 0.78, i === hl ? '#3a2a1e' : '#fff', a, 'center', HAND, 600); });
}

/** the scriptorium: lectern with the open original, Spra standing at it */
function scriptorium(t: number) {
  const k = span(t, 0.3, 5, (u) => u * u * (3 - 2 * u)), x = L(60, 440, k), moving = t < 5;
  const open = span(t, 6.2, 8, ease.antic), give = span(t, 5, 6.2, ease.out);
  shot({ x: L(560, 660, k), y: 370, z: L(1, 1.06, span(t, 0, 10)) }, 1, () => {
    g.drawImage(aisle('script', 0.75), -80, 0, W * 1.15, H);
    lampPool(900, 300, 560, 1);
    // tall windows of the scriptorium (cool night)
    g.fillStyle = 'rgba(120,150,200,.12)'; [240, 380].forEach((wx) => { rr(wx, 80, 90, 260, 45); g.fill(); });
    // lectern
    g.fillStyle = '#3a2516'; g.fillRect(890, 470, 26, 220); g.fillStyle = '#5a3a22'; g.beginPath(); g.moveTo(780, 470); g.lineTo(1020, 440); g.lineTo(1030, 470); g.lineTo(790, 500); g.fill();
    // the book: closed cover swinging open
    g.save(); g.translate(905, 450); g.rotate(-0.12);
    g.fillStyle = '#efe3c8'; rr(-110, -24, 220, 26, 3); g.fill();
    g.fillStyle = '#2e4a72'; g.save(); g.scale(L(1, -1, open), 1); rr(0, -30, 112, 30, 3); g.fill(); g.restore();
    g.restore();
    drawFigure(SPRA, { x: 1050, y: 700, s: 470, dir: -1, t, yaw: L(-0.6, -0.3, open), light: -1, blink: blinkAt(t, 3), gazeX: L(-0.8, 0.2, open), gazeY: L(0.1, 0.6, open),
      armN: { at: [L(1000, 900, open), L(470, 430, open)], grip: 0.6 }, armF: { at: [L(1080, 960, give), L(560, 470, give)], grip: 0.8 }, holdF: give > 0.8 && open < 0.4 ? (hx, hy) => slip(hx - 20, hy - 6, 56, 0.2) : undefined });
    drawFigure(JIN, { x, y: 710, s: 450, dir: 1, t, yaw: 0.6, light: 1, blink: blinkAt(t, 1), walk: moving ? { p: (x - 60) / (450 * 0.11), amt: CL(Math.min(t * 2, (5 - t) * 2)) } : undefined,
      gazeX: 0.7, gazeY: 0.2, armN: moving || give > 0.8 ? { hand: [0.5, 1.2], grip: 1 } : { at: [L(560, 760, give), L(540, 470, give)], grip: 1 }, holdN: give < 0.8 ? (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) : undefined });
    dust(t, [700, 160, 500, 400], 40, 71, (px, py) => CL(1 - Math.hypot(px - 900, py - 300) / 380));
  });
}

/** Spra close, his finger on the promoter mark; an arrow shows the direction */
function promoter(t: number, u: number) {
  g.drawImage(softBg('script', 300, 500, 1.5, 'rgba(10,6,10,.45)'), 0, 0); glow(900, 260, 620, 'rgba(255,190,110,.55)', 1);
  const hh = handheld(t, 2, 51);
  bust(SPRA, 300 + hh[0], 330 + hh[1], 310, { yaw: 0.35, gazeX: 0.7, gazeY: 0.5, mouth: talk(t, c[1], e[1]), blink: blinkAt(t, 3), brow: 0.2 }, t, 1);
  sheet(870, 300, 640, 380, 0.03, (w) => {
    const seg = geneBar(-w / 2 + 40, 20, w - 80, 46, undefined, span(u, 0.2, 1));
    const [p0, p1] = seg(0), hl = span(u, 2.5, 3.5, ease.back);
    if (hl > 0) { g.strokeStyle = `rgba(200,50,50,${hl})`; g.lineWidth = 4; g.beginPath(); g.ellipse((p0 + p1) / 2, 20, (p1 - p0) * 0.7 * hl, 44 * hl, 0, 0, 7); g.stroke(); }
    txt('プロモーター', (p0 + p1) / 2, -50, 26, '#2a2320', span(u, 3, 4));
    // start point and direction
    const dir = span(u, 5, 7);
    if (dir > 0) { g.strokeStyle = '#2a2320'; g.lineWidth = 4; g.beginPath(); g.moveTo(p1, -6); g.lineTo(p1, -30); g.lineTo(p1 + 140 * dir, -30); g.stroke(); if (dir > 0.95) { g.fillStyle = '#2a2320'; g.beginPath(); g.moveTo(p1 + 152, -30); g.lineTo(p1 + 136, -38); g.lineTo(p1 + 136, -22); g.fill(); } txt('開始点と向き', p1 + 90, 100, 24, '#5a4a40', dir, 'center', HAND, 600); }
  }, 'gen-prom');
}

/** the gene laid out on a long sheet, the camera travelling along it */
function structure(t: number, u: number) {
  const pan = span(u, 0.5, 10, ease.inOut);
  shot({ x: L(400, 900, pan), y: 330, z: 1.02 }, 1, () => {
    g.drawImage(tableTop('gen-script'), -200, 0, W + 400, H);
    lampPool(L(400, 900, pan), 280, 700, 0.95);
    sheet(650, 300, 1500, 300, 0, (w) => {
      const x0 = -w / 2 + 50, ww = w - 100;
      const seg = geneBar(x0, 10, ww, 60, undefined, 1);
      const times = [0.6, 2.8, 4.6, 5.6, 4.6, 5.6, 4.6, 7.4, 8.8];
      GENE.forEach(([k], i) => {
        const [a, b] = seg(i), m = (a + b) / 2, al = span(u, times[i], times[i] + 0.8);
        const up = i % 2 === 0; txt(NAME[k], m, up ? -46 : 82, k === 'ex' || k === 'in' ? 24 : 22, k === 'pa' ? '#a32a5a' : '#2a2320', al);
      });
    }, 'gen-gene');
  });
  void t;
}

/** splicing: the precursor copy, introns snipped out, exons joined into mature mRNA */
function splice(t: number, u: number) {
  g.drawImage(tableTop('gen-script'), 0, 0); lampPool(640, 300, 760, 0.95);
  const hh = handheld(t, 1.4, 52);
  g.save(); g.translate(hh[0], hh[1]);
  txt('前駆体の写し（全部）', 640, 90, 28, '#ffe8c0', span(u, 0.5, 1.5) * (1 - span(u, 9, 10)));
  txt('成熟mRNA（エクソンだけ）', 640, 90, 30, '#ffd36b', span(u, 10, 11));
  const tot = GENE.reduce((s, [, l]) => s + l, 0), W0 = 1100, x0 = 90, y = 280;
  // positions: exons slide left to close the gaps once the introns are gone
  let gone = 0, px = x0;
  GENE.forEach(([k, l], i) => {
    const w = (l / tot) * W0;
    const cutAt = k === 'in' ? (i === 3 ? 3.5 : 6) : 0;
    const cut = k === 'in' ? span(u, cutAt, cutAt + 1.2, ease.in) : 0;
    const slide = span(u, 8, 10, ease.inOut);
    const x = px - gone * slide;
    if (k === 'in') {
      // the intron lifts away and curls
      g.save(); g.translate(x + w / 2, y - cut * 120); g.rotate(cut * 0.6 * (i === 3 ? -1 : 1)); g.globalAlpha = 1 - span(u, cutAt + 0.8, cutAt + 2.5);
      g.fillStyle = '#f2c6cf'; rr(-w / 2, -26, w, 52, 4); g.fill(); g.fillStyle = 'rgba(120,80,80,.25)'; for (let q = -w / 2 + 6; q < w / 2 - 4; q += 12) g.fillRect(q, -20, 3, 40);
      g.restore();
      // the scissors snapping at both ends
      const sn = span(u, cutAt - 1, cutAt + 0.6);
      if (sn > 0 && sn < 1) scissors(L(x - 20, x + w + 10, sn), y + 6, 0.8, Math.abs(Math.sin(sn * Math.PI * 4)), -0.3);
      gone += w;
    } else {
      g.fillStyle = k === 'ex' ? '#d14d7c' : k === 'pa' ? '#a32a5a' : '#f0b8c8'; rr(x + 1, y - 26, w - 2, 52, 4); g.fill();
      if (k === 'ex') txt('エクソン', x + w / 2, y + 70, 20, '#ffe8c0', span(u, 1, 2), 'center', HAND, 600);
    }
    px += w;
  });
  txt('イントロン（読み飛ばすページ）を切り取る', 640, 470, 28, '#ffe8c0', span(u, 3, 4) * (1 - span(u, 9.5, 10.5)));
  // the joined strip gets a cap and a tail
  const fin = span(u, 10.2, 11.5);
  if (fin > 0) { g.fillStyle = `rgba(255,214,107,${fin})`; g.beginPath(); g.arc(x0 - 14, y, 14, 0, 7); g.fill(); txt('AAAA…', x0 + W0 - gone + 50, y + 8, 26, '#ffd36b', fin, 'left', HAND, 600); }
  g.restore();
}

/** a brass reading window slides along the mRNA three letters at a time */
const MRNA = 'GCCAUGGCUGAAUUCCUGGAGUAA';
function reading(t: number, u: number) {
  g.drawImage(tableTop('gen-script'), 0, 0); lampPool(640, 300, 760, 0.95);
  txt('スプライシング', 640, 90, 34, '#ffd36b', span(u, 0.2, 1) * (1 - span(u, 3, 3.8)));
  const S = 46, x0 = 640 - (MRNA.length * S * 1.05) / 2 + S / 2, y = 270;
  letters(MRNA, x0, y, S);
  // frame steps: start at AUG (index 3), then codon by codon, ending on UAA
  const steps = [3, 6, 9, 12, 15, 18, 21];
  const tStart = 4.5, step = 1.4;
  const f = CL((u - tStart) / step), idx = Math.min(steps.length - 1, Math.floor((u - tStart) / step));
  const pos = u < tStart ? 3 : L(steps[Math.max(0, idx)], steps[Math.min(steps.length - 1, idx + 1)], ease.inOut(CL(((u - tStart) % step) / 0.5)) * (idx < steps.length - 1 ? 1 : 0));
  const fx = x0 + pos * S * 1.05 - S * 0.55, fw = S * 1.05 * 3 + S * 0.1;
  const on = span(u, 3.2, 4.2);
  if (on > 0) { g.strokeStyle = `rgba(201,160,80,${on})`; g.lineWidth = 7; rr(fx, y - S * 0.85, fw, S * 1.55, 8); g.stroke(); glow(fx + fw / 2, y, 120, 'rgba(255,214,120,.5)', on * 0.6); }
  const AA = ['Met', 'Ala', 'Glu', 'Phe', 'Leu', 'Glu', '終止'];
  for (let i = 0; i <= Math.min(idx, 6) && u > tStart; i++) {
    const a = span(u, tStart + i * step + 0.3, tStart + i * step + 0.8);
    const bx = 180 + i * 150;
    g.fillStyle = i === 6 ? `rgba(176,50,50,${a})` : `rgba(58,155,105,${a})`; g.beginPath(); g.arc(bx, 430, 34, 0, 7); g.fill();
    txt(AA[i], bx, 440, i === 6 ? 22 : 24, '#fff', a, 'center', HAND, 600);
    if (i > 0 && i < 6) { g.strokeStyle = `rgba(255,232,192,${a})`; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 116, 430); g.lineTo(bx - 34, 430); g.stroke(); }
  }
  txt('AUG ＝ 開始（メチオニン）', 360, 530, 26, '#ffe8c0', span(u, 5, 6));
  txt('UAA・UAG・UGA ＝ 終止', 920, 530, 26, '#ffb0a0', span(u, 12, 13));
  void f; void t;
}

/** the whole genome as one long shelf: only a thin gold sliver codes for protein */
function sliver(t: number, u: number) {
  const pull = span(u, 0, 6, ease.inOut);
  shot({ x: 640, y: 340, z: L(1.25, 1, pull) }, 1, () => {
    g.drawImage(aisle('script', 0.4), -60, 0, W * 1.1, H);
    g.fillStyle = 'rgba(10,6,10,.45)'; g.fillRect(-100, 0, W + 200, H);
    const x0 = 120, w = 1040, y = 260;
    g.fillStyle = '#4a3a5c'; rr(x0, y - 30, w, 60, 8); g.fill();
    const gold = w * 0.013, gx = x0 + w * 0.42;
    const gl = span(u, 2, 3);
    g.fillStyle = '#ffd36b'; g.fillRect(gx, y - 30, gold, 60); glow(gx, y, 80, 'rgba(255,214,107,.8)', gl);
    inkArrow2(gx + gold / 2, y - 90, gx + gold / 2, y - 40, gl);
    txt('約1.3％ ＝ アミノ酸を指定する配列', gx + 10, y - 110, 30, '#ffd36b', gl);
    txt('ゲノム全体', x0 + w / 2, y + 74, 24, '#e8d0a8', span(u, 0.8, 1.8), 'center', HAND, 600);
    const nc = span(u, 7.5, 8.8);
    if (nc > 0) {
      const gx2 = x0 + w * 0.7; g.fillStyle = `rgba(140,200,255,${nc})`; g.fillRect(gx2, y - 30, gold, 60); glow(gx2, y, 70, 'rgba(140,200,255,.7)', nc);
      txt('ノンコーディングRNAの遺伝子も 同じくらいの数', 640, 420, 28, '#b8dcff', nc);
    }
  });
  void t;
}
function inkArrow2(x1: number, y1: number, x2: number, y2: number, a: number) {
  if (a <= 0) return; g.strokeStyle = `rgba(255,211,107,${a})`; g.fillStyle = `rgba(255,211,107,${a})`; g.lineWidth = 3; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2 - 8); g.stroke(); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 8, y2 - 12); g.lineTo(x2 + 8, y2 - 12); g.fill();
}

/** the pen moves along the copy … and stops; the copy against the reference card */
function stop(u: number) {
  const push = span(u, 0, 7.5, ease.inOut);
  g.drawImage(tableTop('gen-script'), 0, 0); lampPool(640, 280, 760, 0.95);
  shot({ x: L(640, 700, push), y: L(330, 300, push), z: L(1, 1.25, push) }, 1, () => {
    // the reference card (left) and Jin's copy (right)
    sheet(390, 300, 400, 300, -0.04, (w) => {
      txt('見本', 0, -100, 26, '#5a4a40', 1, 'center', HAND, 600);
      txt('… 486  487  488 …', 0, -40, 22, '#8a7a6a', 1, 'center', HAND, 600);
      letters('GAA', -50, 30, 44, -1);
      txt('Glu', 0, 110, 26, '#3a9b69', 1, 'center', HAND, 600);
      void w;
    }, 'gen-ref');
    sheet(860, 310, 460, 330, 0.02, (w) => {
      txt('写し（原本から）', 0, -110, 26, '#5a4a40', 1, 'center', HAND, 600);
      const wr = span(u, 0.3, 2.2);
      txt('… 486  487  488 …', 0, -50, 22, '#8a7a6a', wr, 'center', HAND, 600);
      const diff = span(u, 3.2, 4);
      letters('AAA', -50, 24, 44, diff > 0 ? 0 : -1, span(u, 1.8, 2.6));
      if (diff > 0) { glow(-50, 20, 70, 'rgba(255,214,120,.8)', diff * 0.7); txt('Lys', 0, 110, 26, '#b03232', diff, 'center', HAND, 600); }
      void w;
    }, 'gen-copy');
    // the pen: moving, then a sudden stop with a small recoil
    const mv = span(u, 0.3, 2.6), rec = span(u, 2.6, 3.2, ease.settle);
    pen(L(700, 812, mv) + rec * -6, 330 - rec * 8, 0.5);
  });
  wash('#000', span(u, 8, 10) * 0.2);
}

export function read(t: number, dd: number) {
  if (t < c[1] - 0.2) scriptorium(t);
  else if (t < c[2] - 0.2) promoter(t, t - (c[1] - 0.2));
  else if (t < c[3] - 0.2) structure(t, t - (c[2] - 0.2));
  else if (t < c[4] - 0.2) {
    g.drawImage(softBg('script', 300, 500, 1.5, 'rgba(10,6,10,.45)'), 0, 0); glow(980, 260, 620, 'rgba(255,190,110,.55)', 1);
    const hh = handheld(t, 2, 53);
    bust(JIN, 520 + hh[0], 320 + hh[1], 320, { yaw: 0.45, gazeX: 0.8, gazeY: 0.2, mouth: talk(t, c[3], e[3]), blink: blinkAt(t, 1), smile: 0.35, brow: 0.3 }, t, 1);
    pen(830, 640, 0.3);
  } else if (t < c[5] - 0.2) splice(t, t - (c[4] - 0.2));
  else if (t < c[6] - 0.2) reading(t, t - (c[5] - 0.2));
  else if (t < c[7] - 0.2) sliver(t, t - (c[6] - 0.2));
  else if (t < c[8] - 0.2) {
    g.drawImage(softBg('script', 300, 500, 1.5, 'rgba(10,6,10,.45)'), 0, 0); glow(900, 260, 620, 'rgba(255,190,110,.55)', 1);
    const hh = handheld(t, 2, 54), u = t - (c[7] - 0.2);
    bust(SPRA, 640 + hh[0], 320 + hh[1], 320, { yaw: -0.2, gazeX: -0.3, gazeY: 0.4, mouth: talk(t, c[7], e[7]), blink: blinkAt(t, 3), smile: 0.55 }, t, -1);
    // trimmed intron strips drifting down in the lamp light
    for (let i = 0; i < 6; i++) { const p = (u * 0.18 + i * 0.17) % 1; g.save(); g.translate(180 + i * 190 + Math.sin(u + i) * 30, -40 + p * 700); g.rotate(u * 0.8 + i); g.fillStyle = 'rgba(242,198,207,.75)'; rr(-40, -8, 80, 16, 3); g.fill(); g.restore(); }
  } else stop(t - (c[8] - 0.2));
  [c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8]].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.55));
  wash('#050405', 1 - span(t, 0, 0.6));
  wash('#050405', span(t, d - 1, d));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  grain(t, 0.06);
  void dd; void H;
}
