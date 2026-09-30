/** npm run check:content — validates every course folder. Exit code 1 on problems. */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseDirs, validateCourse } from './lib/validate';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let bad = 0;
for (const c of courseDirs(ROOT)) {
  const errs = validateCourse(c.dir, c.pub);
  console.log(errs.length ? `✗ ${c.id}: ${errs.length} problem(s)` : `✓ ${c.id}`);
  errs.forEach((e) => console.log('   - ' + e));
  bad += errs.length;
}
process.exit(bad ? 1 : 0);
