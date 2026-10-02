/**
 * Resolve a film's sound cues against the story timeline (the same clock the app plays):
 *   npx tsx scripts/film/timeline.ts <course> <production dir>
 * reads <production>/sound.json and writes <production>/timeline.json with absolute times.
 * Anchors: "<scene>.start", "<scene>.end", "<scene>#<n>.start|.end" (n-th line of the scene, 0-based),
 * "<scene>+12.5" (scene time), or a named event; each may be followed by "+s" / "-s".
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildTimeline } from '../../src/engine/story/timeline';
import type { StoryLine } from '../../src/engine/story/types';

const [course, prod] = process.argv.slice(2);
const story = JSON.parse(readFileSync(join('src/content/courses', course, 'story/story.json'), 'utf8'));
const snd = JSON.parse(readFileSync(join(prod, 'sound.json'), 'utf8'));
const tl = buildTimeline(story.lines as StoryLine[]);
const scenes = story.scenes.map((s: { id: string; title: string }) => ({ id: s.id, title: s.title, start: tl.start[s.id], end: tl.end[s.id] }));
const lines = tl.lines.map((l, i) => {
  const n = tl.lines.slice(0, i).filter((x) => x.scene === l.scene).length;
  return { i, id: `${l.scene}#${n}`, scene: l.scene, who: l.who, text: l.text, t0: +l.t0.toFixed(3), t1: +l.t1.toFixed(3), bytes: l.bytes };
});
const anchors: Record<string, number> = {};
for (const s of scenes) { anchors[`${s.id}.start`] = s.start; anchors[`${s.id}.end`] = s.end; anchors[s.id] = s.start; }
for (const l of lines) { anchors[`${l.id}.start`] = l.t0; anchors[`${l.id}.end`] = l.t1; anchors[l.id] = l.t0; }
const resolve = (ex: string | number): number => {
  if (typeof ex === 'number') return ex;
  const m = /^\s*([A-Za-z0-9_#.]+?)\s*(?:([+-])\s*([0-9.]+))?\s*$/.exec(ex);
  if (!m || !(m[1] in anchors)) throw new Error(`unknown anchor: ${ex}`);
  return +(anchors[m[1]] + (m[3] ? (m[2] === '-' ? -1 : 1) * +m[3] : 0)).toFixed(3);
};
const events: Record<string, number> = {};
for (const [k, ex] of Object.entries(snd.events ?? {})) { events[k] = resolve(ex as string); anchors[k] = events[k]; }
const sfx: Record<string, unknown>[] = [];
for (const c of snd.sfx ?? []) {
  const at = resolve(c.at); const n = c.repeat ?? 1;
  for (let k = 0; k < n; k++) { const e = { ...c, t: +(at + k * (c.every ?? 0)).toFixed(3) }; delete e.at; delete e.repeat; delete e.every; sfx.push(e); }
}
const span = (list: Record<string, unknown>[]) => list.map((b) => ({ ...b, t0: resolve(b.from as string), t1: resolve(b.to as string) }));
const out = { course, total: tl.total, scenes, lines, events, sfx: sfx.sort((a, b) => (a.t as number) - (b.t as number)), bgm: span(snd.bgm ?? []), ambience: span(snd.ambience ?? []) };
writeFileSync(join(prod, 'timeline.json'), JSON.stringify(out, null, 1));
console.log(`timeline: ${tl.total.toFixed(1)} s, ${lines.length} lines, ${sfx.length} sfx, ${out.bgm.length} music cues, ${out.ambience.length} ambiences`);
