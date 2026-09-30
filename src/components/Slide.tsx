import { useState } from 'react';
import { useCourse } from '../app/course';
import type { Box } from '../content/types';
import { Rich } from './Rich';

export const slideSrc = (base: string, image: string) => base + image;

/**
 * Lecture slide with the red-sheet test: "隠して確認" hides the key terms
 * (masks); tap a mask to reveal it. Mirrors the reference artifact.
 */
export function SlideFigure({ n, flash }: { n: number; flash?: boolean }) {
  const course = useCourse();
  const s = course.slides[n];
  const [test, setTest] = useState(false);
  const [open, setOpen] = useState<Set<number>>(new Set());
  if (!s) return null;
  const toggle = () => { setTest((t) => !t); setOpen(new Set()); };
  return (
    <figure className={'sf' + (flash ? ' flash' : '')} id={`sf${n}`}>
      <div className="sfh">
        <span className="sfn num">{n}</span>
        <span className="sft">{s.title}</span>
        {s.masks.length > 0 && (
          <button className={'tbtn' + (test ? ' on' : '')} onClick={toggle} aria-pressed={test}>
            {test ? '隠すのをやめる' : '隠して確認'}
          </button>
        )}
      </div>
      <div className={'frame' + (test ? ' test' : '')}>
        <img src={slideSrc(course.assetBase, s.image)} alt={`スライド${n}　${s.title}`} loading="lazy" decoding="async" />
        {s.masks.map((b, i) => (
          <button
            key={i}
            className={'m' + (open.has(i) ? ' open' : '')}
            style={maskStyle(b)}
            aria-label={open.has(i) ? '語句を表示中' : '隠れた語句をタップして表示'}
            onClick={() => setOpen((o) => { const x = new Set(o); if (x.has(i)) x.delete(i); else x.add(i); return x; })}
          />
        ))}
      </div>
      <figcaption><span>つまり</span><Rich html={s.keyPoint} /></figcaption>
    </figure>
  );
}

export const maskStyle = (b: Box, pad = 0.5) => ({
  left: `${b[0] * 100 - pad}%`,
  top: `${b[1] * 100 - pad * 1.4}%`,
  width: `${(b[2] - b[0]) * 100 + pad * 2}%`,
  height: `${(b[3] - b[1]) * 100 + pad * 2.8}%`,
});

/** "出典：スライドN" chips; tapping one opens the slide inline. */
export function SourceChips({ slides, highlight, prefix = '出典：スライド' }: { slides: number[]; highlight?: Box[]; prefix?: string }) {
  const course = useCourse();
  const [show, setShow] = useState<number | null>(null);
  if (!slides.length) return null;
  const s = show != null ? course.slides[show] : null;
  return (
    <div className="srcs">
      <div className="chips">
        {slides.map((n) => (
          <button key={n} className={'chip' + (show === n ? ' on' : '')} onClick={() => setShow(show === n ? null : n)} aria-expanded={show === n}>
            {prefix}{n}
          </button>
        ))}
      </div>
      {s && (
        <figure className="src-drawer">
          <div className="hlwrap">
            <img src={slideSrc(course.assetBase, s.image)} alt={`スライド${s.n}`} />
            {highlight?.map((b, i) => <div key={i} className="hl" style={maskStyle(b, 0.8)} />)}
          </div>
          <figcaption>スライド{s.n}　{s.title}</figcaption>
        </figure>
      )}
    </div>
  );
}
