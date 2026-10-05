/**
 * A tiny drawing interface with two back-ends, so every medical figure is written once and can be
 * both animated on a canvas (the film / the figure layer) and exported as an exact SVG (医学図).
 */
export interface Style { fill?: string; stroke?: string; width?: number; dash?: number[]; cap?: CanvasLineCap; join?: CanvasLineJoin; opacity?: number }
export type FontKey = 'hand' | 'gothic' | 'mincho' | 'impact' | 'brush';
export interface TextStyle { size: number; font?: FontKey; weight?: number; fill?: string; stroke?: string; strokeW?: number; align?: CanvasTextAlign; opacity?: number; spacing?: number }

export const FONTS: Record<FontKey, string> = {
  hand: '"LV Hand", "Klee One", "Zen Kaku Gothic New", sans-serif',
  gothic: '"LV Gothic", "Zen Kaku Gothic New", "Hiragino Sans", sans-serif',
  mincho: '"Zen Old Mincho", "Hiragino Mincho ProN", serif',
  impact: '"LV Dela", "Dela Gothic One", "Zen Kaku Gothic New", sans-serif',
  brush: '"LV Brush", "Yuji Syuku", "Zen Old Mincho", serif',
};

export interface Pen {
  save(): void; restore(): void;
  translate(x: number, y: number): void; rotate(a: number): void; scale(sx: number, sy?: number): void;
  alpha(a: number): void;
  path(d: string, st: Style): void;
  circle(x: number, y: number, r: number, st: Style): void;
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, st: Style): void;
  rect(x: number, y: number, w: number, h: number, st: Style, r?: number): void;
  line(pts: [number, number][], st: Style): void;
  text(s: string, x: number, y: number, ts: TextStyle): void;
  /** measured text width (approximate in SVG) */
  measure(s: string, ts: TextStyle): number;
}

const fontOf = (ts: TextStyle) => `${ts.weight ?? 700} ${ts.size}px ${FONTS[ts.font ?? 'gothic']}`;

export class CanvasPen implements Pen {
  constructor(public g: CanvasRenderingContext2D) {}
  save() { this.g.save(); } restore() { this.g.restore(); }
  translate(x: number, y: number) { this.g.translate(x, y); } rotate(a: number) { this.g.rotate(a); } scale(sx: number, sy = sx) { this.g.scale(sx, sy); }
  alpha(a: number) { this.g.globalAlpha *= Math.max(0, Math.min(1, a)); }
  private paint(p: Path2D | null, st: Style, fn?: () => void) {
    const g = this.g; g.save();
    if (st.opacity != null) g.globalAlpha *= st.opacity;
    if (fn) { g.beginPath(); fn(); }
    if (st.fill) { g.fillStyle = st.fill; if (p) g.fill(p); else g.fill(); }
    if (st.stroke) {
      g.strokeStyle = st.stroke; g.lineWidth = st.width ?? 1; g.lineCap = st.cap ?? 'round'; g.lineJoin = st.join ?? 'round';
      if (st.dash) g.setLineDash(st.dash);
      if (p) g.stroke(p); else g.stroke();
    }
    g.restore();
  }
  path(d: string, st: Style) { this.paint(new Path2D(d), st); }
  circle(x: number, y: number, r: number, st: Style) { this.paint(null, st, () => this.g.arc(x, y, Math.max(0, r), 0, Math.PI * 2)); }
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, st: Style) { this.paint(null, st, () => this.g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, Math.PI * 2)); }
  rect(x: number, y: number, w: number, h: number, st: Style, r = 0) { this.paint(null, st, () => (r ? this.g.roundRect(x, y, w, h, r) : this.g.rect(x, y, w, h))); }
  line(pts: [number, number][], st: Style) { this.paint(null, st, () => { pts.forEach(([x, y], i) => (i ? this.g.lineTo(x, y) : this.g.moveTo(x, y))); }); }
  text(s: string, x: number, y: number, ts: TextStyle) {
    const g = this.g; g.save();
    if (ts.opacity != null) g.globalAlpha *= ts.opacity;
    // unhinted glyphs: under a moving / zooming camera hinted text snaps to the pixel grid every frame and visibly shakes
    (g as CanvasRenderingContext2D & { textRendering: string }).textRendering = 'geometricPrecision';
    g.font = fontOf(ts); g.textAlign = ts.align ?? 'left'; g.textBaseline = 'middle';
    if (ts.spacing) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${ts.spacing}px`;
    if (ts.stroke) { g.strokeStyle = ts.stroke; g.lineWidth = ts.strokeW ?? ts.size * 0.14; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    if (ts.fill) { g.fillStyle = ts.fill; g.fillText(s, x, y); }
    g.restore();
  }
  measure(s: string, ts: TextStyle) { this.g.save(); this.g.font = fontOf(ts); const w = this.g.measureText(s).width; this.g.restore(); return w; }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (x: number) => +x.toFixed(2);

export class SvgPen implements Pen {
  private out: string[] = [];
  private depth: number[] = [];
  private op = 1;
  private ops: number[] = [];
  private rootOpen = 0;
  constructor(public w: number, public h: number, private bg?: string) {}
  private attr(st: Style) {
    const a = [`fill="${st.fill ?? 'none'}"`];
    if (st.stroke) a.push(`stroke="${st.stroke}" stroke-width="${n(st.width ?? 1)}" stroke-linecap="${st.cap ?? 'round'}" stroke-linejoin="${st.join ?? 'round'}"`);
    if (st.dash) a.push(`stroke-dasharray="${st.dash.join(' ')}"`);
    const o = (st.opacity ?? 1) * this.op; if (o < 1) a.push(`opacity="${n(o)}"`);
    return a.join(' ');
  }
  save() { this.out.push('<g>'); this.depth.push(1); this.ops.push(this.op); }
  restore() { const k = this.depth.pop() ?? 0; for (let i = 0; i < k; i++) this.out.push('</g>'); this.op = this.ops.pop() ?? 1; }
  private open(tr: string) { this.out.push(`<g transform="${tr}">`); if (this.depth.length) this.depth[this.depth.length - 1]++; else this.rootOpen++; }
  translate(x: number, y: number) { this.open(`translate(${n(x)} ${n(y)})`); }
  rotate(a: number) { this.open(`rotate(${n((a * 180) / Math.PI)})`); }
  scale(sx: number, sy = sx) { this.open(`scale(${n(sx)} ${n(sy)})`); }
  alpha(a: number) { this.op *= a; }
  path(d: string, st: Style) { this.out.push(`<path d="${d}" ${this.attr(st)}/>`); }
  circle(x: number, y: number, r: number, st: Style) { this.out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" ${this.attr(st)}/>`); }
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, st: Style) { this.out.push(`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" transform="rotate(${n((rot * 180) / Math.PI)} ${n(x)} ${n(y)})" ${this.attr(st)}/>`); }
  rect(x: number, y: number, w: number, h: number, st: Style, r = 0) { this.out.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" ${this.attr(st)}/>`); }
  line(pts: [number, number][], st: Style) { this.out.push(`<polyline points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" ${this.attr({ ...st, fill: undefined })}/>`); }
  text(s: string, x: number, y: number, ts: TextStyle) {
    const anchor = ts.align === 'center' ? 'middle' : ts.align === 'right' || ts.align === 'end' ? 'end' : 'start';
    const o = (ts.opacity ?? 1) * this.op;
    const common = `x="${n(x)}" y="${n(y)}" dominant-baseline="middle" text-anchor="${anchor}" font-family='${FONTS[ts.font ?? 'gothic']}' font-size="${ts.size}" font-weight="${ts.weight ?? 700}"${o < 1 ? ` opacity="${n(o)}"` : ''}${ts.spacing ? ` letter-spacing="${ts.spacing}"` : ''}`;
    if (ts.stroke) this.out.push(`<text ${common} fill="none" stroke="${ts.stroke}" stroke-width="${n(ts.strokeW ?? ts.size * 0.14)}" stroke-linejoin="round">${esc(s)}</text>`);
    if (ts.fill) this.out.push(`<text ${common} fill="${ts.fill}">${esc(s)}</text>`);
  }
  measure(s: string, ts: TextStyle) { let w = 0; for (const ch of s) w += /[\x20-\x7e]/.test(ch) ? 0.58 : 1; return w * ts.size; }
  toString(title = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}">${title ? `<title>${esc(title)}</title>` : ''}${this.bg ? `<rect width="100%" height="100%" fill="${this.bg}"/>` : ''}${this.out.join('')}${'</g>'.repeat(this.rootOpen)}</svg>`;
  }
}
