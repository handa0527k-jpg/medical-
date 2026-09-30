import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { timeLecture } from '../../engine/lecture/timing';
import type { TimedLecture } from '../../engine/lecture/types';
import { useProgress, useStudyPage } from '../../state/hooks';
import { byChapter } from '../../state/analytics';

export default function LecturesPage() {
  const course = useCourse();
  const s = useProgress();
  useStudyPage(null, 'lectures');
  const [tls, setTls] = useState<Record<number, TimedLecture>>({});
  useEffect(() => {
    let live = true;
    Promise.all(course.chapters.map((c) => course.loadLecture(c.id).then((l) => [c.id, timeLecture(l)] as const)))
      .then((xs) => live && setTls(Object.fromEntries(xs)));
    return () => { live = false; };
  }, [course]);
  const rates = byChapter(course, s);

  return (
    <>
      <section className="page-h">
        <div className="kick">LECTURE MODE</div>
        <h1>授業を受ける</h1>
        <p>{course.lecture.label}（スライド{course.lecture.slideRange[0]}–{course.lecture.slideRange[1]}）を、講師が説明するように1本ずつ再生します。ナレーション・字幕・スライドのハイライト・図解・アニメーションが同期して進み、重要な場面では自動で止まります。</p>
        <ol className="lroute">
          <li><b>授業を受ける</b><small>講義を選ぶ</small></li>
          <li><b>授業動画</b><small>10〜16分の講義</small></li>
          <li><b>5択確認問題</b><small>その講義の範囲から</small></li>
          <li><b>弱点を復習</b><small>該当スライドへ戻る</small></li>
        </ol>
      </section>
      <div className="grid cols-auto lgrid" style={{ marginTop: 18 }}>
        {course.chapters.map((c, i) => {
          const t = tls[c.id];
          const l = s.lectures[c.id];
          const r = rates[i];
          return (
            <Link key={c.id} className={'card lcard' + (l?.completed ? ' seen' : '')} to={`/lecture/${c.id}`}>
              <span className="no">第{c.id}講</span>
              <b>{c.name}</b>
              <small>スライド {c.slides[0]}–{c.slides[c.slides.length - 1]}{t ? `・約${Math.round(t.total / 60)}分・${t.chapters.length}パート` : ''}</small>
              <div className="lmini">{t?.chapters.map((x) => <i key={x.index} style={{ left: `${(x.t0 / t.total) * 100}%` }} />)}</div>
              <small style={{ color: l?.completed ? 'var(--ok)' : undefined }}>
                {l?.completed ? '✓ 視聴済み' : l ? `視聴 ${Math.round((l.maxPosition / Math.max(1, l.total)) * 100)}%` : '未視聴'}
                {r.pct !== null && `　確認問題 正答率 ${r.pct}%`}
              </small>
            </Link>
          );
        })}
      </div>
    </>
  );
}
