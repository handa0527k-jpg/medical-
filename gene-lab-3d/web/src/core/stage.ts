import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export type Tick = (dt: number, t: number) => void;

/** Whether the heavy post-processing (ambient occlusion) runs. Off on small/touch screens by default. */
export function defaultQuality(): 'high' | 'low' {
  try {
    const saved = localStorage.getItem('genelab:quality');
    if (saved === 'high' || saved === 'low') return saved;
  } catch { /* ignore */ }
  return matchMedia('(pointer: coarse)').matches || innerWidth < 760 ? 'low' : 'high';
}

/**
 * One three.js viewport: renderer, camera, orbit controls, image-based lighting,
 * post-processing (GTAO ambient occlusion + bloom for the glowing parts) and an
 * HTML label layer. Labs add objects to `world` and register per-frame ticks.
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly world = new THREE.Group();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly labels: CSS2DRenderer;
  private composer: EffectComposer;
  private gtao: GTAOPass;
  private bloom: UnrealBloomPass;
  private ticks = new Set<Tick>();
  private timer = new THREE.Timer();
  private raf = 0;
  private ro: ResizeObserver;
  private disposed = false;
  quality: 'high' | 'low';
  readonly raycaster = new THREE.Raycaster();

  constructor(readonly host: HTMLElement) {
    this.quality = defaultQuality();
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.toneMapping = THREE.AgXToneMapping;
    r.toneMappingExposure = 1.15;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    host.appendChild(r.domElement);
    r.domElement.classList.add('stage-canvas');
    this.renderer = r;

    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'stage-labels';
    host.appendChild(this.labels.domElement);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 2000);
    this.camera.position.set(0, 2, 22);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 600;

    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    this.scene.background = new THREE.Color('#070a12');
    this.scene.fog = new THREE.FogExp2('#070a12', 0.0);

    const hemi = new THREE.HemisphereLight('#cfe3ff', '#20141a', 0.7);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight('#fff3e2', 2.4);
    key.position.set(-8, 14, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = key.shadow.camera.bottom = -25;
    key.shadow.camera.right = key.shadow.camera.top = 25;
    key.shadow.camera.far = 80;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#7fb2ff', 1.3);
    rim.position.set(10, -4, -12);
    this.scene.add(rim);
    this.scene.add(this.world);

    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.gtao = new GTAOPass(this.scene, this.camera, 1, 1);
    this.gtao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1.2, scale: 1.0, samples: 16 });
    this.gtao.blendIntensity = 0.85;
    this.composer.addPass(this.gtao);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.4, 2.6);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.setQuality(this.quality);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.loop();
  }

  setQuality(q: 'high' | 'low') {
    this.quality = q;
    this.gtao.enabled = q === 'high';
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, q === 'high' ? 2 : 1.5));
    try { localStorage.setItem('genelab:quality', q); } catch { /* ignore */ }
    this.resize();
  }

  /** scale the AO radius to the scene (nm for molecules, larger for cells) */
  setAoRadius(radius: number) {
    this.gtao.updateGtaoMaterial({ radius });
  }

  setBloom(strength: number) {
    this.bloom.strength = strength;
  }

  resize() {
    const w = Math.max(1, this.host.clientWidth);
    const h = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.labels.setSize(w, h);
    this.composer.setSize(w, h);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onTick(f: Tick) {
    this.ticks.add(f);
    return () => this.ticks.delete(f);
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.25); // keep real time on slow devices
    const t = this.timer.getElapsed();
    for (const f of [...this.ticks]) f(dt, t);
    this.controls.update();
    this.composer.render();
    this.labels.render(this.scene, this.camera);
  };

  /** frame the camera on a point from a direction, animated */
  frame(target: THREE.Vector3, distance: number, dir = new THREE.Vector3(0, 0.12, 1), dur = 0.9) {
    const fromPos = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const toPos = target.clone().add(dir.clone().normalize().multiplyScalar(distance));
    if (dur <= 0) {
      this.camera.position.copy(toPos);
      this.controls.target.copy(target);
      return Promise.resolve();
    }
    let t = 0;
    return new Promise<void>((res) => {
      const off = this.onTick((dt) => {
        t = Math.min(1, t + dt / dur);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.camera.position.lerpVectors(fromPos, toPos, e);
        this.controls.target.lerpVectors(fromTarget, target, e);
        if (t >= 1) { off(); res(); }
      });
    });
  }

  /** normalised device coords of a pointer event */
  ndc(e: { clientX: number; clientY: number }) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  /** where a pointer ray meets a plane (world space) */
  pointOnPlane(e: { clientX: number; clientY: number }, plane: THREE.Plane) {
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(plane, p) ? p : null;
  }

  pick(e: { clientX: number; clientY: number }, objects: THREE.Object3D[]) {
    this.raycaster.setFromCamera(this.ndc(e), this.camera);
    return this.raycaster.intersectObjects(objects, true)[0] ?? null;
  }

  /** an HTML label pinned to a 3D point */
  label(html: string, cls = '') {
    const el = document.createElement('div');
    el.className = 'tag ' + cls;
    el.innerHTML = html;
    const o = new CSS2DObject(el);
    return o;
  }

  /** take objects out of the scene for good, including their HTML labels */
  discard(...objs: (THREE.Object3D | null | undefined)[]) {
    for (const o of objs) {
      if (!o) continue;
      o.parent?.remove(o);
      disposeTree(o);
    }
  }

  clearWorld() {
    for (const c of [...this.world.children]) {
      this.world.remove(c);
      disposeTree(c);
    }
    this.ticks.clear();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.clearWorld();
    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.host.innerHTML = '';
  }
}

/** free GPU buffers and HTML labels of a subtree (geometry shared between clones is kept) */
export function disposeTree(o: THREE.Object3D) {
  o.traverse((n) => {
    if (n instanceof CSS2DObject) n.element.remove();
    const m = n as THREE.Mesh;
    if (m.geometry && !m.geometry.userData.shared) m.geometry.dispose();
  });
}
