import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { useProgress, useStudyPage } from '../../state/hooks';
import { attemptAccuracy, byChapter, bySlide, lectureSummary, mastery, overall, studyTime, weakChapters, wrongQuestions } from '../../state/analytics';
import { Rich } from '../../components/Rich';

export const fmtDur = (sec: number) => {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m}分` : `${Math.floor(m / 60)}時間${m % 60 ? `${m % 60}分` : ''}`;
};

/** 成績・弱点分析 */
export function StatsPage() {
  const course = useCourse();
  const s = useProgress();
  useStudyPage(null, 'stats');
  const o = overall(course, s);
  const at = attemptAccuracy(s);
  const st = studyTime(s);
  const chs = byChapter(course, s);
  const slides = bySlide(course, s);
  const wrong = wrongQuestions(course, s);
  const weak = weakChapters(course, s);
  const lec = lectureSummary(course, s);
  const maxDay = Math.max(600, ...st.days.map((d) => d.seconds));
  const reviewAnswers = s.answers.filter((a) => a.review).length;

  return (
    <>
      <section className="page-h">
        <div className="kick">ANALYTICS</div>
        <h1>成績・弱点分析</h1>
        <p>正答率は各問題の「最新の回答」で集計しています。回答履歴はすべて端末に保存されます。</p>
      </section>

      <div className="grid cols-3" style={{ marginTop: 16 }}>
        <div className="card stat"><h3>正答率</h3><div className="bignum">{o.pct ?? '—'}<small>{o.pct !== null ? '%' : ''}</small></div><small className="muted">正答 {o.correct} ／ 回答 {o.answered} ／ 総問題数 {o.total}</small></div>
        <div className="card stat"><h3>学習時間</h3><div className="bignum">{Math.round(st.total / 60)}<small>分</small></div><small className="muted">今日 {fmtDur(st.today)} ・ 連続 {st.streak}日</small></div>
        <div className="card stat"><h3>理解度</h3><div className="bignum">{mastery(course, s)}<small>%</small></div><small className="muted">読了・授業・正答の平均</small></div>
      </div>
      <div className="grid cols-3" style={{ marginTop: 12 }}>
        <div className="card stat"><h3>延べ回答</h3><b style={{ fontSize: 22 }}>{at.attempts}回</b><small className="muted">　正解 {at.correct}（{at.pct ?? '—'}%）</small></div>
        <div className="card stat"><h3>間違えた問題</h3><b style={{ fontSize: 22, color: 'var(--eosin)' }}>{wrong.length}問</b><small className="muted">　<Link to="/review">弱点復習へ →</Link></small></div>
        <div className="card stat"><h3>復習</h3><b style={{ fontSize: 22 }}>{s.reviews.length}回</b><small className="muted">　復習での回答 {reviewAnswers}問</small></div>
      </div>

      <div className="sec-h"><span className="en">STUDY TIME</span><h2>学習時間（直近14日）</h2></div>
      <div className="card chart-card">
        <div className="daybars" role="img" aria-label="直近14日の学習時間">
          {st.days.map((d) => (
            <div key={d.day} className="db" title={`${d.day}：${fmtDur(d.seconds)}`}>
              <span className="v">{d.seconds >= 60 ? Math.round(d.seconds / 60) : ''}</span>
              <i style={{ height: `${Math.max(d.seconds ? 4 : 0, (d.seconds / maxDay) * 100)}%` }} />
              <span className="d">{Number(d.day.slice(8))}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>単位：分。画面を見て操作している時間（または授業・アニメ再生中）だけを数えます。</p>
      </div>

      <div className="sec-h"><span className="en">BY CHAPTER</span><h2>テーマ（章）別正答率</h2></div>
      <div className="card" style={{ padding: '18px 22px' }}>
        <div className="cbars">
          {chs.map((r) => (
            <div className="cbar" key={r.chapter.id} title={`第${r.chapter.id}章 ${r.chapter.name}：${r.pct ?? '未回答'}${r.pct !== null ? '%' : ''}`}>
              <span className="n">{r.chapter.id}</span>
              <div>
                <div className="nm">{r.chapter.name}　<span className="muted">回答 {r.answered}/{r.total}</span></div>
                <div className={'bar ' + (r.pct !== null && r.pct < 60 ? 'low' : '')}><i style={{ width: `${r.pct ?? 0}%` }} /></div>
              </div>
              <span className="pc">{r.pct === null ? '—' : `${r.pct}%`}</span>
            </div>
          ))}
        </div>
        {weak.length > 0 && <p style={{ margin: '14px 0 0' }}>いちばん苦手：<b style={{ color: 'var(--eosin)' }}>第{weak[0].chapter.id}章 {weak[0].chapter.name}（{weak[0].pct}%）</b></p>}
      </div>

      <div className="sec-h"><span className="en">BY SLIDE</span><h2>スライド別正答率</h2></div>
      <div className="card chart-card">
        <div className="heat" role="list" aria-label="スライド別正答率">
          {slides.map((x) => {
            const cls = x.pct === null ? 'na' : x.pct >= 100 ? 'h4' : x.pct >= 50 ? 'h2' : 'h1';
            return (
              <Link role="listitem" key={x.slide.n} to={`/quiz/play?slide=${x.slide.n}`} className={'hc ' + cls} title={`スライド${x.slide.n}「${x.slide.title}」：${x.pct === null ? '未回答' : `${x.pct}%（${x.correct}/${x.answered}）`}`}>
                <b>{x.slide.n}</b><small>{x.pct === null ? '—' : `${x.pct}%`}</small>
              </Link>
            );
          })}
        </div>
        <div className="legend">
          <span><i className="hc na" />未回答</span><span><i className="hc h1" />0–49%</span><span><i className="hc h2" />50–99%</span><span><i className="hc h4" />100%</span>
        </div>
      </div>

      <div className="sec-h"><span className="en">LECTURES</span><h2>授業の視聴状況</h2></div>
      <div className="card" style={{ padding: '18px 22px' }}>
        <div className="cbars">
          {lec.map((l) => (
            <div className="cbar" key={l.chapter.id}>
              <span className="n">{l.chapter.id}</span>
              <div><div className="nm">{l.chapter.name}　<span className="muted">{l.completed ? '✓ 視聴済' : l.watched ? `${Math.round(l.watched * 100)}%` : '未視聴'}・{fmtDur(l.seconds)}</span></div><div className="bar ok"><i style={{ width: `${l.watched * 100}%` }} /></div></div>
              <Link className="pc" to={`/lecture/${l.chapter.id}`}>▶</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="sec-h"><span className="en">ANIMATIONS</span><h2>アニメーション視聴状況</h2></div>
      <div className="grid cols-auto">
        {Object.values(course.animations).map((a) => {
          const v = s.animations[a.meta.id];
          return (
            <Link key={a.meta.id} className="card" style={{ padding: '14px 16px' }} to={`/animations/${a.meta.id}`}>
              <b>{a.meta.title}</b>
              <small className="muted" style={{ display: 'block' }}>{v ? `再生 ${v.plays}回・完了 ${v.completed}回・最大 ${Math.round(v.maxProgress * 100)}%` : '未視聴'}</small>
              <div className="bar thin ok" style={{ marginTop: 8 }}><i style={{ width: `${(v?.maxProgress || 0) * 100}%` }} /></div>
            </Link>
          );
        })}
      </div>

      <div className="sec-h"><span className="en">HISTORY</span><h2>回答履歴（最新20件）</h2></div>
      {s.answers.length ? (
        <div className="card" style={{ padding: '6px 18px' }}>
          {[...s.answers].reverse().slice(0, 20).map((a, i) => {
            const q = course.questions.find((x) => x.id === a.qid);
            return (
              <div key={i} className="hist-row">
                <span className={'pill ' + (a.correct ? 'ok' : 'eosin')}>{a.correct ? '○ 正解' : '× 不正解'}</span>
                <span className="hist-q">{q ? <Rich html={q.stem} /> : a.type === 'judgement' ? `正誤5択 ${a.qid.toUpperCase()}` : `アニメ確認問題 ${a.qid.split(':')[1] || ''}`}{a.review && <span className="pill" style={{ marginLeft: 6 }}>復習</span>}</span>
                <span className="muted">{new Date(a.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">まだ回答がありません。</div>
      )}

      <div className="sec-h"><span className="en">PAGES</span><h2>学習したページ</h2></div>
      <div className="card" style={{ padding: '6px 18px' }}>
        {s.recent.length ? s.recent.slice(0, 15).map((r, i) => (
          <div key={i} className="hist-row"><span className="pill">{{ chapter: '教科書', lecture: '授業', animation: 'アニメ', figure: '図解', quiz: '問題', zukan: '図鑑' }[r.kind]}</span><span className="hist-q">{r.label}</span><span className="muted">{new Date(r.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
        )) : <div className="empty">まだ履歴がありません。</div>}
      </div>
    </>
  );
}
