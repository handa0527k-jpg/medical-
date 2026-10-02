// @ts-nocheck — drawing code in the same style as histology-cytoplasm/animations/defs.ts
/**
 * Mechanism animations for 上皮組織. Each rig builds its SVG scene once and
 * redraws it for a normalised time t ∈ [0,1]; step scripts live in scripts.json.
 */
import { E, L, EZ, seg, kf, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const lbl = (svg, x, y, text, fill, size = 18, anchor = 'middle') => { const t = E('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-weight': 700, opacity: 0 }, svg); t.textContent = text; return t; };
const op = (el, v) => el.setAttribute('opacity', Math.max(0, Math.min(1, v)));
const CELL = '#3a2335', EDGE = '#ff8a9a', NUC = '#7a3d6a';

export const ANIM_DEFS: Record<string, AnimDef> = {
/* ---------------- tight junction: barrier, fence, tricellular corner ---------------- */
barrier: {
  hud: (t) => [t < 0.12 ? '上皮細胞' : t < 0.3 ? '密着帯なし（仮定）' : t < 0.5 ? 'バリア' : t < 0.68 ? 'フェンス' : t < 0.85 ? '3細胞の接点' : 'アンギュリン-1 KO', 'TIGHT JUNCTION'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [0.66, 0, 0, 1200, 675], [0.72, 560, 60, 640, 360], [1, 560, 60, 640, 360]]),
  build(svg) {
    glowDefs(svg); const S = {};
    E('rect', { x: 0, y: 0, width: 760, height: 150, fill: '#101828' }, svg);
    E('text', { x: 30, y: 40, fill: '#8fd6ff', 'font-size': 18 }, svg).textContent = '内腔（外の世界）';
    E('rect', { x: 0, y: 540, width: 760, height: 135, fill: '#1d1a14' }, svg);
    E('text', { x: 30, y: 640, fill: '#d9a35f', 'font-size': 18 }, svg).textContent = '支持組織側（体の中）';
    E('path', { d: 'M0 540 H760', stroke: '#f5c542', 'stroke-width': 6 }, svg);
    // three columnar cells, separated by intercellular spaces
    S.cells = [0, 1, 2].map((i) => { const x = 40 + i * 240; E('rect', { x, y: 150, width: 200, height: 390, rx: 16, fill: CELL, stroke: EDGE, 'stroke-width': 3 }, svg); E('ellipse', { cx: x + 100, cy: 400, rx: 40, ry: 52, fill: NUC }, svg); return x; });
    // apical (blue) and basolateral (purple) membrane domains, shown in the fence step
    S.apic = [0, 1, 2].map((i) => E('path', { d: `M${44 + i * 240} 190 V160 Q${44 + i * 240} 152 ${56 + i * 240} 152 H${224 + i * 240} Q${236 + i * 240} 152 ${236 + i * 240} 160 V190`, fill: 'none', stroke: '#3fb6ff', 'stroke-width': 7, opacity: 0 }, svg));
    S.baso = [0, 1, 2].map((i) => E('path', { d: `M${44 + i * 240} 200 V530 M${236 + i * 240} 200 V530`, stroke: '#b69cff', 'stroke-width': 7, opacity: 0 }, svg));
    // tight junction seals at the top of each intercellular space
    S.tj = [0, 1].map((i) => { const g = E('g', { opacity: 0 }, svg); for (let k = 0; k < 4; k++) E('rect', { x: 242 + i * 240, y: 158 + k * 9, width: 36, height: 5, rx: 2, fill: '#3fb6ff' }, g); return g; });
    // solute particles in the lumen
    S.p = []; for (let i = 0; i < 26; i++) S.p.push(E('circle', { r: 7, fill: '#f5c542' }, svg));
    // membrane proteins (fence)
    S.mp = []; for (let i = 0; i < 6; i++) S.mp.push(E('rect', { width: 12, height: 12, rx: 3, fill: i < 3 ? '#3fb6ff' : '#b69cff', opacity: 0 }, svg));
    // tricellular corner, top view (right side)
    const T = E('g', { opacity: 0 }, svg); S.top = T;
    E('rect', { x: 556, y: 56, width: 648, height: 368, fill: '#0d1119' }, T);
    E('text', { x: 590, y: 100, fill: '#8d94a8', 'font-size': 16 }, T).textContent = '上から見た3つの細胞の接点';
    const vx = 880, vy = 250;
    S.vx = vx; S.vy = vy;
    E('path', { d: `M${vx} ${vy} V140 M${vx} ${vy} L${vx - 140} ${vy + 90} M${vx} ${vy} L${vx + 140} ${vy + 90}`, stroke: '#3fb6ff', 'stroke-width': 12 }, T);
    S.cse = E('circle', { cx: vx, cy: vy, r: 16, fill: '#e3263f' }, T);
    S.ang = E('circle', { cx: vx, cy: vy, r: 26, fill: 'none', stroke: '#3ddc97', 'stroke-width': 7 }, T);
    S.hole = E('circle', { cx: vx, cy: vy, r: 0, fill: '#05060a', stroke: '#ffc15e', 'stroke-width': 3, 'stroke-dasharray': '5 4' }, T);
    S.leak = []; for (let i = 0; i < 6; i++) S.leak.push(E('circle', { r: 6, fill: '#f5c542', opacity: 0 }, T));
    S.L = {
      leak: lbl(svg, 380, 600, '仮に目地がふさがれていなければ、物質は細胞の間を通り抜ける', '#ffc15e', 18),
      bar: lbl(svg, 380, 600, '密着帯：細胞間隙を通る水・物質の移動を阻止（バリア）', '#8fd6ff', 18),
      fen: lbl(svg, 380, 600, '密着帯：膜蛋白質の移動を阻止（頂上領域 ⇔ 基底外側領域）', '#b69cff', 18),
      tj: lbl(svg, 380, 136, '密着帯（TJストランド）', '#3fb6ff', 16),
      tri: lbl(svg, 880, 365, 'トリセルリン（赤）とアンギュリン（緑）がCSEをつくり、角をふさぐ', '#3ddc97', 15),
      ko: lbl(svg, 880, 365, 'アンギュリン-1 KO：CSE欠損 → 細胞間隙 → バリア低下', '#ffc15e', 15),
    };
    return S;
  },
  frame(S, t) {
    const sealed = t >= 0.3;
    S.tj.forEach((g) => op(g, seg(t, 0.3, 0.36)));
    op(S.L.tj, t > 0.32 && t < 0.68 ? 1 : 0);
    // particles: before sealing some slip down the gaps; after sealing they bounce at the junction
    S.p.forEach((c, i) => {
      const lane = i % 2, gx = 260 + lane * 240 + ((i * 7) % 3 - 1) * 4;
      const ph = (t * 3 + i * 0.137) % 1;
      let x = 60 + ((i * 53) % 640), y = 60 + ((i * 29) % 80);
      if (t > 0.1 && t < 0.3 && i < 12) { // leak path (hypothetical)
        const u = (ph * 1.6) % 1; x = u < 0.3 ? L(x, gx, u / 0.3) : gx; y = u < 0.3 ? L(y, 150, u / 0.3) : L(150, 600, (u - 0.3) / 0.7);
      } else if (sealed && t < 0.68 && i < 12) { // blocked at the seal
        const u = ph; x = u < 0.5 ? L(x, gx, u / 0.5) : L(gx, x, (u - 0.5) / 0.5); y = u < 0.5 ? L(y, 150, u / 0.5) : L(150, y, (u - 0.5) / 0.5);
      }
      c.setAttribute('cx', x); c.setAttribute('cy', y); op(c, t < 0.7 ? 1 : 0);
    });
    op(S.L.leak, t > 0.12 && t < 0.29 ? 1 : 0); op(S.L.bar, t > 0.34 && t < 0.5 ? 1 : 0); op(S.L.fen, t > 0.52 && t < 0.68 ? 1 : 0);
    // fence: domains coloured, proteins slide along the membrane but turn back at the junction
    const fen = seg(t, 0.5, 0.54) * (1 - seg(t, 0.66, 0.7));
    S.apic.forEach((p) => op(p, fen)); S.baso.forEach((p) => op(p, fen));
    S.mp.forEach((r, i) => {
      const apical = i < 3, cx = 40 + (i % 3) * 240;
      const w = Math.sin(t * 40 + i) * 0.5 + 0.5;
      const x = apical ? cx + 30 + w * 140 : cx - 2 + (i % 2) * 196, y = apical ? 146 : 220 + w * 280;
      r.setAttribute('x', x); r.setAttribute('y', y); op(r, fen);
    });
    // tricellular corner
    op(S.top, seg(t, 0.68, 0.74));
    const ko = seg(t, 0.85, 0.9);
    op(S.cse, 1 - ko); op(S.ang, 1 - ko); S.hole.setAttribute('r', L(0, 14, ko));
    op(S.L.tri, t > 0.72 && t < 0.85 ? 1 : 0); op(S.L.ko, t > 0.88 ? 1 : 0);
    S.leak.forEach((c, i) => { const u = (t * 5 + i / 6) % 1; c.setAttribute('cx', S.vx + Math.cos(i) * L(60, 0, u)); c.setAttribute('cy', S.vy + Math.sin(i) * L(60, 0, u)); op(c, ko > 0.5 ? 1 - u : 0); });
  },
},

/* ---------------- junctional complex, top to bottom, then the basal surface ---------------- */
junc: {
  hud: (t) => [t < 0.12 ? '2つの細胞' : t < 0.26 ? '密着帯' : t < 0.44 ? '接着帯' : t < 0.62 ? 'デスモゾーム' : t < 0.8 ? 'ギャップ結合' : 'ヘミデスモゾーム', 'JUNCTIONS'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [0.1, 0, 0, 1200, 675], [0.14, 250, 0, 700, 394], [0.26, 250, 20, 700, 394], [0.3, 250, 120, 700, 394], [0.44, 250, 120, 700, 394], [0.48, 250, 260, 700, 394], [0.62, 250, 260, 700, 394], [0.66, 250, 380, 700, 394], [0.8, 250, 380, 700, 394], [0.84, 120, 520, 900, 506], [1, 120, 520, 900, 506]]),
  build(svg) {
    glowDefs(svg); const S = {}; const xA = 560, xB = 640; // membranes of cell A (left) and cell B (right)
    E('rect', { x: 0, y: 0, width: 1200, height: 1100, fill: '#0b0f17' }, svg);
    E('rect', { x: 100, y: 40, width: xA - 100, height: 920, rx: 30, fill: CELL, stroke: EDGE, 'stroke-width': 4 }, svg);
    E('rect', { x: xB, y: 40, width: 1100 - xB, height: 920, rx: 30, fill: CELL, stroke: EDGE, 'stroke-width': 4 }, svg);
    E('text', { x: 300, y: 90, fill: '#ffd1d8', 'font-size': 22 }, svg).textContent = '細胞A';
    E('text', { x: 860, y: 90, fill: '#ffd1d8', 'font-size': 22 }, svg).textContent = '細胞B';
    E('path', { d: 'M60 990 H1140', stroke: '#f5c542', 'stroke-width': 10 }, svg);
    E('text', { x: 600, y: 1040, fill: '#f5c542', 'font-size': 20, 'text-anchor': 'middle' }, svg).textContent = '基底膜（ラミニン・IV型コラーゲン）';
    // TJ (y 120-200): membranes pinched together with strand dots
    S.tj = E('g', { opacity: 0 }, svg);
    E('path', { d: `M${xA} 110 Q600 160 ${xA} 210 M${xB} 110 Q600 160 ${xB} 210`, stroke: '#3fb6ff', 'stroke-width': 6, fill: 'none' }, S.tj);
    for (let k = 0; k < 5; k++) E('circle', { cx: 600, cy: 125 + k * 18, r: 6, fill: '#3fb6ff' }, S.tj);
    // AJ (y 260-380): cadherin pairs + Ca ions + actin belts
    S.cad = []; for (let k = 0; k < 6; k++) S.cad.push(E('path', { d: '', stroke: '#3ddc97', 'stroke-width': 6, 'stroke-linecap': 'round' }, svg));
    S.ca = []; for (let k = 0; k < 6; k++) S.ca.push(E('circle', { r: 5, fill: '#ffc15e', opacity: 0 }, svg));
    S.act = E('g', { opacity: 0 }, svg);
    for (let k = 0; k < 4; k++) { E('path', { d: `M${xA - 30 - k * 10} 250 q-30 70 0 140`, stroke: '#ff8a9a', 'stroke-width': 3, fill: 'none' }, S.act); E('path', { d: `M${xB + 30 + k * 10} 250 q30 70 0 140`, stroke: '#ff8a9a', 'stroke-width': 3, fill: 'none' }, S.act); }
    // desmosome (y 430-540): plaques + cadherin-family + keratin hairpins
    S.ds = E('g', { opacity: 0 }, svg);
    E('rect', { x: xA - 30, y: 440, width: 22, height: 90, rx: 6, fill: '#d98c6c' }, S.ds); E('rect', { x: xB + 8, y: 440, width: 22, height: 90, rx: 6, fill: '#d98c6c' }, S.ds);
    for (let k = 0; k < 5; k++) E('path', { d: `M${xA} ${450 + k * 18} H${xB}`, stroke: '#ffd1d8', 'stroke-width': 4 }, S.ds);
    S.ker = E('g', { opacity: 0 }, svg);
    for (let k = 0; k < 4; k++) { E('path', { d: `M${xA - 30} ${450 + k * 20} C${xA - 200} ${400 + k * 30} ${xA - 200} ${560} ${xA - 30} ${462 + k * 20}`, stroke: '#f5c542', 'stroke-width': 3, fill: 'none' }, S.ker); E('path', { d: `M${xB + 30} ${450 + k * 20} C${xB + 200} ${400 + k * 30} ${xB + 200} ${560} ${xB + 30} ${462 + k * 20}`, stroke: '#f5c542', 'stroke-width': 3, fill: 'none' }, S.ker); }
    // gap junction (y 620-720): connexons + passing small molecules
    S.cx = []; for (let k = 0; k < 4; k++) { const g = E('g', { opacity: 0 }, svg); E('rect', { x: xA - 18, y: 620 + k * 28, width: 36, height: 16, rx: 4, fill: '#b69cff' }, g); E('rect', { x: xB - 18, y: 620 + k * 28, width: 36, height: 16, rx: 4, fill: '#b69cff' }, g); E('path', { d: `M${xA - 18} ${628 + k * 28} H${xB + 18}`, stroke: '#1a1430', 'stroke-width': 4 }, g); S.cx.push(g); }
    S.mol = []; for (let k = 0; k < 6; k++) S.mol.push(E('circle', { r: 5, fill: '#8fd6ff', opacity: 0 }, svg));
    // hemidesmosome (y 940-990): integrin to basement membrane + keratin
    S.hd = E('g', { opacity: 0 }, svg);
    for (const x of [300, 840]) { E('rect', { x: x - 30, y: 935, width: 60, height: 18, rx: 4, fill: '#e3263f' }, S.hd); for (let k = 0; k < 3; k++) E('path', { d: `M${x - 18 + k * 18} 953 V988`, stroke: '#3ddc97', 'stroke-width': 5 }, S.hd); E('path', { d: `M${x} 935 C${x - 60} 850 ${x + 60} 840 ${x + 20} 930`, stroke: '#f5c542', 'stroke-width': 3, fill: 'none' }, S.hd); }
    // labels sit at the top of each zoomed view, centred, with a dark halo so they stay legible over the drawing
    const halo = (t) => { t.setAttribute('stroke', '#0b0f17'); t.setAttribute('stroke-width', 7); t.setAttribute('paint-order', 'stroke'); return t; };
    S.L = {
      tj: halo(lbl(svg, 600, 140, '密着帯：0.1〜0.3 nm、オクルディン・クローディン', '#3fb6ff', 19)),
      aj: halo(lbl(svg, 600, 240, '接着帯：15〜20 nm、カドヘリン＋アクチン線維', '#3ddc97', 19)),
      ds: halo(lbl(svg, 600, 380, 'デスモゾーム：約30 nm、プラーク＋ケラチン線維', '#f5c542', 19)),
      gj: halo(lbl(svg, 600, 500, 'ギャップ結合：2〜3 nm、コネクソン、1 kDa以下', '#b69cff', 19)),
      hd: halo(lbl(svg, 600, 610, 'ヘミデスモゾーム：インテグリン → 基底膜、ケラチン線維', '#e3263f', 22)),
    };
    S.xA = xA; S.xB = xB; return S;
  },
  frame(S, t) {
    op(S.tj, seg(t, 0.12, 0.18)); op(S.L.tj, t > 0.14 && t < 0.3 ? 1 : 0);
    // cadherins zip up when Ca arrives
    const z = EZ(seg(t, 0.3, 0.4));
    S.cad.forEach((p, k) => { const y = 270 + k * 18, reach = L(10, 40, z); p.setAttribute('d', `M${S.xA} ${y} h${reach} M${S.xB} ${y} h${-reach}`); op(p, seg(t, 0.26, 0.3)); });
    S.ca.forEach((c, k) => { const u = seg(t, 0.28 + k * 0.01, 0.38 + k * 0.01); c.setAttribute('cx', 600 + Math.sin(k * 2) * 10); c.setAttribute('cy', L(180, 272 + k * 18, u)); op(c, u > 0 && t < 0.46 ? 1 : 0); });
    op(S.act, seg(t, 0.38, 0.43)); op(S.L.aj, t > 0.32 && t < 0.48 ? 1 : 0);
    op(S.ds, seg(t, 0.47, 0.52)); op(S.ker, seg(t, 0.53, 0.6)); op(S.L.ds, t > 0.5 && t < 0.66 ? 1 : 0);
    S.cx.forEach((g, k) => op(g, seg(t, 0.64 + k * 0.02, 0.67 + k * 0.02)));
    S.mol.forEach((c, k) => { const u = (t * 6 + k / 6) % 1, lane = k % 4; c.setAttribute('cx', L(S.xA - 60, S.xB + 60, u)); c.setAttribute('cy', 628 + lane * 28); op(c, t > 0.72 && t < 0.82 ? 1 : 0); });
    op(S.L.gj, t > 0.66 && t < 0.84 ? 1 : 0);
    op(S.hd, seg(t, 0.84, 0.9)); op(S.L.hd, t > 0.86 ? 1 : 0);
  },
},

/* ---------------- transitional epithelium: contracted ⇄ stretched ---------------- */
trans: {
  hud: (t) => [t < 0.2 ? '収縮時' : t < 0.65 ? '伸展中' : t < 0.82 ? '伸展時' : '収縮', 'URINARY BLADDER'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [1, 0, 0, 1200, 675]]),
  build(svg) {
    glowDefs(svg); const S = {};
    E('rect', { x: 0, y: 0, width: 1200, height: 140, fill: '#14202c' }, svg);
    E('text', { x: 40, y: 50, fill: '#8fd6ff', 'font-size': 18 }, svg).textContent = '内腔（尿）';
    S.bm = E('path', { d: '', stroke: '#f5c542', 'stroke-width': 7 }, svg);
    E('rect', { x: 0, y: 560, width: 1200, height: 115, fill: '#1d1a14' }, svg);
    // 18 cells: 6 superficial (dome), 12 deeper; each cell keeps a thin stalk to the basement membrane
    S.cells = []; for (let i = 0; i < 18; i++) { const g = E('g', {}, svg); const stalk = E('path', { stroke: EDGE, 'stroke-width': 2, 'stroke-dasharray': '4 4', fill: 'none', opacity: 0 }, g); const body = E('rect', { rx: 16, fill: i < 6 ? '#4a2f45' : CELL, stroke: EDGE, 'stroke-width': 2.5 }, g); const nuc = E('circle', { r: 9, fill: NUC }, g); S.cells.push({ stalk, body, nuc, sup: i < 6 }); }
    S.wbar = E('path', { stroke: '#3ddc97', 'stroke-width': 5, fill: 'none' }, svg);
    S.L = { sup: lbl(svg, 600, 110, '被蓋細胞（最上層）：扁平にならない', '#ffd1d8', 18), down: lbl(svg, 600, 110, '重なっていた細胞が基底膜側に落ちこむ → 層の数が減る', '#3ddc97', 18), area: lbl(svg, 600, 620, '上皮の表面積が広がる', '#3ddc97', 18), all: lbl(svg, 600, 620, 'すべての細胞が基底膜に付着すると考えられている', '#f5c542', 18) };
    return S;
  },
  frame(S, t) {
    const s = EZ(seg(t, 0.2, 0.65)) * (1 - EZ(seg(t, 0.82, 1)));   // 0 = contracted, 1 = stretched
    const W = L(560, 1080, s), x0 = 600 - W / 2, base = 540;
    S.bm.setAttribute('d', `M${x0 - 20} ${base + 6} H${x0 + W + 20}`);
    // contracted: 3 rows (6 superficial on top), stretched: 2 rows
    S.cells.forEach((c, i) => {
      // contracted: 3 rows of 6 (superficial cells on top); stretched: superficial row + one row of 12
      const row0 = c.sup ? 0 : i < 12 ? 1 : 2, col0 = c.sup ? i : (i - 6) % 6;
      // the deeper rows interleave into one row (even / odd slots) so cells slide down rather than across
      const n1 = c.sup ? 6 : 12, col1 = c.sup ? i : i < 12 ? 2 * (i - 6) : 2 * (i - 12) + 1;
      const w0 = W / 6, w1 = W / n1;
      const x = L(x0 + col0 * w0, x0 + col1 * w1, s);
      const h = c.sup ? 112 : L(92, 104, s);
      const y = L(base - (3 - row0) * 100 + (c.sup ? -12 : 4), c.sup ? base - 222 : base - 106, s);
      const w = L(w0 - 6, w1 - 4, s);
      c.body.setAttribute('x', x); c.body.setAttribute('y', y); c.body.setAttribute('width', Math.max(10, w)); c.body.setAttribute('height', h);
      c.nuc.setAttribute('cx', x + w / 2); c.nuc.setAttribute('cy', y + h / 2);
      c.stalk.setAttribute('d', `M${x + w / 2} ${y + h} V${base + 2}`); op(c.stalk, t > 0.66 && t < 0.82 && c.sup ? 0.9 : 0);
    });
    S.wbar.setAttribute('d', `M${x0} 150 H${x0 + W}`); op(S.wbar, seg(t, 0.3, 0.4));
    op(S.L.sup, t < 0.2 ? seg(t, 0.04, 0.08) : 0); op(S.L.down, t > 0.24 && t < 0.62 ? 1 : 0);
    op(S.L.area, t > 0.5 && t < 0.66 ? 1 : 0); op(S.L.all, t > 0.68 && t < 0.82 ? 1 : 0);
  },
},
};
