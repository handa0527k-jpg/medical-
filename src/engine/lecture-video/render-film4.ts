/**
 * Scenes of the 完成版 (第4講まるごと「遺伝子の構造と遺伝情報の発現」).
 *
 * Biology kept exact (and identical in every intensity):
 *  - Gene structure (5'→3'): promoter · 5'UTR · start codon (ATG) · exons / introns · stop codon · 3'UTR · poly(A) signal.
 *  - Transcription copies introns too (precursor RNA); splicing removes introns as lariats and joins exons → mature mRNA.
 *  - Each gene's promoter sets which strand is the template and the direction; genes lie on either strand.
 *  - Translation: from the start codon AUG (Met), 3 bases at a time — GCU Ala, GUU Val — and stops at UAG (no amino acid).
 *  - Enhancers / silencers sit hundreds to thousands of bp away; promoter and proximal elements give basal expression.
 *  - Genome composition (スライド43): gene-related 25.3% (amino-acid-coding 1.3%), non-gene 74.7% (repeats 48%, pseudogenes 0.4%).
 *  - miRNA ≈22 nt binds its target mRNA and represses translation. 15番 snoRNA cluster deletion → Prader-Willi,
 *    13番 miRNA cluster deletion → Feingold. No faces are drawn.
 */
import type { SceneDef } from './types';
import type { Pen } from './pen';
import { CHALK, INK } from './diagrams';
import { ease } from './gekiga';
import { CL, rnd, label, streaks, type RC } from './render-kit';
import { BASE, between, nucleoplasm, term, warmFluid } from './render-film';
import { mchr } from './render-film3';

type P2 = [number, number];
const EXON = '#58c47a', UTR = '#5aa9ff', INTRON = '#9a9a9a', PROMO = '#ffd84a', RNA = '#c38bff';

/* ---------- shared parts ---------- */
function dsDNA(p: Pen, x0: number, x1: number, y: number, a = 1, gap = 14) {
  p.line([[x0, y - gap / 2], [x1, y - gap / 2]], { stroke: '#d9e6f2', width: 5, opacity: a });
  p.line([[x0, y + gap / 2], [x1, y + gap / 2]], { stroke: '#8fa3b5', width: 5, opacity: a });
}
function box(p: Pen, x0: number, x1: number, y: number, h: number, col: string, a = 1) { if (x1 > x0) p.rect(x0, y - h / 2, x1 - x0, h, { fill: col, stroke: INK, width: 3, opacity: a }, 4); }
function promoter(p: Pen, x: number, y: number, dir = 1, a = 1, s = 1) {
  p.save(); p.alpha(a);
  p.rect(x - 30 * s, y - 16 * s, 60 * s, 32 * s, { fill: PROMO, stroke: INK, width: 3 }, 4);
  p.line([[x + 26 * s * dir, y - 16 * s], [x + 26 * s * dir, y - 46 * s], [x + 70 * s * dir, y - 46 * s]], { stroke: '#fff', width: 4 });
  p.line([[x + 58 * s * dir, y - 56 * s], [x + 72 * s * dir, y - 46 * s], [x + 58 * s * dir, y - 36 * s]], { stroke: '#fff', width: 4 });
  p.restore();
}
/** exon / intron layout of the film's gene: [x0, x1, kind] */
const GENE: [number, number, 'e' | 'i'][] = [[260, 400, 'e'], [400, 520, 'i'], [520, 660, 'e'], [660, 780, 'i'], [780, 960, 'e']];
function gene(p: Pen, dx: number, y: number, a = 1, o: { utr?: boolean } = {}) {
  for (const [x0, x1, k] of GENE) {
    if (k === 'i') p.line([[x0 + dx, y], [x1 + dx, y]], { stroke: INTRON, width: 5, opacity: a });
    else box(p, x0 + dx, x1 + dx, y, 40, EXON, a);
  }
  if (o.utr) { box(p, 260 + dx, 300 + dx, y, 40, UTR, a); box(p, 910 + dx, 960 + dx, y, 40, UTR, a); }
}
function ribosome(p: Pen, x: number, y: number, a = 1) {
  p.save(); p.alpha(a);
  p.ellipse(x, y - 48, 78, 50, 0, { fill: 'rgba(110,170,150,0.92)', stroke: INK, width: 5 });
  p.ellipse(x, y + 40, 62, 30, 0, { fill: 'rgba(90,150,130,0.92)', stroke: INK, width: 5 });
  p.restore();
}
function aaBead(p: Pen, x: number, y: number, s: string, k = 1) {
  p.circle(x, y, 28 * (0.6 + 0.4 * k), { fill: '#e2a65a', stroke: INK, width: 4 });
  p.text(s, x, y, { size: 18, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
}
/* ---------- 全体像 ---------- */
function geneFlowFig(rc: RC) {
  const { p } = rc;
  const y1 = 150, y2 = 330, y3 = 490;
  dsDNA(p, 60, 1220, y1, 0.6, 52);
  promoter(p, 180, y1, 1, 0.4 + 0.6 * rc.u('pro', 0.3));
  gene(p, 0, y1, 0.4 + 0.6 * rc.u('ex', 0.3));
  if (rc.u('ex', 0.3) > 0) { label(p, 'エクソン', 330, y1 - 52, 24, { align: 'center', fill: EXON, a: rc.u('ex', 0.3) }); label(p, 'イントロン', 460, y1 + 48, 22, { align: 'center', fill: '#bbb', a: rc.u('ex+0.6', 0.3) }); }
  label(p, 'プロモーター', 180, y1 + 46, 24, { align: 'center', fill: PROMO, a: rc.u('pro', 0.3) });
  // transcription → splicing
  const s = rc.u('spl', 0.4), j = between(rc, 'spl+0.6', 'aa', ease.inOut);
  if (s > 0) {
    p.save(); p.alpha(s);
    p.line([[640, y1 + 70], [640, y2 - 50]], { stroke: '#fff', width: 4 });
    label(p, '転写', 700, (y1 + y2) / 2, 24, { fill: '#fff' });
    // the exons slide together as the introns leave
    const shift = [0, -120 * j, -240 * j];
    let k = 0;
    for (const [x0, x1, kind] of GENE) {
      if (kind === 'i') { if (j < 1) p.line([[x0 + shift[k - 1], y2], [x1 + shift[k], y2]], { stroke: INTRON, width: 6, opacity: 1 - j }); continue; }
      box(p, x0 + shift[k] - (k === 0 ? 0 : 0), x1 + shift[k], y2, 30, EXON, 1); k++;
    }
    label(p, 'スプライシング：イントロンを除く', 1080, y2, 22, { align: 'center', fill: CHALK.y, a: rc.u('spl+0.6', 0.3) });
    p.restore();
  }
  const a = rc.u('aa', 0.5);
  if (a > 0) {
    p.save(); p.alpha(a);
    p.line([[640, y2 + 30], [640, y3 - 60]], { stroke: '#fff', width: 4 });
    p.line([[380, y3], [900, y3]], { stroke: RNA, width: 8 });
    ribosome(p, 560, y3);
    ['Met', 'Ala', 'Val'].forEach((s2, i) => aaBead(p, 470 - i * 60, y3 - 110 - i * 14, s2, CL(a * 3 - i)));
    label(p, 'コドン → アミノ酸', 900, y3 - 60, 26, { align: 'center', fill: '#ffcf8a' });
    p.restore();
  }
  term(p, '翻訳', 1080, y3, rc.u('trl', 0.2), 80);
}

/* ---------- テーマ1：遺伝子の定義 ---------- */
function geneDefFig(rc: RC) {
  const { p, t } = rc;
  const y = 200;
  dsDNA(p, 40, 1240, y, rc.u('start', 0.5), 30);
  label(p, 'DNA ＝ 設計図', 640, 100, 32, { align: 'center', a: rc.u('dna', 0.3) });
  const w = rc.u('what', 0.4);
  if (w > 0 && rc.u('def', 0.3) < 1) ['どんなタンパク質を', 'どの細胞が', 'どんな環境で', 'どれだけ作るか'].forEach((s, i) => label(p, s, 220 + i * 280, 300, 26, { align: 'center', fill: CHALK.y, a: CL(w * 4 - i) * (1 - rc.u('def', 0.3)) }));
  const d = rc.u('def', 0.4);
  if (d > 0) {
    p.rect(470, y - 34, 340, 68, { fill: `rgba(255,216,74,${0.3 * d})`, stroke: CHALK.y, width: 4 }, 10);
    label(p, '遺伝子', 640, y - 60, 32, { align: 'center', fill: CHALK.y, a: d });
  }
  const pr = rc.u('prot', 0.4);
  if (pr > 0) {
    p.line([[560, y + 40], [420, 360]], { stroke: '#fff', width: 5, opacity: pr });
    for (let i = 0; i < 7; i++) aaBead(p, 260 + i * 46, 420 + Math.sin(i + t) * 10, ['M', 'A', 'V', 'G', 'K', 'L', 'S'][i], CL(pr * 7 - i));
    label(p, 'タンパク質のアミノ酸配列', 400, 500, 28, { align: 'center', a: pr });
  }
  const r = rc.u('rna', 0.4);
  if (r > 0) {
    p.line([[720, y + 40], [860, 360]], { stroke: '#fff', width: 5, opacity: r });
    const pts: P2[] = []; for (let x = 720; x <= 1060; x += 8) pts.push([x, 420 + Math.sin((x - 720) / 26 + t) * 16]);
    p.line(pts, { stroke: INK, width: 11, opacity: r }); p.line(pts, { stroke: RNA, width: 7, opacity: r });
    label(p, '翻訳されないRNAの塩基配列', 890, 500, 28, { align: 'center', a: r });
  }
}

/* ---------- テーマ1：ゲノムと転写の向き ---------- */
function genomeDirFig(rc: RC) {
  const { p } = rc;
  const y = 330, top = y - 9, bot = y + 9;
  dsDNA(p, 40, 1240, y, 1, 18);
  label(p, "5'", 30, top - 22, 22, { fill: '#d9e6f2' }); label(p, "3'", 1230, top - 22, 22, { fill: '#d9e6f2' });
  label(p, "3'", 30, bot + 24, 22, { fill: '#8fa3b5' }); label(p, "5'", 1230, bot + 24, 22, { fill: '#8fa3b5' });
  const g = rc.u('genome', 0.4);
  label(p, 'ゲノム', 640, 120, 36, { align: 'center', fill: CHALK.y, a: g });
  const n = rc.u('num', 0.4);
  if (n > 0) { p.line([[40, 520], [1240, 520]], { stroke: '#fff', width: 3, opacity: n }); label(p, '約31億塩基対', 640, 552, 30, { align: 'center', a: n }); label(p, '遺伝子 約2.5万', 640, 175, 30, { align: 'center', a: rc.u('num+0.8', 0.3) }); }
  // genes on either strand: [x0, x1, dir] — dir 1: rightward (template = bottom strand), -1: leftward (template = top strand)
  const genes: [number, number, number][] = [[180, 470, 1], [620, 900, -1], [980, 1180, 1]];
  const st = rc.u('strand', 0.4), pr = rc.u('pro', 0.4);
  genes.forEach(([x0, x1, dir], i) => {
    const ga = CL(g * 3 - i * 0.5);
    if (ga <= 0) return;
    const yy = dir > 0 ? y - 60 : y + 60;
    box(p, x0, x1, yy, 34, EXON, ga);
    promoter(p, dir > 0 ? x0 - 36 : x1 + 36, yy, dir, ga * (0.5 + 0.5 * pr), 0.8);
    if (st > 0) {
      const ty = dir > 0 ? bot : top;
      p.line([[x0, ty], [x1, ty]], { stroke: '#ff8a7a', width: 9, opacity: st });
      const ay = dir > 0 ? y - 110 : y + 110, ax0 = dir > 0 ? x0 : x1, ax1 = dir > 0 ? x1 : x0;
      p.line([[ax0, ay], [ax0 + (ax1 - ax0) * st, ay]], { stroke: '#fff', width: 5 });
      p.line([[ax1 - 18 * dir, ay - 12], [ax1, ay], [ax1 - 18 * dir, ay + 12]], { stroke: '#fff', width: 5, opacity: CL(st * 2 - 1) });
    }
  });
  label(p, '赤＝鋳型になる鎖（遺伝子ごとに違う）', 640, 470, 24, { align: 'center', fill: '#ff8a7a', a: st });
  label(p, '向きを決めるのはプロモーター', 640, 600, 28, { align: 'center', fill: PROMO, a: pr });
}

/* ---------- テーマ2：空欄の遺伝子図 ---------- */
function geneBlankFig(rc: RC) {
  const { p } = rc;
  const y = 300;
  p.line([[60, y], [1220, y]], { stroke: '#cfcfcf', width: 4 });
  box(p, 90, 190, y, 34, PROMO);
  for (const [x0, x1, k] of GENE) { if (k === 'i') p.line([[x0, y], [x1, y]], { stroke: INTRON, width: 6 }); else box(p, x0, x1, y, 46, EXON); }
  box(p, 260, 310, y, 46, UTR); box(p, 900, 960, y, 46, UTR);
  box(p, 1010, 1090, y, 24, '#e2a65a');
  // blanks: [label, x of the element, label box x, y, event]
  const blanks: [string, number, number, number, string][] = [
    ['プロモーター', 140, 220, 440, 'pro'], ["5'UTR", 285, 300, 160, 'utr5'], ['開始コドン', 310, 440, 440, 'start'],
    ['エクソン', 590, 590, 160, 'exon'], ['イントロン', 720, 720, 440, 'intron'], ['終止コドン', 900, 900, 160, 'stop'], ['ポリアデニル化シグナル', 1050, 1060, 440, 'polya'],
  ];
  blanks.forEach(([s, ex, bx, by, ev]) => {
    const k = rc.u(ev, 0.25), base = rc.u('start', 0.4);
    p.line([[ex, y + (by > y ? 26 : -26)], [bx, by + (by > y ? -24 : 24)]], { stroke: '#fff', width: 2, opacity: base });
    const w = Math.max(150, s.length * 26 + 30);
    p.rect(bx - w / 2, by - 24, w, 48, { fill: k > 0 ? 'rgba(250,244,230,0.95)' : 'rgba(8,10,14,0.85)', stroke: k > 0 ? '#b3261e' : '#f4f0e4', width: 3, opacity: base }, 6);
    if (k > 0) { p.save(); p.translate(bx, by); p.scale(1 + 0.4 * (1 - ease.outExpo(k))); p.text(s, 0, 0, { size: s.length > 8 ? 18 : 24, font: 'gothic', weight: 900, fill: '#b3261e', align: 'center' }); p.restore(); }
    else p.text('？', bx, by, { size: 26, font: 'gothic', weight: 900, fill: '#888', align: 'center', opacity: base });
  });
  p.circle(220, 440, 70, { stroke: CHALK.y, width: 4, opacity: rc.u('q', 0.3) * (1 - rc.u('pro', 0.3)) });
}

/* ---------- テーマ3：転写とスプライシング ---------- */
function txSpliceFig(rc: RC) {
  const { p } = rc;
  const y = 180;
  dsDNA(p, 40, 1240, y, 1, 30);
  promoter(p, 200, y - 50, 1, 1, 0.8);
  gene(p, 0, y, 1);
  label(p, 'DNAの上の遺伝子', 640, 80, 28, { align: 'center', a: rc.u('gene', 0.3) * (1 - rc.u('bind', 0.3)) });
  const b = rc.u('bind', 0.4), tx = between(rc, 'tx', 'spl', ease.inOut), spl = rc.u('spl', 0.4);
  const px = 200 + 780 * tx;
  if (b > 0 && spl < 1) {
    p.save(); p.alpha(b * (1 - spl));
    // precursor RNA made so far: exons AND introns copied
    const ry = 310;
    for (const [x0, x1, k] of GENE) { const e = Math.min(x1, px - 30); if (e <= x0) continue; if (k === 'i') p.line([[x0, ry], [e, ry]], { stroke: INTRON, width: 8 }); else box(p, x0, e, ry, 24, EXON); }
    p.ellipse(px, y + 10, 70, 55, -0.1, { fill: 'rgba(222,140,96,0.92)', stroke: INK, width: 5 });
    label(p, 'RNAポリメラーゼ', px, y + 88, 26, { align: 'center', fill: '#ffb88a' });
    label(p, '前駆体RNA（イントロンも写す）', 640, 370, 26, { align: 'center', fill: CHALK.y, a: rc.u('pre', 0.3) });
    p.restore();
  }
  label(p, '読み始め＝プロモーター', 200, 260, 24, { align: 'center', fill: PROMO, a: rc.u('here', 0.3) * (1 - rc.u('tx', 0.3)) });
  if (spl > 0) {
    p.save(); p.alpha(spl);
    const j = between(rc, 'spl+0.4', 'mrna', ease.inOut), ry = 440;
    let k = 0; const shift = [0, -120 * j, -240 * j];
    for (const [x0, x1, kind] of GENE) {
      if (kind === 'i') {
        // the intron loops out as a lariat and leaves
        const a0 = x0 + shift[k - 1], a1 = x1 + shift[k], cx = (a0 + a1) / 2, up = 90 * j;
        p.path(`M ${a0} ${ry} C ${cx - 60} ${ry - up - 40} ${cx + 60} ${ry - up - 40} ${a1} ${ry}`, { stroke: INTRON, width: 7, opacity: 1 - CL(j * 1.5 - 0.5) });
        continue;
      }
      box(p, x0 + shift[k], x1 + shift[k], ry, 28, EXON); k++;
    }
    label(p, 'スプライシング', 640, 330, 32, { align: 'center', fill: CHALK.y });
    p.restore();
  }
  const m = rc.u('mrna', 0.4);
  if (m > 0) label(p, '成熟mRNA（エクソンだけ）', 640, 520, 32, { align: 'center', fill: '#fff', a: m });
}

/* ---------- テーマ3：搬出と翻訳 ---------- */
const SEQ4 = ['GC', 'AUG', 'GCU', 'GUU', 'UAG', 'CA'];
function translate4Fig(rc: RC) {
  const { p } = rc;
  const y = 400, bw = 28;
  const slide = between(rc, 'start', 'trl', ease.outCubic);
  const mx = -260 + 260 * slide;
  p.path('M 180 -60 C 160 120 160 330 178 370 M 178 450 C 160 600 165 720 180 800', { stroke: '#9c86b8', width: 10 });
  p.path('M 202 -60 C 182 120 182 330 200 370 M 200 450 C 182 600 187 720 202 800', { stroke: '#9c86b8', width: 10 });
  label(p, '核', 90, 160, 36, { fill: '#c9b7ea' }); label(p, '細胞質', 300, 160, 32, { fill: '#fff', a: rc.u('out', 0.3) });
  // the mRNA: flanking bases (not translated) + codons
  let x = 300 + mx; const starts: number[] = [];
  const pts: P2[] = [];
  SEQ4.forEach((c) => { starts.push(x); [...c].forEach((b) => { pts.push([x, y]); p.line([[x, y], [x, y + 22]], { stroke: BASE[b], width: 8 }); p.text(b, x, y + 42, { size: 18, font: 'gothic', weight: 900, fill: BASE[b], stroke: INK, strokeW: 4, align: 'center' }); x += bw; }); x += 12; });
  pts.push([x, y]);
  p.line(pts, { stroke: INK, width: 11 }); p.line(pts, { stroke: RNA, width: 6 });
  label(p, "5'", 270 + mx, y - 4, 22, { fill: '#d8b6ff' }); label(p, "3'", x + 12, y - 4, 22, { fill: '#d8b6ff' });
  const evs = ['met', 'ala', 'val', 'uag'];
  let step = -1; evs.forEach((e, i) => { if (rc.u(e, 0.01) > 0) step = i; });
  if (rc.u('aug', 0.3) > 0 && step < 0) step = 0;
  const rx = step >= 0 ? starts[1 + step] + bw : 0;
  if (step >= 0) {
    SEQ4.slice(1, 5).forEach((_, i) => p.rect(starts[1 + i] - bw * 0.45, y - 16, bw * 2.9, 68, { stroke: i === step ? '#ffd84a' : 'rgba(255,255,255,0.35)', width: i === step ? 4 : 2 }, 6));
    ribosome(p, rx, y, rc.u('trl', 0.3));
    const names = ['Met', 'Ala', 'Val'];
    const n = Math.min(3, step + 1);
    for (let i = 0; i < n; i++) aaBead(p, rx - 20 - (n - 1 - i) * 60, y - 150 - (n - 1 - i) * 18, names[i], i === n - 1 && step < 3 ? rc.u(evs[step], 0.25) : 1);
    if (step === 3) { label(p, 'アミノ酸なし → 終止', rx + 40, y - 220, 28, { align: 'center', fill: '#ff8a7a', a: rc.u('none', 0.3) }); }
  }
  label(p, '開始コドン AUG', starts[1] + bw, y + 110, 24, { align: 'center', fill: CHALK.y, a: rc.u('aug', 0.3) });
  label(p, '終止コドン UAG', starts[4] + bw, y + 110, 24, { align: 'center', fill: '#ff8a7a', a: rc.u('uag', 0.3) });
  term(p, '3つのアミノ酸', 900, 120, rc.u('done', 0.2), 52, CHALK.y);
}

/* ---------- テーマ3：エンハンサー／サイレンサー ---------- */
function regulationFig(rc: RC) {
  const { p, t } = rc;
  const y = 300;
  dsDNA(p, 40, 1240, y, 1, 18);
  box(p, 940, 1200, y, 40, EXON); label(p, '遺伝子', 1070, y + 50, 26, { align: 'center' });
  const nr = rc.u('near', 0.4);
  box(p, 860, 920, y, 40, PROMO); box(p, 780, 840, y, 40, '#e2a65a');
  label(p, 'プロモーター', 890, y - 50, 22, { align: 'center', fill: PROMO, a: 0.6 + 0.4 * nr });
  label(p, '近い位置の要素', 810, y + 52, 20, { align: 'center', fill: '#ffcf8a', a: 0.6 + 0.4 * nr });
  const f = rc.u('far', 0.4);
  box(p, 140, 260, y, 40, '#ffd84a', f); box(p, 380, 500, y, 40, '#5aa9ff', f);
  label(p, 'エンハンサー', 200, y - 50, 24, { align: 'center', fill: '#ffd84a', a: rc.u('es', 0.3) });
  label(p, 'サイレンサー', 440, y - 50, 24, { align: 'center', fill: '#9fd0ff', a: rc.u('es', 0.3) });
  if (f > 0) { p.line([[200, y + 80], [880, y + 80]], { stroke: '#fff', width: 3, opacity: f }); for (const x of [200, 880]) p.line([[x, y + 68], [x, y + 92]], { stroke: '#fff', width: 3, opacity: f }); label(p, '数百〜数千塩基対', 540, y + 110, 26, { align: 'center', a: f }); }
  const es = rc.u('es', 0.5);
  if (es > 0) {
    const k = 0.5 + 0.5 * Math.sin(t * 5);
    p.path(`M 200 ${y - 80} C 350 ${y - 230} 750 ${y - 230} 880 ${y - 80}`, { stroke: '#ffd84a', width: 5, dash: [12, 10], opacity: es });
    label(p, '＋ 促進', 540, y - 200, 28, { align: 'center', fill: '#ffd84a', a: es * (0.7 + 0.3 * k) });
    p.path(`M 440 ${y - 60} C 560 ${y - 130} 760 ${y - 130} 860 ${y - 60}`, { stroke: '#9fd0ff', width: 5, dash: [12, 10], opacity: es });
    label(p, '－ 抑制', 640, y - 120, 26, { align: 'center', fill: '#9fd0ff', a: es });
  }
  label(p, '細胞ごとの調節的な発現', 330, 520, 28, { align: 'center', fill: CHALK.y, a: rc.u('cell', 0.3) });
  label(p, '基礎的な発現', 860, 520, 28, { align: 'center', fill: CHALK.y, a: nr });
}

/* ---------- テーマ4：ゲノムの構成 ---------- */
function genomePieFig(rc: RC) {
  const { p } = rc;
  const x0 = 120, W0 = 1040, y = 300, h = 80;
  const at = (pct: number) => x0 + W0 * pct / 100;
  label(p, 'ヒト核ゲノム（約31億塩基対）', 640, 120, 30, { align: 'center', a: rc.u('start', 0.4) });
  const g = rc.u('gene', 0.6), n = rc.u('non', 0.6);
  // gene-related 25.3% (amino-acid-coding 1.3% inside), non-gene 74.7% (repeats 48%, pseudogenes 0.4%, other 26.3%)
  if (g > 0) { p.rect(x0, y - h / 2, (at(25.3) - x0) * g, h, { fill: '#7fbf8a', stroke: INK, width: 3 }); }
  if (n > 0) {
    p.rect(at(25.3), y - h / 2, (at(100) - at(25.3)) * n, h, { fill: '#5b6470', stroke: INK, width: 3 });
    const r = rc.u('rep', 0.6);
    if (r > 0) p.rect(at(25.3 + 26.7), y - h / 2, (at(100) - at(25.3 + 26.7)) * r, h, { fill: '#8a6aa8', stroke: INK, width: 3 });
  }
  const a = rc.u('aa', 0.4);
  if (a > 0) { p.rect(x0, y - h / 2 - 8 * a, at(1.3) - x0, h + 16 * a, { fill: '#ff4a3a', stroke: INK, width: 2 }); }
  label(p, '遺伝子に関わる 25.3%', (x0 + at(25.3)) / 2, y + 74, 24, { align: 'center', fill: '#9fe0a0', a: g });
  label(p, '遺伝子ではない 74.7%', (at(25.3) + at(100)) / 2, y + 74, 24, { align: 'center', fill: '#ccc', a: n });
  const p13 = rc.u('p13', 0.25);
  if (p13 > 0) { p.line([[x0 + 7, y - 52], [x0 + 60, y - 120]], { stroke: '#fff', width: 3 }); term(p, 'アミノ酸を指定 1.3%', 330, y - 140, p13, 34, '#ff6a55'); }
  label(p, '繰り返し配列 48%', (at(52) + at(100)) / 2, y - 64, 26, { align: 'center', fill: '#d8b6ff', a: rc.u('rep', 0.3) });
}

/* ---------- テーマ4：ncRNA ---------- */
function ncrnaFig(rc: RC) {
  const { p, t } = rc;
  const A = 1 - rc.u('mi', 0.5), B = rc.u('mi', 0.5) * (1 - rc.u('pws', 0.5)), C = rc.u('pws', 0.5);
  if (A > 0) {
    p.save(); p.alpha(A);
    dsDNA(p, 120, 520, 200, 1, 18); box(p, 220, 420, 200, 34, RNA);
    label(p, 'ncRNA遺伝子', 320, 140, 28, { align: 'center', fill: '#d8b6ff' });
    p.line([[540, 200], [640, 200]], { stroke: '#fff', width: 5 });
    label(p, '産物はRNAそのもの', 900, 140, 28, { align: 'center', a: rc.u('nc', 0.3) });
    const k = rc.u('kinds', 0.5);
    if (k > 0) {
      // tRNA (cloverleaf), rRNA (in the ribosome), snoRNA (small hairpin)
      p.save(); p.translate(760, 330); p.alpha(k);
      p.path('M 0 60 L 0 10 M 0 10 C -50 -10 -60 30 -30 30 M 0 10 C 50 -10 60 30 30 30 M 0 10 C -20 -50 20 -50 0 -20', { stroke: RNA, width: 6 });
      p.restore(); label(p, 'tRNA', 760, 420, 24, { align: 'center', a: k });
      ribosome(p, 940, 330, k); label(p, 'rRNA', 940, 420, 24, { align: 'center', a: k });
      p.save(); p.translate(1120, 330); p.alpha(k); p.path('M -20 40 L -20 -10 C -20 -40 20 -40 20 -10 L 20 40', { stroke: RNA, width: 6 }); p.restore(); label(p, 'snoRNA', 1120, 420, 24, { align: 'center', a: k });
    }
    label(p, '2万〜2.5万（タンパク質コード遺伝子とほぼ同数）', 640, 520, 26, { align: 'center', fill: CHALK.y, a: rc.u('num', 0.3) });
    p.restore();
  }
  if (B > 0) {
    p.save(); p.alpha(B);
    const y = 360;
    p.line([[160, y], [1120, y]], { stroke: RNA, width: 8 }); label(p, '標的mRNA', 200, y + 40, 24, { fill: '#d8b6ff' });
    const bl = rc.u('block', 0.4);
    ribosome(p, 420 + 160 * (1 - bl) * 0 + Math.min(1, between(rc, 'mi', 'block')) * 160, y, 1);
    const mx = 760 - 200 * (1 - rc.u('short', 0.6));
    p.line([[mx - 50, y - 16], [mx + 50, y - 16]], { stroke: '#ff4a3a', width: 9 });
    label(p, 'miRNA（約22塩基）', mx, y - 50, 26, { align: 'center', fill: '#ff8a7a' });
    if (bl > 0) { p.line([[560, y - 120], [640, y - 40]], { stroke: '#ff4a3a', width: 12, opacity: bl }); p.line([[640, y - 120], [560, y - 40]], { stroke: '#ff4a3a', width: 12, opacity: bl }); label(p, '翻訳を抑える', 640, y + 110, 34, { align: 'center', fill: '#ff6a55', a: bl }); }
    p.restore();
  }
  if (C > 0) {
    p.save(); p.alpha(C);
    const gap = (x: number, y0: number, yy: number) => { p.rect(x - 26, yy, 52, 26, { fill: '#0a0a0c', stroke: '#ff4a3a', width: 3, dash: [6, 5] }); void y0; };
    mchr(p, 320, 160, 230, 0.13, { w: 22, sat: true, seed: 15 }); gap(320, 160, 250);
    label(p, '15番', 320, 420, 28, { align: 'center' });
    label(p, 'snoRNA遺伝子群の欠失', 320, 470, 24, { align: 'center', fill: '#ff8a7a' });
    term(p, 'プラダー・ウィリー', 320, 530, rc.u('pws', 0.25), 38, '#fff');
    mchr(p, 960, 160, 250, 0.13, { w: 22, sat: true, seed: 13 }); gap(960, 160, 330);
    label(p, '13番', 960, 440, 28, { align: 'center', a: rc.u('fgs', 0.3) });
    label(p, 'miRNA遺伝子群の欠失', 960, 480, 24, { align: 'center', fill: '#ff8a7a', a: rc.u('fgs', 0.3) });
    term(p, 'フェインゴールド', 960, 540, rc.u('fgs', 0.25), 38, '#fff');
    p.restore();
  }
  void t;
}

/* ---------- テーマ4：解読の歴史 ---------- */
function historyFig(rc: RC) {
  const { p } = rc;
  const y = 380;
  p.line([[100, y], [1180, y]], { stroke: '#fff', width: 4 });
  const bar = (x: number, w: number, gaps: boolean, a: number) => {
    p.save(); p.alpha(a);
    p.rect(x - w / 2, 180, w, 50, { fill: '#7fbf8a', stroke: INK, width: 3 });
    if (gaps) for (const [g0, g1] of [[0, 0.03], [0.48, 0.52], [0.97, 1]] as const) p.rect(x - w / 2 + w * g0, 180, w * (g1 - g0), 50, { fill: '#111', stroke: '#ff4a3a', width: 2 });
    p.restore();
  };
  const a3 = rc.u('y03', 0.4);
  if (a3 > 0) { p.circle(380, y, 14, { fill: CHALK.y, opacity: a3 }); bar(380, 380, rc.u('gap', 0.3) > 0, a3); label(p, '2003年 完了宣言', 380, y + 50, 32, { align: 'center', fill: CHALK.y, a: a3 }); label(p, '約10年・約4000億円', 380, y + 95, 24, { align: 'center', a: rc.u('y03+1.5', 0.3) }); }
  const g = rc.u('gap', 0.4);
  if (g > 0) label(p, '繰り返しの多い 約8% は読めず', 380, 130, 26, { align: 'center', fill: '#ff8a7a', a: g });
  const a22 = rc.u('y22', 0.4);
  if (a22 > 0) { p.circle(900, y, 14, { fill: '#ff6a55', opacity: a22 }); bar(900, 380, false, a22); label(p, '2022年 完全解読', 900, y + 50, 32, { align: 'center', fill: '#ff6a55', a: a22 }); }
}

export const FILM4_PLATE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'gene-flow': nucleoplasm, 'gene-def': nucleoplasm, 'genome-dir': nucleoplasm, 'gene-blank': streaks, 'tx-splice': nucleoplasm,
  translate4: warmFluid, regulation: nucleoplasm, 'genome-pie': streaks, ncrna: nucleoplasm, 'genome-history': streaks,
};
export const FILM4_FIGURE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'gene-flow': geneFlowFig, 'gene-def': geneDefFig, 'genome-dir': genomeDirFig, 'gene-blank': geneBlankFig, 'tx-splice': txSpliceFig,
  translate4: translate4Fig, regulation: regulationFig, 'genome-pie': genomePieFig, ncrna: ncrnaFig, 'genome-history': historyFig,
};
void rnd;
