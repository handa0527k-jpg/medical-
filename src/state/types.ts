/** Persisted learning history for one course. Versioned for migrations. */
export interface ProgressState {
  version: 1;
  courseId: string;
  /** chapter id → time marked as read */
  read: Record<number, number>;
  /** page key (e.g. "chapter:3", "figure:cell") → visits and time */
  pages: Record<string, { visits: number; last: number; seconds: number }>;
  /** every answer ever given, newest last */
  answers: AnswerRecord[];
  /** per-question aggregate */
  questions: Record<string, QuestionStat>;
  lectures: Record<number, LectureStat>;
  animations: Record<string, AnimationStat>;
  /** finished review sessions (弱点復習 / 間違えた問題) */
  reviews: ReviewSession[];
  /** YYYY-MM-DD → seconds studied */
  studyLog: Record<string, number>;
  recent: RecentItem[];
  settings: Settings;
}

export type QuestionType = 'single' | 'judgement' | 'animation';

export interface AnswerRecord {
  qid: string;
  type: QuestionType;
  correct: boolean;
  /** chosen option indices (original order) */
  choice: number[];
  at: number;
  /** true when answered inside a review session */
  review: boolean;
}

export interface QuestionStat {
  attempts: number;
  correct: number;
  lastCorrect: boolean;
  lastAt: number;
  /** times it was answered in review mode */
  reviews: number;
}

export interface LectureStat {
  position: number;
  maxPosition: number;
  total: number;
  completed: boolean;
  seconds: number;
  lastAt: number;
}

export interface AnimationStat {
  plays: number;
  completed: number;
  maxProgress: number;
  seconds: number;
  lastAt: number;
}

export interface ReviewSession {
  at: number;
  label: string;
  qids: string[];
  correct: number;
  total: number;
}

export interface RecentItem {
  kind: 'chapter' | 'lecture' | 'animation' | 'figure' | 'quiz' | 'zukan';
  id: string;
  label: string;
  at: number;
}

export type ThemePref = 'dark' | 'light' | 'system';

export interface Settings {
  theme: ThemePref;
  voiceURI: string | null;
  subtitles: boolean;
  narration: boolean;
  volume: number;
  lectureSpeed: number;
  /** playback speed of story and mechanism animations */
  animSpeed: number;
  autoPause: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  voiceURI: null,
  subtitles: true,
  narration: true,
  volume: 1,
  lectureSpeed: 1,
  animSpeed: 1,
  autoPause: true,
};

export const emptyProgress = (courseId: string): ProgressState => ({
  version: 1,
  courseId,
  read: {},
  pages: {},
  answers: [],
  questions: {},
  lectures: {},
  animations: {},
  reviews: [],
  studyLog: {},
  recent: [],
  settings: { ...DEFAULT_SETTINGS },
});
