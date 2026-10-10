import * as THREE from 'three';
import type { AtomicDNA, Nt } from '../core/dna';
import type { Stage } from '../core/stage';
import { loadMolecule, type Molecule } from '../core/molecule';

// ---------------------------------------------------------------- time

export interface Cue { id: string; scene: string; text: string; start: number; dur: number }
export interface Timing {
  id: string; title: string; subtitle: string; duration: number;
  scenes: { id: string; label: string; start: number; end: number }[];
  cues: Cue[];
}

/** cue-relative clock: every visual event is placed against a spoken line */
export class Clock {
  private byId = new Map<string, Cue>();
  constructor(readonly timing: Timing) {
    for (const c of timing.cues) this.byId.set(c.id, c);
  }
  at(id: string) {
    const c = this.byId.get(id);
    if (!c) throw new Error('no cue ' + id);
    return c.start;
  }
  end(id: string) {
    const c = this.byId.get(id)!;
    return c.start + c.dur;
  }
  dur(id: string) {
    return this.byId.get(id)!.dur;
  }
  scene(id: string) {
    return this.timing.scenes.find((s) => s.id === id)!;
  }
  cueAt(t: number) {
    let cur: Cue | null = null;
    for (const c of this.timing.cues) if (c.start <= t) cur = c;
    return cur;
  }
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
export const easeInOut = (x: number) => { const t = clamp01(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
/** 0 before a, 1 after a+d, eased in between */
export const ramp = (t: number, a: number, d = 1) => easeInOut((t - a) / d);
/** 1 inside [a, b] with soft edges of width f */
export const window01 = (t: number, a: number, b: number, f = 0.35) => Math.min(ramp(t, a - f, f), 1 - ramp(t, b, f));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const vmix = (a: THREE.Vector3, b: THREE.Vector3, k: number) => a.clone().lerp(b, k);

/** deterministic smooth wander (no randomness between frames) */
export function wander(seed: number, t: number, amp = 1) {
  const f = (k: number) => Math.sin(t * (0.31 + k * 0.07) + seed * (1.7 + k)) * 0.6 + Math.sin(t * (0.53 + k * 0.05) + seed * 3.1 + k) * 0.4;
  return new THREE.Vector3(f(1), f(2), f(3)).multiplyScalar(amp);
}

// ---------------------------------------------------------------- HTML overlays (captured with the frame)

export class Overlays {
  private els = new Map<string, HTMLElement>();
  private used = new Set<string>();
  constructor(private host: HTMLElement) {}
  /** show `html` with opacity `a` this frame (an overlay not set in a frame is hidden) */
  set(key: string, html: string, a: number, cls = '') {
    this.used.add(key);
    let el = this.els.get(key);
    if (!el) {
      el = document.createElement('div');
      this.host.append(el);
      this.els.set(key, el);
    }
    if (el.dataset.html !== html) { el.innerHTML = html; el.dataset.html = html; }
    el.className = 'ov ' + cls;
    el.style.opacity = String(clamp01(a));
    el.hidden = a <= 0.001;
  }
  beginFrame() { this.used.clear(); }
  endFrame() { for (const [k, el] of this.els) if (!this.used.has(k)) el.hidden = true; }
}

// ---------------------------------------------------------------- free nucleotides

const sphere = new THREE.IcosahedronGeometry(1, 2);
sphere.userData.shared = true;
const atomMat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0 });
const ELEMENT: Record<string, string> = { P: '#ffa94d', O: '#ef5350', H: '#f8f9fa' };

interface A { p: THREE.Vector3; r: number; c: THREE.Color }

function instanced(atoms: A[]) {
  const m = new THREE.InstancedMesh(sphere, atomMat, Math.max(1, atoms.length));
  const mat = new THREE.Matrix4();
  atoms.forEach((a, i) => {
    mat.compose(a.p, new THREE.Quaternion(), new THREE.Vector3(a.r, a.r, a.r));
    m.setMatrixAt(i, mat);
    m.setColorAt(i, a.c);
  });
  m.count = atoms.length;
  m.castShadow = true;
  return m;
}

/**
 * A nucleoside triphosphate floating free: the atoms of nucleotide `nt` of a
 * strand (from the measured 1BNA template) plus a beta and gamma phosphate
 * built outward from its own phosphate. Built in the DNA's space around the
 * nucleotide's centre, so placing the group at offset 0 puts it exactly where
 * it will sit in the chain. `dideoxy` drops the 3'-oxygen (ddNTP) and puts a
 * hydrogen on C3' instead; otherwise a hydrogen completes the 3'-OH.
 */
export class FreeNucleotide extends THREE.Group {
  readonly centre: THREE.Vector3;
  readonly body: THREE.InstancedMesh;
  /** the pyrophosphate (beta + gamma phosphates) that leaves when the nucleotide is joined */
  readonly ppi: THREE.Group;
  /** the 3'-OH oxygen (or C3' for a ddNTP) in this group's space */
  readonly tip: THREE.Vector3;
  readonly alphaP: THREE.Vector3;

  constructor(dna: AtomicDNA, nt: Nt, opts: { dideoxy?: boolean } = {}) {
    super();
    const atoms = dna.atomsOf(nt);
    const get = (n: string) => atoms.find((a) => a.name === n)!.p;
    this.centre = atoms.reduce((s, a) => s.add(a.p), new THREE.Vector3()).divideScalar(atoms.length);
    const local = (p: THREE.Vector3) => p.clone().sub(this.centre);
    const body: A[] = [];
    for (const a of atoms) {
      if (opts.dideoxy && a.name === "O3'") continue;
      body.push({ p: local(a.p), r: a.r, c: a.color });
    }
    const c3 = get("C3'"), c2 = get("C2'"), c4 = get("C4'");
    if (opts.dideoxy) {
      const dir = c3.clone().sub(c2).add(c3.clone().sub(c4)).normalize();
      this.tip = local(c3);
      body.push({ p: local(c3).addScaledVector(dir, 0.11), r: 0.11, c: new THREE.Color(ELEMENT.H) });
    } else {
      const o3 = get("O3'");
      this.tip = local(o3);
      body.push({ p: local(o3).addScaledVector(o3.clone().sub(c3).normalize(), 0.096), r: 0.11, c: new THREE.Color(ELEMENT.H) });
    }
    // triphosphate: beta and gamma phosphates continue outward from the alpha phosphate
    const P = get('P'), O5 = get("O5'");
    this.alphaP = local(P);
    const out = P.clone().sub(O5).normalize();
    const side = new THREE.Vector3(0, 0, 1).cross(out).normalize();
    const up = out.clone().cross(side).normalize();
    const ppi: A[] = [];
    const oCol = new THREE.Color(ELEMENT.O), pCol = new THREE.Color(ELEMENT.P);
    let from = P.clone();
    let dir = out.clone().applyAxisAngle(side, 0.5);
    for (let i = 0; i < 2; i++) {
      const bridge = from.clone().addScaledVector(dir, 0.16);
      const pn = from.clone().addScaledVector(dir, 0.30);
      ppi.push({ p: local(bridge), r: 0.152 * 0.92, c: oCol }, { p: local(pn), r: 0.18 * 0.92, c: pCol });
      const n1 = dir.clone().applyAxisAngle(up, 1.9), n2 = dir.clone().applyAxisAngle(side, 1.9);
      ppi.push({ p: local(pn.clone().addScaledVector(n1, 0.15)), r: 0.14, c: oCol }, { p: local(pn.clone().addScaledVector(n2, 0.15)), r: 0.14, c: oCol });
      if (i === 1) ppi.push({ p: local(pn.clone().addScaledVector(dir, 0.15)), r: 0.14, c: oCol });
      from = pn;
      dir = dir.clone().applyAxisAngle(up, -0.7);
    }
    this.body = instanced(body);
    this.add(this.body);
    this.ppi = new THREE.Group();
    this.ppi.add(instanced(ppi));
    this.add(this.ppi);
  }

  /**
   * Pose relative to the slot it will occupy: k = 0 far away (at `from`), k = 1
   * exactly in place. `spin` tumbles it while it drifts.
   */
  pose(from: THREE.Vector3, k: number, spin = 0) {
    this.position.copy(this.centre).add(from.clone().multiplyScalar(1 - k));
    this.quaternion.setFromEuler(new THREE.Euler(spin * 0.7 * (1 - k), spin * (1 - k), spin * 0.4 * (1 - k)));
  }
}

/** a glowing marker (bloom) for one atom or bond */
export function glowBall(color: string, r = 0.2, power = 2.2, onTop = false) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), transparent: true, depthWrite: false, depthTest: !onTop, toneMapped: false }));
  m.scale.setScalar(r);
  m.renderOrder = 20;
  return m;
}
export function setGlow(m: THREE.Mesh, a: number, r?: number) {
  (m.material as THREE.MeshBasicMaterial).opacity = clamp01(a);
  m.visible = a > 0.01;
  if (r !== undefined) m.scale.setScalar(Math.max(1e-4, r));
}

// ---------------------------------------------------------------- camera

export type Cam = { pos: THREE.Vector3; target: THREE.Vector3; aperture?: number };
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** camera through keyframes [time, camera] with eased moves between them */
export function camPath(keys: [number, Cam][], t: number): Cam {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t < t1) {
      const k = easeInOut((t - t0) / (t1 - t0));
      return { pos: vmix(a.pos, b.pos, k), target: vmix(a.target, b.target, k), aperture: mix(a.aperture ?? 0.0006, b.aperture ?? 0.0006, k) };
    }
  }
  return keys[keys.length - 1][1];
}

export function orbit(center: THREE.Vector3, r: number, ang: number, h: number): THREE.Vector3 {
  return center.clone().add(V(Math.sin(ang) * r, h, Math.cos(ang) * r));
}

export async function loadFilmMolecule(id: string): Promise<Molecule> {
  // film-quality surfaces live in film/models; fall back to the lab model
  try {
    return await loadMolecule(id, '../film/models/');
  } catch {
    return loadMolecule(id);
  }
}

/** drifting water-sized specks that give depth to molecular shots */
export function makeDust(n = 900, seed = 11) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * 60; pos[i * 3 + 1] = (rnd() - 0.5) * 34; pos[i * 3 + 2] = (rnd() - 0.5) * 40 - 6; }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: '#6c8fc7', size: 0.06, transparent: true, opacity: 0.35, depthWrite: false }));
}

/** a film module: builds its sets once, then draws any time t on demand */
export type Film = (stage: Stage, clock: Clock, ov: Overlays) => Promise<{ update(t: number): void }>;

export function applyCam(stage: Stage, cam: Cam) {
  stage.camera.position.copy(cam.pos);
  stage.camera.lookAt(cam.target);
  stage.controls.target.copy(cam.target);
  stage.focusOn(cam.target, cam.aperture ?? 0.0006);
}

/** the scene that contains time t */
export function sceneAt(clock: Clock, t: number) {
  const sc = clock.timing.scenes;
  return sc.find((s) => t >= s.start && t < s.end) ?? sc[sc.length - 1];
}

/** subtitle, chapter chip and title card — the same in every film */
export function standardOverlays(ov: Overlays, clock: Clock, t: number, scene: string, kicker: string, slides: string) {
  const cue = clock.cueAt(t);
  const sc = clock.scene(scene);
  if (scene !== 'title') {
    if (cue) ov.set('sub', `<p>${cue.text}</p>`, 1, 'subtitle');
    ov.set('chip', sc.label, window01(t, sc.start, sc.end, 0.4), 'chip');
  } else {
    const a = window01(t, 0.3, sc.end - 0.2, 0.8);
    ov.set('title', `<p class="kicker">${kicker}</p><h1>${clock.timing.title}</h1><p class="lead">${clock.timing.subtitle}</p><p class="src">${slides}</p>`, a, 'title-card');
  }
}

/** summary cards (numbered), heading and credit line */
export function summaryOverlays(ov: Overlays, clock: Clock, t: number, head: string, cards: [string, string][], credit: string, creditCue: string) {
  ov.set('sumh', `<h2>${head}</h2>`, ramp(t, clock.scene('summary').start + 0.2, 0.6), 'sum-head');
  cards.forEach(([cue, html], i) => ov.set('s' + (i + 1), `<span class="n">${i + 1}</span><div>${html}</div>`, ramp(t, clock.at(cue) - 0.2, 0.6), `sum-card s${i + 1}`));
  ov.set('credit', `<small>${credit}</small>`, ramp(t, clock.at(creditCue), 0.8), 'credit');
}
