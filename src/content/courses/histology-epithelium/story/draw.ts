/** Story anime「コウと揺れる街」: epithelial cells as houses, junctions as building parts. */
import type { SceneDraw } from '../../../../engine/story/types';
import {
  CL, EZ, H, L, W, chibi, clouds, endCard, face, g, grass, ground, hills, label, motes, nameTag, rr, row, seg, sky, stars, sun, titleCard, vignette, wind,
} from '../../../../engine/story/kit';

const HOUSE = ['#f6eee0', '#f3e7d6', '#f7f0e4', '#efe5d4', '#f5ecdc'];
/** an epithelial cell as a house; microvilli as a tuft on the roof, the nucleus as a round hearth */
function house(x: number, y: number, w: number, h: number, i: number, o: { t?: number; tilt?: number; night?: boolean; fill?: string } = {}) {
  g.save(); g.translate(x + w / 2, y + h); g.rotate(o.tilt || 0); g.translate(-w / 2, -h);
  g.fillStyle = 'rgba(40,30,20,.18)'; rr(6, 8, w, h, 22); g.fill();
  g.fillStyle = o.fill || HOUSE[i % HOUSE.length]; g.strokeStyle = '#6b5a48'; g.lineWidth = 2.5; rr(0, 0, w, h, 22); g.fill(); g.stroke();
  g.strokeStyle = '#d9776b'; g.lineWidth = 3; g.lineCap = 'round';
  for (let k = 0; k < 6; k++) { const sx = 14 + (k * (w - 28)) / 5, sw = Math.sin((o.t || 0) * 2 + k + i) * 3; g.beginPath(); g.moveTo(sx, 0); g.quadraticCurveTo(sx + sw, -9, sx + sw * 1.6, -16); g.stroke(); }
  g.fillStyle = o.night ? '#ffd27a' : '#cfe3ea'; g.strokeStyle = '#6b5a48'; g.lineWidth = 2;
  [[0.22, 0.26], [0.58, 0.26], [0.22, 0.5], [0.58, 0.5]].forEach(([fx, fy]) => { rr(w * fx, h * fy, w * 0.22, h * 0.14, 6); g.fill(); g.stroke(); });
  g.fillStyle = '#c99a8f'; g.beginPath(); g.ellipse(w * 0.5, h * 0.8, w * 0.17, h * 0.09, 0, 0, 7); g.fill();
  g.restore();
}

/* ---------- characters ---------- */
function kou(x: number, y: number, s: number, t: number, run = false) {
  chibi(x, y, s, t, {
    run, extra: (k) => {
      g.strokeStyle = '#d9776b'; g.lineWidth = 3;
      [-12, -2, 8].forEach((dx, j) => { g.beginPath(); g.moveTo(dx * k, -62 * k); g.quadraticCurveTo((dx + 3 * Math.sin(t * 3 + j)) * k, -72 * k, (dx + 5 * Math.sin(t * 3 + j)) * k, -78 * k); g.stroke(); });
    },
  });
}
function mitsu(x: number, y: number, s: number, t: number) {
  chibi(x, y, s, t, {
    body: '#e8f2fb', line: '#3f6f9e', hat: 'cap', hatCol: '#3f86d1', glow: 'rgba(120,190,255,.55)', happy: false,
    extra: (k) => { g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(0, -68 * k, 4 * k, 0, 7); g.fill(); g.strokeStyle = '#3f86d1'; g.lineWidth = 5 * k; g.beginPath(); g.moveTo(26 * k, -36 * k); g.lineTo(46 * k, -60 * k); g.stroke(); },
  });
}
function ado(x: number, y: number, s: number, t: number) {
  chibi(x, y, s, t, {
    body: '#f2f7ef', line: '#3c6f4f', hat: 'brim', hatCol: '#7a5a3a', bob: 2.4,
    extra: (k) => { g.strokeStyle = '#3a9b69'; g.lineWidth = 9 * k; g.beginPath(); g.moveTo(-24 * k, -56 * k); g.lineTo(24 * k, -16 * k); g.stroke(); g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(24 * k, -10 * k, 6 * k, 0, 7); g.fill(); },
  });
}
function dez(x: number, y: number, s: number, t: number) {
  g.save(); g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 4, 60 * s, 10 * s, 0, 0, 7); g.fill();
  g.fillStyle = '#8c8577'; g.strokeStyle = '#4a443a'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -60 * s, 52 * s, 62 * s, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#6f9a4f'; g.beginPath(); g.ellipse(-10 * s, -112 * s, 34 * s, 12 * s, -0.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(22 * s, -104 * s, 16 * s, 8 * s, 0.3, 0, 7); g.fill();
  g.fillStyle = '#b07a4a'; rr(-60 * s, -70 * s, 18 * s, 34 * s, 5 * s); g.fill(); rr(42 * s, -70 * s, 18 * s, 34 * s, 5 * s); g.fill();
  g.fillStyle = '#2b2622'; const bl = Math.sin(t * 0.9) > 0.97 ? 1 : 3.5; g.beginPath(); g.ellipse(-14 * s, -70 * s, 4 * s, bl * s, 0, 0, 7); g.ellipse(14 * s, -70 * s, 4 * s, bl * s, 0, 0, 7); g.fill();
  g.fillStyle = '#f7d6a0'; g.beginPath(); g.ellipse(24 * s, -122 * s + Math.sin(t * 5) * 2, 9 * s, 7 * s, 0, 0, 7); g.fill();
  g.fillStyle = '#2b2622'; g.beginPath(); g.arc(28 * s, -124 * s + Math.sin(t * 5) * 2, 1.6 * s, 0, 7); g.fill();
  g.restore();
}
function gyapu(x: number, y: number, s: number, t: number) {
  g.save(); g.translate(x, y + Math.sin(t * 3) * 6);
  const gl = g.createRadialGradient(0, -30 * s, 2, 0, -30 * s, 60 * s); gl.addColorStop(0, 'rgba(255,214,110,.75)'); gl.addColorStop(1, 'rgba(255,214,110,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, -30 * s, 60 * s, 0, 7); g.fill();
  g.fillStyle = '#fff6dc'; g.strokeStyle = '#a07a22'; g.lineWidth = 2; g.beginPath(); g.arc(0, -30 * s, 22 * s, 0, 7); g.fill(); g.stroke();
  face(0, -32 * s, s * 0.7, 0, true);
  g.strokeStyle = '#a07a22'; g.beginPath(); g.moveTo(24 * s, -20 * s); g.lineTo(36 * s, -4 * s); g.stroke();
  g.fillStyle = '#ffd66e'; g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; g.lineTo(38 * s + Math.cos(a) * 9 * s, 6 * s + Math.sin(a) * 9 * s); } g.fill();
  g.restore();
}

/* ---------- scenes ---------- */
const STREET = row(7, 120, 128, 14);
export const DRAW: Record<string, SceneDraw> = {
  morning(t) {
    sky('#8fc1d8', '#cfe5e8', '#f6e6c4'); sun(1040, 150 - t * 2, 46, '#fff4cf'); clouds(t, '#ffffff', 0.92); hills('#9cc28a', '#86b274', 470); ground(560);
    const cam = EZ(seg(t, 0, 9));
    g.save(); g.translate(0, L(-30, 0, cam));
    STREET.forEach((x, i) => house(x, 330 - (i % 3) * 14, 128, 230 + (i % 3) * 14, i, { t }));
    g.restore(); grass(560, t, 1); motes(t); wind(t, 0.6);
    if (t > 13) {
      kou(482, 556, 1, t); nameTag('コウ（僕）', 482, 450, '#d57f45', seg(t, 13, 14));
      // morning coffee
      const a = seg(t, 35, 36); if (a > 0) { g.globalAlpha = a; g.fillStyle = '#fffaf0'; rr(512, 520, 22, 24, 5); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(518 + k * 9, 516); g.quadraticCurveTo(514 + k * 9 + Math.sin(t * 2 + k) * 4, 504, 520 + k * 9, 492); g.stroke(); } g.globalAlpha = 1; }
    }
    titleCard('コウと揺れる街', '組織学「上皮組織」より ― 細胞間結合装置と基底面', t);
    vignette(0.25);
  },
  shake(t, d) {
    const k = seg(t, 1, 3) * (1 - seg(t, d - 14, d - 8)); const sh = Math.sin(t * 38) * 6 * k;
    sky('#b9c8b6', '#e3dcc0', '#f0d6a6'); clouds(t * 2, '#f7f1e2', 0.85); hills('#a0b67f', '#8aa36c', 470);
    g.save(); g.translate(sh, Math.cos(t * 31) * 3 * k); ground(560);
    const gap = seg(t, 3, 12) * 26;
    STREET.forEach((x, i) => house(x + (i - 3) * gap, 330 - (i % 3) * 14, 128, 230 + (i % 3) * 14, i, { t, tilt: Math.sin(t * 9 + i) * 0.03 * k + (i - 3) * 0.012 * seg(t, 3, 12) }));
    g.restore(); grass(560, t, 2.4); wind(t, 1.6, 'rgba(255,248,225,.75)');
    // the three junction layers, introduced from the top
    const lay = [['密着帯', '#3f86d1'], ['接着帯', '#3a9b69'], ['デスモソーム', '#9b6c43']] as const;
    lay.forEach(([n, c], j) => nameTag(n, 1120, 140 + j * 50, c, seg(t, d - 16 + j * 1.2, d - 15 + j * 1.2)));
    kou(L(500, 1150, seg(t, d - 10, d)), 556, 1, t, t > d - 10);
    for (let i = 0; i < 30 * k; i++) { g.fillStyle = `rgba(170,140,100,${0.25 * k})`; g.beginPath(); g.arc((i * 151 + t * 120) % W, 520 + ((i * 17) % 50), 4 + (i % 4), 0, 7); g.fill(); }
    vignette(0.32, true);
  },
  tj(t) {
    sky('#9cc7dd', '#d8eaee', '#eef0dc'); clouds(t, '#ffffff', 0.85);
    house(140, 210, 430, 640, 0, { t }); house(710, 210, 430, 640, 2, { t });
    const seal = EZ(seg(t, 25, 31));
    g.fillStyle = '#2d3a35'; g.fillRect(570, 210, 140, 510);
    g.save(); g.shadowColor = 'rgba(90,170,255,.9)'; g.shadowBlur = 24 * seal; g.fillStyle = `rgba(80,150,230,${0.25 + 0.7 * seal})`; rr(560, 214, 160, L(0, 120, seal), 14); g.fill(); g.restore();
    // zipper teeth: occludin / claudin
    g.strokeStyle = 'rgba(230,245,255,.85)'; g.lineWidth = 2;
    for (let k = 0; k < 5; k++) { if (seal * 5 < k) break; g.beginPath(); g.moveTo(575, 232 + k * 20); for (let x = 575; x <= 705; x += 26) g.lineTo(x, 232 + k * 20 + ((x / 26) % 2 ? 6 : -6)); g.stroke(); }
    for (let i = 0; i < 14; i++) { const p = (t * 0.5 + i / 14) % 1; const x = L(380, 640, p); let y = L(120, 212, p); if (seal > 0.6 && p > 0.8) y = 212 - (p - 0.8) * 300; g.fillStyle = 'rgba(214,170,90,.9)'; g.beginPath(); g.arc(x + (i % 3) * 18, y, 5, 0, 7); g.fill(); }
    mitsu(980, 200, 1.3, t); nameTag('防壁隊のミツ', 980, 70, '#3f86d1', seg(t, 0.5, 1.5));
    kou(330, 640, 1, t);
    if (seal > 0.5) nameTag('オクルディン・クローディン', 640, 370, '#3f86d1', seg(t, 37, 38));
    const b = seg(t, 59, 60);
    if (b > 0) {
      g.globalAlpha = b; g.font = '600 24px "Klee One", sans-serif'; g.fillStyle = '#3f86d1'; g.fillText('屋根側（頂上）', 190, 300); g.fillStyle = '#7d5aa8'; g.fillText('床側（基底外側）', 190, 520);
      g.strokeStyle = '#3f86d1'; g.setLineDash([8, 8]); g.lineWidth = 3; g.beginPath(); g.moveTo(150, 336); g.lineTo(560, 336); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
    motes(t, 14, '200,230,255'); label('タイトジャンクション ＝ 壁のコーキング', t, '#3f86d1'); vignette(0.22);
  },
  aj(t) {
    sky('#a8d0c8', '#e2eedd', '#f4ecd2'); clouds(t, '#ffffff', 0.8); hills('#9cc28a', '#86b274', 520);
    const xs = [160, 470, 780];
    xs.forEach((x, i) => house(x, 160, 270, 560, i, { t }));
    const pil = seg(t, 52, 53);
    g.strokeStyle = `rgba(214,110,120,${0.25 + 0.5 * pil})`; g.lineWidth = 5; xs.forEach((x) => [x + 26, x + 244].forEach((px) => { g.beginPath(); g.moveTo(px, 200); g.lineTo(px, 700); g.stroke(); }));
    const tie = EZ(seg(t, 19, 27));
    g.strokeStyle = '#3a9b69'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(150, 330); g.lineTo(L(150, 1060, tie), 330); g.stroke();
    g.strokeStyle = '#2f7e55'; g.lineWidth = 3; g.beginPath(); g.moveTo(150, 322); g.lineTo(L(150, 1060, tie), 322); g.stroke();
    g.fillStyle = '#5b9fd6'; rr(150, 190, 910, 22, 10); g.fill();
    [430, 740].forEach((cx, k) => {
      const on = seg(t, 43 + k * 2, 44 + k * 2);
      g.save(); g.shadowColor = '#ffe08a'; g.shadowBlur = 22 * on + 6 * Math.sin(t * 3) * on; g.fillStyle = on ? '#ffe08a' : '#cdbf9a'; g.beginPath(); g.arc(cx + 20, 330, 14, 0, 7); g.fill(); g.restore();
      g.fillStyle = '#2b2622'; g.font = '600 16px "Klee One", sans-serif'; g.globalAlpha = on; g.fillText('カルシウム', cx - 14, 372); g.globalAlpha = 1;
    });
    const ax = L(-60, 300, seg(t, 0, 3));
    ado(ax, 690, 1.4, t); nameTag('帯職人アド', ax, 520, '#3a9b69', seg(t, 0.5, 1.5));
    kou(1180, 712, 1, t);
    nameTag('カドヘリンのベルト', 610, 280, '#3a9b69', seg(t, 33, 34));
    nameTag('アクチン線維（家の柱）', 1000, 560, '#d66e78', pil);
    // a few music notes from the whistle
    for (let i = 0; i < 3; i++) { const p = (t * 0.3 + i / 3) % 1; g.globalAlpha = Math.sin(p * Math.PI) * 0.8; g.fillStyle = '#2f7e55'; g.font = '600 26px serif'; g.fillText('♪', ax + 30 + p * 60, 560 - p * 90); } g.globalAlpha = 1;
    grass(706, t, 1); motes(t, 12); label('アドヘレンスジャンクション ＝ 太いベルト', t, '#3a9b69'); vignette(0.22);
  },
  ds(t, d) {
    const gust = seg(t, 0, 2) * (1 - seg(t, d - 8, d - 4));
    sky('#7fa9bd', '#c6d6d3', '#e9dfc4'); clouds(t * 3, '#eef3f3', 0.9); hills('#8fb27c', '#7a9d68', 520);
    const bolt = seg(t, 19, 23);
    const sway = Math.sin(t * 3.3) * 0.03 * gust * (1 - bolt * 0.8);
    house(120, 140, 360, 580, 1, { t, tilt: sway }); house(800, 140, 360, 580, 3, { t, tilt: sway });
    [300, 430, 560].forEach((y, k) => {
      const on = seg(t, 19 + k * 0.8, 20 + k * 0.8); if (!on) return;
      g.globalAlpha = on; g.fillStyle = '#9b6c43'; rr(470, y - 30, 20, 60, 6); g.fill(); rr(790, y - 30, 20, 60, 6); g.fill();
      g.strokeStyle = '#5d6168'; g.lineWidth = 9; g.beginPath(); g.moveTo(490, y); g.lineTo(790, y); g.stroke(); g.fillStyle = '#7d828a'; g.beginPath(); g.arc(490, y, 11, 0, 7); g.arc(790, y, 11, 0, 7); g.fill();
      const wire = seg(t, 36, 38);
      g.strokeStyle = '#d9b24a'; g.lineWidth = 3; g.globalAlpha = on * (0.3 + 0.7 * wire);
      for (let r = 0; r < 3; r++) {
        g.beginPath(); g.moveTo(470, y - 18 + r * 12); g.bezierCurveTo(330, y - 70 + r * 20, 320, y + 60, 470, y - 8 + r * 12); g.stroke();
        g.beginPath(); g.moveTo(810, y - 18 + r * 12); g.bezierCurveTo(950, y - 70 + r * 20, 960, y + 60, 810, y - 8 + r * 12); g.stroke();
      }
      g.globalAlpha = 1;
    });
    dez(640, 712, 1.25 + 0.05 * bolt, t); nameTag('鉄壁ガードのデズ', 640, 520, '#9b6c43', seg(t, 9, 10));
    nameTag('プラーク', 480, 230, '#9b6c43', seg(t, 36, 37));
    nameTag('ケラチン線維（ワイヤー）', 250, 200, '#c99a2a', seg(t, 39, 40));
    kou(1180, 712, 0.9, t);
    grass(714, t, 3 * gust + 0.5); wind(t, 2.2 * gust + 0.2, 'rgba(255,255,255,.8)'); label('デスモソーム ＝ 鉄のボルト', t, '#9b6c43'); vignette(0.28);
  },
  gj(t, d) {
    const dusk = seg(t, 0, d * 0.6);
    sky(`rgb(${L(120, 52, dusk)},${L(150, 70, dusk)},${L(190, 120, dusk)})`, `rgb(${L(240, 200, dusk)},${L(200, 140, dusk)},${L(170, 140, dusk)})`, '#f1b778');
    sun(980, L(340, 470, dusk), 40, '#ffcf7a', 1 - dusk * 0.4); clouds(t, '#ffd9b0', 0.6); hills('#6f8d5c', '#5d7a4c', 520);
    const xs = [100, 400, 700, 1000];
    xs.forEach((x, i) => house(x, 220, 200, 500, i, { t, night: t > 4 + i * 1.5 }));
    const on = EZ(seg(t, 23, 29));
    for (let k = 0; k < 3; k++) {
      const x1 = xs[k] + 200, x2 = xs[k + 1];
      [330, 380].forEach((y, j) => {
        g.strokeStyle = 'rgba(214,162,36,.9)'; g.lineWidth = 10; g.beginPath(); g.moveTo(x1 - 6, y); g.lineTo(L(x1 - 6, x2 + 6, on), y); g.stroke();
        g.strokeStyle = '#3d2f12'; g.lineWidth = 3; g.beginPath(); g.moveTo(x1 - 6, y); g.lineTo(L(x1 - 6, x2 + 6, on), y); g.stroke();
        if (on > 0.99) for (let b = 0; b < 3; b++) { const p = (t * 0.8 + b / 3 + j * 0.5 + k * 0.2) % 1; g.save(); g.shadowColor = '#ffe08a'; g.shadowBlur = 14; g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(L(x1, x2, p), y, 5, 0, 7); g.fill(); g.restore(); }
      });
    }
    nameTag('コネクソン（コネクシン×6）', 350, 450, '#d6a224', seg(t, 30, 31));
    if (t > 43) { const p = seg(t, 43, 46); g.fillStyle = '#c9884f'; rr(L(560, 590, p), 300, 70, 54, 8); g.fill(); g.strokeStyle = '#6b4a2a'; g.lineWidth = 2; g.stroke(); nameTag('大きな荷物は通れない', 640, 250, '#d6a224', seg(t, 44, 45)); }
    const gx = L(1280, 660, seg(t, 6, 9));
    gyapu(gx, 520, 1.3, t); nameTag('通信係ギャプ', gx, 420, '#d6a224', seg(t, 8, 9));
    kou(260, 714, 0.9, t);
    grass(718, t, 0.8, 140, '#3d5f30'); motes(t, 30, '255,220,140'); label('ギャップ結合 ＝ 通信ケーブル', t, '#d6a224'); vignette(0.3, true);
  },
  base(t) {
    const cam = EZ(seg(t, 4, 12));
    g.save(); g.translate(0, L(0, -260, cam));
    sky('#26314a', '#3a4660', '#4d5468'); stars(t, 60); hills('#3f5a46', '#34503d', 360);
    const xs = [160, 410, 660, 910];
    xs.forEach((x, i) => house(x, 140, 210, 310, i, { t, night: true }));
    const gr = g.createLinearGradient(0, 450, 0, 980); gr.addColorStop(0, '#4f6b3c'); gr.addColorStop(0.06, '#6b5240'); gr.addColorStop(1, '#2a1f17'); g.fillStyle = gr; g.fillRect(0, 450, W, 560);
    const wake = seg(t, 17, 19);
    g.save(); g.globalAlpha = 0.9; g.fillStyle = '#4d3b2c'; g.beginPath(); g.ellipse(640, 820, 520, 170, 0, 0, 7); g.fill();
    g.fillStyle = '#5f8a44'; for (let i = 0; i < 18; i++) { g.beginPath(); g.ellipse(180 + i * 52, 680 + Math.sin(i) * 10, 30, 10, Math.sin(i), 0, 7); g.fill(); }
    [540, 740].forEach((ex) => { g.fillStyle = `rgba(255,236,170,${wake})`; g.shadowColor = '#ffe9a8'; g.shadowBlur = 30 * wake; g.beginPath(); g.ellipse(ex, 800, 26, L(2, 16, wake), 0, 0, 7); g.fill(); });
    g.restore(); g.shadowBlur = 0;
    const reach = EZ(seg(t, 24, 30));
    xs.forEach((x) => [x + 60, x + 150].forEach((ax) => {
      g.strokeStyle = '#b06a5a'; g.lineWidth = 7; g.beginPath(); g.moveTo(ax, 450); g.lineTo(ax, L(450, 520, reach)); g.stroke();
      g.strokeStyle = '#3a9b69'; g.lineWidth = 4; if (reach > 0.9) [-12, 0, 12].forEach((dd) => { g.beginPath(); g.moveTo(ax, 520); g.quadraticCurveTo(ax + dd, 540, ax + dd * 1.5, 556); g.stroke(); });
      g.strokeStyle = `rgba(217,178,74,${0.3 + 0.6 * seg(t, 45, 47)})`; g.lineWidth = 3; g.beginPath(); g.moveTo(ax, 446); g.bezierCurveTo(ax - 30, 380, ax + 30, 360, ax + 10, 320); g.stroke();
    }));
    g.strokeStyle = 'rgba(255,240,210,.35)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 560 + i * 12); for (let x = 0; x <= W; x += 40) g.lineTo(x, 560 + i * 12 + 5 * Math.sin(x / 50 + i)); g.stroke(); }
    kou(L(80, 120, cam), L(440, 640, cam), 0.9, t);
    g.restore();
    nameTag('大地の精霊バサ（基底膜）', 640, 700, '#7d6047', seg(t, 11, 12));
    nameTag('ヘミデスモゾーム（錨）', 330, 170, '#b06a5a', seg(t, 27, 28));
    nameTag('インテグリンの手 → ラミニン・IV型コラーゲン', 860, 330, '#3a9b69', seg(t, 34, 35));
    motes(t, 16, '255,236,170'); label('基底面 ＝ 大地に打った錨', t, '#7d6047'); vignette(0.34);
  },
  sunset(t, d) {
    sky('#e9a07a', '#f3c58d', '#f8e2b2'); sun(640, 470 + t * 1.0, 70, '#ffd27a'); clouds(t * 0.6, '#ffd8c0', 0.75); hills('#b58c5c', '#9a7a52', 470); ground(560, '#6a4c36');
    STREET.forEach((x, i) => house(x, 330 - (i % 3) * 14, 128, 230 + (i % 3) * 14, i, { t, night: true }));
    const show = (k: number) => seg(t, 29.5 + k * 2, 30.5 + k * 2);
    g.globalAlpha = show(0); g.fillStyle = '#5b9fd6'; rr(110, 312, 980, 10, 5); g.fill();
    g.globalAlpha = show(1); g.fillStyle = '#3a9b69'; rr(110, 340, 980, 10, 5); g.fill();
    g.globalAlpha = show(2); g.fillStyle = '#9b6c43'; STREET.slice(1).forEach((x) => { g.beginPath(); g.arc(x - 7, 420, 7, 0, 7); g.fill(); });
    g.globalAlpha = show(3); g.strokeStyle = '#d6a224'; g.lineWidth = 5; STREET.slice(1).forEach((x) => { g.beginPath(); g.moveTo(x - 20, 470); g.lineTo(x + 6, 470); g.stroke(); });
    g.globalAlpha = show(4); g.strokeStyle = '#b06a5a'; g.lineWidth = 5; STREET.forEach((x) => [x + 30, x + 98].forEach((ax) => { g.beginPath(); g.moveTo(ax, 560); g.lineTo(ax, 580); g.stroke(); }));
    g.globalAlpha = 1;
    grass(560, t, 0.6, 140, '#7d6b3d'); motes(t, 20, '255,210,150');
    kou(640, 316, 0.9, t);
    const ppl: [typeof mitsu, number, number, number][] = [[mitsu, 150, 640, 0.75], [ado, 330, 640, 0.75], [dez, 820, 650, 0.6], [gyapu, 1050, 640, 0.75]];
    ppl.forEach(([f, x, y, s], k) => { const a = seg(t, 19 + k * 0.6, 20 + k * 0.6); if (a > 0) { g.globalAlpha = a; f(x, y, s, t); g.globalAlpha = 1; } });
    // a single cold beer on the window sill, at the very end
    const beer = seg(t, d - 11, d - 10); if (beer > 0) { g.globalAlpha = beer; g.fillStyle = '#e8b44a'; rr(1120, 520, 26, 40, 5); g.fill(); g.fillStyle = '#fffaf0'; rr(1120, 514, 26, 10, 4); g.fill(); g.globalAlpha = 1; }
    endCard('コウと揺れる街', t, d - 7);
    g.fillStyle = `rgba(20,10,0,${CL(seg(t, d - 3, d)) * 0.4})`; g.fillRect(0, 0, W, H);
    vignette(0.32, true);
  },
};
