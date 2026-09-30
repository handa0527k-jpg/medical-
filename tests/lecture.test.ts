import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cueAt, timeLecture } from '../src/engine/lecture/timing';
import type { Lecture } from '../src/engine/lecture/types';

const dir = resolve(__dirname, '../src/content/courses/histology-cytoplasm/narrations');
const lectures: Lecture[] = readdirSync(dir).map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')));

describe('lecture narration', () => {
  it('exists for all 9 chapters with all 8 sections', () => {
    expect(lectures).toHaveLength(9);
    for (const l of lectures) expect(new Set(l.shots.map((s) => s.section)).size).toBe(8);
  });
  it('has unique cue ids, speech text for every cue and no raw symbols in speech', () => {
    const ids = new Set<string>();
    for (const l of lectures) for (const c of l.cues) {
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      expect(c.speech.length).toBeGreaterThan(0);
      expect(c.speech).not.toMatch(/[<>→⇒（）()「」“”＝／]/);
    }
  });
  it('speaks in lecture style (です・ます) rather than reading the textbook', () => {
    const txt = lectures.flatMap((l) => l.cues.map((c) => c.text.replace(/<[^>]+>/g, '')));
    const plain = txt.filter((t) => /(だ|である)。$/.test(t));
    expect(plain.length).toBeLessThan(txt.length * 0.01);
    expect(txt.some((t) => /見てください/.test(t))).toBe(true); // gaze guidance
  });
  it('never repeats the same line twice in a row', () => {
    for (const l of lectures) for (let i = 1; i < l.cues.length; i++) expect(l.cues[i].text).not.toBe(l.cues[i - 1].text);
  });
  it('lays out a monotonic timeline and uses recorded durations when given', () => {
    const l = lectures[0];
    const tl = timeLecture(l);
    for (let i = 1; i < tl.cues.length; i++) expect(tl.cues[i].t0).toBeCloseTo(tl.cues[i - 1].t1);
    expect(cueAt(tl, 0).id).toBe(l.cues[0].id);
    expect(cueAt(tl, tl.total + 5).id).toBe(l.cues[l.cues.length - 1].id);
    const rec = timeLecture(l, { voice: 'test', version: l.version, cues: { [l.cues[0].id]: { src: 'a.mp3', duration: 10 } } });
    expect(rec.cues[0].d).toBeCloseTo(10 + l.cues[0].gap);
    const stale = timeLecture(l, { voice: 'test', version: l.version - 1, cues: { [l.cues[0].id]: { src: 'a.mp3', duration: 10 } } });
    expect(stale.cues[0].d).toBeCloseTo(l.cues[0].dur + l.cues[0].gap);
  });
});
