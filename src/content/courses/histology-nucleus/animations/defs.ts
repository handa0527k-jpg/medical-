// @ts-nocheck — drawing code in the same style as histology-cytoplasm/animations/defs.ts
/**
 * Mechanism animations for 核・細胞周期. Each rig builds its SVG scene once and
 * redraws it for a normalised time t ∈ [0,1]; step scripts live in scripts.json.
 */
import { E, L, CL, EZ, seg, kf, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

const wave = (x0, y0, len, amp, ph, n = 24) => {
  let d = '';
  for (let i = 0; i <= n; i++) { const u = i / n; d += (i ? 'L' : 'M') + (x0 + len * u).toFixed(1) + ' ' + (y0 + Math.sin(u * 12 + ph) * amp).toFixed(1); }
  return d;
};

export const ANIM_DEFS: Record<string, AnimDef> = {
/* ---------------- ribosome assembly ---------------- */
ribo: {
  hud: (t) => [t < 0.12 ? '線維中心' : t < 0.3 ? '線維部' : t < 0.55 ? '顆粒部' : t < 0.72 ? '核膜孔' : '細胞質', 'LOCATION'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [0.06, 0, 0, 1200, 675], [0.1, 80, 120, 620, 349], [0.3, 80, 120, 620, 349], [0.4, 120, 60, 760, 427], [0.56, 120, 60, 760, 427], [0.66, 400, 200, 700, 394], [0.74, 560, 180, 640, 360], [0.96, 560, 180, 640, 360], [1, 0, 0, 1200, 675]]),
  build(svg) {
    glowDefs(svg); const S = {};
    // nucleus (left) and its envelope with two pores
    E('path', { d: 'M0 0 H640 C660 200 660 470 640 675 H0Z', fill: '#120f1f' }, svg);
    E('path', { d: 'M640 0 C660 200 660 470 640 675', fill: 'none', stroke: '#b69cff', 'stroke-width': 6, 'stroke-dasharray': '170 34 200 34 400' }, svg);
    E('path', { d: 'M656 0 C676 200 676 470 656 675', fill: 'none', stroke: '#8fd6ff', 'stroke-width': 6, 'stroke-dasharray': '170 34 200 34 400' }, svg);
    E('text', { x: 30, y: 40, fill: '#d6b8ff', 'font-size': 22, 'font-weight': 700 }, svg).textContent = '核';
    E('text', { x: 1080, y: 40, fill: '#8fd6ff', 'font-size': 22, 'font-weight': 700 }, svg).textContent = '細胞質';
    E('text', { x: 690, y: 196, fill: '#f5c542', 'font-size': 18 }, svg).textContent = '核膜孔';
    E('text', { x: 690, y: 432, fill: '#f5c542', 'font-size': 18 }, svg).textContent = '核膜孔';
    // nucleolus
    S.pg = E('circle', { cx: 330, cy: 340, r: 170, fill: '#1d1636', stroke: '#3a3358', 'stroke-width': 3 }, svg);
    S.dots = [];
    for (let i = 0; i < 120; i++) { const a = i * 2.39996, r = 70 + ((i * 53) % 95); S.dots.push(E('circle', { cx: 330 + Math.cos(a) * r, cy: 340 + Math.sin(a) * r, r: 3, fill: '#c9b6ff', opacity: 0.35 }, svg)); }
    S.pf = E('circle', { cx: 330, cy: 340, r: 70, fill: '#5b3d96' }, svg);
    S.fc = E('circle', { cx: 330, cy: 340, r: 38, fill: '#e9e2ff' }, svg);
    E('text', { x: 330, y: 535, fill: '#c9b6ff', 'font-size': 18, 'text-anchor': 'middle' }, svg).textContent = '核小体';
    // rRNA strands
    S.rna = []; for (let i = 0; i < 6; i++) S.rna.push(E('path', { fill: 'none', stroke: '#ff4d63', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, svg));
    // ribosomal proteins from the cytoplasm
    S.prot = []; for (let i = 0; i < 10; i++) S.prot.push(E('circle', { r: 7, fill: '#f5c542', filter: 'url(#gl)', opacity: 0 }, svg));
    S.protL = E('text', { x: 900, y: 120, fill: '#f5c542', 'font-size': 18, opacity: 0 }, svg); S.protL.textContent = 'リボソーム蛋白質（細胞質で翻訳）';
    // subunits
    S.small = E('ellipse', { rx: 22, ry: 15, fill: '#ff8a3d', stroke: '#ffd1a8', 'stroke-width': 2, opacity: 0 }, svg);
    S.large = E('ellipse', { rx: 34, ry: 24, fill: '#3fb6ff', stroke: '#c9ecff', 'stroke-width': 2, opacity: 0 }, svg);
    S.subL = E('text', { fill: '#fff', 'font-size': 16, opacity: 0 }, svg); S.subL.textContent = '大小の亜粒子';
    // mRNA in the cytoplasm
    S.mrna = E('path', { fill: 'none', stroke: '#3ddc97', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 }, svg);
    S.mL = E('text', { x: 760, y: 560, fill: '#3ddc97', 'font-size': 18, opacity: 0 }, svg); S.mL.textContent = 'mRNA';
    S.done = E('text', { x: 850, y: 300, fill: '#fff', 'font-size': 22, 'font-weight': 700, opacity: 0 }, svg); S.done.textContent = 'リボソーム完成';
    return S;
  },
  frame(S, t) {
    // transcription: FC glows, strands grow out into the fibrous part
    S.fc.setAttribute('filter', t > 0.04 && t < 0.3 ? 'url(#gl)' : '');
    const tr = EZ(seg(t, 0.1, 0.3));
    S.rna.forEach((p, i) => {
      const a = (i / 6) * 6.283 + 0.3, len = 20 + 60 * tr;
      const x0 = 330 + Math.cos(a) * 36, y0 = 340 + Math.sin(a) * 36;
      let d = `M${x0} ${y0}`;
      for (let k = 1; k <= 10; k++) { const u = k / 10, r = 36 + len * u; d += ` L${(330 + Math.cos(a + Math.sin(u * 9 + i) * 0.12) * r).toFixed(1)} ${(340 + Math.sin(a + Math.sin(u * 9 + i) * 0.12) * r).toFixed(1)}`; }
      p.setAttribute('d', d); p.setAttribute('opacity', t < 0.1 ? 0 : t < 0.5 ? 1 : 1 - seg(t, 0.5, 0.56));
    });
    S.pf.setAttribute('filter', t > 0.12 && t < 0.3 ? 'url(#gl)' : '');
    // proteins: cytoplasm → pore (y≈210) → granular part
    S.protL.setAttribute('opacity', t > 0.12 && t < 0.4 ? 1 : 0);
    S.prot.forEach((c, i) => {
      const st = 0.14 + i * 0.012, u = seg(t, st, st + 0.2);
      const [x, y] = kf(u, [[0, 980 + (i % 4) * 40, 150 + (i % 3) * 30], [0.45, 700, 210], [0.6, 630, 210], [1, 330 + Math.cos(i * 1.7) * 120, 340 + Math.sin(i * 1.7) * 110]]);
      c.setAttribute('cx', x); c.setAttribute('cy', y);
      c.setAttribute('opacity', t < st ? 0 : t < 0.5 ? 1 : 1 - seg(t, 0.5, 0.55));
    });
    S.dots.forEach((d) => d.setAttribute('opacity', t > 0.4 && t < 0.56 ? 0.9 : 0.35));
    // subunits form in the granular part, leave through the lower pore
    const form = seg(t, 0.44, 0.54);
    const [sx, sy] = kf(t, [[0.54, 430, 430], [0.64, 640, 444], [0.72, 800, 470], [0.84, 860, 480]]);
    const [lx, ly] = kf(t, [[0.54, 470, 380], [0.66, 640, 444], [0.74, 820, 420], [0.86, 820, 420], [0.94, 860, 446]]);
    S.small.setAttribute('cx', sx); S.small.setAttribute('cy', sy); S.small.setAttribute('opacity', form);
    S.large.setAttribute('cx', lx); S.large.setAttribute('cy', ly); S.large.setAttribute('opacity', form);
    S.small.setAttribute('filter', t > 0.76 && t < 0.86 ? 'url(#gl)' : '');
    S.subL.setAttribute('x', 420); S.subL.setAttribute('y', 500); S.subL.setAttribute('opacity', t > 0.46 && t < 0.62 ? 1 : 0);
    // mRNA appears and binds the small subunit, then the large one docks
    const m = seg(t, 0.74, 0.8);
    S.mrna.setAttribute('d', wave(700, 498, 320 * m, 4, t * 30)); S.mrna.setAttribute('opacity', m > 0 ? 1 : 0);
    S.mL.setAttribute('opacity', m > 0.5 ? 1 : 0);
    const fin = t > 0.94;
    S.large.setAttribute('filter', fin ? 'url(#gl)' : '');
    S.done.setAttribute('opacity', seg(t, 0.94, 0.97));
  },
},

/* ---------------- mitosis ---------------- */
mitosis: {
  hud: (t) => [t < 0.06 ? '間期' : t < 0.3 ? '前期' : t < 0.44 ? '前中期' : t < 0.58 ? '中期' : t < 0.72 ? '後期A' : t < 0.8 ? '後期B' : '終期', 'PHASE'],
  cam: (t) => kf(t, [[0, 0, 0, 1200, 675], [0.08, 0, 0, 1200, 675], [0.14, 300, 120, 600, 338], [0.28, 200, 60, 800, 450], [0.5, 200, 60, 800, 450], [0.58, 0, 0, 1200, 675], [1, 0, 0, 1200, 675]]),
  build(svg) {
    glowDefs(svg); const S = {};
    S.cell = E('path', { fill: '#0f1420', stroke: '#5a6b8c', 'stroke-width': 4 }, svg);
    S.mt = []; for (let i = 0; i < 40; i++) S.mt.push(E('path', { fill: 'none', stroke: '#3ddc97', 'stroke-width': 2, opacity: 0 }, svg));
    S.env = E('circle', { cx: 600, cy: 340, r: 160, fill: 'rgba(182,156,255,.06)', stroke: '#b69cff', 'stroke-width': 5, 'stroke-dasharray': '30 8' }, svg);
    S.nl = E('circle', { cx: 650, cy: 380, r: 28, fill: '#6b4fb8' }, svg);
    S.nlL = E('text', { x: 690, y: 430, fill: '#c9b6ff', 'font-size': 17 }, svg); S.nlL.textContent = '核小体';
    S.env2 = [0, 1].map(() => E('circle', { r: 0, fill: 'none', stroke: '#b69cff', 'stroke-width': 4, 'stroke-dasharray': '22 7', opacity: 0 }, svg));
    const col = ['#ff6f9c', '#ff6f9c', '#3fb6ff', '#3fb6ff'];
    S.chr = col.map((c, i) => {
      const g = E('g', {}, svg);
      const loose = E('path', { fill: 'none', stroke: c, 'stroke-width': 3, opacity: 0.8 }, g);
      const a = E('path', { stroke: c, 'stroke-width': 13, 'stroke-linecap': 'round', fill: 'none' }, g);
      const b = E('path', { stroke: c, 'stroke-width': 13, 'stroke-linecap': 'round', fill: 'none' }, g);
      const k = E('circle', { r: 6, fill: '#f5c542' }, g);
      return { loose, a, b, k, i };
    });
    S.poles = [0, 1].map(() => { const g = E('g', {}, svg); E('rect', { x: -12, y: -5, width: 24, height: 10, rx: 3, fill: '#e3263f' }, g); E('rect', { x: -5, y: -12, width: 10, height: 24, rx: 3, fill: '#ff8a9a' }, g); return g; });
    S.plate = E('path', { d: 'M600 160 V520', stroke: '#f5c542', 'stroke-width': 2, 'stroke-dasharray': '6 8', opacity: 0 }, svg);
    S.plateL = E('text', { x: 612, y: 172, fill: '#f5c542', 'font-size': 17, opacity: 0 }, svg); S.plateL.textContent = '赤道板';
    return S;
  },
  frame(S, t) {
    const cond = EZ(seg(t, 0.06, 0.2));
    // poles: centrosome separates (prophase), poles move apart (anaphase B)
    const sep = EZ(seg(t, 0.1, 0.28)), pb = EZ(seg(t, 0.72, 0.8));
    const P = [[L(585, 330, sep) - 70 * pb, L(170, 340, sep)], [L(615, 870, sep) + 70 * pb, L(170, 340, sep)]];
    S.poles.forEach((g, i) => g.setAttribute('transform', `translate(${P[i][0]},${P[i][1]})`));
    // cell outline with cleavage furrow
    const pinch = EZ(seg(t, 0.82, 0.98)), rx = 400 + 50 * pb, cx = 600, cy = 340, ry = 250;
    let top = '', bot = '';
    for (let k = 0; k <= 60; k++) {
      const x = cx - rx + (2 * rx * k) / 60, v = Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)), f = 1 - pinch * 0.96 * Math.exp(-(((x - cx) / 70) ** 2));
      top += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + (cy - ry * v * f).toFixed(1);
      bot = 'L' + x.toFixed(1) + ' ' + (cy + ry * v * f).toFixed(1) + bot;
    }
    S.cell.setAttribute('d', top + bot + 'Z');
    // nuclear envelope: gone in prometaphase; nucleolus gone in prophase
    S.env.setAttribute('opacity', 1 - seg(t, 0.3, 0.36));
    S.nl.setAttribute('opacity', 1 - seg(t, 0.12, 0.2)); S.nlL.setAttribute('opacity', 1 - seg(t, 0.12, 0.18));
    // chromosome positions
    const start = [[540, 290], [660, 300], [560, 400], [650, 400]];
    const meta = EZ(seg(t, 0.36, 0.5)), ana = EZ(seg(t, 0.6, 0.72));
    const ys = [165, 235, 305, 375];
    S.chr.forEach((c, i) => {
      const x = L(start[i][0], 600, meta), y = L(start[i][1], ys[i], meta);
      const off = 7 + ana * (180 + 70 * pb) * 1;
      const ax = x - (ana > 0 ? off : 7), bx = x + (ana > 0 ? off : 7);
      const len = L(18, 26, cond);
      const tilt = ana * 18;
      c.a.setAttribute('d', `M${ax - tilt} ${y - len} Q${ax + tilt * 0.4} ${y} ${ax - tilt} ${y + len}`);
      c.b.setAttribute('d', `M${bx + tilt} ${y - len} Q${bx - tilt * 0.4} ${y} ${bx + tilt} ${y + len}`);
      c.a.setAttribute('opacity', cond); c.b.setAttribute('opacity', cond);
      c.loose.setAttribute('d', wave(start[i][0] - 50, start[i][1], 100, 10, i));
      c.loose.setAttribute('opacity', 0.8 * (1 - cond));
      c.k.setAttribute('cx', ana > 0 ? ax + tilt * 0.4 : x); c.k.setAttribute('cy', y); c.k.setAttribute('opacity', cond * (t > 0.3 ? 1 : 0.4));
      c.pos = [x, y, ax, bx];
    });
    // spindle: astral + polar MTs from prophase; kinetochore MTs attach in prometaphase
    const grow = seg(t, 0.16, 0.3), att = seg(t, 0.32, 0.42);
    let j = 0;
    const set = (d, op) => { const p = S.mt[j++]; p.setAttribute('d', d); p.setAttribute('opacity', op); };
    P.forEach(([px, py], s) => {
      const dir = s ? -1 : 1;
      for (let k = 0; k < 4; k++) { const a = (k - 1.5) * 0.5 + (s ? Math.PI : 0); set(`M${px} ${py} L${px + Math.cos(a + Math.PI) * 70 * grow} ${py + Math.sin(a + Math.PI) * 70 * grow}`, 0.7 * grow); }
      for (let k = 0; k < 3; k++) set(`M${px} ${py} L${px + dir * 300 * grow} ${py + (k - 1) * 60 * grow}`, 0.5 * grow * (1 - pinch));
      S.chr.forEach((c) => { const tx = s ? c.pos[3] : c.pos[2]; set(`M${px} ${py} L${L(px + dir * 120, tx, att)} ${L(py, c.pos[1], att)}`, att * (1 - pinch * 0.8)); });
    });
    while (j < S.mt.length) S.mt[j++].setAttribute('opacity', 0);
    S.plate.setAttribute('opacity', t > 0.48 && t < 0.6 ? 1 : 0); S.plateL.setAttribute('opacity', t > 0.48 && t < 0.6 ? 1 : 0);
    // telophase: envelopes re-form around each set
    const re = seg(t, 0.86, 0.97);
    S.env2.forEach((c, i) => { c.setAttribute('cx', i ? 600 + 180 + 70 * pb + 10 : 600 - 180 - 70 * pb - 10); c.setAttribute('cy', 270); c.setAttribute('r', L(40, 150, re)); c.setAttribute('opacity', re); });
  },
},

/* ---------------- intestinal cell renewal (BrdU) ---------------- */
renew: {
  hud: (t) => [`${Math.round(t * 48)} 時間`, 'AFTER BrdU'],
  cam: (t) => kf(t, [[0, 0, 70, 1200, 675], [1, 0, 70, 1200, 675]]),
  build(svg) {
    glowDefs(svg); const S = {};
    // left half of the epithelium: crypt bottom → crypt wall → villus side → tip
    const pts = [[380, 560], [380, 430], [520, 430], [550, 110], [600, 85]];
    const segs = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push([pts[i - 1], pts[i], l]); tot += l; }
    S.at = (u) => { let d = u * tot; for (const [a, b, l] of segs) { if (d <= l) { const k = d / l; return [L(a[0], b[0], k), L(a[1], b[1], k)]; } d -= l; } return pts[pts.length - 1]; };
    const half = (m) => pts.map(([x, y], i) => (i ? 'L' : 'M') + (m ? 1200 - x : x) + ' ' + y).join(' ');
    E('path', { d: 'M300 580 H900 V620 H300Z', fill: '#141a26' }, svg);
    E('path', { d: half(false), fill: 'none', stroke: '#5a6b8c', 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.35 }, svg);
    E('path', { d: half(true), fill: 'none', stroke: '#5a6b8c', 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.35 }, svg);
    E('text', { x: 700, y: 70, fill: '#aeb5c7', 'font-size': 20 }, svg).textContent = '絨毛の先端';
    E('text', { x: 360, y: 500, fill: '#aeb5c7', 'font-size': 20, 'text-anchor': 'end' }, svg).textContent = '陰窩';
    E('text', { x: 840, y: 500, fill: '#aeb5c7', 'font-size': 20 }, svg).textContent = '陰窩';
    E('text', { x: 600, y: 300, fill: '#aeb5c7', 'font-size': 20, 'text-anchor': 'middle' }, svg).textContent = '絨毛';
    S.stem = [E('circle', { cx: 380, cy: 552, r: 16, fill: 'none', stroke: '#3ddc97', 'stroke-width': 3 }, svg), E('circle', { cx: 820, cy: 552, r: 16, fill: 'none', stroke: '#3ddc97', 'stroke-width': 3 }, svg)];
    E('text', { x: 404, y: 604, fill: '#3ddc97', 'font-size': 17 }, svg).textContent = '幹細胞';
    S.cells = [];
    const N = 36;
    for (let k = 0; k < N; k++) for (const m of [0, 1]) S.cells.push({ u0: k / N, m, c: E('circle', { r: 9, stroke: '#0b0f17', 'stroke-width': 2 }, svg), n: E('circle', { r: 9, stroke: '#0b0f17', 'stroke-width': 2 }, svg) });
    return S;
  },
  frame(S, t) {
    const v = 0.85 * t;
    S.cells.forEach((o) => {
      const lab = o.u0 < 0.2; // cells in the lower crypt took up BrdU at 0 h
      const u = o.u0 + v;
      const place = (el, uu, labelled, shed) => {
        let [x, y] = S.at(Math.min(1, uu));
        if (shed > 0) { y -= shed * 80; x += (o.m ? 1 : -1) * shed * 30; }
        if (o.m) x = 1200 - x;
        el.setAttribute('cx', x.toFixed(1)); el.setAttribute('cy', y.toFixed(1));
        el.setAttribute('fill', labelled ? '#a0522d' : '#d9cfc0');
        el.setAttribute('opacity', shed > 0 ? CL(1 - shed) : 1);
      };
      if (u <= 1) { place(o.c, u, lab, 0); o.n.setAttribute('opacity', 0); }
      else { place(o.c, 1, lab, (u - 1) * 8); place(o.n, u - 1, false, 0); }
      o.c.setAttribute('filter', lab && t > 0.02 ? 'url(#gl)' : '');
    });
  },
},
};
