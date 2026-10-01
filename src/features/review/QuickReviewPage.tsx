/**
 * 5分復習: after a lecture, five short steps —
 * ① the finished blackboard  ② today's key points (tap → where on the board)
 * ③ the key figure  ④ five questions  ⑤ the points you got wrong.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { NotFound } from '../../app/NotFound';
import { InteractiveFigure } from '../../components/InteractiveFigure';
import { Rich } from '../../components/Rich';
import { TRAP_LABEL } from '../../content/types';
import { timeLecture } from '../../engine/lecture/timing';
import type { Lecture } from '../../engine/lecture/types';
import { quickReviewSet } from '../../state/analytics';
import { useProgress, useStore, useStudyPage } from '../../state/hooks';
import { BoardSnapshot, useBoard } from '../lecture/Blackboard';
import { FiveChoice, shuffle } from '../quiz/FiveChoice';

const STEPS = ['完成した黒板', '今日の重要事項', '重要図解', '5問確認', '間違えたポイント'];

export default function QuickReviewPage() {
  const course = useCourse();
  const id = Number(useParams().id);
  const ch = course.chapters.find((c) => c.id === id);
  const [lec, setLec] = useState<Lecture | null>(null);
  useStudyPage(ch ? { kind: 'lecture', id: String(id), label: `第${id}講 5分復習` } : null, `review5:${id}`);
  useEffect(() => {
    if (!ch) return;
    let live = true;
    course.loadLecture(id).then((l) => live && setLec(l)).catch(() => live && setLec(null));
    return () => { live = false; };
  }, [course, id, ch]);
  if (!ch) return <NotFound />;
  if (!lec) return <div className="empty">読み込み中…</div>;
  return <QuickReview lecture={lec} chapter={id} />;
}

function QuickReview({ lecture, chapter }: { lecture: Lecture; chapter: number }) {
  const course = useCourse();
  const store = useStore();
  const s = useProgress();
  const ch = course.chapters.find((c) => c.id === chapter)!;
  const tl = useMemo(() => timeLecture(lecture, null), [lecture]);
  const { r } = useBoard(lecture, tl);
  const [step, setStep] = useState(0);
  const [hl, setHl] = useState<string[] | undefined>(undefined);
  // questions are fixed when the review starts
  const [qs] = useState(() => quickReviewSet(course, s, chapter, 5, shuffle));
  const [qi, setQi] = useState(0);
  const [res, setRes] = useState<Record<string, { ok: boolean; k: number }>>({});
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, 300 - Math.floor((now - startedAt) / 1000));

  const keys = lecture.keyPoints || ch.points.map((text) => ({ text, ref: undefined as string[] | undefined }));
  const fig = ch.figures[0];
  const missedNow = qs.filter((q) => res[q.id] && !res[q.id].ok);
  const missedBefore = course.questions.filter((q) => q.chapter === chapter && s.questions[q.id] && !s.questions[q.id].lastCorrect && !missedNow.includes(q));
  const end = r ? r.end + 0.5 : 0;

  const finish = () => {
    const ids = Object.keys(res);
    if (ids.length) store.finishReview(`第${chapter}講 5分復習`, ids, ids.filter((k) => res[k].ok).length);
    setStep(4);
  };

  return (
    <>
      <section className="page-h">
        <div className="kick">5-MINUTE REVIEW</div>
        <h1>第{chapter}講　{ch.name} ― 5分復習</h1>
        <p>黒板 → 重要事項 → 図解 → 5問 → 間違えたポイントの順に、授業の要点だけを短く確認します。</p>
      </section>
      <div className="qr-steps" role="tablist" aria-label="復習のステップ">
        {STEPS.map((x, i) => (
          <button key={x} role="tab" aria-selected={i === step} className={i === step ? 'on' : i < step ? 'done' : ''} onClick={() => setStep(i)}>
            <span className="en">{i + 1}</span>{x}
          </button>
        ))}
        <span className={'qr-time' + (left === 0 ? ' over' : '')}>残り {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
      </div>

      {step === 0 && (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>授業の終わりに完成した黒板です。左＝基本概念、中央＝メカニズム、右＝試験ポイント、下＝まとめ。</p>
          {r ? <div className="qr-board"><BoardSnapshot r={r} T={end} label={`第${chapter}講の完成した黒板`} /></div> : <p>この講義には板書がありません。</p>}
          <div className="btnrow">
            <Link className="btn" to={`/lecture/${chapter}/board`}>拡大して見る（板書だけを見る）</Link>
            <button className="btn eosin" onClick={() => setStep(1)}>次へ：今日の重要事項 ▶</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <ol className="bvkeys">
            {keys.map((k, i) => (
              <li key={i}><button className={'bvk' + (hl && k.ref && hl.join() === k.ref.join() ? ' on' : '')} onClick={() => setHl(k.ref)} disabled={!k.ref || !r}><Rich html={k.text} /></button></li>
            ))}
          </ol>
          {r && hl && <div className="qr-board sm"><BoardSnapshot r={r} T={end} focus={hl} highlight={hl} label="重要事項の板書" /></div>}
          <div className="btnrow"><button className="btn eosin" onClick={() => setStep(2)}>次へ：重要図解 ▶</button></div>
        </div>
      )}

      {step === 2 && (
        <>
          {fig ? <InteractiveFigure id={fig} /> : <div className="card">この章の図解はありません。</div>}
          <div className="btnrow">
            {ch.animations.map((a) => course.animations[a] && <Link key={a} className="btn" to={`/animations/${a}`}>アニメで見る：{course.animations[a].meta.title}</Link>)}
            <button className="btn eosin" onClick={() => setStep(3)}>次へ：5問確認 ▶</button>
          </div>
        </>
      )}

      {step === 3 && (qs.length ? (
        qi < qs.length ? (
          <div className="qwrap" style={{ marginTop: 0 }}>
            <div className="qhead"><span className="en">5問確認　Q {qi + 1} / {qs.length}</span><div className="bar"><i style={{ width: `${((qi + (res[qs[qi].id] ? 1 : 0)) / qs.length) * 100}%` }} /></div></div>
            <FiveChoice
              key={qs[qi].id}
              qid={qs[qi].id}
              label={qs[qi].id.toUpperCase()}
              stem={qs[qi].stem}
              options={qs[qi].options}
              explanation={qs[qi].explanation}
              point={qs[qi].point}
              keyboard
              onAnswer={(ok, k) => { store.answer(qs[qi].id, 'single', ok, [k], true); setRes((x) => ({ ...x, [qs[qi].id]: { ok, k } })); }}
              after={<div className="qnav"><button className="btn eosin" onClick={() => (qi < qs.length - 1 ? setQi(qi + 1) : finish())}>{qi < qs.length - 1 ? '次の問題 ▶' : '間違えたポイントへ ▶'}</button></div>}
            />
          </div>
        ) : null
      ) : <div className="card">この章の問題はありません。<button className="btn" onClick={() => setStep(4)}>次へ</button></div>)}

      {step === 4 && (
        <div className="card">
          <div className="grid cols-3" style={{ marginBottom: 12 }}>
            <div className="stat"><h3>今回の5問</h3><div className="bignum">{Object.values(res).filter((x) => x.ok).length}<small>/{Object.keys(res).length}問</small></div></div>
            <div className="stat"><h3>今回間違えた</h3><div className="bignum">{missedNow.length}<small>問</small></div></div>
            <div className="stat"><h3>以前から要復習</h3><div className="bignum">{missedBefore.length}<small>問</small></div></div>
          </div>
          {missedNow.length + missedBefore.length === 0 ? (
            <p className="good">この講義の範囲で、間違えたままの問題はありません。</p>
          ) : (
            <ul className="lrep-list">
              {[...missedNow, ...missedBefore].map((q) => {
                const k = res[q.id]?.k;
                const trap = k !== undefined ? q.options[k].trap : undefined;
                return (
                  <li key={q.id}>
                    <div className="lrep-q"><span className="pill eosin">スライド{q.slide}</span><Rich html={q.stem} /></div>
                    <div className="lrep-p"><Rich html={q.point} /></div>
                    {trap && <small className="muted">つまずき：{TRAP_LABEL[trap].name} ― {TRAP_LABEL[trap].advice}</small>}
                    <div className="chips">
                      <Link className="chip" to={`/chapter/${q.chapter}?slide=${q.slide}`}>教科書：スライド{q.slide}</Link>
                      <Link className="chip" to={`/quiz/play?ids=${q.id}&label=${encodeURIComponent('5分復習の解き直し')}&review=1`}>解き直す</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="btnrow">
            <Link className="btn eosin" to={`/lecture/${chapter}`}>授業をもう一度</Link>
            <Link className="btn" to="/stats">弱点分析へ</Link>
          </div>
        </div>
      )}
    </>
  );
}
