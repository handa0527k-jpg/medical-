/** The clock of「午前二時の本社ビル」: line cues per scene and voice-driven lips. */
import { buildTimeline } from '../../../../engine/story/timeline';
import type { StoryLine } from '../../../../engine/story/types';
import story from './story.json';
import lips from './lipsync.json';

const TL = buildTimeline((story as unknown as { lines: StoryLine[] }).lines);
const LIPS = lips as unknown as number[][];

/** cue times of a scene's lines (scene time): c = starts, e = ends, d = scene length, who = speakers */
export function cues(scene: string) {
  const s0 = TL.start[scene] ?? 0;
  const idx = TL.lines.map((l, i) => [l, i] as const).filter(([l]) => l.scene === scene);
  return { c: idx.map(([l]) => l.t0 - s0), e: idx.map(([l]) => l.t1 - s0), d: (TL.end[scene] ?? 0) - s0, who: idx.map(([l]) => l.who), i: idx.map(([, i]) => i) };
}
/** mouth openness of `who` at scene time t (from the recorded voice's loudness) */
export function mouthIn(scene: string, who: string, t: number) {
  const s0 = TL.start[scene] ?? 0, T = t + s0;
  for (let i = 0; i < TL.lines.length; i++) {
    const l = TL.lines[i];
    if (l.scene !== scene || l.who !== who || T < l.t0 || T > l.t1 + 0.1) continue;
    const e = LIPS[i]; if (!e) return 0;
    const x = (T - l.t0) * 30, j = Math.floor(x), k = x - j;
    const a = e[Math.min(e.length - 1, j)] ?? 0, b = e[Math.min(e.length - 1, j + 1)] ?? 0;
    return a + (b - a) * k;
  }
  return 0;
}
