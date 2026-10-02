/**
 * Scene 7「渡り鳥のページ」: leaving the scriptorium, orange pages are pasted all over the shelves → Line
 * glides down: "copy and paste" (transposons, ~45 %; LINE-1, Alu, SVA still active) → a look-alike of the
 * ALDH2 page, much closer than the scriptorium → it has no introns → retrotransposition and processed
 * pseudogenes → Line drifts off with the wind → Jin turns back to the original shelf: sticky notes (→ notes).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { dust, ease, glow, grade, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { JIN, LINE1 } from '../cast';
import { HAND, aisle, bust, cues, lampPool, sheet, slip, softBg, tableTop, txt, blinkAt, talk } from '../sets';

const { c, e, d } = cues('jump');
const ORANGE = '#e88a3a';
const NOTE_COLS = ['#ffd36b', '#8fd6ff', '#ff9ec0', '#b8f0a0'];

/** orange look-alike pages pasted over the shelves (fixed positions, revealed one by one) */
const PASTED: [number, number, number][] = [[90, 170, -0.1], [250, 300, 0.08], [1120, 200, -0.05], [330, 160, 0.12], [1240, 330, -0.08], [140, 440, 0.06], [1060, 420, -0.12], [300, 470, 0.04], [1200, 120, 0.1], [1140, 520, 0.05]];
/** a bookcase front with rows of spines */
function bookcase(x: number, y: number, w: number, h: number) {
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x + 8, y + 10, w, h);
  g.fillStyle = '#2a1a12'; g.fillRect(x, y, w, h);
  const rows = Math.max(2, Math.round(h / 110)), rh = h / rows;
  for (let r = 0; r < rows; r++) { let bx = x + 10; let i = 0; while (bx < x + w - 20) { const bw = 14 + ((i * 7 + r * 5) % 4) * 4, bh = rh * (0.62 + ((i * 3 + r) % 4) * 0.08); g.fillStyle = ['#5a3a30', '#3a4a5a', '#5a5030', '#4a3a5a', '#3a5040'][(i + r) % 5]; g.fillRect(bx, y + (r + 1) * rh - bh - 8, bw, bh); bx += bw + 2; i++; } g.fillStyle = '#4a3020'; g.fillRect(x, y + (r + 1) * rh - 8, w, 8); }
  g.strokeStyle = '#4a3020'; g.lineWidth = 10; g.strokeRect(x, y, w, h);
}
function pasted(n: number, t: number, glowK = 1) {
  PASTED.slice(0, n).forEach(([x, y, r], i) => {
    g.save(); g.translate(x, y); g.rotate(r + Math.sin(t * 1.3 + i) * 0.02);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-26, -32, 56, 70);
    g.fillStyle = '#f6c48a'; g.fillRect(-30, -36, 56, 70); g.fillStyle = 'rgba(160,80,30,.6)'; for (let k = 0; k < 5; k++) g.fillRect(-22, -26 + k * 11, 40 - (k % 2) * 10, 3);
    g.restore();
    glow(x, y, 60, 'rgba(255,170,90,.5)', glowK * (0.5 + 0.3 * Math.sin(t * 2 + i)));
  });
}
/** a cape-shaped flock of feathers trailing Line */
function feathers(t: number, x: number, y: number, n: number, seed: number) {
  for (let i = 0; i < n; i++) { const p = ((t * 0.4 + i / n + seed) % 1), fx = x - p * 260 + Math.sin(t * 2 + i) * 20, fy = y + p * 120 + Math.cos(t * 1.7 + i * 2) * 16; g.save(); g.translate(fx, fy); g.rotate(t + i); g.globalAlpha = 1 - p; g.fillStyle = i % 2 ? ORANGE : '#ffd08a'; g.beginPath(); g.ellipse(0, 0, 10, 4, 0, 0, 7); g.fill(); g.restore(); }
}

function corridor(t: number) {
  const k = span(t, 0.2, c[1] - 0.6, (u) => u * u * (3 - 2 * u)), x = L(80, 520, k), moving = t < c[1] - 0.6;
  shot({ x: L(560, 700, k), y: 360, z: 1.02 }, 1, () => {
    g.drawImage(aisle('jump', 0.45), -100, 0, W * 1.18, H);
    lampPool(700, 300, 640, 0.75);
    pasted(Math.min(PASTED.length, Math.floor(span(t, 0.5, 5.5) * PASTED.length) + 1), t);
    drawFigure(JIN, { x, y: 720, s: 450, dir: 1, t, yaw: L(0.6, 0.3, span(t, 3, 5)), light: 1, blink: blinkAt(t, 1), walk: moving ? { p: (x - 80) / (450 * 0.115), amt: CL(Math.min(t * 2, (c[1] - 0.6 - t) * 2)) } : undefined,
      gazeX: L(0.6, -0.2, span(t, 2.5, 4.5)), gazeY: L(0.1, -0.5, span(t, 2.5, 4.5)), armN: { hand: [0.5, 1.2], grip: 1 }, holdN: (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) });
    dust(t, [300, 100, 800, 500], 50, 81, (px, py) => CL(1 - Math.hypot(px - 700, py - 300) / 520));
  });
}

/** Line glides down from the top shelves and pastes a page with a flourish */
function arrival(t: number, u: number) {
  const land = span(u, 0, 2.2, ease.settle), paste = span(u, 3, 3.8, ease.back);
  const lx = L(1300, 900, land), ly = L(-80, 640, land) + Math.sin(t * 2.2) * 8;
  shot({ x: 700, y: 360, z: 1.04 }, 1, () => {
    g.drawImage(aisle('jump', 0.45), -100, 0, W * 1.18, H);
    lampPool(860, 300, 560, 0.8);
    pasted(PASTED.length, t, 0.7);
    if (paste > 0) { g.save(); g.translate(1060, 250); g.scale(paste, paste); g.rotate(-0.08); g.fillStyle = '#f6c48a'; g.fillRect(-40, -50, 80, 100); g.fillStyle = 'rgba(160,80,30,.6)'; for (let k = 0; k < 6; k++) g.fillRect(-30, -36 + k * 13, 56 - (k % 2) * 14, 4); g.restore(); glow(1060, 250, 120, 'rgba(255,170,90,.8)', paste * (1 - span(u, 4, 5.5))); }
    feathers(t, lx + 40, ly - 300, 10, 0.3);
    drawFigure(LINE1, { x: lx, y: ly, s: 420, dir: -1, t, yaw: -0.4, light: -1, blink: blinkAt(t, 7), mouth: talk(t, c[1], e[1]), gazeX: -0.7, gazeY: 0.1, smile: 0.6,
      lean: L(-0.2, 0, land), armF: { at: [L(lx, 1060, paste), L(ly - 260, 260, paste)], grip: 0.7 }, armN: { at: [lx - 120, ly - 220], grip: 0.3 } });
    drawFigure(JIN, { x: 480, y: 720, s: 450, dir: 1, t, yaw: 0.6, light: 1, blink: blinkAt(t, 1), gazeX: L(0.2, 0.9, span(u, 0.4, 1.4, ease.antic)), gazeY: L(-0.6, -0.1, land), brow: 0.6, lean: -0.04 * land,
      armN: { hand: [0.5, 1.2], grip: 1 }, holdN: (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) });
  });
}

/** the genome as one long shelf: ~45 % involved with mobile sequences; the three still active */
function share(t: number, u: number) {
  const pan = span(u, 0, 14, ease.inOut);
  shot({ x: 640, y: 340, z: L(1.12, 1, pan) }, 1, () => {
    g.drawImage(softBg('jump', 300, 300, 1.4, 'rgba(10,6,10,.6)'), 0, 0);
    const x0 = 140, w = 1000, y = 250;
    g.fillStyle = '#4a3a5c'; rr(x0, y - 34, w, 68, 8); g.fill();
    const fill = span(u, 2, 6, ease.inOut);
    // the mobile share scattered along the shelf (adds up to ~45 %)
    for (let i = 0; i < 40; i++) { const sx = x0 + (i / 40) * w + ((i * 37) % 11), sw = (w / 40) * 0.45 * CL(fill * 1.4 - (i % 7) * 0.05); g.fillStyle = ORANGE; g.fillRect(sx, y - 34, sw, 68); }
    txt('トランスポゾン（動く配列）', 640, 110, 32, '#ffe8c0', span(u, 0.2, 1.2));
    txt('ゲノムの 約45％', 640, 360, 38, '#ffb070', span(u, 4, 5));
    ['LINE-1', 'Alu', 'SVA'].forEach((n, i) => {
      const a = span(u, 9 + i * 1.2, 10 + i * 1.2, ease.back); if (a <= 0) return;
      const bx = 380 + i * 260; g.save(); g.translate(bx, 470); g.scale(a, a); g.fillStyle = 'rgba(232,138,58,.9)'; rr(-100, -32, 200, 64, 32); g.fill(); g.restore();
      txt(n, bx, 482, 30, '#2a1a10', a);
    });
    txt('いまも動いているもの', 640, 548, 22, '#e8d0a8', span(u, 8.5, 9.5), 'center', HAND, 600);
  });
  void t;
}

/** the look-alike, close at hand; Jin weighs it against the long way back */
function temptation(t: number, u: number) {
  const look = span(u, 2.5, 4, ease.antic), back = span(u, 5, 6.2, ease.inOut);
  shot({ x: 700, y: 360, z: L(1.0, 1.08, span(u, 0, 9)) }, 1, () => {
    g.drawImage(aisle('jump', 0.5), -100, 0, W * 1.18, H);
    lampPool(860, 320, 520, 0.85);
    pasted(PASTED.length, t, 0.4);
    bookcase(760, 170, 300, 420);
    // the look-alike page, glowing at hand height
    g.save(); g.translate(900, 380); g.rotate(0.04); g.fillStyle = '#f2d0a0'; g.fillRect(-60, -80, 120, 160); g.fillStyle = 'rgba(90,60,40,.6)'; for (let k = 0; k < 8; k++) g.fillRect(-46, -64 + k * 17, 92 - (k % 3) * 18, 4); g.restore();
    glow(900, 380, 180, 'rgba(255,200,120,.7)', 0.6 + 0.2 * Math.sin(t * 3));
    txt('二日酔いの番人 ……？', 900, 270, 24, '#ffe8c0', span(u, 1, 2), 'center', HAND, 600);
    drawFigure(JIN, { x: 620, y: 730, s: 460, dir: 1, t, yaw: L(0.6, -0.2, back), light: 1, blink: blinkAt(t, 1), gazeX: L(0.8, -0.9, back), gazeY: L(0.2, 0, back), brow: 0.4,
      armF: { at: [L(700, 840, look * (1 - back)), L(560, 400, look * (1 - back))], grip: 0.4 }, armN: { hand: [0.5, 1.2], grip: 1 }, holdN: (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) });
  });
  // far left, the scriptorium's light, small and far away
  glow(60, 330, 160, 'rgba(255,200,130,.5)', back);
}

/** Jin's realisation: the original has introns; the look-alike has exons only and a poly-A tail */
function noIntron(t: number, u: number) {
  g.drawImage(tableTop('gen-jump'), 0, 0); lampPool(640, 300, 760, 0.9);
  const hh = handheld(t, 1.4, 71);
  g.save(); g.translate(hh[0], hh[1]);
  const segs = (y: number, introns: boolean, a: number) => {
    if (a <= 0) return; g.globalAlpha = a;
    let x = 230; const L0 = [['ex', 160], ['in', 160], ['ex', 130], ['in', 180], ['ex', 140]] as const;
    L0.forEach(([k, w]) => { if (k === 'in' && !introns) return; g.fillStyle = k === 'ex' ? '#3f6aa8' : '#b9ad98'; rr(x + 1, y - 26, w - 2, 52, 4); g.fill(); x += w; });
    if (!introns) { g.fillStyle = ORANGE; txt('AAAA', x + 50, y + 10, 28, ORANGE, a, 'center', HAND, 600); }
    g.globalAlpha = 1;
  };
  txt('原本', 140, 210, 26, '#ffe8c0', span(u, 0.2, 1));
  segs(200, true, span(u, 0.2, 1));
  txt('似たページ', 140, 360, 26, '#ffb070', span(u, 1, 1.8));
  segs(350, false, span(u, 1, 1.8));
  const q = span(u, 2.2, 3.2);
  if (q > 0) { g.strokeStyle = `rgba(255,120,100,${q})`; g.lineWidth = 3; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(390, 240); g.lineTo(390, 320); g.moveTo(700, 240); g.lineTo(560, 320); g.stroke(); g.setLineDash([]); txt('イントロンがない', 640, 470, 30, '#ffb0a0', q); }
  g.restore();
}

/** retrotransposition: spliced mRNA → reverse transcriptase → DNA copy → pasted on another chromosome */
function retro(t: number, u: number) {
  shot({ x: 640, y: 340, z: 1.0 }, 1, () => {
    g.drawImage(softBg('jump', 300, 300, 1.4, 'rgba(10,6,10,.62)'), 0, 0);
    lampPool(640, 300, 760, 0.6);
    // left: the source volume (chromosome) with the gene; middle: mRNA → DNA copy; right: another volume
    const vol = (x: number, col: string, label: string, a: number) => { g.globalAlpha = a; [-1, 1].forEach((s2) => { g.fillStyle = col; rr(x + s2 * 22 - 18, 140, 36, 300, 18); g.fill(); }); g.fillStyle = '#ffd36b'; g.beginPath(); g.ellipse(x, 270, 44, 12, 0, 0, 7); g.fill(); g.globalAlpha = 1; txt(label, x, 480, 22, '#f2e6c8', a, 'center', HAND, 600); };
    vol(150, '#7d5aa8', '元の遺伝子の染色体', span(u, 0, 1));
    vol(1130, '#3f6aa8', '別の染色体', span(u, 0, 1));
    g.fillStyle = '#ffd36b'; g.fillRect(124, 200, 52, 16);
    // mRNA leaves the source
    const m = span(u, 0.5, 3, ease.inOut);
    const strip = (x: number, y: number, col: string, a: number, w = 200) => { if (a <= 0) return; g.globalAlpha = a; g.fillStyle = col; rr(x - w / 2, y - 14, w, 28, 6); g.fill(); g.globalAlpha = 1; };
    strip(L(200, 400, m), 200, '#d14d7c', m);
    txt('mRNA（スプライシング後）', 400, 160, 22, '#ffc0d0', m, 'center', HAND, 600);
    // reverse transcriptase: Line's quill makes a DNA copy
    const rt = span(u, 3.5, 6.5, ease.inOut);
    if (rt > 0) {
      glow(620, 300, 120, 'rgba(255,170,90,.7)', rt * 0.8);
      g.fillStyle = ORANGE; g.beginPath(); g.ellipse(620, 300, 60 * rt, 40 * rt, 0, 0, 7); g.fill(); txt('逆転写酵素', 620, 308, 20, '#2a1a10', rt, 'center', HAND, 600);
      strip(L(420, 640, rt), L(200, 400, rt), '#3f86d1', rt * (1 - span(u, 7, 7.3)), 200);
      txt('DNAのコピー', 640, 456, 22, '#a8c8f0', span(u, 6, 7), 'center', HAND, 600);
    }
    // the copy flies to the other chromosome and is pasted in
    const ins = span(u, 7, 10, ease.inOut);
    if (ins > 0) { g.save(); g.translate(L(640, 1130, ins), L(400, 330, ins)); g.rotate(L(0, Math.PI / 2, ins)); g.globalAlpha = 1; g.fillStyle = '#ffb070'; rr(-L(100, 14, ins) * 1, -14, L(200, 28, ins), 28, 6); g.fill(); g.restore(); }
    if (ins >= 1) glow(1130, 330, 90, 'rgba(255,170,90,.8)', 1 - span(u, 10, 12));
    txt('レトロ転移', 640, 96, 34, '#ffd36b', span(u, 9, 10) * (1 - span(u, 17, 17.5)));
    const ps = span(u, 13, 14.5);
    if (ps > 0) { txt('イントロンなし ・ 元と別の染色体', 820, 150, 24, '#ffe8c0', ps, 'center', HAND, 600); txt('＝ 偽遺伝子', 640, 96, 34, '#ffb0a0', span(u, 17.5, 18.5)); wash('#050405', span(u, 17.2, 17.5) * (1 - span(u, 17.5, 17.8)) * 0.8); }
  });
  void t;
}

/** Line shrugs; the wind lifts her cape and she drifts off */
function goodbye(t: number, u: number) {
  g.drawImage(softBg('jump', 300, 300, 1.4, 'rgba(10,6,10,.45)'), 0, 0); glow(900, 260, 620, 'rgba(255,170,90,.45)', 1);
  const off = span(u, 4.2, 6, ease.in), hh = handheld(t, 2, 72);
  feathers(t, 900 + off * 600, 260 - off * 200, 14, 0.7);
  bust(LINE1, 620 + hh[0] + off * 900, 320 + hh[1] - off * 260, 320, { yaw: -0.2, gazeX: -0.3, gazeY: 0, mouth: talk(t, c[6], e[6]), blink: blinkAt(t, 7), smile: 0.7, tilt: Math.sin(t * 1.5) * 0.06 + 0.06 }, t, -1);
}

/** Jin goes back to the original shelf: it is covered in coloured sticky notes */
function notesShelf(t: number, u: number) {
  const k = span(u, 0.3, 4.5, (v) => v * v * (3 - 2 * v)), x = L(100, 470, k), moving = u < 4.5;
  const push = span(u, 4.5, 9.4, ease.inOut);
  shot({ x: L(600, 860, push), y: L(360, 300, push), z: L(1, 1.5, push) }, 1, () => {
    g.drawImage(aisle('pack', 0.6), -60, 0, W * 1.15, H);
    lampPool(900, 320, 560, 0.95);
    bookcase(720, 100, 440, 440);
    for (let i = 0; i < 26; i++) { const nx = 760 + (i % 7) * 52 + ((i * 13) % 9), ny = 160 + Math.floor(i / 7) * 80 + ((i * 7) % 11); g.save(); g.translate(nx, ny); g.rotate(((i * 17) % 7 - 3) * 0.04 + Math.sin(t * 1.4 + i) * 0.02); g.fillStyle = NOTE_COLS[i % 4]; g.fillRect(-18, -16, 36, 32); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-18, -16, 36, 6); g.restore(); }
    drawFigure(JIN, { x, y: 720, s: 450, dir: 1, t, yaw: 0.6, light: 1, blink: blinkAt(t, 1), walk: moving ? { p: (x - 100) / (450 * 0.115), amt: CL(Math.min(u * 2, (4.5 - u) * 2)) } : undefined,
      gazeX: 0.8, gazeY: -0.1, armN: { hand: [0.5, 1.2], grip: 1 }, holdN: (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) });
  });
}

export function jump(t: number, dd: number) {
  if (t < c[1] - 0.2) corridor(t);
  else if (t < c[2] - 0.2) arrival(t, t - (c[1] - 0.2));
  else if (t < c[3] - 0.2) share(t, t - (c[2] - 0.2));
  else if (t < c[4] - 0.2) temptation(t, t - (c[3] - 0.2));
  else if (t < c[5] - 0.2) noIntron(t, t - (c[4] - 0.2));
  else if (t < c[6] - 0.2) retro(t, t - (c[5] - 0.2));
  else if (t < c[7] - 0.2) goodbye(t, t - (c[6] - 0.2));
  else notesShelf(t, t - (c[7] - 0.2));
  [c[1], c[2], c[3], c[4], c[5], c[6], c[7]].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.55));
  wash('#050405', 1 - span(t, 0, 0.6));
  wash('#050405', span(t, d - 0.9, d));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  grain(t, 0.06);
  void dd; void H; void sheet;
}
