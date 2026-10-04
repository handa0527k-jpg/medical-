/**
 * Course: 遺伝医学｜転写（機構と疾患）
 * Slide numbers are the page numbers of the lecture PDF (R080928 転写（機構と疾患）講義資料).
 */
import type { AnimationMeta, ChapterText, Course, CourseMeta, Figure, FigureDetail, JudgementQuestion, SingleQuestion, Slide, ZukanEntry } from '../../types';
import type { AnimDef, AnimScript } from '../../../engine/animation/types';
import type { Lecture } from '../../../engine/lecture/types';
import { buildMacroSvg } from '../../../engine/animation/macro';
import meta from './course.json';
import text from './textbook.json';
import slides from './slides.json';
import single from './questions/single.json';
import judgement from './questions/judgement.json';
import zukan from './zukan.json';
import figures from './figures/figures.json';
import details from './figures/details.json';
import animMeta from './animations/meta.json';
import scripts from './animations/scripts.json';
import mapSvg from './map.svg?raw';

const narrations = import.meta.glob<{ default: Lecture }>('./narrations/lecture-*.json');
/** one file per mechanism animation: animations/<id>.ts (drawing code); titles and steps in meta.json / scripts.json */
const defs = import.meta.glob<{ default: AnimDef }>('./animations/*.ts', { eager: true });
const defOf = (id: string) => defs[`./animations/${id}.ts`]?.default;
const figs = figures as unknown as Record<string, Figure>;
let macro: string | null = null;

const course: Course = {
  ...(meta as unknown as CourseMeta),
  text: text as unknown as Record<number, ChapterText>,
  slides: slides as unknown as Record<number, Slide>,
  questions: single as unknown as SingleQuestion[],
  judgements: judgement as unknown as JudgementQuestion[],
  zukan: zukan as ZukanEntry[],
  figures: figs,
  figureDetails: details as Record<string, Record<string, FigureDetail>>,
  animations: Object.fromEntries(
    Object.entries(animMeta as unknown as Record<string, AnimationMeta>)
      .filter(([k]) => defOf(k))
      .map(([k, m]) => [k, { meta: m, script: (scripts as unknown as Record<string, AnimScript>)[k], def: defOf(k)! }]),
  ),
  loadLecture: async (chapter: number) => {
    const key = `./narrations/lecture-${String(chapter).padStart(2, '0')}.json`;
    const load = narrations[key];
    if (!load) throw new Error(`lecture ${chapter} not found`);
    return (await load()).default;
  },
  mapSvg,
  assetBase: `${import.meta.env.BASE_URL}courses/genetics-transcription/`,
  macroSvg: () => (macro ??= buildMacroSvg(figs.cell?.svg ?? '<svg></svg>')),
  story: () => import('./story').then((m) => m.default),
};

export default course;
