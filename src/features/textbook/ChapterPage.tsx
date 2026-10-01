import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { metaphorWord } from '../../content/registry';
import { Rich } from '../../components/Rich';
import { InteractiveFigure } from '../../components/InteractiveFigure';
import { NotFound } from '../../app/NotFound';
import { useProgress, useStore, useStudyPage } from '../../state/hooks';
import { byChapter } from '../../state/analytics';
import { Block } from './Blocks';
import { ChapterOverview } from './ChapterList';

const AnimationPlayer = lazy(() => import('../animations/AnimationPlayer'));

export function ChapterPage() {
  const course = useCourse();
  const id = Number(useParams().id);
  const ch = course.chapters.find((c) => c.id === id);
  const [params] = useSearchParams();
  const jump = Number(params.get('slide')) || null;
  const store = useStore();
  const s = useProgress();
  useStudyPage(ch ? { kind: 'chapter', id: String(id), label: `第${id}章 ${ch.name}` } : null, `chapter:${id}`);
  const [flash, setFlash] = useState<number | null>(null);

  useEffect(() => {
    if (!jump) return;
    const t = setTimeout(() => {
      document.getElementById(`sf${jump}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      setFlash(jump);
      setTimeout(() => setFlash(null), 1800);
    }, 120);
    return () => clearTimeout(t);
  }, [jump, id]);

  const tb = ch ? course.text[id] : null;
  const traps = useMemo(() => course.questions.filter((q) => q.chapter === id).filter((_q, i) => i % 2 === 0).slice(0, 5), [course, id]);
  const checks = useMemo(() => {
    if (!ch) return [];
    const all = ch.slides.flatMap((n) => course.slides[n].selfCheck.map((q) => ({ ...q, n })));
    const hot = all.filter((q) => q.hot);
    return hot.length >= 3 ? hot.slice(0, 6) : all.slice(0, 5);
  }, [course, ch]);
  const [openQa, setOpenQa] = useState<Set<number>>(new Set());

  if (!ch || !tb) return <NotFound />;
  const rate = byChapter(course, s)[id - 1];
  const read = !!s.read[id];
  const lec = s.lectures[id];

  return (
    <>
      <section className="chero play" key={id}>
        <div className="bgnum" aria-hidden="true">{String(id).padStart(2, '0')}</div>
        <div className="meta">第{id}章　／　{metaphorWord(course)}でいうと：{ch.role}　／　スライド {ch.slides[0]}〜{ch.slides[ch.slides.length - 1]}</div>
        <h1>{ch.name}</h1>
        <div className="role">比喩：{ch.role}</div>
        <nav className="jump-nav" aria-label="章内ジャンプ">
          {[['s-ov', 'OVERVIEW'], ['s-tb', 'TEXTBOOK'], ...(ch.figures.length ? [['s-fig', 'FIGURE']] : []), ...(ch.animations.length ? [['s-anim', 'ANIMATION']] : []), ['s-ep', 'EXAM POINT'], ['s-ck', 'CHECK'], ['s-qz', '5-CHOICE']].map(([k, l]) => (
            <a key={k} href={`#${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(k)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{l}</a>
          ))}
        </nav>
        <div className="line" />
      </section>

      <div className="btnrow">
        <Link className="btn eosin" to={`/lecture/${id}`}>▶ 第{id}講の授業を受ける{lec && !lec.completed && lec.position > 5 ? '（続きから）' : ''}</Link>
        <Link className="btn" to={`/quiz/play?chapter=${id}`}>この章の5択問題（{rate.total}問）</Link>
      </div>

      <div className="sec-h" id="s-ov"><span className="en">OVERVIEW</span><h2>この章の全体像</h2></div>
      <ChapterOverview id={id} />

      <div className="sec-h" id="s-tb"><span className="en">TEXTBOOK</span><h2>教科書</h2></div>
      <article className="book">
        {tb.blocks.map((b, i) => <Block key={i} b={b} flashSlide={flash} />)}
        <div className="sumb"><h4>章末まとめ</h4><ul>{tb.summary.map((x, i) => <Rich as="li" key={i} html={x} />)}</ul></div>
      </article>

      {ch.figures.length > 0 && (
        <>
          <div className="sec-h" id="s-fig"><span className="en">INTERACTIVE FIGURE</span><h2>触って理解する図解</h2></div>
          <div className="grid" style={{ gap: 14 }}>{ch.figures.map((f) => <InteractiveFigure key={f} id={f} />)}</div>
        </>
      )}

      {ch.animations.length > 0 && (
        <>
          <div className="sec-h" id="s-anim"><span className="en">ANIMATION</span><h2>動きで理解する</h2></div>
          <Suspense fallback={<div className="empty">アニメーションを読み込み中…</div>}>
            <div className="grid" style={{ gap: 18 }}>{ch.animations.map((a) => <AnimationPlayer key={a} id={a} />)}</div>
          </Suspense>
        </>
      )}

      <div className="sec-h" id="s-ep"><span className="en">EXAM POINT</span><h2>試験の急所</h2></div>
      <div className="card ep">
        <h4>覚えること（学習目標）</h4>
        <ul>{ch.points.map((p, i) => <Rich as="li" key={i} html={p} />)}</ul>
        <h4>間違えやすいポイント</h4>
        <ul>
          {traps.map((q) => (
            <li key={q.id}><Rich html={q.point} /><Link className="chip" to={`/chapter/${id}?slide=${q.slide}`}>スライド{q.slide}</Link></li>
          ))}
        </ul>
      </div>

      <div className="sec-h" id="s-ck"><span className="en">SELF CHECK</span><h2>この章の確認</h2></div>
      <section className="card check" style={{ padding: '10px 18px 16px' }}>
        <p className="muted" style={{ margin: '8px 4px', fontSize: 14 }}>本文とスライドを見ずに答えてから、タップで答え合わせ。</p>
        {checks.map((q, i) => (
          <button key={i} className={'qa' + (openQa.has(i) ? ' open' : '')} aria-expanded={openQa.has(i)} onClick={() => setOpenQa((o) => { const x = new Set(o); if (x.has(i)) x.delete(i); else x.add(i); return x; })}>
            <Rich html={q.q} />
            <Rich className="a" html={q.a} />
            <small><Rich html={q.hint} />（スライド{q.n}）</small>
          </button>
        ))}
      </section>

      <div className="sec-h" id="s-qz"><span className="en">5-CHOICE QUIZ</span><h2>この章の5択問題</h2></div>
      <div className="card" style={{ padding: '18px 22px' }}>
        <div>この章の問題：<b>{rate.total}問</b>（スライド1枚につき2問）　回答 {rate.answered}　{rate.pct !== null && <>正答率 <b style={{ color: 'var(--eosin)' }}>{rate.pct}%</b></>}</div>
        <div className="btnrow">
          <Link className="btn eosin" to={`/quiz/play?chapter=${id}`}>この章の5択を解く</Link>
          <Link className="btn" to={`/quiz/judge?chapter=${id}`}>正誤5択（すべて選べ）</Link>
          {rate.answered > rate.correct && <Link className="btn" to={`/quiz/play?chapter=${id}&filter=wrong`}>間違えた問題だけ</Link>}
        </div>
      </div>

      <div className="btnrow">
        <button className={'btn ' + (read ? 'done' : 'pri')} onClick={() => store.toggleRead(id)} aria-pressed={read}>
          {read ? '✓ 読了済み（タップで取り消し）' : 'この章を読了にする'}
        </button>
        {id < course.chapters.length && <Link className="btn" to={`/chapter/${id + 1}`}>NEXT ▶ 第{id + 1}章 {course.chapters[id].name}</Link>}
        <Link className="btn" to="/">見取り図に戻る</Link>
      </div>
    </>
  );
}
