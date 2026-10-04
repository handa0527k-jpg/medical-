/**
 * Scene 5「写しを整える」: the scriptorium by day; Spra spreads Pol's long copy (pre-mRNA: exons pink,
 * introns beige) → "a cover, a tail, and the pages to skip" → the cap on the 5' end; insert ppp → Gppp → m⁷Gppp
 * (slide 47) → insert: intron GU…AG, branch-site A (50) → insert: U1, U2AF/U2, U4/U5/U6, lariat, exons joined
 * (51, 52) → insert: cleavage after AAUAAA, poly(A) up to 250 A, protection (47) → Jin → Spra: alternative
 * splicing (49, 71); "to the gate" — Jin leaves right with the finished copy.
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { tableTop } from '../../../genetics-basics/story/sets';
import { JIN, SPRA } from '../cast';
import { COL, GOTHIC, arrowP, baseTile, blinkAt, blob, bust, cues, endTag, insert, plate, ribbon, scriptorium, sun, talk, txt } from '../sets';

const { c, e, d } = cues('edit');
type Part = [number, number, 'ex' | 'in'];
const PRE: Part[] = [[0, 0.22, 'ex'], [0.22, 0.42, 'in'], [0.42, 0.6, 'ex'], [0.6, 0.8, 'in'], [0.8, 1, 'ex']];

function scissors(x: number, y: number, s: number, open: number, rot: number) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  [-1, 1].forEach((k) => { g.save(); g.rotate(k * open * 0.35); g.fillStyle = '#c9ced6'; g.beginPath(); g.moveTo(0, 0); g.lineTo(90, k * 6); g.lineTo(0, k * 10); g.fill(); g.strokeStyle = '#b8892c'; g.lineWidth = 6; g.beginPath(); g.ellipse(-30, k * 18, 20, 12, 0, 0, 7); g.stroke(); g.restore(); });
  g.fillStyle = '#5a4a3a'; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill();
  g.restore();
}

/** wide: Spra at the work table with the long copy, Jin enters / leaves */
function room(t: number, o: { jx: number; walking: boolean; mouthS?: number; cut?: number; done?: number; cam?: [number, number, number]; carry?: boolean }) {
  const [cx, cy, cz] = o.cam ?? [640, 380, 1];
  shot({ x: cx, y: cy, z: cz }, 1, () => {
    g.drawImage(scriptorium(), 0, 0);
    // table
    g.fillStyle = '#8a6440'; g.fillRect(380, 560, 18, 120); g.fillRect(1100, 560, 18, 120); g.fillStyle = '#b08458'; rr(340, 540, 820, 26, 6); g.fill();
    if (!o.carry) {
      const dn = o.done ?? 0;
      if (dn < 1) ribbon([[420, 534], [1080, 534]], 20, { parts: PRE, alpha: 1 - dn });
      if (dn > 0) ribbon([[460, 534], [900, 534]], 20, { parts: [[0, 0.36, 'ex'], [0.36, 0.66, 'ex'], [0.66, 1, 'ex']], cap: dn, tail: dn, alpha: dn });
    }
    drawFigure(SPRA, { x: 1000, y: 690, s: 450, dir: -1, t, yaw: -0.5, light: -1, blink: blinkAt(t, 3), mouth: o.mouthS ?? 0, gazeX: -0.6, gazeY: 0.4, smile: 0.3,
      armN: { at: [L(860, 760, Math.sin((o.cut ?? 0) * 4) * 0.5 + 0.5), 520], grip: 0.9 }, holdN: (hx, hy) => scissors(hx - 10, hy - 6, 0.6, Math.abs(Math.sin((o.cut ?? 0) * 9)), Math.PI + 0.4), armF: { hand: [0.2, 1.3], grip: 0.5 } });
    drawFigure(JIN, { x: o.jx, y: 700, s: 440, dir: 1, t, yaw: o.walking ? 0.75 : 0.5, light: -1, blink: blinkAt(t, 1), gazeX: 0.7, gazeY: 0.25, smile: 0.3,
      walk: o.walking ? { p: o.jx / 48, amt: 1 } : undefined, armN: o.carry ? { at: [o.jx + 60, 520], grip: 1 } : { hand: [0.3, 1.2], grip: 1 }, holdN: o.carry ? (hx, hy) => ribbon([[hx - 10, hy], [hx + 160, hy + 6]], 14, { parts: [[0, 0.36, 'ex'], [0.36, 0.66, 'ex'], [0.66, 1, 'ex']], cap: 1, tail: 1 }) : undefined, armF: { hand: [0.25, 1.25], grip: 1 } });
    sun(t, 0.7);
  });
}

/** close on the table: the cap goes on the 5' end; inset ppp → Gppp → m⁷Gppp */
function cap(t: number, u: number) {
  shot({ x: 640, y: 360, z: 1.02 }, 1, () => {
    g.drawImage(tableTop('tx-table3'), 0, 0); wash('#fff0d8', 0.35);
    ribbon([[140, 260], [1180, 260]], 70, { parts: PRE, cap: span(u, 3, 4.5, ease.back) });
    endTag("5'", 96, 260, '#c2185b'); endTag("3'", 1224, 260, '#c2185b');
    [['エクソン', 0.11], ['イントロン', 0.32], ['エクソン', 0.51], ['イントロン', 0.7], ['エクソン', 0.9]].forEach(([n, k], i) => plate(n as string, 140 + 1040 * (k as number), 336, 18, '#ffffff', i % 2 ? '#7a6a58' : '#c2185b', 1));
    plate('mRNA前駆体（写したばかり）', 640, 180, 22, '#ffffff', '#c2185b', span(u, 0.4, 1.2));
  });
  // inset: the real chemistry
  const a = span(u, 6, 7);
  if (a > 0) {
    g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(242,247,252,.97)'; rr(140, 380, 1000, 200, 18); g.fill(); g.restore();
    plate('実際の細胞では', 160, 412, 16, '#ffffff', '#1f3a5f', a, 'left');
    const st = [span(u, 7, 8), span(u, 9, 10), span(u, 11, 12)];
    [['5\' ppp―――', 'mRNA前駆体の5\'末端'], ['G ppp―――', '5\'末端へGの付加'], ['m⁷G ppp―――', 'Gの7位の窒素がメチル化']].forEach(([f, n], i) => {
      const x = 300 + i * 340; txt(f, x, 490, 30, '#1f2a3a', a * st[i], 'center', GOTHIC, 800); txt(n, x, 534, 16, '#5a6b80', a * st[i], 'center', GOTHIC, 700);
      if (i < 2) arrowP(x + 110, 480, x + 220, 480, '#c2185b', a * st[i + 1], 4);
    });
    txt('5\'キャップ（スライド47）', 1100, 412, 16, '#c2185b', a, 'right', GOTHIC, 800);
  }
  void t;
}

/** insert: the intron's ends, GU … A … AG */
function rule(t: number, u: number) {
  insert('イントロンはGUで始まり、AGで終わる（GT-AGルール）', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const y = 330;
    g.fillStyle = '#f0609a'; rr(100, y - 26, 260, 52, 8); g.fill(); g.fillStyle = '#d9c9b8'; rr(360, y - 26, 560, 52, 4); g.fill(); g.fillStyle = '#f0609a'; rr(920, y - 26, 260, 52, 8); g.fill();
    txt('エクソン1', 230, y + 8, 22, '#ffffff', 1, 'center', GOTHIC, 800); txt('エクソン2', 1050, y + 8, 22, '#ffffff', 1, 'center', GOTHIC, 800); txt('イントロン', 640, y + 8, 22, '#5a4a3a', 1, 'center', GOTHIC, 800);
    const a1 = span(u, 1.5, 2.5), a2 = span(u, 3, 4), a3 = span(u, 4.5, 5.5);
    baseTile('G', 388, y - 74, 40, a1); baseTile('U', 432, y - 74, 40, a1);
    baseTile('A', 760, y - 74, 40, a3); baseTile('A', 848, y - 74, 40, a2); baseTile('G', 892, y - 74, 40, a2);
    plate("5'スプライス部位", 410, y + 80, 18, '#ffffff', '#c2185b', a1); plate("3'スプライス部位", 870, y + 80, 18, '#ffffff', '#c2185b', a2); plate('ブランチ部位のA', 760, y - 130, 18, '#ffffff', '#7d5aa8', a3);
    txt("DNAではGT…AG（遺伝子の非鋳型鎖）、RNAではGU…AG（スライド50）", W / 2, 560, 20, '#1f2a3a', span(u, 3.5, 4.5), 'center', GOTHIC, 700);
  }, 'スライド50');
  void t;
}

/** insert: the spliceosome steps and the lariat */
function spliceosome(t: number, u: number, len: number) {
  insert('スプライセオソームがイントロンを投げ縄の形で切り出す', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const y = 420;
    const s1 = span(u, 0.5, 1.5), s2 = span(u, 2, 3.5), s3 = span(u, 4.5, 6), loop = span(u, 7, 9.5, ease.inOut), out = span(u, 10, 12, ease.inOut), join = span(u, 10.5, 12.5, ease.inOut);
    // exons slide together after the intron leaves
    const e1x1 = 330, e2x0 = L(950, 334, join);
    g.fillStyle = '#f0609a'; rr(100, y - 22, 230, 44, 8); g.fill(); rr(e2x0, y - 22, 230, 44, 8); g.fill();
    txt('エクソン1', 215, y + 7, 18, '#ffffff', 1, 'center', GOTHIC, 800); txt('エクソン2', e2x0 + 115, y + 7, 18, '#ffffff', 1, 'center', GOTHIC, 800);
    // the intron: straight → loop (lariat) → floats away
    g.save(); g.globalAlpha = 1 - out;
    g.strokeStyle = '#b8a48e'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath();
    if (loop < 0.05) { g.moveTo(e1x1, y); g.lineTo(950, y); }
    else { const cx = L(640, 640, loop), cy = L(y, y - 140, loop) - out * 120, r = L(300, 90, loop); g.moveTo(L(e1x1, cx - 30, loop), L(y, cy + r * 0.7, loop) - out * 0); g.arc(cx, cy, r * L(1, 1, 1), Math.PI * 0.7, Math.PI * 0.7 + Math.PI * 2 * L(0.2, 0.92, loop)); }
    g.stroke(); g.restore();
    // snRNPs
    blob(L(e1x1 + 20, 560, loop), L(y - 70, y - 210, loop) - out * 120, 40, 28, '#6aa36f', 'U1', s1 * (1 - span(u, 6.5, 7.5)), '#ffffff', 16);
    blob(760, y - 70 - loop * 120 - out * 120, 40, 28, '#e0b030', 'U2', s2 * (1 - out), '#3a2a10', 16);
    blob(860, y - 64, 30, 22, '#c9a040', 'U2AF', s2 * (1 - span(u, 4.5, 5.5)), '#3a2a10', 12);
    blob(640, y - 130 - loop * 80 - out * 120, 40, 28, '#e8b0d0', 'U4', s3 * (1 - span(u, 6.5, 7.5)), '#3a2a10', 16);
    blob(700, y - 190 - loop * 40 - out * 120, 40, 28, '#9ac8e8', 'U6', s3 * (1 - out), '#1f2a3a', 16);
    blob(L(940, 334, join), y + 70, 40, 28, '#c8a8e8', 'U5', s3 * (1 - span(u, 13, 14)), '#1f2a3a', 16);
    const steps = ['① U1 snRNPがイントロン5\'末端のGUに結合', '② U2AFがブランチ部位の下流に、U2 snRNPがブランチ部位に結合', '③ U5・U4・U6 snRNPが集まり、スプライシング開始', '④⑤ U1・U4が離れ、GのつながったAで投げ縄構造ができる', '⑤ U5がエクソンをつなぎとめ、エクソンどうしが結合する'];
    const at = [0.5, 2, 4.5, 7, 10.5];
    let k = 0; for (let i = 0; i < at.length; i++) if (u >= at[i]) k = i;
    plate(steps[k], W / 2, 604, 18, '#ffffff', '#1f3a5f', span(u, at[k], at[k] + 0.6));
    if (loop > 0.6 && out < 0.5) plate('投げ縄構造（ラリアット）', 640, 140, 18, '#ffffff', '#7a6a58', loop);
    void len;
  }, 'スライド51・52');
  void t;
}

/** insert: cleavage and poly(A); cap and tail protect the copy */
function polyA(t: number, u: number) {
  insert("3'側：切断とポリA付加", 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const y = 330, cut = span(u, 3, 4.5, ease.out), add = span(u, 5, 10, (x) => x), prot = span(u, 11, 13);
    g.strokeStyle = COL.rna; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(140, y); g.lineTo(760, y); g.stroke();
    g.globalAlpha = 1 - cut; g.beginPath(); g.moveTo(800, y + cut * 60); g.lineTo(1100, y + cut * 90); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = '#3f6aa8'; g.beginPath(); g.arc(130, y, 26, 0, 7); g.fill(); txt('m⁷G', 130, y + 6, 16, '#ffffff', 1, 'center', GOTHIC, 800);
    txt('AAUAAA', 640, y - 30, 22, '#1f2a3a', 1, 'center', GOTHIC, 800); txt('ポリアデニル化シグナル', 640, y - 60, 16, '#5a6b80', 1, 'center', GOTHIC, 700);
    txt('GUに富む配列', 960, y - 30, 18, '#5a6b80', 1 - cut, 'center', GOTHIC, 700);
    if (u > 2 && cut < 0.9) { g.strokeStyle = '#c0392b'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(780, y - 50); g.lineTo(780, y + 50); g.stroke(); g.setLineDash([]); }
    plate('エンドヌクレアーゼが2つのシグナルの間を切断', 780, y + 100, 16, '#ffffff', '#c0392b', span(u, 2, 3) * (1 - span(u, 5, 6)));
    const n = Math.round(add * 250);
    if (add > 0) { const w = 60 + add * 300; g.strokeStyle = '#e8a33a'; g.lineWidth = 12; g.beginPath(); g.moveTo(764, y); g.lineTo(764 + w, y); g.stroke(); txt('AAAAAAAA…', 780 + w / 2, y + 44, 18, '#a8701a', 1, 'center', GOTHIC, 800); plate(`ポリ(A)ポリメラーゼ：A ${n}個`, 780 + w / 2, y + 100, 16, '#3a2a10', '#ffe08a', 1); }
    txt("ポリ(A)末端：最大250個まで（20〜250個）（スライド47）", W / 2, 520, 18, '#1f2a3a', span(u, 9, 10), 'center', GOTHIC, 800);
    if (prot > 0) { [[180, y], [1120, y]].forEach(([x, yy], i) => { const bx = L(x + (i ? 60 : -60), x + (i ? -10 : 10), Math.sin(CL((u - 11) / 2) * Math.PI)); blob(bx, yy - 70, 46, 26, '#8a8f9a', 'エキソヌクレアーゼ', prot, '#ffffff', 12); }); plate('キャップとポリAが、mRNAをエキソヌクレアーゼから守る', W / 2, 604, 18, '#ffffff', '#1f3a5f', prot); }
  }, 'スライド47');
  void t;
}

/** Spra lays out two different joinings of the same copy: A (E1–E3–E4) and B (E1–E2–E4) */
function alternative(t: number, u: number) {
  shot({ x: 640, y: 360, z: 1.02 }, 1, () => {
    g.drawImage(tableTop('tx-table3'), 0, 0); wash('#fff0d8', 0.35);
    const ex = (n: string, x: number, y: number, col: string, a = 1) => { g.globalAlpha = a; g.fillStyle = col; rr(x, y - 22, 120, 44, 8); g.fill(); g.globalAlpha = 1; txt(n, x + 60, y + 7, 20, '#ffffff', a, 'center', GOTHIC, 800); };
    const cols: Record<string, string> = { E1: '#e05a5a', E2: '#3a9b69', E3: '#c9a040', E4: '#3f6aa8' };
    // the precursor on top
    ['E1', 'E2', 'E3', 'E4'].forEach((n, i) => ex(n, 200 + i * 230, 170, cols[n]));
    g.fillStyle = '#d9c9b8'; [0, 1, 2].forEach((i) => { g.fillRect(320 + i * 230, 162, 110, 16); });
    plate('mRNA前駆体', 120, 120, 18, '#ffffff', '#c2185b', 1, 'left');
    const a1 = span(u, 1, 2.5), a2 = span(u, 4, 5.5);
    ['E1', 'E3', 'E4'].forEach((n, i) => ex(n, 300 + i * 124, 330, cols[n], a1)); plate('Aのつなぎ方', 140, 330, 18, '#ffffff', '#5a6b80', a1, 'left');
    ['E1', 'E2', 'E4'].forEach((n, i) => ex(n, 300 + i * 124, 450, cols[n], a2)); plate('Bのつなぎ方', 140, 450, 18, '#ffffff', '#5a6b80', a2, 'left');
    plate('選択的スプライシング：1種類のmRNA前駆体から複数のmRNA（スライド49・71）', W / 2, 560, 20, '#ffffff', '#c2185b', span(u, 6, 7));
  });
  void t;
}

export function edit(t: number, dd: number) {
  const hh = handheld(t, 1.2, 51);
  const cut = [c[1] - 0.2, c[2] - 0.2, c[3] - 0.2, c[4] - 0.2, c[5] - 0.2, c[6] - 0.2, c[7] - 0.2, c[7] + 6];
  const enter = span(t, 0.3, 4.5, (x) => x * x * (3 - 2 * x));
  if (t < cut[0]) room(t, { jx: L(-100, 330, enter), walking: t > 0.3 && t < 4.5, cam: [640, 380, 1.02] });
  else if (t < cut[1]) {
    g.drawImage(scriptorium(), -560, -160, W * 1.55, H * 1.55); wash('#fff6e6', 0.2); sun(t, 0.5);
    bust(SPRA, 700 + hh[0], 330 + hh[1], 320, { yaw: -0.3, gazeX: -0.6, gazeY: 0.2, mouth: talk(t, c[1], e[1]), blink: blinkAt(t, 3), smile: 0.4, brow: 0.15 }, t, -1);
    scissors(1000, 560, 1.2, Math.abs(Math.sin(t * 3)) * 0.6, -0.6);
  } else if (t < cut[2]) cap(t, t - cut[1]);
  else if (t < cut[3]) rule(t, t - cut[2]);
  else if (t < cut[4]) spliceosome(t, t - cut[3], cut[4] - cut[3]);
  else if (t < cut[5]) polyA(t, t - cut[4]);
  else if (t < cut[6]) {
    g.drawImage(scriptorium(), -300, -160, W * 1.55, H * 1.55); wash('#fff6e6', 0.2); sun(t, 0.5);
    bust(JIN, 560 + hh[0], 340 + hh[1], 320, { yaw: 0.35, tilt: 0.1, gazeX: 0.6, gazeY: 0.5, mouth: talk(t, c[6], e[6]), blink: blinkAt(t, 1), brow: 0.25 }, t, -1);
  } else if (t < cut[7]) alternative(t, t - cut[6]);
  else { const u = t - cut[7], go = span(u, 1.5, d - cut[7] - 0.4, (x) => x * x * (3 - 2 * x)); room(t, { jx: L(330, 1420, go), walking: go > 0 && go < 1, mouthS: talk(t, c[7], e[7]), done: 1, carry: go > 0, cut: 0, cam: [640, 380, 1.02] }); }
  cut.forEach((x) => wash('#0a0806', CL(1 - Math.abs(t - x) / 0.22) * 0.35));
  wash('#0a0806', 1 - span(t, 0, 0.6));
  wash('#0a0806', span(t, d - 0.6, d));
  grain(t, 0.03);
  void dd;
}
