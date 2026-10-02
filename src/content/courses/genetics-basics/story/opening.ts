/**
 * 「設計図の図書館」opening (~46 s): rain outside → the hall of shelves → the desk and the request slip
 * → a page falls in silence → "pages don't fall by themselves".
 * Shot timing is taken from the recorded lines (cues), so picture, voice and subtitles stay together
 * even after the voices are re-recorded. Everything is a pure function of the scene time.
 * Storyboard: docs/story/genetics-library-storyboard.md
 */
import { buildTimeline } from '../../../../engine/story/timeline';
import type { StoryLine } from '../../../../engine/story/types';
import { CL, H, L, W, g, rr } from '../../../../engine/story/kit';
import { blurred, cached, dust, ease, glow, grade, grain, handheld, noise, rainfall, ripples, rng, shaft, shot, span, wash } from '../../../../engine/story/cine';
import { blinkAt, drawFigure, drawHead, talk, type Pose } from '../../../../engine/story/rig';
import story from './story.json';
import { DEO, JIN } from './cast';

/* ---------- cues (scene time of each line) ---------- */
const TL = buildTimeline((story as unknown as { lines: StoryLine[] }).lines);
const S0 = TL.start.opening ?? 0;
const OL = TL.lines.filter((l) => l.scene === 'opening');
const c = OL.map((l) => l.t0 - S0), e = OL.map((l) => l.t1 - S0);
/** shot boundaries */
const T = {
  B: c[1] + 0.2, // into the hall
  C: e[2] + 0.15, // at the desk
  D1: c[4] - 0.2, // the slip (insert)
  D2: c[4] + 1.8, // Jin's face
  E1: e[4] + 0.4, // the page falls (silence)
  E2: e[4] + 2.3, // Jin turns and catches it
  F: c[5] + 0.1, // over the shoulder: the page
};
const CATCH = T.F - 0.55;

const MINCHO = '"Zen Old Mincho", "Hiragino Mincho ProN", serif';
const HAND = '"Klee One", "Zen Kaku Gothic New", sans-serif';

/* ====================================================================== */
/* backgrounds painted once                                                */
/* ====================================================================== */

/** rainy night, stone library with tall lit windows; the clock shows 23:00 */
const exterior = () => cached('gen-ext', W, H, (c2) => {
  const r = rng(11);
  const sk = c2.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, '#070b16'); sk.addColorStop(0.55, '#141d33'); sk.addColorStop(1, '#1d2740');
  c2.fillStyle = sk; c2.fillRect(0, 0, W, H);
  // low clouds catching the town's glow
  for (let i = 0; i < 26; i++) { const x = r() * W, y = 30 + r() * 160, rad = 60 + r() * 140; const gr = c2.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(70,80,110,.35)'); gr.addColorStop(1, 'rgba(70,80,110,0)'); c2.fillStyle = gr; c2.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  // distant roofs and trees
  c2.fillStyle = '#0d1322'; c2.beginPath(); c2.moveTo(0, 470); for (let x = 0; x <= W; x += 40) c2.lineTo(x, 430 - Math.abs(Math.sin(x * 0.013)) * 60 - (x % 160 < 40 ? 30 : 0)); c2.lineTo(W, 560); c2.lineTo(0, 560); c2.fill();
  // the building
  const st = c2.createLinearGradient(0, 120, 0, 560); st.addColorStop(0, '#454a58'); st.addColorStop(1, '#2b2f3a');
  c2.fillStyle = st; c2.fillRect(240, 150, 800, 410);
  c2.fillStyle = '#353a47'; c2.beginPath(); c2.moveTo(220, 152); c2.lineTo(640, 70); c2.lineTo(1060, 152); c2.fill();
  c2.fillStyle = '#545a69'; c2.fillRect(222, 146, 836, 10); c2.fillRect(236, 540, 808, 22);
  // stone courses
  c2.strokeStyle = 'rgba(0,0,0,.18)'; c2.lineWidth = 1; for (let y = 170; y < 540; y += 22) { c2.beginPath(); c2.moveTo(240, y); c2.lineTo(1040, y); c2.stroke(); }
  // pilasters
  [250, 455, 805, 1010].forEach((x) => { c2.fillStyle = '#4c5260'; c2.fillRect(x, 156, 24, 384); c2.fillStyle = 'rgba(0,0,0,.25)'; c2.fillRect(x + 18, 156, 6, 384); });
  // tall arched windows with shelves seen inside
  const win = (x: number, y: number, w: number, h: number) => {
    c2.save(); c2.beginPath(); c2.moveTo(x, y + h); c2.lineTo(x, y + w / 2); c2.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c2.lineTo(x + w, y + h); c2.closePath(); c2.clip();
    const wg = c2.createLinearGradient(0, y, 0, y + h); wg.addColorStop(0, '#ffe2a8'); wg.addColorStop(1, '#d98a45'); c2.fillStyle = wg; c2.fillRect(x, y, w, h);
    for (let k = 0; k < 9; k++) { c2.fillStyle = `rgba(90,45,20,${0.25 + r() * 0.25})`; c2.fillRect(x + 4 + k * (w / 9), y + 30, w / 9 - 5, h); }
    c2.fillStyle = 'rgba(90,45,20,.45)'; for (let k = 0; k < 5; k++) c2.fillRect(x, y + 50 + k * (h / 5), w, 4);
    c2.restore();
    c2.strokeStyle = '#2a2e38'; c2.lineWidth = 6; c2.beginPath(); c2.moveTo(x, y + h); c2.lineTo(x, y + w / 2); c2.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c2.lineTo(x + w, y + h); c2.stroke();
    c2.lineWidth = 3; c2.beginPath(); c2.moveTo(x + w / 2, y); c2.lineTo(x + w / 2, y + h); for (let k = 1; k < 4; k++) { c2.moveTo(x, y + w / 2 + k * (h - w / 2) / 4); c2.lineTo(x + w, y + w / 2 + k * (h - w / 2) / 4); } c2.stroke();
  };
  win(300, 210, 130, 270); win(850, 210, 130, 270); win(510, 200, 74, 150); win(696, 200, 74, 150);
  // clock above the door: 23:00
  c2.fillStyle = '#e9e1cc'; c2.beginPath(); c2.arc(640, 300, 40, 0, 7); c2.fill(); c2.strokeStyle = '#2a2e38'; c2.lineWidth = 5; c2.stroke();
  c2.lineWidth = 2; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c2.beginPath(); c2.moveTo(640 + Math.cos(a) * 31, 300 + Math.sin(a) * 31); c2.lineTo(640 + Math.cos(a) * 36, 300 + Math.sin(a) * 36); c2.stroke(); }
  c2.lineCap = 'round'; c2.lineWidth = 4; c2.beginPath(); c2.moveTo(640, 300); c2.lineTo(640 + Math.sin(-Math.PI / 6) * 20, 300 - Math.cos(-Math.PI / 6) * 20); c2.stroke();
  c2.lineWidth = 3; c2.beginPath(); c2.moveTo(640, 300); c2.lineTo(640, 268); c2.stroke();
  // door (arched, wood) and steps
  c2.fillStyle = '#3a2618'; c2.beginPath(); c2.moveTo(590, 545); c2.lineTo(590, 410); c2.arc(640, 410, 50, Math.PI, 0); c2.lineTo(690, 545); c2.fill();
  c2.strokeStyle = '#24170e'; c2.lineWidth = 3; c2.beginPath(); c2.moveTo(640, 360); c2.lineTo(640, 545); c2.stroke();
  c2.fillStyle = '#4a4f5c'; c2.fillRect(560, 545, 160, 10); c2.fillRect(540, 555, 200, 10);
  // lamp posts
  [190, 1090].forEach((x) => { c2.fillStyle = '#151820'; c2.fillRect(x - 4, 400, 8, 210); c2.fillRect(x - 12, 600, 24, 10); c2.fillStyle = '#20242e'; c2.beginPath(); c2.moveTo(x - 16, 400); c2.lineTo(x + 16, 400); c2.lineTo(x + 10, 372); c2.lineTo(x - 10, 372); c2.fill(); c2.fillStyle = '#ffd28a'; c2.fillRect(x - 9, 378, 18, 20); });
});

/* ---------- the hall of shelves, one-point perspective (world y −1000 … 720) ---------- */
const VX = 860, VY = 330, NEAR = 1, FAR = 7, TOP = -1000, FLOOR = 640;
const HALL_OFF = 1000;
const proj = (X: number, Y: number, z: number): [number, number] => [VX + (X - VX) / z, VY + (Y - VY) / z];
const hall = () => cached('gen-hall', W, H + HALL_OFF, (c2) => {
  const r = rng(23);
  const Y = (y: number) => y + HALL_OFF;
  c2.fillStyle = '#120d12'; c2.fillRect(0, 0, W, H + HALL_OFF);
  // far wall with a tall moonlit window
  const [fx1, fy1] = proj(-200, TOP, FAR), [fx2, fy2] = proj(1480, FLOOR, FAR);
  c2.fillStyle = '#1b1620'; c2.fillRect(fx1, Y(fy1), fx2 - fx1, fy2 - fy1);
  c2.save(); c2.beginPath(); c2.moveTo(VX - 34, Y(VY + 30)); c2.lineTo(VX - 34, Y(VY - 120)); c2.arc(VX, Y(VY - 120), 34, Math.PI, 0); c2.lineTo(VX + 34, Y(VY + 30)); c2.closePath();
  const mg = c2.createLinearGradient(0, Y(VY - 160), 0, Y(VY + 30)); mg.addColorStop(0, '#9fb6d8'); mg.addColorStop(1, '#4c6488'); c2.fillStyle = mg; c2.fill(); c2.restore();
  c2.strokeStyle = '#141018'; c2.lineWidth = 3; c2.beginPath(); c2.moveTo(VX, Y(VY - 154)); c2.lineTo(VX, Y(VY + 30)); c2.moveTo(VX - 34, Y(VY - 60)); c2.lineTo(VX + 34, Y(VY - 60)); c2.stroke();
  // side walls of shelves
  const BOOK = ['#6d3b33', '#3f4f63', '#71603e', '#4c3c5e', '#3d5a49', '#7a4a2c', '#5d2e30', '#46505a', '#8a7650', '#2f3b52'];
  const fog = (col: string, z: number) => { const k = (z - NEAR) / (FAR - NEAR); return mix(col, '#17121a', 0.25 + k * 0.7); };
  const levels = 16;
  const wall = (X: number, door: boolean) => {
    for (let z = NEAR; z < FAR; z += 0.11) {
      const z2 = z + 0.11;
      for (let lv = 0; lv < levels; lv++) {
        const yA = L(TOP, FLOOR, lv / levels), yB = L(TOP, FLOOR, (lv + 1) / levels);
        const [x1, a1] = proj(X, yA, z), [x2, a2] = proj(X, yA, z2), [, b1] = proj(X, yB, z), [, b2] = proj(X, yB, z2);
        if (door && z < 1.75 && lv >= 11) continue; // the doorway on the near left
        // books: a little inset from the board, uneven heights
        const hgt = 0.62 + r() * 0.3;
        c2.fillStyle = fog(BOOK[Math.floor(r() * BOOK.length)], z);
        c2.beginPath(); c2.moveTo(x1, Y(L(b1, a1, hgt))); c2.lineTo(x2, Y(L(b2, a2, hgt))); c2.lineTo(x2, Y(b2)); c2.lineTo(x1, Y(b1)); c2.fill();
        // board under each level
        c2.fillStyle = fog('#3a2618', z); c2.beginPath(); c2.moveTo(x1, Y(b1) - 2); c2.lineTo(x2, Y(b2) - 2); c2.lineTo(x2, Y(b2) + 3 / z); c2.lineTo(x1, Y(b1) + 3 / z); c2.fill();
        // spine highlights now and then
        if (r() < 0.25) { c2.fillStyle = 'rgba(255,220,160,.08)'; c2.beginPath(); c2.moveTo(x1, Y(L(b1, a1, hgt))); c2.lineTo(L(x1, x2, 0.3), Y(L(b1, a1, hgt))); c2.lineTo(L(x1, x2, 0.3), Y(b1)); c2.lineTo(x1, Y(b1)); c2.fill(); }
      }
      // uprights every few metres
      if (Math.abs((z * 100) % 70) < 11) { const [ux, uy] = proj(X, TOP, z), [, ly] = proj(X, FLOOR, z); c2.fillStyle = fog('#2a1a10', z); c2.fillRect(ux - 5 / z, Y(uy), 10 / z, ly - uy); }
    }
  };
  wall(1480, false); wall(-200, true);
  // gallery railings on two upper levels
  [-420, -110].forEach((ry) => [1480, -200].forEach((X) => { c2.strokeStyle = '#3d2a1c'; c2.lineWidth = 4; c2.beginPath(); const [a, b] = proj(X, ry, NEAR), [cx2, d] = proj(X, ry, FAR); c2.moveTo(a, Y(b)); c2.lineTo(cx2, Y(d)); c2.stroke(); for (let z = 1; z < FAR; z += 0.35) { const [px, py] = proj(X, ry, z), [, py2] = proj(X, ry + 60, z); c2.lineWidth = 2 / z + 0.5; c2.beginPath(); c2.moveTo(px, Y(py)); c2.lineTo(px, Y(py2)); c2.stroke(); } }));
  // floor: planks toward the vanishing point and a red runner
  const [, fy] = proj(0, FLOOR, NEAR);
  const fl = c2.createLinearGradient(0, Y(VY), 0, Y(fy) + 120); fl.addColorStop(0, '#24170f'); fl.addColorStop(1, '#4a3020'); c2.fillStyle = fl;
  c2.beginPath(); c2.moveTo(proj(-200, FLOOR, FAR)[0], Y(proj(-200, FLOOR, FAR)[1])); c2.lineTo(proj(1480, FLOOR, FAR)[0], Y(proj(1480, FLOOR, FAR)[1])); c2.lineTo(W + 400, Y(fy) + 200); c2.lineTo(-400, Y(fy) + 200); c2.fill();
  c2.strokeStyle = 'rgba(0,0,0,.25)'; c2.lineWidth = 1.2; for (let X = -1200; X <= 2800; X += 70) { const [a, b] = proj(X, FLOOR, FAR), [cx2, d] = proj(X, FLOOR, 0.6); c2.beginPath(); c2.moveTo(a, Y(b)); c2.lineTo(cx2, Y(d)); c2.stroke(); }
  c2.fillStyle = '#5a1f22'; c2.beginPath(); const rA = proj(520, FLOOR, FAR), rB = proj(820, FLOOR, FAR), rC = proj(820, FLOOR, 0.6), rD = proj(520, FLOOR, 0.6); c2.moveTo(rA[0], Y(rA[1])); c2.lineTo(rB[0], Y(rB[1])); c2.lineTo(rC[0], Y(rC[1])); c2.lineTo(rD[0], Y(rD[1])); c2.fill();
  // ceiling beams
  c2.fillStyle = '#0c090c'; c2.fillRect(0, 0, W, Y(TOP) + 40);
  // the doorway on the near left (frame only; the rain is drawn live)
  c2.fillStyle = '#2a1a10'; c2.fillRect(70, Y(250), 260, Y(FLOOR) - Y(250) + 10);
  c2.fillStyle = '#0d1424'; c2.beginPath(); c2.moveTo(100, Y(FLOOR)); c2.lineTo(100, Y(330)); c2.arc(200, Y(330), 100, Math.PI, 0); c2.lineTo(300, Y(FLOOR)); c2.fill();
});
const mix = (a: string, b: string, k: number) => { const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(L(v, B[i], k))).join(',')})`; };

/** the hall blurred and darkened, as the out-of-focus background behind the desk */
const deskBg = () => cached('gen-deskbg', W, H, (c2) => {
  c2.fillStyle = '#0f0b0e'; c2.fillRect(0, 0, W, H);
  try { c2.filter = 'blur(7px)'; } catch { /* no canvas filter: stays sharp */ }
  c2.drawImage(hall(), -260, -HALL_OFF - 120, W * 1.5, (H + HALL_OFF) * 1.5);
  c2.filter = 'none';
  c2.fillStyle = 'rgba(10,6,10,.45)'; c2.fillRect(0, 0, W, H);
});

/** paper with fibres */
const paper = (w: number, h: number, key: string, tint = '#efe3c8') => cached(key, w, h, (c2) => {
  const r = rng(w * 7 + h);
  c2.fillStyle = tint; c2.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h * 0.004; i++) { c2.strokeStyle = `rgba(120,95,60,${0.04 + r() * 0.07})`; c2.lineWidth = 0.6; const x = r() * w, y = r() * h, a = r() * 6.28, l = 3 + r() * 9; c2.beginPath(); c2.moveTo(x, y); c2.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c2.stroke(); }
  const v = c2.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(110,80,40,.25)'); c2.fillStyle = v; c2.fillRect(0, 0, w, h);
});

/* ====================================================================== */
/* props                                                                  */
/* ====================================================================== */
function umbrella(x: number, y: number, h: number, open: number, ang: number, t: number, wet = 1) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.strokeStyle = '#1a1e28'; g.lineWidth = Math.max(1.5, h * 0.05);
  g.beginPath(); g.moveTo(0, h * 0.25); g.lineTo(0, -h * 2.9); g.stroke();
  g.beginPath(); g.arc(-h * 0.12, h * 0.25, h * 0.12, 0, Math.PI); g.stroke();
  const R = h * L(0.35, 2.1, open), top = -h * 2.9, depth = h * L(2.2, 0.85, open);
  const cg = g.createLinearGradient(-R, top, R, top + depth); cg.addColorStop(0, '#2e3f63'); cg.addColorStop(1, '#151d30');
  g.fillStyle = cg; g.beginPath(); g.moveTo(0, top);
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI, px = Math.cos(a) * R, py = top + depth + Math.sin(a + Math.PI) * h * 0.08 * open; if (i === 0) g.lineTo(px, py); else g.quadraticCurveTo(Math.cos(a - Math.PI / 16) * R, py - h * 0.12 * open, px, py); }
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(160,185,230,.35)'; g.lineWidth = 1; for (let i = 1; i < 8; i++) { const a = Math.PI + (i / 8) * Math.PI; g.beginPath(); g.moveTo(0, top); g.lineTo(Math.cos(a) * R, top + depth); g.stroke(); }
  // drips from the rim
  if (wet > 0 && open > 0.6) for (let i = 0; i < 6; i++) { const p = (t * 1.6 + i * 0.37) % 1, px = (-1 + (i / 5) * 2) * R * 0.95; g.fillStyle = `rgba(190,215,245,${(1 - p) * 0.8 * wet})`; g.beginPath(); g.arc(px, top + depth + p * h * 1.6, Math.max(1, h * 0.04), 0, 7); g.fill(); }
  g.restore();
}
function slip(x: number, y: number, w: number, a: number, light = 1) {
  const h = w * 0.62;
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
  g.drawImage(paper(240, 150, 'gen-slip-s'), -w / 2, -h / 2, w, h);
  g.strokeStyle = 'rgba(40,70,50,.7)'; g.lineWidth = Math.max(0.6, w * 0.006); g.strokeRect(-w / 2 + w * 0.04, -h / 2 + w * 0.04, w * 0.92, h - w * 0.08);
  g.fillStyle = 'rgba(40,40,40,.55)'; for (let i = 0; i < 3; i++) g.fillRect(-w * 0.38, -h * 0.12 + i * h * 0.2, w * (0.7 - i * 0.18), Math.max(0.8, w * 0.012));
  g.fillStyle = 'rgba(170,40,40,.7)'; g.beginPath(); g.arc(w * 0.33, -h * 0.22, w * 0.07, 0, 7); g.fill();
  if (light > 0) { g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(255,210,150,${0.12 * light})`; g.fillRect(-w / 2, -h / 2, w, h); }
  g.restore();
}
/** the loose page: one strand of letters, torn along the bottom edge */
const STRAND = 'ATGGCTACCGATTC';
const SMUDGE = 8;
function page(x: number, y: number, w: number, a: number, flip = 1, glowK = 0) {
  const h = w * 1.3;
  g.save(); g.translate(x, y); g.rotate(a); g.scale(Math.max(0.06, Math.abs(flip)), 1);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  g.drawImage(paper(200, 260, 'gen-page-s', flip >= 0 ? '#efe3c8' : '#e2d4b4'), -w / 2, -h / 2, w, h);
  if (flip >= 0) { g.fillStyle = 'rgba(40,35,30,.6)'; for (let i = 0; i < 7; i++) g.fillRect(-w * 0.36, -h * 0.34 + i * h * 0.1, w * (0.72 - (i % 3) * 0.1), Math.max(0.8, w * 0.02)); }
  if (glowK > 0) { g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(190,215,255,${glowK * 0.5})`; g.fillRect(-w / 2, -h / 2, w, h); }
  g.restore();
}
function brassClock(x: number, y: number, s: number) {
  g.fillStyle = '#8a6a2c'; rr(x - s, y - s * 0.2, s * 2, s * 1.4, s * 0.2); g.fill();
  g.fillStyle = '#b8923f'; g.beginPath(); g.arc(x, y - s * 0.25, s * 0.8, 0, 7); g.fill();
  g.fillStyle = '#efe6cf'; g.beginPath(); g.arc(x, y - s * 0.25, s * 0.66, 0, 7); g.fill();
  g.strokeStyle = '#2a2420'; g.lineWidth = Math.max(1, s * 0.07); g.lineCap = 'round';
  const hr = ((11 + 4 / 60) / 12) * Math.PI * 2, mn = (4 / 60) * Math.PI * 2;
  g.beginPath(); g.moveTo(x, y - s * 0.25); g.lineTo(x + Math.sin(hr) * s * 0.35, y - s * 0.25 - Math.cos(hr) * s * 0.35); g.stroke();
  g.lineWidth = Math.max(1, s * 0.05); g.beginPath(); g.moveTo(x, y - s * 0.25); g.lineTo(x + Math.sin(mn) * s * 0.55, y - s * 0.25 - Math.cos(mn) * s * 0.55); g.stroke();
}

/* ---------- the desk shot set (used by C and E2) ---------- */
const LAMP: [number, number] = [880, 392];
function deskSet(t: number, under: () => void, over: () => void) {
  g.drawImage(deskBg(), 0, 0);
  glow(LAMP[0], LAMP[1] + 60, 520, 'rgba(255,190,110,.55)', 0.94 + 0.06 * noise(t * 4, 2));
  under();
  // desk top and front
  const dg = g.createLinearGradient(0, 470, 0, 720); dg.addColorStop(0, '#5a3a24'); dg.addColorStop(0.08, '#3d2717'); dg.addColorStop(1, '#1f140c');
  g.fillStyle = '#6b4a30'; g.beginPath(); g.moveTo(560, 470); g.lineTo(W + 10, 462); g.lineTo(W + 10, 500); g.lineTo(540, 506); g.fill();
  g.fillStyle = dg; g.fillRect(540, 504, W - 530, H - 500);
  const lp = g.createRadialGradient(LAMP[0], 480, 10, LAMP[0], 480, 360); lp.addColorStop(0, 'rgba(255,214,150,.55)'); lp.addColorStop(1, 'rgba(255,214,150,0)');
  g.fillStyle = lp; g.beginPath(); g.moveTo(560, 470); g.lineTo(W + 10, 462); g.lineTo(W + 10, 500); g.lineTo(540, 506); g.fill();
  g.strokeStyle = 'rgba(255,220,170,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(540, 505); g.lineTo(W, 499); g.stroke();
  // books, ink, clock
  [['#6d3b33', 1150, 24], ['#3f4f63', 1160, 20], ['#71603e', 1168, 18]].forEach(([col, x, hgt], i) => { g.fillStyle = col as string; rr(x as number, 462 - 26 - i * 20, 150 - i * 12, hgt as number, 3); g.fill(); });
  g.fillStyle = '#141820'; rr(640, 446, 26, 30, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(644, 450, 4, 18);
  g.strokeStyle = '#ddd2b8'; g.lineWidth = 2; g.beginPath(); g.moveTo(660, 446); g.lineTo(700, 420); g.stroke();
  brassClock(760, 452, 22);
  // banker's lamp
  g.fillStyle = '#8a6a2c'; rr(LAMP[0] - 40, 456, 80, 12, 4); g.fill(); g.fillRect(LAMP[0] - 4, 400, 8, 58);
  g.fillStyle = '#1f5a3c'; g.beginPath(); g.moveTo(LAMP[0] - 70, 404); g.quadraticCurveTo(LAMP[0], 352, LAMP[0] + 70, 404); g.lineTo(LAMP[0] - 70, 404); g.fill();
  g.fillStyle = 'rgba(140,220,170,.35)'; g.beginPath(); g.moveTo(LAMP[0] - 60, 396); g.quadraticCurveTo(LAMP[0], 362, LAMP[0] + 30, 380); g.lineTo(LAMP[0] - 60, 396); g.fill();
  glow(LAMP[0], 408, 70, 'rgba(255,230,180,.9)', 1);
  over();
}

/* ====================================================================== */
/* shots                                                                  */
/* ====================================================================== */

function shotA(t: number) {
  const end = T.B, k = span(t, 0, end, ease.inOut);
  const cam = { x: 640, y: 380 + k * 10, z: 1 + k * 0.16 };
  shot(cam, 0.85, () => g.drawImage(exterior(), 0, 0));
  shot(cam, 0.85, () => {
    // window light flickers very slightly; the door opens at the end
    [[365, 345], [915, 345], [547, 275], [733, 275]].forEach(([x, y], i) => glow(x, y, 190, 'rgba(255,200,120,.35)', 0.8 + 0.2 * noise(t * 2, i)));
    [190, 1090].forEach((x, i) => glow(x, 388, 120, 'rgba(255,210,140,.55)', 0.9 + 0.1 * noise(t * 3, i + 5)));
    const door = span(t, end - 1.3, end - 0.2, ease.out);
    if (door > 0) { g.fillStyle = `rgba(255,205,140,${door})`; g.beginPath(); g.moveTo(590, 545); g.lineTo(590, 410); g.arc(640, 410, 50, Math.PI, Math.PI * 1.5); g.lineTo(640, 545); g.fill(); glow(615, 470, 160 * door, 'rgba(255,200,130,.8)', door); }
  });
  // wet pavement with reflections
  shot(cam, 1, () => {
    const pg = g.createLinearGradient(0, 560, 0, 760); pg.addColorStop(0, '#1b2132'); pg.addColorStop(1, '#0d1019'); g.fillStyle = pg; g.fillRect(-100, 560, W + 200, 260);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let X = -1600; X < 2900; X += 90) { g.beginPath(); g.moveTo(640 + (X - 640) * 0.25, 562); g.lineTo(X, 800); g.stroke(); } for (let y = 575; y < 760; y += 22 + (y - 560) * 0.2) { g.beginPath(); g.moveTo(-100, y); g.lineTo(W + 100, y); g.stroke(); }
    blurred(5, () => {
      g.save(); g.globalCompositeOperation = 'screen';
      [[365, 90], [915, 90], [547, 50], [733, 50], [190, 26], [1090, 26]].forEach(([x, w], i) => {
        const rg = g.createLinearGradient(0, 562, 0, 720); rg.addColorStop(0, 'rgba(255,190,110,.42)'); rg.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = rg;
        g.beginPath(); g.moveTo(x - w / 2, 562); for (let y = 562; y <= 720; y += 12) g.lineTo(x - w / 2 + noise(t * 1.5 + y * 0.05, i) * 7 + (y - 562) * 0.05, y); for (let y = 720; y >= 562; y -= 12) g.lineTo(x + w / 2 + noise(t * 1.5 + y * 0.05, i + 9) * 7 - (y - 562) * 0.05, y); g.fill();
      });
      g.restore();
    });
    ripples(t, [0, 580, W, 140], 26, 5);
  });
  rainfall(t, 0.25, 140, 31);
  // Jin with his umbrella, walking toward the door (left → right)
  const x0 = 110, x1 = 585, walkK = span(t, 0.8, end - 0.9, (u) => u * u * (3 - 2 * u));
  const x = L(x0, x1, walkK), sp = Math.min(1, (t - 0.8) * 1.5, (end - 0.9 - t) * 1.6);
  shot(cam, 1, () => {
    const s = 168;
    drawFigure(JIN, { x, y: 650, s, dir: 1, t, yaw: 0.78, walk: { p: (x - x0) / (s * 0.115), amt: CL(sp) }, light: 1, blink: blinkAt(t, 1),
      armN: { hand: [0.45, 0.2], grip: 1 }, holdN: (hx, hy, _a, h) => umbrella(hx, hy, h, 1, -0.12 + Math.sin(t * 4) * 0.02, t) });
    // his reflection, broken by the water
    g.save(); g.globalAlpha = 0.18; g.translate(0, 1300); g.scale(1, -1); drawFigure(JIN, { x, y: 650, s, dir: 1, t, yaw: 0.78, walk: { p: (x - x0) / (s * 0.115), amt: CL(sp) }, light: 1, armN: { hand: [0.45, 0.2], grip: 1 }, holdN: (hx, hy, _a, h) => umbrella(hx, hy, h, 1, -0.12, t, 0) }); g.restore();
  });
  rainfall(t, 0.6, 90, 32); rainfall(t, 1, 40, 33);
  // title
  const ti = span(t, 1.0, 2.6, ease.out) * (1 - span(t, 6.6, 8.2, ease.in));
  if (ti > 0) {
    g.save(); g.globalAlpha = ti; g.textAlign = 'center'; g.shadowColor = 'rgba(255,200,130,.45)'; g.shadowBlur = 24;
    const band = g.createLinearGradient(0, 30, 0, 200); band.addColorStop(0, 'rgba(5,8,16,0)'); band.addColorStop(0.5, 'rgba(5,8,16,.55)'); band.addColorStop(1, 'rgba(5,8,16,0)'); g.fillStyle = band; g.fillRect(0, 30, W, 170);
    g.font = `700 64px ${MINCHO}`; g.fillStyle = '#f6ead2'; g.fillText('設計図の図書館', 640, 118 - (1 - ti) * 8);
    g.shadowBlur = 0; g.font = `400 21px ${MINCHO}`; g.fillStyle = 'rgba(240,226,200,.85)'; g.fillText('遺伝医学「遺伝子の基礎」より', 640, 158);
    g.restore();
  }
  grade('rgba(20,40,80,', 'rgba(255,180,110,', 1);
  wash('#ffe4bd', span(t, end - 0.25, end, ease.in) * 0.9);
}

/** Jin's pose inside the hall (B): enters, closes and shakes the umbrella, leaves it in the stand, looks up */
function hallJin(u: number, t: number): Pose {
  const enter = span(u, 0, 1.7, (k) => 1 - Math.pow(1 - k, 2.2));
  const x = L(170, 470, enter), walking = u < 1.75;
  const dip = span(u, 1.85, 2.05) * (1 - span(u, 2.05, 2.3));
  const close = span(u, 2.05, 2.6, ease.inOut);
  const shakeT = u - 2.7, shaking = shakeT > 0 && shakeT < 1.1;
  const shakeA = shaking ? Math.sin(shakeT * 22) * 0.38 * Math.exp(-shakeT * 2.6) : 0;
  const stow = span(u, 3.7, 4.5, ease.inOut), stowed = u > 4.5;
  const look = span(u, T.C - T.B - 6.0 - 0.0, T.C - T.B - 5.6); // eyes first
  const lookUp = c[2] - 0.6 - T.B;
  const eyes = span(u, lookUp, lookUp + 0.3), head = span(u, lookUp + 0.25, lookUp + 0.8, ease.out), body = span(u, lookUp + 0.45, lookUp + 1.1, ease.out);
  void look;
  const umbAng = -0.12 - dip * 0.35 + shakeA + stow * 0.6;
  return {
    x, y: 640, s: 330, dir: 1, t, yaw: L(0.62, 0.35, span(u, 1.8, 2.4)),
    walk: walking ? { p: (x - 170) / (330 * 0.115), amt: CL(Math.min(u * 2, (1.75 - u) * 3)) } : undefined,
    lean: -body * 0.07 + dip * 0.04, tilt: -head * 0.55, gazeY: -eyes, gazeX: 0.2, mouth: body * 0.18, brow: body * 0.4,
    blink: u > lookUp ? 0 : blinkAt(t, 1), light: 1,
    armN: stowed ? { a: 0.08, b: 0.25, grip: 0.3 } : stow > 0 ? { hand: [L(0.45, -0.2, stow), L(0.2, 2.1, stow)], grip: 1 } : { hand: [0.45 + dip * 0.2, 0.2 + dip * 0.3 + Math.abs(shakeA) * 0.4], grip: 1 },
    holdN: stowed ? undefined : (hx, hy, _a, h) => umbrella(hx, hy, h, 1 - close, umbAng, t, 1 - close),
  };
}
function shotB(t: number) {
  const u = t - T.B, end = T.C - T.B;
  const crane = span(u, c[2] - T.B + 0.3, end - 0.2, ease.inOut);
  const follow = span(u, 0, 4, ease.inOut);
  const cam = { x: L(560, 640, follow) + L(0, 120, crane), y: L(360, -250, crane), z: L(1.04, 0.96, crane) };
  shot(cam, 1, () => {
    g.drawImage(hall(), 0, -HALL_OFF);
    // rain seen through the open doorway, blue light spilling in
    g.save(); g.beginPath(); g.moveTo(100, FLOOR); g.lineTo(100, 330); g.arc(200, 330, 100, Math.PI, 0); g.lineTo(300, FLOOR); g.closePath(); g.clip();
    g.fillStyle = '#16213a'; g.fillRect(100, 230, 200, 420); g.translate(-500, -80); rainfall(t, 0.5, 120, 41); g.restore();
    shaft(200, 420, 200, 520, FLOOR + 20, 380, 'rgba(110,150,210,.45)', 0.6 * (1 - span(u, 2, 6)));
    // moonlight from the high windows, lamps hanging in the aisle
    shaft(VX - 10, VY - 140, 60, 600, FLOOR, 360, 'rgba(150,180,230,.5)', 0.55);
    [[-760, 1.3], [-520, 2.2], [-300, 3.4]].forEach(([y, z], i) => shaft(proj(1480, y, z)[0], proj(1480, y, z)[1] + 0, 70 / z, proj(500, FLOOR, z * 0.9)[0], FLOOR - 30, 220 / z, 'rgba(160,190,235,.42)', 0.5 + 0.1 * noise(t * 0.5, i)));
    [[1.6, 0], [2.6, 1], [4.2, 2]].forEach(([z, i]) => { const [lx, ly] = proj(VX + 40, -120, z); g.strokeStyle = 'rgba(20,14,10,.9)'; g.lineWidth = 2 / z; g.beginPath(); g.moveTo(lx, proj(0, TOP, z)[1]); g.lineTo(lx, ly); g.stroke(); glow(lx, ly, 160 / z, 'rgba(255,200,130,.75)', 0.9 + 0.1 * noise(t * 3, i)); g.fillStyle = '#ffdca0'; g.beginPath(); g.arc(lx, ly, 9 / z, 0, 7); g.fill(); });
    // the letters of the blueprint glinting on the spines high up
    const gl = span(u, c[2] + 3.4 - T.B, c[2] + 5 - T.B);
    if (gl > 0) { const r = rng(5); g.save(); g.font = `600 13px ${MINCHO}`; g.textAlign = 'center'; for (let i = 0; i < 70; i++) { const z = 1.05 + r() * 2.6, lv = r(), X = r() < 0.5 ? 1480 : -200; const [px, py] = proj(X, L(-560, -60, lv), z); const tw = 0.5 + 0.5 * Math.sin(t * 3 + i); g.globalAlpha = gl * (0.35 + 0.65 * tw); g.fillStyle = '#ffe2a0'; g.shadowColor = '#ffcf7a'; g.shadowBlur = 10; g.font = `700 ${Math.round(26 / z)}px ${MINCHO}`; g.fillText('ATGC'[i % 4], px + (X > 0 ? -6 : 6) / z, py); } g.restore(); }
    dust(t, [380, -900, 700, 1500], 160, 3, (x, y) => { const d = Math.abs((x - 600) - (y - 300) * 0.35); return CL(1 - d / 260) * 0.9 + 0.08; });
    // umbrella stand by the door, then Jin
    g.fillStyle = '#2d241d'; rr(380, 560, 46, 80, 6); g.fill(); g.fillStyle = 'rgba(255,220,170,.12)'; g.fillRect(384, 562, 8, 74);
    if (u > 4.5 - 0.01) umbrella(404, 600, 330 / 6.8, 0, 0.08, t, 0);
    drawFigure(JIN, hallJin(u, t));
    // drops thrown off by the shake
    const sh = u - 2.7;
    if (sh > 0 && sh < 2) { const r = rng(9); for (let i = 0; i < 40; i++) { const t0 = r() * 1.0; if (sh < t0) continue; const dt = sh - t0, vx = (r() - 0.5) * 520, vy = -120 - r() * 260; const x = 470 + 60 + vx * dt, y = 380 + vy * dt + 900 * dt * dt; g.globalAlpha = CL(1 - dt * 1.2); g.fillStyle = '#cfe0f5'; g.beginPath(); g.ellipse(x, y, 2.4, 3.6, 0, 0, 7); g.fill(); } g.globalAlpha = 1; }
  });
  grade('rgba(30,40,70,', 'rgba(255,180,110,', 0.9);
}

/** Deo behind the desk; he leans in and slides the slip across */
const SLIP_END: [number, number] = [700, 482];
function deoPose(t: number, rise = 0): Pose {
  const slideA = c[3] + 3.4, slideB = c[3] + 5.0;
  const lean = span(t, slideA - 0.6, slideA, ease.antic) * (1 - span(t, e[3] + 0.4, e[3] + 1.2, ease.inOut));
  const slide = span(t, slideA, slideB, ease.out);
  const handOn = t < slideB + 0.1;
  const speaking = (t > c[3] && t < e[3]) || (t > c[5] && t < e[5]);
  return {
    x: 1050, y: 850 - rise * 150, s: 570, dir: -1, t, yaw: -0.4, lean: lean * 0.14 - rise * 0.03, light: -1,
    blink: blinkAt(t, 4), mouth: Math.max(talk(t, c[3], e[3]), talk(t, c[5], e[5])), gazeX: -0.5, gazeY: rise > 0 ? 0.6 : 0.1,
    brow: speaking && t > c[5] ? -0.6 : 0, noLegs: true,
    armN: handOn ? { at: [L(960, SLIP_END[0] + 40, slide), 486], grip: 0.5 } : { at: [L(SLIP_END[0] + 40, 960, span(t, slideB + 0.1, slideB + 0.9, ease.inOut)), 488], grip: 0.3 },
    armF: { at: [1110, 492], grip: 0.3 },
  };
}
function slipOnDesk(t: number) {
  const slideA = c[3] + 3.4, slideB = c[3] + 5.0;
  const slide = span(t, slideA, slideB, ease.out);
  return { x: L(940, SLIP_END[0], slide), y: L(484, SLIP_END[1], slide), a: L(0.12, -0.06, slide) + Math.sin(slide * Math.PI) * 0.05 };
}
const GRAB = e[3] - 0.25;
function jinAtDesk(t: number, extra: Partial<Pose> = {}): Pose {
  const u = t - T.C;
  const enter = span(u, 0, 1.8, (k) => 1 - Math.pow(1 - k, 2.4));
  const x = L(-90, 430, enter);
  const reachA = GRAB - 1.2, reachB = GRAB;
  const antic = span(t, reachA, reachA + 0.35, ease.out) * (1 - span(t, reachA + 0.35, reachA + 0.5));
  const reach = span(t, reachA + 0.35, reachB, ease.back);
  const lift = span(t, GRAB + 0.15, GRAB + 0.9, ease.inOut);
  const hasSlip = t >= GRAB;
  const st = slipOnDesk(t);
  let armN: Pose['armN'];
  if (t < reachA) armN = undefined;
  else if (!hasSlip) armN = { at: [L(470 - antic * 30, st.x - 8, reach), L(560 + antic * 20, st.y - 4, reach)], grip: L(0.1, 0.8, reach) };
  else armN = { at: [L(st.x - 8, 520, lift), L(st.y - 4, 440, lift)], grip: 1 };
  return {
    x, y: 860, s: 580, dir: 1, t, yaw: 0.45, light: 1,
    walk: u < 1.85 ? { p: (x + 90) / (580 * 0.115), amt: CL(Math.min(u * 2.5, (1.85 - u) * 2.5)) } : undefined,
    lean: reach * 0.06 - lift * 0.02, blink: blinkAt(t, 1),
    gazeX: hasSlip ? 0.4 : 0.8, gazeY: t > reachA ? 0.7 : 0.15, tilt: t > reachA ? 0.12 : 0,
    armN, holdN: hasSlip ? (hx, hy) => slip(hx + 26, hy - 6, 70, -0.25 + lift * 0.1) : undefined,
    ...extra,
  };
}
function shotC(t: number) {
  const u = t - T.C, k = span(u, 0, T.D1 - T.C, ease.inOut);
  const hh = handheld(t, 2.2, 3);
  const cam = { x: 640 + k * 40 + hh[0], y: 360 + hh[1], z: 1 + k * 0.06 };
  shot(cam, 1, () => deskSet(t, () => drawFigure(DEO, deoPose(t)), () => {
    const st = slipOnDesk(t);
    if (t < GRAB) slip(st.x, st.y, 90, st.a);
    drawFigure(JIN, jinAtDesk(t));
  }));
  dust(t, [600, 200, 600, 300], 40, 8, (x, y) => CL(1 - Math.hypot(x - LAMP[0], y - 420) / 300));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 1);
}

function shotD1(t: number) {
  const u = t - T.D1, hh = handheld(t, 4, 5);
  g.drawImage(deskBg(), -200, 0, W * 1.3, H * 1.3);
  glow(1100, 200, 700, 'rgba(255,190,110,.55)', 1);
  g.save(); g.translate(640 + hh[0], 300 + hh[1] - span(u, 0, 2, ease.out) * 8); g.rotate(-0.03 + hh[2] * 20);
  const w = 780, h = 400;
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
  g.drawImage(paper(780, 400, 'gen-slip-l'), -w / 2, -h / 2);
  g.strokeStyle = 'rgba(40,80,55,.75)'; g.lineWidth = 3; g.strokeRect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44);
  g.fillStyle = '#284a36'; g.font = `700 44px ${MINCHO}`; g.textAlign = 'left'; g.fillText('閲 覧 票', -w / 2 + 52, -h / 2 + 90);
  g.fillStyle = 'rgba(40,74,54,.6)'; g.font = `400 18px ${MINCHO}`; g.fillText('設計図の図書館', -w / 2 + 250, -h / 2 + 88);
  g.strokeStyle = 'rgba(40,74,54,.35)'; g.lineWidth = 1.5; [130, 210, 290].forEach((y) => { g.beginPath(); g.moveTo(-w / 2 + 50, -h / 2 + y + 12); g.lineTo(w / 2 - 50, -h / 2 + y + 12); g.stroke(); });
  const ink = span(u, 0.1, 0.6);
  g.globalAlpha = ink; g.fillStyle = '#1d1a2a';
  g.font = `600 22px ${MINCHO}`; g.fillStyle = 'rgba(40,74,54,.9)'; g.fillText('請求', -w / 2 + 52, -h / 2 + 168); g.fillText('期限', -w / 2 + 52, -h / 2 + 252);
  g.fillStyle = '#1d1a2a'; g.font = `600 36px ${HAND}`; g.fillText('二日酔いの番人（ALDH2）の写し 一部', -w / 2 + 116, -h / 2 + 170);
  g.font = `600 38px ${HAND}`; g.fillText('午前六時', -w / 2 + 120, -h / 2 + 254);
  g.font = `600 20px ${HAND}`; g.fillStyle = 'rgba(29,26,42,.7)'; g.fillText('受付 23:04', w / 2 - 190, -h / 2 + 340);
  g.globalAlpha = ink * 0.75; g.strokeStyle = '#b03232'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2 - 92, -h / 2 + 78, 40, 0, 7); g.stroke(); g.fillStyle = '#b03232'; g.font = `700 17px ${MINCHO}`; g.textAlign = 'center'; g.fillText('設計図', w / 2 - 92, -h / 2 + 74); g.fillText('図書館', w / 2 - 92, -h / 2 + 95);
  g.globalAlpha = 1;
  const lg = g.createLinearGradient(-w / 2, 0, w / 2, 0); lg.addColorStop(0, 'rgba(40,20,10,.28)'); lg.addColorStop(1, 'rgba(255,210,150,.12)'); g.fillStyle = lg; g.fillRect(-w / 2, -h / 2, w, h);
  // his fingers on the lower corners
  [[-w / 2 + 40, h / 2 - 6, 0.3], [w / 2 - 40, h / 2 - 6, -0.3]].forEach(([x, y, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = JIN.skin; g.beginPath(); g.ellipse(0, 0, 34, 20, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,235,225,.6)'; g.beginPath(); g.ellipse(0, -8, 14, 8, 0, 0, 7); g.fill(); g.restore(); });
  g.restore();
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
}

function shotD2(t: number) {
  const u = t - T.D2, hh = handheld(t, 2.5, 6);
  g.drawImage(deskBg(), -320, -120, W * 1.5, H * 1.5);
  glow(1180, 260, 600, 'rgba(255,190,110,.6)', 1);
  const cx = 560 + hh[0], cy = 320 + hh[1];
  // shoulders: sloping cardigan, a V of shirt with collar points, the satchel strap, the neck
  g.fillStyle = JIN.skinShade; rr(cx - 40, cy + 110, 80, 120, 26); g.fill();
  g.fillStyle = 'rgba(90,40,30,.3)'; g.beginPath(); g.ellipse(cx, cy + 150, 46, 22, 0, 0, 7); g.fill();
  const sh = () => { g.beginPath(); g.moveTo(cx - 470, H + 20); g.bezierCurveTo(cx - 440, cy + 300, cx - 400, cy + 262, cx - 250, cy + 238); g.quadraticCurveTo(cx - 140, cy + 214, cx - 70, cy + 200); g.lineTo(cx + 70, cy + 200); g.quadraticCurveTo(cx + 140, cy + 214, cx + 250, cy + 236); g.bezierCurveTo(cx + 400, cy + 258, cx + 450, cy + 300, cx + 480, H + 20); g.closePath(); };
  g.fillStyle = JIN.shirt; sh(); g.fill();
  g.save(); sh(); g.clip();
  const cg = g.createLinearGradient(cx - 420, 0, cx + 430, 0); cg.addColorStop(0, JIN.topShade); cg.addColorStop(0.6, JIN.top); cg.addColorStop(1, '#5b7a62');
  g.fillStyle = cg; g.beginPath(); g.moveTo(cx - 500, cy + 150); g.lineTo(cx - 64, cy + 190); g.lineTo(cx + 10, H + 40); g.lineTo(cx + 64, cy + 190); g.lineTo(cx + 520, cy + 150); g.lineTo(cx + 520, H + 60); g.lineTo(cx - 500, H + 60); g.fill();
  g.strokeStyle = JIN.topTrim!; g.lineWidth = 10; g.beginPath(); g.moveTo(cx - 64, cy + 192); g.lineTo(cx + 6, H + 30); g.moveTo(cx + 64, cy + 192); g.lineTo(cx + 14, H + 30); g.stroke();
  const fold = g.createLinearGradient(cx - 470, 0, cx - 150, 0); fold.addColorStop(0, 'rgba(0,0,0,.28)'); fold.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fold; g.fillRect(cx - 480, cy + 200, 340, H);
  g.restore();
  g.fillStyle = JIN.shirt; [-1, 1].forEach((k) => { g.beginPath(); g.moveTo(cx + k * 14, cy + 196); g.lineTo(cx + k * 92, cy + 206); g.lineTo(cx + k * 30, cy + 268); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; g.stroke(); });
  g.strokeStyle = JIN.satchel![1]; g.lineWidth = 30; g.beginPath(); g.moveTo(cx + 230, cy + 222); g.quadraticCurveTo(cx + 120, cy + 320, cx - 10, H + 40); g.stroke();
  const read = span(u, 0, 0.7), up = span(t, c[4] + 2.1, c[4] + 2.6, ease.out);
  drawHead(JIN, cx, cy, 330, { yaw: 0.32, tilt: L(0.18, 0.04, up), gazeY: L(0.9, 0.05, up), gazeX: L(0.4, 0.7, up) * read, brow: up * 0.7, mouth: talk(t, c[4], e[4]), blink: up > 0.95 ? 0 : blinkAt(t + 1.3, 2) }, t, 1);
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
}

/** the page's fall through the moonlight: x, y in hall world coordinates */
function pageFall(t: number): { x: number; y: number; a: number; flip: number } {
  const s = t - T.E1;
  const y = -860 + s * 170 + s * s * 4;
  return { x: 760 + Math.sin(s * 2.1) * 70 + s * 10, y, a: Math.sin(s * 2.1 + 0.6) * 0.5, flip: Math.cos(s * 3.3) };
}
function shotE1(t: number) {
  const s = t - T.E1, p = pageFall(t);
  const cam = { x: 700, y: p.y + 120, z: 1.25, r: -0.02 };
  shot(cam, 1, () => {
    g.drawImage(hall(), 0, -HALL_OFF);
    shaft(1100, -1000, 120, 520, -200, 360, 'rgba(160,190,235,.55)', 0.75);
    const inBeam = CL(1 - Math.abs((p.x - 520) - (p.y + 200) * -0.73) / 160);
    dust(t, [500, p.y - 500, 520, 900], 120, 12, (x, y) => CL(1 - Math.abs((x - 520) - (y + 200) * -0.73) / 180) * 0.9 + 0.05);
    page(p.x, p.y, 52, p.a, p.flip, inBeam);
  });
  wash('#000', 0.15 * (1 - span(s, 0, 0.5)));
  grade('rgba(20,30,70,', 'rgba(200,210,255,', 1);
}

function shotE2(t: number) {
  const u = t - T.E2;
  // eyes → head → shoulders, then reach with anticipation and follow-through
  const eyes = span(t, T.E2 + 0.15, T.E2 + 0.3), head = span(t, T.E2 + 0.3, T.E2 + 0.6, ease.out);
  const reachA = CATCH - 0.5;
  const antic = span(t, reachA, reachA + 0.18, ease.out) * (1 - span(t, reachA + 0.18, reachA + 0.26));
  const reach = span(t, reachA + 0.2, CATCH, ease.back);
  // page falls into the frame and lands in his hand
  const caught = t >= CATCH;
  const fall = span(t, T.E2 - 0.2, CATCH, (k) => k);
  const pgX = L(300, 330, fall) + Math.sin(t * 3.2) * 26 * (1 - fall), pgY = L(-60, 330, fall);
  const settle = caught ? ease.settle(t - CATCH, 7, 2.4) : 0;
  const cam = { x: 600, y: 360, z: 1.02 + span(u, 0, 1.4) * 0.05 };
  const shake = caught ? Math.exp(-(t - CATCH) * 9) * 3 : 0;
  cam.x += Math.sin(t * 60) * shake; cam.y += Math.cos(t * 53) * shake;
  shot(cam, 1, () => deskSet(t, () => drawFigure(DEO, { ...deoPose(t), gazeX: -0.9, gazeY: 0.2, brow: 0.5 }), () => {
    const base = jinAtDesk(t, {});
    const pose: Pose = {
      ...base, yaw: L(0.45, -0.55, head), gazeX: L(0.4, -1, eyes), gazeY: L(0.7, -0.2, eyes), tilt: -head * 0.12, lean: -head * 0.05, blink: 0, brow: head * 0.6, mouth: head * 0.12,
      // the slip stays in his right hand at the chest; the left (far) hand catches the page
      armN: { at: [520, 440], grip: 1 }, holdN: (hx, hy) => slip(hx + 26, hy - 6, 70, -0.15),
      armF: caught ? { at: [L(pgX, 380, span(t, CATCH + 0.15, CATCH + 0.6, ease.inOut)), L(pgY, 420, span(t, CATCH + 0.15, CATCH + 0.6, ease.inOut))], grip: 1 }
        : t > reachA ? { at: [L(390 + antic * 20, pgX, reach), L(560 + antic * 30, pgY, reach)], grip: L(0.1, 0.6, reach) } : undefined,
      holdF: caught ? (hx, hy) => page(hx - 4, hy - 30, 46, (1 - settle) * 0.4 - 0.05, 1) : undefined,
    };
    drawFigure(JIN, pose);
    if (!caught) page(pgX, pgY, 46, Math.sin(t * 2.6) * 0.5, Math.cos(t * 3.4));
  }));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 1);
}

function shotF(t: number, d: number) {
  const u = t - T.F;
  const rise = span(t, c[5] + 0.3, c[5] + 1.3, ease.antic);
  const rackToDeo = span(t, c[5] + 1.1, c[5] + 1.8, ease.inOut) * (1 - span(t, e[5] - 1.4, e[5] - 0.8, ease.inOut));
  const push = span(t, e[5] - 1.0, d - 1.0, ease.inOut);
  const SM: [number, number] = [640 - 270 + SMUDGE * 40 + 18, 300];
  const cam = { x: L(640, SM[0], push), y: L(360, SM[1], push), z: L(1, 2.1, push) };
  shot(cam, 1, () => {
    // background: desk, lamp and Deo (out of focus unless we rack to him)
    blurred(L(6, 0.5, rackToDeo), () => deskSet(t, () => drawFigure(DEO, { ...deoPose(t, rise), x: 1080, gazeX: -0.7, gazeY: 0.4 }), () => {}));
    // the page in Jin's hands
    blurred(L(0, 7, rackToDeo), () => {
      const hh = handheld(t, 2, 7);
      g.save(); g.translate(640 + hh[0], 300 + hh[1]); g.rotate(-0.02 + hh[2] * 10);
      const w = 640, h = 300;
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
      g.drawImage(paper(640, 300, 'gen-page-l'), -w / 2, -h / 2);
      // torn bottom edge: the strand was pulled from its partner
      g.fillStyle = '#0d0a0c'; g.beginPath(); g.moveTo(-w / 2, h / 2 + 2); for (let x = -w / 2; x <= w / 2; x += 16) g.lineTo(x, h / 2 - 8 - (Math.sin(x * 0.37) + 1) * 7); g.lineTo(w / 2, h / 2 + 4); g.fill();
      g.fillStyle = 'rgba(40,35,30,.45)'; g.font = `400 18px ${MINCHO}`; g.textAlign = 'left'; g.fillText("5'", -w / 2 + 26, -10); g.textAlign = 'right'; g.fillText("3'", w / 2 - 26, -10);
      g.textAlign = 'center'; g.font = `700 46px ${MINCHO}`;
      [...STRAND].forEach((ch, i) => {
        const x = -270 + i * 40 + 18;
        if (i === SMUDGE) {
          const pulse = span(t, d - 2.2, d - 1.4) * (0.5 + 0.5 * Math.sin(t * 9));
          g.fillStyle = 'rgba(60,50,45,.35)'; g.beginPath(); g.ellipse(x, -18, 22, 28, 0.3, 0, 7); g.fill();
          g.fillStyle = 'rgba(40,35,35,.25)'; g.fillText(ch, x + 3, -2);
          if (pulse > 0) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(150,200,255,${pulse * 0.6})`; g.beginPath(); g.arc(x, -18, 34, 0, 7); g.fill(); g.restore(); }
        } else { g.fillStyle = '#2a2320'; g.fillText(ch, x, 0); }
      });
      g.strokeStyle = 'rgba(40,35,30,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-270, 24); g.lineTo(290, 24); g.stroke();
      g.fillStyle = 'rgba(40,35,30,.5)'; g.font = `400 16px ${MINCHO}`; g.fillText('―― 第？巻　頁不明 ――', 0, -h / 2 + 38);
      g.restore();
      // his hands at the edges
      slip(640 + 300 + hh[0] + 30, 440 + hh[1], 120, -0.3, 1); // still holding the request slip
      [[640 - 300, 430], [640 + 300, 430]].forEach(([x, y], i) => { g.fillStyle = JIN.skin; g.beginPath(); g.ellipse(x + hh[0], y + hh[1], 42, 26, i ? -0.4 : 0.4, 0, 7); g.fill(); g.fillStyle = 'rgba(150,80,60,.25)'; g.beginPath(); g.ellipse(x + hh[0] + (i ? -10 : 10), y + hh[1] + 10, 26, 10, 0, 0, 7); g.fill(); });
    });
  });
  // over the shoulder: the back of Jin's head, his ear, the temple of his glasses and the cardigan shoulder
  blurred(10, () => {
    g.fillStyle = JIN.topShade; g.beginPath(); g.moveTo(-60, H + 10); g.bezierCurveTo(-20, 600, 120, 560, 250, 590); g.bezierCurveTo(330, 610, 380, 660, 400, H + 10); g.fill();
    g.strokeStyle = JIN.satchel![1]; g.lineWidth = 26; g.beginPath(); g.moveTo(250, 600); g.lineTo(140, H + 20); g.stroke();
    g.fillStyle = JIN.skinShade; rr(150, 470, 90, 130, 30); g.fill();
    g.fillStyle = JIN.skin; g.beginPath(); g.ellipse(262, 440, 22, 40, 0.2, 0, 7); g.fill();
    g.fillStyle = JIN.hairShade; g.beginPath(); g.ellipse(170, 395, 140, 170, -0.15, 0, 7); g.fill();
    g.fillStyle = JIN.hair; g.beginPath(); g.ellipse(180, 380, 118, 150, -0.15, 0, 7); g.fill();
    const rim = g.createRadialGradient(270, 300, 10, 270, 300, 140); rim.addColorStop(0, 'rgba(255,190,120,.35)'); rim.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = rim; g.beginPath(); g.ellipse(180, 380, 118, 150, -0.15, 0, 7); g.fill();
    g.strokeStyle = '#2f2520'; g.lineWidth = 5; g.beginPath(); g.moveTo(250, 412); g.lineTo(340, 402); g.stroke();
  });
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 1);
  // page-turn into the next scene: a dark curl sweeps right → left
  const turn = span(t, d - 1.1, d - 0.05, ease.inOut);
  if (turn > 0) {
    const x = L(W + 80, -260, turn);
    g.fillStyle = '#050405'; g.fillRect(x, 0, W - x + 300, H);
    const cg = g.createLinearGradient(x - 160, 0, x, 0); cg.addColorStop(0, 'rgba(0,0,0,0)'); cg.addColorStop(0.6, 'rgba(230,214,180,.55)'); cg.addColorStop(1, 'rgba(120,100,70,.9)');
    g.fillStyle = cg; g.beginPath(); g.moveTo(x - 160 + Math.sin(turn * 3) * 30, 0); g.quadraticCurveTo(x - 60, H / 2, x - 140, H); g.lineTo(x, H); g.lineTo(x, 0); g.fill();
  }
  void u;
}

/** the whole opening: picks the shot for the scene time */
export function opening(t: number, d: number) {
  if (t < T.B) shotA(t);
  else if (t < T.C) shotB(t);
  else if (t < T.D1) shotC(t);
  else if (t < T.D2) shotD1(t);
  else if (t < T.E1) shotD2(t);
  else if (t < T.E2) shotE1(t);
  else if (t < T.F) shotE2(t);
  else shotF(t, d);
  // a dark bookcase passes close to the lens: wipe from the hall to the desk
  const wp = span(t, T.C - 0.45, T.C + 0.4, ease.inOut);
  if (wp > 0 && wp < 1) { const x = L(W + 240, -420, wp); const pg = g.createLinearGradient(x, 0, x + 420, 0); pg.addColorStop(0, 'rgba(8,5,6,0)'); pg.addColorStop(0.15, '#0a0607'); pg.addColorStop(0.85, '#0a0607'); pg.addColorStop(1, 'rgba(8,5,6,0)'); g.fillStyle = pg; g.fillRect(x, 0, 420, H); }
  grain(t, 0.07);
}

/** exported for tests and the storyboard: when each shot starts (scene time) */
export const OPENING_SHOTS = T;
