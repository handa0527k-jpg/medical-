// GENE QUEST — drawing engine.
// The world is drawn on a 480×270 pixel canvas (lo) and scaled ×2 without smoothing onto the
// 960×540 frame (hi). Text and windows are drawn on hi so the dot font stays sharp; the encoder
// scales hi ×2 again (nearest neighbour) to 1920×1080.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
GlobalFonts.registerFromPath(join(HERE, '..', 'fonts', 'DotGothic16.ttf'), 'DotGothic16');

export const LW = 480, LH = 270, HW = 960, HH = 540;
export const FONT = 'DotGothic16';

// ---- palette (one place for every colour in the film) ----
export const C = {
  k: '#1b1530', K: '#0b0a14', w: '#f7f3e8', W: '#ffffff',
  s: '#f6c99b', S: '#d9976b',
  h: '#2bb3a3', H: '#83e6d2',
  r: '#d8344a', R: '#8f1f3c', q: '#ff8a8a',
  b: '#3a5fcd', B: '#22327a', c: '#5fd0f0', C: '#bff2ff',
  y: '#f7c948', Y: '#b5852a', z: '#fff2a8',
  g: '#3fb54a', G: '#1f6b34', v: '#a8f07a',
  p: '#8e4fd6', P: '#4e2687', u: '#c9a3ff',
  o: '#f08a3c', O: '#a8521f',
  n: '#8a5a3b', N: '#53351f', t: '#c7905e',
  e: '#6b7286', E: '#3d4357', l: '#b8c0d6', L: '#e2e6f0',
  m: '#ef6fb0', M: '#9b2f6c',
  a: '#2a2f4a', A: '#151a33',
};

// base colours (shared by every DNA picture)
export const BASE = { A: '#3fb54a', T: '#d8344a', G: '#f7c948', C: '#3a5fcd', U: '#f08a3c', N: '#6b7286' };
// brighter versions for letters drawn over dark scenery
export const BASE_TXT = { A: '#6ee07a', T: '#ff7a88', G: '#ffd95a', C: '#8fb0ff', U: '#ffa860', N: '#b8c0d6' };

// ---- frame ----
export function makeFrame() {
  const lo = createCanvas(LW, LH), hi = createCanvas(HW, HH);
  const L = lo.getContext('2d'), U = hi.getContext('2d');
  L.imageSmoothingEnabled = false; U.imageSmoothingEnabled = false;
  return { lo, hi, L, U, ops: [], fade: 0, flash: null, shake: [0, 0] };
}

export function beginFrame(f) {
  f.ops.length = 0; f.fade = 0; f.flash = null; f.shake = [0, 0];
  f.L.setTransform(1, 0, 0, 1, 0, 0);
  f.L.globalAlpha = 1;
  f.L.fillStyle = C.K; f.L.fillRect(0, 0, LW, LH);
}

// layer 1: labels on the world; layer 2: windows; layer 3: window text; layer 4: top
export function endFrame(f) {
  const U = f.U;
  U.setTransform(1, 0, 0, 1, 0, 0);
  U.globalAlpha = 1;
  U.fillStyle = '#000'; U.fillRect(0, 0, HW, HH);
  const [sx, sy] = f.shake;
  U.drawImage(f.lo, Math.round(sx) * 2, Math.round(sy) * 2, HW, HH);
  const ops = f.ops.map((o, i) => [o, i]).sort((a, b) => a[0].z - b[0].z || a[1] - b[1]);
  for (const [o] of ops) {
    U.save();
    if (o.world) U.translate(Math.round(sx) * 2, Math.round(sy) * 2);
    o.fn(U);
    U.restore();
  }
  if (f.flash) { U.globalAlpha = f.flash[1]; U.fillStyle = f.flash[0]; U.fillRect(0, 0, HW, HH); U.globalAlpha = 1; }
  if (f.fade > 0) { U.globalAlpha = Math.min(1, f.fade); U.fillStyle = '#000'; U.fillRect(0, 0, HW, HH); U.globalAlpha = 1; }
}

// ---- math ----
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = t => { t = clamp(t); return 1 - (1 - t) * (1 - t); };
export const easeIn = t => { t = clamp(t); return t * t; };
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const step = (t, fps = 8) => Math.floor(t * fps);
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export const pulse = (t, hz = 1) => 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * hz);

// ---- pixel primitives on lo ----
export function rect(L, x, y, w, h, c) { L.fillStyle = c; L.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
export function px(L, x, y, c) { L.fillStyle = c; L.fillRect(Math.round(x), Math.round(y), 1, 1); }
export function line(L, x0, y0, x1, y1, c, w = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  L.fillStyle = c;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, o = Math.floor((w - 1) / 2);
  for (;;) {
    L.fillRect(x0 - o, y0 - o, w, w);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
export function circle(L, cx, cy, r, c, fill = true) {
  L.fillStyle = c;
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = x * x + y * y;
    if (fill ? d <= r * r + r * 0.8 : (d <= r * r + r * 0.8 && d >= (r - 1) * (r - 1) + (r - 1) * 0.8)) L.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
  }
}
export function ring(L, cx, cy, r, c, th = 1) { for (let i = 0; i < th; i++) circle(L, cx, cy, r - i, c, false); }
export function ellipse(L, cx, cy, rx, ry, c) {
  L.fillStyle = c;
  for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); L.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
}
export function dither(L, x, y, w, h, c, phase = 0) {
  L.fillStyle = c;
  for (let j = 0; j < h; j++) for (let i = (j + phase) & 1; i < w; i += 2) L.fillRect(x + i, y + j, 1, 1);
}
export function vgrad(L, x, y, w, h, cols) {
  // banded gradient (no smooth blend: pixel art)
  const n = cols.length;
  for (let j = 0; j < h; j++) { const k = Math.min(n - 1, Math.floor((j / h) * n)); L.fillStyle = cols[k]; L.fillRect(x, y + j, w, 1); }
}
export function stars(L, t, seed = 7, n = 70, h = LH, col = C.L) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * LW), y = Math.floor(r() * h), ph = r() * 6;
    const on = Math.sin(t * 2 + ph * 3) > -0.3;
    if (on) px(L, x, y, r() < 0.2 ? C.z : col);
    if (r() < 0.08 && Math.sin(t * 3 + ph) > 0.7) { px(L, x - 1, y, col); px(L, x + 1, y, col); px(L, x, y - 1, col); px(L, x, y + 1, col); }
  }
}

// ---- sprites ----
const spriteCache = new Map();
export function defSprite(name, rows, pal = {}, mirror = false) {
  const R = mirror ? rows.map(r => r + [...r].reverse().join('')) : rows;
  const h = R.length, w = Math.max(...R.map(r => r.length));
  const cv = createCanvas(w, h), g = cv.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < R[y].length; x++) {
    const ch = R[y][x];
    if (ch === '.' || ch === ' ') continue;
    const col = pal[ch] || C[ch];
    if (!col) throw new Error(`sprite ${name}: no colour for "${ch}"`);
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
  spriteCache.set(name, cv);
  return cv;
}
export const sprite = name => { const s = spriteCache.get(name); if (!s) throw new Error('no sprite ' + name); return s; };
export function spr(L, name, x, y, { flip = false, scale = 1, alpha = 1, anchor = 'bottom' } = {}) {
  const s = sprite(name);
  const w = s.width * scale, h = s.height * scale;
  const ox = anchor === 'bottom' || anchor === 'center' ? -w / 2 : 0;
  const oy = anchor === 'bottom' ? -h : anchor === 'center' ? -h / 2 : 0;
  L.save();
  L.globalAlpha = alpha;
  L.translate(Math.round(x + ox + (flip ? w : 0)), Math.round(y + oy));
  if (flip) L.scale(-1, 1);
  L.drawImage(s, 0, 0, w, h);
  L.restore();
}
export function shadow(L, x, y, w = 10) { L.globalAlpha = 0.35; ellipse(L, x, y, Math.round(w / 2), 1, C.K); L.globalAlpha = 1; }

// ---- deferred hi-res drawing ----
export function hi(f, z, fn, world = true) { f.ops.push({ z, fn, world }); }

export function text(f, x, y, str, { c = C.w, size = 16, align = 'left', z = 1, shadow = true, sh = C.K, base = 'top', bold = false, alpha = 1, world = true } = {}) {
  hi(f, z, U => {
    U.globalAlpha = alpha;
    U.font = `${size}px ${FONT}`;
    U.textAlign = align; U.textBaseline = base;
    const X = Math.round(x * 2), Y = Math.round(y * 2);
    if (shadow) {
      U.fillStyle = sh;
      for (const [dx, dy] of bold ? [[2, 0], [0, 2], [2, 2], [-2, 0], [0, -2]] : [[2, 2], [2, 0], [0, 2]]) U.fillText(str, X + dx, Y + dy);
    }
    U.fillStyle = c; U.fillText(str, X, Y);
  }, world);
}

// monospaced letters (DNA sequences): one cell = cw lo px
export function seq(f, x, y, str, { cw = 6, cols = null, c = C.w, size = 16, z = 1, alpha = 1 } = {}) {
  hi(f, z, U => {
    U.globalAlpha = alpha;
    U.font = `${size}px ${FONT}`; U.textAlign = 'center'; U.textBaseline = 'top';
    [...str].forEach((ch, i) => {
      if (ch === ' ') return;
      const X = Math.round((x + i * cw + cw / 2) * 2), Y = Math.round(y * 2);
      U.fillStyle = C.K; U.fillText(ch, X + 2, Y + 2);
      U.fillStyle = cols ? (typeof cols === 'function' ? cols(ch, i) : cols[i] || c) : c;
      U.fillText(ch, X, Y);
    });
  });
}

// ---- windows (the classic RPG frame) ----
export function win(f, x, y, w, h, { z = 2, alpha = 1, fill = '#06061a', border = C.w, world = false } = {}) {
  hi(f, z, U => {
    const X = Math.round(x * 2), Y = Math.round(y * 2), Wd = Math.round(w * 2), Ht = Math.round(h * 2);
    U.globalAlpha = 0.92 * alpha;
    U.fillStyle = fill;
    U.fillRect(X + 4, Y, Wd - 8, Ht); U.fillRect(X, Y + 4, Wd, Ht - 8); U.fillRect(X + 2, Y + 2, Wd - 4, Ht - 4);
    U.globalAlpha = alpha;
    U.fillStyle = border;
    // double rule with rounded corners (2 hi px each)
    U.fillRect(X + 6, Y + 4, Wd - 12, 2); U.fillRect(X + 6, Y + Ht - 6, Wd - 12, 2);
    U.fillRect(X + 4, Y + 6, 2, Ht - 12); U.fillRect(X + Wd - 6, Y + 6, 2, Ht - 12);
    U.fillRect(X + 10, Y + 8, Wd - 20, 2); U.fillRect(X + 10, Y + Ht - 10, Wd - 20, 2);
    U.fillRect(X + 8, Y + 10, 2, Ht - 20); U.fillRect(X + Wd - 10, Y + 10, 2, Ht - 20);
    U.globalAlpha = 1;
  }, world);
}
export function wtext(f, x, y, str, o = {}) { text(f, x, y, str, { z: 3, shadow: false, world: false, ...o }); }

// window that opens like a menu: grows from the top over 0.15 s
export function popWin(f, t, x, y, w, h, o = {}) {
  if (t < 0) return false;
  const k = easeOut(t / 0.15);
  win(f, x, y, w, Math.max(8, h * k), o);
  return k >= 1;
}

// blinking cursor ▶
export function cursor(f, x, y, t, z = 3, c = C.w, blink = true) {
  if (blink && Math.floor(t * 3) % 2) return;
  hi(f, z, U => { U.fillStyle = c; const X = Math.round(x * 2), Y = Math.round(y * 2) + 2; for (let i = 0; i < 6; i++) U.fillRect(X + i * 2, Y + i * 2, 2, 24 - i * 4); }, false);
}

// wrap Japanese text to a width (in full-width characters)
export function wrap(str, n) {
  const out = []; let cur = '', w = 0;
  const cw = ch => (/[\x20-\x7e]/.test(ch) ? 0.5 : 1);
  const noStart = '、。」』）・ー〜’”!?！？…―';
  for (const ch of str) {
    if (w + cw(ch) > n && !noStart.includes(ch)) { out.push(cur); cur = ''; w = 0; }
    cur += ch; w += cw(ch);
  }
  if (cur) out.push(cur);
  return out;
}

// typed message (narration / dialogue) in the bottom window
export function message(f, msg, t, { who = null, x = 10, y = 206, w = 460, h = 58, speed = null } = {}) {
  if (!msg) return;
  win(f, x, y, w, h);
  const lines = wrap(msg.text, 50);
  const total = lines.join('').length;
  const cps = speed || Math.max(18, total / Math.max(0.6, msg.dur * 0.82));
  let shown = Math.floor(t * cps);
  const prefix = who ? '' : '＊';
  let yy = y + 9;
  if (who) wtext(f, x + 10, yy, `${who}`, { c: C.y });
  lines.forEach((ln, i) => {
    const part = ln.slice(0, Math.max(0, shown)); shown -= ln.length;
    const lx = x + (who ? 10 : 18), ly = yy + (who ? 14 : 0) + i * 14;
    if (i === 0 && !who) wtext(f, x + 9, ly, prefix);
    if (part) wtext(f, lx, ly, part);
  });
  if (shown > 2 && Math.floor(t * 2.5) % 2 === 0) wtext(f, x + w / 2 - 4, y + h - 12, '▼', { c: C.w });
}

// a small speech window above an NPC (on-screen text, not voiced)
export function say(f, x, y, str, t, { w = null, c = C.w, align = 'center' } = {}) {
  if (t < 0) return;
  const ln = str.split('\n');
  const cw = Math.max(...ln.map(s => [...s].reduce((a, ch) => a + (/[\x20-\x7e]/.test(ch) ? 4 : 8), 0)));
  const W = w || cw + 16, H = ln.length * 10 + 10;
  const X = align === 'center' ? x - W / 2 : x;
  if (!popWin(f, t, X, y, W, H, { z: 2 })) return;
  let shown = Math.floor(t * 30);
  ln.forEach((s, i) => { const part = s.slice(0, Math.max(0, shown)); shown -= s.length; wtext(f, X + 8, y + 5 + i * 10, part, { c }); });
}

// hero status window (top left)
export function status(f, st, t) {
  const x = 6, y = 6, w = 92, h = 50;
  win(f, x, y, w, h);
  wtext(f, x + 9, y + 6, st.name, { c: C.w });
  wtext(f, x + 9, y + 18, `Lv ${String(st.lv).padStart(2, ' ')}`);
  wtext(f, x + 9, y + 30, `HP ${st.hp}`);
  wtext(f, x + 52, y + 30, `MP ${st.mp}`);
}

// chapter banner
export function banner(f, t, title, sub, { dur = 2.8, y = 22 } = {}) {
  if (t < 0 || t > dur) return;
  const a = Math.min(1, t / 0.25, (dur - t) / 0.35);
  const w = 260, x = (LW - w) / 2;
  win(f, x, y, w, 40, { alpha: a, z: 5 });
  text(f, LW / 2, y + 7, title, { z: 6, align: 'center', c: C.y, shadow: false, alpha: a, world: false });
  text(f, LW / 2, y + 22, sub, { z: 6, align: 'center', c: C.w, shadow: false, alpha: a, world: false });
}

// floating numbers / words (damage, +EXP)
export function popup(f, x, y, str, t, { c = C.w, size = 16, dur = 1.2 } = {}) {
  if (t < 0 || t > dur) return;
  const k = t / dur;
  const yy = y - 10 * easeOut(Math.min(1, t * 3)) + (t > 0.3 ? 0 : Math.sin(t * 20) * 1);
  text(f, x, yy, str, { c, size, align: 'center', bold: true, alpha: k > 0.75 ? (1 - k) / 0.25 : 1, z: 4 });
}

// sparkle particles
export function sparkle(L, x, y, t, n = 6, col = C.z, r0 = 4, r1 = 14, seed = 3) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, sp = 0.6 + r() * 0.6, ph = r();
    const k = (t * sp + ph) % 1;
    const rr = r0 + (r1 - r0) * k;
    const xx = x + Math.cos(a) * rr, yy = y + Math.sin(a) * rr;
    if (k < 0.8) { px(L, xx, yy, col); if (k < 0.4) { px(L, xx + 1, yy, col); px(L, xx - 1, yy, col); px(L, xx, yy + 1, col); px(L, xx, yy - 1, col); } }
  }
}

// battle-style swirl transition (0 → 1 covers the screen)
export function swirl(f, k) {
  if (k <= 0) return;
  hi(f, 9, U => {
    U.fillStyle = '#000';
    const n = 24;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const r = Math.min(1, k * 1.6 - (i % 2) * 0.3) * 600;
      if (r <= 0) continue;
      U.beginPath(); U.moveTo(480, 270);
      U.arc(480, 270, r, a0, a0 + (Math.PI * 2) / n * clamp(k * 1.4));
      U.closePath(); U.fill();
    }
  }, false);
}
