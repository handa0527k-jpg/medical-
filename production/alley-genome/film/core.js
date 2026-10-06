// 路地裏のゲノム — core helpers. Everything is a pure function of time so any frame can be drawn alone.
'use strict';
const FW = 1920, FH = 1080; // logical frame; the canvas is scaled to its pixel size

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
const ease = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
const easeIn = (k) => Math.pow(clamp(k), 3);
const win = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(smooth(inv(a, a + fi, t)), 1 - smooth(inv(b - fo, b, t)));
const TAU = Math.PI * 2;

// deterministic hash noise
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return n - Math.floor(n); }
function hash2(a, b) { return hash(a * 57.31 + b * 91.17); }
function noise1(x) { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
function fbm(x) { return noise1(x) * 0.6 + noise1(x * 2.13 + 7) * 0.28 + noise1(x * 4.7 + 3) * 0.12; }

function rgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function mix(h1, h2, k) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const c = (s) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, clamp(k)));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

// cached radial glow sprites (soft light blobs), tinted by color
const _glow = new Map();
function glowSprite(color) {
  let s = _glow.get(color);
  if (s) return s;
  s = mkCanvas(128, 128); const g = s.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, rgba(color, 1)); gr.addColorStop(0.18, rgba(color, 0.55)); gr.addColorStop(0.45, rgba(color, 0.16)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _glow.set(color, s); return s;
}
function glow(ctx, x, y, r, color, a = 1) {
  if (a <= 0.003 || r <= 0.5) return;
  const p = ctx.globalCompositeOperation, pa = ctx.globalAlpha;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pa * clamp(a, 0, 1);
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = p; ctx.globalAlpha = pa;
}

// neon stroke: wide faint + mid + bright core
function neonStroke(ctx, pathFn, color, w = 4, a = 1, core = '#ffffff') {
  if (a <= 0.003) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';
  const layers = [[w * 5, 0.07], [w * 2.6, 0.16], [w * 1.4, 0.5]];
  for (const [lw, al] of layers) { ctx.globalAlpha = a * al; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); pathFn(ctx); ctx.stroke(); }
  ctx.globalAlpha = a * 0.9; ctx.strokeStyle = mix(color, core, 0.6); ctx.lineWidth = Math.max(1, w * 0.55); ctx.beginPath(); pathFn(ctx); ctx.stroke();
  ctx.restore();
}

const FONT = {
  mincho: '"Shippori Mincho", "IPAMincho", serif',
  gothic: '"Zen Kaku Gothic New", "IPAGothic", sans-serif',
  maru: '"Zen Maru Gothic", "IPAGothic", sans-serif',
};

function text(ctx, s, x, y, { size = 40, font = FONT.gothic, weight = 500, color = '#fff', align = 'center', base = 'middle', a = 1, glowC = null, outline = 0, outlineC = '#000', spacing = 0 } = {}) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = base;
  if (spacing) { try { ctx.letterSpacing = spacing + 'px'; } catch (e) { /* older canvas */ } }
  if (glowC) { ctx.shadowColor = glowC; ctx.shadowBlur = size * 0.6; }
  if (outline) { ctx.lineJoin = 'round'; ctx.strokeStyle = outlineC; ctx.lineWidth = outline; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
  ctx.restore();
}

// ---- 3D alley projection ----------------------------------------------------------------------
// world: x right, y up, z forward (metres). Camera {x,y,z,f,hor,roll}
function proj(cam, x, y, z) {
  const dz = z - cam.z;
  if (dz < 0.05) return null;
  const s = cam.f / dz;
  return { x: FW / 2 + (x - cam.x) * s + (cam.pan || 0), y: FH / 2 + (cam.hor || 0) - (y - cam.y) * s, s, dz };
}
function quad(ctx, cam, pts) { // pts: [[x,y,z]...]; returns false if clipped
  const p = pts.map((q) => proj(cam, q[0], q[1], q[2]));
  if (p.some((q) => !q)) return false;
  ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y); ctx.closePath();
  return true;
}

// pick from a list by seeded hash
const pick = (arr, seed) => arr[Math.floor(hash(seed) * arr.length) % arr.length];

// a little path helper for smooth closed shapes through points (Catmull-Rom → Bézier)
function smoothPath(ctx, pts, closed = true, tension = 0.5) {
  const n = pts.length; if (n < 2) return;
  ctx.moveTo(pts[0][0], pts[0][1]);
  const P = (i) => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3];
    const c2 = [p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3];
    ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}
