import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { DIFFICULTY_LABEL, type SingleQuestion } from '../../content/types';
import { useProgress, useStore, useStudyPage } from '../../state/hooks';
import { SourceChips } from '../../components/Slide';
import { FiveChoice } from './FiveChoice';
import { selectQuestions } from './select';

export function QuestionMeta({ q }: { q: SingleQuestion }) {
  const course = useCourse();
  const ch = course.chapters.find((c) => c.id === q.chapter)!;
  return (
    <>
      <span className="typ">第{q.chapter}章 {ch.name}</span>
      <span className="typ">{q.kind}</span>
      <span className="typ">難易度：{DIFFICULTY_LABEL[q.difficulty]}</span>
      <span className="typ">関連テーマ：{q.tags.join('・')}</span>
    </>
  );
}

/** One-best-answer (A–E) session driven by URL parameters. */
export function QuizSession() {
  const course = useCourse();
  const store = useStore();
  const progress = useProgress();
  const [params] = useSearchParams();
  // the question set is fixed when the session starts
  const spec = useMemo(() => selectQuestions(course, store.get(), params), [course, store, params]);
  useStudyPage({ kind: 'quiz', id: params.toString() || 'all', label: `5択：${spec.label}` }, 'quiz');
  const [i, setI] = useState(0);
  const [res, setRes] = useState<Record<string, boolean>>({});
  const [attempt, setAttempt] = useState(0);
  const finished = useRef(false);

  if (!spec.questions.length) {
    return (
      <div className="empty">
        <p>この条件に当てはまる問題はありません。</p>
        <Link className="btn" to="/quiz">5択メニューへ</Link>
      </div>
    );
  }

  const n = spec.questions.length;
  const done = i >= n;
  const ok = Object.values(res).filter(Boolean).length;

  if (done) {
    if (!finished.current && spec.review) { finished.current = true; store.finishReview(spec.label, spec.questions.map((q) => q.id), ok); }
    const byc = new Map<number, { n: number; ok: number }>();
    spec.questions.forEach((q) => { const b = byc.get(q.chapter) || { n: 0, ok: 0 }; b.n++; if (res[q.id]) b.ok++; byc.set(q.chapter, b); });
    const wrong = spec.questions.filter((q) => res[q.id] === false);
    return (
      <div className="qwrap">
        <div className="card qcard">
          <div className="kick">RESULT　{spec.label}</div>
          <div className="bignum">{ok}<small>/ {n}</small></div>
          <div className="muted">理解度 {Math.round((ok / n) * 100)}%</div>
          <h3 className="muted" style={{ fontSize: 14, margin: '18px 0 6px' }}>分野別成績（今回）</h3>
          <div className="cbars">
            {[...byc.entries()].map(([c, b]) => (
              <div className="cbar" key={c}>
                <span className="n">{c}</span>
                <div><div className="nm">{course.chapters[c - 1].name}</div><div className={'bar ' + (b.ok / b.n < 0.6 ? 'low' : 'ok')}><i style={{ width: `${(b.ok / b.n) * 100}%` }} /></div></div>
                <span className="pc">{b.ok}/{b.n}</span>
              </div>
            ))}
          </div>
          {wrong.length > 0 && (
            <>
              <h3 className="muted" style={{ fontSize: 14, margin: '20px 0 6px' }}>間違えた問題（該当スライドから復習）</h3>
              <div className="grid" style={{ gap: 8 }}>
                {wrong.map((q) => (
                  <Link key={q.id} className="card" style={{ padding: '12px 14px' }} to={`/chapter/${q.chapter}?slide=${q.slide}`}>
                    <div className="kick">{q.id.toUpperCase()}・スライド{q.slide}</div>
                    <small style={{ lineHeight: 1.6, display: 'block' }} dangerouslySetInnerHTML={{ __html: q.stem }} />
                  </Link>
                ))}
              </div>
            </>
          )}
          <div className="qnav">
            {wrong.length > 0 && <Link className="btn eosin" to={`/quiz/play?ids=${wrong.map((q) => q.id).join(',')}&label=${encodeURIComponent('間違えた問題の解き直し')}&review=1`} onClick={() => { setI(0); setRes({}); finished.current = false; }}>間違えた{wrong.length}問をもう一度</Link>}
            <Link className="btn" to="/review">🎯 弱点復習</Link>
            <Link className="btn" to="/stats">成績・弱点分析</Link>
            <Link className="btn" to="/quiz">5択メニュー</Link>
          </div>
        </div>
      </div>
    );
  }

  const q = spec.questions[i];
  const answered = res[q.id] !== undefined;
  const stat = progress.questions[q.id];
  return (
    <div className="qwrap">
      <div className="qhead">
        <span className="en">{spec.label}　Q {i + 1} / {n}</span>
        <div className="bar"><i style={{ width: `${((i + (answered ? 1 : 0)) / n) * 100}%` }} /></div>
        <span className="en">SCORE {ok}</span>
      </div>
      <FiveChoice
        key={q.id + ':' + attempt}
        qid={q.id + ':' + attempt}
        label={q.id.toUpperCase()}
        meta={<QuestionMeta q={q} />}
        stem={q.stem}
        options={q.options}
        explanation={q.explanation}
        point={q.point}
        keyboard
        onAnswer={(correct, k) => { store.answer(q.id, 'single', correct, [k], spec.review); setRes((r) => ({ ...r, [q.id]: correct })); }}
        after={
          <>
            <SourceChips slides={[q.slide]} prefix="出典：PDF スライド" />
            {stat && stat.attempts > 1 && <p className="muted" style={{ fontSize: 13, margin: '8px 0 0' }}>この問題の通算：{stat.attempts}回中{stat.correct}回正解（復習{stat.reviews}回）</p>}
            <div className="qnav">
              <button className="btn" onClick={() => { setRes((r) => { const x = { ...r }; delete x[q.id]; return x; }); setAttempt((a) => a + 1); }}>もう一度解く</button>
              <Link className="btn" to={`/chapter/${q.chapter}?slide=${q.slide}`}>教科書のこのスライドへ</Link>
              <button className="btn eosin" onClick={() => setI(i + 1)}>{i < n - 1 ? '次の問題 ▶' : '結果を見る ▶'}</button>
            </div>
          </>
        }
      />
      {!answered && <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 10 }}>キーボードの A〜E でも回答できます</p>}
    </div>
  );
}
