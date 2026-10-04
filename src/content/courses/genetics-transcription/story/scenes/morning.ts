/**
 * Scene 1「朝の閲覧票」: the library by morning → Jin walks into the sunny hall (left → right) → Deo hands
 * him a rush request slip (anticipation, hand-over, the paper settles) → the slip close: 窓口 肝臓,
 * グルコキナーゼの写し, 正午まで → Jin, Deo → the copyist Pol turns from the lectern → insert: the central
 * dogma, transcription highlighted (slides 3–5).
 */
import { CL, H, L, W, g } from '../../../../../engine/story/kit';
import { ease, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { exterior } from '../../../genetics-basics/story/sets';
import { DEO, JIN, POL } from '../cast';
import { COL, GOTHIC, arrowP, blinkAt, bust, cues, hall, insert, lectern, plate, slipBig, sun, talk, txt, wallClock, strand, polymerase, ribbon } from '../sets';

const { c, e, d } = cues('morning');

/** the exterior by morning: the night painting under a bright sky, sun from the upper left */
function outside(t: number) {
  const k = span(t, 0, 6);
  shot({ x: 640, y: L(330, 360, k), z: L(1.0, 1.08, k) }, 1, () => {
    g.drawImage(exterior(), 0, 0);
    // clock above the door: 8:00
    wallClock(640, 300, 32, 8, 0);
  });
  const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, 'rgba(140,200,255,.85)'); sk.addColorStop(0.5, 'rgba(255,236,200,.55)'); sk.addColorStop(1, 'rgba(200,190,170,.35)');
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = sk; g.fillRect(0, 0, W, H); g.restore();
  wash('#fff3d8', 0.18, 'soft-light');
  // birds over the roof
  for (let i = 0; i < 6; i++) { const bx = L(-60, 1400, ((t * 0.07 + i * 0.09) % 1)), by = 120 + i * 14 + Math.sin(t * 2 + i) * 5, fl = Math.abs(Math.sin(t * 7 + i)) * 6; g.strokeStyle = 'rgba(60,60,80,.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 9, by - fl); g.lineTo(bx, by); g.lineTo(bx + 9, by - fl); g.stroke(); }
  // title
  const ti = span(t, 0.6, 1.8) * (1 - span(t, 4.6, 5.6));
  if (ti > 0) {
    g.save(); g.globalAlpha = ti; g.fillStyle = 'rgba(255,250,238,.82)'; g.fillRect(0, 470, W, 120); g.restore();
    txt('写字室の朝', W / 2, 536, 50, '#2a2320', ti);
    txt('「設計図の図書館」 つづき', W / 2, 574, 20, '#6a5a48', ti, 'center', GOTHIC, 600);
  }
}

/** Deo's arm: pull back (anticipation), extend, hold, release after Jin takes the slip */
function handOver(t: number) {
  const back = span(t, c[1] + 0.4, c[1] + 1.0, ease.out), out = span(t, c[1] + 1.0, c[1] + 1.9, ease.back), took = span(t, c[1] + 2.3, c[1] + 2.8);
  return { back, out, took };
}

/** the hall: Jin walks in, Deo by the counter on the right, Pol at the lectern with her back half turned */
function hallWide(t: number, camZ: number, camX: number) {
  const walkK = span(t, 6.4, 11.2, (u) => u * u * (3 - 2 * u)), jx = L(-90, 470, walkK), walking = t > 6.4 && t < 11.2;
  const ho = handOver(t);
  const turn = span(t, c[4] + 0.2, c[4] + 1.4, ease.inOut);
  shot({ x: camX, y: 380, z: camZ }, 1, () => {
    g.drawImage(hall(), 0, 0);
    wallClock(780, 92, 26, 8, 2);
    // Pol at the lectern on the right: reading it (profile, facing left), then turns toward Jin and the camera
    drawFigure(POL, { x: 1150, y: 688, s: 420, dir: -1, t, yaw: L(-0.9, -0.3, turn), light: -1, blink: blinkAt(t, 2),
      gazeX: L(-0.9, -0.7, turn), gazeY: L(0.55, 0.1, turn), mouth: talk(t, c[4], e[4]), smile: 0.35 * turn,
      armN: turn < 0.4 ? { at: [1060, 440], grip: 0.4 } : { hand: [0.3, 1.25], grip: 0.6 }, armF: { hand: [0.2, 1.3], grip: 0.6 } });
    lectern(1050, 470, 0.85);
    // Deo
    drawFigure(DEO, { x: 850, y: 692, s: 470, dir: -1, t, yaw: -0.45, light: -1, blink: blinkAt(t, 4), mouth: talk(t, c[1], e[1]) + talk(t, c[3], e[3]),
      gazeX: L(-0.2, -0.7, span(t, 9, 11)), gazeY: 0.15, brow: 0.1,
      armN: t < c[1] ? { hand: [0.25, 1.3], grip: 0.4 } : { at: [L(L(800, 830, ho.back), 680, ho.out), L(L(470, 480, ho.back), 452, ho.out) + ho.took * 20], grip: L(0.8, 0.3, ho.took) },
      holdN: t >= c[1] + 0.4 && ho.took < 0.5 ? (hx, hy) => slipBig(hx - 22, hy - 10, 62, -0.2) : undefined,
      armF: { hand: [0.2, 1.3], grip: 0.5 } });
    // Jin
    const has = ho.took >= 0.5;
    const settle = has ? Math.sin((t - (c[1] + 2.5)) * 9) * Math.exp(-(t - (c[1] + 2.5)) * 3) * 0.08 : 0;
    drawFigure(JIN, { x: jx, y: 700, s: 440, dir: 1, t, yaw: walking ? 0.75 : 0.55, light: -1, blink: blinkAt(t, 1), mouth: talk(t, c[2], e[2]),
      walk: walking ? { p: (jx + 90) / (440 * 0.11), amt: CL(Math.min((t - 6.4) * 2, (11.2 - t) * 2)) } : undefined,
      gazeX: t > c[4] ? 0.8 : 0.75, gazeY: 0.1, smile: 0.2, brow: t > c[3] && t < c[4] ? 0.25 : 0,
      armN: has ? { at: [L(660, 580, span(t, c[1] + 2.6, c[1] + 3.6)), L(452, 500, span(t, c[1] + 2.6, c[1] + 3.6))], grip: 1 } : (t > c[1] + 1.8 ? { at: [L(580, 660, span(t, c[1] + 1.8, c[1] + 2.4)), 456], grip: 0.4 } : { hand: [0.3, 1.2], grip: 0.8 }),
      holdN: has ? (hx, hy) => slipBig(hx + 18, hy - 12, 62, -0.12 + settle) : undefined,
      armF: { hand: [0.25, 1.25], grip: 1 } });
    sun(t, 1);
  });
}

/** the slip on Jin's palm, close */
function slipClose(t: number, u: number) {
  shot({ x: 640, y: 360, z: L(1, 1.06, u / 6) }, 1, () => {
    g.drawImage(hall(), -300, -200, W * 1.6, H * 1.6);
    g.save(); try { g.filter = 'blur(6px)'; } catch { /* sharp */ } g.drawImage(hall(), -300, -200, W * 1.6, H * 1.6); g.restore();
    wash('#fff8ea', 0.25);
    const rot = -0.05 + Math.sin(t * 0.8) * 0.006;
    slipBig(640, 360, 560, rot);
    // two thumbs holding the edges
    [[-1, 0.1], [1, -0.1]].forEach(([sx, a]) => { g.save(); g.translate(640 + sx * 286, 380 + sx * -14); g.rotate(rot + a); g.fillStyle = JIN.skinShade; g.beginPath(); g.ellipse(0, 40, 46, 70, 0, 0, 7); g.fill(); g.fillStyle = JIN.skin; g.beginPath(); g.ellipse(-sx * 6, 0, 22, 40, sx * 0.3, 0, 7); g.fill(); g.restore(); });
  });
  sun(t, 0.5);
}

/** insert: DNA → (転写) → RNA → (翻訳) → タンパク質; transcription is today's work */
function dogma(t: number, u: number) {
  insert('遺伝情報の流れ（セントラルドグマ）', '', span(u, 0, 0.6), () => {
    g.save(); g.translate(640, 300); g.scale(1.18, 1.18); g.translate(-590, -340);
    const a1 = span(u, 0.3, 1.2), a2 = span(u, 2.5, 3.5), a3 = span(u, 7, 8), hl = span(u, 10, 11.5);
    // DNA (two strands)
    const y0 = 230;
    strand([[230, y0 - 14], [560, y0 - 14]], COL.nontemp, 10); strand([[230, y0 + 14], [560, y0 + 14]], COL.temp, 10);
    g.globalAlpha = 1;
    for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(31,42,58,.35)'; g.fillRect(244 + i * 20, y0 - 8, 3, 16); }
    txt('DNA（原本）', 395, y0 - 40, 26, '#1f2a3a', a1, 'center', GOTHIC);
    // arrow: transcription
    arrowP(395, y0 + 34, 395, 380, '#c2185b', a2, 5);
    plate('転写', 470, 360, 24, '#ffffff', '#c2185b', a2, 'left');
    // RNA
    if (a2 > 0.5) { strand([[230, 430], [L(230, 560, span(u, 3, 5.5)), 430]], COL.rna, 10); txt("5'", 210, 438, 20, '#c2185b', 1, 'center', GOTHIC); if (u > 5.5) txt("3'", 582, 438, 20, '#c2185b', 1, 'center', GOTHIC); }
    txt('RNA（写し）', 395, 474, 26, '#1f2a3a', span(u, 4, 5), 'center', GOTHIC);
    // arrow: translation → protein
    arrowP(600, 430, 800, 430, '#5a6b80', a3, 4);
    txt('翻訳', 700, 410, 22, '#5a6b80', a3, 'center', GOTHIC);
    for (let i = 0; i < 6; i++) { const aa = span(u, 8 + i * 0.25, 8.5 + i * 0.25); g.globalAlpha = aa; g.fillStyle = ['#7fb36a', '#5e9a54', '#9cc58a'][i % 3]; g.beginPath(); g.arc(840 + i * 46, 430 + Math.sin(i) * 8, 19, 0, 7); g.fill(); g.globalAlpha = 1; }
    txt('タンパク質', 955, 490, 26, '#1f2a3a', span(u, 8.5, 9.5), 'center', GOTHIC);
    // today: transcription, the first step
    if (hl > 0) { g.strokeStyle = `rgba(194,24,91,${hl})`; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.roundRect(160, 140, 490, 380, 24); g.stroke(); g.setLineDash([]); }
    g.restore();
    plate('細菌からヒトまで、すべての細胞に共通（スライド3）', W / 2, 560, 22, '#1f2a3a', 'rgba(255,255,255,.9)', span(u, 5.5, 6.5));
    plate('今日の仕事：最初の一歩＝転写（スライド4・5）', W / 2, 606, 22, '#ffffff', '#c2185b', hl);
    void polymerase; void ribbon;
  }, 'スライド3〜5');
  void t;
}

export function morning(t: number, dd: number) {
  const hh = handheld(t, 1.2, 11);
  if (t < 6.2) outside(t);
  else if (t < c[1] + 3.6) hallWide(t, L(1.0, 1.12, span(t, 6.2, c[1] + 3.6)), L(560, 640, span(t, 6.2, c[1] + 3.6)));
  else if (t < c[1] + 9.4) slipClose(t, t - (c[1] + 3.6));
  else if (t < c[2] - 0.2) hallWide(t, 1.18, 700);
  else if (t < c[3] - 0.2) {
    g.drawImage(hall(), -420, -160, W * 1.5, H * 1.5); wash('#fff8ea', 0.2); sun(t, 0.6);
    bust(JIN, 520 + hh[0], 330 + hh[1], 320, { yaw: 0.45, gazeX: 0.8, gazeY: 0.05, mouth: talk(t, c[2], e[2]), blink: blinkAt(t, 1), smile: 0.45, brow: 0.15 }, t, -1);
    slipBig(820, 640, 200, -0.2);
  } else if (t < c[4] - 0.2) {
    g.drawImage(hall(), -760, -180, W * 1.6, H * 1.6); wash('#fff8ea', 0.2); sun(t, 0.5);
    bust(DEO, 720 + hh[0], 330 + hh[1], 320, { yaw: -0.35, gazeX: -0.7, gazeY: 0.12, mouth: talk(t, c[3], e[3]), blink: blinkAt(t, 4), smile: 0.35, brow: 0.2 }, t, -1);
  } else if (t < c[4] + 3.6) hallWide(t, 1.06, 640);
  else if (t < c[5] - 0.2) {
    g.drawImage(hall(), -520, -160, W * 1.5, H * 1.5); wash('#fff8ea', 0.22); sun(t, 0.6);
    bust(POL, 640 + hh[0], 330 + hh[1], 320, { yaw: -0.25, gazeX: -0.55, gazeY: 0.1, mouth: talk(t, c[4], e[4]), blink: blinkAt(t, 2), smile: 0.55 }, t, -1);
    plate('写字係ポル ＝ RNAポリメラーゼ（たとえ）', 640, 676, 22, '#ffffff', COL.polEdge, span(t, c[4] + 3.8, c[4] + 4.6));
  } else dogma(t, t - (c[5] - 0.2));
  // cuts: short dips; fade in / out of the scene
  [6.2, c[1] + 3.6, c[1] + 9.4, c[2] - 0.2, c[3] - 0.2, c[4] - 0.2, c[4] + 3.6, c[5] - 0.2].forEach((x) => wash('#0a0806', CL(1 - Math.abs(t - x) / 0.22) * 0.35));
  wash('#0a0806', 1 - span(t, 0, 0.8));
  wash('#0a0806', span(t, d - 0.6, d));
  grain(t, 0.03);
  void dd;
}
