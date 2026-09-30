import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { NotFound } from '../../app/NotFound';
import { useStudyPage } from '../../state/hooks';
import AnimationPlayer from './AnimationPlayer';

export default function AnimationPage() {
  const course = useCourse();
  const { id = '' } = useParams();
  const a = course.animations[id];
  const [sp] = useSearchParams();
  const startAt = sp.get('t') ? Number(sp.get('t')) : undefined;
  useStudyPage(a ? { kind: 'animation', id, label: `アニメ：${a.meta.title}` } : null, `animation:${id}`);
  if (!a) return <NotFound />;
  return (
    <>
      <div className="btnrow" style={{ marginTop: 0, marginBottom: 14 }}>
        <Link className="btn sm" to="/animations" style={{ flex: '0 0 auto' }}>← アニメーション一覧</Link>
        <Link className="btn sm" to={`/chapter/${a.meta.chapter}`} style={{ flex: '0 0 auto' }}>第{a.meta.chapter}章の教科書</Link>
      </div>
      <AnimationPlayer id={id} startAt={startAt} />
    </>
  );
}
