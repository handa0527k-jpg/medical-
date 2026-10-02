/** Story anime「十二分間の旅」: the cell as a factory, told by a newly made secretory protein. */
import type { SceneDraw } from '../../../../engine/story/types';
import {
  CL, H, L, W, bead, chibi, endCard, g, hand, label, motes, nameTag, rr, room, seg, sky, sun, titleCard, vignette,
} from '../../../../engine/story/kit';

/* ---------- characters ---------- */
function pep(x: number, y: number, s: number, t: number, o: { run?: boolean; sugar?: boolean; tag?: boolean } = {}) {
  chibi(x, y, s, t, {
    body: '#fde6ee', line: '#a3365f', shape: 'drop', run: o.run,
    extra: (k) => {
      if (o.tag !== false) { g.fillStyle = '#ffd36b'; g.strokeStyle = '#a3365f'; g.lineWidth = 1.5; rr(-30 * k, -66 * k, 22 * k, 14 * k, 3 * k); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-8 * k, -60 * k); g.lineTo(0, -66 * k); g.stroke(); }
      if (o.sugar) { g.fillStyle = '#7fc8a0'; [[14, -48], [22, -36], [16, -24]].forEach(([dx, dy]) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; g.lineTo(dx * k + Math.cos(a) * 5 * k, dy * k + Math.sin(a) * 5 * k); } g.fill(); }); }
    },
  });
}
const ribo = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#eadff7', line: '#5a3d8a', shape: 'round', hat: 'band', hatCol: '#8a5cc2', bob: 1.4,
  extra: (k) => { g.strokeStyle = '#5a3d8a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-30 * k, -30 * k); g.lineTo(30 * k, -30 * k); g.stroke(); },
});
const gol = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#eef8f1', line: '#2f7e55', hat: 'beret', hatCol: '#3a9b69',
  extra: (k) => { g.strokeStyle = '#3a9b69'; g.lineWidth = 3 * k; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(34 * k, -30 * k + i * 8 * k, 12 * k, 3.6, 5.8); g.stroke(); } },
});
const kine = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, { body: '#e8f2fb', line: '#3f6f9e', hat: 'cap', hatCol: '#3f86d1', bob: 4 });
const dai = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, { body: '#dfe5f2', line: '#2b3f6e', hat: 'helmet', hatCol: '#2b3f6e', happy: false, shape: 'tall', bob: 1.2 });
const clas = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#fbf3dc', line: '#9a7420', hat: 'brim', hatCol: '#c99a2a',
  extra: (k) => { g.strokeStyle = '#c99a2a'; g.lineWidth = 1.5; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const cx = -12 * k + i * 12 * k, cy = -20 * k + j * 10 * k; g.beginPath(); for (let m = 0; m < 6; m++) { const a = (m / 6) * 6.283; g.lineTo(cx + Math.cos(a) * 6 * k, cy + Math.sin(a) * 6 * k); } g.closePath(); g.stroke(); } },
});
const riso = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, { body: '#fbe3e6', line: '#8c3a50', hat: 'brim', hatCol: '#c0566f', shape: 'round', bob: 1 });
const mito = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#fdf1d0', line: '#8a6a1a', hat: 'band', hatCol: '#d6a224', shape: 'tall', bob: 1,
  extra: (k) => { g.strokeStyle = '#8a6a1a'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -14 * k, 10 * k, 6 * k, 0, 0, 7); g.stroke(); },
});

/** a membrane ribbon (lipid bilayer), horizontal */
function bilayer(x0: number, x1: number, y: number, col = '#c99a6a') {
  g.fillStyle = col; g.fillRect(x0, y, x1 - x0, 6); g.fillRect(x0, y + 14, x1 - x0, 6);
  g.fillStyle = 'rgba(255,255,255,.35)'; for (let x = x0; x < x1; x += 10) { g.beginPath(); g.arc(x + 5, y + 3, 3, 0, 7); g.arc(x + 5, y + 17, 3, 0, 7); g.fill(); }
}
function clock(x: number, y: number, r: number, minutes: number) {
  g.fillStyle = 'rgba(255,252,242,.95)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#3a2a1e'; g.lineWidth = 3; g.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82); g.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); g.stroke(); }
  const a = (minutes / 60) * 6.283 - Math.PI / 2; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); g.stroke();
  hand(`${Math.round(minutes)}分`, x, y + r + 30, 24, '#fff8e8', 1, 'center');
}

/* ---------- scenes ---------- */
export const DRAW: Record<string, SceneDraw> = {
  map(t) {
    room('#3b3546', '#2d2836', t, 0.15);
    // the guide board
    g.fillStyle = '#f3ead8'; rr(120, 70, 700, 430, 16); g.fill(); g.strokeStyle = '#6b5a48'; g.lineWidth = 4; g.stroke();
    hand('細胞工場 案内図', 470, 116, 30, '#3a2a1e', 1, 'center');
    const rooms: [number, number, number, number, string, string][] = [[180, 150, 170, 120, '#c9b3e6', '本社（核）'], [380, 150, 180, 70, '#f2c1d1', '製造ライン（rER）'], [590, 150, 180, 80, '#bfe3c9', '出荷センター（ゴルジ）'], [180, 320, 150, 80, '#f7d98d', '発電所（ミト）'], [360, 320, 130, 80, '#f3b1b9', '処理場（リソ）'], [520, 300, 250, 120, '#d9eef7', '床（サイトゾル）']];
    rooms.forEach(([x, y, w, h, c, n], i) => { const a = seg(t, 11 + i * 0.8, 12 + i * 0.8); if (a <= 0) return; g.globalAlpha = a; g.fillStyle = c; rr(x, y, w, h, 14); g.fill(); hand(n, x + w / 2, y + h / 2 + 8, 18, '#3a2a1e', 1, 'center'); g.globalAlpha = 1; });
    // inclusions on the floor
    const inc = seg(t, 30, 32);
    if (inc > 0) { g.globalAlpha = inc; [['#f6e08a', 560, 400], ['#9fb7d6', 640, 404], ['#5a4030', 720, 400]].forEach(([c, x, y]) => { g.fillStyle = c as string; g.beginPath(); g.arc(x as number, y as number, 10, 0, 7); g.fill(); }); hand('封入体：脂肪滴・グリコーゲン・メラニン', 645, 460, 16, '#3a2a1e', 1, 'center'); g.globalAlpha = 1; }
    // the centrifuge tube
    const cf = seg(t, 45, 47);
    if (cf > 0) {
      g.globalAlpha = cf; const tx = 1110, ty = 90;
      g.fillStyle = 'rgba(230,240,250,.35)'; g.strokeStyle = '#e8eef6'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx, ty + 360); g.quadraticCurveTo(tx + 60, ty + 420, tx + 120, ty + 360); g.lineTo(tx + 120, ty); g.fill(); g.stroke();
      const lay: [number, string, string][] = [[59, '#c9b3e6', '1,000×g：核'], [62, '#f7d98d', '1万×g：ミト・リソソーム'], [65, '#f2c1d1', '10万×g：ミクロゾーム']];
      lay.forEach(([at, c, n], i) => { const a = seg(t, at, at + 1.5); if (a <= 0) return; g.globalAlpha = cf * a; g.fillStyle = c; const y = ty + 330 - i * 60; rr(tx + 8, y, 104, 50, 10); g.fill(); hand(n, tx - 16, y + 32, 18, '#fff8e8', 1, 'right'); });
      g.globalAlpha = cf * seg(t, 67, 69); g.fillStyle = 'rgba(217,238,247,.6)'; rr(tx + 8, ty + 20, 104, 130, 10); g.fill(); hand('上清＝サイトゾル', tx + 60, ty - 16, 20, '#d9eef7', 1, 'center');
      g.globalAlpha = 1;
    }
    pep(L(1300, 960, seg(t, 36, 40)), 620, 1.1, t, { run: t > 36 && t < 40 });
    if (t > 38) nameTag('ペプ（僕）', L(1300, 960, seg(t, 36, 40)), 500, '#d14d7c', seg(t, 39, 40));
    titleCard('十二分間の旅', '組織学「細胞質」より', t);
    motes(t, 14, '255,236,200'); vignette(0.35);
  },
  birth(t) {
    sky('#2e2a3e', '#3b3450', '#46405c');
    // rER membrane wall along the top, the lumen above it
    g.fillStyle = 'rgba(242,193,209,.25)'; g.fillRect(0, 0, W, 170);
    bilayer(0, W, 170, '#d78aa4');
    for (let x = 30; x < W; x += 70) { g.fillStyle = '#8a5cc2'; g.beginPath(); g.arc(x, 204, 9, 0, 7); g.fill(); }
    hand('粗面小胞体（rER）の内腔', 40, 80, 24, '#ffd9e6', 1);
    // the mRNA (order sheet)
    // the ribosome moves up to the wall once the signal is read
    const up = seg(t, 33, 39);
    const my = L(470, 270, up);
    g.strokeStyle = '#d14d7c'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= W; x += 12) g.lineTo(x, my + Math.sin(x / 40 + t) * 6); g.stroke();
    hand('mRNA（注文書）', 1060, my + 36, 20, '#ffd9e6', 1);
    const rx = 560, ry = L(440, 236, up);
    g.fillStyle = '#b48ad8'; g.beginPath(); g.ellipse(rx, ry, 56, 34, 0, 0, 7); g.fill(); g.fillStyle = '#d6c1ee'; g.beginPath(); g.ellipse(rx, ry + 34, 40, 22, 0, 0, 7); g.fill();
    // the growing chain; once attached it threads into the lumen
    const n = Math.floor(L(0, 10, seg(t, 6, 30)));
    for (let i = 0; i < n; i++) { const x = up > 0.9 ? rx : rx - 60 - i * 22, y = up > 0.9 ? ry - 40 - i * 18 : ry - 8 + Math.sin(i) * 6; bead(x, y, 8, i < 2 ? '#ffd36b' : '#ff9ec0', i < 2 ? '#ffd36b' : '#ff9ec0'); }
    nameTag('シグナル配列（出荷札）', 380, 360, '#c99a2a', seg(t, 27, 28) * (1 - seg(t, 33, 34)));
    // free ribosome for comparison
    const free = seg(t, 49, 51);
    if (free > 0) { g.globalAlpha = free; g.fillStyle = '#b48ad8'; g.beginPath(); g.ellipse(1020, 560, 40, 24, 0, 0, 7); g.fill(); for (let i = 0; i < 5; i++) bead(1070 + i * 20, 548 + Math.sin(i) * 5, 6, '#8fd6ff', '#8fd6ff'); nameTag('札なし → 遊離リボソーム（サイトゾル蛋白）', 980, 620, '#3f86d1', 1); g.globalAlpha = 1; }
    // smooth ER tube
    const ser = seg(t, 76, 78);
    if (ser > 0) { g.globalAlpha = ser; g.strokeStyle = '#e6b7c6'; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(900, 280); g.bezierCurveTo(1000, 240, 1100, 340, 1240, 300); g.stroke(); nameTag('滑面小胞体：脂質の合成・解毒', 1060, 380, '#a3365f', 1); g.globalAlpha = 1; }
    ribo(120, 610, 1.1, t); nameTag('職人リボ', 120, 490, '#8a5cc2', seg(t, 6, 7));
    label('シグナル配列 ＝ 出荷札', t - 27, '#8a5cc2'); vignette(0.3);
  },
  golgi(t) {
    sky('#203a33', '#2c4a40', '#355648');
    // cisternae from cis (left) to trans (right)
    for (let i = 0; i < 6; i++) { const x = 330 + i * 80; g.strokeStyle = ['#7fc8a0', '#72bd94', '#64b288', '#57a67c', '#4a9b70', '#3e8f64'][i]; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.arc(x - 200, 330, 230, -0.7, 0.7); g.stroke(); }
    hand('シス（入口）', 300, 120, 24, '#cfeedd', 1, 'center'); hand('トランス（出口）', 760, 120, 24, '#cfeedd', 1, 'center');
    // TGN budding
    g.fillStyle = '#3e8f64'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(880 + (i % 2) * 30, 200 + i * 60, 16, 0, 7); g.fill(); }
    hand('TGN（仕分け場）', 930, 540, 24, '#cfeedd', 1, 'center');
    // pep moving through the stack
    const p = seg(t, 10, 60);
    pep(L(200, 900, p), 380, 0.9, t, { sugar: t > 26 });
    nameTag('修飾：切断・糖付加', 520, 560, '#3a9b69', seg(t, 22, 23) * (1 - seg(t, 43, 44)));
    nameTag('選別', 880, 120, '#3a9b69', seg(t, 30, 31) * (1 - seg(t, 43, 44)));
    // Palade's clock
    const ck = seg(t, 52, 54);
    if (ck > 0) {
      g.globalAlpha = ck;
      const m = t < 57 ? 5 : t < 60.5 ? 8 : 12;
      clock(1120, 170, 74, m);
      const st = [['rER', 5], ['ゴルジ', 8], ['分泌顆粒', 12]] as const;
      st.forEach(([n, mm], i) => nameTag(`${n}：${mm === 8 ? '7〜8' : mm}分`, 1120, 330 + i * 46, '#3a9b69', seg(t, 54 + i * 3.3, 55 + i * 3.3)));
      g.globalAlpha = 1;
    }
    // clathrin-coated granule vs uncoated (constitutive) vesicle
    const gr = seg(t, 65, 67);
    if (gr > 0) { g.globalAlpha = gr; g.fillStyle = '#fbe6ee'; g.beginPath(); g.arc(1000, 520, 34, 0, 7); g.fill(); g.strokeStyle = '#c99a2a'; g.lineWidth = 2; for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; g.beginPath(); g.arc(1000 + Math.cos(a) * 34, 520 + Math.sin(a) * 34, 8, 0, 7); g.stroke(); } nameTag('調節性：顆粒にためる', 1000, 600, '#c99a2a', 1); g.globalAlpha = 1; }
    const cs = seg(t, 78, 80);
    if (cs > 0) { g.globalAlpha = cs; bead(L(760, 1240, seg(t, 78, 88)), 620, 14, '#fbe6ee', '#ffffff'); nameTag('構成性：すぐに出る', 760, 660, '#3a9b69', 1); g.globalAlpha = 1; }
    gol(140, 620, 1.2, t); nameTag('出荷係ゴル', 140, 500, '#3a9b69', seg(t, 9, 10));
    label('ゴルジ装置 ＝ 出荷センター', t, '#3a9b69'); vignette(0.3);
  },
  road(t) {
    sky('#1f2c3e', '#283a52', '#304664');
    // centrosome (MTOC) with two orthogonal centrioles, microtubules radiating
    const cx = 240, cy = 360;
    for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; const len = 980 + Math.sin(t * 0.8 + i) * 30; g.strokeStyle = 'rgba(143,214,255,.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.55); g.stroke(); }
    g.fillStyle = '#8fd6ff'; rr(cx - 30, cy - 10, 60, 20, 8); g.fill(); rr(cx - 10, cy - 30, 20, 60, 8); g.fill();
    nameTag('中心体（MTOC）：−端', cx, cy - 70, '#3f86d1', seg(t, 18, 19));
    nameTag('＋端（細胞膜側）', 1120, 120, '#3f86d1', seg(t, 30, 31));
    nameTag('微小管：25 nm・13本', 700, 120, '#3f86d1', seg(t, 3, 4));
    // kinesin carries the granule outward, dynein brings a mitochondrion inward
    const a = 0.0; const pK = (t * 0.04) % 1, pD = 1 - ((t * 0.035) % 1);
    const kx = cx + Math.cos(a) * L(60, 960, pK), ky = cy + Math.sin(a) * L(60, 960, pK) * 0.55;
    kine(kx, ky + 6, 0.7, t); g.fillStyle = '#fbe6ee'; g.beginPath(); g.arc(kx, ky - 60, 22, 0, 7); g.fill();
    if (t > 40) { const b = 0.22; const dx = cx + Math.cos(b) * L(60, 960, pD), dy = cy + Math.sin(b) * L(60, 960, pD) * 0.55; dai(dx, dy + 6, 0.7, t); g.fillStyle = '#f7d98d'; g.beginPath(); g.ellipse(dx, dy - 72, 34, 16, 0, 0, 7); g.fill(); }
    nameTag('キネシン：＋端へ（外回り）', 640, 450, '#3f86d1', seg(t, 37, 38) * (1 - seg(t, 58, 59)));
    nameTag('ダイニン：−端へ（内回り）', 640, 500, '#2b3f6e', seg(t, 41, 42) * (1 - seg(t, 58, 59)));
    // cilium cross-section 9×2 + 2
    const ci = seg(t, 58, 60) * (1 - seg(t, 74, 76));
    if (ci > 0) { g.globalAlpha = ci; g.fillStyle = 'rgba(255,252,242,.95)'; g.beginPath(); g.arc(1060, 400, 120, 0, 7); g.fill(); for (let i = 0; i < 9; i++) { const q = (i / 9) * 6.283; g.fillStyle = '#3f86d1'; g.beginPath(); g.arc(1060 + Math.cos(q) * 84, 400 + Math.sin(q) * 84, 12, 0, 7); g.arc(1060 + Math.cos(q + 0.16) * 84, 400 + Math.sin(q + 0.16) * 84, 10, 0, 7); g.fill(); g.strokeStyle = '#c0566f'; g.lineWidth = 3; g.beginPath(); g.moveTo(1060 + Math.cos(q) * 70, 400 + Math.sin(q) * 70); g.lineTo(1060 + Math.cos(q + 0.4) * 76, 400 + Math.sin(q + 0.4) * 76); g.stroke(); } g.fillStyle = '#3f86d1'; g.beginPath(); g.arc(1046, 400, 10, 0, 7); g.arc(1074, 400, 10, 0, 7); g.fill(); hand('線毛の軸糸：9×2＋2', 1060, 560, 22, '#fff8e8', 1, 'center'); g.globalAlpha = 1; }
    // actin and intermediate filaments under the membrane
    const af = seg(t, 74, 76);
    if (af > 0) { g.globalAlpha = af; g.strokeStyle = '#ff9ec0'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, 40 + i * 10 + Math.sin(x / 18 + i) * 3); g.stroke(); } g.strokeStyle = '#ffd36b'; g.lineWidth = 6; g.beginPath(); for (let x = 0; x <= W; x += 30) g.lineTo(x, 80 + Math.sin(x / 60) * 6); g.stroke(); hand('アクチン 5〜7 nm ／ 中間径 10 nm', 640, 140, 22, '#ffe6ef', 1, 'center'); g.globalAlpha = 1; }
    pep(120, 640, 0.9, t, { sugar: true });
    label('微小管 ＝ 道路、モーター ＝ トラック', t, '#3f86d1'); vignette(0.3);
  },
  gate(t) {
    sky('#e9d8bf', '#efe2cc', '#f4ead9');
    g.fillStyle = 'rgba(80,60,40,.12)'; g.fillRect(0, 340, W, 380);
    hand('細胞の外', 60, 90, 28, '#6b5a48', 1); hand('細胞の中', 60, 420, 28, '#6b5a48', 1);
    // membrane with a clathrin pit that deepens and pinches off
    const pit = seg(t, 30, 40);
    g.strokeStyle = '#c99a6a'; g.lineWidth = 14; g.beginPath(); g.moveTo(0, 300); g.lineTo(520, 300);
    g.bezierCurveTo(540, 300, 560, 300 + 140 * pit, 640, 300 + 140 * pit); g.bezierCurveTo(720, 300 + 140 * pit, 740, 300, 760, 300); g.lineTo(W, 300); g.stroke();
    // receptors with ligands
    for (let i = 0; i < 4; i++) { const x = 590 + i * 34, y = 296 + 120 * pit - Math.abs(i - 1.5) * 20 * pit; g.strokeStyle = '#3a6f9e'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 24); g.stroke(); bead(x, y - 30, 7, '#ffd36b'); }
    // clathrin cage on the inside
    if (pit > 0.2) { g.strokeStyle = `rgba(201,154,42,${pit})`; g.lineWidth = 2; for (let i = 0; i < 9; i++) { const q = 0.3 + (i / 8) * 2.5; const x = 640 + Math.cos(q) * 110, y = 300 + 60 * pit + Math.sin(q) * 100 * pit; g.beginPath(); for (let m = 0; m < 6; m++) { const a = (m / 6) * 6.283; g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); } g.closePath(); g.stroke(); } }
    const v = seg(t, 40, 44);
    if (v > 0) { g.globalAlpha = v; g.fillStyle = '#fbf3dc'; g.beginPath(); g.arc(640, L(470, 560, v), 52, 0, 7); g.fill(); g.strokeStyle = '#c99a2a'; g.lineWidth = 3; g.stroke(); nameTag('被覆小胞', 800, 470, '#c99a2a', 1); g.globalAlpha = 1; }
    // phagocytosis and pinocytosis hints on the left; caveola on the right
    const ph = seg(t, 20, 22);
    if (ph > 0) { g.globalAlpha = ph; g.fillStyle = '#b07a4a'; g.beginPath(); g.arc(200, 240, 40, 0, 7); g.fill(); nameTag('食作用', 200, 170, '#9a7420', 1); for (let i = 0; i < 6; i++) bead(370 + (i % 3) * 18, 250 + Math.floor(i / 3) * 18, 4, '#8fd6ff', '#8fd6ff'); nameTag('飲作用', 390, 170, '#9a7420', 1); g.globalAlpha = 1; }
    const cav = seg(t, 52, 54);
    if (cav > 0) { g.globalAlpha = cav; g.fillStyle = '#e8f1e8'; g.strokeStyle = '#c99a6a'; g.lineWidth = 10; g.beginPath(); g.moveTo(1000, 300); g.quadraticCurveTo(1000, 380, 1040, 380); g.quadraticCurveTo(1080, 380, 1080, 300); g.stroke(); nameTag('カベオラ（クラスリンなし）', 1060, 440, '#3a9b69', 1); g.globalAlpha = 1; }
    clas(110, 600, 1.1, t); nameTag('かご職人クラス', 110, 480, '#c99a2a', seg(t, 11, 12));
    pep(1180, 640, 0.8, t, { sugar: true });
    label('クラスリン ＝ かご職人', t, '#c99a2a'); vignette(0.2, true);
  },
  trash(t) {
    sky('#2a1f2a', '#3a2834', '#4a303c');
    const rooms: [number, string, string, number][] = [[230, '#7fc8a0', '初期エンドソーム pH 6', 1], [640, '#f2b84b', '後期エンドソーム pH 5.5', 14], [1050, '#e2566f', 'リソソーム pH < 5', 31]];
    rooms.forEach(([x, c, n, at]) => { const a = seg(t, at, at + 2); g.globalAlpha = 0.25 + 0.75 * a; g.fillStyle = c; g.beginPath(); g.arc(x, 330, 150, 0, 7); g.fill(); g.globalAlpha = a; nameTag(n, x, 140, c, 1); g.globalAlpha = 1; });
    // a parcel travelling through the rooms
    const p = seg(t, 2, 40);
    bead(L(230, 1050, p), 330 + Math.sin(t * 2) * 10, 16, '#c9884f', '#ffe08a');
    // receptors going back to the membrane from the early endosome
    const rc = seg(t, 6, 10);
    if (rc > 0) { for (let i = 0; i < 3; i++) { const q = (t * 0.3 + i / 3) % 1; g.globalAlpha = rc; g.strokeStyle = '#3a6f9e'; g.lineWidth = 4; g.beginPath(); g.moveTo(230 - 40 + i * 30, L(230, 40, q)); g.lineTo(230 - 40 + i * 30, L(230, 40, q) - 22); g.stroke(); } g.globalAlpha = 1; }
    // proton pumps
    const hp = seg(t, 15, 17);
    if (hp > 0) for (let i = 0; i < 5; i++) { const q = (i / 5) * 6.283 + t * 0.3; g.globalAlpha = hp; hand('H⁺', 640 + Math.cos(q) * 120, 336 + Math.sin(q) * 120, 22, '#fff1b8', 1, 'center'); g.globalAlpha = 1; }
    // enzymes with M-6-P tags arriving from the Golgi above
    const m6 = seg(t, 44, 46);
    if (m6 > 0) for (let i = 0; i < 4; i++) { const q = (t * 0.25 + i / 4) % 1; g.globalAlpha = m6; g.fillStyle = '#ffe2ec'; g.beginPath(); g.arc(1050 + (i - 1.5) * 40, L(-20, 230, q), 12, 0, 7); g.fill(); g.fillStyle = '#ffd36b'; rr(1060 + (i - 1.5) * 40, L(-20, 230, q) - 22, 26, 12, 3); g.fill(); g.globalAlpha = 1; }
    nameTag('M-6-Pの荷札', 860, 70, '#c99a2a', m6);
    nameTag('酸性フォスファターゼ（目印）', 1050, 440, '#c0566f', seg(t, 38, 39));
    riso(1180, 640, 1.1, t); nameTag('処理場のリソ', 1180, 520, '#c0566f', seg(t, 22, 23));
    pep(110, 640, 0.8, t, { sugar: true });
    label('リソソーム ＝ ゴミ処理場', t, '#c0566f'); vignette(0.35);
  },
  power(t) {
    sky('#e7cf8f', '#efdcaa', '#f4e8c4'); sun(1120, 110, 40, '#fff4cf');
    // the mitochondrion building: outer membrane, inner membrane folded into cristae
    const mx = 520, my = 340;
    g.fillStyle = '#f7d98d'; g.beginPath(); g.ellipse(mx, my, 380, 190, 0, 0, 7); g.fill(); g.strokeStyle = '#8a6a1a'; g.lineWidth = 6; g.stroke();
    g.strokeStyle = '#b58a24'; g.lineWidth = 6; g.beginPath(); g.ellipse(mx, my, 352, 164, 0, 0, 7); g.stroke();
    for (let i = 0; i < 9; i++) { const x = mx - 280 + i * 70, up = i % 2 === 0; g.strokeStyle = '#b58a24'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, up ? my - 160 : my + 160); g.lineTo(x, up ? my + 40 : my - 40); g.stroke(); }
    // turbines + ATP sparks
    for (let i = 0; i < 9; i++) { const x = mx - 280 + i * 70, y = my + (i % 2 ? -40 : 40); g.save(); g.translate(x, y); g.rotate(t * 3 + i); g.fillStyle = '#d6a224'; for (let k = 0; k < 3; k++) { g.rotate(2.09); g.fillRect(0, -3, 16, 6); } g.restore(); }
    for (let i = 0; i < 8; i++) { const q = (t * 0.5 + i / 8) % 1; g.globalAlpha = Math.sin(q * Math.PI); hand('ATP', mx - 300 + i * 80, my - 220 - q * 60, 20, '#8a6a1a', 1, 'center'); } g.globalAlpha = 1;
    nameTag('外膜・内膜', 260, 120, '#8a6a1a', seg(t, 20, 21));
    nameTag('クリステ（タービン）', 760, 120, '#8a6a1a', seg(t, 25, 26));
    // circular DNA
    const dn = seg(t, 32, 34);
    if (dn > 0) { g.globalAlpha = dn; g.strokeStyle = '#3d9a5c'; g.lineWidth = 4; g.beginPath(); g.ellipse(mx + 200, my + 60, 30, 22, 0.3, 0, 7); g.stroke(); nameTag('環状DNA・二分裂・自前の蛋白は約5%', mx, my + 212, '#3d9a5c', 1); g.globalAlpha = 1; }
    // the peroxisome next door: H2O2 made and broken
    const px = seg(t, 55, 57);
    if (px > 0) {
      g.globalAlpha = px; g.fillStyle = '#e1d4f2'; g.beginPath(); g.arc(1080, 380, 110, 0, 7); g.fill(); g.strokeStyle = '#6a4a96'; g.lineWidth = 4; g.stroke();
      for (let i = 0; i < 6; i++) { const q = (t * 0.6 + i / 6) % 1; g.globalAlpha = px * Math.sin(q * Math.PI); g.fillStyle = '#8fd6ff'; g.beginPath(); g.arc(1030 + (i % 3) * 50, 420 - q * 80, 10 * (1 - q * 0.6), 0, 7); g.fill(); }
      g.globalAlpha = px; hand('H₂O₂', 1080, 360, 26, '#3a2a5a', 1, 'center'); nameTag('ペルオキシソーム', 1080, 240, '#6a4a96', 1); nameTag('オキシダーゼ → カタラーゼ', 1080, 530, '#6a4a96', seg(t, 58, 59)); g.globalAlpha = 1;
    }
    mito(110, 640, 1.2, t); nameTag('発電所長ミト', 110, 500, '#d6a224', seg(t, 9, 10));
    label('ミトコンドリア ＝ 別棟の発電所', t, '#d6a224'); vignette(0.2, true);
  },
  release(t, d) {
    const out = seg(t, 10, 18);
    sky(`rgb(${L(40, 250, out)},${L(36, 226, out)},${L(56, 190, out)})`, `rgb(${L(52, 252, out)},${L(46, 236, out)},${L(70, 210, out)})`, '#f6ecd6');
    if (out > 0.3) sun(1100, 120, 44, '#fff4cf', out);
    // the plasma membrane; the granule fuses and opens
    const fuse = seg(t, 10, 14);
    g.fillStyle = 'rgba(50,40,60,.4)'; g.fillRect(0, 380, W, 340);
    g.strokeStyle = '#c99a6a'; g.lineWidth = 14; g.beginPath(); g.moveTo(0, 380); g.lineTo(L(600, 560, fuse), 380); g.stroke(); g.beginPath(); g.moveTo(L(680, 720, fuse), 380); g.lineTo(W, 380); g.stroke();
    g.fillStyle = '#fbe6ee'; g.beginPath(); g.arc(640, L(470, 400, fuse), L(70, 40, fuse), 0, 7); g.fill();
    pep(640, L(500, 300, seg(t, 14, 20)), 1.1, t, { sugar: true, tag: false });
    // the rest of the factory keeps working
    const rest = seg(t, 36, 38);
    if (rest > 0) { g.globalAlpha = rest; nameTag('門：かごが荷物を取り込む', 240, 450, '#c99a2a', 1); nameTag('処理場：分解を続ける', 640, 500, '#c0566f', 1); nameTag('発電所：ATPを作りつづける', 1040, 450, '#d6a224', 1); g.globalAlpha = 1; }
    motes(t, 24, '255,240,200');
    endCard('十二分間の旅', t, d - 7);
    g.fillStyle = `rgba(20,10,0,${CL(seg(t, d - 3, d)) * 0.4})`; g.fillRect(0, 0, W, H);
    vignette(0.22, true);
  },
};
