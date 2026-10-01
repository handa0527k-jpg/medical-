import { Link, useParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { InteractiveFigure } from '../../components/InteractiveFigure';
import { NotFound } from '../../app/NotFound';
import { useStudyPage } from '../../state/hooks';

export function FiguresPage() {
  const course = useCourse();
  useStudyPage(null, 'figures');
  return (
    <>
      <section className="page-h">
        <div className="kick">INTERACTIVE FIGURES</div>
        <h1>図解</h1>
        <p>{course.intros?.figures ?? '構造をタップすると、医学名 → 工場での役割 → 実際の機能 → 出典スライドの順に表示されます。'}</p>
      </section>
      <div className="grid cols-auto gal" style={{ marginTop: 16 }}>
        {Object.values(course.figures).map((f) => {
          const chs = course.chapters.filter((c) => c.figures.includes(f.id)).map((c) => c.id);
          return (
            <Link key={f.id} className="card" to={`/figures/${f.id}`}>
              <div className="kick">{f.en}</div>
              <b>{f.title}</b>
              <small>第{chs.join('・')}章　／　出典：スライド{f.sources.join('・')}</small>
              <small>{f.hint}</small>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function FigurePage() {
  const course = useCourse();
  const { id = '' } = useParams();
  const f = course.figures[id];
  useStudyPage(f ? { kind: 'figure', id, label: `図解：${f.title}` } : null, `figure:${id}`);
  if (!f) return <NotFound />;
  return (
    <>
      <Link className="btn sm back" to="/figures">← 図解一覧</Link>
      <InteractiveFigure id={id} />
    </>
  );
}
