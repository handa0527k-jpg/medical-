// @ts-nocheck — imperative SVG drawing code; the public surface is typed via AnimDef below.
/**
 * mirna — 非コードRNA：miRNAの生成と働き・lncRNA・ncRNA遺伝子の欠失と疾患（スライド55, 56, 66–69）
 * Part 1 miRNA：RNA pol II → pri-miRNA（キャップ・ポリA・ヘアピン）→ Drosha（核）→ pre-miRNA（60–70nt）
 *   → Exportin5 → 細胞質 → Dicer → 成熟型miRNA（21–23nt）→ RISC → 標的mRNAに結合し翻訳を抑制
 * Part 2 lncRNA：200塩基以上・潜在的ORF ≤100アミノ酸残基。キャップ・ポリA・スプライシングを受けるが翻訳されない
 * Part 3 疾患：15番染色体のsnoRNA遺伝子群の欠失 → Prader-Willi症候群、13番染色体のmiRNA遺伝子群の欠失 → Feingold症候群
 * 色：非鋳型鎖 黄、鋳型鎖 青、RNA ピンク。転写は左→右。
 */
import { E, L, CL, EZ, seg, kf, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const C = { nt: '#f5c542', tp: '#3fb6ff', rna: '#ff7aa8', intron: '#9aa3b5', pol: '#8fd6ff', cap: '#7bd88f', a: '#ff8a65', mem: '#8aa0c8', txt: '#e8edf7', dim: '#b8c0d0', cut: '#ff5a5a', ok: '#7bd88f' };
const TXT = (par, x, y, s, fill, size = 18, extra = {}) => { const t = E('text', { x, y, fill, 'font-size': size, 'font-weight': 700, ...extra }, par); t.textContent = s; return t; };
const op = (el, v) => el.setAttribute('opacity', String(Math.max(0, Math.min(1, v))));
const fi = (t, a, b) => CL((t - a) / (b - a));
const win = (t, a, b, f = 0.012) => Math.min(fi(t, a, a + f), 1 - fi(t, b - f, b));
const at = (el, x, y, r = 0) => el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})` + (r ? ` rotate(${r.toFixed(1)})` : ''));
const blob = (par, name, col, rx = 50, ry = 26, fs = 17) => {
  const g = E('g', { opacity: 0 }, par);
  E('ellipse', { rx, ry, fill: col, 'fill-opacity': 0.88, stroke: '#ffffff', 'stroke-opacity': 0.45, 'stroke-width': 2 }, g);
  TXT(g, 0, 6, name, '#10131c', fs, { 'text-anchor': 'middle' });
  return g;
};
/** hairpin (stem-loop) drawn upward from its base at (0,0); returns { g, loop } */
const hairpin = (par, h = 64) => {
  const g = E('g', {}, par);
  const stem = E('g', {}, g);
  E('line', { x1: -7, y1: 0, x2: -7, y2: -h, stroke: C.rna, 'stroke-width': 5 }, stem);
  E('line', { x1: 7, y1: 0, x2: 7, y2: -h, stroke: C.rna, 'stroke-width': 5 }, stem);
  for (let y = -6; y > -h; y -= 9) E('line', { x1: -5, y1: y, x2: 5, y2: y, stroke: '#ffd0df', 'stroke-width': 2 }, stem);
  const loop = E('g', {}, g);
  E('path', { d: `M-7 ${-h} C-24 ${-h - 30} 24 ${-h - 30} 7 ${-h}`, fill: 'none', stroke: C.rna, 'stroke-width': 5 }, loop);
  return { g, stem, loop };
};
const badge = (svg, s) => {
  const g = E('g', {}, svg);
  E('rect', { x: 20, y: 46, width: 196, height: 34, rx: 8, fill: 'rgba(3,4,7,.75)', stroke: '#7bd88f', 'stroke-width': 2 }, g);
  TXT(g, 118, 69, s, '#a8f0b6', 18, { 'text-anchor': 'middle' });
};
const cross = (par, x, y, r = 14) => { const g = E('g', { opacity: 0 }, par); E('path', { d: `M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}`, stroke: C.cut, 'stroke-width': 5, 'stroke-linecap': 'round' }, g); return g; };

const def: AnimDef = {
  hud: (t) => t < 0.07 ? ['ncRNA', 'NON-CODING'] : t < 0.16 ? ['Pol II', 'pri-miRNA'] : t < 0.25 ? ['60–70nt', 'pre-miRNA'] : t < 0.35 ? ['Exportin5', '核→細胞質'] : t < 0.44 ? ['21–23nt', 'Dicer'] : t < 0.58 ? ['RISC', '翻訳抑制'] : t < 0.79 ? ['≥200nt', 'lncRNA'] : t < 0.92 ? ['欠失', '疾患'] : ['ncRNA', 'SUMMARY'],
  cam: () => [0, 0, 1200, 675],
  build(svg) {
    glowDefs(svg);
    const S = {};
    const defs = E('defs', {}, svg);
    const cp = E('clipPath', { id: 'mir-clip' }, defs);
    S.clip = E('rect', { x: 40, y: 250, width: 0, height: 220 }, cp);

    /* ---------- INTRO: transcripts and ncRNA classes (slides 55, 66) ---------- */
    S.intro = E('g', {}, svg);
    TXT(S.intro, 600, 176, 'ヒト全転写物 60,483（スライド55）', C.txt, 20, { 'text-anchor': 'middle' });
    const parts = [['ノンコーディングRNA 25,794', 25794, '#d59cff'], ['メッセンジャーRNA 19,814', 19814, C.rna], ['その他 14,285', 14285, '#8a94ad']];
    let x = 100;
    S.bars = parts.map(([n, v, col]) => {
      const w = (v / 60483) * 1000;
      const g = E('g', { opacity: 0 }, S.intro);
      E('rect', { x, y: 196, width: w - 4, height: 44, rx: 6, fill: col, 'fill-opacity': 0.85 }, g);
      TXT(g, x + w / 2, 224, n, '#10131c', 16, { 'text-anchor': 'middle' });
      x += w;
      return g;
    });
    const box = (bx, title, lines, col) => {
      const g = E('g', { opacity: 0 }, S.intro);
      E('rect', { x: bx, y: 282, width: 470, height: 200, rx: 12, fill: 'rgba(255,255,255,.04)', stroke: col, 'stroke-width': 2 }, g);
      TXT(g, bx + 20, 316, title, col, 20);
      lines.forEach((l, i) => TXT(g, bx + 24, 352 + i * 32, '・' + l, C.txt, 17));
      return g;
    };
    S.boxS = box(90, 'small ncRNA ＝ microRNA（miRNA）', ['200nt未満（miRNAは約22塩基）', 'RNAポリメラーゼIIで転写される', 'エンドヌクレアーゼでプロセシングされる', '保存性が高い'], '#d59cff');
    S.boxL = box(640, 'long ncRNA（lncRNA）', ['200nt以上', 'RNAポリメラーゼIIで転写される', '多くは5\'キャップ・ポリA・スプライシング', '保存性が低い'], '#ffd54f');
    TXT(S.intro, 600, 512, 'スライド66の図（Circulation Research 2017）より', C.dim, 16, { 'text-anchor': 'middle' });

    /* ---------- PART 1: miRNA ---------- */
    S.p1 = E('g', { opacity: 0 }, svg);
    // nucleus / cytoplasm
    [[150, 308], [362, 524]].forEach(([a, b]) => {
      E('line', { x1: 552, y1: a, x2: 552, y2: b, stroke: C.mem, 'stroke-width': 5 }, S.p1);
      E('line', { x1: 572, y1: a, x2: 572, y2: b, stroke: C.mem, 'stroke-width': 5 }, S.p1);
    });
    E('path', { d: 'M552 308 Q562 300 572 308 M552 362 Q562 370 572 362', stroke: C.mem, 'stroke-width': 4, fill: 'none' }, S.p1);
    TXT(S.p1, 280, 128, '核', C.mem, 24, { 'text-anchor': 'middle' });
    TXT(S.p1, 760, 128, '細胞質', C.mem, 24, { 'text-anchor': 'middle' });
    TXT(S.p1, 580, 296, '核膜孔', C.mem, 16);
    // miRNA gene with RNA pol II
    S.gene = E('g', {}, S.p1);
    E('rect', { x: 150, y: 168, width: 340, height: 60, fill: 'rgba(213,156,255,.14)', stroke: 'rgba(213,156,255,.6)', 'stroke-width': 1.5 }, S.gene);
    TXT(S.gene, 320, 160, 'miRNA遺伝子', '#e3c2ff', 18, { 'text-anchor': 'middle' });
    E('line', { x1: 50, y1: 180, x2: 530, y2: 180, stroke: C.nt, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.gene);
    E('line', { x1: 50, y1: 216, x2: 530, y2: 216, stroke: C.tp, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.gene);
    for (let xx = 60; xx < 528; xx += 20) E('line', { x1: xx, y1: 185, x2: xx, y2: 211, stroke: '#6c7690', 'stroke-width': 2, opacity: 0.6 }, S.gene);
    TXT(S.gene, 26, 186, "5'", C.nt, 18); TXT(S.gene, 26, 222, "3'", C.tp, 18);
    TXT(S.gene, 50, 250, "鋳型鎖（3'→5'に読まれる）", C.tp, 16);
    S.pol = E('g', { opacity: 0 }, S.p1);
    E('ellipse', { rx: 52, ry: 36, fill: 'rgba(143,214,255,.2)', stroke: C.pol, 'stroke-width': 3 }, S.pol);
    TXT(S.pol, 0, -46, 'RNA pol II', '#cfeeff', 16, { 'text-anchor': 'middle' });
    S.nasc = E('path', { fill: 'none', stroke: C.rna, 'stroke-width': 5, opacity: 0 }, S.p1);
    // pri-miRNA (cap, hairpins, poly(A))
    S.pri = E('g', { 'clip-path': 'url(#mir-clip)' }, S.p1);
    S.priRest = E('g', {}, S.pri);
    E('line', { x1: 140, y1: 420, x2: 470, y2: 420, stroke: C.rna, 'stroke-width': 5 }, S.priRest);
    TXT(S.priRest, 134, 426, 'm⁷Gppp', C.cap, 16, { 'text-anchor': 'end' });
    S.priA = TXT(S.priRest, 476, 426, 'AAAAA', C.a, 16);
    S.hp = [200, 300, 400].map((hx) => { const h = hairpin(hx === 300 ? S.pri : S.priRest); at(h.g, hx, 420); return h; });
    S.priLab = TXT(S.p1, 300, 470, 'pri-miRNA（キャップ・ポリA・ヘアピン構造）', '#ffb3cc', 17, { 'text-anchor': 'middle', opacity: 0 });
    // processing enzymes
    S.drosha = blob(S.p1, 'Drosha', '#f6a5c0', 52, 22);
    S.cutD = E('g', { opacity: 0 }, S.p1);
    E('line', { x1: 280, y1: 404, x2: 280, y2: 436, stroke: C.cut, 'stroke-width': 4, 'stroke-dasharray': '5 3' }, S.cutD);
    E('line', { x1: 320, y1: 404, x2: 320, y2: 436, stroke: C.cut, 'stroke-width': 4, 'stroke-dasharray': '5 3' }, S.cutD);
    S.preLab = TXT(S.p1, 0, 0, 'pre-miRNA（60–70nt）', '#ffb3cc', 17, { opacity: 0 });
    S.exp = blob(S.p1, 'Exportin5', '#a9e4d0', 58, 22, 16);
    S.dicer = blob(S.p1, 'Dicer', '#ffd08a', 44, 22);
    S.cutDi = E('line', { stroke: C.cut, 'stroke-width': 4, 'stroke-dasharray': '5 3', opacity: 0 }, S.p1);
    S.matLab = TXT(S.p1, 640, 400, '成熟型miRNA（21–23nt）', '#ffb3cc', 17, { opacity: 0 });
    // RISC with one miRNA strand
    S.risc = E('g', { opacity: 0 }, S.p1);
    E('ellipse', { rx: 74, ry: 40, fill: 'rgba(169,180,255,.28)', stroke: '#a9b4ff', 'stroke-width': 3 }, S.risc);
    TXT(S.risc, 0, -14, 'RISC', '#d6dbff', 18, { 'text-anchor': 'middle' });
    E('line', { x1: -32, y1: 14, x2: 32, y2: 14, stroke: C.rna, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.risc);
    S.riscLab = TXT(S.p1, 0, 0, 'RNA–タンパク質複合体', '#d6dbff', 16, { 'text-anchor': 'middle', opacity: 0 });
    // target mRNA in the cytoplasm
    S.tgt = E('g', { opacity: 0 }, S.p1);
    E('line', { x1: 660, y1: 478, x2: 1110, y2: 478, stroke: C.rna, 'stroke-width': 6 }, S.tgt);
    E('circle', { cx: 640, cy: 478, r: 24, fill: C.cap }, S.tgt);
    TXT(S.tgt, 640, 484, 'm⁷G', '#0e2414', 16, { 'text-anchor': 'middle' });
    TXT(S.tgt, 1114, 484, 'AAAA', C.a, 16);
    TXT(S.tgt, 760, 512, '標的mRNA', '#ffb3cc', 17, { 'text-anchor': 'middle' });
    S.pair = E('g', { opacity: 0 }, S.p1);
    for (let k = 0; k < 7; k++) E('line', { x1: 874 + k * 9, y1: 462, x2: 874 + k * 9, y2: 474, stroke: '#ffd0df', 'stroke-width': 2 }, S.pair);
    S.rib = E('g', { opacity: 0 }, S.p1);
    E('ellipse', { cx: 0, cy: -16, rx: 40, ry: 20, fill: 'rgba(255,169,77,.2)', stroke: '#ffa94d', 'stroke-width': 3 }, S.rib);
    E('ellipse', { cx: 0, cy: 14, rx: 32, ry: 12, fill: 'rgba(255,169,77,.14)', stroke: '#ffa94d', 'stroke-width': 3 }, S.rib);
    TXT(S.rib, 0, -46, 'リボソーム', '#ffd8a8', 16, { 'text-anchor': 'middle' });
    S.ribX = cross(S.p1, 780, 462, 22);
    S.supLab = E('g', { opacity: 0 }, S.p1);
    TXT(S.supLab, 1170, 220, '標的mRNAに結合し、', C.txt, 18, { 'text-anchor': 'end' });
    TXT(S.supLab, 1170, 248, 'その翻訳を抑制する（スライド56）', '#ffd08a', 18, { 'text-anchor': 'end' });
    TXT(S.supLab, 1170, 276, '→ タンパク質合成に使われない', C.dim, 16, { 'text-anchor': 'end' });

    /* ---------- PART 2: lncRNA vs mRNA (slides 68, 69) ---------- */
    S.p2 = E('g', { opacity: 0 }, svg);
    const mkRow = (y, name, nEx) => {
      const r = { y, ex: [], in: [] };
      TXT(S.p2, 30, y + 8, name, '#fff', 22);
      E('path', { d: `M126 ${y - 34} V${y - 4} H142 M134 ${y - 12} L144 ${y - 4} L134 ${y + 4}`, fill: 'none', stroke: C.dim, 'stroke-width': 3 }, S.p2);
      TXT(S.p2, 112, y - 42, 'Pol II', C.dim, 16);
      r.g = E('g', {}, S.p2);
      r.cap = E('g', { opacity: 0 }, r.g);
      E('rect', { x: 0, y: y - 18, width: 40, height: 36, rx: 4, fill: C.cap }, r.cap);
      TXT(r.cap, 20, y + 6, "5'", '#0e2414', 18, { 'text-anchor': 'middle' });
      for (let k = 0; k < nEx; k++) {
        const l = E('line', { y1: y, y2: y, stroke: C.rna, 'stroke-width': 30 }, r.g);
        const t = TXT(r.g, 0, y + 7, String(k + 1), '#2a0c18', 18, { 'text-anchor': 'middle' });
        r.ex.push({ l, t });
        if (k < nEx - 1) r.in.push(E('path', { fill: 'none', stroke: C.intron, 'stroke-width': 6 }, r.g));
      }
      r.pa = TXT(r.g, 0, y + 7, 'AAAAAAA', C.a, 18, { opacity: 0 });
      r.lab = TXT(S.p2, 160, y + 50, '', C.dim, 16);
      return r;
    };
    S.rM = mkRow(210, 'mRNA', 5);
    S.rL = mkRow(350, 'lncRNA', 3);
    S.rM.lab.textContent = 'エクソンは多いことが多い（図：5個以上）';
    S.rL.lab.textContent = 'エクソンは少ないことが多い（図：3個以下）';
    const chip = (x, y, s, col) => { const g = E('g', { opacity: 0 }, S.p2); E('rect', { x, y: y - 22, width: 140, height: 44, rx: 8, fill: 'rgba(255,255,255,.05)', stroke: col, 'stroke-width': 2 }, g); TXT(g, x + 70, y + 6, s, col, 17, { 'text-anchor': 'middle' }); return g; };
    const arrow = (x, y, col) => { const g = E('g', { opacity: 0 }, S.p2); E('path', { d: `M${x} ${y} H${x + 22} M${x + 14} ${y - 7} L${x + 23} ${y} L${x + 14} ${y + 7}`, fill: 'none', stroke: col, 'stroke-width': 3 }, g); return g; };
    S.chM = [chip(700, 210, 'スプライシング', C.ok), arrow(846, 210, C.ok), chip(876, 210, 'リボソーム', '#ffa94d'), arrow(1022, 210, C.ok), chip(1052, 210, 'タンパク質', C.ok)];
    S.chL = [chip(700, 350, 'スプライシング', C.ok), arrow(846, 350, '#6c7690'), chip(876, 350, 'リボソーム', '#6c7690'), arrow(1022, 350, '#6c7690'), chip(1052, 350, 'タンパク質', '#6c7690')];
    S.xL1 = cross(S.p2, 857, 350, 13); S.xL2 = cross(S.p2, 1033, 350, 13);
    S.noTr = TXT(S.p2, 1040, 404, '翻訳は行われない', C.cut, 18, { 'text-anchor': 'middle', opacity: 0 });
    S.p2t = E('g', { opacity: 0 }, S.p2);
    TXT(S.p2t, 40, 448, 'lncRNA：200塩基以上、かつ潜在的なORFが100アミノ酸残基以下のRNA（スライド68）', C.txt, 18);
    TXT(S.p2t, 40, 478, 'mRNAと同様に転写され、5\'キャップ・ポリAが付加され、スプライシングまで行われる。しかし翻訳はされない', '#ffe08a', 16);
    TXT(S.p2t, 40, 508, '図の記載（スライド69）：X-chromosome inactivation / Stem cell proliferation / Tumorigenesis / Neurodegeneration / Other roles?', C.dim, 16);

    /* ---------- PART 3: ncRNA gene clusters and disease (slide 56) ---------- */
    S.p3 = E('g', { opacity: 0 }, svg);
    const chrom = (y, name, cx0, cw, col, cname) => {
      const c = { y };
      TXT(S.p3, 80, y - 34, name, '#fff', 20);
      E('rect', { x: 80, y: y - 16, width: 52, height: 32, rx: 16, fill: '#5c6b8a' }, S.p3);
      E('circle', { cx: 142, cy: y, r: 9, fill: '#c7d2e8' }, S.p3);
      c.left = E('rect', { x: 152, y: y - 18, width: cx0 - 152, height: 36, rx: 10, fill: '#5c6b8a' }, S.p3);
      c.clu = E('g', {}, S.p3);
      E('rect', { x: cx0, y: y - 18, width: cw, height: 36, fill: col }, c.clu);
      TXT(c.clu, cx0 + cw / 2, y - 28, cname, col, 16, { 'text-anchor': 'middle' });
      c.right = E('rect', { x: cx0 + cw, y: y - 18, width: 520 - cx0 - cw, height: 36, rx: 10, fill: '#5c6b8a' }, S.p3);
      c.del = TXT(S.p3, cx0 + cw / 2, y + 44, '欠失', C.cut, 18, { 'text-anchor': 'middle', opacity: 0 });
      c.cx0 = cx0; c.cw = cw;
      return c;
    };
    S.c15 = chrom(220, '15番染色体', 270, 70, '#ffd54f', 'snoRNA遺伝子群');
    S.c13 = chrom(400, '13番染色体', 360, 70, '#ff9ec0', 'miRNA遺伝子群');
    const dz = (y, title, feat, col) => {
      const g = E('g', { opacity: 0 }, S.p3);
      E('path', { d: `M548 ${y} H600 M590 ${y - 9} L602 ${y} L590 ${y + 9}`, stroke: col, 'stroke-width': 4, fill: 'none' }, g);
      E('rect', { x: 618, y: y - 46, width: 540, height: 92, rx: 12, fill: 'rgba(255,255,255,.05)', stroke: col, 'stroke-width': 2 }, g);
      TXT(g, 640, y - 10, title, col, 22);
      TXT(g, 640, y + 24, feat, C.txt, 17);
      return g;
    };
    S.dPW = dz(220, 'Prader-Willi症候群', '肥満・性腺機能低下・認知障害を特徴とする', '#ffd54f');
    S.dFG = dz(400, 'Feingold症候群', '小頭症・低身長・手指の奇形を特徴とする骨格系疾患', '#ff9ec0');
    TXT(S.p3, 600, 510, 'スライド56の記載どおり（染色体上の位置は模式図）', C.dim, 16, { 'text-anchor': 'middle' });

    /* ---------- RESULT ---------- */
    S.sum = E('g', { opacity: 0 }, svg);
    const sc = (x, y, w, s, col) => { E('rect', { x, y: y - 22, width: w, height: 44, rx: 10, fill: 'rgba(255,122,168,.1)', stroke: col, 'stroke-width': 2 }, S.sum); TXT(S.sum, x + w / 2, y + 6, s, C.txt, 16, { 'text-anchor': 'middle' }); };
    const sa = (x, y, lab) => { TXT(S.sum, x, y + 6, '→', C.rna, 20, { 'text-anchor': 'middle' }); TXT(S.sum, x, y - 28, lab, '#ffd08a', 16, { 'text-anchor': 'middle' }); };
    TXT(S.sum, 60, 180, 'miRNA（スライド67）', '#d59cff', 18);
    sc(60, 226, 190, 'pri-miRNA（核）', C.rna); sa(290, 226, 'Drosha'); sc(330, 226, 220, 'pre-miRNA 60–70nt', C.rna); sa(600, 226, 'Exportin5'); sc(650, 226, 160, '細胞質へ', C.rna); sa(850, 226, 'Dicer'); sc(890, 226, 250, '成熟型miRNA 21–23nt', C.rna);
    sc(330, 306, 220, 'RISCを形成', '#a9b4ff'); sa(600, 306, ''); sc(650, 306, 490, '標的mRNAに結合し、その翻訳を抑制', '#a9b4ff');
    TXT(S.sum, 60, 390, 'lncRNA：200塩基以上・キャップ・ポリA・スプライシングあり、翻訳されない（スライド68・69）', '#ffe08a', 17);
    TXT(S.sum, 60, 430, '15番染色体 snoRNA遺伝子群の欠失 → Prader-Willi症候群', '#ffd54f', 17);
    TXT(S.sum, 60, 462, '13番染色体 miRNA遺伝子群の欠失 → Feingold症候群（スライド56）', '#ff9ec0', 17);

    badge(svg, '真核生物（ヒト）');
    return S;
  },

  frame(S, t) {
    /* INTRO */
    op(S.intro, 1 - fi(t, 0.068, 0.078));
    S.bars.forEach((b, i) => op(b, fi(t, 0.005 + i * 0.006, 0.012 + i * 0.006)));
    op(S.boxS, fi(t, 0.03, 0.038)); op(S.boxL, fi(t, 0.04, 0.048));

    /* PART 1 */
    op(S.p1, fi(t, 0.072, 0.082) * (1 - fi(t, 0.578, 0.59)));
    const run = EZ(seg(t, 0.085, 0.14));
    const px = L(70, 540, run);
    at(S.pol, px, 198); op(S.pol, fi(t, 0.08, 0.087) * (1 - fi(t, 0.142, 0.15)));
    S.clip.setAttribute('width', t < 0.085 ? 0 : t < 0.145 ? Math.max(0, px - 50) : 1200);
    S.nasc.setAttribute('d', `M${Math.min(px - 20, 470)} 420 Q${px} 420 ${px} 230`);
    op(S.nasc, fi(t, 0.088, 0.092) * (1 - fi(t, 0.138, 0.145)));
    op(S.gene, 1 - fi(t, 0.155, 0.17) * 0.7);
    op(S.priLab, win(t, 0.13, 0.205));
    // Drosha cuts the stem-loop out of pri-miRNA
    at(S.drosha, 300, L(530, 452, EZ(seg(t, 0.168, 0.185)))); op(S.drosha, win(t, 0.168, 0.24));
    op(S.cutD, win(t, 0.19, 0.212));
    op(S.priRest, 1 - fi(t, 0.215, 0.235));
    // pre-miRNA path: lifts, then Exportin5 carries it through the pore (turning to horizontal)
    const H = kf(t, [[0.212, 300, 420, 0], [0.24, 300, 340, 0], [0.27, 300, 340, 0], [0.29, 430, 335, 90], [0.315, 600, 335, 90], [0.335, 650, 335, 90]]);
    const [hx, hy, hr] = H;
    at(S.hp[1].g, hx, hy, hr);
    S.preLab.setAttribute('x', t < 0.27 ? 340 : 650); S.preLab.setAttribute('y', t < 0.27 ? 300 : 290);
    op(S.preLab, win(t, 0.232, 0.36));
    at(S.exp, hx + (t < 0.27 ? 66 : 40), hy + (t < 0.27 ? -40 : -42)); op(S.exp, win(t, 0.255, 0.35));
    // Dicer removes the loop → 21–23 nt mature miRNA
    at(S.dicer, L(900, 760, EZ(seg(t, 0.36, 0.378))), 300); op(S.dicer, win(t, 0.36, 0.43));
    const lx = hx + 64 + 4; // loop sits at the right end once the hairpin is horizontal
    S.cutDi.setAttribute('x1', lx); S.cutDi.setAttribute('x2', lx); S.cutDi.setAttribute('y1', hy - 24); S.cutDi.setAttribute('y2', hy + 24);
    op(S.cutDi, win(t, 0.382, 0.4));
    const lo = EZ(seg(t, 0.398, 0.42));
    S.hp[1].loop.setAttribute('transform', `translate(${(-30 * lo).toFixed(1)},${(-60 * lo).toFixed(1)})`);
    op(S.hp[1].loop, 1 - fi(t, 0.405, 0.425));
    op(S.matLab, win(t, 0.415, 0.47));
    // RISC forms; the duplex crossfades into RISC holding one strand
    const riscP = kf(t, [[0.44, 682, 335], [0.47, 682, 335], [0.51, 905, 450]]);
    at(S.risc, riscP[0], riscP[1]); op(S.risc, fi(t, 0.44, 0.455));
    op(S.hp[1].g, 1 - fi(t, 0.45, 0.462));
    S.riscLab.setAttribute('x', riscP[0]); S.riscLab.setAttribute('y', riscP[1] - 52); op(S.riscLab, win(t, 0.452, 0.5));
    op(S.tgt, fi(t, 0.47, 0.485));
    op(S.pair, fi(t, 0.51, 0.518));
    at(S.rib, L(700, 780, EZ(seg(t, 0.52, 0.535))), 470); op(S.rib, fi(t, 0.518, 0.525));
    op(S.ribX, fi(t, 0.538, 0.545));
    op(S.supLab, fi(t, 0.53, 0.54));

    /* PART 2: lncRNA */
    op(S.p2, fi(t, 0.585, 0.595) * (1 - fi(t, 0.785, 0.795)));
    const sp = EZ(seg(t, 0.64, 0.665));
    const pop = Math.sin(Math.PI * seg(t, 0.632, 0.665)) * 34;
    const drawRow = (r, grow) => {
      let xx = 190;
      r.ex.forEach((e, k) => {
        const a = xx, b = xx + 56;
        e.l.setAttribute('x1', a); e.l.setAttribute('x2', b); e.t.setAttribute('x', (a + b) / 2);
        op(e.l, grow * 6 - k > 0.5 ? 1 : 0); op(e.t, grow * 6 - k > 0.5 ? 1 : 0);
        xx = b;
        if (k < r.in.length) {
          const w = 46 * (1 - sp);
          r.in[k].setAttribute('d', `M${xx} ${r.y} C${xx - pop * 0.3} ${r.y - pop * 1.6} ${xx + w + pop * 0.3} ${r.y - pop * 1.6} ${xx + w} ${r.y}`);
          op(r.in[k], (grow * 6 - k > 0.9 ? 1 : 0) * (1 - fi(sp, 0.7, 1)));
          xx += w;
        }
      });
      r.pa.setAttribute('x', xx + 6);
      return xx;
    };
    const grow = seg(t, 0.598, 0.622);
    drawRow(S.rM, grow); drawRow(S.rL, grow);
    [S.rM, S.rL].forEach((r) => { at(r.cap, 146, 0); op(r.cap, fi(t, 0.622, 0.628)); op(r.pa, fi(t, 0.626, 0.632)); });
    op(S.rM.lab, fi(t, 0.605, 0.615)); op(S.rL.lab, fi(t, 0.605, 0.615));
    S.chM.forEach((c, i) => op(c, fi(t, 0.672 + i * 0.006, 0.678 + i * 0.006)));
    S.chL.forEach((c, i) => op(c, fi(t, 0.705 + i * 0.006, 0.711 + i * 0.006)));
    op(S.xL1, fi(t, 0.716, 0.72)); op(S.xL2, fi(t, 0.728, 0.732)); op(S.noTr, fi(t, 0.732, 0.738));
    op(S.p2t, fi(t, 0.745, 0.755));

    /* PART 3: disease */
    op(S.p3, fi(t, 0.792, 0.802) * (1 - fi(t, 0.918, 0.925)));
    const delC = (c, a, b) => {
      const d = EZ(seg(t, a, b));
      op(c.clu, 1 - fi(t, a - 0.01, a + 0.004));
      c.right.setAttribute('x', c.cx0 + c.cw - c.cw * d);
      op(c.del, fi(t, a - 0.01, a));
    };
    delC(S.c15, 0.82, 0.835); delC(S.c13, 0.865, 0.88);
    op(S.dPW, fi(t, 0.838, 0.846)); op(S.dFG, fi(t, 0.883, 0.891));

    /* RESULT */
    op(S.sum, fi(t, 0.925, 0.94));
  },
};

export default def;
