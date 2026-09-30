/**
 * Course registry. Every folder in ./courses with an index.ts default-exporting
 * a Course is picked up automatically — adding a lecture never touches app code.
 */
import type { Course } from './types';

const modules = import.meta.glob<{ default: Course }>('./courses/*/index.ts', { eager: true });

export const COURSES: Course[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.lecture.number - b.lecture.number);

export const getCourse = (id: string) => COURSES.find((c) => c.id === id);
export const DEFAULT_COURSE = COURSES[0];

const KEY = 'medstudy:course';
export function selectedCourse(): Course {
  try { return getCourse(JSON.parse(localStorage.getItem(KEY) || 'null')) ?? DEFAULT_COURSE; } catch { return DEFAULT_COURSE; }
}
export function selectCourse(id: string) {
  try { localStorage.setItem(KEY, JSON.stringify(id)); } catch { /* ignore */ }
}
