import type { StoryLine, StoryScene } from './types';

/** silence between lines, before a scene's first line, and after its last line (s) */
export const GAP = 0.55;
export const LEAD = 1.2;
export const TAIL = 1.4;

export interface TimedLine extends StoryLine {
  t0: number;
  t1: number;
}

export interface StoryTimeline {
  lines: TimedLine[];
  start: Record<string, number>;
  end: Record<string, number>;
  total: number;
}

/** Lays the lines end to end; each scene starts with a short lead-in and ends with a pause. */
export function buildTimeline(lines: StoryLine[]): StoryTimeline {
  let T = 0;
  const start: Record<string, number> = {};
  const end: Record<string, number> = {};
  const out: TimedLine[] = [];
  lines.forEach((l, i) => {
    if (!(l.scene in start)) { start[l.scene] = T; T += LEAD; }
    T += l.wait ?? 0;
    const t0 = T, t1 = T + l.dur;
    out.push({ ...l, t0, t1 });
    T = t1 + GAP;
    const next = lines[i + 1];
    if (!next || next.scene !== l.scene) { T += TAIL; end[l.scene] = T; }
  });
  return { lines: out, start, end, total: T };
}

export function lineAt(tl: StoryTimeline, t: number): number {
  for (let i = 0; i < tl.lines.length; i++) if (t >= tl.lines[i].t0 && t < tl.lines[i].t1) return i;
  return -1;
}

export function sceneAt(tl: StoryTimeline, scenes: StoryScene[], t: number): StoryScene {
  return scenes.find((s) => t >= tl.start[s.id] && t < tl.end[s.id]) || scenes[scenes.length - 1];
}
