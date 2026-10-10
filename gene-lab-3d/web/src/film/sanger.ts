/**
 * 授業動画「サンガー法」— every frame is a pure function of the film clock.
 *
 * Sequence (lecture slide 29): template 3'-CGTATACAGTCAGGTC-5', primer
 * 5'-GCAT-3'. The atomic DNA below is that duplex: strand 0 is the new strand
 * (primer GCAT + ATGTCAGTCCAG), strand 1 the template. Cycle by cycle the film
 * shows the 3'-OH of the growing end attacking the next dNTP, then a ddCTP
 * (no 3'-O) arriving at position 9 and the chain stopping.
 */
import * as THREE from 'three';
import type { Stage } from '../core/stage';
import { AtomicDNA, BASE_COLOR, type Nt } from '../core/dna';
import { loadGlb, yUp } from '../core/molecule';
import { place, seatOnDna } from '../core/interact';
import { Clock, FreeNucleotide, Overlays, V, camPath, glowBall, loadFilmMolecule, makeDust, mix, orbit, ramp, setGlow, smooth, wander, window01, type Cam } from './kit';
import { DYE, NEW_STRAND, PRIMER, TEMPLATE_3to5, fragments } from '../content/sanger';

const FULL = PRIMER + NEW_STRAND; // GCATATGTCAGTCCAG, strand 0 of the duplex
const BASES = ['A', 'T', 'C', 'G'];
const dd = (b: string) => `dd${b}TP`;

export async function buildSanger(stage: Stage, clock: Clock, ov: Overlays) {
  const T = (id: string) => clock.at(id);
  const E = (id: string) => clock.end(id);
  const world = stage.world;
  stage.scene.background = new THREE.Color('#04060c');
  stage.scene.fog = new THREE.FogExp2('#04060c', 0.012);
  stage.setAoRadius(0.5);

  const dust = makeDust();
  world.add(dust);

  // ================================================================ sets
  const sets: Record<string, THREE.Group> = {};
  const mkSet = (k: string) => { const g = new THREE.Group(); g.visible = false; world.add(g); sets[k] = g; return g; };

  // ---------------------------------------------------------------- crystal set: the real ternary complex
  const crySet = mkSet('crystal');
  const crystal = await loadFilmMolecule('3KTQ');
  crySet.add(crystal.root);
  const box = new THREE.Box3().setFromObject(crystal.root);
  const cryCenter = box.getCenter(new THREE.Vector3());
  crystal.root.position.sub(cryCenter);
  const ddPos = yUp(crystal.meta.landmarks.ddntp!).sub(cryCenter);
  const ddGlow = glowBall('#ff3b5c', 0.55);
  ddGlow.position.copy(ddPos);
  crySet.add(ddGlow);
  const ddTag = stage.label('<b>ddCTP</b><small>取り込まれる直前（実構造 PDB 3KTQ）</small>', 'warn film-tag');
  ddTag.position.copy(ddPos).add(V(0, 1.2, 0));
  crySet.add(ddTag);

  // ---------------------------------------------------------------- molecular set: template, primer, polymerase, dNTPs
  const molSet = mkSet('mol');
  const D = new AtomicDNA(FULL);
  D.position.x = -D.length / 2;
  D.showLetters(1.85);
  molSet.add(D);
  const pol = await loadFilmMolecule('3KTQ');
  pol.setOpacity('dna', 0);
  pol.setOpacity('ddntp', 0);
  molSet.add(pol.root);
  const site = yUp(pol.meta.landmarks.ddntp!);
  const seatPol = (k: number, lift = V(0, 0, 0)) =>
    place(pol.root, seatOnDna(pol, D, k, { flip: true, along: site.x, lift }));

  const nt0 = (k: number) => D.nt(0, k);
  const incoming: Record<number, FreeNucleotide> = {};
  for (const k of [4, 5, 6, 7, 8, 9]) {
    incoming[k] = new FreeNucleotide(D, nt0(k), { dideoxy: k === 8 });
    D.add(incoming[k]);
  }
  // free dNTPs for the "ingredients" shot: one of each base
  const showcase: Record<string, FreeNucleotide> = { A: new FreeNucleotide(D, nt0(4)), T: new FreeNucleotide(D, nt0(5)), G: new FreeNucleotide(D, nt0(6)), C: new FreeNucleotide(D, nt0(8)) };
  for (const f of Object.values(showcase)) D.add(f);

  // markers draw on top of the atoms so the 3'-OH / 3'-H can always be seen
  const ohGlow = glowBall('#ff4040', 0.2, 1.8, true);
  const bondGlow = glowBall('#ffe08a', 0.18, 1.6, true);
  const hGlow = glowBall('#ffffff', 0.12, 1.4, true);
  const xGlow = glowBall('#ff2d55', 0.18, 1.6);
  D.add(ohGlow, bondGlow, hGlow, xGlow);
  const tCross = stage.label('✕', 'film-tag cross');
  D.add(tCross);
  const tWidth = stage.label('<b>幅 2 nm</b><small>髪の毛の約4万分の1</small>', 'film-tag');
  D.add(tWidth);

  const tag = (html: string, cls = 'film-tag') => { const t = stage.label(html, cls); D.add(t); return t; };
  const tTemplate = tag('<b>鋳型（一本鎖）</b><small>3′-CGTATACAGTCAGGTC-5′</small>');
  const tPrimer = tag('<b>プライマー</b><small>5′-GCAT-3′</small>', 'film-tag warm');
  const tPol = stage.label('<b>DNAポリメラーゼ</b><small>Taq（好熱菌）・実構造 PDB 3KTQ</small>', 'film-tag');
  molSet.add(tPol);
  const tOH = tag('<b>3′-OH</b>', 'film-tag hot');
  const tH = tag('<b>3′-H</b><small>OH がない</small>', 'film-tag hot');
  const tPPi = tag('<b>ピロリン酸</b><small>（リン酸2つ）が外れる</small>');
  const tIncoming = tag('');
  const tTplBase = tag('<b>鋳型の T</b>', 'film-tag');
  const tShow: Record<string, THREE.Object3D> = {};
  for (const b of BASES) tShow[b] = tag(`<b style="color:${BASE_COLOR[b]}">d${b}TP</b>`);

  const atomP = (nt: Nt, name: string) => D.atomPos(D.atomIndex(nt, name));

  // ---------------------------------------------------------------- schematic sets (tubes, gel, capillary)
  const kit = await loadGlb('kit.glb');
  const tubeSrc = kit.getObjectByName('tube')!;
  const mkTube = () => {
    const t = tubeSrc.clone(true);
    t.position.set(0, 0, 0);
    t.rotation.set(0, 0, 0);
    const liq = t.getObjectByName('tube_liquid') as THREE.Mesh;
    liq.material = (liq.material as THREE.Material).clone();
    return t;
  };

  const tubeSet = mkSet('tubes');
  const bigTube = mkTube();
  bigTube.scale.setScalar(2.4);
  tubeSet.add(bigTube);
  {
    const lm = (bigTube.getObjectByName('tube_liquid') as THREE.Mesh).material as THREE.MeshStandardMaterial;
    lm.color = new THREE.Color('#6fb3ff');
    lm.opacity = 0.28;
    lm.depthWrite = false;
  }
  // swarm inside the liquid: templates (grey rods), dNTPs (4 colours) and a few ddATP (glowing)
  const swarmRod = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6), new THREE.MeshStandardMaterial({ color: '#d0d6e0', roughness: 0.4 }), 140);
  const swarmDot = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.4 }), 360);
  const swarmDd = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 10, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(DYE.A).multiplyScalar(2.6), toneMapped: false }), 14);
  for (let i = 0; i < 360; i++) swarmDot.setColorAt(i, new THREE.Color(BASE_COLOR[BASES[i % 4]]));
  tubeSet.add(swarmRod, swarmDot, swarmDd);
  const inLiquid = (i: number, t: number, seed: number) => {
    const w = wander(i * 1.37 + seed, t * 0.6, 1);
    const u = ((i * 0.618 + seed) % 1), v = ((i * 0.381 + seed * 0.7) % 1);
    const y = mix(-4.4, -1.4, v) + w.y * 0.25;
    const rMax = y < -3.2 ? 0.25 + (y + 4.4) * 0.6 : 0.95;
    const r = rMax * Math.sqrt(u) * 0.9;
    const a = i * 2.399 + w.x * 0.5;
    return V(Math.cos(a) * r, y, Math.sin(a) * r);
  };
  const tubeTag = stage.label('', 'film-tag');
  tubeSet.add(tubeTag);

  // rows of copies stopped by ddATP
  const rowsSet = mkSet('rows');
  const U = 0.62; // spacing per base in the schematic
  const STOPS_A = fragments('A').map((f) => f.length); // 1, 6, 11
  const rowStops = [1, 6, 11, 6, 1, 11, 6, 1];
  const rowGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 10);
  rowGeo.rotateZ(Math.PI / 2);
  const beadGeo = new THREE.SphereGeometry(0.21, 18, 12);
  const matCache = new Map<string, THREE.Material>();
  const matOf = (c: string, glow = false) => {
    const k = c + glow;
    if (!matCache.has(k)) matCache.set(k, glow ? new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.4), toneMapped: false })
      : new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
    return matCache.get(k)!;
  };
  const rowY = (r: number) => (rowStops.length / 2 - r - 0.5) * 0.98;
  const x0 = -((PRIMER.length + NEW_STRAND.length) * U) / 2;
  const rows: { beads: THREE.Mesh[]; labels: THREE.Object3D[] }[] = [];
  rowStops.forEach((stop, r) => {
    const y = rowY(r);
    const tpl = new THREE.Mesh(rowGeo, matOf('#7c8597'));
    tpl.scale.x = FULL.length * U;
    tpl.position.set(x0 + (FULL.length - 1) * U / 2, y - 0.3, 0);
    rowsSet.add(tpl);
    const beads: THREE.Mesh[] = [];
    const labels: THREE.Object3D[] = [];
    for (let i = 0; i < PRIMER.length + stop; i++) {
      const isPrimer = i < PRIMER.length;
      const b = FULL[i];
      const last = i === PRIMER.length + stop - 1;
      const m = new THREE.Mesh(beadGeo, isPrimer ? matOf('#f59f00') : last ? matOf(DYE.A, true) : matOf(BASE_COLOR[b]));
      if (last) m.scale.setScalar(1.25);
      m.position.set(x0 + i * U, y + 0.12, 0);
      rowsSet.add(m);
      beads.push(m);
      const l = stage.label(b, 'film-letter');
      l.position.copy(m.position).add(V(0, 0.48, 0));
      rowsSet.add(l);
      labels.push(l);
    }
    rows.push({ beads, labels });
  });
  // template letters along the top
  const tplLetters: THREE.Object3D[] = [];
  [...TEMPLATE_3to5].forEach((b, i) => {
    const l = stage.label(b, 'film-letter dim');
    l.position.set(x0 + i * U, rowY(0) + 1.2, 0);
    rowsSet.add(l);
    tplLetters.push(l);
  });
  const rowsTag = stage.label('<b>鋳型</b> 3′→5′<small>1つの玉＝1塩基</small>', 'film-tag');
  rowsTag.position.set(x0 + FULL.length * U + 1.6, rowY(0) + 1.2, 0);
  rowsSet.add(rowsTag);
  const lenTags = rowStops.map((stop, r) => {
    const l = stage.label(`${stop}塩基で停止`, 'film-tag good');
    l.position.set(x0 + (PRIMER.length + 11) * U + 1.2, rowY(r) + 0.1, 0);
    rowsSet.add(l);
    return l;
  });

  // four tubes summary
  const fourSet = mkSet('four');
  BASES.forEach((b, i) => {
    const t = mkTube();
    t.scale.setScalar(1.25);
    t.position.set((i - 1.5) * 3.4, -1.2, 0);
    ((t.getObjectByName('tube_liquid') as THREE.Mesh).material as THREE.MeshStandardMaterial).color = new THREE.Color(DYE[b]);
    fourSet.add(t);
    const l = stage.label(`<b>${dd(b)}</b><small>止まった長さ：${fragments(b).map((f) => f.length).join('・')}</small>`, 'film-tag');
    l.position.set(t.position.x, -4.2, 0);
    fourSet.add(l);
    // stacked bars above each tube: one bar per fragment length
    fragments(b).forEach((f, j) => {
      const bar = new THREE.Mesh(rowGeo, matOf(DYE[b], true));
      bar.scale.set((PRIMER.length + f.length) * 0.16, 1.4, 1.4);
      bar.position.set(t.position.x - 1.2 + bar.scale.x / 2, 1.6 + j * 0.45, 0);
      fourSet.add(bar);
    });
  });

  // gel
  const gelSet = mkSet('gel');
  const GEL_H = 14;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(13, GEL_H, 0.6),
    new THREE.MeshPhysicalMaterial({ color: '#3a4a66', roughness: 0.3, transmission: 0.35, transparent: true, opacity: 0.62, thickness: 0.6 }));
  gelSet.add(slab);
  const laneX = (i: number) => (i - 1.5) * 2.7 - 0.8;
  BASES.forEach((b, i) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.32, 0.66), new THREE.MeshStandardMaterial({ color: '#141a28' }));
    w.position.set(laneX(i), GEL_H / 2 - 0.55, 0.01);
    gelSet.add(w);
    const l = stage.label(`<b>${dd(b)}</b>`, 'film-tag');
    l.position.set(laneX(i), GEL_H / 2 + 0.7, 0);
    gelSet.add(l);
  });
  const minus = stage.label('<b>－ 極</b>', 'film-tag');
  minus.position.set(-7.6, GEL_H / 2 - 0.6, 0);
  const plus = stage.label('<b>＋ 極</b>', 'film-tag hot');
  plus.position.set(-7.6, -GEL_H / 2 + 0.6, 0);
  gelSet.add(minus, plus);
  const travel = (len: number) => (GEL_H - 1.8) * (1 - (len - 1) / NEW_STRAND.length) * 0.94;
  const bandsAll = BASES.flatMap((b, i) => fragments(b).map((f) => ({ f, lane: i })));
  const bands = bandsAll.map(({ f, lane }) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.26, 0.66), new THREE.MeshStandardMaterial({ color: '#ff3d8b', emissive: '#ff3d8b', emissiveIntensity: 1.3 }));
    m.position.set(laneX(lane), GEL_H / 2 - 0.55, 0.02);
    gelSet.add(m);
    return { m, f, lane, to: GEL_H / 2 - 0.85 - travel(f.length) };
  }).sort((a, b) => a.f.length - b.f.length);
  const readLetters = bands.map(({ f, to }) => {
    const l = stage.label(f.base, 'film-letter big');
    l.position.set(5.4, to, 0.4);
    gelSet.add(l);
    return l;
  });
  const readArrow = stage.label('<b>↑ 下から読む</b>', 'film-tag good');
  readArrow.position.set(5.4, -GEL_H / 2 - 0.4, 0.4);
  gelSet.add(readArrow);
  const shortTag = stage.label('<b>短い</b><small>速く進む</small>', 'film-tag');
  shortTag.position.set(-7.6, -2.2, 0);
  const longTag = stage.label('<b>長い</b><small>ゆっくり</small>', 'film-tag');
  longTag.position.set(-7.6, 3.6, 0);
  gelSet.add(shortTag, longTag);

  // capillary
  const capSet = mkSet('capillary');
  const CAP_L = 26;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, CAP_L, 40, 1, true),
    new THREE.MeshPhysicalMaterial({ color: '#d8e8ff', roughness: 0.08, transmission: 0.85, transparent: true, opacity: 0.32, side: THREE.DoubleSide }));
  glass.rotation.z = Math.PI / 2;
  capSet.add(glass);
  const detX = CAP_L / 2 - 4;
  const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 7, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#9ec5ff').multiplyScalar(3), toneMapped: false }));
  laser.position.set(detX, 2.6, 0);
  capSet.add(laser);
  const detTag = stage.label('<b>レーザー・検出器</b><small>通過した断片の色を記録</small>', 'film-tag');
  detTag.position.set(detX, 6.4, 0);
  capSet.add(detTag);
  const capFrags = BASES.flatMap((b) => fragments(b)).sort((a, b) => a.length - b.length);
  const capBeads = capFrags.map((f) => {
    const g = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12), matOf(DYE[f.base], true));
    const tail = new THREE.Mesh(rowGeo, matOf('#c9d1dd'));
    tail.scale.x = (PRIMER.length + f.length) * 0.12;
    tail.position.x = -tail.scale.x / 2 - 0.25;
    g.add(head, tail);
    capSet.add(g);
    return g;
  });
  const capSpeed = (len: number) => 1 / (0.75 + 0.16 * len);
  const capFlash = glowBall('#ffffff', 0.6);
  capFlash.position.set(detX, 0, 0);
  capSet.add(capFlash);

  // ================================================================ per-frame update
  const camKeysMol: [number, Cam][] = [];
  const wD = (p: THREE.Vector3) => D.localToWorld(p.clone());

  function resetMol() {
    D.each(() => true, (nt) => { nt.scale = 1; nt.offset.set(0, 0, 0); nt.tint = null; nt.tintAmount = 0; });
    D.atomScale.fill(1);
    D.tint(() => true, null);
    for (const f of [...Object.values(incoming), ...Object.values(showcase)]) { f.visible = false; f.body.visible = true; f.ppi.position.set(0, 0, 0); f.ppi.scale.setScalar(1); f.scale.setScalar(1); }
    for (const g of [ohGlow, bondGlow, hGlow, xGlow]) setGlow(g, 0);
    for (const t of [tTemplate, tPrimer, tOH, tH, tPPi, tIncoming, tTplBase, tPol, tCross, tWidth, ...Object.values(tShow)]) t.visible = false;
  }

  function updateMol(t: number) {
    resetMol();
    // letters: template from c04, new strand from c05; hidden in the atom close-ups (c08–c16)
    const closeUp = t > T('c08') + 0.8 && t < E('c16');
    D.letterFilter = (nt) => !closeUp && (nt.strand === 1 ? t > T('c04') + 2.4 : t > T('c05'));
    // ---- strand 0: whole duplex (why) -> melts away (c04) -> primer returns (c05) -> grows as nucleotides join
    const melt = ramp(t, T('c04') + 0.6, 2.2);
    const primerIn = ramp(t, T('c05') + 0.4, 2.2);
    const away = V(0, 3.2, 1.5);
    for (let k = 0; k < D.n; k++) {
      const n0 = nt0(k);
      if (t < T('c04')) continue; // full duplex
      if (k < 4) {
        if (t < T('c05')) { n0.offset.copy(away).multiplyScalar(melt); n0.scale = 1 - melt; }
        else { n0.offset.copy(away).multiplyScalar(1 - primerIn); n0.scale = smooth(primerIn * 1.5); }
      } else if (melt < 1) {
        n0.offset.copy(away).multiplyScalar(melt);
        n0.scale = 1 - melt;
      } else {
        n0.scale = t >= joinTime(k) + 0.25 ? 1 : 0;
      }
    }
    if (t >= T('c05')) D.tint((nt) => nt.strand === 0 && nt.k < 4, '#f59f00', 0.55);
    if (t > T('c04') + 2.4 && t < T('c08')) {
      tTemplate.visible = true;
      tTemplate.position.set(D.x(13), -2.6, 0);
    }
    if (t > T('c05') + 1.5 && t < T('c08')) {
      tPrimer.visible = true;
      tPrimer.position.set(D.x(1.5), 3.3, 0);
    }

    // ---- polymerase: arrives in c06, ghosted for the chemistry, leaves at the stop
    // the position the enzyme works on: 4, then one step on after every join
    const kAct = 4 + [4, 5, 6, 7, 8].reduce((n, k) => n + smooth((t - joinTime(k) - 0.25) / 0.6), 0);
    const polIn = ramp(t, T('c06') + 0.3, 2.6);
    const polOut = ramp(t, T('c16') + 0.8, 2.4);
    pol.root.visible = t >= T('c06');
    if (pol.root.visible) {
      seatPol(kAct, V(0, 9 * (1 - polIn) + 10 * polOut, 0));
      // faded right out for the chemistry close-ups (a note says so), back for the stop
      const ghost = 1 - ramp(t, T('c08') + 1.2, 1.2);
      const back = mix(ghost, 0.85, ramp(t, T('c16') - 0.4, 0.8));
      pol.setOpacity('protein', back * (1 - polOut));
      tPol.visible = t > T('c06') + 2.2 && t < T('c08');
      tPol.position.copy(wD(V(D.x(5), 0, 0))).add(V(0, 5.4, 0));
    }

    // ---- c07: one of each dNTP drifting around the scene
    if (t >= T('c07') - 0.2 && t < T('c08') + 1) {
      const a = window01(t, T('c07'), T('c08') + 0.2, 0.6);
      BASES.forEach((b, i) => {
        const f = showcase[b];
        f.visible = a > 0.02;
        const home = V(-3.6 + i * 2.7, -1.9 + (i % 2) * 1.4, 3.6 + (i % 2) * 0.8).add(wander(i * 3.1, t, 0.35));
        f.pose(home.sub(f.centre), 0, t * 0.5 + i);
        f.scale.setScalar(Math.max(0.001, a));
        tShow[b].visible = a > 0.4;
        tShow[b].position.copy(f.position).add(V(0, 1.0, 0));
      });
    }

    // ---- nucleotides arriving and joining
    for (const k of [4, 5, 6, 7, 8, 9]) {
      const f = incoming[k];
      const tj = joinTime(k);
      const approachStart = k === 4 ? T('c08') + 0.2 : k === 8 ? T('c12') : k === 9 ? T('c15') + 4.2 : tj - 1.1;
      if (t < approachStart) continue;
      const far = k === 4 ? V(3.4, 3.6, 3.8) : k === 8 ? V(0.5, 2.2, 4.6) : k === 9 ? V(1.6, 2.6, 3.4) : V(2.2, 2.6, 2.2);
      let reach: number;
      if (k === 4) reach = t < T('c10') + 1.0 ? 0.78 * ramp(t, approachStart, T('c09') - approachStart) : mix(0.78, 1, ramp(t, T('c10') + 1.0, 1.1));
      else if (k === 8) reach = t < T('c15') ? 0.35 * ramp(t, approachStart, 2) : mix(0.35, 1, ramp(t, T('c15') + 0.3, 1.6));
      else if (k === 9) {
        // tries to join the ddC end and bounces off
        const bump = ramp(t, approachStart, 1.4) - ramp(t, approachStart + 1.9, 1.2) * 0.75;
        reach = 0.88 * bump;
      } else reach = ramp(t, approachStart, 1.0);
      f.visible = true;
      if (k !== 9 && t >= tj) {
        // joined: the body becomes part of the chain, the pyrophosphate drifts off
        const g = ramp(t, tj, 1.6);
        f.pose(far, 1);
        f.body.visible = t < tj + 0.25;
        f.ppi.position.set(0.6 * g, 1.6 * g, 1.2 * g);
        f.ppi.scale.setScalar(Math.max(0.001, 1 - ramp(t, tj + 1.2, 0.8)));
        if (k === 4 && t < tj + 2.2) {
          tPPi.visible = true;
          tPPi.position.copy(f.position).add(f.ppi.position).add(V(0, 1.0, 0));
        }
        if (t > tj + 2.2) f.visible = false;
      } else {
        f.pose(far, reach, k * 1.3 + t * 0.4);
      }
    }

    // incoming label + template base highlight (c08)
    if (t > T('c08') + 1.0 && t < T('c10') + 2.2) {
      const f = incoming[4];
      tIncoming.visible = true;
      tIncoming.element.innerHTML = `<b style="color:${BASE_COLOR.A}">dATP</b><small>鋳型 T と対になる A</small>`;
      tIncoming.position.copy(f.position).add(V(0.4, 1.4, 0));
      D.tint((nt) => nt.strand === 1 && nt.k === 4, '#ffffff', 0.55);
      tTplBase.visible = t < T('c09') + 1;
      tTplBase.position.copy(D.ntCenter(D.nt(1, 4))).add(V(0, -1.6, 0.4));
    }
    if (t > T('c12') + 0.6 && t < T('c15') + 2.2) {
      const f = incoming[8];
      tIncoming.visible = true;
      tIncoming.element.innerHTML = `<b style="color:#ff6b81">ddCTP</b><small>ジデオキシ：3′ に OH がない</small>`;
      tIncoming.position.copy(f.position).add(V(0.6, 1.5, 0));
    }

    // 3'-OH glow on the growing end
    const end = 3 + [4, 5, 6, 7].filter((k) => t >= joinTime(k) + 0.25).length;
    const ohOn = window01(t, T('c09') + 0.6, T('c12') - 0.3, 0.4);
    if (ohOn > 0) {
      const p = atomP(nt0(end), "O3'");
      setGlow(ohGlow, ohOn * (0.7 + 0.3 * Math.sin(t * 6)), 0.19);
      ohGlow.position.copy(p);
      tOH.visible = ohOn > 0.5;
      tOH.position.copy(p).add(V(0, 0.9, 0.5));
    }
    // the bond forming between 3'-O and the incoming alpha phosphate
    for (const k of [4, 5, 6, 7, 8]) {
      const tj = joinTime(k);
      const a = window01(t, tj - 0.15, tj + 0.35, 0.25);
      if (a > 0) {
        setGlow(bondGlow, a, 0.14 + 0.08 * a);
        bondGlow.position.copy(atomP(nt0(k - 1), "O3'")).lerp(incoming[k].position.clone().add(incoming[k].alphaP), 0.5);
      }
    }
    // the ddC end: its 3'-O is missing, a hydrogen sits on C3'
    if (t >= joinTime(8) + 0.25) {
      D.atomScale[D.atomIndex(nt0(8), "O3'")] = 0;
      const c3 = atomP(nt0(8), "C3'");
      const c2 = atomP(nt0(8), "C2'"), c4 = atomP(nt0(8), "C4'");
      const dir = c3.clone().sub(c2).add(c3.clone().sub(c4)).normalize();
      hGlow.position.copy(c3).addScaledVector(dir, 0.13);
      setGlow(hGlow, 0.85, 0.11);
      tH.visible = t < T('c16') + 3;
      tH.position.copy(c3).add(V(0, 1.0, 0.6));
    } else if (t >= T('c13') && t < T('c15') + 2) {
      // highlight the missing 3'-OH on the free ddCTP
      const f = incoming[8];
      const p = f.position.clone().add(f.tip.clone().applyQuaternion(f.quaternion));
      setGlow(hGlow, window01(t, T('c13') + 0.3, T('c15') + 1.8, 0.4), 0.13);
      hGlow.position.copy(p);
      tH.visible = true;
      tH.position.copy(p).add(V(0, 0.8, 0.4));
    }
    // the next dATP bounces: red cross flash at contact
    const tb = T('c15') + 5.6;
    const xa = window01(t, tb, tb + 0.6, 0.2);
    if (xa > 0) {
      setGlow(xGlow, xa, 0.16 + 0.06 * xa);
      xGlow.position.copy(atomP(nt0(8), "C3'")).add(V(0.25, 0.25, 0.2));
    }
    if (t > tb - 0.1 && t < tb + 2.4) {
      tCross.visible = true;
      tCross.position.copy(atomP(nt0(8), "C3'")).add(V(0.3, 0.9, 0.4));
    }
    // c01: how wide the helix is
    if (t > T('c01') + 1.2 && t < T('c02')) {
      tWidth.visible = true;
      tWidth.position.set(D.x(15) + 1.6, 0.4, 0);
    }
    if (t > T('c15') + 4 && t < T('c16') + 0.5) {
      tIncoming.visible = true;
      tIncoming.element.innerHTML = `<b style="color:${BASE_COLOR.A}">次の dATP</b><small>つなぐ相手（3′-OH）がない</small>`;
      tIncoming.position.copy(incoming[9].position).add(V(0.4, 1.4, 0));
    }
  }

  // when each nucleotide joins the chain
  function joinTime(k: number) {
    switch (k) {
      case 4: return T('c10') + 2.1;
      case 5: return T('c11') + 3.6;
      case 6: return T('c11') + 4.9;
      case 7: return T('c11') + 6.2;
      case 8: return T('c15') + 1.9;
      default: return Infinity;
    }
  }

  // ---- camera for the molecular set
  {
    const c04 = T('c04'), c08 = T('c08');
    camKeysMol.push(
      [T('c01'), { pos: V(0, 0.6, 11), target: V(0, -0.9, 0), aperture: 0.0002 }],
      [E('c01'), { pos: V(-4, 2.0, 7.5), target: V(0, -0.8, 0), aperture: 0.0004 }],
      [T('c03'), { pos: V(4.5, 0.8, 9.5), target: V(0, -1.0, 0), aperture: 0.0004 }],
      [c04, { pos: V(1.2, 1.2, 10), target: V(0.4, -0.8, 0) }],
      [T('c06'), { pos: V(2.2, 3.2, 13), target: V(0.4, 0.2, 0) }],
      [T('c07'), { pos: V(0, 1.2, 14), target: V(0, -1.2, 0.5) }],
      [c08, { pos: V(0, 1.2, 14), target: V(0, -1.2, 0.5) }],
    );
  }

  function camMol(t: number): Cam {
    // close-up keys depend on where atoms are, so they are computed on the fly
    if (t < T('c08') + 0.6) return camPath(camKeysMol, t);
    const tip = (k: number) => wD(atomP(nt0(k), "O3'"));
    const keys: [number, Cam][] = [
      [T('c08') + 0.6, camPath(camKeysMol, T('c08') + 0.6)],
      [T('c09'), { pos: tip(3).add(V(4.2, 1.6, 6.6)), target: tip(3).add(V(1.8, -0.4, 0.6)), aperture: 0.0010 }],
      [T('c10'), { pos: tip(3).add(V(3.4, 1.2, 5.4)), target: tip(3).add(V(1.8, -0.4, 0.4)), aperture: 0.0012 }],
      [T('c11') + 2.5, { pos: tip(3).add(V(4.0, 1.6, 6.4)), target: tip(4).add(V(1.4, -0.4, 0)), aperture: 0.0010 }],
      [T('c11') + 6.8, { pos: tip(6).add(V(3.4, 2.4, 8.4)), target: tip(6).add(V(0, -0.6, 0)), aperture: 0.0007 }],
      [T('c12') + 0.5, { pos: wD(V(D.x(8), 1.9, 3.2)).add(V(1.6, 0.9, 3.4)), target: wD(V(D.x(8), 1.7, 3.0)), aperture: 0.0014 }],
      [E('c13'), { pos: wD(V(D.x(8), 1.6, 2.9)).add(V(1.2, 0.7, 2.8)), target: wD(V(D.x(8), 1.5, 2.8)), aperture: 0.0016 }],
      [T('c15'), { pos: tip(7).add(V(3.0, 2.0, 7.0)), target: tip(7).add(V(0.4, -0.3, 0.3)), aperture: 0.0010 }],
      [T('c15') + 4.0, { pos: tip(7).add(V(3.8, 1.8, 6.4)), target: tip(7).add(V(1.7, -0.2, 0.4)), aperture: 0.0010 }],
      [T('c16'), { pos: tip(7).add(V(4.0, 3.0, 10)), target: tip(7).add(V(0, -0.8, 0)), aperture: 0.0008 }],
      [E('c16') + 1.2, { pos: V(-1, 3.0, 14), target: V(0, -0.6, 0), aperture: 0.0004 }],
    ];
    return camPath(keys, t);
  }

  // ---------------------------------------------------------------- the frame
  function show(k: string) { for (const [n, g] of Object.entries(sets)) g.visible = n === k; }

  function update(t: number) {
    ov.beginFrame();
    const sc = clock.timing.scenes.find((s) => t >= s.start && t < s.end) ?? clock.timing.scenes[clock.timing.scenes.length - 1];
    let cam: Cam;
    dust.visible = true;
    dust.rotation.y = t * 0.01;
    const inCrystalCut = t >= T('c14') - 0.3 && t < T('c15') - 0.2;
    if (sc.id === 'title' || sc.id === 'summary' || inCrystalCut) {
      show('crystal');
      const ang = t * 0.12 + (sc.id === 'summary' ? 2 : 0);
      const r = inCrystalCut ? 11 : sc.id === 'title' ? 15 : 19;
      crystal.setOpacity('protein', inCrystalCut ? 0.42 : 1);
      crystal.setOpacity('dna', 1);
      const pulse = inCrystalCut ? 0.75 + 0.25 * Math.sin(t * 5) : sc.id === 'title' ? 0.35 : 0;
      setGlow(ddGlow, pulse, 0.5);
      ddTag.visible = inCrystalCut && t > T('c14') + 2.5;
      const focus = inCrystalCut ? ddPos.clone() : V(0, 0, 0);
      cam = { pos: orbit(focus, r, inCrystalCut ? ang * 1.5 + 0.8 : ang, inCrystalCut ? 2.5 : 3), target: focus, aperture: inCrystalCut ? 0.0009 : 0.0004 };
      if (sc.id === 'summary' || sc.id === 'title') {
        // keep the molecule on the side opposite the text cards
        const right = new THREE.Vector3().subVectors(cam.target, cam.pos).cross(new THREE.Vector3(0, 1, 0)).normalize();
        cam.target = cam.target.clone().addScaledVector(right, sc.id === 'summary' ? -7.5 : -4.5);
        cam.pos = cam.pos.clone().addScaledVector(right, sc.id === 'summary' ? -7.5 : -4.5);
      }
    } else if (sc.id === 'tubes') {
      cam = updateTubes(t);
    } else if (sc.id === 'gel') {
      show('gel');
      cam = updateGel(t);
    } else if (sc.id === 'capillary') {
      show('capillary');
      cam = updateCap(t);
    } else {
      show('mol');
      updateMol(t);
      cam = camMol(t);
    }
    stage.camera.position.copy(cam.pos);
    stage.camera.lookAt(cam.target);
    stage.controls.target.copy(cam.target);
    stage.focusOn(cam.target, cam.aperture ?? 0.0006);
    overlays(t, sc.id);
    ov.endFrame();
  }

  // ---------------------------------------------------------------- tubes
  function updateTubes(t: number): Cam {
    const intoRows = ramp(t, T('c19') + 0.2, 1.4);
    const toFour = ramp(t, T('c22'), 1.0);
    if (toFour > 0.5) {
      show('four');
      return { pos: V(0, 0.2, 18 - 1.5 * smooth((t - T('c22')) / 8)), target: V(0, -0.9, 0), aperture: 0.0003 };
    }
    if (intoRows > 0.5) {
      show('rows');
      // copies grow base by base from the primer and stop at an A (ddATP)
      const g0 = T('c19') + 1.2;
      rows.forEach((row, r) => {
        row.beads.forEach((m, i) => {
          const at = g0 + (i - PRIMER.length) * 0.32 + r * 0.05;
          const on = i < PRIMER.length || t >= at;
          m.visible = on;
          row.labels[i].visible = on;
          if (on && i >= PRIMER.length) m.scale.setScalar((i === row.beads.length - 1 ? 1.25 : 1) * Math.min(1, 0.4 + (t - at) * 3));
        });
      });
      const groupHl = t > T('c20') + 1.0;
      lenTags.forEach((l, r) => (l.visible = groupHl && t > T('c20') + 1.0 + STOPS_A.indexOf(rowStops[r]) * 1.6));
      tplLetters.forEach((l) => (l.visible = true));
      return { pos: V(4.4, 0.1, 21 - 1.0 * smooth((t - T('c19')) / 14)), target: V(4.4, -0.4, 0), aperture: 0.0002 };
    }
    show('tubes');
    // swarm in the tube
    const m = new THREE.Matrix4();
    for (let i = 0; i < 140; i++) {
      const p = inLiquid(i, t, 0.1);
      m.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(t * 0.3 + i, i * 0.7, t * 0.2)), new THREE.Vector3(1, 1, 1));
      swarmRod.setMatrixAt(i, m);
    }
    const dots = t > T('c18') ? 360 : 0;
    for (let i = 0; i < 360; i++) {
      const p = inLiquid(i, t, 0.55);
      m.compose(p, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1).multiplyScalar(i < dots ? 1 : 1e-4));
      swarmDot.setMatrixAt(i, m);
    }
    for (let i = 0; i < 14; i++) {
      const p = inLiquid(i, t, 0.83);
      m.compose(p, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1).multiplyScalar(t > T('c18') + 1.5 ? 1 : 1e-4));
      swarmDd.setMatrixAt(i, m);
    }
    for (const im of [swarmRod, swarmDot, swarmDd]) im.instanceMatrix.needsUpdate = true;
    tubeTag.visible = true;
    tubeTag.element.innerHTML = t > T('c18') ? `<b>dNTP（たっぷり）</b>＋<b style="color:${DYE.A}">ddATP（ほんの少し）</b>` : '<b>同じ鋳型が何十億個</b>';
    tubeTag.position.set(0, 2.6, 0);
    const push = smooth((t - T('c17')) / (T('c19') - T('c17')));
    return { pos: V(0.6, 0.2 - push * 1.2, 17 - push * 8), target: V(0, -0.9 - push * 1.9, 0), aperture: 0.0004 + push * 0.0008 };
  }

  // ---------------------------------------------------------------- gel
  function updateGel(t: number): Cam {
    const run = ramp(t, T('c25') + 0.4, 3.4);
    bands.forEach((b) => {
      b.m.position.y = mix(GEL_H / 2 - 0.55, b.to, run);
      b.m.visible = t > T('c25');
      (b.m.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.3;
    });
    // reading from the bottom: c26 = 1st, c27 = 2nd, c28 sweeps all 12 with the voice
    const readIdx = (() => {
      if (t < T('c26') + 3.5) return -1;
      if (t < T('c27')) return 0;
      if (t < T('c28')) return 1;
      return Math.min(11, Math.floor((t - T('c28')) / (clock.dur('c28') / 12)));
    })();
    readLetters.forEach((l, i) => {
      l.visible = i <= (t >= E('c28') ? 11 : readIdx);
      l.element.classList.toggle('on', i === readIdx && t < E('c28'));
    });
    bands.forEach((b, i) => {
      const hot = i === readIdx && t < E('c28');
      (b.m.material as THREE.MeshStandardMaterial).emissive.set(hot ? '#ffffff' : '#ff3d8b');
      (b.m.material as THREE.MeshStandardMaterial).emissiveIntensity = hot ? 1.7 : 1.1;
    });
    readArrow.visible = t > T('c26');
    shortTag.visible = longTag.visible = t > T('c24') + 2 && t < T('c26');
    const focusY = readIdx >= 0 && t < E('c28') ? bands[readIdx].to : 0;
    const close = ramp(t, T('c26'), 1.2) * (1 - ramp(t, E('c28'), 1.0));
    return {
      pos: V(mix(0, 3, close), mix(-0.8, focusY * 0.7 - 1.0, close), mix(27, 16, close)),
      target: V(mix(0, 2.4, close), mix(-1.6, focusY * 0.8 - 1.4, close), 0),
      aperture: 0.0002,
    };
  }

  // ---------------------------------------------------------------- capillary
  function drawChrom(t: number) {
    const peaks: { t: number; b: string }[] = [];
    const t0 = T('c31') + 1.0;
    capFrags.forEach((f) => {
      const tt = t0 + (detX + CAP_L / 2) / (capSpeed(f.length) * 5.5);
      if (tt <= t) peaks.push({ t: tt, b: f.base });
    });
    return peaks;
  }
  function updateCap(t: number): Cam {
    const t0 = T('c31') + 1.0;
    let flash = 0;
    capBeads.forEach((g, i) => {
      const f = capFrags[i];
      const x = -CAP_L / 2 + Math.max(0, t - t0) * capSpeed(f.length) * 5.5;
      g.position.set(x, 0, 0);
      g.visible = t > T('c30') + 2 && x < CAP_L / 2;
      if (t <= t0) g.position.x = -CAP_L / 2 - 1.5 - i * 0.05;
      const d = Math.abs(x - detX);
      if (d < 0.5) flash = Math.max(flash, 1 - d / 0.5);
    });
    setGlow(capFlash, flash, 0.7);
    const zoom = smooth((t - T('c30')) / 6);
    return { pos: V(mix(-4, 4, zoom), -1.0, mix(24, 20, zoom)), target: V(mix(-2, 3, zoom), -3.4, 0), aperture: 0.0002 };
  }

  // ---------------------------------------------------------------- 2D overlays
  function overlays(t: number, scene: string) {
    const cue = clock.cueAt(t);
    if (cue && scene !== 'title') ov.set('sub', `<p>${cue.text}</p>`, 1, 'subtitle');
    const sc = clock.timing.scenes.find((s) => s.id === scene)!;
    if (scene !== 'title') ov.set('chip', sc.label, window01(t, sc.start, sc.end, 0.4), 'chip');

    if (scene === 'title') {
      const a = window01(t, 0.3, T('c00') + clock.dur('c00') + 0.6, 0.8);
      ov.set('title', `<p class="kicker">遺伝医学｜組換えDNA技術</p><h1>${clock.timing.title}</h1><p class="lead">${clock.timing.subtitle}</p><p class="src">講義資料 スライド28〜31</p>`, a, 'title-card');
    }
    if (scene === 'why') {
      ov.set('q', '<p class="big">A？ T？ G？ C？</p><p>文字は小さすぎて見えない</p>', window01(t, T('c02') - 0.4, T('c03'), 0.4), 'center-card');
      ov.set('idea', `<div class="idea"><div><b>① コピーを作らせる</b><span class="strand"><i class="p">GCAT</i><i>ATGTC</i><i class="g">…</i></span></div><div class="arrow">→</div><div><b>② わざと途中で止める</b><span class="strand"><i class="p">GCAT</i><i>ATGTC</i><i class="stop">■</i></span></div></div><p>止まった長さから、その位置の文字がわかる</p>`, window01(t, T('c03') + 0.6, T('c04') - 0.1, 0.5), 'center-card wide');
    }
    if (scene === 'extend') {
      const j = ramp(t, T('c10') + 2.1, 1.2); // the join of dATP (same moment as in 3D)
      ov.set('chem', chemSvg(j, false), window01(t, T('c09') + 0.8, E('c11') + 0.2, 0.5), 'side-card chem');
    }
    if (scene === 'stop' && t > T('c15') && t < T('c16')) {
      ov.set('chem2', chemSvg(ramp(t, T('c15') + 5.0, 0.8), true), window01(t, T('c15') + 1.0, T('c16'), 0.5), 'side-card chem');
    }
    if (scene === 'extend' || (scene === 'stop' && t < T('c16'))) {
      ov.set('ghost', '見やすくするため、ポリメラーゼを消しています', window01(t, T('c08') + 2.2, T('c16') - 0.5, 0.5), 'note-ghost');
    }
    if (scene === 'stop') {
      ov.set('compare', `<div class="cmp"><div><b>dNTP</b><span class="sugar">糖の 3′ ＝ <em class="ok">OH</em></span><small>次がつながる</small></div><div><b>ddNTP</b><span class="sugar">糖の 3′ ＝ <em class="ng">H</em></span><small>次がつながらない</small></div></div>`, window01(t, T('c13') + 0.5, T('c14') - 0.3, 0.5), 'side-card');
      ov.set('stamp', '<b>STOP</b><span>コピーはここで止まる</span>', window01(t, T('c16') + 0.3, E('c16') + 1.0, 0.3), 'stamp');
    }
    if (scene === 'tubes') {
      ov.set('chips', `<span class="dot" style="--c:#d0d6e0"></span>鋳型 <span class="dot" style="--c:${BASE_COLOR.G}"></span>dNTP <span class="dot glow" style="--c:${DYE.A}"></span>ddATP`, window01(t, T('c18') + 0.5, T('c19') + 0.6, 0.4), 'legend');
      const seq = [...NEW_STRAND].map((b, i) => `<i class="${b === 'A' ? 'hit' : ''}">${b}<sub>${i + 1}</sub></i>`).join('');
      ov.set('pos', `<p>新しい鎖（5′→3′）</p><p class="seq">${seq}</p><p><b style="color:${DYE.A}">A</b> は <b>1・6・11</b> 番目</p><p>↓</p><p>鎖の長さ <b>1・6・11</b></p>`, window01(t, T('c21') + 0.3, T('c22') - 0.1, 0.4), 'side-card pos');
    }
    if (scene === 'gel') {
      ov.set('charge', '<p>DNA（リン酸 PO₄⁻）は <b>マイナス</b> → <b>＋極</b>へ</p>', window01(t, T('c24') + 0.5, T('c25'), 0.4), 'top-note');
      const read = t >= T('c29') ? `<p class="mono">鋳型　 3′-CGTA<span class="dim">${TEMPLATE_3to5.slice(4)}</span>-5′</p><p class="mono">新しい鎖 5′-GCAT<b>${NEW_STRAND}</b>-3′</p>` : '';
      ov.set('align', read, window01(t, T('c29') + 0.3, E('c29') + 1.0, 0.4), 'bottom-card');
    }
    if (scene === 'capillary') {
      ov.set('legend', BASES.map((b) => `<span class="dot glow" style="--c:${DYE[b]}"></span>${dd(b)} → ${b}`).join(' '), window01(t, T('c30') + 0.8, E('c33'), 0.5), 'legend');
      const peaks = drawChrom(t);
      const tLast = Math.max(...capFrags.map((f) => T('c31') + 1.0 + (detX + CAP_L / 2) / (capSpeed(f.length) * 5.5)));
      ov.set('chrom', chromSvg(peaks, t, T('c31') + 1.0 + (detX + CAP_L / 2) / (capSpeed(1) * 5.5) - 0.8, tLast + 0.8), t > T('c31') + 1 ? 1 : 0, 'chrom');
    }
    if (scene === 'summary') {
      const card = (i: number, id: string, html: string) => ov.set('s' + i, `<span class="n">${i}</span><div>${html}</div>`, ramp(t, T(id) - 0.2, 0.6), `sum-card s${i}`);
      ov.set('sumh', '<h2>まとめ：サンガー法（ジデオキシ法）</h2>', ramp(t, T('c34') - 0.3, 0.6), 'sum-head');
      card(1, 'c35', '<b>ddNTP には 3′-OH がない</b><small>取り込まれた所でコピーが止まる</small>');
      card(2, 'c36', '<b>止まる場所は偶然 → あらゆる長さ</b><small>止まった長さ＝その位置の塩基</small>');
      card(3, 'c37', '<b>電気泳動で短い順に → 下から読む</b><small>4色蛍光なら1本のキャピラリーで読める</small>');
      ov.set('credit', '<small>分子：PDB 3KTQ（Taq DNAポリメラーゼ・DNA・ddCTP）／DNA：PDB 1BNA の原子座標から作成／配列：講義スライド29</small>', ramp(t, T('c38'), 0.8), 'credit');
    }
  }

  /**
   * The step in two dimensions: chain end (sugar with its 3'-OH) + incoming dNTP
   * (triphosphate). k: 0 apart -> 1 joined, pyrophosphate gone. blocked: the end
   * is a dideoxy sugar (3'-H) and the dNTP cannot join.
   */
  function chemSvg(k: number, blocked: boolean) {
    const sugar = (x: number, y: number, fill: string) => `<path d="M${x},${y - 34} L${x + 34},${y - 10} L${x + 22},${y + 28} L${x - 22},${y + 28} L${x - 34},${y - 10} Z" fill="${fill}" stroke="#cfd8e6" stroke-width="2"/>`;
    const P = (x: number, y: number, label: string) => `<circle cx="${x}" cy="${y}" r="17" fill="#ffa94d"/><text x="${x}" y="${y + 6}" text-anchor="middle" fill="#2b1600" font-size="16" font-weight="700">P</text><text x="${x}" y="${y + 36}" text-anchor="middle" fill="#ffc078" font-size="14" font-family="IPAGothic, sans-serif">${label}</text>`;
    const bx = 120, by = 150; // chain-end sugar
    const nx = blocked ? mix(450, 400, k) : mix(450, 330, k), ny = 150; // incoming sugar slides in
    const off = blocked ? 0 : k;
    const ppx = nx - 92 - 90 * off, ppy = by + 30 - 70 * off;
    const end = blocked
      ? `<text x="${bx - 20}" y="${by + 62}" fill="#ff7a8a" font-size="21" font-weight="700">3′-H</text><text x="${bx - 20}" y="${by + 84}" fill="#ff7a8a" font-size="15">OHがない</text>`
      : `<text x="${bx + 46}" y="${by + 52}" fill="#ff6b6b" font-size="21" font-weight="700">3′-OH</text>`;
    const bond = !blocked && k > 0.55 ? `<line x1="${bx + 56}" y1="${by + 42}" x2="${nx - 52}" y2="${ny + 30}" stroke="#ffe08a" stroke-width="6"/>` : '';
    const arrow = !blocked && k < 0.55 ? `<path d="M${bx + 70},${by + 40} Q${(bx + nx) / 2},${by + 110} ${nx - 66},${ny + 38}" fill="none" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="7 5" marker-end="url(#ah)"/>` : '';
    const cross = blocked && k > 0.3 ? `<text x="${(bx + nx) / 2 + 10}" y="${by + 70}" fill="#ff3b5c" font-size="56" font-weight="700" text-anchor="middle">✕</text>` : '';
    return `<svg viewBox="10 8 520 236" width="100%">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ff6b6b"/></marker></defs>
      <text x="20" y="30" fill="#aab6cc" font-size="17">伸びている鎖の末端</text>
      <text x="515" y="30" fill="#aab6cc" font-size="17" text-anchor="end">${blocked ? '次の dATP' : 'やってきた dATP'}</text>
      <line x1="40" y1="${by - 10}" x2="${bx - 34}" y2="${by - 10}" stroke="#cfd8e6" stroke-width="4"/>
      ${sugar(bx, by, blocked ? '#5c3a8a' : '#33507a')}<text x="${bx}" y="${by + 6}" text-anchor="middle" fill="#fff" font-size="17">糖</text>
      <rect x="${bx - 18}" y="${by - 92}" width="36" height="40" rx="6" fill="${blocked ? BASE_COLOR.C : BASE_COLOR.T}"/><text x="${bx}" y="${by - 64}" text-anchor="middle" fill="#04121f" font-size="20" font-weight="700">${blocked ? 'C' : 'T'}</text>
      ${end}${arrow}${bond}${cross}
      ${sugar(nx, ny, '#33507a')}<text x="${nx}" y="${ny + 6}" text-anchor="middle" fill="#fff" font-size="17">糖</text>
      <rect x="${nx - 18}" y="${ny - 92}" width="36" height="40" rx="6" fill="${BASE_COLOR.A}"/><text x="${nx}" y="${ny - 64}" text-anchor="middle" fill="#1d1600" font-size="20" font-weight="700">A</text>
      ${P(nx - 52, ny + 30, 'α')}
      <g opacity="${(1 - 0.85 * ramp(off, 0.6, 0.4)).toFixed(2)}">${P(ppx, ppy, 'β')}${P(ppx - 40, ppy + 4, 'γ')}
        ${off > 0.4 ? `<text x="${ppx - 20}" y="${ppy - 26}" text-anchor="middle" fill="#ffc078" font-size="16">ピロリン酸</text>` : ''}</g>
    </svg>`;
  }

  function chromSvg(peaks: { t: number; b: string }[], now: number, t0: number, t1: number) {
    const W = 1000, H = 190;
    const X = (tt: number) => 30 + ((tt - t0) / (t1 - t0)) * (W - 60);
    const lines = BASES.map((b) => {
      let d = '';
      for (let x = t0; x <= Math.min(now, t1); x += (t1 - t0) / 260) {
        let y = 0;
        for (const p of peaks) if (p.b === b) y += Math.exp(-((x - p.t) ** 2) / 0.05);
        d += `${d ? 'L' : 'M'}${X(x).toFixed(1)},${(H - 26 - y * (H - 70)).toFixed(1)}`;
      }
      return `<path d="${d}" fill="none" stroke="${DYE[b]}" stroke-width="3"/>`;
    }).join('');
    const letters = peaks.map((p) => `<text x="${X(p.t)}" y="26" fill="${DYE[p.b]}" text-anchor="middle">${p.b}</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" width="100%">${lines}${letters}</svg>`;
  }

  return { update };
}
