/* BLOOD STORY ― 体内を駆ける細胞たち ― : characters.js (Agent A)
 * Plain script. Registers window.BS.chars = { drawAkane, drawShirou, drawWBCAlly, ... }.
 *
 * Rig: a small 2.5D skeleton (forward / down / lateral) is posed by joint angles, projected with a
 * view yaw (front 0°, threeq 48°, side 90°, or any opts.yaw), and drawn as cel-shaded bezier parts.
 * The head is a projected sphere: eyes, mouth, hair strands and accessories live on it, so the
 * character stays on-model when the camera circles. Pure functions of opts (no state, no RNG).
 * Units: local px with origin at the feet, y down; scale 1 => ~600 px tall.
 */
(function () {
  'use strict';
  const BS = (window.BS = window.BS || {});
  const PI = Math.PI, TAU = PI * 2, DEG = PI / 180;
  const { sin, cos, abs, sqrt, atan2, hypot, min, max, floor, asin } = Math;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  /* ------------------------------------------------------------------ colour */
  const _pc = new Map();
  function parse(c) {
    let r = _pc.get(c);
    if (r) return r;
    if (c[0] === '#') {
      let h = c.slice(1);
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      r = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    } else {
      const m = c.match(/[\d.]+/g) || [0, 0, 0];
      r = [+m[0], +m[1], +m[2]];
    }
    _pc.set(c, r);
    return r;
  }
  const hx2 = (n) => { n = clamp(Math.round(n), 0, 255); return (n < 16 ? '0' : '') + n.toString(16); };
  function mix(a, b, t) {
    if (t <= 0) return a;
    if (t > 1) t = 1;
    const A = parse(a), B = parse(b);
    return '#' + hx2(A[0] + (B[0] - A[0]) * t) + hx2(A[1] + (B[1] - A[1]) * t) + hx2(A[2] + (B[2] - A[2]) * t);
  }
  function rgba(c, a) { const A = parse(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  const _tintCache = new WeakMap();
  function mapCols(obj, f) {
    if (typeof obj === 'string') return obj[0] === '#' ? f(obj) : obj;
    if (Array.isArray(obj)) return obj.map((v) => mapCols(v, f));
    if (obj && typeof obj === 'object') { const o = {}; for (const k in obj) o[k] = mapCols(obj[k], f); return o; }
    return obj;
  }
  function tintPal(pal, tint) {
    if (!tint) return pal;
    let col, amt;
    if (typeof tint === 'string') { col = tint; amt = 0.3; } else { col = tint.color || '#ff2030'; amt = tint.amount != null ? tint.amount : 0.3; }
    if (amt <= 0) return pal;
    amt = Math.round(amt * 100) / 100;
    let m = _tintCache.get(pal);
    if (!m) { m = new Map(); _tintCache.set(pal, m); }
    const key = col + '|' + amt;
    let r = m.get(key);
    if (!r) {
      // multiply-ish tint: mix toward (colour * tint) so darks stay dark
      const T = parse(col);
      r = mapCols(pal, (c) => {
        const C = parse(c);
        const mul = '#' + hx2(C[0] * (0.35 + 0.65 * T[0] / 255) + 30 * T[0] / 255) + hx2(C[1] * (0.35 + 0.65 * T[1] / 255)) + hx2(C[2] * (0.35 + 0.65 * T[2] / 255));
        return mix(c, mul, amt * 1.6 > 1 ? 1 : amt * 1.6);
      });
      m.set(key, r);
    }
    return r;
  }

  /* ------------------------------------------------------------------ paths */
  function capsule(a, b, r1, r2, b1, b2) {
    const dx = b.x - a.x, dy = b.y - a.y, L = hypot(dx, dy) || 0.001;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, ang = atan2(dy, dx);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const rm1 = (r1 + r2) / 2 * (1 + (b1 || 0)), rm2 = (r1 + r2) / 2 * (1 + (b2 || 0));
    const p = new Path2D();
    p.moveTo(a.x + nx * r1, a.y + ny * r1);
    p.quadraticCurveTo(mx + nx * rm1 * 1.02, my + ny * rm1 * 1.02, b.x + nx * r2, b.y + ny * r2);
    p.arc(b.x, b.y, r2, ang + PI / 2, ang - PI / 2, true);
    p.quadraticCurveTo(mx - nx * rm2 * 1.02, my - ny * rm2 * 1.02, a.x - nx * r1, a.y - ny * r1);
    p.arc(a.x, a.y, r1, ang - PI / 2, ang + PI / 2, true);
    p.closePath();
    p._cap = [a, b, r1, r2, b1, b2];
    return p;
  }
  // Catmull-Rom through points; a point with .c = 1 is a sharp corner.
  function addSmooth(path, pts, closed, move) {
    const n = pts.length;
    if (n < 2) return path;
    if (move !== false) path.moveTo(pts[0].x, pts[0].y); else path.lineTo(pts[0].x, pts[0].y);
    const seg = closed ? n : n - 1;
    for (let i = 0; i < seg; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % n];
      const p0 = closed ? pts[(i - 1 + n) % n] : pts[max(i - 1, 0)];
      const p3 = closed ? pts[(i + 2) % n] : pts[min(i + 2, n - 1)];
      const k1 = p1.c ? 0 : 1 / 6, k2 = p2.c ? 0 : 1 / 6;
      path.bezierCurveTo(p1.x + (p2.x - p0.x) * k1, p1.y + (p2.y - p0.y) * k1,
        p2.x - (p3.x - p1.x) * k2, p2.y - (p3.y - p1.y) * k2, p2.x, p2.y);
    }
    if (closed) path.closePath();
    return path;
  }
  const smooth = (pts, closed) => addSmooth(new Path2D(), pts, closed !== false);
  function poly(pts, closed) {
    const p = new Path2D();
    p.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y);
    if (closed !== false) p.closePath();
    return p;
  }
  function hull(points) {
    const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    if (pts.length < 3) return pts;
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  const P2 = (x, y, c) => (c ? { x, y, c: 1 } : { x, y });
  const lp2 = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

  /* ------------------------------------------------------------------ shading */
  const BIG = 1e4;
  // region of `path` not covered by `path` shifted by (dx,dy): (P xor T(P)) inside clip(P)
  function crescentNoClip(ctx, path, dx, dy, color, alpha) {
    const q = new Path2D(path);
    q.addPath(path, new DOMMatrix([1, 0, 0, 1, dx, dy]));
    if (alpha != null) { const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; ctx.fillStyle = color; ctx.fill(q, 'evenodd'); ctx.globalAlpha = a; }
    else { ctx.fillStyle = color; ctx.fill(q, 'evenodd'); }
  }
  function crescent(ctx, path, dx, dy, color, alpha) {
    ctx.save();
    ctx.clip(path);
    crescentNoClip(ctx, path, dx, dy, color, alpha);
    ctx.restore();
  }
  // part: {p:Path2D, c:{b,s,h}, k: shadow width, hk: highlight width, ol: extra outline, rimK}
  function fillPart(G, pt) {
    const ctx = G.ctx, c = pt.c;
    ctx.fillStyle = c.b;
    ctx.fill(pt.p);
    const k = pt.k != null ? pt.k : 6;
    const px = G.px || 1;
    let doS = c.s && k * px > 1.1, doH = c.h && pt.hk && pt.hk * px > 1.2 && px > 0.55;
    const doR = G.rim && pt.rim !== false;
    const cp = pt.p._cap;
    if (doS && cp && !doR && min(cp[2], cp[3]) > k * 0.6) {
      // clip-free cel shadow for capsules: shadow colour, then an inset capsule shifted toward the light
      ctx.fillStyle = c.s; ctx.fill(pt.p);
      const dx = -0.5 * k * 0.5 * G.facing, dy = -0.86 * k * 0.5, h = k * 0.5;
      const ip = capsule({ x: cp[0].x + dx, y: cp[0].y + dy }, { x: cp[1].x + dx, y: cp[1].y + dy }, cp[2] - h, cp[3] - h, cp[4], cp[5]);
      ctx.fillStyle = c.b; ctx.fill(ip);
      doS = false; doH = false;
    }
    if (doS || doH || doR) {
      ctx.save();
      ctx.clip(pt.p);
      if (doS) crescentNoClip(ctx, pt.p, -0.5 * k * G.facing, -0.86 * k, c.s);
      if (doH) crescentNoClip(ctx, pt.p, 0.55 * pt.hk * G.facing, 0.85 * pt.hk, c.h);
      if (doR) {
        const w = (pt.rimK != null ? pt.rimK : G.rim.w);
        crescentNoClip(ctx, pt.p, -G.rim.dir * w * G.facing, w * 0.25, G.rim.color, G.rim.strength);
      }
      ctx.restore();
    }
    if (pt.ol) { ctx.lineWidth = G.lw * (pt.ol === true ? 0.85 : pt.ol); ctx.strokeStyle = G.line; ctx.stroke(pt.p); }
  }
  function drawParts(G, parts) {
    const ctx = G.ctx;
    ctx.lineWidth = G.lw * 2;
    ctx.strokeStyle = G.line;
    for (const p of parts) if (!p.noStroke) ctx.stroke(p.p);
    for (const p of parts) fillPart(G, p);
  }
  // same-colour parts (hair): one outline pass, one clip for the shading
  function drawUnified(G, parts, c, k, hk) {
    const ctx = G.ctx;
    ctx.lineWidth = G.lw * 2; ctx.strokeStyle = G.line;
    const U = new Path2D();
    for (const p of parts) { ctx.stroke(p); U.addPath(p); }
    const px = G.px || 1;
    if (k * px <= 1.1) { ctx.fillStyle = c.b; ctx.fill(U); return U; }
    ctx.fillStyle = c.s; ctx.fill(U);
    ctx.save(); ctx.clip(U);
    const m = new DOMMatrix([1, 0, 0, 1, -0.5 * k * G.facing, -0.86 * k]);
    const T = new Path2D(); T.addPath(U, m);
    ctx.fillStyle = c.b; ctx.fill(T);
    if (hk && c.h && hk * px > 1.2) {
      const T2 = new Path2D(); T2.addPath(U, new DOMMatrix([1, 0, 0, 1, -(0.5 * k + 0.55 * hk) * G.facing, -(0.86 * k + 0.85 * hk)]));
      // thin lit rim on the upper-left: base-shifted minus further-shifted
      const q = new Path2D(T); q.addPath(U, new DOMMatrix([1, 0, 0, 1, 0.55 * hk * G.facing, 0.85 * hk]));
      ctx.fillStyle = c.h; ctx.fill(q, 'evenodd');
      ctx.fillStyle = c.b; ctx.fill(T);
    }
    if (G.rim) { const q = new Path2D(U); q.addPath(U, new DOMMatrix([1, 0, 0, 1, -G.rim.dir * G.rim.w * G.facing, G.rim.w * 0.25])); ctx.globalAlpha *= G.rim.strength; ctx.fillStyle = G.rim.color; ctx.fill(q, 'evenodd'); }
    ctx.restore();
    return U;
  }
  function strokeLine(G, pts, w, col, smoothIt) {
    const ctx = G.ctx;
    const p = smoothIt ? smooth(pts, false) : poly(pts, false);
    ctx.lineWidth = w;
    ctx.strokeStyle = col || G.line;
    ctx.stroke(p);
  }

  /* ------------------------------------------------------------------ pose */
  const VIEW_YAW = { front: 0, threeq: 48, side: 90, back: 180 };
  function cyc(keys, p) {
    const n = keys.length;
    const f = (((p % 1) + 1) % 1) * n, i = floor(f), u = f - i;
    const a = keys[(i - 1 + n) % n], b = keys[i], c = keys[(i + 1) % n], d = keys[(i + 2) % n];
    const u2 = u * u, u3 = u2 * u;
    return 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
  }
  // run cycle (one leg; contact at 0, other leg contact at 0.5): contact, down, pass, up, toe-off, recover, pass(swing), reach
  const RUN = {
    th: [30, 16, -6, -30, -40, -14, 30, 54],
    kn: [10, 38, 24, 18, 66, 118, 104, 52],
    ft: [14, 0, -4, -34, -48, -34, -10, 8],
  };
  function newPose() {
    const leg = () => ({ th: 0, kn: 0, ft: 0, ab: 3 * DEG, ab2: 0 });
    const arm = () => ({ sh: 0, ab: 10 * DEG, el: 10 * DEG, ab2: 10 * DEG });
    return {
      lean: 0, twist: 0, hipTwist: 0, shrug: 0, shW: 1, shiftF: 0, shiftL: 0, flight: 0, roll: 0,
      legs: { R: leg(), L: leg() }, arms: { R: arm(), L: arm() },
      head: { turn: 0, pitch: 0, roll: 0 }, hand: { R: 'relax', L: 'relax' },
      speed: 0, phase: 0, hold: false, crouch: 0,
    };
  }
  const setLeg = (g, th, kn, ft, ab) => { g.th = th * DEG; g.kn = kn * DEG; g.ft = ft * DEG; g.ab = (ab != null ? ab : 3) * DEG; };
  const setArm = (a, sh, ab, el, ab2) => { a.sh = sh * DEG; a.ab = ab * DEG; a.el = el * DEG; a.ab2 = (ab2 != null ? ab2 : ab) * DEG; };

  function solvePose(def, o) {
    const P = newPose();
    const t = o.t || 0, pose = o.pose || 'stand';
    const sq = clamp(o.squash || 0, 0, 1);
    const ph = (((o.runPhase || 0) % 1) + 1) % 1;
    const L = P.legs, A = P.arms;
    const fem = !def.masc;
    const breath = sin(t * 2.3 + (def.seed || 0));
    if (pose === 'run') {
      P.phase = ph; P.speed = 1;
      setLeg(L.R, cyc(RUN.th, ph), cyc(RUN.kn, ph), cyc(RUN.ft, ph), 4);
      setLeg(L.L, cyc(RUN.th, ph + 0.5), cyc(RUN.kn, ph + 0.5), cyc(RUN.ft, ph + 0.5), 4);
      const c = cos(TAU * ph);
      const sw = def.masc ? 50 : 44;
      setArm(A.R, -c * sw + 4, 13, 78 + 34 * (1 - c) / 2, 6 - 30 * (1 - c) / 2);
      setArm(A.L, c * sw + 4, 13, 78 + 34 * (1 + c) / 2, 6 - 30 * (1 + c) / 2);
      P.lean = (def.masc ? 15 : 12) * DEG;
      P.twist = -13 * c * DEG;
      P.hipTwist = 8 * c * DEG;
      P.flight = 9 * max(0, sin(2 * TAU * (ph - 0.3)));
      P.head.pitch = -0.05 + 0.025 * sin(2 * TAU * ph + 0.8);
      P.head.roll = 0.025 * sin(TAU * ph);
      P.hand.R = P.hand.L = 'fist';
    } else if (pose === 'ready') {
      setLeg(L.R, 22, 30, 4, 8);
      setLeg(L.L, -20, 22, -4, 10);
      setArm(A.R, 58, 22, 92, 0);
      setArm(A.L, 22, 24, 112, 6);
      P.lean = 9 * DEG; P.twist = -14 * DEG; P.hipTwist = -6 * DEG;
      P.hand.R = P.hand.L = 'fist';
      P.head.pitch = -0.04;
      P.shrug = 1.2 * breath;
    } else if (pose === 'relieved') {
      setLeg(L.R, 2, 4, 0, 3);
      setLeg(L.L, -3, 8, 0, 5);
      setArm(A.R, 34, 0, 112, -42);
      setArm(A.L, 2, 10, 14, 10);
      P.lean = -2 * DEG; P.shrug = -4 + 1.5 * breath;
      P.head.pitch = 0.1; P.head.roll = -0.12;
      P.hand.R = 'flat';
    } else if (pose === 'turn') {
      const a = o.turnAmt != null ? clamp(o.turnAmt, 0, 1) : 1;
      const k = sstep(a);
      setLeg(L.R, lerp(2, 8, k), lerp(4, 14, k), 0, 4);
      setLeg(L.L, lerp(-4, -10, k), lerp(8, 18, k), 0, 6);
      setArm(A.R, lerp(-4, -18, k), lerp(12, 20, k), lerp(14, 30, k));
      setArm(A.L, lerp(6, 4, k), lerp(10, 8, k), lerp(20, 34, k));
      P.twist = -38 * k * DEG; P.hipTwist = -14 * k * DEG;
      P.head.turn = -118 * k * DEG;
      P.head.pitch = -0.04 * k;
      P.lean = 3 * k * DEG;
      P.shrug = 3 * k + 1.2 * breath;
    } else if (pose === 'hold') {
      setLeg(L.R, 3, 5, 0, 3);
      setLeg(L.L, -4, 9, 0, 5);
      P.hold = true;
      P.shrug = 1.2 * breath;
    } else { // stand
      if (def.masc) {
        setLeg(L.R, 3, 4, 0, 5);
        setLeg(L.L, -3, 6, 0, 6);
        setArm(A.R, -2, 9, 14, 6);
        setArm(A.L, 3, 9, 18, 6);
        P.hand.R = P.hand.L = 'loose';
      } else {
        setLeg(L.R, 3, 4, 0, 2);
        setLeg(L.L, -5, 10, 2, 6);
        setArm(A.R, -4, 13, 16, 8);
        setArm(A.L, 6, 11, 24, 6);
      }
      P.shrug = 1.3 * breath;
      P.head.roll = fem ? 0.04 : 0;
    }
    if (o.holdO2 || P.hold) {
      P.hold = true;
      setArm(A.R, 14, 9, 112, -42);
      setArm(A.L, 14, 9, 112, -42);
      P.hand.R = P.hand.L = 'cup';
      if (pose === 'run') { A.R.sh += 6 * sin(TAU * ph) * DEG; A.L.sh -= 6 * sin(TAU * ph) * DEG; }
    }
    if (sq > 0) {
      P.lean += 20 * sq * DEG;
      for (const k of ['R', 'L']) {
        L[k].kn += 26 * sq * DEG; L[k].th += 13 * sq * DEG;
        L[k].ab *= 1 - 0.7 * sq;
        if (!P.hold) {
          A[k].ab = lerp(A[k].ab, -4 * DEG, sq);
          A[k].ab2 = lerp(A[k].ab2, -26 * DEG, sq);
          A[k].el = lerp(A[k].el, 118 * DEG, sq * 0.8);
          A[k].sh = lerp(A[k].sh, 22 * DEG, sq * 0.6);
        }
      }
      P.shrug += 5 * sq; P.shW = 1 - 0.18 * sq;
      P.head.pitch += 0.14 * sq;
      P.crouch = sq;
    }
    if (o.speed != null) P.speed = o.speed;
    if (o.headTurn != null) P.head.turn = o.headTurn * DEG;
    return P;
  }

  /* ------------------------------------------------------------------ rig */
  function buildRig(def, P, rootY) {
    const B = def.body;
    const py = rootY - B.hipH;
    const cl = cos(P.lean), sl = sin(P.lean);
    const rot = (f, l, a) => { const c = cos(a), s = sin(a); return [f * c - l * s, f * s + l * c]; };
    const twAt = (h) => lerp(P.hipTwist, P.twist, clamp(h / B.shH, 0, 1));
    function body(f, h, l, tw, lk) {
      const r = rot(f, l, tw == null ? twAt(h) : tw);
      let c = cl, s = sl;
      if (lk != null && lk !== 1) { c = cos(P.lean * lk); s = sin(P.lean * lk); }
      return [r[0] * c + h * s + P.shiftF, py - (h * c - r[0] * s), r[1] + P.shiftL];
    }
    function bdir(d, tw, lk) {
      const r = rot(d[0], d[2], tw);
      const ln = P.lean * (lk == null ? 1 : lk), c = cos(ln), s = sin(ln), h = -d[1];
      return [r[0] * c + h * s, -(h * c - r[0] * s), r[1]];
    }
    const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
    const J = { body, twAt, py };
    for (const k of ['R', 'L']) {
      const sg = k === 'R' ? -1 : 1, g = P.legs[k];
      const hr = rot(0, sg * B.hipW, P.hipTwist);
      const hip = [hr[0] + P.shiftF, py, hr[1] + P.shiftL];
      const d1r = rot(sin(g.th) * cos(g.ab), sg * sin(g.ab), P.hipTwist);
      const d1 = [d1r[0], cos(g.th) * cos(g.ab), d1r[1]];
      const knee = add(hip, d1, B.thigh);
      const a2 = g.th - g.kn, ab2 = g.ab * 0.4;
      const d2r = rot(sin(a2) * cos(ab2), sg * sin(ab2), P.hipTwist);
      const d2 = [d2r[0], cos(a2) * cos(ab2), d2r[1]];
      const ankle = add(knee, d2, B.shin);
      const fa = a2 + g.ft;
      const fdr = rot(cos(fa), 0, P.hipTwist);
      const fd = [fdr[0], -sin(fa), fdr[1]];
      const ndr = rot(sin(fa), 0, P.hipTwist);
      const nd = [ndr[0], cos(fa), ndr[1]];
      const heel = add(add(ankle, nd, B.ankleH), fd, -10);
      const toe = add(add(ankle, nd, B.ankleH * 0.55), fd, B.foot);
      J['hip' + k] = hip; J['knee' + k] = knee; J['ankle' + k] = ankle; J['heel' + k] = heel; J['toe' + k] = toe;
      J['fd' + k] = fd; J['nd' + k] = nd;
    }
    for (const k of ['R', 'L']) {
      const sg = k === 'R' ? -1 : 1, a = P.arms[k];
      const tw = P.twist;
      const sh = body(0, B.shH + P.shrug, sg * B.shW * P.shW, tw);
      const d1 = bdir([sin(a.sh) * cos(a.ab), cos(a.sh) * cos(a.ab), sg * sin(a.ab)], tw);
      const elbow = add(sh, d1, B.upper);
      const fa = a.sh + a.el;
      const d2 = bdir([sin(fa) * cos(a.ab2), cos(fa) * cos(a.ab2), sg * sin(a.ab2)], tw);
      const wrist = add(elbow, d2, B.fore);
      J['sh' + k] = sh; J['elbow' + k] = elbow; J['wrist' + k] = wrist; J['hd' + k] = d2;
    }
    const nb = body(B.neckF, B.neckH + P.shrug * 0.5, 0, P.twist);
    const nd = bdir([sin(0.16), -cos(0.16), 0], P.twist * 0.6, 0.55);
    const nt = add(nb, nd, B.neckLen);
    const R = def.head.R;
    const hu = bdir([0.06, -1, 0], P.twist * 0.6, 0.3);
    J.neckBase = nb; J.neckTop = nt;
    J.head = add(nt, hu, R * 0.5);
    return J;
  }
  function rigGrounded(def, P) {
    let J = buildRig(def, P, 0);
    let low = -1e9;
    for (const k of ['R', 'L']) low = max(low, J['heel' + k][1], J['toe' + k][1]);
    const rootY = -low - P.flight;
    return buildRig(def, P, rootY);
  }

  /* ------------------------------------------------------------------ expressions */
  const EXPR = {
    happy: { open: 1.0, tilt: -0.05, low: 0.26, pupil: 1, by: 0.0, ba: -0.14, arch: 1, mouth: 'smile', blush: 0.6 },
    determined: { open: 0.86, tilt: 0.6, low: 0.14, pupil: 0.95, by: 0.06, ba: 0.42, arch: 0.6, mouth: 'firm', blush: 0.25 },
    surprised: { open: 1.14, tilt: -0.15, low: 0, pupil: 0.72, by: -0.2, ba: -0.22, arch: 1.5, mouth: 'o', blush: 0.3, minM: 0.22 },
    relieved: { open: 0.0, closedShape: 'soft', tilt: -0.1, low: 0.3, pupil: 1, by: -0.05, ba: -0.36, arch: 0.8, mouth: 'smile', blush: 0.7 },
    calm: { open: 0.86, tilt: 0.18, low: 0.06, pupil: 1, by: 0.02, ba: 0.08, arch: 0.6, mouth: 'flat', blush: 0 },
    alert: { open: 1.16, tilt: 0.0, low: 0, pupil: 0.68, by: -0.16, ba: 0.18, arch: 1.0, mouth: 'o', blush: 0 },
    serious: { open: 0.76, tilt: 0.62, low: 0.12, pupil: 0.9, by: 0.07, ba: 0.52, arch: 0.4, mouth: 'frown', blush: 0 },
    shout: { open: 0.98, tilt: 0.72, low: 0.06, pupil: 0.78, by: 0.05, ba: 0.62, arch: 0.4, mouth: 'shout', blush: 0, minM: 0.5 },
    worried: { open: 0.92, tilt: -0.3, low: 0.05, pupil: 0.9, by: -0.08, ba: -0.4, arch: 0.8, mouth: 'frown', blush: 0.2 },
  };

  /* ------------------------------------------------------------------ head */
  // face outline keys (R units, x toward the facing side, y down)
  const FACE_F = [[0, -1.0], [0.72, -0.72], [0.985, -0.12], [0.95, 0.24], [0.8, 0.6], [0.46, 0.92], [0, 1.06], [-0.46, 0.92], [-0.8, 0.6], [-0.95, 0.24], [-0.985, -0.12], [-0.72, -0.72]];
  const FACE_Q = [[0.04, -1.0], [0.75, -0.7], [0.975, -0.16], [0.94, 0.2], [0.84, 0.52], [0.62, 0.86], [0.3, 1.04], [-0.12, 0.96], [-0.56, 0.72], [-0.88, 0.34], [-0.99, -0.08], [-0.72, -0.72]];
  const FACE_S = [[0.06, -1.0], [0.7, -0.74], [0.9, -0.28], [1.0, 0.16], [0.92, 0.38], [0.84, 0.66], [0.62, 0.86], [0.2, 0.78], [-0.04, 0.5], [-0.38, 0.16], [-0.92, -0.08], [-0.78, -0.66]];
  const CORNER_S = [false, false, false, true, false, false, false, false, false, false, false, false];

  function faceOutline(hy, shape) {
    const u = sin(hy), au = abs(u), sg = u < 0 ? -1 : 1;
    const pts = [];
    const j = shape && shape.jaw != null ? shape.jaw : 1;
    for (let i = 0; i < 12; i++) {
      let x, y;
      if (au < 0.74) { const k = au / 0.74; x = lerp(FACE_F[i][0], FACE_Q[i][0], k); y = lerp(FACE_F[i][1], FACE_Q[i][1], k); }
      else { const k = (au - 0.74) / 0.26; x = lerp(FACE_Q[i][0], FACE_S[i][0], k); y = lerp(FACE_Q[i][1], FACE_S[i][1], k); }
      if (y > 0.3) { y = 0.3 + (y - 0.3) * j; }
      if (shape && shape.wide && y > -0.2) x *= shape.wide;
      pts.push({ x: x * sg, y, c: CORNER_S[i] && au > 0.93 ? 1 : 0 });
    }
    return pts;
  }

  function makeSphere(hy, pitch) {
    const cp = cos(pitch), spp = sin(pitch);
    const f = function (lam, phi, r) {
      r = r == null ? 1 : r;
      const a = lam + hy;
      const X = r * cos(phi) * sin(a), Y = -r * sin(phi), Z = r * cos(phi) * cos(a);
      return { x: X, y: Y * cp + Z * spp, z: -Y * spp + Z * cp };
    };
    f.hy = hy; f.pitch = pitch;
    return f;
  }
  // head-frame 3D (f, y, l) -> screen (unit head coords)
  function hproj(hy, v) { return { x: v[0] * sin(hy) + v[2] * cos(hy), y: v[1], z: v[0] * cos(hy) - v[2] * sin(hy) }; }

  function arcPasses(a0, a1, ccw, target) {
    const norm = (a) => ((a % TAU) + TAU) % TAU;
    const span = ccw ? norm(a0 - a1) : norm(a1 - a0);
    const d = ccw ? norm(a0 - target) : norm(target - a0);
    return d <= span;
  }

  // hair cap: region of the (r = rc) sphere above boundary b(lam); optional spikes on the silhouette arc
  function capPath(sp, hair) {
    const rc = hair.capR || 1.07;
    const bd = hair.bound || [0.42, 0.05, -0.55];
    const bfun = (lam) => { const c = cos(lam); return c >= 0 ? lerp(bd[1], bd[0], c) : lerp(bd[1], bd[2], -c); };
    const N = 48, pts = [];
    for (let i = 0; i < N; i++) { const lam = -PI + i * TAU / N; const p = sp(lam, bfun(lam), rc); p.lam = lam; pts.push(p); }
    let s = -1;
    for (let i = 0; i < N; i++) if (pts[i].z >= 0 && pts[(i - 1 + N) % N].z < 0) { s = i; break; }
    const path = new Path2D();
    if (s < 0) { path.arc(0, 0, rc, 0, TAU); return path; }
    const run = [];
    let i = s;
    while (pts[i % N].z >= 0 && run.length < N) { run.push(pts[i % N]); i++; }
    const pA = pts[(s - 1 + N) % N], pA2 = pts[s];
    const kA = pA.z / (pA.z - pA2.z);
    const A = lp2(pA, pA2, kA);
    const pB = pts[(i - 1) % N], pB2 = pts[i % N];
    const kB = pB.z / (pB.z - pB2.z);
    const Bp = lp2(pB, pB2, kB);
    path.moveTo(A.x, A.y);
    for (const p of run) path.lineTo(p.x, p.y);
    path.lineTo(Bp.x, Bp.y);
    const aB = atan2(Bp.y, Bp.x), aA = atan2(A.y, A.x);
    const ccw = arcPasses(aB, aA, true, -PI / 2);
    if (!hair.spikes) {
      path.arc(0, 0, hypot(Bp.x, Bp.y), aB, aA, ccw);
    } else {
      const norm = (a) => ((a % TAU) + TAU) % TAU;
      const span = ccw ? norm(aB - aA) : norm(aA - aB);
      const M = 54;
      const cpi = cos(-sp.pitch), spi = sin(-sp.pitch);
      for (let j = 1; j < M; j++) {
        const th = aB + (ccw ? -1 : 1) * span * j / M;
        const sx = cos(th), sy = sin(th);
        // undo pitch: screen (sx, sy, 0) -> sphere (X, Y, Z)
        const Y = sy * cpi, Z = -sy * spi;
        const lam = atan2(sx, Z) - sp.hy, phi = asin(clamp(-Y, -1, 1));
        const ux = cos(phi) * cos(lam), uy = -sin(phi), uz = cos(phi) * sin(lam);
        let add = 0;
        for (const k of hair.spikes) {
          const d = ux * k.u[0] + uy * k.u[1] + uz * k.u[2];
          if (d > k.c) { const q = (d - k.c) / (1 - k.c); add = max(add, k.a * q * q); }
        }
        const r = rc + add;
        path.lineTo(sx * r, sy * r);
      }
      path.lineTo(A.x, A.y);
    }
    path.closePath();
    return path;
  }
  function prepSpikes(list) {
    return list.map(([lam, phi, a, w]) => ({ u: [cos(phi) * cos(lam), -sin(phi), cos(phi) * sin(lam)], a, c: cos(w || 0.26) }));
  }

  // a hair strand (bang / lock) on the head sphere
  function strandPts(sp, s, t, sway) {
    const rr = s.rr != null ? s.rr : 0.46;
    const lr = s.r, w = s.w, lt = s.t + sway, ft = s.ft;
    const A = sp(lr - w, rr, 1.07), B = sp(lr + w, rr, 1.07);
    const T = sp(lt, ft, s.tipR || 1.03);
    const bul = s.bul != null ? s.bul : 1.1;
    const cv = s.curl || 0;
    const M1 = sp(lerp(lr - w, lt, 0.55) - w * 0.15 + cv, lerp(rr, ft, 0.55), bul);
    const M2 = sp(lerp(lr + w, lt, 0.55) + w * 0.15 + cv, lerp(rr, ft, 0.55), bul);
    const top = sp(lr, rr + 0.25, 1.07);
    const pts = [top, A, M1, T, M2, B];
    T.c = 1;
    return { pts, root: sp(lr, rr, 1), tip: T };
  }

  function drawEye(G, E) {
    const ctx = G.ctx;
    const w = E.w, h = E.h, o = E.open;
    ctx.save();
    ctx.translate(E.x, E.y);
    ctx.rotate(E.rot || 0);
    ctx.scale(E.side * E.fx, 1);
    const lwH = G.lw;
    if (o < 0.1) {
      // closed: soft downward arc (relieved / blink)
      const p = new Path2D();
      const cy = E.closedShape === 'soft' ? 0.2 * h : 0.12 * h;
      p.moveTo(-0.5 * w, 0.1 * h);
      p.quadraticCurveTo(0, cy + 0.2 * h, 0.55 * w, 0.02 * h);
      ctx.lineWidth = lwH * 1.5; ctx.strokeStyle = E.lash; ctx.stroke(p);
      const p2 = new Path2D();
      p2.moveTo(0.48 * w, 0.05 * h); p2.lineTo(0.66 * w, -0.06 * h);
      ctx.lineWidth = lwH * 1.1; ctx.stroke(p2);
      ctx.restore();
      return;
    }
    const tilt = E.tilt || 0, low = E.low || 0;
    const sharp = E.style === 'sharp';
    const topY = lerp(0.34 * h, sharp ? -0.46 * h : -0.6 * h, o);
    const I = { x: -0.5 * w, y: lerp(0.32 * h, sharp ? 0.0 : -0.02 * h, o) + tilt * 0.2 * h * o };
    const O = { x: 0.52 * w, y: lerp(0.32 * h, sharp ? -0.16 * h : -0.08 * h, o) - tilt * 0.04 * h };
    const c1 = { x: -0.26 * w, y: topY + tilt * 0.26 * h * o };
    const c2 = { x: 0.28 * w, y: topY - (sharp ? 0.02 * h : 0.04 * h) };
    const LO = { x: 0.44 * w, y: 0.42 * h - low * 0.12 * h }, LI = { x: -0.42 * w, y: 0.38 * h - low * 0.04 * h };
    const lc = { x: 0.02 * w, y: 0.58 * h - low * 0.32 * h };
    const scl = new Path2D();
    scl.moveTo(I.x, I.y);
    scl.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, O.x, O.y);
    scl.quadraticCurveTo(0.54 * w, 0.2 * h, LO.x, LO.y);
    scl.quadraticCurveTo(lc.x, lc.y, LI.x, LI.y);
    scl.quadraticCurveTo(-0.53 * w, 0.2 * h, I.x, I.y);
    scl.closePath();
    ctx.fillStyle = E.sclera; ctx.fill(scl);
    ctx.save();
    ctx.clip(scl);
    // iris
    const ix = (E.lookX || 0) * 0.13 * w * E.side + 0.02 * w, iy = 0.07 * h + (E.lookY || 0) * 0.08 * h;
    const irx = 0.36 * w * (0.86 + 0.14 * E.pupil), iry = 0.47 * h * (0.86 + 0.14 * E.pupil);
    const gr = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);
    gr.addColorStop(0, E.iris.d); gr.addColorStop(0.45, E.iris.b); gr.addColorStop(1, E.iris.l);
    ctx.beginPath(); ctx.ellipse(ix, iy, irx, iry, 0, 0, TAU); ctx.fillStyle = gr; ctx.fill();
    // lower iris glow
    ctx.beginPath(); ctx.ellipse(ix, iy + iry * 0.42, irx * 0.62, iry * 0.4, 0, 0, TAU); ctx.fillStyle = rgba(E.iris.l, 0.55); ctx.fill();
    // pupil
    ctx.beginPath(); ctx.ellipse(ix, iy - iry * 0.06, irx * 0.46 * E.pupil, iry * 0.5 * E.pupil, 0, 0, TAU); ctx.fillStyle = E.iris.d; ctx.fill();
    ctx.lineWidth = lwH * 0.7; ctx.strokeStyle = E.iris.d;
    ctx.beginPath(); ctx.ellipse(ix, iy, irx, iry, 0, 0, TAU); ctx.stroke();
    // upper lid shadow
    const sh = new Path2D();
    sh.moveTo(I.x - w, I.y - h);
    sh.lineTo(I.x - 0.1 * w, I.y);
    sh.bezierCurveTo(c1.x, c1.y + 0.2 * h, c2.x, c2.y + 0.2 * h, O.x, O.y + 0.14 * h);
    sh.lineTo(O.x + w, O.y - h);
    sh.closePath();
    ctx.fillStyle = rgba(E.shadow, 0.5); ctx.fill(sh);
    ctx.restore();
    // crease
    if (!sharp) {
      const cr = new Path2D();
      cr.moveTo(-0.22 * w, c1.y + 0.02 * h - 0.14 * h);
      cr.quadraticCurveTo(0.2 * w, topY - 0.2 * h, 0.46 * w, O.y - 0.16 * h);
      ctx.lineWidth = lwH * 0.6; ctx.strokeStyle = rgba(E.lash, 0.55); ctx.stroke(cr);
    }
    // upper lash (filled, thicker toward the outer corner, with a flick)
    const N = 12, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, u = 1 - s;
      const x = u * u * u * I.x + 3 * u * u * s * c1.x + 3 * u * s * s * c2.x + s * s * s * O.x;
      const y = u * u * u * I.y + 3 * u * u * s * c1.y + 3 * u * s * s * c2.y + s * s * s * O.y;
      const th = (0.04 + (sharp ? 0.15 : 0.12) * Math.pow(s, 1.1)) * h * (0.55 + 0.45 * o) + lwH * 0.4;
      bot.push({ x, y: y + lwH * 0.3 });
      top.push({ x: x - 0.02 * w * s, y: y - th });
    }
    const lash = new Path2D();
    lash.moveTo(bot[0].x, bot[0].y);
    for (const p of bot) lash.lineTo(p.x, p.y);
    lash.lineTo(O.x + (sharp ? 0.1 : 0.14) * w, O.y - (sharp ? 0.04 : 0.1) * h);
    for (let i = top.length - 1; i >= 0; i--) lash.lineTo(top[i].x, top[i].y);
    lash.closePath();
    ctx.fillStyle = E.lash; ctx.fill(lash);
    if (!sharp && E.fem) { // two small outer lashes
      ctx.lineWidth = lwH * 0.8; ctx.strokeStyle = E.lash;
      ctx.beginPath(); ctx.moveTo(O.x - 0.02 * w, O.y - 0.02 * h); ctx.lineTo(O.x + 0.16 * w, O.y - 0.2 * h); ctx.stroke();
    }
    // lower lash
    const ll = new Path2D();
    ll.moveTo(LO.x + 0.02 * w, LO.y - 0.06 * h);
    ll.quadraticCurveTo(0.3 * w, lc.y - 0.06 * h, 0.02 * w, lc.y * 0.92);
    ctx.lineWidth = lwH * 0.75; ctx.strokeStyle = E.lash; ctx.stroke(ll);
    ctx.restore();
    // highlights (screen-consistent: light from upper-left)
    if (o > 0.3) {
      const cx = E.x + (ix * E.side * E.fx) * cos(E.rot || 0), cy = E.y + iy;
      const s = sstep((o - 0.3) / 0.4);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.96 * s) + ')';
      ctx.beginPath(); ctx.ellipse(cx - 0.11 * w * E.fx * G.facing, cy - 0.17 * h, 0.12 * w * max(E.fx, 0.6), 0.1 * h, -0.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 0.1 * w * E.fx * G.facing, cy + 0.2 * h, 0.05 * w, 0.04 * h, 0, 0, TAU); ctx.fill();
      if (E.sparkle) { ctx.beginPath(); ctx.ellipse(cx + 0.16 * w * E.fx * G.facing, cy - 0.05 * h, 0.03 * w, 0.03 * h, 0, 0, TAU); ctx.fill(); }
    }
  }
  function drawBrow(G, E, ex) {
    const ctx = G.ctx, w = E.w, h = E.h;
    ctx.save();
    ctx.translate(E.x, E.y);
    ctx.rotate(E.rot || 0);
    ctx.scale(E.side * E.fx, 1);
    const by = (E.browY || -0.8) * h - ex.by * h;
    const I = { x: -0.44 * w, y: by + ex.ba * 0.32 * h + 0.04 * h };
    const O = { x: 0.6 * w, y: by + 0.06 * h - ex.ba * 0.06 * h };
    const C = { x: 0.1 * w, y: by - 0.14 * h * ex.arch - ex.ba * 0.05 * h };
    const t0 = (E.browW || 0.12) * h, t1 = 0.03 * h;
    const p = new Path2D();
    p.moveTo(I.x, I.y - t0 * 0.5);
    p.quadraticCurveTo(C.x, C.y - t0 * 0.5, O.x, O.y);
    p.quadraticCurveTo(C.x, C.y + t0 * 0.6, I.x, I.y + t0 * 0.5);
    p.closePath();
    if (E.halo) {
      ctx.lineWidth = t0 * 0.9; ctx.strokeStyle = rgba(E.halo, 0.55); ctx.stroke(p);
    }
    ctx.fillStyle = E.brow; ctx.fill(p);
    ctx.lineWidth = t1; ctx.strokeStyle = E.brow; ctx.stroke(p);
    ctx.restore();
  }
  function drawMouth(G, M) {
    const ctx = G.ctx;
    ctx.save();
    ctx.translate(M.x, M.y);
    ctx.scale(M.fx, 1);
    const w = M.w, m = M.m, base = M.base;
    const smile = base === 'smile' ? 1 : base === 'firm' ? 0.3 : base === 'frown' ? -0.6 : base === 'o' ? 0 : 0;
    ctx.strokeStyle = G.line; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (m < 0.06 && base !== 'shout') {
      const p = new Path2D();
      if (base === 'o') { ctx.beginPath(); ctx.ellipse(0, 0.01, 0.045, 0.035, 0, 0, TAU); ctx.fillStyle = M.inner; ctx.fill(); ctx.lineWidth = G.lw * 0.7; ctx.stroke(); ctx.restore(); return; }
      p.moveTo(-w / 2, -smile * 0.04);
      p.quadraticCurveTo(0, smile * 0.055 + 0.005, w / 2, -smile * 0.04);
      ctx.lineWidth = G.lw * 0.85; ctx.stroke(p);
      if (smile > 0.5) { // small dimple ticks
        ctx.lineWidth = G.lw * 0.5;
        ctx.beginPath(); ctx.moveTo(w / 2 - 0.005, -0.045); ctx.lineTo(w / 2 + 0.015, -0.06); ctx.stroke();
      }
    } else {
      let h = 0.035 + m * 0.3, ww;
      if (base === 'o') ww = w * (0.48 + 0.25 * m);
      else if (base === 'shout') { ww = w * (1.2 + 0.25 * m); h = 0.1 + m * 0.3; }
      else ww = w * (0.8 + 0.3 * m);
      if (M.vowel === 'i' || M.vowel === 'e') { ww *= 1.15; h *= 0.6; }
      if (M.vowel === 'u' || M.vowel === 'o') { ww *= 0.7; }
      const cy = -smile * 0.035 * (1 - m * 0.5);
      const p = new Path2D();
      if (base === 'shout') {
        p.moveTo(-ww / 2, cy - 0.01);
        p.quadraticCurveTo(0, cy - 0.06, ww / 2, cy - 0.01);
        p.bezierCurveTo(ww * 0.42, h * 0.9, ww * 0.25, h, 0, h);
        p.bezierCurveTo(-ww * 0.25, h, -ww * 0.42, h * 0.9, -ww / 2, cy - 0.01);
      } else {
        p.moveTo(-ww / 2, cy);
        p.quadraticCurveTo(0, cy - 0.02 + smile * 0.01, ww / 2, cy);
        p.bezierCurveTo(ww * 0.38, cy + h * 1.15, -ww * 0.38, cy + h * 1.15, -ww / 2, cy);
      }
      p.closePath();
      ctx.fillStyle = M.inner; ctx.fill(p);
      ctx.save(); ctx.clip(p);
      ctx.fillStyle = M.tongue;
      ctx.beginPath(); ctx.ellipse(0, cy + h * 0.95, ww * 0.34, h * 0.42, 0, 0, TAU); ctx.fill();
      if (m > 0.35 || base === 'shout') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-ww, cy - 0.1, ww * 2, 0.1 + 0.03 + 0.02 * m);
        if (base === 'shout') ctx.fillRect(-ww, cy + h - 0.035, ww * 2, 0.06);
      }
      ctx.restore();
      ctx.lineWidth = G.lw * 0.75; ctx.stroke(p);
    }
    ctx.restore();
  }
  function drawDiscEmblem(ctx, x, y, r, fx, cols, lw, line) {
    // stylised biconcave disc: ring + dimpled centre + highlight (an emblem, not a cell)
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(max(fx, 0.08), 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = cols.rim; ctx.fill();
    ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, TAU); ctx.fillStyle = cols.ring; ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.06, r * 0.06, r * 0.38, 0, TAU); ctx.fillStyle = mix(cols.ring, '#5a0a18', 0.35); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, TAU); ctx.fillStyle = cols.core; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.62, PI * 1.08, PI * 1.62); ctx.lineWidth = r * 0.12; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
    ctx.restore();
  }

  /* --------------------------------------------------------------- the figure */
  const DEFAULTS = { x: 0, y: 0, scale: 1, facing: 1, view: 'side', pose: 'stand', runPhase: 0, mouth: 0, blink: 0, squash: 0, holdO2: false, t: 0 };

  function computeFrame(def, oIn) {
    const o = Object.assign({}, DEFAULTS, def.defaults || {}, oIn || {});
    if (!o.expr) o.expr = def.exprDefault;
    const yawDeg = o.yaw != null ? o.yaw : (VIEW_YAW[o.view] != null ? VIEW_YAW[o.view] : 90);
    const Y = yawDeg * DEG;
    const P = solvePose(def, o);
    const J = rigGrounded(def, P);
    return { o, Y, P, J };
  }

  function headScreen(def, F) {
    const sY = sin(F.Y), cY = cos(F.Y), J = F.J;
    const h = J.head;
    return { x: h[0] * sY + h[2] * cY, y: h[1], z: h[0] * cY - h[2] * sY, R: def.head.R };
  }

  function drawFigure(ctx, def, oIn) {
    const F = computeFrame(def, oIn);
    const { o, Y, P, J } = F;
    const sY = sin(Y), cY = cos(Y);
    const s = o.scale, facing = o.facing < 0 ? -1 : 1;
    const sq = clamp(o.squash || 0, 0, 1);
    const pal = tintPal(def.pal, o.tint);
    const B = def.body;
    const pr = (p) => ({ x: p[0] * sY + p[2] * cY, y: p[1], z: p[0] * cY - p[2] * sY });
    const lw = (o.line != null ? o.line : 4.0) / sqrt(max(s, 0.12));
    let rim = null;
    if (o.rim) {
      const r = typeof o.rim === 'string' ? { color: o.rim } : o.rim;
      rim = { color: r.color || '#ff5a5a', strength: r.strength != null ? r.strength : 0.55, dir: r.dir != null ? (r.dir < 0 ? -1 : 1) : 1, w: r.width || 7 };
    }
    const G = { ctx, facing, lw, line: pal.line, rim, pal, t: o.t, px: s };
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.scale(s * facing * (1 - 0.12 * sq), s * (1 - 0.04 * sq));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;

    // ---- projected joints
    const Q = {};
    for (const k in J) if (Array.isArray(J[k]) && J[k].length === 3) Q[k] = pr(J[k]);

    // ---- torso ring helpers
    const levels = B.torso;
    function lvl(h) {
      if (h <= levels[0].h) return levels[0];
      for (let i = 1; i < levels.length; i++) {
        const a = levels[i - 1], b = levels[i];
        if (h <= b.h) { const k = (h - a.h) / (b.h - a.h); return { h, W: lerp(a.W, b.W, k), D: lerp(a.D, b.D, k), f: lerp(a.f, b.f, k) }; }
      }
      return levels[levels.length - 1];
    }
    const shwAt = (h) => lerp(1, P.shW, clamp((h - B.shH * 0.6) / (B.shH * 0.4), 0, 1));
    function ring(spec) { // spec: {h, W, D, f, tw?, lk?, disp?}
      spec.tw = spec.tw != null ? spec.tw : J.twAt(spec.h);
      return spec;
    }
    function rpt(spec, lam, off) {
      off = off || 0;
      let df = 0, dh = 0, dl = 0;
      if (spec.disp) { const d = spec.disp(lam); df = d[0]; dh = d[1]; dl = d[2]; }
      const p = J.body(spec.f + (spec.D + off) * cos(lam) + df, spec.h + dh, (spec.W + off) * sin(lam) + dl, spec.tw, spec.lk);
      return pr(p);
    }
    function rnz(spec, lam) {
      let nf = cos(lam) / spec.D, nl = sin(lam) / spec.W;
      const L = hypot(nf, nl); nf /= L; nl /= L;
      const c = cos(spec.tw), sn = sin(spec.tw);
      const f2 = nf * c - nl * sn, l2 = nf * sn + nl * c;
      return f2 * cY - l2 * sY;
    }
    function extremes(spec) {
      let mn = 1e9, mx = -1e9, lmn = 0, lmx = 0;
      for (let i = 0; i < 32; i++) {
        const lam = -PI + i * TAU / 32, p = rpt(spec, lam);
        if (p.x < mn) { mn = p.x; lmn = lam; }
        if (p.x > mx) { mx = p.x; lmx = lam; }
      }
      // refine
      for (const which of [0, 1]) {
        let l0 = which ? lmx : lmn;
        for (let it = 0; it < 2; it++) {
          let best = l0, bv = which ? -1e9 : 1e9;
          for (let j = -3; j <= 3; j++) {
            const lam = l0 + j * TAU / 32 / 3 / (it + 1), x = rpt(spec, lam).x;
            if (which ? x > bv : x < bv) { bv = x; best = lam; }
          }
          l0 = best;
        }
        if (which) lmx = l0; else lmn = l0;
      }
      // near arc direction (from lmn to lmx)
      const norm = (a) => ((a % TAU) + TAU) % TAU;
      const up = norm(lmx - lmn);
      const mid = lmn + up / 2;
      const dir = rnz(spec, mid) >= rnz(spec, mid + PI) ? 1 : -1;
      const span = dir > 0 ? up : TAU - up;
      return { lmn, lmx, dir, span, pmn: rpt(spec, lmn), pmx: rpt(spec, lmx) };
    }
    function nearArc(spec, ex, n, off) {
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push(rpt(spec, ex.lmn + ex.dir * ex.span * i / n, off));
      return pts;
    }
    function clampLam(ex, lam) {
      const norm = (a) => ((a % TAU) + TAU) % TAU;
      const d = ex.dir > 0 ? norm(lam - ex.lmn) : norm(ex.lmn - lam);
      if (d <= ex.span) return lam;
      const toEnd = d - ex.span, toStart = TAU - d;
      return toEnd < toStart ? ex.lmx : ex.lmn;
    }
    const torsoSpec = (h) => { const L = lvl(h); return ring({ h, W: L.W * shwAt(h), D: L.D, f: L.f }); };

    // ---- torso silhouette
    const tl = [], tr = [];
    for (const L of levels) {
      const ex = extremes(torsoSpec(L.h));
      tl.push(ex.pmn); tr.push(ex.pmx);
    }
    const topC = pr(J.body(B.neckF, levels[levels.length - 1].h + 4, 0));
    const botC = pr(J.body(0, levels[0].h - 8, 0, P.hipTwist));
    const torsoPts = [botC].concat(tr, [topC], tl.slice().reverse());
    const torsoPath = smooth(torsoPts, true);

    const groups = [];
    const addG = (z, fn) => groups.push({ z, fn });

    // ---- legs
    const legOrder = [];
    for (const k of ['R', 'L']) {
      const hip = Q['hip' + k], knee = Q['knee' + k], ankle = Q['ankle' + k];
      const heel = Q['heel' + k], toe = Q['toe' + k];
      const z = (hip.z + knee.z + ankle.z) / 3 + (k === 'R' ? 0.01 : 0);
      legOrder.push(k);
      addG(z, () => drawLeg(k, hip, knee, ankle, heel, toe));
    }
    function drawLeg(k, hip, knee, ankle, heel, toe) {
      const parts = [];
      const calf = 0.16 * sY;
      const out = def.outfit;
      const thighC = out.legThigh(pal), shinC = out.legShin(pal);
      const thigh = { p: capsule(hip, knee, B.thighR[0], B.thighR[1], 0.06, 0.04), c: thighC, k: 8, z: (hip.z + knee.z) / 2, ord: 2 };
      const shin = { p: capsule(knee, ankle, B.shinR[0], B.shinR[1], -calf * 0.3, calf), c: shinC, k: 6, z: (knee.z + ankle.z) / 2, ord: 1 };
      const fd = pr(J['fd' + k]), nd = pr(J['nd' + k]);
      const fw = 1 + 0.25 * abs(cY);
      const sA = { x: ankle.x + nd.x * 6 - fd.x * 5, y: ankle.y + nd.y * 6 - fd.y * 5 };
      const sT = { x: toe.x - fd.x * 10 - nd.x * 2, y: toe.y - fd.y * 10 - nd.y * 2 - 4 };
      const shoe = { p: capsule(sA, sT, B.shoeR[0] * fw, B.shoeR[1] * fw, -0.12, 0.05), c: out.shoe(pal), k: 5, z: (ankle.z + toe.z) / 2 + 0.5, ord: 0, sole: true };
      parts.push(thigh, shin, shoe);
      const extra = out.legExtra ? out.legExtra(pal, { hip, knee, ankle, k, lp2, capsule, B }) : [];
      parts.sort((a, b) => (a.z - b.z) || (a.ord - b.ord));
      // shoe always after shin if they are close in depth
      for (const e of extra) { e.z = shin.z; e.ord = 1.5; parts.push(e); }
      parts.sort((a, b) => (a.z - b.z) || (a.ord - b.ord));
      drawParts(G, parts);
      // sole band
      crescent(ctx, shoe.p, -nd.x * 5, -nd.y * 5, out.sole(pal));
      ctx.lineWidth = lw * 0.6; ctx.strokeStyle = G.line;
      if (out.legDetail) out.legDetail(G, pal, { hip, knee, ankle, sA, sT, shoe, k, nd, fd });
    }

    const legMaxZ = max(groups[0].z, groups[1].z);
    const coverZ = legMaxZ + 0.5;
    const legMinZ = min(groups[0].z, groups[1].z);
    // ---- arms
    for (const k of ['R', 'L']) {
      const sh = Q['sh' + k], el = Q['elbow' + k], wr = Q['wrist' + k];
      let z = (sh.z + el.z * 1.5 + wr.z * 1.5) / 4;
      if (z > 4 || P.hold) z = max(z, coverZ + 1);
      if (P.hold) z = coverZ + 1 + 30 * abs(cY) + (sh.z > 1 ? 1 : 0);
      addG(z, () => drawArm(k, sh, el, wr));
    }
    function drawHand(k, wr, dir, kind) {
      const hc = { x: wr.x + dir.x * 11, y: wr.y + dir.y * 11 };
      const hr = B.handR;
      const ang = atan2(dir.y, dir.x);
      const p = new Path2D();
      if (kind === 'fist') {
        p.ellipse(hc.x, hc.y, hr * 1.08, hr * 0.98, ang, 0, TAU);
      } else {
        const L = kind === 'cup' ? hr * 1.5 : hr * 1.75;
        const c = { x: wr.x + dir.x * L * 0.62, y: wr.y + dir.y * L * 0.62 };
        p.ellipse(c.x, c.y, L * 0.62, hr * (kind === 'flat' ? 0.78 : 0.86), ang, 0, TAU);
        // thumb
        const nx = -dir.y, ny = dir.x, ts = (k === 'R' ? 1 : -1) * (sY >= 0 ? 1 : -1);
        p.moveTo(wr.x + dir.x * 6 + nx * hr * 0.6 * ts, wr.y + dir.y * 6 + ny * hr * 0.6 * ts);
        p.ellipse(wr.x + dir.x * 12 + nx * hr * 0.7 * ts, wr.y + dir.y * 12 + ny * hr * 0.7 * ts, hr * 0.62, hr * 0.36, ang + 0.5 * ts, 0, TAU);
      }
      return { p, hc };
    }
    function drawArm(k, sh, el, wr) {
      const out = def.outfit;
      const dir = (() => { const dx = wr.x - el.x, dy = wr.y - el.y, L = hypot(dx, dy) || 1; return { x: dx / L, y: dy / L }; })();
      const hand = drawHand(k, wr, dir, P.hand[k]);
      const parts = [
        { p: capsule(sh, el, B.armR[0], B.armR[1], 0.04, 0.04), c: out.upperArm(pal), k: 6, z: (sh.z + el.z) / 2, ord: 0 },
        { p: capsule(el, wr, B.armR[1] * 0.98, B.armR[2], 0.05, 0.02), c: out.foreArm(pal), k: 5, z: (el.z + wr.z) / 2, ord: 1 },
        { p: hand.p, c: out.hand(pal), k: 4, z: wr.z + 0.5, ord: 3 },
      ];
      if (out.armExtra) for (const e of out.armExtra(pal, { sh, el, wr, lp2, capsule, B })) { e.z = (el.z + wr.z) / 2; e.ord = 2; parts.push(e); }
      parts.sort((a, b) => (a.z - b.z) || (a.ord - b.ord));
      drawParts(G, parts);
      if (out.armDetail) out.armDetail(G, pal, { sh, el, wr, k, dir, hand, lp2, capsule, B, P });
      if (P.hand[k] === 'fist') {
        ctx.lineWidth = lw * 0.5; ctx.strokeStyle = G.line;
        const nx = -dir.y, ny = dir.x;
        ctx.beginPath();
        ctx.moveTo(hand.hc.x + nx * B.handR * 0.5 + dir.x * 2, hand.hc.y + ny * B.handR * 0.5 + dir.y * 2);
        ctx.quadraticCurveTo(hand.hc.x + dir.x * 8, hand.hc.y + dir.y * 8, hand.hc.x - nx * B.handR * 0.5 + dir.x * 2, hand.hc.y - ny * B.handR * 0.5 + dir.y * 2);
        ctx.stroke();
      }
    }

    // ---- torso group
    addG(0, () => {
      const out = def.outfit;
      const tp = { p: torsoPath, c: out.torso(pal), k: 12, hk: 0 };
      drawParts(G, [tp]);
      ctx.save();
      ctx.clip(torsoPath);
      out.torsoDetail(G, pal, { torsoSpec, extremes, nearArc, clampLam, rpt, rnz, J, P, pr, B, torsoPath, sY, cY });
      ctx.restore();
      if (out.torsoAfter) out.torsoAfter(G, pal, { torsoSpec, extremes, nearArc, clampLam, rpt, rnz, J, P, pr, B, torsoPath, sY, cY });
      ctx.lineWidth = lw * 0.9; ctx.strokeStyle = G.line;
    });

    // ---- skirt / coat / cape / bag from outfit
    const env = { G, pal, J, P, pr, B, ring, rpt, rnz, extremes, nearArc, clampLam, torsoSpec, sY, cY, Q, o, lp2, capsule, smooth, addG, def, coverZ, legMinZ };
    def.outfit.extraGroups(env);

    // ---- head (neck, collar, face, hair) & ponytail
    const hs = Q.head;
    const hy = Y + P.head.turn;
    const sideNod = (P.head.pitch + P.lean * 0.25) * sin(hy);
    const HS = { cx: hs.x, cy: hs.y, R: def.head.R, hy, pitch: (P.head.pitch + P.lean * 0.15) * cos(hy), roll: P.head.roll + sideNod, o, P, env };
    if (def.head.backLayer) addG(-900, () => headLayer(G, def, HS, 'back'));
    addG(1e4, () => {
      // neck
      const nb = Q.neckBase, nt = Q.neckTop;
      const neckP = capsule(nb, { x: nt.x, y: nt.y - 6 }, B.neckR, B.neckR * 0.92);
      drawParts(G, [{ p: neckP, c: pal.skin, k: 4 }]);
      // chin shadow on neck
      ctx.save(); ctx.clip(neckP);
      ctx.fillStyle = pal.skin.s;
      ctx.beginPath(); ctx.ellipse(hs.x + 4 * sin(hy), hs.y + def.head.R * 0.98, def.head.R * 0.62, def.head.R * 0.42, 0, 0, TAU); ctx.fill();
      ctx.restore();
      if (def.outfit.collar) def.outfit.collar(G, pal, env);
      headLayer(G, def, HS, 'main');
    });

    groups.sort((a, b) => a.z - b.z);
    for (const g of groups) g.fn();
    ctx.restore();
    return F;
  }

  /* ------------------------------------------------------------------ head layer */
  function headLayer(G0, def, HS, stage) {
    const ctx = G0.ctx, R = HS.R, pal = G0.pal, o = HS.o, P = HS.P;
    const H = def.head, hair = H.hair;
    ctx.save();
    ctx.translate(HS.cx, HS.cy);
    ctx.rotate(HS.roll);
    ctx.scale(R, R);
    const G = Object.assign({}, G0, { lw: G0.lw / R, px: G0.px * R, rim: G0.rim ? Object.assign({}, G0.rim, { w: 0.07 }) : null });
    const hy = HS.hy;
    const sp = makeSphere(hy, HS.pitch);
    const t = o.t || 0;
    const speed = P.speed, ph = P.phase;

    if (stage === 'back') {
      if (hair.pony) drawPonytail(G, def, sp, hy, t, speed, ph);
      if (H.backLayerExtra) H.backLayerExtra(G, pal, { sp, hy, t, speed, ph });
      ctx.restore();
      return;
    }
    // ---- back hair mass
    {
      const pts = [];
      const rc = hair.capR || 1.07;
      for (let i = 0; i <= 12; i++) { const a = PI + i / 12 * PI; pts.push({ x: cos(a) * rc, y: sin(a) * rc - 0.01 }); }
      for (let i = 0; i <= 8; i++) for (const phi of [-0.35, 0.1]) pts.push(sp(PI / 2 + 0.25 + i / 8 * (PI - 0.5), phi, rc));
      for (const [lam, phi, r] of hair.backPts || []) pts.push(sp(lam, phi, r));
      const hp = smooth(hull(pts), true);
      drawParts(G, [{ p: hp, c: { b: pal.hair.s, s: mix(pal.hair.s, '#000000', 0.25) }, k: 0.1 }]);
    }
    // ---- ears (behind face when near the silhouette)
    const ears = [];
    for (const sg of [-1, 1]) {
      const lam = sg * (PI / 2 + 0.1);
      const e = sp(lam, -0.1, 1.0);
      ears.push({ e, a: lam + hy, sg });
    }
    const drawEar = (E) => {
      if (E.e.z < -0.25) return;
      const ca = abs(cos(E.a));
      const bk = -E.sg * (sin(E.a) >= 0 ? 1 : -1) * (sin(hy) >= 0 ? 1 : -1); // which screen side is "back of head"
      const back = sin(hy) >= 0 ? -1 : 1;
      const w = 0.05 + 0.07 * ca, x = E.e.x, y = E.e.y + 0.03;
      const pts = [P2(x + back * -0.02, y - 0.15), P2(x + back * w, y - 0.12), P2(x + back * w * 1.05, y + 0.02), P2(x + back * w * 0.5, y + 0.15), P2(x - back * 0.02, y + 0.13), P2(x - back * 0.03, y - 0.02)];
      const p = smooth(pts, true);
      drawParts(G, [{ p, c: pal.skin, k: 0.03 }]);
      if (ca > 0.35) {
        ctx.lineWidth = G.lw * 0.55; ctx.strokeStyle = mix(pal.skin.s, pal.line, 0.2);
        ctx.beginPath(); ctx.moveTo(x + back * w * 0.1, y - 0.08); ctx.quadraticCurveTo(x + back * w * 0.75, y - 0.06, x + back * w * 0.55, y + 0.04); ctx.quadraticCurveTo(x + back * w * 0.3, y + 0.09, x + back * w * 0.25, y + 0.03); ctx.stroke();
      }
    };
    for (const E of ears) if (E.e.z < 0.45) drawEar(E);
    // ---- face
    const fpts = faceOutline(hy, H.shape);
    const faceP = smooth(fpts, true);
    drawParts(G, [{ p: faceP, c: { b: pal.skin.b, s: mix(pal.skin.b, pal.skin.s, 0.55) }, k: 0.06 }]);
    for (const E of ears) if (E.e.z >= 0.45) drawEar(E);

    // ---- features
    const ex = EXPR[o.expr] || EXPR[def.exprDefault];
    const blink = clamp(o.blink || 0, 0, 1);
    let open = ex.open * (1 - blink);
    if (o.eyeOpen != null) open = o.eyeOpen;
    const mouthV = max(clamp(o.mouth || 0, 0, 1), ex.minM || 0);
    const ahy = abs(sin(hy));
    const hyF = hy * (0.52 + 0.48 * ahy * ahy * ahy * ahy);
    const spF = makeSphere(hyF, HS.pitch);
    // blush
    const blushA = (o.blush != null ? o.blush : ex.blush) * (H.blush != null ? H.blush : 1);
    if (blushA > 0) {
      for (const sg of [-1, 1]) {
        const b = spF(sg * 0.66, -0.4, 1);
        if (b.z < 0.15) continue;
        ctx.fillStyle = rgba(pal.blush, 0.34 * blushA);
        ctx.beginPath(); ctx.ellipse(b.x, b.y + 0.04, 0.17 * max(b.z, 0.4), 0.075, 0, 0, TAU); ctx.fill();
        if (blushA > 0.45 && H.blushLines) {
          ctx.strokeStyle = rgba(pal.blush, 0.8 * blushA); ctx.lineWidth = G.lw * 0.45;
          for (let i = -1; i <= 1; i++) { const x = b.x + i * 0.05 * b.z; ctx.beginPath(); ctx.moveTo(x + 0.02, b.y + 0.0); ctx.lineTo(x - 0.012, b.y + 0.07); ctx.stroke(); }
        }
      }
    }
    // eyes
    const eyes = [];
    const look = o.look || { x: 0, y: 0 };
    for (const sg of [-1, 1]) {
      const near = sg * sin(hy) < 0;
      const eyeL = H.eyeLam + (near ? 0.22 : -0.08) * ahy;
      const c = spF(sg * eyeL, H.eyePhi, 1);
      const a = sg * eyeL + hyF;
      const z = cos(a);
      if (z < 0.08) continue;
      const fx = 0.38 + 0.62 * clamp(z, 0, 1);
      eyes.push({
        x: c.x, y: c.y, w: H.eyeW, h: H.eyeH, side: sg, fx, open, tilt: ex.tilt, low: ex.low, pupil: ex.pupil,
        lookX: (look.x || 0) * sg + sin(hy) * 0.25 * sg, lookY: look.y || 0, iris: pal.iris, lash: pal.lash, sclera: pal.sclera,
        shadow: pal.skin.s, brow: pal.brow, closedShape: ex.closedShape, style: H.eyeStyle, fem: !def.masc, sparkle: o.expr === 'happy',
        rot: sg * (H.eyeRot || 0), browY: H.browY, browW: H.browW, halo: mix(pal.skin.b, pal.hair.b, 0.25), alpha: sstep((z - 0.08) / 0.15),
      });
    }
    for (const E of eyes) { ctx.save(); ctx.globalAlpha *= E.alpha; drawEye(G, E); ctx.restore(); }
    // nose
    {
      const n = spF(0.02, -0.42, 1.0);
      if (n.z > 0.2) {
        const su = sin(hy);
        ctx.strokeStyle = mix(pal.skin.s, pal.line, 0.25); ctx.lineWidth = G.lw * 0.6;
        ctx.beginPath(); ctx.moveTo(n.x + 0.012 * su, n.y - 0.035); ctx.lineTo(n.x + 0.03 * (su >= 0 ? 1 : -1) + 0.01, n.y + 0.03); ctx.lineTo(n.x - 0.005, n.y + 0.04); ctx.stroke();
      }
    }
    // mouth
    {
      const m = spF(0.0, H.mouthPhi || -0.62, 1.0);
      const cz = max(cos(hy), 0);
      drawMouth(G, {
        x: m.x + 0.06 * sin(hy), y: m.y + 0.02, w: H.mouthW || 0.26, fx: (0.32 + 0.68 * cz) * (sin(hy) < -0.01 ? -1 : 1),
        m: mouthV, base: ex.mouth, inner: pal.mouthIn, tongue: pal.tongue, vowel: o.vowel,
      });
    }
    // ---- front hair: cap + bangs + locks (with soft shadow on skin)
    const hairC = { b: pal.hair.b, s: pal.hair.s, h: pal.hair.h };
    const cap = capPath(sp, hair);
    const strands = [];
    const sw = (i) => 0.025 * sin(t * 1.8 + i * 1.3) + 0.04 * speed * sin(TAU * 2 * ph - i * 0.7) - 0.05 * speed * sin(hy);
    (hair.bangs || []).forEach((b, i) => { const S = strandPts(sp, b, t, sw(i)); if (S.root.z > -0.12 && S.tip.z > -0.2) strands.push(S); });
    (hair.locks || []).forEach((b, i) => {
      const swl = 0.04 * sin(t * 1.6 + i * 2.1) + 0.08 * speed * sin(TAU * 2 * ph - 0.6 - i) - 0.12 * speed * sin(hy) * (b.r > 0 ? 1 : 1);
      const prof = abs(sin(b.r + hy));
      const S = strandPts(sp, Object.assign({}, b, { ft: b.ft + 0.05 * speed, w: b.w * (0.55 + 0.45 * prof) }), t, swl);
      if (S.root.z > -0.25) strands.push(S);
    });
    const strandPaths = strands.map((S) => smooth(S.pts, true));
    // shadow from hair on face
    ctx.save();
    ctx.clip(faceP);
    ctx.fillStyle = pal.skin.s;
    const shM = new DOMMatrix([1, 0, 0, 1, 0.03 * G.facing, 0.08]);
    const shadowP = new Path2D();
    shadowP.addPath(cap, shM);
    for (const sp2 of strandPaths) shadowP.addPath(sp2, shM);
    ctx.globalAlpha *= 0.85;
    ctx.fill(shadowP);
    ctx.restore();
    drawUnified(G, [cap].concat(strandPaths), hairC, 0.075, 0);
    // angel ring highlight
    {
      const ringPts = [], ringPts2 = [];
      for (let i = 0; i <= 16; i++) {
        const lam = -PI / 2 - hy + 0.25 + i * (PI - 0.5) / 16;
        const p1 = sp(lam, 0.66 + 0.03 * sin(i * 2.1), (hair.capR || 1.07) + 0.002);
        const p2 = sp(lam, (i % 2 ? 0.55 : 0.6), (hair.capR || 1.07) + 0.002);
        if (p1.z > 0.05) { ringPts.push(p1); ringPts2.push(p2); }
      }
      if (ringPts.length > 2) {
        ctx.save(); ctx.clip(cap);
        const p = new Path2D();
        p.moveTo(ringPts[0].x, ringPts[0].y);
        for (const q of ringPts) p.lineTo(q.x, q.y);
        for (let i = ringPts2.length - 1; i >= 0; i--) p.lineTo(ringPts2[i].x, ringPts2[i].y);
        p.closePath();
        ctx.fillStyle = rgba(pal.hair.ring, 0.75); ctx.fill(p);
        ctx.restore();
      }
    }
    // strand detail lines on cap
    ctx.strokeStyle = rgba(pal.hair.s, 0.9); ctx.lineWidth = G.lw * 0.5;
    for (const lam0 of hair.lines || [-0.5, 0.1, 0.6]) {
      const a = sp(lam0 - hy * 0, 0.95, 1.07), b = sp(lam0 + 0.15, 0.6, 1.07);
      if (a.z > 0 && b.z > 0.1) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2 + 0.03, (a.y + b.y) / 2, b.x, b.y); ctx.stroke(); }
    }
    // brows over hair (anime convention)
    for (const E of eyes) { ctx.save(); ctx.globalAlpha *= E.alpha * 0.95; drawBrow(G, E, ex); ctx.restore(); }
    // accessories
    if (H.accessory) H.accessory(G, pal, { sp, hy, t, speed, ph, o, cap });
    ctx.restore();
  }

  function drawPonytail(G, def, sp, hy, t, speed, ph) {
    const ctx = G.ctx, pal = G.pal, pc = def.head.hair.pony;
    const lam0 = pc.lam, phi0 = pc.phi;
    let cur = [cos(phi0) * cos(lam0) * 1.02, -sin(phi0) * 1.02, cos(phi0) * sin(lam0) * 1.02];
    const pts = [hproj(hy, cur)];
    const n = pc.n;
    let a = lerp(pc.a0, pc.aRun, speed);
    for (let i = 0; i < n; i++) {
      const wave = 0.2 * speed * sin(2 * TAU * ph - 1.3 - i * 0.6) + 0.07 * sin(t * 1.9 - i * 0.5) + (pc.curl || 0) * i;
      const ai = a + wave + (speed ? -0.05 * i : 0.04 * i);
      const si = 0.14 * speed * sin(TAU * ph - i * 0.55) + 0.06 * sin(t * 1.3 + 0.7 - i * 0.4);
      const d = [-sin(ai) * cos(si), cos(ai) * cos(si), sin(si)];
      cur = [cur[0] + d[0] * pc.len, cur[1] + d[1] * pc.len, cur[2] + d[2] * pc.len];
      pts.push(hproj(hy, cur));
    }
    const W = pc.w;
    const L = [], Rr = [];
    for (let i = 0; i < pts.length; i++) {
      const a0 = pts[max(i - 1, 0)], a1 = pts[min(i + 1, pts.length - 1)];
      let dx = a1.x - a0.x, dy = a1.y - a0.y; const l = hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = W[min(i, W.length - 1)];
      L.push({ x: pts[i].x - dy * w, y: pts[i].y + dx * w });
      Rr.push({ x: pts[i].x + dy * w, y: pts[i].y - dx * w });
    }
    const tip = pts[pts.length - 1];
    const outline = L.slice(0, -1).concat([{ x: tip.x, y: tip.y, c: 1 }], Rr.slice(0, -1).reverse());
    const p = smooth(outline, true);
    drawParts(G, [{ p, c: { b: pal.hair.b, s: pal.hair.s, h: pal.hair.h }, k: 0.12, hk: 0.04 }]);
    ctx.save(); ctx.clip(p);
    ctx.strokeStyle = rgba(pal.hair.s, 0.9); ctx.lineWidth = G.lw * 0.5;
    for (const off of [-0.35, 0.3]) {
      const q = pts.slice(1, -1).map((c, i) => { const w = W[min(i + 1, W.length - 1)] * off; const a0 = pts[i], a1 = pts[i + 2]; let dx = a1.x - a0.x, dy = a1.y - a0.y; const l = hypot(dx, dy) || 1; return { x: c.x - dy / l * w, y: c.y + dx / l * w }; });
      if (q.length > 1) { ctx.beginPath(); addSmoothCtx(ctx, q); ctx.stroke(); }
    }
    ctx.restore();
    if (def.head.hair.tie) def.head.hair.tie(G, pal, pts[0], pts[1]);
  }
  function addSmoothCtx(ctx, pts) {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) { const m = lp2(pts[i], pts[i + 1], 0.5); ctx.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); }
    const l = pts[pts.length - 1]; ctx.lineTo(l.x, l.y);
  }

  /* ------------------------------------------------------------------ outfits */
  function o2Orb(ctx, x, y, r, t, facing) {
    const pulse = 1 + 0.06 * sin(t * 5);
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2 * pulse);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.28, 'rgba(190,240,255,0.85)');
    g.addColorStop(0.55, 'rgba(110,200,255,0.35)');
    g.addColorStop(1, 'rgba(110,200,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 2.2 * pulse, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    const g2 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.6, '#d8f6ff'); g2.addColorStop(1, '#8fd8ff');
    ctx.fillStyle = g2; ctx.fill();
    ctx.lineWidth = r * 0.07; ctx.strokeStyle = 'rgba(80,170,230,0.9)'; ctx.stroke();
    ctx.translate(x, y); ctx.scale(facing, 1);
    ctx.fillStyle = '#1b5f93';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 ' + (r * 0.95).toFixed(1) + 'px "Zen Kaku Gothic New", "ZenKaku", "IPAGothic", sans-serif';
    ctx.fillText('O', -r * 0.12, 0);
    ctx.font = '700 ' + (r * 0.5).toFixed(1) + 'px "Zen Kaku Gothic New", "ZenKaku", "IPAGothic", sans-serif';
    ctx.fillText('2', r * 0.36, r * 0.28);
    ctx.restore();
  }
  function holdGroup(env) {
    const { P, Q, addG, o, G } = env;
    if (!P.hold || !o.holdO2) return;
    const a = Q.wristR, b = Q.wristL;
    const x = (a.x + b.x) / 2 - env.sY * 8, y = (a.y + b.y) / 2 - 18;
    addG(env.coverZ + 1.5 + 30 * abs(env.cY), () => o2Orb(G.ctx, x, y, 26, o.t || 0, G.facing));
  }

  // ---- Akane outfit
  const AKANE_OUT = {
    legThigh: (p) => p.skin,
    legShin: (p) => p.skin,
    shoe: (p) => p.shoe,
    sole: (p) => p.sole,
    upperArm: (p) => p.skin,
    foreArm: (p) => p.skin,
    hand: (p) => p.skin,
    torso: (p) => p.shirt,
    legExtra(pal, a) {
      // knee sock
      const top = a.lp2(a.knee, a.ankle, 0.16);
      return [{ p: a.capsule(top, a.ankle, a.B.shinR[0] * 1.03, a.B.shinR[1] * 1.08, 0, 0.1), c: pal.sock, k: 5, ol: 0.7, noStroke: true }];
    },
    legDetail(G, pal, a) {
      const ctx = G.ctx;
      const top = lp2(a.knee, a.ankle, 0.16), b2 = lp2(a.knee, a.ankle, 0.25);
      const dx = a.ankle.x - a.knee.x, dy = a.ankle.y - a.knee.y, L = hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const r = 17;
      ctx.lineWidth = 5; ctx.strokeStyle = pal.sockBand;
      ctx.beginPath(); ctx.moveTo(b2.x + nx * r * 0.95, b2.y + ny * r * 0.95); ctx.lineTo(b2.x - nx * r * 0.95, b2.y - ny * r * 0.95); ctx.stroke();
      // shoe strap
      const m = lp2(a.sA, a.sT, 0.45);
      ctx.lineWidth = 4; ctx.strokeStyle = pal.sole;
      ctx.beginPath(); ctx.moveTo(m.x - a.nd.x * 10, m.y - a.nd.y * 10); ctx.lineTo(m.x + a.fd.x * 2 - a.nd.x * 2, m.y + a.fd.y * 2 - a.nd.y * 2); ctx.stroke();
    },
    armDetail(G, pal, a) {
      const ctx = G.ctx;
      // puff sleeve over upper arm
      const e = a.lp2(a.sh, a.el, 0.58);
      const sl = a.capsule(a.sh, e, a.B.armR[0] * 1.3, a.B.armR[1] * 1.28, 0.1, 0.1);
      drawParts(G, [{ p: sl, c: pal.jacket, k: 6, hk: 2 }]);
      // cuff piping
      ctx.save(); ctx.clip(sl);
      crescent(ctx, sl, (a.sh.x - e.x) * 0.1, (a.sh.y - e.y) * 0.1, pal.piping);
      ctx.restore();
      ctx.lineWidth = G.lw * 0.8; ctx.strokeStyle = G.line; ctx.stroke(sl);
    },
    armExtra(pal, a) {
      const w0 = a.lp2(a.el, a.wr, 0.84);
      return [{ p: a.capsule(w0, a.wr, a.B.armR[2] * 1.2, a.B.armR[2] * 1.2), c: { b: pal.cuff, s: pal.tie.s }, k: 3 }];
    },
    torsoDetail(G, pal, T) {
      const ctx = G.ctx;
      // cropped jacket (bolero) above the bust line, open at the front
      const sp = T.torsoSpec(T.B.jacketH), ex = T.extremes(sp);
      const arc = T.nearArc(sp, ex, 14, 2);
      const p = new Path2D();
      p.moveTo(arc[0].x - 60, arc[0].y + 4);
      for (const q of arc) p.lineTo(q.x, q.y);
      p.lineTo(arc[arc.length - 1].x + 60, arc[arc.length - 1].y + 4);
      p.lineTo(arc[arc.length - 1].x + 60, arc[arc.length - 1].y - 400);
      p.lineTo(arc[0].x - 60, arc[0].y - 400);
      p.closePath();
      // front opening (shirt visible)
      const op = new Path2D();
      const hs = [T.B.jacketH - 6, T.B.jacketH + 20, T.B.jacketH + 45, T.B.neckH - 6, T.B.neckH + 8];
      const ws = [0.62, 0.5, 0.36, 0.28, 0.3];
      const left = [], right = [];
      hs.forEach((h, i) => {
        const s2 = T.torsoSpec(h), e2 = T.extremes(s2);
        left.push(T.rpt(s2, T.clampLam(e2, ws[i]), 1));
        right.push(T.rpt(s2, T.clampLam(e2, -ws[i]), 1));
      });
      const jp = new Path2D(p);
      ctx.save();
      // jacket with opening cut out (evenodd)
      const cut = new Path2D();
      addSmooth(cut, right.concat(left.slice().reverse()), true);
      const jac = new Path2D();
      jac.addPath(jp);
      jac.addPath(cut);
      ctx.clip(jac, 'evenodd');
      ctx.fillStyle = pal.jacket.b; ctx.fillRect(-BIG, -BIG, 2 * BIG, 2 * BIG);
      crescent(ctx, T.torsoPath, -0.5 * 14 * G.facing, -0.86 * 14, pal.jacket.s);
      crescent(ctx, T.torsoPath, 0.55 * 3 * G.facing, 0.85 * 3, pal.jacket.h);
      if (G.rim) crescent(ctx, T.torsoPath, -G.rim.dir * G.rim.w * G.facing, 0, G.rim.color, G.rim.strength);
      ctx.restore();
      // piping / lapel edges
      ctx.lineWidth = 3.5; ctx.strokeStyle = pal.piping;
      ctx.beginPath(); addSmoothCtx(ctx, right); ctx.stroke();
      ctx.beginPath(); addSmoothCtx(ctx, left); ctx.stroke();
      ctx.beginPath(); addSmoothCtx(ctx, arc); ctx.stroke();
      ctx.lineWidth = G.lw * 0.7; ctx.strokeStyle = G.line;
      ctx.beginPath(); addSmoothCtx(ctx, right); ctx.stroke();
      ctx.beginPath(); addSmoothCtx(ctx, left); ctx.stroke();
      ctx.beginPath(); addSmoothCtx(ctx, arc.map((q) => ({ x: q.x, y: q.y + 2 }))); ctx.stroke();
      // satchel strap: left shoulder -> right hip, across the chest
      const N = 9, sp1 = [];
      for (let i = 0; i <= N; i++) {
        const k = i / N;
        const h = lerp(T.B.neckH - 8, 8, k), lam = lerp(1.25, -1.75, k);
        const s3 = T.torsoSpec(h);
        if (T.rnz(s3, lam) > -0.05) sp1.push(T.rpt(s3, lam, 3));
        else if (sp1.length) break;
      }
      if (sp1.length > 1) {
        ctx.lineCap = 'butt';
        ctx.lineWidth = 13 + G.lw * 2; ctx.strokeStyle = G.line; ctx.beginPath(); addSmoothCtx(ctx, sp1); ctx.stroke();
        ctx.lineWidth = 13; ctx.strokeStyle = pal.strap; ctx.beginPath(); addSmoothCtx(ctx, sp1); ctx.stroke();
        ctx.lineWidth = 1.6; ctx.strokeStyle = rgba('#ffe0b0', 0.6); ctx.setLineDash([5, 5]); ctx.beginPath(); addSmoothCtx(ctx, sp1); ctx.stroke(); ctx.setLineDash([]);
        ctx.lineCap = 'round';
      }
    },
    collar(G, pal, env) {
      const ctx = G.ctx;
      const { J, pr, torsoSpec, rpt, extremes, clampLam, rnz, B } = env;
      const h = B.neckH - 2, s = torsoSpec(h), ex = extremes(s);
      // shirt collar points + ribbon tie
      const c0 = rpt(s, clampLam(ex, 0), 2);
      if (rnz(s, 0) > -0.1) {
        const pts = [];
        for (const sg of [-1, 1]) {
          const a = rpt(s, clampLam(ex, sg * 0.9), 4), b = rpt(s, clampLam(ex, sg * 0.12), 4);
          const tip = { x: lerp(a.x, b.x, 0.55), y: b.y + 16 };
          pts.push(poly([a, b, tip]));
        }
        drawParts(G, pts.map((p) => ({ p, c: pal.shirt, k: 3 })));
        // bow
        const bw = 15 * max(abs(env.cY), 0.45);
        const bow = new Path2D();
        bow.moveTo(c0.x, c0.y + 4);
        bow.lineTo(c0.x - bw, c0.y - 4); bow.lineTo(c0.x - bw, c0.y + 12); bow.closePath();
        bow.moveTo(c0.x, c0.y + 4);
        bow.lineTo(c0.x + bw, c0.y - 4); bow.lineTo(c0.x + bw, c0.y + 12); bow.closePath();
        const tails = new Path2D();
        tails.moveTo(c0.x - 3, c0.y + 6); tails.lineTo(c0.x - 9 * abs(env.cY) - 3, c0.y + 30); tails.lineTo(c0.x - 1, c0.y + 26); tails.lineTo(c0.x + 4, c0.y + 6); tails.closePath();
        tails.moveTo(c0.x + 2, c0.y + 6); tails.lineTo(c0.x + 9 * abs(env.cY) + 5, c0.y + 28); tails.lineTo(c0.x + 9, c0.y + 24); tails.closePath();
        drawParts(G, [{ p: tails, c: pal.tie, k: 2 }, { p: bow, c: pal.tie, k: 2 }]);
        const knot = new Path2D(); knot.ellipse(c0.x, c0.y + 4, 5, 6, 0, 0, TAU);
        drawParts(G, [{ p: knot, c: { b: pal.tie.s }, k: 0 }]);
      }
    },
    extraGroups(env) {
      const { G, pal, J, P, pr, B, ring, rpt, extremes, nearArc, addG, sY, cY, o, Q } = env;
      const ctx = G.ctx, t = o.t || 0;
      // --- cape (behind)
      addG(-1000, () => {
        const top = [], bot = [], mid = [];
        const lams = [1.45, 2.1, 2.65, PI, -2.65, -2.1, -1.45];
        const sp = env.torsoSpec(B.shH + 6);
        lams.forEach((lam, j) => {
          const a0 = rpt(sp, lam, 2);
          const p3 = J.body(sp.f + (sp.D + 2) * cos(lam), sp.h, (sp.W + 2) * sin(lam), sp.tw);
          const back = -cos(lam), side = sin(lam);
          const fl = sin(t * 7.5 - j * 0.9 + P.phase * TAU * 2) * P.speed + 0.35 * sin(t * 1.7 + j * 0.8);
          const ang = lerp(0.1, 0.95, P.speed) + 0.1 * fl + 0.25 * P.crouch + P.speed * (back > 0.8 ? 0.35 : -0.25 * (1 - back));
          const len = B.capeLen * (0.92 + 0.08 * back) * (1 - 0.15 * P.crouch);
          const spread = 0.25 + 0.15 * P.speed;
          const d = [-sin(ang) * (0.6 + 0.4 * back) - 0.1, cos(ang), side * spread];
          const tw = P.twist * 0.6, c = cos(tw), s2 = sin(tw);
          const df = d[0] * c - d[2] * s2, dl = d[0] * s2 + d[2] * c;
          const m3 = [p3[0] + df * len * 0.5, p3[1] + d[1] * len * 0.5, p3[2] + dl * len * 0.5];
          const ang2 = ang + 0.12 * fl * P.speed + 0.05;
          const d2 = [-sin(ang2) * (0.6 + 0.4 * back) - 0.1, cos(ang2), side * spread * 1.2];
          const b3 = [m3[0] + d2[0] * len * 0.5 * c - d2[2] * s2 * len * 0.5, m3[1] + d2[1] * len * 0.5, m3[2] + (d2[0] * s2 + d2[2] * c) * len * 0.5];
          top.push(a0); mid.push(pr(m3)); bot.push(pr(b3));
        });
        // hem with a scallop
        const hem = [];
        for (let j = 0; j < bot.length; j++) { hem.push(bot[j]); if (j < bot.length - 1) { const m = lp2(bot[j], bot[j + 1], 0.5); hem.push({ x: m.x, y: m.y - 7 }); } }
        const outline = top.concat(hem.slice().reverse());
        // orientation decides outer/lining colour
        let area = 0;
        for (let i = 0; i < outline.length; i++) { const a = outline[i], b = outline[(i + 1) % outline.length]; area += a.x * b.y - b.x * a.y; }
        const front = area * (sY >= 0 ? 1 : -1) < 0;
        const col = front ? pal.cape : { b: pal.lining.b, s: pal.lining.s };
        const allP = smooth(top.concat([mid[mid.length - 1]], hem.slice().reverse(), [mid[0]]), true);
        drawParts(G, [{ p: allP, c: col, k: 12, hk: 3 }]);
        // folds
        ctx.save(); ctx.clip(allP);
        ctx.strokeStyle = rgba(pal.cape.s, 0.9); ctx.lineWidth = G.lw * 0.6;
        for (const j of [1, 3, 5]) { ctx.beginPath(); ctx.moveTo(top[j].x, top[j].y + 8); ctx.quadraticCurveTo(mid[j].x, mid[j].y, bot[j].x, bot[j].y - 4); ctx.stroke(); }
        ctx.restore();
      });
      // --- skirt (pleated), over the thighs
      const zSk = env.coverZ;
      addG(zSk, () => {
        const thR = P.legs.R.th, thL = P.legs.L.th;
        const top = ring({ h: B.waistH, W: env.torsoSpec(B.waistH).W + 1, D: env.torsoSpec(B.waistH).D + 1, f: env.torsoSpec(B.waistH).f, lk: 1 });
        const hemDisp = (lam) => {
          const wr = clamp(-sin(lam) * 1.3 + 0.5, 0, 1), wl = clamp(sin(lam) * 1.3 + 0.5, 0, 1);
          const push = (wr * sin(thR) + wl * sin(thL)) / max(wr + wl, 0.01);
          const fl = 3 * sin(t * 8 + lam * 3) * P.speed + 1.5 * sin(t * 1.5 + lam * 2);
          const back = -cos(lam);
          return [push * 38 - P.speed * 10 * max(back, 0) - 4 * P.speed, fl + P.speed * 8 * max(back, 0) + 6 * P.crouch * max(cos(lam), 0), 0];
        };
        const hem = ring({ h: B.hemH, W: B.hemW, D: B.hemD, f: -2, tw: P.hipTwist, lk: 0.35, disp: hemDisp });
        const et = extremes(top), eh = extremes(hem);
        const ta = nearArc(top, et, 12), ha = nearArc(hem, eh, 20);
        // scallop the hem a little (pleats)
        const hz = ha.map((p, i) => ({ x: p.x, y: p.y + (i % 2 ? -3 : 1.5) }));
        const pth = new Path2D();
        addSmooth(pth, hz, false);
        pth.lineTo(et.pmx.x, et.pmx.y);
        for (let i = ta.length - 1; i >= 0; i--) pth.lineTo(ta[i].x, ta[i].y);
        pth.closePath();
        drawParts(G, [{ p: pth, c: pal.skirt, k: 9, hk: 2 }]);
        ctx.save(); ctx.clip(pth);
        ctx.lineWidth = G.lw * 0.55; ctx.strokeStyle = pal.skirt.s;
        for (let i = 2; i < 20; i += 2) {
          const k = i / 20;
          const a = rpt(top, et.lmn + et.dir * et.span * k), b = ha[i];
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        // waistband
        ctx.lineWidth = 7; ctx.strokeStyle = pal.skirt.s;
        ctx.beginPath(); addSmoothCtx(ctx, ta.map((q) => ({ x: q.x, y: q.y + 3 }))); ctx.stroke();
        ctx.restore();
      });
      // --- satchel on the right hip
      const bagC = J.body(-4, 2, -(B.hipW + 34), P.hipTwist, 0.3);
      const bp = pr(bagC);
      addG(zSk + 0.5 + (bp.z < -5 ? -60 : 0), () => {
        const sw = 4 * sin(TAU * P.phase * 2 - 1) * P.speed;
        const bx = bp.x - 8 * P.speed + sw * 0.3, by = bp.y + 10 + sw;
        const w = 30 * (0.42 + 0.58 * abs(cY)) + 8 * abs(sY) * 0.4, h = 36;
        const ang = -0.12 * P.speed;
        const body = new Path2D();
        const pts = [P2(bx - w, by - h * 0.5), P2(bx + w, by - h * 0.5), P2(bx + w * 1.02, by + h * 0.35), P2(bx + w * 0.8, by + h * 0.55), P2(bx - w * 0.8, by + h * 0.55), P2(bx - w * 1.02, by + h * 0.35)];
        addSmooth(body, pts, true);
        const flap = new Path2D();
        addSmooth(flap, [P2(bx - w * 1.04, by - h * 0.55), P2(bx + w * 1.04, by - h * 0.55), P2(bx + w * 0.95, by + h * 0.05), P2(bx, by + h * 0.18), P2(bx - w * 0.95, by + h * 0.05)], true);
        ctx.save(); ctx.translate(bx, by); ctx.rotate(ang); ctx.translate(-bx, -by);
        drawParts(G, [{ p: body, c: pal.bag, k: 6, hk: 2 }, { p: flap, c: { b: pal.bag.h, s: pal.bag.b }, k: 4 }]);
        drawDiscEmblem(ctx, bx, by - h * 0.12, 11, max(abs(cY), 0.35), { rim: pal.emblemRim, ring: pal.emblemRing, core: pal.emblemCore }, G.lw * 0.6, G.line);
        ctx.restore();
      });
      holdGroup(env);
    },
  };

  // ---- squad (white blood cell) outfit, shared by Shirou and allies
  function squadOutfit(opt) {
    opt = opt || {};
    return {
      legThigh: (p) => p.pants,
      legShin: (p) => p.pants,
      shoe: (p) => p.boot,
      sole: (p) => p.sole,
      upperArm: (p) => p.coat,
      foreArm: (p) => p.coat,
      hand: (p) => p.glove,
      torso: (p) => p.coat,
      legExtra(pal, a) {
        const top = a.lp2(a.knee, a.ankle, 0.5);
        return [{ p: a.capsule(top, a.ankle, a.B.shinR[0] * 1.08, a.B.shinR[1] * 1.22, 0, 0.1), c: pal.boot, k: 5, ol: 0.7, noStroke: true }];
      },
      legDetail(G, pal, a) {
        const ctx = G.ctx;
        const b2 = lp2(a.knee, a.ankle, 0.58);
        const dx = a.ankle.x - a.knee.x, dy = a.ankle.y - a.knee.y, L = hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        ctx.lineWidth = 4; ctx.strokeStyle = pal.accent.b;
        ctx.beginPath(); ctx.moveTo(b2.x + nx * 15, b2.y + ny * 15); ctx.lineTo(b2.x - nx * 15, b2.y - ny * 15); ctx.stroke();
      },
      armExtra(pal, a) {
        const w0 = a.lp2(a.el, a.wr, 0.74);
        return [{ p: a.capsule(w0, a.wr, a.B.armR[2] * 1.22, a.B.armR[2] * 1.25), c: pal.accent, k: 3 }];
      },
      armDetail(G, pal, a) {
        const ctx = G.ctx;
        const s1 = a.lp2(a.sh, a.el, 0.3);
        ctx.lineWidth = 3; ctx.strokeStyle = pal.accent.b;
        const n = { x: -(a.el.y - a.sh.y), y: a.el.x - a.sh.x }, L = hypot(n.x, n.y) || 1;
        ctx.beginPath(); ctx.moveTo(s1.x + n.x / L * a.B.armR[0], s1.y + n.y / L * a.B.armR[0]); ctx.lineTo(s1.x - n.x / L * a.B.armR[0], s1.y - n.y / L * a.B.armR[0]); ctx.stroke();
      },
      torsoDetail(G, pal, T) {
        const ctx = G.ctx;
        // front closure stripe (offset), belt, chest emblem
        const pts = [], pts2 = [];
        for (let i = 0; i <= 8; i++) {
          const h = lerp(T.B.waistH - 6, T.B.neckH - 4, i / 8);
          const s = T.torsoSpec(h), ex = T.extremes(s);
          const lam = lerp(0.1, 0.32, i / 8);
          if (T.rnz(s, lam) > -0.05) pts.push(T.rpt(s, T.clampLam(ex, lam), 1));
          if (T.rnz(s, lam + 0.12) > -0.05) pts2.push(T.rpt(s, T.clampLam(ex, lam + 0.12), 1));
        }
        if (pts.length > 1) {
          ctx.lineWidth = 7; ctx.strokeStyle = pal.accent.b; ctx.beginPath(); addSmoothCtx(ctx, pts2.length > 1 ? pts2 : pts); ctx.stroke();
          ctx.lineWidth = G.lw * 0.7; ctx.strokeStyle = G.line; ctx.beginPath(); addSmoothCtx(ctx, pts); ctx.stroke();
        }
        // belt
        const bs = T.torsoSpec(T.B.waistH), be = T.extremes(bs);
        const top = T.nearArc(bs, be, 14, 2).map((q) => ({ x: q.x, y: q.y - 7 })), bot = T.nearArc(bs, be, 14, 2).map((q) => ({ x: q.x, y: q.y + 7 }));
        const belt = new Path2D();
        addSmooth(belt, top, false);
        addSmooth(belt, bot.slice().reverse(), false, false);
        belt.closePath();
        drawParts(G, [{ p: belt, c: pal.accent, k: 4 }]);
        if (T.rnz(bs, 0.05) > 0.1) {
          const bk = T.rpt(bs, 0.05, 3);
          const sc = max(T.rnz(bs, 0.05), 0.3);
          const bp = new Path2D(); bp.rect(bk.x - 9 * sc, bk.y - 8, 18 * sc, 16);
          drawParts(G, [{ p: bp, c: { b: pal.buckle, s: mix(pal.buckle, '#000000', 0.25) }, k: 2 }]);
        }
        // emblem
        const es = T.torsoSpec(T.B.emblemH), lam = 0.55;
        const nz = T.rnz(es, lam);
        if (nz > 0.12) {
          const c = T.rpt(es, lam, 2);
          drawNucleusEmblem(ctx, c.x, c.y, 15, nz, pal, G.lw * 0.6, G.line, opt.nucleus || 'seg');
        }
      },
      collar(G, pal, env) {
        const { torsoSpec, rpt, extremes, nearArc, B } = env;
        const s0 = env.ring({ h: B.neckH - 4, W: B.neckR + 7, D: B.neckR + 6, f: B.neckF + 1 });
        const s1 = env.ring({ h: B.neckH + 11, W: B.neckR + 8, D: B.neckR + 7, f: B.neckF + 2, disp: (lam) => [0, -8 * max(cos(lam), 0) * max(cos(lam), 0), 0] });
        const e0 = extremes(s0), e1 = extremes(s1);
        const a0 = nearArc(s0, e0, 12), a1 = nearArc(s1, e1, 12);
        // open-front stand collar: split at front centre
        const p = new Path2D();
        addSmooth(p, a0, false);
        addSmooth(p, a1.slice().reverse(), false, false);
        p.closePath();
        drawParts(G, [{ p, c: pal.accent, k: 4, hk: 1.5 }]);
        const f0 = rpt(s0, 0.0), f1 = rpt(s1, 0.0);
        if (env.rnz(s0, 0) > 0.1) {
          G.ctx.lineWidth = G.lw * 0.8; G.ctx.strokeStyle = G.line;
          G.ctx.beginPath(); G.ctx.moveTo(f0.x, f0.y); G.ctx.lineTo(f1.x, f1.y + 2); G.ctx.stroke();
        }
      },
      extraGroups(env) {
        const { G, pal, J, P, pr, B, ring, rpt, extremes, nearArc, addG, sY, cY, o } = env;
        const ctx = G.ctx, t = o.t || 0;
        const thR = P.legs.R.th, thL = P.legs.L.th;
        const topS = () => ring({ h: B.waistH, W: env.torsoSpec(B.waistH).W + 2, D: env.torsoSpec(B.waistH).D + 2, f: env.torsoSpec(B.waistH).f, lk: 1 });
        const hemDisp = (lam) => {
          const back = -cos(lam);
          const wr = clamp(-sin(lam) * 1.4 + 0.5, 0, 1), wl = clamp(sin(lam) * 1.4 + 0.5, 0, 1);
          const push = (wr * sin(thR) + wl * sin(thL)) / max(wr + wl, 0.01) * max(cos(lam), 0);
          const fl = sin(t * 8 - lam * 2 + P.phase * TAU * 2) * P.speed;
          return [push * 55 - P.speed * (40 + 12 * fl) * max(back, 0) - 6 * P.speed, P.speed * (30 + 12 * fl) * max(back, 0) + 2 * sin(t * 1.4 + lam * 2) + 30 * P.crouch * max(back, 0), 0];
        };
        const hemS = () => ring({ h: B.coatH, W: B.coatW, D: B.coatD, f: -3, tw: P.hipTwist, lk: 0.3, disp: hemDisp });
        // back piece (lining visible in the front gap)
        addG(env.legMinZ - 0.5, () => {
          const top = topS(), hem = hemS();
          const et = extremes(top), eh = extremes(hem);
          // full silhouette: hem far arc too
          const ha = [];
          for (let i = 0; i <= 24; i++) ha.push(rpt(hem, eh.lmn - eh.dir * (TAU - eh.span) * i / 24));
          const ta = nearArc(top, et, 10);
          const pth = new Path2D();
          addSmooth(pth, ha, false);
          pth.lineTo(et.pmx.x, et.pmx.y);
          for (let i = ta.length - 1; i >= 0; i--) pth.lineTo(ta[i].x, ta[i].y);
          pth.closePath();
          const hn = nearArc(hem, eh, 24);
          const p2 = new Path2D();
          addSmooth(p2, hn, false);
          pth.addPath(p2);
          drawParts(G, [{ p: pth, c: pal.lining, k: 8 }]);
        });
        // front panels
        addG(env.coverZ, () => {
          const top = topS(), hem = hemS();
          const et = extremes(top), eh = extremes(hem);
          for (const sg of [-1, 1]) {
            const a = 0.16, b = 2.0;
            const tp = [], hp = [];
            for (let i = 0; i <= 10; i++) {
              const lam = sg * lerp(a, b, i / 10);
              tp.push(rpt(top, env.clampLam(et, lam)));
              hp.push(rpt(hem, env.clampLam(eh, lam)));
            }
            let vis = 0;
            for (let i = 0; i <= 10; i++) if (env.rnz(hem, sg * lerp(a, b, i / 10)) > 0) vis++;
            if (vis < 1) continue;
            const pth = new Path2D();
            addSmooth(pth, tp, false);
            pth.lineTo(hp[hp.length - 1].x, hp[hp.length - 1].y);
            for (let i = hp.length - 1; i >= 0; i--) pth.lineTo(hp[i].x, hp[i].y);
            pth.closePath();
            drawParts(G, [{ p: pth, c: pal.coat, k: 10, hk: 2 }]);
            // accent edge on the front opening
            ctx.save(); ctx.clip(pth);
            ctx.lineWidth = 9; ctx.strokeStyle = pal.accent.b;
            ctx.beginPath(); ctx.moveTo(tp[0].x, tp[0].y); ctx.lineTo(hp[0].x, hp[0].y); ctx.stroke();
            ctx.lineWidth = 6;
            ctx.beginPath(); addSmoothCtx(ctx, hp.map((q) => ({ x: q.x, y: q.y - 2 }))); ctx.stroke();
            if (opt.granules) {
              ctx.fillStyle = opt.granules;
              for (let i = 1; i < 9; i++) { const q = lp2(tp[0], hp[0], i / 9); ctx.beginPath(); ctx.arc(q.x + sg * 6, q.y, 2.4, 0, TAU); ctx.fill(); }
            }
            ctx.restore();
            ctx.lineWidth = G.lw * 0.8; ctx.strokeStyle = G.line; ctx.stroke(pth);
          }
        });
        holdGroup(env);
      },
    };
  }
  function drawNucleusEmblem(ctx, x, y, r, fx, pal, lw, line, kind) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(max(fx, 0.1), 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = pal.emblemBg; ctx.fill();
    ctx.lineWidth = r * 0.2; ctx.strokeStyle = pal.accent.b; ctx.stroke();
    ctx.lineWidth = lw; ctx.strokeStyle = line; ctx.beginPath(); ctx.arc(0, 0, r * 1.1, 0, TAU); ctx.stroke();
    ctx.fillStyle = pal.nucleus; ctx.strokeStyle = pal.nucleus;
    if (kind === 'seg') { // neutrophil: 3 lobes joined by thin strands
      const L = [[-0.42, 0.18], [0.0, -0.3], [0.42, 0.16]];
      ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.moveTo(L[0][0] * r, L[0][1] * r); ctx.quadraticCurveTo(-0.25 * r, -0.2 * r, L[1][0] * r, L[1][1] * r); ctx.quadraticCurveTo(0.25 * r, -0.2 * r, L[2][0] * r, L[2][1] * r); ctx.stroke();
      for (const [a, b] of L) { ctx.beginPath(); ctx.ellipse(a * r, b * r, r * 0.26, r * 0.22, 0, 0, TAU); ctx.fill(); }
    } else if (kind === 'bi') { // eosinophil: 2 lobes + granules
      for (const a of [-0.32, 0.32]) { ctx.beginPath(); ctx.ellipse(a * r, 0, r * 0.28, r * 0.34, 0, 0, TAU); ctx.fill(); }
      ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.moveTo(-0.3 * r, 0); ctx.lineTo(0.3 * r, 0); ctx.stroke();
      ctx.fillStyle = pal.accent.b;
      for (const [a, b] of [[-0.6, -0.5], [0.55, -0.55], [0, 0.6], [0.6, 0.4], [-0.55, 0.5]]) { ctx.beginPath(); ctx.arc(a * r, b * r, r * 0.09, 0, TAU); ctx.fill(); }
    } else if (kind === 'baso') { // basophil: s-shaped nucleus hidden by dark granules
      ctx.lineWidth = r * 0.3; ctx.beginPath(); ctx.moveTo(-0.4 * r, -0.2 * r); ctx.bezierCurveTo(0, -0.6 * r, 0, 0.6 * r, 0.4 * r, 0.2 * r); ctx.stroke();
      ctx.fillStyle = '#2a1240';
      for (const [a, b] of [[-0.5, 0.3], [0.1, -0.5], [0.5, -0.2], [-0.1, 0.45], [0.35, 0.5], [-0.45, -0.45], [0, 0]]) { ctx.beginPath(); ctx.arc(a * r, b * r, r * 0.11, 0, TAU); ctx.fill(); }
    } else if (kind === 'kidney') { // monocyte
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.46, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = pal.emblemBg; ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r * 0.26, r * 0.22, 0, 0, TAU); ctx.fill();
    } else { // lymphocyte: large round nucleus
      ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ hair styles */
  function discTie(G, pal, a, b) {
    const ctx = G.ctx;
    ctx.save();
    const ang = atan2(b.y - a.y, b.x - a.x);
    ctx.translate(lerp(a.x, b.x, 0.25), lerp(a.y, b.y, 0.25));
    ctx.rotate(ang + PI / 2);
    const p = new Path2D(); p.ellipse(0, 0, 0.2, 0.1, 0, 0, TAU);
    drawParts(G, [{ p, c: { b: pal.tie.b, s: pal.tie.s }, k: 0.03 }]);
    ctx.fillStyle = pal.emblemCore;
    ctx.beginPath(); ctx.ellipse(0, 0, 0.07, 0.035, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  const AKANE_HAIR = {
    capR: 1.07,
    bound: [0.42, 0.02, -0.5],
    backPts: [[PI, -0.42, 1.0], [PI - 0.8, -0.38, 1.0], [PI + 0.8, -0.38, 1.0], [PI - 1.3, -0.2, 1.04], [PI + 1.3, -0.2, 1.04]],
    bangs: [
      { r: -0.95, t: -1.0, w: 0.26, ft: -0.08, curl: -0.02 },
      { r: -0.55, t: -0.66, w: 0.3, ft: -0.02 },
      { r: -0.18, t: -0.24, w: 0.28, ft: -0.1 },
      { r: 0.18, t: 0.26, w: 0.27, ft: 0.02 },
      { r: 0.55, t: 0.68, w: 0.3, ft: -0.06 },
      { r: 0.95, t: 1.02, w: 0.26, ft: -0.1, curl: 0.02 },
    ],
    locks: [
      { r: -1.36, t: -1.22, w: 0.17, ft: -0.82, rr: 0.32, bul: 1.12, tipR: 1.12, curl: -0.06 },
      { r: 1.36, t: 1.22, w: 0.17, ft: -0.82, rr: 0.32, bul: 1.12, tipR: 1.12, curl: 0.06 },
    ],
    lines: [-0.35, 0.25],
    pony: { lam: PI - 0.15, phi: 0.62, n: 7, len: 0.33, a0: 0.28, aRun: 1.15, curl: 0.0, w: [0.2, 0.3, 0.32, 0.3, 0.26, 0.2, 0.12, 0.0] },
    tie: discTie,
  };
  function akaneBeret(G, pal, A) {
    const ctx = G.ctx, sp = A.sp, hy = A.hy;
    const bob = 0.02 * sin(A.ph * TAU * 2) * A.speed;
    const c = sp(-0.3, 1.18, 1.0);
    const cx = c.x, cy = c.y - 0.08 + bob;
    const rot = 0.2 * sin(hy) - 0.16 * cos(hy);
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot);
    const body = new Path2D();
    addSmooth(body, [P2(-1.0, 0.1), P2(-0.9, -0.22), P2(-0.4, -0.42), P2(0.2, -0.44), P2(0.82, -0.3), P2(1.04, 0.02), P2(0.8, 0.28), P2(0, 0.36), P2(-0.8, 0.3)], true);
    drawParts(G, [{ p: body, c: pal.beret, k: 0.14, hk: 0.05 }]);
    // band
    const band = new Path2D();
    band.moveTo(-0.82, 0.18); band.quadraticCurveTo(0, 0.42, 0.84, 0.16);
    band.lineTo(0.78, 0.3); band.quadraticCurveTo(0, 0.5, -0.78, 0.3); band.closePath();
    ctx.save(); ctx.clip(body);
    ctx.fillStyle = pal.beretBand; ctx.fill(band);
    ctx.restore();
    // tab on top
    const tab = new Path2D(); tab.ellipse(0.1, -0.47, 0.08, 0.06, 0, 0, TAU);
    drawParts(G, [{ p: tab, c: pal.beret, k: 0.02 }]);
    ctx.restore();
    // emblem pin (front-left of beret)
    const e = sp(0.45, 0.72, 1.12);
    if (e.z > 0.05) drawDiscEmblem(ctx, e.x, e.y - 0.12 + bob, 0.2, 0.3 + 0.7 * e.z, { rim: pal.emblemRim, ring: pal.emblemRing, core: pal.emblemCore }, G.lw * 0.7, G.line);
  }

  function squadHeadset(G, pal, A) {
    const ctx = G.ctx, sp = A.sp, hy = A.hy;
    // band over the head (ear to ear through the crown)
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const phi = -0.05 + (PI - 0.1) * i / 20; // from right ear over the top to left ear
      const lam = phi < PI / 2 ? -PI / 2 - 0.04 : PI / 2 + 0.04;
      const ph2 = phi < PI / 2 ? phi : PI - phi;
      pts.push(sp(lam, ph2, 1.12));
    }
    let seg = [];
    const segs = [];
    for (const p of pts) { if (p.z > -0.1) seg.push(p); else { if (seg.length > 1) segs.push(seg); seg = []; } }
    if (seg.length > 1) segs.push(seg);
    for (const s of segs) {
      ctx.lineWidth = 0.1 + G.lw * 2; ctx.strokeStyle = G.line; ctx.beginPath(); addSmoothCtx(ctx, s); ctx.stroke();
      ctx.lineWidth = 0.1; ctx.strokeStyle = pal.headset.b; ctx.beginPath(); addSmoothCtx(ctx, s); ctx.stroke();
    }
    for (const sg of [-1, 1]) {
      const lam = sg * (PI / 2 + 0.06);
      const e = sp(lam, -0.08, 1.1);
      if (e.z < -0.3) continue;
      const a = lam + hy, ca = abs(cos(a));
      const p = new Path2D(); p.ellipse(e.x, e.y, 0.1 + 0.12 * ca, 0.25, 0, 0, TAU);
      drawParts(G, [{ p, c: pal.headset, k: 0.04, hk: 0.02 }]);
      if (ca > 0.4) {
        ctx.fillStyle = pal.accent.b; ctx.beginPath(); ctx.ellipse(e.x, e.y, 0.12 * ca, 0.15, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = pal.led; ctx.beginPath(); ctx.ellipse(e.x, e.y - 0.02, 0.05 * ca, 0.05, 0, 0, TAU); ctx.fill();
      }
      if (sg < 0 && e.z > -0.1) { // mic boom on the right side
        const m = sp(-0.92, -0.62, 1.12);
        const mid = sp(-1.35, -0.5, 1.16);
        ctx.lineWidth = 0.022 + G.lw * 1.4; ctx.strokeStyle = G.line;
        ctx.beginPath(); ctx.moveTo(e.x, e.y + 0.12); ctx.quadraticCurveTo(mid.x, mid.y, m.x, m.y); ctx.stroke();
        ctx.lineWidth = 0.022; ctx.strokeStyle = pal.headset.h;
        ctx.beginPath(); ctx.moveTo(e.x, e.y + 0.12); ctx.quadraticCurveTo(mid.x, mid.y, m.x, m.y); ctx.stroke();
        const mp = new Path2D(); mp.ellipse(m.x, m.y, 0.05, 0.04, 0, 0, TAU);
        drawParts(G, [{ p: mp, c: pal.headset, k: 0.01 }]);
      }
    }
  }

  const SHIROU_HAIR = {
    capR: 1.06,
    bound: [0.5, 0.0, -0.5],
    spikes: prepSpikes([[PI, 0.15, 0.2, 0.3], [PI - 0.55, 0.5, 0.2, 0.28], [PI + 0.55, 0.5, 0.2, 0.28], [PI, 0.85, 0.22, 0.3], [PI - 1.1, 0.95, 0.16, 0.28], [PI + 1.1, 0.95, 0.16, 0.28], [0.3, 1.35, 0.16, 0.3], [-0.6, 1.1, 0.14, 0.28], [PI - 0.4, -0.25, 0.14, 0.26], [PI + 0.4, -0.25, 0.14, 0.26], [-1.7, 0.4, 0.12, 0.3], [1.7, 0.4, 0.12, 0.3]]),
    backPts: [[PI, -0.48, 1.04], [PI - 0.7, -0.4, 1.04], [PI + 0.7, -0.4, 1.04]],
    bangs: [
      { r: -1.0, t: -0.92, w: 0.25, ft: 0.02 },
      { r: -0.62, t: -0.42, w: 0.27, ft: -0.08 },
      { r: -0.25, t: -0.02, w: 0.27, ft: -0.14 },
      { r: 0.12, t: 0.36, w: 0.26, ft: -0.04 },
      { r: 0.5, t: 0.74, w: 0.26, ft: 0.06 },
      { r: 0.9, t: 1.1, w: 0.24, ft: 0.08 },
    ],
    locks: [
      { r: -1.42, t: -1.44, w: 0.1, ft: -0.2, rr: 0.32 },
      { r: 1.42, t: 1.44, w: 0.1, ft: -0.2, rr: 0.32 },
    ],
    lines: [-0.4, 0.3],
  };

  /* ------------------------------------------------------------------ bodies */
  const AKANE_BODY = {
    hipH: 292, ankleH: 20, thigh: 140, shin: 132, foot: 50, hipW: 20,
    thighR: [25, 15.5], shinR: [15.5, 9.5], shoeR: [13, 11],
    upper: 90, fore: 82, armR: [11.5, 9.5, 7.5], handR: 12.5,
    shH: 136, shW: 35, neckH: 158, neckF: 2, neckLen: 30, neckR: 9.5,
    torso: [
      { h: -26, W: 28, D: 23, f: -1 }, { h: 0, W: 41, D: 28, f: -3 }, { h: 26, W: 41, D: 27, f: -3 }, { h: 64, W: 30, D: 21, f: 0 },
      { h: 98, W: 36, D: 25, f: 5 }, { h: 122, W: 41, D: 23, f: 3 }, { h: 138, W: 43, D: 20, f: -1 }, { h: 150, W: 32, D: 17, f: -2 }, { h: 160, W: 11, D: 11, f: 1 },
    ],
    jacketH: 94, waistH: 62, hemH: -50, hemW: 60, hemD: 45, capeLen: 120,
  };
  const SHIROU_BODY = {
    hipH: 320, ankleH: 22, thigh: 152, shin: 144, foot: 58, hipW: 22,
    thighR: [27, 17.5], shinR: [17.5, 11], shoeR: [14.5, 12],
    upper: 102, fore: 92, armR: [13.5, 11.5, 9], handR: 14.5,
    shH: 150, shW: 44, neckH: 172, neckF: 2, neckLen: 36, neckR: 11.5,
    torso: [
      { h: -28, W: 31, D: 25, f: -1 }, { h: 0, W: 42, D: 28, f: -2 }, { h: 30, W: 41, D: 27, f: -2 }, { h: 72, W: 37, D: 24, f: 0 },
      { h: 110, W: 45, D: 28, f: 3 }, { h: 136, W: 51, D: 26, f: 1 }, { h: 152, W: 53, D: 22, f: -1 }, { h: 164, W: 38, D: 19, f: -2 }, { h: 174, W: 13, D: 13, f: 1 },
    ],
    waistH: 66, coatH: -170, coatW: 58, coatD: 46, emblemH: 112,
  };
  function scaleBody(b, k, w) {
    const o = JSON.parse(JSON.stringify(b));
    for (const key of ['hipH', 'thigh', 'shin', 'upper', 'fore', 'shH', 'neckH', 'neckLen', 'waistH', 'coatH', 'emblemH', 'foot']) if (o[key] != null) o[key] *= k;
    for (const key of ['hipW', 'shW', 'handR', 'neckR', 'coatW', 'coatD']) if (o[key] != null) o[key] *= w;
    o.thighR = o.thighR.map((v) => v * w); o.shinR = o.shinR.map((v) => v * w); o.armR = o.armR.map((v) => v * w); o.shoeR = o.shoeR.map((v) => v * (0.5 + 0.5 * w));
    o.torso = o.torso.map((l) => ({ h: l.h * k, W: l.W * w, D: l.D * w, f: l.f }));
    return o;
  }

  /* ------------------------------------------------------------------ palettes */
  const AKANE_PAL = {
    line: '#3b1c1e',
    skin: { b: '#ffe7da', s: '#f4b6a4', h: '#fff8f2' },
    hair: { b: '#6b2c28', s: '#441818', h: '#9c4a3b', ring: '#c97a66' },
    iris: { d: '#5e1a07', b: '#e3801c', l: '#ffd86e' },
    lash: '#341214', sclera: '#fffdfb', brow: '#4a1b1a', mouthIn: '#6e1d27', tongue: '#ec7f86', blush: '#ff6f80',
    beret: { b: '#d72a40', s: '#9d1731', h: '#f3646d' }, beretBand: '#8f1129',
    jacket: { b: '#cc2a3f', s: '#8c1530', h: '#ec5f68' }, piping: '#fff1e3',
    shirt: { b: '#fff7ef', s: '#e9cdd1', h: '#ffffff' }, tie: { b: '#ff6f5f', s: '#d1443d' },
    skirt: { b: '#7e1b35', s: '#541026', h: '#a93a55' },
    cape: { b: '#ef4b50', s: '#b32839', h: '#ff8580' }, lining: { b: '#7f1429', s: '#5a0c1e' },
    sock: { b: '#ffffff', s: '#d8d2e6' }, sockBand: '#d72a40',
    shoe: { b: '#e3404a', s: '#a0202e', h: '#ff7a7f' }, sole: '#fff3e6',
    bag: { b: '#cc8d4c', s: '#93602f', h: '#e9b47b' }, strap: '#7c4a28',
    emblemRing: '#e23b48', emblemCore: '#ffd2cf', emblemRim: '#fff6ee', cuff: '#ff6f5f',
  };
  const SHIROU_PAL = {
    line: '#2a2233',
    skin: { b: '#fbe2d2', s: '#e6b39f', h: '#fff6f0' },
    hair: { b: '#27324f', s: '#141a30', h: '#46598a', ring: '#7d92c6' },
    iris: { d: '#0b2c42', b: '#2a86ac', l: '#a4e8f4' },
    lash: '#131726', sclera: '#fdfdff', brow: '#1b2238', mouthIn: '#5e1c26', tongue: '#e07b84', blush: '#ff8a92',
    coat: { b: '#f6f6fb', s: '#c5c0de', h: '#ffffff' }, lining: { b: '#9a8bc6', s: '#7666a6' },
    accent: { b: '#b4a0e6', s: '#8670c4', h: '#ddd2fb' },
    pants: { b: '#2e3450', s: '#1b1f34', h: '#46507a' },
    glove: { b: '#2a3049', s: '#171b2d', h: '#4a5478' },
    boot: { b: '#ecedf4', s: '#b4b2ca', h: '#ffffff' }, sole: '#3a3f58',
    headset: { b: '#3a3f57', s: '#22253a', h: '#646b8c' }, led: '#d4c4ff',
    nucleus: '#6a45bc', emblemBg: '#ffffff', buckle: '#d9dbe8',
  };

  /* ------------------------------------------------------------------ character defs */
  const AKANE = {
    name: 'akane', masc: false, seed: 0.3, exprDefault: 'happy',
    body: AKANE_BODY, pal: AKANE_PAL, outfit: AKANE_OUT,
    head: {
      R: 52, eyeLam: 0.4, eyePhi: -0.17, eyeW: 0.39, eyeH: 0.49, browY: -0.74, mouthPhi: -0.62, mouthW: 0.24,
      hair: AKANE_HAIR, accessory: akaneBeret, backLayer: true, blushLines: true, shape: { jaw: 0.97 },
    },
  };
  const SHIROU = {
    name: 'shirou', masc: true, seed: 1.7, exprDefault: 'calm',
    body: SHIROU_BODY, pal: SHIROU_PAL, outfit: squadOutfit({ nucleus: 'seg' }),
    head: {
      R: 50, eyeLam: 0.39, eyePhi: -0.15, eyeW: 0.36, eyeH: 0.36, eyeStyle: 'sharp', browY: -0.86, browW: 0.16, mouthPhi: -0.64, mouthW: 0.24,
      hair: SHIROU_HAIR, accessory: squadHeadset, backLayer: false, blush: 0.6, shape: { jaw: 1.1, wide: 0.97 },
    },
  };

  const ALLY_SPECS = [
    { // 0: eosinophil — ユズ (orange-pink accents, ginger bob, female)
      name: 'yuzu', masc: false, k: 0.97, w: 0.92, R: 51, nucleus: 'bi', granules: '#ff9a7a',
      accent: { b: '#ff9273', s: '#e0654c', h: '#ffc2ae' }, lining: { b: '#e58b78', s: '#c06a5a' },
      hair: { b: '#d9743a', s: '#a84e22', h: '#f3a465', ring: '#ffd09a' }, iris: { d: '#6a2410', b: '#e86a4a', l: '#ffc7a0' }, brow: '#8a3b1a', lash: '#4a1d12',
      skin: { b: '#ffe8dc', s: '#f2b8a6', h: '#fff8f2' },
      eye: { w: 0.36, h: 0.43, style: null, browY: -0.8 },
      hairStyle: 'bob', expr: 'determined',
    },
    { // 1: basophil — ゴウ (deep violet, big build)
      name: 'gou', masc: true, k: 1.03, w: 1.22, R: 50, nucleus: 'baso', granules: '#3a1a5a',
      accent: { b: '#6b3aa6', s: '#4a2478', h: '#9a72d0' }, lining: { b: '#5a3a86', s: '#40285f' },
      hair: { b: '#2a1f33', s: '#160f1d', h: '#4a3a5a', ring: '#7a6a90' }, iris: { d: '#24102e', b: '#7a4ab0', l: '#d3b6ff' }, brow: '#1a1020', lash: '#140c18',
      skin: { b: '#f2cfb2', s: '#d9a688', h: '#fbe6d6' },
      eye: { w: 0.31, h: 0.27, style: 'sharp', browY: -1.05, browW: 0.15 },
      hairStyle: 'crop', expr: 'serious',
    },
    { // 2: monocyte — ソウ (blue, tall & slim, low ponytail)
      name: 'sou', masc: true, k: 1.06, w: 0.93, R: 49, nucleus: 'kidney',
      accent: { b: '#4a78dc', s: '#2f55ac', h: '#9cb8f4' }, lining: { b: '#5b7cc4', s: '#40609e' },
      hair: { b: '#1f4a50', s: '#0f2b30', h: '#3d7a80', ring: '#7ab8bc' }, iris: { d: '#0c2a3a', b: '#3a7ad0', l: '#b0d8ff' }, brow: '#0f2b30', lash: '#0c1a20',
      skin: { b: '#fbe4d6', s: '#e6b6a2', h: '#fff6f0' },
      eye: { w: 0.33, h: 0.3, style: 'sharp', browY: -0.95 },
      hairStyle: 'lowpony', expr: 'calm',
    },
    { // 3: lymphocyte — リン (sky blue, small, round)
      name: 'rin', masc: true, k: 0.86, w: 0.9, R: 53, nucleus: 'round',
      accent: { b: '#4cb4ea', s: '#2c8cc2', h: '#a6dcf6' }, lining: { b: '#6aa8d0', s: '#4a88b0' },
      hair: { b: '#a8724a', s: '#7a4e2e', h: '#d39a68', ring: '#f2c79a' }, iris: { d: '#2a1a0c', b: '#4aa0d8', l: '#c6ecff' }, brow: '#6a4226', lash: '#2a1a10',
      skin: { b: '#ffeadf', s: '#f2bba8', h: '#fff8f4' },
      eye: { w: 0.4, h: 0.46, style: null, browY: -0.78 },
      hairStyle: 'fluffy', expr: 'alert',
    },
  ];
  const ALLY_HAIR = {
    bob: {
      capR: 1.09, bound: [0.42, 0.0, -0.6],
      backPts: [[PI, -0.85, 1.12], [PI - 0.9, -0.9, 1.14], [PI + 0.9, -0.9, 1.14], [PI - 1.45, -0.75, 1.14], [PI + 1.45, -0.75, 1.14]],
      bangs: [
        { r: -0.8, t: -0.84, w: 0.28, ft: -0.04 }, { r: -0.4, t: -0.42, w: 0.28, ft: -0.08 }, { r: 0, t: 0.0, w: 0.28, ft: -0.06 },
        { r: 0.4, t: 0.42, w: 0.28, ft: -0.08 }, { r: 0.8, t: 0.84, w: 0.28, ft: -0.04 },
      ],
      locks: [
        { r: -1.3, t: -1.26, w: 0.3, ft: -0.92, rr: 0.36, bul: 1.18, tipR: 1.16, curl: 0.06 },
        { r: 1.3, t: 1.26, w: 0.3, ft: -0.92, rr: 0.36, bul: 1.18, tipR: 1.16, curl: -0.06 },
      ],
    },
    crop: {
      capR: 1.04, bound: [0.62, 0.12, -0.35],
      spikes: prepSpikes([[0.0, 1.2, 0.07, 0.3], [PI, 0.9, 0.07, 0.3], [-1.6, 1.0, 0.06, 0.3], [1.6, 1.0, 0.06, 0.3]]),
      backPts: [[PI, -0.3, 1.02]],
      bangs: [{ r: -0.4, t: -0.36, w: 0.3, ft: 0.38, rr: 0.62 }, { r: 0.05, t: 0.1, w: 0.3, ft: 0.36, rr: 0.62 }, { r: 0.45, t: 0.5, w: 0.3, ft: 0.4, rr: 0.62 }],
      locks: [],
    },
    lowpony: {
      capR: 1.06, bound: [0.46, 0.0, -0.45],
      backPts: [[PI, -0.42, 1.03], [PI - 0.8, -0.36, 1.03], [PI + 0.8, -0.36, 1.03]],
      bangs: [
        { r: -0.85, t: -0.62, w: 0.3, ft: -0.2 }, { r: -0.45, t: -0.18, w: 0.32, ft: -0.28 }, { r: -0.05, t: 0.25, w: 0.3, ft: -0.14 },
        { r: 0.38, t: 0.62, w: 0.28, ft: 0.0 }, { r: 0.85, t: 1.05, w: 0.26, ft: -0.2 },
      ],
      locks: [{ r: -1.35, t: -1.3, w: 0.16, ft: -0.7, rr: 0.32 }, { r: 1.35, t: 1.3, w: 0.16, ft: -0.7, rr: 0.32 }],
      pony: { lam: PI, phi: -0.2, n: 6, len: 0.36, a0: 0.12, aRun: 0.95, curl: 0.0, w: [0.14, 0.2, 0.22, 0.2, 0.17, 0.12, 0.0] },
    },
    fluffy: {
      capR: 1.12, bound: [0.38, -0.05, -0.55],
      spikes: prepSpikes([[0.6, 1.0, 0.1, 0.35], [-0.6, 1.0, 0.1, 0.35], [PI, 0.6, 0.12, 0.35], [PI - 1.2, 0.4, 0.1, 0.35], [PI + 1.2, 0.4, 0.1, 0.35], [1.7, 0.2, 0.1, 0.3], [-1.7, 0.2, 0.1, 0.3], [0, 1.45, 0.1, 0.35], [PI, 0.0, 0.1, 0.3]]),
      backPts: [[PI, -0.5, 1.1], [PI - 0.9, -0.4, 1.1], [PI + 0.9, -0.4, 1.1]],
      bangs: [
        { r: -0.9, t: -0.95, w: 0.24, ft: -0.02, bul: 1.16 }, { r: -0.5, t: -0.5, w: 0.25, ft: 0.0, bul: 1.16 }, { r: -0.12, t: -0.1, w: 0.25, ft: -0.05, bul: 1.16 },
        { r: 0.28, t: 0.3, w: 0.25, ft: 0.0, bul: 1.16 }, { r: 0.68, t: 0.7, w: 0.25, ft: -0.03, bul: 1.16 }, { r: 1.05, t: 1.1, w: 0.22, ft: -0.12, bul: 1.16 },
      ],
      locks: [{ r: -1.35, t: -1.3, w: 0.2, ft: -0.5, rr: 0.32, bul: 1.18, tipR: 1.12 }, { r: 1.35, t: 1.3, w: 0.2, ft: -0.5, rr: 0.32, bul: 1.18, tipR: 1.12 }],
    },
  };
  const ALLIES = ALLY_SPECS.map((A, i) => {
    const pal = Object.assign({}, SHIROU_PAL, {
      accent: A.accent, lining: A.lining, hair: A.hair, iris: A.iris, brow: A.brow, lash: A.lash, skin: A.skin,
      nucleus: A.nucleus === 'baso' ? '#5a2a8a' : A.nucleus === 'bi' ? '#8a3aa0' : A.nucleus === 'kidney' ? '#3a4aa8' : '#3a5ab0',
      led: mix(A.accent.b, '#ffffff', 0.5),
    });
    const body = A.masc ? scaleBody(SHIROU_BODY, A.k, A.w) : scaleBody(Object.assign({}, SHIROU_BODY, { torso: AKANE_BODY.torso.map((l) => ({ h: l.h * 1.08, W: l.W, D: l.D, f: l.f })), shW: 36 }), A.k * 0.94, A.w * 1.0);
    if (!A.masc) { body.hipW = 20; body.thighR = [25, 16]; body.shinR = [16, 10]; body.armR = [11.5, 10, 8]; body.handR = 13; body.neckR = 9.5; }
    return {
      name: A.name, masc: A.masc, seed: 2.1 + i, exprDefault: A.expr,
      body, pal, outfit: squadOutfit({ nucleus: A.nucleus, granules: A.granules }),
      head: {
        R: A.R, eyeLam: 0.41, eyePhi: -0.16, eyeW: A.eye.w, eyeH: A.eye.h, eyeStyle: A.eye.style, browY: A.eye.browY, browW: A.eye.browW, mouthPhi: -0.64, mouthW: 0.23,
        hair: ALLY_HAIR[A.hairStyle], accessory: squadHeadset, backLayer: !!ALLY_HAIR[A.hairStyle].pony, blush: A.masc ? 0.5 : 1, blushLines: !A.masc,
        shape: { jaw: A.name === 'gou' ? 1.08 : A.name === 'rin' ? 0.92 : 1.0, wide: A.name === 'gou' ? 1.06 : 1.0 },
      },
    };
  });

  /* ------------------------------------------------------------------ public API */
  function drawAkane(ctx, opts) { return drawFigure(ctx, AKANE, opts); }
  function drawShirou(ctx, opts) { return drawFigure(ctx, SHIROU, opts); }
  function drawWBCAlly(ctx, opts) { const v = ((opts && opts.variant) | 0) & 3; return drawFigure(ctx, ALLIES[v], opts); }
  const DEFS = { akane: AKANE, shirou: SHIROU, ally0: ALLIES[0], ally1: ALLIES[1], ally2: ALLIES[2], ally3: ALLIES[3] };
  function defOf(who, opts) {
    if (who === 'ally' || who === 'wbc') return ALLIES[((opts && opts.variant) | 0) & 3];
    return DEFS[who] || AKANE;
  }
  // Head centre & radius in canvas px for the given opts (same maths as drawing). For close-up framing.
  function headAnchor(who, opts) {
    const def = defOf(who, opts);
    const F = computeFrame(def, opts);
    const h = headScreen(def, F);
    const o = F.o, s = o.scale, facing = o.facing < 0 ? -1 : 1, sq = clamp(o.squash || 0, 0, 1);
    return {
      x: o.x + h.x * s * facing * (1 - 0.12 * sq),
      y: o.y + h.y * s * (1 - 0.04 * sq),
      r: def.head.R * s,
      eyeY: o.y + (h.y + def.head.R * 0.17) * s,
      mouthY: o.y + (h.y + def.head.R * 0.62) * s,
    };
  }
  // natural blink: ~every 2.5–5 s, 0.16 s long, occasional double blink. Pure function of t.
  function hash(n) { const x = sin(n * 127.1 + 311.7) * 43758.5453; return x - floor(x); }
  function blinkAt(t, seed) {
    seed = seed || 0;
    const slot = 3.6;
    const k = floor(t / slot);
    let v = 0;
    for (let i = k - 1; i <= k + 1; i++) {
      const tb = i * slot + 0.3 + hash(i * 1.37 + seed * 7.1) * (slot - 0.6);
      const d = t - tb;
      const bl = (d) => (d < 0 || d > 0.17 ? 0 : d < 0.06 ? d / 0.06 : 1 - (d - 0.06) / 0.11);
      v = max(v, bl(d));
      if (hash(i * 2.11 + seed * 3.3) > 0.78) v = max(v, bl(d - 0.24));
    }
    return clamp(v, 0, 1);
  }
  // run phase from time: one full cycle = two steps. stepInterval in seconds (0.2 → 2.5 cycles/s).
  function runPhase(t, stepInterval, offset) {
    const si = stepInterval || 0.2;
    const p = (t - (offset || 0)) / (2 * si);
    return p - floor(p);
  }
  // times (s) of foot contacts between t0 and t1 for SFX sync
  function footsteps(t0, t1, stepInterval, offset) {
    const si = stepInterval || 0.2, off = offset || 0, out = [];
    for (let n = Math.ceil((t0 - off) / si); off + n * si <= t1; n++) out.push(+(off + n * si).toFixed(4));
    return out;
  }

  BS.chars = {
    drawAkane, drawShirou, drawWBCAlly,
    headAnchor, blinkAt, runPhase, footsteps,
    drawO2Orb: (ctx, o) => o2Orb(ctx, o.x, o.y, o.r || 26, o.t || 0, 1),
    ALLY_NAMES: ['ユズ（好酸球）', 'ゴウ（好塩基球）', 'ソウ（単球）', 'リン（リンパ球）'],
    VIEW_YAW, EXPR: Object.keys(EXPR),
    _defs: DEFS,
  };
})();
