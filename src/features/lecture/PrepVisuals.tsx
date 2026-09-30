/**
 * Visuals for authored (予備校スタイル) lectures: chalkboard, cell map,
 * learning map, comparison table, emphasis cards and the on-stage 5-choice
 * question with thinking time and a lecturer-led walkthrough.
 */
import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import { useCourse } from '../../app/course';
import { Rich } from '../../components/Rich';
import type { LectureVisual, TimedCue, TimedShot } from '../../engine/lecture/types';
import { useFrame } from './frame';
import { BoardContext, BoardSnapshot } from './Blackboard';

type V<K extends LectureVisual['kind']> = Extract<LectureVisual, { kind: K }>;
const cueIndex = (shot: TimedShot, cue: TimedCue) => Math.max(0, shot.cues.findIndex((c) => c.id === cue.id));

/* ---------------- chalkboard ---------------- */
function ChalkText({ html }: { html: string }) {
  // "A → B → C" : segments joined by drawn arrows
  const parts = html.split(/\s*→\s*/);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className="cseg">
          {i > 0 && <svg className="carrow" viewBox="0 0 48 16" aria-hidden="true"><path d="M2 8H42M34 2l9 6-9 6" pathLength={1} /></svg>}
          <Rich html={p} />
        </span>
      ))}
    </>
  );
}

export function Chalk({ v, shot, cue }: { v: V<'chalk'>; shot: TimedShot; cue: TimedCue }) {
  const k = cueIndex(shot, cue);
  const rows = v.rows.filter((r) => r.at <= k);
  return (
    <div className="ly lchalk">
      <div className="board">
        <Rich className="btitle" as="div" html={v.title} />
        <div className="brows">
          {rows.map((r, i) => {
            const marks = v.marks.filter((m) => m.row === i && m.at <= k);
            const fresh = r.at === k;
            return (
              <div key={i} className={`brow ${r.style}${fresh ? ' fresh' : ''}${marks.some((m) => m.type === 'box') || r.style === 'em' ? ' boxed' : ''}${marks.some((m) => m.type === 'under') ? ' under' : ''}`}>
                {r.style === 'down' && <svg className="cdown" viewBox="0 0 16 40" aria-hidden="true"><path d="M8 2V34M2 26l6 9 6-9" pathLength={1} /></svg>}
                {r.style === 'vs' ? (
                  <span className="cvs">{r.text.split(/\s*\|\s*/).map((c, j) => <span key={j}><Rich html={c} /></span>)}</span>
                ) : (
                  <span className="ctext"><ChalkText html={r.text} /></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- cell map ---------------- */
export function CellMap({ v, cue }: { v: V<'cellmap'>; shot: TimedShot; cue: TimedCue }) {
  const course = useCourse();
  const box = useRef<HTMLDivElement>(null);
  const chap = typeof cue.focus === 'number' ? cue.focus + 1 : v.chapter;
  useLayoutEffect(() => {
    // highlight the zone being talked about; the rest of the map dims
    box.current?.querySelectorAll<SVGGElement>('g.z').forEach((g) => {
      const on = Number(g.dataset.c) === chap;
      g.classList.toggle('on', on);
      g.classList.toggle('off', !on);
    });
  }, [chap]);
  return (
    <div className="ly lmap">
      <div className="mapbox" ref={box} dangerouslySetInnerHTML={{ __html: course.mapSvg }} />
      <div className="lfgt">第{chap}講　{course.chapters[chap - 1]?.name}</div>
    </div>
  );
}

/* ---------------- roadmap ---------------- */
export function Roadmap({ v, cue }: { v: V<'roadmap'>; cue: TimedCue }) {
  const cur = typeof cue.focus === 'number' ? cue.focus : v.current ?? -1;
  return (
    <div className="ly in">
      <div className="lroad">
        <div className="lbt"><Rich html={v.title} /></div>
        <ol>
          {v.items.map((x, i) => (
            <li key={i} className={i === cur ? 'cur' : i < cur && v.current !== undefined ? 'done' : ''}>
              <span className="rn">{i + 1}</span><Rich html={x} />
              {i === cur && v.current !== undefined && <span className="now">NOW</span>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------------- comparison table ---------------- */
export function Compare({ v, cue }: { v: V<'compare'>; cue: TimedCue }) {
  const f = typeof cue.focus === 'number' ? cue.focus : typeof cue.focus === 'string' && /^r\d+$/.test(cue.focus) ? Number(cue.focus.slice(1)) - 1 : -1;
  return (
    <div className="ly in">
      <div className="lcmp">
        <div className="lbt"><Rich html={v.title} /></div>
        <table>
          <thead><tr>{v.header.map((h, i) => <th key={i}><Rich html={h} /></th>)}</tr></thead>
          <tbody>
            {v.rows.map((r, i) => (
              <tr key={i} className={i === f ? 'cur' : f >= 0 && i < f ? 'past' : ''}>
                {r.map((c, j) => (j ? <td key={j}><Rich html={c} /></td> : <th key={j} scope="row"><Rich html={c} /></th>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- emphasis cards ---------------- */
const CARD_KICK = { point: 'KEY POINT', pitfall: 'CAUTION', memo: 'MEMORY', example: 'EXAMPLE' } as const;
export function Card({ v }: { v: V<'card'> }) {
  return (
    <div className="ly in">
      <div className={`lcard2 ${v.variant}`}>
        <div className="ck"><span className="en">{CARD_KICK[v.variant]}</span><Rich html={v.label} /></div>
        <Rich as="p" html={v.html} />
      </div>
    </div>
  );
}

/* ---------------- 5-choice question on stage ---------------- */
export interface LectureQuizApi {
  answerOf: (qid: string) => number | undefined;
  answer: (qid: string, option: number) => void;
  toExplanation: () => void;
}
export const QuizContext = createContext<LectureQuizApi | null>(null);
const LET = ['A', 'B', 'C', 'D', 'E'];
const VARIANT = { check: '確認問題', typical: '典型問題', final: '本番問題' } as const;

export function StageQuiz({ v, shot, cue }: { v: V<'quiz'>; shot: TimedShot; cue: TimedCue }) {
  const course = useCourse();
  const api = useContext(QuizContext);
  const board = useContext(BoardContext);
  const q = course.questions.find((x) => x.id === v.qid)!;
  const picked = api?.answerOf(q.id);
  const ring = useRef<SVGCircleElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const explain = v.phase === 'explain';
  // letters already discussed in this walkthrough
  const upto = cueIndex(shot, cue);
  const seen = new Set(shot.cues.slice(0, upto + 1).map((c) => c.focus).filter((f): f is string => typeof f === 'string'));
  const focus = typeof cue.focus === 'string' ? cue.focus : null;
  const answerIdx = q.options.findIndex((o) => o.correct);

  useFrame((T) => {
    if (v.phase !== 'think' || !ring.current) return;
    const left = Math.max(0, shot.t1 - T);
    const total = Math.max(1, shot.t1 - shot.t0);
    ring.current.style.strokeDashoffset = String(1 - left / total);
    if (num.current) num.current.textContent = String(Math.ceil(left));
  });

  return (
    <div className="ly lqz">
      <div className={`qpanel ${v.phase}`}>
        <div className="qtop">
          <span className={`qtag ${v.variant}`}>{VARIANT[v.variant]}</span>
          <span className="qsrc">出典：PDF スライド{q.slide}</span>
          {v.phase === 'think' && (
            <span className="qtimer" aria-label="考える時間">
              <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" /><circle ref={ring} className="fg" cx="20" cy="20" r="17" pathLength={1} /></svg>
              <span ref={num} />
            </span>
          )}
        </div>
        <Rich as="p" className={'qst' + (focus === 'q' ? ' hl' : '')} html={q.stem} />
        <div className="qops">
          {q.options.map((o, i) => {
            const L = LET[i];
            const revealed = explain && (seen.has(L) || seen.has('ok'));
            let cls = 'qop';
            if (picked === i) cls += ' mine';
            if (revealed) cls += o.correct ? ' ok' : ' ng';
            if (explain && focus === L) cls += ' focus';
            return (
              <button key={i} className={cls} disabled={explain || picked !== undefined} onClick={() => api?.answer(q.id, i)} aria-label={`${L}：${o.text.replace(/<[^>]+>/g, '')}`}>
                <span className="ql">{L}</span>
                <span className="qt"><Rich html={o.text} />{revealed && focus === L && o.explanation && <small><Rich html={o.explanation} /></small>}</span>
              </button>
            );
          })}
        </div>
        <div className="qfoot">
          {!explain && picked === undefined && <span>タップして答えを選べます</span>}
          {!explain && picked !== undefined && (
            <>
              <span>あなたの答え：<b>{LET[picked]}</b></span>
              {v.phase === 'think' && <button className="qgo" onClick={() => api?.toExplanation()}>解説へ ▶</button>}
            </>
          )}
          {explain && picked !== undefined && !seen.has(LET[answerIdx]) && <span>あなたの答え：<b>{LET[picked]}</b>　解説で確かめましょう</span>}
          {explain && picked !== undefined && seen.has(LET[answerIdx]) && (
            <span className={picked === answerIdx ? 'good' : 'bad'}>{picked === answerIdx ? '◎ 正解です' : `✕ あなたの答えは ${LET[picked]}`}</span>
          )}
        </div>
      </div>
      {explain && board && v.ref && seen.size > 0 && (
        <div className="qboard" aria-label="黒板の該当箇所">
          <span>黒板のここ</span>
          <BoardSnapshot r={board.r} T={shot.t0} focus={v.ref} highlight={v.ref} label="黒板の該当箇所" />
        </div>
      )}
    </div>
  );
}
