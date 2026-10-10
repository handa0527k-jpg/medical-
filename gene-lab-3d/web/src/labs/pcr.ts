import * as THREE from 'three';
import type { LabEnv } from '../main';
import { AtomicDNA } from '../core/dna';
import { loadMolecule, yUp } from '../core/molecule';
import { dismiss, place, seatOnDna } from '../core/interact';
import { tween, wait } from '../core/tween';
import { h } from '../core/ui';
import { cycle, fluorescence, ct, isTarget, start, stepFor, targetCount, type Duplex, type PcrDesign, type Strand } from '../content/pcr';

// template: flank | forward-primer site | middle | reverse-primer site | flank
const TEMPLATE = 'CTGACT' + 'GCATGTCA' + 'GTCCAGTA' + 'ACGGTCAT' + 'TGCAGC';
const D: PcrDesign = { length: TEMPLATE.length, fwd: 6, rev: 30, primerLen: 8 };
const SPLIT = 2.6; // nm the strands sit apart after melting
const COL = { tpl: '#6b7385', F: '#e5484d', Fbody: '#ffa2a8', R: '#2fbf71', Rbody: '#9be7b4' };
const POP_Y = -26;

export async function mount({ stage, hud, panel, mission }: LabEnv) {
  stage.setAoRadius(0.45);
  const world = stage.world;
  const polyTemplate = await loadMolecule('3KTQ');
  polyTemplate.setOpacity('dna', 0);

  // ---------------------------------------------------------------- state
  let temp = 25;
  let phase: 'duplex' | 'single' | 'primed' = 'duplex';
  let cycleNo = 0;
  let pool: Duplex[] = start(D);
  let busy = false;
  const reagents = { primer: true, pol: true, dntp: true };
  const history: number[] = [25];

  // ---------------------------------------------------------------- cycle 1 at atomic resolution
  const tpl = new AtomicDNA(TEMPLATE);
  const up = new AtomicDNA(TEMPLATE); // will hold the new bottom strand made from the reverse primer
  const low = new AtomicDNA(TEMPLATE); // will hold the new top strand made from the forward primer
  for (const d of [tpl, up, low]) {
    d.position.x = -tpl.length / 2;
    world.add(d);
  }
  up.each(() => true, (nt) => { nt.scale = 0; nt.offset.set(0, SPLIT, 0); });
  low.each(() => true, (nt) => { nt.scale = 0; nt.offset.set(0, -SPLIT, 0); });
  const regions = [
    ['フォワードプライマー結合部位', D.fwd, D.fwd + D.primerLen, COL.F],
    ['リバースプライマー結合部位', D.rev - D.primerLen, D.rev, COL.R],
  ] as const;
  for (const [, a, b, c] of regions) tpl.tint((nt) => nt.k >= a && nt.k < b, c, 0.25);
  const tags: THREE.Object3D[] = [];
  const tag = (html: string, x: number, y: number, cls = '') => {
    const t = stage.label(html, cls);
    t.position.set(x, y, 0);
    tpl.add(t);
    tags.push(t);
    return t;
  };
  tag('増やしたい領域', tpl.x((D.fwd + D.rev) / 2), 3.0, 'good');

  const fitAtomic = (dur = 0.9) => stage.frame(new THREE.Vector3(0, 0, 0), 24, new THREE.Vector3(0.12, 0.25, 1), dur);
  fitAtomic(0);

  // the background warms and cools with the block temperature
  const cold = new THREE.Color('#070b16'), hot = new THREE.Color('#1c0a0d');
  const setGlow = (t: number) => {
    stage.scene.background = cold.clone().lerp(hot, THREE.MathUtils.clamp((t - 20) / 80, 0, 1));
  };
  setGlow(temp);

  async function polymeraseAt(d: AtomicDNA, k: number, flip: boolean) {
    const mol = await loadMolecule('3KTQ');
    mol.setOpacity('dna', 0);
    world.add(mol.root);
    // the ddNTP (active site) sits at the growing 3' end
    const site = mol.meta.landmarks.ddntp ? yUp(mol.meta.landmarks.ddntp) : new THREE.Vector3();
    const move = (kk: number) => place(mol.root, seatOnDna(mol, d, kk, {
      flip, along: flip ? site.x : -site.x, lift: new THREE.Vector3(0, d.nts[0].offset.y, 0),
    }));
    move(k);
    return { mol, move };
  }

  async function atomicDenature() {
    hud.status('95℃：塩基どうしの水素結合が切れ、二本鎖が1本ずつにほどけます。');
    await tween(stage, 1.6, (e) => tpl.each(() => true, (nt) => nt.offset.set(0, (nt.strand === 0 ? 1 : -1) * SPLIT * e, Math.sin(nt.k * 0.6) * 0.3 * Math.sin(Math.PI * e))));
  }
  async function atomicAnneal() {
    hud.status('55℃：短いプライマーが、相補的な場所にだけ結合します（赤＝フォワード、緑＝リバース）。');
    const inR = (nt: { strand: number; k: number }) => nt.strand === 1 && nt.k >= D.rev - D.primerLen && nt.k < D.rev;
    const inF = (nt: { strand: number; k: number }) => nt.strand === 0 && nt.k >= D.fwd && nt.k < D.fwd + D.primerLen;
    up.tint(inR, COL.R, 0.7);
    low.tint(inF, COL.F, 0.7);
    await tween(stage, 1.4, (e) => {
      up.each(inR, (nt) => { nt.scale = e; nt.offset.set(0, SPLIT + 3 * (1 - e), 4 * (1 - e)); });
      low.each(inF, (nt) => { nt.scale = e; nt.offset.set(0, -SPLIT - 3 * (1 - e), 4 * (1 - e)); });
    });
    tag('リバースプライマー', up.x(D.rev - D.primerLen / 2), SPLIT - 1.9);
    tag('フォワードプライマー', low.x(D.fwd + D.primerLen / 2), -SPLIT - 2.2);
  }
  async function atomicExtend() {
    hud.status('72℃：Taq DNAポリメラーゼ（実構造 PDB 3KTQ）がプライマーの3\'末端から、鋳型に相補的なヌクレオチドを1つずつつなげます。');
    // in the crystal the enzyme moves from its primer/template duplex toward the ddNTP
    const forward = (polyTemplate.meta.landmarks.ddntp?.[0] ?? 1) > 0;
    const pu = await polymeraseAt(up, D.rev - D.primerLen - 0.5, forward);
    const pl = await polymeraseAt(low, D.fwd + D.primerLen - 0.5, !forward);
    up.tint((nt) => nt.strand === 1 && nt.k < D.rev - D.primerLen, COL.Rbody, 0.45);
    low.tint((nt) => nt.strand === 0 && nt.k >= D.fwd + D.primerLen, COL.Fbody, 0.45);
    const nUp = D.rev - D.primerLen; // bottom strand grows toward k = 0
    const nLow = D.length - (D.fwd + D.primerLen); // top strand grows toward the right end
    await tween(stage, 4.0, (e) => {
      const iu = Math.floor(e * nUp), il = Math.floor(e * nLow);
      up.each((nt) => nt.strand === 1 && nt.k < D.rev - D.primerLen, (nt) => { nt.scale = nt.k >= D.rev - D.primerLen - iu ? 1 : 0; });
      low.each((nt) => nt.strand === 0 && nt.k >= D.fwd + D.primerLen, (nt) => { nt.scale = nt.k < D.fwd + D.primerLen + il ? 1 : 0; });
      pu.move(Math.max(0, D.rev - D.primerLen - iu - 0.5));
      pl.move(Math.min(D.length - 1, D.fwd + D.primerLen + il - 0.5));
    }, (t) => t);
    up.each((nt) => nt.strand === 1, (nt) => (nt.scale = 1));
    low.each((nt) => nt.strand === 0, (nt) => (nt.scale = 1));
    await Promise.all([dismiss(stage, pu.mol, new THREE.Vector3(-4, 4, 0), 0.8), dismiss(stage, pl.mol, new THREE.Vector3(4, -4, 0), 0.8)]);
  }

  // ---------------------------------------------------------------- the population (cycle 2 onward)
  const pop = new THREE.Group();
  pop.position.y = POP_Y;
  world.add(pop);
  const unit = 0.24;
  const rods = new Map<number, THREE.Group>();
  const rodGeo = new THREE.CylinderGeometry(0.09, 0.09, 1, 10);
  rodGeo.rotateZ(Math.PI / 2);
  const coneGeo = new THREE.ConeGeometry(0.17, 0.32, 12);
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (c: string) => {
    if (!mats.has(c)) mats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 }));
    return mats.get(c)!;
  };
  const frames: THREE.LineSegments[] = [];

  function rodFor(s: Strand) {
    let g = rods.get(s.id);
    if (g) return g;
    g = new THREE.Group();
    const len = (s.b - s.a) * unit;
    const body = new THREE.Mesh(rodGeo, mat(s.primer === 'F' ? COL.Fbody : s.primer === 'R' ? COL.Rbody : COL.tpl));
    body.scale.x = len;
    body.position.x = (s.a + (s.b - s.a) / 2) * unit;
    g.add(body);
    if (s.primer) {
      const pa = s.primer === 'F' ? D.fwd : D.rev - D.primerLen;
      const p = new THREE.Mesh(rodGeo, mat(s.primer === 'F' ? COL.F : COL.R));
      p.scale.set(D.primerLen * unit, 1.35, 1.35);
      p.position.x = (pa + D.primerLen / 2) * unit;
      g.add(p);
    }
    const cone = new THREE.Mesh(coneGeo, mat(s.primer === 'F' ? COL.F : s.primer === 'R' ? COL.R : '#9aa3b5'));
    cone.rotation.z = s.dir === 1 ? -Math.PI / 2 : Math.PI / 2; // points 5'->3'
    cone.position.x = (s.dir === 1 ? s.b : s.a) * unit;
    g.add(cone);
    g.userData.body = body;
    pop.add(g);
    rods.set(s.id, g);
    return g;
  }

  function slots(n: number) {
    const cols = n > 16 ? 4 : n > 4 ? 2 : 1;
    const rows = Math.ceil(n / cols);
    const w = D.length * unit + 1.6;
    return Array.from({ length: n }, (_, i) => new THREE.Vector3(
      (i % cols - (cols - 1) / 2) * w - (D.length * unit) / 2,
      ((rows - 1) / 2 - Math.floor(i / cols)) * 1.25, 0));
  }

  function drawFrames() {
    for (const f of frames) pop.remove(f);
    frames.length = 0;
    const sl = slots(pool.length);
    pool.forEach((dp, i) => {
      if (!isTarget(dp, D)) return;
      const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry((D.rev - D.fwd) * unit + 0.3, 0.85, 0.3)),
        new THREE.LineBasicMaterial({ color: '#ffe066', toneMapped: false }));
      box.position.copy(sl[i]).add(new THREE.Vector3(((D.fwd + D.rev) / 2) * unit, 0, 0));
      pop.add(box);
      frames.push(box);
    });
  }

  async function layoutPool(dur = 0.9) {
    const sl = slots(pool.length);
    const moves: { g: THREE.Group; from: THREE.Vector3; to: THREE.Vector3 }[] = [];
    pool.forEach(([x, y], i) => {
      for (const s of [x, y]) {
        const g = rodFor(s);
        const to = sl[i].clone().add(new THREE.Vector3(0, s.dir === 1 ? 0.2 : -0.2, 0));
        moves.push({ g, from: g.position.clone(), to });
      }
    });
    await tween(stage, dur, (e) => moves.forEach((m) => m.g.position.lerpVectors(m.from, m.to, e)));
    drawFrames();
  }

  function popFit(dur = 1.0) {
    const n = pool.length;
    const cols = n > 16 ? 4 : n > 4 ? 2 : 1;
    const rows = Math.ceil(n / cols);
    const w = cols * (D.length * unit + 1.6);
    const hgt = rows * 1.25;
    const aspect = stage.camera.aspect;
    const half = Math.max(w / 2 / aspect, hgt / 2) + 1.5;
    const dist = half / Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2));
    return stage.frame(new THREE.Vector3(0, POP_Y, 0), dist, new THREE.Vector3(0.05, 0.12, 1), dur);
  }

  async function popDenature() {
    hud.status('95℃：すべての二本鎖がほどけます。');
    const sp: { g: THREE.Group; y: number; dir: number }[] = [];
    for (const [x, y] of pool) for (const s of [x, y]) sp.push({ g: rodFor(s), y: rodFor(s).position.y, dir: s.dir });
    await tween(stage, 0.8, (e) => sp.forEach((r) => (r.g.position.y = r.y + r.dir * 0.22 * e)));
  }
  let primerMarks: THREE.Mesh[] = [];
  async function popAnneal() {
    hud.status('55℃：1本1本の鎖にプライマーが結合します。');
    primerMarks = [];
    pool.forEach(([x, y]) => {
      for (const s of [x, y]) {
        const m = new THREE.Mesh(rodGeo, mat(s.dir === 1 ? COL.R : COL.F));
        const pa = s.dir === 1 ? D.rev - D.primerLen : D.fwd;
        m.scale.set(D.primerLen * unit, 1.35, 1.35);
        m.position.copy(rodFor(s).position).add(new THREE.Vector3((pa + D.primerLen / 2) * unit, s.dir === 1 ? -0.3 : 0.3, 0));
        pop.add(m);
        primerMarks.push(m);
      }
    });
    await tween(stage, 0.6, (e) => primerMarks.forEach((m) => (m.scale.y = m.scale.z = 1.35 * e + 0.001)));
  }
  async function popExtend() {
    hud.status('72℃：ポリメラーゼがそれぞれの鎖を写し取り、二本鎖の数が2倍に。');
    for (const m of primerMarks) pop.remove(m);
    primerMarks = [];
    const before = new Set(pool.flat().map((s) => s.id));
    pool = cycle(pool, D, cycleNo + 1);
    const fresh = pool.flat().filter((s) => !before.has(s.id));
    // new strands appear beside their template and grow from the primer
    pool.forEach(([tplS, nw]) => {
      if (!fresh.includes(nw)) return;
      rodFor(nw).position.copy(rodFor(tplS).position).add(new THREE.Vector3(0, nw.dir === 1 ? 0.4 : -0.4, 0));
    });
    await tween(stage, 1.2, (e) => fresh.forEach((s) => {
      const body = rodFor(s).userData.body as THREE.Mesh;
      body.scale.x = Math.max(0.01, (s.b - s.a) * unit * e);
      const anchor = s.dir === 1 ? s.a : s.b;
      body.position.x = (anchor + (s.dir === 1 ? 1 : -1) * (s.b - s.a) * e / 2) * unit;
    }));
    await layoutPool(0.9);
  }

  // ---------------------------------------------------------------- temperature logic
  async function setTemp(t: number) {
    temp = t;
    history.push(t);
    drawTemp();
    setGlow(t);
    tempOut.textContent = `${t}℃`;
    if (busy) return;
    busy = true;
    try {
      await react(t);
    } finally {
      busy = false;
      updateCounts();
    }
  }

  async function react(t: number) {
    const step = stepFor(t);
    const atomic = cycleNo === 0;
    if (step === 'denature') {
      if (phase !== 'duplex') return hud.status('すでに1本鎖です。次は温度を下げてプライマーを結合させましょう。');
      if (atomic) await atomicDenature();
      else await popDenature();
      phase = 'single';
      mission.complete('denature');
      return;
    }
    if (step === 'anneal') {
      if (phase === 'duplex') return hud.status('二本鎖のままなので、プライマーが入り込めません。まず95℃でほどきましょう。', 'warn');
      if (phase === 'primed') return hud.status('プライマーはもう結合しています。72℃で伸ばしましょう。');
      if (!reagents.primer) {
        mission.complete('missing', 'プライマーがないと、ポリメラーゼは合成を始められない');
        return hud.status('<b>プライマーがありません。</b> DNAポリメラーゼは何もないところから合成を始められないので、何も起きません。', 'bad');
      }
      if (atomic) await atomicAnneal();
      else await popAnneal();
      phase = 'primed';
      mission.complete('anneal');
      return;
    }
    if (step === 'extend') {
      if (phase === 'duplex') return hud.status('二本鎖のままです。まず95℃でほどきましょう。', 'warn');
      if (phase === 'single') return hud.status('プライマーが結合していないので、伸ばす起点がありません（先に55℃）。', 'warn');
      if (!reagents.pol || !reagents.dntp) {
        mission.complete('missing', `${!reagents.pol ? 'ポリメラーゼ' : 'dNTP'}がないと伸長しない`);
        return hud.status(`<b>${!reagents.pol ? 'DNAポリメラーゼ' : '材料のdNTP'}がありません。</b> プライマーは結合していますが、鎖は伸びません。`, 'bad');
      }
      if (atomic) {
        await atomicExtend();
        pool = cycle(pool, D, 1);
        cycleNo = 1;
        phase = 'duplex';
        mission.complete('extend');
        hud.card(`<h4>1サイクル完了：二本鎖が2つに</h4><p>上下とも「元の鋳型 ＋ 新しい鎖」。新しい鎖はプライマーから鋳型の端まで伸びるので、まだ目的の長さより長い鎖です。</p>
          <p class="note">ここからは分子を1本の棒で表して、全体の増え方を見ます。もう一度 95 → 55 → 72℃ を回してください。</p>`);
        await toPopulation();
      } else {
        await popExtend();
        cycleNo++;
        phase = 'duplex';
        const nT = pool.filter((x) => isTarget(x, D)).length;
        if (nT > 0 && cycleNo === 3) {
          mission.complete('target');
          hud.card(`<h4>3サイクル目：目的の長さの二本鎖が登場</h4><p>8本のうち <b>${nT}本</b>（黄色の枠）が、両端がプライマーでそろった「目的の長さだけ」の二本鎖です。講義スライドの黄色い枠と同じです。</p>
            <p>ここから先は、この短い産物が倍々で増えて全体の大部分を占めていきます（n サイクル後 2<sup>n</sup> − 2n 本）。</p>`);
        }
        await popFit(0.8);
      }
      hud.status(`${cycleNo} サイクル完了。`);
      return;
    }
    if (t < 50 && phase !== 'duplex') {
      hud.status('温度が低すぎます。プライマーが似た配列にもくっつき（非特異的結合）、ほどいた鎖どうしも元に戻ってしまいます。', 'warn');
      return;
    }
    hud.status(`${t}℃ では何も起きません。95℃（熱変性）・55℃（アニーリング）・72℃（伸長）を使います。`);
  }

  async function toPopulation() {
    await wait(stage, 0.6);
    // the two atomic duplexes become the first two rows of the population
    await layoutPool(0.01);
    drawFrames();
    await stage.frame(new THREE.Vector3(0, (POP_Y) / 2, 0), 40, new THREE.Vector3(0.05, 0.1, 1), 1.2);
    await popFit(1.0);
    tpl.visible = up.visible = low.visible = false;
  }

  // ---------------------------------------------------------------- auto 30 cycles + charts
  async function auto() {
    if (busy || cycleNo === 0) {
      hud.toast('まず1サイクル目を自分の手で回してください。', 'bad');
      return;
    }
    busy = true;
    for (let i = cycleNo; i < 30; i++) {
      history.push(95, 55, 72);
      cycleNo++;
      drawTemp();
      updateCounts();
      drawAmp();
      await wait(stage, 0.08);
    }
    busy = false;
    mission.complete('auto');
    hud.card(`<h4>30サイクル：約 ${(Math.pow(2, 30) / 1e9).toFixed(2)} × 10<sup>9</sup> 倍</h4>
      <p>二本鎖は理想的には 2<sup>30</sup> ＝ 1,073,741,824 倍。そのうち目的の長さの産物は 2<sup>30</sup> − 60 本で、ほぼ全部を占めます。</p>
      <p>右下のグラフはリアルタイムPCRの蛍光。最初の鋳型が10倍多いと、閾値（点線）を約3.3サイクル早く超えます（Ct値が小さい）。</p>`);
  }

  // ---------------------------------------------------------------- panel
  const tempOut = h('b', { class: 'temp-out' }, `${temp}℃`);
  const slider = h('input', { type: 'range', min: 4, max: 99, value: temp, 'aria-label': '温度' }) as HTMLInputElement;
  slider.addEventListener('input', () => { tempOut.textContent = `${slider.value}℃`; setGlow(+slider.value); });
  slider.addEventListener('change', () => setTemp(+slider.value));
  const preset = (t: number, label: string, cls: string) => h('button', { class: 'tool ' + cls, onclick: () => { slider.value = String(t); setTemp(t); } }, h('b', {}, `${t}℃`), h('small', {}, label));
  const counts = h('div', { class: 'counts' });
  const tempCanvas = h('canvas', { class: 'chart', width: 640, height: 220 }) as HTMLCanvasElement;
  const ampCanvas = h('canvas', { class: 'chart', width: 640, height: 260 }) as HTMLCanvasElement;
  const toggles = (['primer', 'pol', 'dntp'] as const).map((k) => {
    const cb = h('input', { type: 'checkbox', checked: true }) as HTMLInputElement;
    cb.addEventListener('change', () => { reagents[k] = cb.checked; });
    return h('label', { class: 'switch' }, cb, { primer: 'プライマー', pol: 'Taq DNAポリメラーゼ', dntp: 'dNTP（材料）' }[k]);
  });
  panel.append(
    h('h3', {}, 'サーマルサイクラー（温度を動かす）'),
    h('div', { class: 'thermo' }, tempOut, slider),
    h('div', { class: 'tool-grid three' }, preset(95, '熱変性', 'hot'), preset(55, 'アニーリング', 'cool'), preset(72, '伸長', 'warm')),
    counts,
    h('h3', {}, 'あなたの温度プロファイル'),
    tempCanvas,
    h('h3', {}, '反応液（外すと何が起きない？）'),
    h('div', { class: 'row' }, ...toggles),
    h('div', { class: 'row' }, h('button', { class: 'ghost small', onclick: auto }, '残りを自動で30サイクルまで')),
    h('h3', {}, '増え方（対数）とリアルタイムPCR'),
    ampCanvas);

  function updateCounts() {
    const total = Math.pow(2, cycleNo);
    counts.innerHTML = `<div><span>サイクル</span><b>${cycleNo}</b></div><div><span>二本鎖DNA</span><b>${total.toLocaleString()}</b></div><div><span>目的の長さ</span><b>${targetCount(cycleNo).toLocaleString()}</b></div>`;
  }

  function drawTemp() {
    const g = tempCanvas.getContext('2d')!;
    const W = tempCanvas.width, H = tempCanvas.height;
    g.clearRect(0, 0, W, H);
    const y = (t: number) => H - 20 - (t / 100) * (H - 34);
    g.font = '20px system-ui';
    for (const [t, c] of [[95, '#ff6b6b'], [72, '#ffb547'], [55, '#59d8a1']] as const) {
      g.strokeStyle = c + '66';
      g.setLineDash([6, 6]);
      g.beginPath(); g.moveTo(40, y(t)); g.lineTo(W, y(t)); g.stroke();
      g.fillStyle = c; g.fillText(String(t), 2, y(t) + 6);
    }
    g.setLineDash([]);
    const pts = history.slice(-40);
    const dx = (W - 50) / Math.max(1, pts.length);
    g.strokeStyle = '#e8edf6';
    g.lineWidth = 3;
    g.beginPath();
    pts.forEach((t, i) => {
      const x0 = 44 + i * dx;
      if (i === 0) g.moveTo(x0, y(t)); else g.lineTo(x0, y(t));
      g.lineTo(x0 + dx * 0.75, y(t));
    });
    g.stroke();
  }

  function drawAmp() {
    const g = ampCanvas.getContext('2d')!;
    const W = ampCanvas.width, H = ampCanvas.height;
    g.clearRect(0, 0, W, H);
    const half = W / 2 - 10;
    // left: log10 copies per cycle
    const X = (c: number) => 36 + (c / 30) * (half - 40);
    const Y = (v: number) => H - 28 - (v / 9.5) * (H - 48);
    g.fillStyle = '#93a0b8'; g.font = '18px system-ui';
    g.fillText('log₁₀(本数)', 6, 18);
    g.fillText('サイクル', half - 70, H - 4);
    g.strokeStyle = '#59d8a1'; g.lineWidth = 3; g.beginPath();
    for (let c = 0; c <= cycleNo; c++) { const v = Math.log10(Math.pow(2, c)); if (c === 0) g.moveTo(X(c), Y(v)); else g.lineTo(X(c), Y(v)); }
    g.stroke();
    g.strokeStyle = '#ffe066'; g.beginPath();
    for (let c = 3; c <= cycleNo; c++) { const v = Math.log10(targetCount(c)); if (c === 3) g.moveTo(X(c), Y(v)); else g.lineTo(X(c), Y(v)); }
    g.stroke();
    // right: real-time PCR curves for 10^2, 10^3, 10^4 starting copies
    const ox = W / 2 + 10;
    const X2 = (c: number) => ox + 20 + (c / 40) * (W - ox - 30);
    const Y2 = (f: number) => H - 28 - (f / 100) * (H - 48);
    g.fillStyle = '#93a0b8';
    g.fillText('蛍光（リアルタイムPCR）', ox, 18);
    g.strokeStyle = '#ff6b8166'; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(ox + 20, Y2(10)); g.lineTo(W, Y2(10)); g.stroke(); g.setLineDash([]);
    const cols = ['#ff6b6b', '#59d8a1', '#7ab8ff'];
    [1e4, 1e3, 1e2].forEach((n0, i) => {
      g.strokeStyle = cols[i]; g.lineWidth = 3; g.beginPath();
      for (let c = 0; c <= Math.min(40, cycleNo + 10); c += 0.25) { const f = fluorescence(c, n0); if (c === 0) g.moveTo(X2(c), Y2(f)); else g.lineTo(X2(c), Y2(f)); }
      g.stroke();
      if (cycleNo >= 20) { g.fillStyle = cols[i]; g.fillText(`10^${Math.log10(n0)}: Ct ${ct(n0).toFixed(1)}`, ox + 22, 42 + i * 22); }
    });
  }
  updateCounts();
  drawTemp();
  drawAmp();
  hud.status('右上は増やしたいDNA（鋳型）。左の温度計を動かして、まず <b>95℃</b> にしてみましょう。');
}
