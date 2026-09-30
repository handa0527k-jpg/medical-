import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { courseDirs, validateCourse } from '../scripts/lib/validate';

describe('course content', () => {
  for (const c of courseDirs(resolve(__dirname, '..'))) {
    it(`${c.id} passes all integrity rules (5 options, 1 answer, sources, narration…)`, () => {
      expect(validateCourse(c.dir, c.pub)).toEqual([]);
    });
  }
});
