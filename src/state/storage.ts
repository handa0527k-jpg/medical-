/**
 * Persistence boundary. The app only talks to a ProgressRepository, so moving
 * from localStorage to a backend (Supabase / Firebase …) means writing one new
 * class with the same two methods — see docs/ARCHITECTURE.md.
 */
import { emptyProgress, type ProgressState, DEFAULT_SETTINGS } from './types';

export interface ProgressRepository {
  /** synchronous first paint from the local cache */
  loadLocal(courseId: string): ProgressState;
  /** optional remote hydration (e.g. after sign-in); resolves null when unavailable */
  loadRemote?(courseId: string): Promise<ProgressState | null>;
  save(state: ProgressState): void | Promise<void>;
}

const KEY = (id: string) => `medstudy:progress:${id}:v1`;

export function migrate(raw: unknown, courseId: string): ProgressState {
  const base = emptyProgress(courseId);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ProgressState>;
  if (r.version !== 1) return base;
  return {
    ...base,
    ...r,
    courseId,
    settings: { ...DEFAULT_SETTINGS, ...(r.settings || {}) },
    answers: Array.isArray(r.answers) ? r.answers.slice(-5000) : [],
    recent: Array.isArray(r.recent) ? r.recent.slice(0, 30) : [],
  };
}

export class LocalStorageRepository implements ProgressRepository {
  loadLocal(courseId: string): ProgressState {
    try {
      return migrate(JSON.parse(localStorage.getItem(KEY(courseId)) || 'null'), courseId);
    } catch {
      return emptyProgress(courseId);
    }
  }
  save(state: ProgressState) {
    try {
      localStorage.setItem(KEY(state.courseId), JSON.stringify(state));
    } catch {
      /* storage full or blocked (private mode) — progress stays in memory */
    }
  }
}

/** In-memory repository for tests and for browsers that block storage. */
export class MemoryRepository implements ProgressRepository {
  private data = new Map<string, ProgressState>();
  loadLocal(courseId: string) { return this.data.get(courseId) ?? emptyProgress(courseId); }
  save(state: ProgressState) { this.data.set(state.courseId, JSON.parse(JSON.stringify(state))); }
}
