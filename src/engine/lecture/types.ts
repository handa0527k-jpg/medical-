/**
 * Lecture data model. A lecture is a sequence of shots (what is on screen)
 * each containing cues (one spoken sentence each). The narration generator
 * (scripts/build-narration.ts) writes these as JSON under
 * src/content/courses/<id>/narrations/lecture-NN.json.
 *
 * Timing: `dur` is an estimate from the reading length. When recorded audio
 * exists (public/courses/<id>/audio/lecture-NN/manifest.json), the player
 * re-times every cue from the real audio durations.
 */
import type { RichText } from '../../content/types';
import type { Board } from '../board/types';

export type LectureVisual =
  | { kind: 'title'; chapter: number; name: string; role: string; slides: number[] }
  | { kind: 'end'; chapter: number; name: string }
  | { kind: 'head'; no: number; text: RichText }
  | { kind: 'board'; title: RichText; html: RichText; style?: 'lead' | 'ng' | 'ana' | 'col' | 'sup'; sentences: RichText[] }
  | { kind: 'list'; title: RichText; items: RichText[]; style?: 'goal' | 'sum' | 'exam' }
  | { kind: 'flow'; title: RichText; items: RichText[]; move?: boolean }
  | { kind: 'table'; title: RichText; rows: RichText[][] }
  | { kind: 'cast'; items: [RichText, RichText, RichText][] }
  /** slide image; `tour` = camera visits every mask in order, otherwise it follows the cue focus ("m2") */
  | { kind: 'slide'; slide: number; tour?: boolean }
  /** interactive figure; `key` = highlighted structure (null = whole figure) */
  | { kind: 'figure'; figure: string; key: string | null }
  /** mechanism animation step, driven by lecture time */
  | { kind: 'anim'; anim: string; step: number; hold?: boolean }
  /* ---- prep-school lecture visuals (authored scripts) ---- */
  /** chalkboard that fills in cue by cue: rows are written, then boxed / underlined */
  | { kind: 'chalk'; title: RichText; rows: ChalkRow[]; marks: ChalkMark[] }
  /** the course's cell map with one chapter's zone highlighted (cue focus may move it) */
  | { kind: 'cellmap'; chapter: number }
  /** learning map of today's topics; `current` highlights where we are */
  | { kind: 'roadmap'; title: RichText; items: RichText[]; current?: number }
  | { kind: 'compare'; title: RichText; header: RichText[]; rows: RichText[][] }
  | { kind: 'card'; variant: 'point' | 'pitfall' | 'memo' | 'example'; label: RichText; html: RichText }
  /** 5-choice question on stage: ask → think (countdown, student may answer) → explain */
  | { kind: 'quiz'; qid: string; phase: 'ask' | 'think' | 'explain'; variant: 'check' | 'typical' | 'final'; think?: number; ref?: string[] }
  /** the lecture's persistent blackboard (Lecture.board); camera and chalk follow lecture time */
  | { kind: 'bb' };

export interface ChalkRow {
  /** text; "→" segments are joined with drawn arrows; "A | B" is a two-column comparison */
  text: RichText;
  style: 'row' | 'em' | 'down' | 'vs';
  /** index of the cue (within the shot) at which the row is written */
  at: number;
}
export interface ChalkMark { row: number; type: 'box' | 'under'; at: number }

export interface LecturePause {
  tag: string;
  q?: RichText;
  a?: RichText;
  list?: RichText[];
  html?: RichText;
}

export interface LectureCue {
  id: string;
  shot: number;
  /** subtitle (rich text, as displayed) */
  text: RichText;
  /** what the voice says — kana readings for easily misread terms, no symbols */
  speech: string;
  /** estimated duration in seconds at 1× */
  dur: number;
  /** highlighted item in the visual (sentence / list row / flow node); 'terms' = key terms */
  focus?: number | string;
  /** stop here (auto pause) and show a check card */
  pause?: LecturePause;
  /** extra silence after the cue (seconds) — natural breathing between ideas */
  gap: number;
  /** seconds of chalk work that belong to this cue; the cue lasts at least this long */
  write?: number;
  /** part of the "important points only" digest */
  dig?: 1;
}

export interface LectureShot {
  section: number;
  visual: LectureVisual;
  /** minimum on-screen time (s), e.g. to let the camera visit each highlight */
  min?: number;
}

export interface LectureSection { index: number; name: string }

export interface Lecture {
  chapter: number;
  title: string;
  sections: LectureSection[];
  shots: LectureShot[];
  cues: LectureCue[];
  /** generator version, bump to invalidate recorded audio */
  version: number;
  /** questions asked during the lecture (for the end-of-lecture report) */
  quizzes?: { qid: string; section: number; variant: 'check' | 'typical' | 'final' }[];
  /** true when written by hand (scripts/lessons) rather than generated */
  authored?: boolean;
  /** blackboard lecture: every chalk action of the class */
  board?: Board;
  /** key points shown at the end and in the 5-minute review; `ref` = board ids to highlight */
  keyPoints?: { text: RichText; ref?: string[] }[];
}

/**
 * Recorded narration. Either one file per cue (`src`), or — preferred — one
 * file per lecture (`file`, relative to the manifest) with each cue's byte range.
 */
export interface AudioManifest {
  voice: string;
  version: number;
  file?: string;
  cues: Record<string, { duration: number; src?: string; byteStart?: number; byteLength?: number }>;
}

/* ---------- runtime timing ---------- */
export interface TimedCue extends LectureCue { t0: number; t1: number; d: number }
export interface TimedShot extends LectureShot { index: number; t0: number; t1: number; cues: TimedCue[] }
export interface TimedLecture {
  lecture: Lecture;
  shots: TimedShot[];
  cues: TimedCue[];
  total: number;
  chapters: { index: number; name: string; t0: number }[];
}
