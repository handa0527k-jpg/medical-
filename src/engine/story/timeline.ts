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

/** a long line cut into short subtitle pieces: sentences, and over-long sentences at their commas */
export function subPieces(text: string, max = 44): string[] {
  const sentences = text.split(/(?<=[。！？])/).filter((s) => s.trim());
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) { out.push(s); continue; }
    let cur = '';
    for (const part of s.split(/(?<=、)/)) { if (cur && cur.length + part.length > max) { out.push(cur); cur = ''; } cur += part; }
    if (cur) out.push(cur);
  }
  // fold very short pieces into the previous one
  return out.reduce<string[]>((a, p) => { if (a.length && (p.length < 8 || a[a.length - 1].length < 8) && a[a.length - 1].length + p.length <= max) a[a.length - 1] += p; else a.push(p); return a; }, []);
}
/** the piece of a line showing at time `now` (time shared by length) */
export function subAt(text: string, t0: number, t1: number, now: number, max = 44): string {
  const ps = subPieces(text, max), total = ps.reduce((s, p) => s + p.length, 0);
  let acc = 0; const k = (now - t0) / Math.max(0.01, t1 - t0);
  for (const p of ps) { acc += p.length; if (k < acc / total) return p; }
  return ps[ps.length - 1] ?? text;
}
