import * as THREE from 'three';
import type { LabEnv } from '../main';
import { AtomicDNA } from '../core/dna';
import { loadGlb, loadMolecule, yUp } from '../core/molecule';
import { h } from '../core/ui';

interface Exhibit { name: string; x: number; size: number; obj: THREE.Object3D }

/** visible-spectrum colour of a wavelength (nm), rough CIE fit */
export function wavelengthColor(nm: number) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  const fade = nm < 420 ? 0.35 + 0.65 * (nm - 350) / 70 : nm > 680 ? 0.35 + 0.65 * (750 - nm) / 70 : 1;
  return new THREE.Color(Math.max(0, r) * fade, Math.max(0, g) * fade, Math.max(0, b) * fade);
}

/** wild-type GFP excitation: main peak 395 nm, smaller one at 475 nm */
export const gfpExcitation = (nm: number) => Math.exp(-(((nm - 395) / 24) ** 2)) + 0.35 * Math.exp(-(((nm - 475) / 18) ** 2));

export async function mount({ stage, hud, panel, mission }: LabEnv) {
  stage.setAoRadius(1.0);
  stage.controls.maxDistance = 1500;
  const world = stage.world;
  const [gfp, aav, kit] = await Promise.all([loadMolecule('1EMA'), loadMolecule('1LP3'), loadGlb('kit.glb')]);

  const exhibits: Exhibit[] = [];
  const add = (e: Exhibit, label: string) => {
    e.obj.position.x = e.x;
    world.add(e.obj);
    const t = stage.label(label);
    t.position.set(e.x, -e.size * 0.62 - 0.6, 0);
    world.add(t);
    exhibits.push(e);
  };

  const dna = new AtomicDNA('GCGAATTCGCGA');
  const dnaRoot = new THREE.Group();
  dna.position.x = -dna.length / 2;
  dnaRoot.add(dna);
  add({ name: 'DNA', x: 0, size: 4, obj: dnaRoot }, '<b>DNA</b><small>直径 2 nm（PDB 1BNAの型）</small>');
  gfp.setOpacity('protein', 0.5);
  add({ name: 'GFP', x: 8, size: 5, obj: gfp.root }, '<b>GFP</b><small>約 2.4 × 4.2 nm（PDB 1EMA）</small>');
  add({ name: 'AAV', x: 42, size: 26, obj: aav.root }, '<b>AAV2</b><small>約25 nm・ssDNA 約5 kb（PDB 1LP3）</small>');
  const adeno = kit.getObjectByName('adeno')!.clone(true);
  adeno.position.set(0, 0, 0);
  add({ name: 'アデノウイルス', x: 150, size: 140, obj: adeno }, '<b>アデノウイルス</b><small>70〜90 nm・dsDNA 約36 kb（模式図・実寸）</small>');
  const retro = kit.getObjectByName('retro')!.clone(true);
  retro.position.set(0, 0, 0);
  retro.rotation.y = -0.5;
  add({ name: 'レトロウイルス', x: 330, size: 125, obj: retro }, '<b>レトロウイルス</b><small>80〜130 nm・ssRNA 8〜9 kb（模式図・実寸）</small>');
  for (const o of [adeno, retro]) o.traverse((n) => { if (n.name.startsWith('LBL_')) n.visible = false; });

  // ---------------------------------------------------------------- magnification
  let seenMin = false, seenMax = false;
  function focus(v: number, dur = 0) {
    const i = Math.min(exhibits.length - 2, Math.floor(v));
    const f = v - i;
    const a = exhibits[i], b = exhibits[i + 1];
    const x = a.x + (b.x - a.x) * f;
    const size = Math.exp(Math.log(a.size) + (Math.log(b.size) - Math.log(a.size)) * f);
    const dist = size * 1.9 / Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2)) / Math.max(1, stage.camera.aspect) * 0.75;
    stage.frame(new THREE.Vector3(x, 0, 0), Math.max(5, dist), new THREE.Vector3(0.18, 0.18, 1), dur);
    scaleOut.textContent = `視野の幅 ≈ ${Math.round(size * 2.6)} nm`;
    if (v < 0.15) seenMin = true;
    if (v > exhibits.length - 1.2) seenMax = true;
    if (seenMin && seenMax) mission.complete('zoom', 'DNAからウイルスまで大きさを比べた');
  }

  stage.renderer.domElement.addEventListener('pointerdown', (ev) => {
    const hit = stage.pick(ev, [aav.root, retro]);
    if (!hit) return;
    let o: THREE.Object3D | null = hit.object;
    while (o && o !== aav.root && o !== retro) o = o.parent;
    if (o === aav.root) {
      mission.complete('aav');
      hud.card(`<h4>AAV2カプシド：60個のサブユニットの正二十面体</h4>
        <p>同じタンパク質（VP1/VP2/VP3）が60個、正二十面体の対称（T=1）で並んだ殻です。外側に色が明るい「3回軸の突起」と、くぼんだ「2回軸のくぼみ」、5回軸の小さな穴が見えます。</p>
        <p>中には約4.7 kbの一本鎖DNAが入ります。小さく、病原性がなく、多くは宿主染色体に組み込まれずに長く発現するため、遺伝子治療で最もよく使われるベクターの一つです（講義：AAVは P1 レベル）。</p>
        <p class="note">これはX線結晶構造（PDB 1LP3）の非対称単位を60回コピーした生物学的集合体の表面です。</p>`);
    } else if (o === retro) {
      mission.complete('cutaway');
      hud.card(`<h4>レトロウイルス（切り欠き・模式図）</h4>
        <p>脂質の膜（エンベロープ）に糖タンパク質の突起。中のコアに<b>一本鎖RNAゲノムが2コピー</b>入っています（オレンジ）。</p>
        <p>感染すると逆転写酵素でRNAをDNAにし、インテグラーゼで<b>宿主の染色体に組み込みます</b>。だから長期間発現しますが、組み込む場所によってはがん遺伝子を活性化する危険（挿入変異）もあります。</p>`);
    }
  });

  // ---------------------------------------------------------------- GFP excitation
  const chromo = gfp.part('chromophore');
  const chromoMat = chromo ? (chromo.material as THREE.MeshStandardMaterial) : null;
  if (chromoMat) { chromoMat.toneMapped = false; chromoMat.emissiveIntensity = 0.2; }
  const chromoPos = gfp.meta.landmarks.chromophore ? yUp(gfp.meta.landmarks.chromophore) : new THREE.Vector3();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.7, 5, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: '#4c6bff', transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  // a cone of excitation light coming in from the upper left, narrowing onto the barrel
  beam.position.set(8 - 2.6, 3.4, -1.2);
  beam.rotation.z = Math.PI / 4;
  world.add(beam);
  const glowLight = new THREE.PointLight('#51ff6b', 0, 14, 1.5);
  glowLight.position.copy(chromoPos).add(new THREE.Vector3(8, 0, 0));
  world.add(glowLight);
  let lightOn = false;
  function updateLight() {
    const nm = +nmSlider.value;
    const c = wavelengthColor(nm);
    nmOut.textContent = `${nm} nm`;
    nmOut.style.color = '#' + c.getHexString();
    const e = lightOn ? gfpExcitation(nm) : 0;
    (beam.material as THREE.MeshBasicMaterial).color = c.clone().multiplyScalar(1.6);
    (beam.material as THREE.MeshBasicMaterial).opacity = lightOn ? 0.22 : 0;
    if (chromoMat) chromoMat.emissiveIntensity = 0.2 + e * 9;
    glowLight.intensity = e * 40;
    if (!lightOn) return;
    if (e > 0.3) {
      mission.complete('glow', `${nm} nm の光で GFP が緑（509 nm）に光った`);
      hud.status(`${nm} nm で励起 → 発色団が <b style="color:#51ff6b">509 nm の緑</b>の蛍光を出します。`, 'good');
    } else if (nm > 540) {
      mission.complete('wrong', `${nm} nm では GFP は光らない`);
      hud.status(`${nm} nm の光は発色団に吸収されないので、GFPは光りません（励起は 395 nm と 475 nm 付近）。`, 'warn');
    } else hud.status(`${nm} nm：少しだけ吸収されます。`);
  }

  // ---------------------------------------------------------------- panel
  const scaleOut = h('b', {}, '');
  const zoom = h('input', { type: 'range', min: 0, max: exhibits.length - 1, step: 0.01, value: 0, 'aria-label': '倍率' }) as HTMLInputElement;
  zoom.addEventListener('input', () => focus(+zoom.value));
  const nmSlider = h('input', { type: 'range', min: 350, max: 650, step: 1, value: 395, 'aria-label': '光の波長' }) as HTMLInputElement;
  nmSlider.addEventListener('input', updateLight);
  const nmOut = h('b', { class: 'temp-out' }, '395 nm');
  const lightBtn = h('button', {
    class: 'primary', onclick: () => {
      lightOn = !lightOn;
      lightBtn.textContent = lightOn ? '光を止める' : 'GFPに光を当てる';
      if (lightOn) { zoom.value = '1'; focus(1, 0.8); }
      updateLight();
    },
  }, 'GFPに光を当てる');
  const jump = (i: number, label: string) => h('button', { class: 'ghost small', onclick: () => { zoom.value = String(i); focus(i, 0.8); } }, label);
  panel.append(
    h('h3', {}, '倍率（同じ縮尺で並んでいます）'),
    zoom,
    h('p', { class: 'note' }, scaleOut),
    h('div', { class: 'row' }, jump(0, 'DNA'), jump(1, 'GFP'), jump(2, 'AAV'), jump(3, 'アデノ'), jump(4, 'レトロ')),
    h('p', { class: 'note', html: 'AAVとレトロウイルスは<b>クリック</b>すると詳しく見られます。' }),
    h('h3', {}, 'GFPの蛍光（オワンクラゲ由来・下村脩）'),
    h('div', { class: 'thermo' }, nmOut, nmSlider),
    lightBtn,
    h('p', { class: 'note', html: 'GFPの遺伝子を目的の遺伝子につなぐと、その<b>タンパク質がどこにあるか</b>を生きた細胞のまま光で追えます（講義：pEGFP-N1 ベクター）。' }));
  focus(0, 0);
  updateLight();
  hud.status('左の「倍率」を動かして、DNA → GFP → ウイルスへ。大きさの違いを実感しましょう。');
}
