import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { NotFound } from '../../app/NotFound';
import type { Lecture } from '../../engine/lecture/types';
import { useStudyPage } from '../../state/hooks';
import { LecturePlayer } from './LecturePlayer';

export default function LecturePage() {
  const course = useCourse();
  const id = Number(useParams().id);
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
      <div className="btnrow" style={{ marginTop: 0, marginBottom: 14 }}>
        <Link className="btn sm" to="/lectures" style={{ flex: '0 0 auto' }}>← 授業一覧</Link>
        <Link className="btn sm" to={`/chapter/${id}`} style={{ flex: '0 0 auto' }}>第{id}章の教科書</Link>
      </div>
      {lec ? <LecturePlayer key={id} lecture={lec} chapter={id} /> : <div className="empty">授業を読み込み中…</div>}
    </>
  );
}
