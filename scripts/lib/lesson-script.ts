/**
 * Lecture script (予備校スタイルの授業台本) → Lecture JSON.
 *
 * A script is a plain-text screenplay: lecturer lines (`>`) interleaved with
 * stage directions (`@…`, `+…`) that change what is on screen. Every line of
 * speech is one cue; directions apply to the next cue, so voice and picture
 * stay in lock-step. Full reference: docs/LECTURE_SCRIPT.md
 *
 *   ## 導入                       section (chapter mark on the timeline)
 *   @title                        title screen
 *   @goals / @summary 見出し       list; items follow as "- …" lines
 *   @roadmap 見出し  / @roadmap 2  learning map (define once, then reuse with the current topic)
 *   @cellmap 3                    cell map with chapter 3's zone highlighted
 *   @board 見出し                  new chalkboard
 *     + A → B                     write a row (arrows are drawn)   +! …  row with a box
 *     + ↓ C                       downward step                    + A | B   comparison row
 *     !2  _2                      box / underline row 2 (1-based) on the next cue
 *   @slide 5   >[m2] …            slide; camera zooms to mask 2
 *   @figure cell   >[gol] …       interactive figure; highlight a structure
 *   @anim endo   >[s3] …  >[s3!]  animation step 3 plays across the cues (! = hold last frame)
 *   @compare 見出し + "| … |" rows, >[2] highlights body row 2
 *   @point ラベル :: 本文  @pitfall :: …  @memo :: …  @example :: …
 *   @quiz q007 [check|typical|final]   question (A–E in data order)
 *   @think 15                     silent thinking time with countdown
 *   @explain   >[q] … >[C] …      walkthrough; focus stem (q) or an option letter
 *   @end
 *
 * Inline: **強調** → bold, {内腔|ないくう} → shown as 内腔, spoken as ないくう,
 * "……" splits a line with a deliberate pause, a trailing "(間)" adds a long pause.
 */
import type { ChalkMark, ChalkRow, Lecture, LectureCue, LectureShot, LectureVisual } from '../../src/engine/lecture/types';
import type { CourseMeta, Figure, SingleQuestion, Slide } from '../../src/content/types';
import type { AnimScript } from '../../src/engine/animation/types';
import { estimateDuration, toSpeech } from '../../src/engine/speech/reading';

export const SCRIPT_VERSION = 3;

export interface ScriptContext {
  course: CourseMeta;
  chapter: number;
  slides: Record<string, Slide>;
  questions: SingleQuestion[];
  figures: Record<string, Figure>;
  animScripts: Record<string, AnimScript>;
}

const GAP = { sentence: 0.38, comma: 0.16, question: 0.85, dramatic: 0.75, scene: 0.7, long: 1.1 };

const md = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const shown = (s: string) => md(s.replace(/\{([^|{}]+)\|([^{}]+)\}/g, '$1'));
const spoken = (s: string) => s.replace(/\{([^|{}]+)\|([^{}]+)\}/g, '$2').replace(/\*\*/g, '');

export function parseScript(src: string, ctx: ScriptContext): Lecture {
  const { course, chapter } = ctx;
  const ch = course.chapters.find((c) => c.id === chapter);
  if (!ch) throw new Error(`chapter ${chapter} not in course`);
  const sections: string[] = [];
  const shots: LectureShot[] = [];
  const cues: LectureCue[] = [];
  const quizzes: NonNullable<Lecture['quizzes']> = [];
  let title = ch.name;
  let section = -1;
  let listTarget: string[] | null = null;
  let tableTarget: string[][] | null = null;
  let roadmapItems: string[] = [];
  let roadmapTitle = '今日の学習マップ';
  let pendingRows: Omit<ChalkRow, 'at'>[] = [];
  let pendingMarks: Omit<ChalkMark, 'at'>[] = [];
  let curQuiz: { qid: string; variant: 'check' | 'typical' | 'final' } | null = null;
  let lineNo = 0;

  const fail = (msg: string): never => { throw new Error(`lecture ${chapter} line ${lineNo}: ${msg}`); };
  const cur = () => shots[shots.length - 1];
  const cueCountIn = (si: number) => cues.filter((c) => c.shot === si).length;
  const open = (visual: LectureVisual) => {
    if (section < 0) fail('a section (## …) must come before the first visual');
    shots.push({ section, visual });
    listTarget = null;
    tableTarget = null;
  };
  const slideOk = (n: number) => { if (!ctx.slides[String(n)]) fail(`unknown slide ${n}`); };
  const qOk = (id: string) => ctx.questions.find((q) => q.id === id) || fail(`unknown question ${id}`);

  const pushCue = (rawText: string, focus: string | undefined) => {
    if (!shots.length) fail('speech before any visual');
    let text = rawText.trim();
    let tail = 0;
    if (/\(間\)$/.test(text)) { text = text.replace(/\s*\(間\)$/, ''); tail = GAP.long; }
    const raw = text.split('……');
    const parts = raw.map((p, i) => ({ p, ell: i < raw.length - 1 })).filter((x) => x.p.trim());
    parts.forEach(({ p: part, ell }, pi) => {
      const isLastPart = pi === parts.length - 1;
      const t = ell ? part + '……' : part;
      const si = shots.length - 1;
      const at = cueCountIn(si);
      const v = cur().visual;
      if (v.kind === 'chalk' && pi === 0) {
        pendingRows.forEach((r) => v.rows.push({ ...r, at }));
        pendingMarks.forEach((m) => v.marks.push({ ...m, at }));
        pendingRows = []; pendingMarks = [];
      }
      const speech = toSpeech(spoken(t).replace(/……$/, '、'));
      const plainEnd = t.replace(/<[^>]+>/g, '').trim();
      let gap = /[？?]$/.test(plainEnd) ? GAP.question : /[、,]$/.test(plainEnd) ? GAP.comma : GAP.sentence;
      if (ell) gap = GAP.dramatic;
      if (isLastPart && tail) gap = tail;
      cues.push({
        id: `c${String(chapter).padStart(2, '0')}-${String(cues.length + 1).padStart(4, '0')}`,
        shot: si,
        text: shown(t),
        speech,
        dur: +estimateDuration(speech).toFixed(2),
        gap,
        ...(focus !== undefined ? { focus: /^\d+$/.test(focus) ? Number(focus) - 1 : focus } : {}),
      });
    });
  };

  const lines = src.replace(/\r/g, '').split('\n');
  let inFront = false;
  for (const raw of lines) {
    lineNo++;
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    if (line === '---') { inFront = !inFront; continue; }
    if (inFront) { const m = /^title:\s*(.+)$/.exec(line); if (m) title = m[1]; continue; }

    if (line.startsWith('## ')) { sections.push(line.slice(3).trim()); section = sections.length - 1; continue; }
    if (line.startsWith('- ') && listTarget) { listTarget.push(shown(line.slice(2))); continue; }
    if (line.startsWith('|') && tableTarget) {
      tableTarget.push(line.replace(/^\||\|$/g, '').split('|').map((c) => shown(c.trim())));
      continue;
    }
    if (line.startsWith('+')) {
      if (cur()?.visual.kind !== 'chalk') fail('board row outside @board');
      const em = line.startsWith('+!');
      let t = line.slice(em ? 2 : 1).trim();
      let style: ChalkRow['style'] = em ? 'em' : 'row';
      if (t.startsWith('↓')) { style = 'down'; t = t.slice(1).trim(); }
      else if (/ \| /.test(t)) style = 'vs';
      pendingRows.push({ text: shown(t), style });
      continue;
    }
    if (/^[!_]\d+$/.test(line)) {
      if (cur()?.visual.kind !== 'chalk') fail('mark outside @board');
      pendingMarks.push({ row: Number(line.slice(1)) - 1, type: line[0] === '!' ? 'box' : 'under' });
      continue;
    }

    if (line.startsWith('>')) {
      const m = /^>(?:\[([^\]]+)\])?\s*(.*)$/.exec(line)!;
      let focus: string | undefined = m[1];
      const v = cur()?.visual;
      // animation: a new step opens a new shot so the step plays across its own cues
      if (v?.kind === 'anim' && focus && /^s\d+!?$/.test(focus)) {
        const step = Number(focus.replace(/\D/g, ''));
        const hold = focus.endsWith('!');
        const steps = ctx.animScripts[v.anim].steps;
        if (step >= steps.length) fail(`animation ${v.anim} has no step ${step}`);
        const fresh = cueCountIn(shots.length - 1) > 0;
        if (v.step !== step || !!v.hold !== hold) {
          if (fresh) open({ kind: 'anim', anim: v.anim, step, ...(hold ? { hold: true } : {}) });
          else { v.step = step; if (hold) v.hold = true; else delete v.hold; }
        }
        focus = undefined;
      }
      if (v?.kind === 'slide' && focus && /^m\d+$/.test(focus)) {
        const k = Number(focus.slice(1));
        if (k < 1 || k > ctx.slides[String(v.slide)].masks.length) fail(`slide ${v.slide} has no mask ${k}`);
      }
      if (v?.kind === 'figure' && focus && !ctx.figures[v.figure].svg.includes(`data-k="${focus}"`)) fail(`figure ${v.figure} has no structure ${focus}`);
      if (v?.kind === 'quiz' && focus && !/^(q|ok|[A-E])$/.test(focus)) fail(`quiz focus must be q, ok or A–E (got ${focus})`);
      pushCue(m[2], focus);
      continue;
    }

    if (!line.startsWith('@')) fail(`unrecognised line: ${line}`);
    const [cmd, ...rest] = line.slice(1).split(/\s+/);
    const arg = rest.join(' ');
    const card = (variant: 'point' | 'pitfall' | 'memo' | 'example', defLabel: string) => {
      const [label, html] = arg.includes('::') ? arg.split('::').map((x) => x.trim()) : [defLabel, arg];
      open({ kind: 'card', variant, label: shown(label || defLabel), html: shown(html) });
    };
    switch (cmd) {
      case 'title': open({ kind: 'title', chapter: ch.id, name: ch.name, role: ch.role, slides: ch.slides }); break;
      case 'end': open({ kind: 'end', chapter: ch.id, name: ch.name }); break;
      case 'goals': { const items: string[] = []; open({ kind: 'list', title: arg || '今日の学習目標', items, style: 'goal' }); listTarget = items; break; }
      case 'summary': { const items: string[] = []; open({ kind: 'list', title: arg || '今日のまとめ', items, style: 'sum' }); listTarget = items; break; }
      case 'roadmap': {
        if (/^\d+$/.test(arg)) {
          if (!roadmapItems.length) fail('@roadmap N before the roadmap was defined');
          open({ kind: 'roadmap', title: roadmapTitle, items: roadmapItems, current: Number(arg) - 1 });
        } else {
          roadmapItems = []; roadmapTitle = arg || roadmapTitle;
          open({ kind: 'roadmap', title: roadmapTitle, items: roadmapItems });
          listTarget = roadmapItems;
        }
        break;
      }
      case 'cellmap': open({ kind: 'cellmap', chapter: Number(arg) || ch.id }); break;
      case 'board': open({ kind: 'chalk', title: shown(arg), rows: [], marks: [] }); pendingRows = []; pendingMarks = []; break;
      case 'slide': slideOk(Number(arg)); open({ kind: 'slide', slide: Number(arg) }); break;
      case 'figure': if (!ctx.figures[arg]) fail(`unknown figure ${arg}`); open({ kind: 'figure', figure: arg, key: null }); break;
      case 'anim': if (!ctx.animScripts[arg]) fail(`unknown animation ${arg}`); open({ kind: 'anim', anim: arg, step: 0 }); break;
      case 'compare': { const rows: string[][] = []; open({ kind: 'compare', title: shown(arg), header: [], rows }); tableTarget = rows; break; }
      case 'point': card('point', 'ここ、覚えてください'); break;
      case 'pitfall': card('pitfall', 'ここで注意'); break;
      case 'memo': card('memo', '覚え方'); break;
      case 'example': card('example', '具体例'); break;
      case 'quiz': {
        const [qid, variant = 'typical'] = rest;
        qOk(qid);
        if (!['check', 'typical', 'final'].includes(variant)) fail(`quiz variant ${variant}`);
        curQuiz = { qid, variant: variant as 'check' | 'typical' | 'final' };
        open({ kind: 'quiz', qid, phase: 'ask', variant: curQuiz.variant });
        quizzes.push({ qid, section, variant: curQuiz.variant });
        break;
      }
      case 'think': {
        if (!curQuiz) fail('@think without @quiz');
        const secs = Number(arg) || 15;
        open({ kind: 'quiz', qid: curQuiz!.qid, phase: 'think', variant: curQuiz!.variant, think: secs });
        cues.push({ id: `c${String(chapter).padStart(2, '0')}-${String(cues.length + 1).padStart(4, '0')}`, shot: shots.length - 1, text: '（考える時間）', speech: '', dur: secs, gap: 0.3 });
        break;
      }
      case 'explain': if (!curQuiz) fail('@explain without @quiz'); open({ kind: 'quiz', qid: curQuiz!.qid, phase: 'explain', variant: curQuiz!.variant }); break;
      default: fail(`unknown command @${cmd}`);
    }
  }

  // finalise compare tables (first row = header)
  for (const s of shots) if (s.visual.kind === 'compare') { const v = s.visual; v.header = v.rows.shift() || []; }
  // every visual must be spoken over (except none)
  shots.forEach((s, i) => { if (!cues.some((c) => c.shot === i)) throw new Error(`lecture ${chapter}: visual #${i} (${s.visual.kind}) has no lines`); });
  // scene gap on the last cue of each shot
  for (let i = 0; i < cues.length; i++) {
    const next = cues[i + 1];
    if (next && next.shot !== cues[i].shot && cues[i].gap < GAP.scene && cues[i].speech) cues[i].gap = GAP.scene;
  }

  return {
    chapter,
    title,
    sections: sections.map((name, index) => ({ index, name })),
    shots,
    cues,
    version: SCRIPT_VERSION,
    quizzes,
    authored: true,
  };
}
