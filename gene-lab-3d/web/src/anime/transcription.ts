/**
 * アニメ「転写 — ひとつの料理店の物語」
 * Every scene is the same story (a restaurant): the recipe book is DNA, the
 * copy memo is RNA, the copyist is RNA polymerase ... Each scene shows the
 * story first, then swaps in the textbook words, then a one-line takeaway.
 * Pure function of the film clock (render mode seeks any frame).
 */
import type { Clock, Overlays } from '../film/kit';
import {
  Chara, Layer, Sprite, W, bannerHtml, bookSvg, dishSvg, doorSvg, ease, honten, kitchenSvg, memoSvg, mix, panel, pop, ramp,
  smooth, sparkleSvg, stickySvg, stripHtml, vaultSvg, win, yataiSvg, type CharaOpts,
} from './parts';
import './anime.css';

const C: Record<string, CharaOpts> = {
  scribe: { body: '#9b7bf0', hat: 'chef', item: 'pen', badge: '書' },
  sigma: { body: '#4fc3f7', hat: 'cap', hatColor: '#29b6f6', item: 'flag', badge: 'σ', hair: '#2d3a5a' },
  rho: { body: '#a1887f', hat: 'band', hatColor: '#ff7043', item: 'broom', badge: 'ρ', hair: '#5d4037' },
  boss: { body: '#ef5350', hat: 'crown', hatColor: '#ffd54f', badge: '店', hair: '#3e2723' },
  milk: { body: '#fff59d', hat: 'beret', hatColor: '#f8bbd0', item: 'glass', badge: '乳', hair: '#8d6e63' },
  crp: { body: '#ffb74d', hat: 'band', hatColor: '#ffffff', item: 'bell', badge: 'CRP', hair: '#4e342e' },
  pol1: { body: '#64b5f6', hat: 'chef', item: 'pen', badge: 'I' },
  pol2: { body: '#9b7bf0', hat: 'chef', item: 'pen', badge: 'II', tail: true },
  pol3: { body: '#81c784', hat: 'chef', item: 'pen', badge: 'III' },
  tfD: { body: '#ff8a80', hat: 'cap', hatColor: '#ff5252', badge: 'D' },
  tfB: { body: '#ffd180', hat: 'cap', hatColor: '#ffab40', badge: 'B' },
  tfF: { body: '#b9f6ca', hat: 'cap', hatColor: '#00e676', badge: 'F' },
  tfE: { body: '#80d8ff', hat: 'cap', hatColor: '#40c4ff', item: 'mega', badge: 'E' },
  tfH: { body: '#ea80fc', hat: 'cap', hatColor: '#e040fb', badge: 'H' },
  med: { body: '#aed581', hat: 'cap', hatColor: '#7cb342', item: 'letter', badge: 'M' },
  untie: { body: '#ffcc80', hat: 'band', hatColor: '#26a69a', badge: '解' },
  u1: { body: '#f48fb1', hat: 'beret', hatColor: '#ec407a', item: 'scissors', badge: 'U1' },
  u2: { body: '#ce93d8', hat: 'beret', hatColor: '#ab47bc', item: 'scissors', badge: 'U2' },
  u4: { body: '#90caf9', hat: 'beret', hatColor: '#42a5f5', badge: 'U4' },
  u5: { body: '#a5d6a7', hat: 'beret', hatColor: '#66bb6a', badge: 'U5' },
  u6: { body: '#fff59d', hat: 'beret', hatColor: '#fdd835', badge: 'U6' },
  drosha: { body: '#ff8a65', hat: 'band', hatColor: '#d84315', item: 'knife', badge: 'Dr' },
  exp: { body: '#4dd0e1', hat: 'cap', hatColor: '#00acc1', badge: 'Ex5' },
  dicer: { body: '#ba68c8', hat: 'band', hatColor: '#6a1b9a', item: 'scissors', badge: 'Di' },
  risc: { body: '#546e7a', hat: 'cap', hatColor: '#263238', item: 'loupe', badge: 'RISC', hair: '#212121' },
  sno: { body: '#80cbc4', hat: 'band', hatColor: '#00897b', item: 'cloth', badge: 'sno' },
  bmal: { body: '#5c6bc0', hat: 'crown', hatColor: '#ffd54f', badge: 'B1' },
  clk: { body: '#26a69a', hat: 'crown', hatColor: '#ffd54f', badge: 'Clk' },
  mito: { body: '#ffb74d', hat: 'helmet', hatColor: '#ffeb3b', badge: '派' },
};

export async function buildTranscription(host: HTMLElement, clock: Clock, ov: Overlays) {
  const T = (id: string) => clock.at(id);
  const E = (id: string) => clock.end(id);
  const cueOf = (id: string) => clock.timing.cues.find((c) => c.id === id)!;
  /** when a word of a cue is (about) spoken: by its position in the subtitle text */
  const say = (id: string, word: string) => {
    const c = cueOf(id);
    const i = c.text.indexOf(word);
    return c.start + c.dur * (i < 0 ? 0 : i / c.text.length);
  };
  const scene = (id: string) => clock.scene(id);
  const talking = (t: number, id: string) => t >= T(id) && t < E(id);

  // stage: 1920x1080 design space scaled to the frame
  host.classList.add('anime-host');
  const stage = document.createElement('div');
  stage.className = 'anime-stage';
  host.append(stage);
  const fit = () => { stage.style.transform = `scale(${host.clientWidth / W})`; };
  fit();
  addEventListener('resize', fit);

  const bg = document.createElement('div');
  bg.className = 'anime-bg';
  stage.append(bg);

  // ---------------------------------------------------------------- shared UI layer (above every scene)
  const ui = new Layer(stage, 'ui');
  const banner = ui.sprite('', 1400, 120, 'banner-sp');
  const tpanel = ui.sprite('', 760, 520, 'tpanel-sp');

  /** "教科書の言葉では" panel with rows revealed at given times */
  let dimNow = 0;
  function textbook(t: number, a: number, b: number, title: string, rows: [string, string][], times: number[], pos = { x: 1460, y: 420 }) {
    const o = win(t, a, b, 0.4);
    if (o <= 0) return false;
    dimNow = Math.max(dimNow, o);
    tpanel.html(panel(title, rows));
    tpanel.set({ x: pos.x, y: pos.y, o, s: 0.92 + 0.08 * ease((t - a) / 0.4) });
    tpanel.el.querySelectorAll<HTMLElement>('.tr').forEach((r, i) => {
      const k = ramp(t, times[i] ?? a, 0.4);
      r.style.opacity = String(k);
      r.style.transform = `translateX(${(1 - k) * 30}px)`;
    });
    return true;
  }
  function hito(t: number, at: number, until: number, text: string) {
    const o = win(t, at, until, 0.35);
    if (o <= 0) return false;
    banner.html(bannerHtml(text));
    banner.set({ x: 960, y: 800, o, s: pop(t, at, 0.5) * 0.98 + 0.02 });
    return true;
  }

  // ---------------------------------------------------------------- scenes
  type Sc = { id: string; layer: Layer; bg: string; update: (t: number) => void };
  const scenes: Sc[] = [];
  const mk = (id: string, bgCls: string, update: (L: Layer) => (t: number) => void) => {
    const layer = new Layer(stage, 'scene');
    scenes.push({ id, layer, bg: bgCls, update: update(layer) });
  };
  const spark = (L: Layer, n: number, color = '#ffe066') => Array.from({ length: n }, () => L.sprite(sparkleSvg(color), 40, 40));
  const twinkle = (sp: Sprite[], t: number, cx: number, cy: number, r: number, o = 1) => sp.forEach((s, i) => {
    const a = i * 2.4 + t * 0.4, ph = (t * 0.9 + i * 0.37) % 1;
    s.set({ x: cx + Math.cos(a) * r * (0.6 + 0.4 * ((i * 0.618) % 1)), y: cy + Math.sin(a) * r * 0.6, s: Math.sin(ph * Math.PI) * 0.9, r: t * 40 + i * 30, o });
  });

  // ===== title
  mk('title', 'bg-night', (L) => {
    const book = L.sprite(bookSvg(false, true), 420, 290);
    const logo = L.sprite('<div class="logo"><small>アニメで学ぶ遺伝医学</small><h1>転写</h1><p>ひとつの料理店の物語</p></div>', 1100, 420);
    const sc = new Chara(L, C.scribe, 260);
    const sp = spark(L, 10);
    return (t) => {
      logo.set({ x: 760, y: 420, s: pop(t, 0.4, 0.7), o: ramp(t, 0.3, 0.5) });
      book.set({ x: 1450, y: 330, s: 1, r: Math.sin(t * 1.3) * 3 });
      twinkle(sp, t, 1450, 330, 230);
      sc.act(t, { x: 1460, y: 700 }, { armR: 60 + Math.sin(t * 6) * 30, talk: false });
    };
  });

  // ===== cast
  mk('cast', 'bg-warm', (L) => {
    const items: { svg: string; a: string; b: string; at: () => number }[] = [
      { svg: bookSvg(false), a: '秘伝のレシピ本', b: 'DNA', at: () => say('a01', '秘伝') },
      { svg: memoSvg('たまごをわる', 200), a: '書き写しメモ', b: 'RNA', at: () => say('a02', 'レシピの') },
      { svg: '', a: '書き写し係', b: 'RNAポリメラーゼ', at: () => say('a02', '書き写す係') },
      { svg: stickySvg(), a: '「ここから→」の付箋', b: 'プロモーター', at: () => say('a04', '付箋') },
      { svg: kitchenSvg(), a: '厨房', b: 'リボソーム', at: () => say('a04', '厨房') },
      { svg: doorSvg(0, ''), a: '金庫室のドア', b: '核膜', at: () => say('a04', '金庫室') },
    ];
    const cards = items.map((it) => L.sprite(`<div class="card"><div class="pic">${it.svg}</div><div class="nm">${it.a}</div><div class="term">${it.b}</div></div>`, 520, 330));
    const sc = new Chara(cards[2].el.querySelector('.pic') as HTMLElement, C.scribe, 170);
    return (t) => {
      cards.forEach((c, i) => {
        const at = items[i].at();
        c.set({ x: 340 + (i % 3) * 620, y: 250 + Math.floor(i / 3) * 370, s: pop(t, at, 0.5), o: ramp(t, at - 0.05, 0.3) });
        c.el.classList.toggle('lit', t > at + 0.8);
      });
      sc.act(t, { x: 260, y: 110 }, { talk: talking(t, 'a03'), armR: talking(t, 'a03') ? 70 + Math.sin(t * 7) * 25 : 10, blinkSeed: 2 });
    };
  });

  // ===== s1: why copy
  mk('s1', 'bg-warm', (L) => {
    const vault = L.sprite(vaultSvg(0), 300, 300);
    const book = L.sprite(bookSvg(false, true), 300, 210);
    const vl = L.sprite('<div class="lbl lbl-big">金庫室</div>', 300, 60);
    const kit = L.sprite(kitchenSvg(), 520, 370);
    const kl = L.sprite('<div class="lbl lbl-big">厨房</div>', 300, 60);
    const memos = Array.from({ length: 4 }, () => L.sprite(memoSvg('レシピ', 140), 140, 90));
    const dishes = ['#ff8a65', '#ffd54f', '#aed581', '#4fc3f7'].map((c) => L.sprite(dishSvg(c), 150, 88));
    const sc = new Chara(L, C.scribe, 230);
    const ban = L.sprite('<div class="noentry">持ち込み禁止</div>', 260, 80);
    const dogma = L.sprite('<div class="dogma"><span class="d">DNA</span><i>転写</i><span class="r">RNA</span><i>翻訳</i><span class="p">タンパク質</span></div>', 1300, 140);
    const sp = spark(L, 6);
    return (t) => {
      const vx = 300, kx = 1500;
      vault.set({ x: vx, y: 420 });
      book.set({ x: vx, y: 420 + Math.sin(t * 1.5) * 4, s: 0.85 });
      twinkle(sp, t, vx, 420, 150);
      vl.set({ x: vx, y: 250 });
      kit.set({ x: kx, y: 470 });
      kl.set({ x: kx, y: 250 });
      ban.set({ x: vx, y: 610, o: win(t, say('a05', '汚したら'), say('a06', '必要な'), 0.3), s: pop(t, say('a05', '汚したら')) });
      // the copyist walks between book and kitchen carrying memos
      const go = ramp(t, say('a06', '持って') - 0.6, 2.4);
      const many = ramp(t, T('a07'), 1.2);
      const x = mix(vx + 260, kx - 300, go);
      sc.act(t, { x, y: 640, flip: false }, { walk: go > 0.02 && go < 0.98 ? 1 : 0, talk: talking(t, 'a07'), armR: 40, blinkSeed: 1 });
      memos.forEach((m, i) => {
        const appear = say('a06', 'メモ') + i * 0.12;
        const show = i === 0 ? ramp(t, appear, 0.4) : many;
        const tx = x + 70 + (i ? (i - 1.5) * 90 : 0), ty = 520 - (i ? 80 + (i % 2) * 40 : 0);
        m.set({ x: i === 0 ? mix(vx, tx, ramp(t, appear, 0.6)) : tx, y: i === 0 ? mix(420, ty, ramp(t, appear, 0.6)) : ty, o: show * (1 - ramp(t, E('a07') + 0.5, 0.6)), r: (i - 1.5) * 8 + Math.sin(t * 3 + i) * 3, s: 0.9 });
      });
      dishes.forEach((d, i) => {
        const at = T('a07') + 0.6 + i * 0.35;
        d.set({ x: kx - 150 + i * 100, y: 320 - (i % 2) * 30, s: pop(t, at), o: ramp(t, at, 0.2) * (1 - ramp(t, T('a08') + 0.2, 0.5)) });
      });
      // textbook + dogma + one line
      textbook(t, T('a08'), E('a09') - 0.2, '教科書の言葉では', [['秘伝のレシピ本', 'DNA（守る原本）'], ['書き写しメモ', 'RNA（使い捨てコピー）'], ['書き写すこと', '転写'], ['メモの枚数', 'タンパク質の量を調節']],
        [say('a08', 'DNA'), say('a08', '使い捨て'), say('a08', '転写'), say('a08', 'メモの枚数')], { x: 1440, y: 430 });
      dogma.set({ x: 960, y: 760, o: win(t, T('a09'), E('a09') + 0.5, 0.4), s: pop(t, T('a09')) * 0.95 });
      hito(t, say('a09', '一言で'), E('a09') + 0.6, '原本は守って、コピーを使う');
      const story = 1 - ramp(t, T('a08'), 0.5);
      kit.set({ o: story }); kl.set({ o: story }); sc.set({ o: story });
    };
  });

  // ===== s2: which page (template strand)
  mk('s2', 'bg-paper', (L) => {
    const book = L.sprite(bookSvg(true), 1000, 680);
    const left = L.sprite('<div class="pg">たまごを わる</div>', 380, 120);
    const right = L.sprite('<div class="pg mirror">たまごを わる</div>', 380, 120);
    const lp = L.sprite('<div class="lbl">左：普通の文字</div>', 300, 50);
    const rp = L.sprite('<div class="lbl">右：鏡文字</div>', 300, 50);
    const memo = L.sprite('<div class="memo memo-big"><span class="mt"></span></div>', 460, 120);
    const sc = new Chara(L, C.scribe, 210);
    const eq = L.sprite('<div class="eq">＝ 同じ文章！</div>', 360, 90);
    const seq = L.sprite(`<div class="seqbox">
      <div class="sr"><b>非鋳型鎖（コード鎖）</b><span>5′- A T G G C T -3′</span></div>
      <div class="sr tm"><b>鋳型鎖（なぞる）</b><span>3′- T A C C G A -5′</span></div>
      <div class="sr rn"><b>RNA（メモ）</b><span>5′- A <u>U</u> G G C <u>U</u> -3′</span></div></div>`, 980, 300);
    const warn = L.sprite('<div class="warn">ひっかけ注意！ RNAと同じ配列 ＝ <b>非鋳型鎖</b></div>', 1100, 100);
    return (t) => {
      const story = 1 - ramp(t, T('a13') - 0.2, 0.5);
      book.set({ x: 960, y: 400, o: story });
      left.set({ x: 760, y: 360, o: story });
      right.set({ x: 1160, y: 360, o: story });
      lp.set({ x: 760, y: 200, o: story * ramp(t, say('a10', '左'), 0.3) });
      rp.set({ x: 1160, y: 200, o: story * ramp(t, say('a10', '右'), 0.3) });
      // tracing the mirror page writes the memo letter by letter
      const tr = smooth((t - T('a11') - 0.3) / (clock.dur('a11') - 0.6));
      const text = 'たまごを わる';
      const n = Math.floor(tr * text.length + 0.001);
      memo.html(`<div class="memo memo-big"><span class="mt">${text.slice(0, n)}</span></div>`);
      memo.set({ x: 960, y: 650, o: story * ramp(t, T('a11'), 0.3) });
      sc.act(t, { x: mix(1030, 1290, tr), y: 470 + Math.sin(tr * 20) * 6, s: 0.9 }, { talk: talking(t, 'a11'), armR: 50 + Math.sin(t * 12) * 10, blinkSeed: 3 });
      sc.set({ o: story * ramp(t, T('a10') + 1, 0.4) });
      const eqo = win(t, say('a12', '同じ'), E('a12') + 0.3, 0.3) * story;
      eq.set({ x: 760, y: 520, o: eqo, s: pop(t, say('a12', '同じ')) });
      left.el.classList.toggle('glow', eqo > 0.5);
      memo.el.classList.toggle('glow', eqo > 0.5);
      seq.set({ x: 570, y: 420, o: win(t, T('a13'), E('a14') + 0.4, 0.4), s: 0.95 + 0.05 * ramp(t, T('a13'), 0.5) });
      textbook(t, T('a13'), E('a14') + 0.4, '教科書の言葉では', [['なぞる鏡文字のページ', '鋳型鎖'], ['なぞらないページ', '非鋳型鎖（コード鎖）'], ['メモ', 'RNA（T→U）']],
        [say('a13', '鋳型鎖'), say('a13', '非鋳型鎖'), say('a13', 'RNAは')], { x: 1510, y: 400 });
      warn.set({ x: 760, y: 690, o: win(t, T('a14'), E('a14') + 0.4, 0.3), s: pop(t, T('a14')) });
      hito(t, E('a14') - 0.6, E('a14') + 0.6, '鏡文字（鋳型鎖）をなぞると、普通の文字（非鋳型鎖と同じ）になる');
    };
  });

  // ===== s3: 5' -> 3'
  mk('s3', 'bg-paper', (L) => {
    const strip = L.sprite('<div class="mstrip"></div>', 1400, 120);
    const letters = 'AUGGCUAC';
    const stamps = [...letters].map((b) => L.sprite(`<div class="astamp b-${b}"><div class="ink">PPP</div><div class="face">${b}</div></div>`, 110, 150));
    const ppi = [...letters].map(() => L.sprite('<div class="ppi">PPi</div>', 90, 60));
    const ends = L.sprite('<div class="ends"><span>5′</span><span>3′ →</span></div>', 1460, 60);
    const nope = L.sprite('<div class="nope">✕</div>', 120, 120);
    const sc = new Chara(L, C.scribe, 200);
    const chips = L.sprite('<div class="chips"><span class="ng">dNTP ✕</span><span class="ok">NTP ○</span><span class="ok">プライマー不要</span></div>', 900, 90);
    return (t) => {
      const x0 = 330, step = 150, y = 470;
      strip.set({ x: 960, y });
      ends.set({ x: 960, y: y + 110, o: ramp(t, T('a17'), 0.4) });
      const t0 = say('a16', '押した'), dt = (E('a16') + clock.dur('a17') * 0.6 - t0) / letters.length;
      stamps.forEach((s, i) => {
        const at = t0 + i * dt;
        const press = ramp(t, at, 0.35);
        const lift = ramp(t, at + 0.45, 0.3);
        const placed = t > at + 0.4;
        const x = x0 + i * step;
        s.set({ x: placed ? x : mix(x + 200, x, press), y: placed ? y - 6 : mix(y - 260, y - 40, press), o: ramp(t, at - 0.6, 0.3), s: 0.9 });
        s.q('.astamp').classList.toggle('placed', placed);
        ppi[i].set({ x: x + 40 + lift * 60, y: y - 120 - lift * 120, o: placed ? (1 - ramp(t, at + 1.4, 0.5)) * lift : 0, r: lift * 30 });
      });
      const last = Math.min(letters.length - 1, Math.max(0, Math.floor((t - t0) / dt)));
      sc.act(t, { x: x0 + last * step + 230, y: 650, s: 0.95 }, { armR: 30 + Math.sin(t * 8) * 20, blinkSeed: 4, talk: false });
      sc.set({ o: ramp(t, T('a15'), 0.4) });
      nope.set({ x: x0 - 130, y, o: win(t, say('a15', '右端'), say('a16', 'ハンコ'), 0.3), s: pop(t, say('a15', '右端')) });
      textbook(t, T('a17'), E('a18') + 0.4, '教科書の言葉では', [['ハンコ', 'NTP（ATP・UTP・CTP・GTP）'], ['インク', '三リン酸のエネルギー'], ['右端にだけ押す', '3′端に付加 → 5′→3′'], ['落ちるインク', 'ピロリン酸（PPi）']],
        [say('a17', 'ハンコ'), say('a17', 'インク'), say('a17', '3′端'), say('a18', 'ピロリン酸')], { x: 1460, y: 250 });
      chips.set({ x: 760, y: 700, o: win(t, say('a18', '材料'), E('a18') + 0.5, 0.3), s: pop(t, say('a18', '材料')) });
      hito(t, E('a18') - 0.4, E('a18') + 0.6, 'インク付きハンコを右端に押すだけなので、5′→3′');
    };
  });

  // ===== s4: promoter
  mk('s4', 'bg-paper', (L) => {
    const strip = L.sprite(stripHtml('GTTAGCCATGGCAATCCGTAGGTTCAAGT', 'CAATCGGTACCGTTAGGCATCCAAGTTCA'), 1700, 160);
    const thick = L.sprite('<div class="thick">分厚いレシピ本</div>', 600, 300);
    const s1 = L.sprite(stickySvg('ここから→'), 200, 70);
    const s2 = L.sprite(stickySvg('←ここから', '#b2ff59'), 200, 70);
    const a = new Chara(L, C.scribe, 160), b = new Chara(L, { ...C.scribe, body: '#4db6ac' }, 160);
    const ma = L.sprite('<div class="mline"></div>', 10, 26), mb = L.sprite('<div class="mline g"></div>', 10, 26);
    const la = L.sprite('<div class="lbl sm">下のページをなぞる</div>', 280, 44), lb = L.sprite('<div class="lbl sm">上のページをなぞる</div>', 280, 44);
    return (t) => {
      const big = 1 - ramp(t, say('a20', '付箋') - 0.5, 0.6);
      thick.set({ x: 960, y: 420, o: big, s: 1 + Math.sin(t * 2) * 0.01 });
      strip.set({ x: 960, y: 420, o: 1 - big });
      const sA = say('a20', '付箋'), sB = say('a20', '矢印');
      s1.set({ x: 560, y: 300, o: ramp(t, sA, 0.3), s: pop(t, sA) });
      s2.set({ x: 1400, y: 540, o: ramp(t, sA + 0.6, 0.3), s: pop(t, sA + 0.6) });
      const g = smooth((t - sB) / 6);
      const wa = 380 * g, wb = 380 * g;
      ma.set({ x: 640 + wa / 2, y: 470, sx: Math.max(0.01, wa / 10), o: ramp(t, sB, 0.3) });
      mb.set({ x: 1320 - wb / 2, y: 370, sx: Math.max(0.01, wb / 10), o: ramp(t, sB, 0.3) });
      a.act(t, { x: 640 + wa, y: 600, s: 0.9 }, { walk: g > 0 && g < 1 ? 1 : 0, blinkSeed: 1 });
      b.act(t, { x: 1320 - wb, y: 250, s: 0.9, flip: true }, { walk: g > 0 && g < 1 ? 1 : 0, blinkSeed: 5 });
      a.set({ o: ramp(t, sB, 0.3) }); b.set({ o: ramp(t, sB, 0.3) });
      la.set({ x: 800, y: 700, o: win(t, sB + 2, E('a21') + 0.4, 0.3) });
      lb.set({ x: 1150, y: 150, o: win(t, sB + 2, E('a21') + 0.4, 0.3) });
      textbook(t, T('a21'), E('a21') + 0.6, '教科書の言葉では', [['付箋', 'プロモーター'], ['矢印の向き', '転写の方向・鋳型鎖（遺伝子ごと）']], [say('a21', 'プロモーター'), say('a21', '向き')], { x: 1440, y: 730 });
      hito(t, E('a21') - 0.8, E('a21') + 0.6, '付箋（プロモーター）が、開始場所と向きを決める');
    };
  });

  // ===== s5a: stall, start (sigma)
  mk('s5a', 'bg-yatai', (L) => {
    const yatai = L.sprite(yataiSvg(), 700, 460);
    const strip = L.sprite(stripHtml('CGTTGACAGCTATTAGCTATAATGCAUGG', 'GCAACTGTCGATAATCGATATTACGTACC', 'st5'), 1700, 160);
    const m35 = L.sprite('<div class="box35">−35<br><small>TTGACA</small></div>', 170, 90);
    const m10 = L.sprite('<div class="box35">−10<br><small>TATAAT</small></div>', 170, 90);
    const sig = new Chara(L, C.sigma, 170), sc = new Chara(L, C.scribe, 190);
    const memo = L.sprite('<div class="mline"></div>', 10, 26);
    const hb = L.sprite('<div class="hb"><div><b>A=T</b> 水素結合 2本</div><div><b>G≡C</b> 3本</div></div>', 420, 140);
    const holo = L.sprite('<div class="holo">ホロ酵素</div>', 460, 70);
    return (t) => {
      const intro = 1 - ramp(t, say('a22', '屋台の書き写し係'), 0.6);
      yatai.set({ x: 960, y: 440, o: intro, s: 1 });
      strip.set({ x: 960, y: 420, o: 1 - intro });
      const find = ramp(t, T('a23'), 2.2);
      sig.act(t, { x: mix(1700, 620, find), y: 640, flip: true, s: 1 }, { walk: find > 0 && find < 1 ? 1 : 0, talk: talking(t, 'a23'), armR: 60, blinkSeed: 2 });
      sig.set({ o: 1 - intro });
      m35.set({ x: 480, y: 270, o: ramp(t, say('a23', '目印'), 0.3), s: pop(t, say('a23', '目印')) });
      m10.set({ x: 900, y: 270, o: ramp(t, say('a23', '目印') + 0.4, 0.3), s: pop(t, say('a23', '目印') + 0.4) });
      const open = ramp(t, say('a24', '綴じ'), 1.0);
      strip.el.classList.toggle('open10', open > 0.5);
      const w0 = say('a24', '10文字'), wr = smooth((t - w0) / 3.5);
      const leave = ramp(t, say('a24', '離れて'), 2.0);
      sc.act(t, { x: mix(1700, 760, find) + wr * 260, y: 640, flip: false, s: 1 }, { walk: (find > 0 && find < 1) || (wr > 0 && wr < 1) ? 1 : 0, armR: 40, blinkSeed: 6 });
      sc.set({ o: 1 - intro });
      if (leave > 0) sig.act(t, { x: mix(620, 1900, leave), y: 640 - leave * 60, flip: false, s: 1 - leave * 0.3 }, { walk: 1, armR: 90, blinkSeed: 2 });
      memo.set({ x: 1000 + wr * 130, y: 520, sx: Math.max(0.01, wr * 26), o: wr > 0 ? 1 : 0 });
      hb.set({ x: 1460, y: 210, o: win(t, T('a26'), E('a26'), 0.3) });
      holo.set({ x: 700, y: 820, o: win(t, say('a25', 'ホロ酵素'), E('a25') + 0.3, 0.3) });
      textbook(t, T('a25'), E('a26') + 0.3, '教科書の言葉では', [['書き写し係だけ', 'コア酵素'], ['案内係', 'σ（シグマ）因子'], ['2つの目印', '−35・−10ボックス'], ['10文字で離れる', '約10 nt で σ が解離']],
        [say('a25', 'コア'), say('a25', 'σ'), say('a25', '目印'), say('a26', '約10')], { x: 1460, y: 600 });
      hito(t, say('a26', '一言で'), E('a26') + 0.6, '案内係（σ）が目印（−35と−10）を見つけ、走り出したら離れる');
    };
  });

  // ===== s5b: stall, termination
  mk('s5b', 'bg-yatai2', (L) => {
    const p = [0, 1, 2].map((i) => L.sprite(`<div class="term3"><h4>${['① 丸まる', '② はがされる', '③ 自然にはがれる'][i]}</h4><div class="art a${i}"></div><div class="tx">${['ステムループ', 'ρ（ロー）タンパク質', 'A-U の連続（弱い）'][i]}</div></div>`, 540, 560));
    const loop = L.sprite('<svg viewBox="0 0 300 240" width="100%" height="100%"><path class="lp" d="M10 200 H140 V90 a40 40 0 1 1 30 0 V200 H290" fill="none" stroke="#ff7043" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg>', 300, 240);
    const pen = L.sprite('<div class="pen">✎</div>', 80, 80);
    const rho = new Chara(L, C.rho, 150);
    const peel = L.sprite('<div class="peel">A U U U U</div>', 300, 70);
    return (t) => {
      const ts = [T('a27'), say('a28', '片付け'), say('a28', '3つ目')];
      p.forEach((s, i) => s.set({ x: 340 + i * 620, y: 470, s: pop(t, ts[i], 0.5), o: ramp(t, ts[i], 0.3) }));
      const k = ramp(t, say('a27', 'くるっと'), 1.2);
      loop.set({ x: 340, y: 480, o: ramp(t, ts[0], 0.3) });
      (loop.q('.lp') as SVGPathElement).style.strokeDasharray = `${600 * k} 900`;
      pen.set({ x: 340 + 40 * Math.sin(t * 6) * (1 - k) - 10, y: 400, o: ramp(t, ts[0], 0.3), r: k > 0.9 ? 20 : 0 });
      const pull = ramp(t, ts[1] + 0.8, 1.6);
      rho.act(t, { x: 960 - 80 + pull * 100, y: 520, s: 0.9 }, { walk: pull > 0 && pull < 1 ? 1 : 0, armL: 60, armR: 60, blinkSeed: 3 });
      rho.set({ o: ramp(t, ts[1], 0.3) });
      const pe = ramp(t, ts[2] + 0.8, 1.6);
      peel.set({ x: 1580, y: 520 - pe * 70, r: -pe * 12, o: ramp(t, ts[2], 0.3) });
      hito(t, T('a29'), E('a29') + 0.6, '丸まる、はがされる、自然にはがれる、の3つで止まる');
    };
  });

  // ===== s5c: lac operon
  mk('s5c', 'bg-yatai', (L) => {
    const page = L.sprite('<div class="lacpage"><div class="ttl">特別レシピ</div><div class="genes"><span>lacZ</span><span>lacY</span><span>lacA</span></div></div>', 640, 300);
    const weight = L.sprite('<div class="weight">文鎮</div>', 300, 90);
    const rice = L.sprite('<div class="rice"><div class="bowl"></div><div class="grain"></div><span>ご飯（グルコース）</span></div>', 260, 220);
    const bell = L.sprite('<div class="bigbell">🔔</div>', 140, 140);
    const ring = L.sprite('<div class="ring"></div>', 260, 260);
    const boss = new Chara(L, C.boss, 210), milk = new Chara(L, C.milk, 180), crp = new Chara(L, C.crp, 180), sc = new Chara(L, C.scribe, 180);
    const table = L.sprite(`<div class="tt"><table><tr><th></th><th>グルコース有</th><th>グルコース無</th></tr><tr><th>ラクトース有</th><td>OFF</td><td class="on">ON</td></tr><tr><th>ラクトース無</th><td>OFF</td><td>OFF</td></tr></table></div>`, 700, 260);
    const rule = L.sprite('<div class="rule">ラクトース客が来て、しかもご飯切れのときだけ！</div>', 860, 90);
    return (t) => {
      page.set({ x: 1060, y: 420 });
      boss.act(t, { x: 300, y: 560 }, { talk: talking(t, 'a31'), armR: talking(t, 'a31') ? 80 : 10, blinkSeed: 7 });
      rule.set({ x: 760, y: 120, o: win(t, T('a31'), E('a33'), 0.3), s: pop(t, T('a31')) });
      const lift = ramp(t, say('a32', 'どきます') - 0.4, 1.0);
      weight.set({ x: 1060 + lift * 380, y: 420 - lift * 180, r: lift * 25, o: 1 - 0.3 * lift });
      milk.act(t, { x: mix(1900, 1530, ramp(t, say('a32', 'ラクトース'), 1.6)), y: 620, flip: true }, { walk: win(t, say('a32', 'ラクトース'), say('a32', 'ラクトース') + 1.6, 0.1), happy: true, blinkSeed: 4 });
      const empty = ramp(t, T('a33'), 0.8);
      rice.set({ x: 560, y: 760 });
      (rice.el.querySelector('.grain') as HTMLElement).style.transform = `scaleY(${1 - empty})`;
      const rg = say('a33', 'ベル');
      bell.set({ x: 560, y: 560, o: ramp(t, rg - 0.2, 0.2), r: Math.sin(t * 30) * 18 * win(t, rg, rg + 2, 0.2) });
      ring.set({ x: 560, y: 560, s: 0.5 + ((t - rg) % 0.8) * 1.5, o: t > rg && t < rg + 2.4 ? 1 - ((t - rg) % 0.8) / 0.8 : 0 });
      const bring = ramp(t, say('a33', '呼び込み'), 2.2);
      crp.act(t, { x: mix(-100, 860, bring), y: 640 }, { walk: bring > 0 && bring < 1 ? 1 : 0, armR: 60, blinkSeed: 8 });
      sc.act(t, { x: mix(-260, 720, bring), y: 650 }, { walk: bring > 0 && bring < 1 ? 1 : 0, blinkSeed: 9 });
      page.el.classList.toggle('on', bring > 0.95);
      textbook(t, T('a34'), T('a35'), '教科書の言葉では', [['文鎮', 'リプレッサー（負の調節）'], ['文鎮を置く場所', 'オペレーター'], ['ご飯切れのベル', 'cAMP'], ['呼び込み係', 'cAMP-CRP（正の調節）']],
        [say('a34', '文鎮'), say('a34', '置く'), say('a34', 'ベル'), say('a34', '呼び込み')], { x: 1480, y: 560 });
      table.set({ x: 1440, y: 620, o: win(t, T('a35'), E('a35') + 0.5, 0.3) });
      hito(t, say('a35', '一言で'), E('a35') + 0.6, '文鎮がどいて、ベルが鳴ったときだけ書く');
    };
  });

  // ===== s6a: main restaurant, three copyists
  mk('s6a', 'bg-honten', (L) => {
    const hon = L.sprite(honten(), 900, 520);
    const vault = L.sprite(vaultSvg(0), 260, 260);
    const book = L.sprite(bookSvg(false) + '<div class="rope"></div>', 260, 180);
    const ps = [C.pol1, C.pol2, C.pol3].map((o) => new Chara(L, o, 190));
    const outs = [
      '<div class="out"><b>Pol I</b><span>厨房の部品</span><em>rRNA（18S・5.8S・28S）</em></div>',
      '<div class="out"><b>Pol II</b><span>料理のレシピ</span><em>mRNA（miRNA・snRNA も）</em></div>',
      '<div class="out"><b>Pol III</b><span>トレーなど小物</span><em>tRNA・5S rRNA</em></div>'].map((h) => L.sprite(h, 460, 200));
    return (t) => {
      const intro = 1 - ramp(t, say('a37', '3人'), 0.6);
      hon.set({ x: 700, y: 430, o: intro });
      vault.set({ x: 1450, y: 420, o: intro });
      book.set({ x: 1450, y: 420, o: intro * ramp(t, say('a36', 'ひも'), 0.4), s: 0.8 });
      const at = [say('a37', 'Pol I'), say('a37', 'Pol II'), say('a37', 'Pol III')];
      ps.forEach((p, i) => p.act(t, { x: 360 + i * 600, y: 360 }, { armR: 50, happy: true, blinkSeed: i }).set({ o: ramp(t, at[i] - 0.4, 0.3) }));
      outs.forEach((o, i) => o.set({ x: 360 + i * 600, y: 620, o: ramp(t, at[i], 0.3), s: pop(t, at[i]) }));
      hito(t, T('a38'), E('a38') + 0.6, '部品は I、レシピは II、小物は III');
    };
  });

  // ===== s6b: D B F E H
  mk('s6b', 'bg-honten2', (L) => {
    const strip = L.sprite(stripHtml('GCTATAAAAGGCTTCACGTAGCATGCA', 'CGATATTTTCCGAAGTGCATCGTACGT', 'st6'), 1700, 160);
    const tata = L.sprite('<div class="box35">TATA<br><small>ボックス</small></div>', 170, 90);
    const order = L.sprite('<div class="order"><span>D</span><span>B</span><span>F</span><span>E</span><span>H</span></div>', 700, 90);
    const tf = [C.tfD, C.tfB, C.tfF, C.tfE, C.tfH].map((o) => new Chara(L, o, 150));
    const pol = new Chara(L, C.pol2, 180);
    const chair = L.sprite('<div class="chair">🪑</div>', 100, 100);
    const memo = L.sprite('<div class="mline"></div>', 10, 26);
    return (t) => {
      const ts = [say('a40', '1人目'), say('a41', '2人目'), say('a41', '3人目'), say('a41', '4人目'), say('a42', '最後')];
      const bend = ramp(t, say('a40', '折り曲げる'), 0.8);
      strip.set({ x: 960, y: 420 });
      strip.el.style.setProperty('--bend', String(bend));
      strip.el.classList.toggle('bent', bend > 0.1);
      const opened = ramp(t, say('a42', '本を開き'), 0.8);
      strip.el.classList.toggle('open10', opened > 0.5);
      tata.set({ x: 560, y: 270, o: ramp(t, ts[0], 0.3) });
      order.set({ x: 960, y: 110 });
      order.el.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', t > ts[i]));
      const slots = [560, 700, 840, 980, 1120];
      tf.forEach((c, i) => {
        const k = ramp(t, ts[i] - 0.2, 1.2);
        const leave = i === 4 ? 0 : 0;
        c.act(t, { x: mix(-120, slots[i], k), y: 620 + leave, s: 0.9 }, { walk: k > 0 && k < 1 ? 1 : 0, armR: i === 3 && talking(t, 'a41') ? 70 : 20, talk: i === 4 && talking(t, 'a43'), blinkSeed: i });
      });
      chair.set({ x: 820, y: 520, o: win(t, ts[1] + 0.6, ts[2] + 1, 0.3), s: pop(t, ts[1] + 0.6) });
      const come = ramp(t, ts[2], 1.6);
      const go = ramp(t, T('a43'), 3.0);
      pol.act(t, { x: mix(-260, 820, come) + go * 900, y: 470, s: 0.8 }, { walk: (come > 0 && come < 1) || go > 0 ? 1 : 0, armR: 40, happy: true, blinkSeed: 7 });
      pol.ctd(ramp(t, say('a42', 'リン酸化'), 0.6));
      memo.set({ x: 900 + go * 420, y: 520, sx: Math.max(0.01, go * 84), o: go > 0 ? 1 : 0 });
      hito(t, say('a44', '一言で'), E('a44') + 0.6, 'D・B・F・E・Hの順に集まり、Hが開いて押す');
    };
  });

  // ===== s6c: enhancer
  mk('s6c', 'bg-honten2', (L) => {
    const loop = L.sprite('<svg viewBox="0 0 1700 520" width="100%" height="100%"><path class="lp" fill="none" stroke="#d7ccc8" stroke-width="56" stroke-linecap="round"/><path class="lp2" fill="none" stroke="#fffaf0" stroke-width="44" stroke-linecap="round"/></svg>', 1700, 520);
    const enh = L.sprite('<div class="enh">今日は大量に！</div>', 260, 80);
    const sil = L.sprite('<div class="enh red">作るな</div>', 200, 80);
    const st = L.sprite(stickySvg(), 200, 70);
    const med = new Chara(L, C.med, 160);
    const tfs = [C.tfD, C.tfB, C.tfH].map((o) => new Chara(L, o, 120));
    const rope = L.sprite('<div class="ropes"></div>', 420, 140);
    const unt = new Chara(L, C.untie, 150);
    const lab = L.sprite('<div class="lbl sm">縛られている → 開けない</div>', 360, 44);
    return (t) => {
      const bend = ramp(t, say('a45', 'ぐにゃ'), 1.6);
      const path = (k: number) => {
        // straight line -> loop that brings the far left end near the sticky at x=1250
        const sx = 100, ex = 1600, y = 400;
        const lx = mix(sx, 1050, k), ly = mix(y, 160, k);
        return `M${lx} ${ly} C ${mix(sx + 200, 700, k)} ${mix(y, -80, k)} ${mix(900, 300, k)} ${mix(y, 420, k)} ${mix(1100, 1000, k)} ${y} S ${ex - 100} ${y} ${ex} ${y}`;
      };
      const d = path(bend);
      (loop.q('.lp') as SVGPathElement).setAttribute('d', d);
      (loop.q('.lp2') as SVGPathElement).setAttribute('d', d);
      loop.set({ x: 960, y: 420 });
      enh.set({ x: mix(100, 1050, bend), y: mix(400, 160, bend) + 10, o: ramp(t, T('a45') + 0.4, 0.3), s: pop(t, T('a45') + 0.4) });
      st.set({ x: 1280, y: 370 });
      tfs.forEach((c, i) => c.act(t, { x: 1250 + i * 90, y: 520, s: 0.9 }, { blinkSeed: i }));
      const run = ramp(t, T('a46'), 1.6);
      med.act(t, { x: mix(1080, 1200, run), y: 240 + run * 120, s: 0.9 }, { walk: run > 0 && run < 1 ? 1 : 0, armR: 60, blinkSeed: 3 });
      med.set({ o: ramp(t, T('a46'), 0.3) });
      sil.set({ x: 1500, y: 300, o: ramp(t, say('a46', '作るな'), 0.3), s: pop(t, say('a46', '作るな')) });
      const ropeOn = say('a46', 'ひも');
      const untie = ramp(t, ropeOn + 1.4, 1.4);
      rope.set({ x: 480, y: 650, o: ramp(t, ropeOn, 0.3) * (1 - untie), sx: 1 - untie * 0.4 });
      lab.set({ x: 480, y: 760, o: ramp(t, ropeOn, 0.3) * (1 - untie) });
      unt.act(t, { x: 300, y: 690, s: 0.9 }, { armR: 60 + Math.sin(t * 10) * 30, armL: 60 + Math.cos(t * 10) * 30, blinkSeed: 6 });
      unt.set({ o: win(t, ropeOn + 0.6, T('a47'), 0.3) });
      textbook(t, T('a47'), E('a48') + 0.3, '教科書の言葉では', [['「大量に！」のメモ', 'エンハンサー'], ['「作るな」のメモ', 'サイレンサー'], ['伝令係', 'メディエーター'], ['縛るひも', 'クロマチン'], ['ほどけた／縛られた', 'ユー／ヘテロクロマチン']],
        [say('a47', '大量に'), say('a47', '作るな'), say('a47', '伝令'), say('a47', 'ひも'), say('a47', 'ほどけた')], { x: 1460, y: 560 });
      hito(t, T('a48'), E('a48') + 0.6, '遠くのメモも、本を曲げれば効く');
    };
  });

  // ===== s7: processing
  mk('s7', 'bg-kitchen', (L) => {
    const segs = ['ex', 'in', 'ex', 'in', 'ex'];
    const memo = L.sprite(`<div class="pre">${segs.map((s, i) => `<span class="${s}">${s === 'in' ? '<em>GU</em>広告<em>AG</em>' : '本文' + (i / 2 + 1)}</span>`).join('')}</div>`, 1300, 110);
    const cap = L.sprite('<div class="cap">表紙</div>', 120, 140);
    const tailA = L.sprite('<div class="polya">AAAAAAAA…</div>', 320, 60);
    const bug = L.sprite('<div class="bug">🐛</div>', 110, 110);
    const team = [C.u1, C.u2, C.u4, C.u5, C.u6].map((o) => new Chara(L, o, 120));
    const lariat = L.sprite('<svg viewBox="0 0 200 160" width="100%" height="100%"><path d="M20 140 Q60 60 100 40 a40 40 0 1 1 -10 70 Q60 120 20 140" fill="none" stroke="#ff4081" stroke-width="12" stroke-linecap="round"/></svg>', 200, 160);
    const door = L.sprite(doorSvg(0, '金庫室のドア（核膜）'), 220, 320);
    const alt = L.sprite('<div class="alt"><div><span class="ex">1</span><span class="ex">2</span><span class="ex">4</span></div><div><span class="ex">1</span><span class="ex b">3</span><span class="ex">4</span></div><small>同じ下書きから別レシピ（選択的スプライシング）</small></div>', 620, 220);
    return (t) => {
      const capOn = ramp(t, say('a50', '表紙'), 0.6), tailOn = ramp(t, say('a50', 'しおり'), 0.8);
      const cut = ramp(t, say('a55', '捨て'), 1.2);
      const join = ramp(t, say('a55', '貼り合わせ'), 0.8);
      memo.set({ x: 900, y: 360 });
      memo.el.classList.toggle('spliced', join > 0.5);
      memo.el.querySelectorAll<HTMLElement>('.in').forEach((e) => { e.style.opacity = String(1 - cut); e.style.maxWidth = `${(1 - join) * 260}px`; });
      cap.set({ x: mix(150, 245, capOn), y: 360, o: capOn, r: (1 - capOn) * -30 });
      tailA.set({ x: mix(1850, 1710, tailOn), y: 360, o: tailOn });
      // the bug tries both ends and bounces
      const bt = t - T('a51');
      const bx = bt < 0 ? -200 : bt < 3 ? mix(-100, 200, smooth(bt / 1.6)) - (bt > 1.6 ? (bt - 1.6) * 120 : 0) : mix(1950, 1880, smooth((bt - 3) / 1.6)) + (bt > 4.6 ? (bt - 4.6) * 120 : 0);
      bug.set({ x: bx, y: 300, o: win(t, T('a51'), E('a51') + 0.5, 0.3), flip: bt >= 3, r: Math.sin(t * 12) * 6 });
      const k = [say('a54', 'U1が'), say('a54', 'U2が'), say('a54', '合流'), say('a54', '合流') + 0.3, say('a54', '合流') + 0.6];
      const home = [520, 760, 640, 820, 1000];
      const leave = ramp(t, say('a54', '帰って'), 1.2);
      team.forEach((c, i) => {
        const a = ramp(t, k[i] - 0.3, 1.0);
        const gone = (i === 0 || i === 2) ? leave : 0;
        c.act(t, { x: mix(-80, home[i], a) - gone * 800, y: 560 + (i % 2) * 30, s: 0.9 }, { walk: (a > 0 && a < 1) || (gone > 0 && gone < 1) ? 1 : 0, armR: 40, blinkSeed: i, happy: true });
        c.set({ o: ramp(t, k[i] - 0.3, 0.3) * (1 - gone) * (1 - ramp(t, E('a55') + 0.5, 0.5)) });
      });
      lariat.set({ x: 780 + cut * 300, y: 230 - cut * 200, o: win(t, say('a55', '投げ縄'), E('a55') + 0.4, 0.3), r: cut * 120 });
      const exit = ramp(t, T('a56') + 0.2, 1.6);
      door.set({ x: 1700, y: 600, o: ramp(t, T('a49'), 0.4) * (1 - win(t, T('a52'), E('a53') + 0.3, 0.3)) });
      door.html(doorSvg(exit, '金庫室のドア（核膜）'));
      alt.set({ x: 760, y: 690, o: win(t, T('a56'), E('a56') + 0.4, 0.3) });
      textbook(t, T('a52'), E('a53') + 0.3, '教科書の言葉では', [['下書き', 'mRNA前駆体（hnRNA）'], ['表紙', '5′キャップ'], ['しおり', 'ポリA尾部（AAUAAA）'], ['かじる虫', 'エキソヌクレアーゼ'], ['広告／本文', 'イントロン／エクソン']],
        [say('a52', '下書き'), say('a52', '表紙'), say('a52', 'しおり'), say('a52', '虫'), say('a53', '広告')], { x: 1440, y: 650 });
      hito(t, say('a56', '一言で'), E('a56') + 0.6, '表紙としおりで守り、広告（イントロン）を切ってから、ドアを出る');
    };
  });

  // ===== s8: RNAs that work as they are
  mk('s8', 'bg-kitchen2', (L) => {
    const tools = [
      ['<div class="atool"><div class="sheet"><i>18S</i><i>5.8S</i><i>28S</i></div></div>', '厨房の部品', 'rRNA（45S から切り出す）'],
      ['<div class="atool"><div class="tray">🍽</div></div>', 'トレー', 'tRNA'],
      ['<div class="atool"><div class="sci">✂</div></div>', '切り貼り班', 'snRNA'],
      ['<div class="atool"><div class="sci">✨</div></div>', '部品を磨く職人', 'snoRNA'],
      ['<div class="atool"><div class="stop">STOP</div></div>', 'ストップ付箋', 'miRNA（約22塩基）'],
    ].map(([h, a, b]) => L.sprite(`<div class="tcard">${h}<b>${a}</b><span>${b}</span></div>`, 300, 300));
    const wall = L.sprite('<div class="wall"><span>本店（核）</span><span>厨房（細胞質）</span></div>', 1800, 560);
    const steps = [C.drosha, C.exp, C.dicer, C.risc].map((o) => new Chara(L, o, 140));
    const pri = L.sprite('<svg viewBox="0 0 220 90" width="100%" height="100%"><path class="hp" d="M10 70 H120 q40 0 40 -25 q0 -25 -40 -25 H10" fill="none" stroke="#e53935" stroke-width="10" stroke-linecap="round"/></svg>', 220, 90);
    const rec = L.sprite(memoSvg('同じ文のレシピ', 200, '#e3f2fd'), 200, 80);
    const xx = L.sprite('<div class="nope">✕</div>', 120, 120);
    const dis = L.sprite('<div class="dis"><div><b>Prader-Willi 症候群</b><span>15番染色体の sno 遺伝子群</span></div><div><b>Feingold 症候群</b><span>13番染色体の miRNA 遺伝子群</span></div></div>', 1300, 220);
    const memoTip = L.sprite('<div class="tipc">本店で<b>ド</b>ロシャ、厨房で<b>ダ</b>イサー</div>', 640, 80);
    return (t) => {
      const part1 = 1 - ramp(t, say('a59', '本店') - 0.3, 0.5);
      const at = [say('a58', '部品'), say('a58', 'トレー'), say('a58', '切り貼り'), say('a58', '職人'), say('a59', 'ストップ')];
      tools.forEach((s, i) => s.set({ x: 230 + i * 365, y: 420, o: ramp(t, at[i], 0.3) * part1, s: pop(t, at[i]) }));
      const p2 = ramp(t, say('a59', '本店') - 0.3, 0.5) * (1 - ramp(t, T('a61'), 0.4));
      wall.set({ x: 960, y: 470, o: p2 });
      const s = [say('a59', 'Drosha'), say('a59', 'Exportin'), say('a59', 'Dicer'), say('a60', 'RISC')];
      const pos = [[420, 560], [820, 560], [1200, 560], [1540, 560]];
      steps.forEach((c, i) => c.act(t, { x: pos[i][0], y: pos[i][1], s: 0.9 }, { armR: t > s[i] && t < s[i] + 1.2 ? 80 : 20, blinkSeed: i }).set({ o: p2 * ramp(t, s[i] - 0.3, 0.3) }));
      // the miRNA travels from the long paper to the patrol
      const k = (t - s[0]) / (s[3] - s[0]);
      const px = k < 0 ? 300 : mix(300, 1440, smooth(k));
      pri.set({ x: px, y: 360, o: p2 * ramp(t, say('a59', '長い紙'), 0.3), sx: k < 0.05 ? 1 : k < 0.6 ? 0.7 : 0.45 });
      rec.set({ x: 1620, y: 360, o: p2 * ramp(t, s[3], 0.3) });
      xx.set({ x: 1620, y: 360, o: p2 * ramp(t, s[3] + 1.2, 0.2), s: pop(t, s[3] + 1.2) });
      memoTip.set({ x: 960, y: 170, o: win(t, say('a60', '覚え方'), E('a60') + 0.3, 0.3) * p2 });
      dis.set({ x: 960, y: 450, o: ramp(t, T('a61') + 0.2, 0.4) });
    };
  });

  // ===== s9: clock genes
  mk('s9', 'bg-night2', (L) => {
    const bm = new Chara(L, C.bmal, 200), ck = new Chara(L, C.clk, 200);
    const tape = L.sprite('<div class="tape"></div>', 340, 50);
    const signs = Array.from({ length: 6 }, (_, i) => L.sprite(`<div class="closed">${i % 2 ? 'Cry' : 'Per'}<small>閉店</small></div>`, 130, 90));
    const dial = L.sprite('<div class="dial"><div class="hand"></div><span class="n0">0</span><span class="n6">6</span><span class="n12">12</span><span class="n18">18</span><b>24時間</b></div>', 300, 300);
    const graph = L.sprite('<svg viewBox="0 0 600 200" width="100%" height="100%"><path class="g" fill="none" stroke="#ffb74d" stroke-width="8"/><text x="10" y="24" fill="#fff" font-size="22">閉店の札の量</text></svg>', 600, 200);
    return (t) => {
      const t0 = T('a62');
      const ph = ((t - t0) / 12) % 1; // one cycle every 12 s of film
      const amount = Math.max(0, Math.sin(ph * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5);
      const silent = amount > 0.75;
      bm.act(t, { x: 380, y: 560 }, { talk: !silent && Math.sin(t * 3) > -0.3, armR: 50, blinkSeed: 1 });
      ck.act(t, { x: 600, y: 560, flip: true }, { talk: !silent && Math.sin(t * 3 + 1) > -0.3, armR: 50, blinkSeed: 2 });
      tape.set({ x: 490, y: 470, o: silent ? 1 : 0 });
      signs.forEach((s, i) => s.set({ x: 900 + (i % 3) * 150, y: 640 - Math.floor(i / 3) * 110, o: amount * 6 > i ? 1 : 0, s: 0.95 }));
      dial.set({ x: 1500, y: 330 });
      (dial.el.querySelector('.hand') as HTMLElement).style.transform = `rotate(${ph * 360}deg)`;
      let d = '';
      for (let x = 0; x <= 600; x += 10) { const p = ph * 600; const v = Math.sin(((x - p) / 600 + ph) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5; d += `${d ? 'L' : 'M'}${x} ${180 - v * 140}`; }
      (graph.q('.g') as SVGPathElement).setAttribute('d', d);
      graph.set({ x: 1500, y: 680, o: ramp(t, T('a63'), 0.4) });
      textbook(t, T('a64'), E('a64') + 0.3, '教科書の言葉では', [['店長コンビ', 'BMAL1 ＋ Clock（E-box で転写ON）'], ['閉店の札', 'Per ＋ Cry（たまると抑制）'], ['自分で自分を止める', 'ネガティブフィードバック']],
        [say('a64', '店長'), say('a64', '閉店'), say('a64', '自分で')], { x: 1440, y: 430 });
      hito(t, say('a64', '一言で'), E('a64') + 0.6, '作った札が自分を止めるので、くり返す');
    };
  });

  // ===== s10: mitochondria
  mk('s10', 'bg-warm', (L) => {
    const plant = L.sprite('<div class="mito"><div class="cristae"></div><div class="ringbook"></div><b>⚡ 発電所（別会社）</b></div>', 700, 420);
    const hon = L.sprite(honten(), 520, 300);
    const sc = new Chara(L, C.mito, 180);
    const facts = L.sprite('<div class="facts"><span>環状</span><span>約16.5 kb</span><span>遺伝子37個</span><span class="hk">RNAポリメラーゼは<b>核DNA</b>にコード</span></div>', 1300, 120);
    return (t) => {
      plant.set({ x: 1200, y: 400, s: pop(t, T('a65')) });
      hon.set({ x: 330, y: 330, o: ramp(t, T('a66'), 0.4), s: 0.9 });
      const go = ramp(t, T('a66') + 0.5, 2.6);
      sc.act(t, { x: mix(330, 1000, go), y: 640 }, { walk: go > 0 && go < 1 ? 1 : 0, armR: 40, blinkSeed: 4, happy: true });
      sc.set({ o: ramp(t, T('a66'), 0.4) });
      facts.set({ x: 1200, y: 110, o: ramp(t, say('a66', 'ミトコンドリア'), 0.4) });
      hito(t, E('a66') - 1.2, E('a66') + 0.8, '自前の本はあるが、書き写し係は本店から来る');
    };
  });

  // ===== summary
  mk('summary', 'bg-night', (L) => {
    const recap = [
      ['a67', '鏡文字（鋳型鎖）をなぞってメモ（RNA）・5′→3′'],
      ['a68', '屋台：σ が目印を見つける／文鎮がどいてベルが鳴ったら lac'],
      ['a69', '本店：D・B・F・E・H／キャップ・ポリA・スプライシング'],
      ['a70', 'メモのまま働くRNA（rRNA・tRNA・miRNA…）'],
    ].map(([id, s]) => ({ id, sp: L.sprite(`<div class="recap">${s}</div>`, 1400, 90) }));
    const cast = [C.scribe, C.sigma, C.rho, C.boss, C.crp, C.tfH, C.u5, C.risc].map((o) => new Chara(L, o, 150));
    return (t) => {
      recap.forEach(({ id, sp }, i) => sp.set({ x: 900, y: 200 + i * 120, o: ramp(t, T(id), 0.4), s: pop(t, T(id)) }));
      cast.forEach((c, i) => c.act(t, { x: 240 + i * 205, y: 760, s: 0.9 }, { armR: 60 + Math.sin(t * 5 + i) * 40, happy: true, blinkSeed: i }).set({ o: ramp(t, T('a70') + 0.5 + i * 0.12, 0.3) }));
    };
  });

  // scenes whose pictures step back while the textbook panel is shown
  const DIM = new Set(['s4', 's5a', 's5c', 's6c', 's9']);

  // ---------------------------------------------------------------- frame
  function update(t: number) {
    ov.beginFrame();
    banner.hide();
    tpanel.hide();
    const cur = clock.timing.scenes.find((s) => t >= s.start && t < s.end) ?? clock.timing.scenes[clock.timing.scenes.length - 1];
    for (const sc of scenes) {
      const s = scene(sc.id);
      const o = Math.min(ramp(t, s.start - 0.35, 0.35), 1 - ramp(t, s.end - 0.05, 0.35));
      dimNow = 0;
      if (o > 0) sc.update(t);
      sc.layer.show(o * (DIM.has(sc.id) ? 1 - 0.65 * dimNow : 1));
      if (sc.id === cur.id) bg.className = 'anime-bg ' + sc.bg;
    }
    // subtitles with the speaker's name; scene chip
    const cue = clock.cueAt(t);
    if (cue && cur.id !== 'title') {
      const who = (cue as { who?: string }).who;
      ov.set('sub', `<p>${who ? `<b class="who">${who}</b>` : ''}${cue.text}</p>`, 1, 'subtitle anime-sub');
    }
    if (cur.id !== 'title') ov.set('chip', cur.label, win(t, cur.start, cur.end, 0.4), 'chip anime-chip');
    ov.endFrame();
  }

  return { update };
}
