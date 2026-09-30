import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseScript, type ScriptContext } from '../scripts/lib/lesson-script';
import { timeLecture } from '../src/engine/lecture/timing';
import type { Lecture } from '../src/engine/lecture/types';
import { BOARD_H, BOARD_W } from '../src/engine/board/types';
import { toSpeech } from '../src/engine/speech/reading';
import { errorProfile, quickReviewSet } from '../src/state/analytics';
import { emptyProgress } from '../src/state/types';
import type { Course, CourseMeta, SingleQuestion } from '../src/content/types';
import meta from '../src/content/courses/genetics-basics/course.json';
import single from '../src/content/courses/genetics-basics/questions/single.json';
import slides from '../src/content/courses/genetics-basics/slides.json';

const course = { ...meta, questions: single, slides } as unknown as Course;
const dir = resolve(__dirname, '../src/content/courses/genetics-basics/narrations');
const lectures: Lecture[] = readdirSync(dir).sort().map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')));

const ctx: ScriptContext = { course: meta as unknown as CourseMeta, chapter: 1, slides: slides as never, questions: single as unknown as SingleQuestion[], figures: {}, animScripts: {} };
const script = (body: string) => parseScript(`## 導入\n@bb\n${body}\n`, ctx);

describe('blackboard script', () => {
  it('attaches chalk to the line it accompanies and makes that line wait for the chalk', () => {
    const l = script('@in L 0 10\n+# {a} DNA\n+ {b} RNA → タンパク質\n> まずここを書きます。\n!o a\n> ここが重要です。');
    const ops = l.board!.ops;
    expect(ops.map((o) => o.k)).toEqual(['draw', 'draw', 'mark']);
    expect(ops[0].cue).toBe(0);
    expect(ops[2].cue).toBe(1);
    expect(ops[2].target).toEqual(['a']);
    expect(l.cues[0].write).toBeGreaterThan(ops[1].off);
    // the arrow inside a line is drawn, not typed
    const segs = (ops[1].prims![0] as { segs: { a?: number }[] }).segs;
    expect(segs.some((s) => s.a)).toBe(true);
  });
  it('supports silent writing, erasing and pointing', () => {
    const l = script('+ {q} ？\n>~\n!x q\n>~\n@over q\n+ {r} RNA\n!p r\n> これがRNAです。');
    const ks = l.board!.ops.map((o) => o.k);
    expect(ks).toEqual(['draw', 'erase', 'draw', 'point']);
    expect(l.cues[0].speech).toBe('');
    expect(l.board!.ops[2].box[1]).toBeCloseTo(l.board!.ops[0].box[1], 0); // rewritten in the same place
  });
  it('refuses lines that run off their panel or overlap earlier writing', () => {
    expect(() => script('@in R 0 10\n+ これはとても長い一行で右のパネルからはみ出してしまうはずの文章です\n> 書きます。')).toThrow(/runs off panel R/);
    expect(() => script('@in L 0 10\n+ DNA\n@in L 0 10\n+ RNA\n> 書きます。')).toThrow(/overlaps/);
    expect(() => script('!o nothing\n> 書きます。')).toThrow(/unknown board id/);
  });
  it('flushes leftover marks as a silent writing moment when the scene changes', () => {
    const l = parseScript('## 導入\n@bb\n+ {a} DNA\n> 書きます。\n!o a\n@title\n> 次へ。', ctx);
    expect(l.board!.ops.find((o) => o.k === 'mark')!.cue).toBe(1);
    expect(l.cues[1].speech).toBe('');
  });
});

describe('genetics lectures (blackboard)', () => {
  it('has six authored blackboard lectures of 5–15 minutes', () => {
    expect(lectures).toHaveLength(6);
    for (const l of lectures) {
      expect(l.authored).toBe(true);
      expect(l.board?.ops.length).toBeGreaterThan(20);
      const min = timeLecture(l).total / 60;
      expect(min).toBeGreaterThan(5);
      expect(min).toBeLessThan(15.5);
    }
  });
  it('follows the lesson structure: goals → board → molecular animation → quizzes → key points → final problem', () => {
    for (const l of lectures) {
      const kinds = l.shots.map((s) => s.visual.kind);
      expect(kinds[0]).toBe('title');
      expect(kinds).toContain('bb');
      expect(kinds).toContain('anim');
      expect(kinds).toContain('slide');
      expect(l.quizzes?.some((q) => q.variant === 'check')).toBe(true);
      expect(l.quizzes?.some((q) => q.variant === 'typical')).toBe(true);
      expect(l.quizzes?.some((q) => q.variant === 'final')).toBe(true);
      expect(l.keyPoints!.length).toBeGreaterThanOrEqual(3);
      expect(l.keyPoints!.length).toBeLessThanOrEqual(5);
      expect(l.cues.some((c) => c.dig)).toBe(true);
    }
  });
  it('keeps every board action inside the board and pointing at real cues and ids', () => {
    for (const l of lectures) {
      const ids = new Set(l.board!.ops.filter((o) => o.id).map((o) => o.id));
      for (const o of l.board!.ops) {
        expect(o.cue).toBeLessThan(l.cues.length);
        expect(l.shots[l.cues[o.cue].shot].visual.kind).toBe('bb');
        const [x, y, w, h] = o.box;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(BOARD_W);
        expect(y + h).toBeLessThanOrEqual(BOARD_H);
        for (const t of o.target ?? []) expect(ids.has(t)).toBe(true);
      }
      for (const k of l.keyPoints ?? []) for (const r of k.ref ?? []) expect(ids.has(r), `key point ref ${r}`).toBe(true);
      for (const s of l.shots) if (s.visual.kind === 'quiz') for (const r of s.visual.ref ?? []) expect(ids.has(r), `quiz ref ${r}`).toBe(true);
      for (const c of l.board!.cams) expect(c.cue).toBeLessThan(l.cues.length);
    }
  });
  it('uses the four chalk colours with meaning (white most, red for the few most important)', () => {
    const count: Record<string, number> = { w: 0, y: 0, r: 0, b: 0 };
    for (const l of lectures) for (const o of l.board!.ops) for (const p of o.prims ?? []) {
      if (p.p === 'text') for (const g of p.segs) count[g.c] += g.t.length;
    }
    expect(count.w).toBeGreaterThan(count.y);
    expect(count.w).toBeGreaterThan(count.r);
    expect(count.r).toBeGreaterThan(0);
    expect(count.b).toBeGreaterThan(0);
  });
});

describe('genetics questions and analysis', () => {
  it('tags every wrong option with the kind of mistake it catches', () => {
    for (const q of single as unknown as SingleQuestion[]) for (const o of q.options) {
      if (!o.correct) expect(['swap', 'reverse', 'number', 'scope', 'mechanism', 'fact']).toContain(o.trap);
    }
  });
  it('explains why answers were wrong from the chosen options', () => {
    const s = emptyProgress('genetics-basics');
    const q = course.questions.find((x) => x.id === 'g11b')!; // 転写: C (翻訳) is a swap
    const wrongIdx = q.options.findIndex((o) => o.trap === 'swap');
    s.answers.push({ qid: 'g11b', type: 'single', correct: false, choice: [wrongIdx], at: 1, review: false });
    s.answers.push({ qid: 'g23b', type: 'single', correct: false, choice: [0], at: 2, review: false }); // 同じ向き: reverse
    const p = errorProfile(course, s);
    expect(p.wrong).toBe(2);
    expect(p.kinds.map((k) => k.kind).sort()).toEqual(['reverse', 'swap']);
  });
  it('builds the 5-minute review from wrong, then unanswered questions of the lecture', () => {
    const s = emptyProgress('genetics-basics');
    s.questions.g14b = { attempts: 1, correct: 0, lastCorrect: false, lastAt: 1, reviews: 0 };
    s.questions.g14a = { attempts: 1, correct: 1, lastCorrect: true, lastAt: 1, reviews: 0 };
    const set = quickReviewSet(course, s, 1, 5);
    expect(set).toHaveLength(5);
    expect(set[0].id).toBe('g14b');
    expect(set.map((q) => q.id)).not.toContain('g14a');
    expect(set.every((q) => q.chapter === 1)).toBe(true);
  });
  it('reads genetics terms naturally', () => {
    expect(toSpeech('開始コドンAUGから')).toBe('開始コドンエーユージーから');
    expect(toSpeech('miRNAは翻訳を抑制')).toBe('マイクロアールエヌエーは翻訳を抑制');
    expect(toSpeech('ALDH2の多型')).toBe('エーエルディーエイチツーの多型');
    expect(toSpeech('短腕と長腕')).toBe('たんわんとちょうわん');
    expect(toSpeech("5'末端")).toBe('5ダッシュ末端');
  });
});
