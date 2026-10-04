// @ts-nocheck — imperative SVG drawing code; the public surface is typed via AnimDef below.
/**
 * template — 鋳型鎖を読み、RNAを5'→3'に合成する（スライド5, 7, 8, 10, 11）
 * Scene A: non-template strand (5'→3', top, yellow) / template strand (3'→5', bottom, blue).
 *   RNA polymerase opens a bubble, ribonucleoside triphosphates pair one by one with the template,
 *   the 3'OH of the growing RNA is joined to the 5' phosphate of the incoming nucleotide
 *   (pyrophosphate released), and the RNA (pink) peels off below: AUGAAAUGCUA = non-template with T→U.
 * Scene B: genes on both strands — the promoter decides the direction (slide 11).
 */
import { E, L, CL, EZ, seg, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const BASE = { A: '#ff8a65', T: '#ffd54f', G: '#4fc3f7', C: '#81e39a', U: '#d59cff' };
const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
const TO_RNA = { A: 'U', T: 'A', G: 'C', C: 'G' }; // template base → RNA base
const COL = { nt: '#f5c542', tp: '#3fb6ff', rna: '#ff7aa8', pol: '#8fd6ff', p: '#ffb86b' };
const TXT = (par, x, y, s, fill, size = 18, extra = {}) => { const t = E('text', { x, y, fill, 'font-size': size, 'font-weight': 700, ...extra }, par); t.textContent = s; return t; };
const op = (el, v) => el.setAttribute('opacity', String(Math.max(0, Math.min(1, v))));
const fadeIn = (t, a, b) => CL((t - a) / (b - a));
const win = (t, a, b, f = 0.03) => Math.min(fadeIn(t, a, a + f), 1 - fadeIn(t, b - f, b));
const pentPts = (cx, cy, r, rot = -Math.PI / 2) => Array.from({ length: 5 }, (_, i) => { const a = rot + (i * 2 * Math.PI) / 5; return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`; }).join(' ');

const SEQ = 'ATGAAATGCTA'; // non-template 5'→3' (slide 7)
const N = SEQ.length;
const X0 = 260, DX = 60;
const X = (i) => X0 + i * DX;
const yT = 190, yB = 350, LIFT = 95, H = 3, EXIT = 230;
const RNA_Y = 226; // sugar of an RNA nucleotide in the bubble

/** nucleotides incorporated (continuous) for scene time t */
const pOf = (t) => {
  if (t < 0.16) return 0;
  if (t < 0.3) return seg(t, 0.16, 0.3);
  if (t < 0.48) return 1 + seg(t, 0.3, 0.48);
  if (t < 0.72) return 2 + 9 * seg(t, 0.48, 0.72);
  return 11 + 5 * seg(t, 0.72, 0.76);
};
/** how open the double helix is at (continuous) position s */
const openAt = (s, p) => CL(Math.min(p - s + 2, s - p + H + 1.5, s + 1.5));

const def: AnimDef = {
  hud: (t) => t < 0.16 ? ['DNA', '二本鎖'] : t < 0.3 ? ['NTP', '相補的に対合'] : t < 0.48 ? ["3'OH＋5'P", 'リン酸ジエステル結合'] : t < 0.76 ? ["5'→3'", 'RNAの伸長'] : t < 0.8 ? ['T→U', '非鋳型鎖と同じ'] : ['P', '向きを決める'],
  cam: () => [0, 0, 1200, 675],
  build(svg) {
    glowDefs(svg);
    const S = {};
    const A = (S.A = E('g', {}, svg));
    S.rnaL = E('g', {}, A); // under the DNA: the leaving RNA passes behind the template strand
    S.dnaL = E('g', {}, A);
    S.ntL = E('g', {}, A);
    S.polL = E('g', {}, A);
    S.labL = E('g', {}, A);

    // --- DNA ---------------------------------------------------------------
    S.top = E('path', { fill: 'none', stroke: COL.nt, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.dnaL);
    E('line', { x1: 50, y1: yB, x2: 1070, y2: yB, stroke: COL.tp, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.dnaL);
    S.tb = []; S.bb = []; S.hb = [];
    for (let i = -3; i <= 13; i++) {
      const gene = i >= 0 && i < N;
      const tl = gene ? SEQ[i] : '', bl = gene ? COMP[SEQ[i]] : '';
      const x = X(i);
      const hb = E('line', { x1: x, x2: x, y1: yT + 58, y2: yB - 58, stroke: '#9fb0d0', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, S.dnaL);
      const tg = E('g', {}, S.dnaL);
      E('rect', { x: -18, y: 6, width: 36, height: 50, rx: 5, fill: gene ? BASE[tl] : '#3a4560', opacity: gene ? 0.92 : 0.8 }, tg);
      if (gene) TXT(tg, 0, 40, tl, '#10131c', 24, { 'text-anchor': 'middle' });
      const bg = E('g', { transform: `translate(${x},${yB})` }, S.dnaL);
      E('rect', { x: -18, y: -56, width: 36, height: 50, rx: 5, fill: gene ? BASE[bl] : '#3a4560', opacity: gene ? 0.92 : 0.8 }, bg);
      if (gene) TXT(bg, 0, -22, bl, '#10131c', 24, { 'text-anchor': 'middle' });
      S.tb.push({ i, g: tg }); S.hb.push({ i, el: hb });
    }
    TXT(S.labL, 22, yT + 7, "5'", '#fff', 20); TXT(S.labL, 1080, yT + 7, "3'", '#fff', 20);
    TXT(S.labL, 22, yB + 7, "3'", '#fff', 20); TXT(S.labL, 1080, yB + 7, "5'", '#fff', 20);
    TXT(S.labL, 50, 160, '非鋳型鎖（5\'→3\'）', COL.nt, 18);
    TXT(S.labL, 50, 392, '鋳型鎖（3\'→5\'）', COL.tp, 18);

    // --- RNA nucleotides (incoming NTP → paired → peeled off) -------------------
    S.nts = [];
    for (let i = 0; i < N; i++) {
      const r = TO_RNA[COMP[SEQ[i]]];
      const g = E('g', { opacity: 0 }, S.ntL);
      E('polygon', { points: pentPts(0, RNA_Y, 11), fill: COL.rna, stroke: '#fff', 'stroke-width': 1.5 }, g);
      E('rect', { x: -18, y: 240, width: 36, height: 48, rx: 5, fill: BASE[r], stroke: COL.rna, 'stroke-width': 3 }, g);
      TXT(g, 0, 273, r, '#10131c', 24, { 'text-anchor': 'middle' });
      const name = TXT(g, 22, 196, r + 'TP', '#fff', 17, { opacity: 0 });
      // phosphates: α stays in the backbone, β+γ leave as pyrophosphate
      const P = (par, x, y) => { const pg = E('g', { transform: `translate(${x},${y})` }, par); E('circle', { r: 11, fill: COL.p, stroke: '#10131c', 'stroke-width': 1.5 }, pg); TXT(pg, 0, 6, 'P', '#10131c', 16, { 'text-anchor': 'middle' }); return pg; };
      const alpha = i > 0 ? P(g, -26, 206) : null;
      const ppi = E('g', { opacity: 0 }, S.ntL);
      if (i > 0) { P(ppi, -46, 190); P(ppi, -66, 174); }
      const ppiTxt = null;
      const bond = E('path', { fill: 'none', stroke: COL.rna, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, S.rnaL);
      const flash = E('path', { fill: 'none', stroke: '#fff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0, filter: 'url(#gl)' }, S.rnaL);
      S.nts.push({ r, g, name, alpha, ppi, ppiTxt, bond, flash });
    }
    S.r5 = TXT(S.labL, X0 - 46, RNA_Y + EXIT + 8, "5'", '#fff', 20, { opacity: 0 });
    S.r3 = TXT(S.labL, 0, RNA_Y + EXIT + 8, "3'", '#fff', 20, { opacity: 0 });
    S.rnaName = E('g', { opacity: 0 }, S.labL);
    TXT(S.rnaName, 50, 476, 'RNA（転写産物）', COL.rna, 18);
    TXT(S.rnaName, 50, 502, "5'→3'に伸びる", COL.rna, 17);

    // --- RNA polymerase ---------------------------------------------------------
    S.pol = E('g', { opacity: 0 }, S.polL);
    E('rect', { x: -250, y: 72, width: 390, height: 322, rx: 56, fill: 'rgba(143,214,255,.10)', stroke: COL.pol, 'stroke-width': 3 }, S.pol);
    TXT(S.pol, -55, 62, 'RNAポリメラーゼ', '#cfeeff', 19, { 'text-anchor': 'middle' });
    const rd = E('g', {}, S.pol);
    E('path', { d: 'M-70 410 H60', stroke: COL.tp, 'stroke-width': 3, fill: 'none' }, rd);
    E('path', { d: 'M60 410 l-12 -7 v14 z', fill: COL.tp }, rd);
    TXT(rd, -5, 434, "鋳型鎖を3'→5'に読む", '#bfe6ff', 16, { 'text-anchor': 'middle' });

    // --- inset: chemistry of one step (slide 8) ----------------------------------
    S.inset = E('g', { opacity: 0 }, A);
    const I = S.inset;
    E('rect', { x: 560, y: 392, width: 600, height: 156, rx: 14, fill: 'rgba(8,12,22,.92)', stroke: '#5c6b8a', 'stroke-width': 2 }, I);
    TXT(I, 578, 418, '結合のしくみ（スライド8）', '#cfd8ea', 16);
    E('polygon', { points: pentPts(650, 478, 20), fill: COL.rna, stroke: '#fff', 'stroke-width': 1.5 }, I);
    TXT(I, 650, 484, '糖', '#10131c', 15, { 'text-anchor': 'middle' });
    E('line', { x1: 590, y1: 478, x2: 628, y2: 478, stroke: COL.rna, 'stroke-width': 5 }, I);
    TXT(I, 578, 456, '伸長中のRNA', COL.rna, 16);
    S.oh = TXT(I, 664, 514, "3'OH", '#ff6b6b', 18);
    S.inN = E('g', {}, I);
    E('polygon', { points: pentPts(0, 0, 20), fill: COL.rna, stroke: '#fff', 'stroke-width': 1.5 }, S.inN);
    TXT(S.inN, 0, 6, '糖', '#10131c', 15, { 'text-anchor': 'middle' });
    E('rect', { x: 26, y: -16, width: 32, height: 32, rx: 5, fill: BASE.U }, S.inN);
    TXT(S.inN, 42, 7, 'U', '#10131c', 18, { 'text-anchor': 'middle' });
    TXT(S.inN, -16, 40, "5'", '#ff6b6b', 16);
    S.inA = E('g', {}, I); S.inBG = E('g', {}, I);
    const bigP = (par, x) => { const g = E('g', { transform: `translate(${x},0)` }, par); E('circle', { r: 14, fill: COL.p, stroke: '#10131c', 'stroke-width': 1.5 }, g); TXT(g, 0, 6, 'P', '#10131c', 17, { 'text-anchor': 'middle' }); return g; };
    bigP(S.inA, 0); bigP(S.inBG, 0); bigP(S.inBG, -34);
    E('line', { x1: 14, y1: 0, x2: 22, y2: 0, stroke: '#ccc', 'stroke-width': 3 }, S.inA);
    S.inTri = TXT(I, 880, 440, "5'三リン酸（UTPなど）", '#ffd8a8', 16, { 'text-anchor': 'middle' });
    S.inPPi = TXT(I, 0, 0, 'ピロリン酸', '#ffd8a8', 16, { 'text-anchor': 'middle', opacity: 0 });
    S.inBond = E('path', { d: 'M670 478 H760', stroke: '#fff', 'stroke-width': 5, opacity: 0, filter: 'url(#gl)' }, I);
    S.inBondT = TXT(I, 790, 540, '', '#fff', 16, { 'text-anchor': 'middle' });

    // --- comparison: RNA = non-template with T→U --------------------------------
    S.cmp = E('g', { opacity: 0 }, A);
    for (let i = 0; i < N; i++) {
      const isT = SEQ[i] === 'T';
      E('line', { x1: X(i), y1: yT + 58, x2: X(i), y2: RNA_Y + EXIT + 12, stroke: isT ? '#fff' : '#7d8db0', 'stroke-width': isT ? 2.5 : 1.5, 'stroke-dasharray': '5 6' }, S.cmp);
      if (isT) {
        E('rect', { x: X(i) - 23, y: yT + 2, width: 46, height: 58, rx: 8, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, S.cmp);
        E('rect', { x: X(i) - 23, y: RNA_Y + EXIT + 10, width: 46, height: 56, rx: 8, fill: 'none', stroke: '#fff', 'stroke-width': 3 }, S.cmp);
      }
    }
    E('rect', { x: 330, y: 398, width: 540, height: 38, rx: 10, fill: 'rgba(8,12,22,.92)', stroke: '#fff', 'stroke-width': 1.5 }, S.cmp);
    TXT(S.cmp, 600, 425, '非鋳型鎖と同じ並び（TだけがUになる）', '#fff', 20, { 'text-anchor': 'middle' });

    // --- scene B: the promoter decides the direction (slide 11) -------------------
    const B = (S.B = E('g', { opacity: 0 }, svg));
    TXT(B, 600, 120, '遺伝子ごとに、プロモーター（P）の向きが転写の向きを決める', '#fff', 22, { 'text-anchor': 'middle' });
    const by1 = 260, by2 = 292;
    E('line', { x1: 60, y1: by1, x2: 1140, y2: by1, stroke: '#8a94ab', 'stroke-width': 6 }, B);
    E('line', { x1: 60, y1: by2, x2: 1140, y2: by2, stroke: '#8a94ab', 'stroke-width': 6 }, B);
    TXT(B, 30, by1 + 7, "5'", '#fff', 18); TXT(B, 1150, by1 + 7, "3'", '#fff', 18);
    TXT(B, 30, by2 + 7, "3'", '#fff', 18); TXT(B, 1150, by2 + 7, "5'", '#fff', 18);
    S.genes = [
      { n: 'a', p: 150, a: 168, b: 370, dir: 1 },
      { n: 'b', p: 430, a: 448, b: 650, dir: 1 },
      { n: 'c', p: 790, a: 772, b: 692, dir: -1 },
      { n: 'd', p: 902, a: 884, b: 808, dir: -1 },
      { n: 'e', p: 960, a: 978, b: 1120, dir: 1 },
    ].map((G) => {
      const tplY = G.dir > 0 ? by2 : by1, ntY = G.dir > 0 ? by1 : by2;
      const tpl = E('line', { y1: tplY, y2: tplY, stroke: COL.tp, 'stroke-width': 7 }, B);
      const non = E('line', { y1: ntY, y2: ntY, stroke: COL.nt, 'stroke-width': 7 }, B);
      E('circle', { cx: G.p, cy: (by1 + by2) / 2, r: 24, fill: 'none', stroke: '#ff5a5a', 'stroke-width': 3 }, B);
      TXT(B, G.p, G.dir > 0 ? by2 + 50 : by1 - 36, 'P', '#ff5a5a', 20, { 'text-anchor': 'middle' });
      const ry = G.dir > 0 ? by2 + 40 : by1 - 40;
      const rna = E('path', { fill: 'none', stroke: COL.rna, 'stroke-width': 6, 'stroke-linecap': 'round' }, B);
      const head = E('path', { fill: COL.rna }, B);
      TXT(B, (G.a + G.b) / 2 + G.dir * 12, G.dir > 0 ? ry + 32 : ry - 18, '遺伝子' + G.n, '#ffd0e0', 17, { 'text-anchor': 'middle' });
      const pol = E('ellipse', { rx: 20, ry: 28, cy: (by1 + by2) / 2, fill: 'rgba(143,214,255,.25)', stroke: COL.pol, 'stroke-width': 2.5 }, B);
      return { ...G, tpl, non, rna, head, pol, ry };
    });
    S.notes = E('g', { opacity: 0 }, B);
    TXT(S.notes, 80, 430, "右向き（a・b・e）：下の鎖が鋳型鎖。左から右へ（3'→5'に）読む", '#e6ecf8', 18);
    TXT(S.notes, 80, 462, "左向き（c・d）：上の鎖が鋳型鎖。右から左へ（3'→5'に）読む", '#e6ecf8', 18);
    TXT(S.notes, 80, 494, "どの遺伝子でも RNA は 5'→3' に伸びる（青＝鋳型鎖、黄＝非鋳型鎖）", COL.rna, 18);

    // badge (screen-fixed)
    const bd = E('g', {}, svg);
    E('rect', { x: 910, y: 582, width: 270, height: 34, rx: 8, fill: 'rgba(3,4,7,.75)', stroke: '#8fd6ff', 'stroke-width': 1.5 }, bd);
    TXT(bd, 1045, 605, '転写の基本（原核・真核共通）', '#cfeeff', 16, { 'text-anchor': 'middle' });
    return S;
  },
  frame(S, t) {
    const p = pOf(t);
    const enter = EZ(seg(t, 0.08, 0.14));
    const bub = EZ(seg(t, 0.11, 0.16));
    const ax = L(-180, X(0), enter) + (p - 0) * DX;
    // DNA: top strand lifts inside the bubble
    const lift = (s) => LIFT * openAt(s, p) * bub;
    let d = '';
    for (let x = 50; x <= 1070; x += 6) d += (x === 50 ? 'M' : 'L') + x + ' ' + (yT - lift((x - X0) / DX)).toFixed(1) + ' ';
    S.top.setAttribute('d', d);
    S.tb.forEach(({ i, g }) => g.setAttribute('transform', `translate(${X(i)},${yT - lift(i)})`));
    S.hb.forEach(({ i, el }) => op(el, 1 - openAt(i, p) * bub * 3));
    // polymerase
    S.pol.setAttribute('transform', `translate(${ax},0)`);
    op(S.pol, enter * (1 - fadeIn(t, 0.73, 0.76)));
    // nucleotides
    let lastOut = -1;
    S.nts.forEach((n, i) => {
      const u = p - i;
      const a = EZ(CL(u / 0.55));
      const e = EZ(CL(p - (i + 1 + H)));
      const dy = EXIT * e;
      const gx = X(i) + 130 * (1 - a);
      n.g.setAttribute('transform', `translate(${gx},${dy})`);
      op(n.g, u <= 0 ? 0 : a * 1.4);
      op(n.name, u > 0 ? 1 - fadeIn(u, 0.6, 0.8) : 0);
      const b = CL((u - 0.55) / 0.2); // bond formation
      if (n.alpha) n.alpha.setAttribute('transform', `translate(${L(-26, -30, b)},${L(206, 222, b)})`);
      const rel = EZ(CL((u - 0.72) / 0.28)); // PPi leaves
      n.ppi.setAttribute('transform', `translate(${gx + 70 * rel},${dy - 30 * rel})`);
      op(n.ppi, u <= 0 ? 0 : Math.min(a * 1.4, 1 - fadeIn(u, 0.9, 1.3)));
      if (i > 0) {
        const py = RNA_Y + EXIT * EZ(CL(p - (i + H))), cy = RNA_Y + dy;
        const path = `M${X(i - 1)} ${py} L${gx - 30} ${cy - 4} L${gx} ${cy}`;
        n.bond.setAttribute('d', path); n.flash.setAttribute('d', `M${X(i - 1) + 10} ${py} L${gx - 30} ${cy - 4} L${gx - 10} ${cy}`);
        op(n.bond, b); op(n.flash, b > 0 && u < 1.2 ? Math.sin(Math.PI * CL((u - 0.55) / 0.45)) : 0);
      }
      if (e > 0.95) lastOut = i;
    });
    op(S.r5, fadeIn(p, H + 1.6, H + 2));
    op(S.rnaName, fadeIn(p, H + 1.6, H + 2.2));
    S.r3.setAttribute('x', X(Math.max(0, lastOut)) + 28);
    op(S.r3, lastOut >= 0 ? 1 : 0);
    // inset (one bond in detail, synced with nucleotide 2)
    const ui = p - 1;
    op(S.inset, win(t, 0.3, 0.5));
    const ia = EZ(CL(ui / 0.55)), ib = CL((ui - 0.55) / 0.2), ir = EZ(CL((ui - 0.72) / 0.28));
    const nx = L(1060, 830, ia);
    S.inN.setAttribute('transform', `translate(${nx},478)`);
    S.inA.setAttribute('transform', `translate(${L(nx - 50, 760 - 14, Math.max(0, ib))},478)`);
    const bgx = L(nx - 84, 740, Math.max(0, ib)) + 150 * ir, bgy = 478 - 36 * ir;
    S.inBG.setAttribute('transform', `translate(${bgx},${bgy})`);
    op(S.inBG, 1 - fadeIn(ui, 0.95, 1.05));
    S.inPPi.setAttribute('x', bgx - 17); S.inPPi.setAttribute('y', bgy - 22);
    op(S.inPPi, ir > 0.2 ? 1 - fadeIn(ui, 0.95, 1.05) : 0);
    op(S.inTri, 1 - fadeIn(ui, 0.5, 0.6));
    op(S.inBond, ib > 0 ? Math.max(0.5, 1 - ir) : 0);
    S.inBondT.textContent = ib > 0 ? "リン酸ジエステル結合（3'炭素–5'炭素の間）" : '';
    S.inBond.setAttribute('d', `M672 478 H${L(nx - 50, 746, Math.max(0, ib)) - 14} M${L(nx - 50, 746, Math.max(0, ib)) + 14} 478 H${nx - 20}`);
    // comparison
    op(S.cmp, win(t, 0.765, 0.8, 0.012));
    // scene A ↔ B
    const sw = EZ(seg(t, 0.8, 0.83));
    op(S.A, 1 - sw); op(S.B, sw);
    S.genes.forEach((G, j) => {
      const g = EZ(seg(t, 0.835 + j * 0.012, 0.9 + j * 0.012));
      const tip = L(G.a, G.b, g);
      const x1 = Math.min(G.a, tip), x2 = Math.max(G.a, tip);
      [G.tpl, G.non].forEach((ln) => { ln.setAttribute('x1', x1); ln.setAttribute('x2', x2); op(ln, g > 0 ? 1 : 0); });
      G.rna.setAttribute('d', `M${G.a} ${G.ry} H${tip - G.dir * 8}`);
      G.head.setAttribute('d', `M${tip + G.dir * 6} ${G.ry} l${-G.dir * 16} -9 v18 z`);
      op(G.rna, g > 0.02 ? 1 : 0); op(G.head, g > 0.02 ? 1 : 0);
      G.pol.setAttribute('cx', tip);
      op(G.pol, g > 0 && g < 1 ? 1 : g >= 1 ? 1 - fadeIn(t, 0.92 + j * 0.012, 0.94 + j * 0.012) : 0);
    });
    op(S.notes, fadeIn(t, 0.93, 0.96));
  },
};

export default def;
