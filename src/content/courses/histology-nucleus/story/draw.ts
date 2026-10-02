/** Story anime「午前二時の本社ビル」: the nucleus as a company headquarters at night. */
import type { SceneDraw } from '../../../../engine/story/types';
import {
  CL, H, L, W, bead, chibi, endCard, g, hand, label, moon, motes, nameTag, rr, room, seg, sky, stars, sun, titleCard, vignette,
} from '../../../../engine/story/kit';

/* ---------- characters ---------- */
const box = (k: number) => { g.fillStyle = '#c9884f'; g.strokeStyle = '#6b4a2a'; g.lineWidth = 2; rr(14 * k, -40 * k, 30 * k, 24 * k, 4 * k); g.fill(); g.stroke(); g.strokeStyle = '#f2d39a'; g.beginPath(); g.moveTo(29 * k, -40 * k); g.lineTo(29 * k, -16 * k); g.stroke(); };
const tag = (x: number, y: number, s: number, t: number, run = false, carry = true) => chibi(x, y, s, t, { hat: 'cap', hatCol: '#d57f45', run, extra: carry ? box : undefined });
const poa = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#e8f2fb', line: '#3f6f9e', hat: 'helmet', hatCol: '#3f86d1', happy: false, shape: 'tall',
  extra: (k) => { g.strokeStyle = '#ffd36b'; g.lineWidth = 2.5 * k; g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; g.lineTo(Math.cos(a) * 8 * k, -34 * k + Math.sin(a) * 8 * k); } g.closePath(); g.stroke(); },
});
const hist = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#f4eefb', line: '#6a4a96', hat: 'beret', hatCol: '#8a5cc2', shape: 'round',
  extra: (k) => { g.fillStyle = '#b48ad8'; g.beginPath(); g.ellipse(-34 * k, -24 * k, 10 * k, 13 * k, 0, 0, 7); g.fill(); g.strokeStyle = '#4a2f72'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-44 * k, -32 * k + i * 5 * k); g.lineTo(-24 * k, -32 * k + i * 5 * k); g.stroke(); } },
});
const nor = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#fbecef', line: '#8c3a50', hat: 'band', hatCol: '#c0566f', bob: 1.2,
  extra: (k) => { g.strokeStyle = '#2b2622'; g.lineWidth = 2; g.beginPath(); g.arc(-8 * k, -36 * k, 7 * k, 0, 7); g.arc(8 * k, -36 * k, 7 * k, 0, 7); g.stroke(); g.fillStyle = '#eee'; g.beginPath(); g.ellipse(0, -14 * k, 12 * k, 6 * k, 0, 0, 7); g.fill(); },
});
const spin = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#eef8f1', line: '#2f7e55', hat: 'crown', hatCol: '#3a9b69', bob: 3,
  extra: (k) => { g.strokeStyle = '#3a9b69'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(22 * k, -30 * k); g.lineTo(70 * k, -30 * k + i * 16 * k); g.stroke(); } },
});
const stem = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, { body: '#f6efe2', line: '#7d6047', hat: 'leaf', shape: 'drop', glow: 'rgba(255,230,160,.6)', bob: 1 });

/* ---------- the headquarters (nucleus) seen from outside ---------- */
function headquarters(cx: number, cy: number, r: number, t: number, mode: 'night' | 'he' | 'mp' | 'dawn') {
  // rough ER corridors leaving the outer wall, studded with ribosomes
  g.strokeStyle = 'rgba(150,120,170,.55)'; g.lineWidth = 16; g.lineCap = 'round';
  [[-0.2, -1], [0.9, 0.1], [-0.95, 0.3]].forEach(([dx, dy], k) => {
    g.beginPath(); g.moveTo(cx + dx * r, cy + dy * r * 0.9); for (let i = 1; i <= 6; i++) g.lineTo(cx + dx * r * (1 + i * 0.22) + Math.sin(i + k) * 18, cy + dy * r * (1 + i * 0.12) + Math.cos(i * 1.3 + k) * 22); g.stroke();
    g.fillStyle = 'rgba(70,50,90,.7)'; for (let i = 1; i <= 6; i++) { g.beginPath(); g.arc(cx + dx * r * (1 + i * 0.22) + Math.sin(i + k) * 18 + 9, cy + dy * r * (1 + i * 0.12) + Math.cos(i * 1.3 + k) * 22 - 9, 3, 0, 7); g.fill(); }
  });
  // double wall with the perinuclear moat
  g.fillStyle = '#e9dcef'; g.beginPath(); g.ellipse(cx, cy, r + 16, r * 0.86 + 16, 0, 0, 7); g.fill();
  g.strokeStyle = '#6a4a7a'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#2f2640'; g.beginPath(); g.ellipse(cx, cy, r + 8, r * 0.86 + 8, 0, 0, 7); g.fill();
  const inner = mode === 'he' ? '#cdb8e6' : mode === 'mp' ? '#e8f1e8' : mode === 'dawn' ? '#f4e9f2' : '#d8cbe4';
  g.fillStyle = inner; g.beginPath(); g.ellipse(cx, cy, r, r * 0.86, 0, 0, 7); g.fill(); g.strokeStyle = '#6a4a7a'; g.lineWidth = 3; g.stroke();
  // pores (gates)
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283 + 0.13; g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(cx + Math.cos(a) * (r + 8), cy + Math.sin(a) * (r * 0.86 + 8), 6, 0, 7); g.fill(); }
  // chromatin windows and the nucleolus room
  const win = mode === 'he' ? '#6b4b9a' : mode === 'mp' ? '#3d9a5c' : '#ffd27a';
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283, rr2 = r * (0.45 + 0.25 * ((i * 7) % 3) / 2); g.fillStyle = win; g.globalAlpha = 0.65 + 0.3 * Math.sin(t + i); rr(cx + Math.cos(a) * rr2 - 18, cy + Math.sin(a) * rr2 * 0.86 - 13, 36, 26, 6); g.fill(); }
  g.globalAlpha = 1;
  g.fillStyle = mode === 'he' ? '#5a3d8a' : mode === 'mp' ? '#e5739a' : '#ffb9c9'; g.beginPath(); g.ellipse(cx + r * 0.08, cy - r * 0.05, r * 0.2, r * 0.17, 0, 0, 7); g.fill();
}

/* ---------- scenes ---------- */
export const DRAW: Record<string, SceneDraw> = {
  hq(t) {
    sky('#121a33', '#22305a', '#3b3f6a'); stars(t, 90); moon(1120, 110, 34);
    // sleeping town
    for (let i = 0; i < 14; i++) { const x = i * 96 - 20, h2 = 70 + ((i * 37) % 60); g.fillStyle = '#1d2443'; rr(x, 600 - h2, 80, h2 + 40, 12); g.fill(); g.fillStyle = (i * 5) % 3 ? 'rgba(255,214,130,.0)' : 'rgba(255,214,130,.7)'; rr(x + 30, 600 - h2 + 20, 16, 14, 3); g.fill(); }
    g.fillStyle = '#151b33'; g.fillRect(0, 600, W, 120);
    const mode = t > 69 ? 'mp' : t > 60 ? 'he' : 'night';
    headquarters(640, 350, 200, t, mode);
    const tx = L(-60, 330, seg(t, 9, 16));
    tag(tx, 610, 1.1, t, t > 9 && t < 16); nameTag('タグ（僕）', tx, 500, '#d57f45', seg(t, 11, 12));
    nameTag('外核膜・内核膜', 640, 120, '#6a4a7a', seg(t, 31, 32) * (1 - seg(t, 53, 54)));
    nameTag('核周囲腔（堀）', 900, 200, '#2f2640', seg(t, 35, 36) * (1 - seg(t, 53, 54)));
    nameTag('粗面小胞体とつながる', 1080, 420, '#8a6aa2', seg(t, 43, 44) * (1 - seg(t, 53, 54)));
    if (mode !== 'night') {
      const he = mode === 'he';
      nameTag(he ? 'HE染色：染色質も核小体も紫' : 'MG-PY：DNA＝緑、RNA＝ピンク', 640, 105, he ? '#6b4b9a' : '#3d9a5c', 1);
    }
    titleCard('午前二時の本社ビル', '組織学「核・細胞周期」より', t);
    label('核 ＝ 細胞の本社', t - 18, '#d57f45');
    vignette(0.4);
  },
  gate(t) {
    sky('#1b2244', '#2a3563', '#3c4778');
    // cross-section: cytoplasm above, the double membrane, nucleus below
    g.fillStyle = '#e6dcef'; g.fillRect(0, 380, W, 340);
    const membrane = (y: number) => { g.fillStyle = '#8a6aa2'; g.fillRect(0, y, 540, 14); g.fillRect(740, y, 540, 14); };
    membrane(300); membrane(350); g.fillStyle = '#2f2640'; g.fillRect(0, 314, 540, 36); g.fillRect(740, 314, 540, 36);
    // the pore complex: cytoplasmic ring, spoke ring, nucleoplasmic ring
    [[296, '#ffd36b'], [326, '#f2b84b'], [360, '#ffd36b']].forEach(([y, c]) => { g.fillStyle = c as string; rr(520, (y as number) - 8, 40, 26, 8); g.fill(); rr(720, (y as number) - 8, 40, 26, 8); g.fill(); });
    // basket and lamina
    const bk = seg(t, 67, 69);
    g.strokeStyle = `rgba(255,211,107,${bk})`; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(560 + i * 40, 386); g.quadraticCurveTo(600 + i * 20, 460, 640, 470); g.stroke(); }
    const lm = seg(t, 72, 74);
    g.strokeStyle = `rgba(106,74,150,${lm})`; g.lineWidth = 2.5; for (let x = 0; x < W; x += 36) { if (x > 500 && x < 760) continue; g.beginPath(); g.moveTo(x, 372); g.lineTo(x + 36, 400); g.moveTo(x + 36, 372); g.lineTo(x, 400); g.stroke(); }
    // traffic: proteins in (blue), RNAs and subunits out (pink)
    const flow = seg(t, 48, 50);
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.18 + i / 6) % 1;
      if (i % 2) bead(L(615, 655, (i % 3) / 2), L(150, 520, p), 7, '#8fd6ff', '#8fd6ff');
      else if (flow > 0) { g.globalAlpha = flow; bead(L(625, 665, (i % 3) / 2), L(520, 150, p), i % 4 ? 7 : 12, '#ff9ec0', '#ff9ec0'); g.globalAlpha = 1; }
    }
    // inset: the eight-fold ring seen from above
    const ins = seg(t, 14, 16);
    if (ins > 0) {
      g.globalAlpha = ins; g.fillStyle = 'rgba(255,252,242,.92)'; g.beginPath(); g.arc(1080, 160, 104, 0, 7); g.fill();
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283 + t * 0.1; g.fillStyle = '#f2b84b'; g.beginPath(); g.arc(1080 + Math.cos(a) * 62, 160 + Math.sin(a) * 62, 18, 0, 7); g.fill(); }
      g.fillStyle = '#2f2640'; g.beginPath(); g.arc(1080, 160, 24, 0, 7); g.fill();
      hand('8回対称・3つのリング', 1080, 296, 22, '#fff8e8', ins, 'center'); hand('中央チャネル 約9 nm', 1080, 232, 17, '#2f2640', seg(t, 26, 27), 'center');
      g.globalAlpha = 1;
    }
    poa(420, 290, 1.2, t); nameTag('守衛ポア', 420, 170, '#3f86d1', seg(t, 1, 2));
    tag(230, 290, 1, t);
    hand('細胞質', 60, 120, 30, '#cfd7f2', 1); hand('核の中（核質）', 60, 560, 30, '#6a4a7a', 1);
    nameTag('入る：ヌクレオチド・蛋白質', 300, 470, '#3f86d1', seg(t, 38, 39));
    nameTag('出る：mRNA・tRNA・亜粒子', 980, 470, '#d14d7c', seg(t, 48, 49));
    nameTag('核バスケット', 640, 510, '#c99a2a', bk); nameTag('核ラミナ（ラミン）', 1040, 420, '#6a4a96', lm);
    label('核膜孔複合体 ＝ 守衛つきの門', t, '#3f86d1'); vignette(0.3);
  },
  archive(t) {
    room('#2c2340', '#3a2d4c', t, 0.12);
    // shelves
    for (let r2 = 0; r2 < 3; r2++) { g.fillStyle = '#4a3a62'; g.fillRect(0, 120 + r2 * 120, W, 10); for (let i = 0; i < 26; i++) { g.fillStyle = ['#7d5aa8', '#5b8b9e', '#a86f5a', '#8a9e5b'][(i + r2) % 4]; g.fillRect(20 + i * 48, 70 + r2 * 120, 30, 50); } }
    g.fillStyle = 'rgba(30,20,45,.55)'; g.fillRect(0, 0, W, 520);
    // beads on a string (10 nm) → 30 nm coil → loops / sealed boxes
    const s1 = seg(t, 19, 25);
    g.strokeStyle = '#e9e2ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, 300); for (let x = 80; x <= L(80, 760, s1); x += 8) g.lineTo(x, 300 + Math.sin(x / 14) * 4); g.stroke();
    for (let x = 110; x <= L(80, 760, s1); x += 64) { g.fillStyle = '#b48ad8'; g.beginPath(); g.ellipse(x, 300, 18, 14, 0, 0, 7); g.fill(); g.strokeStyle = '#e9e2ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, 300, 18, 14, 0, 0, 7); g.stroke(); }
    nameTag('ヌクレオソーム：10 nm', 300, 250, '#8a5cc2', seg(t, 21, 22));
    const s2 = seg(t, 44, 48);
    if (s2 > 0) { g.globalAlpha = s2; for (let i = 0; i < 14; i++) { g.fillStyle = '#9b74c8'; g.beginPath(); g.arc(840 + i * 22, 300 + Math.sin(i * 1.2) * 22, 12, 0, 7); g.fill(); } nameTag('H1 → 30 nm線維', 990, 250, '#8a5cc2', 1); g.globalAlpha = 1; }
    const s3 = seg(t, 55, 59);
    if (s3 > 0) {
      g.globalAlpha = s3;
      g.strokeStyle = '#b6e3a3'; g.lineWidth = 6; [0, 1, 2].forEach((i) => { g.beginPath(); g.ellipse(200 + i * 90, 410, 36, 50, 0, 0, 7); g.stroke(); });
      nameTag('正染色質（開いたファイル）', 290, 490, '#3d9a5c', 1);
      g.fillStyle = '#5a3d8a'; [0, 1, 2].forEach((i) => { rr(800 + i * 90, 370, 70, 70, 10); g.fill(); g.strokeStyle = '#d6c6f0'; g.lineWidth = 3; g.beginPath(); g.moveTo(800 + i * 90, 405); g.lineTo(870 + i * 90, 405); g.stroke(); });
      nameTag('異染色質（封をした箱）', 930, 490, '#5a3d8a', 1);
      g.globalAlpha = 1;
    }
    const barr = seg(t, 80, 82);
    if (barr > 0) { g.globalAlpha = barr; g.fillStyle = 'rgba(255,252,242,.9)'; g.beginPath(); g.arc(1150, 150, 80, 0, 7); g.fill(); g.strokeStyle = '#6a4a7a'; g.lineWidth = 3; g.beginPath(); g.arc(1150, 150, 64, 0, 7); g.stroke(); g.fillStyle = '#4a2f72'; g.beginPath(); g.ellipse(1150, 92, 16, 9, 0, 0, 7); g.fill(); hand('Barr小体', 1150, 260, 22, '#fff8e8', 1, 'center'); g.globalAlpha = 1; }
    hist(L(1300, 1170, seg(t, 6, 9)), 640, 1.1, t); nameTag('書庫係ヒスト', L(1300, 1170, seg(t, 6, 9)), 540, '#8a5cc2', seg(t, 8, 9));
    tag(110, 650, 1, t);
    motes(t, 18, '210,190,255'); label('染色質 ＝ 設計図の書庫', t, '#8a5cc2'); vignette(0.35);
  },
  nucleolus(t) {
    sky('#3a2335', '#4a2c42', '#5a364c');
    const cx = 620, cy = 330;
    // granular, dense fibrillar, fibrillar centre
    g.fillStyle = '#e8a6b8'; g.beginPath(); g.ellipse(cx, cy, 330, 250, 0, 0, 7); g.fill();
    for (let i = 0; i < 260; i++) { const a = i * 2.39, r2 = 200 + ((i * 37) % 110); g.fillStyle = 'rgba(150,50,80,.55)'; g.beginPath(); g.arc(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.74, 4, 0, 7); g.fill(); }
    g.fillStyle = '#d7738f'; g.beginPath(); g.ellipse(cx, cy, 190, 140, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,30,60,.45)'; g.lineWidth = 2; for (let i = 0; i < 30; i++) { const a = i * 0.7; g.beginPath(); g.arc(cx + Math.cos(a) * 140, cy + Math.sin(a) * 100, 22, a, a + 2); g.stroke(); }
    g.fillStyle = '#f6dfe6'; g.beginPath(); g.ellipse(cx, cy, 90, 66, 0, 0, 7); g.fill();
    const tags3 = seg(t, 20, 22);
    nameTag('線維中心', cx, cy, '#8c3a50', tags3); nameTag('線維部', cx + 150, cy - 70, '#8c3a50', tags3); nameTag('顆粒部', cx + 260, cy + 150, '#8c3a50', tags3);
    // the uridine label moving outward
    const lab = seg(t, 43, 55);
    if (lab > 0 && lab < 1) { const r2 = L(0, 380, lab); bead(cx + r2, cy - r2 * 0.2, 10, '#fff1b8'); }
    if (lab > 0) hand('³H-ウリジン：線維中心 → 線維部 → 顆粒部 → 核質', 640, 650 - 40, 22, '#ffe6ef', seg(t, 44, 45), 'center');
    // subunits assembled from rRNA + the delivered proteins, leaving through the door
    const asm = seg(t, 57, 62);
    if (asm > 0) for (let i = 0; i < 4; i++) { const p = (seg(t, 62, 92) * 2 + i / 4) % 1; const x = L(cx + 250, 1260, p), y = cy + 40 + i * 26; g.fillStyle = '#ffe2ec'; g.strokeStyle = '#8c3a50'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, i % 2 ? 22 : 15, i % 2 ? 16 : 11, 0, 0, 7); g.fill(); g.stroke(); }
    nameTag('大小の亜粒子', 1100, 300, '#8c3a50', asm);
    nor(130, 620, 1.2, t); nameTag('組立室長ノル', 130, 500, '#c0566f', seg(t, 3, 4));
    tag(L(1300, 1160, seg(t, 1, 6)), 640, 1, t, t < 6, t < 10);
    if (t > 10) { g.fillStyle = '#c9884f'; rr(1100, 610, 30, 24, 4); g.fill(); }
    hand('RNAポリメラーゼI → rRNA', 620, 62, 24, '#ffe6ef', seg(t, 30, 31), 'center');
    label('核小体 ＝ 部品の組立室', t, '#c0566f'); vignette(0.32);
  },
  split(t) {
    sky('#1d2a2a', '#28403a', '#2f4a40');
    // phase strip
    const P = ['前期', '前中期', '中期', '後期', '終期'];
    const at = [14.6, 41.3, 47, 58.2, 71.3];
    const ph = at.reduce((k, a, i) => (t >= a ? i : k), -1);
    P.forEach((n, i) => { g.fillStyle = i === ph ? '#3a9b69' : 'rgba(255,255,255,.12)'; rr(250 + i * 160, 26, 140, 44, 22); g.fill(); hand(n, 320 + i * 160, 57, 24, i === ph ? '#fff' : '#a9c4b7', 1, 'center'); });
    const cx = 640, cy = 380;
    const pro = seg(t, 15, 20), meta = seg(t, 46, 51), ana = seg(t, 58, 64), anaB = seg(t, 63, 69), telo = seg(t, 71, 77);
    const pole = L(150, 260, pro) + L(0, 90, anaB);
    // cell outline with the furrow
    const pinch = telo * 120;
    g.fillStyle = 'rgba(233,240,230,.95)'; g.beginPath(); g.ellipse(cx - pinch * 0.6, cy, 300 + anaB * 60 - pinch * 0.4, 210 - pinch * 0.3, 0, 0, 7); g.fill();
    if (pinch > 0) { g.beginPath(); g.ellipse(cx + pinch * 0.6, cy, 300 + anaB * 60 - pinch * 0.4, 210 - pinch * 0.3, 0, 0, 7); g.fill(); }
    // nuclear envelope and nucleolus fade in prophase / prometaphase
    const env = 1 - seg(t, 41, 45);
    g.strokeStyle = `rgba(106,74,122,${env})`; g.lineWidth = 4; g.beginPath(); g.ellipse(cx, cy, 160, 130, 0, 0, 7); g.stroke();
    g.fillStyle = `rgba(192,86,111,${1 - pro})`; g.beginPath(); g.arc(cx + 30, cy - 20, 30, 0, 7); g.fill();
    // centrosomes and spindle
    const cL = cx - pole, cR = cx + pole;
    [cL, cR].forEach((x) => bead(x, cy, 10, '#3a9b69', '#8fe0b4'));
    const sp = seg(t, 16, 21);
    // chromosomes (6), X-shaped until anaphase
    for (let i = 0; i < 6; i++) {
      const sx = cx + Math.cos(i * 1.7) * 90, sy = cy + Math.sin(i * 2.3) * 70;
      const mx = cx, my = cy - 125 + i * 50;
      const x = L(sx, mx, meta), y = L(sy, my, meta);
      const off = L(0, pole - 40, ana);
      g.strokeStyle = `rgba(58,155,105,${sp * 0.5})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cL, cy); g.lineTo(x - off, y); g.moveTo(cR, cy); g.lineTo(x + off, y); g.stroke();
      const thick = L(2, 9, pro);
      g.strokeStyle = '#5a3d8a'; g.lineWidth = thick; g.lineCap = 'round';
      [-1, 1].forEach((side) => { const dx = x + side * off; g.beginPath(); g.moveTo(dx - 8 + side * 4, y - 18); g.lineTo(dx + side * 2, y); g.lineTo(dx - 8 + side * 4, y + 18); g.stroke(); });
      if (ana < 0.05) { g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(x, y, 4 * pro, 0, 7); g.fill(); }
    }
    // reformed nuclei in telophase
    if (telo > 0) { g.globalAlpha = telo; [cL + 60, cR - 60].forEach((x) => { g.strokeStyle = '#6a4a7a'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, cy, 80, 70, 0, 0, 7); g.stroke(); }); g.globalAlpha = 1; }
    nameTag('セントロメア・動原体', 1000, 200, '#c99a2a', seg(t, 27, 28) * (1 - seg(t, 40, 41)));
    nameTag('赤道板', cx, 120, '#3a9b69', seg(t, 47, 48) * (1 - seg(t, 58, 59)));
    nameTag('後期A：染色体が極へ', 420, 120, '#3a9b69', seg(t, 60, 61) * (1 - seg(t, 71, 72)));
    nameTag('後期B：極と極が離れる', 860, 120, '#3a9b69', seg(t, 64, 65) * (1 - seg(t, 71, 72)));
    spin(130, 300, 1.1, t); nameTag('引き綱のスピン', 130, 180, '#3a9b69', seg(t, 6, 7));
    label('有糸分裂 ＝ 本社の分割', t, '#3a9b69'); vignette(0.32);
  },
  branch(t) {
    sky('#f0c9a4', '#f6dfc4', '#f9ecd8');
    // a villus rising from the crypt; cells ride up the conveyor
    g.fillStyle = '#e8b5a2'; g.beginPath(); g.moveTo(330, 720); g.lineTo(330, 520); g.bezierCurveTo(330, 140, 560, 90, 640, 90); g.bezierCurveTo(720, 90, 950, 140, 950, 520); g.lineTo(950, 720); g.fill();
    g.fillStyle = '#d99c88'; g.beginPath(); g.moveTo(330, 720); g.lineTo(330, 560); g.quadraticCurveTo(250, 560, 250, 640); g.lineTo(250, 720); g.fill(); g.beginPath(); g.moveTo(950, 720); g.lineTo(950, 560); g.quadraticCurveTo(1030, 560, 1030, 640); g.lineTo(1030, 720); g.fill();
    // path along the left edge from the crypt base (y≈700) to the tip (y≈100)
    const path = (p: number) => { if (p < 0.2) return [L(260, 330, p / 0.2), L(700, 560, p / 0.2)]; const q = (p - 0.2) / 0.8; return [L(330, 610, q * q), L(560, 100, q)]; };
    const speed = 0.02;
    for (let i = 0; i < 26; i++) {
      const p = (t * speed + i / 26) % 1;
      const [x, y] = path(p);
      const brdu = seg(t, 74, 76) > 0.5 && i % 4 === 0;
      g.fillStyle = brdu ? '#5a3d2a' : '#fbefe6'; g.strokeStyle = '#8c5a48'; g.lineWidth = 2; rr(x - 14, y - 12, 28, 24, 6); g.fill(); g.stroke();
      if (p > 0.97) { g.globalAlpha = (1 - p) * 30; bead(x + 30, y - 10, 6, '#fbefe6'); g.globalAlpha = 1; }
    }
    stem(150, 650, 0.9, t); nameTag('創業者ステム（幹細胞）', 160, 540, '#7d6047', seg(t, 43, 44));
    nameTag('陰窩：前駆細胞が増える', 1120, 500, '#8c5a48', seg(t, 54, 55));
    nameTag('絨毛を上昇 → 先端から剥離（約48時間）', 960, 120, '#8c5a48', seg(t, 66, 67));
    nameTag('BrdUで印をつける', 1120, 330, '#5a3d2a', seg(t, 75, 76));
    // three kinds of population
    const k3 = seg(t, 20, 22) * (1 - seg(t, 42, 44));
    if (k3 > 0) {
      g.globalAlpha = k3; g.fillStyle = 'rgba(255,252,242,.94)'; rr(60, 140, 500, 250, 18); g.fill();
      hand('更新性：表皮・消化管上皮・造血系・造精細胞系', 84, 196, 20, '#3a2a1e', seg(t, 21, 22));
      hand('静止性：神経細胞・心筋細胞', 84, 256, 20, '#3a2a1e', seg(t, 29, 30));
      hand('拡張性：肝・腎・線維芽細胞（G₀期）', 84, 316, 20, '#3a2a1e', seg(t, 35, 36));
      g.globalAlpha = 1;
    }
    tag(1180, 660, 0.9, t, false, false);
    label('細胞の更新 ＝ 社員の世代交代', t, '#7d6047'); vignette(0.22, true);
  },
  dawn(t, d) {
    const k = seg(t, 0, d);
    sky(`rgb(${L(60, 240, k)},${L(80, 190, k)},${L(140, 160, k)})`, '#f6c8a2', '#fbe3c4'); sun(1080, L(560, 420, k), 50, '#ffd27a', k);
    for (let i = 0; i < 14; i++) { const x = i * 96 - 20, h2 = 70 + ((i * 37) % 60); g.fillStyle = '#8d7a8a'; rr(x, 600 - h2, 80, h2 + 40, 12); g.fill(); }
    g.fillStyle = '#6e5f6c'; g.fillRect(0, 600, W, 120);
    headquarters(420, 330, 170, t, 'dawn');
    // subunits meet an mRNA and become ribosomes
    const m = seg(t, 2, 8);
    g.strokeStyle = '#d14d7c'; g.lineWidth = 4; g.beginPath(); for (let x = 720; x <= L(720, 1220, m); x += 10) g.lineTo(x, 300 + Math.sin(x / 30) * 8); g.stroke();
    for (let i = 0; i < 4; i++) {
      const j = seg(t, 6 + i * 1.5, 9 + i * 1.5);
      const x = 780 + i * 110;
      g.fillStyle = '#ffe2ec'; g.strokeStyle = '#8c3a50'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(L(600, x, j), L(380, 316, j), 22, 14, 0, 0, 7); g.fill(); g.stroke();
      const j2 = seg(t, 9 + i * 1.5, 12 + i * 1.5);
      g.beginPath(); g.ellipse(L(600, x, j2), L(220, 282, j2), 30, 20, 0, 0, 7); g.fill(); g.stroke();
    }
    nameTag('小亜粒子＋mRNA＋大亜粒子 ＝ リボソーム', 970, 230, '#8c3a50', seg(t, 10, 11) * (1 - seg(t, 24, 25)));
    tag(L(700, 1300, seg(t, 40, d)), 650, 1, t, t > 40, false);
    poa(150, 650, 0.7, t);
    endCard('午前二時の本社ビル', t, d - 7);
    g.fillStyle = `rgba(20,10,0,${CL(seg(t, d - 3, d)) * 0.4})`; g.fillRect(0, 0, W, H);
    vignette(0.25, true);
  },
};
