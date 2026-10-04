import { useEffect } from 'react';

type Sentinel = { released: boolean; release: () => Promise<void> };
type WakeLockNav = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<Sentinel> } };

/**
 * Keeps the screen on while `active` (a film, an animation or a lecture is playing).
 * Canvas/SVG players are not <video>, so phones and tablets otherwise dim and lock the screen
 * after their idle timeout in the middle of playback. The lock is released on pause and is
 * re-acquired when the page becomes visible again (browsers drop it when the tab is hidden).
 * Browsers without the Screen Wake Lock API simply keep their normal behaviour.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    const nav = navigator as WakeLockNav;
    if (!active || !nav.wakeLock) return;
    let lock: Sentinel | null = null;
    let live = true;
    const acquire = () => {
      if (!live || document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      nav.wakeLock!.request('screen').then((l) => { if (live) lock = l; else l.release().catch(() => {}); }).catch(() => {});
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', acquire);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
