/**
 * Blackboard lecture data. One lecture has one board that the lecturer fills
 * during the whole class; every chalk action is an op tied to the cue (spoken
 * sentence) it accompanies, so the board at any moment is a pure function of
 * lecture time — scrubbing, 10 s jumps, speed changes and the "finished board"
 * all come from the same data.
 *
 * World coordinates: the board is BOARD_W × BOARD_H units (16:9); text size
 * 64 is ordinary handwriting. Ops are generated from the lecture script by
 * scripts/lib/board-script.ts.
 */

/** chalk colours: white = basics, yellow = important, red = exam / most important, blue = supplementary */
export type ChalkColor = 'w' | 'y' | 'r' | 'b';
export type Pt = [number, number];

export const BOARD_W = 3200;
export const BOARD_H = 1800;

export interface TextSeg {
  t: string;
  c: ChalkColor;
  /** drawn chalk arrow instead of a glyph */
  a?: 1;
}

export type Prim =
  /** handwritten text; (x, y) = left edge, vertical centre of the line; s = size */
  | { p: 'text'; x: number; y: number; s: number; segs: TextSeg[]; center?: 1 }
  /** chalk stroke through points; head 1 = arrowhead at the end, 2 = both ends */
  | { p: 'line'; pts: Pt[]; c: ChalkColor; w?: number; head?: 1 | 2; dash?: 1 };

export type MarkKind = 'circle' | 'circle2' | 'box' | 'under' | 'under2' | 'check';

export interface BoardOp {
  /** name used by marks / erases / pointing in the script */
  id?: string;
  /** index of the cue (lecture.cues) this action belongs to */
  cue: number;
  /** start, seconds after the cue starts (1× lecture time) */
  off: number;
  /** drawing time (s); for 'point' the runtime stretches it to the end of the cue */
  dur: number;
  k: 'draw' | 'mark' | 'erase' | 'point';
  prims?: Prim[];
  /** mark / erase / point targets (op ids) */
  target?: string[];
  mark?: MarkKind;
  c?: ChalkColor;
  /** estimated world bbox [x, y, w, h] */
  box: [number, number, number, number];
}

/** camera = [centre x, centre y, width] in board units (height = width × 9/16) */
export type BoardCam = [number, number, number];

export interface Board {
  ops: BoardOp[];
  /** camera keyframes: from this cue on, glide to `c` */
  cams: { cue: number; c: BoardCam }[];
  /** panel titles for the finished-board viewer (left / centre / right / bottom) */
  panels?: { id: string; name: string; box: [number, number, number, number] }[];
}

/* ---------- drawing cost (shared by the script builder and the renderer) ---------- */

/** relative writing effort of one character */
export function charCost(ch: string): number {
  if (/\s/.test(ch)) return 0.25;
  if (/[一-鿿々]/.test(ch)) return 1;
  if (/[぀-ヿー]/.test(ch)) return 0.72;
  if (/[０-９Ａ-Ｚ（）［］「」、。・：]/.test(ch)) return 0.6;
  return 0.5;
}
/** estimated advance width (in em) used for layout before real fonts are measured */
export function charWidth(ch: string): number {
  // measured on Klee One 600 (+ the renderer's 0.015 em letter spacing), rounded up
  if (/\s/.test(ch)) return 0.37;
  if (/[　-鿿＀-￯々ー]/.test(ch)) return 1.02;
  if (/[mwMW]/.test(ch)) return 0.84;
  if (/[A-Z]/.test(ch)) return 0.73;
  if (/[0-9]/.test(ch)) return 0.62;
  return 0.54;
}
export const ARROW_EM = 1.5;

/** seconds per unit of character cost at text size 64 */
export const WRITE_SPEED = 0.15;
/** chalk travel speed for lines (units / s) and pen-lift overhead per stroke */
export const LINE_SPEED = 900;
export const STROKE_LIFT = 0.1;

export function textCost(segs: TextSeg[], s: number): number {
  let c = 0;
  for (const g of segs) {
    if (g.a) c += 1.6;
    else for (const ch of g.t) c += charCost(ch);
  }
  return c * WRITE_SPEED * Math.max(0.7, Math.min(1.5, s / 64));
}
export function textWidth(segs: TextSeg[], s: number): number {
  let w = 0;
  for (const g of segs) {
    if (g.a) w += ARROW_EM;
    else for (const ch of g.t) w += charWidth(ch);
  }
  return w * s;
}
export function lineLength(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}
export function lineCost(pts: Pt[], head?: number): number {
  return lineLength(pts) / LINE_SPEED + STROKE_LIFT + (head ? 0.18 * head : 0);
}
export function primCost(p: Prim): number {
  return p.p === 'text' ? textCost(p.segs, p.s) : lineCost(p.pts, p.head);
}
export function markCost(kind: MarkKind): number {
  return { circle: 0.85, circle2: 1.35, box: 0.95, under: 0.45, under2: 0.8, check: 0.4 }[kind];
}
