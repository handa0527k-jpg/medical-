import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/content/categories';
import { COURSES, courseStats, coursesIn } from '../src/content/registry';
import { categorySummary, courseProgress, lectureStatus } from '../src/state/catalog';
import { emptyProgress } from '../src/state/types';

const emb = COURSES.find((c) => c.id === 'embryology-early')!;

describe('catalog', () => {
  it('files every course under a known field; histology courses also appear under cell biology', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const c of COURSES) expect(ids.has(c.category)).toBe(true);
    expect(coursesIn('histology').map((c) => c.id)).toEqual(['histology-cytoplasm', 'histology-nucleus', 'histology-epithelium']);
    expect(coursesIn('cell').map((c) => c.id)).toEqual(['histology-cytoplasm', 'histology-nucleus']);
    expect(coursesIn('pharmacology')).toEqual([]);
  });

  it('stats.json matches the course (lectures and questions)', () => {
    const st = courseStats(emb.id);
    expect(st.lectures).toHaveLength(emb.chapters.length);
    expect(Object.values(st.single).flat()).toHaveLength(88);
    expect(st.lectures.every((l) => l.minutes > 5 && l.audio)).toBe(true);
  });

  it('lecture status: 未視聴 → 学習中 → 完了', () => {
    expect(lectureStatus(undefined)).toEqual({ status: 'new', pct: 0 });
    expect(lectureStatus({ position: 50, maxPosition: 50, total: 100, completed: false, seconds: 50, lastAt: 1 })).toEqual({ status: 'active', pct: 50 });
    expect(lectureStatus({ position: 100, maxPosition: 100, total: 100, completed: true, seconds: 100, lastAt: 1 }).status).toBe('done');
  });

  it('course progress weighs reading, lectures and quiz accuracy equally (like mastery)', () => {
    const s = emptyProgress(emb.id);
    const p0 = courseProgress(emb, courseStats(emb.id), s);
    expect(p0).toMatchObject({ pct: 0, status: 'new', next: 1, lecturesDone: 0 });
    const n = emb.chapters.length;
    for (const c of emb.chapters) s.lectures[c.id] = { position: 1, maxPosition: 1, total: 1, completed: true, seconds: 1, lastAt: 1 };
    for (const c of emb.chapters) s.read[c.id] = 1;
    const p1 = courseProgress(emb, courseStats(emb.id), s);
    expect(p1.status).toBe('done');
    expect(p1.next).toBeNull();
    expect(p1.pct).toBe(Math.round((2 / 3) * 100)); // no questions answered yet
    expect(p1.lecturesDone).toBe(n);
    expect(categorySummary([p0, p1])).toMatchObject({ count: 2, pct: Math.round(p1.pct / 2), status: 'active' });
  });
});
