/**
 * Scene 7「正午の窓口」: 11:58, Jin passes the finished copy through the gate into the bright courtyard →
 * insert: mature mRNA leaves the nucleus through a pore and is used for protein synthesis (slide 46) →
 * noon; Deo: this clock runs on transcription → insert: BMAL1–CLOCK → Per/Cry ⊣ loop; mouse findings
 * (41, 42) → Deo: the small volume has its own copyist → insert: mitochondrial genome transcription (72) →
 * Jin, Deo → noon light in the hall, a new slip on the desk; end title and credits.
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { DEO, JIN, POL } from '../cast';
import { COL, GOTHIC, MINCHO, arrowP, bar, blinkAt, blob, bust, cues, gateWall, hall, insert, plate, polymerase, ribbon, slipBig, sun, talk, txt, wallClock } from '../sets';

const { c, e, d } = cues('noon');
const DONE: [number, number, 'ex' | 'in'][] = [[0, 0.36, 'ex'], [0.36, 0.66, 'ex'], [0.66, 1, 'ex']];

/** the gate: Jin feeds the copy through the ring (left → right); the clock above shows 11:58 → 12:00 */
function gate(t: number, o: { jx: number; feed: number; deo: number; mm: number; ring: number; mouthD?: number }) {
  shot({ x: 640, y: 360, z: 1.0 }, 1, () => {
    g.drawImage(gateWall(), 0, 0);
    wallClock(640, 90, 44, o.mm >= 60 ? 12 : 11, o.mm % 60);
    if (o.ring > 0) for (let k = 0; k < 3; k++) { const r = 54 + ((o.ring * 2 + k / 3) % 1) * 70; g.strokeStyle = `rgba(200,150,50,${(1 - ((o.ring * 2 + k / 3) % 1)) * 0.6})`; g.lineWidth = 3; g.beginPath(); g.arc(640, 90, r, 0, 7); g.stroke(); }
    // the copy goes into the ring and out into the courtyard
    if (o.feed > 0) { const x1 = L(o.jx + 120, 760, o.feed); ribbon([[o.jx + 60, 520], [Math.min(x1, 520), 470], [x1, 420]], 14, { parts: DONE, cap: 1, tail: 1, alpha: 1 - span(o.feed, 0.85, 1) }); }
    if (o.deo > 0) drawFigure(DEO, { x: L(1400, 1020, o.deo), y: 692, s: 470, dir: -1, t, yaw: -0.4, light: -1, blink: blinkAt(t, 4), mouth: o.mouthD ?? 0, walk: o.deo < 1 ? { p: o.deo * 12, amt: 1 } : undefined, gazeX: -0.6, gazeY: 0.0, smile: 0.4, armN: { hand: [0.2, 1.3], grip: 0.4 }, armF: { hand: [0.2, 1.3], grip: 0.4 } });
    drawFigure(JIN, { x: o.jx, y: 700, s: 440, dir: 1, t, yaw: 0.6, light: -1, blink: blinkAt(t, 1), gazeX: o.ring > 0 ? 0.2 : 0.8, gazeY: o.ring > 0 ? -0.6 : 0.1, smile: 0.4,
      walk: o.feed <= 0 && t < 4 ? { p: o.jx / 48, amt: 1 } : undefined, armN: o.feed < 0.6 ? { at: [o.jx + L(60, 130, o.feed), 520 - o.feed * 40], grip: 1 } : { hand: [0.3, 1.2], grip: 0.6 },
      holdN: o.feed <= 0 ? (hx, hy) => ribbon([[hx - 10, hy], [hx + 150, hy + 6]], 14, { parts: DONE, cap: 1, tail: 1 }) : undefined, armF: { hand: [0.25, 1.25], grip: 1 } });
  });
  plate('門 ＝ 核膜孔（たとえ）／ 中庭 ＝ 細胞質', W - 30, 52, 16, '#ffffff', '#1f3a5f', span(t, 3, 4) * (1 - span(t, c[1] - 1, c[1])), 'right');
}

function exportInsert(t: number, u: number) {
  insert('成熟mRNAは核から細胞質へ', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    // nuclear envelope (double line) with a pore
    g.strokeStyle = '#8a7ab0'; g.lineWidth = 6; g.beginPath(); g.arc(-200, 360, 760, -0.5, 0.5); g.stroke(); g.beginPath(); g.arc(-200, 360, 780, -0.5, 0.5); g.stroke();
    g.fillStyle = '#f2f7fc'; g.fillRect(540, 320, 60, 80); g.fillStyle = '#b8923f'; g.beginPath(); g.arc(570, 318, 12, 0, 7); g.arc(570, 402, 12, 0, 7); g.fill();
    txt('核', 300, 200, 28, '#5a4a7a', 1, 'center', GOTHIC, 800); txt('細胞質', 980, 200, 28, '#3a7a4a', 1, 'center', GOTHIC, 800); plate('核膜孔', 570, 450, 18, '#ffffff', '#8a6a2c', 1);
    const go = span(u, 1, 7, ease.inOut);
    const x0 = L(140, 640, go);
    ribbon([[x0, 360], [x0 + 340, 360]], 18, { parts: DONE, cap: 1, tail: 1 });
    const rib = span(u, 7.5, 9.5);
    [0, 1, 2].forEach((k) => { blob(x0 + 80 + k * 100, 330, 30, 20, '#d9a35a', '', rib); blob(x0 + 80 + k * 100, 312, 22, 14, '#e8bb72', '', rib); });
    plate('リボソームでタンパク質合成に使われる（スライド46）', 860, 470, 18, '#ffffff', '#3a7a4a', rib);
  }, 'スライド46');
  void t;
}

function clockInsert(t: number, u: number, k4: number) {
  insert('時計遺伝子：転写のフィードバックループ', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const y = 330;
    g.strokeStyle = COL.temp; g.lineWidth = 7; g.beginPath(); g.moveTo(140, y); g.lineTo(760, y); g.stroke();
    g.fillStyle = '#a8d8e8'; rr(220, y - 16, 110, 32, 6); g.fill(); txt("E/E'-box", 275, y + 7, 16, '#1f2a3a', 1, 'center', GOTHIC, 800);
    g.fillStyle = '#3a4a9a'; rr(470, y - 18, 200, 36, 6); g.fill(); txt('Per, Cry …', 570, y + 7, 16, '#ffffff', 1, 'center', GOTHIC, 800);
    arrowP(400, y - 50, 470, y - 50, '#1f2a3a', 1, 3);
    const on = span(u, 1, 2), pc = span(u, 4, 6), inh = span(u, 7.5, 9);
    blob(240, y - 50, 44, 24, '#b8e070', 'BMAL1', on, '#1f2a3a', 15); blob(320, y - 50, 44, 24, '#f0a8a0', 'CLOCK', on, '#1f2a3a', 15);
    arrowP(620, y + 40, 760, y + 120, '#1f2a3a', pc, 3);
    blob(790, y + 160, 40, 24, '#f5e070', 'Per', pc, '#1f2a3a', 15); blob(870, y + 160, 40, 24, '#e070c0', 'Cry', pc, '#ffffff', 15);
    bar(800, y + 120, 340, y - 80, '#c0392b', inh, 4);
    plate('① BMAL1–CLOCKがE-boxに結合 → Per・Cryの転写', W / 2, 560, 18, '#ffffff', '#3a8a4a', on * (1 - span(u, 7, 7.5)));
    plate('② 増えたPer・CryがBMAL1–CLOCKを抑え、自分の転写を止める → 約24時間のリズム（スライド41）', W / 2, 560, 17, '#ffffff', '#c0392b', span(u, 7.5, 8.3) * (1 - span(u, k4 - 0.5, k4)));
    // the mouse findings (slide 42)
    const m = span(u, k4, k4 + 1);
    if (m > 0) {
      g.save(); g.globalAlpha = m; g.fillStyle = 'rgba(255,255,255,.97)'; rr(840, 120, 380, 300, 16); g.fill(); g.restore();
      txt('時計遺伝子の異常マウス（スライド42）', 1030, 158, 18, '#1f2a3a', m, 'center', GOTHIC, 800);
      [['Clock異常', '高脂血症・高血糖'], ['Bmal1欠損', '高脂血症・耐糖能異常'], ['Per2欠損', '肥満'], ['Cry1/Cry2欠損', '食塩感受性高血圧']].forEach(([a, b], i) => { txt(a, 870, 210 + i * 50, 17, '#3a4a9a', m, 'left', GOTHIC, 800); txt(b, 1010, 210 + i * 50, 17, '#1f2a3a', m, 'left', GOTHIC, 700); });
      txt('※マウスで認められた所見', 1030, 404, 14, '#5a6b80', m, 'center', GOTHIC, 600);
    }
  }, 'スライド41・42');
  void t;
}

function mitoInsert(t: number, u: number) {
  insert('ミトコンドリアゲノムの転写', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const cx = 420, cy = 360, r = 170;
    g.strokeStyle = COL.nontemp; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.strokeStyle = COL.temp; g.beginPath(); g.arc(cx, cy, r - 14, 0, 7); g.stroke();
    txt('約16 kb・37遺伝子', cx, cy + 8, 22, '#1f2a3a', 1, 'center', GOTHIC, 800);
    const run = span(u, 3, 9, (x) => x);
    if (run > 0) { g.strokeStyle = COL.rna; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r + 26, -Math.PI / 2, -Math.PI / 2 + run * Math.PI * 1.96); g.stroke(); const a = -Math.PI / 2 + run * Math.PI * 1.96; polymerase(cx + Math.cos(a) * (r + 6), cy + Math.sin(a) * (r + 6), 40, 30, 0.9, '', -1); }
    plate('ミトコンドリア特異的RNAポリメラーゼ', 420, 130, 18, '#ffffff', COL.polEdge, span(u, 1, 2));
    // encoded in the nucleus
    blob(1060, 200, 90, 60, '#d8cce8', '核ゲノムにコード', span(u, 1.5, 2.5), '#3a2a5a', 16);
    arrowP(960, 210, 560, 150, '#7d5aa8', span(u, 2, 3), 3);
    // processed into pieces
    const cut = span(u, 10, 12, ease.out);
    if (cut > 0) [['mRNA', '#f0609a'], ['tRNA', '#d06a3a'], ['rRNA', '#7aa84a']].forEach(([n, col], i) => { const x = L(700, 760 + i * 150, cut), y = 420 + i * 0; g.globalAlpha = cut; g.fillStyle = col; rr(x, y - 16, 120, 32, 10); g.fill(); g.globalAlpha = 1; txt(n, x + 60, y + 7, 18, '#ffffff', cut, 'center', GOTHIC, 800); });
    plate('環状ゲノムの各鎖は全体が転写され、プロセッシングで切り分けられる（スライド72）', W / 2, 604, 17, '#ffffff', '#1f3a5f', span(u, 9, 10));
  }, 'スライド72');
  void t;
}

/** noon in the hall: Pol at the lectern, a new slip on the counter, end title */
function ending(t: number, u: number, len: number) {
  const crane = span(u, 0.5, len - 1, ease.inOut);
  shot({ x: 640, y: L(420, 360, crane), z: L(1.2, 1.0, crane) }, 1, () => {
    g.drawImage(hall(), 0, 0); wallClock(780, 92, 26, 12, 6);
    drawFigure(POL, { x: 1080, y: 688, s: 420, dir: -1, t, yaw: -0.85, light: -1, blink: blinkAt(t, 2), gazeX: -0.8, gazeY: 0.5, armN: { at: [1000, 440], grip: 0.4 }, armF: { hand: [0.2, 1.3], grip: 0.6 } });
    g.fillStyle = '#7a5134'; rr(380, 560, 300, 16, 4); g.fill(); g.fillStyle = '#5a3a22'; g.fillRect(400, 576, 14, 110); g.fillRect(646, 576, 14, 110);
    slipBig(520, 540, 120, -0.1, span(u, 1.5, 3));
    drawFigure(JIN, { x: 300, y: 700, s: 440, dir: 1, t, yaw: 0.5, light: -1, blink: blinkAt(t, 1), gazeX: 0.7, gazeY: 0.5, smile: 0.5, armN: { hand: [0.3, 1.2], grip: 1 }, armF: { hand: [0.25, 1.25], grip: 1 } });
    sun(t, 1.2, 1);
  });
  const ti = span(u, len - 4.6, len - 3.4);
  if (ti > 0) {
    g.save(); g.globalAlpha = ti * 0.85; g.fillStyle = '#fffaf0'; g.fillRect(0, 0, W, H); g.restore();
    txt('写字室の朝', W / 2, 250, 60, '#2a2320', ti, 'center', MINCHO);
    txt('遺伝医学「転写（機構と疾患）」 ・ 「設計図の図書館」 つづき', W / 2, 300, 20, '#6a5a48', ti, 'center', GOTHIC, 600);
    ['医学的内容：講義資料「転写（機構と疾患）」2026.09.28（各場面にスライド番号＝PDFのページ番号）', '音楽：Kevin MacLeod（incompetech.com）Licensed under Creative Commons: By Attribution 4.0', '効果音：自作の合成音 ／ 声：音声合成 ／ キャラクターと絵：オリジナル'].forEach((s, i) => txt(s, W / 2, 400 + i * 34, 16, '#4a4038', ti, 'center', GOTHIC, 600));
  }
}

export function noon(t: number, dd: number) {
  const hh = handheld(t, 1.2, 71);
  const cut = [c[1] - 0.2, c[2] - 0.2, c[3] - 0.2, c[5] - 0.2, c[6] - 0.2, c[7] - 0.2, c[8] - 0.2, c[9] - 0.2];
  if (t < cut[0]) { const k = span(t, 0.2, 3.8, (x) => x * x * (3 - 2 * x)); gate(t, { jx: L(-60, 360, k), feed: span(t, 4, cut[0] - 0.2, ease.inOut), deo: 0, mm: 58, ring: 0 }); }
  else if (t < cut[1]) exportInsert(t, t - cut[0]);
  else if (t < cut[2]) { const u = t - cut[1]; gate(t, { jx: 360, feed: 1, deo: span(u, 0, 2.4, ease.inOut), mm: u < 3 ? 58 + Math.floor(span(u, 2.4, 3) * 2) : 60, ring: u > 3 ? (u - 3) * 0.5 : 0, mouthD: talk(t, c[2], e[2]) }); }
  else if (t < cut[3]) clockInsert(t, t - cut[2], c[4] - cut[2]);
  else if (t < cut[4]) {
    g.drawImage(gateWall(), -600, -160, W * 1.55, H * 1.55); wash('#fff6e6', 0.2);
    bust(DEO, 700 + hh[0], 330 + hh[1], 320, { yaw: -0.3, gazeX: -0.6, gazeY: 0.15, mouth: talk(t, c[5], e[5]), blink: blinkAt(t, 4), smile: 0.35 }, t, -1);
    g.fillStyle = '#7a4a2c'; rr(1020, 520, 90, 120, 6); g.fill(); txt('別冊', 1065, 590, 22, '#f6eedb', 1, 'center', MINCHO);
  } else if (t < cut[5]) mitoInsert(t, t - cut[4]);
  else if (t < cut[6]) {
    g.drawImage(gateWall(), -300, -160, W * 1.55, H * 1.55); wash('#fff6e6', 0.25);
    bust(JIN, 560 + hh[0], 340 + hh[1], 320, { yaw: 0.4, gazeX: 0.6, gazeY: 0.0, mouth: talk(t, c[7], e[7]), blink: blinkAt(t, 1), smile: 0.5, brow: 0.1 }, t, -1);
  } else if (t < cut[7]) {
    g.drawImage(gateWall(), -600, -160, W * 1.55, H * 1.55); wash('#fff6e6', 0.25);
    bust(DEO, 700 + hh[0], 330 + hh[1], 320, { yaw: -0.3, gazeX: -0.6, gazeY: 0.1, mouth: talk(t, c[8], e[8]), blink: blinkAt(t, 4), smile: 0.65 }, t, -1);
  } else ending(t, t - cut[7], d - cut[7]);
  cut.forEach((x) => wash('#0a0806', CL(1 - Math.abs(t - x) / 0.22) * 0.35));
  wash('#0a0806', 1 - span(t, 0, 0.6));
  wash('#0a0806', span(t, d - 0.8, d));
  grain(t, 0.03);
  void dd;
}
