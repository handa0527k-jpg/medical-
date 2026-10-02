/** Story anime「設計図の図書館」: the genome as a night library of blueprints. */
import type { SceneDraw } from '../../../../engine/story/types';
import {
  CL, H, L, W, arrow, chibi, endCard, g, hand, label, motes, nameTag, rain, rr, seg, sky, sun, vignette,
} from '../../../../engine/story/kit';
import { opening } from './opening';

/* ---------- characters ---------- */
const jin = (x: number, y: number, s: number, t: number, run = false) => chibi(x, y, s, t, {
  hat: 'none', run,
  extra: (k) => { g.strokeStyle = '#2b2622'; g.lineWidth = 1.8; g.beginPath(); g.arc(-8 * k, -36 * k, 6 * k, 0, 7); g.arc(8 * k, -36 * k, 6 * k, 0, 7); g.stroke(); g.fillStyle = '#d57f45'; g.fillRect(-24 * k, -18 * k, 48 * k, 8 * k); },
});
const deo = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#eef3fb', line: '#2b4a7e', shape: 'tall', happy: false, bob: 0.8,
  extra: (k) => { for (let i = 0; i < 2; i++) { g.strokeStyle = i ? '#3f86d1' : '#d14d7c'; g.lineWidth = 4 * k; g.beginPath(); for (let y = -36; y <= 4; y += 2) g.lineTo(Math.sin((y + i * 10) / 5 + t) * 14 * k, y * k); g.stroke(); } },
});
const octa = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#f1eafb', line: '#5a3d8a', shape: 'round',
  extra: (k) => { for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283 + t * 0.5; g.fillStyle = ['#b48ad8', '#8a5cc2', '#d6c1ee', '#9b74c8'][i % 4]; g.beginPath(); g.arc(Math.cos(a) * 40 * k, -32 * k + Math.sin(a) * 40 * k, 6 * k, 0, 7); g.fill(); } },
});
const mei = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, { body: '#eef8f1', line: '#2f7e55', hat: 'beret', hatCol: '#3a9b69', bob: 3 });
const spra = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#fbf3dc', line: '#9a7420', hat: 'cap', hatCol: '#c99a2a',
  extra: (k) => { const o = Math.abs(Math.sin(t * 3)) * 0.4; g.strokeStyle = '#5d6168'; g.lineWidth = 3; g.beginPath(); g.moveTo(26 * k, -30 * k); g.lineTo(52 * k, -40 * k - o * 20 * k); g.moveTo(26 * k, -30 * k); g.lineTo(52 * k, -20 * k + o * 20 * k); g.stroke(); },
});
const taipo = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#fbe3e6', line: '#8c3a50', hat: 'band', hatCol: '#c0566f', happy: false,
  extra: (k) => { g.strokeStyle = '#c0304a'; g.lineWidth = 5 * k; g.beginPath(); g.moveTo(24 * k, -20 * k); g.lineTo(44 * k, -48 * k); g.stroke(); },
});
const line = (x: number, y: number, s: number, t: number) => chibi(x, y + Math.sin(t * 2) * 10, s, t, {
  body: '#fde9d8', line: '#a8501e', shape: 'drop', glow: 'rgba(255,170,110,.5)',
  extra: (k) => { const f = Math.sin(t * 8) * 0.5; g.fillStyle = '#e07b39'; [-1, 1].forEach((d) => { g.beginPath(); g.moveTo(d * 24 * k, -30 * k); g.quadraticCurveTo(d * 60 * k, (-60 + f * 30) * k, d * 70 * k, (-20 + f * 20) * k); g.closePath(); g.fill(); }); },
});
const mechi = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#f6efe2', line: '#7d6047', hat: 'brim', hatCol: '#7d6047', bob: 1.2,
  extra: (k) => { [['#ffd36b', -30], ['#8fd6ff', -16], ['#ff9ec0', -2]].forEach(([c, dy]) => { g.fillStyle = c as string; g.fillRect(22 * k, (dy as number) * k, 16 * k, 12 * k); }); },
});

/* ---------- props ---------- */
const BASE = { A: '#e2566f', T: '#3f86d1', G: '#3a9b69', C: '#e6b23a', U: '#8a5cc2' } as Record<string, string>;
function shelves(t: number, dark = 0.55) {
  g.fillStyle = '#2a2230'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 5; r++) { g.fillStyle = '#3a2e3e'; g.fillRect(0, 60 + r * 120, W, 12); for (let i = 0; i < 30; i++) { const h2 = 60 + ((i * 13 + r * 7) % 34); g.fillStyle = ['#6f4a5c', '#4f6a7c', '#7c6a4f', '#5c4f7c', '#4f7c62'][(i + r) % 5]; g.fillRect(14 + i * 43, 60 + r * 120 - h2, 32, h2); } }
  g.fillStyle = `rgba(20,14,24,${dark})`; g.fillRect(0, 0, W, H);
  // window with rain
  g.save(); g.beginPath(); rr(980, 70, 230, 300, 14); g.clip(); g.fillStyle = '#1f3048'; g.fillRect(980, 70, 230, 300); rain(t, 0.3); g.restore();
  g.strokeStyle = '#5a4a4e'; g.lineWidth = 8; rr(980, 70, 230, 300, 14); g.stroke(); g.beginPath(); g.moveTo(1095, 70); g.lineTo(1095, 370); g.moveTo(980, 220); g.lineTo(1210, 220); g.stroke();
}
function lamp(x: number, y: number) { const gr = g.createRadialGradient(x, y, 10, x, y, 360); gr.addColorStop(0, 'rgba(255,214,140,.5)'); gr.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 360, 0, 7); g.fill(); g.fillStyle = '#c99a2a'; g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x + 30, y); g.lineTo(x + 16, y - 30); g.lineTo(x - 16, y - 30); g.fill(); }
function card(x: number, y: number, w: number, h: number, a = 1) { if (a <= 0) return; g.globalAlpha = CL(a); g.fillStyle = 'rgba(255,250,236,.95)'; rr(x, y, w, h, 14); g.fill(); g.globalAlpha = 1; }
function codon(x: number, y: number, s: string, a = 1, hl = -1) {
  if (a <= 0) return; g.globalAlpha = CL(a);
  [...s].forEach((ch, i) => { g.fillStyle = i === hl ? '#ffe08a' : BASE[ch] || '#999'; rr(x + i * 40, y, 36, 44, 8); g.fill(); hand(ch, x + i * 40 + 18, y + 32, 26, i === hl ? '#3a2a1e' : '#fff', 1, 'center'); });
  g.globalAlpha = 1;
}

/* ---------- scenes ---------- */
export const DRAW: Record<string, SceneDraw> = {
  opening,
  library(t) {
    shelves(t);
    lamp(400, 470);
    g.fillStyle = '#4a3428'; g.fillRect(150, 470, 520, 22);
    // central dogma: original → copy → product
    const cd = seg(t, 13.6, 15.6);
    if (cd > 0) {
      card(250, 150, 760, 190, cd);
      g.globalAlpha = cd;
      g.fillStyle = '#3f86d1'; rr(300, 190, 120, 110, 10); g.fill(); hand('DNA', 360, 255, 30, '#fff', 1, 'center'); hand('原本', 360, 330, 20, '#3a2a1e', 1, 'center');
      arrow(440, 245, 540, 245, '#6b5a48');
      g.fillStyle = '#d14d7c'; rr(560, 205, 110, 80, 8); g.fill(); hand('RNA', 615, 255, 28, '#fff', 1, 'center'); hand('写し', 615, 330, 20, '#3a2a1e', seg(t, 18.6, 19.6), 'center');
      arrow(690, 245, 790, 245, '#6b5a48');
      g.fillStyle = '#3a9b69'; g.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; g.lineTo(880 + Math.cos(a) * (40 + (i % 2) * 14), 245 + Math.sin(a) * (40 + (i % 2) * 14)); } g.fill(); hand('蛋白質', 880, 330, 20, '#3a2a1e', seg(t, 23.6, 24.6), 'center');
      g.globalAlpha = 1;
    }
    // Avery's dish
    const av = seg(t, 39.8, 41.8) * (1 - seg(t, 56.8, 57.8));
    if (av > 0) { card(1000, 400, 240, 170, av); g.globalAlpha = av; g.fillStyle = '#e8eef0'; g.beginPath(); g.ellipse(1120, 470, 90, 40, 0, 0, 7); g.fill(); for (let i = 0; i < 9; i++) { g.fillStyle = i % 3 ? '#c9d6a8' : '#f2f2d8'; g.beginPath(); g.arc(1060 + (i % 5) * 28, 458 + Math.floor(i / 5) * 24, 9, 0, 7); g.fill(); } hand('1944 形質転換', 1120, 552, 20, '#3a2a1e', 1, 'center'); g.globalAlpha = 1; }
    // disease cascade
    const ds = seg(t, 57.6, 59.6);
    if (ds > 0) { const st = ['分子', '細胞', '組織', '個体', '疾患']; st.forEach((n, i) => nameTag(n, 300 + i * 150, 110, i === 4 ? '#c0566f' : '#3f86d1', seg(t, 57.6 + i * 1.2, 58.6 + i * 1.2))); }
    // the opening scene has already brought both of them to the desk
    jin(150, 640, 1.1, t); nameTag('ジン（僕）', 150, 520, '#d57f45', seg(t, 1, 2));
    deo(1150, 640, 1.2, t); nameTag('原本の番人デオ', 1150, 500, '#3f86d1', seg(t, 1.5, 2.5));
    motes(t, 12, '255,224,170'); vignette(0.4);
  },
  letters(t) {
    sky('#1f2433', '#272e42', '#2f3850');
    // the double helix as a twisting ladder
    const tw = t * 0.6;
    for (let i = 0; i < 22; i++) {
      const x = 120 + i * 48, ph = i * 0.62 + tw;
      const y1 = 300 + Math.sin(ph) * 110, y2 = 300 - Math.sin(ph) * 110;
      const pair = ['AT', 'GC', 'TA', 'CG'][i % 4];
      g.strokeStyle = BASE[pair[0]]; g.lineWidth = 7; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, (y1 + y2) / 2); g.stroke();
      g.strokeStyle = BASE[pair[1]]; g.beginPath(); g.moveTo(x, (y1 + y2) / 2); g.lineTo(x, y2); g.stroke();
      const hb = seg(t, 55, 57);
      if (hb > 0) { g.strokeStyle = `rgba(255,255,255,${hb})`; g.lineWidth = 1.5; const nb = pair.includes('G') ? 3 : 2; for (let k = 0; k < nb; k++) { g.beginPath(); g.moveTo(x - 6 + k * 6, (y1 + y2) / 2 - 4); g.lineTo(x - 6 + k * 6, (y1 + y2) / 2 + 4); g.stroke(); } }
    }
    for (let s2 = 0; s2 < 2; s2++) { g.strokeStyle = s2 ? '#d6c1ee' : '#f2c1d1'; g.lineWidth = 9; g.beginPath(); for (let x = 100; x <= 1180; x += 8) { const ph = ((x - 120) / 48) * 0.62 + tw; g.lineTo(x, 300 + (s2 ? -1 : 1) * Math.sin(ph) * 110); } g.stroke(); }
    // directions of the two strands
    const dir = seg(t, 49, 51);
    if (dir > 0) { g.globalAlpha = dir; arrow(140, 470, 520, 470, '#f2c1d1'); hand("5'→3'", 330, 506, 22, '#f2c1d1', 1, 'center'); arrow(1140, 130, 760, 130, '#d6c1ee'); hand("3'←5'（逆向き）", 950, 110, 22, '#d6c1ee', 1, 'center'); g.globalAlpha = 1; }
    // nucleotide card
    const nc = seg(t, 7, 9) * (1 - seg(t, 49, 50));
    if (nc > 0) {
      card(780, 400, 440, 200, nc); g.globalAlpha = nc;
      g.fillStyle = '#e6b23a'; g.beginPath(); g.arc(830, 500, 26, 0, 7); g.fill(); hand('P', 830, 510, 24, '#fff', 1, 'center');
      g.fillStyle = '#9fd0b0'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283 - 1.57; g.lineTo(930 + Math.cos(a) * 40, 500 + Math.sin(a) * 40); } g.fill(); hand('糖', 930, 510, 22, '#2b2622', 1, 'center');
      g.fillStyle = '#e2566f'; rr(1000, 470, 90, 60, 10); g.fill(); hand('塩基', 1045, 510, 22, '#fff', 1, 'center');
      hand('リン酸＋五炭糖＋塩基＝ヌクレオチド', 1000, 580, 20, '#3a2a1e', 1, 'center');
      g.globalAlpha = 1;
    }
    // purine / pyrimidine chips
    const pp = seg(t, 24, 26) * (1 - seg(t, 49, 50));
    if (pp > 0) { nameTag('プリン：A・G', 260, 470, '#e2566f', pp); nameTag('ピリミジン：C・T・U', 560, 470, '#3f86d1', pp); }
    const sz = seg(t, 80, 82);
    if (sz > 0) { nameTag('幅 2 nm', 140, 160, '#8fd6ff', sz); nameTag('1回転 3.4 nm', 600, 520, '#8fd6ff', sz); }
    deo(110, 660, 0.9, t); jin(1190, 660, 0.9, t);
    label('塩基 ＝ 文字、糖 ＝ 紙、リン酸 ＝ 綴じ糸', t, '#3f86d1'); vignette(0.35);
  },
  pack(t) {
    sky('#2a2038', '#33284a', '#3d3056');
    // DNA wrapping round octamer spools (nucleosomes) joined by linkers
    const n = Math.floor(L(0, 7, seg(t, 19, 30)));
    g.strokeStyle = '#8fd6ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(60, 230); for (let x = 60; x <= 1220; x += 6) g.lineTo(x, 230 + Math.sin(x / 9) * (x < 120 + n * 150 ? 22 : 3)); g.stroke();
    for (let i = 0; i < n; i++) { const x = 160 + i * 150; for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283; g.fillStyle = ['#b48ad8', '#8a5cc2', '#d6c1ee', '#9b74c8'][k % 4]; g.beginPath(); g.arc(x + Math.cos(a) * 18, 230 + Math.sin(a) * 18, 11, 0, 7); g.fill(); } }
    nameTag('ヒストン八量体＋約140塩基対 → ヌクレオソーム（11 nm）', 640, 140, '#8a5cc2', seg(t, 20, 21));
    const h1 = seg(t, 38, 40);
    if (h1 > 0) for (let i = 0; i < n - 1; i++) { g.globalAlpha = h1; g.fillStyle = '#ffd36b'; rr(222 + i * 150, 214, 26, 32, 6); g.fill(); g.globalAlpha = 1; }
    nameTag('スペーサー 20〜60 bp ＋ H1', 640, 300, '#c99a2a', h1);
    // chromosome
    const ch = seg(t, 51, 53);
    if (ch > 0) { g.globalAlpha = ch; g.strokeStyle = '#9b74c8'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(300, 340); g.lineTo(380, 540); g.moveTo(380, 340); g.lineTo(300, 540); g.stroke(); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(340, 440, 10, 0, 7); g.fill(); hand('染色体（約1400 nm）', 340, 590, 22, '#e9e2ff', 1, 'center'); g.globalAlpha = 1; }
    // karyotype: 22 pairs + XY
    const ky = seg(t, 59, 61);
    if (ky > 0) {
      card(520, 320, 700, 230, ky); g.globalAlpha = ky;
      for (let i = 0; i < 23; i++) { const len = i < 22 ? L(70, 18, i / 21) : 40; const x = 548 + (i % 12) * 56, y = 330 + Math.floor(i / 12) * 100; g.fillStyle = i === 22 ? '#d14d7c' : '#8a5cc2'; rr(x, y + 90 - len, 9, len, 4); g.fill(); rr(x + 14, y + 90 - (i === 22 ? 24 : len), 9, i === 22 ? 24 : len, 4); g.fill(); hand(i === 22 ? 'XY' : String(i + 1), x + 12, y + 108, 13, '#3a2a1e', 1, 'center'); }
      g.globalAlpha = 1;
    }
    const cen = seg(t, 73, 75);
    if (cen > 0) { nameTag('メタ', 360, 110, '#c99a2a', cen); nameTag('サブメタ', 560, 110, '#c99a2a', cen); nameTag('アクロ', 760, 110, '#c99a2a', cen); }
    octa(130, 640, 1.1, t); nameTag('糸巻きのオクタ', 130, 520, '#8a5cc2', seg(t, 9, 10));
    label('ヌクレオソーム ＝ 糸巻き', t, '#8a5cc2'); vignette(0.35);
  },
  meiosis(t) {
    sky('#1f3330', '#284038', '#2f4a40');
    const pair = (x: number, y: number, col: string, sis: boolean, a = 1) => { if (a <= 0) return; g.globalAlpha = CL(a); g.strokeStyle = col; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x, y + 40); if (sis) { g.moveTo(x + 16, y - 40); g.lineTo(x + 16, y + 40); } g.stroke(); if (sis) { g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(x + 8, y, 6, 0, 7); g.fill(); } g.globalAlpha = 1; };
    const dup = seg(t, 11, 15), m1 = seg(t, 22, 28), m2 = seg(t, 28, 34);
    const bad = seg(t, 45, 49);
    // normal division (left half)
    hand('正常', 320, 120, 26, '#bfe3c9', 1, 'center');
    const cx = 320;
    if (m1 < 0.01) { pair(cx - 30, 300, '#3f86d1', dup > 0.5); pair(cx + 20, 300, '#e2566f', dup > 0.5); }
    else if (m2 < 0.01) { pair(cx - L(30, 140, m1), 300, '#3f86d1', true); pair(cx + L(20, 120, m1), 300, '#e2566f', true); }
    else { [[-200, '#3f86d1'], [-90, '#3f86d1'], [90, '#e2566f'], [200, '#e2566f']].forEach(([dx, c]) => pair(cx + (dx as number) * L(0.75, 1, m2), 300 + L(0, 120, m2) * ((dx as number) > 0 ? 1 : 1), c as string, false)); }
    nameTag('第1分裂：相同染色体', 320, 520, '#3a9b69', seg(t, 22, 23) * (1 - seg(t, 44, 45)));
    nameTag('第2分裂：姉妹染色分体', 320, 470, '#3a9b69', seg(t, 28, 29) * (1 - seg(t, 44, 45)));
    // nondisjunction (right half)
    if (bad > 0) {
      g.globalAlpha = bad; hand('不分離', 960, 120, 26, '#ffc0c8', 1, 'center');
      pair(900, 300, '#3f86d1', false); pair(930, 300, '#e2566f', false);
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3; g.beginPath(); g.arc(915, 300, 80, 0, 7); g.stroke(); g.beginPath(); g.arc(1110, 300, 80, 0, 7); g.stroke();
      hand('2本', 915, 420, 24, '#fff', 1, 'center'); hand('0本', 1110, 420, 24, '#fff', 1, 'center');
      g.globalAlpha = 1;
      nameTag('受精 → トリソミー／モノソミー', 1010, 480, '#c0566f', seg(t, 50, 51));
    }
    const tri = seg(t, 60, 62);
    if (tri > 0) ['13', '18', '21'].forEach((n, i) => nameTag(`${n}番トリソミー`, 860 + i * 150, 560, '#c0566f', tri));
    mei(110, 650, 1.1, t); nameTag('配り係メイ', 110, 530, '#3a9b69', seg(t, 2, 3));
    jin(1190, 650, 0.9, t);
    label('減数分裂 ＝ 写しの配分', t, '#3a9b69'); vignette(0.3);
  },
  read(t) {
    sky('#2b2a1f', '#3a3626', '#46402c');
    // the gene strip
    const parts: [string, number, string][] = [['プロモーター', 120, '#6b5a48'], ["5'UTR", 60, '#c9b48a'], ['エクソン1', 110, '#e6b23a'], ['イントロン', 120, '#5b5b5b'], ['エクソン2', 110, '#e6b23a'], ['イントロン', 100, '#5b5b5b'], ['エクソン3', 110, '#e6b23a'], ["3'UTR", 70, '#c9b48a'], ['ポリA', 70, '#a3365f']];
    let x = 80;
    parts.forEach(([n, w, c], i) => { const a = seg(t, 15 + i * 0.4, 16 + i * 0.4); g.globalAlpha = a; g.fillStyle = c; rr(x, 140, w - 6, 50, 8); g.fill(); hand(n, x + w / 2 - 3, 128, 15, '#f2e6c8', 1, 'center'); g.globalAlpha = 1; x += w; });
    // splicing: introns fall out, exons join
    const sp = seg(t, 27, 35);
    if (sp > 0) {
      const ex = [0, 1, 2]; ex.forEach((i) => { const x0 = 80 + 120 + 60 + i * 230, x1 = 380 + i * 104; g.fillStyle = '#e6b23a'; rr(L(x0, x1, sp), 270, 104, 44, 8); g.fill(); hand(`エクソン${i + 1}`, L(x0, x1, sp) + 52, 300, 16, '#3a2a1e', 1, 'center'); });
      [0, 1].forEach((i) => { g.globalAlpha = 1 - sp; g.fillStyle = '#5b5b5b'; rr(80 + 120 + 60 + 110 + i * 230, 270 + sp * 140, 110, 44, 8); g.fill(); g.globalAlpha = 1; });
      nameTag('スプライシング → 成熟mRNA', 540, 360, '#c99a2a', seg(t, 32, 33));
    }
    // reading frame, 3 letters at a time
    const rd = seg(t, 41, 43);
    if (rd > 0) {
      const seq = 'AUGGCUCGAUAG';
      const k = Math.min(3, Math.floor(seg(t, 43, 51) * 4));
      card(300, 420, 680, 140, rd);
      for (let i = 0; i < 4; i++) codon(330 + i * 160, 450, seq.slice(i * 3, i * 3 + 3), rd, -1);
      g.strokeStyle = '#d14d7c'; g.lineWidth = 4; rr(324 + k * 160, 444, 132, 56, 10); g.stroke();
      hand(['Met（開始）', 'Ala', 'Arg', '終止'][k], 390 + k * 160, 534, 20, '#3a2a1e', rd, 'center');
    }
    const pie = seg(t, 53, 55) * (1 - seg(t, 73, 75));
    if (pie > 0) { g.globalAlpha = pie; g.fillStyle = 'rgba(255,250,236,.95)'; g.beginPath(); g.arc(1120, 300, 80, 0, 7); g.fill(); g.fillStyle = '#e6b23a'; g.beginPath(); g.moveTo(1120, 300); g.arc(1120, 300, 80, -1.57, -1.57 + 6.283 * 0.013 * 4); g.fill(); hand('約1.3%', 1120, 410, 22, '#f2e6c8', 1, 'center'); g.globalAlpha = 1; }
    spra(110, 650, 1.1, t); nameTag('編集者スプラ', 110, 530, '#c99a2a', seg(t, 2, 3));
    jin(1190, 650, 0.9, t);
    label('スプライシング ＝ 読み飛ばすページを切り取る', t, '#c99a2a'); vignette(0.3);
  },
  typo(t) {
    shelves(t, 0.7); lamp(640, 640);
    const rows: [string, string, string, string, number][] = [['CGA', 'AGA', 'Arg → Arg', 'サイレント', 8], ['GAC', 'GAA', 'Asp → Glu', 'ミスセンス（保存的）', 22], ['CGA', 'GGA', 'Arg → Gly', 'ミスセンス（非保存的）', 31], ['CGA', 'UGA', 'Arg → 終止', 'ナンセンス', 42]];
    const ald = seg(t, 63, 65);
    rows.forEach(([a, b, aa, n, at], i) => {
      const al = seg(t, at, at + 1.5) * (1 - 0.8 * ald); if (al <= 0) return; const y = 90 + i * 100;
      card(200, y - 10, 880, 86, al);
      const diff = [...a].findIndex((ch, k) => b[k] !== ch);
      codon(230, y, a, al); arrow(370, y + 22, 420, y + 22, '#6b5a48', 3); codon(440, y, b, al, diff);
      hand(aa, 680, y + 34, 24, '#3a2a1e', al); hand(n, 860, y + 34, 22, i === 3 ? '#c0304a' : '#3a9b69', al);
    });
    if (ald > 0) { card(420, 190, 440, 170, ald); g.globalAlpha = ald; g.fillStyle = '#e8b44a'; rr(460, 230, 50, 90, 8); g.fill(); g.fillStyle = '#fffaf0'; rr(460, 222, 50, 18, 6); g.fill(); hand('ALDH2', 680, 250, 32, '#3a2a1e', 1, 'center'); hand('487番 Glu→Lys', 680, 296, 24, '#c0304a', 1, 'center'); hand('アセトアルデヒド → 酢酸', 680, 334, 18, '#6b5a48', 1, 'center'); g.globalAlpha = 1; }
    nameTag('SNP（書き方のクセ）', 640, 40, '#c0566f', seg(t, 51, 52));
    taipo(110, 650, 1.1, t); nameTag('校正係タイポ', 110, 530, '#c0566f', seg(t, 2, 3));
    label('変異 ＝ 誤植、多型 ＝ 書き方のクセ', t - 4, '#c0566f'); vignette(0.35);
  },
  jump(t) {
    shelves(t, 0.6);
    // the same orange page pasted all over the shelves
    const rep = seg(t, 2, 12);
    for (let i = 0; i < 26; i++) { const a = seg(t, 2 + i * 0.35, 3 + i * 0.35); if (a <= 0) continue; g.globalAlpha = a * 0.9; g.fillStyle = '#e07b39'; g.fillRect(40 + ((i * 197) % 1180), 30 + ((i * 89) % 520), 20, 30); } g.globalAlpha = 1;
    // retrotransposition: mRNA → reverse transcriptase → DNA copy → elsewhere
    const rt = seg(t, 29, 33);
    if (rt > 0) {
      card(200, 160, 880, 300, rt); g.globalAlpha = rt;
      g.fillStyle = '#d14d7c'; rr(240, 220, 200, 30, 8); g.fill(); hand('mRNA（イントロンなし）', 340, 206, 18, '#3a2a1e', 1, 'center');
      arrow(460, 235, 560, 235, '#6b5a48'); hand('逆転写酵素', 510, 280, 18, '#6b5a48', 1, 'center');
      g.fillStyle = '#3f86d1'; rr(580, 220, 200, 30, 8); g.fill(); hand('DNAコピー', 680, 206, 18, '#3a2a1e', 1, 'center');
      arrow(800, 235, 900, 330, '#6b5a48');
      g.fillStyle = '#6b6b6b'; rr(700, 340, 360, 30, 8); g.fill(); g.fillStyle = '#3f86d1'; rr(820, 340, 120, 30, 6); g.fill(); hand('別の場所へ挿入（偽遺伝子）', 880, 410, 20, '#3a2a1e', seg(t, 43, 45), 'center');
      g.globalAlpha = 1;
    }
    nameTag('ゲノムの約45%', 640, 520, '#e07b39', seg(t, 17, 18) * (1 - seg(t, 29, 30)));
    nameTag('LINE-1・Alu・SVA（いまも動く）', 640, 570, '#e07b39', seg(t, 23, 24) * (1 - seg(t, 29, 30)));
    line(L(1300, 1000, seg(t, 6, 10)) + Math.sin(t) * 60, 520, 1, t); nameTag('渡り鳥のライン', 1000 + Math.sin(t) * 60, 380, '#e07b39', seg(t, 9, 10) * rep);
    jin(110, 650, 0.9, t);
    label('トランスポゾン ＝ 動くページ', t, '#e07b39'); vignette(0.35);
  },
  notes(t) {
    sky('#2a2420', '#352d26', '#40362c');
    // closed (methylated) vs open (acetylated) chromatin
    const cl = seg(t, 16, 18);
    if (cl > 0) {
      g.globalAlpha = cl; card(80, 110, 520, 330, 1);
      for (let i = 0; i < 9; i++) { g.fillStyle = '#7d5aa8'; g.beginPath(); g.arc(200 + (i % 3) * 56, 220 + Math.floor(i / 3) * 56, 26, 0, 7); g.fill(); hand('Me', 200 + (i % 3) * 56, 228 + Math.floor(i / 3) * 56, 16, '#fff', 1, 'center'); }
      hand('ヘテロクロマチン：転写OFF', 340, 420, 22, '#3a2a1e', 1, 'center'); g.fillStyle = '#ffd36b'; g.fillRect(450, 180, 90, 60); hand('読まない', 495, 216, 18, '#3a2a1e', 1, 'center');
      g.globalAlpha = 1;
    }
    const op = seg(t, 29, 31);
    if (op > 0) {
      g.globalAlpha = op; card(680, 110, 520, 330, 1);
      g.strokeStyle = '#8fd6ff'; g.lineWidth = 3; g.beginPath(); for (let x = 720; x <= 1160; x += 6) g.lineTo(x, 260 + Math.sin(x / 14) * 10); g.stroke();
      for (let i = 0; i < 5; i++) { g.fillStyle = '#b48ad8'; g.beginPath(); g.arc(750 + i * 95, 260, 22, 0, 7); g.fill(); hand('Ac', 750 + i * 95, 268, 15, '#fff', 1, 'center'); }
      g.fillStyle = '#3a9b69'; g.beginPath(); g.ellipse(L(700, 1060, seg(t, 38, 48)), 320, 40, 26, 0, 0, 7); g.fill(); hand('RNAポリメラーゼ', 940, 380, 18, '#3a2a1e', 1, 'center');
      hand('ユークロマチン：転写ON', 940, 420, 22, '#3a2a1e', 1, 'center'); g.fillStyle = '#8fd6ff'; g.fillRect(1050, 150, 110, 60); hand('開いて読む', 1105, 186, 18, '#3a2a1e', 1, 'center');
      g.globalAlpha = 1;
    }
    // mitochondrial booklet from mother to child
    const mt = seg(t, 50, 52);
    if (mt > 0) { card(400, 460, 480, 130, mt); g.globalAlpha = mt; g.strokeStyle = '#d6a224'; g.lineWidth = 6; g.beginPath(); g.arc(470, 525, 36, 0, 7); g.stroke(); hand('37遺伝子・10³〜10⁴コピー', 690, 515, 22, '#3a2a1e', 1, 'center'); hand('母 → 子（母系遺伝）', 690, 556, 22, '#c0566f', seg(t, 58, 59), 'center'); g.globalAlpha = 1; }
    mechi(110, 650, 1.1, t); nameTag('付箋屋のメチ', 110, 530, '#7d6047', seg(t, 2, 3));
    jin(1190, 650, 0.9, t);
    label('エピゲノム ＝ 設計図の付箋', t, '#7d6047'); vignette(0.35);
  },
  close(t, d) {
    const k = seg(t, 0, d * 0.8);
    shelves(t, L(0.6, 0.25, k));
    g.fillStyle = `rgba(255,226,180,${0.25 * k})`; g.fillRect(0, 0, W, H);
    sun(1095, L(380, 200, k), 40, '#ffe6b0', k);
    const items = ['文字', '二本の鎖', '糸巻き', '配分', '読み方', '誤植', '動くページ', '付箋'];
    items.forEach((n, i) => nameTag(n, 160 + (i % 4) * 230, 180 + Math.floor(i / 4) * 70, ['#3f86d1', '#3f86d1', '#8a5cc2', '#3a9b69', '#c99a2a', '#c0566f', '#e07b39', '#7d6047'][i], seg(t, 6 + i * 1.2, 7 + i * 1.2) * (1 - seg(t, d - 10, d - 8))));
    deo(820, 650, 1.1, t); jin(L(400, 1300, seg(t, d - 10, d)), 650, 1, t, t > d - 10);
    endCard('設計図の図書館', t, d - 7);
    g.fillStyle = `rgba(20,10,0,${CL(seg(t, d - 3, d)) * 0.4})`; g.fillRect(0, 0, W, H);
    vignette(0.3, true);
  },
};
