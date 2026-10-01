import { useEffect, useRef, useState } from 'react';
import { useCourse } from '../app/course';
import { Rich } from './Rich';
import { SourceChips } from './Slide';

/**
 * Tappable schematic: tap a structure → medical name → role in the factory
 * metaphor → actual function, with its source slides. Keyboard accessible.
 */
export function InteractiveFigure({ id, onExplore }: { id: string; onExplore?: (key: string) => void }) {
  const course = useCourse();
  const F = course.figures[id];
  const D = course.figureDetails[F.set];
  const ref = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll<SVGGElement>('g.hs').forEach((g) => {
      const k = g.dataset.k!;
      if (!D[k]) return;
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', D[k].name.replace(/<[^>]+>/g, ''));
    });
  }, [D]);

  useEffect(() => {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    svg.classList.toggle('dim', !!key);
    svg.querySelectorAll<SVGGElement>('g.hs').forEach((g) => g.classList.toggle('on', g.dataset.k === key));
  }, [key]);

  const pick = (target: EventTarget | null) => {
    const g = (target as Element | null)?.closest?.('g.hs') as SVGGElement | null;
    if (!g || !D[g.dataset.k!]) return;
    setKey(g.dataset.k!);
    onExplore?.(g.dataset.k!);
  };
  const d = key ? D[key] : null;

  return (
    <div className="card ifig">
      <div>
        <div className="kick">{F.en}</div>
        <div className="ifig-t">{F.title}</div>
        <div
          ref={ref}
          className="ifig-svg"
          onClick={(e) => pick(e.target)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e.target); } }}
          dangerouslySetInnerHTML={{ __html: F.svg }}
        />
        <div className="hint">{F.hint}</div>
      </div>
      <div className="panel" aria-live="polite">
        {!d ? (
          <div className="p0">構造をタップしてください。</div>
        ) : (
          <>
            <Rich className="m1" html={d.name} as="div" />
            <div className="arrow">▼ {course.metaphorLabel?.role ?? '工場での役割'}</div>
            <Rich className="m2" html={d.role} />
            <div className="arrow">▼ 実際の医学的機能</div>
            <Rich className="m3" html={d.text} as="div" />
          </>
        )}
        <SourceChips key={key || '_'} slides={d ? d.sources : F.sources} />
      </div>
    </div>
  );
}
