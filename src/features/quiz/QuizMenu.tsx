import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { useProgress, useStudyPage } from '../../state/hooks';
import { byChapter, overall, wrongQuestions } from '../../state/analytics';

export function QuizMenu() {
  const course = useCourse();
  const s = useProgress();
  useStudyPage(null, 'quiz:menu');
  const o = overall(course, s);
  const unanswered = course.questions.filter((q) => !s.questions[q.id]).length;
  const wrong = wrongQuestions(course, s).length;
  const slides = Object.keys(course.slides).length;

  return (
    <>
      <section className="page-h">
        <div className="kick">5-CHOICE QUIZ</div>
        <h1>5択問題</h1>
        <p>全{course.questions.length}問（学習スライド{slides}枚 × 2問）。第1問はスライドの重要事項、第2問は理解・統合を問います。すべてA〜Eの5択で、各選択肢の解説と出典スライド付き。</p>
      </section>
      <div className="card" style={{ padding: '16px 20px', margin: '16px 0' }}>
        回答 {o.answered}/{o.total}問・正答率 <b style={{ color: 'var(--eosin)' }}>{o.pct ?? '—'}{o.pct !== null && '%'}</b>
        <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${(o.correct / o.total) * 100}%` }} /></div>
      </div>
      <div className="qsel">
        <Link className="card" to="/quiz/play?mode=random"><b>全問ランダム</b><small>{course.questions.length}問から20問</small></Link>
        <Link className="card" to="/quiz/play?filter=new"><b>未回答</b><small>{unanswered}問</small></Link>
        <Link className="card" to="/quiz/play?filter=wrong"><b>間違えた問題</b><small>{wrong}問</small></Link>
        <Link className="card" to="/review"><b>🎯 弱点復習</b><small>間違い・苦手テーマ・関連問題</small></Link>
        {course.judgements.length > 0 && <Link className="card" to="/quiz/judge"><b>正誤5択</b><small>{course.judgements.length}問・正しいもの／誤っているものをすべて選ぶ</small></Link>}
      </div>
      <div className="sec-h"><span className="en">BY CHAPTER</span><h2>章を選ぶ</h2></div>
      <div className="qsel">
        {byChapter(course, s).map((r) => (
          <Link key={r.chapter.id} className="card" to={`/quiz/play?chapter=${r.chapter.id}`}>
            <b>{r.chapter.id}. {r.chapter.name}</b>
            <small>{r.total}問・回答{r.answered}{r.pct !== null ? `・正答率${r.pct}%` : ''}</small>
            <div className="bar thin"><i style={{ width: `${(r.correct / r.total) * 100}%` }} /></div>
          </Link>
        ))}
      </div>
    </>
  );
}
