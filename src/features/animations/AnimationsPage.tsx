import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { timeScript } from '../../engine/animation/stage';
import { fmtT } from '../../engine/svg';
import { useProgress, useStudyPage } from '../../state/hooks';

export default function AnimationsPage() {
  const course = useCourse();
  const s = useProgress();
  useStudyPage(null, 'animations');
  return (
    <>
      <section className="page-h">
        <div className="kick">ANIMATIONS</div>
        <h1>アニメーション</h1>
        <p>授業資料に登場する機序を、ズーム・カメラ移動・物質の移動で見るアニメーション。ステップごとに止めて進め、重要ポイントへジャンプできます。</p>
      </section>
      <div className="grid cols-auto gal" style={{ marginTop: 16 }}>
        {Object.values(course.animations).map((a) => {
          const t = timeScript(a.script);
          const v = s.animations[a.meta.id];
          return (
            <Link key={a.meta.id} className="card" to={`/animations/${a.meta.id}`}>
              <div className="kick">{a.meta.en}</div>
              <b>{a.meta.title}</b>
              <small>第{a.meta.chapter}章・約{fmtT(t.total)}・全{t.groups.length}章構成／スライド{a.meta.sources.join('・')}</small>
              <small>{v ? `✓ 再生 ${v.plays}回・最大 ${Math.round(v.maxProgress * 100)}%` : '未視聴'}</small>
            </Link>
          );
        })}
      </div>
    </>
  );
}
