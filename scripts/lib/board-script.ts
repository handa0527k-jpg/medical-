/**
 * Blackboard directives of the lecture script → board ops (see docs/LECTURE_SCRIPT.md).
 *
 * The board is laid out like a classroom board: title strip on top, three
 * panels (L = 基本概念, C = メカニズム, R = 試験ポイント) and a summary strip at
 * the bottom (B). Each panel has a writing cursor that moves down line by line.
 *
 *   @bb [cam]             show the blackboard (optionally set the camera)
 *   @cam L|C|R|B|T|all|x,y,w|follow   camera from the next line on
 *   @in L [x y]           write into panel L at x,y — without x,y: continue where L's writing stopped
 *   @at x y  /  @gap n  /  @over id    move the cursor
 *   + text                write a line.  flags right after "+": w y r b (chalk colour)
 *                         # heading  s small  2 title  = centred  > indent
 *                         "{id} " names the line; "[r:転写]" colours a part; " → " draws an arrow
 *   +↓ label  / +↓s label  downward arrow (s = short) under the previous line, with a label
 *   +ln x,y x,y … [>|<>]  line relative to the cursor (flags: colour, "-" dashed, "t" thin)
 *   +tx x,y text  +rc x,y,w,h  +el cx,cy,rx,ry  +arc cx,cy,r,deg0,deg1 [>]   relative to the cursor
 *   +sk name args         a prepared sketch (helix, ladder, nucleotide, chromosome, gene, mrna, nucleosome …)
 *   +{ id … +}            group the lines in between into one action
 *   !o id [c]  !oo  ![] !u  !uu  !v   circle / double circle / box / underline / double / tick
 *   !x id,id              erase (a faint ghost stays)
 *   !p id,id              point at it (hand + glow) during the next line
 *
 * Board actions attach to the next spoken line (`>`); a line `>~` is a silent
 * moment of writing. The cue waits for the chalk to finish before moving on.
 */
import { BOARD_H, BOARD_W, lineCost, markCost, primCost, textWidth, type Board, type BoardCam, type BoardOp, type ChalkColor, type MarkKind, type Prim, type Pt, type TextSeg } from '../../src/engine/board/types';

type Box = [number, number, number, number];
interface Panel { id: string; name: string; x: number; y: number; w: number; h: number }

export const PANELS: Panel[] = [
  { id: 'T', name: 'タイトル', x: 90, y: 60, w: 3020, h: 130 },
  { id: 'L', name: '基本概念', x: 90, y: 220, w: 960, h: 1080 },
  { id: 'C', name: 'メカニズム', x: 1120, y: 220, w: 1000, h: 1080 },
  { id: 'R', name: '試験ポイント', x: 2190, y: 220, w: 930, h: 1080 },
  { id: 'B', name: 'まとめ', x: 90, y: 1320, w: 3020, h: 380 },
];
const NAMED_CAM: Record<string, BoardCam> = {
  L: [900, 790, 1950], C: [1620, 790, 1950], R: [2300, 790, 1950],
  B: [1600, 1450, 2900], T: [1600, 500, 2600], all: [1600, 900, 3200],
  LC: [1110, 820, 2150], CR: [2130, 820, 2150],
};
const SIZE = { normal: 64, head: 80, small: 50, title: 96 };
const LEAD = 0.25;

interface Pending extends Omit<BoardOp, 'cue' | 'off'> { }

export class BoardBuilder {
  readonly ops: BoardOp[] = [];
  readonly cams: Board['cams'] = [];
  private panel: Panel = PANELS[1];
  private cy: number = PANELS[1].y;
  private cx: number = 0;
  private pending: Pending[] = [];
  private group: { id?: string; prims: Prim[] } | null = null;
  private camReq: BoardCam | 'follow' | null = null;
  private follow = true;
  private lastCam: BoardCam | null = null;
  private lastCenterX: number | null = null;
  private boxes = new Map<string, Box>();
  private anchors = new Map<string, { panel: Panel; x: number; y: number }>();
  /** written text so far — to catch lines that overlap or run off their panel */
  private texts: { box: Box; op: string; alive: boolean; txt: string }[] = [];
  private seq = 0;
  used = false;

  constructor(private readonly fail: (msg: string) => never) {}

  board(): Board | undefined {
    if (!this.ops.length) return undefined;
    return { ops: this.ops, cams: this.cams, panels: PANELS.filter((p) => p.id !== 'T').map((p) => ({ id: p.id, name: p.name, box: [p.x, p.y, p.w, p.h] })) };
  }

  cam(arg: string) {
    if (!arg) return;
    if (arg === 'follow') { this.camReq = 'follow'; return; }
    if (NAMED_CAM[arg]) { this.camReq = NAMED_CAM[arg]; return; }
    const n = arg.split(/[ ,]+/).map(Number);
    if (n.length === 3 && n.every((x) => !Number.isNaN(x))) { this.camReq = n as BoardCam; return; }
    this.fail(`bad camera "${arg}"`);
  }

  /** each panel remembers where its writing stopped */
  private cursors = new Map<string, { cx: number; cy: number }>();
  in(arg: string) {
    const [id, x, y] = arg.split(/\s+/);
    const p = PANELS.find((q) => q.id === id) || this.fail(`unknown panel ${id}`);
    this.cursors.set(this.panel.id, { cx: this.cx, cy: this.cy });
    this.panel = p;
    const saved = this.cursors.get(p.id);
    if (x === undefined && saved) { this.cx = 0; this.cy = saved.cy; }
    else {
      this.cx = x !== undefined ? Number(x) : 0;
      this.cy = p.y + (y !== undefined ? Number(y) : 0);
    }
    this.lastCenterX = null;
  }
  at(arg: string) { const [x, y] = arg.split(/\s+/).map(Number); this.cx = x; this.cy = this.panel.y + y; }
  gap(arg: string) { this.cy += Number(arg) || 30; }
  over(id: string) {
    const a = this.anchors.get(id) || this.fail(`@over: unknown board id ${id}`);
    this.panel = a.panel; this.cx = a.x; this.cy = a.y;
  }

  /* ---------- lines ---------- */
  /** returns true when the line was a board directive */
  line(line: string): boolean {
    if (line.startsWith('!') && /^!(o|oo|\[\]|u|uu|v|x|p)\s/.test(line)) { this.markLine(line); return true; }
    if (!line.startsWith('+')) return false;
    if (line === '+}') {
      if (!this.group) this.fail('+} without +{');
      const g = this.group!;
      this.group = null;
      this.push(g.prims, g.id);
      return true;
    }
    if (line.startsWith('+{')) {
      if (this.group) this.fail('nested +{');
      this.group = { id: line.slice(2).trim() || undefined, prims: [] };
      this.anchorFor(this.group.id);
      return true;
    }
    const m = /^\+(ln|tx|rc|el|sk|arc|↓)?([wyrb#s2=>\-t]*)\s*(.*)$/.exec(line);
    if (!m) this.fail(`bad board line: ${line}`);
    const [, cmd, flags, rest] = m!;
    const col = (/[wyrb]/.exec(flags)?.[0] as ChalkColor) || undefined;
    const labelSize = cmd === '↓' && flags.includes('s') ? 42 : 48;
    const ox = this.panel.x + this.cx, oy = this.cy;
    const P = (s: string): Pt => { const [x, y] = s.split(',').map(Number); if (Number.isNaN(x) || Number.isNaN(y)) this.fail(`bad point ${s}`); return [ox + x, oy + y]; };
    const thin = flags.includes('t') ? 4 : undefined;
    const dash = flags.includes('-') ? 1 as const : undefined;
    let prims: Prim[] = [];
    let id: string | undefined;
    let body = rest;
    const idm = /^\{([\w-]+)\}\s*/.exec(body);
    if (idm) { id = idm[1]; body = body.slice(idm[0].length); }

    switch (cmd) {
      case undefined: case '': {
        const s = flags.includes('2') ? SIZE.title : flags.includes('#') ? SIZE.head : flags.includes('s') ? SIZE.small : SIZE.normal;
        const indent = (flags.match(/>/g) || []).length * 60;
        const segs = parseSegs(body, col || 'w');
        const center = flags.includes('=');
        const y = this.cy + s * 0.62;
        const x = center ? this.panel.x + this.panel.w / 2 : this.panel.x + this.cx + indent;
        if (!this.group) this.anchorFor(id);
        prims = [{ p: 'text', x, y, s, segs, ...(center ? { center: 1 as const } : {}) }];
        this.lastCenterX = center ? x : x + Math.min(textWidth(segs, s), this.panel.w) / 2;
        this.cy += s * 1.5;
        break;
      }
      case '↓': {
        const ax = this.lastCenterX ?? this.panel.x + this.cx + 60;
        const short = flags.includes('s');
        const y0 = this.cy - 6, y1 = this.cy + (short ? 46 : 84);
        prims = [{ p: 'line', pts: [[ax, y0], [ax, y1]], c: 'w', head: 1 }];
        if (body.trim()) prims.push({ p: 'text', x: ax + 34, y: (y0 + y1) / 2, s: labelSize, segs: parseSegs(body.trim(), col || 'b') });
        if (!this.group) this.anchorFor(id);
        this.cy += short ? 62 : 100;
        break;
      }
      case 'ln': {
        const parts = body.trim().split(/\s+/);
        let head: 1 | 2 | undefined;
        if (parts[parts.length - 1] === '>') { head = 1; parts.pop(); } else if (parts[parts.length - 1] === '<>') { head = 2; parts.pop(); }
        prims = [{ p: 'line', pts: parts.map(P), c: col || 'w', ...(head ? { head } : {}), ...(thin ? { w: thin } : {}), ...(dash ? { dash } : {}) }];
        break;
      }
      case 'tx': {
        const sp = body.indexOf(' ');
        const [x, y] = P(body.slice(0, sp));
        const s = flags.includes('#') ? SIZE.head : flags.includes('s') ? SIZE.small : flags.includes('2') ? SIZE.title : SIZE.normal;
        prims = [{ p: 'text', x, y, s, segs: parseSegs(body.slice(sp + 1), col || 'w'), ...(flags.includes('=') ? { center: 1 as const } : {}) }];
        break;
      }
      case 'rc': {
        const [x, y, w, h] = body.trim().split(',').map(Number);
        const [X, Y] = [ox + x, oy + y];
        prims = [{ p: 'line', pts: [[X, Y], [X + w, Y], [X + w, Y + h], [X, Y + h], [X, Y - 3]], c: col || 'w', ...(thin ? { w: thin } : {}), ...(dash ? { dash } : {}) }];
        break;
      }
      case 'el': {
        const [x, y, rx, ry] = body.trim().split(',').map(Number);
        prims = [{ p: 'line', pts: ellipse(ox + x, oy + y, rx, ry), c: col || 'w', ...(thin ? { w: thin } : {}), ...(dash ? { dash } : {}) }];
        break;
      }
      case 'arc': {
        const parts = body.trim().split(/\s+/);
        const head = parts[1] === '>' ? 1 as const : parts[1] === '<>' ? 2 as const : undefined;
        const [x, y, r, d0, d1] = parts[0].split(',').map(Number);
        const pts: Pt[] = [];
        const n = Math.max(6, Math.round(Math.abs(d1 - d0) / 8));
        for (let i = 0; i <= n; i++) { const a = ((d0 + ((d1 - d0) * i) / n) * Math.PI) / 180; pts.push([ox + x + Math.cos(a) * r, oy + y + Math.sin(a) * r]); }
        prims = [{ p: 'line', pts, c: col || 'w', ...(head ? { head } : {}), ...(thin ? { w: thin } : {}), ...(dash ? { dash } : {}) }];
        break;
      }
      case 'sk': {
        const [name, ...args] = body.trim().split(/\s+/);
        const sk = SKETCHES[name] || this.fail(`unknown sketch ${name}`);
        const r = sk(ox, oy, args, col);
        prims = r.prims;
        if (!this.group) this.anchorFor(id);
        this.cy += r.h;
        break;
      }
    }
    if (this.group) { this.group.prims.push(...prims); return true; }
    this.push(prims, id);
    return true;
  }

  private anchorFor(id?: string) { if (id) this.anchors.set(id, { panel: this.panel, x: this.cx, y: this.cy }); }

  private push(prims: Prim[], id?: string) {
    if (!prims.length) this.fail('empty board action');
    const key = id || `#${++this.seq}`;
    for (const p of prims) {
      if (p.p !== 'text') continue;
      const b = boxOf([p]);
      const txt = p.segs.map((g) => g.t).join('');
      const px1 = this.panel.x + this.panel.w + 30;
      if (b[0] + b[2] > px1 && this.panel.id !== 'T') this.fail(`"${txt}" runs off panel ${this.panel.id} by ${Math.round(b[0] + b[2] - px1)} units — shorten it, use a smaller size (+s) or wrap`);
      if (b[0] + b[2] > BOARD_W - 40) this.fail(`"${txt}" runs off the board`);
      const shrink = 8;
      for (const t of this.texts) {
        if (!t.alive || t.op === key) continue;
        const a = t.box;
        if (b[0] + shrink < a[0] + a[2] && a[0] + shrink < b[0] + b[2] && b[1] + shrink < a[1] + a[3] && a[1] + shrink < b[1] + b[3]) this.fail(`"${txt}" overlaps "${t.txt}" — move it (@in / @at / @gap)`);
      }
      this.texts.push({ box: b, op: key, alive: true, txt });
    }
    if (id && this.boxes.has(id)) this.fail(`duplicate board id ${id}`);
    const box = boxOf(prims);
    const dur = prims.reduce((a, p) => a + primCost(p), 0);
    this.pending.push({ ...(id ? { id } : {}), k: 'draw', prims, dur: +dur.toFixed(2), box });
    if (id) this.boxes.set(id, box);
  }

  private markLine(line: string) {
    const m = /^!(o|oo|\[\]|u|uu|v|x|p)\s+([\w,-]+)(?:\s+([wyrb]))?$/.exec(line.trim());
    if (!m) this.fail(`bad mark: ${line}`);
    const [, k, ids, c] = m!;
    const target = ids.split(',');
    for (const t of target) if (!this.boxes.has(t) && !this.pending.some((p) => p.id === t)) this.fail(`mark refers to unknown board id ${t}`);
    const box = union(target.map((t) => this.boxes.get(t)!));
    if (k === 'x') { for (const t of this.texts) if (target.includes(t.op)) t.alive = false; this.pending.push({ k: 'erase', target, dur: +(0.5 + (box[2] * Math.ceil(box[3] / 86)) / 1800 + 0.1).toFixed(2), box }); return; }
    if (k === 'p') { this.pending.push({ k: 'point', target, dur: 1, box }); return; }
    const mark = ({ o: 'circle', oo: 'circle2', '[]': 'box', u: 'under', uu: 'under2', v: 'check' } as Record<string, MarkKind>)[k];
    this.pending.push({ k: 'mark', mark, c: (c as ChalkColor) || (mark === 'check' ? 'y' : 'r'), target, dur: markCost(mark), box: [box[0] - 30, box[1] - 30, box[2] + 60, box[3] + 60] });
  }

  get hasPending() { return this.pending.length > 0; }
  /** estimated chalk time of the pending actions (for a silent writing cue) */
  get pendingTime() { return LEAD + this.pending.reduce((a, p) => a + (p.k === 'point' ? 0 : p.dur + 0.12), 0); }

  /**
   * Attach pending actions to cue `cue`. Returns how long the chalk keeps the
   * cue busy (s) — the cue will not end before that.
   */
  flush(cue: number): number {
    if (this.group) this.fail('+{ group not closed before the next line');
    let t = LEAD, busy = 0;
    const boxes: Box[] = [];
    for (const p of this.pending) {
      const op: BoardOp = { ...p, cue, off: +t.toFixed(2) };
      this.ops.push(op);
      if (p.k === 'point') { boxes.push(p.box); continue; }
      t += p.dur + 0.12;
      busy = t;
      boxes.push(p.box);
    }
    this.pending = [];
    // camera
    let next: BoardCam | null = null;
    if (this.camReq === 'follow') { this.follow = true; this.camReq = null; }
    if (this.camReq) { next = this.camReq; this.follow = false; this.camReq = null; }
    else if (this.follow && boxes.length) {
      const U = union(boxes);
      const inView = (c: BoardCam) => {
        const w = c[2], h = w * 0.5625, m = 0.06;
        return U[0] >= c[0] - w / 2 + w * m && U[0] + U[2] <= c[0] + w / 2 - w * m && U[1] >= c[1] - h / 2 + h * m && U[1] + U[3] <= c[1] + h / 2 - h * m;
      };
      if (!this.lastCam || !inView(this.lastCam) || this.lastCam[2] > 2400) {
        const w = Math.min(BOARD_W, Math.max(1650, U[2] * 1.35, U[3] * 1.5 * (16 / 9)));
        const h = w * 0.5625;
        // look slightly ahead (downwards): the next lines will be written below
        let cy = U[1] + U[3] / 2 + h * 0.12;
        cy = Math.max(h / 2, Math.min(BOARD_H - h / 2, cy));
        let cx = U[0] + U[2] / 2;
        cx = Math.max(w / 2, Math.min(BOARD_W - w / 2, cx));
        next = [Math.round(cx), Math.round(cy), Math.round(w)];
      }
    }
    if (next) { this.cams.push({ cue, c: next }); this.lastCam = next; }
    if (!this.lastCam && boxes.length === 0 && !this.cams.length) { /* nothing yet */ }
    return busy;
  }

  /** first camera for a freshly opened board shot */
  ensureCam(cue: number) {
    if (!this.cams.length) { const c = NAMED_CAM.all; this.cams.push({ cue, c }); this.lastCam = c; }
  }
}

/* ---------- helpers ---------- */
function parseSegs(text: string, base: ChalkColor): TextSeg[] {
  const segs: TextSeg[] = [];
  const re = /\[([wyrb]):([^\]]+)\]/g;
  let last = 0, m: RegExpExecArray | null;
  const plain = (t: string, c: ChalkColor) => {
    t.split(/\s*(?:→|⇒)\s*/).forEach((part, i) => {
      if (i > 0) segs.push({ t: '→', c, a: 1 });
      if (part) segs.push({ t: part, c });
    });
  };
  while ((m = re.exec(text))) {
    if (m.index > last) plain(text.slice(last, m.index), base);
    plain(m[2], m[1] as ChalkColor);
    last = m.index + m[0].length;
  }
  if (last < text.length) plain(text.slice(last), base);
  return segs;
}
export function ellipse(cx: number, cy: number, rx: number, ry: number, a0 = -2.3, sweep = Math.PI * 2 + 0.25): Pt[] {
  const pts: Pt[] = [];
  for (let a = 0; a <= sweep + 1e-6; a += 0.12) pts.push([cx + Math.cos(a0 + a) * rx, cy + Math.sin(a0 + a) * ry]);
  return pts;
}
function union(bs: Box[]): Box {
  const x0 = Math.min(...bs.map((b) => b[0])), y0 = Math.min(...bs.map((b) => b[1]));
  const x1 = Math.max(...bs.map((b) => b[0] + b[2])), y1 = Math.max(...bs.map((b) => b[1] + b[3]));
  return [x0, y0, x1 - x0, y1 - y0];
}
function boxOf(prims: Prim[]): Box {
  return union(prims.map((p): Box => {
    if (p.p === 'text') {
      const w = textWidth(p.segs, p.s);
      return [p.center ? p.x - w / 2 : p.x, p.y - p.s * 0.62, w, p.s * 1.24];
    }
    const xs = p.pts.map((q) => q[0]), ys = p.pts.map((q) => q[1]);
    return [Math.min(...xs) - 10, Math.min(...ys) - 10, Math.max(...xs) - Math.min(...xs) + 20, Math.max(...ys) - Math.min(...ys) + 20];
  }));
}
const T = (x: number, y: number, t: string, c: ChalkColor = 'w', s = 50, center = false): Prim => ({ p: 'text', x, y, s, segs: parseSegs(t, c), ...(center ? { center: 1 as const } : {}) });
const Ln = (pts: Pt[], c: ChalkColor = 'w', extra: Partial<Extract<Prim, { p: 'line' }>> = {}): Prim => ({ p: 'line', pts, c, ...extra });
void lineCost;

/* ---------- sketches: small chalk diagrams (origin = cursor; returns height used) ---------- */
type Sketch = (x: number, y: number, args: string[], col?: ChalkColor) => { prims: Prim[]; h: number };
const SKETCHES: Record<string, Sketch> = {
  /** DNA double helix, width w (default 700): two strands + rungs, 5'/3' ends */
  helix(x, y, a) {
    const w = Number(a[0]) || 700, h = 190, cy = y + h / 2, amp = 62, turns = 2;
    const s1: Pt[] = [], s2: Pt[] = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60, X = x + 60 + u * (w - 120), ph = u * turns * Math.PI * 2;
      s1.push([X, cy + Math.sin(ph) * amp]); s2.push([X, cy - Math.sin(ph) * amp]);
    }
    const prims: Prim[] = [Ln(s1, 'y'), Ln(s2, 'b')];
    for (let i = 1; i < 16; i++) {
      const u = i / 16, X = x + 60 + u * (w - 120), ph = u * turns * Math.PI * 2;
      if (Math.abs(Math.sin(ph)) > 0.25) prims.push(Ln([[X, cy + Math.sin(ph) * amp * 0.86], [X, cy - Math.sin(ph) * amp * 0.86]], 'w', { w: 4 }));
    }
    prims.push(T(x, cy - amp - 6, "5'", 'y', 40), T(x + w - 40, cy - amp - 6, "3'", 'y', 40), T(x, cy + amp + 18, "3'", 'b', 40), T(x + w - 40, cy + amp + 18, "5'", 'b', 40));
    return { prims, h: h + 60 };
  },
  /** straight antiparallel ladder with base pairs, e.g. "ladder ATGC" (H-bonds: A=T 2, G≡C 3) */
  ladder(x, y, a) {
    const seq = (a[0] || 'ATGC').toUpperCase(), n = seq.length, dy = 78, W = 380;
    const comp: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
    const top = y + 60, bot = top + (n - 1) * dy;
    const prims: Prim[] = [
      T(x + 20, y + 14, "5'", 'y', 40), T(x + W - 40, y + 14, "3'", 'b', 40),
      Ln([[x + 40, top - 20], [x + 40, bot + 20]], 'y', { head: 1 }), Ln([[x + W - 20, bot + 20], [x + W - 20, top - 20]], 'b', { head: 1 }),
      T(x + 20, bot + 70, "3'", 'y', 40), T(x + W - 40, bot + 70, "5'", 'b', 40),
    ];
    [...seq].forEach((b, i) => {
      const Y = top + i * dy, c = comp[b] || '?';
      prims.push(T(x + 70, Y, b, 'w', 56), T(x + W - 90, Y, c, 'w', 56));
      const nb = b === 'G' || b === 'C' ? 3 : 2;
      for (let k = 0; k < nb; k++) { const yy = Y - (nb - 1) * 7 + k * 14; prims.push(Ln([[x + 150, yy], [x + W - 120, yy]], 'r', { w: 3, dash: 1 })); }
    });
    return { prims, h: bot - y + 110 };
  },
  /** nucleotide = phosphate (circle) – sugar (pentagon) – base (hexagon) */
  nucleotide(x, y, a) {
    const lab = a[0] !== 'nolabel';
    const cy = y + 110;
    const pent = (cx: number, cy2: number, r: number): Pt[] => { const p: Pt[] = []; for (let i = 0; i <= 5; i++) { const t = -Math.PI / 2 + (i * 2 * Math.PI) / 5; p.push([cx + Math.cos(t) * r, cy2 + Math.sin(t) * r]); } return p; };
    const hex = (cx: number, cy2: number, r: number): Pt[] => { const p: Pt[] = []; for (let i = 0; i <= 6; i++) { const t = (i * Math.PI) / 3; p.push([cx + Math.cos(t) * r, cy2 + Math.sin(t) * r]); } return p; };
    const prims: Prim[] = [
      Ln(ellipse(x + 70, cy, 48, 48), 'y'), T(x + 70, cy, 'P', 'y', 56, true),
      Ln([[x + 118, cy], [x + 190, cy + 20]]),
      Ln(pent(x + 250, cy + 30, 66)), T(x + 250, cy + 36, '糖', 'w', 46, true),
      Ln([[x + 300, cy - 5], [x + 360, cy - 60]]),
      Ln(hex(x + 430, cy - 90, 72), 'b'), T(x + 430, cy - 88, '塩基', 'b', 44, true),
    ];
    if (lab) prims.push(T(x + 20, cy + 110, 'リン酸', 'y', 42), T(x + 205, cy + 128, "五炭糖", 'w', 42), T(x + 380, cy + 10, '', 'b', 42));
    return { prims, h: 280 };
  },
  /** metaphase chromosome: two sister chromatids joined at the centromere; p above, q below */
  chromosome(x, y, a) {
    const cx = x + 120, top = y + 20, cen = y + 150, bot = y + 380;
    // two sister chromatids, each drawn as an outline pinched at the centromere
    const chromatid = (s: number): Pt[] => [
      [cx + s * 16, top + 6], [cx + s * 58, top], [cx + s * 66, top + 30], [cx + s * 26, cen - 8], [cx + s * 10, cen],
      [cx + s * 28, cen + 10], [cx + s * 74, bot - 30], [cx + s * 64, bot], [cx + s * 22, bot - 6], [cx + s * 4, cen + 14], [cx + s * 2, cen - 12], [cx + s * 14, top + 10],
    ];
    const prims: Prim[] = [Ln(chromatid(-1)), Ln(chromatid(1)), Ln(ellipse(cx, cen, 16, 12), 'r')];
    if (a[0] !== 'nolabel') {
      prims.push(T(cx + 90, cen - 80, '短腕 p', 'w', 46), T(cx + 90, cen + 120, '長腕 q', 'w', 46), T(cx + 60, cen + 6, 'セントロメア', 'r', 42),
        Ln(ellipse(cx - 42, top + 6, 22, 12), 'y', { w: 5 }), T(cx - 250, top + 8, 'テロメア', 'y', 42));
    }
    return { prims, h: 420 };
  },
  /** gene structure: promoter | exon – intron – exon … | polyA (w = width) */
  gene(x, y, a) {
    const w = Number(a[0]) || 900, cy = y + 70;
    const prims: Prim[] = [Ln([[x, cy], [x + w, cy]])];
    prims.push(Ln([[x + 10, cy - 26], [x + w * 0.2, cy - 26], [x + w * 0.2, cy + 26], [x + 10, cy + 26], [x + 10, cy - 29]], 'w', { dash: 1, w: 4 }));
    const ex = [[0.24, 0.3], [0.38, 0.44], [0.54, 0.6], [0.7, 0.8], [0.8, 0.9]];
    ex.forEach(([u0, u1], i) => {
      const X0 = x + w * u0, X1 = x + w * u1, c: ChalkColor = i === 0 || i === ex.length - 1 ? 'b' : 'y';
      prims.push(Ln([[X0, cy - 30], [X1, cy - 30], [X1, cy + 30], [X0, cy + 30], [X0, cy - 32]], c));
    });
    prims.push(Ln(ellipse(x + w * 0.93, cy, 22, 22), 'w', { w: 4 }));
    if (a[1] !== 'nolabel') {
      prims.push(T(x + w * 0.1, cy + 80, 'プロモーター', 'w', 40, true), T(x + w * 0.41, cy - 70, 'エクソン', 'y', 40, true), T(x + w * 0.49, cy + 80, 'イントロン', 'w', 40, true), T(x + w * 0.93, cy + 80, 'poly(A)', 'w', 38, true));
    }
    return { prims, h: 190 };
  },
  /** mRNA codons: "mrna AUG GCU GUU UAG" with amino acids underneath */
  mrna(x, y, a) {
    const cod = a.length ? a : ['AUG', 'GCU', 'GUU', 'UAG'];
    const aa: Record<string, string> = { AUG: 'Met', GCU: 'Ala', GUU: 'Val', UAG: '終止', UGA: '終止', UAA: '終止', GGA: 'Gly', CGA: 'Arg', CAC: 'His', CCC: 'Pro', GAC: 'Asp', GAA: 'Glu', AAA: 'Lys', GAG: 'Glu', GAU: 'Asp' };
    const cw = 190, cy = y + 60;
    const prims: Prim[] = [T(x, cy, "5'", 'w', 40), Ln([[x + 50, cy + 36], [x + 70 + cod.length * cw, cy + 36]], 'w', { w: 4 }), T(x + 80 + cod.length * cw, cy, "3'", 'w', 40)];
    cod.forEach((c, i) => {
      const X = x + 70 + i * cw;
      const stop = aa[c] === '終止', start = c === 'AUG';
      prims.push(T(X + cw / 2 - 10, cy, c, stop || start ? 'r' : 'w', 56, true));
      prims.push(Ln([[X + cw / 2 - 10, cy + 56], [X + cw / 2 - 10, cy + 116]], 'w', { head: 1, w: 4 }));
      prims.push(T(X + cw / 2 - 10, cy + 160, aa[c] || '?', stop ? 'r' : 'y', 52, true));
    });
    return { prims, h: 250 };
  },
  /** beads on a string: DNA wrapped around histone octamers */
  nucleosome(x, y, a) {
    const n = Number(a[0]) || 4, gap = 190, cy = y + 80;
    const prims: Prim[] = [];
    const path: Pt[] = [[x, cy + 10]];
    for (let i = 0; i < n; i++) {
      const X = x + 110 + i * gap;
      path.push([X - 60, cy + 30]);
      for (let t = 0; t <= Math.PI * 3.6; t += 0.3) path.push([X + Math.cos(t + Math.PI) * 58, cy + Math.sin(t + Math.PI) * 44]);
      path.push([X + 70, cy + 34]);
    }
    path.push([x + 110 + n * gap - 40, cy + 16]);
    for (let i = 0; i < n; i++) prims.push(Ln(ellipse(x + 110 + i * gap, cy, 44, 34), 'y'));
    prims.push(Ln(path, 'w', { w: 4 }));
    return { prims, h: 170 };
  },
};
