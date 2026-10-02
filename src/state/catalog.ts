/**
 * Progress across courses, for the home screen and the category pages.
 * Works from CourseMeta + stats.json only, so no course content is downloaded;
 * the numbers match analytics.mastery() for the open course.
 */
import { useMemo } from 'react';
import { COURSES, courseStats } from '../content/registry';
import type { CourseMeta, CourseStats } from '../content/types';
import { useCourse } from '../app/course';
import { useProgress } from './hooks';
import { LocalStorageRepository } from './storage';
import type { LectureStat, ProgressState } from './types';

export type Status = 'new' | 'active' | 'done';
export const STATUS_LABEL: Record<Status, string> = { new: '未学習', active: '学習中', done: '完了' };
export const LECTURE_STATUS_LABEL: Record<Status, string> = { new: '未視聴', active: '学習中', done: '完了' };

export function lectureStatus(l: LectureStat | undefined): { status: Status; pct: number } {
  if (!l) return { status: 'new', pct: 0 };
  if (l.completed) return { status: 'done', pct: 100 };
  const pct = Math.round(Math.min(1, l.maxPosition / Math.max(1, l.total)) * 100);
  return { status: pct > 0 || l.seconds > 0 ? 'active' : 'new', pct };
}

export interface CourseProgress {
  meta: CourseMeta;
  stats: CourseStats;
  /** the course's saved learning history */
  s: ProgressState;
  /** 0–100: reading, lectures and quiz accuracy weighted equally */
  pct: number;
  status: Status;
  lectures: number;
  lecturesDone: number;
  minutes: number;
  questions: number;
  answered: number;
  correct: number;
  wrong: number;
  read: number;
  /** the lecture to take next (first not completed), null when all done */
  next: number | null;
  /** last time anything was studied (ms), 0 = never */
  lastAt: number;
}

export function courseProgress(meta: CourseMeta, stats: CourseStats, s: ProgressState): CourseProgress {
  const n = meta.chapters.length;
  const read = meta.chapters.filter((c) => s.read[c.id]).length;
  const lec = meta.chapters.map((c) => s.lectures[c.id]);
  const watched = lec.reduce((a, l) => a + (l ? Math.min(1, l.maxPosition / Math.max(1, l.total)) : 0), 0);
  const ids = Object.values(stats.single).flat();
  const answered = ids.filter((id) => s.questions[id]);
  const correct = answered.filter((id) => s.questions[id].lastCorrect).length;
  const pct = Math.round(((read / n + watched / n + correct / Math.max(1, ids.length)) / 3) * 100);
  const lecturesDone = lec.filter((l) => l?.completed).length;
  const touched = read > 0 || answered.length > 0 || lec.some((l) => l && (l.maxPosition > 0 || l.seconds > 0)) || s.recent.length > 0;
  const status: Status = lecturesDone === n && n > 0 ? 'done' : touched ? 'active' : 'new';
  const nextCh = meta.chapters.find((c) => !s.lectures[c.id]?.completed);
  const lastAt = Math.max(0, ...s.recent.map((r) => r.at), ...lec.map((l) => l?.lastAt || 0));
  return {
    meta, stats, s, pct, status, lectures: n, lecturesDone,
    minutes: stats.lectures.reduce((a, l) => a + l.minutes, 0),
    questions: ids.length, answered: answered.length, correct, wrong: answered.length - correct, read,
    next: nextCh ? nextCh.id : null, lastAt,
  };
}

const repo = new LocalStorageRepository();

/** Progress of every course: the open one live from the store, the others from local storage. */
export function useCatalog(): Record<string, CourseProgress> {
  const open = useCourse();
  const live = useProgress();
  return useMemo(
    () => Object.fromEntries(COURSES.map((m) => [m.id, courseProgress(m, courseStats(m.id), m.id === open.id ? live : repo.loadLocal(m.id))])),
    [open.id, live],
  );
}

/** Category summary: course count, average progress and status. */
export function categorySummary(list: CourseProgress[]) {
  if (!list.length) return { count: 0, pct: 0, status: 'new' as Status, lectures: 0, minutes: 0 };
  const pct = Math.round(list.reduce((a, c) => a + c.pct, 0) / list.length);
  const status: Status = list.every((c) => c.status === 'done') ? 'done' : list.some((c) => c.status !== 'new') ? 'active' : 'new';
  return { count: list.length, pct, status, lectures: list.reduce((a, c) => a + c.lectures, 0), minutes: list.reduce((a, c) => a + c.minutes, 0) };
}
