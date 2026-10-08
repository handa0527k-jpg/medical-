import * as THREE from 'three';
import type { Stage } from './stage';
import { tween } from './tween';

export type ManipMode = 'view' | 'move' | 'rotate';

interface Saved { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 }

/**
 * Direct manipulation of whole models. In 'view' mode nothing changes (the
 * camera orbits and the lab's own pointer handling runs). In 'move' / 'rotate'
 * mode, grabbing a model drags or turns it, and the wheel (or pinch) scales it.
 * The grabbed unit is the top-level object under stage.world, so labels and
 * everything attached to a model travel with it.
 */
export class Manipulator {
  mode: ManipMode = 'view';
  private saved = new Map<THREE.Object3D, Saved>();
  onChange: ((m: ManipMode) => void) | null = null;
  /** objects the learner may not pick up (e.g. a backdrop) */
  readonly locked = new Set<THREE.Object3D>();

  constructor(private stage: Stage) {
    const el = stage.renderer.domElement;
    // capture phase: runs before OrbitControls and the labs' own listeners
    el.addEventListener('pointerdown', this.down, { capture: true });
    el.addEventListener('wheel', this.wheel, { capture: true, passive: false });
  }

  setMode(m: ManipMode) {
    this.mode = m;
    this.stage.renderer.domElement.style.cursor = m === 'view' ? '' : 'grab';
    this.onChange?.(m);
  }

  private rootOf(o: THREE.Object3D | null) {
    while (o && o.parent && o.parent !== this.stage.world) o = o.parent;
    return o && o.parent === this.stage.world && !this.locked.has(o) ? o : null;
  }

  private grab(e: { clientX: number; clientY: number }) {
    const hits = this.stage.pick(e, this.stage.world.children.filter((c) => c.visible && !this.locked.has(c)));
    return hits ? this.rootOf(hits.object) : null;
  }

  private remember(o: THREE.Object3D) {
    if (!this.saved.has(o)) this.saved.set(o, { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() });
  }

  private down = (e: PointerEvent) => {
    if (this.mode === 'view' || e.button > 0) return;
    const o = this.grab(e);
    if (!o) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    this.remember(o);
    const st = this.stage;
    st.controls.enabled = false;
    document.body.classList.add('dragging');
    const center = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    const normal = st.camera.getWorldDirection(new THREE.Vector3());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);
    const start = st.pointOnPlane(e, plane);
    const p0 = o.position.clone();
    let lx = e.clientX, ly = e.clientY;
    const right = new THREE.Vector3(), up = new THREE.Vector3();
    const move = (ev: PointerEvent) => {
      if (this.mode === 'move') {
        const p = st.pointOnPlane(ev, plane);
        if (p && start) o.position.copy(p0).add(p.sub(start));
      } else {
        // trackball: horizontal drag turns about the screen's up axis, vertical about its right axis
        st.camera.matrixWorld.extractBasis(right, up, new THREE.Vector3());
        const dx = ev.clientX - lx, dy = ev.clientY - ly;
        const q = new THREE.Quaternion().setFromAxisAngle(up, dx * 0.01)
          .multiply(new THREE.Quaternion().setFromAxisAngle(right, dy * 0.01));
        // turn about the model's visual centre, not its origin
        const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
        o.position.sub(c).applyQuaternion(q).add(c);
        o.quaternion.premultiply(q);
      }
      lx = ev.clientX;
      ly = ev.clientY;
    };
    const upH = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', upH);
      removeEventListener('pointercancel', upH);
      st.controls.enabled = true;
      document.body.classList.remove('dragging');
    };
    addEventListener('pointermove', move);
    addEventListener('pointerup', upH);
    addEventListener('pointercancel', upH);
  };

  private wheel = (e: WheelEvent) => {
    if (this.mode === 'view') return;
    const o = this.grab(e);
    if (!o) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    this.remember(o);
    const k = Math.exp(-e.deltaY * 0.0015);
    const s = THREE.MathUtils.clamp(o.scale.x * k, 0.2, 6);
    o.scale.multiplyScalar(s / o.scale.x);
  };

  /** put every moved model back where the lab placed it */
  reset() {
    const items = [...this.saved.entries()].filter(([o]) => o.parent);
    this.saved.clear();
    const from = items.map(([o]) => ({ p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() }));
    return tween(this.stage, 0.7, (e) => items.forEach(([o, to], i) => {
      o.position.lerpVectors(from[i].p, to.p, e);
      o.quaternion.slerpQuaternions(from[i].q, to.q, e);
      o.scale.lerpVectors(from[i].s, to.s, e);
    }));
  }

  get moved() {
    return this.saved.size > 0;
  }
}

/** the mode buttons drawn over the 3D view */
export function manipToolbar(m: Manipulator) {
  const bar = document.createElement('div');
  bar.className = 'manip';
  const modes: [ManipMode, string, string][] = [
    ['view', '視点', 'ドラッグで視点を回す・ホイールで拡大'],
    ['move', '移動', 'モデルをつかんで動かす・ホイールで大きさ'],
    ['rotate', '回転', 'モデルをつかんで好きな向きに回す'],
  ];
  const btns = modes.map(([mode, label, title]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.title = title;
    b.setAttribute('aria-pressed', String(mode === m.mode));
    b.onclick = () => m.setMode(mode);
    bar.append(b);
    return [mode, b] as const;
  });
  const reset = document.createElement('button');
  reset.textContent = '元に戻す';
  reset.title = '動かしたモデルを元の位置に戻す';
  reset.className = 'reset';
  reset.onclick = () => m.reset();
  bar.append(reset);
  m.onChange = (mode) => btns.forEach(([k, b]) => b.setAttribute('aria-pressed', String(k === mode)));
  return bar;
}
