// GENE QUEST — scenery and the molecular pictures (DNA, plasmids, gels, cells).
import { C, BASE, BASE_TXT, LW, LH, rect, px, line, circle, ring, ellipse, dither, vgrad, stars, spr, shadow, text, seq, rng, clamp, lerp, ease, pulse } from './engine.mjs';

export const COMP = { A: 'T', T: 'A', G: 'C', C: 'G', U: 'A' };
export const comp = s => [...s].map(ch => COMP[ch] || ch).join('');

// ── scenery ─────────────────────────────────────────────────────────────
export function sky(L, cols = ['#2b3a8c', '#3b55b0', '#5a7ed0', '#8fb3e8'], h = 120) { vgrad(L, 0, 0, LW, h, cols); }
export function clouds(L, t, y = 20, seed = 2, col = C.L) {
  const r = rng(seed);
  for (let i = 0; i < 5; i++) {
    const w = 24 + r() * 30, x = ((r() * LW + t * (3 + r() * 4)) % (LW + 80)) - 40, yy = y + r() * 40;
    ellipse(L, x, yy, w / 2, 4, col); ellipse(L, x - w / 4, yy - 3, w / 4, 3, col); ellipse(L, x + w / 5, yy - 4, w / 4, 4, col);
  }
}
export function grass(L, y0 = 120, h = LH - 120, seed = 5) {
  rect(L, 0, y0, LW, h, '#3f9a4a');
  const r = rng(seed);
  for (let i = 0; i < 260; i++) { const x = Math.floor(r() * LW), y = y0 + Math.floor(r() * h); px(L, x, y, r() < 0.5 ? '#57b860' : '#2f7a3c'); px(L, x, y - 1, r() < 0.5 ? '#57b860' : '#2f7a3c'); }
}
export function floorTiles(L, y0, col1 = '#7a5236', col2 = '#6a4530', tw = 16, th = 8) {
  for (let y = y0, j = 0; y < LH; y += th, j++) for (let x = -(j % 2) * (tw / 2), i = 0; x < LW; x += tw, i++) {
    rect(L, x, y, tw, th, (i + j) % 2 ? col1 : col2); rect(L, x, y, tw, 1, '#00000022'); rect(L, x, y, 1, th, '#00000033');
  }
}
export function brickWall(L, y0, y1, col = '#5d5470', mortar = '#433b56') {
  rect(L, 0, y0, LW, y1 - y0, mortar);
  for (let y = y0, j = 0; y < y1; y += 8, j++) for (let x = -(j % 2) * 8; x < LW; x += 16) rect(L, x + 1, y + 1, 14, 6, col);
}
export function woodWall(L, y0, y1, col = '#8a5a3b', dark = '#6e452c') {
  for (let x = 0; x < LW; x += 12) { rect(L, x, y0, 12, y1 - y0, (x / 12) % 2 ? col : dark); rect(L, x, y0, 1, y1 - y0, '#4a2e1c'); }
}
export function sea(L, t, y0 = 150, cols = ['#1d3f8a', '#2752a8', '#3a6cc4']) {
  vgrad(L, 0, y0, LW, LH - y0, cols);
  const r = rng(11);
  for (let i = 0; i < 60; i++) { const y = y0 + 4 + Math.floor(r() * (LH - y0)), x = Math.floor((r() * LW + t * 8 * (0.5 + r())) % LW); rect(L, x, y, 4 + Math.floor(r() * 6), 1, '#7fb0ee'); }
}
export function night(L, t, seed = 7) { vgrad(L, 0, 0, LW, LH, ['#05061a', '#0a0d2b', '#101640', '#18205a']); stars(L, t, seed, 90, 200); }
export function windowLight(L, x, y, w, h, t) {
  rect(L, x - 1, y - 1, w + 2, h + 2, C.k); vgrad(L, x, y, w, h, ['#9fd0ff', '#c7e6ff']); rect(L, x + w / 2, y, 1, h, C.k); rect(L, x, y + h / 2, w, 1, C.k);
  L.globalAlpha = 0.12; L.fillStyle = '#fff6c8';
  L.beginPath(); L.moveTo(x, y + h); L.lineTo(x + w, y + h); L.lineTo(x + w + 40, y + h + 70); L.lineTo(x + 30, y + h + 70); L.fill();
  L.globalAlpha = 1;
}
export function torch(L, x, y, t) {
  rect(L, x - 1, y, 3, 8, C.N);
  const k = Math.floor(t * 10) % 3;
  ellipse(L, x, y - 3, 3 - (k === 1 ? 1 : 0), 4, C.o); ellipse(L, x, y - 2, 1, 2, C.z);
  L.globalAlpha = 0.08; circle(L, x, y - 2, 22 + k, C.y); L.globalAlpha = 1;
}
export function vignette(L, a = 0.35) {
  L.globalAlpha = a; L.fillStyle = '#000';
  for (let i = 0; i < 12; i++) { L.fillRect(0, 0, LW, i); L.fillRect(0, LH - i, LW, i); L.fillRect(0, 0, i * 2, LH); L.fillRect(LW - i * 2, 0, i * 2, LH); }
  L.globalAlpha = 1;
}

// ── a walking character: x moves from a to b during [t0, t1] ─────────────
export function walker(L, base, t, t0, t1, xa, xb, y, { side = true, fps = 6, scale = 2 } = {}) {
  const k = clamp((t - t0) / (t1 - t0));
  const moving = t > t0 && t < t1;
  const x = lerp(xa, xb, k);
  const fr = moving && Math.floor(t * fps) % 2;
  const flip = side && xb < xa;
  const name = side ? (moving ? (fr ? base + 'R2' : base + 'R') : base + 'R') : (moving && fr ? base + '2' : base);
  shadow(L, x, y, 12 * scale);
  spr(L, name, x, y - (moving && fr ? scale : 0), { flip, scale });
  return x;
}
export function bob(t, hz = 1.2, amp = 1) { return Math.round(Math.sin(t * Math.PI * 2 * hz) * amp); }

// ── DNA: a duplex laid out left→right, one cell = cw px ─────────────────
// top is read 5'→3' left→right, bot is the partner (3'→5' left→right); ' ' leaves a gap.
export function duplex(f, L, x, y, top, bot, { cw = 7, gap = 10, letters = true, ends = true, glow = null, hl = null, alpha = 1, hb = true, lab = true, tc = null, bc = null } = {}) {
  const n = Math.max(top.length, bot.length);
  L.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const a = top[i], b = bot[i], xx = x + i * cw;
    const on = h => hl && h >= hl[0] && h < hl[1];
    if (on(i)) { L.globalAlpha = 0.35 * alpha; rect(L, xx - 1, y - 3, cw + 1, gap + 7, C.z); L.globalAlpha = alpha; }
    if (a && a !== ' ') { rect(L, xx, y, cw - 1, 2, tc || '#cfd6ea'); rect(L, xx + Math.floor(cw / 2) - 1, y + 2, 2, Math.floor(gap / 2) - 1, BASE[a] || C.e); }
    if (b && b !== ' ') { rect(L, xx, y + gap, cw - 1, 2, bc || '#cfd6ea'); rect(L, xx + Math.floor(cw / 2) - 1, y + Math.ceil(gap / 2) + 1, 2, Math.floor(gap / 2) - 1, BASE[b] || C.e); }
    if (hb && a && b && a !== ' ' && b !== ' ') px(L, xx + Math.floor(cw / 2) - 1, y + Math.floor(gap / 2) + 1, C.w);
  }
  L.globalAlpha = 1;
  if (letters) {
    const col = ch => BASE_TXT[ch] || C.w;
    seq(f, x, y - 10, top, { cw, cols: col, alpha });
    seq(f, x, y + gap + 3, bot, { cw, cols: col, alpha });
  }
  if (ends && lab) {
    const t0 = top.search(/\S/), t1 = top.length - [...top].reverse().join('').search(/\S/);
    const b0 = bot.search(/\S/), b1 = bot.length - [...bot].reverse().join('').search(/\S/);
    if (t0 >= 0) { text(f, x + t0 * cw - 9, y - 9, "5'", { c: C.l, alpha }); text(f, x + t1 * cw + 1, y - 9, "3'", { c: C.l, alpha }); }
    if (b0 >= 0) { text(f, x + b0 * cw - 9, y + gap + 3, "3'", { c: C.l, alpha }); text(f, x + b1 * cw + 1, y + gap + 3, "5'", { c: C.l, alpha }); }
  }
}

// a single strand drawn as a coloured ribbon of bases
export function strand(f, L, x, y, s, { cw = 7, up = false, letters = true, col = '#cfd6ea', alpha = 1, rna = false } = {}) {
  L.globalAlpha = alpha;
  [...s].forEach((ch, i) => {
    if (ch === ' ') return;
    const xx = x + i * cw;
    rect(L, xx, y, cw - 1, 2, rna ? C.c : col);
    rect(L, xx + Math.floor(cw / 2) - 1, up ? y - 4 : y + 2, 2, 4, BASE[ch] || C.e);
  });
  L.globalAlpha = 1;
  if (letters) seq(f, x, up ? y + 4 : y - 10, s, { cw, cols: ch => BASE_TXT[ch] || C.w, alpha });
}

// plain coloured bar for long DNA (no letters)
export function bar(L, x, y, w, c, h = 2) { rect(L, x, y, w, h, c); }
export function dsBar(L, x, y, w, c = '#cfd6ea', gap = 4, c2 = null) { rect(L, x, y, w, 2, c); rect(L, x, y + gap, w, 2, c2 || c); }

// a circular plasmid; segments are [from, to, colour] in turns (0..1, clockwise from the top)
export function plasmid(L, cx, cy, r, segs = [], { base = C.y, th = 3, gapAt = null, gapW = 0.06, rot = 0 } = {}) {
  for (let a = 0; a < 1; a += 1 / (r * 7)) {
    const aa = (a + rot) % 1;
    if (gapAt !== null && Math.abs(((aa - gapAt + 1.5) % 1) - 0.5) < gapW / 2) continue;
    let col = base;
    for (const [s0, s1, c] of segs) if (aa >= s0 && aa < s1) col = c;
    const ang = aa * Math.PI * 2 - Math.PI / 2;
    for (let k = 0; k < th; k++) px(L, cx + Math.cos(ang) * (r - k), cy + Math.sin(ang) * (r - k), col);
  }
}

// a bacterium (rounded capsule) with an optional plasmid inside
export function bacterium(L, cx, cy, w = 30, h = 14, { fill = '#d6dbe8', edge = C.e, plas = null, t = 0 } = {}) {
  const r = h / 2;
  rect(L, cx - w / 2 + r, cy - r, w - 2 * r, h, edge); circle(L, cx - w / 2 + r, cy, r, edge); circle(L, cx + w / 2 - r, cy, r, edge);
  rect(L, cx - w / 2 + r, cy - r + 2, w - 2 * r, h - 4, fill); circle(L, cx - w / 2 + r, cy, r - 2, fill); circle(L, cx + w / 2 - r, cy, r - 2, fill);
  // the bacterium's own (genomic) DNA: a tangle
  const rr = rng(Math.round(cx * 7 + cy));
  let px0 = cx - w / 5, py0 = cy;
  for (let i = 0; i < 9; i++) { const nx = cx - w / 3.2 + rr() * w / 2.4, ny = cy - r / 2 + rr() * r; line(L, px0, py0, nx, ny, '#8f97b0'); px0 = nx; py0 = ny; }
  if (plas) plasmid(L, cx + w / 4, cy, Math.max(3, r / 2), plas, { th: 1 });
}

// a eukaryotic cell (rounded box) for the expression scenes
export function cellBox(L, x, y, w, h, { fill = '#f2d8e6', edge = '#b05c8c', nucleus = true } = {}) {
  rect(L, x + 3, y, w - 6, h, edge); rect(L, x, y + 3, w, h - 6, edge); rect(L, x + 1, y + 1, w - 2, h - 2, edge);
  rect(L, x + 4, y + 2, w - 8, h - 4, fill); rect(L, x + 2, y + 4, w - 4, h - 8, fill);
  if (nucleus) { ellipse(L, x + w * 0.3, y + h * 0.5, Math.round(w * 0.12), Math.round(h * 0.18), '#c088b0'); ellipse(L, x + w * 0.3, y + h * 0.5, Math.round(w * 0.1), Math.round(h * 0.15), '#d9a6c8'); }
}

// gel slab: wells at the top (−), bands migrate down toward (+)
export function gel(L, x, y, w, h, lanes, { uv = false } = {}) {
  rect(L, x - 2, y - 2, w + 4, h + 4, C.k);
  vgrad(L, x, y, w, h, uv ? ['#1a0f2e', '#21123a'] : ['#b9c8d8', '#c4d2e0', '#cfdbe6']);
  const lw = w / lanes;
  for (let i = 0; i < lanes; i++) rect(L, x + i * lw + lw * 0.2, y + 3, lw * 0.6, 3, uv ? '#000' : '#7f8fa2');
  return lw;
}
export function band(L, x, y, w, { c = '#3b4a66', uv = false, a = 1 } = {}) {
  L.globalAlpha = a;
  if (uv) { L.globalAlpha = 0.35 * a; rect(L, x - 2, y - 2, w + 4, 6, '#ff8a3c'); L.globalAlpha = a; rect(L, x, y, w, 2, '#ffd27a'); }
  else rect(L, x, y, w, 2, c);
  L.globalAlpha = 1;
}

// a rotating double helix (title)
export function helix(L, cx, y0, y1, t, { amp = 26, turns = 2.2, speed = 0.6 } = {}) {
  const n = y1 - y0;
  const pts = [];
  for (let j = 0; j <= n; j++) {
    const ph = (j / n) * turns * Math.PI * 2 + t * speed * Math.PI * 2;
    pts.push([j, Math.sin(ph), Math.cos(ph)]);
  }
  // rungs every 6 px
  for (let j = 0; j <= n; j += 6) {
    const [, s, c] = pts[j];
    const xa = cx + s * amp, xb = cx - s * amp;
    const cols = ['#3fb54a', '#d8344a', '#f7c948', '#3a5fcd'];
    const k = Math.floor(j / 6) % 4;
    line(L, xa, y0 + j, (xa + xb) / 2, y0 + j, cols[k]);
    line(L, (xa + xb) / 2, y0 + j, xb, y0 + j, cols[(k + 2) % 4 === k ? (k + 1) % 4 : [1, 0, 3, 2][k]]);
  }
  for (const [j, s, c] of pts) {
    const front = c > 0;
    rect(L, cx + s * amp - 1, y0 + j, 3, 1, front ? '#e6ecff' : '#6878a8');
    rect(L, cx - s * amp - 1, y0 + j, 3, 1, !front ? '#e6ecff' : '#6878a8');
  }
}

// little item icons (16×16) drawn procedurally
export function icon(L, kind, x, y, t = 0) {
  switch (kind) {
    case 'scissors': line(L, x + 3, y + 3, x + 12, y + 12, C.l, 2); line(L, x + 12, y + 3, x + 3, y + 12, C.l, 2); ring(L, x + 3, y + 13, 2, C.r); ring(L, x + 12, y + 13, 2, C.r); break;
    case 'thread': circle(L, x + 8, y + 8, 5, C.g); ring(L, x + 8, y + 8, 5, C.G); line(L, x + 12, y + 10, x + 15, y + 15, C.l); break;
    case 'lyre': line(L, x + 4, y + 2, x + 4, y + 13, C.y, 2); line(L, x + 12, y + 2, x + 12, y + 13, C.y, 2); rect(L, x + 4, y + 13, 9, 2, C.Y); for (let i = 6; i < 12; i += 2) line(L, i + x, y + 4, i + x, y + 12, C.L); break;
    case 'plasmid': plasmid(L, x + 8, y + 8, 6, [[0.1, 0.3, C.r]], { th: 2 }); break;
    case 'gear': circle(L, x + 8, y + 8, 6, C.e); circle(L, x + 8, y + 8, 2, C.k); for (let a = 0; a < 8; a++) { const g = a / 8 * Math.PI * 2; rect(L, x + 7 + Math.cos(g) * 7, y + 7 + Math.sin(g) * 7, 2, 2, C.e); } break;
    case 'gem': ellipse(L, x + 8, y + 8, 5, 6, C.g); ellipse(L, x + 7, y + 6, 2, 2, C.v); break;
    case 'ship': rect(L, x + 2, y + 10, 12, 3, C.n); line(L, x + 8, y + 2, x + 8, y + 10, C.N); rect(L, x + 9, y + 3, 4, 6, C.w); break;
    case 'book': rect(L, x + 3, y + 2, 10, 12, C.b); rect(L, x + 4, y + 3, 8, 10, C.B); rect(L, x + 5, y + 5, 6, 1, C.y); break;
    case 'flame': ellipse(L, x + 8, y + 9, 4, 6, C.r); ellipse(L, x + 8, y + 10, 2, 3, C.y); break;
    case 'lens': ring(L, x + 7, y + 7, 5, C.y, 2); line(L, x + 11, y + 11, x + 15, y + 15, C.n, 2); break;
    case 'bolt': line(L, x + 10, y + 1, x + 5, y + 8, C.z, 2); line(L, x + 5, y + 8, x + 11, y + 8, C.z, 2); line(L, x + 11, y + 8, x + 6, y + 15, C.z, 2); break;
    case 'light': circle(L, x + 8, y + 8, 4, C.z); circle(L, x + 8, y + 8, 2, C.w); break;
    case 'cog': rect(L, x + 3, y + 3, 10, 10, C.l); rect(L, x + 5, y + 5, 6, 3, C.r); break;
    case 'map': rect(L, x + 2, y + 3, 12, 10, C.t); line(L, x + 4, y + 10, x + 8, y + 6, C.r); line(L, x + 8, y + 6, x + 12, y + 8, C.r); break;
    case 'sword': line(L, x + 3, y + 13, x + 13, y + 3, C.C, 2); line(L, x + 3, y + 9, x + 7, y + 13, C.y, 2); break;
    case 'bag': ellipse(L, x + 8, y + 10, 6, 5, C.t); rect(L, x + 6, y + 3, 4, 3, C.n); break;
  }
}

// dark board behind a diagram, so the strands read on any background
export function board(L, x, y, w, h, { a = 0.78, col = '#0c0f24', edge = '#ffffff' } = {}) {
  L.globalAlpha = a;
  rect(L, x + 2, y, w - 4, h, col); rect(L, x, y + 2, w, h - 4, col); rect(L, x + 1, y + 1, w - 2, h - 2, col);
  L.globalAlpha = 0.25; rect(L, x + 2, y, w - 4, 1, edge); rect(L, x + 2, y + h - 1, w - 4, 1, edge); rect(L, x, y + 2, 1, h - 4, edge); rect(L, x + w - 1, y + 2, 1, h - 4, edge);
  L.globalAlpha = 1;
}
