/** Small, dependency-free SVG + easing helpers shared by every animation. */
export const NS = 'http://www.w3.org/2000/svg';

export type Attrs = Record<string, string | number>;

/** Create an SVG element, set attributes, optionally append to a parent. */
export function E<K extends keyof SVGElementTagNameMap>(tag: K, at: Attrs = {}, par?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in at) e.setAttribute(k, String(at[k]));
  if (par) par.appendChild(e);
  return e;
}

export const L = (a: number, b: number, t: number) => a + (b - a) * t;
export const CL = (t: number) => Math.max(0, Math.min(1, t));
/** easeInOutCubic */
export const EZ = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const seg = (t: number, a: number, b: number) => CL((t - a) / (b - a));

/** Keyframe interpolation: keys = [[t, v1, v2, ...], ...] with eased segments. */
export function kf(t: number, keys: (number | string)[][]): (number | string)[] {
  if (t <= (keys[0][0] as number)) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= (keys[i][0] as number)) {
      const a = keys[i - 1], b = keys[i];
      const u = EZ((t - (a[0] as number)) / ((b[0] as number) - (a[0] as number)));
      return a.slice(1).map((v, j) => (typeof v === 'number' ? L(v, b[j + 1] as number, u) : b[j + 1]));
    }
  }
  return keys[keys.length - 1].slice(1);
}

/** Glow filter + blueprint grid, used as the backdrop of every stage. */
export function glowDefs(svg: Element) {
  const d = E('defs', {}, svg);
  const f = E('filter', { id: 'gl', x: '-50%', y: '-50%', width: '200%', height: '200%' }, d);
  E('feGaussianBlur', { stdDeviation: '4', result: 'b' }, f);
  const m = E('feMerge', {}, f);
  E('feMergeNode', { in: 'b' }, m);
  E('feMergeNode', { in: 'SourceGraphic' }, m);
  const g = E('pattern', { id: 'grid', width: '40', height: '40', patternUnits: 'userSpaceOnUse' }, d);
  E('path', { d: 'M40 0H0V40', fill: 'none', stroke: '#141a26', 'stroke-width': '1' }, g);
  E('rect', { x: 0, y: 0, width: 1200, height: 675, fill: 'url(#grid)' }, svg);
}

/** Camera box helpers. A camera is [x, y, w] (16:9) or [x, y, w, h]. */
export type Cam = number[];
export const F = (cx: number, cy: number, w: number): Cam => [cx - w / 2, cy - w * 0.28125, w];
export const VB = (c: Cam): [number, number, number, number] => [c[0], c[1], c[2], c[3] !== undefined ? c[3] : c[2] * 0.5625];
export const lerpC = (a: Cam, b: Cam, u: number): Cam => a.map((v, i) => L(v, b[i], u));
export const FULL: Cam = [0, 0, 1200];

export const fmtT = (s: number) => {
  s = Math.max(0, Math.floor(s + 0.001));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
