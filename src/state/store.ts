/**
 * Progress store: a tiny observable wrapper around ProgressState.
 * All mutations go through the action methods below, which keep the
 * aggregates (question stats, study log, recent list) consistent.
 * Writes are debounced to the repository.
 */
import type { AnswerRecord, ProgressState, QuestionType, RecentItem, Settings } from './types';
import type { ProgressRepository } from './storage';

export const dayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export class ProgressStore {
  private state: ProgressState;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private repo: ProgressRepository, courseId: string, private now: () => number = Date.now) {
    this.state = repo.loadLocal(courseId);
    repo.loadRemote?.(courseId).then((r) => { if (r) { this.state = r; this.emit(false); } }).catch(() => {});
  }

  get = () => this.state;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };

  private emit(persist = true) {
    this.listeners.forEach((f) => f());
    if (!persist) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 250);
  }
  flush = () => { if (this.timer) { clearTimeout(this.timer); this.timer = null; } void this.repo.save(this.state); };

  private update(fn: (s: ProgressState) => ProgressState) { this.state = fn(this.state); this.emit(); }

  /* ---------- actions ---------- */
  toggleRead(chapter: number) {
    this.update((s) => {
      const read = { ...s.read };
      if (read[chapter]) delete read[chapter]; else read[chapter] = this.now();
      return { ...s, read };
    });
  }

  visit(item: Omit<RecentItem, 'at'>, pageKey: string) {
    const at = this.now();
    this.update((s) => {
      const p = s.pages[pageKey] || { visits: 0, last: 0, seconds: 0 };
      const recent = [{ ...item, at }, ...s.recent.filter((r) => !(r.kind === item.kind && r.id === item.id))].slice(0, 30);
      return { ...s, pages: { ...s.pages, [pageKey]: { ...p, visits: p.visits + 1, last: at } }, recent };
    });
  }

  addStudyTime(pageKey: string, seconds: number) {
    if (seconds <= 0) return;
    const day = dayKey(this.now());
    this.update((s) => {
      const p = s.pages[pageKey] || { visits: 0, last: this.now(), seconds: 0 };
      return {
        ...s,
        pages: { ...s.pages, [pageKey]: { ...p, seconds: p.seconds + seconds } },
        studyLog: { ...s.studyLog, [day]: (s.studyLog[day] || 0) + seconds },
      };
    });
  }

  answer(qid: string, type: QuestionType, correct: boolean, choice: number[], review = false) {
    const at = this.now();
    this.update((s) => {
      const q = s.questions[qid] || { attempts: 0, correct: 0, lastCorrect: false, lastAt: 0, reviews: 0 };
      const rec: AnswerRecord = { qid, type, correct, choice, at, review };
      return {
        ...s,
        answers: [...s.answers, rec].slice(-5000),
        questions: {
          ...s.questions,
          [qid]: { attempts: q.attempts + 1, correct: q.correct + (correct ? 1 : 0), lastCorrect: correct, lastAt: at, reviews: q.reviews + (review ? 1 : 0) },
        },
      };
    });
  }

  finishReview(label: string, qids: string[], correct: number) {
    this.update((s) => ({ ...s, reviews: [...s.reviews, { at: this.now(), label, qids, correct, total: qids.length }].slice(-200) }));
  }

  lectureProgress(chapter: number, position: number, total: number, addSeconds = 0, completed = false) {
    this.update((s) => {
      const l = s.lectures[chapter] || { position: 0, maxPosition: 0, total, completed: false, seconds: 0, lastAt: 0 };
      return {
        ...s,
        lectures: {
          ...s.lectures,
          [chapter]: { position, maxPosition: Math.max(l.maxPosition, position), total, completed: l.completed || completed, seconds: l.seconds + addSeconds, lastAt: this.now() },
        },
      };
    });
  }

  animationProgress(id: string, progress: number, opts: { play?: boolean; completed?: boolean; seconds?: number } = {}) {
    this.update((s) => {
      const a = s.animations[id] || { plays: 0, completed: 0, maxProgress: 0, seconds: 0, lastAt: 0 };
      return {
        ...s,
        animations: {
          ...s.animations,
          [id]: {
            plays: a.plays + (opts.play ? 1 : 0),
            completed: a.completed + (opts.completed ? 1 : 0),
            maxProgress: Math.max(a.maxProgress, progress),
            seconds: a.seconds + (opts.seconds || 0),
            lastAt: this.now(),
          },
        },
      };
    });
  }

  setSettings(patch: Partial<Settings>) { this.update((s) => ({ ...s, settings: { ...s.settings, ...patch } })); }

  reset() {
    const settings = this.state.settings;
    this.update((s) => ({ ...s, read: {}, pages: {}, answers: [], questions: {}, lectures: {}, animations: {}, reviews: [], studyLog: {}, recent: [], settings }));
  }
}
