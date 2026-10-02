/**
 * Scene 8「付箋と別冊」: the original shelf covered in sticky notes; Mechi, who keeps them → closed:
 * CpG and histone methylation, heterochromatin, no transcription → open: transcription factor on the
 * enhancer, HAT, acetylation, euchromatin, RNA polymerase; HDAC undoes it → the ALDH2 page carries
 * "open and read" → the small supplement: mitochondrial DNA (37 genes, 10³–10⁴ copies, maternal) → the copy is
 * finished as the windows turn pale (→ close).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { dust, ease, glow, grade, grain, handheld, shaft, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { JIN, MECHI } from '../cast';
import { HAND, aisle, bust, cues, lampPool, page, sheet, slip, softBg, tableTop, txt, blinkAt, talk } from '../sets';

const { c, e, d } = cues('notes');
const NOTE_COLS = ['#ffd36b', '#8fd6ff', '#ff9ec0', '#b8f0a0'];
const HIS = ['#b48ad8', '#8a5cc2', '#d6b0e8', '#9b74c8'];

function note(x: number, y: number, w: number, col: string, rot: number, label = '', a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-w / 2 + 3, -w / 2 + 4, w, w * 0.9);
  g.fillStyle = col; g.fillRect(-w / 2, -w / 2, w, w * 0.9); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(-w / 2, -w / 2, w, w * 0.16);
  if (label) { g.fillStyle = '#3a2a1e'; g.font = `600 ${Math.round(w * 0.32)}px ${HAND}`; g.textAlign = 'center'; g.fillText(label, 0, w * 0.18); }
  g.restore();
}
function bookcase(x: number, y: number, w: number, h: number) {
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x + 8, y + 10, w, h);
  g.fillStyle = '#2a1a12'; g.fillRect(x, y, w, h);
  const rows = Math.max(2, Math.round(h / 110)), rh = h / rows;
  for (let r = 0; r < rows; r++) { let bx = x + 10, i = 0; while (bx < x + w - 20) { const bw = 14 + ((i * 7 + r * 5) % 4) * 4, bh = rh * (0.62 + ((i * 3 + r) % 4) * 0.08); g.fillStyle = ['#5a3a30', '#3a4a5a', '#5a5030', '#4a3a5a', '#3a5040'][(i + r) % 5]; g.fillRect(bx, y + (r + 1) * rh - bh - 8, bw, bh); bx += bw + 2; i++; } g.fillStyle = '#4a3020'; g.fillRect(x, y + (r + 1) * rh - 8, w, 8); }
  g.strokeStyle = '#4a3020'; g.lineWidth = 10; g.strokeRect(x, y, w, h);
}
function notesOn(x: number, y: number, n: number, t: number) {
  for (let i = 0; i < n; i++) note(x + (i % 7) * 52 + ((i * 13) % 9), y + Math.floor(i / 7) * 80 + ((i * 7) % 11), 36, NOTE_COLS[i % 4], ((i * 17) % 7 - 3) * 0.04 + Math.sin(t * 1.4 + i) * 0.02);
}
/** a nucleosome seen side on (8 beads), with optional tags on its tails */
function nuc(x: number, y: number, r: number, tag: '' | 'Me' | 'Ac', tagA: number) {
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; g.fillStyle = HIS[i]; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.3, r * 0.42, 0, 7); g.fill(); }
  g.strokeStyle = '#2e6db0'; g.lineWidth = r * 0.12; g.beginPath(); g.ellipse(x, y, r * 0.95, r * 0.62, -0.2, 0, Math.PI * 2 * 0.85); g.stroke();
  if (tag && tagA > 0) { g.strokeStyle = 'rgba(240,230,220,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - r * 0.6); g.lineTo(x + r * 0.3, y - r * 1.1); g.stroke(); note(x + r * 0.34, y - r * 1.25, r * 0.6, tag === 'Me' ? '#ffd36b' : '#ff9ec0', 0.1, tag, tagA); }
}

function meeting(t: number) {
  const stick = span(t, 3, 4.2, ease.antic);
  shot({ x: 660, y: 360, z: L(1.0, 1.05, span(t, 0, 9)) }, 1, () => {
    g.drawImage(aisle('pack', 0.6), -60, 0, W * 1.15, H);
    lampPool(900, 320, 560, 0.95);
    bookcase(700, 100, 440, 440);
    notesOn(740, 160, 26, t);
    note(1100, 300, 40, '#ffd36b', -0.1, '', stick);
    drawFigure(MECHI, { x: 1190, y: 720, s: 440, dir: -1, t, yaw: -0.45, light: -1, blink: blinkAt(t, 8), mouth: talk(t, c[0], e[0]), gazeX: L(0.6, -0.7, span(t, 4.5, 5.5)), gazeY: 0.1, smile: 0.4,
      armF: { at: [L(1180, 1100, stick), L(500, 300, stick)], grip: 0.6 }, armN: { hand: [0.4, 1.2], grip: 0.6 } });
    drawFigure(JIN, { x: 460, y: 720, s: 450, dir: 1, t, yaw: 0.6, light: 1, blink: blinkAt(t, 1), gazeX: 0.9, gazeY: -0.1, armN: { hand: [0.5, 1.2], grip: 1 }, holdN: (hx, hy) => slip(hx + 20, hy - 6, 56, -0.15) });
    dust(t, [700, 120, 500, 400], 40, 91, (px, py) => CL(1 - Math.hypot(px - 900, py - 320) / 400));
  });
}

/** closed: methyl notes on CpG and histones, the spools pack tight, the polymerase cannot get on */
function closed(t: number, u: number) {
  g.drawImage(tableTop('gen-notes'), 0, 0); lampPool(640, 300, 760, 0.85);
  const hh = handheld(t, 1, 92);
  g.save(); g.translate(hh[0], hh[1]);
  txt('エピジェネティックな制御：文字は変えずに、読む・読まないを決める', 640, 70, 26, '#ffe8c0', span(u, 0.2, 1.4));
  const pack = span(u, 7, 10, ease.inOut), gap = L(210, 120, pack), x0 = 640 - gap * 2;
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * gap;
    if (i < 4) { g.strokeStyle = '#2e6db0'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 50, 300); g.lineTo(x + gap - 50, 300); g.stroke(); }
    nuc(x, 300, 60, 'Me', span(u, 5 + i * 0.25, 5.6 + i * 0.25));
  }
  // CpG methylation marks on the linker DNA
  for (let i = 0; i < 4; i++) { const x = x0 + i * gap + gap / 2; const a = span(u, 2.6 + i * 0.3, 3.2 + i * 0.3, ease.back); if (a > 0) { txt('CpG', x, 360, 18, '#a8c8f0', a, 'center', HAND, 600); note(x, 250, 28, '#ffd36b', 0.15, 'Me', a); } }
  const het = span(u, 9, 10);
  if (het > 0) { g.strokeStyle = `rgba(255,232,192,${het})`; g.lineWidth = 3; rr(x0 - 90, 210, gap * 4 + 180, 180, 30); g.stroke(); txt('ヘテロクロマチン（固く凝集）', 640, 450, 30, '#ffe8c0', het); }
  const pol = span(u, 10.5, 11.6, ease.out);
  if (pol > 0) {
    const px = L(100, 240, pol); g.fillStyle = 'rgba(90,170,120,.9)'; g.beginPath(); g.ellipse(px, 300, 60, 46, 0, 0, 7); g.fill(); txt('RNAポリメラーゼ', px, 230, 18, '#b8e0c0', pol, 'center', HAND, 600);
    g.strokeStyle = `rgba(255,90,80,${pol})`; g.lineWidth = 8; g.beginPath(); g.moveTo(px + 70, 260); g.lineTo(px + 120, 340); g.moveTo(px + 120, 260); g.lineTo(px + 70, 340); g.stroke();
    txt('転写は止まる', 640, 500, 28, '#ffb0a0', span(u, 11, 12));
  }
  g.restore();
}

/** open: TF on the enhancer calls HAT, acetyl notes, spools loosen, the polymerase reads; HDAC takes them off */
function opened(t: number, u: number) {
  g.drawImage(tableTop('gen-notes'), 0, 0); lampPool(640, 300, 760, 0.85);
  const hh = handheld(t, 1, 93);
  g.save(); g.translate(hh[0], hh[1]);
  const loosen = span(u, 7, 10.5, ease.inOut), undo = span(u, 17, 20.5, ease.inOut);
  const gap = L(120, 210, loosen * (1 - undo * 0.6)), x0 = 700 - gap * 2;
  // enhancer + transcription factor (left)
  const tf = span(u, 0.4, 2, ease.back);
  g.strokeStyle = '#2e6db0'; g.lineWidth = 5; g.beginPath(); g.moveTo(40, 300); g.lineTo(x0 - 50, 300); g.stroke();
  g.fillStyle = '#e6b23a'; g.fillRect(90, 290, 90, 20); txt('エンハンサー', 135, 350, 18, '#ffe8c0', span(u, 0.2, 1), 'center', HAND, 600);
  if (tf > 0) { g.save(); g.translate(135, L(150, 262, tf)); g.fillStyle = '#5aa0d0'; g.beginPath(); g.ellipse(0, 0, 44, 30, 0, 0, 7); g.fill(); g.restore(); txt('転写因子', 135, 210, 18, '#a8d0f0', tf, 'center', HAND, 600); }
  // HAT arrives and hands out acetyl notes
  const hat = span(u, 3.5, 5.5, ease.inOut);
  if (hat > 0 && undo < 1) { const hx = L(135, x0 + gap * 2, span(u, 5.5, 8.5, ease.inOut)), hy = L(150, 170, hat); g.globalAlpha = 1 - undo; g.fillStyle = '#e07a9a'; g.beginPath(); g.ellipse(hx, hy, 56, 32, 0, 0, 7); g.fill(); g.globalAlpha = 1; txt('アセチル化酵素', hx, hy + 8, 17, '#2a1a20', hat * (1 - undo), 'center', HAND, 600); }
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * gap;
    if (i < 4) { g.strokeStyle = '#2e6db0'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 50, 300); g.lineTo(x + gap - 50, 300); g.stroke(); }
    const ac = span(u, 5.5 + i * 0.5, 6.1 + i * 0.5) * (1 - span(u, 17.5 + i * 0.5, 18.1 + i * 0.5));
    nuc(x, 300, 60, 'Ac', ac);
  }
  txt('塩基性が下がり、DNAが緩む', 640, 450, 28, '#ffe8c0', span(u, 8, 9) * (1 - span(u, 10.5, 11)));
  txt('ユークロマチン', 640, 450, 32, '#ffd36b', span(u, 10.8, 11.6) * (1 - span(u, 16.5, 17)));
  // the polymerase rides along, leaving an RNA strand
  const pol = span(u, 12, 16.5, ease.inOut);
  if (pol > 0 && undo < 0.5) { const px = L(x0 - 20, x0 + gap * 4 + 60, pol); g.strokeStyle = '#d14d7c'; g.lineWidth = 4; g.beginPath(); for (let x = x0 - 20; x < px; x += 8) g.lineTo(x, 380 + Math.sin(x * 0.05) * 10); g.stroke(); g.fillStyle = 'rgba(90,170,120,.92)'; g.beginPath(); g.ellipse(px, 340, 54, 40, 0, 0, 7); g.fill(); txt('RNAポリメラーゼ → 転写', 640, 520, 24, '#b8e0c0', span(u, 12, 13) * (1 - span(u, 16.5, 17)), 'center', HAND, 600); }
  // HDAC takes the notes back off
  const hd = span(u, 16.6, 17.4, ease.out);
  if (hd > 0) { const hx = L(1240, x0 + gap * 2, span(u, 17, 20)); g.fillStyle = 'rgba(150,150,160,.95)'; g.beginPath(); g.ellipse(hx, 170, 60, 32, 0, 0, 7); g.fill(); txt('脱アセチル化酵素', hx, 178, 16, '#202024', hd, 'center', HAND, 600); txt('元に戻す', 640, 450, 30, '#d0d0d8', span(u, 18, 19)); }
  g.restore();
}

/** the ALDH2 page on the shelf: a pink note reads 「開いて読む」 */
function openNote(t: number, u: number) {
  const reach = span(u, 0.8, 2.2, ease.antic);
  shot({ x: 640, y: 330, z: 1.0 + span(u, 0, 4.4) * 0.06 }, 1, () => {
    g.drawImage(softBg('notes', 600, 400, 1.6, 'rgba(10,6,10,.4)'), 0, 0);
    lampPool(640, 300, 600, 0.95);
    g.fillStyle = '#2a1a12'; g.fillRect(200, 80, 880, 480);
    [['#5a3a30', 260], ['#3a4a5a', 330], ['#4a3a5a', 760], ['#5a5030', 840], ['#3a5040', 920]].forEach(([col, x]) => { g.fillStyle = col as string; g.fillRect(x as number, 110, 60, 420); });
    g.fillStyle = '#2e4a72'; g.fillRect(470, 100, 260, 440); g.strokeStyle = '#c9a050'; g.lineWidth = 3; g.strokeRect(490, 120, 220, 400);
    txt('ALDH2', 600, 230, 34, '#f2e6c8');
    note(600, 380, 170, '#ff9ec0', -0.05, '', 1); txt('開いて読む', 600, 398, 34, '#3a2a1e', 1, 'center', HAND, 600);
    // Jin's index finger comes in from the left
    const fx = L(80, 480, reach), fy = L(520, 410, reach);
    g.fillStyle = JIN.skin; g.save(); g.translate(fx, fy); g.rotate(-0.35); rr(-160, -16, 170, 32, 16); g.fill(); g.fillStyle = JIN.top; rr(-320, -40, 180, 80, 20); g.fill(); g.restore();
  });
  void t;
}

/** Mechi, and the little ring-bound supplement in the corner of the shelf */
function supplement(t: number, u: number) {
  g.drawImage(softBg('notes', 600, 400, 1.6, 'rgba(10,6,10,.45)'), 0, 0); glow(900, 300, 600, 'rgba(255,190,110,.5)', 1);
  const hh = handheld(t, 2, 94);
  bust(MECHI, 420 + hh[0], 330 + hh[1], 320, { yaw: 0.35, gazeX: 0.6, gazeY: 0.3, mouth: talk(t, c[4], e[4]), blink: blinkAt(t, 8), smile: 0.45 }, t, 1);
  const pop = span(u, 2.5, 4, ease.back);
  g.save(); g.translate(960, 330); g.scale(pop, pop);
  g.fillStyle = '#c9a050'; g.beginPath(); g.arc(0, 0, 90, 0, 7); g.fill(); g.fillStyle = '#2a1a12'; g.beginPath(); g.arc(0, 0, 58, 0, 7); g.fill();
  for (let i = 0; i < 37; i++) { const a = (i / 37) * Math.PI * 2; g.strokeStyle = ['#e2566f', '#3f86d1', '#3a9b69', '#e6b23a'][i % 4]; g.lineWidth = 6; g.beginPath(); g.moveTo(Math.cos(a) * 62, Math.sin(a) * 62); g.lineTo(Math.cos(a) * 86, Math.sin(a) * 86); g.stroke(); }
  g.restore();
  glow(960, 330, 200, 'rgba(255,214,120,.6)', pop * (0.5 + 0.2 * Math.sin(t * 2.5)));
  txt('別冊：ミトコンドリアDNA', 960, 480, 28, '#ffe8c0', span(u, 4, 5));
}

/** mtDNA: 37 genes; 10³–10⁴ copies per cell; from the mother only */
function mito(t: number, u: number) {
  g.drawImage(tableTop('gen-notes'), 0, 0); lampPool(640, 300, 760, 0.85);
  const hh = handheld(t, 1, 95);
  g.save(); g.translate(hh[0], hh[1]);
  // the ring with 37 genes
  const a1 = span(u, 0.3, 1.5);
  g.save(); g.translate(220, 250); g.rotate(t * 0.1); g.globalAlpha = a1;
  for (let i = 0; i < 37; i++) { const a = (i / 37) * Math.PI * 2; g.strokeStyle = ['#e2566f', '#3f86d1', '#3a9b69', '#e6b23a'][i % 4]; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 100, a, a + (Math.PI * 2) / 37 - 0.03); g.stroke(); }
  g.restore(); g.globalAlpha = 1;
  txt('37の遺伝子', 220, 410, 28, '#ffe8c0', span(u, 1, 2));
  // a cell full of small rings
  const a2 = span(u, 3.5, 4.5);
  if (a2 > 0) {
    g.globalAlpha = a2; g.fillStyle = 'rgba(242,198,207,.35)'; g.beginPath(); g.ellipse(640, 250, 170, 130, 0, 0, 7); g.fill(); g.strokeStyle = '#f2c6cf'; g.lineWidth = 3; g.stroke();
    for (let i = 0; i < 60; i++) { const r2 = Math.sqrt(((i * 37) % 60) / 60), a = i * 2.4; g.strokeStyle = '#e6b23a'; g.lineWidth = 2; g.beginPath(); g.arc(640 + Math.cos(a) * r2 * 150, 250 + Math.sin(a) * r2 * 110, 7, 0, 7); g.stroke(); }
    g.globalAlpha = 1;
  }
  txt('1細胞に 1,000〜10,000コピー', 640, 430, 26, '#ffe8c0', span(u, 4.5, 5.5));
  // mother → children
  const a3 = span(u, 8, 9);
  if (a3 > 0) {
    g.globalAlpha = a3;
    g.fillStyle = '#6a8ac0'; g.fillRect(990, 150, 50, 50); g.fillStyle = '#e07a9a'; g.beginPath(); g.arc(1120, 175, 26, 0, 7); g.fill();
    g.strokeStyle = '#f2e6c8'; g.lineWidth = 3; g.beginPath(); g.moveTo(1040, 175); g.lineTo(1094, 175); g.moveTo(1067, 175); g.lineTo(1067, 240); g.moveTo(1000, 240); g.lineTo(1134, 240); [1000, 1067, 1134].forEach((x) => { g.moveTo(x, 240); g.lineTo(x, 270); }); g.stroke();
    [1000, 1067, 1134].forEach((x, i) => { g.fillStyle = '#e07a9a'; if (i === 1) { g.fillStyle = '#6a8ac0'; g.fillRect(x - 22, 270, 44, 44); } else { g.beginPath(); g.arc(x, 292, 22, 0, 7); g.fill(); } g.strokeStyle = '#e6b23a'; g.lineWidth = 3; g.beginPath(); g.arc(x, 292, 9, 0, 7); g.stroke(); });
    g.strokeStyle = '#e6b23a'; g.beginPath(); g.arc(1120, 175, 9, 0, 7); g.stroke();
    g.globalAlpha = 1;
  }
  txt('母親からだけ受け継がれる', 1067, 410, 26, '#ffd36b', span(u, 9, 10));
  g.restore();
}

/** Jin, holding the little supplement in his palm */
function palm(t: number, u: number) {
  g.drawImage(softBg('notes', 600, 400, 1.6, 'rgba(10,6,10,.45)'), 0, 0); glow(980, 300, 600, 'rgba(255,190,110,.5)', 1);
  const hh = handheld(t, 2, 96);
  bust(JIN, 520 + hh[0], 320 + hh[1], 320, { yaw: 0.3, gazeX: 0.5, gazeY: 0.8, mouth: talk(t, c[6], e[6]), blink: blinkAt(t, 1), smile: 0.3, tilt: 0.06 }, t, 1);
  g.fillStyle = JIN.skin; g.beginPath(); g.ellipse(880, 600, 140, 60, -0.1, 0, 7); g.fill();
  g.strokeStyle = '#c9a050'; g.lineWidth = 14; g.beginPath(); g.arc(880, 560, 50, 0, 7); g.stroke();
  glow(880, 560, 120, 'rgba(255,214,120,.6)', 0.6);
  void u;
}

/** dawn: the copy is finished; cold window light grows across the desk */
function finished(u: number) {
  const dawn = span(u, 0, 7, ease.inOut);
  g.drawImage(tableTop('gen-notes'), 0, 0);
  lampPool(700, 300, 760, L(0.9, 0.4, dawn));
  shaft(-100, -100, 300, 760, 720, 700, `rgba(200,220,255,${0.25 * dawn})`, 1);
  shot({ x: 640, y: 340, z: L(1.12, 1, span(u, 0, 7, ease.inOut)) }, 1, () => {
    sheet(640, 300, 600, 420, -0.02, (w, h) => {
      txt('閲覧票の写し', 0, -h / 2 + 60, 30, '#2a2320');
      txt('ALDH2（二日酔いの番人）', 0, -h / 2 + 106, 24, '#5a4a40', 1, 'center', HAND, 600);
      g.fillStyle = 'rgba(40,35,30,.5)'; for (let i = 0; i < 6; i++) g.fillRect(-w / 2 + 60, -40 + i * 30, w - 120 - (i % 3) * 60, 4);
      txt('487：AAA（原本どおり）', 0, h / 2 - 50, 22, '#7a3a2a', 1, 'center', HAND, 600);
    }, 'gen-final');
    page(1040, 360, 90, 0.2, 1);
    g.save(); g.translate(300, 470); g.rotate(-0.4); g.fillStyle = '#2a1e18'; rr(-5, -150, 10, 130, 4); g.fill(); g.restore();
  });
  wash('#dfe8ff', dawn * 0.08, 'screen');
}

export function notes(t: number, dd: number) {
  if (t < c[1] - 0.2) meeting(t);
  else if (t < c[2] - 0.2) closed(t, t - (c[1] - 0.2));
  else if (t < c[3] - 0.2) opened(t, t - (c[2] - 0.2));
  else if (t < c[4] - 0.2) openNote(t, t - (c[3] - 0.2));
  else if (t < c[5] - 0.2) supplement(t, t - (c[4] - 0.2));
  else if (t < c[6] - 0.2) mito(t, t - (c[5] - 0.2));
  else if (t < c[7] - 0.2) palm(t, t - (c[6] - 0.2));
  else finished(t - (c[7] - 0.2));
  [c[1], c[2], c[3], c[4], c[5], c[6], c[7]].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.55));
  wash('#050405', 1 - span(t, 0, 0.6));
  wash('#050405', span(t, d - 1, d));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  grain(t, 0.06);
  void dd; void H;
}
