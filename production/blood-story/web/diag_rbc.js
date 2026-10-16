/* BLOOD STORY ― 体内を駆ける細胞たち ―
 * diag_rbc.js : 赤血球・血液成分の「ホログラム模式図」 (Agent D1)
 *
 * Plain script (no ES module). Load AFTER world.js (reuses BS.world.drawRBC / drawO2 / drawTissueCell).
 * Registers window.BS.diag.{holoPanel, centrifugeTube, clotTube, plasmaProteins, rbcModel, membraneSkeleton,
 *   hemoglobin, lungTissueLoop, co2Transport, erythropoiesis, rbcLifespan, hemeRecycle}.
 *
 * Common opts of every diagram:  (ctx, {x=960, y=540, scale=1, p=1, t=0, alpha=1, panel=true, on})
 *   x, y   : canvas px of the PANEL CENTRE (the projector emitter sits ~70px*scale below the panel bottom)
 *   scale  : 1 = natural size (see SIZE table at the bottom / report)
 *   p      : animation progress 0..1 (stage boundaries documented on each function)
 *   t      : seconds (only for idle shimmer / flicker / drift; the "story" is driven by p)
 *   alpha  : overall opacity
 *   panel  : false = draw the content only (no hologram frame / emitter)
 *   on     : 0..1 override of the panel power-on (default seg(p, 0, 0.07))
 * Every function is pure (seeded randomness only), wraps itself in save()/restore().
 * Fonts: 'ZenKaku, IPAGothic, sans-serif' (μ ₂ ₃ ⁻ ⁺ fall back to IPAGothic / system font).
 */
(function () {
  'use strict';
  var BS = (window.BS = window.BS || {});
  var D = (BS.diag = BS.diag || {});
  var TAU = Math.PI * 2;
  var FF = 'ZenKaku, IPAGothic, sans-serif';
  function F(px) { return Math.max(1, px).toFixed(1) + 'px ' + FF; }
  function W() { return BS.world || {}; }

  /* ------------------------------------------------------------ utils */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function eio(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function eout(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function eback(x) { x = clamp(x, 0, 1); var c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
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
  function mixC(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a, 0, 1).toFixed(4) + ')'; }
  var WHITE = [255, 255, 255];
  var C = {
    cy: [134, 236, 255], ink: [235, 250, 255], warm: [255, 184, 110], hot: [255, 104, 112], yel: [255, 218, 112],
    green: [140, 255, 175], violet: [186, 150, 255], pink: [255, 150, 200], blue: [120, 150, 255], red: [235, 50, 65]
  };

  /* ------------------------------------------------------------ drawing helpers */
  function begin(ctx, o) {
    var s = o.scale == null ? 1 : o.scale;
    ctx.save();
    ctx.translate(o.x == null ? 960 : o.x, o.y == null ? 540 : o.y);
    ctx.scale(s, s);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  }
  /** glowing stroke of the current path */
  function gline(ctx, col, w, a, dash, dashOff) {
    if (a <= 0.003) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = dashOff || 0; }
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(col, 0.16 * a); ctx.lineWidth = w * 4.2; ctx.stroke();
    ctx.strokeStyle = rgba(col, 0.28 * a); ctx.lineWidth = w * 2.0; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = rgba(mixC(col, WHITE, 0.45), a); ctx.lineWidth = w; ctx.stroke();
    ctx.restore();
  }
  function glowDot(ctx, x, y, r, col, a) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, 0.9 * a)); g.addColorStop(0.3, rgba(col, 0.35 * a)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  /** text that "types in" (a 0..1) with glow + dark outline. Returns full width. */
  function txt(ctx, s, x, y, o) {
    o = o || {};
    var a = o.a == null ? 1 : o.a;
    var size = o.size || 32, col = o.color || C.ink, align = o.align || 'left';
    ctx.save(); ctx.font = F(size);
    var full = ctx.measureText(s).width;
    if (a <= 0.004) { ctx.restore(); return full; }
    var chars = Array.from(s);
    var n = o.type === false ? chars.length : Math.min(chars.length, Math.ceil(chars.length * clamp(a * 1.7, 0, 1)));
    var str = chars.slice(0, n).join('');
    var x0 = align === 'center' ? x - full / 2 : align === 'right' ? x - full : x;
    ctx.textAlign = 'left'; ctx.textBaseline = o.base || 'middle';
    ctx.globalAlpha *= smooth(0, 0.3, a) * (o.alpha == null ? 1 : o.alpha);
    var yy = y + (1 - eout(seg(a, 0, 0.55))) * size * 0.3;
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (o.outline !== false) { ctx.lineWidth = size * 0.2; ctx.strokeStyle = 'rgba(0,10,22,0.82)'; ctx.strokeText(str, x0, yy); }
    ctx.shadowColor = rgba(o.glow || col, 0.85); ctx.shadowBlur = size * (o.glowAmt == null ? 0.45 : o.glowAmt);
    ctx.fillStyle = rgba(col, 1); ctx.fillText(str, x0, yy);
    ctx.shadowBlur = 0; ctx.fillText(str, x0, yy);
    ctx.restore();
    return full;
  }
  function textW(ctx, s, size) { ctx.save(); ctx.font = F(size); var w = ctx.measureText(s).width; ctx.restore(); return w; }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  /** pill tag centred at x,y */
  function tag(ctx, s, x, y, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0.004) return;
    var size = o.size || 30, col = o.color || C.warm, tw = textW(ctx, s, size);
    var w = tw + size * 1.1, h = size * 1.5, sc = 0.85 + 0.15 * eback(seg(a, 0, 0.6));
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha *= smooth(0, 0.4, a);
    rrect(ctx, -w / 2, -h / 2, w, h, h / 2);
    ctx.fillStyle = rgba(mixC(col, [0, 0, 0], 0.78), 0.88); ctx.fill();
    gline(ctx, col, 2.5, 1);
    txt(ctx, s, 0, 2, { size: size, align: 'center', color: mixC(col, WHITE, 0.55), glow: col, type: false });
    ctx.restore();
  }
  /** partial polyline with optional arrow head. pts=[[x,y],...], a = 0..1 drawn fraction */
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
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(Math.atan2(dy, dx));
      ctx.beginPath(); ctx.moveTo(hs * 0.35, 0); ctx.lineTo(-hs * 0.85, -hs * 0.6); ctx.lineTo(-hs * 0.55, 0); ctx.lineTo(-hs * 0.85, hs * 0.6); ctx.closePath();
      ctx.globalAlpha *= al;
      ctx.fillStyle = rgba(mixC(col, WHITE, 0.4), 1); ctx.fill();
      gline(ctx, col, 1.5, 0.8);
      ctx.restore();
    }
    if (o.dot) glowDot(ctx, pts[0][0], pts[0][1], w * 4, col, al);
  }
  function qpts(x1, y1, cx, cy, x2, y2, n) {
    var out = []; n = n || 24;
    for (var i = 0; i <= n; i++) { var s = i / n, u = 1 - s; out.push([u * u * x1 + 2 * u * s * cx + s * s * x2, u * u * y1 + 2 * u * s * cy + s * s * y2]); }
    return out;
  }
  function qpt(x1, y1, cx, cy, x2, y2, s) { var u = 1 - s; return [u * u * x1 + 2 * u * s * cx + s * s * x2, u * u * y1 + 2 * u * s * cy + s * s * y2]; }
  /** vertical curly brace '}' from y1..y2 at x, opening left. Reveals from the middle. Returns tip x. */
  function braceV(ctx, x, y1, y2, a, col, w) {
    var d = Math.min(16, (y2 - y1) / 4), m = (y1 + y2) / 2;
    if (a <= 0.003) return x + 2 * d;
    ctx.save();
    var hh = ((y2 - y1) / 2) * eio(a) + 3;
    ctx.beginPath(); ctx.rect(x - 8, m - hh, d * 2 + 16, hh * 2); ctx.clip();
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.quadraticCurveTo(x + d, y1, x + d, y1 + d); ctx.lineTo(x + d, m - d);
    ctx.quadraticCurveTo(x + d, m, x + 2 * d, m); ctx.quadraticCurveTo(x + d, m, x + d, m + d); ctx.lineTo(x + d, y2 - d);
    ctx.quadraticCurveTo(x + d, y2, x, y2);
    gline(ctx, col, w || 3, 1);
    ctx.restore();
    return x + 2 * d;
  }
  function blobPath(ctx, cx, cy, R, seed, amp, t, n) {
    n = n || 56; var r = rng(seed), p1 = r() * TAU, p2 = r() * TAU, p3 = r() * TAU;
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * TAU;
      var rr = R * (1 + amp * (0.55 * Math.sin(3 * a + p1 + t * 0.6) + 0.35 * Math.sin(5 * a + p2 - t * 0.45) + 0.3 * Math.sin(2 * a + p3)));
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
  }
  function ball(ctx, x, y, r, col, a) {
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a;
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, rgba(mixC(col, WHITE, 0.7), 1)); g.addColorStop(0.5, rgba(col, 1)); g.addColorStop(1, rgba(mixC(col, [0, 0, 0], 0.45), 1));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(mixC(col, WHITE, 0.5), 0.6); ctx.stroke();
    ctx.restore();
  }
  /** glowing ion / molecule pill (e.g. 'HCO₃⁻') centred at x,y */
  function token(ctx, s, x, y, col, a, size) {
    if (a <= 0.004) return; size = size || 30;
    var tw = textW(ctx, s, size), w = tw + size * 0.9, h = size * 1.4;
    ctx.save(); ctx.globalAlpha *= a;
    glowDot(ctx, x, y, w * 0.9, col, 0.55);
    rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fillStyle = rgba(mixC(col, [0, 0, 0], 0.7), 0.92); ctx.fill();
    gline(ctx, col, 2.5, 1);
    txt(ctx, s, x, y + 1, { size: size, align: 'center', color: mixC(col, WHITE, 0.6), glow: col, type: false });
    ctx.restore();
  }
  /** glowing CO₂ orb (warm counterpart of BS.world.drawO2) */
  function co2Glyph(ctx, x, y, size, a, t) {
    if (a <= 0.004) return;
    var col = [255, 168, 90], s = size * (1 + 0.04 * Math.sin((t || 0) * 4.0 + x * 0.01));
    ctx.save(); ctx.globalAlpha *= a;
    glowDot(ctx, x, y, s * 1.5, col, 0.6);
    ctx.beginPath(); ctx.arc(x, y, s * 0.86, 0, TAU); ctx.lineWidth = Math.max(1, s * 0.05); ctx.strokeStyle = rgba(col, 0.6); ctx.stroke();
    txt(ctx, 'CO₂', x, y + s * 0.02, { size: s * 0.62, align: 'center', color: [255, 244, 230], glow: col, type: false, outline: false });
    ctx.restore();
  }
  function o2Glyph(ctx, x, y, size, a, t) {
    if (a <= 0.004) return;
    if (W().drawO2) W().drawO2(ctx, { x: x, y: y, size: size, alpha: a, t: t || 0 });
    else token(ctx, 'O₂', x, y, C.cy, a, size * 0.5);
  }
  function rbc(ctx, o) { if (W().drawRBC) W().drawRBC(ctx, o); else { ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fillStyle = '#c0182c'; ctx.fill(); } }

  /* ============================================================ HOLOGRAM PANEL */
  /* holo frame in LOCAL coords (origin = panel centre). Returns the content alpha (0..1, includes flicker). */
  function holoLocal(ctx, w, h, on, t, title, o) {
    o = o || {};
    if (on <= 0.001) return 0;
    var acc = o.accent || C.cy, hw = w / 2, hh = h / 2;
    var fl = 1;
    if (on < 1) { var k = Math.floor(t * 30); fl = hash(k * 7 + 3) < 0.45 * (1 - on) + 0.04 ? 0.3 : 1; }
    fl *= 0.965 + 0.035 * Math.sin(t * 23.0) * Math.sin(t * 3.7);
    var beam = eout(seg(on, 0, 0.45)), open = eio(seg(on, 0.2, 0.8));
    ctx.save();
    // --- projector emitter + light cone
    if (o.emitter !== false) {
      var ey = hh + 70, ow = lerp(0.08, 1, open);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var g = ctx.createLinearGradient(0, ey, 0, hh - h * 0.1);
      g.addColorStop(0, rgba(acc, 0.26 * beam * fl)); g.addColorStop(1, rgba(acc, 0.03 * beam * fl));
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(-80, ey); ctx.lineTo(80, ey); ctx.lineTo(hw * ow, hh); ctx.lineTo(-hw * ow, hh); ctx.closePath(); ctx.fill();
      var eg = ctx.createRadialGradient(0, ey, 0, 0, ey, 150);
      eg.addColorStop(0, rgba(acc, 0.55 * beam)); eg.addColorStop(0.3, rgba(acc, 0.18 * beam)); eg.addColorStop(1, rgba(acc, 0));
      ctx.save(); ctx.translate(0, ey); ctx.scale(1, 0.18); ctx.translate(0, -ey);
      ctx.fillStyle = eg; ctx.fillRect(-150, ey - 150, 300, 300); ctx.restore();
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, ey, 92, 14, 0, 0, TAU); gline(ctx, acc, 2.5, beam);
      ctx.beginPath(); ctx.ellipse(0, ey, 56, 8, 0, 0, TAU); gline(ctx, acc, 2, 0.7 * beam);
    }
    // --- panel body (CRT-like vertical open)
    var ph = Math.max(3, h * open);
    ctx.globalAlpha *= fl;
    ctx.save();
    ctx.beginPath(); ctx.rect(-hw - 4, -ph / 2 - 4, w + 8, ph + 8); ctx.clip();
    var bg = ctx.createLinearGradient(0, -hh, 0, hh);
    bg.addColorStop(0, 'rgba(6,34,52,0.66)'); bg.addColorStop(1, 'rgba(3,16,30,0.74)');
    rrect(ctx, -hw, -hh, w, h, 18); ctx.fillStyle = bg; ctx.fill();
    // grid
    ctx.save(); rrect(ctx, -hw, -hh, w, h, 18); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    for (var gx = -hw + (w % 48) / 2; gx < hw; gx += 48) { ctx.moveTo(gx, -hh); ctx.lineTo(gx, hh); }
    for (var gy = -hh + (h % 48) / 2; gy < hh; gy += 48) { ctx.moveTo(-hw, gy); ctx.lineTo(hw, gy); }
    ctx.strokeStyle = rgba(acc, 0.045); ctx.lineWidth = 1; ctx.stroke();
    // moving scan band
    var sy = -hh - 120 + mod(t * 170, h + 240);
    var sg = ctx.createLinearGradient(0, sy - 70, 0, sy + 70);
    sg.addColorStop(0, rgba(acc, 0)); sg.addColorStop(0.5, rgba(acc, 0.07)); sg.addColorStop(1, rgba(acc, 0));
    ctx.fillStyle = sg; ctx.fillRect(-hw, sy - 70, w, 140);
    // power-on flash
    if (on < 1) { ctx.fillStyle = rgba(acc, 0.25 * (1 - open) * beam); ctx.fillRect(-hw, -hh, w, h); }
    ctx.globalCompositeOperation = 'source-over';
    // scanlines
    ctx.fillStyle = 'rgba(0,8,16,0.16)';
    for (var yy = -hh; yy < hh; yy += 4) ctx.fillRect(-hw, yy, w, 1.4);
    ctx.restore();
    // border + corner brackets
    rrect(ctx, -hw, -hh, w, h, 18); gline(ctx, acc, 1.6, 0.55);
    var L = 46; ctx.beginPath();
    ctx.moveTo(-hw - 6, -hh + L); ctx.lineTo(-hw - 6, -hh - 6); ctx.lineTo(-hw + L, -hh - 6);
    ctx.moveTo(hw + 6, -hh + L); ctx.lineTo(hw + 6, -hh - 6); ctx.lineTo(hw - L, -hh - 6);
    ctx.moveTo(-hw - 6, hh - L); ctx.lineTo(-hw - 6, hh + 6); ctx.lineTo(-hw + L, hh + 6);
    ctx.moveTo(hw + 6, hh - L); ctx.lineTo(hw + 6, hh + 6); ctx.lineTo(hw - L, hh + 6);
    gline(ctx, acc, 3.5, 0.95);
    // title
    if (title) {
      var ta = smooth(0.55, 1, on), tw = txt(ctx, title, -hw + 40, -hh + 42, { size: 34, color: [225, 250, 255], glow: acc, a: ta });
      ctx.beginPath(); ctx.moveTo(-hw + 40, -hh + 70); ctx.lineTo(-hw + 40 + (tw + 60) * ta, -hh + 70); gline(ctx, acc, 2, 0.8 * ta);
      ctx.beginPath(); ctx.arc(-hw + 24, -hh + 42, 5, 0, TAU); ctx.fillStyle = rgba(acc, ta); ctx.fill();
      // little status bars at the top-right
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var b = 0; b < 5; b++) {
        var on2 = hash(b * 31 + Math.floor(t * 4)) > 0.35 ? 0.7 : 0.2;
        ctx.fillStyle = rgba(acc, on2 * ta); ctx.fillRect(hw - 50 - b * 18, -hh + 34, 10, 16);
      }
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
    return fl * smooth(0.45, 1, on);
  }
  function frame(ctx, o, w, h, title, p, t) {
    var on = o.on != null ? o.on : seg(p, 0, 0.07);
    if (o.panel === false) return 1;
    return holoLocal(ctx, w, h, on, t, o.title == null ? title : o.title, { accent: o.accent, emitter: o.emitter });
  }

  /**
   * holoPanel(ctx, {x=960, y=540, w=1000, h=700, p=1, t=0, title, alpha=1, scale=1, accent=[r,g,b], emitter=true})
   * Generic hologram frame: projector emitter + light cone from below, translucent teal glass, grid, scanlines,
   * moving scan band, glowing border with corner brackets, title bar.
   * p = power-on 0..1: 0–0.45 beam rises from the emitter, 0.2–0.8 the panel opens vertically (CRT), random
   * flicker until p=1; title types in over 0.55–1. Returns the content alpha (0..1) to multiply your content with.
   */
  D.holoPanel = function (ctx, o) {
    o = o || {};
    begin(ctx, o);
    var a = holoLocal(ctx, o.w || 1000, o.h || 700, clamp(o.p == null ? 1 : o.p, 0, 1), o.t || 0, o.title, o);
    ctx.restore();
    return a;
  };

  /* ============================================================ 1. CENTRIFUGE TUBE */
  var TB = { w: 116, h: 520, top: 64 };
  function tubeOutline(ctx, w, h) {
    var r = w / 2; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(-r, h - r); ctx.arc(0, h - r, r, Math.PI, 0, true); ctx.lineTo(r, 0);
  }
  /* glass tube (origin = top centre of the tube), contents() draws in the same coords, clipped to the glass */
  function drawTube(ctx, w, h, contents, a, simple) {
    var r = w / 2;
    tubeOutline(ctx, w, h); ctx.closePath(); ctx.fillStyle = 'rgba(150,230,255,0.07)'; ctx.fill();
    ctx.save(); tubeOutline(ctx, w, h); ctx.closePath(); ctx.clip();
    if (contents) contents();
    if (!simple) {
      var g = ctx.createLinearGradient(-r, 0, r, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.12, 'rgba(255,255,255,0.30)'); g.addColorStop(0.24, 'rgba(255,255,255,0.04)');
      g.addColorStop(0.78, 'rgba(255,255,255,0)'); g.addColorStop(0.9, 'rgba(255,255,255,0.13)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(-r, 0, w, h);
    }
    ctx.restore();
    tubeOutline(ctx, w, h); gline(ctx, C.cy, simple ? 4 : 3, 0.9 * a);
    ctx.beginPath(); ctx.ellipse(0, 0, r + 7, 9, 0, 0, TAU); gline(ctx, C.cy, simple ? 4 : 2.5, 0.9 * a);
    if (!simple) {
      ctx.beginPath();
      for (var y = 110; y < h - 70; y += 40) { ctx.moveTo(-r + 6, y); ctx.lineTo(-r + (((y - 110) / 40) % 2 ? 16 : 26), y); }
      gline(ctx, C.cy, 1.5, 0.55 * a);
    }
  }
  /* blood contents separating: s 0..1 (0 = mixed whole blood, 1 = 3 layers). hi = highlighted layer, hiA its strength */
  function bloodLayers(ctx, w, h, s, t, hi, hiA) {
    var r = w / 2, yT = TB.top, L = h - yT, yR = h - 0.45 * L, yB = yR - 0.024 * L;
    var bnd = lerp(yT, yB, eio(s));
    var pc = mixC([175, 40, 45], [255, 212, 104], smooth(0, 0.35, s));
    var g = ctx.createLinearGradient(0, yT, 0, bnd + 2);
    g.addColorStop(0, rgba(mixC(pc, WHITE, 0.15), 0.82)); g.addColorStop(1, rgba(pc, 0.86));
    ctx.fillStyle = g; ctx.fillRect(-r, yT, w, bnd - yT + 2);
    var rc = mixC([178, 30, 44], [160, 12, 32], s);
    var g2 = ctx.createLinearGradient(0, bnd, 0, h);
    g2.addColorStop(0, rgba(mixC(rc, WHITE, 0.12), 0.95)); g2.addColorStop(1, rgba(mixC(rc, [0, 0, 0], 0.3), 0.97));
    ctx.fillStyle = g2; ctx.fillRect(-r, bnd, w, h - bnd);
    // meniscus
    ctx.beginPath(); ctx.moveTo(-r, yT - 5); ctx.quadraticCurveTo(0, yT + 6, r, yT - 5); ctx.lineTo(r, yT + 2); ctx.lineTo(-r, yT + 2); ctx.closePath();
    ctx.fillStyle = rgba(mixC(pc, WHITE, 0.3), 0.8); ctx.fill();
    // buffy coat
    var ba = smooth(0.55, 0.95, s);
    if (ba > 0) {
      ctx.fillStyle = rgba([246, 246, 255], 0.95 * ba); ctx.fillRect(-r, yB, w, yR - yB);
      glowDot(ctx, 0, (yB + yR) / 2, r * 1.3, [255, 255, 255], 0.35 * ba);
    }
    // sedimenting cells (rain in the clearing plasma)
    var ra = smooth(0.02, 0.15, s) * (1 - smooth(0.75, 1, s));
    if (ra > 0) {
      var R = rng(77);
      for (var i = 0; i < 28; i++) {
        var px = (R() - 0.5) * w * 0.8, fr = mod(R() + t * (0.5 + R() * 0.4), 1);
        var py = lerp(yT + 6, bnd, fr);
        ctx.beginPath(); ctx.ellipse(px, py, 4, 2.6, 0, 0, TAU); ctx.fillStyle = rgba([210, 40, 55], 0.85 * ra); ctx.fill();
      }
    }
    // highlight
    if (hi != null && hi >= 0 && hiA > 0) {
      var y0 = hi === 0 ? yT : hi === 1 ? yB : yR, y1 = hi === 0 ? yB : hi === 1 ? yR : h;
      var pulse = 0.6 + 0.4 * Math.sin(t * 5);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHITE, 0.16 * pulse * hiA); ctx.fillRect(-r, y0 - (hi === 1 ? 3 : 0), w, y1 - y0 + (hi === 1 ? 6 : 0));
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(-r, y0 - (hi === 1 ? 3 : 0)); ctx.lineTo(r, y0 - (hi === 1 ? 3 : 0));
      ctx.moveTo(-r, y1 + (hi === 1 ? 3 : 0)); ctx.lineTo(r, y1 + (hi === 1 ? 3 : 0));
      gline(ctx, WHITE, 2, hiA * pulse);
    }
    return { yT: yT, yB: yB, yR: yR, h: h };
  }

  /**
   * centrifugeTube(ctx, {x, y, scale=1, p, t, alpha=1, layers})   natural size 1000×760 (+emitter below)
   * Whole blood in a test tube is centrifuged (top-view rotor with motion blur, balance tube opposite), the tube
   * flies back upright and separates into 血漿 約55% / バフィーコート（白血球・血小板 1%以下） / 赤血球 約45%.
   * layers: index of the layer to highlight (0=血漿, 1=バフィーコート, 2=赤血球); default = auto-highlight the
   *   layer whose label is appearing; -1 = no highlight.
   * p stages:
   *   0.00–0.07 panel power-on
   *   0.07–0.34 SPIN (rotor speeds up / slows; label 遠心分離)  — stop at 0.34
   *   0.30–0.38 tube flies back upright to the centre-left
   *   0.36–0.52 SETTLE: cells sink, plasma clears, buffy coat appears (~0.47)
   *   0.52–0.62 label1 血漿 約55%           (beat ≈ 0.53)
   *   0.64–0.74 label2 バフィーコート 1%以下 (beat ≈ 0.65)
   *   0.76–0.86 label3 赤血球 約45%          (beat ≈ 0.77)
   *   0.86–1.00 hold (all labels)
   */
  D.centrifugeTube = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1000, PH = 760;
    var ca = frame(ctx, o, PW, PH, '血液の成分（遠心分離）', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var sSpin = seg(p, 0.07, 0.34), sFly = eio(seg(p, 0.30, 0.38)), sSep = seg(p, 0.36, 0.52);
    var la = [seg(p, 0.52, 0.62), seg(p, 0.64, 0.74), seg(p, 0.76, 0.86)];
    var hi = o.layers, hiA = 1;
    if (hi == null) {
      hi = -1; hiA = 0;
      for (var k = 0; k < 3; k++) { var aa = la[k] > 0 ? (1 - seg(p, [0.62, 0.74, 0.86][k] + 0.04, [0.62, 0.74, 0.86][k] + 0.1)) * smooth(0, 0.3, la[k]) : 0; if (aa > hiA) { hi = k; hiA = aa; } }
      if (hiA <= 0) hi = -1;
    }
    var TOT = TAU * 7, RR = 250, KK = 0.36, RCY = -10;
    var g = sSpin * sSpin * (3 - 2 * sSpin), th = Math.PI / 2 - TOT * (1 - g);
    var omega = 6 * sSpin * (1 - sSpin);
    var rotorA = 1 - eio(seg(p, 0.3, 0.345));
    function tubeAt(theta, contentsA, simple, empty) {
      var dx = Math.cos(theta), dy = Math.sin(theta) * KK, dl = Math.hypot(dx, dy);
      var cx = dx * RR, cy = RCY + dy * RR, rot = Math.atan2(-dx / dl, dy / dl);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(0.4, 0.4 * dl); ctx.translate(0, -TB.h / 2);
      ctx.globalAlpha *= contentsA;
      drawTube(ctx, TB.w, TB.h, function () {
        ctx.fillStyle = empty ? 'rgba(160,220,255,0.28)' : 'rgba(176,32,46,0.95)';
        ctx.fillRect(-TB.w / 2, TB.top, TB.w, TB.h);
      }, 1, simple);
      ctx.restore();
    }
    // ---- rotor (spin phase)
    if (rotorA > 0.01 && p >= 0.07) {
      ctx.save(); ctx.globalAlpha *= rotorA * smooth(0.07, 0.1, p);
      ctx.beginPath(); ctx.ellipse(0, RCY, RR + 90, (RR + 90) * KK, 0, 0, TAU); gline(ctx, C.cy, 2.5, 0.7);
      ctx.beginPath(); ctx.ellipse(0, RCY, 46, 46 * KK, 0, 0, TAU); gline(ctx, C.cy, 3, 0.9);
      // speed rings
      var spd = omega;
      for (var ri = 0; ri < 3; ri++) {
        var a0 = th - 0.2 - ri * 2.1, span = 0.4 + 2.4 * spd;
        ctx.beginPath(); ctx.ellipse(0, RCY, RR + 30 + ri * 22, (RR + 30 + ri * 22) * KK, 0, a0 - span, a0);
        gline(ctx, C.cy, 2, 0.5 * spd);
      }
      // arms
      ctx.beginPath(); ctx.moveTo(Math.cos(th) * 46, RCY + Math.sin(th) * 46 * KK); ctx.lineTo(Math.cos(th) * RR, RCY + Math.sin(th) * RR * KK);
      ctx.moveTo(-Math.cos(th) * 46, RCY - Math.sin(th) * 46 * KK); ctx.lineTo(-Math.cos(th) * RR, RCY - Math.sin(th) * RR * KK);
      gline(ctx, C.cy, 3, 0.6);
      // motion trail ghosts
      var trail = clamp(omega * TOT * 0.02, 0, 1.5), n = trail > 0.06 ? 6 : 1;
      for (var gi = n - 1; gi >= 0; gi--) {
        var tt = n === 1 ? th : th - (trail * gi) / (n - 1), ga = n === 1 ? 1 : gi === 0 ? 1 : 0.42 * Math.pow(1 - gi / n, 1.5);
        tubeAt(tt + Math.PI, ga * 0.9, true, true);
        if (gi > 0 || sFly <= 0) tubeAt(tt, ga, gi > 0, false);
      }
      txt(ctx, '遠心分離', 0, RCY - (RR + 90) * KK - 40, { size: 40, align: 'center', a: seg(p, 0.09, 0.15), alpha: (0.75 + 0.25 * Math.sin(t * 8)) });
      txt(ctx, '（重いものほど下へ沈む）', 0, RCY + (RR + 90) * KK + 40, { size: 26, align: 'center', a: seg(p, 0.14, 0.2), color: [190, 230, 245] });
      ctx.restore();
    }
    // ---- the tube (flying back + separating)
    var TX = -200, TYc = -10;
    if (p >= 0.07 && sFly > 0) {
      var fx = lerp(0, TX, sFly), fy = lerp(RCY + RR * KK, TYc, sFly), sx = lerp(0.4, 1, sFly), sy = lerp(0.4 * KK, 1, sFly);
      ctx.save(); ctx.translate(fx, fy); ctx.scale(sx, sy); ctx.translate(0, -TB.h / 2);
      var lay = null;
      drawTube(ctx, TB.w, TB.h, function () { lay = bloodLayers(ctx, TB.w, TB.h, sSep, t, hi, hiA); }, 1, false);
      ctx.restore();
      // ---- labels (panel coords)
      var top = TYc - TB.h / 2, bx = TX + TB.w / 2 + 18;
      var yT = top + TB.top, yB = top + lay.yB, yR = top + lay.yR, yE = top + TB.h;
      var dim = function (k) { return hiA > 0.05 && hi !== k ? 1 - 0.45 * hiA : 1; };
      // plasma
      var m0 = (yT + yB) / 2;
      ctx.save(); ctx.globalAlpha *= dim(0);
      var tip = braceV(ctx, bx, yT + 2, yB - 4, la[0], C.yel, 3);
      var w1 = txt(ctx, '血漿', tip + 20, m0 - 24, { size: 54, color: [255, 236, 170], glow: C.yel, a: la[0] });
      txt(ctx, '約55%', tip + 40 + w1, m0 - 24, { size: 54, color: WHITE, glow: C.yel, a: seg(p, 0.55, 0.64) });
      txt(ctx, '水・タンパク質・電解質など', tip + 22, m0 + 30, { size: 28, color: [255, 236, 190], glow: C.yel, a: seg(p, 0.57, 0.66) });
      ctx.restore();
      // buffy coat
      var mb = (yB + yR) / 2;
      ctx.save(); ctx.globalAlpha *= dim(1);
      arrowPts(ctx, [[TX + TB.w / 2 + 6, mb], [bx + 50, mb]], eout(seg(la[1], 0, 0.4)), WHITE, 2.5, { head: false, dot: true });
      txt(ctx, 'バフィーコート', bx + 66, mb - 4, { size: 40, color: WHITE, a: seg(la[1], 0.2, 1) });
      txt(ctx, '白血球・血小板　1%以下', bx + 68, mb + 40, { size: 28, color: [225, 240, 255], a: seg(p, 0.68, 0.76) });
      ctx.restore();
      // RBC
      var mr = (yR + yE) / 2;
      ctx.save(); ctx.globalAlpha *= dim(2);
      var tip3 = braceV(ctx, bx, yR + 4, yE - 2, la[2], C.hot, 3);
      var w3 = txt(ctx, '赤血球', tip3 + 20, mr, { size: 54, color: [255, 190, 190], glow: C.hot, a: la[2] });
      txt(ctx, '約45%', tip3 + 40 + w3, mr, { size: 54, color: WHITE, glow: C.hot, a: seg(p, 0.79, 0.88) });
      ctx.restore();
    }
    ctx.restore();
  };

  /* ============================================================ 2. CLOT TUBE */
  /**
   * clotTube(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1080×760
   * Blood left standing clots: fibrin strands appear, the clot (血餅) retracts downward and clear yellow serum (血清)
   * remains above. A magnifier shows the fibrin mesh trapping red cells. Then the equation card.
   * p stages:
   *   0.00–0.07 panel power-on
   *   0.07–0.32 fibrin strands grow (tube + magnifier; magnifier opens 0.12–0.24)
   *   0.20–0.42 clot retraction → serum separates on top
   *   0.42–0.52 label 血餅（フィブリン＋血球）  (beat ≈ 0.43)
   *   0.52–0.60 label 血清                       (beat ≈ 0.53)
   *   0.62–0.88 equation 「血清 ＝ 血漿 − フィブリノゲンなど（凝固因子）」 terms at 0.62 / 0.67 / 0.73 / 0.80
   *   0.88–1.00 hold
   */
  var MESH = null;
  function meshData() {
    if (MESH) return MESH;
    var R = rng(4242), tube = [], mag = [], cells = [], i;
    for (i = 0; i < 46; i++) tube.push([R(), R(), R(), R(), R()]);
    for (i = 0; i < 22; i++) { var a = R() * Math.PI, off = (R() - 0.5) * 1.7; mag.push([a, off, (R() - 0.5) * 0.6, R()]); }
    var cpos = [[-0.45, -0.35], [0.1, -0.5], [0.5, -0.1], [-0.15, 0.1], [-0.55, 0.35], [0.3, 0.45], [0.62, 0.42], [-0.1, 0.62]];
    for (i = 0; i < cpos.length; i++) cells.push({ x: cpos[i][0], y: cpos[i][1], tx: (R() - 0.5) * 1.6, ty: (R() - 0.5) * 1.0, rot: R() * TAU, dx: R() * 0.4 + 0.3, ph: R() * TAU });
    MESH = { tube: tube, mag: mag, cells: cells }; return MESH;
  }
  D.clotTube = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1080, PH = 760;
    var ca = frame(ctx, o, PW, PH, '血清と血餅', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var M = meshData();
    var grow = eio(seg(p, 0.07, 0.32)), retr = eio(seg(p, 0.2, 0.42)), magA = eio(seg(p, 0.12, 0.24));
    var TX = -10, TOP = -290, TW = 110, TH = 440, yT = 56, Lq = TH - yT;
    var clotTop = lerp(yT, yT + 0.5 * Lq, retr), inset = 9 * retr;
    ctx.save(); ctx.translate(TX, TOP);
    drawTube(ctx, TW, TH, function () {
      var r = TW / 2;
      // liquid above the clot: whole blood colour -> clear serum
      var sc = mixC([170, 32, 44], [255, 214, 110], smooth(0.25, 0.9, retr));
      ctx.fillStyle = rgba(sc, lerp(0.92, 0.72, retr)); ctx.fillRect(-r, yT, TW, TH - yT);
      ctx.beginPath(); ctx.moveTo(-r, yT - 5); ctx.quadraticCurveTo(0, yT + 6, r, yT - 5); ctx.lineTo(r, yT + 2); ctx.lineTo(-r, yT + 2); ctx.closePath();
      ctx.fillStyle = rgba(mixC(sc, WHITE, 0.3), 0.8); ctx.fill();
      // clot body
      ctx.beginPath();
      for (var i = 0; i <= 20; i++) {
        var xx = lerp(-r + inset, r - inset, i / 20), yy = clotTop + 5 * Math.sin(i * 1.7 + 0.5) * retr;
        if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.lineTo(r - inset, TH); ctx.lineTo(-r + inset, TH); ctx.closePath();
      var cg = ctx.createLinearGradient(0, clotTop, 0, TH);
      cg.addColorStop(0, 'rgba(150,20,36,0.97)'); cg.addColorStop(1, 'rgba(90,6,20,0.98)');
      ctx.fillStyle = cg; ctx.fill();
      // fibrin strands
      ctx.beginPath();
      for (i = 0; i < M.tube.length; i++) {
        var q = M.tube[i], gg = seg(grow, q[4] * 0.5, q[4] * 0.5 + 0.5);
        if (gg <= 0) continue;
        var x1 = lerp(-r + inset, r - inset, q[0]), y1 = lerp(clotTop, TH, q[1]);
        var x2 = lerp(-r + inset, r - inset, q[2]), y2 = lerp(clotTop, TH, q[3]);
        ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, gg), lerp(y1, y2, gg));
      }
      ctx.strokeStyle = 'rgba(255,236,190,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    }, 1, false);
    ctx.restore();
    // ---- magnifier
    var MX = -330, MY = -50, MR = 165;
    if (magA > 0) {
      var cyc = TOP + (clotTop + TH) / 2;
      ctx.save(); ctx.globalAlpha *= magA;
      ctx.beginPath(); ctx.moveTo(MX + MR * Math.cos(-0.75), MY + MR * Math.sin(-0.75)); ctx.lineTo(TX - TW / 2, cyc - 30);
      ctx.moveTo(MX + MR * Math.cos(0.75), MY + MR * Math.sin(0.75)); ctx.lineTo(TX - TW / 2, cyc + 30);
      gline(ctx, C.cy, 1.5, 0.5);
      var mr = MR * (0.6 + 0.4 * eout(magA));
      ctx.save(); ctx.beginPath(); ctx.arc(MX, MY, mr, 0, TAU); ctx.clip();
      var bg = ctx.createRadialGradient(MX, MY, 10, MX, MY, mr);
      bg.addColorStop(0, 'rgba(255,214,140,0.25)'); bg.addColorStop(1, 'rgba(120,20,30,0.55)');
      ctx.fillStyle = bg; ctx.fillRect(MX - mr, MY - mr, mr * 2, mr * 2);
      var trap = eio(seg(p, 0.14, 0.34));
      for (var ci = 0; ci < M.cells.length; ci++) {
        var c = M.cells[ci];
        var fx = c.tx + Math.sin(t * c.dx + c.ph) * 0.15, fy = c.ty + Math.cos(t * c.dx * 0.8 + c.ph) * 0.12;
        var cx = MX + lerp(fx, c.x, trap) * MR, cy2 = MY + lerp(fy, c.y, trap) * MR;
        rbc(ctx, { x: cx, y: cy2, r: 30, tiltX: 0.5 + 0.4 * Math.sin(ci * 1.3), rot: c.rot + (1 - trap) * t * 0.4 });
      }
      // fibrin mesh
      ctx.beginPath();
      for (var mi = 0; mi < M.mag.length; mi++) {
        var q2 = M.mag[mi], gg2 = seg(grow, q2[3] * 0.5, q2[3] * 0.5 + 0.5);
        if (gg2 <= 0) continue;
        var ux = Math.cos(q2[0]), uy = Math.sin(q2[0]), ox = -uy * q2[1] * MR * 0.55, oy = ux * q2[1] * MR * 0.55;
        var ax = MX + ox - ux * MR * 1.1, ay = MY + oy - uy * MR * 1.1, bx2 = MX + ox + ux * MR * 1.1, by = MY + oy + uy * MR * 1.1;
        var kx = MX + ox + q2[2] * MR * 0.5 * -uy, ky = MY + oy + q2[2] * MR * 0.5 * ux;
        var pts = qpts(ax, ay, kx, ky, bx2, by, 10);
        var nn = Math.max(1, Math.round(10 * gg2));
        ctx.moveTo(pts[0][0], pts[0][1]); for (var pi = 1; pi <= nn; pi++) ctx.lineTo(pts[pi][0], pts[pi][1]);
      }
      gline(ctx, [255, 236, 180], 2.2, 0.95);
      ctx.restore();
      ctx.beginPath(); ctx.arc(MX, MY, mr, 0, TAU); gline(ctx, C.cy, 3, 1);
      txt(ctx, 'フィブリン', MX + mr * 0.2, MY - mr - 26, { size: 30, color: [255, 236, 190], glow: C.yel, a: seg(p, 0.2, 0.3) });
      txt(ctx, 'フィブリンの網が', MX, MY + mr + 34, { size: 28, align: 'center', a: seg(p, 0.24, 0.34) });
      txt(ctx, '血球をからめ取る', MX, MY + mr + 70, { size: 28, align: 'center', a: seg(p, 0.27, 0.37) });
      ctx.restore();
    }
    // ---- labels
    var bx = TX + TW / 2 + 18, yC0 = TOP + clotTop + 4, yC1 = TOP + TH - 2, yS0 = TOP + yT + 2, yS1 = TOP + clotTop - 4;
    var l1 = seg(p, 0.42, 0.52), l2 = seg(p, 0.52, 0.6);
    var tip = braceV(ctx, bx, yC0, yC1, l1, C.hot, 3);
    txt(ctx, '血餅', tip + 20, (yC0 + yC1) / 2 - 20, { size: 52, color: [255, 190, 190], glow: C.hot, a: l1 });
    txt(ctx, 'フィブリン＋血球', tip + 22, (yC0 + yC1) / 2 + 28, { size: 28, a: seg(p, 0.45, 0.54) });
    var tip2 = braceV(ctx, bx, yS0, yS1, l2, C.yel, 3);
    txt(ctx, '血清', tip2 + 20, (yS0 + yS1) / 2 - 20, { size: 52, color: [255, 236, 170], glow: C.yel, a: l2 });
    txt(ctx, '固まらずに残った液体', tip2 + 22, (yS0 + yS1) / 2 + 28, { size: 28, a: seg(p, 0.55, 0.62) });
    // ---- equation card
    var ea = seg(p, 0.6, 0.66);
    if (ea > 0) {
      var parts = [['血清', 46, C.yel, 0.62], ['＝', 46, WHITE, 0.66], ['血漿', 46, C.yel, 0.67], ['−', 46, WHITE, 0.72], ['フィブリノゲンなど', 42, C.warm, 0.73], ['（凝固因子）', 30, [190, 230, 245], 0.80]];
      var gap = 16, tot = 0, ws = [];
      for (var i = 0; i < parts.length; i++) { ws.push(textW(ctx, parts[i][0], parts[i][1])); tot += ws[i] + (i ? gap : 0); }
      var cw = tot + 80, chh = 96, cx0 = -cw / 2 + 20, cyy = 290;
      ctx.save(); ctx.globalAlpha *= eio(ea); ctx.translate(0, (1 - eout(ea)) * 30);
      rrect(ctx, cx0 - 40 + 20 - 20, cyy - chh / 2, cw, chh, 20);
      ctx.fillStyle = 'rgba(2,20,34,0.88)'; ctx.fill(); gline(ctx, C.cy, 2.5, 0.95);
      var xx = -tot / 2 + 20;
      for (i = 0; i < parts.length; i++) {
        txt(ctx, parts[i][0], xx, cyy + (parts[i][1] < 40 ? 4 : 0), { size: parts[i][1], color: mixC(parts[i][2], WHITE, 0.35), glow: parts[i][2], a: seg(p, parts[i][3], parts[i][3] + 0.05) });
        xx += ws[i] + gap;
      }
      ctx.restore();
    }
    ctx.restore();
  };

  /* ============================================================ 3. PLASMA PROTEINS */
  var PROT = null;
  function protData() {
    if (PROT) return PROT;
    var R = rng(909), list = [], i;
    function add(kind, n) {
      for (var k = 0; k < n; k++) list.push({ k: kind, x: -470 + R() * 940, y: -250 + R() * 170, ph: R() * TAU, sp: 0.3 + R() * 0.5, rot: R() * TAU, d: R() });
    }
    add('alb', 30); add('glb', 11); add('ab', 6); add('fib', 4);
    PROT = list; return list;
  }
  function protShape(ctx, q, x, y, rot, a, hiAb) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
    if (q.k === 'alb') { ball(ctx, 0, 0, 10, [255, 210, 110]); }
    else if (q.k === 'glb') { ball(ctx, 0, 0, 15, [170, 185, 255]); }
    else if (q.k === 'ab') {
      var col = mixC([170, 185, 255], [255, 170, 100], hiAb);
      if (hiAb > 0) glowDot(ctx, 0, 0, 50, [255, 160, 90], hiAb * 0.8);
      ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 0); ctx.moveTo(0, 0); ctx.lineTo(-17, -19); ctx.moveTo(0, 0); ctx.lineTo(17, -19);
      gline(ctx, col, 6, 1);
    } else {
      ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); gline(ctx, [170, 255, 190], 4, 0.9);
      ball(ctx, -40, 0, 9, [150, 240, 170]); ball(ctx, 0, 0, 8, [150, 240, 170]); ball(ctx, 40, 0, 9, [150, 240, 170]);
    }
    ctx.restore();
  }
  var EP = [ // electrophoresis peaks: [u, amp, sigma, label]
    [0.12, 1.0, 0.034, 'アルブミン'], [0.33, 0.085, 0.022, 'α₁'], [0.46, 0.16, 0.028, 'α₂'], [0.62, 0.14, 0.034, 'β'], [0.82, 0.2, 0.068, 'γ']
  ];
  function epF(u) { var s = 0.008; for (var i = 0; i < EP.length; i++) { var d = u - EP[i][0]; s += EP[i][1] * Math.exp(-(d * d) / (2 * EP[i][2] * EP[i][2])); } return s; }
  /**
   * plasmaProteins(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1100×760
   * Floating plasma proteins (アルブミン small spheres, グロブリン, Y-shaped 抗体, rod-like フィブリノゲン) + a serum
   * electrophoresis curve drawing itself left(+)→right(−): tall albumin peak, then α₁, α₂, β, γ bumps; bracket
   * グロブリン; γ highlighted as 「抗体」 (the Y particles light up warm at the same time).
   * p stages:
   *   0.00–0.07 panel power-on
   *   0.07–0.20 particles fade in
   *   0.12 / 0.18 / 0.24 legend: アルブミン / グロブリン / フィブリノゲン
   *   0.30–0.68 curve draws; peak labels pop as the pen passes (アルブミン ≈0.35, α₁ ≈0.44, α₂ ≈0.49, β ≈0.55, γ ≈0.64)
   *   0.68–0.74 bracket グロブリン
   *   0.74–0.86 γ highlight → 「抗体」 tag (beat ≈ 0.76)
   *   0.86–1.00 hold
   */
  D.plasmaProteins = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1100, PH = 760;
    var ca = frame(ctx, o, PW, PH, '血漿タンパク質', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var hiG = seg(p, 0.74, 0.8);
    // ---- particles
    var L = protData();
    for (var i = 0; i < L.length; i++) {
      var q = L[i], a = seg(p, 0.07 + q.d * 0.08, 0.12 + q.d * 0.08);
      if (a <= 0) continue;
      var x = q.x + 18 * Math.sin(t * q.sp + q.ph), y = q.y + 12 * Math.cos(t * q.sp * 0.8 + q.ph * 1.3);
      protShape(ctx, q, x, y, q.rot + t * 0.15 * (q.d - 0.5), a, hiG);
    }
    // legend row
    var ly = -40, items = [['alb', 'アルブミン', 0.12, -400], ['glb', 'グロブリン', 0.18, -90], ['fib', 'フィブリノゲン', 0.24, 210]];
    for (i = 0; i < items.length; i++) {
      var la = seg(p, items[i][2], items[i][2] + 0.06);
      if (la <= 0) continue;
      protShape(ctx, { k: items[i][0] }, items[i][3] + (items[i][0] === 'fib' ? 10 : 0), ly, 0, smooth(0, 0.4, la), 0);
      txt(ctx, items[i][1], items[i][3] + (items[i][0] === 'fib' ? 64 : 28), ly, { size: 32, a: la });
    }
    // ---- electrophoresis chart
    var X0 = -440, X1 = 440, BY = 300, HH = 250, d = eio(seg(p, 0.3, 0.68));
    var axA = seg(p, 0.26, 0.32);
    ctx.beginPath(); ctx.moveTo(X0 - 30, BY); ctx.lineTo(lerp(X0 - 30, X1 + 30, eio(axA)), BY); gline(ctx, C.cy, 2, 0.8 * axA);
    txt(ctx, '＋', X0 - 50, BY + 30, { size: 30, align: 'center', a: axA, color: [255, 210, 160] });
    txt(ctx, '−', X1 + 50, BY + 30, { size: 34, align: 'center', a: axA, color: [180, 220, 255] });
    txt(ctx, '電気泳動（血清タンパク質の分布）', X0 - 30, 26, { size: 26, color: [190, 230, 245], a: seg(p, 0.27, 0.34) });
    function ux(u) { return lerp(X0, X1, u); }
    function uy(u) { return BY - (epF(u) / 1.01) * HH; }
    if (d > 0) {
      var N = 240, nn = Math.max(1, Math.floor(N * d));
      // gamma highlight fill
      if (hiG > 0) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(ux(0.7), BY);
        for (i = 0; i <= 60; i++) { var u2 = lerp(0.7, 0.98, i / 60); ctx.lineTo(ux(u2), uy(u2)); }
        ctx.lineTo(ux(0.98), BY); ctx.closePath();
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([255, 150, 70], 0.35 * hiG * (0.8 + 0.2 * Math.sin(t * 5))); ctx.fill();
        ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(ux(0), BY);
      for (i = 0; i <= nn; i++) ctx.lineTo(ux(i / N), uy(i / N));
      ctx.lineTo(ux(nn / N), BY); ctx.closePath();
      var fg = ctx.createLinearGradient(0, BY - HH, 0, BY);
      fg.addColorStop(0, rgba(C.cy, 0.3)); fg.addColorStop(1, rgba(C.cy, 0.04));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = fg; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(ux(0), uy(0));
      for (i = 1; i <= nn; i++) ctx.lineTo(ux(i / N), uy(i / N));
      gline(ctx, C.cy, 3.5, 1);
      if (d < 1) glowDot(ctx, ux(nn / N), uy(nn / N), 26, WHITE, 1);
      // peak labels
      for (i = 0; i < EP.length; i++) {
        var pa = seg(d, EP[i][0] + 0.005, EP[i][0] + 0.07);
        if (pa <= 0) continue;
        var px = ux(EP[i][0]), py = uy(EP[i][0]);
        if (i === 0) {
          txt(ctx, 'アルブミン', px + 34, py + 22, { size: 36, color: [255, 236, 180], glow: C.yel, a: pa });
          txt(ctx, '（いちばん多い）', px + 36, py + 62, { size: 24, color: [230, 240, 250], a: seg(d, 0.16, 0.24) });
        } else {
          var isG = i === 4, col = isG ? mixC(C.ink, [255, 190, 120], hiG) : C.ink;
          txt(ctx, isG ? 'γ' : EP[i][3], px, py - 30, { size: 38, align: 'center', color: col, glow: isG && hiG > 0 ? C.warm : C.cy, a: pa, type: false });
        }
      }
      // globulin bracket
      var ba = seg(p, 0.68, 0.74);
      if (ba > 0) {
        var bx0 = ux(0.30), bx1 = ux(0.93), byy = 166;
        ctx.beginPath(); ctx.moveTo(bx0, byy + 16); ctx.lineTo(bx0, byy); ctx.lineTo(lerp(bx0, bx1, eio(ba)), byy);
        if (ba > 0.95) ctx.lineTo(bx1, byy + 16);
        gline(ctx, [170, 185, 255], 2.5, 1);
        txt(ctx, 'グロブリン', (bx0 + bx1) / 2, byy - 30, { size: 36, align: 'center', color: [210, 220, 255], glow: [170, 185, 255], a: ba });
      }
      // antibody tag
      if (hiG > 0) {
        var gx = ux(0.82);
        ctx.beginPath(); ctx.moveTo(gx, BY + 4); ctx.lineTo(gx, BY + 26); gline(ctx, C.warm, 2.5, hiG);
        tag(ctx, '抗体（免疫グロブリン）', gx - 40, BY + 54, { size: 28, color: C.warm, a: seg(p, 0.76, 0.84) });
      }
    }
    ctx.restore();
  };

  /* ============================================================ 4. RBC MODEL */
  function rbcT(x) { x = Math.abs(x); if (x >= 1) return 0; var x2 = x * x; return Math.sqrt(1 - x2) * (0.75 + 8.13 * x2 - 4.56 * x2 * x2); } // μm, x=r/R
  var RBC_K = 80, RBC_R = 300; // px per μm, radius px (7.5 μm)
  var RIM_X = (function () { var bx = 0, bv = 0; for (var i = 0; i <= 400; i++) { var v = rbcT(i / 400); if (v > bv) { bv = v; bx = i / 400; } } return bx; })();
  var HB_DOTS = null;
  function hbDots() {
    if (HB_DOTS) return HB_DOTS;
    var R = rng(31337), out = [], tries = 0;
    while (out.length < 300 && tries < 20000) {
      tries++;
      var x = (R() * 2 - 1) * (RBC_R - 8), y = (R() * 2 - 1) * 110, ht = (rbcT(x / RBC_R) / 2) * RBC_K - 8;
      if (Math.abs(y) > ht) continue;
      var ok = true;
      for (var j = out.length - 1; j >= 0 && j > out.length - 40; j--) if (Math.hypot(out[j].x - x, out[j].y - y) < 11) { ok = false; break; }
      if (!ok) continue;
      out.push({ x: x, y: y, r: R(), s: 4.6 + R() * 1.6 });
    }
    out.sort(function (a, b) { return a.r - b.r; });
    HB_DOTS = out; return out;
  }
  function dimLineH(ctx, x1, x2, y, a, col) {
    var m = (x1 + x2) / 2, e = eio(a);
    arrowPts(ctx, [[m, y], [lerp(m, x1, e), y]], 1, col, 2.5, { headSize: 16, alpha: smooth(0, 0.2, a) });
    arrowPts(ctx, [[m, y], [lerp(m, x2, e), y]], 1, col, 2.5, { headSize: 16, alpha: smooth(0, 0.2, a) });
  }
  function dimLineV(ctx, x, y1, y2, a, col) {
    var m = (y1 + y2) / 2, e = eio(a);
    arrowPts(ctx, [[x, m], [x, lerp(m, y1, e)]], 1, col, 2.5, { headSize: 15, alpha: smooth(0, 0.2, a) });
    arrowPts(ctx, [[x, m], [x, lerp(m, y2, e)]], 1, col, 2.5, { headSize: 15, alpha: smooth(0, 0.2, a) });
  }
  /**
   * rbcModel(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1100×760
   * Big biconcave RBC (BS.world.drawRBC) tilting from face-on to edge-on, then a 2D cross-section (Evans–Fung profile
   * scaled to the lecture values) with dimension lines 直径 約7.5 μm / 縁の厚さ 約2.6 μm / 中央 約0.75 μm,
   * a 「核なし」 tag (crossed-out ghost nucleus), and finally the interior fills with hemoglobin dots.
   * p stages:
   *   0.00–0.06 panel power-on
   *   0.06–0.36 3D model turns (face-on → oblique → edge-on); tag 両凹円盤 0.16–0.26
   *   0.36–0.47 crossfade to the cross-section (outline traces 0.38–0.47)
   *   0.47–0.56 直径 約7.5 μm        (beat ≈ 0.48)
   *   0.56–0.64 縁の厚さ 約2.6 μm    (beat ≈ 0.57)
   *   0.64–0.71 中央 約0.75 μm       (beat ≈ 0.65)
   *   0.71–0.80 核なし (ghost nucleus crossed out → tag)  (beat ≈ 0.72)
   *   0.80–0.95 hemoglobin dots fill the interior, label ヘモグロビン at 0.86
   *   0.95–1.00 hold
   */
  D.rbcModel = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1100, PH = 760;
    var ca = frame(ctx, o, PW, PH, '赤血球の形と大きさ', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var s3 = seg(p, 0.06, 0.36), a3 = (1 - seg(p, 0.36, 0.44)) * smooth(0.06, 0.1, p);
    if (a3 > 0) {
      var tilt = 0.4 + 0.96 * eio(seg(s3, 0.25, 1)), rot = -0.5 + 0.9 * s3;
      glowDot(ctx, 0, 0, 330, [255, 80, 90], 0.25 * a3);
      rbc(ctx, { x: 0, y: 0, r: 230, tiltX: tilt, tiltY: 0.2 * Math.sin(s3 * Math.PI), rot: rot, alpha: a3 });
      // 3D orbit ring
      ctx.save(); ctx.globalAlpha *= a3;
      ctx.beginPath(); ctx.ellipse(0, 0, 290, 70, 0, Math.PI * 0.05 + t * 0.3, Math.PI * 0.95 + t * 0.3); gline(ctx, C.cy, 2, 0.5);
      tag(ctx, '両凹円盤', 0, 300, { size: 40, color: C.hot, a: seg(p, 0.16, 0.26) });
      txt(ctx, '真ん中がへこんだ円盤', 0, -300, { size: 30, align: 'center', a: seg(p, 0.2, 0.3) });
      ctx.restore();
    }
    var cA = seg(p, 0.36, 0.44);
    if (cA > 0) {
      var CX = -80, CY = 0, tr = eio(seg(p, 0.38, 0.47)), N = 120, i, x;
      ctx.save(); ctx.globalAlpha *= cA;
      // profile path
      function prof() {
        ctx.beginPath();
        for (i = 0; i <= N; i++) { x = -1 + (2 * i) / N; var ht = (rbcT(x) / 2) * RBC_K; if (i === 0) ctx.moveTo(CX + x * RBC_R, CY - ht); else ctx.lineTo(CX + x * RBC_R, CY - ht); }
        for (i = N; i >= 0; i--) { x = -1 + (2 * i) / N; ht = (rbcT(x) / 2) * RBC_K; ctx.lineTo(CX + x * RBC_R, CY + ht); }
        ctx.closePath();
      }
      prof();
      var fg = ctx.createLinearGradient(0, CY - 110, 0, CY + 110);
      fg.addColorStop(0, 'rgba(255,90,100,0.38)'); fg.addColorStop(0.5, 'rgba(200,30,50,0.30)'); fg.addColorStop(1, 'rgba(255,90,100,0.38)');
      ctx.save(); ctx.globalAlpha *= tr; ctx.fillStyle = fg; ctx.fill(); ctx.restore();
      // traced outline (clip-reveal from centre outward)
      ctx.save(); ctx.beginPath(); ctx.rect(CX - RBC_R * tr - 20, CY - 140, (RBC_R * tr + 20) * 2, 280); ctx.clip();
      prof(); gline(ctx, [255, 120, 130], 3.5, 1);
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(CX - RBC_R - 40, CY); ctx.lineTo(CX + RBC_R + 40, CY); gline(ctx, C.cy, 1, 0.35 * tr, [6, 8]);
      txt(ctx, '断面', CX - RBC_R - 40, CY - 26, { size: 26, color: [190, 230, 245], a: seg(p, 0.42, 0.48) });
      // hemoglobin dots
      var hf = seg(p, 0.8, 0.95);
      if (hf > 0) {
        var dots = hbDots(), nd = Math.floor(dots.length * hf);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < nd; i++) { var q = dots[i]; ctx.beginPath(); ctx.arc(CX + q.x, CY + q.y, q.s * 1.9, 0, TAU); ctx.fillStyle = 'rgba(255,70,80,0.22)'; ctx.fill(); }
        ctx.restore();
        for (i = 0; i < nd; i++) {
          q = dots[i]; var pop = clamp((dots.length * hf - i) / 12, 0, 1);
          ctx.beginPath(); ctx.arc(CX + q.x, CY + q.y, q.s * (0.6 + 0.4 * pop), 0, TAU); ctx.fillStyle = 'rgba(255,92,100,0.95)'; ctx.fill();
          ctx.beginPath(); ctx.arc(CX + q.x - 1.5, CY + q.y - 1.5, q.s * 0.35, 0, TAU); ctx.fillStyle = 'rgba(255,220,220,0.8)'; ctx.fill();
        }
        var hl = seg(p, 0.86, 0.94);
        arrowPts(ctx, [[CX - 330, CY + 200], [CX - 230, CY + 60]], eout(hl), C.hot, 2.5, { head: false, dot: true });
        txt(ctx, 'ヘモグロビン', CX - 330, CY + 236, { size: 38, align: 'center', color: [255, 200, 200], glow: C.hot, a: hl });
        txt(ctx, 'ぎっしり詰まっている', CX - 330, CY + 280, { size: 26, align: 'center', a: seg(p, 0.89, 0.96) });
      }
      // diameter
      var d1 = seg(p, 0.47, 0.56), yD = CY - 160;
      if (d1 > 0) {
        ctx.beginPath(); ctx.moveTo(CX - RBC_R, CY - 10); ctx.lineTo(CX - RBC_R, yD - 16); ctx.moveTo(CX + RBC_R, CY - 10); ctx.lineTo(CX + RBC_R, yD - 16);
        gline(ctx, C.cy, 1.5, 0.6 * smooth(0, 0.3, d1), [5, 6]);
        dimLineH(ctx, CX - RBC_R, CX + RBC_R, yD, d1, C.cy);
        txt(ctx, '直径 約7.5μm', CX, yD - 38, { size: 42, align: 'center', a: seg(d1, 0.3, 1) });
      }
      // rim thickness
      var d2 = seg(p, 0.56, 0.64), rx = CX + RIM_X * RBC_R, rh = (rbcT(RIM_X) / 2) * RBC_K, xD = CX + RBC_R + 70;
      if (d2 > 0) {
        ctx.beginPath(); ctx.moveTo(rx, CY - rh); ctx.lineTo(xD + 16, CY - rh); ctx.moveTo(rx, CY + rh); ctx.lineTo(xD + 16, CY + rh);
        gline(ctx, C.cy, 1.5, 0.6 * smooth(0, 0.3, d2), [5, 6]);
        dimLineV(ctx, xD, CY - rh, CY + rh, d2, C.cy);
        txt(ctx, '縁の厚さ', xD + 26, CY - 22, { size: 36, a: seg(d2, 0.3, 1) });
        txt(ctx, '約2.6μm', xD + 26, CY + 24, { size: 40, a: seg(d2, 0.45, 1) });
      }
      // centre thickness
      var d3 = seg(p, 0.64, 0.71), ch = (rbcT(0) / 2) * RBC_K;
      if (d3 > 0) {
        var e3 = eio(d3);
        arrowPts(ctx, [[CX, CY - ch - 70], [CX, CY - ch - 2]], e3, C.cy, 2.5, { headSize: 14 });
        arrowPts(ctx, [[CX, CY + ch + 70], [CX, CY + ch + 2]], e3, C.cy, 2.5, { headSize: 14 });
        arrowPts(ctx, [[CX, CY + ch + 72], [CX + 30, CY + 160], [CX + 50, CY + 160]], seg(d3, 0.3, 0.8), C.cy, 1.5, { head: false });
        txt(ctx, '中央 約0.75μm', CX + 60, CY + 160, { size: 36, a: seg(d3, 0.4, 1) });
      }
      // no nucleus
      var nA = seg(p, 0.71, 0.8);
      if (nA > 0) {
        var gA = smooth(0, 0.3, nA) * (1 - smooth(0.75, 1, nA) * 0.6);
        ctx.beginPath(); ctx.arc(CX, CY, 70, 0, TAU); gline(ctx, [200, 170, 255], 2.5, gA, [8, 8], -t * 20);
        var sl = seg(nA, 0.3, 0.6);
        ctx.beginPath(); ctx.moveTo(CX - 50, CY + 50); ctx.lineTo(lerp(CX - 50, CX + 50, sl), lerp(CY + 50, CY - 50, sl)); gline(ctx, C.hot, 4, gA * smooth(0, 0.1, sl));
        arrowPts(ctx, [[CX - 130, CY - 104], [CX - 50, CY - 52]], seg(nA, 0.45, 0.9), C.hot, 2, { head: false, alpha: 0.8 });
        tag(ctx, '核なし', CX - 170, CY - 126, { size: 34, color: C.hot, a: seg(nA, 0.35, 1) });
      }
      ctx.restore();
    }
    ctx.restore();
  };

  /* ============================================================ 5. MEMBRANE SKELETON */
  function spectrin(ctx, ax, ay, bx, by, L0, col, a, w) {
    var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var slack = clamp(1 - (L / L0 - 1) * 2.6, 0.08, 1.15), amp = 11 * slack, n = 9, S = 60;
    for (var s = 0; s < 2; s++) {
      ctx.beginPath();
      for (var i = 0; i <= S; i++) {
        var u = i / S, env = Math.sin(Math.PI * u), off = (s ? -1 : 1) * amp * Math.sin(Math.PI * n * u) * Math.sqrt(env);
        var px = ax + dx * u + nx * off, py = ay + dy * u + ny * off;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      gline(ctx, s ? mixC(col, WHITE, 0.2) : col, w, a);
    }
  }
  /**
   * membraneSkeleton(ctx, {x, y, scale=1, p, t, alpha=1, stretch})   natural size 1150×780
   * Side-view patch of the RBC membrane: lipid bilayer with バンド3 (violet) and グリコホリン (pink, sugar chains
   * outside); below, the spectrin network (coiled double strands) between junctional complexes (アクチン short
   * filament + タンパク4.1, orange) and アンキリン (green) linking spectrin up to band 3; glycophorin links to 4.1.
   * The whole patch stretches horizontally (spectrin coils straighten) and recoils with a damped overshoot.
   * stretch: optional override 0..1 of the stretch amount (0 = rest, 1 = +32%).
   * p stages:
   *   0.00–0.06 panel power-on
   *   0.06–0.18 lipid bilayer draws in (label 脂質二重層 0.12)
   *   0.18–0.28 バンド3 (0.20) + グリコホリン (0.24) appear
   *   0.30–0.44 spectrin network draws (label スペクトリン 0.36)
   *   0.44–0.56 junctions タンパク4.1／アクチン (0.44) + アンキリン (0.50)
   *   0.58–0.95 two stretch/recoil cycles (pull peaks ≈ 0.66 and 0.85; caption 0.60)
   *   0.95–1.00 rest
   */
  D.membraneSkeleton = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1150, PH = 780, hw = PW / 2;
    var ca = frame(ctx, o, PW, PH, '赤血球の膜骨格', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    // stretch factor
    var st;
    if (o.stretch != null) st = clamp(o.stretch, 0, 1);
    else {
      var s = seg(p, 0.58, 0.95);
      if (s <= 0 || s >= 1) st = 0;
      else { var u = mod(s * 2, 1); st = u < 0.42 ? eio(u / 0.42) : Math.exp(-(u - 0.42) * 9) * Math.cos((u - 0.42) * 16); }
    }
    var SX = 1 + 0.32 * st;
    function X(x) { return x * SX; }
    var MY = -165, HO = MY - 38, HI = MY + 38; // head rows
    var mA = seg(p, 0.06, 0.18);
    ctx.save();
    ctx.beginPath(); ctx.rect(-hw + 12, -PH / 2 + 80, PW - 24, PH - 90); ctx.clip();
    // ---- bilayer
    var B3 = [-360, 120, 360], GP = [-240, 240];
    if (mA > 0) {
      var heads = [], i, x;
      for (x = -560; x <= 560; x += 24) {
        var near = false;
        for (i = 0; i < B3.length; i++) if (Math.abs(x - B3[i]) < 34) near = true;
        for (i = 0; i < GP.length; i++) if (Math.abs(x - GP[i]) < 14) near = true;
        if (!near && Math.abs(x) / 560 <= eio(mA) * 1.02) heads.push(x);
      }
      ctx.beginPath();
      for (i = 0; i < heads.length; i++) {
        var hx = X(heads[i]);
        ctx.moveTo(hx - 3, HO + 8); ctx.lineTo(hx - 4, MY - 3); ctx.moveTo(hx + 3, HO + 8); ctx.lineTo(hx + 4, MY - 3);
        ctx.moveTo(hx - 3, HI - 8); ctx.lineTo(hx - 4, MY + 3); ctx.moveTo(hx + 3, HI - 8); ctx.lineTo(hx + 4, MY + 3);
      }
      ctx.strokeStyle = 'rgba(255,220,170,0.45)'; ctx.lineWidth = 2; ctx.stroke();
      for (i = 0; i < heads.length; i++) { ball(ctx, X(heads[i]), HO, 9, [255, 200, 130]); ball(ctx, X(heads[i]), HI, 9, [255, 200, 130]); }
    }
    // ---- network
    var FR = [-480, -240, 0, 240, 480], BK = [-600, -360, -120, 120, 360, 600], FY = 10, BY = 150;
    var nA = eio(seg(p, 0.3, 0.44)), jA = seg(p, 0.44, 0.5), kA = seg(p, 0.5, 0.56);
    if (nA > 0) {
      var segs = [], j;
      for (j = 0; j < BK.length - 1; j++) segs.push([BK[j], BY, BK[j + 1], BY, 1]);
      for (j = 0; j < FR.length; j++) { segs.push([FR[j], FY, FR[j] - 120, BY, 1]); segs.push([FR[j], FY, FR[j] + 120, BY, 1]); }
      for (j = 0; j < FR.length - 1; j++) segs.push([FR[j], FY, FR[j + 1], FY, 0]);
      for (j = 0; j < segs.length; j++) {
        var q = segs[j], L0 = Math.hypot(q[2] - q[0], q[3] - q[1]);
        var ax = X(q[0]), ay = q[1], bx = X(q[2]), by = q[3], g = nA;
        spectrin(ctx, ax, ay, lerp(ax, bx, g), lerp(ay, by, g), L0 * g, q[4] ? [90, 190, 230] : [120, 235, 255], q[4] ? 0.6 : 1, q[4] ? 2.5 : 3.2);
      }
      // junctional complexes
      function junction(xx, yy, sc, a) {
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a; ctx.translate(xx, yy); ctx.scale(sc, sc);
        for (var b = 0; b < 4; b++) ball(ctx, -13 + b * 8.5, -9 + b * 6, 6.5, [225, 235, 255]);
        ball(ctx, 14, 10, 11, [255, 165, 80]);
        ctx.restore();
      }
      for (j = 0; j < BK.length; j++) junction(X(BK[j]), BY, 0.75, jA * 0.7);
      for (j = 0; j < FR.length; j++) junction(X(FR[j]), FY, 1, jA);
    }
    // ---- band 3 + glycophorin (+ links)
    var pA = seg(p, 0.18, 0.24), gA = seg(p, 0.22, 0.28);
    for (var b3 = 0; b3 < B3.length; b3++) {
      if (pA <= 0) break;
      var bx3 = X(B3[b3]);
      // ankyrin link (spectrin midpoint below band 3)
      if (kA > 0) {
        var ay2 = FY + 4;
        ctx.beginPath(); ctx.moveTo(bx3, MY + 52); ctx.lineTo(bx3, lerp(MY + 52, ay2 - 14, eio(kA))); gline(ctx, [150, 255, 150], 3, 1);
        ctx.save(); ctx.globalAlpha *= kA; ctx.beginPath(); ctx.ellipse(bx3, ay2 - 4, 17, 11, 0, 0, TAU);
        ctx.fillStyle = 'rgba(120,230,120,0.95)'; ctx.fill(); gline(ctx, [150, 255, 150], 2, 1); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha *= pA; ctx.translate(bx3, MY); ctx.scale(1, eback(pA));
      rrect(ctx, -28, -58, 56, 112, 22);
      var bg3 = ctx.createLinearGradient(-28, 0, 28, 0); bg3.addColorStop(0, 'rgba(120,90,230,0.95)'); bg3.addColorStop(0.5, 'rgba(190,160,255,0.95)'); bg3.addColorStop(1, 'rgba(110,80,210,0.95)');
      ctx.fillStyle = bg3; ctx.fill(); gline(ctx, C.violet, 2, 1);
      ctx.beginPath(); for (var hx3 = -14; hx3 <= 14; hx3 += 14) { ctx.moveTo(hx3, -46); ctx.lineTo(hx3, 46); }
      ctx.strokeStyle = 'rgba(240,230,255,0.45)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    for (var gi = 0; gi < GP.length; gi++) {
      if (gA <= 0) break;
      var gx = X(GP[gi]);
      if (jA > 0) { ctx.beginPath(); ctx.moveTo(gx, MY + 50); ctx.lineTo(gx, lerp(MY + 50, FY - 14, eio(jA))); gline(ctx, [255, 170, 210], 2, 0.8, [6, 6]); }
      ctx.save(); ctx.globalAlpha *= gA;
      rrect(ctx, gx - 7, MY - 52, 14, 104, 7); ctx.fillStyle = 'rgba(255,140,200,0.95)'; ctx.fill(); gline(ctx, C.pink, 1.5, 1);
      // sugar chains (outside)
      var R = rng(500 + gi), sg = eout(seg(gA, 0.3, 1));
      ctx.beginPath(); ctx.moveTo(gx, MY - 52); ctx.lineTo(gx, MY - 52 - 60 * sg); gline(ctx, [255, 230, 140], 2.5, 1);
      for (var sb = 0; sb < 6; sb++) {
        var syy = MY - 62 - sb * 10 * sg, sd = sb % 2 ? 1 : -1, sxx = gx + sd * (14 + R() * 8) * sg;
        ctx.beginPath(); ctx.moveTo(gx, syy); ctx.lineTo(sxx, syy - 8); gline(ctx, [255, 230, 140], 2, 1);
        ball(ctx, sxx, syy - 8, 5, [255, 225, 120]);
      }
      ball(ctx, gx, MY - 52 - 64 * sg, 6, [255, 225, 120]);
      ctx.restore();
    }
    ctx.restore(); // clip
    // ---- labels
    txt(ctx, '脂質二重層', -hw + 40, MY - 82, { size: 30, color: [255, 225, 180], glow: C.warm, a: seg(p, 0.12, 0.2) });
    txt(ctx, '細胞の外', hw - 40, MY - 82, { size: 24, align: 'right', color: [190, 230, 245], a: seg(p, 0.14, 0.2) });
    txt(ctx, '細胞の内側', hw - 40, MY + 66, { size: 24, align: 'right', color: [190, 230, 245], a: seg(p, 0.14, 0.2) });
    var lb = seg(p, 0.2, 0.28), b3x = X(120);
    arrowPts(ctx, [[b3x, MY - 64], [b3x - 20, MY - 104]], eout(lb), C.violet, 2, { head: false });
    txt(ctx, 'バンド3', b3x - 30, MY - 124, { size: 34, align: 'center', color: [220, 205, 255], glow: C.violet, a: lb });
    var lg = seg(p, 0.24, 0.32), gpx = X(240);
    txt(ctx, 'グリコホリン', gpx + 36, MY - 120, { size: 34, color: [255, 205, 230], glow: C.pink, a: lg });
    var ls = seg(p, 0.36, 0.44), sx0 = X(-420), sy0 = (FY + BY) / 2 + 10;
    arrowPts(ctx, [[sx0 - 6, sy0], [X(-500), 240]], eout(ls), C.cy, 2, { head: false, dot: true });
    txt(ctx, 'スペクトリン', X(-500) - 10, 268, { size: 36, color: [200, 245, 255], a: ls });
    txt(ctx, '（網目をつくる）', X(-500) - 6, 306, { size: 24, color: [190, 230, 245], a: seg(p, 0.4, 0.46) });
    var l41 = seg(p, 0.45, 0.52), jx = X(0);
    arrowPts(ctx, [[jx + 22, FY + 16], [jx + 70, FY + 66], [jx + 90, FY + 66]], eout(l41), C.warm, 2, { head: false, dot: true });
    txt(ctx, 'タンパク4.1', jx + 98, FY + 62, { size: 32, color: [255, 215, 170], glow: C.warm, a: l41 });
    txt(ctx, '＋アクチン', jx + 100, FY + 98, { size: 24, color: [225, 235, 255], a: seg(p, 0.48, 0.54) });
    var lk = seg(p, 0.5, 0.57), kx = X(-360);
    arrowPts(ctx, [[kx - 18, FY - 6], [kx - 70, FY - 60], [kx - 92, FY - 60]], eout(lk), C.green, 2, { head: false, dot: true });
    txt(ctx, 'アンキリン', kx - 98, FY - 62, { size: 32, align: 'right', color: [200, 255, 200], glow: C.green, a: lk });
    // stretch arrows + caption
    var sa = seg(p, 0.58, 0.62) * (1 - seg(p, 0.95, 1)) * (o.stretch != null ? 0 : 1);
    if (sa > 0 || o.stretch != null) {
      var aa = o.stretch != null ? 1 : sa, pull = 0.4 + 0.6 * clamp(st, 0, 1);
      arrowPts(ctx, [[-120, 230], [-120 - 160 * pull, 230]], 1, C.cy, 4, { alpha: aa * (0.4 + 0.6 * pull) });
      arrowPts(ctx, [[120, 230], [120 + 160 * pull, 230]], 1, C.cy, 4, { alpha: aa * (0.4 + 0.6 * pull) });
      txt(ctx, '伸びる', 0, 230, { size: 30, align: 'center', a: aa, type: false });
    }
    txt(ctx, '引っぱると伸び、離すと元に戻る ＝ しなやかに変形', 0, 330, { size: 34, align: 'center', color: [235, 250, 255], a: seg(p, 0.6, 0.7) });
    ctx.restore();
  };

  /* ============================================================ 6. HEMOGLOBIN */
  var HB_SUB = [ // [dx, dy, type(0=α,1=β), seed]
    [-110, -100, 0, 11], [110, -100, 1, 12], [-110, 100, 1, 13], [110, 100, 0, 14]
  ];
  var HB_ORDER = [3, 1, 2, 0]; // binding order (α2 bottom-right first: mirrored in the inset)
  var HB_CLICK = [0.52, 0.62, 0.72, 0.82];
  function globin(ctx, cx, cy, R, col, seed, t, a) {
    ctx.save(); ctx.globalAlpha *= a;
    blobPath(ctx, cx, cy, R, seed, 0.07, t * 0.4);
    var g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 1.1);
    g.addColorStop(0, rgba(mixC(col, WHITE, 0.35), 0.62)); g.addColorStop(1, rgba(mixC(col, [0, 0, 0], 0.35), 0.5));
    ctx.fillStyle = g; ctx.fill(); gline(ctx, col, 2.5, 0.9);
    // helical ribbons
    var Rr = rng(seed * 13 + 1), pts = [];
    for (var k = 0; k < 6; k++) { var an = Rr() * TAU, rr = R * (0.2 + Rr() * 0.45); pts.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]); }
    ctx.beginPath();
    for (k = 0; k < pts.length - 1; k++) {
      var A = pts[k], B = pts[k + 1], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      if (k % 2 === 0) {
        for (var i = 0; i <= 40; i++) {
          var u = i / 40, off = 9 * Math.sin(u * TAU * 4.5) * Math.sin(Math.PI * u);
          var px = A[0] + dx * u + nx * off, py = A[1] + dy * u + ny * off;
          if (k === 0 && i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
      } else ctx.quadraticCurveTo((A[0] + B[0]) / 2 + nx * 30, (A[1] + B[1]) / 2 + ny * 30, B[0], B[1]);
    }
    gline(ctx, mixC(col, WHITE, 0.3), 4.5, 0.75);
    ctx.restore();
  }
  function heme(ctx, x, y, sc, ox, a, flash) {
    if (a <= 0.004) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc);
    var col = mixC([140, 24, 50], [255, 60, 72], ox);
    glowDot(ctx, 0, 0, 70, col, 0.5 + 0.5 * ox + flash);
    ctx.beginPath(); ctx.ellipse(0, 0, 40, 26, 0, 0, TAU);
    var g = ctx.createRadialGradient(-8, -6, 2, 0, 0, 42); g.addColorStop(0, rgba(mixC(col, WHITE, 0.35), 1)); g.addColorStop(1, rgba(mixC(col, [0, 0, 0], 0.3), 1));
    ctx.fillStyle = g; ctx.fill(); gline(ctx, [255, 120, 130], 2, 1);
    ctx.save(); ctx.scale(1, 0.65); ctx.rotate(Math.PI / 4); rrect(ctx, -20, -20, 40, 40, 8); ctx.restore();
    ctx.strokeStyle = 'rgba(255,210,200,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
    ball(ctx, 0, 0, 9, [255, 170, 80]);
    if (flash > 0) { ctx.beginPath(); ctx.arc(0, 0, 30 + 60 * (1 - flash), 0, TAU); gline(ctx, WHITE, 3, flash); }
    ctx.restore();
  }
  /**
   * hemoglobin(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1050×760
   * α₂β₂ tetramer: 2 α subunits (teal) + 2 β subunits (lavender) as blobby globin folds with helical ribbons; each holds
   * a red heme disc with Fe at its centre. Inset magnifies one heme (ヘム / Fe). Four O₂ dock one by one ("click"
   * flashes; the heme turns bright red). Counter ○○○○ fills; final caption 「1分子で 最大4個の O₂」.
   * p stages:
   *   0.00–0.06 panel power-on
   *   0.06–0.28 subunits fly in and assemble; legend α鎖×2 (0.20) / β鎖×2 (0.25)
   *   0.30–0.42 hemes light up (0.30), inset opens (0.34) with labels ヘム / Fe (0.38)
   *   0.44–0.84 O₂ binding: CLICK beats at p = 0.52, 0.62, 0.72, 0.82 (each O₂ flies in during the 0.08 before)
   *   0.86–0.94 caption 1分子で最大4個のO₂
   *   0.94–1.00 hold
   */
  D.hemoglobin = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1050, PH = 760;
    var ca = frame(ctx, o, PW, PH, 'ヘモグロビン（α₂β₂）', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var CX = -190, CY = -10, COLA = [90, 225, 205], COLB = [190, 155, 255];
    var bound = [], flash = [], i, k;
    for (k = 0; k < 4; k++) { var ci = HB_ORDER.indexOf(k); bound.push(seg(p, HB_CLICK[ci] - 0.08, HB_CLICK[ci])); flash.push(p >= HB_CLICK[ci] ? Math.max(0, 1 - (p - HB_CLICK[ci]) / 0.05) : 0); }
    glowDot(ctx, CX, CY, 330, [120, 200, 255], 0.18);
    // subunits
    for (i = 0; i < 4; i++) {
      var sbt = HB_SUB[i], as = eout(seg(p, 0.06 + i * 0.04, 0.2 + i * 0.04));
      if (as <= 0) continue;
      var fly = 1 - as, sx = CX + sbt[0] * (1 + 0.9 * fly), sy = CY + sbt[1] * (1 + 0.9 * fly);
      globin(ctx, sx, sy, 118, sbt[2] ? COLB : COLA, sbt[3], t, smooth(0, 0.4, as));
      txt(ctx, sbt[2] ? 'β' : 'α', sx + (sbt[0] < 0 ? -84 : 84), sy + (sbt[1] < 0 ? 44 : -44), { size: 44, align: 'center', color: mixC(sbt[2] ? COLB : COLA, WHITE, 0.6), glow: sbt[2] ? COLB : COLA, a: seg(p, 0.2 + i * 0.01, 0.28), type: false });
    }
    // hemes
    var hA = seg(p, 0.3, 0.36);
    var hpos = [];
    for (i = 0; i < 4; i++) {
      var sb = HB_SUB[i], L = Math.hypot(sb[0], sb[1]), dx = sb[0] / L, dy = sb[1] / L;
      var hx = CX + sb[0] + dx * 18, hy = CY + sb[1] + dy * 18;
      hpos.push([hx, hy, dx, dy]);
      heme(ctx, hx, hy, 0.85, bound[i] >= 1 ? 1 : 0, hA, flash[i]);
    }
    // inset (mirrors heme 3 = α2, the first to bind)
    var IX = 300, IY = 90, IR = 120, iA = seg(p, 0.34, 0.42);
    if (iA > 0) {
      var h3 = hpos[3];
      ctx.save(); ctx.globalAlpha *= eio(iA);
      ctx.beginPath(); ctx.moveTo(h3[0] + 34, h3[1] - 10); ctx.lineTo(IX - IR * 0.98, IY - 22); ctx.moveTo(h3[0] + 30, h3[1] + 16); ctx.lineTo(IX - IR * 0.9, IY + 50);
      gline(ctx, C.cy, 1.5, 0.5);
      ctx.beginPath(); ctx.arc(IX, IY, IR, 0, TAU); ctx.fillStyle = 'rgba(4,20,34,0.85)'; ctx.fill(); gline(ctx, C.cy, 3, 1);
      heme(ctx, IX, IY + 14, 1.9, bound[3] >= 1 ? 1 : 0, 1, flash[3]);
      // O₂ on Fe in the inset
      var b3 = bound[3];
      if (b3 > 0) o2Glyph(ctx, lerp(IX + 150, IX, eio(b3)), lerp(IY - 150, IY - 52, eio(b3)), 40, smooth(0, 0.3, b3), t);
      ctx.restore();
      txt(ctx, 'ヘム', IX - IR - 10, IY + IR + 20, { size: 36, color: [255, 190, 190], glow: C.hot, a: seg(p, 0.37, 0.43) });
      arrowPts(ctx, [[IX + 6, IY + 22], [IX + 70, IY + IR + 6], [IX + 92, IY + IR + 6]], seg(p, 0.39, 0.44), C.warm, 2, { head: false, dot: true });
      txt(ctx, 'Fe（鉄）', IX + 98, IY + IR + 6, { size: 34, color: [255, 215, 160], glow: C.warm, a: seg(p, 0.4, 0.46) });
    }
    // O₂ flights to the tetramer
    for (i = 0; i < 4; i++) {
      var bA = bound[i];
      if (bA <= 0) continue;
      var hp = hpos[i], e = eio(bA);
      var ox = hp[0] + hp[2] * 52, oy = hp[1] + hp[3] * 52;
      o2Glyph(ctx, lerp(hp[0] + hp[2] * 190, ox, e), lerp(hp[1] + hp[3] * 150 - 40, oy, e), 44, smooth(0, 0.25, bA), t);
    }
    // legend
    var lx = 140;
    var la1 = seg(p, 0.2, 0.27), la2 = seg(p, 0.25, 0.32);
    if (la1 > 0) { ctx.save(); ctx.globalAlpha *= smooth(0, 0.4, la1); ball(ctx, lx, -230, 16, COLA); ctx.restore(); }
    txt(ctx, 'α鎖 ×2', lx + 32, -230, { size: 38, color: mixC(COLA, WHITE, 0.55), glow: COLA, a: la1 });
    if (la2 > 0) { ctx.save(); ctx.globalAlpha *= smooth(0, 0.4, la2); ball(ctx, lx, -170, 16, COLB); ctx.restore(); }
    txt(ctx, 'β鎖 ×2', lx + 32, -170, { size: 38, color: mixC(COLB, WHITE, 0.55), glow: COLB, a: la2 });
    txt(ctx, '（グロビン）', lx + 200, -200, { size: 26, color: [190, 230, 245], a: seg(p, 0.27, 0.33) });
    // counter
    var cA = seg(p, 0.44, 0.5);
    if (cA > 0) {
      var nb = 0; for (i = 0; i < 4; i++) if (bound[i] >= 1) nb++;
      var cy = 282, w0 = txt(ctx, '結合した O₂：', -440, cy, { size: 34, a: cA });
      for (i = 0; i < 4; i++) {
        var cx = -440 + w0 + 30 + i * 52;
        ctx.save(); ctx.globalAlpha *= cA; ctx.beginPath(); ctx.arc(cx, cy, 17, 0, TAU); gline(ctx, C.cy, 2, 0.8);
        if (i < nb) { ctx.beginPath(); ctx.arc(cx, cy, 13, 0, TAU); ctx.fillStyle = 'rgba(150,235,255,0.95)'; ctx.fill(); glowDot(ctx, cx, cy, 34, C.cy, 0.8); }
        ctx.restore();
      }
      txt(ctx, nb + ' / 4', -440 + w0 + 250, cy, { size: 36, a: cA, type: false, color: nb === 4 ? [255, 255, 255] : [200, 235, 250] });
    }
    txt(ctx, '1分子で 最大4個の O₂ を運ぶ', -440, 336, { size: 36, color: [255, 255, 255], glow: C.cy, a: seg(p, 0.86, 0.94) });
    ctx.restore();
  };

  /* ============================================================ 7. LUNG ↔ TISSUE LOOP */
  var ALV = [[-470, -10, 62], [-520, 60, 54], [-430, 70, 50], [-540, -50, 44], [-400, 10, 40], [-480, 120, 40]];
  var TIS = [[440, -40, 58], [520, 40, 54], [430, 90, 50]];
  /**
   * lungTissueLoop(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1200×740
   * Schematic circulation loop: 肺（肺胞） on the left, 組織 on the right. Upper path = 動脈血（O₂が多い, red, flows →),
   * lower path = 静脈血（CO₂が多い, blue-violet, flows ←). A red cell icon goes round once: loads O₂ in the alveolus
   * (O₂ comes in through the airway), carries it right, releases O₂ to tissue cells and picks up CO₂, returns, and
   * releases CO₂ into the alveolus → airway (呼気へ). RBC turns darker (deoxy) when O₂ is gone.
   * p stages:
   *   0.00–0.06 panel power-on
   *   0.06–0.20 loop + organs draw (labels 肺（肺胞）/ 組織 ≈0.12); inhaled O₂ enters the airway 0.10–0.20
   *   0.20–0.30 O₂ loading at the lung (label O₂を受け取る 0.22)
   *   0.30–0.50 travel along the arterial (upper) path (label 動脈血 0.30)
   *   0.50–0.62 at tissue: O₂ released 0.50–0.58 (label O₂を渡す), CO₂ picked up 0.55–0.63 (label CO₂を受け取る)
   *   0.62–0.82 travel back along the venous (lower) path (label 静脈血 0.62)
   *   0.82–0.95 CO₂ released at the lung → out through the airway (label CO₂を手放す（呼気へ）0.84)
   *   0.95–1.00 hold
   */
  D.lungTissueLoop = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1200, PH = 740;
    var ca = frame(ctx, o, PW, PH, '肺と組織：O₂ と CO₂ の受け渡し', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var EX = 0, EY = 20, RX = 420, RY = 220, i;
    function ep(ph) { return [EX + Math.cos(ph) * RX, EY + Math.sin(ph) * RY]; }
    var dA = eio(seg(p, 0.06, 0.2)), oA = seg(p, 0.08, 0.16);
    // ---- airway + alveoli
    if (oA > 0) {
      ctx.save(); ctx.globalAlpha *= oA;
      ctx.beginPath(); ctx.moveTo(-470, -40); ctx.quadraticCurveTo(-500, -140, -560, -230); gline(ctx, [255, 200, 220], 16, 0.25);
      ctx.beginPath(); ctx.moveTo(-470, -40); ctx.quadraticCurveTo(-500, -140, -560, -230); gline(ctx, [255, 200, 220], 3, 0.8);
      for (i = 0; i < ALV.length; i++) {
        var a = ALV[i];
        ctx.beginPath(); ctx.arc(a[0], a[1], a[2], 0, TAU);
        var g = ctx.createRadialGradient(a[0] - a[2] * 0.3, a[1] - a[2] * 0.3, 4, a[0], a[1], a[2]);
        g.addColorStop(0, 'rgba(255,225,235,0.32)'); g.addColorStop(1, 'rgba(255,140,170,0.18)');
        ctx.fillStyle = g; ctx.fill(); gline(ctx, [255, 190, 210], 2.5, 0.85);
      }
      ctx.restore();
      for (i = 0; i < TIS.length; i++) {
        var tc = TIS[i], glow = seg(p, 0.53 + i * 0.02, 0.6 + i * 0.02);
        if (W().drawTissueCell) W().drawTissueCell(ctx, { x: tc[0], y: tc[1], r: tc[2], t: t, glow: glow, seed: 3 + i, alpha: oA });
        else { ctx.beginPath(); ctx.arc(tc[0], tc[1], tc[2], 0, TAU); ctx.fillStyle = 'rgba(255,190,190,0.6)'; ctx.fill(); }
      }
    }
    // ---- loop
    if (dA > 0) {
      var top = [], bot = [];
      for (i = 0; i <= 60; i++) { top.push(ep(Math.PI + Math.PI * (i / 60))); bot.push(ep(TAU + Math.PI * (i / 60))); }
      arrowPts(ctx, top, dA, [255, 90, 105], 7, { head: false });
      arrowPts(ctx, bot, dA, [140, 120, 255], 7, { head: false });
      if (dA >= 1) {
        arrowPts(ctx, top, 1, [255, 220, 220], 2.5, { head: false, dash: [6, 26], dashOff: -t * 80 });
        arrowPts(ctx, bot, 1, [220, 215, 255], 2.5, { head: false, dash: [6, 26], dashOff: -t * 80 });
        var m1 = ep(Math.PI * 1.5), m2 = ep(Math.PI * 2.5);
        arrowPts(ctx, [[m1[0] - 30, m1[1]], [m1[0] + 10, m1[1]]], 1, [255, 120, 130], 6, { headSize: 34 });
        arrowPts(ctx, [[m2[0] + 30, m2[1]], [m2[0] - 10, m2[1]]], 1, [150, 130, 255], 6, { headSize: 34 });
      }
      txt(ctx, '動脈血（O₂が多い）', 0, EY - RY - 72, { size: 34, align: 'center', color: [255, 200, 205], glow: [255, 90, 105], a: seg(p, 0.3, 0.38) });
      txt(ctx, '静脈血（CO₂が多い）', 0, EY + RY + 70, { size: 34, align: 'center', color: [215, 205, 255], glow: [140, 120, 255], a: seg(p, 0.62, 0.7) });
    }
    txt(ctx, '肺（肺胞）', -470, 205, { size: 38, align: 'center', color: [255, 215, 225], glow: [255, 150, 180], a: seg(p, 0.1, 0.17) });
    txt(ctx, '組織', 470, 205, { size: 38, align: 'center', color: [255, 225, 210], glow: C.warm, a: seg(p, 0.12, 0.19) });
    txt(ctx, 'O₂を受け取る', -470, 250, { size: 28, align: 'center', color: [190, 240, 255], a: seg(p, 0.22, 0.28) * (1 - seg(p, 0.8, 0.84)) });
    txt(ctx, 'CO₂を手放す（呼気へ）', -470, 250, { size: 28, align: 'center', color: [255, 210, 170], a: seg(p, 0.84, 0.9) });
    txt(ctx, 'O₂を渡す', 470, 250, { size: 28, align: 'center', color: [190, 240, 255], a: seg(p, 0.5, 0.56) });
    txt(ctx, 'CO₂を受け取る', 470, 288, { size: 28, align: 'center', color: [255, 210, 170], a: seg(p, 0.56, 0.62) });
    txt(ctx, '空気', -560, -262, { size: 26, align: 'center', color: [220, 235, 245], a: oA });
    // ---- inhaled O₂ down the airway
    for (i = 0; i < 3; i++) {
      var ia = seg(p, 0.1 + i * 0.025, 0.2 + i * 0.025);
      if (ia <= 0 || ia >= 1) continue;
      var pp = qpt(-560, -230, -500, -140, ALV[i][0], ALV[i][1], eio(ia));
      o2Glyph(ctx, pp[0], pp[1], 26, smooth(0, 0.2, ia), t);
    }
    // ---- RBC position
    var ph;
    if (p < 0.3) ph = Math.PI;
    else if (p < 0.5) ph = Math.PI + Math.PI * eio(seg(p, 0.3, 0.5));
    else if (p < 0.62) ph = TAU;
    else if (p < 0.82) ph = TAU + Math.PI * eio(seg(p, 0.62, 0.82));
    else ph = 3 * Math.PI;
    var R0 = ep(ph), rA = seg(p, 0.14, 0.2);
    var ox = seg(p, 0.2, 0.3) * (1 - seg(p, 0.5, 0.58));
    var co = seg(p, 0.56, 0.63) * (1 - seg(p, 0.83, 0.9));
    // O₂ loading
    for (i = 0; i < 3; i++) {
      var la = seg(p, 0.2 + i * 0.025, 0.27 + i * 0.025);
      if (la > 0 && la < 1) { var q = qpt(ALV[i][0], ALV[i][1], (ALV[i][0] + R0[0]) / 2, ALV[i][1] - 60, R0[0], R0[1], eio(la)); o2Glyph(ctx, q[0], q[1], 26, 1, t); }
    }
    // O₂ release to tissue
    for (i = 0; i < 3; i++) {
      var ra = seg(p, 0.5 + i * 0.02, 0.57 + i * 0.02);
      if (ra > 0 && ra < 1) { var q2 = qpt(R0[0], R0[1], (R0[0] + TIS[i][0]) / 2, TIS[i][1] - 70, TIS[i][0], TIS[i][1], eio(ra)); o2Glyph(ctx, q2[0], q2[1], 26, 1 - smooth(0.8, 1, ra), t); }
    }
    // CO₂ pickup
    for (i = 0; i < 2; i++) {
      var pa = seg(p, 0.55 + i * 0.025, 0.62 + i * 0.025);
      if (pa > 0 && pa < 1) { var q3 = qpt(TIS[i + 1][0], TIS[i + 1][1], (R0[0] + TIS[i + 1][0]) / 2, TIS[i + 1][1] + 60, R0[0], R0[1], eio(pa)); co2Glyph(ctx, q3[0], q3[1], 30, 1, t); }
    }
    // CO₂ release at lung → airway
    for (i = 0; i < 2; i++) {
      var xa = seg(p, 0.83 + i * 0.03, 0.95 + i * 0.02);
      if (xa > 0 && xa < 1) {
        var q4 = xa < 0.45 ? qpt(R0[0], R0[1], -440, -10, -470, -40, eio(xa / 0.45)) : qpt(-470, -40, -500, -140, -560, -250, eio((xa - 0.45) / 0.55));
        co2Glyph(ctx, q4[0] + i * 14, q4[1], 30, 1 - smooth(0.85, 1, xa), t);
      }
    }
    // RBC
    if (rA > 0) {
      var dir = ph < TAU ? 1 : -1;
      glowDot(ctx, R0[0], R0[1], 100, ox > 0.5 ? [255, 90, 100] : [150, 120, 255], 0.5 * rA);
      rbc(ctx, { x: R0[0], y: R0[1], r: 48, tiltX: 0.85, rot: ph * 0.6 * dir, alpha: rA, fog: (1 - ox) * 0.5, fogColor: '#3c2a78' });
      for (i = 0; i < 2; i++) {
        var an = t * 2.2 + i * Math.PI;
        if (ox > 0.02) o2Glyph(ctx, R0[0] + Math.cos(an) * 52, R0[1] + Math.sin(an) * 30 - 6, 20, ox * rA, t);
        if (co > 0.02 && i === 0) co2Glyph(ctx, R0[0] + Math.cos(an + 1.6) * 52, R0[1] + Math.sin(an + 1.6) * 30, 22, co * rA, t);
      }
    }
    ctx.restore();
  };

  /* ============================================================ 8. CO₂ TRANSPORT */
  function molCO2(ctx, x, y, a, label) {
    if (a <= 0.004) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(1.45, 1.45); x = 0; y = 0;
    glowDot(ctx, x, y, 70, [255, 170, 90], 0.45);
    ball(ctx, x - 27, y, 15, [255, 80, 80]); ball(ctx, x + 27, y, 15, [255, 80, 80]); ball(ctx, x, y, 14, [120, 120, 130]);
    if (label !== false) txt(ctx, 'CO₂', x, y + 38, { size: 30, align: 'center', color: [255, 220, 190], glow: C.warm, type: false });
    ctx.restore();
  }
  function molH2O(ctx, x, y, a) {
    if (a <= 0.004) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(1.45, 1.45); x = 0; y = 0;
    glowDot(ctx, x, y, 60, C.cy, 0.4);
    ball(ctx, x - 20, y + 14, 10, [240, 245, 255]); ball(ctx, x + 20, y + 14, 10, [240, 245, 255]); ball(ctx, x, y, 15, [255, 80, 80]);
    txt(ctx, 'H₂O', x, y + 46, { size: 30, align: 'center', color: [200, 240, 255], type: false });
    ctx.restore();
  }
  function pathAt(pts, s) { // polyline position at fraction s
    var L = [0], i; for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var tg = L[L.length - 1] * clamp(s, 0, 1);
    for (i = 1; i < pts.length; i++) if (L[i] >= tg) { var f = (tg - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; }
    return pts[pts.length - 1];
  }
  /**
   * co2Transport(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1200×760
   * Inside a red cell (left, reddish) next to plasma (right, yellowish), membrane vertical with バンド3.
   * CO₂ (from tissue, via plasma) diffuses in → meets H₂O at 炭酸脱水酵素 → H₂CO₃ → H⁺ + HCO₃⁻; H⁺ is buffered by Hb;
   * HCO₃⁻ leaves through band 3 into plasma while Cl⁻ comes in (「Cl⁻と交換」). Equation builds at the top.
   * p stages:
   *   0.00–0.06 panel power-on (membrane + compartments)
   *   0.07–0.22 CO₂ diffuses in from the plasma side (label 組織からのCO₂); H₂O approaches 0.10–0.22
   *   0.18–0.32 炭酸脱水酵素 label + enzyme glow; REACTION flash at p = 0.30
   *   0.30–0.34 H₂CO₃ (transient) ; 0.34 split into H⁺ + HCO₃⁻
   *   equation terms: CO₂ 0.10, ＋H₂O 0.16, → (炭酸脱水酵素) 0.24, H₂CO₃ 0.30, → 0.33, H⁺ 0.35, ＋HCO₃⁻ 0.38
   *   0.34–0.46 H⁺ → Hb (label H⁺はヘモグロビンが受けとめる 0.42)
   *   0.34–0.56 HCO₃⁻ travels to band 3 (label バンド3 0.44)
   *   0.56–0.64 EXCHANGE through band 3: HCO₃⁻ out / Cl⁻ in (label Cl⁻と交換 0.60)
   *   0.64–0.78 HCO₃⁻ drifts into plasma (label 血漿で運ばれる 0.72); Cl⁻ into the cell
   *   0.78–1.00 hold (band 3 pulses)
   */
  D.co2Transport = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1200, PH = 760, hw = PW / 2, hh = PH / 2;
    var ca = frame(ctx, o, PW, PH, '二酸化炭素の運搬', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var MX = 230, MT = -200, MB = hh - 20, i;
    function mx(y) { var u = (y - 70) / 300; return MX + 16 * u * u; }
    // compartments
    ctx.save();
    var gL = ctx.createLinearGradient(-hw, 0, MX, 0); gL.addColorStop(0, 'rgba(200,30,50,0.10)'); gL.addColorStop(1, 'rgba(220,40,60,0.26)');
    ctx.fillStyle = gL; ctx.fillRect(-hw + 10, MT, MX - (-hw + 10), MB - MT);
    var gR = ctx.createLinearGradient(MX, 0, hw, 0); gR.addColorStop(0, 'rgba(255,210,110,0.18)'); gR.addColorStop(1, 'rgba(255,210,110,0.06)');
    ctx.fillStyle = gR; ctx.fillRect(MX, MT, hw - 10 - MX, MB - MT);
    // faint Hb background
    var R = rng(808);
    for (i = 0; i < 26; i++) { var bx = -hw + 40 + R() * (MX - (-hw + 40) - 60), by = MT + 20 + R() * (MB - MT - 40); ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fillStyle = 'rgba(255,90,100,0.18)'; ctx.fill(); }
    ctx.restore();
    txt(ctx, '赤血球の中', -hw + 40, MT + 30, { size: 32, color: [255, 200, 205], glow: C.hot, a: seg(p, 0.04, 0.1) });
    txt(ctx, '血漿', hw - 40, MT + 30, { size: 32, align: 'right', color: [255, 236, 170], glow: C.yel, a: seg(p, 0.04, 0.1) });
    // membrane
    var BY3 = 120;
    ctx.beginPath();
    for (var y = MT; y <= MB; y += 18) { if (Math.abs(y - BY3) < 64) continue; ctx.moveTo(mx(y) - 14, y); ctx.lineTo(mx(y) - 4, y); ctx.moveTo(mx(y) + 4, y); ctx.lineTo(mx(y) + 14, y); }
    ctx.strokeStyle = 'rgba(255,220,170,0.4)'; ctx.lineWidth = 2; ctx.stroke();
    for (y = MT; y <= MB; y += 18) { if (Math.abs(y - BY3) < 64) continue; ball(ctx, mx(y) - 20, y, 7, [255, 200, 130]); ball(ctx, mx(y) + 20, y, 7, [255, 200, 130]); }
    txt(ctx, '細胞膜', mx(MB) + 8, MB - 30, { size: 24, color: [255, 225, 180], a: seg(p, 0.06, 0.12) });
    // band 3
    var bpx = mx(BY3), pulse = 0.8 + 0.2 * Math.sin(t * 4);
    ctx.save(); rrect(ctx, bpx - 34, BY3 - 60, 68, 120, 24);
    var b3g = ctx.createLinearGradient(bpx - 34, 0, bpx + 34, 0); b3g.addColorStop(0, 'rgba(120,90,230,0.95)'); b3g.addColorStop(0.5, 'rgba(190,160,255,0.95)'); b3g.addColorStop(1, 'rgba(110,80,210,0.95)');
    ctx.fillStyle = b3g; ctx.fill(); gline(ctx, C.violet, 2.5, pulse);
    ctx.beginPath(); ctx.moveTo(bpx - 36, BY3); ctx.lineTo(bpx + 36, BY3); ctx.strokeStyle = 'rgba(30,10,60,0.8)'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
    txt(ctx, 'バンド3', bpx - 46, BY3 + 86, { size: 36, align: 'right', color: [220, 205, 255], glow: C.violet, a: seg(p, 0.44, 0.52) });
    // enzyme
    var EXx = -170, EYy = -10, eA = seg(p, 0.06, 0.14), act = smooth(0.2, 0.28, p) * (1 - smooth(0.34, 0.42, p));
    if (eA > 0) {
      ctx.save(); ctx.globalAlpha *= eA;
      glowDot(ctx, EXx, EYy, 180, [120, 240, 200], 0.25 + 0.6 * act * (0.7 + 0.3 * Math.sin(t * 14)));
      ctx.beginPath(); ctx.arc(EXx, EYy, 96, 0.5, TAU - 0.5); ctx.lineTo(EXx + 34, EYy); ctx.closePath();
      var eg = ctx.createRadialGradient(EXx - 26, EYy - 26, 6, EXx, EYy, 100); eg.addColorStop(0, 'rgba(170,255,220,0.85)'); eg.addColorStop(1, 'rgba(40,150,120,0.75)');
      ctx.fillStyle = eg; ctx.fill(); gline(ctx, [140, 255, 210], 2.5, 1);
      ctx.restore();
      txt(ctx, '炭酸脱水酵素', EXx, EYy + 132, { size: 36, align: 'center', color: [200, 255, 230], glow: [120, 240, 200], a: seg(p, 0.18, 0.26) });
    }
    var site = [EXx + 70, EYy];
    // CO₂
    var cP = [[470, -50], [mx(-80) + 40, -80], [mx(-80) - 50, -70], [site[0] + 20, site[1] - 26]];
    var cS = eio(seg(p, 0.07, 0.22)), react = seg(p, 0.27, 0.31);
    var cpos = pathAt(cP, cS);
    molCO2(ctx, cpos[0], cpos[1], smooth(0.06, 0.09, p) * (1 - react));
    txt(ctx, '組織からの CO₂', 470, -112, { size: 30, align: 'center', color: [255, 215, 180], a: seg(p, 0.08, 0.14) * (1 - seg(p, 0.4, 0.46)) });
    arrowPts(ctx, cP, seg(p, 0.07, 0.22), [255, 170, 90], 2, { alpha: 0.35 * (1 - seg(p, 0.4, 0.46)), dash: [6, 10] });
    // H₂O
    var wpos = pathAt([[-480, 110], [site[0] - 16, site[1] + 30]], eio(seg(p, 0.1, 0.22)));
    molH2O(ctx, wpos[0], wpos[1], smooth(0.08, 0.12, p) * (1 - react));
    // reaction flash + H₂CO₃
    var fl = p >= 0.3 ? Math.max(0, 1 - (p - 0.3) / 0.04) : 0;
    if (fl > 0) { glowDot(ctx, site[0], site[1], 160, WHITE, fl); ctx.beginPath(); ctx.arc(site[0], site[1], 30 + 110 * (1 - fl), 0, TAU); gline(ctx, WHITE, 3, fl); }
    var hA = seg(p, 0.29, 0.31) * (1 - seg(p, 0.33, 0.35));
    token(ctx, 'H₂CO₃', site[0] + 30, site[1], [255, 230, 160], hA, 38);
    // H⁺ → Hb
    var HBX = -420, HBY = 215;
    var hbA = seg(p, 0.06, 0.14);
    if (hbA > 0) {
      ctx.save(); ctx.globalAlpha *= hbA;
      blobPath(ctx, HBX, HBY, 60, 77, 0.08, t * 0.5); ctx.fillStyle = 'rgba(220,50,70,0.75)'; ctx.fill(); gline(ctx, C.hot, 2, 0.9);
      txt(ctx, 'Hb', HBX, HBY, { size: 38, align: 'center', type: false, color: WHITE });
      ctx.restore();
    }
    var hs = eio(seg(p, 0.34, 0.46));
    if (p >= 0.34) {
      var hp = qpt(site[0], site[1], -300, 60, HBX + 62, HBY - 50, hs);
      token(ctx, 'H⁺', hp[0], hp[1], [255, 150, 200], 1, 36);
    }
    txt(ctx, 'H⁺はヘモグロビンが受けとめる', HBX - 140, HBY + 100, { size: 28, color: [255, 215, 230], a: seg(p, 0.42, 0.5) });
    // HCO₃⁻
    var hcP = [[site[0], site[1]], [40, 90], [bpx - 90, BY3 + 30], [bpx - 40, BY3 + 30]];
    var hcOut = [[bpx - 40, BY3 + 30], [bpx + 60, BY3 + 30]];
    var hcPl = [[bpx + 60, BY3 + 30], [400, 190], [450, 200]];
    var hpos;
    if (p < 0.56) hpos = pathAt(hcP, eio(seg(p, 0.34, 0.56)));
    else if (p < 0.64) hpos = pathAt(hcOut, eio(seg(p, 0.56, 0.64)));
    else hpos = pathAt(hcPl, eio(seg(p, 0.64, 0.78)));
    if (p >= 0.34) token(ctx, 'HCO₃⁻', hpos[0], hpos[1], [120, 230, 255], 1, 38);
    txt(ctx, '血漿で運ばれる', 450, 262, { size: 30, align: 'center', color: [255, 236, 190], a: seg(p, 0.72, 0.8) });
    // Cl⁻
    var clP = [[470, 40], [bpx + 80, BY3 - 30], [bpx + 50, BY3 - 30]], clIn = [[bpx + 50, BY3 - 30], [bpx - 50, BY3 - 30]], clC = [[bpx - 50, BY3 - 30], [60, 200], [-20, 250]];
    var cl;
    if (p < 0.56) cl = pathAt(clP, eio(seg(p, 0.46, 0.56)));
    else if (p < 0.64) cl = pathAt(clIn, eio(seg(p, 0.56, 0.64)));
    else cl = pathAt(clC, eio(seg(p, 0.64, 0.78)));
    token(ctx, 'Cl⁻', cl[0], cl[1], [150, 255, 160], seg(p, 0.44, 0.48), 34);
    txt(ctx, 'Cl⁻と交換', bpx + 66, BY3 - 92, { size: 32, color: [190, 255, 200], glow: C.green, a: seg(p, 0.6, 0.67) });
    if (p > 0.56) {
      var xa = seg(p, 0.56, 0.6) * (1 - seg(p, 0.7, 0.76));
      arrowPts(ctx, [[bpx - 60, BY3 + 40], [bpx + 60, BY3 + 40]], 1, [120, 230, 255], 2.5, { alpha: xa, headSize: 14 });
      arrowPts(ctx, [[bpx + 60, BY3 - 40], [bpx - 60, BY3 - 40]], 1, [150, 255, 160], 2.5, { alpha: xa, headSize: 14 });
    }
    // ---- equation banner
    var eqA = seg(p, 0.08, 0.12);
    if (eqA > 0) {
      var parts = [['CO₂', [255, 190, 130], 0.10], ['＋', WHITE, 0.15], ['H₂O', [170, 230, 255], 0.16], ['→', WHITE, 0.24], ['H₂CO₃', [255, 230, 160], 0.30], ['→', WHITE, 0.33], ['H⁺', [255, 170, 210], 0.35], ['＋', WHITE, 0.37], ['HCO₃⁻', [140, 235, 255], 0.38]];
      var SZ = 40, gap = 14, tot = 0, ws = [];
      for (i = 0; i < parts.length; i++) { ws.push(textW(ctx, parts[i][0], SZ)); tot += ws[i] + (i ? gap : 0); }
      var ey = -268, x0 = -tot / 2 + 40;
      ctx.save(); ctx.globalAlpha *= eio(eqA);
      rrect(ctx, x0 - 30, ey - 38, tot + 60, 76, 16); ctx.fillStyle = 'rgba(2,18,30,0.85)'; ctx.fill(); gline(ctx, C.cy, 2, 0.8);
      var xx = x0;
      for (i = 0; i < parts.length; i++) {
        txt(ctx, parts[i][0], xx, ey + 2, { size: SZ, color: parts[i][1], glow: parts[i][1], a: seg(p, parts[i][2], parts[i][2] + 0.04), glowAmt: 0.3 });
        if (i === 3) txt(ctx, '炭酸脱水酵素', xx + ws[i] / 2, ey - 52, { size: 24, align: 'center', color: [200, 255, 230], a: seg(p, 0.24, 0.3) });
        xx += ws[i] + gap;
      }
      ctx.restore();
    }
    ctx.restore();
  };

  /* ============================================================ 9. ERYTHROPOIESIS */
  var ERY = [ // R, cytoplasm, nucleus ratio, nucleus colour, chromatin coarseness, labels, appear p
    [82, [70, 100, 215], 0.7, [120, 80, 200], 0, ['前赤芽球'], 0.14],
    [70, [52, 82, 200], 0.62, [88, 50, 160], 1, ['好塩基性', '赤芽球'], 0.24],
    [58, [150, 120, 185], 0.5, [72, 40, 112], 2, ['多染性', '赤芽球'], 0.33],
    [50, [232, 128, 140], 0.36, [48, 18, 60], 3, ['正染性', '赤芽球'], 0.42],
    [47, [238, 104, 112], 0.34, [48, 18, 60], 3, ['脱核'], 0.51],
    [45, [240, 82, 92], 0, null, 0, ['網状赤血球'], 0.66],
    [46, null, 0, null, 0, ['赤血球'], 0.76]
  ];
  function nucleus(ctx, x, y, r, col, coarse, seed, nucleoli) {
    var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, rgba(mixC(col, WHITE, 0.3), 1)); g.addColorStop(1, rgba(mixC(col, [0, 0, 0], 0.25), 1));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = rgba(mixC(col, WHITE, 0.4), 0.8); ctx.stroke();
    var R = rng(seed), n = coarse >= 3 ? 0 : 10 + coarse * 6;
    for (var i = 0; i < n; i++) {
      var a = R() * TAU, rr = Math.sqrt(R()) * r * 0.8;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, (1.5 + coarse * 1.6) * (0.6 + R() * 0.6), 0, TAU);
      ctx.fillStyle = rgba(mixC(col, [0, 0, 0], 0.5), 0.75); ctx.fill();
    }
    if (nucleoli) for (i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(x + (i ? 12 : -14), y + (i ? 10 : -8), r * 0.13, 0, TAU); ctx.fillStyle = 'rgba(200,180,255,0.75)'; ctx.fill(); }
  }
  function eryBody(ctx, x, y, R, col, a, sx, sy) {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sx || 1, sy || 1);
    glowDot(ctx, 0, 0, R * 1.7, col, 0.35);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
    var g = ctx.createRadialGradient(-R * 0.35, -R * 0.35, R * 0.1, 0, 0, R);
    g.addColorStop(0, rgba(mixC(col, WHITE, 0.45), 0.95)); g.addColorStop(1, rgba(col, 0.92));
    ctx.fillStyle = g; ctx.fill(); gline(ctx, mixC(col, WHITE, 0.3), 2, 0.9);
    ctx.restore();
  }
  /**
   * erythropoiesis(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1720×720
   * Bone-marrow row: 前赤芽球 → 好塩基性赤芽球 → 多染性赤芽球 → 正染性赤芽球 → 脱核 (nucleus pops out) → 網状赤血球
   * → 赤血球 (BS.world.drawRBC). Cells shrink, cytoplasm turns blue → red; nucleus condenses then is expelled.
   * EPO signal from a kidney icon: 「エリスロポエチン（腎臓）」 with particles flowing to the first cell.
   * Bottom brackets 骨髄 | 血液中へ; top-right legend bar 青→赤.
   * p stages:
   *   0.00–0.05 panel power-on
   *   0.05–0.14 kidney + EPO arrow and label (beat ≈ 0.06)
   *   cells pop in at p = 0.14 前赤芽球, 0.24 好塩基性, 0.33 多染性, 0.42 正染性, 0.51 脱核 cell,
   *   0.53–0.60 nucleus pushed out — POP at p = 0.60 — nucleus drifts away & fades by 0.72
   *   0.66 網状赤血球, 0.76 赤血球
   *   0.62–0.70 bracket 骨髄 ; 0.70–0.78 bracket 血液中へ (divider)
   *   0.82–0.92 legend 「小さくなり、核が消え、青→赤」
   *   0.92–1.00 hold
   */
  D.erythropoiesis = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1720, PH = 720;
    var ca = frame(ctx, o, PW, PH, '赤血球の誕生（骨髄）', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var CY = 50, i;
    function sx(k) { return -690 + 230 * k; }
    // ---- EPO
    var kA = seg(p, 0.05, 0.1), arA = seg(p, 0.07, 0.14);
    var KX = -560, KY = -205;
    if (kA > 0) {
      ctx.save(); ctx.globalAlpha *= kA; ctx.translate(KX, KY);
      ctx.beginPath(); ctx.moveTo(0, -46); ctx.bezierCurveTo(44, -50, 48, 40, 6, 46); ctx.bezierCurveTo(-30, 50, -40, 20, -18, 6);
      ctx.bezierCurveTo(-8, 0, -8, -8, -20, -14); ctx.bezierCurveTo(-40, -30, -26, -46, 0, -46); ctx.closePath();
      var kg = ctx.createRadialGradient(-6, -14, 4, 0, 0, 52); kg.addColorStop(0, 'rgba(240,140,130,0.95)'); kg.addColorStop(1, 'rgba(150,50,60,0.9)');
      ctx.fillStyle = kg; ctx.fill(); gline(ctx, [255, 160, 150], 2, 1);
      ctx.restore();
      txt(ctx, '腎臓', KX, KY + 76, { size: 28, align: 'center', color: [255, 210, 200], a: kA });
    }
    var ePts = qpts(KX - 30, KY + 40, -700, -170, sx(0) - 10, CY - ERY[0][0] * 1.2 - 16, 24);
    arrowPts(ctx, ePts, eout(arA), [255, 200, 120], 3, { headSize: 22 });
    if (arA >= 1) for (i = 0; i < 4; i++) { var pp = pathAt(ePts, mod(t * 0.45 + i / 4, 1)); glowDot(ctx, pp[0], pp[1], 16, [255, 210, 120], 0.9); }
    txt(ctx, 'エリスロポエチン（腎臓）', KX + 70, KY - 12, { size: 36, color: [255, 225, 170], glow: [255, 180, 90], a: seg(p, 0.06, 0.14) });
    txt(ctx, '＝ 赤芽球を増やす合図', KX + 72, KY + 32, { size: 26, color: [235, 240, 250], a: seg(p, 0.1, 0.17) });
    // ---- arrows between cells
    for (i = 1; i < ERY.length; i++) {
      var aa = seg(p, ERY[i][6] - 0.03, ERY[i][6] + 0.03);
      var mxp = (sx(i - 1) + sx(i)) / 2 + (i === 1 ? 6 : 0);
      arrowPts(ctx, [[mxp - 22, CY], [mxp + 18, CY]], eout(aa), C.cy, 3, { headSize: 18 });
    }
    // ---- cells
    for (i = 0; i < ERY.length; i++) {
      var E = ERY[i], ap = seg(p, E[6], E[6] + 0.06);
      if (ap <= 0) continue;
      var sc = eback(ap) * 1.2, x = sx(i), Rr = E[0] * sc;
      if (i === 6) {
        glowDot(ctx, x, CY, 90, [255, 80, 90], 0.4 * ap);
        rbc(ctx, { x: x, y: CY, r: E[0] * 1.05 * sc, tiltX: 0.35, rot: 0.3 + t * 0.2, alpha: smooth(0, 0.3, ap) });
      } else if (i === 4) {
        // enucleation
        var ex = seg(p, 0.53, 0.6), after = seg(p, 0.6, 0.72);
        var dirx = 0.55, diry = 0.84, nd = (lerp(E[0] * 0.2, E[0] * 0.95, eio(ex)) + after * 60) * 1.2;
        var nx = x + dirx * nd, ny = CY + diry * nd;
        var stretch = ex < 1 ? 1 + 0.12 * eio(ex) : 1 + 0.12 * Math.exp(-after * 8) * Math.cos(after * 20);
        eryBody(ctx, x, CY, Rr, E[1], smooth(0, 0.3, ap), 1 / Math.sqrt(stretch), stretch);
        var nA = 1 - smooth(0.4, 1, after);
        if (nA > 0) {
          ctx.save(); ctx.globalAlpha *= smooth(0, 0.3, ap) * nA;
          ctx.beginPath(); ctx.arc(nx, ny, E[0] * 0.38 * 1.2 + 5, 0, TAU); gline(ctx, [255, 200, 220], 1.5, 0.7);
          nucleus(ctx, nx, ny, E[0] * 0.34 * sc, E[3], 3, 400 + i, false);
          ctx.restore();
        }
        var pf = p >= 0.6 ? Math.max(0, 1 - (p - 0.6) / 0.05) : 0;
        if (pf > 0) { ctx.beginPath(); ctx.arc(x + dirx * Rr, CY + diry * Rr, 10 + 70 * (1 - pf), 0, TAU); gline(ctx, WHITE, 3, pf); glowDot(ctx, x + dirx * Rr, CY + diry * Rr, 60, WHITE, pf); }
        txt(ctx, '核を外へ出す', x + 64, CY + 128, { size: 24, color: [255, 220, 230], a: seg(p, 0.58, 0.64) * (1 - seg(p, 0.74, 0.8)) });
      } else {
        eryBody(ctx, x, CY, Rr, E[1], smooth(0, 0.3, ap));
        if (E[2] > 0) {
          ctx.save(); ctx.globalAlpha *= smooth(0, 0.3, ap);
          var off = i === 3 ? Rr * 0.22 : 0;
          nucleus(ctx, x + off, CY - off * 0.4, Rr * E[2], E[3], E[4], 400 + i, i === 0);
          ctx.restore();
        }
        if (i === 5) {
          var R = rng(55); ctx.save(); ctx.globalAlpha *= smooth(0, 0.3, ap);
          ctx.beginPath();
          for (var k = 0; k < 6; k++) { var a0 = R() * TAU, r0 = R() * Rr * 0.6; var x1 = x + Math.cos(a0) * r0, y1 = CY + Math.sin(a0) * r0; ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x1 + (R() - 0.5) * 40, y1 + (R() - 0.5) * 40, x1 + (R() - 0.5) * 50, y1 + (R() - 0.5) * 50); }
          ctx.strokeStyle = 'rgba(90,120,255,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.restore();
        }
      }
      // labels
      var lA = seg(p, E[6] + 0.02, E[6] + 0.09);
      for (var li = 0; li < E[5].length; li++) txt(ctx, E[5][li], x, 182 + li * 36, { size: 30, align: 'center', a: lA, color: i >= 5 ? [255, 210, 210] : C.ink, glow: i >= 5 ? C.hot : C.cy });
    }
    // ---- brackets
    var b1 = seg(p, 0.62, 0.7), b2 = seg(p, 0.7, 0.78), BYb = 272, DX = (sx(4) + sx(5)) / 2;
    if (b1 > 0) {
      ctx.beginPath(); ctx.moveTo(sx(0) - 90, BYb - 14); ctx.lineTo(sx(0) - 90, BYb); ctx.lineTo(lerp(sx(0) - 90, DX - 12, eio(b1)), BYb); if (b1 >= 1) ctx.lineTo(DX - 12, BYb - 14);
      gline(ctx, [255, 225, 180], 2.5, 1);
      txt(ctx, '骨髄', (sx(0) - 90 + DX) / 2, BYb + 32, { size: 34, align: 'center', color: [255, 225, 180], glow: C.warm, a: b1 });
    }
    if (b2 > 0) {
      ctx.beginPath(); ctx.moveTo(DX, -90); ctx.lineTo(DX, lerp(-90, BYb + 30, eio(b2))); gline(ctx, C.cy, 2, 0.8, [8, 8]);
      ctx.beginPath(); ctx.moveTo(DX + 12, BYb - 14); ctx.lineTo(DX + 12, BYb); ctx.lineTo(lerp(DX + 12, sx(6) + 90, eio(b2)), BYb); if (b2 >= 1) ctx.lineTo(sx(6) + 90, BYb - 14);
      gline(ctx, [255, 160, 160], 2.5, 1);
      txt(ctx, '血液中へ', (DX + sx(6) + 90) / 2, BYb + 32, { size: 34, align: 'center', color: [255, 200, 200], glow: C.hot, a: b2 });
    }
    // ---- legend bar
    var lg = seg(p, 0.82, 0.92);
    if (lg > 0) {
      var L0 = 120, L1 = 780, LY = -200;
      ctx.save(); ctx.globalAlpha *= smooth(0, 0.3, lg);
      var gb = ctx.createLinearGradient(L0, 0, L1, 0); gb.addColorStop(0, 'rgb(70,100,215)'); gb.addColorStop(0.45, 'rgb(150,120,185)'); gb.addColorStop(1, 'rgb(235,60,75)');
      rrect(ctx, L0, LY - 8, (L1 - L0) * eio(lg), 16, 8); ctx.fillStyle = gb; ctx.fill();
      ctx.restore();
      if (lg > 0.5) arrowPts(ctx, [[L1 - 10, LY], [L1 + 20, LY]], 1, [255, 120, 130], 3, { headSize: 22, alpha: seg(lg, 0.5, 0.8) });
      txt(ctx, '大きい・核あり・青', L0, LY - 38, { size: 26, color: [190, 205, 255], a: lg });
      txt(ctx, '小さい・核なし・赤（ヘモグロビン）', L1 + 20, LY + 40, { size: 26, align: 'right', color: [255, 200, 200], a: seg(lg, 0.3, 1) });
    }
    ctx.restore();
  };

  /* ============================================================ 10a. RBC LIFESPAN */
  /**
   * rbcLifespan(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1100×740
   * A day counter (calendar) runs 0 → 120 日 while the RBC ages (paler, stiffer: label), then 「寿命 約120日」;
   * a spleen macrophage (脾臓のマクロファージ) appears, reaches out with pseudopods and engulfs the cell, which is
   * digested in a phagosome (分解 → 再利用へ).
   * p stages:
   *   0.00–0.06 panel power-on
   *   0.07–0.38 day counter 0 → 120 (RBC fades paler 0.20–0.44)
   *   0.36–0.46 tag 寿命 約120日 (beat ≈ 0.38); aging label 0.32–0.40
   *   0.44–0.54 macrophage appears; label 脾臓のマクロファージ 0.46
   *   0.56–0.72 pseudopods reach out, RBC drawn in 0.62–0.82
   *   0.78–0.88 pseudopods close; phagosome; digestion 0.84–0.97
   *   0.88–0.96 label 分解して再利用へ
   */
  D.rbcLifespan = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1100, PH = 740;
    var ca = frame(ctx, o, PW, PH, '赤血球の寿命', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    // ---- calendar
    var cA = seg(p, 0.06, 0.12), days = Math.round(120 * eio(seg(p, 0.07, 0.38)));
    var KX = -330, KY = -100;
    if (cA > 0) {
      ctx.save(); ctx.globalAlpha *= cA; ctx.translate(KX, KY);
      rrect(ctx, -120, -120, 240, 240, 18); ctx.fillStyle = 'rgba(4,22,36,0.85)'; ctx.fill(); gline(ctx, C.cy, 2.5, 1);
      rrect(ctx, -120, -120, 240, 56, 18); ctx.fillStyle = 'rgba(220,50,70,0.75)'; ctx.fill();
      for (var r = -1; r <= 1; r += 2) { ctx.beginPath(); ctx.moveTo(r * 60, -136); ctx.lineTo(r * 60, -104); gline(ctx, WHITE, 5, 0.9); }
      txt(ctx, '生まれてから', 0, -90, { size: 24, align: 'center', type: false, color: WHITE });
      // flip effect
      var fr = mod(seg(p, 0.07, 0.38) * 40, 1), flip = p < 0.38 && p > 0.07 ? fr : 1;
      ctx.save(); ctx.translate(0, 22); ctx.scale(1, 0.75 + 0.25 * eout(flip));
      var dw = txt(ctx, String(days), 14, 0, { size: 104, align: 'center', type: false, color: WHITE, glow: C.cy });
      ctx.restore();
      txt(ctx, '日', 14 + dw / 2 + 8, 46, { size: 36, type: false });
      ctx.restore();
    }
    tag(ctx, '寿命 約120日', KX, KY + 172, { size: 42, color: C.warm, a: seg(p, 0.36, 0.46) });
    // ---- macrophage
    var MXc = 280, MYc = 40, MR = 185, mA = seg(p, 0.44, 0.54);
    var arms = eio(seg(p, 0.56, 0.7)) * (1 - eio(seg(p, 0.8, 0.9))), dent = eio(seg(p, 0.6, 0.72)) * (1 - eio(seg(p, 0.8, 0.9)));
    var th0 = Math.PI;
    function mPath(sc) {
      ctx.beginPath();
      for (var i = 0; i <= 90; i++) {
        var a = (i / 90) * TAU, d = Math.atan2(Math.sin(a - th0), Math.cos(a - th0));
        var rr = MR * (1 + 0.05 * Math.sin(5 * a + t * 0.8) + 0.04 * Math.sin(3 * a + 1 + t * 0.5));
        rr += arms * (95 * Math.exp(-((d - 0.62) * (d - 0.62)) / (2 * 0.13 * 0.13)) + 95 * Math.exp(-((d + 0.62) * (d + 0.62)) / (2 * 0.13 * 0.13)));
        rr -= dent * 70 * Math.exp(-(d * d) / (2 * 0.3 * 0.3));
        rr *= sc;
        var px = MXc + Math.cos(a) * rr, py = MYc + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    var msc = eback(mA);
    if (mA > 0) {
      ctx.save(); ctx.globalAlpha *= smooth(0, 0.4, mA);
      glowDot(ctx, MXc, MYc, MR * 1.6, [190, 160, 255], 0.3);
      mPath(msc);
      var mg = ctx.createRadialGradient(MXc + 40, MYc - 30, 20, MXc, MYc, MR * 1.2); mg.addColorStop(0, 'rgba(215,200,255,0.55)'); mg.addColorStop(1, 'rgba(120,90,200,0.4)');
      ctx.fillStyle = mg; ctx.fill();
      // nucleus (kidney-shaped) + lysosomes
      ctx.save(); ctx.translate(MXc + 70 * msc, MYc + 20 * msc); ctx.rotate(0.4); ctx.scale(msc, msc);
      ctx.beginPath(); ctx.ellipse(0, 0, 50, 70, 0, 0, TAU); ctx.fillStyle = 'rgba(110,70,180,0.85)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(-46, 0, 18, 26, 0, 0, TAU); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      var R = rng(66);
      for (var gI = 0; gI < 14; gI++) { var ga = R() * TAU, gr = R() * MR * 0.75 * msc; var gx = MXc + Math.cos(ga) * gr, gy = MYc + Math.sin(ga) * gr; if (gx < MXc - 60) continue; ctx.beginPath(); ctx.arc(gx, gy, 6 + R() * 5, 0, TAU); ctx.fillStyle = 'rgba(255,200,120,0.6)'; ctx.fill(); }
      ctx.restore();
    }
    // ---- RBC
    var age = seg(p, 0.2, 0.44);
    var mv = eio(seg(p, 0.62, 0.82)), dig = seg(p, 0.84, 0.97);
    var rx = lerp(-40, MXc - 50, mv), ry = lerp(110, MYc, mv) + (1 - mv) * 10 * Math.sin(t * 1.6);
    var rr = 62 * (1 - 0.45 * dig);
    if (dig < 1) {
      if (mv > 0.8) {
        var ph = seg(p, 0.8, 0.86);
        ctx.beginPath(); ctx.arc(rx, ry, 84 * (1 - 0.3 * dig), 0, TAU); ctx.fillStyle = rgba([255, 200, 140], 0.15 * ph); ctx.fill(); gline(ctx, [255, 210, 160], 2, ph * (1 - dig));
      }
      rbc(ctx, { x: rx, y: ry, r: rr, tiltX: 0.55, rot: 0.4 + t * 0.15, alpha: (1 - dig) * smooth(0.08, 0.14, p), fog: 0.55 * age, fogColor: '#b9a2a0' });
    }
    // aging labels
    txt(ctx, '古くなると', -40, 228, { size: 28, align: 'center', a: seg(p, 0.32, 0.38) * (1 - seg(p, 0.56, 0.62)) });
    txt(ctx, '膜が硬く、変形しにくくなる', -40, 266, { size: 28, align: 'center', a: seg(p, 0.34, 0.42) * (1 - seg(p, 0.56, 0.62)) });
    if (mA > 0) {
      mPath(msc); gline(ctx, [210, 190, 255], 3, smooth(0, 0.4, mA));
    }
    txt(ctx, '脾臓のマクロファージ', MXc, MYc - MR - 46, { size: 38, align: 'center', color: [225, 210, 255], glow: C.violet, a: seg(p, 0.46, 0.56) });
    tag(ctx, '分解して再利用へ', MXc, MYc + MR + 60, { size: 32, color: C.green, a: seg(p, 0.88, 0.96) });
    ctx.restore();
  };

  /* ============================================================ 10b. HEME RECYCLE */
  function icon(ctx, kind, x, y, a, t) {
    if (a <= 0.004) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fillStyle = 'rgba(4,20,34,0.95)'; ctx.fill(); gline(ctx, C.cy, 2, 0.9);
    if (kind === 'hb') { for (var i = 0; i < 4; i++) ball(ctx, (i % 2 ? 8 : -8), (i < 2 ? -8 : 8), 9, i === 0 || i === 3 ? [90, 225, 205] : [190, 155, 255]); }
    else if (kind === 'globin') { ctx.beginPath(); for (var k = 0; k <= 30; k++) { var u = k / 30; ctx.lineTo(-18 + 36 * u, 7 * Math.sin(u * TAU * 3)); } gline(ctx, [90, 225, 205], 3, 1); }
    else if (kind === 'aa') { for (k = 0; k < 4; k++) ball(ctx, -15 + k * 10, (k % 2 ? 5 : -5), 6, [140, 255, 175]); }
    else if (kind === 'heme') { ctx.beginPath(); ctx.ellipse(0, 0, 20, 13, 0, 0, TAU); ctx.fillStyle = '#e83848'; ctx.fill(); ball(ctx, 0, 0, 5, [255, 170, 80]); }
    else if (kind === 'fe') { ball(ctx, 0, 0, 18, [255, 160, 70]); txt(ctx, 'Fe', 0, 1, { size: 18, align: 'center', type: false, outline: false, color: [60, 20, 0], glowAmt: 0 }); }
    else if (kind === 'tf') { ball(ctx, -8, 0, 13, [170, 200, 255]); ball(ctx, 10, 0, 13, [170, 200, 255]); ball(ctx, -8, 0, 4.5, [255, 160, 70]); ball(ctx, 10, 0, 4.5, [255, 160, 70]); }
    else if (kind === 'bone') {
      ctx.save(); ctx.rotate(-0.6); ctx.fillStyle = '#f2ead8';
      ctx.fillRect(-14, -5, 28, 10); [[-15, -6], [-15, 6], [15, -6], [15, 6]].forEach(function (c) { ctx.beginPath(); ctx.arc(c[0], c[1], 6.5, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#d0485a'; ctx.fillRect(-10, -2.5, 20, 5); ctx.restore();
    }
    else if (kind === 'bili') { ball(ctx, 0, 0, 14, [255, 215, 70]); }
    else if (kind === 'liver') {
      ctx.beginPath(); ctx.moveTo(-22, -6); ctx.bezierCurveTo(-18, -18, 14, -18, 22, -10); ctx.bezierCurveTo(20, 0, 6, 14, -6, 14); ctx.bezierCurveTo(-18, 12, -24, 4, -22, -6); ctx.closePath();
      ctx.fillStyle = '#a0463c'; ctx.fill(); ctx.strokeStyle = '#ffb0a0'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    else if (kind === 'bile') { ctx.beginPath(); ctx.moveTo(0, -18); ctx.bezierCurveTo(10, -4, 14, 4, 12, 9); ctx.arc(0, 8, 12, 0, Math.PI); ctx.bezierCurveTo(-14, 4, -10, -4, 0, -18); ctx.fillStyle = '#7fd36a'; ctx.fill(); }
    ctx.restore();
  }
  function node(ctx, x, y, w, label, sub, a, col, ic, t) {
    if (a <= 0.004) return;
    var h = 80, e = eback(seg(a, 0, 0.7));
    ctx.save(); ctx.globalAlpha *= smooth(0, 0.35, a); ctx.translate(x, y); ctx.scale(0.8 + 0.2 * e, 0.8 + 0.2 * e);
    rrect(ctx, -w / 2, -h / 2, w, h, 16); ctx.fillStyle = rgba(mixC(col, [0, 0, 0], 0.82), 0.92); ctx.fill(); gline(ctx, col, 2.5, 1);
    var sz = 34, tw = textW(ctx, label, sz); if (tw > w - 70) sz = (sz * (w - 70)) / tw;
    txt(ctx, label, 18, 1, { size: sz, align: 'center', color: mixC(col, WHITE, 0.6), glow: col, a: seg(a, 0.2, 1) });
    icon(ctx, ic, -w / 2 + 2, 0, 1, t);
    ctx.restore();
    if (sub) txt(ctx, sub, x + 18, y + 68, { size: 26, align: 'center', color: [220, 235, 245], a: seg(a, 0.4, 1) });
  }
  /**
   * hemeRecycle(ctx, {x, y, scale=1, p, t, alpha=1})   natural size 1720×760
   * Flow chart of what happens to hemoglobin in the macrophage:
   *   ヘモグロビン → グロビン → アミノ酸（再利用）
   *               → ヘム → 鉄 Fe → トランスフェリン（血液中で鉄を運ぶ）→ 骨髄（新しい赤血球へ）【再利用】
   *                      → ビリルビン → 肝臓 → 胆汁（腸へ）
   * Arrows draw in, then glowing dots keep flowing along them (t).
   * p stages:
   *   0.00–0.06 panel power-on
   *   0.06–0.14 ヘモグロビン node
   *   0.14–0.26 split → グロビン / ヘム
   *   0.26–0.36 グロビン → アミノ酸（再利用）
   *   0.36–0.46 ヘム → 鉄 Fe            (beat ≈ 0.38 「鉄は回収されて」)
   *   0.46–0.56 → トランスフェリン
   *   0.56–0.66 → 骨髄（新しい赤血球へ）, badge 再利用 at 0.64
   *   0.66–0.76 ヘム → ビリルビン        (beat ≈ 0.68 「ヘムはビリルビンとなり」)
   *   0.76–0.86 → 肝臓
   *   0.86–0.95 → 胆汁
   *   0.95–1.00 hold
   */
  D.hemeRecycle = function (ctx, o) {
    o = o || {}; var p = clamp(o.p == null ? 1 : o.p, 0, 1), t = o.t || 0;
    begin(ctx, o);
    var PW = 1720, PH = 760;
    var ca = frame(ctx, o, PW, PH, 'ヘモグロビンのゆくえ', p, t);
    if (ca <= 0.003) { ctx.restore(); return; }
    ctx.globalAlpha *= ca;
    var CX = [-640, -320, 0, 320, 640], RY = [-190, 20, 230], NW = 250;
    var HB = [CX[0], RY[1]], GL = [CX[1], RY[0]], AA = [CX[2], RY[0]], HM = [CX[1], RY[1]], FE = [CX[2], RY[1]], TF = [CX[3], RY[1]], BM = [CX[4], RY[1]];
    var BI = [CX[2], RY[2]], LV = [CX[3], RY[2]], BL = [CX[4], RY[2]];
    var hx = NW / 2 + 4;
    var edges = [
      [[[HB[0] + hx, HB[1]], [-480, HB[1]], [-480, GL[1]], [GL[0] - hx, GL[1]]], 0.14, 0.24, [90, 225, 205]],
      [[[HB[0] + hx, HB[1]], [HM[0] - hx, HM[1]]], 0.16, 0.26, [255, 110, 120]],
      [[[GL[0] + hx, GL[1]], [AA[0] - hx, AA[1]]], 0.26, 0.33, [140, 255, 175]],
      [[[HM[0] + hx, HM[1]], [FE[0] - hx, FE[1]]], 0.36, 0.43, [255, 170, 80]],
      [[[FE[0] + hx, FE[1]], [TF[0] - hx, TF[1]]], 0.46, 0.53, [255, 170, 80]],
      [[[TF[0] + hx, TF[1]], [BM[0] - hx, BM[1]]], 0.56, 0.63, [255, 170, 80]],
      [[[HM[0], HM[1] + 44], [HM[0], BI[1]], [BI[0] - hx, BI[1]]], 0.66, 0.73, [255, 215, 70]],
      [[[BI[0] + hx, BI[1]], [LV[0] - hx, LV[1]]], 0.76, 0.83, [255, 215, 70]],
      [[[LV[0] + hx, LV[1]], [BL[0] - hx, BL[1]]], 0.86, 0.92, [140, 230, 110]]
    ];
    for (var i = 0; i < edges.length; i++) {
      var E = edges[i], ea = seg(p, E[1], E[2]);
      if (ea <= 0) continue;
      arrowPts(ctx, E[0], eio(ea), E[3], 3.5, { headSize: 22 });
      if (ea >= 1) for (var k = 0; k < 3; k++) { var pp = pathAt(E[0], mod(t * 0.35 + k / 3 + i * 0.17, 1) * 0.92); glowDot(ctx, pp[0], pp[1], 18, E[3], 0.9); }
    }
    node(ctx, HB[0], HB[1], NW, 'ヘモグロビン', 'マクロファージの中で分解', seg(p, 0.06, 0.14), [255, 120, 130], 'hb', t);
    node(ctx, GL[0], GL[1], NW, 'グロビン', null, seg(p, 0.2, 0.27), [90, 225, 205], 'globin', t);
    node(ctx, HM[0], HM[1], NW, 'ヘム', null, seg(p, 0.22, 0.29), [255, 110, 120], 'heme', t);
    node(ctx, AA[0], AA[1], NW, 'アミノ酸', 'タンパク質の材料に', seg(p, 0.31, 0.38), [140, 255, 175], 'aa', t);
    node(ctx, FE[0], FE[1], NW, '鉄（Fe）', '回収される', seg(p, 0.41, 0.48), [255, 170, 80], 'fe', t);
    node(ctx, TF[0], TF[1], NW, 'トランスフェリン', '血液中で鉄を運ぶ', seg(p, 0.51, 0.58), [170, 200, 255], 'tf', t);
    node(ctx, BM[0], BM[1], NW, '骨髄', '新しい赤血球へ', seg(p, 0.61, 0.68), [255, 140, 150], 'bone', t);
    node(ctx, BI[0], BI[1], NW, 'ビリルビン', '黄色い色素', seg(p, 0.71, 0.78), [255, 215, 70], 'bili', t);
    node(ctx, LV[0], LV[1], NW, '肝臓', '処理して胆汁へ', seg(p, 0.81, 0.88), [230, 140, 110], 'liver', t);
    node(ctx, BL[0], BL[1], NW, '胆汁', '腸へ出ていく', seg(p, 0.9, 0.96), [140, 230, 110], 'bile', t);
    tag(ctx, '再利用', AA[0] + 200, AA[1] - 62, { size: 28, color: C.green, a: seg(p, 0.34, 0.4) });
    tag(ctx, '再利用', BM[0] - 10, BM[1] - 76, { size: 28, color: C.green, a: seg(p, 0.64, 0.7) });
    ctx.restore();
  };

  /* ------------------------------------------------------------ meta */
  /** natural on-screen panel size at scale 1 (px, excluding the emitter ~90px below) */
  D.SIZE = {
    centrifugeTube: [1000, 760], clotTube: [1080, 760], plasmaProteins: [1100, 760], rbcModel: [1100, 760],
    membraneSkeleton: [1150, 780], hemoglobin: [1050, 760], lungTissueLoop: [1200, 740], co2Transport: [1200, 760],
    erythropoiesis: [1720, 720], rbcLifespan: [1100, 740], hemeRecycle: [1720, 760]
  };
  /** ready(): load the fonts used for the special glyphs (await before rendering). */
  D.ready = function () {
    var ps = [];
    if (document.fonts && document.fonts.load) {
      ps.push(document.fonts.load('40px ZenKaku', '血漿赤血球').catch(function () {}));
      ps.push(document.fonts.load('40px IPAGothic', 'μ₂₃⁻⁺αβγ₁−').catch(function () {}));
    }
    return Promise.all(ps);
  };
})();
