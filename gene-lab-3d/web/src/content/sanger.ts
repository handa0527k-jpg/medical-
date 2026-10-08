/**
 * The dideoxy (Sanger) method exactly as in lecture slide 29:
 *   template (read 3'->5')  CGTATACAGTCAGGTC
 *   labelled primer         GCAT
 * The polymerase copies the template after the primer; every time it happens to
 * take a ddNTP instead of a dNTP the chain stops, so each tube collects every
 * fragment that ends in its base.
 */
import { COMP } from '../core/dna';

export const TEMPLATE_3to5 = 'CGTATACAGTCAGGTC';
export const PRIMER = 'GCAT';

/** the strand the polymerase makes after the primer (5'->3') */
export const NEW_STRAND = [...TEMPLATE_3to5.slice(PRIMER.length)].map((c) => COMP[c]).join('');

export interface Fragment {
  /** nucleotides added after the primer (1..n) */
  length: number;
  /** the ddNTP that ended it */
  base: string;
  seq: string;
}

export function fragments(ddntp: string): Fragment[] {
  const out: Fragment[] = [];
  for (let i = 0; i < NEW_STRAND.length; i++) {
    if (NEW_STRAND[i] === ddntp) out.push({ length: i + 1, base: ddntp, seq: NEW_STRAND.slice(0, i + 1) });
  }
  return out;
}

/** reading the gel from the bottom (shortest) up gives the new strand 5'->3' */
export const readGel = (lanes: string[]) =>
  lanes.flatMap((b) => fragments(b)).sort((x, y) => x.length - y.length).map((f) => f.base).join('');

export const DYE: Record<string, string> = { A: '#3ddc84', T: '#ff5252', G: '#ffd23f', C: '#4c8dff' };
