/**
 * npm run build:stats — writes src/content/courses/<id>/stats.json: the few
 * numbers the home screen and the category pages need about every course
 * (lecture lengths, question ids per chapter, counts), so they can show
 * progress for all courses without downloading each course's content.
 * Run after changing questions or narration; check:content fails when stale.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseDirs, courseStats } from './lib/validate';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
let stale = 0;
for (const c of courseDirs(ROOT)) {
  const path = resolve(c.dir, 'stats.json');
  const next = JSON.stringify(courseStats(c.dir, c.pub)) + '\n';
  let prev = '';
  try { prev = readFileSync(path, 'utf8'); } catch { /* new */ }
  if (prev === next) { console.log(`✓ ${c.id}`); continue; }
  if (check) { console.log(`✗ ${c.id}: stats.json is stale (npm run build:stats)`); stale++; continue; }
  writeFileSync(path, next);
  console.log(`✎ ${c.id}`);
}
process.exit(stale ? 1 : 0);
