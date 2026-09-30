import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { Rich } from '../../components/Rich';
import { useStudyPage } from '../../state/hooks';

/** 役割図鑑 — every structure as a card with its factory analogy. */
export function ZukanPage() {
  const course = useCourse();
  const [ch, setCh] = useState(0);
  useStudyPage({ kind: 'zukan', id: 'all', label: '役割図鑑' }, 'zukan');
  const list = course.zukan.filter((z) => !ch || z.chapter === ch);
  return (
    <>
      <section className="page-h">
        <div className="kick">ENCYCLOPEDIA</div>
        <h1>役割図鑑</h1>
        <p>工場の部屋と装置を、たとえつきで一枚ずつ。膜の枚数も確認しよう。</p>
      </section>
      <div className="filters" role="group" aria-label="章で絞り込み" style={{ marginTop: 14 }}>
        <button className={'chip' + (!ch ? ' on' : '')} onClick={() => setCh(0)}>すべて</button>
        {course.chapters.map((c) => <button key={c.id} className={'chip' + (ch === c.id ? ' on' : '')} onClick={() => setCh(c.id)}>{c.id} {c.name}</button>)}
      </div>
      <div className="zkg">
        {list.map((z) => (
          <article key={z.id} className="card zc">
            <div className="top">
              <div className="ic" aria-hidden="true">{z.icon}</div>
              <div><h3>{z.name}</h3><span className="as">{z.metaphor}</span></div>
              <div className="mb">膜：{z.membranes}</div>
            </div>
            <Rich as="div" className="an" html={z.analogy} />
            <h4>役割</h4>
            <ul>{z.roles.map((x, i) => <Rich as="li" key={i} html={x} />)}</ul>
            <h4>覚える特徴</h4>
            <ul className="facts">{z.facts.map((x, i) => <Rich as="li" key={i} html={x} />)}</ul>
            <div className="go"><Link to={`/chapter/${z.chapter}`}>教科書 第{z.chapter}章で読む →</Link></div>
          </article>
        ))}
      </div>
    </>
  );
}
