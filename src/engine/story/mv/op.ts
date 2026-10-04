/**
 * Opening: a TV-anime style music video on 魔王魂「シャイニングスター」(short version, played to its own end).
 * Cut to the song (music.json): intro → title on the downbeat → A: the cast → B: the story in stills →
 * chorus: run, montage, everyone together → climax: the jump → outro: the line-up and the title again.
 * People are motion-captured silhouettes (walk, run, jump, wave, stand) — simplified so their movement
 * stays natural.
 */
import { CL, H, L, W, g, rr } from '../kit';
import { camera, perform, type Take, type Pose3 } from '../mocap';
import { MUSIC, bar, barAt, barNear, shot, sections, ease, hex, mixHex, plain, pulse, sideCam, silhouette, snap, span, still, text, typed, wrap, GOTHIC, MINCHO, HAND, type MvCtx } from './common';

const S = MUSIC.op, SEC = sections(S);
export const OP_LENGTH = S.len;

const castOf = (c: MvCtx) => c.def.cast.slice(0, 8);
const nameOf = (n: string) => n.replace(/（.*?）/g, '');
const clean = (s: string) => plain(s).replace(/\s+/g, ' ');

/* ---------- backgrounds ---------- */
function sky(top: string, mid: string, bot: string) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(0.62, mid); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function rays(x: number, y: number, n: number, rot: number, col: string, a: number) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.fillStyle = col; g.translate(x, y); g.rotate(rot);
  for (let i = 0; i < n; i++) { g.rotate((Math.PI * 2) / n); g.beginPath(); g.moveTo(0, 0); g.lineTo(1600, -60); g.lineTo(1600, 60); g.fill(); }
  g.restore();
}
function sparkles(t: number, n: number, seed: number, col = '255,255,240', a = 1) {
  for (let i = 0; i < n; i++) {
    const r = Math.sin(i * 12.9898 + seed) * 43758.5453, fr = r - Math.floor(r);
    const x = (i * 197 + seed * 31) % W, y = H - ((t * (20 + fr * 50) + i * 53) % (H + 40));
    const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
    g.fillStyle = `rgba(${col},${a * tw * 0.8})`; g.beginPath(); g.arc(x, y, 1.2 + fr * 2.2, 0, 7); g.fill();
  }
}
function hill(y: number, col: string, amp = 30, ph = 0) { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, y - Math.sin(x * 0.004 + ph) * amp - Math.sin(x * 0.011 + ph * 2) * amp * 0.3); g.lineTo(W, H); g.fill(); }
function speedLines(t: number, col: string, a: number, dir = -1) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const y = (i * 61) % H, len = 120 + (i % 5) * 60, x = (((t * 1400 * (1 + (i % 3) * 0.3)) * -dir + i * 211) % (W + len * 2)) - len; g.lineWidth = 2 + (i % 3); g.beginPath(); g.moveTo(dir < 0 ? W - x : x, y); g.lineTo(dir < 0 ? W - x + len : x - len, y); g.stroke(); }
  g.restore();
}
/** a flash that starts at t = h and fades over d seconds (nothing before h) */
const hitFlash = (t: number, h: number, d: number) => (t < h ? 0 : 1 - span(t, h, h + d));
function flash(a: number, col = '#ffffff') { if (a <= 0) return; g.save(); g.globalAlpha = CL(a); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }
function letterbox(k: number) { if (k <= 0) return; g.fillStyle = '#000'; g.fillRect(0, 0, W, 54 * k); g.fillRect(0, H - 54 * k, W, 54 * k); }

/* ---------- title logo ---------- */
function logo(c: MvCtx, x: number, y: number, k: number, beat: number) {
  if (k <= 0) return;
  const s = L(1.6, 1, ease.back(k)) * (1 + beat * 0.03);
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.04);
  const title = c.def.title, size = Math.min(96, 1100 / Math.max(4, [...title].length));
  g.globalAlpha = CL(k * 2);
  // ribbon behind the title
  g.font = `900 ${size}px ${MINCHO}`; const rw = Math.max(W * 0.5, g.measureText(title).width + size * 1.2);
  g.fillStyle = hex(c.def.cast[0]?.color ?? '#d57f45', 0.92); rr(-rw / 2, -size * 0.85, rw, size * 1.25, 18); g.fill();
  text(title, 0, size * 0.18, size, '#ffffff', 1, 'center', MINCHO, 900, 'rgba(40,20,10,.55)');
  text('MED·STUDY STORY ANIME', 0, size * 0.85, 18, '#fff6e0', 1, 'center', GOTHIC, 800);
  g.restore();
}

/* ---------- people ---------- */
function figure(take: Take | Take[], t: number, camX: number, col: string, opt: { camH?: number; dist?: number; f?: number; rim?: string; accent?: string; z?: number } = {}): Pose3 {
  const pose = perform(Array.isArray(take) ? take : [take], t);
  silhouette(sideCam(camX, opt.camH ?? 1.0, opt.dist ?? 6, opt.f ?? 620, opt.z ?? 0), pose, col, { rim: opt.rim, accent: opt.accent });
  return pose;
}

/* ---------- 1. intro ---------- */
function intro(c: MvCtx, t: number) {
  const hero = c.def.cast[0];
  const dawn = span(t, 0.8, SEC.verse);
  sky(mixHex('#0b1430', '#3a5aa8', dawn), mixHex('#1a2448', '#f4b07a', dawn), mixHex('#1a1a30', '#ffd9a0', dawn));
  rays(W * 0.5, H * 0.78, 18, t * 0.05, 'rgba(255,240,200,1)', 0.12 * dawn);
  sparkles(t, 70, 3, '255,250,230', 1 - dawn * 0.5);
  hill(H * 0.8, mixHex('#0a0f20', '#3a2a40', dawn), 26, 1);
  // the hero stands on the hill; the camera pushes in; at the end of the intro the hero looks up
  if (t > 3.0) {
    const k = span(t, 3, SEC.verse);
    const pose = perform([{ clip: 'stand', at: 3, from: 2, x: 0, z: 0, face: 0.35 }], t);
    silhouette(sideCam(L(0.6, 0.15, k), 0.95, L(9, 6.2, k), 640), pose, mixHex('#0a0f20', '#1a1424', dawn), { rim: hex('#ffd9a0', dawn) });
  }
  // staff credits, anime style (bottom-left, one by one)
  const cr = [['原作・脚本・絵', 'MED·STUDY'], ['主題歌', `「${S.title}」 魔王魂`]];
  cr.forEach(([a, b], i) => { const k = span(t, 1.2 + i * 2.2, 1.8 + i * 2.2) * (1 - span(t, 2.8 + i * 2.2, 3.3 + i * 2.2)); text(a, 70, H - 120, 18, '#ffe9c8', k, 'left', GOTHIC, 700); text(b, 70, H - 86, 28, '#ffffff', k, 'left', MINCHO, 800, 'rgba(0,0,0,.4)'); });
  // the kicker line types itself in the sky
  const hit = snap(S, bar(S, barNear(S, SEC.verse) - 2));
  typed(clean(c.def.kicker).split(' ・ ')[0], W / 2, 120, 22, '#fff6e6', span(t, 2.6, hit - 1.2, (x) => x) * (t < hit ? 1 : 0));
  logo(c, W / 2, H * 0.24, span(t, hit - 0.05, hit + 0.45, (x) => x), pulse(S, t));
  flash(hitFlash(t, hit, 0.35), '#fffaf0');
  void hero;
}

/* ---------- 2. A: the cast ---------- */
const CLIPS = ['walk', 'wave', 'explain', 'laugh', 'stretch', 'walk_casual', 'wave', 'explain'];
function castShot(c: MvCtx, t: number) {
  const cast = castOf(c), n = cast.length;
  const { i, t0, u, len } = shot(S, SEC.verse, SEC.pre, n, t), who = cast[i];
  const col = who.color;
  sky(mixHex(col, '#ffffff', 0.55), mixHex(col, '#ffffff', 0.25), col);
  // diagonal stripes sliding with the beat
  g.save(); g.globalAlpha = 0.18; g.fillStyle = '#ffffff'; for (let k = -4; k < 12; k++) { const x = k * 140 + ((u * 90) % 140); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x - 240, H); g.lineTo(x - 300, H); g.fill(); } g.restore();
  // the character: enters walking for walk clips, otherwise performs in place; the camera eases along
  const clipId = CLIPS[i % CLIPS.length];
  const walking = clipId.startsWith('walk');
  const take: Take = walking ? { clip: clipId, at: t0, x: -2.2, z: 0, face: Math.PI / 2, travel: true } : { clip: clipId, at: t0, from: 0.2, x: 0.9, z: 0, face: -0.5 };
  const camX = walking ? L(-0.6, 0.6, span(u, 0, len)) : 0.4;
  const dark = mixHex(col, '#000000', 0.62);
  g.fillStyle = hex('#000000', 0.12); g.fillRect(0, H * 0.84, W, H);
  figure(take, t, camX, dark, { camH: 0.95, dist: 5.2, f: 640, rim: 'rgba(255,255,255,.7)' });
  // name plate slides in from the left on the bar
  const k = span(u, 0, 0.45, ease.back), out = span(u, len - 0.25, len);
  const x = L(-500, 120, k) - out * 600;
  g.save(); g.fillStyle = 'rgba(255,255,255,.94)'; g.beginPath(); g.moveTo(x - 40, 200); g.lineTo(x + 520, 200); g.lineTo(x + 480, 300); g.lineTo(x - 80, 300); g.fill(); g.restore();
  text(nameOf(who.name), x + 10, 270, 52, mixHex(col, '#000000', 0.45), 1, 'left', MINCHO, 900);
  const m = clean(who.map);
  text(m.length > 30 ? m.slice(0, 30) + '…' : m, x + 0, 340, 22, '#ffffff', k * (1 - out), 'left', GOTHIC, 800, 'rgba(0,0,0,.45)');
  flash((1 - span(u, 0, 0.18)) * 0.6);
}

/* ---------- 3. B: the story in stills ---------- */
function storyShot(c: MvCtx, t: number) {
  const sc = c.def.scenes, n = sc.length;
  const { i, u, len: per } = shot(S, SEC.pre, SEC.chorus, n, t);
  const hero = c.def.cast[0]?.color ?? '#d57f45';
  sky('#141018', mixHex(hero, '#141018', 0.7), '#0d0b10');
  sparkles(t, 40, 9, '255,230,200', 0.6);
  // the frame: tilted, with a soft shadow; the still pans slowly inside
  const rot = (i % 2 ? 1 : -1) * 0.035, k = span(u, 0, 0.35, ease.out);
  g.save(); g.translate(W / 2 + (i % 2 ? 40 : -40), 322 + L(30, 0, k)); g.rotate(rot); g.scale(0.88, 0.88); g.globalAlpha = k;
  g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(-412, -228, 840, 470);
  g.fillStyle = '#fffaf0'; g.fillRect(-424, -240, 848, 478);
  g.save(); g.beginPath(); g.rect(-410, -226, 820, 450); g.clip();
  const z = 1.05 + u * 0.03; g.drawImage(still(c, sc[i].id, 0.32), -410 * z, -226 * z, 820 * z, 450 * z);
  g.restore();
  g.restore();
  text(`#${i + 1}`, 110, 74, 46, hex(hero), k, 'left', GOTHIC, 900, 'rgba(0,0,0,.6)');
  text(sc[i].title, 200, 72, 32, '#ffffff', k, 'left', MINCHO, 900, 'rgba(0,0,0,.6)');
  const lines = wrap(clean(sc[i].plot), 34).slice(0, 2);
  lines.forEach((ln, j) => typed(ln, W / 2, 600 + j * 34, 22, '#fff4e4', span(u, 0.25 + j * 0.5, per * 0.8, (x) => x), 'center', GOTHIC, 'rgba(0,0,0,.7)'));
  flash((1 - span(u, 0, 0.12)) * 0.35);
}

/* ---------- 4. chorus ---------- */
function runShot(c: MvCtx, t: number) {
  const a = SEC.chorus, b = bar(S, barAt(S, SEC.chorus)[0] + 8), u = t - a;
  const hero = c.def.cast[0]?.color ?? '#d57f45';
  sky('#ffe7b0', '#ffb07a', mixHex(hero, '#ff8a5a', 0.4));
  rays(W * 0.75, H * 0.2, 14, t * 0.2, 'rgba(255,255,255,1)', 0.18);
  // parallax: far hills, scene titles drifting in the sky on each bar, near ground
  hill(H * 0.66, 'rgba(255,255,255,.35)', 40, -u * 0.6);
  const [bi] = barAt(S, t), b0 = barAt(S, a)[0];
  c.def.scenes.forEach((s, k) => { const at = bar(S, b0 + k); if (t < at) return; const age = t - at; const x = W + 100 - age * 420; if (x < -500) return; text(s.title, x, 120 + (k % 3) * 70, 34, '#ffffff', CL(age * 3), 'left', MINCHO, 900, hex(hero, 0.8)); });
  hill(H * 0.8, mixHex(hero, '#3a2a20', 0.6), 18, -u * 1.6);
  speedLines(t, 'rgba(255,255,255,.8)', 0.6, -1);
  // the hero runs (motion capture, looping stride); the camera keeps the runner left of centre
  const take: Take = { clip: 'run', at: a, x: 0, z: 0, face: Math.PI / 2, travel: true };
  const pose = perform([take], t);
  const px = pose.p[0][0];
  silhouette(sideCam(px + 0.9, 0.95, 5.0, 600), pose, mixHex(hero, '#1a0f0a', 0.7), { rim: 'rgba(255,255,255,.85)', rimSide: 1 });
  void b; void bi;
}
function montage(c: MvCtx, t: number) {
  const a = bar(S, barAt(S, SEC.chorus)[0] + 8), b = bar(S, barAt(S, SEC.chorus)[0] + 13);
  const sc = c.def.scenes, n = sc.length, half = (bar(S, 1) - bar(S, 0)) / 2;
  const i = Math.floor((t - a) / half), u = t - a - i * half, s = sc[i % n];
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const z = 1.18 - u * 0.12, dx = (i % 2 ? -1 : 1) * u * 40;
  g.drawImage(still(c, s.id, i % 2 ? 0.62 : 0.3), (W - W * z) / 2 + dx, (H - H * z) / 2, W * z, H * z);
  // colour bars slashing in on the beat
  const hero = c.def.cast[(i % Math.max(1, c.def.cast.length))]?.color ?? '#d57f45';
  g.save(); g.globalAlpha = 0.85 * (1 - span(u, 0, 0.25)); g.fillStyle = hero; g.beginPath(); g.moveTo(0, H * 0.72); g.lineTo(W, H * 0.58); g.lineTo(W, H * 0.66); g.lineTo(0, H * 0.8); g.fill(); g.restore();
  text(s.title, W - 60, H - 70, 40, '#ffffff', 1, 'right', MINCHO, 900, 'rgba(0,0,0,.65)');
  flash((1 - span(u, 0, 0.1)) * 0.5);
  void b;
}
function together(c: MvCtx, t: number) {
  const a = bar(S, barAt(S, SEC.chorus)[0] + 13), u = t - a;
  const cast = castOf(c);
  sky('#fff2d0', '#ffd08a', '#e8a060');
  rays(W / 2, H * 0.35, 20, t * 0.08, 'rgba(255,255,255,1)', 0.2);
  hill(H * 0.86, '#c9824a', 10, 0.5);
  // everyone walks toward the camera together (casual walk), spread across, slightly staggered
  const cam = { camX: 0, camH: 1.2, dist: 7.5, f: 560 };
  const order = cast.map((p, k) => ({ p, k, x: (k - (cast.length - 1) / 2) * 1.05, z: -1.8 - (k % 2) * 0.9 }));
  order.sort((A, B) => A.z - B.z).forEach(({ p, k, x, z }) => {
    const take: Take = { clip: 'walk_casual', at: a - 0.6 - k * 0.27, x, z: z - 2, face: 0, travel: true };
    figure(take, t, 0, mixHex(p.color, '#120c08', 0.55), { camH: cam.camH, dist: cam.dist, f: cam.f, rim: 'rgba(255,255,255,.75)' });
  });
  typed(clean(c.def.lead).split('。')[0] + '。', W / 2, 90, 24, '#5a3010', span(u, 0.5, 4, (x) => x), 'center', HAND, 'rgba(255,255,255,.8)');
}

/* ---------- 5. climax: the jump ---------- */
function climax(c: MvCtx, t: number) {
  const a = SEC.climax, u = t - a, hero = c.def.cast[0]?.color ?? '#d57f45';
  const top = snap(S, bar(S, barAt(S, a)[0] + 2)); // the strong hit two bars in
  sky('#3a6ad8', '#8ab8ff', '#ffe2b8');
  rays(W / 2, H * 0.62, 24, t * 0.15, 'rgba(255,255,255,1)', 0.22 + pulse(S, t) * 0.2);
  sparkles(t, 60, 21, '255,255,255', 0.9);

  // the jump take is timed so its apex meets the hit; a brief freeze at the apex (anime "hold")
  const apex = 1.25; // seconds into the jump clip where the body is highest (measured: pelvis +0.27 m)
  const hold = 0.35, tc = t < top ? t : t < top + hold ? top : t - hold;
  const take: Take = { clip: 'jump', at: top - apex, x: 0, z: 0, face: 0.3 };
  const pose = perform([take], tc);
  // low camera close in, so the take-off and the hang in the air read big (worm's-eye anime framing)
  const push = span(t, a, top, ease.out);
  const cam = camera({ x: 0.25, y: 0.35, z: L(5.2, 3.6, push), tx: 0, ty: 1.05, tz: 0, f: 600 });
  hill(cam.proj([0, 0, 0]).y + 6, '#2a3a6a', 5, 1.2); // the ground line sits exactly where the feet touch it
  silhouette(cam, pose, mixHex(hero, '#0c0a14', 0.65), { rim: 'rgba(255,255,255,.9)' });
  if (t >= top && t < top + hold + 0.2) { g.save(); g.globalCompositeOperation = 'screen'; rays(W / 2, H / 2, 32, 0, 'rgba(255,255,255,1)', 0.35 * (1 - span(t, top, top + hold + 0.2))); g.restore(); }
  flash(hitFlash(t, top, 0.18) * 0.45);
  // learning keywords orbit after the jump
  const words = (c.def.points?.rows ?? []).map((r) => clean(r[0])).slice(0, 8);
  words.forEach((w, k) => { const ang = (k / words.length) * Math.PI * 2 + u * 0.4, rad = 380 + Math.sin(u + k) * 30; text(w, W / 2 + Math.cos(ang) * rad, H * 0.48 + Math.sin(ang) * rad * 0.42, 24, '#ffffff', span(u, 4 + k * 0.2, 5 + k * 0.2), 'center', GOTHIC, 900, hex(hero, 0.85)); });
}

/* ---------- 6. outro: the line-up ---------- */
function outro(c: MvCtx, t: number) {
  const a = SEC.outro, u = t - a, end = SEC.end;
  const cast = castOf(c);
  const dusk = span(t, a, end);
  sky(mixHex('#ffb88a', '#5a4a9a', dusk), mixHex('#ffd8a0', '#ff9a7a', dusk), '#5a3a4a');
  rays(W / 2, H * 0.8, 16, t * 0.05, 'rgba(255,240,210,1)', 0.25);
  hill(H * 0.84, '#3a2836', 14, 2);
  const n = cast.length;
  cast.forEach((p, k) => {
    const x = (k - (n - 1) / 2) * 0.95;
    const takes: Take[] = [{ clip: 'stand2', at: a - 1, from: 1 + k * 0.4, x, z: 0, face: 0 }, { clip: 'wave', at: a + 1.2 + k * 0.18, from: 0.1, x, z: 0, face: 0, blend: 0.5 }];
    figure(takes, t, 0, mixHex(p.color, '#120c10', 0.6), { camH: 1.0, dist: 6.6 + n * 0.25, f: 600, rim: 'rgba(255,220,180,.8)' });
  });
  const hit = snap(S, bar(S, barAt(S, a)[0] + 6));
  logo(c, W / 2, H * 0.3, span(t, hit - 0.05, hit + 0.4, (x) => x), pulse(S, t));
  flash(hitFlash(t, hit, 0.3) * 0.6);
  letterbox(span(t, end - 1, end + 0.6));
  void u;
}

/** draw opening frame at song time t */
export function drawOP(c: MvCtx, t: number) {
  g.save();
  if (t < SEC.verse) intro(c, t);
  else if (t < SEC.pre) castShot(c, t);
  else if (t < SEC.chorus) storyShot(c, t);
  else if (t < bar(S, barAt(S, SEC.chorus)[0] + 8)) runShot(c, t);
  else if (t < bar(S, barAt(S, SEC.chorus)[0] + 13)) montage(c, t);
  else if (t < SEC.climax) together(c, t);
  else if (t < SEC.outro) climax(c, t);
  else outro(c, t);
  // the black at the very start and after the song ends
  flash(1 - span(t, 0.2, 0.9), '#000000');
  flash(span(t, S.end + 0.4, S.len), '#000000');
  g.restore();
}
