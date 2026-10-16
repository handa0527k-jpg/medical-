// BLOOD STORY 第1話 本編：赤血球パート（#10–20）
//   BS.ep01.shape  #10–14 赤血球の形（模型→断面→核なし→Hb）・膜骨格・毛細血管を変形して通る
//   BS.ep01.hb     #15–16 ヘモグロビン α₂β₂ 四量体、ヘムの鉄に O₂ が4つ結合
//   BS.ep01.co2    #17–20 肺⇄組織ループ（ミニ・アカネが走る）・CO₂運搬（炭酸脱水酵素・バンド3）・アカネ
// Every time comes from S.beats / E.line(); diagrams' p is mapped onto the beats with keys().
(() => {
  const { W, H, clamp, lerp, ease, prog, keys, shake, camera, playShots } = BS.common;
  BS.ep01 = BS.ep01 || {};
  const w = () => BS.world, c = () => BS.chars, D = () => BS.diag;
  const kl = (t, ks) => keys(t, ks, ease.lin);
  const HOLO = [134, 236, 255];
  const RIM_HOLO = { color: '#8ff0ff', strength: 0.55, dir: -1 };
  const RIM_WARM = { color: '#ff7a5c', strength: 0.45, dir: 1 };
  const L = (id) => BS.E.line(id);
  const mouthA = (t) => BS.E.mouth('アカネ', t);

  // ---------------------------------------------------------------- shared pieces
  // calm vessel interior (side view, slow flow), dimmed so the hologram reads
  function bgVessel(ctx, t, { scroll = 0, dim = 0.38, speed = 60 } = {}) {
    const Lr = w().drawVesselSide(ctx, { t, scrollX: scroll + t * speed, layers: 'back', scrollSpeed: speed });
    ctx.fillStyle = `rgba(10,0,10,${dim})`; ctx.fillRect(-200, -200, W + 400, H + 400);
    return Lr.groundY || 891;
  }
  // light cone from Akane's wrist band up to the bottom edge of a panel
  function beam(ctx, from, px, py, sc, size, a, t) {
    if (a <= 0.01) return;
    const pw = size[0] * sc, ph = size[1] * sc, by = py + ph / 2 - 4, hw = pw * 0.46;
    const fl = 0.85 + 0.15 * Math.sin(t * 17) * Math.sin(t * 5.3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(from.x, from.y, px, by);
    g.addColorStop(0, `rgba(${HOLO},${0.42 * a * fl})`); g.addColorStop(1, `rgba(${HOLO},${0.05 * a * fl})`);
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(from.x - 7, from.y); ctx.lineTo(from.x + 7, from.y); ctx.lineTo(px + hw, by); ctx.lineTo(px - hw, by); ctx.closePath(); ctx.fill();
    const r = 70 * a;
    const gg = ctx.createRadialGradient(from.x, from.y, 0, from.x, from.y, r);
    gg.addColorStop(0, `rgba(220,250,255,${0.9 * a})`); gg.addColorStop(0.3, `rgba(${HOLO},${0.4 * a})`); gg.addColorStop(1, `rgba(${HOLO},0)`);
    ctx.fillStyle = gg; ctx.fillRect(from.x - r, from.y - r, r * 2, r * 2);
    ctx.restore();
  }
  // a diagram + the beam from Akane's hand. o = akane opts (already drawn) or null
  function holo(ctx, name, d, ak, t, beamA = 1) {
    if (ak) {
      const hA = c().handAnchor('akane', ak);
      beam(ctx, hA.holo, d.x, d.y, d.scale, D().SIZE[name], beamA * clamp(d.p / 0.04), t);
    }
    D()[name](ctx, { emitter: false, t, ...d });
  }
  function akane(ctx, t, o, seed = 31) {
    c().drawAkane(ctx, { t, blink: c().blinkAt(t, seed), rim: RIM_HOLO, ...o });
  }
  function faceCam(o, zoom, dx = 0, dy = 0) { const a = c().headAnchor('akane', o); return { x: a.x + dx, y: a.y + dy, zoom }; }
  function holoLight(ctx, x, y, r, a) { // cyan bloom (hologram light spilling on the scene)
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${HOLO},${0.22 * a})`); g.addColorStop(1, `rgba(${HOLO},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
  }
  function flash(ctx, k, col = '255,240,230') { if (k <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${col},${k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // decaying pulse after each of the given times
  const pulse = (t, ts, k = 6) => { let p = 0; for (const b of ts) if (t >= b) p = Math.max(p, Math.exp(-(t - b) * k)); return p; };
  function sparkles(ctx, t, x, y, R, n, a, seed = 1) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const h = BS.common.hash(i * 3.1 + seed), ang = h * 6.283 + t * (0.4 + h), rr = R * (0.4 + 0.6 * BS.common.hash(i * 7.7 + seed));
      const tw = 0.5 + 0.5 * Math.sin(t * 6 + i * 2.3), sx = x + Math.cos(ang) * rr, sy = y + Math.sin(ang) * rr * 0.7, s = 5 + 9 * tw;
      ctx.fillStyle = `rgba(255,240,200,${a * tw})`;
      ctx.beginPath(); ctx.moveTo(sx, sy - s); ctx.lineTo(sx + s * 0.25, sy); ctx.lineTo(sx, sy + s); ctx.lineTo(sx - s * 0.25, sy); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx - s, sy); ctx.lineTo(sx, sy + s * 0.25); ctx.lineTo(sx + s, sy); ctx.lineTo(sx, sy - s * 0.25); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // gas badge (O₂ / CO₂) for Akane's last line
  function gasBadge(ctx, x, y, label, col, a, t) {
    if (a <= 0.01) return;
    const s = 0.8 + 0.2 * ease.back(clamp(a * 1.4));
    ctx.save(); ctx.translate(x, y + Math.sin(t * 3 + x) * 6); ctx.scale(s, s); ctx.globalAlpha = clamp(a * 1.5);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 120); g.addColorStop(0, `rgba(${col},0.55)`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fillRect(-120, -120, 240, 240);
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fillStyle = 'rgba(10,6,24,0.75)'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = `rgba(${col},1)`; ctx.stroke();
    ctx.font = '56px ZenKaku, IPAGothic, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.shadowColor = `rgba(${col},1)`; ctx.shadowBlur = 18; ctx.fillText(label, 0, 4);
    ctx.restore();
  }

  // ================================================================ SHAPE  #10–14
  BS.ep01.shape = function (ctx, t, E, S) {
    const b = S.beats, l10 = L('E01-10'), l12 = L('E01-12'), l13 = L('E01-13'), l14 = L('E01-14');
    const pModel = (tt) => kl(tt, [[b.model_appears, 0], [b.model_appears + 0.9, 0.065], [b.model_rotate, 0.1], [b.cross_section, 0.36],
      [b.dim_7_5um - 0.35, 0.47], [b.dim_7_5um + 0.9, 0.56], [b.no_nucleus - 2.2, 0.64], [b.no_nucleus - 0.15, 0.71], [b.no_nucleus + 0.9, 0.79],
      [b.hb_fill_start, 0.8], [b.hb_fill_full, 0.95], [b.hb_fill_full + 1.5, 1]]);
    const pMesh = (tt) => kl(tt, [[b.mesh_appears - 0.2, 0], [b.mesh_appears + 0.7, 0.065], [l13.start + 1.0, 0.17], [l13.start + 1.5, 0.29], [l13.start + 1.9, 0.36],
      [l13.start + 3.2, 0.46], [b.membrane_stretch - 0.6, 0.56], [b.membrane_stretch - 0.15, 0.58], [b.membrane_spring_back, 0.658], [b.membrane_spring_back + 0.8, 0.74]]);
    const tA2 = l10.start + 1.15, tA3 = b.cross_section - 0.25, tA4 = l12.start - 0.25, tA5 = b.mesh_appears - 0.2, tA5b = l13.start + 3.7;
    const tA6 = b.capillary_cut, tA6b = l14.start + 1.9;
    const MOD = { x: 1240, y: 410, scale: 0.68 };

    // A1: Akane raises her wristband — the RBC model materialises (「見て！」)
    function a1(ctx, lt, t) {
      const zoom = lerp(1.0, 1.08, prog(t, S.start, tA2, ease.inOut));
      camera(ctx, { x: lerp(980, 1010, prog(t, S.start, tA2)), y: 540, zoom }, () => {
        bgVessel(ctx, t, { scroll: 2000 });
        const raise = prog(t, S.start, b.model_appears + 0.3);
        const ak = { x: 560, y: 1030, scale: 1.25, yaw: 32, pose: raise > 0.5 ? 'present' : 'stand', pointAt: { x: 900, y: 640 }, holo: true,
          expr: t < l10.start ? 'happy' : 'happy', mouth: mouthA(t), look: { x: 0.6, y: -0.35 } };
        akane(ctx, t, ak);
        holo(ctx, 'rbcModel', { ...MOD, p: pModel(t) }, ak, t);
        holoLight(ctx, MOD.x, MOD.y, 700, clamp(pModel(t) * 8));
      });
      w().drawParticles(ctx, { t, seed: 21, count: 40, vx: -20, alpha: 0.35 });
      w().drawVignette(ctx, { strength: 0.55 });
    }
    // A2: close-up — Akane beside the big spinning model (「これが本当の私たちの形」)
    function a2(ctx, lt, t) {
      const o = { x: 760, y: 1010, scale: 3.2, yaw: 34, pose: 'present', pointAt: { x: 1500, y: 600 }, holo: true, expr: 'happy', mouth: mouthA(t), look: { x: 0.55, y: -0.1 } };
      const k = prog(t, tA2, tA3, ease.lin);
      camera(ctx, faceCam(o, lerp(1.0, 1.07, k), 330, 160), () => {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); bgVessel(ctx, t, { scroll: 2400, dim: 0.5 }); ctx.restore();
        akane(ctx, t, o);
      });
      // the "real" model: a big RBC hologram turning slowly at the right
      const tilt = lerp(0.25, 1.15, ease.inOut(k)), rx = 1430, ry = 430;
      holoLight(ctx, rx, ry, 520, 1);
      w().drawRBC(ctx, { x: rx, y: ry + Math.sin(t * 1.6) * 8, r: 250, tiltX: tilt, tiltY: 0.25 * Math.sin(t * 0.9), rot: -0.4 + k * 0.6, alpha: 0.95 });
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${HOLO},0.5)`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(rx, ry + 10, 330, 80, 0, Math.PI * 0.05 + t * 0.6, Math.PI * 0.95 + t * 0.6); ctx.stroke(); ctx.restore();
      sparkles(ctx, t, rx, ry, 360, 10, 0.5, 4);
      w().drawVignette(ctx, { strength: 0.5 });
    }
    // A3: the full panel — cross-section, 直径 7.5 µm, 核なし; Akane points at it from the left
    function a3(ctx, lt, t) {
      const P = { x: 1090, y: 440, scale: 0.8 };
      const push = prog(t, b.no_nucleus - 2.6, b.no_nucleus + 0.4, ease.inOut);
      const cam = { x: lerp(960, 1010, push) + lerp(-20, 0, prog(t, tA3, tA4)), y: lerp(540, 490, push), zoom: lerp(1.0, 1.12, push) + 0.02 * prog(t, tA3, tA4, ease.lin) };
      camera(ctx, cam, () => {
        bgVessel(ctx, t, { scroll: 2600 });
        const ak = { x: 390, y: 1010, scale: 0.98, yaw: 40, pose: 'point', pointAt: { x: 900, y: 420 }, holo: true, expr: t < b.no_nucleus ? 'happy' : 'proud', look: { x: 0.6, y: -0.3 } };
        akane(ctx, t, ak);
        holoLight(ctx, P.x, P.y, 760, 1);
        holo(ctx, 'rbcModel', { ...P, p: pModel(t) }, null, t);
      });
      w().drawVignette(ctx, { strength: 0.5 });
    }
    // A4: two-shot — Akane (proud) with the panel filling with hemoglobin (「たっぷり詰めこめるんだ」)
    function a4(ctx, lt, t) {
      const P = { x: 1380, y: 380, scale: 0.6 };
      camera(ctx, { x: lerp(980, 1000, prog(t, tA4, tA5)), y: 540, zoom: lerp(1.0, 1.05, prog(t, tA4, tA5)) }, () => {
        bgVessel(ctx, t, { scroll: 3000, dim: 0.45 });
        const cheer = t > b.hb_fill_full - 0.4;
        const ak = { x: 620, y: 1500, scale: 2.35, yaw: 28, pose: cheer ? 'cheer' : 'present', pointAt: { x: 1100, y: 420 }, holo: true, expr: cheer ? 'proud' : 'happy', mouth: mouthA(t), look: { x: 0.25, y: -0.1 } };
        holoLight(ctx, P.x, P.y, 600, 1);
        holo(ctx, 'rbcModel', { ...P, p: pModel(t) }, null, t);
        akane(ctx, t, ak, 32);
      });
      if (t > b.hb_fill_full - 0.4) sparkles(ctx, t, 640, 330, 300, 12, prog(t, b.hb_fill_full - 0.4, b.hb_fill_full) * 0.8, 7);
      w().drawVignette(ctx, { strength: 0.5 });
    }
    // A5: membrane skeleton panel; Akane looks up at it
    function a5(ctx, lt, t) {
      const P = { x: 1110, y: 410, scale: 0.74 };
      camera(ctx, { x: lerp(940, 990, prog(t, tA5, tA5b)), y: 540, zoom: lerp(1.0, 1.07, prog(t, tA5, tA5b)) }, () => {
        bgVessel(ctx, t, { scroll: 3400 });
        const ak = { x: 330, y: 1010, scale: 0.98, yaw: 38, pose: 'present', pointAt: { x: 640, y: 700 }, holo: true, expr: 'calm', look: { x: 0.6, y: -0.45 } };
        akane(ctx, t, ak, 33);
        holoLight(ctx, P.x, P.y, 760, 1);
        holo(ctx, 'membraneSkeleton', { ...P, p: pMesh(t) }, ak, t, 0.8);
      });
      w().drawVignette(ctx, { strength: 0.5 });
    }
    // A5b: push in on the spectrin net — it stretches and springs back
    function a5b(ctx, lt, t) {
      const P = { x: 1110, y: 410, scale: 0.74 };
      const st = pulse(t, [b.membrane_spring_back], 5) * (t > b.membrane_spring_back ? 1 : 0);
      const [sx, sy] = shake(t, 5 * st);
      const zoom = lerp(1.22, 1.28, prog(t, tA5b, tA6, ease.lin)) - 0.04 * prog(t, b.membrane_stretch - 0.15, b.membrane_spring_back, ease.out) * (t < b.membrane_spring_back ? 1 : 0)
        - 0.04 * (t >= b.membrane_spring_back ? Math.exp(-(t - b.membrane_spring_back) * 4) : 0);
      camera(ctx, { x: lerp(1080, 1130, prog(t, tA5b, tA6)), y: 520, zoom, sx, sy }, () => {
        bgVessel(ctx, t, { scroll: 3400 });
        holoLight(ctx, P.x, P.y, 760, 1);
        holo(ctx, 'membraneSkeleton', { ...P, p: pMesh(t) }, null, t);
      });
      w().drawVignette(ctx, { strength: 0.5 });
    }
    // A6: first-person into the capillary, Akane squeezing towards us (「だから、自分より細い…」)
    const run = (t, si = 0.22) => c().runPhase(t, si, 0);
    function a6(ctx, lt, t) {
      const narrow = prog(t, tA6, tA6b - 0.3, ease.inOut);
      w().drawCapillary(ctx, { t, z: (t - tA6) * 2.2 + 3, narrow: lerp(0.25, 1, narrow), vz: 2.5 });
      const bob = Math.abs(Math.sin(run(t) * Math.PI * 2)) * 4;
      const sq = prog(t, tA6 + 0.6, tA6b - 0.3) * 0.8;
      c().drawAkane(ctx, { x: 960, y: lerp(1140, 1090, narrow) - bob, scale: lerp(1.65, 1.45, narrow), yaw: 12, pose: 'run', runPhase: run(t), squash: sq, holdO2: true,
        expr: 'determined', mouth: mouthA(t), blink: c().blinkAt(t, 34), t, rim: { color: '#ff9a7a', strength: 0.45 }, speed: 0.8 });
      const g = ctx.createRadialGradient(W / 2, H / 2, lerp(900, 420, narrow), W / 2, H / 2, 1150); g.addColorStop(0, 'rgba(40,0,6,0)'); g.addColorStop(1, `rgba(40,0,6,${0.4 + narrow * 0.35})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      flash(ctx, 0.35 * (1 - prog(t, tA6, tA6 + 0.3)));
    }
    // A6b: side view — she squeezes through in single file and pops out of the narrowest part, grinning
    function a6b(ctx, lt, t) {
      const scroll = (t - tA6b) * 340 + 900;
      const zoom = lerp(1.35, 1.2, prog(t, tA6b, S.end, ease.out));
      const ax = lerp(820, 900, prog(t, tA6b, S.end));
      let Lr;
      camera(ctx, { x: ax + 120, y: 560, zoom }, () => {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.restore();
        Lr = w().drawCapillarySide(ctx, { t, scrollX: scroll, narrow: 0.82, cells: false, scrollSpeed: 340 });
        const midY = (Lr.top + Lr.bottom) / 2;
        for (const dx of [-620, 620, 1240]) w().drawRBC(ctx, { x: ax + dx + Math.sin(t * 2 + dx) * 10, y: midY, r: (Lr.bottom - Lr.top) * 0.42, tiltY: -Math.PI / 2, deform: 0.75 });
        const happy = t > l14.start + 3.0;
        c().drawAkane(ctx, { x: ax, y: Lr.groundY, scale: 0.78, yaw: 50, pose: happy ? 'cheer' : 'run', runPhase: run(t, 0.25), squash: happy ? 0.55 : 0.85, holdO2: !happy,
          expr: happy ? 'happy' : 'determined', mouth: mouthA(t), blink: c().blinkAt(t, 35), t, rim: { color: '#ffb090', strength: 0.4 }, speed: 0.7 });
      });
      w().drawVignette(ctx, { strength: 0.45 });
    }
    playShots(ctx, t, [
      { a: S.start, b: tA2, draw: a1 },
      { a: tA2, b: tA3, draw: a2 },
      { a: tA3, b: tA4, draw: a3, tin: { type: 'dissolve', dur: 0.3 } },
      { a: tA4, b: tA5, draw: a4 },
      { a: tA5, b: tA5b, draw: a5, tin: { type: 'dissolve', dur: 0.5 } },
      { a: tA5b, b: tA6, draw: a5b },
      { a: tA6, b: tA6b, draw: a6, tin: { type: 'whip', dur: 0.3, dir: 1 } },
      { a: tA6b, b: S.end + 1, draw: a6b, tin: { type: 'dissolve', dur: 0.25 } },
    ], E);
  };

  // ================================================================ HB  #15–16
  BS.ep01.hb = function (ctx, t, E, S) {
    const b = S.beats, l16 = L('E01-16');
    const O2 = [b.o2_bind_1, b.o2_bind_2, b.o2_bind_3, b.o2_bind_4];
    const pHb = (tt) => kl(tt, [[b.tetramer_appears - 0.1, 0], [b.tetramer_appears + 0.8, 0.065], [b.alpha_chains - 0.2, 0.19], [b.alpha_chains + 0.1, 0.2],
      [b.beta_chains, 0.25], [b.beta_chains + 1.2, 0.28], [b.hemes_glow - 0.1, 0.295], [b.hemes_glow + 0.3, 0.31], [b.heme_iron - 1.1, 0.34], [b.heme_iron - 0.1, 0.38],
      [O2[0] - 0.45, 0.44], [O2[0], 0.52], [O2[1], 0.62], [O2[2], 0.72], [O2[3], 0.82], [b.max_four - 0.1, 0.86], [b.max_four + 1.1, 0.94], [b.max_four + 2.2, 1]]);
    const P = { x: 820, y: 430, scale: 0.74 };
    const tB2 = l16.start - 0.2, tB3 = b.heme_iron - 0.35, tB4 = b.max_four - 1.2;
    const hbCenter = { x: P.x - 190 * P.scale, y: P.y - 10 * P.scale };
    const akO = (t, extra) => ({ x: 1560, y: 1020, scale: 1.05, yaw: -36, holo: true, ...extra });

    function b1(ctx, lt, t) {
      camera(ctx, { x: lerp(1010, 950, prog(t, S.start, tB2)), y: 540, zoom: lerp(1.0, 1.06, prog(t, S.start, tB2)) }, () => {
        bgVessel(ctx, t, { scroll: 5200 });
        const ak = akO(t, { pose: 'present', pointAt: { x: 1180, y: 680 }, expr: 'happy', look: { x: -0.6, y: -0.35 } });
        akane(ctx, t, ak, 41);
        holoLight(ctx, P.x, P.y, 720, 1);
        holo(ctx, 'hemoglobin', { ...P, p: pHb(t) }, ak, t);
      });
      w().drawParticles(ctx, { t, seed: 22, count: 40, vx: -20, alpha: 0.35 });
      w().drawVignette(ctx, { strength: 0.5 });
    }
    // B2: push in — hemes light up, the inset opens
    function b2(ctx, lt, t) {
      const k = prog(t, tB2, tB3, ease.inOut);
      camera(ctx, { x: lerp(840, 880, k), y: lerp(470, 480, k), zoom: lerp(1.35, 1.48, k) }, () => {
        bgVessel(ctx, t, { scroll: 5200 });
        holoLight(ctx, P.x, P.y, 720, 1);
        holo(ctx, 'hemoglobin', { ...P, p: pHb(t) }, null, t);
      });
      flash(ctx, 0.25 * pulse(t, [b.hemes_glow], 5), '255,120,120');
      w().drawVignette(ctx, { strength: 0.55 });
    }
    // B3: on the tetramer — four O₂ click in, the camera punches in on every click
    function b3(ctx, lt, t) {
      let n = 0; for (const x of O2) if (t >= x) n++;
      const pk = pulse(t, O2, 9);
      const [sx, sy] = shake(t, 6 * pk);
      camera(ctx, { x: 790 + n * 8, y: 490, zoom: 1.42 + n * 0.05 + 0.04 * pk, sx, sy }, () => {
        bgVessel(ctx, t, { scroll: 5200 });
        holoLight(ctx, P.x, P.y, 720, 1);
        holo(ctx, 'hemoglobin', { ...P, p: pHb(t) }, null, t);
      });
      flash(ctx, 0.22 * pk, '200,245,255');
      w().drawVignette(ctx, { strength: 0.55 });
    }
    // B4: pull back out — Akane cheers at 「最大四つ」
    function b4(ctx, lt, t) {
      const k = prog(t, tB4, tB4 + 1.4, ease.out);
      camera(ctx, { x: lerp(820, 960, k), y: lerp(470, 540, k), zoom: lerp(1.35, 1.02, k) }, () => {
        bgVessel(ctx, t, { scroll: 5200 });
        const cheer = t > b.max_four;
        const ak = akO(t, { pose: cheer ? 'cheer' : 'look_up', expr: cheer ? 'happy' : 'surprised', look: { x: -0.6, y: -0.3 } });
        akane(ctx, t, ak, 41);
        holoLight(ctx, P.x, P.y, 720, 1);
        holo(ctx, 'hemoglobin', { ...P, p: pHb(t) }, null, t);
        if (cheer) sparkles(ctx, t, 1560, 420, 220, 10, prog(t, b.max_four, b.max_four + 0.3), 9);
      });
      w().drawVignette(ctx, { strength: 0.5 });
    }
    playShots(ctx, t, [
      { a: S.start, b: tB2, draw: b1 },
      { a: tB2, b: tB3, draw: b2, tin: { type: 'dissolve', dur: 0.35 } },
      { a: tB3, b: tB4, draw: b3 },
      { a: tB4, b: S.end + 1, draw: b4 },
    ], E);
  };

  // ================================================================ CO2  #17–20
  // RBC position on the lungTissueLoop (mirrors diag_rbc.js): local panel coords
  function loopPos(p) {
    const T = Math.PI * 2, e = (x) => { x = clamp(x); return x * x * (3 - 2 * x); }, s = (a, b) => clamp((p - a) / (b - a));
    let ph;
    if (p < 0.3) ph = Math.PI; else if (p < 0.5) ph = Math.PI + Math.PI * e(s(0.3, 0.5));
    else if (p < 0.62) ph = T; else if (p < 0.82) ph = T + Math.PI * e(s(0.62, 0.82)); else ph = 3 * Math.PI;
    return { x: Math.cos(ph) * 420, y: 20 + Math.sin(ph) * 220, moving: (p > 0.3 && p < 0.5) ? 1 : (p > 0.62 && p < 0.82) ? -1 : 0 };
  }
  BS.ep01.co2 = function (ctx, t, E, S) {
    const b = S.beats, l17 = L('E01-17'), l18 = L('E01-18'), l19 = L('E01-19'), l20 = L('E01-20');
    const pLoop = (tt) => kl(tt, [[S.start, 0], [b.lung_breath + 0.6, 0.065], [b.o2_pickup_lung - 0.5, 0.2], [b.o2_pickup_lung, 0.23], [b.o2_pickup_lung + 0.3, 0.3],
      [b.o2_release_tissue - 0.05, 0.5], [b.o2_release_tissue + 0.6, 0.58], [b.o2_release_tissue + 1.0, 0.63], [l17.end - 0.2, 0.82], [l17.end + 0.8, 0.9], [l17.end + 1.6, 1]]);
    const pCo2 = (tt) => kl(tt, [[l18.start - 0.35, 0], [b.co2_enters - 0.5, 0.065], [b.co2_enters, 0.1], [b.enzyme - 0.6, 0.18], [b.enzyme + 0.5, 0.24],
      [b.reaction, 0.3], [b.hco3_formed - 0.6, 0.35], [b.hco3_formed, 0.38], [b.hco3_formed + 1.6, 0.43], [b.band3_open - 0.6, 0.44], [b.band3_open, 0.53],
      [b.hco3_out, 0.58], [b.hco3_in_plasma, 0.68], [b.hco3_in_plasma + 0.8, 0.74], [b.hco3_in_plasma + 1.6, 0.8], [S.end, 0.9]]);
    const tC2 = b.o2_pickup_lung - 0.15, tC3 = l17.start + 3.15, tC4 = l18.start - 0.35, tC5 = b.enzyme - 0.45, tC6 = l19.start - 0.2, tC7 = l20.start - 0.2;
    const PL = { x: 1210, y: 420, scale: 0.68 };
    const PC = { x: 1130, y: 430, scale: 0.76 };

    // C1: Akane projects the lung⇄tissue loop (「肺で酸素を受け取って」)
    function c1(ctx, lt, t) {
      camera(ctx, { x: lerp(960, 1040, prog(t, S.start, tC2)), y: lerp(540, 500, prog(t, S.start, tC2)), zoom: lerp(1.0, 1.12, prog(t, S.start, tC2)) }, () => {
        bgVessel(ctx, t, { scroll: 6000 });
        const ak = { x: 520, y: 1030, scale: 1.25, yaw: 32, pose: 'present', pointAt: { x: 880, y: 640 }, holo: true, expr: 'happy', mouth: mouthA(t), look: { x: 0.6, y: -0.3 } };
        akane(ctx, t, ak, 51);
        holoLight(ctx, PL.x, PL.y, 700, 1);
        holo(ctx, 'lungTissueLoop', { ...PL, p: pLoop(t) }, ak, t);
      });
      w().drawVignette(ctx, { strength: 0.55 });
    }
    // C2: into the hologram — a mini Akane runs the loop with the red cell (「組織で手放す」)
    function c2(ctx, lt, t) {
      const p = pLoop(t), q = loopPos(p);
      const k = prog(t, tC2, tC3, ease.inOut);
      const sx0 = PL.x + q.x * PL.scale, sy0 = PL.y + q.y * PL.scale;
      const cam = { x: lerp(PL.x + 60, PL.x + 120, k), y: PL.y + 60, zoom: lerp(1.5, 1.6, k) };
      camera(ctx, cam, () => {
        bgVessel(ctx, t, { scroll: 6000, dim: 0.5 });
        holoLight(ctx, PL.x, PL.y, 700, 1);
        holo(ctx, 'lungTissueLoop', { ...PL, p }, null, t);
        // mini Akane: rides on the path just behind the red cell icon, holding the O₂ while she has it
        const moving = q.moving !== 0, has = p > 0.23 && p < 0.53;
        const yaw = q.moving > 0 ? 70 : q.moving < 0 ? -70 : (p < 0.62 ? 60 : 20);
        const back = q.moving > 0 ? -70 : q.moving < 0 ? 70 : (p < 0.4 ? 70 : -75);
        c().drawAkane(ctx, { x: sx0 + back * PL.scale, y: sy0 + 64 * PL.scale, scale: 0.3, yaw, pose: moving ? 'run' : (has ? 'hold' : 'cheer'),
          runPhase: c().runPhase(t, 0.14, 0), holdO2: has, expr: moving ? 'determined' : 'happy', blink: c().blinkAt(t, 52), t, speed: moving ? 1 : 0, alpha: 0.95,
          rim: { color: '#8ff0ff', strength: 0.7, dir: 1 } });
      });
      w().drawVignette(ctx, { strength: 0.5 });
    }
    // C3: close-up — 「それが私の仕事！」 with a little victory pose
    function c3(ctx, lt, t) {
      const pose = t > tC3 + 0.25;
      const o = { x: 960, y: 1060, scale: 3.1, yaw: 26, pose: pose ? 'pose' : 'stand', holo: true, expr: pose ? 'proud' : 'happy', mouth: mouthA(t), look: { x: -0.1, y: 0 } };
      camera(ctx, faceCam(o, lerp(1.08, 1.0, prog(t, tC3, tC4, ease.out)), 40, 180), () => {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); bgVessel(ctx, t, { scroll: 6300, dim: 0.3, speed: 120 }); ctx.restore();
        c().drawAkane(ctx, { t, blink: c().blinkAt(t, 53), rim: RIM_WARM, ...o });
      });
      w().drawLightRays(ctx, { x: 1700, y: -80, angle: 2.2, t, alpha: 0.2 });
      sparkles(ctx, t, 960, 380, 520, 14, prog(t, tC3 + 0.25, tC3 + 0.6), 11);
      w().drawVignette(ctx, { strength: 0.45 });
    }
    // C4: CO₂ transport panel; Akane watches from the left (「帰り道には、二酸化炭素も運ぶ」)
    function c4(ctx, lt, t) {
      camera(ctx, { x: lerp(930, 980, prog(t, tC4, tC5)), y: 540, zoom: lerp(1.0, 1.06, prog(t, tC4, tC5)) }, () => {
        bgVessel(ctx, t, { scroll: 6600 });
        const ak = { x: 320, y: 1010, scale: 0.98, yaw: 40, pose: 'present', pointAt: { x: 600, y: 700 }, holo: true, expr: 'calm', look: { x: 0.6, y: -0.4 } };
        akane(ctx, t, ak, 54);
        holoLight(ctx, PC.x, PC.y, 760, 1);
        holo(ctx, 'co2Transport', { ...PC, p: pCo2(t), accent: [190, 160, 255] }, ak, t, 0.8);
      });
      w().drawVignette(ctx, { strength: 0.5 });
    }
    // C5: in on the reaction: 炭酸脱水酵素 → CO₂ + H₂O → H⁺ + HCO₃⁻
    function c5(ctx, lt, t) {
      const k = prog(t, tC5, tC6, ease.inOut);
      const pr = pulse(t, [b.reaction], 6);
      camera(ctx, { x: lerp(PC.x - 150, PC.x - 60, k), y: 470, zoom: lerp(1.34, 1.4, k) + 0.03 * pr }, () => {
        bgVessel(ctx, t, { scroll: 6600 });
        holoLight(ctx, PC.x, PC.y, 760, 1);
        holo(ctx, 'co2Transport', { ...PC, p: pCo2(t), accent: [190, 160, 255] }, null, t);
      });
      flash(ctx, 0.2 * pr, '220,240,255');
      w().drawVignette(ctx, { strength: 0.55 });
    }
    // C6: pan to the membrane — HCO₃⁻ leaves through band 3 (Cl⁻ in)
    function c6(ctx, lt, t) {
      const k = prog(t, tC6, tC7, ease.inOut);
      const pk = pulse(t, [b.hco3_out], 7);
      camera(ctx, { x: lerp(PC.x + 60, PC.x + 150, k), y: lerp(485, 500, k), zoom: lerp(1.45, 1.55, k) + 0.03 * pk }, () => {
        bgVessel(ctx, t, { scroll: 6600 });
        holoLight(ctx, PC.x, PC.y, 760, 1);
        holo(ctx, 'co2Transport', { ...PC, p: pCo2(t), accent: [190, 160, 255] }, null, t);
      });
      w().drawVignette(ctx, { strength: 0.55 });
    }
    // C7: she's off running again — 「行きは酸素、帰りは二酸化炭素。休むひまなしだね！」
    const phO2 = l20.start + 0.1, phCO2 = l20.start + 1.15, phRest = l20.start + 2.9;
    function c7(ctx, lt, t) {
      const scroll = 7000 + (t - tC7) * 700;
      const [sx, sy] = shake(t, 2.5);
      const zoom = lerp(1.18, 1.1, prog(t, tC7, S.end));
      camera(ctx, { x: 980 + sx, y: 520 + sy, zoom }, () => {
        const Lr = w().drawVesselSide(ctx, { t, scrollX: scroll, layers: 'back', scrollSpeed: 700 });
        const gy = Lr.groundY || 891;
        const bob = Math.abs(Math.sin(c().runPhase(t, 0.2, 0) * Math.PI * 2)) * 8;
        c().drawAkane(ctx, { x: 820, y: gy + 120 - bob, scale: 1.45, yaw: 42, pose: 'run', runPhase: c().runPhase(t, 0.2, 0), holdO2: t < phCO2 + 0.4,
          expr: t > phRest ? 'smile' : 'happy', mouth: mouthA(t), blink: c().blinkAt(t, 55), t, speed: 1, rim: RIM_WARM, look: { x: 0.2, y: 0 } });
        w().drawFlowCells(ctx, { t, scrollX: scroll, layer: 'front', scrollSpeed: 700 });
      });
      w().drawSpeedLines(ctx, { t, cx: -400, cy: H / 2, intensity: 0.45, inner: 0.5 });
      // 行き O₂ → 帰り CO₂ badges pop next to her
      const aO = Math.min(prog(t, phO2, phO2 + 0.35, ease.out), 1 - 0.6 * prog(t, phCO2, phCO2 + 0.4));
      const aC = prog(t, phCO2, phCO2 + 0.35, ease.out);
      gasBadge(ctx, 1330, 330, 'O₂', '120,220,255', aO, t);
      gasBadge(ctx, 1600, 470, 'CO₂', '190,150,255', aC, t);
      if (aO > 0.05) { ctx.save(); ctx.globalAlpha = aO; ctx.font = '40px ZenKaku, IPAGothic, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,0,10,0.85)'; ctx.strokeText('行き', 1330, 230); ctx.fillStyle = '#bff0ff'; ctx.fillText('行き', 1330, 230); ctx.restore(); }
      if (aC > 0.05) { ctx.save(); ctx.globalAlpha = aC; ctx.font = '40px ZenKaku, IPAGothic, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,0,10,0.85)'; ctx.strokeText('帰り', 1600, 370); ctx.fillStyle = '#ddd0ff'; ctx.fillText('帰り', 1600, 370); ctx.restore(); }
      if (aC > 0.05) { // arrow O₂ → CO₂
        ctx.save(); ctx.globalAlpha = aC; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(1410, 370); ctx.quadraticCurveTo(1480, 380, 1515, 430); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(1515, 430); ctx.lineTo(1490, 425); ctx.moveTo(1515, 430); ctx.lineTo(1512, 405); ctx.stroke(); ctx.restore();
      }
      w().drawVignette(ctx, { strength: 0.5 });
    }
    playShots(ctx, t, [
      { a: S.start, b: tC2, draw: c1 },
      { a: tC2, b: tC3, draw: c2, tin: { type: 'dissolve', dur: 0.3 } },
      { a: tC3, b: tC4, draw: c3, tin: { type: 'flash', dur: 0.18 } },
      { a: tC4, b: tC5, draw: c4, tin: { type: 'dissolve', dur: 0.5 } },
      { a: tC5, b: tC6, draw: c5, tin: { type: 'dissolve', dur: 0.4 } },
      { a: tC6, b: tC7, draw: c6, tin: { type: 'dissolve', dur: 0.4 } },
      { a: tC7, b: S.end + 1, draw: c7, tin: { type: 'whip', dur: 0.3, dir: 1 } },
    ], E);
  };
})();
