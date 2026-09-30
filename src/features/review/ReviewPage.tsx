import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { Rich } from '../../components/Rich';
import { useProgress, useStudyPage } from '../../state/hooks';
import { reviewSet, weakChapters, weakSlides, wrongQuestions } from '../../state/analytics';

/** 弱点復習: wrong questions, weak themes (slides/chapters) and related questions. */
export function ReviewPage() {
  const course = useCourse();
  const s = useProgress();
  useStudyPage({ kind: 'quiz', id: 'review', label: '弱点復習' }, 'review');
  const wrong = wrongQuestions(course, s);
  const themes = weakSlides(course, s).slice(0, 8);
  const chs = weakChapters(course, s).filter((x) => (x.pct ?? 100) < 100).slice(0, 3);
  const set = reviewSet(course, s, 12);
  const sessions = s.reviews.length;

  if (!Object.keys(s.questions).length) {
    return (
      <>
        <section className="page-h"><div className="kick">REVIEW</div><h1>弱点復習</h1><p>5択問題を解くと、間違えた問題と苦手なテーマがここに集まります。</p></section>
        <div className="card empty" style={{ marginTop: 18 }}>
          <p>まだ問題を解いていません。</p>
          <Link className="btn eosin" to="/quiz/play?mode=random">ランダム20問から始める</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="page-h">
        <div className="kick">REVIEW</div>
        <h1>弱点復習</h1>
        <p>間違えた問題 → 同じスライドの関連問題 → 苦手な章の未回答問題、の順に最大12問を自動で出題します。</p>
      </section>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card stat"><h3>間違えた問題</h3><div className="bignum">{wrong.length}<small>問</small></div></div>
        <div className="card stat"><h3>関連問題</h3><div className="bignum">{set.relatedCount}<small>問</small></div></div>
        <div className="card stat"><h3>復習回数</h3><div className="bignum">{sessions}<small>回</small></div></div>
      </div>

      <div className="btnrow">
        <Link className="btn eosin" to="/quiz/play?mode=review" aria-disabled={!set.questions.length}>🎯 弱点復習を始める（{set.questions.length}問）</Link>
        {wrong.length > 0 && <Link className="btn" to="/quiz/play?filter=wrong">間違えた問題だけ（{wrong.length}問）</Link>}
      </div>

      {chs.length > 0 && (
        <>
          <div className="sec-h"><span className="en">WEAK CHAPTERS</span><h2>苦手な章</h2></div>
          <div className="grid cols-3">
            {chs.map((x) => (
              <div key={x.chapter.id} className="card stat">
                <h3>第{x.chapter.id}章</h3>
                <b style={{ fontSize: 17 }}>{x.chapter.name}</b>
                <div className="bar low" style={{ margin: '10px 0 6px' }}><i style={{ width: `${x.pct}%` }} /></div>
                <small className="muted">正答率 {x.pct}%（{x.correct}/{x.answered}）</small>
                <div className="btnrow" style={{ marginTop: 10 }}>
                  <Link className="btn sm" to={`/lecture/${x.chapter.id}`}>授業で復習</Link>
                  <Link className="btn sm" to={`/quiz/play?chapter=${x.chapter.id}&filter=wrong`}>解き直す</Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {themes.length > 0 && (
        <>
          <div className="sec-h"><span className="en">WEAK THEMES</span><h2>苦手テーマ（スライド）</h2></div>
          <div className="grid cols-auto">
            {themes.map((t) => (
              <div key={t.slide.n} className="card" style={{ padding: '14px 16px' }}>
                <div className="kick">SLIDE {t.slide.n}</div>
                <b>{t.slide.title}</b>
                <p className="muted" style={{ fontSize: 13.5, margin: '4px 0 8px', lineHeight: 1.6 }}><Rich html={t.slide.keyPoint} /></p>
                <div className="chips">
                  <Link className="chip" to={`/chapter/${t.slide.chapter}?slide=${t.slide.n}`}>教科書のスライドへ</Link>
                  <Link className="chip" to={`/quiz/play?slide=${t.slide.n}`}>このテーマの問題（{t.total}）</Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="sec-h"><span className="en">MISTAKES</span><h2>間違えた問題（{wrong.length}）</h2></div>
      {wrong.length ? (
        <div className="grid cols-auto">
          {wrong.map((q) => (
            <Link key={q.id} className="card" style={{ padding: '14px 16px' }} to={`/quiz/play?ids=${q.id}&label=${encodeURIComponent('復習')}&review=1`}>
              <div className="kick">{q.id.toUpperCase()}・スライド{q.slide}・誤答{(s.questions[q.id].attempts - s.questions[q.id].correct)}回</div>
              <Rich as="small" html={q.stem} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">間違えたままの問題はありません。</div>
      )}

      {s.reviews.length > 0 && (
        <>
          <div className="sec-h"><span className="en">HISTORY</span><h2>復習の履歴</h2></div>
          <div className="card" style={{ padding: '8px 18px' }}>
            {[...s.reviews].reverse().slice(0, 10).map((r, i) => (
              <div key={i} className="hist-row">
                <span className="muted">{new Date(r.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>{r.label}</span>
                <b>{r.correct}/{r.total}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
