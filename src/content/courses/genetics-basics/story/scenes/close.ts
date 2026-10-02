/**
 * Scene 9「午前六時の窓口」: 5:58, dawn through the high windows; Jin lays the copy on the desk → Deo stamps
 * the slip 済 → recap of every motif (letters, two strands, spools and volumes, two distributions, skipped
 * pages and three-letter words, typo / habit / moving pages, sticky notes) → what Jin learnt → Deo → "may I
 * come again tonight?" → Jin leaves into the morning with the umbrella closed; end title.
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, glow, grade, grain, handheld, shaft, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { DEO, JIN } from '../cast';
import { HAND, MINCHO, STRAND, bust, cues, deskBg, deskDeo, deskJin, deskSet, exterior, lampPool, page, sheet, slip, slipMotif, softBg, tableTop, txt, umbrella, blinkAt, talk } from '../sets';

const { c, e, d } = cues('close');
const BASE: Record<string, string> = { A: '#e2566f', T: '#3f86d1', G: '#3a9b69', C: '#e6b23a', U: '#8a5cc2' };
const DAWN = 'rgba(190,210,255,';

function dawnLight(k: number) {
  shaft(80, -60, 160, 760, 720, 520, `${DAWN}${0.22 * k})`, 1);
  wash('#cfdcff', 0.07 * k, 'screen');
}
function copySheet(x: number, y: number, w: number, a: number) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-w / 2 + 3, -w * 0.65 + 4, w, w * 1.3);
  g.fillStyle = '#f2e8d2'; g.fillRect(-w / 2, -w * 0.65, w, w * 1.3);
  g.fillStyle = 'rgba(40,35,30,.55)'; for (let i = 0; i < 7; i++) g.fillRect(-w * 0.38, -w * 0.48 + i * w * 0.14, w * (0.76 - (i % 3) * 0.12), Math.max(1, w * 0.025));
  g.restore();
}

/** 5:58 — Jin lays the copy on the desk; Deo looks down at it */
function arrive(t: number) {
  const k = span(t, 0.2, 3.2, (u) => u * u * (3 - 2 * u)), lay = span(t, 3.4, 4.6, ease.out);
  const jx = L(180, 430, k), moving = t < 3.2;
  shot({ x: 640, y: 360, z: 1.02 + span(t, 0, 7.5) * 0.04 }, 1, () => deskSet(t, () => {
    drawFigure(DEO, deskDeo(t, 0, { gazeX: L(-0.6, -0.5, lay), gazeY: L(0.15, 0.7, lay), brow: 0.1 }));
  }, () => {
    if (lay > 0.6) copySheet(L(600, 660, lay), 482, 70, -1.45);
    drawFigure(JIN, deskJin(t, 0, { x: jx, walk: moving ? { p: (jx - 180) / (580 * 0.115), amt: CL(Math.min(t * 2, (3.2 - t) * 2)) } : undefined,
      armN: { at: [L(520, 640, lay), L(470, 476, lay)], grip: 1 }, holdN: lay < 0.6 ? (hx, hy) => copySheet(hx + 26, hy - 10, 60, -0.3) : undefined,
      armF: { hand: [0.35, 1.15], grip: 1 }, holdF: (hx, hy) => slip(hx + 10, hy - 20, 54, -0.1) }));
  }, [5, 58]));
  dawnLight(span(t, 0, 7.5));
}

/** the stamp: lift (anticipation), slam (shake), the red 済 */
function stamp(t: number, u: number) {
  const up = span(u, 0.2, 0.9, ease.out), down = span(u, 0.9, 1.08, ease.in), hit = u > 1.08 ? Math.exp(-(u - 1.08) * 9) : 0;
  const sy = L(L(260, 120, up), 330, down);
  g.save(); g.translate(Math.sin(t * 70) * hit * 6, Math.cos(t * 63) * hit * 6);
  g.drawImage(tableTop(), 0, 0); lampPool(640, 300, 700, 0.9);
  copySheet(330, 330, 230, 0.1);
  slipMotif(700, 360, 360, -0.06, u > 1.08 ? 1 : 0);
  if (hit > 0) glow(664, 380, 200, 'rgba(255,120,100,.6)', hit);
  // the stamp (handle + base), with its shadow growing as it falls
  g.fillStyle = `rgba(0,0,0,${(0.15 + 0.3 * down) * (1 - span(u, 1.3, 1.8))})`; g.beginPath(); g.ellipse(664, 380, L(70, 46, down), L(30, 20, down), 0, 0, 7); g.fill();
  g.save(); g.translate(664, sy - (u > 1.08 ? 0 : 0) - span(u, 1.6, 2.6, ease.inOut) * 300);
  g.fillStyle = '#6b4a2c'; rr(-26, -150, 52, 120, 20); g.fill(); g.fillStyle = '#8a6a44'; g.beginPath(); g.arc(0, -150, 34, 0, 7); g.fill();
  g.fillStyle = '#3a2a1e'; rr(-50, -34, 100, 34, 6); g.fill(); g.fillStyle = '#9a2a2a'; rr(-46, -4, 92, 8, 3); g.fill();
  g.restore();
  g.restore();
}

/** recap: one sheet per motif, turned like pages */
const RECAP: [number, (u: number) => void][] = [
  [0, () => { STRAND.slice(0, 4).split('').forEach((_ch, i) => { const ch = 'ATGC'[i]; g.fillStyle = BASE[ch]; rr(-210 + i * 110, -50, 90, 100, 14); g.fill(); txt(ch, -165 + i * 110, 22, 64, '#fff', 1, 'center', HAND, 600); }); }],
  [2.2, () => { for (let i = 0; i < 6; i++) { const y = -90 + i * 36, p = 'ATGCTA'[i], q = { A: 'T', T: 'A', G: 'C', C: 'G' }[p] as string; g.fillStyle = BASE[p]; rr(-150, y - 14, 130, 28, 6); g.fill(); g.fillStyle = BASE[q]; rr(20, y - 14, 130, 28, 6); g.fill(); g.fillStyle = '#5a4a40'; g.fillRect(-20, y - 2, 40, 4); } }],
  [4.6, () => { for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; g.fillStyle = ['#b48ad8', '#8a5cc2', '#d6b0e8', '#9b74c8'][i]; g.beginPath(); g.arc(-110 + Math.cos(a) * 30, Math.sin(a) * 22, 34, 0, 7); g.fill(); } g.strokeStyle = '#2e6db0'; g.lineWidth = 6; g.beginPath(); g.ellipse(-110, 0, 74, 46, -0.2, 0, 5.4); g.stroke(); [-1, 1].forEach((s) => { g.fillStyle = '#8a5cc2'; rr(130 + s * 22 - 18, -100, 36, 200, 18); g.fill(); }); g.fillStyle = '#ffd36b'; g.beginPath(); g.ellipse(130, -10, 44, 12, 0, 0, 7); g.fill(); }],
  [6.8, () => { [-1, 1].forEach((s) => { g.fillStyle = '#7a5332'; rr(s * 140 - 100, -60, 200, 140, 10); g.fill(); g.fillStyle = '#3a2516'; rr(s * 140 - 86, -46, 172, 112, 6); g.fill(); g.fillStyle = s < 0 ? '#3f6aa8' : '#c25478'; rr(s * 140 - 16, -90, 32, 130, 14); g.fill(); }); }],
  [9.6, () => { ['A', 'U', 'G', 'G', 'C', 'U'].forEach((ch, i) => { g.fillStyle = BASE[ch]; rr(-170 + i * 58, -30, 52, 60, 8); g.fill(); txt(ch, -144 + i * 58, 12, 34, '#fff', 1, 'center', HAND, 600); }); g.strokeStyle = '#c9a050'; g.lineWidth = 6; rr(-178, -42, 178, 84, 10); g.stroke(); g.save(); g.translate(150, -90); g.rotate(-0.4); g.fillStyle = '#c9ced6'; g.beginPath(); g.moveTo(0, 0); g.lineTo(90, 6); g.lineTo(0, 12); g.fill(); g.restore(); }],
  [13, () => { g.save(); g.translate(-120, 0); g.rotate(0.6); g.fillStyle = '#9a2a2a'; rr(-8, -110, 16, 150, 6); g.fill(); g.restore(); g.fillStyle = '#ffe08a'; rr(-40, -40, 70, 80, 8); g.fill(); txt('A', -5, 16, 46, '#3a2a1e', 1, 'center', HAND, 600); g.save(); g.translate(150, -10); g.rotate(0.1); g.fillStyle = '#f6c48a'; g.fillRect(-50, -66, 100, 132); g.restore(); }],
  [16.6, () => { ['#ffd36b', '#8fd6ff', '#ff9ec0', '#b8f0a0', '#ffd36b', '#ff9ec0'].forEach((col, i) => { g.save(); g.translate(-170 + (i % 3) * 170, -50 + Math.floor(i / 3) * 110); g.rotate((i - 2.5) * 0.06); g.fillStyle = col; g.fillRect(-60, -46, 120, 92); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(-60, -46, 120, 16); g.restore(); }); }],
];
const RECAP_WORDS = ['四種類の文字', '貼り合わされた二本の鎖', '糸巻きと製本', '二度に分けて配られる写し', '読み飛ばすページと、三文字の単語', '誤植と、クセと、動くページ', 'そして、付箋'];
function recap(t: number, u: number) {
  let i = RECAP.length - 1; while (i > 0 && u < RECAP[i][0]) i--;
  const t0 = RECAP[i][0], t1 = i < RECAP.length - 1 ? RECAP[i + 1][0] : 19.6, v = (u - t0) / (t1 - t0);
  g.drawImage(tableTop(), 0, 0); lampPool(640, 300, 760, L(0.9, 0.6, u / 19)); dawnLight(0.6 + 0.4 * (u / 19));
  // the previous sheet lies underneath, slightly rotated
  if (i > 0) sheet(640, 300, 760, 440, -0.03 + (i % 2) * 0.05, (_w, h) => { g.globalAlpha = 0.45; RECAP[i - 1][1](u); g.globalAlpha = 1; txt(RECAP_WORDS[i - 1], 0, h / 2 - 50, 30, '#5a4a40', 0.45); }, 'gen-recap');
  const slide = ease.out(CL(v * 3));
  shot({ x: 640, y: 320, z: 1 + v * 0.05 }, 1, () => sheet(L(1500, 640, slide), 300, 760, 440, L(0.2, 0.02 - (i % 2) * 0.04, slide), (_w, h) => { RECAP[i][1](u); txt(RECAP_WORDS[i], 0, h / 2 - 50, 32, '#2a2320', span(v, 0.25, 0.45)); }, 'gen-recap'));
  void t;
}

/** dawn exterior: the door opens; Jin walks out (left → right) with his umbrella closed; crane up; title */
function morning(t: number, u: number) {
  const out = span(u, 0.6, 7.5, (v) => v * v * (3 - 2 * v)), crane = span(u, 3.5, 8.3, ease.inOut);
  const cam = { x: 640, y: L(390, 330, crane), z: L(1.16, 1.0, crane) };
  shot(cam, 0.85, () => {
    g.drawImage(exterior(), 0, 0);
    // the clock above the door now says 6:00
    g.fillStyle = '#e9e1cc'; g.beginPath(); g.arc(640, 300, 33, 0, 7); g.fill();
    g.strokeStyle = '#2a2e38'; g.lineCap = 'round'; g.lineWidth = 4; g.beginPath(); g.moveTo(640, 300); g.lineTo(640, 320); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(640, 300); g.lineTo(640, 268); g.stroke();
  });
  // morning sky over the night painting: pale blue at the top, a warm band at the horizon
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, 'rgba(150,180,230,.55)'); sk.addColorStop(0.55, 'rgba(255,190,150,.35)'); sk.addColorStop(1, 'rgba(120,130,160,.2)');
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = sk; g.fillRect(0, 0, W, H); g.restore();
  shot(cam, 1, () => {
    // wet pavement now reflecting the sky
    const pg = g.createLinearGradient(0, 560, 0, 760); pg.addColorStop(0, '#5a6a88'); pg.addColorStop(1, '#2a3246'); g.fillStyle = pg; g.fillRect(-100, 560, W + 200, 260);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; for (let X = -1600; X < 2900; X += 90) { g.beginPath(); g.moveTo(640 + (X - 640) * 0.25, 562); g.lineTo(X, 800); g.stroke(); }
    const door = 1 - span(u, 1.8, 3);
    if (door > 0) { g.fillStyle = `rgba(255,205,140,${door})`; g.beginPath(); g.moveTo(590, 545); g.lineTo(590, 410); g.arc(640, 410, 50, Math.PI, Math.PI * 1.5); g.lineTo(640, 545); g.fill(); }
    const x = L(615, 1040, out), s = 168;
    drawFigure(JIN, { x, y: 650, s, dir: 1, t, yaw: 0.78, walk: { p: (x - 615) / (s * 0.115), amt: CL(Math.min(u * 1.5, (7.5 - u) * 1.5)) }, light: -1, blink: blinkAt(t, 1),
      armN: { hand: [0.3, 0.9], grip: 1 }, holdN: (hx, hy, _a, h) => umbrella(hx, hy + h * 0.2, h * 0.8, 0, Math.PI * 0.82, t, 0) });
    g.save(); g.globalAlpha = 0.22; g.translate(0, 1300); g.scale(1, -1); drawFigure(JIN, { x, y: 650, s, dir: 1, t, yaw: 0.78, walk: { p: (x - 615) / (s * 0.115), amt: CL(Math.min(u * 1.5, (7.5 - u) * 1.5)) }, light: -1 }); g.restore();
  });
  // birds crossing the dawn
  for (let i = 0; i < 5; i++) { const bx = L(-60, 1400, ((u * 0.12 + i * 0.07) % 1)), by = 140 + i * 18 + Math.sin(u * 3 + i) * 6; g.strokeStyle = 'rgba(40,40,60,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 10, by - Math.abs(Math.sin(u * 8 + i)) * 6); g.lineTo(bx, by); g.lineTo(bx + 10, by - Math.abs(Math.sin(u * 8 + i)) * 6); g.stroke(); }
  // end title
  const ti = span(u, 4.5, 6.2, ease.out);
  if (ti > 0) {
    glow(640, 200, 360, 'rgba(20,24,40,.55)', ti, 'source-over');
    g.save(); g.globalAlpha = ti; g.textAlign = 'center'; g.shadowColor = 'rgba(255,220,180,.6)'; g.shadowBlur = 24;
    g.fillStyle = '#fff6e8'; g.font = `700 64px ${MINCHO}`; g.fillText('設計図の図書館', 640, 190);
    g.font = `400 26px ${MINCHO}`; g.fillText('おわり', 640, 236); g.restore();
  }
}

export function close(t: number, dd: number) {
  if (t < c[1] - 0.2) arrive(t);
  else if (t < c[2] - 0.2) stamp(t, t - (c[1] - 0.2));
  else if (t < c[3] - 0.2) recap(t, t - (c[2] - 0.2));
  else if (t < c[4] - 0.2) {
    g.drawImage(deskBg(), 0, 0); glow(1000, 300, 600, 'rgba(255,190,110,.4)', 1); dawnLight(1);
    const hh = handheld(t, 1.6, 101), u = t - (c[3] - 0.2);
    bust(JIN, 520 + hh[0], 320 + hh[1], 320, { yaw: 0.4, gazeX: L(0.2, 0.7, span(u, 3, 4.5)), gazeY: L(0.6, 0.1, span(u, 3, 4.5)), mouth: talk(t, c[3], e[3]), blink: blinkAt(t, 1), smile: 0.25 }, t, -1);
    slipMotif(900, 620, 220, -0.12, 1);
  } else if (t < c[5] - 0.2) {
    g.drawImage(deskBg(), 0, 0); glow(980, 260, 600, 'rgba(255,190,110,.55)', 1); dawnLight(0.8);
    const hh = handheld(t, 1.6, 102);
    bust(DEO, 700 + hh[0], 320 + hh[1], 320, { yaw: -0.3, gazeX: -0.6, gazeY: 0.15, mouth: talk(t, c[4], e[4]), blink: blinkAt(t, 4), smile: 0.5 }, t, -1);
  } else if (t < c[6] - 0.2) {
    g.drawImage(deskBg(), 0, 0); glow(1000, 300, 600, 'rgba(255,190,110,.4)', 1); dawnLight(1);
    const hh = handheld(t, 1.6, 103);
    bust(JIN, 520 + hh[0], 320 + hh[1], 320, { yaw: 0.45, gazeX: 0.8, gazeY: 0.05, mouth: talk(t, c[5], e[5]), blink: blinkAt(t, 1), smile: 0.6, brow: 0.2 }, t, -1);
  } else morning(t, t - (c[6] - 0.2));
  [c[1], c[2], c[3], c[4], c[5], c[6]].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.55));
  wash('#050405', 1 - span(t, 0, 0.6));
  wash('#050405', span(t, d - 0.8, d));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', L(0.9, 0.5, span(t, c[6], d)));
  grain(t, 0.06);
  void dd; void page; void softBg;
}
