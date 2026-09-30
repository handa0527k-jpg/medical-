import { createContext, useContext, useEffect, useRef } from 'react';

/** Per-frame callbacks registered by the active visual (camera moves, animation, timers). */
export type FrameFn = (T: number) => void;
export const FrameContext = createContext<{ current: FrameFn | null }>({ current: null });

export function useFrame(fn: FrameFn) {
  const reg = useContext(FrameContext);
  const f = useRef(fn);
  f.current = fn;
  useEffect(() => {
    const call: FrameFn = (T) => f.current(T);
    reg.current = call;
    return () => { if (reg.current === call) reg.current = null; };
  }, [reg]);
}
