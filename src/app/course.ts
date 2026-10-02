import { createContext, useContext } from 'react';
import type { Course } from '../content/types';

export const CourseContext = createContext<Course | null>(null);

export function useCourse(): Course {
  const c = useContext(CourseContext);
  if (!c) throw new Error('Course missing');
  return c;
}

/** Opens another course in place (downloads its content, then re-renders the app). */
export const SwitchCourseContext = createContext<(id: string) => Promise<void>>(async () => {});
export const useSwitchCourse = () => useContext(SwitchCourseContext);
