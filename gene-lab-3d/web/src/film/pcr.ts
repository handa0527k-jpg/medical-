/**
 * 授業動画「PCR」— every frame is a pure function of the film clock.
 *
 * Cycle 1 is shown at atomic resolution (lecture slide 17): the template duplex
 * melts at 95 °C, the forward (red) and reverse (green) primers anneal at 55 °C
 * and two Taq polymerases (PDB 3KTQ) extend them at 72 °C. From there on every
 * strand is a rod, bookkept by content/pcr.ts, so target-length duplexes appear
 * in cycle 3 (2 of 8) exactly as on slide 18. Real-time PCR curves (slides
 * 25-26) use the same model as the lab.
 */
import * as THREE from 'three';
import type { Stage } from '../core/stage';
import { AtomicDNA, BASE_COLOR, type Nt } from '../core/dna';
import { loadGlb, yUp } from '../core/molecule';
import { place, seatOnDna, type Pose } from '../core/interact';
import {
  Clock, FreeNucleotide, Overlays, V, applyCam, camPath, glowBall, loadFilmMolecule, makeDust, mix, orbit, ramp, sceneAt,
  setGlow, smooth, standardOverlays, summaryOverlays, wander, window01, type Cam,
} from './kit';
import { ct, cycle, fluorescence, isTarget, start, targetCount, type Duplex, type PcrDesign, type Strand } from '../content/pcr';

// same template as the PCR lab: flank | forward site | middle | reverse site | flank
const TEMPLATE = 'CTGACT' + 'GCATGTCA' + 'GTCCAGTA' + 'ACGGTCAT' + 'TGCAGC';
const DES: PcrDesign = { length: TEMPLATE.length, fwd: 6, rev: 30, primerLen: 8 };
const COL = { tpl: '#6b7385', F: '#e5484d', Fbody: '#ffa2a8', R: '#2fbf71', Rbody: '#9be7b4', target: '#ffd43b' };
// where the two daughter duplexes sit after melting (upper one a little behind)
const UP = V(0, 3.4, -1.6), LOW = V(0, -3.4, 1.6);
const N0 = [1e4, 1e3, 1e2];
const EFF = 1.0; // ideal doubling, so 10x more template = log2(10) = 3.3 cycles earlier // starting copies in the three real-time tubes

export async function buildPcr(stage: Stage, clock: Clock, ov: Overlays) {
  const T = (id: string) => clock.at(id);
  const E = (id: string) => clock.end(id);
  const world = stage.world;
  stage.scene.background = new THREE.Color('#04060c');
  stage.scene.fog = new THREE.FogExp2('#04060c', 0.010);
  stage.setAoRadius(0.5);
  const dust = makeDust();
  world.add(dust);

  const sets: Record<string, THREE.Group> = {};
  const mkSet = (k: string) => { const g = new THREE.Group(); g.visible = false; world.add(g); sets[k] = g; return g; };
  const show = (k: string) => { for (const [n, g] of Object.entries(sets)) g.visible = n === k; };

  // ================================================================ why: a long genome, one small region
  const whySet = mkSet('why');
  const genomePts: THREE.Vector3[] = [];
  {
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5;
    const p = V(-14, 0, 0), d = V(1, 0, 0);
    for (let i = 0; i < 260; i++) {
      genomePts.push(p.clone());
      d.add(V(rnd() * 0.9, rnd() * 0.9, rnd() * 0.9)).normalize();
      d.addScaledVector(p, -0.012).normalize(); // stay in a ball
      p.addScaledVector(d, 0.55);
    }
  }
  const genomeCurve = new THREE.CatmullRomCurve3(genomePts);
  const genome = new THREE.Mesh(new THREE.TubeGeometry(genomeCurve, 1400, 0.07, 6), new THREE.MeshStandardMaterial({ color: '#8a93a8', roughness: 0.5 }));
  whySet.add(genome);
  const tA = 0.53, tB = 0.545; // the region to copy
  const regionPts = Array.from({ length: 16 }, (_, i) => genomeCurve.getPointAt(mix(tA, tB, i / 15)));
  const regionCurve = new THREE.CatmullRomCurve3(regionPts);
  const region = new THREE.Mesh(new THREE.TubeGeometry(regionCurve, 40, 0.13, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(COL.target).multiplyScalar(2.2), toneMapped: false }));
  whySet.add(region);
  const regionC = regionCurve.getPointAt(0.5);
  const regionTag = stage.label('<b>調べたい領域</b><small>ゲノムのほんの一部</small>', 'film-tag warm');
  regionTag.position.copy(regionC).add(V(0, 1.4, 0));
  whySet.add(regionTag);
  const genomeTag = stage.label('<b>ゲノムDNA</b><small>1つの細胞に約30億塩基対</small>', 'film-tag');
  genomeTag.position.set(-6, 7.5, 0);
  whySet.add(genomeTag);
  const COPIES = 1024;
  const copyGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.4, 8);
  copyGeo.rotateZ(Math.PI / 2);
  const copies = new THREE.InstancedMesh(copyGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(COL.target).multiplyScalar(1.8), toneMapped: false }), COPIES);
  whySet.add(copies);
  const copyHome = Array.from({ length: COPIES }, (_, i) => {
    const u = (i * 0.618034) % 1, v = (i * 0.414214) % 1, w = (i * 0.732051) % 1;
    const r = 3 + 9 * Math.cbrt(w);
    const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
    return V(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.65, r * Math.sin(ph) * Math.sin(th)).add(regionC);
  });

  // ================================================================ molecular set: cycle 1, atom by atom
  const molSet = mkSet('mol');
  const tpl = new AtomicDNA(TEMPLATE);
  const up = new AtomicDNA(TEMPLATE); // strand 1 = new bottom strand from the reverse primer (pairs with tpl strand 0)
  const low = new AtomicDNA(TEMPLATE); // strand 0 = new top strand from the forward primer (pairs with tpl strand 1)
  for (const d of [tpl, up, low]) { d.position.x = -tpl.length / 2; molSet.add(d); }
  const inF = (nt: Nt) => nt.k >= DES.fwd && nt.k < DES.fwd + DES.primerLen;
  const inR = (nt: Nt) => nt.k >= DES.rev - DES.primerLen && nt.k < DES.rev;
  const F_END = DES.fwd + DES.primerLen; // first nucleotide the forward primer adds
  const R_END = DES.rev - DES.primerLen - 1; // first nucleotide the reverse primer adds (grows toward k = 0)

  const polA = await loadFilmMolecule('3KTQ'); // the one introduced in p05, works on the lower duplex
  const polB = await loadFilmMolecule('3KTQ');
  for (const p of [polA, polB]) { p.setOpacity('dna', 0); p.setOpacity('ddntp', 0); molSet.add(p.root); }
  const site = yUp(polA.meta.landmarks.ddntp!);
  const seatLow = (k: number) => seatOnDna(polA, low, k, { flip: true, along: site.x, lift: LOW });
  const seatUp = (k: number) => seatOnDna(polB, up, k, { flip: false, along: -site.x, lift: UP });

  const baseK = (b: string) => TEMPLATE.indexOf(b);
  const dntps = ['A', 'T', 'G', 'C'].map((b) => ({ b, f: new FreeNucleotide(tpl, tpl.nt(0, baseK(b))) }));
  for (const d of dntps) tpl.add(d.f);

  const tag = (html: string, cls = 'film-tag') => { const t = stage.label(html, cls); molSet.add(t); return t; };
  const tTpl = tag('<b>鋳型DNA</b><small>二本鎖</small>');
  const tRegion = tag('<b>増やしたい領域</b>', 'film-tag warm');
  const tF = tag(`<b style="color:${COL.F}">フォワードプライマー</b><small>5′→3′ 8塩基</small>`);
  const tR = tag(`<b style="color:${COL.R}">リバースプライマー</b><small>反対の鎖に結合</small>`);
  const tPol = tag('<b>Taq DNAポリメラーゼ</b><small>好熱菌（温泉）由来・実構造 PDB 3KTQ</small>');
  const tDntp = dntps.map(({ b }) => tag(`<b style="color:${BASE_COLOR[b]}">d${b}TP</b>`));
  const tDir = [tag(`<b style="color:${COL.F}">→ 伸びる向き</b>`), tag(`<b style="color:${COL.R}">伸びる向き ←</b>`)];
  const tTwo = [tag('<b>1本目</b>', 'film-tag good'), tag('<b>2本目</b>', 'film-tag good')];
  const dirArrows = [COL.F, COL.R].map((c) => {
    const g = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2), toneMapped: false }));
    molSet.add(g);
    return g;
  });
  const wT = (d: AtomicDNA, p: THREE.Vector3) => d.localToWorld(p.clone());

  // temperature program of cycle 1
  function temp(t: number) {
    if (t < T('p07')) return 25;
    if (t < T('p08')) return mix(25, 95, ramp(t, T('p07'), 1.6));
    if (t < T('p10')) return mix(95, 55, ramp(t, T('p08'), 1.6));
    return mix(55, 72, ramp(t, T('p10'), 1.2));
  }
  // extension progress (0..1) of cycle 1
  const extT0 = () => T('p10') + 1.8, extT1 = () => T('p11') + 0.6;
  const ext = (t: number) => smooth((t - extT0()) / (extT1() - extT0()));

  function updateMol(t: number) {
    const melt = ramp(t, T('p07') + 0.8, 2.6);
    const anneal = ramp(t, T('p08') + 1.0, 2.2);
    const apart = ramp(t, T('p11') + 0.5, 1.6); // the two daughter duplexes move apart at the end
    const g = ext(t);
    const nLow = DES.length - F_END, nUp = R_END + 1;
    const spread = 1 + 0.35 * apart;
    // template: strand 0 goes up, strand 1 goes down (with a wobble while melting)
    tpl.each(() => true, (nt) => {
      const side = nt.strand === 0 ? UP : LOW;
      nt.offset.copy(side).multiplyScalar(melt * spread);
      nt.offset.z += Math.sin(nt.k * 0.6) * 0.4 * Math.sin(Math.PI * melt);
      nt.scale = 1;
    });
    // primers float in at p04 and anneal at p08; new strands grow at 72 °C
    const primerOn = ramp(t, T('p04') + 0.4, 1.4);
    const floatR = V(-1.5, 3.8, 3.5).add(wander(1, t, 0.3)), floatF = V(1.5, -3.8, 4.0).add(wander(2, t, 0.3));
    up.each(() => true, (nt) => {
      nt.scale = 0;
      if (nt.strand !== 1) return;
      if (inR(nt)) {
        nt.scale = smooth(primerOn);
        nt.offset.copy(UP).multiplyScalar(spread).lerp(floatR, 1 - anneal);
      } else if (nt.k < DES.rev - DES.primerLen) {
        const i = R_END - nt.k; // 0 = first added
        nt.scale = g * nUp > i + 0.5 ? 1 : 0;
        nt.offset.copy(UP).multiplyScalar(spread);
      }
    });
    low.each(() => true, (nt) => {
      nt.scale = 0;
      if (nt.strand !== 0) return;
      if (inF(nt)) {
        nt.scale = smooth(primerOn);
        nt.offset.copy(LOW).multiplyScalar(spread).lerp(floatF, 1 - anneal);
      } else if (nt.k >= F_END) {
        const i = nt.k - F_END;
        nt.scale = g * nLow > i + 0.5 ? 1 : 0;
        nt.offset.copy(LOW).multiplyScalar(spread);
      }
    });
    // colours: the region to copy, the primer sites, the primers and new strands
    tpl.tint(() => true, null);
    const regionHl = window01(t, T('p03') + 0.8, T('p04') + 0.6, 0.5);
    if (regionHl > 0) tpl.tint((nt) => nt.k >= DES.fwd && nt.k < DES.rev, COL.target, 0.45 * regionHl);
    if (t > T('p04') + 0.6) {
      tpl.tint((nt) => nt.strand === 1 && inF(nt), COL.F, 0.3);
      tpl.tint((nt) => nt.strand === 0 && inR(nt), COL.R, 0.3);
    }
    up.tint(() => true, null);
    low.tint(() => true, null);
    up.tint((nt) => inR(nt), COL.R, 0.75);
    low.tint((nt) => inF(nt), COL.F, 0.75);
    up.tint((nt) => nt.k < DES.rev - DES.primerLen, COL.Rbody, 0.45);
    low.tint((nt) => nt.k >= F_END, COL.Fbody, 0.45);

    // polymerases: A floats into view at p05, parks, then both seat at p10 and walk with the growing ends
    const iLow = Math.min(nLow - 1, g * nLow), iUp = Math.min(nUp - 1, g * nUp);
    const seatA = seatLow(F_END + iLow - 0.5), seatB = seatUp(R_END - iUp + 0.5);
    const floatA: Pose = {
      pos: V(4.2, -3.4, 6.5).add(wander(3, t, 0.25)),
      quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, t * 0.25, 0.1)),
      scale: V(1, 1, 1),
    };
    const parkA: Pose = { ...floatA, pos: V(30, 14, -20) };
    const inA = ramp(t, T('p05') + 0.2, 2.0);
    const parkK = ramp(t, T('p06') + 0.3, 1.8);
    const seatK = ramp(t, T('p10') + 0.2, 1.6);
    const outK = ramp(t, T('p11') + 0.2, 1.8);
    const blend = (a: Pose, b: Pose, k: number): Pose => ({ pos: a.pos.clone().lerp(b.pos, k), quat: a.quat.clone().slerp(b.quat, k), scale: a.scale.clone().lerp(b.scale, k) });
    let pa = blend({ ...floatA, pos: V(16, 9, -8) }, floatA, inA);
    pa = blend(pa, parkA, parkK);
    pa = blend(pa, seatA, seatK);
    pa = blend(pa, { ...seatA, pos: seatA.pos.clone().add(V(6, -8, 6)) }, outK);
    place(polA.root, pa);
    polA.root.visible = t > T('p05') && outK < 0.99;
    const pb = blend(blend({ ...seatB, pos: seatB.pos.clone().add(V(-6, 9, -4)) }, seatB, seatK), { ...seatB, pos: seatB.pos.clone().add(V(-6, 9, -4)) }, outK);
    place(polB.root, pb);
    polB.root.visible = seatK > 0.01 && outK < 0.99;
    for (const p of [polA, polB]) p.setOpacity('protein', 1);

    // free dNTPs: shown in p06, then drift near the polymerases while they work
    const dOn = window01(t, T('p06'), T('p07') + 0.3, 0.6) + window01(t, T('p10') + 1.0, T('p11') + 0.5, 0.6);
    dntps.forEach(({ f }, i) => {
      f.visible = dOn > 0.02;
      if (!f.visible) return;
      const home = t < T('p08')
        ? V(-4.5 + i * 3.0, -0.6 + (i % 2) * 1.6, 6 + (i % 2)).add(wander(i * 2.3, t, 0.4))
        : (i % 2 ? UP : LOW).clone().add(V(-3 + i * 2.2, (i % 2 ? 1 : -1) * 3.4, 3.0)).add(wander(i * 2.3, t, 0.6));
      f.pose(home.sub(f.centre), 0, t * 0.6 + i);
      f.scale.setScalar(Math.max(0.001, Math.min(1, dOn)));
      tDntp[i].visible = t < T('p08') && dOn > 0.5;
      tDntp[i].position.copy(wT(tpl, f.position)).add(V(0, 1.0, 0));
    });

    // labels
    tTpl.visible = t > T('p03') + 0.3 && t < T('p04');
    tTpl.position.copy(wT(tpl, V(tpl.x(31), -2.6, 0)));
    tRegion.visible = regionHl > 0.5;
    tRegion.position.copy(wT(tpl, V(tpl.x(18), 2.6, 0)));
    const primTag = t > T('p04') + 1.2 && t < T('p05') || (t > T('p08') + 3.4 && t < T('p09'));
    tR.visible = primTag;
    tR.position.copy(wT(up, up.ntCenter(up.nt(1, DES.rev - 4)))).add(V(0, 1.6, 0));
    tF.visible = primTag;
    tF.position.copy(wT(low, low.ntCenter(low.nt(0, DES.fwd + 4)))).add(V(0, 1.8, 0));
    tPol.visible = t > T('p05') + 1.6 && t < T('p06') + 0.3;
    tPol.position.copy(polA.root.position).add(V(-6.5, 0.5, 0));
    // p09: arrows at the primers' 3' ends, pointing into the region
    const dirOn = window01(t, T('p09') + 0.3, E('p09') + 0.2, 0.4);
    const aF = wT(low, V(low.x(F_END) + 0.4, 0, 0).add(LOW)), aR = wT(up, V(up.x(R_END) - 0.4, 0, 0).add(UP));
    dirArrows[0].position.copy(aF).add(V(0.9, -1.5, 0));
    dirArrows[0].rotation.set(0, 0, -Math.PI / 2);
    dirArrows[1].position.copy(aR).add(V(-0.9, 1.5, 0));
    dirArrows[1].rotation.set(0, 0, Math.PI / 2);
    for (const a of dirArrows) { a.visible = dirOn > 0.02; a.scale.setScalar(Math.max(0.001, dirOn)); }
    tDir[0].visible = tDir[1].visible = dirOn > 0.5;
    tDir[0].position.copy(dirArrows[0].position).add(V(1.6, -0.9, 0));
    tDir[1].position.copy(dirArrows[1].position).add(V(-1.6, 0.9, 0));
    const twoOn = t > T('p11') + 1.8;
    tTwo[0].visible = tTwo[1].visible = twoOn;
    tTwo[0].position.copy(wT(tpl, V(tpl.length + 2.6, 0, 0).add(UP.clone().multiplyScalar(spread))));
    tTwo[1].position.copy(wT(tpl, V(tpl.length + 2.6, 0, 0).add(LOW.clone().multiplyScalar(spread))));

    // the block temperature tints the background
    const k = THREE.MathUtils.clamp((temp(t) - 25) / 70, 0, 1);
    (stage.scene.background as THREE.Color).set('#04060c').lerp(new THREE.Color('#1d080b'), k * 0.9);
  }

  const camKeysMol = (): [number, Cam][] => [
    [T('p03'), { pos: V(-1, 2.0, 24), target: V(0, 0, 0), aperture: 0.0003 }],
    [T('p04'), { pos: V(1.5, 0.5, 23), target: V(0, -0.2, 1), aperture: 0.0003 }],
    [T('p05') + 0.8, { pos: V(11, 3.0, 24), target: V(4.2, -0.6, 6.5), aperture: 0.0005 }],
    [E('p05'), { pos: V(9.5, 4.0, 23), target: V(4.2, -0.6, 6.5), aperture: 0.0005 }],
    [T('p06') + 1.0, { pos: V(0, 1.0, 21), target: V(0, -0.2, 3), aperture: 0.0004 }],
    [T('p07'), { pos: V(-2, 1.0, 27), target: V(0, -1.3, 0), aperture: 0.0003 }],
    [T('p08'), { pos: V(-3, 1.4, 28), target: V(0, -1.6, 0), aperture: 0.0003 }],
    [T('p09'), { pos: V(1, 0.2, 26), target: V(0, -1.6, 0), aperture: 0.0003 }],
    [E('p09'), { pos: V(0.5, 0.0, 25), target: V(0, -1.6, 0), aperture: 0.0003 }],
    [T('p10') + 1.2, { pos: V(6, 4, 36), target: V(0, -2.4, 0), aperture: 0.0002 }],
    [T('p11'), { pos: V(-4, 3, 37), target: V(0, -2.4, 0), aperture: 0.0002 }],
    [E('p11') + 1, { pos: V(-2, 1.5, 36), target: V(1, -1.8, 0), aperture: 0.0002 }],
  ];

  // ================================================================ population (cycles as rods)
  const popSet = mkSet('pop');
  const pools: Duplex[][] = [start(DES)];
  for (let n = 1; n <= 5; n++) pools.push(cycle(pools[n - 1], DES, n));
  const unit = 0.26;
  const rodGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 10);
  rodGeo.rotateZ(Math.PI / 2);
  const mats = new Map<string, THREE.Material>();
  const mat = (c: string, glow = 0) => {
    const k = c + glow;
    if (!mats.has(k)) mats.set(k, glow ? new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(glow), toneMapped: false }) : new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 }));
    return mats.get(k)!;
  };
  interface Rod { g: THREE.Group; body: THREE.Mesh; s: Strand }
  const rods = new Map<number, Rod>();
  const rodOf = (s: Strand): Rod => {
    let r = rods.get(s.id);
    if (r) return r;
    const g = new THREE.Group();
    const body = new THREE.Mesh(rodGeo, mat(s.primer === 'F' ? COL.Fbody : s.primer === 'R' ? COL.Rbody : COL.tpl));
    g.add(body);
    if (s.primer) {
      const pa = s.primer === 'F' ? DES.fwd : DES.rev - DES.primerLen;
      const p = new THREE.Mesh(rodGeo, mat(s.primer === 'F' ? COL.F : COL.R));
      p.scale.set(DES.primerLen * unit, 1.35, 1.35);
      p.position.x = (pa + DES.primerLen / 2) * unit;
      g.add(p);
    }
    popSet.add(g);
    r = { g, body, s };
    rods.set(s.id, r);
    return r;
  };
  // pre-create every rod so nothing is built mid-render
  for (const pool of pools) for (const [x, y] of pool) { rodOf(x); rodOf(y); }
  const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry((DES.rev - DES.fwd) * unit + 0.36, 0.95, 0.36));
  const frameMat = new THREE.LineBasicMaterial({ color: new THREE.Color(COL.target).multiplyScalar(2), toneMapped: false, transparent: true });
  const boxes = Array.from({ length: 32 }, () => { const b = new THREE.LineSegments(frameGeo, frameMat); popSet.add(b); return b; });
  const W = DES.length * unit;
  function slots(n: number) {
    const cols = n > 16 ? 4 : n > 4 ? 2 : 1;
    const rows = Math.ceil(n / cols);
    return Array.from({ length: n }, (_, i) => V((i % cols - (cols - 1) / 2) * (W + 1.8) - W / 2, ((rows - 1) / 2 - Math.floor(i / cols)) * 1.3, 0));
  }
  const strandY = (s: Strand) => (s.dir === 1 ? 0.21 : -0.21);
  // the cycles: [time, duration] — cycle 1 replays quickly at p12
  const cycT = () => [T('p12') + 0.6, T('p14') + 0.6, T('p15') + 0.6, T('p16') + 4.0, T('p16') + 6.6];
  const CYC_DUR = [1.6, 2.6, 2.6, 2.0, 2.0];
  const longTag = stage.label('<b>端まで伸びる</b><small>終わりが決まっていない</small>', 'film-tag');
  const stopTag = stage.label('<b>反対のプライマーで止まる</b>', 'film-tag good');
  const tgtTag = stage.label('<b>目的の長さ</b><small>両端がプライマー</small>', 'film-tag warm');
  popSet.add(longTag, stopTag, tgtTag);
  const endGlow = [glowBall('#ffffff', 0.22, 1.6), glowBall('#ffffff', 0.22, 1.6)];
  popSet.add(...endGlow);

  function updatePop(t: number) {
    const times = cycT();
    let c = 0;
    while (c < 5 && t >= times[c]) c++; // pools[c] is current (growing into it)
    const u = c === 0 ? 1 : Math.min(1, (t - times[c - 1]) / CYC_DUR[c - 1]);
    const pool = pools[c], prev = pools[Math.max(0, c - 1)];
    const sl = slots(pool.length), slPrev = slots(prev.length);
    for (const r of rods.values()) r.g.visible = false;
    const moveK = smooth(u / 0.4), growK = smooth((u - 0.45) / 0.55);
    pool.forEach(([s, n], i) => {
      // s: an old strand (template), n: the strand made on it this cycle
      const parentSlot = c === 0 ? sl[i] : slPrev[Math.floor(i / 2)];
      for (const st of [s, n]) {
        const r = rodOf(st);
        r.g.visible = true;
        const isNew = c > 0 && st.gen === c;
        const len = st.b - st.a;
        if (isNew) {
          // grows from the end of its primer
          const pe = st.dir === 1 ? DES.fwd + DES.primerLen : DES.rev - DES.primerLen;
          const grown = (len - DES.primerLen) * growK;
          const a = st.dir === 1 ? pe : pe - grown, b = st.dir === 1 ? pe + grown : pe;
          r.body.scale.x = Math.max(1e-3, (b - a) * unit);
          r.body.position.x = ((a + b) / 2) * unit;
          r.g.position.copy(sl[i]).add(V(0, strandY(st), 0));
          r.g.visible = u > 0.42;
        } else {
          r.body.scale.x = len * unit;
          r.body.position.x = (st.a + len / 2) * unit;
          const from = parentSlot.clone().add(V(0, strandY(st), 0));
          const to = sl[i].clone().add(V(0, strandY(st), 0));
          r.g.position.copy(from).lerp(to, moveK);
        }
      }
    });
    // yellow frames round the target-length duplexes once they are finished
    let nb = 0;
    if (u > 0.97) pool.forEach((d, i) => {
      if (!isTarget(d, DES) || nb >= boxes.length) return;
      const b = boxes[nb++];
      b.visible = true;
      b.position.copy(sl[i]).add(V(((DES.fwd + DES.rev) / 2) * unit, 0, 0));
    });
    for (let i = nb; i < boxes.length; i++) boxes[i].visible = false;
    frameMat.opacity = 0.75 + 0.25 * Math.sin(t * 5);
    // p13: the long products of cycle 1 run to the template's end
    const longOn = window01(t, T('p13') + 0.8, T('p14') + 0.2, 0.4);
    longTag.visible = longOn > 0.5;
    if (c === 1 || (c === 2 && u < 0.4)) {
      const s1 = slots(2);
      endGlow[0].position.copy(s1[0]).add(V(W, 0.21, 0));
      endGlow[1].position.copy(s1[1]).add(V(0, -0.21, 0));
      longTag.position.copy(s1[1]).add(V(-1.4, -1.6, 0));
    }
    for (const e of endGlow) setGlow(e, longOn * (0.7 + 0.3 * Math.sin(t * 6)), 0.24);
    // p14: strands that stop at the other primer
    stopTag.visible = c === 2 && t > T('p14') + 3.2 && t < T('p15');
    if (stopTag.visible) stopTag.position.copy(slots(4)[0]).add(V(W / 2, 1.5, 0));
    tgtTag.visible = c === 3 && t > T('p15') + 3.4 && t < T('p16') + 0.5;
    if (tgtTag.visible) {
      const iT = pool.findIndex((d) => isTarget(d, DES));
      tgtTag.position.copy(sl[iT]).add(V(((DES.fwd + DES.rev) / 2) * unit, 1.2, 0));
    }
    return c;
  }
  function camPop(t: number): Cam {
    const keys: [number, Cam][] = [
      [T('p12'), { pos: V(2, 0.4, 16), target: V(2, -0.6, 0), aperture: 0.0002 }],
      [T('p14') + 0.4, { pos: V(2.5, 0.2, 17), target: V(2.2, -0.8, 0), aperture: 0.0002 }],
      [T('p15') + 0.4, { pos: V(4, 0.2, 29), target: V(3.8, -1.2, 0), aperture: 0.0002 }],
      [T('p16') + 3.6, { pos: V(4, 0.2, 30), target: V(3.8, -1.2, 0), aperture: 0.0002 }],
      [T('p16') + 7.2, { pos: V(5, 0, 64), target: V(5.3, -2.4, 0), aperture: 0.0001 }],
      [E('p17'), { pos: V(5.5, 0, 66), target: V(5.3, -2.4, 0), aperture: 0.0001 }],
    ];
    return camPath(keys, t);
  }

  // ================================================================ real-time PCR: three tubes glowing
  const rtSet = mkSet('rt');
  const kit = await loadGlb('kit.glb');
  const tubeSrc = kit.getObjectByName('tube')!;
  const rtTubes = N0.map((n0, i) => {
    const tb = tubeSrc.clone(true);
    tb.position.set(-3.2 + i * 3.2, -1, 0);
    tb.rotation.set(0, 0, 0);
    tb.scale.setScalar(1.3);
    const liq = tb.getObjectByName('tube_liquid') as THREE.Mesh;
    const m = (liq.material as THREE.MeshStandardMaterial).clone();
    m.color = new THREE.Color('#1a2c22');
    m.emissive = new THREE.Color('#39ff7a');
    m.emissiveIntensity = 0;
    m.toneMapped = false;
    liq.material = m;
    rtSet.add(tb);
    const l = stage.label(`<b>${['1万', '1000', '100'][i]}コピー</b><small>最初のDNA</small>`, 'film-tag');
    l.position.set(tb.position.x, -4.4, 0);
    rtSet.add(l);
    return { m, n0 };
  });
  const rtCycle = (t: number) => 40 * smooth((t - T('p18') - 1.5) / (T('p19') + 3 - T('p18') - 1.5));

  // ================================================================ title / summary: the duplex with both enzymes
  function updateHero(freeze: number) {
    show('mol');
    updateMol(freeze);
    for (const l of [tTpl, tRegion, tF, tR, tPol, ...tDntp, ...tDir, ...tTwo]) l.visible = false;
    for (const a of dirArrows) a.visible = false;
    (stage.scene.background as THREE.Color).set('#04060c');
  }

  // ================================================================ frame
  function update(t: number) {
    ov.beginFrame();
    const sc = sceneAt(clock, t);
    let cam: Cam;
    dust.visible = true;
    dust.rotation.y = t * 0.01;
    (stage.scene.background as THREE.Color).set('#04060c');
    if (sc.id === 'title' || sc.id === 'summary') {
      const summary = sc.id === 'summary';
      updateHero(summary ? E('p11') + 2 : T('p10') + 4.5);
      const c = V(0, 0, 0);
      cam = { pos: orbit(c, summary ? 30 : 27, t * 0.1 + (summary ? 2.2 : 0.4), 4), target: c, aperture: 0.0003 };
      const right = new THREE.Vector3().subVectors(cam.target, cam.pos).cross(new THREE.Vector3(0, 1, 0)).normalize();
      const shift = summary ? -8.5 : -7;
      cam.target = cam.target.clone().addScaledVector(right, shift);
      cam.pos = cam.pos.clone().addScaledVector(right, shift);
    } else if (sc.id === 'why') {
      show('why');
      cam = updateWhy(t);
    } else if (sc.id === 'count') {
      show('pop');
      updatePop(t);
      cam = camPop(t);
    } else if (sc.id === 'realtime') {
      show('rt');
      const cy = rtCycle(t);
      rtTubes.forEach(({ m, n0 }) => (m.emissiveIntensity = 2.2 * fluorescence(cy, n0, EFF) / 100));
      cam = { pos: V(5.6 - 0.8 * smooth((t - T('p18')) / 20), -1.0, 16), target: V(5.6, -2.6, 0), aperture: 0.0003 };
    } else {
      show('mol');
      updateMol(t);
      cam = camPath(camKeysMol(), t);
    }
    applyCam(stage, cam);
    overlays(t, sc.id);
    ov.endFrame();
  }

  function updateWhy(t: number): Cam {
    const hl = ramp(t, T('p02') + 0.3, 1.0);
    (region.material as THREE.MeshBasicMaterial).color.set(COL.target).multiplyScalar(0.4 + 1.8 * hl);
    region.scale.setScalar(1);
    regionTag.visible = hl > 0.5 && t < T('p02') + 3.6;
    genomeTag.visible = t > T('p01') + 1.0 && t < T('p02') + 0.5;
    // copies multiply out of the region: 2, 4, 8 ... 1024
    const k = ramp(t, T('p02') + 3.6, E('p02') - T('p02') - 3.0);
    const n = Math.min(COPIES, Math.floor(Math.pow(2, k * 10)));
    const m = new THREE.Matrix4();
    for (let i = 0; i < COPIES; i++) {
      const on = i < n && k > 0;
      const p = regionC.clone().lerp(copyHome[i], on ? smooth(k * 10 - Math.log2(i + 1) + 1) : 0).add(wander(i, t, 0.15));
      m.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(i, t * 0.4 + i * 0.3, i * 0.7)), V(1, 1, 1).multiplyScalar(on ? 1 : 1e-4));
      copies.setMatrixAt(i, m);
    }
    copies.instanceMatrix.needsUpdate = true;
    const zoom = smooth((t - T('p01')) / (T('p02') + 3 - T('p01')));
    const back = ramp(t, T('p02') + 3.6, 3);
    const c = regionC.clone().multiplyScalar(zoom * (1 - back));
    const r = mix(30, 9, zoom) + 22 * back;
    return { pos: orbit(c, r, t * 0.06 + 0.5, 4 - 2 * zoom + 3 * back), target: c, aperture: 0.0002 + 0.0006 * zoom * (1 - back) };
  }

  // ================================================================ 2D overlays
  function overlays(t: number, scene: string) {
    standardOverlays(ov, clock, t, scene, '遺伝医学｜組換えDNA技術', '講義資料 スライド16〜19・25〜26');
    if (scene === 'parts' || scene === 'cycle') {
      const tc = temp(t);
      const step = t < T('p07') ? '' : t < T('p08') ? '① 変性' : t < T('p10') ? '② アニーリング' : '③ 伸長';
      const hot = (tc - 25) / 70;
      const col = `hsl(${mix(200, 0, hot)}, 85%, 62%)`;
      ov.set('thermo', `<div class="thermo-bar"><i style="height:${(tc / 100) * 100}%;background:${col}"></i></div><div><b style="color:${col}">${Math.round(tc)}℃</b><span>${step}</span></div>`,
        window01(t, T('p07') - 0.6, E('p11') + 0.6, 0.4), 'thermo');
      if (scene === 'parts') ov.set('cyc', '<p>サーマルサイクラー：95℃ → 55℃ → 72℃ をくり返す</p>', window01(t, T('p06') + 2.4, E('p06') + 0.4, 0.4), 'top-note');
    }
    if (scene === 'count') {
      const c = Math.min(5, cycT().filter((x) => t >= x + 1).length);
      const rows = [1, 2, 3, 4, 5].filter((n) => n <= c).map((n) => `<tr class="${n === c ? 'on' : ''}"><td>${n}</td><td>${2 ** n}</td><td>${targetCount(n)}</td></tr>`).join('');
      const thirty = t > T('p16') + 9 ? `<tr class="far"><td>30</td><td>約10.7億</td><td>約10.7億</td></tr>` : '';
      ov.set('table', `<table><tr><th>サイクル</th><th>二本鎖</th><th>目的の長さ</th></tr>${rows}${thirty}</table><p class="formula">目的の長さ ＝ 2<sup>n</sup> − 2n</p>`,
        window01(t, T('p12') + 1, E('p17') + 0.6, 0.5), 'side-card count');
      ov.set('gel', gelSvg(), window01(t, T('p17') + 3.0, E('p17') + 0.6, 0.5), 'gel-card');
    }
    if (scene === 'realtime') {
      ov.set('chart', chartSvg(t), window01(t, T('p18') + 0.8, E('p21') + 0.6, 0.5), 'side-card chart');
    }
    if (scene === 'summary') {
      summaryOverlays(ov, clock, t, 'まとめ：PCR（ポリメラーゼ連鎖反応）', [
        ['p23', '<b>95℃ ほどく → 55℃ プライマー → 72℃ 伸ばす</b><small>これで1サイクル。耐熱性の Taq ポリメラーゼを使う</small>'],
        ['p24', '<b>2本のプライマーにはさまれた領域だけが倍々に</b><small>3サイクル目から目的の長さ、n サイクルで 2ⁿ−2n 本</small>'],
        ['p25', '<b>リアルタイムPCR：Ct値から最初の量がわかる</b><small>10倍多い → Ct が約3.3サイクル早い</small>'],
      ], '分子：PDB 3KTQ（Taq DNAポリメラーゼ）／DNA：PDB 1BNA の原子座標から作成／本数：講義スライド18', 'p25');
    }
  }

  function gelSvg() {
    return `<svg viewBox="0 0 240 300" width="100%">
      <rect x="10" y="10" width="220" height="280" rx="10" fill="#141c2c" stroke="#3a4a66"/>
      <text x="70" y="36" fill="#aab6cc" font-size="15" text-anchor="middle">サイズ</text><text x="170" y="36" fill="#aab6cc" font-size="15" text-anchor="middle">PCR後</text>
      ${[70, 100, 128, 160, 196, 240].map((y) => `<rect x="40" y="${y}" width="60" height="5" rx="2" fill="#9aa5b8"/>`).join('')}
      <rect x="140" y="${170}" width="60" height="9" rx="3" fill="#ff8ac0" style="filter:drop-shadow(0 0 6px #ff3d8b)"/>
      <text x="170" y="210" fill="#ffd6e8" font-size="14" text-anchor="middle">1本のバンド</text>
      <text x="120" y="282" fill="#8f9bb3" font-size="12" text-anchor="middle">長さがそろっている</text>
    </svg>`;
  }

  function chartSvg(t: number) {
    const W = 600, H = 360, L = 60, B = 320, R = 580, TOP = 24;
    const cyNow = rtCycle(t);
    const X = (c: number) => L + (c / 40) * (R - L), Y = (f: number) => B - (f / 100) * (B - TOP);
    const cols = ['#59ff9a', '#3ad1ff', '#c38bff'];
    const curves = N0.map((n0, i) => {
      let d = '';
      for (let c = 0; c <= cyNow; c += 0.25) d += `${d ? 'L' : 'M'}${X(c).toFixed(1)},${Y(fluorescence(c, n0, EFF)).toFixed(1)}`;
      return `<path d="${d}" fill="none" stroke="${cols[i]}" stroke-width="4"/>`;
    }).join('');
    const thrOn = t > T('p19') + 0.5;
    const thr = thrOn ? `<line x1="${L}" x2="${R}" y1="${Y(10)}" y2="${Y(10)}" stroke="#ff5a7a" stroke-width="2" stroke-dasharray="8 6"/><text x="${R}" y="${Y(10) - 8}" fill="#ff8a9e" font-size="16" text-anchor="end">しきい値</text>` : '';
    const ctOn = t > T('p19') + 2.5;
    const cts = N0.map((n0, i) => {
      const c = ct(n0, 10, EFF);
      if (!ctOn || c > cyNow) return '';
      return `<line x1="${X(c)}" x2="${X(c)}" y1="${Y(10)}" y2="${B}" stroke="${cols[i]}" stroke-width="2" stroke-dasharray="4 4"/><text x="${X(c)}" y="${B + 22}" fill="${cols[i]}" font-size="15" text-anchor="middle">${c.toFixed(1)}</text>`;
    }).join('');
    const brOn = t > T('p20') + 3.4;
    const c0 = ct(N0[0], 10, EFF), c1 = ct(N0[1], 10, EFF);
    const br = brOn ? `<path d="M${X(c0)},${Y(10) - 34} L${X(c1)},${Y(10) - 34}" stroke="#ffd166" stroke-width="3"/><text x="${X(c0) - 12}" y="${Y(10) - 28}" fill="#ffd166" font-size="16" text-anchor="end">10倍 → ${(c1 - c0).toFixed(1)} サイクル</text>` : '';
    const legend = N0.map((_, i) => `<text x="${L + 14}" y="${TOP + 24 + i * 22}" fill="${cols[i]}" font-size="15">● ${['1万', '1000', '100'][i]}コピー</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H + 20}" width="100%">
      <line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="#8f9bb3"/><line x1="${L}" y1="${B}" x2="${L}" y2="${TOP}" stroke="#8f9bb3"/>
      <text x="${(L + R) / 2}" y="${H + 18}" fill="#aab6cc" font-size="15" text-anchor="middle">サイクル数（いま ${Math.floor(cyNow)}）</text>
      <text x="22" y="${(B + TOP) / 2}" fill="#aab6cc" font-size="15" text-anchor="middle" transform="rotate(-90 22 ${(B + TOP) / 2})">蛍光の強さ</text>
      ${[0, 10, 20, 30, 40].map((c) => `<text x="${X(c)}" y="${B + 38}" fill="#6f7b93" font-size="12" text-anchor="middle">${c}</text>`).join('')}
      ${thr}${curves}${cts}${br}${legend}
    </svg>`;
  }

  return { update };
}

