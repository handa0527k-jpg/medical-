// @ts-nocheck — imperative SVG drawing code; the public surface is typed via AnimDef below.
/**
 * lac — 大腸菌lacオペロンの負の調節・正の調節（スライド22–25）。
 * mode: 'glc' = グルコース（＋）ラクトース（−）, 'lac' = グルコース（−）ラクトース（＋）,
 *       'both' = グルコース（＋）ラクトース（＋）
 * Scene time t ∈ [0,1]:
 *   0.00 地図 → 0.06 転写単位 → 0.12 lacI→リプレッサー → 0.20 オペレーターに結合 → 0.31 ラクトース
 *   → 0.40 cAMP・CRP → 0.50 RNAポリメラーゼ → 0.58 転写 → 0.78 3つのタンパク質 → 0.86 ラクトース利用
 *   → 0.93 オペロンとレギュロン
 * 色：非鋳型鎖 黄、鋳型鎖 青、RNA ピンク（コース共通）。転写は左→右。
 */
import { E, L, CL, EZ, seg, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const C = {
  nt: '#f5c542', tp: '#3fb6ff', rna: '#ff7aa8', pol: '#7fdcff', rep: '#b197fc', crp: '#ff922b', camp: '#63e6be',
  glc: '#f1f3f5', gal: '#ffd8a8', pro: '#51cf66', term: '#ff6b6b', gene: '#dee2e6', txt: '#e9eef8', mute: '#9fb0cc',
  bgal: '#ff8787', perm: '#a9e34b', tac: '#adb5bd', ng: '#ff8787', ok: '#69db7c',
};
const TXT = (par, x, y, s, fill, size = 18, extra = {}) => { const t = E('text', { x, y, fill, 'font-size': size, 'font-weight': 700, ...extra }, par); t.textContent = s; return t; };
const MID = { 'text-anchor': 'middle' };
const op = (el, v) => el.setAttribute('opacity', String(Math.max(0, Math.min(1, v))));
const fadeIn = (t, a, b) => CL((t - a) / (b - a));
const win = (t, a, b, f = 0.015) => Math.min(fadeIn(t, a, a + f), 1 - fadeIn(t, b - f, b));
const at = (el, x, y, s = 1) => el.setAttribute('transform', `translate(${x},${y}) scale(${s})`);
const hexPts = (r) => Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
const lerp2 = (a, b, u) => [L(a[0], b[0], u), L(a[1], b[1], u)];

/** ラクトース = ガラクトース（丸）–グルコース（六角形） */
function lactose(par) {
  const g = E('g', {}, par);
  E('line', { x1: -13, y1: 0, x2: 13, y2: 0, stroke: '#fff', 'stroke-width': 3 }, g);
  E('circle', { cx: -14, cy: 0, r: 10, fill: C.gal }, g);
  E('polygon', { points: hexPts(11), transform: 'translate(14,0)', fill: C.glc }, g);
  return g;
}
let DEFS = null, PFX = '';
/** arrowhead marker in a fixed colour (one per colour) */
function head(col) {
  const id = 'lacArr' + PFX + col.replace('#', '');
  if (DEFS && !DEFS.querySelector('#' + id)) {
    const mk = E('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, DEFS);
    E('path', { d: 'M0 0 L10 5 L0 10 z', fill: col }, mk);
  }
  return `url(#${id})`;
}
function arrow(par, d, col, w = 3, extra = {}) {
  const m = head(col);
  const ex = { ...extra };
  if (ex['marker-start']) ex['marker-start'] = m;
  return E('path', { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'marker-end': m, ...ex }, par);
}

const DNA_T = 196, DNA_B = 214, POL_Y = 205;
const OPER = [500, 158], CRPS = [330, 158], REP_HOME = [170, 350], CRP_HOME = [405, 368];
const CAMP_PTS = [[352, 420], [392, 448], [436, 420], [470, 458], [352, 482], [420, 492]];

const lac: AnimDef = {
  hud(t, mode) {
    const lacOn = mode !== 'glc', glcOn = mode !== 'lac', can = lacOn && !glcOn;
    if (t < 0.06) return ['lac', 'オペロン'];
    if (t < 0.12) return ['lacZYA', '転写単位'];
    if (t < 0.2) return ['lacI', 'リプレッサー'];
    if (t < 0.31) return ['OFF', '負の調節'];
    if (t < 0.4) return lacOn ? ['解除', 'リプレッサーが外れる'] : ['OFF', 'リプレッサー結合'];
    if (t < 0.5) return glcOn ? ['cAMP 低', '正の調節'] : ['cAMP 高', '正の調節'];
    if (t < 0.58) return can ? ['結合', 'RNAポリメラーゼ'] : ['結合できない', 'RNAポリメラーゼ'];
    if (t < 0.78) return can ? ['ON', '転写'] : ['OFF', '転写'];
    if (t < 0.93) return can ? ['βgal あり', 'ラクトースを利用'] : ['βgal なし', '作られない'];
    return ['operon / regulon', '比較'];
  },
  cam: () => [0, 0, 1200, 675],
  build(svg, mode) {
    glowDefs(svg);
    DEFS = E('defs', {}, svg); PFX = String(mode || 'x');
    const S = {};
    // badge (top-left; the HUD lives top-right)
    const bd = E('g', {}, svg);
    E('rect', { x: 24, y: 48, width: 184, height: 34, rx: 17, fill: 'rgba(81,207,102,.14)', stroke: C.pro, 'stroke-width': 2 }, bd);
    TXT(bd, 116, 71, '細菌（原核生物）', '#b2f2bb', 17, MID);
    // legend
    const lg = E('g', {}, svg);
    [[C.nt, "非鋳型鎖"], [C.tp, '鋳型鎖'], [C.rna, 'mRNA']].forEach(([c, s], i) => {
      E('line', { x1: 30, y1: 112 + i * 24, x2: 62, y2: 112 + i * 24, stroke: c, 'stroke-width': 5 }, lg);
      TXT(lg, 72, 118 + i * 24, s, C.mute, 16);
    });

    /* ---------- DNA map ---------- */
    S.map = E('g', {}, svg);
    const m = S.map;
    const box = (x, w, col, dash = false, y = 184, h = 42) => E('rect', { x, y, width: w, height: h, rx: 4, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-width': 3, ...(dash ? { 'stroke-dasharray': '7 5' } : {}) }, m);
    box(60, 40, C.pro, true); box(104, 130, C.gene);
    box(290, 80, C.crp); box(375, 125, C.pro, true);
    S.opBox = box(460, 80, C.rep, false, 179, 52);
    box(560, 260, C.gene); box(830, 110, C.gene); box(950, 90, C.gene); box(1060, 40, C.term);
    E('line', { x1: 40, y1: DNA_T, x2: 1150, y2: DNA_T, stroke: C.nt, 'stroke-width': 5 }, m);
    E('line', { x1: 40, y1: DNA_B, x2: 1150, y2: DNA_B, stroke: C.tp, 'stroke-width': 5 }, m);
    TXT(m, 14, 202, "5'", C.nt, 17); TXT(m, 14, 224, "3'", C.tp, 17);
    TXT(m, 1158, 202, "3'", C.nt, 17); TXT(m, 1158, 224, "5'", C.tp, 17);
    const IT = { ...MID, 'font-style': 'italic' };
    TXT(m, 80, 252, 'P', C.pro, 18, MID); TXT(m, 169, 252, 'lacI', C.gene, 19, IT); TXT(m, 169, 276, '調節遺伝子', C.mute, 16, MID);
    TXT(m, 330, 252, 'CRP結合領域', C.crp, 16, MID);
    TXT(m, 412, 276, 'プロモーター', C.pro, 16, MID); TXT(m, 520, 276, 'オペレーター', C.rep, 16, MID);
    TXT(m, 690, 252, 'lacZ', C.gene, 20, IT); TXT(m, 885, 252, 'lacY', C.gene, 20, IT); TXT(m, 995, 252, 'lacA', C.gene, 20, IT);
    TXT(m, 1080, 252, 'T', C.term, 18, MID); TXT(m, 1080, 276, 'ターミネーター', C.term, 16, MID);

    /* ---------- overview overlay ---------- */
    S.ov = E('g', { opacity: 0 }, svg);
    arrow(S.ov, 'M380 300 H1096', C.ok, 4, { 'marker-start': 'url(#lacArr)' });
    TXT(S.ov, 600, 330, '転写単位：lacZ・lacY・lacA が1本のmRNAに写される', C.ok, 17);
    arrow(S.ov, 'M169 176 C 220 104, 440 104, 494 172', C.rep, 3, { 'stroke-dasharray': '8 6' });
    TXT(S.ov, 236, 104, 'lacIの産物がlacZYAの発現を調節する', C.rep, 16);

    /* ---------- medium panel ---------- */
    const lacOn = mode !== 'glc', glcOn = mode !== 'lac';
    const md = E('g', {}, svg);
    E('rect', { x: 24, y: 410, width: 262, height: 136, rx: 10, fill: 'rgba(255,255,255,.04)', stroke: '#33405a', 'stroke-width': 2 }, md);
    TXT(md, 40, 437, '培地の条件', C.mute, 16);
    E('polygon', { points: hexPts(12), transform: 'translate(56,470)', fill: C.glc }, md);
    TXT(md, 92, 476, 'グルコース', C.txt, 17);
    TXT(md, 256, 480, glcOn ? '＋' : '−', glcOn ? C.ok : C.ng, 28, MID);
    S.mLac = lactose(md); at(S.mLac, 56, 516);
    TXT(md, 92, 522, 'ラクトース', C.txt, 17);
    TXT(md, 256, 526, lacOn ? '＋' : '−', lacOn ? C.ok : C.ng, 28, MID);
    if (!lacOn) op(S.mLac, 0.25);

    /* ---------- lacI mRNA and repressor ---------- */
    S.iRna = E('path', { fill: 'none', stroke: C.rna, 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
    S.iRna5 = TXT(svg, 88, 306, "5'", C.rna, 16); S.iRna3 = TXT(svg, 0, 306, "3'", C.rna, 16);
    S.iArr = arrow(svg, `M169 312 V320`, C.rna, 3);
    S.rep = E('g', {}, svg);
    E('ellipse', { cx: 0, cy: 0, rx: 56, ry: 24, fill: 'rgba(177,151,252,.28)', stroke: C.rep, 'stroke-width': 3 }, S.rep);
    TXT(S.rep, 0, 6, 'リプレッサー', '#e5dbff', 16, MID);
    S.repLac = lactose(svg);

    /* ---------- CRP and cAMP ---------- */
    S.crpPool = E('g', {}, svg);
    TXT(S.crpPool, 330, 534, 'cAMP（◆）', C.camp, 16);
    E('rect', { x: 520, y: 370, width: 22, height: 130, rx: 4, fill: 'none', stroke: '#4c5a78', 'stroke-width': 2 }, S.crpPool);
    S.gauge = E('rect', { x: 523, width: 16, rx: 3, fill: C.camp }, S.crpPool);
    TXT(S.crpPool, 531, 524, 'cAMP濃度', C.camp, 16, MID);
    S.camp = CAMP_PTS.map(() => E('polygon', { points: '0,-11 10,0 0,11 -10,0', fill: C.camp }, svg));
    S.crp = E('g', {}, svg);
    E('ellipse', { cx: 0, cy: 0, rx: 40, ry: 22, fill: 'rgba(255,146,43,.28)', stroke: C.crp, 'stroke-width': 3 }, S.crp);
    TXT(S.crp, 0, 6, 'CRP', '#ffd8a8', 17, MID);
    S.crpLab = TXT(svg, 330, 124, 'cAMP–CRP', C.crp, 17, MID);

    /* ---------- RNA polymerase, mRNA ---------- */
    S.rnaP = E('path', { fill: 'none', stroke: C.rna, 'stroke-width': 8, 'stroke-linecap': 'round' }, svg);
    S.r5 = TXT(svg, 534, 306, "5'", C.rna, 18); S.r3 = TXT(svg, 0, 0, "3'", C.rna, 18);
    S.rGenes = E('g', {}, svg);
    [['lacZ', 690], ['lacY', 885], ['lacA', 995]].forEach(([s, x]) => TXT(S.rGenes, x, 330, s, '#ffc2d6', 16, IT));
    S.pol = E('g', {}, svg);
    E('ellipse', { cx: 0, cy: 0, rx: 76, ry: 46, fill: 'rgba(127,220,255,.16)', stroke: C.pol, 'stroke-width': 3 }, S.pol);
    TXT(S.pol, 0, -24, 'RNAポリメラーゼ', '#d0f4ff', 16, MID);
    S.x = TXT(svg, 0, 0, '✕', C.ng, 44, MID);
    S.n1 = TXT(svg, 560, 100, '', C.txt, 18); S.n2 = TXT(svg, 560, 128, '', C.mute, 17);
    S.n3 = TXT(svg, 640, 330, '', C.ng, 18); S.n4 = TXT(svg, 640, 384, '', C.ng, 18);

    /* ---------- proteins and lactose use ---------- */
    const prot = (x, rx, col, s) => { const g = E('g', {}, svg); E('ellipse', { cx: 0, cy: 0, rx, ry: 25, fill: col, 'fill-opacity': 0.22, stroke: col, 'stroke-width': 3 }, g); TXT(g, 0, 6, s, '#fff', 16, MID); at(g, x, 372); return g; };
    S.prot = [prot(690, 82, C.bgal, 'β-ガラクトシダーゼ'), prot(885, 58, C.perm, 'パーミアーゼ'), prot(1062, 88, C.tac, 'トランスアセチラーゼ')];
    S.pArr = [690, 885, 1000].map((x) => arrow(svg, `M${x} 336 V344`, C.rna, 3));
    S.use = E('g', {}, svg);
    E('rect', { x: 638, y: 452, width: 16, height: 96, fill: 'rgba(138,160,200,.25)', stroke: '#8aa0c8', 'stroke-width': 2 }, S.use);
    E('rect', { x: 632, y: 474, width: 28, height: 44, rx: 6, fill: C.perm, 'fill-opacity': 0.5, stroke: C.perm, 'stroke-width': 2 }, S.use);
    TXT(S.use, 646, 444, 'パーミアーゼ', C.perm, 16, MID);
    TXT(S.use, 604, 544, '細胞外', C.mute, 16, MID); TXT(S.use, 700, 544, '細胞内', C.mute, 16, MID);
    S.hyd = E('g', {}, svg);
    arrow(S.hyd, 'M770 495 H912', C.bgal, 3);
    TXT(S.hyd, 840, 482, '加水分解', C.bgal, 16, MID);
    TXT(S.hyd, 840, 524, 'β-ガラクトシダーゼ', C.bgal, 16, MID);
    S.bgLink = E('path', { d: 'M690 398 C 700 440, 800 440, 830 468', fill: 'none', stroke: C.bgal, 'stroke-width': 2, 'stroke-dasharray': '5 5' }, svg);
    S.uLac = lactose(svg);
    S.pGlc = E('g', {}, svg); E('polygon', { points: hexPts(13), fill: C.glc }, S.pGlc); S.pGlcL = TXT(S.pGlc, 0, -24, 'グルコース', C.glc, 16, MID);
    S.pGal = E('g', {}, svg); E('circle', { r: 12, fill: C.gal }, S.pGal); S.pGalL = TXT(S.pGal, 0, 40, 'ガラクトース', C.gal, 16, MID);

    /* ---------- operon vs regulon panel ---------- */
    S.reg = E('g', {}, svg);
    E('rect', { x: 0, y: 0, width: 1200, height: 675, fill: '#05070c', opacity: 0.95 }, S.reg);
    const panel = (x, title, col) => { E('rect', { x, y: 158, width: 520, height: 388, rx: 14, fill: 'rgba(255,255,255,.04)', stroke: col, 'stroke-width': 2 }, S.reg); TXT(S.reg, x + 24, 194, title, col, 22); };
    panel(60, 'オペロン（例：lacオペロン）', C.ok);
    E('line', { x1: 96, y1: 254, x2: 548, y2: 254, stroke: C.nt, 'stroke-width': 4 }, S.reg);
    E('line', { x1: 96, y1: 266, x2: 548, y2: 266, stroke: C.tp, 'stroke-width': 4 }, S.reg);
    [[110, 40, C.pro, 'P'], [160, 150, C.gene, 'lacZ'], [318, 80, C.gene, 'lacY'], [406, 70, C.gene, 'lacA'], [490, 30, C.term, 'T']].forEach(([x, w, c, s]) => {
      E('rect', { x, y: 244, width: w, height: 32, rx: 3, fill: c, 'fill-opacity': 0.16, stroke: c, 'stroke-width': 2 }, S.reg);
      TXT(S.reg, x + w / 2, 236, s, c, 16, s.startsWith('lac') ? IT : MID);
    });
    E('line', { x1: 160, y1: 310, x2: 476, y2: 310, stroke: C.rna, 'stroke-width': 7, 'stroke-linecap': 'round' }, S.reg);
    TXT(S.reg, 136, 316, "5'", C.rna, 16); TXT(S.reg, 486, 316, "3'", C.rna, 16);
    ['同一の転写因子で転写調節を受ける、', '連携的に働く酵素の遺伝子の集合体', '→ 1つのmRNA上に複数のタンパク質の情報', '他：ヒスチジンオペロン（10種の酵素遺伝子）'].forEach((s, i) => TXT(S.reg, 84, 372 + i * 34, s, i === 2 ? C.rna : C.txt, 17));
    panel(620, 'レギュロン', '#ffd43b');
    E('line', { x1: 650, y1: 254, x2: 1110, y2: 254, stroke: C.nt, 'stroke-width': 4 }, S.reg);
    E('line', { x1: 650, y1: 266, x2: 1110, y2: 266, stroke: C.tp, 'stroke-width': 4 }, S.reg);
    TXT(S.reg, 880, 236, '…　DNAのあちこちに散在　…', C.mute, 16, MID);
    [690, 860, 1030].forEach((x) => {
      E('rect', { x: x - 30, y: 244, width: 60, height: 32, rx: 3, fill: '#ffd43b', 'fill-opacity': 0.2, stroke: '#ffd43b', 'stroke-width': 2 }, S.reg);
      arrow(S.reg, `M880 322 L${x} 284`, '#ffd43b', 3);
    });
    E('ellipse', { cx: 880, cy: 334, rx: 74, ry: 18, fill: 'rgba(255,212,59,.15)', stroke: '#ffd43b', 'stroke-width': 2 }, S.reg);
    TXT(S.reg, 880, 340, '一斉に調節', '#ffd43b', 16, MID);
    ['DNAのあちこちに散在する遺伝子群の', '発現を一斉に調節するシステム', '例：熱ショックレギュロン、SOSレギュロン'].forEach((s, i) => TXT(S.reg, 644, 406 + i * 34, s, C.txt, 17));
    return S;
  },

  frame(S, t, mode) {
    const lacOn = mode !== 'glc', glcOn = mode !== 'lac', can = lacOn && !glcOn;
    op(S.map, fadeIn(t, 0, 0.03));
    op(S.ov, win(t, 0.06, 0.12));
    op(S.opBox, 1);

    /* lacI → mRNA (5'→3') → repressor */
    const ig = EZ(seg(t, 0.12, 0.16));
    let d = 'M110 300';
    for (let x = 110; x <= 110 + 120 * ig; x += 6) d += ` L${x} ${300 + Math.sin((x - 110) / 7) * 5}`;
    S.iRna.setAttribute('d', d);
    const iv = fadeIn(t, 0.12, 0.125) * L(1, 0.45, fadeIn(t, 0.2, 0.24));
    op(S.iRna, ig > 0 ? iv : 0); op(S.iRna5, ig > 0 ? iv : 0);
    S.iRna3.setAttribute('x', 112 + 120 * ig); op(S.iRna3, ig > 0 ? iv : 0);
    op(S.iArr, fadeIn(t, 0.16, 0.17) * L(1, 0.45, fadeIn(t, 0.2, 0.24)));
    let rp = REP_HOME;
    const bindU = EZ(seg(t, 0.2, 0.26)), offU = lacOn ? EZ(seg(t, 0.35, 0.39)) : 0;
    rp = lerp2(REP_HOME, OPER, bindU); if (offU > 0) rp = lerp2(OPER, REP_HOME, offU);
    at(S.rep, rp[0], rp[1]);
    op(S.rep, fadeIn(t, 0.16, 0.2) * (t > 0.93 ? 0 : 1) * (offU >= 1 ? 0.55 : 1));
    // lactose (inducer) joins the repressor
    const fly = EZ(seg(t, 0.31, 0.35));
    const lp = offU > 0 ? [rp[0] + 84, rp[1] + 2] : lerp2([56, 516], [OPER[0] + 84, OPER[1] + 2], fly);
    at(S.repLac, lp[0], lp[1]);
    op(S.repLac, lacOn && t > 0.31 && t < 0.93 ? (offU >= 1 ? 0.55 : 1) : 0);
    // operator highlight: bound = red-ish glow
    const bound = bindU >= 1 && offU < 0.5;
    S.opBox.setAttribute('stroke-width', bound && t > 0.26 ? 5 : 3);

    /* cAMP level and CRP */
    const lev = L(0.4, glcOn ? 0.12 : 0.92, EZ(seg(t, 0.4, 0.45)));
    const poolOn = fadeIn(t, 0.4, 0.42) * (t > 0.93 ? 0 : 1);
    op(S.crpPool, poolOn);
    S.gauge.setAttribute('height', 124 * lev); S.gauge.setAttribute('y', 373 + 124 * (1 - lev));
    const nC = Math.round(lev * CAMP_PTS.length);
    const join = can || !glcOn ? EZ(seg(t, 0.45, 0.47)) : 0, go = !glcOn ? EZ(seg(t, 0.47, 0.5)) : 0;
    const cp = lerp2(CRP_HOME, CRPS, go);
    at(S.crp, cp[0], cp[1]); op(S.crp, poolOn);
    S.camp.forEach((c, i) => {
      let p = CAMP_PTS[i];
      if (i === 0 && join > 0) p = lerp2(CAMP_PTS[0], [cp[0] + 36, cp[1] - 22], join);
      at(c, p[0], p[1]);
      op(c, poolOn * (i < nC ? 1 : 0));
    });
    op(S.crpLab, !glcOn ? fadeIn(t, 0.49, 0.5) * (t > 0.93 ? 0 : 1) : 0);

    /* RNA polymerase */
    let px = 440, py = 70, pv = 0, xv = 0;
    if (t >= 0.26 && t < 0.31) { py = L(70, 112, EZ(seg(t, 0.26, 0.28))); pv = win(t, 0.26, 0.31, 0.012); xv = fadeIn(t, 0.28, 0.285) * pv; }
    if (t >= 0.5) {
      py = L(70, 112, EZ(seg(t, 0.5, 0.53)));
      if (can) {
        py = L(py, POL_Y, EZ(seg(t, 0.54, 0.57)));
        px = L(440, 1080, CL(seg(t, 0.58, 0.76)));
        py = L(py, 110, EZ(seg(t, 0.76, 0.79)));
        pv = fadeIn(t, 0.5, 0.52) * (1 - fadeIn(t, 0.77, 0.8));
      } else {
        pv = fadeIn(t, 0.5, 0.52) * (1 - fadeIn(t, 0.62, 0.65));
        xv = fadeIn(t, 0.55, 0.56) * pv;
      }
    }
    at(S.pol, px, py); op(S.pol, pv);
    S.x.setAttribute('x', 440); S.x.setAttribute('y', 128); op(S.x, xv);

    /* mRNA: 5' end made first, 3' end grows with the polymerase */
    const tip = Math.min(px - 20, 1040);
    const mOn = can && t >= 0.58 && px > 580 && t < 0.93;
    if (mOn) {
      const onDNA = t < 0.76;
      S.rnaP.setAttribute('d', onDNA ? `M560 300 H${tip} Q${px - 8} 300 ${px - 8} 240` : 'M560 300 H1040');
      S.r3.setAttribute('x', onDNA ? px - 36 : 1048); S.r3.setAttribute('y', onDNA ? 278 : 306);
    }
    op(S.rnaP, mOn ? 1 : 0); op(S.r5, mOn ? 1 : 0); op(S.r3, mOn ? 1 : 0);
    op(S.rGenes, can ? fadeIn(t, 0.78, 0.8) * (t > 0.93 ? 0 : 1) : 0);

    /* notes */
    let n1 = '', n2 = '', c1 = C.txt;
    if (t >= 0.27 && t < 0.31) { n1 = 'オペレーターがふさがれている'; n2 = 'オペレーターはプロモーター内 → ポリメラーゼが結合できない'; c1 = C.ng; }
    else if (t >= 0.31 && t < 0.4) {
      if (lacOn) { n1 = 'ラクトースがあるとリプレッサーが外れる'; n2 = '発現抑制機構を積極的に抑制（負の調節）'; c1 = C.rep; }
      else { n1 = 'ラクトースなし：リプレッサーは結合したまま'; n2 = '転写は抑えられている（負の調節）'; c1 = C.rep; }
    } else if (t >= 0.4 && t < 0.5) {
      if (glcOn) { n1 = 'cAMP濃度が低い → cAMP–CRP複合体ができない'; n2 = 'CRP結合領域は空いたまま'; c1 = C.crp; }
      else { n1 = 'cAMPが合成・蓄積 → cAMP–CRP複合体'; n2 = 'CRP結合領域に結合する（正の調節）'; c1 = C.crp; }
    } else if (t >= 0.5 && t < 0.62) {
      if (can) { n1 = 'RNAポリメラーゼがプロモーターに結合'; n2 = 'cAMP–CRPが結合し、オペレーターも空いている'; c1 = C.ok; }
      else if (t >= 0.55) {
        n1 = 'RNAポリメラーゼはプロモーターに結合できない'; c1 = C.ng;
        n2 = !lacOn ? 'リプレッサーが結合・cAMP–CRP複合体もない' : 'リプレッサーは外れたが、cAMP–CRP複合体がない';
      }
    } else if (t >= 0.58 && t < 0.78 && can) { n1 = '鋳型鎖（青）を読み、mRNAを5\'→3\'へ伸ばす'; n2 = 'lacZ → lacY → lacA を1本のmRNAに'; c1 = C.rna; }
    else if (t >= 0.78 && t < 0.86 && can) { n1 = '1つのmRNA上に3つのタンパク質の情報'; n2 = ''; c1 = C.rna; }
    else if (t >= 0.86 && t < 0.93 && can) { n1 = 'ラクトースを取り込み、分解して利用する'; n2 = 'β-ガラクトシダーゼ → グルコース＋ガラクトース'; c1 = C.ok; }
    S.n1.textContent = n1; S.n2.textContent = n2; S.n1.setAttribute('fill', c1);
    // "not made" notes
    S.n3.textContent = !can && t >= 0.6 && t < 0.93 ? 'mRNAは作られない' : '';
    S.n4.textContent = !can && t >= 0.8 && t < 0.93 ? 'β-ガラクトシダーゼは作られない' : '';

    /* proteins: one mRNA → three proteins */
    S.prot.forEach((g, i) => op(g, can ? fadeIn(t, 0.79 + i * 0.02, 0.8 + i * 0.02) * (t > 0.93 ? 0 : 1) : 0));
    S.pArr.forEach((a, i) => op(a, can ? fadeIn(t, 0.79 + i * 0.02, 0.8 + i * 0.02) * (t > 0.93 ? 0 : 1) : 0));

    /* lactose import and hydrolysis */
    const useOn = can ? fadeIn(t, 0.86, 0.875) * (t > 0.93 ? 0 : 1) : 0;
    op(S.use, useOn); op(S.bgLink, can ? fadeIn(t, 0.895, 0.9) * (t > 0.93 ? 0 : 1) : 0);
    op(S.hyd, can ? fadeIn(t, 0.895, 0.9) * (t > 0.93 ? 0 : 1) : 0);
    const imp = EZ(seg(t, 0.875, 0.895)), cut = EZ(seg(t, 0.905, 0.925));
    at(S.uLac, L(596, 728, imp), 495);
    op(S.uLac, useOn * (cut > 0 ? 0 : 1));
    at(S.pGlc, L(742, 985, cut), 495); at(S.pGal, L(714, 1092, cut), 495);
    op(S.pGlc, can && cut > 0 && t < 0.93 ? 1 : 0); op(S.pGal, can && cut > 0 && t < 0.93 ? 1 : 0);
    op(S.pGlcL, CL((cut - 0.7) / 0.3)); op(S.pGalL, CL((cut - 0.7) / 0.3));

    op(S.reg, fadeIn(t, 0.93, 0.95));
  },
};

export default lac;
