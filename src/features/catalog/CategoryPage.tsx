import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categoryById, CATEGORIES } from '../../content/categories';
import { coursesIn } from '../../content/registry';
import { categorySummary, lectureStatus, useCatalog, type CourseProgress } from '../../state/catalog';
import { useStudyPage } from '../../state/hooks';
import { NotFound } from '../../app/NotFound';
import { CategoryIcon } from './CategoryIcon';
import { StatusChip } from './StatusChip';
import { fmtMinutes } from '../home/HomePage';

type Tab = 'lectures' | 'materials' | 'quiz' | 'review';
const TABS: { id: Tab; label: string; en: string }[] = [
  { id: 'lectures', label: '授業動画', en: 'LECTURES' },
  { id: 'materials', label: '講義資料', en: 'MATERIALS' },
  { id: 'quiz', label: '確認問題', en: 'QUESTIONS' },
  { id: 'review', label: '復習', en: 'REVIEW' },
];

/** One medical field: its courses, each with lectures / materials / questions / review. */
export function CategoryPage() {
  const id = useParams().id ?? '';
  const k = categoryById(id);
  useStudyPage(null, `category:${id}`);
  const cat = useCatalog();
  if (!k) return <NotFound />;
  const list = coursesIn(k.id).map((m) => cat[m.id]);
  const sum = categorySummary(list);

  return (
    <>
      <nav className="crumb" aria-label="パンくず"><Link to="/">ホーム</Link><span aria-hidden="true">／</span><span>{k.name}</span></nav>
      <section className="cat-head">
        <span className="cc-ic lg"><CategoryIcon name={k.icon} size={34} /></span>
        <div className="ch-body">
          <div className="kick">{k.en}</div>
          <h1>{k.name}</h1>
          <p>{k.desc}</p>
        </div>
        {sum.count > 0 && (
          <div className="ch-stats">
            <span><b>{sum.count}</b><small>教材</small></span>
            <span><b>{sum.lectures}</b><small>授業</small></span>
            <span><b>{fmtMinutes(sum.minutes).replace('約', '')}</b><small>授業時間</small></span>
            <span className="pc"><b>{sum.pct}<small>%</small></b><small>進捗</small><div className="bar thin"><i style={{ width: `${sum.pct}%` }} /></div></span>
          </div>
        )}
      </section>

      {list.length ? (
        <div className="cblocks">{list.map((c) => <CourseBlock key={c.meta.id} c={c} here={k.id} />)}</div>
      ) : (
        <div className="card cat-empty">
          <span className="cc-ic lg"><CategoryIcon name={k.icon} size={34} /></span>
          <h2>{k.name}の教材は準備中です</h2>
          <p>講義資料（PDF）を追加すると、この分野に授業動画・教科書・確認問題・復習がまとまって表示されます。</p>
          <div className="btnrow" style={{ justifyContent: 'center' }}>
            <Link className="btn" to="/">ほかの分野を見る</Link>
          </div>
        </div>
      )}

      <div className="sec-h"><span className="en">FIELDS</span><h2>ほかの分野</h2></div>
      <div className="cat-chips">
        {CATEGORIES.filter((x) => x.id !== k.id).map((x) => (
          <Link key={x.id} to={`/category/${x.id}`} className={coursesIn(x.id).length ? '' : 'off'}>
            <CategoryIcon name={x.icon} size={18} />{x.name}<small>{coursesIn(x.id).length || '準備中'}</small>
          </Link>
        ))}
      </div>
    </>
  );
}

function CourseBlock({ c, here }: { c: CourseProgress; here: string }) {
  const [tab, setTab] = useState<Tab>('lectures');
  const { meta, stats, s } = c;
  const to = (p: string) => `/open/${meta.id}/${p}`;
  const elsewhere = meta.category !== here ? categoryById(meta.category) : null;
  const wrongN = c.wrong;
  return (
    <section className="cblock card" aria-label={meta.title}>
      <header className="cb-head">
        <div className="cb-title">
          <div className="cb-k">{meta.subject}{elsewhere && <small>　{elsewhere.name}の教材としても掲載</small>}</div>
          <h2>{meta.title.split("｜").pop()}</h2>
          <p>{meta.subtitle}</p>
        </div>
        <div className="cb-prog">
          <StatusChip status={c.status} />
          <div className="cb-pct"><b>{c.pct}</b><small>%</small></div>
          <div className="bar thin"><i style={{ width: `${c.pct}%` }} /></div>
          <small>授業 {c.lecturesDone}/{c.lectures}・読了 {c.read}/{meta.chapters.length}章・問題 {c.answered}/{c.questions}</small>
        </div>
        <div className="cb-act">
          <Link className="btn eosin" to={to(`lecture/${c.next ?? 1}`)}>▶ {c.status === 'new' ? '第1講から始める' : c.next ? `続きから：第${c.next}講` : 'もう一度見る'}</Link>
          <Link className="btn" to={to('course')}>教材トップ</Link>
        </div>
      </header>

      <div className="cb-tabs" role="tablist" aria-label="内容">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <span className="en">{t.en}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="cb-panel" role="tabpanel">
        {tab === 'lectures' && (
          <ol className="lec-rows">
            {meta.chapters.map((ch, i) => {
              const ls = lectureStatus(s.lectures[ch.id]);
              const L = stats.lectures[i];
              return (
                <li key={ch.id}>
                  <Link to={to(`lecture/${ch.id}`)} className={'lec-row ' + ls.status}>
                    <span className="lr-play" aria-hidden="true">{ls.status === 'done' ? '✓' : '▶'}</span>
                    <span className="lr-body">
                      <b><span className="lr-no">第{ch.id}講</span>{ch.name}</b>
                      <small>{L ? `約${L.minutes}分` : ''}・スライド{ch.slides[0]}–{ch.slides[ch.slides.length - 1]}{L?.audio ? '・音声収録済み' : ''}</small>
                      {ls.status === 'active' && <span className="bar thin"><i style={{ width: `${ls.pct}%` }} /></span>}
                    </span>
                    <StatusChip status={ls.status} lecture pct={ls.pct} />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        {tab === 'materials' && (
          <>
            <div className="mat-tiles">
              <Link to={to('book')}><b>教科書</b><small>{meta.chapters.length}章・スライド{meta.lecture.slideRange[0]}–{meta.lecture.slideRange[1]}</small></Link>
              <Link to={to('figures')}><b>図解</b><small>{stats.figures}枚</small></Link>
              <Link to={to('animations')}><b>アニメーション</b><small>{stats.animations}本</small></Link>
              <Link to={to('zukan')}><b>図鑑</b><small>{stats.zukan}項目</small></Link>
            </div>
            <ol className="lec-rows">
              {meta.chapters.map((ch) => {
                const read = !!s.read[ch.id];
                return (
                  <li key={ch.id}>
                    <Link to={to(`chapter/${ch.id}`)} className={'lec-row ' + (read ? 'done' : 'new')}>
                      <span className="lr-play doc" aria-hidden="true">{read ? '✓' : ch.id}</span>
                      <span className="lr-body"><b><span className="lr-no">第{ch.id}章</span>{ch.name}</b><small>スライド{ch.slides.length}枚・赤シートつき</small></span>
                      <span className={'st-chip ' + (read ? 'done' : 'new')}><i aria-hidden="true" />{read ? '読了' : '未読'}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {tab === 'quiz' && (
          <>
            <div className="mat-tiles">
              <Link to={to('quiz')} className="hl"><b>5択問題メニュー</b><small>全{c.questions}問・回答 {c.answered}問{c.answered ? `・正答率 ${Math.round((c.correct / c.answered) * 100)}%` : ''}</small></Link>
              <Link to={to('review')}><b>間違えた問題</b><small>{wrongN ? `${wrongN}問を解き直す` : 'まだありません'}</small></Link>
            </div>
            <ol className="lec-rows">
              {meta.chapters.map((ch) => {
                const ids = stats.single[ch.id] ?? [];
                const ans = ids.filter((q) => s.questions[q]);
                const ok = ans.filter((q) => s.questions[q].lastCorrect).length;
                const js = stats.judgement[ch.id] ?? [];
                const st = !ans.length ? 'new' : ans.length === ids.length ? 'done' : 'active';
                return (
                  <li key={ch.id} className="q-row">
                    <Link to={to(`quiz/play?chapter=${ch.id}`)} className={'lec-row ' + st}>
                      <span className="lr-play doc" aria-hidden="true">{ch.id}</span>
                      <span className="lr-body">
                        <b><span className="lr-no">第{ch.id}章</span>{ch.name}</b>
                        <small>5択 {ids.length}問・回答 {ans.length}{ans.length ? `・正答率 ${Math.round((ok / ans.length) * 100)}%` : ''}</small>
                      </span>
                      <span className={'st-chip ' + st}><i aria-hidden="true" />{st === 'new' ? '未回答' : st === 'done' ? '全問回答' : '回答中'}</span>
                    </Link>
                    {js.length > 0 && <Link className="q-judge" to={to(`quiz/judge?chapter=${ch.id}`)}>正誤 {js.length}セット</Link>}
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {tab === 'review' && (
          <div className="mat-tiles">
            <Link to={to('review')} className={wrongN ? 'hl' : ''}><b>弱点復習</b><small>{wrongN ? `間違えた問題 ${wrongN}問と苦手テーマ` : '問題を解くと、苦手なテーマがここに集まります'}</small></Link>
            <Link to={to('stats')}><b>成績・弱点分析</b><small>正答率・学習時間・つまずきの型</small></Link>
            {stats.lectures.filter((l) => l.board).map((l) => (
              <Link key={l.id} to={to(`review5/${l.id}`)}><b>5分復習：第{l.id}講</b><small>{meta.chapters.find((x) => x.id === l.id)?.name}の板書と要点</small></Link>
            ))}
            {!stats.lectures.some((l) => l.board) && meta.chapters.map((ch) => (
              <Link key={ch.id} to={to(`chapter/${ch.id}`)}><b>第{ch.id}章の要点</b><small>{ch.name}：赤シートで確認</small></Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
