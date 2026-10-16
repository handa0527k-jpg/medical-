// BLOOD STORY 第1話「運ぶもの、守るもの」本編（約4分54秒）。
// Timeline = audio/cues_episode01.json (scenes[].start/end/beats, lines[]). Each scene is drawn by
// BS.ep01[sceneId](ctx, t, E, S) from web/scenes/ep01_*.js, with t = film time (absolute seconds) and
// S = the scene record {id, start, end, beats}. Scenes cross-dissolve over XF seconds at their boundaries.
(() => {
  const { W, H, clamp, lerp, ease, prog } = BS.common;
  BS.ep01 = BS.ep01 || {};
  const DEPS = ['intro.js', 'ep01_lab.js', 'ep01_rbc.js', 'ep01_battle.js', 'ep01_end.js'];
  const XF = 0.5;
  const load = (src) => new Promise((r) => { const s = document.createElement('script'); s.src = `scenes/${src}`; s.onload = r; s.onerror = () => { console.error('missing ' + src); r(); }; document.body.appendChild(s); });

  // ---- avant (0–35.7): the intro, but N2 is the full sentence and the 29.5 hit leads into the title ----
  function avantTail(ctx, lt, t) { // 31.0–35.7: wide vessel, both teams moving off in the flow
    const w = BS.world, c = BS.chars;
    const z = 520 + (t - 31) * 6;
    const curve = { x: Math.sin(t * 0.4) * 0.3, y: 0.05 };
    w.drawVesselTunnel(ctx, { t, z, curve, pulse: w.heartbeat(t) * 0.5 });
    w.drawRBCField3D(ctx, { t, z, count: 80, vz: 6, curve });
    const p = prog(t, 31, 35.7, ease.lin);
    const run = (ph) => ((((t - 25.6) / 0.36 + ph) % 1) + 1) % 1;
    // Shirou's squad (left) and Akane (right) run into the depth: seen from behind, shrinking
    const sc = lerp(0.95, 0.55, p), y = lerp(1060, 860, p);
    c.drawShirou(ctx, { x: lerp(700, 820, p), y, scale: sc, yaw: 160, pose: 'run', runPhase: run(0), t, speed: 1, rim: { color: '#ff7a5c', strength: 0.5 } });
    for (let i = 0; i < 4; i++) c.drawWBCAlly(ctx, { x: lerp(700, 820, p) + (i - 1.5) * 150 * sc, y: y + 40 * sc, scale: sc * 0.8, variant: i, yaw: 160, pose: 'run', runPhase: run(0.25 * i), t, speed: 1 });
    c.drawAkane(ctx, { x: lerp(1300, 1120, p), y: y - 20, scale: sc * 0.95, yaw: -160, pose: 'run', runPhase: run(0.5), t, speed: 1, holdO2: true });
    w.drawParticles(ctx, { t, seed: 5, count: 60, alpha: 0.4 });
    w.drawVignette(ctx, { strength: 0.6 });
    // fade towards the bright depth: the title's light grows out of it
    const k = prog(t, 34.6, 35.7, ease.in);
    if (k > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, 1100); g.addColorStop(0, `rgba(255,220,200,${k})`); g.addColorStop(1, 'rgba(255,120,100,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  function avant(ctx, t, E) {
    const shots = BS.shots.intro.map((s) => ({ ...s }));
    shots[shots.length - 1].b = 31.0;
    shots.push({ a: 31.0, b: 36, draw: avantTail, tin: { type: 'dissolve', dur: 0.6 } });
    BS.episodeMode = true;
    BS.common.playShots(ctx, t, shots, E);
    BS.cuts.intro.caption && BS.cuts.intro.caption(ctx, t);
  }

  // ---- title (35.7–41.2) ----
  function title(ctx, t, E, S) {
    const w = BS.world, b = S.beats;
    const z = 600 + (t - S.start) * 1.5;
    w.drawVesselTunnel(ctx, { t, z, curve: { x: 0, y: 0 }, pulse: w.heartbeat(t) });
    w.drawRBCField3D(ctx, { t, z, count: 50, vz: 2 });
    ctx.fillStyle = `rgba(20,0,4,${0.55 * prog(t, b.logo_reveal - 0.6, b.logo_reveal)})`; ctx.fillRect(0, 0, W, H);
    const lt = t - b.logo_reveal;
    if (lt > -0.01) w.drawTitleLogo(ctx, { t: lt, alpha: 1 - prog(t, S.end - 0.5, S.end) });
    if (t > b.subtitle_ep) w.drawTelop(ctx, { text: '第1話　運ぶもの、守るもの', style: 'caption', t: t - b.subtitle_ep, y: H * 0.74, size: 54, alpha: 1 - prog(t, S.end - 0.5, S.end) });
    const k = 1 - prog(t, S.start, S.start + 0.8, ease.out);
    if (k > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,220,200,${k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    w.drawVignette(ctx, { strength: 0.6 });
  }

  function drawScene(ctx, t, E, S) {
    if (S.id === 'avant') return avant(ctx, t, E);
    if (S.id === 'title') return title(ctx, t, E, S);
    const f = BS.ep01[S.id];
    if (f) return f(ctx, t, E, S);
    // placeholder for a scene that is not written yet
    BS.world.drawVesselSide(ctx, { t, scrollX: t * 100 });
    BS.world.drawTelop(ctx, { text: `[${S.id}]`, style: 'caption', t: 5, y: H / 2, size: 60 });
  }

  BS.cuts.episode01 = {
    duration: 294.1667,
    async prepare(E) {
      BS.E = E; BS.episodeMode = true;
      for (const d of DEPS) await load(d);
      if (BS.diag && BS.diag.ready) await BS.diag.ready();
      if (BS.diag && BS.diag.readyWBC) await BS.diag.readyWBC();
      this.duration = E.cues.duration;
    },
    render(ctx, t, E) {
      BS.E = E;
      const sc = E.cues.scenes;
      let i = sc.findIndex((s) => t >= s.start && t < s.end); if (i < 0) i = t < sc[0].start ? 0 : sc.length - 1;
      const S = sc[i], prev = sc[i - 1];
      // dissolve from the previous scene for XF seconds (the title brings its own flash, avant→title is a light fade)
      if (prev && t - S.start < XF && S.id !== 'title' && S.id !== 'next') {
        const A = BS.common.renderTo(3, (g) => drawScene(g, t, E, prev));
        const B = BS.common.renderTo(4, (g) => drawScene(g, t, E, S));
        ctx.drawImage(A, 0, 0); ctx.globalAlpha = ease.inOut(clamp((t - S.start) / XF)); ctx.drawImage(B, 0, 0); ctx.globalAlpha = 1;
      } else drawScene(ctx, t, E, S);
    },
  };
})();
