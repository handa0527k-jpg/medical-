import * as THREE from 'three';
import { disposeTree, type Stage } from './stage';
import type { AtomicDNA } from './dna';
import { grooveAngleThree, type Molecule } from './molecule';
import { tween } from './tween';

/**
 * Pointer dragging on a plane facing the camera through `anchor`.
 * Works for mouse, pen and touch; orbit controls pause while dragging.
 */
export function dragOnView(stage: Stage, startEvent: PointerEvent, anchor: THREE.Vector3,
  handlers: { move(p: THREE.Vector3, e: PointerEvent): void; end(p: THREE.Vector3 | null, e: PointerEvent): void }) {
  const el = stage.renderer.domElement;
  const normal = new THREE.Vector3();
  stage.camera.getWorldDirection(normal);
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, anchor);
  stage.controls.enabled = false;
  document.body.classList.add('dragging');
  let last: THREE.Vector3 | null = stage.pointOnPlane(startEvent, plane);
  if (last) handlers.move(last, startEvent);
  const move = (e: PointerEvent) => {
    const p = stage.pointOnPlane(e, plane);
    if (p) {
      last = p;
      handlers.move(p, e);
    }
  };
  const up = (e: PointerEvent) => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    removeEventListener('pointercancel', up);
    stage.controls.enabled = true;
    document.body.classList.remove('dragging');
    const r = el.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    handlers.end(inside ? last : null, e);
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
}

export interface Pose { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3 }

/**
 * World pose that seats a DNA-bound structure on the procedural helix: same
 * axis, centred on base-pair position `kc` (may be fractional), turned about
 * the axis until the minor grooves coincide. `flip` turns the molecule end for
 * end (for an enzyme travelling the other way); `along`/`lift` shift it in the
 * DNA's own frame. Because everything is composed with the DNA's world matrix,
 * the seat stays right however the learner has moved, turned or scaled the DNA.
 */
export function seatOnDna(mol: Molecule, dna: AtomicDNA, kc: number,
  opts: { flip?: boolean; along?: number; lift?: THREE.Vector3; phase?: number } = {}): Pose {
  const crystal = mol.meta.groovePhase === undefined ? 0 : grooveAngleThree(mol.meta.groovePhase);
  const groove = dna.groove(kc, opts.phase ?? 0);
  const local = opts.flip
    // Ry(pi) * Rx(a): the groove angle flips sign, so a = -groove - crystal
    ? new THREE.Quaternion().setFromEuler(new THREE.Euler(-groove - crystal, Math.PI, 0, 'YXZ'))
    : new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), groove - crystal);
  const at = new THREE.Vector3(dna.x(kc) + (opts.along ?? 0), 0, 0).add(opts.lift ?? new THREE.Vector3());
  dna.updateWorldMatrix(true, false);
  const m = dna.matrixWorld.clone().multiply(new THREE.Matrix4().compose(at, local, new THREE.Vector3(1, 1, 1)));
  const pose: Pose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3() };
  m.decompose(pose.pos, pose.quat, pose.scale);
  return pose;
}

export function place(o: THREE.Object3D, p: Pose) {
  o.position.copy(p.pos);
  o.quaternion.copy(p.quat);
  o.scale.copy(p.scale);
}

/** free-floating (not on DNA): upright, unit scale */
export function float(o: THREE.Object3D, at: THREE.Vector3) {
  o.position.copy(at);
  o.quaternion.identity();
  o.scale.setScalar(1);
}

/** greyscale the baked colours (keeping the baked shading) and tint them with one colour */
export function tintMolecule(mol: Molecule, part: string, hex: string) {
  const m = mol.part(part);
  if (!m) return;
  const g = m.geometry.clone();
  const col = g.getAttribute('color') as THREE.BufferAttribute | undefined;
  if (col) {
    for (let i = 0; i < col.count; i++) {
      const l = Math.min(1, (0.3 * col.getX(i) + 0.59 * col.getY(i) + 0.11 * col.getZ(i)) * 1.9);
      col.setXYZ(i, l, l, l);
    }
    col.needsUpdate = true;
  }
  m.geometry = g;
  (m.material as THREE.MeshStandardMaterial).color = new THREE.Color(hex);
}

/** a short bright pulse (picked up by the bloom pass) */
export function flash(stage: Stage, parent: THREE.Object3D, at: THREE.Vector3, color = '#ffe08a', size = 0.55, dur = 0.9) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(4), transparent: true, toneMapped: false, depthWrite: false }));
  m.position.copy(at);
  parent.add(m);
  return tween(stage, dur, (e) => {
    const s = size * (0.3 + Math.sin(Math.PI * Math.min(1, e * 1.2)) * 0.9);
    m.scale.setScalar(Math.max(0.001, s));
    (m.material as THREE.MeshBasicMaterial).opacity = 1 - e * e;
  }).then(() => {
    parent.remove(m);
    m.geometry.dispose();
  });
}

/** fade a molecule's parts out (and optionally drift away) then drop it from the scene */
export async function dismiss(stage: Stage, mol: Molecule, drift = new THREE.Vector3(0, 5, 0), dur = 1.0) {
  const from = mol.root.position.clone();
  await tween(stage, dur, (e) => {
    mol.root.position.copy(from).addScaledVector(drift, e);
    for (const p of mol.meta.parts) mol.setOpacity(p, (1 - e) * (p === 'dna' ? 0 : 1));
  });
  mol.root.parent?.remove(mol.root);
  disposeTree(mol.root);
}
