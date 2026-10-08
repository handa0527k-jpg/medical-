import type { Stage } from './stage';

export const ease = {
  linear: (t: number) => t,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
  back: (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
};

/**
 * Run `f(e)` with e going 0 -> 1 over `dur` seconds on the stage clock.
 * Resolves when done; a lab that is left mid-animation simply stops ticking.
 */
export function tween(stage: Stage, dur: number, f: (e: number, t: number) => void, curve = ease.inOut) {
  return new Promise<void>((res) => {
    let t = 0;
    f(curve(0), 0);
    const off = stage.onTick((dt) => {
      t = Math.min(1, t + dt / dur);
      f(curve(t), t);
      if (t >= 1) {
        off();
        res();
      }
    });
  });
}

export const wait = (stage: Stage, s: number) => tween(stage, s, () => {}, ease.linear);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
