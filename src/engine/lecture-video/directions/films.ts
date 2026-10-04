/**
 * The finished films (完成版): one hand-directed film per lecture, the whole lecture in its own order.
 * Key = `${course}:${lecture}:film`.
 */
import type { SceneDef } from '../types';
import { FILM_KEY as FILM1, FILM_RATIONALE as RATIONALE1, lecture1Film } from './lecture1';
import { FILM2_KEY as FILM2, FILM2_RATIONALE as RATIONALE2, lecture2Film } from './lecture2';

export interface FilmDef { key: string; course: string; lecture: number; scenes: () => SceneDef[]; rationale: string[] }

export const FILMS: FilmDef[] = [
  { key: FILM1, course: 'genetics-basics', lecture: 1, scenes: lecture1Film, rationale: RATIONALE1 },
  { key: FILM2, course: 'genetics-basics', lecture: 2, scenes: lecture2Film, rationale: RATIONALE2 },
];

export const filmKey = (course: string, lecture: number) => `${course}:${lecture}:film`;
export const filmOf = (key: string) => FILMS.find((f) => f.key === key);
export const filmsOf = (course: string) => FILMS.filter((f) => f.course === course);
