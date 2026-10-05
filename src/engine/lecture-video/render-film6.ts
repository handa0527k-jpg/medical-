/**
 * Scenes of the 完成版 (第6講まるごと「エピゲノムとミトコンドリアゲノム」).
 *
 * Biology kept exact (and identical in every intensity):
 *  - Genome (= genotype) → epigenome (DNA / histone modification) → transcriptome → proteome → metabolome (= phenotype) (スライド47).
 *  - Condensed chromatin = heterochromatin, transcription OFF; loose = euchromatin, ON; chromatin remodelling switches between them.
 *  - DNA hypermethylation (C of 5'-CG-3', >70 % in silent genes) + histone deacetylation → condensed → OFF;
 *    histone acetylation lowers the histones' basic charge, loosens DNA, exposes the promoter for RNA polymerase → ON.
 *    The base sequence does not change (epigenetic vs genetic).
 *  - The switch animation follows the lecture: methylation → packing (OFF); then, as a new case, a transcription factor on the enhancer
 *    recruits histone acetyltransferase → acetylation → promoter exposed → RNA polymerase → ON; deacetylase removes acetyl → OFF again.
 *  - Exercise: promoter methylation of PGC-1α and other metabolic genes falls, expression rises; HDAC leaves the nucleus on contraction signals.
 *  - mtDNA: 10^3–10^4 copies per cell, 37 genes (respiratory-chain parts etc.), most mitochondrial proteins are nuclear-gene products,
 *    maternal inheritance. Twins are drawn as abstract cards and gauges: no faces.
 */
import type { SceneDef } from './types';
import type { Pen } from './pen';
import { CHALK, INK } from './diagrams';
import { ease } from './gekiga';
import { CL, label, rnd, streaks, type RC } from './render-kit';
import { between, nucleoplasm, term, warmFluid } from './render-film';
import { mchr, nucleosome } from './render-film3';

type P2 = [number, number];
const RED = '#ff6a55', GREEN = '#7fdc8a', ME = '#ff8a3a', AC = '#7fdc8a', PROMO = '#ffd84a', EXON = '#58c47a', RNA = '#c38bff', DNAC = '#d9e6f2';
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ---------- shared parts ---------- */
function card(p: Pen, x: number, y: number, w: number, h: number, a: number, edge = '#f4f0e4') {
  if (a <= 0) return;
  p.rect(x - w / 2, y - h / 2, w, h, { fill: 'rgba(8,10,14,0.88)', stroke: edge, width: 3, opacity: a }, 12);
}
function arrow(p: Pen, x0: number, y0: number, x1: number, y1: number, a = 1, col = '#fff', w = 5) {
  if (a <= 0) return;
  const ang = Math.atan2(y1 - y0, x1 - x0), h = 16;
  p.line([[x0, y0], [x1, y1]], { stroke: col, width: w, opacity: a });
  p.line([[x1 - h * Math.cos(ang - 0.45), y1 - h * Math.sin(ang - 0.45)], [x1, y1], [x1 - h * Math.cos(ang + 0.45), y1 - h * Math.sin(ang + 0.45)]], { stroke: col, width: w, opacity: a });
}
/** a small modification flag (Me / Ac) on a stalk */
function flag(p: Pen, x: number, y: number, s: 'Me' | 'Ac', k: number, up = 1) {
  if (k <= 0) return;
  const col = s === 'Me' ? ME : AC, len = 22 * ease.outCubic(k);
  p.line([[x, y], [x, y - len * up]], { stroke: col, width: 3, opacity: k });
  p.circle(x, y - (len + 10) * up, 11 * CL(k * 1.5), { fill: col, stroke: INK, width: 2, opacity: k });
  if (k > 0.6) p.text(s, x, y - (len + 10) * up, { size: 11, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
}
function badge(p: Pen, s: 'ON' | 'OFF', x: number, y: number, k: number) {
  if (k <= 0) return;
  const col = s === 'ON' ? GREEN : RED;
  p.save(); p.translate(x, y); p.scale(1 + 0.5 * (1 - ease.outExpo(k))); p.alpha(CL(k * 3));
  p.rect(-64, -30, 128, 60, { fill: 'rgba(8,10,14,0.9)', stroke: col, width: 5 }, 30);
  p.text(s, 0, 0, { size: 34, font: 'gothic', weight: 900, fill: col, align: 'center' });
  p.restore();
}
function blob(p: Pen, x: number, y: number, rx: number, ry: number, col: string, a = 1) {
  if (a <= 0) return;
  p.ellipse(x, y, rx, ry, 0, { fill: col, stroke: INK, width: 4, opacity: a });
}
function gauge(p: Pen, x: number, y0: number, h: number, level: number, col: string, a = 1) {
  if (a <= 0) return;
  p.rect(x - 26, y0, 52, h, { fill: 'rgba(10,12,16,0.8)', stroke: '#9aa4b0', width: 3, opacity: a }, 8);
  const f = h * CL(level);
  p.rect(x - 20, y0 + h - f - 2, 40, f, { fill: col, opacity: a }, 6);
}

/* ---------- 全体像：双子（顔は描かない） ---------- */
function twinsFig(rc: RC) {
  const { p, t } = rc;
  const xs = [400, 880], a0 = rc.u('start', 0.4);
  const same = rc.u('same', 0.4);
  xs.forEach((x, i) => {
    label(p, i ? '双子 ②' : '双子 ①', x, 110, 30, { align: 'center', a: a0 });
    // the genome strip: identical stripes for both
    p.rect(x - 150, 150, 300, 36, { fill: '#2c3440', stroke: same > 0 ? CHALK.y : '#8fa3b5', width: same > 0 ? 4 : 3, opacity: a0 }, 6);
    for (let j = 0; j < 22; j++) p.rect(x - 144 + j * 13.4, 154, 7, 28, { fill: ['#ff6b5b', '#ffd84a', '#58c47a', '#5aa9ff'][Math.floor(rnd(j * 3) * 4)], opacity: a0 });
  });
  label(p, '＝', 640, 168, 40, { align: 'center', fill: CHALK.y, a: same });
  label(p, '同じゲノム', 640, 222, 26, { align: 'center', fill: CHALK.y, a: same });
  // apparent age gauges: alike as babies, apart as adults
  const b = rc.u('baby', 0.5), ad = ease.inOut(rc.u('adult', 1.2));
  if (b > 0) {
    const lv = [lerp(0.12, 0.5, ad), lerp(0.12, 0.85, ad)];
    xs.forEach((x, i) => { gauge(p, x, 280, 240, lv[i], i && ad > 0.3 ? RED : '#ffcf8a', b); });
    label(p, '見た目の年齢', 640, 300, 24, { align: 'center', a: b });
    label(p, '赤ちゃん：そっくり', 640, 560, 28, { align: 'center', a: b * (1 - ad) });
    label(p, '大人：一方は明らかに年上に見える', 640, 560, 28, { align: 'center', fill: '#ffb0a0', a: ad });
  }
  const e = rc.u('env', 0.5);
  if (e > 0) {
    for (let k = 0; k < 3; k++) {
      const y = 330 + k * 60, pts: P2[] = [];
      for (let x = 1220; x >= 980 + 20 * Math.sin(t * 2 + k); x -= 10) pts.push([x, y + Math.sin(x / 18 + t * 4 + k) * 8]);
      p.line(pts, { stroke: '#ffcf8a', width: 4, opacity: e * 0.9 });
    }
    label(p, '生活・環境', 1110, 290, 26, { align: 'center', fill: '#ffcf8a', a: e });
  }
  const h = rc.u('how', 0.4);
  if (h > 0) label(p, '環境は、どうやって体を変える？', 640, 630, 30, { align: 'center', fill: CHALK.y, a: h * (1 - rc.u('theme', 0.3)) });
  term(p, '今日のテーマ', 640, 635, rc.u('theme', 0.25), 44, '#fff');
}

/* ---------- 全体像：見た目年齢の研究 ---------- */
function twinStudyFig(rc: RC) {
  const { p } = rc;
  const n = rc.u('n', 0.4);
  label(p, '見た目の年齢 と 健康', 640, 90, 32, { align: 'center', a: rc.u('q', 0.4) });
  if (n > 0) {
    card(p, 640, 200, 620, 110, n, CHALK.y);
    label(p, '70歳以上の双子 1826人', 640, 200, 40, { align: 'center', fill: CHALK.y, a: n });
  }
  const pr = rc.u('pred', 0.4);
  if (pr > 0) {
    card(p, 290, 430, 300, 100, pr);
    label(p, '見た目年齢', 290, 430, 34, { align: 'center', a: pr });
    label(p, '実年齢・生活習慣で補正しても', 640, 300, 22, { align: 'center', fill: '#cfcfcf', a: pr });
    arrow(p, 445, 410, 445 + 290 * ease.outCubic(pr), 350, pr);
    label(p, '健康寿命を予見', 940, 340, 32, { align: 'center', fill: GREEN, a: pr });
  }
  const te = rc.u('telo', 0.4);
  if (te > 0) {
    arrow(p, 445, 440, 735, 450, te); arrow(p, 445, 460, 735, 550, te);
    label(p, 'テロメアの長さ', 940, 450, 30, { align: 'center', a: te });
    label(p, '認知機能', 940, 550, 30, { align: 'center', a: te });
    label(p, 'とも関連', 1130, 500, 24, { align: 'center', fill: '#ffcf8a', a: te });
  }
}

/* ---------- テーマ1：遺伝型から表現型へ ---------- */
function omicsFig(rc: RC) {
  const { p, t } = rc;
  const rows: [string, string, number, string][] = [
    ['ゲノム', 'DNA', 120, 'genome'], ['エピゲノム', 'DNA・ヒストンの修飾', 230, 'epi'], ['トランスクリプトーム', 'RNA', 340, 'epi+1.2'],
    ['プロテオーム', 'タンパク質', 450, 'pheno'], ['メタボローム', '代謝物', 560, 'pheno+0.4'],
  ];
  const a0 = rc.u('start', 0.5);
  rows.forEach(([n, s, y, ev], i) => {
    const k = Math.max(0.25 * a0, rc.u(ev, 0.4) || (i === 0 ? rc.u('genome', 0.4) : 0));
    const hot = i === 1 ? rc.u('epi', 0.4) : 0;
    p.rect(390, y - 38, 500, 76, { fill: hot > 0 ? `rgba(255,216,74,${0.18 + 0.08 * Math.sin(t * 4)})` : 'rgba(10,12,16,0.82)', stroke: hot > 0 ? CHALK.y : '#9aa4b0', width: hot > 0 ? 5 : 3, opacity: k }, 10);
    label(p, n, 640, y - 10, 30, { align: 'center', fill: hot > 0 ? CHALK.y : '#fff', a: k });
    label(p, s, 640, y + 22, 20, { align: 'center', fill: '#cfcfcf', a: k });
    if (i < 4) arrow(p, 640, y + 40, 640, y + 70, k * 0.8, '#fff', 4);
  });
  const g = rc.u('geno', 0.3);
  if (g > 0) { p.line([[370, 82], [350, 82], [350, 158], [370, 158]], { stroke: '#9fd0ff', width: 4, opacity: g }); label(p, '遺伝型', 270, 120, 34, { align: 'center', fill: '#9fd0ff', a: g }); label(p, '生まれつき', 270, 160, 20, { align: 'center', a: g }); }
  const ph = rc.u('pheno', 0.3);
  if (ph > 0) { p.line([[370, 412], [350, 412], [350, 598], [370, 598]], { stroke: '#ffb0a0', width: 4, opacity: ph }); label(p, '表現型', 270, 505, 34, { align: 'center', fill: '#ffb0a0', a: ph }); }
  const m = rc.u('mod', 0.4);
  if (m > 0) {
    // DNA methylation and histone acetylation, drawn small beside the epigenome row
    p.line([[960, 250], [1180, 250]], { stroke: DNAC, width: 5, opacity: m });
    flag(p, 1000, 246, 'Me', m); flag(p, 1060, 246, 'Me', CL(m * 2 - 0.5));
    label(p, 'DNAのメチル化', 1070, 290, 20, { align: 'center', fill: ME, a: m });
    p.save(); p.alpha(m); nucleosome(p, 1070, 178, 28, 1); p.restore();
    flag(p, 1100, 158, 'Ac', m);
    label(p, 'ヒストンの修飾', 1070, 92, 20, { align: 'center', fill: AC, a: m });
  }
}

/* ---------- テーマ2：凝集とゆるみ ---------- */
function packed(p: Pen, cx: number, cy: number, n: number, r: number, spread: number, t: number, a = 1) {
  p.save(); p.alpha(a);
  for (let i = 0; i < n; i++) { const ang = i * 2.4, rr = spread * Math.sqrt((i + 0.5) / n); nucleosome(p, cx + Math.cos(ang) * rr + Math.sin(t + i) * 1.5, cy + Math.sin(ang) * rr * 0.8, r, 1); }
  p.restore();
}
function beadsOnString(p: Pen, x0: number, x1: number, y: number, n: number, r: number, t: number, a = 1) {
  const pts: P2[] = []; for (let x = x0; x <= x1; x += 8) pts.push([x, y + Math.sin(x / 40 + t) * 18]);
  p.line(pts, { stroke: INK, width: 9, opacity: a }); p.line(pts, { stroke: DNAC, width: 5, opacity: a });
  p.save(); p.alpha(a);
  for (let i = 0; i < n; i++) { const x = x0 + 30 + i * ((x1 - x0 - 60) / (n - 1)); nucleosome(p, x, y + Math.sin(x / 40 + t) * 18, r, 1); }
  p.restore();
}
function chromatinFig(rc: RC) {
  const { p, t } = rc;
  label(p, 'エピゲノムは何をしている？', 640, 90, 30, { align: 'center', fill: CHALK.y, a: rc.u('q', 0.3) * (1 - rc.u('off', 0.3)) });
  const off = rc.u('off', 0.5), on = rc.u('on', 0.5);
  packed(p, 340, 330, 18, 22, 110, t, Math.max(0.3 * rc.u('start', 0.5), off));
  label(p, '凝集', 340, 190, 28, { align: 'center', a: off });
  label(p, 'ヘテロクロマチン', 340, 480, 30, { align: 'center', fill: '#ffb0a0', a: rc.u('hetero', 0.3) });
  badge(p, 'OFF', 340, 550, off);
  beadsOnString(p, 720, 1180, 330, 5, 22, t, Math.max(0.3 * rc.u('start', 0.5), on));
  label(p, '緩む', 950, 190, 28, { align: 'center', a: on });
  label(p, 'ユークロマチン', 950, 480, 30, { align: 'center', fill: GREEN, a: rc.u('eu', 0.3) });
  badge(p, 'ON', 950, 550, on);
  const r = rc.u('rem', 0.6);
  if (r > 0) {
    p.path('M 500 270 C 580 200 680 200 740 260', { stroke: CHALK.y, width: 5, opacity: r });
    p.line([[722, 246], [742, 262], [736, 236]], { stroke: CHALK.y, width: 5, opacity: r });
    p.path('M 740 400 C 680 460 580 460 500 400', { stroke: CHALK.y, width: 5, opacity: r });
    p.line([[518, 414], [498, 398], [506, 424]], { stroke: CHALK.y, width: 5, opacity: r });
    term(p, 'クロマチンリモデリング', 640, 640, rc.u('rem', 0.25), 40, CHALK.y);
  }
}

/* ---------- テーマ2：高メチル化と低メチル化 ---------- */
function methylFig(rc: RC) {
  const { p, t } = rc;
  const row = (y: number, ev: string, many: boolean, res: string, k2: number) => {
    const a = rc.u(ev, 0.5);
    if (a <= 0) return;
    const pack = ease.inOut(k2);
    // DNA with nucleosomes; packing pulls them together (high) or apart (low)
    const n = 6, xs = Array.from({ length: n }, (_, i) => many ? lerp(330 + i * 110, 470 + i * 52, pack) : lerp(360 + i * 90, 300 + i * 130, pack));
    p.line([[220, y], [1000, y]], { stroke: INK, width: 9, opacity: a }); p.line([[220, y], [1000, y]], { stroke: DNAC, width: 5, opacity: a });
    p.save(); p.alpha(a); xs.forEach((x) => nucleosome(p, x, y, 26, 1)); p.restore();
    const marks = many ? 9 : 2;
    for (let i = 0; i < marks; i++) flag(p, 250 + i * (many ? 85 : 360), y - 4, 'Me', CL(a * marks - i));
    label(p, many ? '高メチル化' : '低メチル化', 120, y, 30, { align: 'center', fill: many ? ME : '#cfcfcf', a });
    const r = rc.u(res, 0.4);
    if (r > 0) {
      label(p, many ? '凝集' : '緩む', 1080, y - 30, 28, { align: 'center', a: r });
      label(p, many ? '発現 ↓' : '発現 ↑', 1080, y + 20, 36, { align: 'center', fill: many ? RED : GREEN, a: r });
    }
  };
  row(220, 'hi', true, 'down', rc.u('down', 1.0));
  row(480, 'lo', false, 'up', rc.u('up', 1.0));
  void t;
}

/* ---------- テーマ2：5'-CG-3' のメチル化とエピジェネティック ---------- */
const SEQ6 = 'ATCGTTACGAGCGT';
function cpgFig(rc: RC) {
  const { p, t } = rc;
  const y = 170, x0 = 270, dx = 56;
  const a0 = rc.u('start', 0.4), m = rc.u('cpg', 0.6), hot = rc.u('p70', 0.4), nc = rc.u('nochg', 0.4);
  [...SEQ6].forEach((b, i) => {
    const x = x0 + i * dx, isC = b === 'C' && SEQ6[i + 1] === 'G', isCG = isC || (b === 'G' && SEQ6[i - 1] === 'C');
    if (hot > 0 && isCG) p.rect(x - 24, y - 26, 48, 52, { fill: `rgba(255,216,74,${0.25 * hot})`, stroke: CHALK.y, width: 2, opacity: hot }, 4);
    p.text(b, x, y, { size: 34, font: 'gothic', weight: 900, fill: nc > 0 ? '#fff' : '#d9e6f2', stroke: INK, strokeW: 5, align: 'center', opacity: a0 });
    if (isC) flag(p, x, y - 26, 'Me', m);
  });
  label(p, '発現しない遺伝子のDNA', 640, 80, 28, { align: 'center', a: rc.u('cpg', 0.3) });
  label(p, 'シトシン（C）が高度にメチル化', 640, 240, 24, { align: 'center', fill: ME, a: m });
  if (hot > 0) { label(p, "5'-CG-3' の C", 330, 300, 28, { align: 'center', fill: CHALK.y, a: hot }); term(p, '70%以上', 640, 305, hot, 44, CHALK.y); }
  // a complex that reads the methyl marks, then methylates histones and packs the chromatin
  const c = rc.u('complex', 0.5), pk = ease.inOut(rc.u('complex+1.5', 1.4));
  if (c > 0) {
    p.save(); p.alpha(c * (1 - nc));
    const xs = Array.from({ length: 6 }, (_, i) => lerp(330 + i * 120, 480 + i * 56, pk));
    p.line([[240, 430], [1040, 430]], { stroke: DNAC, width: 5 });
    xs.forEach((x, i) => { nucleosome(p, x, 430, 28, 1); flag(p, x + 10, 404, 'Me', CL(pk * 6 - i)); });
    blob(p, 260 + 60 * Math.sin(t * 1.5) * (1 - pk), 380, 60, 34, 'rgba(120,150,220,0.92)');
    label(p, '認識する複合体', 260, 330, 22, { align: 'center', fill: '#9fd0ff' });
    label(p, 'ヒストンもメチル化 → 強く凝集', 760, 510, 24, { align: 'center', fill: '#ffb0a0', a: CL(pk * 2) });
    p.restore();
  }
  if (nc > 0) {
    p.rect(x0 - 32, y - 34, (SEQ6.length - 1) * dx + 64, 68, { stroke: GREEN, width: 4, opacity: nc }, 8);
    label(p, '塩基配列の変化はない', 640, 380, 34, { align: 'center', fill: GREEN, a: nc });
  }
  const g = rc.u('gen', 0.4), e = rc.u('epi', 0.4);
  if (g > 0) { card(p, 360, 590, 480, 110, g, RED); label(p, 'ジェネティック', 360, 570, 30, { align: 'center', fill: RED, a: g }); label(p, '配列が変わる（突然変異など）', 360, 612, 22, { align: 'center', a: g }); }
  if (e > 0) { card(p, 920, 590, 480, 110, e, GREEN); label(p, 'エピジェネティック', 920, 570, 30, { align: 'center', fill: GREEN, a: e }); label(p, '配列は同じ、修飾で働きが変わる', 920, 612, 22, { align: 'center', a: e }); }
}

/* ---------- テーマ2：スイッチの動き ---------- */
const EVEN = [230, 350, 470, 590, 710, 810], PACKED = [560, 610, 660, 710, 760, 810], OPEN = [200, 300, 400, 500, 600, 690];
function switchFig(rc: RC) {
  const { p, t } = rc;
  const y = 360;
  const tTf = rc.ev('tf'), tH = rc.ev('hdac');
  const phase = rc.t < tTf ? 0 : rc.t < tH ? 1 : 2;
  const dip = CL(1 - Math.abs(rc.t - tTf) / 0.45);
  let xs: number[];
  if (phase === 0) { const k = ease.inOut(rc.u('pack', 1.4)); xs = EVEN.map((x, i) => lerp(x, PACKED[i], k)); }
  else if (phase === 1) { const k = ease.inOut(rc.u('open', 1.4)); xs = EVEN.map((x, i) => lerp(x, OPEN[i], k)); }
  else { const k = ease.inOut(rc.u('hdac+0.8', 1.4)); xs = OPEN.map((x, i) => lerp(x, PACKED[i], k)); }
  p.save(); p.alpha(1 - 0.85 * dip);
  // DNA, enhancer, promoter, gene
  p.line([[40, y], [1240, y]], { stroke: INK, width: 10 }); p.line([[40, y], [1240, y]], { stroke: DNAC, width: 6 });
  p.rect(60, y - 14, 90, 28, { fill: '#e2a65a', stroke: INK, width: 3 }, 4);
  p.rect(760, y - 14, 100, 28, { fill: PROMO, stroke: INK, width: 3 }, 4);
  p.rect(880, y - 14, 330, 28, { fill: EXON, stroke: INK, width: 3 }, 4);
  label(p, 'エンハンサー', 105, y + 46, 20, { align: 'center', fill: '#ffcf8a', a: phase === 1 ? 1 : 0.5 });
  label(p, '遺伝子', 1045, y + 46, 22, { align: 'center', a: 0.8 });
  const showPro = phase === 1 ? rc.u('open', 0.8) : 0;
  label(p, 'プロモーター', 810, y + 46, 22, { align: 'center', fill: PROMO, a: showPro });
  // DNA methyl marks (first case only)
  if (phase === 0) for (let i = 0; i < 10; i++) flag(p, 180 + i * 70, y - 6, 'Me', CL(rc.u('me', 1.6) * 10 - i), -1);
  xs.forEach((x, i) => {
    nucleosome(p, x, y, 38, 1);
    if (phase === 0) flag(p, x + 8, y - 44, 'Me', CL(rc.u('pack', 1.0) * 6 - i));
    if (phase >= 1) { const on = rc.u('ac', 1.6), off = phase === 2 ? rc.u('hdac', 0.8) : 0; flag(p, x - 10, y - 44, 'Ac', CL(on * 6 - i) * (1 - off)); }
  });
  // RNA polymerase: kept away, then binds the promoter and walks the gene
  const pol = phase === 1 ? rc.u('pol', 0.6) : 0, run = phase === 1 ? between(rc, 'pol', 'hdac', ease.inOut) : 0;
  const leave = phase === 2 ? rc.u('hdac', 0.8) : 0;
  let px = 1010 + Math.sin(t * 3) * 12, py = 180;
  if (pol > 0) { px = lerp(1010, 830 + 300 * run, ease.outCubic(pol)); py = lerp(180, y - 46, ease.outCubic(pol)); }
  if (phase === 2) { px = 1130; py = lerp(y - 46, 160, leave); }
  blob(p, px, py, 56, 40, 'rgba(222,140,96,0.92)', 1 - 0.7 * leave);
  label(p, 'RNAポリメラーゼ', px, py - 62, 22, { align: 'center', fill: '#ffb88a', a: 1 - 0.7 * leave });
  const cant = phase === 0 ? rc.u('cant', 0.3) : 0;
  if (cant > 0) { p.line([[960, 230], [1060, 290]], { stroke: RED, width: 8, opacity: cant }); p.line([[1060, 230], [960, 290]], { stroke: RED, width: 8, opacity: cant }); label(p, '近づけない', 1010, 320, 24, { align: 'center', fill: RED, a: cant * (1 - rc.u('me', 0.3)) }); }
  if (pol > 0 && run > 0.05) { const pts: P2[] = []; for (let x = 860; x < px - 10; x += 10) pts.push([x, y - 70 - (px - x) * 0.25 + Math.sin(x / 20 + t * 3) * 5]); if (pts.length > 1) p.line(pts, { stroke: RNA, width: 6 }); }
  // the enzymes: transcription factor + HAT (case 2), deacetylase (end)
  if (phase === 1) {
    const tf = rc.u('tf', 0.5), hat = between(rc, 'tf+1', 'ac', ease.inOut);
    blob(p, 105, y - 40 - 40 * (1 - tf), 40, 26, 'rgba(90,169,255,0.95)', tf);
    label(p, '転写因子', 105, y - 100, 22, { align: 'center', fill: '#9fd0ff', a: tf * (1 - rc.u('pol', 0.3)) });
    const hx = lerp(150, 520, hat), fade = 1 - rc.u('open', 0.6);
    blob(p, hx, y - 120, 46, 30, 'rgba(127,220,138,0.95)', CL(rc.u('tf+1', 0.4)) * fade);
    label(p, 'アセチル化酵素', hx, y - 170, 22, { align: 'center', fill: AC, a: CL(rc.u('tf+1', 0.4)) * fade });
  }
  if (phase === 2) {
    const hx = lerp(120, 760, between(rc, 'hdac', 'switch', ease.inOut)), ha = 1 - rc.u('switch', 0.5);
    blob(p, hx, y - 120, 46, 30, 'rgba(170,170,180,0.95)', ha);
    label(p, '脱アセチル化酵素', hx, y - 170, 22, { align: 'center', fill: '#ddd', a: ha });
  }
  p.restore();
  // state
  if (phase === 0) { label(p, 'ヘテロクロマチン', 640, 560, 32, { align: 'center', fill: '#ffb0a0', a: rc.u('hetero', 0.3) }); badge(p, 'OFF', 640, 630, rc.u('off', 0.3)); }
  if (phase === 1) badge(p, 'ON', 640, 600, rc.u('on', 0.3));
  if (phase === 2) {
    badge(p, 'OFF', 640, 600, rc.u('hdac+1.6', 0.3) * (1 - rc.u('switch', 0.3)));
    const s = rc.u('switch', 0.4);
    if (s > 0) { badge(p, 'ON', 520, 600, s); badge(p, 'OFF', 760, 600, s); label(p, '⇄', 640, 600, 44, { align: 'center', fill: CHALK.y, a: s }); }
    term(p, '入れたり切ったりできる', 640, 120, rc.u('switch', 0.25), 44, CHALK.y);
  }
}

/* ---------- テーマ2：電気のイメージ ---------- */
function chargeFig(rc: RC) {
  const { p, t } = rc;
  const cx = 640, cy = 370;
  label(p, '電気で考える', 640, 80, 32, { align: 'center', fill: CHALK.y, a: rc.u('elec', 0.3) });
  const pm = rc.u('pm', 0.4), rel = ease.inOut(rc.u('release', 1.4));
  p.circle(cx, cy, 120, { fill: '#c9a0dc', stroke: INK, width: 5 });
  label(p, 'ヒストン', cx, cy, 30, { align: 'center', fill: '#111' });
  const R = 160 + 90 * rel;
  const pts: P2[] = []; for (let th = 0; th <= Math.PI * 3.4; th += 0.08) { const r = R + 8 * th / Math.PI; pts.push([cx + r * Math.cos(th - Math.PI / 2), cy + r * 0.92 * Math.sin(th - Math.PI / 2)]); }
  p.line(pts, { stroke: INK, width: 18 }); p.line(pts, { stroke: DNAC, width: 12 });
  label(p, 'DNA', cx + R + 70, cy - 150, 30, { align: 'center', fill: DNAC, a: pm });
  for (let i = 0; i < 8; i++) {
    const th = i * Math.PI / 4 + 0.3, x = cx + 92 * Math.cos(th), y = cy + 92 * Math.sin(th);
    const ac = CL(rc.u('release', 1.0) * 8 - i);
    if (ac < 0.5) p.text('＋', x, y, { size: 30, font: 'gothic', weight: 900, fill: '#ff4a3a', stroke: INK, strokeW: 4, align: 'center', opacity: pm * (1 - ac * 2) });
    else { p.circle(x, y, 16, { fill: AC, stroke: INK, width: 2 }); p.text('Ac', x, y, { size: 13, font: 'gothic', weight: 900, fill: '#111', align: 'center' }); }
  }
  for (let i = 0; i < 12; i++) { const th = i * Math.PI / 6, x = cx + (R + 10) * Math.cos(th), y = cy + (R + 10) * 0.92 * Math.sin(th); p.text('−', x, y, { size: 28, font: 'gothic', weight: 900, fill: '#5aa9ff', stroke: INK, strokeW: 4, align: 'center', opacity: pm }); }
  label(p, 'ヒストンはプラス、DNAはマイナス → 引き合う', 640, 640, 26, { align: 'center', a: pm * (1 - rel) });
  label(p, 'アセチル化でプラスが減る → DNAを手放す', 640, 640, 28, { align: 'center', fill: GREEN, a: rel });
  label(p, '※補足のイメージ', 1120, 680, 22, { align: 'center', fill: '#bbb', a: rc.u('note', 0.3) });
  void t;
}

/* ---------- テーマ2：運動とエピゲノム ---------- */
function exerciseFig(rc: RC) {
  const { p, t } = rc;
  // a muscle fibre (striated), contracting
  const ct = rc.u('start', 0.4), sq = 1 - 0.08 * Math.max(0, Math.sin(t * 5)) * rc.u('study', 0.4);
  p.save(); p.translate(300, 360); p.scale(sq, 1); p.alpha(ct);
  p.rect(-220, -90, 440, 180, { fill: '#b8504a', stroke: INK, width: 5 }, 40);
  for (let i = -200; i <= 200; i += 22) p.line([[i, -84], [i, 84]], { stroke: 'rgba(255,220,210,0.45)', width: 4 });
  p.restore();
  label(p, '激しい運動', 300, 210, 30, { align: 'center', a: rc.u('study', 0.3) });
  label(p, '筋肉', 300, 490, 26, { align: 'center', a: ct });
  // nucleus with a metabolic gene's promoter
  const nx = 900, ny = 360;
  p.ellipse(nx, ny, 260, 200, 0, { fill: 'rgba(120,90,160,0.3)', stroke: '#c9b7ea', width: 5 });
  label(p, '核', nx - 200, ny - 160, 28, { fill: '#c9b7ea' });
  p.line([[700, ny], [1110, ny]], { stroke: DNAC, width: 6 });
  p.rect(780, ny - 14, 110, 28, { fill: PROMO, stroke: INK, width: 3 }, 4); p.rect(900, ny - 14, 180, 28, { fill: EXON, stroke: INK, width: 3 }, 4);
  const m = rc.u('meth', 1.6);
  for (let i = 0; i < 5; i++) flag(p, 790 + i * 22, ny - 14, 'Me', 1 - CL(m * 5 - (4 - i)));
  label(p, 'PGC-1αなどのプロモーター', 835, ny + 50, 22, { align: 'center', fill: PROMO, a: rc.u('meth', 0.3) });
  label(p, 'メチル化 ↓', 835, ny - 90, 30, { align: 'center', fill: GREEN, a: rc.u('meth+1.2', 0.3) });
  const e = rc.u('expr', 1.2);
  for (let i = 0; i < 5; i++) { const k = CL(e * 5 - i); if (k <= 0) continue; const pts: P2[] = []; for (let x = 0; x < 120 * k; x += 10) pts.push([960 + x, ny + 70 + i * 18 + Math.sin(x / 14 + t * 3 + i) * 4]); if (pts.length > 1) p.line(pts, { stroke: RNA, width: 5 }); }
  label(p, '発現 ↑', 1020, ny + 175, 30, { align: 'center', fill: GREEN, a: rc.u('expr', 0.3) });
  // contraction signal → HDAC leaves the nucleus
  const h = rc.u('hdac', 0.5), out = ease.inOut(rc.u('hdac+0.6', 2.0));
  if (h > 0) {
    arrow(p, 530, 300, 640, 260, h, '#ffcf8a', 4);
    label(p, '収縮のシグナル', 580, 220, 22, { align: 'center', fill: '#ffcf8a', a: h });
    for (let i = 0; i < 3; i++) { const sx = 820 + i * 90, sy = 230, tx = 1000 + i * 90, ty = 60 + i * 10; blob(p, lerp(sx, tx, out), lerp(sy, ty, out), 30, 20, 'rgba(170,170,180,0.95)', h); }
    label(p, 'HDAC（脱アセチル化酵素）が核の外へ', 900, 600, 26, { align: 'center', a: h });
  }
}

/* ---------- テーマ3：ミトコンドリアゲノム ---------- */
function mito(p: Pen, x: number, y: number, s: number, ang: number, a = 1, glow = 0) {
  p.save(); p.translate(x, y); p.rotate(ang); p.scale(s); p.alpha(a);
  p.ellipse(0, 0, 50, 24, 0, { fill: '#c8643c', stroke: INK, width: 4 });
  p.path('M -38 0 C -30 -14 -22 14 -14 0 C -6 -14 2 14 10 0 C 18 -14 26 14 34 0', { stroke: '#ffcf9a', width: 3 });
  for (const dx of [-20, 18]) p.circle(dx, 10, 6 + glow * 2, { stroke: glow > 0 ? CHALK.y : '#ffe8c0', width: 2 });
  p.restore();
}
const MITO: [number, number, number][] = [[620, 260, 0.3], [740, 230, -0.5], [860, 280, 0.8], [980, 250, 0.1], [700, 380, 1.2], [820, 420, -0.2], [940, 380, 0.5], [1060, 340, -0.9], [760, 480, 0.4], [900, 500, -0.6], [1040, 450, 0.2]];
function mtdnaFig(rc: RC) {
  const { p, t } = rc;
  const a0 = rc.u('start', 0.5);
  p.ellipse(640, 370, 560, 190, 0, { fill: 'rgba(255,220,200,0.08)', stroke: '#e8c8b0', width: 5, opacity: a0 });
  // nucleus: one set from each parent
  p.circle(330, 370, 120, { fill: 'rgba(120,90,160,0.35)', stroke: '#c9b7ea', width: 5, opacity: a0 });
  const n = rc.u('nuc', 0.4);
  mchr(p, 290, 320, 90, 0.4, { w: 14, col: '#5aa9ff', a: n }); mchr(p, 370, 320, 90, 0.4, { w: 14, col: '#ff6b5b', a: n });
  label(p, '核：父と母から1セットずつ', 330, 520, 24, { align: 'center', a: n });
  const c = rc.u('copy', 0.5);
  MITO.forEach(([x, y, ang], i) => mito(p, x, y + Math.sin(t + i) * 3, 1, ang, a0, c > 0 ? 0.5 + 0.5 * Math.sin(t * 5 + i) : 0));
  if (c > 0) { card(p, 780, 110, 420, 70, c, CHALK.y); label(p, '細胞あたり 10³〜10⁴ コピー', 780, 110, 28, { align: 'center', fill: CHALK.y, a: c }); }
  const g = rc.u('g37', 0.5);
  if (g > 0) {
    // the mtDNA ring, 37 genes
    p.save(); p.alpha(g * (1 - rc.u('import', 0.4)));
    p.circle(1150, 160, 96, { fill: 'rgba(8,10,14,0.9)', stroke: CHALK.y, width: 3 });
    for (let i = 0; i < 37; i++) { const a1 = (i / 37) * Math.PI * 2, a2 = a1 + (Math.PI * 2) / 37 * 0.75; p.path(`M ${1150 + 70 * Math.cos(a1)} ${160 + 70 * Math.sin(a1)} A 70 70 0 0 1 ${1150 + 70 * Math.cos(a2)} ${160 + 70 * Math.sin(a2)}`, { stroke: ['#ff6b5b', '#ffd84a', '#58c47a', '#5aa9ff'][i % 4], width: 12, opacity: CL(g * 37 - i) }); }
    p.text('37', 1150, 160, { size: 36, font: 'gothic', weight: 900, fill: '#fff', stroke: INK, strokeW: 5, align: 'center' });
    p.restore();
    label(p, '遺伝子37個', 1150, 285, 26, { align: 'center', fill: CHALK.y, a: g * (1 - rc.u('import', 0.4)) });
    label(p, '呼吸鎖の部品など', 1150, 320, 22, { align: 'center', a: rc.u('resp', 0.3) * (1 - rc.u('import', 0.4)) });
  }
  const im = rc.u('import', 0.5);
  if (im > 0) {
    const k = (t * 0.6) % 1;
    for (let i = 0; i < 4; i++) { const u = (k + i / 4) % 1; p.circle(lerp(450, 690, u), lerp(370, 385, u) + Math.sin(u * 6) * 10, 9, { fill: '#e2a65a', stroke: INK, width: 2, opacity: im }); }
    arrow(p, 450, 400, 650, 400, im, '#fff', 4);
    label(p, '中のタンパク質の大部分は 核の遺伝子の産物', 640, 600, 28, { align: 'center', fill: '#ffcf8a', a: im * (1 - rc.u('mat', 0.4)) });
  }
  const m = rc.u('mat', 0.5);
  if (m > 0) {
    // pedigree symbols only (no people drawn): an affected mother passes the mtDNA variant to all her children
    p.save(); p.alpha(m);
    p.rect(250, 560, 780, 150, { fill: 'rgba(8,10,14,0.92)', stroke: '#f4f0e4', width: 3 }, 12);
    p.circle(520, 600, 18, { fill: '#ff6b5b', stroke: '#fff', width: 3 }); p.rect(600, 582, 36, 36, { stroke: '#fff', width: 3 });
    p.line([[538, 600], [600, 600]], { stroke: '#fff', width: 3 }); p.line([[569, 600], [569, 640], [480, 640], [480, 652]], { stroke: '#fff', width: 3 }); p.line([[569, 640], [660, 640], [660, 652]], { stroke: '#fff', width: 3 }); p.line([[569, 640], [569, 652]], { stroke: '#fff', width: 3 });
    p.circle(480, 670, 16, { fill: '#ff6b5b', stroke: '#fff', width: 3 }); p.rect(553, 654, 32, 32, { fill: '#ff6b5b', stroke: '#fff', width: 3 }); p.circle(660, 670, 16, { fill: '#ff6b5b', stroke: '#fff', width: 3 });
    p.restore();
    term(p, '母系遺伝', 860, 630, m, 52, '#ff8a7a');
  }
}

export const FILM6_PLATE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  twins: streaks, 'twin-study': streaks, omics: nucleoplasm, chromatin: nucleoplasm, methylation: nucleoplasm, cpg: nucleoplasm,
  'epi-switch': nucleoplasm, charge: streaks, exercise: warmFluid, mtdna: warmFluid,
};
export const FILM6_FIGURE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  twins: twinsFig, 'twin-study': twinStudyFig, omics: omicsFig, chromatin: chromatinFig, methylation: methylFig, cpg: cpgFig,
  'epi-switch': switchFig, charge: chargeFig, exercise: exerciseFig, mtdna: mtdnaFig,
};
