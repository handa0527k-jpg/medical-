import type { TextBlock } from '../../content/types';
import { Rich } from '../../components/Rich';
import { SlideFigure, SourceChips } from '../../components/Slide';

export function Block({ b, flashSlide }: { b: TextBlock; flashSlide?: number | null }) {
  switch (b.type) {
    case 'lead':
      return <Rich as="p" className="lead" html={b.html} />;
    case 'heading':
      return (
        <>
          <Rich as="h3" html={b.html} />
          <SourceChips slides={b.slides} />
        </>
      );
    case 'paragraph':
      return <Rich as="p" html={b.html} />;
    case 'analogy':
      return <div className="bx ana"><span>たとえるなら</span><Rich as="div" html={b.html} /></div>;
    case 'supplement':
      // knowledge outside the lecture handout is always labelled as such
      return <div className="bx sup"><span>補足（授業資料外の知識）</span><Rich as="div" html={b.html} /></div>;
    case 'misconception':
      return <div className="bx ng"><span>よくある勘違い</span><Rich as="div" html={b.html} /></div>;
    case 'column':
      return <div className="bx col"><Rich as="span" html={b.title} /><Rich as="div" html={b.html} /></div>;
    case 'slide':
      return <SlideFigure n={b.slide} flash={flashSlide === b.slide} />;
    case 'steps':
      return <ol className="steps">{b.items.map((x, i) => <Rich as="li" key={i} html={x} />)}</ol>;
    case 'table':
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="btbl">
            <thead><tr>{b.rows[0].map((x, i) => <th key={i}><Rich html={x} /></th>)}</tr></thead>
            <tbody>{b.rows.slice(1).map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j}><Rich html={x} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
  }
}
