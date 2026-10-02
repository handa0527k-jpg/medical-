import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { NotFound } from '../../app/NotFound';
import type { Lecture } from '../../engine/lecture/types';
import { useStudyPage } from '../../state/hooks';
import { LecturePlayer } from './LecturePlayer';
import { LectureList } from './LectureList';

export default function LecturePage() {
  const course = useCourse();
  const id = Number(useParams().id);
  const [sp] = useSearchParams();
  const startAt = sp.get('t') ? Number(sp.get('t')) : undefined;
  const ch = course.chapters.find((c) => c.id === id);
  const [lec, setLec] = useState<Lecture | null>(null);
  const [err, setErr] = useState(false);
  useStudyPage(ch ? { kind: 'lecture', id: String(id), label: `第${id}講 ${ch.name}` } : null, `lecture:${id}`, { current: true });
  useEffect(() => {
    if (!ch) return;
    let live = true;
    setLec(null);
    course.loadLecture(id).then((l) => live && setLec(l)).catch(() => live && setErr(true));
    return () => { live = false; };
  }, [course, id, ch]);

  if (!ch || err) return <NotFound />;
  return (
    <>
      <nav className="crumb" aria-label="パンくず">
        <Link to="/">ホーム</Link><span aria-hidden="true">／</span>
        <Link to={`/category/${course.category}`}>{course.subject}</Link><span aria-hidden="true">／</span>
        <Link to="/lectures">授業一覧</Link><span aria-hidden="true">／</span>
        <span>第{id}講 {ch.name}</span>
      </nav>
      {lec ? <LecturePlayer key={id} lecture={lec} chapter={id} startAt={startAt} side={<LectureList current={id} />} /> : <div className="empty">授業を読み込み中…</div>}
    </>
  );
}
