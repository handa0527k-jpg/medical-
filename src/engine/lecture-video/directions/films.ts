/**
 * The finished films (完成版): one hand-directed film per lecture, the whole lecture in its own order.
 * Key = `${course}:${lecture}:film`.
 */
import type { SceneDef } from '../types';
import { FILM_KEY as FILM1, FILM_RATIONALE as RATIONALE1, lecture1Film } from './lecture1';
import { FILM2_KEY as FILM2, FILM2_RATIONALE as RATIONALE2, lecture2Film } from './lecture2';
import { FILM3_KEY as FILM3, FILM3_RATIONALE as RATIONALE3, lecture3Film } from './lecture3';
import { FILM4_KEY as FILM4, FILM4_RATIONALE as RATIONALE4, lecture4Film } from './lecture4';
import { FILM5_KEY as FILM5, FILM5_RATIONALE as RATIONALE5, lecture5Film } from './lecture5';
import { FILM6_KEY as FILM6, FILM6_RATIONALE as RATIONALE6, lecture6Film } from './lecture6';

export interface FilmDef { key: string; course: string; lecture: number; scenes: () => SceneDef[]; rationale: string[] }

export const FILMS: FilmDef[] = [
  { key: FILM1, course: 'genetics-basics', lecture: 1, scenes: lecture1Film, rationale: RATIONALE1 },
  { key: FILM2, course: 'genetics-basics', lecture: 2, scenes: lecture2Film, rationale: RATIONALE2 },
  { key: FILM3, course: 'genetics-basics', lecture: 3, scenes: lecture3Film, rationale: RATIONALE3 },
  { key: FILM4, course: 'genetics-basics', lecture: 4, scenes: lecture4Film, rationale: RATIONALE4 },
  { key: FILM5, course: 'genetics-basics', lecture: 5, scenes: lecture5Film, rationale: RATIONALE5 },
  { key: FILM6, course: 'genetics-basics', lecture: 6, scenes: lecture6Film, rationale: RATIONALE6 },
];

export const filmKey = (course: string, lecture: number) => `${course}:${lecture}:film`;
export const filmOf = (key: string) => FILMS.find((f) => f.key === key);
export const filmsOf = (course: string) => FILMS.filter((f) => f.course === course);
