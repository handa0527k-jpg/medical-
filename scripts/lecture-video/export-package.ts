/**
 * Write a 授業動画 production package (text part) from the command line — the same files the
 * 🎬 授業動画 page downloads. Keyframes and layer frames are added by render-layers.mjs.
 *
 *   npx tsx scripts/lecture-video/export-package.ts --out <dir> [--course genetics-basics] [--lecture 1] [--section 2|film]
 *        [--duration 30] [--style board|documentary|exam] [--intensity standard|gekiga|ultra]
 *        [--profile ti2v-5b|i2v-14b] [--timing <dir>/audio/kokoro_timing.json]
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
import type { Lecture } from '../../src/engine/lecture/types';
import type { SingleQuestion, Slide } from '../../src/content/types';
import { filmTheme, themesOf } from '../../src/engine/lecture-video/analyze';
import { FILM_KEY } from '../../src/engine/lecture-video/directions/lecture1';
import { buildPlan, voiceKey } from '../../src/engine/lecture-video/plan';
import { buildTiming, lengthsFromKokoro, type KokoroTiming } from '../../src/engine/lecture-video/timing';
import { packageFiles } from '../../src/engine/lecture-video/package';
import type { Duration, Intensity, LessonStyle } from '../../src/engine/lecture-video/types';
import type { WanProfile } from '../../src/engine/lecture-video/wan';

const args = process.argv.slice(2);
const opt = (k: string, d?: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = resolve(opt('--out') ?? 'out');
const course = opt('--course', 'genetics-basics')!, lecture = Number(opt('--lecture', '1')), sectionArg = opt('--section', '2')!;
const root = resolve(HERE, '../../src/content/courses', course);
const lec: Lecture = JSON.parse(readFileSync(resolve(root, `narrations/lecture-${String(lecture).padStart(2, '0')}.json`), 'utf8'));
const meta = JSON.parse(readFileSync(resolve(root, 'course.json'), 'utf8'));
// --section film = the whole lecture as one film (完成版)
const theme = sectionArg === 'film' ? filmTheme(course, lec, FILM_KEY) : themesOf(course, lec).find((t) => t.section === Number(sectionArg))!;
const o = { duration: Number(opt('--duration', '30')) as Duration, style: opt('--style', 'board') as LessonStyle, intensity: opt('--intensity', 'gekiga') as Intensity };
const plan = buildPlan({
  course, courseTitle: meta.title, lecture: lec, theme,
  slides: JSON.parse(readFileSync(resolve(root, 'slides.json'), 'utf8')) as Record<number, Slide>,
  questions: JSON.parse(readFileSync(resolve(root, 'questions/single.json'), 'utf8')) as SingleQuestion[],
}, o);
const tf = opt('--timing');
const timing = buildTiming(plan, tf && existsSync(tf) ? lengthsFromKokoro(JSON.parse(readFileSync(tf, 'utf8')) as KokoroTiming) : undefined);
const vk = voiceKey(theme.key, o);
const files = packageFiles(plan, timing, (opt('--profile', 'ti2v-5b') as WanProfile), vk);
for (const [name, content] of Object.entries(files)) {
  const f = resolve(out, name); mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, content);
}
console.log(`${plan.theme}\n${Object.keys(files).length} files → ${out}  (timing: ${timing.source}, ${timing.total.toFixed(2)} s, voice key ${vk})`);
