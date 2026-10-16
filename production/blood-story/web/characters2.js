/* BLOOD STORY ― 体内を駆ける細胞たち ― : characters2.js (Agent A, episodes 2–4 cast)
 * Plain script, load AFTER characters.js. Extends window.BS.chars (same opts conventions:
 * x,y = feet, scale (1 ≈ Akane 600 px), yaw / view, pose, expr, mouth (+vowel), blink, t, rim, tint, alpha, look).
 *
 * New characters (all built on the same 2.5D rig, so every pose of characters.js works:
 *   stand run walk point present cheer wave surprised think reach battle pose look_up relieved turn ready hold sit):
 *   drawPeta(ctx, o)        ペタ (platelet kid). Native size ≈ Akane's chest (use the SAME scale as Akane).
 *                           o.activated 0..1 (ribbon pseudopods, beret rounds up), o.hue (deg) or o.variant 0..5 for the platelet squad.
 *   drawKyoko(ctx, o)       キョウコ (megakaryocyte). Native size ≈ 1.5× Akane. o.shed 0..1 (platelet discs bud & fall from the hem),
 *                           o.lobes 5|6 (crown), o.sleeveTo {x,y} + o.sleeve 0..1 (+o.sleeveArm 'R'|'L', default = nearer wrist): cytoplasmic process into a vessel,
 *                           buds platelets at its tip), pose 'sit' (seated, robe pooled).
 *   drawShirou(ctx, {young:true})       幼いシロウ (≈0.68× height, band-nucleus badge, bigger eyes).
 *   drawWBCAlly(ctx, {variant:2, form:'macrophage' | morph:0..1})  ソウ: monocyte → macrophage (bigger, frilled cloak, lysosome orbs,
 *                           irregular nucleus badge). o.mhc 0..1 = MHC tray with an antigen fragment on the presenting/pointing hand.
 *                           o.morphFX (default true) = transformation glow while 0<morph<1.
 *   drawLymphoMob(ctx, {kind:'T4'|'T8'|'B'|'NK'|'plasma'|'band'|'neut', seed})  background squad (Rin-style uniform, badge differs).
 *   drawStemCell(ctx, {x,y,scale,t,form:'figure'|'orb',pulse,alpha,pose,yaw})   glowing platinum silhouette, no linework.
 *   drawInfectedCell(ctx, {x,y,scale,t,sick,expr:'sick'|'scared'|'calm'|'relieved',mhcFlag,pores,apoptosis,mouth,blink,alpha,tint})
 *   drawGiantHand(ctx, {x,y,scale,rot(deg),pose:'thumb'|'pinch'|'hold_slide'|'push_spreader',flip,glove,prop,base,blood,alpha,tint,rim,t})
 *                           (x,y) = the ACTION point (thumb pad / pinch point / slide centre / spreader contact edge). Returns anchors.
 * Variants for every main character (Akane, Shirou, allies, Peta, Kyoko, mobs):
 *   o.stain:'giemsa'  Giemsa-like palette (Ep.4).   o.flat 0..1  spread flat between glass (anchored at the feet).
 * headAnchor / handAnchor accept 'peta', 'kyoko', 'mob' (with kind) and the young / macrophage / flat options.
 */
(function () {
  'use strict';
  const BS = window.BS;
  if (!BS || !BS.chars || !BS.chars._k) { console.error('characters2.js: load characters.js first'); return; }
  const C = BS.chars, K = C._k;
  const PI = Math.PI, TAU = PI * 2, DEG = PI / 180;
  const { sin, cos, abs, sqrt, atan2, hypot, min, max, floor } = Math;
  const { clamp, lerp, sstep, mix, rgba, parse, capsule, smooth, addSmooth, addSmoothCtx, poly, drawParts, crescent, lp2, P2, drawNucleusEmblem } = K;
  const ORIG = { drawAkane: C.drawAkane, drawShirou: C.drawShirou, drawWBCAlly: C.drawWBCAlly, headAnchor: C.headAnchor, handAnchor: C.handAnchor };
  const hash = (n) => { const x = sin(n * 127.1 + 311.7) * 43758.5453; return x - floor(x); };

  /* ------------------------------------------------------------ colour (HSL) */
  function toHsl(c) {
    const [r0, g0, b0] = parse(c), r = r0 / 255, g = g0 / 255, b = b0 / 255;
    const mx = max(r, g, b), mn = min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function fromHsl(h, s, l) {
    h = ((h % 1) + 1) % 1;
    const f = (p, q, t) => { t = ((t % 1) + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    let r, g, b;
    if (s === 0) r = g = b = l;
    else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3); }
    const hx = (v) => { const n = clamp(Math.round(v * 255), 0, 255); return (n < 16 ? '0' : '') + n.toString(16); };
    return '#' + hx(r) + hx(g) + hx(b);
  }
  const hueShift = (c, deg) => { if (c[0] !== '#') return c; const [h, s, l] = toHsl(c); return fromHsl(h + deg / 360, s, l); };
  // recolour a value ({b,s,h,...} group or single colour) to the target hue/sat, keeping the group's relative lightness
  function recol(v, target, amt) {
    const [th, ts, tl] = toHsl(target);
    const one = (c, base) => {
      if (typeof c !== 'string' || c[0] !== '#') return c;
      const l = toHsl(c)[2];
      const nl = base == null ? lerp(l, tl, 0.55) : clamp(tl + (l - base) * 0.9, 0.04, 0.98);
      return mix(c, fromHsl(th, ts, nl), amt == null ? 1 : amt);
    };
    if (typeof v === 'string') return one(v, null);
    if (v && typeof v === 'object') { const base = v.b ? toHsl(v.b)[2] : null; const o = {}; for (const k in v) o[k] = one(v[k], base); return o; }
    return v;
  }

  /* ------------------------------------------------------------ shared helpers */
  // canvas-space position of a hand from a computed frame F (same maths as handAnchor)
  function handFromF(def, F, k) {
    const o = F.o, s = o.scale, facing = o.facing < 0 ? -1 : 1, sq = clamp(o.squash || 0, 0, 1);
    const sY = sin(F.Y), cY = cos(F.Y);
    const Cv = (p) => ({ x: o.x + (p[0] * sY + p[2] * cY) * s * facing * (1 - 0.12 * sq), y: o.y + p[1] * s * (1 - 0.04 * sq) });
    const e = Cv(F.J['elbow' + k]), w = Cv(F.J['wrist' + k]);
    const dx = w.x - e.x, dy = w.y - e.y, L = hypot(dx, dy) || 1, hr = def.body.handR * s;
    return { elbow: e, wrist: w, dir: { x: dx / L, y: dy / L }, palm: { x: w.x + dx / L * hr * 1.1, y: w.y + dy / L * hr * 1.1 }, tip: { x: w.x + dx / L * hr * 3, y: w.y + dy / L * hr * 3 } };
  }
  // flatten (spread between glass): scale about the feet
  const flatK = (o) => clamp((o && o.flat) || 0, 0, 1);
  function withFlat(ctx, o, fn) {
    const f = flatK(o);
    if (!f) return fn();
    const x = o.x || 0, y = o.y || 0;
    ctx.save();
    ctx.translate(x, y); ctx.scale(1 + 0.55 * f, 1 - 0.5 * f); ctx.translate(-x, -y);
    const r = fn();
    ctx.restore();
    return r;
  }
  function flatPt(o, p) {
    const f = flatK(o);
    if (!f || !p) return p;
    const x = o.x || 0, y = o.y || 0, q = Object.assign({}, p);
    if (p.x != null) q.x = x + (p.x - x) * (1 + 0.55 * f);
    if (p.y != null) q.y = y + (p.y - y) * (1 - 0.5 * f);
    for (const k of ['eyeY', 'mouthY']) if (p[k] != null) q[k] = y + (p[k] - y) * (1 - 0.5 * f);
    return q;
  }
  function flatDeep(o, a) {
    if (!flatK(o) || !a || typeof a !== 'object') return a;
    if (a.x != null && a.y != null) return flatPt(o, a);
    const r = {};
    for (const k in a) r[k] = flatDeep(o, a[k]);
    return r;
  }
  const alphaOf = (o) => (o && o.alpha != null ? o.alpha : 1);
  function ribbon(G, base, ang, len, w0, t, seed, col, wave) {
    if (len < 2) return;
    const N = 10, pts = [];
    let x = base.x, y = base.y;
    for (let i = 0; i <= N; i++) {
      pts.push({ x, y });
      const a = ang + (wave == null ? 0.55 : wave) * sin(t * 3.1 + seed * 2.3 + i * 0.75) * (i / N) + 0.25 * sin(seed * 5.1) * (i / N);
      x += cos(a) * len / N; y += sin(a) * len / N;
    }
    const Lp = [], Rp = [];
    for (let i = 0; i <= N; i++) {
      const a0 = pts[max(i - 1, 0)], a1 = pts[min(i + 1, N)];
      let dx = a1.x - a0.x, dy = a1.y - a0.y; const l = hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = w0 * (0.7 + 0.3 * sin(PI * (i / N) * 2.2 + seed)) * (1 - 0.42 * (i / N));
      Lp.push({ x: pts[i].x - dy * w, y: pts[i].y + dx * w });
      Rp.push({ x: pts[i].x + dy * w, y: pts[i].y - dx * w });
    }
    const ex = pts[N].x - pts[N - 1].x, ey = pts[N].y - pts[N - 1].y, el = hypot(ex, ey) || 1, wt = w0 * 0.45;
    const out = Lp.concat([{ x: pts[N].x + ex / el * wt * 0.9, y: pts[N].y + ey / el * wt * 0.9 }], Rp.slice().reverse());
    drawParts(G, [{ p: smooth(out, true), c: col, k: 3, hk: 1.2 }]);
  }
  function glowDisc(ctx, x, y, r, col, ring, a) {
    ctx.save();
    ctx.globalAlpha *= a == null ? 1 : a;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
    g.addColorStop(0, rgba(ring, 0.55)); g.addColorStop(1, rgba(ring, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = r * 0.22; ctx.strokeStyle = ring; ctx.stroke();
    ctx.fillStyle = rgba('#8a5ad8', 0.7);
    ctx.beginPath(); ctx.arc(x - r * 0.15, y, r * 0.18, 0, TAU); ctx.arc(x + r * 0.22, y + r * 0.08, r * 0.14, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------ Giemsa stain */
  // cyto = cytoplasm/garments, accent = trims, nuc = nucleus motifs (hair, nucleus badge, crown), gran = granule overlay
  const STAIN = {
    akane: { cyto: '#ee6a48', accent: '#e8502e', nuc: '#a8402a', skin: '#ffd0c0', gran: null },
    shirou: { cyto: '#f3d2dc', accent: '#d9a6c8', nuc: '#4c2a84', skin: '#fbd8dc', gran: { c: '#c48ab8', r: [1.2, 1.8], n: 46 } },
    yuzu: { cyto: '#f6d6d6', accent: '#ff6a3a', nuc: '#56288a', skin: '#fbd8d4', gran: { c: '#f2562a', r: [3.0, 3.8], n: 34 } },
    gou: { cyto: '#e2d4ec', accent: '#3a1648', nuc: '#2e1448', skin: '#efd0d8', gran: { c: '#2a0c3a', r: [2.0, 5.6], n: 30, vac: 7 } },
    sou: { cyto: '#bcc6da', accent: '#7c8cb4', nuc: '#5a4aa0', skin: '#efd6de', gran: { c: '#9a86c8', r: [0.8, 1.2], n: 30 } },
    rin: { cyto: '#9fd4f4', accent: '#4aa6e4', nuc: '#33268a', skin: '#f6d8e0', gran: null },
    peta: { cyto: '#c8cde8', accent: '#a48ad8', nuc: '#5a2a9e', skin: '#f6dbe4', gran: null },
    kyoko: { cyto: '#b8a8dc', accent: '#9a7ad0', nuc: '#3a2080', skin: '#f6dbe4', gran: null },
    mob: { cyto: '#a8d8f2', accent: '#4aa6e4', nuc: '#33268a', skin: '#f6d8e0', gran: null },
  };
  const ROLE = {
    line: 'keep', lash: 'keep', sclera: 'keep', iris: 'keep', mouthIn: 'keep', tongue: 'keep', blush: 'keep', led: 'keep', ring: 'keep',
    skin: 'skin', hair: 'nuc', brow: 'nuc', nucleus: 'nuc', lobe: 'nuc', granule: 'nuc', granulo: 'nuc', emblemBg: 'keep', disc: 'keep',
    accent: 'accent', cuff: 'accent', piping: 'accent', sockBand: 'accent', strap: 'accent', tie: 'accent', sash: 'accent', beretBand: 'accent', crownBand: 'accent',
  };
  function stainPal(pal, S) {
    const o = {};
    for (const k in pal) {
      const role = ROLE[k] || 'cyto', v = pal[k];
      if (role === 'keep') o[k] = v;
      else if (role === 'skin') o[k] = typeof v === 'object' ? { b: mix(v.b, S.skin, 0.4), s: mix(v.s, S.skin, 0.3), h: mix(v.h || v.b, '#ffffff', 0.2) } : v;
      else o[k] = recol(v, S[role], 0.92);
    }
    o.line = mix(pal.line || '#2a2233', '#2a1840', 0.4);
    return o;
  }
  function granuleOverlay(G, T, S, seed) {
    if (!S.gran) return;
    const ctx = G.ctx, g = S.gran;
    ctx.save(); ctx.clip(T.torsoPath);
    for (let i = 0; i < g.n; i++) {
      const h = lerp(T.B.waistH - 10, T.B.shH + 4, hash(i * 1.7 + seed));
      const lam = lerp(-1.3, 1.3, hash(i * 3.1 + seed * 2));
      const spc = T.torsoSpec(h);
      if (T.rnz(spc, lam) < 0.1) continue;
      const p = T.rpt(spc, lam, 0);
      const r = lerp(g.r[0], g.r[1], hash(i * 5.3 + seed));
      ctx.fillStyle = g.c; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    }
    for (let i = 0; i < (g.vac || 0); i++) { // basophil: granules dissolved in water leave vacuoles
      const h = lerp(T.B.waistH, T.B.shH - 6, hash(i * 7.7 + 3)), lam = lerp(-1.1, 1.1, hash(i * 9.1 + 1));
      const spc = T.torsoSpec(h);
      if (T.rnz(spc, lam) < 0.15) continue;
      const p = T.rpt(spc, lam, 0), r = 3 + 3 * hash(i * 2.2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      ctx.lineWidth = 0.9; ctx.strokeStyle = rgba(g.c, 0.6); ctx.stroke();
    }
    ctx.restore();
  }
  const _stainCache = new Map();
  function stainDef(def, kind) {
    if (kind !== 'giemsa') return def;
    let m = _stainCache.get(def);
    if (m) return m;
    const S = STAIN[def.stainKey || def.name] || STAIN.mob;
    const out0 = def.outfit;
    const outfit = Object.assign({}, out0, {
      torsoAfter(G, pal, T) { if (out0.torsoAfter) out0.torsoAfter(G, pal, T); granuleOverlay(G, T, S, def.seed || 0); },
    });
    m = Object.assign({}, def, { pal: stainPal(def.pal, S), outfit });
    _stainCache.set(def, m);
    return m;
  }
  // common draw path for every character def: stain → flat → figure → extras(F)
  function drawDef(ctx, def, opts, extras) {
    const o = opts || {};
    const d = o.stain ? stainDef(def, o.stain) : def;
    return withFlat(ctx, o, () => {
      const F = K.drawFigure(ctx, d, o);
      if (extras) extras(F, d);
      return F;
    });
  }

  /* ------------------------------------------------------------ young Shirou (flashback) */
  const YOUNG_HAIR = Object.assign({}, K.SHIROU_HAIR, {
    spikes: K.prepSpikes([[0.25, 1.3, 0.3, 0.22], [PI, 0.15, 0.2, 0.3], [PI - 0.55, 0.5, 0.22, 0.28], [PI + 0.55, 0.5, 0.22, 0.28], [PI, 0.85, 0.24, 0.3], [PI - 1.1, 0.95, 0.18, 0.28], [PI + 1.1, 0.95, 0.18, 0.28], [-0.6, 1.1, 0.16, 0.28], [-1.7, 0.4, 0.14, 0.3], [1.7, 0.4, 0.14, 0.3]]),
  });
  const SHIROU_YOUNG = Object.assign({}, K.SHIROU, {
    seed: 4.4, exprDefault: 'happy', stainKey: 'shirou',
    body: (() => { const b = K.scaleBody(K.SHIROU_BODY, 0.66, 0.84); b.coatH = -118; b.coatW = 50; b.coatD = 40; return b; })(),
    pal: Object.assign({}, K.SHIROU_PAL, { accent: { b: '#c4b0f0', s: '#9a80d4', h: '#e6dcff' } }),
    outfit: K.squadOutfit({ nucleus: 'band' }),
    head: Object.assign({}, K.SHIROU.head, { R: 49, eyeH: 0.46, eyeW: 0.38, eyeStyle: null, browY: -0.8, browW: 0.17, hair: YOUNG_HAIR, blush: 0.9, shape: { jaw: 0.95, wide: 1.0 } }),
  });

  /* ------------------------------------------------------------ macrophage Sou */
  const SOU = K.ALLIES[2];
  const MAC_PAL_ADD = { cloak: { b: '#6f8fe0', s: '#4a66b8', h: '#a8c0f8' }, cloakIn: { b: '#f2c6dc', s: '#d89ab8' }, frill: { b: '#f6d4e6', s: '#dca6c4', h: '#fff0f8' },
    lyso: '#ff9ad0', lysoCore: '#fff2fa', mhc: { b: '#e9e4f6', s: '#b8aed6', h: '#ffffff' }, antigen: '#e0605a' };
  function macOutfit(m) {
    const base = K.squadOutfit({ nucleus: m < 0.5 ? 'kidney' : 'irregular' });
    return Object.assign({}, base, {
      collar(G, pal, env) { if (m > 0.02) mantle(G, pal, env, m); base.collar(G, pal, env); },
      extraGroups(env) {
        base.extraGroups(env);
        if (m > 0.02) cloakGroup(env, m);
        if (m > 0.02) lysoGroup(env, m);
      },
    });
  }
  // frilled edge sampler: wavy lobes (pseudopod-like) along a polyline
  function frillPts(pts, amp, t, seed, nLobe) {
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[max(i - 1, 0)], b = pts[min(i + 1, n - 1)];
      let dx = b.x - a.x, dy = b.y - a.y; const l = hypot(dx, dy) || 1; dx /= l; dy /= l;
      const u = i / (n - 1);
      const w = amp * (0.55 + 0.45 * sin(u * PI * nLobe + seed + t * 1.6)) * (0.6 + 0.4 * sin(u * 23.0 + seed * 3 + t * 2.4));
      out.push({ x: p.x + dy * w, y: p.y - dx * w });
    }
    return out;
  }
  function cloakGroup(env, m) {
    const { G, pal, J, P, B, rpt, addG, sY, cY, o, pr } = env;
    const ctx = G.ctx, t = o.t || 0;
    addG(cY < -0.1 ? env.coverZ + 0.9 : -1000, () => {
      const lams = [1.35, 1.9, 2.4, 2.8, PI, -2.8, -2.4, -1.9, -1.35];
      const sp = env.torsoSpec(B.shH + 4);
      const top = [], bot = [];
      lams.forEach((lam, j) => {
        top.push(rpt(sp, lam, 3));
        const p3 = J.body(sp.f + (sp.D + 3) * cos(lam), sp.h, (sp.W + 3) * sin(lam), sp.tw);
        const back = -cos(lam), side = sin(lam);
        const fl = 0.3 * sin(t * 1.4 + j * 0.9) + P.speed * sin(t * 7 - j * 0.8);
        const ang = lerp(0.12, 0.9, P.speed) + 0.08 * fl;
        const len = B.coatH * -1 * lerp(0.6, 1.0, m) * (0.9 + 0.1 * back) + 120;
        const spread = lerp(0.2, 0.55, m);
        const d = [-sin(ang) * (0.5 + 0.5 * back) - 0.12, cos(ang), side * spread];
        bot.push(pr([p3[0] + d[0] * len, p3[1] + d[1] * len, p3[2] + d[2] * len]));
      });
      const hem = frillPts(bot, 40 * m, t, 1.3, 9);
      const outline = top.concat(hem.slice().reverse());
      const pth = smooth(outline, true);
      ctx.save(); ctx.globalAlpha *= clamp(m * 1.6, 0, 1);
      drawParts(G, [{ p: pth, c: cY < -0.1 ? pal.cloak : pal.cloakIn, k: 12, hk: 3 }]);
      // flowing frill band along the hem
      ctx.save(); ctx.clip(pth);
      ctx.lineWidth = 12; ctx.strokeStyle = rgba(pal.frill.b, 0.9);
      ctx.beginPath(); addSmoothCtx(ctx, hem.map((q) => ({ x: q.x, y: q.y - 6 }))); ctx.stroke();
      ctx.strokeStyle = rgba(pal.cloak.s, 0.7); ctx.lineWidth = G.lw * 0.6;
      for (const j of [2, 4, 6]) { ctx.beginPath(); ctx.moveTo(top[j].x, top[j].y + 10); ctx.quadraticCurveTo(lerp(top[j].x, bot[j].x, 0.5) + 8 * sin(t + j), lerp(top[j].y, bot[j].y, 0.5), bot[j].x, bot[j].y - 10); ctx.stroke(); }
      ctx.restore();
      ctx.restore();
    });
  }
  function mantle(G, pal, env, m) {
    const { rpt, extremes, B, o } = env;
    const ctx = G.ctx, t = o.t || 0;
    const top = env.ring({ h: B.neckH - 2, W: B.neckR + 10, D: B.neckR + 9, f: B.neckF });
    const sp = env.torsoSpec(B.shH - 34 * m);
    const s2 = env.ring({ h: sp.h, W: sp.W + 16 * m, D: sp.D + 12 * m, f: sp.f });
    const et = extremes(top), eb = extremes(s2);
    for (const sg of [-1, 1]) {
      const tp = [], hp = [];
      for (let i = 0; i <= 10; i++) {
        const lam = sg * lerp(0.35, PI, i / 10);
        tp.push(rpt(top, env.clampLam(et, lam)));
        hp.push(rpt(s2, env.clampLam(eb, lam)));
      }
      let vis = 0;
      for (let i = 0; i <= 10; i++) if (env.rnz(s2, sg * lerp(0.35, PI, i / 10)) > 0) vis++;
      if (vis < 2) continue;
      const fr = frillPts(hp, 13 * m, t, sg * 2.1, 4);
      const pth = new Path2D();
      addSmooth(pth, tp, false);
      pth.lineTo(fr[fr.length - 1].x, fr[fr.length - 1].y);
      for (let i = fr.length - 1; i >= 0; i--) pth.lineTo(fr[i].x, fr[i].y);
      pth.closePath();
      ctx.save(); ctx.globalAlpha *= clamp(m * 1.6, 0, 1);
      drawParts(G, [{ p: pth, c: pal.cloak, k: 6, hk: 2 }]);
      ctx.save(); ctx.clip(pth);
      ctx.lineWidth = 7; ctx.strokeStyle = pal.frill.b;
      ctx.beginPath(); addSmoothCtx(ctx, fr.map((q) => ({ x: q.x, y: q.y - 3 }))); ctx.stroke();
      ctx.restore();
      ctx.lineWidth = G.lw * 0.8; ctx.strokeStyle = G.line; ctx.stroke(pth);
      ctx.restore();
    }
  }
  function lysoGroup(env, m) {
    const { G, pal, J, P, B, pr, addG, o } = env;
    const t = o.t || 0, n = 5;
    for (let i = 0; i < n; i++) {
      const a = t * 0.7 + i * TAU / n;
      const p = pr(J.body(cos(a) * (B.coatD + 30), B.waistH - 20 + 14 * sin(t * 1.3 + i * 2), sin(a) * (B.coatW + 34)));
      addG(p.z + (p.z > 0 ? env.coverZ + 2 : -5), () => {
        const ctx = G.ctx, r = (7 + 2 * hash(i)) * m;
        ctx.save();
        ctx.globalAlpha *= clamp(m * 1.4, 0, 1);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.6);
        g.addColorStop(0, rgba(pal.lyso, 0.6)); g.addColorStop(1, rgba(pal.lyso, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fillStyle = pal.lyso; ctx.fill(); ctx.lineWidth = G.lw * 0.6; ctx.strokeStyle = G.line; ctx.stroke();
        ctx.fillStyle = pal.lysoCore; ctx.beginPath(); ctx.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.35, 0, TAU); ctx.fill();
        ctx.restore();
      });
    }
  }
  const _macCache = new Map();
  function macDef(m) {
    m = Math.round(clamp(m, 0, 1) * 20) / 20;
    let d = _macCache.get(m);
    if (d) return d;
    const body = K.scaleBody(K.SHIROU_BODY, lerp(1.06, 1.15, m), lerp(0.93, 1.2, m));
    body.coatW *= lerp(1, 1.12, m); body.coatD *= lerp(1, 1.1, m);
    const pal = Object.assign({}, SOU.pal, MAC_PAL_ADD, {
      coat: { b: mix(SOU.pal.coat.b, '#fbeef4', 0.7 * m), s: mix(SOU.pal.coat.s, '#d8bccc', 0.6 * m), h: '#ffffff' },
      lining: { b: mix(SOU.pal.lining.b, '#d88ab0', 0.6 * m), s: mix(SOU.pal.lining.s, '#b06890', 0.6 * m) },
      nucleus: mix(SOU.pal.nucleus, '#4a3aa0', m),
    });
    d = Object.assign({}, SOU, { body, pal, outfit: macOutfit(m), head: Object.assign({}, SOU.head, { R: lerp(49, 52, m) }), stainKey: 'sou', mac: m });
    _macCache.set(m, d);
    return d;
  }
  function morphOf(o) { if (!o) return 0; if (o.morph != null) return clamp(o.morph, 0, 1); return o.form === 'macrophage' ? 1 : 0; }
  function mhcTray(ctx, o, hand, pal, k, t) {
    const s = o.scale || 1, x = hand.palm.x, y = hand.palm.y - 26 * s;
    ctx.save();
    ctx.globalAlpha *= clamp(k, 0, 1) * alphaOf(o);
    ctx.translate(x, y - 14 * s); ctx.scale(s * 1.6, s * 1.6);
    const G = { ctx, facing: 1, lw: 3.4 / sqrt(max(s, 0.12)), line: pal.line, rim: null, pal, px: s };
    const plate = new Path2D(); plate.ellipse(0, 0, 34, 11, 0, 0, TAU);
    const stem = new Path2D(); stem.moveTo(-10, 2); stem.lineTo(10, 2); stem.lineTo(6, 24); stem.lineTo(-6, 24); stem.closePath();
    const groove = new Path2D(); groove.ellipse(0, -3, 22, 6, 0, 0, TAU);
    drawParts(G, [{ p: stem, c: pal.mhc, k: 3 }, { p: plate, c: pal.mhc, k: 3, hk: 1.5 }]);
    ctx.fillStyle = pal.mhc.s; ctx.fill(groove);
    // antigen fragment (small angular piece) floating in the groove
    const bob = 2 * sin(t * 3);
    const fr = poly([P2(-14, -8 + bob), P2(-4, -18 + bob), P2(8, -14 + bob), P2(15, -6 + bob), P2(2, -2 + bob)]);
    drawParts(G, [{ p: fr, c: { b: pal.antigen, s: mix(pal.antigen, '#000000', 0.3) }, k: 2 }]);
    const g = ctx.createRadialGradient(0, -10, 0, 0, -10, 60);
    g.addColorStop(0, 'rgba(255,220,240,0.35)'); g.addColorStop(1, 'rgba(255,220,240,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -10, 60, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function morphFX(ctx, o, F, def, m, stage) {
    const k = sin(PI * m);
    if (k < 0.02) return;
    const s = o.scale || 1, t = o.t || 0;
    const h = K.headScreen(def, F);
    const cx = o.x, cy = o.y + h.y * s * 0.5;
    ctx.save();
    ctx.globalAlpha *= alphaOf(o);
    ctx.globalCompositeOperation = 'lighter';
    if (stage === 'back') {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 420 * s);
      g.addColorStop(0, 'rgba(160,190,255,' + (0.5 * k).toFixed(3) + ')'); g.addColorStop(0.5, 'rgba(255,170,220,' + (0.25 * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,170,220,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 420 * s, 0, TAU); ctx.fill();
      ctx.lineWidth = 6 * s; ctx.strokeStyle = 'rgba(220,235,255,' + (0.6 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(cx, o.y, (160 + 260 * m) * s, (30 + 50 * m) * s, 0, 0, TAU); ctx.stroke();
    } else {
      for (let i = 0; i < 22; i++) {
        const a = hash(i) * TAU + t * (0.6 + hash(i + 9)), r = (120 + 200 * hash(i * 3.3)) * s, up = ((t * 0.5 + hash(i * 7)) % 1);
        const x = cx + cos(a) * r, y = o.y - up * 700 * s;
        const rr = (3 + 4 * hash(i * 1.9)) * s * k;
        ctx.fillStyle = i % 2 ? 'rgba(255,200,235,0.9)' : 'rgba(190,215,255,0.9)';
        ctx.beginPath(); ctx.moveTo(x, y - rr * 2.4); ctx.lineTo(x + rr * 0.6, y); ctx.lineTo(x, y + rr * 2.4); ctx.lineTo(x - rr * 0.6, y); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------ lymphocyte & mob squad */
  const RIN = K.ALLIES[3];
  const MOB_HAIR_COL = [
    { b: '#5a4030', s: '#3a2618', h: '#8a6448', ring: '#c8a080' }, { b: '#2a2e44', s: '#161a2a', h: '#4a5072', ring: '#8890b8' },
    { b: '#8a5a3a', s: '#5e3a22', h: '#b88460', ring: '#e8b890' }, { b: '#3a3a3a', s: '#1e1e1e', h: '#5e5e5e', ring: '#a0a0a0' },
    { b: '#6a3a2a', s: '#44221a', h: '#9a5a44', ring: '#d09078' },
  ];
  const MOB_KIND = {
    T4: { accent: { b: '#4cb4ea', s: '#2c8cc2', h: '#a6dcf6' }, label: 'CD4', nucleus: 'round', k: 0.86, w: 0.9 },
    T8: { accent: { b: '#2aa39a', s: '#1a7a72', h: '#8ad8d0' }, label: 'CD8', nucleus: 'round', k: 0.86, w: 0.92 },
    B: { accent: { b: '#5a72e0', s: '#3a52b8', h: '#a8b8f6' }, label: 'B', nucleus: 'round', k: 0.85, w: 0.9, ig: true },
    NK: { accent: { b: '#d0485e', s: '#a02a40', h: '#f4a0ae' }, label: 'NK', nucleus: 'lgl', k: 0.92, w: 0.98, redGran: true },
    plasma: { accent: { b: '#8a62d8', s: '#6442b0', h: '#c8b0f8' }, label: null, nucleus: 'eccentric', k: 0.9, w: 1.12, abY: true },
    band: { accent: { b: '#b4a0e6', s: '#8670c4', h: '#ddd2fb' }, label: null, nucleus: 'band', k: 0.9, w: 0.92, base: 'shirou' },
    neut: { accent: { b: '#b4a0e6', s: '#8670c4', h: '#ddd2fb' }, label: null, nucleus: 'seg', k: 0.94, w: 0.95, base: 'shirou' },
  };
  function yGlyph(ctx, x, y, r, col, lw) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = lw || r * 0.32;
    ctx.beginPath(); ctx.moveTo(0, r); ctx.lineTo(0, 0); ctx.lineTo(-r * 0.75, -r); ctx.moveTo(0, 0); ctx.lineTo(r * 0.75, -r); ctx.stroke();
    ctx.restore();
  }
  function badgeText(ctx, x, y, r, fx, txt, pal, line) {
    ctx.save(); ctx.translate(x, y); ctx.scale(max(fx, 0.15), 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = r * 0.2; ctx.strokeStyle = pal.accent.b; ctx.stroke();
    ctx.lineWidth = 1.4; ctx.strokeStyle = line; ctx.beginPath(); ctx.arc(0, 0, r * 1.1, 0, TAU); ctx.stroke();
    ctx.fillStyle = pal.accent.s; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 ' + (txt.length > 2 ? r * 0.8 : r * 1.05).toFixed(1) + 'px "Zen Kaku Gothic New", ZenKaku, IPAGothic, sans-serif';
    ctx.fillText(txt, 0, r * 0.06);
    ctx.restore();
  }
  function mobOutfit(spec) {
    const base = K.squadOutfit({ nucleus: spec.nucleus });
    return Object.assign({}, base, {
      torsoAfter(G, pal, T) {
        const ctx = G.ctx;
        const es = T.torsoSpec(T.B.emblemH), lam = 0.55, nz = T.rnz(es, lam);
        ctx.save(); ctx.clip(T.torsoPath);
        if (nz > 0.12) {
          const c = T.rpt(es, lam, 2);
          if (spec.label) badgeText(ctx, c.x, c.y, 15, nz, spec.label, pal, G.line);
          if (spec.ig) for (const dl of [-0.55, 0.3]) { const q = T.rpt(T.torsoSpec(T.B.shH - 8), dl, 2); if (T.rnz(T.torsoSpec(T.B.shH - 8), dl) > 0.1) yGlyph(ctx, q.x, q.y, 7, pal.accent.b, 3); }
        }
        if (spec.redGran) for (const [h, l] of [[-34, -0.35], [-48, 0.05], [-26, 0.25], [-58, -0.15]]) {
          const s2 = T.torsoSpec(T.B.emblemH + h);
          if (T.rnz(s2, l) > 0.1) { const q = T.rpt(s2, l, 1); ctx.fillStyle = '#d42a3a'; ctx.beginPath(); ctx.arc(q.x, q.y, 5.5, 0, TAU); ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = G.line; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(q.x - 1.6, q.y - 1.8, 1.6, 0, TAU); ctx.fill(); }
        }
        if (spec.abY) for (const [h, l] of [[-38, -0.3], [-60, 0.2], [-30, 0.35], [8, -0.1]]) {
          const s2 = T.torsoSpec(T.B.emblemH + h);
          if (T.rnz(s2, l) > 0.1) { const q = T.rpt(s2, l, 1); yGlyph(ctx, q.x, q.y, 8, pal.accent.b, 3.6); }
        }
        const bz = T.rnz(es, PI);
        if (spec.abY && bz > 0.3) { const q = T.rpt(es, PI, 2); yGlyph(ctx, q.x, q.y + 6, 20, pal.accent.b, 7); }
        else if (spec.label && bz > 0.3) { const q = T.rpt(es, PI, 2); badgeText(ctx, q.x, q.y + 6, 20, bz, spec.label, pal, G.line); }
        ctx.restore();
      },
    });
  }
  const _mobCache = new Map();
  function mobDef(kind, seed) {
    const spec = MOB_KIND[kind] || MOB_KIND.T4;
    const hv = ((seed | 0) % 3 + 3) % 3, hc = ((seed | 0) % 5 + 5) % 5;
    const key = kind + '|' + hv + '|' + hc;
    let d = _mobCache.get(key);
    if (d) return d;
    const baseDef = spec.base === 'shirou' ? K.SHIROU : RIN;
    const body = K.scaleBody(K.SHIROU_BODY, spec.k, spec.w);
    const pal = Object.assign({}, baseDef.pal, {
      accent: spec.accent, lining: { b: mix(spec.accent.b, '#ffffff', 0.25), s: spec.accent.s }, hair: MOB_HAIR_COL[hc],
      brow: MOB_HAIR_COL[hc].s, led: mix(spec.accent.b, '#ffffff', 0.5), nucleus: kind === 'band' || kind === 'neut' ? '#6a45bc' : '#3a4ab0',
    });
    const hair = [K.ALLY_HAIR.crop, K.ALLY_HAIR.fluffy, K.SHIROU_HAIR][hv];
    d = Object.assign({}, baseDef, {
      name: 'mob', seed: 7 + hv * 1.3 + hc * 0.7, exprDefault: 'calm', body, pal, outfit: mobOutfit(spec), stainKey: spec.base === 'shirou' ? 'shirou' : 'mob',
      head: Object.assign({}, RIN.head, { R: 50, eyeW: 0.34, eyeH: 0.36, eyeStyle: hv === 0 ? 'sharp' : null, browY: -0.85, hair, backLayer: false, blush: 0.4, blushLines: false }),
    });
    _mobCache.set(key, d);
    return d;
  }

  /* ------------------------------------------------------------ public wrappers (existing calls are untouched) */
  function drawAkane(ctx, opts) {
    if (!opts || !(opts.stain || opts.flat)) return ORIG.drawAkane(ctx, opts);
    return drawDef(ctx, K.AKANE, opts);
  }
  function drawShirou(ctx, opts) {
    if (!opts || !(opts.stain || opts.flat || opts.young)) return ORIG.drawShirou(ctx, opts);
    return drawDef(ctx, opts.young ? SHIROU_YOUNG : K.SHIROU, opts);
  }
  function drawWBCAlly(ctx, opts) {
    const v = ((opts && opts.variant) | 0) & 3;
    const m = v === 2 ? morphOf(opts) : 0;
    if (!opts || !(opts.stain || opts.flat || m > 0 || (v === 2 && opts.mhc))) return ORIG.drawWBCAlly(ctx, opts);
    const def = v === 2 && (m > 0 || opts.form === 'macrophage') ? macDef(m) : K.ALLIES[v];
    const fx = v === 2 && m > 0 && m < 1 && opts.morphFX !== false;
    if (fx) withFlat(ctx, opts, () => morphFX(ctx, Object.assign({}, K.DEFAULTS, opts), K.computeFrame(def, opts), def, m, 'back'));
    return drawDef(ctx, def, opts, (F, d) => {
      if (opts.mhc) { const P = F.P, k = P.aimArm || 'R'; mhcTray(ctx, F.o, handFromF(d, F, k), Object.assign({}, MAC_PAL_ADD, { line: d.pal.line }), opts.mhc, F.o.t || 0); }
      if (fx) morphFX(ctx, F.o, F, d, m, 'front');
    });
  }
  function drawLymphoMob(ctx, opts) {
    const o = opts || {};
    return drawDef(ctx, mobDef(o.kind || 'T4', o.seed || 0), o);
  }

  /* ============================================================ ペタ (platelet) */
  const PETA_BODY = {
    hipH: 178, ankleH: 16, thigh: 86, shin: 80, foot: 36, hipW: 15,
    thighR: [18, 12.5], shinR: [12, 8.5], shoeR: [11, 10],
    upper: 58, fore: 52, armR: [9, 8, 6.5], handR: 10.5,
    shH: 90, shW: 26, neckH: 102, neckF: 2, neckLen: 16, neckR: 8,
    torso: [
      { h: -18, W: 24, D: 20, f: -1 }, { h: 0, W: 29, D: 22, f: -2 }, { h: 22, W: 29, D: 22, f: -2 }, { h: 46, W: 26, D: 20, f: 1 },
      { h: 68, W: 28, D: 21, f: 2 }, { h: 84, W: 30, D: 19, f: 1 }, { h: 95, W: 29, D: 17, f: -1 }, { h: 102, W: 20, D: 14, f: -1 }, { h: 108, W: 9, D: 9, f: 1 },
    ],
    waistH: 40, hemH: -34, hemW: 40, hemD: 33, capeLen: 70, emblemH: 72,
  };
  const PETA_PAL = {
    line: '#33264a',
    skin: { b: '#ffece4', s: '#f2c0b2', h: '#fffaf6' },
    hair: { b: '#ddd2f8', s: '#ab9ad8', h: '#ffffff', ring: '#ffffff' },
    iris: { d: '#35196a', b: '#9466e0', l: '#e6d6ff' },
    lash: '#2c1846', sclera: '#fffdff', brow: '#8a74b8', mouthIn: '#6e2440', tongue: '#f08aa0', blush: '#ff8fb0',
    tunic: { b: '#f8f5ff', s: '#d4c8ee', h: '#ffffff' }, shorts: { b: '#8a6ad0', s: '#6648a8', h: '#b49af0' },
    sleeve: { b: '#ebe2fd', s: '#c0b0e8', h: '#ffffff' }, cape: { b: '#c8b4f2', s: '#9c84d6', h: '#eee6ff' }, lining: { b: '#9a7ad8', s: '#7658b8' },
    sock: { b: '#ffffff', s: '#d8d2e6' }, shoe: { b: '#7a5ac8', s: '#58409a', h: '#a88ae8' }, sole: '#f4f0ff',
    accent: { b: '#9a7ae0', s: '#7458c0', h: '#c8b4ff' }, emblemBg: '#ffffff', nucleus: '#8a62d8', cuff: '#9a7ae0',
    hyalo: '#e9e3fb', granulo: { b: '#b890ec', s: '#9068d0', h: '#dcc4ff' }, granule: '#5e2cae', ring: '#c4f6ff',
    ribbon: { b: '#e6dbff', s: '#b6a0ec', h: '#ffffff' },
  };
  function petaBeret(G, pal, A) {
    const ctx = G.ctx, sp = A.sp, hy = A.hy, o = A.o;
    const act = sstep(clamp(o.activated || 0, 0, 1)), t = A.t;
    const bob = 0.02 * sin(A.ph * TAU * 2) * A.speed;
    const c = sp(-0.12, 0.58, 1.0);
    ctx.save();
    ctx.translate(c.x, c.y - 0.02 + bob - 0.06 * act);
    ctx.rotate(0.16 * sin(hy) - 0.1 * cos(hy) + 0.03 * sin(t * 1.3) * act);
    const rx = lerp(1.2, 1.06, act), ry = lerp(0.36, 0.6, act), dome = lerp(0.12, 0.36, act);
    // body: flat disc (top face) with a little thickness; rounds up into a ball when activated
    const body = new Path2D();
    body.ellipse(0, -dome, rx, ry + dome, 0, 0, TAU);
    // translucent hyalomere (we see the hair through it)
    ctx.save();
    ctx.lineWidth = G.lw * 2; ctx.strokeStyle = G.line; ctx.stroke(body);
    ctx.fillStyle = rgba(pal.hyalo, 0.86); ctx.fill(body);
    ctx.clip(body);
    crescent(ctx, body, -0.05 * G.facing, -0.1, rgba(pal.granulo.s, 0.55));
    crescent(ctx, body, 0.03 * G.facing, 0.06, 'rgba(255,255,255,0.9)');
    // granulomere: purple dotted centre
    const gr = new Path2D(); gr.ellipse(0.04, -dome - 0.02, rx * 0.56, (ry + dome) * 0.56, 0, 0, TAU);
    ctx.fillStyle = pal.granulo.b; ctx.fill(gr);
    crescent(ctx, gr, -0.03 * G.facing, -0.05, pal.granulo.s);
    ctx.fillStyle = pal.granule;
    for (let i = 0; i < 14; i++) {
      const a = hash(i * 1.3) * TAU, r = sqrt(hash(i * 2.9)) * 0.85;
      ctx.beginPath(); ctx.arc(0.04 + cos(a) * rx * 0.5 * r, -dome - 0.02 + sin(a) * (ry + dome) * 0.5 * r, 0.045 + 0.02 * hash(i * 4.1), 0, TAU); ctx.fill();
    }
    ctx.restore();
    // marginal microtubule ring: light piping all around the rim
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.09; ctx.strokeStyle = rgba(pal.ring, 0.35);
    ctx.beginPath(); ctx.ellipse(0, -dome, rx * 0.9, (ry + dome) * 0.86, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    ctx.lineWidth = 0.035; ctx.strokeStyle = pal.ring;
    ctx.beginPath(); ctx.ellipse(0, -dome, rx * 0.9, (ry + dome) * 0.86, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = G.lw * 0.9; ctx.strokeStyle = G.line; ctx.stroke(body);
    // glossy highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.ellipse(0, -dome, rx * 0.78, (ry + dome) * 0.7, 0, PI * 1.12, PI * 1.45); ctx.stroke();
    ctx.restore();
  }
  function petaCape(env, act) {
    const { G, pal, J, P, B, rpt, addG, sY, cY, o, pr } = env;
    const ctx = G.ctx, t = o.t || 0;
    addG(cY < -0.1 ? env.coverZ + 0.7 : -1000, () => {
      const top = [], bot = [], mid = [];
      const lams = [1.45, 2.05, 2.6, PI, -2.6, -2.05, -1.45];
      const sp = env.torsoSpec(B.shH + 5);
      lams.forEach((lam, j) => {
        top.push(rpt(sp, lam, 2));
        const p3 = J.body(sp.f + (sp.D + 2) * cos(lam), sp.h, (sp.W + 2) * sin(lam), sp.tw);
        const back = -cos(lam), side = sin(lam);
        const fl = sin(t * 7.5 - j * 0.9 + P.phase * TAU * 2) * P.speed + 0.35 * sin(t * 1.7 + j * 0.8);
        const ang = lerp(0.12, 0.95, P.speed) + 0.1 * fl + 0.2 * act;
        const len = B.capeLen * (0.9 + 0.1 * back) * (1 + 0.15 * act);
        const spread = 0.28 + 0.15 * P.speed + 0.4 * act;
        const d = [-sin(ang) * (0.6 + 0.4 * back) - 0.1, cos(ang), side * spread];
        const b3 = pr([p3[0] + d[0] * len, p3[1] + d[1] * len, p3[2] + d[2] * len]);
        const m3 = pr([p3[0] + d[0] * len * 0.5, p3[1] + d[1] * len * 0.5, p3[2] + d[2] * len * 0.5]);
        bot.push(b3); mid.push(m3);
      });
      const hem = [];
      for (let j = 0; j < bot.length; j++) { hem.push(bot[j]); if (j < bot.length - 1) { const m = lp2(bot[j], bot[j + 1], 0.5); hem.push({ x: m.x, y: m.y - 5 }); } }
      // ribbons first (behind the cape)
      if (act > 0.01) {
        bot.forEach((b, j) => {
          const dx = b.x - mid[j].x, dy = b.y - mid[j].y;
          if (j % 2 && j !== 3) return;
          ribbon(G, b, atan2(dy, dx) + 0.35 * sin(j * 1.7), act * (62 + 22 * hash(j)), 13, t, j + 1, pal.ribbon, 0.3);
        });
      }
      const allP = smooth(top.concat([mid[mid.length - 1]], hem.slice().reverse(), [mid[0]]), true);
      drawParts(G, [{ p: allP, c: cY < -0.1 ? pal.cape : { b: pal.lining.b, s: pal.lining.s }, k: 8, hk: 2 }]);
      ctx.save(); ctx.clip(allP);
      ctx.strokeStyle = rgba(pal.cape.s, 0.9); ctx.lineWidth = G.lw * 0.6;
      for (const j of [1, 3, 5]) { ctx.beginPath(); ctx.moveTo(top[j].x, top[j].y + 6); ctx.quadraticCurveTo(mid[j].x, mid[j].y, bot[j].x, bot[j].y - 3); ctx.stroke(); }
      ctx.restore();
    });
  }
  const PETA_OUT = {
    legThigh: (p) => p.shorts, legShin: (p) => p.skin, shoe: (p) => p.shoe, sole: (p) => p.sole,
    upperArm: (p) => p.skin, foreArm: (p) => p.skin, hand: (p) => p.skin, torso: (p) => p.tunic,
    legExtra(pal, a) {
      const top = a.lp2(a.knee, a.ankle, 0.42);
      return [{ p: a.capsule(top, a.ankle, a.B.shinR[0] * 1.04, a.B.shinR[1] * 1.12, 0, 0.1), c: pal.sock, k: 4, ol: 0.7, noStroke: true }];
    },
    legDetail(G, pal, a) {
      const ctx = G.ctx, b2 = lp2(a.hip, a.knee, 0.92);
      const dx = a.knee.x - a.hip.x, dy = a.knee.y - a.hip.y, L = hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      ctx.lineWidth = 4; ctx.strokeStyle = pal.accent.h;
      ctx.beginPath(); ctx.moveTo(b2.x + nx * 13, b2.y + ny * 13); ctx.lineTo(b2.x - nx * 13, b2.y - ny * 13); ctx.stroke();
    },
    armExtra(pal, a) {
      const w0 = a.lp2(a.el, a.wr, 0.82);
      return [{ p: a.capsule(w0, a.wr, a.B.armR[2] * 1.25, a.B.armR[2] * 1.25), c: { b: pal.cuff, s: pal.accent.s }, k: 2 }];
    },
    armDetail(G, pal, a) {
      const ctx = G.ctx, o = a.o || {}, act = sstep(clamp(o.activated || 0, 0, 1)), t = o.t || 0;
      const e = a.lp2(a.sh, a.el, 0.72);
      if (act > 0.01) {
        const dx = a.el.x - a.sh.x, dy = a.el.y - a.sh.y, ang = atan2(dy, dx);
        for (let i = 0; i < 2; i++) ribbon(G, e, ang + (i ? 0.75 : -0.55), act * (40 + 12 * i), 10, t, (a.k === 'R' ? 3 : 7) + i, pal.ribbon, 0.3);
      }
      const sl = a.capsule(a.sh, e, a.B.armR[0] * 1.45, a.B.armR[1] * 1.5 * (1 + 0.15 * act), 0.12, 0.12);
      drawParts(G, [{ p: sl, c: pal.sleeve, k: 5, hk: 2 }]);
      ctx.save(); ctx.clip(sl);
      crescent(ctx, sl, (a.sh.x - e.x) * 0.12, (a.sh.y - e.y) * 0.12, pal.accent.b);
      ctx.restore();
      ctx.lineWidth = G.lw * 0.8; ctx.strokeStyle = G.line; ctx.stroke(sl);
    },
    torsoDetail(G, pal, T) {
      const ctx = G.ctx;
      // front placket
      const pts = [];
      for (let i = 0; i <= 6; i++) { const h = lerp(T.B.waistH, T.B.neckH - 8, i / 6), s2 = T.torsoSpec(h); if (T.rnz(s2, 0.02) > -0.05) pts.push(T.rpt(s2, T.clampLam(T.extremes(s2), 0.02), 1)); }
      if (pts.length > 1) { ctx.lineWidth = G.lw * 0.6; ctx.strokeStyle = rgba(pal.tunic.s, 1); ctx.beginPath(); addSmoothCtx(ctx, pts); ctx.stroke(); }
      // sash
      const bs = T.torsoSpec(T.B.waistH), be = T.extremes(bs);
      const top = T.nearArc(bs, be, 12, 2).map((q) => ({ x: q.x, y: q.y - 6 })), bot = T.nearArc(bs, be, 12, 2).map((q) => ({ x: q.x, y: q.y + 6 }));
      const belt = new Path2D(); addSmooth(belt, top, false); addSmooth(belt, bot.slice().reverse(), false, false); belt.closePath();
      drawParts(G, [{ p: belt, c: pal.accent, k: 3 }]);
      // badge: empty circle (no nucleus)
      const es = T.torsoSpec(T.B.emblemH), lam = 0.42, nz = T.rnz(es, lam);
      if (nz > 0.12) { const c = T.rpt(es, lam, 2); drawNucleusEmblem(ctx, c.x, c.y, 12, nz, pal, G.lw * 0.6, G.line, 'none'); }
      const nzb = T.rnz(es, PI);
      if (nzb > 0.3) { const c = T.rpt(es, PI, 2); drawNucleusEmblem(ctx, c.x, c.y + 4, 17, nzb, pal, G.lw * 0.6, G.line, 'none'); }
    },
    collar(G, pal, env) { // rounded "Peter Pan" collar
      const { torsoSpec, rpt, extremes, clampLam, rnz, B } = env;
      const h = B.neckH - 3, s = torsoSpec(h), ex = extremes(s);
      if (rnz(s, 0) < -0.1) return;
      const parts = [];
      for (const sg of [-1, 1]) {
        const a = rpt(s, clampLam(ex, sg * 1.05), 3), b = rpt(s, clampLam(ex, sg * 0.06), 3);
        const m = lp2(a, b, 0.5);
        parts.push({ p: smooth([a, { x: m.x + (a.x - b.x) * 0.15, y: m.y + 14 }, { x: b.x, y: b.y + 12 }, b], true), c: pal.tunic, k: 2.5 });
      }
      drawParts(G, parts);
    },
    extraGroups(env) {
      const { G, pal, P, B, ring, extremes, nearArc, addG, rpt, o } = env;
      const ctx = G.ctx, t = o.t || 0, act = sstep(clamp(o.activated || 0, 0, 1));
      petaCape(env, act);
      addG(max(env.coverZ, 0.5), () => { // tunic skirt
        const thR = P.legs.R.th, thL = P.legs.L.th;
        const ws = env.torsoSpec(B.waistH);
        const top = ring({ h: B.waistH, W: ws.W + 1, D: ws.D + 1, f: ws.f, lk: 1 });
        const hemDisp = (lam) => {
          const wr = clamp(-sin(lam) * 1.3 + 0.5, 0, 1), wl = clamp(sin(lam) * 1.3 + 0.5, 0, 1);
          const push = (wr * sin(thR) + wl * sin(thL)) / max(wr + wl, 0.01);
          const back = -cos(lam);
          return [push * 28 - P.speed * 8 * max(back, 0), 2 * sin(t * 8 + lam * 3) * P.speed + 1.2 * sin(t * 1.5 + lam * 2) + P.speed * 6 * max(back, 0), 0];
        };
        const hem = ring({ h: B.hemH, W: B.hemW * (1 + 0.18 * act), D: B.hemD * (1 + 0.18 * act), f: -2, tw: P.hipTwist, lk: 0.35, disp: hemDisp });
        const et = extremes(top), eh = extremes(hem);
        const ta = nearArc(top, et, 10), ha = nearArc(hem, eh, 16);
        const hz = ha.map((p, i) => ({ x: p.x, y: p.y + (i % 2 ? -2.5 : 1.5) }));
        const pth = new Path2D();
        addSmooth(pth, hz, false);
        pth.lineTo(et.pmx.x, et.pmx.y);
        for (let i = ta.length - 1; i >= 0; i--) pth.lineTo(ta[i].x, ta[i].y);
        pth.closePath();
        drawParts(G, [{ p: pth, c: pal.tunic, k: 7, hk: 2 }]);
        ctx.save(); ctx.clip(pth);
        ctx.lineWidth = 5; ctx.strokeStyle = pal.accent.h;
        ctx.beginPath(); addSmoothCtx(ctx, hz.map((q) => ({ x: q.x, y: q.y - 4 }))); ctx.stroke();
        ctx.lineWidth = G.lw * 0.5; ctx.strokeStyle = pal.tunic.s;
        for (let i = 2; i < 16; i += 3) { const a = rpt(top, et.lmn + et.dir * et.span * i / 16); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ha[i].x, ha[i].y); ctx.stroke(); }
        ctx.restore();
      });
      K.holdGroup(env);
    },
  };
  const PETA_HAIR = Object.assign({}, K.ALLY_HAIR.fluffy, { capR: 1.1 });
  const PETA = {
    name: 'peta', masc: false, seed: 5.2, exprDefault: 'happy', stainKey: 'peta',
    body: PETA_BODY, pal: PETA_PAL, outfit: PETA_OUT,
    head: {
      R: 50, eyeLam: 0.4, eyePhi: -0.2, eyeW: 0.41, eyeH: 0.52, browY: -0.76, browW: 0.13, mouthPhi: -0.64, mouthW: 0.22,
      hair: PETA_HAIR, accessory: petaBeret, backLayer: false, blushLines: true, blush: 1, shape: { jaw: 0.9, wide: 1.02 },
    },
  };
  const PETA_VAR = [0, 22, -24, 44, -46, 70];
  const _petaCache = new Map();
  function petaDef(o) {
    let hue = o && o.hue != null ? o.hue : o && o.variant ? PETA_VAR[((o.variant | 0) % 6 + 6) % 6] : 0;
    hue = Math.round(hue / 5) * 5;
    if (!hue) return PETA;
    let d = _petaCache.get(hue);
    if (d) return d;
    const pal = {};
    for (const k in PETA_PAL) {
      const v = PETA_PAL[k];
      if (k === 'skin' || k === 'iris' || k === 'line' || k === 'sclera' || k === 'mouthIn' || k === 'tongue' || k === 'blush' || k === 'lash') pal[k] = v;
      else pal[k] = typeof v === 'string' ? hueShift(v, hue) : K.mapCols(v, (c) => hueShift(c, hue));
    }
    d = Object.assign({}, PETA, { pal, seed: 5.2 + hue * 0.01 });
    _petaCache.set(hue, d);
    return d;
  }
  function drawPeta(ctx, opts) { return drawDef(ctx, petaDef(opts || {}), opts || {}); }

  /* ============================================================ キョウコ (megakaryocyte) */
  const KYOKO_BODY = (() => {
    const b = K.scaleBody(K.ALLIES[0].body, 1.55, 1.22);
    b.robeHem = -(b.hipH - 8);
    return b;
  })();
  const KYOKO_PAL = {
    line: '#2e1d3e',
    skin: { b: '#fde6dc', s: '#efbaa8', h: '#fff7f2' },
    hair: { b: '#4c2e66', s: '#2c1a40', h: '#7c5aa4', ring: '#b89ad8' },
    iris: { d: '#38124e', b: '#9658d0', l: '#ead0ff' },
    lash: '#24102e', sclera: '#fffdfd', brow: '#3a2250', mouthIn: '#6a2038', tongue: '#e88094', blush: '#ff8aa4',
    robe: { b: '#5c3290', s: '#3e1f66', h: '#8a62c4' }, inner: { b: '#f1e8fb', s: '#cdb9e8', h: '#ffffff' },
    under: { b: '#3a2452', s: '#24143a', h: '#5a3a78' }, shoe: { b: '#4a2d6a', s: '#2e1a48', h: '#6e4a94' }, sole: '#d8c8ee',
    accent: { b: '#e8c46a', s: '#b8903a', h: '#fff0b8' }, sash: { b: '#d9b4f4', s: '#ac84d6', h: '#f4e6ff' },
    demarc: '#dcc6ff', disc: '#f6eeff', ring: '#c8f2ff', emblemBg: '#ffffff', nucleus: '#6c3fb8',
    lobe: { b: '#6c40bc', s: '#47248a', h: '#b490f2' }, crownBand: '#e8c46a',
  };
  function kyokoCrown(G, pal, A) {
    const ctx = G.ctx, sp = A.sp, o = A.o, n = o.lobes === 5 ? 5 : 6;
    if (cos(A.hy) < -0.05) kyokoCurtain(G, pal, A, true);
    const lobes = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1) - 0.5;
      const lam = u * 2.5, phi = 0.78 + 0.22 * (1 - 4 * u * u);
      const p = sp(lam, phi, 1.13);
      lobes.push({ p, r: 0.19 + 0.04 * (1 - 4 * u * u) });
    }
    // connecting strands first
    const vis = lobes.filter((l) => l.p.z > -0.35);
    if (vis.length > 1) {
      ctx.lineWidth = 0.05 + G.lw * 1.6; ctx.strokeStyle = G.line; ctx.beginPath(); addSmoothCtx(ctx, vis.map((l) => l.p)); ctx.stroke();
      ctx.lineWidth = 0.05; ctx.strokeStyle = pal.crownBand; ctx.beginPath(); addSmoothCtx(ctx, vis.map((l) => l.p)); ctx.stroke();
    }
    vis.sort((a, b) => a.p.z - b.p.z);
    for (const l of vis) {
      const pp = new Path2D(); pp.arc(l.p.x, l.p.y - l.r * 0.5, l.r, 0, TAU);
      drawParts(G, [{ p: pp, c: pal.lobe, k: 0.05, hk: 0.025 }]);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(l.p.x - l.r * 0.35, l.p.y - l.r * 0.85, l.r * 0.18, 0, TAU); ctx.fill();
    }
  }
  function kyokoCurtain(G, pal, A, front) {
    const ctx = G.ctx, hy = A.hy, t = A.t;
    const back = -sin(hy) * 0.55, wk = 0.55 + 0.45 * abs(cos(hy));
    const pts = [];
    const N = 7, L = 3.5;
    pts.push(P2(back - 0.98 * wk, -0.2));
    pts.push(P2(back - 1.12 * wk + 0.05 * sin(t * 1.2), 1.4));
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = back + lerp(-1.3, 1.3, u) * wk + 0.06 * sin(t * 1.4 + i);
      pts.push(P2(x, L + (i % 2 ? -0.28 : 0.04) + 0.08 * sin(t * 1.1 + i * 1.7), !(i % 2)));
    }
    pts.push(P2(back + 1.12 * wk + 0.05 * sin(t * 1.2 + 1), 1.4));
    pts.push(P2(back + 0.98 * wk, -0.2));
    pts.push(P2(back, -0.9));
    const p = smooth(pts, true);
    drawParts(G, [{ p, c: { b: pal.hair.b, s: pal.hair.s, h: pal.hair.h }, k: 0.1, hk: 0.03 }]);
    ctx.save(); ctx.clip(p);
    ctx.strokeStyle = rgba(pal.hair.s, 0.9); ctx.lineWidth = G.lw * 0.5;
    for (const u of [-0.6, -0.2, 0.25, 0.65]) { ctx.beginPath(); ctx.moveTo(back + u * wk, 0.6); ctx.quadraticCurveTo(back + u * wk * 1.2 + 0.05, 2.0, back + u * wk * 1.3, L - 0.3); ctx.stroke(); }
    ctx.restore();
  }
  const KYOKO_HAIR = {
    capR: 1.08, bound: [0.46, 0.0, -0.5],
    backPts: [[PI, -0.6, 1.08], [PI - 0.9, -0.55, 1.1], [PI + 0.9, -0.55, 1.1], [PI - 1.4, -0.4, 1.1], [PI + 1.4, -0.4, 1.1]],
    bangs: [
      { r: -0.82, t: -1.02, w: 0.34, ft: -0.3 }, { r: -0.42, t: -0.7, w: 0.3, ft: -0.02 },
      { r: 0.42, t: 0.7, w: 0.3, ft: -0.02 }, { r: 0.82, t: 1.02, w: 0.34, ft: -0.3 },
    ],
    locks: [
      { r: -1.3, t: -1.24, w: 0.2, ft: -1.12, rr: 0.32, bul: 1.14, tipR: 1.75, curl: -0.04 },
      { r: 1.3, t: 1.24, w: 0.2, ft: -1.12, rr: 0.32, bul: 1.14, tipR: 1.75, curl: 0.04 },
    ],
    lines: [-0.5, 0.5],
  };
  function kyokoSleeve(G, pal, a) {
    const ctx = G.ctx, t = (a.o && a.o.t) || 0;
    const e = a.lp2(a.sh, a.el, 0.25);
    const dx = a.wr.x - e.x, dy = a.wr.y - e.y, L = hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    let nx = -uy, ny = ux; if (ny < 0) { nx = -nx; ny = -ny; } // n points "down"
    const w = { x: a.wr.x + ux * 6, y: a.wr.y + uy * 6 };
    const r0 = a.B.armR[0] * 1.5, r1 = a.B.armR[0] * 2.3;
    const hang = 70 + 10 * sin(t * 1.3 + (a.k === 'R' ? 0 : 1));
    const bag = { x: lerp(e.x, w.x, 0.62) + nx * r1 * 0.6, y: lerp(e.y, w.y, 0.62) + hang + ny * r1 * 0.3 };
    const pts = [P2(e.x - nx * r0, e.y - ny * r0), P2(w.x - nx * r1, w.y - ny * r1, 1), P2(w.x + nx * r1 * 1.2, w.y + ny * r1 * 1.2 + 10, 1), bag, P2(e.x + nx * r0, e.y + ny * r0)];
    const sl = smooth(pts, true);
    drawParts(G, [{ p: sl, c: pal.robe, k: 7, hk: 2 }]);
    ctx.save(); ctx.clip(sl);
    // cuff trim + demarcation lines on the sleeve
    ctx.lineWidth = 7; ctx.strokeStyle = pal.sash.b;
    ctx.beginPath(); ctx.moveTo(w.x - nx * r1, w.y - ny * r1); ctx.lineTo(w.x + nx * r1 * 1.2, w.y + ny * r1 * 1.2 + 10); ctx.stroke();
    ctx.lineWidth = G.lw * 0.45; ctx.strokeStyle = rgba(pal.demarc, 0.7);
    for (let i = 1; i <= 3; i++) { const q = lp2(e, w, i / 4); ctx.beginPath(); ctx.moveTo(q.x - nx * r0 * 1.4, q.y - ny * r0 * 1.4); ctx.quadraticCurveTo(q.x + nx * r1, q.y + ny * r1 + 20, q.x + nx * r1 * 0.6, q.y + hang * 0.8); ctx.stroke(); }
    ctx.restore();
  }
  function kyokoRobe(env, shed) {
    const { G, pal, J, P, B, ring, rpt, extremes, nearArc, addG, cY, o } = env;
    const ctx = G.ctx, t = o.t || 0;
    addG(max(env.coverZ, 0.5) + 0.2, () => {
      const thR = P.legs.R.th, thL = P.legs.L.th;
      const ws = env.torsoSpec(B.waistH);
      const top = ring({ h: B.waistH, W: ws.W + 3, D: ws.D + 3, f: ws.f, lk: 1 });
      const sit = !!P.sit;
      const lapF = sit ? B.thigh * 0.95 : 0;
      const lap = ring({ h: sit ? B.thighR[0] + 4 : -B.thigh * 0.35, W: B.hipW + B.thighR[0] + (sit ? 22 : 12), D: B.thighR[0] + 22, f: 0, tw: P.hipTwist, lk: 0.6,
        disp: (lam) => [lapF * max(cos(lam), 0) * 1.0, 0, 0] });
      const hemDisp = (lam) => {
        const back = -cos(lam);
        const wr = clamp(-sin(lam) * 1.4 + 0.5, 0, 1), wl = clamp(sin(lam) * 1.4 + 0.5, 0, 1);
        const push = sit ? 0 : (wr * sin(thR) + wl * sin(thL)) / max(wr + wl, 0.01) * max(cos(lam), 0);
        const fl = sin(t * 6 - lam * 2 + P.phase * TAU * 2) * P.speed;
        return [push * 70 - P.speed * (50 + 14 * fl) * max(back, 0) + (sit ? B.thigh * 1.05 * max(cos(lam), 0) : 0),
          P.speed * (24 + 10 * fl) * max(back, 0) + 3 * sin(t * 1.1 + lam * 2), 0];
      };
      const hemH = sit ? -(B.shin + B.ankleH) + 8 : B.robeHem;
      const hem = ring({ h: hemH, W: B.coatW * (sit ? 1.7 : 1.3), D: B.coatD * (sit ? 1.6 : 1.25), f: -4, tw: P.hipTwist, lk: sit ? 0 : 0.15, disp: hemDisp });
      const et = extremes(top), el = extremes(lap), eh = extremes(hem);
      const ta = nearArc(top, et, 12);
      const ha = nearArc(hem, eh, 30);
      const hz = ha.map((p, i) => ({ x: p.x, y: p.y + (i % 2 ? -6 : 3) }));
      const outline = ta.concat([el.pmx], hz.slice().reverse(), [el.pmn]);
      const pth = smooth(outline, true);
      drawParts(G, [{ p: pth, c: pal.robe, k: 14, hk: 3 }]);
      ctx.save(); ctx.clip(pth);
      // demarcation membranes: long panel seams + a fine cell grid near the hem
      ctx.strokeStyle = rgba(pal.demarc, 0.55); ctx.lineWidth = G.lw * 0.5;
      const lams = [];
      for (let i = 1; i < 12; i++) lams.push(et.lmn + et.dir * et.span * i / 12);
      for (const lam of lams) {
        if (env.rnz(hem, lam) < 0.05) continue;
        const a = rpt(top, lam), b = rpt(lap, lam), c = rpt(hem, lam);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(b.x, b.y, c.x, c.y); ctx.stroke();
      }
      const rows = [0.72, 0.84, 0.94];
      const rowPts = rows.map((f) => ha.map((h, i) => { const tp = rpt(lap, eh.lmn + eh.dir * eh.span * i / 30); return { x: lerp(tp.x, h.x, f), y: lerp(tp.y, h.y, f) }; }));
      ctx.strokeStyle = rgba(pal.demarc, 0.75);
      for (const rp of rowPts) { ctx.beginPath(); addSmoothCtx(ctx, rp); ctx.stroke(); }
      for (let r = 0; r < rows.length - 1; r++) for (let i = 1 + (r % 2); i < 30; i += 2) {
        const a = rowPts[r][i], b = rowPts[r + 1][i];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.lineWidth = 7; ctx.strokeStyle = pal.sash.b;
      ctx.beginPath(); addSmoothCtx(ctx, hz.map((q) => ({ x: q.x, y: q.y - 4 }))); ctx.stroke();
      ctx.restore();
      // budding discs at the scallop tips + discs drifting away
      if (shed > 0.01) {
        for (let i = 0; i < hz.length; i += 2) {
          if (env.rnz(hem, eh.lmn + eh.dir * eh.span * i / 30) < 0.15) continue;
          const k = clamp(shed * 1.6 - hash(i * 2.7) * 0.6, 0, 1);
          if (k <= 0) continue;
          const q = hz[i];
          glowDisc(ctx, q.x, q.y + 6 + 4 * k, 7.5 * sstep(k), pal.disc, pal.ring, 0.95);
        }
        const nFall = 16;
        for (let i = 0; i < nFall; i++) {
          if (hash(i * 3.3 + 1) > shed) continue;
          const ph = ((t * 0.22 + hash(i * 5.7)) % 1 + 1) % 1;
          const j = 2 * floor(hash(i * 7.1) * 15);
          const q = hz[min(j, hz.length - 1)];
          const x = q.x + 30 * sin(t * 0.9 + i) * ph + (hash(i) - 0.5) * 120 * ph, y = q.y + 10 + ph * 70;
          glowDisc(ctx, x, y, 7, pal.disc, pal.ring, (1 - ph) * min(1, ph * 8));
        }
      }
    });
  }
  function kyokoProcess(env, o) {
    const { G, pal, Q, addG } = env;
    if (!o.sleeveTo || !(o.sleeve > 0)) return;
    const s = o.scale || 1, facing = o.facing < 0 ? -1 : 1, sq = clamp(o.squash || 0, 0, 1);
    const T = { x: (o.sleeveTo.x - o.x) / (s * facing * (1 - 0.12 * sq)), y: (o.sleeveTo.y - o.y) / (s * (1 - 0.04 * sq)) };
    const k = clamp(o.sleeve, 0, 1), t = o.t || 0, shed = clamp(o.shed != null ? o.shed : 0.6, 0, 1);
    addG(1e4 - 0.5, () => {
      const ctx = G.ctx;
      const W = o.sleeveArm === 'L' ? Q.wristL : o.sleeveArm === 'R' ? Q.wristR : (hypot(T.x - Q.wristL.x, T.y - Q.wristL.y) < hypot(T.x - Q.wristR.x, T.y - Q.wristR.y) ? Q.wristL : Q.wristR);
      const dx = T.x - W.x, dy = T.y - W.y, L = hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const N = 24, pts = [];
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * k;
        const wv = sin(u * PI) * (0.12 * L) * sin(t * 0.8 + 1) + sin(u * PI * 3 + t * 1.6) * 10 * u;
        pts.push({ x: W.x + dx * u + nx * wv, y: W.y + dy * u + ny * wv, u });
      }
      const Lp = [], Rp = [];
      for (let i = 0; i <= N; i++) {
        const a0 = pts[max(i - 1, 0)], a1 = pts[min(i + 1, N)];
        let ex = a1.x - a0.x, ey = a1.y - a0.y; const l = hypot(ex, ey) || 1; ex /= l; ey /= l;
        const w = lerp(26, 13, i / N) + 3 * sin(i * 1.3 + t * 2);
        Lp.push({ x: pts[i].x - ey * w, y: pts[i].y + ex * w });
        Rp.push({ x: pts[i].x + ey * w, y: pts[i].y - ex * w });
      }
      const tip = pts[N];
      const tube = smooth(Lp.concat([{ x: tip.x + (tip.x - pts[N - 1].x) * 1.2, y: tip.y + (tip.y - pts[N - 1].y) * 1.2 }], Rp.slice().reverse()), true);
      drawParts(G, [{ p: tube, c: { b: mix(pal.robe.b, '#c8a8f0', 0.45), s: pal.robe.b, h: mix(pal.robe.h, '#ffffff', 0.3) }, k: 6, hk: 2 }]);
      ctx.save(); ctx.clip(tube);
      ctx.strokeStyle = rgba(pal.demarc, 0.8); ctx.lineWidth = G.lw * 0.5;
      for (let i = 2; i < N; i += 2) { ctx.beginPath(); ctx.moveTo(Lp[i].x, Lp[i].y); ctx.lineTo(Rp[i].x, Rp[i].y); ctx.stroke(); }
      ctx.fillStyle = rgba('#8a5ad8', 0.5);
      for (let i = 1; i < N; i += 2) { ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 2.5, 0, TAU); ctx.fill(); }
      ctx.restore();
      // platelets pinching off the tip
      if (k > 0.6) {
        const ex = tip.x - pts[N - 2].x, ey = tip.y - pts[N - 2].y, el = hypot(ex, ey) || 1;
        for (let i = 0; i < 6; i++) {
          const ph = ((t * 0.5 + i / 6) % 1);
          if (hash(i * 4.4) > shed) continue;
          const d = 18 + ph * 120;
          glowDisc(ctx, tip.x + ex / el * d + 14 * sin(t * 2 + i) * ph, tip.y + ey / el * d + 16 * ph * ph, 7.5, pal.disc, pal.ring, (1 - ph) * min(1, ph * 6) * sstep((k - 0.6) / 0.3));
        }
      }
    });
  }
  const KYOKO_OUT = {
    legThigh: (p) => p.under, legShin: (p) => p.under, shoe: (p) => p.shoe, sole: (p) => p.sole,
    upperArm: (p) => p.robe, foreArm: (p) => p.robe, hand: (p) => p.skin, torso: (p) => p.robe,
    armDetail(G, pal, a) { kyokoSleeve(G, pal, a); },
    torsoDetail(G, pal, T) {
      const ctx = G.ctx, B = T.B;
      // crossed collar (left over right) with the inner robe in the V
      const L = [], R = [];
      for (let i = 0; i <= 6; i++) {
        const u = i / 6, h = lerp(B.neckH - 2, B.waistH + 6, u), s2 = T.torsoSpec(h), ex = T.extremes(s2);
        L.push(T.rpt(s2, T.clampLam(ex, lerp(0.95, -0.12, u)), 1));
        R.push(T.rpt(s2, T.clampLam(ex, lerp(-0.95, 0.12, u)), 1));
      }
      if (T.rnz(T.torsoSpec(B.shH - 20), 0) > -0.2) {
        const v = new Path2D(); addSmooth(v, L, false); addSmooth(v, R.slice().reverse(), false, false); v.closePath();
        ctx.fillStyle = pal.inner.b; ctx.fill(v);
        crescent(ctx, v, 0, -10, pal.inner.s);
        for (const [pts, w] of [[R, 12], [L, 12]]) {
          ctx.lineCap = 'butt';
          ctx.lineWidth = w + G.lw * 1.6; ctx.strokeStyle = G.line; ctx.beginPath(); addSmoothCtx(ctx, pts); ctx.stroke();
          ctx.lineWidth = w; ctx.strokeStyle = pal.sash.b; ctx.beginPath(); addSmoothCtx(ctx, pts); ctx.stroke();
          ctx.lineCap = 'round';
        }
      }
      // demarcation seams on the bodice
      ctx.strokeStyle = rgba(pal.demarc, 0.45); ctx.lineWidth = G.lw * 0.45;
      for (const lam of [-1.05, 1.05]) {
        const pts = [];
        for (let i = 0; i <= 5; i++) { const s2 = T.torsoSpec(lerp(B.waistH, B.shH, i / 5)); if (T.rnz(s2, lam) > 0) pts.push(T.rpt(s2, lam, 0)); }
        if (pts.length > 1) { ctx.beginPath(); addSmoothCtx(ctx, pts); ctx.stroke(); }
      }
      // sash + clasp
      const bs = T.torsoSpec(B.waistH), be = T.extremes(bs);
      const top = T.nearArc(bs, be, 14, 3).map((q) => ({ x: q.x, y: q.y - 14 })), bot = T.nearArc(bs, be, 14, 3).map((q) => ({ x: q.x, y: q.y + 12 }));
      const belt = new Path2D(); addSmooth(belt, top, false); addSmooth(belt, bot.slice().reverse(), false, false); belt.closePath();
      drawParts(G, [{ p: belt, c: pal.sash, k: 5, hk: 2 }]);
      if (T.rnz(bs, 0) > 0.15) { const c = T.rpt(bs, 0, 4); K.drawDiscEmblem(ctx, c.x, c.y, 14, max(T.rnz(bs, 0), 0.3), { rim: pal.accent.b, ring: '#b48cf0', core: '#f6eeff' }, G.lw * 0.6, G.line); }
    },
    extraGroups(env) {
      const o = env.o;
      kyokoRobe(env, clamp(o.shed || 0, 0, 1));
      kyokoProcess(env, o);
    },
  };
  const KYOKO = {
    name: 'kyoko', masc: false, seed: 6.1, exprDefault: 'smile', stainKey: 'kyoko',
    body: KYOKO_BODY, pal: KYOKO_PAL, outfit: KYOKO_OUT,
    head: {
      R: 63, eyeLam: 0.4, eyePhi: -0.15, eyeW: 0.36, eyeH: 0.4, browY: -0.8, browW: 0.12, mouthPhi: -0.62, mouthW: 0.22,
      hair: KYOKO_HAIR, accessory: kyokoCrown, backLayer: true, backLayerExtra: (G, pal, A) => { if (cos(A.hy) >= -0.05) kyokoCurtain(G, pal, A, false); },
      blushLines: false, blush: 0.6, shape: { jaw: 1.02, narrow: 0.12 },
    },
  };
  function drawKyoko(ctx, opts) { return drawDef(ctx, KYOKO, opts || {}); }

  /* ============================================================ stem cell (glowing silhouette) */
  const STEM = Object.assign({}, PETA, {
    name: 'stem', exprDefault: 'calm', pal: K.mapCols(PETA_PAL, () => '#ffffff'),
    head: Object.assign({}, PETA.head, { accessory: null, hair: Object.assign({}, K.ALLY_HAIR.fluffy, { capR: 1.06 }) }),
  });
  let _off = null;
  function offCanvas(w, h) {
    if (!_off) _off = document.createElement('canvas');
    if (_off.width < w || _off.height < h) { _off.width = max(_off.width, w); _off.height = max(_off.height, h); }
    const c = _off.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.filter = 'none';
    c.clearRect(0, 0, _off.width, _off.height);
    return c;
  }
  function drawStemCell(ctx, opts) {
    const o = Object.assign({ x: 0, y: 0, scale: 1, t: 0, form: 'figure' }, opts || {});
    const s = o.scale, t = o.t;
    const pulse = o.pulse != null ? o.pulse : 0.5 + 0.5 * sin(t * 2.0);
    const a = alphaOf(o);
    const core = { x: o.x, y: o.y - (o.form === 'orb' ? 120 : 250) * s };
    ctx.save();
    ctx.globalAlpha *= a;
    // outer halo
    ctx.globalCompositeOperation = 'lighter';
    const R = (o.form === 'orb' ? 260 : 330) * s * (1 + 0.12 * pulse);
    let g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, R);
    g.addColorStop(0, 'rgba(255,246,214,' + (0.45 + 0.25 * pulse).toFixed(3) + ')'); g.addColorStop(0.4, 'rgba(255,226,160,' + (0.18 + 0.12 * pulse).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(core.x, core.y, R, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    if (o.form === 'orb') {
      const r = 100 * s;
      g = ctx.createRadialGradient(core.x - r * 0.25, core.y - r * 0.3, r * 0.1, core.x, core.y, r);
      g.addColorStop(0, '#fffdf4'); g.addColorStop(0.7, '#fbeec8'); g.addColorStop(1, 'rgba(240,214,150,0.85)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(core.x, core.y, r, 0, TAU); ctx.fill();
    } else {
      const W = Math.ceil(560 * s) + 8, H = Math.ceil(560 * s) + 8;
      const oc = offCanvas(W, H);
      const fo = Object.assign({}, o, { x: W / 2, y: H - 14 * s, alpha: 1, rim: null, tint: null, stain: null, flat: 0, line: 0.01, blink: 0, mouth: 0, expr: o.expr || 'calm' });
      K.drawFigure(oc, STEM, fo);
      oc.globalCompositeOperation = 'source-in';
      const gg = oc.createLinearGradient(0, 0, 0, H);
      gg.addColorStop(0, '#fffaf0'); gg.addColorStop(0.5, '#fbeccc'); gg.addColorStop(1, '#f0d8a4');
      oc.fillStyle = gg; oc.fillRect(0, 0, W, H);
      const dx = o.x - W / 2, dy = o.y - (H - 14 * s);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(' + (16 * s * (1 + 0.3 * pulse)).toFixed(1) + 'px)';
      ctx.globalAlpha *= 0.45 + 0.25 * pulse;
      ctx.drawImage(_off, 0, 0, W, H, dx, dy, W, H);
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= 0.92; ctx.drawImage(_off, 0, 0, W, H, dx, dy, W, H); ctx.restore();
    }
    // bright nucleus core
    ctx.globalCompositeOperation = 'lighter';
    const cr = (o.form === 'orb' ? 60 : 24) * s * (1 + 0.15 * pulse);
    g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, cr * 2.2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,248,220,' + (0.7 + 0.3 * pulse).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,230,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(core.x, core.y, cr * 2.2, 0, TAU); ctx.fill();
    // slow motes
    for (let i = 0; i < 10; i++) {
      const ph = ((t * 0.15 + hash(i * 2.3)) % 1), an = hash(i) * TAU + t * 0.2;
      const rr = (90 + 160 * ph) * s;
      ctx.fillStyle = 'rgba(255,240,200,' + (0.8 * (1 - ph)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(core.x + cos(an) * rr, core.y + sin(an) * rr * 0.8 - ph * 60 * s, (2 + 2 * hash(i * 9)) * s, 0, TAU); ctx.fill();
    }
    ctx.restore();
    return { core };
  }

  /* ============================================================ infected tissue cell (no gore) */
  const INF_PAL = {
    line: '#3a2a30', healthy: { b: '#f8cdb8', s: '#e5a48e', h: '#fff0e6' }, sick: { b: '#cfd4a6', s: '#a6ad7c', h: '#eef0d0' },
    nuc: '#b49ac8', nucS: '#8a6aa8', virus: '#8a3ab8', virusS: '#5a1a80', eye: '#3a2a30', blush: '#ff8a8a', sweat: '#bfe8ff',
    mhc: { b: '#e9e4f6', s: '#b8aed6', h: '#ffffff' }, flag: '#e0605a', pore: '#5a3048', bleb: { b: '#e8dcc8', s: '#c8b8a0', h: '#fff8ee' },
  };
  function drawInfectedCell(ctx, opts) {
    const o = Object.assign({ x: 0, y: 0, scale: 1, t: 0, sick: 1, expr: null, mhcFlag: 0, pores: 0, apoptosis: 0, mouth: 0, blink: 0 }, opts || {});
    const pal = K.tintPal(INF_PAL, o.tint), t = o.t, s = o.scale;
    const sick = clamp(o.sick, 0, 1), ap = clamp(o.apoptosis, 0, 1);
    const expr = o.expr || (sick > 0.5 ? 'sick' : 'calm');
    const lw = 4 / sqrt(max(s, 0.12));
    const G = { ctx, facing: 1, lw, line: pal.line, rim: null, pal, px: s };
    if (o.rim) { const r = typeof o.rim === 'string' ? { color: o.rim } : o.rim; G.rim = { color: r.color || '#ff5a5a', strength: r.strength != null ? r.strength : 0.55, dir: r.dir < 0 ? -1 : 1, w: r.width || 7 }; }
    const col = { b: mix(pal.healthy.b, pal.sick.b, sick), s: mix(pal.healthy.s, pal.sick.s, sick), h: mix(pal.healthy.h, pal.sick.h, sick) };
    const colA = ap > 0 ? { b: mix(col.b, '#e6e0d8', ap * 0.6), s: mix(col.s, '#c8c0b8', ap * 0.6), h: col.h } : col;
    ctx.save();
    ctx.translate(o.x, o.y); ctx.scale(s, s);
    ctx.globalAlpha *= alphaOf(o) * (1 - sstep((ap - 0.75) / 0.25));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const shrink = 1 - 0.4 * sstep(ap / 0.7);
    const wob = (1 - ap) * (0.015 + 0.02 * sick);
    const cy = -140 * shrink;
    const sway = (sick > 0.5 ? 0.04 : 0.015) * sin(t * 1.6);
    ctx.translate(0, 0); ctx.rotate(sway);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(0, 4, 120 * shrink, 18 * shrink, 0, 0, TAU); ctx.fill();
    // little feet & arms
    const parts = [];
    for (const sg of [-1, 1]) parts.push({ p: (() => { const p = new Path2D(); p.ellipse(sg * 46 * shrink, -8, 26 * shrink, 14 * shrink, 0, 0, TAU); return p; })(), c: colA, k: 4 });
    const armDrop = lerp(-0.3, 0.55, sick);
    for (const sg of [-1, 1]) {
      const a0 = { x: sg * 112 * shrink, y: cy + 10 }, a1 = { x: sg * (150 + 6 * sin(t * 2 + sg)) * shrink, y: cy + 10 + 60 * armDrop * shrink };
      parts.push({ p: capsule(a0, a1, 15 * shrink, 12 * shrink), c: colA, k: 4 });
    }
    // body: soft hexagonal tissue-cell
    const bp = [];
    for (let i = 0; i < 6; i++) {
      const a = -PI / 2 + i * TAU / 6 + PI / 6, r = 128 * shrink * (1 + wob * sin(t * 3 + i * 1.7));
      bp.push({ x: cos(a) * r * 1.02, y: cy + sin(a) * r * 0.95 });
    }
    const body = smooth(bp.map((p, i) => ({ x: p.x, y: p.y })), true);
    parts.push({ p: body, c: colA, k: 14, hk: 4 });
    // apoptotic blebs bulge on the outline
    if (ap > 0.05) for (let i = 0; i < 7; i++) {
      const a = hash(i * 3.1) * TAU, k = sstep((ap - 0.05 - 0.05 * i) / 0.3);
      if (k <= 0) continue;
      const r = (16 + 10 * hash(i)) * k * shrink;
      const pp = new Path2D(); pp.arc(cos(a) * 118 * shrink, cy + sin(a) * 112 * shrink, r, 0, TAU);
      parts.push({ p: pp, c: pal.bleb, k: 3, hk: 1 });
    }
    drawParts(G, parts);
    ctx.save(); ctx.clip(body);
    // nucleus window (purple viral inclusions when sick)
    const nx = 52 * shrink, ny = cy - 50 * shrink;
    ctx.fillStyle = rgba(pal.nuc, 0.55); ctx.beginPath(); ctx.ellipse(nx, ny, 36 * shrink, 28 * shrink, 0.3, 0, TAU); ctx.fill();
    ctx.lineWidth = lw * 0.6; ctx.strokeStyle = rgba(pal.nucS, 0.8); ctx.stroke();
    ctx.fillStyle = rgba(pal.nucS, 0.7);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(nx + (hash(i) - 0.5) * 40 * shrink, ny + (hash(i + 4) - 0.5) * 30 * shrink, 3 * shrink, 0, TAU); ctx.fill(); }
    if (sick > 0.3) {
      ctx.fillStyle = rgba(pal.virus, sick);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(nx + (i - 1) * 12 * shrink, ny + 6 * shrink, 4.5 * shrink, 0, TAU); ctx.fill(); }
    }
    // sickly blotches
    if (sick > 0.2) {
      ctx.fillStyle = rgba(pal.sick.s, 0.35 * sick);
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse((hash(i * 4.2) - 0.5) * 180 * shrink, cy + (hash(i * 2.2) - 0.2) * 90 * shrink, 20 * shrink, 13 * shrink, hash(i) * 3, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    // face
    const fx = -24 * shrink, fy = cy + 8 * shrink;
    const blink = clamp(o.blink, 0, 1);
    for (const sg of [-1, 1]) {
      const ex = fx + sg * 30 * shrink, ey = fy;
      if (expr === 'sick') {
        const open = 0.45 * (1 - blink);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(ex, ey, 11 * shrink, 13 * shrink * max(open, 0.08), 0, 0, TAU); ctx.fill();
        ctx.fillStyle = pal.eye; ctx.beginPath(); ctx.ellipse(ex, ey + 2 * shrink, 6 * shrink, 8 * shrink * max(open, 0.08), 0, 0, TAU); ctx.fill();
        ctx.lineWidth = lw * 0.9; ctx.strokeStyle = pal.eye;
        ctx.beginPath(); ctx.moveTo(ex - 13 * shrink, ey - 6 * shrink + sg * 2); ctx.quadraticCurveTo(ex, ey - 10 * shrink, ex + 13 * shrink, ey - 4 * shrink - sg * 2); ctx.stroke();
        ctx.strokeStyle = rgba('#8a7a9a', 0.7); ctx.lineWidth = lw * 0.6;
        ctx.beginPath(); ctx.arc(ex, ey + 6 * shrink, 11 * shrink, 0.2 * PI, 0.8 * PI); ctx.stroke();
        ctx.strokeStyle = pal.eye; ctx.lineWidth = lw * 0.7;
        ctx.beginPath(); ctx.moveTo(ex - 12 * shrink, ey - 22 * shrink - sg * 4 * shrink); ctx.lineTo(ex + 10 * shrink, ey - 18 * shrink + sg * 4 * shrink); ctx.stroke();
      } else if (expr === 'scared') {
        const open = 1 - blink;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(ex, ey, 13 * shrink, 16 * shrink * max(open, 0.08), 0, 0, TAU); ctx.fill();
        ctx.lineWidth = lw * 0.7; ctx.strokeStyle = pal.eye; ctx.stroke();
        ctx.fillStyle = pal.eye; ctx.beginPath(); ctx.arc(ex + 1.5 * sin(t * 30), ey, 4.5 * shrink * open, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex - 12 * shrink, ey - 24 * shrink + sg * 5 * shrink); ctx.lineTo(ex + 10 * shrink, ey - 26 * shrink - sg * 5 * shrink); ctx.stroke();
      } else { // calm / relieved
        if (expr === 'relieved' || blink > 0.6) { ctx.lineWidth = lw * 0.9; ctx.strokeStyle = pal.eye; ctx.beginPath(); ctx.arc(ex, ey - 2 * shrink, 9 * shrink, 0.15 * PI, 0.85 * PI); ctx.stroke(); }
        else { ctx.fillStyle = pal.eye; ctx.beginPath(); ctx.ellipse(ex, ey, 7 * shrink, 10 * shrink, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 2 * shrink, ey - 4 * shrink, 2.6 * shrink, 0, TAU); ctx.fill(); }
      }
    }
    // mouth
    {
      const mx = fx, my = fy + 30 * shrink, m = clamp(o.mouth, 0, 1);
      ctx.lineWidth = lw * 0.8; ctx.strokeStyle = pal.eye;
      if (m > 0.08) { ctx.fillStyle = '#6a2a38'; ctx.beginPath(); ctx.ellipse(mx, my + 2, 9 * shrink, (3 + 10 * m) * shrink, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      else if (expr === 'sick') { ctx.beginPath(); ctx.moveTo(mx - 14 * shrink, my); for (let i = 1; i <= 4; i++) ctx.lineTo(mx - 14 * shrink + i * 7 * shrink, my + (i % 2 ? 4 : -2) * shrink); ctx.stroke(); }
      else if (expr === 'scared') { ctx.beginPath(); ctx.ellipse(mx, my + 2, 6 * shrink, 7 * shrink, 0, 0, TAU); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(mx, my - 6 * shrink, 10 * shrink, 0.2 * PI, 0.8 * PI); ctx.stroke(); }
    }
    if (sick > 0.4 && expr !== 'relieved') { // sweat drop
      const sx = fx + 70 * shrink, sy = fy - 34 * shrink + 4 * sin(t * 2);
      const d = new Path2D(); d.moveTo(sx, sy - 14 * shrink); d.quadraticCurveTo(sx + 10 * shrink, sy + 2, sx, sy + 8 * shrink); d.quadraticCurveTo(sx - 10 * shrink, sy + 2, sx, sy - 14 * shrink);
      ctx.fillStyle = pal.sweat; ctx.fill(d); ctx.lineWidth = lw * 0.6; ctx.strokeStyle = pal.line; ctx.stroke(d);
    }
    // virus particles budding on the surface (spiky balls, symbolic)
    const nv = floor(sick * 6 * (1 - ap));
    for (let i = 0; i < nv; i++) {
      const a = -PI * 0.9 + i * 0.55 + 0.1 * sin(t + i), r = 132 * shrink + 6 * sin(t * 2 + i);
      const vx = cos(a) * r, vy = cy + sin(a) * r * 0.95, vr = 9 * shrink;
      ctx.strokeStyle = pal.virusS; ctx.lineWidth = lw * 0.6;
      for (let j = 0; j < 8; j++) { const b = j * TAU / 8 + t; ctx.beginPath(); ctx.moveTo(vx + cos(b) * vr, vy + sin(b) * vr); ctx.lineTo(vx + cos(b) * vr * 1.6, vy + sin(b) * vr * 1.6); ctx.stroke(); }
      ctx.fillStyle = pal.virus; ctx.beginPath(); ctx.arc(vx, vy, vr, 0, TAU); ctx.fill(); ctx.stroke();
    }
    // MHC-I flag presenting a viral fragment
    if (o.mhcFlag > 0.01) {
      ctx.save(); ctx.globalAlpha *= clamp(o.mhcFlag, 0, 1);
      const bx = 70 * shrink, by = cy - 108 * shrink, h = 70 * o.mhcFlag;
      const pole = capsule({ x: bx, y: by }, { x: bx + 6, y: by - h }, 4, 3.5);
      const fl = new Path2D(); fl.moveTo(bx + 6, by - h); fl.lineTo(bx + 52 + 4 * sin(t * 3), by - h + 12); fl.lineTo(bx + 6, by - h + 26); fl.closePath();
      drawParts(G, [{ p: pole, c: pal.mhc, k: 2 }, { p: fl, c: pal.mhc, k: 3 }]);
      ctx.fillStyle = pal.flag; ctx.beginPath(); ctx.arc(bx + 22, by - h + 12, 6, 0, TAU); ctx.fill();
      ctx.strokeStyle = pal.flag; ctx.lineWidth = 2;
      for (let j = 0; j < 6; j++) { const b = j * TAU / 6; ctx.beginPath(); ctx.moveTo(bx + 22 + cos(b) * 6, by - h + 12 + sin(b) * 6); ctx.lineTo(bx + 22 + cos(b) * 10, by - h + 12 + sin(b) * 10); ctx.stroke(); }
      ctx.restore();
    }
    // perforin pores (ring-shaped channels)
    if (o.pores > 0.01) {
      for (let i = 0; i < 3; i++) {
        const k = sstep((o.pores - i * 0.25) / 0.35);
        if (k <= 0) continue;
        const px = [-70, 20, -10][i] * shrink, py = cy + [-60, 50, -90][i] * shrink;
        ctx.save(); ctx.globalAlpha *= k;
        ctx.fillStyle = rgba(pal.pore, 0.75); ctx.beginPath(); ctx.ellipse(px, py, 11 * k, 8 * k, 0, 0, TAU); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#f4f0ff'; ctx.beginPath(); ctx.ellipse(px, py, 14 * k, 10 * k, 0, 0, TAU); ctx.stroke();
        ctx.lineWidth = lw * 0.5; ctx.strokeStyle = pal.line; ctx.beginPath(); ctx.ellipse(px, py, 16.5 * k, 12.5 * k, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }
    // late apoptosis: tidy apoptotic bodies drifting apart + sparkles
    if (ap > 0.6) {
      const k = sstep((ap - 0.6) / 0.4);
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 + 0.4, d = 60 + 110 * k;
        const bx = cos(a) * d * shrink, by = cy + sin(a) * d * 0.7 * shrink - 30 * k;
        const pp = new Path2D(); pp.arc(bx, by, (22 - 6 * k) * shrink, 0, TAU);
        drawParts(G, [{ p: pp, c: pal.bleb, k: 3, hk: 1 }]);
      }
      ctx.fillStyle = 'rgba(255,255,240,0.9)';
      for (let i = 0; i < 10; i++) { const a = hash(i) * TAU, d = (80 + 120 * k) * shrink; ctx.beginPath(); ctx.arc(cos(a) * d, cy + sin(a) * d * 0.8, 3 * (1 - k * 0.5), 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    return { head: { x: o.x + fx * s, y: o.y + fy * s, r: 60 * s * shrink }, top: { x: o.x, y: o.y + (cy - 128 * shrink) * s } };
  }

  /* ============================================================ ミナト's giant hands (no face, ever) */
  const SPREAD_L = 400;
  const HAND_PAL = {
    line: '#3a2a2e', skin: { b: '#ffe2d0', s: '#efb69e', h: '#fff6ee' }, nail: { b: '#ffeef0', s: '#f2c4c8', h: '#ffffff' },
    glove: { b: '#cfc8f6', s: '#9c94da', h: '#f0ecff' }, cuff: { b: '#f8f8fc', s: '#cdd0de', h: '#ffffff' }, cuffBand: '#b8c4dc',
    crease: '#d4927e', print: '#e0a28c', glass: '#d8f0ff', glassEdge: '#6eb2d6', frost: '#f2f6fa', blood: '#d23848', bloodS: '#9a1c2c',
  };
  function chainPts(base, ang, L, bends) {
    const pts = [base];
    let a = ang, p = base;
    for (let i = 0; i < L.length; i++) { a += bends[i]; p = { x: p.x + cos(a) * L[i], y: p.y + sin(a) * L[i] }; pts.push(p); }
    return pts;
  }
  function ik2d(A, T, l1, l2, sg) {
    const dx = T.x - A.x, dy = T.y - A.y; let d = hypot(dx, dy) || 1;
    d = clamp(d, abs(l1 - l2) + 1, l1 + l2 - 0.5);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = sqrt(max(0, l1 * l1 - a * a));
    const ux = dx / hypot(dx, dy), uy = dy / hypot(dx, dy);
    const M = { x: A.x + ux * a - uy * h * sg, y: A.y + uy * a + ux * h * sg };
    return [A, M, { x: A.x + ux * d, y: A.y + uy * d }];
  }
  function fingerParts(pts, R, col) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) out.push({ p: capsule(pts[i], pts[i + 1], R[i], R[i + 1], 0.04, 0.04), c: col, k: 7, hk: 2.5 });
    return out;
  }
  function nail(G, pts, R, pal, view, side) {
    const ctx = G.ctx, n = pts.length - 1, tip = pts[n], pr = pts[n - 1];
    const dx = tip.x - pr.x, dy = tip.y - pr.y, L = hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const r = R[R.length - 1];
    let cx, cy, rx, ry;
    if (view === 'dorsal') { cx = tip.x - ux * r * 0.55; cy = tip.y - uy * r * 0.55; rx = r * 0.66; ry = r * 0.95; }
    else { const nx = uy * side, ny = -ux * side; cx = tip.x - ux * r * 0.5 + nx * r * 0.62; cy = tip.y - uy * r * 0.5 + ny * r * 0.62; rx = r * 0.26; ry = r * 0.8; }
    const p = new Path2D(); p.ellipse(cx, cy, rx, ry, atan2(uy, ux) + PI / 2, 0, TAU);
    ctx.fillStyle = pal.nail.b; ctx.fill(p);
    ctx.save(); ctx.clip(p); crescent(ctx, p, 0, -r * 0.15, pal.nail.s); ctx.restore();
    ctx.lineWidth = G.lw * 0.6; ctx.strokeStyle = G.line; ctx.stroke(p);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(cx - ux * r * 0.2 - uy * rx * 0.3, cy - uy * r * 0.2 + ux * rx * 0.3, rx * 0.22, ry * 0.3, atan2(uy, ux) + PI / 2, 0, TAU); ctx.fill();
  }
  function creases(G, pts, R, pal, n) {
    const ctx = G.ctx; ctx.strokeStyle = pal.crease; ctx.lineWidth = G.lw * 0.55;
    for (let i = 1; i < min(pts.length - 1, n == null ? 9 : n + 1); i++) {
      const a = pts[i - 1], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, r = R[i] * 0.55;
      ctx.beginPath(); ctx.moveTo(pts[i].x + nx * r, pts[i].y + ny * r); ctx.quadraticCurveTo(pts[i].x + dx / L * 3, pts[i].y + dy / L * 3, pts[i].x - nx * r, pts[i].y - ny * r); ctx.stroke();
    }
  }
  function cuffPart(G, pal, w, h, ang) {
    const ctx = G.ctx;
    ctx.save(); ctx.rotate(ang || 0);
    const p = new Path2D(); p.roundRect(-w / 2, -6, w, h, [10, 10, 0, 0]);
    drawParts(G, [{ p, c: pal.cuff, k: 10, hk: 3 }]);
    ctx.save(); ctx.clip(p); ctx.fillStyle = pal.cuffBand; ctx.fillRect(-w / 2, 22, w, 9); ctx.restore();
    ctx.lineWidth = G.lw * 0.8; ctx.strokeStyle = G.line; ctx.stroke(p);
    ctx.restore();
  }
  function glassRect(ctx, G, pal, x0, y0, w, h, frost) {
    const p = new Path2D(); p.rect(x0, y0, w, h);
    ctx.save();
    ctx.fillStyle = rgba(pal.glass, 0.42); ctx.fill(p);
    if (frost) { ctx.save(); ctx.clip(p); ctx.fillStyle = rgba(pal.frost, 0.85); ctx.fillRect(frost[0], frost[1], frost[2], frost[3]); ctx.restore(); }
    ctx.lineWidth = G.lw * 1.4; ctx.strokeStyle = pal.glassEdge; ctx.stroke(p);
    ctx.lineWidth = G.lw * 0.6; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + 6); ctx.lineTo(x0 + w - 6, y0 + 6); ctx.stroke();
    ctx.restore();
  }
  // hand geometry per pose, in the hand frame (wrist at 0,0; fingers point up = -y)
  function handGeom(pose) {
    const G = {};
    if (pose === 'thumb') { // palm toward the viewer, fingers folded, thumb up with its pad facing us
      G.view = 'palm';
      G.palm = [P2(-80, 0), P2(-96, -100), P2(-86, -186), P2(-40, -212), P2(24, -214), P2(78, -196), P2(98, -140), P2(100, -70), P2(70, 0)];
      G.fold = [[-64, 18], [-22, 20], [20, 19], [60, 17]].map(([x, r], i) => ({ a: { x, y: -232 + i * 3 + (i === 3 ? 18 : 0) }, b: { x: x + 2, y: -150 + (i === 3 ? 12 : 0) }, r }));
      G.thumb = chainPts({ x: 62, y: -66 }, -0.55, [70, 66, 58], [0, -0.42, -0.36]);
      G.thumbR = [32, 29, 27, 24];
      const tp = G.thumb, n = tp.length - 1, d = { x: tp[n].x - tp[n - 1].x, y: tp[n].y - tp[n - 1].y }, l = hypot(d.x, d.y);
      G.action = { x: tp[n].x - d.x / l * 26, y: tp[n].y - d.y / l * 26 };
      G.cuffW = 200;
    } else if (pose === 'pinch' || pose === 'push_spreader') { // radial side view; palm side = +x
      G.view = 'side';
      G.palm = [P2(-52, 0), P2(-58, -120), P2(-48, -192), P2(-18, -210), P2(34, -196), P2(58, -150), P2(62, -70), P2(50, 0)];
      G.back = [
        { pts: chainPts({ x: -6, y: -200 }, -1.45, [82, 50, 36], [0, 0.8, 0.7]), R: [21, 19, 17, 15] },
        { pts: chainPts({ x: -14, y: -192 }, -1.42, [74, 46, 34], [0.15, 1.0, 0.8]), R: [20, 18, 16, 14] },
        { pts: chainPts({ x: -22, y: -180 }, -1.38, [58, 38, 30], [0.25, 1.1, 0.8]), R: [18, 16, 14, 12.5] },
      ];
      const idx = chainPts({ x: -10, y: -202 }, -1.5, [88, 56, 42], [0.3, 0.9, 0.7]);
      G.index = idx; G.indexR = [22, 20, 18, 16];
      const T = idx[3], m1 = { x: 56, y: -86 }, j1 = { x: m1.x + cos(-1.1) * 64, y: m1.y + sin(-1.1) * 64 };
      const tgt = { x: T.x + 2, y: T.y + 24 };
      const [, M, E] = ik2d(j1, tgt, 70, 58, -1);
      G.thumb = [m1, j1, M, E]; G.thumbR = [30, 26, 23, 20];
      G.pinch = lp2(T, E, 0.5);
      G.action = pose === 'push_spreader' ? { x: G.pinch.x, y: G.pinch.y - SPREAD_L } : G.pinch;
      G.cuffW = 150;
    } else { // hold_slide: dorsal view (back of the right hand toward us), fingers over the slide end
      G.view = 'dorsal';
      G.palm = [P2(-84, 0), P2(-94, -110), P2(-84, -196), P2(-40, -222), P2(22, -226), P2(72, -208), P2(92, -150), P2(92, -70), P2(76, 0)];
      G.fingers = [
        { pts: chainPts({ x: -60, y: -206 }, -1.78, [96, 58, 42], [0, 0.06, 0.06]), R: [23, 20, 18, 16] },
        { pts: chainPts({ x: -16, y: -218 }, -1.62, [104, 62, 46], [0, 0.04, 0.05]), R: [24, 21, 19, 17] },
        { pts: chainPts({ x: 28, y: -210 }, -1.47, [96, 58, 42], [0, 0.05, 0.05]), R: [22, 20, 18, 16] },
        { pts: chainPts({ x: 66, y: -186 }, -1.3, [76, 46, 36], [0, 0.08, 0.08]), R: [19, 17, 15, 13.5] },
      ];
      G.thumb = chainPts({ x: -72, y: -70 }, -2.2, [72, 62, 48], [0, 0.25, 0.2]);
      G.thumbR = [30, 26, 23, 20];
      G.slide = { x0: -520, y0: -372, w: 600, h: 150 };
      G.action = { x: G.slide.x0 + G.slide.w / 2, y: G.slide.y0 + G.slide.h / 2 };
      G.cuffW = 196;
    }
    return G;
  }
  const _handGeom = {};
  function drawGiantHand(ctx, opts) {
    const o = Object.assign({ x: 0, y: 0, scale: 1, rot: 0, pose: 'thumb', t: 0 }, opts || {});
    const pose = o.pose === 'pinch' || o.pose === 'hold_slide' || o.pose === 'push_spreader' ? o.pose : 'thumb';
    const Hg = _handGeom[pose] || (_handGeom[pose] = handGeom(pose));
    const pal0 = K.tintPal(HAND_PAL, o.tint);
    const pal = o.glove ? Object.assign({}, pal0, { skin: pal0.glove, crease: pal0.glove.s, print: pal0.glove.s }) : pal0;
    const s = o.scale, flip = o.flip ? -1 : 1;
    const lw = (o.line != null ? o.line : 4) / sqrt(max(s, 0.12));
    const G = { ctx, facing: flip, lw, line: pal.line, rim: null, pal, px: s };
    if (o.rim) { const r = typeof o.rim === 'string' ? { color: o.rim } : o.rim; G.rim = { color: r.color || '#ff5a5a', strength: r.strength != null ? r.strength : 0.55, dir: r.dir < 0 ? -1 : 1, w: r.width || 9 }; }
    const prop = o.prop !== false;
    // pose frame: push_spreader = pinch mirrored, spreader down-left at 30°
    const poseRot = pose === 'push_spreader' ? -120 * DEG : 0, mir = pose === 'push_spreader' ? -1 : 1;
    const breathe = 1.5 * sin(o.t * 1.3);
    const A = Hg.action;
    const M = new DOMMatrix().translateSelf(o.x, o.y).rotateSelf(o.rot).scaleSelf(s * flip, s);
    const Mh = M.multiply(new DOMMatrix().rotateSelf(poseRot / DEG).scaleSelf(mir, 1).translateSelf(-A.x, -A.y + breathe));
    const TP = (m, p) => { const q = m.transformPoint(new DOMPoint(p.x, p.y)); return { x: q.x, y: q.y }; };
    ctx.save();
    ctx.globalAlpha *= alphaOf(o);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const base = ctx.getTransform();
    const setM = (m) => ctx.setTransform(base.multiply(m));
    const res = { pose, action: TP(M, { x: 0, y: 0 }) };
    if (pose === 'push_spreader' && prop && o.base !== false) { // base slide in the action frame (horizontal, contact at origin)
      setM(M);
      glassRect(ctx, G, pal, -760, 0, 1300, 26, null);
      if (o.blood !== false) { // blood bead along the contact line
        ctx.fillStyle = pal.blood; ctx.beginPath(); ctx.ellipse(18, -6, 34, 9, 0, PI, TAU); ctx.fill();
        ctx.lineWidth = G.lw * 0.6; ctx.strokeStyle = pal.bloodS; ctx.stroke();
      }
      res.contact = TP(M, { x: 0, y: 0 });
    }
    setM(Mh);
    // cuff (lab-coat sleeve) behind the wrist
    const cuffAng = pose === 'hold_slide' ? 0 : 0;
    if (Hg.view === 'palm' || Hg.view === 'dorsal') {
      if (pose === 'hold_slide') {
        drawParts(G, fingerParts(Hg.thumb, Hg.thumbR, pal.skin));
        if (!o.glove) nail(G, Hg.thumb, Hg.thumbR, pal, 'dorsal', 1);
        if (prop) { const S = Hg.slide; glassRect(ctx, G, pal, S.x0, S.y0, S.w, S.h, [S.x0 + S.w - 170, S.y0, 170, S.h]); res.slide = [TP(Mh, { x: S.x0, y: S.y0 }), TP(Mh, { x: S.x0 + S.w, y: S.y0 + S.h })]; }
        const parts = [{ p: smooth(Hg.palm, true), c: pal.skin, k: 12, hk: 4 }];
        for (const f of Hg.fingers) parts.push(...fingerParts(f.pts, f.R, pal.skin));
        drawParts(G, parts);
        for (const f of Hg.fingers) { creases(G, f.pts, f.R, pal, 2); if (!o.glove) nail(G, f.pts, f.R, pal, 'dorsal', 1); }
        // knuckle bumps & tendons
        ctx.strokeStyle = pal.crease; ctx.lineWidth = G.lw * 0.5;
        for (const f of Hg.fingers) { const b = f.pts[0]; ctx.beginPath(); ctx.arc(b.x, b.y + 4, f.R[0] * 0.6, PI * 1.15, PI * 1.85); ctx.stroke(); ctx.beginPath(); ctx.moveTo(b.x * 0.6, -60); ctx.quadraticCurveTo(b.x * 0.85, -130, b.x, b.y + 14); ctx.globalAlpha *= 0.5; ctx.stroke(); ctx.globalAlpha /= 0.5; }
        res.tips = { thumb: TP(Mh, Hg.thumb[3]), index: TP(Mh, Hg.fingers[0].pts[3]), middle: TP(Mh, Hg.fingers[1].pts[3]) };
      } else { // thumb (palm view)
        const parts = [{ p: smooth(Hg.palm, true), c: pal.skin, k: 12, hk: 4 }];
        for (const f of Hg.fold) parts.push({ p: capsule(f.a, f.b, f.r, f.r * 1.05, 0.05, 0.05), c: pal.skin, k: 6, hk: 3 });
        drawParts(G, parts);
        ctx.strokeStyle = pal.crease; ctx.lineWidth = G.lw * 0.55;
        for (const f of Hg.fold) { const m = lp2(f.a, f.b, 0.42); ctx.beginPath(); ctx.moveTo(m.x - f.r * 0.6, m.y); ctx.quadraticCurveTo(m.x, m.y + 5, m.x + f.r * 0.6, m.y); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-82, -126); ctx.quadraticCurveTo(-10, -112, 74, -140); ctx.stroke(); // palm lines
        ctx.beginPath(); ctx.moveTo(40, -24); ctx.quadraticCurveTo(28, -80, 62, -118); ctx.stroke();
        drawParts(G, fingerParts(Hg.thumb, Hg.thumbR, pal.skin));
        creases(G, Hg.thumb, Hg.thumbR, pal, 2);
        // fingerprint whorl on the thumb pad
        const tp = Hg.thumb, n = 3, d = { x: tp[n].x - tp[n - 1].x, y: tp[n].y - tp[n - 1].y }, l = hypot(d.x, d.y);
        const c = { x: tp[n].x - d.x / l * 20, y: tp[n].y - d.y / l * 20 };
        ctx.save();
        const pad = capsule(tp[n - 1], tp[n], Hg.thumbR[n - 1] * 0.9, Hg.thumbR[n] * 0.92); ctx.clip(pad);
        ctx.strokeStyle = rgba(pal.print, 0.75); ctx.lineWidth = G.lw * 0.4;
        for (let i = 1; i <= 6; i++) { ctx.beginPath(); ctx.ellipse(c.x, c.y, i * 4.2, i * 5.6, atan2(d.y, d.x) + PI / 2, PI * 0.08, PI * 1.92); ctx.stroke(); }
        ctx.restore();
        if (!o.glove) { // nail just visible at the far edge
          const ux = d.x / l, uy = d.y / l, r = Hg.thumbR[3];
          const np = new Path2D(); np.ellipse(tp[n].x + ux * r * 0.55, tp[n].y + uy * r * 0.55, r * 0.6, r * 0.22, atan2(uy, ux) + PI / 2, PI, TAU);
          ctx.fillStyle = pal.nail.b; ctx.fill(np); ctx.lineWidth = G.lw * 0.5; ctx.strokeStyle = G.line; ctx.stroke(np);
        }
        res.pad = TP(Mh, c); res.tips = { thumb: TP(Mh, tp[n]) };
      }
    } else { // side views
      drawParts(G, [].concat(...Hg.back.map((f) => fingerParts(f.pts, f.R, { b: pal.skin.s, s: mix(pal.skin.s, '#b07060', 0.3) }))));
      drawParts(G, [{ p: smooth(Hg.palm, true), c: pal.skin, k: 10, hk: 4 }]);
      if (pose === 'push_spreader' && prop) { // spreader slide: its end pinched between the pads, running along "up"
        const T = Hg.pinch;
        const p = new Path2D(); p.rect(T.x - 10, T.y - SPREAD_L, 20, SPREAD_L + 40);
        ctx.fillStyle = rgba(pal.glass, 0.5); ctx.fill(p);
        ctx.lineWidth = G.lw * 1.3; ctx.strokeStyle = pal.glassEdge; ctx.stroke(p);
        ctx.fillStyle = rgba(pal.frost, 0.85); ctx.fillRect(T.x - 9, T.y - 40, 18, 78);
      }
      drawParts(G, fingerParts(Hg.index, Hg.indexR, pal.skin));
      drawParts(G, fingerParts(Hg.thumb, Hg.thumbR, pal.skin));
      creases(G, Hg.index, Hg.indexR, pal, 2); creases(G, Hg.thumb, Hg.thumbR, pal, 2);
      if (!o.glove) { nail(G, Hg.index, Hg.indexR, pal, 'side', 1); nail(G, Hg.thumb, Hg.thumbR, pal, 'side', -1); }
      ctx.strokeStyle = pal.crease; ctx.lineWidth = G.lw * 0.5;
      ctx.beginPath(); ctx.moveTo(-40, -186); ctx.quadraticCurveTo(-20, -196, 0, -192); ctx.stroke();
      res.tips = { thumb: TP(Mh, Hg.thumb[3]), index: TP(Mh, Hg.index[3]) };
      res.pinch = TP(Mh, Hg.pinch);
    }
    cuffPart(G, pal, Hg.cuffW, 140, cuffAng);
    res.wrist = TP(Mh, { x: 0, y: 0 });
    if (G.rim) { /* rim handled per part via drawParts */ }
    ctx.restore();
    return res;
  }

  /* ============================================================ anchors */
  function resolveDef(who, o) {
    o = o || {};
    if (who === 'peta') return petaDef(o);
    if (who === 'kyoko') return KYOKO;
    if (who === 'mob' || who === 'lympho') return mobDef(o.kind || 'T4', o.seed || 0);
    if (who === 'shirou' && o.young) return SHIROU_YOUNG;
    if ((who === 'ally' || who === 'wbc') && (((o.variant | 0) & 3) === 2) && morphOf(o) > 0) return macDef(morphOf(o));
    return null;
  }
  function headAnchor(who, opts) {
    const d = resolveDef(who, opts);
    if (!d && !(opts && opts.flat)) return ORIG.headAnchor(who, opts);
    return flatPt(opts || {}, K.headAnchorDef(d || K.defOf(who, opts), opts));
  }
  function handAnchor(who, opts) {
    const d = resolveDef(who, opts);
    if (!d && !(opts && opts.flat)) return ORIG.handAnchor(who, opts);
    return flatDeep(opts || {}, K.handAnchorDef(d || K.defOf(who, opts), opts));
  }
  Object.assign(C, { drawPeta, drawKyoko, drawStemCell, drawInfectedCell, drawGiantHand, headAnchor, handAnchor,
    PETA_VARIANTS: PETA_VAR.length, MOB_KINDS: Object.keys(MOB_KIND), HAND_POSES: ['thumb', 'pinch', 'hold_slide', 'push_spreader'] });
  const EXT = { handFromF, withFlat, flatPt, flatDeep, drawDef, ribbon, glowDisc, recol, hueShift, toHsl, fromHsl, stainDef, alphaOf, hash, frillPts };
  BS.chars2 = { EXT, SHIROU_YOUNG, macDef, mobDef, MOB_KIND, ORIG };
  Object.assign(C, { drawAkane, drawShirou, drawWBCAlly, drawLymphoMob });
})();
