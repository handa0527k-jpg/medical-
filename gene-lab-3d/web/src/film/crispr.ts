/**
 * 授業動画「CRISPR-Cas9」— every frame is a pure function of the film clock.
 *
 * The target is the lecture's SpCas9 figure (slides 35-37): protospacer
 * GAGAACGGCGAAAACTAACT + PAM TGG inside a small reading frame (content/crispr.ts),
 * so the NHEJ frameshift and the HDR FLAG knock-in can be read off as protein.
 * Cas9 is the real Cas9–sgRNA–DNA structure (PDB 5F9R), seated on the atomic
 * DNA by its measured groove phase exactly as in the CRISPR lab.
 */
import * as THREE from 'three';
import type { Stage } from '../core/stage';
import { AtomicDNA, type Nt } from '../core/dna';
import { grooveAngleThree, loadGlb, yUp } from '../core/molecule';
import {
  Clock, Overlays, V, applyCam, camPath, glowBall, loadFilmMolecule, makeDust, mix, orbit, ramp, sceneAt, setGlow, smooth,
  standardOverlays, summaryOverlays, wander, window01, type Cam,
} from './kit';
import { FLAG, GENE, PROTOSPACER, SPACER_LEN, cutSite, hdr, nhej, pamAt, translate } from '../content/crispr';

const START = 5; // the protospacer's position in GENE (PAM TGG right after it)
const CUT = cutSite(START); // 22
const PAM_AT = START + SPACER_LEN; // 25
const ARM = 15;
const AT = CUT - (CUT % 3); // knock-in on a codon boundary next to the cut
const EDIT_NHEJ = nhej(GENE, CUT, 'del', 1).seq;
const EDIT_HDR = hdr(GENE, AT, FLAG);
const DONOR = GENE.slice(AT - ARM, AT) + FLAG + GENE.slice(AT, AT + ARM);
const EPI = 'ATGCC' + PROTOSPACER + 'TGG' + 'ACGCGTTCGACGCGATCGGCGCTACG';
const COL = { sg: '#4d8dff', pam: '#59d8a1', bad: '#ff6b81', flag: '#ffd166', methyl: '#ff4fd8' };

export async function buildCrispr(stage: Stage, clock: Clock, ov: Overlays) {
  const T = (id: string) => clock.at(id);
  const E = (id: string) => clock.end(id);
  const world = stage.world;
  stage.scene.background = new THREE.Color('#04060c');
  stage.scene.fog = new THREE.FogExp2('#04060c', 0.010);
  stage.setAoRadius(0.5);
  const dust = makeDust(900, 23);
  world.add(dust);

  const sets: Record<string, THREE.Group> = {};
  const mkSet = (k: string) => { const g = new THREE.Group(); g.visible = false; world.add(g); sets[k] = g; return g; };
  const show = (k: string) => { for (const [n, g] of Object.entries(sets)) g.visible = n === k; };
  const glowMat = (c: string, p = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(p), toneMapped: false, transparent: true });

  // ================================================================ crystal (title, parts, summary)
  const crySet = mkSet('crystal');
  const crystal = await loadFilmMolecule('5F9R');
  crySet.add(crystal.root);
  const cBox = new THREE.Box3().setFromObject(crystal.root);
  const cCenter = cBox.getCenter(new THREE.Vector3());
  crystal.root.position.sub(cCenter);
  const lm = (k: string) => yUp(crystal.meta.landmarks[k]!).sub(cCenter);
  const sgTag = stage.label('<b style="color:#8fb8ff">ガイドRNA（sgRNA）</b><small>先頭20塩基が目印・残りはCas9につかまる足場</small>', 'film-tag');
  sgTag.position.copy(lm('sgrna5')).add(V(-1.5, 3.2, 0));
  const casTag = stage.label('<b>Cas9 タンパク質</b><small>化膿レンサ球菌・実構造 PDB 5F9R</small>', 'film-tag');
  casTag.position.copy(lm('rec')).add(V(0, 2.0, 0));
  crySet.add(sgTag, casTag);

  // ================================================================ origin: a bacterium and phages
  const oriSet = mkSet('origin');
  const kit = await loadGlb('kit.glb');
  const cell = kit.getObjectByName('ecoli')!.clone(true);
  cell.position.set(0, 0, 0);
  cell.rotation.set(0, 0, 0);
  cell.scale.setScalar(4);
  oriSet.add(cell);
  const mkPhage = () => {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: '#c9d3e6', roughness: 0.35, metalness: 0.2 });
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), m);
    head.position.y = 1.2;
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 10), m);
    tail.position.y = 0.35;
    g.add(head, tail);
    for (let i = 0; i < 6; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 5), m);
      const a = (i / 6) * Math.PI * 2;
      leg.position.set(Math.cos(a) * 0.25, -0.35, Math.sin(a) * 0.25);
      leg.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
      g.add(leg);
    }
    oriSet.add(g);
    return g;
  };
  const phages = [mkPhage(), mkPhage()];
  // injected viral DNA: a red curve growing into the cell
  const vPts = Array.from({ length: 40 }, (_, i) => V(1.2 + Math.sin(i * 0.7) * 0.9 - i * 0.12, 3.6 - i * 0.09, Math.cos(i * 0.5) * 0.9));
  const vCurve = new THREE.CatmullRomCurve3(vPts);
  const vGeo = new THREE.TubeGeometry(vCurve, 200, 0.07, 6);
  const viral = [new THREE.Mesh(vGeo, glowMat('#ff4d5e', 1.6)), new THREE.Mesh(vGeo, glowMat('#ff4d5e', 1.6))];
  viral[1].position.x = -2.6;
  oriSet.add(...viral);
  const spacerGlow = glowBall('#ff4d5e', 0.3, 2.2);
  spacerGlow.position.set(-1.2, 0.3, 0.4);
  oriSet.add(spacerGlow);
  const spacerTag = stage.label('<b>ウイルスの断片を記録</b><small>CRISPR 領域（細菌のゲノム）</small>', 'film-tag hot');
  spacerTag.position.set(-1.2, -1.8, 0.4);
  const cutFlash = glowBall('#9ec5ff', 0.5, 2.6);
  oriSet.add(spacerTag, cutFlash);
  const casIcon = glowBall('#6ea8ff', 0.32, 2.0);
  const casIconTag = stage.label('<b>Cas9</b><small>RNAを目印に切る</small>', 'film-tag');
  oriSet.add(casIcon, casIconTag);

  // ================================================================ the gene + Cas9 (search, cut, repair)
  const genSet = mkSet('gene');
  const mkDna = (seq: string) => {
    const d = new AtomicDNA(seq);
    d.position.x = -((GENE.length - 1) * d.rise) / 2; // same origin for every version of the gene
    d.showLetters(1.85);
    genSet.add(d);
    return d;
  };
  const D = mkDna(GENE);
  const Dn = mkDna(EDIT_NHEJ);
  const Dh = mkDna(EDIT_HDR);
  const donor = new AtomicDNA(DONOR);
  donor.showLetters(1.85);
  genSet.add(donor);
  donor.tint((nt) => nt.k >= ARM && nt.k < ARM + FLAG.length, COL.flag, 0.65);
  donor.tint((nt) => nt.k < ARM || nt.k >= ARM + FLAG.length, '#9aa5b8', 0.35);
  Dh.tint((nt) => nt.k >= AT && nt.k < AT + FLAG.length, COL.flag, 0.6);
  const ox = D.position.x;
  const wx = (k: number) => ox + D.x(k); // world x of base pair k of the gene

  const cas = await loadFilmMolecule('5F9R');
  genSet.add(cas.root);
  const seatCas = (start: number, lift = 0) => {
    const c = cutSite(start);
    const kGroove = c - 0.5 + (cas.meta.grooveAt ?? 0) / D.rise;
    cas.root.rotation.set(D.groove(kGroove) - grooveAngleThree(cas.meta.groovePhase ?? 0), 0, 0);
    cas.root.position.set(wx(c - 0.5), lift, 0);
  };
  // sgRNA window and PAM ring (as in the lab)
  const cyl = new THREE.CylinderGeometry(1.45, 1.45, 1, 32, 1, true);
  cyl.rotateZ(Math.PI / 2);
  const winMat = new THREE.MeshStandardMaterial({ color: COL.sg, transparent: true, opacity: 0.2, depthWrite: false, emissive: '#2050c0', emissiveIntensity: 0.5 });
  const pamMat = new THREE.MeshStandardMaterial({ color: COL.bad, transparent: true, opacity: 0.3, depthWrite: false, emissive: COL.bad, emissiveIntensity: 0.6 });
  const win = new THREE.Mesh(cyl, winMat), pamRing = new THREE.Mesh(cyl, pamMat);
  win.renderOrder = pamRing.renderOrder = 5;
  genSet.add(win, pamRing);
  const tag = (html: string, cls = 'film-tag') => { const t = stage.label(html, cls); genSet.add(t); return t; };
  const tPam = tag('');
  const tCas = tag('<b>Cas9–sgRNA</b><small>DNAの上をすべって探す</small>');
  const tTarget = tag('<b style="color:#8fb8ff">sgRNA と標的鎖</b><small>20塩基が対合（R-loop）</small>');
  const tNon = tag('<b>非標的鎖</b><small>はじき出される</small>');
  const tHnh = tag('<b>HNH</b><small>標的鎖を切る</small>', 'film-tag hot');
  const tRuvc = tag('<b>RuvC</b><small>もう一方の鎖を切る</small>', 'film-tag warm');
  const tCut = tag('<b>二本鎖切断</b><small>PAMの3塩基手前・平滑末端</small>', 'film-tag hot');
  const tDel = tag('<b>1塩基欠失</b><small>NHEJ でつないだあと</small>', 'film-tag hot');
  const tDonor = tag('<b>ドナーDNA</b><small>相同アーム（灰）＋ FLAGタグ（黄）</small>');
  const tFlag = tag('<b style="color:#ffd166">FLAGタグ 24塩基</b><small>狙った位置に正確に</small>');
  const gHnh = glowBall('#ff6b6b', 0.5, 2.2), gRuvc = glowBall('#ff9f43', 0.5, 2.2), gCut = glowBall('#ffffff', 0.35, 2.0), gJoin = glowBall('#ff4d5e', 0.3, 2.0, true);
  genSet.add(gHnh, gRuvc, gCut, gJoin);

  // the window position over time: slides from the right, checks, stops at START
  const scanStart = (t: number) => {
    const a = T('k05') + 1.5, b = T('k07') - 0.6;
    if (t < a) return 30;
    if (t > b) return START;
    // stepwise: pause briefly on every base so the PAM ring can be read
    const u = (t - a) / (b - a);
    const s = mix(30, START, smooth(u));
    const f = Math.floor(s), fr = s - f;
    return f + smooth(fr * 1.6 - 0.3);
  };

  // which form of the gene shows, by time
  function updateGene(t: number, scene: string) {
    for (const d of [D, Dn, Dh]) {
      d.visible = false;
      d.each(() => true, (nt) => { nt.scale = 1; nt.offset.set(0, 0, 0); });
      d.letterFilter = (nt) => nt.strand === 0;
    }
    donor.visible = false;
    for (const x of [tPam, tCas, tTarget, tNon, tHnh, tRuvc, tCut, tDel, tDonor, tFlag]) x.visible = false;
    for (const g of [gHnh, gRuvc, gCut, gJoin]) setGlow(g, 0);
    win.visible = pamRing.visible = false;
    cas.root.visible = false;

    const gap = 1.8;
    if (scene === 'search' || scene === 'cut') {
      D.visible = true;
      const s = scanStart(t);
      const si = Math.round(s);
      const p = pamAt(GENE, si);
      D.tint(() => true, null);
      // window + PAM ring follow the scan until the R-loop forms
      const rl = ramp(t, T('k07') + 1.0, 3.0); // unwinding
      const ringOn = scene === 'search' && t > T('k05') + 0.8 && rl < 0.99;
      win.visible = pamRing.visible = ringOn;
      win.scale.x = SPACER_LEN * D.rise;
      win.position.set(wx(s - 0.5) + (SPACER_LEN * D.rise) / 2, 0, 0);
      pamRing.scale.x = 3 * D.rise;
      pamRing.position.set(wx(s - 0.5) + (SPACER_LEN + 1.5) * D.rise, 0, 0);
      pamMat.color.set(p.ok ? COL.pam : COL.bad);
      pamMat.emissive.set(p.ok ? COL.pam : COL.bad);
      winMat.opacity = 0.2 * (1 - rl);
      if (t > T('k06')) {
        tPam.visible = ringOn;
        tPam.element.className = 'tag film-tag ' + (p.ok ? 'good' : 'warn');
        tPam.element.innerHTML = `<b>${p.ok ? 'PAM ✓' : 'PAM ✕'}</b><small>${p.pam}${p.ok ? '（NGG）' : '（NGG ではない）'}</small>`;
        tPam.position.set(pamRing.position.x, 3.0, 0);
      }
      D.tint((nt) => nt.strand === 0 && nt.k >= si && nt.k < si + SPACER_LEN, '#7fb0ff', 0.3 * (1 - rl));
      D.tint((nt) => nt.k >= p.at && nt.k < p.at + 3, p.ok ? COL.pam : COL.bad, 0.5);
      // Cas9: rides the window, protein ghosted so the DNA stays visible
      const leave = ramp(t, T('k10') + 2.2, 2.2);
      cas.root.visible = t > T('k05') && leave < 0.99;
      if (cas.root.visible) {
        const drop = 1 - ramp(t, T('k05') - 0.2, 1.8);
        seatCas(s, 10 * drop + 12 * leave);
        cas.setOpacity('protein', mix(0.26, 0.2, rl) * (1 - leave));
        cas.setOpacity('sgrna', rl > 0.02 ? Math.min(1, rl * 1.4) * (1 - ramp(t, T('k10') + 0.4, 1.2)) : 0);
        cas.setOpacity('dna', rl > 0.02 ? Math.min(1, rl * 1.4) * (1 - ramp(t, T('k10') + 0.4, 1.2)) : 0);
        tCas.visible = t > T('k05') + 2 && t < T('k06');
        tCas.position.set(cas.root.position.x, 6.6, 0);
      }
      // the crystal's own R-loop replaces the procedural DNA where Cas9 has unwound it
      const restore = ramp(t, T('k10') + 0.4, 1.2);
      if (rl > 0) {
        const lo = START - 1, hi = PAM_AT + 5;
        D.each((nt) => nt.k >= lo && nt.k < hi, (nt) => {
          // unwinding runs from the PAM back toward the 5' end of the protospacer
          const u = (hi - nt.k) / (hi - lo);
          nt.scale = restore > 0 ? smooth(restore) : 1 - smooth((rl - u * 0.8) * 5);
        });
        D.letterFilter = (nt) => nt.strand === 0 && (nt.k < lo || nt.k >= hi || restore > 0.5);
      }
      tTarget.visible = t > T('k08') + 0.8 && t < T('k09');
      tTarget.position.set(wx(CUT - 8), -3.4, 2.0);
      tNon.visible = tTarget.visible;
      tNon.position.set(wx(CUT - 6), 3.6, -1.0);
      // the two nucleases
      if (scene === 'cut') {
        const hn = window01(t, T('k09') + 2.6, T('k10') + 0.6, 0.4), rv = window01(t, T('k09') + 4.6, T('k10') + 0.6, 0.4);
        const L = cas.meta.landmarks;
        if (L.hnh) { gHnh.position.copy(cas.root.localToWorld(yUp(L.hnh))); setGlow(gHnh, hn * (0.7 + 0.3 * Math.sin(t * 8)), 0.5); tHnh.visible = hn > 0.5; tHnh.position.copy(gHnh.position).add(V(-1.2, -1.6, 1)); }
        if (L.ruvc) { gRuvc.position.copy(cas.root.localToWorld(yUp(L.ruvc))); setGlow(gRuvc, rv * (0.7 + 0.3 * Math.sin(t * 8)), 0.5); tRuvc.visible = rv > 0.5; tRuvc.position.copy(gRuvc.position).add(V(1.2, 1.8, 1)); }
        // the break: right half moves apart once Cas9 lets go
        const open = ramp(t, T('k10') + 1.0, 1.4);
        D.each((nt) => nt.k >= CUT, (nt) => nt.offset.set(gap * open, 0, 0));
        setGlow(gCut, open * (0.6 + 0.4 * Math.sin(t * 5)), 0.35);
        gCut.position.set(wx(CUT - 0.5) + gap * open / 2, 0, 0);
        tCut.visible = open > 0.6;
        tCut.position.set(wx(CUT) + 0.9, -3.0, 0);
      }
    } else if (scene === 'nhej') {
      // ends rejoin (k12), the joined DNA lacks one base (k13)
      const close = ramp(t, T('k12') + 3.0, 1.8);
      const swap = t > T('k13') + 0.4;
      if (!swap) {
        D.visible = true;
        D.tint(() => true, null);
        D.tint((nt) => nt.k >= PAM_AT && nt.k < PAM_AT + 3, COL.pam, 0.4);
        D.each((nt) => nt.k >= CUT, (nt) => nt.offset.set(gap * (1 - close), 0, 0));
      } else {
        Dn.visible = true;
        Dn.tint(() => true, null);
        Dn.tint((nt) => nt.k === CUT - 1 || nt.k === CUT, COL.bad, 0.65);
        const p = Dn.ntCenter(Dn.nt(0, CUT)).add(Dn.position);
        setGlow(gJoin, window01(t, T('k13') + 0.5, T('k14') + 1.0, 0.4) * (0.7 + 0.3 * Math.sin(t * 6)), 0.32);
        gJoin.position.copy(p).add(V(-D.rise / 2, 0.3, 0));
        tDel.visible = t < T('k14') + 1.0;
        tDel.position.set(wx(CUT), 3.2, 0);
      }
    } else if (scene === 'hdr') {
      const fit = ramp(t, T('k17') + 0.5, 2.6);
      const swap = t > T('k17') + 3.4;
      if (!swap) {
        D.visible = true;
        D.tint(() => true, null);
        D.each((nt) => nt.k >= CUT, (nt) => nt.offset.set(gap, 0, 0));
        // the donor comes down and lines its arms up with the matching sequence
        donor.visible = true;
        const inK = ramp(t, T('k16') + 2.4, 2.0);
        donor.position.set(wx(AT - ARM), mix(14, 4.4, inK) - 4.4 * fit + wander(4, t, 0.2).y * (1 - fit), 0);
        donor.scale.setScalar(1);
        donor.letterFilter = (nt) => nt.strand === 0;
        donor.touch();
        tDonor.visible = inK > 0.6 && fit < 0.3;
        tDonor.position.set(donor.position.x + donor.x(DONOR.length / 2), donor.position.y + 2.8, 0);
        D.each(() => true, (nt) => (nt.scale = 1 - fit * 0.85));
      } else {
        Dh.visible = true;
        const a = window01(t, T('k17') + 3.6, E('k18') + 1, 0.5);
        tFlag.visible = a > 0.5;
        tFlag.position.set(wx(AT + FLAG.length / 2), 3.4, 0);
      }
    }
  }

  function camGene(t: number, scene: string): Cam {
    const keys: [number, Cam][] = [
      [T('k05'), { pos: V(4, 4, 30), target: V(0, -1.2, 0), aperture: 0.0002 }],
      [T('k06'), { pos: V(0, 2.4, 26), target: V(0, -0.8, 0), aperture: 0.0002 }],
      [T('k07'), { pos: V(-2, 2.6, 25), target: V(-2, -0.8, 0), aperture: 0.0003 }],
      [T('k08') + 0.5, { pos: V(wx(CUT) + 5, 3.5, 17), target: V(wx(CUT - 4), -0.6, 0), aperture: 0.0006 }],
      [T('k09'), { pos: V(wx(CUT) - 3, 2.5, 18), target: V(wx(CUT - 4), -0.6, 0), aperture: 0.0006 }],
      [T('k10'), { pos: V(wx(CUT) + 3, 3, 19), target: V(wx(CUT), -0.4, 0), aperture: 0.0005 }],
      [T('k11'), { pos: V(wx(CUT), 2.2, 20), target: V(wx(CUT), -1.2, 0), aperture: 0.0004 }],
      [E('k11'), { pos: V(0, 2, 26), target: V(0, -1.5, 0), aperture: 0.0002 }],
    ];
    if (scene === 'nhej') return { pos: V(mix(0, wx(CUT), ramp(t, T('k13'), 1.5)) + 2, 2, mix(26, 18, ramp(t, T('k13'), 1.5))), target: V(mix(0, wx(CUT), ramp(t, T('k13'), 1.5)) + 2, mix(-2.2, 1.2, ramp(t, T('k14'), 1.2)), 0), aperture: 0.0003 };
    if (scene === 'hdr') {
      const k = ramp(t, T('k17') + 3.2, 1.6);
      return { pos: V(mix(0, 3.5, k), mix(5, 2, k), mix(30, 34, k)), target: V(mix(0, 3.5, k), mix(1.0, -2.6, k) + 3.4 * ramp(t, T('k18'), 1.2), 0), aperture: 0.0002 };
    }
    return camPath(keys, t);
  }

  // ================================================================ epigenome editing: dCas9 + an effector
  const epiSet = mkSet('epi');
  const De = new AtomicDNA(EPI);
  De.position.x = -De.length / 2;
  epiSet.add(De);
  const dcas = await loadFilmMolecule('5F9R');
  dcas.setOpacity('dna', 0);
  epiSet.add(dcas.root);
  {
    const c = CUT;
    const kGroove = c - 0.5 + (dcas.meta.grooveAt ?? 0) / De.rise;
    dcas.root.rotation.set(De.groove(kGroove) - grooveAngleThree(dcas.meta.groovePhase ?? 0), 0, 0);
    dcas.root.position.set(De.position.x + De.x(c - 0.5), 0, 0);
  }
  dcas.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.name.endsWith('protein')) (m.material as THREE.MeshStandardMaterial).color.set('#b8bcc8');
  });
  // effector: a schematic globular enzyme on a flexible linker
  const effGeo = new THREE.IcosahedronGeometry(2.2, 4);
  {
    const p = effGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = V(p.getX(i), p.getY(i), p.getZ(i));
      const n = 1 + 0.08 * Math.sin(v.x * 3.1) * Math.sin(v.y * 2.7 + 1) + 0.06 * Math.sin(v.z * 4.3);
      v.multiplyScalar(n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    effGeo.computeVertexNormals();
  }
  const effMat = new THREE.MeshStandardMaterial({ color: '#b07cff', roughness: 0.5 });
  const eff = new THREE.Mesh(effGeo, effMat);
  epiSet.add(eff);
  const linker = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0, 0), V(1, 1.2, 0.5), V(2.4, 1.6, 0.2), V(3.6, 2.4, 0)]), 30, 0.12, 6), new THREE.MeshStandardMaterial({ color: '#d0c4ff' }));
  epiSet.add(linker);
  const effTag = stage.label('', 'film-tag');
  const dTag = stage.label('<b>dCas9</b><small>はさみを壊した Cas9（切らない）</small>', 'film-tag');
  epiSet.add(effTag, dTag);
  // CpG cytosines downstream of the target (both strands), where methyl groups sit on C5
  const cpg: Nt[] = [];
  for (let k = PAM_AT + 3; k < EPI.length - 1; k++) {
    if (EPI[k] === 'C' && EPI[k + 1] === 'G') { cpg.push(De.nt(0, k)); cpg.push(De.nt(1, k + 1)); }
  }
  const methyls = cpg.map((nt) => {
    const m = glowBall(COL.methyl, 0.3, 2.4);
    const i = De.atomIndex(nt, 'C5');
    const p = De.atomPos(i >= 0 ? i : nt.start);
    const c = De.ntCenter(nt, false);
    m.position.copy(p).add(p.clone().sub(c).setX(0).normalize().multiplyScalar(0.25)).add(De.position);
    epiSet.add(m);
    return m;
  });
  const mTag = stage.label('<b style="color:#ff8be6">メチル基 CH₃</b><small>CpG のシトシンに付く</small>', 'film-tag');
  epiSet.add(mTag);

  function updateEpi(t: number): Cam {
    const effP = dcas.root.position.clone().add(V(2.6, 5.6, 1.8)).add(wander(9, t, 0.25));
    eff.position.copy(effP);
    eff.rotation.set(t * 0.2, t * 0.3, 0);
    linker.position.copy(dcas.root.position).add(V(-1, 2.4, 1.2));
    const isTet = t > T('k21');
    const sw = ramp(t, T('k21'), 0.8);
    effMat.color.set(isTet ? '#5fd39b' : '#b07cff');
    eff.scale.setScalar(Math.max(0.001, 1 - 0.25 * Math.sin(Math.PI * sw)));
    eff.visible = t > T('k20') - 0.5;
    linker.visible = eff.visible;
    effTag.visible = eff.visible && t > T('k20') + 0.5;
    effTag.element.innerHTML = isTet ? '<b style="color:#7ff0b8">TET1</b><small>メチル基を外す（模式）</small>' : '<b style="color:#d4b5ff">DNMT3A / p300 など</b><small>メチル化・アセチル化する酵素（模式）</small>';
    effTag.position.copy(effP).add(V(0, 3.0, 0));
    dTag.visible = t < T('k20') + 0.5;
    dTag.position.copy(dcas.root.position).add(V(0, 6.6, 0));
    // methyls appear one by one with the DNMT effector, then come off with TET1
    const add = ramp(t, T('k20') + 4.0, 3.0), remove = ramp(t, T('k21') + 2.0, 3.0);
    methyls.forEach((m, i) => {
      const u = i / methyls.length;
      const on = smooth((add - u) * 6) * (1 - smooth((remove - u) * 6));
      setGlow(m, on, 0.3 * Math.max(0.01, on));
    });
    mTag.visible = add > 0.5 && remove < 0.3;
    mTag.position.copy(methyls[Math.floor(methyls.length / 2)].position).add(V(0, -3.0, 0));
    return { pos: V(2.5, 3, 30), target: V(2.5, 0.5, 0), aperture: 0.0002 };
  }

  // ================================================================ ethics: a tripronuclear zygote -> a mosaic embryo
  const ethSet = mkSet('ethics');
  const zona = new THREE.Mesh(new THREE.SphereGeometry(5.2, 48, 32), new THREE.MeshPhysicalMaterial({ color: '#e6eefc', roughness: 0.2, transmission: 0.6, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  const egg = new THREE.Mesh(new THREE.SphereGeometry(4.6, 48, 32), new THREE.MeshPhysicalMaterial({ color: '#f1d9c4', roughness: 0.5, transparent: true, opacity: 0.35, depthWrite: false }));
  ethSet.add(zona, egg);
  const pn = [V(-1.4, 0.6, 0.4), V(1.3, 0.8, -0.3), V(0, -1.3, 0.6)].map((p) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 20), new THREE.MeshStandardMaterial({ color: '#c7a37f', roughness: 0.5, transparent: true, opacity: 0.85 }));
    m.position.copy(p);
    ethSet.add(m);
    return m;
  });
  const blast = Array.from({ length: 8 }, (_, i) => {
    const edited = [0, 2, 3, 6].includes(i);
    const m = new THREE.Mesh(new THREE.SphereGeometry(1.9, 32, 20), new THREE.MeshStandardMaterial({ color: edited ? '#59d8a1' : '#a9b2c3', roughness: 0.45, transparent: true, opacity: 0.9 }));
    const a = (i / 8) * Math.PI * 2;
    m.userData.home = V(Math.cos(a) * 2.2, (i % 2 ? 1 : -1) * 1.2, Math.sin(a) * 2.2);
    ethSet.add(m);
    return m;
  });
  const pnTag = stage.label('<b>前核が3つ</b><small>正常には発生しない胚</small>', 'film-tag');
  const mosTag = stage.label('<b>モザイク</b><small>緑＝編集された細胞・灰＝されていない細胞</small>', 'film-tag');
  ethSet.add(pnTag, mosTag);

  function updateEthics(t: number): Cam {
    const div = ramp(t, T('k23') + 1.0, 2.0);
    pn.forEach((m) => { m.visible = div < 0.5; });
    blast.forEach((m) => { m.visible = div > 0.02; m.position.copy(m.userData.home).multiplyScalar(div); m.scale.setScalar(Math.max(0.001, div)); });
    egg.visible = div < 0.5;
    pnTag.visible = t > T('k22') + 2.5 && div < 0.3;
    pnTag.position.set(0, 2.6, 0);
    mosTag.visible = div > 0.8;
    mosTag.position.set(0, 4.8, 0);
    const cam = { pos: orbit(V(0, 0, 0), 21, t * 0.12, 3), target: V(0, 0, 0), aperture: 0.0003 };
    const right = new THREE.Vector3().subVectors(cam.target, cam.pos).cross(new THREE.Vector3(0, 1, 0)).normalize();
    cam.target.addScaledVector(right, 7);
    cam.pos.addScaledVector(right, 7);
    return cam;
  }

  // ================================================================ origin
  function updateOrigin(t: number): Cam {
    const land = (i: number, at: number) => {
      const k = ramp(t, at, 2.2);
      const pos = (i === 0 ? V(1.2, 4.5, 0) : V(-1.4, 4.5, 0)).add(V(3 * (1 - k), 7 * (1 - k), 2 * (1 - k)));
      phages[i].position.copy(pos);
      phages[i].rotation.set(0, t * 0.4, (1 - k) * 0.5);
      phages[i].visible = t > at - 0.5;
    };
    land(0, T('k01') + 0.8);
    land(1, T('k02') + 0.4);
    const inj0 = ramp(t, T('k01') + 3.2, 2.0), inj1 = ramp(t, T('k02') + 2.8, 1.8);
    viral[0].geometry.setDrawRange(0, Math.floor(vGeo.index!.count * inj0 / 6) * 6);
    viral[0].visible = inj0 > 0 && t < T('k02');
    viral[1].geometry = vGeo;
    viral[1].visible = inj1 > 0;
    const chop = ramp(t, T('k02') + 6.4, 0.8);
    viral[1].scale.setScalar(1);
    (viral[1].material as THREE.MeshBasicMaterial).opacity = 1 - 0.8 * chop;
    const sp = window01(t, T('k01') + 6.0, E('k02') + 0.4, 0.5);
    setGlow(spacerGlow, sp * (0.7 + 0.3 * Math.sin(t * 4)), 0.3);
    spacerTag.visible = t > T('k01') + 6.5 && t < T('k02') + 2.6;
    // Cas9 (as a glowing marker at this scale) goes from the CRISPR locus to the viral DNA
    const go = ramp(t, T('k02') + 3.5, 2.5);
    casIcon.position.copy(spacerGlow.position).lerp(viral[1].position.clone().add(vCurve.getPointAt(0.8)), go);
    setGlow(casIcon, window01(t, T('k02') + 3.0, E('k02') + 0.4, 0.4), 0.32);
    casIconTag.visible = go > 0.3 && t < E('k02');
    casIconTag.position.copy(casIcon.position).add(V(0, -1.3, 0));
    const cf = window01(t, T('k02') + 6.2, T('k02') + 7.2, 0.3);
    setGlow(cutFlash, cf, 0.6 + cf * 0.4);
    cutFlash.position.copy(casIcon.position);
    return { pos: orbit(V(0, 0.5, 0), mix(27, 20, smooth((t - T('k01')) / 14)), 0.4 + t * 0.03, 3), target: V(0, 0.2, 0), aperture: 0.0003 };
  }

  // ================================================================ frame
  function update(t: number) {
    ov.beginFrame();
    const sc = sceneAt(clock, t);
    let cam: Cam;
    dust.visible = true;
    dust.rotation.y = t * 0.01;
    if (sc.id === 'title' || sc.id === 'parts' || sc.id === 'summary') {
      show('crystal');
      const parts = sc.id === 'parts';
      const reveal = parts ? ramp(t, T('k04') - 0.4, 1.4) : sc.id === 'summary' ? 0.6 : 0.2;
      crystal.setOpacity('protein', 1 - 0.72 * reveal);
      crystal.setOpacity('sgrna', 1);
      crystal.setOpacity('dna', parts ? 0 : 1);
      sgTag.visible = parts && t > T('k04') + 1.2;
      casTag.visible = parts && t > T('k03') + 1.5 && t < T('k04') + 0.5;
      const r = parts ? mix(19, 15, reveal) : sc.id === 'title' ? 20 : 22;
      cam = { pos: orbit(V(0, 0, 0), r, t * 0.1 + (sc.id === 'summary' ? 2.4 : 0.6), 3), target: V(0, 0, 0), aperture: 0.0004 };
      if (!parts) {
        const right = new THREE.Vector3().subVectors(cam.target, cam.pos).cross(new THREE.Vector3(0, 1, 0)).normalize();
        const shift = sc.id === 'summary' ? -9 : -6;
        cam.target = cam.target.clone().addScaledVector(right, shift);
        cam.pos = cam.pos.clone().addScaledVector(right, shift);
      }
    } else if (sc.id === 'origin') {
      show('origin');
      cam = updateOrigin(t);
    } else if (sc.id === 'epi') {
      show('epi');
      cam = updateEpi(t);
    } else if (sc.id === 'ethics') {
      show('ethics');
      cam = updateEthics(t);
    } else {
      show('gene');
      updateGene(t, sc.id);
      cam = camGene(t, sc.id);
    }
    applyCam(stage, cam);
    overlays(t, sc.id);
    ov.endFrame();
  }

  // ================================================================ 2D overlays
  const seqHtml = (s: string, marks: (i: number) => string) => [...s].map((b, i) => `<i class="${marks(i)}">${b}</i>`).join('');
  function proteinHtml(seq: string, ref?: string, flagAt = -1) {
    const p = translate(seq), r = ref ? translate(ref) : p;
    return [...p].map((a, i) => {
      const cls = a === '*' ? 'stop' : flagAt >= 0 && i >= flagAt && i < flagAt + 8 ? 'flag' : ref && a !== r[i] ? 'changed' : '';
      return `<span class="aa ${cls}">${a === '*' ? '終' : a}</span>`;
    }).join('');
  }

  function overlays(t: number, scene: string) {
    standardOverlays(ov, clock, t, scene, '遺伝医学｜ゲノム編集', '講義資料 スライド35〜44');
    if (scene === 'parts') {
      const sg = PROTOSPACER.replace(/T/g, 'U');
      ov.set('sg', `<p>sgRNA 5′-<b class="sg">${sg}</b><span class="dim">（足場）…</span>-3′</p><p class="dim">先頭の20塩基を変えるだけで、狙う場所を変えられる</p>`, window01(t, T('k04') + 2.0, E('k04') + 0.6, 0.4), 'bottom-card');
    }
    if (scene === 'search') {
      ov.set('pam', `<p class="mono">5′-…<span class="dim">${GENE.slice(START, PAM_AT)}</span><b class="n">N</b><b class="g">G</b><b class="g">G</b>…-3′</p><p>PAM ＝ <b>NGG</b>（N は A・T・G・C のどれでも）</p>`, window01(t, T('k06') + 0.6, E('k06') + 0.4, 0.4), 'top-card');
    }
    if (scene === 'cut' && t > T('k10') + 0.5) {
      const s = seqHtml(GENE.slice(START, PAM_AT + 3), (i) => (i >= SPACER_LEN ? 'pam' : ''));
      const cutPos = CUT - START;
      const withGap = s.split('</i>').map((x, i) => (i === cutPos ? '<span class="gap">｜</span>' : '') + x).join('</i>');
      ov.set('cutseq', `<p class="mono">5′-${withGap}-3′</p><p class="dim">PAM（緑）の3塩基手前で、2本の鎖がそろって切れる</p>`, window01(t, T('k10') + 1.4, E('k11') + 0.4, 0.4), 'top-card crispr-seq');
    }
    if (scene === 'nhej') {
      ov.set('prot', `<p class="dim">元のタンパク質</p><div class="prot">${proteinHtml(GENE)}</div><p class="dim">1塩基欠失のあと</p><div class="prot">${proteinHtml(EDIT_NHEJ, GENE)}</div>`, window01(t, T('k14') + 0.4, E('k15') + 0.6, 0.4), 'top-card prot-card');
    }
    if (scene === 'hdr') {
      ov.set('prot2', `<p class="dim">元のタンパク質</p><div class="prot">${proteinHtml(GENE)}</div><p class="dim">FLAGタグ（DYKDDDDK）を挿入したあと</p><div class="prot">${proteinHtml(EDIT_HDR, undefined, AT / 3)}</div>`, window01(t, T('k18') + 0.6, E('k18') + 0.8, 0.4), 'top-card prot-card');
    }
    if (scene === 'epi') {
      const on = t > T('k21') + 4.5;
      const off = t > T('k20') + 6;
      const state = on ? '<b class="on">ON</b> 働きはじめる' : off ? '<b class="off">OFF</b> 眠っている' : '<b class="mid">…</b>';
      ov.set('switch', `<p>遺伝子のスイッチ　${state}</p><p class="dim">DNAの配列（A・T・G・C）は変わらない</p>`, window01(t, T('k20') + 1.5, E('k21') + 0.6, 0.4), 'side-card epi');
    }
    if (scene === 'ethics') {
      ov.set('eth', `<p class="big2">2015年　ヒト三前核胚のゲノム編集</p><ul><li><b>オフターゲット</b>：狙っていない場所も切られた</li><li><b>モザイク</b>：細胞ごとに結果が違う</li></ul><p class="dim">→ ヒトの胚の編集は、安全性と倫理の両面から厳しく議論されている</p>`, window01(t, T('k22') + 1.5, E('k23') + 0.8, 0.5), 'side-card eth');
    }
    if (scene === 'summary') {
      summaryOverlays(ov, clock, t, 'まとめ：CRISPR-Cas9', [
        ['k25', '<b>PAM（NGG）＋ ガイドRNA 20塩基で場所を決める</b><small>PAMの3塩基手前で、2本の鎖を切る</small>'],
        ['k26', '<b>NHEJ → ずれ → ノックアウト／HDR → ノックイン</b><small>編集の結果は、細胞の修復のしかたで決まる</small>'],
        ['k27', '<b>dCas9 ＋ 酵素で、配列を変えずに働きを変える</b><small>エピゲノム編集（メチル化・アセチル化）</small>'],
      ], '分子：PDB 5F9R（SpCas9–sgRNA–標的DNA）／DNA：PDB 1BNA の原子座標から作成／標的配列：講義スライドの図', 'k27');
    }
  }

  return { update };
}

