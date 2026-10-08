import { describe, expect, it } from 'vitest';
import { ENZYMES, PUC18_MCS, compatible, cutAt, endKind, enzyme, hybridSite, sites } from '../src/content/enzymes';
import { cycle, ct, isTarget, start, stepFor, targetCount, type PcrDesign } from '../src/content/pcr';
import { NEW_STRAND, fragments, readGel } from '../src/content/sanger';
import { GENE, PROTOSPACER, cutSite, hdr, nhej, pamAt, spacerRna, targets, translate, FLAG } from '../src/content/crispr';
import { complement } from '../src/core/dna';

describe('restriction enzymes', () => {
  it('every MCS enzyme cuts the pUC18 MCS exactly once, in slide order', () => {
    const order = ENZYMES.filter((e) => e.name !== 'BglII').map((e) => sites(PUC18_MCS, e));
    for (const s of order) expect(s).toHaveLength(1);
    const starts = order.map((s) => s[0]);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('recognition sites are palindromes', () => {
    for (const e of ENZYMES) expect(complement(e.site).split('').reverse().join('')).toBe(e.site);
  });

  it('end types match the textbook', () => {
    expect(cutAt('GGATCC', enzyme('BamHI'), 0)).toMatchObject({ kind: '5p', overhang: 'GATC' });
    expect(cutAt('CTGCAG', enzyme('PstI'), 0)).toMatchObject({ kind: '3p', overhang: 'TGCA' });
    expect(endKind(enzyme('SmaI'))).toBe('blunt');
    expect(cutAt('GAATTC', enzyme('EcoRI'), 0).overhang).toBe('AATT');
    expect(cutAt('AAGCTT', enzyme('HindIII'), 0).overhang).toBe('AGCT');
  });

  it('BamHI and BglII ends join into GGATCT, which neither enzyme recuts (slide 6)', () => {
    expect(compatible(enzyme('BamHI'), enzyme('BglII')).ok).toBe(true);
    const h = hybridSite(enzyme('BamHI'), enzyme('BglII'));
    expect(h).toBe('GGATCT');
    expect(h).not.toBe(enzyme('BamHI').site);
    expect(h).not.toBe(enzyme('BglII').site);
  });

  it('mismatched ends do not join', () => {
    expect(compatible(enzyme('BamHI'), enzyme('EcoRI')).ok).toBe(false);
    expect(compatible(enzyme('BamHI'), enzyme('PstI')).ok).toBe(false);
    expect(compatible(enzyme('BamHI'), enzyme('SmaI')).ok).toBe(false);
    expect(compatible(enzyme('SmaI'), enzyme('SmaI')).ok).toBe(true);
  });
});

describe('PCR', () => {
  const d: PcrDesign = { length: 36, fwd: 6, rev: 30, primerLen: 8 };
  it('doubles every cycle and makes target-length duplexes from cycle 3 (2 of 8)', () => {
    let pool = start(d);
    const counts: number[] = [];
    const targetsByCycle: number[] = [];
    for (let n = 1; n <= 6; n++) {
      pool = cycle(pool, d, n);
      counts.push(pool.length);
      targetsByCycle.push(pool.filter((x) => isTarget(x, d)).length);
    }
    expect(counts).toEqual([2, 4, 8, 16, 32, 64]);
    expect(targetsByCycle).toEqual([0, 0, 2, 8, 22, 52]);
    expect(targetsByCycle).toEqual([1, 2, 3, 4, 5, 6].map(targetCount));
  });

  it('temperatures map to steps', () => {
    expect(stepFor(95)).toBe('denature');
    expect(stepFor(55)).toBe('anneal');
    expect(stepFor(72)).toBe('extend');
    expect(stepFor(40)).toBe(null);
  });

  it('more starting template gives a smaller Ct (about 3.4 cycles per 10x)', () => {
    const a = ct(1000), b = ct(10000);
    expect(a).toBeGreaterThan(b);
    expect(a - b).toBeGreaterThan(3.2);
    expect(a - b).toBeLessThan(3.7);
  });
});

describe('Sanger sequencing (slide 29)', () => {
  it('copies the template into ATGTCAGTCCAG', () => {
    expect(NEW_STRAND).toBe('ATGTCAGTCCAG');
  });
  it('each tube holds the fragments ending in its ddNTP', () => {
    expect(fragments('A').map((f) => f.seq)).toEqual(['A', 'ATGTCA', 'ATGTCAGTCCA']);
    expect(fragments('G').map((f) => f.length)).toEqual([3, 7, 12]);
  });
  it('reading the gel bottom-up gives the sequence', () => {
    expect(readGel(['A', 'T', 'C', 'G'])).toBe('ATGTCAGTCCAG');
  });
});

describe('CRISPR-Cas9', () => {
  const s = GENE.indexOf(PROTOSPACER);
  it('the slide protospacer is followed by the PAM TGG', () => {
    expect(pamAt(GENE, s)).toMatchObject({ ok: true, pam: 'TGG' });
    expect(targets(GENE)).toContain(s);
    expect(spacerRna(GENE, s)).toBe('GAGAACGGCGAAAACUAACU');
  });
  it('cuts 3 nt upstream of the PAM: ...AAAACTA | ACT TGG', () => {
    const c = cutSite(s);
    expect(GENE.slice(c - 7, c)).toBe('AAAACTA');
    expect(GENE.slice(c, c + 6)).toBe('ACTTGG');
  });
  it('the gene ends with its own stop codon; a 1-nt indel shifts the frame into an early stop', () => {
    const wt = translate(GENE);
    expect(wt).toBe('MPRTAKTNLGSIRLRFY*');
    const c = cutSite(s);
    for (const m of [nhej(GENE, c, 'del', 1), nhej(GENE, c, 'ins', 1), nhej(GENE, c, 'del', 2), nhej(GENE, c, 'ins', 2)]) {
      const p = translate(m.seq);
      expect(p.endsWith('*')).toBe(true);
      expect(p.length).toBeLessThan(wt.length);
    }
  });
  it('HDR at a codon boundary inserts the FLAG tag in frame', () => {
    const c = cutSite(s);
    const at = c - (c % 3);
    const p = translate(hdr(GENE, at, FLAG));
    expect(p).toBe('MPRTAKTDYKDDDDKNLGSIRLRFY*');
  });
});
