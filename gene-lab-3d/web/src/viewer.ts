import * as THREE from 'three';
import type { Stage } from './core/stage';
import type { Hud } from './core/hud';
import type { Manipulator } from './core/manipulate';
import { AtomicDNA } from './core/dna';
import { loadGlb, loadMolecule, yUp } from './core/molecule';
import { h } from './core/ui';

const BASE = import.meta.env.BASE_URL;

interface Entry { id: string; kind: 'pdb' | 'kit' | 'dna'; title: string; sub: string; art: string }

export const MODELS: Entry[] = [
  { id: '1BHM', kind: 'pdb', title: 'BamHI–DNA', sub: '制限酵素（G↓GATCC）', art: '1BHM' },
  { id: '1ERI', kind: 'pdb', title: 'EcoRI–DNA', sub: '制限酵素（G↓AATTC）', art: '1ERI' },
  { id: '2E52', kind: 'pdb', title: 'HindIII–DNA', sub: '制限酵素（A↓AGCTT）', art: '2E52' },
  { id: '1DFM', kind: 'pdb', title: 'BglII–DNA', sub: '制限酵素（A↓GATCT）', art: '1DFM' },
  { id: '1X9N', kind: 'pdb', title: 'DNAリガーゼI–DNA', sub: '切れ目をつなぐ酵素', art: '1X9N' },
  { id: '3KTQ', kind: 'pdb', title: 'Taqポリメラーゼ–DNA–ddCTP', sub: 'PCR・サンガー法', art: '3KTQ' },
  { id: '5F9R', kind: 'pdb', title: 'Cas9–sgRNA–DNA', sub: 'ゲノム編集（R-loop）', art: '5F9R' },
  { id: '1EMA', kind: 'pdb', title: 'GFP', sub: '緑色蛍光タンパク質', art: '1EMA' },
  { id: '1LP3', kind: 'pdb', title: 'AAV2カプシド', sub: '遺伝子治療ベクター（60量体）', art: '1LP3' },
  { id: 'bdna', kind: 'dna', title: 'B型DNA（原子模型）', sub: '24塩基対・PDB 1BNAの型から', art: '' },
  { id: 'plasmid', kind: 'kit', title: 'プラスミド pUC18', sub: '模式図', art: 'plasmid' },
  { id: 'ecoli', kind: 'kit', title: '大腸菌', sub: '模式図', art: 'ecoli' },
  { id: 'adeno', kind: 'kit', title: 'アデノウイルス', sub: '模式図・実寸（nm）', art: 'adeno' },
  { id: 'retro', kind: 'kit', title: 'レトロウイルス', sub: '模式図・切り欠き', art: 'retro' },
];

const PART_NAME: Record<string, string> = {
  protein: 'タンパク質', dna: 'DNA', sgrna: 'sgRNA', ddntp: 'ddCTP', amp: 'AMP', chromophore: '発色団',
};
const LANDMARK: Record<string, string> = {
  activeA: '活性部位', activeB: '活性部位', ddntp: 'ddCTP（次に入るヌクレオチド）', fingers: 'フィンガー', amp: 'AMP（アデニル化中間体）',
  hnh: 'HNH（標的鎖を切る）', ruvc: 'RuvC（非標的鎖を切る）', pam: 'PAM（NGG）', sgrna5: "sgRNA 5'末端",
  rec: 'RECローブ', nuc: 'NUCローブ', chromophore: '発色団',
};

export async function mountViewer({ stage, hud, panel, manip, id }: { stage: Stage; hud: Hud; panel: HTMLElement; manip: Manipulator; id?: string }) {
  stage.setAoRadius(0.5);
  let current: THREE.Object3D | null = null;
  let spin = true;
  stage.onTick((dt) => { if (spin && current && manip.mode === 'view') current.rotateY(dt * 0.25); });

  const info = h('div', { class: 'viewer-info' });
  const parts = h('div', { class: 'tools' });
  const list = h('div', { class: 'model-list' });
  const tagsToggle = h('input', { type: 'checkbox', checked: true }) as HTMLInputElement;
  const spinToggle = h('input', { type: 'checkbox', checked: true }) as HTMLInputElement;
  spinToggle.addEventListener('change', () => (spin = spinToggle.checked));
  const tags: THREE.Object3D[] = [];
  tagsToggle.addEventListener('change', () => tags.forEach((t) => (t.visible = tagsToggle.checked)));

  async function show(e: Entry) {
    history.replaceState(null, '', '#/models/' + e.id);
    for (const b of list.children) b.classList.toggle('active', (b as HTMLElement).dataset.id === e.id);
    stage.discard(current);
    tags.length = 0;
    parts.replaceChildren();
    hud.card(null);
    const holder = new THREE.Group();
    let size = 10;
    if (e.kind === 'pdb') {
      const mol = await loadMolecule(e.id);
      // centre the structure on the holder so it turns about its middle
      const box = new THREE.Box3().setFromObject(mol.root);
      const c = box.getCenter(new THREE.Vector3());
      mol.root.position.sub(c);
      holder.add(mol.root);
      size = box.getSize(new THREE.Vector3()).length();
      for (const [k, v] of Object.entries(mol.meta.landmarks)) {
        if (!LANDMARK[k]) continue;
        const t = stage.label(LANDMARK[k], 'warn');
        t.position.copy(yUp(v));
        mol.root.add(t);
        tags.push(t);
      }
      for (const p of mol.meta.parts) {
        const cb = h('input', { type: 'checkbox', checked: true }) as HTMLInputElement;
        const op = h('input', { type: 'range', min: 0.1, max: 1, step: 0.05, value: 1, 'aria-label': `${PART_NAME[p] ?? p}の不透明度` }) as HTMLInputElement;
        const apply = () => mol.setOpacity(p, cb.checked ? +op.value : 0);
        cb.addEventListener('change', apply);
        op.addEventListener('input', apply);
        parts.append(h('div', { class: 'part-row' }, h('label', { class: 'switch' }, cb, PART_NAME[p] ?? p), op));
      }
      info.innerHTML = `<h2>${mol.meta.title}</h2><p>PDB <a href="https://www.rcsb.org/structure/${e.id}" target="_blank" rel="noopener">${e.id}</a> ・ ${mol.meta.cite}</p>
        <p class="note">原子座標からガウス分子表面を計算し、Blenderで陰影（アンビエントオクルージョン）を焼き込んだ実物の形です。大きさは nm 単位。</p>`;
    } else if (e.kind === 'dna') {
      const d = new AtomicDNA('CGCGAATTCGCGATGCAAGCTTGC');
      d.position.x = -d.length / 2;
      holder.add(d);
      size = d.length + 2;
      let el = false;
      const mode = h('button', { class: 'ghost small', onclick: () => { el = !el; d.setMode(el ? 'element' : 'base'); mode.textContent = el ? '色：元素（CPK）' : '色：塩基'; } }, '色：塩基');
      parts.append(mode);
      info.innerHTML = `<h2>B型DNA</h2><p>1BNA（Dickerson DNA）の実測座標から作った4種の塩基対の型を、ねじれ34.3°・ライズ0.335 nmで並べた原子模型。主溝と副溝が見えます。</p>
        <p class="note">黄 A・緑 T・赤 G・青 C、背骨（糖とリン酸）は白。</p>`;
    } else {
      const kit = await loadGlb('kit.glb');
      const o = kit.getObjectByName(e.id)!.clone(true);
      o.position.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(o);
      o.position.sub(box.getCenter(new THREE.Vector3()));
      holder.add(o);
      size = box.getSize(new THREE.Vector3()).length();
      o.traverse((n) => {
        if (!n.name.startsWith('LBL_') || !n.userData.label) return;
        const t = stage.label(`<b>${n.userData.label}</b>${n.userData.sub ? `<small>${n.userData.sub}</small>` : ''}`);
        n.add(t);
        tags.push(t);
      });
      info.innerHTML = `<h2>${e.title}</h2><p>${e.sub}。原子構造がない（または大きすぎる）ため、Blenderで手続き的に作った模型です。</p>`;
    }
    tags.forEach((t) => (t.visible = tagsToggle.checked));
    stage.world.add(holder);
    current = holder;
    const dist = size * 0.62 / Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2)) / Math.min(1, Math.max(0.6, stage.camera.aspect));
    stage.controls.maxDistance = dist * 4;
    stage.setAoRadius(size / 30);
    await stage.frame(new THREE.Vector3(), dist, new THREE.Vector3(0.25, 0.2, 1), 0);
  }

  for (const e of MODELS) {
    const b = h('button', { class: 'model-item', 'data-id': e.id, onclick: () => show(e) },
      e.art ? h('img', { src: `${BASE}renders/${e.art}.jpg`, alt: '', loading: 'lazy' }) : h('span', { class: 'ph' }, 'DNA'),
      h('span', {}, h('b', {}, e.title), h('small', {}, e.sub)));
    list.append(b);
  }
  panel.append(
    info,
    h('div', { class: 'row' }, h('label', { class: 'switch' }, spinToggle, '自動回転'), h('label', { class: 'switch' }, tagsToggle, 'ラベル')),
    h('h3', {}, '表示する部分'),
    parts,
    h('h3', {}, 'モデルを選ぶ'),
    list);
  hud.status('左上で <b>視点／移動／回転</b> を切り替え。移動・回転ではモデルを直接つかめます（ホイール・ピンチで拡大縮小）。');
  await show(MODELS.find((m) => m.id === id) ?? MODELS[0]);
}
