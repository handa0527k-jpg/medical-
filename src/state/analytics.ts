/** Pure, testable derivations over ProgressState + course content. */
import type { Course, SingleQuestion } from '../content/types';
import type { ProgressState } from './types';
import { dayKey } from './store';

export interface Rate { total: number; answered: number; correct: number; pct: number | null }

const rate = (ids: string[], s: ProgressState): Rate => {
  const answered = ids.filter((id) => s.questions[id]);
  const correct = answered.filter((id) => s.questions[id].lastCorrect).length;
  return { total: ids.length, answered: answered.length, correct, pct: answered.length ? Math.round((correct / answered.length) * 100) : null };
};

/** accuracy over the latest attempt of each single-answer question */
export const overall = (c: Course, s: ProgressState) => rate(c.questions.map((q) => q.id), s);

/** accuracy over all attempts (every answer counts) */
export function attemptAccuracy(s: ProgressState) {
  const n = s.answers.length, ok = s.answers.filter((a) => a.correct).length;
  return { attempts: n, correct: ok, pct: n ? Math.round((ok / n) * 100) : null };
}

export const byChapter = (c: Course, s: ProgressState) =>
  c.chapters.map((ch) => ({ chapter: ch, ...rate(c.questions.filter((q) => q.chapter === ch.id).map((q) => q.id), s) }));

export const bySlide = (c: Course, s: ProgressState) =>
  Object.values(c.slides)
    .map((sl) => ({ slide: sl, ...rate(c.questions.filter((q) => q.slide === sl.n).map((q) => q.id), s) }))
    .filter((x) => x.total > 0);

/** questions whose latest attempt was wrong */
export const wrongQuestions = (c: Course, s: ProgressState): SingleQuestion[] =>
  c.questions.filter((q) => s.questions[q.id] && !s.questions[q.id].lastCorrect);

/** chapters sorted weakest first (answered only) */
export const weakChapters = (c: Course, s: ProgressState) =>
  byChapter(c, s).filter((x) => x.answered > 0).sort((a, b) => (a.pct! - b.pct!) || (b.answered - a.answered));

/** themes (slides) that need review: latest attempt wrong on at least one of its questions */
export const weakSlides = (c: Course, s: ProgressState) =>
  bySlide(c, s).filter((x) => x.answered > 0 && x.correct < x.answered).sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));

/**
 * Review set: wrong questions first, then unanswered/wrong questions from the
 * weakest chapters, then "related" questions on the same slides as mistakes.
 */
export function reviewSet(c: Course, s: ProgressState, limit = 12, shuffle: <T>(a: T[]) => T[] = (a) => a) {
  const wrong = wrongQuestions(c, s);
  const wrongSlides = new Set(wrong.map((q) => q.slide));
  const weak = weakChapters(c, s).slice(0, 2).map((x) => x.chapter.id);
  const chs = weak.length ? weak : c.chapters.map((x) => x.id).slice(0, 1);
  const related = c.questions.filter((q) => wrongSlides.has(q.slide) && !wrong.includes(q) && !(s.questions[q.id]?.lastCorrect && s.questions[q.id].attempts > 1));
  const fromWeak = c.questions.filter((q) => chs.includes(q.chapter) && !s.questions[q.id]);
  const seen = new Set<string>();
  const out: SingleQuestion[] = [];
  for (const q of [...shuffle(wrong), ...shuffle(related), ...shuffle(fromWeak)]) {
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
    if (out.length >= limit) break;
  }
  return { questions: out, chapters: chs, wrongCount: wrong.length, relatedCount: related.length };
}

export function studyTime(s: ProgressState, now = Date.now()) {
  const today = s.studyLog[dayKey(now)] || 0;
  const total = Object.values(s.studyLog).reduce((a, b) => a + b, 0);
  const days: { day: string; seconds: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = dayKey(now - i * 86400000);
    days.push({ day: d, seconds: s.studyLog[d] || 0 });
  }
  // consecutive days with ≥1 min of study, counting back from today (or yesterday if today is empty so far)
  let streak = 0;
  for (let i = (s.studyLog[dayKey(now)] || 0) >= 60 ? 0 : 1; i < 400; i++) {
    if ((s.studyLog[dayKey(now - i * 86400000)] || 0) >= 60) streak++;
    else break;
  }
  return { today, total, days, streak };
}

export function lectureSummary(c: Course, s: ProgressState) {
  return c.chapters.map((ch) => {
    const l = s.lectures[ch.id];
    return { chapter: ch, watched: l ? Math.min(1, l.maxPosition / Math.max(1, l.total)) : 0, completed: !!l?.completed, seconds: l?.seconds || 0 };
  });
}

/** Overall mastery 0–100: reading, lectures and quiz accuracy weighted equally. */
export function mastery(c: Course, s: ProgressState) {
  const read = Object.keys(s.read).length / c.chapters.length;
  const lec = lectureSummary(c, s).reduce((a, x) => a + x.watched, 0) / c.chapters.length;
  const o = overall(c, s);
  const quiz = o.correct / Math.max(1, o.total);
  return Math.round(((read + lec + quiz) / 3) * 100);
}

export type Suggestion = { kind: 'lecture' | 'chapter' | 'review' | 'quiz'; chapter?: number; title: string; detail: string; to: string };

/** "今日の学習": up to three next actions derived from where the student is. */
export function todaysPlan(c: Course, s: ProgressState): Suggestion[] {
  const out: Suggestion[] = [];
  const wrong = wrongQuestions(c, s);
  if (wrong.length) out.push({ kind: 'review', title: '弱点復習', detail: `間違えた${wrong.length}問と関連問題を解き直す`, to: '/review' });
  const lec = c.chapters.find((ch) => !s.lectures[ch.id]?.completed);
  if (lec) {
    const l = s.lectures[lec.id];
    out.push({ kind: 'lecture', chapter: lec.id, title: `第${lec.id}講「${lec.name}」の授業`, detail: l && l.position > 5 ? '続きから再生' : '授業を受ける', to: `/lecture/${lec.id}` });
  }
  const unread = c.chapters.find((ch) => !s.read[ch.id]);
  if (unread && (!lec || unread.id !== lec.id)) out.push({ kind: 'chapter', chapter: unread.id, title: `第${unread.id}章「${unread.name}」を読む`, detail: '教科書・図解・スライド', to: `/chapter/${unread.id}` });
  const quizCh = c.chapters.find((ch) => c.questions.some((q) => q.chapter === ch.id && !s.questions[q.id]));
  if (quizCh && out.length < 3) out.push({ kind: 'quiz', chapter: quizCh.id, title: `第${quizCh.id}章の5択問題`, detail: `未回答 ${c.questions.filter((q) => q.chapter === quizCh.id && !s.questions[q.id]).length}問`, to: `/quiz/play?chapter=${quizCh.id}` });
  return out.slice(0, 3);
}
