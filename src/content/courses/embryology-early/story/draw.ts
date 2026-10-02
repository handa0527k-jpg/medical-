/** Story anime「生命史線の夜行列車」: development and the history of life as one night train. */
import type { SceneDraw } from '../../../../engine/story/types';
import {
  CL, H, L, W, arrow, bead, chibi, endCard, g, hand, hills, label, moon, motes, nameTag, rr, seg, sky, stars, sun, titleCard, vignette, water,
} from '../../../../engine/story/kit';

/* ---------- characters ---------- */
const haru = (x: number, y: number, s: number, t: number, run = false) => chibi(x, y, s, t, {
  hat: 'cap', hatCol: '#2b3f6e', run,
  extra: (k) => { g.strokeStyle = '#c99a2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(14 * k, -24 * k); g.quadraticCurveTo(22 * k, -10 * k, 18 * k, -6 * k); g.stroke(); g.fillStyle = '#f2d39a'; g.beginPath(); g.arc(18 * k, -4 * k, 6 * k, 0, 7); g.fill(); },
});
const sou = (x: number, y: number, s: number, t: number) => {
  g.save(); g.translate(x, y); g.strokeStyle = '#3f86d1'; g.lineWidth = 3 * s; g.beginPath(); for (let i = 0; i <= 30; i++) g.lineTo(-20 * s - i * 4 * s, Math.sin(t * 12 - i * 0.4) * 8 * s); g.stroke(); g.restore();
  chibi(x, y + 30 * s, s * 0.8, t, { body: '#e8f2fb', line: '#3f6f9e', shape: 'round', bob: 6 });
};
const ran = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#fde6ee', line: '#a3365f', shape: 'round', bob: 1,
  extra: (k) => { g.strokeStyle = 'rgba(214,77,124,.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -32 * k, 42 * k, 42 * k, 0, 0, 7); g.stroke(); },
});
const sry = (x: number, y: number, s: number, t: number) => {
  g.save(); g.translate(x, y); g.fillStyle = '#6b5a48'; g.fillRect(-5 * s, -160 * s, 10 * s, 160 * s); g.restore();
  chibi(x, y - 110 * s, s, t, { body: '#eef8f1', line: '#2f7e55', shape: 'tall', happy: false, bob: 0.5, extra: (k) => { hand('SRY', 0, -6 * k, 16 * k, '#2f7e55', 1, 'center'); } });
};
const nameCh = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#f1e7d8', line: '#7d6047', shape: 'tall', hat: 'cap', hatCol: '#7d6047', happy: false, bob: 0.8,
  extra: (k) => { g.fillStyle = '#e6d6be'; g.beginPath(); g.moveTo(-20 * k, -10 * k); g.lineTo(-44 * k, 0); g.lineTo(-20 * k, 0); g.fill(); },
});
const toka = (x: number, y: number, s: number, t: number) => chibi(x, y, s, t, {
  body: '#f6e7b8', line: '#8a6a1a', shape: 'round', hat: 'beret', hatCol: '#c99a2a',
  extra: (k) => { g.strokeStyle = '#c99a2a'; g.lineWidth = 8 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(26 * k, -12 * k); g.quadraticCurveTo(60 * k, -4 * k + Math.sin(t * 3) * 6 * k, 70 * k, -30 * k); g.stroke(); },
});

/* ---------- props ---------- */
function train(x: number, y: number, n: number, col = '#3f4a6e', lit = true) {
  for (let i = 0; i < n; i++) {
    const cx = x + i * 250; g.fillStyle = col; rr(cx, y - 110, 236, 100, 18); g.fill();
    for (let w = 0; w < 4; w++) { g.fillStyle = lit ? 'rgba(255,214,130,.85)' : '#9fb0c8'; rr(cx + 16 + w * 54, y - 92, 40, 36, 6); g.fill(); }
    g.fillStyle = '#20263a'; [cx + 40, cx + 196].forEach((wx) => { g.beginPath(); g.arc(wx, y - 6, 14, 0, 7); g.fill(); });
  }
}
function rails(y: number) { g.strokeStyle = '#59606f'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.moveTo(0, y + 12); g.lineTo(W, y + 12); g.stroke(); g.strokeStyle = '#4a3a30'; g.lineWidth = 6; for (let x = 0; x < W; x += 34) { g.beginPath(); g.moveTo(x, y - 2); g.lineTo(x + 10, y + 16); g.stroke(); } }
function panel(x: number, y: number, w: number, h: number, a = 1) { if (a <= 0) return; g.globalAlpha = CL(a); g.fillStyle = 'rgba(255,250,236,.95)'; rr(x, y, w, h, 14); g.fill(); g.globalAlpha = 1; }

/* ---------- scenes ---------- */
export const DRAW: Record<string, SceneDraw> = {
  station(t) {
    sky('#0f1630', '#1b2648', '#2b3460'); stars(t, 90); moon(1100, 100, 30);
    g.fillStyle = '#2a2f40'; g.fillRect(0, 470, W, 250); rails(560);
    g.fillStyle = '#3a4055'; g.fillRect(0, 440, W, 30);
    // station clock
    g.fillStyle = '#fff8e8'; g.beginPath(); g.arc(640, 120, 52, 0, 7); g.fill(); g.strokeStyle = '#2b2622'; g.lineWidth = 4; g.stroke(); g.beginPath(); g.moveTo(640, 120); g.lineTo(640, 80); g.moveTo(640, 120); g.lineTo(640 + Math.cos(t * 0.05 - 1.57) * 40, 120 + Math.sin(t * 0.05 - 1.57) * 40); g.stroke();
    train(L(1300, 60, seg(t, 0, 10)), 552, 5);
    // two timetables
    const tt = seg(t, 28, 30);
    if (tt > 0) {
      panel(290, 200, 900, 210, tt); g.globalAlpha = tt;
      const ox = 700, sw = 38;
      hand('胎齢（受精から）', 310, 250, 22, '#3f86d1', 1); hand('妊娠齢（最終月経の初日から）', 310, 330, 20, '#c0566f', 1);
      for (let w = 0; w <= 12; w++) hand(String(w), ox + w * sw, 380, 16, '#6b5a48', 1, 'center');
      g.fillStyle = '#3f86d1'; rr(ox, 232, sw * 10, 22, 8); g.fill(); g.fillStyle = '#c0566f'; rr(ox, 312, sw * 12, 22, 8); g.fill();
      arrow(ox, 290, ox + sw * 2, 290, '#6b5a48', 3); hand('2週ずれる', ox + sw * 2 + 14, 296, 18, '#6b5a48', 1);
      const og = seg(t, 43, 45);
      if (og > 0) { g.globalAlpha = tt * og; g.fillStyle = 'rgba(58,155,105,.35)'; rr(ox + 3 * sw, 222, 5 * sw, 42, 8); g.fill(); hand('器官形成期（発生3〜8週）', ox + 5.5 * sw, 216, 18, '#2f7e55', 1, 'center'); }
      g.globalAlpha = 1;
    }
    haru(L(-60, 200, seg(t, 11, 16)), 450, 1.1, t, t > 11 && t < 16); nameTag('ハル（僕）', L(-60, 200, seg(t, 11, 16)), 340, '#d57f45', seg(t, 14, 15));
    titleCard('生命史線の夜行列車', '人体発生学「初期発生と系統発生」より', t);
    vignette(0.4);
  },
  meet(t) {
    sky('#3b1f2e', '#4a2638', '#5a2e42');
    // the ampulla: soft folds of the tube
    g.strokeStyle = 'rgba(255,190,210,.18)'; g.lineWidth = 30; for (let i = 0; i < 6; i++) { g.beginPath(); for (let x = 0; x <= W; x += 40) g.lineTo(x, 60 + i * 120 + Math.sin(x / 120 + i + t * 0.2) * 20); g.stroke(); }
    hand('卵管膨大部', 60, 60, 24, '#ffd9e6', 1);
    const cx = 760, cy = 340;
    // corona radiata, zona pellucida, egg
    const zg = seg(t, 60, 64);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283; g.fillStyle = 'rgba(250,210,180,.8)'; g.beginPath(); g.arc(cx + Math.cos(a) * 200, cy + Math.sin(a) * 200, 18, 0, 7); g.fill(); }
    g.strokeStyle = `rgba(${L(230, 140, zg)},${L(220, 200, zg)},${L(255, 255, zg)},.9)`; g.lineWidth = L(22, 30, zg); g.beginPath(); g.arc(cx, cy, 160, 0, 7); g.stroke();
    if (zg > 0) { g.save(); g.shadowColor = '#9fd0ff'; g.shadowBlur = 24 * zg; g.strokeStyle = `rgba(159,208,255,${zg})`; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, 160, 0, 7); g.stroke(); g.restore(); }
    g.fillStyle = '#fde6ee'; g.beginPath(); g.arc(cx, cy, 140, 0, 7); g.fill();
    // cortical granules released
    for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; const r2 = L(126, 150, seg(t, 57, 60)); g.globalAlpha = 1 - seg(t, 60, 63); g.fillStyle = '#c0566f'; g.beginPath(); g.arc(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, 5, 0, 7); g.fill(); } g.globalAlpha = 1;
    nameTag('放線冠', cx - 200, 110, '#e0a080', seg(t, 28, 29)); nameTag('透明帯（ZP1〜4）', cx + 210, 110, '#9fa8ff', seg(t, 32, 33));
    // the sperm's approach through the steps
    const steps = ['①放線冠', '②先体反応', '③透明帯', '④膜融合', '⑤核の進入'];
    const sp = seg(t, 41, 55);
    const sx = L(160, cx - 120, sp), sy = L(380, cy, sp);
    if (t > 30 && t < 75) sou(sx, sy, 0.9, t);
    steps.forEach((n, i) => nameTag(n, 300 + i * 150, 30, '#3f86d1', seg(t, 41 + i * 3, 42 + i * 3) * (1 - seg(t, 64, 65))));
    // a second sperm turned away
    if (t > 64 && t < 76) { const q = seg(t, 64, 70); sou(L(1180, cx + 190, Math.min(q * 2, 1)) + (q > 0.5 ? (q - 0.5) * 300 : 0), 560 - (q > 0.5 ? (q - 0.5) * 200 : 0), 0.6, t); }
    // calcium waves and pronuclei
    const ca = seg(t, 80, 82);
    if (ca > 0) for (let k = 0; k < 3; k++) { const r2 = ((t * 60 + k * 50) % 140); g.strokeStyle = `rgba(255,214,107,${(1 - r2 / 140) * ca})`; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r2, 0, 7); g.stroke(); }
    nameTag('カルシウムオシレーション', cx, 590, '#c99a2a', ca * (1 - seg(t, 96, 97)));
    const pn = seg(t, 97, 105);
    if (pn > 0) { g.globalAlpha = CL(pn * 3); bead(L(cx - 70, cx - 22, pn), cy, 24, '#bcd8ff', '#bcd8ff'); bead(L(cx + 70, cx + 22, pn), cy, 24, '#ffc6d8', '#ffc6d8'); g.globalAlpha = 1; nameTag('男性前核・女性前核', cx, 590, '#a3365f', seg(t, 98, 99)); }
    ran(L(1300, 1150, seg(t, 16, 20)), 640, 0.9, t); nameTag('ラン（卵子）', 1150, 520, '#d14d7c', seg(t, 18, 19));
    if (t < 30) { sou(L(-80, 200, seg(t, 7, 11)), 520, 1, t); nameTag('ソウ（精子）', 200, 430, '#3f86d1', seg(t, 9, 10) * (1 - seg(t, 28, 30))); }
    label('受精 ＝ 二人の旅人の出会い', t, '#d14d7c'); vignette(0.35);
  },
  fork(t) {
    sky('#1b2a2a', '#26403a', '#355046'); stars(t, 40, 0.6); hills('#2f4a3c', '#283f33', 430);
    // two tracks diverging to the horizon
    g.strokeStyle = '#8a8f9a'; g.lineWidth = 5;
    [[-1, '#7aa3d6'], [1, '#e2869c']].forEach(([d, c]) => { const dd = d as number; g.strokeStyle = c as string; g.lineWidth = 6; g.beginPath(); g.moveTo(560, 720); g.quadraticCurveTo(600 + dd * 40, 560, 640 + dd * 260, 420); g.moveTo(720, 720); g.quadraticCurveTo(680 + dd * 40 + 40, 560, 660 + dd * 260, 420); g.stroke(); });
    hand('雄の方向', 960, 400, 24, '#7aa3d6', seg(t, 30, 32), 'center'); hand('雌型（デフォルト）', 330, 400, 24, '#e2869c', seg(t, 34, 36), 'center');
    sry(640, 700, 1, t); nameTag('標識のスリー', 640, 470, '#3a9b69', seg(t, 9, 10));
    nameTag('XY → 雄 ／ XX → 雌', 640, 90, '#3a9b69', seg(t, 18, 19) * (1 - seg(t, 42, 43)));
    nameTag('Y染色体短腕の末端：SRY', 640, 140, '#3a9b69', seg(t, 23, 24) * (1 - seg(t, 42, 43)));
    const hm = seg(t, 42, 44) * (1 - seg(t, 68, 70));
    if (hm > 0) { panel(60, 80, 520, 230, hm); g.globalAlpha = hm; hand('精巣', 90, 130, 26, '#3f86d1', 1); hand('テストステロン・DHT', 110, 172, 20, '#3a2a1e', 1); hand('ミュラー管抑制物質 → ミュラー管が退縮', 110, 208, 20, '#3a2a1e', 1); hand('卵巣：エストロゲン → ミュラー管が発達', 90, 262, 20, '#c0566f', seg(t, 51, 52)); g.globalAlpha = 1; }
    nameTag('男性ホルモン受容体（受け取る窓口）', 960, 130, '#c99a2a', seg(t, 58, 59) * (1 - seg(t, 68, 69)));
    const ot = seg(t, 68, 70);
    if (ot > 0) { panel(760, 70, 460, 200, ot); g.globalAlpha = ot; g.fillStyle = '#f2e6c8'; g.beginPath(); g.ellipse(820, 160, 26, 34, 0, 0, 7); g.fill(); g.strokeStyle = '#c0304a'; g.lineWidth = 4; g.beginPath(); g.moveTo(860, 190); g.lineTo(860, 120); g.stroke(); hand('爬虫類：孵化温度', 990, 170, 22, '#3a2a1e', 1, 'center'); hand('鳥類：ZZ♂・ZW♀', 990, 230, 22, '#3a2a1e', seg(t, 76, 77), 'center'); g.globalAlpha = 1; }
    haru(1150, 690, 0.9, t);
    label('SRY ＝ 分かれ道の標識', t, '#3a9b69'); vignette(0.35);
  },
  home(t) {
    sky('#3a2230', '#4a2a3a', '#5a3244');
    // the tube from the ampulla (right) down to the uterus (left)
    g.strokeStyle = 'rgba(255,190,210,.35)'; g.lineWidth = 120; g.lineCap = 'round'; g.beginPath(); g.moveTo(1300, 200); g.bezierCurveTo(900, 120, 600, 340, 240, 300); g.stroke();
    g.fillStyle = 'rgba(214,77,124,.35)'; g.beginPath(); g.ellipse(120, 380, 160, 260, 0, 0, 7); g.fill(); hand('子宮', 90, 120, 24, '#ffd9e6', 1);
    const p = seg(t, 2, 60);
    const bx = L(1150, 230, p), by = L(180, 300, p) + Math.sin(p * 3) * 30;
    const stage = t < 14 ? 1 : t < 19 ? 2 : t < 24 ? 4 : t < 31 ? 16 : 0;
    g.strokeStyle = 'rgba(230,220,255,.9)'; g.lineWidth = 6; if (t < 31) { g.beginPath(); g.arc(bx, by, 46, 0, 7); g.stroke(); }
    if (stage > 0) { const n = stage; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283, r2 = n === 1 ? 0 : n === 2 ? 16 : n === 4 ? 18 : 22; g.fillStyle = '#fde6ee'; g.beginPath(); g.arc(bx + Math.cos(a) * r2, by + Math.sin(a) * r2, n === 1 ? 36 : n === 2 ? 20 : n === 4 ? 16 : 11, 0, 7); g.fill(); g.strokeStyle = '#a3365f'; g.lineWidth = 2; g.stroke(); } }
    else { g.fillStyle = '#fde6ee'; g.beginPath(); g.arc(bx, by, 44, 0, 7); g.fill(); g.strokeStyle = '#a3365f'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#c0566f'; g.beginPath(); g.ellipse(bx - 18, by, 18, 26, 0, 0, 7); g.fill(); }
    nameTag(['', '受精卵', '2細胞（30時間）', '', '4細胞（40時間）'][stage] || (stage === 16 ? '桑実胚（3〜4日）' : t < 50 ? 'ハッチング → 胚盤胞（4.5日）' : '着床（5.5〜6日）'), bx, by - 80, '#a3365f', seg(t, 1, 2));
    // bilaminar disc in the second week
    const bi = seg(t, 63, 65);
    if (bi > 0) {
      panel(520, 330, 700, 280, bi); g.globalAlpha = bi;
      const dx = 870, dy = 470;
      g.fillStyle = '#cfe3f6'; g.beginPath(); g.ellipse(dx, dy - 70, 150, 60, 0, 3.14, 6.283); g.fill(); hand('羊膜腔', dx, dy - 90, 20, '#2b4a7e', 1, 'center');
      g.fillStyle = '#3f86d1'; rr(dx - 160, dy - 20, 320, 20, 8); g.fill(); hand('胚盤葉上層', dx + 240, dy - 4, 18, '#2b4a7e', 1, 'center');
      g.fillStyle = '#e6b23a'; rr(dx - 160, dy, 320, 16, 8); g.fill(); hand('胚盤葉下層', dx + 240, dy + 22, 18, '#8a6a1a', 1, 'center');
      g.fillStyle = 'rgba(230,178,58,.35)'; g.beginPath(); g.ellipse(dx, dy + 66, 130, 50, 0, 0, 3.14); g.fill(); hand('卵黄嚢', dx, dy + 90, 20, '#8a6a1a', 1, 'center');
      hand('胚外体腔', 620, 580, 18, '#6b5a48', 1, 'center');
      g.globalAlpha = 1;
    }
    haru(1180, 660, 0.9, t);
    label('卵割から着床へ ＝ 最初の家づくり', t, '#c0566f'); vignette(0.35);
  },
  gast(t) {
    sky('#241f38', '#2e2848', '#383258');
    // top view of the disc with the streak (left), cross-section (right)
    g.fillStyle = '#3f86d1'; g.beginPath(); g.ellipse(300, 330, 180, 230, 0, 0, 7); g.fill();
    const st = seg(t, 2, 8);
    g.strokeStyle = '#ffe08a'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(300, 540); g.lineTo(300, L(540, 330, st)); g.stroke();
    if (st > 0.9) { g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(300, 322, 16, 0, 7); g.fill(); }
    nameTag('原始線条', 450, 470, '#c99a2a', seg(t, 4, 5)); nameTag('原始結節', 450, 300, '#c99a2a', seg(t, 9, 10));
    // cross-section: epiblast on top, hypoblast below; cells move in through the streak
    const cx = 880;
    g.fillStyle = '#3f86d1'; rr(cx - 280, 200, 560, 40, 10); g.fill();
    const ent = seg(t, 20, 34);
    g.fillStyle = `rgba(230,178,58,${1 - seg(t, 30, 36)})`; rr(cx - 280, 420, 560, 30, 10); g.fill();
    // groove
    g.fillStyle = '#383258'; g.beginPath(); g.moveTo(cx - 20, 200); g.lineTo(cx, 240); g.lineTo(cx + 20, 200); g.fill();
    for (let i = 0; i < 24; i++) {
      const q = CL(ent * 1.6 - i / 30);
      const side = i % 2 ? 1 : -1;
      const tx = cx + side * (40 + ((i * 47) % 240));
      const isEndo = i % 3 === 0;
      const ty = isEndo ? 435 : 320 + ((i * 13) % 50);
      const x = q < 0.3 ? cx : L(cx, tx, (q - 0.3) / 0.7), y = q < 0.3 ? L(220, 280, q / 0.3) : L(280, ty, (q - 0.3) / 0.7);
      if (q > 0) { g.fillStyle = isEndo ? '#e6b23a' : '#e2566f'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); }
    }
    const lay = seg(t, 29, 31);
    nameTag('外胚葉（上層に残る）', cx, 170, '#3f86d1', lay); nameTag('中胚葉（あいだに広がる）', cx, 380, '#e2566f', lay); nameTag('内胚葉（下層を置換）', cx, 480, '#c99a2a', lay);
    hand('3層性胚盤（第15〜16日）', cx, 560, 26, '#fff8e8', seg(t, 42, 44), 'center');
    haru(110, 650, 0.9, t);
    label('原腸形成 ＝ 地下への入口', t, '#8a5cc2'); vignette(0.35);
  },
  maps(t) {
    // dining car
    g.fillStyle = '#3a2a24'; g.fillRect(0, 0, W, H); g.fillStyle = '#4a362c'; g.fillRect(0, 470, W, 250);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#141826'; rr(60 + i * 300, 60, 240, 160, 12); g.fill(); for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(255,214,130,.6)'; g.fillRect(60 + i * 300 + ((t * 300 + k * 90) % 260) - 20, 120 + k * 8, 30, 3); } }
    g.fillStyle = '#f3ead8'; rr(160, 250, 960, 330, 14); g.fill(); g.strokeStyle = '#6b5a48'; g.lineWidth = 2; g.beginPath(); g.moveTo(640, 250); g.lineTo(640, 580); g.stroke();
    // ontogeny cycle (left page)
    const og = seg(t, 8, 10);
    if (og > 0) { g.globalAlpha = og; g.strokeStyle = '#d14d7c'; g.lineWidth = 4; g.beginPath(); g.arc(400, 380, 80, 0, 6); g.stroke(); arrow(400 + Math.cos(6) * 80, 380 + Math.sin(6) * 80, 400 + Math.cos(6.2) * 80, 380 + Math.sin(6.2) * 80, '#d14d7c', 4); hand('個体発生', 400, 386, 22, '#3a2a1e', 1, 'center'); hand('受精 → 成体 → 配偶子', 400, 500, 18, '#6b5a48', 1, 'center'); g.globalAlpha = 1; }
    const hom = seg(t, 22, 24) * (1 - seg(t, 31, 32));
    if (hom > 0) { g.globalAlpha = hom; g.fillStyle = '#e6d6be'; g.beginPath(); g.ellipse(400, 380, 40, 56, 0, 0, 7); g.fill(); g.fillStyle = '#c99a8f'; g.beginPath(); g.arc(400, 360, 12, 0, 7); g.fill(); g.fillRect(392, 372, 16, 24); hand('ホムンクルス（前成説）', 400, 470, 20, '#3a2a1e', 1, 'center'); g.globalAlpha = 1; }
    // right page: names on the map
    const names: [number, string, string][] = [[32, '18世紀 リンネ', '二名法：Homo sapiens'], [43, '1859 ダーウィン', '種の起源・自然選択'], [52, '1874 ヘッケル', '反復説・系統樹'], [61, '現在', '分子系統解析']];
    names.forEach(([at, a, b], i) => { const al = seg(t, at, at + 1.5); hand(a, 680, 300 + i * 66, 22, '#3a2a1e', al); hand(b, 900, 300 + i * 66, 20, '#6b5a48', al); });
    const tree = seg(t, 54, 58);
    if (tree > 0) { g.globalAlpha = tree; g.strokeStyle = '#3a9b69'; g.lineWidth = 3; const br = (x: number, y: number, a: number, d: number) => { if (d > 4) return; const x2 = x + Math.cos(a) * (40 - d * 6), y2 = y + Math.sin(a) * (40 - d * 6); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); br(x2, y2, a - 0.4, d + 1); br(x2, y2, a + 0.4, d + 1); }; br(1060, 560, -1.57, 0); g.globalAlpha = 1; }
    hand('系統発生：生物の進化の旅', 400, 280, 20, '#3f86d1', seg(t, 14, 16), 'center');
    haru(1180, 660, 0.9, t);
    label('系統発生 ＝ 旅の地図', t, '#3f86d1'); vignette(0.35);
  },
  route(t) {
    g.fillStyle = '#2e261f'; g.fillRect(0, 0, W, H); g.fillStyle = '#3e3328'; g.fillRect(0, 480, W, 240);
    // the route map
    g.fillStyle = '#efe3c6'; rr(60, 60, 1160, 360, 16); g.fill();
    g.strokeStyle = '#7d6047'; g.lineWidth = 8; g.beginPath(); g.moveTo(100, 250); g.lineTo(1180, 250); g.stroke();
    const st: [string, string, number][] = [['46億', '地球', 11], ['38億', '生物', 16], ['20億', '真核生物', 21], ['12億', '動物', 24], ['6億', '脊索動物', 27], ['5億', '脊椎動物', 30], ['4億', '羊膜類', 33], ['2億', '哺乳類', 35], ['1.5億', '有胎盤類', 38], ['1億', '霊長目', 42], ['2000万', 'ヒト上科', 46]];
    st.forEach(([y, n, at], i) => { const x = 110 + i * 105, a = seg(t, at, at + 1); g.globalAlpha = 0.25 + 0.75 * a; g.fillStyle = i === 4 ? '#c0566f' : '#7d6047'; g.beginPath(); g.arc(x, 250, 12, 0, 7); g.fill(); hand(`${y}年前`, x, 210, 15, '#3a2a1e', 1, 'center'); hand(n, x, 296, 16, '#3a2a1e', 1, 'center'); g.globalAlpha = 1; });
    const tp = seg(t, 10, 48); bead(L(110, 1160, tp), 250, 10, '#ffd36b');
    // amphioxus sketch
    const am = seg(t, 50, 52);
    if (am > 0) { g.globalAlpha = am; g.fillStyle = '#e6d6be'; g.beginPath(); g.moveTo(420, 360); g.quadraticCurveTo(640, 320, 860, 360); g.quadraticCurveTo(640, 400, 420, 360); g.fill(); g.strokeStyle = '#c0566f'; g.lineWidth = 3; g.beginPath(); g.moveTo(440, 356); g.lineTo(840, 356); g.stroke(); hand('脊索・神経管と筋・二重の筒', 640, 400, 18, '#3a2a1e', 1, 'center'); g.globalAlpha = 1; }
    nameTag('頭索類（ナメクジウオ）・尾索類（ホヤ）', 640, 450, '#7d6047', seg(t, 51, 52));
    nameTag('2008年：脊椎動物の祖先はナメクジウオの仲間', 640, 500, '#c0566f', seg(t, 70, 71));
    nameCh(110, 650, 1.1, t); nameTag('車掌ナメ', 110, 520, '#7d6047', seg(t, 2, 3));
    haru(1180, 650, 0.9, t);
    label('系統樹 ＝ 路線図', t - 2, '#7d6047'); vignette(0.4);
  },
  shore(t, d) {
    const land = seg(t, 23, 50);
    sky('#6aa3bb', '#a8cfd8', '#e6e2c8'); sun(1080, 120, 40, '#fff4cf');
    hills(`rgb(${L(120, 140, land)},${L(170, 180, land)},${L(150, 110, land)})`, '#7a9d68', L(560, 440, land));
    water(L(470, 640, land), t);
    rails(L(470, 470, 0)); train(L(1300, -400, seg(t, 0, d)), 470, 3, '#4a5a7e', false);
    const st: [string, string, number][] = [['無顎類', '顎なし・二半規管・前腎＋中腎', 9], ['有顎類', '一心房一心室・三半規管・中腎', 23], ['両生類', '四肢・二心房一心室・肺・鼓膜', 38], ['爬虫類', '二心房不完全二心室・後腎・殻付き卵', 57]];
    st.forEach(([n, f, at], i) => { const a = seg(t, at, at + 1.5) * (i < 3 ? 1 - seg(t, st[i + 1][2] - 1, st[i + 1][2]) : 1); if (a <= 0) return; panel(380, 70, 520, 110, a); g.globalAlpha = a; hand(n, 640, 116, 30, '#3a2a1e', 1, 'center'); hand(f, 640, 158, 20, '#6b5a48', 1, 'center'); g.globalAlpha = 1; });
    // silhouettes: lamprey, fish, frog, lizard
    const sil = (k: number, x: number, y: number) => { g.fillStyle = 'rgba(40,60,70,.75)'; if (k === 0) { g.beginPath(); g.ellipse(x, y, 70, 12, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x - 70, y, 12, 0, 7); g.fill(); } else if (k === 1) { g.beginPath(); g.ellipse(x, y, 56, 22, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 50, y); g.lineTo(x + 80, y - 20); g.lineTo(x + 80, y + 20); g.fill(); } else if (k === 2) { g.beginPath(); g.ellipse(x, y, 36, 26, 0, 0, 7); g.fill(); g.fillRect(x - 40, y + 10, 16, 20); g.fillRect(x + 24, y + 10, 16, 20); } else { g.beginPath(); g.ellipse(x, y, 52, 16, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 50, y); g.lineTo(x + 120, y + 6); g.lineTo(x + 50, y + 8); g.fill(); g.fillRect(x - 30, y + 8, 10, 18); g.fillRect(x + 20, y + 8, 10, 18); } };
    [9, 23, 38, 57].forEach((at, k) => { const a = seg(t, at, at + 1.5); if (a <= 0) return; g.globalAlpha = a; sil(k, 200 + k * 260, k < 2 ? L(560, 660, land) : 400); g.globalAlpha = 1; });
    nameTag('肉鰭類（肺魚・シーラカンス）→ 陸への橋渡し', 640, 230, '#3f86d1', seg(t, 31, 32) * (1 - seg(t, 37, 38)));
    toka(L(1300, 1120, seg(t, 48, 51)), 640, 1, t); nameTag('トカ（爬虫類）', 1120, 520, '#c99a2a', seg(t, 50, 51));
    haru(110, 650, 0.9, t);
    label('魚類から爬虫類へ ＝ 水から陸へ', t, '#c99a2a'); vignette(0.22);
  },
  human(t, d) {
    const k = seg(t, 0, d * 0.8);
    sky(`rgb(${L(40, 240, k)},${L(50, 200, k)},${L(90, 170, k)})`, '#f3c58d', '#f8e2b2'); sun(1060, L(560, 380, k), 52, '#ffd27a', k);
    hills('#8a7a5c', '#6e6048', 520); g.fillStyle = '#4a3e30'; g.fillRect(0, 600, W, 120); rails(600);
    const ft = seg(t, 6, 8) * (1 - seg(t, 35, 37));
    if (ft > 0) { panel(150, 80, 980, 160, ft); g.globalAlpha = ft; ['二心房二心室', '恒温', '乳腺と毛', '口蓋と頬', '尿生殖路と糞道が別'].forEach((n, i) => nameTag(n, 260 + i * 190, 130, '#c0566f', seg(t, 6 + i * 2.4, 7 + i * 2.4))); hand('乳腺は汗腺から派生（推測）・単孔類は皮膚表面から・胎盤は卵の血管から', 640, 200, 20, '#3a2a1e', seg(t, 19, 21), 'center'); g.globalAlpha = 1; }
    // platypus silhouette
    const pl = seg(t, 24, 26) * (1 - seg(t, 35, 37));
    if (pl > 0) { g.globalAlpha = pl; g.fillStyle = 'rgba(60,45,35,.8)'; g.beginPath(); g.ellipse(300, 450, 70, 30, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(220, 450, 34, 12, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(380, 456, 30, 12, 0, 0, 7); g.fill(); g.globalAlpha = 1; nameTag('単孔類（カモノハシ）', 300, 380, '#7d6047', pl); }
    // ape → human
    const up = seg(t, 36, 44);
    if (up > 0) { g.globalAlpha = CL(up * 2); g.fillStyle = 'rgba(60,45,35,.8)'; g.save(); g.translate(640, 590); g.rotate(L(0.5, 0, up)); g.beginPath(); g.ellipse(0, -80, 22, 60, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -160, 22, 0, 7); g.fill(); g.restore(); g.globalAlpha = 1; nameTag('直立二足歩行のための骨格と筋', 640, 330, '#3a9b69', seg(t, 38, 39) * (1 - seg(t, d - 12, d - 10))); }
    train(L(-800, 1400, seg(t, d - 14, d - 2)), 600, 3);
    haru(L(1000, 900, seg(t, d - 16, d - 12)), 590, 1, t);
    endCard('生命史線の夜行列車', t, d - 7);
    g.fillStyle = `rgba(20,10,0,${CL(seg(t, d - 3, d)) * 0.4})`; g.fillRect(0, 0, W, H);
    motes(t, 16, '255,230,190'); vignette(0.25, true);
  },
};
