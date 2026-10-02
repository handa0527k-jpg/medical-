import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCourse, useSwitchCourse } from '../../app/course';
import { COURSES } from '../../content/registry';

/**
 * /open/<courseId>/<path>: opens that course (if it is not the open one) and
 * continues to <path> inside it, e.g. /open/embryology-early/lecture/3.
 * Lets the category pages link straight into any course's lectures, textbook or quizzes.
 */
export function OpenCourse() {
  const { courseId = '', '*': rest = '' } = useParams();
  const course = useCourse();
  const switchCourse = useSwitchCourse();
  const nav = useNavigate();
  const { search } = useLocation();
  const [err, setErr] = useState(false);
  const known = COURSES.some((c) => c.id === courseId);
  useEffect(() => {
    if (!known) return;
    if (course.id !== courseId) { switchCourse(courseId).catch(() => setErr(true)); return; }
    nav('/' + rest + search, { replace: true });
  }, [known, course.id, courseId, rest, search, nav, switchCourse]);
  if (!known || err) {
    return (
      <div className="empty">
        <p>{known ? '教材を読み込めませんでした。通信状態を確認してください。' : 'この教材は見つかりませんでした。'}</p>
        <Link className="btn" to="/">ホームへ戻る</Link>
      </div>
    );
  }
  return <div className="empty">教材を開いています…</div>;
}
