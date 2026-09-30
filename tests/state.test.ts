import { describe, expect, it } from 'vitest';
import { ProgressStore, dayKey } from '../src/state/store';
import { MemoryRepository, migrate } from '../src/state/storage';
import { byChapter, overall, reviewSet, studyTime, todaysPlan, weakChapters, wrongQuestions } from '../src/state/analytics';
import type { Course } from '../src/content/types';
import single from '../src/content/courses/histology-cytoplasm/questions/single.json';
import meta from '../src/content/courses/histology-cytoplasm/course.json';
import slides from '../src/content/courses/histology-cytoplasm/slides.json';

const course = { ...meta, questions: single, slides } as unknown as Course;

describe('ProgressStore', () => {
  it('records answers, aggregates per question, and persists', async () => {
    const repo = new MemoryRepository();
    let now = 1_700_000_000_000;
    const st = new ProgressStore(repo, 'c', () => now);
    st.answer('q001', 'single', false, [0]);
    now += 1000;
    st.answer('q001', 'single', true, [2], true);
    st.flush();
    const s = repo.loadLocal('c');
    expect(s.answers).toHaveLength(2);
    expect(s.questions.q001).toEqual({ attempts: 2, correct: 1, lastCorrect: true, lastAt: now, reviews: 1 });
  });
  it('tracks study time per day and page, lectures and animations', () => {
    const repo = new MemoryRepository();
    const now = Date.now();
    const st = new ProgressStore(repo, 'c', () => now);
    st.addStudyTime('chapter:1', 90);
    st.lectureProgress(1, 30, 600, 30);
    st.lectureProgress(1, 20, 600, 5);
    st.animationProgress('sec', 0.5, { play: true });
    const s = st.get();
    expect(s.studyLog[dayKey(now)]).toBe(90);
    expect(s.pages['chapter:1'].seconds).toBe(90);
    expect(s.lectures[1]).toMatchObject({ position: 20, maxPosition: 30, seconds: 35, completed: false });
    expect(s.animations.sec).toMatchObject({ plays: 1, maxProgress: 0.5 });
  });
  it('migrates unknown / corrupt data safely', () => {
    expect(migrate(null, 'x').answers).toEqual([]);
    expect(migrate({ version: 99 }, 'x').version).toBe(1);
    expect(migrate({ version: 1, settings: { theme: 'light' } }, 'x').settings.subtitles).toBe(true);
  });
});

describe('analytics', () => {
  const repo = new MemoryRepository();
  const st = new ProgressStore(repo, 'c');
  // chapter 1: all wrong; chapter 2: all right
  single.filter((q) => q.chapter === 1).forEach((q) => st.answer(q.id, 'single', false, [0]));
  single.filter((q) => q.chapter === 2).forEach((q) => st.answer(q.id, 'single', true, [0]));
  const s = st.get();

  it('computes overall and per-chapter accuracy from the latest attempt', () => {
    const o = overall(course, s);
    expect(o.total).toBe(110);
    expect(o.answered).toBe(22);
    expect(o.pct).toBe(Math.round((10 / 22) * 100));
    const c = byChapter(course, s);
    expect(c[0].pct).toBe(0);
    expect(c[1].pct).toBe(100);
    expect(weakChapters(course, s)[0].chapter.id).toBe(1);
  });
  it('builds a review set: wrong questions first, capped', () => {
    const r = reviewSet(course, s, 12);
    expect(r.questions).toHaveLength(12);
    expect(r.questions.every((q) => q.chapter === 1)).toBe(true);
    expect(wrongQuestions(course, s)).toHaveLength(12);
  });
  it('plans today with review first', () => {
    expect(todaysPlan(course, s)[0].kind).toBe('review');
  });
  it('counts a study streak', () => {
    const now = Date.now();
    const log = { [dayKey(now)]: 120, [dayKey(now - 86400000)]: 300, [dayKey(now - 3 * 86400000)]: 300 };
    expect(studyTime({ ...s, studyLog: log }, now).streak).toBe(2);
  });
});
