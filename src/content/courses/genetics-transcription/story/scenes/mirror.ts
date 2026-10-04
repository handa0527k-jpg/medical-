/**
 * Scene 2「鏡の向きで写す」: at the lectern Pol shows the two strands and reads only one, the template →
 * insert: the bubble, template read 3'→5', RNA made 5'→3' → Jin: the copy is the opposite letters? → the copy
 * matches the non-template strand, T written as U (slide 7) → insert: NTP joins the 3'OH, pyrophosphate
 * leaves, phosphodiester bond (slide 8) → the shelf: books face both ways → Deo: the promoter decides the
 * direction (slide 11) → Pol sends Jin to the annex (exits right).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { tableTop } from '../../../genetics-basics/story/sets';
import { DEO, JIN, POL } from '../cast';
import { BASE, COL, GOTHIC, HAND, RNAOF, arrowP, baseTile, blinkAt, bust, cues, endTag, hall, insert, lectern, plate, ribbon, sun, talk, txt, wallClock } from '../sets';
import { bubble, dirArrow } from '../mol';

const { c, e, d } = cues('mirror');
const NT = 'ATGAAATGCTA';
const TP = [...NT].map((x) => ({ A: 'T', T: 'A', G: 'C', C: 'G' } as Record<string, string>)[x]).join('');
const RNA = [...TP].map((x) => RNAOF[x]).join('');

/** the open original seen from above, two rows of letters; fn draws extra on top */
function book(t: number, u: number, opt: { read: number; write: number; showRna: number; hlU: number }) {
  const push = span(u, 0, 8);
  shot({ x: 640, y: 350, z: L(1.0, 1.05, push) }, 1, () => {
    g.drawImage(tableTop('tx-table'), 0, 0); wash('#ffe9c8', 0.28, 'soft-light'); wash('#fff6e6', 0.12);
    // pages
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(118, 88, 1060, 420, 10); g.fill();
    g.fillStyle = '#f6eedb'; rr(108, 76, 1060, 420, 10); g.fill();
    g.strokeStyle = 'rgba(120,90,50,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(638, 80); g.lineTo(638, 492); g.stroke();
    const S = 60, x0 = 400, step = 66;
    plate('非鋳型鎖（見本）', 128, 216, 20, '#5a4508', 'rgba(255,236,170,.95)', 1, 'left');
    plate('鋳型鎖（読む側）', 128, 286, 20, '#ffffff', '#1f6ea8', 1, 'left');
    endTag("5'", x0 - 52, 210, '#9a7a10'); endTag("3'", x0 + step * 10 + 52, 210, '#9a7a10');
    endTag("3'", x0 - 52, 280, '#1f6ea8'); endTag("5'", x0 + step * 10 + 52, 280, '#1f6ea8');
    [...NT].forEach((ch, i) => baseTile(ch, x0 + i * step, 210, S, 1, opt.hlU > 0 && ch === 'T' ? opt.hlU : 0));
    [...TP].forEach((ch, i) => baseTile(ch, x0 + i * step, 280, S, 1, opt.read > 0 && Math.abs(i - opt.read * 10) < 0.5 ? 1 : 0));
    g.strokeStyle = 'rgba(31,42,58,.35)'; g.lineWidth = 3; for (let i = 0; i < 11; i++) { g.beginPath(); g.moveTo(x0 + i * step, 243); g.lineTo(x0 + i * step, 247); g.stroke(); }
    // the copy (pink ribbon) under the book, letters appear as Pol writes left → right
    if (opt.showRna > 0) {
      const n = Math.floor(opt.write * 11 + 0.001);
      ribbon([[x0 - 50, 420], [x0 + step * 10 + 50, 420]], 72, { alpha: opt.showRna });
      for (let i = 0; i < n; i++) baseTile(RNA[i], x0 + i * step, 420, S * 0.92, opt.showRna, opt.hlU > 0 && RNA[i] === 'U' ? opt.hlU : 0);
      endTag("5'", x0 - 52, 420, '#c2185b', opt.showRna); if (n >= 11) endTag("3'", x0 + step * 10 + 52, 420, '#c2185b', opt.showRna);
      plate('写し（RNA）', 128, 426, 20, '#ffffff', '#c2185b', opt.showRna, 'left');
    }
    // Pol's hand: forefinger moving along the template row (left → right), pen when writing
    const hx = x0 + (opt.write > 0 ? opt.write : opt.read) * step * 10, hy = opt.write > 0 ? 470 : 330;
    g.save(); g.translate(hx + 18, hy + 30); g.rotate(-0.5);
    g.fillStyle = POL.top; rr(-50, 40, 100, 200, 30); g.fill();
    g.fillStyle = POL.skin; g.beginPath(); g.ellipse(0, 20, 34, 40, 0, 0, 7); g.fill();
    if (opt.write > 0) { g.fillStyle = '#2a1e18'; rr(-6, -110, 12, 120, 4); g.fill(); g.fillStyle = '#3a3a40'; g.beginPath(); g.moveTo(-6, -110); g.lineTo(6, -110); g.lineTo(0, -132); g.fill(); }
    else { g.beginPath(); g.ellipse(-4, -26, 10, 30, 0.05, 0, 7); g.fill(); }
    g.restore();
  });
  sun(t, 0.3);
}

/** insert: the bubble moving left → right, RNA peeling off with its 5' end first */
function bubbleInsert(t: number, u: number, len: number) {
  insert('鋳型鎖を3\'→5\'に読み、RNAを5\'→3\'に合成する', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const k = span(u, 0.5, len - 0.5, (x) => x);
    const bx = L(420, 760, k);
    bubble(bx, L(60, 380, k), { y: 330, names: span(u, 1, 2) });
    dirArrow(640, 170, span(u, 2, 3));
    plate('RNAポリメラーゼは、鋳型鎖に相補的なヌクレオチドを1個ずつつなげる（スライド10）', W / 2, 600, 20, '#1f2a3a', 'rgba(255,255,255,.92)', span(u, 4, 5));
  }, 'スライド5・10');
  void t;
}

/** insert: NTP joins the 3'OH; pyrophosphate leaves; phosphodiester bond */
function bondInsert(t: number, u: number) {
  insert('リン酸ジエステル結合で、RNAは3\'側へ伸びる', '', span(u, 0, 0.6), () => {
    // the four NTPs
    ['A', 'U', 'C', 'G'].forEach((ch, i) => {
      const a = span(u, 0.4 + i * 0.4, 0.9 + i * 0.4);
      baseTile(ch, 200 + i * 120, 170, 62, a);
      txt(`${ch}TP`, 200 + i * 120, 228, 20, '#1f2a3a', a, 'center', GOTHIC, 800);
    });
    txt('材料：ATP・UTP・CTP・GTP（スライド8）', 380, 112, 22, '#1f2a3a', span(u, 0.4, 1.2), 'center', GOTHIC, 800);
    // growing chain: sugar–phosphate backbone, 3'OH at the end
    const y = 420, n = 4, sx = 220, st = 130;
    for (let i = 0; i < n; i++) {
      const x = sx + i * st;
      g.fillStyle = '#ffd9e6'; g.strokeStyle = '#c2185b'; g.lineWidth = 3; g.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; g.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); } g.closePath(); g.fill(); g.stroke();
      baseTile('AUGA'[i], x, y - 78, 46);
      g.strokeStyle = '#8a8f9a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x, y - 55); g.stroke();
      if (i < n - 1) { g.fillStyle = '#f5c542'; g.beginPath(); g.arc(x + st / 2, y + 30, 16, 0, 7); g.fill(); txt('P', x + st / 2, y + 37, 18, '#5a4508', 1, 'center', GOTHIC, 800); g.strokeStyle = '#c2185b'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 26, y + 12); g.lineTo(x + st / 2 - 12, y + 26); g.moveTo(x + st / 2 + 12, y + 26); g.lineTo(x + st - 26, y + 12); g.stroke(); }
    }
    const lx = sx + (n - 1) * st;
    const oh = span(u, 2.5, 3.5);
    plate("3'OH", lx + 40, y + 44, 18, '#ffffff', '#c2185b', oh, 'left');
    endTag("5'", sx - 60, y, '#c2185b');
    // incoming UTP: three phosphates; two leave as pyrophosphate
    const come = span(u, 4, 8, ease.inOut), leave = span(u, 9, 11, ease.out);
    const nx = L(lx + 330, lx + st, come), ny = L(y - 120, y, come);
    g.fillStyle = '#ffd9e6'; g.strokeStyle = '#c2185b'; g.lineWidth = 3; g.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; g.lineTo(nx + Math.cos(a) * 30, ny + Math.sin(a) * 30); } g.closePath(); g.fill(); g.stroke();
    baseTile('U', nx, ny - 78, 46); g.strokeStyle = '#8a8f9a'; g.lineWidth = 3; g.beginPath(); g.moveTo(nx, ny - 30); g.lineTo(nx, ny - 55); g.stroke();
    const p1x = L(nx - 64, lx + st / 2, come), p1y = L(ny + 30, y + 30, come);
    g.fillStyle = '#f5c542'; g.beginPath(); g.arc(p1x, p1y, 16, 0, 7); g.fill(); txt('P', p1x, p1y + 7, 18, '#5a4508', 1, 'center', GOTHIC, 800);
    [1, 2].forEach((q) => { const px = L(p1x - q * 36, p1x - q * 36 + 120, leave) , py = L(p1y, p1y + 120, leave) ; g.globalAlpha = 1 - span(u, 13, 14); g.fillStyle = '#f5c542'; g.beginPath(); g.arc(px, py, 16, 0, 7); g.fill(); txt('P', px, py + 7, 18, '#5a4508', 1, 'center', GOTHIC, 800); g.globalAlpha = 1; });
    plate('ピロリン酸（PPi）がはずれる', lx + 200, y + 190, 18, '#5a4508', 'rgba(255,240,190,.95)', leave * (1 - span(u, 13, 14)));
    const bond = span(u, 10.5, 11.5);
    if (bond > 0) { g.strokeStyle = `rgba(194,24,91,${bond})`; g.lineWidth = 5; g.beginPath(); g.moveTo(lx + 26, y + 12); g.lineTo(lx + st / 2 - 12, y + 26); g.moveTo(lx + st / 2 + 12, y + 26); g.lineTo(lx + st - 26, y + 12); g.stroke(); }
    plate("3'の炭素と次の5'の炭素のあいだに、リン酸ジエステル結合", W / 2, 620, 20, '#ffffff', '#c2185b', span(u, 11.5, 12.5));
    plate('UTPは鋳型のAに対合して入る', lx + 300, 170, 18, '#1f2a3a', 'rgba(255,255,255,.95)', span(u, 5, 6) * (1 - span(u, 9, 10)));
  }, 'スライド8');
  void t;
}

/** the shelf: book spines with direction arrows; inset: genes on both strands (slide 11) */
function shelf(t: number, u: number) {
  const pan = span(u, 0, 10, ease.inOut);
  shot({ x: L(760, 900, pan), y: 330, z: 1.9 }, 1, () => { g.drawImage(hall(), 0, 0); sun(t, 0.6); });
  // arrows on spines: some right, some left
  const arrows = [[520, 1], [610, 1], [700, -1], [790, 1], [880, -1], [970, -1], [1060, 1]];
  arrows.forEach(([x, dd], i) => { const a = span(u, 0.5 + i * 0.25, 1 + i * 0.25); const xx = (x - L(760, 900, pan)) * 1.9 + 640; plate(dd > 0 ? '→' : '←', xx, 520, 40, '#ffffff', dd > 0 ? 'rgba(194,24,91,.85)' : 'rgba(31,110,168,.85)', a); });
  const ins = span(u, c[6] - c[5] + 0.5, c[6] - c[5] + 1.5);
  if (ins > 0) {
    g.save(); g.globalAlpha = ins; g.fillStyle = 'rgba(242,247,252,.96)'; rr(120, 250, 1040, 190, 18); g.fill(); g.restore();
    plate('実際の細胞では', 140, 282, 16, '#ffffff', '#1f3a5f', ins, 'left');
    const y1 = 340, y2 = 368;
    g.globalAlpha = ins;
    g.strokeStyle = COL.nontemp; g.lineWidth = 7; g.beginPath(); g.moveTo(180, y1); g.lineTo(1100, y1); g.stroke();
    g.strokeStyle = COL.temp; g.beginPath(); g.moveTo(180, y2); g.lineTo(1100, y2); g.stroke();
    g.globalAlpha = 1;
    [[260, 1, 'a'], [470, 1, 'b'], [760, -1, 'c'], [900, -1, 'd'], [1010, 1, 'e']].forEach(([x, dd, n], i) => {
      const a = ins * span(u, c[6] - c[5] + 1.5 + i * 0.3, c[6] - c[5] + 2 + i * 0.3);
      const px = x as number, dir = dd as number;
      plate('P', px, dir > 0 ? y2 + 4 : y1 + 4, 14, '#ffffff', '#5a6b80', a);
      arrowP(px + dir * 18, dir > 0 ? y2 + 30 : y1 - 26, px + dir * 120, dir > 0 ? y2 + 30 : y1 - 26, dir > 0 ? '#c2185b' : '#1f6ea8', a, 4);
      txt(`遺伝子${n}`, px + dir * 70, dir > 0 ? y2 + 54 : y1 - 34, 15, '#1f2a3a', a, 'center', GOTHIC, 700);
    });
    txt('プロモーター（P）の向きで、RNAポリメラーゼの動く向きが決まる（スライド11）', W / 2, 426, 17, '#1f2a3a', ins, 'center', GOTHIC, 800);
  }
}

/** wide: Pol points to the right (the courtyard door to the annex); Jin goes */
function sendOff(t: number, u: number) {
  const go = span(u, 5.2, 9.8, (x) => x * x * (3 - 2 * x)), jx = L(640, 1420, go), walking = u > 5.2;
  const point = span(u, 0.4, 1.4, ease.back);
  shot({ x: 640, y: 380, z: 1.04 }, 1, () => {
    g.drawImage(hall(), 0, 0); wallClock(780, 92, 26, 8, 20);
    lectern(1050, 470, 0.85);
    drawFigure(DEO, { x: 170, y: 692, s: 470, dir: 1, t, yaw: 0.4, light: -1, blink: blinkAt(t, 4), gazeX: 0.7, gazeY: 0.1, smile: 0.3, armN: { hand: [0.2, 1.3], grip: 0.4 }, armF: { hand: [0.2, 1.3], grip: 0.4 } });
    drawFigure(POL, { x: 420, y: 688, s: 420, dir: 1, t, yaw: L(0.2, 0.6, point), light: -1, blink: blinkAt(t, 2), mouth: talk(t, c[7], e[7]), smile: 0.5,
      gazeX: L(-0.6, 0.8, point), gazeY: 0.1, armN: { at: [L(460, 560, point), L(560, 420, point)], grip: 0.2 }, armF: { hand: [0.2, 1.3], grip: 0.6 } });
    drawFigure(JIN, { x: jx, y: 700, s: 440, dir: 1, t, yaw: walking ? 0.8 : 0.5, light: -1, blink: blinkAt(t, 1), gazeX: 0.8, gazeY: 0.1, smile: 0.3,
      walk: walking ? { p: (jx - 640) / (440 * 0.11), amt: CL(Math.min((u - 5.2) * 2, 1)) } : undefined, armN: { hand: [0.3, 1.2], grip: 1 }, armF: { hand: [0.25, 1.25], grip: 1 } });
    sun(t, 1);
  });
}

export function mirror(t: number, dd: number) {
  const hh = handheld(t, 1.2, 21);
  const cut = [c[1] - 0.2, c[2] - 0.2, c[3] - 0.2, c[4] - 0.2, c[5] - 0.2, c[7] - 0.2];
  if (t < cut[0]) book(t, t, { read: span(t, 2.5, 8, (x) => x), write: 0, showRna: 0, hlU: 0 });
  else if (t < cut[1]) bubbleInsert(t, t - cut[0], cut[1] - cut[0]);
  else if (t < cut[2]) {
    g.drawImage(hall(), -420, -160, W * 1.5, H * 1.5); wash('#fff8ea', 0.2); sun(t, 0.6);
    bust(JIN, 560 + hh[0], 340 + hh[1], 320, { yaw: 0.35, tilt: 0.12, gazeX: 0.6, gazeY: 0.5, mouth: talk(t, c[2], e[2]), blink: blinkAt(t, 1), brow: 0.3, wide: 0.2 }, t, -1);
  } else if (t < cut[3]) { const u = t - cut[2]; book(t, u + 8, { read: 0, write: span(u, 0.8, 7, (x) => x), showRna: span(u, 0, 0.6), hlU: span(u, 6.5, 7.5) }); plate('写しは非鋳型鎖と同じ並び。TのところはUで書く（スライド7）', W / 2, 640, 22, '#ffffff', '#c2185b', span(u, 7, 8)); }
  else if (t < cut[4]) bondInsert(t, t - cut[3]);
  else if (t < cut[5]) shelf(t, t - cut[4]);
  else sendOff(t, t - cut[5]);
  cut.forEach((x) => wash('#0a0806', CL(1 - Math.abs(t - x) / 0.22) * 0.35));
  wash('#0a0806', 1 - span(t, 0, 0.6));
  wash('#0a0806', span(t, d - 0.6, d));
  grain(t, 0.03);
  void dd; void BASE; void HAND; void lectern;
}
