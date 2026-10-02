/**
 * Content integrity rules shared by `npm run check:content` and the unit tests.
 * Returns a list of human-readable problems (empty = valid).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATEGORIES } from '../../src/content/categories';
import { timeLecture } from '../../src/engine/lecture/timing';
import type { AudioManifest, Lecture } from '../../src/engine/lecture/types';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

export function validateCourse(dir: string, publicDir: string): string[] {
  const errs: string[] = [];
  const need = ['course.json', 'textbook.json', 'slides.json', 'questions/single.json', 'questions/judgement.json', 'zukan.json', 'figures/figures.json', 'figures/details.json', 'animations/meta.json', 'animations/scripts.json', 'map.svg', 'index.ts'];
  for (const f of need) if (!existsSync(resolve(dir, f))) errs.push(`missing ${f}`);
  if (errs.length) return errs;

  const course = read(resolve(dir, 'course.json'));
  const cats = new Set(CATEGORIES.map((c) => c.id));
  if (!cats.has(course.category)) errs.push(`course.json: unknown category "${course.category}" (see src/content/categories.ts)`);
  for (const c of course.alsoIn ?? []) if (!cats.has(c)) errs.push(`course.json: unknown alsoIn category "${c}"`);
  const slides = read(resolve(dir, 'slides.json'));
  const text = read(resolve(dir, 'textbook.json'));
  const single = read(resolve(dir, 'questions/single.json'));
  const judge = read(resolve(dir, 'questions/judgement.json'));
  const figures = read(resolve(dir, 'figures/figures.json'));
  const details = read(resolve(dir, 'figures/details.json'));
  const animMeta = read(resolve(dir, 'animations/meta.json'));
  const scripts = read(resolve(dir, 'animations/scripts.json'));
  const slideSet = new Set(Object.keys(slides).map(Number));

  for (const ch of course.chapters) {
    if (!text[ch.id]) errs.push(`chapter ${ch.id}: no textbook`);
    for (const n of ch.slides) if (!slideSet.has(n)) errs.push(`chapter ${ch.id}: unknown slide ${n}`);
    for (const f of ch.figures) if (!figures[f]) errs.push(`chapter ${ch.id}: unknown figure ${f}`);
    for (const a of ch.animations) if (!animMeta[a] || !scripts[a]) errs.push(`chapter ${ch.id}: unknown animation ${a}`);
    const narr = resolve(dir, 'narrations', `lecture-${String(ch.id).padStart(2, '0')}.json`);
    if (!existsSync(narr)) errs.push(`chapter ${ch.id}: narration missing (run npm run build:narration)`);
  }
  for (const [n, s] of Object.entries<{ image: string }>(slides)) {
    if (!existsSync(resolve(publicDir, s.image))) errs.push(`slide ${n}: image ${s.image} missing`);
  }
  for (const [id, t] of Object.entries<{ blocks: { type: string; slide?: number; slides?: number[] }[] }>(text)) {
    for (const b of t.blocks) {
      if (b.type === 'slide' && !slideSet.has(b.slide!)) errs.push(`textbook ${id}: unknown slide ${b.slide}`);
      if (b.type === 'heading') for (const n of b.slides || []) if (!slideSet.has(n)) errs.push(`textbook ${id}: heading cites unknown slide ${n}`);
    }
  }

  const ids = new Set<string>();
  for (const q of single) {
    if (ids.has(q.id)) errs.push(`duplicate question id ${q.id}`);
    ids.add(q.id);
    if (q.options.length !== 5) errs.push(`${q.id}: must have exactly 5 options (has ${q.options.length})`);
    const nc = q.options.filter((o: { correct: boolean }) => o.correct).length;
    if (nc !== 1) errs.push(`${q.id}: must have exactly one correct option (has ${nc})`);
    if (!slideSet.has(q.slide)) errs.push(`${q.id}: unknown source slide ${q.slide}`);
    if (!q.explanation) errs.push(`${q.id}: missing explanation`);
    if (!q.point) errs.push(`${q.id}: missing key point`);
    if (![1, 2, 3].includes(q.difficulty)) errs.push(`${q.id}: bad difficulty`);
    q.options.forEach((o: { explanation: string }, i: number) => { if (!o.explanation) errs.push(`${q.id}: option ${'ABCDE'[i]} has no explanation`); });
  }
  // rule: every content slide has two questions
  const perSlide = new Map<number, number>();
  for (const q of single) perSlide.set(q.slide, (perSlide.get(q.slide) || 0) + 1);
  for (const n of slideSet) if ((perSlide.get(n) || 0) < 2) errs.push(`slide ${n}: fewer than 2 questions (mark it as excluded if it is a title/contents slide)`);

  for (const q of judge) {
    if (q.statements.length !== 5) errs.push(`${q.id}: judgement must have 5 statements`);
    if (!slideSet.has(q.slide)) errs.push(`${q.id}: unknown slide ${q.slide}`);
  }
  for (const [k, P] of Object.entries<{ quiz: { o: string[]; a: number }[]; steps: unknown[] }>(scripts)) {
    P.quiz.forEach((q, i) => { if (q.o.length !== 5) errs.push(`animation ${k} quiz ${i + 1}: must have 5 options`); if (q.a < 0 || q.a > 4) errs.push(`animation ${k} quiz ${i + 1}: bad answer index`); });
    if (!P.steps.length) errs.push(`animation ${k}: no steps`);
  }
  for (const [k, f] of Object.entries<{ set: string; sources: number[] }>(figures)) {
    if (!details[f.set]) errs.push(`figure ${k}: no details set ${f.set}`);
    for (const n of f.sources) if (!slideSet.has(n)) errs.push(`figure ${k}: unknown slide ${n}`);
  }
  return errs;
}

export function courseDirs(root: string) {
  const base = resolve(root, 'src/content/courses');
  return readdirSync(base).filter((d) => existsSync(resolve(base, d, 'course.json'))).map((d) => ({ id: d, dir: resolve(base, d), pub: resolve(root, 'public/courses', d) }));
}

/** The numbers stats.json holds for one course (see scripts/build-stats.ts). */
export function courseStats(dir: string, publicDir: string) {
  const course = read(resolve(dir, 'course.json'));
  const single: { id: string; chapter: number }[] = read(resolve(dir, 'questions/single.json'));
  const judge: { id: string; chapter: number }[] = read(resolve(dir, 'questions/judgement.json'));
  const byCh = (qs: { id: string; chapter: number }[]) => {
    const o: Record<number, string[]> = {};
    for (const q of qs) (o[q.chapter] ??= []).push(q.id);
    return o;
  };
  const lectures = course.chapters.map((ch: { id: number }) => {
    const nn = String(ch.id).padStart(2, '0');
    const np = resolve(dir, `narrations/lecture-${nn}.json`);
    if (!existsSync(np)) return { id: ch.id, minutes: 0, board: false, audio: false };
    const lec: Lecture = read(np);
    const mp = resolve(publicDir, `audio/lecture-${nn}/manifest.json`);
    const man: AudioManifest | null = existsSync(mp) ? read(mp) : null;
    const audio = !!man && man.version === lec.version;
    const t = timeLecture(lec, audio ? man : null);
    return { id: ch.id, minutes: Math.max(1, Math.round(t.total / 60)), board: lec.shots.some((s) => s.visual.kind === 'bb'), audio };
  });
  return {
    lectures,
    single: byCh(single),
    judgement: byCh(judge),
    figures: Object.keys(read(resolve(dir, 'figures/figures.json'))).length,
    animations: Object.keys(read(resolve(dir, 'animations/meta.json'))).length,
    zukan: read(resolve(dir, 'zukan.json')).length,
  };
}
