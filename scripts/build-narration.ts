/**
 * Generates narrations/lecture-NN.json for every chapter of every course.
 *
 *   npm run build:narration              # all courses
 *   npm run build:narration -- <course>  # one course
 *
 * Re-run whenever textbook, slide or animation content changes.
 */
import kuromoji from 'kuromoji';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePolite } from './lib/polite';
import { buildLecture } from './lib/lecture-builder';
import { parseScript } from './lib/lesson-script';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COURSES = resolve(ROOT, 'src/content/courses');
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

const tokenizer = await new Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>>((ok, ng) =>
  kuromoji.builder({ dicPath: resolve(ROOT, 'node_modules/kuromoji/dict') }).build((e, t) => (e ? ng(e) : ok(t))),
);
const polite = makePolite(tokenizer);

const only = process.argv[2];
for (const id of readdirSync(COURSES)) {
  if (only && id !== only) continue;
  const dir = resolve(COURSES, id);
  if (!existsSync(resolve(dir, 'course.json'))) continue;
  const course = read(resolve(dir, 'course.json'));
  const input = {
    course,
    text: read(resolve(dir, 'textbook.json')),
    slides: read(resolve(dir, 'slides.json')),
    questions: read(resolve(dir, 'questions/single.json')),
    figures: read(resolve(dir, 'figures/figures.json')),
    figureDetails: read(resolve(dir, 'figures/details.json')),
    animMeta: read(resolve(dir, 'animations/meta.json')),
    animScripts: read(resolve(dir, 'animations/scripts.json')),
    polite,
  };
  mkdirSync(resolve(dir, 'narrations'), { recursive: true });
  let total = 0, cues = 0;
  for (const ch of course.chapters) {
    // hand-written prep-school script wins; otherwise generate from the content
    const script = resolve(dir, 'lessons', `lecture-${String(ch.id).padStart(2, '0')}.md`);
    const lec = existsSync(script)
      ? parseScript(readFileSync(script, 'utf8'), { course, chapter: ch.id, slides: input.slides, questions: input.questions, figures: input.figures, animScripts: input.animScripts })
      : buildLecture(input, ch.id);
    const file = resolve(dir, 'narrations', `lecture-${String(ch.id).padStart(2, '0')}.json`);
    writeFileSync(file, JSON.stringify(lec, null, 1) + '\n');
    const sec = lec.cues.reduce((a, c) => a + c.dur + c.gap, 0);
    total += sec; cues += lec.cues.length;
    console.log(`${id} lecture ${ch.id}${lec.authored ? ' (script)' : ''}: ${lec.shots.length} shots, ${lec.cues.length} cues, ~${Math.round(sec / 60)} min`);
  }
  console.log(`${id}: ${cues} cues, ~${Math.round(total / 60)} min total`);
}
