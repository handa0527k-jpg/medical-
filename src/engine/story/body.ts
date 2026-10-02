/**
 * Draw a character from a 3-D motion-capture pose: limbs as tapered volumes, torso shaped from the
 * shoulder and hip lines, shoes, hands, props in the hands, and the head (face, hair, expression)
 * from the story rig — turned and tilted by the captured head direction.
 */
import { g, L } from './kit';
import { drawHead, type Face, type Look } from './rig';
import { J, headCentre, v, type Camera, type Pose3, type Proj, type V3 } from './mocap';

export interface BodyLook extends Look {
  /** security cap colour */
  cap?: string;
  /** lanyard + ID card */
  lanyard?: string;
  /** shoulder patch / badge colour */
  patch?: string;
  /** necktie colour */
  tie?: string;
  /** body scale relative to the captured performer (height) */
  scale?: number;
  /** slimmer build */
  slim?: number;
}

type P = [number, number];

function capsule(a: Proj, b: Proj, ra: number, rb: number, col: string) {
  const w1 = ra * a.s, w2 = rb * b.s;
  const ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
  const c = Math.cos(ang), s = Math.sin(ang);
  g.fillStyle = col; g.beginPath();
  g.moveTo(a.x + c * w1, a.y + s * w1); g.lineTo(b.x + c * w2, b.y + s * w2);
  g.arc(b.x, b.y, w2, ang, ang + Math.PI, true); g.lineTo(a.x - c * w1, a.y - s * w1);
  g.arc(a.x, a.y, w1, ang + Math.PI, ang + 2 * Math.PI, true); g.closePath(); g.fill();
}
function shade(hex: string, k: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex; const n = parseInt(m[1], 16);
  const f = (x: number) => Math.max(0, Math.min(255, Math.round(x * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export interface Hold { side: 'L' | 'R'; draw: (x: number, y: number, ang: number, s: number) => void }
export interface Actor { look: BodyLook; pose: Pose3; face: Face; t: number; light?: number; hold?: Hold[]; /** tint over the whole figure (night) */ tint?: string; tintA?: number }

/** head direction in camera terms: yaw (−1…1, sign = screen side), tilt, and whether it faces away */
export function headView(cam: Camera, head: V3) {
  const xr = v.dot(head, cam.right), zt = -v.dot(head, cam.fwd), up = v.dot(head, cam.up);
  const hz = Math.hypot(xr, zt) || 1;
  return { yaw: xr / hz, tilt: Math.max(-0.32, Math.min(0.55, -up * 1.4)), away: zt < -0.35 * hz };
}

export function drawActor(cam: Camera, a: Actor) {
  const { look, pose, t } = a;
  const P = pose.p.map((q) => cam.proj(q));
  const q = (n: keyof typeof J) => P[J[n]];
  const slim = look.slim ?? 1;
  const light = a.light ?? -1;
  const hv = headView(cam, pose.head);

  /* ----- parts, sorted far → near ----- */
  const depthOf = (...ns: (keyof typeof J)[]) => ns.reduce((s, n) => s + q(n).d, 0) / ns.length;
  type Part = { d: number; draw: () => void };
  const parts: Part[] = [];
  const legCol = (near: boolean) => (near ? look.pants : look.pantsShade);
  const leg = (side: 'L' | 'R') => {
    const hip = q(`hip${side}`), kn = q(`knee${side}`), an = q(`ankle${side}`), to = q(`toe${side}`);
    const near = depthOf(`knee${side}`) <= depthOf(side === 'L' ? 'kneeR' : 'kneeL');
    // trousers: thigh, shin; then the shoe
    capsule(hip, kn, 0.078 * slim, 0.058 * slim, legCol(near));
    capsule(kn, an, 0.056 * slim, 0.044 * slim, legCol(near));
    const sh = near ? look.shoes : shade(look.shoes, 0.75);
    const ang = Math.atan2(to.y - an.y, to.x - an.x);
    const len = Math.max(0.06 * an.s, Math.hypot(to.x - an.x, to.y - an.y) * 1.25);
    g.save(); g.translate(an.x, an.y); g.rotate(ang);
    g.fillStyle = sh; g.beginPath(); g.moveTo(-0.045 * an.s, -0.03 * an.s); g.quadraticCurveTo(len * 0.6, -0.05 * an.s, len, 0.012 * an.s); g.quadraticCurveTo(len * 1.02, 0.045 * an.s, len * 0.7, 0.05 * an.s); g.lineTo(-0.05 * an.s, 0.05 * an.s); g.quadraticCurveTo(-0.07 * an.s, 0.01 * an.s, -0.045 * an.s, -0.03 * an.s); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-0.04 * an.s, -0.03 * an.s, len * 0.7, 0.012 * an.s);
    g.restore();
  };
  const arm = (side: 'L' | 'R') => {
    const sh = q(`shoulder${side}`), el = q(`elbow${side}`), wr = q(`wrist${side}`), hd = q(`hand${side}`);
    const near = depthOf(`elbow${side}`, `wrist${side}`) <= depthOf(side === 'L' ? 'elbowR' : 'elbowL', side === 'L' ? 'wristR' : 'wristL');
    const col = near ? look.top : look.topShade;
    capsule(sh, el, 0.052 * slim, 0.044 * slim, col);
    capsule(el, wr, 0.044 * slim, 0.036 * slim, col);
    // cuff
    g.fillStyle = look.topTrim || shade(look.top, 0.7); g.beginPath(); g.arc(wr.x, wr.y, 0.037 * wr.s * slim, 0, 7); g.fill();
    // hand
    const ang = Math.atan2(hd.y - wr.y, hd.x - wr.x);
    const r = 0.045 * wr.s;
    g.save(); g.translate(L(wr.x, hd.x, 0.55), L(wr.y, hd.y, 0.55)); g.rotate(ang);
    g.fillStyle = near ? look.skin : look.skinShade; g.beginPath(); g.ellipse(0, 0, r * 1.25, r * 0.85, 0, 0, 7); g.fill();
    g.fillStyle = look.skinShade; g.beginPath(); g.ellipse(-r * 0.2, r * 0.55, r * 0.5, r * 0.28, 0.6, 0, 7); g.fill();
    g.restore();
    const h = a.hold?.find((x) => x.side === side);
    if (h) { g.save(); h.draw(hd.x, hd.y, ang, hd.s); g.restore(); }
  };
  const torso = () => {
    const pel = q('pelvis'), nk = q('neck'), ch = q('chest'), wa = q('waist');
    const sL = q('shoulderL'), sR = q('shoulderR'), hL = q('hipL'), hR = q('hipR');
    const sx = nk.x - pel.x, sy = nk.y - pel.y, sl = Math.hypot(sx, sy) || 1;
    const nx = -sy / sl, ny = sx / sl; // screen normal to the spine
    const span = (A: Proj, B: Proj) => Math.abs((A.x - B.x) * nx + (A.y - B.y) * ny) / 2;
    const s = ch.s;
    const wSh = Math.max(span(sL, sR) + 0.05 * s, 0.13 * s) * slim;
    const wCh = Math.max(span(sL, sR) * 0.85, 0.12 * s) * slim;
    const wWa = Math.max(span(hL, hR) * 0.95, 0.11 * s) * slim;
    const wHi = Math.max(span(hL, hR) + 0.07 * s, 0.13 * s) * slim;
    const shY: P = [L(nk.x, ch.x, 0.25), L(nk.y, ch.y, 0.25)];
    const lv: [P, number][] = [[shY, wSh], [[ch.x, ch.y], wCh], [[wa.x, wa.y], wWa], [[pel.x, pel.y], wHi]];
    const side = (k: number) => lv.map(([c, w]) => [c[0] + nx * w * k, c[1] + ny * w * k] as P);
    const Lf = side(1), Rt = side(-1);
    const hemDrop = 0.06 * s;
    const hem: P = [pel.x - sx / sl * hemDrop, pel.y - sy / sl * hemDrop];
    // shape
    const outline = () => {
      g.beginPath();
      g.moveTo(nk.x + nx * wSh * 0.35, nk.y + ny * wSh * 0.35);
      g.quadraticCurveTo(Lf[0][0] + (nk.x - pel.x) / sl * 0.02 * s, Lf[0][1] + (nk.y - pel.y) / sl * 0.02 * s, Lf[0][0], Lf[0][1]);
      g.quadraticCurveTo(Lf[1][0], Lf[1][1], (Lf[1][0] + Lf[2][0]) / 2, (Lf[1][1] + Lf[2][1]) / 2);
      g.quadraticCurveTo(Lf[2][0], Lf[2][1], Lf[3][0] + (hem[0] - pel.x), Lf[3][1] + (hem[1] - pel.y));
      g.lineTo(Rt[3][0] + (hem[0] - pel.x), Rt[3][1] + (hem[1] - pel.y));
      g.quadraticCurveTo(Rt[2][0], Rt[2][1], (Rt[1][0] + Rt[2][0]) / 2, (Rt[1][1] + Rt[2][1]) / 2);
      g.quadraticCurveTo(Rt[1][0], Rt[1][1], Rt[0][0], Rt[0][1]);
      g.quadraticCurveTo(Rt[0][0] + (nk.x - pel.x) / sl * 0.02 * s, Rt[0][1] + (nk.y - pel.y) / sl * 0.02 * s, nk.x - nx * wSh * 0.35, nk.y - ny * wSh * 0.35);
      g.closePath();
    };
    // trousers seat under the jacket
    capsule(q('hipL'), q('hipR'), 0.08 * slim, 0.08 * slim, look.pants);
    const gr = g.createLinearGradient(Lf[1][0], Lf[1][1], Rt[1][0], Rt[1][1]);
    gr.addColorStop(0, light < 0 ? look.top : look.topShade); gr.addColorStop(0.55, look.top); gr.addColorStop(1, light < 0 ? look.topShade : look.top);
    g.fillStyle = gr; outline(); g.fill();
    // shirt V and collar when we see the front
    const front = -v.dot(v.norm(v.cross(v.sub(pose.p[J.hipL], pose.p[J.hipR]), [0, 1, 0])), cam.fwd);
    if (front > 0.15) {
      g.save(); outline(); g.clip();
      const vy: P = [L(nk.x, ch.x, 0.9), L(nk.y, ch.y, 0.9)];
      const off = hv.yaw * wSh * 0.12;
      g.fillStyle = look.shirt; g.globalAlpha = Math.min(1, (front - 0.15) * 3);
      g.beginPath(); g.moveTo(nk.x + nx * wSh * 0.42 + off, nk.y + ny * wSh * 0.42); g.lineTo(vy[0] + off, vy[1]); g.lineTo(nk.x - nx * wSh * 0.42 + off, nk.y - ny * wSh * 0.42); g.closePath(); g.fill();
      if (look.lanyard) {
        g.strokeStyle = look.lanyard; g.lineWidth = 0.012 * s; g.beginPath(); g.moveTo(nk.x + nx * wSh * 0.3 + off, nk.y + ny * wSh * 0.3); g.lineTo(L(ch.x, wa.x, 0.3) + off, L(ch.y, wa.y, 0.3)); g.lineTo(nk.x - nx * wSh * 0.3 + off, nk.y - ny * wSh * 0.3); g.stroke();
        g.fillStyle = '#f4f6f8'; g.fillRect(L(ch.x, wa.x, 0.3) + off - 0.03 * s, L(ch.y, wa.y, 0.3), 0.06 * s, 0.085 * s); g.fillStyle = '#3a6ea5'; g.fillRect(L(ch.x, wa.x, 0.3) + off - 0.03 * s, L(ch.y, wa.y, 0.3), 0.06 * s, 0.018 * s);
      }
      g.globalAlpha = 1; g.restore();
    }
    if (look.tie && front > 0.3) { const vy2: P = [L(nk.x, ch.x, 0.9), L(nk.y, ch.y, 0.9)], off = hv.yaw * wSh * 0.12; g.fillStyle = look.tie; g.beginPath(); g.moveTo(nk.x + off - 0.012 * s, nk.y + 0.02 * s); g.lineTo(nk.x + off + 0.012 * s, nk.y + 0.02 * s); g.lineTo(vy2[0] + off + 0.02 * s, vy2[1]); g.lineTo(vy2[0] + off, vy2[1] + 0.03 * s); g.lineTo(vy2[0] + off - 0.02 * s, vy2[1]); g.closePath(); g.fill(); }
    if (look.patch && front > 0.1) { const sp = hv.yaw > 0 ? Lf[0] : Rt[0]; g.fillStyle = look.patch; g.beginPath(); g.ellipse(L(sp[0], ch.x, 0.18), L(sp[1], ch.y, 0.35), 0.03 * s, 0.035 * s, 0, 0, 7); g.fill(); }
    // belt line
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.015 * s; g.beginPath(); g.moveTo(Lf[2][0], Lf[2][1]); g.lineTo(Rt[2][0], Rt[2][1]); g.stroke();
    // neck
    capsule(q('neck'), q('neck2'), 0.05, 0.046, look.skinShade);
  };
  const head = () => {
    const hc = cam.proj(headCentre(pose));
    const hh = 0.27 * hc.s * (look.scale ?? 1);
    if (hv.away) {
      g.fillStyle = look.hairShade; g.beginPath(); g.ellipse(hc.x, hc.y - hh * 0.05, hh * 0.44, hh * 0.52, 0, 0, 7); g.fill();
      g.fillStyle = look.hair; g.beginPath(); g.ellipse(hc.x - hh * 0.06, hc.y - hh * 0.14, hh * 0.36, hh * 0.38, 0, 0, 7); g.fill();
      if (look.cap) capOn(look.cap, hc.x, hc.y, hh, 0, true);
      return;
    }
    const f: Face = { ...a.face, yaw: L(a.face.yaw ?? hv.yaw, hv.yaw, a.face.yaw === undefined ? 1 : 0.0), tilt: (a.face.tilt ?? 0) + hv.tilt };
    drawHead(look, hc.x, hc.y, hh, f, t, light);
    if (look.cap) capOn(look.cap, hc.x, hc.y, hh, f.yaw ?? 0, false);
  };

  const torsoD = depthOf('chest', 'pelvis');
  const legD = (s: 'L' | 'R') => depthOf(`knee${s}`, `ankle${s}`);
  const armD = (s: 'L' | 'R') => depthOf(`elbow${s}`, `wrist${s}`);
  // legs stay behind the jacket unless a knee comes clearly toward the camera (sitting)
  parts.push({ d: legD('L') < torsoD - 0.15 ? legD('L') : torsoD + 0.05 + (legD('L') - legD('R')) * 0.1, draw: () => leg('L') });
  parts.push({ d: legD('R') < torsoD - 0.15 ? legD('R') : torsoD + 0.05 + (legD('R') - legD('L')) * 0.1, draw: () => leg('R') });
  parts.push({ d: torsoD, draw: torso });
  parts.push({ d: armD('L') + 0.03, draw: () => arm('L') });
  parts.push({ d: armD('R') + 0.03, draw: () => arm('R') });
  parts.push({ d: torsoD - 0.06, draw: head });
  // contact shadow
  const fl = cam.proj([pose.p[J.pelvis][0], 0, pose.p[J.pelvis][2]]);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(fl.x, fl.y, 0.32 * fl.s, 0.06 * fl.s, 0, 0, 7); g.fill();
  parts.sort((x, y) => y.d - x.d).forEach((p) => { g.save(); p.draw(); g.restore(); });
}

/** a security guard's peaked cap over the head */
function capOn(col: string, cx: number, cy: number, h: number, yaw: number, away: boolean) {
  g.save(); g.translate(cx, cy);
  g.fillStyle = col; g.beginPath(); g.ellipse(-yaw * h * 0.03, -h * 0.36, h * 0.47, h * 0.2, 0, Math.PI, 0); g.lineTo(h * 0.47, -h * 0.3); g.lineTo(-h * 0.47, -h * 0.3); g.fill();
  g.fillStyle = shade(col.length === 7 ? col : '#2a3346', 0.8); g.fillRect(-h * 0.47, -h * 0.34, h * 0.94, h * 0.07);
  if (!away) {
    g.fillStyle = '#c9a54a'; g.beginPath(); g.arc(yaw * h * 0.18, -h * 0.4, h * 0.05, 0, 7); g.fill();
    g.fillStyle = '#111622'; g.beginPath(); g.ellipse(yaw * h * 0.26, -h * 0.28, h * 0.36, h * 0.07, yaw * 0.25, 0, Math.PI); g.fill();
  }
  g.restore();
}

/* ---------- props held in a hand (screen space at the hand) ---------- */
export const props = {
  phone: (lit = 1) => (x: number, y: number, ang: number, s: number) => {
    g.translate(x, y); g.rotate(ang - Math.PI / 2);
    g.fillStyle = '#16181d'; g.fillRect(-0.035 * s, -0.02 * s, 0.07 * s, 0.14 * s);
    g.fillStyle = `rgba(150,200,255,${0.25 + 0.6 * lit})`; g.fillRect(-0.03 * s, -0.012 * s, 0.06 * s, 0.124 * s);
  },
  /** a phone held up to read: we see its back; a faint screen glow spills around it */
  phoneBack: () => (x: number, y: number, _ang: number, s: number) => {
    g.translate(x, y - 0.03 * s); g.rotate(-0.12);
    g.fillStyle = 'rgba(140,190,255,.18)'; g.beginPath(); g.ellipse(0, -0.02 * s, 0.11 * s, 0.13 * s, 0, 0, 7); g.fill();
    g.fillStyle = '#1b1d22'; g.fillRect(-0.036 * s, -0.075 * s, 0.072 * s, 0.15 * s); g.fillStyle = '#2c2f36'; g.fillRect(-0.03 * s, -0.068 * s, 0.018 * s, 0.03 * s);
  },
  flashlight: () => (x: number, y: number, ang: number, s: number) => {
    g.translate(x, y); g.rotate(ang);
    g.fillStyle = '#2a2d33'; g.fillRect(-0.02 * s, -0.018 * s, 0.17 * s, 0.036 * s); g.fillStyle = '#4a4e57'; g.fillRect(0.13 * s, -0.026 * s, 0.05 * s, 0.052 * s);
    g.fillStyle = 'rgba(255,250,220,.95)'; g.fillRect(0.178 * s, -0.022 * s, 0.006 * s, 0.044 * s);
  },
  can: (col = '#c0392b') => (x: number, y: number, ang: number, s: number) => {
    g.translate(x, y); g.rotate(ang - Math.PI / 2);
    g.fillStyle = col; g.fillRect(-0.03 * s, -0.06 * s, 0.06 * s, 0.12 * s); g.fillStyle = '#d8dde3'; g.fillRect(-0.03 * s, -0.066 * s, 0.06 * s, 0.01 * s);
  },
  cup: () => (x: number, y: number, ang: number, s: number) => {
    g.translate(x, y); g.rotate(ang - Math.PI / 2);
    g.fillStyle = '#e9e4da'; g.beginPath(); g.moveTo(-0.035 * s, -0.04 * s); g.lineTo(0.035 * s, -0.04 * s); g.lineTo(0.028 * s, 0.05 * s); g.lineTo(-0.028 * s, 0.05 * s); g.fill();
    g.fillStyle = 'rgba(160,120,60,.8)'; g.fillRect(-0.033 * s, -0.04 * s, 0.066 * s, 0.012 * s);
  },
  marker: () => (x: number, y: number, ang: number, s: number) => {
    g.translate(x, y); g.rotate(ang);
    g.fillStyle = '#1d2a5a'; g.fillRect(-0.01 * s, -0.012 * s, 0.11 * s, 0.024 * s); g.fillStyle = '#e8e8e8'; g.fillRect(0.06 * s, -0.013 * s, 0.05 * s, 0.026 * s);
  },
};
