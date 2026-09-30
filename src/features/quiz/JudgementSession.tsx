import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import type { JudgementQuestion } from '../../content/types';
import { Rich } from '../../components/Rich';
import { maskStyle, slideSrc } from '../../components/Slide';
import { useProgress, useStore, useStudyPage } from '../../state/hooks';
import { LETTERS, shuffle } from './FiveChoice';

type Filter = 'all' | 'todo' | 'ng' | 'ok';

/** 正誤5択: five statements A–E, choose ALL that are true (or all that are false). */
function JudgementCard({ q }: { q: JudgementQuestion }) {
  const course = useCourse();
  const store = useStore();
  const [order, setOrder] = useState(() => shuffle([0, 1, 2, 3, 4]));
  const [sel, setSel] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [shot, setShot] = useState(false);
  const stat = useProgress().questions[q.id];
  // "answer" = statements that should be selected
  const ans = q.statements.map((s) => (q.ask === 'true' ? s.isTrue : !s.isTrue));
  const ok = done && ans.every((a, k) => a === sel.includes(k));
  const correctLetters = order.map((k, i) => (ans[k] ? LETTERS[i] : '')).filter(Boolean);
  const boxes = q.boxes.length ? q.boxes : q.figureBoxes;
  const s = course.slides[q.slide];

  return (
    <div className={'card qcard jc' + (done ? ' done' : '')} style={{ borderLeft: stat ? `5px solid ${stat.lastCorrect ? 'var(--ok)' : 'var(--eosin)'}` : undefined }}>
      <div className="qmeta"><span className="en">{q.id.toUpperCase()}</span><span className="typ">スライド{q.slide}</span><span className="typ">正誤判定</span></div>
      <p className="qstem">{q.topic}について、<em>{q.ask === 'true' ? '正しいもの' : '誤っているもの'}</em>をすべて選べ。</p>
      <div className="opts" role="group" aria-label="選択肢（複数選択）">
        {order.map((k, i) => {
          const st = q.statements[k];
          let c = 'op';
          const picked = sel.includes(k);
          if (picked) c += ' sel';
          if (done) { if (ans[k] && picked) c += ' cor'; else if (ans[k]) c += ' miss'; else if (picked) c += ' wr'; }
          return (
            <button key={k} className={c} disabled={done} aria-pressed={picked} onClick={() => setSel((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))}>
              <span className="L">{LETTERS[i]}</span>
              <span>
                <Rich className="tx" html={st.text} />
                {done && (
                  <span className="ex">{st.isTrue ? <span className="t">○ 正しい</span> : <><span className="f">× 誤り</span> <span className="muted">→ <Rich html={st.note} /></span></>}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {!done ? (
        <div className="qnav"><button className="btn pri" disabled={!sel.length} onClick={() => { setDone(true); const r = ans.every((a, k) => a === sel.includes(k)); store.answer(q.id, 'judgement', r, sel); }}>解答する</button></div>
      ) : (
        <div className="qres">
          <div className={'verdict ' + (ok ? 'ok' : 'ng')}>{ok ? 'CORRECT' : 'INCORRECT'}<small>正解：{correctLetters.join('・')}（{correctLetters.length}つ）</small></div>
          <div className="qnav">
            <button className="btn" onClick={() => { setDone(false); setSel([]); setOrder(shuffle([0, 1, 2, 3, 4])); setShot(false); }}>もう一度解く</button>
            <button className="btn" onClick={() => setShot((v) => !v)} aria-expanded={shot}>スライドで確認</button>
            <Link className="btn" to={`/chapter/${q.chapter}?slide=${q.slide}`}>教科書で読む</Link>
          </div>
          {shot && (
            <figure className="src-drawer">
              <div className="hlwrap">
                <img src={slideSrc(course.assetBase, s.image)} alt={`スライド${q.slide}`} />
                {boxes.map((b, i) => <div key={i} className="hl" style={maskStyle(b, 0.8)} />)}
              </div>
              <figcaption>出典：PDF スライド{q.slide}　{s.title}</figcaption>
            </figure>
          )}
        </div>
      )}
    </div>
  );
}

export function JudgementSession() {
  const course = useCourse();
  const s = useProgress();
  const [params, setParams] = useSearchParams();
  const chapter = Number(params.get('chapter')) || 0;
  const [filter, setFilter] = useState<Filter>('all');
  useStudyPage({ kind: 'quiz', id: `judge:${chapter}`, label: '正誤5択' }, 'quiz:judge');
  const list = useMemo(() => course.judgements.filter((q) => {
    const v = s.questions[q.id];
    return (!chapter || q.chapter === chapter) && (filter === 'all' || (filter === 'todo' && !v) || (filter === 'ng' && v && !v.lastCorrect) || (filter === 'ok' && v?.lastCorrect));
    // filter snapshot: recompute only when the filter/chapter changes, not after every answer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [course, chapter, filter]);
  const nOk = course.judgements.filter((q) => s.questions[q.id]?.lastCorrect).length;
  let lastCh = 0;

  return (
    <div className="qwrap">
      <section className="page-h">
        <div className="kick">TRUE / FALSE × 5</div>
        <h1>正誤5択</h1>
        <p>A〜Eの5つの記述から、正しいもの（または誤っているもの）をすべて選ぶ形式。正解は一つとは限りません。</p>
      </section>
      <div className="qhead" style={{ marginTop: 14 }}>
        <div className="bar"><i style={{ width: `${(nOk / course.judgements.length) * 100}%` }} /></div>
        <span className="muted" style={{ fontSize: 14 }}><b className="num" style={{ fontSize: 22, color: 'var(--hema)' }}>{nOk}</b> / {course.judgements.length} 問 正解</span>
      </div>
      <div className="filters" role="group" aria-label="絞り込み">
        {([['all', 'すべて'], ['todo', '未回答'], ['ng', '間違えた'], ['ok', '正解した']] as [Filter, string][]).map(([k, l]) => (
          <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)} aria-pressed={filter === k}>{l}</button>
        ))}
      </div>
      <div className="filters" role="group" aria-label="章">
        <button className={'chip' + (!chapter ? ' on' : '')} onClick={() => setParams({})}>全章</button>
        {course.chapters.map((c) => <button key={c.id} className={'chip' + (chapter === c.id ? ' on' : '')} onClick={() => setParams({ chapter: String(c.id) })}>{c.id}</button>)}
      </div>
      {list.length === 0 && <div className="empty">この条件の問題はありません。「すべて」に戻しましょう。</div>}
      <div className="grid" style={{ gap: 14 }}>
        {list.map((q) => {
          const head = q.chapter !== lastCh ? (lastCh = q.chapter) : 0;
          return (
            <div key={q.id}>
              {head > 0 && <div className="sec-h" style={{ margin: '22px 0 10px' }}><span className="en">CHAPTER {head}</span><h2>{course.chapters[head - 1].name}</h2></div>}
              <JudgementCard q={q} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
