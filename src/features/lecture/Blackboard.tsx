/**
 * React side of the blackboard: the live board shot (camera + chalk + hand
 * follow lecture time) and a static snapshot used by quiz explanations, the
 * finished-board viewer and the 5-minute review.
 */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BoardRenderer } from '../../engine/board/render';
import type { BoardCam } from '../../engine/board/types';
import type { Lecture, TimedLecture } from '../../engine/lecture/types';
import { useFrame } from './frame';

export const BoardContext = createContext<{ r: BoardRenderer; T: () => number; version: number } | null>(null);

/** Build (and keep in sync with fonts and timing) the renderer of a lecture's board. */
export function useBoard(lecture: Lecture, tl: TimedLecture | null): { r: BoardRenderer | null; version: number } {
  const [fontTick, setFontTick] = useState(0);
  const r = useMemo(() => (lecture.board ? new BoardRenderer(lecture.board) : null), [lecture]);
  useEffect(() => {
    if (!r || typeof document === 'undefined' || !document.fonts) return;
    let live = true;
    Promise.all([document.fonts.load(`600 64px "Klee One"`, '遺伝子DNA'), document.fonts.ready]).then(() => {
      if (!live) return;
      r.recompile();
      setFontTick((n) => n + 1);
    }).catch(() => {});
    return () => { live = false; };
  }, [r]);
  useMemo(() => {
    if (r && tl) r.attach(tl.cues.map((c) => [c.t0, c.t1] as [number, number]));
  }, [r, tl]);
  return { r, version: fontTick };
}

/** The blackboard as the lecture's main visual. */
export function BlackboardShot() {
  const ctx = useContext(BoardContext);
  const cv = useRef<HTMLCanvasElement>(null);
  useFrame((T) => {
    if (!ctx || !cv.current) return;
    ctx.r.draw(cv.current, T, ctx.r.camAt(T), { hand: true });
  });
  useEffect(() => {
    const el = cv.current;
    if (!el || !ctx) return;
    const ro = new ResizeObserver(() => ctx.r.draw(el, ctx.T(), ctx.r.camAt(ctx.T()), { hand: true }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ctx]);
  return (
    <div className="ly lbb">
      <canvas ref={cv} className="bbcv" aria-label="黒板（板書）" role="img" />
    </div>
  );
}

/** Static view of the board at time T; frames `focus` ids (or the given camera) and glows `highlight`. */
export function BoardSnapshot({ r, T, focus, cam, highlight, className, label }: {
  r: BoardRenderer;
  T: number;
  focus?: string[];
  cam?: BoardCam;
  highlight?: string[];
  className?: string;
  label?: string;
}) {
  const cv = useRef<HTMLCanvasElement>(null);
  const view: BoardCam = useMemo(() => {
    if (cam) return cam;
    const b = focus && focus.length ? r.boxOf(focus) : null;
    return b ? BoardRenderer.frame(b, 1100) : [1600, 900, 3200];
  }, [r, focus, cam]);
  useLayoutEffect(() => {
    const el = cv.current;
    if (!el) return;
    let raf = 0;
    const draw = () => r.draw(el, T, view, { highlight });
    draw();
    // gentle pulse on highlighted chalk
    if (highlight?.length) { const loop = () => { draw(); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [r, T, view, highlight]);
  return <canvas ref={cv} className={'bbcv ' + (className || '')} role="img" aria-label={label || '黒板'} />;
}
