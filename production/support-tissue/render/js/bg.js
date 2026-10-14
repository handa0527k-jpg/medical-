// 背景。どれも (ctx, t, o) で描く。o.cam はカメラの横ずれ（視差）。
import { W, H, clamp, lerp, rnd, rr, circle, ellipse, withAlpha, text, COLORS, wave } from './core.js';
import { drawCell } from './chars.js';

function sky(ctx, c1, c2, c3) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c1);
  g.addColorStop(0.6, c2);
  g.addColorStop(1, c3 || c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// 人体シティ：未来都市。ピンクの血管（交通網）を赤血球（配送車）が走る
export function city(ctx, t, o = {}) {
  const cam = o.cam || 0, warm = o.warm || 0;
  sky(ctx, warm ? '#ffb38a' : '#8fd3ff', warm ? '#ffd9a8' : '#dff3ff', warm ? '#fff0d6' : '#f6fbff');
  // 雲
  for (let i = 0; i < 7; i++) {
    const r = rnd(i + 3);
    const x = ((r() * 2400 - cam * 0.1 + t * 12 * (0.5 + r())) % 2400) - 240, y = 70 + r() * 220;
    withAlpha(ctx, 0.75, () => { ctx.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { ellipse(ctx, x + k * 50, y + Math.sin(k) * 10, 70, 32); ctx.fill(); } });
  }
  // 遠景のビル
  const layers = [[0.2, '#b9d7f2', 380, 1], [0.45, '#8db9e6', 470, 2], [0.75, '#6f9fd8', 560, 3]];
  if (warm) { layers[0][1] = '#f3c4a8'; layers[1][1] = '#d99c8a'; layers[2][1] = '#b77a7a'; }
  for (const [par, col, base, seed] of layers) {
    const r = rnd(seed * 17);
    let x = -((cam * par) % 300) - 300;
    while (x < W + 300) {
      const w = 80 + r() * 140, h = 160 + r() * 360 * (seed === 3 ? 1.1 : 0.8);
      ctx.fillStyle = col;
      rr(ctx, x, H - base - h + 380, w, h + 400, seed === 3 ? 16 : 10);
      ctx.fill();
      if (seed === 3) {
        // 窓
        ctx.fillStyle = warm ? 'rgba(255,230,160,0.8)' : 'rgba(230,248,255,0.75)';
        for (let yy = H - base - h + 410; yy < H - 120; yy += 42) for (let xx = x + 16; xx < x + w - 24; xx += 30) ctx.fillRect(xx, yy, 14, 20);
        // 丸い屋根
        circle(ctx, x + w / 2, H - base - h + 380, w * 0.32);
        ctx.fillStyle = col; ctx.fill();
      }
      x += w + 20 + r() * 50;
    }
  }
  // 血管の道（チューブ）
  const tubes = [[0.9, 600, 60, 0.0018, 90], [1.0, 360, 46, 0.0024, -60]];
  tubes.forEach(([par, y0, rad, fr, amp], k) => {
    const pts = [];
    for (let x = -60; x <= W + 60; x += 20) pts.push([x, y0 + Math.sin((x + cam * par) * fr + k) * amp]);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#d9576e'; ctx.lineWidth = rad * 2 + 10;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,190,0.95)'; ctx.lineWidth = rad * 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 8;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - rad * 0.55) : ctx.moveTo(x, y - rad * 0.55))); ctx.stroke();
    // 赤血球の配送車
    for (let i = 0; i < 7; i++) {
      const xx = ((i * 330 + t * (160 + k * 60) * (k ? -1 : 1) - cam * par) % (W + 400) + W + 400) % (W + 400) - 200;
      const yy = y0 + Math.sin((xx + cam * par) * fr + k) * amp;
      ctx.save(); ctx.translate(xx, yy); ctx.scale(0.9, 0.9);
      drawCell(ctx, 'rbc', { t, noBob: true });
      ctx.restore();
    }
  });
  // 地面（広場）
  const g = ctx.createLinearGradient(0, H - 200, 0, H);
  g.addColorStop(0, warm ? '#f2d7b8' : '#e9f1fb');
  g.addColorStop(1, warm ? '#e3bf98' : '#cfdcef');
  ctx.fillStyle = g;
  ctx.fillRect(0, H - 190, W, 190);
  ctx.strokeStyle = warm ? 'rgba(160,110,80,0.25)' : 'rgba(120,150,200,0.25)';
  ctx.lineWidth = 3;
  for (let i = -6; i < 20; i++) { const x = i * 160 - (cam % 160); ctx.beginPath(); ctx.moveTo(x, H - 190); ctx.lineTo(x - 120, H); ctx.stroke(); }
  // 遠くを歩く住人（小さな細胞）
  if (o.people !== false) {
    const kinds = ['fibro', 'macro', 'plasma', 'neutro'];
    for (let i = 0; i < 5; i++) {
      const dir = i % 2 ? 1 : -1;
      const x = (((i * 520 + t * 50 * dir - cam * 0.95) % (W + 400)) + W + 400) % (W + 400) - 200;
      ctx.save(); ctx.translate(x, H - 215 + (i % 3) * 8); ctx.scale(0.28 * dir, 0.28);
      withAlpha(ctx, 0.85, () => drawCell(ctx, kinds[i % 4], { t: t + i, plain: true }));
      ctx.restore();
    }
  }
}

// 建設現場（街づくり会社）
export function site(ctx, t, o = {}) {
  sky(ctx, '#9fdcff', '#e8f7ff', '#fffbe9');
  const cam = o.cam || 0;
  // クレーン
  for (let k = 0; k < 2; k++) {
    const x = 300 + k * 1200 - cam * 0.3;
    ctx.strokeStyle = '#f2b632'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(x, H - 160); ctx.lineTo(x, 170); ctx.lineTo(x + 420 * (k ? -1 : 1), 170); ctx.stroke();
    ctx.lineWidth = 4;
    for (let y = 190; y < H - 170; y += 50) { ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y + 50); ctx.stroke(); }
    const hx = x + (260 + 80 * Math.sin(t * 0.5 + k)) * (k ? -1 : 1);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx, 170); ctx.lineTo(hx, 330 + 30 * Math.sin(t * 0.7 + k)); ctx.stroke();
    ctx.fillStyle = k ? '#ef6d76' : '#8fc6f2';
    rr(ctx, hx - 50, 330 + 30 * Math.sin(t * 0.7 + k), 100, 60, 10); ctx.fill();
  }
  // 足場と組みかけのビル
  ctx.fillStyle = '#cfe0f2';
  for (let i = 0; i < 6; i++) { const x = 60 + i * 320 - cam * 0.5; rr(ctx, x, H - 520 + (i % 3) * 60, 220, 600, 14); ctx.fill(); }
  ctx.strokeStyle = 'rgba(120,140,170,0.5)'; ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) { const x = 60 + i * 320 - cam * 0.5; for (let y = H - 500; y < H; y += 70) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 220, y); ctx.stroke(); } }
  ctx.fillStyle = '#e8dcc6';
  ctx.fillRect(0, H - 180, W, 180);
  ctx.fillStyle = '#f2b632';
  for (let i = 0; i < 24; i++) { ctx.save(); ctx.translate(i * 90 - (cam % 90), H - 178); ctx.fillRect(0, 0, 45, 12); ctx.restore(); }
}

// 基質の中：透明なゼリーの世界（水分子が漂う）
export function ecm(ctx, t, o = {}) {
  const g = ctx.createRadialGradient(W * 0.55, H * 0.4, 100, W * 0.5, H * 0.5, 1300);
  g.addColorStop(0, '#e9fbff');
  g.addColorStop(0.5, '#b6ecf5');
  g.addColorStop(1, '#6fc4de');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 光の筋
  for (let i = 0; i < 6; i++) {
    withAlpha(ctx, 0.12 + 0.05 * Math.sin(t * 0.6 + i), () => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const x = 200 + i * 300 + Math.sin(t * 0.2 + i) * 60;
      ctx.moveTo(x, -10); ctx.lineTo(x + 120, -10); ctx.lineTo(x + 420, H + 10); ctx.lineTo(x + 260, H + 10);
      ctx.closePath(); ctx.fill();
    });
  }
  // 水分子と泡
  const n = o.water === undefined ? 60 : o.water;
  for (let i = 0; i < n; i++) {
    const r = rnd(i + 101);
    const x = (r() * W + Math.sin(t * 0.3 + i) * 40 + t * 8 * (r() - 0.5)) % W;
    const y = (r() * H - t * (10 + r() * 20) % H + H) % H;
    withAlpha(ctx, 0.55, () => water(ctx, x, y, 0.7 + r() * 0.6, t * (r() - 0.5) * 2 + i));
  }
  for (let i = 0; i < 24; i++) {
    const r = rnd(i + 900);
    const x = r() * W, y = (H + 50 - ((t * (30 + r() * 40) + r() * H) % (H + 100)));
    withAlpha(ctx, 0.5, () => { circle(ctx, x + Math.sin(t + i) * 10, y, 4 + r() * 10); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); });
  }
}
export function water(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  circle(ctx, 0, 0, 11); ctx.fillStyle = '#e8455a'; ctx.fill();
  circle(ctx, -11, 9, 6.5); circle(ctx, -11, 9, 6.5); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#9ab'; ctx.lineWidth = 1.5; ctx.stroke();
  circle(ctx, 11, 9, 6.5); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// 工場（線維芽細胞の中）。粗面小胞体の膜、リボソームの点、ベルトコンベア
export function factory(ctx, t, o = {}) {
  sky(ctx, '#ffe7ef', '#fff4f7', '#fde3ea');
  const cam = o.cam || 0;
  // 細胞膜のアーチ
  ctx.strokeStyle = 'rgba(214,96,138,0.35)'; ctx.lineWidth = 24;
  ctx.beginPath(); ctx.arc(W / 2 - cam * 0.2, H + 900, 1700, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  // rER の波打つ膜（奥）
  for (let k = 0; k < 4; k++) {
    ctx.strokeStyle = `rgba(200,110,150,${0.18 + k * 0.05})`; ctx.lineWidth = 16;
    ctx.beginPath();
    for (let x = -50; x < W + 50; x += 12) { const y = 170 + k * 46 + Math.sin((x + cam * 0.4) * 0.012 + k + t * 0.5) * 16; x < -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(150,60,110,0.5)';
    for (let x = -50; x < W + 50; x += 34) { const y = 170 + k * 46 + Math.sin((x + cam * 0.4) * 0.012 + k + t * 0.5) * 16 - 12; circle(ctx, x, y, 4); ctx.fill(); }
  }
  // 床とコンベア
  ctx.fillStyle = '#f3d6df'; ctx.fillRect(0, H - 210, W, 210);
  ctx.fillStyle = '#7d8696'; ctx.fillRect(0, H - 250, W, 26);
  ctx.fillStyle = '#5a6272';
  for (let x = -((t * 120 + cam) % 60); x < W; x += 60) { circle(ctx, x, H - 237, 9); ctx.fill(); }
}

// アリーナ（線維の対決）
export function arena(ctx, t, o = {}) {
  sky(ctx, '#20194a', '#3b2a7a', '#5e3a8f');
  for (let i = 0; i < 5; i++) {
    const a = -0.5 + i * 0.25 + Math.sin(t * 0.8 + i) * 0.15;
    withAlpha(ctx, 0.18, () => {
      ctx.fillStyle = ['#ff6a8a', '#7ad3ff', '#ffe066', '#9dff9d', '#ff9a3d'][i];
      ctx.beginPath(); ctx.moveTo(W / 2 + (i - 2) * 300, -20);
      ctx.lineTo(W / 2 + (i - 2) * 300 + Math.sin(a) * 1400 - 200, H); ctx.lineTo(W / 2 + (i - 2) * 300 + Math.sin(a) * 1400 + 200, H); ctx.closePath(); ctx.fill();
    });
  }
  // 観客席の点々
  for (let i = 0; i < 160; i++) { const r = rnd(i + 7); withAlpha(ctx, 0.5, () => { circle(ctx, r() * W, H - 330 + r() * 80 + Math.sin(t * 6 + i) * 3, 9); ctx.fillStyle = ['#ffd1dc', '#cde8ff', '#fff2b3'][i % 3]; ctx.fill(); }); }
  ctx.fillStyle = '#2a2350'; ctx.fillRect(0, H - 260, W, 260);
  ellipse(ctx, W / 2, H - 150, 900, 110); ctx.fillStyle = '#463a86'; ctx.fill();
  ctx.strokeStyle = '#ffd94a'; ctx.lineWidth = 6; ctx.stroke();
}

// 住人の広場（疎性結合組織の街）
export function plaza(ctx, t, o = {}) {
  sky(ctx, '#ffe9c9', '#fff6e8', '#fffaf2');
  // 背景に薄い線維（膠原・弾性）が走る
  for (let i = 0; i < 9; i++) {
    const r = rnd(i + 55);
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(80,80,90,0.18)' : 'rgba(230,110,120,0.22)';
    ctx.lineWidth = i % 3 === 0 ? 4 : 16;
    ctx.beginPath();
    const y0 = r() * H * 0.7;
    for (let x = -50; x < W + 50; x += 20) { const y = y0 + Math.sin(x * 0.006 + i + t * 0.2) * 60 + (x - W / 2) * (r() - 0.5) * 0.4; x < -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.fillStyle = '#f6dfc0'; ctx.fillRect(0, H - 200, W, 200);
  ctx.fillStyle = '#eccfa6';
  for (let i = 0; i < 14; i++) { ellipse(ctx, i * 150 + 40, H - 120 + (i % 2) * 40, 60, 14); ctx.fill(); }
}

// 倉庫（脂肪組織）：黄色いタンクがずらり
export function warehouse(ctx, t, o = {}) {
  sky(ctx, '#fff3d6', '#fffaf0', '#ffefd2');
  ctx.fillStyle = '#f1dcb2';
  ctx.fillRect(0, 0, W, 120);
  ctx.strokeStyle = 'rgba(160,120,60,0.25)'; ctx.lineWidth = 6;
  for (let x = 0; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 120); ctx.stroke(); }
  for (let i = 0; i < 7; i++) {
    const x = 140 + i * 280 - (o.cam || 0) * 0.4, y = H - 330;
    withAlpha(ctx, 0.55, () => {
      circle(ctx, x, y, 120); ctx.fillStyle = '#ffeaa0'; ctx.fill(); ctx.strokeStyle = '#d9b14a'; ctx.lineWidth = 6; ctx.stroke();
      ellipse(ctx, x - 40, y - 50, 30, 16, -0.6); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    });
  }
  ctx.fillStyle = '#e9cf9f'; ctx.fillRect(0, H - 190, W, 190);
}

// クイズ会場
export function quiz(ctx, t, o = {}) {
  sky(ctx, '#1d2c6b', '#2c4fae', '#3d6fd1');
  for (let i = 0; i < 40; i++) {
    const r = rnd(i + 300);
    const x = r() * W, y = r() * H * 0.6;
    withAlpha(ctx, 0.25 + 0.25 * Math.sin(t * 2 + i), () => { circle(ctx, x, y, 3 + r() * 4); ctx.fillStyle = '#fff'; ctx.fill(); });
  }
  // スポットライト
  for (const s of [-1, 1]) {
    withAlpha(ctx, 0.12, () => {
      ctx.fillStyle = '#fffbd0';
      ctx.beginPath(); ctx.moveTo(W / 2 + s * 800, -10); ctx.lineTo(W / 2 + s * 100 + Math.sin(t) * 80, H); ctx.lineTo(W / 2 + s * 500 + Math.sin(t) * 80, H); ctx.closePath(); ctx.fill();
    });
  }
  ctx.fillStyle = '#16205a'; ctx.fillRect(0, H - 170, W, 170);
  ctx.fillStyle = '#ffd94a';
  for (let i = 0; i < 30; i++) { circle(ctx, i * 68 + 20, H - 165, 7 + 2 * Math.sin(t * 5 + i)); ctx.fill(); }
}

// 上皮と基底膜の断面（シーン8の土台）
export function bmWorld(ctx, t, o = {}) {
  sky(ctx, '#e7f0ff', '#f5f8ff', '#fff6ef');
}

// やわらかい背景（図解を主役にするとき）
export function soft(ctx, t, c1 = '#eef6ff', c2 = '#ffffff') {
  sky(ctx, c1, c2, c2);
  for (let i = 0; i < 14; i++) {
    const r = rnd(i + 70);
    withAlpha(ctx, 0.35, () => { circle(ctx, (r() * W + t * 10 * (r() - 0.5)) % W, r() * H, 30 + r() * 90); ctx.fillStyle = '#ffffff'; ctx.fill(); });
  }
}
