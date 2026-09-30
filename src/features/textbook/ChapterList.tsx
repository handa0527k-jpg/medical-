import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { Rich } from '../../components/Rich';
import { useProgress } from '../../state/hooks';
import { byChapter } from '../../state/analytics';

/** Chapter cards: number, name, metaphor, read / lecture / accuracy status. */
export function ChapterList({ to = (id: number) => `/chapter/${id}` }: { to?: (id: number) => string }) {
  const course = useCourse();
  const s = useProgress();
  const rates = byChapter(course, s);
  return (
    <div className="grid cols-auto clist">
      {course.chapters.map((c, i) => {
        const r = rates[i];
        const lec = s.lectures[c.id];
        return (
          <Link key={c.id} to={to(c.id)} className={'card' + (s.read[c.id] ? ' read' : '')}>
            <span className="no num">{c.id}</span>
            <b>{c.name}</b>
            <small>工場でいうと：{c.role}　／　スライド {c.slides[0]}–{c.slides[c.slides.length - 1]}</small>
            <span className="st">
              {s.read[c.id] && <span className="pill">✓ 読了</span>}
              {lec?.completed ? <span className="pill ok">授業 視聴済</span> : lec ? <span className="pill warn">授業 {Math.round((lec.maxPosition / Math.max(1, lec.total)) * 100)}%</span> : null}
              {r.pct !== null && <span className={'pill ' + (r.pct < 60 ? 'eosin' : 'ok')}>正答率 {r.pct}%</span>}
            </span>
            <div className="bar thin"><i style={{ width: `${(r.correct / Math.max(1, r.total)) * 100}%` }} /></div>
          </Link>
        );
      })}
    </div>
  );
}

export function ChapterOverview({ id }: { id: number }) {
  const c = useCourse().chapters.find((x) => x.id === id)!;
  return (
    <section className="card ov">
      <div className="kick" style={{ color: 'var(--mute)', letterSpacing: '.12em' }}>この章の全体像</div>
      <Rich as="p" className="ov-one" html={c.overview.one} />
      <div className="flow">
        {c.overview.flow.map((f, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && <i>→</i>}
            <Rich as="span" html={f} />
          </span>
        ))}
      </div>
      <div className="cast">
        {c.overview.cast.map((x, i) => (
          <div key={i}><Rich as="b" html={x[0]} /><Rich as="em" html={x[1]} /><Rich as="small" html={x[2]} /></div>
        ))}
      </div>
    </section>
  );
}
