/**
 * Scene 4「本館の受付」(eukaryote): back in the hall the glucokinase volume is wound tight on its spool →
 * Octa loosens it, Mechi swaps the sticky note → insert: nucleosomes, remodelling and histone modification
 * (slides 28, 34) → Pol at the empty reception counter → insert: TATA box, TFIID (TBP) bends the DNA, TFIIB,
 * Pol II and the other factors, TFIIH unwinds (ATP) and phosphorylates the CTD (slides 30, 32) → Pol sets off,
 * the helpers wave → Deo holds up the "急ぎ" tag → insert: enhancer, activator, mediator; then silencer
 * (slides 34, 35) → the volume has two entrances → insert: glucokinase, liver vs pancreatic B-cell promoter (49).
 */
import { CL, H, L, W, g, rr } from '../../../../../engine/story/kit';
import { ease, grain, handheld, shot, span, wash } from '../../../../../engine/story/cine';
import { drawFigure, type Look } from '../../../../../engine/story/rig';
import { CORE, DEO, JIN, MECHI, OCTA, POL, SIGMA } from '../cast';
import { COL, GOTHIC, arrowP, bar, blinkAt, blob, bust, counter, cues, endTag, hall, insert, plate, polymerase, ribbon, strand, sun, talk, txt, wallClock } from '../sets';
import { bubble } from '../mol';

const { c, e, d } = cues('reception');

/** the reception helpers (general transcription factors), small figures with badges */
const HELP: [string, Look][] = [
  ['TFIID', { ...CORE, top: '#6aa36f', topShade: '#4f8654', topTrim: '#3a6a3f', hair: '#3a2a20' }],
  ['TFIIB', { ...CORE, top: '#a0703a', topShade: '#80582a', topTrim: '#5e401c', hair: '#2a2420', hairStyle: 'messy' }],
  ['TFIIF', { ...CORE, top: '#d6a640', topShade: '#b08530', topTrim: '#806020', hair: '#4a3020' }],
  ['TFIIE', { ...CORE, top: '#c58a4a', topShade: '#a06a34', topTrim: '#7a5024', hair: '#2e2620', hairStyle: 'swept' }],
  ['TFIIH', { ...CORE, top: '#e89a8a', topShade: '#c47a6a', topTrim: '#9a5a4c', hair: '#3a2a22' }],
];

/** the glucokinase volume on its spool: tight (0) → loosened (1); the sticky note on top */
function spool(x: number, y: number, s: number, loose: number, note: number) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#6b4a30'; g.fillRect(-12, 0, 24, 160); rr(-80, 150, 160, 18, 6); g.fill();
  const r = L(52, 70, loose);
  g.fillStyle = '#8a6440'; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill();
  g.fillStyle = '#f6eedb'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.strokeStyle = 'rgba(120,90,50,.35)'; g.lineWidth = 1.2; for (let k = 26; k < r; k += L(3, 7, loose)) { g.beginPath(); g.arc(0, 0, k, 0, 7); g.stroke(); }
  // loose end hanging down
  if (loose > 0) { g.fillStyle = '#f6eedb'; g.beginPath(); g.moveTo(r - 8, 0); g.quadraticCurveTo(r + 30 * loose, 80 * loose, r + 10, 150 * loose); g.lineTo(r - 24, 150 * loose); g.quadraticCurveTo(r - 10, 70 * loose, r - 30, 0); g.fill(); }
  g.fillStyle = '#c9a050'; rr(-40, -r - 26, 80, 22, 5); g.fill(); txt('グルコキナーゼ', 0, -r - 10, 13, '#3a2a10', 1, 'center', GOTHIC, 800);
  // sticky note: red "読まない" → green "開いて読む"
  g.save(); g.translate(r * 0.6, -r * 0.6); g.rotate(0.2 - note * 0.1);
  g.fillStyle = note < 0.5 ? '#e8a0a0' : '#a8e0a0'; g.fillRect(-26, -18, 52, 36); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(-26, -18, 52, 8);
  g.restore();
  g.restore();
  plate(note < 0.5 ? '付箋：閉じておく' : '付箋：開いて読む', x + 10 * s, y - 150 * s, 16, '#ffffff', note < 0.5 ? '#b04040' : '#3a8a4a', 1);
}

function hallBg(t: number, cam: [number, number, number], fn: () => void) {
  shot({ x: cam[0], y: cam[1], z: cam[2] }, 1, () => { g.drawImage(hall(), 0, 0); wallClock(780, 92, 26, 9, 10); fn(); sun(t, 1); });
}

/** insert: nucleosomes → remodelling + histone modification expose the promoter */
function chromatin(t: number, u: number) {
  insert('真核生物のDNAは、ヌクレオソーム・クロマチンになっている', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const y = 360, slide = span(u, 6, 10, ease.inOut), mark = span(u, 9, 11);
    // DNA wrapped around histone beads
    const beads = [260, 420, 580, 740, 900];
    g.strokeStyle = COL.temp; g.lineWidth = 7; g.beginPath(); g.moveTo(100, y + 40); for (let x = 100; x <= 1180; x += 8) { const near = beads.map((b, i) => b + (i >= 2 ? slide * 120 : 0)).find((b) => Math.abs(x - b) < 50); g.lineTo(x, near != null ? y + 40 - Math.sin(((x - near + 50) / 100) * Math.PI) * 60 : y + 40); } g.stroke();
    beads.forEach((b, i) => { const bx = b + (i >= 2 ? slide * 120 : 0); blob(bx, y + 10, 44, 34, '#9b74c8', 'ヒストン', 1, '#ffffff', 14); if (mark > 0) { g.fillStyle = `rgba(80,170,90,${mark})`; g.beginPath(); g.arc(bx + 32, y - 22, 9, 0, 7); g.fill(); } });
    plate('ヌクレオソーム', 260, y - 70, 18, '#ffffff', '#7d5aa8', span(u, 0.8, 1.6));
    // the promoter region opening between beads 2 and 3
    const open = slide;
    if (open > 0.4) { g.fillStyle = `rgba(194,24,91,${(open - 0.4) * 0.3})`; g.fillRect(500, y + 20, 200, 40); plate('プロモーターが露出', 600, y + 110, 18, '#ffffff', '#c2185b', (open - 0.4) / 0.6); }
    blob(L(1250, 860, span(u, 3, 6)), y - 120, 80, 40, '#2e7a4a', 'クロマチン再構成複合体', span(u, 3, 4), '#ffffff', 15);
    blob(L(-100, 300, span(u, 7.5, 9.5)), y - 130, 70, 36, '#e0b030', 'ヒストン修飾酵素', span(u, 7.5, 8.5), '#3a2a10', 15);
    plate('実際の転写開始には、これらの酵素の助けが必要（スライド28・34）', W / 2, 612, 20, '#ffffff', '#1f3a5f', span(u, 10, 11));
  }, 'スライド28・34');
  void t;
}

/** insert: assembly of the initiation complex, timed to three narration lines */
function assemble(t: number, u: number, k5: number, k6: number, k7: number, len: number) {
  insert('RNAポリメラーゼIIの転写開始', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const y = 380;
    // timing inside the insert
    const dIn = span(u, 3.5, 6, ease.out), bend = span(u, 7, 9), bIn = span(u, k6 + 0.5, k6 + 2.5, ease.out), polIn = span(u, k6 + 4, k6 + 7, ease.out), rest = span(u, k6 + 7, k6 + 9.5, ease.out);
    const atp = span(u, k7 + 1, k7 + 3), unwind = span(u, k7 + 2.5, k7 + 5), ctd = span(u, k7 + 7, k7 + 9), go = span(u, k7 + 10.5, len - 0.5, ease.inOut);
    // DNA with the TATA box and the start site; the TFIID bend lifts the DNA around TATA
    const tx = 470, sx = 640;
    const yb = (x: number) => y - bend * 34 * Math.exp(-((x - tx) ** 2) / 3000);
    const bx = L(sx + 60, 1060, go);
    if (unwind > 0) bubble(bx, L(0, 300, go) * unwind, { y: y - 33, x0: 90, x1: 1190, open: unwind, polA: 0, ends: 0, rnaA: go > 0.05 ? 1 : 0 });
    else { strand(Array.from({ length: 140 }, (_, i) => [90 + i * 8, yb(90 + i * 8) - 33] as [number, number]), COL.nontemp, 9); strand(Array.from({ length: 140 }, (_, i) => [90 + i * 8, yb(90 + i * 8) + 33] as [number, number]), COL.temp, 9); }
    g.fillStyle = 'rgba(90,180,90,.5)'; g.fillRect(tx - 40, yb(tx) - 44, 80, 88);
    plate('TATAボックス', tx, y + 118, 18, '#ffffff', '#3a8a4a', span(u, 0.8, 1.8));
    arrowP(sx, y - 70, sx + 90, y - 70, '#1f2a3a', span(u, 1.5, 2.5), 4); txt('+1（転写開始）', sx + 40, y - 86, 16, '#1f2a3a', span(u, 1.5, 2.5), 'center', GOTHIC, 800);
    txt('約25塩基上流', (tx + sx) / 2, y + 160, 16, '#3a8a4a', span(u, 2, 3), 'center', GOTHIC, 800);
    endTag("5'", 64, y - 33, '#9a7a10'); endTag("3'", 1214, y - 33, '#9a7a10'); endTag("3'", 64, y + 33, '#1f6ea8'); endTag("5'", 1214, y + 33, '#1f6ea8');
    // factors
    const leave = go;
    blob(L(tx, 300, 0) , L(y - 300, yb(tx) - 70, dIn), 70, 36, '#4f8654', 'TFIID（TBP）', dIn);
    blob(L(tx + 130, tx + 130, 0), L(y - 300, y - 60, bIn), 46, 30, '#80582a', 'TFIIB', bIn * (1 - leave * 0.7));
    polymerase(L(1350, sx + 60, polIn), y - 4, 130, 90, polIn * 0.9 * (1 - 0), 'RNAポリメラーゼII', -1.25);
    blob(L(1400, sx + 210, rest), L(y - 160, y - 110, rest), 40, 26, '#b08530', 'TFIIF', rest * (1 - leave * 0.8), '#3a2a10', 15);
    blob(L(1400, sx + 70, rest), L(y + 180, y + 150, rest), 40, 26, '#a06a34', 'TFIIE', rest * (1 - leave * 0.8), '#ffffff', 15);
    blob(L(1400, sx + 210, rest), L(y + 200, y + 150, rest), 46, 28, '#c47a6a', 'TFIIH', rest * (1 - leave * 0.8));
    // ATP to TFIIH; CTD tail with phosphates
    if (atp > 0 && atp < 1) { const ax = L(sx + 400, sx + 230, atp), ay = L(y + 250, y + 160, atp); plate('ATP', ax, ay, 16, '#3a2a10', '#ffe08a', 1 - span(atp, 0.85, 1)); }
    const cx0 = L(sx + 60, 1060, go) + 120, cy0 = y + 40;
    if (polIn > 0.8) { g.strokeStyle = '#7fb3d8'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx0 - 30, cy0); g.quadraticCurveTo(cx0 + 40, cy0 + 60, cx0 + 120, cy0 + 50); g.stroke(); txt('CTD', cx0 + 140, cy0 + 56, 16, '#1f6ea8', 1, 'left', GOTHIC, 800); }
    if (ctd > 0) [0, 1].forEach((q) => { const px = cx0 + 40 + q * 44, py = cy0 + 50; g.globalAlpha = ctd; g.fillStyle = '#f5c542'; g.beginPath(); g.arc(px, py, 14, 0, 7); g.fill(); g.globalAlpha = 1; txt('P', px, py + 6, 16, '#5a4508', ctd, 'center', GOTHIC, 800); });
    // captions per stage
    plate('① TFIIDがTBPを介してTATAボックスに結合し、DNAを大きくゆがめる（スライド30・32）', W / 2, 604, 18, '#ffffff', '#3a8a4a', span(u, 4, 5) * (1 - span(u, k6 - 0.6, k6)));
    plate('② TFIIB → RNAポリメラーゼIIと残りの基本転写因子 ＝ 転写開始複合体', W / 2, 604, 18, '#ffffff', '#80582a', span(u, k6, k6 + 0.8) * (1 - span(u, k7 - 0.6, k7)));
    plate('③ TFIIHがATPを使ってDNAをほどき、CTDをリン酸化 → 伸長へ', W / 2, 604, 18, '#ffffff', '#c25a4c', span(u, k7, k7 + 0.8));
    plate('多くの基本転写因子は離れ、次の転写開始に再利用される', W / 2, 650, 16, '#1f2a3a', 'rgba(255,255,255,.95)', span(u, k7 + 11, k7 + 12));
    void k5;
  }, 'スライド30・32');
  void t;
}

/** insert: enhancer + activator + mediator; then silencer */
function enhancer(t: number, u: number, len: number) {
  insert('エンハンサーは転写効率を増強する。逆はサイレンサー', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const y = 440, loop = span(u, 2.5, 6, ease.inOut), sil = span(u, len * 0.62, len * 0.7);
    // DNA loop from the enhancer (left) to the promoter (right)
    const ex = L(180, 420, loop), ey = L(y, y - 210, loop);
    g.strokeStyle = COL.temp; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(60, y); g.lineTo(ex - 80 * (1 - loop), y - 0); g.bezierCurveTo(ex - 140, ey - 140 * loop, 640, y - 300 * loop, 700, y); g.lineTo(1220, y); g.stroke();
    g.fillStyle = 'rgba(224,112,58,.6)'; g.fillRect(ex - 40, ey - 10, 80, 20);
    txt('エンハンサー', ex, ey + 40, 18, '#1f2a3a', 1 - sil, 'center', GOTHIC, 800);
    blob(ex, ey - 40, 54, 30, '#e0703a', '転写活性化因子', span(u, 1, 2) * (1 - sil), '#ffffff', 15);
    polymerase(840, y - 40, 110, 70, 0.85, 'RNAポリメラーゼII', 1.6);
    blob(680, y - 30, 40, 26, '#4f8654', 'TFIID', 1, '#ffffff', 14);
    blob(L(ex + 120, 620, loop), L(ey + 20, y - 130, loop), 90, 46, '#9b7ac8', '介在因子', span(u, 6, 7) * (1 - sil), '#ffffff', 16);
    // efficiency meter
    const lvl = span(u, 7, 9) * (1 - sil) - sil * 0.6;
    g.fillStyle = 'rgba(31,42,58,.12)'; rr(1080, 160, 50, 220, 10); g.fill();
    const hgt = 110 + lvl * 100; g.fillStyle = lvl >= 0 ? '#c2185b' : '#1f6ea8'; rr(1080, 380 - hgt, 50, hgt, 10); g.fill();
    txt('転写効率', 1105, 140, 16, '#1f2a3a', 1, 'center', GOTHIC, 800);
    txt(lvl > 0.3 ? '↑ 増強' : lvl < -0.3 ? '↓ 低下' : '基礎', 1105, 410, 18, lvl >= 0 ? '#c2185b' : '#1f6ea8', 1, 'center', GOTHIC, 800);
    // silencer: a repressing protein (labelled 補足: the slides only say "the opposite")
    if (sil > 0) { g.fillStyle = `rgba(31,110,168,${0.6 * sil})`; g.fillRect(200, y - 10, 80, 20); txt('サイレンサー', 240, y + 40, 18, '#1f6ea8', sil, 'center', GOTHIC, 800); blob(240, y - 40, 52, 28, '#1f6ea8', '調節タンパク質', sil, '#ffffff', 14); bar(300, y - 70, 720, y - 90, '#1f6ea8', span(u, len * 0.72, len * 0.85), 4); }
    plate('転写活性化因子が介在因子を通して、ポリメラーゼを転写開始部位へ引きつける（スライド34）', W / 2, 604, 18, '#ffffff', '#e0703a', span(u, 3, 4) * (1 - sil));
    plate('遺伝子から数百〜数千bp離れていても働く（スライド35）', W / 2, 650, 16, '#1f2a3a', 'rgba(255,255,255,.95)', span(u, 8, 9) * (1 - sil));
    plate('サイレンサー：転写を抑える（エンハンサーの逆）', W / 2, 604, 18, '#ffffff', '#1f6ea8', sil);
    txt('※サイレンサーに結合するタンパク質は補足（資料には「逆はサイレンサー」とのみ記載）', W / 2, 650, 14, '#5a6b80', sil, 'center', GOTHIC, 600);
  }, 'スライド34・35');
  void t;
}

/** insert: glucokinase — two promoters, liver (1L) vs pancreatic B cell / pituitary (1B) */
function gk(t: number, u: number) {
  insert('グルコキナーゼ遺伝子の選択的プロモーター利用', 'ヒト（真核生物）', span(u, 0, 0.6), () => {
    const exons: [string, number][] = [['1B', 140], ['1L', 380], ['2', 560], ['3', 620], ['4', 700], ['5', 800], ['6', 840], ['7', 930], ['8', 990], ['9', 1050], ['10', 1120]];
    const row = (y: number, a: number, use: string, label: string, col: string) => {
      g.globalAlpha = a; g.strokeStyle = '#1f2a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(100, y); g.lineTo(1170, y); g.stroke(); g.globalAlpha = 1;
      txt('//', 260, y + 7, 22, '#1f2a3a', a, 'center', GOTHIC, 800); txt('約30 kb', 260, y - 18, 14, '#5a6b80', a, 'center', GOTHIC, 700);
      exons.forEach(([n, x]) => { const used = n === use || (n !== '1B' && n !== '1L'); g.globalAlpha = a; g.fillStyle = used ? col : '#d0d6de'; rr(x - 14, y - 16, 28, 32, 4); g.fill(); g.globalAlpha = 1; txt(n, x, y + 40, 14, '#1f2a3a', a, 'center', GOTHIC, 700); });
      // promoter arrow
      const px = use === '1B' ? 140 : 380; arrowP(px - 10, y - 30, px + 50, y - 30, col, a, 4);
      // splice arcs
      const order = [use, '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((n) => exons.find((x) => x[0] === n)![1]);
      g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 2; for (let i = 0; i < order.length - 1; i++) { const x1 = order[i] + 14, x2 = order[i + 1] - 14; if (x2 - x1 < 10) continue; g.beginPath(); g.moveTo(x1, y - 16); g.lineTo((x1 + x2) / 2, y - 16 - Math.min(60, (x2 - x1) * 0.3)); g.lineTo(x2, y - 16); g.stroke(); } g.globalAlpha = 1;
      plate(label, 100, y - 70, 18, '#ffffff', col, a, 'left');
    };
    row(260, span(u, 0.8, 2), '1L', '肝臓：1Lのプロモーター', '#c2185b');
    row(470, span(u, 4, 5.5), '1B', '膵B細胞／下垂体：1Bのプロモーター', '#2f6f9f');
    plate('異なるプロモーター周辺配列を使うことで、組織特異的な転写調節をおこなっている（スライド49）', W / 2, 620, 18, '#ffffff', '#1f3a5f', span(u, 7, 8));
  }, 'スライド49');
  void t;
}

export function reception(t: number, dd: number) {
  const hh = handheld(t, 1.2, 41);
  const cut = [c[1] - 0.2, c[3] - 0.2, c[4] - 0.2, c[5] - 0.2, c[8] - 0.2, c[9] - 0.2, c[10] - 0.2, c[11] - 0.2, c[12] - 0.2];
  if (t < cut[0]) {
    const k = span(t, 0.3, 5, (x) => x * x * (3 - 2 * x));
    hallBg(t, [640, 380, L(1, 1.08, t / cut[0])], () => {
      spool(900, 420, 1.2, 0, 0);
      drawFigure(SIGMA, { x: L(-160, 250, k), y: 690, s: 300, dir: 1, t, yaw: 0.6, light: -1, blink: blinkAt(t, 6), walk: t < 5 ? { p: k * 9, amt: 1 } : undefined, smile: 0.4, armN: { hand: [0.3, 1.0], grip: 0.5 }, armF: { hand: [0.25, 1.1], grip: 0.5 } });
      drawFigure(JIN, { x: L(-40, 430, k), y: 700, s: 440, dir: 1, t, yaw: 0.6, light: -1, blink: blinkAt(t, 1), walk: t < 5 ? { p: k * 10, amt: 1 } : undefined, gazeX: 0.7, gazeY: 0.1, brow: 0.2, armN: { hand: [0.3, 1.2], grip: 1 }, armF: { hand: [0.25, 1.25], grip: 1 } });
    });
  } else if (t < cut[1]) {
    const u = t - cut[0], loose = span(t, c[1] + 0.5, c[1] + 4.5), note = span(t, c[2] + 0.8, c[2] + 1.6, ease.back);
    hallBg(t, [880, 420, 1.45], () => {
      spool(900, 420, 1.2, loose, note);
      drawFigure(OCTA, { x: 720, y: 700, s: 430, dir: 1, t, yaw: 0.45, light: -1, blink: blinkAt(t, 3), mouth: talk(t, c[1], e[1]), smile: 0.5, gazeX: 0.6, gazeY: 0.3,
        armN: { at: [L(830, 860, Math.sin(u * 3) * 0.5 + 0.5), L(400, 440, Math.cos(u * 3) * 0.5 + 0.5)], grip: 0.9 }, armF: { hand: [0.25, 1.2], grip: 0.5 } });
      drawFigure(MECHI, { x: 1080, y: 700, s: 420, dir: -1, t, yaw: -0.45, light: -1, blink: blinkAt(t, 7), mouth: talk(t, c[2], e[2]), smile: 0.5, gazeX: -0.6, gazeY: 0.35,
        armN: t > c[2] ? { at: [L(1020, 960, note), L(380, 340, note)], grip: 0.6 } : { hand: [0.25, 1.2], grip: 0.5 }, armF: { hand: [0.25, 1.2], grip: 0.5 } });
    });
  } else if (t < cut[2]) chromatin(t, t - cut[1]);
  else if (t < cut[3]) {
    hallBg(t, [640, 380, 1.2], () => {
      counter(620, 640, 520);
      // five empty chairs behind the counter
      for (let i = 0; i < 5; i++) { g.fillStyle = '#8a6440'; rr(420 + i * 100, 470, 60, 50, 6); g.fill(); g.fillRect(426 + i * 100, 420, 8, 52); g.fillRect(474 + i * 100, 420, 8, 52); }
      drawFigure(POL, { x: 980, y: 688, s: 420, dir: -1, t, yaw: -0.4, light: -1, blink: blinkAt(t, 2), mouth: talk(t, c[4], e[4]), smile: 0.3, brow: 0.25, gazeX: -0.6, gazeY: 0.1, armN: { at: [L(900, 860, span(t, c[4] + 1, c[4] + 2)), L(560, 470, span(t, c[4] + 1, c[4] + 2))], grip: 0.2 }, armF: { hand: [0.2, 1.3], grip: 0.6 } });
    });
  } else if (t < cut[4]) assemble(t, t - cut[3], 0, c[6] - cut[3], c[7] - cut[3], cut[4] - cut[3]);
  else if (t < cut[5]) {
    const u = t - cut[4], go = span(u, 1.2, 6.5, (x) => x * x * (3 - 2 * x)), px = L(700, 1420, go);
    hallBg(t, [640, 380, 1.08], () => {
      counter(560, 640, 560);
      HELP.forEach(([name, lk], i) => { const x = 360 + i * 100, wave = Math.sin(t * 7 + i) * 0.5 + 0.5; drawFigure(lk, { x, y: 560, s: 250, dir: 1, t, yaw: 0.4, light: -1, blink: blinkAt(t, 9 + i), smile: 0.6, noLegs: true, armN: { at: [x + 40, 380 - wave * 30], grip: 0.2 }, armF: { hand: [0.2, 1.2], grip: 0.5 } }); plate(name, x, 330, 14, '#ffffff', 'rgba(31,58,95,.85)', 1); });
      ribbon([[640, 600], [Math.max(640, px - 40), 600]], 16);
      drawFigure(POL, { x: px, y: 688, s: 420, dir: 1, t, yaw: 0.6, light: -1, blink: blinkAt(t, 2), mouth: talk(t, c[8], e[8]), smile: 0.6, walk: go > 0 && go < 1 ? { p: px / 46, amt: 1 } : undefined, gazeX: u < 1.5 ? -0.6 : 0.7, gazeY: 0.1, armN: { at: [px - 40, 590], grip: 0.9 }, armF: { hand: [0.25, 1.2], grip: 0.6 } });
    });
    plate('受付係＝基本転写因子（たとえ）', 40, 52, 18, '#ffffff', '#1f3a5f', span(u, 0.5, 1.2), 'left');
  } else if (t < cut[6]) {
    g.drawImage(hall(), -700, -160, W * 1.6, H * 1.6); wash('#fff8ea', 0.2); sun(t, 0.5);
    const up = span(t, cut[5] + 0.3, cut[5] + 1.4, ease.back);
    bust(DEO, 680 + hh[0], 330 + hh[1], 320, { yaw: -0.3, gazeX: -0.7, gazeY: 0.1, mouth: talk(t, c[9], e[9]), blink: blinkAt(t, 4), smile: 0.3 }, t, -1);
    g.save(); g.translate(L(1000, 940, up), L(760, 420, up)); g.rotate(-0.1); g.fillStyle = '#c0392b'; rr(-70, -40, 140, 80, 8); g.fill(); g.restore(); txt('急ぎ', L(1000, 940, up), L(760, 420, up) + 12, 34, '#ffffff', 1, 'center', GOTHIC, 800);
  } else if (t < cut[7]) enhancer(t, t - cut[6], cut[7] - cut[6]);
  else if (t < cut[8]) {
    hallBg(t, [820, 420, 1.35], () => {
      spool(900, 420, 1.2, 1, 1);
      // two entrance tabs on the volume
      plate('肝臓用の入口', 1060, 330, 18, '#ffffff', '#c2185b', 1); plate('膵臓B細胞用の入口', 1060, 380, 18, '#ffffff', '#2f6f9f', 1);
      drawFigure(JIN, { x: 640, y: 700, s: 440, dir: 1, t, yaw: 0.5, light: -1, blink: blinkAt(t, 1), mouth: talk(t, c[11], e[11]), gazeX: 0.8, gazeY: 0.2, brow: 0.2, armN: { at: [L(700, 960, span(t, cut[7] + 0.5, cut[7] + 1.5)), 380], grip: 0.2 }, armF: { hand: [0.25, 1.25], grip: 1 } });
    });
  } else gk(t, t - cut[8]);
  cut.forEach((x) => wash('#0a0806', CL(1 - Math.abs(t - x) / 0.22) * 0.35));
  wash('#0a0806', 1 - span(t, 0, 0.6));
  wash('#0a0806', span(t, d - 0.6, d));
  grain(t, 0.03);
  void dd; void H;
}
