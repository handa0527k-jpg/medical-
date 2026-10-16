/* BLOOD STORY ― 体内を駆ける細胞たち ―
 * diag_wbc.js : 白血球・貪食・血小板と凝固・体の全景 (Agent D2)
 *
 * Plain script (no ES module). Load AFTER world.js and characters.js.
 * Registers on window.BS.diag (merging with D1's diag_rbc.js, never overwriting it):
 *   bacterium, phagocytosis, engulfFX, wbcLineup, neutrophilCard, allyCards, woundAndClot, bodyPullback, victoryFX
 *   + helpers wbcCell, wbcCellAnchors, wbcBackdrop, wbcTag, wbcChip, readyWBC, SIZE_WBC (also merged into D.SIZE)
 *
 * Common opts: (ctx, {x, y, scale=1, p (0..1 progress), t (seconds, idle motion only), alpha=1, ...})
 *   The story is driven by p; t only adds wobble / shimmer / flow. Same opts => same picture (seeded randomness).
 *   Every function wraps itself in save()/restore().
 * Fonts: 'ZenKaku, IPAGothic, sans-serif'. ZenKaku lacks μ ₂ ⁻ ⁺ → those glyphs fall back to IPAGothic
 *   (both must be declared with @font-face; call BS.diag.readyWBC() or document.fonts.load before frame 1).
 * Medical content follows the lecture "血液" slides 13–29, 46–65 (percentages, sizes, steps of phagocytosis,
 * hemostasis). See each function's doc for its p stages.
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
  function easeOut(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function easeInOut(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeBack(x) { x = clamp(x, 0, 1); var c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
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
  function parseColor(c) {
    if (Array.isArray(c)) return c;
    if (typeof c !== 'string') return [255, 255, 255];
    if (c[0] === '#') {
      var hx = c.slice(1); if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
      var n = parseInt(hx, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var m = c.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [255, 255, 255];
  }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function Wd() { return BS.world || null; }
  function heartbeat(t, bpm) {
    var w = Wd(); if (w && w.heartbeat) return w.heartbeat(t, bpm);
    var T = 60 / (bpm || 72), q = mod(t, T) / T; return Math.exp(-q / 0.08);
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  var glowCache = {};
  function glowSprite(col) {
    var key = col.join(',');
    if (glowCache[key]) return glowCache[key];
    var c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.25, rgba(col, 0.55)); g.addColorStop(0.6, rgba(col, 0.12)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); glowCache[key] = c; return c;
  }
  function glowDot(ctx, x, y, r, col, a) {
    if (a <= 0.003 || r <= 0) return;
    var g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * clamp(a, 0, 1);
    ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = g0;
  }
  // 4-point star sparkle
  function sparkle(ctx, x, y, s, col, a, rot) {
    if (a <= 0.003 || s <= 0.2) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha *= clamp(a, 0, 1);
    glowDot(ctx, 0, 0, s * 1.6, col, 0.8);
    ctx.fillStyle = rgba(mixC(col, [255, 255, 255], 0.6), 1);
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var ang = (i / 8) * TAU, r = i % 2 === 0 ? s : s * 0.16;
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* ----------------------------------------------------------- text helpers */
  /**
   * wbcTag(ctx, text, x, y, {size=34, color='#fff', accent=[200,170,255], align='left', grow=1, alpha=1,
   *                          tx, ty (leader target), sub, subSize})
   * Glowing label; when tx/ty are given a leader line (dot at the target, elbow) draws first (grow 0..0.5),
   * then the text fades/slides in (grow 0.35..1).
   */
  function tag(ctx, text, x, y, o) {
    o = o || {};
    var g = o.grow == null ? 1 : clamp(o.grow, 0, 1);
    if (g <= 0.001) return;
    var size = o.size || 34, col = o.color || '#ffffff', acc = parseColor(o.accent || [200, 170, 255]), align = o.align || 'left';
    ctx.save();
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    if (o.tx != null) {
      var lg = smooth(0, 0.5, g);
      var ex = align === 'left' ? x - size * 0.3 : align === 'right' ? x + size * 0.3 : x, ey = y;
      if (align === 'center') ey = y + (o.ty < y ? -size * 0.75 : size * 0.75);
      var kx = align === 'left' ? ex - size * 1.1 : align === 'right' ? ex + size * 1.1 : ex, ky = ey;
      var pts = [[o.tx, o.ty], [kx, ky], [ex, ey]];
      var L1 = Math.hypot(kx - o.tx, ky - o.ty), L2 = Math.hypot(ex - kx, ey - ky), Lt = (L1 + L2) * lg;
      ctx.beginPath(); ctx.moveTo(o.tx, o.ty);
      if (Lt <= L1) { var f = L1 > 0 ? Lt / L1 : 1; ctx.lineTo(lerp(o.tx, kx, f), lerp(o.ty, ky, f)); }
      else { ctx.lineTo(kx, ky); var f2 = L2 > 0 ? (Lt - L1) / L2 : 1; ctx.lineTo(lerp(kx, ex, f2), lerp(ky, ey, f2)); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(10,0,10,0.6)'; ctx.lineWidth = 6; ctx.stroke();
      ctx.strokeStyle = rgba(mixC(acc, [255, 255, 255], 0.35), 0.95); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(o.tx, o.ty, 6.5, 0, TAU); ctx.fillStyle = 'rgba(10,0,10,0.6)'; ctx.fill();
      ctx.beginPath(); ctx.arc(o.tx, o.ty, 4.5, 0, TAU); ctx.fillStyle = rgba(mixC(acc, [255, 255, 255], 0.5), 1); ctx.fill();
      ctx.beginPath(); ctx.arc(o.tx, o.ty, 11 + 3 * Math.sin(g * 9), 0, TAU); ctx.strokeStyle = rgba(acc, 0.6 * lg); ctx.lineWidth = 2; ctx.stroke();
      pts = null;
    }
    var ta = smooth(0.35, 1, g);
    if (ta > 0.003) {
      ctx.globalAlpha *= ta;
      var dx = (1 - ta) * (align === 'right' ? 14 : -14);
      ctx.font = font(size); ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.2; ctx.strokeStyle = 'rgba(12,2,14,0.88)'; ctx.strokeText(text, x + dx, y);
      ctx.shadowColor = rgba(acc, 0.9); ctx.shadowBlur = size * 0.45; ctx.fillStyle = col; ctx.fillText(text, x + dx, y);
      ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      if (o.sub) {
        var ss = o.subSize || size * 0.6;
        ctx.font = font(ss); ctx.lineWidth = ss * 0.22; ctx.strokeText(o.sub, x + dx, y + size * 0.62 + ss * 0.55);
        ctx.fillStyle = rgba(mixC(acc, [255, 255, 255], 0.55), 1); ctx.fillText(o.sub, x + dx, y + size * 0.62 + ss * 0.55);
      }
    }
    ctx.restore();
  }
  /** wbcChip(ctx, text, x, y, {size=30, accent, alpha=1, align='center', fill}) rounded glowing pill. Returns width. */
  function chip(ctx, text, x, y, o) {
    o = o || {};
    var size = o.size || 30, acc = parseColor(o.accent || [200, 170, 255]), a = o.alpha == null ? 1 : o.alpha;
    ctx.save(); ctx.font = font(size);
    var tw = ctx.measureText(text).width, w = tw + size * 1.2, h = size * 1.55;
    var x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    if (a > 0.003) {
      ctx.globalAlpha *= a;
      roundRect(ctx, x0, y - h / 2, w, h, h / 2);
      var g = ctx.createLinearGradient(x0, y - h / 2, x0, y + h / 2);
      if (o.fill === 'solid') { g.addColorStop(0, rgba(mixC(acc, [255, 255, 255], 0.25), 0.95)); g.addColorStop(1, rgba(mixC(acc, [0, 0, 0], 0.3), 0.95)); }
      else { g.addColorStop(0, 'rgba(30,12,36,0.82)'); g.addColorStop(1, 'rgba(14,4,18,0.88)'); }
      ctx.fillStyle = g; ctx.fill();
      ctx.shadowColor = rgba(acc, 0.9); ctx.shadowBlur = size * 0.5;
      ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(mixC(acc, [255, 255, 255], 0.3), 0.95); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = o.fill === 'solid' ? '#ffffff' : rgba(mixC(acc, [255, 255, 255], 0.7), 1);
      if (o.fill === 'solid') { ctx.lineWidth = size * 0.14; ctx.strokeStyle = 'rgba(20,0,20,0.5)'; ctx.lineJoin = 'round'; ctx.strokeText(text, x0 + w / 2, y + size * 0.04); }
      ctx.fillText(text, x0 + w / 2, y + size * 0.04);
    }
    ctx.restore();
    return w;
  }
  /** stepper: row of step chips joined by arrows; active = float step index (current step highlighted). */
  function stepper(ctx, steps, cx, cy, active, o) {
    o = o || {};
    var size = o.size || 26, acc = parseColor(o.accent || [200, 170, 255]), gap = size * 1.5;
    ctx.save(); ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.font = font(size);
    var ws = steps.map(function (s) { return ctx.measureText(s).width + size * 1.2; });
    var total = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (steps.length - 1);
    var x = cx - total / 2;
    for (var i = 0; i < steps.length; i++) {
      var st = i < Math.floor(active) ? 'done' : i === Math.floor(active) ? 'now' : 'next';
      var c = st === 'now' ? acc : st === 'done' ? mixC(acc, [120, 110, 140], 0.5) : [110, 100, 130];
      chip(ctx, (i + 1) + '. ' + steps[i], x + ws[i] / 2 + size * 0.3, cy, { size: size * (st === 'now' ? 1.0 : 0.9), accent: c, fill: st === 'now' ? 'solid' : null, alpha: st === 'next' ? 0.55 : 1 });
      x += ws[i];
      if (i < steps.length - 1) {
        ctx.fillStyle = rgba(c, st === 'next' ? 0.4 : 0.9);
        ctx.beginPath(); ctx.moveTo(x + gap * 0.42, cy - size * 0.3); ctx.lineTo(x + gap * 0.82, cy); ctx.lineTo(x + gap * 0.42, cy + size * 0.3); ctx.closePath(); ctx.fill();
        x += gap;
      }
    }
    ctx.restore();
  }

  /**
   * wbcBackdrop(ctx, {t, alpha=1, tint=[120,20,40], grid=true}) full-frame dark "hologram lab" backdrop in the
   * world.js palette (deep wine + faint grid + drifting plasma particles + vignette).
   */
  function wbcBackdrop(ctx, o) {
    o = o || {};
    var W = ctx.canvas.width, H = ctx.canvas.height, t = o.t || 0, tint = parseColor(o.tint || [120, 20, 40]);
    ctx.save(); ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    var g = ctx.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.5, W * 0.62);
    g.addColorStop(0, rgba(mixC(tint, [255, 255, 255], 0.06), 1)); g.addColorStop(0.55, rgba(mixC(tint, [0, 0, 0], 0.55), 1)); g.addColorStop(1, rgba(mixC(tint, [0, 0, 0], 0.85), 1));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (o.grid !== false) {
      ctx.strokeStyle = 'rgba(255,170,200,0.05)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (var gx = mod(-t * 6, 80); gx < W; gx += 80) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      for (var gy = 0; gy < H; gy += 80) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
      ctx.stroke();
    }
    var w = Wd();
    if (w) { w.drawParticles(ctx, { t: t, seed: 21, count: 60, size: 2.6, alpha: 0.35, vx: -16, vy: -6 }); w.drawVignette(ctx, { strength: 0.65 }); }
    ctx.restore();
  }

  /* ======================================================== WBC SCHEMATICS */
  /* Stylized Giemsa colours. accent = UI colour used for glow / bars / labels. */
  var CELL = {
    neutrophil: { cyto: [250, 228, 236], edge: [222, 178, 210], nuc: [96, 46, 146], nucHi: [150, 98, 200], gran: [206, 140, 192], azu: [132, 34, 112], accent: [214, 180, 255], name: '好中球', en: 'Neutrophil', rel: 1.0 },
    eosinophil: { cyto: [252, 232, 220], edge: [238, 176, 156], nuc: [92, 48, 148], nucHi: [148, 98, 200], gran: [242, 102, 56], accent: [255, 140, 112], name: '好酸球', en: 'Eosinophil', rel: 1.05 },
    basophil: { cyto: [236, 218, 244], edge: [186, 156, 214], nuc: [134, 96, 176], nucHi: [176, 146, 214], gran: [56, 16, 96], accent: [168, 110, 245], name: '好塩基球', en: 'Basophil', rel: 0.92 },
    lymphocyte: { cyto: [156, 202, 250], edge: [92, 150, 230], nuc: [62, 34, 130], nucHi: [118, 88, 190], accent: [110, 196, 255], name: 'リンパ球', en: 'Lymphocyte', rel: 0.68 },
    monocyte: { cyto: [208, 212, 236], edge: [150, 162, 212], nuc: [118, 80, 172], nucHi: [172, 142, 216], gran: [178, 128, 196], accent: [80, 214, 210], name: '単球', en: 'Monocyte', rel: 1.3 }
  };
  var TYPES = ['neutrophil', 'eosinophil', 'basophil', 'lymphocyte', 'monocyte'];

  function inLobes(lobes, x, y, k) {
    for (var i = 0; i < lobes.length; i++) {
      var L = lobes[i], c = Math.cos(-L.rot), s = Math.sin(-L.rot), dx = x - L.x, dy = y - L.y;
      var u = (dx * c - dy * s) / (L.rx * k), v = (dx * s + dy * c) / (L.ry * k);
      if (u * u + v * v < 1) return true;
    }
    return false;
  }
  function scatter(R, n, rmax, minD, reject, tries) {
    var pts = [], tr = 0;
    while (pts.length < n && tr < (tries || n * 60)) {
      tr++;
      var a = R() * TAU, r = Math.sqrt(R()) * rmax, x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (reject && reject(x, y)) continue;
      var ok = true;
      if (minD) for (var j = 0; j < pts.length; j++) { var dx = pts[j][0] - x, dy = pts[j][1] - y; if (dx * dx + dy * dy < minD * minD) { ok = false; break; } }
      if (ok) pts.push([x, y, R()]);
    }
    return pts;
  }
  /* normalized (unit radius) geometry of each cell type; cached per type+seed */
  var geomCache = {};
  function cellGeom(type, seed) {
    var key = type + '|' + seed;
    if (geomCache[key]) return geomCache[key];
    var R = rng(seed * 131 + type.length * 977), G = { type: type, outline: [], lobes: [], strands: [], gran: [], azu: [], vac: [], dust: [] };
    for (var i = 0; i < 48; i++) G.outline.push(0);
    var ph = [R() * TAU, R() * TAU, R() * TAU];
    for (i = 0; i < 48; i++) { var a = (i / 48) * TAU; G.outline[i] = 1 + 0.018 * Math.sin(a * 3 + ph[0]) + 0.012 * Math.sin(a * 5 + ph[1]) + 0.008 * Math.sin(a * 7 + ph[2]); }
    if (type === 'neutrophil') {
      var n = seed % 3 === 2 ? 3 : 4, a0 = (n === 3 ? 2.1 : 1.65) + R() * 0.15;
      for (i = 0; i < n; i++) {
        var ang = a0 + i * 1.02 + (R() - 0.5) * 0.1, rr = 0.42 + (R() - 0.5) * 0.04;
        G.lobes.push({ x: 0.04 + Math.cos(ang) * rr, y: 0.03 + Math.sin(ang) * rr, rx: 0.155 + R() * 0.02, ry: 0.12 + R() * 0.015, rot: ang + Math.PI / 2 + (R() - 0.5) * 0.4 });
        if (i) G.strands.push([i - 1, i]);
      }
      G.gran = scatter(R, 300, 0.9, 0.035, function (x, y) { return inLobes(G.lobes, x, y, 1.08); });
      G.azu = scatter(R, 30, 0.86, 0.09, function (x, y) { return inLobes(G.lobes, x, y, 1.2); });
    } else if (type === 'eosinophil') {
      G.lobes.push({ x: -0.28, y: -0.1, rx: 0.25, ry: 0.21, rot: 0.3 }, { x: 0.27, y: -0.06, rx: 0.23, ry: 0.2, rot: -0.35 });
      G.strands.push([0, 1]);
      G.gran = scatter(R, 140, 0.86, 0.105, function (x, y) { return inLobes(G.lobes, x, y, 0.75); });
    } else if (type === 'basophil') {
      G.lobes.push({ x: -0.16, y: -0.06, rx: 0.3, ry: 0.23, rot: 0.5 }, { x: 0.22, y: 0.14, rx: 0.24, ry: 0.19, rot: -0.2 });
      G.strands.push([0, 1]);
      G.gran = scatter(R, 70, 0.86, 0.1, null);
    } else if (type === 'lymphocyte') {
      G.round = { x: 0.06, y: 0.03, r: 0.8 };
      G.clumps = scatter(R, 26, 0.66, 0.09, null);
    } else if (type === 'monocyte') {
      G.kidney = { x: -0.05, y: 0.06, rx: 0.56, ry: 0.42, notch: -0.9, rot: -0.15 };
      G.dust = scatter(R, 110, 0.9, 0.04, null);
      G.vac = scatter(R, 7, 0.82, 0.18, function (x, y) { var k = G.kidney, dx = (x - k.x) / k.rx, dy = (y - k.y) / k.ry; return dx * dx + dy * dy < 1.15; });
    }
    geomCache[key] = G; return G;
  }
  function kidneyPath(ctx, k, R) {
    ctx.beginPath();
    for (var i = 0; i <= 64; i++) {
      var a = (i / 64) * TAU, d = Math.atan2(Math.sin(a - k.notch), Math.cos(a - k.notch));
      var m = 1 - 0.42 * Math.exp(-(d * d) / 0.18);
      var px = Math.cos(a) * k.rx * m, py = Math.sin(a) * k.ry * m;
      var c = Math.cos(k.rot), s = Math.sin(k.rot);
      var X = (k.x + px * c - py * s) * R, Y = (k.y + px * s + py * c) * R;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath();
  }
  function lobesPath(ctx, G, R, grow) {
    ctx.beginPath();
    for (var i = 0; i < G.lobes.length; i++) {
      var L = G.lobes[i];
      ctx.moveTo(L.x * R + Math.cos(L.rot) * (L.rx * R + grow), L.y * R + Math.sin(L.rot) * (L.rx * R + grow));
      ctx.ellipse(L.x * R, L.y * R, L.rx * R + grow, L.ry * R + grow, L.rot, 0, TAU);
    }
  }
  /* render the full cell (membrane, nucleus, granules) centred at 0,0 with radius R px */
  function renderCell(ctx, type, G, R, chromaSeed) {
    var C = CELL[type], i, Rr = rng(chromaSeed || 7);
    // membrane
    ctx.beginPath();
    for (i = 0; i <= 48; i++) { var a = (i / 48) * TAU, rr = G.outline[i % 48] * R; if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath();
    var cg = ctx.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.1, 0, 0, R * 1.02);
    cg.addColorStop(0, rgba(mixC(C.cyto, [255, 255, 255], 0.35), 1)); cg.addColorStop(0.7, rgba(C.cyto, 1)); cg.addColorStop(1, rgba(C.edge, 1));
    ctx.fillStyle = cg; ctx.fill();
    ctx.lineWidth = Math.max(1.5, R * 0.025); ctx.strokeStyle = rgba(mixC(C.edge, [40, 10, 60], 0.35), 1); ctx.stroke();
    // monocyte vacuoles + dust under nucleus
    if (type === 'monocyte') {
      for (i = 0; i < G.vac.length; i++) {
        var v = G.vac[i], vr = R * (0.04 + v[2] * 0.035);
        ctx.beginPath(); ctx.arc(v[0] * R, v[1] * R, vr, 0, TAU); ctx.fillStyle = 'rgba(250,250,255,0.75)'; ctx.fill();
        ctx.lineWidth = Math.max(1, R * 0.008); ctx.strokeStyle = rgba(C.edge, 0.9); ctx.stroke();
      }
      ctx.beginPath();
      for (i = 0; i < G.dust.length; i++) { var d = G.dust[i]; ctx.moveTo(d[0] * R + 2, d[1] * R); ctx.arc(d[0] * R, d[1] * R, Math.max(0.8, R * 0.008), 0, TAU); }
      ctx.fillStyle = rgba(C.gran, 0.55); ctx.fill();
    }
    // nucleus
    var nucFill = function () {
      var ng = ctx.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.05, 0, 0, R * 0.9);
      ng.addColorStop(0, rgba(C.nucHi, 1)); ng.addColorStop(1, rgba(C.nuc, 1)); return ng;
    };
    var dark = mixC(C.nuc, [20, 0, 40], 0.5);
    if (G.lobes.length) {
      var sw = R * 0.05;
      // outline pass (grown), then fill pass
      for (var pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = pass ? rgba(C.nuc, 1) : rgba(dark, 1); ctx.lineCap = 'round';
        ctx.lineWidth = pass ? sw : sw + R * 0.022;
        for (i = 0; i < G.strands.length; i++) {
          var A = G.lobes[G.strands[i][0]], B = G.lobes[G.strands[i][1]];
          ctx.beginPath(); ctx.moveTo(A.x * R, A.y * R); ctx.quadraticCurveTo((A.x + B.x) * 0.5 * R * 1.06, (A.y + B.y) * 0.5 * R * 1.06, B.x * R, B.y * R); ctx.stroke();
        }
        lobesPath(ctx, G, R, pass ? 0 : R * 0.011);
        ctx.fillStyle = pass ? nucFill() : rgba(dark, 1); ctx.fill();
      }
      ctx.save(); lobesPath(ctx, G, R, 0); ctx.clip();
      for (i = 0; i < 26; i++) {
        var L = G.lobes[i % G.lobes.length];
        ctx.beginPath(); ctx.ellipse((L.x + (Rr() - 0.5) * L.rx * 1.4) * R, (L.y + (Rr() - 0.5) * L.ry * 1.4) * R, R * (0.03 + Rr() * 0.04), R * (0.02 + Rr() * 0.03), Rr() * 3, 0, TAU);
        ctx.fillStyle = rgba(dark, 0.45); ctx.fill();
      }
      ctx.restore();
    } else if (G.round) {
      var Q = G.round;
      ctx.beginPath(); ctx.arc(Q.x * R, Q.y * R, Q.r * R + R * 0.012, 0, TAU); ctx.fillStyle = rgba(dark, 1); ctx.fill();
      ctx.beginPath(); ctx.arc(Q.x * R, Q.y * R, Q.r * R, 0, TAU); ctx.fillStyle = nucFill(); ctx.fill();
      ctx.save(); ctx.clip();
      for (i = 0; i < G.clumps.length; i++) { var c0 = G.clumps[i]; ctx.beginPath(); ctx.arc((Q.x + c0[0]) * R, (Q.y + c0[1]) * R, R * (0.05 + c0[2] * 0.06), 0, TAU); ctx.fillStyle = rgba(dark, 0.5); ctx.fill(); }
      ctx.restore();
    } else if (G.kidney) {
      ctx.save(); ctx.translate(0, 0);
      kidneyPath(ctx, G.kidney, R); ctx.lineWidth = R * 0.022; ctx.strokeStyle = rgba(dark, 1); ctx.stroke(); ctx.fillStyle = nucFill(); ctx.fill();
      ctx.clip();
      for (i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc((G.kidney.x + (Rr() - 0.5) * 1.1) * R, (G.kidney.y + (Rr() - 0.5) * 0.9) * R, R * (0.015 + Rr() * 0.025), 0, TAU); ctx.fillStyle = rgba(dark, 0.3); ctx.fill(); }
      ctx.restore();
    }
    // granules
    if (type === 'neutrophil') {
      ctx.beginPath();
      for (i = 0; i < G.gran.length; i++) { var q = G.gran[i], r1 = Math.max(0.9, R * (0.011 + q[2] * 0.006)); ctx.moveTo(q[0] * R + r1, q[1] * R); ctx.arc(q[0] * R, q[1] * R, r1, 0, TAU); }
      ctx.fillStyle = rgba(C.gran, 0.85); ctx.fill();
      ctx.beginPath();
      for (i = 0; i < G.azu.length; i++) { q = G.azu[i]; r1 = Math.max(1.3, R * (0.022 + q[2] * 0.008)); ctx.moveTo(q[0] * R + r1, q[1] * R); ctx.arc(q[0] * R, q[1] * R, r1, 0, TAU); }
      ctx.fillStyle = rgba(C.azu, 0.95); ctx.fill();
    } else if (type === 'eosinophil') {
      for (i = 0; i < G.gran.length; i++) {
        q = G.gran[i]; r1 = Math.max(1.5, R * (0.05 + q[2] * 0.014));
        var gg = ctx.createRadialGradient(q[0] * R - r1 * 0.35, q[1] * R - r1 * 0.35, r1 * 0.1, q[0] * R, q[1] * R, r1);
        gg.addColorStop(0, 'rgba(255,214,170,1)'); gg.addColorStop(0.5, rgba(C.gran, 1)); gg.addColorStop(1, rgba(mixC(C.gran, [120, 20, 10], 0.45), 1));
        ctx.beginPath(); ctx.arc(q[0] * R, q[1] * R, r1, 0, TAU); ctx.fillStyle = gg; ctx.fill();
      }
    } else if (type === 'basophil') {
      for (i = 0; i < G.gran.length; i++) {
        q = G.gran[i]; r1 = Math.max(1.5, R * (0.045 + q[2] * 0.035));
        ctx.beginPath();
        for (var k = 0; k <= 7; k++) { var aa = (k / 7) * TAU, rk = r1 * (0.8 + 0.3 * Math.sin(aa * 3 + q[2] * 9)); if (k === 0) ctx.moveTo(q[0] * R + Math.cos(aa) * rk, q[1] * R + Math.sin(aa) * rk); else ctx.lineTo(q[0] * R + Math.cos(aa) * rk, q[1] * R + Math.sin(aa) * rk); }
        ctx.closePath(); ctx.fillStyle = rgba(mixC(C.gran, [120, 60, 180], q[2] * 0.4), 0.95); ctx.fill();
      }
    }
    // gloss
    ctx.beginPath(); ctx.ellipse(-R * 0.42, -R * 0.5, R * 0.26, R * 0.11, -0.6, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
  }
  var spriteCache = {};
  function cellSprite(type, seed, r) {
    var B = r <= 70 ? 80 : r <= 150 ? 160 : 330, key = type + '|' + seed + '|' + B;
    if (spriteCache[key]) return spriteCache[key];
    var S = Math.ceil(B * 2.3), c = mkCanvas(S, S), x = c.getContext('2d');
    x.translate(S / 2, S / 2); renderCell(x, type, cellGeom(type, seed), B, seed * 3 + 1);
    spriteCache[key] = { c: c, B: B, S: S }; return spriteCache[key];
  }
  /**
   * wbcCell(ctx, {type, x, y, r=100, t, alpha=1, seed=1, sil=1, glow=0.5, rot=0})
   * Schematic white blood cell (stylized Giemsa colours). type ∈ neutrophil | eosinophil | basophil | lymphocyte |
   * monocyte. sil 0..1: 0 = glowing silhouette only → 1 = full colour. Sprites are cached (cheap: ~0.2 ms).
   */
  function wbcCell(ctx, o) {
    var type = CELL[o.type] ? o.type : 'neutrophil', C = CELL[type], r = o.r || 100, t = o.t || 0, seed = o.seed == null ? 1 : o.seed;
    var a = o.alpha == null ? 1 : o.alpha, sil = o.sil == null ? 1 : clamp(o.sil, 0, 1), gl = o.glow == null ? 0.5 : o.glow;
    if (a <= 0.003 || r < 1) return;
    var sp = cellSprite(type, seed, r), br = 1 + 0.012 * Math.sin(t * 1.7 + seed);
    ctx.save(); ctx.translate(o.x || 0, o.y || 0); ctx.rotate((o.rot || 0) + 0.02 * Math.sin(t * 0.6 + seed)); ctx.globalAlpha *= a;
    if (gl > 0) { ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, 0, 0, r * 1.9, C.accent, 0.35 * gl); ctx.globalCompositeOperation = 'source-over'; }
    if (sil > 0.003) {
      var k = (r / sp.B) * br, s = sp.S * k;
      ctx.globalAlpha *= sil; ctx.drawImage(sp.c, -s / 2, -s / 2, s, s); ctx.globalAlpha /= sil;
    }
    if (sil < 0.999) {
      ctx.beginPath(); ctx.arc(0, 0, r * br, 0, TAU);
      ctx.fillStyle = rgba(C.accent, 0.22 * (1 - sil)); ctx.fill();
      ctx.shadowColor = rgba(C.accent, 1); ctx.shadowBlur = r * 0.25;
      ctx.lineWidth = Math.max(2, r * 0.035); ctx.strokeStyle = rgba(mixC(C.accent, [255, 255, 255], 0.4), 1 - sil * 0.8); ctx.stroke();
    }
    ctx.restore();
  }
  /** wbcCellAnchors(type, seed) → normalized geometry ({lobes, gran, azu, ...}; multiply by r and add x,y). */
  function wbcCellAnchors(type, seed) { return cellGeom(CELL[type] ? type : 'neutrophil', seed == null ? 1 : seed); }

  /* ============================================================ BACTERIUM */
  /**
   * bacterium(ctx, {x, y, size=320, t, state='idle'|'caught'|'digested', p=0, seed=1, rim='#ff3a3a', alpha=1,
   *                 rot=0, flip=false, kind='rod'|'cocci', flagella=1, eyes=true, spread=1})
   * The invader in full view: an original rod bacterium (bacillus) with peritrichous flagella, pili, a
   * double cell-wall line, faint nucleoid, red rim light and the glowing yellow-green eyes of
   * world.drawPathogenSilhouette. size = body length (px); natural bbox ≈ 2.0·size × 1.1·size incl. flagella.
   *   idle      : slow wiggle, flagella beat (t)
   *   caught    : fast squirm / shake, eyes wide (t). p unused.
   *   digested  : p 0–0.25 desaturates, eyes close, glowing cracks; 0.25–0.75 breaks into 10 shards that drift
   *               (×spread), spin and shrink; 0.6–1 shards fade to debris specks. p=1 ≈ gone.
   * kind:'cocci' draws a grape-like cluster of cocci instead (same states).
   * Face points to +x (flip:true mirrors it to face −x).
   */
  function bacterium(ctx, o) {
    o = o || {};
    var x = o.x || 0, y = o.y || 0, L = o.size || 320, t = o.t || 0, st = o.state || 'idle', p = clamp(o.p == null ? 0 : o.p, 0, 1);
    var seed = o.seed == null ? 1 : o.seed, alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0.003) return;
    var rim = parseColor(o.rim || '#ff3a3a'), fl = o.flagella == null ? 1 : o.flagella, spread = o.spread == null ? 1 : o.spread;
    var caught = st === 'caught', dig = st === 'digested', pd = dig ? p : 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); if (o.flip) ctx.scale(-1, 1); ctx.globalAlpha *= alpha;
    if (o.kind === 'cocci') { drawCocci(ctx, L, t, caught, pd, seed, rim, fl, spread, o.eyes !== false); ctx.restore(); return; }
    var Wb = L * 0.4, hw0 = Wb / 2;
    var sq = caught ? 1 + 0.07 * Math.sin(t * 13) : 1 + 0.02 * Math.sin(t * 2.4 + seed);
    var A1 = caught ? L * 0.1 * Math.sin(t * 8.5) : L * 0.045 * Math.sin(t * 2.1 + seed);
    var A2 = caught ? L * 0.06 * Math.sin(t * 11 + 1) : L * 0.02 * Math.sin(t * 1.6 + seed * 2);
    if (dig) { var calm = 1 - smooth(0, 0.3, pd); A1 *= calm * (caught ? 1 : 1); A2 *= calm; }
    if (caught) ctx.translate(Math.sin(t * 41) * L * 0.012, Math.cos(t * 37) * L * 0.01);
    ctx.scale(sq, 1 / sq);
    function cy(s) { var u = s / L; return A1 * Math.cos(Math.PI * u) + A2 * Math.sin(TAU * u); }
    function norm(s) { var dy = cy(s + 0.5) - cy(s - 0.5), n = Math.hypot(1, dy); return [-dy / n, 1 / n]; }
    function halfW(s) { var e = L / 2 - hw0, as = Math.abs(s); return as <= e ? hw0 : hw0 * Math.sqrt(Math.max(0, 1 - Math.pow((as - e) / hw0, 2))); }
    function at(s, v) { var n = norm(s); return [s + n[0] * v * hw0, cy(s) + n[1] * v * hw0]; }
    var N = 30, top = [], bot = [];
    for (var i = 0; i <= N; i++) {
      var s = -L / 2 + L * (0.5 - 0.5 * Math.cos((Math.PI * i) / N)), n0 = norm(s), hw = halfW(s), c0 = cy(s);
      top.push([s - n0[0] * hw, c0 - n0[1] * hw]); bot.push([s + n0[0] * hw, c0 + n0[1] * hw]);
    }
    function bodyPath(c) {
      c.beginPath(); c.moveTo(top[0][0], top[0][1]);
      for (var k = 1; k <= N; k++) c.lineTo(top[k][0], top[k][1]);
      for (k = N; k >= 0; k--) c.lineTo(bot[k][0], bot[k][1]);
      c.closePath();
    }
    var R = rng(seed * 7919 + 13);
    var bodyC = mixC([46, 88, 60], [150, 128, 120], smooth(0, 0.3, pd)), edgeC = mixC([16, 34, 30], [90, 70, 70], smooth(0, 0.3, pd));
    var wallC = mixC([170, 230, 90], [230, 180, 150], smooth(0, 0.3, pd));
    var fA = (1 - smooth(0.1, 0.35, pd)) * fl;
    // aura
    var ag = ctx.createRadialGradient(0, 0, L * 0.1, 0, 0, L * 0.9);
    ag.addColorStop(0, 'rgba(10,0,8,' + (0.45 * (1 - pd)).toFixed(3) + ')'); ag.addColorStop(1, 'rgba(10,0,8,0)');
    ctx.fillStyle = ag; ctx.fillRect(-L, -L, L * 2, L * 2);
    // flagella (peritrichous, trailing towards −x)
    if (fA > 0.01) {
      ctx.lineCap = 'round';
      var bases = [[-0.5, 0, Math.PI], [-0.47, -0.6, Math.PI + 0.35], [-0.47, 0.6, Math.PI - 0.35], [-0.25, -1, Math.PI + 0.9], [-0.25, 1, Math.PI - 0.9], [0.02, -1, Math.PI + 1.25], [0.05, 1, Math.PI - 1.2]];
      for (i = 0; i < bases.length; i++) {
        var b = bases[i], sb = b[0] * L, bp = at(sb, b[1] * (Math.abs(b[0]) > 0.45 ? 0.6 : 1)), Lf = L * (0.75 + 0.2 * ((i * 37) % 5) / 5) * fl;
        var spd = caught ? 16 : 6, amp = caught ? 0.5 : 0.3;
        ctx.beginPath(); ctx.moveTo(bp[0], bp[1]);
        var px = bp[0], py = bp[1];
        for (var k2 = 1; k2 <= 26; k2++) {
          var u = k2 / 26, ang = b[2] + Math.sin(u * 7.5 - t * spd + i * 1.3) * amp * Math.min(1, u * 2.5);
          px += Math.cos(ang) * (Lf / 26); py += Math.sin(ang) * (Lf / 26);
          ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(12,26,18,' + (0.95 * fA).toFixed(3) + ')'; ctx.lineWidth = L * 0.022; ctx.stroke();
        ctx.strokeStyle = rgba(wallC, 0.45 * fA); ctx.lineWidth = L * 0.007; ctx.stroke();
      }
    }
    // pili
    if (pd < 0.3) {
      ctx.beginPath();
      for (i = 0; i < 44; i++) {
        var side = i % 2 ? 1 : -1, ss = -L * 0.46 + (L * 0.92 * ((i * 0.618) % 1)), pv = at(ss, side * (halfW(ss) / hw0)), nn = norm(ss);
        var ln = L * (0.04 + 0.03 * ((i * 0.37) % 1)) * (1 + (caught ? 0.3 * Math.sin(t * 30 + i) : 0.1 * Math.sin(t * 3 + i)));
        ctx.moveTo(pv[0], pv[1]); ctx.lineTo(pv[0] + nn[0] * side * ln, pv[1] + nn[1] * side * ln);
      }
      ctx.strokeStyle = rgba(wallC, 0.55 * (1 - smooth(0, 0.3, pd))); ctx.lineWidth = Math.max(1, L * 0.006); ctx.stroke();
    }
    // body (intact, or as shards when digested)
    function paintBody() {
      var bg = ctx.createLinearGradient(0, -hw0 * 1.4, 0, hw0 * 1.4);
      bg.addColorStop(0, rgba(mixC(bodyC, [255, 255, 255], 0.12), 1)); bg.addColorStop(0.45, rgba(bodyC, 1)); bg.addColorStop(1, rgba(edgeC, 1));
      bodyPath(ctx); ctx.fillStyle = bg; ctx.fill();
      ctx.save(); bodyPath(ctx); ctx.clip();
      // mottling
      var Rm = rng(seed * 31 + 5);
      for (var m = 0; m < 9; m++) { ctx.beginPath(); ctx.ellipse((Rm() - 0.5) * L * 0.9, (Rm() - 0.5) * Wb * 0.8 + cy(0), L * (0.04 + Rm() * 0.05), Wb * (0.08 + Rm() * 0.1), Rm() * 3, 0, TAU); ctx.fillStyle = 'rgba(120,40,130,0.32)'; ctx.fill(); }
      // nucleoid squiggle + ribosomes
      ctx.beginPath();
      for (m = 0; m <= 40; m++) { var u2 = m / 40, sx = (u2 - 0.5) * L * 0.6; ctx.lineTo(sx + Math.sin(u2 * 31) * L * 0.03, cy(sx) + Math.sin(u2 * 17 + 1) * Wb * 0.18); }
      ctx.strokeStyle = 'rgba(170,240,140,0.22)'; ctx.lineWidth = L * 0.01; ctx.stroke();
      ctx.beginPath();
      for (m = 0; m < 36; m++) { var rx = (Rm() - 0.5) * L * 0.85, ry = (Rm() - 0.5) * Wb * 0.7 + cy(rx); ctx.moveTo(rx + 2, ry); ctx.arc(rx, ry, Math.max(0.8, L * 0.006), 0, TAU); }
      ctx.fillStyle = 'rgba(200,255,170,0.22)'; ctx.fill();
      // rim light (top-left, red) like the silhouette
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(-L * 0.02, -Wb * 0.08); bodyPath(ctx); ctx.translate(L * 0.02, Wb * 0.08);
      ctx.lineWidth = Wb * 0.16; ctx.strokeStyle = rgba(rim, 0.22); ctx.stroke();
      ctx.restore();
      bodyPath(ctx); ctx.lineWidth = Math.max(1.5, L * 0.014); ctx.strokeStyle = rgba(edgeC, 1); ctx.stroke();
      ctx.save(); ctx.scale(0.94, 0.86); bodyPath(ctx); ctx.restore();
      ctx.lineWidth = Math.max(1, L * 0.006); ctx.strokeStyle = rgba(wallC, 0.55); ctx.stroke();
    }
    if (!dig) paintBody();
    else {
      var Rf = rng(seed * 97 + 3), cols = 5, rows = 2, gs = [], bs = [];
      for (i = 0; i <= cols; i++) gs.push(-L * 0.55 + (L * 1.1 * i) / cols + (i > 0 && i < cols ? (Rf() - 0.5) * L * 0.08 : 0));
      for (i = 0; i <= cols; i++) bs.push((Rf() - 0.5) * 0.5);
      var br = smooth(0.25, 0.85, pd), fade = 1 - smooth(0.6, 1, pd);
      for (var ci = 0; ci < cols; ci++) for (var rI = 0; rI < rows; rI++) {
        var s0 = gs[ci], s1 = gs[ci + 1], v0 = rI ? lerp(bs[ci], bs[ci + 1], 0) : -1.6, v1 = rI ? 1.6 : bs[ci];
        var poly = [at(s0, rI ? bs[ci] : -1.6), at((s0 + s1) / 2, rI ? (bs[ci] + bs[ci + 1]) / 2 + 0.12 : -1.6), at(s1, rI ? bs[ci + 1] : -1.6), at(s1, rI ? 1.6 : bs[ci + 1]), at((s0 + s1) / 2, rI ? 1.6 : (bs[ci] + bs[ci + 1]) / 2 + 0.12), at(s0, rI ? 1.6 : bs[ci])];
        var cx0 = (s0 + s1) / 2, cy0 = cy(cx0) + (rI ? 0.5 : -0.5) * hw0, dl = Math.hypot(cx0, cy0) || 1;
        var dirx = cx0 / dl + (Rf() - 0.5) * 0.6, diry = cy0 / dl + (Rf() - 0.5) * 0.6, spin = (Rf() - 0.5) * 2.4;
        var off = br * L * 0.45 * spread, scl = 1 - 0.55 * br;
        ctx.save(); ctx.globalAlpha *= fade;
        ctx.translate(cx0 + dirx * off, cy0 + diry * off); ctx.rotate(spin * br); ctx.scale(scl, scl); ctx.translate(-cx0, -cy0);
        ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (var q = 1; q < poly.length; q++) ctx.lineTo(poly[q][0], poly[q][1]); ctx.closePath();
        ctx.save(); ctx.clip(); paintBody(); ctx.restore();
        var crack = bell(pd, 0.05, 0.22, 0.45, 0.8);
        if (crack > 0.01) {
          ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (q = 1; q < poly.length; q++) ctx.lineTo(poly[q][0], poly[q][1]); ctx.closePath();
          ctx.save(); bodyPath(ctx); ctx.clip();
          ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (q = 1; q < poly.length; q++) ctx.lineTo(poly[q][0], poly[q][1]); ctx.closePath();
          ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,170,90,' + (0.9 * crack).toFixed(3) + ')'; ctx.lineWidth = L * 0.012; ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      // debris specks
      var deb = bell(pd, 0.35, 0.55, 0.85, 1);
      if (deb > 0.01) {
        for (i = 0; i < 26; i++) {
          var Rd = rng(seed * 13 + i * 7), a = Rd() * TAU, d = (0.2 + Rd() * 0.6) * L * spread * smooth(0.3, 1, pd);
          ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.6, L * (0.008 + Rd() * 0.012), 0, TAU);
          ctx.fillStyle = 'rgba(200,160,140,' + (0.7 * deb).toFixed(3) + ')'; ctx.fill();
        }
      }
    }
    // face
    var eA = 1 - smooth(0, 0.22, pd);
    if (o.eyes !== false && eA > 0.01) drawEyes(ctx, [[0.18 * L, -0.12], [0.34 * L, -0.1], [0.06 * L, -0.02]], function (s, v) { return at(s, v); }, L * 0.042, t, caught, eA, pd);
    ctx.restore();
  }
  function drawEyes(ctx, list, mapFn, es0, t, caught, eA, pd) {
    var blink = (mod(t, 3.3) < 0.12 ? 0.15 : 1) * (1 - 0.8 * smooth(0, 0.2, pd));
    ctx.save(); ctx.globalAlpha *= eA;
    var sizes = [1, 0.85, 0.55];
    for (var i = 0; i < list.length; i++) {
      var pt = mapFn(list[i][0], list[i][1]), es = es0 * sizes[i];
      ctx.globalCompositeOperation = 'lighter';
      var eg = ctx.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], es * 4);
      eg.addColorStop(0, 'rgba(230,255,120,0.85)'); eg.addColorStop(0.3, 'rgba(180,255,60,0.32)'); eg.addColorStop(1, 'rgba(150,255,40,0)');
      ctx.fillStyle = eg; ctx.fillRect(pt[0] - es * 4, pt[1] - es * 4, es * 8, es * 8);
      ctx.globalCompositeOperation = 'source-over';
      var ry = caught ? es * 1.0 : es * 0.62;
      ctx.save();
      if (!caught) { // angry slant: clip away the part above a line sloping down toward the front (+x)
        ctx.beginPath(); ctx.moveTo(pt[0] - es * 2, pt[1] - es * 0.75); ctx.lineTo(pt[0] + es * 2, pt[1] + es * 0.05); ctx.lineTo(pt[0] + es * 2, pt[1] + es * 2); ctx.lineTo(pt[0] - es * 2, pt[1] + es * 2); ctx.closePath(); ctx.clip();
      }
      ctx.beginPath(); ctx.ellipse(pt[0], pt[1], es * (caught ? 1.05 : 1.45), Math.max(0.6, ry * blink), caught ? 0 : 0.12, 0, TAU);
      ctx.fillStyle = 'rgba(248,255,200,0.97)'; ctx.fill(); ctx.restore();
      if (caught) { // tiny panicked pupils
        ctx.beginPath(); ctx.arc(pt[0] + Math.sin(t * 23 + i) * es * 0.25, pt[1] + Math.cos(t * 19 + i) * es * 0.2, es * 0.3, 0, TAU); ctx.fillStyle = 'rgba(20,40,10,0.95)'; ctx.fill();
      } else { // slit pupil
        ctx.beginPath(); ctx.ellipse(pt[0] + es * 0.35, pt[1] + es * 0.05, es * 0.16, Math.max(0.5, es * 0.4 * blink), 0, 0, TAU); ctx.fillStyle = 'rgba(30,60,10,0.9)'; ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawCocci(ctx, L, t, caught, pd, seed, rim, fl, spread, eyes) {
    var R = rng(seed * 53 + 11), rs = L * 0.17, balls = [[0, 0, 1.15]];
    for (var i = 0; i < 7; i++) { var a = (i / 7) * TAU + R() * 0.4, d = rs * (1.75 + R() * 0.35); balls.push([Math.cos(a) * d, Math.sin(a) * d * 0.85, 0.85 + R() * 0.25]); }
    var br = smooth(0.25, 0.85, pd), fade = 1 - smooth(0.6, 1, pd), col = mixC([46, 88, 60], [150, 128, 120], smooth(0, 0.3, pd));
    for (i = balls.length - 1; i >= 0; i--) {
      var b = balls[i], jx = caught ? Math.sin(t * 17 + i * 2) * rs * 0.08 : Math.sin(t * 2 + i) * rs * 0.03, jy = caught ? Math.cos(t * 15 + i) * rs * 0.08 : 0;
      var dl = Math.hypot(b[0], b[1]) || 1, off = i ? br * L * 0.4 * spread : 0;
      var bx = b[0] + jx + (b[0] / dl) * off, by = b[1] + jy + (b[1] / dl) * off, r = rs * b[2] * (1 - 0.5 * br);
      ctx.save(); ctx.globalAlpha *= fade;
      // pili
      ctx.beginPath(); for (var k = 0; k < 14; k++) { var aa = (k / 14) * TAU + i; ctx.moveTo(bx + Math.cos(aa) * r, by + Math.sin(aa) * r); ctx.lineTo(bx + Math.cos(aa) * r * 1.18, by + Math.sin(aa) * r * 1.18); }
      ctx.strokeStyle = 'rgba(170,230,90,' + (0.5 * (1 - pd)).toFixed(3) + ')'; ctx.lineWidth = Math.max(1, L * 0.006); ctx.stroke();
      var g = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.1, bx, by, r);
      g.addColorStop(0, rgba(mixC(col, [255, 255, 255], 0.2), 1)); g.addColorStop(1, rgba(mixC(col, [0, 0, 0], 0.55), 1));
      ctx.beginPath(); ctx.arc(bx, by, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = Math.max(1, L * 0.01); ctx.strokeStyle = 'rgba(12,30,22,1)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by, r * 0.9, 0, TAU); ctx.lineWidth = Math.max(1, L * 0.005); ctx.strokeStyle = 'rgba(170,230,90,0.5)'; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(bx, by, r, Math.PI * 1.05, Math.PI * 1.6); ctx.strokeStyle = rgba(rim, 0.5); ctx.lineWidth = r * 0.12; ctx.stroke();
      ctx.restore();
    }
    var eA = 1 - smooth(0, 0.22, pd);
    if (eyes && eA > 0.01) drawEyes(ctx, [[-rs * 0.4, -rs * 0.2], [rs * 0.4, -rs * 0.25], [0, rs * 0.35]], function (a, b) { return [a, b]; }, rs * 0.22, t, caught, eA, pd);
  }

  /* ========================================================= PHAGOCYTOSIS */
  var phagoG = null;
  function phagoGeom() {
    if (phagoG) return phagoG;
    var R = rng(4242), Rc = 330, Ri = 104, lobes = [];
    var angs = [1.85, 2.7, 3.55, 4.4];
    for (var i = 0; i < 4; i++) lobes.push({ x: -80 + Math.cos(angs[i]) * 160, y: Math.sin(angs[i]) * 160, rx: 50 + R() * 6, ry: 39 + R() * 5, rot: angs[i] + Math.PI / 2 + (R() - 0.5) * 0.3 });
    var bIn = [Rc * 0.3, 40], bTouch = [Rc + Ri - 22, 0];
    function rej(x, y, pad) {
      if (inLobes(lobes, x, y, 1.12)) return true;
      if (Math.hypot(x - bIn[0], y - bIn[1]) < Ri + pad) return true;
      if (Math.hypot(x - bTouch[0], y - bTouch[1]) < Ri + 40) return true;
      return false;
    }
    var spec = [], azu = [], tries = 0;
    while (spec.length < 190 && tries++ < 20000) { var a = R() * TAU, r = Math.sqrt(R()) * Rc * 0.9, x = Math.cos(a) * r, y = Math.sin(a) * r; if (!rej(x, y, 12)) spec.push({ x: x, y: y, r: 3.2 + R() * 1.6 }); }
    tries = 0;
    while (azu.length < 22 && tries++ < 20000) {
      a = R() * TAU; r = Math.sqrt(R()) * Rc * 0.86; x = Math.cos(a) * r; y = Math.sin(a) * r;
      if (rej(x, y, 20)) continue;
      var ok = true; for (var j = 0; j < azu.length; j++) if (Math.hypot(azu[j].x - x, azu[j].y - y) < 46) ok = false;
      if (ok) azu.push({ x: x, y: y, r: 9 + R() * 3 });
    }
    function near(list, n) {
      return list.map(function (g, k) { return [Math.hypot(g.x - bIn[0], g.y - bIn[1]), k]; }).sort(function (a2, b2) { return a2[0] - b2[0]; }).slice(0, n).map(function (q) { return q[1]; });
    }
    var migA = near(azu, 7), migS = near(spec, 12), mig = [];
    for (i = 0; i < migA.length; i++) { azu[migA[i]].mig = mig.length; mig.push({ g: azu[migA[i]], kind: 'azu', d: 0.455 + i * 0.016 }); }
    for (i = 0; i < migS.length; i++) { spec[migS[i]].mig = mig.length; mig.push({ g: spec[migS[i]], kind: 'spec', d: 0.46 + (i % 6) * 0.017 }); }
    phagoG = { Rc: Rc, Ri: Ri, th: 50, Lb: 170, lobes: lobes, spec: spec, azu: azu, mig: mig, bIn: bIn, bTouch: bTouch, bStart: [Rc + Ri + 190, -70], chroma: rng(77) };
    return phagoG;
  }
  /**
   * phagocytosis(ctx, {x=960, y=540, scale=1, p, t, alpha=1, labels=true, steps=true, bg=false, title})
   * Cut-away schematic of a neutrophil (translucent cytoplasm, 4-lobed segmented nucleus, fine specific
   * granules + larger azurophil granules = lysosomes containing myeloperoxidase) phagocytosing a bacterium.
   * x,y = centre of the cell. Natural size ≈ 1240 × 940 (cell Ø 660 + labels + step strip).
   * p stages:
   *   0.00–0.12  recognition: bacterium swims in and touches the membrane (label 細菌 / 認識)
   *   0.12–0.34  pseudopods (偽足) extend around the bacterium (cup closes)
   *   0.34–0.47  pseudopods fuse → phagosome (ファゴソーム) pinches in and moves into the cytoplasm
   *   0.45–0.62  azurophil granules (リソソーム) + specific granules migrate and fuse (degranulation flashes)
   *   0.60–0.90  phagolysosome (ファゴリソソーム) glows; active oxygen (活性酸素: O₂⁻, H₂O₂, HOCl via MPO) sparks;
   *              bacterium is digested (bacterium state 'digested' 0→1)
   *   0.88–1.00  residual body (残余小体): vesicle shrinks, dark debris remains
   */
  function phagocytosis(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 0 : o.p, 0, 1), t = o.t || 0, sc = o.scale || 1, alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0.003) return;
    if (o.bg) wbcBackdrop(ctx, { t: t });
    var G = phagoGeom(), Rc = G.Rc, Ri = G.Ri, th = G.th, Ro = Ri + th;
    ctx.save(); ctx.translate(o.x == null ? 960 : o.x, o.y == null ? 540 : o.y); ctx.scale(sc, sc); ctx.globalAlpha *= alpha;
    var fuseP = 0.34, bx, by, mode;
    if (p < 0.12) { var pa = easeInOut(win(p, 0, 0.12)); bx = lerp(G.bStart[0], G.bTouch[0], pa); by = lerp(G.bStart[1], 0, pa); mode = 'approach'; }
    else if (p < fuseP) { bx = G.bTouch[0]; by = 0; mode = 'cup'; }
    else { var mi = easeInOut(win(p, fuseP + 0.005, 0.47)); bx = lerp(G.bTouch[0], G.bIn[0], mi); by = lerp(0, G.bIn[1], mi); mode = 'phago'; }
    var lil = [214, 186, 255];
    function wob(th0) { return 1 + 0.01 * Math.sin(4 * th0 + t * 1.3) + 0.007 * Math.sin(7 * th0 - t * 2); }
    // ---- membrane path
    function membrane() {
      ctx.beginPath();
      var k, N = 120;
      if (mode === 'approach' || mode === 'phago') {
        var bump = 0, sig = 0.42;
        if (mode === 'approach') bump = 14 * smooth(0.06, 0.12, p);
        else bump = (G.bTouch[0] + Ro - Rc) * 0.85 * (1 - smooth(fuseP, 0.46, p));
        for (k = 0; k <= N; k++) {
          var a = (k / N) * TAU, aw = Math.atan2(Math.sin(a), Math.cos(a)), r = Rc * wob(a) + bump * Math.exp(-(aw * aw) / (2 * sig * sig));
          if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); return;
      }
      // cup: cell arc + pseudopod arms wrapping the bacterium (centre (bx,0))
      var d = bx, aa = (Rc * Rc - Ro * Ro + d * d) / (2 * d), h = Math.sqrt(Math.max(0, Rc * Rc - aa * aa));
      var thL = Math.atan2(h, aa), psiU = Math.atan2(-h, aa - bx) + TAU, psiL = Math.atan2(h, aa - bx), phMin = psiU - Math.PI;
      var phi = lerp(phMin + 0.02, Math.PI - 0.015, easeInOut(win(p, 0.12, fuseP)));
      for (k = 0; k <= N; k++) {
        var a2 = lerp(thL, TAU - thL, k / N), aw2 = Math.atan2(Math.sin(a2), Math.cos(a2)), damp = 1 - Math.exp(-(aw2 * aw2) / 0.3);
        var r2 = Rc * (1 + (wob(a2) - 1) * damp);
        if (k === 0) ctx.moveTo(Math.cos(a2) * r2, Math.sin(a2) * r2); else ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
      }
      var P = function (ps, rr) { ctx.lineTo(bx + Math.cos(ps) * rr, Math.sin(ps) * rr); };
      var M = 30, ps0, rm = (Ri + Ro) / 2, b, ct;
      for (k = 0; k <= M; k++) P(lerp(psiU, Math.PI + phi, k / M), Ro);
      ps0 = Math.PI + phi;
      for (k = 0; k <= 12; k++) { b = (k / 12) * Math.PI; ct = [bx + Math.cos(ps0) * rm, Math.sin(ps0) * rm]; ctx.lineTo(ct[0] + (th / 2) * (Math.cos(ps0) * Math.cos(b) - Math.sin(ps0) * Math.sin(b)), ct[1] + (th / 2) * (Math.sin(ps0) * Math.cos(b) + Math.cos(ps0) * Math.sin(b))); }
      for (k = 0; k <= M * 2; k++) P(lerp(Math.PI + phi, Math.PI - phi, k / (M * 2)), Ri);
      ps0 = Math.PI - phi;
      for (k = 0; k <= 12; k++) { b = Math.PI - (k / 12) * Math.PI; ct = [bx + Math.cos(ps0) * rm, Math.sin(ps0) * rm]; ctx.lineTo(ct[0] + (th / 2) * (Math.cos(ps0) * Math.cos(b) + Math.sin(ps0) * Math.sin(b)), ct[1] + (th / 2) * (Math.sin(ps0) * Math.cos(b) - Math.cos(ps0) * Math.sin(b))); }
      for (k = 0; k <= M; k++) P(lerp(Math.PI - phi, psiL, k / M), Ro);
      ctx.closePath();
      G._phi = phi;
    }
    function drawMembrane() {
      membrane();
      var cg = ctx.createRadialGradient(-80, -90, 40, 0, 0, Rc * 1.25);
      cg.addColorStop(0, 'rgba(250,240,255,0.62)'); cg.addColorStop(0.75, 'rgba(226,204,252,0.5)'); cg.addColorStop(1, 'rgba(200,170,245,0.55)');
      ctx.fillStyle = cg; ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
      ctx.strokeStyle = rgba(lil, 0.22); ctx.lineWidth = 22; ctx.stroke(); ctx.restore();
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(236,222,255,0.95)'; ctx.lineWidth = 10; ctx.stroke();
      ctx.strokeStyle = 'rgba(110,70,170,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
    }
    // bacterium state
    var dp = smooth(0.62, 0.9, p), bState = p < 0.62 ? (p < 0.1 ? 'idle' : 'caught') : 'digested';
    var flg = 1 - smooth(0.2, 0.36, p);
    function drawBac(clipR) {
      ctx.save();
      if (clipR) { ctx.beginPath(); ctx.arc(bx, by, clipR, 0, TAU); ctx.clip(); }
      bacterium(ctx, { x: bx, y: by, size: G.Lb, t: t, state: bState, p: dp, seed: 3, flip: true, flagella: flg, spread: 0.22, rot: mode === 'phago' ? 0.25 * smooth(0.36, 0.5, p) : 0 });
      ctx.restore();
    }
    // background halo
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, 0, 0, Rc * 1.7, [150, 90, 220], 0.25); ctx.restore();
    if (mode === 'cup') drawBac(null);
    drawMembrane();
    // nucleus
    ctx.save();
    var nuc = [96, 46, 146], nucHi = [156, 104, 206], dark = [50, 18, 86];
    for (var pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? rgba(nuc, 1) : rgba(dark, 1); ctx.lineCap = 'round'; ctx.lineWidth = pass ? 11 : 17;
      for (var i = 1; i < G.lobes.length; i++) { var A = G.lobes[i - 1], B = G.lobes[i]; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(-80 + ((A.x + B.x) / 2 + 80) * 0.85, ((A.y + B.y) / 2) * 0.85, B.x, B.y); ctx.stroke(); }
      ctx.beginPath();
      for (i = 0; i < G.lobes.length; i++) { var Lb = G.lobes[i], gr = pass ? 0 : 4; ctx.moveTo(Lb.x + Math.cos(Lb.rot) * (Lb.rx + gr), Lb.y + Math.sin(Lb.rot) * (Lb.rx + gr)); ctx.ellipse(Lb.x, Lb.y, Lb.rx + gr, Lb.ry + gr, Lb.rot + 0.03 * Math.sin(t + i), 0, TAU); }
      if (pass) { var ng = ctx.createRadialGradient(-150, -60, 10, -95, 0, 200); ng.addColorStop(0, rgba(nucHi, 0.97)); ng.addColorStop(1, rgba(nuc, 0.97)); ctx.fillStyle = ng; } else ctx.fillStyle = rgba(dark, 0.95);
      ctx.fill();
    }
    ctx.clip();
    var Rch = rng(91);
    for (i = 0; i < 40; i++) { var Lc = G.lobes[i % 4]; ctx.beginPath(); ctx.ellipse(Lc.x + (Rch() - 0.5) * Lc.rx * 1.5, Lc.y + (Rch() - 0.5) * Lc.ry * 1.5, 6 + Rch() * 10, 4 + Rch() * 7, Rch() * 3, 0, TAU); ctx.fillStyle = rgba(dark, 0.4); ctx.fill(); }
    ctx.restore();
    // granules at home
    function gpos(g) {
      if (g.mig == null) return [g.x + Math.sin(t * 0.7 + g.x) * 2, g.y + Math.cos(t * 0.6 + g.y) * 2, 1];
      var m = G.mig[g.mig], u = easeInOut(win(p, m.d, m.d + 0.07)), f = win(p, m.d + 0.07, m.d + 0.1);
      var dx = g.x - bx, dy = g.y - by, dl = Math.hypot(dx, dy) || 1, tx = bx + (dx / dl) * Ri, ty = by + (dy / dl) * Ri;
      return [lerp(g.x, tx, u), lerp(g.y, ty, u), 1 - f, u, f, tx, ty];
    }
    ctx.beginPath();
    for (i = 0; i < G.spec.length; i++) { var g = G.spec[i]; if (g.mig != null) continue; var q = gpos(g); ctx.moveTo(q[0] + g.r, q[1]); ctx.arc(q[0], q[1], g.r, 0, TAU); }
    ctx.fillStyle = 'rgba(214,150,200,0.85)'; ctx.fill();
    for (i = 0; i < G.azu.length; i++) {
      g = G.azu[i]; if (g.mig != null) continue; q = gpos(g);
      ctx.beginPath(); ctx.arc(q[0], q[1], g.r, 0, TAU); ctx.fillStyle = 'rgba(140,40,120,0.92)'; ctx.fill();
      ctx.beginPath(); ctx.arc(q[0] - g.r * 0.3, q[1] - g.r * 0.3, g.r * 0.35, 0, TAU); ctx.fillStyle = 'rgba(255,200,240,0.5)'; ctx.fill();
    }
    // phagosome / phagolysosome
    var fused = 0; for (i = 0; i < G.mig.length; i++) fused += win(p, G.mig[i].d + 0.07, G.mig[i].d + 0.1); fused /= G.mig.length;
    var res = smooth(0.88, 1, p), glow = smooth(0.58, 0.68, p) * (1 - smooth(0.88, 1, p));
    var vr = Ri * (1 - 0.48 * res);
    if (mode === 'approach') drawBac(null);
    if (mode === 'phago') {
      var ringC = mixC([226, 206, 255], [255, 120, 170], fused);
      ctx.beginPath(); ctx.arc(bx, by, vr, 0, TAU);
      var vg = ctx.createRadialGradient(bx, by, 4, bx, by, vr);
      vg.addColorStop(0, rgba(mixC([255, 248, 255], [140, 90, 120], res), 0.35 + 0.3 * res)); vg.addColorStop(1, rgba(mixC([220, 200, 255], [110, 60, 100], res), 0.5));
      ctx.fillStyle = vg; ctx.fill();
      if (res < 0.95) drawBac(vr - 4);
      if (glow > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        var pul = 0.75 + 0.25 * Math.sin(t * 9);
        glowDot(ctx, bx, by, vr * 2.4, [255, 110, 160], 0.55 * glow * pul);
        glowDot(ctx, bx, by, vr * 1.1, [255, 190, 120], 0.45 * glow * pul);
        // active oxygen sparks
        var ros = smooth(0.64, 0.7, p) * (1 - smooth(0.86, 0.92, p));
        for (i = 0; i < 16; i++) {
          var Rs = rng(500 + i), ph = mod(t * (0.8 + Rs()) + Rs(), 1), ang = Rs() * TAU + t * 0.6, rr = vr * (0.15 + 0.7 * Rs());
          sparkle(ctx, bx + Math.cos(ang) * rr, by + Math.sin(ang) * rr, 7 + 9 * Rs(), [255, 240, 160], ros * Math.sin(ph * Math.PI), ph * 2);
        }
        ctx.restore();
        if (ros > 0.01) {
          var toks = ['O₂⁻', 'H₂O₂', 'HOCl'];
          ctx.save(); ctx.font = font(24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
          for (i = 0; i < 3; i++) {
            var ta2 = (i / 3) * TAU + t * 0.5, tx2 = bx + Math.cos(ta2) * vr * 0.62, ty2 = by + Math.sin(ta2) * vr * 0.62;
            var fa = ros * (0.6 + 0.4 * Math.sin(t * 3 + i * 2));
            ctx.globalAlpha = alpha * fa; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,0,30,0.9)'; ctx.strokeText(toks[i], tx2, ty2);
            ctx.fillStyle = '#fff3c0'; ctx.fillText(toks[i], tx2, ty2);
          }
          ctx.restore();
        }
      }
      // residual body debris
      if (res > 0.01) {
        ctx.beginPath();
        for (i = 0; i < 14; i++) { var Rr2 = rng(800 + i), a3 = Rr2() * TAU, d3 = Math.sqrt(Rr2()) * vr * 0.65; ctx.moveTo(bx + Math.cos(a3) * d3 + 6, by + Math.sin(a3) * d3); ctx.arc(bx + Math.cos(a3) * d3, by + Math.sin(a3) * d3, 3 + Rr2() * 5, 0, TAU); }
        ctx.fillStyle = 'rgba(70,40,60,' + (0.85 * res).toFixed(3) + ')'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(bx, by, vr, 0, TAU);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(ringC, 0.3 + 0.3 * glow); ctx.lineWidth = 16; ctx.stroke(); ctx.restore();
      ctx.strokeStyle = rgba(mixC(ringC, [255, 255, 255], 0.4), 0.95); ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = rgba(mixC(ringC, [60, 20, 90], 0.6), 0.7); ctx.lineWidth = 2; ctx.stroke();
      // fusion flash at the moment the pseudopods close
      var ff = bell(p, fuseP - 0.01, fuseP + 0.005, fuseP + 0.01, fuseP + 0.05);
      if (ff > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, bx + Ri, by, 120, [255, 240, 255], ff); sparkle(ctx, bx + Ri + 10, by, 40, [240, 220, 255], ff, 0.3); ctx.restore(); }
    }
    // migrating granules (+ fusion flashes)
    var lysoPos = null;
    for (i = 0; i < G.mig.length; i++) {
      var m = G.mig[i]; q = gpos(m.g);
      if (i === 0) lysoPos = [q[0], q[1]];
      if (q[2] <= 0.01) continue;
      var rr3 = m.g.r * q[2] * (m.kind === 'azu' ? 1.15 : 1.3);
      if (q[4] > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, q[5], q[6], 46, m.kind === 'azu' ? [255, 120, 220] : [255, 200, 230], 0.9 * Math.sin(q[4] * Math.PI)); ctx.restore(); }
      if (m.kind === 'azu') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, q[0], q[1], rr3 * 3, [255, 100, 210], 0.5 * smooth(0.44, 0.47, p)); ctx.restore();
        ctx.beginPath(); ctx.arc(q[0], q[1], rr3, 0, TAU); ctx.fillStyle = 'rgba(150,40,130,0.95)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,190,240,0.8)'; ctx.stroke();
      } else { ctx.beginPath(); ctx.arc(q[0], q[1], rr3, 0, TAU); ctx.fillStyle = 'rgba(230,160,215,0.95)'; ctx.fill(); }
    }
    // ---- labels
    if (o.labels !== false) {
      var acc = [214, 180, 255];
      tag(ctx, '細菌', G.bStart[0] - 40, -250, { grow: smooth(0, 0.04, p), alpha: 1 - smooth(0.11, 0.15, p), tx: bx + 10, ty: by - 50, accent: [190, 255, 120], size: 36, align: 'center' });
      if (mode === 'cup') {
        var ph2 = G._phi, tipX = bx + Math.cos(Math.PI + ph2) * (Ri + th / 2), tipY = Math.sin(Math.PI + ph2) * (Ri + th / 2);
        tag(ctx, '偽足', 330, -330, { grow: win(p, 0.15, 0.22), alpha: 1 - smooth(0.31, 0.34, p), tx: tipX, ty: tipY, accent: acc, sub: '細胞膜がのびて包みこむ' });
      }
      tag(ctx, 'ファゴソーム', 330, -330, { grow: win(p, 0.36, 0.42), alpha: 1 - smooth(0.58, 0.61, p), tx: bx, ty: by - Ri, accent: acc, sub: '細菌を包んだ小胞' });
      if (lysoPos) tag(ctx, 'リソソーム', -40, -420, { grow: win(p, 0.44, 0.48), alpha: 1 - smooth(0.57, 0.6, p), tx: lysoPos[0], ty: lysoPos[1], accent: [255, 130, 220], sub: 'アズール顆粒（MPOを含む）' });
      tag(ctx, 'ファゴリソソーム', 330, -330, { grow: win(p, 0.6, 0.66), alpha: 1 - smooth(0.87, 0.9, p), tx: bx + vr * 0.5, ty: by - vr * 0.86, accent: [255, 130, 180], sub: 'リソソームと融合' });
      tag(ctx, '活性酸素', 360, 300, { grow: win(p, 0.66, 0.72), alpha: 1 - smooth(0.87, 0.9, p), tx: bx + vr * 0.55, ty: by + vr * 0.6, accent: [255, 220, 120], sub: 'H₂O₂・HOCl などで分解' });
      tag(ctx, '残余小体', 330, -330, { grow: win(p, 0.9, 0.95), tx: bx, ty: by - vr, accent: [200, 170, 200], sub: '分解の残りかす' });
    }
    if (o.steps !== false) {
      var stp = p < 0.12 ? 0 : p < fuseP ? 1 : p < 0.45 ? 2 : p < 0.6 ? 3 : p < 0.88 ? 4 : 5;
      stepper(ctx, ['認識', '偽足で包む', 'ファゴソーム', 'リソソーム融合', '分解（活性酸素）', '残余小体'], 30, Rc + 105, stp, { size: 25 });
    }
    if (o.title) tag(ctx, o.title, -560, -400, { size: 50, accent: [214, 180, 255] });
    ctx.restore();
  }

  /* ============================================================== ENGULF FX */
  /**
   * engulfFX(ctx, {centerX, centerY, radius=200, p, t, alpha=1, fromAngle=π, originX, originY, color='#c9a8ff', seed=1})
   * In-story capture effect: a translucent lilac membrane bubble sweeps around the target from the side of the
   * character (fromAngle = direction from the target toward the character; π = character on the left) and closes.
   * Draw the bacterium first, then this. originX/Y = the character's hands (default: 1.8·radius toward fromAngle).
   * Natural size ≈ 2.8·radius square (rim glow + sparks).
   * p stages:
   *   0.00–0.18  energy streams from the hands to the near side of the target, ring of light gathers
   *   0.10–0.70  two membrane arcs sweep around the target (top & bottom), a translucent sheet follows them,
   *              sparks and speed lines at the leading tips, converging energy lines
   *   0.66–0.80  arcs meet on the far side: closure flash + shock ring + spark burst
   *   0.80–1.00  sealed bubble (vesicle) wobbles gently, specular highlight, slow sparkles (hold here)
   */
  function engulfFX(ctx, o) {
    o = o || {};
    var cx = o.centerX == null ? (o.x == null ? 960 : o.x) : o.centerX, cy = o.centerY == null ? (o.y == null ? 540 : o.y) : o.centerY;
    var R = o.radius || 200, p = clamp(o.p == null ? 0 : o.p, 0, 1), t = o.t || 0, alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0.003) return;
    var from = o.fromAngle == null ? Math.PI : o.fromAngle, col = parseColor(o.color || '#c9a8ff'), seed = o.seed || 1;
    var white = mixC(col, [255, 255, 255], 0.65);
    var ox = o.originX == null ? cx + Math.cos(from) * R * 1.8 : o.originX, oy = o.originY == null ? cy + Math.sin(from) * R * 1.8 : o.originY;
    var sweep = easeInOut(win(p, 0.1, 0.7)), span = Math.PI * sweep, closed = p >= 0.7;
    var flash = p > 0.68 ? Math.exp(-Math.max(0, p - 0.7) * 22) * smooth(0.66, 0.7, p) : 0;
    var settle = smooth(0.75, 1, p);
    function rad(th) { return R * (1 + 0.025 * Math.sin(3 * th + t * 2.3) + 0.016 * Math.sin(5 * th - t * 3.1) + 0.05 * flash * Math.sin(8 * th + t * 6)); }
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // 1. energy streams from the hands
    var es = bell(p, 0, 0.08, 0.22, 0.4);
    if (es > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var sx = cx + Math.cos(from) * R, sy = cy + Math.sin(from) * R;
      for (var i = 0; i < 6; i++) {
        var Rr = rng(seed * 71 + i), bend = (Rr() - 0.5) * R * 0.9, mx = (ox + sx) / 2 - Math.sin(from) * bend, my = (oy + sy) / 2 + Math.cos(from) * bend;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(mx, my, sx + (Rr() - 0.5) * R * 0.3, sy + (Rr() - 0.5) * R * 0.5);
        ctx.setLineDash([R * 0.12, R * 0.08]); ctx.lineDashOffset = -t * R * 2.2 - i * 20;
        ctx.strokeStyle = rgba(white, 0.6 * es); ctx.lineWidth = 3 + Rr() * 3; ctx.stroke();
      }
      ctx.setLineDash([]);
      glowDot(ctx, ox, oy, R * 0.6, col, 0.8 * es); glowDot(ctx, sx, sy, R * 0.7, col, 0.7 * es);
      ctx.restore();
    }
    // 2. converging energy lines
    var cl = bell(p, 0.15, 0.3, 0.7, 0.8);
    if (cl > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < 28; i++) {
        var Rc2 = rng(seed * 131 + i), a = Rc2() * TAU + t * 0.4, ph = mod(t * (1.2 + Rc2()) + Rc2(), 1);
        var r0 = R * (2.1 - 0.9 * ph), r1 = r0 - R * (0.25 + 0.3 * Rc2());
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.strokeStyle = rgba(white, cl * 0.55 * Math.sin(ph * Math.PI)); ctx.lineWidth = 2 + 2 * Rc2(); ctx.stroke();
      }
      ctx.restore();
    }
    // 3. membrane sheet
    if (sweep > 0.002) {
      var aU = from + span, aL = from - span, N = 64, k;
      ctx.beginPath();
      if (!closed) {
        for (k = 0; k <= N; k++) { var th = lerp(aL, aU, k / N), rr = rad(th); if (k === 0) ctx.moveTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr); else ctx.lineTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr); }
        var tUx = cx + Math.cos(aU) * rad(aU), tUy = cy + Math.sin(aU) * rad(aU), tLx = cx + Math.cos(aL) * rad(aL), tLy = cy + Math.sin(aL) * rad(aL);
        var bulge = R * 0.35 * Math.sin(span), cpx = (tUx + tLx) / 2 - Math.cos(from) * bulge, cpy = (tUy + tLy) / 2 - Math.sin(from) * bulge;
        ctx.quadraticCurveTo(cpx, cpy, tLx, tLy);
      } else {
        for (k = 0; k <= N; k++) { th = (k / N) * TAU; rr = rad(th); if (k === 0) ctx.moveTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr); else ctx.lineTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr); }
      }
      ctx.closePath();
      var fg = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
      fg.addColorStop(0, rgba(col, 0.1 + 0.08 * settle)); fg.addColorStop(0.75, rgba(col, 0.2 + 0.08 * settle)); fg.addColorStop(1, rgba(white, 0.38));
      ctx.fillStyle = fg; ctx.fill();
      // rim arcs
      ctx.beginPath();
      var a0 = closed ? 0 : aL, a1 = closed ? TAU : aU;
      for (k = 0; k <= N; k++) { th = lerp(a0, a1, k / N); rr = rad(th); if (k === 0) ctx.moveTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr); else ctx.lineTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(col, 0.28 + 0.3 * flash); ctx.lineWidth = R * 0.1; ctx.stroke();
      ctx.strokeStyle = rgba(white, 0.95); ctx.lineWidth = Math.max(2, R * 0.022); ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      for (k = 0; k <= N; k++) { th = lerp(a0, a1, k / N); rr = rad(th) * 0.93; if (k === 0) ctx.moveTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr); else ctx.lineTo(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr); }
      ctx.strokeStyle = rgba(white, 0.45); ctx.lineWidth = Math.max(1, R * 0.008); ctx.stroke();
      // receptor dots on the membrane
      ctx.fillStyle = rgba(white, 0.7);
      for (k = 0; k < 24; k++) { th = lerp(a0, a1, (k + 0.5) / 24); rr = rad(th) * 0.965; ctx.beginPath(); ctx.arc(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr, Math.max(1.5, R * 0.01), 0, TAU); ctx.fill(); }
      // tips: sparks + trailing speed arcs
      if (!closed) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        [[aU, -1], [aL, 1]].forEach(function (tp) {
          var ta = tp[0], tx = cx + Math.cos(ta) * rad(ta), ty = cy + Math.sin(ta) * rad(ta);
          glowDot(ctx, tx, ty, R * 0.45, col, 0.9);
          sparkle(ctx, tx, ty, R * 0.2, white, 1, t * 4);
          for (var j = 1; j <= 3; j++) {
            ctx.beginPath(); ctx.arc(cx, cy, R * (1.08 + j * 0.07), ta + tp[1] * 0.08 * j, ta + tp[1] * (0.08 * j + 0.5), tp[1] > 0);
            ctx.strokeStyle = rgba(white, 0.5 / j); ctx.lineWidth = 3; ctx.stroke();
          }
          for (j = 0; j < 6; j++) {
            var Rp = rng(seed * 900 + j + (tp[1] > 0 ? 50 : 0)), age = mod(t * 2.5 + Rp(), 1), back = ta + tp[1] * age * 0.6;
            var pr = R * (1 + (Rp() - 0.3) * 0.3 + age * 0.25);
            glowDot(ctx, cx + Math.cos(back) * pr, cy + Math.sin(back) * pr, 6 + 8 * Rp(), white, (1 - age) * 0.9);
          }
        });
        ctx.restore();
      }
    }
    // 4. closure flash + shock ring + burst
    if (flash > 0.01 || bell(p, 0.68, 0.7, 0.82, 0.9) > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var fx = cx - Math.cos(from) * R, fy = cy - Math.sin(from) * R;
      glowDot(ctx, fx, fy, R * 1.2, white, flash);
      glowDot(ctx, cx, cy, R * 1.6, col, 0.5 * flash);
      var sr = win(p, 0.69, 0.85);
      if (sr > 0 && sr < 1) { ctx.beginPath(); ctx.arc(cx, cy, R * (1 + 0.6 * easeOut(sr)), 0, TAU); ctx.strokeStyle = rgba(white, 0.8 * (1 - sr)); ctx.lineWidth = R * 0.04 * (1 - sr) + 1; ctx.stroke(); }
      for (i = 0; i < 18; i++) {
        var Rb = rng(seed * 333 + i), ba = Rb() * TAU, bd = R * (1 + (0.3 + Rb() * 0.6) * easeOut(sr));
        sparkle(ctx, cx + Math.cos(ba) * bd, cy + Math.sin(ba) * bd, R * (0.04 + 0.05 * Rb()), white, (1 - sr) * (sr > 0 ? 1 : 0), ba);
      }
      ctx.restore();
    }
    // 5. settled bubble: specular + slow sparkles
    if (settle > 0.01) {
      ctx.save(); ctx.globalAlpha *= settle;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, Math.PI * 1.12, Math.PI * 1.42);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = R * 0.045; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - R * 0.5, cy - R * 0.55, R * 0.04, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < 6; i++) { var Rs = rng(seed * 55 + i), sa = Rs() * TAU + t * 0.5, tw = Math.pow(Math.max(0, Math.sin(t * (1.5 + Rs()) + i * 2)), 3); sparkle(ctx, cx + Math.cos(sa) * rad(sa), cy + Math.sin(sa) * rad(sa), R * 0.07, white, tw, 0); }
      ctx.restore();
    }
    ctx.restore();
  }

  /* ============================================================ WBC LINEUP */
  var LINEUP = [
    { type: 'neutrophil', pct: '60〜70%', w: 65 },
    { type: 'eosinophil', pct: '2〜5%', w: 3.5 },
    { type: 'basophil', pct: '1%以下', w: 0.6 },
    { type: 'lymphocyte', pct: '25〜30%', w: 27.5 },
    { type: 'monocyte', pct: '約5%', w: 4.5 }
  ];
  /**
   * wbcLineup(ctx, {x=960, y=540, scale=1, p, t, alpha=1, highlight=-1, highlightAmt=1, title='白血球の5種類', bar=true})
   * The five white blood cells side by side (relative sizes: lymphocyte small, monocyte largest), name + share
   * of WBCs, and a stacked percentage bar. x,y = centre. Natural size ≈ 1720 × 760.
   * Percentages (lecture table): 好中球 60〜70% / 好酸球 2〜5% / 好塩基球 1%以下 / リンパ球 25〜30% / 単球 約5%.
   * p stages: 0–0.06 title; cell i pops in at 0.06+0.12·i (first as glowing silhouette, colour fills +0.05..+0.14,
   *   name/percent +0.08..+0.16) → all five by 0.70; 0.68–0.95 bar segments grow left→right; 0.95–1 hold.
   * highlight = index 0..4 dims the others (highlightAmt 0..1 to animate it).
   */
  function wbcLineup(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, sc = o.scale || 1, alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0.003) return;
    var hl = o.highlight == null ? -1 : o.highlight, ha = o.highlightAmt == null ? 1 : o.highlightAmt;
    ctx.save(); ctx.translate(o.x == null ? 960 : o.x, o.y == null ? 540 : o.y); ctx.scale(sc, sc); ctx.globalAlpha *= alpha;
    var title = o.title === undefined ? '白血球の5種類' : o.title;
    if (title) tag(ctx, title, 0, -330, { size: 56, align: 'center', grow: win(p, 0, 0.08) + 0.001, accent: [214, 180, 255] });
    for (var i = 0; i < 5; i++) {
      var L = LINEUP[i], C = CELL[L.type], st = 0.06 + 0.12 * i, pop = easeBack(win(p, st, st + 0.08)), sil = smooth(st + 0.05, st + 0.14, p);
      if (pop <= 0.001) continue;
      var isH = hl === i, dim = hl >= 0 && !isH ? 1 - 0.6 * ha : 1, boost = isH ? 1 + 0.12 * ha : 1;
      var cx = -680 + i * 340, cy = -110, r = 102 * C.rel * pop * boost;
      ctx.save(); ctx.globalAlpha *= dim;
      if (isH && ha > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, cx, cy, r * 2.4, C.accent, 0.5 * ha); ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, r * 1.22 + 4 * Math.sin(t * 4), 0, TAU); ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 30;
        ctx.strokeStyle = rgba(C.accent, 0.9 * ha); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      }
      wbcCell(ctx, { type: L.type, x: cx, y: cy + Math.sin(t * 1.3 + i) * 4, r: r, t: t, sil: sil, seed: 1 + i, glow: 0.6 });
      var na = win(p, st + 0.08, st + 0.16);
      if (na > 0) {
        tag(ctx, C.name, cx, 70, { size: 46, align: 'center', grow: 0.35 + 0.65 * na, accent: C.accent });
        ctx.save(); ctx.globalAlpha *= na; ctx.font = font(22); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,235,245,0.6)'; ctx.fillText(C.en, cx, 112); ctx.restore();
        chip(ctx, L.pct, cx, 160, { size: 32, accent: C.accent, alpha: na, fill: isH ? 'solid' : null });
      }
      ctx.restore();
    }
    if (o.bar !== false) {
      var bw = 1400, bh = 50, by = 270, x0 = -bw / 2, tot = 0;
      for (i = 0; i < 5; i++) tot += LINEUP[i].w;
      var ba = win(p, 0.66, 0.7);
      if (ba > 0) {
        ctx.save(); ctx.globalAlpha *= ba;
        roundRect(ctx, x0 - 6, by - bh / 2 - 6, bw + 12, bh + 12, 14); ctx.fillStyle = 'rgba(14,4,18,0.75)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,240,0.25)'; ctx.lineWidth = 2; ctx.stroke();
        var xx = x0;
        for (i = 0; i < 5; i++) {
          var Ls = LINEUP[i], Cs = CELL[Ls.type], segW = Math.max(6, (Ls.w / tot) * bw) * easeOut(win(p, 0.68 + i * 0.05, 0.75 + i * 0.05));
          var dimS = hl >= 0 && hl !== i ? 1 - 0.5 * ha : 1;
          if (segW > 0.5) {
            var sg = ctx.createLinearGradient(0, by - bh / 2, 0, by + bh / 2);
            sg.addColorStop(0, rgba(mixC(Cs.accent, [255, 255, 255], 0.3), dimS)); sg.addColorStop(1, rgba(mixC(Cs.accent, [40, 0, 50], 0.35), dimS));
            ctx.fillStyle = sg; ctx.fillRect(xx, by - bh / 2, segW, bh);
            ctx.fillStyle = 'rgba(10,0,10,0.6)'; ctx.fillRect(xx + segW - 1.5, by - bh / 2, 3, bh);
            if (hl === i && ha > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(Cs.accent, 0.35 * ha * (0.7 + 0.3 * Math.sin(t * 5))); ctx.fillRect(xx, by - bh / 2 - 6, segW, bh + 12); ctx.restore(); }
            var lab = win(p, 0.73 + i * 0.05, 0.78 + i * 0.05);
            if (Ls.w > 15) { ctx.save(); ctx.globalAlpha *= lab; ctx.font = font(28); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,0,20,0.6)'; ctx.lineJoin = 'round'; ctx.strokeText(Cs.name + ' ' + Ls.pct, xx + segW / 2, by + 2); ctx.fillText(Cs.name + ' ' + Ls.pct, xx + segW / 2, by + 2); ctx.restore(); }
            else {
              var lx = xx + segW / 2, ly = by + bh / 2 + 44 + (i === 2 ? 34 : 0);
              ctx.save(); ctx.globalAlpha *= lab; ctx.strokeStyle = rgba(Cs.accent, 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, by + bh / 2 + 2); ctx.lineTo(lx, ly - 16); ctx.stroke();
              ctx.font = font(24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(mixC(Cs.accent, [255, 255, 255], 0.5), 1); ctx.fillText(Cs.name, lx, ly); ctx.restore();
            }
          }
          xx += Math.max(6, (Ls.w / tot) * bw);
        }
        ctx.font = font(24); ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,230,240,0.65)'; ctx.fillText('白血球の中での割合（目安）', x0, by - bh / 2 - 22);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /* ======================================================== NEUTROPHIL CARD */
  /**
   * neutrophilCard(ctx, {x=960, y=540, scale=1, p, t, alpha=1, panel=true})
   * Close-up of a neutrophil with leader labels 分葉核 / 特殊顆粒 / アズール顆粒, a diameter bar 「直径 12〜15 μm」
   * and the chip 「白血球の60〜70%」. x,y = centre. Natural size 1400 × 820.
   * p stages: 0–0.08 panel; 0.04–0.22 cell scans in (top→bottom); 0.22–0.36 分葉核; 0.36–0.5 特殊顆粒;
   *   0.5–0.64 アズール顆粒; 0.64–0.8 diameter bar; 0.8–0.92 60〜70% chip; 0.92–1 hold.
   */
  function neutrophilCard(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, sc = o.scale || 1, alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0.003) return;
    var acc = CELL.neutrophil.accent, pa = smooth(0, 0.08, p);
    ctx.save(); ctx.translate(o.x == null ? 960 : o.x, o.y == null ? 540 : o.y); ctx.scale(sc, sc); ctx.globalAlpha *= alpha;
    if (o.panel !== false && pa > 0) {
      ctx.save(); ctx.globalAlpha *= pa;
      roundRect(ctx, -700, -410, 1400, 820, 30);
      var pg = ctx.createLinearGradient(0, -410, 0, 410); pg.addColorStop(0, 'rgba(34,14,44,0.82)'); pg.addColorStop(1, 'rgba(14,4,20,0.88)');
      ctx.fillStyle = pg; ctx.fill(); ctx.shadowColor = rgba(acc, 0.8); ctx.shadowBlur = 24; ctx.strokeStyle = rgba(acc, 0.6); ctx.lineWidth = 2.5; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = rgba(acc, 0.9); ctx.fillRect(-700, -340, 10, 90);
      ctx.restore();
      tag(ctx, '好中球', -660, -350, { size: 60, accent: acc, grow: 0.35 + 0.65 * pa });
      ctx.save(); ctx.globalAlpha *= pa; ctx.font = font(26); ctx.fillStyle = rgba(acc, 0.85); ctx.textBaseline = 'middle'; ctx.fillText('NEUTROPHIL', -460, -345); ctx.restore();
    }
    var cx = -250, cy = 10, r = 250, G = wbcCellAnchors('neutrophil', 3);
    // HUD rings
    var hud = smooth(0.04, 0.2, p);
    if (hud > 0) {
      ctx.save(); ctx.globalAlpha *= hud; ctx.strokeStyle = rgba(acc, 0.35); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.16, 0, TAU); ctx.setLineDash([3, 9]); ctx.lineDashOffset = t * 12; ctx.stroke();
      ctx.setLineDash([60, 30]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.arc(cx, cy, r * 1.24, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    var scan = smooth(0.04, 0.22, p);
    if (scan > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(cx - r * 1.4, cy - r * 1.4, r * 2.8, r * 2.8 * scan); ctx.clip();
      wbcCell(ctx, { type: 'neutrophil', x: cx, y: cy, r: r, t: 0, seed: 3, glow: 0.7 });
      ctx.restore();
      if (scan < 1) { var sy = cy - r * 1.4 + r * 2.8 * scan; ctx.save(); ctx.globalCompositeOperation = 'lighter'; var lg = ctx.createLinearGradient(0, sy - 30, 0, sy); lg.addColorStop(0, rgba(acc, 0)); lg.addColorStop(1, rgba(acc, 0.8)); ctx.fillStyle = lg; ctx.fillRect(cx - r * 1.3, sy - 30, r * 2.6, 32); ctx.restore(); }
    }
    // pick anchor targets
    var lobe = G.lobes.reduce(function (a, b) { return b.x > a.x ? b : a; }), gS = null, gA = null, bs = 1e9, ba = 1e9;
    G.gran.forEach(function (g) { var d = Math.hypot(g[0] - 0.62, g[1] + 0.32); if (d < bs) { bs = d; gS = g; } });
    G.azu.forEach(function (g) { var d = Math.hypot(g[0] - 0.55, g[1] - 0.38); if (d < ba) { ba = d; gA = g; } });
    tag(ctx, '分葉核', 180, -220, { grow: win(p, 0.22, 0.34), tx: cx + lobe.x * r, ty: cy + lobe.y * r, accent: acc, size: 46, sub: '核が2〜5個にくびれて分かれる' });
    tag(ctx, '特殊顆粒', 180, -50, { grow: win(p, 0.36, 0.48), tx: cx + gS[0] * r, ty: cy + gS[1] * r, accent: [240, 160, 210], size: 46, sub: '細かい顆粒（0.2〜0.4 μm）' });
    tag(ctx, 'アズール顆粒', 180, 120, { grow: win(p, 0.5, 0.62), tx: cx + gA[0] * r, ty: cy + gA[1] * r, accent: [200, 90, 190], size: 46, sub: 'ミエロペルオキシダーゼを含む' });
    // diameter bar
    var db = easeOut(win(p, 0.64, 0.78));
    if (db > 0) {
      var y0 = cy + r + 50, xa = cx - r * db, xb = cx + r * db;
      ctx.save(); ctx.strokeStyle = rgba(mixC(acc, [255, 255, 255], 0.5), 0.95); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(xa, y0); ctx.lineTo(xb, y0); ctx.moveTo(xa, y0 - 14); ctx.lineTo(xa, y0 + 14); ctx.moveTo(xb, y0 - 14); ctx.lineTo(xb, y0 + 14); ctx.stroke();
      ctx.setLineDash([4, 8]); ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r, y0); ctx.moveTo(cx + r, cy); ctx.lineTo(cx + r, y0); ctx.stroke();
      ctx.restore();
      chip(ctx, '直径 12〜15 μm', cx, y0 + 50, { size: 34, accent: acc, alpha: win(p, 0.7, 0.8) });
    }
    var ca = win(p, 0.8, 0.9);
    if (ca > 0) {
      ctx.save(); ctx.translate(430, 290); var s2 = easeBack(ca); ctx.scale(s2, s2);
      chip(ctx, '白血球の60〜70%', 0, 0, { size: 46, accent: acc, fill: 'solid' });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= ca; ctx.font = font(24); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,235,250,0.75)'; ctx.fillText('いちばん数の多い白血球', 430, 355); ctx.restore();
    }
    ctx.restore();
  }

  /* ============================================================= ALLY CARDS */
  var ALLY = [
    { type: 'eosinophil', name: '好酸球', en: 'EOSINOPHIL', pct: '2〜5%', col: [255, 128, 112], facts: ['寄生虫・アレルギーに関わる', '大きな好酸性顆粒（MBPなど）'] },
    { type: 'basophil', name: '好塩基球', en: 'BASOPHIL', pct: '1%以下', col: [150, 84, 235], facts: ['IgE受容体（Fc受容体）をもつ', '顆粒からヒスタミンを放出'] },
    { type: 'monocyte', name: '単球', en: 'MONOCYTE', pct: '約5%', col: [52, 196, 200], facts: ['白血球で最大・腎臓形の核', '組織でマクロファージになる'] },
    { type: 'lymphocyte', name: 'リンパ球', en: 'LYMPHOCYTE', pct: '25〜30%', col: [96, 184, 255], facts: ['B細胞 → 形質細胞 → 抗体', 'T細胞（CD4・CD8）・NK細胞'] }
  ];
  /**
   * allyCards(ctx, {variant 0..3, p, x, y, scale=1, t, alpha=1, exit=0, member=true})
   * Anime "name card" for the ally introductions (#31). x,y = TOP-LEFT of the card. Natural size 780 × 300.
   * 0 好酸球 (orange-pink) / 1 好塩基球 (deep violet) / 2 単球 (teal) / 3 リンパ球 (sky blue).
   * p stages: 0–0.25 skewed panel wipes in from the left (accent band flash); 0.12–0.38 cell icon pops;
   *   0.22–0.45 name + English slide in, member chip; 0.42–0.62 fact 1; 0.52–0.72 fact 2; 0.65–0.9 shimmer; hold.
   * exit 0..1 slides the card out to the left and fades it.
   */
  function allyCards(ctx, o) {
    o = o || {};
    var v = ((o.variant | 0) % 4 + 4) % 4, A = ALLY[v], p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, sc = o.scale || 1;
    var ex = clamp(o.exit || 0, 0, 1), alpha = (o.alpha == null ? 1 : o.alpha) * (1 - smooth(0.3, 1, ex));
    if (alpha <= 0.003 || p <= 0) return;
    var Wc = 780, Hc = 300, sk = -0.2, col = A.col, hi = mixC(col, [255, 255, 255], 0.5);
    ctx.save(); ctx.translate((o.x == null ? 80 : o.x) - easeInOut(ex) * 300 * sc, o.y == null ? 120 : o.y); ctx.scale(sc, sc); ctx.globalAlpha *= alpha;
    var wipe = easeOut(win(p, 0, 0.25));
    // panel (skewed)
    ctx.save(); ctx.transform(1, 0, sk, 1, -sk * Hc, 0);
    ctx.beginPath(); ctx.rect(-40, -20, (Wc + 80) * wipe, Hc + 40); ctx.clip();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    var pg = ctx.createLinearGradient(0, 0, Wc, Hc);
    pg.addColorStop(0, 'rgba(16,6,22,0.9)'); pg.addColorStop(0.6, 'rgba(22,8,30,0.88)'); pg.addColorStop(1, rgba(mixC(col, [10, 0, 20], 0.65), 0.9));
    ctx.fillStyle = pg; ctx.fillRect(0, 0, Wc, Hc); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = rgba(col, 0.85); ctx.lineWidth = 3; ctx.strokeRect(0, 0, Wc, Hc);
    var band = ctx.createLinearGradient(0, 0, 0, Hc); band.addColorStop(0, rgba(hi, 1)); band.addColorStop(1, rgba(mixC(col, [0, 0, 0], 0.3), 1));
    ctx.fillStyle = band; ctx.fillRect(0, 0, 26, Hc);
    ctx.fillStyle = rgba(col, 0.9); ctx.fillRect(26, 0, Wc - 26, 6);
    // hatch deco
    ctx.save(); ctx.beginPath(); ctx.rect(Wc - 200, Hc - 60, 200, 60); ctx.clip(); ctx.strokeStyle = rgba(col, 0.25); ctx.lineWidth = 6;
    for (var h = 0; h < 14; h++) { ctx.beginPath(); ctx.moveTo(Wc - 220 + h * 22, Hc); ctx.lineTo(Wc - 160 + h * 22, Hc - 60); ctx.stroke(); }
    ctx.restore();
    ctx.font = font(170); ctx.fillStyle = rgba(col, 0.09); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('0' + (v + 1), Wc - 16, 14);
    // shimmer
    var sh = win(p, 0.65, 0.9);
    if (sh > 0 && sh < 1) { var sx = lerp(-200, Wc + 200, sh), sg = ctx.createLinearGradient(sx - 90, 0, sx + 90, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.16)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, Wc, Hc); }
    var fl = bell(p, 0.15, 0.22, 0.24, 0.36);
    if (fl > 0.01) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(hi, 0.35 * fl); ctx.fillRect(0, 0, Wc, Hc); }
    ctx.restore();
    // icon
    var ic = easeBack(win(p, 0.12, 0.34));
    if (ic > 0.01) {
      var ix = 128, iy = 160;
      ctx.save(); ctx.translate(ix, iy); ctx.scale(ic, ic);
      ctx.beginPath(); ctx.arc(0, 0, 100, 0, TAU); ctx.fillStyle = 'rgba(8,2,12,0.75)'; ctx.fill();
      ctx.shadowColor = rgba(col, 1); ctx.shadowBlur = 20; ctx.strokeStyle = rgba(hi, 0.95); ctx.lineWidth = 4; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0, 0, 110, -Math.PI * 0.2 + t * 0.8, Math.PI * 0.5 + t * 0.8); ctx.strokeStyle = rgba(col, 0.7); ctx.lineWidth = 3; ctx.stroke();
      wbcCell(ctx, { type: A.type, x: 0, y: 0, r: A.type === 'monocyte' ? 80 : A.type === 'lymphocyte' ? 70 : 76, t: t, seed: 2 + v, glow: 0.3 });
      ctx.restore();
    }
    // name
    var na = easeOut(win(p, 0.22, 0.42));
    if (na > 0) {
      ctx.save(); ctx.globalAlpha *= na; ctx.translate((1 - na) * 60, 0);
      ctx.font = font(72); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
      ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(10,0,14,0.9)'; ctx.strokeText(A.name, 256, 104);
      var ng = ctx.createLinearGradient(0, 40, 0, 104); ng.addColorStop(0, '#ffffff'); ng.addColorStop(1, rgba(hi, 1));
      ctx.shadowColor = rgba(col, 1); ctx.shadowBlur = 18; ctx.fillStyle = ng; ctx.fillText(A.name, 256, 104); ctx.shadowBlur = 0;
      var nw = ctx.measureText(A.name).width;
      ctx.font = font(22); if ('letterSpacing' in ctx) ctx.letterSpacing = '5px'; ctx.fillStyle = rgba(hi, 0.95); ctx.fillText(A.en, 260, 140); if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      chip(ctx, A.pct, 256 + nw + 24, 80, { size: 28, accent: col, align: 'left', fill: 'solid' });
      ctx.restore();
      if (o.member !== false) {
        var nm = (BS.chars && BS.chars.ALLY_NAMES && BS.chars.ALLY_NAMES[v]) ? BS.chars.ALLY_NAMES[v].split('（')[0] : ['ユズ', 'ゴウ', 'ソウ', 'リン'][v];
        chip(ctx, '隊員 ' + nm, Wc - 26, 40, { size: 22, accent: col, align: 'right', alpha: na });
      }
      ctx.save(); ctx.globalAlpha *= na; var lg = ctx.createLinearGradient(256, 0, Wc - 40, 0); lg.addColorStop(0, rgba(col, 0.9)); lg.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = lg; ctx.fillRect(256, 160, (Wc - 296) * na, 3); ctx.restore();
    }
    for (var i = 0; i < 2; i++) {
      var fa = easeOut(win(p, 0.42 + i * 0.1, 0.62 + i * 0.1));
      if (fa <= 0) continue;
      ctx.save(); ctx.globalAlpha *= fa; ctx.translate((1 - fa) * 40, 0);
      var fy = 205 + i * 50, fs = 31; ctx.font = font(fs);
      var fw = ctx.measureText(A.facts[i]).width, avail = Wc - 300 - 30; if (fw > avail) { fs *= avail / fw; ctx.font = font(fs); }
      ctx.fillStyle = rgba(hi, 1); ctx.beginPath(); ctx.moveTo(266, fy - 9); ctx.lineTo(275, fy); ctx.lineTo(266, fy + 9); ctx.lineTo(257, fy); ctx.closePath(); ctx.fill();
      ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,246,250,0.97)'; ctx.fillText(A.facts[i], 290, fy + 1);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ========================================================= WOUND & CLOT */
  var wallCache = {};
  function wallTile(wallY) {
    var key = wallY | 0; if (wallCache[key]) return wallCache[key];
    var H = 1080 - wallY + 40, c = mkCanvas(1920, H), x = c.getContext('2d'), R = rng(606), i;
    // media (smooth muscle)
    var mg = x.createLinearGradient(0, 0, 0, H); mg.addColorStop(0, '#7a2230'); mg.addColorStop(0.35, '#5a1420'); mg.addColorStop(1, '#2a060c');
    x.fillStyle = mg; x.fillRect(0, 0, 1920, H);
    for (i = 0; i < 70; i++) {
      var sx = R() * 1980 - 30, sy = 150 + R() * (H - 150), L = 120 + R() * 120;
      x.beginPath(); x.ellipse(sx, sy, L / 2, 9 + R() * 5, (R() - 0.5) * 0.12, 0, TAU);
      x.fillStyle = 'rgba(170,60,72,' + (0.35 + R() * 0.3).toFixed(2) + ')'; x.fill(); x.strokeStyle = 'rgba(60,10,20,0.6)'; x.lineWidth = 2; x.stroke();
      x.beginPath(); x.ellipse(sx, sy, L * 0.16, 3.5, 0, 0, TAU); x.fillStyle = 'rgba(90,40,120,0.6)'; x.fill();
    }
    // subendothelium with collagen
    var cg = x.createLinearGradient(0, 30, 0, 150); cg.addColorStop(0, '#a8505a'); cg.addColorStop(1, '#7a2a36');
    x.fillStyle = cg; x.fillRect(0, 30, 1920, 120);
    x.lineCap = 'round';
    for (i = 0; i < 70; i++) {
      var y0 = 42 + R() * 100, ph = R() * TAU, amp = 3 + R() * 5, wl = 60 + R() * 60, x0 = R() * 1920 - 200, len = 300 + R() * 600;
      x.beginPath();
      for (var k = 0; k <= len; k += 10) x.lineTo(x0 + k, y0 + Math.sin(k / wl * TAU + ph) * amp);
      x.strokeStyle = 'rgba(255,226,200,' + (0.22 + R() * 0.25).toFixed(2) + ')'; x.lineWidth = 2 + R() * 3; x.stroke();
    }
    // endothelium
    x.fillStyle = '#e09098'; x.fillRect(0, 0, 1920, 32);
    for (i = 0; i < 16; i++) {
      var ex = i * 130 + (R() - 0.5) * 20;
      x.beginPath(); x.ellipse(ex + 65, 16, 66, 14, 0, 0, TAU); x.fillStyle = 'rgba(240,170,176,0.9)'; x.fill(); x.strokeStyle = 'rgba(140,50,70,0.7)'; x.lineWidth = 2; x.stroke();
      x.beginPath(); x.ellipse(ex + 65 + (R() - 0.5) * 30, 13, 24, 8, 0, 0, TAU); x.fillStyle = 'rgba(130,70,150,0.85)'; x.fill();
    }
    x.fillStyle = 'rgba(255,230,230,0.5)'; x.fillRect(0, 0, 1920, 3);
    x.fillStyle = 'rgba(60,10,20,0.6)'; x.fillRect(0, 30, 1920, 4);
    wallCache[key] = c; return c;
  }
  var clotCache = {};
  function clotData(wallY) {
    var key = wallY | 0; if (clotCache[key]) return clotCache[key];
    var R = rng(1234), xw = 960, G = 110;
    function half(d) { return G * (1 - 0.45 * Math.min(1, d / 240)); }
    var jag = []; for (var i = 0; i <= 40; i++) jag.push([(R() - 0.5) * 18, (R() - 0.5) * 18]);
    var A = [], B = [], k;
    var aDepth = [30, 70, 110, 150, 50, 130];
    for (i = 0; i < aDepth.length; i++) { var d = aDepth[i], sgn = i % 2 ? 1 : -1; A.push({ x: xw + sgn * (half(d) - 18), y: wallY + d, d: 0.13 + i * 0.03, rot: R() * 6, v: i & 3 }); }
    A.push({ x: xw - G - 20, y: wallY - 6, d: 0.29, rot: 1, v: 1 }, { x: xw + G + 22, y: wallY - 6, d: 0.31, rot: 2, v: 2 });
    var tries = 0;
    while (B.length < 52 && tries++ < 8000) {
      var px = xw + (R() - 0.5) * 2 * G * 1.6, py = wallY - 100 + R() * 270, inside = false;
      if (py >= wallY) { var dd = py - wallY; inside = dd < 175 && Math.abs(px - xw) < half(dd) - 14; }
      else { var ex2 = (px - xw) / (G * 1.5), ey2 = (py - wallY) / 92; inside = ex2 * ex2 + ey2 * ey2 < 1; }
      if (!inside) continue;
      var ok = true; for (k = 0; k < B.length; k++) if (Math.hypot(B[k].x - px, B[k].y - py) < 27) { ok = false; break; }
      for (k = 0; k < A.length && ok; k++) if (Math.hypot(A[k].x - px, A[k].y - py) < 27) ok = false;
      if (ok) B.push({ x: px, y: py, rot: R() * 6, v: (R() * 4) | 0 });
    }
    B.sort(function (a, b) { return b.y - a.y; });
    for (i = 0; i < B.length; i++) B[i].d = 0.38 + (i / B.length) * 0.28;
    var F = [];
    for (i = 0; i < 38; i++) {
      var a1 = R() * TAU, a2 = a1 + Math.PI * (0.5 + R() * 0.9);
      var rx = G * 2.3, ry = 150, ccy = wallY - 20;
      F.push({ x0: xw + Math.cos(a1) * rx * (0.5 + R() * 0.5), y0: ccy + Math.sin(a1) * ry * (0.5 + R() * 0.5), x1: xw + Math.cos(a2) * rx * (0.5 + R() * 0.5), y1: ccy + Math.sin(a2) * ry * (0.5 + R() * 0.5) + 30, bend: (R() - 0.5) * 120, d: 0.68 + R() * 0.18, w: 2 + R() * 2 });
    }
    var T = [];
    var trapPos = [[-210, -70], [-120, -120], [0, -150], [120, -125], [215, -60], [-60, -95], [70, -90], [-260, -10], [270, 0], [-160, -30], [170, -20]];
    for (i = 0; i < trapPos.length; i++) T.push({ x: xw + trapPos[i][0], y: wallY + trapPos[i][1], d: 0.72 + i * 0.018, tx: (R() - 0.5) * 1.4, ty: (R() - 0.5) * 1.4, rot: R() * 6 });
    clotCache[key] = { xw: xw, G: G, half: half, jag: jag, A: A, B: B, F: F, T: T };
    return clotCache[key];
  }
  function activatedPlatelet(ctx, x, y, r, rot, v, act, t, glow) {
    var w = Wd();
    if (act > 0.01) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.lineCap = 'round';
      for (var i = 0; i < 7; i++) {
        var a = (i / 7) * TAU + v, L = r * (1.1 + 0.9 * act * (0.7 + 0.3 * Math.sin(i * 3.1 + v)));
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.4); ctx.quadraticCurveTo(Math.cos(a + 0.2) * L * 0.7, Math.sin(a + 0.2) * L * 0.7, Math.cos(a) * L, Math.sin(a) * L);
        ctx.strokeStyle = 'rgba(150,60,70,0.85)'; ctx.lineWidth = r * 0.3; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,214,190,0.95)'; ctx.lineWidth = r * 0.17; ctx.stroke();
      }
      ctx.restore();
    }
    if (glow > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, x, y, r * 3, [255, 220, 140], glow); ctx.restore(); }
    if (w) w.drawPlatelet(ctx, { x: x, y: y, r: r * (1 + 0.1 * act), rot: rot, variant: v });
    else { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#f0b490'; ctx.fill(); }
  }
  /**
   * woundAndClot(ctx, {x=960, y=540, scale=1, p, t, alpha=1, labels=true, steps=labels, bg=true, flow=true, wallY=780})
   * Side view of a vessel wall (endothelium / collagen-rich subendothelium / smooth-muscle media) tearing open,
   * then primary and secondary hemostasis. Drawn in a 1920×1080 local frame (x,y = its centre; defaults fill the
   * frame, so labels:false + bg:true makes it a background plate for character shots: stand them on groundY).
   * Returns {groundY, woundX, woundY} in canvas px.
   * p stages:
   *   0.00–0.12  wall tears, collagen exposed (glow), RBCs start leaking out through the gap (until ~0.6)
   *   0.12–0.34  platelets arrive and ADHERE to the exposed collagen, change shape (pseudopods)  血小板の粘着
   *   0.33–0.52  RELEASE: adhered platelets pulse, ADP etc. particles spread                     ADPなどを放出
   *   0.38–0.70  AGGREGATION: more platelets pile up into a primary plug filling the gap         凝集（一次血栓）
   *   0.66–0.90  fibrinogen dashes convert; FIBRIN threads weave a mesh over the plug            フィブリン
   *   0.72–0.95  passing RBCs are trapped in the mesh → stable clot (血餅); leakage stopped
   */
  function woundAndClot(ctx, o) {
    o = o || {};
    var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, sc = o.scale || 1, alpha = o.alpha == null ? 1 : o.alpha;
    var wallY = o.wallY || 780, labels = o.labels !== false, w = Wd();
    var X = o.x == null ? 960 : o.x, Y = o.y == null ? 540 : o.y;
    var res = { groundY: Y + (wallY - 540) * sc, woundX: X, woundY: Y + (wallY - 540) * sc };
    if (alpha <= 0.003) return res;
    var Cd = clotData(wallY), xw = Cd.xw, gOpen = smooth(0, 0.1, p), G = Cd.G * gOpen, i, k;
    ctx.save(); ctx.translate(X - 960 * sc, Y - 540 * sc); ctx.scale(sc, sc); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.rect(0, 0, 1920, 1080); ctx.clip();
    var hb = heartbeat(t);
    if (o.bg !== false) {
      var lg = ctx.createLinearGradient(0, 0, 0, wallY);
      lg.addColorStop(0, '#2a0409'); lg.addColorStop(0.5, '#6a1220'); lg.addColorStop(1, '#8a2030');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, 1920, wallY);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var hz = ctx.createLinearGradient(0, wallY * 0.3, 0, wallY); hz.addColorStop(0, 'rgba(255,120,110,0)'); hz.addColorStop(1, 'rgba(255,120,110,' + (0.08 + 0.06 * hb).toFixed(3) + ')');
      ctx.fillStyle = hz; ctx.fillRect(0, 0, 1920, wallY); ctx.restore();
      if (w) w.drawParticles(ctx, { t: t, seed: 31, count: 50, x: 0, y: 0, w: 1920, h: wallY, vx: 60, vy: 0, size: 2.5, alpha: 0.35 });
    }
    // far flow (small, faint)
    if (o.flow !== false && w) {
      for (i = 0; i < 16; i++) {
        var Rf = rng(70 + i), fx = mod(Rf() * 2300 + t * (120 + Rf() * 80), 2300) - 190, fy = 60 + Rf() * (wallY - 200);
        if (Rf() < 0.7) w.drawRBC(ctx, { x: fx, y: fy, r: 16 + Rf() * 8, tiltX: 0.6 + Rf(), tiltY: t * 0.5 + Rf() * 6, alpha: 0.45, fog: 0.5, fogColor: '#6a1220' });
        else w.drawPlatelet(ctx, { x: fx, y: fy, r: 6, rot: t + i, alpha: 0.5 });
      }
    }
    // wall
    ctx.drawImage(wallTile(wallY), 0, wallY);
    // gap
    var exposed = smooth(0.03, 0.14, p) * (1 - 0.6 * smooth(0.6, 0.95, p));
    if (G > 0.5) {
      var Lp = [], Rp = [];
      for (k = 0; k <= 30; k++) { var d = (k / 30) * (1080 - wallY + 20), hw = Cd.half(d) * gOpen, j = Cd.jag[k]; Lp.push([xw - hw + j[0] * gOpen, wallY + d]); Rp.push([xw + hw + j[1] * gOpen, wallY + d]); }
      ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]); for (k = 1; k < Lp.length; k++) ctx.lineTo(Lp[k][0], Lp[k][1]);
      for (k = Rp.length - 1; k >= 0; k--) ctx.lineTo(Rp[k][0], Rp[k][1]); ctx.closePath();
      var gg = ctx.createLinearGradient(0, wallY, 0, 1080); gg.addColorStop(0, '#3a060e'); gg.addColorStop(1, '#0e0204');
      ctx.fillStyle = gg; ctx.fill();
      ctx.strokeStyle = 'rgba(40,0,8,0.9)'; ctx.lineWidth = 4; ctx.stroke();
      // exposed collagen: glowing torn fiber ends along the gap walls in the subendothelial band
      if (exposed > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (k = 0; k < 18; k++) {
          var Rk = rng(400 + k), dd = 38 + Rk() * 105, side = k % 2 ? 1 : -1, hx = xw + side * Cd.half(dd) * gOpen, ln = 14 + Rk() * 26;
          ctx.beginPath(); ctx.moveTo(hx - side * 30, wallY + dd); ctx.quadraticCurveTo(hx, wallY + dd + (Rk() - 0.5) * 10, hx - side * ln * -1, wallY + dd + (Rk() - 0.5) * 16);
          ctx.strokeStyle = 'rgba(255,236,190,' + (0.75 * exposed).toFixed(3) + ')'; ctx.lineWidth = 3 + Rk() * 2; ctx.stroke();
        }
        var eg = ctx.createRadialGradient(xw, wallY + 90, 10, xw, wallY + 90, 220);
        eg.addColorStop(0, 'rgba(255,220,160,' + (0.22 * exposed).toFixed(3) + ')'); eg.addColorStop(1, 'rgba(255,220,160,0)');
        ctx.fillStyle = eg; ctx.fillRect(xw - 240, wallY - 130, 480, 440);
        ctx.restore();
      }
    }
    // leaking RBCs
    var leak = smooth(0.03, 0.1, p) * (1 - smooth(0.42, 0.66, p));
    if (w && leak > 0.01) {
      for (i = 0; i < 14; i++) {
        var Rl = rng(150 + i), u = mod(t * 0.45 + Rl(), 1), sx = xw - 380 - Rl() * 300, sy = wallY - 120 - Rl() * 120;
        var mx = xw + (Rl() - 0.5) * 30, my = wallY + 40, ex = xw + (Rl() - 0.5) * 60, ey = 1160;
        var a = 1 - u, bx2, by2;
        if (u < 0.5) { var v2 = u / 0.5; bx2 = lerp(lerp(sx, xw - 60, v2), lerp(xw - 60, mx, v2), v2); by2 = lerp(lerp(sy, wallY - 40, v2), lerp(wallY - 40, my, v2), v2); }
        else { var v3 = (u - 0.5) / 0.5; bx2 = lerp(mx, ex, v3); by2 = lerp(my, ey, v3 * v3); }
        w.drawRBC(ctx, { x: bx2, y: by2, r: 30, tiltX: 0.5 + Rl() * 0.8, tiltY: u * 6 + i, alpha: leak * smooth(0, 0.1, u) * (a > 0 ? 1 : 0), deform: u > 0.45 && u < 0.6 ? 0.3 : 0 });
      }
    }
    // platelets: adhesion set (A) and aggregation set (B)
    var relA = bell(p, 0.33, 0.38, 0.5, 0.6);
    function arrive(P, travel) {
      var u = easeOut(win(p, P.d - travel, P.d));
      if (u <= 0) return null;
      var sx2 = P.x - 560 - (P.rot * 37) % 260, sy2 = wallY - 160 - (P.rot * 53) % 200;
      var c1x = P.x - 160, c1y = sy2;
      return [lerp(lerp(sx2, c1x, u), lerp(c1x, P.x, u), u), lerp(lerp(sy2, c1y, u), lerp(c1y, P.y, u), u), u];
    }
    for (i = 0; i < Cd.A.length; i++) {
      var P = Cd.A[i], q = arrive(P, 0.1); if (!q) continue;
      var act = smooth(P.d, P.d + 0.05, p), pl = relA * (0.5 + 0.5 * Math.sin(t * 7 + i * 1.7));
      activatedPlatelet(ctx, q[0], q[1], 15, P.rot + t * 0.2 * (1 - act), P.v, act, t, 0.6 * pl);
      if (relA > 0.01) { var ph = mod(t * 1.3 + i * 0.37, 1); ctx.beginPath(); ctx.arc(q[0], q[1], 15 + 60 * ph, 0, TAU); ctx.strokeStyle = 'rgba(255,230,150,' + (relA * 0.6 * (1 - ph)).toFixed(3) + ')'; ctx.lineWidth = 3; ctx.stroke(); }
    }
    for (i = 0; i < Cd.B.length; i++) {
      P = Cd.B[i]; q = arrive(P, 0.08); if (!q) continue;
      act = smooth(P.d, P.d + 0.04, p);
      activatedPlatelet(ctx, q[0], q[1], 15, P.rot, P.v, act, t, 0.3 * relA);
    }
    // ADP / release particles
    if (relA > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < 40; i++) {
        var Ra = rng(260 + i), age = mod(t * 0.6 + Ra(), 1), src = Cd.A[i % Cd.A.length], ang = -Math.PI / 2 + (Ra() - 0.5) * 2.6;
        var dist = 20 + age * (160 + Ra() * 160);
        glowDot(ctx, src.x + Math.cos(ang) * dist + age * 60, src.y + Math.sin(ang) * dist, 6 + Ra() * 5, [255, 230, 120], relA * (1 - age) * 0.9);
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= relA; ctx.font = font(22); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      for (i = 0; i < 3; i++) { var Rt = rng(990 + i), age2 = mod(t * 0.35 + i / 3, 1), tx = xw - 120 + i * 120 + age2 * 50, ty = wallY - 40 - age2 * 200; ctx.globalAlpha = alpha * relA * Math.sin(age2 * Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,20,0,0.9)'; ctx.strokeText('ADP', tx, ty); ctx.fillStyle = '#ffe9a0'; ctx.fillText('ADP', tx, ty); Rt = null; }
      ctx.restore();
    }
    // plug outline glow
    var plugG = bell(p, 0.6, 0.66, 0.7, 0.8);
    if (plugG > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.ellipse(xw, wallY, Cd.G * 1.6, 100, 0, Math.PI, TAU); ctx.strokeStyle = 'rgba(255,220,180,' + (0.6 * plugG).toFixed(3) + ')'; ctx.lineWidth = 5; ctx.stroke(); ctx.restore(); }
    // fibrinogen dashes
    var fbg = bell(p, 0.6, 0.66, 0.78, 0.86);
    if (fbg > 0.01) {
      ctx.save(); ctx.lineCap = 'round';
      for (i = 0; i < 40; i++) {
        var Rg = rng(330 + i), gx = xw + (Rg() - 0.5) * 900, gy = wallY - 40 - Rg() * 320, pull = smooth(0.66, 0.84, p);
        gx = lerp(gx + Math.sin(t + i) * 10, xw + (gx - xw) * 0.35, pull); gy = lerp(gy, wallY - 60 + (gy - wallY) * 0.3, pull);
        var gl = 10 + pull * 22, ga = Rg() * 3 + t * 0.5;
        ctx.beginPath(); ctx.moveTo(gx - Math.cos(ga) * gl / 2, gy - Math.sin(ga) * gl / 2); ctx.lineTo(gx + Math.cos(ga) * gl / 2, gy + Math.sin(ga) * gl / 2);
        ctx.strokeStyle = 'rgba(255,240,170,' + (0.8 * fbg).toFixed(3) + ')'; ctx.lineWidth = 4; ctx.stroke();
      }
      ctx.restore();
    }
    // trapped RBCs
    if (w) for (i = 0; i < Cd.T.length; i++) {
      var Tq = Cd.T[i], ut = easeOut(win(p, Tq.d - 0.08, Tq.d)); if (ut <= 0) continue;
      var tsx = Tq.x - 500 + i * 13, tsy = Tq.y - 120;
      w.drawRBC(ctx, { x: lerp(tsx, Tq.x, ut), y: lerp(tsy, Tq.y, ut) + Math.sin(t * 2 + i) * 2 * (1 - ut), r: 36, tiltX: Tq.tx, tiltY: Tq.ty + (1 - ut) * 3, rot: Tq.rot, alpha: smooth(0, 0.3, ut) });
    }
    // fibrin threads
    var anyF = false;
    ctx.save(); ctx.lineCap = 'round';
    for (i = 0; i < Cd.F.length; i++) {
      var Fq = Cd.F[i], fp = smooth(Fq.d, Fq.d + 0.1, p); if (fp <= 0) continue; anyF = true;
      var cxp = (Fq.x0 + Fq.x1) / 2 - (Fq.y1 - Fq.y0) * Fq.bend / 400, cyp = (Fq.y0 + Fq.y1) / 2 + (Fq.x1 - Fq.x0) * Fq.bend / 400;
      ctx.beginPath();
      for (k = 0; k <= 24; k++) { var s = (k / 24) * fp, a1 = (1 - s) * (1 - s), b1 = 2 * s * (1 - s), c1 = s * s; var px = a1 * Fq.x0 + b1 * cxp + c1 * Fq.x1 + Math.sin(s * 20 + i) * 3, py = a1 * Fq.y0 + b1 * cyp + c1 * Fq.y1; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.strokeStyle = 'rgba(80,40,20,0.55)'; ctx.lineWidth = Fq.w + 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,244,210,0.92)'; ctx.lineWidth = Fq.w; ctx.stroke();
      if (fp < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, px, py, 14, [255, 240, 180], 0.9); ctx.restore(); }
    }
    ctx.restore();
    // front flow (upper lumen)
    if (o.flow !== false && w) {
      for (i = 0; i < 9; i++) {
        var Rq = rng(520 + i), qx = mod(Rq() * 2400 + t * (240 + Rq() * 120), 2400) - 240, qy = 70 + Rq() * (wallY - 380);
        if (i % 3 === 2) w.drawPlatelet(ctx, { x: qx, y: qy, r: 14, rot: t * 1.5 + i });
        else w.drawRBC(ctx, { x: qx, y: qy, r: 36 + Rq() * 10, tiltX: 0.4 + Rq() * 0.9, tiltY: t * (0.6 + Rq()) + i, blur: 10, blurAngle: 0 });
      }
    }
    // labels
    if (labels) {
      var ac = [255, 200, 170];
      tag(ctx, 'コラーゲンが露出', 300, wallY - 330, { grow: win(p, 0.05, 0.12), alpha: 1 - smooth(0.18, 0.22, p), tx: xw - Cd.G * 0.95, ty: wallY + 80, accent: [255, 230, 170], sub: '血管の壁が傷ついた' });
      tag(ctx, '血小板の粘着', 1320, wallY - 330, { grow: win(p, 0.17, 0.25), alpha: 1 - smooth(0.4, 0.44, p), tx: Cd.A[0].x, ty: Cd.A[0].y, accent: ac, size: 44, sub: '露出したコラーゲンにくっつく' });
      tag(ctx, 'ADPなどを放出', 1320, wallY - 330, { grow: win(p, 0.44, 0.48), alpha: 1 - smooth(0.54, 0.57, p), tx: xw + 30, ty: wallY - 20, accent: [255, 230, 120], size: 44, sub: '仲間の血小板を呼び寄せる' });
      tag(ctx, '凝集（一次血栓）', 300, wallY - 330, { grow: win(p, 0.52, 0.6), alpha: 1 - smooth(0.76, 0.8, p), tx: xw - 40, ty: wallY - 70, accent: ac, size: 44, sub: '血小板が集まって穴をふさぐ' });
      var f0 = Cd.F[3];
      tag(ctx, 'フィブリン', 1320, wallY - 330, { grow: win(p, 0.7, 0.78), tx: (f0.x0 + f0.x1) / 2, ty: (f0.y0 + f0.y1) / 2, accent: [255, 240, 180], size: 48, sub: 'フィブリノゲン → フィブリン（トロンビン）' });
      tag(ctx, '血球をからめ取る → 血餅', 300, wallY - 330, { grow: win(p, 0.84, 0.92), tx: Cd.T[1].x, ty: Cd.T[1].y, accent: [255, 150, 150], size: 40, sub: '安定した血栓' });
    }
    if (o.steps == null ? labels : o.steps) {
      var stp = p < 0.12 ? 0 : p < 0.33 ? 1 : p < 0.45 ? 2 : p < 0.68 ? 3 : 4;
      stepper(ctx, ['損傷', '粘着', '放出', '凝集', 'フィブリン網'], 960, 70, stp, { size: 28, accent: [255, 190, 160] });
    }
    ctx.restore();
    return res;
  }

  /* ========================================================= BODY PULLBACK */
  function crSample(pts, n, closed) {
    var out = [], N = pts.length, segs = closed ? N : N - 1;
    function P(i) { return closed ? pts[mod(i, N)] : pts[clamp(i, 0, N - 1)]; }
    for (var i = 0; i < segs; i++) {
      var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (var k = 0; k < n; k++) {
        var s = k / n, s2 = s * s, s3 = s2 * s;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3)]);
      }
    }
    if (!closed) out.push(pts[N - 1]);
    return out;
  }
  function mkPath(pts, wdt, kind, n) {
    var s = crSample(pts, n || 10, false), L = [0], bb = [1e9, 1e9, -1e9, -1e9];
    for (var i = 0; i < s.length; i++) {
      if (i) L.push(L[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
      bb[0] = Math.min(bb[0], s[i][0]); bb[1] = Math.min(bb[1], s[i][1]); bb[2] = Math.max(bb[2], s[i][0]); bb[3] = Math.max(bb[3], s[i][1]);
    }
    return { s: s, L: L, len: L[L.length - 1], w: wdt, kind: kind, bb: bb };
  }
  function pathAt(P, d) {
    d = clamp(d, 0, P.len);
    var lo = 0, hi = P.L.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (P.L[m] < d) lo = m; else hi = m; }
    var f = (d - P.L[lo]) / Math.max(1e-6, P.L[hi] - P.L[lo]);
    return [lerp(P.s[lo][0], P.s[hi][0], f), lerp(P.s[lo][1], P.s[hi][1], f)];
  }
  var BODY = null;
  function bodyData() {
    if (BODY) return BODY;
    var half = [];
    for (var i = 0; i <= 10; i++) { var a = -Math.PI / 2 + (i / 10) * 1.6; half.push([50 * Math.cos(a), -405 + 64 * Math.sin(a)]); }
    half = half.concat([[24, -338], [30, -318], [70, -304], [112, -290], [132, -262], [146, -200], [160, -120], [174, -60], [190, 10], [204, 70], [218, 104], [214, 140], [198, 144], [188, 108], [180, 74], [162, 4], [146, -66], [132, -146], [116, -212],
      [110, -150], [98, -60], [118, 20], [124, 80], [116, 170], [98, 270], [102, 330], [84, 420], [100, 452], [94, 470], [34, 470], [40, 430], [36, 330], [28, 262], [16, 150], [0, 98]]);
    var full = half.slice(); for (i = half.length - 2; i >= 1; i--) full.push([-half[i][0], half[i][1]]);
    var sil = crSample(full, 5, true);
    var art = [], vein = [];
    function both(pts, w, kind, mirror) { var P = mkPath(pts, w, kind); (kind === 'a' ? art : vein).push(P); if (mirror) { var Q = mkPath(pts.map(function (q) { return [-q[0], q[1]]; }), w, kind); (kind === 'a' ? art : vein).push(Q); } return P; }
    both([[14, -222], [10, -262], [-2, -268], [-12, -252], [-10, -200], [-6, -120], [-3, -40], [0, 30]], 6.5, 'a');
    both([[0, 30], [28, 60], [52, 110], [60, 180], [62, 260], [70, 340], [74, 420], [88, 455]], 4.2, 'a', true);
    both([[4, -266], [14, -300], [20, -340], [24, -380], [22, -420], [8, -446]], 3, 'a', true);
    var arm = both([[6, -268], [50, -282], [100, -280], [132, -250], [148, -180], [160, -100], [176, -40], [196, 60], [206, 108]], 3, 'a');
    both([[-8, -262], [-50, -282], [-100, -280], [-132, -250], [-148, -180], [-160, -100], [-176, -40], [-196, 60], [-206, 108]], 3, 'a');
    both([[-4, -80], [-40, -86], [-52, -96]], 2, 'a', true);
    both([[-5, -120], [20, -105], [40, -70], [30, -30]], 1.8, 'a');
    // veins
    both([[28, -212], [18, -250], [18, -270]], 6, 'v');
    both([[28, -200], [16, -150], [12, -40], [10, 32]], 6, 'v');
    both([[10, 32], [-14, 62], [-40, 110], [-48, 180], [-50, 260], [-58, 340], [-62, 420], [-76, 455]], 4, 'v', true);
    both([[18, -270], [24, -300], [30, -340], [34, -380], [30, -420]], 3, 'v', true);
    both([[18, -268], [56, -292], [104, -292], [140, -256], [158, -184], [170, -104], [188, -44], [208, 56], [216, 104]], 2.8, 'v', true);
    // twigs
    var twigs = [], R = rng(2024);
    art.concat(vein).forEach(function (P) {
      for (var d = 30; d < P.len - 10; d += 26 + R() * 20) {
        var a0 = pathAt(P, d), a1 = pathAt(P, d + 2), dir = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), side = R() < 0.5 ? -1 : 1;
        var ang = dir + side * (0.6 + R() * 0.6), len = 14 + R() * 26, pts = [a0], cx = a0[0], cy = a0[1];
        for (var k = 0; k < 3; k++) { ang += (R() - 0.5) * 0.6; cx += Math.cos(ang) * len / 3; cy += Math.sin(ang) * len / 3; pts.push([cx, cy]); }
        if (inSil(sil, cx, cy)) twigs.push({ P: mkPath(pts, 1.1, P.kind, 4) });
      }
    });
    // focus point on the forearm artery (radial)
    var bestD = 0, bd = 1e9; for (var dd0 = 0; dd0 < arm.len; dd0 += 0.5) { var pq = pathAt(arm, dd0), dq = Math.hypot(pq[0] - 186, pq[1] - 10); if (dq < bd) { bd = dq; bestD = dd0; } }
    var F = pathAt(arm, bestD), f1 = pathAt(arm, bestD - 1), f2 = pathAt(arm, bestD + 1), dF = Math.atan2(f2[1] - f1[1], f2[0] - f1[0]);
    // micro network (arterioles → capillaries → venules) around F
    var k, micro = [], Rm = rng(77), ux = Math.cos(dF), uy = Math.sin(dF), nx = -uy, ny = ux;
    for (var s = -42; s <= 42; s += 5.5) {
      var side2 = (Math.round(s / 5.5) % 2) ? 1 : -1, bx = F[0] + ux * s, by = F[1] + uy * s, pts2 = [[bx + nx * side2 * 1.4, by + ny * side2 * 1.4]], cx2 = pts2[0][0], cy2 = pts2[0][1];
      var a2 = Math.atan2(ny * side2, nx * side2) + (Rm() - 0.5) * 0.5;
      for (k = 0; k < 7; k++) { a2 += (Rm() - 0.5) * 0.9; cx2 += Math.cos(a2) * 2.6; cy2 += Math.sin(a2) * 2.6; pts2.push([cx2, cy2]); }
      micro.push({ P: mkPath(pts2, 0.45, 'c', 4) });
      var ex = cx2, ey = cy2;
      for (var b = 0; b < 2; b++) { var p3 = [[ex, ey]], a3 = a2 + (b ? 0.7 : -0.7), qx = ex, qy = ey; for (k = 0; k < 5; k++) { a3 += (Rm() - 0.5) * 1.1; qx += Math.cos(a3) * 2.2; qy += Math.sin(a3) * 2.2; p3.push([qx, qy]); } micro.push({ P: mkPath(p3, 0.4, b ? 'v' : 'c', 4) }); }
    }
    // tissue cells
    var cells = [];
    for (var gy = -46; gy <= 46; gy += 3.1) for (var gx = -46; gx <= 46; gx += 3.4) {
      var ox = gx + ((Math.round(gy / 3.1) % 2) ? 1.7 : 0), ccx = F[0] + ox + (Rm() - 0.5) * 0.8, ccy = F[1] + gy + (Rm() - 0.5) * 0.8;
      var dl = Math.abs((ccx - F[0]) * nx + (ccy - F[1]) * ny), rr = Math.hypot(ox, gy);
      if (dl < 2.7 || rr > 46) continue;
      cells.push([ccx, ccy, 1.35 + Rm() * 0.3, 1.1 + Rm() * 0.25, Rm() * 3, rr]);
    }
    // RBCs in the focus vessel
    var rbcs = [], Rr = rng(99);
    for (i = 0; i < 260; i++) rbcs.push([Rr() * 90 - 45, (Rr() - 0.5) * 2.0, Rr() * 6, Rr() * 6, 0.9 + Rr() * 0.3]);
    var strip = []; for (var sd = -60; sd <= 60; sd += 1.5) strip.push(pathAt(arm, bestD + sd));
    BODY = { sil: sil, art: art, vein: vein, twigs: twigs, micro: micro, cells: cells, rbcs: rbcs, F: F, dF: dF, arm: arm, strip: strip, heart: [20, -212] };
    return BODY;
  }
  function inSil(sil, x, y) {
    var c = false;
    for (var i = 0, j = sil.length - 1; i < sil.length; j = i++) { var a = sil[i], b = sil[j]; if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c; }
    return c;
  }
  /**
   * bodyPullback(ctx, {p, t, alpha=1, Z0=500, x=W/2, y=H/2, scale=1})
   * Final pull-back (#36): full-frame. p 0..1 = continuous log-zoom from inside a forearm artery to the whole
   * body. Original stylised human silhouette (front view) glowing on a dark background, arteries red / veins
   * blue with flowing light pulses, pulsing heart, faint lungs.
   * p stages (ease in-out on log zoom, Z0 → 1; the view also un-rotates so the flow starts left→right):
   *   0.00–0.15  inside the artery: lumen light band, RBCs streaming → (Z≈500)
   *   0.15–0.40  vessel walls come into view, tissue cells around the vessel
   *   0.35–0.60  capillary bed (arterioles → capillaries → venules), small branches
   *   0.55–0.80  the arm's vessel tree and the body outline fade in
   *   0.80–1.00  full body: heart pulses, pulses of light run out along arteries and back along veins (hold)
   * x,y,scale place the final body (default centred, body height ≈ 940 px).
   */
  function bodyPullback(ctx, o) {
    o = o || {};
    var Wc = ctx.canvas.width, Hc = ctx.canvas.height, p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0, alpha = o.alpha == null ? 1 : o.alpha;
    if (alpha <= 0.003) return;
    var B = bodyData(), w = Wd(), F = B.F, i, k;
    var e = easeInOut(p), Z0 = o.Z0 || 500, lz0 = Math.log(Z0) / Math.LN10, lz = lz0 * (1 - e), Z = Math.pow(10, lz) * (o.scale || 1);
    var rot = -B.dF * (1 - smooth(0.12, 0.85, p));
    var cxF = o.x == null ? Wc / 2 : o.x, cyF = o.y == null ? Hc / 2 : o.y, mv = smooth(0.15, 1, p);
    var Sx = lerp(Wc / 2, cxF + F[0] * (o.scale || 1), mv), Sy = lerp(Hc / 2, cyF + F[1] * (o.scale || 1), mv);
    var cr = Math.cos(rot), sr = Math.sin(rot);
    function toS(x, y) { var dx = (x - F[0]) * Z, dy = (y - F[1]) * Z; return [Sx + dx * cr - dy * sr, Sy + dx * sr + dy * cr]; }
    function setT() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(Sx, Sy); ctx.rotate(rot); ctx.scale(Z, Z); ctx.translate(-F[0], -F[1]); }
    var base = ctx.getTransform();
    // view rect in world (for culling)
    var corners = [[0, 0], [Wc, 0], [0, Hc], [Wc, Hc]].map(function (c) { var dx = c[0] - Sx, dy = c[1] - Sy; return [F[0] + (dx * cr + dy * sr) / Z, F[1] + (-dx * sr + dy * cr) / Z]; });
    var vb = [Math.min.apply(null, corners.map(function (c) { return c[0]; })), Math.min.apply(null, corners.map(function (c) { return c[1]; })), Math.max.apply(null, corners.map(function (c) { return c[0]; })), Math.max.apply(null, corners.map(function (c) { return c[1]; }))];
    function vis(bb, m) { return !(bb[2] + m < vb[0] || bb[0] - m > vb[2] || bb[3] + m < vb[1] || bb[1] - m > vb[3]); }
    var hb = heartbeat(t, 66);
    ctx.save(); ctx.globalAlpha *= alpha;
    // background
    var bg = ctx.createRadialGradient(Wc / 2, Hc / 2, 50, Wc / 2, Hc / 2, Wc * 0.7);
    var warm = smooth(1.2, 2.2, lz);
    bg.addColorStop(0, rgba(mixC([22, 12, 40], [90, 16, 30], warm), 1)); bg.addColorStop(1, rgba(mixC([4, 3, 12], [30, 4, 10], warm), 1));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, Wc, Hc);
    var aSil = 1 - smooth(0.7, 1.3, lz), aTw = 1 - smooth(1.1, 1.7, lz), aMic = smooth(0.3, 0.8, lz) * (1 - smooth(1.6, 2.0, lz));
    var aTis = smooth(0.8, 1.3, lz) * (1 - smooth(2.25, 2.55, lz)), aRbc = smooth(1.15, 1.6, lz), aPulse = 1 - smooth(0.9, 1.4, lz);
    // silhouette (fill)
    setT();
    if (aSil > 0.01) {
      ctx.beginPath(); ctx.moveTo(B.sil[0][0], B.sil[0][1]); for (i = 1; i < B.sil.length; i++) ctx.lineTo(B.sil[i][0], B.sil[i][1]); ctx.closePath();
      var sg = ctx.createRadialGradient(B.heart[0], B.heart[1], 10, 0, 0, 560);
      sg.addColorStop(0, 'rgba(120,60,140,' + (0.42 * aSil).toFixed(3) + ')'); sg.addColorStop(0.5, 'rgba(50,40,110,' + (0.32 * aSil).toFixed(3) + ')'); sg.addColorStop(1, 'rgba(20,30,80,' + (0.28 * aSil).toFixed(3) + ')');
      ctx.fillStyle = sg; ctx.fill();
      // lungs + brain hints
      ctx.fillStyle = 'rgba(140,180,255,' + (0.07 * aSil).toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(-46, -212, 34, 62, 0.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(52, -208, 32, 60, -0.1, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -420, 38, 30, 0, 0, TAU); ctx.fillStyle = 'rgba(200,170,255,' + (0.08 * aSil).toFixed(3) + ')'; ctx.fill();
    }
    // tissue cells
    if (aTis > 0.01) {
      ctx.lineWidth = 0.12;
      for (i = 0; i < B.cells.length; i++) {
        var c = B.cells[i]; if (c[0] < vb[0] - 2 || c[0] > vb[2] + 2 || c[1] < vb[1] - 2 || c[1] > vb[3] + 2) continue;
        var ea = aTis * (1 - smooth(30, 46, c[5]));
        ctx.beginPath(); ctx.ellipse(c[0], c[1], c[2], c[3], c[4], 0, TAU);
        ctx.fillStyle = 'rgba(240,150,170,' + (0.14 * ea).toFixed(3) + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(255,190,200,' + (0.4 * ea).toFixed(3) + ')'; ctx.stroke();
        ctx.beginPath(); ctx.arc(c[0] + 0.2, c[1] - 0.1, 0.42, 0, TAU); ctx.fillStyle = 'rgba(150,100,200,' + (0.45 * ea).toFixed(3) + ')'; ctx.fill();
      }
    }
    function strokePath(P, wd, col, a) {
      ctx.beginPath(); ctx.moveTo(P.s[0][0], P.s[0][1]); for (var q = 1; q < P.s.length; q++) ctx.lineTo(P.s[q][0], P.s[q][1]);
      ctx.lineWidth = wd; ctx.strokeStyle = rgba(col, a); ctx.stroke();
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // micro network
    if (aMic > 0.01) {
      for (i = 0; i < B.micro.length; i++) {
        var M = B.micro[i].P; if (!vis(M.bb, 2)) continue;
        var mc = M.kind === 'c' ? [230, 90, 150] : [120, 120, 255];
        strokePath(M, M.w + 0.3, [40, 10, 30], 0.6 * aMic); strokePath(M, M.w, mc, 0.85 * aMic); strokePath(M, M.w * 0.4, mixC(mc, [255, 255, 255], 0.4), 0.6 * aMic);
      }
    }
    // twigs
    if (aTw > 0.01) for (i = 0; i < B.twigs.length; i++) {
      var Tw = B.twigs[i].P; if (!vis(Tw.bb, 3)) continue;
      strokePath(Tw, Math.max(Tw.w, 1.4 / Z), Tw.kind === 'a' ? [230, 70, 90] : [90, 130, 255], 0.55 * aTw);
    }
    // main vessels: glow, wall, lumen, core
    var all = B.vein.concat(B.art);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < all.length; i++) { var P = all[i]; if (!vis(P.bb, P.w * 2)) continue; strokePath(P, P.w * 1.6 + 8 / Z, P.kind === 'a' ? [255, 60, 80] : [70, 120, 255], 0.22 * (0.7 + 0.3 * hb)); }
    ctx.restore();
    for (i = 0; i < all.length; i++) {
      P = all[i]; if (!vis(P.bb, P.w)) continue;
      var A = P.kind === 'a';
      strokePath(P, P.w, A ? [110, 14, 30] : [26, 34, 100], 1);
      strokePath(P, P.w * 0.8, A ? [196, 36, 52] : [56, 80, 190], 1);
      strokePath(P, P.w * 0.45, A ? [240, 96, 96] : [110, 150, 255], 0.75);
      strokePath(P, P.w * 0.15, A ? [255, 190, 170] : [200, 220, 255], 0.35);
    }
    // focus vessel close-up: smooth cylindrical shading across the vessel (replaces the flat stroke bands)
    var aFoc = smooth(1.3, 1.75, lz);
    if (aFoc > 0.01) {
      var st = B.strip, wv = B.arm.w, nx0 = -Math.sin(B.dF), ny0 = Math.cos(B.dF);
      ctx.beginPath();
      for (i = 0; i < st.length; i++) ctx.lineTo(st[i][0] + nx0 * wv * 0.5, st[i][1] + ny0 * wv * 0.5);
      for (i = st.length - 1; i >= 0; i--) ctx.lineTo(st[i][0] - nx0 * wv * 0.5, st[i][1] - ny0 * wv * 0.5);
      ctx.closePath();
      var vg = ctx.createLinearGradient(F[0] - nx0 * wv / 2, F[1] - ny0 * wv / 2, F[0] + nx0 * wv / 2, F[1] + ny0 * wv / 2);
      var pulse = 0.85 + 0.15 * hb;
      vg.addColorStop(0, 'rgb(60,6,16)'); vg.addColorStop(0.07, 'rgb(150,40,56)'); vg.addColorStop(0.1, 'rgb(110,16,30)');
      vg.addColorStop(0.3, rgba([190, 44, 54], 1)); vg.addColorStop(0.5, rgba(mixC([214, 70, 70], [255, 140, 120], pulse - 0.85 + 0.3), 1)); vg.addColorStop(0.7, rgba([180, 40, 52], 1));
      vg.addColorStop(0.9, 'rgb(100,14,28)'); vg.addColorStop(0.93, 'rgb(140,36,52)'); vg.addColorStop(1, 'rgb(50,4,12)');
      ctx.save(); ctx.globalAlpha *= aFoc; ctx.fillStyle = vg; ctx.fill();
      // endothelial cell outlines on the walls
      ctx.lineWidth = 0.012; ctx.strokeStyle = 'rgba(255,170,170,0.25)';
      for (i = 0; i < st.length - 1; i += 2) for (var sdd = -1; sdd <= 1; sdd += 2) {
        var ww = sdd * wv * (0.46 - 0.02 * (i % 4 === 0 ? 1 : 0));
        ctx.beginPath(); ctx.ellipse(st[i][0] + nx0 * ww, st[i][1] + ny0 * ww, 1.4, 0.06, B.dF, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
    // heart
    var aH = 1 - smooth(1.0, 1.6, lz);
    if (aH > 0.01) {
      var hs = 1 + 0.14 * hb, hx = B.heart[0], hy = B.heart[1];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, hx, hy, 70 * (1 + 0.5 * hb), [255, 60, 80], 0.75 * aH); ctx.restore();
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.5); ctx.scale(hs, hs);
      ctx.beginPath(); ctx.moveTo(0, 22); ctx.bezierCurveTo(-30, 2, -24, -24, -6, -18); ctx.bezierCurveTo(0, -16, 2, -10, 2, -8); ctx.bezierCurveTo(6, -20, 30, -20, 24, 2); ctx.bezierCurveTo(20, 12, 8, 18, 0, 22); ctx.closePath();
      var hg = ctx.createRadialGradient(-4, -6, 2, 0, 0, 30); hg.addColorStop(0, 'rgba(255,180,170,' + aH + ')'); hg.addColorStop(1, 'rgba(200,20,50,' + aH + ')');
      ctx.fillStyle = hg; ctx.fill(); ctx.restore();
    }
    // silhouette rim
    if (aSil > 0.01) {
      ctx.beginPath(); ctx.moveTo(B.sil[0][0], B.sil[0][1]); for (i = 1; i < B.sil.length; i++) ctx.lineTo(B.sil[i][0], B.sil[i][1]); ctx.closePath();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 12 / Z; ctx.strokeStyle = 'rgba(140,200,255,' + (0.12 * aSil).toFixed(3) + ')'; ctx.stroke();
      ctx.lineWidth = 2.4 / Z; ctx.strokeStyle = 'rgba(200,230,255,' + (0.7 * aSil).toFixed(3) + ')'; ctx.stroke();
      ctx.restore();
    }
    ctx.setTransform(base);
    // flow pulses (screen space)
    if (aPulse > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < all.length; i++) {
        P = all[i]; A = P.kind === 'a';
        for (var dd = 0; dd < P.len; dd += 55) {
          var pos = mod(dd + (A ? 1 : -1) * t * 90, P.len), q = pathAt(P, A ? pos : P.len - pos), sp = toS(q[0], q[1]);
          glowDot(ctx, sp[0], sp[1], 9 * (P.w / 3 + 0.5), A ? [255, 170, 150] : [150, 190, 255], 0.75 * aPulse);
        }
      }
      ctx.restore();
    }
    // RBCs inside the focus vessel (screen space, real sprites)
    if (w && aRbc > 0.01) {
      var ux = Math.cos(B.dF), uy = Math.sin(B.dF), r0 = 0.24 * Z;
      for (i = 0; i < B.rbcs.length; i++) {
        var rb = B.rbcs[i], s = mod(rb[0] + 45 + t * 1.6 * rb[4], 90) - 45, wx = F[0] + ux * s - uy * rb[1], wy = F[1] + uy * s + ux * rb[1];
        var spp = toS(wx, wy); if (spp[0] < -r0 * 2 || spp[0] > Wc + r0 * 2 || spp[1] < -r0 * 2 || spp[1] > Hc + r0 * 2) continue;
        w.drawRBC(ctx, { x: spp[0], y: spp[1], r: r0 * rb[4], tiltX: 0.5 + rb[2] * 0.15, tiltY: rb[3] + t * 0.8 * rb[4], rot: rb[2], alpha: aRbc * (0.6 + 0.4 * Math.abs(rb[1])), blur: Math.min(r0 * 0.4, 30), blurAngle: rot + B.dF });
      }
    }
    var aPl = smooth(2.1, 2.5, lz);
    if (w && aPl > 0.01) { w.drawParticles(ctx, { t: t, seed: 5, count: 70, size: 3, alpha: 0.5 * aPl, vx: 160, vy: 0 }); }
    if (w) w.drawVignette(ctx, { strength: 0.55 });
    ctx.restore();
  }

  /* ============================================================ VICTORY FX */
  /**
   * victoryFX(ctx, {x=960, y=540, scale=1, p, t, alpha=1, color=[214,180,255], gold=[255,220,140], seed=1})
   * Win burst. Natural radius ≈ 560·scale (rays reach ~900). p stages:
   *   0.00–0.25  white-gold flash at the centre, two shock rings expand
   *   0.05–0.60  light rays fan out and rotate, 80 burst particles fly out with drag
   *   0.15–1.00  sparkles twinkle (4-point stars), slow-floating motes; 0.6–1 everything settles to a soft glow
   */
  function victoryFX(ctx, o) {
    o = o || {};
    var x = o.x == null ? 960 : o.x, y = o.y == null ? 540 : o.y, sc = o.scale || 1, p = clamp(o.p == null ? 0 : o.p, 0, 1), t = o.t || 0;
    var alpha = o.alpha == null ? 1 : o.alpha, col = parseColor(o.color || [214, 180, 255]), gold = parseColor(o.gold || [255, 220, 140]), seed = o.seed || 1;
    if (alpha <= 0.003) return;
    var R = 560 * sc, i;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.globalCompositeOperation = 'lighter';
    var fl = Math.exp(-p * 14) * smooth(0, 0.02, p);
    glowDot(ctx, x, y, R * 1.4, [255, 250, 235], 0.9 * fl);
    glowDot(ctx, x, y, R * (0.5 + 0.2 * Math.sin(t * 3)), gold, 0.35 + 0.25 * (1 - smooth(0.3, 1, p)));
    glowDot(ctx, x, y, R * 1.1, col, 0.25);
    for (var rI = 0; rI < 2; rI++) {
      var rp = win(p, rI * 0.06, 0.3 + rI * 0.1);
      if (rp > 0 && rp < 1) { ctx.beginPath(); ctx.arc(x, y, R * 1.3 * easeOut(rp), 0, TAU); ctx.strokeStyle = rgba(rI ? col : gold, 0.8 * (1 - rp)); ctx.lineWidth = R * 0.05 * (1 - rp) + 2; ctx.stroke(); }
    }
    var ra = smooth(0.02, 0.1, p) * (1 - 0.65 * smooth(0.5, 1, p));
    for (i = 0; i < 18; i++) {
      var Rr = rng(seed * 101 + i), a = (i / 18) * TAU + t * 0.15 + Rr() * 0.2, wd = 0.03 + Rr() * 0.05, L = R * (1.1 + Rr() * 0.6) * (0.4 + 0.6 * easeOut(win(p, 0, 0.3)));
      var gg = ctx.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
      gg.addColorStop(0, rgba(i % 3 ? gold : col, 0.5 * ra * (0.6 + 0.4 * Math.sin(t * 2 + i)))); gg.addColorStop(1, rgba(gold, 0));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - wd) * L, y + Math.sin(a - wd) * L); ctx.lineTo(x + Math.cos(a + wd) * L, y + Math.sin(a + wd) * L); ctx.closePath(); ctx.fill();
    }
    for (i = 0; i < 80; i++) {
      var Rb = rng(seed * 313 + i), ang = Rb() * TAU, v = 0.4 + Rb() * 0.9, tau = win(p, 0.02, 0.7), d = R * v * (1 - Math.exp(-tau * 5)) / (1 - Math.exp(-5));
      var pa = (1 - smooth(0.35 + Rb() * 0.3, 0.75 + Rb() * 0.25, p)) * smooth(0.02, 0.05, p);
      var px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d + tau * tau * 40 * sc;
      if (Rb() < 0.3) sparkle(ctx, px, py, (8 + Rb() * 10) * sc, Rb() < 0.5 ? gold : col, pa, t * 2 + i);
      else glowDot(ctx, px, py, (6 + Rb() * 10) * sc, Rb() < 0.6 ? gold : col, pa);
    }
    var sa = smooth(0.15, 0.3, p);
    for (i = 0; i < 26; i++) {
      var Rs = rng(seed * 717 + i), sx = x + (Rs() - 0.5) * R * 2.6, sy = y + (Rs() - 0.5) * R * 1.6 - mod(t * 20 * (0.5 + Rs()), 80) * sc;
      var tw = Math.pow(Math.max(0, Math.sin(t * (2 + Rs() * 3) + i * 1.7)), 4);
      sparkle(ctx, sx, sy, (10 + Rs() * 16) * sc, Rs() < 0.5 ? [255, 255, 240] : col, sa * tw, 0);
    }
    ctx.restore();
  }

  /* ================================================================ export */
  var SIZE_WBC = {
    bacterium: '≈2.0·size × 1.1·size (size = body length, default 320)', phagocytosis: [1240, 940], engulfFX: '≈2.8·radius square',
    wbcLineup: [1720, 760], neutrophilCard: [1400, 820], allyCards: [780, 300], woundAndClot: [1920, 1080], bodyPullback: [1920, 1080], victoryFX: '≈1120·scale (rays to ~1800)'
  };
  var api = {
    bacterium: bacterium, phagocytosis: phagocytosis, engulfFX: engulfFX, wbcLineup: wbcLineup, neutrophilCard: neutrophilCard,
    allyCards: allyCards, woundAndClot: woundAndClot, bodyPullback: bodyPullback, victoryFX: victoryFX,
    wbcCell: wbcCell, wbcCellAnchors: wbcCellAnchors, wbcBackdrop: wbcBackdrop, wbcTag: tag, wbcChip: chip, wbcStepper: stepper,
    WBC_TYPES: TYPES, SIZE_WBC: SIZE_WBC,
    /** readyWBC(): loads fonts and pre-builds cell sprites / geometry caches (await before frame 1). */
    readyWBC: function () {
      var ps = [];
      if (document.fonts && document.fonts.load) {
        ps.push(document.fonts.load('40px ZenKaku', '好中球貪食フィブリン').catch(function () {}));
        ps.push(document.fonts.load('40px IPAGothic', 'μ₂⁻⁺').catch(function () {}));
      }
      return Promise.all(ps).then(function () {
        TYPES.forEach(function (ty) { [1, 2, 3, 4, 5, 6].forEach(function (s) { cellSprite(ty, s, 60); cellSprite(ty, s, 120); }); });
        cellSprite('neutrophil', 3, 250); phagoGeom(); bodyData(); clotData(780);
      });
    }
  };
  for (var key in api) D[key] = api[key];
  D.SIZE = D.SIZE || {};
  for (key in SIZE_WBC) D.SIZE[key] = SIZE_WBC[key];
})();
