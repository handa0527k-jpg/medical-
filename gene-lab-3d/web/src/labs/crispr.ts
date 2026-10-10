import * as THREE from 'three';
import type { LabEnv } from '../main';
import { AtomicDNA, type Nt } from '../core/dna';
import { grooveAngleThree, loadMolecule, yUp, type Molecule } from '../core/molecule';
import { dismiss, dragOnView, flash } from '../core/interact';
import { tween } from '../core/tween';
import { h } from '../core/ui';
import { FLAG, GENE, SPACER_LEN, cutSite, hdr, nhej, pamAt, spacerRna, targets, translate } from '../content/crispr';

const ARM = 15; // homology arm length on the donor

/** codons + amino acids, with changed positions marked */
function proteinHtml(seq: string, ref?: string) {
  const p = translate(seq);
  const r = ref ? translate(ref) : p;
  return [...p].map((a, i) => `<span class="aa${a === '*' ? ' stop' : ''}${ref && a !== r[i] ? ' changed' : ''}">${a === '*' ? '終' : a}</span>`).join('');
}

export async function mount({ stage, hud, panel, mission }: LabEnv) {
  stage.setAoRadius(0.45);
  const world = stage.world;
  await loadMolecule('5F9R');

  // everything that belongs to the gene lives in one holder, so the learner can
  // pick the whole thing up (Manipulator) and the lab's geometry stays consistent
  const holder = new THREE.Group();
  world.add(holder);
  let dna: AtomicDNA;
  let seq = GENE;
  let start = 0; // sgRNA window start
  let cas9: Molecule | null = null;
  let state: 'scan' | 'bound' | 'cut' | 'edited' = 'scan';
  let busy = false;

  function buildDna(s: string, tintSel?: (nt: Nt) => boolean, tintColor = '#59d8a1') {
    stage.discard(dna);
    seq = s;
    dna = new AtomicDNA(s);
    dna.position.x = -dna.length / 2;
    dna.showLetters(1.8);
    if (tintSel) dna.tint(tintSel, tintColor, 0.6);
    holder.add(dna);
    for (const [txt, strand, k, dx] of [['5\'', 0, 0, -0.9], ['3\'', 0, dna.n - 1, 0.9], ['3\'', 1, 0, -0.9], ['5\'', 1, dna.n - 1, 0.9]] as const) {
      const t = stage.label(txt, 'end');
      t.position.set(dna.x(k) + dx, strand === 0 ? 1.8 : -1.8, 0);
      dna.add(t);
    }
  }
  buildDna(GENE);
  const halfLen = () => dna.length / 2;
  {
    const aspect = stage.camera.aspect;
    const d = (halfLen() + 2) / Math.max(0.6, aspect) / Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2));
    stage.frame(new THREE.Vector3(0, 0.8, 0), Math.max(16, d), new THREE.Vector3(0.05, 0.25, 1), 0);
  }

  // ---------------------------------------------------------------- sgRNA window + PAM box
  const winMat = new THREE.MeshStandardMaterial({ color: '#4d8dff', transparent: true, opacity: 0.22, depthWrite: false, emissive: '#2050c0', emissiveIntensity: 0.4 });
  const pamMat = new THREE.MeshStandardMaterial({ color: '#ff6b81', transparent: true, opacity: 0.3, depthWrite: false, emissive: '#ff6b81', emissiveIntensity: 0.5 });
  const cyl = new THREE.CylinderGeometry(1.45, 1.45, 1, 32, 1, true);
  cyl.rotateZ(Math.PI / 2);
  const win = new THREE.Mesh(cyl, winMat);
  const pamBox = new THREE.Mesh(cyl, pamMat);
  win.renderOrder = pamBox.renderOrder = 5;
  holder.add(win, pamBox);
  const winTag = stage.label('');
  const pamTag = stage.label('');
  win.add(winTag);
  pamBox.add(pamTag);

  function placeWindow() {
    const x0 = -halfLen() + dna.x(start) - dna.rise / 2;
    win.scale.x = SPACER_LEN * dna.rise;
    win.position.set(x0 + (SPACER_LEN * dna.rise) / 2, 0, 0);
    pamBox.scale.x = 3 * dna.rise;
    pamBox.position.set(x0 + (SPACER_LEN + 1.5) * dna.rise, 0, 0);
    const p = pamAt(seq, start);
    pamMat.color.set(p.ok ? '#59d8a1' : '#ff6b81');
    pamMat.emissive.set(p.ok ? '#59d8a1' : '#ff6b81');
    winTag.element.innerHTML = `<b>sgRNA</b><small>5'-${spacerRna(seq, start)}-3'</small>`;
    winTag.position.set(0, -3.1, 0);
    pamTag.element.innerHTML = `<b>${p.ok ? 'PAM ✓' : 'PAMなし ✕'}</b><small>${p.pam}（NGGが必要）</small>`;
    pamTag.element.className = 'tag ' + (p.ok ? 'good' : 'warn');
    pamTag.position.set(0, 3.2, 0);
    sgLine.innerHTML = `sgRNA 5'-<span class="b-U">${spacerRna(seq, start)}</span>-3'<br>PAM&nbsp;&nbsp;${p.pam} ${p.ok ? '<span class="ok">✓ NGG</span>' : '<span class="ng">✕</span>'}`;
    dna.tint(() => true, null);
    dna.tint((nt) => nt.strand === 0 && nt.k >= start && nt.k < start + SPACER_LEN, '#7fb0ff', 0.35);
    dna.tint((nt) => nt.k >= p.at && nt.k < p.at + 3, p.ok ? '#59d8a1' : '#ff6b81', 0.5);
    if (p.ok && state === 'scan') mission.complete('pam', `PAM ${p.pam} の手前に sgRNA を置いた`);
  }

  function moveWindow(to: number) {
    if (state !== 'scan') return;
    start = THREE.MathUtils.clamp(Math.round(to), 0, seq.length - SPACER_LEN - 3);
    placeWindow();
  }

  stage.renderer.domElement.addEventListener('pointerdown', (ev) => {
    if (state !== 'scan' || busy || !stage.pick(ev, [win])) return;
    const s0 = start;
    const anchor = holder.localToWorld(win.position.clone());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(stage.camera.getWorldDirection(new THREE.Vector3()), anchor);
    const w0 = stage.pointOnPlane(ev, plane);
    const x0 = w0 ? holder.worldToLocal(w0).x : 0;
    dragOnView(stage, ev, anchor, {
      move: (p) => { if (w0) moveWindow(s0 + (holder.worldToLocal(p.clone()).x - x0) / (dna.rise * holder.scale.x)); },
      end: () => {},
    });
  });

  // ---------------------------------------------------------------- Cas9
  async function bindCas9() {
    if (busy || state !== 'scan') return;
    busy = true;
    hud.status('');
    const p = pamAt(seq, start);
    const mol = await loadMolecule('5F9R');
    mol.setOpacity('protein', 0.26);
    const c = cutSite(start);
    const xCut = -halfLen() + dna.x(c - 0.5);
    const phase = mol.meta.groovePhase ?? 0;
    const kGroove = c - 0.5 + (mol.meta.grooveAt ?? 0) / dna.rise;
    const rot = dna.groove(kGroove) - grooveAngleThree(phase);
    mol.root.rotation.x = rot;
    mol.root.position.set(xCut, 9, 0);
    holder.add(mol.root);
    const tag = stage.label('<b>Cas9–sgRNA</b><small>PDB 5F9R（化膿レンサ球菌 SpCas9）</small>');
    tag.position.set(0, 6.5, 0);
    mol.root.add(tag);
    if (!p.ok) {
      await tween(stage, 0.9, (e) => mol.root.position.y = 9 - 5.5 * e);
      await flash(stage, holder, new THREE.Vector3(pamBox.position.x, 0, 0), '#ff6b81', 1.0);
      await tween(stage, 0.8, (e) => mol.root.position.y = 3.5 + 7 * e);
      stage.discard(mol.root);
      mission.complete('nopam');
      hud.card(`<h4>Cas9は結合しませんでした</h4><p>sgRNAの配列がDNAと合っていても、そのすぐ3'側に <b>PAM（NGG）</b> がなければCas9はDNAをほどき始めません。今の位置の後ろは <b>${p.pam}</b>。</p>
        <p class="note">細菌がCRISPRで自分のゲノム（PAMを持たない）を切らないための仕組みでもあります。</p>`);
      busy = false;
      return;
    }
    await tween(stage, 1.4, (e) => mol.root.position.y = 9 * (1 - e));
    // the crystal's own R-loop replaces the lab DNA where Cas9 has unwound it
    const lo = start - 1, hi = p.at + 5;
    dna.each((nt) => nt.k >= lo && nt.k < hi, (nt) => (nt.scale = 0));
    win.visible = pamBox.visible = false;
    cas9 = mol;
    state = 'bound';
    mission.complete('bind');
    cutBtn.disabled = false;
    bindBtn.disabled = true;
    hud.card(`<h4>R-loop：sgRNAが標的鎖と対合</h4>
      <p>Cas9（半透明）はまずPAM（赤いDNA）を見つけ、その手前の二本鎖をほどきます。sgRNA（青）の20塩基が<b>標的鎖</b>と塩基対をつくり、もう一方の非標的鎖ははじき出されます。ここに見えているのは結晶構造そのものの原子配置です。</p>
      <p class="note">次は「切断」。HNHドメインが標的鎖を、RuvCドメインが非標的鎖を切ります。</p>`);
    busy = false;
  }

  async function cut() {
    if (!cas9 || busy) return;
    busy = true;
    cutBtn.disabled = true;
    const L = cas9.meta.landmarks;
    for (const [k, col] of [['hnh', '#ff6b6b'], ['ruvc', '#ff9f43']] as const) {
      if (!L[k]) continue;
      const pt = cas9.root.localToWorld(yUp(L[k]!));
      const tg = stage.label(k === 'hnh' ? '<b>HNH</b><small>標的鎖を切る</small>' : '<b>RuvC</b><small>非標的鎖を切る</small>', 'warn');
      tg.position.copy(yUp(L[k]!));
      cas9.root.add(tg);
      await flash(stage, world, pt, col, 0.9, 0.8);
    }
    const c = cutSite(start);
    const m = cas9;
    m.setOpacity('dna', 0);
    m.setOpacity('sgrna', 0);
    dna.each(() => true, (nt) => (nt.scale = 1));
    await dismiss(stage, m, new THREE.Vector3(0, 9, 0), 1.0);
    cas9 = null;
    await tween(stage, 1.0, (e) => dna.each((nt) => nt.k >= c, (nt) => nt.offset.set(1.8 * e, 0, 0)));
    state = 'cut';
    mission.complete('cut');
    nhejBtn.disabled = hdrBtn.disabled = false;
    hud.card(`<h4>二本鎖切断（DSB）</h4><p>PAMの3塩基上流で、2本の鎖が<b>同じ位置</b>で切られました（平滑末端）。</p>
      <div class="seqline">5'…${seq.slice(c - 6, c)}   ${seq.slice(c, c + 6)}…3'</div>
      <p>細胞はこの切れ目を修復しようとします。修復のしかたを選びましょう：</p>
      <p><b>NHEJ</b>：切れた端を直接つなぐ。速いが、小さな挿入・欠失が残りやすい。<br><b>HDR</b>：相同な配列（ドナー）を鋳型に正確に直す。</p>`);
    busy = false;
  }

  // ---------------------------------------------------------------- repair
  async function doNhej() {
    if (state !== 'cut' || busy) return;
    busy = true;
    const c = cutSite(start);
    const options = [['del', 1], ['ins', 1], ['del', 2], ['ins', 2]] as const;
    const [kind, n] = options[Math.floor(Math.random() * options.length)];
    const ed = nhej(GENE, c, kind, n, 'A');
    await tween(stage, 0.8, (e) => dna.each((nt) => nt.k >= c, (nt) => nt.offset.set(1.8 * (1 - e), 0, 0)));
    buildDna(ed.seq, kind === 'ins' ? (nt) => nt.k >= c && nt.k < c + n : (nt) => nt.k === c - 1 || nt.k === c, kind === 'ins' ? '#59d8a1' : '#ff6b81');
    await flash(stage, dna, dna.ntCenter(dna.nt(0, c)), '#9dffcf', 0.6);
    state = 'edited';
    mission.complete('nhej');
    report(`NHEJ：${n}塩基の${kind === 'ins' ? '挿入' : '欠失'}`, ed.seq, `${n}塩基は3の倍数ではないので、そこから先のコドンの読み枠がずれ（<b>フレームシフト</b>）、すぐに終止コドンが現れます。これが遺伝子ノックアウトの原理です。`);
    busy = false;
  }

  let donor: AtomicDNA | null = null;
  async function showDonor() {
    if (state !== 'cut' || busy) return;
    const c = cutSite(start);
    const at = c - (c % 3); // put the tag on a codon boundary next to the cut so it stays in frame
    const dseq = GENE.slice(at - ARM, at) + FLAG + GENE.slice(at, at + ARM);
    donor = new AtomicDNA(dseq);
    donor.position.set(-halfLen() + dna.x(at - ARM), 7, 0);
    donor.tint((nt) => nt.k >= ARM && nt.k < ARM + FLAG.length, '#ffd166', 0.65);
    donor.tint((nt) => nt.k < ARM || nt.k >= ARM + FLAG.length, '#9aa5b8', 0.3);
    const tg = stage.label('<b>ドナーDNA</b><small>相同アーム（灰）＋ FLAGタグ（黄）・ドラッグして切れ目へ</small>');
    tg.position.set(donor.x(dseq.length / 2), 2.3, 0);
    donor.add(tg);
    holder.add(donor);
    hud.status('ドナーDNAを下へドラッグして、切れ目に重ねてください。');
    hdrBtn.disabled = true;
    stage.frame(new THREE.Vector3(0, 3, 0), stage.camera.position.length() * 1.05, new THREE.Vector3(0.05, 0.25, 1));
  }

  stage.renderer.domElement.addEventListener('pointerdown', (ev) => {
    if (!donor || busy || state !== 'cut') return;
    const hit = stage.pick(ev, [donor.mesh]);
    if (!hit) return;
    const d = donor;
    const y0 = d.position.y;
    const p0 = hit.point.clone();
    const l0 = holder.worldToLocal(p0.clone()).y;
    dragOnView(stage, ev, p0, {
      move: (p) => { d.position.y = Math.max(0, y0 + (holder.worldToLocal(p.clone()).y - l0)); },
      end: async () => {
        if (d.position.y > 2.6) return;
        busy = true;
        const c = cutSite(start);
        const at = c - (c % 3);
        const ed = hdr(GENE, at, FLAG);
        await tween(stage, 0.6, (e) => (d.position.y = d.position.y * (1 - e)));
        stage.discard(d);
        donor = null;
        buildDna(ed, (nt) => nt.k >= at && nt.k < at + FLAG.length, '#ffd166');
        await flash(stage, dna, dna.ntCenter(dna.nt(0, at)), '#ffe08a', 0.6);
        await flash(stage, dna, dna.ntCenter(dna.nt(0, at + FLAG.length - 1)), '#ffe08a', 0.6);
        hud.status('');
        state = 'edited';
        mission.complete('hdr');
        report('HDR：FLAGタグを正確に挿入', ed, `相同アームが元の配列と同じなので、細胞はドナーを鋳型に切れ目を埋めます。挿入した24塩基（3の倍数）がコドンの区切りに入ったので、読み枠はそのまま。タンパク質の途中に <b>DYKDDDDK</b>（FLAGタグ）が加わりました（ノックイン）。`);
        const aspect = stage.camera.aspect;
        const dd = (dna.length / 2 + 2) / Math.max(0.6, aspect) / Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2));
        stage.frame(new THREE.Vector3(0, 0.8, 0), Math.max(16, dd), new THREE.Vector3(0.05, 0.25, 1));
        busy = false;
      },
    });
  });

  function report(title: string, edited: string, why: string) {
    hud.card(`<h4>${title}</h4>
      <p class="note">元のタンパク質</p><div class="prot">${proteinHtml(GENE)}</div>
      <p class="note">編集後</p><div class="prot">${proteinHtml(edited, GENE)}</div>
      <p>${why}</p>`);
    protEl.innerHTML = `<div class="prot">${proteinHtml(edited, GENE)}</div>`;
    nhejBtn.disabled = hdrBtn.disabled = true;
  }

  function reset() {
    if (busy) return;
    stage.discard(cas9?.root);
    cas9 = null;
    stage.discard(donor);
    donor = null;
    state = 'scan';
    buildDna(GENE);
    win.visible = pamBox.visible = true;
    bindBtn.disabled = false;
    cutBtn.disabled = nhejBtn.disabled = hdrBtn.disabled = true;
    hud.card(null);
    hud.status('');
    protEl.innerHTML = `<div class="prot">${proteinHtml(GENE)}</div>`;
    placeWindow();
  }

  // ---------------------------------------------------------------- panel
  const sgLine = h('div', { class: 'seqline sg' });
  const bindBtn = h('button', { class: 'primary', onclick: bindCas9 }, 'Cas9を結合させる');
  const cutBtn = h('button', { class: 'primary', disabled: true, onclick: cut }, '切断');
  const nhejBtn = h('button', { class: 'tool', disabled: true, style: '--c:#ff6b81', onclick: doNhej }, h('b', {}, 'NHEJ'), h('small', {}, '末端をそのままつなぐ'));
  const hdrBtn = h('button', { class: 'tool', disabled: true, style: '--c:#ffd166', onclick: showDonor }, h('b', {}, 'HDR'), h('small', {}, 'ドナーDNAで正確に直す'));
  const protEl = h('div', {}, h('div', { class: 'prot', html: proteinHtml(GENE) }));
  const valid = targets(GENE);
  panel.append(
    h('p', { class: 'note', html: `標的の遺伝子（${GENE.length} bp）。sgRNAの20塩基（青い筒）を<b>DNAの上でドラッグ</b>するか、矢印で1塩基ずつ動かします。PAMの候補：${valid.length}か所。` }),
    h('div', { class: 'row' },
      h('button', { class: 'ghost small', onclick: () => moveWindow(start - 1) }, '◀ 1塩基'),
      h('button', { class: 'ghost small', onclick: () => moveWindow(start + 1) }, '1塩基 ▶')),
    sgLine,
    h('div', { class: 'row' }, bindBtn, cutBtn),
    h('h3', {}, '修復のしかた'),
    h('div', { class: 'tool-grid' }, nhejBtn, hdrBtn),
    h('h3', {}, 'タンパク質（1文字表記、終＝終止）'),
    protEl,
    h('button', { class: 'ghost small', onclick: reset }, 'はじめからやり直す'),
    h('p', { class: 'note', html: '講義スライド：「CRISPR/Cas9-mediated gene editing in human tripronuclear zygotes」(2015) — ヒト胚の編集は、オフターゲットやモザイクの問題とともに大きな倫理的議論を呼びました。' }));
  placeWindow();
  hud.status('青い筒（sgRNA）をドラッグして、すぐ後ろに <b>NGG</b> がある場所を探しましょう。');
}
