// @ts-nocheck — imperative SVG drawing code; the public surface is typed via AnimDef below.
/**
 * clock — 時計遺伝子のフィードバックループと疾患（スライド40–43）。
 * 図はスライド41/42の Circadian feedback loop に合わせる：
 *   BMAL1–Clock → E/E'-box → Per, Cry, Rev-erbα, RORα の転写 → Per–Cry ⊣ BMAL1–Clock
 *   Rev-erbα ⊣ RRE、RORα → RRE → BMAL1 → （ループ）BMAL1–Clock
 * Scene time t ∈ [0,1]:
 *   0.00 図 → 0.06 BMAL1–Clock結合 → 0.16〜0.52 1周目（24 h） → 0.52 RRE → 0.64〜0.76 2周目
 *   → 0.76 異常マウス（スライド42） → 0.88 概日時計機構の破綻と疾患（スライド43）
 * 振動の曲線と時計盤は定性的な模式図。
 */
import { E, L, CL, EZ, seg, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const C = {
  nt: '#f5c542', tp: '#3fb6ff', txt: '#e9eef8', mute: '#9fb0cc', box: '#99e9f2',
  bmal: '#a9e34b', clk: '#ffa8a8', per: '#ffec99', cry: '#e64980', rev: '#ffa94d', ror: '#91a7ff',
  act: '#63e6be', inh: '#ff6b6b', gene: '#364fc7',
};
const TXT = (par, x, y, s, fill, size = 18, extra = {}) => { const t = E('text', { x, y, fill, 'font-size': size, 'font-weight': 700, ...extra }, par); t.textContent = s; return t; };
const MID = { 'text-anchor': 'middle' };
const IT = { 'font-style': 'italic' };
const op = (el, v) => el.setAttribute('opacity', String(Math.max(0, Math.min(1, v))));
const fadeIn = (t, a, b) => CL((t - a) / (b - a));
const at = (el, x, y, s = 1) => el.setAttribute('transform', `translate(${x},${y}) scale(${s})`);
const polyPts = (n, r, rot = 0) => Array.from({ length: n }, (_, i) => { const a = rot + (i * 2 * Math.PI) / n; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');

let DEFS = null;
function head(col) {
  const id = 'clkArr' + col.replace('#', '');
  if (DEFS && !DEFS.querySelector('#' + id)) {
    const mk = E('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' }, DEFS);
    E('path', { d: 'M0 0 L10 5 L0 10 z', fill: col }, mk);
  }
  return `url(#${id})`;
}
const arrow = (par, d, col, w = 3, extra = {}) => E('path', { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'marker-end': head(col), ...extra }, par);
/** ⊣ : line ending in a perpendicular bar at (x2,y2) */
function tee(par, d, bx, by, ang, col, w = 3) {
  const g = E('g', {}, par);
  E('path', { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round' }, g);
  const dx = Math.cos(ang + Math.PI / 2) * 16, dy = Math.sin(ang + Math.PI / 2) * 16;
  E('line', { x1: bx - dx, y1: by - dy, x2: bx + dx, y2: by + dy, stroke: col, 'stroke-width': w + 1, 'stroke-linecap': 'round' }, g);
  return g;
}

/* qualitative oscillation (hours) */
const ACT = (h) => Math.max(0, Math.cos((2 * Math.PI * (h - 6)) / 24)); // E/E'-box からの転写
const PC = (h) => Math.max(0, Math.cos((2 * Math.PI * (h - 15)) / 24)); // Per・Cry 量
const phi = (t) => 24 * seg(t, 0.16, 0.52) + 24 * seg(t, 0.64, 0.76);

const UP = 240, LO = 480; // upper / lower DNA
const GENE = [470, 580];
const P_PROD = 'M585 232 C 640 220, 650 180, 640 156';
const P_REV = 'M585 250 C 640 300, 420 330, 330 368';
const P_ROR = 'M592 250 C 680 310, 600 360, 510 390';
const P_LOOP = 'M585 480 C 650 480, 650 528, 580 528 L 140 528 C 70 528, 60 214, 205 206';

const clock: AnimDef = {
  hud(t) {
    if (t < 0.06) return ['Clock genes', '時計遺伝子'];
    if (t < 0.16) return ['BMAL1–Clock', "E/E'-box"];
    if (t < 0.52 || (t >= 0.64 && t < 0.76)) {
      const h = phi(t), a = ACT(h % 24), p = PC(h % 24);
      if (t >= 0.64) return [`${Math.round(h % 24)} h`, '約24時間周期'];
      return a >= p ? ['転写 ON', 'Per・Cry 合成'] : p > 0.15 ? ['抑制', 'Per–Cry'] : ['再開へ', 'Per・Cry 減少'];
    }
    if (t < 0.64) return ['RRE', 'BMAL1 転写'];
    if (t < 0.88) return ['マウス', '異常マウスの所見'];
    return ['関連', '時計の破綻'];
  },
  cam: () => [0, 0, 1200, 675],
  build(svg) {
    glowDefs(svg);
    DEFS = E('defs', {}, svg);
    const S = {};
    const bd = E('g', {}, svg);
    E('rect', { x: 24, y: 48, width: 200, height: 34, rx: 17, fill: 'rgba(116,192,252,.14)', stroke: '#74c0fc', 'stroke-width': 2 }, bd);
    TXT(bd, 124, 71, '真核生物（哺乳類）', '#d0ebff', 17, MID);

    /* ---------- feedback loop (slide 41) ---------- */
    S.loop = E('g', {}, svg);
    const g = S.loop;
    TXT(g, 40, 160, 'Circadian feedback loop', C.mute, 16);
    [UP, LO].forEach((y) => {
      E('line', { x1: 110, y1: y - 4, x2: 700, y2: y - 4, stroke: C.nt, 'stroke-width': 3 }, g);
      E('line', { x1: 110, y1: y + 4, x2: 700, y2: y + 4, stroke: C.tp, 'stroke-width': 3 }, g);
    });
    S.ebox = E('rect', { x: 230, y: UP - 14, width: 130, height: 28, fill: C.box, stroke: '#0b7285', 'stroke-width': 2 }, g);
    TXT(g, 295, UP + 6, "E/E'-box", '#0b2530', 16, MID);
    E('rect', { x: GENE[0], y: UP - 16, width: 110, height: 32, fill: C.gene, stroke: '#91a7ff', 'stroke-width': 2 }, g);
    TXT(g, 525, UP + 38, 'Per, Cry, Rev-erbα, RORα', C.txt, 17, { ...MID, ...IT });
    S.txArr = arrow(g, `M470 ${UP - 16} V${UP - 46} H534`, C.act, 4);
    S.txOn = TXT(g, 548, UP - 40, '転写', C.act, 16);
    S.rre = E('rect', { x: 230, y: LO - 14, width: 130, height: 28, fill: C.box, stroke: '#0b7285', 'stroke-width': 2 }, g);
    TXT(g, 295, LO + 6, 'RRE', '#0b2530', 16, MID);
    E('rect', { x: GENE[0], y: LO - 16, width: 110, height: 32, fill: '#000', stroke: '#ced4da', 'stroke-width': 2 }, g);
    TXT(g, 525, LO + 6, 'BMAL1', '#fff', 17, { ...MID, ...IT });
    S.bArr = arrow(g, `M470 ${LO - 16} V${LO - 46} H534`, C.act, 4);
    // product arrows
    S.aProd = arrow(g, P_PROD, '#ced4da', 3);
    S.aRev = arrow(g, P_REV, '#ced4da', 3);
    S.aRor = arrow(g, P_ROR, '#ced4da', 3);
    S.aLoop = arrow(g, P_LOOP, '#ced4da', 3);
    // Per–Cry inhibition of BMAL1–Clock
    S.inh = tee(g, 'M600 134 C 470 120, 380 140, 344 176', 344, 176, Math.atan2(36, -36), C.inh, 3);
    // Rev-erbα ⊣ RRE, RORα → RRE
    S.revInh = tee(g, `M290 ${LO - 70} V${LO - 22}`, 290, LO - 22, Math.PI / 2, C.inh, 3);
    S.rorAct = arrow(g, `M440 ${LO - 70} L372 ${LO - 22}`, C.act, 3);
    // proteins
    const oval = (x, y, rx, col, s, tc) => { const o = E('g', {}, g); E('ellipse', { cx: 0, cy: 0, rx, ry: 20, fill: col, stroke: '#111', 'stroke-width': 1.5 }, o); TXT(o, 0, 6, s, tc, 16, MID); at(o, x, y); return o; };
    S.bmal = oval(262, 206, 46, C.bmal, 'BMAL1', '#1b2a07');
    S.clk = oval(334, 206, 40, C.clk, 'Clock', '#3a0b0b');
    S.per = oval(630, 134, 32, C.per, 'Per', '#3a3000');
    S.cry = oval(690, 134, 32, C.cry, 'Cry', '#fff');
    S.rev = E('g', {}, g); E('polygon', { points: polyPts(6, 42), fill: C.rev, stroke: '#111', 'stroke-width': 1.5 }, S.rev);
    TXT(S.rev, 0, -2, 'Rev-', '#2b1500', 16, MID); TXT(S.rev, 0, 17, 'erbα', '#2b1500', 16, MID); at(S.rev, 290, LO - 112);
    S.ror = E('g', {}, g); E('polygon', { points: polyPts(8, 38, Math.PI / 8), fill: C.ror, stroke: '#111', 'stroke-width': 1.5 }, S.ror);
    TXT(S.ror, 0, 6, 'RORα', '#0b1540', 16, MID); at(S.ror, 470, LO - 104);
    // moving product dots
    S.dots = Array.from({ length: 10 }, (_, i) => E('circle', { r: 6, fill: i % 2 ? C.cry : C.per }, g));
    S.rdots = Array.from({ length: 6 }, (_, i) => E('circle', { r: 6, fill: i % 2 ? C.ror : C.rev }, g));
    S.bdots = Array.from({ length: 5 }, () => E('circle', { r: 6, fill: C.bmal }, g));
    S.paths = { p: S.aProd, r: S.aRev, o: S.aRor, l: S.aLoop };
    S.note = TXT(svg, 250, 72, '', C.txt, 18); S.note2 = TXT(svg, 250, 98, '', C.mute, 16);

    /* ---------- 24-h dial + qualitative curves ---------- */
    S.dial = E('g', {}, svg);
    const cx = 960, cy = 274, R = 84;
    E('circle', { cx, cy, r: R, fill: '#0c1220', stroke: '#5c6b8a', 'stroke-width': 3 }, S.dial);
    const arc = (h0, h1, r, col) => {
      const p = (h) => { const a = (h / 24) * 2 * Math.PI - Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
      const [x0, y0] = p(h0), [x1, y1] = p(h1);
      return E('path', { d: `M${x0} ${y0} A${r} ${r} 0 ${h1 - h0 > 12 ? 1 : 0} 1 ${x1} ${y1}`, fill: 'none', stroke: col, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.8 }, S.dial);
    };
    arc(0.5, 11.5, R - 10, C.act); arc(9.5, 20.5, R - 23, C.cry);
    [[0, '0/24'], [6, '6'], [12, '12'], [18, '18']].forEach(([h, s]) => {
      const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
      TXT(S.dial, cx + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 22) + 6, s, C.mute, 16, MID);
    });
    S.hand = E('line', { x1: cx, y1: cy, x2: cx, y2: cy - R + 30, stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round' }, S.dial);
    E('circle', { cx, cy, r: 6, fill: '#fff' }, S.dial);
    TXT(S.dial, cx, 416, '約24時間周期（定性的な模式図）', C.mute, 16, MID);
    // graph
    const gx0 = 790, gx1 = 1150, gy0 = 522, gh = 60;
    E('line', { x1: gx0, y1: gy0, x2: gx1, y2: gy0, stroke: '#5c6b8a', 'stroke-width': 2 }, S.dial);
    const curve = (f, col) => { let d = ''; for (let h = 0; h <= 48; h += 0.5) d += `${h ? 'L' : 'M'}${gx0 + ((gx1 - gx0) * h) / 48} ${gy0 - f(h % 24) * gh}`; return E('path', { d, fill: 'none', stroke: col, 'stroke-width': 3 }, S.dial); };
    curve(ACT, C.act); curve(PC, C.cry);
    TXT(S.dial, gx0, 446, "— E/E'-boxからの転写", C.act, 16);
    TXT(S.dial, gx0 + 200, 446, '— Per・Cry量', C.cry, 16);
    TXT(S.dial, gx0, 542, '0', C.mute, 16, MID); TXT(S.dial, (gx0 + gx1) / 2, 542, '24', C.mute, 16, MID); TXT(S.dial, gx1, 542, '48 h', C.mute, 16, MID);
    S.cur = E('line', { y1: gy0 - gh - 6, y2: gy0, stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '4 4' }, S.dial);
    S.G = { gx0, gx1, cx, cy, R };

    /* ---------- disease panels (slides 42, 43) ---------- */
    S.dis = E('g', {}, svg);
    E('rect', { x: 0, y: 0, width: 1200, height: 675, fill: '#05070c', opacity: 1 }, S.dis);
    S.mouse = E('g', {}, S.dis);
    E('rect', { x: 30, y: 104, width: 540, height: 442, rx: 14, fill: 'rgba(255,255,255,.04)', stroke: '#ffa8a8', 'stroke-width': 2 }, S.mouse);
    TXT(S.mouse, 52, 140, '時計遺伝子の異常マウス（スライド42）', '#ffc9c9', 21);
    TXT(S.mouse, 52, 166, 'マウスで認められた所見', C.mute, 16);
    S.rows = [['Clock異常マウス', '高脂血症・高血糖'], ['Bmal1欠損マウス', '高脂血症・耐糖能異常'], ['Per2欠損マウス', '肥満'], ['Cry1/Cry2欠損マウス', '食塩感受性高血圧']].map(([a, b], i) => {
      const r = E('g', {}, S.mouse), y = 222 + i * 70;
      E('rect', { x: 50, y: y - 28, width: 500, height: 52, rx: 8, fill: 'rgba(255,168,168,.08)' }, r);
      TXT(r, 66, y + 6, a, C.txt, 19);
      arrow(r, `M282 ${y} H312`, '#ffa8a8', 3);
      TXT(r, 324, y + 6, b, '#ffd8a8', 19);
      return r;
    });
    TXT(S.mouse, 52, 528, '時計遺伝子（約10種類）はほとんどの生物に認められる', C.mute, 16);
    S.trend = E('g', {}, S.dis);
    E('rect', { x: 600, y: 170, width: 570, height: 376, rx: 14, fill: 'rgba(255,255,255,.04)', stroke: '#66d9e8', 'stroke-width': 2 }, S.trend);
    TXT(S.trend, 620, 204, '概日時計機構の破綻と疾患（スライド43）', '#c5f6fa', 20);
    E('rect', { x: 618, y: 222, width: 196, height: 306, rx: 8, fill: 'rgba(102,217,232,.12)', stroke: '#66d9e8', 'stroke-width': 1.5 }, S.trend);
    [['Genetic', 1], ['FASPS (per2, CK1δ)', 0], ['DSPS (per3)', 0], ['Environmental', 1], ['Behavioural', 0], ['  desynchronisation', 0], ['sleep restriction', 0], ['shift work', 0], ['Physiological', 1], ['Aging', 0]].forEach(([s, b], i) =>
      TXT(S.trend, 628, 248 + i * 28, s, b ? '#fff' : '#c5f6fa', 16, b ? {} : IT));
    arrow(S.trend, 'M818 375 H836', '#66d9e8', 5);
    const bc = E('g', {}, S.trend);
    E('circle', { cx: 880, cy: 375, r: 40, fill: '#1d2533', stroke: '#adb5bd', 'stroke-width': 3 }, bc);
    E('path', { d: 'M860 350 L878 372 L866 392 M878 372 L902 362 M878 372 L892 404', fill: 'none', stroke: '#e9ecef', 'stroke-width': 1.5 }, bc);
    E('line', { x1: 880, y1: 375, x2: 880, y2: 348, stroke: '#fff', 'stroke-width': 3 }, bc);
    E('line', { x1: 880, y1: 375, x2: 898, y2: 392, stroke: '#fff', 'stroke-width': 3 }, bc);
    TXT(S.trend, 942, 240, '関連（図の矢印）', C.mute, 16);
    S.outs = [['Sleep disorders', '睡眠障害'], ['Cancer', 'がん'], ['Affective disorders', '感情障害'], ['Metabolic syndrome', 'メタボリックシンドローム'], ['Inflammation', '炎症']].map(([en, ja], i) => {
      const o = E('g', {}, S.trend), y = 272 + i * 56;
      arrow(o, `M920 ${375 + (y - 375) * 0.25} L940 ${y - 6}`, '#66d9e8', 4);
      TXT(o, 948, y, en, '#fff', 16);
      TXT(o, 948, y + 20, ja, '#c5f6fa', 16);
      return o;
    });
    return S;
  },

  frame(S, t) {
    op(S.loop, fadeIn(t, 0, 0.04) * (1 - fadeIn(t, 0.76, 0.78)));
    const h = phi(t), hh = h % 24;
    const bound = EZ(seg(t, 0.06, 0.14));
    const cyc = (t >= 0.16 && t < 0.52) || (t >= 0.64 && t < 0.76);
    const a = cyc ? ACT(hh) : 0, p = (t >= 0.16 && t < 0.52) || t >= 0.64 ? PC(hh) : 0;
    // BMAL1 arrives along the loop end, Clock from above
    at(S.bmal, L(150, 262, bound), L(300, 206, bound));
    at(S.clk, L(334, 334, bound), L(120, 206, bound));
    op(S.bmal, fadeIn(t, 0.05, 0.07)); op(S.clk, fadeIn(t, 0.05, 0.07));
    // transcription from E/E'-box
    op(S.txArr, 0.2 + 0.8 * a); op(S.txOn, a);
    S.ebox.setAttribute('stroke-width', 2 + 3 * a);
    op(S.aProd, 0.35 + 0.65 * a); op(S.aRev, 0.35 + 0.65 * a); op(S.aRor, 0.35 + 0.65 * a);
    const pathPt = (el, u) => { const L0 = el.getTotalLength(); return el.getPointAtLength(L0 * u); };
    S.dots.forEach((d, i) => {
      const u = (t * 60 + i / S.dots.length) % 1, pt = pathPt(S.aProd, u);
      d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); op(d, a > 0.15 ? a : 0);
    });
    // Per–Cry accumulate and inhibit BMAL1–Clock
    const pv = Math.max(p, 0.12 * fadeIn(t, 0.04, 0.06));
    at(S.per, 630, 134, 0.75 + 0.35 * p); at(S.cry, 690, 134, 0.75 + 0.35 * p);
    op(S.per, 0.2 + 0.8 * pv); op(S.cry, 0.2 + 0.8 * pv);
    op(S.inh, 0.2 + 0.8 * p);
    S.inh.firstChild.setAttribute('stroke-width', 3 + 3 * p);
    // RRE branch: Rev-erbα ⊣ RRE, RORα → RRE → BMAL1 → loop
    const rre = t >= 0.52 && t < 0.64 ? 1 : 0;
    const rf = Math.max(rre * fadeIn(t, 0.52, 0.54), 0.35 * fadeIn(t, 0.04, 0.06));
    op(S.rev, rf); op(S.ror, rf); op(S.revInh, rf); op(S.rorAct, rf);
    op(S.bArr, 0.25 + 0.75 * rre * fadeIn(t, 0.56, 0.58)); op(S.aLoop, 0.35 + 0.65 * rre);
    S.rdots.forEach((d, i) => {
      const el = i % 2 ? S.aRor : S.aRev, u = (t * 50 + i / 6) % 1, pt = pathPt(el, u);
      d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); op(d, rre && t < 0.56 ? 1 : 0);
    });
    S.bdots.forEach((d, i) => {
      const u = (t * 30 + i / 5) % 1, pt = pathPt(S.aLoop, u);
      d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); op(d, rre && t >= 0.57 ? 1 : 0);
    });
    // notes
    let n1 = '', n2 = '';
    if (t >= 0.06 && t < 0.16) { n1 = "BMAL1とClockがE/E'-boxに結合"; n2 = '時計遺伝子による転写の調節'; }
    else if (cyc && t < 0.52) {
      if (a >= p) { n1 = 'Per, Cry, Rev-erbα, RORα が転写される'; n2 = 'Per・Cryが少しずつ蓄積'; }
      else if (p > 0.15) { n1 = 'Per–CryがBMAL1–Clockを抑える'; n2 = '自分自身の転写を止める＝負のフィードバック'; }
      else { n1 = 'Per・Cryが減ると抑制が外れる'; n2 = '再び転写が始まる'; }
    } else if (rre) { n1 = 'Rev-erbα ⊣ RRE ／ RORα → RRE'; n2 = 'BMAL1の転写を調節 → BMAL1がループに戻る'; }
    else if (t >= 0.64 && t < 0.76) { n1 = 'このループがくり返され、約24時間のリズムになる'; n2 = ''; }
    S.note.textContent = n1; S.note2.textContent = n2;
    // dial
    const G = S.G, ang = (h / 24) * 2 * Math.PI - Math.PI / 2;
    S.hand.setAttribute('x2', G.cx + Math.cos(ang) * (G.R - 30)); S.hand.setAttribute('y2', G.cy + Math.sin(ang) * (G.R - 30));
    const cx = G.gx0 + ((G.gx1 - G.gx0) * h) / 48;
    S.cur.setAttribute('x1', cx); S.cur.setAttribute('x2', cx);
    op(S.dial, fadeIn(t, 0.02, 0.06) * (rre ? 0.45 : 1) * (1 - fadeIn(t, 0.76, 0.78)));
    // disease panels
    op(S.dis, fadeIn(t, 0.76, 0.78));
    S.rows.forEach((r, i) => op(r, fadeIn(t, 0.78 + i * 0.022, 0.79 + i * 0.022)));
    op(S.trend, fadeIn(t, 0.88, 0.9));
    S.outs.forEach((o, i) => op(o, fadeIn(t, 0.91 + i * 0.015, 0.92 + i * 0.015)));
  },
};

export default clock;
