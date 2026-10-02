/**
 * Sets, props and type for「設計図の図書館」shared by every scene: the library outside in the rain,
 * the hall of shelves (one-point perspective), the desk with the green lamp, paper, the request slip,
 * the loose page. Static layers are painted once (cached) and reused.
 */
import { H, L, W, g, rr } from '../../../../engine/story/kit';
import { cached, glow, noise, rng } from '../../../../engine/story/cine';
import { buildTimeline } from '../../../../engine/story/timeline';
import type { StoryLine } from '../../../../engine/story/types';
import story from './story.json';

/** cue times of a scene's lines: c = starts, e = ends (scene time), d = scene length */
export function cues(scene: string) {
  const tl = buildTimeline((story as unknown as { lines: StoryLine[] }).lines);
  const s0 = tl.start[scene] ?? 0, ls = tl.lines.filter((l) => l.scene === scene);
  return { c: ls.map((l) => l.t0 - s0), e: ls.map((l) => l.t1 - s0), d: (tl.end[scene] ?? 0) - s0 };
}

export const MINCHO = '"Zen Old Mincho", "Hiragino Mincho ProN", serif';
export const HAND = '"Klee One", "Zen Kaku Gothic New", sans-serif';

/* ====================================================================== */
/* backgrounds painted once                                                */
/* ====================================================================== */

/** rainy night, stone library with tall lit windows; the clock shows 23:00 */
export const exterior = () => cached('gen-ext', W, H, (c2) => {
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
export const VX = 860, VY = 330, NEAR = 1, FAR = 7, TOP = -1000, FLOOR = 640;
export const HALL_OFF = 1000;
export const proj = (X: number, Y: number, z: number): [number, number] => [VX + (X - VX) / z, VY + (Y - VY) / z];
export const hall = () => cached('gen-hall', W, H + HALL_OFF, (c2) => {
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
export const mix = (a: string, b: string, k: number) => { const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(L(v, B[i], k))).join(',')})`; };

/** the hall blurred and darkened, as the out-of-focus background behind the desk */
export const deskBg = () => cached('gen-deskbg', W, H, (c2) => {
  c2.fillStyle = '#0f0b0e'; c2.fillRect(0, 0, W, H);
  try { c2.filter = 'blur(7px)'; } catch { /* no canvas filter: stays sharp */ }
  c2.drawImage(hall(), -260, -HALL_OFF - 120, W * 1.5, (H + HALL_OFF) * 1.5);
  c2.filter = 'none';
  c2.fillStyle = 'rgba(10,6,10,.45)'; c2.fillRect(0, 0, W, H);
});

/** paper with fibres */
export const paper = (w: number, h: number, key: string, tint = '#efe3c8') => cached(key, w, h, (c2) => {
  const r = rng(w * 7 + h);
  c2.fillStyle = tint; c2.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h * 0.004; i++) { c2.strokeStyle = `rgba(120,95,60,${0.04 + r() * 0.07})`; c2.lineWidth = 0.6; const x = r() * w, y = r() * h, a = r() * 6.28, l = 3 + r() * 9; c2.beginPath(); c2.moveTo(x, y); c2.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c2.stroke(); }
  const v = c2.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(110,80,40,.25)'); c2.fillStyle = v; c2.fillRect(0, 0, w, h);
});

/* ====================================================================== */
/* props                                                                  */
/* ====================================================================== */
export function umbrella(x: number, y: number, h: number, open: number, ang: number, t: number, wet = 1) {
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
export function slip(x: number, y: number, w: number, a: number, light = 1) {
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
export const STRAND = 'ATGGCTACCGATTC';
export const SMUDGE = 8;
export function page(x: number, y: number, w: number, a: number, flip = 1, glowK = 0) {
  const h = w * 1.3;
  g.save(); g.translate(x, y); g.rotate(a); g.scale(Math.max(0.06, Math.abs(flip)), 1);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  g.drawImage(paper(200, 260, 'gen-page-s', flip >= 0 ? '#efe3c8' : '#e2d4b4'), -w / 2, -h / 2, w, h);
  if (flip >= 0) { g.fillStyle = 'rgba(40,35,30,.6)'; for (let i = 0; i < 7; i++) g.fillRect(-w * 0.36, -h * 0.34 + i * h * 0.1, w * (0.72 - (i % 3) * 0.1), Math.max(0.8, w * 0.02)); }
  if (glowK > 0) { g.globalCompositeOperation = 'screen'; g.fillStyle = `rgba(190,215,255,${glowK * 0.5})`; g.fillRect(-w / 2, -h / 2, w, h); }
  g.restore();
}
export function brassClock(x: number, y: number, s: number, hh = 11, mm = 4) {
  g.fillStyle = '#8a6a2c'; rr(x - s, y - s * 0.2, s * 2, s * 1.4, s * 0.2); g.fill();
  g.fillStyle = '#b8923f'; g.beginPath(); g.arc(x, y - s * 0.25, s * 0.8, 0, 7); g.fill();
  g.fillStyle = '#efe6cf'; g.beginPath(); g.arc(x, y - s * 0.25, s * 0.66, 0, 7); g.fill();
  g.strokeStyle = '#2a2420'; g.lineWidth = Math.max(1, s * 0.07); g.lineCap = 'round';
  const hr = ((hh + mm / 60) / 12) * Math.PI * 2, mn = (mm / 60) * Math.PI * 2;
  g.beginPath(); g.moveTo(x, y - s * 0.25); g.lineTo(x + Math.sin(hr) * s * 0.35, y - s * 0.25 - Math.cos(hr) * s * 0.35); g.stroke();
  g.lineWidth = Math.max(1, s * 0.05); g.beginPath(); g.moveTo(x, y - s * 0.25); g.lineTo(x + Math.sin(mn) * s * 0.55, y - s * 0.25 - Math.cos(mn) * s * 0.55); g.stroke();
}

/* ---------- the desk shot set (used by C and E2) ---------- */
export const LAMP: [number, number] = [880, 392];
export function deskSet(t: number, under: () => void, over: () => void, clock: [number, number] = [11, 4]) {
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
  brassClock(760, 452, 22, clock[0], clock[1]);
  // banker's lamp
  g.fillStyle = '#8a6a2c'; rr(LAMP[0] - 40, 456, 80, 12, 4); g.fill(); g.fillRect(LAMP[0] - 4, 400, 8, 58);
  g.fillStyle = '#1f5a3c'; g.beginPath(); g.moveTo(LAMP[0] - 70, 404); g.quadraticCurveTo(LAMP[0], 352, LAMP[0] + 70, 404); g.lineTo(LAMP[0] - 70, 404); g.fill();
  g.fillStyle = 'rgba(140,220,170,.35)'; g.beginPath(); g.moveTo(LAMP[0] - 60, 396); g.quadraticCurveTo(LAMP[0], 362, LAMP[0] + 30, 380); g.lineTo(LAMP[0] - 60, 396); g.fill();
  glow(LAMP[0], 408, 70, 'rgba(255,230,180,.9)', 1);
  over();
}


/* ====================================================================== */
/* shared helpers for the later scenes                                    */
/* ====================================================================== */
import { blinkAt, drawHead, talk, type Face, type Look } from '../../../../engine/story/rig';
import { ease, span } from '../../../../engine/story/cine';
export { blinkAt, talk };

/** close-up of a character from the chest up: shoulders and clothes from the look, then the head */
export function bust(look: Look, cx: number, cy: number, hh: number, f: Face, t: number, light = 1) {
  const k = hh / 330;
  g.save(); g.translate(cx, cy); g.scale(k, k);
  g.fillStyle = look.skinShade; rr(-40, 110, 80, 120, 26); g.fill();
  g.fillStyle = 'rgba(90,40,30,.3)'; g.beginPath(); g.ellipse(0, 150, 46, 22, 0, 0, 7); g.fill();
  const sh = () => { g.beginPath(); g.moveTo(-470, 520); g.bezierCurveTo(-440, 300, -400, 262, -250, 238); g.quadraticCurveTo(-140, 214, -70, 200); g.lineTo(70, 200); g.quadraticCurveTo(140, 214, 250, 236); g.bezierCurveTo(400, 258, 450, 300, 480, 520); g.closePath(); };
  if (look.cape) { g.fillStyle = look.cape[0]; g.beginPath(); g.ellipse(0, 300, 470, 180, 0, Math.PI, 0); g.fill(); g.fillRect(-470, 300, 940, 300); }
  g.fillStyle = look.shirt; sh(); g.fill();
  g.save(); sh(); g.clip();
  const cg = g.createLinearGradient(-420, 0, 430, 0); cg.addColorStop(0, light > 0 ? look.topShade : look.top); cg.addColorStop(0.6, look.top); cg.addColorStop(1, light > 0 ? look.top : look.topShade);
  g.fillStyle = cg; g.beginPath(); g.moveTo(-500, 150); g.lineTo(-64, 190); g.lineTo(10, 600); g.lineTo(64, 190); g.lineTo(520, 150); g.lineTo(520, 640); g.lineTo(-500, 640); g.fill();
  g.strokeStyle = look.topTrim || 'rgba(0,0,0,.3)'; g.lineWidth = 10; g.beginPath(); g.moveTo(-64, 192); g.lineTo(6, 600); g.moveTo(64, 192); g.lineTo(14, 600); g.stroke();
  if (look.apron) { g.fillStyle = look.apron; rr(-170, 330, 340, 300, 20); g.fill(); }
  const fold = g.createLinearGradient(light > 0 ? -470 : 470, 0, light > 0 ? -150 : 150, 0); fold.addColorStop(0, 'rgba(0,0,0,.28)'); fold.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fold; g.fillRect(-480, 200, 960, 400);
  g.restore();
  g.fillStyle = look.shirt; [-1, 1].forEach((s) => { g.beginPath(); g.moveTo(s * 14, 196); g.lineTo(s * 92, 206); g.lineTo(s * 30, 268); g.closePath(); g.fill(); });
  if (look.necklace) for (let i = 0; i < 8; i++) { const a = Math.PI * (0.2 + (i / 7) * 0.6); g.fillStyle = i % 2 ? look.necklace : '#7d5aa8'; g.beginPath(); g.arc(Math.cos(a) * 120, 190 + Math.sin(a) * 110, 13, 0, 7); g.fill(); }
  if (look.satchel) { g.strokeStyle = look.satchel[1]; g.lineWidth = 30; g.beginPath(); g.moveTo(230, 222); g.quadraticCurveTo(120, 320, -10, 560); g.stroke(); }
  if (look.scarf) { g.fillStyle = look.scarf[0]; rr(-150, 150, 300, 80, 36); g.fill(); g.fillRect(20, 200, 80, 340); g.strokeStyle = look.scarf[1]; g.lineWidth = 12; for (let q = 0; q < 2; q++) { g.beginPath(); for (let i = 0; i <= 12; i++) { const y = 210 + i * 26, x = 60 + Math.sin(i * 0.9 + q * Math.PI) * 30; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); } }
  if (look.loupe) { g.strokeStyle = '#c9a050'; g.lineWidth = 5; g.beginPath(); g.moveTo(-60, 200); g.quadraticCurveTo(-30, 380, -10, 420); g.stroke(); }
  drawHead(look, 0, 0, 330, f, t, light);
  g.restore();
}

/** a sheet of paper with a soft shadow; fn draws its content in centred local coordinates */
export function sheet(x: number, y: number, w: number, h: number, rot: number, fn: (w: number, h: number) => void, key = 'gen-sheet', tint?: string) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,.42)'; g.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
  g.drawImage(paper(Math.round(w), Math.round(h), `${key}-${Math.round(w)}x${Math.round(h)}`, tint), -w / 2, -h / 2, w, h);
  fn(w, h);
  g.restore();
}
/** text helper (Mincho for print, Klee for handwriting) */
export function txt(s: string, x: number, y: number, size: number, col: string, a = 1, align: CanvasTextAlign = 'center', font = MINCHO, weight = 700) {
  if (a <= 0) return; g.save(); g.globalAlpha *= Math.min(1, a); g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); g.restore();
}
/** an ink arrow drawn progressively (p 0..1) */
export function inkArrow(x1: number, y1: number, x2: number, y2: number, col: string, p: number, w = 4) {
  if (p <= 0) return; const x = L(x1, x2, Math.min(1, p)), y = L(y1, y2, Math.min(1, p));
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.stroke();
  if (p >= 0.98) { const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 16 * Math.cos(a - 0.45), y2 - 16 * Math.sin(a - 0.45)); g.lineTo(x2 - 16 * Math.cos(a + 0.45), y2 - 16 * Math.sin(a + 0.45)); g.fill(); }
}
/** a round lens (the brass loupe): clip, magnified content, glass glare and the brass ring */
export function lens(cx: number, cy: number, r: number, fn: () => void) {
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip(); fn();
  const gl = g.createRadialGradient(cx - r * 0.4, cy - r * 0.5, 0, cx - r * 0.4, cy - r * 0.5, r * 1.2); gl.addColorStop(0, 'rgba(255,255,255,.18)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gl; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  g.restore();
  g.strokeStyle = '#b8892c'; g.lineWidth = r * 0.06; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(255,230,160,.6)'; g.lineWidth = r * 0.012; g.beginPath(); g.arc(cx, cy, r * 0.975, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
}
/** an interior seen soft behind the actors: a crop of the hall, blurred and tinted (painted once) */
export const softBg = (key: string, sx: number, sy: number, scale: number, tint: string) => cached('gen-bg-' + key, W, H, (c2) => {
  c2.fillStyle = '#0f0b0e'; c2.fillRect(0, 0, W, H);
  try { c2.filter = 'blur(6px)'; } catch { /* sharp */ }
  c2.drawImage(hall(), -sx, -sy - HALL_OFF, W * scale, (H + HALL_OFF) * scale);
  c2.filter = 'none';
  c2.fillStyle = tint; c2.fillRect(0, 0, W, H);
});
/** a wooden table top seen from above */
export const tableTop = (key = 'gen-table') => cached(key, W, H, (c2) => {
  const r = rng(77);
  const gr = c2.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#4a2f1c'); gr.addColorStop(1, '#2e1d11'); c2.fillStyle = gr; c2.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { c2.strokeStyle = `rgba(${r() < 0.5 ? '20,10,5' : '120,80,50'},${0.08 + r() * 0.1})`; c2.lineWidth = 1 + r() * 2; const y = r() * H; c2.beginPath(); c2.moveTo(0, y); for (let x = 0; x <= W; x += 60) c2.lineTo(x, y + Math.sin(x * 0.01 + i) * 6); c2.stroke(); }
  [180, 440, 700, 960, 1220].forEach((x) => { c2.strokeStyle = 'rgba(0,0,0,.35)'; c2.lineWidth = 2; c2.beginPath(); c2.moveTo(x, 0); c2.lineTo(x, H); c2.stroke(); });
});
/** pool of lamp light from a point (warm) */
export function lampPool(x: number, y: number, r: number, a = 1) { glow(x, y, r, 'rgba(255,196,120,.55)', a); }
/** the request slip, small motif, with an optional 済 stamp */
export function slipMotif(x: number, y: number, w: number, a: number, stamped = 0) {
  slip(x, y, w, a);
  if (stamped > 0) { g.save(); g.translate(x, y); g.rotate(a - 0.2); g.globalAlpha = Math.min(1, stamped); g.strokeStyle = '#b03232'; g.lineWidth = Math.max(1.5, w * 0.025); g.beginPath(); g.arc(-w * 0.1, h0(w), w * 0.16, 0, 7); g.stroke(); g.fillStyle = '#b03232'; g.font = `700 ${Math.round(w * 0.17)}px ${MINCHO}`; g.textAlign = 'center'; g.fillText('済', -w * 0.1, h0(w) + w * 0.06); g.restore(); }
}
const h0 = (w: number) => w * 0.05;
export const easeIO = ease.inOut;
export { span };

import type { Pose } from '../../../../engine/story/rig';
/** Deo standing behind the desk (as after the opening), facing Jin */
export function deskDeo(t: number, mouth: number, extra: Partial<Pose> = {}): Pose {
  return { x: 1060, y: 700, s: 570, dir: -1, t, yaw: -0.4, light: -1, noLegs: true, blink: blinkAt(t, 4), gazeX: -0.6, gazeY: 0.15, mouth, armN: { at: [960, 486], grip: 0.3 }, armF: { at: [1120, 492], grip: 0.3 }, ...extra };
}
/** Jin in front of the desk, the page in his left hand and the slip in his right */
export function deskJin(t: number, mouth: number, extra: Partial<Pose> = {}): Pose {
  return { x: 430, y: 860, s: 580, dir: 1, t, yaw: 0.45, light: 1, blink: blinkAt(t, 1), mouth, gazeX: 0.8, gazeY: 0.1,
    armN: { at: [520, 470], grip: 1 }, holdN: (hx, hy) => slip(hx + 26, hy - 8, 70, -0.15),
    armF: { hand: [0.35, 1.15], grip: 1 }, holdF: (hx, hy) => page(hx + 10, hy - 26, 40, -0.1, 1), ...extra };
}
/** a dark aisle of the stacks seen at eye level, lamp-lit (cached) */
export const aisle = (key: string, warm = 0.5) => cached('gen-aisle-' + key, W, H, (c2) => {
  c2.drawImage(hall(), -120, -HALL_OFF - 40, W * 1.25, (H + HALL_OFF) * 1.25);
  c2.fillStyle = `rgba(12,8,12,${0.5 - warm * 0.2})`; c2.fillRect(0, 0, W, H);
});
