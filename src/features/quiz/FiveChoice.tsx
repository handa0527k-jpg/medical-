import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Rich } from '../../components/Rich';
import { TRAP_LABEL, type TrapKind } from '../../content/types';

export const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

export const shuffle = <T,>(a: T[]): T[] => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};

export interface ChoiceOption { text: string; correct: boolean; explanation: string; trap?: TrapKind }

/**
 * One-best-answer card, always five options A–E (display order shuffled).
 * After answering: verdict, correct letter, every option's explanation,
 * the overall explanation, the key point, and `after` (next buttons, etc.).
 */
export function FiveChoice({ qid, label, meta, stem, options, explanation, point, onAnswer, after, keyboard, initialPick }: {
  qid: string;
  label: string;
  meta?: ReactNode;
  stem: string;
  options: ChoiceOption[];
  explanation: string;
  point?: string;
  onAnswer: (correct: boolean, originalIndex: number) => void;
  after?: ReactNode;
  keyboard?: boolean;
  initialPick?: number | null;
}) {
  if (options.length !== 5) throw new Error(`question ${qid} must have exactly 5 options`);
  const order = useMemo(() => shuffle([0, 1, 2, 3, 4]), [qid]);
  const [pick, setPick] = useState<number | null>(initialPick ?? null);
  const done = pick !== null;
  const ansPos = order.findIndex((k) => options[k].correct);
  const ok = done && options[pick!].correct;

  const choose = (k: number) => {
    if (done) return;
    setPick(k);
    onAnswer(options[k].correct, k);
  };

  useEffect(() => {
    if (!keyboard || done) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input,textarea,select')) return;
      const i = 'abcde'.indexOf(e.key.toLowerCase());
      if (i >= 0) choose(order[i]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  return (
    <div className={'card qcard' + (done ? ' done' : '')}>
      <div className="qmeta"><span className="en">{label}</span>{meta}</div>
      <Rich as="p" className="qstem" html={stem} />
      <div className="opts" role="group" aria-label="選択肢">
        {order.map((k, i) => {
          const o = options[k];
          let c = 'op';
          if (done) { if (o.correct) c += ' cor'; else if (pick === k) c += ' wr'; }
          return (
            <button key={k} className={c} onClick={() => choose(k)} disabled={done} aria-label={`${LETTERS[i]}：${o.text.replace(/<[^>]+>/g, '')}`}>
              <span className="L">{LETTERS[i]}</span>
              <span>
                <Rich className="tx" html={o.text} />
                {done && o.explanation && <span className="nt">{o.correct ? '○ ' : '× '}<Rich html={o.explanation} /></span>}
              </span>
            </button>
          );
        })}
      </div>
      {done && (
        <div className="qres" aria-live="polite">
          <div className={'verdict ' + (ok ? 'ok' : 'ng')}>{ok ? 'CORRECT' : 'INCORRECT'}<small>正解は {LETTERS[ansPos]}</small></div>
          {explanation && <div className="xpl"><span>解説</span><Rich html={explanation} /></div>}
          {point && <div className="trap"><span>重要ポイント</span><Rich html={point} /></div>}
          {!ok && options[pick!].trap && (
            <div className="why"><span>つまずきのタイプ</span><b>{TRAP_LABEL[options[pick!].trap!].name}</b><small>{TRAP_LABEL[options[pick!].trap!].advice}</small></div>
          )}
          {after}
        </div>
      )}
    </div>
  );
}
