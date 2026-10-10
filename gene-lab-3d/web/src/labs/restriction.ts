import * as THREE from 'three';
import type { LabEnv } from '../main';
import { AtomicDNA, BASE_COLOR, complement, type Nt } from '../core/dna';
import { loadMolecule, type Molecule } from '../core/molecule';
import { dismiss, dragOnView, flash, float, place, seatOnDna, tintMolecule } from '../core/interact';
import { tween, wait } from '../core/tween';
import { h } from '../core/ui';
import { ENZYMES, PUC18_MCS, compatible, cutAt, endKind, endLabel, enzyme, hybridSite, sites, type Enzyme, type Ends } from '../content/enzymes';

const FLANK_L = 'TGCC';
const FLANK_R = 'GGCA';
const SEQ = FLANK_L + PUC18_MCS + FLANK_R;
const GAP = 2.6; // nm the fragments drift apart after cutting

/** "5'…G  / 3'…CCTAG" style drawing of the two new ends */
export function endsDiagram(seq: string, ends: Ends, pad = 4) {
  const bot = complement(seq);
  const lo = Math.max(0, Math.min(ends.topCut, ends.botCut) - pad);
  const hi = Math.min(seq.length, Math.max(ends.topCut, ends.botCut) + pad);
  const span = (c: string) => `<span class="b-${c}">${c}</span>`;
  const row = (s: string, from: number, to: number, a: number, b: number) => {
    let out = '';
    for (let i = a; i < b; i++) out += i >= from && i < to ? span(s[i]) : ' ';
    return out;
  };
  const leftTop = row(seq, lo, ends.topCut, lo, hi);
  const leftBot = row(bot, lo, ends.botCut, lo, hi);
  const rightTop = row(seq, ends.topCut, hi, lo, hi);
  const rightBot = row(bot, ends.botCut, hi, lo, hi);
  return `<div class="seqline">5'…${leftTop}   ${rightTop}…3'\n3'…${leftBot}   ${rightBot}…5'</div>`;
}

export async function mount({ stage, hud, panel, mission }: LabEnv) {
  stage.setAoRadius(0.45);
  const world = stage.world;

  // ---------------------------------------------------------------- molecules
  // load every structure up front so picking up an enzyme is instant
  await Promise.all(['1BHM', '1ERI', '2E52', '1DFM', '1X9N'].map((id) => loadMolecule(id)));

  async function enzymeModel(e: Enzyme) {
    const mol = await loadMolecule(e.pdb ?? '1BHM');
    if (!e.pdb) tintMolecule(mol, 'protein', e.color);
    mol.setOpacity('dna', 0); // the lab's own DNA takes the place of the crystal's
    const tag = stage.label(e.pdb ? `<b>${e.name}</b><small>PDB ${e.pdb}</small>`
      : `<b>${e.name}</b><small>構造未登録のためBamHI(1BHM)の形で表示</small>`, e.pdb ? '' : 'warn');
    tag.position.set(0, 4.2, 0);
    mol.root.add(tag);
    return mol;
  }

  // ---------------------------------------------------------------- DNA
  let dna: AtomicDNA;
  let ends: Ends | null = null;
  let cutBy: Enzyme | null = null;
  let busy = false;

  function buildDna() {
    stage.discard(dna);
    dna = new AtomicDNA(SEQ);
    dna.position.x = -dna.length / 2;
    dna.showLetters(1.8);
    world.add(dna);
    ends = null;
    cutBy = null;
    const tags = [['5\'', 0, 0, -0.9], ['3\'', 0, dna.n - 1, 0.9], ['3\'', 1, 0, -0.9], ['5\'', 1, dna.n - 1, 0.9]] as const;
    for (const [txt, strand, k, dx] of tags) {
      const t = stage.label(txt, 'end');
      t.position.set(dna.x(k) + dx, strand === 0 ? 1.8 : -1.8, 0);
      dna.add(t);
    }
  }
  buildDna();

  const fit = (dur = 0.9) => {
    const aspect = stage.camera.aspect;
    const half = (dna.length / 2 + 2) / Math.max(0.6, aspect);
    const d = half / Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2));
    return stage.frame(new THREE.Vector3(0, 0.6, 0), Math.max(14, d), new THREE.Vector3(0.05, 0.22, 1), dur);
  };
  fit(0);

  const isRight = (nt: Nt) => !!ends && nt.k >= (nt.strand === 0 ? ends.topCut : ends.botCut);
  const highlightSite = (e: Enzyme | null) => {
    const on = new Set<number>();
    if (e) for (const s of sites(SEQ, e)) for (let i = s; i < s + e.site.length; i++) on.add(i);
    dna.letterColor(() => true, (nt) => BASE_COLOR[nt.base], '');
    dna.letterColor((nt) => on.has(nt.k), () => '#ffffff', 'hl');
    dna.tint(() => true, null);
    if (on.size) dna.tint((nt) => on.has(nt.k), '#fff4c2', 0.35);
  };

  // ---------------------------------------------------------------- dragging an enzyme onto the DNA
  async function dragEnzyme(e: Enzyme, ev: PointerEvent) {
    if (busy) return;
    if (ends) {
      hud.toast('DNAは切れています。リガーゼでつなぐか「DNAを元に戻す」を押してください。', 'bad');
      return;
    }
    busy = true;
    highlightSite(null);
    const mol = await enzymeModel(e);
    world.add(mol.root);
    const L = e.site.length;
    const found = sites(SEQ, e);
    let snapped: number | null = null;
    hud.status(`<b>${e.name}</b> を運んでDNAの上を滑らせてください。認識配列 <b>${e.site}</b> を探します。`);
    dragOnView(stage, ev, new THREE.Vector3(0, 0, 0), {
      move: (p) => {
        const local = dna.worldToLocal(p.clone());
        const onDna = Math.hypot(local.y, local.z) < 3.2 && local.x > -1 && local.x < dna.length + 1;
        if (!onDna) {
          snapped = null;
          float(mol.root, p.clone().add(new THREE.Vector3(0, 0.5, 0)));
          hud.status(`<b>${e.name}</b> をDNAに近づけてください。`);
          return;
        }
        const k = local.x / dna.rise;
        const near = found.map((s) => s + (L - 1) / 2).find((kc) => Math.abs(kc - k) < 1.6);
        const kc = near ?? k;
        place(mol.root, seatOnDna(mol, dna, kc));
        const s0 = Math.round(kc - (L - 1) / 2);
        const under = SEQ.slice(Math.max(0, s0), Math.max(0, s0) + L);
        if (near !== undefined) {
          snapped = near;
          hud.status(`認識配列 <b>${e.site}</b> を発見！ 指を離すと切断します。`, 'good');
        } else {
          snapped = null;
          hud.status(`いまの位置は <b>${under}</b> … ${e.site} ではないので切れません（酵素はDNA上を滑って探します）。`);
        }
      },
      end: async (p) => {
        if (snapped === null) {
          hud.status(p ? `${e.name} はDNAから離れました。認識配列の上で離すと切断します。` : '');
          await dismiss(stage, mol, new THREE.Vector3(0, 4, 0), 0.6);
          busy = false;
          return;
        }
        mission.complete('site', `${e.name} が認識配列 ${e.site} を見つけた`);
        await cut(e, Math.round(snapped - (L - 1) / 2), mol);
        busy = false;
      },
    });
  }

  async function cut(e: Enzyme, start: number, mol: Molecule) {
    const res = cutAt(SEQ, e, start);
    hud.status(`${e.name} が回文配列の両側から2本の鎖を1本ずつ切ります…`);
    await wait(stage, 0.4);
    const topA = dna.ntCenter(dna.nt(0, res.topCut - 1)), topB = dna.ntCenter(dna.nt(0, res.topCut));
    const botA = dna.ntCenter(dna.nt(1, res.botCut - 1)), botB = dna.ntCenter(dna.nt(1, res.botCut));
    await Promise.all([
      flash(stage, dna, topA.add(topB).multiplyScalar(0.5), '#ff8a8a', 0.6),
      wait(stage, 0.25).then(() => flash(stage, dna, botA.add(botB).multiplyScalar(0.5), '#ff8a8a', 0.6)),
    ]);
    ends = res;
    cutBy = e;
    dismiss(stage, mol, new THREE.Vector3(0, 6, 2), 1.1);
    await tween(stage, 1.3, (k) => dna.each(isRight, (nt) => nt.offset.set(GAP * k, 0.25 * k, 0)));
    const overhang = (nt: Nt) => res.kind !== 'blunt' && nt.k >= Math.min(res.topCut, res.botCut) && nt.k < Math.max(res.topCut, res.botCut);
    dna.tint(overhang, '#ffe066', 0.55);
    const kind = res.kind;
    hud.card(`<h4>${e.name} の切り口：${endLabel[kind]}</h4>
      ${endsDiagram(SEQ, res)}
      <p>${kind === 'blunt' ? '上下の鎖が同じ位置で切れ、1本鎖の突出がありません。どんな平滑末端ともつなげられますが、効率は低めです。'
        : `${kind === '5p' ? "5'" : "3'"}側に <b>${res.overhang}</b> の1本鎖が突き出ています（黄色）。相補的な突出をもつ末端と塩基対をつくって「くっつく」ので付着末端と呼びます。`}</p>
      <p class="note">次は左の <b>DNAリガーゼ</b> を切れ目までドラッグして、つなぎ直してみましょう。</p>`);
    hud.status('');
    mission.complete(kind === '5p' ? 'cut5' : kind === '3p' ? 'cut3' : 'blunt',
      `${endLabel[kind]}（${e.name}）`);
    ligaseCard.disabled = false;
  }

  // ---------------------------------------------------------------- ligase
  async function dragLigase(ev: PointerEvent) {
    if (busy) return;
    if (!ends) {
      hud.toast('まず制限酵素でDNAを切ってください。', 'bad');
      return;
    }
    busy = true;
    const mol = await loadMolecule('1X9N');
    mol.setOpacity('dna', 0);
    world.add(mol.root);
    const kc = (ends.topCut + ends.botCut) / 2 - 0.5;
    let ok = false;
    hud.status('リガーゼを切れ目（ギャップ）まで運んでください。');
    dragOnView(stage, ev, new THREE.Vector3(), {
      move: (p) => {
        const local = dna.worldToLocal(p.clone());
        const gapX = dna.x(kc) + GAP / 2;
        ok = Math.abs(local.x - gapX) < 2.2 && Math.hypot(local.y, local.z) < 3.5;
        if (ok) {
          place(mol.root, seatOnDna(mol, dna, kc, { along: GAP / 2 }));
          hud.status('ここが切れ目です。離すとつなぎます。', 'good');
        } else {
          float(mol.root, p);
        }
      },
      end: async () => {
        if (!ok || !ends) {
          await dismiss(stage, mol, new THREE.Vector3(0, 4, 0), 0.5);
          busy = false;
          return;
        }
        const e = cutBy!;
        hud.status('付着末端どうしが塩基対で仮どめされ、リガーゼが背骨のすき間をつなぎます…');
        await tween(stage, 1.1, (k) => {
          dna.each(isRight, (nt) => nt.offset.set(GAP * (1 - k), 0.25 * (1 - k), 0));
          place(mol.root, seatOnDna(mol, dna, kc, { along: (GAP / 2) * (1 - k) }));
        });
        const t = dna.ntCenter(dna.nt(0, ends.topCut));
        const b = dna.ntCenter(dna.nt(1, ends.botCut));
        await flash(stage, dna, t, '#9dffcf', 0.5);
        await flash(stage, dna, b, '#9dffcf', 0.5);
        dna.tint(() => true, null);
        dismiss(stage, mol, new THREE.Vector3(0, 6, 2), 1.0);
        hud.card(`<h4>つながりました</h4><p>2か所の切れ目（ニック）にホスホジエステル結合ができ、元の <b>${e.site}</b> に戻りました。</p>
          <p>${endKind(e) === 'blunt' ? '平滑末端は塩基対で仮どめされないので、実際の連結効率は付着末端よりずっと低くなります。' : '付着末端の4塩基が先に水素結合でくっつくので、効率よくつながります。'}</p>
          <p class="note">リガーゼはATP（ヒトのリガーゼIではAMPが酵素に結合したアデニル化中間体）を使って結合をつくります。</p>`);
        hud.status('');
        ends = null;
        cutBy = null;
        ligaseCard.disabled = true;
        mission.complete('ligate');
        busy = false;
      },
    });
  }

  // ---------------------------------------------------------------- panel
  const enzymeCards = ENZYMES.filter((e) => e.name !== 'BglII').map((e) => {
    const s = e.site;
    const card = h('button', { class: 'tool', style: `--c:${e.color}`, 'draggable-3d': true, title: `${e.name}（${e.origin}）` },
      h('b', {}, e.name),
      h('span', { class: 'seq', html: `${s.slice(0, e.cut)}<i>↓</i>${s.slice(e.cut)}` }),
      h('small', {}, (e.pdb ? `PDB ${e.pdb} · ` : '') + endLabel[endKind(e)].replace('（付着末端）', '')));
    card.addEventListener('pointerdown', (ev) => { ev.preventDefault(); dragEnzyme(e, ev); });
    card.addEventListener('pointerenter', () => !busy && !ends && highlightSite(e));
    card.addEventListener('pointerleave', () => !busy && !ends && highlightSite(null));
    return card;
  });
  const ligaseCard = h('button', { class: 'tool', style: '--c:#2a9d8f', 'draggable-3d': true, disabled: true },
    h('b', {}, 'DNAリガーゼ'), h('small', {}, 'PDB 1X9N（ヒトDNAリガーゼI）'));
  ligaseCard.addEventListener('pointerdown', (ev) => { ev.preventDefault(); dragLigase(ev); });

  const reset = h('button', { class: 'ghost small', onclick: () => { if (!busy) { buildDna(); hud.card(null); hud.status(''); ligaseCard.disabled = true; } } }, 'DNAを元に戻す');
  const colorMode = h('button', { class: 'ghost small', onclick: () => { mode = mode === 'base' ? 'element' : 'base'; dna.setMode(mode); colorMode.textContent = mode === 'base' ? '色：塩基' : '色：元素'; } }, '色：塩基');
  let mode: 'base' | 'element' = 'base';

  const cutTab = h('div', { class: 'tools' },
    h('h3', {}, '制限酵素（カードをDNAへドラッグ）'),
    h('div', { class: 'tool-grid' }, ...enzymeCards),
    h('h3', {}, '連結'),
    ligaseCard,
    h('div', { class: 'row' }, reset, colorMode),
    h('p', { class: 'note', html: `DNAは pUC18 のマルチクローニングサイト（${PUC18_MCS.length} bp）。原子は実測構造（PDB 1BNA）の型から並べた <b>B型DNA</b>（10.5 bp/回転）です。` }));

  const swapTab = h('div', { class: 'tools', hidden: true });
  const tabs = h('div', { class: 'tabs' },
    h('button', { class: 'on', onclick: (ev: Event) => switchTab(ev, 'cut') }, '切る・つなぐ'),
    h('button', { onclick: (ev: Event) => switchTab(ev, 'swap') }, 'つなぎ替え実験'));
  panel.append(h('a', { class: 'quiz-btn', href: `${import.meta.env.BASE_URL}film.html?id=restriction`, style: 'text-align:center;text-decoration:none' }, '▶ 授業動画で流れを見る（約4分）'), tabs, cutTab, swapTab);

  function switchTab(ev: Event, which: 'cut' | 'swap') {
    if (busy) return;
    for (const b of tabs.children) b.classList.toggle('on', b === ev.currentTarget);
    cutTab.hidden = which !== 'cut';
    swapTab.hidden = which !== 'swap';
    hud.card(null);
    hud.status('');
    if (which === 'swap') startSwap(enzyme('BglII'));
    else {
      clearSwap();
      dna.visible = true;
      fit();
    }
  }

  // ---------------------------------------------------------------- つなぎ替え実験 (slide 6)
  const A_SEQ = 'TACGTTAC' + 'GGATCC' + 'GTCAGCTA';
  const flankB = ['CATGACTG', 'TTGCTGCA'];
  let swap: { group: THREE.Group; a: AtomicDNA; b: AtomicDNA; partner: Enzyme; joined: AtomicDNA | null } | null = null;
  const partnerSel = h('div', { class: 'tool-grid' });
  const ligateBtn = h('button', { class: 'primary', disabled: true, onclick: () => ligateSwap() }, 'DNAリガーゼを加える');
  swapTab.append(
    h('p', { class: 'note', html: '左は <b>BamHI</b>（G↓GATCC）で切ったDNA。右の断片を別の酵素で切って、<b>右の断片をドラッグして左に押しつけて</b>みましょう。' }),
    h('h3', {}, '右の断片を切る酵素'),
    partnerSel, ligateBtn,
    h('p', { class: 'note', html: '講義スライド6：BamHI末端とBglII末端は、どちらも <b>GATC</b> の突出なのでつながる。' }));
  for (const name of ['BglII', 'BamHI', 'EcoRI', 'HindIII', 'PstI', 'SmaI']) {
    const e = enzyme(name);
    partnerSel.append(h('button', { class: 'tool', style: `--c:${e.color}`, onclick: () => !busy && startSwap(e) },
      h('b', {}, e.name), h('span', { class: 'seq', html: `${e.site.slice(0, e.cut)}<i>↓</i>${e.site.slice(e.cut)}` })));
  }

  function clearSwap() {
    if (!swap) return;
    stage.discard(swap.group);
    swap = null;
  }

  function startSwap(partner: Enzyme) {
    clearSwap();
    dna.visible = false;
    for (const b of partnerSel.children) b.classList.toggle('active', (b as HTMLElement).textContent!.startsWith(partner.name));
    const bamhi = enzyme('BamHI');
    const B_SEQ = flankB[0] + partner.site + flankB[1];
    const ea = cutAt(A_SEQ, bamhi, 8);
    const eb = cutAt(B_SEQ, partner, 8);
    const a = new AtomicDNA(A_SEQ);
    const b = new AtomicDNA(B_SEQ);
    const group = new THREE.Group(); // the two fragments move together when picked up
    world.add(group);
    for (const d of [a, b]) {
      d.position.x = -a.length / 2;
      d.showLetters(1.8, (nt) => (nt.k >= 8 && nt.k < 14 ? (d === a ? '#ff7a7a' : '#7ab8ff') : '#9aa5b8'));
      group.add(d);
    }
    a.each((nt) => nt.k >= (nt.strand === 0 ? ea.topCut : ea.botCut), (nt) => (nt.scale = 0));
    b.each((nt) => nt.k < (nt.strand === 0 ? eb.topCut : eb.botCut), (nt) => (nt.scale = 0));
    b.each(() => true, (nt) => nt.offset.set(4.5, 0, 0));
    swap = { group, a, b, partner, joined: null };
    ligateBtn.disabled = true;
    hud.card(`<h4>BamHI 末端 ＋ ${partner.name} 末端</h4>
      <p>左のDNAをBamHIで切ったところ（使うのは左側）</p>${endsDiagram(A_SEQ, ea, 3)}
      <p>右のDNAを${partner.name}で切ったところ（使うのは右側）</p>${endsDiagram(B_SEQ, eb, 3)}
      <p class="note">右の断片をつかんで左へ押しつけてください。</p>`);
    hud.status('右の断片をドラッグして、左の断片に近づけてください。');
    stage.frame(new THREE.Vector3(0, 0.4, 0), 17, new THREE.Vector3(0.1, 0.25, 1));
  }

  stage.renderer.domElement.addEventListener('pointerdown', (ev) => {
    if (!swap || busy || swap.joined || swapTab.hidden) return;
    const hit = stage.pick(ev, [swap.b.mesh]);
    if (!hit) return;
    const s = swap;
    const start = s.b.nts[0].offset.x;
    const p0 = hit.point.clone();
    let x = start;
    dragOnView(stage, ev, p0, {
      move: (p) => {
        x = Math.max(0, start + (s.group.worldToLocal(p.clone()).x - s.group.worldToLocal(p0.clone()).x));
        s.b.each(() => true, (nt) => nt.offset.set(x, 0, 0));
      },
      end: async () => {
        if (x > 1.0) return;
        busy = true;
        const c = compatible(enzyme('BamHI'), s.partner);
        if (!c.ok) {
          await flash(stage, s.a, s.a.ntCenter(s.a.nt(0, 8), false).setY(0).setZ(0), '#ff6b81', 0.9);
          await tween(stage, 0.7, (k) => s.b.each(() => true, (nt) => nt.offset.set(x + (4.5 - x) * k, 0, 0)));
          hud.card(`<h4>つながりません</h4><p>${c.why}</p><p class="note">BamHIの突出は5'側の <b>GATC</b>。相手も同じ形・同じ配列の突出でないと塩基対をつくれません。</p>`);
          hud.status('');
          mission.complete('reject', `BamHI と ${s.partner.name} の末端は合わない`);
          busy = false;
          return;
        }
        await tween(stage, 0.5, (k) => s.b.each(() => true, (nt) => nt.offset.set(x * (1 - k), 0, 0)));
        hud.status(`${c.why} 水素結合で仮どめされました。リガーゼでつなぎましょう。`, 'good');
        ligateBtn.disabled = false;
        busy = false;
      },
    });
  });

  async function ligateSwap() {
    if (!swap || busy) return;
    busy = true;
    ligateBtn.disabled = true;
    const s = swap;
    const bamhi = enzyme('BamHI');
    const ea = cutAt(A_SEQ, bamhi, 8);
    const joinedSeq = A_SEQ.slice(0, ea.topCut) + (flankB[0] + s.partner.site + flankB[1]).slice(ea.topCut);
    const j = new AtomicDNA(joinedSeq);
    j.position.x = -j.length / 2;
    const hyb = hybridSite(bamhi, s.partner);
    j.showLetters(1.8, (nt) => (nt.k >= 8 && nt.k < 14 ? (nt.strand === 0 ? (nt.k < ea.topCut ? '#ff7a7a' : '#7ab8ff') : (nt.k < ea.botCut ? '#ff7a7a' : '#7ab8ff')) : '#9aa5b8'));
    const lig = await loadMolecule('1X9N');
    lig.setOpacity('dna', 0);
    world.add(lig.root);
    await tween(stage, 0.8, (k) => place(lig.root, seatOnDna(lig, s.a, 10.5, { lift: new THREE.Vector3(0, 6 * (1 - k), 0) })));
    await flash(stage, s.a, s.a.ntCenter(s.a.nt(0, ea.topCut)), '#9dffcf', 0.5);
    await flash(stage, s.a, s.a.ntCenter(s.a.nt(1, ea.botCut)), '#9dffcf', 0.5);
    stage.discard(s.a, s.b);
    s.group.add(j);
    s.joined = j;
    dismiss(stage, lig, new THREE.Vector3(0, 6, 2), 1.0);
    const recut = [bamhi, s.partner].filter((e) => e.site === hyb).map((e) => e.name);
    hud.card(`<h4>組換えDNAの完成：${hyb}</h4>
      <div class="seqline">5'…${[...hyb].map((c, i) => `<span class="b-${c}" style="${i < bamhi.cut ? 'text-decoration:underline' : ''}">${c}</span>`).join('')}…3'</div>
      <p>${recut.length ? `できた配列は ${recut.join('・')} の認識配列と同じなので、また切ることができます。`
        : `できた <b>${hyb}</b> は BamHI（GGATCC）とも ${s.partner.name}（${s.partner.site}）とも違う配列。<b>どちらの酵素でも二度と切れません。</b>`}</p>`);
    hud.status('');
    if (s.partner.name === 'BglII') mission.complete('swap');
    busy = false;
  }
}
