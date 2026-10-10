import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/** [element, x, y, z, isBackbone, atomName] in the base-pair frame (nm) */
export type TplAtom = [string, number, number, number, number, string];
export interface BdnaTemplate {
  rise: number;
  twist: number;
  pairs: Record<string, { s1: TplAtom[]; s2: TplAtom[] }>;
}

let template: BdnaTemplate | null = null;
export async function loadDnaTemplate(base: string) {
  if (!template) template = await (await fetch(base + 'models/bdna.json')).json();
  return template!;
}
export const dnaTemplate = () => {
  if (!template) throw new Error('bdna template not loaded');
  return template;
};

export const COMP: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
export const complement = (s: string) => [...s].map((c) => COMP[c] ?? 'N').join('');
export const revcomp = (s: string) => complement(s).split('').reverse().join('');

export const BASE_COLOR: Record<string, string> = { A: '#f2c230', T: '#3fb56b', G: '#e04a5f', C: '#3a9ad9', U: '#9b6bd6' };
const ELEMENT_COLOR: Record<string, string> = { C: '#8d96a3', O: '#ef5350', N: '#5c7cfa', P: '#ffa94d' };
const VDW: Record<string, number> = { C: 0.17, N: 0.155, O: 0.152, P: 0.18 };

export type ColorMode = 'base' | 'element';

export interface Nt {
  /** 0 = top strand (5'->3' along +X), 1 = bottom strand */
  strand: 0 | 1;
  k: number;
  base: string;
  start: number;
  count: number;
  offset: THREE.Vector3;
  /** extra rotation about the helix axis (radians) */
  spin: number;
  /** 0 hides the nucleotide, 1 shows it */
  scale: number;
  tint: THREE.Color | null;
  tintAmount: number;
}

const sphere = new THREE.IcosahedronGeometry(1, 2);
sphere.userData.shared = true;

/**
 * Space-filling atomic B-DNA built from the measured base-pair templates.
 * Top strand reads 5'->3' left to right; base pair k sits at x = k*rise.
 * Every nucleotide can be moved, spun about the axis, hidden or tinted on its
 * own, which is how the labs cut, melt, unwind and ligate it.
 */
export class AtomicDNA extends THREE.Group {
  readonly n: number;
  readonly bottom: string;
  readonly nts: Nt[] = [];
  readonly mesh: THREE.InstancedMesh;
  readonly rise: number;
  readonly twist: number;
  private base: Float32Array; // template-space atom positions after the helical placement
  private radius: Float32Array;
  private bb: Uint8Array;
  /** PDB atom name of every instance (O3', C1', P, ...) */
  readonly names: string[] = [];
  readonly elements: string[] = [];
  /** per-atom size factor (1 = normal); lets a film remove one atom, e.g. the 3'-O of a ddNTP */
  readonly atomScale: Float32Array;
  private letters: (CSS2DObject | null)[] = [];
  private letterY = 1.75;
  /** which letters may show (in addition to their nucleotide being visible) */
  letterFilter: ((nt: Nt) => boolean) | null = null;
  private colBase: THREE.Color[] = [];
  private colElem: THREE.Color[] = [];
  readonly atomNt: Int32Array;
  private mode: ColorMode;
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private dirty = true;

  constructor(readonly top: string, opts: { phase?: number; mode?: ColorMode } = {}) {
    super();
    const tpl = dnaTemplate();
    this.rise = tpl.rise;
    this.twist = tpl.twist;
    this.n = top.length;
    this.bottom = complement(top);
    this.mode = opts.mode ?? 'base';
    const phase = opts.phase ?? 0;
    const atoms: { p: THREE.Vector3; el: string; bb: boolean; nt: number; name: string }[] = [];
    // build both strands nucleotide by nucleotide (strand 0 first, then strand 1)
    const perStrand: { p: THREE.Vector3; el: string; bb: boolean; name: string }[][][] = [[], []];
    for (let k = 0; k < this.n; k++) {
      const key = top[k] + this.bottom[k];
      const pair = tpl.pairs[key] ?? tpl.pairs['AT'];
      const a = phase + k * this.twist;
      const c = Math.cos(a), s = Math.sin(a);
      for (const [si, list] of [[0, pair.s1], [1, pair.s2]] as const) {
        perStrand[si][k] = list.map(([el, x, y, z, bb, name]) => ({
          p: new THREE.Vector3(x + k * this.rise, y * c - z * s, y * s + z * c),
          el,
          bb: bb === 1,
          name,
        }));
      }
    }
    for (const si of [0, 1] as const) {
      for (let k = 0; k < this.n; k++) {
        const list = perStrand[si][k];
        const idx = this.nts.length;
        this.nts.push({
          strand: si, k, base: si === 0 ? top[k] : this.bottom[k], start: atoms.length, count: list.length,
          offset: new THREE.Vector3(), spin: 0, scale: 1, tint: null, tintAmount: 0,
        });
        for (const at of list) atoms.push({ ...at, nt: idx });
      }
    }
    const N = atoms.length;
    this.base = new Float32Array(N * 3);
    this.radius = new Float32Array(N);
    this.bb = new Uint8Array(N);
    this.atomNt = new Int32Array(N);
    this.atomScale = new Float32Array(N).fill(1);
    const strandTone = [new THREE.Color('#eef1f6'), new THREE.Color('#c6d0dd')];
    atoms.forEach((a, i) => {
      a.p.toArray(this.base, i * 3);
      this.radius[i] = (VDW[a.el] ?? 0.17) * 0.92;
      this.bb[i] = a.bb ? 1 : 0;
      this.atomNt[i] = a.nt;
      this.names.push(a.name);
      this.elements.push(a.el);
      const nt = this.nts[a.nt];
      this.colBase.push(a.bb ? strandTone[nt.strand].clone()
        : new THREE.Color(BASE_COLOR[nt.base] ?? '#999').lerp(new THREE.Color('#ffffff'), a.el === 'C' ? 0 : 0.18));
      this.colElem.push(new THREE.Color(ELEMENT_COLOR[a.el] ?? '#aaa'));
    });
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.0 });
    this.mesh = new THREE.InstancedMesh(sphere, mat, N);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.add(this.mesh);
    this.applyColors();
    this.update();
    this.mesh.onBeforeRender = () => this.update();
  }

  /** sequence letters beside each strand (top strand above, bottom strand below), as HTML so they stay crisp */
  showLetters(y = 1.75, color?: (nt: Nt) => string) {
    this.letterY = y;
    for (const l of this.letters) if (l) { this.remove(l); l.element.remove(); }
    this.letters = this.nts.map((nt) => {
      const el = document.createElement('span');
      el.className = 'nt-letter';
      el.textContent = nt.base;
      el.style.color = color ? color(nt) : BASE_COLOR[nt.base];
      const o = new CSS2DObject(el);
      this.add(o);
      return o;
    });
    this.dirty = true;
    this.update();
  }

  /** recolour some letters (e.g. to highlight a recognition site) */
  letterColor(sel: (nt: Nt) => boolean, color: (nt: Nt) => string, cls = '') {
    this.nts.forEach((nt, i) => {
      const l = this.letters[i];
      if (!l || !sel(nt)) return;
      l.element.style.color = color(nt);
      l.element.className = 'nt-letter ' + cls;
    });
  }

  /** instance index of a named atom in a nucleotide (-1 if absent) */
  atomIndex(nt: Nt, name: string) {
    for (let i = nt.start; i < nt.start + nt.count; i++) if (this.names[i] === name) return i;
    return -1;
  }

  /** where an atom sits now (this group's space), following the nucleotide's offset and spin */
  atomPos(i: number) {
    const nt = this.nts[this.atomNt[i]];
    const cs = Math.cos(nt.spin), sn = Math.sin(nt.spin);
    const x = this.base[i * 3], y = this.base[i * 3 + 1], z = this.base[i * 3 + 2];
    return new THREE.Vector3(x, y * cs - z * sn, y * sn + z * cs).add(nt.offset);
  }

  /** atoms of a nucleotide at their helical place (no offset): element, name, position, radius, colour */
  atomsOf(nt: Nt) {
    const out: { el: string; name: string; p: THREE.Vector3; r: number; color: THREE.Color }[] = [];
    for (let i = nt.start; i < nt.start + nt.count; i++) {
      out.push({ el: this.elements[i], name: this.names[i], p: new THREE.Vector3().fromArray(this.base, i * 3),
        r: this.radius[i], color: (this.mode === 'base' ? this.colBase : this.colElem)[i].clone() });
    }
    return out;
  }

  /** centre of a nucleotide (its backbone atoms by default), in this group's space */
  ntCenter(nt: Nt, backbone = true) {
    const c = new THREE.Vector3();
    let n = 0;
    const cs = Math.cos(nt.spin), sn = Math.sin(nt.spin);
    for (let i = nt.start; i < nt.start + nt.count; i++) {
      if (backbone && !this.bb[i]) continue;
      const y = this.base[i * 3 + 1], z = this.base[i * 3 + 2];
      c.x += this.base[i * 3];
      c.y += y * cs - z * sn;
      c.z += y * sn + z * cs;
      n++;
    }
    return c.divideScalar(Math.max(n, 1)).add(nt.offset);
  }

  /** nucleotide index for (strand, k) */
  idx(strand: 0 | 1, k: number) {
    return strand * this.n + k;
  }
  nt(strand: 0 | 1, k: number) {
    return this.nts[this.idx(strand, k)];
  }

  each(sel: (nt: Nt) => boolean, f: (nt: Nt) => void) {
    for (const nt of this.nts) if (sel(nt)) f(nt);
    this.dirty = true;
  }

  setMode(m: ColorMode) {
    this.mode = m;
    this.applyColors();
  }

  touch() {
    this.dirty = true;
  }

  applyColors() {
    const src = this.mode === 'base' ? this.colBase : this.colElem;
    const c = new THREE.Color();
    for (let i = 0; i < src.length; i++) {
      const nt = this.nts[this.atomNt[i]];
      c.copy(src[i]);
      if (nt.tint && nt.tintAmount > 0) c.lerp(nt.tint, nt.tintAmount);
      this.mesh.setColorAt(i, c);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  tint(sel: (nt: Nt) => boolean, color: string | null, amount = 0.6) {
    const c = color ? new THREE.Color(color) : null;
    for (const nt of this.nts) if (sel(nt)) { nt.tint = c; nt.tintAmount = c ? amount : 0; }
    this.applyColors();
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    const b = this.base;
    for (const nt of this.nts) {
      const cs = Math.cos(nt.spin), sn = Math.sin(nt.spin);
      for (let i = nt.start; i < nt.start + nt.count; i++) {
        const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2];
        this.v.set(x + nt.offset.x, y * cs - z * sn + nt.offset.y, y * sn + z * cs + nt.offset.z);
        const r = this.radius[i] * nt.scale * this.atomScale[i] + 1e-5;
        this.s.set(r, r, r);
        this.m4.compose(this.v, this.q, this.s);
        this.mesh.setMatrixAt(i, this.m4);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.computeBoundingSphere();
    this.letters.forEach((l, i) => {
      if (!l) return;
      const nt = this.nts[i];
      l.position.set(nt.k * this.rise + nt.offset.x, (nt.strand === 0 ? 1 : -1) * this.letterY + nt.offset.y, nt.offset.z);
      l.visible = nt.scale > 0.5 && (!this.letterFilter || this.letterFilter(nt));
    });
  }

  /** local x of base pair k */
  x(k: number) {
    return k * this.rise;
  }
  get length() {
    return (this.n - 1) * this.rise;
  }

  /** which nucleotide an intersection hit */
  ntFromHit(instanceId: number | undefined) {
    return instanceId === undefined ? null : this.nts[this.atomNt[instanceId]];
  }

  /** angle (about +X, from +Y toward +Z) of the minor groove at base pair position k (may be fractional) */
  groove(k: number, phase = 0) {
    return phase + k * this.twist;
  }
}
