/**
 * Scenes of the 完成版 (第1講まるごと): title, cleavage, board, transcription, translation, 転写/翻訳 contrast,
 * universality, the levels of life, disease, the line from gene to disease, end card — and the chapter cards.
 *
 * Biology kept exact (and identical in every intensity):
 *  - DNA: right-handed double helix, unequal major / minor grooves; base pairs A–T, G–C.
 *  - Transcription: RNA polymerase opens a bubble and copies the template strand; the RNA is
 *    complementary to the template = the coding strand's sequence with U for T.
 *  - Translation: the ribosome reads the mRNA 3 bases (a codon) at a time; codons → amino acids follow the
 *    standard genetic code (AUG Met, GCU Ala, UUC Phe, GGA Gly, AAA Lys, UGG Trp). tRNA is left out (第4講).
 *  - Cleavage: the zygote (two pronuclei) divides inside the zona pellucida; the cells get smaller.
 *  - Bacteria have no nucleus (the DNA lies in the nucleoid). Chromosome 21 is a small acrocentric chromosome.
 *  - No patient faces are drawn.
 */
import type { BoardOp } from '../board/types';
import type { SceneDef } from './types';
import type { Pen } from './pen';
import { CHALK, INK, chalkBox, chalkOp, type ChalkMap } from './diagrams';
import { H, W, ease } from './gekiga';
import { CL, rnd, label, slate, lecturer, hall, voidInk, streaks, type RC } from './render-kit';
import { bindCtx } from '../story/kit';
import { perform } from '../story/mocap';
import { sideCam, silhouette } from '../story/mv/common';

const BASE: Record<string, string> = { A: '#ff6b5b', T: '#ffd84a', G: '#58c47a', C: '#5aa9ff', U: '#c38bff' };
const PAIR: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const CODING = 'ATGGCTTTCGGAAAATGGCTGATTGCGTACGGTCATGA';
const CODONS: [string, string][] = [['AUG', 'Met'], ['GCU', 'Ala'], ['UUC', 'Phe'], ['GGA', 'Gly'], ['AAA', 'Lys'], ['UGG', 'Trp']];
/** progress (0..1) of the time between two events */
const between = (rc: RC, a: string, b: string, e = (x: number) => x) => { const t0 = rc.ev(a), t1 = rc.ev(b); return Number.isFinite(t0) && Number.isFinite(t1) ? e(CL((rc.t - t0) / Math.max(0.01, t1 - t0))) : 0; };
const term = (p: Pen, s: string, x: number, y: number, k: number, size = 96, col = '#fff') => {
  if (k <= 0) return;
  p.save(); p.translate(x, y); p.scale(1 + 0.8 * (1 - ease.outExpo(k))); p.alpha(CL(k * 3));
  p.text(s, 0, 0, { size, font: 'brush', weight: 400, fill: col, stroke: INK, strokeW: size * 0.2, align: 'center' });
  p.restore();
};

/* ---------- shared figure parts (Pen → canvas or SVG) ---------- */
/** right-handed double helix along x; the two backbones are offset by ~0.38 turn so the grooves differ (major / minor) */
export function helix(p: Pen, x0: number, x1: number, cy: number, amp: number, period: number, phase: number, o: { ink?: string; light?: string; bases?: boolean; lw?: number } = {}) {
  const ink = o.ink ?? '#d9e6f2', lw = o.lw ?? 5, off = 0.76 * Math.PI;
  const pts = (ph: number) => { const r: [number, number][] = []; for (let x = x0; x <= x1; x += 6) r.push([x, cy + amp * Math.sin(((x - x0) / period) * 2 * Math.PI + phase + ph)]); return r; };
  const bp = period / 10.5;
  if (o.bases !== false) for (let x = x0 + bp / 2, i = 0; x < x1; x += bp, i++) {
    const th = ((x - x0) / period) * 2 * Math.PI + phase;
    const ya = cy + amp * Math.sin(th), yb = cy + amp * Math.sin(th + off), b = CODING[i % CODING.length];
    const mid = (ya + yb) / 2;
    p.line([[x, ya], [x, mid]], { stroke: BASE[b], width: 4, opacity: 0.85 });
    p.line([[x, mid], [x, yb]], { stroke: BASE[PAIR[b]], width: 4, opacity: 0.85 });
  }
  p.line(pts(off), { stroke: INK, width: lw + 4 }); p.line(pts(off), { stroke: o.light ?? '#8fa3b5', width: lw });
  p.line(pts(0), { stroke: INK, width: lw + 4 }); p.line(pts(0), { stroke: ink, width: lw });
}
function cellCircle(p: Pen, x: number, y: number, r: number, o: { fill?: string; nucleus?: boolean; glow?: number } = {}) {
  p.circle(x, y, r, { fill: o.fill ?? '#e8d9c2', stroke: INK, width: Math.max(1.2, r * 0.08) });
  if (o.nucleus !== false) p.circle(x + r * 0.08, y - r * 0.05, r * 0.36, { fill: '#9c86b8', stroke: INK, width: Math.max(1, r * 0.05) });
  if (o.glow) p.circle(x + r * 0.08, y - r * 0.05, r * 0.5, { fill: `rgba(255,230,120,${0.5 * o.glow})` });
}
/** small acrocentric chromosome (two sister chromatids, centromere near the top, short p arm with satellite) */
export function chromosome21(p: Pen, x: number, y: number, s: number, col = '#e7dccb') {
  p.save(); p.translate(x, y); p.scale(s);
  for (const dx of [-9, 9]) {
    p.rect(dx - 8, -12, 16, 74, { fill: col, stroke: INK, width: 3 }, 8);
    p.rect(dx - 6, -26, 12, 10, { fill: col, stroke: INK, width: 2.4 }, 5);
    p.circle(dx, -31, 4, { fill: col, stroke: INK, width: 2 });
    for (const by of [8, 26, 44]) p.line([[dx - 8, by], [dx + 8, by]], { stroke: INK, width: 3, opacity: 0.55 });
  }
  p.ellipse(0, -14, 14, 5, 0, { fill: INK });
  p.restore();
}
function geneBar(p: Pen, x: number, y: number, w: number, mut: number, name: string, k: number) {
  if (k <= 0) return;
  p.save(); p.alpha(CL(k * 3));
  p.line([[x, y], [x + w, y]], { stroke: '#cfcfcf', width: 4 });
  const ex = [[0, 0.12], [0.22, 0.33], [0.44, 0.52], [0.63, 0.78], [0.86, 1]];
  ex.forEach(([a, b]) => p.rect(x + a * w, y - 16, (b - a) * w, 32, { fill: '#5aa9ff', stroke: INK, width: 3 }, 4));
  const mx = x + mut * w;
  p.line([[mx, y - 30], [mx, y + 30]], { stroke: '#ff4a3a', width: 6 });
  p.circle(mx, y - 36, 9, { fill: '#ff4a3a', stroke: INK, width: 2.5 });
  p.text(name, x, y - 46, { size: 28, font: 'gothic', weight: 900, fill: '#fff', stroke: INK, strokeW: 6 });
  p.restore();
}
function bacterium(p: Pen, x: number, y: number, s: number) {
  p.save(); p.translate(x, y); p.scale(s);
  p.rect(-90, -34, 180, 68, { fill: '#c9d9b8', stroke: INK, width: 5 }, 34);
  p.path('M -50 0 C -35 -18 -20 18 -5 0 S 25 -18 40 0 S 60 16 52 6', { stroke: '#7a4f9e', width: 4 });
  p.restore();
}
function protein(p: Pen, x: number, y: number, s: number, a = 1) {
  p.save(); p.translate(x, y); p.scale(s); p.alpha(a);
  p.path('M -60 10 C -70 -40 -20 -60 0 -30 S 50 -60 60 -10 S 30 50 0 40 S -50 60 -60 10 Z', { fill: '#e2a65a', stroke: INK, width: 5 });
  p.path('M -40 0 C -20 -25 10 20 30 -5', { stroke: '#8a5a1f', width: 4 });
  p.restore();
}
function human(rc: RC, x: number, feetY: number, scale: number, col = '#e8d9c2', rim = 'rgba(255,255,255,0.8)') {
  const { g, ts, t } = rc;
  const pose = perform([{ clip: 'stand', at: ts.t0 - 1, from: 1, x: 0, z: 0, face: 0 }], t);
  bindCtx(g);
  g.save(); g.translate(x, feetY); g.scale(scale, scale); g.translate(-W / 2, -510);
  silhouette(sideCam(0, 1.0, 6, 900), pose, col, { rim });
  g.restore();
}

let offCv: HTMLCanvasElement | null = null;
const offscreen = () => { if (!offCv) { offCv = document.createElement('canvas'); offCv.width = W; offCv.height = H; } return offCv; };

/* ---------- plates (the Wan stand-in) ---------- */
function warmFluid(rc: RC) {
  const { g, t } = rc;
  const gr = g.createRadialGradient(640, 340, 40, 640, 360, 900); gr.addColorStop(0, '#3a2a22'); gr.addColorStop(1, '#070504');
  g.fillStyle = gr; g.fillRect(-600, -400, W + 1200, H + 800);
  for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,220,170,${0.12 + 0.3 * rnd(i * 13)})`; g.beginPath(); g.arc((rnd(i) * 1600 + t * 12) % 1600 - 160, rnd(i * 17) * 860 - 60 + Math.sin(t + i) * 8, 1 + rnd(i * 3) * 2, 0, 7); g.fill(); }
}
function nucleoplasm(rc: RC) {
  const { g, t } = rc;
  const gr = g.createRadialGradient(640, 360, 60, 640, 360, 900); gr.addColorStop(0, '#16303a'); gr.addColorStop(1, '#03080b');
  g.fillStyle = gr; g.fillRect(-800, -400, W + 1600, H + 800);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(170,230,255,${0.1 + 0.3 * rnd(i * 7)})`; g.beginPath(); g.arc((rnd(i) * 2000 + t * 16) % 2000 - 360, rnd(i * 11) * 900 - 90, 1 + rnd(i * 5) * 2, 0, 7); g.fill(); }
}
function titleHelix(rc: RC) {
  voidInk(rc);
  const { p, t } = rc;
  p.save(); p.alpha(0.55); helix(p, 40, 1240, 380, 120, 420, t * 0.9, { ink: '#6f7b86', light: '#3b434b', lw: 7 }); p.restore();
}

/* ---------- figures ---------- */
function titleOpen(rc: RC) {
  const { p } = rc;
  label(p, '遺伝医学｜遺伝子の基礎', 640, 200, 34, { align: 'center', fill: '#e9e3d3', a: rc.u('unit', 0.4) });
  const k = rc.u('title', 0.2);
  term(p, '遺伝子とは何か', 640, 330, k, 118);
  label(p, '第1講', 640, 440, 40, { align: 'center', fill: CHALK.y, a: rc.u('title+0.3', 0.3) });
}

function zygoteFig(rc: RC) {
  const { p, g } = rc;
  const tb = rc.ev('body'), toBody = rc.u('body', 0.6);
  if (toBody < 1) {
    // cleavage inside the zona pellucida: 1 → 2 → 4 → … (cells get smaller)
    p.save(); p.alpha(1 - toBody);
    const R = 170;
    p.circle(640, 340, R + 24, { fill: 'rgba(240,235,220,0.08)', stroke: '#efe6d2', width: 10 });
    p.circle(640, 340, R + 24, { stroke: INK, width: 3 });
    const ts = rc.ev('split');
    const nDiv = Number.isFinite(ts) ? Math.max(0, Math.min(5, Math.floor((Math.min(rc.t, tb) - ts) / 0.55) + 1)) : 0;
    const n = 2 ** nDiv;
    if (n === 1) {
      cellCircle(p, 640, 340, R, { nucleus: false });
      p.circle(605, 330, 38, { fill: '#9c86b8', stroke: INK, width: 4 }); p.circle(678, 352, 34, { fill: '#a796c0', stroke: INK, width: 4 }); // two pronuclei
    } else {
      const r = n === 2 ? R * 0.5 : n === 4 ? R * 0.47 : R * 0.95 / Math.sqrt(n) * 1.12;
      const pos: [number, number][] = n === 2 ? [[-r, 0], [r, 0]] : n === 4 ? [[-r * 0.98, -r * 0.98], [r * 0.98, -r * 0.98], [-r * 0.98, r * 0.98], [r * 0.98, r * 0.98]]
        : Array.from({ length: n }, (_, i) => { const a = i * 2.39996, d = Math.sqrt((i + 0.5) / n) * (R - r * 0.9); return [Math.cos(a) * d, Math.sin(a) * d] as [number, number]; });
      pos.forEach(([dx, dy]) => cellCircle(p, 640 + dx, 340 + dy, r));
    }
    p.restore();
    label(p, '受精卵 1個', 640, 150, 38, { align: 'center', fill: CHALK.y, a: rc.u('egg', 0.3) * (1 - toBody) });
  }
  if (toBody > 0) {
    // 60兆個の細胞 → ヒト: a human figure made of cells
    const off = offscreen();
    const og = off.getContext('2d')!;
    og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, W, H);
    human({ ...rc, g: og }, 640, 690, 1.75, '#e8d9c2');
    og.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 900; i++) { const x = 380 + rnd(i) * 520, y = 20 + rnd(i * 3) * 680; og.strokeStyle = 'rgba(30,20,10,0.55)'; og.lineWidth = 1.2; og.beginPath(); og.arc(x, y, 7, 0, 7); og.stroke(); og.fillStyle = `rgba(140,110,180,${0.5 + 0.5 * rc.u('same', 0.6)})`; og.beginPath(); og.arc(x, y, 2.4, 0, 7); og.fill(); }
    og.globalCompositeOperation = 'source-over';
    g.save(); g.globalAlpha *= toBody; g.drawImage(off, 0, 0); g.restore();
    label(p, '60兆個の細胞 → ヒト', 640, 46, 38, { align: 'center', fill: CHALK.y, a: rc.u('body+0.3', 0.3) });
    // the same blueprint in every cell
    const s = rc.u('same', 0.5);
    if (s > 0) {
      p.save(); p.alpha(s);
      p.circle(1010, 300, 150, { fill: 'rgba(20,16,30,0.9)', stroke: '#fff', width: 5 });
      p.circle(1010, 300, 112, { fill: '#5d4a7a', stroke: INK, width: 4 });
      helix(p, 925, 1095, 300, 32, 110, rc.t * 2, { lw: 3.5 });
      p.line([[700, 330], [870, 300]], { stroke: '#fff', width: 3, dash: [8, 8] });
      p.restore();
      label(p, '同じ設計図？', 1010, 485, 34, { align: 'center', fill: '#fff', a: rc.u('same+0.4', 0.3) });
    }
  }
}

interface Item { id: string; at: string; until?: string; x?: number; y?: number; k?: number }
function boardFig(rc: RC) {
  const { p } = rc;
  slate(rc);
  const d = rc.sc.data as { items: Item[]; board: BoardOp[]; map?: ChalkMap; marks?: { id: string; at: string; color: 'y' | 'r' | 'w'; kind?: 'box' | 'under' }[]; lecturerX?: number; lecturerFace?: number };
  const ops = new Map((d.board ?? []).map((o) => [o.id!, o]));
  const mapOf = (it: Item, op: BoardOp): ChalkMap => (it.x != null ? { bx: op.box[0], by: op.box[1], sx: it.x, sy: it.y!, k: it.k ?? 1 } : d.map!);
  for (const it of d.items ?? []) {
    const op = ops.get(it.id); if (!op) continue;
    const gone = it.until ? rc.u(it.until, 0.3) : 0;
    if (gone >= 1) continue;
    p.save(); p.alpha(1 - gone); chalkOp(p, op, mapOf(it, op), rc.u(it.at, 0.55)); p.restore();
  }
  for (const m of d.marks ?? []) {
    const it = d.items.find((x) => x.id === m.id), op = ops.get(m.id); if (!it || !op) continue;
    const mp = mapOf(it, op), x = (op.box[0] - mp.bx) * mp.k + mp.sx, y = (op.box[1] - mp.by) * mp.k + mp.sy, w = op.box[2] * mp.k, h = op.box[3] * mp.k, k = rc.u(m.at, 0.4);
    if (k <= 0) continue;
    if (m.kind === 'under') p.line([[x, y + h + 6], [x + w * k, y + h + 3]], { stroke: CHALK[m.color], width: 5 });
    else chalkBox(p, x - 14, y - 8, w + 28, h + 16, k, CHALK[m.color]);
  }
  if (d.lecturerX != null) lecturer(rc, d.lecturerX, (d.lecturerFace ?? 1) * Math.PI / 2 * 0.7);
}

/* transcription: polymerase walks right, opening a bubble; RNA (template complement, U for T) peels off upward */
function transcriptionFig(rc: RC) {
  const { p, t } = rc;
  const bp = 34, x0 = -260, y0 = 400, gap = 70;
  const px = 300 + 720 * between(rc, 'pol', 'trx', ease.inOut) + Math.sin(t * 3) * 2;
  const open = (x: number) => { const d = x - (px - 50); return Math.abs(d) < 120 ? Math.cos((d / 120) * Math.PI / 2) ** 2 : 0; };
  const top: [number, number][] = [], bot: [number, number][] = [];
  for (let i = 0; i < 52; i++) {
    const x = x0 + i * bp, o = open(x), b = CODING[i % CODING.length];
    const yt = y0 - gap / 2 - o * 60, yb = y0 + gap / 2 + o * 60;
    top.push([x, yt]); bot.push([x, yb]);
    if (o < 0.5) { p.line([[x, yt], [x, y0]], { stroke: BASE[b], width: 7 }); p.line([[x, y0], [x, yb]], { stroke: BASE[PAIR[b]], width: 7 }); }
    else { p.line([[x, yt], [x, yt + 18]], { stroke: BASE[b], width: 7 }); p.line([[x, yb - 18], [x, yb]], { stroke: BASE[PAIR[b]], width: 7 }); }
  }
  for (const [pts, col] of [[top, '#d9e6f2'], [bot, '#8fa3b5']] as const) { p.line(pts as [number, number][], { stroke: INK, width: 12 }); p.line(pts as [number, number][], { stroke: col, width: 7 }); }
  // RNA made so far: from the start position to the polymerase, paired on the template inside the bubble, then peeling up-left
  const made = Math.floor((px - 300) / bp) + 3, rna: [number, number][] = [];
  for (let j = 0; j < made; j++) {
    const xi = px - 40 - j * bp * 0.92, peel = Math.max(0, j - 5);
    const x = xi - peel * 9, y = y0 + gap / 2 + 18 - peel * 15 - peel * peel * 0.22;
    if (y < -100) break;
    rna.push([x, y]);
    const i = Math.round((xi - x0) / bp), b = CODING[((i % CODING.length) + CODING.length) % CODING.length];
    const rb = b === 'T' ? 'U' : b;
    p.line([[x, y], [x, y - 22]], { stroke: BASE[rb], width: 7 });
    if (j % 3 === 0 && peel > 1) p.text(rb, x, y - 36, { size: 20, font: 'gothic', weight: 900, fill: BASE[rb], stroke: INK, strokeW: 5, align: 'center' });
  }
  if (rna.length > 1) { p.line(rna, { stroke: INK, width: 11 }); p.line(rna, { stroke: '#c38bff', width: 6 }); }
  // the polymerase
  const pk = rc.u('pol', 0.25);
  p.save(); p.translate(px - 40, y0); p.alpha(Math.max(0.15, pk));
  p.ellipse(0, 0, 150, 115, -0.1, { fill: 'rgba(222,140,96,0.9)', stroke: INK, width: 7 });
  for (let i = 0; i < 9; i++) p.line([[-90 + i * 20, 60], [-60 + i * 20, 98]], { stroke: INK, width: 2.4, opacity: 0.7 });
  p.ellipse(-40, -40, 50, 22, -0.4, { fill: 'rgba(255,255,255,0.25)' });
  p.restore();
  // labels
  label(p, 'DNA', 70, 300, 40, { fill: '#d9e6f2', a: rc.u('dive', 0.3) });
  label(p, 'RNAポリメラーゼ', px - 40, y0 - 150, 34, { align: 'center', fill: '#ffb88a', a: pk });
  label(p, 'RNA', px - 420, 170, 40, { align: 'center', fill: '#d8b6ff', a: rc.u('copy', 0.3) });
  label(p, 'T のかわりに U', px - 420, 218, 24, { align: 'center', fill: '#fff', a: rc.u('copy+0.8', 0.3) });
  term(p, '転写', 640, 110, rc.u('trx', 0.2), 110);
}

/* translation: mRNA leaves through a nuclear pore; the ribosome reads one codon at a time; amino acids join */
function translationFig(rc: RC) {
  const { p } = rc;
  const y = 450, bw = 30, xStart = 330;
  const slide = between(rc, 'start', 'three', ease.outCubic);
  const mx = -200 + slide * 260; // mRNA moves out of the nucleus
  // nuclear envelope (double membrane) with a pore
  p.path('M 230 -60 C 210 120 210 330 228 410 M 228 490 C 210 600 215 720 230 800', { stroke: '#9c86b8', width: 10 });
  p.path('M 252 -60 C 232 120 232 330 250 410 M 250 490 C 232 600 237 720 252 800', { stroke: '#9c86b8', width: 10 });
  label(p, '核', 120, 160, 40, { fill: '#c9b7ea', a: 0.9 });
  label(p, '核の外', 330, 620, 36, { fill: '#fff', a: rc.u('out', 0.3) });
  const seq = 'GG' + CODONS.map((c) => c[0]).join('') + 'GCAUAA';
  const pts: [number, number][] = [];
  [...seq].forEach((b, i) => { const x = xStart + mx + i * bw; pts.push([x, y]); p.line([[x, y], [x, y + 22]], { stroke: BASE[b], width: 8 }); if (x > 280) p.text(b, x, y + 42, { size: 18, font: 'gothic', weight: 900, fill: BASE[b], stroke: INK, strokeW: 4, align: 'center' }); });
  p.line(pts, { stroke: INK, width: 11 }); p.line(pts, { stroke: '#c38bff', width: 6 });
  // codon reading
  const t3 = rc.ev('three'), tc = rc.ev('chain'), tEnd = rc.ev('trl');
  const step = Number.isFinite(tc) ? Math.max(0, Math.min(CODONS.length - 1, Math.floor((rc.t - tc) / Math.max(0.35, (tEnd - tc) / CODONS.length)))) : 0;
  const reading = Number.isFinite(t3) && rc.t >= t3;
  const cx = xStart + mx + (2 + step * 3) * bw + bw;
  CODONS.forEach((_, i) => { const x0 = xStart + mx + (2 + i * 3) * bw - bw * 0.45; if (x0 > 270) p.rect(x0, y - 18, bw * 2.9, 70, { stroke: i === step && reading ? '#ffd84a' : 'rgba(255,255,255,0.35)', width: i === step && reading ? 4 : 2 }, 6); });
  // ribosome
  const rk = rc.u('three-0.3', 0.4);
  if (rk > 0) {
    p.save(); p.alpha(rk);
    p.ellipse(cx, y - 70, 120, 78, 0, { fill: 'rgba(110,170,150,0.92)', stroke: INK, width: 7 });
    p.ellipse(cx, y + 62, 95, 46, 0, { fill: 'rgba(90,150,130,0.92)', stroke: INK, width: 7 });
    for (let i = 0; i < 7; i++) p.line([[cx - 70 + i * 22, y - 18], [cx - 50 + i * 22, y - 2]], { stroke: INK, width: 2.4, opacity: 0.6 });
    p.restore();
    label(p, 'リボソーム', cx, y + 140, 28, { align: 'center', fill: '#bfe6d6', a: rk });
  }
  label(p, '3つの塩基（コドン）', cx + 150, y + 105, 28, { fill: '#ffd84a', a: rc.u('three', 0.3) });
  // peptide chain: one amino acid per codon read
  const nAA = reading ? Math.min(CODONS.length, step + 1) : 0;
  for (let i = 0; i < nAA; i++) {
    const bx = cx - 30 - (nAA - 1 - i) * 62, by = y - 150 - (nAA - 1 - i) * 22;
    const k = i === nAA - 1 ? rc.u(`chain+${(step * Math.max(0.35, (tEnd - tc) / CODONS.length)).toFixed(2)}`, 0.2) : 1;
    p.circle(bx, by, 27 * (0.6 + 0.4 * k), { fill: '#e2a65a', stroke: INK, width: 4 });
    p.text(CODONS[i][1], bx, by, { size: 18, font: 'gothic', weight: 900, fill: '#1b1b1b', align: 'center' });
    if (i > 0) p.line([[bx - 35, by + 12], [bx - 27, by + 9]], { stroke: INK, width: 5 });
  }
  label(p, 'アミノ酸', cx + 110, y - 175, 32, { fill: '#ffcf8a', a: rc.u('chain', 0.3) });
  term(p, '翻訳', 1010, 120, rc.u('trl', 0.2), 110);
}

function contrastFig(rc: RC) {
  const { p, g } = rc;
  const panel = (pts: [number, number][]) => { g.save(); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = 'rgba(8,8,12,0.55)'; g.fill(); g.lineWidth = 16; g.strokeStyle = '#f4f0e4'; g.stroke(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); };
  panel([[24, 24], [650, 24], [600, 696], [24, 696]]); panel([[674, 24], [1256, 24], [1256, 696], [624, 696]]);
  const row = (s: string, x: number, y: number, a: number) => [...s].forEach((b, i) => { const c = BASE[b] ?? '#fff'; p.rect(x + i * 54 - 22, y - 26, 44, 52, { fill: c, stroke: INK, width: 4, opacity: a }, 6); p.text(b, x + i * 54, y, { size: 30, font: 'gothic', weight: 900, fill: '#111', align: 'center', opacity: a }); });
  const a1 = rc.u('copy', 0.3), a2 = rc.u('trans', 0.3);
  term(p, '転写＝写す', 330, 120, a1, 70);
  label(p, 'DNA', 70, 300, 30, { fill: '#d9e6f2', a: a1 }); row('ATGGCT', 190, 300, a1);
  p.line([[330, 350], [330, 420]], { stroke: '#fff', width: 5, opacity: a1 });
  label(p, 'RNA', 70, 470, 30, { fill: '#d8b6ff', a: rc.u('copy+0.5', 0.3) }); row('AUGGCU', 190, 470, rc.u('copy+0.5', 0.3));
  label(p, '同じ文字（塩基）のまま', 330, 590, 28, { align: 'center', a: rc.u('copy+0.8', 0.3) });
  term(p, '翻訳＝置き換える', 950, 120, a2, 64);
  row('AUGGCU', 820, 300, a2);
  p.line([[950, 350], [950, 420]], { stroke: '#fff', width: 5, opacity: a2 });
  const a3 = rc.u('trans+0.6', 0.3);
  [['Met', 870], ['Ala', 1030]].forEach(([s, x]) => { p.circle(x as number, 470, 40, { fill: '#e2a65a', stroke: INK, width: 5, opacity: a3 }); p.text(s as string, x as number, 470, { size: 26, font: 'gothic', weight: 900, fill: '#111', align: 'center', opacity: a3 }); });
  p.line([[910, 470], [990, 470]], { stroke: INK, width: 6, opacity: a3 });
  label(p, 'アミノ酸の言葉へ', 950, 590, 28, { align: 'center', a: rc.u('trans+0.9', 0.3) });
}

function universalFig(rc: RC) {
  const { p } = rc;
  label(p, '分子生物学の', 640, 70, 32, { align: 'center', fill: '#e9e3d3', a: rc.u('start+0.1', 0.4) * (1 - rc.u('from', 0.3)) });
  term(p, 'セントラルドグマ', 640, 150, rc.u('name', 0.2), 90);
  label(p, '中心となる教義', 640, 240, 30, { align: 'center', a: rc.u('mean', 0.3) * (1 - rc.u('from', 0.3)) });
  const f = rc.u('from', 0.4);
  if (f <= 0) return;
  p.save(); p.alpha(f);
  bacterium(p, 300, 400, 1.5);
  label(p, '細菌（核なし）', 300, 500, 30, { align: 'center' });
  label(p, '…', 640, 380, 60, { align: 'center', fill: '#bbb' });
  p.restore();
  human(rc, 980, 470, 0.95, '#e8d9c2');
  label(p, 'ヒト', 980, 500, 30, { align: 'center', a: f });
  const chain = (x: number, k: number) => {
    ['DNA', 'RNA', 'タンパク質'].forEach((s, i) => { const a = CL(k * 3 - i); label(p, s, x - 150 + i * 135, 555, 30, { align: 'center', fill: ['#d9e6f2', '#d8b6ff', '#ffcf8a'][i], a }); if (i < 2) label(p, '→', x - 82 + i * 135, 555, 28, { align: 'center', a }); });
  };
  const d = rc.u('dir', 1.2);
  chain(300, d); chain(980, rc.u('dir+0.4', 1.2));
  const u = rc.u('univ', 0.25);
  if (u > 0) { p.save(); p.translate(640, 640); p.rotate(-0.03); p.scale(1 + 0.5 * (1 - ease.outExpo(u))); p.rect(-260, -40, 520, 80, { fill: 'rgba(179,38,30,0.92)', stroke: INK, width: 6 }, 8); p.text('普遍的な原理', 0, 0, { size: 46, font: 'gothic', weight: 900, fill: '#fff', align: 'center' }); p.restore(); }
}

/* the levels of life: each level is 6× the previous one; the camera flies through them */
const LEVELS = ['遺伝子', '分子', '細胞', '組織', '個体', '疾患'];
function hierarchyFig(rc: RC) {
  const { p, g } = rc;
  let L = 0;
  for (let i = 1; i <= 4; i++) L += rc.u(`l${i}`, 0.4) * 1;
  L = Math.min(4, L) * (1 - rc.u('bottom', 0.6));
  const sc = (i: number) => Math.pow(6, i - L);
  // a level shows while it is between ~1/7 and ~5 of its own size (fading at both ends) so it reads as nested
  const draw = (i: number, fn: (s: number) => void) => { const s = sc(i), a = CL((s - 0.18) / 0.15) * CL((5 - s) / 3); if (a <= 0) return; p.save(); p.translate(640, 360); p.alpha(a); fn(s); p.restore(); };
  draw(4, (s) => { const a = CL((s - 0.18) / 0.15) * CL((5 - s) / 3); p.restore(); g.save(); g.globalAlpha *= a; g.translate(640, 360); g.scale(s, s); g.translate(-640, -360); human(rc, 640, 360 + 230, 1.05, '#e8d9c2'); g.restore(); p.save(); });
  draw(3, (s) => { for (let i = 0; i < 37; i++) { const r = Math.floor(i / 7) - 2.5, c = (i % 7) - 3; cellCircle(p, c * 48 * s + (r % 2 ? 24 * s : 0), r * 42 * s, 24 * s); } });
  draw(2, (s) => cellCircle(p, 0, 0, 160 * s));
  draw(1, (s) => protein(p, 0, 0, 1.4 * s));
  draw(0, (s) => helix(p, -220 * s, 220 * s, 0, 40 * s, 160 * s, rc.t * 2, { lw: Math.max(1.5, 5 * s) }));
  // 疾患: the individual pulses red
  const dz = rc.u('l5', 0.3) * (1 - rc.u('stack', 0.5));
  if (dz > 0) { g.save(); g.globalAlpha = dz * (0.35 + 0.25 * Math.sin(rc.t * 10)); g.fillStyle = '#d0251a'; g.fillRect(-400, -300, W + 800, H + 600); g.restore(); }
  // the level ladder (板書 hier1 / hier2)
  const cur = rc.u('l5', 0.01) > 0 && dz > 0 ? 5 : Math.round(L);
  LEVELS.forEach((s, i) => { const y = 600 - i * 92, on = i === cur; label(p, s, 1150, y, on ? 40 : 28, { align: 'center', fill: i === 5 ? '#ff6a55' : on ? CHALK.y : '#9a9a9a', a: rc.u(`l${i}`, 0.25) || (i === 0 ? 1 : 0) }); if (i < 5) label(p, '↑', 1150, y - 46, 22, { align: 'center', fill: '#777', a: rc.u(`l${i + 1}`, 0.25) }); });
  term(p, cur === 5 ? '疾患' : LEVELS[cur], 260, 130, 1, cur === 5 ? 110 : 80, cur === 5 ? '#ff5a45' : '#fff');
}
function hierLineFig(rc: RC) {
  const { p } = rc;
  const ys = LEVELS.map((_, i) => 600 - i * 95);
  const icon = (i: number, x: number, y: number) => {
    if (i === 0) helix(p, x - 50, x + 50, y, 16, 60, rc.t * 2, { lw: 3, bases: false });
    if (i === 1) protein(p, x, y, 0.45);
    if (i === 2) cellCircle(p, x, y, 30);
    if (i === 3) for (let k = 0; k < 5; k++) cellCircle(p, x - 44 + k * 22, y + (k % 2) * 10, 12);
    if (i === 5) p.circle(x, y, 26, { fill: '#d0251a', stroke: INK, width: 4 });
  };
  const up = between(rc, 'up', 'reach', ease.inOut);
  ys.forEach((y, i) => {
    const lit = up * 5 >= i;
    p.rect(470, y - 40, 340, 80, { fill: lit ? 'rgba(255,216,74,0.18)' : 'rgba(255,255,255,0.05)', stroke: lit ? CHALK.y : '#555', width: 3 }, 10);
    if (i !== 4) icon(i, 540, y);
    label(p, LEVELS[i], 700, y, 36, { align: 'center', fill: i === 5 ? '#ff6a55' : '#fff' });
  });
  human(rc, 540, ys[4] + 36, 0.13);
  const yTop = ys[0] - (ys[0] - ys[5]) * up;
  p.line([[440, ys[0]], [440, yTop]], { stroke: '#fff', width: 10 });
  p.line([[440, ys[0]], [440, yTop]], { stroke: '#ffd84a', width: 5 });
  if (up > 0) p.circle(440, yTop, 12, { fill: '#fff' });
  label(p, '一番下の変化', 250, ys[0], 30, { align: 'center', fill: CHALK.y, a: rc.u('up', 0.3) });
  const r = rc.u('reach', 0.25);
  if (r > 0) term(p, '疾患まで届く', 960, ys[5], r, 46, '#ff6a55');
}

function diseaseFig(rc: RC) {
  const { p } = rc;
  boardFig(rc);
  // chromosome 21 ×3 (trisomy: one too many)
  const t = rc.u('tri', 0.3);
  if (rc.u('down', 0.3) > 0) {
    p.save(); p.alpha(rc.u('down', 0.3));
    chromosome21(p, 190, 470, 1.5); chromosome21(p, 280, 470, 1.5);
    p.restore();
    if (t > 0) { p.save(); p.alpha(t); chromosome21(p, 370, 470 - 30 * (1 - ease.back(t)), 1.5, '#ffd2c8'); p.restore(); }
    label(p, '21番', 280, 600, 30, { align: 'center', a: rc.u('down', 0.3) });
    label(p, '×3（1本多い）', 440, 440, 30, { fill: '#ff8a7a', a: t });
  }
  geneBar(p, 700, 470, 460, 0.7, 'Lamin A/C', rc.u('lmna', 0.3));
  geneBar(p, 700, 570, 460, 0.38, 'TCOF1', rc.u('tcof', 0.3));
  label(p, '遺伝子1つの変異', 930, 630, 26, { align: 'center', fill: '#ffb0a6', a: rc.u('lmna+0.6', 0.3) });
}

function endCardFig(rc: RC) {
  const { p, g } = rc;
  const s = rc.u('next', 0.2);
  if (s > 0) { p.save(); p.translate(640, 170); p.rotate(-0.06); p.scale(1 + 0.6 * (1 - ease.outExpo(s))); p.rect(-170, -60, 340, 120, { fill: 'rgba(250,244,230,0.95)', stroke: '#b3261e', width: 8 }, 12); p.text('次回 第2講', 0, 0, { size: 52, font: 'gothic', weight: 900, fill: '#b3261e', align: 'center' }); p.restore(); }
  label(p, '設計図の「文字」', 640, 320, 46, { align: 'center', fill: CHALK.y, a: rc.u('next+0.6', 0.3) });
  label(p, 'DNAは何でできているのか', 640, 390, 40, { align: 'center', a: rc.u('what', 0.3) });
  // a nucleotide sketch: phosphate – sugar (pentose) – base
  const a = rc.u('what+0.6', 0.4);
  if (a > 0) {
    p.save(); p.alpha(a); p.translate(640, 520);
    p.circle(-150, 0, 34, { fill: '#ffd84a', stroke: INK, width: 5 }); p.text('P', -150, 0, { size: 30, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
    p.line([[-116, 0], [-70, 0]], { stroke: '#fff', width: 5 });
    p.path('M -60 -10 L -20 -40 L 25 -25 L 25 25 L -20 30 Z', { fill: '#e8d9c2', stroke: INK, width: 5 });
    p.line([[25, 0], [75, 0]], { stroke: '#fff', width: 5 });
    p.rect(75, -32, 110, 64, { fill: '#5aa9ff', stroke: INK, width: 5 }, 8); p.text('塩基', 130, 0, { size: 26, font: 'gothic', weight: 900, fill: '#111', align: 'center' });
    p.restore();
  }
  // fade out at the very end
  const tEnd = rc.ts.t1, f = CL((rc.real - (tEnd - 0.9)) / 0.9);
  if (f > 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = f; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.restore(); }
}

/** chapter title flash: a slanted black band slides in for the first ~1.5 s of the scene (screen space) */
export function chapterCard(rc: RC, text: string) {
  const { g, p } = rc;
  const u = (rc.real - rc.ts.t0) / 1.6;
  if (u < 0 || u > 1) return;
  const inK = ease.outExpo(CL(u / 0.25)), out = CL((u - 0.8) / 0.2);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(-W * (1 - inK) + W * out, 0);
  g.fillStyle = '#000'; g.beginPath(); g.moveTo(0, 70); g.lineTo(W * 0.62, 70); g.lineTo(W * 0.58, 160); g.lineTo(0, 160); g.closePath(); g.fill();
  g.fillStyle = '#d0251a'; g.fillRect(0, 160, W * 0.58, 8);
  p.text(text, 40, 116, { size: 46, font: 'brush', weight: 400, fill: '#fff' });
  g.restore();
}

export const FILM_PLATE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'title-open': titleHelix, zygote: warmFluid, board: hall, transcription: nucleoplasm, translation: warmFluid,
  contrast: streaks, universal: streaks, hierarchy: streaks, 'hier-line': streaks, disease: hall, 'end-card': voidInk,
};
export const FILM_FIGURE: Partial<Record<SceneDef['visual'], (rc: RC) => void>> = {
  'title-open': titleOpen, zygote: zygoteFig, board: boardFig, transcription: transcriptionFig, translation: translationFig,
  contrast: contrastFig, universal: universalFig, hierarchy: hierarchyFig, 'hier-line': hierLineFig, disease: diseaseFig, 'end-card': endCardFig,
};
