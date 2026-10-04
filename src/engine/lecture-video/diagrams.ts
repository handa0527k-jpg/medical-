/**
 * Exact figures (医学図), drawn through a Pen so the same code animates the film and exports SVG.
 *
 * - 肺炎球菌: lancet-shaped diplococci (two cells joined end to end). S株 = surrounded by a thick
 *   polysaccharide capsule (被膜あり・表面が滑らか); R株 = the same cells without a capsule. The only
 *   difference shown is the capsule, as in slide 14.
 * - Colonies on a dish: S = smooth, glossy, round; R = rough, matte, irregular edge.
 * - Test tubes in the material's order; chalk text from the lecture's own blackboard ops.
 */
import type { Pen } from './pen';
import type { BoardOp, ChalkColor, Prim } from '../board/types';

export const INK = '#0b0b0f';
export const PAPER = '#efe9da';
export const CHALK: Record<ChalkColor, string> = { w: '#f3f0e6', y: '#f6d64f', r: '#ff6a55', b: '#8cc4ff' };

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- 肺炎球菌（双球菌） ---------- */
const A = 44, B = 29; // half-length / half-width of one cell
const cellPath = () =>
  `M 3 ${-B} C ${3 + A * 0.95} ${-B * 1.06}, ${3 + A * 1.72} ${-B * 0.58}, ${3 + A * 2} 0 C ${3 + A * 1.72} ${B * 0.58}, ${3 + A * 0.95} ${B * 1.06}, 3 ${B} C -1 ${B * 0.55}, -1 ${-B * 0.55}, 3 ${-B} Z`;

/** one diplococcus centred at the origin, long axis horizontal; capsule 0..1 (thickness), lit from the upper left */
export function diplococcus(p: Pen, o: { capsule: number; fill?: string; ink?: string; lw?: number; glow?: number }) {
  const ink = o.ink ?? INK, lw = o.lw ?? 4.5;
  const cap = Math.max(0, Math.min(1, o.capsule));
  if (cap > 0.01) {
    const t = 26 * cap;
    // the capsule: a smooth translucent layer around the whole pair
    p.ellipse(0, 0, A * 2 + 6 + t, B + t, 0, { fill: `rgba(214,236,226,${0.1 + 0.14 * cap})`, stroke: 'rgba(225,245,235,0.95)', width: 2.6, opacity: cap });
    p.ellipse(0, 0, A * 2 + 6 + t + 2.5, B + t + 2.5, 0, { stroke: ink, width: 2.2, opacity: 0.8 * cap });
    // gloss
    p.path(`M ${-A * 1.6} ${-B - t * 0.55} Q 0 ${-B - t * 1.05} ${A * 1.4} ${-B - t * 0.6}`, { stroke: `rgba(255,255,255,${0.75 * cap})`, width: 3.2 });
  }
  for (const sx of [1, -1]) {
    p.save(); p.scale(sx, 1);
    p.path(cellPath(), { fill: o.fill ?? '#cfc6b0', stroke: ink, width: lw });
    // ink hatching on the shadow side (lower edge)
    for (let k = 0; k < 6; k++) { const x = 12 + k * 12; p.line([[x, B * 0.32], [x + 9, B * 0.82]], { stroke: ink, width: 1.6, opacity: 0.7 }); }
    p.restore();
  }
  // septum between the two cells
  p.line([[0, -B * 0.62], [0, B * 0.62]], { stroke: ink, width: lw * 0.7 });
}

/* ---------- colonies / dishes ---------- */
function colony(p: Pen, x: number, y: number, r: number, smooth: number, seed: number) {
  // rough → smooth: the edge noise fades and a glossy highlight appears
  const pts: string[] = [];
  const N = 28, rough = (1 - smooth) * 0.28;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2, k = 1 + rough * (rnd(seed * 31 + i) - 0.5) * 2 + rough * 0.5 * Math.sin(a * 5 + seed);
    pts.push(`${(x + Math.cos(a) * r * k).toFixed(1)} ${(y + Math.sin(a) * r * k * 0.82).toFixed(1)}`);
  }
  const d = `M ${pts.join(' L ')} Z`;
  p.path(d, { fill: smooth > 0.5 ? '#efe4c4' : '#bdb39c', stroke: INK, width: 2.2 });
  if (smooth < 0.6) for (let i = 0; i < 4; i++) p.circle(x + (rnd(seed + i) - 0.5) * r, y + (rnd(seed + i + 9) - 0.5) * r * 0.6, 1.6, { fill: INK, opacity: 0.55 * (1 - smooth) });
  if (smooth > 0.05) p.ellipse(x - r * 0.3, y - r * 0.32, r * 0.38, r * 0.16, -0.4, { fill: '#ffffff', opacity: 0.85 * smooth });
}

/** a petri dish seen slightly from above with colonies; smooth 0 = R株型, 1 = S株型 */
export function dish(p: Pen, x: number, y: number, r: number, smooth: number, seed = 1) {
  p.ellipse(x, y + 10, r + 8, (r + 8) * 0.42, 0, { fill: 'rgba(0,0,0,0.45)' });
  p.ellipse(x, y, r + 6, (r + 6) * 0.42, 0, { fill: '#2b2a26', stroke: INK, width: 5 });
  p.ellipse(x, y - 3, r, r * 0.4, 0, { fill: '#8f8a66', stroke: '#d8d3c0', width: 2 });
  for (let i = 0; i < 7; i++) {
    const a = rnd(seed * 7 + i) * Math.PI * 2, rr = rnd(seed * 13 + i) * r * 0.62;
    colony(p, x + Math.cos(a) * rr, y - 3 + Math.sin(a) * rr * 0.4, 9 + rnd(seed + i * 3) * 7, smooth, seed * 10 + i);
  }
  p.path(`M ${x - r * 0.8} ${y - r * 0.28} Q ${x} ${y - r * 0.5} ${x + r * 0.7} ${y - r * 0.3}`, { stroke: 'rgba(255,255,255,0.55)', width: 3 });
}

/* ---------- test tube ---------- */
export function tube(p: Pen, x: number, y: number, h: number, level: number, liquid: string) {
  const w = 54, r = w / 2, top = y, bot = y + h;
  const body = `M ${x - r} ${top} L ${x - r} ${bot - r} A ${r} ${r} 0 0 0 ${x + r} ${bot - r} L ${x + r} ${top}`;
  if (level > 0.01) {
    const ly = bot - r - (h - r) * level * 0.82;
    p.path(`M ${x - r + 3} ${ly} L ${x - r + 3} ${bot - r} A ${r - 3} ${r - 3} 0 0 0 ${x + r - 3} ${bot - r} L ${x + r - 3} ${ly} Z`, { fill: liquid });
    p.ellipse(x, ly, r - 3, 5, 0, { fill: 'rgba(255,255,255,0.35)', stroke: INK, width: 1.5 });
  }
  p.path(body, { stroke: INK, width: 5.5, fill: 'rgba(220,235,240,0.06)' });
  p.ellipse(x, top, r + 4, 7, 0, { stroke: INK, width: 5, fill: 'rgba(200,220,230,0.15)' });
  p.line([[x - r + 11, top + 22], [x - r + 11, bot - r - 10]], { stroke: 'rgba(255,255,255,0.75)', width: 4 });
}

/* ---------- chalk (the lecture's own blackboard ops) ---------- */
export interface ChalkMap { bx: number; by: number; sx: number; sy: number; k: number }
/** draw a board op's text / lines; `reveal` 0..1 writes it progressively */
export function chalkOp(p: Pen, op: BoardOp, m: ChalkMap, reveal = 1, color?: string) {
  for (const prim of op.prims ?? []) chalkPrim(p, prim, m, reveal, color);
}
function chalkPrim(p: Pen, prim: Prim, m: ChalkMap, reveal: number, color?: string) {
  const X = (x: number) => (x - m.bx) * m.k + m.sx, Y = (y: number) => (y - m.by) * m.k + m.sy;
  if (prim.p === 'line') {
    const pts = prim.pts.map(([x, y]) => [X(x), Y(y)] as [number, number]);
    const [a, b] = [pts[0], pts[pts.length - 1]];
    const e: [number, number] = [a[0] + (b[0] - a[0]) * reveal, a[1] + (b[1] - a[1]) * reveal];
    p.line([a, e], { stroke: color ?? CHALK[prim.c], width: 5 * m.k + 1 });
    if (prim.head && reveal > 0.95) arrowHead(p, a, b, color ?? CHALK[prim.c], m.k);
    return;
  }
  const size = prim.s * m.k;
  const total = prim.segs.reduce((n, s) => n + (s.a ? 1 : [...s.t].length), 0);
  let shown = Math.round(total * reveal);
  const widths = prim.segs.map((s) => (s.a ? size * 1.2 : p.measure(s.t, { size, font: 'hand', weight: 600 })));
  const full = widths.reduce((a, b) => a + b, 0);
  let x = prim.center ? X(prim.x) - full / 2 : X(prim.x);
  const y = Y(prim.y);
  prim.segs.forEach((s, i) => {
    if (shown <= 0) return;
    const col = color ?? CHALK[s.c];
    if (s.a) { arrowHead(p, [x + 4, y], [x + widths[i] - 6, y], col, m.k, true); shown -= 1; }
    else { const ch = [...s.t], vis = ch.slice(0, shown).join(''); shown -= ch.length; p.text(vis, x, y, { size, font: 'hand', weight: 600, fill: col }); }
    x += widths[i];
  });
}
function arrowHead(p: Pen, a: [number, number], b: [number, number], col: string, k: number, shaft = false) {
  if (shaft) p.line([a, b], { stroke: col, width: 5 * k + 1 });
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 18 * k + 6;
  p.line([[b[0] - Math.cos(ang - 0.5) * L, b[1] - Math.sin(ang - 0.5) * L], b, [b[0] - Math.cos(ang + 0.5) * L, b[1] - Math.sin(ang + 0.5) * L]], { stroke: col, width: 5 * k + 1 });
}
/** the screen box of an op */
export const opBox = (op: BoardOp, m: ChalkMap) => ({ x: (op.box[0] - m.bx) * m.k + m.sx, y: (op.box[1] - m.by) * m.k + m.sy, w: op.box[2] * m.k, h: op.box[3] * m.k });
/** hand-drawn chalk box around a region, drawn progressively */
export function chalkBox(p: Pen, x: number, y: number, w: number, h: number, reveal: number, col: string) {
  const pts: [number, number][] = [[x, y], [x + w, y - 3], [x + w + 4, y + h], [x - 2, y + h + 3], [x + 2, y - 6]];
  const segs = pts.length - 1, upto = reveal * segs;
  const out: [number, number][] = [pts[0]];
  for (let i = 0; i < segs; i++) {
    if (upto <= i) break;
    const f = Math.min(1, upto - i), a = pts[i], b = pts[i + 1];
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  p.line(out, { stroke: col, width: 6 });
}
