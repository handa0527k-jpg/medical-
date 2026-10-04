/**
 * Planner: theme → scenes. A hand-directed theme (checked against the material) is used when one
 * exists; otherwise an automatic draft is cut from the lecture's own cues, blackboard and slides.
 */
import type { Lecture, LectureCue } from '../lecture/types';
import type { BoardOp } from '../board/types';
import type { SingleQuestion, Slide } from '../../content/types';
import type { ThemeInfo } from './analyze';
import type { Beat, Duration, Intensity, LessonStyle, Plan, SceneDef, Segment } from './types';
import { AVERY_KEY, AVERY_RATIONALE, averyScenes } from './directions/avery';
import { estimateSpeech } from './timing';

export interface Material {
  course: string;
  courseTitle: string;
  lecture: Lecture;
  theme: ThemeInfo;
  slides: Record<number, Slide>;
  questions: SingleQuestion[];
}
export interface PlanOptions { duration: Duration; style: LessonStyle; intensity: Intensity }

export const KOKORO_VOICE = 'jm_kumo';
export const KOKORO_SPEED = 1.06;

export const planKey = (theme: string, o: PlanOptions) => `${theme}|${o.duration}|${o.style}|${o.intensity}`;
/** the voice depends only on what is said, not on how hard the picture hits */
export const voiceKey = (theme: string, o: Pick<PlanOptions, 'duration' | 'style'>) => `${theme.replace(/:/g, '-')}_${o.duration}s_${o.style}`;

export const isCurated = (themeKey: string) => themeKey === AVERY_KEY;

const boardOps = (lec: Lecture, ids: string[]) => ids.map((id) => lec.board?.ops.find((o) => o.id === id)).filter(Boolean) as BoardOp[];

export function buildPlan(m: Material, o: PlanOptions): Plan {
  const curated = isCurated(m.theme.key);
  const scenes = curated ? averyScenes(o.duration, o.style) : draftScenes(m, o);
  if (curated) {
    for (const s of scenes) {
      if (s.visual === 'board-question') s.data = { ...s.data, board: boardOps(m.lecture, ['c-dna', 'a1', 'c-q']) };
      if (s.visual === 'board-summary') s.data = { ...s.data, board: boardOps(m.lecture, ['av-h', 'av1', 'av-dna', 'av-no', 'av-c']) };
      if (s.visual === 'quiz') s.data = { ...s.data, question: m.questions.find((q) => q.id === (s.data?.qid as string)) };
      if (s.visual === 'strains' || s.visual === 'tubes' || s.visual === 'plates') s.data = { ...s.data, slide: m.slides[14] ? { title: m.slides[14].title, keyPoint: m.slides[14].keyPoint } : undefined };
    }
  }
  return {
    key: planKey(m.theme.key, o),
    course: m.course,
    lecture: m.lecture.chapter,
    section: m.theme.name,
    theme: `${m.courseTitle.split('｜').pop()} 第${m.lecture.chapter}講「${m.lecture.title}」— ${m.theme.name.replace(/^テーマ\d+\s*/, '')}`,
    duration: o.duration,
    style: o.style,
    intensity: o.intensity,
    curated,
    rationale: curated ? AVERY_RATIONALE : ['自動下書き：このテーマの講義の台詞・板書・スライドから機械的に切り出した構成です。演出と医学図は監修前の汎用形です。'],
    scenes,
    voice: { kokoro: KOKORO_VOICE, speed: KOKORO_SPEED },
  };
}

/* ---------- automatic draft (any theme) ---------- */
const strip = (h: string) => h.replace(/<[^>]+>/g, '');
const boldTerms = (h: string) => [...h.matchAll(/<b>(.*?)<\/b>/g)].map((x) => strip(x[1]));
/** split a cue into sentence segments; the first bold term of each sentence becomes the emphasis cue */
function segsOf(c: LectureCue, sc: string): Segment[] {
  const texts = strip(c.text).split(/(?<=[。！？])/).filter((x) => x.trim());
  const says = c.speech.split(/(?<=[。！？])/).filter((x) => x.trim());
  if (texts.length !== says.length) return [{ text: emph(strip(c.text), boldTerms(c.text)), say: c.speech, cue: `${sc}-${c.id}`, post: Math.min(0.5, c.gap) }];
  return texts.map((t, i) => ({ text: emph(t, boldTerms(c.text)), say: says[i], cue: `${sc}-${c.id}-${i}`, post: i === texts.length - 1 ? Math.min(0.5, c.gap) : 0.12 }));
}
const emph = (t: string, terms: string[]) => terms.reduce((s, x) => (x && s.includes(x) && !s.includes(`**${x}**`) ? s.replace(x, `**${x}**`) : s), t);

function draftScenes(m: Material, o: PlanOptions): SceneDef[] {
  const lec = m.lecture;
  const cues = m.theme.cueIds.map((id) => lec.cues.find((c) => c.id === id)!).filter((c) => c && c.speech && !/考える時間/.test(c.text));
  const budget = o.duration - 1;
  const scenes: SceneDef[] = [];
  let used = 0, cur: { cues: LectureCue[]; len: number } | null = null;
  const flush = () => { if (cur?.cues.length) scenes.push(draftScene(m, cur.cues, scenes.length)); cur = null; };
  for (const c of cues) {
    const segs = segsOf(c, 'x');
    const len = segs.reduce((a, s) => a + estimateSpeech(s) + (s.post ?? 0), 0);
    if (used + len > budget) break;
    const shotChanged = cur && cur.cues.length && lec.shots[cur.cues[cur.cues.length - 1].shot] !== lec.shots[c.shot];
    if (!cur || cur.len + len > 8 || shotChanged) { flush(); cur = { cues: [], len: 0 }; }
    cur!.cues.push(c); cur!.len += len; used += len;
  }
  flush();
  return scenes;
}

function draftScene(m: Material, cues: LectureCue[], n: number): SceneDef {
  const lec = m.lecture, id = `S${String(n + 1).padStart(2, '0')}`;
  const shot = lec.shots[cues[0].shot];
  const v = shot.visual;
  const idx = new Set(cues.map((c) => lec.cues.indexOf(c)));
  const ops = (lec.board?.ops ?? []).filter((op) => op.k === 'draw' && idx.has(op.cue));
  const slide = v.kind === 'slide' ? m.slides[v.slide] : undefined;
  const lines = ops.length
    ? ops.flatMap((op) => (op.prims ?? []).flatMap((p) => (p.p === 'text' ? [p.segs.map((s) => (s.a ? '→' : s.t)).join('')] : []))).slice(0, 5)
    : slide ? [slide.title, strip(slide.keyPoint)] : [strip(cues[0].text)];
  const beats: Beat[] = cues.map((c) => ({ id: c.id, src: { course: m.course, lecture: lec.chapter, section: m.theme.name, cues: [c.id], slide: slide?.n, mode: 'verbatim' }, segs: segsOf(c, id) }));
  const firstCue = beats[0].segs[0].cue!;
  const keyCue = beats.flatMap((b) => b.segs).find((s) => s.text.includes('**'))?.cue ?? firstCue;
  const molecular = /DNA|RNA|塩基|染色体|遺伝子|ヌクレオ|ヒストン|ポリメラーゼ|タンパク質/.test(cues.map((c) => c.text).join(''));
  return {
    id, title: strip(cues[0].text).slice(0, 24),
    visual: 'board-generic',
    picture: `黒板（講義の板書／スライドの要点）を劇画調で。強調語「${keyCue === firstCue ? '—' : '太字の用語'}」で急接近。※自動下書き：演出・医学図は要監修`,
    diagram: { id: `${id.toLowerCase()}-board`, title: '板書の再現', note: ops.length ? `板書 ${ops.map((x) => x.id).filter(Boolean).join('・')}` : slide ? `スライド${slide.n}の要点` : '講義の台詞' },
    beats,
    cams: [
      { at: 'start', move: 'set', x: 640, y: 360, z: 0.95, note: '板書の全景' },
      { at: 'start', move: 'push', x: 640, y: 360, z: 1.1, dur: 2.5, note: 'ゆっくり前進' },
      { at: keyCue, move: 'crash', x: 640, y: 300, z: 1.6, dur: 0.25, hold: 0.2, note: '強調語で急接近' },
    ],
    fx: [{ at: keyCue, kind: 'focus', dur: 1.0, min: 'gekiga' }, { at: keyCue, kind: 'impact', dur: 0.35, min: 'gekiga' }, { at: 'start', kind: 'tone', dur: 99, min: 'gekiga' }],
    sfx: [{ at: 'start', kind: 'chalk', gain: 0.5 }, { at: keyCue, kind: 'impact', gain: 0.7 }],
    shots: [{ id: 'a', from: 'start', mode: 'background', desc: molecular ? '暗い空間に、ピントの外れた分子の鎖の影がゆっくり流れる。' : '夜の講義室、黒板の前を舞うチョークの粉。',
      subject: molecular ? 'abstract dark space, out-of-focus silhouettes of long molecular strands drifting slowly, cold rim light, particles' : 'a dark empty lecture hall at night, a slate blackboard, a shaft of light through floating chalk dust',
      accuracy: 'background only, defocused, no readable structures, no text' }],
    data: { lines, slide: slide ? { title: slide.title, keyPoint: slide.keyPoint } : undefined },
  };
}
