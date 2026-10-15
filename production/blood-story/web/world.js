/* BLOOD STORY ― 体内を駆ける細胞たち ―
 * world.js : 背景・細胞・エフェクト (Agent B)
 *
 * Plain script (no ES module). Registers window.BS.world.
 * Every draw function is a pure function of its opts (seeded randomness only).
 * Module-level caches (sprites / tiles / scratch canvases) are built lazily and
 * depend only on constant parameters, so any frame t can be rendered independently.
 * All coordinates are canvas px, designed for 1920x1080 (functions read ctx.canvas size).
 * Every function wraps its work in ctx.save()/ctx.restore().
 *
 * Fonts: assumes @font-face family "ZenKaku" (../fonts/ZenKakuGothicNew-Bold.ttf),
 * fallback 'IPAGothic', sans-serif. Call BS.world.ready() (Promise) before the first frame.
 */
(function () {
  'use strict';
  var BS = (window.BS = window.BS || {});
  var TAU = Math.PI * 2;
  var FONT_FAMILY = 'ZenKaku, IPAGothic, "Noto Sans CJK JP", sans-serif';
  function font(px) { return Math.max(1, px).toFixed(1) + 'px ' + FONT_FAMILY; }

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
  function h2(a, b) { return hash(Math.imul(a | 0, 73856093) ^ Math.imul((b | 0) + 0x3c6ef372, 19349663)); }
  function h3(a, b, c) { return hash(Math.imul(a | 0, 73856093) ^ Math.imul((b | 0) + 7, 19349663) ^ Math.imul((c | 0) + 13, 83492791)); }
  function rng(seed) {
    var s = (seed | 0) ^ 0x5bd1e995;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mkCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  function dims(ctx) { return [ctx.canvas.width, ctx.canvas.height]; }
  function mixC(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a, 0, 1).toFixed(4) + ')'; }
  function parseColor(c) {
    if (Array.isArray(c)) return c;
    if (typeof c !== 'string') return [255, 255, 255];
    if (c[0] === '#') {
      var hx = c.slice(1);
      if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
      var n = parseInt(hx, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var m = c.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [255, 255, 255];
  }
  var scratch = {};
  function scratchCanvas(name, w, h) {
    var c = scratch[name];
    if (!c || c.width !== w || c.height !== h) { c = scratch[name] = mkCanvas(w, h); }
    var x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, w, h);
    return c;
  }

  /* Heartbeat envelope 0..1 ("lub" at beat start, softer "dub" ~0.3 beat later). */
  function heartbeat(t, bpm) {
    bpm = bpm || 72;
    var T = 60 / bpm, p = mod(t, T) / T;
    var lub = p < 0.02 ? p / 0.02 : Math.exp(-(p - 0.02) / 0.07);
    var dp = p - 0.3;
    var dub = dp < 0 ? 0 : (dp < 0.02 ? dp / 0.02 : Math.exp(-(dp - 0.02) / 0.06)) * 0.6;
    return clamp(Math.max(lub, dub), 0, 1);
  }

  /* glow sprite (radial soft dot), cached per color */
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

  /* ================================================================== RBC */
  /* Biconcave disc after Evans & Fung (1972): half thickness h(rho), radius normalized to 1. */
  var RBC_S = 176, RBC_EXT = 1.1, TILT_N = 25, RBC_ROTS = 12, RBC_DEF = 5;
  var rbcGeoCache = {}, rbcSprCache = {}, rbcMaskCache = {};
  function rbcHalf(r2) {
    if (r2 >= 1) return 0;
    return 0.52 * Math.sqrt(1 - r2) * (0.2072 + 2.0026 * r2 - 1.1228 * r2 * r2);
  }
  function rbcF(X, Y, Z, sc2, thk, k) {
    var r2 = (X * X + Y * Y) / sc2;
    var c = k * (r2 - 0.45);
    if (r2 >= 1) return Math.abs(Z - c) + (Math.sqrt(r2) - 1) * 2;
    return Math.abs(Z - c) - rbcHalf(r2) * thk;
  }
  function rbcGeo(di, ti) {
    var key = di + '_' + ti;
    if (rbcGeoCache[key]) return rbcGeoCache[key];
    var S = RBC_S, half = S / 2, ext = RBC_EXT, n = S * S;
    var dv = di / (RBC_DEF - 1);
    var sc = 1 - 0.24 * dv, sc2 = sc * sc, thk = 1 + 0.45 * dv, k = 0.95 * dv;
    var th = (ti / (TILT_N - 1)) * Math.PI, cs = Math.cos(th), sn = Math.sin(th);
    var A = new Float32Array(n), NX = new Float32Array(n), NY = new Float32Array(n), NZ = new Float32Array(n), TH = new Float32Array(n);
    var s0 = 1.25, ds = 0.028, steps = Math.ceil((2 * s0) / ds);
    function F(u, v, s) { return rbcF(u, v * cs - s * sn, v * sn + s * cs, sc2, thk, k); }
    for (var py = 0; py < S; py++) {
      var v = ((py + 0.5 - half) / half) * ext;
      for (var px = 0; px < S; px++) {
        var u = ((px + 0.5 - half) / half) * ext;
        if (Math.abs(u) > sc + 0.02) continue;
        var cnt = 0, sHit = NaN;
        for (var i = 0; i <= steps; i++) {
          var s = s0 - i * ds;
          if (F(u, v, s) < 0) {
            cnt++;
            if (sHit !== sHit) {
              var a = s + ds, b = s;
              for (var j = 0; j < 9; j++) { var m = (a + b) / 2; if (F(u, v, m) < 0) b = m; else a = m; }
              sHit = b;
            }
          }
        }
        if (!cnt) continue;
        var idx = py * S + px, e = 0.004;
        // gradient in object space -> screen space
        var X = u, Y = v * cs - sHit * sn, Z = v * sn + sHit * cs;
        var gx = rbcF(X + e, Y, Z, sc2, thk, k) - rbcF(X - e, Y, Z, sc2, thk, k);
        var gy = rbcF(X, Y + e, Z, sc2, thk, k) - rbcF(X, Y - e, Z, sc2, thk, k);
        var gz = rbcF(X, Y, Z + e, sc2, thk, k) - rbcF(X, Y, Z - e, sc2, thk, k);
        var nu = gx, nv = cs * gy + sn * gz, ns = -sn * gy + cs * gz;
        var L = Math.sqrt(nu * nu + nv * nv + ns * ns) || 1;
        nu /= L; nv /= L; ns /= L;
        if (ns < 0) { ns = 0.05; }
        A[idx] = 1; NX[idx] = nu; NY[idx] = nv; NZ[idx] = ns; TH[idx] = cnt * ds;
      }
    }
    // anti-aliased silhouette: supersample border pixels 4x4
    var A2 = new Float32Array(A);
    for (py = 1; py < S - 1; py++) {
      for (px = 1; px < S - 1; px++) {
        idx = py * S + px;
        var c0 = A[idx];
        if (c0 === A[idx - 1] && c0 === A[idx + 1] && c0 === A[idx - S] && c0 === A[idx + S]) continue;
        var hits = 0;
        for (var sy = 0; sy < 4; sy++) for (var sx = 0; sx < 4; sx++) {
          var uu = ((px + (sx + 0.5) / 4 - half) / half) * ext, vv = ((py + (sy + 0.5) / 4 - half) / half) * ext;
          for (i = 0; i <= steps; i += 1) { if (F(uu, vv, s0 - i * ds) < 0) { hits++; break; } }
        }
        A2[idx] = hits / 16;
        if (!c0 && hits) { // borrow normal from a hit neighbour
          var nb = A[idx - 1] ? idx - 1 : A[idx + 1] ? idx + 1 : A[idx - S] ? idx - S : idx + S;
          NX[idx] = NX[nb]; NY[idx] = NY[nb]; NZ[idx] = NZ[nb]; TH[idx] = TH[nb] || 0.1;
        }
      }
    }
    var g = { A: A2, NX: NX, NY: NY, NZ: NZ, TH: TH };
    rbcGeoCache[key] = g; return g;
  }
  var RBC_RIM = [150, 10, 26], RBC_MID = [205, 34, 42], RBC_CENTER = [246, 128, 112], RBC_DEEP = [92, 4, 16];
  function rbcSprite(di, ti, ri) {
    var key = di + '_' + ti + '_' + ri;
    if (rbcSprCache[key]) return rbcSprCache[key];
    var g = rbcGeo(di, ti), S = RBC_S;
    var c = mkCanvas(S, S), x = c.getContext('2d');
    var img = x.createImageData(S, S), D = img.data;
    var phi = (ri / RBC_ROTS) * TAU, cp = Math.cos(phi), sp = Math.sin(phi);
    var lx0 = -0.45, ly0 = -0.62, lz = 0.64, ll = Math.sqrt(lx0 * lx0 + ly0 * ly0 + lz * lz);
    lx0 /= ll; ly0 /= ll; lz /= ll;
    var lx = lx0 * cp + ly0 * sp, ly = -lx0 * sp + ly0 * cp;
    var hx = lx, hy = ly, hz = lz + 1, hl = Math.sqrt(hx * hx + hy * hy + hz * hz); hx /= hl; hy /= hl; hz /= hl;
    // back/rim light from opposite side (warm plasma glow)
    var bx = -lx, by = -ly;
    for (var i = 0, n = S * S; i < n; i++) {
      var a = g.A[i]; if (a <= 0) continue;
      var nx = g.NX[i], ny = g.NY[i], nz = g.NZ[i], thick = g.TH[i];
      var T = Math.exp(-thick * 2.6);
      var col = T > 0.35 ? mixC(RBC_MID, RBC_CENTER, smooth(0.35, 0.75, T)) : mixC(RBC_RIM, RBC_MID, smooth(0.06, 0.35, T));
      if (thick > 0.9) col = mixC(col, RBC_DEEP, smooth(0.9, 2.2, thick) * 0.6);
      var ndl = nx * lx + ny * ly + nz * lz;
      var diff = 0.42 + 0.78 * Math.max(0, ndl * 0.8 + 0.2);
      var ndh = Math.max(0, nx * hx + ny * hy + nz * hz);
      var spec = Math.pow(ndh, 42) * 0.75 + Math.pow(ndh, 9) * 0.12;
      var fres = Math.pow(1 - nz, 2.2);
      var back = Math.max(0, nx * bx + ny * by) * fres;
      var r = col[0] * diff + spec * 255 + back * 120 + T * 26;
      var gg = col[1] * diff + spec * 228 + back * 52 + T * 10;
      var b = col[2] * diff + spec * 210 + back * 36 + T * 8;
      // slight darkening of the silhouette edge for readability
      var edge = 1 - 0.28 * Math.pow(1 - nz, 4) * (1 - back);
      var o = i * 4;
      D[o] = clamp(r * edge, 0, 255); D[o + 1] = clamp(gg * edge, 0, 255); D[o + 2] = clamp(b * edge, 0, 255); D[o + 3] = a * 255;
    }
    x.putImageData(img, 0, 0);
    rbcSprCache[key] = c; return c;
  }
  function rbcMask(di, ti, col) {
    var key = di + '_' + ti + '_' + col.join(',');
    if (rbcMaskCache[key]) return rbcMaskCache[key];
    var g = rbcGeo(di, ti), S = RBC_S, c = mkCanvas(S, S), x = c.getContext('2d');
    var img = x.createImageData(S, S), D = img.data;
    for (var i = 0; i < S * S; i++) { var o = i * 4; D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = g.A[i] * 255; }
    x.putImageData(img, 0, 0);
    rbcMaskCache[key] = c; return c;
  }

  var RBC_SMALL = 80, FOG_L = 8, rbcSmallCache = {}, rbcSoftCache = {};
  /* small LOD sprite with depth-fog tint baked in */
  function rbcSmall(di, ti, ri, fl, fogCol) {
    var key = di + '_' + ti + '_' + ri + '_' + fl + '_' + fogCol.join(',');
    if (rbcSmallCache[key]) return rbcSmallCache[key];
    var c = mkCanvas(RBC_SMALL, RBC_SMALL), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(rbcSprite(di, ti, ri), 0, 0, RBC_SMALL, RBC_SMALL);
    if (fl > 0) { x.globalAlpha = fl / (FOG_L - 1); x.drawImage(rbcMask(di, ti, fogCol), 0, 0, RBC_SMALL, RBC_SMALL); }
    rbcSmallCache[key] = c; return c;
  }
  /* pre-blurred sprite used for strong motion blur (copies blend smoothly) */
  function rbcSoft(di, ti, ri) {
    var key = di + '_' + ti + '_' + ri;
    if (rbcSoftCache[key]) return rbcSoftCache[key];
    var c = mkCanvas(RBC_S, RBC_S), x = c.getContext('2d');
    x.filter = 'blur(6px)'; x.drawImage(rbcSprite(di, ti, ri), 0, 0); x.filter = 'none';
    rbcSoftCache[key] = c; return c;
  }

  /**
   * drawRBC(ctx, {x, y, r, tiltX, tiltY, rot, deform, alpha, blur, blurAngle, fog, fogColor})
   * r: on-screen radius (px) of the undeformed disc. tiltX/tiltY radians (0 = face-on; ±π/2 = edge-on).
   * rot: extra in-plane rotation (rad). deform 0..1: capillary parachute/bullet shape (cup convex side
   * points opposite to the disc normal). blur: motion-blur length px along blurAngle (rad).
   * fog 0..1 tints toward fogColor (depth haze).
   */
  function drawRBC(ctx, o) {
    var x = o.x || 0, y = o.y || 0, r = o.r == null ? 40 : o.r;
    var alpha = o.alpha == null ? 1 : o.alpha, blur = o.blur || 0, deform = clamp(o.deform || 0, 0, 1);
    if (alpha <= 0.004 || r < 0.4) return;
    var tX = o.tiltX || 0, tY = o.tiltY || 0;
    var nx = Math.sin(tY) * Math.cos(tX), ny = -Math.sin(tX), nz = Math.cos(tX) * Math.cos(tY);
    var di = Math.round(deform * (RBC_DEF - 1));
    if (di === 0 && nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    var th = Math.acos(clamp(nz, -1, 1));
    // a perfectly edge-on disc projects as a plain bar (rim hides the dimples); keep ≥12° of tilt so the
    // biconcave waist always reads
    if (di === 0) th = Math.min(th, 1.36);
    var phi = nx * nx + ny * ny > 1e-8 ? Math.atan2(ny, nx) - Math.PI / 2 : 0;
    phi += o.rot || 0;
    var ti = Math.round((th / Math.PI) * (TILT_N - 1));
    var ri = mod(Math.round((phi / TAU) * RBC_ROTS), RBC_ROTS);
    var size = 2 * r * RBC_EXT, hs = size / 2;
    var fog = clamp(o.fog || 0, 0, 1), fogCol = parseColor(o.fogColor || '#c8402f');
    var small = size <= RBC_SMALL * 1.15, soft = !small && blur > 4;
    var spr = small ? rbcSmall(di, ti, ri, Math.round(fog * (FOG_L - 1)), fogCol) : soft ? rbcSoft(di, ti, ri) : rbcSprite(di, ti, ri);
    var mask = !small && fog > 0.04 ? rbcMask(di, ti, fogCol) : null;
    ctx.save();
    var n = 1, ba = o.blurAngle || 0, ca = Math.cos(ba), sa = Math.sin(ba);
    if (blur > 1.5) n = clamp(Math.ceil(blur / Math.max(small ? 2 : 3, r * (soft ? 0.09 : 0.15))) + 1, 2, 9);
    // strong blur on big cells: stretch the pre-blurred sprite along the motion and use few copies (cheap)
    var stretch = 1, spread = blur;
    if (soft) {
      stretch = 1 + (0.6 * blur) / size; spread = blur * 0.4;
      n = clamp(Math.ceil(spread / (r * 0.09)) + 1, 1, 4);
    }
    var a1 = n === 1 ? alpha : 1 - Math.pow(1 - Math.min(alpha, 0.995), 1 / n);
    for (var i = 0; i < n; i++) {
      var off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
      ctx.save();
      ctx.translate(x + ca * off, y + sa * off);
      if (stretch !== 1) { ctx.rotate(ba); ctx.scale(stretch, 1); ctx.rotate(phi - ba); } else ctx.rotate(phi);
      ctx.globalAlpha = a1;
      ctx.drawImage(spr, -hs, -hs, size, size);
      if (mask) { ctx.globalAlpha = a1 * fog; ctx.drawImage(mask, -hs, -hs, size, size); }
      ctx.restore();
    }
    ctx.restore();
  }

  /* platelet sprites (small irregular discs with granules) */
  var pltCache = {};
  function plateletSprite(v) {
    v = v & 3;
    if (pltCache[v]) return pltCache[v];
    var S = 96, c = mkCanvas(S, S), x = c.getContext('2d'), R = rng(911 + v * 37);
    x.translate(S / 2, S / 2);
    x.beginPath();
    var N = 14;
    for (var i = 0; i <= N; i++) {
      var a = (i / N) * TAU, rr = 30 * (1 + (R() - 0.5) * 0.28);
      var px = Math.cos(a) * rr * 1.15, py = Math.sin(a) * rr * 0.8;
      if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.closePath();
    var g = x.createRadialGradient(-8, -8, 2, 0, 0, 36);
    g.addColorStop(0, '#ffe6c8'); g.addColorStop(0.5, '#f0b490'); g.addColorStop(1, '#b8645a');
    x.fillStyle = g; x.fill();
    x.lineWidth = 2; x.strokeStyle = 'rgba(120,40,40,0.55)'; x.stroke();
    for (i = 0; i < 9; i++) {
      x.beginPath(); x.arc((R() - 0.5) * 34, (R() - 0.5) * 22, 2 + R() * 3, 0, TAU);
      x.fillStyle = R() < 0.5 ? 'rgba(150,60,110,0.75)' : 'rgba(200,110,140,0.7)'; x.fill();
    }
    x.beginPath(); x.ellipse(-10, -9, 10, 5, -0.4, 0, TAU); x.fillStyle = 'rgba(255,255,240,0.55)'; x.fill();
    pltCache[v] = c; return c;
  }
  /** drawPlatelet(ctx,{x,y,r,rot,alpha,variant,blur,blurAngle}) — small irregular disc (~1/4 RBC size). */
  function drawPlatelet(ctx, o) {
    var spr = plateletSprite(o.variant || 0), r = o.r || 10, a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0.004 || r < 0.5) return;
    var blur = o.blur || 0, ba = o.blurAngle || 0, n = blur > 2 ? clamp(Math.ceil((blur * 0.35) / (r * 0.3 + 1)) + 1, 2, 5) : 1;
    var stretch = blur > 2 ? 1 + (0.65 * blur) / (r * 3.2) : 1;
    var ca = Math.cos(ba), sa = Math.sin(ba), a1 = n === 1 ? a : 1 - Math.pow(1 - Math.min(a, 0.99), 1 / n);
    ctx.save();
    if (blur > 2) ctx.imageSmoothingQuality = 'high';
    for (var i = 0; i < n; i++) {
      var off = n === 1 ? 0 : (i / (n - 1) - 0.5) * blur * 0.35;
      ctx.save(); ctx.translate(o.x + ca * off, o.y + sa * off);
      if (stretch !== 1) { ctx.rotate(ba); ctx.scale(stretch, 1); ctx.rotate((o.rot || 0) - ba); } else ctx.rotate(o.rot || 0);
      ctx.globalAlpha = a1; ctx.drawImage(spr, -r * 1.6, -r * 1.6, r * 3.2, r * 3.2); ctx.restore();
    }
    ctx.restore();
  }

  /* ================================================================ TUNNEL */
  var T_NEAR = 0.28, T_FAR = 48, T_N = 100;
  function pathOff(w) {
    return [0.9 * Math.sin(w * 0.09) + 0.45 * Math.sin(w * 0.041 + 1.3), 0.5 * Math.sin(w * 0.071 + 2.1) + 0.22 * Math.sin(w * 0.13 + 0.4)];
  }
  function ONE() { return 1; }
  /* Shared perspective geometry for the first-person tube (tunnel, field and capillary all use it). */
  function tubeGeom(ctx, o, radFn) {
    var d0 = dims(ctx), W = d0[0], H = d0[1];
    var t = o.t || 0, z = o.z || 0, R = o.radius == null ? 1 : o.radius;
    var cu = o.curve || 0, cvx = typeof cu === 'number' ? cu : cu.x || 0, cvy = typeof cu === 'number' ? 0 : cu.y || 0;
    var pulse = o.pulse == null ? heartbeat(t) : o.pulse;
    var swayAmt = o.sway == null ? 1 : o.sway, camX = o.camX || 0, camY = o.camY || 0;
    var f = H * 0.85, cx0 = W / 2 + (o.cx || 0), cy0 = H / 2 + (o.cy || 0);
    var swx = (0.03 * Math.sin(t * 0.9) + 0.012 * Math.sin(t * 2.3 + 0.5)) * swayAmt;
    var swy = (0.026 * Math.sin(t * 1.1 + 1) + 0.01 * Math.sin(t * 2.9)) * swayAmt;
    var p0 = pathOff(z), p1 = pathOff(z + 0.01);
    var slx = (p1[0] - p0[0]) / 0.01, sly = (p1[1] - p0[1]) / 0.01;
    var rings = new Array(T_N), dil = 1 + 0.028 * pulse;
    radFn = radFn || ONE;
    for (var k = 0; k < T_N; k++) {
      var d = T_NEAR * Math.pow(T_FAR / T_NEAR, k / (T_N - 1));
      var po = pathOff(z + d);
      var ox = po[0] - p0[0] - d * slx + cvx * 0.014 * d * d - swx - camX;
      var oy = po[1] - p0[1] - d * sly + cvy * 0.014 * d * d - swy - camY;
      var x = cx0 + (f * ox) / d, y = cy0 + (f * oy) / d;
      var Rd = R * radFn(d) * dil, r = (f * Rd) / d;
      if (k > 0) { // keep the cross-sections nested so painter's order stays valid
        var pr = rings[k - 1], dx = x - pr.x, dy = y - pr.y, dist = Math.sqrt(dx * dx + dy * dy), mx = Math.max(0, pr.r - r) * 0.92;
        if (dist > mx) { var s = mx / (dist || 1); x = pr.x + dx * s; y = pr.y + dy * s; }
      }
      rings[k] = { d: d, x: x, y: y, r: r, rr: Rd };
    }
    var lnN = Math.log(T_FAR / T_NEAR);
    function at(d) {
      if (d <= T_NEAR) { var a = rings[0]; return { x: a.x, y: a.y, r: (a.r * T_NEAR) / Math.max(d, 0.02) }; }
      if (d >= T_FAR) { var b = rings[T_N - 1]; return { x: b.x, y: b.y, r: (b.r * T_FAR) / d }; }
      var fk = (Math.log(d / T_NEAR) / lnN) * (T_N - 1), i = Math.floor(fk), u = fk - i;
      var A = rings[i], B = rings[Math.min(i + 1, T_N - 1)];
      var rA = (A.r * A.d) / d, rB = (B.r * B.d) / d; // r ∝ 1/d inside a segment
      return { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), r: lerp(rA, rB, u) };
    }
    return { W: W, H: H, f: f, t: t, z: z, R: R, pulse: pulse, rings: rings, at: at, cx0: cx0, cy0: cy0 };
  }

  var STYLE_ART = {
    wall: [104, 8, 22], wallHi: [172, 34, 44], dark: [46, 2, 10], fog: [196, 52, 44], fogDist: 13, fold: 2.4, foldAmp: 0.55,
    K: 20, L: 0.62, nuc: [84, 10, 44], line: [40, 0, 8], glow: [255, 150, 92], spec: [255, 196, 168]
  };
  var STYLE_CAP = {
    wall: [206, 92, 96], wallHi: [244, 150, 134], dark: [110, 26, 44], fog: [250, 184, 150], fogDist: 9, fold: 1.5, foldAmp: 0.18,
    K: 3, L: 1.3, nuc: [150, 70, 130], line: [120, 36, 56], glow: [255, 222, 180], spec: [255, 236, 220]
  };

  function ringColor(st, d, w, pulse) {
    var fold = 0.5 + 0.5 * Math.cos((TAU * w) / st.fold);
    var fold2 = 0.5 + 0.5 * Math.cos((TAU * w) / (st.fold * 0.37) + 1.3);
    var c = mixC(st.wall, st.wallHi, (fold * 0.75 + fold2 * 0.25) * st.foldAmp * Math.exp(-d / 30));
    c = mixC(c, st.dark, smooth(3.2, 0.3, d) * 0.6);
    var fg = 1 - Math.exp(-d / st.fogDist);
    c = mixC(c, st.fog, fg);
    var b = 1 + 0.16 * pulse;
    return [c[0] * b, c[1] * b, c[2] * b];
  }

  function drawTubeBase(ctx, G, styleAt) {
    var rings = G.rings, W = G.W, H = G.H, z = G.z;
    // find the last ring that still covers the whole screen
    var start = 0;
    for (var k = 0; k < rings.length; k++) {
      var R = rings[k], ok = true;
      var cs = [[0, 0], [W, 0], [0, H], [W, H]];
      for (var c = 0; c < 4; c++) { var dx = cs[c][0] - R.x, dy = cs[c][1] - R.y; if (dx * dx + dy * dy > R.r * R.r) { ok = false; break; } }
      if (ok) start = k; else break;
    }
    var R0 = rings[start];
    ctx.fillStyle = rgb(styleAt(R0.d).col(R0.d, z + R0.d, G.pulse));
    ctx.fillRect(0, 0, W, H);
    for (k = start + 1; k < rings.length; k++) {
      var A = rings[k], B = rings[k + 1];
      var st = styleAt(A.d);
      ctx.fillStyle = rgb(st.col(A.d, z + A.d, G.pulse));
      ctx.beginPath();
      ctx.arc(A.x, A.y, A.r + 1.2, 0, TAU);
      if (B && B.r > 2) { ctx.moveTo(B.x + B.r - 1.2, B.y); ctx.arc(B.x, B.y, Math.max(0.1, B.r - 1.2), 0, TAU, true); }
      ctx.fill();
    }
  }
  function styleWrap(st) { return { st: st, col: function (d, w, p) { return ringColor(st, d, w, p); } }; }
  function mixStyle(a, b, u) {
    if (u <= 0.001) return a; if (u >= 0.999) return b;
    var o = {};
    for (var k in a) o[k] = Array.isArray(a[k]) ? mixC(a[k], b[k], u) : typeof a[k] === 'number' ? lerp(a[k], b[k], u) : a[k];
    return o;
  }

  /* endothelial lattice (lozenge cells elongated along flow + nuclei) on the tube wall */
  function drawEndothelium(ctx, G, st, dMin, dMax, alphaMul, seed) {
    var z = G.z, K = st.K, L = st.L, near = 0.3;
    dMin = Math.max(dMin, near * 0.85);
    if (dMax <= dMin) return;
    var j0 = Math.floor((z + dMin) / L) - 1, j1 = Math.ceil((z + dMax) / L) + 1;
    var NB = 6, lnR = Math.log(dMax / dMin);
    var edges = [], nucs = [];
    for (var b = 0; b < NB; b++) { edges.push([]); nucs.push([]); }
    function pt(j, k) {
      var kk = mod(k, K);
      var th = ((k + (j & 1) * 0.5 + (h3(j, kk, seed) - 0.5) * 0.36) / K) * TAU + 0.21;
      var w = j * L + (h3(kk, j, seed + 5) - 0.5) * 0.32 * L;
      var d = w - z, p = G.at(Math.max(d, 0.05));
      return { x: p.x + Math.cos(th) * p.r, y: p.y + Math.sin(th) * p.r, d: d, th: th, w: w };
    }
    function band(d) { return clamp(Math.floor((Math.log(Math.max(d, dMin) / dMin) / lnR) * NB), 0, NB - 1); }
    var subTh = 0.14;
    function edge(P, Q) {
      var dd = Math.min(P.d, Q.d);
      if (dd < dMin || Math.max(P.d, Q.d) > dMax + L) return;
      var dth = Q.th - P.th; if (dth > Math.PI) dth -= TAU; if (dth < -Math.PI) dth += TAU;
      var ns = Math.max(1, Math.ceil(Math.abs(dth) / subTh)), arr = edges[band(dd)];
      arr.push(ns, P.x, P.y);
      for (var i = 1; i <= ns; i++) {
        if (i === ns) { arr.push(Q.x, Q.y); break; }
        var u = i / ns, th = P.th + dth * u, dq = lerp(P.d, Q.d, u), p = G.at(Math.max(dq, 0.05));
        arr.push(p.x + Math.cos(th) * p.r, p.y + Math.sin(th) * p.r);
      }
    }
    for (var j = j0; j <= j1; j++) {
      var row = [], nxt = [];
      for (var k = 0; k < K; k++) row.push(pt(j, k));
      for (k = 0; k < K; k++) nxt.push(pt(j + 1, k));
      for (k = 0; k < K; k++) {
        var P = row[k];
        var nA = nxt[k], nB = (j & 1) ? nxt[mod(k + 1, K)] : nxt[mod(k - 1, K)];
        edge(P, nA); edge(P, nB);
        // nucleus of the lozenge cell whose top vertex is P
        var wn = P.w + L * (0.95 + (h3(j, k, seed + 9) - 0.5) * 0.3), dn = wn - z;
        if (dn > dMin && dn < dMax) {
          var pn = G.at(dn), thn = P.th + (h3(k, j, seed + 3) - 0.5) * 0.2 * (TAU / K);
          var pa = G.at(Math.max(dn - L * 0.22, 0.05)), pb = G.at(dn + L * 0.22);
          var len = Math.abs(pa.r - pb.r) * 0.5 + 0.5, wid = pn.r * Math.min(TAU / K, 0.5) * 0.17;
          nucs[band(dn)].push(pn.x + Math.cos(thn) * pn.r * 0.995, pn.y + Math.sin(thn) * pn.r * 0.995, len, wid, thn, pn.r);
        }
      }
    }
    ctx.save();
    ctx.lineCap = 'round';
    for (b = 0; b < NB; b++) {
      var dmid = dMin * Math.exp(((b + 0.5) / NB) * lnR);
      var fogA = Math.exp(-dmid / (st.fogDist * 0.75)) * alphaMul * (0.3 + 0.7 * smooth(0.3, 1.3, dmid));
      if (fogA < 0.02) continue;
      var E = edges[b], lw = clamp((G.f * 0.007) / dmid, 0.5, 5);
      if (E.length) {
        ctx.beginPath();
        for (var e = 0; e < E.length;) {
          var ns = E[e]; ctx.moveTo(E[e + 1], E[e + 2]); e += 3;
          for (var q = 0; q < ns; q++, e += 2) ctx.lineTo(E[e], E[e + 1]);
        }
        ctx.strokeStyle = rgba(st.line, 0.26 * fogA); ctx.lineWidth = lw * 1.8; ctx.stroke();
      }
      var Nn = nucs[b];
      if (Nn.length) {
        ctx.beginPath();
        for (e = 0; e < Nn.length; e += 6) {
          var ang = Math.atan2(Nn[e + 1] - G.cy0, Nn[e] - G.cx0);
          ctx.moveTo(Nn[e] + Nn[e + 2], Nn[e + 1]);
          ctx.ellipse(Nn[e], Nn[e + 1], Math.max(0.3, Nn[e + 2]), Math.max(0.3, Nn[e + 3]), Nn[e + 4], 0, TAU);
        }
        ctx.fillStyle = rgba(st.nuc, 0.36 * fogA); ctx.fill();
        if (b > 2) continue;
        // wet highlight on the bulging nuclei (near bands only)
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        for (e = 0; e < Nn.length; e += 6) {
          var th2 = Nn[e + 4], off = Nn[e + 3] * 0.55;
          var hxp = Nn[e] - Math.cos(th2) * off, hyp = Nn[e + 1] - Math.sin(th2) * off;
          ctx.moveTo(hxp + Nn[e + 2] * 0.45, hyp);
          ctx.ellipse(hxp, hyp, Math.max(0.2, Nn[e + 2] * 0.45), Math.max(0.2, Nn[e + 3] * 0.25), th2, 0, TAU);
        }
        ctx.fillStyle = rgba(st.spec, 0.16 * fogA); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.restore();
  }

  /* capillary wall: only 2–3 long endothelial cells around the circumference (seams along the axis,
     staggered cross junctions) with long flattened nuclei bulging into the lumen */
  function drawCapWall(ctx, G, st, dMin, dMax, seed) {
    var z = G.z, K = 3, L = 1.6;
    dMin = Math.max(dMin, 0.3);
    if (dMax <= dMin) return;
    function P(th, d) { var p = G.at(d); return [p.x + Math.cos(th) * p.r, p.y + Math.sin(th) * p.r, p.r]; }
    function seamTh(k, w) { return (k / K) * TAU + 0.5 + 0.18 * Math.sin(w * 0.7 + k * 2.1) + 0.08 * Math.sin(w * 1.9 + k); }
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // nuclei first (under the seams)
    for (var k = 0; k < K; k++) {
      var off = h2(k, seed) * L, j0 = Math.floor((z + dMin - off) / L) - 1, j1 = Math.ceil((z + dMax - off) / L);
      for (var j = j1; j >= j0; j--) {
        var wm = j * L + off + L * 0.5, dm = wm - z;
        if (dm < dMin + 0.1 || dm > dMax) continue;
        var thm = (seamTh(k, wm) + seamTh(k + 1, wm) + (k === K - 1 ? TAU : 0)) / 2 + (h3(j, k, seed) - 0.5) * 0.5;
        var fa = Math.exp(-dm / (st.fogDist * 0.9)) * smooth(0.7, 1.6, dm);
        if (fa < 0.03) continue;
        var pa = P(thm, Math.max(0.05, dm - 0.28)), pb = P(thm, dm + 0.28), pc = P(thm, dm);
        var cx = pc[0], cy = pc[1], dx = pa[0] - pb[0], dy = pa[1] - pb[1];
        var len = Math.max(1, Math.hypot(dx, dy) * 0.5), wid = Math.max(0.6, pc[2] * 0.22), ang = Math.atan2(dy, dx);
        var g = ctx.createRadialGradient(cx - Math.cos(ang) * len * 0.3, cy - Math.sin(ang) * len * 0.3, 0, cx, cy, Math.max(len, wid));
        g.addColorStop(0, rgba([214, 160, 220], 0.75 * fa)); g.addColorStop(0.6, rgba(st.nuc, 0.65 * fa)); g.addColorStop(1, rgba(st.nuc, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, len, wid, ang, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rgba(st.spec, 0.3 * fa);
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(ang) * len * 0.15, cy + Math.sin(ang) * len * 0.15, len * 0.5, wid * 0.22, ang, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    // seams along the axis + staggered cross junctions
    var NB = 5, lnR = Math.log(dMax / dMin);
    for (var b = 0; b < NB; b++) {
      var da = dMin * Math.exp((b / NB) * lnR), db = dMin * Math.exp(((b + 1) / NB) * lnR), dmid = Math.sqrt(da * db);
      var fa2 = Math.exp(-dmid / (st.fogDist * 0.8)) * (0.4 + 0.6 * smooth(0.3, 1.2, dmid));
      ctx.beginPath();
      for (k = 0; k < K; k++) {
        var steps = Math.max(3, Math.ceil((db - da) / 0.12));
        for (var i = 0; i <= steps; i++) {
          var d = lerp(da, db, i / steps), q = P(seamTh(k, z + d), d);
          if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
        }
        off = h2(k, seed) * L;
        for (j = Math.floor((z + da - off) / L); j <= Math.ceil((z + db - off) / L); j++) {
          var wj = j * L + off, dj = wj - z;
          if (dj < da || dj > db) continue;
          var t0 = seamTh(k, wj), t1 = seamTh(k + 1, wj) + (k === K - 1 ? TAU : 0);
          for (i = 0; i <= 28; i++) {
            var th = lerp(t0, t1, i / 28), qq = P(th, dj + Math.sin(i / 28 * Math.PI) * 0.12);
            if (i === 0) ctx.moveTo(qq[0], qq[1]); else ctx.lineTo(qq[0], qq[1]);
          }
        }
      }
      ctx.strokeStyle = rgba(st.line, 0.16 * fa2); ctx.lineWidth = clamp((G.f * 0.03) / dmid, 2, 40); ctx.stroke();
      ctx.strokeStyle = rgba(st.line, 0.3 * fa2); ctx.lineWidth = clamp((G.f * 0.008) / dmid, 0.8, 9); ctx.stroke();
    }
    ctx.restore();
  }

  function drawFolds(ctx, G, st, dMin, dMax) {
    var z = G.z, sp = st.fold;
    var m0 = Math.ceil((z + Math.max(dMin, 0.32)) / sp), m1 = Math.floor((z + dMax) / sp);
    ctx.save();
    for (var m = m1; m >= m0; m--) {
      var d = m * sp - z, p = G.at(d), fa = Math.exp(-d / (st.fogDist * 0.9));
      if (fa < 0.03) continue;
      var lw = clamp((G.f * 0.05) / d, 0.8, 60);
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.0, 0, TAU);
      ctx.strokeStyle = rgba(st.dark, 0.22 * fa); ctx.lineWidth = lw * 1.4; ctx.stroke();

    }
    ctx.restore();
  }

  /* One low-res overlay (480x270, upscaled once): angular wall lighting, glow ahead, soft wet sheen streaks. */
  function drawTubeOverlay(ctx, G, st, pulse, dMax, intensity) {
    var W = G.W, H = G.H, sw = 480, sh = 270, sx = sw / W, sy = sh / H;
    var c = scratchCanvas('tubeLight', sw, sh), x = c.getContext('2d');
    var mid = G.at(5);
    var g = x.createConicGradient(-Math.PI / 2, mid.x * sx, mid.y * sy);
    g.addColorStop(0, 'rgba(255,170,130,0.16)');
    g.addColorStop(0.15, 'rgba(255,150,110,0.08)');
    g.addColorStop(0.35, 'rgba(20,0,4,0.42)');
    g.addColorStop(0.5, 'rgba(10,0,2,0.62)');
    g.addColorStop(0.65, 'rgba(20,0,4,0.42)');
    g.addColorStop(0.85, 'rgba(255,150,110,0.10)');
    g.addColorStop(1, 'rgba(255,170,130,0.16)');
    x.fillStyle = g; x.fillRect(0, 0, sw, sh);
    var inner = G.at(6).r * sx, outer = G.at(1.4).r * sx;
    x.globalCompositeOperation = 'destination-out';
    var rg = x.createRadialGradient(mid.x * sx, mid.y * sy, inner * 0.5, mid.x * sx, mid.y * sy, Math.max(outer, inner + 1));
    rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.fillRect(0, 0, sw, sh);
    // glow ahead (light at the end of the vessel), flickers with the pulse
    x.globalCompositeOperation = 'lighter';
    var far = G.at(14), rr = G.at(3).r * sx, fx = far.x * sx, fy = far.y * sy;
    var gg = x.createRadialGradient(fx, fy, 0, fx, fy, rr);
    gg.addColorStop(0, rgba(st.glow, 0.5 + 0.3 * pulse)); gg.addColorStop(0.25, rgba(st.glow, 0.2 + 0.12 * pulse));
    gg.addColorStop(1, rgba(st.glow, 0));
    x.fillStyle = gg; x.fillRect(fx - rr, fy - rr, rr * 2, rr * 2);
    // wet sheen streaks (drawn on a second scratch, blurred in)
    var c2 = scratchCanvas('sheen', sw, sh), y2 = c2.getContext('2d');
    y2.globalCompositeOperation = 'lighter';
    var z = G.z, segL = 0.35;
    var streaks = [[-2.2, 0.08, 1.0], [-0.9, 0.05, 0.6], [2.5, 0.06, 0.4], [-1.55, 0.035, 0.45], [0.6, 0.045, 0.25]];
    var s0 = Math.floor((z + 0.3) / segL), s1 = Math.ceil((z + dMax) / segL);
    for (var q = 0; q < streaks.length; q++) {
      var th0 = streaks[q][0], wd = streaks[q][1], amp = streaks[q][2] * intensity;
      for (var s = s0; s <= s1; s++) {
        var da = Math.max(s * segL - z, 0.3), db = (s + 1) * segL - z;
        if (db <= 0.3) continue;
        // smooth shimmer: value noise along the vessel
        var u = (s * segL) / 1.7, i0 = Math.floor(u), fu = u - i0, fu2 = fu * fu * (3 - 2 * fu);
        var nz = lerp(h2(i0, q * 31 + 3), h2(i0 + 1, q * 31 + 3), fu2);
        var a = amp * Math.pow(nz, 1.6) * Math.exp(-da / st.fogDist) * 0.6 * (1 + pulse * 0.6) * smooth(0.3, 2.2, da);
        if (a < 0.01) continue;
        var th = th0 + Math.sin(s * segL * 0.4 + q) * 0.06;
        var pa = G.at(da), pb = G.at(db), wj = wd * (0.7 + 0.6 * nz);
        var c1 = Math.cos(th - wj), s1a = Math.sin(th - wj), c2c = Math.cos(th + wj), s2 = Math.sin(th + wj);
        var rA = pa.r * 0.985, rB = pb.r * 0.985;
        y2.beginPath();
        y2.moveTo((pa.x + c1 * rA) * sx, (pa.y + s1a * rA) * sy);
        y2.lineTo((pa.x + c2c * rA) * sx, (pa.y + s2 * rA) * sy);
        y2.lineTo((pb.x + c2c * rB) * sx, (pb.y + s2 * rB) * sy);
        y2.lineTo((pb.x + c1 * rB) * sx, (pb.y + s1a * rB) * sy);
        y2.closePath();
        y2.fillStyle = rgba(st.spec, a); y2.fill();
      }
    }
    x.filter = 'blur(2.5px)'; x.drawImage(c2, 0, 0); x.filter = 'none';
    ctx.save();
    ctx.drawImage(c, 0, 0, W, H);
    ctx.restore();
  }

  /**
   * drawVesselTunnel(ctx, {t, z, radius=1, tint, curve=0, pulse, sway=1, detail=1, cx=0, cy=0})
   * First-person view inside an artery. z = distance travelled along the vessel (world units; vessel
   * radius = 1). Typical camera speed 5–10 z/s. curve: number (−1..1, bends left/right) or {x,y}.
   * pulse 0..1: heartbeat envelope (default: BS.world.heartbeat(t) at 72 bpm) → wall dilation + light flicker.
   * tint: optional CSS color washed over the wall (e.g. alarm), tintAmount (0.35).
   */
  function drawVesselTunnel(ctx, o) {
    o = o || {};
    var G = tubeGeom(ctx, o, null), st = STYLE_ART, detail = o.detail == null ? 1 : o.detail;
    ctx.save();
    var sw = styleWrap(st);
    drawTubeBase(ctx, G, function () { return sw; });
    drawFolds(ctx, G, st, 0.3, 26);
    if (detail > 0) drawEndothelium(ctx, G, st, 0.3, 9.5, 1, 11);
    drawTubeOverlay(ctx, G, st, G.pulse, 22, 1);
    if (o.tint) {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = rgba(parseColor(o.tint), o.tintAmount == null ? 0.35 : o.tintAmount);
      ctx.fillRect(0, 0, G.W, G.H);
    }
    ctx.restore();
    return G;
  }

  /** tunnelProject(ctx, opts, d, ox, oy) → {x, y, r, scale}: project a point at depth d (ahead of camera)
   *  and cross-section offset (ox, oy in vessel radii) using the same geometry as drawVesselTunnel(opts). */
  function tunnelProject(ctx, o, d, ox, oy) {
    var G = tubeGeom(ctx, o || {}, null), p = G.at(d);
    return { x: p.x + (ox || 0) * p.r, y: p.y + (oy || 0) * p.r, r: p.r, scale: p.r / G.H };
  }

  /**
   * drawRBCField3D(ctx, {t, z, count=90, seed=1, speed=1, vz=7, curve, radius, pulse, sway, shutter=0.8,
   *                      platelets=true, plasma=true, closePass=0.14})
   * Perspective field of red blood cells inside the tunnel (same geometry/opts as drawVesselTunnel).
   * Cells flow forward at 2.2*speed z/s; vz = camera speed used only to estimate motion blur.
   */
  function drawRBCField3D(ctx, o) {
    o = o || {};
    var G = tubeGeom(ctx, o, null), t = G.t, z = G.z;
    var count = o.count == null ? 90 : o.count, seed = o.seed == null ? 1 : o.seed, speed = o.speed == null ? 1 : o.speed;
    var vz = o.vz == null ? 7 : o.vz, shutter = o.shutter == null ? 0.8 : o.shutter, close = o.closePass == null ? 0.14 : o.closePass;
    var Lw = 24, near = 0.17, vflow = 2.2 * speed, dv = (vz - vflow) / 30;
    var W = G.W, H = G.H, items = [];
    for (var i = 0; i < count; i++) {
      var R = rng(seed * 7919 + i * 131);
      var a = R() * TAU, rad = Math.sqrt(R()) * 0.8;
      if (R() < close) rad *= 0.22;
      var w0 = R() * Lw, d = mod(w0 + vflow * t * (0.85 + R() * 0.3) - z, Lw);
      var sz = 0.1 + R() * 0.025;
      var tx = R() * TAU, ty = R() * TAU, spx = (R() - 0.5) * 1.6, spy = (R() - 0.5) * 1.2;
      if (d < near) continue;
      items.push({ k: 0, d: d, a: a, rad: rad, sz: sz, tx: tx + spx * t, ty: ty + spy * t });
    }
    if (o.platelets !== false) {
      for (i = 0; i < Math.round(count / 10); i++) {
        R = rng(seed * 104729 + i * 977 + 5);
        var dd = mod(R() * Lw + vflow * t * 1.1 - z, Lw);
        if (dd < near) continue;
        items.push({ k: 1, d: dd, a: R() * TAU, rad: Math.sqrt(R()) * 0.8, sz: 0.035, rot: R() * TAU + t * (R() - 0.5), v: (R() * 4) | 0 });
      }
    }
    items.sort(function (p, q) { return q.d - p.d; });
    ctx.save();
    for (i = 0; i < items.length; i++) {
      var c = items[i], p = G.at(c.d);
      var x = p.x + Math.cos(c.a) * c.rad * p.r, y = p.y + Math.sin(c.a) * c.rad * p.r, rs = p.r * c.sz;
      if (x + rs * 1.3 < 0 || x - rs * 1.3 > W || y + rs * 1.3 < 0 || y - rs * 1.3 > H) continue;
      var p2 = G.at(c.d + dv), x2 = p2.x + Math.cos(c.a) * c.rad * p2.r, y2 = p2.y + Math.sin(c.a) * c.rad * p2.r;
      var blur = Math.min(Math.hypot(x - x2, y - y2) * shutter, rs * 1.2), ang = Math.atan2(y - y2, x - x2);
      var fog = 1 - Math.exp(-c.d / 9), alpha = smooth(Lw, Lw - 5, c.d) * smooth(near, near + 0.12, c.d);
      if (c.k === 0) drawRBC(ctx, { x: x, y: y, r: rs, tiltX: c.tx, tiltY: c.ty, alpha: alpha, blur: blur, blurAngle: ang, fog: fog * 0.92, fogColor: '#c4402f' });
      else drawPlatelet(ctx, { x: x, y: y, r: rs, rot: c.rot, variant: c.v, alpha: alpha * (1 - fog * 0.8), blur: blur, blurAngle: ang });
    }
    // plasma particles: short additive streaks
    if (o.plasma !== false) {
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      var np = Math.round(count * 1.6), bins = [];
      for (i = 0; i < 9; i++) bins.push([]);
      for (i = 0; i < np; i++) {
        R = rng(seed * 15485863 + i * 31 + 2);
        var aa = R() * TAU, rr = Math.sqrt(R()) * 0.95, d1 = mod(R() * 18 + vflow * 1.3 * t - z, 18);
        if (d1 < 0.2) continue;
        var pa = G.at(d1), pb = G.at(d1 + dv * 1.5 + 0.02);
        bins[Math.min(8, Math.floor(d1 / 2))].push(pa.x + Math.cos(aa) * rr * pa.r, pa.y + Math.sin(aa) * rr * pa.r, pb.x + Math.cos(aa) * rr * pb.r, pb.y + Math.sin(aa) * rr * pb.r);
      }
      for (var bI = 0; bI < 9; bI++) {
        var B = bins[bI]; if (!B.length) continue;
        var dm = bI * 2 + 1, al = Math.exp(-dm / 6) * 0.5 * smooth(18, 15, dm);
        ctx.strokeStyle = 'rgba(255,200,150,' + al.toFixed(3) + ')';
        ctx.lineWidth = clamp((G.f / dm) * 0.006, 0.5, 6);
        ctx.beginPath();
        for (var e = 0; e < B.length; e += 4) { ctx.moveTo(B[e], B[e + 1]); ctx.lineTo(B[e + 2], B[e + 3]); }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ============================================================ CAPILLARY 1P */
  var tissueBlobC = null;
  function tissueBlob() {
    if (tissueBlobC) return tissueBlobC;
    var c = mkCanvas(128, 128), x = c.getContext('2d');
    var g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(150,90,190,0.65)'); g.addColorStop(0.22, 'rgba(170,110,190,0.45)');
    g.addColorStop(0.3, 'rgba(255,200,150,0.55)'); g.addColorStop(0.7, 'rgba(255,180,140,0.25)'); g.addColorStop(1, 'rgba(255,170,130,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    tissueBlobC = c; return c;
  }

  /**
   * drawCapillary(ctx, {t, z, narrow=0, curve, pulse, cells=true, seed=3, vz=3})
   * First-person narrowing into a capillary. narrow 0 → wide arteriole with the capillary mouth ahead;
   * narrow 1 → inside the capillary (diameter ≈ one RBC). RBCs converge into single file and deform
   * (parachute shape). Tissue cells glow through the thin capillary wall.
   */
  function drawCapillary(ctx, o) {
    o = o || {};
    var narrow = clamp(o.narrow || 0, 0, 1), e = lerp(9, -3, narrow), rc = 0.27;
    function radFn(d) { return lerp(1, rc, smooth(e - 2.4, e + 1.2, d)); }
    var oo = {}; for (var k in o) oo[k] = o[k];
    if (oo.sway == null) oo.sway = 0.5;
    if (oo.pulse == null) oo.pulse = heartbeat(o.t || 0) * 0.35; // pulsatility is damped in capillaries
    if (oo.camY == null) oo.camY = -0.1 * smooth(0.3, 1, narrow); // slightly off-axis so the single file is visible
    if (oo.camX == null) oo.camX = 0.05 * smooth(0.3, 1, narrow);
    var G = tubeGeom(ctx, oo, radFn), t = G.t, z = G.z;
    function capAmt(d) { return smooth(e - 1, e + 1.5, d); }
    var wA = styleWrap(STYLE_ART), cache = {};
    function styleAt(d) {
      var u = Math.round(capAmt(d) * 20) / 20;
      if (!cache[u]) cache[u] = styleWrap(mixStyle(STYLE_ART, STYLE_CAP, u));
      return cache[u];
    }
    ctx.save();
    drawTubeBase(ctx, G, styleAt);
    // tissue cells glowing through the thin wall (capillary section)
    var dStart = Math.max(e + 0.8, 0.35);
    if (dStart < 16) {
      ctx.globalCompositeOperation = 'screen';
      var sp = 0.9, j0 = Math.floor((z + dStart) / sp), j1 = Math.ceil((z + 16) / sp);
      for (var j = j1; j >= j0; j--) {
        for (var q = 0; q < 5; q++) {
          var w = j * sp + h3(j, q, 77) * sp, d = w - z;
          if (d < dStart || d > 16) continue;
          var th = ((q + h3(q, j, 78)) / 5) * TAU, p = G.at(d), fa = Math.exp(-d / 6) * 0.6 * smooth(dStart, dStart + 1, d);
          var x = p.x + Math.cos(th) * p.r * 1.05, y = p.y + Math.sin(th) * p.r * 1.05, rr = p.r * 0.95;
          ctx.globalAlpha = Math.min(1, fa * 1.6); ctx.drawImage(tissueBlob(), x - rr, y - rr, rr * 2, rr * 2);
        }
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // endothelium: arteriole part + capillary part (only 2–3 cells around the circumference)
    if (e - 2.2 > 0.35) drawEndothelium(ctx, G, STYLE_ART, 0.3, Math.min(e - 2.2, 9.5), 1, 11);
    drawCapWall(ctx, G, STYLE_CAP, Math.max(0.3, e + 0.8), 14, 23);
    drawFolds(ctx, G, mixStyle(STYLE_ART, STYLE_CAP, 0.5), 0.3, Math.max(0.31, e));
    drawTubeOverlay(ctx, G, mixStyle(STYLE_ART, STYLE_CAP, narrow), G.pulse, 16, 0.9);
    // funnel mouth glow
    if (e > 0.5) {
      var pm = G.at(e + 0.5);
      ctx.globalCompositeOperation = 'lighter';
      var gm = ctx.createRadialGradient(pm.x, pm.y, pm.r * 0.6, pm.x, pm.y, pm.r * 2.2);
      gm.addColorStop(0, 'rgba(255,190,140,0.0)'); gm.addColorStop(0.3, 'rgba(255,160,120,0.18)'); gm.addColorStop(1, 'rgba(255,140,100,0)');
      ctx.fillStyle = gm; ctx.fillRect(0, 0, G.W, G.H);
      ctx.globalCompositeOperation = 'source-over';
    }
    // cells: converge into single file and deform into parachutes inside the capillary
    if (o.cells !== false) {
      var seed = o.seed == null ? 3 : o.seed, vz = o.vz == null ? 3 : o.vz, vflow = 1.2, spc = 0.62, Lw = 18;
      var list = [];
      for (var i = 0; i < 34; i++) {
        var R = rng(seed * 3571 + i * 97);
        var dd = mod(i * spc + R() * 0.12 + vflow * t - z, Lw);
        if (dd < 0.2) continue;
        var cap = capAmt(dd);
        var a = R() * TAU, rad = (0.25 + R() * 0.5) * (1 - cap);
        list.push({ d: dd, a: a, rad: rad, cap: cap, tx: R() * TAU + t * (R() - 0.5), ty: R() * TAU + t * (R() - 0.5), j: R() });
      }
      list.sort(function (p, q) { return q.d - p.d; });
      for (i = 0; i < list.length; i++) {
        var c = list[i], pc = G.at(c.d), rr2 = radFn(c.d);
        var wob = 0.03 * c.cap;
        var cx = pc.x + (Math.cos(c.a) * c.rad + Math.sin(t * 2 + c.j * 9) * wob) * pc.r;
        var cy = pc.y + (Math.sin(c.a) * c.rad + Math.cos(t * 1.7 + c.j * 7) * wob) * pc.r;
        var size = lerp(0.11, rc * 0.92, c.cap) * pc.r / Math.max(rr2, 0.01) * rr2;
        var tx = lerp(c.tx, 0.12 * Math.sin(t + c.j * 5), c.cap), ty = lerp(c.ty, 0.12 * Math.cos(t * 0.8 + c.j * 3), c.cap);
        var fog = 1 - Math.exp(-c.d / 7);
        var al = smooth(Lw, Lw - 4, c.d) * smooth(0.2, 0.35, c.d);
        var p2 = G.at(c.d + (vz - vflow) / 30);
        var bl = Math.min(Math.abs(pc.r - p2.r) * 0.35, size * 0.5);
        drawRBC(ctx, { x: cx, y: cy, r: size, tiltX: tx, tiltY: ty, deform: c.cap, alpha: al, fog: fog * 0.85, fogColor: '#e09078', blur: bl, blurAngle: Math.atan2(cy - G.cy0, cx - G.cx0) });
      }
    }
    ctx.restore();
    return G;
  }

  /* ============================================================== SIDE VIEW */
  function sideLayout(ctx, o) {
    var d0 = dims(ctx), W = d0[0], H = d0[1];
    var top = o.top == null ? 70 : o.top, bottom = o.bottom == null ? H : o.bottom, h = bottom - top;
    var ceilB = top + 0.13 * h, floorTop = bottom - 0.27 * h;
    var groundY = floorTop + ((1 - 0.8) / (1.45 - 0.8)) * (bottom - floorTop);
    return { W: W, H: H, top: top, bottom: bottom, ceilB: ceilB, floorTop: floorTop, groundY: groundY };
  }
  var tileCache = {};
  /* periodic-in-x endothelium tile. yMap(v) maps lattice row v∈[0,1] → px. */
  function endoTile(key, P, Ht, nC, nR, yMap, base, colors, seed) {
    if (tileCache[key]) return tileCache[key];
    var c = mkCanvas(P, Ht), x = c.getContext('2d');
    base(x, P, Ht);
    var R = rng(seed);
    var pts = [];
    for (var j = 0; j <= nR + 1; j++) {
      var row = [];
      for (var i = 0; i < nC; i++) {
        var u = ((i + (j & 1) * 0.5 + (R() - 0.5) * 0.4) / nC) * P;
        var v = (j + (R() - 0.5) * 0.3) / nR;
        row.push([u, yMap(clamp(v, -0.05, 1.05)), v]);
      }
      pts.push(row);
    }
    function seg(a, b, dx) { x.moveTo(a[0] + dx, a[1]); x.lineTo(b[0] + dx, b[1]); }
    x.lineCap = 'round';
    for (var pass = 0; pass < 2; pass++) {
      x.beginPath();
      for (j = 0; j <= nR; j++) for (i = 0; i < nC; i++) {
        var P0 = pts[j][i], nA = pts[j + 1][i], iB = (j & 1) ? i + 1 : i - 1, nB = pts[j + 1][mod(iB, nC)];
        var wrapB = iB >= nC ? P : iB < 0 ? -P : 0;
        for (var dx = -P; dx <= P; dx += P) {
          seg(P0, nA, dx);
          x.moveTo(P0[0] + dx, P0[1]); x.lineTo(nB[0] + wrapB + dx, nB[1]);
        }
      }
      if (pass === 0) { x.strokeStyle = colors.line; x.lineWidth = colors.lw * 2.2; x.stroke(); }
      else { x.strokeStyle = colors.hi; x.lineWidth = colors.lw * 0.6; x.translate(0, colors.lw * 0.9); x.stroke(); x.setTransform(1, 0, 0, 1, 0, 0); }
    }
    // nuclei
    for (j = 0; j <= nR; j++) for (i = 0; i < nC; i++) {
      var p0 = pts[j][i], vv = (j + 1) / nR;
      if (vv > 1.05) continue;
      var cy = yMap(clamp(vv, 0, 1)), cyA = yMap(clamp(vv - 0.25 / nR, 0, 1)), cyB = yMap(clamp(vv + 0.25 / nR, 0, 1));
      var ry = Math.max(0.6, Math.abs(cyB - cyA) * 0.7), rx = (P / nC) * 0.24 * (0.85 + R() * 0.3);
      for (dx = -P; dx <= P; dx += P) {
        var cx = p0[0] + dx + (R() - 0.5) * 6;
        if (cx < -rx * 2 || cx > P + rx * 2) continue;
        var g = x.createRadialGradient(cx - rx * 0.3, cy - ry * 0.4, 0, cx, cy, rx);
        g.addColorStop(0, colors.nucHi); g.addColorStop(0.6, colors.nuc); g.addColorStop(1, colors.nucEdge);
        x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fill();
        x.fillStyle = colors.spec; x.beginPath(); x.ellipse(cx - rx * 0.35, cy - ry * 0.45, rx * 0.35, ry * 0.18, 0, 0, TAU); x.fill();
      }
    }
    tileCache[key] = c; return c;
  }
  function farWallTile(h) {
    h = Math.max(8, Math.round(h));
    var P = 2560;
    return endoTile('far' + h, P, h, 30, 9, function (v) { var a = (v - 0.5) * Math.PI * 0.9; return h / 2 + (Math.sin(a) / Math.sin(Math.PI * 0.45)) * h * 0.5; },
      function (x, w, hh) {
        var g = x.createLinearGradient(0, 0, 0, hh);
        g.addColorStop(0, '#4a0410'); g.addColorStop(0.25, '#8a1622'); g.addColorStop(0.5, '#a82430');
        g.addColorStop(0.75, '#8a1622'); g.addColorStop(1, '#4a0410');
        x.fillStyle = g; x.fillRect(0, 0, w, hh);
        var R = rng(55);
        for (var i = 0; i < 70; i++) { // mottled tone variation
          var cx = R() * w, cy = R() * hh, rr = 40 + R() * 140;
          for (var dx = -w; dx <= w; dx += w) {
            var gg = x.createRadialGradient(cx + dx, cy, 0, cx + dx, cy, rr);
            var c = R() < 0.5 ? '255,120,110' : '40,0,10';
            gg.addColorStop(0, 'rgba(' + c + ',0.07)'); gg.addColorStop(1, 'rgba(' + c + ',0)');
            x.fillStyle = gg; x.fillRect(cx + dx - rr, cy - rr, rr * 2, rr * 2);
          }
        }
      },
      { line: 'rgba(52,0,10,0.5)', hi: 'rgba(255,140,130,0.12)', lw: 1.6, nuc: 'rgba(110,22,60,0.55)', nucHi: 'rgba(150,50,90,0.6)', nucEdge: 'rgba(90,10,40,0)', spec: 'rgba(255,200,190,0.18)' }, 101);
  }
  function floorTile() {
    var P = 2560, Ht = 256;
    return endoTile('floor', P, Ht, 22, 5, function (v) { return v * Ht; },
      function (x, w, hh) {
        var g = x.createLinearGradient(0, 0, 0, hh);
        g.addColorStop(0, '#9c2230'); g.addColorStop(1, '#6e0c1a');
        x.fillStyle = g; x.fillRect(0, 0, w, hh);
        var R = rng(77);
        for (var i = 0; i < 40; i++) {
          var cx = R() * w, cy = R() * hh, rx = 60 + R() * 200, ry = 6 + R() * 18;
          for (var dx = -w; dx <= w; dx += w) {
            x.fillStyle = 'rgba(255,170,150,' + (0.04 + R() * 0.05).toFixed(3) + ')';
            x.beginPath(); x.ellipse(cx + dx, cy, rx, ry, 0, 0, TAU); x.fill();
          }
        }
      },
      { line: 'rgba(48,0,10,0.55)', hi: 'rgba(255,160,150,0.16)', lw: 2.2, nuc: 'rgba(110,22,60,0.6)', nucHi: 'rgba(160,60,100,0.65)', nucEdge: 'rgba(90,10,40,0)', spec: 'rgba(255,220,210,0.3)' }, 202);
  }
  /* draw a perspective plane (floor / ceiling) from the tile, strip by strip */
  function drawPlane(ctx, tile, y0, y1, kNear, kFar, nearAtBottom, scroll, W) {
    var P = tile.width, Ht = tile.height, hgt = y1 - y0, strip = 2;
    for (var y = y0; y < y1; y += strip) {
      var q = (y + strip * 0.5 - y0) / hgt; if (!nearAtBottom) q = 1 - q;
      var k = lerp(kFar, kNear, q), v = Math.pow(q, 0.85) * (Ht - 1);
      var ww = W / k, x0 = mod(W / 2 - ww / 2 + scroll, P);
      var sh = Math.min(strip, y1 - y);
      if (x0 + ww <= P) ctx.drawImage(tile, x0, v, ww, 1, 0, y, W, sh);
      else {
        var w1 = P - x0, dw1 = (w1 / ww) * W;
        ctx.drawImage(tile, x0, v, w1, 1, 0, y, dw1, sh);
        ctx.drawImage(tile, 0, v, ww - w1, 1, dw1, y, W - dw1, sh);
      }
    }
  }

  var FLOW_LAYERS = {
    far: { par: 0.42, n: 34, rMin: 14, rMax: 24, v: 70, fog: 0.62, alpha: 0.85, plt: 4, seed: 301 },
    back: { par: 0.62, n: 18, rMin: 30, rMax: 46, v: 120, fog: 0.35, alpha: 0.95, plt: 3, seed: 302 },
    mid: { par: 0.85, n: 9, rMin: 56, rMax: 80, v: 170, fog: 0.12, alpha: 1, plt: 2, seed: 303 },
    front: { par: 1.7, n: 4, rMin: 150, rMax: 250, v: 420, fog: 0, alpha: 0.96, plt: 1, seed: 304 }
  };
  /**
   * drawFlowCells(ctx, {t, scrollX=0, layer='back', top, bottom, scrollSpeed=600, density=1, seed=0, speed=1})
   * Side-view cells flowing to the right (RBCs tumbling, platelets, plasma specks).
   * layer: 'far' | 'back' | 'mid' | 'front' (front = huge blurred cells passing in front of characters).
   * scrollSpeed (px/s of scrollX) is only used to estimate motion blur.
   */
  function drawFlowCells(ctx, o) {
    o = o || {};
    var Lo = sideLayout(ctx, o), W = Lo.W, t = o.t || 0, sx = o.scrollX || 0;
    var cfg = FLOW_LAYERS[o.layer || 'back'] || FLOW_LAYERS.back;
    var dens = o.density == null ? 1 : o.density, spd = o.speed == null ? 1 : o.speed, ss = o.scrollSpeed == null ? 600 : o.scrollSpeed;
    var margin = cfg.rMax * 1.6, span = W + margin * 2;
    var y0, y1;
    if (o.layer === 'front') { y0 = Lo.top - 40; y1 = Lo.bottom + 40; }
    else if (o.layer === 'far') { y0 = Lo.ceilB + 10; y1 = Lo.floorTop - 6; }
    else if (o.layer === 'mid') { y0 = Lo.ceilB + 30; y1 = Lo.groundY - 40; }
    else { y0 = Lo.ceilB + 20; y1 = Lo.floorTop + 10; }
    var n = Math.round(cfg.n * dens), seed = cfg.seed + (o.seed || 0) * 1000;
    var vscreen = cfg.v * spd - ss * cfg.par, blur = Math.abs(vscreen) / 30 * 0.85;
    ctx.save();
    for (var i = 0; i < n; i++) {
      var R = rng(seed * 7 + i * 53);
      var r = lerp(cfg.rMin, cfg.rMax, R()), vv = cfg.v * spd * (0.8 + R() * 0.4);
      var x = mod(R() * span + vv * t - sx * cfg.par, span) - margin;
      var yy = R();
      if (o.layer === 'front') yy = R() < 0.6 ? lerp(0.78, 1.0, yy) : lerp(0, 0.16, yy);
      var y = lerp(y0, y1, yy) + Math.sin(t * (0.6 + R()) + i) * 8;
      var tx = R() * TAU + t * (R() - 0.5) * 1.4, ty = R() * TAU + t * (R() - 0.5) * 1.1;
      if (x < -r * 2 || x > W + r * 2) continue;
      drawRBC(ctx, { x: x, y: y, r: r, tiltX: tx, tiltY: ty, alpha: cfg.alpha, fog: cfg.fog, fogColor: '#b8343a', blur: cfg.par > 1 ? blur * 1.2 + 10 : blur * 0.5, blurAngle: 0 });
    }
    for (i = 0; i < Math.round(cfg.plt * dens); i++) {
      R = rng(seed * 13 + i * 71 + 9);
      var pr = lerp(cfg.rMin, cfg.rMax, R()) * 0.3, pv = cfg.v * spd * (0.9 + R() * 0.3);
      var px = mod(R() * span + pv * t - sx * cfg.par, span) - margin, py = lerp(y0, y1, R());
      drawPlatelet(ctx, { x: px, y: py, r: pr, rot: R() * TAU + t * 0.5, variant: i, alpha: 1 - cfg.fog * 0.8, blur: cfg.par > 1 ? blur : 0 });
    }
    // plasma specks
    ctx.globalCompositeOperation = 'lighter';
    var gs = glowSprite([255, 190, 150]), ns = Math.round((o.layer === 'front' ? 10 : 40) * dens);
    for (i = 0; i < ns; i++) {
      R = rng(seed * 17 + i * 37 + 3);
      var s = (o.layer === 'front' ? 18 : 6) * (0.5 + R()), qx = mod(R() * span + cfg.v * 1.2 * t - sx * cfg.par, span) - margin;
      var qy = lerp(Lo.top, Lo.bottom, R());
      ctx.globalAlpha = 0.25 + 0.3 * R();
      ctx.drawImage(gs, qx - s - blur * 0.5, qy - s, s * 2 + blur, s * 2);
    }
    ctx.restore();
  }

  /**
   * drawVesselSide(ctx, {t, scrollX=0, top=70, bottom=H, pulse, layers='all', scrollSpeed=600})
   * Side view of the vessel interior for running shots. Layers (back→front): outer wall band above `top`,
   * far wall (parallax .35), ceiling plane, far/back cells, floor plane (parallax .8→1.45), mid cells,
   * [front cells if layers==='all']. scrollX = px travelled at the ground plane (parallax 1.0).
   * Returns layout {top, bottom, ceilB, floorTop, groundY}: characters' feet go at groundY
   * (≈ 891 with defaults at 1080p). For proper occlusion use layers:'back', draw characters, then
   * drawFlowCells({layer:'front'}).
   */
  function drawVesselSide(ctx, o) {
    o = o || {};
    var Lo = sideLayout(ctx, o), W = Lo.W, H = Lo.H, t = o.t || 0, sx = o.scrollX || 0;
    var pulse = o.pulse == null ? heartbeat(t) : o.pulse;
    ctx.save();
    // outer wall (tunica layers) above top
    if (Lo.top > 0) {
      var gw = ctx.createLinearGradient(0, 0, 0, Lo.top);
      gw.addColorStop(0, '#1a0206'); gw.addColorStop(0.6, '#3a0710'); gw.addColorStop(1, '#5a0c18');
      ctx.fillStyle = gw; ctx.fillRect(0, 0, W, Lo.top);
    }
    // far wall
    var fh = Lo.floorTop - Lo.ceilB + 60, fy = Lo.ceilB - 30, tile = farWallTile(fh);
    var x0 = mod(sx * 0.35, tile.width);
    ctx.drawImage(tile, -x0, fy); ctx.drawImage(tile, -x0 + tile.width, fy);
    // depth haze over far wall + pulse light
    var hz = ctx.createLinearGradient(0, fy, 0, fy + fh);
    hz.addColorStop(0, 'rgba(40,0,8,0.5)'); hz.addColorStop(0.35, 'rgba(210,70,60,' + (0.22 + 0.1 * pulse).toFixed(3) + ')');
    hz.addColorStop(0.65, 'rgba(210,70,60,' + (0.18 + 0.1 * pulse).toFixed(3) + ')'); hz.addColorStop(1, 'rgba(40,0,8,0.45)');
    ctx.fillStyle = hz; ctx.fillRect(0, fy, W, fh);
    drawFlowCells(ctx, { t: t, scrollX: sx, layer: 'far', top: o.top, bottom: o.bottom, scrollSpeed: o.scrollSpeed });
    // ceiling plane
    var ft = floorTile();
    drawPlane(ctx, ft, Lo.top, Lo.ceilB, 1.45, 0.8, false, sx, W);
    var gc = ctx.createLinearGradient(0, Lo.top, 0, Lo.ceilB);
    gc.addColorStop(0, 'rgba(20,0,4,0.75)'); gc.addColorStop(0.7, 'rgba(40,0,8,0.35)'); gc.addColorStop(1, 'rgba(255,140,120,0.12)');
    ctx.fillStyle = gc; ctx.fillRect(0, Lo.top, W, Lo.ceilB - Lo.top);
    drawFlowCells(ctx, { t: t, scrollX: sx, layer: 'back', top: o.top, bottom: o.bottom, scrollSpeed: o.scrollSpeed });
    // floor plane
    drawPlane(ctx, ft, Lo.floorTop, Lo.bottom, 1.45, 0.8, true, sx, W);
    var gf = ctx.createLinearGradient(0, Lo.floorTop, 0, Lo.bottom);
    gf.addColorStop(0, 'rgba(60,0,10,0.55)'); gf.addColorStop(0.12, 'rgba(255,160,130,0.10)');
    gf.addColorStop((Lo.groundY - Lo.floorTop) / (Lo.bottom - Lo.floorTop), 'rgba(255,170,140,0.06)'); gf.addColorStop(1, 'rgba(20,0,4,0.55)');
    ctx.fillStyle = gf; ctx.fillRect(0, Lo.floorTop, W, Lo.bottom - Lo.floorTop);
    // crease where far wall meets floor/ceiling
    ctx.globalCompositeOperation = 'source-over';
    var gcr = ctx.createLinearGradient(0, Lo.floorTop - 30, 0, Lo.floorTop + 20);
    gcr.addColorStop(0, 'rgba(40,0,8,0)'); gcr.addColorStop(0.6, 'rgba(40,0,8,0.5)'); gcr.addColorStop(1, 'rgba(40,0,8,0)');
    ctx.fillStyle = gcr; ctx.fillRect(0, Lo.floorTop - 30, W, 50);
    // wet sheen streaks on the floor (scroll with ground)
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 9; i++) {
      var R = rng(900 + i), q = R(), yy = lerp(Lo.floorTop + 6, Lo.bottom - 10, q), k = lerp(0.8, 1.45, q);
      var span = W + 900, xx = mod(R() * span - sx * k, span) - 450, ww = 180 + R() * 380;
      var gs = ctx.createRadialGradient(xx, yy, 0, xx, yy, ww);
      gs.addColorStop(0, 'rgba(255,200,180,' + (0.12 + 0.05 * pulse).toFixed(3) + ')'); gs.addColorStop(1, 'rgba(255,200,180,0)');
      ctx.save(); ctx.translate(xx, yy); ctx.scale(1, 0.06 + q * 0.05); ctx.translate(-xx, -yy);
      ctx.fillStyle = gs; ctx.fillRect(xx - ww, yy - ww, ww * 2, ww * 2); ctx.restore();
    }
    // specular line along the ceiling
    var gl = ctx.createLinearGradient(0, Lo.ceilB - 26, 0, Lo.ceilB + 4);
    gl.addColorStop(0, 'rgba(255,170,150,0)'); gl.addColorStop(0.7, 'rgba(255,190,170,' + (0.16 + 0.08 * pulse).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,170,150,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, Lo.ceilB - 26, W, 30);
    ctx.globalCompositeOperation = 'source-over';
    drawLightRays(ctx, { x: W * 0.28, y: Lo.top - 60, angle: Math.PI * 0.42, spread: 0.7, count: 6, length: H * 1.1, t: t, alpha: 0.10 + 0.05 * pulse, seed: 5 });
    drawFlowCells(ctx, { t: t, scrollX: sx, layer: 'mid', top: o.top, bottom: o.bottom, scrollSpeed: o.scrollSpeed });
    if ((o.layers || 'all') === 'all') drawFlowCells(ctx, { t: t, scrollX: sx, layer: 'front', top: o.top, bottom: o.bottom, scrollSpeed: o.scrollSpeed });
    ctx.restore();
    return Lo;
  }

  /* ======================================================= CAPILLARY SIDE */
  /**
   * drawCapillarySide(ctx, {t, scrollX=0, narrow=0, cy=H/2, cells=true, glow=0, glowX=W*0.62, scrollSpeed=400, seed=0})
   * Side view: a thin capillary crossing the frame, tissue (interstitium + tissue cells) outside the
   * one-cell-thick wall, single-file RBCs deformed into parachutes flowing →.
   * Inner lumen height = lerp(780, 400, narrow). Returns {top, bottom, cy, groundY, wall, tissue:[{x,y,r}]}
   * (groundY = inner floor of the lumen; tissue = visible near tissue cells, useful for O₂ targets).
   */
  function drawCapillarySide(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), W = d0[0], H = d0[1], t = o.t || 0, sx = o.scrollX || 0, narrow = clamp(o.narrow || 0, 0, 1);
    var cy = o.cy == null ? H / 2 : o.cy, hIn = lerp(780, 400, narrow), wt = 30;
    var top = cy - hIn / 2, bottom = cy + hIn / 2;
    var ss = o.scrollSpeed == null ? 400 : o.scrollSpeed;
    ctx.save();
    // interstitium
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3a0e1c'); g.addColorStop(0.5, '#6a2232'); g.addColorStop(1, '#3a0e1c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // collagen fibres (wavy) parallax .3
    ctx.lineCap = 'round';
    for (var i = 0; i < 26; i++) {
      var R = rng(4000 + i), span = W + 800, x = mod(R() * span - sx * 0.3, span) - 400, y = R() * H, len = 300 + R() * 500;
      ctx.beginPath();
      for (var s = 0; s <= 24; s++) {
        var u = s / 24, px = x + u * len, py = y + Math.sin(u * 12 + R() * 6 + t * 0.4) * 10 + (u - 0.5) * (R() - 0.5) * 140;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(255,190,170,' + (0.05 + R() * 0.07).toFixed(3) + ')'; ctx.lineWidth = 2 + R() * 4; ctx.stroke();
    }
    // far tissue cells (parallax .45, dim)
    var tissue = [];
    var layers = [[0.45, 230, 0.45, 70, 6], [0.9, 380, 1, 160, 7]];
    for (var L = 0; L < 2; L++) {
      var cf = layers[L], spanT = W + cf[1] * 2, n = Math.ceil(W / cf[1]) + 2;
      for (i = 0; i < n * 2; i++) {
        R = rng(5000 + L * 100 + i);
        var above = i % 2 === 0, k = Math.floor(i / 2);
        var tx = mod(k * cf[1] + R() * cf[1] * 0.4 - sx * cf[0], n * cf[1]) - cf[1];
        var r = cf[3] * (0.85 + R() * 0.3);
        var ty = above ? top - wt - r * (0.75 + R() * 0.35) - (L === 0 ? 120 : 0) : bottom + wt + r * (0.75 + R() * 0.35) + (L === 0 ? 120 : 0);
        if (ty + r < -20 || ty - r > H + 20 || tx + r < -20 || tx - r > W + 20) continue;
        var gl = 0;
        if (L === 1 && o.glow) gl = o.glow * smooth(r * 1.5, 0, Math.abs(tx - (o.glowX == null ? W * 0.62 : o.glowX)));
        ctx.globalAlpha = cf[2];
        drawTissueCell(ctx, { x: tx, y: ty, r: r, t: t, glow: gl, seed: 5000 + L * 100 + i });
        ctx.globalAlpha = 1;
        if (L === 0) { ctx.fillStyle = 'rgba(58,14,28,0.45)'; ctx.beginPath(); ctx.arc(tx, ty, r * 1.25, 0, TAU); ctx.fill(); }
        else tissue.push({ x: tx, y: ty, r: r, above: above });
      }
    }
    // lumen plasma
    var gp = ctx.createLinearGradient(0, top - wt, 0, bottom + wt);
    gp.addColorStop(0, '#b8404a'); gp.addColorStop(0.5, '#e07a6a'); gp.addColorStop(1, '#a8323e');
    ctx.fillStyle = gp; ctx.fillRect(0, top, W, hIn);
    ctx.globalCompositeOperation = 'lighter';
    var gpl = ctx.createLinearGradient(0, top, 0, bottom);
    gpl.addColorStop(0, 'rgba(255,200,160,0)'); gpl.addColorStop(0.45, 'rgba(255,200,160,0.12)'); gpl.addColorStop(1, 'rgba(255,200,160,0)');
    ctx.fillStyle = gpl; ctx.fillRect(0, top, W, hIn);
    ctx.globalCompositeOperation = 'source-over';
    // single-file deformed RBCs (parachutes) – flow faster than scroll so they pass the camera slowly
    if (o.cells !== false) {
      var rr = (hIn * 0.5) / 0.8 * 0.93, spc = rr * 2.3, vflow = 260, n2 = Math.ceil(W / spc) + 3;
      var blur = Math.abs(vflow - ss) / 30 * 0.6;
      for (i = -1; i < n2; i++) {
        var base = Math.floor((sx - vflow * t) / spc);
        var idx = base + i, xx = idx * spc + vflow * t - sx + spc * 0.5;
        R = rng(6000 + idx * 13 + (o.seed || 0));
        drawRBC(ctx, { x: xx, y: cy + Math.sin(t * 2 + idx) * hIn * 0.02, r: rr * (0.96 + R() * 0.08), tiltY: -Math.PI / 2 + (R() - 0.5) * 0.25,
          tiltX: (R() - 0.5) * 0.3, deform: lerp(0.6, 1, narrow), blur: blur, blurAngle: 0 });
      }
    }
    // thin wall: endothelium with flattened nuclei bulging into the lumen
    for (var side = 0; side < 2; side++) {
      var wy = side === 0 ? top - wt : bottom, gwl = ctx.createLinearGradient(0, wy, 0, wy + wt);
      gwl.addColorStop(0, side ? 'rgba(240,150,150,0.92)' : 'rgba(200,90,110,0.75)');
      gwl.addColorStop(1, side ? 'rgba(200,90,110,0.75)' : 'rgba(240,150,150,0.92)');
      ctx.fillStyle = gwl; ctx.fillRect(0, wy, W, wt);
      ctx.strokeStyle = 'rgba(255,220,210,0.55)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, side ? wy : wy + wt); ctx.lineTo(W, side ? wy : wy + wt); ctx.stroke();
      ctx.strokeStyle = 'rgba(90,20,40,0.6)';
      ctx.beginPath(); ctx.moveTo(0, side ? wy + wt : wy); ctx.lineTo(W, side ? wy + wt : wy); ctx.stroke();
      var cellLen = 520, ncell = Math.ceil(W / cellLen) + 2;
      for (i = -1; i < ncell; i++) {
        var bi = Math.floor(sx / cellLen) + i, jx = bi * cellLen - sx;
        R = rng(7000 + bi * 3 + side);
        // junction
        ctx.strokeStyle = 'rgba(110,30,50,0.55)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(jx, wy); ctx.lineTo(jx + 14, wy + wt); ctx.stroke();
        // nucleus
        var nx = jx + cellLen * (0.35 + R() * 0.3), ny = side ? wy + wt * 0.35 : wy + wt * 0.65;
        var gn = ctx.createRadialGradient(nx - 20, ny - 4, 2, nx, ny, 70);
        gn.addColorStop(0, '#c890c8'); gn.addColorStop(0.6, '#8a4a8c'); gn.addColorStop(1, '#6a2a5c');
        ctx.fillStyle = gn; ctx.beginPath(); ctx.ellipse(nx, ny, 70, wt * 0.62, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,255,0.35)'; ctx.beginPath(); ctx.ellipse(nx - 18, ny - wt * 0.22, 26, 4, 0, 0, TAU); ctx.fill();
      }
    }
    // atmosphere
    ctx.globalCompositeOperation = 'lighter';
    var ga = ctx.createRadialGradient(W * 0.5, cy, 0, W * 0.5, cy, W * 0.6);
    ga.addColorStop(0, 'rgba(255,150,110,0.12)'); ga.addColorStop(1, 'rgba(255,150,110,0)');
    ctx.fillStyle = ga; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawParticles(ctx, { t: t, seed: 41, count: 50, vx: -40 - ss * 0.3, vy: -6, size: 4, color: '255,210,180', alpha: 0.4 });
    return { top: top, bottom: bottom, cy: cy, groundY: bottom - 4, wall: wt, tissue: tissue };
  }

  /* ============================================================ TISSUE CELL */
  /**
   * drawTissueCell(ctx, {x, y, r=120, t=0, glow=0, seed=1, alpha=1})
   * Friendly-but-scientific tissue cell: wobbling membrane (bilayer hint), cytoplasm, mitochondria,
   * ER, nucleus with nucleolus. glow 0..1 = soft cyan "receiving O₂" halo.
   */
  function drawTissueCell(ctx, o) {
    var x = o.x || 0, y = o.y || 0, r = o.r || 120, t = o.t || 0, glow = clamp(o.glow || 0, 0, 1), seed = o.seed == null ? 1 : o.seed;
    var R = rng(seed * 31 + 7), ph = R() * TAU, ph2 = R() * TAU, sq = 0.88 + R() * 0.2;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.translate(x, y);
    function shape(scale) {
      ctx.beginPath();
      var N = 40;
      for (var i = 0; i <= N; i++) {
        var a = (i / N) * TAU;
        var rr = r * scale * (1 + 0.055 * Math.sin(3 * a + ph + t * 0.7) + 0.035 * Math.sin(5 * a + ph2 - t * 0.9) + 0.02 * Math.sin(7 * a + t * 1.3));
        var px = Math.cos(a) * rr, py = Math.sin(a) * rr * sq;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    if (glow > 0.01) {
      var pulse = 0.75 + 0.25 * Math.sin(t * 6);
      ctx.globalCompositeOperation = 'lighter';
      var hg = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 1.7);
      hg.addColorStop(0, 'rgba(150,230,255,' + (0.55 * glow * pulse).toFixed(3) + ')');
      hg.addColorStop(0.4, 'rgba(110,200,255,' + (0.22 * glow * pulse).toFixed(3) + ')'); hg.addColorStop(1, 'rgba(110,200,255,0)');
      ctx.fillStyle = hg; ctx.fillRect(-r * 1.8, -r * 1.8, r * 3.6, r * 3.6);
      ctx.globalCompositeOperation = 'source-over';
    }
    shape(1);
    var cg = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
    cg.addColorStop(0, '#ffdcc8'); cg.addColorStop(0.55, '#f2a69a'); cg.addColorStop(1, '#c86a78');
    ctx.fillStyle = cg; ctx.fill();
    ctx.save(); ctx.clip();
    // ER (rough endoplasmic reticulum) faint arcs
    ctx.strokeStyle = 'rgba(190,90,120,0.32)'; ctx.lineWidth = Math.max(1, r * 0.02);
    for (var i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.arc(r * 0.1, r * 0.05, r * (0.48 + i * 0.09), 2.1 + i * 0.12, 3.6 + i * 0.1); ctx.stroke();
    }
    // mitochondria
    for (i = 0; i < 5; i++) {
      var a = R() * TAU, dd = r * (0.55 + R() * 0.25), mx = Math.cos(a) * dd, my = Math.sin(a) * dd * sq, ml = r * (0.12 + R() * 0.06);
      ctx.save(); ctx.translate(mx, my); ctx.rotate(a + Math.PI / 2 + (R() - 0.5));
      ctx.fillStyle = '#e8865a'; ctx.strokeStyle = 'rgba(150,50,40,0.7)'; ctx.lineWidth = Math.max(1, r * 0.012);
      ctx.beginPath(); ctx.ellipse(0, 0, ml, ml * 0.45, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      for (var c = -2; c <= 2; c++) { ctx.moveTo(c * ml * 0.3, -ml * 0.3); ctx.lineTo(c * ml * 0.3 + ml * 0.1, ml * 0.3); }
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    // membrane (bilayer hint)
    shape(1); ctx.strokeStyle = 'rgba(150,50,80,0.9)'; ctx.lineWidth = Math.max(1.5, r * 0.035); ctx.stroke();
    shape(0.965); ctx.strokeStyle = 'rgba(255,220,220,0.55)'; ctx.lineWidth = Math.max(1, r * 0.012); ctx.stroke();
    // nucleus
    var nx = -r * 0.08, ny = r * 0.02, nr = r * 0.36;
    var ng = ctx.createRadialGradient(nx - nr * 0.35, ny - nr * 0.4, nr * 0.1, nx, ny, nr);
    ng.addColorStop(0, '#c8a0e0'); ng.addColorStop(0.7, '#8c5cb0'); ng.addColorStop(1, '#6a3a90');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.ellipse(nx, ny, nr, nr * 0.92, 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(70,30,100,0.8)'; ctx.lineWidth = Math.max(1, r * 0.018); ctx.stroke();
    for (i = 0; i < 9; i++) { // chromatin
      var ca = R() * TAU, cd = R() * nr * 0.7;
      ctx.fillStyle = 'rgba(90,40,120,0.45)'; ctx.beginPath(); ctx.arc(nx + Math.cos(ca) * cd, ny + Math.sin(ca) * cd, nr * (0.05 + R() * 0.06), 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#4e2470'; ctx.beginPath(); ctx.arc(nx + nr * 0.25, ny + nr * 0.15, nr * 0.2, 0, TAU); ctx.fill(); // nucleolus
    // gloss
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,240,235,0.22)'; ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.5 * sq, r * 0.3, r * 0.12, -0.6, 0, TAU); ctx.fill();
    if (glow > 0.01) {
      shape(1); ctx.strokeStyle = 'rgba(160,235,255,' + (0.7 * glow).toFixed(3) + ')'; ctx.lineWidth = Math.max(2, r * 0.04); ctx.stroke();
      var ig = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      ig.addColorStop(0, 'rgba(140,220,255,' + (0.2 * glow).toFixed(3) + ')'); ig.addColorStop(1, 'rgba(140,220,255,0)');
      ctx.fillStyle = ig; ctx.fillRect(-r, -r, r * 2, r * 2);
    }
    ctx.restore();
  }

  /* ===================================================================== O2 */
  /** drawO2(ctx, {x, y, size=64, alpha=1, t=0, color='#8fe3ff', orb=true}) glowing "O₂" (O + subscript 2). */
  function drawO2(ctx, o) {
    var x = o.x || 0, y = o.y || 0, size = o.size || 64, a = o.alpha == null ? 1 : o.alpha, t = o.t || 0;
    if (a <= 0.004) return;
    var col = parseColor(o.color || '#8fe3ff'), s = size * (1 + 0.04 * Math.sin(t * 4.2));
    ctx.save(); ctx.globalAlpha *= a;
    if (o.orb !== false) {
      ctx.globalCompositeOperation = 'lighter';
      var g = ctx.createRadialGradient(x, y, 0, x, y, s * 1.5);
      g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(0.35, rgba(col, 0.25)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(x - s * 1.5, y - s * 1.5, s * 3, s * 3);
      ctx.strokeStyle = rgba(col, 0.35); ctx.lineWidth = Math.max(1, s * 0.035);
      ctx.beginPath(); ctx.arc(x, y, s * 0.86, 0, TAU); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    var fo = s * 0.9, fs = fo * 0.55;
    ctx.font = font(fo); var wO = ctx.measureText('O').width;
    ctx.font = font(fs); var w2 = ctx.measureText('2').width;
    var total = wO + w2 * 0.95, x0 = x - total / 2, base = y + fo * 0.34;
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++) {
      if (pass === 0) { ctx.shadowColor = rgba(col, 1); ctx.shadowBlur = s * 0.35; ctx.fillStyle = rgba(col, 0.9); }
      else { ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; }
      ctx.font = font(fo); ctx.fillText('O', x0, base);
      ctx.font = font(fs); ctx.fillText('2', x0 + wO * 0.98, base + fo * 0.18);
    }
    ctx.restore();
  }

  /**
   * drawO2Transfer(ctx, {from:{x,y}, to:{x,y}, p, t, count=7, size=34, arc=0.25})
   * Schematic: O₂ released from a carrier (dissociates from hemoglobin) and diffusing into a tissue cell.
   * p 0..1 = progress of the release; glyphs travel along a gentle arc, fade in at the carrier and are
   * absorbed (shrink + fade) at the tissue cell.
   */
  function drawO2Transfer(ctx, o) {
    var f = o.from || { x: 0, y: 0 }, to = o.to || { x: 100, y: 0 }, p = clamp(o.p || 0, 0, 1), t = o.t || 0;
    var n = o.count || 7, size = o.size || 34, arc = o.arc == null ? 0.25 : o.arc;
    var dx = to.x - f.x, dy = to.y - f.y, dist = Math.hypot(dx, dy) || 1;
    var mx = (f.x + to.x) / 2 - (dy / dist) * dist * arc, my = (f.y + to.y) / 2 + (dx / dist) * dist * arc;
    function bez(s) { var u = 1 - s; return [u * u * f.x + 2 * u * s * mx + s * s * to.x, u * u * f.y + 2 * u * s * my + s * s * to.y]; }
    ctx.save();
    // faint diffusion trail
    ctx.globalCompositeOperation = 'lighter';
    ctx.setLineDash([size * 0.25, size * 0.35]); ctx.lineDashOffset = -t * size * 2;
    ctx.strokeStyle = 'rgba(140,220,255,' + (0.35 * smooth(0, 0.15, p) * (1 - smooth(0.85, 1, p))).toFixed(3) + ')';
    ctx.lineWidth = Math.max(1, size * 0.08);
    ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(mx, my, to.x, to.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'source-over';
    var arrived = 0;
    for (var i = 0; i < n; i++) {
      var s = p * 1.7 - i * (0.7 / n);
      if (s >= 1) { arrived++; continue; }
      if (s <= 0) continue;
      var se = s * s * (3 - 2 * s), q = bez(se), wob = Math.sin(t * 5 + i * 1.7) * size * 0.25;
      var a = smooth(0, 0.12, s) * (1 - smooth(0.85, 1, s)), sc = lerp(0.7, 1, smooth(0, 0.2, s)) * (1 - 0.5 * smooth(0.85, 1, s));
      drawO2(ctx, { x: q[0] - (dy / dist) * wob, y: q[1] + (dx / dist) * wob, size: size * sc, alpha: a, t: t + i });
    }
    if (arrived > 0 || p > 0.5) { // absorption sparkle at the tissue cell
      var k = arrived / n;
      ctx.globalCompositeOperation = 'lighter';
      var g = ctx.createRadialGradient(to.x, to.y, 0, to.x, to.y, size * 2.2);
      var aa = 0.35 * Math.min(1, k * 2) * (0.7 + 0.3 * Math.sin(t * 9));
      g.addColorStop(0, 'rgba(200,245,255,' + aa.toFixed(3) + ')'); g.addColorStop(1, 'rgba(120,210,255,0)');
      ctx.fillStyle = g; ctx.fillRect(to.x - size * 2.2, to.y - size * 2.2, size * 4.4, size * 4.4);
    }
    ctx.restore();
  }

  /* =============================================================== PATHOGEN */
  /**
   * drawPathogenSilhouette(ctx, {x, y, size=320, t=0, reveal=0.5, eyes=true, seed=1, rimColor='#ff3a3a'})
   * Menacing original silhouette (lumpy bacterium-like body, pili, whipping flagella) kept in shadow.
   * reveal 0..1: 0 = only a faint shape + eyes in the dark, 1 = fully outlined by rim light (still a silhouette).
   */
  function drawPathogenSilhouette(ctx, o) {
    var x = o.x || 0, y = o.y || 0, S = o.size || 320, t = o.t || 0, rv = clamp(o.reveal == null ? 0.5 : o.reveal, 0, 1);
    var R = rng((o.seed || 1) * 977), rim = parseColor(o.rimColor || '#ff3a3a');
    var lumps = []; for (var i = 0; i < 7; i++) lumps.push([R() * TAU, 0.05 + R() * 0.08, 2 + ((R() * 4) | 0)]);
    function bodyPath(sc) {
      ctx.beginPath();
      var N = 72;
      for (var k = 0; k <= N; k++) {
        var a = (k / N) * TAU, rr = 0.5;
        for (var j = 0; j < lumps.length; j++) rr += lumps[j][1] * 0.5 * Math.sin(a * lumps[j][2] + lumps[j][0] + t * (0.6 + j * 0.1));
        var spike = Math.pow(Math.max(0, Math.sin(a * 9 + t * 0.8)), 18) * 0.06;
        rr = (rr + spike) * S * sc;
        var px = Math.cos(a) * rr * 1.35, py = Math.sin(a) * rr * 0.82;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    ctx.save();
    ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.5) * 0.05 + (o.rot || 0));
    var breathe = 1 + Math.sin(t * 1.6) * 0.02; ctx.scale(breathe, 1 / breathe);
    // shadow aura
    var ag = ctx.createRadialGradient(0, 0, S * 0.2, 0, 0, S * 1.3);
    ag.addColorStop(0, 'rgba(8,0,6,' + (0.55 + 0.3 * rv).toFixed(3) + ')'); ag.addColorStop(1, 'rgba(8,0,6,0)');
    ctx.fillStyle = ag; ctx.fillRect(-S * 1.4, -S * 1.4, S * 2.8, S * 2.8);
    var bodyA = 0.55 + 0.45 * rv;
    // flagella
    ctx.lineCap = 'round';
    for (i = 0; i < 4; i++) {
      var ba = Math.PI + (i - 1.5) * 0.35, L = S * (0.9 + 0.3 * R());
      ctx.beginPath();
      for (var s2 = 0; s2 <= 30; s2++) {
        var u = s2 / 30, ang = ba + Math.sin(u * 7 - t * 5 + i) * 0.25 * u;
        var px = Math.cos(ba) * S * 0.6 + Math.cos(ang) * L * u, py = Math.sin(ba) * S * 0.35 + Math.sin(ang) * L * u + Math.sin(u * 9 - t * 6 + i * 2) * S * 0.06 * u;
        if (s2 === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(14,2,10,' + (bodyA * 0.9).toFixed(3) + ')'; ctx.lineWidth = S * 0.025; ctx.stroke();
    }
    // pili (short spikes)
    ctx.beginPath();
    for (i = 0; i < 46; i++) {
      var a = (i / 46) * TAU + R() * 0.1, r0 = S * 0.5, ln = S * (0.08 + R() * 0.1) * (1 + 0.15 * Math.sin(t * 3 + i));
      var bx = Math.cos(a) * r0 * 1.3, by = Math.sin(a) * r0 * 0.78;
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * ln * 1.3, by + Math.sin(a) * ln);
    }
    ctx.strokeStyle = 'rgba(14,2,10,' + bodyA.toFixed(3) + ')'; ctx.lineWidth = S * 0.012; ctx.stroke();
    // body
    bodyPath(1);
    var bg = ctx.createRadialGradient(-S * 0.15, -S * 0.2, S * 0.05, 0, 0, S * 0.75);
    bg.addColorStop(0, 'rgba(40,10,30,' + bodyA.toFixed(3) + ')'); bg.addColorStop(1, 'rgba(6,0,4,' + bodyA.toFixed(3) + ')');
    ctx.fillStyle = bg; ctx.fill();
    // rim light (extent grows with reveal)
    ctx.save(); bodyPath(1); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    var ext = 0.6 + rv * 2.4, ca = -Math.PI * 0.62;
    ctx.lineWidth = S * 0.05;
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      var N = 48;
      for (var k = 0; k <= N; k++) {
        var aa = ca - ext / 2 + (k / N) * ext, rr = 0.5;
        for (var j = 0; j < lumps.length; j++) rr += lumps[j][1] * 0.5 * Math.sin(aa * lumps[j][2] + lumps[j][0] + t * (0.6 + j * 0.1));
        var qx = Math.cos(aa) * rr * S * 1.35, qy = Math.sin(aa) * rr * S * 0.82;
        if (k === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
      }
      ctx.strokeStyle = rgba(rim, (pass ? 0.75 : 0.25) * (0.35 + 0.65 * rv)); ctx.lineWidth = S * (pass ? 0.014 : 0.06); ctx.stroke();
    }
    ctx.restore();
    // eyes
    if (o.eyes !== false) {
      var blink = Math.pow(Math.abs(Math.sin(t * 0.9)), 0.15) * (mod(t, 3.7) < 0.12 ? 0.1 : 1);
      ctx.globalCompositeOperation = 'lighter';
      var eyes = [[-0.18, -0.08, 1], [0.08, -0.12, 0.85], [0.3, -0.02, 0.55]];
      for (i = 0; i < eyes.length; i++) {
        var ex = eyes[i][0] * S, ey = eyes[i][1] * S, es = eyes[i][2] * S * 0.07;
        var eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, es * 4);
        eg.addColorStop(0, 'rgba(230,255,120,0.9)'); eg.addColorStop(0.3, 'rgba(180,255,60,0.35)'); eg.addColorStop(1, 'rgba(150,255,40,0)');
        ctx.fillStyle = eg; ctx.fillRect(ex - es * 4, ey - es * 4, es * 8, es * 8);
        ctx.fillStyle = 'rgba(250,255,200,0.95)';
        ctx.beginPath(); ctx.ellipse(ex, ey, es * 1.3, Math.max(0.5, es * 0.38 * blink), -0.2, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ================================================================ EFFECTS */
  /**
   * drawAlarm(ctx, {t, intensity=1, label='警報', sub='異物侵入', en='WARNING', stripes=true, rate=1.4, bandY=H*0.16})
   * Red pulsing tint + flash, dark-red vignette, moving hazard stripes top/bottom, scanning line and
   * a warning band. label:null hides the band.
   */
  function drawAlarm(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), W = d0[0], H = d0[1], t = o.t || 0, I = clamp(o.intensity == null ? 1 : o.intensity, 0, 1);
    if (I <= 0.001) return;
    var rate = o.rate || 1.4, ph = mod(t * rate, 1), flash = Math.pow(0.5 + 0.5 * Math.cos(ph * TAU), 3);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255,' + (90 - 40 * flash).toFixed(0) + ',' + (80 - 40 * flash).toFixed(0) + ',' + (0.55 * I).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,30,20,' + (0.22 * flash * I).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    vg.addColorStop(0, 'rgba(60,0,0,0)'); vg.addColorStop(1, 'rgba(70,0,4,' + ((0.55 + 0.25 * flash) * I).toFixed(3) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // edge glow
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,40,30,' + (0.5 * flash * I).toFixed(3) + ')'; ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, W - 18, H - 18);
    // scan line
    var sy = mod(t * 0.55, 1) * H;
    var sg = ctx.createLinearGradient(0, sy - 80, 0, sy + 4);
    sg.addColorStop(0, 'rgba(255,60,40,0)'); sg.addColorStop(1, 'rgba(255,120,90,' + (0.22 * I).toFixed(3) + ')');
    ctx.fillStyle = sg; ctx.fillRect(0, sy - 80, W, 84);
    ctx.globalCompositeOperation = 'source-over';
    // hazard stripes
    if (o.stripes !== false) {
      var bh = 44, off = mod(t * 160, 80);
      for (var b = 0; b < 2; b++) {
        var by = b ? H - bh : 0;
        ctx.save(); ctx.beginPath(); ctx.rect(0, by, W, bh); ctx.clip();
        ctx.fillStyle = 'rgba(20,0,0,' + (0.8 * I).toFixed(3) + ')'; ctx.fillRect(0, by, W, bh);
        ctx.beginPath();
        for (var sx2 = -120 + (b ? -off : off); sx2 < W + 120; sx2 += 80) {
          ctx.moveTo(sx2, by + bh); ctx.lineTo(sx2 + 40, by + bh); ctx.lineTo(sx2 + 40 + bh, by); ctx.lineTo(sx2 + bh, by); ctx.closePath();
        }
        ctx.fillStyle = 'rgba(230,30,30,' + ((0.65 + 0.35 * flash) * I).toFixed(3) + ')'; ctx.fill();
        ctx.restore();
      }
    }
    // band
    var label = o.label === undefined ? '警報' : o.label;
    if (label) {
      var by2 = o.bandY == null ? H * 0.16 : o.bandY, bh2 = 130, slide = smooth(0, 0.25, t * 2.5 /* fast in */ );
      var sub = o.sub === undefined ? '異物侵入' : o.sub, en = o.en === undefined ? 'WARNING' : o.en;
      ctx.save();
      ctx.globalAlpha = I * (o.bandAlpha == null ? 1 : o.bandAlpha);
      var bg = ctx.createLinearGradient(0, by2 - bh2 / 2, 0, by2 + bh2 / 2);
      bg.addColorStop(0, 'rgba(30,0,4,0.82)'); bg.addColorStop(1, 'rgba(70,0,8,0.82)');
      ctx.fillStyle = bg; ctx.fillRect(0, by2 - bh2 / 2, W, bh2);
      ctx.fillStyle = 'rgba(255,50,40,' + (0.7 + 0.3 * flash).toFixed(3) + ')';
      ctx.fillRect(0, by2 - bh2 / 2, W, 5); ctx.fillRect(0, by2 + bh2 / 2 - 5, W, 5);
      // scrolling small english text
      if (en) {
        ctx.font = font(22); ctx.fillStyle = 'rgba(255,120,110,0.55)'; ctx.textBaseline = 'middle';
        var tw = ctx.measureText(en + '   ').width, xo = -mod(t * 120, tw);
        for (var xx = xo; xx < W; xx += tw) { ctx.fillText(en, xx, by2 - bh2 / 2 + 20); ctx.fillText(en, W - xx - tw, by2 + bh2 / 2 - 20); }
      }
      var txt = sub ? label + '　' + sub : label;
      var fs = 78; ctx.font = font(fs);
      var w = ctx.measureText(txt).width; if (w > W * 0.8) { fs *= (W * 0.8) / w; ctx.font = font(fs); w = ctx.measureText(txt).width; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = fs * 0.12; ctx.strokeStyle = 'rgba(40,0,0,0.9)';
      ctx.strokeText(txt, W / 2, by2 + 4);
      ctx.shadowColor = 'rgba(255,40,30,1)'; ctx.shadowBlur = 20 + 25 * flash;
      ctx.fillStyle = flash > 0.5 ? '#ffffff' : '#ffd0c8';
      ctx.fillText(txt, W / 2, by2 + 4);
      ctx.shadowBlur = 0;
      // warning triangles
      for (var sd = -1; sd <= 1; sd += 2) {
        var tx = W / 2 + sd * (w / 2 + 70), ty = by2 + 2, ts = 40;
        ctx.beginPath(); ctx.moveTo(tx, ty - ts); ctx.lineTo(tx + ts * 1.1, ty + ts * 0.8); ctx.lineTo(tx - ts * 1.1, ty + ts * 0.8); ctx.closePath();
        ctx.fillStyle = 'rgba(255,60,40,' + (0.6 + 0.4 * flash).toFixed(3) + ')'; ctx.fill();
        ctx.fillStyle = '#200000'; ctx.font = font(44); ctx.fillText('!', tx, ty + 10);
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /** drawSpeedLines(ctx, {t, cx=W/2, cy=H/2, intensity=1, count=110, seed=7, color='255,225,205', inner=0.18}) radial streaks. */
  function drawSpeedLines(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), W = d0[0], H = d0[1], t = o.t || 0, I = o.intensity == null ? 1 : o.intensity;
    if (I <= 0.001) return;
    var cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H / 2 : o.cy, n = o.count || 110, seed = o.seed || 7;
    var col = o.color || '255,225,205', maxR = Math.hypot(W, H) * 0.62, inner = (o.inner == null ? 0.18 : o.inner) * H;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var R = rng(seed * 1009 + i * 17), a = R() * TAU, spd = 0.8 + R() * 1.6, ph = R();
      var pr = mod(t * spd + ph, 1), r0 = lerp(inner, maxR, pr * pr), len = (80 + R() * 380) * I * (0.3 + pr);
      var wd = (1 + R() * 3.5) * (0.4 + pr), al = Math.sin(pr * Math.PI) * 0.55 * I * (0.4 + R() * 0.6);
      var ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      var x1 = cx + ca * r0, y1 = cy + sa * r0, x2 = cx + ca * (r0 + len), y2 = cy + sa * (r0 + len);
      ctx.fillStyle = 'rgba(' + col + ',' + al.toFixed(3) + ')'; ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2 + px * wd, y2 + py * wd); ctx.lineTo(x2 - px * wd, y2 - py * wd); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /**
   * drawParticles(ctx, {t, seed=1, count=80, x=0, y=0, w=W, h=H, vx=-30, vy=-8, size=3, color='255,190,150',
   *                     alpha=0.6, glow=true, twinkle=true})
   * Floating plasma particles drifting and wrapping inside the rect; each has a depth factor (size/speed).
   */
  function drawParticles(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), t = o.t || 0, seed = o.seed == null ? 1 : o.seed, n = o.count == null ? 80 : o.count;
    var X = o.x || 0, Y = o.y || 0, w = o.w || d0[0], h = o.h || d0[1], vx = o.vx == null ? -30 : o.vx, vy = o.vy == null ? -8 : o.vy;
    var size = o.size || 3, al = o.alpha == null ? 0.6 : o.alpha, col = parseColor('rgb(' + (o.color || '255,190,150') + ')');
    var spr = glowSprite(col);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var R = rng(seed * 4241 + i * 29), dz = 0.4 + R() * 1.1;
      var px = X + mod(R() * w + vx * dz * t + Math.sin(t * 0.7 + i) * 6, w), py = Y + mod(R() * h + vy * dz * t + Math.cos(t * 0.5 + i * 1.3) * 6, h);
      var s = size * dz * (o.glow === false ? 1 : 3), tw = o.twinkle === false ? 1 : 0.6 + 0.4 * Math.sin(t * (1 + R() * 3) + i);
      ctx.globalAlpha = clamp(al * tw * (0.5 + dz * 0.5), 0, 1);
      ctx.drawImage(spr, px - s, py - s, s * 2, s * 2);
    }
    ctx.restore();
  }

  /** drawVignette(ctx, {strength=0.6, color='0,0,0', inner=0.45, cx, cy}) */
  function drawVignette(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), W = d0[0], H = d0[1], s = o.strength == null ? 0.6 : o.strength, col = o.color || '0,0,0';
    var cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H / 2 : o.cy;
    ctx.save();
    var g = ctx.createRadialGradient(cx, cy, Math.hypot(W, H) * 0.5 * (o.inner == null ? 0.45 : o.inner), cx, cy, Math.hypot(W, H) * 0.55);
    g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(0.6, 'rgba(' + col + ',' + (s * 0.55).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',' + s.toFixed(3) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /** drawLightRays(ctx, {x, y, angle=π/2, spread=0.9, count=7, length=H*1.2, t=0, alpha=0.25, color='255,200,160', seed=3}) god rays. */
  function drawLightRays(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), W = d0[0], H = d0[1], x = o.x == null ? W / 2 : o.x, y = o.y == null ? -50 : o.y;
    var ang = o.angle == null ? Math.PI / 2 : o.angle, spread = o.spread == null ? 0.9 : o.spread, n = o.count || 7;
    var L = o.length || H * 1.2, t = o.t || 0, al = o.alpha == null ? 0.25 : o.alpha, col = o.color || '255,200,160', seed = o.seed || 3;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var R = rng(seed * 331 + i * 7), a = ang + (R() - 0.5) * spread + Math.sin(t * 0.3 + i) * 0.02, wd = 0.02 + R() * 0.06;
      var fl = 0.55 + 0.45 * Math.sin(t * (0.8 + R() * 1.5) + R() * 6), A = al * fl * (0.4 + R() * 0.6);
      var g = ctx.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.addColorStop(0, 'rgba(' + col + ',' + A.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a - wd) * L, y + Math.sin(a - wd) * L); ctx.lineTo(x + Math.cos(a + wd) * L, y + Math.sin(a + wd) * L);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /** drawGrade(ctx, {color='#ff2a2a', amount=0.3, mode='soft-light'}) full-frame color grade (mode = any canvas composite op). */
  function drawGrade(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), amt = o.amount == null ? 0.3 : o.amount;
    if (amt <= 0.001) return;
    ctx.save();
    ctx.globalCompositeOperation = o.mode || 'soft-light';
    ctx.globalAlpha = clamp(amt, 0, 1);
    ctx.fillStyle = o.color || '#ff2a2a'; ctx.fillRect(0, 0, d0[0], d0[1]);
    ctx.restore();
  }

  /* ================================================================== TEXT */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrapText(ctx, text, maxW) {
    var out = [], cur = '';
    var chars = Array.from(text);
    for (var i = 0; i < chars.length; i++) {
      var tryS = cur + chars[i];
      if (cur && ctx.measureText(tryS).width > maxW && '、。，．！？）」』：'.indexOf(chars[i]) < 0) { out.push(cur); cur = chars[i]; }
      else cur = tryS;
    }
    if (cur) out.push(cur);
    if (out.length > 1 && Array.from(out[out.length - 1]).length <= 2) { // avoid orphans
      var prev = Array.from(out[out.length - 2]), mv = prev.splice(prev.length - 2, 2).join('');
      out[out.length - 2] = prev.join(''); out[out.length - 1] = mv + out[out.length - 1];
    }
    return out;
  }
  /**
   * drawInfoCard(ctx, {x=120, y=120, w=720, title, lines=[], alpha=1, t=10, size=40, accent='#e8384f', icon=true, maxH})
   * Dark-glass educational panel with red accent bar. t = seconds since the card appeared (slide-in + staggered
   * lines over ~1s; pass a large t for a static card). Text auto-fits: lines shrink to fit (down to 78%) and then
   * wrap. Returns {w, h}.
   */
  function drawInfoCard(ctx, o) {
    o = o || {};
    var x = o.x == null ? 120 : o.x, y = o.y == null ? 120 : o.y, w = o.w || 720, t = o.t == null ? 10 : o.t;
    var alpha = (o.alpha == null ? 1 : o.alpha) * smooth(0, 0.35, t), size = o.size || 40, acc = parseColor(o.accent || '#e8384f');
    if (alpha <= 0.003) return { w: w, h: 0 };
    var lines = o.lines || [], title = o.title || '';
    var pad = size * 0.8, bar = 10, innerW = w - pad * 2 - bar, bullet = size * 0.85, tsize = size * 1.15;
    ctx.save();
    // layout
    ctx.font = font(tsize);
    var tw = ctx.measureText(title).width, tScale = Math.min(1, innerW / Math.max(1, tw)); tsize *= Math.max(tScale, 0.6);
    var tlines = tScale < 0.6 ? (ctx.font = font(tsize), wrapText(ctx, title, innerW)) : [title];
    var lay = [];
    for (var i = 0; i < lines.length; i++) {
      var fs = size; ctx.font = font(fs);
      var lw = ctx.measureText(lines[i]).width, avail = innerW - bullet;
      if (lw > avail) { fs = Math.max(size * 0.7, (fs * avail) / lw); ctx.font = font(fs); }
      var parts = ctx.measureText(lines[i]).width > avail ? wrapText(ctx, lines[i], avail) : [lines[i]];
      lay.push({ fs: fs, parts: parts });
    }
    var lh = 1.45, h = pad * 0.85 + (title ? tlines.length * tsize * 1.25 + size * 0.45 : 0);
    for (i = 0; i < lay.length; i++) h += lay[i].parts.length * lay[i].fs * lh;
    h += pad * 0.6;
    var slide = (1 - smooth(0, 0.45, t)) * -50;
    ctx.translate(x + slide, y);
    ctx.globalAlpha *= alpha;
    // glass
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    roundRect(ctx, 0, 0, w, h, 22);
    var gg = ctx.createLinearGradient(0, 0, 0, h);
    gg.addColorStop(0, 'rgba(34,10,18,0.80)'); gg.addColorStop(1, 'rgba(12,4,8,0.84)');
    ctx.fillStyle = gg; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,220,220,0.16)'; ctx.stroke();
    ctx.save(); roundRect(ctx, 0, 0, w, h, 22); ctx.clip();
    var hl = ctx.createLinearGradient(0, 0, 0, h * 0.4);
    hl.addColorStop(0, 'rgba(255,255,255,0.08)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(0, 0, w, h * 0.4);
    var ab = ctx.createLinearGradient(0, 0, 0, h);
    ab.addColorStop(0, rgba(mixC(acc, [255, 255, 255], 0.25), 1)); ab.addColorStop(1, rgba(mixC(acc, [0, 0, 0], 0.35), 1));
    ctx.fillStyle = ab; ctx.fillRect(0, 0, bar, h);
    // shimmer on appear
    var sh = smooth(0.1, 0.9, t);
    if (sh > 0 && sh < 1) {
      var sx = lerp(-w * 0.3, w * 1.3, sh), sg = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,230,230,0.12)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
    // text
    var cy = pad * 0.85, tx = bar + pad;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    if (title) {
      ctx.font = font(tsize); ctx.fillStyle = '#ffffff';
      for (i = 0; i < tlines.length; i++) { ctx.fillText(tlines[i], tx, cy); cy += tsize * 1.25; }
      var ul = smooth(0.15, 0.6, t);
      var ug = ctx.createLinearGradient(tx, 0, tx + innerW, 0);
      ug.addColorStop(0, rgba(acc, 1)); ug.addColorStop(1, rgba(acc, 0));
      ctx.fillStyle = ug; ctx.fillRect(tx, cy - size * 0.05, innerW * ul, 3);
      cy += size * 0.45;
    }
    for (i = 0; i < lay.length; i++) {
      var la = smooth(0.3 + i * 0.12, 0.6 + i * 0.12, t), L2 = lay[i];
      ctx.save(); ctx.globalAlpha *= la; ctx.translate((1 - la) * 20, 0);
      // bullet: tiny biconcave-disc icon (ring with pale centre)
      var bx = tx + bullet * 0.35, by = cy + L2.fs * 0.62, br = L2.fs * 0.2;
      if (o.icon !== false) {
        ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = rgba(acc, 1); ctx.fill();
        ctx.beginPath(); ctx.arc(bx, by, br * 0.45, 0, TAU); ctx.fillStyle = 'rgba(255,190,180,0.9)'; ctx.fill();
      }
      ctx.font = font(L2.fs); ctx.fillStyle = 'rgba(255,240,236,0.96)';
      for (var p = 0; p < L2.parts.length; p++) { ctx.fillText(L2.parts[p], tx + bullet, cy + L2.fs * 0.1); cy += L2.fs * lh; }
      ctx.restore();
    }
    ctx.restore();
    return { w: w, h: h };
  }

  /**
   * drawTelop(ctx, {text, x=W/2, y=H*0.8, size=110, alpha=1, style='next', t=10, maxW=W*0.9, kicker, align='center'})
   * Anime telop. style: 'next' (slanted red/gold gradient, double outline, slide-in + flash, speed band),
   * 'impact' (zoom-punch + shake), 'title' (metallic red, glow), 'caption' (white with dark outline, for subtitles).
   * t = seconds since the telop started. kicker = small label above (e.g. '次回予告').
   */
  function drawTelop(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), W = d0[0], H = d0[1], text = o.text || '', style = o.style || 'next', t = o.t == null ? 10 : o.t;
    var x = o.x == null ? W / 2 : o.x, y = o.y == null ? H * 0.8 : o.y, size = o.size || 110, alpha = o.alpha == null ? 1 : o.alpha;
    var maxW = o.maxW || W * 0.9;
    if (alpha <= 0.003 || !text) return;
    ctx.save();
    ctx.font = font(size); var tw = ctx.measureText(text).width;
    if (tw > maxW) { size *= maxW / tw; ctx.font = font(size); tw = ctx.measureText(text).width; }
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    var ap = 1, dx = 0, sc = 1, skew = 0, flash = 0;
    if (style === 'next') {
      ap = smooth(0, 0.2, t); dx = Math.pow(1 - smooth(0, 0.35, t), 3) * W * 0.6; skew = -0.18; flash = Math.exp(-Math.max(0, t - 0.3) * 6) * smooth(0.25, 0.32, t);
    } else if (style === 'impact') {
      ap = smooth(0, 0.08, t); sc = lerp(1.6, 1, smooth(0, 0.18, t)); var shk = Math.exp(-t * 8) * 14;
      dx = Math.sin(t * 90) * shk; y += Math.cos(t * 77) * shk; flash = Math.exp(-t * 7) * 0.8;
    } else if (style === 'title') { ap = smooth(0, 0.6, t); sc = lerp(1.08, 1, smooth(0, 1, t)); }
    else { ap = smooth(0, 0.15, t); }
    ctx.globalAlpha *= alpha * ap;
    ctx.translate(x + dx, y); ctx.scale(sc, sc); ctx.transform(1, 0, skew, 1, 0, 0);
    if (style === 'next') {
      // speed band behind
      var bw = tw + size * 1.6, bh = size * 1.25;
      var bg = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      bg.addColorStop(0, 'rgba(120,0,10,0)'); bg.addColorStop(0.12, 'rgba(150,0,16,0.85)'); bg.addColorStop(0.88, 'rgba(90,0,10,0.85)'); bg.addColorStop(1, 'rgba(90,0,10,0)');
      ctx.fillStyle = bg; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.fillStyle = 'rgba(255,210,120,0.9)'; ctx.fillRect(-bw / 2 + size * 0.3, -bh / 2, bw - size * 0.6, 4); ctx.fillRect(-bw / 2 + size * 0.3, bh / 2 - 4, bw - size * 0.6, 4);
      for (var i = 0; i < 8; i++) { // streaks
        var R = rng(77 + i), ly = (R() - 0.5) * bh * 0.9, lx = mod(R() * bw - t * 900 * (0.6 + R()), bw) - bw / 2;
        ctx.fillStyle = 'rgba(255,200,160,0.25)'; ctx.fillRect(lx, ly, size * (0.8 + R() * 2), 2 + R() * 3);
      }
    }
    if (o.kicker) {
      ctx.save(); ctx.font = font(size * 0.34); ctx.fillStyle = '#ffe2b0'; ctx.strokeStyle = 'rgba(60,0,0,0.9)'; ctx.lineWidth = size * 0.06;
      ctx.strokeText(o.kicker, 0, -size * 0.95); ctx.fillText(o.kicker, 0, -size * 0.95); ctx.restore();
    }
    ctx.font = font(size);
    if (style === 'caption') {
      ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(10,0,4,0.85)'; ctx.strokeText(text, 0, 0);
      ctx.fillStyle = '#ffffff'; ctx.fillText(text, 0, 0);
    } else {
      var outer = style === 'title' ? 'rgba(255,240,230,0.95)' : '#ffffff';
      ctx.lineWidth = size * 0.24; ctx.strokeStyle = 'rgba(30,0,4,0.95)';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = size * 0.2; ctx.shadowOffsetY = size * 0.06;
      ctx.strokeText(text, 0, 0); ctx.shadowColor = 'transparent';
      ctx.lineWidth = size * 0.13; ctx.strokeStyle = outer; ctx.strokeText(text, 0, 0);
      ctx.lineWidth = size * 0.05; ctx.strokeStyle = style === 'title' ? '#5a0008' : '#7a0010'; ctx.strokeText(text, 0, 0);
      var fg = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
      if (style === 'title') { fg.addColorStop(0, '#ffd6cc'); fg.addColorStop(0.45, '#ff3a3a'); fg.addColorStop(0.55, '#c0001a'); fg.addColorStop(1, '#ff6a50'); }
      else { fg.addColorStop(0, '#fff6d8'); fg.addColorStop(0.4, '#ffd040'); fg.addColorStop(0.62, '#ff6a20'); fg.addColorStop(1, '#e8102a'); }
      ctx.fillStyle = fg; ctx.fillText(text, 0, 0);
      if (flash > 0.01) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,' + clamp(flash, 0, 1).toFixed(3) + ')'; ctx.fillText(text, 0, 0); }
    }
    ctx.restore();
    if (flash > 0.01 && style !== 'caption') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var fg2 = ctx.createRadialGradient(x, y, 0, x, y, tw * 0.7);
      fg2.addColorStop(0, 'rgba(255,240,220,' + (0.5 * flash * alpha).toFixed(3) + ')'); fg2.addColorStop(1, 'rgba(255,200,160,0)');
      ctx.fillStyle = fg2; ctx.fillRect(x - tw, y - tw, tw * 2, tw * 2); ctx.restore();
    }
  }

  /**
   * drawTitleLogo(ctx, {t=10, alpha=1, x=W/2, y=H*0.44, scale=1, sub='― 体内を駆ける細胞たち ―'})
   * 「BLOOD STORY」 logo: letters drop in (0–0.9s), ECG line draws (0.4–1.6s), flash, light sweep (1.3–2.2s),
   * subtitle fades in (1.0–1.8s), two RBC emblems.
   */
  function drawTitleLogo(ctx, o) {
    o = o || {};
    var d0 = dims(ctx), W = d0[0], H = d0[1], t = o.t == null ? 10 : o.t, alpha = o.alpha == null ? 1 : o.alpha;
    var x = o.x == null ? W / 2 : o.x, y = o.y == null ? H * 0.44 : o.y, sc = o.scale || 1;
    if (alpha <= 0.003) return;
    var text = 'BLOOD STORY', size = 190;
    // letters onto an offscreen canvas so we can sweep light over them only
    var cw = 1800, ch = 360, c = scratchCanvas('logo', cw, ch), x2 = c.getContext('2d');
    x2.font = font(size); x2.textBaseline = 'middle'; x2.textAlign = 'left';
    if ('letterSpacing' in x2) x2.letterSpacing = '0px';
    var widths = [], total = 0, sp = size * 0.06;
    for (var i = 0; i < text.length; i++) { var wi = x2.measureText(text[i]).width; widths.push(wi); total += wi + (i < text.length - 1 ? sp : 0); }
    var lx = cw / 2 - total / 2, cy = ch / 2;
    var fg = x2.createLinearGradient(0, cy - size * 0.5, 0, cy + size * 0.5);
    fg.addColorStop(0, '#ffe0d6'); fg.addColorStop(0.42, '#ff4040'); fg.addColorStop(0.52, '#b0001c'); fg.addColorStop(1, '#ff5a44');
    x2.lineJoin = 'round';
    for (var pass = 0; pass < 3; pass++) {
      var xx = lx;
      for (i = 0; i < text.length; i++) {
        var lt = smooth(i * 0.06, i * 0.06 + 0.4, t), dy = (1 - lt) * -60;
        if (lt > 0.001 && text[i] !== ' ') {
          x2.globalAlpha = lt;
          if (pass === 0) { x2.lineWidth = size * 0.16; x2.strokeStyle = '#1a0004'; x2.strokeText(text[i], xx, cy + dy); }
          else if (pass === 1) { x2.lineWidth = size * 0.06; x2.strokeStyle = '#fff0ea'; x2.strokeText(text[i], xx, cy + dy); }
          else { x2.fillStyle = fg; x2.fillText(text[i], xx, cy + dy); }
        }
        xx += widths[i] + sp;
      }
    }
    x2.globalAlpha = 1;
    // light sweep (only on the letters)
    var swp = smooth(1.3, 2.2, t);
    if (swp > 0 && swp < 1) {
      x2.globalCompositeOperation = 'source-atop';
      var sx = lerp(-200, cw + 200, swp), sg = x2.createLinearGradient(sx - 140, 0, sx + 140, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      x2.save(); x2.transform(1, 0, -0.4, 1, 0, 0); x2.fillStyle = sg; x2.fillRect(-400, 0, cw + 800, ch); x2.restore();
      x2.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y); ctx.scale(sc, sc);
    // backing glow + pulse
    var hb = heartbeat(t, 66);
    ctx.globalCompositeOperation = 'lighter';
    var bg = ctx.createRadialGradient(0, 0, 0, 0, 0, 900);
    bg.addColorStop(0, 'rgba(255,40,40,' + (0.22 + 0.15 * hb).toFixed(3) + ')'); bg.addColorStop(1, 'rgba(255,40,40,0)');
    ctx.save(); ctx.scale(1, 0.35); ctx.fillStyle = bg; ctx.fillRect(-900, -900, 1800, 1800); ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    // ECG line behind the letters
    var ep = smooth(0.4, 1.6, t);
    if (ep > 0) {
      ctx.save();
      ctx.beginPath(); ctx.rect(-900, -200, 1800 * ep, 400); ctx.clip();
      ctx.beginPath();
      for (var s = 0; s <= 360; s++) {
        var u = s / 360, px = -900 + u * 1800, k = mod(u * 3, 1), py = 0;
        if (k > 0.40 && k < 0.44) py = -Math.sin(((k - 0.40) / 0.04) * Math.PI) * 18;
        else if (k > 0.47 && k < 0.5) py = ((k - 0.47) / 0.03) * 30;
        else if (k > 0.5 && k < 0.54) py = 30 - ((k - 0.5) / 0.04) * 180;
        else if (k > 0.54 && k < 0.58) py = -150 + ((k - 0.54) / 0.04) * 190;
        else if (k > 0.58 && k < 0.61) py = 40 - ((k - 0.58) / 0.03) * 40;
        else if (k > 0.68 && k < 0.78) py = -Math.sin(((k - 0.68) / 0.1) * Math.PI) * 28;
        py += 120;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255,60,60,1)'; ctx.shadowBlur = 18;
      ctx.strokeStyle = 'rgba(255,120,110,0.85)'; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }
    // RBC emblems
    var em = smooth(0.7, 1.3, t);
    if (em > 0) {
      drawRBC(ctx, { x: -total / 2 - 120, y: -6, r: 60 * em, tiltX: 0.5, tiltY: 0.2 + t * 0.4, alpha: em });
      drawRBC(ctx, { x: total / 2 + 120, y: -6, r: 60 * em, tiltX: 0.5, tiltY: -0.2 - t * 0.4, alpha: em });
    }
    ctx.drawImage(c, -cw / 2, -ch / 2);
    // flash
    var fl = Math.exp(-Math.max(0, t - 0.9) * 5) * smooth(0.8, 0.9, t);
    if (fl > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      var fg3 = ctx.createRadialGradient(0, 0, 0, 0, 0, 800);
      fg3.addColorStop(0, 'rgba(255,230,220,' + (0.6 * fl).toFixed(3) + ')'); fg3.addColorStop(1, 'rgba(255,200,180,0)');
      ctx.fillStyle = fg3; ctx.fillRect(-900, -500, 1800, 1000); ctx.globalCompositeOperation = 'source-over';
    }
    // subtitle
    var sa = smooth(1.0, 1.8, t);
    if (sa > 0) {
      var sub = o.sub || '― 体内を駆ける細胞たち ―';
      ctx.globalAlpha *= sa;
      ctx.font = font(64); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
      ctx.lineJoin = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(30,0,6,0.85)';
      ctx.strokeText(sub, 0, 190 + (1 - sa) * 20);
      ctx.fillStyle = '#fff2ec'; ctx.shadowColor = 'rgba(255,80,60,0.9)'; ctx.shadowBlur = 16;
      ctx.fillText(sub, 0, 190 + (1 - sa) * 20);
    }
    ctx.restore();
  }

  /* ================================================================ SETUP */
  /** ready(): Promise – loads the fonts (and pre-warms the common RBC sprites). Await before rendering frames. */
  function ready(opts) {
    var ps = [];
    if (document.fonts && document.fonts.load) {
      ps.push(document.fonts.load('40px ZenKaku', 'あ警報BLOOD').catch(function () {}));
      ps.push(document.fonts.load('40px IPAGothic', 'μ―').catch(function () {}));
    }
    return Promise.all(ps).then(function () { if (!opts || opts.prewarm !== false) prewarm(); });
  }
  /** prewarm(): build the undeformed RBC sprites up front (~0.3–0.6 s once). */
  function prewarm() {
    for (var ti = 0; ti <= (TILT_N - 1) / 2; ti++) for (var ri = 0; ri < RBC_ROTS; ri++) rbcSprite(0, ti, ri);
  }

  BS.world = {
    drawVesselTunnel: drawVesselTunnel,
    drawRBC: drawRBC,
    drawRBCField3D: drawRBCField3D,
    drawVesselSide: drawVesselSide,
    drawFlowCells: drawFlowCells,
    drawCapillary: drawCapillary,
    drawCapillarySide: drawCapillarySide,
    drawTissueCell: drawTissueCell,
    drawO2: drawO2,
    drawO2Transfer: drawO2Transfer,
    drawPathogenSilhouette: drawPathogenSilhouette,
    drawAlarm: drawAlarm,
    drawSpeedLines: drawSpeedLines,
    drawParticles: drawParticles,
    drawVignette: drawVignette,
    drawLightRays: drawLightRays,
    drawGrade: drawGrade,
    drawInfoCard: drawInfoCard,
    drawTelop: drawTelop,
    drawTitleLogo: drawTitleLogo,
    drawPlatelet: drawPlatelet,
    // helpers
    heartbeat: heartbeat,
    tunnelProject: tunnelProject,
    sideLayout: function (ctx, o) { return sideLayout(ctx, o || {}); },
    ready: ready,
    prewarm: prewarm,
    FONT: FONT_FAMILY,
    _internal: { tubeGeom: tubeGeom, drawTubeBase: drawTubeBase, drawEndothelium: drawEndothelium, drawFolds: drawFolds, drawTubeOverlay: drawTubeOverlay, styleWrap: styleWrap, STYLE_ART: STYLE_ART, STYLE_CAP: STYLE_CAP }
  };
})();
