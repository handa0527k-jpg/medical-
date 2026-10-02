/**
 * Scene 2「かすれた一文字」: through Deo's loupe — four letters; nucleotide = base + sugar + phosphate;
 * purines/pyrimidines, U in RNA, ribose vs deoxyribose → Jin notices the torn edge → two antiparallel
 * strands, A=T / G≡C → the partner fragment shows G, so the smudge must be C (Jin restores it)
 * → phosphodiester backbone and the helix → "take it back; the spool keeper knows where" (→ pack).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, glow, grade, grain, handheld, noise, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { DEO, JIN } from '../cast';
import { HAND, STRAND, SMUDGE, bust, cues, deskBg, deskDeo, deskJin, deskSet, inkArrow, lens, paper, softBg, txt, blinkAt, talk } from '../sets';

const { c, e, d } = cues('letters');
const PARTNER: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const COL: Record<string, string> = { A: '#c0392b', T: '#2e6db0', G: '#2e8b57', C: '#c9902a', U: '#7d4bb0' };

/** the paper under the loupe: the strand, then diagrams drawn in ink as they are explained */
function underLens(t: number, mag: number) {
  const pp = paper(1280, 720, 'gen-macro');
  g.drawImage(pp, 0, 0, W, H);
  g.save(); g.translate(640, 330); g.scale(mag, mag); g.translate(-640, -330);
  const focus = span(t, 0.6, 3.2, ease.out);
  // the strand across the top
  [...STRAND].forEach((ch, i) => {
    const x = 640 - 6.5 * 64 + i * 64, y = 150;
    const lit = span(t, 2 + (i % 4) * 1.6, 3 + (i % 4) * 1.6) * (1 - span(t, 11, 12));
    if (i === SMUDGE) { g.fillStyle = 'rgba(70,55,50,.35)'; g.beginPath(); g.ellipse(x, y - 18, 26, 34, 0.3, 0, 7); g.fill(); return; }
    txt(ch, x, y, 58, lit > 0 ? COL[ch] : '#2a2320', 0.35 + 0.65 * focus);
  });
  // L1: one nucleotide = phosphate + sugar (1'..5') + base
  const n1 = span(t, c[1] + 0.5, c[1] + 3);
  if (n1 > 0 && t < c[2] + 0.5) {
    const a = n1 * (1 - span(t, c[2] - 0.2, c[2] + 0.4));
    g.save(); g.globalAlpha = a;
    const px = 440, py = 360, sx = 600, sy = 380, bx = 800, by = 340;
    const pFade = 1 - 0.75 * span(t, c[1] + 11, c[1] + 12);
    g.globalAlpha = a * pFade; g.fillStyle = '#e0b040'; g.beginPath(); g.arc(px, py, 44, 0, 7); g.fill(); txt('P', px, py + 14, 40, '#3a2a10'); g.globalAlpha = a;
    inkArrow(px + 46, py + 6, sx - 70, sy - 4, '#5a4a40', span(t, c[1] + 1.5, c[1] + 2.5), 3);
    g.fillStyle = '#a8d8b8'; g.beginPath(); for (let i = 0; i < 5; i++) { const an = (i / 5) * Math.PI * 2 - Math.PI / 2; g.lineTo(sx + Math.cos(an) * 64, sy + Math.sin(an) * 64); } g.fill(); g.strokeStyle = '#2e6b48'; g.lineWidth = 3; g.stroke();
    ["1'", "2'", "3'", "4'", "5'"].forEach((k, i) => { const an = [0.15, 0.75, 1.3, 2.2, 3.1][i]; txt(k, sx + Math.cos(an) * 84, sy + Math.sin(an) * 84 + 8, 22, '#2e6b48', 1, 'center', HAND, 600); });
    inkArrow(sx + 66, sy - 12, bx - 70, by + 4, '#5a4a40', span(t, c[1] + 2, c[1] + 3), 3);
    g.fillStyle = '#f2c6cf'; rr(bx - 60, by - 50, 120, 100, 12); g.fill(); txt('A', bx, by + 18, 54, COL.A);
    txt('リン酸 ＝ 綴じ糸', px, py - 66, 26, '#5a4a40', span(t, c[1] + 6, c[1] + 7), 'center', HAND, 600);
    txt('五炭糖 ＝ 紙', sx, sy + 112, 26, '#5a4a40', span(t, c[1] + 4.5, c[1] + 5.5), 'center', HAND, 600);
    txt('塩基 ＝ 文字', bx, by - 66, 26, '#5a4a40', span(t, c[1] + 3, c[1] + 4), 'center', HAND, 600);
    txt('ヌクレオチド', 620, 556, 34, '#2a2320', span(t, c[1] + 8, c[1] + 9) * pFade);
    txt('リン酸がなければ ヌクレオシド', 620, 556, 30, '#8a3a2a', span(t, c[1] + 11.5, c[1] + 12.5));
    g.restore();
  }
  // L2: purines (two rings) and pyrimidines (one ring); U in RNA; 2'-OH vs 2'-H
  const n2 = span(t, c[2] + 0.4, c[2] + 1.6) * (1 - span(t, c[3] - 0.6, c[3]));
  if (n2 > 0) {
    const r2 = span(t, c[2] + 8, c[2] + 9.5);
    g.save(); g.globalAlpha = n2 * (1 - r2);
    const ring = (x: number, y: number, two: boolean, ch: string) => { g.strokeStyle = COL[ch]; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 6; i++) { const an = (i / 6) * Math.PI * 2 + Math.PI / 6; g.lineTo(x + Math.cos(an) * 34, y + Math.sin(an) * 34); } g.closePath(); g.stroke(); if (two) { g.beginPath(); g.moveTo(x + 29, y - 17); g.lineTo(x + 66, y - 26); g.lineTo(x + 78, y + 8); g.lineTo(x + 52, y + 32); g.lineTo(x + 29, y + 17); g.stroke(); } txt(ch, x + (two ? 20 : 0), y + 90, 40, COL[ch]); };
    txt('プリン（環が2つ）', 430, 270, 30, '#2a2320'); ring(370, 350, true, 'A'); ring(510, 350, true, 'G');
    txt('ピリミジン（環が1つ）', 850, 270, 30, '#2a2320'); ring(760, 350, false, 'C'); ring(860, 350, false, 'T');
    const u = span(t, c[2] + 4.5, c[2] + 5.5); if (u > 0) { g.globalAlpha = n2 * u * (1 - r2); ring(960, 350, false, 'U'); txt('RNAでは T → U', 900, 500, 26, COL.U, 1, 'center', HAND, 600); g.globalAlpha = n2 * (1 - r2); }
    if (r2 > 0) { g.globalAlpha = n2 * r2; g.fillStyle = 'rgba(250,244,230,.92)'; rr(330, 230, 640, 320, 16); g.fill();
      [[490, 'リボース（RNA）', '2′ に OH'], [810, 'デオキシリボース（DNA）', '2′ は H']].forEach(([x, n, k], i) => { const X = x as number; g.fillStyle = '#a8d8b8'; g.beginPath(); for (let j = 0; j < 5; j++) { const an = (j / 5) * Math.PI * 2 - Math.PI / 2; g.lineTo(X + Math.cos(an) * 60, 380 + Math.sin(an) * 60); } g.fill(); txt(k as string, X - 10, 470, 30, i ? '#2e6db0' : '#7d4bb0'); txt(n as string, X, 290, 28, '#2a2320'); const an2 = 0.75; g.fillStyle = i ? '#2e6db0' : '#7d4bb0'; g.beginPath(); g.arc(X + Math.cos(an2) * 60, 380 + Math.sin(an2) * 60, 10, 0, 7); g.fill(); }); }
    g.restore();
  }
  g.restore();
}

/** the two strands as a ladder, antiparallel, with hydrogen bonds (2 for A=T, 3 for G≡C) */
function ladder(cx: number, cy: number, n: number, gap: number, a: number, restoreK = 0, partialPartner = false, center?: number) {
  const seq = STRAND.slice(0, n), x0 = center != null ? cx - center * gap : cx - (n - 1) * gap / 2;
  g.save(); g.globalAlpha = a;
  g.strokeStyle = '#d14d7c'; g.lineWidth = 8; g.beginPath(); g.moveTo(x0 - 40, cy - 70); g.lineTo(x0 + (n - 1) * gap + 40, cy - 70); g.stroke();
  inkArrow(x0 - 30, cy - 104, x0 + 120, cy - 104, '#d14d7c', 1, 3); txt("5′", x0 - 60, cy - 62, 24, '#d14d7c', 1, 'center', HAND, 600); txt("3′", x0 + (n - 1) * gap + 62, cy - 62, 24, '#d14d7c', 1, 'center', HAND, 600);
  [...seq].forEach((ch, i) => {
    const x = x0 + i * gap, smudged = i === SMUDGE && restoreK < 1, p = PARTNER[ch];
    const showPartner = !partialPartner || Math.abs(i - SMUDGE) <= 1;
    if (smudged) { g.fillStyle = 'rgba(70,55,50,.35)'; g.beginPath(); g.ellipse(x, cy - 30, 20, 26, 0.3, 0, 7); g.fill(); }
    if (!smudged || restoreK > 0) { g.save(); g.globalAlpha *= i === SMUDGE ? restoreK : 1; txt(ch, x, cy - 14, 40, COL[ch]); g.restore(); }
    if (!showPartner) return;
    txt(p, x, cy + 74, 40, COL[p], partialPartner ? 0.85 : 1);
    const nb = ch === 'G' || ch === 'C' ? 3 : 2;
    if (!smudged || restoreK > 0.6) { g.strokeStyle = 'rgba(60,50,45,.7)'; g.lineWidth = 2.5; g.setLineDash([4, 5]); for (let k = 0; k < nb; k++) { const xx = x - (nb - 1) * 6 + k * 12; g.beginPath(); g.moveTo(xx, cy + 4); g.lineTo(xx, cy + 36); g.stroke(); } g.setLineDash([]); }
  });
  if (!partialPartner) { g.strokeStyle = '#2e6db0'; g.lineWidth = 8; g.beginPath(); g.moveTo(x0 - 40, cy + 100); g.lineTo(x0 + (n - 1) * gap + 40, cy + 100); g.stroke(); inkArrow(x0 + 120, cy + 134, x0 - 30, cy + 134, '#2e6db0', 1, 3); txt("3′", x0 - 60, cy + 108, 24, '#2e6db0', 1, 'center', HAND, 600); txt("5′", x0 + (n - 1) * gap + 62, cy + 108, 24, '#2e6db0', 1, 'center', HAND, 600); }
  g.restore();
}

function lensShot(t: number, content: () => void, at: [number, number] = [640, 330], r = 540) {
  g.drawImage(deskBg(), -100, -60, W * 1.15, H * 1.15);
  glow(1000, 160, 700, 'rgba(255,190,110,.55)', 1);
  const hh = handheld(t, 3, 31);
  const cx = at[0] + hh[0], cy = at[1] + hh[1];
  g.drawImage(paper(1280, 720, 'gen-macro'), -200, -100, W * 1.4, H * 1.4); // the page, out of the lens, slightly darker
  g.fillStyle = 'rgba(20,12,8,.35)'; g.fillRect(0, 0, W, H);
  lens(cx, cy, r, content);
  // the loupe handle and Jin's fingers
  g.save(); g.translate(1110, 640); g.rotate(0.6);
  g.fillStyle = '#5a3a1c'; rr(0, -16, 220, 32, 10); g.fill(); g.fillStyle = 'rgba(255,220,170,.25)'; rr(0, -16, 220, 8, 6); g.fill();
  g.fillStyle = JIN.skin; g.beginPath(); g.ellipse(120, -26, 34, 20, 0.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(150, 24, 40, 22, -0.2, 0, 7); g.fill();
  g.restore();
}

export function letters(t: number) {
  const open = span(t, 0, 1.3, ease.out);
  if (t < c[3] - 0.2) lensShot(t, () => underLens(t, 1.0 + 0.05 * Math.sin(t * 0.3)));
  else if (t < c[4] - 0.2) {
    // Jin notices the torn edge
    g.drawImage(softBg('jin', 0, 900, 1.6, 'rgba(10,6,10,.45)'), 0, 0); glow(1100, 260, 600, 'rgba(255,190,110,.6)', 1);
    const hh = handheld(t, 2, 32);
    bust(JIN, 560 + hh[0], 320 + hh[1], 330, { yaw: 0.28, tilt: 0.16, gazeX: 0.3, gazeY: 0.9, mouth: talk(t, c[3], e[3]), blink: blinkAt(t, 1), brow: 0.6 }, t, 1);
    grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.9);
  } else if (t < c[5] - 0.2) {
    // Deo draws the two strands on a scrap of paper
    lensShot(t, () => { g.drawImage(paper(1280, 720, 'gen-macro'), 0, 0, W, H); ladder(640, 330, 7, 92, span(t, c[4] + 0.6, c[4] + 2.2), 1); });
  } else if (t < c[7] - 0.2) {
    // the torn edge: a fragment of the partner strand opposite the smudge → C
    const restore = span(t, c[6] + 1.2, c[6] + 3.2, ease.inOut);
    lensShot(t, () => {
      g.drawImage(paper(1280, 720, 'gen-macro'), 0, 0, W, H);
      ladder(640, 300, STRAND.length, 110, 1, restore, true, SMUDGE);
      // the torn edge: only a fragment of the partner strand survives around the smudge
      g.fillStyle = '#2a1a10'; g.beginPath(); g.moveTo(-10, 760);
      for (let x = -10; x <= W + 10; x += 16) { const near = CL(1 - (Math.abs(x - 640) - 120) / 60); g.lineTo(x, L(318, 420, near) + Math.sin(x * 0.07) * 7); }
      g.lineTo(W + 10, 760); g.closePath(); g.fill();
      const gx = 640, gy = 330;
      glow(gx, gy + 44, 80, 'rgba(120,220,160,.55)', span(t, c[5] + 3, c[5] + 4) * (1 - restore * 0.5));
      if (restore > 0) glow(gx, gy - 30, 110, 'rgba(255,214,120,.6)', restore * (1 - span(t, c[7] - 1.5, c[7] - 0.4)));
    });
  } else if (t < c[8] - 0.2) {
    // the backbone and the double helix (2 nm wide, one turn 3.4 nm)
    const u = t - c[7];
    lensShot(t, () => {
      g.drawImage(paper(1280, 720, 'gen-macro'), 0, 0, W, H);
      const tw = u * 0.9;
      for (let i = 0; i < 14; i++) {
        const x = 330 + i * 46, ph = i * 0.62 + tw;
        const y1 = 330 + Math.sin(ph) * 110, y2 = 330 - Math.sin(ph) * 110, front = Math.cos(ph) > 0;
        const ch = STRAND[i % STRAND.length];
        g.strokeStyle = COL[ch]; g.lineWidth = front ? 8 : 5; g.globalAlpha = front ? 1 : 0.55; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, (y1 + y2) / 2); g.stroke();
        g.strokeStyle = COL[PARTNER[ch]]; g.beginPath(); g.moveTo(x, (y1 + y2) / 2); g.lineTo(x, y2); g.stroke(); g.globalAlpha = 1;
      }
      for (let s2 = 0; s2 < 2; s2++) { g.strokeStyle = s2 ? '#2e6db0' : '#d14d7c'; g.lineWidth = 10; g.beginPath(); for (let x = 310; x <= 970; x += 6) { const ph = ((x - 330) / 46) * 0.62 + tw; g.lineTo(x, 330 + (s2 ? -1 : 1) * Math.sin(ph) * 110); } g.stroke(); }
      const lab = span(u, 7, 8.5);
      if (lab > 0) { g.globalAlpha = lab; g.strokeStyle = '#3a2a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(300, 210); g.lineTo(300, 450); g.stroke(); txt('2 nm', 270, 336, 28, '#3a2a1e', 1, 'right'); const per = (2 * Math.PI / 0.62) * 46; g.beginPath(); g.moveTo(340, 490); g.lineTo(340 + per, 490); g.stroke(); txt('1回転 3.4 nm', 340 + per / 2, 528, 28, '#3a2a1e'); g.globalAlpha = 1; }
      const pd = span(u, 1.2, 2.5) * (1 - span(u, 6.5, 7.2));
      if (pd > 0) { g.fillStyle = `rgba(250,244,230,${0.92 * pd})`; rr(380, 200, 520, 250, 16); g.fill(); g.globalAlpha = pd; txt("…糖の 3′ ― O ― P ― O ― 5′ 次の糖…", 640, 300, 30, '#2a2320'); txt('ホスホジエステル結合', 640, 352, 30, '#d14d7c'); inkArrow(450, 400, 830, 400, '#d14d7c', 1, 4); txt("5′ → 3′ の向きに伸びる", 640, 436, 24, '#5a4a40', 1, 'center', HAND, 600); g.globalAlpha = 1; }
    });
  } else {
    // back at the desk: Deo sends Jin to the deep stacks; the camera pans into the dark
    const pan = span(t, d - 3.2, d, ease.in);
    shot({ x: 640 - pan * 700, y: 360, z: 1 }, 1, () => {
      deskSet(t, () => drawFigure(DEO, deskDeo(t, talk(t, c[8], e[8]), { armN: { at: [L(960, 760, span(t, c[8] + 1.2, c[8] + 2.2, ease.antic)), L(486, 330, span(t, c[8] + 1.2, c[8] + 2.2, ease.antic))], grip: 0.1 }, gazeX: -0.9 })), () => drawFigure(JIN, deskJin(t, 0, { yaw: L(0.45, -0.3, span(t, c[8] + 2.4, c[8] + 3.2, ease.out)), gazeX: L(0.8, -0.8, span(t, c[8] + 2.2, c[8] + 2.6)) })));
      g.drawImage(softBg('dark', 900, 700, 1.5, 'rgba(6,4,6,.55)'), -W, 0);
    });
  }
  // open from black (after the iris of the previous scene) and dip between cuts
  wash('#050405', 1 - open);
  [c[3], c[4], c[5], c[7], c[8]].forEach((x) => wash('#050405', CL(1 - Math.abs(t - (x - 0.2)) / 0.25) * 0.55));
  grade('rgba(30,30,60,', 'rgba(255,180,110,', 0.8);
  grain(t, 0.06);
  void H; void noise;
}
