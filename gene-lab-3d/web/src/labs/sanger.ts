import * as THREE from 'three';
import type { LabEnv } from '../main';
import { BASE_COLOR } from '../core/dna';
import { loadGlb, loadMolecule, yUp } from '../core/molecule';
import { dragOnView, flash } from '../core/interact';
import { tween, wait } from '../core/tween';
import { h } from '../core/ui';
import { DYE, NEW_STRAND, PRIMER, TEMPLATE_3to5, fragments, type Fragment } from '../content/sanger';

const ST_MOL = new THREE.Vector3(0, 0, 0);
const ST_TUBES = new THREE.Vector3(40, 0, 0);
const ST_GEL = new THREE.Vector3(80, 0, 0);
const ST_CAP = new THREE.Vector3(120, 0, 0);
const BASES = ['A', 'T', 'C', 'G'];

export async function mount({ stage, hud, panel, mission }: LabEnv) {
  stage.setAoRadius(0.5);
  const world = stage.world;

  // ---------------------------------------------------------------- station 1: the real ddCTP in Taq polymerase
  const pol = await loadMolecule('3KTQ');
  world.add(pol.root);
  pol.setOpacity('protein', 0.55);
  const dd = pol.part('ddntp');
  const ddPos = pol.meta.landmarks.ddntp ? yUp(pol.meta.landmarks.ddntp) : new THREE.Vector3();
  const ddTag = stage.label('<b>ddCTP</b><small>クリックして調べる</small>', 'warn');
  ddTag.position.copy(ddPos).add(new THREE.Vector3(0, 1.4, 0));
  pol.root.add(ddTag);
  const polTag = stage.label('<b>Taq DNAポリメラーゼ（Klentaq）</b><small>PDB 3KTQ・鋳型DNA・プライマー・ddCTP の三元複合体</small>');
  polTag.position.set(0, 5.2, 0);
  pol.root.add(polTag);
  stage.frame(ST_MOL.clone().add(new THREE.Vector3(-0.6, 0.3, 0)), 17, new THREE.Vector3(-0.35, 0.25, 1), 0);
  stage.renderer.domElement.addEventListener('pointerdown', (ev) => {
    if (!dd || !stage.pick(ev, [dd])) return;
    inspectDdntp();
  });

  async function inspectDdntp() {
    await stage.frame(pol.root.localToWorld(ddPos.clone()), 6, new THREE.Vector3(-0.4, 0.3, 1));
    await flash(stage, pol.root, ddPos, '#ff4d6d', 0.9);
    mission.complete('ddntp');
    hud.card(`<h4>ddCTP：3'-OH がない「行き止まり」のヌクレオチド</h4>
      <p>赤く光るのが、酵素の中で次に取り込まれようとしている <b>ジデオキシシチジン三リン酸</b>。通常のdNTPは糖の3'位にOH基があり、そこへ次のヌクレオチドがつながります。</p>
      <p>ddNTPは2'と3'の両方にOHがない（ジデオキシ）ので、これを取り込んだ瞬間、その鎖は<b>もう伸びられません</b>。</p>
      <p class="note">講義スライド：デオキシ（3'-OHあり → 鎖が伸長）／ジデオキシ（3'-OHなし → 伸長できない）</p>`);
  }

  // ---------------------------------------------------------------- station 2: four reaction tubes
  const kit = await loadGlb('kit.glb');
  const tubeSrc = kit.getObjectByName('tube')!;
  const tubes: { root: THREE.Object3D; liquid: THREE.Mesh; base: string | null; frags: THREE.Group }[] = [];
  for (let i = 0; i < 4; i++) {
    const t = tubeSrc.clone(true);
    t.position.set(0, 0, 0);
    t.rotation.set(0, 0, 0);
    t.scale.setScalar(1.6);
    const root = new THREE.Group();
    root.position.copy(ST_TUBES).add(new THREE.Vector3((i - 1.5) * 3.2, -1.5, 0));
    root.add(t);
    world.add(root);
    const liquid = t.getObjectByName('tube_liquid') as THREE.Mesh;
    liquid.material = (liquid.material as THREE.Material).clone();
    const tag = stage.label(`チューブ ${i + 1}`);
    tag.position.set(0, -4.4, 0);
    root.add(tag);
    const frags = new THREE.Group();
    frags.position.set(0, 3.6, 0);
    root.add(frags);
    tubes.push({ root, liquid, base: null, frags });
  }
  const mixTag = stage.label('<b>4本とも共通</b><small>鋳型DNA・標識プライマー GCAT・DNAポリメラーゼ・dATP/dTTP/dCTP/dGTP（過剰）</small>');
  mixTag.position.copy(ST_TUBES).add(new THREE.Vector3(0, 8.4, 0));
  world.add(mixTag);

  function dropDdntp(base: string, ev: PointerEvent) {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 14),
      new THREE.MeshStandardMaterial({ color: DYE[base], emissive: DYE[base], emissiveIntensity: 0.8 }));
    world.add(drop);
    let target: (typeof tubes)[number] | null = null;
    dragOnView(stage, ev, ST_TUBES.clone(), {
      move: (p) => {
        drop.position.copy(p);
        target = tubes.reduce((best, t) => (t.root.position.distanceTo(p) < (best ? best.root.position.distanceTo(p) : 4.2) ? t : best), null as (typeof tubes)[number] | null);
        for (const t of tubes) t.root.scale.setScalar(t === target ? 1.06 : 1);
      },
      end: async () => {
        for (const t of tubes) t.root.scale.setScalar(1);
        const tt = target;
        if (tt) {
          const from = drop.position.clone();
          await tween(stage, 0.4, (e) => drop.position.lerpVectors(from, tt.root.position.clone().add(new THREE.Vector3(0, -1, 0)), e));
          tt.base = base;
          (tt.liquid.material as THREE.MeshStandardMaterial).color = new THREE.Color(DYE[base]);
          const tag = tt.root.children.find((c) => (c as { isCSS2DObject?: boolean }).isCSS2DObject) as THREE.Object3D & { element: HTMLElement };
          if (tag) tag.element.innerHTML = `<b>dd${base}TP</b>`;
          const all = tubes.every((t) => t.base) && new Set(tubes.map((t) => t.base)).size === 4;
          if (all) {
            mission.complete('tubes');
            reactBtn.disabled = false;
            hud.status('4本そろいました。「反応させる」を押しましょう。', 'good');
          } else if (tubes.every((t) => t.base)) {
            hud.status('同じddNTPが2本に入っています。4種類を1本ずつにしてください。', 'warn');
          }
        }
        stage.discard(drop);
      },
    });
  }

  // fragment drawn as beads: primer (orange) + copied bases + the glowing ddNTP that stopped it
  const bead = new THREE.SphereGeometry(0.16, 14, 10);
  const beadMat = new Map<string, THREE.Material>();
  const bm = (c: string, glow = false) => {
    const k = c + glow;
    if (!beadMat.has(k)) beadMat.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, emissive: glow ? c : '#000', emissiveIntensity: glow ? 2.2 : 0 }));
    return beadMat.get(k)!;
  };
  function fragmentMesh(f: Fragment, dye: boolean, vertical = false) {
    const g = new THREE.Group();
    const all = PRIMER + f.seq;
    [...all].forEach((b, i) => {
      const last = i === all.length - 1;
      const m = new THREE.Mesh(bead, i < PRIMER.length ? bm('#f59f00') : last ? bm(dye ? DYE[b] : '#ff3d8b', true) : bm(BASE_COLOR[b]));
      if (vertical) m.position.y = i * 0.3;
      else m.position.x = i * 0.34;
      if (last) m.scale.setScalar(1.5);
      g.add(m);
    });
    g.userData.frag = f;
    return g;
  }

  async function react() {
    reactBtn.disabled = true;
    hud.status('ポリメラーゼが鋳型を写し取っていき、ときどきddNTPを取り込んで止まります…');
    for (const t of tubes) {
      fragments(t.base!).forEach((f, j, all) => {
        const g = fragmentMesh(f, false, true);
        g.position.set((j - (all.length - 1) / 2) * 0.6, 0, 0);
        g.scale.setScalar(0.001);
        t.frags.add(g);
      });
    }
    await tween(stage, 1.2, (e) => tubes.forEach((t) => t.frags.children.forEach((g) => g.scale.setScalar(Math.max(0.001, e)))));
    mission.complete('react');
    hud.card(`<h4>止まった断片ができました</h4>
      <p>鋳型 3'-${TEMPLATE_3to5}-5' にプライマー <b>${PRIMER}</b> が結合し、その先を写し取ります。</p>
      <p>例えば dd<b>A</b>TP のチューブには、<b>A</b> の位置で止まった断片だけ（${fragments('A').map((f) => f.length).join('・')} 塩基）が集まります。光っている粒が、鎖を止めたddNTPです。</p>
      <p class="note">次は「電気泳動」で、断片を長さの順に並べます。</p>`);
    hud.status('');
    gelBtn.disabled = false;
  }

  // ---------------------------------------------------------------- station 3: the gel
  const gel = new THREE.Group();
  gel.position.copy(ST_GEL);
  world.add(gel);
  const GEL_H = 14;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(13, GEL_H, 0.6),
    new THREE.MeshPhysicalMaterial({ color: '#9fb4d0', roughness: 0.25, transmission: 0.6, transparent: true, opacity: 0.45, thickness: 0.6 }));
  gel.add(slab);
  const laneX = (i: number) => (i - 1.5) * 3;
  for (let i = 0; i < 4; i++) {
    const well = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.65), new THREE.MeshStandardMaterial({ color: '#1b2233' }));
    well.position.set(laneX(i), GEL_H / 2 - 0.5, 0.01);
    gel.add(well);
  }
  const minus = stage.label('<b>－</b>', 'plain');
  minus.position.set(-7.5, GEL_H / 2, 0);
  const plus = stage.label('<b>＋</b>', 'plain');
  plus.position.set(-7.5, -GEL_H / 2, 0);
  gel.add(minus, plus);
  const laneTags: THREE.Object3D[] = [];
  const bands: THREE.Mesh[] = [];
  let readIdx = 0;
  let readOut = '';

  async function runGel() {
    gelBtn.disabled = true;
    await stage.frame(ST_GEL.clone(), 26, new THREE.Vector3(0, 0.1, 1));
    tubes.forEach((t, i) => {
      const tag = stage.label(`<b>dd${t.base}</b>`, 'plain');
      tag.position.set(laneX(i), GEL_H / 2 + 0.9, 0);
      gel.add(tag);
      laneTags.push(tag);
    });
    hud.status('DNAはリン酸のマイナス電荷で＋極へ。短い断片ほどゲルの網目を速くすり抜けます…');
    const travel = (len: number) => (GEL_H - 1.6) * (1 - (len - 1) / NEW_STRAND.length) * 0.95;
    tubes.forEach((t, i) => fragments(t.base!).forEach((f) => {
      const band = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.28, 0.66),
        new THREE.MeshStandardMaterial({ color: '#ff3d8b', emissive: '#ff3d8b', emissiveIntensity: 1.6 }));
      band.position.set(laneX(i), GEL_H / 2 - 0.5, 0.02);
      band.userData = { frag: f, lane: i, to: GEL_H / 2 - 0.8 - travel(f.length) };
      gel.add(band);
      bands.push(band);
    }));
    await tween(stage, 3.5, (e) => bands.forEach((b) => (b.position.y = GEL_H / 2 - 0.5 + (b.userData.to - (GEL_H / 2 - 0.5)) * e)), (t) => t);
    mission.complete('gel');
    hud.status('下（いちばん短い断片）から順に、バンドをクリックして読み取ってください。');
    reading = true;
  }

  let reading = false;
  const readEl = h('div', { class: 'seqline read' }, '5\'-');
  stage.renderer.domElement.addEventListener('pointerdown', async (ev) => {
    if (!reading) return;
    const hit = stage.pick(ev, bands);
    if (!hit) return;
    const b = hit.object as THREE.Mesh;
    const f = b.userData.frag as Fragment;
    if (f.length !== readIdx + 1) {
      hud.toast(f.length <= readIdx ? 'そのバンドはもう読みました。' : 'もっと下（短い断片）にまだ読んでいないバンドがあります。', 'bad');
      return;
    }
    readIdx++;
    readOut += f.base;
    readEl.innerHTML = `5'-${[...readOut].map((c) => `<span class="b-${c}">${c}</span>`).join('')}`;
    (b.material as THREE.MeshStandardMaterial).emissive = new THREE.Color('#ffffff');
    flash(stage, gel, b.position, '#ffffff', 0.5, 0.5);
    if (readIdx === NEW_STRAND.length) {
      reading = false;
      mission.complete('read');
      hud.card(`<h4>読めました：5'-${readOut}-3'</h4>
        <p>ゲルの下（短い）から上（長い）へ読むと、新しく合成された鎖が <b>5'→3'</b> の順に並びます。</p>
        <div class="seqline">鋳型   3'-${TEMPLATE_3to5}-5'\n新しい鎖 5'-${PRIMER}<b>${readOut}</b>-3'</div>
        <p>鋳型とぴったり相補的。これが講義スライドの「ゲルの下から上へ読み取ると ATGTCAGTCCAG」です。</p>`);
      hud.status('');
      capBtn.disabled = false;
    }
  });

  // ---------------------------------------------------------------- station 4: 4-colour capillary
  const cap = new THREE.Group();
  cap.position.copy(ST_CAP);
  world.add(cap);
  const CAP_L = 26;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, CAP_L, 32, 1, true),
    new THREE.MeshPhysicalMaterial({ color: '#cfe3ff', roughness: 0.1, transmission: 0.85, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  glass.rotation.z = Math.PI / 2;
  cap.add(glass);
  const detX = CAP_L / 2 - 3;
  const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#7ab8ff').multiplyScalar(3), toneMapped: false }));
  laser.position.set(detX, 2.2, 0);
  cap.add(laser);
  const detTag = stage.label('<b>レーザーと検出器</b><small>通過した断片の色を読む</small>');
  detTag.position.set(detX, 5.6, 0);
  cap.add(detTag);
  const chrom = h('canvas', { class: 'chart', width: 720, height: 240, hidden: true }) as HTMLCanvasElement;

  async function runCapillary() {
    capBtn.disabled = true;
    await stage.frame(ST_CAP.clone().add(new THREE.Vector3(3, 0, 0)), 30, new THREE.Vector3(0, 0.15, 1));
    chrom.hidden = false;
    const g = chrom.getContext('2d')!;
    g.clearRect(0, 0, chrom.width, chrom.height);
    const frags = BASES.flatMap((b) => fragments(b)).sort((a, b) => a.length - b.length);
    const meshes = frags.map((f) => {
      const m = fragmentMesh(f, true);
      m.scale.setScalar(0.55);
      cap.add(m);
      return m;
    });
    hud.status('4種類のddNTPを別々の色素で標識し、1本の細い管で泳動。検出器を短い順に通過します。');
    // fragment i reaches the detector at time ~ i
    const speed = (len: number) => 1 / (0.75 + 0.18 * len);
    const total = 9;
    const seen = new Set<number>();
    const peaks: { t: number; base: string }[] = [];
    await tween(stage, total, (_e, t) => {
      const T = t * total;
      meshes.forEach((m, i) => {
        const f = frags[i];
        const x = -CAP_L / 2 + T * speed(f.length) * 6.0;
        m.position.set(x, 0, 0);
        m.visible = x < CAP_L / 2;
        if (x >= detX && !seen.has(i)) {
          seen.add(i);
          peaks.push({ t: T, base: f.base });
          flash(stage, cap, new THREE.Vector3(detX, 0, 0), DYE[f.base], 0.8, 0.4);
        }
      });
      drawChrom(g, peaks, T, total);
    }, (x) => x);
    mission.complete('capillary');
    hud.card(`<h4>キャピラリーで読んだ配列：${peaks.map((p) => p.base).join('')}</h4>
      <p>4色の蛍光を1本の管で順に読むので、ゲルの4レーンが1本にまとまります（講義のABIシーケンサー）。波形の山の色が塩基、並び順が配列です。</p>
      <p class="note">色：A 緑・T 赤・C 青・G 黄（実機では黒で表示されることが多い）</p>`);
    hud.status('');
  }

  function drawChrom(g: CanvasRenderingContext2D, peaks: { t: number; base: string }[], now: number, total: number) {
    const W = chrom.width, H = chrom.height;
    g.clearRect(0, 0, W, H);
    const X = (t: number) => 20 + (t / total) * (W - 40);
    for (const b of BASES) {
      g.strokeStyle = DYE[b];
      g.lineWidth = 3;
      g.beginPath();
      for (let x = 0; x <= now; x += total / 400) {
        let y = 0;
        for (const p of peaks) if (p.base === b) y += Math.exp(-((x - p.t) ** 2) / 0.012);
        const py = H - 24 - y * (H - 70);
        if (x === 0) g.moveTo(X(x), py); else g.lineTo(X(x), py);
      }
      g.stroke();
    }
    g.font = 'bold 22px ui-monospace, monospace';
    for (const p of peaks) { g.fillStyle = DYE[p.base]; g.fillText(p.base, X(p.t) - 7, 26); }
  }

  // ---------------------------------------------------------------- panel
  const ddCards = BASES.map((b) => {
    const c = h('button', { class: 'tool', style: `--c:${DYE[b]}`, 'draggable-3d': true },
      h('b', {}, `dd${b}TP`), h('small', {}, 'チューブへドラッグ'));
    c.addEventListener('pointerdown', async (ev) => {
      ev.preventDefault();
      if (stage.camera.position.distanceTo(ST_TUBES) > 40) await stage.frame(ST_TUBES.clone().add(new THREE.Vector3(0, 1.5, 0)), 24, new THREE.Vector3(0, 0.2, 1), 0.01);
      dropDdntp(b, ev);
    });
    return c;
  });
  const goto = (p: THREE.Vector3, d: number) => () => stage.frame(p.clone(), d, new THREE.Vector3(0, 0.2, 1));
  const reactBtn = h('button', { class: 'primary', disabled: true, onclick: react }, '反応させる');
  const gelBtn = h('button', { class: 'primary', disabled: true, onclick: runGel }, '電気泳動');
  const capBtn = h('button', { class: 'primary', disabled: true, onclick: runCapillary }, '4色キャピラリーで読む');
  panel.append(
    h('a', { class: 'quiz-btn', href: `${import.meta.env.BASE_URL}film.html?id=sanger`, style: 'text-align:center;text-decoration:none' }, '▶ 授業動画で流れを見る（約7分）'),
    h('h3', {}, '1. 本物のddNTPを見る'),
    h('div', { class: 'row' }, h('button', { class: 'ghost small', onclick: inspectDdntp }, 'ddCTPを拡大'),
      h('button', { class: 'ghost small', onclick: () => pol.setOpacity('protein', (pol.part('protein')!.material as THREE.Material).opacity > 0.9 ? 0.55 : 1) }, 'タンパク質の透明度')),
    h('h3', {}, '2. ddNTPを1本ずつ入れる'),
    h('div', { class: 'row' }, h('button', { class: 'ghost small', onclick: goto(ST_TUBES.clone().add(new THREE.Vector3(0, 1.5, 0)), 24) }, 'チューブへ移動')),
    h('div', { class: 'tool-grid' }, ...ddCards),
    reactBtn,
    h('h3', {}, '3. 電気泳動 → 下から読む'),
    gelBtn,
    readEl,
    h('h3', {}, '4. 現代の方法'),
    capBtn,
    chrom);
  await wait(stage, 0.1);
  hud.status('赤く光る <b>ddCTP</b> をクリックして、なぜ合成が止まるのか調べましょう。');
}
