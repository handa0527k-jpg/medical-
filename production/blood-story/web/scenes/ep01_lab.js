// BLOOD STORY 第1話 — "lab" scenes: comp (#2–6 血液の成分), plasma (#7–9 血清・血餅／血漿タンパク), life (#21–24 赤血球の一生).
// Plain script, loaded by episode01.js. Registers BS.ep01.comp / .plasma / .life (ctx, t, E, S): t = film time, S = scene record.
// All timing comes from S.beats and E.line(id) (never hard-coded film seconds). Diagrams are Akane's wristband holograms
// (BS.diag.* with emitter:false + our own beam from her band). Settings: vessel (side view), bone marrow and spleen (drawn here).
(() => {
  const { W, H, clamp, lerp, ease, prog, keys, shake } = BS.common;
  BS.ep01 = BS.ep01 || {};
  const w = () => BS.world, c = () => BS.chars, d = () => BS.diag;
  const TAU = Math.PI * 2;
  const RIM = { color: '#ff7a5c', strength: 0.5 };
  const HOLO_RIM = { color: '#7fe8ff', strength: 0.55 };
  const lin = (t, ks) => keys(t, ks, ease.lin);
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  // ---------------------------------------------------------------- helpers
  function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  // Akane opts with life (blink, lipsync, rim)
  const AK = (t, o) => ({ t, blink: c().blinkAt(t, o.seed || 1), mouth: BS.E.mouth('アカネ', t), rim: RIM, ...o });
  // move opts so that her head centre lands at (hx, hy)
  function placeHead(o, hx, hy) { const a = c().headAnchor('akane', { ...o, x: 0, y: 0 }); return { ...o, x: hx - a.x, y: hy - a.y }; }
  // diagram as a hologram (no built-in emitter); returns the panel rect + a local→canvas mapper
  function holo(ctx, name, x, y, s, p, t, alpha = 1) {
    if (alpha > 0.003) d()[name](ctx, { x, y, scale: s, p, t, alpha, emitter: false });
    const [pw, ph] = d().SIZE[name];
    return { x, y, w: pw * s, h: ph * s, at: (lx, ly) => ({ x: x + lx * s, y: y + ly * s }) };
  }
  // light cone from the wristband to the bottom edge of the panel
  function beam(ctx, from, P, k, t) {
    if (k <= 0.01 || !from) return;
    const fl = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 5.3);
    const by = P.y + P.h / 2 + 4, x0 = P.x - P.w / 2 + 24, x1 = P.x + P.w / 2 - 24;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(from.x, from.y, P.x, by);
    g.addColorStop(0, `rgba(140,240,255,${0.42 * k * fl})`); g.addColorStop(0.25, `rgba(110,220,255,${0.16 * k * fl})`); g.addColorStop(1, `rgba(90,200,255,${0.05 * k * fl})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(from.x - 5, from.y); ctx.lineTo(x0, by); ctx.lineTo(x1, by); ctx.lineTo(from.x + 5, from.y); ctx.closePath(); ctx.fill();
    // edge rays
    ctx.strokeStyle = `rgba(160,245,255,${0.28 * k * fl})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(x0, by); ctx.moveTo(from.x, from.y); ctx.lineTo(x1, by); ctx.stroke();
    const eg = ctx.createRadialGradient(from.x, from.y, 0, from.x, from.y, 70);
    eg.addColorStop(0, `rgba(200,255,255,${0.7 * k})`); eg.addColorStop(1, 'rgba(120,230,255,0)');
    ctx.fillStyle = eg; ctx.fillRect(from.x - 70, from.y - 70, 140, 140);
    ctx.restore();
  }
  const band = (o) => c().handAnchor('akane', o).L.band;
  // transparent offscreen (for blurred / out-of-focus holograms)
  const offs = {};
  function layer(name) { let cv = offs[name]; if (!cv) { cv = offs[name] = document.createElement('canvas'); cv.width = W; cv.height = H; } const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.clearRect(0, 0, W, H); return [cv, g]; }
  function blurred(ctx, px, alpha, fn) { const [cv, g] = layer('blur'); fn(g); ctx.save(); ctx.globalAlpha = alpha; ctx.filter = `blur(${px}px)`; ctx.drawImage(cv, 0, 0); ctx.restore(); }
  function dim(ctx, a, col = '10,0,4') { if (a <= 0) return; ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(-W, -H, W * 3, H * 3); }
  function screen(ctx, fn) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); fn(); ctx.restore(); }
  function glowSpot(ctx, x, y, r, col, a) { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }
  function locTelop(ctx, text, sub, t0, t, a = 1) { // small location card, top-left
    const k = prog(t, t0, t0 + 0.5, ease.out) * a; if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(lerp(-40, 0, k), 0);
    ctx.fillStyle = 'rgba(12,2,6,0.62)'; ctx.beginPath(); ctx.roundRect(56, 52, 330, sub ? 112 : 74, 10); ctx.fill();
    ctx.fillStyle = '#ffb36b'; ctx.fillRect(56, 52, 8, sub ? 112 : 74);
    ctx.font = '46px ZenKaku, IPAGothic, sans-serif'; ctx.fillStyle = '#fff4e6'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, 84, 106);
    if (sub) { ctx.font = '26px ZenKaku, IPAGothic, sans-serif'; ctx.fillStyle = '#ffd9b0'; ctx.fillText(sub, 86, 148); }
    ctx.restore();
  }
  // smooth noisy blob path
  function blobPath(ctx, cx, cy, rx, ry, seed, t = 0, wob = 0.08, n = 16, rot = 0) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const rr = 1 + wob * (Math.sin(a * 3 + seed * 1.7 + t) * 0.6 + Math.sin(a * 5 + seed * 3.1 - t * 0.7) * 0.4 + Math.sin(a * 2 + seed) * 0.5);
      const x = Math.cos(a) * rx * rr, y = Math.sin(a) * ry * rr;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    ctx.beginPath();
    const m = (i) => { const p = pts[i % n], q = pts[(i + 1) % n]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
    let s = m(n - 1); ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const e = m(i); ctx.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); }
    ctx.closePath();
  }
  // vessel side background (inside the camera); still floor, cells flowing
  function vessel(ctx, t, scroll = 0, flow = 160) {
    return w().drawVesselSide(ctx, { t, scrollX: scroll + t * 18, layers: 'back', scrollSpeed: flow });
  }

  // ---------------------------------------------------------------- marrow cells
  function erythroblast(ctx, x, y, r, st, nuc = 1) { // st 0 (blue, big nucleus) .. 1 (pink, condensed)
    const cy = [lerp(78, 236, st), lerp(96, 118, st), lerp(205, 132, st)];
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, `rgb(${cy.map((v) => Math.min(255, v + 50) | 0)})`); g.addColorStop(1, `rgb(${cy.map((v) => v * 0.7 | 0)})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.strokeStyle = `rgba(${cy.map((v) => v * 0.45 | 0)},0.9)`; ctx.stroke();
    if (nuc > 0) {
      const nr = r * lerp(0.62, 0.34, st);
      ctx.fillStyle = `rgba(${lerp(70, 40, st) | 0},${lerp(40, 20, st) | 0},${lerp(110, 60, st) | 0},${nuc})`;
      ctx.beginPath(); ctx.arc(x + r * 0.05, y + r * 0.04, nr, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(160,120,210,${0.35 * nuc * (1 - st)})`;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(i * 2.1) * nr * 0.45, y + Math.sin(i * 2.1) * nr * 0.45, nr * 0.16, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.28, r * 0.14, -0.6, 0, TAU); ctx.fill();
  }
  function myeloid(ctx, x, y, r, s) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#f6c9d6'); g.addColorStop(1, '#b47896'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,30,60,0.8)'; ctx.stroke();
    ctx.fillStyle = 'rgba(120,50,130,0.9)';
    ctx.beginPath(); ctx.arc(x - r * 0.18, y + r * 0.05, r * 0.36, 0, TAU); ctx.arc(x + r * 0.22, y - r * 0.08, r * 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(190,70,120,0.8)';
    for (let i = 0; i < 9; i++) { const a = s * 7 + i * 0.7, rr = r * (0.55 + 0.3 * ((i * 37) % 10) / 10); ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, r * 0.07, 0, TAU); ctx.fill(); }
  }
  function megakaryocyte(ctx, x, y, r, s, t) {
    blobPath(ctx, x, y, r, r * 0.92, s, t * 0.4, 0.07);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#f7d0e2'); g.addColorStop(1, '#b0708f');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(90,30,60,0.85)'; ctx.stroke();
    ctx.fillStyle = 'rgba(200,110,160,0.5)';
    for (let i = 0; i < 40; i++) { const a = i * 2.39, rr = r * 0.85 * Math.sqrt((i + 0.5) / 40); ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 2.2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(100,40,120,0.92)'; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + s; ctx.moveTo(x + Math.cos(a) * r * 0.28 + r * 0.22, y + Math.sin(a) * r * 0.28); ctx.arc(x + Math.cos(a) * r * 0.28, y + Math.sin(a) * r * 0.28, r * 0.22, 0, TAU); }
    ctx.fill();
  }
  function macrophage(ctx, x, y, r, s, t, col = [205, 165, 215], a = 0.85) {
    ctx.save(); ctx.globalAlpha *= a;
    blobPath(ctx, x, y, r, r * 0.8, s, t * 0.6, 0.18, 14, s);
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, `rgb(${col.map((v) => Math.min(255, v + 30))})`); g.addColorStop(1, `rgb(${col.map((v) => v * 0.6 | 0)})`);
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(${col.map((v) => v * 0.35 | 0)},0.9)`; ctx.stroke();
    ctx.fillStyle = 'rgba(90,50,120,0.85)'; ctx.beginPath(); ctx.ellipse(x + r * 0.15, y + r * 0.05, r * 0.32, r * 0.22, s, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(150,90,60,0.55)';
    for (let i = 0; i < 7; i++) { const aa = s * 3 + i * 0.9; ctx.beginPath(); ctx.arc(x - r * 0.25 + Math.cos(aa) * r * 0.3, y + Math.sin(aa) * r * 0.35, r * 0.06, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- BONE MARROW background
  let MARROW = null;
  function marrowLayout() {
    if (MARROW) return MARROW;
    const R = rng(71), M = { far: [], fat: [], islands: [], cells: [], bones: [] };
    for (let i = 0; i < 70; i++) M.far.push({ x: -500 + R() * 3400, y: R() * 1080, r: 30 + R() * 60, s: R() });
    M.bones = [{ x: 300, y: -40, rx: 900, ry: 120, rot: 0.05, s: 1 }, { x: 1900, y: 20, rx: 700, ry: 150, rot: -0.12, s: 2 }, { x: 2500, y: 600, rx: 140, ry: 600, rot: 0.25, s: 3 },
      { x: -330, y: 520, rx: 130, ry: 560, rot: -0.2, s: 4 }, { x: 1100, y: 1130, rx: 1100, ry: 140, rot: -0.03, s: 5 }];
    for (const [fx, fy] of [[150, 300], [1250, 230], [2150, 420], [700, 800], [1700, 860]]) for (let i = 0; i < 6; i++) M.fat.push({ x: fx + (R() - 0.5) * 260, y: fy + (R() - 0.5) * 200, r: 45 + R() * 45 });
    for (const [ix, iy] of [[380, 560], [1050, 420], [1620, 640], [2300, 300], [-120, 200]]) {
      const isl = { x: ix, y: iy, r: 70, cells: [], s: R() * 10 };
      for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU + R() * 0.3; isl.cells.push({ a, d: 105 + R() * 25, r: 26 + R() * 10, st: k / 10 }); }
      M.islands.push(isl);
    }
    for (let i = 0; i < 120; i++) M.cells.push({ x: -400 + R() * 3300, y: 60 + R() * 960, r: 16 + R() * 18, k: R(), st: R(), s: R() * 10 });
    M.mega = [{ x: 820, y: 180, r: 95 }, { x: 2050, y: 820, r: 85 }];
    return (MARROW = M);
  }
  // pan: world px of the camera centre (0 = default), zoom: camera zoom (bg uses parallax)
  function drawMarrow(ctx, t, pan = 0, panY = 0, zoom = 1) {
    const M = marrowLayout();
    ctx.save();
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.42, 50, W * 0.5, H * 0.5, 1250);
    bg.addColorStop(0, '#6b2414'); bg.addColorStop(0.5, '#3a0e09'); bg.addColorStop(1, '#160403');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const L = (par, fn) => { ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + (zoom - 1) * par, 1 + (zoom - 1) * par); ctx.translate(-W / 2 - pan * par, -H / 2 - panY * par); fn(); ctx.restore(); };
    // far haze of cells
    L(0.35, () => { for (const f of M.far) { ctx.fillStyle = `rgba(${150 + f.s * 60 | 0},${60 + f.s * 30 | 0},${70 + f.s * 30 | 0},0.18)`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(70,20,50,0.18)'; ctx.beginPath(); ctx.arc(f.x + 4, f.y + 3, f.r * 0.45, 0, TAU); ctx.fill(); } });
    // fat cells
    L(0.6, () => { for (const f of M.fat) { ctx.fillStyle = 'rgba(255,225,170,0.07)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,214,160,0.32)'; ctx.stroke(); ctx.fillStyle = 'rgba(255,240,210,0.12)'; ctx.beginPath(); ctx.ellipse(f.x - f.r * 0.35, f.y - f.r * 0.4, f.r * 0.3, f.r * 0.12, -0.5, 0, TAU); ctx.fill(); } });
    // sinusoid with newborn cells entering the blood
    L(0.8, () => {
      const y0 = 900; ctx.beginPath(); for (let x = -600; x <= 3200; x += 40) { const y = y0 + Math.sin(x * 0.003) * 50 - 70; x === -600 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      for (let x = 3200; x >= -600; x -= 40) ctx.lineTo(x, y0 + Math.sin(x * 0.003) * 50 + 70);
      ctx.closePath(); ctx.fillStyle = 'rgba(120,10,24,0.55)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,150,150,0.35)'; ctx.stroke();
      for (let i = 0; i < 16; i++) { const x = ((i * 240 + t * 140) % 3800) - 600; w().drawRBC(ctx, { x, y: y0 + Math.sin(x * 0.003) * 50 + Math.sin(i * 1.7) * 30, r: 30, tiltX: 0.9, rot: i + t * 0.5, alpha: 0.85, blur: 6, blurAngle: 0 }); }
    });
    // trabecular bone
    L(0.7, () => {
      for (const b of M.bones) {
        blobPath(ctx, b.x, b.y, b.rx, b.ry, b.s, 0, 0.12, 20, b.rot);
        const g = ctx.createLinearGradient(b.x - b.rx, b.y - b.ry, b.x + b.rx * 0.3, b.y + b.ry);
        g.addColorStop(0, '#e9d6b4'); g.addColorStop(1, '#a8875c'); ctx.fillStyle = g; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(90,55,30,0.7)'; ctx.stroke();
        ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(120,85,50,0.28)'; ctx.lineWidth = 3;
        for (let k = 1; k < 5; k++) { blobPath(ctx, b.x, b.y, b.rx * (1 - k * 0.15), b.ry * (1 - k * 0.16), b.s, 0, 0.12, 20, b.rot); ctx.stroke(); }
        ctx.fillStyle = 'rgba(80,50,30,0.5)';
        for (let k = 0; k < 8; k++) { const a = b.s + k * 0.8; ctx.beginPath(); ctx.ellipse(b.x + Math.cos(a) * b.rx * 0.6, b.y + Math.sin(a * 1.3) * b.ry * 0.5, 9, 4, b.rot, 0, TAU); ctx.fill(); }
        ctx.restore();
      }
    });
    // hematopoietic cells (near layer)
    L(1, () => {
      for (const m of M.mega) megakaryocyte(ctx, m.x, m.y, m.r, m.x * 0.01, t);
      for (const isl of M.islands) {
        macrophage(ctx, isl.x, isl.y, isl.r, isl.s, t, [215, 175, 205], 0.8);
        for (const e of isl.cells) { const br = 1 + 0.04 * Math.sin(t * 2 + e.a * 3); erythroblast(ctx, isl.x + Math.cos(e.a) * e.d, isl.y + Math.sin(e.a) * e.d * 0.9, e.r * br, e.st); }
      }
      for (const q of M.cells) {
        const x = q.x + Math.sin(t * 0.5 + q.s) * 4, y = q.y + Math.cos(t * 0.4 + q.s) * 4;
        if (q.k < 0.55) erythroblast(ctx, x, y, q.r, q.st); else if (q.k < 0.9) myeloid(ctx, x, y, q.r * 1.15, q.s); else w().drawRBC(ctx, { x, y, r: q.r * 1.1, tiltX: 0.4, rot: q.s });
      }
    });
    // warm light + motes
    w().drawLightRays(ctx, { x: 1500, y: -100, angle: 2.0, t, alpha: 0.12, color: '255,190,120' });
    w().drawParticles(ctx, { t, seed: 31, count: 50, vx: -8, vy: -6, alpha: 0.35, color: '255,200,140' });
    ctx.restore();
  }

  // ---------------------------------------------------------------- SPLEEN background (red pulp + sinusoids + macrophages)
  let SPLEEN = null;
  function spleenLayout() {
    if (SPLEEN) return SPLEEN;
    const R = rng(113), S = { dots: [], cells: [] };
    for (let i = 0; i < 260; i++) S.dots.push({ x: -400 + R() * 2800, y: R() * 1080, r: 9 + R() * 9, s: R() });
    for (let i = 0; i < 60; i++) S.cells.push({ x: -300 + R() * 2600, y: R() * 1080, r: 22 + R() * 14, tx: R() * 1.2, rot: R() * 6 });
    return (SPLEEN = S);
  }
  function drawSpleen(ctx, t, pan = 0, zoom = 1) {
    const S = spleenLayout();
    ctx.save();
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 50, W * 0.5, H * 0.5, 1250);
    bg.addColorStop(0, '#5a0f2a'); bg.addColorStop(0.55, '#300618'); bg.addColorStop(1, '#12020a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const L = (par, fn) => { ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + (zoom - 1) * par, 1 + (zoom - 1) * par); ctx.translate(-W / 2 - pan * par, -H / 2); fn(); ctx.restore(); };
    L(0.35, () => { for (const q of S.dots) { ctx.fillStyle = `rgba(${170 + q.s * 60 | 0},${30 + q.s * 20 | 0},${60 + q.s * 30 | 0},0.28)`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); } });
    // background macrophages (big, slow)
    L(0.55, () => { macrophage(ctx, 140, 260, 230, 1.3, t, [150, 100, 170], 0.55); macrophage(ctx, 1850, 760, 260, 4.1, t * 0.8, [150, 100, 170], 0.5); });
    // sinusoids: slanted channels lined with stave cells; red cells squeeze through the slits
    L(0.75, () => {
      for (let k = 0; k < 3; k++) {
        const cx = -200 + k * 900, ang = -0.35;
        ctx.save(); ctx.translate(cx, 540); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(70,8,30,0.6)'; ctx.fillRect(-1400, -60, 2800, 120);
        for (const side of [-1, 1]) for (let i = -30; i < 30; i++) {
          const x = i * 48 + side * 12; ctx.fillStyle = 'rgba(200,150,210,0.55)';
          ctx.beginPath(); ctx.ellipse(x, side * 64, 20, 7, 0, 0, TAU); ctx.fill();
        }
        for (let i = 0; i < 8; i++) { const x = ((i * 340 + t * 90 + k * 120) % 2800) - 1400; w().drawRBC(ctx, { x, y: Math.sin(i + k) * 18, r: 30, tiltY: -Math.PI / 2, deform: 0.55, alpha: 0.9 }); }
        // a cell squeezing through a slit in the wall
        const sq = ((t * 0.35 + k * 0.3) % 1); w().drawRBC(ctx, { x: -200 + k * 140, y: lerp(-120, -50, sq), r: 26, tiltY: 0, tiltX: Math.PI / 2 * 0.9, deform: 0.8, rot: Math.PI / 2, alpha: 0.85 });
        ctx.restore();
      }
    });
    // red pulp cords: packed red cells
    L(0.95, () => { for (const q of S.cells) w().drawRBC(ctx, { x: q.x + Math.sin(t * 0.6 + q.rot) * 6, y: q.y, r: q.r, tiltX: q.tx, rot: q.rot + t * 0.1, fog: 0.35, fogColor: '#3a0820', alpha: 0.75 }); });
    w().drawParticles(ctx, { t, seed: 47, count: 40, vx: -6, vy: -4, alpha: 0.3, color: '230,150,220' });
    ctx.restore();
  }

  // ======================================================================= comp (#2–6)
  const PC = { x: 1180, y: 418, s: 0.78 }; // centrifuge panel in the lab staging
  const AKC = { x: 440, y: 962, scale: 1.18, yaw: 34 };
  function compP(t, b, S) {
    return lin(t, [[b.holo_on, 0], [b.tube_appears, 0.09], [b.centrifuge_spin_start, 0.1], [b.centrifuge_full_speed, 0.14], [b.centrifuge_spin_down, 0.26],
      [b.centrifuge_stop, 0.335], [b.layers_visible + 2.2, 0.515], [b.label_plasma, 0.52], [b.label_plasma + 0.7, 0.55], [b.pct_55 - 0.25, 0.553], [b.pct_55 + 0.6, 0.625],
      [b.label_buffy, 0.64], [b.label_buffy + 0.9, 0.69], [b.pct_1, 0.71], [b.pct_1 + 0.9, 0.755], [b.label_rbc, 0.758], [b.label_rbc + 0.9, 0.785],
      [b.pct_45 - 0.2, 0.79], [b.pct_45 + 0.8, 0.86], [S.end, 0.97]]);
  }
  // tube layer points in panel-local coords
  const TUBE = { plasma: [-200, -120], buffy: [-200, -6], rbc: [-200, 130] };
  function compStage(ctx, t, S, cam, ako, opt = {}) {
    const b = S.beats, p = compP(t, b, S);
    BS.common.camera(ctx, cam, () => {
      vessel(ctx, t);
      dim(ctx, 0.22);
      const k = prog(t, b.holo_on, b.holo_on + 0.35, ease.out);
      const o = AK(t, { ...AKC, holo: k > 0.1, ...ako });
      const P = holo(ctx, 'centrifugeTube', PC.x, PC.y, PC.s, p, t);
      beam(ctx, band(o), P, k, t);
      c().drawAkane(ctx, o);
      w().drawFlowCells(ctx, { t, scrollX: t * 18, layer: 'front', scrollSpeed: 160, density: 0.4 });
      if (opt.after) opt.after(P, o);
    });
    w().drawVignette(ctx, { strength: 0.5 });
  }
  function comp(ctx, t, E, S) {
    const b = S.beats;
    const L4 = E.line('E01-04'), L5 = E.line('E01-05'), L6 = E.line('E01-06');
    const at = (k) => ({ x: PC.x + TUBE[k][0] * PC.s, y: PC.y + TUBE[k][1] * PC.s });
    const shots = [
      { // 1. establishing: Akane taps her band, the panel opens in the flowing vessel
        a: S.start - 0.5, b: b.centrifuge_spin_start, draw: (g, lt, tt) => {
          const zoom = lerp(1.0, 1.07, prog(tt, S.start, b.centrifuge_spin_start));
          const raise = prog(tt, b.holo_on - 0.35, b.holo_on, ease.out);
          compStage(g, tt, S, { x: lerp(900, 960, prog(tt, S.start, b.centrifuge_spin_start)), y: 520, zoom }, {
            pose: raise > 0.5 ? 'present' : 'stand', pointAt: { x: 820, y: 640 }, expr: 'happy', look: { x: 0.5, y: -0.2 } });
        } },
      { // 2. the rotor spins: big hologram, Akane in the foreground lit cyan
        a: b.centrifuge_spin_start, b: b.centrifuge_stop + 0.35, tin: { type: 'dissolve', dur: 0.25 }, draw: (g, lt, tt) => {
          const p = compP(tt, b, S);
          const sp = prog(tt, b.centrifuge_spin_start, b.centrifuge_full_speed) * (1 - prog(tt, b.centrifuge_spin_down, b.centrifuge_stop));
          const [sx, sy] = shake(tt, 3 * sp);
          BS.common.camera(g, { x: 960, y: 540, zoom: lerp(1.0, 1.06, prog(tt, b.centrifuge_spin_start, b.centrifuge_stop)), sx, sy }, () => {
            BS.common.camera(g, { x: 1150, y: 470, zoom: 1.5 }, () => vessel(g, tt));
            dim(g, 0.4);
            holo(g, 'centrifugeTube', 1130, 430, 0.98, p, tt);
            glowSpot(g, 1130, 430, 520, '120,230,255', 0.12 + 0.18 * sp);
            const o = placeHead(AK(tt, { scale: 2.7, yaw: 52, pose: 'stand', expr: sp > 0.3 ? 'surprised' : 'happy', rim: HOLO_RIM, look: { x: 0.6, y: -0.1 }, holo: true }), 250, 400);
            c().drawAkane(g, o);
          });
          w().drawSpeedLines(g, { t: tt, cx: 1130, cy: 430, intensity: 0.35 * sp, inner: 0.45, color: '170,240,255' });
          w().drawVignette(g, { strength: 0.55 });
        } },
      { // 3. two-shot: layers settle, she points at the yellow plasma
        a: b.centrifuge_stop + 0.35, b: L4.start - 0.15, tin: { type: 'dissolve', dur: 0.3 }, draw: (g, lt, tt) => {
          const pt = tt > b.label_plasma - 0.2;
          compStage(g, tt, S, { x: lerp(1000, 1040, prog(tt, b.centrifuge_stop, L4.start)), y: 500, zoom: lerp(1.1, 1.16, prog(tt, b.centrifuge_stop, L4.start)) }, {
            pose: pt ? 'point' : 'present', pointAt: pt ? at('plasma') : { x: 820, y: 640 }, expr: pt ? 'happy' : 'calm', look: { x: 0.6, y: -0.3 } });
        } },
      { // 4. insert: camera tilts down the tube to the thin buffy coat
        a: L4.start - 0.15, b: L5.start - 0.12, tin: { type: 'dissolve', dur: 0.3 }, draw: (g, lt, tt) => {
          const k = prog(tt, L4.start, b.label_buffy + 0.4);
          compStage(g, tt, S, { x: lerp(1130, 1160, k), y: lerp(330, 410, k), zoom: lerp(1.5, 1.62, prog(tt, L4.start, L5.start)) }, { pose: 'present', pointAt: { x: 820, y: 640 }, expr: 'calm' });
        } },
      { // 5. two-shot (closer): the red layer — she points at it, then at herself
        a: L5.start - 0.12, b: L6.start - 0.18, tin: { type: 'dissolve', dur: 0.3 }, draw: (g, lt, tt) => {
          const self = tt > b.akane_points_self, pt = tt > b.label_rbc - 0.2;
          compStage(g, tt, S, { x: lerp(900, 820, prog(tt, b.akane_points_self - 0.3, b.akane_points_self + 0.6)), y: lerp(520, 480, prog(tt, L5.start, L6.start)), zoom: lerp(1.15, 1.32, prog(tt, L5.start, L6.start)) }, {
            ...(self ? { pose: 'pose' } : { pose: pt ? 'point' : 'present', pointAt: pt ? at('rbc') : { x: 820, y: 640 } }),
            expr: self ? 'proud' : pt ? 'happy' : 'calm', look: self ? { x: -0.2, y: 0 } : { x: 0.6, y: 0.1 } });
        } },
      { // 6. her line: medium close-up, the hologram out of focus behind
        a: L6.start - 0.18, b: S.end + 0.6, tin: { type: 'dissolve', dur: 0.2 }, draw: (g, lt, tt) => {
          const cheer = tt > L6.start + (L6.end - L6.start) * 0.62;
          const o = placeHead(AK(tt, { scale: 2.5, yaw: 26, pose: cheer ? 'cheer' : 'stand', expr: tt < L6.start + 0.5 ? 'surprised' : 'happy', look: { x: -0.15, y: 0 }, holo: true }), 820, 330);
          BS.common.camera(g, { x: 960, y: 540, zoom: lerp(1.0, 1.08, prog(tt, L6.start, S.end)) }, () => {
            BS.common.camera(g, { x: 900, y: 420, zoom: 1.6 }, () => vessel(g, tt));
            dim(g, 0.18);
            blurred(g, 6, 0.75, (h) => holo(h, 'centrifugeTube', 1560, 360, 1.0, compP(tt, b, S), tt));
            c().drawAkane(g, o);
          });
          w().drawParticles(g, { t: tt, seed: 9, count: 40, vx: -40, alpha: 0.5 });
          w().drawVignette(g, { strength: 0.45 });
        } },
    ];
    BS.common.playShots(ctx, t, shots, E);
  }

  // ======================================================================= plasma (#7–9)
  const PP = { x: 760, y: 420, s: 0.8 }; // panel (Akane stands on the right this time)
  const AKP = { x: 1530, y: 962, scale: 1.18, yaw: -34 };
  function clotP(t, b, S) {
    return lin(t, [[b.holo_swap + 0.25, 0], [b.clot_start, 0.07], [b.fibrin_net, 0.14], [b.clot_formed, 0.42], [b.clot_formed + 0.6, 0.47], [b.label_serum, 0.52], [b.label_serum + 0.8, 0.585],
      [b.formula, 0.62], [b.formula + 0.9, 0.67], [b.formula_minus_fibrinogen, 0.73], [b.formula_minus_fibrinogen + 1.2, 0.8], [b.formula_minus_fibrinogen + 2.4, 0.88], [b.proteins_float, 1]]);
  }
  function protP(t, b, S) {
    return lin(t, [[b.proteins_float - 0.3, 0], [b.proteins_float, 0.07], [b.peak_albumin - 0.5, 0.11], [b.peak_albumin, 0.125], [b.peak_globulin, 0.185], [b.peak_fibrinogen, 0.245],
      [b.peak_fibrinogen + 0.6, 0.3], [b.peak_gamma_antibody - 0.5, 0.68], [b.peak_gamma_antibody - 0.1, 0.745], [b.peak_gamma_antibody + 0.9, 0.86], [S.end, 1]]);
  }
  function plasmaStage(ctx, t, S, cam, ako, which) {
    const b = S.beats;
    const kOff = 1 - prog(t, b.holo_off, b.holo_off + 0.3);
    BS.common.camera(ctx, cam, () => {
      vessel(ctx, t, 600);
      dim(ctx, 0.22);
      const o = AK(t, { ...AKP, holo: kOff > 0.2, ...ako });
      // panel swap: the centrifuge (from comp) slides away, clot tube powers on; then the protein panel
      let P;
      const sw = prog(t, b.holo_swap, b.holo_swap + 0.45, ease.inOut);
      if (sw < 1) holo(ctx, 'centrifugeTube', PP.x - sw * 500, PP.y, PP.s, 0.97, t, 1 - sw);
      if (which === 'clot' || (which == null && t < b.proteins_float - 0.3)) P = holo(ctx, 'clotTube', PP.x, PP.y, PP.s, clotP(t, b, S), t, 1 - prog(t, b.proteins_float - 0.6, b.proteins_float - 0.3));
      else P = holo(ctx, 'plasmaProteins', PP.x, PP.y, PP.s, protP(t, b, S), t, kOff);
      beam(ctx, band(o), P, kOff, t);
      c().drawAkane(ctx, o);
      w().drawFlowCells(ctx, { t, scrollX: t * 18 + 600, layer: 'front', scrollSpeed: 160, density: 0.4 });
    });
    w().drawVignette(ctx, { strength: 0.5 });
  }
  // clot panel local coords (from the sheet): magnifier, tube, equation; protein panel: particles, albumin, γ
  const CL = { mag: [-330, -60], tube: [-10, -40], eq: [0, 290], minus: [60, 290] };
  const PR = { parts: [-60, -220], alb: [-335, 70], gamma: [286, 225] };
  function plasma(ctx, t, E, S) {
    const b = S.beats;
    const L7 = E.line('E01-07'), L8 = E.line('E01-08'), L9 = E.line('E01-09');
    const at = (q) => ({ x: PP.x + q[0] * PP.s, y: PP.y + q[1] * PP.s });
    const shots = [
      { // 1. swipe: the centrifuge slides out, a new tube appears (left blood standing)
        a: S.start - 0.5, b: b.clot_start + 0.4, draw: (g, lt, tt) => {
          const swipe = tt > b.holo_swap - 0.15 && tt < b.holo_swap + 0.6;
          plasmaStage(g, tt, S, { x: lerp(1000, 960, prog(tt, S.start, b.clot_start)), y: 520, zoom: 1.05 }, {
            pose: swipe ? 'wave' : 'present', pointAt: { x: 1060, y: 640 }, expr: 'happy', look: { x: -0.5, y: -0.2 } }, 'clot');
        } },
      { // 2. insert: fibrin net in the magnifier traps the cells, the clot retracts
        a: b.clot_start + 0.4, b: L7.end - 0.4, tin: { type: 'dissolve', dur: 0.3 }, draw: (g, lt, tt) => {
          const m = at(CL.mag), tb = at(CL.tube);
          const k = prog(tt, b.clot_formed - 0.6, b.clot_formed + 0.9);
          plasmaStage(g, tt, S, { x: lerp(m.x + 40, tb.x + 30, k), y: lerp(m.y + 20, tb.y + 60, k), zoom: lerp(1.75, 1.5, k) + 0.05 * prog(tt, b.clot_start, b.clot_formed) }, { pose: 'present', pointAt: { x: 1060, y: 640 }, expr: 'calm' }, 'clot');
        } },
      { // 3. the formula: Akane thinks it through, then points at "− フィブリノゲン"
        a: L7.end - 0.4, b: b.proteins_float - 0.25, tin: { type: 'dissolve', dur: 0.3 }, draw: (g, lt, tt) => {
          const pt = tt > b.formula_minus_fibrinogen - 0.2, nod = tt > L8.end - 0.2;
          plasmaStage(g, tt, S, { x: lerp(1000, 1060, prog(tt, L7.end, L8.end)), y: lerp(470, 520, prog(tt, L7.end, L8.end)), zoom: lerp(1.12, 1.2, prog(tt, L7.end, L8.end)) }, {
            pose: nod ? 'present' : pt ? 'point' : tt > b.formula - 0.3 ? 'think' : 'present', pointAt: pt && !nod ? at(CL.minus) : { x: 1060, y: 640 },
            expr: nod ? 'smile' : pt ? 'happy' : 'calm', look: { x: -0.6, y: 0.1 } }, 'clot');
        } },
      { // 4. protein panel: close on the floating proteins as they are named
        a: b.proteins_float - 0.25, b: b.peak_fibrinogen + 0.55, tin: { type: 'flash', dur: 0.25, color: '#9ff0ff' }, draw: (g, lt, tt) => {
          const q = at(PR.parts);
          plasmaStage(g, tt, S, { x: q.x + 40, y: q.y + 90, zoom: lerp(1.75, 1.62, prog(tt, b.proteins_float, b.peak_fibrinogen + 0.5)) }, { pose: 'look_up', expr: 'happy', look: { x: -0.6, y: -0.5 } }, 'prot');
        } },
      { // 5. electrophoresis curve draws; she points at γ (antibodies); hologram off
        a: b.peak_fibrinogen + 0.55, b: S.end + 0.6, tin: { type: 'dissolve', dur: 0.3 }, draw: (g, lt, tt) => {
          const pt = tt > b.peak_gamma_antibody - 0.25 && tt < b.holo_off;
          plasmaStage(g, tt, S, { x: lerp(820, 1000, prog(tt, b.peak_fibrinogen, b.peak_gamma_antibody)), y: lerp(560, 520, prog(tt, b.peak_fibrinogen, S.end)), zoom: lerp(1.3, 1.1, prog(tt, b.peak_fibrinogen + 0.5, b.peak_gamma_antibody)) }, {
            pose: pt ? 'point' : tt > b.holo_off ? 'stand' : 'present', pointAt: pt ? at(PR.gamma) : { x: 1060, y: 640 }, expr: pt ? 'happy' : tt > b.holo_off ? 'smile' : 'calm', look: { x: -0.6, y: 0 } }, 'prot');
        } },
    ];
    BS.common.playShots(ctx, t, shots, E);
  }

  // ======================================================================= life (#21–24)
  const PE = { x: 1000, y: 410, s: 0.7 };   // erythropoiesis panel (marrow)
  const AKM = { x: 175, y: 1010, scale: 0.98, yaw: 30 };
  const PL = { x: 1100, y: 405, s: 0.8 };   // lifespan panel (spleen)
  const AKS = { x: 330, y: 1000, scale: 1.05, yaw: 30 };
  const PH = { x: 960, y: 410, s: 0.68 };   // heme recycle panel (spleen)
  // erythropoiesis cells, local coords
  const EP = { kidney: [-563, -150], cell0: [-693, 49], cell1: [-463, 49], cell2: [-233, 49], cell3: [-3, 49], enuc: [227, 49], ret: [457, 49], rbc: [687, 49] };
  function eryP(t, b) {
    return lin(t, [[b.epo_signal - 0.5, 0], [b.epo_signal, 0.055], [b.epo_signal + 1.0, 0.12], [b.erythroblasts_multiply, 0.15], [b.erythroblasts_multiply + 0.6, 0.25],
      [b.erythroblasts_multiply + 1.2, 0.36], [b.enucleation_pop - 0.45, 0.45], [b.enucleation_pop - 0.2, 0.55], [b.enucleation_pop, 0.6], [b.reticulocyte_exit, 0.665],
      [b.into_blood - 0.8, 0.7], [b.into_blood, 0.765], [b.calendar_start - 1.3, 0.86], [b.calendar_start - 0.5, 0.93], [b.calendar_start, 1]]);
  }
  function lifeP(t, b) {
    return lin(t, [[b.calendar_start - 0.6, 0], [b.calendar_start, 0.07], [b.calendar_120, 0.38], [b.calendar_120 + 0.9, 0.42], [b.macrophage - 0.4, 0.445], [b.macrophage, 0.47],
      [b.macrophage + 0.9, 0.55], [b.macrophage_eats, 0.66], [b.macrophage_eats + 0.7, 0.79], [b.iron_recycle + 0.3, 0.9], [b.iron_recycle + 1.2, 0.97]]);
  }
  function hemeP(t, b) {
    return lin(t, [[b.iron_recycle - 0.8, 0], [b.iron_recycle - 0.45, 0.08], [b.iron_recycle - 0.15, 0.27], [b.iron_recycle, 0.38], [b.iron_recycle + 1.0, 0.5],
      [b.iron_recycle + 2.2, 0.645], [b.bilirubin - 0.5, 0.675], [b.bilirubin, 0.72], [b.bilirubin + 0.6, 0.79], [b.bile - 0.4, 0.86], [b.bile, 0.9], [b.bile + 0.5, 0.96], [b.akane_faces_forward, 1]]);
  }
  function marrowStage(ctx, t, S, cam, ako, showPanel) {
    const b = S.beats;
    drawMarrow(ctx, t, cam.x - 960, (cam.y - 540) * 0.5, cam.zoom);
    BS.common.camera(ctx, cam, () => {
      const k = showPanel ? prog(t, b.epo_signal - 0.5, b.epo_signal, ease.out) * (1 - prog(t, b.calendar_start - 0.5, b.calendar_start)) : 0;
      if (k > 0) dim(ctx, 0.25 * k, '20,4,2');
      const o = AK(t, { ...AKM, holo: k > 0.1, rim: { color: '#ffb070', strength: 0.5 }, ...ako });
      if (showPanel) { const P = holo(ctx, 'erythropoiesis', PE.x, PE.y, PE.s, eryP(t, b), t, 1 - prog(t, b.calendar_start - 0.5, b.calendar_start)); beam(ctx, band(o), P, k, t); }
      glowSpot(ctx, o.x, o.y - 300 * o.scale, 360 * o.scale, '255,170,110', 0.12);
      c().drawAkane(ctx, o);
    });
    w().drawVignette(ctx, { strength: 0.6, color: '20,4,0' });
  }
  function spleenStage(ctx, t, S, cam, ako, which) {
    const b = S.beats;
    drawSpleen(ctx, t, cam.x - 960, cam.zoom);
    BS.common.camera(ctx, cam, () => {
      dim(ctx, 0.25, '16,0,10');
      const o = AK(t, { ...AKS, holo: true, rim: { color: '#ff7ab0', strength: 0.45 }, ...ako });
      let P;
      if (which === 'life') P = holo(ctx, 'rbcLifespan', PL.x, PL.y, PL.s, lifeP(t, b), t);
      else P = holo(ctx, 'hemeRecycle', PH.x, PH.y, PH.s, hemeP(t, b), t, 1 - prog(t, b.akane_faces_forward - 2.2, b.akane_faces_forward - 1.9));
      if (o.alpha !== 0) { beam(ctx, band(o), P, ako.beamK == null ? 1 : ako.beamK, t); c().drawAkane(ctx, o); }
    });
    w().drawVignette(ctx, { strength: 0.6, color: '16,0,8' });
  }
  // close-up insert: an erythroblast pushes its nucleus out (enucleation) → reticulocyte
  function enucleation(ctx, t, b) {
    drawMarrow(ctx, t, 300, 80, 1.6);
    dim(ctx, 0.35, '20,4,2');
    const pop = b.enucleation_pop, k = prog(t, pop - 0.55, pop, ease.inOut), after = prog(t, pop, pop + 0.7, ease.out);
    const cx = 900, cy = 470, r = 230;
    BS.common.camera(ctx, { x: 960, y: 520, zoom: lerp(1.0, 1.08, prog(t, pop - 0.7, pop + 0.7)) }, () => {
      // nucleus slides out and pinches off
      const nx = cx + lerp(10, 250, k) + after * 160, ny = cy + lerp(5, -30, k) - after * 90, nr = 92;
      // cell body (reticulocyte tint after pop)
      ctx.save();
      const st = lerp(0.82, 0.95, after);
      erythroblast(ctx, cx - after * 20, cy, r * (1 + 0.04 * Math.sin(t * 5)), st, 0);
      if (after > 0) { ctx.fillStyle = `rgba(120,140,230,${0.45 * after})`; for (let i = 0; i < 14; i++) { const a = i * 2.4, rr = r * 0.6 * Math.sqrt((i + 1) / 14); ctx.fillRect(cx - after * 20 + Math.cos(a) * rr, cy + Math.sin(a) * rr, 16, 3); } }
      // membrane neck
      if (after < 1 && k > 0.3) { ctx.fillStyle = `rgba(236,118,132,${1 - after})`; ctx.beginPath(); ctx.ellipse((cx + nx) / 2, (cy + ny) / 2, Math.hypot(nx - cx, ny - cy) / 2, lerp(120, 46, k) * (1 - after), Math.atan2(ny - cy, nx - cx), 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgb(236,150,160)'; ctx.beginPath(); ctx.arc(nx, ny, nr + 14, 0, TAU); ctx.globalAlpha = 1 - after * 0.6; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#3a1450'; ctx.beginPath(); ctx.arc(nx, ny, nr, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(150,110,200,0.35)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(nx + Math.cos(i * 1.9) * 40, ny + Math.sin(i * 1.9) * 40, 14, 0, TAU); ctx.fill(); }
      ctx.restore();
      // POP flash + ring
      const f = 1 - prog(t, pop, pop + 0.35, ease.out);
      if (t >= pop) { glowSpot(ctx, (cx + nx) / 2, (cy + ny) / 2, 380, '255,230,200', 0.7 * f); ctx.save(); ctx.strokeStyle = `rgba(255,240,220,${f})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc((cx + nx) / 2, (cy + ny) / 2, lerp(60, 330, 1 - f), 0, TAU); ctx.stroke(); ctx.restore(); }
    });
    const ta = prog(t, pop - 0.6, pop - 0.35);
    w().drawTelop(ctx, { text: '脱核', style: 'caption', t: t - (pop - 0.6), x: 1450, y: 250, size: 84, alpha: ta });
    w().drawVignette(ctx, { strength: 0.65, color: '20,4,0' });
  }
  function life(ctx, t, E, S) {
    const b = S.beats;
    const L21 = E.line('E01-21'), L22 = E.line('E01-22'), L23 = E.line('E01-23'), L24 = E.line('E01-24');
    const ae = (q) => ({ x: PE.x + q[0] * PE.s, y: PE.y + q[1] * PE.s });
    const shots = [
      { // 1. bone marrow establishing: slow pan across the marrow, Akane looks around; she raises her band
        a: S.start - 0.5, b: b.epo_signal - 0.15, draw: (g, lt, tt) => {
          const k = prog(tt, S.start, b.epo_signal);
          const raise = tt > b.epo_signal - 0.7;
          marrowStage(g, tt, S, { x: lerp(1250, 760, ease.inOut(k)), y: 520, zoom: lerp(1.25, 1.15, k) }, {
            pose: raise ? 'present' : 'look_up', pointAt: { x: 600, y: 560 }, expr: raise ? 'happy' : 'surprised', look: raise ? { x: 0.5, y: -0.2 } : { x: 0.5, y: -0.7 }, holo: raise }, false);
          locTelop(g, '骨髄', '赤血球が生まれる場所', S.start + 0.4, tt, 1 - prog(tt, b.epo_signal - 0.6, b.epo_signal - 0.2));
        } },
      { // 2. the hologram: EPO from the kidney, erythroblasts multiply (camera follows the row)
        a: b.epo_signal - 0.15, b: b.enucleation_pop - 0.42, tin: { type: 'dissolve', dur: 0.3 }, draw: (g, lt, tt) => {
          const cx = lin(tt, [[b.epo_signal, 700], [b.erythroblasts_multiply, 720], [b.enucleation_pop - 0.4, 940]]);
          marrowStage(g, tt, S, { x: cx, y: 440, zoom: 1.32 }, { pose: tt > b.erythroblasts_multiply - 0.2 ? 'point' : 'present',
            pointAt: tt > b.erythroblasts_multiply - 0.2 ? ae(EP.cell1) : ae(EP.kidney), expr: 'happy', look: { x: 0.6, y: -0.3 } }, true);
        } },
      { // 3. insert: enucleation POP
        a: b.enucleation_pop - 0.42, b: b.enucleation_pop + 0.62, tin: { type: 'whip', dur: 0.16, dir: 1 }, draw: (g, lt, tt) => enucleation(g, tt, b) },
      { // 4. back on the panel: reticulocyte → into the blood; pull back to the whole row
        a: b.enucleation_pop + 0.62, b: b.calendar_start - 0.55, tin: { type: 'dissolve', dur: 0.25 }, draw: (g, lt, tt) => {
          const cx = lin(tt, [[b.enucleation_pop + 0.6, 1120], [b.into_blood, 1280], [b.into_blood + 1.0, 1000]]);
          const zoom = lin(tt, [[b.enucleation_pop + 0.6, 1.32], [b.into_blood, 1.28], [b.into_blood + 1.0, 1.0]]);
          marrowStage(g, tt, S, { x: cx, y: lerp(440, 520, prog(tt, b.into_blood, b.into_blood + 1)), zoom }, { pose: 'point', pointAt: ae(EP.rbc), expr: 'happy', look: { x: 0.6, y: -0.3 } }, true);
        } },
      { // 5. spleen: day counter to 120, the macrophage appears
        a: b.calendar_start - 0.55, b: b.macrophage + 0.6, tin: { type: 'dissolve', dur: 0.5 }, draw: (g, lt, tt) => {
          const pt = tt > b.calendar_120 - 0.3 && tt < b.macrophage - 0.3;
          spleenStage(g, tt, S, { x: lerp(1000, 940, prog(tt, b.calendar_start, b.macrophage)), y: 510, zoom: lerp(1.05, 1.12, prog(tt, b.calendar_start, b.macrophage)) }, {
            pose: pt ? 'point' : 'present', pointAt: pt ? { x: PL.x - 331 * PL.s, y: PL.y - 75 * PL.s } : { x: 760, y: 600 }, expr: tt > b.macrophage - 0.3 ? 'worried' : pt ? 'surprised' : 'calm', look: { x: 0.6, y: -0.2 } }, 'life');
          locTelop(g, '脾臓', '古い赤血球が処理される', b.calendar_start - 0.2, tt, 1 - prog(tt, b.calendar_120, b.calendar_120 + 0.4));
        } },
      { // 6. Akane's worried close-up (the macrophage looms behind, out of focus)
        a: b.macrophage + 0.6, b: b.macrophage_eats - 0.15, tin: { type: 'dissolve', dur: 0.25 }, draw: (g, lt, tt) => {
          const o = placeHead(AK(tt, { scale: 3.2, yaw: 40, pose: 'stand', expr: 'worried', look: { x: 0.7, y: -0.1 }, rim: { color: '#c58aff', strength: 0.6 } }), 760, 420);
          BS.common.camera(g, { x: 960, y: 540, zoom: lerp(1.0, 1.1, prog(tt, b.macrophage + 0.6, b.macrophage_eats)) }, () => {
            drawSpleen(g, tt, 300, 1.4);
            blurred(g, 7, 0.8, (h) => holo(h, 'rbcLifespan', 1480, 420, 1.2, lifeP(tt, b), tt));
            c().drawAkane(g, o);
          });
          w().drawVignette(g, { strength: 0.6, color: '16,0,8' });
        } },
      { // 7. insert: the macrophage engulfs the old cell
        a: b.macrophage_eats - 0.15, b: L23.start - 0.05, tin: { type: 'dissolve', dur: 0.2 }, draw: (g, lt, tt) => {
          spleenStage(g, tt, S, { x: PL.x + 200 * PL.s, y: PL.y + 20 * PL.s, zoom: lerp(1.65, 1.75, prog(tt, b.macrophage_eats, L23.start)) }, { alpha: 0 }, 'life');
        } },
      { // 8. hemoglobin's fate: camera travels along the flow chart (iron → marrow, heme → bilirubin → bile)
        a: L23.start - 0.05, b: L24.start - 0.45, tin: { type: 'flash', dur: 0.25, color: '#9ff0ff' }, draw: (g, lt, tt) => {
          const L = (lx, ly) => [PH.x + lx * PH.s, PH.y + ly * PH.s];
          const ks = [[L23.start, [...L(-450, -20), 1.45]], [b.iron_recycle + 0.2, [...L(-150, 20), 1.45]], [b.iron_recycle + 2.2, [...L(420, 0), 1.45]],
            [b.bilirubin - 0.2, [...L(330, 90), 1.45]], [b.bile + 0.3, [...L(380, 200), 1.45]], [b.bile + 1.2, [PH.x, PH.y + 60, 1.05]]];
          const [x, y, zoom] = keys(tt, ks);
          spleenStage(g, tt, S, { x, y, zoom }, { x: 250, y: 1005, scale: 1.0, pose: 'present', pointAt: { x: 600, y: 620 }, expr: 'calm', look: { x: 0.6, y: -0.2 } }, 'heme');
        } },
      { // 9. back in the vessel: "120日かあ……" quiet, sad close-up
        a: L24.start - 0.45, b: b.akane_faces_forward - 0.05, tin: { type: 'dissolve', dur: 0.5 }, draw: (g, lt, tt) => {
          const o = placeHead(AK(tt, { scale: 3.3, yaw: 48, pose: 'relieved', expr: 'worried', look: { x: 0.2, y: 0.7 }, rim: { color: '#ff9a7a', strength: 0.35 } }), 900, 470);
          BS.common.camera(g, { x: 960, y: 540, zoom: lerp(1.0, 1.1, prog(tt, L24.start - 0.45, b.akane_faces_forward)) }, () => {
            BS.common.camera(g, { x: 960, y: 450, zoom: 1.5 }, () => vessel(g, tt, 1800, 60));
            w().drawGrade(g, { color: '#2a4090', amount: 0.45, mode: 'soft-light' });
            dim(g, 0.3, '6,4,16');
            c().drawAkane(g, o);
          });
          w().drawParticles(g, { t: tt * 0.5, seed: 12, count: 35, vx: -12, vy: -4, alpha: 0.4 });
          w().drawVignette(g, { strength: 0.65 });
        } },
      { // 10. she lifts her face: determined, then a smile — light from ahead
        a: b.akane_faces_forward - 0.05, b: L24.end - 0.05, draw: (g, lt, tt) => {
          const sm = tt > L24.start + (L24.end - L24.start) * 0.8;
          const o = placeHead(AK(tt, { scale: 3.3, yaw: 20, pose: 'stand', expr: sm ? 'smile' : 'determined', look: { x: 0.15, y: -0.15 }, rim: { color: '#ffc08a', strength: 0.7 } }), 900, 420);
          BS.common.camera(g, { x: 960, y: 540, zoom: lerp(1.04, 1.16, prog(tt, b.akane_faces_forward, L24.end)) }, () => {
            BS.common.camera(g, { x: 960, y: 450, zoom: 1.5 }, () => vessel(g, tt, 1800, 60));
            w().drawGrade(g, { color: '#ffb070', amount: 0.15, mode: 'soft-light' });
            c().drawAkane(g, o);
          });
          w().drawLightRays(g, { x: 1900, y: 120, angle: Math.PI * 0.9, t: tt, alpha: 0.22 * prog(tt, b.akane_faces_forward, b.akane_faces_forward + 0.8) });
          w().drawParticles(g, { t: tt, seed: 13, count: 45, vx: -60, vy: -6, alpha: 0.5 });
          w().drawVignette(g, { strength: 0.5 });
        } },
      { // 11. and she runs off into the flow
        a: L24.end - 0.05, b: S.end + 0.6, tin: { type: 'whip', dur: 0.18, dir: 1 }, draw: (g, lt, tt) => {
          const t0 = L24.end - 0.05, sp = prog(tt, t0, t0 + 0.3);
          const scroll = 1800 + (tt - t0) * 900 * sp;
          BS.common.camera(g, { x: 960, y: 560, zoom: 1.08 }, () => {
            w().drawVesselSide(g, { t: tt, scrollX: scroll, layers: 'back', scrollSpeed: 900 });
            c().drawAkane(g, AK(tt, { x: lerp(820, 1000, prog(tt, t0, S.end + 0.6)), y: 931, scale: 1.25, yaw: 64, pose: 'run', runPhase: c().runPhase(tt, 0.19), expr: 'determined', speed: sp }));
            w().drawFlowCells(g, { t: tt, scrollX: scroll, layer: 'front', scrollSpeed: 900 });
          });
          w().drawSpeedLines(g, { t: tt, cx: -400, cy: H / 2, intensity: 0.5 * sp, inner: 0.5 });
          w().drawVignette(g, { strength: 0.5 });
        } },
    ];
    BS.common.playShots(ctx, t, shots, E);
  }

  BS.ep01.comp = comp;
  BS.ep01.plasma = plasma;
  BS.ep01.life = life;
})();
