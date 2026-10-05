/**
 * Scenes of the 完成版 (第5講まるごと「ゲノムの変異・多型と動く遺伝子」).
 *
 * Biology kept exact (and identical in every intensity), standard genetic code:
 *  - Substitution outcomes: nonsense CGA (Arg) → UGA (stop); missense GAC (Asp) → GAA (Glu) conservative,
 *    CGA (Arg) → GGA (Gly) non-conservative; silent CGA → AGA (both Arg); sense UGA (stop) → CGA (Arg).
 *    Arg has six codons (CGU CGC CGA CGG AGA AGG).
 *  - Frameshift: AUG GCU GUU CCA AAG (Met Ala Val Pro Lys) + one G after AUG → AUG GGC UGU UCC AAA (Met Gly Cys Ser Lys).
 *  - SNVs ≈ 3.47 million in Watson's genome, ≈ 10,000 change an amino acid (スライド56).
 *  - Ethanol —ADH→ acetaldehyde —ALDH→ acetate → CO2 + water. ALDH2 487 Glu → Lys (GAA → AAA): GG strong, AG weak, AA cannot drink.
 *  - Transposons: DNA type = cut & paste (inactive in humans today); retrotransposons = copy & paste, LINE-1 / Alu / SVA active.
 *    ≈45 % of the human genome. McClintock, maize, Nobel prize 1983 (aged 81).
 *  - Processed pseudogene: mRNA reverse-transcribed and re-inserted → no introns, no promoter (poly(A) kept).
 *  - Insertions: ≥65 hereditary disease cases (haemophilia, cystic fibrosis, Duchenne), prefer euchromatin.
 * No faces are drawn.
 */
import type { SceneDef } from './types';
import type { Pen } from './pen';
import { CHALK, INK } from './diagrams';
import { ease } from './gekiga';
import { CL, rnd, label, streaks, type RC } from './render-kit';
import { BASE, PAIR, between, nucleoplasm, term, warmFluid } from './render-film';
import { mchr } from './render-film3';

type P2 = [number, number];
const EXON = '#58c47a', INTRON = '#9a9a9a', PROMO = '#ffd84a', RNA = '#c38bff', TE = '#ff9a3a', RED = '#ff6a55';

/* ---------- shared parts ---------- */
function letter(p: Pen, s: string, x: number, y: number, o: { a?: number; hot?: number; size?: number } = {}) {
  const a = o.a ?? 1, hot = o.hot ?? 0, sz = o.size ?? 44;
  if (a <= 0) return;
  p.save(); p.alpha(a);
  p.rect(x - sz * 0.5, y - sz * 0.55, sz, sz * 1.1, { fill: hot > 0 ? `rgba(255,74,58,${0.35 * hot})` : 'rgba(10,12,16,0.75)', stroke: hot > 0 ? '#ff4a3a' : '#6a7480', width: 3 }, 6);
  p.text(s, x, y, { size: sz * 0.62, font: 'gothic', weight: 900, fill: BASE[s] ?? '#fff', stroke: INK, strokeW: 4, align: 'center' });
  p.restore();
}
function dsDNA(p: Pen, x0: number, x1: number, y: number, a = 1, gap = 14) {
  p.line([[x0, y - gap / 2], [x1, y - gap / 2]], { stroke: '#d9e6f2', width: 5, opacity: a });
  p.line([[x0, y + gap / 2], [x1, y + gap / 2]], { stroke: '#8fa3b5', width: 5, opacity: a });
}
function box(p: Pen, x0: number, x1: number, y: number, h: number, col: string, a = 1) { if (x1 > x0) p.rect(x0, y - h / 2, x1 - x0, h, { fill: col, stroke: INK, width: 3, opacity: a }, 4); }
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
/** a codon written as three coloured letters; `hot` = index of the changed base */
function codon(p: Pen, s: string, x: number, y: number, size = 30, hot = -1, a = 1) {
  [...s].forEach((b, i) => {
    const xx = x + (i - 1) * size * 0.78;
    if (i === hot) p.rect(xx - size * 0.4, y - size * 0.6, size * 0.8, size * 1.2, { fill: 'rgba(255,74,58,0.35)', stroke: '#ff4a3a', width: 2, opacity: a }, 4);
    p.text(b, xx, y, { size, font: 'gothic', weight: 900, fill: BASE[b] ?? '#fff', stroke: INK, strokeW: size * 0.18, align: 'center', opacity: a });
  });
}
function ribosome(p: Pen, x: number, y: number, a = 1) {
  if (a <= 0) return;
  p.save(); p.alpha(a);
  p.ellipse(x, y - 44, 70, 44, 0, { fill: 'rgba(110,170,150,0.92)', stroke: INK, width: 5 });
  p.ellipse(x, y + 36, 56, 28, 0, { fill: 'rgba(90,150,130,0.92)', stroke: INK, width: 5 });
  p.restore();
}
function aaBead(p: Pen, x: number, y: number, s: string, k = 1, col = '#e2a65a') {
  if (k <= 0) return;
  p.circle(x, y, 28 * (0.6 + 0.4 * k), { fill: col, stroke: INK, width: 4, opacity: CL(k * 2) });
  p.text(s, x, y, { size: 17, font: 'gothic', weight: 900, fill: '#111', align: 'center', opacity: CL(k * 2) });
}
function element(p: Pen, x0: number, x1: number, y: number, a = 1, col = TE, h = 26) { box(p, x0, x1, y, h, col, a); }

/* ---------- 導入：置換・挿入・欠失・染色体異常 ---------- */
const SEQ = 'ATGCATGAA';
function mutTypesFig(rc: RC) {
  const { p } = rc;
  const x0 = 400, dx = 58;
  const rows: [string, number, string][] = [['置換', 150, 'sub'], ['挿入', 260, 'ins'], ['欠失', 370, 'del']];
  rows.forEach(([name, y, ev], r) => {
    const show = r === 0 ? rc.u('start', 0.4) : rc.u(ev, 0.35);
    if (show <= 0) return;
    const k = ease.outCubic(rc.u(ev, 0.6));
    label(p, name, 240, y, 40, { align: 'center', fill: k > 0 ? CHALK.y : '#fff', a: show });
    [...SEQ].forEach((b, i) => {
      let x = x0 + i * dx, s = b, a = show, hot = 0;
      if (r === 0 && i === 4) { hot = k; if (k > 0.5) s = 'G'; }
      if (r === 1 && i >= 4) x += dx * k;
      if (r === 2 && i === 4) { a *= 1 - k; hot = k; }
      if (r === 2 && i > 4) x -= dx * k;
      letter(p, s, x, y, { a, hot });
    });
    if (r === 1 && k > 0) letter(p, 'T', x0 + 4 * dx, y - 70 * (1 - k), { a: CL(k * 2), hot: 1 });
  });
  const c = rc.u('chr', 0.5);
  if (c > 0) {
    p.save(); p.alpha(c);
    mchr(p, 470, 470, 180, 0.3, { w: 22, seed: 4 });
    mchr(p, 640, 470, 120, 0.45, { w: 22, seed: 4 });
    p.rect(612, 590, 56, 50, { fill: 'rgba(0,0,0,0)', stroke: '#ff4a3a', width: 3, dash: [8, 6] }, 4);
    mchr(p, 820, 470, 180, 0.3, { w: 22, seed: 9 }); mchr(p, 880, 470, 180, 0.3, { w: 22, seed: 9 }); mchr(p, 940, 470, 180, 0.3, { w: 22, seed: 9 });
    p.restore();
    term(p, '染色体異常', 240, 560, c, 44, CHALK.y);
    label(p, '一部の欠失', 640, 670, 24, { align: 'center', fill: '#ff8a7a', a: c });
    label(p, '数の異常', 880, 690, 24, { align: 'center', fill: '#ff8a7a', a: c });
  }
}

/* ---------- テーマ1：置換の結果4通り ---------- */
function subOutcomesFig(rc: RC) {
  const { p } = rc;
  const y = 280, w = 270, h = 300;
  const cards: { x: number; ev: string; name: string; from: string; fa: string; to: string; ta: string; hot: number; col: string }[] = [
    { x: 190, ev: 'non', name: 'ナンセンス', from: 'CGA', fa: 'Arg', to: 'UGA', ta: '終止', hot: 0, col: RED },
    { x: 490, ev: 'mis', name: 'ミスセンス', from: 'GAC', fa: 'Asp', to: 'GAA', ta: 'Glu', hot: 2, col: '#ffb84a' },
    { x: 790, ev: 'sil', name: 'サイレント', from: 'CGA', fa: 'Arg', to: 'AGA', ta: 'Arg', hot: 0, col: '#9fe0a0' },
    { x: 1090, ev: 'sen', name: 'センス', from: 'UGA', fa: '終止', to: 'CGA', ta: 'Arg', hot: 0, col: '#9fd0ff' },
  ];
  const base = rc.u('start', 0.4);
  cards.forEach((c) => {
    const k = rc.u(c.ev, 0.35), a = base * (0.3 + 0.7 * k);
    card(p, c.x, y, w, h, a, k > 0 ? c.col : '#f4f0e4');
    label(p, c.name, c.x, y - 115, 32, { align: 'center', fill: c.col, a });
    if (k <= 0) return;
    p.save(); p.alpha(k);
    codon(p, c.from, c.x - 62, y - 40, 30);
    codon(p, c.to, c.x + 62, y - 40, 30, c.hot);
    arrow(p, c.x - 22, y - 40, c.x + 22, y - 40, 1, '#fff', 4);
    label(p, c.fa, c.x - 62, y + 10, 26, { align: 'center', fill: c.fa === '終止' ? RED : '#ffcf8a' });
    label(p, c.ta, c.x + 62, y + 10, 26, { align: 'center', fill: c.ta === '終止' ? RED : '#ffcf8a' });
    p.restore();
  });
  // missense: conservative / non-conservative
  const cs = rc.u('cons', 0.4);
  if (cs > 0) {
    label(p, '保存的：似た性質へ', 490, y + 60, 20, { align: 'center', fill: '#9fe0a0', a: cs });
    codon(p, 'CGA', 428, y + 100, 22, -1, cs); codon(p, 'GGA', 552, y + 100, 22, 0, cs);
    arrow(p, 470, y + 100, 506, y + 100, cs, '#fff', 3);
    label(p, 'Arg → Gly 非保存的', 490, y + 132, 20, { align: 'center', fill: '#ff8a7a', a: cs });
  }
  label(p, 'どちらもアルギニン', 790, y + 70, 22, { align: 'center', fill: '#9fe0a0', a: rc.u('arg', 0.3) });
  label(p, '向きが逆', 1090, y + 70, 22, { align: 'center', fill: '#9fd0ff', a: rc.u('sen+1', 0.3) });
  const tb = rc.u('table', 0.4);
  if (tb > 0) {
    p.rect(160, 480, 960, 110, { fill: 'rgba(250,244,230,0.94)', stroke: INK, width: 3, opacity: tb }, 10);
    p.text('アルギニン（Arg）のコドン', 640, 506, { size: 24, font: 'gothic', weight: 900, fill: '#222', align: 'center', opacity: tb });
    ['CGU', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'].forEach((s, i) => p.text(s, 290 + i * 140, 556, { size: 30, font: 'gothic', weight: 900, fill: i === 2 || i === 4 ? '#b3261e' : '#333', align: 'center', opacity: tb * CL(tb * 6 - i) }));
  }
  term(p, '1つのアミノ酸に複数のコドン', 640, 640, rc.u('why', 0.25), 40, CHALK.y);
}

/* ---------- テーマ1：コドンの変化 ---------- */
const TOP = 'GCTCAGGAC';
function codonChangeFig(rc: RC) {
  const { p } = rc;
  const x0 = 400, dx = 60, y = 200;
  const s = rc.u('sub', 0.5);
  const a0 = rc.u('start', 0.4);
  if (a0 > 0) {
    p.save(); p.alpha(a0);
    p.line([[x0 - 40, y - 52], [x0 + 8 * dx + 40, y - 52]], { stroke: '#d9e6f2', width: 6 });
    p.line([[x0 - 40, y + 52], [x0 + 8 * dx + 40, y + 52]], { stroke: '#8fa3b5', width: 6 });
    [...TOP].forEach((b0, i) => {
      const hot = i === 4 ? s : 0;
      const b = i === 4 && s > 0.5 ? 'C' : b0, c = PAIR[b];
      p.line([[x0 + i * dx, y - 30], [x0 + i * dx, y + 30]], { stroke: '#555', width: 3 });
      letter(p, b, x0 + i * dx, y - 26, { size: 40, hot });
      letter(p, c, x0 + i * dx, y + 26, { size: 40, hot });
    });
    label(p, '5番目', x0 + 4 * dx, y - 100, 24, { align: 'center', fill: CHALK.y, a: rc.u('norm', 0.3) });
    label(p, 'A–T → C–G', x0 + 4 * dx, y + 100, 26, { align: 'center', fill: RED, a: s });
    p.restore();
  }
  term(p, '置換', 1040, y, rc.u('subn', 0.25), 64, CHALK.y);
  // three codon cards
  const cards: [number, string, string, string, string, number, string, string, string][] = [
    [230, 'cga', 'CGA', 'AGA', 'Arg', 0, 'Arg', 'サイレント', 'arg'],
    [640, 'asp', 'GAC', 'GAA', 'Asp', 2, 'Glu', '保存的ミスセンス', 'cons'],
    [1050, 'gly', 'CGA', 'GGA', 'Arg', 0, 'Gly', '非保存的ミスセンス', 'gly'],
  ];
  const names: Record<string, string> = { Arg: 'アルギニン', Asp: 'アスパラギン酸', Glu: 'グルタミン酸', Gly: 'グリシン' };
  cards.forEach(([x, ev, from, to, fa, hot, ta, kind, kev]) => {
    const k = rc.u(ev, 0.4);
    if (k <= 0) return;
    card(p, x, 450, 360, 250, k);
    p.save(); p.alpha(k);
    const ch = ease.outCubic(rc.u(ev + '+0.6', 0.5));
    codon(p, from, x - 80, 380, 32);
    arrow(p, x - 30, 380, x + 30, 380, ch, '#fff', 4);
    codon(p, to, x + 80, 380, 32, hot, ch);
    label(p, names[fa], x - 80, 432, 22, { align: 'center', fill: '#ffcf8a' });
    label(p, names[ta], x + 80, 432, 22, { align: 'center', fill: ta === fa ? '#9fe0a0' : '#ffcf8a', a: ch });
    p.restore();
    const kk = rc.u(kev, 0.3);
    label(p, kind, x, 500, 28, { align: 'center', fill: hot === 2 ? '#9fe0a0' : ta === fa ? '#9fe0a0' : RED, a: kk });
    label(p, ta === fa ? '同じアミノ酸' : hot === 2 ? '似た性質へ' : '違う性質へ', x, 545, 22, { align: 'center', a: kk });
  });
}

/* ---------- テーマ1：ナンセンスと読み枠のずれ ---------- */
function frameshiftFig(rc: RC) {
  const { p } = rc;
  // top: translation stops at a new stop codon
  const y = 230, dx = 150, x0 = 260;
  const cods = ['AUG', 'GCU', 'CGA', 'GUU', 'CCA'], aas = ['Met', 'Ala', 'Arg', 'Val', 'Pro'];
  const stop = rc.u('stop', 0.4);
  const top = 1 - rc.u('ins', 0.4) * 0.7;
  p.save(); p.alpha(top);
  p.line([[x0 - 90, y], [x0 + 4 * dx + 90, y]], { stroke: RNA, width: 8 });
  const pos = Math.min(2, 2 * between(rc, 'start', 'stop', ease.inOut));
  const rx = x0 + pos * dx;
  ribosome(p, rx, y, 0.75);
  cods.forEach((c, i) => codon(p, i === 2 && stop > 0.5 ? 'UGA' : c, x0 + i * dx, y + 36, 28, i === 2 && stop > 0 ? 0 : -1));
  for (let i = 0; i <= Math.min(1, Math.floor(pos + 0.02)); i++) aaBead(p, rx - 30 - (Math.floor(pos) - i) * 58, y - 120, aas[i]);
  const n = rc.u('non', 0.3);
  if (n > 0) { label(p, '終止コドン → 合成が止まる', x0 + 2 * dx, y + 96, 26, { align: 'center', fill: RED, a: n }); }
  term(p, 'ナンセンス変異', 1000, 110, n, 44, RED);
  p.restore();
  // bottom: a 1-base insertion shifts the reading frame
  const k = rc.u('ins', 0.4);
  if (k > 0) {
    const yy = 450, sx = 300, w = 26;
    p.save(); p.alpha(k);
    const norm = 'AUGGCUGUUCCAAAG', mut = 'AUGGGCUGUUCCAAAG';
    const row = (s: string, y2: number, aa: string[], insAt: number, hotAa: number) => {
      [...s].forEach((b, i) => {
        if (i === insAt) p.rect(sx + i * w - 12, y2 - 18, 24, 36, { fill: 'rgba(255,74,58,0.4)', stroke: '#ff4a3a', width: 2 }, 3);
        p.text(b, sx + i * w, y2, { size: 26, font: 'gothic', weight: 900, fill: BASE[b], stroke: INK, strokeW: 4, align: 'center' });
      });
      for (let c = 0; c * 3 + 2 < s.length && c < 5; c++) {
        p.rect(sx + c * 3 * w - 13, y2 - 22, 3 * w, 44, { stroke: 'rgba(255,255,255,0.55)', width: 2 }, 4);
        label(p, aa[c], sx + (c * 3 + 1) * w, y2 + 44, 22, { align: 'center', fill: c >= hotAa ? RED : '#ffcf8a' });
      }
    };
    label(p, '正常', 200, yy - 40, 26, { align: 'center' });
    row(norm, yy - 40, ['Met', 'Ala', 'Val', 'Pro', 'Lys'], -1, 9);
    const sh = rc.u('shift', 0.5);
    label(p, '1塩基の挿入', 180, yy + 80, 26, { align: 'center', fill: CHALK.y });
    p.save(); p.alpha(0.4 + 0.6 * sh);
    row(mut, yy + 80, ['Met', 'Gly', 'Cys', 'Ser', 'Lys'], 3, sh > 0 ? 1 : 9);
    p.restore();
    label(p, '読み枠がずれる → その後のアミノ酸がすべて変わる', 760, yy + 180, 26, { align: 'center', fill: RED, a: sh });
    p.restore();
  }
  const sz = rc.u('size', 0.4);
  if (sz > 0) {
    card(p, 1080, 330, 300, 150, sz, CHALK.y);
    label(p, '置換：1つのコドン', 1080, 300, 22, { align: 'center', a: sz });
    label(p, '挿入・欠失：その後すべて', 1080, 350, 22, { align: 'center', fill: RED, a: sz });
  }
}

/* ---------- テーマ1：一塩基多型の数 ---------- */
function snpCountFig(rc: RC) {
  const { p, t } = rc;
  const x0 = 100, x1 = 1180, y = 300;
  label(p, '一人のゲノム', 640, 160, 34, { align: 'center', a: rc.u('start', 0.4) });
  p.rect(x0, y - 30, x1 - x0, 60, { fill: '#2c3440', stroke: '#8fa3b5', width: 3 }, 8);
  const s = rc.u('snp', 2.5);
  const N = 700;
  for (let i = 0; i < N * s; i++) { const x = x0 + 6 + rnd(i * 7 + 1) * (x1 - x0 - 12); p.line([[x, y - 26], [x, y + 26]], { stroke: `rgba(240,240,255,${0.35 + 0.4 * rnd(i)})`, width: 1.2 }); }
  label(p, '一塩基多型 約347万か所（ワトソン博士）', 640, 390, 30, { align: 'center', fill: '#fff', a: rc.u('snp', 0.4) });
  const a = rc.u('aa', 0.4);
  if (a > 0) {
    const xs = [500, 220, 340, 690, 820, 960, 1110, 610, 410, 1040];
    xs.forEach((x, i) => { const k = CL(a * 4 - i * 0.25); p.line([[x, y - 44], [x, y + 44]], { stroke: '#ff4a3a', width: 5, opacity: k }); p.circle(x, y - 52, 7 + 2 * Math.sin(t * 4 + i), { fill: '#ff4a3a', opacity: k }); });
    label(p, 'アミノ酸が変わる 約1万か所', 640, 450, 32, { align: 'center', fill: RED, a });
  }
  term(p, '大部分は個性＝多型', 640, 560, rc.u('poly', 0.25), 60, CHALK.y);
}

/* ---------- テーマ2：アルコールの代謝 ---------- */
function alcoholFig(rc: RC) {
  const { p, t } = rc;
  const y = 280;
  const mol = (x: number, name: string, col: string, a: number, pulse = 0) => {
    if (a <= 0) return;
    const r = 70 * (1 + 0.08 * pulse * Math.sin(t * 8));
    p.circle(x, y, r, { fill: col, stroke: INK, width: 5, opacity: a });
    label(p, name, x, y + 100, 26, { align: 'center', a });
  };
  const a0 = rc.u('start', 0.4), ad = rc.u('adh', 0.5), al = rc.u('aldh', 0.5);
  mol(160, 'アルコール', '#4a7ab8', a0);
  arrow(p, 240, y, 240 + 230 * ad, y, ad);
  label(p, 'ADH', 360, y - 40, 34, { align: 'center', fill: CHALK.y, a: ad });
  const ach = rc.u('ach', 0.3);
  mol(560, 'アセトアルデヒド', ach > 0 ? '#c0392b' : '#8a5a4a', ad, ach);
  arrow(p, 640, y, 640 + 230 * al, y, al);
  label(p, 'ALDH', 760, y - 40, 34, { align: 'center', fill: CHALK.y, a: al });
  mol(960, '酢酸', '#5a9a6a', al);
  const e = rc.u('aldh+1.2', 0.5);
  arrow(p, 1040, y, 1040 + 70 * e, y, e);
  label(p, '二酸化炭素', 1200, y - 18, 22, { align: 'center', a: e });
  label(p, 'と水', 1200, y + 16, 22, { align: 'center', a: e });
  if (ach > 0) {
    p.circle(560, y, 92 + 10 * Math.sin(t * 6), { stroke: '#ff4a3a', width: 5, opacity: ach * 0.8 });
    label(p, '毒性が強い', 560, y - 120, 30, { align: 'center', fill: RED, a: ach });
  }
  const tx = rc.u('tox', 0.4);
  if (tx > 0) { card(p, 560, 450, 520, 90, tx, '#ff4a3a'); label(p, '顔が赤くなる・気分が悪くなる原因', 560, 450, 28, { align: 'center', fill: '#ffb0a0', a: tx }); }
  const a2 = rc.u('adh2', 0.4);
  if (a2 > 0) { p.rect(300, y - 62, 120, 44, { stroke: CHALK.y, width: 3, opacity: a2 }, 8); label(p, 'ADH2：日本人でも遺伝子多型', 330, y - 165, 26, { align: 'center', fill: CHALK.y, a: a2 }); }
}

/* ---------- テーマ2：ALDH2 ---------- */
function aldh2Fig(rc: RC) {
  const { p } = rc;
  const y = 190;
  label(p, 'ALDH2', 140, 90, 36, { fill: CHALK.y, a: rc.u('start', 0.4) });
  const g = rc.u('glu', 0.5);
  for (let i = 0; i < 13; i++) {
    const x = 220 + i * 70;
    if (i === 6) continue;
    aaBead(p, x, y, '', CL(rc.u('start', 0.6) * 13 - i));
  }
  p.line([[200, y], [1080, y]], { stroke: '#e2a65a', width: 4, opacity: 0.6 * rc.u('start', 0.4) });
  const hx = 220 + 6 * 70;
  const pos = rc.u('pos', 0.4);
  if (pos > 0) {
    p.circle(hx, y, 38, { fill: g > 0.5 ? '#5aa9ff' : '#e2a65a', stroke: g > 0 ? '#ff4a3a' : INK, width: 5, opacity: pos });
    p.text(g > 0.5 ? 'Lys' : 'Glu', hx, y, { size: 20, font: 'gothic', weight: 900, fill: '#111', align: 'center', opacity: pos });
    label(p, '487番目', hx, y - 70, 28, { align: 'center', fill: CHALK.y, a: pos });
  }
  if (g > 0) {
    label(p, 'グルタミン酸 → リシン', hx, y + 66, 28, { align: 'center', fill: RED, a: g });
    codon(p, 'GAA', hx + 230, y + 66, 24, -1, g); arrow(p, hx + 270, y + 66, hx + 310, y + 66, g, '#fff', 3); codon(p, 'AAA', hx + 350, y + 66, 24, 0, g);
  }
  label(p, 'ミスセンス変異', hx - 300, y + 66, 26, { align: 'center', fill: '#ffb84a', a: rc.u('mis', 0.3) });
  const types: [number, string, string, string, string][] = [[280, 'GG型', '強い', '#9fe0a0', 'gg'], [640, 'AG型', '弱い', '#ffd84a', 'ag'], [1000, 'AA型', '飲めない', RED, 'aa']];
  types.forEach(([x, n, s, col, ev]) => {
    const k = rc.u(ev, 0.35);
    if (k <= 0) return;
    card(p, x, 420, 280, 150, k, col);
    label(p, n, x, 390, 40, { align: 'center', fill: col, a: k });
    label(p, s, x, 450, 32, { align: 'center', a: k });
  });
  const b = rc.u('both', 0.4);
  if (b > 0) {
    card(p, 640, 590, 860, 80, b, '#ff4a3a');
    label(p, 'ALDHが弱く ADHが強い → アセトアルデヒドがすぐたまる', 640, 590, 26, { align: 'center', fill: '#ffb0a0', a: b });
  }
}

/* ---------- テーマ3：トランスポゾン ---------- */
function transposonFig(rc: RC) {
  const { p, t } = rc;
  const y = 240;
  dsDNA(p, 60, 1220, y, rc.u('start', 0.4), 22);
  label(p, 'ゲノム', 100, y - 50, 26, { a: rc.u('start', 0.4) });
  const j = between(rc, 'def', 'dna', ease.inOut);
  const ex = 300 + 550 * j, ey = y - Math.sin(Math.PI * j) * 140;
  if (j > 0 && j < 1) p.path(`M 360 ${y} Q 635 ${y - 280} 910 ${y}`, { stroke: TE, width: 3, dash: [10, 8], opacity: 0.6 });
  element(p, ex, ex + 120, ey, rc.u('start', 0.4), TE, 30);
  label(p, '位置を変える配列', 640, 296, 28, { align: 'center', fill: TE, a: rc.u('def', 0.3) });
  const d = rc.u('dna', 0.4), r = rc.u('rna', 0.4);
  if (d > 0) { card(p, 330, 360, 440, 90, d, TE); label(p, 'DNA型：DNAが直接動く', 330, 360, 28, { align: 'center', a: d }); }
  if (r > 0) { card(p, 950, 360, 500, 90, r, RNA); label(p, 'RNA型：転写 → 逆転写', 950, 345, 26, { align: 'center', a: r }); label(p, 'レトロポゾン', 950, 380, 24, { align: 'center', fill: '#d8b6ff', a: r }); }
  const m = rc.u('mc', 0.5);
  if (m > 0) {
    // a maize ear with variegated kernels (no person drawn)
    p.save(); p.alpha(m); p.translate(240, 540); p.rotate(-0.25);
    p.ellipse(0, 0, 46, 110, 0, { fill: '#e8c25a', stroke: INK, width: 4 });
    for (let i = 0; i < 70; i++) { const yy = -96 + (i % 14) * 14, xx = -30 + Math.floor(i / 14) * 15, inside = (xx * xx) / (44 * 44) + (yy * yy) / (106 * 106) < 0.9; if (inside) p.circle(xx, yy, 6, { fill: rnd(i * 5) > 0.62 ? '#6a2a7a' : rnd(i * 9) > 0.8 ? '#b0452a' : '#f2d36a', stroke: 'rgba(0,0,0,0.4)', width: 1 }); }
    p.path('M -40 90 C -70 130 -60 160 -30 170 M 40 90 C 70 130 60 160 30 170', { stroke: '#7aa84a', width: 8 });
    p.restore();
    label(p, 'マクリントック', 470, 500, 32, { align: 'center', fill: CHALK.y, a: m });
    label(p, 'トウモロコシのまだら模様', 470, 545, 24, { align: 'center', a: rc.u('corn', 0.3) });
    label(p, '1983年 ノーベル賞（81歳）', 470, 590, 26, { align: 'center', a: rc.u('corn+2', 0.3) });
  }
  const q = rc.u('p45', 0.6);
  if (q > 0) {
    const bx = 760, bw = 400, by = 540;
    p.rect(bx, by - 30, bw, 60, { fill: '#2c3440', stroke: '#8fa3b5', width: 3 }, 6);
    p.rect(bx, by - 30, bw * 0.45 * ease.outCubic(q), 60, { fill: TE, stroke: INK, width: 3 }, 6);
    label(p, 'ヒトゲノムの約45%', bx + bw / 2, by - 60, 30, { align: 'center', fill: TE, a: q });
    label(p, 'トランスポゾン関連', bx + bw / 2, by + 60, 24, { align: 'center', a: q });
  }
  void t;
}

/* ---------- テーマ3：カット&ペースト／コピー&ペースト ---------- */
function cutCopyFig(rc: RC) {
  const { p, t } = rc;
  const y = 330;
  // left: DNA type
  const dead = rc.u('dead', 0.6);
  p.save(); p.alpha(1 - 0.55 * dead);
  label(p, 'DNA型', 330, 120, 34, { align: 'center', fill: TE });
  label(p, 'カット&ペースト', 330, 170, 30, { align: 'center', a: rc.u('cut', 0.3) });
  dsDNA(p, 70, 590, y, 1, 18);
  const c = between(rc, 'cut', 'cut+2.2', ease.inOut);
  const lx = 150 + 270 * c, ly = y - Math.sin(Math.PI * c) * 110;
  if (c > 0 && c < 1) { p.rect(150, y - 18, 100, 36, { stroke: '#fff', width: 2, dash: [6, 5] }, 4); }
  element(p, lx, lx + 100, ly, 1, dead > 0 ? '#8a8a8a' : TE, 30);
  label(p, '数は増えない', 330, 430, 26, { align: 'center', a: rc.u('cut+2.2', 0.3) });
  p.restore();
  label(p, '今のヒトでは動かない', 330, 500, 30, { align: 'center', fill: '#cfcfcf', a: dead });
  // right: retrotransposon
  const a = rc.u('copy', 0.4);
  label(p, 'レトロトランスポゾン', 950, 120, 32, { align: 'center', fill: RNA, a: 0.3 + 0.7 * a });
  label(p, 'コピー&ペースト', 950, 170, 30, { align: 'center', a });
  dsDNA(p, 690, 1210, y, 0.3 + 0.7 * a, 18);
  element(p, 740, 840, y, 0.3 + 0.7 * a, RNA, 30);
  const k = between(rc, 'copy', 'more', ease.inOut);
  if (a > 0) {
    if (k > 0 && k < 1) { const cx = 740 + 300 * k, cy = y - Math.sin(Math.PI * k) * 120; p.line([[790, y - 20], [cx + 50, cy]], { stroke: RNA, width: 2, dash: [6, 6] }); element(p, cx, cx + 100, cy, 1, RNA, 30); }
    if (k >= 1) element(p, 1040, 1140, y, 1, RNA, 30);
    const m = rc.u('more', 0.6);
    if (m > 0) { element(p, 900, 980, y, m, RNA, 30); label(p, '数が増える', 950, 430, 28, { align: 'center', fill: '#d8b6ff', a: m }); }
  }
  const act = rc.u('act', 0.4);
  if (act > 0) {
    ['LINE-1', 'Alu', 'SVA'].forEach((s, i) => { const x = 800 + i * 150, gl = 0.6 + 0.4 * Math.sin(t * 5 + i); card(p, x, 540, 130, 60, act, '#ffd84a'); label(p, s, x, 540, 28, { align: 'center', fill: '#ffd84a', a: act * gl }); });
    label(p, '今も転移する活性を持つ', 950, 610, 26, { align: 'center', fill: CHALK.y, a: act });
  }
}

/* ---------- テーマ3：偽遺伝子2種 ---------- */
function pseudogeneFig(rc: RC) {
  const { p } = rc;
  const y = 330;
  label(p, '偽遺伝子は2種類', 640, 90, 34, { align: 'center', fill: CHALK.y, a: rc.u('two', 0.3) });
  // left: unprocessed
  const n = rc.u('non', 0.4), a0 = rc.u('start', 0.4);
  p.save(); p.alpha(a0);
  p.line([[70, y], [590, y]], { stroke: '#cfcfcf', width: 4 });
  box(p, 90, 150, y, 34, PROMO);
  ([[170, 250, 'e'], [250, 330, 'i'], [330, 410, 'e'], [410, 490, 'i'], [490, 570, 'e']] as const).forEach(([x0, x1, k]) => { if (k === 'i') p.line([[x0, y], [x1, y]], { stroke: INTRON, width: 6 }); else box(p, x0, x1, y, 44, n > 0 ? '#6f8f78' : EXON); });
  p.restore();
  if (n > 0) {
    p.line([[340, y - 50], [400, y + 50]], { stroke: '#ff4a3a', width: 10, opacity: n }); p.line([[400, y - 50], [340, y + 50]], { stroke: '#ff4a3a', width: 10, opacity: n });
    label(p, 'プロセッシングを受けない', 330, 200, 26, { align: 'center', a: n });
    label(p, '変異で働かなくなった 進化の名残', 330, 440, 24, { align: 'center', fill: '#ffcf8a', a: n });
  }
  // right: processed
  const pr = rc.u('pro', 0.4);
  if (pr > 0) {
    p.save(); p.alpha(pr);
    p.line([[690, y], [1210, y]], { stroke: '#cfcfcf', width: 4 });
    box(p, 800, 880, y, 44, EXON); box(p, 880, 960, y, 44, EXON); box(p, 960, 1040, y, 44, EXON);
    p.text('AAAA', 1080, y, { size: 22, font: 'gothic', weight: 900, fill: RNA, stroke: INK, strokeW: 4, align: 'center' });
    label(p, 'プロセッシングを受けた', 950, 200, 26, { align: 'center' });
    label(p, 'レトロ転移で生まれる', 950, 440, 24, { align: 'center', fill: '#d8b6ff' });
    p.restore();
  }
  const r = rc.u('rt', 0.4);
  if (r > 0) {
    ['mRNA', '逆転写', 'DNA', 'ゲノムへ'].forEach((s, i) => { const k = CL(r * 4 - i); label(p, s, 760 + i * 130, 520, 24, { align: 'center', fill: i === 1 ? CHALK.y : '#fff', a: k }); if (i) arrow(p, 760 + i * 130 - 92, 520, 760 + i * 130 - 50, 520, k, '#fff', 3); });
  }
  term(p, 'イントロンがない', 950, 600, rc.u('nointron', 0.25), 48, RED);
}

/* ---------- テーマ3：レトロ転移 ---------- */
function retroFig(rc: RC) {
  const { p, t } = rc;
  // row 1: the source gene
  const y1 = 130, a1 = rc.u('start', 0.4);
  p.save(); p.alpha(a1);
  p.line([[120, y1], [1160, y1]], { stroke: '#cfcfcf', width: 4 });
  box(p, 300, 380, y1, 34, PROMO);
  const G: [number, number, 'e' | 'i'][] = [[420, 520, 'e'], [520, 620, 'i'], [620, 720, 'e'], [720, 820, 'i'], [820, 920, 'e']];
  for (const [x0, x1, k] of G) { if (k === 'i') p.line([[x0, y1], [x1, y1]], { stroke: INTRON, width: 6 }); else box(p, x0, x1, y1, 44, EXON); }
  p.restore();
  const pa = rc.u('parts', 0.3);
  label(p, 'プロモーター', 340, y1 + 50, 22, { align: 'center', fill: PROMO, a: pa });
  label(p, 'エクソン', 470, y1 - 46, 22, { align: 'center', fill: '#9fe0a0', a: pa });
  label(p, 'イントロン', 570, y1 + 50, 22, { align: 'center', fill: '#bbb', a: pa });
  label(p, '元の遺伝子', 160, y1 - 40, 24, { a: rc.u('gene', 0.3) });
  // row 2: mature mRNA (exons only + poly(A))
  const y2 = 250, m = rc.u('mrna', 0.5);
  if (m > 0) {
    p.save(); p.alpha(m);
    arrow(p, 640, y1 + 34, 640, y2 - 30, 1, '#fff', 4);
    for (let i = 0; i < 3; i++) box(p, 520 + i * 100, 620 + i * 100, y2, 26, RNA);
    p.text('AAAA', 860, y2, { size: 22, font: 'gothic', weight: 900, fill: RNA, stroke: INK, strokeW: 4, align: 'center' });
    label(p, 'イントロンのないmRNA', 380, y2, 24, { align: 'center', fill: '#d8b6ff' });
    p.restore();
  }
  // row 3: reverse transcription along the mRNA template
  const y3 = 360, r = rc.u('rt', 0.4), rk = between(rc, 'rt', 'rev', ease.inOut);
  if (r > 0) {
    p.save(); p.alpha(r);
    for (let i = 0; i < 3; i++) box(p, 520 + i * 100, 620 + i * 100, y3 - 20, 20, RNA);
    const ex = 520 + 380 * rk;
    p.line([[520, y3 + 12], [ex, y3 + 12]], { stroke: '#d9e6f2', width: 8 });
    p.ellipse(ex, y3, 46, 36, 0, { fill: 'rgba(222,140,96,0.92)', stroke: INK, width: 4 });
    label(p, '逆転写酵素', 300, y3, 26, { align: 'center', fill: '#ffb88a' });
    p.restore();
  }
  const rv = rc.u('rev', 0.4);
  if (rv > 0) { label(p, 'RNA → DNA（逆向き）', 1010, y3 + 52, 26, { align: 'center', fill: CHALK.y, a: rv }); }
  // row 4: insertion into another chromosome
  const y4 = 480, i4 = rc.u('ins', 0.5);
  if (i4 > 0) {
    p.save(); p.alpha(i4);
    dsDNA(p, 120, 1160, y4, 1, 18);
    label(p, '別の染色体', 160, y4 - 40, 24);
    const drop = ease.outCubic(rc.u('ins', 0.8));
    for (let i = 0; i < 3; i++) box(p, 520 + i * 100, 620 + i * 100, y4 - 60 * (1 - drop), 30, EXON);
    p.restore();
  }
  const no = rc.u('none', 0.4);
  if (no > 0) { label(p, 'イントロンなし・プロモーターなし', 640, y4 + 60, 26, { align: 'center', fill: RED, a: no }); }
  label(p, 'ふつうは働かない', 1000, y4 - 50, 24, { align: 'center', fill: '#cfcfcf', a: rc.u('off', 0.3) });
  term(p, 'プロセッシングを受けた偽遺伝子', 640, 620, rc.u('pg', 0.25), 40, CHALK.y);
  void t;
}

/* ---------- テーマ3：挿入が起こすこと ---------- */
function insertionFig(rc: RC) {
  const { p, t } = rc;
  const y = 200;
  dsDNA(p, 60, 1220, y, rc.u('start', 0.4), 18);
  const e = rc.u('eff', 0.4), d = ease.outCubic(rc.u('eff', 0.5));
  const gap = 120 * d;
  box(p, 240, 400, y, 44, EXON); box(p, 520, 640, y, 44, EXON); box(p, 640 + gap, 760 + gap, y, 44, EXON); box(p, 880 + gap, 1000 + gap, y, 44, EXON);
  p.line([[400, y], [520, y]], { stroke: INTRON, width: 6 }); p.line([[760 + gap, y], [880 + gap, y]], { stroke: INTRON, width: 6 });
  label(p, '遺伝子', 620, y - 60, 26, { align: 'center', a: rc.u('start', 0.4) * (1 - e) });
  if (e > 0) {
    element(p, 640, 640 + gap, y - 160 * (1 - d), 1, TE, 40);
    p.line([[600, y - 40], [620, y - 10], [604, y + 14], [626, y + 40]], { stroke: '#ff4a3a', width: 5, opacity: d });
    label(p, '遺伝子が壊れる（挿入変異）', 640, y - 70, 28, { align: 'center', fill: RED, a: e });
    ['ゲノムの再編成', '発現の変化'].forEach((s, i) => label(p, s, 380 + i * 520, y + 80, 24, { align: 'center', fill: '#ffcf8a', a: rc.u('eff+' + (1 + i * 0.8).toFixed(1), 0.3) }));
  }
  term(p, '少なくとも65例', 640, 360, rc.u('n65', 0.25), 52, CHALK.y);
  const dz = rc.u('dz', 0.4);
  ['血友病', '嚢胞性線維症', 'デュシェンヌ型筋ジストロフィー'].forEach((s, i) => {
    const k = CL(dz * 3 - i);
    if (k <= 0) return;
    const x = [250, 560, 950][i], w = s.length * 26 + 40;
    card(p, x, 440, w, 56, k, '#ff8a7a');
    label(p, s, x, 440, 24, { align: 'center', a: k });
  });
  const eu = rc.u('eu', 0.5);
  if (eu > 0) {
    p.save(); p.alpha(eu);
    // euchromatin: loose, open fibre; heterochromatin: dense coil
    const pts: P2[] = []; for (let i = 0; i <= 60; i++) pts.push([300 + i * 8, 580 + Math.sin(i * 0.5 + t) * 22]);
    p.line(pts, { stroke: '#d9e6f2', width: 4 });
    for (let i = 0; i < 6; i++) p.circle(320 + i * 80, 580 + Math.sin(i * 4 + t) * 22, 10, { fill: '#9fb3c8', stroke: INK, width: 2 });
    for (let i = 0; i < 28; i++) p.circle(940 + Math.cos(i * 1.3) * (16 + i * 1.4), 580 + Math.sin(i * 1.3) * (14 + i * 0.9), 10, { fill: '#6b7a8a', stroke: INK, width: 2 });
    label(p, 'ユークロマチン（転写が活発）', 540, 650, 26, { align: 'center', fill: CHALK.y });
    label(p, 'ヘテロクロマチン', 950, 650, 24, { align: 'center', fill: '#aaa' });
    const dk = ease.outCubic(rc.u('eu', 0.9));
    element(p, 500, 580, 470 + 90 * dk, 1, TE, 24);
    p.restore();
  }
}

export const FILM5_PLATE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'mut-types': nucleoplasm, 'sub-outcomes': streaks, 'codon-change': nucleoplasm, frameshift: warmFluid, 'snp-count': streaks,
  alcohol: warmFluid, aldh2: warmFluid, transposon: nucleoplasm, 'cut-copy': nucleoplasm, pseudogene: streaks, retro: nucleoplasm, insertion: nucleoplasm,
};
export const FILM5_FIGURE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'mut-types': mutTypesFig, 'sub-outcomes': subOutcomesFig, 'codon-change': codonChangeFig, frameshift: frameshiftFig, 'snp-count': snpCountFig,
  alcohol: alcoholFig, aldh2: aldh2Fig, transposon: transposonFig, 'cut-copy': cutCopyFig, pseudogene: pseudogeneFig, retro: retroFig, insertion: insertionFig,
};
