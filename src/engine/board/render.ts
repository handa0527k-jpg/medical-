/**
 * Blackboard renderer (canvas 2D, framework-free).
 *
 *   const r = new BoardRenderer(board);          // compile once (after fonts load: r.recompile())
 *   r.attach(cueTimes);                          // absolute start/end of every cue
 *   r.draw(canvas, T, cam, { hand: true });      // any time, any camera
 *
 * The board at time T is fully determined by the op list, so the same code
 * draws the live lecture, a scrubbed position, the finished board and the
 * small inset used in quiz explanations.
 *
 * Realism, cheaply: text is handwritten in a chalk-style font character by
 * character (each character is revealed in 1–3 left-to-right passes, the way a
 * hand moves through it), every character gets its own tilt, size and
 * pressure, strokes are resampled with a smooth wobble, and a world-anchored
 * grain texture is punched out of the chalk layer. Erased writing leaves a
 * faint ghost and eraser smears; dust falls from the chalk tip.
 */
import { ARROW_EM, BOARD_H, BOARD_W, WRITE_SPEED, charCost, type Board, type BoardCam, type BoardOp, type ChalkColor, type Prim, type Pt } from './types';

export const CHALK: Record<ChalkColor, string> = { w: '#f3f0e4', y: '#f9d85c', r: '#ff7b7b', b: '#8fcbff' };
export const BOARD_FONT = `'Klee One', 'Hiragino Maru Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif`;
const GHOST = 0.075;

/* ---------- deterministic randomness ---------- */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const h1 = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const EZ = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const CL = (t: number) => Math.max(0, Math.min(1, t));

/* ---------- compiled items ---------- */
interface CChar { k: 'ch'; ch: string; x: number; b: number; s: number; w: number; c: ChalkColor; rot: number; sc: number; a: number; n: number; f0: number; f1: number }
interface CStroke { k: 'st'; pts: Pt[]; cum: number[]; len: number; c: ChalkColor; w: number; a: number; f0: number; f1: number; dash?: boolean; smear?: boolean }
type Item = CChar | CStroke;
type Box = [number, number, number, number];

interface COp {
  op: BoardOp;
  i: number;
  t0: number;
  t1: number;
  items: Item[];
  box: Box;
  specks: [number, number, number, number][];
  erasedBy: COp[];
  /** erase ops: rows swept by the eraser (alternating direction) */
  rows?: { y0: number; y1: number; x0: number; x1: number }[];
}

export interface DrawOptions {
  /** draw the lecturer's hand / chalk / eraser */
  hand?: boolean;
  /** op ids to glow (pointing, quiz explanations, finished-board viewer) */
  highlight?: string[];
  /** pixel ratio cap */
  dpr?: number;
}

/* ---------- geometry helpers ---------- */
function wobble(pts: Pt[], rnd: () => number, amp = 2.2, step = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step));
    const nx = L ? -(y1 - y0) / L : 0, ny = L ? (x1 - x0) / L : 0;
    const bow = (rnd() - 0.5) * Math.min(10, L * 0.012);
    for (let j = i === 1 ? 0 : 1; j <= n; j++) {
      const u = j / n;
      const off = Math.sin(u * Math.PI) * bow;
      out.push([x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off]);
    }
  }
  // smooth noise
  let prev = 0;
  for (let i = 1; i < out.length - 1; i++) {
    const v = prev * 0.6 + (rnd() - 0.5) * amp * 0.8;
    prev = v;
    const [ax, ay] = out[i - 1], [bx, by] = out[i + 1];
    const L = Math.hypot(bx - ax, by - ay) || 1;
    out[i][0] += (-(by - ay) / L) * v;
    out[i][1] += ((bx - ax) / L) * v;
  }
  return out;
}
function stroke(pts: Pt[], c: ChalkColor, w: number, rnd: () => number, extra: Partial<CStroke> = {}, amp = 2.2): CStroke {
  const p = extra.smear ? pts : wobble(pts, rnd, amp);
  const cum = [0];
  for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  return { k: 'st', pts: p, cum, len: cum[cum.length - 1], c, w, a: 0.9 + rnd() * 0.08, f0: 0, f1: 0, ...extra };
}
function heads(pts: Pt[], c: ChalkColor, w: number, rnd: () => number, both: boolean): CStroke[] {
  const out: CStroke[] = [];
  const one = (tip: Pt, from: Pt) => {
    const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
    const L = 30 + rnd() * 6;
    for (const s of [-1, 1]) {
      const a = ang + Math.PI + s * (0.5 + rnd() * 0.08);
      out.push(stroke([[tip[0] + Math.cos(a) * L, tip[1] + Math.sin(a) * L], tip], c, w, rnd, {}, 0.8));
    }
  };
  one(pts[pts.length - 1], pts[pts.length - 2]);
  if (both) one(pts[0], pts[1]);
  return out;
}
const union = (bs: Box[]): Box => {
  const x0 = Math.min(...bs.map((b) => b[0])), y0 = Math.min(...bs.map((b) => b[1]));
  const x1 = Math.max(...bs.map((b) => b[0] + b[2])), y1 = Math.max(...bs.map((b) => b[1] + b[3]));
  return [x0, y0, x1 - x0, y1 - y0];
};
function itemCost(it: Item): number {
  if (it.k === 'ch') return charCost(it.ch) * WRITE_SPEED * Math.max(0.7, Math.min(1.5, it.s / 64));
  return (it.smear ? it.len / 1800 : it.len / 900) + 0.08;
}
function assignFractions(items: Item[]) {
  const costs = items.map(itemCost), tot = costs.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  items.forEach((it, i) => { it.f0 = acc / tot; acc += costs[i]; it.f1 = acc / tot; });
}

/* ---------- textures (shared) ---------- */
let TEX: HTMLCanvasElement | null = null;
let GRAIN: HTMLCanvasElement | null = null;
const TEX_SCALE = 0.6;
function boardTexture(): HTMLCanvasElement {
  if (TEX) return TEX;
  const c = document.createElement('canvas');
  c.width = Math.round(BOARD_W * TEX_SCALE); c.height = Math.round(BOARD_H * TEX_SCALE);
  const g = c.getContext('2d')!;
  g.scale(TEX_SCALE, TEX_SCALE);
  const rnd = mulberry(7);
  // slate
  const lg = g.createLinearGradient(0, 0, BOARD_W, BOARD_H);
  lg.addColorStop(0, '#20382f'); lg.addColorStop(0.5, '#1b3129'); lg.addColorStop(1, '#172a23');
  g.fillStyle = lg; g.fillRect(0, 0, BOARD_W, BOARD_H);
  // old erased chalk: broad faint arcs and smears from previous classes
  g.lineCap = 'round';
  for (let i = 0; i < 38; i++) {
    const x = rnd() * BOARD_W, y = rnd() * BOARD_H, w = 300 + rnd() * 900;
    g.strokeStyle = `rgba(230,235,225,${0.004 + rnd() * 0.009})`;
    g.lineWidth = 50 + rnd() * 90;
    g.beginPath(); g.moveTo(x, y);
    g.bezierCurveTo(x + w * 0.3, y + (rnd() - 0.5) * 160, x + w * 0.7, y + (rnd() - 0.5) * 160, x + w, y + (rnd() - 0.5) * 60);
    g.stroke();
  }
  // ghost letters of an earlier lesson
  g.font = `600 70px ${BOARD_FONT}`;
  g.fillStyle = 'rgba(240,240,230,0.009)';
  for (let i = 0; i < 10; i++) g.fillText('ATGCAUGC→'.slice(0, 3 + Math.floor(rnd() * 6)), rnd() * BOARD_W, rnd() * BOARD_H);
  // grain
  for (let i = 0; i < 26000; i++) {
    const v = rnd();
    g.fillStyle = v < 0.5 ? `rgba(0,0,0,${0.05 + rnd() * 0.08})` : `rgba(220,235,220,${0.015 + rnd() * 0.03})`;
    const s = 1 + rnd() * 3;
    g.fillRect(rnd() * BOARD_W, rnd() * BOARD_H, s, s);
  }
  // soft light from the room + vignette
  const rg = g.createRadialGradient(BOARD_W * 0.45, BOARD_H * 0.35, 200, BOARD_W * 0.5, BOARD_H * 0.5, BOARD_W * 0.75);
  rg.addColorStop(0, 'rgba(255,255,240,0.05)'); rg.addColorStop(0.6, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = rg; g.fillRect(0, 0, BOARD_W, BOARD_H);
  // aluminium frame + chalk tray
  const F = 34;
  g.fillStyle = '#8d8f8a'; g.fillRect(0, 0, BOARD_W, F); g.fillRect(0, 0, F, BOARD_H); g.fillRect(BOARD_W - F, 0, F, BOARD_H);
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, BOARD_W, 6);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(F, F, BOARD_W - 2 * F, 10); g.fillRect(F, F, 10, BOARD_H - 2 * F);
  const ty = BOARD_H - 58;
  const tg = g.createLinearGradient(0, ty, 0, BOARD_H);
  tg.addColorStop(0, '#b3b5ae'); tg.addColorStop(0.35, '#7d7f79'); tg.addColorStop(1, '#4b4c48');
  g.fillStyle = tg; g.fillRect(0, ty, BOARD_W, 58);
  g.fillStyle = 'rgba(250,250,240,0.35)';
  for (let i = 0; i < 400; i++) g.fillRect(rnd() * BOARD_W, ty + 4 + rnd() * 10, 2 + rnd() * 3, 2);
  // chalk sticks and an eraser in the tray
  const sticks: [number, string][] = [[2380, CHALK.w], [2440, CHALK.y], [2480, CHALK.r], [2530, CHALK.b], [2600, CHALK.w]];
  for (const [x, col] of sticks) { g.fillStyle = col; g.save(); g.translate(x, ty + 8); g.rotate((rnd() - 0.5) * 0.3); g.fillRect(0, 0, 58, 13); g.restore(); }
  g.fillStyle = '#2c2f3a'; g.fillRect(2720, ty - 18, 150, 30); g.fillStyle = '#d9d6cc'; g.fillRect(2720, ty + 8, 150, 12);
  TEX = c;
  return c;
}
function grain(): HTMLCanvasElement {
  if (GRAIN) return GRAIN;
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const g = c.getContext('2d')!;
  const rnd = mulberry(99);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(0,0,0,${0.25 + rnd() * 0.6})`;
    const s = 0.8 + rnd() * 2.4;
    g.fillRect(rnd() * 192, rnd() * 192, s, s * (0.6 + rnd()));
  }
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(0,0,0,${0.15 + rnd() * 0.25})`;
    g.lineWidth = 0.8;
    const x = rnd() * 192, y = rnd() * 192;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 + rnd() * 14, y + (rnd() - 0.5) * 3); g.stroke();
  }
  GRAIN = c;
  return c;
}

/* ---------- the renderer ---------- */
export class BoardRenderer {
  private ops: COp[] = [];
  private byId = new Map<string, COp>();
  private measureCtx: CanvasRenderingContext2D | null = null;
  private layer: HTMLCanvasElement | null = null;
  private cueTimes: [number, number][] = [];

  constructor(readonly board: Board) {
    this.compile();
  }

  /** call after web fonts load: character widths change */
  recompile() { this.compile(); if (this.cueTimes.length) this.attach(this.cueTimes); }

  private measure(ch: string, s: number): number {
    if (!this.measureCtx) this.measureCtx = document.createElement('canvas').getContext('2d');
    const g = this.measureCtx!;
    g.font = `600 100px ${BOARD_FONT}`;
    return (g.measureText(ch).width / 100) * s;
  }

  private compileText(p: Extract<Prim, { p: 'text' }>, rnd: () => number, items: Item[]): Box {
    const s = p.s;
    let total = 0;
    const widths: number[][] = p.segs.map((g) => (g.a ? [ARROW_EM * s] : [...g.t].map((ch) => this.measure(ch, s) + s * 0.015)));
    widths.forEach((ws) => ws.forEach((w) => (total += w)));
    let x = p.center ? p.x - total / 2 : p.x;
    const x0 = x, base = p.y + s * 0.36;
    const drift = (rnd() - 0.5) * s * 0.06; // the whole line slopes a little
    p.segs.forEach((g, gi) => {
      if (g.a) {
        const y = p.y + drift * ((x - x0) / Math.max(1, total));
        const a: Pt[] = [[x + s * 0.18, y], [x + ARROW_EM * s - s * 0.18, y]];
        items.push(stroke(a, g.c, Math.max(4, s * 0.08), rnd));
        items.push(...heads(a, g.c, Math.max(4, s * 0.08), rnd, false));
        x += ARROW_EM * s;
        return;
      }
      [...g.t].forEach((ch, ci) => {
        const w = widths[gi][ci];
        if (!/\s/.test(ch)) {
          const k = charCost(ch);
          items.push({
            k: 'ch', ch, x, b: base + drift * ((x - x0) / Math.max(1, total)) + (rnd() - 0.5) * s * 0.05, s, w: w - s * 0.015, c: g.c,
            rot: (rnd() - 0.5) * 0.07, sc: 0.96 + rnd() * 0.08, a: 0.84 + rnd() * 0.16,
            n: k >= 1 ? 3 : k >= 0.7 ? 2 : 1, f0: 0, f1: 0,
          });
        }
        x += w + (rnd() - 0.5) * s * 0.03;
      });
    });
    return [x0 - s * 0.05, p.y - s * 0.62, total + s * 0.1, s * 1.24];
  }

  private compile() {
    const ops: COp[] = [];
    this.byId.clear();
    this.board.ops.forEach((op, i) => {
      const rnd = mulberry(i * 7919 + 17);
      const items: Item[] = [];
      const boxes: Box[] = [];
      const c: COp = { op, i, t0: 0, t1: 0, items, box: op.box, specks: [], erasedBy: [] };
      if (op.k === 'draw') {
        for (const p of op.prims || []) {
          if (p.p === 'text') boxes.push(this.compileText(p, rnd, items));
          else {
            const w = p.w ?? 6;
            items.push(stroke(p.pts, p.c, w, rnd, p.dash ? { dash: true } : {}));
            if (p.head) items.push(...heads(p.pts, p.c, w, rnd, p.head === 2));
            const xs = p.pts.map((q) => q[0]), ys = p.pts.map((q) => q[1]);
            boxes.push([Math.min(...xs) - 20, Math.min(...ys) - 20, Math.max(...xs) - Math.min(...xs) + 40, Math.max(...ys) - Math.min(...ys) + 40]);
          }
        }
        if (boxes.length) c.box = union(boxes);
        // chalk dust settling under the writing
        for (const it of items) if (it.k === 'ch' && rnd() < 0.35) c.specks.push([it.x + rnd() * it.w, it.b + it.s * (0.12 + rnd() * 0.35), 0.8 + rnd() * 1.8, 0.08 + rnd() * 0.12]);
      }
      ops.push(c);
      if (op.id) this.byId.set(op.id, c);
    });
    // marks and erases refer to what they act on
    for (const c of ops) {
      const op = c.op, rnd = mulberry(c.i * 104729 + 3);
      const tg = (op.target || []).map((id) => this.byId.get(id)).filter((x): x is COp => !!x);
      if (!tg.length) continue;
      const [x, y, w, h] = union(tg.map((t) => t.box));
      const col = op.c || 'r';
      if (op.k === 'mark') {
        const kind = op.mark || 'circle';
        if (kind === 'circle' || kind === 'circle2') {
          const cx = x + w / 2, cy = y + h / 2, rx = w / 2 + 16 + h * 0.18, ry = h / 2 + 14 + h * 0.12;
          const loops = kind === 'circle2' ? 2 : 1, a0 = -2.5 + rnd() * 0.3, sweep = Math.PI * 2 * loops + 0.35;
          const pts: Pt[] = [];
          const ph = rnd() * 6;
          for (let a = 0; a <= sweep; a += 0.09) {
            const k = 1 + 0.035 * Math.sin(3 * a + ph) + (a / sweep) * 0.05 * (loops - 1) + (a > Math.PI * 2 ? 0.04 : 0);
            pts.push([cx + Math.cos(a0 + a) * rx * k, cy + Math.sin(a0 + a) * ry * k]);
          }
          c.items.push(stroke(pts, col, 6, rnd, {}, 1));
        } else if (kind === 'box') {
          const p = 16, X0 = x - p, Y0 = y - p, X1 = x + w + p, Y1 = y + h + p, o = 10;
          c.items.push(stroke([[X0 - o, Y0], [X1 + o * 0.5, Y0 + 2]], col, 6, rnd));
          c.items.push(stroke([[X1, Y0 - o], [X1 - 2, Y1 + o * 0.5]], col, 6, rnd));
          c.items.push(stroke([[X1 + o * 0.4, Y1], [X0 - o * 0.6, Y1 - 2]], col, 6, rnd));
          c.items.push(stroke([[X0, Y1 + o * 0.5], [X0 + 2, Y0 - o * 0.3]], col, 6, rnd));
        } else if (kind === 'under' || kind === 'under2') {
          const yy = y + h + 6, sl = (rnd() - 0.5) * 8;
          c.items.push(stroke([[x - 6, yy], [x + w + 8, yy + sl]], col, 6.5, rnd));
          if (kind === 'under2') c.items.push(stroke([[x + 4, yy + 16], [x + w + 2, yy + 16 + sl]], col, 5.5, rnd));
        } else if (kind === 'check') {
          const X = x + w + 26, Y = y + h * 0.55;
          c.items.push(stroke([[X, Y], [X + 18, Y + 24], [X + 56, Y - 30]], col, 7, rnd, {}, 0.8));
        }
        c.box = [x - 30, y - 30, w + 60, h + 60];
      } else if (op.k === 'erase') {
        const P = 18, X0 = x - P, X1 = x + w + P, Y0 = y - P, Y1 = y + h + P, rowH = 86;
        const n = Math.max(1, Math.ceil((Y1 - Y0) / rowH));
        c.rows = [];
        for (let r = 0; r < n; r++) {
          const y0 = Y0 + r * rowH, y1 = Math.min(Y1, y0 + rowH), yc = (y0 + y1) / 2;
          c.rows.push({ y0, y1, x0: X0, x1: X1 });
          const pts: Pt[] = r % 2 ? [[X1, yc], [X0, yc + (rnd() - 0.5) * 20]] : [[X0, yc], [X1, yc + (rnd() - 0.5) * 20]];
          c.items.push(stroke(pts, 'w', 90, rnd, { smear: true, a: 0.035 }));
        }
        for (const t of tg) t.erasedBy.push(c);
        c.box = [X0, Y0, X1 - X0, Y1 - Y0];
      } else if (op.k === 'point') {
        c.box = [x, y, w, h];
      }
    }
    for (const c of ops) assignFractions(c.items);
    this.ops = ops;
  }

  /** absolute [start, end] of every cue in lecture time */
  attach(cueTimes: [number, number][]) {
    this.cueTimes = cueTimes;
    for (const c of this.ops) {
      const ct = cueTimes[c.op.cue] || [0, 0];
      c.t0 = ct[0] + c.op.off;
      c.t1 = c.op.k === 'point' ? Math.max(c.t0 + 0.5, ct[1] - 0.15) : c.t0 + c.op.dur;
    }
  }

  /** time when the last chalk action finishes */
  get end() { return this.ops.reduce((m, c) => Math.max(m, c.t1), 0); }

  boxOf(ids: string[]): Box | null {
    const bs = ids.map((id) => this.byId.get(id)?.box).filter((b): b is Box => !!b);
    return bs.length ? union(bs) : null;
  }

  /** camera that frames the given ops */
  static frame(box: Box, minW = 1300): BoardCam {
    const w = Math.min(BOARD_W, Math.max(minW, box[2] * 1.3, box[3] * 1.3 * (16 / 9)));
    return [box[0] + box[2] / 2, box[1] + box[3] / 2, w];
  }

  /** camera from the lecture's keyframes; glides ~1.1 s from each cue start */
  camAt(T: number): BoardCam {
    const cams = this.board.cams;
    if (!cams.length) return [BOARD_W / 2, BOARD_H / 2, BOARD_W];
    let k = -1;
    for (let i = 0; i < cams.length; i++) if ((this.cueTimes[cams[i].cue]?.[0] ?? 0) - 0.25 <= T) k = i;
    if (k < 0) return cams[0].c;
    const cur = cams[k].c;
    if (k === 0) return cur;
    const prev = cams[k - 1].c;
    const u = EZ(CL((T - (this.cueTimes[cams[k].cue][0] - 0.25)) / 1.15));
    return [prev[0] + (cur[0] - prev[0]) * u, prev[1] + (cur[1] - prev[1]) * u, prev[2] + (cur[2] - prev[2]) * u];
  }

  /* ----- drawing ----- */
  private drawItems(g: CanvasRenderingContext2D, items: Item[], p: number, mul: number) {
    for (const it of items) {
      if (it.f0 >= p) break;
      const u = it.f1 <= p ? 1 : CL((p - it.f0) / Math.max(1e-6, it.f1 - it.f0));
      if (it.k === 'ch') this.drawChar(g, it, u, mul);
      else this.drawStroke(g, it, u, mul);
    }
  }

  private drawChar(g: CanvasRenderingContext2D, it: CChar, u: number, mul: number) {
    const top = it.b - it.s * 0.92, H = it.s * 1.16, left = it.x - it.s * 0.06, W = it.w + it.s * 0.12;
    g.save();
    if (u < 1) {
      const pass = Math.min(it.n - 1, Math.floor(u * it.n)), v = u * it.n - pass;
      g.beginPath();
      if (pass > 0) g.rect(left, top, W, (H / it.n) * pass);
      g.rect(left, top + (H / it.n) * pass, W * v, H / it.n);
      g.clip();
    }
    g.globalAlpha = it.a * mul;
    g.fillStyle = CHALK[it.c];
    const cx = it.x + it.w / 2, cy = it.b - it.s * 0.35;
    g.translate(cx, cy); g.rotate(it.rot); g.scale(it.sc, it.sc); g.translate(-cx, -cy);
    g.font = `600 ${it.s.toFixed(1)}px ${BOARD_FONT}`;
    g.fillText(it.ch, it.x, it.b);
    // pressure: a second, slightly shifted pass gives uneven density
    g.globalAlpha = 0.28 * it.a * mul;
    g.fillText(it.ch, it.x + it.s * 0.012, it.b - it.s * 0.01);
    g.restore();
  }

  private drawStroke(g: CanvasRenderingContext2D, it: CStroke, u: number, mul: number) {
    const target = it.len * u;
    g.beginPath();
    g.moveTo(it.pts[0][0], it.pts[0][1]);
    for (let i = 1; i < it.pts.length; i++) {
      if (it.cum[i] <= target) g.lineTo(it.pts[i][0], it.pts[i][1]);
      else {
        const f = (target - it.cum[i - 1]) / Math.max(1e-6, it.cum[i] - it.cum[i - 1]);
        g.lineTo(it.pts[i - 1][0] + (it.pts[i][0] - it.pts[i - 1][0]) * f, it.pts[i - 1][1] + (it.pts[i][1] - it.pts[i - 1][1]) * f);
        break;
      }
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = CHALK[it.c];
    g.setLineDash(it.dash ? [18, 16] : []);
    g.globalAlpha = it.a * mul;
    g.lineWidth = it.w;
    g.stroke();
    if (!it.smear) {
      g.globalAlpha = 0.3 * mul;
      g.lineWidth = it.w * 0.45;
      g.save(); g.translate(1.4, -1); g.stroke(); g.restore();
    }
    g.setLineDash([]);
  }

  /** where the chalk tip is while op `c` is in progress at local progress p */
  private tip(c: COp, p: number): { x: number; y: number; col: ChalkColor } | null {
    for (const it of c.items) {
      if (p > it.f1 && it !== c.items[c.items.length - 1]) continue;
      const u = CL((p - it.f0) / Math.max(1e-6, it.f1 - it.f0));
      if (it.k === 'ch') {
        const pass = Math.min(it.n - 1, Math.floor(u * it.n)), v = u * it.n - pass;
        const top = it.b - it.s * 0.92, H = it.s * 1.16;
        return { x: it.x - it.s * 0.04 + (it.w + it.s * 0.08) * v, y: top + (H / it.n) * (pass + 0.6), col: it.c };
      }
      const target = it.len * u;
      for (let i = 1; i < it.pts.length; i++) {
        if (it.cum[i] >= target) {
          const f = (target - it.cum[i - 1]) / Math.max(1e-6, it.cum[i] - it.cum[i - 1]);
          return { x: it.pts[i - 1][0] + (it.pts[i][0] - it.pts[i - 1][0]) * f, y: it.pts[i - 1][1] + (it.pts[i][1] - it.pts[i - 1][1]) * f, col: it.c };
        }
      }
      const q = it.pts[it.pts.length - 1];
      return { x: q[0], y: q[1], col: it.c };
    }
    return null;
  }

  /** hand position / tool at time T (null = teacher stepped back) */
  private handAt(T: number): { x: number; y: number; tool: 'chalk' | 'eraser' | 'point'; col: ChalkColor; alpha: number } | null {
    const acts = this.ops.filter((c) => c.op.k !== 'point' && c.items.length);
    let prev: COp | null = null, next: COp | null = null;
    for (const c of acts) {
      if (c.t0 <= T && T <= c.t1) {
        const t = this.tip(c, (T - c.t0) / Math.max(1e-6, c.t1 - c.t0));
        return t ? { ...t, tool: c.op.k === 'erase' ? 'eraser' : 'chalk', alpha: 1 } : null;
      }
      if (c.t1 < T) prev = c;
      if (c.t0 > T && !next) next = c;
    }
    const pointing = this.ops.find((c) => c.op.k === 'point' && c.t0 <= T && T <= c.t1);
    if (pointing) {
      const b = pointing.box, s = Math.sin(T * 2.2) * 6;
      const u = EZ(CL((T - pointing.t0) / 0.5));
      return { x: b[0] + b[2] * 0.92 + s, y: b[1] + b[3] * 0.85 + s * 0.5, tool: 'point', col: 'w', alpha: u };
    }
    const endTip = prev ? this.tip(prev, 1) : null;
    const startTip = next ? this.tip(next, 0) : null;
    if (endTip && startTip && next!.t0 - prev!.t1 < 1.4) {
      const u = EZ(CL((T - prev!.t1) / (next!.t0 - prev!.t1)));
      return { x: endTip.x + (startTip.x - endTip.x) * u, y: endTip.y + (startTip.y - endTip.y) * u - Math.sin(u * Math.PI) * 60, tool: next!.op.k === 'erase' ? 'eraser' : 'chalk', col: startTip.col, alpha: 1 };
    }
    if (startTip && next!.t0 - T < 0.45) {
      const u = EZ(CL(1 - (next!.t0 - T) / 0.45));
      return { x: startTip.x + 160 * (1 - u), y: startTip.y + 300 * (1 - u), tool: next!.op.k === 'erase' ? 'eraser' : 'chalk', col: startTip.col, alpha: u };
    }
    if (endTip && T - prev!.t1 < 0.7) {
      const u = EZ(CL((T - prev!.t1) / 0.7));
      return { x: endTip.x + 160 * u, y: endTip.y + 300 * u, tool: prev!.op.k === 'erase' ? 'eraser' : 'chalk', col: endTip.col, alpha: 1 - u };
    }
    return null;
  }

  /** active chalk op for dust */
  private active(T: number): COp | null {
    return this.ops.find((c) => c.op.k !== 'point' && c.items.length && c.t0 <= T && T <= c.t1) || null;
  }

  draw(canvas: HTMLCanvasElement, T: number, cam: BoardCam, opt: DrawOptions = {}) {
    const dpr = Math.min(opt.dpr ?? 2, window.devicePixelRatio || 1);
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const PW = Math.round(cw * dpr), PH = Math.round(ch * dpr);
    if (canvas.width !== PW || canvas.height !== PH) { canvas.width = PW; canvas.height = PH; }
    const g = canvas.getContext('2d')!;

    // camera → transform (keep the view on the board)
    let [cx, cy, w] = cam;
    // the whole board must fit even when the stage is wider than 16:9
    const maxW = Math.max(BOARD_W, BOARD_H * (cw / ch));
    w = Math.min(w >= BOARD_W * 0.99 ? maxW : w, maxW);
    if (w * (ch / cw) > BOARD_H && w < maxW) w = BOARD_H * (cw / ch);
    const hh = w * (ch / cw);
    cx = w >= BOARD_W ? BOARD_W / 2 : Math.max(w / 2, Math.min(BOARD_W - w / 2, cx));
    cy = hh >= BOARD_H ? BOARD_H / 2 : Math.max(hh / 2, Math.min(BOARD_H - hh / 2, cy));
    const k = PW / w, ox = PW / 2 - cx * k, oy = PH / 2 - cy * k;

    // board
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#101915'; g.fillRect(0, 0, PW, PH);
    g.setTransform(k, 0, 0, k, ox, oy);
    g.imageSmoothingEnabled = true;
    g.drawImage(boardTexture(), 0, 0, BOARD_W, BOARD_H);

    // pointing / highlight glow (behind the chalk)
    const glow: Box[] = [];
    for (const c of this.ops) if (c.op.k === 'point' && c.t0 <= T && T <= c.t1) glow.push(c.box);
    for (const id of opt.highlight || []) { const b = this.byId.get(id)?.box; if (b) glow.push(b); }
    if (glow.length) {
      const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 380);
      for (const b of glow) {
        const r = g.createRadialGradient(b[0] + b[2] / 2, b[1] + b[3] / 2, 10, b[0] + b[2] / 2, b[1] + b[3] / 2, Math.max(b[2], b[3]) * 0.75);
        r.addColorStop(0, `rgba(255,236,160,${0.16 * pulse})`); r.addColorStop(1, 'rgba(255,236,160,0)');
        g.fillStyle = r;
        g.fillRect(b[0] - b[2] * 0.3, b[1] - b[3] * 1.2, b[2] * 1.6, b[3] * 3.4);
      }
    }

    // chalk layer (grain is punched out of it, then composited)
    if (!this.layer) this.layer = document.createElement('canvas');
    const L = this.layer;
    if (L.width !== PW || L.height !== PH) { L.width = PW; L.height = PH; }
    const q = L.getContext('2d')!;
    q.setTransform(1, 0, 0, 1, 0, 0);
    q.clearRect(0, 0, PW, PH);
    q.setTransform(k, 0, 0, k, ox, oy);
    q.textBaseline = 'alphabetic';
    for (const c of this.ops) {
      if (c.t0 > T || !c.items.length) continue;
      const p = CL((T - c.t0) / Math.max(1e-6, c.t1 - c.t0));
      const er = c.erasedBy.find((e) => e.t0 <= T);
      if (!er) {
        this.drawItems(q, c.items, p, 1);
      } else {
        const e = CL((T - er.t0) / Math.max(1e-6, er.t1 - er.t0));
        const rows = er.rows || [];
        const swept = new Path2D();
        rows.forEach((r, i) => {
          const f = CL(e * rows.length - i);
          if (f <= 0) return;
          const ww = (r.x1 - r.x0) * f;
          if (i % 2) swept.rect(r.x1 - ww, r.y0 - 4, ww, r.y1 - r.y0 + 8); else swept.rect(r.x0, r.y0 - 4, ww, r.y1 - r.y0 + 8);
        });
        if (e < 1) {
          const rest = new Path2D();
          rest.rect(-10, -10, BOARD_W + 20, BOARD_H + 20);
          rest.addPath(swept);
          q.save(); q.clip(rest, 'evenodd'); this.drawItems(q, c.items, p, 1); q.restore();
        }
        q.save(); q.clip(swept); q.translate(3, 2); this.drawItems(q, c.items, p, GHOST); q.translate(-5, 1); this.drawItems(q, c.items, p, GHOST * 0.6); q.restore();
      }
      if (p >= 1 && !er) {
        q.fillStyle = CHALK.w;
        for (const [x, y, r, a] of c.specks) { q.globalAlpha = a; q.fillRect(x, y, r, r); }
      }
    }
    q.globalAlpha = 1;
    // grain
    const G = grain();
    const pat = q.createPattern(G, 'repeat');
    if (pat) {
      const gs = Math.max(0.7, Math.min(2.2, k * 1.1));
      pat.setTransform(new DOMMatrix([gs / k, 0, 0, gs / k, 0, 0]));
      q.globalCompositeOperation = 'destination-out';
      q.globalAlpha = 0.55;
      q.fillStyle = pat;
      q.fillRect(-10, -10, BOARD_W + 20, BOARD_H + 20);
      q.globalCompositeOperation = 'source-over';
      q.globalAlpha = 1;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(L, 0, 0);
    g.setTransform(k, 0, 0, k, ox, oy);

    // falling dust from the chalk tip
    const act = this.active(T);
    if (act) {
      const step = 0.09, base = Math.floor(T / step) * step;
      for (let j = 0; j < 9; j++) {
        const ts = base - j * step;
        if (ts < act.t0) break;
        const age = T - ts;
        const t = this.tip(act, (ts - act.t0) / Math.max(1e-6, act.t1 - act.t0));
        if (!t) continue;
        const r = h1(ts * 13.7);
        if (r < 0.35) continue;
        g.globalAlpha = 0.5 * (1 - age / 0.85);
        g.fillStyle = act.op.k === 'erase' ? '#e8e8e0' : CHALK[t.col];
        g.beginPath();
        g.arc(t.x + (r - 0.5) * 30 * age * 3, t.y + 20 + 260 * age * age + 40 * age, 1.6 + r * 2.4, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }

    if (opt.hand) {
      const hnd = this.handAt(T);
      if (hnd && hnd.alpha > 0.01) drawHand(g, hnd.x, hnd.y, hnd.tool, hnd.col, hnd.alpha);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
}

/* ---------- the lecturer's hand (world units; chalk tip at x, y) ---------- */
function drawHand(g: CanvasRenderingContext2D, x: number, y: number, tool: 'chalk' | 'eraser' | 'point', col: ChalkColor, alpha: number) {
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y);
  // soft shadow of the arm on the board
  g.save();
  g.translate(38, 46);
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.filter = 'blur(14px)';
  handShape(g, true);
  g.restore();
  g.filter = 'none';
  if (tool === 'eraser') {
    g.save(); g.rotate(-0.12);
    g.fillStyle = '#d9d5c9'; g.fillRect(-70, -14, 150, 26);
    g.fillStyle = '#2d3140'; g.fillRect(-70, -44, 150, 32);
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(-70, -44, 150, 6);
    g.restore();
    g.translate(20, -10);
  } else {
    // chalk stick held at an angle, tip on the board
    g.save();
    g.rotate(0.95);
    g.fillStyle = CHALK[col];
    g.beginPath(); g.roundRect(-2, -8, 76, 16, 6); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(4, 3, 66, 5);
    g.restore();
  }
  handShape(g, false);
  g.restore();
}

function handShape(g: CanvasRenderingContext2D, shadow: boolean) {
  // fingers pinch the chalk ~40 units from the tip; palm and sleeve run down-right off the board
  const skin = g.createLinearGradient(20, 20, 200, 260);
  skin.addColorStop(0, '#e2b596'); skin.addColorStop(0.55, '#c99475'); skin.addColorStop(1, '#a8755a');
  const fill = shadow ? 'rgba(0,0,0,1)' : skin;
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(34, 30);                                   // index fingertip
  g.bezierCurveTo(52, 18, 84, 26, 104, 48);           // index finger top
  g.bezierCurveTo(126, 70, 150, 92, 176, 118);        // back of hand
  g.lineTo(250, 214);                                 // wrist (outer)
  g.lineTo(168, 276);                                 // wrist (inner)
  g.bezierCurveTo(140, 236, 118, 208, 96, 184);       // palm edge
  g.bezierCurveTo(80, 168, 70, 150, 72, 128);         // curled fingers
  g.bezierCurveTo(56, 118, 46, 96, 50, 80);
  g.bezierCurveTo(36, 74, 26, 58, 28, 44);            // thumb
  g.closePath();
  g.fill();
  if (!shadow) {
    // knuckles and finger creases
    g.strokeStyle = 'rgba(90,50,35,0.35)';
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(56, 44); g.quadraticCurveTo(66, 52, 70, 66); g.stroke();
    g.beginPath(); g.moveTo(62, 92); g.quadraticCurveTo(76, 100, 82, 118); g.stroke();
    g.fillStyle = 'rgba(255,230,210,0.25)';
    g.beginPath(); g.ellipse(120, 90, 30, 12, 0.75, 0, Math.PI * 2); g.fill();
  }
  // sleeve (the lecturer's jacket)
  const sl = g.createLinearGradient(200, 200, 330, 420);
  sl.addColorStop(0, shadow ? '#000' : '#39404f'); sl.addColorStop(1, shadow ? '#000' : '#1d212b');
  g.fillStyle = sl;
  g.beginPath();
  g.moveTo(236, 186); g.lineTo(296, 150); g.lineTo(460, 380); g.lineTo(330, 470); g.lineTo(150, 270);
  g.closePath();
  g.fill();
  if (!shadow) {
    g.fillStyle = '#eceae3';
    g.beginPath(); g.moveTo(232, 190); g.lineTo(288, 156); g.lineTo(300, 172); g.lineTo(246, 208); g.closePath(); g.fill();
  }
}
