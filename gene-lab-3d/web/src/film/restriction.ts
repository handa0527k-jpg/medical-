/**
 * 授業動画「制限酵素とDNAリガーゼ」— every frame is a pure function of the film clock.
 *
 * Lecture slides 4-6: BamHI (PDB 1BHM) finds its palindrome GGATCC and cuts
 * G^GATCC on both strands, leaving GATC 5' overhangs; PstI and SmaI show the 3'
 * overhang and the blunt end; human DNA ligase I (PDB 1X9N) seals the nicks;
 * a BamHI end joined to a BglII end gives GGATCT, which neither enzyme cuts.
 * The cut positions come from content/enzymes.ts (the same logic the lab uses).
 */
import * as THREE from 'three';
import type { Stage } from '../core/stage';
import { AtomicDNA, BASE_COLOR, type Nt } from '../core/dna';
import { loadGlb, yUp } from '../core/molecule';
import { place, seatOnDna } from '../core/interact';
import {
  Clock, Overlays, V, applyCam, camPath, glowBall, loadFilmMolecule, makeDust, mix, orbit, ramp, sceneAt, setGlow, smooth,
  standardOverlays, summaryOverlays, window01, type Cam,
} from './kit';
import { cutAt, enzyme, hybridSite } from '../content/enzymes';

const A_SEQ = 'TACGTTAC' + 'GGATCC' + 'GTCAGCTA'; // BamHI site at 8
const B_SEQ = 'CATGACTG' + 'AGATCT' + 'TTGCTGCA'; // BglII site at 8
const SITE = 8;
const BAM = enzyme('BamHI'), BGL = enzyme('BglII');
const CUT = cutAt(A_SEQ, BAM, SITE); // topCut 9, botCut 13, 5' GATC
const GAP = 2.4;
const TRIO = ['BamHI', 'PstI', 'SmaI'].map((n) => enzyme(n));
const COL = { site: '#fff4c2', over: '#ffe066', nick: '#ff5a7a', seal: '#7dffc0' };

export async function buildRestriction(stage: Stage, clock: Clock, ov: Overlays) {
  const T = (id: string) => clock.at(id);
  const E = (id: string) => clock.end(id);
  const world = stage.world;
  stage.scene.background = new THREE.Color('#04060c');
  stage.scene.fog = new THREE.FogExp2('#04060c', 0.010);
  stage.setAoRadius(0.5);
  const dust = makeDust(900, 31);
  world.add(dust);

  const sets: Record<string, THREE.Group> = {};
  const mkSet = (k: string) => { const g = new THREE.Group(); g.visible = false; world.add(g); sets[k] = g; return g; };
  const show = (k: string) => { for (const [n, g] of Object.entries(sets)) g.visible = n === k; };
  const glowMat = (c: string, p = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(p), toneMapped: false, transparent: true });

  // ================================================================ why: a phage injects, the enzyme chops its DNA
  const whySet = mkSet('why');
  const kit = await loadGlb('kit.glb');
  const cell = kit.getObjectByName('ecoli')!.clone(true);
  cell.position.set(0, 0, 0);
  cell.rotation.set(0, 0, 0);
  cell.scale.setScalar(4);
  whySet.add(cell);
  const phage = new THREE.Group();
  {
    const m = new THREE.MeshStandardMaterial({ color: '#c9d3e6', roughness: 0.35, metalness: 0.2 });
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), m);
    head.position.y = 1.2;
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 10), m);
    tail.position.y = 0.35;
    phage.add(head, tail);
    for (let i = 0; i < 6; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 5), m);
      const a = (i / 6) * Math.PI * 2;
      leg.position.set(Math.cos(a) * 0.25, -0.35, Math.sin(a) * 0.25);
      leg.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
      phage.add(leg);
    }
  }
  whySet.add(phage);
  // the viral DNA as 5 pieces of one curve, so it can fall apart where the enzyme cuts
  const vPts = Array.from({ length: 40 }, (_, i) => V(1.0 + Math.sin(i * 0.7) * 0.9 - i * 0.1, 3.6 - i * 0.09, Math.cos(i * 0.5) * 0.9));
  const vCurve = new THREE.CatmullRomCurve3(vPts);
  const pieces = Array.from({ length: 5 }, (_, i) => {
    const pts = Array.from({ length: 12 }, (_, j) => vCurve.getPointAt((i + j / 11 * 0.92) / 5));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.07, 6), glowMat('#ff4d5e', 1.6));
    m.userData.dir = vCurve.getPointAt((i + 0.5) / 5).sub(V(0, 1.6, 0)).normalize();
    whySet.add(m);
    return m;
  });
  const cuts = [1, 2, 3, 4].map(() => { const g = glowBall('#ffe08a', 0.3, 2.4); whySet.add(g); return g; });
  const enzIcon = glowBall('#f4a259', 0.35, 2.0);
  const enzTag = stage.label('<b>制限酵素</b><small>決まった配列で切る</small>', 'film-tag warm');
  whySet.add(enzIcon, enzTag);
  const methylGlows = Array.from({ length: 6 }, (_, i) => {
    const g = glowBall('#ff4fd8', 0.16, 2.2);
    g.position.set(-2.4 + i * 0.9, -0.4 + Math.sin(i * 1.7) * 0.6, 0.3 + Math.cos(i) * 0.5);
    whySet.add(g);
    return g;
  });
  const meTag = stage.label('<b style="color:#ff8be6">自分のDNA：メチル基で保護</b><small>同じ配列でも切られない</small>', 'film-tag');
  meTag.position.set(-0.5, -2.2, 0.4);
  whySet.add(meTag);

  function updateWhy(t: number): Cam {
    const land = ramp(t, T('r01') + 0.6, 2.0);
    phage.position.set(1.0 + 3 * (1 - land), 4.6 + 7 * (1 - land), 2 * (1 - land));
    phage.rotation.set(0, t * 0.4, (1 - land) * 0.5);
    const inj = ramp(t, T('r01') + 2.8, 1.8);
    const chop = ramp(t, T('r01') + 7.0, 1.6);
    pieces.forEach((m, i) => {
      m.visible = inj > i / 5;
      m.position.copy(m.userData.dir).multiplyScalar(0.7 * chop);
      (m.material as THREE.MeshBasicMaterial).opacity = 1 - 0.6 * ramp(t, T('r02'), 2);
    });
    // the enzyme visits the four cut points
    const visit = ramp(t, T('r01') + 4.4, 2.6);
    const at = Math.min(3, Math.floor(visit * 4));
    enzIcon.position.copy(vCurve.getPointAt((1 + visit * 3) / 5)).add(V(0.4, 0.2, 0.3));
    setGlow(enzIcon, window01(t, T('r01') + 4.0, T('r02') + 0.4, 0.4), 0.35);
    enzTag.visible = t > T('r01') + 4.6 && t < T('r02');
    enzTag.position.copy(enzIcon.position).add(V(1.4, 0.8, 0));
    cuts.forEach((g, i) => {
      g.position.copy(vCurve.getPointAt((i + 1) / 5));
      const a = i <= at && visit > i / 4 ? window01(t, T('r01') + 4.4 + i * 0.65, T('r01') + 5.4 + i * 0.65, 0.2) : 0;
      setGlow(g, a, 0.3);
    });
    const me = ramp(t, T('r02') + 1.0, 1.0);
    methylGlows.forEach((g, i) => setGlow(g, me * (0.7 + 0.3 * Math.sin(t * 3 + i)), 0.16));
    meTag.visible = me > 0.5;
    return { pos: orbit(V(0, 0.6, 0), mix(30, 24, smooth((t - T('r01')) / 18)), 0.3 + t * 0.03, 3), target: V(0, -0.3, 0), aperture: 0.0003 };
  }

  // ================================================================ the BamHI story: one DNA, the enzyme, the cut, the ligase
  const mainSet = mkSet('main');
  const D = new AtomicDNA(A_SEQ);
  D.position.x = -D.length / 2;
  D.showLetters(1.85);
  mainSet.add(D);
  const inSite = (nt: Nt) => nt.k >= SITE && nt.k < SITE + 6;
  const isRight = (nt: Nt) => nt.k >= (nt.strand === 0 ? CUT.topCut : CUT.botCut);
  const isOver = (nt: Nt) => nt.k >= CUT.topCut && nt.k < CUT.botCut;
  const bam = await loadFilmMolecule('1BHM');
  bam.setOpacity('dna', 0);
  mainSet.add(bam.root);
  const lig = await loadFilmMolecule('1X9N');
  lig.setOpacity('dna', 0);
  mainSet.add(lig.root);
  const tag = (html: string, cls = 'film-tag') => { const x = stage.label(html, cls); mainSet.add(x); return x; };
  const tBam = tag('<b>BamHI</b><small>2つの同じサブユニット・実構造 PDB 1BHM</small>', 'film-tag warm');
  const tSite = tag('<b>GGATCC</b><small>BamHI の認識配列</small>', 'film-tag good');
  const tPal = tag('<b>下の鎖も 5′→ GGATCC</b><small>回文配列</small>', 'film-tag good');
  const tOver = tag(`<b style="color:${COL.over}">GATC の突出</b><small>1本鎖・付着末端</small>`);
  const tNick = [tag('<b>ニック</b><small>背骨の切れ目</small>', 'film-tag hot'), tag('<b>ニック</b>', 'film-tag hot')];
  const tLig = tag('<b>DNAリガーゼ</b><small>ヒト リガーゼI・実構造 PDB 1X9N</small>');
  const tEnd = [tag("<b>5′</b>", 'film-tag'), tag("<b>3′</b>", 'film-tag')];
  const gA = glowBall('#ff6b6b', 0.4, 2.2), gB = glowBall('#ff6b6b', 0.4, 2.2);
  const gNick = [glowBall(COL.nick, 0.26, 2.0, true), glowBall(COL.nick, 0.26, 2.0, true)];
  mainSet.add(gA, gB, ...gNick);
  const wD = (p: THREE.Vector3) => D.localToWorld(p.clone());
  const midBond = (strand: 0 | 1, k: number) => D.ntCenter(D.nt(strand, k - 1)).add(D.ntCenter(D.nt(strand, k))).multiplyScalar(0.5);

  // BamHI slides in from the right, stops on the site
  const kSite = SITE + 2.5;
  const bamK = (t: number) => mix(18, kSite, smooth((t - T('r06') - 0.6) / (clock.dur('r06') - 1.4)));

  function updateMain(t: number, scene: string) {
    D.each(() => true, (nt) => { nt.offset.set(0, 0, 0); nt.scale = 1; });
    D.tint(() => true, null);
    D.letterColor(() => true, (nt) => BASE_COLOR[nt.base], '');
    for (const x of [tBam, tSite, tPal, tOver, ...tNick, tLig, ...tEnd]) x.visible = false;
    for (const g of [gA, gB, ...gNick]) setGlow(g, 0);
    bam.root.visible = false;
    lig.root.visible = false;

    const sitePulse = scene === 'site' ? ramp(t, T('r03') + 1.5, 1.0) : 1;
    if (scene === 'site' || scene === 'scan') {
      D.tint(inSite, COL.site, 0.45 * sitePulse);
      D.letterColor((nt) => inSite(nt) && sitePulse > 0.5, () => '#ffffff', 'hl');
    }
    if (scene === 'site') {
      tSite.visible = t > T('r03') + 2 && t < T('r04');
      tSite.position.copy(wD(V(D.x(SITE + 2.5), 3.3, 0)));
      tPal.visible = t > T('r04') + 1.5;
      tPal.position.copy(wD(V(D.x(SITE + 2.5), -3.4, 0)));
      tEnd[0].visible = tEnd[1].visible = true;
      tEnd[0].position.copy(wD(V(-1.0, 1.85, 0)));
      tEnd[1].position.copy(wD(V(D.x(D.n - 1) + 1.0, 1.85, 0)));
    }
    // the enzyme
    if (scene === 'scan' || scene === 'cut') {
      const drop = 1 - ramp(t, T('r05') + 0.2, 2.0);
      const leave = ramp(t, T('r08') + 0.4, 2.0);
      const k = scene === 'scan' ? bamK(t) : kSite;
      bam.root.visible = leave < 0.99;
      place(bam.root, seatOnDna(bam, D, k, { lift: V(0, 9 * drop + 10 * leave, 4 * leave) }));
      bam.setOpacity('protein', scene === 'cut' ? mix(1, 0.45, ramp(t, T('r07') + 0.3, 1)) : 1);
      tBam.visible = scene === 'scan' && t > T('r05') + 2.2;
      tBam.position.copy(bam.root.position).add(V(0, 5.4, 0));
    }
    if (scene === 'cut') {
      // the two catalytic sites cut one strand each, between G and G
      const L = bam.meta.landmarks;
      const a1 = window01(t, T('r07') + 2.0, T('r08') + 0.3, 0.3), a2 = window01(t, T('r07') + 3.4, T('r08') + 0.3, 0.3);
      if (L.activeA && L.activeB) {
        gA.position.copy(bam.root.localToWorld(yUp(L.activeA)));
        gB.position.copy(bam.root.localToWorld(yUp(L.activeB)));
      }
      // put the glow on the actual scissile bonds (they sit by the active sites)
      gA.position.copy(wD(midBond(0, CUT.topCut)));
      gB.position.copy(wD(midBond(1, CUT.botCut)));
      setGlow(gA, a1 * (0.7 + 0.3 * Math.sin(t * 8)), 0.4);
      setGlow(gB, a2 * (0.7 + 0.3 * Math.sin(t * 8)), 0.4);
      const open = ramp(t, T('r08') + 1.0, 1.8);
      D.each(isRight, (nt) => nt.offset.set(GAP * open, 0.3 * open, 0));
      const ov2 = ramp(t, T('r08') + 2.4, 0.8);
      D.tint(isOver, COL.over, 0.6 * ov2);
      D.letterColor((nt) => isOver(nt) && ov2 > 0.5, () => COL.over, 'hl');
      tOver.visible = ov2 > 0.5;
      tOver.position.copy(wD(V(D.x(CUT.topCut + 1.5) + GAP * open * 0.5, -3.5, 0)));
    }
    if (scene === 'ligase') {
      // ends find each other (r13), nicks shown (r14), ligase seals them (r15-r16)
      const close = ramp(t, T('r13') + 3.0, 2.0);
      D.each(isRight, (nt) => nt.offset.set(GAP * (1 - close), 0.3 * (1 - close), 0));
      D.tint(isOver, COL.over, 0.6 * (1 - ramp(t, T('r16'), 1.2)));
      const seal1 = T('r15') + 6.0, seal2 = T('r15') + 10.0;
      const nickOn = (i: number) => (t > T('r14') + 0.8 ? 1 : 0) * (1 - ramp(t, i === 0 ? seal1 : seal2, 0.6));
      const pos = [midBond(0, CUT.topCut), midBond(1, CUT.botCut)];
      pos.forEach((p, i) => {
        const on = nickOn(i);
        const sealed = t > (i === 0 ? seal1 : seal2);
        gNick[i].position.copy(wD(p));
        (gNick[i].material as THREE.MeshBasicMaterial).color.set(sealed ? COL.seal : COL.nick).multiplyScalar(2);
        setGlow(gNick[i], sealed ? window01(t, (i === 0 ? seal1 : seal2), (i === 0 ? seal1 : seal2) + 1.2, 0.3) : on * (0.7 + 0.3 * Math.sin(t * 6)), 0.26);
        tNick[i].visible = on > 0.5 && t < T('r15') + 2.5;
        tNick[i].position.copy(wD(p)).add(V(0, i === 0 ? 1.6 : -1.7, 0.6));
      });
      // ligase: comes in, clamps on nick 1, then nick 2, leaves
      const inK = ramp(t, T('r15') + 0.5, 2.4), outK = ramp(t, T('r16') + 1.0, 2.0);
      const kNick = t < seal1 + 0.6 ? CUT.topCut - 0.5 : mix(CUT.topCut - 0.5, CUT.botCut - 0.5, ramp(t, seal1 + 0.6, 2.0));
      lig.root.visible = inK > 0.01 && outK < 0.99;
      place(lig.root, seatOnDna(lig, D, kNick, { lift: V(0, 10 * (1 - inK) + 10 * outK, 0) }));
      lig.setOpacity('protein', 0.55);
      tLig.visible = inK > 0.8 && t < seal1;
      tLig.position.copy(lig.root.position).add(V(-6.5, -1.5, 0));
    }
  }

  function camMain(t: number): Cam {
    const keys: [number, Cam][] = [
      [T('r03'), { pos: V(0, 2.2, 16), target: V(0, -0.4, 0), aperture: 0.0003 }],
      [T('r04'), { pos: V(-1, 1.5, 14), target: V(0, -0.6, 0), aperture: 0.0004 }],
      [E('r04'), { pos: V(1, 1.2, 14), target: V(0, -0.6, 0), aperture: 0.0004 }],
      [T('r05') + 0.5, { pos: V(5, 4, 21), target: V(1, 0.8, 0), aperture: 0.0003 }],
      [T('r06') + 1, { pos: V(4, 3, 20), target: V(1.5, 0.5, 0), aperture: 0.0003 }],
      [E('r06'), { pos: V(-2, 2.5, 17), target: V(0, 0.4, 0), aperture: 0.0004 }],
      [T('r07') + 1.5, { pos: V(2.5, 1.5, 15), target: V(0.6, 0, 0), aperture: 0.0006 }],
      [T('r08') + 1.0, { pos: V(1.5, 2.4, 15), target: V(0.8, 1.2, 0), aperture: 0.0005 }],
      [T('r09'), { pos: V(2, 2.4, 14), target: V(1.2, 1.2, 0), aperture: 0.0005 }],
      [E('r09'), { pos: V(1, 2.2, 15), target: V(1.2, 1.0, 0), aperture: 0.0005 }],
      [T('r13'), { pos: V(0.5, 1.5, 15), target: V(1, -0.6, 0), aperture: 0.0004 }],
      [T('r14') + 1, { pos: V(2, 1.5, 11), target: V(0.6, -0.3, 0), aperture: 0.0007 }],
      [T('r15') + 1.5, { pos: V(5, 4, 20), target: V(0.6, 0.6, 0), aperture: 0.0003 }],
      [T('r16'), { pos: V(-3, 3, 19), target: V(0.6, 0.4, 0), aperture: 0.0003 }],
      [E('r16'), { pos: V(0, 2, 16), target: V(0, -0.4, 0), aperture: 0.0003 }],
    ];
    return camPath(keys, t);
  }

  // ================================================================ three kinds of ends
  const endsSet = mkSet('ends');
  const trio = TRIO.map((e, i) => {
    const seq = 'ACGT' + e.site + 'TGCA';
    const d = new AtomicDNA(seq);
    d.position.set(-d.length / 2, (1 - i) * 5.2, 0);
    d.showLetters(1.85);
    endsSet.add(d);
    const res = cutAt(seq, e, 4);
    const l = stage.label(`<b style="color:${e.color}">${e.name}</b><small>${e.site.slice(0, e.cut)}↓${e.site.slice(e.cut)}</small>`, 'film-tag');
    l.position.set(-d.length / 2 - 3.2, d.position.y, 0);
    endsSet.add(l);
    const kind = stage.label(res.kind === '5p' ? '<b>5′突出末端</b>' : res.kind === '3p' ? '<b>3′突出末端</b>' : '<b>平滑末端</b><small>突出なし</small>', 'film-tag good');
    kind.position.set(d.length / 2 + GAP + 3.4, d.position.y, 0);
    endsSet.add(kind);
    return { d, res, l, kind, at: i === 0 ? 'r11' : i === 1 ? 'r11' : 'r12', delay: i === 1 ? 6.0 : 0.6 };
  });
  function updateEnds(t: number): Cam {
    trio.forEach(({ d, res, kind, at, delay }) => {
      const t0 = T(at) + delay;
      const open = ramp(t, t0, 1.4);
      const right = (nt: Nt) => nt.k >= (nt.strand === 0 ? res.topCut : res.botCut);
      const over = (nt: Nt) => nt.k >= Math.min(res.topCut, res.botCut) && nt.k < Math.max(res.topCut, res.botCut);
      d.each(() => true, (nt) => nt.offset.set(right(nt) ? GAP * open : 0, 0, 0));
      d.tint(() => true, null);
      d.tint(over, COL.over, 0.6 * open);
      d.letterColor(() => true, (nt) => (over(nt) && open > 0.5 ? COL.over : BASE_COLOR[nt.base]), '');
      kind.visible = open > 0.7;
    });
    return { pos: V(1.5, 1.0, 30), target: V(1.0, -1.0, 0), aperture: 0.0002 };
  }

  // ================================================================ BamHI end + BglII end
  const swapSet = mkSet('swap');
  const Da = new AtomicDNA(A_SEQ), Db = new AtomicDNA(B_SEQ);
  for (const d of [Da, Db]) { d.position.x = -d.length / 2; d.showLetters(1.85); swapSet.add(d); }
  const CB = cutAt(B_SEQ, BGL, SITE);
  const bamS = await loadFilmMolecule('1BHM');
  const bglS = await loadFilmMolecule('1DFM');
  for (const m of [bamS, bglS]) { m.setOpacity('dna', 0); swapSet.add(m.root); }
  const sTag = (html: string, cls = 'film-tag') => { const x = stage.label(html, cls); swapSet.add(x); return x; };
  const tA = sTag(`<b style="color:${BAM.color}">BamHI で切った端</b><small>G↓GATCC</small>`);
  const tB = sTag(`<b style="color:${BGL.color}">BglII で切った端</b><small>A↓GATCT</small>`);
  const tHyb = sTag(`<b>${hybridSite(BAM, BGL)}</b><small>どちらの認識配列でもない</small>`, 'film-tag good');
  const tNo = [sTag('<b>✕ 切れない</b>', 'film-tag warn'), sTag('<b>✕ 切れない</b>', 'film-tag warn')];
  function updateSwap(t: number): Cam {
    const join = ramp(t, T('r18') + 2.0, 2.4);
    const sepA = (nt: Nt) => nt.k >= (nt.strand === 0 ? CUT.topCut : CUT.botCut); // A's right part (removed)
    const keepB = (nt: Nt) => nt.k >= (nt.strand === 0 ? CB.topCut : CB.botCut); // B's right part (kept)
    Da.each(() => true, (nt) => { nt.scale = sepA(nt) ? 0 : 1; nt.offset.set(-GAP * (1 - join) * 0.5, 0, 0); });
    Db.each(() => true, (nt) => { nt.scale = keepB(nt) ? 1 : 0; nt.offset.set(GAP * (1 - join) * 0.5, 0, 0); });
    Da.tint(() => true, null);
    Db.tint(() => true, null);
    Da.tint((nt) => nt.k >= SITE && nt.k < CUT.botCut, BAM.color, 0.35);
    Db.tint((nt) => nt.k >= CB.topCut && nt.k < SITE + 6, BGL.color, 0.35);
    const hyb = t > T('r19');
    const hybSel = (nt: Nt) => nt.k >= SITE && nt.k < SITE + 6;
    Da.letterColor(() => true, (nt) => (hyb && hybSel(nt) ? '#7dffc0' : BASE_COLOR[nt.base]), '');
    Db.letterColor(() => true, (nt) => (hyb && hybSel(nt) ? '#7dffc0' : BASE_COLOR[nt.base]), '');
    tA.visible = t < T('r19');
    tA.position.set(Da.position.x + Da.x(3) - GAP * (1 - join) * 0.5, -3.4, 0);
    tB.visible = t > T('r17') + 3 && t < T('r19');
    tB.position.set(Db.position.x + Db.x(18) + GAP * (1 - join) * 0.5, -3.4, 0);
    tHyb.visible = hyb && t < T('r20');
    tHyb.position.set(Da.position.x + Da.x(SITE + 2.5), -3.4, 0);
    // both enzymes try, and bounce off
    const tries: [typeof bamS, number][] = [[bamS, T('r20') + 0.2], [bglS, T('r20') + 2.0]];
    tries.forEach(([m, t0], i) => {
      const k = ramp(t, t0, 0.8) - ramp(t, t0 + 1.2, 0.9);
      m.root.visible = t > t0 - 0.1 && t < t0 + 2.4;
      place(m.root, seatOnDna(m, Da, SITE + 2.5, { lift: V(i ? -2 : 2, 3.2 + 8 * (1 - k), 3 * (1 - k)) }));
      m.setOpacity('protein', 0.9);
      tNo[i].visible = t > t0 + 0.8 && t < t0 + 2.6;
      tNo[i].position.copy(m.root.position).add(V(0, 4.2, 0));
    });
    const back = ramp(t, T('r20') - 0.5, 1.0);
    return { pos: V(0, 2.2 + 2 * back, 17 + 7 * back), target: V(0, -0.2 + 2.6 * back, 0), aperture: 0.0003 };
  }

  // ================================================================ title / summary: BamHI on its DNA
  const heroSet = mkSet('hero');
  const hero = await loadFilmMolecule('1BHM');
  heroSet.add(hero.root);
  const hBox = new THREE.Box3().setFromObject(hero.root);
  hero.root.position.sub(hBox.getCenter(new THREE.Vector3()));

  // ================================================================ frame
  function update(t: number) {
    ov.beginFrame();
    const sc = sceneAt(clock, t);
    let cam: Cam;
    dust.visible = true;
    dust.rotation.y = t * 0.01;
    if (sc.id === 'title' || sc.id === 'summary') {
      show('hero');
      const summary = sc.id === 'summary';
      cam = { pos: orbit(V(0, 0, 0), summary ? 15 : 12, t * 0.14 + (summary ? 2 : 0.5), 2.5), target: V(0, 0, 0), aperture: 0.0005 };
      const right = new THREE.Vector3().subVectors(cam.target, cam.pos).cross(new THREE.Vector3(0, 1, 0)).normalize();
      const shift = summary ? -6.5 : -4.2;
      cam.target.addScaledVector(right, shift);
      cam.pos.addScaledVector(right, shift);
    } else if (sc.id === 'why') {
      show('why');
      cam = updateWhy(t);
    } else if (sc.id === 'ends') {
      show('ends');
      cam = updateEnds(t);
    } else if (sc.id === 'swap') {
      show('swap');
      cam = updateSwap(t);
    } else {
      show('main');
      updateMain(t, sc.id);
      cam = camMain(t);
    }
    applyCam(stage, cam);
    overlays(t, sc.id);
    ov.endFrame();
  }

  // ================================================================ 2D overlays
  const pair = (top: string, bot: string, hl: (i: number) => string) =>
    `<p class="mono">5′-${[...top].map((b, i) => `<i class="${hl(i)}">${b}</i>`).join('')}-3′</p><p class="mono">3′-${[...bot].map((b, i) => `<i class="${hl(i)}">${b}</i>`).join('')}-5′</p>`;
  const comp = (s: string) => [...s].map((c) => ({ A: 'T', T: 'A', G: 'C', C: 'G' } as Record<string, string>)[c]).join('');

  function endsDiagram(site: string, cut: number) {
    // the two new ends of a cut site, drawn with a gap
    const L = site.length, bot = comp(site);
    const top1 = site.slice(0, cut), top2 = site.slice(cut);
    const bc = L - cut;
    const bot1 = bot.slice(0, bc), bot2 = bot.slice(bc);
    const pad = (s: string, n: number) => s + '　'.repeat(Math.max(0, n - s.length));
    const w = Math.max(cut, bc);
    return `<span class="mono">${pad(top1, w)}  ${'　'.repeat(Math.max(0, w - cut) - 0)}${top2}</span><br><span class="mono">${pad(bot1, w)}  ${'　'.repeat(Math.max(0, w - bc))}${bot2}</span>`;
  }

  function overlays(t: number, scene: string) {
    standardOverlays(ov, clock, t, scene, '遺伝医学｜組換えDNA技術', '講義資料 スライド4〜6');
    if (scene === 'site' && t > T('r04') + 0.5) {
      ov.set('pal', pair('GGATCC', 'CCTAGG', () => 'hit') + '<p class="dim">下の鎖を 5′ から（右から左へ）読んでも G・G・A・T・C・C</p>', window01(t, T('r04') + 0.8, E('r04') + 0.5, 0.4), 'top-card');
    }
    if (scene === 'cut' && t > T('r08')) {
      ov.set('cut', `<p class="mono">5′-G<span class="gap">↓</span>GATC C-3′</p><p class="mono">3′-C CTAG<span class="gap">↑</span>G-5′</p><p class="dim">上下の切る位置が4塩基ずれる → GATC が1本鎖で残る</p>`, window01(t, T('r08') + 0.4, E('r09') + 0.4, 0.4), 'top-card');
    }
    if (scene === 'ends') {
      const rows = TRIO.map((e, i) => `<div class="end-row" style="opacity:${t > T(i === 2 ? 'r12' : 'r11') + (i === 1 ? 6 : 0.6) ? 1 : 0.25}"><b style="color:${e.color}">${e.name}</b><div>${endsDiagram(e.site, e.cut)}</div></div>`).join('');
      ov.set('ends', rows, window01(t, T('r10') + 1.5, E('r12') + 0.5, 0.4), 'side-card ends');
    }
    if (scene === 'ligase' && t > T('r15') + 3) {
      ov.set('atp', '<p>ATP → AMP ＋ ピロリン酸</p><p class="dim">そのエネルギーで 3′-OH と 5′-リン酸 をつなぐ（ホスホジエステル結合）</p>', window01(t, T('r15') + 3.2, E('r16') + 0.4, 0.4), 'top-card');
    }
    if (scene === 'swap') {
      ov.set('swapc', `<p class="mono"><span style="color:${BAM.color}">G</span>↓GATC<span style="color:${BAM.color}">C</span>　＋　<span style="color:${BGL.color}">A</span>↓GATC<span style="color:${BGL.color}">T</span></p><p>どちらも突出は <b>GATC</b> → つながる → <b class="g2">GGATCT</b></p>`, window01(t, T('r18') + 0.3, E('r20') + 0.4, 0.4), 'top-card');
    }
    if (scene === 'summary') {
      summaryOverlays(ov, clock, t, 'まとめ：制限酵素とDNAリガーゼ', [
        ['r22', '<b>制限酵素は回文の認識配列だけを切る</b><small>BamHI：G↓GATCC（細菌のウイルス防御）</small>'],
        ['r23', '<b>切り口は 5′突出・3′突出・平滑</b><small>突出が同じなら違う酵素の末端もつながる（BamHI＋BglII）</small>'],
        ['r24', '<b>DNAリガーゼが背骨のニックをふさぐ</b><small>ATPのエネルギーでホスホジエステル結合</small>'],
      ], '分子：PDB 1BHM（BamHI）・1DFM（BglII）・1X9N（ヒトDNAリガーゼI）／DNA：PDB 1BNA の原子座標から作成', 'r24');
    }
  }

  return { update };
}
