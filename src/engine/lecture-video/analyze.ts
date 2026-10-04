/**
 * 教材解析: read the genetics material that MEDSTUDY already has — lecture sections (themes), the
 * cues spoken in them, the slides / questions / mechanism animations / blackboard items they use —
 * and recommend the first theme to film. Nothing here invents content; it only indexes the material.
 */
import type { Lecture } from '../lecture/types';
import type { BoardOp } from '../board/types';

export interface ThemeInfo {
  key: string; // `${course}:${lecture}:${sectionIndex}`
  course: string;
  lecture: number;
  lectureTitle: string;
  section: number;
  name: string;
  cueIds: string[];
  /** spoken seconds in the original lecture (estimate from the narration) */
  seconds: number;
  slides: number[];
  quizzes: string[];
  anims: string[];
  board: string[];
  /** a theme with a concrete subject (not the introduction / overview / summary / exam block) */
  substantive: boolean;
}

const FRAME = /^(導入|全体像|まとめ|本番問題|振り返り|おわりに)/;

export function themesOf(course: string, lec: Lecture): ThemeInfo[] {
  return lec.sections.map((s) => {
    const shots = lec.shots.map((x, i) => ({ ...x, i })).filter((x) => x.section === s.index);
    const shotIds = new Set(shots.map((x) => x.i));
    const cues = lec.cues.filter((c) => shotIds.has(c.shot));
    const cueIdx = new Set(cues.map((c) => lec.cues.indexOf(c)));
    const vis = shots.map((x) => x.visual);
    const uniq = <T,>(a: T[]) => [...new Set(a)];
    const board = (lec.board?.ops ?? []).filter((o: BoardOp) => o.k === 'draw' && o.id && cueIdx.has(o.cue)).map((o) => o.id!) ;
    return {
      key: `${course}:${lec.chapter}:${s.index}`,
      course, lecture: lec.chapter, lectureTitle: lec.title, section: s.index, name: s.name,
      cueIds: cues.map((c) => c.id),
      seconds: Math.round(cues.reduce((a, c) => a + c.dur + c.gap, 0)),
      slides: uniq(vis.flatMap((v) => (v.kind === 'slide' ? [v.slide] : []))),
      quizzes: uniq(vis.flatMap((v) => (v.kind === 'quiz' ? [v.qid] : []))),
      anims: uniq(vis.flatMap((v) => (v.kind === 'anim' ? [v.anim] : []))),
      board,
      substantive: !FRAME.test(s.name) && cues.length > 0,
    };
  });
}

/**
 * The theme to film first: walk the material in its own order (course order, lecture order, section
 * order) and take the first substantive theme that is backed by a slide AND a question — i.e. the first
 * concrete phenomenon the course teaches, with material to check it against.
 */
export function recommendTheme(themes: ThemeInfo[]): { theme: ThemeInfo; why: string } | null {
  const t = themes.find((x) => x.substantive && x.slides.length > 0 && x.quizzes.length > 0) ?? themes.find((x) => x.substantive) ?? null;
  if (!t) return null;
  const skipped = themes.slice(0, themes.indexOf(t)).map((x) => `「${x.name}」`).join('・');
  return {
    theme: t,
    why: `教材の順に見て、${skipped ? skipped + 'は導入・全体像のため除き、' : ''}最初に「スライド（${t.slides.join('・')}）」と「確認問題（${t.quizzes.join('・')}）」の両方を伴う具体的なテーマ。`,
  };
}
