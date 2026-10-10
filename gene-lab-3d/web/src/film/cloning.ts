/**
 * 授業動画「プラスミドでクローニング」— every frame is a pure function of the film clock.
 *
 * Lecture slides 10-13: pUC18 (ori, Amp^r, lacZ with the multi-cloning site) is
 * opened with BamHI, the gene (cut with the same enzyme) goes in, ligase seals
 * it, E. coli takes it up (heat shock), ampicillin selects the transformants,
 * blue/white tells inserts apart, growth gives 2^30 cells, the plasmids are
 * purified; an expression vector makes the protein (GFP, PDB 1EMA).
 * The plasmid, cell and plate are schematic (as in the cloning lab).
 */
import * as THREE from 'three';
import type { Stage } from '../core/stage';
import { loadGlb, yUp } from '../core/molecule';
import {
  Clock, Overlays, V, applyCam, camPath, glowBall, loadFilmMolecule, makeDust, mix, orbit, ramp, sceneAt, setGlow, smooth,
  standardOverlays, summaryOverlays, wander, window01, type Cam,
} from './kit';

const R = 3.2; // plasmid ring radius in the kit
const MCS = 88; // degrees
const ORANGE = ['#f6b93b', '#e58e26'], RED = ['#ff5c6c', '#c9184a'];
const rad = THREE.MathUtils.degToRad;
const ring = (a: number, r = R) => V(Math.cos(rad(a)) * r, Math.sin(rad(a)) * r, 0);

/** twisted double strand along a circular arc (same look as the kit's plasmid) */
function dsArc(radius: number, a0: number, a1: number, colors = ORANGE, turns = 46) {
  const g = new THREE.Group();
  for (const [si, col] of colors.entries()) {
    const pts: THREE.Vector3[] = [];
    const n = Math.max(8, Math.round(Math.abs(a1 - a0) * 2.2));
    for (let i = 0; i <= n; i++) {
      const a = rad(a0 + ((a1 - a0) * i) / n);
      const tw = turns * a + si * Math.PI;
      const radial = V(Math.cos(a), Math.sin(a), 0);
      pts.push(radial.clone().multiplyScalar(radius).addScaledVector(radial, 0.13 * Math.cos(tw)).add(V(0, 0, 0.13 * Math.sin(tw))));
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.07, 6, false), new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 })));
  }
  return g;
}

export async function buildCloning(stage: Stage, clock: Clock, ov: Overlays) {
  const T = (id: string) => clock.at(id);
  const E = (id: string) => clock.end(id);
  const world = stage.world;
  stage.scene.background = new THREE.Color('#04060c');
  stage.scene.fog = new THREE.FogExp2('#04060c', 0.008);
  stage.setAoRadius(0.35);
  const dust = makeDust(700, 41);
  world.add(dust);
  const kit = await loadGlb('kit.glb');

  const sets: Record<string, THREE.Group> = {};
  const mkSet = (k: string) => { const g = new THREE.Group(); g.visible = false; world.add(g); sets[k] = g; return g; };
  const show = (k: string) => { for (const [n, g] of Object.entries(sets)) g.visible = n === k; };
  const glowMat = (c: string, p = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(p), toneMapped: false, transparent: true, depthWrite: false });
  const label = (parent: THREE.Object3D, html: string, cls = 'film-tag') => { const l = stage.label(html, cls); parent.add(l); return l; };

  // ================================================================ the plasmid (vector, insert, title, summary)
  const plSet = mkSet('plasmid');
  const plasmid = kit.getObjectByName('plasmid')!.clone(true);
  plasmid.position.set(0, 0, 0);
  plasmid.rotation.set(0, 0, 0);
  plSet.add(plasmid);
  const plDna = plasmid.getObjectByName('plasmid_dna')!;
  const plMcs = plasmid.getObjectByName('plasmid_mcs')!;
  const plGenes = plasmid.getObjectByName('plasmid_genes')!;
  const opened = dsArc(R, MCS + 12, MCS - 12 + 360);
  const R2 = R * 1.12;
  const recomb = new THREE.Group();
  recomb.add(dsArc(R2, MCS + 20, MCS - 20 + 360), dsArc(R2, MCS - 20, MCS + 20, RED));
  const insert = dsArc(R2, MCS - 20, MCS + 20, RED);
  plasmid.add(opened, recomb, insert);
  // highlight arcs for the parts
  const arc = (a0: number, a1: number, c: string) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.5, 10, 48, rad(a1 - a0)), glowMat(c, 1.6));
    m.rotation.z = rad(a0);
    plasmid.add(m);
    return m;
  };
  const hlOri = arc(255, 310, '#70a1ff'), hlAmp = arc(150, 228, '#ff6b81'), hlLac = arc(18, 112, '#7bed9f'), hlMcs = arc(84, 93, '#ffffff');
  const tCenter = label(plasmid, '<b>pUC18</b><small>2,686 塩基対（模式図）</small>');
  const tOri = label(plasmid, '<b style="color:#9cc0ff">ori</b><small>複製起点：菌の中で数百コピーに</small>');
  tOri.position.copy(ring(282, R + 2.0));
  const tAmp = label(plasmid, '<b style="color:#ff8fa0">Amp<sup>r</sup></b><small>アンピシリン耐性遺伝子</small>');
  tAmp.position.copy(ring(190, R + 2.3));
  const tLac = label(plasmid, '<b style="color:#9ff0b5">lacZ</b><small>β-ガラクトシダーゼ</small>');
  tLac.position.copy(ring(35, R + 2.0));
  const tMcs = label(plasmid, '<b>マルチクローニングサイト</b><small>EcoRI … BamHI … HindIII</small>', 'film-tag good');
  tMcs.position.copy(ring(MCS, R + 1.6));
  const tGene = label(plasmid, '<b style="color:#ff8fa0">入れたい遺伝子</b><small>BamHI で切り出した断片</small>');
  const tRec = label(plasmid, '<b>組換えプラスミド</b>', 'film-tag good');
  tRec.position.set(0, 0, 0);
  // BamHI (schematic marker), cut and seal flashes
  const bam = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ color: '#f4a259', roughness: 0.4, emissive: '#f4a259', emissiveIntensity: 0.4 }));
  plasmid.add(bam);
  const tBam = label(plasmid, '<b>BamHI</b><small>G↓GATCC</small>', 'film-tag warm');
  const fCut = glowBall('#ff8a8a', 0.6, 2.4), fEnds = [glowBall('#ffe066', 0.3, 2.2), glowBall('#ffe066', 0.3, 2.2)];
  const fSeal = [glowBall('#9dffcf', 0.5, 2.4), glowBall('#9dffcf', 0.5, 2.4)];
  plasmid.add(fCut, ...fEnds, ...fSeal);
  fEnds[0].position.copy(ring(MCS + 12));
  fEnds[1].position.copy(ring(MCS - 12));
  fCut.position.copy(ring(MCS));
  fSeal[0].position.copy(ring(MCS - 20, R2));
  fSeal[1].position.copy(ring(MCS + 20, R2));

  function updatePlasmid(t: number, scene: string) {
    const open = scene === 'insert' && t > T('g05') + 2.6 && t < T('g06') + 4.4;
    const done = (scene === 'insert' && t >= T('g06') + 4.4) || scene === 'title' || scene === 'summary';
    plDna.visible = plMcs.visible = !open && !done;
    opened.visible = open;
    recomb.visible = done;
    plGenes.scale.setScalar(done ? 1.12 : 1);
    // the insert flies in during g06
    const fly = ramp(t, T('g06') + 0.8, 3.4);
    insert.visible = scene === 'insert' && t > T('g06') && t < T('g06') + 4.4;
    insert.position.copy(ring(MCS, 6 * (1 - fly))).setZ(3 * (1 - fly));
    tGene.visible = insert.visible && fly < 0.8;
    tGene.position.copy(ring(MCS, R2 + 1.6 + 6 * (1 - fly)));
    // highlights
    const hl = (m: THREE.Mesh, a: number) => { (m.material as THREE.MeshBasicMaterial).opacity = a * (0.55 + 0.25 * Math.sin(t * 4)); m.visible = a > 0.01; };
    const vec = scene === 'vector';
    hl(hlOri, vec ? window01(t, T('g02') + 0.3, E('g04') + 1, 0.4) : 0);
    hl(hlAmp, vec ? window01(t, T('g03') + 0.2, E('g04') + 1, 0.4) : 0);
    hl(hlLac, vec ? window01(t, T('g04') + 4.0, E('g04') + 1, 0.4) : 0);
    hl(hlMcs, vec ? window01(t, T('g04') + 0.4, E('g04') + 1, 0.4) : 0);
    tOri.visible = vec && t > T('g02') + 0.6;
    tAmp.visible = vec && t > T('g03') + 0.5;
    tMcs.visible = vec && t > T('g04') + 0.8;
    tLac.visible = vec && t > T('g04') + 4.2;
    tCenter.visible = vec;
    // BamHI comes in and cuts
    const bIn = ramp(t, T('g05') + 0.4, 1.8), bOut = ramp(t, T('g05') + 3.0, 1.4);
    bam.visible = scene === 'insert' && t > T('g05') && bOut < 0.99;
    bam.position.copy(ring(MCS, R + 0.4 + 6 * (1 - bIn) + 6 * bOut)).setZ(2 * (1 - bIn));
    bam.rotation.set(t, t * 1.3, 0);
    tBam.visible = bam.visible;
    tBam.position.copy(bam.position).add(V(0, 1.0, 0));
    setGlow(fCut, scene === 'insert' ? window01(t, T('g05') + 2.2, T('g05') + 3.0, 0.2) : 0, 0.7);
    fEnds.forEach((f) => setGlow(f, open ? (0.6 + 0.4 * Math.sin(t * 5)) * (1 - fly) : 0, 0.3));
    fSeal.forEach((f, i) => setGlow(f, scene === 'insert' ? window01(t, T('g07') + 2.6 + i * 1.2, T('g07') + 3.4 + i * 1.2, 0.25) : 0, 0.35));
    tRec.visible = scene === 'insert' && t > T('g07') + 5.2;
  }

  // ================================================================ transformation: E. coli takes up the plasmid
  const cellSet = mkSet('cells');
  const ecoliSrc = kit.getObjectByName('ecoli')!;
  const mkCell = (s: number) => { const c = ecoliSrc.clone(true); c.rotation.set(0, 0, 0); c.scale.setScalar(s); return c; };
  Array.from({ length: 7 }, (_, i) => {
    const c = mkCell(i === 0 ? 3.2 : 2.2);
    c.position.copy(i === 0 ? V(0, 0, 0) : V(Math.cos(i * 1.05) * 13, Math.sin(i * 1.05) * 8, -4 + (i % 2) * 3));
    cellSet.add(c);
    return c;
  });
  const miniRing = () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 10, 36), new THREE.MeshStandardMaterial({ color: '#f6b93b', roughness: 0.35 })));
    const red = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 10, 12, 0.8), new THREE.MeshStandardMaterial({ color: '#ff5c6c', emissive: '#ff5c6c', emissiveIntensity: 0.4 }));
    g.add(red);
    return g;
  };
  const floaters = Array.from({ length: 16 }, (_, i) => { const r = miniRing(); r.userData.home = V(-9 + (i % 8) * 2.6, i < 8 ? 6.5 : -6.5, 2 + (i % 3)); cellSet.add(r); return r; });
  const heat = glowBall('#ff8a3d', 6, 0.6);
  heat.position.set(0, 0, -2);
  cellSet.add(heat);
  const tCell = label(cellSet, '<b>大腸菌</b><small>塩化カルシウム処理（コンピテントセル）</small>');
  tCell.position.set(0, 4.6, 0);
  const tIn = label(cellSet, '<b>プラスミドが入った！</b><small>ごく一部の菌だけ</small>', 'film-tag good');
  tIn.position.set(3.5, -3.2, 0);
  function updateCells(t: number): Cam {
    const take = ramp(t, T('g08') + 5.0, 2.2);
    floaters.forEach((f, i) => {
      const home = (f.userData.home as THREE.Vector3).clone().add(wander(i, t, 0.6));
      if (i === 3) f.position.copy(home).lerp(V(1.2, 0.3, 0.4), take);
      else f.position.copy(home);
      f.rotation.set(t * 0.5 + i, t * 0.3, i);
      f.scale.setScalar(i === 3 ? mix(1, 0.8, take) : 1);
    });
    heat.visible = false;
    tCell.visible = t < T('g08') + 4;
    tIn.visible = t > T('g08') + 7.5;
    const back = ramp(t, T('g09') + 0.5, 2.5);
    return { pos: V(0, 0.5 + 2 * back, mix(22, 36, back)), target: V(0, -0.6, 0), aperture: 0.0003 };
  }

  // ================================================================ the plate: selection and blue/white
  const dishSet = mkSet('dish');
  const dish = new THREE.Group();
  dishSet.add(dish);
  dish.add(new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.6, 64), new THREE.MeshStandardMaterial({ color: '#d9b26f', roughness: 0.6 })));
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(9.3, 9.3, 1.4, 64, 1, true), new THREE.MeshPhysicalMaterial({ color: '#e7f2ff', transparent: true, opacity: 0.25, roughness: 0.05, side: THREE.DoubleSide }));
  rim.position.y = 0.4;
  dish.add(rim);
  dish.rotation.x = 0.6;
  const rng = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  // kind: 0 no plasmid (dies), 1 empty vector (blue), 2 recombinant (white)
  const plated = Array.from({ length: 30 }, (_, i) => {
    const kind = i % 6 === 0 ? 2 : i % 6 === 3 ? (i % 4 === 3 ? 1 : 2) : i % 10 === 1 ? 1 : 0;
    const a = rng() * Math.PI * 2, r = 1.2 + rng() * 6.8;
    const c = mkCell(0.5);
    const pos = V(Math.cos(a) * r, 0.65, Math.sin(a) * r);
    c.position.copy(pos);
    c.rotation.y = rng() * Math.PI;
    dish.add(c);
    const colony = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f3f1e8', roughness: 0.55 }));
    colony.position.copy(pos).setY(0.3);
    dish.add(colony);
    return { kind, c, colony };
  });
  const tPlate = label(dishSet, '<b>アンピシリン入り寒天培地</b>');
  tPlate.position.set(0, 5.5, 0);
  function updateDish(t: number): Cam {
    const die = ramp(t, T('g11') + 2.5, 2.0);
    const grow = ramp(t, T('g12') + 0.5, 3.0);
    const blue = ramp(t, T('g12') + 6.0, 2.0);
    plated.forEach(({ kind, c, colony }) => {
      const s = kind === 0 ? 0.5 * (1 - die) : 0.5;
      c.visible = s > 0.005 && grow < 0.6;
      c.scale.setScalar(Math.max(0.001, s));
      colony.visible = kind > 0 && grow > 0.01;
      colony.scale.set(0.75 * grow, 0.35 * grow, 0.75 * grow);
      (colony.material as THREE.MeshStandardMaterial).color.set('#f3f1e8').lerp(new THREE.Color('#2f6fdc'), kind === 1 ? blue : 0);
    });
    tPlate.visible = t < T('g11') + 2;
    const close = ramp(t, T('g11'), 2.0);
    return { pos: V(0, mix(9, 6, close), mix(20, 15, close)), target: V(0, -1.2, 0), aperture: 0.0004 };
  }

  // ================================================================ growth and purification
  const growSet = mkSet('grow');
  const N = 700;
  const growCells = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.18, 0.5, 4, 10), new THREE.MeshStandardMaterial({ color: '#9ad0c2', roughness: 0.45, transparent: true }), N);
  growSet.add(growCells);
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.22, 0.06, 8, 20), new THREE.MeshStandardMaterial({ color: '#ffb86b', emissive: '#ff5c6c', emissiveIntensity: 0.5 }), 900);
  growSet.add(rings);
  const homes = Array.from({ length: N }, (_, i) => {
    const u = (i * 0.618034) % 1, v = (i * 0.414214) % 1, w = (i * 0.732051) % 1;
    const r = 7 * Math.cbrt(w), th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
    return V(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.7, r * Math.sin(ph) * Math.sin(th));
  });
  const gens = (t: number) => 30 * smooth((t - T('g13') - 1.0) / (clock.dur('g13') - 1.5));
  function updateGrow(t: number): Cam {
    const g = gens(t);
    const shown = Math.min(N, Math.floor(Math.pow(2, Math.min(g, 9.45))));
    const lyse = ramp(t, T('g14') + 3.0, 2.0);
    const m = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const on = i < shown;
      m.compose(homes[i].clone().multiplyScalar(Math.min(1, 0.35 + Math.log2(shown + 1) / 10)).add(wander(i, t, 0.08)),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(i, i * 0.7, i * 1.3)), V(1, 1, 1).multiplyScalar(on ? 1 - lyse : 1e-4));
      growCells.setMatrixAt(i, m);
    }
    growCells.instanceMatrix.needsUpdate = true;
    growCells.visible = lyse < 0.99;
    // plasmids freed from the lysed cells drift up
    const rel = ramp(t, T('g14') + 3.5, 3.0);
    for (let i = 0; i < 900; i++) {
      const p = homes[i % N].clone().multiplyScalar(1.05).add(V(0, rel * (1 + (i % 9) * 0.4), 0)).add(wander(i * 0.7, t, 0.3));
      m.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(i + t * 0.5, i * 0.7, 0)), V(1, 1, 1).multiplyScalar(rel > 0 ? Math.min(1, rel * 2) : 1e-4));
      rings.setMatrixAt(i, m);
    }
    rings.instanceMatrix.needsUpdate = true;
    return { pos: orbit(V(0, 0, 0), mix(14, 24, smooth((t - T('g13')) / 12)), t * 0.08, 3), target: V(0, 0, 0), aperture: 0.0003 };
  }

  // ================================================================ expression vector -> GFP
  const expSet = mkSet('express');
  const exPl = kit.getObjectByName('plasmid')!.clone(true);
  exPl.position.set(-9, 0, 0);
  exPl.rotation.set(0, 0, 0);
  exPl.scale.setScalar(0.9);
  expSet.add(exPl);
  const prom = new THREE.Mesh(new THREE.TorusGeometry(R, 0.5, 10, 24, rad(14)), glowMat('#59d8a1', 2));
  prom.rotation.z = rad(98);
  exPl.add(prom);
  const gfpArc = dsArc(R * 1.0, MCS - 14, MCS + 2, RED);
  exPl.add(gfpArc);
  const tProm = label(exPl, '<b style="color:#7ff0b8">強いプロモーター</b><small>→ GFP 遺伝子をどんどん読む</small>');
  tProm.position.copy(ring(105, R + 2.4));
  const gfp = await loadFilmMolecule('1EMA');
  const gBox = new THREE.Box3().setFromObject(gfp.root);
  const gC = gBox.getCenter(new THREE.Vector3());
  gfp.root.position.sub(gC);
  const gfpHolder = new THREE.Group();
  gfpHolder.add(gfp.root);
  gfpHolder.position.set(4, 0, 0);
  gfpHolder.scale.setScalar(1.3);
  expSet.add(gfpHolder);
  const chromo = glowBall('#3dff8a', 0.55, 2.6);
  chromo.position.copy(yUp(gfp.meta.landmarks.chromophore!).sub(gC));
  gfp.root.add(chromo);
  const tGfp = label(expSet, '<b style="color:#7dffb0">GFP</b><small>オワンクラゲ・実構造 PDB 1EMA</small>');
  tGfp.position.set(-0.5, -3.2, 0);
  const tChromo = label(expSet, '<b>発色団</b><small>βバレルの中心で光る</small>', 'film-tag good');
  const swarm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 11), new THREE.MeshStandardMaterial({ color: '#3dff8a', emissive: '#3dff8a', emissiveIntensity: 1.2 }), 160);
  expSet.add(swarm);
  function updateExpress(t: number): Cam {
    const made = ramp(t, T('g16') + 3.5, 5.0);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 160; i++) {
      const on = i / 160 < made;
      const p = V(-9, 0, 0).lerp(V(-4 + ((i * 0.618) % 1) * 16, -5 + ((i * 0.414) % 1) * 10, -6 + ((i * 0.732) % 1) * 6), on ? smooth(made * 3 - i / 60) : 0).add(wander(i, t, 0.3));
      m.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(i, t * 0.4 + i, 0)), V(1, 1, 1).multiplyScalar(on ? 1 - 0.999 * ramp(t, T('g17') - 0.5, 1.5) : 1e-4));
      swarm.setMatrixAt(i, m);
    }
    swarm.instanceMatrix.needsUpdate = true;
    gfpHolder.rotation.set(0.3, t * 0.3, 0);
    gfpHolder.visible = t > T('g17') - 0.5;
    const op = ramp(t, T('g17') + 2.5, 1.5);
    gfp.setOpacity('protein', 1 - 0.65 * op);
    setGlow(chromo, op * (0.75 + 0.25 * Math.sin(t * 4)), 0.55);
    tGfp.visible = t > T('g17') + 0.5;
    tChromo.visible = op > 0.6;
    tChromo.position.copy(gfpHolder.localToWorld(chromo.position.clone())).add(V(2.6, -1.6, 0));
    tProm.visible = t < T('g17');
    const k = ramp(t, T('g17') - 0.6, 2.0);
    return { pos: V(mix(-4, 3, k), 1.5, mix(26, 13, k)), target: V(mix(-3, 3.2, k), 0, 0), aperture: mix(0.0002, 0.0007, k) };
  }

  // ================================================================ frame
  function update(t: number) {
    ov.beginFrame();
    const sc = sceneAt(clock, t);
    let cam: Cam;
    dust.visible = true;
    dust.rotation.y = t * 0.01;
    if (sc.id === 'title' || sc.id === 'summary' || sc.id === 'vector' || sc.id === 'insert') {
      show('plasmid');
      updatePlasmid(t, sc.id);
      if (sc.id === 'title' || sc.id === 'summary') {
        plasmid.rotation.set(0.25, Math.sin(t * 0.3) * 0.55, 0);
        cam = { pos: V(-6, 1, 17), target: V(-6, 0, 0), aperture: 0.0003 };
        if (sc.id === 'summary') cam = { pos: V(-7, 1, 20), target: V(-7, 0, 0), aperture: 0.0003 };
      } else {
        plasmid.rotation.set(0, Math.sin(t * 0.2) * 0.15, 0);
        const keys: [number, Cam][] = [
          [T('g01'), { pos: V(0, 0, 22), target: V(0, 0, 0) }],
          [T('g02'), { pos: V(0, -1.6, 20), target: V(0, -1.6, 0) }],
          [T('g04'), { pos: V(0, -1.6, 19.5), target: V(0, -1.6, 0) }],
          [T('g05') + 1, { pos: V(0, 0.6, 15), target: V(0, 0.4, 0) }],
          [T('g07'), { pos: V(0, 0.2, 16), target: V(0, 0, 0) }],
          [E('g07'), { pos: V(0, -1, 18), target: V(0, -1, 0) }],
        ];
        cam = camPath(keys, t);
        cam.aperture = 0.0003;
      }
    } else if (sc.id === 'transform') {
      show('cells');
      cam = updateCells(t);
    } else if (sc.id === 'select') {
      show('dish');
      cam = updateDish(t);
    } else if (sc.id === 'grow') {
      show('grow');
      cam = updateGrow(t);
    } else {
      show('express');
      cam = updateExpress(t);
    }
    applyCam(stage, cam);
    overlays(t, sc.id);
    ov.endFrame();
  }

  // ================================================================ 2D overlays
  function overlays(t: number, scene: string) {
    standardOverlays(ov, clock, t, scene, '遺伝医学｜組換えDNA技術', '講義資料 スライド10〜13');
    if (scene === 'transform') {
      ov.set('heat', '<p>氷上 → <b style="color:#ff9a5a">42℃ 45秒</b> → 氷上</p><p class="dim">熱ショックで膜がゆらぎ、DNAが入り込む</p>', window01(t, T('g08') + 3.0, T('g09'), 0.4), 'top-card');
    }
    if (scene === 'select' && t > T('g12') + 5) {
      ov.set('bw', '<p><b class="w">白</b>＝遺伝子が入った（lacZ が壊れた）</p><p><b class="b">青</b>＝空のプラスミド（lacZ が働き X-gal を青く分解）</p>', window01(t, T('g12') + 6.5, E('g12') + 0.6, 0.4), 'top-card bw');
    }
    if (scene === 'grow') {
      const g = Math.floor(gens(t));
      const n = Math.pow(2, g);
      const txt = n >= 1e8 ? `約${(n / 1e8).toFixed(0)}億` : n >= 1e4 ? `約${(n / 1e4).toFixed(0)}万` : n.toLocaleString();
      ov.set('count', `<div><span>時間</span><b>${(g / 3).toFixed(1)} h</b></div><div><span>分裂</span><b>${g} 回</b></div><div><span>菌の数</span><b>${txt}</b></div>`, window01(t, T('g13') + 0.6, T('g14') + 2.5, 0.4), 'side-card counter');
    }
    if (scene === 'summary') {
      summaryOverlays(ov, clock, t, 'まとめ：プラスミドでクローニング', [
        ['g20', '<b>同じ制限酵素で切って、リガーゼでつなぐ</b><small>pUC18：ori・Amp<sup>r</sup>・lacZ の中のマルチクローニングサイト</small>'],
        ['g21', '<b>形質転換 → アンピシリンで選ぶ → 増やす</b><small>白いコロニーが組換え体（青白選択）・10時間で約10億倍</small>'],
        ['g22', '<b>発現ベクターでタンパク質を作らせる</b><small>GFP・インスリンなど</small>'],
      ], '分子：PDB 1EMA（GFP）／プラスミド・大腸菌・培地は模式図', 'g22');
    }
  }

  return { update };
}
