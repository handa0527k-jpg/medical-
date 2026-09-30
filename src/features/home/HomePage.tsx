import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { useProgress, useStudyPage } from '../../state/hooks';
import { mastery, overall, studyTime, todaysPlan, weakSlides, wrongQuestions } from '../../state/analytics';
import { ChapterList } from '../textbook/ChapterList';
import { fmtDur } from '../analytics/StatsPage';

const KIND_LABEL = { chapter: '教科書', lecture: '授業', animation: 'アニメ', figure: '図解', quiz: '問題', zukan: '図鑑' } as const;
const KIND_TO = (k: keyof typeof KIND_LABEL, id: string) =>
  k === 'chapter' ? `/chapter/${id}` : k === 'lecture' ? `/lecture/${id}` : k === 'animation' ? `/animations/${id}` : k === 'figure' ? `/figures/${id}` : k === 'zukan' ? '/zukan' : id === 'review' ? '/review' : '/quiz';

export function HomePage() {
  const course = useCourse();
  const s = useProgress();
  const nav = useNavigate();
  useStudyPage(null, 'home');
  const mapRef = useRef<HTMLDivElement>(null);
  const plan = todaysPlan(course, s);
  const o = overall(course, s);
  const st = studyTime(s);
  const m = mastery(course, s);
  const weak = weakSlides(course, s).slice(0, 4);
  const wrong = wrongQuestions(course, s).length;
  const recent = s.recent.slice(0, 5);
  const readN = Object.keys(s.read).length;
  const lecDone = Object.values(s.lectures).filter((l) => l.completed).length;
  const next = plan[0];

  // cell map: chapter zones are <g class="z" data-c="n">; keep "read" state in sync
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    el.querySelectorAll<SVGGElement>('g.z').forEach((g) => g.querySelector('.tag')?.classList.toggle('read', !!s.read[Number(g.dataset.c)]));
  }, [s.read]);
  const openZone = (t: EventTarget | null) => { const g = (t as Element)?.closest?.('g.z') as SVGGElement | null; if (g) nav(`/chapter/${g.dataset.c}`); };

  return (
    <>
      <section className="hero">
        <div className="scan" aria-hidden="true" />
        <div className="kick">{course.subject} · {course.lecture.label}</div>
        <div className="rule" />
        <div className="en-title">MEDICAL STUDY — INTERACTIVE LECTURE</div>
        <h1>{course.subtitle.replace('工場。', '')}<em>工場。</em></h1>
        <p className="sub">{course.title}（スライド{course.lecture.slideRange[0]}–{course.lecture.slideRange[1]}）。授業を受け、図とアニメーションで仕組みを見て、5択で確かめ、間違いを復習する——ひとつのアプリで完結します。</p>
        <div className="rule" />
        <div className="btnrow">
          {next ? <Link className="btn eosin" to={next.to}>▶ {next.title}</Link> : <Link className="btn eosin" to="/lecture/1">▶ 第1講の授業を受ける</Link>}
          <Link className="btn" to="/book">教科書を開く</Link>
        </div>
      </section>

      <div className="sec-h"><span className="en">TODAY</span><h2>今日の学習</h2></div>
      <div className="plan">
        {plan.map((p, i) => (
          <Link key={i} className="card" to={p.to}>
            <span className="k">{{ lecture: 'LECTURE', chapter: 'TEXTBOOK', review: 'REVIEW', quiz: '5-CHOICE' }[p.kind]}</span>
            <b>{p.title}</b>
            <small>{p.detail}</small>
          </Link>
        ))}
        {!plan.length && <div className="card" style={{ padding: 18 }}>全章・全授業・全問題を終えました。弱点分析で仕上げましょう。</div>}
      </div>

      <div className="sec-h"><span className="en">PROGRESS</span><h2>学習進捗</h2></div>
      <div className="dash">
        <div className="card stat"><h3>理解度</h3><div className="bignum">{m}<small>%</small></div><div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${m}%` }} /></div><small>読了 {readN}/{course.chapters.length}章・授業 {lecDone}/{course.chapters.length}講</small></div>
        <div className="card stat"><h3>正答率</h3><div className="bignum">{o.pct ?? '—'}<small>{o.pct !== null ? '%' : ''}</small></div><small>回答 {o.answered}/{o.total}問・正解 {o.correct}</small></div>
        <div className="card stat"><h3>学習時間</h3><div className="bignum">{Math.round(st.today / 60)}<small>分 今日</small></div><small>累計 {fmtDur(st.total)}・連続 {st.streak}日</small></div>
        <div className="card stat"><h3>要復習</h3><div className="bignum" style={{ color: wrong ? 'var(--eosin)' : undefined }}>{wrong}<small>問</small></div><small><Link to="/review">弱点復習へ →</Link></small></div>
      </div>

      <div className="sec-h"><span className="en">CELL MAP</span><h2>見取り図から学ぶ</h2></div>
      <div className="mapgrid">
        <div className="mapwrap">
          <div
            ref={mapRef}
            onClick={(e) => openZone(e.target)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openZone(e.target); } }}
            dangerouslySetInnerHTML={{ __html: course.mapSvg }}
          />
          <div className="legend"><span><i className="ln" style={{ color: 'var(--eosin)' }} />作った蛋白を外へ出す流れ</span><span><i className="ln" style={{ color: 'var(--hema2)' }} />外から取り込んで分解する流れ</span></div>
        </div>
        <div>
          <h3 className="muted" style={{ fontSize: 13, margin: '0 0 8px', letterSpacing: '.1em' }}>最近学習したテーマ</h3>
          <div className="side-list">
            {recent.length ? recent.map((r, i) => (
              <Link key={i} className="card" to={KIND_TO(r.kind, r.id)}><span className="pill">{KIND_LABEL[r.kind]}</span><span className="t">{r.label}</span><small>{new Date(r.at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</small></Link>
            )) : <div className="card" style={{ padding: '14px 16px' }}><span className="muted" style={{ fontSize: 14 }}>まだ履歴がありません。見取り図の部屋をタップして始めましょう。</span></div>}
          </div>
          <h3 className="muted" style={{ fontSize: 13, margin: '18px 0 8px', letterSpacing: '.1em' }}>復習が必要なテーマ</h3>
          <div className="side-list">
            {weak.length ? weak.map((w) => (
              <Link key={w.slide.n} className="card" to={`/chapter/${w.slide.chapter}?slide=${w.slide.n}`}><span className="pill eosin">{w.pct}%</span><span className="t">スライド{w.slide.n}　{w.slide.title}</span></Link>
            )) : <div className="card" style={{ padding: '14px 16px' }}><span className="muted" style={{ fontSize: 14 }}>間違えたテーマはまだありません。</span></div>}
          </div>
        </div>
      </div>

      <div className="sec-h"><span className="en">CHAPTERS</span><h2>章一覧</h2></div>
      <ChapterList />
    </>
  );
}
