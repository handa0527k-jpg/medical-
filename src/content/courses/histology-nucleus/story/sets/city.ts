/**
 * The cell city at night and the head office (nucleus) seen from outside.
 * The office is a round tower (inner wall = inner nuclear membrane) inside a lower ring wall (outer
 * wall = outer nuclear membrane) with a dark moat between them (perinuclear space). Two corridors with
 * studded walls (rough ER, the studs are ribosomes) run straight into the outer wall — they are one wall.
 */
import { g, W, H, L } from '../../../../../engine/story/kit';
import { cached, noise } from '../../../../../engine/story/cine';
import type { Camera, V3 } from '../../../../../engine/story/mocap';
import { v } from '../../../../../engine/story/mocap';
import { quad, seg, use, P } from '../../../../../engine/story/set3d';
import type { Lamp } from '../../../../../engine/story/light';

export const HQ: V3 = [0, 0, -40];
export const R_OUT = 15, R_IN = 12.5, H_OUT = 7, H_IN = 13;
export const CORR_X = 2.3;               // corridor walls at x = ±CORR_X
export const GATE_Z = HQ[2] + R_OUT;      // where the corridor meets the outer wall

/** the night sky over the city, with the silhouettes of other organelles (painted once) */
const skyline = (dawn: boolean) => cached(dawn ? 'nuc-sky-dawn' : 'nuc-sky', 2400, 900, (c) => {
  const gr = c.createLinearGradient(0, 0, 0, 900);
  if (dawn) { gr.addColorStop(0, '#3a4a7a'); gr.addColorStop(0.55, '#c98aa0'); gr.addColorStop(1, '#ffd6a0'); }
  else { gr.addColorStop(0, '#04060e'); gr.addColorStop(0.6, '#121831'); gr.addColorStop(1, '#2a2240'); }
  c.fillStyle = gr; c.fillRect(0, 0, 2400, 900);
  let s = 9; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  if (!dawn) for (let i = 0; i < 200; i++) { c.fillStyle = `rgba(255,250,230,${0.2 + r() * 0.6})`; c.fillRect(r() * 2400, r() * 450, 1.3, 1.3); }
  const ink = dawn ? 'rgba(70,50,90,.85)' : '#0b0d1a';
  // mitochondria (long capsules with cristae windows), Golgi stacks, vesicles
  for (let i = 0; i < 9; i++) {
    const x = 80 + i * 270 + r() * 60, y = 640 + r() * 90, w = 150 + r() * 90, h = 50 + r() * 20;
    c.fillStyle = ink; c.beginPath(); c.ellipse(x, y, w / 2, h / 2, -0.1 + r() * 0.2, 0, 7); c.fill();
    c.strokeStyle = dawn ? 'rgba(255,200,170,.35)' : 'rgba(255,190,120,.35)'; c.lineWidth = 2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * w * 0.16, y - h * 0.3); c.lineTo(x + k * w * 0.16 + 6, y + h * 0.3); c.stroke(); }
  }
  for (let i = 0; i < 4; i++) { const x = 300 + i * 560, y = 560; c.fillStyle = ink; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x, y + k * 16, 90 - k * 6, 9, 0, 0, 7); c.fill(); } }
  c.fillStyle = ink; c.fillRect(0, 700, 2400, 200);
});

/** a vertical cylinder wall (only the faces turned toward the camera), with optional windows */
function cylinder(cam: Camera, c: V3, r: number, h: number, col: string, shadeCol: string, win?: (x: number, y: number, a: number) => string | null, n = 40) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
    const nx = Math.sin(am), nz = Math.cos(am);
    const mid: V3 = [c[0] + nx * r, h / 2, c[2] + nz * r];
    if (v.dot([nx, 0, nz], v.sub(cam.pos, mid)) <= 0) continue;
    const p0: V3 = [c[0] + Math.sin(a0) * r, 0, c[2] + Math.cos(a0) * r], p1: V3 = [c[0] + Math.sin(a1) * r, 0, c[2] + Math.cos(a1) * r];
    const lit = 0.55 + 0.45 * Math.max(0, nx * -0.4 + nz * 0.9);
    quad([p0, p1, [p1[0], h, p1[2]], [p0[0], h, p0[2]]], lit > 0.8 ? col : shadeCol);
    if (win) for (let y = 1.2; y < h - 0.8; y += 1.5) { const wc = win(am, y, lit); if (!wc) continue; const q0 = v.lerp(p0, p1, 0.3), q1 = v.lerp(p0, p1, 0.7); quad([[q0[0], y, q0[2]], [q1[0], y, q1[2]], [q1[0], y + 0.8, q1[2]], [q0[0], y + 0.8, q0[2]]], wc); }
  }
}

export interface CityOpts { dawn?: number; windows?: number; litOrder?: number }
/** the whole exterior: sky, ground, the office, corridors with ribosome studs */
export function city(cam: Camera, t: number, o: CityOpts = {}) {
  use(cam);
  const dawn = o.dawn ?? 0;
  g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H);
  // sky (screen space, slow parallax with the camera's heading)
  const head = Math.atan2(cam.fwd[0], -cam.fwd[2]);
  const img = skyline(false), ox = -head * 900 - 600, hz = P([cam.pos[0] + cam.fwd[0] * 200, 0, cam.pos[2] + cam.fwd[2] * 200]).y;
  g.drawImage(img, ox, hz - 700, 2400, 900);
  if (dawn > 0) { g.save(); g.globalAlpha = dawn; g.drawImage(skyline(true), ox, hz - 700, 2400, 900); g.restore(); }
  g.fillStyle = dawn > 0.5 ? '#3a2f40' : '#0b0d1a'; g.fillRect(0, hz + 199, W, H);
  // ground of the city (cytoplasm)
  quad([[-80, 0, -120], [80, 0, -120], [80, 0, 60], [-80, 0, 60]], dawn > 0.5 ? '#3f3248' : '#17131f');
  for (let z = -120; z < 60; z += 3) seg([-80, 0, z], [80, 0, z], 'rgba(0,0,0,.2)', 1);
  // the moat floor between the walls (dark water)
  const moat = (r: number, col: string) => { const pts: V3[] = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; pts.push([HQ[0] + Math.sin(a) * r, 0.01, HQ[2] + Math.cos(a) * r]); } quad(pts, col); };
  moat(R_OUT, '#07070d'); moat(R_IN, '#1a1626');
  // inner tower (the office proper) with lit windows; roof
  const winK = o.windows ?? 1, order = o.litOrder ?? 1;
  cylinder(cam, HQ, R_IN, H_IN, dawn > 0.5 ? '#b9a3c8' : '#5a4a72', dawn > 0.5 ? '#8a7598' : '#3e3352', (a, y) => {
    const on = Math.abs(Math.sin(a * 13.7 + y * 3.1)) < 0.55 * winK || (y / H_IN < order && Math.abs(Math.sin(a * 7.1 + y * 5.3)) < 0.8 * (1 - winK));
    return on ? `rgba(255,214,150,${0.7 + 0.15 * noise(t * 0.3 + a, y)})` : (dawn > 0.5 ? 'rgba(90,70,110,.6)' : 'rgba(30,24,44,.9)');
  });
  const roof: V3[] = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; roof.push([HQ[0] + Math.sin(a) * R_IN, H_IN, HQ[2] + Math.cos(a) * R_IN]); }
  if (cam.pos[1] > H_IN) quad(roof, dawn > 0.5 ? '#a48fb4' : '#2c2440');
  // outer ring wall (lower), faint windows; drawn after the tower: it stands in front of it
  cylinder(cam, HQ, R_OUT, H_OUT, dawn > 0.5 ? '#cbb6d6' : '#4a3f62', dawn > 0.5 ? '#9d88aa' : '#342c48', (a, y, lit) => (Math.abs(Math.sin(a * 17 + y)) < 0.18 ? `rgba(255,214,150,${0.35 * lit})` : null));
  const rimPts: V3[] = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; rimPts.push([HQ[0] + Math.sin(a) * R_OUT, H_OUT, HQ[2] + Math.cos(a) * R_OUT]); }
  if (cam.pos[1] > H_OUT) { g.strokeStyle = 'rgba(200,180,230,.5)'; g.lineWidth = 2; g.beginPath(); rimPts.forEach((p, i) => { const q = P(p); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }); g.stroke(); }
  // the gate at the end of the corridor (a ring of eight lights)
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const q = P([Math.cos(a) * 1.5, 1.6 + Math.sin(a) * 1.5, GATE_Z + 0.05]); g.fillStyle = 'rgba(200,180,240,.95)'; g.beginPath(); g.arc(q.x, q.y, Math.max(1.5, q.s * 0.14), 0, 7); g.fill(); }
  const gc = P([0, 1.6, GATE_Z]); const gg = g.createRadialGradient(gc.x, gc.y, 0, gc.x, gc.y, Math.max(8, gc.s * 2)); gg.addColorStop(0, 'rgba(255,226,170,.8)'); gg.addColorStop(1, 'rgba(255,226,170,0)'); g.fillStyle = gg; g.beginPath(); g.arc(gc.x, gc.y, Math.max(8, gc.s * 2), 0, 7); g.fill();
  // corridors (rough ER): low walls running into the outer wall, studded with ribosomes
  for (const sx of [-1, 1]) {
    const x = sx * CORR_X, z0 = GATE_Z, z1 = 40;
    const inner = cam.pos[0] * sx < CORR_X; // camera between the walls sees the inner face
    quad([[x, 0, z0], [x, 0, z1], [x, 1.5, z1], [x, 1.5, z0]], inner ? '#3a3050' : '#2a2238');
    quad([[x - 0.25 * sx, 1.5, z0], [x + 0.0, 1.5, z0], [x, 1.5, z1], [x - 0.25 * sx, 1.5, z1]], '#4a3f62');
    for (let z = z0 + 0.5; z < z1; z += 0.55) {
      const q = P([x - sx * 0.12, 1.58, z]); if (q.d < 2.2 || q.d > 70) continue;
      g.fillStyle = '#2a1f3a'; g.beginPath(); g.arc(q.x, q.y, Math.max(1, q.s * 0.09), 0, 7); g.fill();
      g.fillStyle = `rgba(230,190,255,${0.35 + 0.25 * Math.sin(t * 1.3 + z)})`; g.beginPath(); g.arc(q.x - q.s * 0.03, q.y - q.s * 0.03, Math.max(0.6, q.s * 0.03), 0, 7); g.fill();
    }
  }
  // corridor floor
  quad([[-CORR_X, 0.005, GATE_Z], [CORR_X, 0.005, GATE_Z], [CORR_X, 0.005, 40], [-CORR_X, 0.005, 40]], dawn > 0.5 ? '#4a3c56' : '#211b2d');
  for (let z = GATE_Z; z < 40; z += 1.2) seg([-CORR_X, 0.01, z], [CORR_X, 0.01, z], 'rgba(0,0,0,.25)', 1);
}

/** light pools along the corridor and from the office */
export function cityLamps(cam: Camera, t: number): Lamp[] {
  use(cam);
  const ls: Lamp[] = [];
  const hq = P([HQ[0], H_IN * 0.55, HQ[2] + R_IN]); ls.push({ x: hq.x, y: hq.y, r: R_IN * 1.4 * hq.s, k: 0.55, col: 'rgba(255,200,140,.18)', sy: 0.7 });
  const gc = P([0, 1.6, GATE_Z]); ls.push({ x: gc.x, y: gc.y, r: Math.max(40, 5 * gc.s), k: 0.8, col: 'rgba(255,214,160,.3)' });
  for (let z = GATE_Z + 4; z < 40; z += 6) { const q = P([0, 0.6, z]); if (q.d < 0.4) continue; ls.push({ x: q.x, y: q.y, r: 2.8 * q.s, k: 0.5 + 0.08 * noise(t + z, 2), col: 'rgba(210,170,255,.12)', sy: 0.6 }); }
  return ls;
}
export { L };
