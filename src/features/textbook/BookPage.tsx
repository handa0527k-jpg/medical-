import { useCourse } from '../../app/course';
import { metaphorWord } from '../../content/registry';
import { ChapterList } from './ChapterList';

export function BookPage() {
  const course = useCourse();
  return (
    <>
      <section className="page-h">
        <div className="kick">TEXTBOOK</div>
        <h1>教科書</h1>
        <p>{course.lecture.label}（スライド{course.lecture.slideRange[0]}–{course.lecture.slideRange[1]}）を一次資料にした全{course.chapters.length}章。番号の順に読むと、{metaphorWord(course)}を入口から一周できます。</p>
      </section>
      <div style={{ height: 18 }} />
      <ChapterList />
    </>
  );
}
