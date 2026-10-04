/**
 * Scene 3「分館の写字係」(bacteria): Jin enters the annex (left → right) → Sigma finds −35 and −10 on the
 * scroll → insert: holoenzyme (core + σ) at the promoter, DNA opens (slides 14, 15, 18) → Core writes, counting;
 * after ten letters Sigma hops off (anticipation, leap, landing) → insert: σ released, elongation (16, 19) →
 * the copy's end folds back; Core stops → insert: stem-loop, weak A–U, ρ (17, 20, 21) → the "写すな" tag on the
 * lactose book → insert: negative then positive regulation, lacZYA on one mRNA (24, 25) → Core copies three
 * pages in one go → Jin → Sigma runs in: the main hall needs more than him.
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, glow, grain, handheld, shaft, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure } from '../../../../../engine/story/rig';
import { tableTop } from '../../../genetics-basics/story/sets';
import { CORE, JIN, SIGMA } from '../cast';
import { COL, GOTHIC, HAND, annex, annexTable, arrowP, bar, baseTile, blinkAt, blob, bust, cues, endTag, insert, plate, polymerase, ribbon, talk, txt } from '../sets';
import { bubble } from '../mol';

const { c, e, d } = cues('annex');

function skylight(t: number, k = 1) {
  shaft(640, 0, 380, 640, H, 760, `rgba(255,252,236,${0.38 * k})`, 1);
  for (let i = 0; i < 30; i++) { const u = (i * 0.173 + t * 0.01 * (1 + (i % 3))) % 1; const x = 640 + Math.sin(i * 2.3 + t * 0.2) * L(150, 330, u), y = L(40, H, u); g.fillStyle = `rgba(255,255,240,${0.45 * k})`; g.beginPath(); g.arc(x, y, 1.5, 0, 7); g.fill(); }
}

/** wide: the annex, Core at the table, Sigma beside it, Jin walking in */
function wide(t: number, o: { jx: number; walking: boolean; sigmaX: number; sigmaHop?: number; coreWrite?: number; mouthS?: number; mouthC?: number; ribbonLen?: number; loop?: number; tag?: number; three?: number; cam?: [number, number, number] }) {
  const [cx, cy, cz] = o.cam ?? [640, 380, 1];
  shot({ x: cx, y: cy, z: cz }, 1, () => {
    g.drawImage(annex(), 0, 0);
    // the shelf book with the "写すな" tag (repressor) on the right shelf
    if ((o.tag ?? 0) > 0 || (o.three ?? 0) > 0) {
      g.fillStyle = '#c9a050'; rr(1040, 330, 50, 76, 4); g.fill(); txt('lac', 1065, 376, 18, '#3a2a10', 1, 'center', GOTHIC, 800);
      const tg = o.tag ?? 0; if (tg > 0) { g.save(); g.translate(1066, 404); g.rotate(Math.sin(t * 2) * 0.06); g.globalAlpha = tg; g.strokeStyle = '#7a1e1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 22); g.stroke(); g.fillStyle = '#c0392b'; rr(-40, 22, 80, 40, 6); g.fill(); g.restore(); txt('写すな', 1066, 56 + 404, 18, '#ffffff', tg, 'center', GOTHIC, 800); }
    }
    annexTable(700, 520, 520);
    // the scroll on the table: the copy ribbon grows to the right from Core's pen
    if ((o.ribbonLen ?? 0) > 0) {
      const x0 = 640, L0 = o.ribbonLen ?? 0, lp = o.loop ?? 0;
      const pts: [number, number][] = [[x0, 512], [x0 + L0, 512]];
      if (lp > 0) { const cxl = x0 + L0 + 20; for (let k = 0; k <= 16; k++) { const a = -Math.PI / 2 + (k / 16) * Math.PI * 2 * lp; pts.push([cxl + Math.cos(a) * 22, 490 + Math.sin(a) * 22]); } }
      ribbon(pts, 18);
    }
    drawFigure(CORE, { x: 720, y: 690, s: 400, dir: 1, t, yaw: 0.55, light: 0, blink: blinkAt(t, 5), mouth: o.mouthC ?? 0, gazeX: 0.6, gazeY: 0.55, noLegs: false,
      armN: { at: [L(650, 700, Math.sin((o.coreWrite ?? 0) * 40) * 0.5 + 0.5) + (o.ribbonLen ?? 0) * 0.15, 506], grip: 0.9 }, armF: { at: [610, 512], grip: 0.4 } });
    // Sigma: hop off the table edge (crouch → leap → land with a little squash)
    const hop = o.sigmaHop ?? 0;
    const crouch = Math.sin(CL(hop / 0.25) * Math.PI) * (hop < 0.25 ? 1 : 0), air = CL((hop - 0.25) / 0.5), land = hop > 0.75 ? Math.sin(CL((hop - 0.75) / 0.25) * Math.PI) : 0;
    const sx = L(o.sigmaX, o.sigmaX - 170, ease.inOut(air)), sy = 690 - Math.sin(air * Math.PI) * 120 + crouch * 10 + land * 8;
    drawFigure(SIGMA, { x: sx, y: sy, s: 300 * (1 - crouch * 0.05 - land * 0.04), dir: 1, t, yaw: hop > 0.2 ? 0.2 : 0.5, light: 0, blink: blinkAt(t, 6), mouth: o.mouthS ?? 0, gazeX: hop > 0.2 ? -0.2 : 0.7, gazeY: 0.3, smile: 0.6,
      armN: hop > 0 && hop < 0.9 ? { hand: [-0.6, 0.2], grip: 0.2 } : { hand: [0.4, 1.0], grip: 0.4 }, armF: hop > 0 && hop < 0.9 ? { hand: [0.6, 0.1], grip: 0.2 } : { hand: [0.25, 1.15], grip: 0.6 } });
    drawFigure(JIN, { x: o.jx, y: 700, s: 440, dir: 1, t, yaw: o.walking ? 0.75 : 0.5, light: 0, blink: blinkAt(t, 1), gazeX: 0.7, gazeY: 0.15, smile: 0.25,
      walk: o.walking ? { p: o.jx / (440 * 0.11), amt: 1 } : undefined, armN: { hand: [0.3, 1.2], grip: 1 }, armF: { hand: [0.25, 1.25], grip: 1 } });
    skylight(t, 1);
  });
}

/** the scroll seen from above: Sigma's orange sleeve points at the two marks */
function marks(t: number, u: number) {
  shot({ x: 640, y: 360, z: L(1, 1.05, u / 10) }, 1, () => {
    g.drawImage(tableTop('tx-table2'), 0, 0); wash('#fff2dc', 0.45);
    ribbon([[60, 330], [1220, 330]], 120, {}); // paper strip (the bacterial scroll)
    g.fillStyle = '#f6eedb'; g.fillRect(60, 270, 1160, 120);
    for (let i = 0; i < 52; i++) { g.fillStyle = 'rgba(60,50,40,.45)'; g.fillRect(90 + i * 22, 300, 12, 8); g.fillRect(90 + i * 22, 350, 12, 8); }
    const m1 = span(u, 3.5, 4.3, ease.back), m2 = span(u, 5.5, 6.3, ease.back);
    if (m1 > 0) { g.strokeStyle = `rgba(224,112,58,${m1})`; g.lineWidth = 5; rr(330, 280, 150, 100, 12); g.stroke(); plate('−35', 405, 250, 26, '#ffffff', COL.sigma, m1); }
    if (m2 > 0) { g.strokeStyle = `rgba(224,112,58,${m2})`; g.lineWidth = 5; rr(640, 280, 150, 100, 12); g.stroke(); plate('−10', 715, 250, 26, '#ffffff', COL.sigma, m2); }
    const st = span(u, 7.5, 8.5);
    if (st > 0) { arrowP(850, 420, 1050, 420, '#c2185b', st, 5); plate('ここから写す（+1）', 950, 470, 22, '#ffffff', '#c2185b', st); }
    // sleeve and finger
    const fx = u < 4.8 ? L(300, 405, span(u, 2.5, 3.8)) : L(405, 715, span(u, 4.8, 5.8));
    g.save(); g.translate(fx, 420); g.rotate(-0.3);
    g.fillStyle = SIGMA.top; rr(-40, 40, 80, 220, 30); g.fill(); g.fillStyle = SIGMA.skin; g.beginPath(); g.ellipse(0, 26, 26, 30, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-2, -10, 8, 24, 0, 0, 7); g.fill();
    g.restore();
  });
  plate('分館＝細菌（たとえ）', W - 30, 52, 18, '#ffffff', '#c25a26', 1, 'right');
  void t;
}

/** insert: holoenzyme binds −35/−10 and opens the DNA */
function holo(t: number, u: number) {
  insert('ホロ酵素（コア酵素＋σ因子）がプロモーターを見つける', '細菌（原核生物）', span(u, 0, 0.6), () => {
    const come = span(u, 0.5, 4, ease.inOut), open = span(u, 7, 10);
    const bx = L(1300, 560, come);
    // promoter boxes on the DNA
    const y = 330;
    plate('−35', 380, y - 70, 20, '#ffffff', COL.sigma, span(u, 3, 4));
    plate('−10', 600, y - 70, 20, '#ffffff', COL.sigma, span(u, 3.5, 4.5));
    bubble(bx, 0, { y, open, rnaA: 0, pol: 'コア酵素', ends: 1, names: 0 });
    g.fillStyle = 'rgba(224,112,58,.2)'; g.fillRect(330, y - 6, 100, 78); g.fillRect(550, y - 6, 100, 78);
    blob(bx - 150, y - 120, 52, 34, COL.sigma, 'σ因子', 1);
    txt("TTGACA（−35）  ・  TATAAT（−10）　非鋳型鎖を5'→3'に読んだ配列（スライド18）", W / 2, 560, 20, '#1f2a3a', span(u, 4.5, 5.5), 'center', GOTHIC, 700);
    plate('転写を始める場所で、二重らせんがほどける（スライド15）', W / 2, 612, 20, '#ffffff', '#1f3a5f', open);
  }, 'スライド14・15・18');
  void t;
}

/** insert: after ~10 nucleotides σ leaves; the core enzyme elongates */
function release(t: number, u: number) {
  insert('約10ヌクレオチドでσ因子が離れ、伸長に入る', '細菌（原核生物）', span(u, 0, 0.6), () => {
    const k = span(u, 0.5, 10, (x) => x), off = span(u, 1.5, 4, ease.out);
    const bx = L(560, 860, k);
    bubble(bx, L(30, 260, k), { y: 330, pol: 'コア酵素', names: 0 });
    blob(L(450, 280, off), L(260, 150, off), 52, 34, COL.sigma, 'σ因子', 1 - span(u, 6, 8) * 0.4);
    if (off > 0.3) arrowP(430, 240, 330, 170, COL.sigma, off, 3);
    plate('RNAは5\'→3\'に伸び、ポリメラーゼはDNAに沿って移動する（スライド16・19）', W / 2, 612, 20, '#ffffff', '#1f3a5f', span(u, 3, 4));
  }, 'スライド16・19');
  void t;
}

/** insert: terminator — stem-loop in the RNA, weak A–U, ρ */
function terminate(t: number, u: number) {
  insert('ターミネーターで転写が終わる', '細菌（原核生物）', span(u, 0, 0.6), () => {
    // left: the stem-loop on the RNA
    const sl = span(u, 1, 5);
    const x = 360, y = 470;
    polymerase(x + 30, y, 110, 70, 0.9, 'コア酵素', 1.6);
    g.strokeStyle = COL.temp; g.lineWidth = 8; g.beginPath(); g.moveTo(120, y + 30); g.lineTo(600, y + 30); g.stroke();
    // UUUU next to the template's AAAA
    const pairs = 'GCAGGCU';
    for (let i = 0; i < 7; i++) { const yy = y - 60 - i * 34 * sl; baseTile(pairs[i], x - 26, yy, 30, sl); baseTile(({ G: 'C', C: 'G', A: 'U', U: 'A' } as Record<string, string>)[pairs[i]], x + 26, yy, 30, sl); g.strokeStyle = 'rgba(31,42,58,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 10, yy); g.lineTo(x + 10, yy); g.stroke(); }
    if (sl > 0.5) { g.strokeStyle = COL.rna; g.lineWidth = 6; g.beginPath(); g.arc(x, y - 60 - 7 * 34 * sl, 30, Math.PI, 0); g.stroke(); txt('ループ', x, y - 60 - 7 * 34 * sl - 44, 18, '#c2185b', sl, 'center', GOTHIC, 800); }
    txt('ステム（逆向きの繰り返し＝パリンドローム配列）', x + 60, y - 150, 18, '#1f2a3a', sl, 'left', GOTHIC, 800);
    ['U', 'U', 'U', 'U'].forEach((ch, i) => baseTile(ch, 260 + i * 34 + 120, y + 4, 26, span(u, 5, 6)));
    plate('A–Uの弱い対 → RNAが外れやすい', 380, y + 92, 18, '#ffffff', '#c2185b', span(u, 6, 7));
    plate('停止', x + 30, y - 4, 18, '#ffffff', '#5a6b80', span(u, 4.5, 5.2));
    // right: ρ protein
    const rho = span(u, 10, 12);
    const rx = 920;
    polymerase(rx, y, 110, 70, rho * 0.9, 'コア酵素', 1.6);
    g.globalAlpha = rho; g.strokeStyle = COL.temp; g.lineWidth = 8; g.beginPath(); g.moveTo(760, y + 30); g.lineTo(1160, y + 30); g.stroke();
    g.strokeStyle = COL.rna; g.lineWidth = 6; g.beginPath(); g.moveTo(rx - 30, y); g.quadraticCurveTo(rx - 160, y - 60, rx - 200, y - 200); g.stroke(); g.globalAlpha = 1;
    const rp = span(u, 12, 16, ease.inOut);
    blob(L(rx - 200, rx - 70, rp), L(y - 200, y - 50, rp), 44, 32, '#7d5aa8', 'ρ', rho);
    plate('ρタンパク質がRNAに結合し、DNA–RNAの塩基対を壊す', rx + 30, y - 300, 18, '#ffffff', '#7d5aa8', span(u, 13, 14));
  }, 'スライド17・20・21');
  void t;
}

/** insert: lac operon — first what suppresses, then what promotes */
function lac(t: number, u: number, len: number) {
  insert('lacオペロン：負の調節 → 正の調節', '細菌（原核生物）', span(u, 0, 0.6), () => {
    const y = 300;
    // DNA map
    g.strokeStyle = COL.nontemp; g.lineWidth = 8; g.beginPath(); g.moveTo(100, y); g.lineTo(1180, y); g.stroke();
    g.strokeStyle = COL.temp; g.beginPath(); g.moveTo(100, y + 16); g.lineTo(1180, y + 16); g.stroke();
    const seg = (x0: number, x1: number, col: string, name: string, up = false) => { g.fillStyle = col; rr(x0, y - 12, x1 - x0, 40, 6); g.fill(); txt(name, (x0 + x1) / 2, up ? y - 26 : y + 62, 18, '#1f2a3a', 1, 'center', GOTHIC, 800); };
    seg(150, 260, '#b9a7d6', 'CRP結合領域'); seg(270, 420, '#9fb4c8', 'プロモーター'); seg(380, 470, '#e7a0a0', 'オペレーター', true);
    seg(500, 700, '#86c48a', 'lacZ'); seg(710, 850, '#86c48a', 'lacY'); seg(860, 980, '#86c48a', 'lacA'); seg(1000, 1040, '#5a6b80', 'T');
    // condition panel
    const glc = u < len * 0.42 ? '＋' : '−';
    const lacP = u < len * 0.14 ? '−' : '＋';
    plate(`培地：グルコース ${glc} ／ ラクトース ${lacP}`, W / 2, 130, 22, '#1f2a3a', 'rgba(255,255,255,.95)', 1);
    // 1) repressor on the operator; polymerase blocked
    const rep = 1 - span(u, len * 0.18, len * 0.26, ease.out);
    blob(L(425, 560, 1 - rep), y - 80 - (1 - rep) * 60, 56, 30, '#c0392b', 'リプレッサー', rep, '#ffffff', 16);
    if (rep > 0.5) { polymerase(330, y - 150, 70, 44, span(u, 1, 2), '', -1); txt('✕', 330, y - 136, 40, '#c0392b', span(u, 2, 2.5), 'center', GOTHIC, 800); }
    const step1 = span(u, 0.5, 1.5) * (1 - span(u, len * 0.3, len * 0.33));
    plate('負の調節：リプレッサーがオペレーターをふさぐ', W / 2, 560, 20, '#ffffff', '#c0392b', step1);
    plate('ラクトースがあると、リプレッサーが外れる（発現抑制機構を積極的に抑制）', W / 2, 606, 18, '#1f2a3a', 'rgba(255,255,255,.95)', span(u, len * 0.18, len * 0.22) * (1 - span(u, len * 0.4, len * 0.43)));
    // 2) cAMP rises → CRP binds → polymerase binds
    const crp = span(u, len * 0.45, len * 0.55, ease.back);
    blob(205, y - 80 + (1 - crp) * -40, 60, 30, '#7d5aa8', 'cAMP–CRP', crp, '#ffffff', 16);
    const pol = span(u, len * 0.58, len * 0.66, ease.out);
    const run = span(u, len * 0.68, len * 0.92, (x) => x);
    if (pol > 0) polymerase(L(345, 1010, run), y + 8, 80, 56, pol * 0.85, 'RNAポリメラーゼ', 2.2);
    plate('正の調節：cAMPが増えると、cAMP–CRP複合体がプロモーターに結合し、ポリメラーゼが結合できる', W / 2, 560, 18, '#ffffff', '#7d5aa8', span(u, len * 0.45, len * 0.5));
    if (run > 0) { g.strokeStyle = COL.rna; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(500, y + 100); g.lineTo(L(500, 1000, run), y + 100); g.stroke(); endTag("5'", 476, y + 100, '#c2185b', run); if (run > 0.98) endTag("3'", 1024, y + 100, '#c2185b'); }
    plate('lacZ・Y・Aの3つの遺伝子が、1本のmRNAに写される（オペロン、スライド25）', W / 2, 606, 18, '#ffffff', '#c2185b', span(u, len * 0.9, len * 0.95));
  }, 'スライド24・25');
  void t;
}

export function annexScene(t: number, dd: number) {
  const hh = handheld(t, 1.2, 31);
  const cut = [c[1] - 0.2, c[2] - 0.2, c[3] - 0.2, c[5] - 0.2, c[6] - 0.2, c[7] - 0.2, c[8] - 0.2, c[10] - 0.2, c[12] - 0.2, c[13] - 0.2];
  const enter = span(t, 1, 9, (x) => x * x * (3 - 2 * x));
  if (t < cut[0]) wide(t, { jx: L(-100, 260, enter), walking: t > 1 && t < 9, sigmaX: 540, cam: [640, 380, L(1, 1.06, t / cut[0])] });
  else if (t < cut[1]) marks(t, t - cut[0]);
  else if (t < cut[2]) holo(t, t - cut[1]);
  else if (t < cut[3]) { const u = t - cut[2], hop = span(t, c[4] + 0.4, c[4] + 1.6, (x) => x); wide(t, { jx: 260, walking: false, sigmaX: 560, sigmaHop: hop, coreWrite: u, ribbonLen: L(10, 120, span(u, 0, c[4] - cut[2])), mouthC: talk(t, c[3], e[3]), mouthS: talk(t, c[4], e[4]), cam: [660, 470, 1.35] }); }
  else if (t < cut[4]) release(t, t - cut[3]);
  else if (t < cut[5]) { const u = t - cut[4]; wide(t, { jx: 260, walking: false, sigmaX: 390, coreWrite: u < 1.4 ? u : 0, ribbonLen: 260, loop: span(u, 0.4, 2.2, ease.back), cam: [800, 480, 1.6] }); }
  else if (t < cut[6]) terminate(t, t - cut[5]);
  else if (t < cut[7]) wide(t, { jx: 260, walking: false, sigmaX: 390, ribbonLen: 0, tag: span(t, cut[6], cut[6] + 1), mouthC: talk(t, c[9], e[9]), cam: [860, 400, 1.15] });
  else if (t < cut[8]) lac(t, t - cut[7], cut[8] - cut[7]);
  else if (t < cut[9]) {
    g.drawImage(annex(), -300, -150, W * 1.5, H * 1.5); skylight(t, 0.7);
    bust(JIN, 560 + hh[0], 330 + hh[1], 320, { yaw: 0.4, gazeX: 0.7, gazeY: 0.2, mouth: talk(t, c[12], e[12]), blink: blinkAt(t, 1), smile: 0.5, brow: 0.1 }, t, 0);
  } else {
    g.drawImage(annex(), -200, -150, W * 1.5, H * 1.5); skylight(t, 0.7);
    const bob = Math.abs(Math.sin(t * 6)) * 6 * (1 - span(t, cut[9], cut[9] + 1.5));
    bust(SIGMA, 640 + hh[0], 360 + hh[1] - bob, 300, { yaw: -0.2, gazeX: -0.3, gazeY: 0.1, mouth: talk(t, c[13], e[13]), blink: blinkAt(t, 6), wide: 0.5, brow: 0.3, smile: 0.2 }, t, 0);
  }
  cut.forEach((x) => wash('#0a0806', CL(1 - Math.abs(t - x) / 0.22) * 0.35));
  wash('#0a0806', 1 - span(t, 0, 0.6));
  wash('#0a0806', span(t, d - 0.6, d));
  grain(t, 0.03);
  void dd; void HAND; void bar; void glow; void baseTile;
}
