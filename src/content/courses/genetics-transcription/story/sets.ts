/**
 * Sets, props and the "real cell" insert for「写字室の朝」. The library of「設計図の図書館」by day:
 * the reading hall with tall windows on the LEFT (key light from the left in every hall shot),
 * the annex for bacteria under a skylight, the scriptorium, the corridor of copies and the gate.
 * Static layers are painted once (cached). Transcription always runs left → right on screen.
 */
import { H, L, W, g, rr, CL } from '../../../../engine/story/kit';
import { cached, glow, rng, shaft, noise } from '../../../../engine/story/cine';
import { buildTimeline } from '../../../../engine/story/timeline';
import type { StoryLine } from '../../../../engine/story/types';
import story from './story.json';
export { bust, sheet, paper, slip, inkArrow, blinkAt, talk, MINCHO, HAND } from '../../genetics-basics/story/sets';
import { MINCHO, HAND } from '../../genetics-basics/story/sets';

/** cue times of a scene's lines: c = starts, e = ends (scene time), d = scene length */
export function cues(scene: string) {
  const tl = buildTimeline((story as unknown as { lines: StoryLine[] }).lines);
  const s0 = tl.start[scene] ?? 0, ls = tl.lines.filter((l) => l.scene === scene);
  return { c: ls.map((l) => l.t0 - s0), e: ls.map((l) => l.t1 - s0), d: (tl.end[scene] ?? 0) - s0 };
}

/** text helper; GOTHIC for labels in the inserts (clear, not handwriting) */
export const GOTHIC = '"Zen Kaku Gothic New", "Hiragino Sans", sans-serif';
export function txt(s: string, x: number, y: number, size: number, col: string, a = 1, align: CanvasTextAlign = 'center', font = MINCHO, weight = 700) {
  if (a <= 0) return; g.save(); g.globalAlpha *= Math.min(1, a); g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); g.restore();
}
/** a label on a soft plate so it stays readable over any picture */
export function plate(s: string, x: number, y: number, size: number, col: string, bg: string, a = 1, align: CanvasTextAlign = 'center', font = GOTHIC) {
  if (a <= 0) return; g.save(); g.globalAlpha *= CL(a); g.font = `700 ${size}px ${font}`;
  const w = g.measureText(s).width + size * 0.9, h = size * 1.5, x0 = align === 'center' ? x - w / 2 : align === 'left' ? x - size * 0.45 : x - w + size * 0.45;
  g.fillStyle = bg; rr(x0, y - h * 0.68, w, h, h / 2); g.fill();
  g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); g.restore();
}

/* ====================================================================== */
/* colours shared with the mechanism animations                            */
/* ====================================================================== */
export const COL = { nontemp: '#e9b526', temp: '#2f9ae0', rna: '#f0609a', pol: 'rgba(150,205,240,.62)', polEdge: '#3f84b8', sigma: '#e0703a', ink: '#1f2a3a' };
export const BASE: Record<string, string> = { A: '#ff8a65', T: '#f5c542', G: '#4fb8ec', C: '#6fd28a', U: '#c48af0' };
export const COMP: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
export const RNAOF: Record<string, string> = { A: 'U', T: 'A', G: 'C', C: 'G' };

/* ====================================================================== */
/* the reading hall by day                                                 */
/* ====================================================================== */
const BOOKS = ['#b0614f', '#5d7896', '#c39b58', '#7d6596', '#5f8a6d', '#c07a46', '#8e4a4c', '#6c7a86', '#d0b07a', '#4f6382'];
function shelfWall(c2: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, levels: number, seed: number, dim = 0) {
  const r = rng(seed);
  c2.fillStyle = '#6b4a30'; c2.fillRect(x0 - 10, y0 - 14, x1 - x0 + 20, y1 - y0 + 24);
  c2.fillStyle = '#4e3421'; c2.fillRect(x0, y0, x1 - x0, y1 - y0);
  const lh = (y1 - y0) / levels;
  for (let lv = 0; lv < levels; lv++) {
    const yb = y0 + (lv + 1) * lh;
    let x = x0 + 4;
    while (x < x1 - 8) {
      const w = 9 + r() * 12, h = lh * (0.62 + r() * 0.3);
      c2.fillStyle = BOOKS[Math.floor(r() * BOOKS.length)];
      if (r() < 0.06) { c2.save(); c2.translate(x, yb - 4); c2.rotate(-0.25); c2.fillRect(0, -h, w, h); c2.restore(); x += w + 10; continue; }
      c2.fillRect(x, yb - 4 - h, w, h);
      c2.fillStyle = 'rgba(255,240,210,.18)'; c2.fillRect(x + 1, yb - 4 - h + 4, 2, h - 8);
      if (r() < 0.3) { c2.fillStyle = 'rgba(240,210,140,.55)'; c2.fillRect(x + 1, yb - 4 - h * 0.72, w - 2, 2); }
      x += w + 1;
    }
    c2.fillStyle = '#7a5538'; c2.fillRect(x0 - 6, yb - 4, x1 - x0 + 12, 8);
    c2.fillStyle = 'rgba(0,0,0,.18)'; c2.fillRect(x0, yb + 4, x1 - x0, 4);
  }
  if (dim > 0) { c2.fillStyle = `rgba(250,240,220,${dim})`; c2.fillRect(x0 - 10, y0 - 14, x1 - x0 + 20, y1 - y0 + 24); }
}
function archWindow(c2: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c2.save(); c2.beginPath(); c2.moveTo(x, y + h); c2.lineTo(x, y + w / 2); c2.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c2.lineTo(x + w, y + h); c2.closePath(); c2.clip();
  const sk = c2.createLinearGradient(0, y, 0, y + h); sk.addColorStop(0, '#bfe0ff'); sk.addColorStop(0.7, '#fff3d6'); sk.addColorStop(1, '#ffe7b8');
  c2.fillStyle = sk; c2.fillRect(x, y, w, h);
  // trees and roofs outside, pale
  c2.fillStyle = 'rgba(120,170,120,.35)'; for (let i = 0; i < 5; i++) { c2.beginPath(); c2.arc(x + (i + 0.5) * w / 5, y + h * 0.82, w * 0.16, 0, 7); c2.fill(); }
  c2.restore();
  c2.strokeStyle = '#f7f0e2'; c2.lineWidth = 10; c2.beginPath(); c2.moveTo(x, y + h); c2.lineTo(x, y + w / 2); c2.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c2.lineTo(x + w, y + h); c2.stroke();
  c2.strokeStyle = '#d8c8a8'; c2.lineWidth = 4; c2.beginPath(); c2.moveTo(x + w / 2, y); c2.lineTo(x + w / 2, y + h);
  for (let k = 1; k < 5; k++) { c2.moveTo(x, y + w / 2 + k * (h - w / 2) / 5); c2.lineTo(x + w, y + w / 2 + k * (h - w / 2) / 5); } c2.stroke();
  c2.fillStyle = '#efe4cc'; c2.fillRect(x - 16, y + h, w + 32, 14);
}
/** the hall: cream walls, arched windows on the left, shelves on the back wall, honey floor, lectern and counter */
export const hall = () => cached('tx-hall', W, H, (c2) => {
  const wall = c2.createLinearGradient(0, 0, 0, 620); wall.addColorStop(0, '#f3ead8'); wall.addColorStop(1, '#e6d6b8');
  c2.fillStyle = wall; c2.fillRect(0, 0, W, H);
  // cornice and pilasters
  c2.fillStyle = '#e9dcc2'; c2.fillRect(0, 0, W, 52); c2.fillStyle = '#d8c7a6'; c2.fillRect(0, 50, W, 6);
  archWindow(c2, 50, 96, 150, 420); archWindow(c2, 250, 96, 150, 420);
  shelfWall(c2, 470, 1250, 120, 600, 7, 31);
  // ladder on the shelf
  c2.strokeStyle = '#8a6440'; c2.lineWidth = 8; c2.beginPath(); c2.moveTo(1070, 140); c2.lineTo(1120, 610); c2.moveTo(1130, 140); c2.lineTo(1180, 610); c2.stroke();
  c2.lineWidth = 5; for (let k = 0; k < 9; k++) { const yy = 180 + k * 50; c2.beginPath(); c2.moveTo(1074 + (yy - 140) * 0.106, yy); c2.lineTo(1134 + (yy - 140) * 0.106, yy); c2.stroke(); }
  // floor
  const fl = c2.createLinearGradient(0, 600, 0, H); fl.addColorStop(0, '#c99a62'); fl.addColorStop(1, '#a8743e'); c2.fillStyle = fl; c2.fillRect(0, 600, W, H - 600);
  c2.strokeStyle = 'rgba(90,55,25,.25)'; c2.lineWidth = 1.5; for (let X = -1400; X < 2700; X += 80) { c2.beginPath(); c2.moveTo(640 + (X - 640) * 0.3, 600); c2.lineTo(X, H); c2.stroke(); }
  for (let y = 612; y < H; y += 22 + (y - 600) * 0.12) { c2.beginPath(); c2.moveTo(0, y); c2.lineTo(W, y); c2.stroke(); }
  c2.fillStyle = '#d8c6a4'; c2.fillRect(0, 596, W, 8);
  // a long green runner
  c2.fillStyle = '#5f7f62'; c2.beginPath(); c2.moveTo(560, 604); c2.lineTo(780, 604); c2.lineTo(980, H); c2.lineTo(420, H); c2.fill();
  c2.strokeStyle = '#d7c27a'; c2.lineWidth = 3; c2.beginPath(); c2.moveTo(574, 608); c2.lineTo(436, H); c2.moveTo(766, 608); c2.lineTo(964, H); c2.stroke();
  // potted plant by the windows
  c2.fillStyle = '#b5683e'; rr(415, 540, 44, 60, 6); c2.fill();
  c2.fillStyle = '#5c8a4e'; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28; c2.beginPath(); c2.ellipse(437 + Math.cos(a) * 34, 520 + Math.sin(a) * 40, 10, 30, a + Math.PI / 2, 0, 7); c2.fill(); }
});
/** morning sun through the left windows: two beams across the floor, motes in them */
export function sun(t: number, k = 1, warm = 0) {
  const col = warm > 0 ? 'rgba(255,226,170,' : 'rgba(255,244,210,';
  shaft(125, 120, 150, 560, H + 40, 420, `${col}${0.42 * k})`, 1);
  shaft(325, 120, 150, 860, H + 40, 440, `${col}${0.36 * k})`, 1);
  for (let i = 0; i < 46; i++) {
    const u = ((i * 0.137 + t * 0.012 * (1 + (i % 3))) % 1), b = i % 2;
    const x = L(140 + b * 200, 600 + b * 300, u) + noise(t * 0.3 + i, i) * 40, y = L(140, H, u) + noise(t * 0.25 + i * 3, i + 7) * 30;
    g.fillStyle = `rgba(255,250,230,${0.5 * k * (0.4 + 0.6 * Math.abs(Math.sin(t + i)))})`; g.beginPath(); g.arc(x, y, 1.4 + (i % 3) * 0.5, 0, 7); g.fill();
  }
}
/** the lectern with the open original (two strands as two rows of letters) */
export function lectern(x: number, y: number, s = 1, open = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#5a3a22'; g.fillRect(-14, 0, 28, 190); g.fillStyle = '#4a2f1b'; rr(-70, 186, 140, 16, 5); g.fill();
  g.fillStyle = '#7a5134'; g.beginPath(); g.moveTo(-150, -6); g.lineTo(150, -30); g.lineTo(156, 6); g.lineTo(-146, 26); g.fill();
  // the book
  g.save(); g.rotate(-0.08);
  g.fillStyle = '#2e4a72'; rr(-140, -46, 280, 40, 4); g.fill();
  g.fillStyle = '#f4ead4'; rr(-134, -52, 130 * open + 2, 40, 2); g.fill(); rr(4, -52, 130, 40, 2); g.fill();
  g.fillStyle = COL.nontemp; for (let i = 0; i < 9; i++) g.fillRect(-124 + i * 13.5, -44, 9, 6);
  g.fillStyle = COL.temp; for (let i = 0; i < 9; i++) g.fillRect(-124 + i * 13.5, -28, 9, 6);
  g.fillStyle = COL.nontemp; for (let i = 0; i < 9; i++) g.fillRect(14 + i * 13.5, -44, 9, 6);
  g.fillStyle = COL.temp; for (let i = 0; i < 9; i++) g.fillRect(14 + i * 13.5, -28, 9, 6);
  g.restore();
  g.restore();
}
/** the reception counter of the main hall (the promoter desk), front view */
export function counter(x: number, y: number, w: number) {
  g.fillStyle = '#7a5134'; rr(x - w / 2, y - 120, w, 18, 4); g.fill();
  const fr = g.createLinearGradient(0, y - 104, 0, y); fr.addColorStop(0, '#6a452b'); fr.addColorStop(1, '#4e321e'); g.fillStyle = fr; g.fillRect(x - w / 2 + 10, y - 104, w - 20, 104);
  g.strokeStyle = 'rgba(255,230,190,.18)'; g.lineWidth = 2; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x - w / 2 + 10 + k * (w - 20) / 5, y - 100); g.lineTo(x - w / 2 + 10 + k * (w - 20) / 5, y - 6); g.stroke(); }
}

/** the request slip motif, with the order written on it */
export function slipBig(x: number, y: number, w: number, a: number, alpha = 1) {
  if (alpha <= 0) return;
  const h = w * 0.62;
  g.save(); g.translate(x, y); g.rotate(a); g.globalAlpha *= alpha;
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
  g.fillStyle = '#f6eedb'; g.fillRect(-w / 2, -h / 2, w, h);
  g.strokeStyle = 'rgba(40,90,60,.7)'; g.lineWidth = Math.max(1, w * 0.008); g.strokeRect(-w / 2 + w * 0.04, -h / 2 + w * 0.04, w * 0.92, h - w * 0.08);
  const f = (s: string, yy: number, sz: number, col = '#2a2a2a', al: CanvasTextAlign = 'left') => { g.font = `600 ${sz}px ${HAND}`; g.fillStyle = col; g.textAlign = al; g.fillText(s, al === 'left' ? -w * 0.4 : 0, yy); };
  f('閲覧票', -h * 0.26, w * 0.075, '#2b5a3c', 'center');
  f('窓口：肝臓', -h * 0.04, w * 0.06);
  f('グルコキナーゼの写し 一部', h * 0.14, w * 0.06);
  f('期限：正午', h * 0.32, w * 0.06, '#b03232');
  g.restore();
}
/** a wall clock (brass rim, cream face) */
export function wallClock(x: number, y: number, r: number, hh: number, mm: number) {
  g.fillStyle = '#b8923f'; g.beginPath(); g.arc(x, y, r * 1.12, 0, 7); g.fill();
  g.fillStyle = '#fbf5e6'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.strokeStyle = '#3a3024'; g.lineWidth = Math.max(1, r * 0.04);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.sin(a) * r * 0.82, y - Math.cos(a) * r * 0.82); g.lineTo(x + Math.sin(a) * r * 0.94, y - Math.cos(a) * r * 0.94); g.stroke(); }
  const hr = ((hh % 12 + mm / 60) / 12) * Math.PI * 2, mn = (mm / 60) * Math.PI * 2;
  g.lineCap = 'round'; g.lineWidth = r * 0.09; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(hr) * r * 0.5, y - Math.cos(hr) * r * 0.5); g.stroke();
  g.lineWidth = r * 0.06; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(mn) * r * 0.78, y - Math.cos(mn) * r * 0.78); g.stroke();
  g.fillStyle = '#3a3024'; g.beginPath(); g.arc(x, y, r * 0.07, 0, 7); g.fill();
}

/* ====================================================================== */
/* the copy: a pink paper ribbon (the RNA in the story)                    */
/* ====================================================================== */
/** a ribbon along a polyline; parts: optional exon/intron colouring [from,to,kind] in 0..1 of its length */
export function ribbon(pts: [number, number][], w: number, opt: { cap?: number; tail?: number; parts?: [number, number, 'ex' | 'in'][]; letters?: string; alpha?: number } = {}) {
  if (pts.length < 2) return;
  const a = opt.alpha ?? 1; if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.lineCap = 'round'; g.lineJoin = 'round';
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
  g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = w + 3; g.save(); g.translate(2, 4); path(); g.stroke(); g.restore();
  g.strokeStyle = '#ffd9e6'; g.lineWidth = w; path(); g.stroke();
  // lengths
  const seg: number[] = [0]; for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = seg[seg.length - 1] || 1;
  const at = (u: number): [number, number, number] => { const s = u * tot; let i = 1; while (i < seg.length - 1 && seg[i] < s) i++; const k = (s - seg[i - 1]) / ((seg[i] - seg[i - 1]) || 1); const ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]); return [L(pts[i - 1][0], pts[i][0], k), L(pts[i - 1][1], pts[i][1], k), ang]; };
  if (opt.parts) for (const [u0, u1, kind] of opt.parts) {
    g.strokeStyle = kind === 'ex' ? '#f0609a' : '#d9c9b8'; g.lineWidth = w * 0.62; g.lineCap = 'butt'; g.beginPath();
    for (let s = 0; s <= 24; s++) { const [x, y] = at(L(u0, u1, s / 24)); if (s) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  }
  else { g.strokeStyle = 'rgba(240,96,154,.55)'; g.lineWidth = 2; g.lineCap = 'butt'; for (let s = 0.02; s < 0.99; s += 18 / tot) { const [x, y, an] = at(s); g.beginPath(); g.moveTo(x - Math.sin(an) * w * 0.3, y + Math.cos(an) * w * 0.3); g.lineTo(x + Math.sin(an) * w * 0.3, y - Math.cos(an) * w * 0.3); g.stroke(); } }
  if (opt.letters) { const n = opt.letters.length; for (let i = 0; i < n; i++) { const [x, y] = at((i + 0.5) / n); g.font = `700 ${Math.round(w * 0.62)}px ${GOTHIC}`; g.textAlign = 'center'; g.fillStyle = '#7a2148'; g.fillText(opt.letters[i], x, y + w * 0.22); } }
  if (opt.cap && opt.cap > 0) { const [x, y] = at(0); g.globalAlpha = a * CL(opt.cap); g.fillStyle = '#3f6aa8'; g.beginPath(); g.arc(x, y, w * 0.75, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = `700 ${Math.round(w * 0.5)}px ${GOTHIC}`; g.textAlign = 'center'; g.fillText('m⁷G', x, y + w * 0.18); g.globalAlpha = a; }
  if (opt.tail && opt.tail > 0) { const [x, y, an] = at(1); g.globalAlpha = a * CL(opt.tail); g.strokeStyle = '#e8a33a'; g.lineWidth = w * 0.35; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * w * 3 * CL(opt.tail), y + Math.sin(an) * w * 3 * CL(opt.tail)); g.stroke(); g.globalAlpha = a; }
  g.restore();
}

/* ====================================================================== */
/* the "real cell" insert: a pale blueprint card with clear labels         */
/* ====================================================================== */
export const insertBg = () => cached('tx-insert', W, H, (c2) => {
  const bg = c2.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#f2f7fc'); bg.addColorStop(1, '#e3edf7'); c2.fillStyle = bg; c2.fillRect(0, 0, W, H);
  c2.strokeStyle = 'rgba(80,130,190,.12)'; c2.lineWidth = 1; for (let x = 0; x < W; x += 32) { c2.beginPath(); c2.moveTo(x, 0); c2.lineTo(x, H); c2.stroke(); } for (let y = 0; y < H; y += 32) { c2.beginPath(); c2.moveTo(0, y); c2.lineTo(W, y); c2.stroke(); }
  c2.strokeStyle = 'rgba(80,130,190,.22)'; for (let x = 0; x < W; x += 160) { c2.beginPath(); c2.moveTo(x, 0); c2.lineTo(x, H); c2.stroke(); } for (let y = 0; y < H; y += 160) { c2.beginPath(); c2.moveTo(0, y); c2.lineTo(W, y); c2.stroke(); }
  const v = c2.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,70,110,.18)'); c2.fillStyle = v; c2.fillRect(0, 0, W, H);
});
/** full-frame insert: background, "実際の細胞では" tag (top-left), organism badge (top-right), title */
export function insert(title: string, org: '細菌（原核生物）' | 'ヒト（真核生物）' | '' , a: number, body: () => void, src = '') {
  g.drawImage(insertBg(), 0, 0);
  body();
  plate('実際の細胞では', 36, 52, 22, '#ffffff', '#1f3a5f', a, 'left');
  if (title) txt(title, W / 2, 56, 30, COL.ink, a, 'center', GOTHIC);
  if (org) plate(org, W - 36, 52, 20, '#ffffff', org.startsWith('細菌') ? '#c25a26' : '#2f6f9f', a, 'right');
  if (src) txt(src, W - 30, H - 22, 15, '#5a6b80', a, 'right', GOTHIC, 600);
}

/* ---------- molecules (inserts) ---------- */
/** one strand with base ticks; dir5 = which end is 5' ('l' | 'r') */
export function strand(pts: [number, number][], col: string, w = 9) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke();
}
export function endTag(s: string, x: number, y: number, col: string, a = 1, size = 22) { txt(s, x, y + size * 0.35, size, col, a, 'center', GOTHIC, 800); }
/** a base tile with its letter */
export function baseTile(ch: string, x: number, y: number, s: number, a = 1, hl = 0) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= CL(a);
  g.fillStyle = BASE[ch] || '#999'; rr(x - s / 2, y - s / 2, s, s, s * 0.2); g.fill();
  if (hl > 0) { g.strokeStyle = `rgba(31,42,58,${hl})`; g.lineWidth = 3; rr(x - s / 2 - 3, y - s / 2 - 3, s + 6, s + 6, s * 0.24); g.stroke(); }
  g.font = `800 ${Math.round(s * 0.62)}px ${GOTHIC}`; g.textAlign = 'center'; g.fillStyle = '#1f2a3a'; g.fillText(ch, x, y + s * 0.22);
  g.restore();
}
/** RNA polymerase: a soft rounded clamp shape, light blue */
export function polymerase(x: number, y: number, rx: number, ry: number, a = 1, label = 'RNAポリメラーゼ', labelY = -1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= CL(a);
  g.fillStyle = COL.pol; g.strokeStyle = COL.polEdge; g.lineWidth = 3;
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x - rx * 0.3, y - ry * 0.45, rx * 0.45, ry * 0.22, -0.2, 0, 7); g.fill();
  g.restore();
  if (label) plate(label, x, y + labelY * (ry + 22), 18, '#ffffff', COL.polEdge, a);
}
/** a protein blob with a name */
export function blob(x: number, y: number, rx: number, ry: number, col: string, name: string, a = 1, textCol = '#ffffff', size = 18) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= CL(a);
  g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(x - rx * 0.25, y - ry * 0.4, rx * 0.5, ry * 0.25, 0, 0, 7); g.fill();
  g.restore();
  if (name) txt(name, x, y + size * 0.36, size, textCol, a, 'center', GOTHIC, 800);
}
/** an arrow (screen coords), drawn progressively */
export function arrowP(x1: number, y1: number, x2: number, y2: number, col: string, p: number, w = 4) {
  if (p <= 0) return; const x = L(x1, x2, CL(p)), y = L(y1, y2, CL(p));
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.stroke();
  if (p >= 0.98) { const an = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2 + Math.cos(an) * 4, y2 + Math.sin(an) * 4); g.lineTo(x2 - 16 * Math.cos(an - 0.45), y2 - 16 * Math.sin(an - 0.45)); g.lineTo(x2 - 16 * Math.cos(an + 0.45), y2 - 16 * Math.sin(an + 0.45)); g.fill(); }
}
/** inhibition bar (⊣) */
export function bar(x1: number, y1: number, x2: number, y2: number, col: string, p: number, w = 4) {
  if (p <= 0) return; const x = L(x1, x2, CL(p)), y = L(y1, y2, CL(p));
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.stroke();
  if (p >= 0.98) { const an = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2; g.beginPath(); g.moveTo(x2 + Math.cos(an) * 14, y2 + Math.sin(an) * 14); g.lineTo(x2 - Math.cos(an) * 14, y2 - Math.sin(an) * 14); g.stroke(); }
}

/* ====================================================================== */
/* other rooms                                                             */
/* ====================================================================== */
/** the annex for bacteria: a small round whitewashed room under a skylight, one long table */
export const annex = () => cached('tx-annex', W, H, (c2) => {
  const wall = c2.createLinearGradient(0, 0, 0, 600); wall.addColorStop(0, '#eef2ec'); wall.addColorStop(1, '#dfe6dc'); c2.fillStyle = wall; c2.fillRect(0, 0, W, H);
  // curved wall courses
  c2.strokeStyle = 'rgba(120,140,120,.15)'; c2.lineWidth = 2; for (let y = 90; y < 600; y += 46) { c2.beginPath(); c2.moveTo(0, y + 20); c2.quadraticCurveTo(640, y - 26, W, y + 20); c2.stroke(); }
  // the skylight
  c2.fillStyle = '#d0dccd'; c2.beginPath(); c2.ellipse(640, 18, 260, 60, 0, 0, 7); c2.fill();
  const sk = c2.createRadialGradient(640, 18, 10, 640, 18, 230); sk.addColorStop(0, '#ffffff'); sk.addColorStop(1, '#cfe8ff'); c2.fillStyle = sk; c2.beginPath(); c2.ellipse(640, 18, 220, 46, 0, 0, 7); c2.fill();
  // low round shelves left and right
  shelfWall(c2, 40, 360, 250, 560, 4, 71, 0.08); shelfWall(c2, 920, 1240, 250, 560, 4, 73, 0.08);
  // floor: pale stone tiles in a circle
  const fl = c2.createLinearGradient(0, 580, 0, H); fl.addColorStop(0, '#d7d2c4'); fl.addColorStop(1, '#b9b2a0'); c2.fillStyle = fl; c2.fillRect(0, 580, W, H - 580);
  c2.strokeStyle = 'rgba(80,70,50,.18)'; c2.lineWidth = 1.5; for (let k = 1; k < 8; k++) { c2.beginPath(); c2.ellipse(640, 640, k * 110, k * 22, 0, 0, 7); c2.stroke(); }
  c2.fillStyle = '#c8c0ac'; c2.fillRect(0, 576, W, 8);
  // plants
  [[400, 560], [880, 560]].forEach(([x, y]) => { c2.fillStyle = '#9a6a48'; rr(x - 20, y - 10, 40, 34, 6); c2.fill(); c2.fillStyle = '#6a9a5a'; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; c2.beginPath(); c2.ellipse(x + Math.cos(a) * 26, y - 22 + Math.sin(a) * 30, 8, 24, a + Math.PI / 2, 0, 7); c2.fill(); } });
});
/** a long table with a scroll (the bacterial genome: one long circular scroll) */
export function annexTable(x: number, y: number, w: number) {
  g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(x, y + 120, w * 0.55, 18, 0, 0, 7); g.fill();
  g.fillStyle = '#8a6440'; g.fillRect(x - w / 2 + 30, y + 10, 16, 110); g.fillRect(x + w / 2 - 46, y + 10, 16, 110);
  g.fillStyle = '#b08458'; rr(x - w / 2, y - 6, w, 22, 6); g.fill(); g.fillStyle = '#c69a6c'; rr(x - w / 2, y - 10, w, 10, 5); g.fill();
}
/** the scriptorium by day: big window on the left, Spra's long work table */
export const scriptorium = () => cached('tx-script', W, H, (c2) => {
  const wall = c2.createLinearGradient(0, 0, 0, 560); wall.addColorStop(0, '#f1e6d2'); wall.addColorStop(1, '#e2d0b0'); c2.fillStyle = wall; c2.fillRect(0, 0, W, H);
  archWindow(c2, 70, 70, 260, 420);
  shelfWall(c2, 760, 1240, 110, 470, 5, 91, 0.05);
  // pigeonholes of copies
  c2.fillStyle = '#7a5538'; c2.fillRect(420, 150, 280, 240); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c2.fillStyle = '#4e3421'; c2.fillRect(430 + i * 68, 160 + j * 57, 60, 49); c2.fillStyle = ['#ffd9e6', '#f6eedb', '#ffe2ec', '#efe2c8'][(i + j) % 4]; c2.beginPath(); c2.arc(460 + i * 68, 190 + j * 57, 14, 0, 7); c2.fill(); }
  const fl = c2.createLinearGradient(0, 560, 0, H); fl.addColorStop(0, '#b98b58'); fl.addColorStop(1, '#93653a'); c2.fillStyle = fl; c2.fillRect(0, 560, W, H - 560);
  c2.fillStyle = '#d2bf9c'; c2.fillRect(0, 556, W, 8);
});
/** the corridor to the gate: shelves of rolled copies, windows left, the round gate far right */
export const corridor = () => cached('tx-corr', W, H, (c2) => {
  const wall = c2.createLinearGradient(0, 0, 0, 600); wall.addColorStop(0, '#f0e7d6'); wall.addColorStop(1, '#e0d0b4'); c2.fillStyle = wall; c2.fillRect(0, 0, W, H);
  const r = rng(5);
  // shelves of scrolls in perspective toward the right
  for (let k = 0; k < 7; k++) {
    const x = 60 + k * 150, s = 1 - k * 0.09, top = 140 + k * 14, bot = 600 - k * 10;
    c2.fillStyle = '#6b4a30'; c2.fillRect(x, top, 120 * s, bot - top);
    for (let lv = 0; lv < 5; lv++) {
      const yb = top + (lv + 1) * (bot - top) / 5;
      c2.fillStyle = '#4e3421'; c2.fillRect(x + 6, yb - (bot - top) / 5 + 6, 120 * s - 12, (bot - top) / 5 - 10);
      for (let q = 0; q < 4; q++) { c2.fillStyle = ['#ffd9e6', '#f6e4ee', '#e9d6f2', '#ffe9d2'][Math.floor(r() * 4)]; c2.beginPath(); c2.arc(x + 20 * s + q * 26 * s, yb - 18 * s, 11 * s, 0, 7); c2.fill(); c2.strokeStyle = 'rgba(160,80,110,.4)'; c2.lineWidth = 1.5; c2.beginPath(); c2.arc(x + 20 * s + q * 26 * s, yb - 18 * s, 5 * s, 0, 7); c2.stroke(); }
      c2.fillStyle = '#7a5538'; c2.fillRect(x, yb - 4, 120 * s, 6);
    }
  }
  const fl = c2.createLinearGradient(0, 600, 0, H); fl.addColorStop(0, '#c99a62'); fl.addColorStop(1, '#a8743e'); c2.fillStyle = fl; c2.fillRect(0, 600, W, H - 600);
  c2.strokeStyle = 'rgba(90,55,25,.22)'; c2.lineWidth = 1.5; for (let X = -1400; X < 2700; X += 80) { c2.beginPath(); c2.moveTo(1180 + (X - 1180) * 0.2, 600); c2.lineTo(X, H); c2.stroke(); }
  c2.fillStyle = '#d8c6a4'; c2.fillRect(0, 596, W, 8);
  // the gate glowing at the end
  const gx = 1150, gy = 400;
  c2.fillStyle = '#b8923f'; c2.beginPath(); c2.arc(gx, gy, 92, 0, 7); c2.fill();
  const gl = c2.createRadialGradient(gx, gy, 10, gx, gy, 80); gl.addColorStop(0, '#fffbe8'); gl.addColorStop(1, '#ffe3a0'); c2.fillStyle = gl; c2.beginPath(); c2.arc(gx, gy, 76, 0, 7); c2.fill();
  c2.fillStyle = '#8a6a2c'; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c2.beginPath(); c2.arc(gx + Math.cos(a) * 84, gy + Math.sin(a) * 84, 12, 0, 7); c2.fill(); }
});
/** the gate (nuclear pore analogy) seen frontally, the bright courtyard (cytoplasm) beyond */
export const gateWall = () => cached('tx-gate', W, H, (c2) => {
  c2.fillStyle = '#e8dcc4'; c2.fillRect(0, 0, W, H);
  c2.strokeStyle = 'rgba(120,100,70,.12)'; c2.lineWidth = 2; for (let y = 30; y < 620; y += 40) { c2.beginPath(); c2.moveTo(0, y); c2.lineTo(W, y); c2.stroke(); for (let x = (y / 40) % 2 ? 0 : 60; x < W; x += 120) { c2.beginPath(); c2.moveTo(x, y); c2.lineTo(x, y + 40); c2.stroke(); } }
  const gx = 640, gy = 380, R = 210;
  // courtyard seen through the gate
  c2.save(); c2.beginPath(); c2.arc(gx, gy, R - 30, 0, 7); c2.clip();
  const sky = c2.createLinearGradient(0, gy - R, 0, gy + R); sky.addColorStop(0, '#a8d8ff'); sky.addColorStop(0.6, '#fff1d0'); sky.addColorStop(1, '#cfe3b0'); c2.fillStyle = sky; c2.fillRect(gx - R, gy - R, R * 2, R * 2);
  c2.fillStyle = '#86b46c'; c2.fillRect(gx - R, gy + 70, R * 2, R);
  c2.fillStyle = 'rgba(255,255,255,.8)'; [[-90, -90], [60, -120], [120, -60]].forEach(([dx, dy]) => { c2.beginPath(); c2.ellipse(gx + dx, gy + dy, 44, 16, 0, 0, 7); c2.fill(); });
  // little workshops (ribosomes) in the courtyard
  c2.fillStyle = '#d9a35a'; [[-110, 90], [-20, 110], [80, 95], [150, 120]].forEach(([dx, dy]) => { c2.beginPath(); c2.ellipse(gx + dx, gy + dy, 22, 15, 0, 0, 7); c2.fill(); c2.fillStyle = '#e8bb72'; c2.beginPath(); c2.ellipse(gx + dx, gy + dy - 14, 15, 10, 0, 0, 7); c2.fill(); c2.fillStyle = '#d9a35a'; });
  c2.restore();
  // the ring of eight pillars
  c2.strokeStyle = '#a8833a'; c2.lineWidth = 36; c2.beginPath(); c2.arc(gx, gy, R - 12, 0, 7); c2.stroke();
  c2.strokeStyle = '#d2b06a'; c2.lineWidth = 6; c2.beginPath(); c2.arc(gx, gy, R - 26, 0, 7); c2.stroke();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; c2.fillStyle = '#8a6a2c'; c2.beginPath(); c2.arc(gx + Math.cos(a) * (R - 12), gy + Math.sin(a) * (R - 12), 24, 0, 7); c2.fill(); c2.fillStyle = '#c9a050'; c2.beginPath(); c2.arc(gx + Math.cos(a) * (R - 12) - 6, gy + Math.sin(a) * (R - 12) - 6, 9, 0, 7); c2.fill(); }
  const fl = c2.createLinearGradient(0, 620, 0, H); fl.addColorStop(0, '#c99a62'); fl.addColorStop(1, '#a8743e'); c2.fillStyle = fl; c2.fillRect(0, 620, W, H - 620);
  c2.fillStyle = '#d8c6a4'; c2.fillRect(0, 616, W, 8);
});
/** soft daylight wash over a frame */
export function daylight(k = 1) { glow(260, 160, 900, 'rgba(255,246,220,.35)', k); }
export { glow };
