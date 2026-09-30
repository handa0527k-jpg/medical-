import type { Course, SingleQuestion } from '../../content/types';
import type { ProgressState } from '../../state/types';
import { reviewSet } from '../../state/analytics';
import { shuffle } from './FiveChoice';

export interface QuizSpec {
  label: string;
  questions: SingleQuestion[];
  review: boolean;
}

/**
 * Resolve URL parameters into a question set.
 *   ?chapter=3           chapter (all its questions, shuffled)
 *   ?filter=wrong|new    only wrong / unanswered
 *   ?slide=12            questions citing slide 12
 *   ?ids=q001,q002       explicit list (e.g. 'retry mistakes')
 *   ?mode=random         20 random questions
 *   ?mode=review         weakness review (wrong → related → weak chapters)
 */
export function selectQuestions(c: Course, s: ProgressState, p: URLSearchParams): QuizSpec {
  const mode = p.get('mode');
  const chapter = Number(p.get('chapter')) || null;
  const slide = Number(p.get('slide')) || null;
  const filter = p.get('filter');
  const ids = p.get('ids');

  if (mode === 'review') {
    const r = reviewSet(c, s, 12, shuffle);
    return { label: `弱点復習（第${r.chapters.join('・')}章 ほか）`, questions: r.questions, review: true };
  }
  let qs = c.questions;
  let label = '全問';
  if (ids) {
    const want = ids.split(',');
    qs = want.map((id) => c.questions.find((q) => q.id === id)).filter((q): q is SingleQuestion => !!q);
    label = p.get('label') || '選んだ問題';
    return { label, questions: qs, review: p.get('review') === '1' };
  }
  if (chapter) { qs = qs.filter((q) => q.chapter === chapter); label = `第${chapter}章 ${c.chapters.find((x) => x.id === chapter)?.name ?? ''}`; }
  if (slide) { qs = qs.filter((q) => q.slide === slide); label = `スライド${slide}「${c.slides[slide]?.title ?? ''}」`; }
  if (filter === 'wrong') { qs = qs.filter((q) => s.questions[q.id] && !s.questions[q.id].lastCorrect); label += '　間違えた問題'; }
  if (filter === 'new') { qs = qs.filter((q) => !s.questions[q.id]); label += '　未回答'; }
  qs = shuffle(qs);
  if (mode === 'random') { qs = qs.slice(0, 20); label = '全問ランダム20問'; }
  return { label, questions: qs, review: filter === 'wrong' };
}
