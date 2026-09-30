import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import type { ProgressStore } from './store';
import type { ProgressState, RecentItem } from './types';

export const StoreContext = createContext<ProgressStore | null>(null);

export function useStore(): ProgressStore {
  const s = useContext(StoreContext);
  if (!s) throw new Error('ProgressStore missing');
  return s;
}

export function useProgress(): ProgressState {
  const s = useStore();
  return useSyncExternalStore(s.subscribe, s.get, s.get);
}

const IDLE_MS = 90_000;

/**
 * Records a page visit and counts active study time on it: time only accrues
 * while the tab is visible and the user interacted within the last 90 s
 * (or media is playing — see `activeRef`).
 */
export function useStudyPage(item: Omit<RecentItem, 'at'> | null, pageKey: string, activeRef?: { current: boolean }) {
  const store = useStore();
  const lastInput = useRef(Date.now());
  useEffect(() => {
    if (item) store.visit(item, pageKey);
    const bump = () => { lastInput.current = Date.now(); };
    const evs = ['pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart'];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    let acc = 0;
    const tick = setInterval(() => {
      const active = document.visibilityState === 'visible' && (Date.now() - lastInput.current < IDLE_MS || !!activeRef?.current);
      if (active) acc += 5;
      if (acc >= 15) { store.addStudyTime(pageKey, acc); acc = 0; }
    }, 5000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(tick);
      if (acc) store.addStudyTime(pageKey, acc);
    };
    // item identity is represented by pageKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, store]);
}
