/**
 * A 2-D puppet for story characters with believable proportions: one look (face, hair, clothes,
 * build) per character, posed every frame from a few parameters — walk cycle with weight shift,
 * breathing, blinking, gaze, head turn, two-bone arm IK for reaching and grabbing, lip movement.
 * The same head is used for full figures and close-ups, so a character looks the same in every shot.
 */
import { CL, g, L, rr } from './kit';

export interface Look {
  /** body length in head heights (adult ≈ 6.8–7.4) */
  heads: number;
  /** shoulder width in head heights */
  shoulders: number;
  skin: string; skinShade: string; blush?: string;
  hair: string; hairShade: string; hairLight: string;
  hairStyle: 'messy' | 'swept';
  iris: string;
  glasses?: 'round' | 'half';
  beard?: string;
  brows: string;
  shirt: string;
  top: string; topShade: string; topTrim?: string;
  /** long coat down to the knees */
  coat?: boolean;
  pants: string; pantsShade: string;
  shoes: string;
  scarf?: [string, string];
  satchel?: [string, string];
  loupe?: boolean;
}

/** an arm either aims its hand at a point (head units, from the shoulder; +x = facing direction) or uses angles */
export type Arm = { hand: [number, number]; grip?: number } | { a: number; b: number; grip?: number } | { at: [number, number]; grip?: number };

export interface Face {
  /** head turn: 0 = toward the camera, ±1 = profile (sign = screen direction) */
  yaw?: number;
  /** nod: negative = look up */
  tilt?: number;
  gazeX?: number; gazeY?: number;
  blink?: number;
  mouth?: number;
  brow?: number;
  smile?: number;
}

export interface Pose extends Face {
  x: number; y: number;
  /** whole figure height in px */
  s: number;
  /** facing: 1 = screen right, -1 = left */
  dir: number;
  t: number;
  lean?: number;
  walk?: { p: number; amt: number };
  armN?: Arm; armF?: Arm;
  /** draw something in a hand: (x, y, forearm angle, head size) in screen space */
  holdN?: (x: number, y: number, a: number, h: number) => void;
  holdF?: (x: number, y: number, a: number, h: number) => void;
  /** skip legs (seated behind a desk, cut by the frame) */
  noLegs?: boolean;
  /** key light direction: -1 from the left … 1 from the right */
  light?: number;
}

type P = [number, number];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const polar = (len: number, ang: number, dir: number): P => [Math.sin(ang) * len * dir, Math.cos(ang) * len];

/** two-bone IK: elbow position for shoulder S reaching T with bone lengths a, b */
function ik(S: P, T: P, a: number, b: number, bendSign: number): [P, P] {
  const dx = T[0] - S[0], dy = T[1] - S[1];
  let d = Math.hypot(dx, dy); const maxd = (a + b) * 0.999;
  const tx = d > maxd ? S[0] + (dx / d) * maxd : T[0], ty = d > maxd ? S[1] + (dy / d) * maxd : T[1];
  d = Math.min(d, maxd);
  const base = Math.atan2(ty - S[1], tx - S[0]);
  const cosA = CL((a * a + d * d - b * b) / (2 * a * d || 1));
  const ang = base + Math.acos(cosA) * bendSign;
  return [[S[0] + Math.cos(ang) * a, S[1] + Math.sin(ang) * a], [tx, ty]];
}

function limb(a: P, b: P, w1: number, w2: number, col: string) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
  const c = Math.cos(ang), s = Math.sin(ang);
  g.fillStyle = col; g.beginPath();
  g.moveTo(a[0] + c * w1, a[1] + s * w1); g.lineTo(b[0] + c * w2, b[1] + s * w2);
  g.arc(b[0], b[1], w2, ang, ang + Math.PI); g.lineTo(a[0] - c * w1, a[1] - s * w1);
  g.arc(a[0], a[1], w1, ang + Math.PI, ang + 2 * Math.PI); g.closePath(); g.fill();
}

function hand(p: P, ang: number, h: number, look: Look, grip: number, dir: number) {
  g.save(); g.translate(p[0], p[1]); g.rotate(ang);
  const r = h * 0.15;
  g.fillStyle = look.skin; g.beginPath(); g.ellipse(0, r * 0.5, r * 0.82, r * L(1.2, 0.95, grip), 0, 0, 7); g.fill();
  // fingers curl with the grip, thumb on the facing side
  g.strokeStyle = look.skinShade; g.lineWidth = Math.max(1, h * 0.012);
  for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * r * 0.35, r * 0.9); g.lineTo(i * r * 0.35, r * L(1.65, 1.15, grip)); g.stroke(); }
  g.fillStyle = look.skin; g.beginPath(); g.ellipse(r * 0.7 * dir, r * 0.35, r * 0.28, r * 0.5, -0.5 * dir, 0, 7); g.fill();
  g.restore();
}

/* ---------- head ---------- */
/** draw a head whose crown-to-chin height is h, centred at (cx, cy) */
export function drawHead(look: Look, cx: number, cy: number, h: number, f: Face, t: number, light = -1) {
  const yaw = Math.max(-1, Math.min(1, f.yaw ?? 0)), ay = Math.abs(yaw), sd = Math.sign(yaw) || 1;
  const tilt = f.tilt ?? 0;
  const fx = yaw * h * 0.17; // feature shift with the turn
  const fy = tilt * h * 0.14;
  const lw = Math.max(0.8, h * 0.014);
  const hw = h * 0.42; // half width of the skull
  g.save(); g.translate(cx, cy);
  const lit = (a: string, b: string) => (light < 0 ? [a, b] : [b, a]);

  /* hair mass behind the head (and the nape) */
  g.fillStyle = look.hairShade;
  g.beginPath(); g.ellipse(-fx * 0.3, -h * 0.12, hw * 1.08, h * 0.5, 0, 0, 7); g.fill();
  if (look.hairStyle === 'messy') { g.beginPath(); g.moveTo(-hw * 1.02 - fx * 0.3, -h * 0.05); g.quadraticCurveTo(-hw * 0.9, h * 0.3, -hw * 0.5, h * 0.3); g.lineTo(hw * 0.5, h * 0.3); g.quadraticCurveTo(hw * 0.9, h * 0.3, hw * 1.02 - fx * 0.3, -h * 0.05); g.fill(); }

  /* ears */
  const ear = (side: number) => {
    const vis = side === sd ? 1 - ay * 1.1 : 1; if (vis <= 0.05) return;
    const ex = side * hw * (0.97 - (side === sd ? 0 : ay * 0.25)) - fx * 0.35;
    g.fillStyle = look.skinShade; g.beginPath(); g.ellipse(ex, h * 0.06 + fy * 0.4, h * 0.055 * vis, h * 0.1, side * 0.15, 0, 7); g.fill();
    g.fillStyle = 'rgba(150,80,60,.35)'; g.beginPath(); g.ellipse(ex - side * h * 0.01, h * 0.06 + fy * 0.4, h * 0.025 * vis, h * 0.055, 0, 0, 7); g.fill();
  };
  ear(-1); ear(1);

  /* face: cranium + cheeks + a rounded chin, turned with the yaw */
  const cheekN = hw, jawY = h * 0.28, chinY = h * 0.53 + fy * 0.25;
  const lx = -hw * (yaw < 0 ? 0.98 - ay * 0.15 : 0.98), rx = hw * (yaw > 0 ? 0.98 - ay * 0.15 : 0.98);
  const face = () => {
    g.beginPath();
    g.moveTo(lx, -h * 0.1);
    g.bezierCurveTo(lx - h * 0.01, -h * 0.62, rx + h * 0.01, -h * 0.62, rx, -h * 0.1);
    g.bezierCurveTo(rx, jawY * 0.5, rx * 0.9 + fx * 0.25, jawY, rx * 0.5 + fx * 0.7, h * 0.44);
    g.bezierCurveTo(rx * 0.24 + fx * 0.85, chinY, lx * 0.24 + fx * 0.85, chinY, lx * 0.5 + fx * 0.7, h * 0.44);
    g.bezierCurveTo(lx * 0.9 + fx * 0.25, jawY, lx, jawY * 0.5, lx, -h * 0.1);
    g.closePath();
  };
  void cheekN;
  const [c0, c1] = lit(look.skin, look.skinShade);
  const sk = g.createLinearGradient(-hw, 0, hw, 0); sk.addColorStop(0, c0); sk.addColorStop(0.5, look.skin); sk.addColorStop(1, c1);
  g.fillStyle = sk; face(); g.fill();
  g.save(); face(); g.clip();
  // soft form shading: under the hair line, the far cheek, under the chin
  const sh = g.createRadialGradient(-sd * hw * 0.9 + fx, h * 0.15, h * 0.05, -sd * hw * 0.9 + fx, h * 0.15, h * 0.45);
  sh.addColorStop(0, 'rgba(140,70,55,.22)'); sh.addColorStop(1, 'rgba(140,70,55,0)'); g.fillStyle = sh; g.fillRect(-h, -h, h * 2, h * 2);
  const top = g.createLinearGradient(0, -h * 0.4, 0, -h * 0.15); top.addColorStop(0, 'rgba(110,60,45,.35)'); top.addColorStop(1, 'rgba(110,60,45,0)'); g.fillStyle = top; g.fillRect(-h, -h, h * 2, h * 0.85);
  if (look.blush) { [-1, 1].forEach((k) => { const bx = fx + k * h * 0.22 * (k === sd ? 1 : 1 - ay * 0.5); const bg = g.createRadialGradient(bx, h * 0.17 + fy, 0, bx, h * 0.17 + fy, h * 0.09); bg.addColorStop(0, look.blush!); bg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = bg; g.fillRect(bx - h * 0.1, h * 0.07 + fy, h * 0.2, h * 0.2); }); }
  g.restore();

  /* eyes */
  const eyeY = h * 0.04 + fy, sep = h * 0.165;
  const blink = CL(f.blink ?? 0);
  const gx = (f.gazeX ?? 0) * h * 0.026, gy = (f.gazeY ?? 0) * h * 0.018;
  const br = f.brow ?? 0;
  [-1, 1].forEach((k) => {
    const near = k === sd;
    if (!near && ay > 0.85) return;
    const sx = near ? 1 : 1 - ay * 0.5;
    const ex = fx + k * sep * (near ? 1 + ay * 0.04 : 1 - ay * 0.6);
    const ew = h * 0.072 * sx, eh = h * 0.045, open = 1 - blink * 0.94;
    g.save(); g.translate(ex, eyeY);
    // eye white and iris, clipped by the lids
    if (open > 0.1) {
      g.save(); g.beginPath(); g.moveTo(-ew, 0); g.bezierCurveTo(-ew * 0.5, -eh * 1.5 * open, ew * 0.6, -eh * 1.45 * open, ew, -eh * 0.1); g.bezierCurveTo(ew * 0.5, eh * 0.9 * open, -ew * 0.5, eh * 0.95 * open, -ew, 0); g.closePath(); g.fillStyle = '#f7f3ec'; g.fill(); g.clip();
      const ix = gx + yaw * ew * 0.2, iy = gy + eh * 0.05, ir = h * 0.04;
      const ig = g.createLinearGradient(0, iy - ir, 0, iy + ir); ig.addColorStop(0, '#1b1310'); ig.addColorStop(0.45, look.iris); ig.addColorStop(1, mixHex(look.iris, '#d9b38c', 0.35));
      g.fillStyle = ig; g.beginPath(); g.arc(ix, iy, ir, 0, 7); g.fill();
      g.fillStyle = '#120c0a'; g.beginPath(); g.arc(ix, iy, ir * 0.45, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(ix - ir * 0.4, iy - ir * 0.42, ir * 0.24, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(ix + ir * 0.35, iy + ir * 0.35, ir * 0.11, 0, 7); g.fill();
      g.fillStyle = 'rgba(60,30,20,.22)'; g.fillRect(-ew, -eh * 2, ew * 2, eh * 1.25 * open); // lid shadow on the eyeball
      g.restore();
    }
    // upper lid with a lash flick at the outer corner, a crease above, a faint lower lid
    g.strokeStyle = '#22160f'; g.lineCap = 'round'; g.lineWidth = lw * 1.9;
    g.beginPath(); g.moveTo(-ew * 1.02, eh * 0.05); g.bezierCurveTo(-ew * 0.5, -eh * 1.5 * open - eh * 0.05, ew * 0.6, -eh * 1.45 * open - eh * 0.05, ew * 1.05, -eh * 0.1 * open);
    g.lineTo(ew * 1.05 + k * 0 + h * 0.012 * k, -eh * 0.35 * open - h * 0.004); g.stroke();
    if (open > 0.3) { g.strokeStyle = 'rgba(90,50,40,.45)'; g.lineWidth = lw * 0.7; g.beginPath(); g.moveTo(-ew * 0.7, -eh * 1.5); g.quadraticCurveTo(0, -eh * 2.1, ew * 0.8, -eh * 1.2); g.stroke();
      g.strokeStyle = 'rgba(120,60,50,.35)'; g.beginPath(); g.moveTo(-ew * 0.6, eh * 0.95); g.quadraticCurveTo(0, eh * 1.25, ew * 0.75, eh * 0.7); g.stroke(); }
    // brow: thin and tapered, inner end lifts with worry/surprise
    g.strokeStyle = look.brows; g.lineWidth = lw * 1.6;
    const inner = -k * sd >= 0 ? -1 : 1; void inner;
    g.beginPath(); g.moveTo(-ew * 1.1, -h * 0.088 - br * h * 0.035); g.quadraticCurveTo(0, -h * 0.112 - br * h * 0.05, ew * 1.15, -h * 0.092 - br * h * 0.02); g.stroke();
    g.restore();
  });

  /* nose: a soft side shadow and the tip */
  const nx = fx * 1.25;
  g.strokeStyle = 'rgba(120,60,45,.42)'; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.moveTo(nx - sd * h * 0.012, eyeY + h * 0.06); g.quadraticCurveTo(nx + sd * h * (0.02 + 0.03 * ay), eyeY + h * 0.15, nx + sd * h * 0.005, eyeY + h * 0.175); g.stroke();
  g.fillStyle = 'rgba(120,60,45,.3)'; g.beginPath(); g.ellipse(nx - sd * h * 0.012, eyeY + h * 0.18, h * 0.014, h * 0.007, 0, 0, 7); g.fill();

  /* mouth */
  const my = h * 0.315 + fy * 0.7, mw = h * 0.075 * (1 - ay * 0.3), mo = CL(f.mouth ?? 0), sm = f.smile ?? 0, mx = fx * 1.08;
  if (mo > 0.05) {
    g.fillStyle = '#4a2220'; g.beginPath(); g.moveTo(mx - mw, my - sm * h * 0.01); g.quadraticCurveTo(mx, my - h * 0.012, mx + mw, my - sm * h * 0.01); g.quadraticCurveTo(mx, my + h * 0.05 * mo + h * 0.008, mx - mw, my - sm * h * 0.01); g.fill();
    g.fillStyle = 'rgba(240,235,228,.85)'; g.beginPath(); g.ellipse(mx, my - h * 0.004, mw * 0.6, h * 0.007 * Math.min(1, mo * 2), 0, 0, Math.PI); g.fill();
    g.fillStyle = 'rgba(200,90,90,.5)'; g.beginPath(); g.ellipse(mx, my + h * 0.04 * mo, mw * 0.45, h * 0.012 * mo, 0, 0, 7); g.fill();
  } else {
    g.strokeStyle = '#7a3d34'; g.lineWidth = lw * 1.05; g.beginPath(); g.moveTo(mx - mw, my - sm * h * 0.012); g.quadraticCurveTo(mx, my + sm * h * 0.02 + h * 0.004, mx + mw, my - sm * h * 0.012); g.stroke();
    g.strokeStyle = 'rgba(150,80,70,.3)'; g.beginPath(); g.moveTo(mx - mw * 0.5, my + h * 0.03); g.quadraticCurveTo(mx, my + h * 0.04, mx + mw * 0.5, my + h * 0.03); g.stroke();
  }
  if (look.beard) {
    g.fillStyle = look.beard; g.globalAlpha = 0.92;
    g.beginPath(); g.moveTo(lx * 0.92 + fx * 0.3, h * 0.16); g.bezierCurveTo(lx * 0.85 + fx * 0.4, h * 0.42, lx * 0.3 + fx * 0.85, chinY + h * 0.06, fx * 0.9, chinY + h * 0.07);
    g.bezierCurveTo(rx * 0.3 + fx * 0.85, chinY + h * 0.06, rx * 0.85 + fx * 0.4, h * 0.42, rx * 0.92 + fx * 0.3, h * 0.16);
    g.bezierCurveTo(rx * 0.6 + fx, h * 0.34, mx + mw * 1.6, my + h * 0.02, mx, my + h * 0.05); g.bezierCurveTo(mx - mw * 1.6, my + h * 0.02, lx * 0.6 + fx, h * 0.34, lx * 0.92 + fx * 0.3, h * 0.16); g.fill();
    // moustache
    g.beginPath(); g.moveTo(mx - mw * 1.3, my - h * 0.005); g.quadraticCurveTo(mx, my - h * 0.06, mx + mw * 1.3, my - h * 0.005); g.quadraticCurveTo(mx, my - h * 0.025, mx - mw * 1.3, my - h * 0.005); g.fill();
    g.globalAlpha = 1;
  }

  /* glasses: thin frames, a faint lens tint and a glint */
  if (look.glasses) {
    const round = look.glasses === 'round';
    g.strokeStyle = round ? '#2f2520' : '#a9873a'; g.lineWidth = lw * 0.95;
    const xs: number[] = [];
    [-1, 1].forEach((k) => {
      const near = k === sd; if (!near && ay > 0.85) return;
      const ex = fx + k * sep * (near ? 1 + ay * 0.04 : 1 - ay * 0.6); xs.push(ex);
      const rx2 = h * 0.095 * (near ? 1 : 1 - ay * 0.5);
      g.beginPath(); if (round) g.ellipse(ex, eyeY, rx2, h * 0.08, 0, 0, 7); else { g.moveTo(ex - rx2, eyeY + h * 0.005); g.lineTo(ex + rx2, eyeY + h * 0.005); g.ellipse(ex, eyeY + h * 0.005, rx2, h * 0.055, 0, 0, Math.PI); }
      g.stroke();
      g.save(); g.globalCompositeOperation = 'screen'; g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = lw * 0.8; g.beginPath(); g.arc(ex - rx2 * 0.25, eyeY - h * 0.02, rx2 * 0.6, 3.7, 4.35); g.stroke(); g.restore();
    });
    if (xs.length === 2) { g.beginPath(); g.moveTo(xs[0] + h * 0.095 * (1 - ay * 0.3), eyeY - h * 0.01); g.quadraticCurveTo((xs[0] + xs[1]) / 2, eyeY - h * 0.035, xs[1] - h * 0.095 * (1 - ay * 0.3), eyeY - h * 0.01); g.stroke(); }
    // temple arm toward the far ear
    g.beginPath(); g.moveTo(fx + -sd * sep * (1 - ay * 0.6) - sd * h * 0.09, eyeY - h * 0.01); g.lineTo(-sd * hw * 0.95 - fx * 0.35, eyeY + h * 0.0); g.stroke();
  }

  /* hair in front */
  if (look.hairStyle === 'messy') {
    // cap of hair over the skull, a little fuller than the head
    g.fillStyle = look.hair;
    g.beginPath(); g.moveTo(-hw * 1.08 - fx * 0.2, h * 0.04);
    g.bezierCurveTo(-hw * 1.16 - fx * 0.2, -h * 0.74, hw * 1.16 - fx * 0.2, -h * 0.74, hw * 1.08 - fx * 0.2, h * 0.04);
    g.quadraticCurveTo(hw * 0.95, -h * 0.16, hw * 0.6 + fx * 0.3, -h * 0.24); g.quadraticCurveTo(fx * 0.4, -h * 0.3, -hw * 0.6 + fx * 0.3, -h * 0.24); g.quadraticCurveTo(-hw * 0.95, -h * 0.16, -hw * 1.08 - fx * 0.2, h * 0.04); g.closePath(); g.fill();
    // bangs: tapered locks that fall over the forehead, swept toward the facing side
    const locks: [number, number, number][] = [[-0.92, -0.02, 0], [-0.7, 0.05, 1], [-0.48, -0.01, 0], [-0.27, 0.07, 1], [-0.05, 0.0, 0], [0.16, 0.08, 1], [0.38, 0.02, 0], [0.6, 0.06, 1], [0.82, -0.02, 0]];
    locks.forEach(([u, len, shadeK], i) => {
      const rx0 = u * hw * 0.98 + fx * 0.55, sweep = sd * h * (0.05 + 0.02 * Math.sin(i * 1.7)) + Math.sin(t * 1.3 + i) * h * 0.003;
      const tipY = -h * 0.12 + len * h, w0 = h * 0.075;
      const lg = g.createLinearGradient(0, -h * 0.5, 0, tipY); lg.addColorStop(0, look.hair); lg.addColorStop(0.6, look.hair); lg.addColorStop(1, shadeK ? mixHex(look.hair, look.hairShade, 0.5) : look.hair);
      g.fillStyle = lg;
      g.beginPath(); g.moveTo(rx0 - w0, -h * 0.56);
      g.bezierCurveTo(rx0 - w0 * 0.8, -h * 0.22, rx0 + sweep * 0.4 - w0 * 0.2, tipY - h * 0.08, rx0 + sweep, tipY);
      g.bezierCurveTo(rx0 + sweep * 0.3 + w0 * 0.4, tipY - h * 0.1, rx0 + w0 * 0.7, -h * 0.24, rx0 + w0 * 1.1, -h * 0.58); g.closePath(); g.fill();
    });
    // side locks over the ears
    [-1, 1].forEach((k) => { const sx = k * hw * 1.0 - fx * 0.25; if (k === sd && ay > 0.6) return; g.fillStyle = look.hair; g.beginPath(); g.moveTo(sx - k * h * 0.02, -h * 0.25); g.quadraticCurveTo(sx + k * h * 0.04, h * 0.02, sx - k * h * 0.02, h * 0.16); g.quadraticCurveTo(sx - k * h * 0.06, -h * 0.02, sx - k * h * 0.1, -h * 0.22); g.fill(); });
    // cowlick
    g.strokeStyle = look.hair; g.lineWidth = lw * 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(fx * 0.2 + h * 0.03, -h * 0.6); g.quadraticCurveTo(fx * 0.2 + h * 0.08, -h * 0.69, fx * 0.2 + h * (0.05 + 0.012 * Math.sin(t * 2.6)), -h * 0.73); g.stroke();
  } else {
    // swept-back silver hair: receding temples, a soft widow's peak, combed back over the crown
    const hg = g.createLinearGradient(0, -h * 0.75, 0, h * 0.05); hg.addColorStop(0, look.hairLight); hg.addColorStop(0.45, look.hair); hg.addColorStop(1, look.hairShade);
    g.fillStyle = hg;
    g.beginPath(); g.moveTo(-hw * 1.04 - fx * 0.2, h * 0.02);
    g.bezierCurveTo(-hw * 1.12 - fx * 0.2, -h * 0.76, hw * 1.12 - fx * 0.2, -h * 0.76, hw * 1.04 - fx * 0.2, h * 0.02);
    g.quadraticCurveTo(hw * 0.95, -h * 0.2, hw * 0.72 + fx * 0.3, -h * 0.42); // receding temple
    g.quadraticCurveTo(hw * 0.35 + fx * 0.4, -h * 0.38, fx * 0.5, -h * 0.35); // gentle peak
    g.quadraticCurveTo(-hw * 0.35 + fx * 0.4, -h * 0.38, -hw * 0.72 + fx * 0.3, -h * 0.42);
    g.quadraticCurveTo(-hw * 0.95, -h * 0.2, -hw * 1.04 - fx * 0.2, h * 0.02); g.fill();
    g.strokeStyle = look.hairShade; g.lineWidth = lw * 0.5; g.globalAlpha = 0.4;
    for (let i = 0; i < 5; i++) { const u = -0.6 + i * 0.3; g.beginPath(); g.moveTo(u * hw * 0.7 + fx * 0.45, -h * 0.38); g.bezierCurveTo(u * hw * 0.8 + fx * 0.2, -h * 0.5, u * hw * 0.9, -h * 0.62, u * hw * 1.05 - fx * 0.2, -h * 0.66); g.stroke(); }
    g.globalAlpha = 1;
  }
  // crown highlight from the key light (thin strokes, not a band)
  g.save(); g.globalCompositeOperation = 'screen'; g.strokeStyle = look.hairLight; g.lineCap = 'round';
  for (let i = 0; i < 2; i++) { g.globalAlpha = 0.2; g.lineWidth = lw * (1.4 - i * 0.4); const a0 = Math.PI * (light < 0 ? 1.18 : 1.58) + i * 0.05, r0 = hw * (1.02 - i * 0.06); g.beginPath(); g.arc(-fx * 0.2, -h * 0.17, r0, a0, a0 + 0.32); g.stroke(); }
  g.restore();
  g.restore();
}
const mixHex = (a: string, b: string, k: number) => { const p = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16)); const A = p(a), B = p(b); if (A.some(Number.isNaN) || B.some(Number.isNaN)) return a; return `rgb(${A.map((v, i) => Math.round(L(v, B[i], k))).join(',')})`; };

/* ---------- full figure ---------- */
export function drawFigure(look: Look, p: Pose) {
  const h = p.s / look.heads, dir = p.dir, t = p.t;
  const walk = p.walk ? p.walk.amt : 0, ph = p.walk ? p.walk.p : 0;
  const breath = Math.sin((t / 3.6) * Math.PI * 2);
  const legLen = h * (look.heads >= 7 ? 3.35 : 3.1);
  const bob = walk * h * 0.05 * Math.abs(Math.cos(ph));
  const lean = (p.lean ?? 0) + walk * 0.05;
  g.save(); g.translate(p.x, p.y);
  const hip: P = [0, -legLen + bob];
  const light = p.light ?? -1;
  // contact shadow
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 0, h * 1.1, h * 0.16, 0, 0, 7); g.fill();

  // legs
  const legs = (near: boolean) => {
    if (p.noLegs) return;
    const q = ph + (near ? 0 : Math.PI);
    const thigh = walk ? 0.42 * Math.sin(q) * walk : (near ? 0.05 : -0.06);
    const knee = walk ? 0.95 * Math.pow(Math.max(0, Math.cos(q)), 1.4) * walk : 0.04;
    const hp: P = add(hip, [(near ? 0.12 : -0.12) * h * dir * 0.6, 0]);
    const kn = add(hp, polar(legLen * 0.52, -thigh, dir));
    const ft = add(kn, polar(legLen * 0.48, -thigh + knee, dir));
    const col = near ? look.pants : look.pantsShade;
    limb(hp, kn, h * 0.2, h * 0.15, col); limb(kn, ft, h * 0.15, h * 0.11, col);
    g.fillStyle = near ? look.shoes : shadeHex(look.shoes);
    g.beginPath(); g.ellipse(ft[0] + dir * h * 0.14, Math.min(ft[1], 0) - h * 0.06, h * 0.26, h * 0.1, 0, 0, 7); g.fill();
  };
  legs(false);

  // upper body around the hip, leaning
  g.save(); g.translate(hip[0], hip[1]); g.rotate(lean * dir);
  const torso = h * (look.heads >= 7 ? 2.7 : 2.55);
  const sw = h * look.shoulders * (1 + breath * 0.006);
  const neckY = -torso - breath * h * 0.015;
  const shN: P = [dir * sw * 0.36, neckY + h * 0.22], shF: P = [-dir * sw * 0.42, neckY + h * 0.24];

  const arm = (near: boolean) => {
    const A = near ? p.armN : p.armF;
    const S = near ? shN : shF;
    const ua = h * 1.3, fa = h * 1.15;
    let el: P, wr: P;
    const swing = walk * 0.38 * Math.sin(ph + (near ? Math.PI : 0));
    if (A && 'hand' in A) {
      const T: P = [S[0] + A.hand[0] * h * dir, S[1] + A.hand[1] * h];
      [el, wr] = ik(S, T, ua, fa, dir > 0 ? -1 : 1);
    } else if (A && 'at' in A) {
      // a screen point → this upper-body space (undo the figure offset, hip and lean)
      const ang = -lean * dir, dx = A.at[0] - p.x - hip[0], dy = A.at[1] - p.y - hip[1];
      const T: P = [dx * Math.cos(ang) - dy * Math.sin(ang), dx * Math.sin(ang) + dy * Math.cos(ang)];
      [el, wr] = ik(S, T, ua, fa, dir > 0 ? -1 : 1);
    } else {
      const a = A && 'a' in A ? A.a : swing + (near ? 0.08 : -0.05), b = A && 'b' in A ? A.b : 0.22 + Math.max(0, swing) * 0.6;
      el = add(S, polar(ua, -a, dir)); wr = add(el, polar(fa, -a - b, dir));
    }
    const col = near ? look.top : look.topShade;
    limb(S, el, h * 0.15, h * 0.125, col); limb(el, wr, h * 0.125, h * 0.1, col);
    // cuff
    g.fillStyle = near ? look.topShade : col; g.beginPath(); g.arc(wr[0], wr[1], h * 0.1, 0, 7); g.fill();
    const ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]) - Math.PI / 2;
    const grip = A?.grip ?? 0.2;
    hand(wr, ang, h, look, grip, dir);
    const hold = near ? p.holdN : p.holdF;
    if (hold) { g.save(); hold(wr[0], wr[1], ang, h); g.restore(); }
  };
  // the bag hangs at the far hip, behind the body
  if (look.satchel) { g.fillStyle = shadeHex(look.satchel[0]); rr(-dir * sw * 0.52 - h * 0.38, -h * 0.62, h * 0.78, h * 0.66, h * 0.1); g.fill(); g.fillStyle = 'rgba(0,0,0,.2)'; rr(-dir * sw * 0.52 - h * 0.38, -h * 0.62, h * 0.78, h * 0.22, h * 0.1); g.fill(); }
  arm(false);

  // torso: sloping shoulders, a waist, hips; open cardigan / long coat over a shirt
  const tg = g.createLinearGradient(-sw / 2, 0, sw / 2, 0);
  tg.addColorStop(0, light < 0 ? look.top : look.topShade); tg.addColorStop(0.55, look.top); tg.addColorStop(1, light < 0 ? look.topShade : look.top);
  const hemY = look.coat ? legLen * 0.58 : h * 0.18, hemW = look.coat ? sw * 0.5 : sw * 0.38;
  const shY = neckY + h * 0.3, waistY = -h * 0.85, chestY = neckY + h * 1.0;
  const body = () => {
    g.beginPath();
    g.moveTo(-sw * 0.16, neckY + h * 0.02);
    g.bezierCurveTo(-sw * 0.36, neckY + h * 0.08, -sw * 0.5, shY - h * 0.08, -sw * 0.5, shY + h * 0.12);
    g.bezierCurveTo(-sw * 0.47, chestY, -sw * 0.36, waistY - h * 0.2, -sw * 0.34, waistY);
    g.bezierCurveTo(-sw * 0.34, waistY + h * 0.4, -hemW, hemY - h * 0.3, -hemW, hemY);
    g.lineTo(hemW, hemY);
    g.bezierCurveTo(hemW, hemY - h * 0.3, sw * 0.34, waistY + h * 0.4, sw * 0.34, waistY);
    g.bezierCurveTo(sw * 0.36, waistY - h * 0.2, sw * 0.47, chestY, sw * 0.5, shY + h * 0.12);
    g.bezierCurveTo(sw * 0.5, shY - h * 0.08, sw * 0.36, neckY + h * 0.08, sw * 0.16, neckY + h * 0.02);
    g.closePath();
  };
  // shirt showing in the V
  g.fillStyle = look.shirt; body(); g.fill();
  g.fillStyle = tg; g.beginPath();
  const vL = -sw * 0.1 + dir * sw * 0.02, vR = sw * 0.1 + dir * sw * 0.02, vY = look.coat ? neckY + h * 1.4 : neckY + h * 1.15;
  body(); g.save(); g.clip();
  g.beginPath(); g.moveTo(-sw, neckY - h); g.lineTo(vL - sw * 0.06, neckY - h); g.lineTo(vL - sw * 0.06, neckY + h * 0.05); g.lineTo(dir * sw * 0.02, vY); g.lineTo(vR + sw * 0.06, neckY + h * 0.05); g.lineTo(vR + sw * 0.06, neckY - h); g.lineTo(sw, neckY - h); g.lineTo(sw, hemY + h); g.lineTo(-sw, hemY + h); g.closePath(); g.fill();
  // folds and the shadow side
  g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(-light * sw * 0.42, waistY + h * 0.2, sw * 0.18, h * 1.2, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = Math.max(1, h * 0.02); [[-0.25, 0.2], [0.22, 0.1]].forEach(([u, k]) => { g.beginPath(); g.moveTo(sw * u, waistY - h * 0.1); g.quadraticCurveTo(sw * (u + k * 0.2), waistY + h * 0.2, sw * (u - 0.03), waistY + h * 0.5); g.stroke(); });
  g.restore();
  // shirt collar points
  g.fillStyle = look.shirt; [-1, 1].forEach((k) => { g.beginPath(); g.moveTo(k * h * 0.05 + dir * sw * 0.02, neckY + h * 0.02); g.lineTo(k * h * 0.26 + dir * sw * 0.02, neckY + h * 0.06); g.lineTo(k * h * 0.08 + dir * sw * 0.02, neckY + h * 0.28); g.closePath(); g.fill(); });
  g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = Math.max(0.8, h * 0.012); g.beginPath(); g.moveTo(dir * sw * 0.02, neckY + h * 0.28); g.lineTo(dir * sw * 0.02, vY); g.stroke();
  // cardigan front edges and buttons
  g.strokeStyle = look.topTrim || 'rgba(0,0,0,.25)'; g.lineWidth = Math.max(1, h * 0.035);
  g.beginPath(); g.moveTo(vL - sw * 0.06, neckY + h * 0.05); g.lineTo(dir * sw * 0.02 - sw * 0.015, vY); g.lineTo(dir * sw * 0.02 - sw * 0.015, hemY); g.stroke();
  g.fillStyle = 'rgba(235,225,205,.55)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(dir * sw * 0.02 - sw * 0.04, vY + h * (0.25 + i * 0.4), h * 0.03, 0, 7); g.fill(); }
  // pocket
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = Math.max(1, h * 0.02); g.beginPath(); g.moveTo(-dir * sw * 0.32, waistY + h * 0.35); g.lineTo(-dir * sw * 0.12, waistY + h * 0.35); g.stroke();
  // satchel strap from the near shoulder across to the far hip
  if (look.satchel) { g.strokeStyle = look.satchel[1]; g.lineWidth = h * 0.09; g.lineCap = 'butt'; g.beginPath(); g.moveTo(dir * sw * 0.3, neckY + h * 0.12); g.quadraticCurveTo(0, chestY, -dir * sw * 0.38, -h * 0.5); g.stroke(); g.strokeStyle = 'rgba(255,230,190,.15)'; g.lineWidth = h * 0.02; g.stroke(); }
  // scarf with a twisting two-colour (double helix) knit
  if (look.scarf) {
    g.fillStyle = look.scarf[0]; rr(-sw * 0.26, neckY - h * 0.02, sw * 0.52, h * 0.3, h * 0.12); g.fill();
    const tx = dir * sw * 0.12, len = h * 1.6, sway = Math.sin(t * 1.3) * h * 0.04 + walk * Math.sin(ph) * h * 0.08;
    g.fillStyle = look.scarf[0]; g.beginPath(); g.moveTo(tx - h * 0.13, neckY + h * 0.2); g.lineTo(tx + h * 0.13, neckY + h * 0.2); g.lineTo(tx + h * 0.13 + sway, neckY + h * 0.2 + len); g.lineTo(tx - h * 0.13 + sway, neckY + h * 0.2 + len); g.fill();
    g.strokeStyle = look.scarf[1]; g.lineWidth = h * 0.045;
    for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i <= 16; i++) { const y = neckY + h * 0.2 + (i / 16) * len, x = tx + sway * (i / 16) + Math.sin(i * 0.9 + k * Math.PI) * h * 0.1; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  }
  if (look.loupe) { g.strokeStyle = '#c9a050'; g.lineWidth = h * 0.02; g.beginPath(); g.moveTo(-sw * 0.12, neckY + h * 0.2); g.quadraticCurveTo(0, neckY + h * 1.1, sw * 0.08, neckY + h * 0.2); g.stroke(); g.fillStyle = 'rgba(210,230,240,.55)'; g.strokeStyle = '#b8892c'; g.lineWidth = h * 0.035; g.beginPath(); g.arc(-dir * sw * 0.02, neckY + h * 1.05, h * 0.13, 0, 7); g.fill(); g.stroke(); }

  // neck and head
  g.fillStyle = look.skinShade; rr(-h * 0.11, neckY - h * 0.22, h * 0.22, h * 0.32, h * 0.08); g.fill();
  g.fillStyle = 'rgba(90,40,30,.25)'; g.beginPath(); g.ellipse(0, neckY - h * 0.16, h * 0.13, h * 0.06, 0, 0, 7); g.fill();
  drawHead(look, (p.yaw ?? 0) * h * 0.06, neckY - h * 0.62, h, p, t, light);
  arm(true);
  g.restore();
  legs(true);
  g.restore();
}

function shadeHex(c: string) { const m = /^#?([0-9a-f]{6})$/i.exec(c); if (!m) return c; const n = parseInt(m[1], 16); const f = (v: number) => Math.round(v * 0.72); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }

/** deterministic blinking: about every 3–5 s, 0.14 s long */
export function blinkAt(t: number, seed = 0) { const period = 3.4 + (seed % 3) * 0.6; const ph = ((t + seed * 1.37) % period) / period; const d = 0.14 / period; return ph < d ? Math.sin((ph / d) * Math.PI) : 0; }
/** mouth opening while speaking (syllable-rate flap with a soft envelope) */
export function talk(t: number, t0: number, t1: number) { if (t < t0 || t > t1) return 0; const env = Math.min(1, (t - t0) * 6, (t1 - t) * 6); return env * (0.35 + 0.65 * Math.abs(Math.sin(t * 13.5) * Math.sin(t * 5.1 + 1))); }
