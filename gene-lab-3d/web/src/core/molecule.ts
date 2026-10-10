import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const BASE = import.meta.env.BASE_URL;

export interface MoleculeMeta {
  id: string;
  title: string;
  cite: string;
  parts: string[];
  landmarks: Record<string, [number, number, number]>;
  bounds: [[number, number, number], [number, number, number]];
  enzyme?: string;
  site?: string;
  /** Blender-frame angle of the minor groove at the site centre (about +X, from +Y toward +Z) */
  groovePhase?: number;
  pam?: [number, number, number];
  /** nm along +X from the origin where groovePhase was measured (Cas9: the PAM duplex) */
  grooveAt?: number;
  frame: string;
}

const draco = new DRACOLoader().setDecoderPath(BASE + 'draco/');
const loader = new GLTFLoader().setDRACOLoader(draco);
const glbCache = new Map<string, Promise<THREE.Group>>();
const metaCache = new Map<string, Promise<MoleculeMeta>>();

// VITE_MODELS_JSON=1: for hosts with a strict CSP the models ship as quantized GLB
// wrapped in JSON (scripts/hosted-models.mjs) and are parsed in memory: no Draco
// WebAssembly and no data: URI fetches
const asJson = import.meta.env.VITE_MODELS_JSON === '1';

async function fetchGlb(file: string) {
  if (!asJson) return loader.loadAsync(BASE + 'models/' + file);
  const { glb } = await (await fetch(BASE + 'models/' + file + '.json')).json() as { glb: string };
  const bin = Uint8Array.from(atob(glb), (c) => c.charCodeAt(0));
  return loader.parseAsync(bin.buffer, '');
}

export function loadGlb(file: string) {
  let p = glbCache.get(file);
  if (!p) {
    p = fetchGlb(file).then((g) => {
      g.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
          m.geometry.userData.shared = true;
        }
      });
      return g.scene;
    });
    glbCache.set(file, p);
  }
  return p;
}

export function loadMeta(id: string) {
  let p = metaCache.get(id);
  if (!p) {
    p = fetch(BASE + 'models/' + id + '.json').then((r) => r.json());
    metaCache.set(id, p);
  }
  return p;
}

/** Blender (Z-up) landmark -> three.js (Y-up) */
export const yUp = (v: [number, number, number]) => new THREE.Vector3(v[0], v[2], -v[1]);

/** the groove direction stored in the metadata, as an angle about +X in three.js (from +Y toward +Z) */
export function grooveAngleThree(phaseBlender: number) {
  // Blender +Y -> three -Z, Blender +Z -> three +Y; direction (0, cos, sin)_b = (0, sin, -cos)_t
  return Math.atan2(-Math.cos(phaseBlender), Math.sin(phaseBlender));
}

export interface Molecule {
  root: THREE.Group;
  meta: MoleculeMeta;
  part(name: string): THREE.Mesh | undefined;
  /** clones materials so this copy can be faded/tinted on its own */
  setOpacity(part: string, o: number): void;
}

/**
 * A real structure from the PDB (surface built in the pipeline, AO baked in
 * Blender). Parts are named <ID>_<part>: protein, dna, sgrna, ddntp, ...
 */
export async function loadMolecule(id: string, dir = ''): Promise<Molecule> {
  const [scene, meta] = await Promise.all([loadGlb(dir + id + '.glb'), loadMeta(id)]);
  const root = scene.clone(true);
  const parts = new Map<string, THREE.Mesh>();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const name = m.name.replace(id + '_', '');
    const src = m.material as THREE.MeshStandardMaterial;
    const mat = src.clone();
    mat.vertexColors = true;
    mat.roughness = 0.62;
    mat.metalness = 0;
    mat.envMapIntensity = 0.8;
    if (mat.emissiveIntensity > 0 && !mat.emissive.equals(new THREE.Color(0, 0, 0))) mat.toneMapped = false;
    m.material = mat;
    parts.set(name, m);
  });
  return {
    root,
    meta,
    part: (n) => parts.get(n),
    setOpacity(n, o) {
      const m = parts.get(n);
      if (!m) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.transparent = o < 0.999;
      mat.opacity = o;
      mat.depthWrite = o > 0.6;
      m.visible = o > 0.01;
      m.castShadow = o > 0.6;
    },
  };
}
