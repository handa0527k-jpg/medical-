/**
 * Type II restriction enzymes of the pUC18 multi-cloning site (lecture slide:
 * pUC18 MCS) plus BglII (slide: BamHI/BglII ends join). `cut` is where the
 * top strand is cut inside the recognition site (G^GATCC -> 1). The sites are
 * palindromes, so the bottom strand is cut at L - cut.
 */
export interface Enzyme {
  name: string;
  site: string;
  cut: number;
  /** PDB entry of the enzyme bound to its DNA, when one exists */
  pdb?: string;
  color: string;
  origin: string;
}

export const ENZYMES: Enzyme[] = [
  { name: 'EcoRI', site: 'GAATTC', cut: 1, pdb: '1ERI', color: '#5fa8d3', origin: 'Escherichia coli' },
  { name: 'SacI', site: 'GAGCTC', cut: 5, color: '#e76f51', origin: 'Streptomyces achromogenes' },
  { name: 'KpnI', site: 'GGTACC', cut: 5, color: '#f4a261', origin: 'Klebsiella pneumoniae' },
  { name: 'SmaI', site: 'CCCGGG', cut: 3, color: '#8ab17d', origin: 'Serratia marcescens' },
  { name: 'BamHI', site: 'GGATCC', cut: 1, pdb: '1BHM', color: '#f4a259', origin: 'Bacillus amyloliquefaciens' },
  { name: 'XbaI', site: 'TCTAGA', cut: 1, color: '#9d4edd', origin: 'Xanthomonas badrii' },
  { name: 'SalI', site: 'GTCGAC', cut: 1, color: '#4cc9f0', origin: 'Streptomyces albus' },
  { name: 'PstI', site: 'CTGCAG', cut: 5, color: '#ef476f', origin: 'Providencia stuartii' },
  { name: 'SphI', site: 'GCATGC', cut: 5, color: '#ffd166', origin: 'Streptomyces phaeochromogenes' },
  { name: 'HindIII', site: 'AAGCTT', cut: 1, pdb: '2E52', color: '#80b918', origin: 'Haemophilus influenzae' },
  { name: 'BglII', site: 'AGATCT', cut: 1, pdb: '1DFM', color: '#f15bb5', origin: 'Bacillus globigii' },
];

export const enzyme = (name: string) => ENZYMES.find((e) => e.name === name)!;

/** pUC18 multi-cloning site, EcoRI ... HindIII (lecture slide: pUC18 nt 455 -> 399) */
export const PUC18_MCS = 'GAATTCGAGCTCGGTACCCGGGGATCCTCTAGAGTCGACCTGCAGGCATGCAAGCTT';

export type EndKind = '5p' | '3p' | 'blunt';

export interface Ends {
  kind: EndKind;
  /** single-stranded overhang, read 5'->3' on the strand that carries it ('' for blunt) */
  overhang: string;
  /** top-strand cut: nucleotides with index < topCut stay on the left fragment */
  topCut: number;
  botCut: number;
}

export function sites(seq: string, e: Enzyme) {
  const out: number[] = [];
  for (let i = seq.indexOf(e.site); i >= 0; i = seq.indexOf(e.site, i + 1)) out.push(i);
  return out;
}

/** the ends produced when `e` cuts the site starting at `start` */
export function cutAt(seq: string, e: Enzyme, start: number): Ends {
  const L = e.site.length;
  const topCut = start + e.cut;
  const botCut = start + L - e.cut;
  if (topCut === botCut) return { kind: 'blunt', overhang: '', topCut, botCut };
  if (topCut < botCut) return { kind: '5p', overhang: seq.slice(topCut, botCut), topCut, botCut };
  return { kind: '3p', overhang: seq.slice(botCut, topCut), topCut, botCut };
}

export const endKind = (e: Enzyme): EndKind => cutAt(e.site, e, 0).kind;
export const endLabel: Record<EndKind, string> = { '5p': "5'突出末端（付着末端）", '3p': "3'突出末端（付着末端）", blunt: '平滑末端' };

/**
 * Can the left end made by `a` be ligated to the right end made by `b`?
 * Sticky ends must have the same polarity and complementary single strands;
 * because the sites are palindromes that means the same overhang sequence.
 * Blunt ends always fit each other (but ligate far less efficiently).
 */
export function compatible(a: Enzyme, b: Enzyme) {
  const ea = cutAt(a.site, a, 0);
  const eb = cutAt(b.site, b, 0);
  if (ea.kind !== eb.kind) return { ok: false, why: ea.kind === 'blunt' || eb.kind === 'blunt'
    ? '平滑末端と付着末端は形が合いません。' : "5'突出と3'突出は向きが逆なので対合できません。" };
  if (ea.kind === 'blunt') return { ok: true, why: '平滑末端どうしはつなげられます（ただし付着末端より効率が低い）。' };
  if (ea.overhang !== eb.overhang) return { ok: false, why: `突出した1本鎖 ${ea.overhang} と ${eb.overhang} は相補的ではありません。` };
  return { ok: true, why: `どちらも ${ea.overhang} の突出なので、塩基対をつくってぴったり合います。` };
}

/** the junction sequence after joining a's left end to b's right end */
export function hybridSite(a: Enzyme, b: Enzyme) {
  return a.site.slice(0, a.cut) + b.site.slice(b.cut);
}
