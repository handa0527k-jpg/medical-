import { useEffect, useRef } from 'react';

export interface TimelineTick { at: number; label: string }

/**
 * Scrubbable timeline with chapter ticks. Position updates are pushed
 * imperatively (bind → set) so 60fps playback never re-renders React.
 */
export function Timeline({ total, ticks, onSeek, bind, label }: {
  total: number;
  ticks: TimelineTick[];
  onSeek: (fraction: number) => void;
  bind: (api: { set: (f: number) => void }) => void;
  label: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const frac = useRef(0);

  useEffect(() => {
    bind({
      set: (f) => {
        frac.current = f;
        const pct = `${Math.max(0, Math.min(1, f)) * 100}%`;
        if (fill.current) fill.current.style.width = pct;
        if (knob.current) knob.current.style.left = pct;
        el.current?.setAttribute('aria-valuenow', String(Math.round(f * total)));
      },
    });
  }, [bind, total]);

  const at = (x: number) => { const r = el.current!.getBoundingClientRect(); return Math.max(0, Math.min(1, (x - r.left) / r.width)); };

  return (
    <div
      ref={el}
      className="atl"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(total)}
      onPointerDown={(e) => { drag.current = true; el.current!.setPointerCapture(e.pointerId); onSeek(at(e.clientX)); }}
      onPointerMove={(e) => { if (drag.current) onSeek(at(e.clientX)); }}
      onPointerUp={() => { drag.current = false; }}
      onPointerCancel={() => { drag.current = false; }}
      onKeyDown={(e) => {
        const step = 10 / Math.max(1, total);
        if (e.key === 'ArrowRight') { e.preventDefault(); onSeek(Math.min(1, frac.current + step)); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); onSeek(Math.max(0, frac.current - step)); }
      }}
    >
      <div className="trk" />
      {ticks.map((t, i) => <i key={i} className="tick" style={{ left: `${t.at * 100}%` }} title={t.label} />)}
      <div className="fill" ref={fill} />
      <div className="knob" ref={knob} />
    </div>
  );
}
