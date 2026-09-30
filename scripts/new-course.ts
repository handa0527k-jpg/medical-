/**
 * Scaffold a new course from a lecture PDF.
 *
 *   npm run new:course -- <course-id> <lecture.pdf> [--title "組織学｜上皮組織"] [--number 3] [--skip 1]
 *
 * What it does
 *  1. extracts the text of every page with pdf.js → slides.json (title guess + raw text)
 *  2. renders each page to public/courses/<id>/slides/NN.jpg with `pdftoppm`
 *     (poppler) when it is installed; otherwise tells you how to export them
 *  3. writes a complete folder skeleton (course.json, textbook.json, questions/…, index.ts)
 *     so the app loads the course immediately
 *
 * What it does NOT do: invent medical content. Textbook text, questions (2 per
 * content slide, 5 options each), figures and animations are authored from the
 * PDF afterwards; `npm run check:content` lists exactly what is still missing.
 * --skip N marks the first N pages (title / contents) as excluded from questions.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k: string, d = '') => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const [id, pdf] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!id || !pdf || !/^[a-z0-9-]+$/.test(id)) {
  console.error('usage: npm run new:course -- <course-id (a-z0-9-)> <lecture.pdf> [--title T] [--number N] [--skip N]');
  process.exit(1);
}
const dir = resolve(ROOT, 'src/content/courses', id);
const pub = resolve(ROOT, 'public/courses', id);
if (existsSync(dir)) { console.error(`course ${id} already exists`); process.exit(1); }

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(pdf)) }).promise;
const skip = Number(opt('skip', '0'));
const pages: { n: number; text: string }[] = [];
for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n);
  const tc = await page.getTextContent();
  const text = tc.items.map((i) => ('str' in i ? i.str : '')).join(' ').replace(/\s+/g, ' ').trim();
  pages.push({ n, text });
}
const content = pages.filter((p) => p.n > skip);

mkdirSync(resolve(dir, 'questions'), { recursive: true });
mkdirSync(resolve(dir, 'figures'), { recursive: true });
mkdirSync(resolve(dir, 'animations'), { recursive: true });
mkdirSync(resolve(dir, 'narrations'), { recursive: true });
mkdirSync(resolve(pub, 'slides'), { recursive: true });
const j = (p: string, v: unknown) => writeFileSync(resolve(dir, p), JSON.stringify(v, null, 1) + '\n');
const img = (n: number) => `slides/${String(n).padStart(2, '0')}.jpg`;

// slide images
let rendered = false;
try {
  execFileSync('pdftoppm', ['-jpeg', '-r', '110', '-scale-to', '1280', pdf, resolve(pub, 'slides', 'p')], { stdio: 'ignore' });
  rendered = true;
  // pdftoppm names files p-1.jpg / p-01.jpg; normalise to NN.jpg
  const { readdirSync, renameSync } = await import('node:fs');
  for (const f of readdirSync(resolve(pub, 'slides'))) {
    const m = /^p-0*(\d+)\.jpg$/.exec(f);
    if (m) renameSync(resolve(pub, 'slides', f), resolve(pub, 'slides', `${String(m[1]).padStart(2, '0')}.jpg`));
  }
} catch {
  rendered = false;
}

j('course.json', {
  id,
  title: opt('title', id),
  subtitle: '',
  subject: opt('title', id).split('｜')[0],
  lecture: { label: `講義資料${opt('number', '')}`, number: Number(opt('number', '99')), slideRange: [content[0]?.n ?? 1, pages.length] },
  metaphor: '',
  chapters: [{ id: 1, name: '（章名）', role: '', slides: content.map((p) => p.n), points: [], overview: { one: '', flow: [], cast: [] }, figures: [], animations: [] }],
});
j('slides.json', Object.fromEntries(content.map((p) => [p.n, { n: p.n, chapter: 1, title: p.text.slice(0, 40), keyPoint: '', masks: [], selfCheck: [], image: img(p.n), sourceText: p.text }])));
j('textbook.json', { 1: { blocks: [{ type: 'lead', html: '' }, ...content.map((p) => ({ type: 'slide', slide: p.n }))], summary: [] } });
j('questions/single.json', []);
j('questions/judgement.json', []);
j('zukan.json', []);
j('figures/figures.json', {});
j('figures/details.json', {});
j('animations/meta.json', {});
j('animations/scripts.json', {});
writeFileSync(resolve(dir, 'map.svg'), '<svg viewBox="0 0 1000 680" role="img" aria-label="見取り図（未作成）"></svg>\n');
writeFileSync(resolve(dir, 'animations/defs.ts'), "import type { AnimDef } from '../../../../engine/animation/types';\n\n/** Drawing code for this course's animations (see histology-cytoplasm for examples). */\nexport const ANIM_DEFS: Record<string, AnimDef> = {};\n");
const tpl = readFileSync(resolve(ROOT, 'src/content/courses/histology-cytoplasm/index.ts'), 'utf8')
  .replace(/Course: .*\n.*\n/, `Course: ${opt('title', id)}\n`)
  .replaceAll('histology-cytoplasm', id)
  .replace('figs.cell.svg', "(figs.cell?.svg ?? '<svg></svg>')");
writeFileSync(resolve(dir, 'index.ts'), tpl);
void copyFileSync;

console.log(`created src/content/courses/${id} (${content.length} content pages, ${skip} skipped)`);
console.log(rendered ? `rendered slide images → public/courses/${id}/slides/` : `⚠ pdftoppm not found: export each page as public/courses/${id}/slides/NN.jpg (e.g. brew/apt install poppler, then re-run the pdftoppm step)`);
console.log('next: author textbook / questions from slides.json → npm run build:narration → npm run check:content');
