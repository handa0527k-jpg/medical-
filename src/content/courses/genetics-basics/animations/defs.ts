// @ts-nocheck — imperative SVG drawing code; the public surface is typed via AnimDef below.
/**
 * Molecular animations for 遺伝子の基礎. Each rig builds its SVG scene once and
 * redraws it for normalised time t ∈ [0,1]:
 *   build(svg, mode) → state   frame(state, t, mode)   cam(t)   hud(t, mode)
 * Titles, step scripts and quizzes live in meta.json / scripts.json.
 * Everything drawn is taken from the lecture PDF; items that are not in the
 * PDF (ribosome, tRNA, reading-frame shift) are labelled 補足 in the scripts.
 */
import { E, L, CL, EZ, seg, kf, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const BASE = { A: '#ff8a65', T: '#ffd54f', G: '#4fc3f7', C: '#81e39a', U: '#d59cff' };
const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
const TXT = (par, x, y, s, fill, size = 18, extra = {}) => { const t = E('text', { x, y, fill, 'font-size': size, 'font-weight': 700, ...extra }, par); t.textContent = s; return t; };
const op = (el, v) => el.setAttribute('opacity', String(Math.max(0, Math.min(1, v))));
const fadeIn = (t, a, b) => CL((t - a) / (b - a));
const win = (t, a, b, f = 0.03) => Math.min(fadeIn(t, a, a + f), 1 - fadeIn(t, b - f, b));
const hexPts = (cx, cy, r, rot = 0) => Array.from({ length: 6 }, (_, i) => { const a = rot + (i * Math.PI) / 3; return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`; }).join(' ');
const pentPts = (cx, cy, r, rot = -Math.PI / 2) => Array.from({ length: 5 }, (_, i) => { const a = rot + (i * 2 * Math.PI) / 5; return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`; }).join(' ');

export const ANIM_DEFS: Record<string, AnimDef> = {
/* =====================================================================
 * helix — DNA二重らせん・塩基対・ホスホジエステル結合（スライド19–24）
 * ===================================================================== */
helix: {
  hud: (t) => t < 0.3 ? ['2 nm', 'WIDTH'] : t < 0.5 ? ["5'→3'", 'ANTIPARALLEL'] : t < 0.76 ? ['1.08 nm', 'BASE PAIR'] : ["3'–5'", 'PHOSPHODIESTER'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [0.28, 0, 0, 1200, 675], [0.5, 0, 0, 1200, 675], [0.56, 360, 150, 480, 270], [0.74, 360, 150, 480, 270], [0.8, 150, 40, 700, 394], [0.96, 150, 40, 700, 394], [1, 0, 0, 1200, 675]]),
  build(svg) {
    glowDefs(svg);
    const S = { n: 20, seq: 'ATGCGTACCATGGCTAAGTC', rungs: [], p1: null, p2: null };
    S.p2 = E('path', { fill: 'none', stroke: '#3fb6ff', 'stroke-width': 10, 'stroke-linecap': 'round' }, svg);
    for (let i = 0; i < S.n; i++) {
      const b = S.seq[i], c = COMP[b];
      const g = E('g', {}, svg);
      const a = E('line', { stroke: BASE[b], 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      const z = E('line', { stroke: BASE[c], 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
      const ta = TXT(g, 0, 0, b, '#0b0d14', 13, { 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      const tz = TXT(g, 0, 0, c, '#0b0d14', 13, { 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      S.rungs.push({ g, a, z, ta, tz, b, c });
    }
    S.p1 = E('path', { fill: 'none', stroke: '#f5c542', 'stroke-width': 10, 'stroke-linecap': 'round' }, svg);
    // measurement labels (rotating helix)
    S.m = E('g', { opacity: 0 }, svg);
    E('path', { d: 'M1080 247 V427 M1070 247 H1090 M1070 427 H1090', stroke: '#fff', 'stroke-width': 2, fill: 'none' }, S.m);
    TXT(S.m, 1098, 344, '2 nm', '#fff', 20);
    E('path', { d: 'M150 500 H600 M150 490 V510 M600 490 V510', stroke: '#fff', 'stroke-width': 2, fill: 'none' }, S.m);
    TXT(S.m, 290, 540, '1回転 3.4 nm（約10塩基対）', '#fff', 20);
    // strand direction labels (ladder)
    S.dir = E('g', { opacity: 0 }, svg);
    TXT(S.dir, 110, 232, "5'", '#f5c542', 26); TXT(S.dir, 1070, 232, "3'", '#f5c542', 26);
    TXT(S.dir, 110, 460, "3'", '#3fb6ff', 26); TXT(S.dir, 1070, 460, "5'", '#3fb6ff', 26);
    E('path', { d: 'M420 190 H780 M760 180 L782 190 L760 200', stroke: '#f5c542', 'stroke-width': 3, fill: 'none' }, S.dir);
    E('path', { d: 'M780 500 H420 M440 490 L418 500 L440 510', stroke: '#3fb6ff', 'stroke-width': 3, fill: 'none' }, S.dir);
    TXT(S.dir, 520, 178, '5\'→3\'', '#f5c542', 20); TXT(S.dir, 520, 530, '逆向き（逆平行）', '#3fb6ff', 20);
    // base-pair detail (A=T, G≡C)
    S.bp = E('g', { opacity: 0 }, svg);
    const pair = (y, L1, R1, hb, lab) => {
      // purine = two rings (6+5), pyrimidine = one ring
      const pur = L1 === 'A' || L1 === 'G';
      const lx = 470, rx = 730;
      if (pur) { E('polygon', { points: hexPts(lx + 10, y, 26, Math.PI / 6), fill: 'none', stroke: BASE[L1], 'stroke-width': 4 }, S.bp); E('polygon', { points: pentPts(lx - 30, y, 20, Math.PI), fill: 'none', stroke: BASE[L1], 'stroke-width': 4 }, S.bp); }
      else E('polygon', { points: hexPts(lx + 10, y, 26, Math.PI / 6), fill: 'none', stroke: BASE[L1], 'stroke-width': 4 }, S.bp);
      const rpur = R1 === 'A' || R1 === 'G';
      if (rpur) { E('polygon', { points: hexPts(rx - 10, y, 26, Math.PI / 6), fill: 'none', stroke: BASE[R1], 'stroke-width': 4 }, S.bp); E('polygon', { points: pentPts(rx + 30, y, 20, 0), fill: 'none', stroke: BASE[R1], 'stroke-width': 4 }, S.bp); }
      else E('polygon', { points: hexPts(rx - 10, y, 26, Math.PI / 6), fill: 'none', stroke: BASE[R1], 'stroke-width': 4 }, S.bp);
      TXT(S.bp, lx + 10, y + 7, L1, BASE[L1], 22, { 'text-anchor': 'middle' }); TXT(S.bp, rx - 10, y + 7, R1, BASE[R1], 22, { 'text-anchor': 'middle' });
      for (let k = 0; k < hb; k++) { const yy = y - (hb - 1) * 9 + k * 18; E('line', { x1: lx + 40, y1: yy, x2: rx - 40, y2: yy, stroke: '#ff5a7a', 'stroke-width': 3, 'stroke-dasharray': '4 6' }, S.bp); }
      TXT(S.bp, 600, y - 34, lab, '#ff9db0', 17, { 'text-anchor': 'middle' });
    };
    pair(215, 'A', 'T', 2, 'A=T：水素結合2本');
    pair(335, 'G', 'C', 3, 'G≡C：水素結合3本');
    E('path', { d: 'M430 395 H770 M430 385 V405 M770 385 V405', stroke: '#fff', 'stroke-width': 2, fill: 'none' }, S.bp);
    TXT(S.bp, 600, 412, 'どちらも幅 1.08 nm（プリン＋ピリミジン）', '#fff', 15, { 'text-anchor': 'middle' });
    // backbone detail: sugar–phosphate, phosphodiester bond, growth 5'→3'
    S.bb = E('g', { opacity: 0 }, svg);
    S.nuc = [];
    for (let i = 0; i < 5; i++) {
      const x = 220 + i * 120, g = E('g', {}, S.bb);
      E('circle', { cx: x, cy: 150, r: 18, fill: 'rgba(245,197,66,.2)', stroke: '#f5c542', 'stroke-width': 3 }, g);
      TXT(g, x, 157, 'P', '#f5c542', 18, { 'text-anchor': 'middle' });
      E('polygon', { points: pentPts(x + 55, 190, 26), fill: 'rgba(255,255,255,.06)', stroke: '#fff', 'stroke-width': 3 }, g);
      E('line', { x1: x + 17, y1: 158, x2: x + 36, y2: 172, stroke: '#fff', 'stroke-width': 3 }, g);
      E('line', { x1: x + 55, y1: 216, x2: x + 55, y2: 262, stroke: '#aaa', 'stroke-width': 3 }, g);
      E('polygon', { points: hexPts(x + 55, 288, 24, Math.PI / 6), fill: 'none', stroke: BASE['ATGCA'[i]], 'stroke-width': 3 }, g);
      TXT(g, x + 55, 295, 'ATGCA'[i], BASE['ATGCA'[i]], 18, { 'text-anchor': 'middle' });
      const link = E('path', { d: `M${x + 76} 200 Q${x + 100} 180 ${x + 104} 158`, fill: 'none', stroke: '#ff5a7a', 'stroke-width': 4 }, g);
      S.nuc.push({ g, link });
    }
    TXT(S.bb, 238, 118, "5'末端", '#f5c542', 18);
    S.bbl = TXT(S.bb, 220, 370, "3'炭素 と 次の5'リン酸 ＝ ホスホジエステル結合", '#ff9db0', 20);
    TXT(S.bb, 560, 340, "5'→3' 方向へ伸びる →", '#f5c542', 18);
    return S;
  },
  frame(S, t) {
    const cx0 = 150, cx1 = 1050, cy = 337, n = S.n;
    const unwind = EZ(seg(t, 0.3, 0.46));
    const amp = L(90, 0, unwind), sep = L(0, 115, unwind);
    const ph = t < 0.46 ? t * 26 : 0.46 * 26;
    let d1 = '', d2 = '';
    for (let k = 0; k <= 90; k++) {
      const x = cx0 + ((cx1 - cx0) * k) / 90, a = (k / 90) * 4 * Math.PI + ph;
      const y1 = cy + Math.sin(a) * amp - sep, y2 = cy + Math.sin(a + Math.PI) * amp + sep;
      d1 += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y1.toFixed(1);
      d2 += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y2.toFixed(1);
    }
    S.p1.setAttribute('d', d1); S.p2.setAttribute('d', d2);
    S.rungs.forEach((r, i) => {
      const x = cx0 + ((cx1 - cx0) * (i + 0.5)) / n, a = ((i + 0.5) / n) * 4 * Math.PI + ph;
      const y1 = cy + Math.sin(a) * amp - sep, y2 = cy + Math.sin(a + Math.PI) * amp + sep, ym = (y1 + y2) / 2;
      r.a.setAttribute('x1', x); r.a.setAttribute('y1', y1); r.a.setAttribute('x2', x); r.a.setAttribute('y2', ym - 2);
      r.z.setAttribute('x1', x); r.z.setAttribute('y1', ym + 2); r.z.setAttribute('x2', x); r.z.setAttribute('y2', y2);
      const depth = unwind > 0.9 ? 1 : 0.35 + 0.65 * Math.abs(Math.cos(a));
      op(r.g, depth);
      const showL = unwind > 0.8 && Math.abs(y2 - y1) > 60;
      r.ta.setAttribute('x', x); r.ta.setAttribute('y', (y1 + ym) / 2); r.tz.setAttribute('x', x); r.tz.setAttribute('y', (ym + y2) / 2);
      op(r.ta, showL ? 1 : 0); op(r.tz, showL ? 1 : 0);
      if (t > 0.5 && t < 0.76) op(r.g, i === 8 || i === 9 ? 0.15 : 0.08);
      if (t >= 0.76) op(r.g, 0.12);
    });
    op(S.p1, t > 0.5 ? (t < 0.76 ? 0.1 : 0.15) : 1); op(S.p2, t > 0.5 ? (t < 0.76 ? 0.1 : 0.15) : 1);
    op(S.m, win(t, 0.08, 0.3));
    op(S.dir, win(t, 0.36, 0.52));
    op(S.bp, win(t, 0.53, 0.77));
    op(S.bb, fadeIn(t, 0.77, 0.81));
    // nucleotides join one by one, 5'→3'
    const grow = seg(t, 0.8, 0.95);
    S.nuc.forEach((nu, i) => { op(nu.g, CL(grow * 5 - i + 1)); op(nu.link, i < 4 ? CL(grow * 5 - i) : 0); });
  },
},

/* =====================================================================
 * pack — DNA → ヌクレオソーム → クロマチン → 染色体（スライド25, 38, 39）
 * ===================================================================== */
pack: {
  hud: (t) => t < 0.2 ? ['2 nm', 'DNA'] : t < 0.48 ? ['11 nm', 'NUCLEOSOME'] : t < 0.72 ? ['—', 'CHROMATIN'] : ['1400 nm', 'CHROMOSOME'],
  cam: (t) => kf(t, [[0, 480, 260, 240, 135], [0.18, 480, 260, 240, 135], [0.26, 380, 200, 510, 287], [0.46, 380, 200, 510, 287], [0.54, 200, 100, 800, 450], [0.7, 200, 100, 800, 450], [0.8, 0, 0, 1200, 675], [1, 0, 0, 1200, 675]]),
  build(svg) {
    glowDefs(svg);
    const S = {};
    // layer 1: naked double helix (2 nm)
    S.l1 = E('g', {}, svg);
    let a = '', b = '';
    for (let k = 0; k <= 60; k++) { const x = 470 + k * 4.4, ph = k * 0.35; a += (k ? 'L' : 'M') + x + ' ' + (327 + Math.sin(ph) * 12); b += (k ? 'L' : 'M') + x + ' ' + (327 - Math.sin(ph) * 12); }
    E('path', { d: a, stroke: '#f5c542', 'stroke-width': 3, fill: 'none' }, S.l1); E('path', { d: b, stroke: '#3fb6ff', 'stroke-width': 3, fill: 'none' }, S.l1);
    for (let k = 0; k < 30; k++) E('line', { x1: 472 + k * 8.8, y1: 320, x2: 472 + k * 8.8, y2: 334, stroke: '#ff8a65', 'stroke-width': 1.5, opacity: 0.7 }, S.l1);
    TXT(S.l1, 500, 300, 'DNA（直径 2 nm）', '#fff', 11);
    // layer 2: nucleosomes (histone octamer + ~140 bp wrap + spacer + H1)
    S.l2 = E('g', { opacity: 0 }, svg);
    S.oct = [];
    const colors = ['#5c7cfa', '#ff6b6b', '#ffd43b', '#69db7c'];
    const names = ['H2A', 'H2B', 'H3', 'H4'];
    for (let i = 0; i < 3; i++) {
      const cx = 450 + i * 130, cy = 320;
      const g = E('g', {}, S.l2);
      for (let k = 0; k < 8; k++) E('circle', { cx: cx + ((k % 4) - 1.5) * 11, cy: cy + (k < 4 ? -9 : 9), r: 10, fill: colors[k % 4], opacity: 0.85 }, g);
      S.oct.push({ g, cx, cy });
    }
    S.wrap = E('path', { fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }, S.l2);
    S.h1 = E('g', { opacity: 0 }, S.l2);
    for (let i = 0; i < 3; i++) E('circle', { cx: 450 + i * 130 + 38, cy: 350, r: 6, fill: '#e599f7' }, S.h1);
    S.l2t = E('g', { opacity: 0 }, S.l2);
    TXT(S.l2t, 400, 262, 'コアヒストン八量体（H2A・H2B・H3・H4 × 2）', '#fff', 11);
    TXT(S.l2t, 400, 392, 'DNA 約140塩基対が巻き付く ＝ ヌクレオソーム（11 nm）', '#ffd43b', 11);
    TXT(S.l2t, 516, 410, 'スペーサー 20–60塩基対・H1', '#e599f7', 10);
    names.forEach((nm, i) => TXT(S.l2t, 750 + i * 34, 280, nm, colors[i], 10));
    // layer 3: chromatin fibre and loops
    S.l3 = E('g', { opacity: 0 }, svg);
    let c = 'M220 360';
    for (let k = 0; k < 40; k++) { const x = 240 + k * 17; c += ` C${x - 6} ${300 + (k % 2) * 90} ${x + 6} ${300 + (k % 2) * 90} ${x + 12} 360`; }
    E('path', { d: c, fill: 'none', stroke: '#ffd43b', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.8 }, S.l3);
    for (let k = 0; k < 40; k++) E('circle', { cx: 246 + k * 17, cy: 330 + (k % 2) * 30, r: 7, fill: '#ff9f43', opacity: 0.8 }, S.l3);
    TXT(S.l3, 260, 470, '染色質（クロマチン）：ヌクレオソームがさらに折りたたまれる', '#fff', 17);
    // layer 4: metaphase chromosome
    S.l4 = E('g', { opacity: 0 }, svg);
    const arm = (x0, y0, x1, y1) => {
      let d = `M${x0} ${y0}`;
      for (let k = 1; k <= 24; k++) { const u = k / 24, x = L(x0, x1, u), y = L(y0, y1, u); d += ` Q${x + (k % 2 ? 22 : -22)} ${y - 6} ${x} ${y}`; }
      return d;
    };
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => E('path', { d: arm(600, 337, 600 + sx * 70, 337 + sy * 250), fill: 'none', stroke: '#ffd43b', 'stroke-width': 26, 'stroke-linecap': 'round', opacity: 0.85 }, S.l4));
    E('circle', { cx: 600, cy: 337, r: 18, fill: '#ff5a7a' }, S.l4);
    TXT(S.l4, 690, 320, '染色体（クロモゾーム）', '#fff', 24);
    TXT(S.l4, 690, 352, '幅 約 1400 nm', '#ffd43b', 20);
    TXT(S.l4, 690, 384, 'セントロメア', '#ff5a7a', 18);
    return S;
  },
  frame(S, t) {
    op(S.l1, 1 - fadeIn(t, 0.2, 0.28));
    op(S.l2, fadeIn(t, 0.2, 0.26) * (1 - fadeIn(t, 0.5, 0.56)));
    op(S.l3, fadeIn(t, 0.5, 0.56) * (1 - fadeIn(t, 0.72, 0.78)));
    op(S.l4, fadeIn(t, 0.74, 0.8));
    // DNA wraps around each octamer in turn (1.7 turns), leaving linker DNA
    const w = seg(t, 0.26, 0.42);
    let d = 'M380 350';
    S.oct.forEach((o, i) => {
      const u = CL(w * 3 - i);
      d += ` L${o.cx - 30} 350`;
      const turns = 1.7 * u * Math.PI * 2;
      for (let a = 0; a <= turns; a += 0.25) d += ` L${(o.cx + Math.cos(Math.PI / 2 + a) * 30).toFixed(1)} ${(o.cy + Math.sin(Math.PI / 2 + a) * 26 + a * 0.6).toFixed(1)}`;
      d += ` L${o.cx + 34} 350`;
    });
    d += ' L800 350';
    S.wrap.setAttribute('d', d);
    op(S.h1, fadeIn(t, 0.4, 0.44));
    op(S.l2t, fadeIn(t, 0.3, 0.34));
  },
},

/* =====================================================================
 * meiosis — 減数分裂と染色体不分離（スライド32–34）  modes: normal / nd1 / nd2
 * ===================================================================== */
meiosis: {
  hud: (t, m) => {
    if (t < 0.12) return ['2n', 'G1'];
    if (t < 0.28) return ['2n', 'DNA複製'];
    if (t < 0.55) return ['第1分裂', m === 'nd1' ? '不分離' : '相同染色体が分かれる'];
    if (t < 0.8) return ['第2分裂', m === 'nd2' ? '不分離' : '姉妹染色分体が分かれる'];
    return m === 'normal' ? ['n', '配偶子'] : ['n±1', '異数性'];
  },
  cam: () => [0, 0, 1200, 675],
  build(svg, mode) {
    glowDefs(svg);
    const S = { cells: {}, chr: [] };
    const cell = (k, x, y, r) => { const c = E('circle', { cx: x, cy: y, r, fill: 'rgba(143,214,255,.06)', stroke: '#8fd6ff', 'stroke-width': 3, opacity: 0 }, svg); S.cells[k] = { c, x, y, r }; };
    cell('P', 600, 150, 95);
    cell('A', 330, 360, 80); cell('B', 870, 360, 80);
    cell('a1', 160, 565, 62); cell('a2', 470, 565, 62); cell('b1', 730, 565, 62); cell('b2', 1040, 565, 62);
    // one homologous pair: paternal (blue) and maternal (red); each is two sister chromatids after replication
    const mk = (col) => { const g = E('g', {}, svg); const s1 = E('rect', { width: 15, height: 92, rx: 7, fill: col }, g); const s2 = E('rect', { width: 15, height: 92, rx: 7, fill: col }, g); const cen = E('circle', { r: 8, fill: '#fff' }, g); return { g, s1, s2, cen }; };
    S.pat = mk('#4dabf7'); S.mat = mk('#ff6b81');
    S.lab = TXT(svg, 600, 40, '', '#fff', 20, { 'text-anchor': 'middle' });
    S.cnt = [];
    ['a1', 'a2', 'b1', 'b2'].forEach((k) => S.cnt.push(TXT(svg, S.cells[k].x, S.cells[k].y + 88, '', '#fff', 15, { 'text-anchor': 'middle', opacity: 0 })));
    S.fert = E('g', { opacity: 0 }, svg);
    TXT(S.fert, 600, 660, '', '#ffd43b', 18, { 'text-anchor': 'middle' });
    S.spindle = E('g', { opacity: 0 }, svg);
    for (let i = -3; i <= 3; i++) E('path', { d: `M520 150 Q600 ${150 + i * 14} 680 150`, stroke: '#5c6b8a', 'stroke-width': 1.5, fill: 'none' }, S.spindle);
    return S;
  },
  frame(S, t, m) {
    const mode = m || 'normal';
    const C = S.cells;
    op(C.P.c, 1 - fadeIn(t, 0.46, 0.52) * 0.7);
    op(C.A.c, fadeIn(t, 0.4, 0.46) * (1 - fadeIn(t, 0.7, 0.76) * 0.7)); op(C.B.c, fadeIn(t, 0.4, 0.46) * (1 - fadeIn(t, 0.7, 0.76) * 0.7));
    ['a1', 'a2', 'b1', 'b2'].forEach((k) => op(C[k].c, fadeIn(t, 0.66, 0.72)));
    op(S.spindle, win(t, 0.28, 0.42));
    const rep = EZ(seg(t, 0.12, 0.26)); // sister chromatid appears
    const pair = EZ(seg(t, 0.28, 0.36)); // homologues pair at the plate
    const m1 = EZ(seg(t, 0.4, 0.52)); // meiosis I
    const m2 = EZ(seg(t, 0.62, 0.74)); // meiosis II
    // where each whole chromosome goes in meiosis I
    const patDest = C.A, matDest = mode === 'nd1' ? C.A : C.B;
    const place = (ch, x, y, split, splitTo) => {
      // split: 0 = sisters together, 1 = separated to splitTo positions
      const gap = 9;
      const [x1, y1] = splitTo ? [L(x - gap, splitTo[0][0], split), L(y, splitTo[0][1], split)] : [x - gap, y];
      const [x2, y2] = splitTo ? [L(x + gap, splitTo[1][0], split), L(y, splitTo[1][1], split)] : [x + gap, y];
      ch.s1.setAttribute('x', x1 - 7); ch.s1.setAttribute('y', y1 - 46);
      ch.s2.setAttribute('x', x2 - 7); ch.s2.setAttribute('y', y2 - 46);
      ch.cen.setAttribute('cx', (x1 + x2) / 2); ch.cen.setAttribute('cy', (y1 + y2) / 2);
      op(ch.cen, split < 0.5 ? 1 : 0);
    };
    let px, py, mx, my;
    // G1 / replication: side by side in the parent cell; then pairing at the plate
    px = L(555, 582, pair); py = 150; mx = L(645, 618, pair); my = 150;
    // meiosis I movement
    px = L(px, patDest.x - (mode === 'nd1' ? 20 : 0), m1); py = L(py, patDest.y, m1);
    mx = L(mx, matDest.x + (mode === 'nd1' ? 20 : 0), m1); my = L(my, matDest.y, m1);
    // meiosis II: sisters go to the two daughter gametes of their cell
    const kids = { A: [[C.a1.x, C.a1.y], [C.a2.x, C.a2.y]], B: [[C.b1.x, C.b1.y], [C.b2.x, C.b2.y]] };
    const patKids = kids.A.map(([x, y]) => [x - (mode === 'nd1' ? 16 : 0), y]);
    let matKids = mode === 'nd1' ? kids.A.map(([x, y]) => [x + 16, y]) : kids.B;
    if (mode === 'nd2') matKids = [[C.b1.x - 14, C.b1.y], [C.b1.x + 14, C.b1.y]]; // sisters fail to separate: both go to b1
    // sisters stay together until meiosis II; they are drawn apart (gap) after replication
    const sis = rep;
    [S.pat, S.mat].forEach((ch) => op(ch.s2, sis));
    place(S.pat, px, py, m2, t > 0.6 ? patKids : null);
    place(S.mat, mx, my, m2, t > 0.6 ? matKids : null);
    // gamete counts and fertilisation
    const counts = mode === 'normal' ? [1, 1, 1, 1] : mode === 'nd1' ? [2, 2, 0, 0] : [1, 1, 2, 0];
    S.cnt.forEach((c, i) => { c.textContent = `${counts[i]}本 → 受精で${counts[i] + 1}本` + (counts[i] + 1 === 3 ? '（トリソミー）' : counts[i] + 1 === 1 ? '（モノソミー）' : ''); op(c, fadeIn(t, 0.8, 0.85)); c.setAttribute('fill', counts[i] === 1 ? '#8fd6ff' : '#ffd43b'); });
    S.lab.textContent = t < 0.12 ? '体細胞と同じ2本（相同染色体：父由来・母由来）' : t < 0.28 ? 'DNA合成：各染色体が2本の姉妹染色分体になる' : t < 0.4 ? '相同染色体が対合する' : t < 0.55 ? (mode === 'nd1' ? '減数第1分裂で不分離：相同染色体が同じ細胞へ' : '減数第1分裂：相同染色体が分かれる') : t < 0.8 ? (mode === 'nd2' ? '減数第2分裂で不分離：姉妹染色分体が同じ細胞へ' : '減数第2分裂：姉妹染色分体が分かれる') : (mode === 'normal' ? '正常分離：どの配偶子も1本 → 受精で2本' : '卵子は減数第1分裂前期で長く停止 → 加齢で不分離が起こりやすい');

  },
},

/* =====================================================================
 * expr — 遺伝子の構造 → 転写 → スプライシング → 翻訳（スライド41, 45, 51, 54）
 * ===================================================================== */
expr: {
  hud: (t) => t < 0.1 ? ['DNA', 'GENE'] : t < 0.36 ? ['DNA→RNA', '転写'] : t < 0.55 ? ['pre→mRNA', 'スプライシング'] : t < 0.63 ? ['核→細胞質', 'EXPORT'] : t < 0.95 ? ['RNA→タンパク質', '翻訳'] : ['Met-Ala-Val', 'PROTEIN'],
  cam: (t) => kf(t, [[0, -60, -80, 1320, 742], [0.1, -60, -80, 1320, 742], [0.14, -20, -70, 1240, 698], [0.34, -20, -70, 1240, 698], [0.4, -60, -80, 1320, 742], [0.55, -60, -80, 1320, 742], [0.6, -60, -80, 1320, 742], [0.66, 100, 250, 1000, 563], [0.94, 200, 250, 1000, 563], [1, -60, -80, 1320, 742]]),
  build(svg) {
    glowDefs(svg);
    const S = {};
    // nucleus boundary
    S.nuc = E('path', { d: 'M0 500 H1200', stroke: '#8aa0c8', 'stroke-width': 4, 'stroke-dasharray': '26 10', fill: 'none' }, svg);
    TXT(svg, 20, 490, '核', '#8aa0c8', 18); TXT(svg, 20, 530, '細胞質', '#8aa0c8', 18);
    // gene on DNA: promoter | ex1 | in1 | ex2 | in2 | ex3 | polyA signal
    const y = 150;
    E('line', { x1: 60, y1: y, x2: 1140, y2: y, stroke: '#fff', 'stroke-width': 4 }, svg);
    S.segs = [
      { k: 'pro', x: 120, w: 140, c: '#ff922b', n: 'プロモーター' },
      { k: 'e1', x: 290, w: 120, c: '#22b8cf', n: 'エクソン1' },
      { k: 'i1', x: 410, w: 150, c: '#868e96', n: 'イントロン' },
      { k: 'e2', x: 560, w: 110, c: '#51cf66', n: 'エクソン2' },
      { k: 'i2', x: 670, w: 150, c: '#868e96', n: 'イントロン' },
      { k: 'e3', x: 820, w: 170, c: '#22b8cf', n: 'エクソン3' },
      { k: 'pa', x: 1010, w: 60, c: '#fcc419', n: 'poly(A)シグナル' },
    ];
    S.segs.forEach((s) => {
      if (s.k === 'pro') E('rect', { x: s.x, y: y - 22, width: s.w, height: 44, fill: 'none', stroke: s.c, 'stroke-width': 3, 'stroke-dasharray': '8 5' }, svg);
      else if (s.k[0] === 'i') E('line', { x1: s.x, y1: y, x2: s.x + s.w, y2: y, stroke: s.c, 'stroke-width': 6 }, svg);
      else if (s.k === 'pa') E('circle', { cx: s.x + 30, cy: y, r: 18, fill: 'none', stroke: s.c, 'stroke-width': 3 }, svg);
      else E('rect', { x: s.x, y: y - 22, width: s.w, height: 44, rx: 4, fill: s.c, opacity: 0.85 }, svg);
      TXT(svg, s.x + s.w / 2, y - 34, s.n, s.c, 15, { 'text-anchor': 'middle' });
    });
    TXT(svg, 300, y + 52, '開始コドン(ATG)', '#ff6b6b', 14); TXT(svg, 900, y + 52, '終止コドン', '#ff6b6b', 14);
    // RNA polymerase and growing pre-mRNA
    S.pol = E('g', { opacity: 0 }, svg);
    E('ellipse', { cx: 0, cy: 0, rx: 46, ry: 34, fill: 'rgba(177,151,252,.25)', stroke: '#b197fc', 'stroke-width': 3 }, S.pol);
    TXT(S.pol, 0, 5, 'RNAポリメラーゼ', '#e5dbff', 11, { 'text-anchor': 'middle' });
    S.pre = E('g', {}, svg);
    S.preSegs = S.segs.filter((s) => s.k !== 'pro' && s.k !== 'pa').map((s) => ({ s, el: E('rect', { y: 238, height: 16, rx: 3, fill: s.c, opacity: 0 }, S.pre) }));
    S.preLab = TXT(svg, 290, 282, '前駆体RNA（イントロンを含む）　文字：U C G A', '#fff', 16, { opacity: 0 });
    // splicing: introns lift off as loops
    S.loops = [0, 1].map(() => E('path', { fill: 'none', stroke: '#868e96', 'stroke-width': 6, opacity: 0 }, svg));
    S.mrna = E('g', { opacity: 0 }, svg);
    TXT(S.mrna, 250, 402, "5'UTR", '#22b8cf', 14); TXT(S.mrna, 700, 402, "3'UTR", '#22b8cf', 14);
    E('rect', { x: 250, y: 410, width: 90, height: 16, fill: '#22b8cf' }, S.mrna);
    E('rect', { x: 340, y: 410, width: 110, height: 16, fill: '#51cf66' }, S.mrna);
    E('rect', { x: 450, y: 410, width: 170, height: 16, fill: '#51cf66' }, S.mrna);
    E('rect', { x: 620, y: 410, width: 120, height: 16, fill: '#22b8cf' }, S.mrna);
    TXT(S.mrna, 748, 424, 'AAAAA', '#fcc419', 14);
    TXT(S.mrna, 250, 452, '成熟mRNA：エクソンだけがつながる', '#fff', 16);
    // translation (cytoplasm)
    S.tr = E('g', { opacity: 0 }, svg);
    const cod = [['A', 'U'], ['AUG', 'Met'], ['GCU', 'Ala'], ['GUU', 'Val'], ['UAG', '終了'], ['GC', '']];
    S.cod = []; let cx = 190;
    cod.forEach(([c, a], i) => {
      const w = c.length * 34 + 16;
      const box = E('rect', { x: cx, y: 560, width: w, height: 44, rx: 6, fill: i === 0 || i === 5 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.08)', stroke: i === 1 ? '#ff6b6b' : i === 4 ? '#ff6b6b' : '#5c6b8a', 'stroke-width': 2 }, S.tr);
      TXT(S.tr, cx + w / 2, 590, c.split('').join(' '), '#fff', 22, { 'text-anchor': 'middle' });
      S.cod.push({ x: cx + w / 2, a, box });
      cx += w + 8;
    });
    TXT(S.tr, 150, 590, "5'", '#fff', 18); TXT(S.tr, cx + 6, 590, "3'", '#fff', 18);
    TXT(S.tr, S.cod[1].x - 40, 630, '開始コドン', '#ff6b6b', 14); TXT(S.tr, S.cod[4].x - 40, 630, '終止コドン', '#ff6b6b', 14);
    S.rib = E('g', { opacity: 0 }, svg);
    E('ellipse', { cx: 0, cy: -8, rx: 70, ry: 30, fill: 'rgba(255,169,77,.18)', stroke: '#ffa94d', 'stroke-width': 3 }, S.rib);
    E('ellipse', { cx: 0, cy: 46, rx: 58, ry: 18, fill: 'rgba(255,169,77,.12)', stroke: '#ffa94d', 'stroke-width': 3 }, S.rib);
    TXT(S.rib, 0, -12, 'リボソーム（補足）', '#ffd8a8', 12, { 'text-anchor': 'middle' });
    S.aa = S.cod.slice(1, 4).map((c, i) => { const g = E('g', { opacity: 0 }, svg); E('circle', { r: 26, fill: ['#e64980', '#7950f2', '#12b886'][i], opacity: 0.9 }, g); TXT(g, 0, 6, c.a, '#fff', 16, { 'text-anchor': 'middle' }); return g; });
    S.bonds = [0, 1].map(() => E('line', { stroke: '#fff', 'stroke-width': 4, opacity: 0 }, svg));
    S.end = TXT(svg, 880, 480, '', '#ff6b6b', 20, { opacity: 0 });
    return S;
  },
  frame(S, t) {
    // transcription: polymerase binds the promoter, then runs to the poly(A) signal
    const bind = fadeIn(t, 0.1, 0.14), run = EZ(seg(t, 0.15, 0.34));
    const px = L(190, 1040, run);
    S.pol.setAttribute('transform', `translate(${px},${150})`);
    op(S.pol, bind * (1 - fadeIn(t, 0.35, 0.38)));
    S.preSegs.forEach(({ s, el }) => {
      const x0 = s.x, x1 = Math.min(s.x + s.w, px);
      el.setAttribute('x', x0); el.setAttribute('width', Math.max(0, x1 - x0));
      op(el, (px > x0 ? 1 : 0) * (1 - fadeIn(t, 0.44, 0.47)));
    });
    op(S.preLab, win(t, 0.18, 0.46));
    // splicing: introns bulge up and drop away
    const sp = seg(t, 0.38, 0.47);
    const ins = S.segs.filter((s) => s.k[0] === 'i');
    S.loops.forEach((lp, i) => {
      const s = ins[i], h = 90 * EZ(sp);
      lp.setAttribute('d', `M${s.x} 246 C${s.x} ${246 - h} ${s.x + s.w} ${246 - h} ${s.x + s.w} 246`);
      op(lp, win(t, 0.38, 0.5));
    });
    op(S.mrna, fadeIn(t, 0.46, 0.5));
    S.mrna.setAttribute('transform', `translate(0,${L(0, 150, EZ(seg(t, 0.55, 0.62)))})`);
    op(S.mrna, fadeIn(t, 0.46, 0.5) * (1 - fadeIn(t, 0.62, 0.66)));
    // translation: ribosome reads codon by codon from AUG to UAG
    op(S.tr, fadeIn(t, 0.62, 0.66));
    const k = seg(t, 0.68, 0.92) * 3.999; // 0..3 codon index after AUG
    const ci = Math.floor(k), fr = k - ci;
    const rx = L(S.cod[1 + ci].x, S.cod[Math.min(4, 2 + ci)].x, EZ(CL((fr - 0.6) / 0.4)));
    S.rib.setAttribute('transform', `translate(${t < 0.68 ? S.cod[1].x : rx},${574})`);
    op(S.rib, fadeIn(t, 0.66, 0.69) * (1 - fadeIn(t, 0.94, 0.97)));
    S.aa.forEach((g, i) => {
      const born = t >= 0.68 && k >= i;
      const chainX = 520 + i * 62 - (Math.min(3, Math.floor(k) + 1) - 1) * 0;
      g.setAttribute('transform', `translate(${t > 0.93 ? 600 + (i - 1) * 62 : S.cod[1 + i].x},${t > 0.93 ? 470 : 500})`);
      op(g, born ? 1 : 0);
      void chainX;
    });
    S.bonds.forEach((b, i) => {
      const on = k >= i + 1 || t > 0.93;
      const x1 = t > 0.93 ? 600 + (i - 1) * 62 : S.cod[1 + i].x, x2 = t > 0.93 ? 600 + i * 62 : S.cod[2 + i].x, y = t > 0.93 ? 470 : 500;
      b.setAttribute('x1', x1); b.setAttribute('x2', x2); b.setAttribute('y1', y); b.setAttribute('y2', y);
      op(b, on ? 1 : 0);
    });
    S.end.textContent = t > 0.93 ? 'Met – Ala – Val：終止コドンで合成終了' : '終止コドン（UAG）：対応するアミノ酸はない';
    op(S.end, fadeIn(t, 0.9, 0.93));
    S.cod.forEach((c, i) => c.box.setAttribute('stroke-width', t > 0.68 && Math.floor(k) + 1 === i ? 4 : 2));
  },
},

/* =====================================================================
 * mut — 置換（サイレント・ミスセンス・ナンセンス）と挿入・欠失（スライド55, 57）
 * ===================================================================== */
mut: {
  hud: (t) => t < 0.14 ? ['正常', 'DNA'] : t < 0.28 ? ['A→C', '置換'] : t < 0.44 ? ['Arg→Arg', 'サイレント'] : t < 0.62 ? ['別のアミノ酸', 'ミスセンス'] : t < 0.76 ? ['→終止', 'ナンセンス'] : ['±1', '挿入・欠失'],
  cam: () => [0, 0, 1200, 675],
  build(svg) {
    glowDefs(svg);
    const S = {};
    // base-pair ladder (slide 55): A-T, T-A, C-G, C-G, A-T, A-T → 5th pair A-T becomes C-G
    S.lad = E('g', {}, svg);
    const pairs = ['AT', 'TA', 'CG', 'CG', 'AT', 'AT'];
    S.p5 = [];
    pairs.forEach((p, i) => {
      const y = 120 + i * 50;
      E('line', { x1: 150, y1: y, x2: 250, y2: y, stroke: '#5c6b8a', 'stroke-width': 3 }, S.lad);
      const a = TXT(S.lad, 160, y + 7, p[0], BASE[p[0]], 22), b = TXT(S.lad, 220, y + 7, p[1], BASE[p[1]], 22);
      if (i === 4) S.p5 = [a, b];
    });
    E('line', { x1: 140, y1: 95, x2: 140, y2: 395, stroke: '#aab', 'stroke-width': 6 }, S.lad);
    E('line', { x1: 262, y1: 95, x2: 262, y2: 395, stroke: '#aab', 'stroke-width': 6 }, S.lad);
    S.ladL = TXT(S.lad, 140, 440, '正常', '#fff', 20);
    // codon panel
    S.panel = E('g', { opacity: 0 }, svg);
    S.title = TXT(S.panel, 360, 110, '', '#fff', 26);
    S.from = TXT(S.panel, 380, 220, '', '#fff', 48);
    S.arrow = TXT(S.panel, 590, 220, '→', '#fff', 44);
    S.to = TXT(S.panel, 680, 220, '', '#ff6b6b', 48);
    S.aaFrom = TXT(S.panel, 390, 300, '', '#ffd43b', 30);
    S.aaTo = TXT(S.panel, 690, 300, '', '#ffd43b', 30);
    S.note = TXT(S.panel, 360, 370, '', '#cfd8ff', 20);
    // frameshift panel (insertion / deletion)
    S.fs = E('g', { opacity: 0 }, svg);
    TXT(S.fs, 360, 470, '正常：', '#fff', 20);
    S.fsN = TXT(S.fs, 440, 470, 'AUG | GCU | GUU | UAG', '#fff', 26);
    TXT(S.fs, 360, 530, '1塩基挿入：', '#fff', 20);
    S.fsI = TXT(S.fs, 480, 530, 'AUG | CGC | UGU | UUA | G…', '#ffd43b', 26);
    TXT(S.fs, 360, 590, '1塩基欠失：', '#fff', 20);
    S.fsD = TXT(S.fs, 480, 590, 'AUG | CUG | UUU | AG…', '#ffd43b', 26);
    TXT(S.fs, 360, 640, '（補足）3の倍数でない挿入・欠失は、以降のコドンの読み枠がずれる', '#8fd6ff', 16);
    return S;
  },
  frame(S, t) {
    // substitution on the ladder
    const sub = t >= 0.16;
    S.p5[0].textContent = sub ? 'C' : 'A'; S.p5[1].textContent = sub ? 'G' : 'T';
    S.p5[0].setAttribute('fill', sub ? '#ff6b6b' : BASE.A); S.p5[1].setAttribute('fill', sub ? '#ff6b6b' : BASE.T);
    S.ladL.textContent = sub ? '置換：A-T → C-G' : '正常';
    op(S.lad, 1 - fadeIn(t, 0.76, 0.8) * 0.6);
    op(S.panel, fadeIn(t, 0.26, 0.3) * (1 - fadeIn(t, 0.76, 0.8)));
    const set = (title, a, b, x, y, note) => { S.title.textContent = title; S.from.textContent = a; S.to.textContent = b; S.aaFrom.textContent = x; S.aaTo.textContent = y; S.note.textContent = note; };
    if (t < 0.44) set('サイレント変異：アミノ酸は変わらない', 'CGA', 'AGA', 'Arg', 'Arg', 'コドンが変わっても、同じアミノ酸を指定する');
    else if (t < 0.53) set('ミスセンス変異（保存的置換）', 'GAC', 'GAA', 'Asp', 'Glu', '性質の似たアミノ酸へ（アスパラギン酸→グルタミン酸）');
    else if (t < 0.62) set('ミスセンス変異（非保存的置換）', 'CGA', 'GGA', 'Arg', 'Gly', '性質の異なるアミノ酸へ（アルギニン→グリシン）');
    else set('ナンセンス変異：終止コドンへ', 'CGA', 'UGA', 'Arg', '終止', 'ここでタンパク質の合成が止まる（短いタンパク質）');
    const flip = (a, b) => { const u = win(t, a, b, 0.02); S.to.setAttribute('opacity', String(0.25 + 0.75 * u)); };
    flip(0.3, 1);
    op(S.fs, fadeIn(t, 0.78, 0.82));
  },
},

/* =====================================================================
 * epi — DNAメチル化・ヒストン修飾・クロマチンリモデリング（スライド40, 72–74）
 * ===================================================================== */
epi: {
  hud: (t) => t < 0.12 ? ['ヌクレオソーム', 'CHROMATIN'] : t < 0.45 ? ['メチル化↑', '転写 OFF'] : t < 0.85 ? ['アセチル化↑', '転写 ON'] : ['脱アセチル化', '元に戻る'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [0.1, 0, 0, 1200, 675], [0.16, 100, 60, 1000, 563], [0.84, 100, 60, 1000, 563], [0.92, 0, 0, 1200, 675], [1, 0, 0, 1200, 675]]),
  build(svg) {
    glowDefs(svg);
    const S = { nuc: [], me: [], ac: [], tails: [] };
    S.dna = E('path', { fill: 'none', stroke: '#fff', 'stroke-width': 4 }, svg);
    for (let i = 0; i < 5; i++) {
      const g = E('g', {}, svg);
      E('ellipse', { cx: 0, cy: 0, rx: 46, ry: 36, fill: '#f6c343', opacity: 0.9 }, g);
      E('ellipse', { cx: 0, cy: 0, rx: 46, ry: 36, fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '30 12' }, g);
      const tail = E('path', { d: 'M-20 -34 C-30 -70 10 -80 0 -104', fill: 'none', stroke: '#4263eb', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      const tail2 = E('path', { d: 'M20 -34 C30 -66 -6 -76 16 -98', fill: 'none', stroke: '#4263eb', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      const me = E('polygon', { points: '-8,-96 8,-96 0,-82', fill: '#f783ac', opacity: 0 }, g);
      const ac = E('circle', { cx: 16, cy: -104, r: 9, fill: '#3bc9db', opacity: 0 }, g);
      const dm = E('polygon', { points: '-50,34 -36,34 -43,46', fill: '#f783ac', opacity: 0 }, g);
      S.nuc.push({ g, me, ac, dm, tail, tail2 });
    }
    S.lab = TXT(svg, 150, 130, '', '#fff', 24);
    S.sub = TXT(svg, 150, 164, '', '#cfd8ff', 17);
    S.state = TXT(svg, 850, 560, '', '#fff', 30);
    // transcription factor + HAT + RNA polymerase
    S.tf = E('g', { opacity: 0 }, svg);
    E('ellipse', { cx: 0, cy: 0, rx: 36, ry: 26, fill: '#212529', stroke: '#adb5bd', 'stroke-width': 2 }, S.tf);
    TXT(S.tf, 0, 5, '転写因子', '#fff', 12, { 'text-anchor': 'middle' });
    E('ellipse', { cx: 70, cy: -10, rx: 44, ry: 28, fill: 'rgba(255,135,135,.2)', stroke: '#ff8787', 'stroke-width': 2 }, S.tf);
    S.hatL = TXT(S.tf, 70, -6, 'HAT', '#ffc9c9', 13, { 'text-anchor': 'middle' });
    S.pol = E('g', { opacity: 0 }, svg);
    E('ellipse', { cx: 0, cy: 0, rx: 54, ry: 34, fill: 'rgba(177,151,252,.25)', stroke: '#b197fc', 'stroke-width': 3 }, S.pol);
    TXT(S.pol, 0, 5, 'RNAポリメラーゼ', '#e5dbff', 12, { 'text-anchor': 'middle' });
    S.rna = E('path', { fill: 'none', stroke: '#ff6b6b', 'stroke-width': 5, opacity: 0 }, svg);
    S.block = TXT(svg, 0, 0, '✕', '#ff6b6b', 40, { opacity: 0 });
    S.prom = E('rect', { width: 80, height: 14, fill: '#ff922b', opacity: 0 }, svg);
    return S;
  },
  frame(S, t) {
    const meth = EZ(seg(t, 0.14, 0.26)), cond = EZ(seg(t, 0.26, 0.4));
    const acet = EZ(seg(t, 0.5, 0.6)), loose = EZ(seg(t, 0.58, 0.7));
    const deac = EZ(seg(t, 0.86, 0.96));
    // spacing: condensed (heterochromatin) vs loose (euchromatin)
    const tight = Math.max(cond * (1 - loose), deac);
    const spacing = L(180, 104, tight), y = 380 + Math.sin(0) * 0;
    const x0 = 600 - spacing * 2;
    let d = `M100 ${y + 40}`;
    S.nuc.forEach((n, i) => {
      const x = x0 + i * spacing, yy = y + (tight > 0 ? Math.sin(i * 1.3) * 18 * tight : 0);
      n.g.setAttribute('transform', `translate(${x},${yy})`);
      d += ` L${x - 50} ${yy + 40} C${x - 60} ${yy - 50} ${x + 60} ${yy - 50} ${x + 50} ${yy + 40}`;
      op(n.me, CL(meth * 5 - i) * (1 - acet));
      op(n.dm, CL(meth * 5 - i) * (1 - loose));
      op(n.ac, CL(acet * 5 - i) * (1 - deac));
    });
    d += ` L1100 ${y + 40}`;
    S.dna.setAttribute('d', d);
    const on = t > 0.7 && t < 0.86;
    S.lab.textContent = t < 0.12 ? 'DNAはヒストンに巻き付いたヌクレオソームとして存在' : t < 0.45 ? 'DNA高メチル化（CpGのC）＋ヒストンのメチル化' : t < 0.86 ? 'ヒストンのアセチル化（HAT）' : 'ヒストン脱アセチル化酵素（HDAC）でアセチル基が外れる';
    S.sub.textContent = t < 0.12 ? 'このままではRNAポリメラーゼが結合しにくい' : t < 0.45 ? '→ クロマチンが凝集（ヘテロクロマチン）' : t < 0.86 ? '→ 塩基性が下がりDNAとの結合が弱まる → 緩む（ユークロマチン）' : '→ ヌクレオソーム構造に戻る（発現抑制）';
    S.state.textContent = t < 0.14 ? '' : t < 0.45 ? '転写 OFF' : t < 0.7 ? '' : t < 0.86 ? '転写 ON' : '転写 OFF';
    S.state.setAttribute('fill', on ? '#51cf66' : '#ff6b6b');
    op(S.tf, win(t, 0.46, 0.88));
    S.tf.setAttribute('transform', `translate(${L(1000, 820, EZ(seg(t, 0.46, 0.52)))},250)`);
    S.prom.setAttribute('x', 860); S.prom.setAttribute('y', y + 34); op(S.prom, fadeIn(t, 0.66, 0.7) * (1 - deac));
    op(S.pol, win(t, 0.68, 0.87));
    S.pol.setAttribute('transform', `translate(${L(1000, 900, EZ(seg(t, 0.68, 0.73)))},${y + 40})`);
    const r = seg(t, 0.73, 0.85);
    S.rna.setAttribute('d', `M900 ${y + 70} q30 ${40 * r} ${120 * r} ${60 * r}`); op(S.rna, r > 0 && t < 0.87 ? 1 : 0);
    S.block.setAttribute('x', 890); S.block.setAttribute('y', y - 10); op(S.block, win(t, 0.36, 0.46));
  },
},

/* =====================================================================
 * retro — レトロ転移と偽遺伝子（スライド62–66）
 * ===================================================================== */
retro: {
  hud: (t) => t < 0.2 ? ['DNA→RNA', '転写'] : t < 0.36 ? ['mRNA', 'プロセッシング'] : t < 0.62 ? ['RNA→DNA', '逆転写'] : t < 0.84 ? ['挿入', 'レトロ転移'] : ['イントロンなし', '偽遺伝子'],
  cam: () => [0, 0, 1200, 675],
  build(svg) {
    glowDefs(svg);
    const S = {};
    // chromosome A with the original gene
    TXT(svg, 60, 90, '元の遺伝子（染色体A）', '#fff', 18);
    E('line', { x1: 60, y1: 130, x2: 700, y2: 130, stroke: '#fff', 'stroke-width': 4 }, svg);
    E('rect', { x: 100, y: 112, width: 80, height: 36, fill: 'none', stroke: '#ff922b', 'stroke-width': 3, 'stroke-dasharray': '6 4' }, svg);
    TXT(svg, 104, 104, 'プロモーター', '#ff922b', 12);
    const ex = [[200, 80], [340, 70], [470, 110]];
    ex.forEach(([x, w]) => E('rect', { x, y: 112, width: w, height: 36, rx: 4, fill: '#51cf66' }, svg));
    [[280, 60], [410, 60]].forEach(([x, w]) => E('line', { x1: x, y1: 130, x2: x + w, y2: 130, stroke: '#868e96', 'stroke-width': 8 }, svg));
    TXT(svg, 290, 170, 'イントロン', '#adb5bd', 13); TXT(svg, 420, 170, 'イントロン', '#adb5bd', 13);
    // mRNA
    S.m = E('g', { opacity: 0 }, svg);
    E('rect', { x: 200, y: 240, width: 260, height: 18, fill: '#ff6b6b' }, S.m);
    TXT(S.m, 466, 256, 'AAAA', '#fcc419', 15);
    TXT(S.m, 200, 290, 'プロセッシングを受けたmRNA（イントロンなし）', '#ffc9c9', 16);
    // reverse transcription: DNA copy grows along the mRNA
    S.cd = E('rect', { x: 200, y: 262, height: 14, fill: '#4dabf7', opacity: 0 }, svg);
    S.rt = E('g', { opacity: 0 }, svg);
    E('ellipse', { cx: 0, cy: 0, rx: 40, ry: 24, fill: 'rgba(255,212,59,.2)', stroke: '#ffd43b', 'stroke-width': 2 }, S.rt);
    TXT(S.rt, 0, 4, '逆転写酵素', '#ffe066', 11, { 'text-anchor': 'middle' });
    S.rtl = TXT(svg, 200, 330, 'mRNAを鋳型にDNAコピーを合成（逆転写）', '#a5d8ff', 16, { opacity: 0 });
    // chromosome B receiving the copy
    TXT(svg, 60, 440, '別の場所（染色体B）', '#fff', 18);
    S.chrB = E('path', { stroke: '#fff', 'stroke-width': 4, fill: 'none' }, svg);
    S.ins = E('g', { opacity: 0 }, svg);
    E('rect', { x: 0, y: -18, width: 260, height: 36, rx: 4, fill: '#4dabf7' }, S.ins);
    TXT(S.ins, 264, 6, 'AAAA', '#fcc419', 14);
    S.insL = TXT(svg, 420, 560, '', '#a5d8ff', 18, { opacity: 0 });
    S.fin = E('g', { opacity: 0 }, svg);
    TXT(S.fin, 60, 620, 'プロセッシングを受けた偽遺伝子：イントロンを欠き、元の遺伝子と同じ染色体には挿入されない', '#ffd43b', 18);
    TXT(S.fin, 60, 650, 'LINE-1・Alu・SVA は今もこの「コピー＆ペースト」で増える（生殖系列での変異）', '#cfd8ff', 16);
    return S;
  },
  frame(S, t) {
    op(S.m, fadeIn(t, 0.14, 0.2) * (1 - fadeIn(t, 0.6, 0.66) * 0.7));
    const rt = seg(t, 0.38, 0.58);
    S.cd.setAttribute('width', 260 * rt); op(S.cd, rt > 0 ? 1 : 0);
    op(S.rt, win(t, 0.36, 0.6)); S.rt.setAttribute('transform', `translate(${200 + 260 * rt},${300})`);
    op(S.rtl, win(t, 0.36, 0.64));
    // chromosome B opens, the copy moves in
    const open = EZ(seg(t, 0.6, 0.7)), mv = EZ(seg(t, 0.64, 0.8));
    const gap = 280 * open;
    S.chrB.setAttribute('d', `M60 500 H${420} M${420 + gap} 500 H${900 + gap * 0.2}`);
    op(S.cd, rt > 0 ? 1 - mv : 0);
    S.ins.setAttribute('transform', `translate(${L(200, 430, mv)},${L(269, 500, mv)})`);
    op(S.ins, fadeIn(t, 0.62, 0.66));
    S.insL.textContent = t < 0.84 ? 'ゲノムに再挿入（レトロ転移）' : 'プロモーターもイントロンもない ⇒ 通常は発現しない';
    op(S.insL, fadeIn(t, 0.76, 0.8));
    op(S.fin, fadeIn(t, 0.86, 0.9));
  },
},
};
