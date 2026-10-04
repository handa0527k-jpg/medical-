import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { COURSES } from '../../content/registry';
import { timeScript } from '../../engine/animation/stage';
import { fmtT } from '../../engine/svg';
import { useProgress, useStudyPage } from '../../state/hooks';
import { STORY_KEY } from '../story/StoryPlayer';

export default function AnimationsPage() {
  const course = useCourse();
  const s = useProgress();
  useStudyPage(null, 'animations');
  const sv = s.animations[STORY_KEY];
  return (
    <>
      <section className="page-h">
        <div className="kick">ANIMATIONS</div>
        <h1>アニメーション</h1>
        <p>物語で全体をつかむストーリーアニメと、機序をステップごとに止めて確かめる機序アニメ。まずはストーリーから。</p>
      </section>
      {course.story && (
        <Link className="card story-hero" to="/animations/story">
          <div className="story-hero-art" aria-hidden="true"><span>▶</span></div>
          <div>
            <div className="kick">STORY ANIME ・ 音声つき短編</div>
            <b>{course.storyTitle || 'ストーリーアニメ'}</b>
            <small>{course.storyLead || 'キャラクターたちの会話で、この教材の要点を物語として見る短編アニメ。'}</small>
            <small>{sv ? `✓ 再生 ${sv.plays}回・最大 ${Math.round(sv.maxProgress * 100)}%` : '未視聴'}</small>
          </div>
        </Link>
      )}
      {(course.related ?? []).map((id) => COURSES.find((c) => c.id === id)).filter((c) => c?.storyTitle).map((c) => (
        <Link key={c!.id} className="card story-rel" to={`/open/${c!.id}/animations/story`}>
          <div className="kick">関連するストーリー ・ {c!.title}</div>
          <b>{c!.storyTitle}</b>
          <small>{c!.storyLead}</small>
        </Link>
      ))}
      <h2 className="anim-sec">機序アニメ <small>授業の中でも使われる、ステップ再生のアニメーション</small></h2>
      <div className="grid cols-auto gal" style={{ marginTop: 12 }}>
        {Object.values(course.animations).map((a) => {
          const t = timeScript(a.script);
          const v = s.animations[a.meta.id];
          return (
            <Link key={a.meta.id} className="card" to={`/animations/${a.meta.id}`}>
              <div className="kick">{a.meta.en}</div>
              <b>{a.meta.title}</b>
              <small>第{a.meta.chapter}章・約{fmtT(t.total)}・全{t.groups.length}章構成／スライド{a.meta.sources.join('・')}</small>
              <small className="anim-desc">{a.meta.description.replace(/<[^>]+>/g, '')}</small>
              <small>{v ? `✓ 再生 ${v.plays}回・最大 ${Math.round(v.maxProgress * 100)}%` : '未視聴'}</small>
            </Link>
          );
        })}
      </div>
    </>
  );
}
