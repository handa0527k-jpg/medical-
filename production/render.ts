/**
 * Off-line renderer for the story films (used by scripts/film/render.mjs; not part of the app build).
 * Draws exactly what the app's story player draws at film time t — the same scene functions, the same
 * cross-fade at scene boundaries — and returns JPEG frames.
 */
import { bindCtx, g, W, H, CL } from '../src/engine/story/kit';
import { buildTimeline, sceneAt } from '../src/engine/story/timeline';
import type { StoryModule } from '../src/engine/story/types';

const q = new URLSearchParams(location.search);
const course = q.get('course') || 'histology-nucleus';
const mods = import.meta.glob('../src/content/courses/*/story/index.ts');
const cv = document.getElementById('c') as HTMLCanvasElement;
const ctx = cv.getContext('2d')!;
type Win = { ready: boolean; total: number; scenes: unknown; renderFrames: (ts: number[], q?: number) => string[] };
const w = window as unknown as Win;

(async () => {
  const story = ((await mods[`../src/content/courses/${course}/story/index.ts`]()) as { default: StoryModule }).default;
  const { def, draw } = story;
  const tl = buildTimeline(def.lines);
  const frame = (now: number) => {
    bindCtx(ctx); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const sc = sceneAt(tl, def.scenes, now);
    const t = now - tl.start[sc.id], d = tl.end[sc.id] - tl.start[sc.id];
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.save(); try { draw[sc.id]?.(t, d); } catch (e) { console.error(e); } g.restore();
    const fade = 1 - Math.min(CL(t / 0.8), CL((tl.end[sc.id] - now) / 0.8));
    if (fade > 0) { g.fillStyle = `rgba(10,14,12,${fade})`; g.fillRect(0, 0, W, H); }
  };
  w.renderFrames = (ts, qq = 0.9) => ts.map((t) => { frame(t); return cv.toDataURL('image/jpeg', qq); });
  w.total = tl.total; w.scenes = def.scenes.map((s) => ({ id: s.id, title: s.title, start: tl.start[s.id], end: tl.end[s.id] }));
  await document.fonts.ready; frame(+(q.get('t') || 0)); w.ready = true;
})();
