import { createContext, useContext } from 'react';
import type { Course } from '../content/types';

export const CourseContext = createContext<Course | null>(null);

export function useCourse(): Course {
  const c = useContext(CourseContext);
  if (!c) throw new Error('Course missing');
  return c;
}
