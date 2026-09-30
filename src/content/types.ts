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
  /** how the metaphor is labelled in the UI (default: 工場メタファー / FACTORY / 工場での役割) */
  metaphorLabel?: { name: string; en: string; role: string; in: string };
  /** emphasised tail of the subtitle on the home hero (e.g. 工場。) */
  subtitleEm?: string;
  /** home-screen map: section title and legend */
  map?: { title: string; legend: { label: string; color: string }[] };
  /** intro lines for the figure / zukan pages */
  intros?: { figures?: string; zukan?: string };
  /** label of ZukanEntry.membranes (default 膜) */
  zukanTag?: string;
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
  /** for wrong options: the kind of mistake choosing it reveals (used by 弱点分析) */
  trap?: TrapKind;
}

/** Why a wrong option is tempting — the reasoning error it catches. */
export type TrapKind = 'swap' | 'reverse' | 'number' | 'scope' | 'mechanism' | 'fact';
export const TRAP_LABEL: Record<TrapKind, { name: string; advice: string }> = {
  swap: { name: '用語・概念の取り違え', advice: '似た用語（転写/翻訳、ヌクレオシド/ヌクレオチドなど）を対にして、違いを一言で言えるようにしましょう。' },
  reverse: { name: '向き・順序・大小の逆転', advice: '矢印の向き（5\'→3\'、DNA→RNA）や順番・大小関係を、図を描いて確認しましょう。' },
  number: { name: '数値・個数の取り違え', advice: '数値は「何の数か」とセットで覚え直しましょう（46本、23対、37遺伝子、約1.3%など）。' },
  scope: { name: '範囲・例外の見落とし', advice: '「すべて」「〜だけ」「必ず」などの言い切りに注意し、例外を思い出す習慣をつけましょう。' },
  mechanism: { name: '因果・機序の誤解', advice: '「なぜそうなるのか」を一文で説明できるか確認しましょう。授業の該当場面に戻るのが近道です。' },
  fact: { name: '記載と異なる事実', advice: '講義資料（スライド）の記載そのものを確認しましょう。赤シートで隠して言えるかを試すのが効果的です。' },
};

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
