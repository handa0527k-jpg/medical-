import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cueAt, timeLecture } from '../src/engine/lecture/timing';
import type { Lecture } from '../src/engine/lecture/types';

const root = resolve(__dirname, '../src/content/courses');
// prep-school style courses (the genetics course uses the blackboard format and has its own tests)
const byCourse: Record<string, Lecture[]> = Object.fromEntries(
  readdirSync(root).filter((id) => !id.startsWith('genetics')).map((id) => [id, readdirSync(resolve(root, id, 'narrations')).map((f) => JSON.parse(readFileSync(resolve(root, id, 'narrations', f), 'utf8')))]),
);
const lectures: Lecture[] = Object.values(byCourse).flat();
const chapters = (id: string) => JSON.parse(readFileSync(resolve(root, id, 'course.json'), 'utf8')).chapters.length as number;

describe('lecture narration', () => {
  it('exists for every chapter of every course as authored lessons (goals → map → themes → summary → final problem)', () => {
    for (const [id, ls] of Object.entries(byCourse)) expect(ls).toHaveLength(chapters(id));
    for (const l of lectures) {
      expect(l.authored).toBe(true);
      const kinds = l.shots.map((s) => s.visual.kind);
      expect(kinds).toContain('roadmap');
      expect(kinds).toContain('chalk');
      expect(l.quizzes?.some((q) => q.variant === 'final')).toBe(true);
      expect(l.quizzes?.some((q) => q.variant === 'typical')).toBe(true);
    }
  });
  it('gives thinking time before every explanation and never shows the answer on the question screen', () => {
    for (const l of lectures) for (const q of l.quizzes ?? []) {
      const phases = l.shots.filter((s) => s.visual.kind === 'quiz' && s.visual.qid === q.qid).map((s) => (s.visual as { phase: string }).phase);
      expect(phases).toEqual(['ask', 'think', 'explain']);
    }
  });
  it('has unique cue ids within a course, speech text for every cue and no raw symbols in speech', () => {
    for (const ls of Object.values(byCourse)) {
      const ids = new Set<string>();
      for (const l of ls) for (const c of l.cues) { expect(ids.has(c.id)).toBe(false); ids.add(c.id); }
    }
    for (const l of lectures) for (const c of l.cues) {
      if (c.text !== '（考える時間）') expect(c.speech.length).toBeGreaterThan(0);
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
