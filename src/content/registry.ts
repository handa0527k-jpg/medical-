/**
 * Course registry. Every folder in ./courses with a course.json and an index.ts
 * default-exporting a Course is picked up automatically — adding a lecture never
 * touches app code.
 *
 * Only the small course.json files are bundled eagerly (for the course picker);
 * each course's content (textbook, questions, figures, animations) is a separate
 * chunk that is loaded when that course is opened.
 */
import type { Course, CourseMeta, CourseStats } from './types';
import { CATEGORIES } from './categories';

const metas = import.meta.glob<CourseMeta>('./courses/*/course.json', { eager: true, import: 'default' });
const statsFiles = import.meta.glob<CourseStats>('./courses/*/stats.json', { eager: true, import: 'default' });
const loaders = import.meta.glob<{ default: Course }>('./courses/*/index.ts');

const dirOf = (path: string) => path.split('/')[2];

/** Lightweight descriptions of every course, in lecture order. */
export const COURSES: CourseMeta[] = Object.values(metas).sort((a, b) => a.lecture.number - b.lecture.number);
export const DEFAULT_COURSE_ID = COURSES[0].id;

const EMPTY_STATS: CourseStats = { lectures: [], single: {}, judgement: {}, figures: 0, animations: 0, zukan: 0 };
const statsById: Record<string, CourseStats> = Object.fromEntries(
  Object.entries(metas).map(([path, m]) => [m.id, statsFiles[path.replace('course.json', 'stats.json')] ?? EMPTY_STATS]),
);
/** Lecture lengths, question ids and counts of a course (no content download). */
export const courseStats = (id: string): CourseStats => statsById[id] ?? EMPTY_STATS;

/** Courses listed under a category (its own courses first, then those that are also filed there). */
export const coursesIn = (categoryId: string) => [
  ...COURSES.filter((c) => c.category === categoryId),
  ...COURSES.filter((c) => c.category !== categoryId && c.alsoIn?.includes(categoryId)),
];
/** The category a course is filed under (falls back to その他). */
export const categoryOf = (c: CourseMeta) => CATEGORIES.find((x) => x.id === c.category) ?? CATEGORIES[CATEGORIES.length - 1];

const loaderById: Record<string, () => Promise<{ default: Course }>> = Object.fromEntries(
  Object.entries(loaders).map(([path, load]) => [metas[`./courses/${dirOf(path)}/course.json`]?.id ?? dirOf(path), load]),
);

/** Load one course's full content. */
export async function loadCourse(id: string): Promise<Course> {
  const load = loaderById[id] ?? loaderById[DEFAULT_COURSE_ID];
  return (await load()).default;
}

const KEY = 'medstudy:course';
/** The course the learner picked last (falls back to the first course). */
export function selectedCourseId(): string {
  try {
    const id = JSON.parse(localStorage.getItem(KEY) || 'null');
    return typeof id === 'string' && loaderById[id] ? id : DEFAULT_COURSE_ID;
  } catch {
    return DEFAULT_COURSE_ID;
  }
}
export function selectCourse(id: string) {
  try { localStorage.setItem(KEY, JSON.stringify(id)); } catch { /* ignore */ }
}

/** The course metaphor's word ("細胞＝工場" → "工場"), used in UI copy. */
export const metaphorWord = (c: { metaphor: string }) => c.metaphor.split('＝').pop() || c.metaphor;
