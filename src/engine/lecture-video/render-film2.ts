/**
 * Scenes of the 完成版 (第2講まるごと「核酸の化学とDNAの二重らせん」).
 *
 * Chemistry kept exact (and identical in every intensity):
 *  - Nucleotide = phosphate + pentose + base: the phosphate sits on the sugar's 5' carbon (CH₂ outside the ring),
 *    the base on 1'. Nucleoside = base + sugar (no phosphate).
 *  - Pentoses in Haworth form: ring of C1'–C4' and O; β-D-ribofuranose has 1'-OH up, 2'-OH and 3'-OH down,
 *    5'-CH₂OH up on 4'. 2-deoxyribose: H in place of the 2'-OH.
 *  - Purines (A, G) = a 6-ring fused to a 5-ring, N at 1, 3, 7, 9, sugar on N9; A: NH₂ on C6; G: O on C6, NH₂ on C2.
 *    Pyrimidines (C, T, U) = one 6-ring, N at 1 and 3, sugar on N1; C: NH₂ on C4, O on C2; T/U: O on C2 and C4,
 *    T has a methyl on C5 (the only difference from U).
 *  - Watson–Crick pairs: A N6–H…O4 T, A N1…H–N3 T (2); G O6…H–N4 C, G N1–H…N3 C, G N2–H…O2 C (3); both
 *    glycosidic bonds on the same (minor-groove) side, the same C1'–C1' span for every pair.
 *  - B-DNA: right-handed, width 2 nm, 3.4 nm and 10 base pairs per turn; strands antiparallel; the backbone link is
 *    3'-C–O–P–O–5'-C (phosphodiester); chains grow 5'→3'.
 *  - cAMP: one phosphate bridging 3' and 5' of the same ribose. dNTP: deoxyribose, three phosphates on 5'.
 *  - Metabolism (スライド22): pyrimidine → NH₃ + CO₂; purine → uric acid (gout); dietary nucleic acids are not reused.
 *  - No faces are drawn (the gout scene shows a foot only).
 */
import type { SceneDef } from './types';
import type { Pen } from './pen';
import { CHALK, INK } from './diagrams';
import { H, W, ease } from './gekiga';
import { CL, rnd, label, streaks, type RC } from './render-kit';
import { BASE, PAIR, between, helix, nucleoplasm, term, warmFluid } from './render-film';

type P2 = [number, number];
const dir = (deg: number): P2 => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
const add = (a: P2, b: P2, k = 1): P2 => [a[0] + b[0] * k, a[1] + b[1] * k];
const lerp = (a: P2, b: P2, k: number): P2 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const poly = (pts: P2[]) => 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z';
const atom = (p: Pen, s: string, [x, y]: P2, size = 22, col = '#fff') => {
  p.circle(x, y, size * 0.62, { fill: 'rgba(10,12,16,0.92)' });
  p.text(s, x, y, { size, font: 'gothic', weight: 900, fill: col, align: 'center' });
};
const yellow = '#ffd84a', blue = '#5aa9ff', SUGAR = '#e8d9c2', PHOS = '#ffd84a';

/* ---------- small schematic: ○ phosphate – ⬠ sugar – ⬡ base (the lecture's own board picture) ---------- */
function pent(cx: number, cy: number, r: number): P2[] { return [-90, -18, 54, 126, 198].map((a) => add([cx, cy], dir(a), r)); }
function hexagon(cx: number, cy: number, r: number, rot = 0): P2[] { return [0, 60, 120, 180, 240, 300].map((a) => add([cx, cy], dir(a + rot), r)); }
/** sugar ring (O at the top vertex); returns the ring vertices O, C1', C2', C3', C4' */
function sugarRing(p: Pen, cx: number, cy: number, r: number, o: { fill?: string; a?: number; nums?: number } = {}) {
  const v = pent(cx, cy, r);
  p.path(poly(v), { fill: o.fill ?? SUGAR, stroke: INK, width: Math.max(2, r * 0.08), opacity: o.a ?? 1 });
  p.text('O', v[0][0], v[0][1] + r * 0.28, { size: r * 0.32, font: 'gothic', weight: 900, fill: '#7a3a1a', align: 'center', opacity: o.a ?? 1 });
  return v;
}
function phosphate(p: Pen, x: number, y: number, r: number, a = 1) {
  p.circle(x, y, r, { fill: PHOS, stroke: INK, width: Math.max(2, r * 0.12), opacity: a });
  p.text('P', x, y, { size: r * 0.95, font: 'gothic', weight: 900, fill: '#1b1b1b', align: 'center', opacity: a });
}
function baseHex(p: Pen, x: number, y: number, r: number, letter: string, a = 1) {
  p.path(poly(hexagon(x, y, r)), { fill: BASE[letter] ?? '#5aa9ff', stroke: INK, width: Math.max(2, r * 0.08), opacity: a });
  if (letter) p.text(letter, x, y, { size: r * 0.8, font: 'gothic', weight: 900, fill: '#111', align: 'center', opacity: a });
}
/** a nucleotide as on the board: phosphate (left) on 5', sugar, base (right) on 1' */
function nucleoMini(p: Pen, x: number, y: number, s: number, letter = 'A', o: { P?: number; S?: number; B?: number } = {}) {
  const r = 26 * s, v = pent(x, y, r), c4 = v[4], c5: P2 = [c4[0] - 6 * s, c4[1] - 26 * s], pc: P2 = [c5[0] - 30 * s, c5[1]];
  const b: P2 = [v[1][0] + 42 * s, v[1][1]];
  if ((o.P ?? 1) > 0) { p.line([c4, c5, [pc[0] + 14 * s, pc[1]]], { stroke: '#fff', width: 3 * s, opacity: o.P ?? 1 }); phosphate(p, pc[0], pc[1], 14 * s, o.P ?? 1); }
  if ((o.B ?? 1) > 0) { p.line([v[1], [b[0] - 24 * s, b[1]]], { stroke: '#fff', width: 3 * s, opacity: o.B ?? 1 }); baseHex(p, b[0], b[1], 24 * s, letter, o.B ?? 1); }
  if ((o.S ?? 1) > 0) sugarRing(p, x, y, r, { a: o.S ?? 1 });
}

/* ---------- 導入：4種類の小さな有機分子 ---------- */
function monomersFig(rc: RC) {
  const { p, t } = rc;
  const cols = [170, 480, 790, 1100];
  const star = rc.u('star', 0.5);
  const names: [string, string, string][] = [['糖', '多糖', 'sug'], ['脂肪酸', '膜', 'fat'], ['アミノ酸', 'タンパク質', 'aa'], ['ヌクレオチド', '核酸', 'nuc']];
  names.forEach(([m, poly2, ev], i) => {
    const x = cols[i], a0 = rc.u(`four+${(i * 0.35).toFixed(2)}`, 0.35) * (1 - star * 0.85);
    if (a0 <= 0) return;
    p.save(); p.alpha(a0);
    p.rect(x - 140, 90, 280, 500, { fill: 'rgba(8,10,14,0.55)', stroke: '#f4f0e4', width: 4 }, 10);
    label(p, m, x, 130, 30, { align: 'center', fill: CHALK.y });
    // the monomer
    if (i === 0) p.path(poly(hexagon(x, 230, 34, 30)), { fill: '#f0c98a', stroke: INK, width: 4 });
    if (i === 1) { p.circle(x - 70, 230, 18, { fill: '#8cc4ff', stroke: INK, width: 4 }); p.path(`M ${x - 52} 230 l 18 -12 l 18 12 l 18 -12 l 18 12 l 18 -12 l 18 12`, { stroke: '#f3f0e6', width: 4 }); }
    if (i === 2) { p.circle(x, 230, 26, { fill: '#e2a65a', stroke: INK, width: 4 }); p.text('R', x, 230, { size: 22, font: 'gothic', weight: 900, fill: '#111', align: 'center' }); }
    if (i === 3) nucleoMini(p, x + 4, 236, 1.05, 'A');
    // the polymer
    const k = rc.u(ev, 0.9);
    p.line([[x, 290], [x, 340]], { stroke: '#fff', width: 4, opacity: k });
    p.line([[x - 10, 328], [x, 342], [x + 10, 328]], { stroke: '#fff', width: 4, opacity: k });
    if (k > 0) {
      if (i === 0) for (let j = 0; j < 5; j++) { if (CL(k * 5 - j) <= 0) continue; const cx = x - 92 + j * 46, cy = 440 + (j % 2) * 16; p.path(poly(hexagon(cx, cy, 20, 30)), { fill: '#f0c98a', stroke: INK, width: 3, opacity: CL(k * 5 - j) }); if (j) p.line([[cx - 26, cy - (j % 2 ? 10 : -10)], [cx - 18, cy - (j % 2 ? 4 : -4)]], { stroke: INK, width: 3 }); }
      if (i === 1) for (let j = 0; j < 6; j++) for (const side of [-1, 1]) { const a = CL(k * 6 - j); if (a <= 0) continue; const cx = x - 100 + j * 40, hy = 445 + side * 62; p.circle(cx, hy, 13, { fill: '#8cc4ff', stroke: INK, width: 3, opacity: a }); p.path(`M ${cx - 4} ${hy - side * 13} l 0 ${-side * 44} M ${cx + 4} ${hy - side * 13} l 0 ${-side * 44}`, { stroke: '#f3f0e6', width: 3, opacity: a }); }
      if (i === 2) { const n = Math.round(k * 12); const pts: P2[] = []; for (let j = 0; j < n; j++) { const th = j * 0.9; pts.push([x - 60 + Math.cos(th) * (40 + j * 3) * 0.8 + j * 8, 450 + Math.sin(th) * (36 + j * 2)]); } if (pts.length > 1) p.line(pts, { stroke: '#e2a65a', width: 4 }); pts.forEach(([px, py]) => p.circle(px, py, 11, { fill: '#e2a65a', stroke: INK, width: 3 })); }
      if (i === 3) for (let j = 0; j < 3; j++) {
        const a = CL(k * 3 - j); if (a <= 0) continue;
        const y = 400 + j * 70 + (1 - ease.outCubic(a)) * 40;
        // backbone link: 3' of the sugar above → phosphate of the next nucleotide
        if (j > 0) { const up = pent(x - 10, 400 + (j - 1) * 70, 26 * 0.78)[3]; p.line([up, [x - 10 - 26 * 0.78 - 6, y - 20 - 4]], { stroke: '#fff', width: 3, opacity: a }); }
        nucleoMini(p, x - 10, y, 0.78, 'ATG'[j]);
      }
    }
    const lk = i === 3 ? rc.u('na', 0.25) : rc.u(`${ev}+0.6`, 0.3);
    if (i === 3) term(p, poly2, x, 560, lk, 46, '#ff6a55'); else label(p, poly2, x, 560, 30, { align: 'center', a: lk });
    p.restore();
  });
  if (star > 0) {
    p.save(); p.alpha(star); p.translate(640, 360); p.scale(1 + 1.3 * ease.outCubic(star)); p.translate(-640, -360);
    p.restore();
    p.save(); p.alpha(star);
    p.rect(320, 150, 640, 390, { fill: 'rgba(8,10,14,0.85)', stroke: '#f4f0e4', width: 6 }, 14);
    nucleoMini(p, 620, 360, 3.1, 'A');
    p.restore();
    term(p, '今日の主役', 640, 120, rc.u('star+0.3', 0.25), 64, CHALK.y);
    label(p, 'ヌクレオチド', 640, 505, 40, { align: 'center', a: rc.u('star+0.6', 0.3) });
    void t;
  }
}

/* ---------- テーマ1：ヌクレオチドとヌクレオシド ---------- */
function nucleotideFig(rc: RC) {
  const { p, t } = rc;
  const pop = (ev: string) => { const k = rc.u(ev, 0.3); return { a: 0.22 + 0.78 * k, s: 1 + 0.25 * Math.sin(Math.PI * k) }; };
  const pre = rc.u('pic', 0.5);
  if (pre <= 0) return;
  const side = rc.u('side', 0.5);
  const sx = 640, sy = 400, r = 82;
  const v = pent(sx, sy, r), c4 = v[4], c5: P2 = [c4[0] - 22, c4[1] - 78];
  const P = pop('P'), Sg = pop('S'), B = pop('B');
  const pOff = -140 * ease.outCubic(side), pA = P.a * (1 - 0.6 * side) * pre;
  // 5'-CH₂ to phosphate (the phosphate rides on 5')
  p.save(); p.alpha(pA);
  p.line([c4, c5, [c5[0] - 70 + pOff, c5[1]]], { stroke: '#fff', width: 6 });
  p.save(); p.translate(c5[0] - 120 + pOff, c5[1]); p.scale(P.s); phosphate(p, 0, 0, 52); p.restore();
  label(p, 'リン酸', c5[0] - 120 + pOff, c5[1] + 88, 32, { align: 'center', fill: yellow });
  p.restore();
  label(p, "5'", c5[0] + 18, c5[1] - 6, 26, { fill: CHALK.y, a: Sg.a * pre });
  // base on 1'
  const bx = v[1][0] + 130, by = v[1][1];
  p.save(); p.alpha(B.a * pre);
  p.line([v[1], [bx - 80, by]], { stroke: '#fff', width: 6 });
  p.save(); p.translate(bx, by); p.scale(B.s); baseHex(p, 0, 0, 80, ''); p.text('塩基', 0, 0, { size: 36, font: 'gothic', weight: 900, fill: '#111', align: 'center' }); p.restore();
  p.restore();
  label(p, "1'", v[1][0] + 4, v[1][1] - 30, 26, { fill: CHALK.y, a: Sg.a * pre });
  // sugar
  p.save(); p.alpha(Sg.a * pre); p.translate(sx, sy); p.scale(Sg.s); p.translate(-sx, -sy);
  sugarRing(p, sx, sy, r);
  p.restore();
  label(p, '五炭糖（糖）', sx, sy + 118, 30, { align: 'center', fill: SUGAR, a: Sg.a * pre });
  // nucleoside = base + sugar (red dotted line, as on スライド19)
  const bs = rc.u('bs', 0.6);
  if (bs > 0) {
    const x0 = sx - 120, x1 = bx + 100, y0 = sy - 130, y1 = sy + 150, per = 2 * (x1 - x0 + y1 - y0);
    p.rect(x0, y0, x1 - x0, y1 - y0, { stroke: '#ff4a3a', width: 5, dash: [14, 10], opacity: 1 }, 26);
    void per;
  }
  term(p, 'ヌクレオシド', 820, 150, rc.u('side', 0.2), 72, '#ff6a55');
  label(p, '＝ 塩基 ＋ 糖（リン酸なし）', 820, 225, 28, { align: 'center', a: rc.u('side+0.5', 0.3) });
  if (side <= 0) label(p, 'ヌクレオチド', 640, 140, 40, { align: 'center', fill: CHALK.y, a: rc.u('pic', 0.4) });
  void t;
}

/* ---------- テーマ2：リボースと2-デオキシリボース（ハース式） ---------- */
/** furanose in Haworth view: O back, C1' right, C2' front-right, C3' front-left, C4' left; returns positions */
function haworth(p: Pen, cx: number, cy: number, s: number, deoxy: boolean, o: { nums?: number; a?: number; hi?: number } = {}) {
  const O: P2 = [cx, cy - 52 * s], C1: P2 = [cx + 96 * s, cy - 6 * s], C2: P2 = [cx + 56 * s, cy + 52 * s], C3: P2 = [cx - 56 * s, cy + 52 * s], C4: P2 = [cx - 96 * s, cy - 6 * s];
  const a = o.a ?? 1;
  p.path(poly([O, C1, C2, C3, C4]), { fill: 'rgba(232,217,194,0.18)', stroke: '#f1e6d2', width: 6 * s, opacity: a });
  p.line([C3, C2], { stroke: '#f1e6d2', width: 14 * s, opacity: a }); // front edge (thick)
  atom(p, 'O', O, 30 * s, '#ff9a7a');
  const sub = (from: P2, up: boolean, txt: string, col = '#fff') => { const to: P2 = [from[0], from[1] + (up ? -62 : 62) * s]; p.line([from, to], { stroke: '#f1e6d2', width: 5 * s, opacity: a }); p.text(txt, to[0], to[1] + (up ? -16 : 18) * s, { size: 30 * s, font: 'gothic', weight: 900, fill: col, stroke: INK, strokeW: 6 * s, align: 'center', opacity: a }); return to; };
  sub(C1, true, 'OH');
  const c2 = sub(C2, false, deoxy ? 'H' : 'OH', deoxy ? '#ff6a55' : CHALK.y);
  sub(C3, false, 'OH');
  const c5: P2 = [C4[0], C4[1] - 62 * s];
  p.line([C4, c5], { stroke: '#f1e6d2', width: 5 * s, opacity: a });
  p.text('CH₂OH', c5[0] - 8 * s, c5[1] - 18 * s, { size: 30 * s, font: 'gothic', weight: 900, fill: '#fff', stroke: INK, strokeW: 6 * s, align: 'center', opacity: a });
  const n = o.nums ?? 0;
  ([[C1, "1'", 30, 22], [C2, "2'", 34, -6], [C3, "3'", -34, -6], [C4, "4'", -30, 22], [c5, "5'", -66, -18]] as [P2, string, number, number][]).forEach(([q, s2, dx, dy], i) => {
    const k = CL(n * 5 - i); if (k <= 0) return;
    p.text(s2, q[0] + dx * s, q[1] + dy * s, { size: 26 * s, font: 'gothic', weight: 900, fill: CHALK.y, stroke: INK, strokeW: 5 * s, align: 'center', opacity: k * a });
  });
  if (o.hi) p.circle(c2[0], c2[1] + 18 * s, 34 * s, { stroke: deoxy ? '#ff4a3a' : CHALK.y, width: 6 * s, opacity: o.hi });
  return { C2, c2 };
}
function sugarFig(rc: RC) {
  const { p } = rc;
  const dd = rc.u('dd', 0.3);
  label(p, '五炭糖（ペントース）', 640, 92, 36, { align: 'center', fill: CHALK.y, a: rc.u('c5', 0.3) * (1 - dd) });
  const nums = rc.u('c5+0.3', 1.6), hi = rc.u('oh', 0.3);
  const aR = rc.u('start', 0.4), aD = rc.u('start+0.3', 0.4);
  haworth(p, 340, 380, 1.15, false, { nums, a: aR, hi });
  const { c2 } = haworth(p, 940, 380, 1.15, true, { nums, a: aD, hi });
  label(p, 'リボース', 340, 205, 38, { align: 'center', a: rc.u('rib', 0.3) });
  label(p, '（RNA）', 340, 250, 28, { align: 'center', fill: '#d8b6ff', a: rc.u('rib', 0.3) });
  label(p, '2-デオキシリボース', 940, 205, 38, { align: 'center', a: rc.u('deo', 0.3) });
  label(p, '（DNA）', 940, 250, 28, { align: 'center', fill: '#9fd0ff', a: rc.u('deo', 0.3) });
  // デオキシ = the oxygen is gone: a ghost "O" leaves 2'
  const m = rc.u('mean', 1.4);
  if (m > 0 && m < 1) { const y = c2[1] + 18 - 160 * ease.outCubic(m), x = c2[0] + 60 * m; atom(p, 'O', [x, y], 40, `rgba(255,120,100,${1 - m})`); }
  label(p, "2'の OH → H", 940, 600, 32, { align: 'center', fill: '#ff8a7a', a: rc.u('oh+0.4', 0.3) * (1 - dd) });
  if (dd > 0) {
    term(p, 'DNA の D ＝ デオキシ', 640, 110, dd, 64, '#fff');
    p.save(); p.alpha(dd); p.text('D', 532, 110, { size: 64, font: 'brush', weight: 400, fill: '#ff6a55', align: 'center', opacity: 0 }); p.restore();
  }
}

/* ---------- テーマ2：プリンとピリミジン ---------- */
interface BaseGeo { ring6: P2[]; ring5?: P2[]; Ns: P2[]; sugarAt: P2; sugarDir: number; subs: { at: P2; dir: number; txt: string; dbl?: boolean; key?: boolean }[] }
/** standalone base, pointy-top hexagon; sugar bond drawn downward */
function baseGeo(letter: string, cx: number, cy: number, s: number): BaseGeo {
  const v = (a: number): P2 => add([cx, cy], dir(a), s);
  if (letter === 'A' || letter === 'G') {
    // 6-ring: C6 top, C5 top-right, C4 bottom-right, N3 bottom, C2 bottom-left, N1 top-left; 5-ring fused on C5–C4
    const C6 = v(-90), C5 = v(-30), C4 = v(30), N3 = v(90), C2 = v(150), N1 = v(210);
    const mid = lerp(C5, C4, 0.5), out = dir(0), d5 = s * 0.688 * 1.0, pc = add(mid, out, d5), R5 = s / (2 * Math.sin(Math.PI / 5));
    const angC5 = Math.atan2(C5[1] - pc[1], C5[0] - pc[0]), angC4 = Math.atan2(C4[1] - pc[1], C4[0] - pc[0]);
    const step = (angC5 - angC4 + 2 * Math.PI) % (2 * Math.PI) > Math.PI ? 2 * Math.PI / 5 : -2 * Math.PI / 5;
    const r5: P2[] = [C5]; for (let i = 1; i <= 3; i++) { const a = angC5 - step * i; r5.push([pc[0] + R5 * Math.cos(a), pc[1] + R5 * Math.sin(a)]); } r5.push(C4);
    const N7 = r5[1], N9 = r5[3];
    const subs: BaseGeo['subs'] = letter === 'A' ? [{ at: C6, dir: -90, txt: 'NH₂' }] : [{ at: C6, dir: -90, txt: 'O', dbl: true }, { at: C2, dir: 150, txt: 'NH₂' }];
    return { ring6: [C6, C5, C4, N3, C2, N1], ring5: r5, Ns: [N1, N3, N7, N9], sugarAt: N9, sugarDir: 60, subs };
  }
  // pyrimidine: N1 bottom, C2 bottom-left, N3 top-left, C4 top, C5 top-right, C6 bottom-right
  const N1 = v(90), C2 = v(150), N3 = v(210), C4 = v(-90), C5 = v(-30), C6 = v(30);
  const subs: BaseGeo['subs'] = [{ at: C2, dir: 150, txt: 'O', dbl: true }, letter === 'C' ? { at: C4, dir: -90, txt: 'NH₂' } : { at: C4, dir: -90, txt: 'O', dbl: true }];
  if (letter === 'T') subs.push({ at: C5, dir: -30, txt: 'CH₃', key: true });
  return { ring6: [N1, C2, N3, C4, C5, C6], Ns: [N1, N3], sugarAt: N1, sugarDir: 90, subs };
}
function drawBase(p: Pen, letter: string, cx: number, cy: number, s: number, o: { a?: number; nGlow?: number; keyGlow?: number; name?: string } = {}) {
  const g = baseGeo(letter, cx, cy, s), a = o.a ?? 1;
  if (a <= 0) return g;
  p.save(); p.alpha(a);
  const col = BASE[letter];
  if (g.ring5) p.path(poly(g.ring5), { fill: col, stroke: INK, width: 4, opacity: 0.85 });
  p.path(poly(g.ring6), { fill: col, stroke: INK, width: 4, opacity: 0.85 });
  for (const sb of g.subs) {
    const end = add(sb.at, dir(sb.dir), s * 0.95);
    if (sb.dbl) { const n = dir(sb.dir + 90); p.line([add(sb.at, n, 4), add(end, n, 4)], { stroke: INK, width: 4 }); p.line([add(sb.at, n, -4), add(end, n, -4)], { stroke: INK, width: 4 }); }
    else p.line([sb.at, end], { stroke: INK, width: 4 });
    const lab = add(sb.at, dir(sb.dir), s * 1.35);
    if (sb.key && o.keyGlow) p.circle(lab[0], lab[1], s * 0.62, { fill: `rgba(255,216,74,${0.55 * o.keyGlow})` });
    p.text(sb.txt, lab[0], lab[1], { size: s * 0.52, font: 'gothic', weight: 900, fill: '#fff', stroke: INK, strokeW: 5, align: 'center' });
  }
  for (const n of g.Ns) { if (o.nGlow) p.circle(n[0], n[1], s * 0.42, { fill: `rgba(140,196,255,${0.7 * o.nGlow})` }); atom(p, 'N', n, s * 0.42, '#bfe0ff'); }
  const sEnd = add(g.sugarAt, dir(g.sugarDir), s * 0.8);
  p.line([g.sugarAt, sEnd], { stroke: '#9a9a9a', width: 4, dash: [6, 5] });
  p.text('糖', sEnd[0], sEnd[1] + s * 0.4, { size: s * 0.42, font: 'gothic', weight: 900, fill: '#9a9a9a', align: 'center' });
  p.text(letter, cx, cy, { size: s * 0.7, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
  if (o.name) label(p, o.name, cx + (g.ring5 ? s * 0.6 : 0), cy + s * 2.35, s * 0.5, { align: 'center' });
  p.restore();
  return g;
}
function basesFig(rc: RC) {
  const { p } = rc;
  const nG = rc.u('ring', 0.4) * (1 - rc.u('pu', 0.5));
  const tu = rc.u('tu', 0.4), sw = between(rc, 'swap', 'swap+1.4', ease.inOut);
  const puA = rc.u('pu', 0.3), pyA = rc.u('py', 0.3);
  const s = 58;
  const dimPu = 1 - 0.55 * tu, dimC = 1 - 0.55 * tu;
  drawBase(p, 'A', 140, 340, s, { a: (0.35 + 0.65 * rc.u('start', 0.5)) * dimPu, nGlow: nG, name: rc.u('ag', 0.3) > 0 ? 'アデニン' : undefined });
  drawBase(p, 'G', 420, 340, s, { a: (0.35 + 0.65 * rc.u('start+0.2', 0.5)) * dimPu, nGlow: nG, name: rc.u('ag+0.6', 0.3) > 0 ? 'グアニン' : undefined });
  drawBase(p, 'C', 720, 340, s, { a: (0.35 + 0.65 * rc.u('start+0.4', 0.5)) * dimC, nGlow: nG, name: rc.u('ctu', 0.3) > 0 ? 'シトシン' : undefined });
  // T and U: step forward on 「チミンの代わりにウラシル」, then trade places (the exam swaps them)
  const lift = 60 * ease.outCubic(tu), arc = Math.sin(Math.PI * sw) * 90;
  const xT = 920 + (1120 - 920) * sw, xU = 1120 - (1120 - 920) * sw;
  drawBase(p, 'T', xT, 340 + lift - arc, s * (1 + 0.15 * tu), { a: 0.35 + 0.65 * rc.u('start+0.6', 0.5), nGlow: nG, keyGlow: tu, name: rc.u('ctu+0.5', 0.3) > 0 ? 'チミン' : undefined });
  drawBase(p, 'U', xU, 340 + lift + arc, s * (1 + 0.15 * tu), { a: 0.35 + 0.65 * rc.u('start+0.8', 0.5), nGlow: nG, name: rc.u('ctu+1.0', 0.3) > 0 ? 'ウラシル' : undefined });
  // groups
  label(p, 'プリン（環2つ）', 300, 120, 34, { align: 'center', fill: CHALK.y, a: puA });
  label(p, 'ピリミジン（環1つ）', 920, 120, 34, { align: 'center', fill: CHALK.y, a: pyA });
  label(p, '窒素（N）を含む環', 640, 600, 30, { align: 'center', fill: '#bfe0ff', a: rc.u('ring', 0.4) * (1 - puA) });
  label(p, 'RNA では T → U', 1015, 600, 32, { align: 'center', fill: '#ff8a7a', a: rc.u('tu+0.6', 0.3) });
  label(p, '違いは CH₃ だけ', 1020, 170, 26, { align: 'center', fill: CHALK.y, a: rc.u('tu+1.2', 0.3) * (1 - puA * 0) });
  // red ring around T and U
  const rd = rc.u('red', 0.6);
  if (rd > 0) { p.save(); p.alpha(1); p.ellipse(1020, 400, 220 * (0.9 + 0.1 * rd), 200, -0.04, { stroke: '#ff4a3a', width: 7, opacity: rd }); p.restore(); }
}

/* ---------- テーマ2：NMP・NDP・NTP、ATP・cAMP・dNTP ---------- */
function nucleosideBig(p: Pen, cx: number, cy: number, s: number, letter: string, o: { nP: number; deoxy?: boolean; cyclic?: number; spark?: number; a?: number; newK?: number } ) {
  const a = o.a ?? 1; if (a <= 0) return;
  p.save(); p.alpha(a);
  const r = 64 * s, v = pent(cx, cy, r), c4 = v[4], c5: P2 = [c4[0] - 16 * s, c4[1] - 64 * s];
  // base on 1'
  const bx = v[1][0] + 100 * s;
  p.line([v[1], [bx - 60 * s, v[1][1]]], { stroke: '#fff', width: 5 * s });
  baseHex(p, bx, v[1][1], 60 * s, letter);
  sugarRing(p, cx, cy, r);
  // 2' and 3' substituents
  const c2 = v[2], c3 = v[3];
  p.line([c2, [c2[0], c2[1] + 46 * s]], { stroke: '#f1e6d2', width: 4 * s });
  p.text(o.deoxy ? 'H' : 'OH', c2[0], c2[1] + 66 * s, { size: 28 * s, font: 'gothic', weight: 900, fill: o.deoxy ? '#ff6a55' : '#fff', stroke: INK, strokeW: 6, align: 'center' });
  p.text("2'", c2[0] + 26 * s, c2[1] - 4 * s, { size: 22 * s, font: 'gothic', weight: 900, fill: CHALK.y, stroke: INK, strokeW: 4, align: 'center' });
  p.line([c4, c5], { stroke: '#fff', width: 5 * s });
  p.text("5'", c5[0] + 24 * s, c5[1] + 6 * s, { size: 22 * s, font: 'gothic', weight: 900, fill: CHALK.y, stroke: INK, strokeW: 4, align: 'center' });
  if (o.cyclic) {
    // cAMP: one phosphate bridging 5' and 3' of the same sugar
    const pc: P2 = [c3[0] - 100 * s, (c5[1] + c3[1]) / 2 + 10 * s];
    p.line([c5, [pc[0] + 20 * s, pc[1] - 20 * s]], { stroke: '#fff', width: 5 * s, opacity: o.cyclic });
    p.line([c3, [pc[0] + 20 * s, pc[1] + 20 * s]], { stroke: '#fff', width: 5 * s, opacity: o.cyclic });
    phosphate(p, pc[0], pc[1], 34 * s, o.cyclic);
    p.text("3'", c3[0] - 6 * s, c3[1] + 30 * s, { size: 22 * s, font: 'gothic', weight: 900, fill: CHALK.y, stroke: INK, strokeW: 4, align: 'center', opacity: o.cyclic });
  } else {
    p.line([c3, [c3[0], c3[1] + 46 * s]], { stroke: '#f1e6d2', width: 4 * s });
    p.text('OH', c3[0], c3[1] + 66 * s, { size: 28 * s, font: 'gothic', weight: 900, fill: '#fff', stroke: INK, strokeW: 6, align: 'center' });
    for (let i = 0; i < 3; i++) {
      const k = CL(o.nP - i); if (k <= 0) continue;
      const px = c5[0] - (70 + i * 96) * s, py = c5[1];
      p.line([[px + 34 * s, py], [px + 62 * s, py]], { stroke: '#fff', width: 5 * s, opacity: k });
      p.save(); p.translate(px, py - 40 * (1 - ease.back(k))); phosphate(p, 0, 0, 34 * s, k); p.restore();
      if (i === 2 && o.spark) for (let j = 0; j < 8; j++) { const an = j * 0.8 + rnd(j) * 0.4, rr = 50 + 40 * o.spark; p.line([[px + 48 * s, py], [px + 48 * s + Math.cos(an) * rr, py + Math.sin(an) * rr]], { stroke: '#fff6b0', width: 4, opacity: o.spark * (0.5 + 0.5 * rnd(j * 3)) }); }
    }
  }
  p.restore();
}
function ntpFig(rc: RC) {
  const { p, t } = rc;
  const nP = CL(rc.u('nmp', 0.3)) + CL(rc.u('ndp', 0.3)) + CL(rc.u('ntp', 0.3));
  const toC = rc.u('camp', 0.5), toD = rc.u('deo', 0.5);
  const letter = rc.u('atp', 0.2) > 0 ? 'A' : '';
  const spark = rc.u('energy', 0.2) * (1 - toC) * (0.6 + 0.4 * Math.sin(t * 18));
  nucleosideBig(p, 780, 400, 1.3, letter || 'A', { nP, a: 1 - toC, spark });
  nucleosideBig(p, 780, 400, 1.3, 'A', { nP: 0, cyclic: 1, a: toC * (1 - toD) });
  nucleosideBig(p, 780, 400, 1.3, 'G', { nP: 3, deoxy: true, a: toD });
  // the names
  const nm = rc.u('ntp', 0.2) > 0 ? 'NTP' : rc.u('ndp', 0.2) > 0 ? 'NDP' : rc.u('nmp', 0.2) > 0 ? 'NMP' : '';
  const atp = rc.u('atp', 0.25);
  if (nm && atp <= 0) { label(p, nm, 300, 120, 64, { align: 'center', fill: yellow }); label(p, `リン酸 ${nm === 'NMP' ? 1 : nm === 'NDP' ? 2 : 3}つ`, 300, 180, 30, { align: 'center' }); }
  label(p, '3つ付いたものが多い', 330, 560, 30, { align: 'center', fill: CHALK.y, a: rc.u('many', 0.3) * (1 - atp) });
  if (atp > 0 && toC < 1) { term(p, 'ATP', 300, 120, atp * (1 - toC), 80, yellow); label(p, 'エネルギーの供給役', 330, 560, 32, { align: 'center', a: rc.u('energy', 0.3) * (1 - toC) }); }
  if (toC > 0 && toD < 1) { term(p, 'cAMP', 300, 120, toC * (1 - toD), 80, '#8cc4ff'); label(p, 'シグナル伝達', 330, 560, 32, { align: 'center', a: toC * (1 - toD) }); label(p, "リン酸が 3' と 5' をつなぐ環", 300, 190, 26, { align: 'center', fill: '#bfe0ff', a: rc.u('camp+0.6', 0.3) * (1 - toD) }); }
  if (toD > 0) { term(p, 'dNTP', 300, 120, rc.u('dntp', 0.25) || toD * 0.6, 80, '#ff8a7a'); label(p, "d ＝ デオキシ（2' が H）", 300, 190, 28, { align: 'center', a: toD }); label(p, 'DNA の材料', 330, 560, 32, { align: 'center', a: rc.u('dntp', 0.3) }); }
}

/* ---------- テーマ3：二重らせん（縦） ---------- */
function helixFig(rc: RC) {
  const { p, t } = rc;
  const amp = 110, period = 374, y0 = 30, y1 = 690; // diameter 220 px = 2 nm → 3.4 nm = 374 px
  p.save(); p.translate(640, 0); p.rotate(Math.PI / 2);
  // rotated: helix x-axis runs down the screen; y in this frame is -screenX
  helix(p, y0, y1, 0, amp, period, t * 0.9, { ink: yellow, light: blue, lw: 9, bpt: 10 });
  p.restore();
  const bb = rc.u('bb', 0.3), bp = rc.u('bp', 0.3);
  label(p, '糖とリン酸の骨格', 330, 170, 32, { align: 'center', fill: yellow, a: bb });
  p.line([[420, 190], [535, 240]], { stroke: '#fff', width: 3, opacity: bb });
  label(p, '塩基対', 330, 420, 32, { align: 'center', a: bp });
  p.line([[390, 420], [600, 420]], { stroke: '#fff', width: 3, opacity: bp });
  // width 2 nm
  const w = rc.u('w', 0.5);
  if (w > 0) { const y = 100; p.line([[640 - amp * w, y], [640 + amp * w, y]], { stroke: '#fff', width: 5 }); for (const x of [640 - amp * w, 640 + amp * w]) p.line([[x, y - 14], [x, y + 14]], { stroke: '#fff', width: 5 }); label(p, '幅 2 nm', 780, 100, 34, { fill: CHALK.y, a: w }); }
  // pitch 3.4 nm = 10 bp
  const pk = rc.u('pitch', 0.7);
  if (pk > 0) { const x = 850, ya = 150, yb = ya + period * pk; p.line([[x, ya], [x, yb]], { stroke: '#fff', width: 5 }); for (const y of [ya, yb]) p.line([[x - 14, y], [x + 14, y]], { stroke: '#fff', width: 5 }); label(p, '1回転', 990, 290, 34, { align: 'center', fill: CHALK.y, a: pk }); label(p, '3.4 nm', 990, 340, 40, { align: 'center', a: pk }); label(p, '（10塩基対）', 990, 390, 26, { align: 'center', fill: '#ccc', a: rc.u('pitch+0.6', 0.3) }); }
  term(p, '二重らせん', 300, 300, rc.u('this', 0.2) * (1 - bb), 64);
}

/* ---------- テーマ3：ほどくと逆平行のはしご ---------- */
const SEQ = 'ATGCGTACCATG';
function ladderFig(rc: RC) {
  const { p, t } = rc;
  const f = between(rc, 'flat', 'ladder+0.3', ease.inOut);
  const cy = 360, amp = 120, period = 420, off = 0.76 * Math.PI, gap = 95, x0 = 150, x1 = 1130, bp = (x1 - x0) / (SEQ.length - 1);
  const ph = t * 0.9 * (1 - f);
  const yA = (x: number) => { const th = ((x - x0) / period) * 2 * Math.PI + ph; return cy + amp * Math.sin(th) * (1 - f) - gap * f; };
  const yB = (x: number) => { const th = ((x - x0) / period) * 2 * Math.PI + ph + off; return cy + amp * Math.sin(th) * (1 - f) + gap * f; };
  [...SEQ].forEach((b, i) => {
    const x = x0 + i * bp, a = yA(x), c = yB(x), m = (a + c) / 2;
    p.line([[x, a], [x, m]], { stroke: BASE[b], width: 10 }); p.line([[x, m], [x, c]], { stroke: BASE[PAIR[b]], width: 10 });
    if (f > 0.85) { const k = (f - 0.85) / 0.15; p.text(b, x, a + 28, { size: 24, font: 'gothic', weight: 900, fill: '#fff', stroke: INK, strokeW: 5, align: 'center', opacity: k }); p.text(PAIR[b], x, c - 28, { size: 24, font: 'gothic', weight: 900, fill: '#fff', stroke: INK, strokeW: 5, align: 'center', opacity: k }); }
  });
  const strand = (fn: (x: number) => number, col: string) => { const pts: P2[] = []; for (let x = x0 - 20; x <= x1 + 20; x += 8) pts.push([x, fn(x)]); p.line(pts, { stroke: INK, width: 16 }); p.line(pts, { stroke: col, width: 10 }); };
  strand(yB, blue); strand(yA, yellow);
  // directions
  const arrow = (xa: number, xb: number, y: number, k: number, col: string) => {
    if (k <= 0) return; const xe = xa + (xb - xa) * k, sg = Math.sign(xb - xa);
    p.line([[xa, y], [xe, y]], { stroke: col, width: 7 }); p.line([[xe - sg * 24, y - 16], [xe, y], [xe - sg * 24, y + 16]], { stroke: col, width: 7 });
  };
  const top = rc.u('top', 1.4), bot = rc.u('bot', 1.0);
  arrow(x0, x1, cy - gap - 70, top, yellow);
  label(p, "5'", x0 - 40, cy - gap, 34, { align: 'center', fill: yellow, a: rc.u('top', 0.3) }); label(p, "3'", x1 + 40, cy - gap, 34, { align: 'center', fill: yellow, a: rc.u('top+0.8', 0.3) });
  arrow(x1, x0, cy + gap + 70, bot, blue);
  label(p, "3'", x0 - 40, cy + gap, 34, { align: 'center', fill: blue, a: rc.u('bot+0.5', 0.3) }); label(p, "5'", x1 + 40, cy + gap, 34, { align: 'center', fill: blue, a: rc.u('bot', 0.3) });
  term(p, '逆平行', 640, 90, rc.u('anti', 0.2), 84, '#ff6a55');
  label(p, 'はしご', 640, 600, 34, { align: 'center', a: rc.u('ladder', 0.3) * (1 - rc.u('top', 0.3)) });
}

/* ---------- テーマ3：ワトソン・クリック型塩基対 ---------- */
function pentOnEdge(A: P2, B: P2, away: P2, s: number): P2[] {
  // regular pentagon with edge A–B, on the side away from `away`; returns [A, B, v3, v4, v5] going B→…→A
  const mid = lerp(A, B, 0.5), e: P2 = [B[0] - A[0], B[1] - A[1]], len = Math.hypot(e[0], e[1]);
  let n: P2 = [-e[1] / len, e[0] / len];
  if ((mid[0] - away[0]) * n[0] + (mid[1] - away[1]) * n[1] < 0) n = [-n[0], -n[1]];
  const c = add(mid, n, s * 0.688), R = s / (2 * Math.sin(Math.PI / 5));
  const aB = Math.atan2(B[1] - c[1], B[0] - c[0]), aA = Math.atan2(A[1] - c[1], A[0] - c[0]);
  let d = aA - aB; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const step = -Math.sign(d) * (2 * Math.PI / 5);
  return [A, B, ...[1, 2, 3].map((i) => [c[0] + R * Math.cos(aB + step * i), c[1] + R * Math.sin(aB + step * i)] as P2)];
}
function pairFig(p: Pen, pur: 'A' | 'G', cx: number, cy: number, s: number, o: { bonds: number; glow?: number; c1?: (a: P2, b: P2) => void }) {
  const pyr = pur === 'A' ? 'T' : 'C';
  const Pc: P2 = [cx - 160, cy], Yc: P2 = [Pc[0] + 2 * s + 75 * (s / 36), cy];
  const hp = (c: P2, a: number) => add(c, dir(a), s);
  // purine six-ring: N1 0°, C2 60°, N3 120°, C4 180°, C5 240°, C6 300°
  const N1 = hp(Pc, 0), C2 = hp(Pc, 60), N3 = hp(Pc, 120), C4 = hp(Pc, 180), C5 = hp(Pc, 240), C6 = hp(Pc, 300);
  const r5 = pentOnEdge(C4, C5, Pc, s); // C4, C5, N7, C8, N9
  const N7 = r5[2], N9 = r5[4];
  // pyrimidine: N3 180°, C4 240°, C5 300°, C6 0°, N1 60°, C2 120°
  const yN3 = hp(Yc, 180), yC4 = hp(Yc, 240), yC5 = hp(Yc, 300), yC6 = hp(Yc, 0), yN1 = hp(Yc, 60), yC2 = hp(Yc, 120);
  p.path(poly(r5), { fill: BASE[pur], stroke: INK, width: 4, opacity: 0.9 });
  p.path(poly([N1, C2, N3, C4, C5, C6]), { fill: BASE[pur], stroke: INK, width: 4, opacity: 0.9 });
  p.path(poly([yN3, yC4, yC5, yC6, yN1, yC2]), { fill: BASE[pyr], stroke: INK, width: 4, opacity: 0.9 });
  const sub = (from: P2, a: number) => add(from, dir(a), s * 0.95);
  const pN6orO6 = sub(C6, 300), pN2 = sub(C2, 60), yO4orN4 = sub(yC4, 240), yO2 = sub(yC2, 120), yMe = sub(yC5, 300);
  const bond = (a: P2, b: P2, dbl = false) => { if (dbl) { const e = dir((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90); p.line([add(a, e, 4), add(b, e, 4)], { stroke: INK, width: 4 }); p.line([add(a, e, -4), add(b, e, -4)], { stroke: INK, width: 4 }); } else p.line([a, b], { stroke: INK, width: 4 }); };
  bond(C6, pN6orO6, pur === 'G'); if (pur === 'G') bond(C2, pN2);
  bond(yC4, yO4orN4, pyr === 'T'); bond(yC2, yO2, true); if (pyr === 'T') bond(yC5, yMe);
  // glycosidic bonds to C1' (same side for both)
  const c1a = add(N9, dir(120), s * 0.95), c1b = add(yN1, dir(60), s * 0.95);
  p.line([N9, c1a], { stroke: '#bbb', width: 4 }); p.line([yN1, c1b], { stroke: '#bbb', width: 4 });
  p.text("糖", c1a[0] - 10, c1a[1] + 18, { size: 20, font: 'gothic', weight: 900, fill: '#bbb', align: 'center' });
  p.text("糖", c1b[0] + 10, c1b[1] + 18, { size: 20, font: 'gothic', weight: 900, fill: '#bbb', align: 'center' });
  o.c1?.(c1a, c1b);
  // hydrogen bonds: donor–H…acceptor
  const hb: [P2, P2][] = pur === 'A' ? [[pN6orO6, yO4orN4], [yN3, N1]] : [[yO4orN4, pN6orO6], [N1, yN3], [pN2, yO2]];
  hb.forEach(([d, acc], i) => {
    const k = CL(o.bonds - i); if (k <= 0) return;
    const hpos = lerp(d, acc, 0.34), end = lerp(hpos, acc, k);
    p.line([d, hpos], { stroke: '#fff', width: 3, opacity: k });
    p.line([lerp(hpos, acc, 0.18), end], { stroke: yellow, width: 5, dash: [7, 6] });
    p.circle(hpos[0], hpos[1], 12, { fill: '#fff', stroke: INK, width: 2, opacity: k });
    p.text('H', hpos[0], hpos[1], { size: 16, font: 'gothic', weight: 900, fill: '#111', align: 'center', opacity: k });
  });
  // atom letters
  for (const n of [N1, N3, N7, N9, yN1, yN3]) atom(p, 'N', n, 24, '#bfe0ff');
  atom(p, pur === 'A' ? 'N' : 'O', pN6orO6, 24, pur === 'A' ? '#bfe0ff' : '#ff9a7a');
  if (pur === 'G') atom(p, 'N', pN2, 24, '#bfe0ff');
  atom(p, pyr === 'T' ? 'O' : 'N', yO4orN4, 24, pyr === 'T' ? '#ff9a7a' : '#bfe0ff');
  atom(p, 'O', yO2, 24, '#ff9a7a');
  if (pyr === 'T') p.text('CH₃', add(yMe, dir(300), 14)[0], add(yMe, dir(300), 14)[1], { size: 24, font: 'gothic', weight: 900, fill: '#fff', stroke: INK, strokeW: 4, align: 'center' });
  p.text(pur, Pc[0], Pc[1], { size: 40, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
  p.text(pyr, Yc[0], Yc[1], { size: 40, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
  if (o.glow) p.circle(cx, cy, 160, { stroke: yellow, width: 4, opacity: o.glow * 0.5 });
}
function basepairFig(rc: RC) {
  const { p } = rc;
  const s = 60, ATy = 195, GCy = 455, cx = 600;
  const at = rc.u('at', 1.2) * 2, gc = rc.u('gc', 1.4) * 3;
  const c1s: P2[][] = [];
  pairFig(p, 'A', cx, ATy, s, { bonds: rc.u('zoom', 0.1) > 0 ? Math.max(at, rc.u('rings', 0.1) * 2) : 0, c1: (a, b) => c1s.push([a, b]) });
  pairFig(p, 'G', cx, GCy, s, { bonds: Math.max(gc, rc.u('rings', 0.1) * 3), c1: (a, b) => c1s.push([a, b]) });
  label(p, 'A=T　水素結合 2本', 1080, ATy - 30, 30, { align: 'center', fill: yellow, a: rc.u('at+0.4', 0.3) });
  label(p, 'G≡C　水素結合 3本', 1080, GCy - 30, 30, { align: 'center', fill: yellow, a: rc.u('gc+0.4', 0.3) });
  const rg = rc.u('rings', 0.3);
  label(p, 'プリン（環2つ）', 250, 60, 30, { align: 'center', fill: CHALK.y, a: rg });
  label(p, 'ピリミジン（環1つ）', 760, 60, 30, { align: 'center', fill: CHALK.y, a: rg });
  // the C1'–C1' span is the same for both pairs
  const w = rc.u('same', 0.6);
  if (w > 0 && c1s.length === 2) {
    c1s.forEach(([a, b]) => { const y = a[1] + 46; p.line([[a[0], y], [a[0] + (b[0] - a[0]) * w, y]], { stroke: '#ff8a7a', width: 5 }); for (const x of [a[0], b[0]]) p.line([[x, y - 12], [x, y + 12]], { stroke: '#ff8a7a', width: 5, opacity: w }); });
    label(p, '1.08 nm', 1080, GCy + 60, 40, { align: 'center', fill: '#ff8a7a', a: rc.u('same+0.4', 0.3) });
    label(p, 'どの対も同じ幅', 1080, ATy + 60, 28, { align: 'center', fill: '#ff8a7a', a: rc.u('same+0.6', 0.3) });
  }
}

/* ---------- テーマ3：ホスホジエステル結合 ---------- */
function backboneFig(rc: RC) {
  const { p } = rc;
  const ys = [130, 265, 400, 535], r = 46, X = 560;
  const grow = rc.u('grow+0.4', 1.2), link = rc.u('link', 0.4), pde = rc.u('pde', 0.3);
  const n = grow > 0 ? 4 : 3;
  const pos = (i: number) => { const y = ys[i] + (i === 3 ? (1 - ease.outCubic(grow)) * 120 : 0), x = X + (i === 3 ? (1 - ease.outCubic(grow)) * 200 : 0); return { x, y, v: pent(x, y, r) }; };
  const letters = 'ACGT';
  for (let i = 0; i < n; i++) {
    const { x, y, v } = pos(i), a = i === 3 ? CL(grow * 2) : 1;
    p.save(); p.alpha(a);
    const c4 = v[4], c5: P2 = [c4[0] - 12, c4[1] - 44];
    p.line([c4, c5], { stroke: '#f1e6d2', width: 5 });
    p.line([v[1], [v[1][0] + 52, v[1][1]]], { stroke: '#f1e6d2', width: 5 });
    baseHex(p, v[1][0] + 90, v[1][1], 38, letters[i]);
    sugarRing(p, x, y, r);
    if (i === 0) { p.line([c5, [c5[0] - 52, c5[1]]], { stroke: '#f1e6d2', width: 5 }); phosphate(p, c5[0] - 74, c5[1], 22); }
    // link to the next nucleotide: 3'C – O – P – O – 5'C
    if (i < n - 1) {
      const nx = pos(i + 1), nc5: P2 = [nx.v[4][0] - 12, nx.v[4][1] - 44];
      const c3 = v[3], o3: P2 = [c3[0] - 34, c3[1] + 22], P0: P2 = [o3[0] - 34, (o3[1] + nc5[1]) / 2 + 4], o5: P2 = [nc5[0] - 40, nc5[1]];
      const hot = i === 0 ? link : i === 2 ? CL(grow * 2 - 1) : 0;
      const chain: P2[] = [c3, o3, P0, o5, nc5];
      if (hot > 0) { p.line(chain, { stroke: yellow, width: 16, opacity: 0.45 * hot }); }
      p.line(chain, { stroke: '#f1e6d2', width: 5 });
      atom(p, 'O', o3, 18, '#ff9a7a'); atom(p, 'O', o5, 18, '#ff9a7a');
      phosphate(p, P0[0], P0[1], 22);
      if (i === 0) { label(p, "3'", c3[0] + 22, c3[1] + 14, 26, { align: 'center', fill: CHALK.y, a: link }); label(p, "5'", nc5[0] + 26, nc5[1] + 4, 26, { align: 'center', fill: CHALK.y, a: rc.u('link+0.8', 0.3) }); }
    }
    p.restore();
  }
  term(p, 'ホスホジエステル結合', 1000, 330, pde, 46, yellow);
  label(p, "3'炭素 ― O ― P ― O ― 次の5'炭素", 1000, 395, 26, { align: 'center', a: rc.u('pde+0.5', 0.3) });
  // 5' → 3'
  const g = rc.u('grow', 1.0);
  if (g > 0) {
    const x = 330, ya = 110, yb = 110 + 430 * g;
    p.line([[x, ya], [x, yb]], { stroke: '#fff', width: 7 }); p.line([[x - 18, yb - 24], [x, yb], [x + 18, yb - 24]], { stroke: '#fff', width: 7 });
    label(p, "5'", x - 50, ya, 36, { align: 'center', fill: CHALK.y, a: g }); label(p, "3'", x - 50, 540, 36, { align: 'center', fill: CHALK.y, a: rc.u('grow+0.8', 0.3) });
    label(p, '伸びる向き', 200, 330, 28, { align: 'center', a: g });
  }
}

/* ---------- 考える問題：G-C対が多いほど引き離しにくい ---------- */
function tugFig(rc: RC) {
  const { p, t } = rc;
  const x0 = 250, x1 = 1030, n = 10, step = (x1 - x0) / (n - 1);
  const strain = rc.u('pull', 1.0) * (1 - rc.u('ans', 0.2) * 0) * 10 + Math.sin(t * 30) * 2 * rc.u('pull', 0.3);
  const brk = rc.u('total', 1.2), hold = rc.u('hard', 0.3);
  const lad = (cy: number, seq: string, d: number, glow: number, title: string) => {
    const ya = cy - 46 - d, yb = cy + 46 + d;
    [...seq].forEach((b, i) => {
      const x = x0 + i * step, gc = b === 'G' || b === 'C', nb = gc ? 3 : 2;
      p.line([[x, ya], [x, ya + 30]], { stroke: BASE[b], width: 10 }); p.line([[x, yb - 30], [x, yb]], { stroke: BASE[PAIR[b]], width: 10 });
      const intact = d < 30;
      for (let j = 0; j < nb; j++) { const xx = x - (nb - 1) * 5 + j * 10; if (intact) p.line([[xx, ya + 32], [xx, yb - 32]], { stroke: yellow, width: 3, dash: [5, 4] }); }
    });
    for (const [y, col] of [[ya, yellow], [yb, blue]] as const) { p.line([[x0 - 30, y], [x1 + 30, y]], { stroke: INK, width: 16 }); p.line([[x0 - 30, y], [x1 + 30, y]], { stroke: col, width: 10 }); }
    if (glow > 0) p.rect(x0 - 50, ya - 26, x1 - x0 + 100, yb - ya + 52, { stroke: '#fff6b0', width: 6, opacity: glow }, 14);
    label(p, title, 130, cy, 30, { align: 'center', fill: '#fff' });
    // the pull
    const pk = rc.u('pull', 0.4);
    if (pk > 0) for (const [y, sg] of [[ya, -1], [yb, 1]] as const) { const xm = (x0 + x1) / 2; p.line([[xm, y + sg * 12], [xm, y + sg * (48 + 10 * Math.sin(t * 12))]], { stroke: '#ff6a55', width: 8, opacity: pk }); p.line([[xm - 16, y + sg * 34], [xm, y + sg * 52], [xm + 16, y + sg * 34]], { stroke: '#ff6a55', width: 8, opacity: pk }); }
  };
  lad(215, 'GCGCCGTGCG', strain * 0.4, hold, 'G-C対が多い');
  lad(470, 'ATATTAGATA', strain * 0.4 + 70 * ease.outCubic(brk), 0, 'A-T対が多い');
  label(p, '？', 1170, 340, 90, { align: 'center', fill: CHALK.y, a: rc.u('which', 0.3) * (1 - rc.u('ans', 0.3)) });
  label(p, 'G≡C 3本', 1160, 215, 32, { align: 'center', fill: yellow, a: rc.u('ans', 0.3) });
  label(p, 'A=T 2本', 1160, 470, 32, { align: 'center', fill: yellow, a: rc.u('ans+0.8', 0.3) });
  const th = rc.u('think', 0.3);
  term(p, '引き離しにくい', 640, 90, hold * (1 - th), 64, '#fff6b0');
  term(p, '「だから どうなるか」', 640, 90, th, 56, CHALK.y);
}

/* ---------- テーマ4：核酸の代謝 ---------- */
function purineIcon(p: Pen, x: number, y: number, s: number, col = BASE.G) {
  const six = hexagon(x, y, s, 30), r5 = pentOnEdge(six[0], six[5], [x, y], s);
  p.path(poly(r5), { fill: col, stroke: INK, width: 3 }); p.path(poly(six), { fill: col, stroke: INK, width: 3 });
}
function digestFig(rc: RC) {
  const { p, t } = rc;
  const fk = rc.u('food', 0.5), sp = rc.u('split', 0.8);
  // dietary nucleic acid (a short chain) moving into the gut
  const cx = 170 + 120 * ease.inOut(CL(sp * 1.4));
  p.save(); p.alpha(fk * (1 - CL(sp * 1.6 - 0.6)));
  for (let j = 0; j < 3; j++) nucleoMini(p, cx, 200 + j * 90, 0.95, 'AGC'[j]);
  p.restore();
  label(p, '食事の核酸', 170, 120, 30, { align: 'center', fill: CHALK.y, a: fk });
  // small intestine
  p.path('M 330 470 C 380 430 420 510 470 470 S 560 430 600 470', { stroke: '#d98a7a', width: 34, opacity: fk });
  p.path('M 330 470 C 380 430 420 510 470 470 S 560 430 600 470', { stroke: '#f2b8a8', width: 22, opacity: fk });
  label(p, '小腸', 465, 545, 30, { align: 'center', a: fk });
  // products
  if (sp > 0) {
    p.save(); p.alpha(sp);
    sugarRing(p, 640, 190, 34); phosphate(p, 580, 150, 16);
    label(p, 'ペントースリン酸', 640, 255, 26, { align: 'center' });
    baseHex(p, 650, 380, 34, ''); label(p, '塩基', 650, 380, 24, { align: 'center' });
    p.restore();
    p.line([[600, 440], [630, 410]], { stroke: '#fff', width: 4, opacity: sp });
  }
  // pyrimidine → NH₃ + CO₂
  const py = rc.u('py', 0.6);
  if (py > 0) {
    p.line([[700, 360], [810, 260]], { stroke: '#fff', width: 5, opacity: py });
    p.save(); p.alpha(py); p.path(poly(hexagon(860, 240, 34, 30)), { fill: BASE.C, stroke: INK, width: 3 }); p.restore();
    label(p, 'ピリミジン（環1つ）', 860, 175, 26, { align: 'center', fill: CHALK.y, a: py });
    const k = rc.u('py+1.2', 0.6);
    p.line([[905, 240], [970, 240]], { stroke: '#fff', width: 5, opacity: k }); p.line([[955, 228], [972, 240], [955, 252]], { stroke: '#fff', width: 5, opacity: k });
    label(p, 'NH₃ ＋ CO₂', 1105, 240, 38, { align: 'center', a: k });
    label(p, 'アンモニア・二酸化炭素', 1105, 290, 22, { align: 'center', fill: '#ccc', a: k });
  }
  // purine → uric acid
  const pu = rc.u('pu', 0.6);
  if (pu > 0) {
    p.line([[700, 400], [810, 480]], { stroke: '#fff', width: 5, opacity: pu });
    p.save(); p.alpha(pu); purineIcon(p, 845, 500, 30); p.restore();
    label(p, 'プリン（環2つ）', 860, 575, 26, { align: 'center', fill: CHALK.y, a: pu });
    const k = rc.u('ua', 0.5);
    p.line([[920, 500], [970, 500]], { stroke: '#fff', width: 5, opacity: k }); p.line([[955, 488], [972, 500], [955, 512]], { stroke: '#fff', width: 5, opacity: k });
    if (k > 0) for (let j = 0; j < 14; j++) { const a = rnd(j) * Math.PI, l = 22 + rnd(j * 3) * 26, x = 1040 + rnd(j * 5) * 100, y = 470 + rnd(j * 7) * 60; p.line([[x, y], [x + Math.cos(a) * l * k, y + Math.sin(a) * l * k]], { stroke: '#fff6f0', width: 3 }); }
    label(p, '尿酸', 1090, 430, 40, { align: 'center', fill: '#ff8a7a', a: k });
  }
  void t;
}

/* ---------- テーマ4：痛風、食べた核酸はそのまま使わない ---------- */
const FOOT = 'M 300 120 L 300 430 C 290 500 300 545 360 548 L 980 548 C 1050 548 1072 522 1062 497 C 1052 474 1012 466 962 462 C 882 452 762 402 602 332 C 522 292 452 252 442 120 Z';
function goutFig(rc: RC) {
  const { p, g, t } = rc;
  const toB = rc.u('no', 0.5);
  if (toB < 1) {
    p.save(); p.alpha(1 - toB);
    p.path(FOOT, { fill: 'rgba(232,217,194,0.16)', stroke: '#e8d9c2', width: 6 });
    // bones (lateral view, schematic): metatarsal → big-toe phalanges
    p.line([[560, 430], [890, 496]], { stroke: 'rgba(255,255,255,0.35)', width: 18 });
    p.line([[920, 500], [1040, 506]], { stroke: 'rgba(255,255,255,0.35)', width: 16 });
    const J: P2 = [905, 498];
    // blood vessel with uric acid
    p.path('M 300 230 C 450 250 560 300 700 360 S 900 430 1000 450', { stroke: '#7a1010', width: 26 });
    p.path('M 300 230 C 450 250 560 300 700 360 S 900 430 1000 450', { stroke: '#c0392b', width: 18 });
    const hi = rc.u('high', 1.2), nDots = 6 + Math.round(18 * hi);
    for (let i = 0; i < nDots; i++) { const u = ((rnd(i) + t * 0.12) % 1), x = 300 + u * 700, y = 230 + (u ** 1.1) * 220 + (rnd(i * 3) - 0.5) * 10; p.circle(x, y, 4, { fill: '#fff6f0' }); }
    label(p, '血中の尿酸', 420, 190, 28, { align: 'center', fill: '#ffb0a6', a: rc.u('high', 0.3) });
    // crystals deposit in the joint (needle-shaped)
    const dep = rc.u('dep', 2.5);
    for (let j = 0; j < Math.round(26 * dep); j++) { const a = rnd(j) * Math.PI * 2, l = 10 + rnd(j * 3) * 20, x = J[0] + (rnd(j * 5) - 0.5) * 60, y = J[1] + (rnd(j * 7) - 0.5) * 44; p.line([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], { stroke: '#fffaf0', width: 2.5 }); }
    const gt = rc.u('gout', 0.3);
    if (gt > 0) { const pulse = 0.55 + 0.45 * Math.sin(t * 9); p.circle(J[0], J[1], 70 + 10 * pulse, { fill: `rgba(208,37,26,${0.45 * gt * pulse})` }); p.circle(J[0], J[1], 46, { stroke: '#ff4a3a', width: 6, opacity: gt }); }
    label(p, '親指の付け根の関節', 905, 600, 26, { align: 'center', a: rc.u('dep', 0.3) * (1 - rc.u('gout-0.2', 0.2)) });
    label(p, '尿酸の結晶', 1110, 420, 28, { align: 'center', fill: '#fff6f0', a: rc.u('dep+1', 0.3) });
    term(p, '痛風', 760, 330, gt, 96, '#ff5a45');
    p.restore();
  }
  if (toB > 0) {
    p.save(); p.alpha(toB);
    // eaten nucleic acid ✕→ my DNA / RNA
    for (let j = 0; j < 3; j++) nucleoMini(p, 230, 170 + j * 80, 0.9, 'GAT'[j]);
    label(p, '吸収した核酸', 230, 100, 28, { align: 'center', fill: CHALK.y });
    p.line([[340, 250], [700, 250]], { stroke: '#fff', width: 6 }); p.line([[680, 236], [702, 250], [680, 264]], { stroke: '#fff', width: 6 });
    const x = rc.u('no+0.8', 0.3);
    if (x > 0) { p.line([[480, 190], [560, 310]], { stroke: '#ff4a3a', width: 14, opacity: x }); p.line([[560, 190], [480, 310]], { stroke: '#ff4a3a', width: 14, opacity: x }); }
    p.save(); p.translate(940, 250); p.rotate(0); helix(p, -140, 140, 0, 40, 160, t * 1.5, { lw: 4 }); p.restore();
    label(p, '自分のDNA・RNA', 940, 160, 28, { align: 'center' });
    // made new from small parts
    const nk = rc.u('new', 1.2);
    if (nk > 0) {
      for (let j = 0; j < 4; j++) { const k = CL(nk * 4 - j); const sx = 300 + j * 110, sy = 470; nucleoMini(p, sx + (1 - ease.outCubic(k)) * (rnd(j) - 0.5) * 200, sy - (1 - ease.outCubic(k)) * 120, 0.8, 'ACGT'[j], { P: k, S: k, B: k }); }
      p.line([[760, 470], [860, 330]], { stroke: CHALK.y, width: 6, opacity: nk }); p.line([[836, 334], [862, 328], [858, 354]], { stroke: CHALK.y, width: 6, opacity: nk });
      label(p, '材料から新しく合成', 520, 580, 32, { align: 'center', fill: CHALK.y, a: rc.u('new+0.5', 0.3) });
    }
    p.restore();
  }
  void g;
}

function reddish(rc: RC) {
  const { g, t } = rc;
  const gr = g.createRadialGradient(640, 380, 40, 640, 360, 900); gr.addColorStop(0, '#3a1612'); gr.addColorStop(1, '#070303');
  g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
  for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,190,170,${0.1 + 0.25 * rnd(i * 13)})`; g.beginPath(); g.arc((rnd(i) * 1600 + t * 10) % 1600 - 160, rnd(i * 17) * 860 - 60 + Math.sin(t + i) * 8, 1 + rnd(i * 3) * 2, 0, 7); g.fill(); }
}

export const FILM2_PLATE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  monomers: nucleoplasm, nucleotide: nucleoplasm, sugar: nucleoplasm, bases: nucleoplasm, ntp: nucleoplasm,
  'dna-helix': nucleoplasm, ladder: nucleoplasm, basepair: nucleoplasm, backbone: nucleoplasm, tug: streaks, digest: warmFluid, gout: reddish,
};
export const FILM2_FIGURE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  monomers: monomersFig, nucleotide: nucleotideFig, sugar: sugarFig, bases: basesFig, ntp: ntpFig,
  'dna-helix': helixFig, ladder: ladderFig, basepair: basepairFig, backbone: backboneFig, tug: tugFig, digest: digestFig, gout: goutFig,
};
