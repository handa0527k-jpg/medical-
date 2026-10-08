/**
 * Genome editing logic (lecture slides 35-37). The protospacer and PAM come from
 * the slide's SpCas9 figure: GAGAACGGCGAAAACTA|ACT + PAM TGG, cut 3 nt upstream
 * of the PAM. They sit in a small made-up reading frame so the effect of an
 * indel on the protein can be read off.
 */
export const PROTOSPACER = 'GAGAACGGCGAAAACTAACT';
// downstream chosen so the reading frame is open to its own stop (TAA) while both
// shifted frames hit an early stop: any 1-2 nt indel at the cut ends the protein early
export const GENE = 'ATGCC' + PROTOSPACER + 'TGG' + 'GTTCCATAAGACTTAGATTTTAT' + 'TAA';
export const SPACER_LEN = 20;
/** FLAG tag (DYKDDDDK), the knock-in insert carried by the donor */
export const FLAG = 'GACTACAAGGACGACGATGACAAG';

const CODON: Record<string, string> = {};
(() => {
  const b = 'TCAG';
  const aa = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
  let i = 0;
  for (const x of b) for (const y of b) for (const z of b) CODON[x + y + z] = aa[i++];
})();

/** translate from the first base; stops at the first stop codon (shown as '*') */
export function translate(seq: string) {
  let out = '';
  for (let i = 0; i + 3 <= seq.length; i += 3) {
    const a = CODON[seq.slice(i, i + 3)] ?? '?';
    out += a;
    if (a === '*') break;
  }
  return out;
}

/** is there an NGG right after a spacer starting at `start`? */
export function pamAt(seq: string, start: number) {
  const p = start + SPACER_LEN;
  const pam = seq.slice(p, p + 3);
  return { pam, ok: pam.length === 3 && pam[1] === 'G' && pam[2] === 'G', at: p };
}

/** every spacer start with a valid PAM */
export const targets = (seq: string) =>
  Array.from({ length: seq.length - SPACER_LEN - 2 }, (_, i) => i).filter((i) => pamAt(seq, i).ok);

/** SpCas9 cuts both strands between the 3rd and 4th nucleotide upstream of the PAM (blunt) */
export const cutSite = (start: number) => start + SPACER_LEN - 3;

export const spacerRna = (seq: string, start: number) => seq.slice(start, start + SPACER_LEN).replace(/T/g, 'U');

export type Edit = { kind: 'del' | 'ins'; n: number; seq: string; inserted: string };

/** NHEJ: a small insertion or deletion at the break */
export function nhej(seq: string, cut: number, kind: 'del' | 'ins', n: number, base = 'A'): Edit {
  if (kind === 'del') return { kind, n, seq: seq.slice(0, cut) + seq.slice(cut + n), inserted: '' };
  const ins = base.repeat(n);
  return { kind, n, seq: seq.slice(0, cut) + ins + seq.slice(cut), inserted: ins };
}

/** HDR with a donor: the insert lands exactly at the break, between the homology arms */
export const hdr = (seq: string, cut: number, insert = FLAG) => seq.slice(0, cut) + insert + seq.slice(cut);
