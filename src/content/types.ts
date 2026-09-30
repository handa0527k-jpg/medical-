/**
 * Content model. A "course" = one lecture PDF turned into an interactive unit.
 * Every piece of learning content is plain data (JSON) that conforms to these
 * types, so a new lecture can be added by dropping a new folder under
 * src/content/courses/<id>/ (see docs/ADDING_A_COURSE.md).
 */
import type { AnimDef, AnimScript } from '../engine/animation/types';
import type { Lecture } from '../engine/lecture/types';

/** Inline HTML subset used in content: <b>, <sup>, <sub>, <em>, <br>. */
export type RichText = string;

export interface CourseMeta {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  lecture: { label: string; number: number; slideRange: [number, number] };
  metaphor: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: number;
  name: string;
  /** role of this part in the course metaphor (e.g. 工場の門) */
  role: string;
  slides: number[];
  /** learning goals */
  points: RichText[];
  overview: {
    one: RichText;
    flow: RichText[];
    /** [medical name, metaphor role, description] */
    cast: [RichText, RichText, RichText][];
  };
  figures: string[];
  animations: string[];
}

export type TextBlock =
  | { type: 'lead'; html: RichText }
  | { type: 'heading'; html: RichText; slides: number[] }
  | { type: 'paragraph'; html: RichText }
  | { type: 'analogy'; html: RichText }
  /** knowledge that is NOT in the lecture material (clinical links etc.) — always labelled as such */
  | { type: 'supplement'; html: RichText }
  | { type: 'misconception'; html: RichText }
  | { type: 'column'; title: RichText; html: RichText }
  | { type: 'slide'; slide: number }
  | { type: 'steps'; items: RichText[] }
  | { type: 'table'; rows: RichText[][] };

export interface ChapterText {
  blocks: TextBlock[];
  summary: RichText[];
}

/** Normalised rectangle on a slide image: [x0, y0, x1, y1] in 0..1 */
export type Box = [number, number, number, number];

export interface Slide {
  n: number;
  chapter: number;
  title: string;
  keyPoint: RichText;
  /** red-sheet masks over the key terms */
  masks: Box[];
  selfCheck: { q: RichText; a: RichText; hint: RichText; hot: boolean }[];
  /** path relative to the course's public folder */
  image: string;
}

export type Difficulty = 1 | 2 | 3;
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: '基本', 2: '標準', 3: '発展' };

/** One-best-answer question. Always exactly 5 options (A–E). */
export interface SingleQuestion {
  id: string;
  slide: number;
  chapter: number;
  /** 重要事項 (key fact) or 理解・統合 (understanding / integration) */
  kind: string;
  difficulty: Difficulty;
  stem: RichText;
  options: [QOption, QOption, QOption, QOption, QOption];
  explanation: RichText;
  /** the key point / trap this question tests */
  point: RichText;
  tags: string[];
}
export interface QOption {
  text: RichText;
  explanation: RichText;
  correct: boolean;
}

/** “Choose all true / all false” among 5 statements (A–E). */
export interface JudgementQuestion {
  id: string;
  slide: number;
  chapter: number;
  topic: string;
  ask: 'true' | 'false';
  statements: { text: RichText; isTrue: boolean; note: RichText }[];
  boxes: Box[];
  figureBoxes: Box[];
}

export interface ZukanEntry {
  id: string;
  name: string;
  metaphor: string;
  icon: string;
  chapter: number;
  analogy: RichText;
  roles: RichText[];
  facts: RichText[];
  membranes: string;
}

export interface Figure {
  id: string;
  title: string;
  en: string;
  hint: string;
  set: string;
  sources: number[];
  /** inline SVG; hotspots are <g class="hs" data-k="…"> */
  svg: string;
}
export interface FigureDetail {
  name: RichText;
  role: RichText;
  text: RichText;
  sources: number[];
}

export interface AnimationMeta {
  id: string;
  title: string;
  en: string;
  chapter: number;
  sources: number[];
  description: RichText;
  modes: [string, string][] | null;
}

export interface Animation {
  meta: AnimationMeta;
  script: AnimScript;
  def: AnimDef;
}

export interface Course extends CourseMeta {
  text: Record<number, ChapterText>;
  slides: Record<number, Slide>;
  questions: SingleQuestion[];
  judgements: JudgementQuestion[];
  zukan: ZukanEntry[];
  figures: Record<string, Figure>;
  figureDetails: Record<string, Record<string, FigureDetail>>;
  animations: Record<string, Animation>;
  /** lecture narrations are code-split and loaded on demand */
  loadLecture: (chapter: number) => Promise<Lecture>;
  /** cell-map SVG used on the home screen */
  mapSvg: string;
  /** base URL of the course's static assets (slides, audio) */
  assetBase: string;
  /** svg markup of the macro "tissue" backdrop used when animations zoom out */
  macroSvg: () => string;
}
