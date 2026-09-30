#!/usr/bin/env node
/**
 * One-time importer: converts the two prototype Claude Artifacts
 * (「細胞質｜見取り図から学ぶ」 and 「組織学｜細胞質 インタラクティブ医学教科書」)
 * into the course content files used by the app.
 *
 * Usage:
 *   node scripts/import-artifact.mjs <map-artifact.html> <textbook-artifact.html>
 *
 * The artifact pages are evaluated in headless Chromium (Playwright) so their
 * data globals can be read exactly as the prototype used them. Nothing is
 * rewritten or invented here — the output is the prototype data, normalised
 * into the typed shapes declared in src/content/types.ts.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COURSE = 'histology-cytoplasm';
const OUT = resolve(ROOT, 'src/content/courses', COURSE);
const PUB = resolve(ROOT, 'public/courses', COURSE);

const [mapHtml, bookHtml] = process.argv.slice(2);
if (!mapHtml || !bookHtml) {
  console.error('usage: node scripts/import-artifact.mjs <map-artifact.html> <textbook-artifact.html>');
  process.exit(1);
}

const json = (p, v) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(v, null, 1) + '\n');
};

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();

/* ---------- textbook artifact (primary source) ---------- */
await page.goto(pathToFileURL(resolve(bookHtml)).href);
const book = await page.evaluate(() => {
  const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'function' ? undefined : v)));
  // eslint-disable-next-line no-undef
  return { TX: strip(TX), QZ: strip(QZ), FD: strip(FD), STT, KP, MASK, IMG, FIGS: strip(FIGS), ANIMS: strip(ANIMS), SCRIPTS: strip(SCRIPTS), CHF };
});

/* ---------- map artifact (design reference + extra data) ---------- */
await page.goto(pathToFileURL(resolve(mapHtml)).href);
const map = await page.evaluate(() => {
  const strip = (o) => JSON.parse(JSON.stringify(o));
  // eslint-disable-next-line no-undef
  return { MC: strip(MC), SLD: strip(SLD), ZK: strip(ZK), MAP, IMG2: Object.keys(IMG) };
});
await browser.close();

const { TX, QZ, FD, STT, KP, MASK, IMG, FIGS, ANIMS, SCRIPTS, CHF } = book;
const s2c = {};
TX.CH.forEach((c) => c.sl.forEach((n) => (s2c[n] = c.id)));

/* course.json */
json(resolve(OUT, 'course.json'), {
  id: COURSE,
  title: '組織学｜細胞質',
  subtitle: '細胞質は、ひとつの工場。',
  subject: '組織学',
  lecture: { label: '講義資料02', number: 2, slideRange: [2, 56] },
  metaphor: '細胞＝工場',
  chapters: TX.CH.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    slides: c.sl,
    points: c.pts,
    overview: TX.OV[c.id],
    figures: CHF[c.id].f,
    animations: CHF[c.id].a,
  })),
});

/* textbook.json */
const block = (b) => {
  switch (b[0]) {
    case 'lead': return { type: 'lead', html: b[1] };
    case 'h': return { type: 'heading', html: b[1], slides: b[2] || [] };
    case 'p': return { type: 'paragraph', html: b[1] };
    case 'ana': return { type: 'analogy', html: b[1] };
    case 'clin': return { type: 'supplement', html: b[1] };
    case 'ng': return { type: 'misconception', html: b[1] };
    case 'col': return { type: 'column', title: b[1], html: b[2] };
    case 'slide': return { type: 'slide', slide: b[1] };
    case 'steps': return { type: 'steps', items: b[1] };
    case 'tbl': return { type: 'table', rows: b[1] };
    default: throw new Error('unknown block ' + b[0]);
  }
};
const textbook = {};
for (const c of TX.CH) textbook[c.id] = { blocks: TX.TB[c.id].b.map(block), summary: TX.TB[c.id].sum || [] };
json(resolve(OUT, 'textbook.json'), textbook);

/* slides.json + images */
const slides = {};
mkdirSync(resolve(PUB, 'slides'), { recursive: true });
for (const n of Object.keys(STT)) {
  const d = map.SLD[n] || { q: [] };
  slides[n] = {
    n: +n,
    chapter: s2c[n],
    title: STT[n],
    keyPoint: KP[n],
    masks: MASK[n] || [],
    selfCheck: (d.q || []).map((q) => ({ q: q[0], a: q[1], hint: q[2], hot: q[3] === 'hot' })),
    image: `slides/${String(n).padStart(2, '0')}.jpg`,
  };
  const m = /^data:image\/jpeg;base64,(.*)$/.exec(IMG[n]);
  if (!m) throw new Error('slide image not jpeg: ' + n);
  writeFileSync(resolve(PUB, 'slides', String(n).padStart(2, '0') + '.jpg'), Buffer.from(m[1], 'base64'));
}
json(resolve(OUT, 'slides.json'), slides);

/* questions/single.json — one best answer, always 5 options (A–E) */
const single = QZ.map((q, i) => {
  if (q.o.length !== 5) throw new Error('question without 5 options: ' + i);
  const kind = i % 2 ? '理解・統合' : '重要事項';
  return {
    id: `q${String(i + 1).padStart(3, '0')}`,
    slide: q.s,
    chapter: s2c[q.s],
    kind,
    difficulty: kind === '重要事項' ? 1 : 2,
    stem: q.q,
    options: q.o.map((o) => ({ text: o[0], explanation: o[1].replace(/^[○×]/, ''), correct: !!o[2] })),
    explanation: q.x,
    point: q.t,
    tags: [STT[q.s]],
  };
});
json(resolve(OUT, 'questions/single.json'), single);

/* questions/judgement.json — 5 statements, choose all true / all false */
json(resolve(OUT, 'questions/judgement.json'), map.MC.map((q, i) => ({
  id: `j${String(i + 1).padStart(3, '0')}`,
  slide: q.s,
  chapter: s2c[q.s],
  topic: q.t,
  ask: q.ty === 'T' ? 'true' : 'false',
  statements: q.o.map((o) => ({ text: o[0], isTrue: !!o[1], note: o[2] || '' })),
  boxes: q.b,
  figureBoxes: q.fb,
})));

/* zukan.json */
json(resolve(OUT, 'zukan.json'), map.ZK.map((z, i) => ({
  id: `z${String(i + 1).padStart(2, '0')}`,
  name: z[0], metaphor: z[1], icon: z[2], chapter: z[3], analogy: z[4], roles: z[5], facts: z[6], membranes: z[7],
})));

/* figures */
json(resolve(OUT, 'figures/figures.json'), Object.fromEntries(Object.entries(FIGS).map(([k, f]) => [k, {
  id: k, title: f.title, en: f.en, hint: f.hint, set: f.set, sources: f.srcs, svg: f.svg,
}])));
json(resolve(OUT, 'figures/details.json'), Object.fromEntries(Object.entries(FD).map(([set, o]) => [set,
  Object.fromEntries(Object.entries(o).map(([k, d]) => [k, { name: d[0], role: d[1], text: d[2], sources: d[3] }]))])));

/* animations */
json(resolve(OUT, 'animations/meta.json'), Object.fromEntries(Object.entries(ANIMS).map(([k, a]) => [k, {
  id: k, title: a.title, en: a.en, chapter: a.ch, sources: a.srcs, description: a.desc, modes: a.modes || null,
}])));
json(resolve(OUT, 'animations/scripts.json'), SCRIPTS);

/* cell map svg (design reference home) */
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, 'map.svg'), map.MAP.trim() + '\n');

console.log('imported:', Object.keys(slides).length, 'slides,', single.length, 'single,', map.MC.length, 'judgement,',
  map.ZK.length, 'zukan,', Object.keys(FIGS).length, 'figures,', Object.keys(ANIMS).length, 'animations');
void readFileSync;
