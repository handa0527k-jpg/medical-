// BLOOD STORY 第1話 — scene `battle` (#25–31): alarm → Shirou's squad charges → five WBC types / neutrophil HUD →
// growl → grab「逃がすか……！」→ engulf → cut-away phagocytosis → 「異物は、ひとつも通さない。」→ four allies pose.
// Registers BS.ep01.battle(ctx, t, E, S). t = film time (s). Every time comes from S.beats / E.line() / cues.steps.
(() => {
  const { W, H, clamp, lerp, ease, prog, keys, shake } = BS.common;
  const w = () => BS.world, c = () => BS.chars, d = () => BS.diag;
  BS.ep01 = BS.ep01 || {};

  const mod1 = (x) => ((x % 1) + 1) % 1;
  const RIM = { color: '#ff5a4a', strength: 0.6 };
  const ALLY_COL = ['#ff8070', '#9654eb', '#34c4c8', '#60b8ff'];
  const ALLY_EXPR = ['happy', 'proud', 'smile', 'determined'];
  const SH = 'シロウ';

  // per-frame context (set in BS.ep01.battle)
  let B, E, S, L25, L28, L30;

  // ---------------------------------------------------------------- helpers
  // run cycle synced to the squad footsteps in cues.steps (contact at 0 and 0.5)
  function runPh(t, off = 0) {
    const st = E.cues.steps && E.cues.steps.squad;
    const t0 = st && st.length ? st[0] : B.squad_run;
    const per = st && st.length > 1 ? 2 * (st[1] - st[0]) : 0.36;
    return mod1((t - t0) / per + off);
  }
  const bob = (ph, a) => Math.abs(Math.sin(ph * Math.PI * 2)) * a;
  // red alarm grade: full until Shirou's victory line, relaxes to 0 by the allies
  const redK = (t) => 1 - prog(t, L30.start - 0.3, B.allies_enter + 0.4, ease.inOut);
  function alarmFx(ctx, t, k = 1, label = false) {
    const r = redK(t) * k;
    if (r <= 0.002) return;
    w().drawGrade(ctx, { color: '#ff1a2a', amount: 0.22 * r, mode: 'soft-light' });
    w().drawAlarm(ctx, { t: t - B.alarm, intensity: (label ? 1 : 0.42) * r, label: label ? '警報' : null, sub: '異物侵入', stripes: label });
  }
  const tintK = (t, a = 0.14) => { const r = redK(t); return r > 0.01 ? { color: '#ff2030', amount: +(a * r).toFixed(2) } : undefined; };
  function sideScene(ctx, t, scrollX, drawChars, speed = 1250, front = true) {
    const L = w().drawVesselSide(ctx, { t, scrollX, layers: 'back', scrollSpeed: speed });
    drawChars(L.groundY || 891);
    if (front) w().drawFlowCells(ctx, { t, scrollX, layer: 'front', scrollSpeed: speed });
    return L;
  }
  function flashOver(ctx, k, col = '255,235,220') {
    if (k <= 0.003) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${col},${clamp(k)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  const impact = (t, at, dur = 0.35) => (t < at ? 0 : Math.exp(-(t - at) / dur * 3));
  function dutch(ctx, rot, fn) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(1 + Math.abs(rot) * 1.2, 1 + Math.abs(rot) * 1.2); ctx.translate(-W / 2, -H / 2); fn(); ctx.restore(); }
  function darken(ctx, a) { if (a > 0) { ctx.fillStyle = `rgba(14,0,6,${a})`; ctx.fillRect(0, 0, W, H); } }

  // the squad seen from the front (low angle), Shirou leading
  function squadFront(ctx, t, o) {
    const ph = runPh(t), sc = o.scale || 1.25, cx = o.x || 960, gy = o.y || 1100, run = o.run !== false;
    const allies = [[-560, -150, 0.42, 1], [560, -150, 0.42, 3], [-330, -80, 0.55, 2], [330, -80, 0.55, 0]];
    for (const [dx, dy, s, v] of allies) {
      const p2 = mod1(ph + 0.25 + v * 0.27);
      c().drawWBCAlly(ctx, { x: cx + dx * sc / 1.25, y: gy + dy * sc / 1.25 - bob(p2, 6), scale: s * sc, variant: v, yaw: o.yaw || 4, pose: run ? 'run' : 'ready', runPhase: p2,
        expr: 'determined', t, speed: 1, rim: RIM, tint: tintK(t, 0.1), blink: c().blinkAt(t, 30 + v) });
    }
    c().drawShirou(ctx, { x: cx, y: gy + 10 - bob(ph, 9), scale: sc, yaw: o.yaw || 4, pose: run ? 'run' : 'ready', runPhase: ph, expr: o.expr || 'serious', mouth: E.mouth(SH, t),
      t, speed: 1, rim: RIM, tint: tintK(t, 0.1), blink: c().blinkAt(t, 41) });
  }

  // tactical HUD plate behind an overlay (screen space)
  function hudPlate(ctx, x, y, wd, ht, a, t, label, col = [214, 180, 255], open = 1) {
    if (a <= 0.003) return;
    const h2 = ht * ease.out(clamp(open));
    ctx.save(); ctx.globalAlpha = a;
    const x0 = x - wd / 2, y0 = y - h2 / 2;
    ctx.beginPath(); ctx.roundRect(x0, y0, wd, h2, 22);
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h2); g.addColorStop(0, 'rgba(26,6,30,0.82)'); g.addColorStop(1, 'rgba(10,2,14,0.88)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = `rgba(${col.join(',')},0.35)`; ctx.lineWidth = 2; ctx.stroke();
    // grid + scan line
    ctx.save(); ctx.clip();
    ctx.strokeStyle = `rgba(${col.join(',')},0.06)`; ctx.lineWidth = 1; ctx.beginPath();
    for (let gx = x0 + ((t * 20) % 60); gx < x0 + wd; gx += 60) { ctx.moveTo(gx, y0); ctx.lineTo(gx, y0 + h2); }
    for (let gy = y0; gy < y0 + h2; gy += 60) { ctx.moveTo(x0, gy); ctx.lineTo(x0 + wd, gy); }
    ctx.stroke();
    const sy = y0 + mod1(t * 0.35) * h2; const sg = ctx.createLinearGradient(0, sy - 60, 0, sy);
    sg.addColorStop(0, `rgba(${col.join(',')},0)`); sg.addColorStop(1, `rgba(${col.join(',')},0.12)`); ctx.fillStyle = sg; ctx.fillRect(x0, sy - 60, wd, 60);
    ctx.restore();
    // corner brackets
    ctx.strokeStyle = `rgba(${col.join(',')},0.95)`; ctx.lineWidth = 4; ctx.shadowColor = `rgba(${col.join(',')},0.9)`; ctx.shadowBlur = 12;
    const L = 46;
    for (const [cx, cy, sx, sy2] of [[x0, y0, 1, 1], [x0 + wd, y0, -1, 1], [x0, y0 + h2, 1, -1], [x0 + wd, y0 + h2, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy2 * L); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    if (label && open > 0.6) {
      ctx.font = '22px ZenKaku, IPAGothic, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = `rgba(${col.join(',')},0.85)`; ctx.fillText(label, x0 + 60, y0 + 2);
      const blink = Math.sin(t * 8) > 0 ? 1 : 0.3; ctx.fillStyle = `rgba(255,80,80,${blink})`; ctx.beginPath(); ctx.arc(x0 + 40, y0 + 2, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // simple antibody (Y) glyph
  function antibody(ctx, x, y, s, rot, a, col = '150,215,255') {
    if (a <= 0.003) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a; ctx.lineCap = 'round';
    ctx.shadowColor = `rgba(${col},1)`; ctx.shadowBlur = s * 0.6;
    ctx.strokeStyle = `rgba(${col},1)`; ctx.lineWidth = s * 0.22;
    ctx.beginPath(); ctx.moveTo(0, s * 0.7); ctx.lineTo(0, 0); ctx.lineTo(-s * 0.55, -s * 0.6); ctx.moveTo(0, 0); ctx.lineTo(s * 0.55, -s * 0.6); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = s * 0.08; ctx.stroke();
    ctx.restore();
  }

  // ================================================================ SHOTS
  // 1. alarm → squad bursts toward the camera (low angle)
  function sAlarmCharge(ctx, lt, t) {
    const z = 120 + (t - S.start) * 6;
    const [sx, sy] = shake(t, 7);
    BS.common.camera(ctx, { x: 960, y: 560, zoom: lerp(1.0, 1.08, prog(t, S.start, B.bacteria_reveal)), sx, sy, rot: -0.03 }, () => {
      w().drawVesselTunnel(ctx, { t, z, curve: { x: 0.15, y: -0.05 }, pulse: w().heartbeat(t) * 0.5, tint: '#300008', tintAmount: 0.5 });
      w().drawRBCField3D(ctx, { t, z, count: 50, vz: 7 });
      squadFront(ctx, t, { scale: lerp(1.6, 1.85, prog(t, B.squad_run, B.bacteria_reveal)), y: 1340, run: t >= B.squad_run, expr: 'alert' });
    });
    w().drawSpeedLines(ctx, { t, intensity: 0.6 * prog(t, B.squad_run, B.squad_run + 0.2), color: '255,190,180' });
    alarmFx(ctx, t, 1, true);
  }

  // 2. the bacteria revealed in full (low angle, zoom punch)
  function sReveal(ctx, lt, t) {
    const z = 300 + (t - S.start) * 2;
    const k = prog(t, B.bacteria_reveal, B.bacteria_reveal + 0.5, ease.expoOut);
    const [sx, sy] = shake(t, 4 + 12 * impact(t, B.bacteria_reveal, 0.5));
    w().drawVesselTunnel(ctx, { t, z, curve: { x: -0.2, y: 0.1 }, pulse: 0.3, tint: '#200006', tintAmount: 0.65 });
    BS.common.camera(ctx, { x: 960, y: 520, zoom: lerp(1.35, 1.08, k), sx, sy, rot: 0.04 }, () => {
      d().bacterium(ctx, { x: 380, y: 330, size: 180, t: t + 1, kind: 'cocci', seed: 3, alpha: 0.85 });
      d().bacterium(ctx, { x: 1570, y: 300, size: 230, t: t + 2, seed: 2, flip: true, rot: 0.2, alpha: 0.9 });
      d().bacterium(ctx, { x: 980, y: 540, size: 560, t, seed: 1, flip: true, rot: -0.06 });
    });
    w().drawSpeedLines(ctx, { t, cx: 980, cy: 540, intensity: 0.7 * (1 - k * 0.5), color: '255,90,80', inner: 0.35 });
    alarmFx(ctx, t, 0.8);
    flashOver(ctx, 0.6 * impact(t, B.bacteria_reveal, 0.25), '255,120,100');
  }

  // 3. Shirou shouts while running at the camera (close-up, lip-sync)
  function sShout(ctx, lt, t) {
    const ph = runPh(t);
    const o = { x: 960, y: 1180 - bob(ph, 16), scale: 2.7, yaw: 8, pose: 'run', runPhase: ph, expr: 'shout', mouth: E.mouth(SH, t), blink: 0, t, speed: 1,
      rim: { color: '#ff5060', strength: 0.75 }, tint: tintK(t, 0.08), look: { x: 0, y: 0 } };
    const a = c().headAnchor('shirou', o);
    const z = 400 + (t - S.start) * 9;
    const [sx, sy] = shake(t, 5);
    dutch(ctx, lerp(-0.07, -0.04, prog(t, B.shirou_shout, L25.end)), () => {
      w().drawVesselTunnel(ctx, { t, z, curve: { x: 0.1, y: 0 }, pulse: 0.4, tint: '#300008', tintAmount: 0.45 });
      w().drawRBCField3D(ctx, { t, z, count: 50, vz: 9, closePass: 0.2 });
      BS.common.camera(ctx, { x: a.x, y: a.y + 170, zoom: lerp(1.0, 1.12, prog(t, B.shirou_shout - 0.15, L25.end + 0.15)), sx, sy }, () => c().drawShirou(ctx, o));
    });
    w().drawSpeedLines(ctx, { t, intensity: 1.0, color: '255,220,210', inner: 0.42 });
    alarmFx(ctx, t, 0.7);
    w().drawVignette(ctx, { strength: 0.5 });
  }

  // 4. side tracking: the whole squad charges (fast scroll)
  function sChargeSide(ctx, lt, t, shot) {
    const scroll = (t - S.start) * 1400 + 8000;
    const [sx, sy] = shake(t, 4);
    BS.common.camera(ctx, { x: 960 + sx, y: 540 + sy, zoom: 1.05, rot: 0.02 }, () => {
      sideScene(ctx, t, scroll, (gy) => {
        const ph = runPh(t);
        for (let i = 3; i >= 0; i--) {
          const p2 = mod1(ph + 0.23 * (i + 1));
          c().drawWBCAlly(ctx, { x: 980 + [-420, -290, -560, -160][i], y: gy - 30 - i * 12 - bob(p2, 6), scale: 0.8, variant: i, yaw: 68, pose: 'run', runPhase: p2, expr: 'determined', t, speed: 1, rim: RIM, tint: tintK(t, 0.1) });
        }
        c().drawShirou(ctx, { x: 1120, y: gy + 10 - bob(ph, 8), scale: 1.05, yaw: 66, pose: 'run', runPhase: ph, expr: 'serious', mouth: E.mouth(SH, t), blink: c().blinkAt(t, 13), t, speed: 1, rim: RIM, tint: tintK(t, 0.1) });
      }, 1400);
    });
    w().drawSpeedLines(ctx, { t, cx: -500, cy: H / 2, intensity: 0.7, inner: 0.5 });
    alarmFx(ctx, t, 0.8);
    w().drawVignette(ctx, { strength: 0.5 });
  }

  // 5. behind the squad, racing into the vessel toward the invaders
  function sBehind(ctx, lt, t) {
    const z = 600 + (t - S.start) * 7;
    const curve = { x: Math.sin(t * 0.5) * 0.25, y: 0.05 };
    const [sx, sy] = shake(t, 3);
    BS.common.camera(ctx, { x: 960, y: 540, zoom: 1.0, sx, sy }, () => {
      w().drawVesselTunnel(ctx, { t, z, curve, pulse: w().heartbeat(t) * 0.5, tint: '#300008', tintAmount: 0.4 });
      w().drawRBCField3D(ctx, { t, z, count: 60, vz: 7, curve });
      const g = prog(t, B.type_eosinophil, B.type_monocyte, ease.lin);
      w().drawPathogenSilhouette(ctx, { x: 980, y: 470, size: lerp(120, 200, g), t, reveal: 0.7 });
      const ph = runPh(t);
      for (let i = 0; i < 4; i++) {
        const p2 = mod1(ph + 0.25 * i + 0.13);
        c().drawWBCAlly(ctx, { x: 960 + [-520, 520, -300, 300][i], y: 1120 - bob(p2, 6) - (i > 1 ? 40 : 0), scale: 0.7, variant: i, yaw: 168, pose: 'run', runPhase: p2, t, speed: 1, rim: RIM, tint: tintK(t, 0.1) });
      }
      c().drawShirou(ctx, { x: 960, y: 1180 - bob(ph, 8), scale: 0.95, yaw: 172, pose: 'run', runPhase: ph, t, speed: 1, rim: RIM, tint: tintK(t, 0.1) });
    });
    w().drawSpeedLines(ctx, { t, cx: 980, cy: 470, intensity: 0.45, inner: 0.3 });
    alarmFx(ctx, t, 0.8);
  }

  // 6. low front angle: the squad storms past the camera
  function sFrontLow(ctx, lt, t, shot) {
    const z = 900 + (t - S.start) * 8;
    const k = prog(t, shot.a, shot.b, ease.lin);
    BS.common.camera(ctx, { x: 960, y: 540, zoom: lerp(1.0, 1.08, k), rot: 0.035 }, () => {
      w().drawVesselTunnel(ctx, { t, z, curve: { x: -0.1, y: 0 }, pulse: w().heartbeat(t) * 0.5, tint: '#300008', tintAmount: 0.4 });
      w().drawRBCField3D(ctx, { t, z, count: 60, vz: 8 });
      squadFront(ctx, t, { scale: lerp(1.5, 1.75, k), y: 1280, yaw: -6 });
    });
    w().drawSpeedLines(ctx, { t, intensity: 0.55 });
    alarmFx(ctx, t, 0.8);
  }

  // 7. Shirou running, medium 3/4 (left of frame; neutrophil card on the right)
  function sShirouRun3q(ctx, lt, t, shot) {
    const scroll = (t - S.start) * 1300 + 4000;
    const ph = runPh(t);
    const [sx, sy] = shake(t, 3);
    BS.common.camera(ctx, { x: 960 + sx, y: 540 + sy, zoom: 1.0, rot: -0.02 }, () => {
      sideScene(ctx, t, scroll, (gy) => {
        c().drawWBCAlly(ctx, { x: 160, y: gy + 40 - bob(mod1(ph + 0.4), 6), scale: 0.9, variant: 0, yaw: 60, pose: 'run', runPhase: mod1(ph + 0.4), expr: 'determined', t, speed: 1, rim: RIM, tint: tintK(t, 0.1), alpha: 0.9 });
        c().drawShirou(ctx, { x: 560, y: 1380 - bob(ph, 14), scale: 1.75, yaw: 48, pose: 'run', runPhase: ph, expr: 'determined', blink: c().blinkAt(t, 17), t, speed: 1, rim: RIM, tint: tintK(t, 0.08) });
      }, 1300);
    });
    w().drawSpeedLines(ctx, { t, cx: -600, cy: H / 2, intensity: 0.45, inner: 0.55 });
    alarmFx(ctx, t, 0.75);
  }

  // 8. over the shoulder: the bacterium grows ahead
  function sApproach(ctx, lt, t, shot) {
    const z = 1400 + (t - S.start) * 6;
    const k = prog(t, shot.a, shot.b, ease.in);
    const ph = runPh(t);
    w().drawVesselTunnel(ctx, { t, z, curve: { x: 0.12, y: -0.05 }, pulse: w().heartbeat(t) * 0.5, tint: '#300008', tintAmount: 0.5 });
    w().drawRBCField3D(ctx, { t, z, count: 50, vz: 6 });
    d().bacterium(ctx, { x: lerp(620, 600, k), y: lerp(450, 470, k), size: lerp(150, 330, k), t, seed: 1, flip: true, rot: 0.05 });
    c().drawShirou(ctx, { x: 340, y: 1480 - bob(ph, 12), scale: 1.9, yaw: 158, pose: 'run', runPhase: ph, t, speed: 1, rim: RIM, tint: tintK(t, 0.12) });
    w().drawSpeedLines(ctx, { t, cx: 620, cy: 460, intensity: 0.4 + 0.4 * k, inner: 0.3 });
    alarmFx(ctx, t, 0.85);
  }

  // 9. the bacterium growls into the lens
  function sGrowl(ctx, lt, t, shot) {
    const z = 1600 + (t - S.start) * 2;
    const k = prog(t, B.bacteria_growl, shot.b, ease.out);
    const [sx, sy] = shake(t, 10 + 10 * impact(t, B.bacteria_growl, 0.4), 30);
    w().drawVesselTunnel(ctx, { t, z, curve: { x: 0, y: 0 }, pulse: 0.2, tint: '#200004', tintAmount: 0.7 });
    BS.common.camera(ctx, { x: 960, y: 540, zoom: lerp(1.0, 1.18, k), sx, sy, rot: lerp(0.06, -0.02, k) }, () => {
      d().bacterium(ctx, { x: 1000, y: 560, size: 820, t: t * 1.6, seed: 1, flip: true, rim: '#ff2020' });
    });
    w().drawSpeedLines(ctx, { t, cx: 700, cy: 520, intensity: 0.9, color: '255,70,60', inner: 0.32 });
    alarmFx(ctx, t, 1);
    w().drawVignette(ctx, { strength: 0.7, color: '30,0,0' });
  }

  // grab geometry shared by the lunge / catch / engulf shots
  function grabX(t) { // wind-up (slides back, crouching) then the lunge
    if (t < B.grab_lunge) return lerp(600, 470, prog(t, B.grab_start, B.grab_lunge, ease.out));
    return lerp(470, 1010, prog(t, B.grab_lunge, B.grab_catch, ease.in));
  }
  function reachK(t) { return keys(t, [[B.grab_start, 0], [B.grab_lunge, 0.12], [B.grab_catch - 0.04, 1]], ease.in); }

  // 10. the lunge (side view, afterimages, horizontal speed lines)
  function sLunge(ctx, lt, t, shot) {
    const lung = prog(t, B.grab_lunge, B.grab_catch, ease.in);
    const camX = lerp(860, 1080, prog(t, B.grab_start, B.grab_catch + 0.1, ease.inOut));
    const [sx, sy] = shake(t, 3 + 4 * lung);
    const wind = prog(t, B.grab_start, B.grab_lunge, ease.out) * (1 - lung);
    BS.common.camera(ctx, { x: camX + sx, y: 560 + sy, zoom: 1.12 + 0.1 * wind, rot: 0.025 - 0.03 * wind }, () => {
      sideScene(ctx, t, 20000 + (t - B.grab_start) * 300, (gy) => {
        const oFor = (tt) => ({ x: grabX(tt), y: gy + 10, scale: 1.05, yaw: 52, pose: 'reach', reachAmt: reachK(tt), expr: 'determined', blink: 0, t: tt, rim: RIM, tint: tintK(tt, 0.1) });
        // bacterium tries to flee to the right; snapped to the hands at the catch
        const free = { x: lerp(1420, 1500, prog(t, B.grab_start, B.grab_catch)), y: gy - 330 + Math.sin(t * 9) * 12 };
        const o = oFor(t);
        const h = c().handAnchor('shirou', o);
        const hx = (h.R.palm.x + h.L.palm.x) / 2 + 70, hy = (h.R.palm.y + h.L.palm.y) / 2;
        const snap = prog(t, B.grab_catch - 0.16, B.grab_catch, ease.in);
        // afterimages during the lunge
        if (lung > 0.05 && lung < 1) for (let i = 2; i >= 1; i--) { const o2 = oFor(t - i * 0.05); o2.alpha = 0.22 * (3 - i) / 2; o2.tint = { color: '#ffffff', amount: 0.5 }; c().drawShirou(ctx, o2); }
        c().drawShirou(ctx, o);
        d().bacterium(ctx, { x: lerp(free.x, hx, snap), y: lerp(free.y, hy, snap), size: 240, t, seed: 1, state: t >= B.grab_catch - 0.05 ? 'caught' : 'idle', rot: -0.05 });
      }, 300, true);
    });
    w().drawSpeedLines(ctx, { t, cx: -900, cy: 520, intensity: 1.1 * lung, inner: 0.6 });
    alarmFx(ctx, t, 0.8);
  }

  // 11. the catch: close-up 「逃がすか……！」 (lip-sync), the bacterium squirming in his hands
  function sCatch(ctx, lt, t, shot) {
    const o = { x: 760, y: 1500, scale: 2.5, yaw: 52, pose: 'reach', reachAmt: 1, expr: t < L28.start ? 'determined' : 'shout', mouth: E.mouth(SH, t), blink: 0, t,
      rim: { color: '#ff5060', strength: 0.75 }, tint: tintK(t, 0.08), look: { x: 0.5, y: 0.15 } };
    const a = c().headAnchor('shirou', o), h = c().handAnchor('shirou', o);
    const hx = (h.R.palm.x + h.L.palm.x) / 2 + 150, hy = (h.R.palm.y + h.L.palm.y) / 2 - 20;
    const [sx, sy] = shake(t, 3 + 20 * impact(t, B.grab_catch, 0.45), 26);
    const zoom = lerp(0.98, 1.06, prog(t, B.grab_catch, shot.b, ease.out));
    BS.common.camera(ctx, { x: (a.x + hx) / 2 + 20, y: a.y + 230, zoom, sx, sy, rot: -0.04 }, () => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); w().drawVesselSide(ctx, { t, scrollX: 21000, layers: 'back' }); darken(ctx, 0.25); ctx.restore();
      c().drawShirou(ctx, o);
      d().bacterium(ctx, { x: hx + 60, y: hy + 40, size: 420, t, seed: 1, state: 'caught', rot: -0.1 });
    });
    w().drawSpeedLines(ctx, { t, cx: 1250, cy: 560, intensity: 0.8 * impact(t, B.grab_catch, 0.6) + 0.25, inner: 0.35 });
    alarmFx(ctx, t, 0.8);
  }

  // 12. engulf: the membrane bubble sweeps around and seals (side, slow push into the bubble)
  function sEngulf(ctx, lt, t, shot) {
    const push = prog(t, B.engulf_closed + 0.2, shot.b, ease.in);
    const [sx, sy] = shake(t, 2 + 16 * impact(t, B.engulf_closed, 0.5) + 6 * impact(t, B.engulf, 0.3));
    let bx = 0, by = 0;
    const o = { x: 640, y: 1260, scale: 1.55, yaw: 66, pose: 'reach', reachAmt: 1, expr: 'serious', blink: c().blinkAt(t, 19), t, rim: RIM, tint: tintK(t, 0.08) };
    const h = c().handAnchor('shirou', o);
    const hx = (h.R.palm.x + h.L.palm.x) / 2, hy = (h.R.palm.y + h.L.palm.y) / 2;
    bx = hx + 250; by = hy - 10;
    BS.common.camera(ctx, { x: lerp(960, bx, push), y: lerp(560, by, push), zoom: lerp(1.0, 2.2, push), sx, sy }, () => {
      sideScene(ctx, t, 21000, (gy) => {
        c().drawShirou(ctx, o);
        const p = keys(t, [[B.engulf, 0], [B.engulf_closed, 0.74], [B.engulf_closed + 0.8, 0.9], [shot.b, 0.96]], ease.lin);
        d().bacterium(ctx, { x: bx, y: by + Math.sin(t * 7) * 6, size: 250, t, seed: 1, state: 'caught', rot: -0.05 });
        d().engulfFX(ctx, { centerX: bx, centerY: by, radius: 205, p, t, fromAngle: Math.PI, originX: hx, originY: hy });
      }, 100, push < 0.3);
    });
    flashOver(ctx, 0.55 * impact(t, B.engulf_closed, 0.3), '230,210,255');
    alarmFx(ctx, t, 0.75);
    // zoom into the bubble → white flash into the cut-away
    flashOver(ctx, prog(t, shot.b - 0.25, shot.b, ease.in), '245,235,255');
  }

  // 13. cut-away schematic: phagosome → lysosome fusion → phagolysosome → digestion
  function sCutaway(ctx, lt, t, shot) {
    const p = keys(t, [[shot.a, 0.06], [B.phagosome - 0.9, 0.27], [B.phagosome, 0.35], [B.phagosome + 0.6, 0.44], [B.lysosome_fusion - 0.3, 0.46], [B.lysosome_fusion, 0.5],
      [B.phagolysosome, 0.61], [B.digest, 0.7], [B.digest + 1.4, 0.88], [shot.b, 0.97]], ease.lin);
    d().wbcBackdrop(ctx, { t, tint: [110, 18, 40] });
    const zoom = lerp(1.06, 1.0, prog(t, shot.a, shot.a + 1.2, ease.out)) + 0.03 * prog(t, shot.a + 1.2, shot.b, ease.lin);
    hudPlate(ctx, 960, 450, 1560, 840, 0.8, t, 'CUT-AWAY ／ 好中球の内部', [214, 180, 255], prog(t, shot.a, shot.a + 0.35, ease.out));
    BS.common.camera(ctx, { x: 960, y: 500, zoom }, () => {
      d().phagocytosis(ctx, { x: 960, y: 455, scale: 0.8, p, t });
    });
    const ros = prog(t, B.digest, B.digest + 0.3) * (1 - prog(t, B.digest + 1.6, B.digest + 2.2));
    if (ros > 0) flashOver(ctx, 0.06 * ros * (0.6 + 0.4 * Math.sin(t * 20)), '255,220,180');
    alarmFx(ctx, t, 0.35);
  }

  // 14. victory close-up 「異物は、ひとつも通さない。」
  function sVictory(ctx, lt, t, shot) {
    const vp = prog(t, shot.a + 0.1, shot.a + 2.6, ease.lin);
    const o = { x: 1000, y: 1420, scale: 2.8, yaw: -28, pose: 'pose', expr: t < L30.end - 0.2 ? 'calm' : 'smile', mouth: E.mouth(SH, t), blink: c().blinkAt(t, 23), t,
      rim: { color: lerp(0, 1, vp) > 0.5 ? '#ffd7a0' : '#ff7060', strength: 0.7 }, tint: tintK(t, 0.06), look: { x: -0.25, y: 0.05 } };
    const a = c().headAnchor('shirou', o);
    const zoom = lerp(1.0, 1.1, prog(t, shot.a, shot.b, ease.inOut));
    BS.common.camera(ctx, { x: a.x - 60, y: a.y + 260, zoom, rot: 0.03 }, () => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      w().drawVesselSide(ctx, { t, scrollX: 21000 + (t - shot.a) * 30, layers: 'back' });
      d().victoryFX(ctx, { x: 1260, y: 330, scale: 0.9, p: vp, t });
      w().drawLightRays(ctx, { x: 1500, y: -100, angle: 2.1, t, alpha: 0.25 * vp, color: '255,220,180' });
      ctx.restore();
      c().drawShirou(ctx, o);
    });
    w().drawParticles(ctx, { t, seed: 31, count: 50, vx: -20, vy: -30, alpha: 0.5, color: '255,225,190' });
    alarmFx(ctx, t, 0.6);
    w().drawVignette(ctx, { strength: 0.45 });
  }

  // 15. the four allies drop in around Shirou
  function sAlliesArrive(ctx, lt, t, shot) {
    const [sx, sy] = shake(t, 10 * impact(t, B.allies_enter + 0.15, 0.4));
    BS.common.camera(ctx, { x: 960 + sx, y: 540 + sy, zoom: 1.05 }, () => {
      sideScene(ctx, t, 21200, (gy) => {
        const xs = [600, 1320, 380, 1540];
        for (let i = 0; i < 4; i++) {
          const k = prog(t, B.allies_enter - 0.05 + i * 0.03, B.allies_enter + 0.18 + i * 0.03, ease.in);
          c().drawWBCAlly(ctx, { x: xs[i], y: lerp(-300, gy, k), scale: 0.78, variant: i, yaw: i % 2 ? -30 : 30, pose: k < 1 ? 'cheer' : 'ready', expr: 'determined', t, rim: { color: ALLY_COL[i], strength: 0.6 } });
        }
        c().drawShirou(ctx, { x: 960, y: gy + 20, scale: 0.9, yaw: 10, pose: 'ready', expr: 'smile', blink: c().blinkAt(t, 24), t, rim: { color: '#ffd7a0', strength: 0.5 } });
      }, 100, false);
    });
    w().drawSpeedLines(ctx, { t, intensity: 0.5 });
    alarmFx(ctx, t, 0.3);
  }

  // 16–19. ally signature pose + name card
  function allyShot(v, beatName, endAt) {
    return function (ctx, lt, t, shot) {
      const bt = B[beatName], col = ALLY_COL[v];
      const k = prog(t, shot.a, shot.a + 0.35, ease.out);
      const [sx, sy] = shake(t, 9 * impact(t, bt, 0.35));
      // backdrop: warm vessel + colour burst + speed lines
      ctx.save();
      w().drawVesselSide(ctx, { t, scrollX: 22000 + v * 900 + (t - shot.a) * 80, layers: 'back' });
      darken(ctx, 0.25);
      const rg = ctx.createRadialGradient(1300, 520, 30, 1300, 520, 950); rg.addColorStop(0, col + 'cc'); rg.addColorStop(0.45, col + '44'); rg.addColorStop(1, col + '00');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      const cc = parseInt(col.slice(1, 3), 16) + ',' + parseInt(col.slice(3, 5), 16) + ',' + parseInt(col.slice(5, 7), 16);
      w().drawSpeedLines(ctx, { t, cx: 1300, cy: 520, intensity: 0.5 + 0.6 * impact(t, bt, 0.6), color: cc, inner: 0.25 });
      w().drawLightRays(ctx, { x: 1300, y: -120, angle: Math.PI / 2, spread: 1.1, t, alpha: 0.2, color: cc });
      const o = { x: lerp(1420, 1300, k), y: 1180, scale: 1.3 * lerp(1.12, 1, k), variant: v, yaw: lerp(-40, -14, k), pose: 'pose', expr: ALLY_EXPR[v], blink: c().blinkAt(t, 50 + v), t,
        rim: { color: col, strength: 0.85 }, look: { x: -0.3, y: 0 } };
      BS.common.camera(ctx, { x: 960 + sx, y: 540 + sy, zoom: lerp(1.08, 1.0, prog(t, bt, bt + 0.5, ease.out)), rot: lerp(0.05, 0.015, k) }, () => c().drawWBCAlly(ctx, o));
      w().drawParticles(ctx, { t, seed: 60 + v, count: 50, vx: -40, vy: -20, alpha: 0.5, color: cc });
      // name card (top left)
      let p;
      if (v === 3) p = keys(t, [[bt - 0.05, 0], [bt + 0.9, 0.41], [B.plasma_cell, 0.42], [B.plasma_cell + 0.7, 0.62], [B.plasma_cell + 1.4, 0.95]], ease.lin);
      else p = keys(t, [[bt - 0.05, 0], [bt + 2.2, 0.95]], ease.lin);
      d().allyCards(ctx, { variant: v, p, x: 90, y: 100, scale: 1.0, t });
      if (v === 3) { // B cell → plasma cell → antibodies: Y's burst from her hand
        const h = c().handAnchor('ally', o);
        const ox = h.R.palm.x - 40, oy = h.R.palm.y + 20; // burst from her saluting hand, up and to the left
        for (let i = 0; i < 12; i++) {
          const tt = t - B.plasma_cell - i * 0.07; if (tt <= 0) continue;
          const ang = Math.PI - 0.45 + (((i * 7) % 12) / 11 - 0.5) * 1.5, sp = 380 + ((i * 5) % 4) * 140, dist = 60 + sp * (1 - Math.exp(-tt * 1.6)) / 1.6;
          antibody(ctx, ox + Math.cos(ang) * dist, oy + Math.sin(ang) * dist - tt * 30, 30 + 8 * (i % 3), Math.sin(tt * 3 + i) * 0.6 + ang + Math.PI / 2, clamp(tt * 5) * (1 - prog(tt, 1.3, 2.1)));
        }
      }
      w().drawVignette(ctx, { strength: 0.45 });
      flashOver(ctx, 0.5 * impact(t, bt, 0.2), cc);
    };
  }

  // 20. group shot: all five, Shirou centre
  function sGroup(ctx, lt, t, shot) {
    const k = prog(t, shot.a, shot.b + 0.6, ease.inOut);
    BS.common.camera(ctx, { x: 960, y: 560, zoom: lerp(1.12, 1.0, k) }, () => {
      sideScene(ctx, t, 23000 + (t - shot.a) * 60, (gy) => {
        const xs = [[620, 3], [1300, 0], [400, 1], [1530, 2]];
        for (const [x, v] of xs) c().drawWBCAlly(ctx, { x, y: gy + 30 - (v === 1 || v === 2 ? 30 : 0), scale: 0.8, variant: v, yaw: x < 960 ? 22 : -22, pose: 'pose', expr: ALLY_EXPR[v], blink: c().blinkAt(t, 60 + v), t, rim: { color: ALLY_COL[v], strength: 0.6 } });
        c().drawShirou(ctx, { x: 960, y: gy + 50, scale: 0.95, yaw: -12, pose: 'pose', expr: 'smile', blink: c().blinkAt(t, 25), t, rim: { color: '#ffd7a0', strength: 0.6 } });
      }, 60, false);
    });
    w().drawLightRays(ctx, { x: 960, y: -150, t, alpha: 0.22, color: '255,225,190' });
    w().drawParticles(ctx, { t, seed: 70, count: 60, vx: -20, vy: -25, alpha: 0.5, color: '255,230,200' });
    w().drawVignette(ctx, { strength: 0.4 });
  }

  // ================================================================ OVERLAYS (screen space, continuous across cuts)
  function overlays(ctx, t) {
    // five WBC types + ratio bar
    const la = prog(t, B.wbc_types - 0.2, B.wbc_types + 0.2) * (1 - prog(t, B.neutrophil_focus - 0.3, B.neutrophil_focus + 0.05));
    if (la > 0.003) {
      const p = keys(t, [[B.wbc_types, 0], [B.type_neutrophil, 0.06], [B.type_eosinophil, 0.18], [B.type_basophil, 0.30], [B.type_lymphocyte, 0.42],
        [B.type_monocyte, 0.54], [B.ratio_bar, 0.68], [B.ratio_bar + 1.4, 0.95], [B.neutrophil_focus, 1]], ease.lin);
      const ha = prog(t, B.ratio_bar + 1.6, B.neutrophil_focus - 0.4);
      const open = prog(t, B.wbc_types - 0.2, B.wbc_types + 0.15, ease.out);
      const jx = t < B.wbc_types + 0.2 ? Math.sin(t * 90) * 6 * (1 - open) : 0;
      hudPlate(ctx, 960 + jx, 438, 1500, 690, la, t, 'TACTICAL DATA ／ 白血球', [214, 180, 255], open);
      d().wbcLineup(ctx, { x: 960 + jx, y: 440, scale: 0.8, p, t, alpha: la * clamp(open * 1.4 - 0.2), highlight: ha > 0 ? 0 : -1, highlightAmt: ha });
    }
    // neutrophil card (60〜70% chip drawn here on its own beat, before the nucleus/granule labels)
    const ca = prog(t, B.neutrophil_focus - 0.1, B.neutrophil_focus + 0.25) * (1 - prog(t, B.bacteria_growl - 0.12, B.bacteria_growl + 0.02));
    if (ca > 0.003) {
      const p = keys(t, [[B.neutrophil_focus, 0], [B.pct_60_70 - 0.4, 0.22], [B.lobed_nucleus, 0.22], [B.lobed_nucleus + 0.9, 0.36], [B.granules, 0.36],
        [B.granules + 0.9, 0.62], [B.bacteria_growl - 0.15, 0.79]], ease.lin);
      const cx = 1300, cy = 430, sc = 0.72;
      const open = prog(t, B.neutrophil_focus - 0.1, B.neutrophil_focus + 0.25, ease.out);
      ctx.save(); ctx.globalAlpha = ca;
      ctx.translate(cx, cy); ctx.scale(1, lerp(0.05, 1, open)); ctx.translate(-cx, -cy);
      d().neutrophilCard(ctx, { x: cx, y: cy, scale: sc, p: Math.min(p, 0.79), t });
      const pa = prog(t, B.pct_60_70 - 0.05, B.pct_60_70 + 0.3, ease.lin);
      if (pa > 0) {
        ctx.save(); ctx.translate(cx + 430 * sc, cy + 290 * sc); const s2 = ease.back(pa); ctx.scale(s2 * sc, s2 * sc);
        d().wbcChip(ctx, '白血球の60〜70%', 0, 0, { size: 46, accent: [214, 180, 255], fill: 'solid' });
        ctx.globalAlpha *= pa; ctx.font = '24px ZenKaku, IPAGothic, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,235,250,0.75)'; ctx.fillText('いちばん数の多い白血球', 0, 65);
        ctx.restore();
        // a pulse ring when it lands
        const pr = prog(t, B.pct_60_70, B.pct_60_70 + 0.6, ease.out);
        if (pr > 0 && pr < 1) { ctx.beginPath(); ctx.arc(cx + 430 * sc, cy + 290 * sc, 40 + pr * 160, 0, Math.PI * 2); ctx.strokeStyle = `rgba(214,180,255,${0.8 * (1 - pr)})`; ctx.lineWidth = 4; ctx.stroke(); }
      }
      ctx.restore();
    }
  }

  // ================================================================ SCENE
  BS.ep01.battle = function (ctx, t, E_, S_) {
    E = E_; S = S_; B = S.beats;
    L25 = E.line('E01-25'); L28 = E.line('E01-28'); L30 = E.line('E01-30');
    const cutA = L30.start - 0.3;
    const shots = [
      { a: S.start, b: B.bacteria_reveal, draw: sAlarmCharge },
      { a: B.bacteria_reveal, b: B.shirou_shout - 0.15, draw: sReveal, tin: { type: 'whip', dur: 0.14, dir: -1 } },
      { a: B.shirou_shout - 0.15, b: L25.end + 0.15, draw: sShout, tin: { type: 'flash', dur: 0.2, color: '#ffd0c0' } },
      { a: L25.end + 0.15, b: B.type_eosinophil, draw: sChargeSide, tin: { type: 'whip', dur: 0.16, dir: 1 } },
      { a: B.type_eosinophil, b: B.type_monocyte, draw: sBehind, tin: { type: 'dissolve', dur: 0.3 } },
      { a: B.type_monocyte, b: B.neutrophil_focus, draw: sFrontLow, tin: { type: 'whip', dur: 0.16, dir: -1 } },
      { a: B.neutrophil_focus, b: B.lobed_nucleus, draw: sShirouRun3q, tin: { type: 'dissolve', dur: 0.3 } },
      { a: B.lobed_nucleus, b: B.bacteria_growl, draw: sApproach, tin: { type: 'whip', dur: 0.16, dir: 1 } },
      { a: B.bacteria_growl, b: B.grab_start, draw: sGrowl, tin: { type: 'flash', dur: 0.18, color: '#ff4030' } },
      { a: B.grab_start, b: B.grab_catch, draw: sLunge, tin: { type: 'whip', dur: 0.12, dir: 1 } },
      { a: B.grab_catch, b: B.engulf, draw: sCatch, tin: { type: 'flash', dur: 0.16, color: '#fff0e0' } },
      { a: B.engulf, b: Math.max(B.engulf_closed + 1.0, B.engulf + 1.4), draw: sEngulf },
      { a: Math.max(B.engulf_closed + 1.0, B.engulf + 1.4), b: cutA, draw: sCutaway, tin: { type: 'flash', dur: 0.35, color: '#f5ebff' } },
      { a: cutA, b: B.allies_enter, draw: sVictory, tin: { type: 'dissolve', dur: 0.25 } },
      { a: B.allies_enter, b: B.pose_eosinophil - 0.15, draw: sAlliesArrive, tin: { type: 'whip', dur: 0.12, dir: 1 } },
      { a: B.pose_eosinophil - 0.15, b: B.pose_basophil - 0.15, draw: allyShot(0, 'pose_eosinophil'), tin: { type: 'whip', dur: 0.14, dir: 1 } },
      { a: B.pose_basophil - 0.15, b: B.pose_monocyte - 0.15, draw: allyShot(1, 'pose_basophil'), tin: { type: 'whip', dur: 0.14, dir: -1 } },
      { a: B.pose_monocyte - 0.15, b: B.pose_b_cell - 0.15, draw: allyShot(2, 'pose_monocyte'), tin: { type: 'whip', dur: 0.14, dir: 1 } },
      { a: B.pose_b_cell - 0.15, b: B.plasma_cell + 1.6, draw: allyShot(3, 'pose_b_cell'), tin: { type: 'whip', dur: 0.14, dir: -1 } },
      { a: B.plasma_cell + 1.6, b: S.end + 1, draw: sGroup, tin: { type: 'dissolve', dur: 0.35 } },
    ];
    BS.common.playShots(ctx, t, shots, E);
    overlays(ctx, t);
  };
})();
