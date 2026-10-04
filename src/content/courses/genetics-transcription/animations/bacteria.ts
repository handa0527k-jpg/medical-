// @ts-nocheck — imperative SVG drawing code; the public surface is typed via AnimDef below.
/**
 * bacteria — 細菌のRNAポリメラーゼによる転写サイクル（スライド13–21）  modes: loop / rho
 * core enzyme + σ = holoenzyme → promoter (−35 TTGACA, −10 TATAAT) → closed → open complex →
 * first ribonucleotides → ~10 nt: σ released → elongation → termination
 * (loop: palindrome RNA forms a stem-loop, polymerase stops, weak A–U pairs let the RNA fall off;
 *  rho: ρ protein binds the RNA and breaks the DNA–RNA pairs of the stopped polymerase) → recycle.
 * Colours as in `template`: non-template #f5c542 (top), template #3fb6ff (bottom), RNA #ff7aa8.
 */
import { E, L, CL, EZ, seg, kf, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const BASE = { A: '#ff8a65', T: '#ffd54f', G: '#4fc3f7', C: '#81e39a', U: '#d59cff' };
const COL = { nt: '#f5c542', tp: '#3fb6ff', rna: '#ff7aa8', pol: '#8fd6ff', sig: '#d9714e', rho: '#8fbf5a' };
const TXT = (par, x, y, s, fill, size = 18, extra = {}) => { const t = E('text', { x, y, fill, 'font-size': size, 'font-weight': 700, ...extra }, par); t.textContent = s; return t; };
const op = (el, v) => el.setAttribute('opacity', String(Math.max(0, Math.min(1, v))));
const fadeIn = (t, a, b) => CL((t - a) / (b - a));
const win = (t, a, b, f = 0.02) => Math.min(fadeIn(t, a, a + f), 1 - fadeIn(t, b - f, b));

const yT = 200, yB = 240, RY = 220, HYB = 100;
const X1 = 340, DX = 14; // +1 and nucleotide spacing
const xk = (k) => X1 + DX * k;
// RNA letters (k = 21..52): 5' flank, stem 5' side, loop, stem 3' side (slide 21), then the U stretch (slide 20)
const LET = 'UAUACU' + 'GCAGGCU' + 'AUCG' + 'AGCCUGC' + 'UUUUUUUU';
const K0 = 21, PAL = 27, USTART = 45, NT = 53;
const letterOf = (k) => (k >= K0 && k < NT ? LET[k - K0] : '');

/** nucleotides made (continuous) */
const qOf = (t) => {
  if (t < 0.26) return 0;
  if (t < 0.3) return 2 * seg(t, 0.26, 0.3);
  if (t < 0.4) return 2 + 8 * seg(t, 0.3, 0.4);
  if (t < 0.46) return 10 + 2 * seg(t, 0.4, 0.46);
  if (t < 0.64) return 12 + 15 * seg(t, 0.46, 0.64);
  const u = seg(t, 0.64, 0.74);
  return 27 + 26 * (1 - (1 - u) * (1 - u));
};
const xaOf = (q) => xk(Math.max(0, q - 1));

/** linear position of an RNA nucleotide d px behind the 3' end (hybrid → exit channel → trailing tail) */
const linPos = (xr, d) => {
  if (d <= HYB) return [xr - d, RY];
  const s = d - HYB;
  if (s < 80) {
    const u = s / 80, a = [xr - HYB, RY], c = [xr - HYB - 5, 300], b = [xr - HYB - 80, 310];
    return [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];
  }
  return [xr - HYB - 80 - (s - 80), 310 + 7 * Math.sin((s - 80) / 35)];
};
/** folded (stem-loop) position, anchored at (bx, yH) */
const foldPos = (k, bx, yH) => {
  if (k < PAL) return [bx - 12 - DX * (PAL - k), yH];
  if (k < PAL + 7) return [bx - 12, yH + 18 + 19 * (k - PAL)];
  if (k < PAL + 11) return [[bx - 15, yH + 151], [bx - 8, yH + 170], [bx + 8, yH + 170], [bx + 15, yH + 151]][k - PAL - 7];
  if (k < USTART) return [bx + 12, yH + 18 + 19 * (6 - (k - PAL - 11))];
  return null;
};

const def: AnimDef = {
  hud: (t, m) => {
    if (t < 0.1) return ['コア＋σ', 'ホロ酵素'];
    if (t < 0.18) return ['−35／−10', 'プロモーター'];
    if (t < 0.26) return ['閉→開', '二本鎖をほどく'];
    if (t < 0.4) return ['+1, +2 …', '転写開始'];
    if (t < 0.46) return ['約10 nt', 'σ因子の解離'];
    if (t < 0.64) return ["5'→3'", '伸長'];
    if (t < 0.8) return m === 'rho' ? ['ρ', '停止したポリメラーゼ'] : ['ステムループ', '停止'];
    if (t < 0.88) return m === 'rho' ? ['ρ', '塩基対を壊す'] : ['A–U', 'RNAが外れる'];
    return ['σ＋コア', '次のサイクルへ'];
  },
  cam: (t) => kf(t, [[0, 250, 0, 900, 506], [0.08, 250, 0, 900, 506], [0.13, 0, 40, 900, 506], [0.44, 0, 40, 900, 506], [0.5, 0, 0, 1200, 675], [0.62, 0, 0, 1200, 675], [0.67, 300, 30, 900, 506], [0.86, 300, 30, 900, 506], [0.92, 0, 0, 1200, 675], [1, 0, 0, 1200, 675]]),
  build(svg, mode) {
    glowDefs(svg);
    const S = { mode: mode || 'loop' };
    const W = (S.W = E('g', {}, svg));
    S.rnaL = E('g', {}, W);
    S.dnaL = E('g', {}, W);
    S.labL = E('g', {}, W);
    S.polL = E('g', {}, W);
    S.topL = E('g', {}, W);

    // DNA
    S.rungs = [];
    for (let x = 18; x <= 1180; x += DX) S.rungs.push({ x, a: E('line', { stroke: COL.nt, 'stroke-width': 3, opacity: 0.7 }, S.dnaL), b: E('line', { stroke: COL.tp, 'stroke-width': 3, opacity: 0.7 }, S.dnaL) });
    S.top = E('path', { fill: 'none', stroke: COL.nt, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.dnaL);
    E('line', { x1: 18, y1: yB, x2: 1180, y2: yB, stroke: COL.tp, 'stroke-width': 6, 'stroke-linecap': 'round' }, S.dnaL);
    TXT(S.labL, 0, yT + 6, "5'", '#fff', 16); TXT(S.labL, 1184, yT + 6, "3'", '#fff', 16);
    TXT(S.labL, 0, yB + 6, "3'", '#fff', 16); TXT(S.labL, 1184, yB + 6, "5'", '#fff', 16);
    S.names = E('g', {}, S.labL);
    TXT(S.names, 20, yT - 14, '非鋳型鎖', COL.nt, 16);
    TXT(S.names, 20, yB + 30, '鋳型鎖', COL.tp, 16);

    // promoter
    S.pro = E('g', { opacity: 0 }, S.labL);
    [[95, 175, '−35ボックス', "5'-TTGACA-3'", "3'-AACTGT-5'"], [240, 310, '−10ボックス', "5'-TATAAT-3'", "3'-ATATTA-5'"]].forEach(([a, b, n, s1, s2]) => {
      const c = (a + b) / 2;
      E('rect', { x: a, y: yT - 8, width: b - a, height: yB - yT + 16, rx: 6, fill: 'rgba(255,90,90,.12)', stroke: '#ff5a5a', 'stroke-width': 2.5 }, S.pro);
      TXT(S.pro, c, 112, n, '#ff8080', 16, { 'text-anchor': 'middle' });
      TXT(S.pro, c, 138, s1, COL.nt, 16, { 'text-anchor': 'middle' });
      TXT(S.pro, c, yB + 30, s2, COL.tp, 16, { 'text-anchor': 'middle' });
    });
    TXT(S.pro, X1, yB + 84, '+1', '#fff', 16, { 'text-anchor': 'middle' });
    S.state = TXT(S.labL, 100, 372, '', '#e6ecf8', 18, { opacity: 0 });

    // terminator
    S.term = E('g', { opacity: 0 }, S.labL);
    E('path', { d: `M${xk(PAL) - 6} 116 v-10 H${xk(NT - 1) + 6} v10`, fill: 'none', stroke: '#ffb86b', 'stroke-width': 2.5 }, S.term);
    TXT(S.term, (xk(PAL) + xk(NT - 1)) / 2, 96, 'ターミネーター（終結シグナル）', '#ffb86b', 17, { 'text-anchor': 'middle' });
    S.tplA = E('g', { opacity: 0 }, S.labL);
    for (let k = USTART; k < NT; k++) TXT(S.tplA, xk(k), yB + 22, 'A', '#9fdcff', 16, { 'text-anchor': 'middle' });

    // RNA
    S.rnaLine = E('path', { fill: 'none', stroke: COL.rna, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, S.rnaL);
    S.nts = [];
    for (let k = 0; k < NT; k++) {
      const l = letterOf(k);
      const dot = E('circle', { r: 5, fill: COL.rna }, S.rnaL);
      const tx = l ? TXT(S.rnaL, 0, 0, l, BASE[l] === BASE.U ? '#e7c6ff' : BASE[l], 17, { 'text-anchor': 'middle', 'paint-order': 'stroke', stroke: '#05070c', 'stroke-width': 4 }) : null;
      S.nts.push({ k, dot, tx });
    }
    S.pairs = E('g', { opacity: 0 }, S.rnaL);
    S.pairEls = [0, 1, 2, 3, 4, 5, 6].map(() => E('line', { stroke: '#fff', 'stroke-width': 2 }, S.pairs));
    S.r5 = TXT(S.rnaL, 0, 0, "5'", '#fff', 16, { opacity: 0 });
    S.r3 = TXT(S.rnaL, 0, 0, "3'", '#fff', 16, { opacity: 0 });
    S.firstBond = E('ellipse', { rx: 24, ry: 16, fill: 'none', stroke: '#fff', 'stroke-width': 2.5, opacity: 0, filter: 'url(#gl)' }, S.rnaL);

    // polymerase (core enzyme) and σ factor
    S.pol = E('g', {}, S.polL);
    E('rect', { x: -190, y: 145, width: 260, height: 155, rx: 50, fill: 'rgba(143,214,255,.13)', stroke: COL.pol, 'stroke-width': 3 }, S.pol);
    S.polT = TXT(S.pol, 0, 290, '', '#cfeeff', 16, { 'text-anchor': 'middle' });
    S.sig = E('g', {}, S.topL);
    E('rect', { x: -250, y: 172, width: 230, height: 24, rx: 12, fill: COL.sig, 'fill-opacity': 0.6, stroke: '#ffb199', 'stroke-width': 2 }, S.sig);
    TXT(S.sig, -135, 190, 'σ因子', '#fff', 16, { 'text-anchor': 'middle' });
    S.sigT = TXT(S.topL, 0, 0, 'σ因子の解離', '#ffb199', 17, { opacity: 0 });
    // incoming ribonucleotides (decor) and direction arrow
    S.ntp = ['A', 'G', 'C', 'U'].map((b) => E('circle', { r: 6, fill: BASE[b], opacity: 0 }, S.topL));
    S.dir = E('g', { opacity: 0 }, S.topL);
    E('path', { d: 'M0 0 H90', stroke: '#ff5a7a', 'stroke-width': 4 }, S.dir);
    E('path', { d: 'M96 0 l-14 -8 v16 z', fill: '#ff5a7a' }, S.dir);
    TXT(S.dir, 48, 26, '転写方向', '#ff9fb2', 16, { 'text-anchor': 'middle' });

    // labels
    S.bondT = TXT(S.topL, 360, 404, '最初の二つのリボヌクレオチドの間に最初のリン酸ジエステル結合', '#fff', 17, { opacity: 0 });
    S.tenT = TXT(S.topL, 100, 404, 'RNA鎖が約10ヌクレオチド → プロモーターから離れる', '#fff', 17, { opacity: 0 });
    S.el = ['① DNA塩基に相補的なリボヌクレオチドが1個入る', '② 既にできたRNA鎖とリン酸ジエステル結合', '③ RNAポリメラーゼが移動（＝転写方向）'].map((s, i) => TXT(S.topL, 60, 420 + i * 30, s, '#e6ecf8', 18, { opacity: 0 }));
    S.loopT = E('g', { opacity: 0 }, S.topL);
    S.loopT1 = TXT(S.loopT, 0, 380, 'ステムループ構造', '#fff', 17, { 'text-anchor': 'end' });
    S.loopT2 = TXT(S.loopT, 0, 404, 'パリンドローム配列（逆方向反復配列）', '#cfd8ea', 16, { 'text-anchor': 'end' });
    S.auT = TXT(S.topL, 0, 296, '', '#ffd8a8', 16, { 'text-anchor': 'middle', opacity: 0 });
    S.endT = TXT(S.topL, 950, 420, 'RNAが外れ、転写が終わる', '#fff', 18, { opacity: 0 });
    S.cycT = TXT(S.topL, 540, 120, 'σ因子が再びコア酵素と結合 → 次の転写へ', '#ffb199', 18, { 'text-anchor': 'end', opacity: 0 });
    // ρ
    S.rho = E('g', { opacity: 0 }, S.topL);
    E('circle', { r: 30, fill: 'rgba(143,191,90,.35)', stroke: COL.rho, 'stroke-width': 3 }, S.rho);
    for (let i = -2; i <= 2; i++) E('line', { x1: -22 + i * 9, y1: 20, x2: -2 + i * 9, y2: -20, stroke: COL.rho, 'stroke-width': 1.5, opacity: 0.7 }, S.rho);
    TXT(S.rho, 0, 7, 'ρ', '#fff', 22, { 'text-anchor': 'middle' });
    TXT(S.rho, 0, 56, 'ρ（ロー）タンパク質', '#cfe8b0', 16, { 'text-anchor': 'middle' });

    // badge (screen-fixed, counter-transformed against the camera)
    S.badge = E('g', {}, svg);
    E('rect', { x: 960, y: 582, width: 220, height: 34, rx: 8, fill: 'rgba(3,4,7,.75)', stroke: '#ffb199', 'stroke-width': 1.5 }, S.badge);
    TXT(S.badge, 1070, 605, '細菌（原核生物）', '#ffd8c8', 17, { 'text-anchor': 'middle' });
    return S;
  },
  frame(S, t, m) {
    const mode = m || 'loop', rho = mode === 'rho';
    const q = qOf(t), xa = xaOf(q);
    // camera-fixed badge
    const c = def.cam(t);
    S.badge.setAttribute('transform', `translate(${c[0]},${c[1]}) scale(${c[2] / 1200})`);

    // polymerase position
    const dock = EZ(seg(t, 0.1, 0.18)), rel = EZ(seg(t, 0.82, 0.88));
    let px = L(700, X1, dock), pdy = L(-105, 0, dock);
    if (t >= 0.18) px = xa;
    px = L(px, 760, rel); pdy = L(pdy, -105, rel);
    S.pol.setAttribute('transform', `translate(${px},${pdy})`);
    const paused = t > 0.745 && t < 0.82;
    S.polT.textContent = t < 0.04 ? 'コア酵素' : t < 0.42 ? 'ホロ酵素' : t < 0.745 ? 'コア酵素' : paused ? '停止' : t < 0.92 ? 'コア酵素' : 'ホロ酵素';
    S.polT.setAttribute('fill', paused ? '#ffd166' : '#cfeeff');

    // σ: joins (0.04–0.09), leaves (0.40–0.46), rejoins (0.88–0.95)
    const j1 = EZ(seg(t, 0.03, 0.09)), lv = EZ(seg(t, 0.4, 0.47)), j2 = EZ(seg(t, 0.88, 0.95));
    let sx = L(px - 230, px, j1), sy = L(pdy - 70, pdy, j1);
    sx = L(sx, 300, lv); sy = L(sy, -102, lv);
    sx = L(sx, px, j2); sy = L(sy, pdy, j2);
    S.sig.setAttribute('transform', `translate(${sx},${sy})`);
    op(S.sig, (j1 > 0 ? 1 : 0.4 + j1) * (1 - lv * 0.5 + j2 * 0.5));
    S.sigT.setAttribute('x', sx - 230); S.sigT.setAttribute('y', sy + 222);
    op(S.sigT, win(t, 0.42, 0.5));

    // DNA bubble
    const amt = EZ(seg(t, 0.18, 0.26)) * (1 - EZ(seg(t, 0.83, 0.88)));
    const bl = xa - 125, br = xa + 25;
    const o = (x) => CL(Math.min((x - bl) / 15, (br - x) / 15)) * amt;
    let d = '';
    for (let x = 18; x <= 1180; x += 7) d += (x === 18 ? 'M' : 'L') + x + ' ' + (yT - 45 * o(x)).toFixed(1) + ' ';
    S.top.setAttribute('d', d);
    S.rungs.forEach((r) => {
      const ov = o(r.x), y1 = yT - 45 * ov, len = 20 - 12 * ov;
      r.a.setAttribute('x1', r.x); r.a.setAttribute('x2', r.x); r.a.setAttribute('y1', y1); r.a.setAttribute('y2', y1 + len);
      r.b.setAttribute('x1', r.x); r.b.setAttribute('x2', r.x); r.b.setAttribute('y1', yB); r.b.setAttribute('y2', yB - len);
    });

    // labels by phase
    op(S.pro, win(t, 0.1, 0.46));
    S.state.textContent = t < 0.22 ? '2重らせんがほどけていない状態（閉じた複合体）' : '2重らせんがほどけた状態（開いた複合体）';
    op(S.state, win(t, 0.14, 0.3));
    op(S.term, fadeIn(t, 0.62, 0.66) * (1 - fadeIn(t, 0.88, 0.92)));
    op(S.tplA, fadeIn(t, 0.66, 0.7) * (1 - fadeIn(t, 0.82, 0.85)));
    op(S.polT, 1 - win(t, 0.82, 0.9));
    op(S.names, 1 - win(t, 0.1, 0.46) * 0.6);

    // RNA geometry
    const xr = t < 0.74 ? xa : xaOf(NT);
    const f = rho ? 0 : EZ(seg(t, 0.7, 0.76));
    const bx = xr - 200, yH = 312;
    const off = [-30 * rel, 40 * rel];
    const pts = [];
    S.nts.forEach((n) => {
      const k = n.k, vis = CL(q - k);
      if (vis <= 0) { op(n.dot, 0); if (n.tx) op(n.tx, 0); return; }
      let [x, y] = linPos(xr, xr - xk(k));
      const fp = foldPos(k, bx, yH);
      if (fp && f > 0) { x = L(x, fp[0], f); y = L(y, fp[1], f); }
      x += off[0]; y += off[1] + (k >= USTART ? 95 * rel : 0); x += k >= USTART ? -40 * rel : 0;
      pts.push([x, y]);
      const lettered = n.tx && t > 0.62 && (!rho || k >= USTART);
      n.dot.setAttribute('cx', x); n.dot.setAttribute('cy', y);
      op(n.dot, lettered ? 0 : vis);
      if (n.tx) { n.tx.setAttribute('x', x); n.tx.setAttribute('y', y + 6); op(n.tx, lettered ? vis * fadeIn(t, 0.62, 0.66) : 0); }
    });
    S.rnaLine.setAttribute('d', pts.length > 1 ? 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') : '');
    op(S.rnaLine, pts.length > 1 ? 0.75 : 0);
    if (pts.length) {
      S.r5.setAttribute('x', pts[0][0] - 22); S.r5.setAttribute('y', pts[0][1] + 6);
      const l = pts[pts.length - 1];
      S.r3.setAttribute('x', l[0] + 9); S.r3.setAttribute('y', l[1] - 8);
    }
    op(S.r5, q > 1.5 ? 1 : 0); op(S.r3, q > 1.5 && t < 0.62 ? 1 : 0);
    // stem base pairs
    S.pairEls.forEach((ln, i) => { const y = yH + 18 + 19 * i - 5 + off[1]; ln.setAttribute('x1', bx - 4 + off[0]); ln.setAttribute('x2', bx + 4 + off[0]); ln.setAttribute('y1', y); ln.setAttribute('y2', y); });
    op(S.pairs, rho ? 0 : fadeIn(t, 0.75, 0.77));
    // first phosphodiester bond (slide 18)
    S.firstBond.setAttribute('cx', xk(0) + 7); S.firstBond.setAttribute('cy', RY);
    op(S.firstBond, win(t, 0.27, 0.33));
    op(S.bondT, win(t, 0.27, 0.33));
    op(S.tenT, win(t, 0.36, 0.44));

    // elongation: incoming ribonucleotides, steps, direction
    S.ntp.forEach((el, i) => {
      const ph = ((t - 0.46) * 60 + i / 4) % 1;
      el.setAttribute('cx', L(xa + 110, xa + 4, EZ(ph))); el.setAttribute('cy', L(110, RY, EZ(ph)));
      op(el, win(t, 0.46, 0.74) * Math.sin(Math.PI * ph));
    });
    S.el.forEach((el, i) => op(el, win(t, 0.48 + i * 0.03, 0.64)));
    S.dir.setAttribute('transform', `translate(${xa + 90},300)`);
    op(S.dir, win(t, 0.46, 0.66));

    // termination
    S.loopT1.setAttribute('x', bx - 40); S.loopT2.setAttribute('x', bx - 40);
    op(S.loopT, rho ? 0 : win(t, 0.75, 0.84));
    S.auT.setAttribute('x', xr - 5); S.auT.setAttribute('y', 330);
    S.auT.textContent = rho ? 'DNA–RNA間の塩基対を壊す' : '弱いA–U塩基対 → 外れやすい';
    op(S.auT, rho ? win(t, 0.79, 0.85) : win(t, 0.77, 0.85));
    if (rho) {
      const ra = EZ(seg(t, 0.75, 0.79));
      S.rho.setAttribute('transform', `translate(${L(640, bx + 70, ra) + off[0]},${L(470, 352, ra) + off[1]})`);
      op(S.rho, fadeIn(t, 0.75, 0.77) * (1 - fadeIn(t, 0.86, 0.89)));
    } else op(S.rho, 0);
    op(S.endT, win(t, 0.84, 0.92));
    op(S.cycT, win(t, 0.9, 1, 0.01));
  },
};

export default def;
