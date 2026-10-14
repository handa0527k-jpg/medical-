// 共通：数学・イージング・文字・UI部品。すべて「時刻 t の純関数」で描く（コマを並行・順不同に描けるように）。
export const W = 1920, H = 1080;
export const FONT = "'MR', 'IPAPGothic', sans-serif";

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = (k) => (k = clamp(k), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const easeIn = (k) => Math.pow(clamp(k), 2.4);
export const back = (k) => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
export const elastic = (k) => { k = clamp(k); return k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI) / 3) + 1; };
export const wave = (t, f = 1, ph = 0) => Math.sin((t * f + ph) * Math.PI * 2);

// 種つき乱数（同じ種なら毎回同じ値）
export function rnd(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
}
export const hash = (x) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export const COLORS = {
  ink: '#1f2a44', sub: '#5b6886', paper: '#ffffff', line: '#d5ddec',
  blue: '#2f7de1', sky: '#36b6ec', teal: '#14a39a', green: '#2fa45a', red: '#e0475b', pink: '#ef7aa8',
  orange: '#f29a2e', yellow: '#f5c542', purple: '#8b5bd6', violet: '#b25fd0', gray: '#8a94a8', black: '#222',
  shun: '#2f6fdc', sapo: '#25a8dd', nar: '#4d5b7c', fibro: '#e8749c', macro: '#4c67d6', plasma: '#8f62d2', mast: '#bf4fc4',
  collagen: '#e0525a', reticular: '#3c3f4a', elastic: '#e09c32', white: '#d9b23c', brown: '#a8582a',
};

// ───────── 図形 ─────────
export function rr(ctx, x, y, w, h, r) {
  w = Math.max(0, w); h = Math.max(0, h);
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
export function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, Math.PI * 2); }
export function fillC(ctx, x, y, r, c) { circle(ctx, x, y, r); ctx.fillStyle = c; ctx.fill(); }

export function withAlpha(ctx, a, fn) { if (a <= 0.001) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
export function at(ctx, x, y, s, fn, rot = 0) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s); fn(); ctx.restore(); }

// ポップイン（拡大しながら現れる）。p: 0→1
export function pop(ctx, p, x, y, fn) {
  if (p <= 0) return;
  const s = 0.55 + 0.45 * back(p);
  withAlpha(ctx, clamp(p * 2.5), () => at(ctx, x, y, s, fn));
}

// ───────── 文字 ─────────
const KINSOKU_HEAD = '、。，．・：；？！ー」』）】〕〉》…%％';
export function wrap(ctx, str, maxW) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const ch of para) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line && !KINSOKU_HEAD.includes(ch)) {
        out.push(line);
        line = ch;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

export function text(ctx, str, x, y, o = {}) {
  const size = o.size || 36;
  ctx.font = `${o.weight || 700} ${size}px ${FONT}`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'middle';
  const lines = o.maxW ? wrap(ctx, str, o.maxW) : String(str).split('\n');
  const lh = (o.lh || 1.35) * size;
  let yy = y - (o.vcenter ? (lines.length - 1) * lh / 2 : 0);
  for (const l of lines) {
    if (o.stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.strokeW || size * 0.22;
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(l, x, yy);
    }
    ctx.fillStyle = o.color || COLORS.ink;
    ctx.fillText(l, x, yy);
    yy += lh;
  }
  return lines.length * lh;
}
export function measure(ctx, str, size, weight = 700) { ctx.font = `${weight} ${size}px ${FONT}`; return ctx.measureText(str).width; }

// ───────── UI 部品 ─────────
export function shadow(ctx, blur = 24, oy = 8, c = 'rgba(20,40,90,0.22)') { ctx.shadowColor = c; ctx.shadowBlur = blur; ctx.shadowOffsetY = oy; }
export function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

// 白いパネル（ヘッダーつき）
export function panel(ctx, x, y, w, h, o = {}) {
  ctx.save();
  shadow(ctx, 30, 10);
  rr(ctx, x, y, w, h, o.r || 26);
  ctx.fillStyle = o.fill || 'rgba(255,255,255,0.96)';
  ctx.fill();
  noShadow(ctx);
  if (o.title) {
    const hh = o.hh || 64;
    ctx.save();
    rr(ctx, x, y, w, h, o.r || 26);
    ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, o.color || COLORS.blue);
    g.addColorStop(1, o.color2 || o.color || COLORS.sky);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, hh);
    ctx.restore();
    text(ctx, o.title, x + 30, y + hh / 2 + 1, { size: o.tsize || 34, color: '#fff', weight: 800 });
    if (o.en) text(ctx, o.en, x + w - 26, y + hh / 2 + 2, { size: 22, color: 'rgba(255,255,255,0.9)', weight: 700, align: 'right' });
  }
  if (o.border) { rr(ctx, x, y, w, h, o.r || 26); ctx.lineWidth = 3; ctx.strokeStyle = o.border; ctx.stroke(); }
  ctx.restore();
}

// 「たとえ」「医学」タグ：たとえ話と医学的事実を区別して表示する
export function tag(ctx, x, y, kind, o = {}) {
  const lab = kind === 'tatoe' ? 'たとえ' : kind === 'exam' ? '試験ポイント' : kind === 'note' ? '講義資料の表記' : '医学';
  const col = kind === 'tatoe' ? COLORS.orange : kind === 'exam' ? COLORS.red : kind === 'note' ? COLORS.gray : COLORS.teal;
  const size = o.size || 22;
  const w = measure(ctx, lab, size, 800) + size * 1.2;
  const h = size * 1.55;
  const xx = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  rr(ctx, xx, y - h / 2, w, h, h / 2);
  ctx.fillStyle = col;
  ctx.fill();
  text(ctx, lab, xx + w / 2, y + 1, { size, color: '#fff', weight: 800, align: 'center' });
  return w;
}

// たとえの吹き出し（オレンジ枠）
export function tatoe(ctx, p, x, y, str, o = {}) {
  pop(ctx, p, x, y, () => {
    const size = o.size || 34;
    const w = (o.w || measure(ctx, str, size, 800) + 70);
    const h = o.h || size * 2.1;
    ctx.save();
    shadow(ctx, 18, 6);
    rr(ctx, -w / 2, -h / 2, w, h, 22);
    ctx.fillStyle = '#fff8ec';
    ctx.fill();
    noShadow(ctx);
    ctx.lineWidth = 4;
    ctx.strokeStyle = COLORS.orange;
    ctx.stroke();
    ctx.restore();
    tag(ctx, -w / 2 + 14, -h / 2, 'tatoe', { size: 20 });
    text(ctx, str, 0, 6, { size, align: 'center', color: '#8a4b07', weight: 800, maxW: w - 40, vcenter: true });
  });
}

// 用語カード（日本語＋英語＋説明）
export function term(ctx, p, x, y, w, jp, en, note, o = {}) {
  pop(ctx, p, x + w / 2, y, () => {
    const h = o.h || (note ? 150 : 104);
    const col = o.color || COLORS.blue;
    ctx.save();
    shadow(ctx, 22, 8);
    rr(ctx, -w / 2, -h / 2, w, h, 22);
    ctx.fillStyle = '#fff';
    ctx.fill();
    noShadow(ctx);
    rr(ctx, -w / 2, -h / 2, 16, h, 8);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.restore();
    const top = -h / 2 + 40;
    text(ctx, jp, -w / 2 + 40, top, { size: o.size || 40, weight: 800, color: col });
    if (en) text(ctx, en, -w / 2 + 44 + measure(ctx, jp, o.size || 40, 800) + 18, top + 4, { size: 24, weight: 700, color: COLORS.sub });
    if (note) text(ctx, note, -w / 2 + 40, top + 56, { size: 28, weight: 700, color: COLORS.ink, maxW: w - 70 });
    if (o.tag) tag(ctx, w / 2 - 16, -h / 2 + 2, o.tag, { align: 'right', size: 20 });
  });
}

// 矢印（p で伸びる）
export function arrow(ctx, x1, y1, x2, y2, o = {}) {
  const p = o.p === undefined ? 1 : clamp(o.p);
  if (p <= 0) return;
  const x = lerp(x1, x2, p), y = lerp(y1, y2, p);
  const a = Math.atan2(y - y1, x - x1);
  const hs = o.head || 22;
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = o.color || COLORS.ink;
  ctx.lineWidth = o.w || 6;
  ctx.lineCap = 'round';
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x - Math.cos(a) * hs * 0.6, y - Math.sin(a) * hs * 0.6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - hs * Math.cos(a - 0.45), y - hs * Math.sin(a - 0.45));
  ctx.lineTo(x - hs * Math.cos(a + 0.45), y - hs * Math.sin(a + 0.45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// チップ（丸い札）
export function chip(ctx, x, y, str, o = {}) {
  const size = o.size || 28;
  const w = measure(ctx, str, size, o.weight || 800) + size * 1.1;
  const h = size * 1.6;
  const xx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  ctx.save();
  if (o.shadow !== false) shadow(ctx, 12, 4);
  rr(ctx, xx, y - h / 2, w, h, h / 2);
  ctx.fillStyle = o.fill || COLORS.blue;
  ctx.fill();
  noShadow(ctx);
  if (o.border) { ctx.lineWidth = 3; ctx.strokeStyle = o.border; ctx.stroke(); }
  ctx.restore();
  text(ctx, str, xx + w / 2, y + 1, { size, color: o.color || '#fff', weight: o.weight || 800, align: 'center' });
  return w;
}

// 箇条書きリスト（i 行目が p[i] で出る）
export function bullets(ctx, x, y, items, o = {}) {
  const size = o.size || 32, gap = o.gap || size * 1.6;
  items.forEach((it, i) => {
    const p = typeof o.p === 'function' ? o.p(i) : 1;
    if (p <= 0) return;
    withAlpha(ctx, clamp(p * 2), () => {
      const dx = (1 - easeOut(p)) * 40;
      const mark = o.mark ? o.mark(i) : '●';
      text(ctx, mark, x + dx, y + i * gap, { size: size * 0.7, color: o.markColor || COLORS.blue });
      text(ctx, it, x + dx + size * 1.0, y + i * gap, { size, weight: o.weight || 700, color: o.color || COLORS.ink, maxW: o.maxW });
    });
  });
}

// ハイライトの丸囲み（手描き風）
export function ring(ctx, x, y, rx, ry, p, color = COLORS.red, w = 6) {
  if (p <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const n = 60, end = Math.floor(n * 1.08 * clamp(p));
  for (let i = 0; i <= end; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const r = 1 + 0.04 * Math.sin(i * 0.4);
    const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// きらきら
export function sparkle(ctx, x, y, r, t, color = '#fff') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 1.5);
  const s = r * (0.7 + 0.3 * Math.sin(t * 6));
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, rr2 = i % 2 ? s * 0.28 : s;
    ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 紙吹雪
export function confetti(ctx, t, t0, n = 120) {
  const k = t - t0;
  if (k < 0 || k > 6) return;
  const cols = ['#f25c7a', '#36b6ec', '#f5c542', '#2fa45a', '#8b5bd6', '#f29a2e'];
  for (let i = 0; i < n; i++) {
    const r = rnd(i + 11);
    const x = r() * W + Math.sin(k * 2 + i) * 40;
    const y = -40 + (k * (220 + r() * 260)) - r() * 300;
    if (y < -40 || y > H + 40) continue;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(k * (2 + r() * 4) + i);
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(-8, -4, 16, 8);
    ctx.restore();
  }
}

// 顕微鏡の丸いレンズ（拡大窓）。fn を円の中に描く
export function lens(ctx, x, y, r, p, fn, o = {}) {
  if (p <= 0) return;
  const rr2 = r * easeOut(p);
  ctx.save();
  shadow(ctx, 40, 10, 'rgba(10,30,80,0.35)');
  circle(ctx, x, y, rr2 + 14);
  ctx.fillStyle = o.ring || '#eaf2ff';
  ctx.fill();
  noShadow(ctx);
  circle(ctx, x, y, rr2);
  ctx.clip();
  fn(rr2);
  ctx.restore();
  ctx.save();
  circle(ctx, x, y, rr2 + 7);
  ctx.lineWidth = 10;
  ctx.strokeStyle = o.ringColor || '#7fa8e8';
  ctx.stroke();
  ctx.restore();
}

// 表（列ごとに出す）
export function table(ctx, x, y, colW, rowH, rows, o = {}) {
  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const p = o.p ? o.p(ri, ci) : 1;
      if (p <= 0) return;
      const cx = x + colW.slice(0, ci).reduce((a, b) => a + b, 0);
      withAlpha(ctx, clamp(p * 2), () => {
        const cell2 = typeof cell === 'object' ? cell : { t: cell };
        ctx.fillStyle = cell2.bg || (ri === 0 ? '#e9f1ff' : ci === 0 ? '#f6f8fc' : '#fff');
        ctx.fillRect(cx, y + ri * rowH, colW[ci], rowH);
        ctx.strokeStyle = '#c9d4e8';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, y + ri * rowH, colW[ci], rowH);
        text(ctx, cell2.t, cx + colW[ci] / 2, y + ri * rowH + rowH / 2 + 1,
          { size: cell2.size || o.size || 30, align: 'center', color: cell2.c || COLORS.ink, weight: cell2.w || (ri === 0 || ci === 0 ? 800 : 700) });
      });
    });
  });
}
