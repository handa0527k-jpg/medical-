import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../content/categories';
import { COURSES, coursesIn } from '../../content/registry';
import { categorySummary, useCatalog, type CourseProgress } from '../../state/catalog';
import { useStudyPage } from '../../state/hooks';
import { useCourse } from '../../app/course';
import { CategoryIcon } from '../catalog/CategoryIcon';
import { StatusChip } from '../catalog/StatusChip';
import { TodayLecture } from './CourseHomePage';

export const fmtMinutes = (m: number) => (m >= 60 ? `約${Math.floor(m / 60)}時間${m % 60 ? `${m % 60}分` : ''}` : `約${m}分`);

/** Platform home: continue where you left off, then every medical field as a card. */
export function HomePage() {
  useStudyPage(null, 'home');
  const open = useCourse();
  const cat = useCatalog();
  const all = Object.values(cat);
  const lectures = all.reduce((a, c) => a + c.lectures, 0);
  const minutes = all.reduce((a, c) => a + c.minutes, 0);
  const filled = CATEGORIES.filter((c) => coursesIn(c.id).length).length;
  const active = all.filter((c) => c.status === 'active').sort((a, b) => b.lastAt - a.lastAt);
  const cur = cat[open.id];

  return (
    <>
      <section className="hero home-hero">
        <div className="scan" aria-hidden="true" />
        <div className="kick">MED·STUDY · 医学部生のための学習プラットフォーム</div>
        <div className="rule" />
        <div className="en-title">MEDICAL STUDY PLATFORM</div>
        <h1>医学を、分野ごとに、<em>授業から。</em></h1>
        <p className="sub">講義資料をもとにした予備校スタイルの授業、教科書、5択問題、弱点復習を、医学の分野別に整理しました。今日の続きからでも、気になる分野からでも始められます。</p>
        <div className="hh-stats" aria-label="収録内容">
          <span><b>{filled}</b><small>分野</small></span>
          <span><b>{COURSES.length}</b><small>教材</small></span>
          <span><b>{lectures}</b><small>授業</small></span>
          <span><b>{Math.round(minutes / 6) / 10}</b><small>時間</small></span>
        </div>
        <div className="rule" />
        <div className="btnrow">
          <Link className="btn eosin" to={`/lecture/${cur.next ?? 1}`}>▶ {cur.next ? `続きから：第${cur.next}講` : '授業をもう一度見る'}</Link>
          <a className="btn" href="#fields" onClick={(e) => { e.preventDefault(); document.getElementById('fields')?.scrollIntoView({ behavior: 'smooth' }); }}>分野から選ぶ</a>
        </div>
      </section>

      <TodayLecture />

      {active.length > 0 && (
        <>
          <div className="sec-h"><span className="en">IN PROGRESS</span><h2>学習中の教材</h2></div>
          <div className="inprog">
            {active.slice(0, 4).map((c) => <InProgress key={c.meta.id} c={c} />)}
          </div>
        </>
      )}

      <div className="sec-h" id="fields"><span className="en">FIELDS</span><h2>分野から学ぶ</h2></div>
      <div className="cat-grid">
        {CATEGORIES.map((k) => {
          const list = coursesIn(k.id).map((m) => cat[m.id]);
          const sum = categorySummary(list);
          const empty = !sum.count;
          return (
            <Link key={k.id} to={`/category/${k.id}`} className={'cat-card' + (empty ? ' is-empty' : '')} aria-label={`${k.name}：${empty ? '準備中' : `${sum.count}教材・進捗${sum.pct}%`}`}>
              <div className="cc-top">
                <span className="cc-ic"><CategoryIcon name={k.icon} /></span>
                <span className="cc-en">{k.en}</span>
                {!empty && <StatusChip status={sum.status} />}
              </div>
              <h3>{k.name}</h3>
              <p>{k.desc}</p>
              <div className="cc-meta">
                {empty ? <span>教材 準備中</span> : <><span><b>{sum.count}</b>教材</span><span>{sum.lectures}講・{fmtMinutes(sum.minutes)}</span></>}
              </div>
              <div className="cc-prog">
                <div className="bar thin"><i style={{ width: `${sum.pct}%` }} /></div>
                <span>進捗 <b>{empty ? '—' : `${sum.pct}%`}</b></span>
              </div>
              <span className={'cc-go' + (empty ? ' off' : '')}>{empty ? '準備中' : '学習する'}<span aria-hidden="true">→</span></span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function InProgress({ c }: { c: CourseProgress }) {
  const k = CATEGORIES.find((x) => x.id === c.meta.category);
  return (
    <div className="ip-card">
      <span className="cc-ic sm"><CategoryIcon name={k?.icon ?? 'other'} size={20} /></span>
      <div className="ip-body">
        <small>{k?.name}</small>
        <b>{c.meta.title.split('｜').pop()}</b>
        <div className="bar thin"><i style={{ width: `${c.pct}%` }} /></div>
        <small>授業 {c.lecturesDone}/{c.lectures}講・問題 {c.answered}/{c.questions}問・進捗 {c.pct}%</small>
      </div>
      <Link className="btn sm eosin" to={`/open/${c.meta.id}/lecture/${c.next ?? 1}`}>▶ {c.next ? `第${c.next}講` : '復習'}</Link>
    </div>
  );
}
