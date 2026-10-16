// BLOOD STORY 第1話 終盤：platelet (#32–33 止血と凝固) / epilogue (#34–36 すれ違い→全景) / next (#37 次回予告).
// Each scene: BS.ep01[id](ctx, t, E, S) with t = film time, S.beats from audio/cues_episode01.json.
// No hard-coded times: every shot boundary and diagram key is derived from S.beats / E.line().
(() => {
  const { W, H, clamp, lerp, ease, prog, keys, shake, camera, renderTo, playShots } = BS.common;
  const w = () => BS.world, c = () => BS.chars, D = () => BS.diag;
  const RIM = { color: '#ff7a5c', strength: 0.5, dir: 1 };
  const RIM_W = { color: '#ffc9a8', strength: 0.45, dir: -1 };
  const HOLO = '120,230,255';
  BS.ep01 = BS.ep01 || {};

  const lighten = (ctx, color, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = color; ctx.globalAlpha = clamp(a); ctx.fillRect(0, 0, W, H); ctx.restore(); };
  const darken = (ctx, a, col = '0,0,0') => { if (a <= 0.003) return; ctx.fillStyle = `rgba(${col},${clamp(a)})`; ctx.fillRect(0, 0, W, H); };
  // draw something in screen space, softly blurred (out-of-focus background plate)
  function blurred(ctx, px, fn) {
    const cv = renderTo(5, fn);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${px}px)`; ctx.drawImage(cv, 0, 0); ctx.restore();
  }
  const walkPh = (t, t0, per = 1.0) => ((((t - t0) / per) % 1) + 1) % 1;

  /* =====================================================================================
   * platelet (#32–33)
   * ===================================================================================== */
  // diagram progress mapped to the narration (docstring stages of BS.diag.woundAndClot)
  function clotP(t, b, S) {
    return keys(t, [
      [S.start, 0], [b.wound, 0.005], [b.bleeding + 0.9, 0.12],          // tear, leak
      [b.platelets_arrive, 0.13], [b.plug - 0.3, 0.30],                    // adhesion (粘着)
      [b.plug + 0.2, 0.44],                                                 // release (ADP)
      [b.plug_sealed + 0.5, 0.68],                                          // aggregation → primary plug
      [b.fibrinogen_to_fibrin, 0.69], [b.mesh_weave, 0.77],                // fibrinogen → fibrin
      [b.mesh_traps_cells, 0.86], [b.mesh_tight, 0.95], [S.end, 1],        // trapped RBCs, stable clot
    ], ease.inOut);
  }

  // plate (labels:false) with Akane + Shirou standing on the wall on either side of the wound
  function clotPlate(ctx, t, p, o = {}) {
    const res = D().woundAndClot(ctx, { p, t, labels: false, x: 960, y: 540 });
    const gy = res.groundY;
    const b = o.b;
    const tear = b ? Math.exp(-Math.max(0, t - b.wound) * 3) * (t > b.wound ? 1 : 0) : 0;
    const sexpr = o.sexpr || 'alert', aexpr = o.aexpr || 'surprised';
    c().drawShirou(ctx, { x: o.sx || 520, y: gy, scale: o.cs || 0.72, yaw: o.syaw || 55, pose: o.spose || 'ready', expr: sexpr,
      blink: c().blinkAt(t, 21), t, rim: RIM_W, look: o.slook || { x: 0.5, y: 0.5 }, squash: tear * 0.2 });
    c().drawAkane(ctx, { x: o.ax || 1400, y: gy, scale: (o.cs || 0.72) * 0.95, yaw: o.ayaw || -55, pose: o.apose || 'stand', expr: aexpr,
      blink: c().blinkAt(t, 22), t, rim: RIM, look: o.alook || { x: -0.5, y: 0.5 }, holo: o.holo, squash: tear * 0.25 });
    return res;
  }

  // simple hologram of a megakaryocyte shedding platelets. k 0..1 (0–.3 cell, .3–1 proplatelets bud off)
  function megaHolo(ctx, cx, cy, s, k, kf, t, alpha) {
    if (alpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(cx, cy); ctx.scale(s, s);
    const pw = 860, ph = 520;
    // panel
    const open = ease.out(clamp(alpha * 1.4));
    ctx.save(); ctx.scale(1, lerp(0.05, 1, open));
    ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 26);
    const g = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2); g.addColorStop(0, 'rgba(20,60,90,0.62)'); g.addColorStop(1, 'rgba(10,30,60,0.72)');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = `rgba(${HOLO},0.85)`; ctx.stroke();
    ctx.clip();
    for (let y = -ph / 2; y < ph / 2; y += 6) { ctx.fillStyle = `rgba(${HOLO},${0.035 + 0.02 * Math.sin(y * 0.3 + t * 8)})`; ctx.fillRect(-pw / 2, y, pw, 2); }
    // header
    ctx.font = '38px ZenKaku, IPAGothic, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8fbff'; ctx.fillText('巨核球 → 血小板', -pw / 2 + 34, -ph / 2 + 44);
    ctx.fillStyle = `rgba(${HOLO},0.8)`; ctx.fillRect(-pw / 2 + 34, -ph / 2 + 74, 300, 3);
    ctx.font = '22px ZenKaku, IPAGothic, sans-serif'; ctx.fillStyle = `rgba(${HOLO},0.85)`; ctx.textAlign = 'right';
    ctx.fillText('MEGAKARYOCYTE', pw / 2 - 30, -ph / 2 + 44);
    // the cell (big, lobulated nucleus)
    const ccx = -170, ccy = 40, R = 150 * ease.back(clamp(k / 0.3));
    if (R > 1) {
      const breathe = 1 + 0.015 * Math.sin(t * 2.4);
      ctx.save(); ctx.translate(ccx, ccy); ctx.scale(breathe, breathe);
      // proplatelet arms reaching right (budding beads)
      const arm = clamp((k - 0.3) / 0.45);
      for (let i = 0; i < 4; i++) {
        const a0 = -0.55 + i * 0.37, L = R * (0.4 + 1.25 * arm) * (0.85 + 0.15 * Math.sin(i * 2.1));
        ctx.beginPath(); ctx.moveTo(Math.cos(a0) * R * 0.85, Math.sin(a0) * R * 0.85);
        const ex = Math.cos(a0) * (R + L), ey = Math.sin(a0) * (R + L) + Math.sin(t * 2 + i) * 8;
        ctx.quadraticCurveTo(Math.cos(a0 + 0.15) * (R + L * 0.5), Math.sin(a0 + 0.15) * (R + L * 0.5), ex, ey);
        ctx.strokeStyle = 'rgba(200,170,255,0.75)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke();
        for (let j = 1; j <= 3; j++) { const q = j / 3.3; const bx = lerp(Math.cos(a0) * R, ex, q), by = lerp(Math.sin(a0) * R, ey, q); ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.fillStyle = 'rgba(235,215,255,0.9)'; ctx.fill(); }
      }
      const cg = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
      cg.addColorStop(0, 'rgba(225,205,255,0.95)'); cg.addColorStop(1, 'rgba(160,120,230,0.85)');
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, rr = R * (1 + 0.05 * Math.sin(a * 5 + t)); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fillStyle = cg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = `rgba(${HOLO},0.9)`; ctx.stroke();
      // granules
      for (let i = 0; i < 46; i++) { const a = i * 2.39, rr = R * (0.55 + 0.4 * ((i * 0.618) % 1)); ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 3.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(150,80,200,0.7)'; ctx.fill(); }
      // multi-lobed nucleus
      ctx.fillStyle = 'rgba(90,40,160,0.92)';
      for (const [lx, ly, lr] of [[-30, -25, 46], [25, -30, 40], [35, 20, 42], [-20, 30, 44], [0, 0, 38]]) { ctx.beginPath(); ctx.arc(lx * R / 150, ly * R / 150, lr * R / 150, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    // platelets breaking off and drifting right (kf = fragments progress)
    for (let i = 0; i < 9; i++) {
      const q = clamp(kf * 1.4 - i * 0.05);
      if (q <= 0) continue;
      const a0 = -0.55 + (i % 4) * 0.37;
      const sx0 = ccx + Math.cos(a0) * 300, sy0 = ccy + Math.sin(a0) * 300;
      const x = lerp(sx0, 150 + (i % 3) * 70 + Math.floor(i / 3) * 40, ease.out(q)), y = lerp(sy0, -150 + Math.floor(i / 3) * 80 + (i % 3) * 18, ease.out(q)) + Math.sin(t * 2 + i) * 5;
      ctx.save(); ctx.globalAlpha *= clamp(q * 3);
      ctx.globalCompositeOperation = 'lighter';
      const gg = ctx.createRadialGradient(x, y, 0, x, y, 40); gg.addColorStop(0, `rgba(255,220,150,${0.5 * (1 - q * 0.6)})`); gg.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = gg; ctx.fillRect(x - 40, y - 40, 80, 80); ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp(q * 3);
      w().drawPlatelet(ctx, { x, y, r: 22, rot: i + t * 0.6, variant: i });
      ctx.restore();
    }
    // labels
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const la = clamp(k * 3);
    if (la > 0) {
      ctx.globalAlpha *= 1; ctx.save(); ctx.globalAlpha *= la;
      ctx.font = '32px ZenKaku, IPAGothic, sans-serif'; ctx.fillStyle = '#ffffff';
      ctx.fillText('巨核球（骨髄）', -pw / 2 + 40, ph / 2 - 46); ctx.restore();
    }
    const lb = clamp(kf * 2.5);
    if (lb > 0) {
      ctx.save(); ctx.globalAlpha *= lb;
      ctx.font = '32px ZenKaku, IPAGothic, sans-serif'; ctx.fillStyle = '#ffe7b8';
      ctx.fillText('血小板', 150, ph / 2 - 120);
      ctx.font = '24px ZenKaku, IPAGothic, sans-serif'; ctx.fillStyle = '#e8fbff';
      ctx.fillText('細胞質の小さな破片', 150, ph / 2 - 80);
      ctx.fillText('核をもたない', 150, ph / 2 - 46);
      ctx.restore();
    }
    ctx.restore();
    // outer glow frame
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(${HOLO},0.25)`; ctx.lineWidth = 14; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2 * lerp(0.05, 1, open), pw, ph * lerp(0.05, 1, open), 26); ctx.stroke();
    ctx.restore();
  }

  BS.ep01.platelet = function (ctx, t, E, S) {
    const b = S.beats;
    const p = clotP(t, b, S);
    const cut1 = b.bleeding + 1.3;                  // wide tear → Akane reaction
    const cut2 = b.platelets_arrive - 0.25;         // → labelled diagram (粘着・凝集)
    const cut3 = b.plug_sealed + 0.85;              // → hologram: megakaryocyte
    const cut4 = b.fibrinogen_to_fibrin - 0.35;     // → labelled diagram (フィブリン)
    const cut5 = b.mesh_tight + 0.55;               // → plate, relief
    const shots = [
      { // A: the wall tears between Akane and Shirou; camera kicked, then pushes into the wound
        a: S.start, b: cut1, draw(ctx, lt, t) {
          const hit = t > b.wound ? Math.exp(-(t - b.wound) * 4) : 0;
          const [sx, sy] = shake(t, 22 * hit + 2);
          const zoom = keys(t, [[S.start, 1.0], [b.wound, 1.02], [cut1, 1.22]], ease.inOut);
          camera(ctx, { x: 960, y: lerp(560, 640, prog(t, b.wound, cut1)), zoom, sx, sy }, () => {
            clotPlate(ctx, t, p, { b, spose: t > b.wound + 0.15 ? 'ready' : 'stand', sexpr: t > b.wound + 0.1 ? 'alert' : 'calm',
              apose: t > b.wound + 0.15 ? 'reach' : 'stand', aexpr: t > b.wound + 0.1 ? 'surprised' : 'calm', ax: 1380, sx: 540 });
          });
          lighten(ctx, '#ffd0c0', hit * 0.55);
          if (t > b.wound) w().drawGrade(ctx, { color: '#ff1a2a', amount: 0.18 * clamp(1 - (t - b.wound) / 3), mode: 'soft-light' });
          w().drawVignette(ctx, { strength: 0.55 });
        },
      },
      { // B: Akane close-up, worried, looks down at the bleeding; leaking RBCs drift past
        a: cut1, b: cut2, tin: { type: 'whip', dur: 0.22, dir: 1 }, draw(ctx, lt, t) {
          const o = { x: 1020, y: 1060, scale: 3.1, yaw: -36, pose: 'stand', expr: 'worried', blink: c().blinkAt(t, 23), t, rim: RIM, look: { x: -0.3, y: 0.55 } };
          const a = c().headAnchor('akane', o);
          blurred(ctx, 7, (g) => { g.save(); g.translate(960, 540); g.scale(2.2, 2.2); g.translate(-960, -700); D().woundAndClot(g, { p, t, labels: false }); g.restore(); });
          camera(ctx, { x: a.x - 80, y: a.y + 90, zoom: lerp(1.18, 1.28, prog(t, cut1, cut2)) }, () => c().drawAkane(ctx, o));
          for (let i = 0; i < 4; i++) { const q = ((t * 0.6 + i * 0.27) % 1); w().drawRBC(ctx, { x: lerp(-200, W + 200, q), y: 860 + i * 40, r: 70 + i * 12, tiltX: 0.8, tiltY: t + i, blur: 18, blurAngle: 0, alpha: 0.85 }); }
          w().drawVignette(ctx, { strength: 0.5 });
        },
      },
      { // C: labelled diagram: adhesion → release → aggregation (primary plug)
        a: cut2, b: cut3, tin: { type: 'dissolve', dur: 0.35 }, draw(ctx, lt, t) {
          const zoom = lerp(1.0, 1.08, prog(t, cut2, cut3));
          camera(ctx, { x: 960, y: 540 / zoom + 4, zoom }, () => D().woundAndClot(ctx, { p, t, labels: true }));
          if (t > b.plug_sealed) lighten(ctx, '#ffe0a0', 0.25 * Math.exp(-(t - b.plug_sealed) * 4));
          w().drawVignette(ctx, { strength: 0.4 });
        },
      },
      { // D: Akane projects a hologram: the megakaryocyte shedding platelets; camera pushes into the holo
        a: cut3, b: cut4, tin: { type: 'dissolve', dur: 0.4 }, draw(ctx, lt, t) {
          const push = prog(t, b.megakaryocyte + 0.6, b.fragments + 0.4);
          const zoom = lerp(1.0, 1.35, push);
          const hx = 960, hy = 330;
          const cam = { x: 960, y: Math.max(lerp(560, hy, push), 540 / zoom + 2), zoom };
          const plate = renderTo(5, (g) => camera(g, cam, () => clotPlate(g, t, p, { sx: 390, ax: 1520, cs: 0.8, spose: 'stand', sexpr: 'calm', slook: { x: 0.6, y: -0.6 },
            apose: 'present', aexpr: t < b.fragments ? 'calm' : 'smile', alook: { x: -0.3, y: -0.6 }, holo: 0.9 + 0.1 * Math.sin(t * 6), ayaw: -40 })));
          ctx.save(); ctx.filter = `blur(${lerp(0.5, 5, push).toFixed(1)}px)`; ctx.drawImage(plate, 0, 0); ctx.restore();
          camera(ctx, cam, () => {
            // beam from Akane's wrist to the panel
            const ao = { x: 1520, y: 780, scale: 0.8 * 0.95, yaw: -40, pose: 'present', t };
            const hand = c().handAnchor('akane', ao).holo;
            const kIn = prog(t, b.megakaryocyte - 0.7, b.megakaryocyte);
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const bg = ctx.createLinearGradient(hand.x, hand.y, hx, hy + 200);
            bg.addColorStop(0, `rgba(${HOLO},${0.45 * kIn})`); bg.addColorStop(1, `rgba(${HOLO},0)`);
            ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.lineTo(hx - 300, hy + 230); ctx.lineTo(hx + 300, hy + 230); ctx.closePath(); ctx.fill();
            ctx.restore();
            const k = prog(t, b.megakaryocyte - 0.2, b.fragments - 0.1, ease.inOut);
            const kf = prog(t, b.fragments - 0.15, b.fragments + 2.4, ease.out);
            megaHolo(ctx, hx, hy, 0.95, k, kf, t, kIn);
          });
          if (t > b.fragments) lighten(ctx, '#bff4ff', 0.18 * Math.exp(-(t - b.fragments) * 5));
          w().drawVignette(ctx, { strength: 0.5 });
        },
      },
      { // E: labelled diagram: fibrinogen → fibrin mesh traps the cells (stable clot)
        a: cut4, b: cut5, tin: { type: 'whip', dur: 0.28, dir: -1 }, draw(ctx, lt, t) {
          const zoom = keys(t, [[cut4, 1.1], [b.mesh_weave, 1.04], [cut5, 1.0]], ease.inOut);
          const tight = t > b.mesh_tight ? Math.exp(-(t - b.mesh_tight) * 5) : 0;
          const [sx, sy] = shake(t, 5 * tight);
          camera(ctx, { x: lerp(1000, 960, prog(t, cut4, cut5)), y: 540 / zoom + 4, zoom, sx, sy }, () => D().woundAndClot(ctx, { p, t, labels: true }));
          lighten(ctx, '#fff0c8', 0.22 * tight);
          w().drawVignette(ctx, { strength: 0.4 });
        },
      },
      { // F: plate: bleeding stopped, Akane relieved, Shirou nods. Slow pull back (leads into the epilogue)
        a: cut5, b: S.end + 1, tin: { type: 'dissolve', dur: 0.4 }, draw(ctx, lt, t) {
          const zoom = lerp(1.25, 1.08, prog(t, cut5, S.end + 0.5, ease.out));
          camera(ctx, { x: 960, y: 610, zoom }, () => {
            clotPlate(ctx, t, p, { sx: 610, ax: 1310, cs: 0.74, spose: 'stand', sexpr: 'calm', slook: { x: 0.5, y: 0.4 },
              apose: 'relieved', aexpr: 'relieved', alook: { x: -0.4, y: 0.4 } });
          });
          w().drawLightRays(ctx, { x: W * 0.5, y: -80, angle: Math.PI / 2, spread: 0.6, count: 5, t, alpha: 0.12 });
          w().drawVignette(ctx, { strength: 0.5 });
        },
      },
    ];
    playShots(ctx, t, shots, E);
  };

  /* =====================================================================================
   * epilogue (#34–36)
   * ===================================================================================== */
  function calmSide(ctx, t, scrollX, chars, speed = 140) {
    const L = w().drawVesselSide(ctx, { t, scrollX, layers: 'back', scrollSpeed: speed, pulse: w().heartbeat(t) * 0.5 });
    chars(L.groundY || 891);
    w().drawFlowCells(ctx, { t, scrollX, layer: 'front', scrollSpeed: speed });
    return L;
  }

  BS.ep01.epilogue = function (ctx, t, E, S) {
    const b = S.beats;
    const la = E.line('E01-34'), ls = E.line('E01-35'), ln = E.line('E01-36');
    const stopT = (la ? la.start : b.pass_each_other + 0.6) + 1.9;     // they stop facing each other
    const cA = la ? la.start + 1.45 : b.pass_each_other + 2;          // → Akane close-up
    const cS = (ls ? ls.start : b.shirou_reply) - 0.2;                 // → Shirou close-up
    const cP = b.part_ways - 0.2;                                      // → parting (back views)
    const cB = b.camera_pull_back - 0.25;                              // → body pull-back
    const scroll = (t) => (t - S.start) * 60;
    const shots = [
      { // 1: calm side vessel: Shirou (left) and Akane (right) walk toward each other and stop
        a: S.start - 1, b: cA, draw(ctx, lt, t) {
          const k = prog(t, S.start - 0.5, stopT, ease.out);
          const walking = t < stopT - 0.15;
          const zoom = lerp(1.0, 1.12, prog(t, S.start, cA));
          camera(ctx, { x: 960, y: lerp(560, 600, prog(t, S.start, cA)), zoom }, () => {
            calmSide(ctx, t, scroll(t), (gy) => {
              c().drawShirou(ctx, { x: lerp(330, 760, k), y: gy, scale: 0.95, yaw: walking ? 70 : 45, pose: walking ? 'walk' : 'stand', walkPhase: walkPh(t, b.pass_each_other - 0.43),
                expr: 'calm', blink: c().blinkAt(t, 31), t, rim: RIM_W, speed: walking ? 0.5 : 0, mouth: E.mouth('シロウ', t) });
              c().drawAkane(ctx, { x: lerp(1620, 1180, k), y: gy, scale: 0.9, yaw: walking ? -70 : -42, pose: walking ? 'walk' : 'stand', walkPhase: walkPh(t, b.pass_each_other + 0.07),
                expr: 'smile', blink: c().blinkAt(t, 32), t, rim: RIM, speed: walking ? 0.5 : 0, mouth: E.mouth('アカネ', t) });
            });
          });
          w().drawLightRays(ctx, { x: W * 0.55, y: -60, angle: Math.PI * 0.52, spread: 0.8, count: 6, t, alpha: 0.13, seed: 9 });
          w().drawParticles(ctx, { t, seed: 41, count: 50, vx: -20, vy: -6, alpha: 0.35 });
          w().drawVignette(ctx, { strength: 0.45 });
        },
      },
      { // 2: Akane close-up: 「みんな、それぞれの仕事で体を守ってるんだね。」
        a: cA, b: cS, tin: { type: 'dissolve', dur: 0.3 }, draw(ctx, lt, t) {
          const o = { x: 1080, y: 1060, scale: 3.2, yaw: -34, pose: 'stand', expr: 'smile', mouth: E.mouth('アカネ', t), blink: c().blinkAt(t, 33), t, rim: RIM, look: { x: -0.35, y: -0.05 } };
          const a = c().headAnchor('akane', o);
          blurred(ctx, 8, (g) => calmSide(g, t, scroll(t) + 400, () => {}));
          camera(ctx, { x: a.x - 120 + lerp(0, 30, prog(t, cA, cS)), y: a.y + 110, zoom: lerp(1.16, 1.28, prog(t, cA, cS)) }, () => c().drawAkane(ctx, o));
          w().drawParticles(ctx, { t, seed: 42, count: 36, vx: -30, alpha: 0.45 });
          w().drawVignette(ctx, { strength: 0.42 });
        },
      },
      { // 3: Shirou close-up: 「ああ。お前たちが酸素を運ぶから、俺たちも戦える。」 (slight turn, proud smile)
        a: cS, b: cP, tin: { type: 'dissolve', dur: 0.3 }, draw(ctx, lt, t) {
          const turn = prog(t, cS, cS + 0.9);
          const o = { x: 840, y: 1060, scale: 3.2, yaw: lerp(55, 32, turn), pose: 'stand', expr: t < (ls ? ls.start + 0.9 : cS + 1) ? 'calm' : 'proud',
            mouth: E.mouth('シロウ', t), blink: c().blinkAt(t, 34), t, rim: RIM_W, look: { x: 0.35, y: -0.05 } };
          const a = c().headAnchor('shirou', o);
          blurred(ctx, 8, (g) => calmSide(g, t, scroll(t) - 300, () => {}));
          camera(ctx, { x: a.x + 120 - lerp(0, 30, prog(t, cS, cP)), y: a.y + 110, zoom: lerp(1.2, 1.3, prog(t, cS, cP)) }, () => c().drawShirou(ctx, o));
          w().drawParticles(ctx, { t, seed: 43, count: 36, vx: -30, alpha: 0.45 });
          w().drawVignette(ctx, { strength: 0.42 });
        },
      },
      { // 4: they part into the flow: back views, Akane runs off right (O2 in hand), Shirou raises a hand and walks left.
        // 運ぶもの → Akane glows; 守るもの → Shirou glows; ふさぐもの → platelets drift past the lens
        a: cP, b: cB + 0.6, tin: { type: 'dissolve', dur: 0.4 }, draw(ctx, lt, t) {
          const z = 300 + (t - cP) * 2.2;
          const curve = { x: Math.sin(t * 0.3) * 0.2, y: 0.04 };
          w().drawVesselTunnel(ctx, { t, z, curve, pulse: w().heartbeat(t) * 0.4 });
          w().drawRBCField3D(ctx, { t, z, count: 60, vz: 2, curve });
          const q = prog(t, cP + 0.3, cB + 0.6, ease.inOut);
          const gA = Math.exp(-Math.max(0, t - b.carry) * 1.6) * (t > b.carry ? 1 : 0);
          const gS = Math.exp(-Math.max(0, t - b.protect) * 1.6) * (t > b.protect ? 1 : 0);
          const waveS = t < b.part_ways + 1.6;
          // Shirou: back view, raises a hand without turning around, then walks off into the depth on the left
          const ss = lerp(1.25, 0.55, q);
          c().drawShirou(ctx, { x: lerp(560, 760, q), y: lerp(1180, 820, q), scale: ss, yaw: 165, pose: waveS ? 'wave' : 'walk', walkPhase: walkPh(t, cP, 0.9),
            expr: 'proud', t, speed: 0.6, rim: { color: '#bfe6ff', strength: 0.5 + gS * 0.8 } });
          // Akane: turns her head back with a wave, then runs off on the right
          const runA = t > b.part_ways + 0.9;
          const as = lerp(1.2, 0.5, q);
          c().drawAkane(ctx, { x: lerp(1380, 1140, q), y: lerp(1180, 810, q), scale: as, yaw: runA ? -170 : -150, pose: runA ? 'run' : 'wave', runPhase: walkPh(t, cP, 0.42),
            expr: 'smile', t, speed: runA ? 0.9 : 0, holdO2: runA, rim: { color: '#ffb090', strength: 0.5 + gA * 0.8 } });
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const glow = (x, y, r, col, a) => { if (a < 0.01) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); };
          glow(lerp(1380, 1140, q), lerp(1180, 810, q) - 300 * as, 380 * as, '255,150,120', 0.45 * gA);
          glow(lerp(560, 760, q), lerp(1180, 820, q) - 300 * ss, 380 * ss, '170,220,255', 0.45 * gS);
          ctx.restore();
          // ふさぐもの: a little band of platelets tumbles past the camera
          if (t > b.plug_word - 0.4) {
            const k = prog(t, b.plug_word - 0.4, b.plug_word + 1.8, ease.lin);
            for (let i = 0; i < 7; i++) {
              const px = lerp(-150, W + 150, clamp(k * 1.2 - i * 0.04)) , py = 260 + i * 46 + Math.sin(t * 2 + i) * 18;
              ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(px, py, 0, px, py, 70); g.addColorStop(0, 'rgba(255,220,150,0.35)'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.fillRect(px - 70, py - 70, 140, 140); ctx.restore();
              w().drawPlatelet(ctx, { x: px, y: py, r: 26 + (i % 3) * 6, rot: t * 1.5 + i, variant: i, blur: 6, blurAngle: 0 });
            }
          }
          w().drawParticles(ctx, { t, seed: 44, count: 60, alpha: 0.4 });
          w().drawVignette(ctx, { strength: 0.55 });
        },
      },
      { // 5: the camera pulls back out of the artery to the whole body
        a: cB, b: S.end + 2, tin: { type: 'dissolve', dur: 0.55 }, draw(ctx, lt, t) {
          const p = keys(t, [[b.camera_pull_back, 0], [b.whole_body, 1]], ease.lin);
          D().bodyPullback(ctx, { p, t, scale: 0.9, y: H / 2 - 40 });
          w().drawVignette(ctx, { strength: 0.35 });
        },
      },
    ];
    playShots(ctx, t, shots, E);
    void ln;
  };

  /* =====================================================================================
   * next (#37) 次回予告
   * ===================================================================================== */
  BS.ep01.next = function (ctx, t, E, S) {
    const b = S.beats;
    const shots = [
      { // 0: whole body (continues from the epilogue); a red alarm pulse spreads, the light dims (riser)
        a: S.start - 1, b: b.riser + 0.75, draw(ctx, lt, t) {
          const z = 1 + 0.06 * prog(t, S.start, b.riser + 0.75, ease.in);
          ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
          D().bodyPullback(ctx, { p: 1, t, scale: 0.9, y: H / 2 - 40 });
          ctx.restore();
          const k = prog(t, b.riser, b.riser + 0.75, ease.in);
          w().drawGrade(ctx, { color: '#ff1a2a', amount: 0.35 * k, mode: 'soft-light' });
          darken(ctx, 0.35 * k, '30,0,4');
          w().drawVignette(ctx, { strength: 0.4 + 0.4 * k });
        },
      },
      { // 1: dark vessel, bacterium silhouettes surface in the depth (rising tension)
        a: b.riser + 0.75, b: b.telop_in, tin: { type: 'flash', dur: 0.25, color: '#ff4040' }, draw(ctx, lt, t) {
          const k = prog(t, b.riser + 0.75, b.telop_in, ease.in);
          const z = 900 + (t - S.start) * (4 + 10 * k);
          w().drawVesselTunnel(ctx, { t, z, curve: { x: 0.15, y: -0.05 }, pulse: 0.4, tint: '#300008', tintAmount: 0.55 });
          w().drawRBCField3D(ctx, { t, z, count: 50, vz: 6 });
          darken(ctx, 0.45, '20,0,4');
          w().drawPathogenSilhouette(ctx, { x: 960, y: 470, size: lerp(260, 420, k), t, reveal: lerp(0.1, 0.8, k), seed: 3 });
          w().drawPathogenSilhouette(ctx, { x: 560, y: 380, size: lerp(140, 220, k), t: t + 1, reveal: lerp(0, 0.5, k), seed: 5 });
          w().drawPathogenSilhouette(ctx, { x: 1400, y: 400, size: lerp(150, 240, k), t: t + 2, reveal: lerp(0, 0.5, k), seed: 7 });
          w().drawSpeedLines(ctx, { t, intensity: 0.3 + 0.7 * k });
          w().drawVignette(ctx, { strength: 0.7 });
        },
      },
      { // 2: telop. Shirou + squad in battle stance against the silhouettes; impact flash + shake
        a: b.telop_in, b: b.end_card_out, tin: { type: 'flash', dur: 0.3 }, draw(ctx, lt, t) {
          const hit = t >= b.impact ? Math.exp(-(t - b.impact) * 3.5) : 0;
          const [sx, sy] = shake(t, 26 * hit + 2.5);
          const punch = 1 + 0.06 * hit;
          const drift = prog(t, b.telop_in, b.end_card_out, ease.lin);
          camera(ctx, { x: 960 + drift * 30, y: 540, zoom: (1.02 + drift * 0.05) * punch, sx, sy }, () => {
            const z = 1000 + (t - S.start) * 3;
            w().drawVesselTunnel(ctx, { t, z, curve: { x: -0.1, y: -0.05 }, pulse: 0.6, tint: '#400008', tintAmount: 0.45 });
            darken(ctx, 0.35, '25,0,6');
            w().drawPathogenSilhouette(ctx, { x: 420, y: 300, size: 380, t, reveal: 0.9, seed: 3 });
            w().drawPathogenSilhouette(ctx, { x: 1540, y: 280, size: 330, t: t + 1, reveal: 0.9, seed: 5 });
            w().drawLightRays(ctx, { x: W / 2, y: H * 0.35, angle: Math.PI / 2, spread: 2.6, count: 10, t, alpha: 0.18 + 0.3 * hit, color: '255,170,140' });
            for (let i = 0; i < 4; i++) {
              const xi = [600, 760, 1160, 1320][i];
              c().drawWBCAlly(ctx, { x: xi, y: 1000, scale: 0.78, variant: i, yaw: i < 2 ? 25 : -25, pose: 'battle', expr: 'determined', t, rim: { color: '#ff6a50', strength: 0.75 }, tint: { color: '#401020', amount: 0.25 } });
            }
            c().drawShirou(ctx, { x: 960, y: 1080, scale: 1.05, yaw: 8, pose: 'battle', expr: 'determined', blink: c().blinkAt(t, 51), t, rim: { color: '#ff8060', strength: 0.9 } });
          });
          w().drawSpeedLines(ctx, { t, intensity: 0.35 + 0.8 * hit, inner: 0.35 });
          w().drawVignette(ctx, { strength: 0.6 });
          w().drawTelop(ctx, { text: '次回：白血球、防御戦線！', style: 'next', kicker: '次回予告', t: t - b.telop_in, x: W / 2, y: H * 0.45, size: 112 });
          lighten(ctx, '#fff2e8', 0.7 * Math.pow(hit, 1.6) * (t >= b.impact ? 1 : 0));
        },
      },
      { // 3: end card: logo over the gently flowing vessel; fades to black only during the last second
        a: b.end_card_out, b: S.end + 1, tin: { type: 'dissolve', dur: 0.4 }, draw(ctx, lt, t) {
          const z = 1100 + (t - S.start) * 1.2;
          w().drawVesselTunnel(ctx, { t, z, curve: { x: 0, y: 0 }, pulse: w().heartbeat(t) * 0.4 });
          w().drawRBCField3D(ctx, { t, z, count: 40, vz: 1.5 });
          darken(ctx, 0.55, '20,0,4');
          w().drawTitleLogo(ctx, { t: 10, x: W / 2, y: H * 0.4, scale: 0.72 });
          w().drawTelop(ctx, { text: 'つづく', style: 'caption', t: lt, x: W / 2, y: H * 0.66, size: 56 });
          w().drawVignette(ctx, { strength: 0.6 });
        },
      },
    ];
    playShots(ctx, t, shots, E);
    const f = prog(t, b.fade_start, b.end, ease.inOut);
    darken(ctx, f);
  };
})();
