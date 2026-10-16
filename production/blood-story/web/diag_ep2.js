/* BLOOD STORY ― 体内を駆ける細胞たち ―
 * diag_ep2.js : 第2話「白血球、防御戦線！」のホログラム模式図 (Agent D-EP2)
 *
 * Plain script (no ES module). Load AFTER world.js, characters.js, diag_rbc.js (holoPanel) and diag_wbc.js
 * (wbcCell / bacterium / wbcTag / wbcChip / wbcStepper / phagocytosis). Extends window.BS.diag (never overwrites):
 *   wbcClassify, neutrophilDetail, receptorsOpsonin, phagolysosome, eosinophilCard, basophilHistamine,
 *   macrophageCard, antigenPresentation, lymphocyteCard, tbChart, nkAttack, bacteriaDivide
 *   + helpers macrophageCell, plasmaCell, lglCell, antibodyY, antibodyIcon, readyEP2, SIZE_EP2 (also merged into D.SIZE)
 *
 * Common opts (same convention as diag_rbc.js):
 *   (ctx, {x=960, y=540, scale=1, p=1, t=0, alpha=1, panel=true, on, title, accent, emitter=true})
 *   x, y   : canvas px of the PANEL CENTRE (the holo emitter sits ~70px·scale below the panel bottom)
 *   scale  : 1 = natural size (SIZE_EP2). All panels are ≤ 1640×900 → use scale ≈ 0.8–1.0 on a 1920×1080 frame
 *            and keep the panel above the subtitle band (y > 900).
 *   p      : story progress 0..1 (stage boundaries in each docstring; map voice beats onto them with keys()).
 *   t      : seconds — only idle wobble / shimmer / drift. Same opts ⇒ same picture (seeded randomness).
 *   panel  : false = content only (no hologram frame); on = override of the power-on (default seg(p,0,0.07)).
 *   title  : override of the panel title; accent: frame colour [r,g,b] (default holo teal, like Episode 1).
 * Every function wraps itself in save()/restore(). Fonts: 'ZenKaku, IPAGothic, sans-serif'
 * (μ ₂ ⁻ ³ fall back to IPAGothic — call BS.diag.readyEP2() before frame 1).
 * Medical content: lecture "血液" slides 13–25 (+ 47/48 for relative cell / granule sizes), following
 * episode_plan.md §6: neutrophil granules = slide 15 values, percentages = slides 13/18/19/20/22
 * (好塩基球 約0.5%), cell diameters are NOT labelled except 好中球 約12 μm and リンパ球 8〜9 μm.
 */
(function () {
  'use strict';
  var BS = (window.BS = window.BS || {});
  var D = (BS.diag = BS.diag || {});
  var TAU = Math.PI * 2;
  var FONT = 'ZenKaku, IPAGothic, sans-serif';
  function font(px) { return Math.max(1, px).toFixed(1) + 'px ' + FONT; }

  /* ------------------------------------------------------------------ utils */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function win(x, a, b) { return clamp((x - a) / (b - a), 0, 1); }
  function bell(x, a, b, c, d) { return smooth(a, b, x) * (1 - smooth(c, d, x)); }
  function eout(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function eio(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eback(x) { x = clamp(x, 0, 1); var c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function mod(a, n) { return ((a % n) + n) % n; }
  function rng(seed) {
    var s = (seed | 0) ^ 0x5bd1e995;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mixC(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a == null ? 1 : a, 0, 1).toFixed(4) + ')'; }
  var WHITE = [255, 255, 255], BLACK = [0, 0, 0];
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  var glowCache = {};
  function glowSprite(col) {
    var key = (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0);
    if (glowCache[key]) return glowCache[key];
    var c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.25, rgba(col, 0.55)); g.addColorStop(0.6, rgba(col, 0.12)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); glowCache[key] = c; return c;
  }
  /** additive soft glow (cached sprite → cheap) */
  function glow(ctx, x, y, r, col, a) {
    if (a <= 0.003 || r <= 0.5) return;
    var g0 = ctx.globalAlpha, op = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = g0 * clamp(a, 0, 1);
    ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = g0; ctx.globalCompositeOperation = op;
  }
  /** glowing stroke of the current path (diag_rbc.js style) */
  function gline(ctx, col, w, a, dash, dashOff) {
    if (a <= 0.003) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = dashOff || 0; }
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(col, 0.16 * a); ctx.lineWidth = w * 4; ctx.stroke();
    ctx.strokeStyle = rgba(col, 0.3 * a); ctx.lineWidth = w * 2; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = rgba(mixC(col, WHITE, 0.45), a); ctx.lineWidth = w; ctx.stroke();
    ctx.restore();
  }
  function sparkle(ctx, x, y, s, col, a, rot) {
    if (a <= 0.003 || s <= 0.2) return;
    glow(ctx, x, y, s * 1.7, col, 0.8 * a);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha *= clamp(a, 0, 1);
    ctx.fillStyle = rgba(mixC(col, WHITE, 0.6), 1); ctx.beginPath();
    for (var i = 0; i < 8; i++) { var ang = (i / 8) * TAU, r = i % 2 === 0 ? s : s * 0.16; ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* ----------------------------------------------------------- text helpers */
  /**
   * txt(ctx, s, x, y, {size=30, color, align='left', a=1, glow, base='middle', outline=true}) → width.
   * Fades + rises in with a (0..1). Dark outline + optional glow (shadowBlur only when glow given).
   */
  function txt(ctx, s, x, y, o) {
    o = o || {};
    var a = o.a == null ? 1 : o.a, size = o.size || 30;
    ctx.save(); ctx.font = font(size);
    var w = ctx.measureText(s).width;
    if (a <= 0.003) { ctx.restore(); return w; }
    ctx.globalAlpha *= smooth(0, 0.6, a);
    var yy = y + (1 - eout(a)) * size * 0.35;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle'; ctx.lineJoin = 'round';
    if (o.outline !== false) { ctx.lineWidth = size * 0.22; ctx.strokeStyle = 'rgba(4,8,18,0.86)'; ctx.strokeText(s, x, yy); }
    if (o.glow) { ctx.shadowColor = rgba(o.glow, 0.85); ctx.shadowBlur = size * 0.4; }
    ctx.fillStyle = rgba(o.color || [240, 248, 255], 1); ctx.fillText(s, x, yy);
    ctx.restore();
    return w;
  }
  function textW(ctx, s, size) { ctx.save(); ctx.font = font(size); var w = ctx.measureText(s).width; ctx.restore(); return w; }
  function tagW(ctx, s, x, y, o) { if (D.wbcTag) D.wbcTag(ctx, s, x, y, o); else txt(ctx, s, x, y, { size: o.size, a: o.grow, align: o.align }); }
  function chipW(ctx, s, x, y, o) { return D.wbcChip ? D.wbcChip(ctx, s, x, y, o) : txt(ctx, s, x, y, { size: o.size, a: o.alpha, align: o.align || 'center' }); }
  /** small dark sub-card with glowing border */
  function card(ctx, x, y, w, h, col, a, r) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalAlpha *= a;
    rrect(ctx, x, y, w, h, r || 18);
    var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(8,22,40,0.72)'); g.addColorStop(1, 'rgba(4,12,26,0.8)');
    ctx.fillStyle = g; ctx.fill();
    gline(ctx, col, 2, 0.75);
    ctx.fillStyle = rgba(col, 0.9); ctx.fillRect(x, y + 14, 6, Math.min(56, h - 28));
    ctx.restore();
  }
  /** partial polyline with arrow head (diag_rbc.js style). pts=[[x,y],...], a=0..1 drawn fraction */
  function arrowPts(ctx, pts, a, col, w, o) {
    o = o || {};
    if (a <= 0.002 || pts.length < 2) return;
    var L = [0], i;
    for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var tgt = L[L.length - 1] * clamp(a, 0, 1), ex = pts[0][0], ey = pts[0][1], dx = 1, dy = 0;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) {
      var sl = L[i] - L[i - 1];
      if (L[i] <= tgt) { ctx.lineTo(pts[i][0], pts[i][1]); ex = pts[i][0]; ey = pts[i][1]; }
      else { var f = sl > 0 ? (tgt - L[i - 1]) / sl : 0; ex = lerp(pts[i - 1][0], pts[i][0], f); ey = lerp(pts[i - 1][1], pts[i][1], f); ctx.lineTo(ex, ey); }
      if (sl > 0.01) { dx = (pts[i][0] - pts[i - 1][0]) / sl; dy = (pts[i][1] - pts[i - 1][1]) / sl; }
      if (L[i] > tgt) break;
    }
    var al = o.alpha == null ? 1 : o.alpha;
    gline(ctx, col, w, al, o.dash, o.dashOff);
    if (o.head !== false && a > 0.04) {
      var hs = o.headSize || w * 3 + 8;
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(Math.atan2(dy, dx)); ctx.globalAlpha *= al;
      ctx.beginPath(); ctx.moveTo(hs * 0.35, 0); ctx.lineTo(-hs * 0.85, -hs * 0.6); ctx.lineTo(-hs * 0.55, 0); ctx.lineTo(-hs * 0.85, hs * 0.6); ctx.closePath();
      ctx.fillStyle = rgba(mixC(col, WHITE, 0.4), 1); ctx.fill();
      ctx.restore();
    }
  }
  function arrow(ctx, x1, y1, x2, y2, a, col, w, o) { arrowPts(ctx, [[x1, y1], [x2, y2]], a, col, w || 4, o); }
  function fmt(n) { n = Math.round(n); var s = String(n); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ------------------------------------------------------------- panel frame */
  var TEAL = [134, 236, 255];
  /** opens the local frame (translate/scale/alpha) + hologram panel. Returns the content alpha (0 ⇒ caller restores & returns). */
  function begin(ctx, o, PW, PH, title, p, t) {
    var s = o.scale == null ? 1 : o.scale;
    ctx.save();
    ctx.translate(o.x == null ? 960 : o.x, o.y == null ? 540 : o.y); ctx.scale(s, s);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    var on = o.on != null ? o.on : win(p, 0, 0.07), ca = 1;
    if (o.panel !== false) {
      if (D.holoPanel) ca = D.holoPanel(ctx, { x: 0, y: 0, w: PW, h: PH, p: on, t: t, title: o.title == null ? title : o.title, accent: o.accent, emitter: o.emitter });
      else { ca = on; if (on > 0) { ctx.save(); ctx.globalAlpha *= on; rrect(ctx, -PW / 2, -PH / 2, PW, PH, 18); ctx.fillStyle = 'rgba(4,20,36,0.7)'; ctx.fill(); gline(ctx, TEAL, 2, 0.8); ctx.restore(); } }
    }
    ctx.globalAlpha *= ca;
    return ca;
  }
  function clipPanel(ctx, PW, PH, inset) { var i = inset || 6; rrect(ctx, -PW / 2 + i, -PH / 2 + i, PW - 2 * i, PH - 2 * i, 16); ctx.clip(); }

  /* ============================================================ CELL HELPERS */
  function cell(ctx, type, x, y, r, t, o) {
    o = o || {};
    if (D.wbcCell) D.wbcCell(ctx, { type: type, x: x, y: y, r: r, t: t, seed: o.seed == null ? 1 : o.seed, sil: o.sil, glow: o.glow == null ? 0.5 : o.glow, alpha: o.alpha, rot: o.rot });
    else { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#c8b8f0'; ctx.fill(); }
  }
  var REL = { neutrophil: 1.0, eosinophil: 1.08, basophil: 0.98, lymphocyte: 0.7, monocyte: 1.3 }; // slide 47 proportions
  var ACC = { neutrophil: [214, 180, 255], eosinophil: [255, 140, 112], basophil: [168, 110, 245], lymphocyte: [110, 196, 255], monocyte: [80, 214, 210] };
  var NAME = { neutrophil: '好中球', eosinophil: '好酸球', basophil: '好塩基球', lymphocyte: 'リンパ球', monocyte: '単球' };
  var PCT = { neutrophil: '60〜70%', eosinophil: '2〜3%', basophil: '約0.5%', lymphocyte: '25〜30%', monocyte: '約5%' };

  /**
   * antibodyY(ctx, x, y, ang, s, {col=[255,214,110], a=1, glow=0.4, light=true})
   * Y-shaped antibody. (x,y) = end of the Fc stem (tail); ang = direction tail → arms (Fab); s = total length.
   * Returns the Fab-tip midpoint [x,y].
   */
  function antibodyY(ctx, x, y, ang, s, o) {
    o = o || {};
    var a = o.a == null ? 1 : o.a; if (a <= 0.003) return [x, y];
    var col = o.col || [255, 214, 110], dx = Math.cos(ang), dy = Math.sin(ang), stem = 0.46 * s, arm = 0.56 * s, sp = 0.62;
    var hx = x + dx * stem, hy = y + dy * stem;
    var a1 = ang - sp, a2 = ang + sp;
    var t1 = [hx + Math.cos(a1) * arm, hy + Math.sin(a1) * arm], t2 = [hx + Math.cos(a2) * arm, hy + Math.sin(a2) * arm];
    ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.glow !== 0) glow(ctx, hx, hy, s * 0.9, col, 0.35 * (o.glow == null ? 1 : o.glow));
    function path() { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx, hy); ctx.moveTo(t1[0], t1[1]); ctx.lineTo(hx, hy); ctx.lineTo(t2[0], t2[1]); }
    path(); ctx.strokeStyle = 'rgba(10,6,20,0.9)'; ctx.lineWidth = s * 0.2; ctx.stroke();
    path(); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = s * 0.12; ctx.stroke();
    if (o.light !== false) { // light chains (outer side of each arm)
      ctx.beginPath();
      [[a1, -1], [a2, 1]].forEach(function (q) {
        var nx = -Math.sin(q[0]) * q[1] * s * 0.11, ny = Math.cos(q[0]) * q[1] * s * 0.11;
        ctx.moveTo(hx + Math.cos(q[0]) * arm * 0.45 + nx, hy + Math.sin(q[0]) * arm * 0.45 + ny);
        ctx.lineTo(hx + Math.cos(q[0]) * arm * 0.98 + nx, hy + Math.sin(q[0]) * arm * 0.98 + ny);
      });
      ctx.strokeStyle = 'rgba(10,6,20,0.85)'; ctx.lineWidth = s * 0.12; ctx.stroke();
      ctx.strokeStyle = rgba(mixC(col, WHITE, 0.45), 1); ctx.lineWidth = s * 0.065; ctx.stroke();
    }
    ctx.restore();
    return [(t1[0] + t2[0]) / 2, (t1[1] + t2[1]) / 2];
  }
  var IGCOL = { IgM: [255, 200, 90], IgG: [255, 214, 110], IgA: [140, 230, 170], IgE: [255, 120, 200] };
  /** antibodyIcon(ctx, cls ∈ IgM|IgG|IgA|IgE, x, y, s, a, rot) — IgM pentamer, IgA dimer, IgG/IgE monomer (centre = x,y). */
  function antibodyIcon(ctx, cls, x, y, s, a, rot) {
    if (a <= 0.003) return;
    var col = IGCOL[cls] || IGCOL.IgG, r0 = rot || 0, i;
    ctx.save(); ctx.globalAlpha *= a;
    if (cls === 'IgM') {
      for (i = 0; i < 5; i++) { var an = r0 - Math.PI / 2 + (i / 5) * TAU; antibodyY(ctx, x + Math.cos(an) * s * 0.12, y + Math.sin(an) * s * 0.12, an, s * 0.5, { col: col, glow: 0.3 }); }
      ctx.beginPath(); ctx.arc(x, y, s * 0.07, 0, TAU); ctx.fillStyle = rgba(mixC(col, WHITE, 0.5), 1); ctx.fill();
    } else if (cls === 'IgA') {
      antibodyY(ctx, x - s * 0.05, y, Math.PI + r0, s * 0.5, { col: col, glow: 0.3 });
      antibodyY(ctx, x + s * 0.05, y, r0, s * 0.5, { col: col, glow: 0.3 });
      ctx.beginPath(); ctx.arc(x, y, s * 0.06, 0, TAU); ctx.fillStyle = rgba(mixC(col, WHITE, 0.5), 1); ctx.fill();
    } else {
      antibodyY(ctx, x, y + s * 0.42, -Math.PI / 2 + r0, s * (cls === 'IgE' ? 0.9 : 0.84), { col: col });
    }
    ctx.restore();
  }
  /** complement C3b: small orange lumpy protein */
  function c3b(ctx, x, y, r, a, rot) {
    if (a <= 0.003) return;
    var col = [255, 156, 64];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha *= a;
    glow(ctx, 0, 0, r * 2.2, col, 0.35);
    ctx.beginPath(); ctx.arc(-r * 0.35, 0, r * 0.75, 0, TAU); ctx.arc(r * 0.45, -r * 0.15, r * 0.6, 0, TAU); ctx.arc(r * 0.2, r * 0.45, r * 0.5, 0, TAU);
    ctx.fillStyle = 'rgba(30,10,4,0.9)'; ctx.lineWidth = r * 0.35; ctx.strokeStyle = 'rgba(30,10,4,0.9)'; ctx.stroke();
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.2); g.addColorStop(0, '#ffd9a0'); g.addColorStop(1, rgba(col, 1));
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
  /** membrane receptor glyphs: (x,y) = membrane anchor, ang = outward direction, s = length. Returns tip [x,y]. */
  function receptor(ctx, kind, x, y, ang, s, a, lit) {
    var dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    if (a <= 0.003) return [x + dx * s, y + dy * s];
    var col = kind === 'tlr' ? [120, 245, 180] : kind === 'fc' ? [120, 190, 255] : kind === 'fce' ? [255, 130, 210] : [255, 200, 90];
    lit = lit || 0;
    ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (lit > 0.01) glow(ctx, x + dx * s * 0.7, y + dy * s * 0.7, s * 0.9, col, 0.7 * lit);
    var bright = mixC(col, WHITE, 0.35 + 0.4 * lit);
    // transmembrane segment
    ctx.beginPath(); ctx.moveTo(x - dx * s * 0.12, y - dy * s * 0.12); ctx.lineTo(x + dx * s * 0.08, y + dy * s * 0.08);
    ctx.strokeStyle = 'rgba(8,6,20,0.9)'; ctx.lineWidth = s * 0.14; ctx.stroke(); ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = s * 0.08; ctx.stroke();
    function stalk(len) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * len, y + dy * len);
      ctx.strokeStyle = 'rgba(8,6,20,0.9)'; ctx.lineWidth = s * 0.1; ctx.stroke(); ctx.strokeStyle = rgba(bright, 1); ctx.lineWidth = s * 0.05; ctx.stroke();
    }
    if (kind === 'tlr') {
      stalk(s * 0.4);
      var cx = x + dx * s * 0.68, cy = y + dy * s * 0.68, R = s * 0.27;
      ctx.beginPath(); ctx.arc(cx, cy, R, ang + 0.75, ang + TAU - 0.75);
      ctx.strokeStyle = 'rgba(8,6,20,0.9)'; ctx.lineWidth = s * 0.2; ctx.stroke(); ctx.strokeStyle = rgba(bright, 1); ctx.lineWidth = s * 0.12; ctx.stroke();
      // leucine-rich repeats ticks
      ctx.beginPath();
      for (var k = 0; k < 9; k++) { var aa = ang + 0.9 + (k / 8) * (TAU - 1.8); ctx.moveTo(cx + Math.cos(aa) * R * 0.78, cy + Math.sin(aa) * R * 0.78); ctx.lineTo(cx + Math.cos(aa) * R * 1.2, cy + Math.sin(aa) * R * 1.2); }
      ctx.strokeStyle = rgba(mixC(col, BLACK, 0.4), 0.9); ctx.lineWidth = Math.max(1, s * 0.025); ctx.stroke();
    } else if (kind === 'fc' || kind === 'fce') {
      stalk(s * 0.36);
      for (var d2 = 0; d2 < 2; d2++) {
        var ex = x + dx * s * (0.5 + d2 * 0.28), ey = y + dy * s * (0.5 + d2 * 0.28);
        ctx.beginPath(); ctx.ellipse(ex, ey, s * 0.15, s * 0.11, ang, 0, TAU);
        ctx.fillStyle = 'rgba(8,6,20,0.9)'; ctx.fill(); ctx.beginPath(); ctx.ellipse(ex, ey, s * 0.12, s * 0.085, ang, 0, TAU); ctx.fillStyle = rgba(bright, 1); ctx.fill();
      }
      // binding cleft at the tip
      ctx.beginPath(); ctx.moveTo(x + dx * s * 0.86 + nx * s * 0.1, y + dy * s * 0.86 + ny * s * 0.1); ctx.lineTo(x + dx * s * 1.0 + nx * s * 0.12, y + dy * s * 1.0 + ny * s * 0.12);
      ctx.moveTo(x + dx * s * 0.86 - nx * s * 0.1, y + dy * s * 0.86 - ny * s * 0.1); ctx.lineTo(x + dx * s * 1.0 - nx * s * 0.12, y + dy * s * 1.0 - ny * s * 0.12);
      ctx.strokeStyle = rgba(bright, 1); ctx.lineWidth = s * 0.06; ctx.stroke();
    } else { // C3 receptor: long chain of short consensus repeats
      stalk(s * 0.18);
      for (var b = 0; b < 6; b++) {
        var bx = x + dx * s * (0.27 + b * 0.13) + nx * s * 0.03 * Math.sin(b * 2.1), by = y + dy * s * (0.27 + b * 0.13) + ny * s * 0.03 * Math.sin(b * 2.1);
        ctx.beginPath(); ctx.arc(bx, by, s * 0.075, 0, TAU); ctx.fillStyle = 'rgba(8,6,20,0.9)'; ctx.fill();
        ctx.beginPath(); ctx.arc(bx, by, s * 0.055, 0, TAU); ctx.fillStyle = rgba(bright, 1); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x + dx * s * 0.98, y + dy * s * 0.98, s * 0.08, ang + Math.PI / 2, ang - Math.PI / 2, true);
      ctx.strokeStyle = rgba(bright, 1); ctx.lineWidth = s * 0.05; ctx.stroke();
    }
    ctx.restore();
    return [x + dx * s, y + dy * s];
  }

  /* --- macrophage (irregular, ruffled, acidophilic cytoplasm, many phagosomes) --- */
  function macroRad(a, seed, t) {
    var R = rng(seed * 53 + 7), p1 = R() * TAU, p2 = R() * TAU, p3 = R() * TAU, r = 1 + 0.09 * Math.sin(3 * a + p1) + 0.06 * Math.sin(5 * a + p2 + 0.35 * t) + 0.04 * Math.sin(2 * a + p3);
    for (var k = 0; k < 7; k++) { var c = R() * TAU, w = 0.07 + R() * 0.06, h = 0.1 + R() * 0.12, d = Math.atan2(Math.sin(a - c), Math.cos(a - c)); r += h * Math.exp(-(d * d) / (2 * w * w)) * (0.85 + 0.15 * Math.sin(t * 1.3 + k)); }
    return r;
  }
  var macroGeomCache = {};
  function macroGeom(seed) {
    if (macroGeomCache[seed]) return macroGeomCache[seed];
    var R = rng(seed * 991 + 3), G = { vac: [], dust: [] };
    for (var i = 0; i < 9; i++) { var a = R() * TAU, d = 0.25 + R() * 0.45; G.vac.push([Math.cos(a) * d, Math.sin(a) * d, 0.06 + R() * 0.06, R()]); }
    for (i = 0; i < 70; i++) { a = R() * TAU; d = Math.sqrt(R()) * 0.82; G.dust.push([Math.cos(a) * d, Math.sin(a) * d, R()]); }
    macroGeomCache[seed] = G; return G;
  }
  /**
   * macrophageCell(ctx, {x, y, r=200, t, seed=1, alpha=1, morph=1, nucleus=true, vacuoles=true})
   * Schematic macrophage (大食細胞): irregular outline with ruffled cytoplasmic processes, pink (acidophilic)
   * cytoplasm with Sou's teal rim, irregular bean nucleus, several phagosomes. morph 0..1 blends from a round
   * monocyte-like outline to the full irregular form. Returns the membrane radius function rad(angle) (px).
   */
  function macrophageCell(ctx, o) {
    var x = o.x || 0, y = o.y || 0, r = o.r || 200, t = o.t || 0, seed = o.seed == null ? 1 : o.seed, a = o.alpha == null ? 1 : o.alpha, mo = o.morph == null ? 1 : clamp(o.morph, 0, 1);
    var rad = function (an) { return r * lerp(1 + 0.012 * Math.sin(an * 3 + t), macroRad(an, seed, t), mo); };
    if (a <= 0.003) return rad;
    var G = macroGeom(seed), i;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
    glow(ctx, 0, 0, r * 1.8, [80, 214, 210], 0.22);
    ctx.beginPath();
    for (i = 0; i <= 96; i++) { var an = (i / 96) * TAU, rr = rad(an); if (i === 0) ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
    ctx.closePath();
    var cyto = mixC([208, 212, 236], [238, 196, 222], mo), edge = mixC([150, 162, 212], [196, 140, 196], mo);
    var g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r * 1.15);
    g.addColorStop(0, rgba(mixC(cyto, WHITE, 0.35), 0.97)); g.addColorStop(0.7, rgba(cyto, 0.97)); g.addColorStop(1, rgba(edge, 0.97));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.02); ctx.strokeStyle = rgba(mixC(edge, [30, 10, 50], 0.4), 1); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = Math.max(2, r * 0.03); ctx.strokeStyle = 'rgba(80,214,210,0.35)'; ctx.stroke(); ctx.restore();
    ctx.beginPath();
    for (i = 0; i < G.dust.length; i++) { var d = G.dust[i]; ctx.moveTo(d[0] * r + 2, d[1] * r); ctx.arc(d[0] * r, d[1] * r, Math.max(0.8, r * 0.009), 0, TAU); }
    ctx.fillStyle = 'rgba(176,110,180,0.5)'; ctx.fill();
    if (o.vacuoles !== false) {
      for (i = 0; i < G.vac.length; i++) {
        var v = G.vac[i]; if (v[0] < -0.35 && v[1] < 0.1) continue; // keep the nucleus area clear
        ctx.beginPath(); ctx.arc(v[0] * r, v[1] * r, v[2] * r, 0, TAU); ctx.fillStyle = 'rgba(252,236,246,0.85)'; ctx.fill();
        ctx.lineWidth = Math.max(1, r * 0.008); ctx.strokeStyle = 'rgba(150,90,160,0.9)'; ctx.stroke();
        ctx.beginPath(); ctx.arc(v[0] * r + v[3] * 3, v[1] * r, v[2] * r * 0.38, 0, TAU); ctx.fillStyle = 'rgba(120,70,90,0.6)'; ctx.fill();
      }
    }
    if (o.nucleus !== false) {
      var nx = -r * 0.36, ny = -r * 0.12;
      ctx.beginPath();
      for (i = 0; i <= 48; i++) {
        var aa = (i / 48) * TAU, dd = Math.atan2(Math.sin(aa - 0.2), Math.cos(aa - 0.2)), m = 1 - 0.36 * Math.exp(-(dd * dd) / 0.2) + 0.06 * Math.sin(aa * 4 + seed) * mo;
        var px = Math.cos(aa) * r * 0.36 * m, py = Math.sin(aa) * r * 0.27 * m;
        if (i === 0) ctx.moveTo(nx + px, ny + py); else ctx.lineTo(nx + px, ny + py);
      }
      ctx.closePath();
      var ng = ctx.createRadialGradient(nx - r * 0.1, ny - r * 0.1, r * 0.02, nx, ny, r * 0.4); ng.addColorStop(0, '#ad8fd8'); ng.addColorStop(1, '#6a4a9c');
      ctx.fillStyle = ng; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.012); ctx.strokeStyle = '#3c2260'; ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.55, r * 0.22, r * 0.08, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
    ctx.restore();
    return rad;
  }
  /** plasmaCell(ctx, x, y, r, t, a): oval cell, deep blue (basophilic) cytoplasm, eccentric "clock-face" nucleus, pale Golgi halo. */
  function plasmaCell(ctx, x, y, r, t, a) {
    if (a <= 0.003) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.25 + 0.02 * Math.sin((t || 0) * 0.7)); ctx.globalAlpha *= a;
    glow(ctx, 0, 0, r * 1.9, [110, 160, 255], 0.3);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.18, r * 0.9, 0, 0, TAU);
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.2); g.addColorStop(0, '#7fa2ec'); g.addColorStop(1, '#3a5fc0');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.03); ctx.strokeStyle = '#1e2f78'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.1, -r * 0.05, r * 0.32, r * 0.28, 0, 0, TAU); ctx.fillStyle = 'rgba(220,232,255,0.75)'; ctx.fill(); // Golgi halo
    var nx = r * 0.52, ny = r * 0.02, nr = r * 0.48;
    ctx.beginPath(); ctx.arc(nx, ny, nr, 0, TAU); ctx.fillStyle = '#b39ae0'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.025); ctx.strokeStyle = '#3b2370'; ctx.stroke();
    ctx.fillStyle = '#4a2a86';
    for (var i = 0; i < 8; i++) { var an = (i / 8) * TAU; ctx.beginPath(); ctx.arc(nx + Math.cos(an) * nr * 0.68, ny + Math.sin(an) * nr * 0.68, nr * 0.16, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(nx, ny, nr * 0.18, 0, TAU); ctx.fill();
    ctx.restore();
  }
  /** lglCell(ctx, x, y, r, t, a, seed): NK cell = large granular lymphocyte (more cytoplasm, ≥3 coarse azurophil granules). */
  function lglCell(ctx, x, y, r, t, a, seed, polar) {
    if (a <= 0.003) return;
    polar = polar || 0;
    var R = rng((seed || 1) * 71 + 9), i;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
    glow(ctx, 0, 0, r * 1.8, [255, 120, 160], 0.25);
    ctx.beginPath();
    for (i = 0; i <= 48; i++) { var an = (i / 48) * TAU, rr = r * (1 + 0.02 * Math.sin(an * 3 + seed + (t || 0) * 1.4)); if (i === 0) ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
    ctx.closePath();
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#e2efff'); g.addColorStop(0.75, '#b7d4fa'); g.addColorStop(1, '#88aee8');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.025); ctx.strokeStyle = '#4b6fb8'; ctx.stroke();
    var nx = -r * 0.24, ny = -r * 0.04, nr = r * 0.58;
    ctx.beginPath(); ctx.arc(nx, ny, nr, 0, TAU); ctx.fillStyle = '#5a3a9c'; ctx.fill();
    ctx.beginPath(); ctx.arc(nx - nr * 0.15, ny - nr * 0.2, nr * 0.85, 0, TAU); ctx.fillStyle = 'rgba(140,110,200,0.55)'; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(nx, ny, nr, 0, TAU); ctx.clip();
    for (i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(nx + (R() - 0.5) * nr * 1.6, ny + (R() - 0.5) * nr * 1.6, nr * (0.08 + R() * 0.1), 0, TAU); ctx.fillStyle = 'rgba(40,16,80,0.45)'; ctx.fill(); }
    ctx.restore();
    // coarse azurophil granules (≥3) in the wide cytoplasm on the right; polar 0..1 pulls them to the +x side
    var gr = [[0.55, -0.42], [0.66, 0.08], [0.48, 0.5], [0.78, -0.14], [0.36, 0.72]];
    for (i = 0; i < gr.length; i++) {
      var gx = lerp(gr[i][0], 0.8, polar * 0.6) * r, gy = lerp(gr[i][1], gr[i][1] * 0.45, polar) * r, grr = r * (0.085 + (i % 2) * 0.02);
      var gg = ctx.createRadialGradient(gx - grr * 0.3, gy - grr * 0.3, 0, gx, gy, grr); gg.addColorStop(0, '#ff9ac2'); gg.addColorStop(1, '#b0145a');
      ctx.beginPath(); ctx.arc(gx, gy, grr, 0, TAU); ctx.fillStyle = gg; ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.55, r * 0.22, r * 0.08, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    ctx.restore();
  }
  function virusP(ctx, x, y, r, a, rot) {
    if (a <= 0.003) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha *= a;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) { var an = (i / 10) * TAU; ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r); ctx.lineTo(Math.cos(an) * r * 1.45, Math.sin(an) * r * 1.45); }
    ctx.strokeStyle = '#ff5a6a'; ctx.lineWidth = Math.max(1, r * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = '#c0203a'; ctx.fill(); ctx.lineWidth = Math.max(1, r * 0.15); ctx.strokeStyle = '#ffb0b8'; ctx.stroke();
    ctx.restore();
  }
  /**
   * target cell ("様子のおかしい細胞"): pale tissue cell with viruses inside; apo 0..1 = apoptosis
   * (0–0.4 shrink + blebs + condensed nucleus; 0.4–0.7 nuclear fragments; 0.7–1 splits into apoptotic bodies).
   */
  function targetCell(ctx, x, y, R, t, a, apo, seed, kind) {
    if (a <= 0.003) return;
    apo = apo || 0;
    var Rr = rng((seed || 3) * 17 + 1), i, sh = 1 - 0.22 * smooth(0, 0.45, apo), split = smooth(0.7, 1, apo);
    var base = mixC([214, 232, 206], [214, 196, 214], smooth(0, 0.5, apo));
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
    glow(ctx, 0, 0, R * 1.6, [160, 255, 120], 0.15 * (1 - apo));
    if (split < 0.02) {
      ctx.beginPath();
      var bleb = smooth(0.15, 0.5, apo);
      for (i = 0; i <= 80; i++) {
        var an = (i / 80) * TAU, rr = R * sh * (1 + 0.03 * Math.sin(an * 4 + seed) + 0.015 * Math.sin(an * 7 + t));
        var bq = Math.max(0, Math.cos(an * 6 + 0.5)); rr += R * 0.09 * bleb * Math.sqrt(bq) * bq;
        if (i === 0) ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); else ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
      }
      ctx.closePath();
      var g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R * 1.1);
      g.addColorStop(0, rgba(mixC(base, WHITE, 0.4), 0.97)); g.addColorStop(1, rgba(mixC(base, [90, 110, 90], 0.35), 0.97));
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(2, R * 0.02); ctx.strokeStyle = 'rgba(70,90,70,1)'; ctx.stroke();
      // nucleus: normal → condensed → fragments
      var frag = smooth(0.4, 0.7, apo), nr = R * lerp(0.36, 0.24, smooth(0.1, 0.45, apo)), ncol = mixC([150, 120, 190], [60, 30, 90], smooth(0.1, 0.45, apo));
      if (frag < 0.02) { ctx.beginPath(); ctx.arc(R * 0.08, 0, nr, 0, TAU); ctx.fillStyle = rgba(ncol, 1); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(40,20,70,1)'; ctx.stroke(); }
      else for (i = 0; i < 5; i++) { var fa = i * 1.3 + 0.4, fd = nr * 0.9 * frag; ctx.beginPath(); ctx.arc(R * 0.08 + Math.cos(fa) * fd, Math.sin(fa) * fd, nr * lerp(0.6, 0.38, frag), 0, TAU); ctx.fillStyle = rgba(ncol, 1); ctx.fill(); }
      if (kind !== 'plain') for (i = 0; i < 7; i++) { var va = Rr() * TAU, vd = R * (0.45 + Rr() * 0.35) * sh; virusP(ctx, Math.cos(va) * vd, Math.sin(va) * vd, R * 0.045, 1 - smooth(0.2, 0.6, apo), va + t); }
    } else {
      ctx.beginPath(); ctx.arc(0, 0, R * 0.8, 0, TAU); ctx.setLineDash([8, 10]); ctx.lineWidth = 2; ctx.strokeStyle = rgba([170, 200, 160], 0.45 * (1 - split * 0.5)); ctx.stroke(); ctx.setLineDash([]);
      var BOD = [[0.3, 0.1, 0.3, 1], [2.0, 0.35, 0.22, 0], [3.3, 0.25, 0.26, 2], [4.4, 0.45, 0.16, 0], [5.4, 0.3, 0.2, 1], [1.2, 0.55, 0.13, 0], [2.8, 0.62, 0.11, 0]];
      for (i = 0; i < BOD.length; i++) {
        var B0 = BOD[i], ba = B0[0], bd = R * B0[1] * (0.6 + 0.9 * split), br = R * B0[2] * lerp(1.15, 1, split);
        var bxx = Math.cos(ba) * bd, byy = Math.sin(ba) * bd * 0.85;
        ctx.beginPath(); ctx.arc(bxx, byy, br, 0, TAU);
        ctx.fillStyle = rgba(mixC(base, WHITE, 0.15), 0.95); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,80,100,1)'; ctx.stroke();
        for (var nf = 0; nf < B0[3]; nf++) { ctx.beginPath(); ctx.arc(bxx + (nf ? br * 0.3 : -br * 0.15), byy + (nf ? br * 0.2 : -br * 0.1), br * 0.3, 0, TAU); ctx.fillStyle = 'rgba(60,30,90,0.95)'; ctx.fill(); }
      }
    }
    ctx.restore();
  }
  /** parasite (helminth larva) — beige segmented worm along a sine path; dmg 0..1 = membrane damage */
  function worm(ctx, x, y, len, t, dmg, a, rot) {
    if (a <= 0.003) return;
    dmg = dmg || 0;
    var N = 40, pts = [], i, th = len * 0.11, wig = 1 - 0.7 * dmg;
    for (i = 0; i <= N; i++) { var u = i / N; pts.push([(u - 0.5) * len, Math.sin(u * 6.5 + t * 2.2) * len * 0.07 * wig]); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function body() { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var k = 1; k <= N; k++) ctx.lineTo(pts[k][0], pts[k][1]); }
    body(); ctx.strokeStyle = 'rgba(30,14,8,0.95)'; ctx.lineWidth = th + 6; ctx.stroke();
    body(); ctx.strokeStyle = rgba(mixC([236, 206, 160], [170, 140, 120], dmg), 1); ctx.lineWidth = th; ctx.stroke();
    body(); ctx.strokeStyle = 'rgba(255,240,210,0.5)'; ctx.lineWidth = th * 0.3; ctx.translate(0, -th * 0.18); ctx.stroke(); ctx.translate(0, th * 0.18);
    ctx.beginPath();
    for (i = 2; i < N - 1; i += 2) { var p0 = pts[i], p1 = pts[i + 1], ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + Math.PI / 2; ctx.moveTo(p0[0] + Math.cos(ang) * th * 0.45, p0[1] + Math.sin(ang) * th * 0.45); ctx.lineTo(p0[0] - Math.cos(ang) * th * 0.45, p0[1] - Math.sin(ang) * th * 0.45); }
    ctx.strokeStyle = 'rgba(140,100,60,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    // head
    ctx.beginPath(); ctx.arc(pts[N][0], pts[N][1], th * 0.62, 0, TAU); ctx.fillStyle = '#e8c79a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,14,8,0.95)'; ctx.stroke();
    // damage: glowing ruptures + leaking specks
    if (dmg > 0.02) {
      for (i = 0; i < 6; i++) {
        var q = pts[6 + i * 5], cr = th * 0.5 * smooth(i * 0.1, i * 0.1 + 0.4, dmg);
        if (cr < 0.5) continue;
        ctx.beginPath(); ctx.moveTo(q[0] - cr, q[1] - cr * 0.6); ctx.lineTo(q[0] - cr * 0.2, q[1]); ctx.lineTo(q[0] - cr * 0.6, q[1] + cr * 0.7); ctx.moveTo(q[0] - cr * 0.2, q[1]); ctx.lineTo(q[0] + cr, q[1] + cr * 0.2);
        ctx.strokeStyle = 'rgba(255,120,60,0.95)'; ctx.lineWidth = 3; ctx.stroke();
        glow(ctx, q[0], q[1], th, [255, 120, 60], 0.6 * dmg);
      }
    }
    ctx.restore();
  }

  /* ======================================================= 1. wbcClassify */
  /**
   * wbcClassify(ctx, {x, y, scale, p, t, alpha, panel, highlight, group})   natural size 1560×880 (slide 13)
   * 「白血球 5,000〜9,000 /mm³」の counter, then the two classification axes: 核の形 (columns: 分葉なし＝単核 /
   * 分葉あり＝多形核) × 顆粒の染色性 (stain bar: 青紫＝塩基好性 / 中性 / 赤＝酸好性), the five cells with their
   * share of WBCs (好中球 60〜70% / 好酸球 2〜3% / 好塩基球 約0.5% / リンパ球 25〜30% / 単球 約5%), and finally
   * the two groups 顆粒球（多形核白血球） and 無顆粒球（単核白血球）. Relative cell sizes follow slide 47.
   * highlight: cell type name to emphasise (others dim); group: 'gran' | 'agran' dims the other group.
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.20 counter rolls up 0 → 5,000, then 〜9,000 /mm³ appears (beat ≈ 0.12)
   *   0.20–0.32 axis headers (核の形) + stain bar (顆粒の染色性)
   *   0.32–0.62 cells pop: 好中球 .32, 好酸球 .38, 好塩基球 .44, リンパ球 .50, 単球 .56 (each name + %)
   *   0.62–0.72 hull + chip 顆粒球（多形核白血球） ; 0.70–0.80 hull + chip 無顆粒球（単核白血球）
   *   0.80–1.00 hold
   */
  function wbcClassify(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1560, PH = 880;
    var ca = begin(ctx, o, PW, PH, '白血球の分類', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    // counter
    var cA = win(p, 0.07, 0.11), roll = eout(win(p, 0.08, 0.16)), rng2 = win(p, 0.15, 0.2);
    if (cA > 0) {
      var s1 = '白血球', s2 = fmt(5000 * roll), s3 = '〜9,000', s4 = ' / mm³', z1 = 38, z2 = 66;
      var w1 = textW(ctx, s1, z1), w2 = textW(ctx, '5,000', z2), w3 = textW(ctx, s3, z2), w4 = textW(ctx, s4, z1), gap = 22;
      var tot = w1 + gap + w2 + w3 * rng2 + w4, x0 = -tot / 2, cy0 = -322;
      ctx.save(); ctx.globalAlpha *= cA;
      rrect(ctx, x0 - 34, cy0 - 50, tot + 68, 100, 50); ctx.fillStyle = 'rgba(4,14,30,0.7)'; ctx.fill(); gline(ctx, [255, 220, 140], 2.5, 0.85);
      txt(ctx, s1, x0, cy0 + 4, { size: z1, color: [255, 236, 200] });
      txt(ctx, s2, x0 + w1 + gap + w2, cy0, { size: z2, color: [255, 240, 200], glow: [255, 200, 110], align: 'right' });
      if (rng2 > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x0 + w1 + gap + w2, cy0 - 50, w3 * rng2 + 2, 100); ctx.clip(); txt(ctx, s3, x0 + w1 + gap + w2, cy0, { size: z2, color: [255, 240, 200], glow: [255, 200, 110] }); ctx.restore(); }
      txt(ctx, s4, x0 + w1 + gap + w2 + w3 * rng2, cy0 + 6, { size: z1, color: [255, 236, 200] });
      ctx.restore();
    }
    var xA = -470, xB = 130, hl = o.highlight, grp = o.group;
    // headers (axis 1: nucleus shape)
    var hA = eout(win(p, 0.2, 0.28));
    function header(cx, label, lobed, a) {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      var w = textW(ctx, label, 32) + 110;
      rrect(ctx, cx - w / 2, -215 - 30, w, 60, 30); ctx.fillStyle = 'rgba(6,20,40,0.8)'; ctx.fill(); gline(ctx, TEAL, 2, 0.8);
      var ix = cx - w / 2 + 40, iy = -215;
      ctx.fillStyle = '#9a78d8';
      if (lobed) { [[-12, 4], [0, -8], [12, 4]].forEach(function (q) { ctx.beginPath(); ctx.arc(ix + q[0], iy + q[1], 8, 0, TAU); ctx.fill(); }); ctx.strokeStyle = '#9a78d8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix - 12, iy + 4); ctx.lineTo(ix, iy - 8); ctx.lineTo(ix + 12, iy + 4); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(ix, iy, 15, 0, TAU); ctx.fill(); }
      txt(ctx, label, ix + 30, iy + 2, { size: 32, color: [225, 250, 255] });
      ctx.restore();
    }
    header(xA, '核：分葉なし＝単核', false, hA);
    header(xB + 120, '核：分葉あり＝多形核', true, hA);
    // axis 2: stain bar
    var bx = xB + 360, bA = eout(win(p, 0.24, 0.32));
    if (bA > 0) {
      ctx.save(); ctx.globalAlpha *= bA;
      txt(ctx, '顆粒の染色性', bx, -148, { size: 26, align: 'center', color: [225, 250, 255] });
      var y0 = -126, y1 = lerp(y0, 262, bA);
      var gg = ctx.createLinearGradient(0, -126, 0, 262); gg.addColorStop(0, '#5a3cd0'); gg.addColorStop(0.5, '#e8c6e6'); gg.addColorStop(1, '#f0503c');
      rrect(ctx, bx - 14, y0, 28, y1 - y0, 14); ctx.fillStyle = gg; ctx.fill(); gline(ctx, TEAL, 1.5, 0.7);
      var labs = [['青紫＝塩基好性', -95, [176, 160, 255]], ['中性', 65, [240, 214, 240]], ['赤＝酸好性', 225, [255, 150, 130]]];
      labs.forEach(function (L, k) { txt(ctx, L[0], bx + 32, L[1], { size: 26, color: L[2], a: win(bA, 0.3 + k * 0.2, 0.7 + k * 0.1) }); });
      ctx.restore();
    }
    // cells
    var rows = [
      { type: 'neutrophil', x: xB, y: 65, st: 0.32, tick: 65 },
      { type: 'eosinophil', x: xB, y: 225, st: 0.38, tick: 225 },
      { type: 'basophil', x: xB, y: -95, st: 0.44, tick: -95 },
      { type: 'lymphocyte', x: xA, y: -65, st: 0.5 },
      { type: 'monocyte', x: xA, y: 150, st: 0.56 }
    ];
    var gA = smooth(0.62, 0.72, p), aA = smooth(0.7, 0.8, p);
    // group hulls (behind)
    function hull(x0, y0, w, h, col, a, label, ly) {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      rrect(ctx, x0, y0, w, h, 34); ctx.fillStyle = rgba(col, 0.07); ctx.fill();
      gline(ctx, col, 2.5, 0.9, [18, 10], -t * 20);
      ctx.restore();
      ctx.save(); var sc = eback(a); ctx.translate(x0 + w / 2, ly); ctx.scale(sc, sc);
      chipW(ctx, label, 0, 0, { size: 34, accent: col, fill: 'solid', alpha: a });
      ctx.restore();
    }
    var dimG = function (g) { return grp && grp !== g ? 0.35 : 1; };
    ctx.save(); ctx.globalAlpha *= dimG('gran'); hull(xB - 200, -178, 830, 490, [214, 180, 255], gA, '顆粒球（多形核白血球）', 355); ctx.restore();
    ctx.save(); ctx.globalAlpha *= dimG('agran'); hull(xA - 230, -178, 460, 490, [110, 196, 255], aA, '無顆粒球（単核白血球）', 355); ctx.restore();
    for (var i = 0; i < rows.length; i++) {
      var R0 = rows[i], pop = eback(win(p, R0.st, R0.st + 0.05)), sil = smooth(R0.st + 0.02, R0.st + 0.07, p), na = win(p, R0.st + 0.03, R0.st + 0.08);
      if (pop <= 0.001) continue;
      var dim = (hl && hl !== R0.type ? 0.35 : 1) * dimG(R0.type === 'lymphocyte' || R0.type === 'monocyte' ? 'agran' : 'gran');
      var r = 62 * REL[R0.type], cx = R0.x - 120, acc = ACC[R0.type];
      ctx.save(); ctx.globalAlpha *= dim;
      if (hl === R0.type) { ctx.beginPath(); ctx.arc(cx, R0.y, r * 1.3 + 3 * Math.sin(t * 4), 0, TAU); gline(ctx, acc, 2.5, 0.9, [12, 8], -t * 30); }
      cell(ctx, R0.type, cx, R0.y + Math.sin(t * 1.3 + i) * 3, r * pop, t, { seed: 1 + i, sil: sil, glow: 0.6 });
      if (na > 0) {
        txt(ctx, NAME[R0.type], R0.x - 30, R0.y - 20, { size: 38, a: na, color: mixC(acc, WHITE, 0.6), glow: acc });
        chipW(ctx, PCT[R0.type], R0.x - 30, R0.y + 30, { size: 26, accent: acc, alpha: na, align: 'left' });
        if (R0.tick != null) {
          ctx.save(); ctx.globalAlpha *= na; ctx.beginPath(); ctx.moveTo(R0.x + 150, R0.y); ctx.lineTo(bx - 20, R0.tick);
          gline(ctx, acc, 1.8, 0.7, [4, 8], -t * 20); ctx.beginPath(); ctx.arc(bx, R0.tick, 9, 0, TAU); gline(ctx, WHITE, 2.5, 0.95); ctx.restore();
        }
      }
      ctx.restore();
    }
    // agranulocyte note
    var nA = win(p, 0.58, 0.64);
    if (nA > 0) txt(ctx, '目立つ顆粒なし', xA, 270, { size: 24, align: 'center', color: [190, 220, 255], a: nA });
    ctx.restore();
  }

  /* =================================================== 2. neutrophilDetail */
  /**
   * neutrophilDetail(ctx, {x, y, scale, p, t, alpha, panel, note=true, mpo=true})   natural size 1560×880 (slide 15)
   * Big neutrophil (4-lobed segmented nucleus) + 「分葉核（3〜5個に分かれる）」, diameter bar 「直径 約12 μm」 with
   * the smear note 「※塗抹標本での値。実際は約20%小さい」 (dashed ghost circle at 80 %), then two zoom lenses at
   * the same magnification: 特殊（二次）顆粒 0.2〜0.4 μm・淡いピンク（リゾチーム・ラクトフェリン）/
   * アズール好性（一次）顆粒 0.5〜0.6 μm・青紫（一種のリソソーム）, and finally MPO → HOCl.
   * p stages:
   *   0.00–0.07 panel on
   *   0.05–0.20 cell scans in
   *   0.20–0.30 分葉核 tag
   *   0.30–0.42 diameter bar + 直径 約12 μm chip
   *   0.42–0.52 smear note + ghost circle (実際は約20%小さい)
   *   0.52–0.66 lens 1: 特殊（二次）顆粒
   *   0.62–0.76 lens 2: アズール好性（一次）顆粒
   *   0.78–0.94 MPO glows in the azurophil granule, HOCl bubbles out, formula chip (beat ≈ 0.8)
   *   0.94–1.00 hold
   */
  function neutrophilDetail(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1560, PH = 880;
    var ca = begin(ctx, o, PW, PH, '好中球のつくり', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var acc = ACC.neutrophil, cx = -420, cy = -10, r = 240, seed = 3;
    var G = D.wbcCellAnchors ? D.wbcCellAnchors('neutrophil', seed) : { lobes: [{ x: 0, y: -0.4 }], gran: [[0.5, 0.3, 0]], azu: [[0.5, 0.4, 0]] };
    var hud = smooth(0.05, 0.2, p);
    if (hud > 0) {
      ctx.save(); ctx.globalAlpha *= hud; ctx.beginPath(); ctx.arc(cx, cy, r * 1.16, 0, TAU); gline(ctx, acc, 1.5, 0.4, [3, 9], t * 12);
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.24, 0, TAU); gline(ctx, acc, 1.5, 0.35, [60, 30], -t * 20); ctx.restore();
    }
    var scan = smooth(0.05, 0.2, p);
    if (scan > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(cx - r * 1.4, cy - r * 1.4, r * 2.8, r * 2.8 * scan); ctx.clip();
      cell(ctx, 'neutrophil', cx, cy, r, 0, { seed: seed, glow: 0.6 }); ctx.restore();
      if (scan < 1) { var sy = cy - r * 1.4 + r * 2.8 * scan; ctx.save(); ctx.globalCompositeOperation = 'lighter'; var lg = ctx.createLinearGradient(0, sy - 30, 0, sy); lg.addColorStop(0, rgba(acc, 0)); lg.addColorStop(1, rgba(acc, 0.8)); ctx.fillStyle = lg; ctx.fillRect(cx - r * 1.3, sy - 30, r * 2.6, 32); ctx.restore(); }
    }
    // lobe tag
    var lobe = G.lobes.reduce(function (a, b) { return b.y < a.y ? b : a; });
    tagW(ctx, '分葉核', -700, -335, { grow: win(p, 0.2, 0.3), tx: cx + lobe.x * r, ty: cy + lobe.y * r, accent: acc, size: 40, sub: '核が3〜5個に分かれる', subSize: 24 });
    // diameter bar
    var db = eout(win(p, 0.3, 0.4)), y0 = cy + r + 44;
    if (db > 0) {
      var xa = cx - r * db, xb = cx + r * db;
      ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xb, y0); ctx.moveTo(xa, y0 - 14); ctx.lineTo(xa, y0 + 14); ctx.moveTo(xb, y0 - 14); ctx.lineTo(xb, y0 + 14); gline(ctx, mixC(acc, WHITE, 0.4), 3, 0.95);
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r, y0); ctx.moveTo(cx + r, cy); ctx.lineTo(cx + r, y0); gline(ctx, acc, 1.5, 0.45, [4, 8]);
      chipW(ctx, '直径 約12 μm', cx, y0 + 48, { size: 34, accent: acc, alpha: win(p, 0.35, 0.42), fill: 'solid' });
    }
    // smear note + ghost
    var nA = win(p, 0.42, 0.52);
    if (nA > 0 && o.note !== false) {
      var gr = r * lerp(1, 0.8, eio(win(p, 0.44, 0.52)));
      ctx.beginPath(); ctx.arc(cx, cy, gr, 0, TAU); gline(ctx, [255, 230, 140], 2.5, 0.9 * nA, [14, 10], -t * 20);
      txt(ctx, '実際の大きさ', cx + gr * 0.71 + 6, cy + gr * 0.71 + 4, { size: 22, color: [255, 236, 170], a: win(p, 0.47, 0.52) });
      txt(ctx, '※塗抹標本での値。実際は約20%小さい', cx, y0 + 108, { size: 26, align: 'center', color: [255, 236, 170], a: nA });
    }
    // lenses
    var K = 150; // px per μm inside the lenses
    function lens(lx, ly, LR, a, draw) {
      if (a <= 0.003) return;
      ctx.save(); ctx.globalAlpha *= smooth(0, 0.5, a);
      var rr = LR * eback(a);
      ctx.beginPath(); ctx.arc(lx, ly, rr, 0, TAU); ctx.fillStyle = 'rgba(250,236,244,0.95)'; ctx.fill();
      ctx.save(); ctx.clip(); draw(rr / LR); ctx.restore();
      ctx.beginPath(); ctx.arc(lx, ly, rr, 0, TAU); gline(ctx, TEAL, 3, 0.95);
      ctx.beginPath(); ctx.arc(lx, ly, rr + 10, -0.6 + t * 0.4, 0.6 + t * 0.4); gline(ctx, TEAL, 2, 0.6);
      ctx.restore();
    }
    function zoomLines(gx, gy, lx, ly, LR, a) {
      if (a <= 0.003) return;
      var an = Math.atan2(ly - gy, lx - gx), q = Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(lx + Math.cos(an + q) * LR, ly + Math.sin(an + q) * LR);
      ctx.moveTo(gx, gy); ctx.lineTo(lx + Math.cos(an - q) * LR, ly + Math.sin(an - q) * LR);
      gline(ctx, TEAL, 1.2, 0.35 * a, [5, 7]);
      ctx.beginPath(); ctx.arc(gx, gy, 12, 0, TAU); gline(ctx, TEAL, 2, 0.9 * a);
    }
    var gS = G.gran.reduce(function (a, b) { return Math.hypot(b[0] - 0.6, b[1] + 0.4) < Math.hypot(a[0] - 0.6, a[1] + 0.4) ? b : a; });
    var gAz = G.azu.reduce(function (a, b) { return Math.hypot(b[0] - 0.62, b[1] - 0.2) < Math.hypot(a[0] - 0.62, a[1] - 0.2) ? b : a; });
    var L1 = win(p, 0.52, 0.6), L2 = win(p, 0.62, 0.7), l1x = 130, l2x = 540, ly = -175, LR = 118;
    zoomLines(cx + gS[0] * r, cy + gS[1] * r, l1x, ly, LR, L1);
    zoomLines(cx + gAz[0] * r, cy + gAz[1] * r, l2x, ly, LR, L2);
    var Rs = rng(41);
    var specs = []; for (var i = 0; i < 9; i++) specs.push([(Rs() - 0.5) * 200, (Rs() - 0.5) * 200, (0.2 + Rs() * 0.2) * K / 2, 0.6 + Rs() * 0.4, Rs() * 3]);
    lens(l1x, ly, LR, L1, function (k) {
      ctx.fillStyle = 'rgba(246,224,236,1)'; ctx.fillRect(l1x - LR, ly - LR, LR * 2, LR * 2);
      specs.forEach(function (s) { ctx.beginPath(); ctx.ellipse(l1x + s[0] * k, ly + s[1] * k, s[2] * k, s[2] * s[3] * k, s[4], 0, TAU); ctx.fillStyle = '#e9a8cf'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#c47aa8'; ctx.stroke(); });
    });
    var azs = [[-40, -42, 0.56], [52, -20, 0.5], [-22, 58, 0.6], [70, 72, 0.52]];
    var mpoA = smooth(0.78, 0.84, p) * (o.mpo === false ? 0 : 1);
    lens(l2x, ly, LR, L2, function (k) {
      ctx.fillStyle = 'rgba(244,226,240,1)'; ctx.fillRect(l2x - LR, ly - LR, LR * 2, LR * 2);
      azs.forEach(function (s, j) {
        var gx = l2x + s[0] * k, gy = ly + s[1] * k, rr = s[2] * K / 2 * k;
        var g = ctx.createRadialGradient(gx - rr * 0.3, gy - rr * 0.3, rr * 0.1, gx, gy, rr); g.addColorStop(0, '#a65ac0'); g.addColorStop(1, '#5a1868');
        ctx.beginPath(); ctx.arc(gx, gy, rr, 0, TAU); ctx.fillStyle = g; ctx.fill();
        if (j === 0 && mpoA > 0) { glow(ctx, gx, gy, rr * 2.2, [255, 120, 255], 0.8 * mpoA * (0.8 + 0.2 * Math.sin(t * 6))); txt(ctx, 'MPO', gx, gy + 1, { size: 26, align: 'center', color: [255, 236, 255], glow: [255, 120, 255], a: mpoA }); }
      });
    });
    // scale bar (shared)
    var sbA = Math.min(L1, L2);
    if (sbA > 0) {
      var sx0 = (l1x + l2x) / 2 - 0.25 * K, sy0 = ly + LR - 30;
      ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx0 + 0.5 * K, sy0); gline(ctx, WHITE, 3, 0.9 * sbA);
      txt(ctx, '0.5 μm', sx0 + 0.25 * K, sy0 + 20, { size: 20, align: 'center', a: sbA, color: [220, 240, 255] });
    }
    function lensText(lx, a, title, size, col, lines) {
      if (a <= 0) return;
      txt(ctx, title, lx, 0, { size: 32, align: 'center', a: a, color: mixC(col, WHITE, 0.55), glow: col });
      chipW(ctx, size, lx, 52, { size: 26, accent: col, alpha: win(a, 0.3, 1) });
      lines.forEach(function (L, j) { txt(ctx, L, lx, 100 + j * 36, { size: 25, align: 'center', a: win(a, 0.5 + j * 0.2, 1), color: [235, 244, 255] }); });
    }
    lensText(l1x, win(p, 0.55, 0.66), '特殊（二次）顆粒', '0.2〜0.4 μm・淡いピンク', [240, 160, 210], ['抗菌物質', 'リゾチーム・ラクトフェリン']);
    lensText(l2x, win(p, 0.65, 0.76), 'アズール好性（一次）顆粒', '0.5〜0.6 μm・青紫', [200, 110, 230], ['一種のリソソーム', '']);
    // MPO → HOCl
    var mA = win(p, 0.8, 0.9);
    if (mA > 0 && o.mpo !== false) {
      for (var b = 0; b < 5; b++) {
        var bp = mod(t * 0.35 + b / 5, 1), bxx = l2x - 90 + 180 * k2(b) + Math.sin(t * 2 + b) * 10, byy = ly - LR + 10 - bp * 150;
        tokenPill(ctx, 'HOCl', bxx, byy, [255, 120, 255], mA * (1 - smooth(0.7, 1, bp)) * smooth(0, 0.15, bp), 18);
      }
      txt(ctx, 'ミエロペルオキシダーゼ（MPO）', l2x, 172, { size: 26, align: 'center', a: mA, color: [255, 200, 255], glow: [220, 100, 255] });
      chipW(ctx, 'H₂O₂ + Cl⁻ → HOCl（次亜塩素酸）', l2x, 226, { size: 26, accent: [255, 120, 255], alpha: win(p, 0.84, 0.94), fill: 'solid' });
    }
    ctx.restore();
  }
  function k2(b) { return ((b * 37) % 7) / 7; }
  /** glowing pill token (O₂⁻ / HOCl …) */
  function tokenPill(ctx, s, x, y, col, a, size) {
    if (a <= 0.004) return; size = size || 24;
    var w = textW(ctx, s, size) + size * 0.9, h = size * 1.4;
    ctx.save(); ctx.globalAlpha *= a;
    glow(ctx, x, y, w * 0.8, col, 0.45);
    rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = rgba(mixC(col, BLACK, 0.72), 0.92); ctx.fill(); gline(ctx, col, 2, 0.95);
    txt(ctx, s, x, y + 1, { size: size, align: 'center', color: mixC(col, WHITE, 0.65), outline: false });
    ctx.restore();
  }

  /* =================================================== 3. receptorsOpsonin */
  function bactGeom(L, t, seed) { // replicates diag_wbc bacterium() idle body (for exact attachment points)
    var A1 = L * 0.045 * Math.sin(t * 2.1 + seed), A2 = L * 0.02 * Math.sin(t * 1.6 + seed * 2), sq = 1 + 0.02 * Math.sin(t * 2.4 + seed), hw0 = L * 0.2;
    function cy(s) { var u = s / L; return A1 * Math.cos(Math.PI * u) + A2 * Math.sin(TAU * u); }
    function norm(s) { var dy = cy(s + 0.5) - cy(s - 0.5), n = Math.hypot(1, dy); return [-dy / n, 1 / n]; }
    function halfW(s) { var e = L / 2 - hw0, as = Math.abs(s); return as <= e ? hw0 : hw0 * Math.sqrt(Math.max(0, 1 - Math.pow((as - e) / hw0, 2))); }
    return function (s, side) { var n = norm(s), hw = halfW(s) * side; return [(s + n[0] * hw) * sq, (cy(s) + n[1] * hw) / sq, n[0] * side, n[1] * side]; };
  }
  /**
   * receptorsOpsonin(ctx, {x, y, scale, p, t, alpha, panel})   natural size 1640×900 (slides 16・17)
   * Close-up of the neutrophil surface (left) with three kinds of receptors — Toll様受容体 (green horseshoe),
   * Fc受容体 (blue, two Ig domains), C3受容体 (orange bead chain) — and an upright rod bacterium (right).
   * ① TLR: fragments of the bacterium itself (病原体の成分) drift to the TLRs, which light up (自然免疫).
   * Opsonisation: Y-shaped antibodies (IgG, Fab on the bacterium, Fc pointing out) and complement C3b stick on.
   * ② the bacterium is pulled in: Fc receptors grab the antibody Fc stems, C3 receptors grab C3b (オプソニン作用).
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.20 membrane + receptors grow, legend
   *   0.18–0.28 bacterium drifts in (upright, face at the top)
   *   0.28–0.45 ① TLR: components drift to the TLRs → TLRs light (beat ≈ 0.40), caption ①
   *   0.45–0.62 antibodies (Y) fly in & attach (0.46–0.56), C3b attach (0.5–0.6), label オプソニン化
   *   0.62–0.78 bacterium pulled to the membrane; Fc / C3 receptors lock (flash ≈ 0.76)
   *   0.78–0.92 caption ② (Fc受容体・C3受容体 = オプソニン作用) + 「食作用が進む」
   *   0.92–1.00 membrane starts to curl around the bacterium (hold)
   */
  function receptorsOpsonin(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1640, PH = 900;
    var ca = begin(ctx, o, PW, PH, '細菌をつかむ受容体とオプソニン作用', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.save(); clipPanel(ctx, PW, PH);
    var MX = -470, L = 480, by = -45, bseed = 3, i;
    var curl = smooth(0.92, 1, p);
    function memX(y) { var d = (Math.abs(y - by) - 275) / 55; return MX + 8 * Math.sin(y * 0.012 + t * 0.8) + curl * 150 * Math.exp(-d * d); }
    // cytoplasm patch
    var mA = smooth(0.07, 0.14, p);
    if (mA > 0) {
      ctx.save(); ctx.globalAlpha *= mA;
      var YT = -PH / 2 + 88;
      ctx.beginPath(); ctx.moveTo(-PW / 2, YT);
      for (var yy = YT; yy <= PH / 2; yy += 10) ctx.lineTo(memX(yy), yy);
      ctx.lineTo(-PW / 2, PH / 2); ctx.closePath();
      var cg = ctx.createLinearGradient(-PW / 2, 0, MX, 0); cg.addColorStop(0, 'rgba(226,196,236,0.85)'); cg.addColorStop(1, 'rgba(246,226,240,0.9)');
      ctx.fillStyle = cg; ctx.fill();
      ctx.save(); ctx.clip();
      var Rg = rng(9);
      ctx.beginPath(); ctx.ellipse(-760, -60, 150, 110, 0.4, 0, TAU); ctx.fillStyle = '#7a4ab0'; ctx.fill();
      for (i = 0; i < 70; i++) { var gx = -PW / 2 + Rg() * 330, gy2 = -PH / 2 + Rg() * PH, rr = Rg() < 0.2 ? 7 : 3.5; ctx.beginPath(); ctx.arc(gx, gy2, rr, 0, TAU); ctx.fillStyle = rr > 5 ? '#84237a' : '#d08cc2'; ctx.fill(); }
      ctx.restore();
      ctx.beginPath(); for (yy = YT; yy <= PH / 2; yy += 10) { if (yy === YT) ctx.moveTo(memX(yy), yy); else ctx.lineTo(memX(yy), yy); }
      gline(ctx, [214, 180, 255], 4, 0.95);
      ctx.restore();
      txt(ctx, '好中球の表面', -790, -320, { size: 30, a: mA, color: [214, 180, 255] });
    }
    // receptors
    var REC = [['tlr', -300, 92], ['fc', -195, 100], ['c3', -100, 136], ['fc', -5, 100], ['c3', 90, 136], ['tlr', 190, 92]];
    var bindTLR = smooth(0.36, 0.42, p), lock = smooth(0.74, 0.78, p);
    var tips = [];
    for (i = 0; i < REC.length; i++) {
      var R0 = REC[i], gr = eout(win(p, 0.08 + i * 0.015, 0.16 + i * 0.015)), mx = memX(R0[1]);
      var lit = R0[0] === 'tlr' ? bindTLR * (0.7 + 0.3 * Math.sin(t * 6)) : lock * (0.7 + 0.3 * Math.sin(t * 6));
      tips.push(receptor(ctx, R0[0], mx, R0[1], 0, R0[2] * gr, gr > 0 ? 1 : 0, lit));
    }
    // bacterium position
    var bx0 = 300, bxF = -195, enter = eio(win(p, 0.18, 0.28)), pull = eio(win(p, 0.62, 0.76));
    var bx = lerp(760, bx0, enter) + lerp(0, bxF - bx0, pull), bAlpha = smooth(0.18, 0.22, p);
    var edge = bactGeom(L, t, bseed);
    function surf(dy, side) { // world point on the bacterium surface at world-y offset dy (side −1 = left)
      var e = edge(-dy, side); // rot −π/2: world = (ly, −lx); local top edge (side −1) faces world −x
      return { x: bx + e[1], y: by - e[0], nx: e[3], ny: -e[2] };
    }
    if (bAlpha > 0 && D.bacterium) D.bacterium(ctx, { x: bx, y: by, size: L, t: t, rot: -Math.PI / 2, flagella: 0.28, alpha: bAlpha, seed: bseed });
    // ① TLR ligands (pieces of the bacterium itself)
    var lig = win(p, 0.29, 0.4);
    if (lig > 0 && lig < 1.0001) {
      [[0, -255], [5, 185]].forEach(function (q, k) {
        var s0 = surf(q[1] - by, -1), tip = tips[k === 0 ? 0 : 5], e = eio(lig);
        for (var j = 0; j < 3; j++) {
          var lx = lerp(s0.x - 10, tip[0] + 6, e) + j * 8 * (1 - e), ly2 = lerp(s0.y + (j - 1) * 20, tip[1], e) + Math.sin(t * 4 + j) * 6 * (1 - e);
          ctx.save(); ctx.translate(lx, ly2); ctx.rotate(t * 2 + j); ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath();
          ctx.fillStyle = '#c8ff6a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#2c4a10'; ctx.stroke(); ctx.restore();
          glow(ctx, lx, ly2, 20, [200, 255, 106], 0.5);
        }
      });
    }
    if (bindTLR > 0) {
      [tips[0], tips[5]].forEach(function (tp) { sparkle(ctx, tp[0], tp[1], 26 * bell(p, 0.36, 0.4, 0.44, 0.5), [200, 255, 140], 1, t); });
      tagW(ctx, '認識！', tips[0][0] + 40, tips[0][1] - 52, { size: 30, accent: [120, 245, 180], grow: win(p, 0.38, 0.46) });
    }
    // antibodies & C3b
    var ABS = [[-150, -1, 0.46], [40, -1, 0.49], [-40, 1, 0.5], [120, 1, 0.53], [-210, 1, 0.55]]; // [world dy from bacterium centre, side, start]
    var C3S = [[-55, -1, 0.5], [135, -1, 0.53], [200, 1, 0.56], [-130, 1, 0.58]];
    var abS = 74, Rfly = rng(5);
    for (i = 0; i < ABS.length; i++) {
      var A = ABS[i], k = eout(win(p, A[2], A[2] + 0.07)), fx0 = 560 + Rfly() * 200, fy0 = -420 + Rfly() * 300, fr = Rfly() * 6;
      if (k <= 0) continue;
      var sp = surf(A[0], A[1]), ang = Math.atan2(-sp.ny, -sp.nx); // tail → arms points into the bacterium
      var tx = sp.x + sp.nx * abS, ty = sp.y + sp.ny * abS;
      var x1 = lerp(fx0, tx, k), y1 = lerp(fy0, ty, k), a1 = lerp(fr, ang, k);
      antibodyY(ctx, x1, y1, a1, abS, { col: IGCOL.IgG, a: smooth(0, 0.2, k) });
      if (k > 0.95 && p < A[2] + 0.12) sparkle(ctx, sp.x, sp.y, 16, [255, 230, 140], bell(p, A[2] + 0.06, A[2] + 0.075, A[2] + 0.09, A[2] + 0.12), t);
    }
    for (i = 0; i < C3S.length; i++) {
      var C = C3S[i], kc = eout(win(p, C[2], C[2] + 0.06));
      if (kc <= 0) continue;
      var sc = surf(C[0], C[1]), cx2 = sc.x + sc.nx * 14, cy2 = sc.y + sc.ny * 14;
      c3b(ctx, lerp(620, cx2, kc), lerp(380 - i * 60, cy2, kc), 17, smooth(0, 0.2, kc), t * 0.5 + i);
    }
    // receptor lock flashes
    if (lock > 0) {
      [1, 2, 3, 4].forEach(function (j) { sparkle(ctx, tips[j][0], tips[j][1], 24 * bell(p, 0.74, 0.77, 0.8, 0.86), j % 2 ? [140, 200, 255] : [255, 200, 90], 1, t + j); });
    }
    ctx.restore(); // clip
    // legend
    var lgA = win(p, 0.12, 0.2);
    if (lgA > 0) {
      var LX = 470, LY = -340;
      card(ctx, LX - 30, LY - 40, 370, 290, TEAL, lgA);
      ctx.save(); ctx.globalAlpha *= lgA;
      receptor(ctx, 'tlr', LX, LY + 10, 0, 50, 1, 0); txt(ctx, 'Toll様受容体', LX + 70, LY + 10, { size: 25 });
      receptor(ctx, 'fc', LX, LY + 62, 0, 50, 1, 0); txt(ctx, 'Fc受容体', LX + 70, LY + 62, { size: 25 });
      receptor(ctx, 'c3', LX, LY + 114, 0, 50, 1, 0); txt(ctx, 'C3受容体', LX + 70, LY + 114, { size: 25 });
      antibodyY(ctx, LX, LY + 166, 0, 46, { col: IGCOL.IgG }); txt(ctx, '抗体（IgG）', LX + 70, LY + 166, { size: 25 });
      c3b(ctx, LX + 22, LY + 212, 13, 1, 0); txt(ctx, '補体 C3b', LX + 70, LY + 212, { size: 25 });
      ctx.restore();
    }
    // captions
    var c1 = win(p, 0.34, 0.44), c2 = win(p, 0.78, 0.88), op = win(p, 0.52, 0.6);
    if (op > 0) tagW(ctx, 'オプソニン化', 500, 190, { size: 36, accent: [255, 214, 110], grow: op, sub: '抗体・補体が病原体に結合（目印）', subSize: 20 });
    function capt(y, num, head, body, a, col) {
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= smooth(0, 0.5, a);
      var w = 1500; rrect(ctx, -w / 2, y - 26, w, 52, 26); ctx.fillStyle = 'rgba(4,14,30,0.82)'; ctx.fill(); gline(ctx, col, 2, 0.85);
      ctx.beginPath(); ctx.arc(-w / 2 + 30, y, 19, 0, TAU); ctx.fillStyle = rgba(col, 1); ctx.fill();
      txt(ctx, num, -w / 2 + 30, y + 1, { size: 24, align: 'center', color: [10, 20, 30], outline: false });
      var hw2 = txt(ctx, head, -w / 2 + 62, y + 1, { size: 27, color: mixC(col, WHITE, 0.5), a: a });
      txt(ctx, body, -w / 2 + 80 + hw2, y + 1, { size: 25, color: [235, 244, 255], a: win(a, 0.3, 1) });
      ctx.restore();
    }
    capt(330, '1', 'Toll様受容体', '病原体の成分そのものを認識（パターン認識受容体・自然免疫）', c1, [120, 245, 180]);
    capt(392, '2', 'Fc受容体・C3受容体', '抗体や補体の結合した病原体をつかむ＝オプソニン作用（獲得免疫の補助）', c2, [120, 190, 255]);
    var fin = win(p, 0.86, 0.94);
    if (fin > 0) chipW(ctx, '食作用が進む！', 420, 250, { size: 32, accent: [255, 214, 110], fill: 'solid', alpha: fin });
    ctx.restore();
  }

  /* ====================================================== 4. phagolysosome */
  /**
   * phagolysosome(ctx, {x, y, scale, p, t, alpha, panel, inset=true, steps=true})   natural size 1560×880 (slide 16)
   * Close-up of the phagosome (食胞) inside the neutrophil: azurophil granules (アズール顆粒＝リソソーム, purple)
   * and specific granules (特殊顆粒, pink) move to the vesicle and fuse one by one, pouring their contents in →
   * ファゴリソソーム; 分解酵素 and 活性酸素 (O₂⁻ / H₂O₂ / HOCl) destroy the bacterium. Inset (top-left) runs
   * BS.diag.phagocytosis in sync (p 0.40→0.97). Step strip: 食胞 → 顆粒が融合 → ファゴリソソーム → 分解酵素・活性酸素.
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.18 phagosome with the bacterium inside + label 食胞（ファゴソーム）
   *   0.18–0.28 granule labels (アズール顆粒＝リソソーム / 特殊顆粒)
   *   0.25–0.55 granules fuse one by one (flashes; contents spread in the lumen)
   *   0.55–0.64 label → ファゴリソソーム, lumen glows
   *   0.62–0.90 分解酵素 + 活性酸素 tokens; bacterium digested (0.64 → 0.95)
   *   0.90–1.00 caption 「分解酵素と活性酸素で細菌を破壊」 (hold)
   */
  var PL = null;
  function plGeom() {
    if (PL) return PL;
    var R = rng(303), gs = [], i;
    for (i = 0; i < 14; i++) {
      var azu = i % 2 === 0 && i < 12, a = (i / 14) * TAU + (R() - 0.5) * 0.25, d = 300 + R() * 60;
      gs.push({ azu: azu, a: a, d: d, r: azu ? 30 : 17, st: 0.25 + (i / 14) * 0.24 + R() * 0.02, seed: R() });
    }
    PL = { gs: gs }; return PL;
  }
  function phagolysosome(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1560, PH = 880;
    var ca = begin(ctx, o, PW, PH, '食胞からファゴリソソームへ', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var G = plGeom(), cx = 230, cy = -30, VR = 200, i;
    ctx.save(); clipPanel(ctx, PW, PH);
    // cytoplasm backdrop (lilac disc)
    var bgA = smooth(0.06, 0.14, p);
    if (bgA > 0) {
      ctx.save(); ctx.globalAlpha *= bgA * 0.9;
      var cg = ctx.createRadialGradient(cx, cy, 50, cx, cy, 470); cg.addColorStop(0, 'rgba(176,130,186,0.62)'); cg.addColorStop(0.7, 'rgba(140,96,160,0.5)'); cg.addColorStop(1, 'rgba(120,80,140,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 470, 0, TAU); ctx.fill();
      var Rd = rng(17); ctx.beginPath(); for (i = 0; i < 120; i++) { var a0 = Rd() * TAU, d0 = 230 + Rd() * 220; ctx.moveTo(cx + Math.cos(a0) * d0 + 2.5, cy + Math.sin(a0) * d0); ctx.arc(cx + Math.cos(a0) * d0, cy + Math.sin(a0) * d0, 2.5, 0, TAU); }
      ctx.fillStyle = 'rgba(200,140,190,0.5)'; ctx.fill();
      ctx.restore();
    }
    var vA = smooth(0.07, 0.16, p), fuseAmt = 0, bumps = [];
    // vesicle membrane radius with fusion bumps
    G.gs.forEach(function (g) { var f = win(p, g.st + 0.05, g.st + 0.08); if (f > 0 && f < 1) bumps.push([g.a, Math.sin(f * Math.PI) * 18]); if (f >= 1) fuseAmt += 1 / G.gs.length; });
    function vr(a) { var r = VR * (1 + 0.02 * Math.sin(a * 3 + t * 1.2)); for (var k = 0; k < bumps.length; k++) { var d = Math.atan2(Math.sin(a - bumps[k][0]), Math.cos(a - bumps[k][0])); r += bumps[k][1] * Math.exp(-(d * d) / 0.05); } return r; }
    var plA = smooth(0.55, 0.64, p);
    if (vA > 0) {
      ctx.save(); ctx.globalAlpha *= vA;
      ctx.beginPath(); for (i = 0; i <= 90; i++) { var a1 = (i / 90) * TAU, r1 = vr(a1); if (i === 0) ctx.moveTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1); else ctx.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1); }
      ctx.closePath();
      var lg = ctx.createRadialGradient(cx, cy, 20, cx, cy, VR); lg.addColorStop(0, rgba(mixC([250, 246, 250], [255, 214, 236], plA), 0.95)); lg.addColorStop(1, rgba(mixC([236, 228, 244], [236, 160, 214], plA), 0.95));
      ctx.fillStyle = lg; ctx.fill();
      ctx.save(); ctx.clip();
      // bacterium inside
      if (D.bacterium) D.bacterium(ctx, { x: cx, y: cy, size: 250, t: t, state: p < 0.64 ? 'caught' : 'digested', p: win(p, 0.64, 0.95), flagella: 0.25, seed: 2, spread: 0.6, rot: -0.2 });
      // contents of fused granules
      G.gs.forEach(function (g, gi) {
        var f = win(p, g.st + 0.06, g.st + 0.2); if (f <= 0) return;
        var Rc = rng(gi * 13 + 5), col = g.azu ? [190, 80, 210] : [255, 150, 200];
        for (var j = 0; j < 7; j++) {
          var sx = cx + Math.cos(g.a) * VR, sy = cy + Math.sin(g.a) * VR, ta = g.a + Math.PI + (Rc() - 0.5) * 1.6, td = (0.3 + Rc() * 0.7) * VR * eout(f);
          var px = sx + Math.cos(ta) * td + Math.sin(t * 1.5 + j) * 5, py = sy + Math.sin(ta) * td + Math.cos(t * 1.3 + j) * 5;
          ctx.beginPath(); ctx.arc(px, py, g.azu ? 5 : 3.5, 0, TAU); ctx.fillStyle = rgba(col, 0.85); ctx.fill();
        }
      });
      if (plA > 0) glow(ctx, cx, cy, VR * 1.1, [255, 140, 200], 0.4 * plA * (0.85 + 0.15 * Math.sin(t * 3)));
      ctx.restore();
      // double membrane
      ctx.beginPath(); for (i = 0; i <= 90; i++) { a1 = (i / 90) * TAU; r1 = vr(a1); if (i === 0) ctx.moveTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1); else ctx.lineTo(cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1); }
      ctx.closePath(); ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(150,90,180,0.85)'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,240,255,0.9)'; ctx.stroke();
      if (plA > 0) gline(ctx, [255, 140, 200], 3, 0.8 * plA);
      ctx.restore();
    }
    // granules travelling + fusing
    G.gs.forEach(function (g) {
      var appear = smooth(0.12, 0.2, p), mv = eio(win(p, g.st, g.st + 0.06)), fuse = win(p, g.st + 0.05, g.st + 0.09);
      if (fuse >= 1 || appear <= 0) return;
      var d = lerp(g.d, VR + g.r * 0.6, mv), gx = cx + Math.cos(g.a) * d + Math.sin(t * 1.1 + g.seed * 9) * 4 * (1 - mv), gy = cy + Math.sin(g.a) * d + Math.cos(t * 1.3 + g.seed * 7) * 4 * (1 - mv);
      var rr = g.r * (1 - fuse * 0.9);
      ctx.save(); ctx.globalAlpha *= appear;
      var gg = ctx.createRadialGradient(gx - rr * 0.3, gy - rr * 0.3, rr * 0.1, gx, gy, rr);
      if (g.azu) { gg.addColorStop(0, '#b468d0'); gg.addColorStop(1, '#5a1868'); } else { gg.addColorStop(0, '#ffd0e8'); gg.addColorStop(1, '#d880b4'); }
      ctx.beginPath(); ctx.arc(gx, gy, rr, 0, TAU); ctx.fillStyle = gg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,30,90,0.8)'; ctx.stroke();
      ctx.restore();
      if (fuse > 0) sparkle(ctx, cx + Math.cos(g.a) * VR, cy + Math.sin(g.a) * VR, 22 * Math.sin(fuse * Math.PI), g.azu ? [220, 140, 255] : [255, 180, 220], 1, t + g.a);
    });
    // ROS + enzymes
    var ros = win(p, 0.62, 0.9);
    if (ros > 0) {
      var toks = ['O₂⁻', 'H₂O₂', 'HOCl', 'O₂⁻', 'HOCl', 'H₂O₂'];
      for (i = 0; i < toks.length; i++) {
        var ph = mod(t * 0.25 + i / toks.length, 1), an = (i / toks.length) * TAU + t * 0.3, dd = VR * (0.35 + 0.35 * Math.sin(ph * Math.PI));
        tokenPill(ctx, toks[i], cx + Math.cos(an) * dd, cy + Math.sin(an) * dd * 0.8, [255, 200, 90], smooth(0, 0.2, ros) * (0.4 + 0.6 * Math.sin(ph * Math.PI)), 20);
      }
      for (i = 0; i < 8; i++) { var sa = i * 0.8 + t * 1.7, sd = VR * 0.3 * (0.5 + 0.5 * Math.sin(t * 3 + i)); sparkle(ctx, cx + Math.cos(sa) * sd, cy + Math.sin(sa) * sd, 14, [255, 240, 160], ros * Math.pow(Math.max(0, Math.sin(t * 5 + i * 1.7)), 3), sa); }
    }
    ctx.restore(); // clip
    // labels
    var lab0 = win(p, 0.1, 0.18) * (1 - smooth(0.55, 0.6, p)), lab1 = win(p, 0.56, 0.64);
    if (lab0 > 0) tagW(ctx, '食胞（ファゴソーム）', 470, -320, { size: 36, accent: [214, 180, 255], grow: lab0, tx: cx + VR * 0.6, ty: cy - VR * 0.8, sub: '細菌を包みこんだ袋', subSize: 22 });
    if (lab1 > 0) tagW(ctx, 'ファゴリソソーム', 470, -320, { size: 40, accent: [255, 140, 200], grow: lab1, tx: cx + VR * 0.6, ty: cy - VR * 0.8, sub: '食胞に顆粒の中身が加わった', subSize: 22 });
    var gl = win(p, 0.18, 0.26) * (1 - smooth(0.31, 0.35, p));
    if (gl > 0) {
      var ga = G.gs[6], gs2 = G.gs[13];
      tagW(ctx, 'アズール顆粒（リソソーム）', -330, 150, { size: 30, accent: [200, 110, 230], grow: gl, tx: cx + Math.cos(ga.a) * ga.d, ty: cy + Math.sin(ga.a) * ga.d });
      tagW(ctx, '特殊顆粒', 600, -60, { size: 30, accent: [255, 160, 210], grow: gl, tx: cx + Math.cos(gs2.a) * gs2.d, ty: cy + Math.sin(gs2.a) * gs2.d });
    }
    var fl = win(p, 0.3, 0.38) * (1 - smooth(0.56, 0.6, p));
    if (fl > 0) chipW(ctx, '顆粒が食胞に融合', 600, 110, { size: 30, accent: [214, 180, 255], alpha: fl });
    var rl = win(p, 0.66, 0.74);
    if (rl > 0) { chipW(ctx, '分解酵素', 600, 60, { size: 30, accent: [255, 160, 210], alpha: rl, fill: 'solid' }); chipW(ctx, '活性酸素', 600, 130, { size: 30, accent: [255, 200, 90], alpha: win(p, 0.7, 0.78), fill: 'solid' }); }
    var fin = win(p, 0.9, 0.97);
    if (fin > 0) txt(ctx, '分解酵素と活性酸素で細菌を破壊', cx, 245, { size: 34, align: 'center', a: fin, color: [255, 240, 220], glow: [255, 160, 120] });
    // inset: whole cell (diag_wbc phagocytosis in sync)
    if (o.inset !== false && D.phagocytosis) {
      var iA = smooth(0.08, 0.16, p);
      if (iA > 0) {
        ctx.save(); ctx.globalAlpha *= iA;
        card(ctx, -755, -345, 440, 360, TEAL, 1);
        ctx.save(); rrect(ctx, -750, -340, 430, 350, 16); ctx.clip();
        D.phagocytosis(ctx, { x: -560, y: -150, scale: 0.34, p: lerp(0.4, 0.97, win(p, 0.07, 1)), t: t, labels: false, steps: false });
        ctx.restore();
        txt(ctx, '好中球の中（全体）', -730, -318, { size: 22, color: [200, 240, 255] });
        ctx.restore();
      }
    }
    if (o.steps !== false && D.wbcStepper) {
      var act = p < 0.25 ? 0 : p < 0.55 ? 1 : p < 0.64 ? 2 : 3;
      D.wbcStepper(ctx, ['食胞', '顆粒が融合', 'ファゴリソソーム', '分解酵素・活性酸素で破壊'], 0, 380, act, { size: 24, accent: [214, 180, 255], alpha: smooth(0.08, 0.16, p) });
    }
    ctx.restore();
  }

  /* ===================================================== 5. eosinophilCard */
  /**
   * eosinophilCard(ctx, {x, y, scale, p, t, alpha, panel})   natural size 1560×880 (slide 18)
   * 好酸球: bilobed nucleus (二分葉核), coarse granules 0.5〜0.7 μm (濃いピンク), EM inset with the rod-shaped
   * crystalloid core (電顕：杆状結晶状の芯), 「白血球の2〜3%」, 「顆粒の中身を放出（食作用はあまりない）」, and two
   * function cards: 好酸球ペルオキシダーゼ (binds the microbe membrane → helps macrophage phagocytosis) and
   * MBP 主要塩基性タンパク質 (binds and breaks the parasite membrane). Footer 「アレルギー疾患・寄生虫感染で増加」.
   * p stages:
   *   0.00–0.07 panel on
   *   0.05–0.20 cell scans in
   *   0.20–0.30 二分葉核 tag ; 0.30–0.40 特殊顆粒 0.5〜0.7 μm tag
   *   0.40–0.52 EM inset (crystalloid cores)
   *   0.50–0.58 chip 白血球の2〜3%
   *   0.56–0.64 「顆粒の中身を放出」 + granule stream toward the cards (continues)
   *   0.62–0.78 ペルオキシダーゼ card: EPO coats the microbe → macrophage engulfs it
   *   0.76–0.92 MBP card: MBP binds the worm → membrane ruptures
   *   0.90–1.00 chip アレルギー疾患・寄生虫感染で増加 (hold)
   */
  function eosinophilCard(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1560, PH = 880;
    var ca = begin(ctx, o, PW, PH, '好酸球（ユズ）', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var acc = ACC.eosinophil, cx = -500, cy = -30, r = 205, seed = 2;
    var G = D.wbcCellAnchors ? D.wbcCellAnchors('eosinophil', seed) : { lobes: [{ x: -0.28, y: -0.1 }], gran: [[0.5, 0.5, 0]] };
    var scan = smooth(0.05, 0.2, p);
    if (scan > 0) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r * 1.22, 0, TAU); gline(ctx, acc, 1.5, 0.4 * scan, [3, 9], t * 12); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(cx - r * 1.4, cy - r * 1.4, r * 2.8, r * 2.8 * scan); ctx.clip();
      cell(ctx, 'eosinophil', cx, cy, r, 0, { seed: seed, glow: 0.6 }); ctx.restore();
    }
    var lobe = G.lobes[0], gr = G.gran.reduce(function (a, b) { return b[1] > a[1] ? b : a; });
    tagW(ctx, '二分葉核', -700, -340, { size: 40, accent: acc, grow: win(p, 0.2, 0.3), tx: cx + lobe.x * r, ty: cy + lobe.y * r });
    tagW(ctx, '特殊顆粒 0.5〜0.7 μm', -720, 260, { size: 32, accent: acc, grow: win(p, 0.3, 0.4), tx: cx + gr[0] * r, ty: cy + gr[1] * r, sub: '大きく、濃いピンク（好酸性）', subSize: 22 });
    var pc = win(p, 0.5, 0.58);
    if (pc > 0) { ctx.save(); ctx.translate(cx, 350); var s = eback(pc); ctx.scale(s, s); chipW(ctx, '白血球の2〜3%', 0, 0, { size: 34, accent: acc, fill: 'solid' }); ctx.restore(); }
    // EM inset
    var em = win(p, 0.4, 0.5), ex = 20, ey = -200, ER = 135;
    if (em > 0) {
      var gx0 = cx + G.gran[3][0] * r, gy0 = cy + G.gran[3][1] * r;
      ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(ex - ER * 0.7, ey - ER * 0.7); ctx.moveTo(gx0, gy0); ctx.lineTo(ex - ER * 0.7, ey + ER * 0.7); gline(ctx, TEAL, 1.2, 0.35 * em, [5, 7]);
      ctx.save(); ctx.globalAlpha *= smooth(0, 0.5, em);
      var rr = ER * eback(em);
      ctx.beginPath(); ctx.arc(ex, ey, rr, 0, TAU); ctx.fillStyle = '#c9c4c8'; ctx.fill();
      ctx.save(); ctx.clip();
      var Re = rng(23); ctx.fillStyle = 'rgba(120,110,118,0.25)'; for (var n = 0; n < 60; n++) { ctx.beginPath(); ctx.arc(ex + (Re() - 0.5) * 2 * ER, ey + (Re() - 0.5) * 2 * ER, 1.5 + Re() * 2, 0, TAU); ctx.fill(); }
      [[-50, -55, 0.5], [45, -40, -0.4], [-30, 45, 1.2], [60, 55, 0.2], [-95, 5, -1.0], [5, 110, 0.7], [95, -100, 1.4]].forEach(function (q) {
        ctx.save(); ctx.translate(ex + q[0] * rr / ER, ey + q[1] * rr / ER); ctx.rotate(q[2]);
        ctx.beginPath(); ctx.ellipse(0, 0, 42, 28, 0, 0, TAU); ctx.fillStyle = '#9b9298'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#4a4248'; ctx.stroke();
        ctx.fillStyle = '#1e1a1e'; ctx.fillRect(-26, -7, 52, 14);
        ctx.restore();
      });
      ctx.restore();
      ctx.beginPath(); ctx.arc(ex, ey, rr, 0, TAU); gline(ctx, TEAL, 3, 0.95);
      ctx.restore();
      txt(ctx, '電子顕微鏡で見た顆粒', ex, ey - ER - 28, { size: 24, align: 'center', a: em, color: [200, 240, 255] });
      tagW(ctx, '杆状結晶状の芯', ex + 30, ey + ER + 60, { size: 30, accent: [255, 220, 160], grow: win(p, 0.44, 0.52), align: 'center', tx: ex - 30 * rr / ER, ty: ey + 45 * rr / ER });
    }
    // degranulation stream
    var dg = win(p, 0.56, 0.64);
    if (dg > 0) {
      txt(ctx, '顆粒の中身を放出', ex, 150, { size: 30, align: 'center', a: dg, color: mixC(acc, WHITE, 0.5), glow: acc });
      txt(ctx, '（食作用はあまりない）', ex, 190, { size: 22, align: 'center', a: dg, color: [235, 220, 220] });
      for (var k = 0; k < 14; k++) {
        var ph = mod(t * 0.4 + k / 14, 1), sx = cx + r * 0.9, sy = cy + (k % 5 - 2) * 40, tx2 = 290, ty2 = k % 2 ? -170 : 130;
        var px = lerp(sx, tx2, ph), py = lerp(sy, ty2, ph) + Math.sin(ph * 6 + k) * 18;
        glow(ctx, px, py, 16, acc, 0.6 * dg * Math.sin(ph * Math.PI)); ctx.beginPath(); ctx.arc(px, py, 4.5, 0, TAU); ctx.fillStyle = rgba(acc, dg * Math.sin(ph * Math.PI)); ctx.fill();
      }
    }
    // function cards
    var c1 = win(p, 0.62, 0.68), c2 = win(p, 0.76, 0.82), X0 = 290, W0 = 470;
    card(ctx, X0, -345, W0, 300, acc, c1);
    if (c1 > 0) {
      ctx.save(); ctx.globalAlpha *= c1;
      txt(ctx, '好酸球ペルオキシダーゼ', X0 + 26, -310, { size: 30, color: mixC(acc, WHITE, 0.5) });
      var e1 = win(p, 0.66, 0.72), e2 = eio(win(p, 0.72, 0.8));
      var mxc = X0 + 110, myc = -200;
      var rad = macrophageCell(ctx, { x: mxc, y: myc, r: 60, t: t, seed: 4 });
      var bxp = lerp(X0 + 330, mxc + 70, e2), byp = myc;
      if (D.bacterium) D.bacterium(ctx, { x: bxp, y: byp, size: 90, t: t, flagella: 0.4, eyes: true, seed: 4, rot: Math.PI, alpha: 1 - 0.5 * smooth(0.85, 1, e2) });
      var Rp = rng(61);
      for (var j = 0; j < 10; j++) { var aa = (j / 10) * TAU, d0 = 120 + Rp() * 60; var qx = lerp(bxp + Math.cos(aa) * d0, bxp + Math.cos(aa) * 34, eout(e1)), qy = lerp(byp + Math.sin(aa) * d0, byp + Math.sin(aa) * 22, eout(e1)); ctx.beginPath(); ctx.arc(qx, qy, 5, 0, TAU); ctx.fillStyle = rgba(acc, smooth(0, 0.3, e1)); ctx.fill(); }
      txt(ctx, 'ペルオキシダーゼ', X0 + 340, -125, { size: 20, align: 'center', a: e1, color: mixC(acc, WHITE, 0.4) });
      txt(ctx, 'マクロファージ', mxc, myc + 84, { size: 18, align: 'center', color: [140, 230, 220] });
      txt(ctx, '微生物の膜に結合 → マクロファージの', X0 + 26, -80, { size: 23, a: win(p, 0.7, 0.78) });
      txt(ctx, '食作用を助ける', X0 + 26, -50, { size: 23, a: win(p, 0.72, 0.8), color: [255, 230, 210] });
      ctx.restore();
    }
    card(ctx, X0, -20, W0, 300, acc, c2);
    if (c2 > 0) {
      ctx.save(); ctx.globalAlpha *= c2;
      txt(ctx, 'MBP（主要塩基性タンパク質）', X0 + 26, 15, { size: 28, color: mixC(acc, WHITE, 0.5) });
      var m1 = win(p, 0.8, 0.86), m2 = win(p, 0.85, 0.92);
      worm(ctx, X0 + 240, 125, 330, t, m2, 1, -0.05);
      var Rm = rng(77);
      for (j = 0; j < 12; j++) {
        var u = (j + 0.5) / 12, wx = X0 + 240 + (u - 0.5) * 300, wy = 125 + Math.sin(u * 6.5 + t * 2.2) * 330 * 0.07 * (1 - 0.7 * m2) - 22 * (j % 2 ? 1 : -1);
        var sx2 = wx + (Rm() - 0.5) * 200, sy2 = wy - 120 - Rm() * 60;
        ctx.save(); ctx.translate(lerp(sx2, wx, eout(m1)), lerp(sy2, wy, eout(m1))); ctx.rotate(Math.PI / 4);
        ctx.fillStyle = rgba([255, 90, 60], smooth(0, 0.3, m1)); ctx.fillRect(-5, -5, 10, 10); ctx.restore();
      }
      txt(ctx, '寄生虫', X0 + 420, 70, { size: 20, align: 'center', color: [240, 220, 190] });
      txt(ctx, '寄生虫の膜に結合して破壊', X0 + 26, 245, { size: 24, a: win(p, 0.84, 0.92), color: [255, 230, 210] });
      ctx.restore();
    }
    var inc = win(p, 0.9, 0.97);
    if (inc > 0) chipW(ctx, 'アレルギー疾患・寄生虫感染で増加', 525, 345, { size: 28, accent: acc, alpha: inc });
    ctx.restore();
  }

  /* ================================================== 6. basophilHistamine */
  /**
   * basophilHistamine(ctx, {x, y, scale, p, t, alpha, panel, antigen=true, parasiteNote=true})   1640×900 (slide 19)
   * 好塩基球 (white cell share 約0.5%, coarse dark-blue granules 1〜2 μm) with IgE Fc receptors on its surface:
   * IgE docks on the receptors, an antigen bridges two IgE (antigen:false hides it), the granules are released
   * → ヒスタミン flows to three effect cards: ① 平滑筋の収縮（気道・消化管）＝ airway narrowing → ぜんそく,
   * ② 血管拡張, ③ 血管透過性の上昇. Footer: 「ぜんそくなどのアレルギー反応」 and (parasiteNote) 「本来は寄生虫への防御？」.
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.18 cell
   *   0.16–0.28 chips 白血球の約0.5% / 顆粒 1〜2 μm（濃い青）
   *   0.26–0.40 Fc receptors grow, IgE flies in and docks; tag IgEのFc受容体
   *   0.40–0.48 antigen bridges two IgE → trigger flash
   *   0.46–0.60 degranulation, histamine tokens stream right (continues)
   *   0.58–0.72 ① airway constricts (ぜんそく) ; 0.70–0.82 ② vessel widens ; 0.80–0.92 ③ leaky wall
   *   0.90–1.00 footer chips (hold)
   */
  function basophilHistamine(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1640, PH = 900;
    var ca = begin(ctx, o, PW, PH, '好塩基球（ゴウ）とヒスタミン', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var acc = ACC.basophil, cx = -500, cy = -60, r = 175, i;
    var cA = smooth(0.07, 0.16, p);
    var trig = smooth(0.42, 0.46, p), deg = win(p, 0.46, 0.6);
    // receptors + IgE (behind the cell edge)
    var angs = [-2.2, -1.75, -1.3, -0.85, -0.4, 0.05, 0.5, 0.95, 1.4, 1.85, 2.3, 2.75];
    var dock = [];
    for (i = 0; i < angs.length; i++) {
      var an = angs[i], gr = eout(win(p, 0.26 + i * 0.005, 0.32 + i * 0.005)), mx = cx + Math.cos(an) * r * 0.98, my = cy + Math.sin(an) * r * 0.98;
      var tip = receptor(ctx, 'fce', mx, my, an, 46 * gr, cA * (gr > 0 ? 1 : 0), trig * (i === 4 || i === 5 ? 1 : 0.4));
      var k = eout(win(p, 0.3 + i * 0.006, 0.38 + i * 0.006));
      if (k > 0) {
        var Rf = rng(i * 7 + 3), fx = cx + Math.cos(an) * 520 + (Rf() - 0.5) * 100, fy = cy + Math.sin(an) * 420;
        var tx = lerp(fx, tip[0], k), ty = lerp(fy, tip[1], k), aa = lerp(an + (Rf() - 0.5) * 4, an, k);
        dock.push(antibodyY(ctx, tx, ty, aa, 60, { col: IGCOL.IgE, a: smooth(0, 0.2, k) }));
      } else dock.push(null);
    }
    cell(ctx, 'basophil', cx, cy, r, t, { seed: 2, glow: 0.6, alpha: cA });
    // antigen bridge between IgE 4 and 5
    if (o.antigen !== false && dock[4] && dock[5]) {
      var ag = eout(win(p, 0.4, 0.45)), mxp = (dock[4][0] + dock[5][0]) / 2 + Math.cos(-0.18) * 18, myp = (dock[4][1] + dock[5][1]) / 2 + Math.sin(-0.18) * 18;
      var axp = lerp(mxp + 260, mxp, ag), ayp = lerp(myp - 160, myp, ag);
      if (ag > 0) {
        ctx.save(); ctx.globalAlpha *= smooth(0, 0.3, ag);
        ctx.beginPath(); for (var q = 0; q < 6; q++) { var qa = (q / 6) * TAU + t; ctx.moveTo(axp + Math.cos(qa) * 14 + 10, ayp + Math.sin(qa) * 14); ctx.arc(axp + Math.cos(qa) * 14, ayp + Math.sin(qa) * 14, 10, 0, TAU); }
        ctx.fillStyle = '#d6f56a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#3c5010'; ctx.stroke();
        ctx.restore();
        txt(ctx, '抗原', axp + 4, ayp - 42, { size: 24, align: 'center', a: ag, color: [214, 245, 106] });
      }
      if (trig > 0) sparkle(ctx, axp, ayp, 40 * bell(p, 0.43, 0.45, 0.48, 0.54), [255, 160, 240], 1, t);
    }
    // degranulation: granules leave + histamine tokens
    if (deg > 0) {
      var Rg = rng(88);
      for (i = 0; i < 10; i++) {
        var ga = -0.9 + Rg() * 1.8, st = i * 0.06, gp = win(deg, st, st + 0.4), gd = r * lerp(0.7, 1.15, eout(gp)), gx = cx + Math.cos(ga) * gd, gy = cy + Math.sin(ga) * gd;
        var burst = smooth(0.6, 1, gp);
        if (burst < 1) { ctx.beginPath(); ctx.arc(gx, gy, 14 * (1 - burst * 0.8), 0, TAU); ctx.fillStyle = 'rgba(56,16,96,0.95)'; ctx.fill(); }
        if (burst > 0) glow(ctx, gx, gy, 34, [255, 150, 230], 0.8 * Math.sin(burst * Math.PI));
      }
      for (i = 0; i < 9; i++) {
        var ph = mod(t * 0.33 + i / 9, 1) * smooth(0, 0.3, deg), lane = [-280, -60, 160][i % 3];
        var hx = lerp(cx + r * 0.8, 170, ph), hy = lerp(cy + r * 0.62 + (i % 3) * 30, lane, eio(ph));
        tokenPill(ctx, 'ヒスタミン', hx, hy, [255, 150, 230], smooth(0, 0.1, ph) * (1 - smooth(0.85, 1, ph)) * smooth(0, 0.2, deg), 18);
      }
    }
    var ch = win(p, 0.16, 0.24), ch2 = win(p, 0.2, 0.28);
    if (ch > 0) chipW(ctx, '白血球の約0.5%', cx, 245, { size: 32, accent: acc, fill: 'solid', alpha: ch });
    var gsel = D.wbcCellAnchors ? D.wbcCellAnchors('basophil', 2).gran : [[0.3, 0.4]];
    var g0 = gsel.reduce(function (a, b) { return b[1] > a[1] ? b : a; });
    tagW(ctx, '顆粒 1〜2 μm', -760, 330, { size: 30, accent: acc, grow: ch2, tx: cx + g0[0] * r, ty: cy + g0[1] * r, sub: '大きく、濃い青（好塩基性）', subSize: 20 });
    tagW(ctx, 'IgEのFc受容体', -760, -340, { size: 32, accent: [255, 130, 210], grow: win(p, 0.32, 0.4), tx: cx + Math.cos(angs[1]) * (r + 30), ty: cy + Math.sin(angs[1]) * (r + 30), sub: 'IgEが結合 → 顆粒の中身を放出', subSize: 20 });
    // effect cards
    var X0 = 200, W0 = 590, H0 = 200, ys = [-345, -125, 95];
    var e = [win(p, 0.58, 0.64), win(p, 0.7, 0.76), win(p, 0.8, 0.86)];
    var heads = ['平滑筋の収縮（気道・消化管）', '血管拡張', '血管透過性の上昇'];
    var subs = ['気道が狭くなる → ぜんそく', '血管が広がる', '血管から液体が漏れやすくなる'];
    for (i = 0; i < 3; i++) {
      if (e[i] <= 0) continue;
      card(ctx, X0, ys[i], W0, H0, [255, 150, 230], e[i]);
      ctx.save(); ctx.globalAlpha *= e[i];
      var ix = X0 + 110, iy = ys[i] + H0 / 2, act = [win(p, 0.6, 0.7), win(p, 0.72, 0.8), win(p, 0.82, 0.9)][i];
      if (i === 0) airway(ctx, ix, iy, 70, act, t);
      else if (i === 1) vesselIcon(ctx, ix, iy, act, t, false);
      else vesselIcon(ctx, ix, iy, act, t, true);
      txt(ctx, (i + 1) + '. ' + heads[i], X0 + 215, ys[i] + 70, { size: 26, color: [255, 220, 245] });
      txt(ctx, subs[i], X0 + 215, ys[i] + 130, { size: 24, a: win(act, 0.3, 0.8), color: [235, 244, 255] });
      ctx.restore();
    }
    var f1 = win(p, 0.9, 0.96);
    if (f1 > 0) {
      chipW(ctx, 'ぜんそくなどのアレルギー反応', 495, 345, { size: 28, accent: [255, 150, 230], fill: 'solid', alpha: f1 });
      if (o.parasiteNote !== false) txt(ctx, '本来は寄生虫への防御？（資料も疑問形）', 495, 395, { size: 21, align: 'center', a: win(p, 0.94, 1), color: [220, 210, 240] });
    }
    ctx.restore();
  }
  /** airway cross-section: smooth-muscle ring contracts with k (0..1) → lumen narrows (ぜんそく) */
  function airway(ctx, x, y, R, k, t) {
    var lum = R * lerp(0.62, 0.28, eio(k)), i;
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = '#e8a8a8'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#7a2a38'; ctx.stroke();
    // smooth-muscle band
    ctx.beginPath(); ctx.arc(0, 0, lerp(R * 0.84, R * 0.72, k), 0, TAU); ctx.lineWidth = R * 0.16; ctx.strokeStyle = '#c0485a'; ctx.stroke();
    ctx.beginPath(); for (i = 0; i < 16; i++) { var a = (i / 16) * TAU; ctx.moveTo(Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66); ctx.lineTo(Math.cos(a + 0.2) * R * 0.9, Math.sin(a + 0.2) * R * 0.9); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(90,20,30,0.5)'; ctx.stroke();
    // mucosa folds + lumen
    ctx.beginPath();
    for (i = 0; i <= 48; i++) { var a2 = (i / 48) * TAU, rr = lum * (1 + 0.18 * k * Math.sin(a2 * 8)); if (i === 0) ctx.moveTo(Math.cos(a2) * rr, Math.sin(a2) * rr); else ctx.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr); }
    ctx.closePath(); ctx.fillStyle = '#1a0a18'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffb8c8'; ctx.stroke();
    if (k > 0.05) for (i = 0; i < 4; i++) { var a3 = (i / 4) * TAU + 0.78; arrow(ctx, Math.cos(a3) * R * 1.32, Math.sin(a3) * R * 1.32, Math.cos(a3) * R * 1.05, Math.sin(a3) * R * 1.05, smooth(0, 0.5, k), [255, 150, 230], 3); }
    ctx.restore();
  }
  function vesselIcon(ctx, x, y, k, t, leaky) {
    var hw = 80, h = leaky ? 34 : lerp(24, 44, eio(k)), i;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(200,30,50,0.55)'; ctx.fillRect(-hw, -h, hw * 2, h * 2);
    ctx.beginPath(); for (i = 0; i < 6; i++) { var fx = -hw + mod(t * 60 + i * 30, hw * 2); ctx.moveTo(fx + 8, 0); ctx.ellipse(fx, (i % 3 - 1) * h * 0.4, 8, 5, 0, 0, TAU); } ctx.fillStyle = '#ff4060'; ctx.fill();
    for (var s = -1; s <= 1; s += 2) {
      if (!leaky) { ctx.beginPath(); ctx.moveTo(-hw, s * h); ctx.lineTo(hw, s * h); gline(ctx, [255, 150, 160], 4, 1); if (k > 0.05) arrow(ctx, 0, s * (h + 8), 0, s * (h + 34), smooth(0, 0.5, k), [255, 150, 230], 3); }
      else {
        var gap = 12 * eio(k);
        for (var sgm = 0; sgm < 4; sgm++) { var x0 = -hw + sgm * 40 + gap / 2, x1 = -hw + (sgm + 1) * 40 - gap / 2; ctx.beginPath(); ctx.moveTo(x0, s * h); ctx.lineTo(x1, s * h); gline(ctx, [255, 150, 160], 4, 1); }
        for (var d = 0; d < 3; d++) { var ph = mod(t * 0.8 + d / 3 + (s > 0 ? 0.5 : 0), 1), lx = -hw + 40 * (d + 1); ctx.beginPath(); ctx.arc(lx, s * (h + ph * 40 * k), 4, 0, TAU); ctx.fillStyle = rgba([255, 230, 160], k * (1 - ph)); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  /* ===================================================== 7. macrophageCard */
  /**
   * macrophageCard(ctx, {x, y, scale, p, t, alpha, panel})   natural size 1560×880 (slides 20・21; script #26–28)
   * 単球 in the blood (「白血球の約5%」「血液中は20時間以内」) squeezes out through the vessel wall and becomes a
   * マクロファージ（大食細胞） (「直径 10〜30 μm・組織により様々」 small sub), which then engulfs, one by one,
   * 細菌 / 寄生虫 / 細胞 / 異物 (非生物性) — 「細菌以外に、寄生虫・細胞・異物も貪食」.
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.18 vessel + monocyte ; 0.14–0.26 chips 約5% / 20時間以内
   *   0.28–0.44 monocyte squeezes through the wall (遊走)
   *   0.42–0.56 grows into the macrophage (morph) + label マクロファージ（大食細胞）
   *   0.58–0.92 targets pulled in: 細菌 .58, 寄生虫 .66, 細胞 .74, 異物 .82 (each ≈0.08)
   *   0.90–1.00 caption (hold)
   */
  function macrophageCard(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1560, PH = 880;
    var ca = begin(ctx, o, PW, PH, '単球からマクロファージへ', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var acc = ACC.monocyte, WX = -360, i;
    var vA = smooth(0.07, 0.14, p);
    ctx.save(); clipPanel(ctx, PW, PH);
    if (vA > 0) {
      ctx.save(); ctx.globalAlpha *= vA;
      var vg = ctx.createLinearGradient(-PW / 2, 0, WX, 0); vg.addColorStop(0, 'rgba(120,10,30,0.55)'); vg.addColorStop(1, 'rgba(170,30,50,0.4)');
      var YT = -PH / 2 + 88; ctx.fillStyle = vg; ctx.fillRect(-PW / 2, YT, WX + PW / 2, PH / 2 - YT);
      ctx.save(); ctx.beginPath(); ctx.rect(-PW / 2, YT, PW, PH); ctx.clip();
      for (i = 0; i < 9; i++) { var ry = -PH / 2 + mod(i * 110 + t * 50, PH + 100) - 50, rx = -700 + (i % 3) * 110; if (W_() && W_().drawRBC) W_().drawRBC(ctx, { x: rx, y: ry, r: 34, t: t, rot: i, alpha: 0.6 }); }
      for (var yy = -PH / 2; yy < PH / 2; yy += 70) { rrect(ctx, WX - 16, yy + 4, 32, 62, 14); ctx.fillStyle = 'rgba(240,150,160,0.85)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(120,30,50,0.9)'; ctx.stroke(); }
      ctx.restore();
      txt(ctx, '血管の中', -740, -320, { size: 26, color: [255, 190, 200] });
      txt(ctx, '組織（血管の外）', WX + 40, -320, { size: 26, color: [190, 255, 240] });
      ctx.restore();
    }
    var squeeze = win(p, 0.28, 0.44), grow = eio(win(p, 0.42, 0.56));
    var mx = squeeze < 1 ? lerp(-560, WX + 120, eio(squeeze)) : lerp(WX + 120, -40, grow), my = lerp(-40, -20, grow);
    var mA = smooth(0.08, 0.16, p);
    if (grow <= 0) {
      ctx.save(); ctx.translate(mx, my);
      var dw = Math.abs(mx - WX), sq = dw < 120 ? lerp(0.45, 1, dw / 120) : 1;
      ctx.scale(sq, 1 / Math.sqrt(sq));
      cell(ctx, 'monocyte', 0, 0, 115, t, { seed: 3, alpha: mA, glow: 0.6 });
      ctx.restore();
    } else {
      cell(ctx, 'monocyte', mx, my, 115 * lerp(1, 1.4, grow), t, { seed: 3, alpha: 1 - smooth(0, 0.5, grow), glow: 0.4 });
      macrophageCell(ctx, { x: mx, y: my, r: lerp(115, 220, grow), t: t, seed: 2, morph: grow, alpha: smooth(0.1, 0.6, grow) });
    }
    // targets (eaten one by one)
    var T = [
      { name: '細菌', x: 420, y: -250, st: 0.58 }, { name: '寄生虫', x: 520, y: -50, st: 0.66 },
      { name: '細胞', x: 420, y: 150, st: 0.74 }, { name: '異物（非生物）', x: 200, y: 250, st: 0.82 }
    ];
    var tgA = smooth(0.56, 0.6, p);
    for (i = 0; i < T.length; i++) {
      var Tg = T[i], e = eio(win(p, Tg.st, Tg.st + 0.07)), fxp = [40, 120, 70, 140][i], fyp = [-90, -20, 70, 120][i], tx = lerp(Tg.x, fxp, e), ty = lerp(Tg.y, fyp, e), sc = 1 - 0.55 * e;
      if (tgA <= 0) break;
      ctx.save(); ctx.globalAlpha *= tgA * (1 - 0.4 * smooth(0.9, 1, e));
      ctx.translate(tx, ty); ctx.scale(sc, sc);
      if (i === 0 && D.bacterium) D.bacterium(ctx, { x: 0, y: 0, size: 120, t: t, flagella: 0.5, seed: 5, rot: Math.PI });
      else if (i === 1) worm(ctx, 0, 0, 200, t, 0, 1, 0.2);
      else if (i === 2) targetCell(ctx, 0, 0, 55, t, 1, 0.25, 4, 'plain');
      else { ctx.beginPath(); ctx.moveTo(-40, -10); ctx.lineTo(-10, -45); ctx.lineTo(35, -25); ctx.lineTo(45, 20); ctx.lineTo(0, 42); ctx.lineTo(-38, 25); ctx.closePath(); ctx.fillStyle = '#9aa4b0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#3a4048'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10, -45); ctx.lineTo(0, 0); ctx.lineTo(45, 20); ctx.moveTo(0, 0); ctx.lineTo(-38, 25); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
      if (e > 0.7) { ctx.beginPath(); ctx.arc(tx, ty, 46, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = rgba([150, 80, 170], smooth(0.7, 1, e)); ctx.stroke(); }
      var la = tgA * (1 - smooth(0.4, 0.8, e));
      if (la > 0) chipW(ctx, Tg.name, Tg.x, Tg.y + (i === 1 ? 60 : 85), { size: 26, accent: acc, alpha: la });
      if (e > 0.6) sparkle(ctx, tx, ty, 30 * bell(e, 0.6, 0.85, 0.9, 1), [140, 255, 230], 1, t);
    }
    ctx.restore(); // clip
    var c1 = win(p, 0.14, 0.2), c2 = win(p, 0.18, 0.26);
    if (c1 > 0) chipW(ctx, '単球：白血球の約5%', -560, 130, { size: 28, accent: acc, fill: 'solid', alpha: c1 * (1 - smooth(0.3, 0.36, p)) });
    if (c2 > 0) chipW(ctx, '血液中にいるのは20時間以内', -560, 190, { size: 26, accent: acc, alpha: c2 * (1 - smooth(0.3, 0.36, p)) });
    var mig = win(p, 0.3, 0.38) * (1 - smooth(0.5, 0.56, p));
    if (mig > 0) txt(ctx, '血管の外へ（遊走）', WX + 40, 160, { size: 30, a: mig, color: [190, 255, 240], glow: acc });
    var ml = win(p, 0.5, 0.58);
    if (ml > 0) { tagW(ctx, 'マクロファージ（大食細胞）', -320, 280, { size: 40, align: 'center', accent: acc, grow: ml, sub: '直径 10〜30 μm（組織により様々）', subSize: 22 }); }
    var fin = win(p, 0.9, 0.97);
    if (fin > 0) txt(ctx, '細菌以外に、寄生虫・細胞・異物も貪食', 300, 370, { size: 30, align: 'center', a: fin, color: [210, 255, 245], glow: acc });
    ctx.restore();
  }
  function W_() { return BS.world || null; }

  /* ================================================= 8. antigenPresentation */
  /**
   * antigenPresentation(ctx, {x, y, scale, p, t, alpha, panel, tLabel})   natural size 1560×880 (slide 21)
   * Macrophage digests a bacterium in its phagolysosome, carries the fragments (抗原＝異物のかけら) to the surface
   * on MHC molecules (主要組織適合抗原, cup-shaped), a T cell (T細胞受容体 TCR) docks on the MHC + antigen
   * (認識), and cytokines (IL-1, TNF-α) stream out as light particles. tLabel: label of the T cell
   * (default 'T細胞（ヘルパーT・CD4）'; MHC class II → CD4 helper T is textbook, the slide says only "T細胞").
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.20 macrophage + label マクロファージ
   *   0.18–0.38 bacterium digested inside the phagolysosome (分解)
   *   0.36–0.55 fragments travel to the membrane, MHC rises and holds them; tags MHC / 抗原; 抗原提示 title (0.5)
   *   0.52–0.70 T cell slides in, TCR docks on MHC + antigen → 認識 flash (≈0.68)
   *   0.68–0.90 cytokines IL-1 / TNF-α released (light particles + chips)
   *   0.90–1.00 caption (hold)
   */
  function antigenPresentation(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1560, PH = 880;
    var ca = begin(ctx, o, PW, PH, '抗原提示（マクロファージ → T細胞）', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var acc = ACC.monocyte, mx = -330, my = 0, MR = 270, i;
    var mA = smooth(0.07, 0.16, p);
    // cytokines (behind)
    var cyt = win(p, 0.68, 0.9);
    if (cyt > 0) {
      for (i = 0; i < 26; i++) {
        var Rc = rng(i * 11 + 2), ph = mod(t * (0.15 + Rc() * 0.1) + Rc(), 1), an = -1.2 + Rc() * 2.4, d = MR * (0.9 + ph * 1.5);
        var col = i % 2 ? [255, 200, 110] : [255, 120, 160];
        glow(ctx, mx + Math.cos(an) * d, my + Math.sin(an) * d * 0.9, 18, col, cyt * Math.sin(ph * Math.PI) * 0.9);
        ctx.beginPath(); ctx.arc(mx + Math.cos(an) * d, my + Math.sin(an) * d * 0.9, 4, 0, TAU); ctx.fillStyle = rgba(mixC(col, WHITE, 0.5), cyt * Math.sin(ph * Math.PI)); ctx.fill();
      }
    }
    var rad = macrophageCell(ctx, { x: mx, y: my, r: MR, t: t, seed: 2, alpha: mA, vacuoles: true });
    // phagolysosome with bacterium
    var px = mx - 40, py = my + 110, dig = win(p, 0.2, 0.38);
    if (mA > 0) {
      ctx.save(); ctx.globalAlpha *= mA;
      ctx.beginPath(); ctx.arc(px, py, 78, 0, TAU); ctx.fillStyle = 'rgba(255,214,236,0.95)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(150,80,170,0.9)'; ctx.stroke();
      glow(ctx, px, py, 90, [255, 140, 200], 0.35);
      ctx.save(); ctx.beginPath(); ctx.arc(px, py, 76, 0, TAU); ctx.clip();
      if (D.bacterium) D.bacterium(ctx, { x: px, y: py, size: 110, t: t, state: dig > 0 ? 'digested' : 'caught', p: dig * 0.85, flagella: 0.2, seed: 6, spread: 0.4 });
      ctx.restore(); ctx.restore();
    }
    // MHC molecules on the right membrane
    var MH = [-0.42, 0, 0.42], tips = [], frg = win(p, 0.38, 0.52), up = eout(win(p, 0.36, 0.46));
    var FC = [[120, 255, 140], [255, 220, 90], [140, 200, 255]];
    for (i = 0; i < MH.length; i++) {
      var a = MH[i], rr = rad(a), bx = mx + Math.cos(a) * rr, by = my + Math.sin(a) * rr, nx = Math.cos(a), ny = Math.sin(a), L = 64 * up;
      var tx = bx + nx * L, ty = by + ny * L; tips.push([tx, ty, a]);
      if (up > 0) {
        ctx.save(); ctx.lineCap = 'round';
        var px2 = -ny * 14, py2 = nx * 14;
        ctx.beginPath(); ctx.moveTo(bx + px2 - nx * 10, by + py2 - ny * 10); ctx.lineTo(tx + px2, ty + py2); ctx.moveTo(bx - px2 - nx * 10, by - py2 - ny * 10); ctx.lineTo(tx - px2, ty - py2);
        ctx.strokeStyle = 'rgba(10,20,30,0.9)'; ctx.lineWidth = 13; ctx.stroke(); ctx.strokeStyle = '#7ff0e0'; ctx.lineWidth = 7; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx + px2 * 1.6, ty + py2 * 1.6); ctx.quadraticCurveTo(tx - nx * 18, ty - ny * 18, tx - px2 * 1.6, ty - py2 * 1.6);
        ctx.strokeStyle = 'rgba(10,20,30,0.9)'; ctx.lineWidth = 12; ctx.stroke(); ctx.strokeStyle = '#b8fff4'; ctx.lineWidth = 6; ctx.stroke();
        ctx.restore();
      }
      // fragment: from phagolysosome to the groove
      if (frg > 0) {
        var fe = eio(win(frg, i * 0.15, i * 0.15 + 0.7)), fx = lerp(px + (i - 1) * 30, tx - nx * 8, fe), fy = lerp(py + (i - 1) * 20, ty - ny * 8, fe);
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(a + t * (1 - fe));
        ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(0, -12); ctx.lineTo(14, -4); ctx.lineTo(10, 9); ctx.lineTo(-10, 8); ctx.closePath();
        ctx.fillStyle = rgba(FC[i], 1); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(20,20,10,0.9)'; ctx.stroke(); ctx.restore();
        glow(ctx, fx, fy, 26, FC[i], 0.6 * fe);
      }
    }
    // T cell
    var te = eio(win(p, 0.52, 0.66)), tcx = lerp(700, tips[1][0] + 172, te), tcy = tips[1][1];
    if (te > 0) {
      ctx.save(); ctx.globalAlpha *= smooth(0, 0.2, te);
      cell(ctx, 'lymphocyte', tcx, tcy, 115, t, { seed: 2, glow: 0.6 });
      // TCRs on its left side
      [-0.5, 0, 0.5].forEach(function (da, k) {
        var ang = Math.PI + da, bx2 = tcx + Math.cos(ang) * 112, by2 = tcy + Math.sin(ang) * 112, nx2 = Math.cos(ang), ny2 = Math.sin(ang), qx = -ny2 * 7, qy = nx2 * 7;
        ctx.beginPath(); ctx.moveTo(bx2 + qx - nx2 * 12, by2 + qy - ny2 * 12); ctx.lineTo(bx2 + qx + nx2 * 50, by2 + qy + ny2 * 50); ctx.moveTo(bx2 - qx - nx2 * 12, by2 - qy - ny2 * 12); ctx.lineTo(bx2 - qx + nx2 * 50, by2 - qy + ny2 * 50);
        ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(10,10,30,0.9)'; ctx.lineWidth = 12; ctx.stroke(); ctx.strokeStyle = k === 1 ? '#ffe28a' : '#9fd0ff'; ctx.lineWidth = 6; ctx.stroke();
      });
      ctx.restore();
      var rec = bell(p, 0.66, 0.69, 0.74, 0.82);
      if (rec > 0) { sparkle(ctx, tips[1][0] + 8, tips[1][1], 46 * rec, [255, 240, 160], 1, t); glow(ctx, tips[1][0] + 10, tips[1][1], 90, [255, 230, 140], 0.6 * rec); }
      tagW(ctx, o.tLabel || 'T細胞（ヘルパーT・CD4）', tcx - 20, tcy - 190, { size: 32, align: 'center', accent: ACC.lymphocyte, grow: win(p, 0.58, 0.66) });
      tagW(ctx, 'T細胞受容体（TCR）', tcx + 30, tcy + 190, { size: 26, align: 'center', accent: [255, 226, 138], grow: win(p, 0.63, 0.7), tx: tcx - 140, ty: tcy + 4 });
      if (p > 0.67) txt(ctx, '認識！', tips[1][0] + 70, tips[1][1] - 100, { size: 34, a: win(p, 0.67, 0.72), color: [255, 240, 160], glow: [255, 200, 90], align: 'center' });
    }
    // labels
    tagW(ctx, 'マクロファージ', -700, -340, { size: 38, accent: acc, grow: win(p, 0.1, 0.18), tx: mx - 120, ty: my - 160, sub: '大食細胞', subSize: 22 });
    tagW(ctx, '分解', -700, 300, { size: 30, accent: [255, 160, 210], grow: win(p, 0.22, 0.3) * (1 - smooth(0.5, 0.56, p)), tx: px - 60, ty: py + 30 });
    tagW(ctx, '主要組織適合抗原（MHC）', -140, -330, { size: 28, accent: [127, 240, 224], grow: win(p, 0.44, 0.52), tx: tips[0][0], ty: tips[0][1] });
    tagW(ctx, '抗原（異物のかけら）', -140, 320, { size: 28, accent: FC[2], grow: win(p, 0.48, 0.55), tx: tips[2][0] - Math.cos(tips[2][2]) * 8, ty: tips[2][1] - Math.sin(tips[2][2]) * 8 });
    var ap = win(p, 0.5, 0.58);
    if (ap > 0) { ctx.save(); ctx.translate(430, -330); var s2 = eback(ap); ctx.scale(s2, s2); chipW(ctx, '抗原提示', 0, 0, { size: 44, accent: acc, fill: 'solid' }); ctx.restore(); }
    if (cyt > 0) {
      chipW(ctx, 'IL-1', 470, 110, { size: 28, accent: [255, 200, 110], alpha: win(p, 0.72, 0.78), fill: 'solid' });
      chipW(ctx, 'TNF-α', 600, 175, { size: 28, accent: [255, 120, 160], alpha: win(p, 0.75, 0.81), fill: 'solid' });
      txt(ctx, 'サイトカイン：免疫を助ける', 300, 260, { size: 28, align: 'center', a: win(p, 0.76, 0.84), color: [255, 230, 200], glow: [255, 160, 120] });
    }
    var fin = win(p, 0.9, 0.97);
    if (fin > 0) txt(ctx, '異物のかけらを MHC とともに表面に示し、T細胞に認識させる', 0, 380, { size: 28, align: 'center', a: fin, color: [210, 255, 245] });
    ctx.restore();
  }

  /* ===================================================== 9. lymphocyteCard */
  /** lymphocyte with surface markers: kind 'T' (TCR, membrane-spanning pairs) | 'B' (surface Ig, Y) ; m = marker grow 0..1 */
  function markedLympho(ctx, kind, x, y, r, t, a, m, seed) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalAlpha *= a;
    cell(ctx, 'lymphocyte', x, y, r, t, { seed: seed || 1, glow: 0.5 });
    if (m > 0) {
      var angs = [-2.6, -1.9, -1.2, -0.5, 0.2];
      angs.forEach(function (an, k) {
        var g = eout(win(m, k * 0.1, k * 0.1 + 0.5)); if (g <= 0) return;
        var bx = x + Math.cos(an) * r, by = y + Math.sin(an) * r, nx = Math.cos(an), ny = Math.sin(an);
        if (kind === 'T') {
          var qx = -ny * 6, qy = nx * 6, L = 44 * g;
          ctx.beginPath(); ctx.moveTo(bx + qx - nx * 16, by + qy - ny * 16); ctx.lineTo(bx + qx + nx * L, by + qy + ny * L); ctx.moveTo(bx - qx - nx * 16, by - qy - ny * 16); ctx.lineTo(bx - qx + nx * L, by - qy + ny * L);
          ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(10,10,30,0.9)'; ctx.lineWidth = 11; ctx.stroke(); ctx.strokeStyle = '#ffe28a'; ctx.lineWidth = 5.5; ctx.stroke();
        } else antibodyY(ctx, bx - nx * 4, by - ny * 4, an, 52 * g, { col: [120, 240, 200], glow: 0.3 });
      });
    }
    ctx.restore();
  }
  /**
   * lymphocyteCard(ctx, {x, y, scale, p, t, alpha, panel})   natural size 1640×900 (slides 22・23・24)
   * リンパ球: smallest WBC (「直径 8〜9 μm（最小の白血球）」 vs a dashed 好中球 約12 μm ghost), 「白血球の25〜30%」;
   * T and B look identical (「？」 → 「形では区別できない → 表面の目印で区別」), then their markers grow:
   * T細胞受容体（TCR・膜貫通） / 表面免疫グロブリン（付着）; bar 「末梢血リンパ球：T 60〜80% / B 20〜30%」;
   * NK細胞 (大型顆粒リンパ球 LGL, TでもBでもない); bottom row B細胞 → 形質細胞 → 抗体（IgM・IgG・IgA・IgE）.
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.20 lymphocyte + neutrophil ghost + size chip
   *   0.20–0.28 chip 白血球の25〜30%
   *   0.28–0.40 T & B appear identical with 「？」
   *   0.40–0.55 markers grow + labels; banner 「表面の目印で区別」
   *   0.55–0.66 T/B bar
   *   0.64–0.78 NK cell + label
   *   0.78–0.94 B → 形質細胞 → 抗体 row
   *   0.94–1.00 hold
   */
  function lymphocyteCard(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1640, PH = 900;
    var ca = begin(ctx, o, PW, PH, 'リンパ球（リン）', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var acc = ACC.lymphocyte, lx = -580, ly = -150, lr = 92;
    var a0 = smooth(0.07, 0.14, p);
    if (a0 > 0) {
      var gh = win(p, 0.1, 0.16);
      ctx.beginPath(); ctx.arc(lx, ly, lr * 12 / 8.5, 0, TAU); gline(ctx, ACC.neutrophil, 2, 0.8 * gh, [12, 9], -t * 15);
      txt(ctx, '好中球（約12 μm）', lx, ly - lr * 12 / 8.5 - 24, { size: 22, align: 'center', a: gh, color: [214, 190, 255] });
      cell(ctx, 'lymphocyte', lx, ly, lr * eback(a0), t, { seed: 1, glow: 0.7 });
      chipW(ctx, '直径 8〜9 μm（最小の白血球）', lx, 40, { size: 28, accent: acc, fill: 'solid', alpha: win(p, 0.13, 0.2) });
      chipW(ctx, '白血球の25〜30%', lx, 105, { size: 28, accent: acc, alpha: win(p, 0.2, 0.28) });
    }
    // T / B / NK
    var cxs = [-60, 290, 620], cy = -160, cr = 82;
    var tb = smooth(0.28, 0.34, p), mk = win(p, 0.4, 0.5), lab = win(p, 0.46, 0.55);
    markedLympho(ctx, 'T', cxs[0], cy, cr, t, tb, mk, 2);
    markedLympho(ctx, 'B', cxs[1], cy, cr, t, tb, mk, 2);
    var q = win(p, 0.3, 0.36) * (1 - smooth(0.42, 0.48, p));
    if (q > 0) { txt(ctx, '？', (cxs[0] + cxs[1]) / 2, cy, { size: 80, align: 'center', a: q, color: [255, 240, 160], glow: [255, 200, 90] }); txt(ctx, '見た目では同じ', (cxs[0] + cxs[1]) / 2, cy + 130, { size: 26, align: 'center', a: q, color: [255, 240, 200] }); }
    if (lab > 0) {
      chipW(ctx, 'T細胞', cxs[0], cy - 172, { size: 32, accent: [255, 226, 138], fill: 'solid', alpha: lab });
      chipW(ctx, 'B細胞', cxs[1], cy - 172, { size: 32, accent: [120, 240, 200], fill: 'solid', alpha: lab });
      txt(ctx, 'T細胞受容体（TCR）', cxs[0], cy + 122, { size: 24, align: 'center', a: lab, color: [255, 236, 170] });
      txt(ctx, '膜を貫通', cxs[0], cy + 156, { size: 20, align: 'center', a: lab, color: [220, 230, 240] });
      txt(ctx, '表面免疫グロブリン', cxs[1], cy + 122, { size: 24, align: 'center', a: lab, color: [170, 255, 225] });
      txt(ctx, '膜に付着', cxs[1], cy + 156, { size: 20, align: 'center', a: lab, color: [220, 230, 240] });
      chipW(ctx, '形では区別できない → 表面の目印で区別', 115, 40, { size: 26, accent: acc, alpha: win(p, 0.5, 0.56) });
    }
    // NK
    var nk = win(p, 0.64, 0.72);
    if (nk > 0) {
      lglCell(ctx, cxs[2], cy, cr * 1.12 * eback(nk), t, smooth(0, 0.3, nk), 3);
      chipW(ctx, 'NK細胞', cxs[2], cy - 172, { size: 32, accent: [255, 120, 160], fill: 'solid', alpha: win(p, 0.68, 0.74) });
      txt(ctx, '大型顆粒リンパ球（LGL）', cxs[2], cy + 122, { size: 24, align: 'center', a: win(p, 0.7, 0.76), color: [255, 190, 210] });
      txt(ctx, 'TでもBでもない', cxs[2], cy + 156, { size: 20, align: 'center', a: win(p, 0.72, 0.78), color: [220, 230, 240] });
    }
    // T/B bar
    var ba = win(p, 0.55, 0.62);
    if (ba > 0) {
      var X0 = -240, BW = 1010, by = 120, bh = 44;
      ctx.save(); ctx.globalAlpha *= ba;
      txt(ctx, '末梢血リンパ球のうちわけ', X0, by - 46, { size: 22, color: [210, 230, 245] });
      rrect(ctx, X0 - 5, by - bh / 2 - 5, BW + 10, bh + 10, 12); ctx.fillStyle = 'rgba(4,12,26,0.8)'; ctx.fill();
      var segs = [['T細胞 60〜80%', 0.7, [255, 226, 138]], ['B細胞 20〜30%', 0.25, [120, 240, 200]], ['', 0.05, [150, 150, 170]]], xx = X0;
      segs.forEach(function (s, k) {
        var w = BW * s[1] * eout(win(p, 0.56 + k * 0.03, 0.62 + k * 0.03));
        var g = ctx.createLinearGradient(0, by - bh / 2, 0, by + bh / 2); g.addColorStop(0, rgba(mixC(s[2], WHITE, 0.3), 1)); g.addColorStop(1, rgba(mixC(s[2], BLACK, 0.3), 1));
        ctx.fillStyle = g; ctx.fillRect(xx, by - bh / 2, w, bh); ctx.fillStyle = 'rgba(10,0,10,0.7)'; ctx.fillRect(xx + w - 1.5, by - bh / 2, 3, bh);
        if (s[0]) txt(ctx, s[0], xx + BW * s[1] / 2, by + 1, { size: 25, align: 'center', color: [20, 20, 30], outline: false, a: win(p, 0.6 + k * 0.03, 0.66 + k * 0.03) });
        xx += BW * s[1];
      });
      txt(ctx, '（残りは NK細胞など）', X0 + BW, by + 46, { size: 19, align: 'right', color: [200, 210, 225] });
      ctx.restore();
    }
    // bottom row: B → plasma cell → antibodies
    var br = win(p, 0.78, 0.84);
    if (br > 0) {
      var Y = 300;
      card(ctx, -790, Y - 80, 1580, 160, acc, br);
      ctx.save(); ctx.globalAlpha *= br;
      markedLympho(ctx, 'B', -620, Y, 48, t, 1, 1, 2);
      txt(ctx, 'B細胞', -560, Y + 50, { size: 22, color: [170, 255, 225] });
      arrow(ctx, -500, Y, -360, Y, win(p, 0.8, 0.85), acc, 4);
      plasmaCell(ctx, -270, Y, 52, t, smooth(0.82, 0.86, p));
      txt(ctx, '形質細胞', -270, Y + 62, { size: 22, align: 'center', a: win(p, 0.83, 0.87), color: [180, 200, 255] });
      arrow(ctx, -170, Y, -40, Y, win(p, 0.85, 0.89), acc, 4);
      txt(ctx, '抗体', 10, Y, { size: 30, a: win(p, 0.86, 0.9), color: [255, 236, 170] });
      ['IgM', 'IgG', 'IgA', 'IgE'].forEach(function (c, k) {
        var a2 = win(p, 0.87 + k * 0.02, 0.91 + k * 0.02), ix = 170 + k * 160;
        antibodyIcon(ctx, c, ix, Y - 12, 80, a2, t * 0.2);
        txt(ctx, c, ix, Y + 52, { size: 24, align: 'center', a: a2, color: mixC(IGCOL[c], WHITE, 0.4) });
      });
      txt(ctx, '（液性免疫）', 40, Y + 50, { size: 20, align: 'center', a: win(p, 0.9, 0.95), color: [200, 220, 240] });
      ctx.restore();
    }
    ctx.restore();
  }

  /* ============================================================ 10. tbChart */
  /**
   * tbChart(ctx, {x, y, scale, p, t, alpha, panel})   natural size 1640×900 (slides 17・23)
   * Row 1 (体液性免疫): CD4陽性ヘルパーT —(サイトカイン particles)→ B細胞 → 形質細胞 → 抗体 IgM・IgG・IgA・IgE
   *   (IgM pentamer, IgA dimer, IgG / IgE monomers).
   * Row 2 (細胞性免疫): CD8陽性キラーT → ウイルス感染細胞を破壊 (cell cracks into apoptotic fragments).
   * T/B cells carry chest-badge chips 「CD4」「CD8」「B」 like the mob design.
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.18 CD4 helper T node ; 0.18–0.30 cytokine stream → B ; 0.28–0.40 B cell (分化を助ける)
   *   0.40–0.52 B → 形質細胞 (morph) ; 0.52–0.66 antibodies released, class chips IgM・IgG・IgA・IgE
   *   0.66–0.76 CD8 killer T node ; 0.76–0.90 contacts the virus-infected cell → destroyed
   *   0.90–1.00 hold
   */
  function tbChart(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1640, PH = 900;
    var ca = begin(ctx, o, PW, PH, 'T細胞とB細胞のはたらき', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var Y1 = -120, Y2 = 245, X = [-610, -210, 160, 530], acc = ACC.lymphocyte;
    function badge(s, x, y, col, a) { chipW(ctx, s, x, y, { size: 24, accent: col, fill: 'solid', alpha: a }); }
    // row headers
    txt(ctx, '体液性免疫（抗体が主体）', -770, Y1 - 190, { size: 26, a: win(p, 0.07, 0.14), color: [170, 255, 225] });
    txt(ctx, '細胞性免疫（細胞が主体）', -770, Y2 - 150, { size: 26, a: win(p, 0.66, 0.72), color: [255, 200, 220] });
    var sep = win(p, 0.64, 0.7); if (sep > 0) { ctx.beginPath(); ctx.moveTo(-760, 62); ctx.lineTo(-760 + 1520 * sep, 62); gline(ctx, TEAL, 1.2, 0.4, [6, 8]); }
    // CD4
    var n1 = eback(win(p, 0.07, 0.14));
    if (n1 > 0) {
      cell(ctx, 'lymphocyte', X[0], Y1, 82 * n1, t, { seed: 4, glow: 0.6 });
      badge('CD4', X[0] + 52, Y1 - 62, [255, 226, 138], win(p, 0.1, 0.16));
      txt(ctx, 'CD4陽性 ヘルパーT細胞', X[0], Y1 + 112, { size: 26, align: 'center', a: win(p, 0.1, 0.18), color: [255, 236, 170] });
      txt(ctx, 'サイトカインを分泌', X[0], Y1 + 148, { size: 21, align: 'center', a: win(p, 0.16, 0.24), color: [230, 236, 245] });
    }
    // cytokines → B
    var cy = win(p, 0.18, 0.3);
    if (cy > 0) {
      arrow(ctx, X[0] + 100, Y1, X[1] - 100, Y1, eout(cy), [255, 200, 110], 3, { dash: [8, 8], dashOff: -t * 30 });
      for (var i = 0; i < 7; i++) { var ph = mod(t * 0.5 + i / 7, 1), cx = lerp(X[0] + 100, X[1] - 100, ph) * 1, cyy = Y1 + Math.sin(ph * 9 + i) * 16; glow(ctx, cx, cyy, 16, [255, 200, 110], 0.9 * cy * Math.sin(ph * Math.PI)); }
      txt(ctx, 'サイトカイン', (X[0] + X[1]) / 2, Y1 - 44, { size: 22, align: 'center', a: cy, color: [255, 220, 150] });
    }
    // B → plasma
    var nB = eback(win(p, 0.28, 0.35)), mo = eio(win(p, 0.4, 0.5));
    if (nB > 0) {
      markedLympho(ctx, 'B', X[1], Y1, 76 * nB, t, 1, 1, 2);
      badge('B', X[1] + 50, Y1 - 60, [120, 240, 200], win(p, 0.3, 0.36));
      txt(ctx, 'B細胞', X[1], Y1 + 112, { size: 26, align: 'center', a: win(p, 0.3, 0.38), color: [170, 255, 225] });
      txt(ctx, '分化を助けてもらう', X[1], Y1 + 148, { size: 21, align: 'center', a: win(p, 0.33, 0.4), color: [230, 236, 245] });
    }
    if (mo > 0) {
      arrow(ctx, X[1] + 100, Y1, X[2] - 100, Y1, mo, acc, 4);
      plasmaCell(ctx, X[2], Y1, 70, t, smooth(0, 0.6, mo));
      txt(ctx, '形質細胞', X[2], Y1 + 112, { size: 26, align: 'center', a: win(p, 0.44, 0.5), color: [180, 200, 255] });
      txt(ctx, '抗体をつくる', X[2], Y1 + 148, { size: 21, align: 'center', a: win(p, 0.46, 0.52), color: [230, 236, 245] });
    }
    // antibodies
    var ab = win(p, 0.52, 0.66);
    if (ab > 0) {
      arrow(ctx, X[2] + 100, Y1, X[3] - 100, Y1, eout(win(p, 0.52, 0.56)), acc, 4);
      for (i = 0; i < 6; i++) { var ph2 = mod(t * 0.3 + i / 6, 1); antibodyY(ctx, lerp(X[2] + 90, X[3] - 110, ph2), Y1 + Math.sin(i * 2 + t) * 30, t + i, 30, { col: IGCOL.IgG, a: ab * Math.sin(ph2 * Math.PI) * 0.8, glow: 0.2, light: false }); }
      var cls = ['IgM', 'IgG', 'IgA', 'IgE'];
      card(ctx, X[3] - 80, Y1 - 160, 330, 320, [255, 214, 110], smooth(0.54, 0.6, p));
      txt(ctx, '抗体', X[3] - 55, Y1 - 125, { size: 28, a: win(p, 0.55, 0.6), color: [255, 236, 170] });
      cls.forEach(function (c, k) {
        var a2 = win(p, 0.56 + k * 0.025, 0.6 + k * 0.025), ix = X[3] + (k % 2) * 160 + 5, iy = Y1 - 40 + Math.floor(k / 2) * 140;
        antibodyIcon(ctx, c, ix, iy, 92, a2, t * 0.15);
        chipW(ctx, c, ix, iy + 58, { size: 22, accent: IGCOL[c], alpha: a2 });
      });
    }
    // CD8 → infected cell
    var n8 = eback(win(p, 0.66, 0.72));
    var hit = eio(win(p, 0.76, 0.82)), kill = win(p, 0.8, 0.92);
    if (n8 > 0) {
      var kx = lerp(X[0], -280, hit);
      targetCell(ctx, -60, Y2, 95, t, smooth(0.66, 0.72, p), kill, 5);
      cell(ctx, 'lymphocyte', kx, Y2, 82 * n8, t, { seed: 5, glow: 0.6 });
      badge('CD8', kx + 52, Y2 - 62, [255, 140, 170], win(p, 0.68, 0.74));
      txt(ctx, 'CD8陽性 キラーT細胞', kx, Y2 + 112, { size: 26, align: 'center', a: win(p, 0.68, 0.76), color: [255, 190, 210] });
      txt(ctx, 'ウイルスに感染した細胞を破壊', kx, Y2 + 148, { size: 21, align: 'center', a: win(p, 0.72, 0.8), color: [230, 236, 245] });
      txt(ctx, 'ウイルス感染細胞', -60, Y2 - 130, { size: 22, align: 'center', a: win(p, 0.7, 0.76), color: [210, 240, 200] });
      if (hit > 0.95) sparkle(ctx, -170, Y2, 40 * bell(p, 0.81, 0.83, 0.86, 0.9), [255, 160, 180], 1, t);
      var dz = win(p, 0.84, 0.92);
      if (dz > 0) { ctx.save(); ctx.translate(250, Y2); var s3 = eback(dz); ctx.scale(s3, s3); chipW(ctx, '破壊！', 0, 0, { size: 38, accent: [255, 120, 160], fill: 'solid' }); ctx.restore(); arrow(ctx, 70, Y2, 160, Y2, dz, [255, 140, 170], 4); }
    }
    ctx.restore();
  }

  /* ============================================================ 11. nkAttack */
  /**
   * nkAttack(ctx, {x, y, scale, p, t, alpha, panel, adcc=false, steps=true})   natural size 1560×880 (slides 24・25)
   * NK細胞 (大型顆粒リンパ球 LGL: big azurophil granules) meets a 標的細胞 (virus-infected cell); granules polarise
   * to the contact, パーフォリン inserts into the target membrane forming ring-shaped trans-membrane channels
   * (zoom inset: membrane cross-section + top view of the ring), グランザイム passes through into the cell, and
   * the target undergoes アポトーシス (shrink, blebs, condensed → fragmented nucleus, apoptotic bodies).
   * Chips: 「TでもBでもない」「MHCの関与なしにキラー活性」. adcc:true adds the slide-25 bridge
   * (Fc受容体 on the NK cell holding IgG bound to the target).
   * p stages:
   *   0.00–0.07 panel on
   *   0.07–0.18 NK cell + target appear, labels
   *   0.18–0.30 NK approaches and contacts; chips (0.2–0.3)
   *   0.30–0.48 granules polarise; perforin crosses the cleft and forms pores (inset from 0.36)
   *   0.48–0.64 granzyme enters through the pores
   *   0.64–0.86 apoptosis: shrink, blebs, nucleus condenses/fragments
   *   0.86–1.00 apoptotic bodies + label アポトーシス (hold)
   */
  function nkAttack(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, PW = 1560, PH = 880;
    var ca = begin(ctx, o, PW, PH, 'NK細胞のこうげき', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    var nkR = 140, tR = 190, ty = -10, tx = 140, i;
    var app = smooth(0.07, 0.16, p), mv = eio(win(p, 0.18, 0.28));
    var nkx = lerp(-560, tx - tR - 40 - nkR, mv);
    var apo = win(p, 0.64, 1.0);
    var cleftX = tx - tR - 18;
    // target
    targetCell(ctx, tx, ty, tR, t, app, apo * 1.0, 7);
    // NK
    lglCell(ctx, nkx, ty, nkR, t, app, 3, smooth(0.3, 0.38, p));
    // adcc bridge
    if (o.adcc && mv > 0.9) {
      [-60, 60].forEach(function (dy) { receptor(ctx, 'fc', nkx + nkR * 0.97, ty + dy, 0, 26, 1, 0.5); antibodyY(ctx, cleftX + 18, ty + dy, Math.PI, 30, { col: IGCOL.IgG, light: false }); });
    }
    // perforin: rods cross the cleft and assemble pores on the target membrane
    var pf = win(p, 0.32, 0.46), PO = [-80, 0, 80];
    var poreA = smooth(0.4, 0.46, p) * (1 - smooth(0.7, 0.8, p));
    if (pf > 0 && apo < 0.3) {
      for (i = 0; i < 9; i++) {
        var k = PO[i % 3], e = eout(win(pf, (i / 9) * 0.5, (i / 9) * 0.5 + 0.5));
        var sx = nkx + nkR * 0.8, ex = tx - Math.sqrt(tR * tR - k * k) - 2, yy = ty + k + ((i / 3) | 0) * 8 - 8;
        ctx.save(); ctx.translate(lerp(sx, ex, e), lerp(ty + (i - 4) * 10, yy, e)); ctx.rotate(e * Math.PI / 2 + (1 - e) * t * 3);
        ctx.fillStyle = rgba([255, 230, 120], 1 - smooth(0.9, 1, e) * 0.6); ctx.fillRect(-11, -3, 22, 6); ctx.restore();
      }
    }
    if (poreA > 0) PO.forEach(function (k) { var px = tx - Math.sqrt(tR * tR - k * k) * 0.99, py = ty + k; ctx.beginPath(); ctx.ellipse(px, py, 8, 16, 0, 0, TAU); ctx.fillStyle = 'rgba(20,10,20,0.9)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = rgba([255, 230, 120], poreA); ctx.stroke(); glow(ctx, px, py, 26, [255, 230, 120], 0.6 * poreA); });
    // granzyme
    var gz = win(p, 0.48, 0.66);
    if (gz > 0 && apo < 0.4) {
      for (i = 0; i < 12; i++) {
        var kk = PO[i % 3], st = (i / 12) * 0.6, e2 = win(gz, st, st + 0.4); if (e2 <= 0) continue;
        var gx2 = e2 < 0.5 ? lerp(nkx + nkR * 0.7, (tx - Math.sqrt(tR * tR - kk * kk)), e2 * 2) : lerp((tx - Math.sqrt(tR * tR - kk * kk)), tx + 10 + (i % 4 - 1.5) * 30, (e2 - 0.5) * 2);
        var gy2 = e2 < 0.5 ? lerp(ty + (i % 5 - 2) * 25, ty + kk, e2 * 2) : lerp(ty + kk, ty + (i % 3 - 1) * 40, (e2 - 0.5) * 2);
        ctx.save(); ctx.translate(gx2, gy2); ctx.rotate(Math.PI / 4 + t); ctx.fillStyle = rgba([110, 255, 150], 1 - smooth(0.85, 1, e2)); ctx.fillRect(-6, -6, 12, 12); ctx.restore();
        glow(ctx, gx2, gy2, 16, [110, 255, 150], 0.6 * (1 - e2));
      }
    }
    // zoom inset: membrane + perforin pore
    var ins = win(p, 0.36, 0.44) * (1 - smooth(0.86, 0.92, p));
    if (ins > 0) {
      var IX = 540, IY = -210, IR = 150;
      ctx.beginPath(); ctx.moveTo(cleftX + 18, ty); ctx.lineTo(IX - IR * 0.95, IY + IR * 0.3); gline(ctx, TEAL, 1.2, 0.4 * ins, [5, 7]);
      ctx.save(); ctx.globalAlpha *= smooth(0, 0.5, ins);
      var r2 = IR * eback(ins);
      ctx.beginPath(); ctx.arc(IX, IY, r2, 0, TAU); ctx.fillStyle = 'rgba(16,26,40,0.95)'; ctx.fill();
      ctx.save(); ctx.clip();
      // bilayer (horizontal band) with a pore in the middle
      var by = IY + 10, gap = 34;
      for (var s = -1; s <= 1; s += 2) {
        for (var hx = IX - IR; hx < IX + IR; hx += 14) {
          if (Math.abs(hx - IX) < gap) continue;
          ctx.beginPath(); ctx.arc(hx, by + s * 26, 6, 0, TAU); ctx.fillStyle = '#9fd8c8'; ctx.fill();
          ctx.beginPath(); ctx.moveTo(hx - 2, by + s * 20); ctx.lineTo(hx - 2, by + s * 4); ctx.moveTo(hx + 2, by + s * 20); ctx.lineTo(hx + 2, by + s * 4); ctx.strokeStyle = '#6aa898'; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
      for (s = -1; s <= 1; s += 2) { ctx.fillStyle = '#ffe478'; ctx.fillRect(IX + s * gap - (s > 0 ? 0 : 12), by - 34, 12, 68); }
      txt(ctx, '外', IX - IR + 30, by - 70, { size: 20, color: [200, 220, 235] });
      txt(ctx, '細胞の中', IX - IR + 30, by + 70, { size: 20, color: [200, 220, 235] });
      // granzyme passing through
      var gp = mod(t * 0.6, 1) * win(p, 0.5, 0.56);
      if (gp > 0) { ctx.save(); ctx.translate(IX, lerp(by - 90, by + 90, gp)); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#6eff96'; ctx.fillRect(-8, -8, 16, 16); ctx.restore(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(IX, IY, r2, 0, TAU); gline(ctx, TEAL, 3, 0.95);
      // top view ring
      var RX = IX + 70, RY = IY + 98;
      ctx.save(); ctx.beginPath(); ctx.arc(IX, IY, r2 - 3, 0, TAU); ctx.clip();
      for (var j = 0; j < 12; j++) { var aa = (j / 12) * TAU; ctx.beginPath(); ctx.arc(RX + Math.cos(aa) * 20, RY + Math.sin(aa) * 20, 5.5, 0, TAU); ctx.fillStyle = '#ffe478'; ctx.fill(); }
      txt(ctx, '上から見ると輪', RX - 40, RY + 2, { size: 17, align: 'right', color: [255, 236, 170] });
      ctx.restore();
      ctx.restore();
      txt(ctx, 'パーフォリン：膜に輪状の通り道', IX, IY + IR + 34, { size: 25, align: 'center', a: ins, color: [255, 236, 150], glow: [255, 200, 90] });
      txt(ctx, 'グランザイム：通り道から入る', IX, IY + IR + 72, { size: 25, align: 'center', a: win(p, 0.5, 0.58) * ins / Math.max(ins, 1e-3), color: [150, 255, 180], glow: [90, 220, 130] });
    }
    // labels
    tagW(ctx, 'NK細胞', -700, -330, { size: 40, accent: [255, 120, 160], grow: win(p, 0.09, 0.16), tx: nkx - nkR * 0.4, ty: ty - nkR * 0.6, sub: '大型顆粒リンパ球（LGL）', subSize: 22 });
    tagW(ctx, '標的細胞', 150, -330, { size: 32, accent: [170, 255, 140], grow: win(p, 0.12, 0.18) * (1 - smooth(0.36, 0.4, p)), align: 'center', sub: '（様子のおかしい細胞：ウイルス感染細胞など）', subSize: 20 });
    var c1 = win(p, 0.2, 0.26), c2 = win(p, 0.24, 0.3);
    if (c1 > 0) chipW(ctx, 'TでもBでもない', -560, 230, { size: 26, accent: [255, 120, 160], alpha: c1 });
    if (c2 > 0) chipW(ctx, 'MHCの関与なしにキラー活性', -560, 290, { size: 26, accent: [255, 120, 160], alpha: c2, fill: 'solid' });
    if (o.adcc && mv > 0.9) txt(ctx, 'Fc受容体＋IgG（抗体依存性）', cleftX - 20, ty + 140, { size: 20, align: 'center', color: [140, 200, 255] });
    var al = win(p, 0.84, 0.92);
    if (al > 0) { ctx.save(); ctx.translate(tx, ty + tR + 40); var s4 = eback(al); ctx.scale(s4, s4); chipW(ctx, 'アポトーシス', 0, 0, { size: 38, accent: [170, 255, 140], fill: 'solid' }); ctx.restore(); }
    if (o.steps !== false && D.wbcStepper) {
      var act = p < 0.3 ? 0 : p < 0.48 ? 1 : p < 0.64 ? 2 : 3;
      D.wbcStepper(ctx, ['接触', 'パーフォリン', 'グランザイム', 'アポトーシス'], 220, 380, act, { size: 24, accent: [255, 120, 160], alpha: smooth(0.1, 0.18, p) });
    }
    ctx.restore();
  }

  /* ======================================================= 12. bacteriaDivide */
  /**
   * bacteriaDivide(ctx, {x=960, y=540, scale=1, p, t, alpha, size=190, counter=true, seed=1})
   * In-story FX for #13 (細菌が分裂して増えていく): binary fission 1 → 2 → 4 → 8 with a septum glow at each
   * division, daughters drifting into a loose cluster, and a warning counter chip 「細菌 ×2 / ×4 / ×8」.
   * No panel (draw over the battlefield). x,y = cluster centre. Natural size ≈ 6·size × 2.6·size.
   * p stages: 0.10–0.30 first division ; 0.40–0.60 second ; 0.70–0.90 third ; counter pops at each end.
   */
  function bacteriaDivide(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 0 : o.p, 0, 1), t = o.t || 0, L = o.size || 190, sc = o.scale || 1, a = o.alpha == null ? 1 : o.alpha, seed = o.seed || 1;
    if (a <= 0.003 || !D.bacterium) return;
    ctx.save(); ctx.translate(o.x == null ? 960 : o.x, o.y == null ? 540 : o.y); ctx.scale(sc, sc); ctx.globalAlpha *= a;
    var R = rng(seed * 19 + 4), P3 = [], i;
    var gx = [-1.65, -0.55, 0.55, 1.65];
    for (i = 0; i < 8; i++) P3.push([gx[i >> 1] * L * 1.15 + (i % 2 ? L * 0.35 : -L * 0.35) * 0 + (R() - 0.5) * L * 0.25, (i % 2 ? 0.62 : -0.62) * L + (R() - 0.5) * L * 0.2]);
    // reorder so siblings are (2k, 2k+1) at the same column → split axis vertical-ish; we split along x then drift
    var P2 = [], P1 = [], k;
    for (k = 0; k < 4; k++) P2.push([(P3[2 * k][0] + P3[2 * k + 1][0]) / 2, (P3[2 * k][1] + P3[2 * k + 1][1]) / 2]);
    for (k = 0; k < 2; k++) P1.push([(P2[2 * k][0] + P2[2 * k + 1][0]) / 2, (P2[2 * k][1] + P2[2 * k + 1][1]) / 2]);
    var P0 = [(P1[0][0] + P1[1][0]) / 2, (P1[0][1] + P1[1][1]) / 2];
    var levels = [[P0], P1, P2, P3], wins = [[0.1, 0.3], [0.4, 0.6], [0.7, 0.9]];
    var g = p < 0.1 ? 0 : p < 0.4 ? 1 : p < 0.7 ? 2 : 3;
    var gen = g, sp = gen > 0 ? win(p, wins[gen - 1][0], wins[gen - 1][1]) : 0;
    var parents = levels[Math.max(0, gen - 1)], kids = levels[gen];
    for (i = 0; i < kids.length; i++) {
      var par = gen > 0 ? parents[i >> 1] : kids[i], side = gen > 0 ? (i % 2 ? 1 : -1) : 0;
      var split = smooth(0, 0.45, sp), drift = eio(win(sp, 0.35, 1));
      var sx = par[0] + side * L * 0.5 * split, sy = par[1];
      var X = lerp(sx, kids[i][0], drift), Y = lerp(sy, kids[i][1], drift);
      var len = gen > 0 ? L * lerp(0.62, 1, smooth(0.3, 1, sp)) : L;
      if (gen > 0 && sp < 0.35) { // still one elongated cell pinching
        if (side > 0) continue;
        var pinch = win(sp, 0, 0.35);
        D.bacterium(ctx, { x: par[0], y: par[1], size: L * (1 + 0.5 * pinch), t: t + i, seed: seed + i, flagella: 0.5, flip: (i >> 1) % 2 === 1 });
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([255, 120, 90], 0.7 * pinch); ctx.fillRect(par[0] - 5, par[1] - L * 0.22, 10, L * 0.44); ctx.restore();
        glow(ctx, par[0], par[1], L * 0.4, [255, 110, 80], 0.6 * pinch);
        continue;
      }
      D.bacterium(ctx, { x: X, y: Y, size: len, t: t + i * 0.7, seed: seed + i, flagella: 0.5, flip: i % 2 === 1 });
    }
    if (o.counter !== false && g > 0) {
      var nums = [2, 4, 8], cp = win(p, wins[g - 1][1] - 0.05, wins[g - 1][1] + 0.03);
      if (cp > 0) { ctx.save(); ctx.translate(0, -L * 1.6); var s = eback(cp) * (1 + 0.04 * Math.sin(t * 8)); ctx.scale(s, s); chipW(ctx, '細菌 ×' + nums[g - 1], 0, 0, { size: 44, accent: [255, 80, 80], fill: 'solid' }); ctx.restore(); }
    }
    ctx.restore();
  }

  /* ================================================================ export */
  var SIZE_EP2 = {
    wbcClassify: [1560, 880], neutrophilDetail: [1560, 880], receptorsOpsonin: [1640, 900], phagolysosome: [1560, 880],
    eosinophilCard: [1560, 880], basophilHistamine: [1640, 900], macrophageCard: [1560, 880], antigenPresentation: [1560, 880],
    lymphocyteCard: [1640, 900], tbChart: [1640, 900], nkAttack: [1560, 880], bacteriaDivide: '≈6·size × 2.6·size (size default 190), no panel'
  };
  var api = {
    wbcClassify: wbcClassify, neutrophilDetail: neutrophilDetail, receptorsOpsonin: receptorsOpsonin, phagolysosome: phagolysosome,
    eosinophilCard: eosinophilCard, basophilHistamine: basophilHistamine, macrophageCard: macrophageCard, antigenPresentation: antigenPresentation,
    lymphocyteCard: lymphocyteCard, tbChart: tbChart, nkAttack: nkAttack, bacteriaDivide: bacteriaDivide,
    macrophageCell: macrophageCell, plasmaCell: plasmaCell, lglCell: lglCell, antibodyY: antibodyY, antibodyIcon: antibodyIcon,
    SIZE_EP2: SIZE_EP2,
    /** readyEP2(): loads fonts and warms caches (await before frame 1; also call readyWBC()). */
    readyEP2: function () {
      var ps = [];
      if (document.fonts && document.fonts.load) {
        ps.push(document.fonts.load('40px ZenKaku', '白血球好中球顆粒抗体受容体').catch(function () {}));
        ps.push(document.fonts.load('40px IPAGothic', 'μ₂⁻³α').catch(function () {}));
      }
      return Promise.all(ps).then(function () {
        plGeom(); macroGeom(1); macroGeom(2); macroGeom(4);
        if (D.wbcCell) { // pre-build the wbcCell sprites these diagrams use (first big sprite costs ~0.5 s otherwise)
          var c = mkCanvas(8, 8).getContext('2d');
          [['neutrophil', 3, 240], ['eosinophil', 2, 205], ['basophil', 2, 175], ['monocyte', 3, 115], ['lymphocyte', 1, 92], ['lymphocyte', 2, 115],
            ['lymphocyte', 4, 82], ['lymphocyte', 5, 82], ['neutrophil', 1, 62], ['eosinophil', 2, 67], ['basophil', 3, 61], ['lymphocyte', 4, 43], ['monocyte', 5, 81], ['lymphocyte', 2, 48]
          ].forEach(function (q) { D.wbcCell(c, { type: q[0], seed: q[1], r: q[2], x: 0, y: 0 }); });
        }
      });
    }
  };
  for (var key in api) D[key] = api[key];
  D.SIZE = D.SIZE || {};
  for (key in SIZE_EP2) D.SIZE[key] = SIZE_EP2[key];
})();
