// 組織の図（模式図）。講義資料の図の構造に合わせた描き方：
//   疎性結合組織＝まばらで不規則な線維・多い組織液・固定細胞と自由細胞
//   密性不規則性＝膠原線維が不規則／密性規則性＝膠原線維が規則的（腱・靭帯）
import { rr, circle, ellipse, rnd, clamp, lerp, withAlpha, text, COLORS } from './core.js';

function clipBox(ctx, x, y, w, h, r, fn) {
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  fn();
  ctx.restore();
}

export function spindle(ctx, x, y, L, Wd, ang, fill, nuc) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-L, 0);
  ctx.quadraticCurveTo(0, -Wd, L, 0);
  ctx.quadraticCurveTo(0, Wd, -L, 0);
  ctx.fillStyle = fill;
  ctx.fill();
  ellipse(ctx, 0, 0, L * 0.32, Wd * 0.42);
  ctx.fillStyle = nuc;
  ctx.fill();
  ctx.restore();
}

function wavyLine(ctx, x0, y0, x1, y1, amp, freq, ph, width, color) {
  const n = 40, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const k = i / n, o = Math.sin(k * freq * Math.PI * 2 + ph) * amp;
    const x = x0 + dx * k + nx * o, y = y0 + dy * k + ny * o;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();
}

export function capillary(ctx, x, y, r, t) {
  circle(ctx, x, y, r);
  ctx.fillStyle = '#f7c6cf'; ctx.fill();
  ctx.lineWidth = r * 0.22; ctx.strokeStyle = '#d97a8c'; ctx.stroke();
  ellipse(ctx, x - r * 0.75, y, r * 0.18, r * 0.42); ctx.fillStyle = '#9d3f63'; ctx.fill();
  ellipse(ctx, x + Math.sin(t) * r * 0.15, y + r * 0.1, r * 0.45, r * 0.3); ctx.fillStyle = '#e2414f'; ctx.fill();
}

// 疎性結合組織
export function looseCT(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = o.bg || '#fdf3f6';
    ctx.fillRect(x, y, w, h);
    const r = rnd(o.seed || 5);
    const nCol = o.dense ? 30 : 8;
    for (let i = 0; i < nCol; i++) {
      const a = r() * Math.PI, cx = x + r() * w, cy = y + r() * h, L = 260 + r() * 300;
      wavyLine(ctx, cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L, 7, 3 + r() * 2, t * 0.5 + i, o.dense ? 22 : 15, o.dense ? '#e98a96' : '#f0a3ad');
    }
    if (!o.dense) for (let i = 0; i < 6; i++) {
      const a = r() * Math.PI, cx = x + r() * w, cy = y + r() * h, L = 200 + r() * 260;
      ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * L, cy - Math.sin(a) * L); ctx.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      ctx.lineWidth = 3; ctx.strokeStyle = '#5b4a6e'; ctx.stroke();
    }
    const nCells = o.dense ? 6 : 9;
    for (let i = 0; i < nCells; i++) spindle(ctx, x + r() * w, y + r() * h, 34, 12, r() * Math.PI, '#d7a0d6', '#7d3b8a');
    if (o.free !== false && !o.dense) {
      for (let i = 0; i < 3; i++) { const cx = x + r() * w, cy = y + r() * h; circle(ctx, cx, cy, 16); ctx.fillStyle = '#c7b3f0'; ctx.fill(); circle(ctx, cx + 5, cy - 3, 7); ctx.fillStyle = '#5b3a99'; ctx.fill(); }
      const cx = x + r() * w, cy = y + r() * h; circle(ctx, cx, cy, 20); ctx.fillStyle = '#d58ce0'; ctx.fill();
      for (let k = 0; k < 10; k++) { circle(ctx, cx + Math.cos(k) * 11, cy + Math.sin(k * 1.7) * 11, 3); ctx.fillStyle = '#7b2a8f'; ctx.fill(); }
    }
    if (o.capillary) capillary(ctx, x + w * 0.72, y + h * 0.62, 34, t);
  });
}

// 密性不規則性結合組織
export function denseIrregular(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = '#fbe4e8'; ctx.fillRect(x, y, w, h);
    const r = rnd(o.seed || 9);
    for (let i = 0; i < 36; i++) {
      const a = r() * Math.PI, cx = x + r() * w, cy = y + r() * h, L = 90 + r() * 140;
      wavyLine(ctx, cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L, 5, 2, t * 0.4 + i, 26, i % 2 ? '#e2707f' : '#ea8c99');
    }
    for (let i = 0; i < 7; i++) spindle(ctx, x + r() * w, y + r() * h, 24, 7, r() * Math.PI, '#b06aa8', '#5d2a6e');
  });
}

// 密性規則性結合組織（tension: 0..1 で引っぱられた様子）
export function denseRegular(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = '#fbe4e8'; ctx.fillRect(x, y, w, h);
    const ten = o.tension || 0;
    const rows = 9;
    for (let i = 0; i < rows; i++) {
      const yy = y + (i + 0.5) * h / rows;
      wavyLine(ctx, x - 20, yy, x + w + 20, yy, 6 * (1 - ten), 5, i * 0.7, h / rows * 0.78, i % 2 ? '#e2707f' : '#ea8c99');
      if (i < rows - 1) {
        for (let k = 0; k < 4; k++) {
          const xx = x + ((k + 0.5) * w / 4 + (i % 2) * 40);
          ellipse(ctx, xx, yy + h / rows / 2, 26, 4.5); ctx.fillStyle = '#5d2a6e'; ctx.fill();
        }
      }
    }
  });
}

// 膠様組織（寒天状、突起の長い線維芽細胞）
export function gelatinous(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = '#eaf6fb'; ctx.fillRect(x, y, w, h);
    const r = rnd(o.seed || 21);
    for (let i = 0; i < 10; i++) { const a = r() * Math.PI, cx = x + r() * w, cy = y + r() * h, L = 120 + r() * 120; wavyLine(ctx, cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L, 4, 3, i, 2.5, '#9aa9b8'); }
    for (let i = 0; i < 6; i++) {
      const cx = x + r() * w, cy = y + r() * h;
      ctx.strokeStyle = '#6d5a7d'; ctx.lineWidth = 3;
      for (let k = 0; k < 4; k++) { const a = r() * Math.PI * 2, L = 50 + r() * 60; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + Math.cos(a + 0.4) * L * 0.5, cy + Math.sin(a + 0.4) * L * 0.5, cx + Math.cos(a) * L, cy + Math.sin(a) * L); ctx.stroke(); }
      ellipse(ctx, cx, cy, 10, 6, r() * 3); ctx.fillStyle = '#4a3a5a'; ctx.fill();
    }
  });
}

// 細網組織（鍍銀で黒い網、細網細胞、すき間を満たす血球系の細胞）
export function reticularTissue(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = '#eef0fb'; ctx.fillRect(x, y, w, h);
    const r = rnd(o.seed || 31);
    const pts = [];
    for (let i = 0; i < 26; i++) pts.push([x + r() * w, y + r() * h]);
    if (o.cells !== false) for (let i = 0; i < 40; i++) { circle(ctx, x + r() * w, y + r() * h, 9); ctx.fillStyle = '#c9b8e6'; ctx.fill(); circle(ctx, x + r() * w, y + r() * h, 6); ctx.fillStyle = '#e59aa4'; ctx.fill(); }
    ctx.strokeStyle = '#25262d'; ctx.lineWidth = 3.5;
    pts.forEach(([px, py], i) => {
      const near = pts.map((q, j) => [Math.hypot(q[0] - px, q[1] - py), j]).sort((a, b) => a[0] - b[0]).slice(1, 4);
      for (const [, j] of near) { ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo((px + pts[j][0]) / 2 + 10, (py + pts[j][1]) / 2 - 10, pts[j][0], pts[j][1]); ctx.stroke(); }
    });
    pts.slice(0, 9).forEach(([px, py]) => { ellipse(ctx, px, py, 14, 9); ctx.fillStyle = '#f2c94c'; ctx.fill(); ctx.strokeStyle = '#7a5c12'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#25262d'; });
  });
}

// 脂肪組織（HE 標本風：白く抜けた多角形の細胞）。frozen=true でオイルレッドの赤い脂肪滴
export function adiposeTissue(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = o.frozen ? '#f4e9ee' : '#f7e6ee'; ctx.fillRect(x, y, w, h);
    const r = rnd(o.seed || 41);
    const cs = 64;
    for (let j = -1; j < h / cs + 1; j++) for (let i = -1; i < w / cs + 1; i++) {
      const cx = x + i * cs + (j % 2) * cs / 2 + (r() - 0.5) * 10, cy = y + j * cs * 0.88 + (r() - 0.5) * 10;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; const rr2 = cs * 0.54 + (r() - 0.5) * 6; ctx.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); }
      ctx.closePath();
      ctx.fillStyle = o.frozen ? '#e8302e' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#d58fb0'; ctx.stroke();
      if (r() < 0.35) { ellipse(ctx, cx + cs * 0.4, cy, 5, 12, 0.2); ctx.fillStyle = '#6b2f78'; ctx.fill(); }
    }
  });
}

// 上皮・基底膜・結合組織の断面（講義資料の最初の図）
export function epiCross(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = '#fdf5f7'; ctx.fillRect(x, y, w, h);
    const eh = o.epiH || 110;
    const n = Math.round(w / 70);
    for (let i = 0; i < n; i++) {
      const cx = x + (i + 0.5) * w / n;
      rr(ctx, cx - w / n / 2 + 3, y + 10, w / n - 6, eh, 10);
      ctx.fillStyle = o.hiEpi ? `rgba(120,170,255,${0.35 + 0.25 * o.hiEpi})` : '#dfe3ee';
      ctx.fill(); ctx.strokeStyle = '#9aa3b8'; ctx.lineWidth = 2; ctx.stroke();
      circle(ctx, cx, y + 10 + eh * 0.55, 14); ctx.fillStyle = '#545d7a'; ctx.fill();
    }
    // 基底膜
    ctx.fillStyle = o.hiBM ? '#ff9f43' : '#b9b2d6';
    ctx.fillRect(x, y + eh + 12, w, 8);
    // 結合組織
    looseCT(ctx, x, y + eh + 20, w, h - eh - 20, t, { r: 0, seed: o.seed || 7, capillary: true, bg: o.hiECM ? `rgba(255,236,170,${0.6 + 0.4 * o.hiECM})` : '#fdf3f6' });
  });
}

// 腱の横断面：膠原線維の束（細線維の点の集まり）の間で押しつぶされた線維芽細胞＝翼細胞
export function tendonCross(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = '#f1e4ea'; ctx.fillRect(x, y, w, h);
    const r = rnd(12);
    const cells = [[0.28, 0.32], [0.7, 0.3], [0.5, 0.68], [0.15, 0.8], [0.88, 0.72]];
    for (const [cx0, cy0] of cells) {
      const cx = x + cx0 * w, cy = y + cy0 * h, R = Math.min(w, h) * 0.24;
      ctx.beginPath();
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const rr2 = R * (0.85 + r() * 0.25); ctx.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); }
      ctx.closePath(); ctx.fillStyle = '#efc4cf'; ctx.fill(); ctx.strokeStyle = '#e39a3a'; ctx.lineWidth = 4; ctx.stroke();
      for (let k = 0; k < 120; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.8; circle(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2.2); ctx.fillStyle = '#c4617a'; ctx.fill(); }
    }
    // 翼細胞（束のすき間で、細胞質が薄く押しつぶされた星形）
    const p = o.hi || 0;
    const fx = x + w * 0.5, fy = y + h * 0.43;
    ctx.beginPath();
    const arms = [[-0.5, 0.22], [0.0, 0.18], [0.6, 0.2], [2.2, 0.18], [3.3, 0.2], [1.5, 0.16]];
    arms.forEach(([a, L], i) => { ctx.lineTo(fx + Math.cos(a) * w * L, fy + Math.sin(a) * h * L * 1.2); ctx.lineTo(fx + Math.cos(a + 0.5) * 22, fy + Math.sin(a + 0.5) * 22); });
    ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = p ? `rgba(40,90,230,${0.6 + 0.4 * Math.sin(t * 5)})` : '#3a5fd6'; ctx.lineWidth = 5; ctx.stroke();
    ellipse(ctx, fx, fy, 22, 14); ctx.fillStyle = '#2a2f4a'; ctx.fill();
  });
}

// 間葉（細胞がまばらな胎児性組織）
export function mesenchyme(ctx, x, y, w, h, t, o = {}) {
  clipBox(ctx, x, y, w, h, o.r ?? 20, () => {
    ctx.fillStyle = '#f2f5ff'; ctx.fillRect(x, y, w, h);
    const r = rnd(o.seed || 61);
    for (let i = 0; i < 9; i++) {
      const cx = x + r() * w, cy = y + r() * h;
      ctx.strokeStyle = '#8b7fb0'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) { const a = k * 1.6 + r(), L = 40 + r() * 30; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); ctx.stroke(); }
      circle(ctx, cx, cy, 16); ctx.fillStyle = '#b4a8d6'; ctx.fill();
      circle(ctx, cx, cy, 8); ctx.fillStyle = '#4f4277'; ctx.fill();
    }
  });
}
