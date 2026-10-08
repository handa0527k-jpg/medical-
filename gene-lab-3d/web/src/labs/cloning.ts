import * as THREE from 'three';
import type { LabEnv } from '../main';
import type { Stage } from '../core/stage';
import { loadGlb } from '../core/molecule';
import { dragOnView, flash } from '../core/interact';
import { tween, wait } from '../core/tween';
import { h } from '../core/ui';

const R = 3.2; // plasmid ring radius in the kit
const MCS_DEG = 88;
const ST_PLASMID = new THREE.Vector3(0, 0, 0);
const ST_CELL = new THREE.Vector3(34, 0, 0);
const ST_DISH = new THREE.Vector3(72, 0, 0);
const ORANGE = ['#f6b93b', '#e58e26'];

/** HTML labels for the LBL_* empties Blender put in the kit (glTF extras) */
function kitLabels(stage: Stage, root: THREE.Object3D) {
  root.traverse((o) => {
    if (!o.name.startsWith('LBL_') || !o.userData.label) return;
    const t = stage.label(`<b>${o.userData.label}</b>${o.userData.sub ? `<small>${o.userData.sub}</small>` : ''}`);
    o.add(t);
  });
}

/** twisted double strand along a circular arc (the look of the kit's plasmid DNA) */
function dsArc(radius: number, a0: number, a1: number, colors = ORANGE, turns = 46) {
  const g = new THREE.Group();
  for (const [si, col] of colors.entries()) {
    const pts: THREE.Vector3[] = [];
    const n = Math.max(8, Math.round(Math.abs(a1 - a0) * 2.2));
    for (let i = 0; i <= n; i++) {
      const a = THREE.MathUtils.degToRad(a0 + ((a1 - a0) * i) / n);
      const tw = turns * a + si * Math.PI;
      const radial = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
      pts.push(radial.clone().multiplyScalar(radius).addScaledVector(radial, 0.13 * Math.cos(tw)).add(new THREE.Vector3(0, 0, 0.13 * Math.sin(tw))));
    }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.07, 6, false),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 }));
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

export async function mount({ stage, hud, panel, mission }: LabEnv) {
  stage.setAoRadius(0.35);
  const world = stage.world;
  const kit = await loadGlb('kit.glb');

  // ---------------------------------------------------------------- station 1: pUC18
  const plasmid = kit.getObjectByName('plasmid')!.clone(true);
  plasmid.position.copy(ST_PLASMID);
  world.add(plasmid);
  kitLabels(stage, plasmid);
  const plDna = plasmid.getObjectByName('plasmid_dna')!;
  const plMcs = plasmid.getObjectByName('plasmid_mcs')!;
  const note = stage.label('<small>模式図：実際のpUC18は直径約0.3 µmの環（2,686 bp）</small>', 'plain');
  note.position.set(0, -R - 1.6, 0);
  plasmid.add(note);
  const mcsPos = new THREE.Vector3(Math.cos(THREE.MathUtils.degToRad(MCS_DEG)) * R, Math.sin(THREE.MathUtils.degToRad(MCS_DEG)) * R, 0);
  stage.frame(ST_PLASMID.clone(), 19, new THREE.Vector3(0, 0.1, 1), 0);

  let opened: THREE.Group | null = null;
  let recombinant: THREE.Group | null = null;
  let stage1: 'intact' | 'open' | 'inserted' | 'ligated' | 'inside' = 'intact';

  function cardDrag(make: () => THREE.Object3D, anchor: THREE.Vector3, accept: (p: THREE.Vector3) => boolean,
    onDrop: (obj: THREE.Object3D) => Promise<void>, hint: string) {
    return (ev: PointerEvent) => {
      ev.preventDefault();
      const obj = make();
      world.add(obj);
      hud.status(hint);
      let ok = false;
      dragOnView(stage, ev, anchor, {
        move: (p) => {
          obj.position.copy(p);
          ok = accept(p);
          obj.scale.setScalar(ok ? 1.15 : 1);
        },
        end: async () => {
          if (!ok) {
            stage.discard(obj);
            hud.status('');
            return;
          }
          await onDrop(obj);
        },
      });
    };
  }

  const scissors = () => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ color: '#f4a259', roughness: 0.4, emissive: '#f4a259', emissiveIntensity: 0.25 }));
    g.add(m);
    const t = stage.label('<b>BamHI</b>');
    t.position.y = 0.9;
    g.add(t);
    return g;
  };

  // where the MCS is right now (the learner may have moved or turned the plasmid)
  const mcsWorld = () => plasmid.localToWorld(mcsPos.clone());
  const openPlasmid = cardDrag(scissors, ST_PLASMID, (p) => stage1 === 'intact' && p.distanceTo(mcsWorld()) < 1.6 * plasmid.scale.x, async (obj) => {
    obj.position.copy(mcsWorld());
    await flash(stage, plasmid, mcsPos, '#ff8a8a', 0.8);
    stage.discard(obj);
    plDna.visible = false;
    plMcs.visible = false;
    opened = dsArc(R, MCS_DEG + 7, MCS_DEG - 7 + 360);
    plasmid.add(opened);
    stage1 = 'open';
    mission.complete('open');
    hud.status('');
    hud.card(`<h4>プラスミドが開きました</h4><p>pUC18のマルチクローニングサイトにはBamHIサイト（GGATCC）が1つだけ。切ると環が開き、両端にGATCの付着末端ができます。</p>
      <p class="note">次は、同じBamHIで切り出した遺伝子（赤）を、開いたすき間へドラッグ。</p>`);
    insertCard.disabled = false;
  }, 'BamHIをマルチクローニングサイト（白い帯）まで運んでください。');

  const insertPiece = () => {
    const g = dsArc(R, MCS_DEG + 9, MCS_DEG - 9, ['#ff5c6c', '#c9184a']);
    g.children.forEach((c) => c.position.sub(mcsPos));
    const t = stage.label('<b>目的遺伝子</b><small>BamHIで切り出した断片</small>');
    t.position.y = 1.2;
    g.add(t);
    return g;
  };
  const insertGene = cardDrag(insertPiece, ST_PLASMID, (p) => stage1 === 'open' && p.distanceTo(mcsWorld()) < 1.8 * plasmid.scale.x, async (obj) => {
    stage.discard(obj);
    stage.discard(opened);
    opened = null;
    // the recombinant ring is a little bigger: vector (orange) + insert (red)
    const R2 = R * 1.12;
    recombinant = new THREE.Group();
    recombinant.add(dsArc(R2, MCS_DEG + 20, MCS_DEG - 20 + 360), dsArc(R2, MCS_DEG - 20, MCS_DEG + 20, ['#ff5c6c', '#c9184a']));
    plasmid.add(recombinant);
    plasmid.getObjectByName('plasmid_genes')!.scale.setScalar(1.12);
    stage1 = 'inserted';
    mission.complete('insert', '遺伝子を差し込んだ');
    ligateBtn.disabled = false;
    hud.status('付着末端どうしが仮どめされました。リガーゼで2か所の切れ目をつなぎましょう。');
  }, '赤い遺伝子を、開いたすき間へ運んでください。');

  async function ligate() {
    if (stage1 !== 'inserted') return;
    ligateBtn.disabled = true;
    const R2 = R * 1.12;
    for (const d of [MCS_DEG - 20, MCS_DEG + 20]) {
      const a = THREE.MathUtils.degToRad(d);
      await flash(stage, plasmid, new THREE.Vector3(Math.cos(a) * R2, Math.sin(a) * R2, 0), '#9dffcf', 0.6, 0.6);
    }
    stage1 = 'ligated';
    hud.status('');
    hud.card(`<h4>組換えプラスミドの完成</h4><p>BamHIサイトは <b>lacZ</b> 遺伝子の中にあるので、遺伝子が入ると lacZ（β-ガラクトシダーゼ）が壊れます。これを使って、挿入があるかどうかを色（青白選択）で見分けられます。</p>
      <p class="note">次は、このプラスミドを大腸菌へドラッグして入れます（形質転換）。</p>`);
    const both = plasmid.position.clone().add(cell.position).multiplyScalar(0.5);
    const span = plasmid.position.distanceTo(cell.position) / 2 + 10;
    const dist = span / Math.max(0.6, stage.camera.aspect) / Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2));
    await stage.frame(both, dist, new THREE.Vector3(0, 0.15, 1));
  }

  // ---------------------------------------------------------------- station 2: E. coli
  const ecoliSrc = kit.getObjectByName('ecoli')!;
  const cell = ecoliSrc.clone(true);
  cell.position.copy(ST_CELL);
  cell.scale.setScalar(3.2);
  world.add(cell);
  kitLabels(stage, cell);
  stage.renderer.domElement.addEventListener('pointerdown', (ev) => {
    if (stage1 !== 'ligated' || !stage.pick(ev, [plasmid])) return;
    const start = plasmid.position.clone();
    let inside = false;
    dragOnView(stage, ev, start, {
      move: (p) => {
        plasmid.position.copy(p);
        inside = p.distanceTo(cell.position) < 2 * cell.scale.x;
        const s = inside ? 0.28 : 0.6;
        plasmid.scale.setScalar(s);
      },
      end: async () => {
        if (!inside) {
          plasmid.position.copy(start);
          plasmid.scale.setScalar(1);
          return;
        }
        stage1 = 'inside';
        const into = cell.localToWorld(new THREE.Vector3(0.7, 0.12, 0.2));
        await tween(stage, 0.6, (e) => plasmid.position.lerp(into, e));
        await flash(stage, world, cell.position, '#ffd166', 4, 0.8);
        plasmid.traverse((o) => { if ((o as THREE.Object3D & { isCSS2DObject?: boolean }).isCSS2DObject) o.visible = false; });
        mission.complete('transform');
        hud.card(`<h4>形質転換</h4><p>塩化カルシウムで処理した大腸菌に42℃の熱ショックを与えると、一部の菌がプラスミドを取り込みます。取り込める菌はごく一部（多くて数千分の1程度）。</p>
          <p class="note">次は、プラスミドを持つ菌だけを選びます。左の「アンピシリン培地にまく」へ。</p>`);
        plateBtn.disabled = false;
      },
    });
  });

  // ---------------------------------------------------------------- station 3: the plate
  const dish = new THREE.Group();
  dish.position.copy(ST_DISH);
  world.add(dish);
  const agar = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.6, 64), new THREE.MeshStandardMaterial({ color: '#d9b26f', roughness: 0.6 }));
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(9.3, 9.3, 1.4, 64, 1, true), new THREE.MeshPhysicalMaterial({ color: '#e7f2ff', transparent: true, opacity: 0.25, roughness: 0.05, side: THREE.DoubleSide }));
  rim.position.y = 0.4;
  dish.add(agar, rim);
  dish.rotation.x = 0.55;
  const rng = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const cells: { obj: THREE.Object3D; has: boolean; pos: THREE.Vector3 }[] = [];
  for (let i = 0; i < 18; i++) {
    const c = ecoliSrc.clone(true);
    c.scale.setScalar(0.55);
    const a = rng() * Math.PI * 2, r = 1.5 + rng() * 6.2;
    const pos = new THREE.Vector3(Math.cos(a) * r, 0.75, Math.sin(a) * r);
    c.position.copy(pos);
    c.rotation.y = rng() * Math.PI;
    c.traverse((o) => { if (o.name.startsWith('LBL_')) o.visible = false; });
    const has = i % 5 === 0;
    if (has) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.09, 8, 24), new THREE.MeshStandardMaterial({ color: '#ff5c6c', emissive: '#ff5c6c', emissiveIntensity: 0.6 }));
      ring.position.set(0.6, 0, 0);
      c.add(ring);
    }
    dish.add(c);
    cells.push({ obj: c, has, pos });
  }
  dish.visible = false;

  async function plate() {
    plateBtn.disabled = true;
    dish.visible = true;
    await stage.frame(ST_DISH.clone(), 26, new THREE.Vector3(0, 0.5, 1));
    hud.status('アンピシリンは細胞壁の合成を妨げます。Amp^r（βラクタマーゼ）を持たない菌は増えられません…');
    await wait(stage, 1.2);
    const dead = cells.filter((c) => !c.has);
    await tween(stage, 1.8, (e) => dead.forEach((c) => c.obj.scale.setScalar(Math.max(0.001, 0.55 * (1 - e)))));
    dead.forEach((c) => (c.obj.visible = false));
    mission.complete('select');
    const alive = cells.filter((c) => c.has).length;
    hud.status('');
    hud.card(`<h4>選択：生き残ったのは ${alive} 個</h4><p>プラスミド（赤い環）を持つ菌だけが、Amp^r 遺伝子のおかげでアンピシリンの中でも生きられます。</p>
      <p class="note">左の「培養時間」を動かして、菌を増やしましょう（約20分で1回分裂）。</p>`);
    growSlider.disabled = false;
  }

  // colonies grow as instanced cells around each survivor
  const MAX_SHOWN = 900;
  const colonyMesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.09, 0.22, 4, 8), new THREE.MeshStandardMaterial({ color: '#9ad0c2', roughness: 0.5 }), MAX_SHOWN);
  colonyMesh.count = 0;
  dish.add(colonyMesh);
  const colonyCount = h('div', { class: 'counts' });
  function grow(hours: number) {
    const gens = Math.floor(hours * 3);
    const perColony = Math.pow(2, gens);
    const survivors = cells.filter((c) => c.has);
    const shownPer = Math.min(Math.floor(MAX_SHOWN / survivors.length), perColony);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let n = 0;
    survivors.forEach((c, ci) => {
      const rad = 0.3 + Math.cbrt(shownPer) * 0.16;
      for (let i = 0; i < shownPer; i++) {
        const u = (i * 0.618 + ci * 0.31) % 1, v = (i * 0.414) % 1;
        const r = rad * Math.sqrt(u), a = 2 * Math.PI * v;
        const hgt = 0.35 + (1 - u) * Math.min(1.2, rad * 0.5) * (i / shownPer);
        q.setFromEuler(new THREE.Euler(0, a * 3, Math.PI / 2));
        m.compose(c.pos.clone().add(new THREE.Vector3(Math.cos(a) * r, hgt, Math.sin(a) * r)), q, new THREE.Vector3(1, 1, 1));
        colonyMesh.setMatrixAt(n++, m);
      }
    });
    colonyMesh.count = n;
    colonyMesh.instanceMatrix.needsUpdate = true;
    const total = perColony * survivors.length;
    colonyCount.innerHTML = `<div><span>時間</span><b>${hours.toFixed(1)} h</b></div><div><span>分裂回数</span><b>${gens}</b></div><div><span>菌の数</span><b>${total > 1e6 ? total.toExponential(2).replace('e+', '×10^') : total.toLocaleString()}</b></div>`;
    if (hours >= 10) {
      mission.complete('grow', '10時間で 2^30 ≒ 10億倍');
      purifyBtn.disabled = false;
    }
  }

  async function purify() {
    purifyBtn.disabled = true;
    hud.status('アルカリ溶液で菌を溶かし、ゲノムDNAやタンパク質を除いてプラスミドだけを集めます…');
    const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.22, 0.06, 6, 18),
      new THREE.MeshStandardMaterial({ color: '#ff8fa3', emissive: '#ff5c6c', emissiveIntensity: 0.5 }), 600);
    dish.add(rings);
    const m = new THREE.Matrix4();
    const seeds = Array.from({ length: 600 }, (_, i) => new THREE.Vector3((rng() - 0.5) * 12, 0.8, (rng() - 0.5) * 12).add(new THREE.Vector3(0, 0, 0)).multiplyScalar(i % 2 ? 1 : 0.6));
    await tween(stage, 2.4, (e) => {
      colonyMesh.material.opacity = 1 - e;
      colonyMesh.material.transparent = true;
      seeds.forEach((s, i) => {
        const p = s.clone().add(new THREE.Vector3(0, e * (2 + (i % 7)), 0));
        m.compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(i + e * 3, i * 0.7, 0)), new THREE.Vector3(1, 1, 1).multiplyScalar(Math.min(1, e * 2)));
        rings.setMatrixAt(i, m);
      });
      rings.instanceMatrix.needsUpdate = true;
    });
    colonyMesh.visible = false;
    mission.complete('purify');
    hud.status('');
    hud.card(`<h4>多数のコピーが得られました</h4><p>pUC系プラスミドは1つの菌の中で数百コピーに増えます。10億個の菌 × 数百コピー ＝ 10<sup>11</sup> 個以上の同じ組換えDNA。</p>
      <p>これが「クローニング」：1分子の組換えDNAから、まったく同じDNAを大量に得る方法です。</p>`);
  }

  // ---------------------------------------------------------------- panel
  const toolCard = (label: string, sub: string, color: string, on: (ev: PointerEvent) => void, disabled = false) => {
    const b = h('button', { class: 'tool', style: `--c:${color}`, 'draggable-3d': true, disabled }, h('b', {}, label), h('small', {}, sub));
    b.addEventListener('pointerdown', (ev) => { if (!b.disabled) on(ev); });
    return b;
  };
  const bamCard = toolCard('BamHI', 'G↓GATCC・MCSへドラッグ', '#f4a259', openPlasmid);
  const insertCard = toolCard('目的遺伝子', 'BamHI末端・すき間へドラッグ', '#ff5c6c', insertGene, true);
  const ligateBtn = h('button', { class: 'primary', disabled: true, onclick: ligate }, 'DNAリガーゼでつなぐ');
  const plateBtn = h('button', { class: 'primary', disabled: true, onclick: plate }, 'アンピシリン培地にまく');
  const growSlider = h('input', { type: 'range', min: 0, max: 10, step: 0.1, value: 0, disabled: true, 'aria-label': '培養時間' }) as HTMLInputElement;
  growSlider.addEventListener('input', () => grow(+growSlider.value));
  const purifyBtn = h('button', { class: 'primary', disabled: true, onclick: purify }, '菌を溶かしてプラスミドを取り出す');
  panel.append(
    h('h3', {}, '1. ベクターを開いて、遺伝子を入れる'),
    h('div', { class: 'tool-grid' }, bamCard, insertCard),
    ligateBtn,
    h('h3', {}, '2. 大腸菌へ（形質転換）'),
    h('p', { class: 'note', html: 'できたプラスミドを、<b>3Dの中でつかんで</b>大腸菌の中へドラッグします。' }),
    h('h3', {}, '3. 選ぶ・増やす・取り出す'),
    plateBtn,
    h('label', { class: 'switch' }, '培養時間'), growSlider, colonyCount,
    purifyBtn,
    h('div', { class: 'row' },
      h('button', { class: 'ghost small', onclick: () => stage.frame(plasmid.position.clone(), 19, new THREE.Vector3(0, 0.1, 1)) }, 'プラスミド'),
      h('button', { class: 'ghost small', onclick: () => stage.frame(cell.position.clone(), 26, new THREE.Vector3(0, 0.15, 1)) }, '大腸菌'),
      h('button', { class: 'ghost small', onclick: () => { dish.visible = true; stage.frame(dish.position.clone(), 26, new THREE.Vector3(0, 0.5, 1)); } }, 'シャーレ')));
  grow(0);
  hud.status('BamHI のカードを、プラスミドのマルチクローニングサイト（白い帯）までドラッグしてください。');
}
