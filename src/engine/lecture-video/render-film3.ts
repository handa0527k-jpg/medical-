/**
 * Scenes of the 完成版 (第3講まるごと「染色体 ― DNAの収納と数の異常」).
 *
 * Biology kept exact (and identical in every intensity):
 *  - Packing: naked DNA 2 nm → nucleosome (≈1.7 turns, ≈140 bp around a core) 11 nm → chromatin → mitotic chromosome ≈1400 nm.
 *  - The core is an octamer of H2A, H2B, H3, H4 (two of each); H1 sits on the linker (spacer) DNA, outside the core.
 *  - A mitotic chromosome = two sister chromatids joined at the centromere; p = short arm, q = long arm, telomeres at the ends.
 *  - Metacentric 1, 3, 16, 19, 20; acrocentric 13, 14, 15, 21, 22, Y (13–15, 21, 22 with stalks/satellites); no telocentric in humans.
 *  - Karyotype drawn as a schematic: relative lengths ≈ chromosome size, G-band stripes are illustrative.
 *  - Meiosis: DNA replication → homologues pair → meiosis I separates homologues → meiosis II separates sister chromatids
 *    → four haploid gametes (crossing-over left out, as in the lecture). Nondisjunction in meiosis I → gametes with 2, 2, 0, 0.
 *  - Gene counts per autosome are approximate (protein-coding genes); 13, 18, 21 are the lowest.
 */
import type { SceneDef } from './types';
import type { Pen } from './pen';
import { CHALK, INK } from './diagrams';
import { W, H, ease } from './gekiga';
import { CL, rnd, label, streaks, hall, type RC } from './render-kit';
import { between, helix, nucleoplasm, term, warmFluid } from './render-film';

type P2 = [number, number];
const FATHER = '#5aa9ff', MOTHER = '#ff6b5b', CHR = '#e7dccb', CORE = '#c9a0dc', DNA = '#f3e2a8';
const HIST: Record<string, string> = { H2A: '#ff9f80', H2B: '#ffd27f', H3: '#7fc8ff', H4: '#9fe0a0' };

/* ---------- shared parts ---------- */
/** a mitotic chromosome standing upright: two sister chromatids (or one) joined at the centromere */
export function mchr(p: Pen, x: number, yTop: number, len: number, cen: number, o: { w?: number; col?: string; sister?: number; seed?: number; sat?: boolean; a?: number } = {}) {
  const w = o.w ?? 14, col = o.col ?? CHR, a = o.a ?? 1, sis = o.sister ?? 1, yc = yTop + cen * len;
  if (a <= 0) return;
  p.save(); p.alpha(a);
  const cols = sis > 0 ? [x - (w / 2 + 1) * sis, x + (w / 2 + 1) * sis] : [x];
  if (o.sat && cen > 0) for (const cx of cols) { p.line([[cx, yTop - 4], [cx, yTop - 12]], { stroke: col, width: 2 }); p.circle(cx, yTop - 16, w * 0.32, { fill: col, stroke: INK, width: 1.5 }); }
  for (const cx of cols) {
    if (cen > 0.02) p.rect(cx - w / 2, yTop, w, Math.max(2, cen * len - 3), { fill: col, stroke: INK, width: Math.max(1.5, w * 0.12) }, w / 2);
    p.rect(cx - w / 2, yc + (cen > 0.02 ? 3 : 0), w, len * (1 - cen) - (cen > 0.02 ? 3 : 0), { fill: col, stroke: INK, width: Math.max(1.5, w * 0.12) }, w / 2);
    if (o.seed != null) for (let i = 0; i < 9; i++) {
      const by = yTop + len * (0.06 + 0.9 * rnd(o.seed * 17 + i * 3)), bh = len * (0.02 + 0.03 * rnd(o.seed * 5 + i));
      if (Math.abs(by - yc) < 5) continue;
      p.rect(cx - w / 2 + 1.5, by, w - 3, bh, { fill: 'rgba(30,24,18,0.55)' });
    }
  }
  p.ellipse(x, yc, (w + 2) * Math.max(1, sis) * 0.9, w * 0.32, 0, { fill: INK });
  p.restore();
}
function cell(p: Pen, x: number, y: number, r: number, a = 1, ry = r) {
  p.ellipse(x, y, r, ry, 0, { fill: 'rgba(232,217,194,0.10)', stroke: '#e8d9c2', width: 4, opacity: a });
}
/** a nucleosome seen face-on: core disk + DNA wrapping ≈1.7 turns (wrap 0..1) */
export function nucleosome(p: Pen, x: number, y: number, r: number, wrap = 1, o: { lw?: number; tails?: number; t?: number } = {}) {
  p.circle(x, y, r, { fill: CORE, stroke: INK, width: Math.max(1.5, r * 0.06) });
  p.circle(x - r * 0.25, y - r * 0.3, r * 0.35, { fill: 'rgba(255,255,255,0.18)' });
  const turns = 1.7 * wrap, pts: P2[] = [];
  for (let th = 0; th <= turns * Math.PI * 2; th += 0.12) { const R = r * (1.12 + 0.1 * th / (Math.PI * 2)); pts.push([x + R * Math.cos(th - Math.PI / 2), y + R * Math.sin(th - Math.PI / 2)]); }
  if (pts.length > 1) { p.line(pts, { stroke: INK, width: (o.lw ?? r * 0.22) + 4 }); p.line(pts, { stroke: DNA, width: o.lw ?? r * 0.22 }); }
}

/* ---------- 導入：DNA → ヌクレオソーム → クロマチン → 染色体 ---------- */
function packStripFig(rc: RC) {
  const { p, t } = rc;
  const xs = [170, 480, 800, 1110], y = 330, evs = ['dna', 'nuc', 'chrom', 'chr'];
  const names = ['DNA', 'ヌクレオソーム', 'クロマチン', '染色体'], sizes = ['2 nm', '11 nm', '', '1400 nm（分裂期）'];
  xs.forEach((x, i) => {
    const k = rc.u(evs[i], 0.4) || (i === 0 ? rc.u('start', 0.4) : 0);
    if (k <= 0) return;
    p.save(); p.alpha(k);
    p.rect(x - 140, 120, 280, 400, { fill: 'rgba(8,10,14,0.5)', stroke: '#f4f0e4', width: 3 }, 10);
    if (i === 0) helix(p, x - 110, x + 110, y, 16, 80, t * 2, { lw: 3, bpt: 10 });
    if (i === 1) { p.path(`M ${x - 130} ${y} L ${x + 130} ${y}`, { stroke: DNA, width: 3 }); for (let j = 0; j < 4; j++) nucleosome(p, x - 90 + j * 60, y, 18, 1, { lw: 4 }); }
    if (i === 2) for (let j = 0; j < 26; j++) { const a = j * 0.75; p.circle(x - 110 + j * 8.8, y + Math.sin(a) * 30, 10, { fill: CORE, stroke: INK, width: 1.5 }); }
    if (i === 3) mchr(p, x, y - 120, 220, 0.38, { w: 26, seed: 3 });
    label(p, names[i], x, 160, 30, { align: 'center', fill: CHALK.y });
    if (sizes[i]) label(p, sizes[i], x, 470, i === 3 ? 22 : 30, { align: 'center' });
    p.restore();
    if (i > 0) { const a = rc.u(evs[i], 0.3); p.line([[x - 168, y], [x - 146, y]], { stroke: '#fff', width: 5, opacity: a }); p.line([[x - 156, y - 9], [x - 145, y], [x - 156, y + 9]], { stroke: '#fff', width: 5, opacity: a }); }
  });
}

/* ---------- テーマ1：収納の実際 ---------- */
function packingFig(rc: RC) {
  const { p, t } = rc;
  const fade = (a: string, b: string | null) => CL(rc.u(a, 0.5)) * (b ? 1 - rc.u(b, 0.5) : 1);
  // A: naked DNA, 2 nm
  const A = (1 - rc.u('wrap', 0.5));
  if (A > 0) {
    p.save(); p.alpha(A);
    helix(p, 100, 1180, 360, 30, 190, t * 2, { lw: 7, bpt: 10 });
    const k = rc.u('d2', 0.4);
    if (k > 0) { p.line([[640, 316], [640, 404]], { stroke: '#fff', width: 4, opacity: k }); for (const yy of [316, 404]) p.line([[628, yy], [652, yy]], { stroke: '#fff', width: 4, opacity: k }); label(p, '直径 2 nm', 680, 300, 34, { fill: CHALK.y, a: k }); }
    label(p, '裸のDNA', 640, 170, 40, { align: 'center', a: rc.u('naked', 0.3) });
    p.restore();
  }
  // B: one nucleosome forms
  const B = fade('wrap', 'nuc+1.2');
  if (B > 0) {
    p.save(); p.alpha(B);
    const w = between(rc, 'wrap', 'nuc', ease.inOut);
    p.line([[100, 360 - 150], [640 - 3, 360 - 150]], { stroke: INK, width: 26 }); p.line([[100, 360 - 150], [640, 360 - 150]], { stroke: DNA, width: 22 });
    nucleosome(p, 640, 360, 130, w, { lw: 22 });
    label(p, 'ヒストンの塊', 640, 345, 26, { align: 'center' }); label(p, '（コア）', 640, 380, 22, { align: 'center' });
    label(p, '約140塩基対が巻き付く', 640, 560, 32, { align: 'center', fill: CHALK.y, a: rc.u('nuc', 0.3) });
    p.restore();
  }
  // C: beads on a string, spacer, H1
  const C = fade('nuc+1.2', 'fold');
  if (C > 0) {
    p.save(); p.alpha(C);
    const xs = [170, 400, 630, 860, 1090], y = 350;
    p.line([[60, y], [1220, y]], { stroke: INK, width: 12 }); p.line([[60, y], [1220, y]], { stroke: DNA, width: 8 });
    const sp = rc.u('spacer', 0.4);
    if (sp > 0) { p.rect(xs[1] + 50, y - 22, xs[2] - xs[1] - 100, 44, { fill: `rgba(255,216,74,${0.35 * sp})`, stroke: CHALK.y, width: 3 }, 10); label(p, 'スペーサー', (xs[1] + xs[2]) / 2, y - 110, 30, { align: 'center', fill: CHALK.y, a: sp }); }
    xs.forEach((x) => nucleosome(p, x, y, 46, 1, { lw: 9 }));
    label(p, 'ヌクレオソーム', xs[0], y + 100, 28, { align: 'center' });
    const h1 = rc.u('h1', 0.3);
    if (h1 > 0) { const hx = xs[1] + 75; p.circle(hx, y, 20 * (0.6 + 0.4 * ease.back(h1)), { fill: '#ffd84a', stroke: INK, width: 4 }); p.text('H1', hx, y, { size: 18, font: 'gothic', weight: 900, fill: '#111', align: 'center' }); label(p, 'H1', hx + 10, y + 60, 30, { fill: '#ffd84a', a: h1 }); }
    label(p, 'ヌクレオソーム 11 nm', 640, 560, 30, { align: 'center', a: 0.9 });
    p.restore();
  }
  // D: chromatin fibre
  const D = fade('fold', 'chr');
  if (D > 0) {
    p.save(); p.alpha(D);
    const f = between(rc, 'fold', 'chr', ease.inOut);
    for (let j = 0; j < 60; j++) { const a = j * 0.62, x = 120 + j * 17.5, yy = 350 + Math.sin(a) * (40 + 30 * f) * (0.6 + 0.4 * Math.cos(a * 0.5)); p.circle(x, yy, 16, { fill: CORE, stroke: INK, width: 2 }); }
    label(p, 'クロマチン', 640, 520, 40, { align: 'center', fill: CHALK.y });
    p.restore();
  }
  // E: mitotic chromosome, ~1400 nm
  const E = rc.u('chr', 0.5);
  if (E > 0) {
    p.save(); p.alpha(E);
    mchr(p, 640, 110, 420, 0.38, { w: 70, seed: 7 });
    p.line([[560, 600], [720, 600]], { stroke: '#fff', width: 4 }); for (const x of [560, 720]) p.line([[x, 588], [x, 612]], { stroke: '#fff', width: 4 });
    label(p, '幅 約1400 nm', 760, 600, 32, { fill: CHALK.y });
    label(p, '分裂期の染色体', 300, 300, 36, { align: 'center', a: rc.u('chr+0.4', 0.3) });
    p.restore();
  }
}

/* ---------- テーマ1：八量体とH1 ---------- */
function octamerFig(rc: RC) {
  const { p } = rc;
  const cx = 480, cy = 380, h1k = rc.u('h1', 0.5);
  // linker DNA in and out (where H1 sits), shown with H1
  if (h1k > 0) { p.line([[cx - 20, cy - 175], [cx - 520, cy - 230]], { stroke: INK, width: 24, opacity: h1k }); p.line([[cx - 20, cy - 175], [cx - 520, cy - 230]], { stroke: DNA, width: 20, opacity: h1k }); p.line([[cx + 20, cy - 175], [cx + 600, cy - 220]], { stroke: INK, width: 24, opacity: h1k }); p.line([[cx + 20, cy - 175], [cx + 600, cy - 220]], { stroke: DNA, width: 20, opacity: h1k }); }
  nucleosome(p, cx, cy, 150, 1, { lw: 24 });
  const types = ['H3', 'H4', 'H2A', 'H2B'];
  const ks = types.map((_, i) => rc.u(`core+${(i * 0.5).toFixed(1)}`, 0.3));
  for (const [row, dy, shade] of [[0, -26, 0.65], [1, 26, 1]] as const) types.forEach((ty, i) => {
    const x = cx - 90 + i * 60, y = cy + dy + (i % 2 ? 6 : -6);
    p.circle(x, y, 38, { fill: HIST[ty], stroke: INK, width: 3, opacity: (0.35 + 0.65 * ks[i]) * shade });
    if (row === 1) p.text(ty, x, y, { size: 20, font: 'gothic', weight: 900, fill: '#111', align: 'center', opacity: 0.4 + 0.6 * ks[i] });
  });
  types.forEach((ty, i) => { const k = ks[i]; if (k <= 0) return; p.circle(800, 200 + i * 66, 18, { fill: HIST[ty], stroke: INK, width: 3, opacity: k }); label(p, `${ty} ×2`, 830, 200 + i * 66, 32, { a: k }); });
  term(p, '八量体', cx, 150, rc.u('oct', 0.2) * (1 - h1k), 80, CHALK.y);
  label(p, '＝コアヒストン', 880, 480, 30, { align: 'center', fill: CHALK.y, a: rc.u('oct', 0.3) });
  if (h1k > 0) {
    const hx = cx + 150, hy = cy - 185;
    p.circle(hx, hy, 30 * (0.6 + 0.4 * ease.back(h1k)), { fill: '#ffd84a', stroke: INK, width: 4 });
    p.text('H1', hx, hy, { size: 24, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
    label(p, 'H1：スペーサーでDNAと結合', 900, 540, 26, { align: 'center', fill: '#ffd84a', a: h1k });
    label(p, 'コアではない', 900, 585, 30, { align: 'center', fill: '#ff6a55', a: rc.u('h1+1.5', 0.3) });
  }
}

/* ---------- テーマ1：ヒストンの化学修飾 ---------- */
function tails(p: Pen, x: number, y: number, r: number, t: number, tags: number[], tk: number) {
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + 0.3, pts: P2[] = [];
    for (let s = 0; s <= 1; s += 0.1) { const R = r * (1 + 0.9 * s); pts.push([x + Math.cos(a + 0.25 * Math.sin(s * 6 + t * 2 + i)) * R, y + Math.sin(a + 0.25 * Math.sin(s * 6 + t * 2 + i)) * R]); }
    p.line(pts, { stroke: '#d8b6ff', width: 4 });
    if (tags.includes(i) && tk > 0) { const [ex, ey] = pts[pts.length - 1]; p.circle(ex, ey, 11 * tk, { fill: i % 3 ? '#ffd84a' : '#ff8a7a', stroke: INK, width: 2 }); }
  }
  nucleosome(p, x, y, r, 1, { lw: r * 0.2 });
}
function histmodFig(rc: RC) {
  const { p, t } = rc;
  const two = rc.u('cell', 0.5);
  if (two < 1) {
    p.save(); p.alpha(1 - two);
    const tk = rc.u('mod', 1.5);
    tails(p, 640, 320, 100, t, [0, 2, 3, 5, 7], tk);
    label(p, 'ヒストンの化学修飾', 640, 560, 36, { align: 'center', fill: CHALK.y, a: rc.u('mod', 0.3) });
    p.restore();
  }
  if (two > 0) {
    p.save(); p.alpha(two);
    [[360, [0, 3, 5], true], [920, [1, 2, 6, 7], false]].forEach(([x, tags, on]) => {
      p.rect((x as number) - 230, 90, 460, 420, { fill: 'rgba(232,217,194,0.06)', stroke: '#e8d9c2', width: 3 }, 30);
      tails(p, x as number, 250, 70, t, tags as number[], 1);
      p.rect((x as number) - 90, 400, 180, 36, { fill: '#5aa9ff', stroke: INK, width: 3 }, 6);
      p.text('遺伝子', x as number, 418, { size: 20, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
      p.circle((x as number) + 130, 418, 20, { fill: on ? '#ffd84a' : '#555', stroke: INK, width: 3 });
      label(p, on ? 'ON' : 'OFF', (x as number) + 130, 466, 24, { align: 'center', fill: on ? '#ffd84a' : '#aaa' });
    });
    label(p, '細胞ごとに違う修飾 → 遺伝子発現の制御', 640, 560, 30, { align: 'center' });
    p.restore();
  }
  const e = rc.u('epi', 0.25);
  if (e > 0) { p.save(); p.translate(640, 300); p.rotate(-0.05); p.scale(1 + 0.5 * (1 - ease.outExpo(e))); p.rect(-260, -54, 520, 108, { fill: 'rgba(250,244,230,0.95)', stroke: '#b3261e', width: 8 }, 12); p.text('第6講 エピゲノムへ', 0, 0, { size: 46, font: 'gothic', weight: 900, fill: '#b3261e', align: 'center' }); p.restore(); }
}

/* ---------- テーマ2：核型 ---------- */
const MB = [248, 242, 198, 190, 181, 171, 159, 145, 138, 134, 135, 133, 114, 107, 102, 90, 83, 80, 59, 64, 47, 51];
const META = new Set([1, 3, 16, 19, 20]), ACRO = new Set([13, 14, 15, 21, 22]);
const CEN = (n: number) => (META.has(n) ? 0.48 : ACRO.has(n) ? 0.12 : 0.3 + 0.08 * rnd(n));
function karyotypeFig(rc: RC) {
  const { p } = rc;
  const rows: [number[], number][] = [[[1, 2, 3, 4, 5], 165], [[6, 7, 8, 9, 10, 11, 12], 310], [[13, 14, 15, 16, 17, 18], 425], [[19, 20, 21, 22, 23, 24], 525]];
  const s = 0.5, ord = rc.u('order', 2.4);
  rows.forEach(([nums, cy], ri) => {
    const gap = 1180 / nums.length;
    nums.forEach((n, i) => {
      const x = 50 + gap * (i + 0.5), k = rc.u(`start+${(0.15 * (ri * 6 + i)).toFixed(2)}`, 0.3);
      if (k <= 0) return;
      const sex = n > 22, len = sex ? (n === 23 ? 156 : 57) * s : MB[n - 1] * s, cen = sex ? (n === 23 ? 0.39 : 0.15) : CEN(n);
      const pair = ['a', 'b'];
      const hi = sex && rc.u('order+1.2', 0.4) > 0;
      if (hi) p.rect(x - 34, cy - len * cen - 14, 68, len + 40, { stroke: CHALK.y, width: 3, opacity: rc.u('order+1.2', 0.4) }, 8);
      if (sex) mchr(p, x, cy - len * cen, len, cen, { w: 10, seed: n, a: k });
      else pair.forEach((_, j) => mchr(p, x - 15 + j * 30, cy - len * cen, len, cen, { w: 10, seed: n, sat: ACRO.has(n), a: k }));
      const lab = sex ? (n === 23 ? 'X' : 'Y') : String(n);
      const lit = !sex && ord > 0 && ord * 22 >= n;
      label(p, lab, x, cy + len * (1 - cen) + 18, 20, { align: 'center', fill: lit ? CHALK.y : '#ddd', a: k });
    });
  });
  const xy = rc.u('xy', 0.25);
  if (xy > 0) { p.save(); p.translate(640, 38); p.rotate(-0.05); p.scale(1 + 0.5 * (1 - ease.outExpo(xy))); p.rect(-100, -30, 200, 60, { fill: 'rgba(250,244,230,0.95)', stroke: '#b3261e', width: 5 }, 10); p.text('46,XY', 0, 0, { size: 36, font: 'gothic', weight: 900, fill: '#b3261e', align: 'center' }); p.restore(); }
  label(p, 'G分染法（模式図）', 120, 40, 24, { fill: '#ccc', a: rc.u('band', 0.3) });
  label(p, '46本', 1120, 38, 34, { align: 'center', fill: CHALK.y, a: rc.u('n46', 0.3) });
  label(p, '性染色体', 1050, 590, 26, { align: 'center', fill: CHALK.y, a: rc.u('order+1.2', 0.4) });
}

/* ---------- テーマ2：メタ／アクロ／テロセントリック ---------- */
function centromereFig(rc: RC) {
  const { p } = rc;
  const kinds: [number, number, boolean, string, string, string][] = [
    [260, 0.5, false, 'メタセントリック', '1・3・16・19・20番', 'meta'],
    [640, 0.13, true, 'アクロセントリック', '13・14・15・21・22番・Y', 'acro'],
    [1020, 0, false, 'テロセントリック', '', 'telo'],
  ];
  kinds.forEach(([x, cen, sat, name, ex, ev]) => {
    const k = 0.3 + 0.7 * rc.u(ev, 0.3), base = rc.u('start', 0.5);
    mchr(p, x, 150, 300, cen, { w: 34, sat, seed: Math.round(x), a: base * k });
    label(p, name, x, 510, 32, { align: 'center', fill: CHALK.y, a: rc.u(ev, 0.3) });
    if (ex) label(p, ex, x, 555, 24, { align: 'center', a: rc.u(`${ev}N`, 0.3) });
  });
  label(p, 'セントロメアの位置で分類', 640, 70, 30, { align: 'center', a: rc.u('class', 0.3) });
  const n = rc.u('none', 0.3);
  if (n > 0) { p.line([[900, 160], [1140, 450]], { stroke: '#ff4a3a', width: 16, opacity: n }); p.line([[1140, 160], [900, 450]], { stroke: '#ff4a3a', width: 16, opacity: n }); term(p, 'ヒトにない', 1020, 560, n, 46, '#ff6a55'); }
}

/* ---------- テーマ3：二倍体と一倍体 ---------- */
function rods(p: Pen, cx: number, cy: number, n: number, cols: number, sx: number, sy: number, colorOf: (i: number) => string, len: (i: number) => number, a = 1) {
  for (let i = 0; i < n; i++) { const x = cx + ((i % cols) - (cols - 1) / 2) * sx, y = cy + (Math.floor(i / cols) - (Math.ceil(n / cols) - 1) / 2) * sy, l = len(i); p.rect(x - 3, y - l / 2, 6, l, { fill: colorOf(i), stroke: INK, width: 1.2, opacity: a }, 3); }
}
function ploidyFig(rc: RC) {
  const { p } = rc;
  const soma = rc.u('soma', 0.4) || rc.u('start', 0.4) * 0.4;
  cell(p, 330, 310, 175, soma);
  if (soma > 0) {
    p.save(); p.alpha(soma);
    for (let i = 0; i < 23; i++) { const x = 330 + ((i % 6) - 2.5) * 48, y = 310 + (Math.floor(i / 6) - 1.5) * 68, l = 48 - i * 1.3; p.rect(x - 9, y - l / 2, 7, l, { fill: FATHER, stroke: INK, width: 1.2 }, 3); p.rect(x + 2, y - l / 2, 7, l, { fill: MOTHER, stroke: INK, width: 1.2 }, 3); }
    p.restore();
  }
  label(p, '体細胞 46本', 330, 100, 32, { align: 'center', a: soma });
  label(p, '父由来 23（青）＋ 母由来 23（赤）', 330, 508, 22, { align: 'center', a: rc.u('parents', 0.3) });
  term(p, '二倍体（2n）', 330, 556, rc.u('dip', 0.2), 42, CHALK.y);
  const g = rc.u('gam', 0.4);
  if (g > 0) {
    p.save(); p.alpha(g);
    cell(p, 930, 250, 120);
    rods(p, 930, 250, 23, 6, 34, 46, (i) => (rnd(i * 7 + 3) > 0.5 ? FATHER : MOTHER), (i) => 34 - i * 0.8);
    label(p, '卵子 23本', 930, 105, 30, { align: 'center' });
    p.ellipse(930, 470, 70, 46, 0, { fill: 'rgba(232,217,194,0.12)', stroke: '#e8d9c2', width: 4 });
    p.path('M 1000 470 C 1050 450 1080 500 1130 470 S 1190 450 1220 480', { stroke: '#e8d9c2', width: 4 });
    rods(p, 930, 470, 23, 8, 14, 22, (i) => (rnd(i * 11 + 5) > 0.5 ? FATHER : MOTHER), () => 16);
    label(p, '精子 23本', 930, 520, 24, { align: 'center' });
    p.restore();
  }
  term(p, '一倍体（n）', 930, 566, rc.u('hap', 0.2), 42, CHALK.y);
  const m = rc.u('mei', 0.6);
  if (m > 0) { p.line([[550, 330], [550 + 220 * m, 330]], { stroke: '#fff', width: 6 }); p.line([[750, 314], [772, 330], [750, 346]], { stroke: '#fff', width: 6, opacity: CL(m * 2 - 1) }); label(p, '減数分裂', 660, 290, 30, { align: 'center', fill: CHALK.y, a: m }); label(p, '2回の分裂で半減', 660, 375, 22, { align: 'center', a: rc.u('half', 0.3) }); }
}

/* ---------- テーマ3：減数分裂（21番の1対） ---------- */
let C21S = 1;
const C21 = (p: Pen, x: number, y: number, col: string, sis: number, a = 1) => mchr(p, x, y - 34 * C21S, 68 * C21S, 0.15, { w: 13 * C21S, col, sister: sis, sat: true, a });
function meiosisFig(rc: RC) {
  const { p } = rc;
  C21S = 1.7;
  const rep = rc.u('rep', 1.2), pair = between(rc, 'pair', 'm1', ease.inOut), d1 = between(rc, 'm1', 'm2', ease.inOut), d2 = between(rc, 'm2', 'four', ease.inOut);
  const sis = rep;
  if (d1 <= 0) {
    cell(p, 640, 340, 220);
    const bx = 560 + 60 * pair, rx = 720 - 60 * pair;
    C21(p, bx, 330, FATHER, sis); C21(p, rx, 330, MOTHER, sis);
    if (pair > 0.5) p.line([[640, 130], [640, 550]], { stroke: '#fff', width: 2, dash: [8, 8], opacity: pair });
  } else if (d2 <= 0) {
    // meiosis I: homologues go to different cells
    const off = 240 * d1, r = 220 - 70 * d1;
    cell(p, 640 - off, 340, r); cell(p, 640 + off, 340, r);
    C21(p, 620 - off, 330, FATHER, 1); C21(p, 660 + off, 330, MOTHER, 1);
  } else {
    // meiosis II: sister chromatids separate → 4 gametes, one chromatid each
    const yo = 140 * d2, r = 150 - 50 * d2;
    for (const [x, col] of [[400, FATHER], [880, MOTHER]] as const) {
      cell(p, x, 340 - yo, r); cell(p, x, 340 + yo, r);
      if (d2 < 0.5) C21(p, x, 340, col, 1 - d2 * 2);
      else { C21(p, x, 340 - yo, col, 0); C21(p, x, 340 + yo, col, 0); }
    }
  }
  const lab = d2 > 0 ? '第2分裂：姉妹染色分体が分かれる' : d1 > 0 ? '第1分裂：相同染色体が分かれる' : pair > 0 ? '相同染色体が並ぶ' : rep > 0 ? 'DNA複製 → 姉妹染色分体' : '21番の1対（青＝父、赤＝母）';
  label(p, lab, 640, 70, 32, { align: 'center', fill: CHALK.y });
  const f = rc.u('four', 0.3);
  if (f > 0) for (const [x, y] of [[400, 200], [400, 480], [880, 200], [880, 480]] as const) label(p, '1本', x + 110, y, 26, { fill: '#fff', a: f });
  term(p, '配偶子 4つ', 640, 340, rc.u('one1', 0.25), 52, CHALK.y);
}

/* ---------- テーマ3：第1分裂の不分離 ---------- */
function nondisjunctionFig(rc: RC) {
  const { p } = rc;
  C21S = 1.35;
  const d1 = between(rc, 'q+0.6', 'q+2.4', ease.inOut), d2 = rc.u('g', 1.2);
  const top = 230;
  if (d2 <= 0) {
    const off = 200 * d1, r = 180 - 50 * d1;
    if (d1 <= 0) cell(p, 640, top, r); else { cell(p, 640 - off, top, r); cell(p, 640 + off, top, r); }
    // both homologues end up on the left (they did not separate)
    C21(p, 620 - off, top, FATHER, 1); C21(p, 660 - off, top, MOTHER, 1);
    if (d1 > 0.6) label(p, '分かれない！', 640 + off, top, 30, { align: 'center', fill: '#ff8a7a', a: CL(d1 * 3 - 2) });
  } else {
    const yo = 95 * ease.inOut(CL(d2)), r = 92;
    const gam: [number, number, number][] = [[300, top - yo, 2], [300, top + yo, 2], [980, top - yo, 0], [980, top + yo, 0]];
    gam.forEach(([x, y, n], i) => {
      cell(p, x, y, r);
      if (n === 2) { C21(p, x - 16, y, FATHER, 0); C21(p, x + 16, y, MOTHER, 0); }
      label(p, `${n}本`, x + 120, y, 30, { fill: n === 2 ? '#ffd84a' : '#9fd0ff', a: rc.u(`g+${(0.8 + i * 0.2).toFixed(1)}`, 0.3) });
    });
  }
  // fertilization with a normal sperm (1)
  const tri = rc.u('tri', 0.5);
  if (tri > 0) {
    p.save(); p.alpha(tri);
    C21S = 0.9;
    p.rect(160, 440, 960, 150, { fill: 'rgba(8,10,14,0.75)', stroke: '#f4f0e4', width: 3 }, 12);
    // 2 + 1 = 3
    C21(p, 250, 515, FATHER, 0); C21(p, 280, 515, MOTHER, 0); label(p, '＋', 330, 515, 34, { align: 'center' }); C21(p, 370, 515, FATHER, 0);
    label(p, '＝ 3本', 470, 515, 34, { fill: '#ffd84a' }); term(p, 'トリソミー', 470, 562, rc.u('tri+0.3', 0.2), 30, '#ff6a55');
    label(p, '＋', 760, 515, 34, { align: 'center' }); C21(p, 800, 515, MOTHER, 0);
    label(p, '＝ 1本', 880, 515, 34, { fill: '#9fd0ff' }); term(p, 'モノソミー', 950, 562, rc.u('tri+0.6', 0.2), 30, '#9fd0ff');
    label(p, '（0本の卵子）', 700, 470, 20, { align: 'center', fill: '#bbb' });
    p.restore();
  }
  const m2 = rc.u('m2', 0.4);
  if (m2 > 0) { p.save(); p.alpha(m2); p.rect(420, 5, 440, 70, { fill: 'rgba(250,244,230,0.95)', stroke: '#b3261e', width: 5 }, 10); p.text('第2分裂の不分離：1・1・2・0本', 640, 40, { size: 28, font: 'gothic', weight: 900, fill: '#b3261e', align: 'center' }); p.restore(); }
  label(p, '第1分裂の不分離', 640, 40, 30, { align: 'center', fill: CHALK.y, a: (1 - m2) * rc.u('start', 0.4) });
}

/* ---------- テーマ3：加齢と不分離 ---------- */
function maternalAgeFig(rc: RC) {
  const { p, t } = rc;
  C21S = 1.3;
  const egg = rc.u('egg', 0.4) || rc.u('start', 0.4) * 0.5;
  p.save(); p.alpha(egg);
  cell(p, 330, 230, 120);
  const nd = rc.u('age', 0.6);
  C21(p, 305 - 55 * nd, 230, FATHER, 1); C21(p, 355 - 55 * nd, 230, MOTHER, 1);
  if (nd > 0) p.line([[330, 130], [330, 330]], { stroke: '#fff', width: 2, dash: [6, 6], opacity: nd });
  // a clock: the long arrest in prophase I
  const ck = between(rc, 'egg', 'age', (x) => x);
  p.circle(470, 120, 34, { fill: 'rgba(8,10,14,0.8)', stroke: '#fff', width: 3 });
  p.line([[470, 120], [470 + 24 * Math.sin(ck * 12), 120 - 24 * Math.cos(ck * 12)]], { stroke: '#fff', width: 3 });
  p.restore();
  label(p, '卵子：減数第1分裂前期で長い間停止', 330, 380, 24, { align: 'center', a: egg });
  label(p, '母の加齢 → 不分離', 330, 418, 28, { align: 'center', fill: '#ff8a7a', a: nd });
  const sp = rc.u('sperm', 0.4);
  if (sp > 0) {
    p.save(); p.alpha(sp);
    p.ellipse(880, 230, 90, 60, 0, { fill: 'rgba(232,217,194,0.12)', stroke: '#e8d9c2', width: 4 });
    p.path('M 970 230 C 1030 200 1070 260 1130 230 S 1200 200 1240 240', { stroke: '#e8d9c2', width: 4 });
    helix(p, 820, 940, 230, 16, 60, t * 2, { lw: 3, bases: true, bpt: 10 });
    const m = rc.u('mut', 1.0);
    for (let i = 0; i < Math.round(5 * m); i++) p.circle(830 + i * 24, 230 + (i % 2 ? -12 : 12), 7, { fill: '#ff4a3a', stroke: INK, width: 2 });
    p.restore();
  }
  label(p, '精子：加齢でDNA複製エラー', 950, 380, 24, { align: 'center', a: sp });
  label(p, '父の加齢 → 塩基レベルの突然変異', 950, 418, 26, { align: 'center', fill: '#ff8a7a', a: rc.u('mut', 0.3) });
  // Down syndrome by maternal age (スライド33)
  const dk = rc.u('down', 0.4);
  if (dk > 0) {
    p.save(); p.alpha(dk);
    p.line([[300, 560], [980, 560]], { stroke: '#fff', width: 3 });
    const bars: [number, string, string, string][] = [[1500, '20歳', '約1/1500', 'a20'], [350, '35歳', '約1/350', 'a35'], [100, '40歳', '約1/100', 'a40']];
    bars.forEach(([n, age, txt, ev], i) => {
      const x = 420 + i * 220, k = rc.u(ev, 0.5), h = (100 / n) * 105 * ease.outCubic(k);
      p.rect(x - 40, 560 - h, 80, h, { fill: i === 2 ? '#ff6a55' : '#ffb0a6', stroke: INK, width: 3 });
      label(p, age, x, 584, 22, { align: 'center' });
      label(p, txt, x, 560 - h - 22, 26, { align: 'center', fill: CHALK.y, a: k });
    });
    label(p, 'ダウン症候群（母の年齢）', 640, 470, 24, { align: 'center', fill: '#ccc' });
    p.restore();
  }
}

/* ---------- テーマ4：異数体 ---------- */
function aneuploidFig(rc: RC) {
  const { p } = rc;
  const groups: [number, number, string, string][] = [[300, 1, 'モノソミー', 'mono'], [640, 3, 'トリソミー', 'tri'], [980, 4, 'テトラソミー', 'tetra']];
  const up = 1 - 0.55 * rc.u('born', 0.5);
  groups.forEach(([x, n, name, ev]) => {
    const k = rc.u(ev, 0.3); if (k <= 0) return;
    p.save(); p.alpha(k * up);
    for (let i = 0; i < n; i++) mchr(p, x + (i - (n - 1) / 2) * 44, 50, 120, 0.4, { w: 14, seed: 21 });
    label(p, `${n}本`, x, 200, 30, { align: 'center', fill: CHALK.y });
    label(p, name, x, 238, 30, { align: 'center' });
    p.restore();
  });
  const b = rc.u('born', 0.4);
  if (b > 0) {
    p.save(); p.alpha(b);
    label(p, '生まれてくる常染色体の完全トリソミー', 640, 295, 26, { align: 'center' });
    [['13', 470], ['18', 640], ['21', 810]].forEach(([s, x]) => { p.circle(x as number, 352, 40, { fill: 'rgba(255,106,85,0.25)', stroke: '#ff6a55', width: 5 }); p.text(s as string, x as number, 352, { size: 38, font: 'gothic', weight: 900, fill: '#fff', align: 'center' }); });
    p.restore();
    label(p, 'ほかの多くは早期に流産', 640, 412, 24, { align: 'center', fill: '#bbb', a: rc.u('loss', 0.3) });
  }
  const sx = rc.u('sex', 0.4);
  if (sx > 0) { p.save(); p.alpha(sx); label(p, '性染色体の過剰（XXYなど）', 330, 480, 28, { align: 'center' }); label(p, '→ 不活性化されて症状が軽い', 330, 520, 24, { align: 'center', fill: '#ccc' }); p.restore(); }
  const tu = rc.u('turner', 0.25);
  if (tu > 0) { p.save(); p.translate(920, 500); p.rotate(-0.04); p.scale(1 + 0.4 * (1 - ease.outExpo(tu))); p.rect(-230, -58, 460, 116, { fill: 'rgba(250,244,230,0.95)', stroke: '#b3261e', width: 6 }, 10); p.text('性染色体モノソミー', 0, -24, { size: 28, font: 'gothic', weight: 900, fill: '#b3261e', align: 'center' }); p.text('＝ターナー（45,X）のみ', 0, 22, { size: 30, font: 'gothic', weight: 900, fill: '#b3261e', align: 'center' }); p.restore(); }
}

/* ---------- テーマ4：染色体ごとの遺伝子数 ---------- */
/** approximate numbers of protein-coding genes on autosomes 1–22 (rounded) */
const GENES = [2050, 1300, 1080, 750, 880, 1040, 930, 680, 780, 730, 1300, 1030, 320, 600, 600, 850, 1180, 270, 1470, 540, 230, 440];
function geneCountFig(rc: RC) {
  const { p } = rc;
  const base = 520, k0 = rc.u('graph', 1.0) || rc.u('start', 0.8) * 0.5;
  label(p, '染色体ごとの遺伝子の数（常染色体・概数）', 640, 70, 28, { align: 'center', fill: '#ddd' });
  p.line([[90, base], [1190, base]], { stroke: '#fff', width: 3 });
  GENES.forEach((g, i) => {
    const n = i + 1, x = 115 + i * 49.5, h = g * 0.15 * ease.outCubic(CL(k0 * 1.6 - i * 0.03));
    const ev = n === 13 ? 'g13' : n === 18 ? 'g18' : n === 21 ? 'g21' : '';
    const hot = ev ? rc.u(ev, 0.3) : 0;
    p.rect(x - 17, base - h, 34, h, { fill: hot > 0 ? `rgb(${Math.round(120 + 135 * hot)},${Math.round(160 - 60 * hot)},${Math.round(200 - 110 * hot)})` : '#78a0c8', stroke: INK, width: 2 });
    label(p, String(n), x, base + 20, 18, { align: 'center', fill: hot > 0 ? '#ff8a7a' : '#ccc' });
    if (hot > 0) p.circle(x, base - h - 30, 22, { stroke: '#ff4a3a', width: 4, opacity: hot });
  });
  term(p, '特に少ない', 900, 130, rc.u('few', 0.2), 56, '#ff6a55');
  const e = rc.u('extra', 0.3);
  if (e > 0) { p.save(); p.alpha(e); p.rect(150, 90, 470, 110, { fill: 'rgba(8,10,14,0.85)', stroke: '#f4f0e4', width: 3 }, 10); label(p, '1本多くても、余分な遺伝子が少ない', 385, 125, 24, { align: 'center' }); label(p, '→ 生まれてこられる', 385, 165, 28, { align: 'center', fill: CHALK.y, a: rc.u('live', 0.3) }); p.restore(); }
}

export const FILM3_PLATE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'pack-strip': nucleoplasm, packing: nucleoplasm, octamer: nucleoplasm, histmod: nucleoplasm, karyotype: streaks, centromere: streaks,
  ploidy: warmFluid, meiosis: nucleoplasm, nondisjunction: nucleoplasm, 'maternal-age': warmFluid, aneuploid: streaks, genecount: streaks,
};
export const FILM3_FIGURE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'pack-strip': packStripFig, packing: packingFig, octamer: octamerFig, histmod: histmodFig, karyotype: karyotypeFig, centromere: centromereFig,
  ploidy: ploidyFig, meiosis: meiosisFig, nondisjunction: nondisjunctionFig, 'maternal-age': maternalAgeFig, aneuploid: aneuploidFig, genecount: geneCountFig,
};
void W; void H; void hall;
