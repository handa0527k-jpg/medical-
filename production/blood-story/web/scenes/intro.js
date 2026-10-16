// BLOOD STORY 第1話 アバン（冒頭30秒）: 16 shots on the measured audio timeline (audio/cues.json).
// Shot functions get (ctx, lt = time in shot, t = film time). Shots are reusable by the full episode
// through BS.shots.intro (episode01.js plays this cut first).
(() => {
  const { W, H, clamp, lerp, ease, prog, keys, shake } = BS.common;
  const w = () => BS.world, c = () => BS.chars;
  const RIM = { color: '#ff7a5c', strength: 0.5, dir: 1 };
  const BEATS = [0.05, 0.92, 1.74, 2.52, 3.24, 3.9, 4.5];
  const beatPulse = (t) => { let p = 0; for (const b of BEATS) if (t >= b) p = Math.max(p, Math.exp(-(t - b) * 7)); return p; };

  // integrate a piecewise-linear speed curve -> distance (pure function of t)
  function travel(t, ks) {
    let z = 0; const dt = 1 / 120;
    for (let s = 0; s < t; s += dt) z += keys(Math.min(s, t), ks, ease.lin) * Math.min(dt, t - s);
    return z;
  }
  const akaneRun = (t) => ((((t - 8.6) / 0.4) % 1) + 1) % 1;
  const shirouRun = (t) => ((((t - 25.6) / 0.36) % 1) + 1) % 1;

  // frame a head close-up: returns camera {x,y,zoom}
  function faceCam(who, o, zoom, dx = 0, dy = 0) {
    const a = c().headAnchor(who, o); return { x: a.x + dx, y: a.y + dy, zoom };
  }

  // ---------- S1 血管突入 0–5 ----------
  function sTunnel(ctx, lt, t) {
    const pulse = Math.max(beatPulse(t), w().heartbeat(t) * 0.4);
    const z = travel(t, [[0, 0.4], [1.4, 2.5], [1.6, 7], [3.2, 9], [3.4, 14], [5, 17]]);
    const curve = { x: Math.sin(t * 0.7) * 0.35, y: Math.cos(t * 0.5) * 0.15 };
    const [sx, sy] = shake(t, 4 + beatPulse(t) * 14 + (t > 3.3 ? 6 : 0));
    ctx.save(); ctx.translate(sx, sy);
    const roll = Math.sin(t * 0.6) * 0.05; ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.scale(1.06, 1.06); ctx.translate(-W / 2, -H / 2);
    w().drawVesselTunnel(ctx, { t, z, curve, pulse });
    w().drawRBCField3D(ctx, { t, z, count: 95, vz: 6 + t * 2, curve, pulse, closePass: 0.16 });
    // hero cells passing close, slowly tumbling so the biconcave dimple reads
    const hero = [[1.7, 3.0, -1, 0.35], [2.9, 4.1, 1, -0.25], [3.9, 5.0, -1, 0.1]];
    for (const [a, b, side, yy] of hero) {
      if (t < a || t > b) continue; const p = (t - a) / (b - a);
      const r = lerp(40, 520, ease.in(p)); const x = W / 2 + side * lerp(80, 1150, ease.in(p)); const y = H / 2 + yy * lerp(60, 700, ease.in(p));
      w().drawRBC(ctx, { x, y, r, tiltX: 0.5 + p * 0.6, tiltY: side * (0.3 + p * 0.5), rot: p * 1.2, blur: p * 26, blurAngle: Math.atan2(y - H / 2, x - W / 2), alpha: clamp(p * 4) });
    }
    w().drawSpeedLines(ctx, { t, intensity: keys(t, [[0, 0], [1.4, 0.15], [1.6, 0.6], [3.3, 0.7], [3.5, 1.1], [5, 1.2]]) });
    w().drawParticles(ctx, { t, seed: 3, count: 70, vx: -10, vy: 0, alpha: 0.45 });
    w().drawVignette(ctx, { strength: 0.7 });
    ctx.restore();
    // opening: dark red -> reveal with the heartbeat
    const dark = 1 - prog(t, 0.3, 1.5, ease.out);
    if (dark > 0) { ctx.fillStyle = `rgba(30,0,4,${dark})`; ctx.fillRect(0, 0, W, H); }
    if (t < 1.2) { ctx.fillStyle = `rgba(160,10,20,${beatPulse(t) * 0.35 * dark})`; ctx.fillRect(0, 0, W, H); }
    if (t > 4.6) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,180,${prog(t, 4.6, 5.0, ease.in) * 0.8})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  // shared: side vessel with characters in between the layers
  function sideScene(ctx, t, scrollX, drawChars, speed = 600) {
    const L = w().drawVesselSide(ctx, { t, scrollX, layers: 'back', scrollSpeed: speed });
    drawChars(L.groundY || 891);
    w().drawFlowCells(ctx, { t, scrollX, layer: 'front', scrollSpeed: speed });
    return L;
  }

  // ---------- S2 アカネ登場 5–12 ----------
  function sPickup(ctx, lt, t) {
    const zoom = lerp(1.05, 1.2, prog(t, 5, 6.4));
    BS.common.camera(ctx, { x: 960, y: 560, zoom }, () => {
      sideScene(ctx, t, (t - 5) * 160, (gy) => {
        const has = t >= 6.0;
        c().drawAkane(ctx, { x: 900, y: gy + 60, scale: 1.4, yaw: 40, pose: has ? 'hold' : 'stand', holdO2: has, expr: has ? 'happy' : 'determined',
          blink: BS.chars.blinkAt(t, 1), t, rim: RIM, look: has ? { x: 0, y: 0.3 } : { x: 0.6, y: -0.5 } });
        if (!has) { // an O2 floating down into her hands
          const p = prog(t, 5.1, 6.0, ease.inOut); const x = lerp(1500, 985, p), y = lerp(260, gy - 330, p) + Math.sin(t * 6) * 8 * (1 - p);
          w().drawO2(ctx, { x, y, size: lerp(80, 56, p), t });
        } else if (t < 6.4) { // pickup sparkle
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; const k = 1 - prog(t, 6.0, 6.4, ease.out);
          const g = ctx.createRadialGradient(965, gy - 300, 0, 965, gy - 300, 260); g.addColorStop(0, `rgba(170,240,255,${0.8 * k})`); g.addColorStop(1, 'rgba(170,240,255,0)');
          ctx.fillStyle = g; ctx.fillRect(600, gy - 600, 800, 600); ctx.restore();
        }
      });
    });
    w().drawVignette(ctx, { strength: 0.5 });
  }

  function sAkaneFace(ctx, lt, t) {
    const o = { x: 960, y: 1000, scale: 3.4, yaw: 28, pose: 'hold', holdO2: true, expr: t < 6.8 ? 'determined' : 'happy',
      mouth: BS.E.mouth('アカネ', t), blink: BS.chars.blinkAt(t, 2), t, rim: RIM, look: { x: -0.25, y: 0 } };
    const cam = faceCam('akane', o, lerp(1.15, 1.25, prog(t, 6.35, 8.55)), 110, 110);
    BS.common.camera(ctx, cam, () => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); w().drawVesselSide(ctx, { t, scrollX: (t - 5) * 160, layers: 'back' }); ctx.restore();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'blur(6px)'; ctx.restore();
      c().drawAkane(ctx, o);
    });
    w().drawParticles(ctx, { t, seed: 9, count: 40, vx: -40, alpha: 0.5 });
    w().drawVignette(ctx, { strength: 0.45 });
  }

  function hbCaption(ctx, t) { // 字幕（学習）: 7.0–11.8
    if (t < 6.9 || t > 11.9) return;
    const a = Math.min(prog(t, 6.9, 7.3), 1 - prog(t, 11.5, 11.9));
    w().drawInfoCard(ctx, { x: 70, y: 60, w: 760, title: '赤血球', lines: ['ヘモグロビンによって酸素を運搬'], t: t - 6.9, alpha: a, size: 40 });
  }

  function sRunSide(ctx, lt, t) {
    const sp = keys(t, [[8.5, 0], [8.75, 1]], ease.out);
    const scroll = travel(t - 8.5, [[0, 200], [0.3, 1100], [3, 1100]]) + (t - 5) * 160;
    const [sx, sy] = shake(t, 3);
    BS.common.camera(ctx, { x: 960 + sx, y: 560 + sy, zoom: 1.05 }, () => {
      sideScene(ctx, t, scroll, (gy) => {
        const x = lerp(760, 980, prog(t, 8.55, 10.5));
        c().drawAkane(ctx, { x, y: gy + 40, scale: 1.3, yaw: 62, pose: sp < 0.5 ? 'hold' : 'run', runPhase: akaneRun(t), holdO2: true, expr: 'determined',
          blink: BS.chars.blinkAt(t, 3), t, rim: RIM, speed: sp });
      }, 1100);
    });
    w().drawSpeedLines(ctx, { t, cx: -400, cy: H / 2, intensity: 0.5 * sp, inner: 0.5 });
    w().drawVignette(ctx, { strength: 0.5 });
    if (t < 8.75) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,190,160,${(1 - prog(t, 8.55, 8.75)) * 0.25})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  // camera swings around to the front: background turns from side scroll into a forward tunnel
  function sRunFront(ctx, lt, t) {
    const yaw = lerp(62, 0, prog(t, 10.4, 11.4));
    const z = travel(t - 10.4, [[0, 5], [1.6, 6]]) + 40;
    const swing = prog(t, 10.4, 11.3);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate((1 - swing) * -0.08); ctx.translate(-W / 2, -H / 2);
    w().drawVesselTunnel(ctx, { t, z, curve: { x: (1 - swing) * 0.9, y: 0 }, pulse: w().heartbeat(t) * 0.5 });
    w().drawRBCField3D(ctx, { t, z, count: 60, vz: 5, curve: { x: (1 - swing) * 0.9, y: 0 } });
    ctx.restore();
    const x = lerp(1240, 960, ease.inOut(swing)), sc = lerp(1.3, 1.6, swing);
    const bob = Math.abs(Math.sin(akaneRun(t) * Math.PI * 2)) * 6;
    c().drawAkane(ctx, { x, y: 1120 - bob, scale: sc, yaw, pose: 'run', runPhase: akaneRun(t), holdO2: true, expr: 'happy',
      blink: BS.chars.blinkAt(t, 4), t, rim: RIM, speed: 1 });
    w().drawSpeedLines(ctx, { t, intensity: 0.55 });
    w().drawVignette(ctx, { strength: 0.55 });
  }

  // ---------- S3 毛細血管 12–20 ----------
  function sCapFront(ctx, lt, t) {
    const narrow = prog(t, 12.0, 13.6, ease.inOut);
    const z = travel(t - 12, [[0, 3.5], [1.6, 1.6], [4, 1.4]]);
    w().drawCapillary(ctx, { t, z, narrow, vz: 2.5 });
    const sq = prog(t, 12.8, 13.6);
    const bob = Math.abs(Math.sin(akaneRun(t) * Math.PI * 2)) * 4;
    const sc = lerp(1.6, 1.35, narrow);
    c().drawAkane(ctx, { x: 960, y: lerp(1130, 1080, narrow) - bob, scale: sc, yaw: 10, pose: 'run', runPhase: akaneRun(t * 0.8), squash: sq * 0.8, holdO2: true,
      expr: t > 13.1 ? 'determined' : 'happy', mouth: BS.E.mouth('アカネ', t), blink: BS.chars.blinkAt(t, 5), t, rim: { color: '#ff9a7a', strength: 0.45 }, speed: 0.8 });
    // the walls press in: dark gradient at the edges grows
    const g = ctx.createRadialGradient(W / 2, H / 2, lerp(900, 380, narrow), W / 2, H / 2, 1150); g.addColorStop(0, 'rgba(40,0,6,0)'); g.addColorStop(1, `rgba(40,0,6,${0.4 + narrow * 0.4})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function sCapSide(ctx, lt, t) {
    const scroll = travel(t - 15.3, [[0, 380], [1.5, 300]]);
    const L = w().drawCapillarySide(ctx, { t, scrollX: scroll + 600, narrow: 0.82, cells: false, scrollSpeed: 380 });
    const gy = L.groundY; const ax = lerp(700, 860, prog(t, 15.3, 17));
    // single file: deformed (parachute-shaped) RBCs ahead of and behind her, moving with the flow
    const midY = (L.top + L.bottom) / 2;
    for (const dx of [-560, 560, 1120]) w().drawRBC(ctx, { x: ax + dx + Math.sin(t * 2 + dx) * 10, y: midY, r: (L.bottom - L.top) * 0.42, tiltY: -Math.PI / 2, deform: 0.75 });
    c().drawAkane(ctx, { x: ax, y: gy, scale: 0.74, yaw: 64, pose: 'run', runPhase: ((t - 15.3) / 0.5) % 1, squash: 0.85, holdO2: true,
      expr: 'determined', mouth: BS.E.mouth('アカネ', t), blink: BS.chars.blinkAt(t, 6), t, rim: { color: '#ffb090', strength: 0.4 }, speed: 0.7 });
    w().drawVignette(ctx, { strength: 0.45 });
  }

  function sDeliver(ctx, lt, t) {
    const scroll = travel(t - 17.0, [[0, 300], [0.5, 0], [3, 0]]) + 600 + 300 * 1.7;
    const glow = prog(t, 17.7, 19.0);
    const L = w().drawCapillarySide(ctx, { t, scrollX: scroll, narrow: 0.82, cells: false, glow, glowX: 1180, scrollSpeed: 100 });
    const gy = L.groundY; const ax = 860;
    const released = t >= 17.65;
    const pose = t < 19.3 ? (released ? 'stand' : 'hold') : 'relieved';
    c().drawAkane(ctx, { x: ax, y: gy, scale: 0.74, yaw: 50, pose, holdO2: !released, squash: 0.6, expr: t < 19.3 ? 'happy' : 'relieved',
      mouth: BS.E.mouth('アカネ', t), blink: BS.chars.blinkAt(t, 7), t, rim: { color: '#ffb090', strength: 0.4 } });
    // O2 released -> diffuses through the thin wall into the tissue cell (schematic)
    const target = (L.tissue || []).filter((q) => !q.above).sort((a, b) => Math.abs(a.x - 1180) - Math.abs(b.x - 1180))[0] || { x: 1180, y: gy + 200 };
    if (t >= 17.6 && t < 19.4) w().drawO2Transfer(ctx, { from: { x: ax + 40, y: gy - 230 }, to: { x: target.x, y: target.y }, p: prog(t, 17.6, 19.2, ease.inOut), t });
    if (t > 17.4) {
      const a = Math.min(prog(t, 17.4, 17.8), 1 - prog(t, 19.75, 20.0));
      w().drawInfoCard(ctx, { x: 1060, y: 50, w: 800, title: '赤血球の主な役割：酸素の運搬', lines: ['直径：約7.5 μm', '形態：両凹円盤状', '成熟赤血球：核を持たない'], t: t - 17.4, alpha: a, size: 40 });
    }
    w().drawVignette(ctx, { strength: 0.4 });
  }

  // ---------- S4 異変 20–24 ----------
  const alarmOn = (t) => t >= 20.3;
  function alarmFx(ctx, t, k = 1, label = true) {
    if (!alarmOn(t)) return;
    w().drawGrade(ctx, { color: '#ff1a2a', amount: 0.2 * k, mode: 'soft-light' });
    w().drawAlarm(ctx, { t: t - 20.3, intensity: k, label: label ? '警報' : null, sub: '異物侵入' });
  }
  function sRelief(ctx, lt, t) {
    const o = { x: 960, y: 1180, scale: 2.2, yaw: 30, pose: t < 20.4 ? 'relieved' : 'turn', turnAmt: prog(t, 20.4, 20.6), expr: t < 20.38 ? 'relieved' : 'surprised',
      blink: t < 20.3 ? 0.9 : 0, t, rim: RIM, tint: alarmOn(t) ? { color: '#ff2030', amount: 0.2 } : undefined, squash: 0.3 };
    const [sx, sy] = shake(t, alarmOn(t) ? 10 : 0);
    BS.common.camera(ctx, { ...faceCam('akane', o, 0.95, 60, 220), sx, sy }, () => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); w().drawCapillarySide(ctx, { t, scrollX: 1110, narrow: 0.82, cells: false, glow: 0.6, glowX: 1180 }); ctx.restore();
      c().drawAkane(ctx, o);
    });
    alarmFx(ctx, t, prog(t, 20.3, 20.45));
  }
  function sThreatWide(ctx, lt, t) {
    const z = 200 + (t - 20.6) * 2;
    w().drawVesselTunnel(ctx, { t, z, curve: { x: 0.2, y: -0.1 }, pulse: 0.3, tint: '#300008', tintAmount: 0.5 });
    w().drawRBCField3D(ctx, { t, z, count: 50, vz: 2 });
    const zoom = lerp(1, 1.35, prog(t, 20.6, 21.0, ease.out));
    BS.common.camera(ctx, { x: 960, y: 520, zoom }, () => w().drawPathogenSilhouette(ctx, { x: 960, y: 500, size: 240, t, reveal: 0.25 }));
    alarmFx(ctx, t);
  }
  function sAkaneShock(ctx, lt, t) {
    const o = { x: 960, y: 1000, scale: 3.3, yaw: -24, pose: 'stand', expr: 'surprised', mouth: BS.E.mouth('アカネ', t), blink: BS.chars.blinkAt(t, 8) * 0.5, t,
      rim: { color: '#ff3040', strength: 0.7 }, tint: { color: '#ff2030', amount: 0.12 }, look: { x: 0.5, y: 0 } };
    const [sx, sy] = shake(t, 6);
    BS.common.camera(ctx, { ...faceCam('akane', o, lerp(0.92, 1.0, prog(t, 21, 22.3)), -60, 140), sx, sy }, () => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); w().drawVesselSide(ctx, { t, scrollX: 3000, layers: 'back' }); ctx.restore();
      c().drawAkane(ctx, o);
    });
    alarmFx(ctx, t, 1, false);
  }
  function sShirouAlert(ctx, lt, t) {
    const turned = prog(t, 22.3, 22.6, ease.out);
    const o = { x: 980, y: 1060, scale: 1.45, yaw: lerp(-60, 25, turned), pose: t < 22.65 ? 'turn' : 'ready', turnAmt: turned, expr: t < 22.6 ? 'alert' : 'serious',
      mouth: BS.E.mouth('シロウ', t), blink: BS.chars.blinkAt(t, 11), t, rim: { color: '#ff4050', strength: 0.55 }, tint: { color: '#ff2030', amount: 0.12 } };
    BS.common.camera(ctx, { x: 960, y: 560, zoom: lerp(1.0, 1.12, prog(t, 22.3, 23.55)) }, () => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      w().drawVesselSide(ctx, { t, scrollX: 5200 + (t - 22.3) * 60, layers: 'back' });
      ctx.restore();
      for (let i = 0; i < 2; i++) c().drawWBCAlly(ctx, { x: 520 + i * 900, y: 1000, scale: 0.9, variant: i + 1, yaw: i ? -30 : 30, pose: 'ready', expr: 'alert', t, blink: BS.chars.blinkAt(t, 20 + i), alpha: 0.85 });
      c().drawShirou(ctx, o);
    });
    alarmFx(ctx, t, 0.75, false);
  }
  function sThreatClose(ctx, lt, t) {
    const z = 260 + (t - 23.55) * 3;
    w().drawVesselTunnel(ctx, { t, z, curve: { x: -0.2, y: 0.1 }, pulse: 0.2, tint: '#200006', tintAmount: 0.65 });
    const [sx, sy] = shake(t, 8);
    BS.common.camera(ctx, { x: 960, y: 540, zoom: lerp(1.0, 1.25, prog(t, 23.55, 24.0)), sx, sy }, () =>
      w().drawPathogenSilhouette(ctx, { x: 1060, y: 560, size: 760, t, reveal: 0.5, rot: -0.1 }));
    alarmFx(ctx, t, 1, false);
  }

  // ---------- S5 出動 24–30 ----------
  function sShirouFace(ctx, lt, t) {
    const o = { x: 960, y: 1060, scale: 3.3, yaw: 22, pose: 'ready', expr: t < 25.0 ? 'serious' : 'shout', mouth: BS.E.mouth('シロウ', t), blink: BS.chars.blinkAt(t, 12), t,
      rim: { color: '#ff5060', strength: 0.6 }, look: { x: 0.3, y: 0 } };
    BS.common.camera(ctx, faceCam('shirou', o, lerp(1.45, 1.6, prog(t, 24, 25.5)), 90, 110), () => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); w().drawVesselSide(ctx, { t, scrollX: 5300, layers: 'back' }); w().drawGrade(ctx, { color: '#ff1a2a', amount: 0.18 }); ctx.restore();
      c().drawShirou(ctx, o);
    });
    w().drawLightRays(ctx, { x: 1700, y: -80, angle: 2.2, t, alpha: 0.18 });
    w().drawVignette(ctx, { strength: 0.5 });
  }

  function sSquadSide(ctx, lt, t) {
    const sp = prog(t, 25.45, 25.7);
    const scroll = travel(t - 25.5, [[0, 300], [0.3, 1250], [3, 1250]]) + 5300;
    const [sx, sy] = shake(t, 4);
    BS.common.camera(ctx, { x: 960 + sx, y: 560 + sy, zoom: 1.0 }, () => {
      sideScene(ctx, t, scroll, (gy) => {
        // Akane watching from far back (she scrolls away)
        const ax = 560 - (scroll - 5300) * 0.3;
        if (ax > -200) c().drawAkane(ctx, { x: ax, y: gy - 120, scale: 0.42, yaw: 40, pose: 'stand', expr: 'surprised', t, blink: BS.chars.blinkAt(t, 9), alpha: 0.9 });
        // squad gathers behind Shirou
        const join = prog(t, 25.6, 27.2, ease.out);
        for (let i = 3; i >= 0; i--) {
          const off = [-430, -300, -560, -170][i] - (1 - join) * 700;
          c().drawWBCAlly(ctx, { x: 1000 + off, y: gy - 40 - i * 12, scale: 0.78, variant: i, yaw: 68, pose: 'run', runPhase: (shirouRun(t) + 0.23 * (i + 1)) % 1, expr: 'determined', t, speed: 1, rim: RIM });
        }
        c().drawShirou(ctx, { x: lerp(980, 1080, prog(t, 25.5, 27.6)), y: gy, scale: 1.0, yaw: 66, pose: sp < 0.5 ? 'ready' : 'run', runPhase: shirouRun(t), expr: 'serious',
          mouth: BS.E.mouth('シロウ', t), blink: BS.chars.blinkAt(t, 13), t, rim: RIM, speed: sp });
      }, 1250);
    });
    w().drawSpeedLines(ctx, { t, cx: -500, cy: H / 2, intensity: 0.6 * sp, inner: 0.5 });
    w().drawVignette(ctx, { strength: 0.5 });
  }

  function sSquadFront(ctx, lt, t) {
    const swing = prog(t, 27.6, 28.6);
    const z = travel(t - 27.6, [[0, 7], [2.4, 9]]) + 300;
    const curve = { x: (1 - swing) * -0.9, y: 0 };
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate((1 - swing) * 0.07); ctx.translate(-W / 2, -H / 2);
    w().drawVesselTunnel(ctx, { t, z, curve, pulse: w().heartbeat(t) * 0.6 });
    w().drawRBCField3D(ctx, { t, z, count: 70, vz: 8, curve });
    ctx.restore();
    const yaw = lerp(66, 4, ease.inOut(swing));
    const px = lerp(700, 960, ease.inOut(swing));
    const allies = [[-330, -60, 0.62, 2], [330, -60, 0.62, 0], [-560, -110, 0.5, 1], [560, -110, 0.5, 3]];
    for (const [dx, dy, s, v] of allies) {
      const k = lerp(0.3, 1, swing);
      c().drawWBCAlly(ctx, { x: px + dx * k - (1 - swing) * 250, y: 1000 + dy, scale: s * lerp(0.9, 1, swing), variant: v, yaw, pose: 'run', runPhase: (shirouRun(t) + v * 0.27) % 1, expr: 'determined', t, speed: 1, rim: RIM });
    }
    const bob = Math.abs(Math.sin(shirouRun(t) * Math.PI * 2)) * 8;
    c().drawShirou(ctx, { x: px, y: 1075 - bob, scale: lerp(1.0, 1.28, swing), yaw, pose: 'run', runPhase: shirouRun(t), expr: t > 29.4 ? 'shout' : 'serious', t, speed: 1, rim: RIM,
      blink: BS.chars.blinkAt(t, 14) });
    w().drawSpeedLines(ctx, { t, intensity: lerp(0.4, 1.0, prog(t, 28.5, 29.6)) });
    w().drawVignette(ctx, { strength: 0.5 });
    if (t >= 28.95 && !BS.episodeMode) w().drawTelop(ctx, { text: '次回：白血球、防御戦線！', style: 'next', kicker: '次回予告', t: t - 28.95, y: H * 0.2, size: 104 });
    if (t >= 29.5) { // impact: flash + shake, no fade to black
      const k = 1 - prog(t, 29.5, 29.85, ease.out);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,230,210,${0.55 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }

  const shots = [
    { a: 0, b: 5.0, draw: sTunnel },
    { a: 5.0, b: 6.35, draw: sPickup, tin: { type: 'flash', dur: 0.35 } },
    { a: 6.35, b: 8.55, draw: sAkaneFace },
    { a: 8.55, b: 10.4, draw: sRunSide, tin: { type: 'whip', dur: 0.18, dir: 1 } },
    { a: 10.4, b: 12.0, draw: sRunFront, tin: { type: 'dissolve', dur: 0.3 } },
    { a: 12.0, b: 15.3, draw: sCapFront, tin: { type: 'dissolve', dur: 0.4 } },
    { a: 15.3, b: 17.0, draw: sCapSide, tin: { type: 'dissolve', dur: 0.25 } },
    { a: 17.0, b: 20.0, draw: sDeliver },
    { a: 20.0, b: 20.6, draw: sRelief, tin: { type: 'dissolve', dur: 0.2 } },
    { a: 20.6, b: 21.0, draw: sThreatWide, tin: { type: 'whip', dur: 0.14, dir: -1 } },
    { a: 21.0, b: 22.3, draw: sAkaneShock },
    { a: 22.3, b: 23.55, draw: sShirouAlert, tin: { type: 'whip', dur: 0.16, dir: 1 } },
    { a: 23.55, b: 24.0, draw: sThreatClose },
    { a: 24.0, b: 25.5, draw: sShirouFace, tin: { type: 'flash', dur: 0.2, color: '#ffd0c0' } },
    { a: 25.5, b: 27.6, draw: sSquadSide },
    { a: 27.6, b: 30.01, draw: sSquadFront, tin: { type: 'dissolve', dur: 0.3 } },
  ];

  BS.shots = BS.shots || {};
  BS.shots.intro = shots;
  BS.cuts.intro = {
    duration: 30,
    prepare(E) { BS.E = E; },
    caption: (ctx, t) => hbCaption(ctx, t),
    render(ctx, t, E) {
      BS.E = E;
      BS.common.playShots(ctx, t, shots, E);
      hbCaption(ctx, t);
    },
  };
})();
