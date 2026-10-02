/**
 * Course: 人体発生学｜初期発生と系統発生 (lecture PDF, slides 5–51).
 * Assembles the JSON content files + animation drawing code into a Course.
 */
import type { AnimationMeta, ChapterText, Course, CourseMeta, Figure, FigureDetail, JudgementQuestion, SingleQuestion, Slide, ZukanEntry } from '../../types';
import type { AnimScript } from '../../../engine/animation/types';
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
import { ANIM_DEFS } from './animations/defs';

const narrations = import.meta.glob<{ default: Lecture }>('./narrations/lecture-*.json');

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
    Object.entries(animMeta as unknown as Record<string, AnimationMeta>).map(([k, m]) => [
      k,
      { meta: m, script: (scripts as unknown as Record<string, AnimScript>)[k], def: ANIM_DEFS[k] },
    ]),
  ),
  loadLecture: async (chapter: number) => {
    const key = `./narrations/lecture-${String(chapter).padStart(2, '0')}.json`;
    const load = narrations[key];
    if (!load) throw new Error(`lecture ${chapter} not found`);
    return (await load()).default;
  },
  mapSvg,
  assetBase: `${import.meta.env.BASE_URL}courses/embryology-early/`,
  // no whole-cell overview figure in this course: the tissue backdrop is drawn without one
  macroSvg: () => (macro ??= buildMacroSvg('<svg></svg>')),
  story: () => import('./story').then((m) => m.default),
};

export default course;
