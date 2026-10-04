// @ts-nocheck — imperative SVG drawing code; the public surface is typed via AnimDef below.
/**
 * euinit — 真核生物の転写開始：転写開始複合体とエンハンサー／サイレンサー
 * （スライド28, 29, 30, 32, 33, 34, 35）
 *
 *   0.00–0.05  細菌（σ因子だけ）と真核生物（多数の基本転写因子＋クロマチン）の比較（28）
 *   0.05–0.10  3種類のRNAポリメラーゼ（28）とポリメラーゼII→mRNA前駆体（29）
 *   0.10–0.20  プロモーターの地図：TATA（約−25）・CAAT・GC・遠くのエンハンサー／サイレンサー（33, 35）
 *   0.20–0.47  TFIID(TBP)→TFIIB→ポリメラーゼII＋TFIIF→TFIIE→TFIIH、DNAをほどきCTDをリン酸化（30, 32）
 *   0.47–0.58  伸長期へ：RNAが5'→3'に伸び、多くの基本転写因子は離れて再利用（30, 32）
 *   0.58–0.92  mode enh：活性化因子・ループ・介在因子・クロマチン修飾 → 転写効率↑（34）
 *              mode sil：サイレンサーに調節タンパク質が結合 → 転写効率↓（34, 35）
 *   0.92–1.00  まとめ（基礎的発現と＋／−）
 * Colours: non-template #f5c542, template #3fb6ff, RNA #ff7aa8; transcription runs left → right.
 */
import { E, L, CL, EZ, seg, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const NT = '#f5c542', TP = '#3fb6ff', RNA = '#ff7aa8';
const POLF = 'rgba(140,210,255,.2)', POLS = '#8fd6ff';
const C = { D: '#5fae7e', TBP: '#2f7a4f', B: '#9c6644', E: '#cfa15a', F: '#ff9f43', H: '#f4978e', MED: '#9d7fd0', ACT: '#5c7cfa', REM: '#2b8a3e', HME: '#f8e08e', NUC: '#a89f91', SILP: '#ff6b6b', ENH: '#74c0fc', SIL: '#ff8787', SIG: '#b197fc' };
const TXT = (par, x, y, s, fill, size = 18, extra = {}) => { const t = E('text', { x, y, fill, 'font-size': size, 'font-weight': 700, ...extra }, par); t.textContent = s; return t; };
const MID = { 'text-anchor': 'middle' };
const op = (el, v) => el.setAttribute('opacity', String(Math.max(0, Math.min(1, v))));
const fi = (t, a, b) => CL((t - a) / (b - a));
const win = (t, a, b, f = 0.012) => Math.min(fi(t, a, a + f), 1 - fi(t, b - f, b));
const tr = (el, x, y, s = 1) => el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})${s !== 1 ? ` scale(${s})` : ''}`);
const poly = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
const bump = (u) => (Math.abs(u) >= 1 ? 0 : (Math.cos(Math.PI * u) + 1) / 2);

/* ---- assembly scene geometry ---- */
const YT = 390, YB = 418, X0 = 70, X1 = 1120;
const XTATA = 590, XP1 = 700, XB0 = 760, RUN = 150;
const PX0 = 800; // Pol II centre when bound

/* ---- regulation scene geometry: one DNA curve, straight ↔ looped ---- */
const SL = 0.42; // s where the lower (promoter) arm starts
const curve = (s, u) => {
  let sx, sy, lx, ly;
  if (s >= SL) { sx = lx = 330 + ((s - SL) / (1 - SL)) * 800; sy = ly = 470; }
  else {
    sx = 40 + (s / SL) * 290; sy = 470;
    if (s <= 0.2) { lx = 900 - (s / 0.2) * 570; ly = 250; }
    else { const f = -Math.PI / 2 - (Math.PI * (s - 0.2)) / (SL - 0.2); lx = 330 + 110 * Math.cos(f); ly = 360 + 110 * Math.sin(f); }
  }
  return [L(sx, lx, u), L(sy, ly, u)];
};
const frameAt = (s, u) => {
  const a = curve(Math.max(0, s - 0.002), u), b = curve(Math.min(1, s + 0.002), u);
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
  const p = curve(s, u);
  return { p, t: [dx / n, dy / n], up: [dy / n, -dx / n], ang: (Math.atan2(dy, dx) * 180) / Math.PI };
};
const sOfX = (x) => SL + ((x - 330) / 800) * (1 - SL);
const S_ENH = 0.08, S_TATA0 = sOfX(600), S_TATA1 = sOfX(640);

/** small rounded factor blob with a centred label */
const blob = (par, rx, ry, fill, label, size = 16, dark = false) => {
  const g = E('g', {}, par);
  E('ellipse', { cx: 0, cy: 0, rx, ry, fill, stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1.5 }, g);
  if (label) TXT(g, 0, size * 0.36, label, dark ? '#0b0d14' : '#fff', size, MID);
  return g;
};

const def: AnimDef = {
  hud: (t, m) =>
    t < 0.05 ? ['σ ／ GTF', '比較'] :
    t < 0.1 ? ['I・II・III', 'RNAポリメラーゼ'] :
    t < 0.2 ? ['約 −25', 'TATAボックス'] :
    t < 0.29 ? ['TFIID → TFIIB', '集合'] :
    t < 0.36 ? ['転写開始複合体', '集合'] :
    t < 0.42 ? ['ATP', 'DNAをほどく'] :
    t < 0.47 ? ['Ser5-P', 'CTD'] :
    t < 0.58 ? ["5'→3'", '伸長期'] :
    t < 0.92 ? (m === 'sil' ? ['転写効率 ↓', 'サイレンサー'] : ['転写効率 ↑', 'エンハンサー']) :
    ['＋ ／ −', '転写調節'],
  cam: () => [0, 0, 1200, 675],

  build(svg, mode) {
    glowDefs(svg);
    const S = { mode };

    /* ============ A. comparison opener (slide 28) ============ */
    S.open = E('g', { opacity: 0, transform: 'translate(0,16)' }, svg);
    {
      const g = S.open;
      E('rect', { x: 50, y: 150, width: 520, height: 360, rx: 16, fill: 'rgba(255,255,255,.03)', stroke: '#5c6b8a', 'stroke-width': 2 }, g);
      TXT(g, 75, 190, '比較：細菌（原核生物）', '#cfd8ff', 22);
      E('line', { x1: 80, y1: 360, x2: 540, y2: 360, stroke: NT, 'stroke-width': 5 }, g);
      E('line', { x1: 80, y1: 378, x2: 540, y2: 378, stroke: TP, 'stroke-width': 5 }, g);
      E('ellipse', { cx: 330, cy: 352, rx: 100, ry: 62, fill: POLF, stroke: POLS, 'stroke-width': 3 }, g);
      TXT(g, 345, 404, 'RNAポリメラーゼ', '#e7f5ff', 17, MID);
      const sg = blob(g, 46, 24, C.SIG, 'σ因子', 17);
      tr(sg, 250, 296);
      TXT(g, 75, 448, 'コア酵素＋σ因子だけで', '#fff', 19);
      TXT(g, 75, 476, 'プロモーターから転写を始められる', '#fff', 19);

      E('rect', { x: 630, y: 150, width: 520, height: 360, rx: 16, fill: 'rgba(255,122,168,.04)', stroke: '#ff7aa8', 'stroke-width': 2 }, g);
      TXT(g, 655, 190, '真核生物（ヒト）', '#ffd6e4', 22);
      // DNA wrapped on nucleosomes
      [745, 1035].forEach((x) => E('circle', { cx: x, cy: 379, r: 26, fill: C.NUC, opacity: 0.85 }, g));
      E('path', { d: 'M660 372 H720 C700 330 790 330 770 372 H1010 C990 330 1080 330 1060 372 H1120', fill: 'none', stroke: NT, 'stroke-width': 4 }, g);
      E('path', { d: 'M660 386 H720 C700 430 790 430 770 386 H1010 C990 430 1080 430 1060 386 H1120', fill: 'none', stroke: TP, 'stroke-width': 4 }, g);
      TXT(g, 745, 445, 'ヌクレオソーム', '#d8d2c8', 16, MID);
      E('ellipse', { cx: 890, cy: 360, rx: 92, ry: 58, fill: POLF, stroke: POLS, 'stroke-width': 3 }, g);
      TXT(g, 890, 395, 'ポリメラーゼII', '#e7f5ff', 17, MID);
      [['D', C.D, 830, 300], ['B', C.B, 868, 288], ['E', C.E, 906, 284], ['F', C.F, 944, 290], ['H', C.H, 982, 302]].forEach(([l, c, x, y]) => tr(blob(g, 17, 17, c, l, 17), x, y));
      TXT(g, 905, 258, '転写基本因子（多数）', '#fff', 17, MID);
      TXT(g, 655, 476, '多数の転写基本因子が必要。さらに', '#fff', 19);
      TXT(g, 655, 502, 'ヌクレオソーム・クロマチンを相手にする', '#fff', 19);
      S.openR = g;
    }

    /* ============ A2. three RNA polymerases (slides 28, 29) ============ */
    S.tab = E('g', { opacity: 0 }, svg);
    {
      const g = S.tab;
      E('rect', { x: 90, y: 150, width: 1020, height: 44, rx: 8, fill: 'rgba(143,170,220,.25)' }, g);
      TXT(g, 115, 179, 'ポリメラーゼの種類', '#fff', 18); TXT(g, 420, 179, '転写される遺伝子（スライド28）', '#fff', 18);
      const rows = [
        ['RNAポリメラーゼ I', ['5.8S・18S・28S rRNA遺伝子'], 225],
        ['RNAポリメラーゼ II', ['タンパク質指令遺伝子すべて、snoRNA・miRNA・siRNA遺伝子、', 'ほとんどのsnRNA遺伝子'], 290],
        ['RNAポリメラーゼ III', ['tRNA・5S rRNA遺伝子、一部のsnRNA遺伝子と', '他の小分子RNA遺伝子'], 375],
      ];
      rows.forEach(([n, ls, y]) => {
        TXT(g, 115, y, n, n.endsWith(' II') ? '#ff9db0' : '#dfe6f5', 19);
        ls.forEach((l, i) => TXT(g, 420, y + i * 28, l, '#dfe6f5', 18));
      });
      S.tabHi = E('rect', { x: 100, y: 264, width: 1000, height: 70, rx: 10, fill: 'none', stroke: '#ff5a7a', 'stroke-width': 3 }, g);
      S.tabMsg = E('g', {}, g);
      TXT(S.tabMsg, 600, 465, 'ポリメラーゼII → mRNA前駆体を合成（スライド29）', RNA, 22, MID);
      TXT(S.tabMsg, 600, 497, 'ここから、ポリメラーゼIIの転写開始を追う', '#fff', 18, MID);
    }

    /* ============ B/C. promoter map + initiation complex (slides 30, 32, 33, 35) ============ */
    S.asm = E('g', { opacity: 0 }, svg);
    {
      const g = S.asm;
      S.hl = {}; // element highlights drawn along the (bending) DNA
      const els = [
        ['enh', 80, 170, C.ENH], ['gc', 280, 360, '#63e6be'], ['caat', 400, 475, '#ffa8a8'], ['tata', 560, 620, '#69db7c'],
      ];
      els.forEach(([k, a, b, c]) => { S.hl[k] = { a, b, el: E('path', { fill: 'none', stroke: c, 'stroke-width': 44, opacity: 0.28, 'stroke-linecap': 'butt' }, g) }; });
      S.dnT = E('path', { fill: 'none', stroke: NT, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
      S.dnB = E('path', { fill: 'none', stroke: TP, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
      // distance break between distal element and promoter
      E('rect', { x: 196, y: YT - 14, width: 44, height: YB - YT + 28, fill: '#0b0d14' }, g);
      E('path', { d: `M200 ${YB + 14} L214 ${YT - 14} M222 ${YB + 14} L236 ${YT - 14}`, stroke: '#dfe6f5', 'stroke-width': 3 }, g);
      // strand ends
      TXT(g, 40, YT + 6, "5'", NT, 20); TXT(g, 1128, YT + 6, "3'", NT, 20);
      TXT(g, 40, YB + 8, "3'", TP, 20); TXT(g, 1128, YB + 8, "5'", TP, 20);
      // labels below DNA
      S.mapLab = E('g', {}, g);
      const lab = (x, y, s, c, sz = 16) => TXT(S.mapLab, x, y, s, c, sz, MID);
      S.enhLab = E('g', {}, g);
      TXT(S.enhLab, 125, 452, 'エンハンサー／', C.ENH, 16, MID); TXT(S.enhLab, 125, 474, 'サイレンサー', C.SIL, 16, MID);
      S.distLab = E('g', {}, g);
      TXT(S.distLab, 218, 498, '数百〜数千bp', '#dfe6f5', 16, MID);
      TXT(S.distLab, 160, 524, '（遺伝子の上流にも下流にもありうる）', '#b8c2d8', 16, { 'text-anchor': 'start' }).setAttribute('x', 60);
      S.upLab = E('g', {}, g);
      TXT(S.upLab, 312, 452, 'GCボックス', '#63e6be', 16, MID); TXT(S.upLab, 312, 474, "5'-GGGCGG-3'", '#c3fae8', 16, MID);
      TXT(S.upLab, 446, 452, 'CAATボックス', '#ffa8a8', 16, MID); TXT(S.upLab, 446, 474, "5'-CCAAT-3'", '#ffe3e3', 16, MID);
      S.tataLab = E('g', {}, g);
      TXT(S.tataLab, XTATA, 452, 'TATAボックス', '#69db7c', 16, MID); TXT(S.tataLab, XTATA, 474, '約25塩基上流（−25）', '#d3f9d8', 16, MID);
      // +1 bent arrow
      S.p1 = E('g', {}, g);
      E('path', { d: `M${XP1} ${YB + 6} V${YB + 36} H${XP1 + 46}`, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, S.p1);
      E('path', { d: `M${XP1 + 38} ${YB + 29} L${XP1 + 48} ${YB + 36} L${XP1 + 38} ${YB + 43}`, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, S.p1);
      TXT(S.p1, XP1 + 56, YB + 42, '+1（転写開始点）', '#fff', 16);
      // brackets above DNA (map only)
      S.brk = E('g', {}, g);
      const br = (a, b, y, s, c) => { E('path', { d: `M${a} ${y + 10} V${y} H${b} V${y + 10}`, fill: 'none', stroke: c, 'stroke-width': 2 }, S.brk); TXT(S.brk, (a + b) / 2, y - 10, s, c, 16, MID); };
      br(70, 245, 350, '遠位調節要素', '#e599f7');
      br(275, 480, 350, '上流プロモーター要素', '#ffd8a8');
      br(545, 720, 350, 'プロモーター', '#ff8787');
      br(735, 1110, 350, '遺伝子（転写される領域）→', '#dfe6f5');
      S.mapNote = TXT(g, 60, 170, '', '#fff', 19);
      S.mapNote2 = TXT(g, 60, 198, '', '#cfd8ff', 17);
      S.mapNote3 = TXT(g, 60, 226, '', '#cfd8ff', 17);

      // roster of general transcription factors (slide 32 table)
      S.roster = E('g', {}, g);
      S.rows = [
        [C.D, 'TFIID', 'TBP：TATAボックスを識別／TAF：付近の配列を識別しTBPの結合を調節'],
        [C.B, 'TFIIB', 'プロモーターのBRE配列を識別し、ポリメラーゼを開始部位へ正しく配置'],
        [C.F, 'TFIIF', 'ポリメラーゼとTBP・TFIIBの結合を安定化、TFIIE・TFIIHの引き寄せを助ける'],
        [C.E, 'TFIIE', 'TFIIHを引き寄せ、調節する'],
        [C.H, 'TFIIH', 'DNAをほどく／CTDのSer5をリン酸化／ポリメラーゼをプロモーターから解離'],
      ].map(([c, n, s], i) => {
        const r = E('g', { opacity: 0 }, S.roster), y = 148 + i * 28;
        E('rect', { x: 40, y: y - 15, width: 16, height: 16, rx: 3, fill: c }, r);
        TXT(r, 64, y, n, c, 17); TXT(r, 128, y, s, '#e9edf7', 16);
        return r;
      });
      S.rosterTitle = TXT(g, 40, 120, '', '#fff', 16);

      S.bendNote = TXT(g, XTATA, 500, 'DNAの大きなゆがみ＝活性のあるプロモーターの目印', '#d3f9d8', 16, MID);

      // factors
      S.fB = E('g', { opacity: 0 }, g);
      E('rect', { x: -32, y: -7, width: 64, height: 14, fill: C.B }, S.fB);
      E('circle', { cx: -34, cy: 0, r: 19, fill: C.B, stroke: 'rgba(255,255,255,.5)' }, S.fB);
      E('circle', { cx: 34, cy: 0, r: 19, fill: C.B, stroke: 'rgba(255,255,255,.5)' }, S.fB);
      TXT(S.fB, 0, -16, 'TFIIB', '#f1d3bf', 16, MID);
      S.fD = E('g', { opacity: 0 }, g);
      E('rect', { x: -70, y: -24, width: 140, height: 44, rx: 20, fill: C.D, stroke: 'rgba(255,255,255,.55)', 'stroke-width': 1.5 }, S.fD);
      E('path', { d: 'M-56 20 A 34 18 0 0 0 12 20 Z', fill: C.TBP }, S.fD);
      TXT(S.fD, 24, 4, 'TFIID', '#fff', 17, MID);
      TXT(S.fD, -22, 36, 'TBP', '#d3f9d8', 16, { ...MID, stroke: '#0b0d14', 'stroke-width': 4, 'paint-order': 'stroke' });
      // Pol II with CTD and TFIIF
      S.pol = E('g', { opacity: 0 }, g);
      S.ctd = E('path', { d: 'M50 -60 C80 -100 100 -96 118 -122 S150 -146 170 -144', fill: 'none', stroke: POLS, 'stroke-width': 9, 'stroke-linecap': 'round' }, S.pol);
      TXT(S.pol, 178, -138, 'CTD', POLS, 17);
      S.ps = [[112, -112], [146, -138]].map(([x, y]) => { const pg = E('g', { opacity: 0 }, S.pol); E('circle', { cx: x, cy: y, r: 13, fill: '#ffd43b' }, pg); TXT(pg, x, y + 6, 'P', '#0b0d14', 16, MID); return pg; });
      S.ser5 = TXT(S.pol, 70, -168, 'Ser5をリン酸化', '#ffe066', 16, { opacity: 0 });
      E('ellipse', { cx: 0, cy: 0, rx: 105, ry: 78, fill: POLF, stroke: POLS, 'stroke-width': 3 }, S.pol);
      E('path', { d: 'M-80 -8 C-40 -30 40 -30 92 -12', fill: 'none', stroke: 'rgba(143,214,255,.5)', 'stroke-width': 2 }, S.pol);
      TXT(S.pol, 0, 102, 'RNAポリメラーゼII', '#e7f5ff', 18, MID);
      S.fF = blob(S.pol, 30, 19, C.F, 'TFIIF', 15, true);
      tr(S.fF, 10, -84);
      S.fE = blob(g, 40, 18, C.E, 'TFIIE', 16, true); op(S.fE, 0);
      S.fH = blob(g, 42, 20, C.H, 'TFIIH', 16, true); op(S.fH, 0);
      S.atp = E('g', { opacity: 0 }, g);
      E('circle', { cx: 0, cy: 0, r: 22, fill: '#ffd43b' }, S.atp);
      TXT(S.atp, 0, 6, 'ATP', '#0b0d14', 15, MID);
      S.expo = TXT(g, 0, 0, '鋳型鎖が露出', TP, 16, MID); op(S.expo, 0);
      S.reuse = TXT(g, 300, 268, '多くの基本転写因子はDNAから離れ、次の転写開始に再利用', '#fff', 17, MID); op(S.reuse, 0);
      S.tfiidStay = TXT(g, XTATA, 500, 'TFIIDはTATAボックスに残る（スライド30の図）', '#d3f9d8', 16, MID); op(S.tfiidStay, 0);
      // RNA
      S.rna = E('path', { fill: 'none', stroke: RNA, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, g);
      S.r5 = TXT(g, 0, 0, "5'", RNA, 18, MID); S.r3 = TXT(g, 0, 0, "3'", RNA, 18, MID);
      S.rLab = TXT(g, 0, 0, 'RNA（A・U・G・C）', RNA, 16);
      S.readLab = TXT(g, 600, 532, "ポリメラーゼIIは鋳型鎖を3'→5'方向に読み、RNAを5'→3'方向に伸ばす →", '#fff', 17, MID);
      op(S.readLab, 0);
    }

    /* ============ D. regulation (slides 34, 35) ============ */
    S.reg = E('g', { opacity: 0 }, svg);
    {
      const g = S.reg, sil = mode === 'sil';
      S.rEl = E('path', { fill: 'none', stroke: sil ? C.SIL : C.ENH, 'stroke-width': 34, opacity: 0.32 }, g);
      S.rTata = E('path', { fill: 'none', stroke: '#69db7c', 'stroke-width': 34, opacity: 0.28 }, g);
      S.nucs = [960, 1060].map((x) => { const n = E('circle', { r: 27, fill: C.NUC, opacity: 0.9 }, g); return { n, x }; });
      S.rT = E('path', { fill: 'none', stroke: NT, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      S.rB = E('path', { fill: 'none', stroke: TP, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      S.rBreak = E('g', {}, g);
      E('rect', { x: 196, y: 452, width: 36, height: 36, fill: '#0b0d14' }, S.rBreak);
      E('path', { d: 'M198 488 L210 452 M216 488 L228 452', stroke: '#dfe6f5', 'stroke-width': 3 }, S.rBreak);
      TXT(S.rBreak, 214, 512, '数百〜数千bp', '#dfe6f5', 16, MID);
      S.rEnds = E('g', {}, g);
      TXT(S.rEnds, 1140, 466, "3'", NT, 18); TXT(S.rEnds, 1140, 490, "5'", TP, 18);
      S.rElLab = TXT(g, 0, 0, sil ? 'サイレンサー' : 'エンハンサー', sil ? C.SIL : C.ENH, 18, MID);
      S.rTataLab = TXT(g, 620, 506, 'TATA', '#69db7c', 16, MID);
      S.rP1 = TXT(g, 700, 506, '+1 →', '#fff', 16);
      S.nucLab = TXT(g, 1035, 524, 'ヌクレオソーム', '#d8d2c8', 16, MID);
      // basal complex: GTFs + Pol II
      S.cx = E('g', {}, g);
      E('ellipse', { cx: 760, cy: 470, rx: 86, ry: 56, fill: POLF, stroke: POLS, 'stroke-width': 3 }, S.cx);
      E('path', { d: 'M820 430 C850 400 870 410 890 390', fill: 'none', stroke: POLS, 'stroke-width': 7, 'stroke-linecap': 'round' }, S.cx);
      TXT(S.cx, 768, 512, 'ポリメラーゼII', '#e7f5ff', 16, MID);
      [['B', C.B, 585, 446], ['D', C.D, 622, 446], ['E', C.E, 640, 414], ['H', C.H, 678, 430], ['F', C.F, 735, 420]].forEach(([l, c, x, y]) => tr(blob(S.cx, 17, 17, c, l, 16, true), x, y));
      TXT(S.cx, 600, 512, '転写基本因子', '#fff', 16, MID);
      // mediator
      S.med = E('g', { opacity: 0 }, g);
      E('path', { d: 'M560 405 C560 318 880 318 880 405 L850 405 C848 352 592 352 590 405 Z', fill: C.MED, stroke: 'rgba(255,255,255,.5)', 'stroke-width': 1.5 }, S.med);
      TXT(S.med, 720, 348, '介在因子（mediator）', '#fff', 16, MID);
      // chromatin remodelling complex + histone modifying enzyme
      S.rem = E('g', { opacity: 0 }, g);
      E('path', { d: 'M-26 30 C-34 -10 -10 -34 18 -30 C34 -26 34 10 26 30 Z', fill: C.REM, stroke: 'rgba(255,255,255,.5)' }, S.rem);
      TXT(S.rem, 0, -44, 'クロマチン再構成複合体', '#b2f2bb', 16, MID);
      S.hme = E('g', { opacity: 0 }, g);
      E('rect', { x: -24, y: -26, width: 48, height: 52, rx: 12, fill: C.HME, stroke: 'rgba(255,255,255,.5)' }, S.hme);
      TXT(S.hme, 10, -66, 'ヒストン修飾酵素', '#fff3bf', 16, MID);
      // regulator protein (activator / silencer-binding protein) — drawn in local frame, contact at y=0
      S.act = E('g', { opacity: 0 }, g);
      if (!sil) {
        E('path', { d: 'M-8 0 V-16 H-30 C-30 -34 30 -34 30 -16 H8 V0 Z', fill: C.ACT }, S.act);
        E('ellipse', { cx: 0, cy: -38, rx: 16, ry: 12, fill: C.ACT }, S.act);
      } else {
        E('path', { d: 'M-28 0 V-22 C-28 -44 28 -44 28 -22 V0 Z', fill: C.SILP }, S.act);
      }
      S.actLab = TXT(g, 0, 0, sil ? '調節タンパク質（補足）' : '転写活性化因子', sil ? '#ffc9c9' : '#bac8ff', 17, MID);
      // transcripts
      S.tx = Array.from({ length: 6 }, () => E('path', { fill: 'none', stroke: RNA, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, g));
      S.tx5 = TXT(g, 0, 0, "5'", RNA, 16, MID);
      S.txLab = TXT(g, 905, 548, 'RNA', RNA, 16);
      // step list
      S.list = (sil
        ? ['① サイレンサーに調節タンパク質が結合する（補足）', '② 転写効率が下がる（エンハンサーの逆）', '　 ＝ 遠くの配列が転写を抑える']
        : ['① 転写活性化因子がエンハンサー（特異的配列）に結合', '② DNAがループし、介在因子が活性化因子とポリメラーゼII・基本転写因子を結ぶ', '③ クロマチン再構成複合体・ヒストン修飾酵素がDNAを反応しやすい状態に', '④ 転写効率が上がる']
      ).map((s, i) => TXT(g, 40, 140 + i * 26, s, i === 3 || (sil && i === 1) ? (sil ? '#ffa8a8' : '#8ce99a') : '#e9edf7', 17, { opacity: 0 }));
      // meter
      S.meter = E('g', {}, g);
      TXT(S.meter, 960, 176, '転写効率', '#fff', 17);
      S.mVal = TXT(S.meter, 1160, 176, '', '#fff', 17, { 'text-anchor': 'end' });
      E('rect', { x: 960, y: 188, width: 200, height: 20, rx: 4, fill: 'rgba(255,255,255,.08)', stroke: '#5c6b8a' }, S.meter);
      S.mBar = E('rect', { x: 960, y: 188, height: 20, rx: 4, fill: '#adb5bd' }, S.meter);
      E('line', { x1: 1030, y1: 184, x2: 1030, y2: 212, stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '3 3' }, S.meter);
      TXT(S.meter, 1030, 230, '基礎的発現', '#cfd8ff', 16, MID);
    }

    /* ============ E. summary ============ */
    S.sum = E('g', { opacity: 0 }, svg);
    {
      const g = S.sum;
      E('rect', { x: 150, y: 150, width: 900, height: 360, rx: 16, fill: 'rgba(11,13,20,.92)', stroke: '#5c6b8a', 'stroke-width': 2 }, g);
      TXT(g, 600, 192, '転写効率を決めるもの（スライド34・35）', '#fff', 22, MID);
      const rows = [
        ['サイレンサー（−）', 0.15, '#ff6b6b', '遠くの配列：転写効率を下げる（エンハンサーの逆）'],
        ['基礎的発現', 0.4, '#adb5bd', 'プロモーター（TATA・GC・CAATなど）＋基本転写因子'],
        ['エンハンサー（＋）', 0.9, '#51cf66', '転写活性化因子＋介在因子 → ポリメラーゼIIを引きつける'],
      ];
      rows.forEach(([n, v, c, d], i) => {
        const y = 250 + i * 86;
        TXT(g, 190, y + 16, n, c, 19);
        E('rect', { x: 390, y, width: 300, height: 22, rx: 4, fill: 'rgba(255,255,255,.08)', stroke: '#5c6b8a' }, g);
        E('rect', { x: 390, y, width: 300 * v, height: 22, rx: 4, fill: c }, g);
        TXT(g, 190, y + 50, d, '#e9edf7', 17);
      });
    }
    return S;
  },

  frame(S, t, mode) {
    const sil = mode === 'sil';
    /* ---------- A ---------- */
    op(S.open, win(t, 0, 0.05, 0.008));
    op(S.tab, win(t, 0.05, 0.1, 0.008));
    op(S.tabHi, fi(t, 0.068, 0.075));
    op(S.tabMsg, fi(t, 0.08, 0.087));

    /* ---------- B/C ---------- */
    op(S.asm, win(t, 0.1, 0.585, 0.01));
    if (t > 0.09 && t < 0.6) {
      const bend = EZ(seg(t, 0.215, 0.24));
      const open = EZ(seg(t, 0.37, 0.405));
      const run = EZ(seg(t, 0.48, 0.57));
      const xb = XB0 + RUN * run;
      const dy = (x) => 16 * bend * Math.exp(-(((x - XTATA) / 34) ** 2));
      const bb = (x) => 16 * open * bump((x - xb) / 46);
      const top = [], bot = [];
      for (let x = X0; x <= X1; x += 5) { top.push([x, YT + dy(x) - bb(x)]); bot.push([x, YB + dy(x) + bb(x)]); }
      S.dnT.setAttribute('d', poly(top)); S.dnB.setAttribute('d', poly(bot));
      for (const k in S.hl) {
        const h = S.hl[k], pts = [];
        for (let x = h.a; x <= h.b; x += 5) pts.push([x, (YT + YB) / 2 + dy(x)]);
        h.el.setAttribute('d', poly(pts));
      }
      // map reveal
      op(S.hl.tata.el, 0.28 * fi(t, 0.105, 0.115));
      op(S.tataLab, fi(t, 0.105, 0.115) * (1 - fi(t, 0.47, 0.48)));
      op(S.p1, fi(t, 0.105, 0.115) * (1 - fi(t, 0.29, 0.3)));
      op(S.hl.gc.el, 0.28 * fi(t, 0.13, 0.14) * (1 - 0.6 * fi(t, 0.2, 0.21)));
      op(S.hl.caat.el, 0.28 * fi(t, 0.13, 0.14) * (1 - 0.6 * fi(t, 0.2, 0.21)));
      op(S.upLab, fi(t, 0.13, 0.14) * (1 - 0.6 * fi(t, 0.2, 0.21)));
      op(S.hl.enh.el, 0.28 * fi(t, 0.16, 0.17) * (1 - 0.6 * fi(t, 0.2, 0.21)));
      op(S.enhLab, fi(t, 0.16, 0.17) * (1 - 0.6 * fi(t, 0.2, 0.21)));
      op(S.distLab, fi(t, 0.16, 0.17) * (1 - fi(t, 0.2, 0.21)));
      op(S.brk, fi(t, 0.165, 0.175) * (1 - fi(t, 0.198, 0.205)));
      const notes = t < 0.13
        ? ['TATAボックス：転写開始点（+1）の約25塩基上流', '転写は左→右（非鋳型鎖の5\'→3\'の向き）。鋳型鎖は下の青い鎖', '']
        : t < 0.16
          ? ['上流プロモーター要素：CAATボックス・GCボックス', 'ここに結合したタンパク質がポリメラーゼIIの転写効率を高める（スライド33）', 'TATAからプロモーター近位要素までを「基礎的発現」の領域とする（スライド35）']
          : ['エンハンサー（＋）・サイレンサー（−）', '遺伝子から数百〜数千bp離れた上流（または下流）にある', '各細胞での調節的発現（転写調節）に関わる（スライド35）'];
      S.mapNote.textContent = notes[0]; S.mapNote2.textContent = notes[1]; S.mapNote3.textContent = notes[2];
      const nO = win(t, 0.105, 0.2, 0.008);
      op(S.mapNote, nO); op(S.mapNote2, nO); op(S.mapNote3, nO);

      // roster
      const rowsAt = [0.215, 0.255, 0.3, 0.325, 0.34];
      S.rows.forEach((r, i) => op(r, fi(t, rowsAt[i], rowsAt[i] + 0.008) * (1 - fi(t, 0.475, 0.485))));
      S.rosterTitle.textContent = '';

      // TFIID (with TBP) binds TATA and bends DNA
      const dIn = EZ(seg(t, 0.2, 0.215));
      tr(S.fD, 612, L(200, YT - 33 + 16 * bend * 0.85, dIn));
      op(S.fD, fi(t, 0.2, 0.205));
      op(S.bendNote, win(t, 0.235, 0.29));
      // TFIIB next to it
      const bIn = EZ(seg(t, 0.25, 0.265));
      tr(S.fB, L(380, 492, bIn), L(220, YT - 22, bIn));
      op(S.fB, fi(t, 0.25, 0.255) * (1 - 0.65 * fi(t, 0.5, 0.53)));
      if (t > 0.5) tr(S.fB, L(492, 330, EZ(seg(t, 0.5, 0.55))), L(YT - 22, 300, EZ(seg(t, 0.5, 0.55))));
      // Pol II + TFIIF arrive from the right
      const pIn = EZ(seg(t, 0.29, 0.315));
      const px = L(1320, PX0, pIn) + RUN * run;
      tr(S.pol, px, (YT + YB) / 2);
      op(S.pol, fi(t, 0.29, 0.296));
      op(S.fF, 1 - 0.65 * fi(t, 0.5, 0.53));
      if (t > 0.5) { const u = EZ(seg(t, 0.5, 0.55)); tr(S.fF, L(10, 520 - px, u), L(-84, 300 - (YT + YB) / 2, u)); } else tr(S.fF, 10, -84);
      // TFIIE, TFIIH
      const eIn = EZ(seg(t, 0.315, 0.33));
      const eu = EZ(seg(t, 0.5, 0.55));
      tr(S.fE, L(L(600, 600, eIn), 410, eu), L(L(150, YT - 78, eIn), 300, eu));
      op(S.fE, fi(t, 0.315, 0.32) * (1 - 0.65 * fi(t, 0.5, 0.53)));
      const hIn = EZ(seg(t, 0.33, 0.348));
      tr(S.fH, L(L(705, 705, hIn), 220, eu), L(L(150, YT - 38, hIn), 300, eu));
      op(S.fH, fi(t, 0.33, 0.335) * (1 - 0.65 * fi(t, 0.5, 0.53)));
      // ATP into TFIIH
      const aU = EZ(seg(t, 0.36, 0.375));
      tr(S.atp, L(840, 705, aU), L(250, YT - 66, aU));
      op(S.atp, win(t, 0.36, 0.385, 0.004));
      S.expo.setAttribute('x', XB0); S.expo.setAttribute('y', YB + 44);
      op(S.expo, win(t, 0.39, 0.48));
      // CTD phosphorylation
      S.ps.forEach((p, i) => op(p, fi(t, 0.425 + i * 0.012, 0.432 + i * 0.012)));
      op(S.ser5, win(t, 0.425, 0.5));
      // elongation: RNA
      const len = t < 0.47 ? 0 : 22 + (RUN + 60) * EZ(seg(t, 0.47, 0.57));
      const xa = xb + 22, yh = YB + 16 * open - 10;
      const path = [[xa, yh], [xb - 26, yh], [xb - 48, yh + 26], [xb - 62, yh + 58], [xb - 62 - 400, yh + 64]];
      const out = [path[0]];
      let rem = len, endP = path[0];
      for (let i = 1; i < path.length && rem > 0; i++) {
        const a = path[i - 1], b = path[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const f = Math.min(1, rem / d);
        endP = [L(a[0], b[0], f), L(a[1], b[1], f)];
        out.push(endP); rem -= d;
      }
      S.rna.setAttribute('d', poly(out));
      const rO = len > 0 ? 1 : 0;
      op(S.rna, rO);
      S.r3.setAttribute('x', xa + 14); S.r3.setAttribute('y', yh + 30); op(S.r3, rO);
      S.r5.setAttribute('x', endP[0] - 16); S.r5.setAttribute('y', endP[1] + 6); op(S.r5, len > 60 ? 1 : 0);
      S.rLab.setAttribute('x', endP[0] + 6); S.rLab.setAttribute('y', endP[1] + 24); op(S.rLab, len > 120 ? 1 : 0);
      op(S.readLab, fi(t, 0.49, 0.5));
      S.readLab.setAttribute('y', 545);
      op(S.reuse, fi(t, 0.53, 0.545));
      op(S.tfiidStay, 0);
    }

    /* ---------- D ---------- */
    op(S.reg, win(t, 0.585, 0.925, 0.012));
    if (t > 0.57 && t < 0.94) {
      const loop = sil ? 0 : EZ(seg(t, 0.65, 0.7));
      const top = [], bot = [], N = 220;
      for (let i = 0; i <= N; i++) {
        const f = frameAt(i / N, loop);
        top.push([f.p[0] + f.up[0] * 7, f.p[1] + f.up[1] * 7]);
        bot.push([f.p[0] - f.up[0] * 7, f.p[1] - f.up[1] * 7]);
      }
      S.rT.setAttribute('d', poly(top)); S.rB.setAttribute('d', poly(bot));
      const sub = (a, b) => { const p = []; for (let s = a; s <= b + 1e-6; s += 0.004) p.push(curve(s, loop)); return poly(p); };
      S.rEl.setAttribute('d', sub(0.06, 0.1));
      S.rTata.setAttribute('d', sub(S_TATA0, S_TATA1));
      op(S.rBreak, 1 - fi(t, 0.65, 0.66));
      op(S.rEnds, 1);
      const fe = frameAt(S_ENH, loop);
      S.rElLab.setAttribute('x', fe.p[0] + fe.up[0] * (loop > 0.5 ? -34 : -40));
      S.rElLab.setAttribute('y', fe.p[1] + fe.up[1] * (loop > 0.5 ? -34 : -40) + 6);
      // regulator protein binding
      const bindT = sil ? [0.64, 0.68] : [0.61, 0.645];
      const bu = EZ(seg(t, bindT[0], bindT[1]));
      const lift = L(110, 7, bu);
      S.act.setAttribute('transform', `translate(${(fe.p[0] + fe.up[0] * lift).toFixed(1)},${(fe.p[1] + fe.up[1] * lift).toFixed(1)}) rotate(${fe.ang.toFixed(1)})`);
      op(S.act, fi(t, bindT[0], bindT[0] + 0.006));
      const lo = loop > 0.5 ? 1 : 0;
      S.actLab.setAttribute('x', Math.max(130, fe.p[0] + fe.up[0] * (lift + 52) + (lo ? 120 : 0)));
      S.actLab.setAttribute('y', fe.p[1] + fe.up[1] * (lift + 52) + (lo ? -32 : 6));
      if (loop > 0.5) { S.actLab.setAttribute('x', 760); S.actLab.setAttribute('y', 292); }
      op(S.actLab, fi(t, bindT[0], bindT[0] + 0.006) * (loop > 0 && loop < 1 ? 0 : 1));
      op(S.rTataLab, sil ? 0 : 1 - fi(t, 0.7, 0.71));
      op(S.rP1, sil ? 0 : 1 - fi(t, 0.7, 0.71));
      // basal complex / recruitment
      if (sil) { tr(S.cx, 0, 0); op(S.cx, 1); }
      else { const cu = EZ(seg(t, 0.7, 0.735)); tr(S.cx, 0, L(-200, 0, cu)); op(S.cx, fi(t, 0.7, 0.705)); }
      op(S.med, sil ? 0 : fi(t, 0.725, 0.745));
      tr(S.med, 0, sil ? 0 : L(-44, -14, EZ(seg(t, 0.725, 0.745))));
      // chromatin
      const ru = sil ? 0 : EZ(seg(t, 0.755, 0.775));
      tr(S.rem, L(1200, 962, ru), 410); op(S.rem, sil ? 0 : fi(t, 0.755, 0.76));
      tr(S.hme, L(1250, 1072, ru), 404); op(S.hme, sil ? 0 : fi(t, 0.755, 0.76));
      const loose = sil ? 0 : EZ(seg(t, 0.775, 0.8));
      S.nucs.forEach(({ n, x }, i) => { n.setAttribute('cx', x + 30 * loose * (i + 1) * 0.6); n.setAttribute('cy', 470); n.setAttribute('opacity', String(0.9 - 0.6 * loose)); });
      S.nucLab.textContent = loose > 0.5 ? '反応しやすい状態に' : 'ヌクレオソーム';
      // transcripts
      const births = sil ? [0.6, 0.64, 0.8] : [0.8, 0.818, 0.836, 0.854, 0.872];
      let newest = null;
      S.tx.forEach((p, i) => {
        const b = births[i];
        if (b === undefined || t < b) { op(p, 0); return; }
        const q = (t - b) / 0.03, grow = CL(q), drift = Math.max(0, q - 1);
        const ox = 838 + drift * 40, oy = 490 + drift * 6, ln = 70 * grow;
        p.setAttribute('d', `M${ox} ${oy} q${ln * 0.4} ${ln * 0.5} ${ln} ${ln * 0.35}`);
        op(p, (1 - CL(drift / 2.2)) * (sil && i === 2 ? 0.7 : 1));
        if (drift < 1.5) newest = [ox + ln, oy + ln * 0.35];
      });
      if (newest) { S.tx5.setAttribute('x', newest[0] + 12); S.tx5.setAttribute('y', newest[1] + 6); }
      op(S.tx5, newest ? 1 : 0);
      op(S.txLab, newest ? 1 : 0);
      // list
      const lt = sil ? [0.6, 0.68, 0.76] : [0.615, 0.7, 0.76, 0.8];
      S.list.forEach((el, i) => op(el, fi(t, lt[i], lt[i] + 0.008)));
      // meter
      const lvl = sil ? L(0.35, 0.1, EZ(seg(t, 0.7, 0.76))) : L(0.35, 0.9, EZ(seg(t, 0.8, 0.86)));
      S.mBar.setAttribute('width', 200 * lvl);
      S.mBar.setAttribute('fill', lvl > 0.4 ? '#51cf66' : lvl < 0.3 ? '#ff6b6b' : '#adb5bd');
      S.mVal.textContent = lvl > 0.45 ? '↑ 増強' : lvl < 0.25 ? '↓ 低下' : '基礎';
      S.mVal.setAttribute('fill', lvl > 0.45 ? '#8ce99a' : lvl < 0.25 ? '#ffa8a8' : '#cfd8ff');
    }

    /* ---------- E ---------- */
    op(S.sum, fi(t, 0.925, 0.94) * (1 - fi(t, 0.996, 1)));
  },
};

export default def;
