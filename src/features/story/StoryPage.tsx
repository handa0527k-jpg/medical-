import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { NotFound } from '../../app/NotFound';
import { buildTimeline } from '../../engine/story/timeline';
import type { StoryModule } from '../../engine/story/types';
import { fmtT } from '../../engine/svg';
import { useStudyPage } from '../../state/hooks';
import StoryPlayer from './StoryPlayer';

/** cells of the learning-points table may carry <b> emphasis only */
const Cell = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html.replace(/<(?!\/?b>)[^>]*>/g, '') }} />;

export default function StoryPage() {
  const course = useCourse();
  const [story, setStory] = useState<StoryModule | null>(null);
  const [err, setErr] = useState(false);
  // ?t=SECONDS opens the film at that position (to check one frame, or share a moment)
  const [sp] = useSearchParams();
  const startAt = sp.get('t') != null && !Number.isNaN(Number(sp.get('t'))) ? Number(sp.get('t')) : undefined;
  // ?op=SECONDS / ?ed=SECONDS opens the opening / ending at that point of the song
  const mvq = (['op', 'ed'] as const).find((k) => sp.get(k) != null && !Number.isNaN(Number(sp.get(k))));
  const startMv = useMemo(() => (mvq ? { phase: mvq, t: Number(sp.get(mvq)) } : undefined), [mvq, sp]);
  useEffect(() => {
    let live = true;
    course.story?.().then((m) => live && setStory(m)).catch(() => live && setErr(true));
    return () => { live = false; };
  }, [course]);
  useStudyPage(course.story ? { kind: 'animation', id: 'story', label: 'ストーリーアニメ' } : null, 'story');
  const tl = useMemo(() => (story ? buildTimeline(story.def.lines) : null), [story]);
  if (!course.story) return <NotFound />;
  if (err) return <p className="empty">アニメを読み込めませんでした。通信状態を確かめて、もう一度開いてください。</p>;
  if (!story || !tl) return <p className="empty">読み込み中…</p>;
  const { def } = story;
  return (
    <div className="story-page">
      <div className="btnrow" style={{ marginTop: 0, marginBottom: 14 }}>
        <Link className="btn sm" to="/animations" style={{ flex: '0 0 auto' }}>← アニメ一覧</Link>
        <Link className="btn sm" to="/book" style={{ flex: '0 0 auto' }}>教科書</Link>
        <Link className="btn sm" to="/quiz" style={{ flex: '0 0 auto' }}>問題</Link>
      </div>
      <section className="page-h">
        <div className="kick">STORY ANIME ・ 約{Math.round(tl.total / 60)}分</div>
        <h1>{def.title}</h1>
        <p>{def.kicker}</p>
        <p>{def.lead}</p>
      </section>
      <StoryPlayer story={story} assetBase={course.assetBase} startAt={startAt} startMv={startMv} />

      <h2 className="story-h">キャラクター紹介</h2>
      <div className="story-cast">
        {def.cast.map((c) => (
          <div className="card story-who" key={c.name}>
            <b><i style={{ background: c.color }} />{c.name}</b>
            <small><Cell html={c.map} /></small>
            <p>{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="story-h">ストーリーと、各シーンで説明していること</h2>
      <div className="story-table"><table>
        <thead><tr><th>#</th><th>シーン</th><th>あらすじ</th><th>説明している構造・しくみ</th></tr></thead>
        <tbody>
          {def.scenes.map((s, i) => (
            <tr key={s.id}><td className="n">{i + 1}</td><td><b>{s.title}</b><br /><small>{fmtT(tl.start[s.id])}〜</small></td><td>{s.plot}</td><td>{s.struct}</td></tr>
          ))}
        </tbody>
      </table></div>

      <h2 className="story-h">学習ポイントまとめ</h2>
      <div className="story-table"><table>
        <thead><tr>{def.points.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{def.points.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><Cell html={c} /></td>)}</tr>)}</tbody>
      </table></div>
      <p className="story-note">{def.note}</p>
      <p className="story-note">オープニング・エンディング　音楽：魔王魂（「シャイニングスター」「The milky way」）</p>
    </div>
  );
}
