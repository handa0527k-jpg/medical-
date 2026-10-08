/**
 * PCR as strand bookkeeping (lecture slides 16-19). Positions are base indices
 * on the template; the forward primer copies the top strand from `fwd`, the
 * reverse primer copies the bottom strand back from `rev` (exclusive end).
 * Running the cycles reproduces the slide: target-length duplexes first appear
 * in cycle 3 (2 of 8) and number 2^n - 2n after n cycles.
 */
export interface Strand {
  /** +1: top-type strand (5'->3' left to right), -1: bottom-type */
  dir: 1 | -1;
  a: number;
  b: number;
  primer: 'F' | 'R' | null;
  /** cycle in which it was made (0 = original template) */
  gen: number;
  id: number;
}
export type Duplex = [Strand, Strand];

export interface PcrDesign {
  length: number;
  fwd: number;
  rev: number;
  primerLen: number;
}

export const TEMP = { denature: [90, 100], anneal: [50, 65], extend: [68, 76] } as const;
export type Step = 'denature' | 'anneal' | 'extend' | null;
export function stepFor(t: number): Step {
  for (const k of ['denature', 'anneal', 'extend'] as const) {
    const [lo, hi] = TEMP[k];
    if (t >= lo && t <= hi) return k;
  }
  return null;
}

let nextId = 1;
export function start(d: PcrDesign): Duplex[] {
  nextId = 1;
  return [[{ dir: 1, a: 0, b: d.length, primer: null, gen: 0, id: nextId++ }, { dir: -1, a: 0, b: d.length, primer: null, gen: 0, id: nextId++ }]];
}

/** a template strand can take a primer if it covers the primer's binding site */
export function canPrime(s: Strand, d: PcrDesign) {
  return s.dir === 1 ? s.a <= d.rev - d.primerLen && s.b >= d.rev : s.a <= d.fwd && s.b >= d.fwd + d.primerLen;
}

/** the strand a primed template turns into a duplex with */
export function extend(s: Strand, d: PcrDesign, gen: number): Strand {
  return s.dir === 1
    ? { dir: -1, a: s.a, b: d.rev, primer: 'R', gen, id: nextId++ }
    : { dir: 1, a: d.fwd, b: s.b, primer: 'F', gen, id: nextId++ };
}

export function cycle(duplexes: Duplex[], d: PcrDesign, gen: number): Duplex[] {
  const out: Duplex[] = [];
  for (const [x, y] of duplexes) for (const s of [x, y]) out.push(canPrime(s, d) ? [s, extend(s, d, gen)] : [s, s]);
  return out.filter(([s, t]) => s !== t);
}

export const isTarget = ([x, y]: Duplex, d: PcrDesign) =>
  [x, y].every((s) => s.a === d.fwd && s.b === d.rev);

export const targetCount = (n: number) => (n < 1 ? 0 : Math.pow(2, n) - 2 * n);

/** real-time PCR: fluorescence of a sample with N0 starting copies (logistic plateau) */
export function fluorescence(cycleNo: number, n0: number, efficiency = 0.95, plateau = 1e11) {
  const n = n0 * Math.pow(1 + efficiency, cycleNo);
  return (n / (1 + n / plateau)) / plateau * 100;
}

/** first (fractional) cycle at which fluorescence crosses the threshold */
export function ct(n0: number, threshold = 10, efficiency = 0.95) {
  for (let c = 0; c <= 45; c += 0.01) if (fluorescence(c, n0, efficiency) >= threshold) return c;
  return Infinity;
}
