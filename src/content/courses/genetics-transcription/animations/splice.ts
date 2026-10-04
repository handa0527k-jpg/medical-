// @ts-nocheck — imperative SVG drawing code; the public surface is typed via AnimDef below.
/**
 * splice — mRNA前駆体から成熟mRNAへ（スライド46–53）
 * RNAポリメラーゼIIがmRNA前駆体（5'ppp）を合成 → 5'キャップ（G付加 → 7位Nのメチル化 = m⁷G）
 * → スプライシング（GU…ブランチA…AG、U1 → U2AF・U2 → U4/U5/U6 → U1・U4放出 → 5'切断・投げ縄構造
 * → U5がエクソンを保持・3'切断 → エクソン結合）→ ポリA（AAUAAAとGUに富む配列の間で切断 → 20〜250個のA）
 * → キャップとポリAがエキソヌクレアーゼから守る → 核膜孔から細胞質へ → 選択的スプライシング（スライド49）。
 * 色：非鋳型鎖 黄、鋳型鎖 青、RNA ピンク。転写は左→右（RNAは5'→3'）。
 */
import { E, L, CL, EZ, seg, kf, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const C = { nt: '#f5c542', tp: '#3fb6ff', rna: '#ff7aa8', exon: '#ff7aa8', intron: '#9aa3b5', pol: '#8fd6ff', cap: '#7bd88f', a: '#ff8a65', mem: '#8aa0c8', txt: '#e8edf7', dim: '#b8c0d0', cut: '#ff5a5a' };
const SN = { U1: '#5fd068', U2: '#f2d14b', U4: '#f0a03c', U5: '#d58ce6', U6: '#5fd8e8', U2AF: '#a9b4ff' };
const TXT = (par, x, y, s, fill, size = 18, extra = {}) => { const t = E('text', { x, y, fill, 'font-size': size, 'font-weight': 700, ...extra }, par); t.textContent = s; return t; };
const op = (el, v) => el.setAttribute('opacity', String(Math.max(0, Math.min(1, v))));
const fi = (t, a, b) => CL((t - a) / (b - a));
const win = (t, a, b, f = 0.012) => Math.min(fi(t, a, a + f), 1 - fi(t, b - f, b));
const at = (el, x, y) => el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
const ln = (el, x1, y1, x2, y2) => { el.setAttribute('x1', x1); el.setAttribute('y1', y1); el.setAttribute('x2', x2); el.setAttribute('y2', y2); };
const hexPts = (cx, cy, r, rot = Math.PI / 6) => Array.from({ length: 6 }, (_, i) => { const a = rot + (i * Math.PI) / 3; return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
const pentPts = (cx, cy, r, rot = Math.PI) => Array.from({ length: 5 }, (_, i) => { const a = rot + (i * 2 * Math.PI) / 5; return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`; }).join(' ');

/** snRNP / protein blob: rounded ellipse with a dark label */
const blob = (par, name, col, rx = 44, ry = 28, fs = 17) => {
  const g = E('g', { opacity: 0 }, par);
  E('ellipse', { rx, ry, fill: col, 'fill-opacity': 0.88, stroke: '#ffffff', 'stroke-opacity': 0.45, 'stroke-width': 2 }, g);
  TXT(g, 0, 6, name, '#10131c', fs, { 'text-anchor': 'middle' });
  return g;
};
const badge = (svg, s) => {
  const g = E('g', {}, svg);
  E('rect', { x: 20, y: 46, width: 196, height: 34, rx: 8, fill: 'rgba(3,4,7,.75)', stroke: '#7bd88f', 'stroke-width': 2 }, g);
  TXT(g, 118, 69, s, '#a8f0b6', 18, { 'text-anchor': 'middle' });
};

const def: AnimDef = {
  hud: (t) => t < 0.12 ? ['Pol II', 'mRNA前駆体'] : t < 0.2 ? ['m⁷G', "5'キャップ"] : t < 0.58 ? ['GU-AG', 'スプライシング'] : t < 0.68 ? ['poly(A)', 'ポリA'] : t < 0.74 ? ['保護', 'キャップ・ポリA'] : t < 0.82 ? ['EXPORT', '核→細胞質'] : t < 0.92 ? ['A / B', '選択的スプライシング'] : ['mRNA', '成熟mRNA'],
  cam: () => [0, 0, 1200, 675],
  build(svg) {
    glowDefs(svg);
    const S = {};
    const defs = E('defs', {}, svg);
    const cp = E('clipPath', { id: 'spl-clip' }, defs);
    S.clip = E('rect', { x: 0, y: -80, width: 0, height: 160 }, cp);

    /* ---------- DNA (gene) with RNAポリメラーゼII ---------- */
    S.top = E('g', { transform: 'translate(0,90)' }, svg);
    S.dna = E('g', {}, S.top);
    const gene = [['プロモーター', 60, 150, 'pro'], ['エクソン1', 160, 330, 'ex'], ['イントロン1', 330, 560, 'in'], ['エクソン2', 560, 700, 'ex'], ['イントロン2', 700, 880, 'in'], ['エクソン3', 880, 1050, 'ex']];
    gene.forEach(([n, a, b, k]) => {
      if (k === 'ex') E('rect', { x: a, y: 104, width: b - a, height: 64, fill: 'rgba(255,122,168,.16)', stroke: 'rgba(255,122,168,.5)', 'stroke-width': 1.5 }, S.dna);
      if (k === 'pro') E('rect', { x: a, y: 104, width: b - a, height: 64, fill: 'none', stroke: '#ff922b', 'stroke-width': 2, 'stroke-dasharray': '7 5' }, S.dna);
      TXT(S.dna, (a + b) / 2, 96, n, k === 'ex' ? '#ffb3cc' : k === 'pro' ? '#ffb070' : C.dim, 16, { 'text-anchor': 'middle' });
    });
    E('line', { x1: 40, y1: 116, x2: 1160, y2: 116, stroke: C.nt, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.dna);
    E('line', { x1: 40, y1: 156, x2: 1160, y2: 156, stroke: C.tp, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.dna);
    for (let x = 52; x < 1150; x += 22) E('line', { x1: x, y1: 121, x2: x, y2: 151, stroke: '#6c7690', 'stroke-width': 2, opacity: 0.6 }, S.dna);
    TXT(S.dna, 12, 122, "5'", C.nt, 18); TXT(S.dna, 1166, 122, "3'", C.nt, 18);
    TXT(S.dna, 12, 162, "3'", C.tp, 18); TXT(S.dna, 1166, 162, "5'", C.tp, 18);
    S.dnaLab = E('g', {}, S.dna);
    TXT(S.dnaLab, 40, 192, '鋳型鎖（3\'→5\'に読まれる）', C.tp, 16);
    S.pol = E('g', { opacity: 0 }, S.top);
    E('ellipse', { cx: 0, cy: 0, rx: 58, ry: 42, fill: 'rgba(143,214,255,.2)', stroke: C.pol, 'stroke-width': 3 }, S.pol);
    S.polLab = TXT(svg, 0, 0, 'RNAポリメラーゼII', '#cfeeff', 16, { 'text-anchor': 'middle', opacity: 0 });
    S.top.appendChild(S.polLab);
    S.nasc = E('path', { fill: 'none', stroke: C.rna, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, S.top);
    S.dirLab = TXT(svg, 0, 0, "RNA 5'→3' に伸びる →", C.rna, 18, { opacity: 0, 'text-anchor': 'end' });
    S.top.appendChild(S.dirLab);

    /* ---------- overview row (pre-mRNA → mature mRNA), drawn in row coordinates (baseline y = 0) ---------- */
    S.row = E('g', {}, svg);
    S.rowIn = E('g', { 'clip-path': 'url(#spl-clip)' }, S.row);
    const R = S.rowIn;
    S.hl = E('rect', { x: 150, y: -30, width: 0, height: 60, rx: 8, fill: 'none', stroke: '#ffd54f', 'stroke-width': 2.5, 'stroke-dasharray': '8 6', opacity: 0 }, R);
    S.dSeg = E('g', {}, R);
    S.dLine = E('line', { stroke: C.rna, 'stroke-width': 8, 'stroke-linecap': 'round' }, S.dSeg);
    S.dGU = TXT(S.dSeg, 0, -22, 'GU', '#d59cff', 16, { 'text-anchor': 'middle' });
    S.i1 = E('path', { fill: 'none', stroke: C.intron, 'stroke-width': 7 }, R);
    S.i2 = E('path', { fill: 'none', stroke: C.intron, 'stroke-width': 7 }, R);
    S.i1t = TXT(R, 0, 38, 'イントロン1', C.dim, 16, { 'text-anchor': 'middle' });
    S.i2t = TXT(R, 0, 38, 'イントロン2', C.dim, 16, { 'text-anchor': 'middle' });
    S.ex = [1, 2, 3].map((k) => {
      const l = E('line', { stroke: C.exon, 'stroke-width': 30 }, R);
      const t = TXT(R, 0, 7, `エクソン${k}`, '#2a0c18', 18, { 'text-anchor': 'middle' });
      return { l, t };
    });
    S.sig = TXT(R, 0, -24, 'AAUAAA', '#ffe08a', 16, { 'text-anchor': 'middle' });
    S.pA = TXT(R, 0, 7, '', C.a, 20, { 'letter-spacing': 1 });
    S.pAlab = TXT(R, 0, 44, 'ポリ(A)末端：20〜250個のA', C.a, 16, { opacity: 0 });
    S.ppp = TXT(R, 152, 7, 'ppp', '#ffffff', 18, { 'text-anchor': 'end' });
    S.cap = E('g', { opacity: 0 }, R);
    E('circle', { cx: 138, cy: 0, r: 22, fill: C.cap }, S.cap);
    TXT(S.cap, 138, 6, 'm⁷G', '#0e2414', 16, { 'text-anchor': 'middle' });
    S.five = TXT(R, 96, 7, "5'", '#ffffff', 18, { 'text-anchor': 'end' });
    S.three = TXT(R, 0, 7, "3'", '#ffffff', 18);
    // exonucleases (STEP 5)
    const exo = (flip) => { const g = E('g', { opacity: 0 }, S.row); E('path', { d: flip ? 'M0 0 L-30 -20 A36 36 0 1 1 -30 20 Z' : 'M0 0 L30 -20 A36 36 0 1 0 30 20 Z', fill: 'rgba(255,90,90,.35)', stroke: C.cut, 'stroke-width': 2.5 }, g); TXT(g, 0, -48, 'エキソヌクレアーゼ', '#ff9a9a', 16, { 'text-anchor': 'middle' }); return g; };
    S.exoL = exo(false); S.exoR = exo(true);
    S.shL = E('path', { d: 'M108 -34 A40 40 0 0 0 108 34', fill: 'none', stroke: C.cap, 'stroke-width': 5, opacity: 0 }, S.row);
    S.shR = E('path', { fill: 'none', stroke: C.a, 'stroke-width': 5, opacity: 0 }, S.row);

    // capping enzyme / endonuclease / poly(A) polymerase (in row coordinates)
    S.capE = blob(S.row, 'キャッピング酵素', '#9fe0b0', 82, 24, 16);
    S.endo = blob(S.row, 'エンドヌクレアーゼ', '#ffb0b0', 90, 24, 16);
    S.papol = blob(S.row, 'ポリ(A)ポリメラーゼ', '#ffc9a8', 96, 24, 16);
    S.cutA = E('line', { stroke: C.cut, 'stroke-width': 4, 'stroke-dasharray': '6 4', opacity: 0 }, S.row);

    /* ---------- 5' cap close-up (slide 47) ---------- */
    S.capBox = E('g', { opacity: 0 }, svg);
    E('rect', { x: 70, y: 378, width: 600, height: 168, rx: 12, fill: 'rgba(10,14,24,.92)', stroke: '#3a4660', 'stroke-width': 2 }, S.capBox);
    TXT(S.capBox, 650, 406, "5'末端の拡大（スライド47）", C.txt, 18, { 'text-anchor': 'end' });
    E('line', { x1: 380, y1: 455, x2: 620, y2: 455, stroke: C.rna, 'stroke-width': 8, 'stroke-linecap': 'round' }, S.capBox);
    TXT(S.capBox, 632, 461, "3'", '#fff', 18);
    TXT(S.capBox, 340, 462, 'ppp', '#fff', 20, { 'text-anchor': 'middle' });
    S.c5 = TXT(S.capBox, 340, 424, "5'", '#fff', 18, { 'text-anchor': 'middle' });
    S.gN = E('g', {}, S.capBox); // guanine nucleotide (purine: 6-ring + 5-ring)
    E('polygon', { points: hexPts(0, 0, 26), fill: 'rgba(79,195,247,.18)', stroke: '#4fc3f7', 'stroke-width': 3 }, S.gN);
    E('polygon', { points: pentPts(-44, 0, 22), fill: 'rgba(79,195,247,.18)', stroke: '#4fc3f7', 'stroke-width': 3 }, S.gN);
    TXT(S.gN, 0, 7, 'G', '#bfe9ff', 20, { 'text-anchor': 'middle' });
    S.n7 = E('g', { opacity: 0 }, S.gN);
    E('circle', { cx: -48, cy: -21, r: 5, fill: '#ffe08a' }, S.n7);
    TXT(S.n7, -58, -30, 'N7', '#ffe08a', 16, { 'text-anchor': 'end' });
    S.me = E('g', { opacity: 0 }, S.capBox);
    E('circle', { cx: 0, cy: 0, r: 20, fill: 'rgba(255,90,122,.25)', stroke: '#ff5a7a', 'stroke-width': 2.5 }, S.me);
    TXT(S.me, 0, 6, 'CH₃', '#ffb3c2', 16, { 'text-anchor': 'middle' });
    S.gBond = E('line', { x1: 256, y1: 455, x2: 312, y2: 455, stroke: '#fff', 'stroke-width': 3, opacity: 0 }, S.capBox);
    S.meBond = E('line', { stroke: '#ff5a7a', 'stroke-width': 3, opacity: 0 }, S.capBox);
    S.capT1 = TXT(S.capBox, 92, 504, "① 5'末端にGが付加される", '#bfe9ff', 18, { opacity: 0 });
    S.capT2 = TXT(S.capBox, 92, 532, '② Gの7位の窒素がメチル化 → m⁷G（5\'キャップ）', '#ffb3c2', 18, { opacity: 0 });

    /* ---------- splicing close-up (slides 50–52) ---------- */
    S.sp = E('g', { opacity: 0 }, svg);
    S.intron = E('path', { fill: 'none', stroke: C.intron, 'stroke-width': 8, 'stroke-linecap': 'round' }, S.sp);
    S.e1 = E('line', { stroke: C.exon, 'stroke-width': 34 }, S.sp);
    S.e2 = E('line', { stroke: C.exon, 'stroke-width': 34 }, S.sp);
    S.e1t = TXT(S.sp, 0, 0, 'エクソン1', '#2a0c18', 18, { 'text-anchor': 'middle' });
    S.e2t = TXT(S.sp, 0, 0, 'エクソン2', '#2a0c18', 18, { 'text-anchor': 'middle' });
    S.e1five = TXT(S.sp, 0, 0, "5'", '#fff', 18, { 'text-anchor': 'end' });
    S.e2three = TXT(S.sp, 0, 0, "3'", '#fff', 18);
    S.gu = TXT(S.sp, 0, 0, 'GU', '#d59cff', 20, { 'text-anchor': 'middle' });
    S.ag = TXT(S.sp, 0, 0, 'AG', '#d59cff', 20, { 'text-anchor': 'middle' });
    S.Ab = E('g', {}, S.sp);
    E('circle', { r: 14, fill: C.a }, S.Ab);
    TXT(S.Ab, 0, 6, 'A', '#2a1208', 17, { 'text-anchor': 'middle' });
    S.siteLab = E('g', { opacity: 0 }, S.sp);
    S.s5 = TXT(S.siteLab, 0, 0, "5'スプライス部位", C.dim, 16, { 'text-anchor': 'middle' });
    S.sBr = TXT(S.siteLab, 0, 0, 'ブランチ部位', C.a, 16, { 'text-anchor': 'middle' });
    S.s3 = TXT(S.siteLab, 0, 0, "3'スプライス部位", C.dim, 16, { 'text-anchor': 'middle' });
    S.gtag = E('g', { opacity: 0 }, S.sp);
    TXT(S.gtag, 600, 252, 'GT-AGルール：イントロンは GT（RNAでは GU）で始まり AG で終わる', '#ffe08a', 18, { 'text-anchor': 'middle' });
    TXT(S.gtag, 600, 282, 'DNA（非鋳型鎖）…GT ……… A ……… AG…　→ 転写 →　RNA …GU ……… A ……… AG…', C.dim, 16, { 'text-anchor': 'middle' });
    S.U2AF = blob(S.sp, 'U2AF', SN.U2AF, 36, 22, 16);
    S.U1 = blob(S.sp, 'U1', SN.U1, 34, 28, 18);
    S.U2 = blob(S.sp, 'U2', SN.U2, 40, 28, 18);
    S.U4 = blob(S.sp, 'U4', SN.U4, 38, 26, 18);
    S.U6 = blob(S.sp, 'U6', SN.U6, 40, 26, 18);
    S.U5 = blob(S.sp, 'U5', SN.U5, 34, 28, 18);
    S.cut5 = E('line', { stroke: C.cut, 'stroke-width': 4, 'stroke-dasharray': '6 4', opacity: 0 }, S.sp);
    S.cut3 = E('line', { stroke: C.cut, 'stroke-width': 4, 'stroke-dasharray': '6 4', opacity: 0 }, S.sp);
    S.cutT = TXT(S.sp, 0, 0, '切断', C.cut, 16, { 'text-anchor': 'middle', opacity: 0 });
    S.lar = TXT(S.sp, 0, 0, '投げ縄構造（ラリアット）', '#ffe08a', 18, { 'text-anchor': 'end', opacity: 0 });
    S.gaLab = TXT(S.sp, 0, 0, 'G がブランチ部位の A と結合', '#d59cff', 16, { 'text-anchor': 'end', opacity: 0 });
    S.joinLab = TXT(S.sp, 800, 490, 'エクソン1とエクソン2がつながる', '#ffb3cc', 18, { 'text-anchor': 'middle', opacity: 0 });
    S.spSay = TXT(S.sp, 60, 512, '', C.txt, 18);

    /* ---------- nuclear envelope (STEP 6) ---------- */
    S.env = E('g', { opacity: 0 }, svg);
    [[60, 308], [352, 520]].forEach(([a, b]) => {
      E('line', { x1: 652, y1: a, x2: 652, y2: b, stroke: C.mem, 'stroke-width': 5 }, S.env);
      E('line', { x1: 672, y1: a, x2: 672, y2: b, stroke: C.mem, 'stroke-width': 5 }, S.env);
    });
    E('path', { d: 'M652 308 Q662 300 672 308 M652 352 Q662 360 672 352', stroke: C.mem, 'stroke-width': 4, fill: 'none' }, S.env);
    TXT(S.env, 680, 296, '核膜孔', C.mem, 16);
    TXT(S.env, 930, 110, '核', C.mem, 24, { 'text-anchor': 'middle' });
    TXT(S.env, 330, 110, '細胞質', C.mem, 24, { 'text-anchor': 'middle' });
    S.envT = TXT(S.env, 330, 450, '成熟mRNAは核から細胞質へ出る', C.txt, 18, { 'text-anchor': 'middle', opacity: 0 });

    /* ---------- alternative splicing (slide 49) ---------- */
    S.alt = E('g', { opacity: 0 }, svg);
    const AX = { E1: [220, 320, '#ff6b6b'], E2: [400, 422, '#51cf66'], E3: [490, 590, '#e6c84a'], E4: [640, 790, '#4c8dff'] };
    S.altX = AX;
    TXT(S.alt, 600, 100, '選択的スプライシング（スライド49）', C.txt, 20, { 'text-anchor': 'middle' });
    TXT(S.alt, 30, 177, 'mRNA前駆体', '#ffb3cc', 18);
    S.altPre = E('g', {}, S.alt);
    const rowAlt = (g, y, keys, ghost) => {
      const r = {};
      r.line = E('line', { x1: 220, y1: y, x2: 880, y2: y, stroke: C.rna, 'stroke-width': 4 }, g);
      r.cap = TXT(g, 212, y + 7, 'm⁷G', C.cap, 18, { 'text-anchor': 'end' });
      r.pa = TXT(g, 0, y - 10, 'ポリA', C.rna, 16);
      r.ex = {};
      keys.forEach((k) => {
        const [a, b, col] = AX[k];
        const rg = E('g', {}, g);
        E('rect', { x: 0, y: y - 13, width: b - a, height: 26, fill: col, stroke: '#0b0d14', 'stroke-width': 2 }, rg);
        TXT(rg, (b - a) / 2, y - 22, k, col, 16, { 'text-anchor': 'middle' });
        r.ex[k] = rg;
      });
      void ghost;
      return r;
    };
    S.altP = rowAlt(S.altPre, 170, ['E1', 'E2', 'E3', 'E4']);
    S.barA = E('g', { opacity: 0 }, S.alt);
    E('line', { x1: 320, y1: 204, x2: 490, y2: 204, stroke: '#ffffff', 'stroke-width': 5 }, S.barA);
    TXT(S.barA, 300, 210, 'A', '#fff', 18, { 'text-anchor': 'end' });
    S.barB = E('g', { opacity: 0 }, S.alt);
    E('line', { x1: 422, y1: 226, x2: 640, y2: 226, stroke: '#ffffff', 'stroke-width': 5 }, S.barB);
    TXT(S.barB, 660, 232, 'B', '#fff', 18);
    S.altNote = TXT(S.alt, 700, 222, 'この部分全体が1つのイントロンとしても機能しうる', C.dim, 16, { opacity: 0 });
    S.altA = E('g', { opacity: 0 }, S.alt);
    TXT(S.altA, 90, 336, 'Aの場合', '#fff', 18);
    S.rA = rowAlt(S.altA, 330, ['E1', 'E3', 'E4']);
    S.altB = E('g', { opacity: 0 }, S.alt);
    TXT(S.altB, 90, 446, 'Bの場合', '#fff', 18);
    S.rB = rowAlt(S.altB, 440, ['E1', 'E2', 'E4']);
    S.altEnd = TXT(S.alt, 600, 510, '1つの遺伝子から、複数の異なるmRNAができる', '#ffe08a', 18, { 'text-anchor': 'middle', opacity: 0 });

    /* ---------- RESULT summary ---------- */
    S.sum = E('g', { opacity: 0 }, svg);
    const chips = ["mRNA前駆体（5'ppp）", "5'キャップ m⁷G", 'スプライシング', 'ポリA付加', '核から細胞質へ'];
    chips.forEach((c, i) => {
      const x = 70 + i * 218;
      E('rect', { x, y: 176, width: 196, height: 44, rx: 10, fill: 'rgba(255,122,168,.12)', stroke: C.rna, 'stroke-width': 2 }, S.sum);
      TXT(S.sum, x + 98, 204, c, C.txt, 16, { 'text-anchor': 'middle' });
      if (i < 4) TXT(S.sum, x + 207, 205, '→', C.rna, 18, { 'text-anchor': 'middle' });
    });
    const yy = 300;
    E('circle', { cx: 210, cy: yy, r: 24, fill: C.cap }, S.sum);
    TXT(S.sum, 210, yy + 6, 'm⁷G', '#0e2414', 16, { 'text-anchor': 'middle' });
    TXT(S.sum, 172, yy + 7, "5'", '#fff', 18, { 'text-anchor': 'end' });
    [[236, 406, 'エクソン1'], [406, 546, 'エクソン2'], [546, 716, 'エクソン3']].forEach(([a, b, n]) => {
      E('line', { x1: a, y1: yy, x2: b, y2: yy, stroke: C.exon, 'stroke-width': 34 }, S.sum);
      E('line', { x1: b, y1: yy - 17, x2: b, y2: yy + 17, stroke: '#2a0c18', 'stroke-width': 2 }, S.sum);
      TXT(S.sum, (a + b) / 2, yy + 7, n, '#2a0c18', 18, { 'text-anchor': 'middle' });
    });
    TXT(S.sum, 680, yy - 28, 'AAUAAA', '#ffe08a', 16, { 'text-anchor': 'middle' });
    TXT(S.sum, 722, yy + 7, 'AAAAAAAAAA', C.a, 20);
    TXT(S.sum, 888, yy + 7, "3'", '#fff', 18);
    TXT(S.sum, 210, yy + 64, '5\'キャップ', C.cap, 16, { 'text-anchor': 'middle' });
    TXT(S.sum, 790, yy + 56, 'ポリA（20〜250個）', C.a, 16, { 'text-anchor': 'middle' });
    TXT(S.sum, 600, 430, 'イントロンは除かれ、キャップとポリAがエキソヌクレアーゼから守る', C.txt, 18, { 'text-anchor': 'middle' });
    TXT(S.sum, 600, 462, '核膜孔を通って細胞質へ ― リボソームで翻訳に使われる（スライド46）', C.dim, 16, { 'text-anchor': 'middle' });

    badge(svg, '真核生物（ヒト）');
    return S;
  },

  frame(S, t) {
    /* ===== row geometry ===== */
    const c1 = EZ(seg(t, 0.515, 0.53)), c2 = EZ(seg(t, 0.545, 0.575));
    const b2 = Math.sin(Math.PI * seg(t, 0.533, 0.575)) * 70;
    const wI1 = 230 * (1 - c1), wI2 = 180 * (1 - c2);
    const x0 = 160, e1b = x0 + 170, i1b = e1b + wI1, e2b = i1b + 140, i2b = e2b + wI2, e3b = i2b + 170, db = e3b + 90;
    const ex = [[x0, e1b], [i1b, e2b], [i2b, e3b]];
    ex.forEach(([a, b], k) => { ln(S.ex[k].l, a, 0, b, 0); S.ex[k].t.setAttribute('x', (a + b) / 2); });
    const loop = (el, a, b, h) => el.setAttribute('d', `M${a} 0 C${a - h * 0.25} ${-h * 1.4} ${b + h * 0.25} ${-h * 1.4} ${b} 0`);
    loop(S.i1, e1b, i1b, 0); loop(S.i2, e2b, i2b, b2);
    op(S.i1, 1 - c1); op(S.i2, 1 - fi(c2, 0.75, 1));
    S.i1t.setAttribute('x', (e1b + i1b) / 2); S.i2t.setAttribute('x', (e2b + i2b) / 2);
    op(S.i1t, 1 - fi(c1, 0, 0.3)); op(S.i2t, 1 - fi(c2, 0, 0.3));
    S.sig.setAttribute('x', e3b - 34);
    // poly(A): cleavage between AAUAAA and GU-rich sequence, downstream piece leaves
    const cut = EZ(seg(t, 0.597, 0.615));
    const dOff = 70 * cut;
    ln(S.dLine, e3b + dOff + 4, 0, db + dOff, 0); S.dGU.setAttribute('x', e3b + 50 + dOff);
    op(S.dSeg, 1 - fi(t, 0.612, 0.626));
    ln(S.cutA, e3b + 5, -38, e3b + 5, 38); op(S.cutA, win(t, 0.59, 0.62));
    const nA = Math.round(seg(t, 0.638, 0.672) * 10);
    S.pA.textContent = 'A'.repeat(nA); S.pA.setAttribute('x', e3b + 4);
    const pAw = nA * 15.6;
    op(S.pAlab, fi(t, 0.66, 0.675) * (1 - fi(t, 0.735, 0.745))); S.pAlab.setAttribute('x', e3b - 20);
    const end3 = t < 0.6 ? db : e3b + pAw;
    S.three.setAttribute('x', end3 + 10);
    op(S.three, t < 0.6 || t > 0.62 ? 1 : 0);
    // cap
    const capped = fi(t, 0.185, 0.195);
    op(S.cap, capped); op(S.ppp, 1 - capped);
    S.five.setAttribute('x', capped > 0.5 ? 108 : 108);
    op(S.hl, win(t, 0.205, 0.53)); S.hl.setAttribute('width', e2b - 150 + 10);

    /* ===== row transform ===== */
    const [tx, ty, sc] = kf(t, [[0.2, 0, 352, 1], [0.215, 30, 122, 0.8], [0.53, 30, 122, 0.8], [0.545, 30, 300, 1.15], [0.74, 30, 300, 1.15], [0.755, 585, 330, 0.8], [0.765, 585, 330, 0.8], [0.81, 30, 330, 0.8]]);
    S.row.setAttribute('transform', `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(3)})`);
    op(S.row, t < 0.82 ? 1 : 1 - fi(t, 0.82, 0.83));

    /* ===== transcription (Pol II runs left → right) ===== */
    const run = EZ(seg(t, 0.035, 0.115));
    const px = L(110, 1150, run);
    op(S.dna, 1 - fi(t, 0.2, 0.215));
    op(S.dnaLab, win(t, 0.035, 0.125));
    at(S.pol, px, 136); op(S.pol, fi(t, 0.03, 0.04) * (1 - fi(t, 0.118, 0.13)));
    S.polLab.setAttribute('x', px); S.polLab.setAttribute('y', 64); op(S.polLab, fi(t, 0.03, 0.04) * (1 - fi(t, 0.118, 0.13)));
    S.clip.setAttribute('x', t < 0.2 ? 60 : -400);
    S.clip.setAttribute('width', t < 0.035 ? 0 : t < 0.12 ? Math.max(0, px - 70) : 2400);
    const re = Math.min(px - 30, 1140);
    S.nasc.setAttribute('d', `M${re} 262 Q${px} 262 ${px} 170`);
    op(S.nasc, fi(t, 0.04, 0.045) * (1 - fi(t, 0.115, 0.122)));
    S.dirLab.setAttribute('x', Math.max(px - 40, 420)); S.dirLab.setAttribute('y', 334);
    op(S.dirLab, win(t, 0.045, 0.118));
    op(S.three, (t < 0.035 ? 0 : 1) * (t < 0.6 || t > 0.62 ? 1 : 0));
    if (t < 0.12) S.three.setAttribute('x', Math.min(px - 20, db + 10));

    /* ===== 5' cap ===== */
    at(S.capE, kf(t, [[0.12, 60], [0.135, 140]])[0], -58); op(S.capE, win(t, 0.12, 0.198));
    op(S.capBox, win(t, 0.122, 0.2, 0.006));
    const gIn = EZ(seg(t, 0.128, 0.148));
    at(S.gN, L(160, 230, gIn), L(410, 455, gIn));
    op(S.gN, fi(t, 0.124, 0.13));
    op(S.gBond, fi(t, 0.146, 0.15));
    op(S.capT1, fi(t, 0.14, 0.146));
    op(S.n7, fi(t, 0.158, 0.163));
    const mIn = EZ(seg(t, 0.163, 0.18));
    const gx = 230, gy = 455, nx = gx - 48, ny = gy - 21;
    at(S.me, L(nx + 90, nx - 4, mIn), L(ny - 70, ny - 46, mIn));
    op(S.me, fi(t, 0.16, 0.165));
    ln(S.meBond, nx, ny - 5, nx - 4, ny - 26); op(S.meBond, fi(t, 0.178, 0.182));
    op(S.capT2, fi(t, 0.176, 0.182));
    S.c5.setAttribute('x', t < 0.146 ? 340 : 140); S.c5.setAttribute('y', t < 0.146 ? 424 : 462);

    /* ===== splicing close-up ===== */
    op(S.sp, fi(t, 0.205, 0.22) * (1 - fi(t, 0.532, 0.545)));
    const P = kf(t, [
      //       e1a  e1b  e1y   Gx   Gy  c1x  c1y  c2x  c2y   Ax   Ay  AGx  AGy  e2a  e2b  e2y
      [0.2, 90, 330, 400, 345, 400, 480, 400, 620, 400, 760, 400, 865, 400, 880, 1110, 400],
      [0.335, 90, 330, 400, 345, 400, 480, 400, 620, 400, 760, 400, 865, 400, 880, 1110, 400],
      [0.37, 230, 470, 260, 485, 260, 330, 330, 340, 560, 620, 420, 780, 420, 800, 1030, 420],
      [0.405, 230, 470, 260, 485, 260, 330, 330, 340, 560, 620, 420, 780, 420, 800, 1030, 420],
      [0.42, 300, 540, 300, 555, 300, 380, 330, 370, 550, 620, 420, 780, 420, 800, 1030, 420],
      [0.432, 300, 540, 300, 555, 300, 380, 330, 370, 550, 620, 420, 780, 420, 800, 1030, 420],
      [0.46, 300, 540, 300, 607, 414, 380, 270, 380, 560, 620, 420, 780, 420, 800, 1030, 420],
      [0.475, 300, 540, 300, 607, 414, 380, 270, 380, 560, 620, 420, 780, 420, 800, 1030, 420],
      [0.49, 450, 690, 290, 607, 414, 380, 270, 380, 560, 620, 420, 780, 420, 800, 1030, 420],
      [0.505, 450, 690, 290, 607, 414, 380, 270, 380, 560, 620, 420, 768, 410, 800, 1030, 420],
      [0.515, 450, 690, 290, 607, 414, 380, 270, 380, 560, 620, 420, 768, 410, 800, 1030, 420],
      [0.53, 560, 800, 420, 607, 414, 380, 270, 380, 560, 620, 420, 768, 410, 800, 1030, 420],
    ]);
    const [e1a, e1bx, e1y, Gx, Gy, c1x, c1y, c2x, c2y, Ax, Ay, AGx, AGy, e2a, e2bx, e2y] = P;
    // lariat (with U2/U6) is released after the 3' cut
    const rel = EZ(seg(t, 0.505, 0.53));
    const ox = -160 * rel, oy = -90 * rel;
    ln(S.e1, e1a, e1y, e1bx, e1y); ln(S.e2, e2a, e2y, e2bx, e2y);
    S.e1t.setAttribute('x', (e1a + e1bx) / 2); S.e1t.setAttribute('y', e1y + 7);
    S.e2t.setAttribute('x', (e2a + e2bx) / 2); S.e2t.setAttribute('y', e2y + 7);
    S.e1five.setAttribute('x', e1a - 8); S.e1five.setAttribute('y', e1y + 7);
    S.e2three.setAttribute('x', e2bx + 8); S.e2three.setAttribute('y', e2y + 7);
    // before the 5' cut the intron starts right at the exon1 end
    const attached = t < 0.432;
    const sx = attached ? e1bx : Gx, sy = attached ? e1y : Gy;
    S.intron.setAttribute('d', `M${(sx + ox).toFixed(1)} ${(sy + oy).toFixed(1)} C${c1x + ox} ${c1y + oy} ${c2x + ox} ${c2y + oy} ${Ax + ox} ${Ay + oy} L${AGx + ox} ${AGy + oy}` + (t < 0.495 ? ` L${e2a} ${e2y}` : ''));
    op(S.intron, 1 - fi(t, 0.52, 0.53) * 0.75);
    at(S.Ab, Ax + ox, Ay + oy); op(S.Ab, 1 - fi(t, 0.52, 0.53) * 0.75);
    const lin = t < 0.345; S.gu.setAttribute('x', (attached ? e1bx + 24 : Gx - 50) + ox); S.gu.setAttribute('y', (lin ? e1y + 46 : attached ? e1y - 24 : Gy - 34) + oy);
    op(S.gu, 1 - fi(t, 0.52, 0.53));
    S.ag.setAttribute('x', AGx - 22 + ox); S.ag.setAttribute('y', AGy + 46 + oy);
    op(S.ag, 1 - fi(t, 0.52, 0.53));
    op(S.siteLab, win(t, 0.215, 0.338));
    S.s5.setAttribute('x', 345); S.s5.setAttribute('y', 482);
    S.sBr.setAttribute('x', 740); S.sBr.setAttribute('y', 482);
    S.s3.setAttribute('x', 900); S.s3.setAttribute('y', 482);
    op(S.gtag, win(t, 0.215, 0.265));
    // snRNPs
    const blobAt = (g, x, y, o) => { at(g, x, y); op(g, o); };
    blobAt(S.U1, attached ? e1bx + 20 : 520, attached ? e1y - 50 : 120, fi(t, 0.255, 0.27) * (1 - fi(t, 0.385, 0.398)));
    if (t < 0.27) at(S.U1, 365, L(250, 350, EZ(seg(t, 0.255, 0.27))));
    if (t > 0.375 && t < 0.4) at(S.U1, L(e1bx + 20, 420, EZ(seg(t, 0.375, 0.398))), L(e1y - 50, 170, EZ(seg(t, 0.375, 0.398))));
    const u2afIn = EZ(seg(t, 0.293, 0.305));
    blobAt(S.U2AF, (Ax + AGx) / 2 + 30, L(250, Ay - 40, u2afIn), fi(t, 0.293, 0.3) * (1 - fi(t, 0.4, 0.415)));
    const u2In = EZ(seg(t, 0.308, 0.322));
    blobAt(S.U2, Ax + ox, L(250, Ay - 42, u2In) + oy, fi(t, 0.308, 0.315) * (1 - fi(t, 0.515, 0.53)));
    const triIn = EZ(seg(t, 0.338, 0.36));
    const U6p = kf(t, [[0.338, 760, 60], [0.36, 640, 185], [0.405, 640, 185], [0.42, 620, 340]]);
    blobAt(S.U6, U6p[0] + ox, U6p[1] + oy, fi(t, 0.338, 0.345) * (1 - fi(t, 0.515, 0.53)));
    const U4p = kf(t, [[0.338, 760, 120], [0.36, 640, 237], [0.392, 640, 237], [0.41, 760, 90]]);
    blobAt(S.U4, U4p[0], U4p[1], fi(t, 0.338, 0.345) * (1 - fi(t, 0.398, 0.41)));
    const U5p = kf(t, [[0.338, 380, 60], [0.36, 480, 190], [0.405, 480, 190], [0.42, 545, 240], [0.475, 545, 240], [0.49, 730, 348], [0.515, 730, 348], [0.53, 800, 360]]);
    blobAt(S.U5, U5p[0], U5p[1], fi(t, 0.338, 0.345) * (1 - fi(t, 0.518, 0.53)));
    void triIn;
    // cuts
    ln(S.cut5, 548, 268, 548, 336); op(S.cut5, win(t, 0.425, 0.445));
    ln(S.cut3, 790, 388, 790, 452); op(S.cut3, win(t, 0.493, 0.51));
    const cutAt = t < 0.47 ? [548, 262] : [790, 476];
    S.cutT.setAttribute('x', cutAt[0]); S.cutT.setAttribute('y', cutAt[1]); op(S.cutT, Math.max(win(t, 0.425, 0.445), win(t, 0.493, 0.51)));
    S.lar.setAttribute('x', 360 + ox); S.lar.setAttribute('y', 430 + oy); op(S.lar, fi(t, 0.455, 0.465) * (1 - fi(t, 0.522, 0.532)));
    S.gaLab.setAttribute('x', 590 + ox); S.gaLab.setAttribute('y', 470 + oy); op(S.gaLab, win(t, 0.452, 0.49));
    op(S.joinLab, fi(t, 0.522, 0.53));
    const say = t < 0.25 ? '' : t < 0.29 ? '① U1 snRNP が 5\'末端の GU に結合' : t < 0.335 ? '② U2AF がブランチ部位の下流、U2 snRNP がブランチ部位に結合' : t < 0.37 ? '③ U4・U5・U6 snRNP が集まり、全ての因子がそろう' : t < 0.42 ? '④ U1 が放出 → U4 が放出、U6 は U2 に結合' : t < 0.47 ? '⑤ GU の5\'側で切断、G がブランチ部位の A と結合' : '⑤ U5 がエクソンを保持、AG の3\'側で切断 → エクソン結合';
    S.spSay.textContent = say;

    /* ===== poly(A) enzymes and protection (row coordinates) ===== */
    at(S.endo, e3b + 10, L(-150, -64, EZ(seg(t, 0.583, 0.595)))); op(S.endo, win(t, 0.583, 0.625));
    at(S.papol, e3b + pAw / 2 + 40, -60); op(S.papol, win(t, 0.632, 0.68));
    const exL = kf(t, [[0.685, -20], [0.705, 70], [0.715, 60], [0.735, 45]])[0];
    const exR = kf(t, [[0.685, e3b + pAw + 220], [0.705, e3b + pAw + 70], [0.715, e3b + pAw + 82], [0.735, e3b + pAw + 96]])[0];
    at(S.exoL, exL, 0); at(S.exoR, exR, 0);
    op(S.exoL, win(t, 0.684, 0.742)); op(S.exoR, win(t, 0.684, 0.742));
    op(S.shL, win(t, 0.703, 0.742)); op(S.shR, win(t, 0.703, 0.742));
    const sx2 = e3b + pAw + 16;
    S.shR.setAttribute('d', `M${sx2} -34 A40 40 0 0 1 ${sx2} 34`);

    /* ===== export through a nuclear pore ===== */
    op(S.env, fi(t, 0.742, 0.755) * (1 - fi(t, 0.82, 0.83)));
    op(S.envT, fi(t, 0.8, 0.81));

    /* ===== alternative splicing ===== */
    op(S.alt, fi(t, 0.825, 0.835) * (1 - fi(t, 0.918, 0.925)));
    const A0 = S.altX;
    // pre-mRNA row positions
    const place = (r, pos) => { Object.keys(r.ex).forEach((k) => at(r.ex[k], pos[k], 0)); };
    place(S.altP, { E1: A0.E1[0], E2: A0.E2[0], E3: A0.E3[0], E4: A0.E4[0] });
    S.altP.pa.setAttribute('x', 800); S.altP.line.setAttribute('x2', 870);
    op(S.barA, fi(t, 0.84, 0.845)); op(S.barB, fi(t, 0.868, 0.873)); op(S.altNote, fi(t, 0.845, 0.85));
    const ja = EZ(seg(t, 0.848, 0.862)), jb = EZ(seg(t, 0.876, 0.89));
    const w = (k) => A0[k][1] - A0[k][0];
    place(S.rA, { E1: A0.E1[0], E3: L(A0.E3[0], A0.E1[1], ja), E4: L(A0.E4[0], A0.E1[1] + w('E3'), ja) });
    const endA = L(A0.E4[1], A0.E1[1] + w('E3') + w('E4'), ja);
    S.rA.line.setAttribute('x2', endA + 80); S.rA.pa.setAttribute('x', endA + 12);
    place(S.rB, { E1: A0.E1[0], E2: L(A0.E2[0], A0.E1[1], jb), E4: L(A0.E4[0], A0.E1[1] + w('E2'), jb) });
    const endB = L(A0.E4[1], A0.E1[1] + w('E2') + w('E4'), jb);
    S.rB.line.setAttribute('x2', endB + 80); S.rB.pa.setAttribute('x', endB + 12);
    // the line between exons (introns) only shows before joining
    S.rA.line.setAttribute('opacity', 1); S.rB.line.setAttribute('opacity', 1);
    op(S.altA, fi(t, 0.845, 0.852)); op(S.altB, fi(t, 0.873, 0.88));
    op(S.altEnd, fi(t, 0.895, 0.9));

    /* ===== RESULT ===== */
    op(S.sum, fi(t, 0.925, 0.94));
  },
};

export default def;
