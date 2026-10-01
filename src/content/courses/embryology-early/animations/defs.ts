// @ts-nocheck — drawing code in the same style as histology-cytoplasm/animations/defs.ts
/**
 * Mechanism animations for 初期発生と系統発生. Each rig builds its SVG scene once
 * and redraws it for a normalised time t ∈ [0,1]; step scripts live in scripts.json.
 */
import { E, L, CL, EZ, seg, kf, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const lbl = (svg, x, y, text, fill, size = 18, anchor = 'middle') => { const t = E('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-weight': 700, opacity: 0 }, svg); t.textContent = text; return t; };

export const ANIM_DEFS: Record<string, AnimDef> = {
/* ---------------- fertilization ---------------- */
fert: {
  hud: (t) => [t < 0.12 ? '接近' : t < 0.24 ? '① 放線冠' : t < 0.36 ? '② 先体反応' : t < 0.48 ? '③ 透明帯' : t < 0.58 ? '④ 膜の融合' : t < 0.76 ? '表層・透明帯反応' : t < 0.9 ? '⑤ 前核の形成' : '核膜の消失', 'STEP'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [0.08, 0, 0, 1200, 675], [0.14, 120, 120, 640, 360], [0.48, 160, 120, 640, 360], [0.56, 260, 150, 700, 394], [0.76, 260, 150, 700, 394], [0.84, 350, 180, 520, 293], [1, 350, 180, 520, 293]]),
  build(svg) {
    glowDefs(svg); const S = {}; const cx = 640, cy = 340;
    S.cor = []; for (let i = 0; i < 30; i++) { const a = (i / 30) * 6.283; S.cor.push({ a, c: E('circle', { r: 20, fill: '#2c2645', stroke: '#8f7fd6', 'stroke-width': 2 }, svg) }); }
    S.zona = E('circle', { cx, cy, r: 175, fill: 'none', stroke: '#8fd6ff', 'stroke-width': 18 }, svg);
    E('circle', { cx, cy, r: 150, fill: '#3a2335', stroke: '#ff8a9a', 'stroke-width': 3 }, svg);
    S.ca = E('circle', { cx: 0, cy: 0, r: 0, fill: 'rgba(245,197,66,.18)', stroke: '#f5c542', 'stroke-width': 3, opacity: 0 }, svg);
    S.gr = []; for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283; S.gr.push({ a, c: E('circle', { r: 6, fill: '#e3263f' }, svg) }); }
    S.fem = E('circle', { cx: cx + 30, cy: cy - 10, r: 26, fill: '#7a3d6a', stroke: '#ffd1d8', 'stroke-width': 3 }, svg);
    S.male = E('circle', { r: 0, fill: '#2b5f8a', stroke: '#8fd6ff', 'stroke-width': 3, opacity: 0 }, svg);
    S.pb = E('circle', { cx: cx + 60, cy: cy - 162, r: 10, fill: '#f5c542', opacity: 0 }, svg);
    S.others = [0, 1, 2].map((i) => { const g = E('g', {}, svg); E('ellipse', { rx: 12, ry: 8, fill: '#8fd6ff' }, g); E('path', { d: 'M12 0 C30 -8 40 10 62 0', stroke: '#8fd6ff', 'stroke-width': 3, fill: 'none' }, g); return g; });
    S.hero = E('g', {}, svg); S.acro = E('ellipse', { cx: -6, cy: 0, rx: 9, ry: 9, fill: '#f5c542' }, S.hero); E('ellipse', { rx: 13, ry: 9, fill: '#8fd6ff' }, S.hero); S.tail = E('path', { stroke: '#8fd6ff', 'stroke-width': 3, fill: 'none' }, S.hero);
    S.L = { fem: lbl(svg, cx + 30, cy + 40, '女性前核', '#ffd1d8', 16), male: lbl(svg, cx - 60, cy + 40, '男性前核', '#8fd6ff', 16), pb: lbl(svg, cx + 110, cy - 175, '二次極体', '#f5c542', 15), zr: lbl(svg, cx, cy - 205, '透明帯反応：多精を防ぐ', '#8fd6ff', 18), ca: lbl(svg, cx, cy + 190, 'Caオシレーション（sERからCa²⁺）', '#f5c542', 16) };
    S.cx = cx; S.cy = cy; return S;
  },
  frame(S, t) {
    const { cx, cy } = S;
    const part = seg(t, 0.12, 0.24);
    S.cor.forEach((o, i) => { const near = Math.abs(((o.a - Math.PI + 9.42) % 6.283) - 3.14) < 0.5; const r = 208 + (near ? 40 * EZ(part) : 0); o.c.setAttribute('cx', cx + Math.cos(o.a) * r); o.c.setAttribute('cy', cy + Math.sin(o.a) * r); });
    // hero sperm path: from left → through corona → zona → oolemma
    const [hx, hy] = kf(t, [[0, 200, 330], [0.12, 400, 340], [0.24, 440, 340], [0.36, 455, 340], [0.48, 488, 340], [0.58, 492, 340], [0.8, 560, 345]]);
    S.hero.setAttribute('transform', `translate(${hx},${hy})`);
    const w = Math.sin(t * 160) * 8 * (t < 0.58 ? 1 : 0);
    S.tail.setAttribute('d', `M-13 0 C-30 ${w} -40 ${-w} -${t < 0.6 ? 70 : L(70, 0, seg(t, 0.6, 0.66))} 0`);
    S.acro.setAttribute('opacity', t < 0.3 ? 1 : 1 - seg(t, 0.3, 0.34)); S.acro.setAttribute('filter', t > 0.26 && t < 0.34 ? 'url(#gl)' : '');
    S.hero.setAttribute('opacity', t < 0.78 ? 1 : 1 - seg(t, 0.78, 0.82));
    // other sperm arrive late and bounce off the hardened zona
    S.others.forEach((g, i) => { const a = 2.4 + i * 0.6; const u = seg(t, 0.55 + i * 0.03, 0.72 + i * 0.03); const r = u < 0.6 ? L(330, 196, u / 0.6) : L(196, 240, (u - 0.6) / 0.4); g.setAttribute('transform', `translate(${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}) rotate(${(a * 180) / Math.PI})`); g.setAttribute('opacity', t > 0.55 ? 1 - seg(t, 0.86, 0.9) : 0); });
    // Ca wave and cortical granules
    const ca = seg(t, 0.56, 0.68); S.ca.setAttribute('cx', 492); S.ca.setAttribute('cy', 340); S.ca.setAttribute('r', L(0, 300, ca)); S.ca.setAttribute('opacity', ca > 0 && ca < 1 ? 1 - ca : 0);
    S.ca.setAttribute('clip-path', ''); S.L.ca.setAttribute('opacity', t > 0.56 && t < 0.72 ? 1 : 0);
    const rel = seg(t, 0.6, 0.7);
    S.gr.forEach((o) => { const r = rel < 1 ? L(138, 160, rel) : 160; o.c.setAttribute('cx', cx + Math.cos(o.a) * r); o.c.setAttribute('cy', cy + Math.sin(o.a) * r); o.c.setAttribute('opacity', 1 - seg(t, 0.68, 0.72)); });
    const zr = seg(t, 0.66, 0.74); S.zona.setAttribute('stroke', zr > 0.5 ? '#c9ecff' : '#8fd6ff'); S.zona.setAttribute('stroke-width', L(18, 24, zr)); S.zona.setAttribute('filter', t > 0.66 && t < 0.78 ? 'url(#gl)' : '');
    S.L.zr.setAttribute('opacity', t > 0.68 && t < 0.86 ? 1 : 0);
    // pronuclei, second polar body, approach and loss of envelopes
    const mp = seg(t, 0.78, 0.86); S.male.setAttribute('r', L(8, 24, mp)); S.male.setAttribute('opacity', mp > 0 ? 1 : 0);
    const ap = EZ(seg(t, 0.88, 0.96));
    S.male.setAttribute('cx', L(575, 625, ap)); S.male.setAttribute('cy', L(345, 335, ap));
    S.fem.setAttribute('cx', L(cx + 30, 657, ap));
    const env = 1 - seg(t, 0.95, 1); S.male.setAttribute('stroke-opacity', env); S.fem.setAttribute('stroke-opacity', env);
    S.pb.setAttribute('opacity', seg(t, 0.78, 0.82)); S.L.pb.setAttribute('opacity', t > 0.78 && t < 0.92 ? 1 : 0);
    S.L.fem.setAttribute('opacity', t > 0.82 ? 1 : 0); S.L.male.setAttribute('opacity', t > 0.82 ? 1 : 0);
  },
},

/* ---------------- cleavage → blastocyst → implantation ---------------- */
cleave: {
  hud: (t) => [t < 0.12 ? '接合子' : t < 0.26 ? '30時間' : t < 0.4 ? '40時間' : t < 0.58 ? '3〜4日' : t < 0.7 ? '4日ごろ' : t < 0.82 ? '4.5日' : '5.5〜6日', 'AFTER FERTILIZATION'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [1, 0, 0, 1200, 675]]),
  build(svg) {
    glowDefs(svg); const S = {};
    // oviduct (left) opening into the uterus (right); endometrium on the far right
    E('path', { d: 'M40 300 C200 200 380 260 560 300 C700 330 760 300 820 280', fill: 'none', stroke: '#5a2430', 'stroke-width': 120, 'stroke-linecap': 'round', opacity: 0.55 }, svg);
    E('path', { d: 'M820 120 Q1140 120 1160 340 Q1140 560 820 560 Z', fill: '#3a1a26', opacity: 0.8 }, svg);
    S.endo = E('path', { d: 'M1040 150 Q1170 340 1040 530', fill: 'none', stroke: '#e3263f', 'stroke-width': 26, opacity: 0.7 }, svg);
    E('text', { x: 90, y: 200, fill: '#ff8a9a', 'font-size': 18 }, svg).textContent = '卵管膨大部';
    E('text', { x: 900, y: 110, fill: '#ff8a9a', 'font-size': 18 }, svg).textContent = '子宮';
    E('text', { x: 1000, y: 590, fill: '#ff8a9a', 'font-size': 16 }, svg).textContent = '子宮内膜（後壁）';
    S.emb = E('g', {}, svg);
    S.zona = E('circle', { r: 46, fill: 'none', stroke: '#8fd6ff', 'stroke-width': 6 }, S.emb);
    S.cells = []; for (let i = 0; i < 16; i++) S.cells.push(E('circle', { fill: '#ffd1d8', stroke: '#e3263f', 'stroke-width': 1.5 }, S.emb));
    S.cav = E('circle', { r: 0, fill: '#1a2433', opacity: 0 }, S.emb);
    S.icm = E('ellipse', { rx: 0, ry: 0, fill: '#3fb6ff', opacity: 0 }, S.emb);
    S.tro = E('circle', { r: 0, fill: 'none', stroke: '#3ddc97', 'stroke-width': 7, opacity: 0 }, S.emb);
    S.inv = E('path', { fill: '#3ddc97', opacity: 0 }, svg);
    S.L = { stage: lbl(svg, 600, 520, '', '#fff', 22), icm: lbl(svg, 0, 0, '内細胞塊（ICM）→ 胎児', '#3fb6ff', 15, 'start'), ocm: lbl(svg, 0, 0, '外細胞塊（OCM）→ 胎盤', '#3ddc97', 15, 'start') };
    return S;
  },
  frame(S, t) {
    const [x, y] = kf(t, [[0, 140, 290], [0.12, 220, 270], [0.26, 360, 275], [0.4, 520, 300], [0.58, 700, 310], [0.7, 860, 320], [0.82, 960, 330], [0.92, 1010, 335], [1, 1020, 336]]);
    S.emb.setAttribute('transform', `translate(${x},${y})`);
    const stage = t < 0.12 ? 1 : t < 0.26 ? 2 : t < 0.4 ? 4 : t < 0.58 ? 16 : 16;
    const blast = seg(t, 0.62, 0.74);
    S.cells.forEach((c, i) => {
      let cx = 0, cy = 0, r = 0;
      if (stage === 1) { if (i === 0) r = 34; }
      else if (stage === 2) { if (i < 2) { cx = i ? 17 : -17; r = 22; } }
      else if (stage === 4) { if (i < 4) { cx = i % 2 ? 15 : -15; cy = i < 2 ? -15 : 15; r = 17; } }
      else { const a = (i / 16) * 6.283; const rr = L(i < 8 ? 18 : 28, 40, blast); cx = Math.cos(a) * rr * (i < 8 ? (1 - blast * 0.4) : 1); cy = Math.sin(a) * rr; r = L(11, 7, blast); if (blast > 0.3 && i < 8) r = 0; }
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      const inner = stage === 16 && i < 8, col = t > 0.5 ? (inner ? '#3fb6ff' : '#3ddc97') : '#ffd1d8';
      c.setAttribute('fill', col);
    });
    S.zona.setAttribute('opacity', t < 0.62 ? 1 : 1 - seg(t, 0.62, 0.68)); S.zona.setAttribute('stroke-dasharray', t > 0.6 ? '20 14' : '');
    S.cav.setAttribute('r', L(0, 32, blast)); S.cav.setAttribute('opacity', blast > 0 ? 1 : 0);
    S.icm.setAttribute('cx', 22); S.icm.setAttribute('rx', L(0, 14, blast)); S.icm.setAttribute('ry', L(0, 22, blast)); S.icm.setAttribute('opacity', blast > 0 ? 1 : 0);
    S.tro.setAttribute('r', L(0, 40, blast)); S.tro.setAttribute('opacity', blast > 0 ? 1 : 0);
    // implantation: trophoblast on the ICM side invades the endometrium
    const imp = seg(t, 0.84, 1);
    S.inv.setAttribute('d', `M${x + 38} ${y - 26} Q${x + 70 + 40 * imp} ${y} ${x + 38} ${y + 26} Z`); S.inv.setAttribute('opacity', imp > 0 ? 0.9 : 0);
    S.endo.setAttribute('filter', imp > 0 ? 'url(#gl)' : '');
    S.L.stage.textContent = t < 0.12 ? '接合子（卵管膨大部で受精）' : t < 0.26 ? '2細胞期（発生30時間）' : t < 0.4 ? '4細胞期（発生40時間）' : t < 0.58 ? '桑実胚（発生第3〜4日）' : t < 0.7 ? 'ハッチング：透明帯の消失（第4日ごろ）' : t < 0.82 ? '胚盤胞（第4.5日）：胚結節と栄養膜' : '着床（第5.5〜6日）：ICM側の栄養膜が侵入';
    S.L.stage.setAttribute('opacity', 1);
    const showIcm = t > 0.5 && t < 0.84;
    S.L.icm.setAttribute('x', x + 50); S.L.icm.setAttribute('y', y - 50); S.L.icm.setAttribute('opacity', showIcm ? 1 : 0);
    S.L.ocm.setAttribute('x', x + 50); S.L.ocm.setAttribute('y', y + 66); S.L.ocm.setAttribute('opacity', showIcm ? 1 : 0);
    S.L.icm.textContent = t < 0.74 ? '内細胞塊（ICM）→ 胎児' : 'ICM → 胚結節';
    S.L.ocm.textContent = t < 0.74 ? '外細胞塊（OCM）→ 胎盤' : 'OCM → 栄養膜';
  },
},

/* ---------------- gastrulation (bilaminar → trilaminar) ---------------- */
gast: {
  hud: (t) => [t < 0.15 ? '第2週' : t < 0.3 ? '第3週' : t < 0.55 ? '内胚葉' : t < 0.8 ? '中胚葉' : '3層性胚盤', 'STAGE'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [0.15, 0, 0, 1200, 675], [0.3, 300, 140, 600, 338], [0.8, 300, 140, 600, 338], [0.92, 0, 0, 1200, 675], [1, 0, 0, 1200, 675]]),
  build(svg) {
    glowDefs(svg); const S = {};
    E('path', { d: 'M180 290 Q600 40 1020 290', fill: 'rgba(63,182,255,.06)', stroke: '#d98c6c', 'stroke-width': 4 }, svg);
    E('path', { d: 'M180 360 Q600 620 1020 360', fill: 'rgba(245,197,66,.06)', stroke: '#d98c6c', 'stroke-width': 4 }, svg);
    E('text', { x: 600, y: 150, fill: '#d98c6c', 'font-size': 18, 'text-anchor': 'middle' }, svg).textContent = '羊膜腔';
    E('text', { x: 600, y: 530, fill: '#d98c6c', 'font-size': 18, 'text-anchor': 'middle' }, svg).textContent = '卵黄嚢';
    S.epi = []; for (let i = 0; i < 26; i++) S.epi.push(E('circle', { r: 15, fill: '#3fb6ff' }, svg));
    S.hypo = []; for (let i = 0; i < 26; i++) S.hypo.push(E('circle', { r: 13, fill: '#f5c542' }, svg));
    S.mov = []; for (let i = 0; i < 18; i++) S.mov.push(E('circle', { r: 13, fill: '#3fb6ff' }, svg));
    S.streak = E('path', { d: 'M600 286 l-16 -26 h32 z', fill: '#fff', opacity: 0 }, svg);
    S.L = { epi: lbl(svg, 170, 300, '胚盤葉上層', '#3fb6ff', 17, 'end'), hypo: lbl(svg, 170, 352, '胚盤葉下層', '#f5c542', 17, 'end'), ps: lbl(svg, 600, 240, '原始線条（原始結節・原始窩）', '#fff', 17), ecto: lbl(svg, 1030, 300, '外胚葉', '#3fb6ff', 18, 'start'), meso: lbl(svg, 1030, 330, '中胚葉', '#ff6f6f', 18, 'start'), endo: lbl(svg, 1030, 362, '内胚葉', '#ffb347', 18, 'start') };
    return S;
  },
  frame(S, t) {
    const X = (i) => 210 + i * 31;
    const ps = seg(t, 0.15, 0.3);
    S.streak.setAttribute('opacity', ps); S.L.ps.setAttribute('opacity', t > 0.18 && t < 0.86 ? 1 : 0);
    S.epi.forEach((c, i) => { c.setAttribute('cx', X(i)); c.setAttribute('cy', 300 + (Math.abs(X(i) - 600) < 30 ? 10 * ps : 0)); c.setAttribute('fill', t > 0.86 ? '#3fb6ff' : '#3fb6ff'); });
    const repl = seg(t, 0.3, 0.55);
    S.hypo.forEach((c, i) => { c.setAttribute('cx', X(i)); c.setAttribute('cy', 352); const done = repl * 13 > Math.abs(i - 12.5); c.setAttribute('fill', done ? '#ffb347' : '#f5c542'); c.setAttribute('stroke', done ? '#fff' : 'none'); });
    // cells dive through the streak: first half replace the hypoblast (endoderm), the rest spread between the layers (mesoderm)
    S.mov.forEach((c, i) => {
      const isEndo = i < 8, st = isEndo ? 0.3 + i * 0.025 : 0.55 + (i - 8) * 0.022, u = seg(t, st, st + 0.12);
      const side = i % 2 ? 1 : -1, k = isEndo ? Math.floor(i / 2) + 1 : Math.floor((i - 8) / 2) + 1;
      const tx = 600 + side * k * (isEndo ? 62 : 70), ty = isEndo ? 352 : 326;
      const x = u < 0.35 ? L(600 + side * 40, 600, u / 0.35) : L(600, tx, EZ((u - 0.35) / 0.65));
      const y = u < 0.35 ? 300 : L(300, ty, EZ((u - 0.35) / 0.65));
      c.setAttribute('cx', x); c.setAttribute('cy', y);
      c.setAttribute('opacity', u > 0 && (isEndo ? u < 1 : true) ? 1 : 0);
      c.setAttribute('fill', isEndo ? '#3fb6ff' : u >= 1 ? '#ff6f6f' : '#3fb6ff');
      c.setAttribute('r', isEndo ? 13 : 11);
    });
    S.L.epi.setAttribute('opacity', t < 0.86 ? 1 : 0); S.L.hypo.setAttribute('opacity', t < 0.55 ? 1 : 0);
    S.L.endo.setAttribute('opacity', seg(t, 0.5, 0.55)); S.L.meso.setAttribute('opacity', seg(t, 0.78, 0.8)); S.L.ecto.setAttribute('opacity', seg(t, 0.84, 0.86));
  },
},
};
