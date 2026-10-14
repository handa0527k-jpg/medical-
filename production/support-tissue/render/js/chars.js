// 登場人物：蒼井 俊・サポちゃん・細胞たち。
// 部品（体・腕・頭・目・口・眉・髪・小物）を分けて描き、姿勢 pose・表情 emo・口の開き mouth・まばたき blink を受け取る。
import { clamp, lerp, circle, ellipse, rr, at, withAlpha, wave, COLORS, text, sparkle } from './core.js';

const TAU = Math.PI * 2;

// ───────── 腕の姿勢（a1: 上腕の角度 0=下 π/2=横 π=上、a2: ひじの曲げ）─────────
const POSES = {
  idle: [0.16, 0.12, 0.16, 0.12],
  point: [0.16, 0.12, 1.5, 0.05],
  point_up: [0.16, 0.12, 2.35, 0.1],
  wave: [0.16, 0.12, 2.7, 0.5],
  think: [0.25, 0.2, -0.1, -2.8],
  surprise: [2.2, 0.5, 2.2, 0.5],
  panic: [2.0, 0.9, 2.0, 0.9],
  open: [0.75, 0.55, 0.75, 0.55],
  cheer: [0.16, 0.12, 2.95, 0.05],
  shrug: [0.95, 1.7, 0.95, 1.7],
  wag: [0.16, 0.12, 0.7, -1.9],
  hold: [0.55, -1.6, 0.55, -1.6],
  run: [0.5, -1.2, 0.5, -1.2],
  fly: [1.1, 0.4, 1.1, 0.4],
  catch: [1.3, 0.6, 1.3, 0.6],
};
export const EMO_POSE = { point: 'point', wag: 'wag', think: 'think', surprised: 'surprise', panic: 'panic', happy: 'open', laugh: 'cheer', wink: 'wave', confused: 'shrug', normal: 'open', sad: 'idle' };

function armAngles(pose, t, talking, side) {
  const p = POSES[pose] || POSES.idle;
  let a1 = side < 0 ? p[0] : p[2], a2 = side < 0 ? p[1] : p[3];
  if (pose === 'wave') { if (side > 0) a2 += 0.35 * Math.sin(t * 9); }
  if (pose === 'panic') { a1 += 0.15 * Math.sin(t * 11 + side); }
  if (pose === 'wag' && side > 0) a2 += 0.25 * Math.sin(t * 10);
  if (pose === 'run') { a1 = 0.6 + 0.55 * Math.sin(t * 11 + (side > 0 ? 0 : Math.PI)); a2 = -1.3; }
  if (talking && (pose === 'open' || pose === 'idle' || pose === 'shrug')) { a1 += 0.1 * Math.sin(t * 4.3 + side); a2 += 0.12 * Math.sin(t * 3.1 + side * 2); }
  return [a1, a2];
}

function limb(ctx, sx, sy, a1, a2, side, L1, L2, w1, w2, colSleeve, colLine, handR, colHand, cuff) {
  const ex = sx + Math.sin(a1) * L1 * side, ey = sy + Math.cos(a1) * L1;
  const a = a1 + a2;
  const hx = ex + Math.sin(a) * L2 * side, hy = ey + Math.cos(a) * L2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colLine;
  ctx.lineWidth = w1 + 5;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.strokeStyle = colSleeve;
  ctx.lineWidth = w1;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.lineWidth = w2;
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(lerp(ex, hx, 0.85), lerp(ey, hy, 0.85)); ctx.stroke();
  if (cuff) {
    ctx.strokeStyle = cuff;
    ctx.lineWidth = w2 + 1;
    ctx.beginPath(); ctx.moveTo(lerp(ex, hx, 0.78), lerp(ey, hy, 0.78)); ctx.lineTo(lerp(ex, hx, 0.86), lerp(ey, hy, 0.86)); ctx.stroke();
  }
  circle(ctx, hx, hy, handR);
  ctx.fillStyle = colHand;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#d9a48c';
  ctx.stroke();
  return [hx, hy];
}

// ───────── 目・口・眉 ─────────
function animeEye(ctx, x, y, o) {
  const { rx, ry, iris1, iris2, blink, emo, look = 0, side = 1, lash = '#151b2e' } = o;
  ctx.save();
  ctx.translate(x, y);
  if (emo === 'happy_closed' || blink > 0.85) {
    ctx.strokeStyle = lash;
    ctx.lineWidth = rx * 0.32;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (emo === 'happy_closed') ctx.arc(0, ry * 0.25, rx * 0.85, Math.PI * 1.12, Math.PI * 1.88);
    else { ctx.moveTo(-rx, 0); ctx.quadraticCurveTo(0, ry * 0.45, rx, -ry * 0.05); }
    ctx.stroke();
    ctx.restore();
    return;
  }
  const open = 1 - clamp(blink / 0.85) * 0.75;
  const big = emo === 'surprised' ? 1.12 : 1;
  ctx.scale(1, open);
  // 白目
  ellipse(ctx, 0, 0, rx * big, ry * big);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.save();
  ellipse(ctx, 0, 0, rx * big, ry * big);
  ctx.clip();
  // 虹彩
  const ir = emo === 'surprised' ? 0.72 : 0.86;
  const ix = look * rx * 0.25, iy = ry * 0.1;
  const g = ctx.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, iris1);
  g.addColorStop(1, iris2);
  ellipse(ctx, ix, iy, rx * ir, ry * ir * 0.98);
  ctx.fillStyle = g;
  ctx.fill();
  ellipse(ctx, ix, iy + ry * 0.05, rx * ir * 0.48, ry * ir * 0.55);
  ctx.fillStyle = 'rgba(10,20,50,0.85)';
  ctx.fill();
  // 上まぶたの影
  ctx.fillStyle = 'rgba(30,40,80,0.18)';
  ctx.fillRect(-rx * 1.2, -ry * 1.2, rx * 2.4, ry * 0.55);
  ctx.restore();
  // ハイライト
  circle(ctx, ix - rx * 0.32, iy - ry * 0.38, rx * 0.3);
  ctx.fillStyle = '#fff';
  ctx.fill();
  circle(ctx, ix + rx * 0.3, iy + ry * 0.32, rx * 0.14);
  ctx.fill();
  // まつげ（上）
  ctx.strokeStyle = lash;
  ctx.lineCap = 'round';
  ctx.lineWidth = rx * 0.34;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.08 * big, -ry * 0.12);
  ctx.quadraticCurveTo(-rx * 0.1, -ry * 1.28 * big, rx * 1.12 * big, -ry * 0.42);
  ctx.stroke();
  ctx.lineWidth = rx * 0.2;
  ctx.beginPath();
  ctx.moveTo(rx * 1.0 * big, -ry * 0.48);
  ctx.lineTo(rx * 1.32 * big * side ** 0, -ry * 0.75);
  ctx.stroke();
  // 下まぶた
  ctx.lineWidth = rx * 0.1;
  ctx.globalAlpha *= 0.6;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.6, ry * 0.98 * big);
  ctx.quadraticCurveTo(0, ry * 1.1 * big, rx * 0.6, ry * 0.92 * big);
  ctx.stroke();
  ctx.restore();
}

function mouthShape(ctx, x, y, m, emo, s = 1, col = '#7a2537') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (m > 0.08 || emo === 'surprised' || emo === 'panic' || emo === 'laugh') {
    const mm = Math.max(m, emo === 'surprised' ? 0.55 : emo === 'panic' ? 0.45 : emo === 'laugh' ? 0.6 : 0);
    const w = emo === 'surprised' ? 9 + 6 * mm : 13 + 7 * mm, h = 3 + 15 * mm;
    ctx.beginPath();
    if (emo === 'happy' || emo === 'laugh' || emo === 'wink' || emo === 'point') {
      ctx.moveTo(-w, -h * 0.25);
      ctx.quadraticCurveTo(0, -h * 0.5, w, -h * 0.25);
      ctx.quadraticCurveTo(w * 0.8, h, 0, h);
      ctx.quadraticCurveTo(-w * 0.8, h, -w, -h * 0.25);
    } else ctx.ellipse(0, h * 0.25, w * 0.8, h * 0.75, 0, 0, TAU);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ellipse(ctx, 0, h * 0.95, w * 0.6, h * 0.45);
    ctx.fillStyle = '#ff8a9a';
    ctx.fill();
    ctx.restore();
  } else {
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    if (emo === 'confused' || emo === 'sad') { ctx.moveTo(-9, 3); ctx.quadraticCurveTo(-4, -2, 0, 2); ctx.quadraticCurveTo(4, 5, 9, 0); }
    else if (emo === 'think') { ctx.moveTo(-7, 1); ctx.lineTo(7, 0); }
    else { ctx.moveTo(-11, -2); ctx.quadraticCurveTo(0, 8, 11, -2); }
    ctx.stroke();
  }
  ctx.restore();
}

function brows(ctx, x, y, gap, emo, col, len = 26, wdt = 6) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = wdt;
  ctx.lineCap = 'round';
  let inner = 0, outer = 0, dy = 0;
  if (emo === 'surprised' || emo === 'panic') { dy = -10; inner = -3; }
  if (emo === 'confused' || emo === 'sad' || emo === 'panic') { inner = -9; outer = 4; }
  if (emo === 'think') { inner = -2; outer = -6; }
  if (emo === 'happy' || emo === 'laugh' || emo === 'wink') { dy = -4; }
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * gap, y + dy + inner * (emo === 'think' && s > 0 ? -0.6 : 1));
    ctx.quadraticCurveTo(x + s * (gap + len * 0.5), y + dy - 5, x + s * (gap + len), y + dy + outer);
    ctx.stroke();
  }
  ctx.restore();
}

export function blinkAt(t, seed) {
  const period = 3.1 + (seed % 7) * 0.37;
  const k = ((t + seed * 0.71) % period) / period * period;
  if (k < 0.13) return Math.sin(k / 0.13 * Math.PI);
  return 0;
}

function sweat(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y + (t * 30 % 18));
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(11, 4, 0, 10);
  ctx.quadraticCurveTo(-11, 4, 0, -16);
  ctx.fillStyle = '#9fd8ff';
  ctx.fill();
  ctx.strokeStyle = '#4aa3e0';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// ───────── 蒼井 俊 ─────────
// 足元が (0,0)、身長およそ 640。o: {t, pose, emo, mouth, blink, face(-1/1), walk(0..1), look}
export function drawShun(ctx, o) {
  const t = o.t || 0, emo = o.emo || 'normal', fx = (o.face || 1) * 7, pose = o.pose || 'idle';
  const talking = (o.mouth || 0) > 0.05;
  const walk = o.walk || 0;
  const step = Math.sin(t * 9) * walk;
  const breath = Math.sin(t * 2.1) * 2.5;
  const bob = Math.abs(Math.sin(t * 9)) * 9 * walk + (pose === 'cheer' ? -Math.abs(Math.sin(t * 6)) * 10 : 0);
  ctx.save();
  ctx.translate(0, -bob);
  const SK = '#ffe2d0', SKL = '#e3b39b', HAIR = '#1b2236', HAIR2 = '#3a4c78', COAT = '#f9fbfe', COATL = '#8e9cb8', SHIRT = '#26324f';
  // リュック（背中）
  ctx.fillStyle = '#2b303d';
  rr(ctx, -84, -410, 168, 175, 30);
  ctx.fill();
  // 脚
  for (const s of [-1, 1]) {
    const a = step * 0.42 * s;
    ctx.save();
    ctx.translate(s * 30, -238);
    ctx.rotate(a);
    ctx.fillStyle = '#28314d';
    rr(ctx, -21, 0, 42, 215, 16);
    ctx.fill();
    ctx.fillStyle = '#fff';
    rr(ctx, -26 + s * 4, 205, 58, 30, 14);
    ctx.fill();
    ctx.fillStyle = '#3d7be0';
    ctx.fillRect(-26 + s * 4, 226, 58, 7);
    ctx.restore();
  }
  // 白衣（後ろ身ごろ）
  ctx.save();
  ctx.translate(0, breath * 0.3);
  ctx.beginPath();
  ctx.moveTo(-72, -408);
  ctx.quadraticCurveTo(-80, -300, -96 - walk * 6 * Math.sin(t * 9), -138);
  ctx.lineTo(96 + walk * 6 * Math.sin(t * 9), -138);
  ctx.quadraticCurveTo(80, -300, 72, -408);
  ctx.closePath();
  ctx.fillStyle = COAT;
  ctx.fill();
  ctx.strokeStyle = COATL;
  ctx.lineWidth = 3;
  ctx.stroke();
  // シャツ（前のあき）
  ctx.beginPath();
  ctx.moveTo(-26, -412);
  ctx.lineTo(26, -412);
  ctx.lineTo(30, -238);
  ctx.lineTo(-30, -238);
  ctx.closePath();
  ctx.fillStyle = SHIRT;
  ctx.fill();
  ctx.fillStyle = '#3a4a73';
  ctx.fillRect(-30, -250, 60, 14);
  // 襟（白衣の前身ごろ）
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 22, -414);
    ctx.lineTo(s * 40, -330);
    ctx.lineTo(s * 30, -238);
    ctx.lineTo(s * 36, -140);
    ctx.lineTo(s * (96 + walk * 6 * Math.sin(t * 9) * s), -138);
    ctx.quadraticCurveTo(s * 80, -300, s * 72, -408);
    ctx.closePath();
    ctx.fillStyle = COAT;
    ctx.fill();
    ctx.strokeStyle = COATL;
    ctx.lineWidth = 3;
    ctx.stroke();
    // ポケット
    ctx.strokeStyle = '#b9c4d8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s * 50, -228); ctx.lineTo(s * 82, -228); ctx.lineTo(s * 84, -186); ctx.lineTo(s * 52, -186); ctx.closePath();
    ctx.stroke();
    // リュックのベルト
    ctx.strokeStyle = '#2b303d';
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(s * 50, -410); ctx.lineTo(s * 46, -300); ctx.stroke();
  }
  // 胸ポケットのペン
  ctx.fillStyle = '#3d7be0';
  ctx.fillRect(-64, -360, 6, 26);
  ctx.restore();
  // 首
  ctx.fillStyle = SK;
  ctx.fillRect(-17, -448, 34, 40);
  ctx.fillStyle = 'rgba(180,120,100,0.25)';
  ctx.fillRect(-17, -430, 34, 10);
  // ───── 頭 ─────
  const tilt = (o.tilt || 0) + (emo === 'think' ? -0.08 : emo === 'confused' ? 0.1 : 0) + (talking ? 0.025 * Math.sin(t * 3) : 0);
  ctx.save();
  ctx.translate(0, -450 + breath * 0.2);
  ctx.rotate(tilt);
  ctx.translate(0, 450);
  // 後ろ髪
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.moveTo(-88, -470);
  const backPts = [[-104, -520], [-96, -560], [-118, -585], [-96, -610], [-104, -650], [-70, -650], [-60, -690], [-20, -668], [6, -700], [30, -668], [70, -690], [74, -650], [108, -648], [98, -610], [120, -580], [98, -560], [106, -520], [88, -470]];
  for (const [x, y] of backPts) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  // 耳
  for (const s of [-1, 1]) { ellipse(ctx, s * 80 + fx * 0.3, -520, 13, 22); ctx.fillStyle = SK; ctx.fill(); ctx.strokeStyle = SKL; ctx.lineWidth = 2; ctx.stroke(); }
  // 顔
  ctx.beginPath();
  ctx.moveTo(-80, -560);
  ctx.bezierCurveTo(-82, -480, -42, -440, fx * 0.4, -432);
  ctx.bezierCurveTo(42, -440, 82, -480, 80, -560);
  ctx.bezierCurveTo(80, -650, -80, -650, -80, -560);
  ctx.fillStyle = SK;
  ctx.fill();
  ctx.strokeStyle = SKL;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // ほお
  const blush = emo === 'happy' || emo === 'laugh' || emo === 'panic' || emo === 'wink' ? 0.5 : 0.22;
  for (const s of [-1, 1]) { ellipse(ctx, s * 50 + fx, -490, 18, 9); ctx.fillStyle = `rgba(255,120,130,${blush})`; ctx.fill(); }
  // 目
  const blink = o.blink || 0;
  const eyeEmo = emo === 'laugh' ? 'happy_closed' : emo;
  for (const s of [-1, 1]) {
    const e = emo === 'wink' && s > 0 ? 'happy_closed' : eyeEmo;
    animeEye(ctx, s * 35 + fx, -522, { rx: 18, ry: 21, iris1: '#183f92', iris2: '#5ab0ff', blink, emo: e, look: (o.look || 0) + (o.face || 1) * 0.35 });
  }
  brows(ctx, fx, -565, 14, emo, HAIR, 28, 6);
  // 鼻
  ctx.strokeStyle = '#d29b86';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(fx * 1.3, -500); ctx.lineTo(fx * 1.3 + 3, -492); ctx.stroke();
  mouthShape(ctx, fx * 1.2, -468, o.mouth || 0, emo);
  // 前髪（とがった房）
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.moveTo(-86, -560);
  const bang = [[-84, -610], [-60, -540], [-50, -598], [-28, -548], [-18, -606], [4, -552], [12, -610], [32, -556], [44, -606], [62, -546], [68, -598], [88, -556], [86, -625], [60, -662], [0, -676], [-60, -662]];
  for (const [x, y] of bang) ctx.lineTo(x + fx * 0.5, y);
  ctx.closePath();
  ctx.fill();
  // つやのハイライト
  ctx.strokeStyle = HAIR2;
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-44, -652); ctx.lineTo(-20, -660); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-36, -630); ctx.lineTo(-30, -600); ctx.moveTo(22, -632); ctx.lineTo(28, -604); ctx.stroke();
  // アホ毛
  ctx.strokeStyle = HAIR;
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(4, -672); ctx.quadraticCurveTo(30, -730 + Math.sin(t * 3) * 4, 46, -704); ctx.stroke();
  // 横髪
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 78, -600); ctx.lineTo(s * 92, -540); ctx.lineTo(s * 84, -478); ctx.lineTo(s * 74, -540);
    ctx.closePath();
    ctx.fill();
  }
  if (emo === 'confused' || emo === 'panic') sweat(ctx, 96 * (o.face || 1), -590, 1.1, t);
  ctx.restore();
  // 腕
  for (const s of [-1, 1]) {
    const pose2 = (o.face || 1) < 0 && (pose === 'point' || pose === 'wave' || pose === 'cheer' || pose === 'point_up' || pose === 'think' || pose === 'wag') ? pose : pose;
    const sideArm = (o.face || 1) < 0 ? -s : s; // 向きが逆なら、指す腕も逆
    const [a1, a2] = armAngles(pose2, t, talking, sideArm);
    limb(ctx, s * 68, -398 + breath * 0.3, a1, a2, s, 92, 84, 34, 29, COAT, COATL, 16, SK, '#dfe6f2');
  }
  ctx.restore();
}

// ───────── サポちゃん ─────────
// 足元の影が (0,0)。体は浮いている。身長およそ 400。
export function drawSapo(ctx, o) {
  const t = o.t || 0, emo = o.emo || 'happy', fx = (o.face || 1) * 6, pose = o.pose || 'idle';
  const talking = (o.mouth || 0) > 0.05;
  const hover = 70 + Math.sin(t * 2.4) * 12 + (o.lift || 0);
  // 影
  withAlpha(ctx, 0.25 - Math.sin(t * 2.4) * 0.05, () => { ellipse(ctx, 0, 0, 70, 16); ctx.fillStyle = '#1c3c78'; ctx.fill(); });
  ctx.save();
  ctx.translate(0, -hover);
  ctx.rotate((o.tilt || 0) + Math.sin(t * 1.7) * 0.03);
  const HOOD = '#ffffff', HOODL = '#7cc8ef', HAIR = '#a9e2fb', HAIR2 = '#6cc3ef', SK = '#ffe7da';
  // 足（ブーツ）
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#ffffff';
    rr(ctx, s * 22 - 14, -40, 28, 42, 12);
    ctx.fill();
    ctx.strokeStyle = HOODL; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#5fb8ea';
    ctx.fillRect(s * 22 - 14, -12, 28, 8);
  }
  // 体（コート）
  ctx.beginPath();
  ctx.moveTo(-46, -165);
  ctx.quadraticCurveTo(-60, -90, -70, -34);
  ctx.quadraticCurveTo(0, -20, 70, -34);
  ctx.quadraticCurveTo(60, -90, 46, -165);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = HOODL;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#4fb1e6';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, -160); ctx.lineTo(0, -28); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-66, -44); ctx.quadraticCurveTo(0, -30, 66, -44); ctx.stroke();
  // 胸のリボン
  ctx.fillStyle = '#3fa6e2';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(s * 22, -162); ctx.lineTo(s * 22, -136); ctx.closePath(); ctx.fill(); }
  circle(ctx, 0, -149, 7); ctx.fill();
  // ───── 頭 ─────
  ctx.save();
  ctx.translate(0, -255);
  ctx.rotate((emo === 'think' ? -0.08 : 0) + (talking ? 0.04 * Math.sin(t * 3.5) : 0));
  // フードの耳（垂れたしっぽ形）
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 92, -60);
    ctx.rotate(s * (0.5 + 0.06 * Math.sin(t * 2 + s)));
    ellipse(ctx, 0, 0, 34, 62);
    ctx.fillStyle = HOOD; ctx.fill();
    ctx.strokeStyle = HOODL; ctx.lineWidth = 3; ctx.stroke();
    ellipse(ctx, 0, 8, 18, 40);
    ctx.fillStyle = '#d8f1fd'; ctx.fill();
    ctx.restore();
  }
  // フード
  ellipse(ctx, 0, -4, 128, 120);
  ctx.fillStyle = HOOD; ctx.fill();
  ctx.strokeStyle = HOODL; ctx.lineWidth = 3.5; ctx.stroke();
  // フードの内側
  ellipse(ctx, 0, 8, 106, 98);
  ctx.fillStyle = '#c9ecfc'; ctx.fill();
  // 後ろ髪
  ellipse(ctx, 0, 14, 98, 90);
  ctx.fillStyle = HAIR2; ctx.fill();
  // 顔
  ellipse(ctx, 0, 22, 84, 76);
  ctx.fillStyle = SK; ctx.fill();
  ctx.strokeStyle = '#e8b9a6'; ctx.lineWidth = 2; ctx.stroke();
  for (const s of [-1, 1]) { ellipse(ctx, s * 52 + fx, 50, 17, 9); ctx.fillStyle = 'rgba(255,120,140,0.45)'; ctx.fill(); }
  const blink = o.blink || 0;
  for (const s of [-1, 1]) {
    const e = emo === 'wink' && s > 0 ? 'happy_closed' : emo === 'laugh' ? 'happy_closed' : emo;
    animeEye(ctx, s * 36 + fx, 26, { rx: 23, ry: 28, iris1: '#1557c4', iris2: '#6fd0ff', blink, emo: e, look: (o.look || 0) + (o.face || 1) * 0.3, lash: '#1d3b66' });
  }
  brows(ctx, fx, -16, 14, emo, '#4a9fd6', 20, 4);
  mouthShape(ctx, fx, 66, o.mouth || 0, emo, 0.85, '#8a2a40');
  // 前髪
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.moveTo(-90, 10);
  const bang = [[-86, -40], [-60, 14], [-50, -30], [-28, 2], [-14, -40], [4, 4], [18, -38], [34, 2], [50, -34], [62, 12], [86, -40], [92, 10], [96, -50], [50, -88], [0, -96], [-50, -88], [-96, -50]];
  for (const [x, y] of bang) ctx.lineTo(x + fx * 0.5, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e9f8ff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-40, -70); ctx.quadraticCurveTo(0, -84, 40, -70); ctx.stroke();
  // 横髪
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 80, -20); ctx.quadraticCurveTo(s * 100, 60, s * 86, 118); ctx.lineTo(s * 72, 60); ctx.closePath();
    ctx.fillStyle = HAIR; ctx.fill();
  }
  // フードのふち
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(0, 8, 108, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  ctx.strokeStyle = HOODL; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 8, 115, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  // AIのしるし（光る宝石）
  const glow = 0.6 + 0.4 * Math.sin(t * 4);
  ctx.save();
  ctx.shadowColor = '#5fd0ff'; ctx.shadowBlur = 18 * glow;
  ctx.fillStyle = '#4cc3f5';
  ctx.beginPath(); ctx.moveTo(0, -132); ctx.lineTo(14, -112); ctx.lineTo(0, -92); ctx.lineTo(-14, -112); ctx.closePath(); ctx.fill();
  ctx.restore();
  if (emo === 'confused' || emo === 'panic') sweat(ctx, 100, -10, 0.9, t);
  ctx.restore();
  // 腕
  for (const s of [-1, 1]) {
    const sideArm = (o.face || 1) < 0 ? -s : s;
    const [a1, a2] = armAngles(pose, t, talking, sideArm);
    limb(ctx, s * 44, -150, a1, a2, s, 44, 38, 22, 20, '#fff', HOODL, 12, SK, '#a9def7');
  }
  ctx.restore();
}

// ───────── 細胞・線維のキャラクター ─────────
function cellFace(ctx, x, y, s, o) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const blink = o.blink || 0;
  for (const k of [-1, 1]) {
    if (blink > 0.6 || o.emo === 'laugh' || (o.emo === 'wink' && k > 0)) {
      ctx.strokeStyle = '#1f2233'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(k * 22, 2, 10, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      ellipse(ctx, k * 22, 0, 10, o.emo === 'surprised' ? 15 : 13);
      ctx.fillStyle = '#1f2233'; ctx.fill();
      circle(ctx, k * 22 - 3, -5, 4); ctx.fillStyle = '#fff'; ctx.fill();
    }
  }
  for (const k of [-1, 1]) { ellipse(ctx, k * 36, 16, 9, 5); ctx.fillStyle = 'rgba(255,110,140,0.45)'; ctx.fill(); }
  mouthShape(ctx, 0, 22, o.mouth || 0, o.emo === 'normal' ? 'happy' : o.emo || 'happy', 0.8, '#5a1a2a');
  ctx.restore();
}

function blobPath(ctx, r, n, amp, t, seed, speed = 1) {
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * TAU;
    let rr2 = r;
    for (let k = 1; k <= n; k++) rr2 += amp / k * Math.sin(a * (k + 1) + seed * k + t * speed * (0.6 + k * 0.3));
    const x = Math.cos(a) * rr2, y = Math.sin(a) * rr2;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

export function drawCell(ctx, kind, o = {}) {
  const t = o.t || 0;
  const f = CELL[kind];
  if (!f) throw new Error('unknown cell ' + kind);
  ctx.save();
  if (!o.noBob) ctx.translate(0, Math.sin(t * 2 + (o.seed || 0)) * 6);
  f(ctx, t, o);
  ctx.restore();
}

const CELL = {
  // 線維芽細胞：ピンクの紡錘〜星形、長い突起。ヘルメットとハンマーはたとえ
  fibro(ctx, t, o) {
    ctx.save();
    ctx.fillStyle = '#f6a6c1';
    ctx.strokeStyle = '#d0608a';
    ctx.lineWidth = 4;
    const arms = [[-1.0, 170], [-2.5, 150], [0.3, 175], [2.0, 120], [-0.35, 140]];
    for (const [a, L] of arms) {
      const w = 0.12 * Math.sin(t * 2 + a * 3);
      const ex = Math.cos(a + w) * L, ey = Math.sin(a + w) * L * 0.75;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a + 0.5) * 50, Math.sin(a + 0.5) * 42);
      ctx.quadraticCurveTo(Math.cos(a) * L * 0.6, Math.sin(a) * L * 0.5, ex, ey);
      ctx.quadraticCurveTo(Math.cos(a) * L * 0.6, Math.sin(a) * L * 0.5 + 6, Math.cos(a - 0.5) * 50, Math.sin(a - 0.5) * 42);
      ctx.fill(); ctx.stroke();
    }
    ellipse(ctx, 0, 0, 88, 70);
    ctx.fill(); ctx.stroke();
    // 核（楕円、明るい）
    ellipse(ctx, 34, -26, 30, 18, 0.3);
    ctx.fillStyle = '#c95386'; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
    circle(ctx, 40, -28, 5); ctx.fillStyle = '#8a2556'; ctx.fill();
    cellFace(ctx, -14, 6, 1, o);
    if (!o.plain) {
      // ヘルメット（たとえ：建築職人）
      ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#c99a12'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-6, -58, 46, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(-60, -60, 108, 9);
      // ハンマー
      ctx.save();
      ctx.translate(140, 20);
      ctx.rotate(-0.6 + 0.5 * Math.max(0, Math.sin(t * 6)) * (o.hammer ? 1 : 0.2));
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-5, -70, 10, 80);
      ctx.fillStyle = '#6d7686'; rr(ctx, -26, -92, 52, 28, 6); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
  // マクロファージ：不規則な卵形、多数の突起、空豆形の核、リソソーム。帽子はたとえ（警備員）
  macro(ctx, t, o) {
    ctx.save();
    blobPath(ctx, 110, 5, 22, t, 1.3, 1.4);
    ctx.fillStyle = '#7f9bf2'; ctx.fill();
    ctx.strokeStyle = '#3f59c4'; ctx.lineWidth = 5; ctx.stroke();
    // 突起
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + 0.3, L = 128 + 14 * Math.sin(t * 3 + i);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 100, Math.sin(a) * 100);
      ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L);
      ctx.lineWidth = 9; ctx.strokeStyle = '#7f9bf2'; ctx.lineCap = 'round'; ctx.stroke();
    }
    // 空豆形の核
    ctx.beginPath();
    ctx.moveTo(18, -56); ctx.bezierCurveTo(80, -70, 84, 10, 40, 6); ctx.bezierCurveTo(28, 4, 30, -20, 14, -22); ctx.bezierCurveTo(-4, -24, -6, -48, 18, -56);
    ctx.fillStyle = '#3b4fb0'; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
    // リソソーム
    for (let i = 0; i < 9; i++) { const r = Math.sin(i * 7.1) * 0.5 + 0.5; circle(ctx, -70 + i * 15, 54 + 16 * Math.sin(i * 2.3), 6 + 3 * r); ctx.fillStyle = '#a24fc8'; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1; }
    cellFace(ctx, -24, 0, 1.05, o);
    if (!o.plain) {
      ctx.fillStyle = '#23315f';
      ctx.beginPath(); ctx.moveTo(-84, -72); ctx.quadraticCurveTo(-20, -130, 50, -88); ctx.lineTo(54, -70); ctx.lineTo(-90, -58); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23f'; circle(ctx, -18, -92, 10); ctx.fill();
    }
    ctx.restore();
  },
  // 形質細胞：円形〜楕円形、偏心性の車軸核、明るいゴルジ野、抗体（Y）
  plasma(ctx, t, o) {
    ctx.save();
    ellipse(ctx, 0, 0, 112, 96);
    ctx.fillStyle = '#b993ef'; ctx.fill();
    ctx.strokeStyle = '#7447c2'; ctx.lineWidth = 5; ctx.stroke();
    // rER の層（細胞質の縞）
    ctx.strokeStyle = 'rgba(110,60,180,0.35)'; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-10, 10, 70 + i * 7, 58 + i * 6, 0, 0.3, 2.6); ctx.stroke(); }
    // 核（偏在、車軸状の異染色質）
    ctx.save();
    ctx.translate(58, -30);
    circle(ctx, 0, 0, 40); ctx.fillStyle = '#efe2ff'; ctx.fill(); ctx.strokeStyle = '#5a2e9c'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#5a2e9c';
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ellipse(ctx, Math.cos(a) * 28, Math.sin(a) * 28, 9, 6, a); ctx.fill(); }
    circle(ctx, 0, 0, 9); ctx.fill();
    ctx.restore();
    // ゴルジ野（明るく抜ける）
    ellipse(ctx, 12, -20, 22, 16); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    cellFace(ctx, -36, 16, 1, o);
    if (!o.plain) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = -2.4 + i * 0.6 + t * 0.4, r = 150 + 8 * Math.sin(t * 2 + i);
        ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a + Math.PI / 2);
        ctx.strokeStyle = '#ff9f43';
        ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, 0); ctx.lineTo(-11, -14); ctx.moveTo(0, 0); ctx.lineTo(11, -14); ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  },
  // 肥満細胞：大きな細胞、中央の円形核、無数の分泌顆粒。警報ランプはたとえ
  mast(ctx, t, o) {
    ctx.save();
    blobPath(ctx, 112, 3, 8, t, 2.2, 0.8);
    ctx.fillStyle = '#e3a3ec'; ctx.fill();
    ctx.strokeStyle = '#a24bb4'; ctx.lineWidth = 5; ctx.stroke();
    for (let i = 0; i < 70; i++) {
      const a = i * 2.39996, r = 30 + Math.sqrt(i / 70) * 70;
      const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.9;
      const burst = o.burst ? clamp(o.burst) : 0;
      const k = 1 + burst * (1.5 + (i % 5) * 0.4);
      circle(ctx, x * k, y * k, 7);
      ctx.fillStyle = i % 3 ? '#7b2a8f' : '#9b3aa8'; ctx.globalAlpha = 1 - burst * 0.6; ctx.fill(); ctx.globalAlpha = 1;
    }
    circle(ctx, 0, -6, 36); ctx.fillStyle = '#f2d8f7'; ctx.fill(); ctx.strokeStyle = '#8a3a9c'; ctx.lineWidth = 3; ctx.stroke();
    cellFace(ctx, 0, -8, 0.95, o);
    if (!o.plain) {
      const on = o.alarm ? (Math.sin(t * 14) > 0) : false;
      ctx.fillStyle = '#5a5f70'; rr(ctx, -26, -126, 52, 16, 4); ctx.fill();
      ctx.save();
      if (on) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 40; }
      ctx.fillStyle = on ? '#ff4d4d' : '#d84a4a';
      ctx.beginPath(); ctx.arc(0, -126, 24, Math.PI, 0); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
  // 膠原線維：太く波打つロープ（張力に強い、枝分かれなし）
  collagen(ctx, t, o) {
    ctx.save();
    const sway = Math.sin(t * 2) * 8;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const y = 120 - i * 7;
        const x = Math.sin(i * 0.5 + k * 2.1) * 18 + Math.sin(i * 0.12 + t) * 10 * (i / 40) + sway * i / 40;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.lineWidth = 30; ctx.lineCap = 'round';
      ctx.strokeStyle = ['#d8404c', '#ec6a72', '#c3303e'][k];
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,220,220,0.6)'; ctx.lineWidth = 6;
    ctx.beginPath(); for (let i = 0; i <= 40; i++) { const y = 120 - i * 7; const x = Math.sin(i * 0.5 + 1) * 18 + sway * i / 40 - 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ellipse(ctx, sway, -170, 62, 56); ctx.fillStyle = '#ef6d76'; ctx.fill(); ctx.strokeStyle = '#b8303d'; ctx.lineWidth = 4; ctx.stroke();
    cellFace(ctx, sway, -166, 0.95, o);
    ctx.restore();
  },
  // 細網線維：黒っぽい細い網（鍍銀で黒）。分岐する
  reticular(ctx, t, o) {
    ctx.save();
    ctx.strokeStyle = '#2f323c'; ctx.lineCap = 'round';
    const nodes = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; const r = 120 + 25 * Math.sin(i * 1.7); nodes.push([Math.cos(a) * r, Math.sin(a) * r * 0.85 + Math.sin(t * 2 + i) * 4]); }
    ctx.lineWidth = 5;
    for (let i = 0; i < nodes.length; i++) {
      const [x, y] = nodes[i], [x2, y2] = nodes[(i + 1) % nodes.length], [x3, y3] = nodes[(i + 3) % nodes.length];
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(x * 0.5 + 10, y * 0.5 - 10, x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + x2) / 2 * 1.1, (y + y2) / 2 * 1.1, x2, y2); ctx.stroke();
      if (i % 3 === 0) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo((x + x3) / 2, (y + y3) / 2); ctx.stroke(); }
    }
    circle(ctx, 0, 0, 62); ctx.fillStyle = '#4b4f5c'; ctx.fill(); ctx.strokeStyle = '#22242c'; ctx.lineWidth = 4; ctx.stroke();
    ctx.save(); ctx.translate(0, 0);
    // 白い目で顔
    for (const k of [-1, 1]) {
      if ((o.blink || 0) > 0.6) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(k * 20, 2, 9, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      else { ellipse(ctx, k * 20, -2, 10, 13); ctx.fillStyle = '#fff'; ctx.fill(); circle(ctx, k * 20, 0, 5); ctx.fillStyle = '#222'; ctx.fill(); }
    }
    mouthShape(ctx, 0, 24, o.mouth || 0, 'happy', 0.75, '#ff9aa8');
    ctx.restore();
    ctx.restore();
  },
  // 弾性線維：伸び縮みするバネ（エラスチン）
  elastic(ctx, t, o) {
    ctx.save();
    const st = o.stretch !== undefined ? o.stretch : 1 + 0.18 * Math.sin(t * 5);
    const turns = 7, h = 230 * st;
    ctx.lineWidth = 16; ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (let i = 0; i <= 140; i++) {
        const k = i / 140, a = k * turns * TAU;
        const x = Math.sin(a) * 54, y = 110 - k * h;
        const front = Math.cos(a) > 0;
        if (pass === 0 ? front : !front) { ctx.moveTo(x, y); continue; }
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = pass === 0 ? '#c98a24' : '#f4be55';
      ctx.stroke();
    }
    ellipse(ctx, 0, 110 - h - 52, 60, 54); ctx.fillStyle = '#f7c766'; ctx.fill(); ctx.strokeStyle = '#c4851d'; ctx.lineWidth = 4; ctx.stroke();
    cellFace(ctx, 0, 110 - h - 50, 0.95, o);
    ctx.restore();
  },
  // 白色脂肪細胞：大きな単胞性脂肪滴、扁平な核が端に
  white(ctx, t, o) {
    ctx.save();
    const s = 1 + 0.02 * Math.sin(t * 2);
    ctx.scale(s, s);
    circle(ctx, 0, 0, 130); ctx.fillStyle = '#ffe9a6'; ctx.fill(); ctx.strokeStyle = '#d4ad3c'; ctx.lineWidth = 6; ctx.stroke();
    circle(ctx, 0, 6, 116); ctx.fillStyle = '#fff6d2'; ctx.fill();
    ellipse(ctx, -50, -50, 30, 16, -0.7); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
    // 扁平な核（端）
    ctx.beginPath(); ctx.ellipse(0, -122, 40, 9, 0, 0, TAU); ctx.fillStyle = '#9a7a24'; ctx.fill();
    cellFace(ctx, 0, 18, 1.1, o);
    if (!o.plain) { ctx.fillStyle = '#c7cdd8'; rr(ctx, -16, -152, 32, 22, 5); ctx.fill(); ctx.fillStyle = '#e25b5b'; rr(ctx, -26, -160, 52, 10, 4); ctx.fill(); }
    ctx.restore();
  },
  // 褐色脂肪細胞：小さめ、多胞性脂肪滴、多数のミトコンドリア、中央の核
  brown(ctx, t, o) {
    ctx.save();
    blobPath(ctx, 100, 2, 6, t, 4.2, 0.7);
    ctx.fillStyle = '#d98d55'; ctx.fill(); ctx.strokeStyle = '#9b5222'; ctx.lineWidth = 5; ctx.stroke();
    for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 40 + (i % 4) * 13; circle(ctx, Math.cos(a) * r, Math.sin(a) * r, 9 + (i % 3) * 3); ctx.fillStyle = '#ffe58a'; ctx.fill(); }
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4 + 1.2, r = 50 + (i % 3) * 14;
      ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a);
      ellipse(ctx, 0, 0, 13, 7); ctx.fillStyle = '#6e3416'; ctx.fill();
      ctx.strokeStyle = '#c7764a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-6, 4); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.moveTo(6, -4); ctx.lineTo(6, 4); ctx.stroke();
      ctx.restore();
    }
    circle(ctx, 0, 0, 34); ctx.fillStyle = '#f3d1b5'; ctx.fill(); ctx.strokeStyle = '#8d4b20'; ctx.lineWidth = 3; ctx.stroke();
    cellFace(ctx, 0, -2, 0.9, o);
    if (o.fire) {
      for (let i = 0; i < 3; i++) {
        const fx = -30 + i * 30, h = 50 + 14 * Math.sin(t * 9 + i * 2);
        ctx.beginPath(); ctx.moveTo(fx - 14, -100); ctx.quadraticCurveTo(fx - 16, -100 - h * 0.6, fx, -100 - h); ctx.quadraticCurveTo(fx + 16, -100 - h * 0.6, fx + 14, -100); ctx.closePath();
        ctx.fillStyle = i === 1 ? '#ffb53b' : '#ff6a2b'; ctx.fill();
      }
    }
    ctx.restore();
  },
  // 好中球（顔なし・小さめ）
  neutro(ctx, t, o) {
    ctx.save();
    blobPath(ctx, 60, 3, 6, t, 5.5, 1.2);
    ctx.fillStyle = '#f0d9f2'; ctx.fill(); ctx.strokeStyle = '#a77bb5'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#6b3f9a';
    for (const [x, y] of [[-18, -6], [0, 8], [18, -4]]) { circle(ctx, x, y, 13); ctx.fill(); }
    ctx.strokeStyle = '#6b3f9a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(0, 8); ctx.lineTo(18, -4); ctx.stroke();
    ctx.restore();
  },
  tcell(ctx, t, o) {
    ctx.save();
    circle(ctx, 0, 0, 62); ctx.fillStyle = '#9fd3f7'; ctx.fill(); ctx.strokeStyle = '#3c8fcf'; ctx.lineWidth = 4; ctx.stroke();
    circle(ctx, 6, -6, 44); ctx.fillStyle = '#4a7fc0'; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
    cellFace(ctx, 0, 0, 0.75, o);
    text(ctx, 'T', 0, -78, { size: 30, align: 'center', color: '#2c6fb3', weight: 800 });
    ctx.restore();
  },
  bacteria(ctx, t, o) {
    ctx.save();
    ctx.rotate(Math.sin(t * 3) * 0.2);
    rr(ctx, -46, -22, 92, 44, 22); ctx.fillStyle = '#7ccf5a'; ctx.fill(); ctx.strokeStyle = '#3d8c2a'; ctx.lineWidth = 4; ctx.stroke();
    for (let i = 0; i < 4; i++) { circle(ctx, -24 + i * 16, -4 + (i % 2) * 8, 4); ctx.fillStyle = '#3d8c2a'; ctx.fill(); }
    ctx.strokeStyle = '#3d8c2a'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(46, -6 + i * 6); ctx.quadraticCurveTo(62, -12 + i * 8 + Math.sin(t * 9 + i) * 6, 76, -6 + i * 6); ctx.stroke(); }
    ctx.restore();
  },
  // アイコン：骨・軟骨・血液（参考画像の「その他の登場キャラクター」）
  bone(ctx, t, o) {
    ctx.save();
    ctx.fillStyle = '#fbf6ea'; ctx.strokeStyle = '#b7a888'; ctx.lineWidth = 5;
    rr(ctx, -26, -110, 52, 220, 24); ctx.fill(); ctx.stroke();
    for (const [x, y] of [[-30, -120], [30, -120], [-30, 120], [30, 120]]) { circle(ctx, x, y, 34); ctx.fill(); ctx.stroke(); }
    rr(ctx, -24, -100, 48, 200, 20); ctx.fill();
    cellFace(ctx, 0, -10, 0.75, o);
    ctx.restore();
  },
  cartilage(ctx, t, o) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, -130); ctx.bezierCurveTo(90, -20, 80, 110, 0, 110); ctx.bezierCurveTo(-80, 110, -90, -20, 0, -130);
    ctx.fillStyle = '#8fc6f2'; ctx.fill(); ctx.strokeStyle = '#3f86c9'; ctx.lineWidth = 5; ctx.stroke();
    ellipse(ctx, -24, -20, 14, 30, 0.3); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
    cellFace(ctx, 0, 30, 0.8, o);
    ctx.restore();
  },
  blood(ctx, t, o) {
    ctx.save();
    rr(ctx, -70, -110, 140, 220, 60); ctx.fillStyle = '#e0484f'; ctx.fill(); ctx.strokeStyle = '#a12a30'; ctx.lineWidth = 5; ctx.stroke();
    ellipse(ctx, 0, -10, 44, 70); ctx.fillStyle = '#b8323a'; ctx.fill();
    cellFace(ctx, 0, -10, 0.8, o);
    ctx.restore();
  },
  gag(ctx, t, o) {
    ctx.save();
    for (let i = 0; i < 9; i++) {
      const x = -96 + i * 24, y = Math.sin(i * 0.9 + t * 2) * 14;
      circle(ctx, x, y, 14); ctx.fillStyle = i % 2 ? '#5ec7a8' : '#9fe0c9'; ctx.fill(); ctx.strokeStyle = '#2a8a6e'; ctx.lineWidth = 3; ctx.stroke();
      if (i % 2) text(ctx, '−', x, y - 30, { size: 26, align: 'center', color: '#2f6fdc', weight: 800 });
    }
    ctx.restore();
  },
  rbc(ctx, t, o) {
    ctx.save();
    ellipse(ctx, 0, 0, 40, 26); ctx.fillStyle = '#e8434c'; ctx.fill(); ctx.strokeStyle = '#a82a32'; ctx.lineWidth = 3; ctx.stroke();
    ellipse(ctx, 0, 0, 20, 11); ctx.fillStyle = '#c4313a'; ctx.fill();
    ctx.restore();
  },
};

// 細胞の名札
export function nameplate(ctx, x, y, name, sub, color) {
  ctx.save();
  const w = Math.max(220, name.length * 40 + 60);
  rr(ctx, x - w / 2, y - 30, w, sub ? 86 : 60, 18);
  ctx.fillStyle = color; ctx.fill();
  text(ctx, name, x, y, { size: 36, align: 'center', color: '#fff', weight: 800 });
  if (sub) text(ctx, sub, x, y + 38, { size: 24, align: 'center', color: 'rgba(255,255,255,0.92)', weight: 700 });
  ctx.restore();
}

export { sparkle };
