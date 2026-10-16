/* BLOOD STORY ― 体内を駆ける細胞たち ―
 * world2.js : 第2〜4話の背景・エフェクト (Agent B)
 *
 * Plain script (no ES module). Load AFTER world.js; it EXTENDS window.BS.world (nothing in world.js is changed).
 * Same contract as world.js:
 *   - every draw function is a pure function of its opts (t + seeded randomness only), any frame renders on its own;
 *   - module caches (static layers / sprites / tiles) depend only on constant parameters (seed, quality …);
 *   - coordinates are canvas px designed for 1920×1080 (sizes are read from ctx.canvas), ctx state is saved/restored;
 *   - subtitles live below y≈900: no text or key detail is put there.
 * Budget: ≲60 ms per frame at 1080p after the first (cache-building) frame. Call BS.world.ready() first (fonts).
 *
 * ── 第2話 ───────────────────────────────────────────────────────────────────────────────
 *   drawSkinWound(ctx,{t,p,view,zoom,invade,seed})              指先の傷：外から → 皮膚の断面（表皮の層・切り口・細菌の侵入）
 *   drawVenuleWall(ctx,{t,scrollX,gap,gapX,squeeze,signal,inflame,layer})  細静脈の壁（内皮のすき間をくぐる遊走）
 *   drawTissueField(ctx,{t,scrollX,inflame,debris,layer})         組織の戦場（結合組織：膠原線維・線維芽細胞・組織液）
 *   drawVesselTear(ctx,{t,p,pull,view,scrollX,layer})            血管の裂け目（内側から／引きの外観）
 * ── 第3話 ───────────────────────────────────────────────────────────────────────────────
 *   drawCollagenBed(ctx,{t,scrollX,exposure,vwf,flow,layer})       露出したコラーゲン線維の床（粘着の舞台）
 *   drawFibrinNet(ctx,{t,p,sway,caught,layer})                    フィブリンの網の中（赤血球がからまる）
 *   drawMarrowSinusoid(ctx,{t,scrollX,mega,sprout,stem,flow})      骨髄の洞様毛細血管・造血細胞索・脂肪細胞・巨核球の場所
 *   drawFlashback(ctx,{amount,t,seed})                            回想用セピア（任意のフレームの上に重ねる）
 * ── 第4話 ───────────────────────────────────────────────────────────────────────────────
 *   drawSimGrid(ctx,{t,boot,reset,scrollX,hue})                   体外実習シミュレーター（ホログラム格子・リセットの砂嵐／巻き戻し）
 *   drawSlideWorld(ctx,{t,p,quality,view,drop})                   スライドガラスの世界（血滴・引きガラス・塗抹の広がり・失敗例）
 *   drawMicroscopeField(ctx,{t,zoom,focus,cells,pan,wbcs,seed})   顕微鏡の丸い視野（ギムザ染色の血球・接眼レンズの周辺減光）
 *   drawStainedCell(ctx,{type,x,y,r,rot,seed,focus})              視野用の染色血球１個（rbc/platelet/neutrophil/band/eosinophil/basophil/lymphocyte/lgl/monocyte）
 *   drawStainWash(ctx,{color,p,t})                                染色液の波（メタノール・メチレン青・エオジン・乾燥の風）
 * ── 共通 ────────────────────────────────────────────────────────────────────────────────
 *   drawEndCard(ctx,{t,episode,title,next,teaser})                各話の終わりのカード
 *   drawRecapFrame(ctx,{t,title,episode,content,alpha})           「前回までのあらすじ」の枠（中に過去の映像を描ける）
 * Each function's own docstring lists its opts and the layout it returns.
 */
(function () {
  'use strict';
  var BS = (window.BS = window.BS || {});
  var W0 = BS.world;
  if (!W0) throw new Error('world2.js must be loaded after world.js');
  var TAU = Math.PI * 2;
  var FONT_FAMILY = W0.FONT || 'ZenKaku, IPAGothic, sans-serif';
  function font(px, w) { return (w ? w + ' ' : '') + Math.max(1, px).toFixed(1) + 'px ' + FONT_FAMILY; }

  /* ------------------------------------------------------------------ utils */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function mod(a, n) { return ((a % n) + n) % n; }
  function hash(n) {
    var x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
    x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d); x ^= x >>> 12;
    return (x >>> 0) / 4294967296;
  }
  function rng(seed) {
    var s = (seed | 0) ^ 0x5bd1e995;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function vnoise(x, seed) { // 1-D value noise, smooth, ~[-1,1]
    var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i * 7919 + seed * 131) * 2 - 1, hash((i + 1) * 7919 + seed * 131) * 2 - 1, u);
  }
  function fbm1(x, seed) { return vnoise(x, seed) * 0.6 + vnoise(x * 2.3 + 11, seed + 1) * 0.3 + vnoise(x * 5.1 + 3, seed + 2) * 0.1; }
  function mkCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  function dims(ctx) { return [ctx.canvas.width, ctx.canvas.height]; }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a, 0, 1).toFixed(4) + ')'; }
  function mixC(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }
  var scratch = {};
  function scratchCanvas(name, w, h) {
    var c = scratch[name];
    if (!c || c.width !== w || c.height !== h) { c = scratch[name] = mkCanvas(w, h); }
    var x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, w, h);
    return c;
  }
  var cache = {};
  function cached(key, build) { if (!cache[key]) cache[key] = build(); return cache[key]; }
  var glowCache = {};
  function glowSprite(col) {
    var key = col.join(',');
    if (glowCache[key]) return glowCache[key];
    var c = mkCanvas(64, 64), x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(col, 1)); g.addColorStop(0.25, rgba(col, 0.55));
    g.addColorStop(0.6, rgba(col, 0.12)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    glowCache[key] = c; return c;
  }
  function glowAt(ctx, col, x, y, r, a) {
    if (a <= 0.002 || r <= 0.5) return;
    var ga = ctx.globalAlpha; ctx.globalAlpha = ga * clamp(a, 0, 1);
    ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = ga;
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  /* wobbly closed blob path */
  function blobPath(ctx, x, y, rx, ry, rot, seed, amp, n) {
    n = n || 28; amp = amp == null ? 0.08 : amp;
    var R = rng(seed), p1 = R() * TAU, p2 = R() * TAU, p3 = R() * TAU;
    var c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * TAU, k = 1 + amp * (0.6 * Math.sin(2 * a + p1) + 0.3 * Math.sin(3 * a + p2) + 0.2 * Math.sin(5 * a + p3));
      var px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      var X = x + px * c - py * s, Y = y + px * s + py * c;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath();
  }
  /* periodic layer helper: draw tile (width P) repeated across the screen with offset */
  function drawRepeat(ctx, tile, off, y, W) {
    var P = tile.width, x0 = -mod(off, P);
    for (var x = x0; x < W; x += P) ctx.drawImage(tile, x, y);
  }
  /* noise texture (grey, alpha), cached */
  function noiseTile(size, seed, alpha) {
    return cached('noise_' + size + '_' + seed + '_' + alpha, function () {
      var c = mkCanvas(size, size), x = c.getContext('2d'), im = x.createImageData(size, size), R = rng(seed);
      for (var i = 0; i < size * size; i++) { var v = R() * 255; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = alpha; }
      x.putImageData(im, 0, 0); return c;
    });
  }

  /* --------------------------------------------------- small shared painters */
  /* side-view RBC stream using world.js's drawRBC (cells flow → at v px/s, parallax par vs scrollX) */
  function flowRBC(ctx, o) {
    var W = dims(ctx)[0], t = o.t || 0, sx = o.scrollX || 0, n = o.n || 20, par = o.par == null ? 1 : o.par;
    var rMin = o.rMin || 20, rMax = o.rMax || 40, v = o.v == null ? 260 : o.v, margin = rMax * 2, span = W + margin * 2;
    var seed = o.seed || 1, blurK = o.blurK == null ? 0.25 : o.blurK;
    for (var i = 0; i < n; i++) {
      var R = rng(seed * 101 + i * 37);
      var r = lerp(rMin, rMax, R()), vv = v * (0.8 + R() * 0.4);
      var x = mod(R() * span + vv * t - sx * par, span) - margin;
      var y = lerp(o.y0, o.y1, R()) + Math.sin(t * (0.6 + R()) + i) * 6;
      var tx = R() * TAU + t * (R() - 0.5) * 1.4, ty = R() * TAU + t * (R() - 0.5) * 1.1;
      if (x < -r * 2 || x > W + r * 2) continue;
      W0.drawRBC(ctx, { x: x, y: y, r: r, tiltX: tx, tiltY: ty, alpha: o.alpha == null ? 1 : o.alpha, fog: o.fog || 0, fogColor: o.fogColor || '#b8343a', blur: Math.abs(vv) * blurK * (o.blur == null ? 1 : o.blur), blurAngle: 0 });
    }
  }
  /* bacterium sprite (small rod / coccus pair) in the series' pathogen style: dark body, acid-green rim + eyes */
  function bugSprite(kind) {
    return cached('bug_' + kind, function () {
      var S = 96, c = mkCanvas(S, S), x = c.getContext('2d');
      x.translate(S / 2, S / 2);
      var g = x.createRadialGradient(0, 0, 4, 0, 0, 46); g.addColorStop(0, 'rgba(170,255,80,0.35)'); g.addColorStop(1, 'rgba(170,255,80,0)');
      x.fillStyle = g; x.fillRect(-48, -48, 96, 96);
      x.strokeStyle = 'rgba(40,60,20,0.9)'; x.lineWidth = 1.6; x.lineCap = 'round';
      if (kind === 0) { // rod with flagellum
        x.beginPath(); x.moveTo(-26, 0); x.bezierCurveTo(-34, -8, -40, 8, -46, 2); x.stroke();
        roundRect(x, -26, -11, 52, 22, 11);
      } else { // diplococcus
        x.beginPath(); x.arc(-11, 0, 13, 0, TAU); x.arc(11, 0, 13, 0, TAU);
      }
      var bg = x.createLinearGradient(0, -12, 0, 12); bg.addColorStop(0, '#5c7a2a'); bg.addColorStop(0.5, '#25350f'); bg.addColorStop(1, '#141c08');
      x.fillStyle = bg; x.fill();
      x.strokeStyle = 'rgba(200,255,110,0.95)'; x.lineWidth = 2.4; x.stroke();
      // pili
      x.strokeStyle = 'rgba(190,255,120,0.55)'; x.lineWidth = 1;
      for (var i = 0; i < 10; i++) { var a = (i / 10) * TAU; x.beginPath(); x.moveTo(Math.cos(a) * 22, Math.sin(a) * 11); x.lineTo(Math.cos(a) * 30, Math.sin(a) * 17); x.stroke(); }
      // eyes
      x.fillStyle = '#f4ff9a'; x.shadowColor = '#c8ff40'; x.shadowBlur = 8;
      x.beginPath(); x.ellipse(6, -3, 4, 2.4, 0, 0, TAU); x.ellipse(15, -3, 3.2, 2, 0, 0, TAU); x.fill();
      return c;
    });
  }
  function drawBug(ctx, x, y, size, rot, kind, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha == null ? 1 : alpha; ctx.translate(x, y); ctx.rotate(rot);
    var s = size * 1.85; ctx.drawImage(bugSprite(kind | 0), -s / 2, -s / 2, s, s); ctx.restore();
  }
  /* wavy striated collagen bundle along a polyline-ish path (from x0,y0 to x1,y1 with sway) */
  function collagenBundle(ctx, x0, y0, x1, y1, w, seed, col, alpha) {
    var R = rng(seed), dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    var waves = 1 + R() * 1.6, ph = R() * TAU, amp = w * (0.35 + R() * 0.5), crimp = L / (w * 2.2), N = Math.max(16, Math.ceil(L / 12));
    col = col || [246, 196, 176]; alpha = alpha == null ? 1 : alpha;
    var pts = [];
    for (var i = 0; i <= N; i++) {
      var u = i / N, off = Math.sin(u * waves * TAU + ph) * amp * Math.sin(u * Math.PI) + Math.sin(u * crimp * TAU + ph) * w * 0.1;
      var ww = w * (0.8 + 0.2 * Math.sin(u * 7 + ph * 2)) * Math.min(1, Math.sin(u * Math.PI) * 2.6 + 0.08);
      pts.push([x0 + dx * u + nx * off, y0 + dy * u + ny * off, ww]);
    }
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function ribbon(frac, style, shift) {
      ctx.beginPath();
      for (var i = 0; i <= N; i++) { var p = pts[i], o = (shift + frac / 2) * p[2]; ctx[i ? 'lineTo' : 'moveTo'](p[0] + nx * o, p[1] + ny * o); }
      for (i = N; i >= 0; i--) { p = pts[i]; o = (shift - frac / 2) * p[2]; ctx.lineTo(p[0] + nx * o, p[1] + ny * o); }
      ctx.closePath(); ctx.fillStyle = style; ctx.fill();
    }
    ribbon(1.16, rgba(mixC(col, [90, 20, 30], 0.55), 0.85), 0.03);
    ribbon(1, rgb(col), 0);
    for (var k = -2; k <= 2; k++) ribbon(0.06, rgba(mixC(col, [150, 60, 60], 0.45), 0.5), k * 0.17);
    ribbon(0.2, rgba(mixC(col, [255, 255, 255], 0.6), 0.6), -0.24);
    // D-band striations (cross ticks)
    ctx.strokeStyle = rgba(mixC(col, [120, 40, 50], 0.5), 0.3); ctx.lineWidth = Math.max(1, w * 0.06);
    ctx.beginPath();
    for (i = 1; i < N; i += 1) {
      var p = pts[i], hw = p[2] * 0.46;
      ctx.moveTo(p[0] - nx * hw + (dx / L) * 2, p[1] - ny * hw + (dy / L) * 2); ctx.lineTo(p[0] + nx * hw, p[1] + ny * hw);
    }
    ctx.stroke(); ctx.restore();
  }
  /* spindle fibroblast with long processes */
  function fibroblast(ctx, x, y, len, rot, seed, alpha) {
    var R = rng(seed);
    ctx.save(); ctx.globalAlpha *= alpha == null ? 1 : alpha; ctx.translate(x, y); ctx.rotate(rot);
    var h = len * 0.16;
    ctx.beginPath(); ctx.moveTo(-len, R() * 6 - 3);
    ctx.bezierCurveTo(-len * 0.45, -h * 0.4, -len * 0.3, -h, 0, -h); ctx.bezierCurveTo(len * 0.3, -h, len * 0.45, -h * 0.3, len, R() * 6 - 3);
    ctx.bezierCurveTo(len * 0.45, h * 0.3, len * 0.3, h, 0, h); ctx.bezierCurveTo(-len * 0.3, h, -len * 0.45, h * 0.4, -len, 0);
    var g = ctx.createLinearGradient(0, -h, 0, h); g.addColorStop(0, '#ffd9c8'); g.addColorStop(0.6, '#eea898'); g.addColorStop(1, '#c47684');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(140,50,70,0.7)'; ctx.lineWidth = Math.max(1, len * 0.012); ctx.stroke();
    // processes
    ctx.strokeStyle = 'rgba(214,140,140,0.8)'; ctx.lineCap = 'round';
    for (var i = 0; i < 3; i++) {
      var sx = (R() - 0.5) * len * 0.8, sgn = R() < 0.5 ? -1 : 1;
      ctx.lineWidth = Math.max(1, len * 0.02); ctx.beginPath(); ctx.moveTo(sx, sgn * h * 0.7);
      ctx.quadraticCurveTo(sx + (R() - 0.5) * len * 0.5, sgn * h * 2, sx + (R() - 0.5) * len * 0.9, sgn * h * (2.4 + R()));
      ctx.stroke();
    }
    // nucleus (elongated)
    ctx.fillStyle = '#8a5cb0'; ctx.beginPath(); ctx.ellipse(len * 0.05, 0, len * 0.3, h * 0.48, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(60,25,90,0.8)'; ctx.lineWidth = Math.max(1, len * 0.01); ctx.stroke();
    ctx.fillStyle = 'rgba(70,30,100,0.5)';
    for (i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(len * (0.05 + (R() - 0.5) * 0.4), (R() - 0.5) * h * 0.5, len * 0.025, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,240,235,0.35)'; ctx.beginPath(); ctx.ellipse(-len * 0.1, -h * 0.55, len * 0.25, h * 0.15, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ================================================================ EPISODE 2 */

  /* ------------------------------------------------------------- SKIN WOUND */
  var SK = { W: 2112, H: 1188 };
  function skSurf(x) { return 268 + 13 * Math.sin((x / 150) * TAU) + 6 * vnoise(x / 90, 3); }
  function skJunc(x) { return skSurf(x) + 250 + 52 * Math.cos(((x + 37) / 75) * Math.PI) + 10 * vnoise(x / 60, 5); }
  var SK_CUT = { x: 1060, halfTop: 92, tipY: 690 };
  function skCutHalf(y) { // half-width of the wedge at depth y (0 outside)
    var top = skSurf(SK_CUT.x) - 6; if (y < top - 40 || y > SK_CUT.tipY) return 0;
    var u = clamp((y - top) / (SK_CUT.tipY - top), 0, 1);
    return SK_CUT.halfTop * Math.pow(1 - u, 0.85) * (1 + 0.12 * vnoise(y / 22, 9));
  }
  function buildSkinSection() {
    var c = mkCanvas(SK.W, SK.H), x = c.getContext('2d'), Wd = SK.W, Hd = SK.H, R = rng(77), i, X, Y;
    // dermis base
    var gd = x.createLinearGradient(0, 300, 0, Hd);
    gd.addColorStop(0, '#f8cfc0'); gd.addColorStop(0.35, '#f0b4a4'); gd.addColorStop(0.75, '#e0978c'); gd.addColorStop(1, '#c87478');
    x.fillStyle = gd; x.fillRect(0, 0, Wd, Hd);
    // reticular dermis collagen bundles
    for (i = 0; i < 46; i++) {
      var yy = lerp(700, Hd + 30, R()), xx = R() * Wd, L = 260 + R() * 420, a = (R() - 0.5) * 0.5;
      collagenBundle(x, xx - Math.cos(a) * L / 2, yy - Math.sin(a) * L / 2, xx + Math.cos(a) * L / 2, yy + Math.sin(a) * L / 2, 18 + R() * 16, 500 + i, [248, 202, 184], 0.85);
    }
    // papillary dermis: fine fibres
    x.strokeStyle = 'rgba(255,225,212,0.55)'; x.lineWidth = 1.5;
    for (i = 0; i < 260; i++) {
      X = R() * Wd; Y = skJunc(X) + 10 + R() * 220; var l = 30 + R() * 70, an = R() * TAU;
      x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + Math.cos(an) * l * 0.5 + 8, Y + Math.sin(an) * l * 0.5 - 8, X + Math.cos(an) * l, Y + Math.sin(an) * l); x.stroke();
    }
    // fibroblasts in dermis
    for (i = 0; i < 14; i++) { X = R() * Wd; Y = lerp(620, Hd - 60, R()); fibroblast(x, X, Y, 46 + R() * 20, (R() - 0.5) * 0.6, 900 + i, 0.9); }
    // venule (deep) + arteriole
    function vessel(y0, h, col, seed) {
      x.save();
      var gv = x.createLinearGradient(0, y0, 0, y0 + h); gv.addColorStop(0, '#7a1424'); gv.addColorStop(0.2, col); gv.addColorStop(0.8, col); gv.addColorStop(1, '#5a0c18');
      x.fillStyle = gv; x.beginPath();
      for (var k = 0; k <= 40; k++) { var xx2 = (k / 40) * Wd; var yy2 = y0 + 14 * Math.sin(k * 0.3 + seed); if (k) x.lineTo(xx2, yy2); else x.moveTo(xx2, yy2); }
      for (k = 40; k >= 0; k--) { xx2 = (k / 40) * Wd; yy2 = y0 + h + 14 * Math.sin(k * 0.3 + seed); x.lineTo(xx2, yy2); }
      x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,170,160,0.75)'; x.lineWidth = 6; x.stroke();
      x.restore();
    }
    vessel(1040, 110, '#b52434', 1.3);
    // subpapillary plexus + capillary loops rising into each papilla
    function capStroke() { x.strokeStyle = 'rgba(140,20,40,0.9)'; x.lineWidth = 11; x.stroke(); x.strokeStyle = 'rgba(230,60,70,0.95)'; x.lineWidth = 6; x.stroke(); x.strokeStyle = 'rgba(255,170,160,0.6)'; x.lineWidth = 2; x.stroke(); }
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); for (X = -20; X <= Wd + 20; X += 10) { Y = 800 + 18 * Math.sin(X / 210) + 8 * vnoise(X / 70, 12); if (X > -20) x.lineTo(X, Y); else x.moveTo(X, Y); } capStroke();
    for (var m = 0; m < Wd / 150 + 1; m++) {
      var px0 = (2 * m + 1) * 75 - 37, top = skJunc(px0) + 30, bot = 800 + 18 * Math.sin(px0 / 210);
      x.beginPath(); x.moveTo(px0 - 30, bot); x.bezierCurveTo(px0 - 14, bot - 60, px0 - 18, top + 30, px0, top); x.bezierCurveTo(px0 + 18, top + 30, px0 + 14, bot - 60, px0 + 30, bot); capStroke();
    }
    // --- epidermis (clip above junction)
    x.save();
    x.beginPath(); x.moveTo(0, 0);
    for (X = 0; X <= Wd; X += 6) x.lineTo(X, skJunc(X));
    x.lineTo(Wd, 0); x.closePath(); x.clip();
    var ge = x.createLinearGradient(0, 250, 0, 560); ge.addColorStop(0, '#f6d2c0'); ge.addColorStop(1, '#eaa8a2');
    x.fillStyle = ge; x.fillRect(0, 0, Wd, Hd);
    // spinosum / basale cells
    var cs = 30;
    for (Y = 300; Y < 640; Y += cs * 0.86) {
      var row = Math.round(Y / (cs * 0.86));
      for (X = (row % 2) * cs * 0.5 - 20; X < Wd + 30; X += cs) {
        var jx = X + (R() - 0.5) * 8, jy = Y + (R() - 0.5) * 8, d = jy - skSurf(jx), dj = skJunc(jx) - jy;
        if (d < 80 || dj < -4) continue;
        if (dj < 22) { // basale: columnar, oriented to the junction
          var ang = Math.atan2(skJunc(jx + 4) - skJunc(jx - 4), 8) + Math.PI / 2;
          x.save(); x.translate(jx, jy); x.rotate(ang);
          x.fillStyle = '#e48e92'; x.strokeStyle = 'rgba(150,60,80,0.8)'; x.lineWidth = 1.5;
          x.beginPath(); x.ellipse(0, 0, 15, 9, 0, 0, TAU); x.fill(); x.stroke();
          x.fillStyle = '#7a4aa0'; x.beginPath(); x.ellipse(1, 0, 8, 5.5, 0, 0, TAU); x.fill();
          x.fillStyle = 'rgba(110,70,40,0.75)'; x.beginPath(); x.ellipse(-8, 0, 4, 6, 0, 0, TAU); x.fill(); // melanin cap (toward surface)
          x.restore();
        } else if (d < 112) { // granulosum: flattened with granules
          x.fillStyle = '#f0b8ae'; x.strokeStyle = 'rgba(160,80,90,0.6)'; x.lineWidth = 1.3;
          x.beginPath(); x.ellipse(jx, jy, 19, 7, 0, 0, TAU); x.fill(); x.stroke();
          x.fillStyle = 'rgba(100,50,120,0.75)';
          for (var gq = 0; gq < 5; gq++) { x.beginPath(); x.arc(jx + (R() - 0.5) * 26, jy + (R() - 0.5) * 6, 1.6, 0, TAU); x.fill(); }
        } else { // spinosum: polygonal with spines
          var rr = 13 + R() * 2;
          x.fillStyle = R() < 0.5 ? '#f4bcb0' : '#f2b2a8'; x.strokeStyle = 'rgba(160,70,90,0.55)'; x.lineWidth = 1.2;
          x.beginPath();
          for (var s6 = 0; s6 < 6; s6++) { var aa = (s6 / 6) * TAU + R() * 0.3; var pxx = jx + Math.cos(aa) * rr, pyy = jy + Math.sin(aa) * rr * 0.86; if (s6) x.lineTo(pxx, pyy); else x.moveTo(pxx, pyy); }
          x.closePath(); x.fill(); x.stroke();
          x.strokeStyle = 'rgba(170,90,100,0.5)'; x.beginPath();
          for (s6 = 0; s6 < 6; s6++) { aa = (s6 / 6) * TAU; x.moveTo(jx + Math.cos(aa) * rr * 0.9, jy + Math.sin(aa) * rr * 0.8); x.lineTo(jx + Math.cos(aa) * rr * 1.18, jy + Math.sin(aa) * rr * 1.0); }
          x.stroke();
          x.fillStyle = '#9a6abc'; x.beginPath(); x.arc(jx, jy, 5, 0, TAU); x.fill();
        }
      }
    }
    // stratum corneum: overlapping flat flakes
    for (Y = 0; Y < 9; Y++) {
      for (X = -40; X < Wd + 40; X += 46) {
        var fx = X + (Y % 2) * 23 + (R() - 0.5) * 10, fs = skSurf(fx) + 6 + Y * 8.5;
        x.fillStyle = Y < 3 ? 'rgba(252,236,214,0.97)' : 'rgba(246,222,196,0.95)'; x.strokeStyle = 'rgba(190,140,110,0.55)'; x.lineWidth = 1.2;
        x.beginPath(); x.ellipse(fx, fs, 30, 4.4, Math.atan2(skSurf(fx + 5) - skSurf(fx - 5), 10), 0, TAU); x.fill(); x.stroke();
      }
    }
    // sweat duct (corkscrew through the epidermis, opening on a ridge crest)
    var dx0 = 1590;
    x.strokeStyle = 'rgba(160,80,110,0.8)'; x.lineWidth = 14; x.lineCap = 'round';
    x.beginPath();
    for (i = 0; i <= 50; i++) { var u = i / 50, yy3 = lerp(skSurf(dx0), skJunc(dx0) + 10, u); var xx3 = dx0 + Math.sin(u * 4.5 * TAU) * 16; if (i) x.lineTo(xx3, yy3); else x.moveTo(xx3, yy3); }
    x.stroke(); x.strokeStyle = 'rgba(255,236,226,0.95)'; x.lineWidth = 7; x.stroke();
    x.restore();
    // continue the duct in the dermis
    x.strokeStyle = 'rgba(160,80,110,0.8)'; x.lineWidth = 14; x.lineCap = 'round';
    x.beginPath(); x.moveTo(dx0, skJunc(dx0)); x.bezierCurveTo(dx0 + 20, 800, dx0 - 30, 900, dx0 + 10, 1000); x.stroke();
    x.strokeStyle = 'rgba(255,236,226,0.9)'; x.lineWidth = 7; x.stroke();
    // basement membrane line
    x.strokeStyle = 'rgba(255,240,230,0.85)'; x.lineWidth = 3; x.beginPath();
    for (X = 0; X <= Wd; X += 6) { if (X) x.lineTo(X, skJunc(X) + 1); else x.moveTo(X, skJunc(X) + 1); }
    x.stroke();
    // outside air (above surface) – cleared to transparent, drawn per frame
    x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(0, 0);
    for (X = 0; X <= Wd; X += 6) x.lineTo(X, skSurf(X) + 1);
    x.lineTo(Wd, 0); x.closePath(); x.fill(); x.restore();
    // surface rim light
    x.strokeStyle = 'rgba(255,250,240,0.9)'; x.lineWidth = 3; x.beginPath();
    for (X = 0; X <= Wd; X += 6) { if (X) x.lineTo(X, skSurf(X) + 1.5); else x.moveTo(X, skSurf(X) + 1.5); }
    x.stroke();
    // --- the cut (wedge)
    var top = skSurf(SK_CUT.x) - 6;
    function wedge(scale) {
      x.beginPath(); x.moveTo(SK_CUT.x - skCutHalf(top) * scale - 4, top - 30);
      for (Y = top - 30; Y <= SK_CUT.tipY; Y += 6) x.lineTo(SK_CUT.x - skCutHalf(Y) * scale + vnoise(Y / 9, 41) * 5, Y);
      for (Y = SK_CUT.tipY; Y >= top - 30; Y -= 6) x.lineTo(SK_CUT.x + skCutHalf(Y) * scale + vnoise(Y / 9, 42) * 5, Y);
      x.closePath();
    }
    x.save(); wedge(1.18); x.fillStyle = 'rgba(150,40,60,0.45)'; x.fill(); x.restore();
    x.save(); x.globalCompositeOperation = 'destination-out'; wedge(1); x.fill(); x.restore();
    // wound bed drawn behind (destination-over)
    x.save(); x.globalCompositeOperation = 'destination-over'; wedge(1.02);
    var gw = x.createLinearGradient(0, top, 0, SK_CUT.tipY); gw.addColorStop(0, '#b0505a'); gw.addColorStop(0.45, '#9a3040'); gw.addColorStop(1, '#5a0e1e');
    x.fillStyle = gw; x.fill();
    var gw2 = x.createLinearGradient(SK_CUT.x - 90, 0, SK_CUT.x + 90, 0); gw2.addColorStop(0, 'rgba(60,0,10,0.55)'); gw2.addColorStop(0.5, 'rgba(60,0,10,0)'); gw2.addColorStop(1, 'rgba(255,190,180,0.25)');
    x.fillStyle = gw2; x.fill(); x.restore();
    x.save(); wedge(1); x.strokeStyle = 'rgba(255,215,205,0.8)'; x.lineWidth = 2.5; x.stroke(); x.restore();
    return c;
  }
  function buildFingertip() {
    var Wd = 1920, Hd = 1080, c = mkCanvas(Wd, Hd), x = c.getContext('2d');
    var cx = 960, cy = 640, rx = 430, ry = 560;
    // finger silhouette (pad seen from the palm side), soft anime shading
    function shape() {
      x.beginPath(); x.moveTo(cx - rx, Hd + 40); x.lineTo(cx - rx, cy);
      x.bezierCurveTo(cx - rx, cy - ry * 0.95, cx + rx, cy - ry * 0.95, cx + rx, cy); x.lineTo(cx + rx, Hd + 40); x.closePath();
    }
    x.save(); x.shadowColor = 'rgba(80,40,40,0.35)'; x.shadowBlur = 60; x.shadowOffsetY = 20; shape();
    var g = x.createRadialGradient(cx - 120, cy - 200, 60, cx, cy, 760); g.addColorStop(0, '#ffe8da'); g.addColorStop(0.55, '#f6c9b2'); g.addColorStop(1, '#d99a88');
    x.fillStyle = g; x.fill(); x.restore();
    x.save(); shape(); x.clip();
    // flexion crease near the bottom
    x.strokeStyle = 'rgba(170,100,95,0.6)'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(cx - rx, Hd - 40); x.quadraticCurveTo(cx, Hd - 90, cx + rx, Hd - 40); x.stroke();
    // side shading
    var gs = x.createLinearGradient(cx - rx, 0, cx + rx, 0); gs.addColorStop(0, 'rgba(150,80,80,0.35)'); gs.addColorStop(0.2, 'rgba(150,80,80,0)'); gs.addColorStop(0.8, 'rgba(150,80,80,0)'); gs.addColorStop(1, 'rgba(150,80,80,0.4)');
    x.fillStyle = gs; x.fillRect(0, 0, Wd, Hd);
    x.restore();
    // outline (line-art)
    shape(); x.strokeStyle = '#8a4c48'; x.lineWidth = 6; x.stroke();
    return c;
  }
  var FT_CUT = { x: 1080, y: 470 };
  function drawWhorl(ctx, lw) {
    var cx = 960, cy = 640, rx = 430, ry = 560;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - rx, 1120); ctx.lineTo(cx - rx, cy); ctx.bezierCurveTo(cx - rx, cy - ry * 0.95, cx + rx, cy - ry * 0.95, cx + rx, cy); ctx.lineTo(cx + rx, 1120); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(190,120,110,0.5)'; ctx.lineWidth = 5 * lw; ctx.lineCap = 'round';
    for (var i = 0; i < 30; i++) {
      var r = 18 + i * 21; ctx.beginPath(); var pen = false;
      for (var k = 0; k <= 120; k++) {
        var a = (k / 120) * TAU;
        if (i > 13 && Math.sin(a) > 0.55) { pen = false; continue; }
        var px = cx + Math.cos(a) * r * 0.82 + Math.sin(a * 2 + i) * 4, py = cy - 60 + Math.sin(a) * r * (1 + 0.1 * Math.cos(a));
        if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  /**
   * drawSkinWound(ctx, {t, p, view, zoom=1, invade=1, seed=1, blood=1})
   * 第2話アバン「指先に、小さな傷」。
   * Two views:  view:'outside' – line-art fingertip pad (palm side, fingerprint whorl) with a small cut (red slit,
   *               blood bead, glowing bacteria specks). zoom 1..8 pushes in toward the cut.
   *             view:'section' – stylised cross-section of fingertip skin: stratum corneum (flakes) / granulosum
   *               (granules) / spinosum (polygonal) / basale (columnar + melanin caps), wavy dermal–epidermal
   *               junction with papillae + capillary loops, papillary & reticular dermis (collagen, fibroblasts),
   *               a corkscrew sweat duct, a deep venule. A wedge-shaped cut reaches the papillary dermis; bacteria
   *               stream from the air into the cut and spread through the dermis toward the venule.
   * p (0..1, optional) sequences the whole move: 0→0.45 outside push-in (zoom 1→7), 0.45→0.62 iris-wipe from the cut
   *   into the section, 0.62→1 slow push into the wound. When p is given it overrides view/zoom.
   * invade 0..1: how deep the bacterial stream has reached (0 = at the surface, 1 = near the venule).
   * Returns {view, surfaceY, cut:{x,y,tipX,tipY}, venuleY, groundY:null} in screen px (section: cut.y = surface at the cut).
   */
  function drawSkinWound(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, invade = o.invade == null ? 1 : clamp(o.invade, 0, 1);
    var view = o.view || 'section', zoom = o.zoom || 1, iris = 1, secZoom = 1;
    if (o.p != null) {
      var p = clamp(o.p, 0, 1);
      if (p < 0.45) { view = 'outside'; zoom = lerp(1, 7, Math.pow(smooth(0, 0.45, p), 1.6)); }
      else { view = 'section'; iris = smooth(0.45, 0.62, p); secZoom = lerp(1, 1.22, smooth(0.62, 1, p)); zoom = 7; }
    }
    ctx.save();
    var ret;
    if (view === 'outside' || iris < 1) {
      var ft = cached('fingertip', buildFingertip);
      // background: soft room light
      var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#dfe9f4'); bg.addColorStop(1, '#b6c6da');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var b = 0; b < 9; b++) { var Rb = rng(400 + b); glowAt(ctx, [255, 250, 235], Rb() * W, Rb() * H * 0.7, 80 + Rb() * 160, 0.25); }
      ctx.restore();
      ctx.save();
      var zx = FT_CUT.x, zy = FT_CUT.y, sc = (W / 1920) * zoom;
      var fx = lerp(W / 2, zx * (W / 1920), clamp((zoom - 1) / 6, 0, 1)), fy = lerp(H / 2, zy * (H / 1080), clamp((zoom - 1) / 6, 0, 1));
      ctx.translate(fx, fy); ctx.scale(sc, sc); ctx.translate(-zx, -zy);
      ctx.drawImage(ft, 0, 0);
      drawWhorl(ctx, Math.pow(zoom, 0.45) / zoom);
      // the cut: short slit + blood bead
      ctx.save(); ctx.translate(FT_CUT.x, FT_CUT.y); ctx.rotate(-0.35);
      ctx.fillStyle = 'rgba(200,90,90,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 54, 9, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-46, 0);
      for (var q = -46; q <= 46; q += 4) ctx.lineTo(q, -3.2 * Math.cos(q / 46 * Math.PI / 2) + Math.sin(q * 0.9) * 0.6);
      for (q = 46; q >= -46; q -= 4) ctx.lineTo(q, 3.6 * Math.cos(q / 46 * Math.PI / 2) + Math.sin(q * 1.3) * 0.6);
      ctx.closePath(); ctx.fillStyle = '#6a1020'; ctx.fill(); ctx.strokeStyle = '#a04848'; ctx.lineWidth = 1.2; ctx.stroke();
      var bead = 1 + 0.05 * Math.sin(t * 2);
      var gb = ctx.createRadialGradient(-22, -6, 1, -18, -2, 9 * bead); gb.addColorStop(0, '#ff9a9a'); gb.addColorStop(0.35, '#e0283a'); gb.addColorStop(1, '#8a0a1a');
      ctx.fillStyle = gb; ctx.beginPath(); ctx.ellipse(-18, -3, 8 * bead, 6.5 * bead, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(-21, -6, 2.2, 1.3, -0.4, 0, TAU); ctx.fill();
      ctx.restore();
      // bacteria specks drifting into the cut (visible as glowing motes when zoomed)
      var nb = 26, vis = clamp((zoom - 1.5) / 3, 0.25, 1);
      for (var i = 0; i < nb; i++) {
        var R = rng(700 + i), a0 = R() * TAU, rad = 40 + R() * 140, u = mod(R() + t * (0.05 + R() * 0.05), 1);
        var bx = FT_CUT.x + Math.cos(a0) * rad * (1 - u), by = FT_CUT.y + Math.sin(a0) * rad * 0.6 * (1 - u) - 10;
        drawBug(ctx, bx, by, 6 + 4 * R(), a0 + Math.PI, i % 2, vis * smooth(0, 0.15, u) * (1 - smooth(0.85, 1, u)));
      }
      ctx.restore();
      ret = { view: 'outside', cut: { x: fx, y: fy }, surfaceY: null, venuleY: null, groundY: null };
    }
    if (view === 'section' && iris > 0) {
      ctx.save();
      if (iris < 1) {
        var ir = Math.hypot(W, H) * Math.pow(iris, 1.5) * 0.62 + 2;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, ir, 0, TAU); ctx.clip();
      }
      var sec = cached('skinSection', buildSkinSection);
      // camera: section fits width, focus on cut (push in with secZoom)
      var s = (W / 1920) * secZoom * 1.0, cxS = SK_CUT.x, cyS = lerp(560, 600, secZoom - 1);
      var drift = Math.sin(t * 0.25) * 10;
      ctx.translate(W / 2 + drift, H / 2); ctx.scale(s, s); ctx.translate(-cxS, -cyS);
      // air
      var ga = ctx.createLinearGradient(0, 0, 0, 320); ga.addColorStop(0, '#cfe2f2'); ga.addColorStop(1, '#eef6fb');
      ctx.fillStyle = ga; ctx.fillRect(-200, -200, SK.W + 400, 560);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (b = 0; b < 7; b++) { Rb = rng(430 + b); glowAt(ctx, [255, 255, 240], Rb() * SK.W, 40 + Rb() * 180, 60 + Rb() * 120, 0.3); }
      ctx.restore();
      ctx.drawImage(sec, 0, 0);
      // living details: capillary flow glints
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var X = 0; X < SK.W + 150; X += 150) {
        var px0 = (2 * Math.round(X / 150) + 1) * 75 - 37, topc = skJunc(px0) + 30, botc = 800 + 18 * Math.sin(px0 / 210);
        for (var k = 0; k < 2; k++) {
          var uu = mod(t * 0.35 + k / 2 + px0 * 0.001, 1), side = uu < 0.5 ? -1 : 1, v = uu < 0.5 ? 1 - uu * 2 : (uu - 0.5) * 2;
          glowAt(ctx, [255, 120, 110], px0 + side * 18 * Math.min(1, v * 2), lerp(topc, botc, v), 9, 0.7);
        }
      }
      // venule flow
      for (k = 0; k < 18; k++) { var Rv = rng(800 + k); glowAt(ctx, [255, 120, 120], mod(Rv() * SK.W + t * 120, SK.W), 1060 + Rv() * 70, 14, 0.35); }
      ctx.restore();
      // pooled blood at the bottom of the cut (shimmer)
      var tip = SK_CUT.tipY;
      ctx.save(); ctx.beginPath();
      for (var Y = tip - 120; Y <= tip; Y += 6) ctx.lineTo(SK_CUT.x - skCutHalf(Y), Y);
      for (Y = tip; Y >= tip - 120; Y -= 6) ctx.lineTo(SK_CUT.x + skCutHalf(Y), Y);
      ctx.closePath();
      var lvl = tip - 120 + 6 * Math.sin(t * 1.3);
      var gpool = ctx.createLinearGradient(0, lvl, 0, tip); gpool.addColorStop(0, '#e83a48'); gpool.addColorStop(1, '#7a0818');
      ctx.clip(); ctx.fillStyle = gpool; ctx.fillRect(SK_CUT.x - 120, lvl, 240, tip - lvl + 5);
      ctx.fillStyle = 'rgba(255,200,190,0.6)'; ctx.fillRect(SK_CUT.x - 120, lvl, 240, 2);
      ctx.restore();
      // bacteria: stream down the cut then fan out into the dermis
      var nB = 46, reach = lerp(0.12, 1, invade);
      for (i = 0; i < nB; i++) {
        R = rng(1200 + i);
        var lane = R(), endX = SK_CUT.x + (lane - 0.5) * 1300, endY = 760 + R() * 260, ph = R(), spd = 0.05 + R() * 0.04;
        var s0 = mod(ph + t * spd, 1) * reach;
        var P0x = SK_CUT.x + (lane - 0.5) * 380, P0y = 40 + R() * 80, P1x = SK_CUT.x + (lane - 0.5) * 50, P1y = skSurf(SK_CUT.x) + 40;
        var P2x = SK_CUT.x + (lane - 0.5) * 60, P2y = SK_CUT.tipY - 10, bx, by;
        if (s0 < 0.45) { var q = s0 / 0.45; bx = lerp(lerp(P0x, P1x, q), lerp(P1x, P2x, q), q); by = lerp(lerp(P0y, P1y, q), lerp(P1y, P2y, q), q); }
        else { q = (s0 - 0.45) / 0.55; bx = lerp(P2x, endX, q) + Math.sin(q * 9 + i) * 14; by = lerp(P2y, endY, q * (2 - q)); }
        var al = smooth(0, 0.05, s0) * (1 - smooth(reach - 0.06, reach, s0) * 0.6);
        var rotb = Math.sin(t * 2 + i) * 0.6 + (s0 < 0.45 ? Math.PI / 2 : Math.atan2(endY - P2y, endX - P2x));
        drawBug(ctx, bx, by, 13 + R() * 5, rotb, i % 3 === 0 ? 1 : 0, al);
      }
      ctx.restore();
      var M = function (X, Y) { return { x: (X - cxS) * s + W / 2 + drift, y: (Y - cyS) * s + H / 2 }; };
      var cp = M(SK_CUT.x, skSurf(SK_CUT.x)), tp = M(SK_CUT.x, SK_CUT.tipY);
      ret = { view: 'section', surfaceY: cp.y, cut: { x: cp.x, y: cp.y, tipX: tp.x, tipY: tp.y }, venuleY: M(0, 1095).y, groundY: null };
    }
    ctx.restore();
    return ret;
  }

  /* ------------------------------------------------------------ VENULE WALL */
  function tissueBackTile(seed, inflame) {
    return cached('tissueBack_' + seed, function () {
      var P = 2400, Hh = 1080, c = mkCanvas(P, Hh), x = c.getContext('2d'), R = rng(seed);
      for (var i = 0; i < 34; i++) {
        var xx = R() * P, yy = R() * Hh, L = 500 + R() * 700, a = (R() - 0.5) * 1.2, w = 22 + R() * 28;
        for (var k = -1; k <= 1; k++) collagenBundle(x, xx + k * P - Math.cos(a) * L / 2, yy - Math.sin(a) * L / 2, xx + k * P + Math.cos(a) * L / 2, yy + Math.sin(a) * L / 2, w, seed * 50 + i, [238, 170, 150], 0.55);
      }
      // elastic fibres: thin dark wavy lines
      x.strokeStyle = 'rgba(120,40,80,0.45)'; x.lineWidth = 3;
      for (i = 0; i < 26; i++) {
        var y0 = R() * Hh, x0 = R() * P, len = 400 + R() * 600, ph = R() * TAU;
        for (k = -1; k <= 1; k++) {
          x.beginPath();
          for (var j = 0; j <= 40; j++) { var u = j / 40; var X = x0 + k * P + u * len, Y = y0 + Math.sin(u * 9 + ph) * 14 + u * (R() - 0.5) * 2; if (j) x.lineTo(X, Y); else x.moveTo(X, Y); }
          x.stroke();
        }
      }
      for (i = 0; i < 9; i++) { var fx = R() * P, fy = R() * Hh; for (k = -1; k <= 1; k++) fibroblast(x, fx + k * P, fy, 70 + R() * 30, (R() - 0.5) * 1.2, seed * 90 + i, 0.75); }
      return c;
    });
  }
  /**
   * drawVenuleWall(ctx, {t, scrollX=0, gap=0, gapX=W*0.55, squeeze=0, signal=0.6, inflame=0.4, wallY=600,
   *                      layer='all'|'back'|'front', seed=1})
   * 第2話 #2–4「細静脈の壁から外へ」. Cut-away side view: the venule lumen (top, RBCs flowing →), its wall as a
   * horizontal band — endothelial cells (flat, nucleus bulging into the lumen, glycocalyx fuzz, junctions), basement
   * membrane and pericytes — and the tissue below (collagen, fibroblasts, chemokine signals rising toward the wall).
   * gap 0..1 opens the junction at gapX (screen x at scrollX=0; it scrolls with the wall) up to ≈210 px wide;
   * squeeze 0..1 makes the two cell lips hug a cell squeezing through (diapedesis).
   * Occlusion: layer:'back' → characters → layer:'front' (front = gap lips + wall face in front of the squeezer).
   * Returns {groundY (=lumen floor = wallY), lumenGroundY, tissueGroundY, wallTop, wallBottom, gapX, gapW, gapTop, gapBottom}.
   * Characters at scale≈0.5 fit both levels (lumen feet at wallY, tissue feet at tissueGroundY≈960).
   */
  function drawVenuleWall(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, sx = o.scrollX || 0, layer = o.layer || 'all';
    var wallY = o.wallY || Math.round(H * 0.555), thick = 104, gap = clamp(o.gap || 0, 0, 1), sq = clamp(o.squeeze || 0, 0, 1);
    var gapXw = o.gapX == null ? W * 0.55 : o.gapX, gapX = gapXw - sx, gapW = 210 * smooth(0, 1, gap) + sq * 20;
    var sig = o.signal == null ? 0.6 : o.signal, infl = o.inflame == null ? 0.4 : o.inflame, seed = o.seed || 1;
    var tissueG = Math.min(H - 30, wallY + 360);
    var L = { groundY: wallY, lumenGroundY: wallY, tissueGroundY: tissueG, wallTop: wallY, wallBottom: wallY + thick, gapX: gapX, gapW: gapW, gapTop: wallY - 30, gapBottom: wallY + thick + 10 };
    ctx.save();
    if (layer !== 'front') {
      // --- tissue (below)
      var gt = ctx.createLinearGradient(0, wallY, 0, H);
      gt.addColorStop(0, '#5a1a22'); gt.addColorStop(0.25, '#a8504a'); gt.addColorStop(0.7, '#d48a6e'); gt.addColorStop(1, '#8a4a44');
      ctx.fillStyle = gt; ctx.fillRect(0, wallY, W, H - wallY);
      var tb = tissueBackTile(31 + seed, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(0, wallY + 40, W, H); ctx.clip(); ctx.globalAlpha = 0.85;
      drawRepeat(ctx, tb, sx * 0.85, wallY - 120, W); ctx.restore();
      // inflamed glow pulsing from the infection site (right)
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var pul = 0.75 + 0.25 * Math.sin(t * 2.4);
      glowAt(ctx, [255, 120, 60], W * 0.85 - sx * 0.85, tissueG - 80, 700, 0.35 * infl * pul);
      ctx.restore();
      // tissue floor
      var gf = ctx.createLinearGradient(0, tissueG - 30, 0, H); gf.addColorStop(0, 'rgba(120,50,50,0)'); gf.addColorStop(0.3, 'rgba(110,40,46,0.55)'); gf.addColorStop(1, 'rgba(60,16,24,0.85)');
      ctx.fillStyle = gf; ctx.fillRect(0, tissueG - 30, W, H - tissueG + 30);
      var vfl = cached('venuleFloor', function () {
        var P = 2600, c = mkCanvas(P, 160), x = c.getContext('2d');
        for (var i = 0; i < 9; i++) { var Rf = rng(2000 + i), fx0 = Rf() * P, ln = 500 + Rf() * 300, yy0 = 20 + Rf() * 40, yy1 = 30 + Rf() * 60, w = 22 + Rf() * 14;
          for (var k = -1; k <= 1; k++) collagenBundle(x, fx0 + k * P, yy0, fx0 + k * P + ln, yy1, w, 2100 + i, [226, 150, 132], 0.9); }
        return c;
      });
      drawRepeat(ctx, vfl, sx, tissueG - 10, W);
      var i;
      // chemokine signals rising toward the wall
      if (sig > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < 40; i++) {
          var Rs = rng(3000 + i), u = mod(Rs() + t * (0.12 + Rs() * 0.1), 1);
          var xx = mod(Rs() * W * 1.4 - sx * 0.9, W * 1.4) - W * 0.2 + Math.sin(u * 6 + i) * 20;
          var yy = lerp(tissueG - 20, wallY + thick + 10, u);
          glowAt(ctx, [255, 200, 120], xx, yy, 10 + Rs() * 10, sig * 0.6 * Math.sin(u * Math.PI));
        }
        ctx.restore();
      }
      // --- lumen (above)
      var gl = ctx.createLinearGradient(0, 0, 0, wallY);
      gl.addColorStop(0, '#2a0409'); gl.addColorStop(0.45, '#7a1020'); gl.addColorStop(1, '#b8303a');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, wallY);
      // far wall mosaic hint
      ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#ffb0a0'; ctx.lineWidth = 2;
      for (i = 0; i < 26; i++) {
        var Rm = rng(3500 + i), mx = mod(Rm() * 2400 - sx * 0.35, 2400) - 240, my = 60 + Rm() * (wallY - 200);
        ctx.beginPath(); ctx.ellipse(mx, my, 150 + Rm() * 60, 34 + Rm() * 10, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(200,120,200,0.6)'; ctx.beginPath(); ctx.ellipse(mx, my, 34, 12, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
      flowRBC(ctx, { t: t, scrollX: sx, y0: 60, y1: wallY - 210, n: 10, rMin: 22, rMax: 36, v: 220, par: 0.45, seed: 11, fog: 0.5, alpha: 0.85, blurK: 0.12 });
      flowRBC(ctx, { t: t, scrollX: sx, y0: 120, y1: wallY - 90, n: 9, rMin: 40, rMax: 60, v: 300, par: 0.85, seed: 12, fog: 0.15, blurK: 0.1 });
      // --- wall
      drawEndoWall(ctx, { W: W, wallY: wallY, thick: thick, sx: sx, gapX: gapX, gapW: gapW, sq: sq, t: t, part: 'back' });
    }
    if (layer !== 'back') {
      drawEndoWall(ctx, { W: W, wallY: wallY, thick: thick, sx: sx, gapX: gapX, gapW: gapW, sq: sq, t: t, part: 'front' });
    }
    ctx.restore();
    return L;
  }
  function drawEndoWall(ctx, o) {
    var W = o.W, wy = o.wallY, th = o.thick, sx = o.sx, gx = o.gapX, gw = o.gapW, sq = o.sq, t = o.t;
    var P = 400, k0 = Math.floor((sx - 500) / P), k1 = Math.ceil((sx + W + 500) / P);
    // junction positions in screen space; the one nearest the gap is pinned to gapX
    var J = [], best = -1, bd = 1e9;
    for (var k = k0; k <= k1 + 1; k++) { var jx = k * P + (hash(k * 31 + 7) - 0.5) * 120 - sx; J.push(jx); if (Math.abs(jx - gx) < bd) { bd = Math.abs(jx - gx); best = J.length - 1; } }
    if (bd < P * 0.7) J[best] = gx;
    var cellTh = 40, bm = wy + 52;
    if (o.part === 'back') {
      // basement membrane + pericytes (hole at the gap)
      ctx.save();
      var holeW = gw * 0.75;
      ctx.fillStyle = '#e8b0a8'; ctx.strokeStyle = 'rgba(255,230,220,0.9)'; ctx.lineWidth = 2;
      function bmSeg(a, b) { if (b - a < 2) return; ctx.beginPath(); ctx.rect(a, bm, b - a, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(a, bm); ctx.lineTo(b, bm); ctx.stroke(); }
      if (holeW > 4) { bmSeg(-10, gx - holeW / 2); bmSeg(gx + holeW / 2, W + 10); } else bmSeg(-10, W + 10);
      // fuzzy BM fibres
      ctx.strokeStyle = 'rgba(255,200,190,0.35)'; ctx.lineWidth = 1;
      for (var i = 0; i < 160; i++) { var fx = mod(hash(i * 13 + 5) * 2600 - sx, 2600) - 340; if (Math.abs(fx - gx) < holeW / 2) continue; ctx.beginPath(); ctx.moveTo(fx, bm + 7); ctx.lineTo(fx + 8, bm + 16 + hash(i) * 8); ctx.stroke(); }
      // pericytes
      for (i = k0; i <= k1; i++) {
        if (hash(i * 17 + 3) < 0.45) continue;
        var px = i * P * 1.3 + 200 - sx; if (px < -300 || px > W + 300 || Math.abs(px - gx) < gw * 0.5 + 140) continue;
        ctx.save(); ctx.translate(px, bm + 26);
        ctx.beginPath(); ctx.ellipse(0, 0, 130, 16, 0, 0, TAU);
        var gp = ctx.createLinearGradient(0, -16, 0, 16); gp.addColorStop(0, '#f0b0a0'); gp.addColorStop(1, '#b86878');
        ctx.fillStyle = gp; ctx.fill(); ctx.strokeStyle = 'rgba(120,40,60,0.7)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#8a5cb0'; ctx.beginPath(); ctx.ellipse(10, 2, 34, 9, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      // endothelial cells (behind characters: full cells)
      for (var j = 0; j < J.length - 1; j++) endoCell(ctx, J[j], J[j + 1], wy, cellTh, j + k0, gx, gw, sq, t, false);
      // glycocalyx fuzz on the luminal surface
      ctx.save(); ctx.strokeStyle = 'rgba(255,210,200,0.35)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (i = 0; i < 260; i++) { var gx2 = (i / 260) * (W + 40) - 20 + mod(-sx, 7.4); if (Math.abs(gx2 - gx) < gw / 2 + 10) continue; var gy2 = wy - endoBulge(gx2 + sx, J, sx) - 2; ctx.moveTo(gx2, gy2); ctx.lineTo(gx2 + Math.sin(i + t) * 2, gy2 - 6 - 3 * hash(i)); }
      ctx.stroke(); ctx.restore();
    } else {
      // front: the two lips around the gap, hugging the squeezing cell
      if (gw > 2) {
        var lipA = 0.92;
        ctx.save(); ctx.globalAlpha *= lipA;
        for (var side = -1; side <= 1; side += 2) {
          var ex = gx + side * gw / 2, inset = sq * 26;
          ctx.save(); ctx.translate(ex, wy + cellTh * 0.5);
          ctx.beginPath(); ctx.moveTo(side * 90, -cellTh * 0.55); ctx.bezierCurveTo(side * 40, -cellTh * 0.6, -side * inset, -cellTh * 0.6, -side * inset, 0);
          ctx.bezierCurveTo(-side * inset, cellTh * 0.6 + sq * 18, side * 40, cellTh * 0.7, side * 90, cellTh * 0.55); ctx.closePath();
          var g = ctx.createLinearGradient(0, -cellTh * 0.6, 0, cellTh * 0.6); g.addColorStop(0, '#ffc0b0'); g.addColorStop(0.5, '#ec8f90'); g.addColorStop(1, '#b85a70');
          ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(120,30,60,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,235,225,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(side * 80, -cellTh * 0.4); ctx.bezierCurveTo(side * 30, -cellTh * 0.45, -side * inset * 0.5, -cellTh * 0.4, -side * inset * 0.8, -cellTh * 0.1); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    }
  }
  function endoBulge(xw, J, sx) { // nucleus bulge height at world x (approx, for glycocalyx)
    var x = xw - sx;
    for (var j = 0; j < J.length - 1; j++) if (x >= J[j] && x < J[j + 1]) { var c = (J[j] + J[j + 1]) / 2 + (hash(j * 5) - 0.5) * 60, w = (J[j + 1] - J[j]) * 0.22; var u = (x - c) / w; return u * u < 1 ? 30 * Math.sqrt(1 - u * u) : 0; }
    return 0;
  }
  function endoCell(ctx, a, b, wy, th, id, gx, gw, sq, t, front) {
    // trim for the gap
    if (Math.abs(b - gx) < 1) b = gx - gw / 2; else if (Math.abs(a - gx) < 1) a = gx + gw / 2;
    if (b - a < 20) return;
    var c = (a + b) / 2 + (hash(id * 5) - 0.5) * 60, nw = Math.min((b - a) * 0.22, 90), bulge = 30 + 4 * Math.sin(t * 1.3 + id);
    c = clamp(c, a + nw + 20, b - nw - 20);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a + 10, wy);
    ctx.lineTo(c - nw * 1.6, wy);
    ctx.bezierCurveTo(c - nw, wy, c - nw * 0.8, wy - bulge, c, wy - bulge);
    ctx.bezierCurveTo(c + nw * 0.8, wy - bulge, c + nw, wy, c + nw * 1.6, wy);
    ctx.lineTo(b - 10, wy); ctx.quadraticCurveTo(b + 2, wy, b + 2, wy + th * 0.5); ctx.quadraticCurveTo(b + 2, wy + th, b - 10, wy + th);
    ctx.lineTo(a + 10, wy + th); ctx.quadraticCurveTo(a - 2, wy + th, a - 2, wy + th * 0.5); ctx.quadraticCurveTo(a - 2, wy, a + 10, wy);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, wy - bulge, 0, wy + th); g.addColorStop(0, '#ffc8b8'); g.addColorStop(0.45, '#f29a98'); g.addColorStop(1, '#c26478');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(120,30,60,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
    // nucleus
    ctx.fillStyle = '#8a58b4'; ctx.beginPath(); ctx.ellipse(c, wy - bulge * 0.35 + 8, nw * 0.95, bulge * 0.55 + 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(60,20,90,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(70,30,110,0.55)';
    for (var i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(c + (hash(id * 9 + i) - 0.5) * nw * 1.3, wy - bulge * 0.3 + 8 + (hash(id * 7 + i) - 0.5) * bulge * 0.5, 3, 0, TAU); ctx.fill(); }
    // vesicles (caveolae) along the thin parts
    ctx.fillStyle = 'rgba(255,230,230,0.55)';
    for (i = 0; i < 10; i++) { var vx = lerp(a + 20, b - 20, hash(id * 13 + i)); if (Math.abs(vx - c) < nw * 1.4) continue; ctx.beginPath(); ctx.arc(vx, wy + th * (0.3 + 0.4 * hash(id * 3 + i)), 3.2, 0, TAU); ctx.fill(); }
    // top highlight
    ctx.strokeStyle = 'rgba(255,240,232,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a + 14, wy + 4); ctx.lineTo(c - nw * 1.5, wy + 4); ctx.bezierCurveTo(c - nw, wy + 3, c - nw * 0.8, wy - bulge + 5, c, wy - bulge + 5); ctx.stroke();
    // junction marks (tight junction dots)
    ctx.fillStyle = 'rgba(90,20,50,0.9)';
    ctx.beginPath(); ctx.arc(a + 2, wy + 8, 3, 0, TAU); ctx.arc(b - 2, wy + 8, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ----------------------------------------------------------- TISSUE FIELD */
  function tissueMidTile() {
    return cached('tissueMid', function () {
      var P = 2600, Hh = 1000, c = mkCanvas(P, Hh), x = c.getContext('2d'), R = rng(4242);
      for (var i = 0; i < 16; i++) {
        var xx = R() * P, yy = 150 + R() * 650, L = 700 + R() * 900, a = (R() - 0.5) * 1.0 + (R() < 0.3 ? 0.9 : 0), w = 40 + R() * 40;
        for (var k = -1; k <= 1; k++) collagenBundle(x, xx + k * P - Math.cos(a) * L / 2, yy - Math.sin(a) * L / 2, xx + k * P + Math.cos(a) * L / 2, yy + Math.sin(a) * L / 2, w, 4300 + i, [250, 196, 172], 1);
      }
      x.lineCap = 'round';
      for (i = 0; i < 14; i++) {
        var y0 = 100 + R() * 800, x0 = R() * P, len = 600 + R() * 600, ph = R() * TAU;
        for (k = -1; k <= 1; k++) {
          x.beginPath();
          for (var j = 0; j <= 50; j++) { var u = j / 50; var X = x0 + k * P + u * len, Y = y0 + Math.sin(u * 11 + ph) * 18 + Math.sin(u * 3) * 40; if (j) x.lineTo(X, Y); else x.moveTo(X, Y); }
          x.strokeStyle = 'rgba(90,20,60,0.6)'; x.lineWidth = 6; x.stroke(); x.strokeStyle = 'rgba(200,110,170,0.7)'; x.lineWidth = 3; x.stroke();
        }
      }
      for (i = 0; i < 7; i++) { var fx = R() * P, fy = 200 + R() * 600; for (k = -1; k <= 1; k++) fibroblast(x, fx + k * P, fy, 110 + R() * 40, (R() - 0.5) * 0.9, 4400 + i, 1); }
      return c;
    });
  }
  function tissueFloorTile() {
    return cached('tissueFloor', function () {
      var P = 2400, Hh = 300, c = mkCanvas(P, Hh), x = c.getContext('2d'), R = rng(4545);
      var g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#c87a6a'); g.addColorStop(0.3, '#a85a58'); g.addColorStop(1, '#5a2028');
      x.fillStyle = g; x.fillRect(0, 0, P, Hh);
      for (var i = 0; i < 60; i++) {
        var yy = 8 + Math.pow(R(), 0.8) * Hh, xx = R() * P, L = 300 + R() * 500, w = (10 + R() * 14) * (0.6 + yy / Hh), a = (R() - 0.5) * 0.25;
        for (var k = -1; k <= 1; k++) collagenBundle(x, xx + k * P - L / 2, yy - Math.sin(a) * L / 2, xx + k * P + L / 2, yy + Math.sin(a) * L / 2, w, 4600 + i, [236, 164, 140], 0.9);
      }
      var gt = x.createLinearGradient(0, 0, 0, 40); gt.addColorStop(0, 'rgba(255,200,170,0.5)'); gt.addColorStop(1, 'rgba(255,200,170,0)');
      x.fillStyle = gt; x.fillRect(0, 0, P, 40);
      return c;
    });
  }
  /**
   * drawTissueField(ctx, {t, scrollX=0, inflame=0.5, debris=0, layer='all'|'back'|'front', groundY=900})
   * 第2話の主戦場：血管の外の疎性結合組織。Side-scrolling, 3 parallax layers: far haze with blurred fibre
   * silhouettes (0.25), mid layer of striated collagen bundles, purple elastic fibres and spindle fibroblasts (0.55),
   * a matted-collagen ground (1.0). Interstitial fluid motes drift; inflame 0..1 adds pulsing orange-red heat glow,
   * swelling shimmer and plasma droplets (炎症). debris 0..1 litters the ground with bacterial remains and damaged
   * cell fragments (#26). layer 'front' = out-of-focus fibres crossing in front of the characters (draw last).
   * Returns {groundY, horizonY}.
   */
  function drawTissueField(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, sx = o.scrollX || 0, layer = o.layer || 'all';
    var gY = o.groundY || Math.round(H * 0.834), infl = o.inflame == null ? 0.5 : clamp(o.inflame, 0, 1), deb = clamp(o.debris || 0, 0, 1);
    var pul = 0.7 + 0.3 * Math.sin(t * 2.1) * Math.sin(t * 0.7 + 1);
    ctx.save();
    if (layer !== 'front') {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2a0810'); g.addColorStop(0.45, rgb(mixC([150, 70, 70], [190, 80, 60], infl))); g.addColorStop(0.8, rgb(mixC([210, 130, 110], [235, 130, 90], infl))); g.addColorStop(1, '#5a2026');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // far fibres (pre-blurred tile)
      var far = cached('tissueFar', function () {
        var src = tissueBackTile(77, 0), c = mkCanvas(src.width / 2, src.height / 2), x = c.getContext('2d');
        x.filter = 'blur(6px)'; x.drawImage(src, 0, 0, c.width, c.height); return c;
      });
      ctx.save(); ctx.globalAlpha = 0.55;
      var fsc = 1.2, P = far.width * fsc, off = mod(sx * 0.25, P);
      for (var x0 = -off; x0 < W; x0 += P) ctx.drawImage(far, x0, -60, P, far.height * fsc);
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glowAt(ctx, [255, 140, 70], W * 0.5, H * 0.45, 1100, 0.18 + 0.25 * infl * pul);
      ctx.restore();
      // haze
      var hz = ctx.createLinearGradient(0, H * 0.2, 0, gY); hz.addColorStop(0, 'rgba(255,170,140,0)'); hz.addColorStop(1, rgba([255, 170, 140], 0.25 + 0.1 * infl));
      ctx.fillStyle = hz; ctx.fillRect(0, 0, W, gY);
      // mid layer
      var mid = tissueMidTile();
      ctx.save(); ctx.globalAlpha = 0.95; drawRepeat(ctx, mid, sx * 0.55, gY - 980, W);
      ctx.fillStyle = rgba([120, 40, 50], 0.18); ctx.fillRect(0, 0, W, gY);
      ctx.restore();
      // fluid motes
      W0.drawParticles(ctx, { t: t, seed: 21, count: 70, x: 0, y: 0, w: W, h: gY, vx: -18 - sx * 0, vy: -6, size: 3.2, color: '255,215,170', alpha: 0.45 });
      // ground
      var fl = tissueFloorTile();
      ctx.save(); drawRepeat(ctx, fl, sx, gY - 40, W); ctx.restore();
      var gg = ctx.createLinearGradient(0, gY - 60, 0, gY + 10); gg.addColorStop(0, 'rgba(60,10,20,0)'); gg.addColorStop(1, 'rgba(60,10,20,0.25)');
      ctx.fillStyle = gg; ctx.fillRect(0, gY - 60, W, 70);
      // inflamed plasma droplets / swelling shimmer
      if (infl > 0.01) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 24; i++) {
          var R = rng(5000 + i), u = mod(R() + t * 0.07, 1), xx = mod(R() * (W + 400) - sx * 0.8, W + 400) - 200, yy = lerp(gY - 40, H * 0.15, u);
          glowAt(ctx, [255, 160, 90], xx + Math.sin(t + i) * 30, yy, 30 + R() * 50, infl * 0.22 * Math.sin(u * Math.PI));
        }
        ctx.restore();
        ctx.fillStyle = rgba([255, 80, 40], 0.10 * infl * pul); ctx.fillRect(0, 0, W, H);
      }
      if (deb > 0) drawDebris(ctx, W, gY, sx, t, deb);
    }
    if (layer !== 'back') {
      // out-of-focus foreground fibres
      var fr = cached('tissueFront', function () {
        var c = mkCanvas(1500, 540), x = c.getContext('2d'); x.filter = 'blur(10px)';
        collagenBundle(x, -100, 520, 700, 40, 70, 5101, [255, 190, 170], 1);
        collagenBundle(x, 900, 560, 1600, 200, 60, 5102, [240, 170, 150], 1);
        return c;
      });
      ctx.save(); ctx.globalAlpha = 0.6;
      var Pf = 3600, of = mod(sx * 1.6, Pf);
      for (x0 = -of; x0 < W; x0 += Pf) { ctx.drawImage(fr, x0 - 200, H - 420, 1500, 540); ctx.drawImage(fr, x0 + 1900, -180, 1500, 540); }
      ctx.restore();
    }
    ctx.restore();
    return { groundY: gY, horizonY: Math.round(H * 0.42) };
  }
  function drawDebris(ctx, W, gY, sx, t, deb) {
    var n = Math.round(46 * deb);
    for (var i = 0; i < n; i++) {
      var R = rng(5200 + i), xx = mod(R() * 2600 - sx, 2600) - 340, yy = gY - 6 + R() * 70, s = (10 + R() * 22) * (0.7 + (yy - gY) / 120);
      if (xx < -60 || xx > W + 60) continue;
      ctx.save(); ctx.translate(xx, yy); ctx.rotate(R() * TAU);
      if (R() < 0.55) { // broken bacterium husk
        ctx.fillStyle = 'rgba(40,52,24,0.85)'; ctx.strokeStyle = 'rgba(150,190,90,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-s, -s * 0.35); ctx.lineTo(s * 0.4, -s * 0.45); ctx.lineTo(s * 0.1, 0); ctx.lineTo(s * 0.6, s * 0.4); ctx.lineTo(-s, s * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else { // cell fragment (pink membrane shard + dark nuclear bit)
        ctx.fillStyle = 'rgba(230,150,160,0.85)'; ctx.strokeStyle = 'rgba(130,50,70,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0.3, 3.6); ctx.quadraticCurveTo(0, s * 0.2, s * 0.6, s * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(100,60,140,0.9)'; ctx.beginPath(); ctx.arc(s * 0.1, -s * 0.2, s * 0.25, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------ VESSEL TEAR */
  function tearRadius(a, seed) { return 1 + 0.18 * Math.sin(3 * a + seed) + 0.1 * Math.sin(7 * a + seed * 2) + 0.08 * vnoise(a * 4, seed) + 0.05 * Math.sin(13 * a); }
  /**
   * drawVesselTear(ctx, {t, p=1, pull=1, view='inside'|'outside', scrollX=0, layer='all'|'back'|'front', tearX, tearY})
   * 第2話ラスト／第3話アバン：裂けた血管。
   * view 'inside': world.js's drawVesselSide interior (groundY≈891) with a ragged tear in the far wall. Through the
   *   tear: the torn wall layers (endothelium → media with smooth muscle → adventitia), exposed collagen fibres and the
   *   amber tissue outside. RBCs and plasma motes spiral and stream out through it (pull 0..1). p 0..1 = tear size.
   *   layer 'front' = big blurred cells being sucked past in front of the characters (draw after them).
   * view 'outside' (引きのカット): a vessel segment crossing the frame in tissue, the tear on its lower flank and a plume
   *   of RBCs leaking out; platelets (small bright specks) converging on the tear when p>0.8.
   * Returns {groundY, tear:{x,y,rx,ry}, view} (outside: also vessel:{y0,y1}).
   */
  function drawVesselTear(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, p = o.p == null ? 1 : clamp(o.p, 0, 1), pull = o.pull == null ? 1 : clamp(o.pull, 0, 1);
    var layer = o.layer || 'all', view = o.view || 'inside';
    ctx.save();
    var ret;
    if (view === 'outside') ret = vesselTearOutside(ctx, W, H, t, p, pull, o);
    else {
      var tx = o.tearX == null ? W * 0.6 : o.tearX, ty = o.tearY == null ? H * 0.47 : o.tearY;
      var rx = lerp(30, 360, smooth(0, 1, p)), ry = rx * 0.62;
      var Lo = null;
      if (layer !== 'front') {
        Lo = W0.drawVesselSide(ctx, { t: t, scrollX: o.scrollX || 0, layers: 'back', scrollSpeed: 300 });
        drawTearHole(ctx, tx, ty, rx, ry, t, pull, 17);
        // cells streaming into the tear (mid depth)
        for (var i = 0; i < 22; i++) {
          var R = rng(6000 + i), u = mod(R() + t * (0.22 + 0.25 * pull) * (0.7 + R() * 0.6), 1);
          var a0 = R() * TAU, r0 = lerp(700, 1100, R());
          var ang = a0 + u * (1.4 + R()) * pull, rr = r0 * Math.pow(1 - u, 1.4) + rx * 0.15;
          var cx = tx + Math.cos(ang) * rr, cy = ty + Math.sin(ang) * rr * 0.6;
          var sc = lerp(1, 0.25, smooth(0.65, 1, u)), r = (24 + R() * 22) * sc;
          var spd = (r0 / 2) * (0.22 + 0.25 * pull) * 1.4;
          W0.drawRBC(ctx, { x: cx, y: cy, r: r, tiltX: R() * TAU + t, tiltY: R() * TAU + t * 0.7, fog: 0.15 + 0.5 * u, fogColor: '#7a1a20',  alpha: 1 - smooth(0.85, 1, u) });
        }
        // swirl streaks
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (i = 0; i < 40; i++) {
          R = rng(6100 + i); u = mod(R() + t * 0.5 * (0.6 + pull), 1);
          var a1 = R() * TAU + u * 2.2, r1 = lerp(900, rx * 0.4, u);
          ctx.strokeStyle = rgba([255, 200, 180], 0.18 * pull * Math.sin(u * Math.PI)); ctx.lineWidth = 2 + R() * 3;
          ctx.beginPath(); ctx.arc(tx, ty, r1, a1, a1 + 0.25 + 0.2 * pull); ctx.stroke();
        }
        ctx.restore();
        ret = { view: 'inside', groundY: Lo.groundY, tear: { x: tx, y: ty, rx: rx, ry: ry } };
      }
      if (layer !== 'back') {
        for (i = 0; i < 6; i++) {
          R = rng(6200 + i); u = mod(R() + t * (0.3 + 0.3 * pull), 1);
          var sxp = lerp(-300, W + 300, R()), syp = R() < 0.5 ? H * 0.95 : H * 0.12;
          var fx = lerp(sxp, tx, u * u), fy = lerp(syp, ty, u * u);
          W0.drawRBC(ctx, { x: fx, y: fy, r: (120 + R() * 60) * (1 - 0.6 * u), tiltX: R() * TAU + t, tiltY: R() * 2, blur: 80 * pull + 20, blurAngle: Math.atan2(ty - syp, tx - sxp), alpha: 0.9 * Math.sin(u * Math.PI) });
        }
        if (!ret) ret = { view: 'inside', groundY: W0.sideLayout(ctx, {}).groundY, tear: { x: tx, y: ty, rx: rx, ry: ry } };
      }
    }
    ctx.restore();
    return ret;
  }
  function drawTearHole(ctx, tx, ty, rx, ry, t, pull, seed) {
    function path(sc, jag) {
      ctx.beginPath();
      for (var i = 0; i <= 64; i++) {
        var a = (i / 64) * TAU, k = tearRadius(a, seed) + (jag ? 0.06 * (hash(i * 7 + seed) - 0.5) : 0);
        var X = tx + Math.cos(a) * rx * sc * k, Y = ty + Math.sin(a) * ry * sc * k;
        if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
      }
      ctx.closePath();
    }
    ctx.save();
    // outer torn rim (thick wall layers seen in section)
    path(1.22, true);
    var go = ctx.createRadialGradient(tx, ty, rx * 0.8, tx, ty, rx * 1.3); go.addColorStop(0, '#d8606a'); go.addColorStop(1, 'rgba(120,20,30,0)');
    ctx.fillStyle = go; ctx.fill();
    path(1.1, true); ctx.fillStyle = '#c84a58'; ctx.fill(); // media (smooth muscle)
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,170,170,0.5)'; ctx.lineWidth = 2;
    for (var i = 0; i < 30; i++) { var a = (i / 30) * TAU; ctx.beginPath(); ctx.ellipse(tx + Math.cos(a) * rx * 1.04, ty + Math.sin(a) * ry * 1.04, 22, 6, a + Math.PI / 2, 0, TAU); ctx.stroke(); }
    ctx.restore();
    path(1.0, true); ctx.fillStyle = '#f0b090'; ctx.fill(); // adventitia (collagen-rich)
    // the outside, seen through the hole
    path(0.94, false); ctx.save(); ctx.clip();
    var hole = cached('tearInside', function () {
      var RX = 360, RY = 224, c = mkCanvas(RX * 2.6, RY * 2.6), x = c.getContext('2d'), cx = RX * 1.3, cy = RY * 1.3;
      var gi = x.createRadialGradient(cx, cy, 0, cx, cy, RX * 1.1); gi.addColorStop(0, '#ffd2a0'); gi.addColorStop(0.5, '#d88a6a'); gi.addColorStop(1, '#6a2a2a');
      x.fillStyle = gi; x.fillRect(0, 0, c.width, c.height);
      for (var i = 0; i < 7; i++) { var R = rng(6300 + i); collagenBundle(x, cx - RX * 1.2, cy + (R() - 0.5) * RY * 1.6, cx + RX * 1.2, cy + (R() - 0.5) * RY * 1.6, 16 + R() * 14, 6310 + i, [240, 180, 150], 0.7); }
      return c;
    });
    var hs = rx / 360; ctx.drawImage(hole, tx - hole.width * hs / 2, ty - hole.height * (ry / 224) / 2, hole.width * hs, hole.height * (ry / 224));
    ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, [255, 220, 160], tx, ty, rx * 0.9, 0.5);
    ctx.restore();
    // exposed collagen fibres frayed at the rim, pointing inward
    ctx.lineCap = 'round';
    for (i = 0; i < 26; i++) {
      var aa = (i / 26) * TAU + hash(i + seed) * 0.2, k = tearRadius(aa, seed);
      var x0 = tx + Math.cos(aa) * rx * k * 1.02, y0 = ty + Math.sin(aa) * ry * k * 1.02, len = 30 + 40 * hash(i * 3 + seed), sw = Math.sin(t * 2 + i) * 6 * pull;
      ctx.strokeStyle = 'rgba(255,225,200,0.9)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 - Math.cos(aa) * len * 0.5 + sw, y0 - Math.sin(aa) * len * 0.5, x0 - Math.cos(aa) * len + sw * 2, y0 - Math.sin(aa) * len * 0.7 + 8);
      ctx.stroke(); ctx.strokeStyle = 'rgba(200,120,110,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // endothelium flaps curling at the rim
    for (i = 0; i < 9; i++) {
      aa = (i / 9) * TAU + 0.3; k = tearRadius(aa, seed) * 1.18;
      var fx = tx + Math.cos(aa) * rx * k, fy = ty + Math.sin(aa) * ry * k;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(aa + Math.PI / 2 + Math.sin(t * 1.7 + i) * 0.12 * pull);
      ctx.fillStyle = 'rgba(250,170,170,0.92)'; ctx.strokeStyle = 'rgba(130,30,50,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(0, 26, 40, 0); ctx.quadraticCurveTo(0, 10, -40, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  function vesselTearOutside(ctx, W, H, t, p, pull, o) {
    // tissue background
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a1016'); g.addColorStop(0.5, '#a65a50'); g.addColorStop(1, '#4a1a20');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.7; drawRepeat(ctx, tissueBackTile(55, 0), t * 6, 0, W); ctx.restore();
    var y0 = H * 0.26, y1 = H * 0.56, tx = o.tearX == null ? W * 0.56 : o.tearX, ty = y1 - 6;
    // vessel tube
    var gv = ctx.createLinearGradient(0, y0, 0, y1); gv.addColorStop(0, '#6a0c18'); gv.addColorStop(0.15, '#d03a44'); gv.addColorStop(0.45, '#f0707a'); gv.addColorStop(0.8, '#a01e2c'); gv.addColorStop(1, '#5a0812');
    ctx.fillStyle = gv; ctx.beginPath();
    for (var i = 0; i <= 40; i++) { var X = (i / 40) * (W + 200) - 100; var Y = y0 + 10 * Math.sin(i * 0.25); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    for (i = 40; i >= 0; i--) { X = (i / 40) * (W + 200) - 100; Y = y1 + 10 * Math.sin(i * 0.25 + 0.6); ctx.lineTo(X, Y); }
    ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    // translucent wall: cells flowing inside
    flowRBC(ctx, { t: t, y0: y0 + 30, y1: y1 - 30, n: 26, rMin: 14, rMax: 24, v: 260 * (1 - 0.5 * pull * p), seed: 41, fog: 0.4, alpha: 0.8, blurK: 0.08 });
    ctx.strokeStyle = 'rgba(255,200,190,0.25)'; ctx.lineWidth = 2;
    for (i = 0; i < 30; i++) { var ex = mod(i * 97 - t * 4, W + 200) - 100; ctx.beginPath(); ctx.ellipse(ex, (y0 + y1) / 2, 60, (y1 - y0) / 2, 0, -1.2, 1.2); ctx.stroke(); }
    var sh = ctx.createLinearGradient(0, y0, 0, y1); sh.addColorStop(0, 'rgba(255,230,230,0.35)'); sh.addColorStop(0.3, 'rgba(255,230,230,0)'); sh.addColorStop(1, 'rgba(40,0,10,0.4)');
    ctx.fillStyle = sh; ctx.fillRect(0, y0 - 20, W, y1 - y0 + 40);
    ctx.restore();
    // tear on the lower flank
    var rx = lerp(10, 120, smooth(0, 1, p)), ry = rx * 0.45;
    ctx.save();
    ctx.fillStyle = '#3a0610'; ctx.beginPath();
    for (i = 0; i <= 40; i++) { var a = (i / 40) * TAU, k = tearRadius(a, 5); X = tx + Math.cos(a) * rx * k; Y = ty + Math.sin(a) * ry * k; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ffd0c0'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    // plume of RBCs leaking out and down
    var n = Math.round(40 * p);
    for (i = 0; i < n; i++) {
      var R = rng(6500 + i), u = mod(R() + t * (0.12 + 0.18 * pull), 1);
      var spread = (R() - 0.5) * (200 + 500 * u), px = tx + spread * u + Math.sin(u * 5 + i) * 30, py = ty + 10 + u * (H * 0.4) * (0.6 + R() * 0.6);
      W0.drawRBC(ctx, { x: px, y: py, r: 13 + R() * 9, tiltX: R() * TAU + t * 2, tiltY: R() * 3 + t, fog: 0.2 + 0.5 * u, fogColor: '#6a1a20', alpha: 1 - smooth(0.7, 1, u) });
    }
    // platelets converging
    if (p > 0.8) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var pa = smooth(0.8, 1, p);
      for (i = 0; i < 20; i++) {
        R = rng(6600 + i); u = mod(R() + t * 0.4, 1);
        var sx2 = tx - 900 + R() * 400, sy2 = lerp(y0 + 30, y1 - 30, R());
        glowAt(ctx, [230, 210, 255], lerp(sx2, tx, u), lerp(sy2, ty - 10, u), 12, pa * 0.9 * Math.sin(u * Math.PI));
      }
      ctx.restore();
    }
    return { view: 'outside', groundY: null, tear: { x: tx, y: ty, rx: rx, ry: ry }, vessel: { y0: y0, y1: y1 } };
  }

  /* ================================================================ EPISODE 3 */

  /* ---------------------------------------------------------- COLLAGEN BED */
  function collagenFloorTile() {
    return cached('collFloor', function () {
      var P = 2400, Hh = 420, c = mkCanvas(P, Hh), x = c.getContext('2d'), R = rng(7100);
      var g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#a85048'); g.addColorStop(0.5, '#8a3438'); g.addColorStop(1, '#4a141c');
      x.fillStyle = g; x.fillRect(0, 0, P, Hh);
      // rows of fibrils, thicker toward the viewer (perspective)
      for (var row = 0; row < 22; row++) {
        var v = row / 21, yy = 10 + Math.pow(v, 1.4) * (Hh - 20), w = lerp(12, 50, v), n = Math.round(lerp(12, 7, v));
        for (var i = 0; i < n; i++) {
          var xx = R() * P, L = lerp(400, 900, R()), a = (R() - 0.5) * lerp(0.12, 0.3, v);
          for (var k = -1; k <= 1; k++) collagenBundle(x, xx + k * P - L / 2, yy - Math.sin(a) * L / 2, xx + k * P + L / 2, yy + Math.sin(a) * L / 2, w, 7200 + row * 20 + i, mixC([226, 156, 140], [252, 214, 192], v), lerp(0.75, 1, v));
        }
      }
      var gt = x.createLinearGradient(0, 0, 0, 60); gt.addColorStop(0, 'rgba(40,0,10,0.6)'); gt.addColorStop(1, 'rgba(40,0,10,0)');
      x.fillStyle = gt; x.fillRect(0, 0, P, 60);
      return c;
    });
  }
  /**
   * drawCollagenBed(ctx, {t, scrollX=0, exposure=1, vwf=0, flow=0.5, layer='all'|'back'|'front', groundY=891})
   * 第3話 #10–11「見つけた、コラーゲン！」: the inner face of the torn wall, close up. The ground is a bed of exposed
   * subendothelial collagen fibres (striated D-banding, crimped), seen in shallow perspective. exposure 0..1 peels the
   * endothelial sheet back from the centre (curled flaps at its torn edges; 0 = intact lining). vwf 0..1 grows von
   * Willebrand factor strands — long beaded multimers anchored on the collagen and stretched by the flow (→), glowing
   * pale gold. flow 0..1: plasma/RBC stream overhead (slowed by vasoconstriction at low values).
   * layer 'front' = drifting blurred RBCs in front of the characters. Returns {groundY, horizonY, exposedX0, exposedX1}.
   */
  function drawCollagenBed(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, sx = o.scrollX || 0, layer = o.layer || 'all';
    var ex = o.exposure == null ? 1 : clamp(o.exposure, 0, 1), vwf = clamp(o.vwf || 0, 0, 1), flow = o.flow == null ? 0.5 : clamp(o.flow, 0, 1);
    var gY = o.groundY || Math.round(H * 0.825), hY = gY - 210;
    var half = ex * W * 0.62, ex0 = W / 2 - half, ex1 = W / 2 + half;
    ctx.save();
    if (layer !== 'front') {
      var g = ctx.createLinearGradient(0, 0, 0, hY); g.addColorStop(0, '#2a0408'); g.addColorStop(0.6, '#7a1420'); g.addColorStop(1, '#b8404a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, hY + 4);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      W0.drawLightRays(ctx, { x: W * 0.5, y: -80, t: t, alpha: 0.12, color: '255,190,170', seed: 8 });
      ctx.restore();
      flowRBC(ctx, { t: t, scrollX: sx, y0: 60, y1: hY - 60, n: 12, rMin: 18, rMax: 30, v: 120 + 260 * flow, par: 0.4, seed: 71, fog: 0.55, alpha: 0.8, blurK: 0.0 });
      flowRBC(ctx, { t: t, scrollX: sx, y0: 140, y1: hY - 120, n: 7, rMin: 34, rMax: 50, v: 160 + 340 * flow, par: 0.7, seed: 72, fog: 0.25, blurK: 0.0 });
      // collagen floor
      var ft = collagenFloorTile();
      drawRepeat(ctx, ft, sx, hY, W);
      ctx.fillStyle = 'rgba(30,0,8,0.35)'; ctx.fillRect(0, H - 40, W, 40);
      // endothelium still covering the floor outside the exposed zone
      for (var side = -1; side <= 1; side += 2) {
        var edge = side < 0 ? ex0 : ex1;
        if (side < 0 && edge < -40) continue; if (side > 0 && edge > W + 40) continue;
        ctx.save();
        ctx.beginPath();
        if (side < 0) { ctx.moveTo(-20, hY - 4); ctx.lineTo(edge, hY - 4); ctx.lineTo(edge - 120, H + 10); ctx.lineTo(-20, H + 10); }
        else { ctx.moveTo(W + 20, hY - 4); ctx.lineTo(edge, hY - 4); ctx.lineTo(edge + 120, H + 10); ctx.lineTo(W + 20, H + 10); }
        ctx.closePath();
        var ge = ctx.createLinearGradient(0, hY, 0, H); ge.addColorStop(0, '#d88088'); ge.addColorStop(1, '#8a3040');
        ctx.fillStyle = ge; ctx.fill(); ctx.clip();
        // cobblestone endothelial cells in perspective
        for (var r2 = 0; r2 < 8; r2++) {
          var v = r2 / 7, yy = hY + Math.pow(v, 1.5) * (H - hY), cw = lerp(120, 360, v), chh = lerp(16, 70, v);
          for (var cx0 = -mod(sx * lerp(0.9, 1.1, v), cw) - cw + (r2 % 2) * cw / 2; cx0 < W + cw; cx0 += cw) {
            ctx.fillStyle = 'rgba(255,190,190,0.35)'; ctx.strokeStyle = 'rgba(120,30,50,0.6)'; ctx.lineWidth = lerp(1, 3, v);
            ctx.beginPath(); ctx.ellipse(cx0 + cw / 2, yy, cw * 0.46, chh * 0.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
            ctx.fillStyle = 'rgba(140,90,180,0.75)'; ctx.beginPath(); ctx.ellipse(cx0 + cw / 2, yy - chh * 0.08, cw * 0.14, chh * 0.2, 0, 0, TAU); ctx.fill();
          }
        }
        ctx.restore();
        // torn edge of the endothelial sheet, lifting and curling over the exposed collagen
        ctx.save();
        var lift = 50 + 14 * Math.sin(t * 1.5 + side), e0x = edge, e1x = edge - side * 120;
        ctx.beginPath(); ctx.moveTo(e0x, hY - 4); ctx.lineTo(e1x, H + 10);
        ctx.bezierCurveTo(e1x + side * 160, H - 40 - lift, e0x + side * 90, hY + 200 - lift, e0x + side * 24, hY - 2);
        ctx.closePath();
        var gfl = ctx.createLinearGradient(e0x, 0, e0x + side * 160, 0); gfl.addColorStop(0, '#c86070'); gfl.addColorStop(1, '#ffc4c4');
        ctx.fillStyle = gfl; ctx.fill(); ctx.strokeStyle = 'rgba(120,20,40,0.9)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(e1x, H + 10); ctx.bezierCurveTo(e1x + side * 160, H - 40 - lift, e0x + side * 90, hY + 200 - lift, e0x + side * 24, hY - 2);
        ctx.strokeStyle = 'rgba(255,236,236,0.9)'; ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = 'rgba(140,90,180,0.6)'; ctx.beginPath(); ctx.ellipse(lerp(e0x, e1x, 0.6) + side * 50, lerp(hY, H, 0.6) - lift * 0.5, 22, 10, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
      // horizon soft line
      var gh = ctx.createLinearGradient(0, hY - 30, 0, hY + 40); gh.addColorStop(0, 'rgba(255,170,150,0)'); gh.addColorStop(0.5, 'rgba(255,180,160,0.25)'); gh.addColorStop(1, 'rgba(255,170,150,0)');
      ctx.fillStyle = gh; ctx.fillRect(0, hY - 30, W, 70);
      // vWF strands
      if (vwf > 0) {
        ctx.save(); ctx.lineCap = 'round';
        for (var i = 0; i < 9; i++) {
          var R = rng(7400 + i), ax = mod(R() * 2400 - sx, 2400) - 240;
          if (ax < ex0 || ax > ex1) continue;
          var ay = lerp(hY + 30, gY + 60, R()), len = (260 + R() * 260) * smooth(0, 1, vwf * 1.3 - R() * 0.3), sc = lerp(0.6, 1.2, (ay - hY) / (gY - hY + 60));
          if (len < 5) continue;
          ctx.beginPath(); var beads = [];
          for (var k = 0; k <= 30; k++) {
            var u = k / 30, X = ax + u * len, Y = ay - Math.sin(u * Math.PI * 0.8) * 70 * sc + Math.sin(u * 8 - t * 3 + i) * 10 * u * sc;
            if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); if (k % 3 === 0) beads.push([X, Y]);
          }
          ctx.strokeStyle = 'rgba(255,230,140,0.5)'; ctx.lineWidth = 7 * sc; ctx.stroke();
          ctx.strokeStyle = 'rgba(255,248,210,0.95)'; ctx.lineWidth = 2.2 * sc; ctx.stroke();
          ctx.globalCompositeOperation = 'lighter';
          for (k = 0; k < beads.length; k++) glowAt(ctx, [255, 220, 120], beads[k][0], beads[k][1], 9 * sc, 0.8);
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(ax, ay, 5 * sc, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
    }
    if (layer !== 'back') {
      for (var j = 0; j < 3; j++) {
        var Rj = rng(7500 + j), fx = mod(Rj() * (W + 800) + t * (300 + 500 * flow) - sx * 1.5, W + 800) - 400;
        W0.drawRBC(ctx, { x: fx, y: Rj() < 0.5 ? 90 + Rj() * 80 : H - 60, r: 130 + Rj() * 50, tiltX: Rj() * 3 + t * 0.5, tiltY: Rj() * 2, alpha: 0.75, blur: 60, blurAngle: 0 });
      }
    }
    ctx.restore();
    return { groundY: gY, horizonY: hY, exposedX0: ex0, exposedX1: ex1 };
  }

  /* ------------------------------------------------------------- FIBRIN NET */
  function netGraph(seed, n, W, H) {
    return cached('net_' + seed + '_' + n, function () {
      var R = rng(seed), nodes = [], edges = [], i, j;
      for (i = 0; i < n; i++) nodes.push({ x: (R() * 1.3 - 0.15) * W, y: (R() * 1.3 - 0.15) * H, ph: R() * TAU, d: R() });
      for (i = 0; i < n; i++) {
        var ds = [];
        for (j = 0; j < n; j++) if (j !== i) ds.push([Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y), j]);
        ds.sort(function (a, b) { return a[0] - b[0]; });
        for (var k = 0; k < 4; k++) { var jj = ds[k][1]; if (jj > i || ds[k][0] > 0) { if (!edges.some(function (e) { return (e.a === jj && e.b === i); })) edges.push({ a: i, b: jj, w: Math.pow(R(), 1.6), sag: (R() - 0.5), delay: R() }); } }
      }
      return { nodes: nodes, edges: edges };
    });
  }
  function drawNetLayer(ctx, G, o) {
    var t = o.t, p = o.p, sway = o.sway, wMul = o.width, col = o.col, alpha = o.alpha, ox = o.ox || 0, oy = o.oy || 0;
    var P = G.nodes.map(function (n) { return [n.x + ox + Math.sin(t * 0.7 + n.ph) * 10 * sway, n.y + oy + Math.cos(t * 0.6 + n.ph * 1.3) * 8 * sway]; });
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var cls = 0; cls < 3; cls++) {
      var path = new Path2D(), any = false;
      for (var e = 0; e < G.edges.length; e++) {
        var E = G.edges[e]; if (Math.min(2, Math.floor(E.w * 3)) !== cls) continue;
        var f = clamp(p * 1.7 - E.delay * 0.7, 0, 1); if (f <= 0) continue;
        var A = P[E.a], B = P[E.b], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        var n = Math.max(6, Math.ceil(L * f / 26)), wob = E.sag * L * 0.18, ph = E.delay * 20;
        for (var i = 0; i <= n; i++) {
          var u = (i / n) * f, X = A[0] + dx * u + nx * (Math.sin(u * Math.PI) * wob + Math.sin(u * 9 + ph + t * 0.8 * sway) * 4), Y = A[1] + dy * u + ny * (Math.sin(u * Math.PI) * wob + Math.sin(u * 9 + ph) * 4) + Math.sin(u * Math.PI) * L * 0.05;
          if (i) path.lineTo(X, Y); else path.moveTo(X, Y);
        }
        any = true;
      }
      if (!any) continue;
      var w = wMul * (0.45 + cls * 0.4);
      ctx.lineWidth = w * 1.9; ctx.strokeStyle = rgba(mixC(col, [90, 20, 20], 0.65), 0.45); ctx.stroke(path);
      ctx.lineWidth = w; ctx.strokeStyle = rgb(col); ctx.stroke(path);
      ctx.lineWidth = Math.max(0.8, w * 0.3); ctx.strokeStyle = 'rgba(255,255,248,0.85)'; ctx.stroke(path);
    }
    // branch-point knots (cross-linked by factor XIIIa)
    if (p > 0.5) {
      ctx.fillStyle = rgb(mixC(col, [255, 255, 255], 0.3));
      var kr = wMul * 0.9 * smooth(0.5, 0.9, p);
      for (var i2 = 0; i2 < P.length; i2++) { ctx.beginPath(); ctx.arc(P[i2][0], P[i2][1], kr, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  /**
   * drawFibrinNet(ctx, {t, p=1, sway=1, caught=14, layer='all'|'back'|'front', seed=1})
   * 第3話 #21–24「フィブリンの網」: inside a forming clot. Three depths of fibrin network (cream-white glossy strands,
   * cross-linked knots at the branch points), red-tinted plasma, RBCs trapped in the meshes (deformed, wrapped by
   * strands) and lilac platelet aggregates at some junctions. p 0..1 = polymerisation (strands grow out from the
   * junctions, knots appear after 0.5); sway = how much the net breathes with the pulse. caught = trapped RBC count.
   * layer 'front' = thick near strands crossing in front of characters (they look tangled). Draw it after them.
   * Returns {groundY, holds:[{x,y}]} – points where front strands cross near the centre (hands/torso anchors).
   */
  function drawFibrinNet(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, p = o.p == null ? 1 : clamp(o.p, 0, 1), sway = o.sway == null ? 1 : o.sway;
    var layer = o.layer || 'all', seed = o.seed || 1, caught = o.caught == null ? 14 : o.caught;
    var pulse = W0.heartbeat(t, 72);
    ctx.save();
    if (layer !== 'front') {
      var g = ctx.createRadialGradient(W * 0.5, H * 0.45, 100, W * 0.5, H * 0.5, W * 0.8);
      g.addColorStop(0, '#c0404a'); g.addColorStop(0.6, '#7a1420'); g.addColorStop(1, '#2a0408');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // far net (blurred, cached at full growth)
      var far = cached('netFar_' + seed, function () {
        var c = mkCanvas(W / 2, H / 2), x = c.getContext('2d'); x.filter = 'blur(3px)'; x.scale(0.5, 0.5);
        drawNetLayer(x, netGraph(8000 + seed, 110, W, H), { t: 0, p: 1, sway: 0, width: 6, col: [230, 190, 170], alpha: 0.7 });
        return c;
      });
      ctx.save(); ctx.globalAlpha = 0.6 * smooth(0, 0.6, p); ctx.drawImage(far, Math.sin(t * 0.3) * 6, 0, W, H); ctx.restore();
      W0.drawParticles(ctx, { t: t, seed: 81, count: 50, size: 3, color: '255,200,180', alpha: 0.35, vx: -12, vy: -4 });
      // mid net
      var G = netGraph(8100 + seed, 60, W, H);
      drawNetLayer(ctx, G, { t: t, p: p, sway: sway * (0.6 + 0.4 * pulse), width: 6, col: [244, 226, 196], alpha: 0.95 });
      // trapped RBCs (at the mid layer) + platelet clumps
      var nC = Math.round(caught * smooth(0.2, 0.9, p));
      for (var i = 0; i < nC; i++) {
        var R = rng(8200 + seed * 50 + i), E = G.edges[Math.floor(R() * G.edges.length)], A = G.nodes[E.a], B = G.nodes[E.b], u = 0.3 + R() * 0.4;
        var cx = lerp(A.x, B.x, u) + Math.sin(t * 0.7 + A.ph) * 10 * sway, cy = lerp(A.y, B.y, u) + 20, r = 40 + R() * 22;
        W0.drawRBC(ctx, { x: cx, y: cy, r: r, tiltX: (R() - 0.5) * 1.6, tiltY: (R() - 0.5) * 1.2 + Math.sin(t + i) * 0.05, rot: R() * TAU, deform: 0.15 + R() * 0.25 });
        // strand wrapping across the cell
        ctx.save(); ctx.lineCap = 'round';
        ctx.beginPath(); var a0 = Math.atan2(B.y - A.y, B.x - A.x), bend = (R() < 0.5 ? -1 : 1) * r * 0.55;
        ctx.moveTo(cx - Math.cos(a0) * r * 1.6, cy - Math.sin(a0) * r * 1.6 - 20);
        ctx.bezierCurveTo(cx - Math.cos(a0) * r * 0.6 - Math.sin(a0) * bend, cy - Math.sin(a0) * r * 0.6 + Math.cos(a0) * bend, cx + Math.cos(a0) * r * 0.6 - Math.sin(a0) * bend, cy + Math.sin(a0) * r * 0.6 + Math.cos(a0) * bend, cx + Math.cos(a0) * r * 1.6, cy + Math.sin(a0) * r * 1.6 - 20);
        ctx.strokeStyle = 'rgba(120,70,50,0.45)'; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = '#f6e6c8'; ctx.lineWidth = 3.2; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,250,0.8)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      }
      if (p > 0.3) {
        for (i = 0; i < 6; i++) {
          R = rng(8300 + i); var nd = G.nodes[Math.floor(R() * G.nodes.length)], al = smooth(0.3, 0.7, p);
          var px = nd.x + Math.sin(t * 0.7 + nd.ph) * 10 * sway, py = nd.y + Math.cos(t * 0.6 + nd.ph * 1.3) * 8 * sway;
          for (var k = 0; k < 5; k++) W0.drawPlatelet(ctx, { x: px + (R() - 0.5) * 50, y: py + (R() - 0.5) * 40, r: 13 + R() * 6, rot: R() * TAU, variant: k, alpha: al });
        }
      }
    }
    var holds = [];
    var GF = netGraph(8400 + seed, 12, W, H);
    for (i = 0; i < GF.nodes.length; i++) { var n = GF.nodes[i]; if (n.x > W * 0.25 && n.x < W * 0.75 && n.y > H * 0.2 && n.y < H * 0.8) holds.push({ x: n.x + Math.sin(t * 0.7 + n.ph) * 10 * sway, y: n.y + Math.cos(t * 0.6 + n.ph * 1.3) * 8 * sway }); }
    if (layer !== 'back') {
      drawNetLayer(ctx, GF, { t: t, p: p, sway: sway, width: 13, col: [250, 236, 210], alpha: 0.92 });
    }
    ctx.restore();
    return { groundY: Math.round(H * 0.825), holds: holds };
  }

  /* -------------------------------------------------------- MARROW SINUSOID */
  /* developing / marrow cells, anime-shaded. kind: 'ebB','ebP','ebO','retic','myelo','band','seg','macro','fat','stem' */
  function marrowCell(x, cx, cy, r, kind, seed) {
    var R = rng(seed);
    x.save(); x.translate(cx, cy);
    if (kind === 'fat') {
      var g = x.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
      g.addColorStop(0, '#fffdf2'); g.addColorStop(0.7, '#f7eccb'); g.addColorStop(1, '#e2c99a');
      blobPath(x, 0, 0, r, r * 0.95, R() * 3, seed, 0.04); x.fillStyle = g; x.fill();
      x.strokeStyle = 'rgba(170,120,90,0.9)'; x.lineWidth = 3; x.stroke();
      x.fillStyle = '#9a70b8'; x.beginPath(); x.ellipse(r * 0.82, r * 0.25, r * 0.14, r * 0.06, 1.3, 0, TAU); x.fill(); // flattened peripheral nucleus
      x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.ellipse(-r * 0.35, -r * 0.45, r * 0.3, r * 0.12, -0.5, 0, TAU); x.fill();
      x.restore(); return;
    }
    var cyto, nucR, nucCol = '#5a2c86', nucOff = [0, 0], gran = 0, granCol = null, membrane = 'rgba(120,40,80,0.7)';
    switch (kind) {
      case 'ebB': cyto = ['#9ab0f0', '#5a6cc8']; nucR = 0.62; break;          // basophilic erythroblast: deep blue cytoplasm
      case 'ebP': cyto = ['#c8b0e0', '#9a7ab8']; nucR = 0.5; break;           // polychromatic: grey-violet
      case 'ebO': cyto = ['#ffb0a8', '#e0606a']; nucR = 0.36; nucCol = '#2a0c40'; nucOff = [r * 0.25, 0]; break; // orthochromatic: pink, pyknotic nucleus → being extruded
      case 'retic': cyto = ['#ffa0a0', '#d84050']; nucR = 0; break;
      case 'myelo': cyto = ['#ffd8d0', '#e8a8b0']; nucR = 0.5; gran = 26; granCol = 'rgba(150,60,140,0.7)'; nucOff = [-r * 0.15, 0]; break;
      case 'band': cyto = ['#ffe0d8', '#f0b8b8']; nucR = -1; gran = 18; granCol = 'rgba(230,140,170,0.7)'; break;
      case 'seg': cyto = ['#ffe0d8', '#f0b8b8']; nucR = -2; gran = 18; granCol = 'rgba(230,140,170,0.7)'; break;
      case 'macro': cyto = ['#ffe6dc', '#e8b0a8']; nucR = 0.3; nucCol = '#7a50a8'; break;
      case 'lymph': cyto = ['#c8d8ff', '#8aa0e0']; nucR = 0.74; nucCol = '#4a2a80'; break;
      case 'stem': cyto = ['#e0e8ff', '#a8b4e0']; nucR = 0.72; nucCol = '#6a58b0'; break;
      default: cyto = ['#ffd0c8', '#e09090']; nucR = 0.5;
    }
    var gc = x.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05); gc.addColorStop(0, cyto[0]); gc.addColorStop(1, cyto[1]);
    blobPath(x, 0, 0, r, r * (0.92 + R() * 0.1), R() * 3, seed, kind === 'macro' ? 0.16 : 0.05);
    x.fillStyle = gc; x.fill(); x.strokeStyle = membrane; x.lineWidth = Math.max(1.5, r * 0.05); x.stroke();
    if (gran) { x.fillStyle = granCol; for (var i = 0; i < gran; i++) { var a = R() * TAU, dd = Math.sqrt(R()) * r * 0.8; x.beginPath(); x.arc(Math.cos(a) * dd, Math.sin(a) * dd, r * 0.045, 0, TAU); x.fill(); } }
    if (nucR > 0) {
      var gn = x.createRadialGradient(nucOff[0] - r * nucR * 0.3, nucOff[1] - r * nucR * 0.3, 1, nucOff[0], nucOff[1], r * nucR);
      gn.addColorStop(0, mixHex(nucCol, 0.45)); gn.addColorStop(1, nucCol);
      x.fillStyle = gn; x.beginPath(); x.ellipse(nucOff[0], nucOff[1], r * nucR, r * nucR * 0.94, 0, 0, TAU); x.fill();
      if (kind !== 'ebO') { x.fillStyle = 'rgba(30,10,50,0.35)'; for (i = 0; i < 7; i++) { a = R() * TAU; dd = R() * r * nucR * 0.7; x.beginPath(); x.arc(nucOff[0] + Math.cos(a) * dd, nucOff[1] + Math.sin(a) * dd, r * 0.06, 0, TAU); x.fill(); } }
      if (kind === 'stem' || kind === 'ebB') { x.fillStyle = 'rgba(200,190,255,0.7)'; x.beginPath(); x.arc(nucOff[0] + r * 0.15, nucOff[1] - r * 0.1, r * 0.11, 0, TAU); x.fill(); } // nucleolus
    } else if (nucR === -1) { // band: C-shaped sausage nucleus
      x.strokeStyle = '#5a2c86'; x.lineWidth = r * 0.26; x.lineCap = 'round'; x.beginPath(); x.arc(0, 0, r * 0.45, 0.6, 0.6 + 4.2); x.stroke();
    } else if (nucR === -2) { // segmented: 3 lobes + thin strands
      x.strokeStyle = '#5a2c86'; x.lineWidth = r * 0.06; x.beginPath(); x.moveTo(-r * 0.42, r * 0.1); x.lineTo(0, -r * 0.3); x.lineTo(r * 0.42, r * 0.12); x.stroke();
      x.fillStyle = '#5a2c86'; [[-0.42, 0.1], [0, -0.3], [0.42, 0.12]].forEach(function (q) { x.beginPath(); x.arc(q[0] * r, q[1] * r, r * 0.2, 0, TAU); x.fill(); });
    }
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(-r * 0.38, -r * 0.48, r * 0.3, r * 0.11, -0.5, 0, TAU); x.fill();
    x.restore();
  }
  function mixHex(h, k) { var c = parseInt(h.slice(1), 16); return rgb(mixC([(c >> 16) & 255, (c >> 8) & 255, c & 255], [255, 255, 255], k)); }
  var MS = { sinTop: 150, sinBot: 430 };
  function buildMarrow(W, H) {
    var c = mkCanvas(W, H), x = c.getContext('2d'), R = rng(9100), i, j;
    // stroma
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a1830'); g.addColorStop(0.5, '#8a3a4a'); g.addColorStop(1, '#4a1426');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // reticular fibre mesh
    x.strokeStyle = 'rgba(255,190,200,0.18)'; x.lineWidth = 2;
    for (i = 0; i < 140; i++) { var ax = R() * W, ay = R() * H, l = 60 + R() * 140, a = R() * TAU; x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(ax + Math.cos(a + 0.5) * l * 0.5, ay + Math.sin(a + 0.5) * l * 0.5, ax + Math.cos(a) * l, ay + Math.sin(a) * l); x.stroke(); }
    // bone trabeculae (top-left corner and bottom-right corner): lamellar cream with osteocyte lacunae, lining cells
    function trab(pts) {
      x.save(); x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length; k++) x.lineTo(pts[k][0], pts[k][1]);
      x.closePath();
      var gb = x.createLinearGradient(0, 0, W, H); gb.addColorStop(0, '#fff2dc'); gb.addColorStop(1, '#e8cfa8');
      x.fillStyle = gb; x.fill(); x.strokeStyle = '#c86a7a'; x.lineWidth = 10; x.stroke(); x.strokeStyle = '#ffe0e0'; x.lineWidth = 3; x.stroke();
      x.clip();
      x.strokeStyle = 'rgba(190,150,110,0.45)'; x.lineWidth = 2;
      for (k = 0; k < 18; k++) { x.beginPath(); for (var m = 0; m < pts.length; m++) { var px = lerp(pts[m][0], pts[0][0], k * 0.04), py = lerp(pts[m][1], pts[0][1], k * 0.04); if (m) x.lineTo(px + k * 5, py + k * 5); else x.moveTo(px + k * 5, py + k * 5); } x.stroke(); }
      x.fillStyle = 'rgba(150,100,80,0.75)';
      for (k = 0; k < 26; k++) { x.save(); x.translate(R() * W, R() * H); x.rotate(R()); x.beginPath(); x.ellipse(0, 0, 10, 4, 0, 0, TAU); x.fill(); x.restore(); }
      x.restore();
    }
    trab([[-20, -20], [560, -20], [430, 70], [200, 110], [-20, 160]]);
    trab([[W + 20, H - 330], [W - 260, H - 230], [W - 420, H - 120], [W - 480, H + 20], [W + 20, H + 20]]);
    // fat cells
    var fats = [[1520, 610, 105], [1680, 700, 85], [1380, 760, 70], [300, 900, 100], [120, 700, 90], [860, 980, 80], [1780, 520, 70]];
    fats.forEach(function (f, k) { marrowCell(x, f[0], f[1], f[2], 'fat', 9200 + k); });
    // erythroblastic island (central macrophage + ring of erythroblasts at different stages)
    function island(cx, cy, s, sd) {
      marrowCell(x, cx, cy, 70 * s, 'macro', sd);
      var kinds = ['ebB', 'ebB', 'ebP', 'ebP', 'ebP', 'ebO', 'ebO', 'retic', 'ebP'];
      for (var k = 0; k < kinds.length; k++) { var a = (k / kinds.length) * TAU + 0.3; marrowCell(x, cx + Math.cos(a) * 92 * s, cy + Math.sin(a) * 74 * s, (kinds[k] === 'ebB' ? 34 : kinds[k] === 'retic' ? 24 : 28) * s, kinds[k], sd + k + 1); }
      // extruded nucleus (pyrenocyte) being eaten
      x.fillStyle = '#2a0c40'; x.beginPath(); x.arc(cx + 30 * s, cy - 10 * s, 11 * s, 0, TAU); x.fill();
    }
    island(1060, 720, 1.0, 9300); island(420, 600, 0.8, 9320);
    // granulocytic cells scattered (myelocytes, bands, segmented)
    var kinds = ['myelo', 'ebP', 'band', 'seg', 'myelo', 'band', 'lymph', 'myelo', 'ebB', 'seg'], placed = [];
    for (i = 0; i < 140; i++) {
      var px = R() * W, py = lerp(470, H - 20, R()), bad = false;
      fats.forEach(function (f) { if (Math.hypot(px - f[0], py - f[1]) < f[2] + 40) bad = true; });
      placed.forEach(function (q) { if (Math.hypot(px - q[0], py - q[1]) < 52) bad = true; });
      if (Math.hypot(px - W * 0.34, py - 620) < 230 || Math.hypot(px - 1060, py - 720) < 170 || Math.hypot(px - 420, py - 600) < 140 || (px > W - 480 && py > H - 300) || (px > 560 && px < 760 && py < 640)) bad = true;
      if (bad) continue;
      marrowCell(x, px, py, 20 + R() * 10, kinds[i % kinds.length], 9400 + i); placed.push([px, py]);
    }
    // depth haze toward the bottom
    var gd = x.createLinearGradient(0, 430, 0, H); gd.addColorStop(0, 'rgba(60,10,30,0.25)'); gd.addColorStop(1, 'rgba(60,10,30,0)');
    x.fillStyle = gd; x.fillRect(0, 430, W, H - 430);
    return c;
  }
  /**
   * drawMarrowSinusoid(ctx, {t, mega='site'|'cell'|false, megaX=W*0.34, sprout=1, stem=0, flow=1, scrollX=0})
   * 第3話 #28–35／第4話 #42：骨髄の中（スライド27を模式化）. A wide sinusoid (洞様毛細血管) crosses the top
   * (y≈150–430) with a thin, discontinuous endothelium; newly made cells (reticulocytes, platelets) slip in through
   * gaps in its floor. Below: haematopoietic cords — erythroblastic islands (central macrophage ringed by erythroblasts
   * maturing from deep-blue to pink, extruded nuclei), granulocyte precursors (myelocytes, band and segmented forms),
   * fat cells (large clear vacuoles, flattened nucleus), reticular fibres, and bone trabeculae (lamellae + osteocyte
   * lacunae) in the corners.
   * mega: 'site' (default) = an empty glowing niche against the sinus wall for キョウコ (scale≈1.6, seated) with her
   *   cytoplasmic process reaching through a gap into the lumen; 'cell' = draws a schematic megakaryocyte body there
   *   (multilobed nucleus, granular cytoplasm with demarcation lines) for wide shots without the character; false = none.
   * sprout 0..1: the proplatelet process extends into the lumen and sheds glowing platelets downstream (#30).
   * stem 0..1: brightness of the haematopoietic stem cell's pulsing white-gold light (deep niche, bottom right).
   * flow 0..1: sinus flow. Returns {groundY, sinus:{top,bottom}, mega:{x,y,r,tipX,tipY}, stem:{x,y}, gaps:[{x,y}]}.
   */
  function drawMarrowSinusoid(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, flow = o.flow == null ? 1 : o.flow;
    var mega = o.mega == null ? 'site' : o.mega, mx = o.megaX == null ? W * 0.34 : o.megaX, sprout = o.sprout == null ? 1 : clamp(o.sprout, 0, 1), stem = clamp(o.stem || 0, 0, 1);
    var sT = MS.sinTop, sB = MS.sinBot, my = sB + 190, mr = 200;
    var stX = W - 560, stY = H - 210;
    ctx.save();
    ctx.drawImage(cached('marrow_' + W + 'x' + H, function () { return buildMarrow(W, H); }), 0, 0);
    // megakaryocyte site / cell
    if (mega) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glowAt(ctx, [220, 170, 255], mx, my, mr * 1.8, 0.3 + 0.05 * Math.sin(t * 1.4));
      ctx.restore();
      if (mega === 'cell') {
        ctx.save(); blobPath(ctx, mx, my, mr, mr * 0.9, 0.2, 9500, 0.06, 40);
        var gm = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.35, mr * 0.1, mx, my, mr * 1.05); gm.addColorStop(0, '#f4d8f4'); gm.addColorStop(1, '#b07ac8');
        ctx.fillStyle = gm; ctx.fill(); ctx.strokeStyle = 'rgba(90,30,110,0.85)'; ctx.lineWidth = 4; ctx.stroke(); ctx.clip();
        ctx.strokeStyle = 'rgba(120,60,150,0.35)'; ctx.lineWidth = 2; // demarcation membrane system
        for (var i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(mx + (hash(i) - 0.5) * mr, my + (hash(i + 9) - 0.5) * mr, mr * 0.4, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = 'rgba(150,60,170,0.6)';
        for (i = 0; i < 80; i++) { ctx.beginPath(); ctx.arc(mx + (hash(i * 3) - 0.5) * mr * 1.8, my + (hash(i * 5) - 0.5) * mr * 1.6, 3, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#5a2c86'; // multilobed nucleus
        for (i = 0; i < 6; i++) { var a = (i / 6) * TAU; ctx.beginPath(); ctx.arc(mx + Math.cos(a) * mr * 0.25, my + 10 + Math.sin(a) * mr * 0.2, mr * 0.17, 0, TAU); ctx.fill(); }
        ctx.restore();
      } else {
        ctx.save(); blobPath(ctx, mx, my, mr * 1.05, mr * 0.95, 0.2, 9501, 0.05, 40);
        ctx.fillStyle = 'rgba(70,20,60,0.45)'; ctx.fill(); ctx.strokeStyle = 'rgba(230,180,255,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.restore();
      }
    }
    // sinus lumen
    var gs = ctx.createLinearGradient(0, sT, 0, sB); gs.addColorStop(0, '#9a2030'); gs.addColorStop(0.5, '#d8505a'); gs.addColorStop(1, '#a02434');
    ctx.fillStyle = gs; ctx.fillRect(0, sT, W, sB - sT);
    ctx.save(); ctx.beginPath(); ctx.rect(0, sT, W, sB - sT); ctx.clip();
    flowRBC(ctx, { t: t, scrollX: o.scrollX || 0, y0: sT + 40, y1: sB - 40, n: 14, rMin: 22, rMax: 34, v: 160 * flow, par: 0.6, seed: 95, fog: 0.2, blurK: 0 });
    for (i = 0; i < 10; i++) { var Rp = rng(9600 + i); W0.drawPlatelet(ctx, { x: mod(Rp() * (W + 200) + t * 180 * flow, W + 200) - 100, y: lerp(sT + 30, sB - 30, Rp()), r: 9 + Rp() * 4, rot: Rp() * TAU + t, variant: i }); }
    ctx.restore();
    // endothelium walls (thin, with gaps in the floor)
    var gaps = [];
    for (var wall = 0; wall < 2; wall++) {
      var wy = wall ? sB : sT;
      ctx.save(); ctx.lineCap = 'round';
      var X0 = -20, segs = [];
      for (i = 0; i < 9; i++) { var gx = 140 + i * 230 + (hash(i * 7 + wall) - 0.5) * 60; if (wall && Math.abs(gx - mx) < 120) gx = mx; segs.push(gx); }
      segs.push(W + 60);
      for (i = 0; i < segs.length; i++) {
        var gw = wall ? (Math.abs(segs[i] - mx) < 1 ? 46 : 26) : 0, X1 = segs[i] - gw / 2;
        ctx.strokeStyle = '#7a2038'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(X0, wy); ctx.lineTo(X1, wy); ctx.stroke();
        ctx.strokeStyle = '#f0a0a8'; ctx.lineWidth = 10; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,230,230,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X0, wy - 3); ctx.lineTo(X1, wy - 3); ctx.stroke();
        var cxn = (X0 + X1) / 2; if (X1 - X0 > 80) { ctx.fillStyle = '#8a58b4'; ctx.beginPath(); ctx.ellipse(cxn, wy + (wall ? 6 : -6), 34, 8, 0, 0, TAU); ctx.fill(); }
        if (wall && gw && i < segs.length - 1) gaps.push({ x: segs[i], y: wy });
        X0 = segs[i] + gw / 2;
      }
      ctx.restore();
    }
    // cells squeezing up through two of the gaps (reticulocyte / neutrophil), looping slowly
    for (i = 0; i < 2; i++) {
      var gp = gaps[(i * 3 + 1) % gaps.length]; if (!gp || Math.abs(gp.x - mx) < 1) continue;
      var u = mod(t * 0.12 + i * 0.5, 1), yy = lerp(sB + 70, sB - 60, smooth(0, 1, u)), sqz = 1 - 0.45 * Math.sin(clamp((sB + 40 - yy) / 100, 0, 1) * Math.PI);
      ctx.save(); ctx.translate(gp.x, yy); ctx.scale(sqz, 1 / sqz * 0.9 + 0.1);
      W0.drawRBC(ctx, { x: 0, y: 0, r: 26, tiltX: 1.2, tiltY: 0.3, alpha: 1 - smooth(0.85, 1, u) });
      ctx.restore();
    }
    // proplatelet process from the megakaryocyte through its gap, shedding platelets
    var tipX = mx, tipY = sB;
    if (mega && sprout > 0) {
      var len = lerp(0, 330, smooth(0, 1, sprout)); tipX = mx + len; tipY = sB - 110 * smooth(0, 1, sprout);
      ctx.save(); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mx, my - mr * 0.8); ctx.quadraticCurveTo(mx, sB - 60, tipX, tipY);
      ctx.strokeStyle = 'rgba(90,30,110,0.8)'; ctx.lineWidth = 34; ctx.stroke(); ctx.strokeStyle = '#d8a8ec'; ctx.lineWidth = 26; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,255,0.7)'; ctx.lineWidth = 5; ctx.stroke();
      // beads along the process (future platelets)
      for (i = 1; i <= 6; i++) {
        var q = i / 7; if (q > smooth(0, 1, sprout)) break;
        var bx = lerp(lerp(mx, mx, q), lerp(mx, tipX, q), q), by = lerp(lerp(my - mr * 0.8, sB - 60, q), lerp(sB - 60, tipY, q), q);
        ctx.fillStyle = '#efd2fa'; ctx.beginPath(); ctx.arc(bx, by, 15, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a5ab8'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill();
      }
      ctx.restore();
      // shed platelets drifting downstream, glowing
      if (sprout > 0.6) {
        ctx.save();
        for (i = 0; i < 8; i++) {
          var uu = mod(t * 0.25 + i / 8, 1), ppx = tipX + uu * (W - tipX + 100), ppy = tipY + Math.sin(uu * 7 + i) * 30 - uu * 40;
          ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, [230, 200, 255], ppx, ppy, 30, 0.6 * smooth(0.6, 1, sprout) * (1 - uu));
          ctx.globalCompositeOperation = 'source-over';
          W0.drawPlatelet(ctx, { x: ppx, y: ppy, r: 13, rot: uu * 6 + i, variant: i, alpha: (1 - uu) * smooth(0.6, 1, sprout) });
        }
        ctx.restore();
      }
    }
    // stem cell glow
    if (stem > 0) {
      var pul = 0.6 + 0.4 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.2), 2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glowAt(ctx, [255, 236, 170], stX, stY, 260 * pul, 0.55 * stem);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = clamp(stem * 1.5, 0, 1); marrowCell(ctx, stX, stY, 30, 'stem', 9700); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, [255, 248, 210], stX, stY, 60, stem * pul); ctx.restore();
    }
    W0.drawParticles(ctx, { t: t, seed: 97, count: 40, x: 0, y: sB, w: W, h: H - sB, size: 2.6, color: '255,210,230', alpha: 0.35, vx: -8, vy: -5 });
    ctx.restore();
    return { groundY: Math.round(H * 0.87), sinus: { top: sT, bottom: sB }, mega: { x: mx, y: my, r: mr, tipX: tipX, tipY: tipY }, stem: { x: stX, y: stY }, gaps: gaps };
  }

  /* -------------------------------------------------------------- FLASHBACK */
  /**
   * drawFlashback(ctx, {amount=1, t=0, seed=1, grain=1, vignette=1})
   * 回想フィルター applied over whatever is already on the canvas: desaturate → sepia tone, lifted blacks,
   * warm bloom, soft white-ish vignette edge ("memory" haze), animated film grain, flicker and the odd vertical scratch.
   * amount 0..1 blends from the untouched frame to full sepia (use for the in/out transition).
   */
  function drawFlashback(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], a = clamp(o.amount == null ? 1 : o.amount, 0, 1), t = o.t || 0, seed = o.seed || 1;
    if (a <= 0.001) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#a0723c'; ctx.globalAlpha = a * 0.75; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a; ctx.fillStyle = 'rgba(96,66,38,0.55)'; ctx.fillRect(0, 0, W, H); // lift blacks
    var fl = 0.04 * Math.sin(t * 23 + seed) * Math.sin(t * 7.1);
    ctx.globalCompositeOperation = 'source-over';
    var gv = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    gv.addColorStop(0, 'rgba(255,240,215,0)'); gv.addColorStop(0.7, rgba([250, 230, 200], (0.25 + fl) * (o.vignette == null ? 1 : o.vignette))); gv.addColorStop(1, rgba([255, 244, 225], 0.75 * (o.vignette == null ? 1 : o.vignette)));
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
    // grain
    var gr = o.grain == null ? 1 : o.grain;
    if (gr > 0) {
      var nt = noiseTile(256, 4242, 255);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a * 0.22 * gr;
      var ox = Math.floor(hash(Math.floor(t * 24) + seed) * 256), oy = Math.floor(hash(Math.floor(t * 24) * 7 + seed) * 256);
      for (var y = -oy; y < H; y += 256) for (var x = -ox; x < W; x += 256) ctx.drawImage(nt, x, y);
    }
    // scratches
    ctx.globalCompositeOperation = 'source-over';
    var fr = Math.floor(t * 12);
    for (var i = 0; i < 2; i++) {
      if (hash(fr * 3 + i + seed) < 0.55) continue;
      var sx = hash(fr * 5 + i) * W; ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = i ? 'rgba(255,245,225,1)' : 'rgba(70,45,20,1)'; ctx.fillRect(sx, 0, 1.5, H);
    }
    ctx.restore();
  }

  /* ================================================================ EPISODE 4 */

  /* -------------------------------------------------------------- GLITCH FX */
  /**
   * drawGlitch(ctx, {amount=0..1, t, seed=1, noise=0..1, flash=0..1})
   * Post effect over the current frame: horizontal slice displacement + RGB split (amount), TV static "砂嵐" (noise)
   * and a white flash. Used by drawSimGrid's reset, usable on any frame.
   */
  function drawGlitch(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], a = clamp(o.amount || 0, 0, 1), t = o.t || 0, seed = o.seed || 1, nz = clamp(o.noise || 0, 0, 1);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (a > 0.01) {
      var c = scratchCanvas('glitch', W, H), x = c.getContext('2d'); x.drawImage(ctx.canvas, 0, 0);
      var fr = Math.floor(t * 20), n = Math.round(6 + a * 22);
      for (var i = 0; i < n; i++) {
        var y = hash(fr * 31 + i * 7 + seed) * H, h = 8 + hash(fr * 17 + i) * 110 * a, off = (hash(fr * 13 + i * 3) - 0.5) * 420 * a;
        ctx.drawImage(c, 0, y, W, h, off, y, W, h);
      }
      // RGB split: offset copies in additive red / blue
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * a;
      x.globalCompositeOperation = 'multiply'; x.fillStyle = '#ff0000'; x.fillRect(0, 0, W, H);
      ctx.drawImage(c, 22 * a, 0); ctx.drawImage(c, -10 * a, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    if (nz > 0.01) {
      var nt = noiseTile(256, 911, 255);
      ctx.globalAlpha = nz; var s = 2 + (Math.floor(t * 30) % 2);
      var ox = Math.floor(hash(Math.floor(t * 30) + seed) * 256), oy = Math.floor(hash(Math.floor(t * 30) * 3 + 1) * 256);
      for (var yy = -oy * s; yy < H; yy += 256 * s) for (var xx = -ox * s; xx < W; xx += 256 * s) ctx.drawImage(nt, xx, yy, 256 * s, 256 * s);
      ctx.globalAlpha = nz * 0.5; ctx.fillStyle = '#000';
      for (yy = 0; yy < H; yy += 6) ctx.fillRect(0, yy, W, 2);
      var bar = mod(t * 900, H + 200) - 100; ctx.globalAlpha = nz * 0.4; ctx.fillStyle = '#fff'; ctx.fillRect(0, bar, W, 40);
      ctx.globalAlpha = 1;
    }
    if (o.flash) { ctx.fillStyle = rgba([255, 255, 255], o.flash); ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  /* --------------------------------------------------------------- SIM GRID */
  /**
   * drawSimGrid(ctx, {t, boot=1, reset=0, scrollX=0, speed=0, hue=195, panels=true, label})
   * 第4話「体外実習シミュレーター」: dark navy void, a perspective holographic grid floor (and a faint ceiling grid)
   * running to a glowing horizon, floating hexagon/data panels and rising cyan motes.
   * boot 0..1: grid lines draw outward from the vanishing point with a scan ring (起動). speed: grid z-scroll (u/s).
   * reset 0..1 (リセット): 0–0.3 slice glitch + RGB split grows, 0.3–0.6 static 砂嵐 + "REWIND ◀◀" bars, ~0.5 white
   *   flash, 0.6–1 a scan-line wipe from the top restores a clean grid.
   * label: optional small HUD string top-left (e.g. 'SIMULATION 01'). Returns {groundY, horizonY}.
   */
  function drawSimGrid(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, boot = o.boot == null ? 1 : clamp(o.boot, 0, 1), reset = clamp(o.reset || 0, 0, 1);
    var hue = o.hue == null ? 195 : o.hue, hY = Math.round(H * 0.46), gY = Math.round(H * 0.83), vx = W / 2, sx = o.scrollX || 0;
    var col = 'hsla(' + hue + ',100%,62%,', colB = 'hsla(' + hue + ',100%,85%,';
    ctx.save();
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#01040c'); g.addColorStop(0.42, '#06162e'); g.addColorStop(0.47, '#0c2a50'); g.addColorStop(0.55, '#061428'); g.addColorStop(1, '#01050c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    // horizon glow
    var gh = ctx.createLinearGradient(0, hY - 80, 0, hY + 80); gh.addColorStop(0, col + '0)'); gh.addColorStop(0.5, col + (0.35 * boot).toFixed(3) + ')'); gh.addColorStop(1, col + '0)');
    ctx.fillStyle = gh; ctx.fillRect(0, hY - 80, W, 160);
    // floor + ceiling grid
    var zoff = mod((o.speed || 0) * t, 1), f = 520, camH = 1, reveal = boot * 1.25;
    for (var side = 0; side < 2; side++) {
      var sgn = side ? -1 : 1, ch = side ? 1.6 : 1, aMul = side ? 0.35 : 1;
      ctx.lineCap = 'round';
      // depth lines
      for (var k = 0; k < 26; k++) {
        var z = 0.35 + (k + 1 - zoff) * 0.55, y = hY + sgn * f * camH * ch / z / 2.2;
        if (sgn > 0 && y > H + 5) continue; if (sgn < 0 && y < -5) continue;
        var fade = clamp(1 - z / 14, 0, 1), rv = clamp((reveal * 14 - z) / 3, 0, 1);
        if (rv <= 0) continue;
        var half = W * 0.5 * rv * 1.2;
        ctx.strokeStyle = col + (0.12 * fade * aMul).toFixed(3) + ')'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(vx - half, y); ctx.lineTo(vx + half, y); ctx.stroke();
        ctx.strokeStyle = colB + (0.7 * fade * aMul).toFixed(3) + ')'; ctx.lineWidth = 1.6; ctx.stroke();
      }
      // converging lines
      for (k = -22; k <= 22; k++) {
        var X = (k - mod(sx / 160, 1)) * 0.5, x1 = vx + X * f * 2.6, y1 = sgn > 0 ? H : 0;
        var len = clamp(reveal, 0, 1);
        var ex = lerp(vx + X * 6, x1, len), ey = lerp(hY, y1, len);
        var al = clamp(1 - Math.abs(k) / 24, 0, 1) * aMul;
        ctx.strokeStyle = col + (0.1 * al).toFixed(3) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(vx + X * 6, hY); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = colB + (0.55 * al).toFixed(3) + ')'; ctx.lineWidth = 1.4; ctx.stroke();
      }
    }
    // boot scan ring
    if (boot > 0 && boot < 1) {
      var rr = boot * W * 0.9;
      ctx.save(); ctx.translate(vx, gY); ctx.scale(1, 0.18);
      ctx.strokeStyle = colB + (0.8 * (1 - boot)).toFixed(3) + ')'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    // floating hex panels + data bars
    if (o.panels !== false) {
      for (var i = 0; i < 9; i++) {
        var R = rng(10100 + i), px = R() * W, py = 80 + R() * (hY - 160), s = 30 + R() * 60, bob = Math.sin(t * (0.5 + R()) + i) * 12;
        var al2 = boot * (0.25 + 0.2 * Math.sin(t * 2 + i * 1.7));
        ctx.save(); ctx.translate(px, py + bob); ctx.strokeStyle = colB + al2.toFixed(3) + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); for (var h6 = 0; h6 <= 6; h6++) { var a6 = h6 / 6 * TAU + Math.PI / 6; ctx[h6 ? 'lineTo' : 'moveTo'](Math.cos(a6) * s, Math.sin(a6) * s); } ctx.stroke();
        ctx.fillStyle = col + (al2 * 0.25).toFixed(3) + ')'; ctx.fill();
        for (var b = 0; b < 4; b++) { ctx.fillStyle = colB + (al2 * 0.8).toFixed(3) + ')'; ctx.fillRect(-s * 0.5, -s * 0.35 + b * s * 0.22, s * (0.3 + 0.7 * hash(i * 9 + b + Math.floor(t * 3))), s * 0.08); }
        ctx.restore();
      }
      for (i = 0; i < 50; i++) { R = rng(10200 + i); var u = mod(R() + t * 0.08 * (0.5 + R()), 1); glowAt(ctx, [120, 230, 255], R() * W, lerp(H, hY - 200, u), 3 + R() * 5, boot * 0.7 * Math.sin(u * Math.PI)); }
    }
    ctx.globalCompositeOperation = 'source-over';
    if (o.label) {
      ctx.font = font(26); ctx.fillStyle = colB + (0.85 * boot).toFixed(3) + ')'; ctx.textBaseline = 'top';
      ctx.fillText(o.label, 48, 40); ctx.fillRect(48, 76, 220 * boot, 2);
    }
    W0.drawVignette(ctx, { strength: 0.65 });
    ctx.restore();
    if (reset > 0) {
      var gA = smooth(0, 0.3, reset) * (1 - smooth(0.55, 0.65, reset)), nz = smooth(0.25, 0.38, reset) * (1 - smooth(0.6, 0.72, reset));
      var fl = Math.max(0, 1 - Math.abs(reset - 0.5) / 0.06);
      drawGlitch(ctx, { amount: gA, noise: nz, t: t, flash: fl * 0.9 });
      if (nz > 0.2) { // REWIND HUD
        ctx.save(); ctx.globalAlpha = nz; ctx.font = font(64); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#4cf'; ctx.shadowBlur = 20; ctx.fillText('◀◀ REWIND', W / 2, H * 0.4); ctx.restore();
      }
      if (reset > 0.6) { // wipe: clean frame revealed under a scan line moving down
        var wy = smooth(0.6, 1, reset) * H;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        var gw = ctx.createLinearGradient(0, wy - 60, 0, wy + 4); gw.addColorStop(0, col + '0)'); gw.addColorStop(1, colB + '0.9)');
        ctx.fillStyle = gw; ctx.fillRect(0, wy - 60, W, 64); ctx.restore();
      }
    }
    return { groundY: gY, horizonY: hY };
  }

  /* ------------------------------------------------------------ SLIDE WORLD */
  var SMEAR = {
    good:    { end: 0.68, dens: 1.0, feather: 1, stop: 0, streak: 0, speedK: 1 },
    thick:   { end: 0.30, dens: 1.9, feather: 0.25, stop: 0, streak: 0, speedK: 1 },
    long:    { end: 1.05, dens: 0.7, feather: 0, stop: 0, streak: 0, speedK: 1 },
    stopped: { end: 0.48, dens: 1.1, feather: 0, stop: 1, streak: 0, speedK: 1 },
    streaks: { end: 0.66, dens: 1.1, feather: 0.6, stop: 0, streak: 1, speedK: 1 }
  };
  SMEAR.short = SMEAR.stopped;
  /* film thickness 0..~2 at fractional slide position s (0 = drop line, grows toward the far end) */
  function filmAt(q, s, lat, p) {
    var e = q.end * p; if (s > e + 0.04) return 0;
    var base = q.dens * lerp(1.15, 0.35, clamp(s / Math.max(q.end, 0.01), 0, 1));
    if (q.streak) base *= 0.75 + 0.45 * Math.sin(s * 70) * Math.sin(s * 23 + 1);
    if (q.stop && Math.abs(s - e) < 0.02 && p >= 1) base += 1.2;
    // feathered, tongue-shaped tail
    var tongue = q.feather ? e - (1 - Math.sqrt(Math.max(0, 1 - lat * lat))) * 0.12 * q.feather : e;
    var edge = clamp((tongue - s) / 0.05 + 0.5, 0, 1);
    return base * (q.feather ? edge : (s <= e ? 1 : 0));
  }
  /**
   * drawSlideWorld(ctx, {t, p=1, quality='good', view='persp'|'top', drop=1, spreader=true})
   * 第4話 #6–15 スライドガラスの世界（ウェッジ法・引き伸ばし法）.
   * p 0..1 is the whole wedge-smear motion:
   *   0–0.18 the spreader (引きガラス) comes down with the ≈5 µL drop on the centre of its edge;
   *   0.18–0.32 contact: the blood runs left and right along the contact line (左右に均等に);
   *   0.32–0.92 the spreader at ≈30° is PUSHED away from the drop at constant speed, the film forming behind it;
   *   0.92–1 the spreader lifts away and the film settles.
   * quality: 'good' (羽根状の引き終わり, tongue-shaped feathered end ~2/3 along) | 'thick' (短く厚い: short & dark) |
   *   'long' (引き終わりがない: runs off the end, no feather) | 'stopped' (alias 'short': 途中で止めた — abrupt end with a
   *   ridge of leftover blood) | 'streaks' (縞: transverse bands from uneven speed/pressure).
   * view 'persp': low camera on the glass looking along the slide (characters stand on the glass; the spreader recedes).
   * view 'top': the whole slide from above, frosted label end on the right, smear running right→left (as in the lecture's
   *   table of faults, slide 43). Returns {groundY, horizonY, contact:{y}|{x}, drop:{x,y,r}, slide:{x,y,w,h} (top view)}.
   */
  function drawSlideWorld(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, p = o.p == null ? 1 : clamp(o.p, 0, 1), q = SMEAR[o.quality || 'good'] || SMEAR.good;
    var push = smooth(0.32, 0.92, p), contact = smooth(0.18, 0.32, p), desc = smooth(0, 0.18, p), lift = smooth(0.92, 1, p);
    if (q.stop) push = Math.min(push, 1) * 1; // stops at q.end anyway
    ctx.save();
    var ret = (o.view === 'top') ? slideTop(ctx, W, H, t, p, q, push, contact, desc) : slidePersp(ctx, W, H, t, p, q, push, contact, desc, lift, o);
    ctx.restore();
    return ret;
  }
  function slidePersp(ctx, W, H, t, p, q, push, contact, desc, lift, o) {
    var hY = Math.round(H * 0.30), f = 900, camH = 1.25, vx = W / 2;
    function P(X, Z, Y) { return [vx + f * X / Z, hY + f * (camH - (Y || 0)) / Z]; }
    var Z0 = 1.3, Z1 = 14, slideHalf = 2.2; // slide spans Z0..Z1 (pos s=0..1 maps to Z = Zd..Zend)
    var Zd = 2.1, Zspan = 10.5;
    function Zs(s) { return Zd + s * Zspan; }
    // lab backdrop above the horizon
    var g = ctx.createLinearGradient(0, 0, 0, hY); g.addColorStop(0, '#1a2430'); g.addColorStop(1, '#5a6c80');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hY + 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 14; i++) { var R = rng(11000 + i); glowAt(ctx, [200, 230, 255], R() * W, R() * hY * 0.9, 30 + R() * 90, 0.25); }
    ctx.restore();
    // bench beyond the glass edges
    var gb = ctx.createLinearGradient(0, hY, 0, H); gb.addColorStop(0, '#3a4654'); gb.addColorStop(1, '#10161e');
    ctx.fillStyle = gb; ctx.fillRect(0, hY, W, H - hY);
    // glass slab (top surface + bevel edges)
    var a1 = P(-slideHalf, Z0), a2 = P(slideHalf, Z0), b1 = P(-slideHalf, Z1), b2 = P(slideHalf, Z1);
    ctx.beginPath(); ctx.moveTo(a1[0], H + 400); ctx.lineTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(a2[0], H + 400); ctx.closePath();
    var gg = ctx.createLinearGradient(0, hY, 0, H); gg.addColorStop(0, '#dfeef4'); gg.addColorStop(0.4, '#c8dde8'); gg.addColorStop(1, '#a8c4d4');
    ctx.fillStyle = gg; ctx.fill();
    ctx.save(); ctx.clip();
    // reflections / caustics on glass
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < 6; i++) { R = rng(11100 + i); var cx = lerp(W * 0.2, W * 0.8, R()); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(cx, hY); ctx.lineTo(cx + 160, hY); ctx.lineTo(cx + 600 * (R() - 0.3), H); ctx.lineTo(cx - 300 * R(), H); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    // frosted label end far away (beyond Z = Zd? it's behind the camera in real life; here the far end shows the clean glass end)
    // film
    var eCur = q.end * push, rows = 70;
    for (var r = rows - 1; r >= 0; r--) {
      var s0 = r / rows * 1.05, s1 = (r + 1) / rows * 1.05;
      if (s0 > eCur + 0.05) continue;
      var zA = Zs(s0), zB = Zs(s1), segs = 16;
      for (var c = 0; c < segs; c++) {
        var l0 = -1 + 2 * c / segs, l1 = -1 + 2 * (c + 1) / segs, lm = (l0 + l1) / 2;
        var th = filmAt(q, (s0 + s1) / 2, lm, push) * contact;
        if (th <= 0.01) continue;
        var X0 = l0 * slideHalf * 0.86, X1 = l1 * slideHalf * 0.86;
        var p1 = P(X0, zA), p2 = P(X1, zA), p3 = P(X1, zB), p4 = P(X0, zB);
        ctx.fillStyle = rgba(mixC([235, 120, 120], [150, 10, 30], clamp(th / 1.6, 0, 1)), clamp(0.25 + th * 0.55, 0, 0.95));
        ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0] + 0.5, p2[1]); ctx.lineTo(p3[0] + 0.5, p3[1] - 0.5); ctx.lineTo(p4[0], p4[1] - 0.5); ctx.fill();
      }
    }
    // cells in the film (speckle, sparser toward the feathered end)
    if (contact > 0) {
      for (i = 0; i < 520; i++) {
        R = rng(11300 + i); var ss = R() * 1.05, lt = R() * 2 - 1, thc = filmAt(q, ss, lt, push) * contact;
        if (thc <= 0.05 || R() > clamp(thc, 0.15, 1)) continue;
        var pp = P(lt * slideHalf * 0.86, Zs(ss)), rr0 = 30 / Zs(ss);
        ctx.fillStyle = rgba([200, 40, 60], 0.5); ctx.beginPath(); ctx.ellipse(pp[0], pp[1], rr0, rr0 * 0.45 * (1.4 * camH / Zs(ss) + 0.3), 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,200,200,0.5)'; ctx.beginPath(); ctx.ellipse(pp[0], pp[1], rr0 * 0.4, rr0 * 0.15, 0, 0, TAU); ctx.fill();
      }
    }
    // blood line along the spreader's contact edge (before/while pushing)
    var Zc = Zs(eCur);
    if (contact > 0 && lift < 1) {
      var spread = contact * slideHalf * 0.86, cl = P(-spread, Zc), cr = P(spread, Zc), lineH = 26 * 2.1 / Zc * (1 - 0.6 * push);
      var gl = ctx.createLinearGradient(0, cl[1] - lineH, 0, cl[1] + lineH * 0.4); gl.addColorStop(0, '#ff6a72'); gl.addColorStop(0.5, '#c81e30'); gl.addColorStop(1, '#7a0a18');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(cl[0], cl[1]); ctx.quadraticCurveTo((cl[0] + cr[0]) / 2, cl[1] - lineH * 2, cr[0], cr[1]); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(cl[0] + 20, cl[1] - lineH * 0.8, (cr[0] - cl[0]) - 40, 2);
    }
    ctx.restore();
    // glass edge highlights
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(a1[0], H + 400); ctx.lineTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(a2[0], H + 400); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,200,220,0.5)'; ctx.lineWidth = 12; ctx.stroke();
    // the spreader glass: tilted 30°, leaning back over the blood (toward the camera)
    if (o.spreader !== false && lift < 1) {
      var ang = Math.PI / 6, Lg = 6, hov = (1 - desc) * 0.9 + lift * 1.6;
      var ZcS = desc < 1 ? Zs(0) : Zc;
      var e1 = P(-slideHalf * 1.05, ZcS, hov), e2 = P(slideHalf * 1.05, ZcS, hov);
      var Zt = Math.max(0.45, ZcS - Lg * Math.cos(ang)), Yt = hov + (ZcS - Zt) * Math.tan(ang);
      var tt1 = P(-slideHalf * 1.05, Zt, Yt), tt2 = P(slideHalf * 1.05, Zt, Yt);
      ctx.save(); ctx.globalAlpha = 1 - lift;
      ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.lineTo(tt2[0], tt2[1]); ctx.lineTo(tt1[0], tt1[1]); ctx.closePath();
      var gs = ctx.createLinearGradient(0, e1[1], 0, Math.min(tt1[1], 0)); gs.addColorStop(0, 'rgba(210,240,250,0.45)'); gs.addColorStop(1, 'rgba(160,210,230,0.10)');
      ctx.fillStyle = gs; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke();
      // thickness of the glass edge (double highlight) + soft reflection band
      ctx.strokeStyle = 'rgba(120,200,225,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e1[0], e1[1] - 10); ctx.lineTo(e2[0], e2[1] - 10); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath(); ctx.moveTo(lerp(e1[0], e2[0], 0.55), e1[1]); ctx.lineTo(lerp(e1[0], e2[0], 0.7), e1[1]); ctx.lineTo(lerp(tt1[0], tt2[0], 0.75), tt1[1]); ctx.lineTo(lerp(tt1[0], tt2[0], 0.6), tt1[1]); ctx.fill();
      ctx.restore();
      // hanging drop (before contact) at the centre of the edge
      if (contact < 1) {
        var dp = P(0, ZcS, hov), dr = 70 * 2.1 / ZcS * (1 - contact * 0.7);
        var gd = ctx.createRadialGradient(dp[0] - dr * 0.3, dp[1] + dr * 0.2, dr * 0.1, dp[0], dp[1] + dr * 0.5, dr * 1.1);
        gd.addColorStop(0, '#ff8a90'); gd.addColorStop(0.4, '#d82638'); gd.addColorStop(1, '#6a0612');
        ctx.fillStyle = gd; ctx.beginPath(); ctx.ellipse(dp[0], dp[1] + dr * 0.35, dr * (1 + contact * 2), dr * (0.75 - contact * 0.4), 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(dp[0] - dr * 0.35, dp[1] + dr * 0.45, dr * 0.18, dr * 0.08, 0.3, 0, TAU); ctx.fill();
      }
    }
    var dropP = P(0, Zs(0));
    return { view: 'persp', groundY: Math.round(H * 0.86), horizonY: hY, contact: { y: P(0, Zc)[1] }, drop: { x: dropP[0], y: dropP[1], r: 70 } };
  }
  function slideTop(ctx, W, H, t, p, q, push, contact, desc) {
    var g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7); g.addColorStop(0, '#3a4a5c'); g.addColorStop(1, '#0e141c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var sw = W * 0.82, sh = sw / 2.9, sx = (W - sw) / 2, sy = H * 0.42 - sh / 2;
    // shadow + glass
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    roundRect(ctx, sx, sy, sw, sh, 10); ctx.fillStyle = 'rgba(214,232,240,0.9)'; ctx.fill(); ctx.restore();
    roundRect(ctx, sx, sy, sw, sh, 10); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 4; ctx.stroke();
    // frosted end (right)
    var fw = sw * 0.22; ctx.fillStyle = 'rgba(245,248,250,0.95)'; ctx.fillRect(sx + sw - fw, sy + 2, fw - 2, sh - 4);
    var nt = noiseTile(128, 77, 40); ctx.save(); ctx.beginPath(); ctx.rect(sx + sw - fw, sy, fw, sh); ctx.clip();
    for (var yy = sy; yy < sy + sh; yy += 128) for (var xx = sx + sw - fw; xx < sx + sw; xx += 128) ctx.drawImage(nt, xx, yy);
    ctx.restore();
    // smear: from the drop line next to the frosted end toward the left
    ctx.save(); roundRect(ctx, sx, sy, sw, sh, 10); ctx.clip();
    var x0 = sx + sw - fw - sw * 0.04, len = (sw - fw) * 0.98, cyy = sy + sh / 2, hh = sh * 0.42 * (0.4 + 0.6 * contact);
    var N = 160, M = 24;
    for (var i = 0; i < N; i++) {
      var s = i / N * 1.05, xA = x0 - s * len, xB = x0 - (i + 1) / N * 1.05 * len;
      for (var j = 0; j < M; j++) {
        var lat = -1 + 2 * (j + 0.5) / M, th = filmAt(q, s, lat, Math.max(push, 0.0001)) * contact;
        if (th <= 0.01) continue;
        ctx.fillStyle = rgba(mixC([240, 140, 150], [140, 10, 40], clamp(th / 1.6, 0, 1)), clamp(0.2 + th * 0.6, 0, 0.95));
        ctx.fillRect(xB, cyy + lat * hh - hh / M, xA - xB + 0.6, 2 * hh / M + 0.6);
      }
    }
    // drop (before spreading)
    if (contact < 1) {
      var dr = sh * 0.12 * (1 - contact * 0.6);
      var gd = ctx.createRadialGradient(x0 - dr * 0.3, cyy - dr * 0.3, 1, x0, cyy, dr);
      gd.addColorStop(0, '#ff8a90'); gd.addColorStop(0.5, '#d02236'); gd.addColorStop(1, '#7a0a18');
      ctx.fillStyle = gd; ctx.beginPath(); ctx.ellipse(x0, cyy, dr * (1 - contact * 0.7), dr * (1 + contact * 3), 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // spreader (seen from above: a glass bar across the slide at the contact line)
    var cx = x0 - q.end * push * len;
    if (p < 0.97) {
      ctx.save(); ctx.globalAlpha = 1 - smooth(0.92, 0.97, p);
      var dy = (1 - smooth(0, 0.18, p)) * -60;
      ctx.fillStyle = 'rgba(200,236,250,0.45)'; ctx.fillRect(cx - 4, sy - sh * 0.15 + dy, 90, sh * 1.3);
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; ctx.strokeRect(cx - 4, sy - sh * 0.15 + dy, 90, sh * 1.3);
      ctx.restore();
      // push arrow
      if (p > 0.32 && p < 0.92) {
        ctx.save(); ctx.fillStyle = 'rgba(255,230,120,0.9)'; ctx.beginPath();
        var ay = sy - sh * 0.3; ctx.moveTo(cx - 40, ay); ctx.lineTo(cx + 40, ay - 22); ctx.lineTo(cx + 40, ay + 22); ctx.closePath(); ctx.fill(); ctx.fillRect(cx + 40, ay - 8, 90, 16); ctx.restore();
      }
    }
    return { view: 'top', groundY: null, horizonY: null, contact: { x: cx }, drop: { x: x0, y: cyy, r: sh * 0.12 }, slide: { x: sx, y: sy, w: sw, h: sh } };
  }

  /* ----------------------------------------------------- STAINED CELLS (Giemsa) */
  // diameters in µm (drawn sizes; smears spread cells: slide 47-style relative sizes)
  var CELL_UM = { rbc: 7.5, platelet: 2.6, neutrophil: 12, band: 12, eosinophil: 14, basophil: 12, lymphocyte: 8.5, lgl: 12, monocyte: 16 };
  function stainedSprite(type, seed) {
    return cached('st_' + type + '_' + seed, function () {
      var S = 160, c = mkCanvas(S, S), x = c.getContext('2d'), r = 64, R = rng(seed * 97 + type.length * 13);
      x.translate(S / 2, S / 2);
      function body(c0, c1, amp) {
        blobPath(x, 0, 0, r, r * (0.93 + R() * 0.08), R() * 3, seed + 3, amp);
        var g = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r); g.addColorStop(0, c0); g.addColorStop(1, c1);
        x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(120,70,110,0.35)'; x.lineWidth = 2; x.stroke();
      }
      function lobe(cx, cy, rx, ry, rot, col) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, TAU); x.fill(); }
      function chromatin(n, col, area) { x.fillStyle = col; for (var i = 0; i < n; i++) { var a = R() * TAU, d = Math.sqrt(R()) * area; x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d, 2 + R() * 3, 0, TAU); x.fill(); } }
      var NUC = '#4a2470', NUC2 = '#6a3a94';
      switch (type) {
        case 'rbc': {
          x.beginPath(); x.arc(0, 0, r, 0, TAU);
          var g = x.createRadialGradient(0, 0, r * 0.05, 0, 0, r);
          g.addColorStop(0, '#fbe6e2'); g.addColorStop(0.3, '#f6d0ca'); g.addColorStop(0.55, '#ea9e9c'); g.addColorStop(0.85, '#de8486'); g.addColorStop(1, '#c8707a');
          x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(170,80,100,0.5)'; x.lineWidth = 2; x.stroke();
          break;
        }
        case 'platelet': {
          x.fillStyle = 'rgba(190,160,220,0.55)'; blobPath(x, 0, 0, r * 0.9, r * 0.75, R(), seed, 0.18); x.fill();
          x.fillStyle = '#6a3a9a'; for (var i = 0; i < 14; i++) { var a = R() * TAU, dd = Math.sqrt(R()) * r * 0.45; x.beginPath(); x.arc(Math.cos(a) * dd, Math.sin(a) * dd, 5 + R() * 4, 0, TAU); x.fill(); }
          break;
        }
        case 'neutrophil': case 'band': {
          body('#f4dde6', '#e2bccc', 0.04);
          x.fillStyle = 'rgba(200,130,170,0.45)'; for (i = 0; i < 160; i++) { a = R() * TAU; dd = Math.sqrt(R()) * r * 0.9; x.fillRect(Math.cos(a) * dd, Math.sin(a) * dd, 1.6, 1.6); }
          x.strokeStyle = NUC; x.lineCap = 'round';
          if (type === 'band') { x.lineWidth = r * 0.24; x.beginPath(); x.arc(0, r * 0.08, r * 0.45, 0.7, 0.7 + 4.3); x.stroke(); x.strokeStyle = NUC2; x.lineWidth = r * 0.08; x.stroke(); }
          else {
            var lobes = 3 + Math.floor(R() * 2), pts = [];
            for (i = 0; i < lobes; i++) { a = Math.PI * 0.9 + i / (lobes - 1) * Math.PI * 1.25 + (R() - 0.5) * 0.3; pts.push([Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42]); }
            x.lineWidth = 2.5; x.beginPath(); pts.forEach(function (q, k) { x[k ? 'lineTo' : 'moveTo'](q[0], q[1]); }); x.stroke();
            x.lineWidth = r * 0.07; x.stroke(); pts.forEach(function (q) { lobe(q[0], q[1], r * 0.26, r * 0.2, R() * 3, NUC); });
            chromatin(0, NUC2, 0);
          }
          break;
        }
        case 'eosinophil': {
          body('#f8dcd0', '#f0c0b0', 0.04);
          lobe(-r * 0.3, -r * 0.05, r * 0.27, r * 0.23, 0.3, NUC); lobe(r * 0.3, r * 0.02, r * 0.27, r * 0.23, -0.3, NUC);
          x.strokeStyle = NUC; x.lineWidth = 3; x.beginPath(); x.moveTo(-r * 0.1, 0); x.lineTo(r * 0.1, 0); x.stroke();
          for (i = 0; i < 120; i++) { a = R() * TAU; dd = Math.sqrt(R()) * r * 0.9; var gx = Math.cos(a) * dd, gy = Math.sin(a) * dd;
            x.fillStyle = R() < 0.5 ? '#f0602e' : '#e8481e'; x.beginPath(); x.arc(gx, gy, 4.2 + R() * 1.4, 0, TAU); x.fill();
            x.fillStyle = 'rgba(255,200,160,0.6)'; x.beginPath(); x.arc(gx - 1.2, gy - 1.2, 1.3, 0, TAU); x.fill(); }
          break;
        }
        case 'basophil': {
          body('#eedde8', '#d8c0d8', 0.05);
          lobe(0, 0, r * 0.42, r * 0.34, 0.4, '#7a5aa0');
          for (i = 0; i < 70; i++) { a = R() * TAU; dd = Math.sqrt(R()) * r * 0.85; var sz = 3 + R() * 7.5;
            x.fillStyle = R() < 0.5 ? '#2a1040' : '#3c1650'; x.beginPath(); x.arc(Math.cos(a) * dd, Math.sin(a) * dd, sz, 0, TAU); x.fill(); }
          x.fillStyle = 'rgba(245,235,242,0.95)'; for (i = 0; i < 5; i++) { a = R() * TAU; dd = r * (0.3 + R() * 0.5); x.beginPath(); x.arc(Math.cos(a) * dd, Math.sin(a) * dd, 4 + R() * 4, 0, TAU); x.fill(); } // vacuoles (dissolved granules)
          break;
        }
        case 'lymphocyte': case 'lgl': {
          var big = type === 'lgl';
          body('#cfe6fb', '#8fc0ec', 0.03);
          var nr = big ? 0.55 : 0.8;
          x.fillStyle = NUC; x.beginPath(); x.ellipse(big ? -r * 0.18 : -r * 0.04, 0, r * nr, r * nr * 0.94, 0, 0, TAU); x.fill();
          chromatin(26, '#2e1250', r * nr * 0.8);
          if (big) { for (i = 0; i < 6; i++) { a = -0.9 + R() * 1.8; dd = r * (0.55 + R() * 0.25); x.fillStyle = '#b8285a'; x.beginPath(); x.arc(Math.cos(a) * dd, Math.sin(a) * dd, 4.2 + R() * 1.5, 0, TAU); x.fill(); } }
          break;
        }
        case 'monocyte': {
          body('#d6dce6', '#aab6c8', 0.07);
          x.fillStyle = 'rgba(255,255,255,0.15)'; for (i = 0; i < 200; i++) { a = R() * TAU; dd = Math.sqrt(R()) * r; x.fillRect(Math.cos(a) * dd, Math.sin(a) * dd, 2, 2); } // ground glass
          x.save(); x.beginPath(); x.ellipse(-r * 0.05, -r * 0.05, r * 0.55, r * 0.46, 0.2, 0, TAU); x.ellipse(r * 0.22, r * 0.28, r * 0.22, r * 0.2, 0, 0, TAU, true);
          x.fillStyle = '#6a4a9a'; x.fill('evenodd'); x.clip('evenodd');
          x.strokeStyle = 'rgba(60,30,100,0.7)'; x.lineWidth = 2; for (i = 0; i < 16; i++) { x.beginPath(); x.moveTo((R() - 0.5) * r, (R() - 0.5) * r); x.quadraticCurveTo((R() - 0.5) * r, (R() - 0.5) * r, (R() - 0.5) * r, (R() - 0.5) * r); x.stroke(); }
          x.restore();
          x.fillStyle = 'rgba(245,248,252,0.8)'; for (i = 0; i < 4; i++) { a = R() * TAU; dd = r * (0.6 + R() * 0.25); x.beginPath(); x.arc(Math.cos(a) * dd, Math.sin(a) * dd, 3 + R() * 3, 0, TAU); x.fill(); }
          break;
        }
      }
      return c;
    });
  }
  function blurredSprite(type, seed, lvl) {
    if (!lvl) return stainedSprite(type, seed);
    return cached('stb_' + type + '_' + seed + '_' + lvl, function () {
      var src = stainedSprite(type, seed), c = mkCanvas(src.width, src.height), x = c.getContext('2d');
      x.filter = 'blur(' + [0, 2, 5, 10][lvl] + 'px)'; x.drawImage(src, 0, 0); return c;
    });
  }
  /**
   * drawStainedCell(ctx, {type, x, y, r, rot=0, seed=1, focus=1, alpha=1})
   * One Giemsa-stained blood cell as seen in the microscope (flat, translucent, textbook colours):
   *   rbc (pink, central pallor) / platelet (purple granular) / neutrophil (pale-pink cytoplasm, fine granules, 3–4 lobes)
   *   / band (C-shaped band nucleus) / eosinophil (spectacle-shaped bilobed nucleus, coarse orange-red granules)
   *   / basophil (large uneven blue-black granules over the nucleus, a few vacuoles) / lymphocyte (round dark nucleus,
   *   thin sky-blue rim) / lgl (more cytoplasm, a few coarse red granules) / monocyte (kidney/horseshoe lacy nucleus,
   *   grey-blue ground-glass cytoplasm, vacuoles). r = on-screen radius. focus 0..1 (1 sharp).
   */
  function drawStainedCell(ctx, o) {
    var type = o.type || 'rbc', seed = o.seed == null ? 1 : o.seed, r = o.r || 40, f = o.focus == null ? 1 : clamp(o.focus, 0, 1);
    var lv = (1 - f) * 3, l0 = Math.floor(lv), l1 = Math.min(3, l0 + 1), k = lv - l0;
    ctx.save(); ctx.translate(o.x || 0, o.y || 0); if (o.rot) ctx.rotate(o.rot);
    var s = r / 64 * 160, a = o.alpha == null ? 1 : o.alpha, ga = ctx.globalAlpha;
    ctx.globalAlpha = ga * a * (k > 0 ? 1 - k : 1); ctx.drawImage(blurredSprite(type, seed, l0), -s / 2, -s / 2, s, s);
    if (k > 0.01 && l1 !== l0) { ctx.globalAlpha = ga * a * k; ctx.drawImage(blurredSprite(type, seed, l1), -s / 2, -s / 2, s, s); }
    ctx.restore();
  }

  /* ------------------------------------------------------- MICROSCOPE FIELD */
  /**
   * drawMicroscopeField(ctx, {t, zoom=1, focus=1, cells='body'|'feather'|'thick', pan={x,y}|number, wbcs=[], seed=1,
   *                           cx, cy, radius, pointer=false, light=1})
   * 第4話 #22–37 顕微鏡の丸い視野. A circular eyepiece field (radius≈0.47H) over black, with soft edge falloff,
   * a faint chromatic rim and uneven (Köhler) illumination. Inside: a Giemsa-stained smear generated procedurally and
   * seamlessly (pan in µm: number = x only, or {x,y}; it scrolls the slide under the lens).
   *   cells 'body'   = the good zone (引き終わりから1/5〜1/3): a monolayer of pink RBCs just touching, central pallor visible,
   *                    platelets ≈ 1 per 20 RBCs; WBCs only where you put them (real ratio 1–2 per 1000 RBCs).
   *         'thick'  = 厚い部分: RBCs piled and overlapping (rouleaux-like stacks), darker, no pallor — unsuitable.
   *         'feather'= 薄すぎ: sparse, over-flattened RBCs without pallor, some broken cells.
   * zoom: magnification factor (1 → 9 px/µm, an RBC ≈ 68 px across). focus 0..1 (1 sharp; low = blur + defocus halo).
   * wbcs: [{type, x, y, seed, rot}] in slide µm (x,y relative to the slide origin, i.e. at pan 0 → field centre).
   * pointer: draws the eyepiece pointer needle. Returns {cx, cy, R, scale (px/µm), wbcs:[{type,x,y,r}] (screen)}.
   */
  function drawMicroscopeField(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t || 0, zoom = o.zoom || 1, focus = o.focus == null ? 1 : clamp(o.focus, 0, 1);
    var mode = o.cells || 'body', seed = o.seed || 1, cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H * 0.46 : o.cy, Rf = o.radius || H * 0.47;
    var pan = o.pan || 0, px = typeof pan === 'number' ? pan : (pan.x || 0), py = typeof pan === 'number' ? 0 : (pan.y || 0);
    var sc = 9 * zoom, light = o.light == null ? 1 : o.light;
    ctx.save();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.arc(cx, cy, Rf, 0, TAU); ctx.save(); ctx.clip();
    var bgc = mode === 'thick' ? [236, 200, 204] : [244, 232, 234];
    var gbg = ctx.createRadialGradient(cx - Rf * 0.15, cy - Rf * 0.2, Rf * 0.1, cx, cy, Rf);
    gbg.addColorStop(0, rgb(mixC(bgc, [255, 255, 255], 0.5 * light))); gbg.addColorStop(1, rgb(mixC(bgc, [200, 180, 190], 0.25)));
    ctx.fillStyle = gbg; ctx.fillRect(cx - Rf, cy - Rf, Rf * 2, Rf * 2);
    // cells
    var cellsPx = 30 * sc, um0x = px - (Rf + 40) / sc, um1x = px + (Rf + 40) / sc, um0y = py - (Rf + 40) / sc, um1y = py + (Rf + 40) / sc;
    var cs = mode === 'body' ? 8.0 : 9.0; // lattice spacing (µm) for RBCs
    var wb = (o.wbcs || []).map(function (w) { return { type: w.type, x: w.x || 0, y: w.y || 0, seed: w.seed == null ? 1 : w.seed, rot: w.rot || 0, r: (CELL_UM[w.type] || 12) / 2 }; });
    var dens = mode === 'thick' ? 1.9 : mode === 'feather' ? 0.35 : 1.0, rScale = mode === 'feather' ? 1.12 : 1.0;
    var gx0 = Math.floor(um0x / cs) - 1, gx1 = Math.ceil(um1x / cs) + 1, gy0 = Math.floor(um0y / cs) - 1, gy1 = Math.ceil(um1y / cs) + 1;
    var foc = focus;
    for (var gy = gy0; gy <= gy1; gy++) for (var gx = gx0; gx <= gx1; gx++) {
      var base = gx * 7349 + gy * 3571 + seed * 101, nC = mode === 'thick' ? 2 : 1;
      for (var k = 0; k < nC + (mode === 'body' && hash(base + 9) < 0.12 ? 1 : 0); k++) {
        var hh = hash(base + k * 17);
        if (hh > dens - (k ? 0.95 : 0) && mode !== 'thick') continue;
        if (mode === 'thick' && k === 1 && hh > 0.85) continue;
        var ux = (gx + 0.5) * cs + (hash(base + k * 31 + 1) - 0.5) * cs * (mode === 'body' ? 0.35 : 0.9) + (gy % 2) * cs * 0.5;
        var uy = (gy + 0.5) * cs * 0.88 + (hash(base + k * 31 + 2) - 0.5) * cs * (mode === 'body' ? 0.35 : 0.9);
        var sx = cx + (ux - px) * sc, sy = cy + (uy - py) * sc;
        if (Math.hypot(sx - cx, sy - cy) > Rf + 50) continue;
        var skip = false; for (var w = 0; w < wb.length; w++) if (Math.hypot(ux - wb[w].x, uy - wb[w].y) < wb[w].r + 2.5) skip = true;
        if (skip) continue;
        var isPlt = hash(base + k * 5 + 77) < (mode === 'feather' ? 0.12 : 0.055);
        if (isPlt) { drawStainedCell(ctx, { type: 'platelet', x: sx, y: sy, r: 1.3 * sc, rot: hash(base) * TAU, seed: (base & 3) + 1, focus: foc }); continue; }
        var rr = (3.75 + (hash(base + k * 3 + 5) - 0.5) * 0.5) * rScale * sc;
        ctx.save();
        if (mode === 'feather') { ctx.globalAlpha = 0.85; }
        if (mode === 'thick') { ctx.globalAlpha = 0.9; }
        var sxs = mode === 'thick' ? 1 : 1;
        drawStainedCell(ctx, { type: 'rbc', x: sx, y: sy, r: rr, seed: 1, focus: foc });
        if (mode === 'feather') { // over-flattened: wash the pallor out
          ctx.globalAlpha = 0.5; ctx.fillStyle = '#e8a4a4'; ctx.beginPath(); ctx.arc(sx, sy, rr * 0.5, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
    }
    if (mode === 'thick') { ctx.fillStyle = 'rgba(160,40,70,0.18)'; ctx.fillRect(cx - Rf, cy - Rf, Rf * 2, Rf * 2); }
    var outW = [];
    for (w = 0; w < wb.length; w++) {
      var B = wb[w], wx = cx + (B.x - px) * sc, wy = cy + (B.y - py) * sc;
      drawStainedCell(ctx, { type: B.type, x: wx, y: wy, r: B.r * sc, rot: B.rot, seed: B.seed, focus: foc });
      outW.push({ type: B.type, x: wx, y: wy, r: B.r * sc });
    }
    // defocus halo + brightness shift
    if (focus < 0.98) { ctx.fillStyle = rgba([255, 250, 250], (1 - focus) * 0.25); ctx.fillRect(cx - Rf, cy - Rf, Rf * 2, Rf * 2); }
    // uneven illumination + edge falloff
    var ge = ctx.createRadialGradient(cx, cy, Rf * 0.55, cx, cy, Rf);
    ge.addColorStop(0, 'rgba(40,20,30,0)'); ge.addColorStop(0.75, 'rgba(40,20,30,0.18)'); ge.addColorStop(0.95, 'rgba(20,10,15,0.75)'); ge.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = ge; ctx.fillRect(cx - Rf, cy - Rf, Rf * 2, Rf * 2);
    if (o.pointer) { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(cx - Rf - 5, cy - 6); ctx.lineTo(cx - 20, cy - 1.5); ctx.lineTo(cx - 20, cy + 1.5); ctx.lineTo(cx - Rf - 5, cy + 6); ctx.fill(); }
    ctx.restore();
    // chromatic rim
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(80,140,255,0.35)'; ctx.beginPath(); ctx.arc(cx, cy, Rf - 2, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,60,0.25)'; ctx.beginPath(); ctx.arc(cx, cy, Rf + 1, 0, TAU); ctx.stroke();
    ctx.restore();
    return { cx: cx, cy: cy, R: Rf, scale: sc, wbcs: outW };
  }

  /* ------------------------------------------------------------- STAIN WASH */
  var WASH = {
    methanol: { col: [190, 220, 255], tint: 0.12, foam: [235, 245, 255], label: 'メタノール' },
    methylene: { col: [40, 70, 210], tint: 0.42, foam: [140, 180, 255] },
    azure: { col: [80, 40, 190], tint: 0.42, foam: [170, 140, 255] },
    eosin: { col: [255, 70, 80], tint: 0.4, foam: [255, 170, 160] },
    giemsa: { col: [140, 50, 170], tint: 0.42, foam: [220, 160, 255] },
    dry: { col: [255, 220, 170], tint: 0.1, foam: [255, 240, 220] }
  };
  /**
   * drawStainWash(ctx, {color='methylene'|'azure'|'eosin'|'giemsa'|'methanol'|'dry'|css, p, t, dir=1})
   * Overlay: a wave of fixative/dye sweeps across the frame (left→right, dir=-1 reverses). p 0..0.6 the curling front
   * travels over the screen (foam crest, bubbles, dye swirls), the colour washes in behind it (multiply tint);
   * p 0.6..1 the liquid calms, leaving a residual tint (≈40%). 'methanol' = clear rain-like wash, 'dry' = warm air with
   * wind streaks (乾燥の風). Returns {front} (screen x of the crest).
   */
  function drawStainWash(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], p = clamp(o.p == null ? 0.5 : o.p, 0, 1), t = o.t || 0, dir = o.dir || 1;
    var P = WASH[o.color] || { col: parseCol(o.color || '#3050d0'), tint: 0.4, foam: [255, 255, 255] };
    var fr = lerp(-0.25, 1.25, smooth(0, 0.6, p)) * W, calm = smooth(0.6, 1, p);
    ctx.save();
    if (dir < 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    function frontX(y) { return fr + Math.sin(y / 120 + t * 3) * 40 + Math.sin(y / 47 - t * 5) * 14 - (1 - Math.pow(y / H, 0.6)) * 0; }
    if (o.color === 'dry') {
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (var i = 0; i < 40; i++) { var R = rng(12000 + i), y = R() * H, x = mod(R() * W * 1.5 + t * (900 + R() * 600), W * 1.5) - W * 0.25, l = 200 + R() * 400;
        ctx.strokeStyle = rgba(P.col, 0.18 * Math.sin(p * Math.PI)); ctx.lineWidth = 2 + R() * 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 20, x + l, y + Math.sin(i) * 10); ctx.stroke(); }
      ctx.fillStyle = rgba(P.col, 0.12 * Math.sin(p * Math.PI)); ctx.fillRect(0, 0, W, H);
      ctx.restore(); return { front: null };
    }
    // tinted region behind the front
    ctx.beginPath(); ctx.moveTo(-10, -10);
    for (y = -10; y <= H + 10; y += 20) ctx.lineTo(frontX(y), y);
    ctx.lineTo(-10, H + 10); ctx.closePath();
    ctx.save(); ctx.clip();
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(mixC([255, 255, 255], P.col, P.tint * lerp(1, 0.6, calm) * 1.6), 1); ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba(P.col, 0.12 * (1 - calm)); ctx.fillRect(0, 0, W, H);
    // dye swirls
    ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round';
    for (i = 0; i < 26; i++) { R = rng(12100 + i); var sx = fr - R() * W * 1.2, sy = R() * H, rr = 40 + R() * 120, a0 = R() * TAU + t * (0.5 + R());
      ctx.strokeStyle = rgba(P.col, 0.25 * (1 - calm)); ctx.lineWidth = 6 + R() * 10; ctx.beginPath(); ctx.arc(sx, sy, rr, a0, a0 + 2.2); ctx.stroke(); }
    ctx.restore();
    // crest (foam) + bubbles
    if (calm < 1) {
      ctx.save(); ctx.globalAlpha = 1 - calm;
      ctx.lineJoin = 'round'; ctx.beginPath();
      for (y = -10; y <= H + 10; y += 20) { if (y === -10) ctx.moveTo(frontX(y), y); else ctx.lineTo(frontX(y), y); }
      ctx.strokeStyle = rgba(P.col, 0.6); ctx.lineWidth = 46; ctx.stroke();
      ctx.strokeStyle = rgba(P.foam, 0.9); ctx.lineWidth = 14; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 4; ctx.stroke();
      for (i = 0; i < 60; i++) { R = rng(12200 + i); y = R() * H; var bx = frontX(y) - R() * 120, br = 4 + R() * 12;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, y + Math.sin(t * 3 + i) * 6, br, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
    return { front: dir < 0 ? W - fr : fr };
  }
  function parseCol(c) { if (c[0] === '#') { var n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; } var m = c.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [255, 255, 255]; }

  /* ================================================================ COMMON */
  function ecgPath(ctx, x0, x1, y, amp, t, speed) {
    ctx.beginPath();
    for (var x = x0; x <= x1; x += 4) {
      var u = mod((x - x0) / 360 - t * (speed || 0.5), 1), v = 0;
      if (u > 0.40 && u < 0.43) v = -0.15; else if (u >= 0.43 && u < 0.46) v = 1; else if (u >= 0.46 && u < 0.49) v = -0.55; else if (u > 0.58 && u < 0.66) v = 0.18 * Math.sin((u - 0.58) / 0.08 * Math.PI);
      if (x === x0) ctx.moveTo(x, y - v * amp); else ctx.lineTo(x, y - v * amp);
    }
  }
  /**
   * drawEndCard(ctx, {t, episode=2, title, next, teaser, bg=true, alpha=1})
   * End card for each episode. t = seconds since the card started (animations settle by ~2.2 s).
   * Shows a small 'BLOOD STORY' logo line with a heartbeat trace, '第N話「title」' + 'おわり', then a 次回 block:
   * next = '第3話「ふさぐもの、生まれるところ」' (rendered with drawTelop 'next' style), or teaser (multi-line string for
   * the season finale, e.g. 'BLOOD STORY 新シーズン\n―『はじまりの細胞』―\n準備中') in a glowing plate.
   * bg=false draws only a dimming band so the card can sit over a live frame. Text stays above y≈880.
   */
  function drawEndCard(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t == null ? 10 : o.t, a = o.alpha == null ? 1 : o.alpha;
    ctx.save(); ctx.globalAlpha *= a;
    if (o.bg !== false) {
      var g = ctx.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H / 2, W * 0.75); g.addColorStop(0, '#3a0812'); g.addColorStop(1, '#060103');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      W0.drawParticles(ctx, { t: t, seed: 13, count: 70, size: 3, alpha: 0.45 });
      for (var i = 0; i < 6; i++) { var R = rng(13000 + i); W0.drawRBC(ctx, { x: mod(R() * (W + 400) + t * 30, W + 400) - 200, y: R() * H, r: 30 + R() * 50, tiltX: R() * 3 + t * 0.3, tiltY: R() * 2, alpha: 0.25, fog: 0.6, fogColor: '#2a0408' }); }
    } else { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H); }
    // logo line + ECG
    var la = smooth(0, 0.6, t);
    ctx.save(); ctx.globalAlpha *= la; ctx.lineJoin = 'round';
    ecgPath(ctx, W * 0.12, W * 0.88, 200, 50, t, 0.4);
    ctx.strokeStyle = 'rgba(255,60,80,0.3)'; ctx.lineWidth = 10; ctx.stroke(); ctx.strokeStyle = '#ff5a6a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = font(64); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(30,0,6,0.9)'; ctx.strokeText('BLOOD STORY', W / 2, 120);
    var gt = ctx.createLinearGradient(0, 90, 0, 150); gt.addColorStop(0, '#ffd0c8'); gt.addColorStop(1, '#ff3040'); ctx.fillStyle = gt; ctx.fillText('BLOOD STORY', W / 2, 120);
    ctx.restore();
    // episode title + おわり
    var ea = smooth(0.3, 1.0, t);
    if (o.title || o.episode) {
      ctx.save(); ctx.globalAlpha *= ea; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var et = '第' + (o.episode || '') + '話' + (o.title ? '「' + o.title + '」' : '');
      ctx.font = font(56); ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(20,0,5,0.9)'; ctx.strokeText(et, W / 2, 330 + (1 - ea) * 20);
      ctx.fillStyle = '#fff2ee'; ctx.fillText(et, W / 2, 330 + (1 - ea) * 20);
      ctx.font = font(44); ctx.fillStyle = '#ffb0a8'; ctx.fillText('― おわり ―', W / 2, 410 + (1 - ea) * 20);
      ctx.restore();
    }
    // next
    if (o.next) {
      var nt = t - 1.0;
      if (nt > 0) W0.drawTelop(ctx, { text: '次回：' + o.next, y: 640, size: 88, style: 'next', t: nt, kicker: '次回予告', maxW: W * 0.9 });
    } else if (o.teaser) {
      var ta = smooth(1.0, 2.0, t), lines = String(o.teaser).split('\n');
      ctx.save(); ctx.globalAlpha *= ta;
      var bw = W * 0.7, bh = 110 + lines.length * 78, bx = (W - bw) / 2, by = 520;
      ctx.shadowColor = 'rgba(255,220,150,0.6)'; ctx.shadowBlur = 40;
      roundRect(ctx, bx, by, bw, bh, 24); ctx.fillStyle = 'rgba(30,8,10,0.75)'; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,214,150,0.9)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (i = 0; i < lines.length; i++) {
        ctx.font = font(i === 1 ? 70 : 50); var ly = by + 70 + i * 82;
        var gl = ctx.createLinearGradient(0, ly - 35, 0, ly + 35); gl.addColorStop(0, '#fff6dc'); gl.addColorStop(1, '#ffc060');
        ctx.fillStyle = gl; ctx.fillText(lines[i], W / 2, ly);
      }
      ctx.globalCompositeOperation = 'lighter'; glowAt(ctx, [255, 236, 170], W / 2, by + bh / 2, bw * 0.5, 0.18 + 0.08 * Math.sin(t * 2.2));
      ctx.restore();
    }
    ctx.restore();
  }
  /**
   * drawRecapFrame(ctx, {t, title='前回までのあらすじ', episode, content, alpha=1, sepia=0})
   * 「前回までのあらすじ」 frame: dark-red backdrop with drifting cells, a 16:9 picture window (1440×810 at x=240,y=40,
   * so the subtitle band stays free), film-strip sprocket edges, a red ribbon label with the title (and '第N話より'),
   * corner brackets, a light scanline/grain pass over the picture.
   * content(ctx, rect, t): optional callback that draws the old footage; ctx is pre-transformed so it can draw a full
   * 1920×1080 frame (it is scaled into the window and clipped). sepia 0..1 runs drawFlashback over the picture.
   * Returns the window rect {x,y,w,h,scale}.
   */
  function drawRecapFrame(ctx, o) {
    o = o || {};
    var d = dims(ctx), W = d[0], H = d[1], t = o.t == null ? 10 : o.t, a = o.alpha == null ? 1 : o.alpha;
    var rw = W * 0.75, rh = rw * 9 / 16, rx = (W - rw) / 2, ry = H * 0.037, scl = rw / W;
    var rect = { x: rx, y: ry, w: rw, h: rh, scale: scl };
    ctx.save(); ctx.globalAlpha *= a;
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a050c'); g.addColorStop(1, '#0a0104');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 8; i++) { var R = rng(14000 + i); W0.drawRBC(ctx, { x: mod(R() * (W + 300) - t * 25, W + 300) - 150, y: R() * H, r: 25 + R() * 45, tiltX: R() * 3 + t * 0.2, tiltY: R(), alpha: 0.3, fog: 0.6, fogColor: '#2a0408' }); }
    // film strip edges
    ctx.fillStyle = '#120205'; ctx.fillRect(rx - 60, ry - 20, rw + 120, rh + 40);
    ctx.fillStyle = 'rgba(255,220,210,0.18)';
    for (var y = ry - 10 + mod(t * 40, 44); y < ry + rh + 10; y += 44) { roundRect(ctx, rx - 46, y, 26, 18, 4); ctx.fill(); roundRect(ctx, rx + rw + 20, y, 26, 18, 4); ctx.fill(); }
    // picture
    ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
    if (o.content) {
      ctx.save(); ctx.translate(rx, ry); ctx.scale(scl, scl); o.content(ctx, rect, t); ctx.restore();
      if (o.sepia) {
        // run flashback only on the window: render via scratch so it doesn't leak outside
        var c = scratchCanvas('recap', Math.ceil(rw), Math.ceil(rh)), x = c.getContext('2d');
        x.drawImage(ctx.canvas, rx, ry, rw, rh, 0, 0, c.width, c.height);
        drawFlashback(x, { amount: o.sepia, t: t }); ctx.drawImage(c, rx, ry, rw, rh);
      }
    } else { ctx.fillStyle = '#300810'; ctx.fillRect(rx, ry, rw, rh); }
    ctx.globalAlpha = 0.08; ctx.fillStyle = '#000'; for (y = ry; y < ry + rh; y += 4) ctx.fillRect(rx, y, rw, 1.5);
    ctx.restore();
    // border + corner brackets
    ctx.strokeStyle = 'rgba(255,120,120,0.8)'; ctx.lineWidth = 3; ctx.strokeRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#ffd8d0'; ctx.lineWidth = 6; var cl = 50;
    [[rx, ry, 1, 1], [rx + rw, ry, -1, 1], [rx, ry + rh, 1, -1], [rx + rw, ry + rh, -1, -1]].forEach(function (q) {
      ctx.beginPath(); ctx.moveTo(q[0] + q[2] * cl, q[1] - q[3] * 8); ctx.lineTo(q[0] - q[2] * 8, q[1] - q[3] * 8); ctx.lineTo(q[0] - q[2] * 8, q[1] + q[3] * cl); ctx.stroke();
    });
    // ribbon label (slides in)
    var la = smooth(0, 0.5, t), title = o.title || '前回までのあらすじ';
    ctx.save(); ctx.translate(lerp(-500, 0, la), 0);
    ctx.font = font(46); var tw = ctx.measureText(title).width;
    var bx = rx - 80, by = ry + 40, bw = tw + 120, bh = 76;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw - 26, by + bh); ctx.lineTo(bx, by + bh); ctx.closePath();
    var gr = ctx.createLinearGradient(0, by, 0, by + bh); gr.addColorStop(0, '#e8283c'); gr.addColorStop(1, '#8a0a1a');
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20; ctx.fillStyle = gr; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffd0a0'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(title, bx + 50, by + bh / 2 + 2);
    if (o.episode) { ctx.font = font(28); ctx.fillStyle = '#ffd8d0'; ctx.fillText('第' + o.episode + '話より', bx + 54, by + bh + 34); }
    ctx.restore();
    ctx.restore();
    return rect;
  }

  /* =================================================================== EXPORT */
  var EXPORTS = {
    drawSkinWound: drawSkinWound,
    drawVenuleWall: drawVenuleWall,
    drawTissueField: drawTissueField,
    drawVesselTear: drawVesselTear,
    drawCollagenBed: drawCollagenBed,
    drawFibrinNet: drawFibrinNet,
    drawMarrowSinusoid: drawMarrowSinusoid,
    drawFlashback: drawFlashback,
    drawGlitch: drawGlitch,
    drawSimGrid: drawSimGrid,
    drawSlideWorld: drawSlideWorld,
    drawStainedCell: drawStainedCell,
    drawMicroscopeField: drawMicroscopeField,
    drawStainWash: drawStainWash,
    drawEndCard: drawEndCard,
    drawRecapFrame: drawRecapFrame,
    CELL_UM: CELL_UM
  };
  for (var k in EXPORTS) BS.world[k] = EXPORTS[k];
  BS.world._internal2 = { collagenBundle: collagenBundle, fibroblast: fibroblast, drawBug: drawBug, flowRBC: flowRBC };
})();
