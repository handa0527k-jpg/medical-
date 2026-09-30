import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { Rich } from '../../components/Rich';
import type { Lecture } from '../../engine/lecture/types';
import { useProgress } from '../../state/hooks';
import { byChapter } from '../../state/analytics';

const LET = ['A', 'B', 'C', 'D', 'E'];

/**
 * After the lecture: understanding, accuracy on the in-lecture questions,
 * the questions missed or skipped, and the topics to review — each with a
 * button back to the scene where it was taught.
 */
export function LectureReport({ lecture, chapter, answers, sectionStart, onJump }: {
  lecture: Lecture;
  chapter: number;
  answers: Record<string, number>;
  sectionStart: (section: number) => number;
  onJump: (t: number) => void;
}) {
  const course = useCourse();
  const s = useProgress();
  const quizzes = (lecture.quizzes || []).map((z) => ({ ...z, q: course.questions.find((q) => q.id === z.qid)! }));
  const answered = quizzes.filter((z) => answers[z.qid] !== undefined);
  const correct = answered.filter((z) => z.q.options[answers[z.qid]].correct);
  const missed = quizzes.filter((z) => answers[z.qid] === undefined || !z.q.options[answers[z.qid]].correct);
  const understanding = quizzes.length ? Math.round((correct.length / quizzes.length) * 100) : null;
  const chRate = byChapter(course, s)[chapter - 1];
  const reviewSections = [...new Set(missed.map((z) => z.section))];

  return (
    <div className="lrep">
      <div className="lrep-stats">
        <div><span>理解度</span><b>{understanding ?? '—'}<small>{understanding !== null ? '%' : ''}</small></b><em>授業内の問題 {correct.length}/{quizzes.length} 正解</em></div>
        <div><span>問題正答率</span><b>{answered.length ? Math.round((correct.length / answered.length) * 100) : '—'}<small>{answered.length ? '%' : ''}</small></b><em>回答 {answered.length}問</em></div>
        <div><span>この章の正答率</span><b>{chRate.pct ?? '—'}<small>{chRate.pct !== null ? '%' : ''}</small></b><em>5択 {chRate.answered}/{chRate.total}問 回答済み</em></div>
      </div>
      {missed.length > 0 ? (
        <>
          <p className="lrep-h">今日の授業でここを復習しましょう</p>
          <div className="lrep-sec">
            {reviewSections.map((i) => (
              <button key={i} className="chip" onClick={() => onJump(sectionStart(i))}>▶ {lecture.sections[i]?.name}</button>
            ))}
          </div>
          <p className="lrep-h">間違えた・答えなかった問題</p>
          <ul className="lrep-list">
            {missed.map((z) => {
              const a = answers[z.qid];
              const ans = z.q.options.findIndex((o) => o.correct);
              return (
                <li key={z.qid}>
                  <div className="lrep-q"><span className="pill eosin">{a === undefined ? '未回答' : `あなた ${LET[a]} → 正解 ${LET[ans]}`}</span><Rich html={z.q.stem} /></div>
                  <div className="lrep-p"><Rich html={z.q.point} /></div>
                  <div className="chips">
                    <button className="chip" onClick={() => onJump(sectionStart(z.section))}>授業のこの場面へ</button>
                    <Link className="chip" to={`/chapter/${chapter}?slide=${z.q.slide}`}>教科書：スライド{z.q.slide}</Link>
                    <Link className="chip" to={`/quiz/play?ids=${z.qid}&label=${encodeURIComponent('授業の復習')}&review=1`}>解き直す</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : quizzes.length ? (
        <p className="lrep-h good">授業内の問題はすべて正解です。この調子で、章の5択問題に進みましょう。</p>
      ) : (
        <p>この講義の範囲から5択問題を出題します。間違えた問題は、弱点復習から該当スライドに戻れます。</p>
      )}
    </div>
  );
}
