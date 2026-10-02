import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { courseStats } from '../../content/registry';
import { lectureStatus } from '../../state/catalog';
import { useProgress } from '../../state/hooks';
import { StatusChip } from '../catalog/StatusChip';

/** Side panel on the lecture screen: every lecture of the course with its status. */
export function LectureList({ current }: { current: number }) {
  const course = useCourse();
  const s = useProgress();
  const st = courseStats(course.id);
  return (
    <section className="side-card">
      <h3><span className="en">LECTURES</span>講義一覧<small>{course.subject}｜{course.lecture.label}</small></h3>
      <ol className="side-lecs">
        {course.chapters.map((c, i) => {
          const ls = lectureStatus(s.lectures[c.id]);
          return (
            <li key={c.id}>
              <Link to={`/lecture/${c.id}`} className={(c.id === current ? 'cur ' : '') + ls.status} aria-current={c.id === current ? 'page' : undefined}>
                <span className="no">{String(c.id).padStart(2, '0')}</span>
                <span className="t"><b>{c.name}</b><small>{st.lectures[i] ? `約${st.lectures[i].minutes}分` : ''}{c.id === current ? '・再生中' : ''}</small></span>
                <StatusChip status={ls.status} lecture pct={ls.pct} />
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="side-links">
        <Link to={`/quiz/play?chapter=${current}`}>第{current}章の確認問題 →</Link>
        <Link to={`/chapter/${current}`}>第{current}章の教科書 →</Link>
        <Link to={`/category/${course.category}`}>分野の教材一覧 →</Link>
      </div>
    </section>
  );
}
