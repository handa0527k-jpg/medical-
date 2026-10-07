// GENE QUEST — render the film.
//
//   node src/render.mjs                      → out/video.mp4 (picture only, 1920×1080, 24 fps) + cues.json
//   node src/render.mjs --stills 5,42,61 DIR → PNG stills (960×540) at those seconds
//   node src/render.mjs --cues               → cues.json only (sound-effect times for the mixer)
//   node src/render.mjs --from 40 --to 65    → render part of the film (to out/part.mp4)
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeFrame, beginFrame, endFrame, message, status, clamp, C } from './engine.mjs';
import './sprites.mjs';
import { portrait, SAGE, HERO } from './common.mjs';
import * as S1 from './scenes1.mjs';
import * as S2 from './scenes2.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROD = join(HERE, '..');
const FPS = 24;
const timing = JSON.parse(readFileSync(join(PROD, 'timing.json'), 'utf8'));
const DUR = timing.duration;
const SCENES = { ...S1, ...S2 };
const LV = { title: 1, history: 1, smith: 1, ligase: 3, puzzle: 5, rt: 5, market: 7, factory: 9, gfp: 11, harbor: 12, library: 14, pcr: 15, vntr: 17, gel: 18, qpcr: 19, sanger: 21, ngs: 22, seq: 24, crispr: 25, repair: 27, finale: 27, epilogue: 30 };

// blocks with their lines in block-relative time
const blocks = timing.blocks.map((b, i) => {
  const end = b.end ?? DUR;
  const lines = timing.lines.filter(l => l.block === b.id).map(l => ({ ...l, s: l.start - b.start, e: l.end - b.start }));
  return { ...b, end, dur: end - b.start, L: lines, index: i };
});
const inst = blocks.map(b => {
  const mk = SCENES[b.scene];
  if (!mk) throw new Error('no scene ' + b.scene);
  return mk(b);
});

export function cues() {
  const out = [];
  blocks.forEach((b, i) => { for (const [t, name, vol = 1] of inst[i].se || []) out.push({ t: +(b.start + t).toFixed(3), name, vol, scene: b.scene }); });
  return out.sort((a, b) => a.t - b.t);
}

function drawAt(f, T) {
  beginFrame(f);
  let i = blocks.findIndex(b => T >= b.start && T < b.end);
  if (i < 0) i = blocks.length - 1;
  const b = blocks[i], sc = inst[i], t = T - b.start;
  sc.draw(f, t, T);
  const st = { name: HERO, lv: LV[b.scene] ?? 1, hp: 30 + (LV[b.scene] ?? 1) * 7, mp: 8 + (LV[b.scene] ?? 1) * 4 };
  const hideStatus = typeof sc.noStatus === 'function' ? sc.noStatus(t) : sc.noStatus;
  if (!hideStatus) status(f, st, t);
  // the current line: from its start until the next line starts (or 0.8 s after it ends)
  const L = b.L;
  let cur = null;
  for (let k = 0; k < L.length; k++) {
    const next = L[k + 1] ? L[k + 1].s : Infinity;
    if (t >= L[k].s && t < Math.min(next, L[k].e + 0.8)) cur = L[k];
  }
  if (cur && !sc.noMessage) {
    const sage = cur.who === '師匠';
    message(f, cur, t - cur.s, { who: sage ? SAGE : null });
    if (sage && !sc.sageOnStage) portrait(f, t - cur.s);
  }
  // fade between blocks (scenes may draw their own)
  if (!sc.noFade) {
    const fin = clamp(1 - t / 0.35), fout = clamp((t - (b.dur - 0.35)) / 0.35);
    if (i > 0) f.fade = Math.max(f.fade, fin);
    if (i < blocks.length - 1) f.fade = Math.max(f.fade, fout);
  }
  endFrame(f);
}

async function encode(from, to, out) {
  mkdirSync(dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '960x540', '-r', String(FPS), '-i', '-',
    '-vf', 'scale=1920:1080:flags=neighbor', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const f = makeFrame();
  const n0 = Math.round(from * FPS), n1 = Math.round(to * FPS);
  const t0 = Date.now();
  for (let n = n0; n < n1; n++) {
    drawAt(f, n / FPS);
    const buf = f.hi.data();
    if (!ff.stdin.write(Buffer.from(buf))) await new Promise(r => ff.stdin.once('drain', r));
    if (n % (FPS * 10) === 0) process.stdout.write(`\r  ${(n / FPS).toFixed(0)} / ${to.toFixed(0)} s  (${((Date.now() - t0) / 1000).toFixed(0)} s)   `);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`\n  wrote ${out}`);
}

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
writeFileSync(join(PROD, 'cues.json'), JSON.stringify(cues(), null, 1));
if (args.includes('--cues')) { console.log('cues.json:', cues().length, 'cues'); }
else if (opt('--stills')) {
  const dir = args[args.indexOf('--stills') + 2] || join(PROD, 'out', 'stills');
  mkdirSync(dir, { recursive: true });
  const f = makeFrame();
  for (const s of opt('--stills').split(',').map(Number)) { drawAt(f, s); writeFileSync(join(dir, `t${String(s).padStart(6, '0')}.png`), f.hi.toBuffer('image/png')); }
  console.log('stills →', dir);
} else {
  const from = +(opt('--from') || 0), to = +(opt('--to') || DUR);
  await encode(from, to, join(PROD, 'out', from === 0 && to === DUR ? 'video.mp4' : 'part.mp4'));
}
