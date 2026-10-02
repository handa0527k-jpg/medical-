/**
 * Story anime: turn each line's text into what the voice should read (medical-term readings),
 * for scripts/generate-story-audio.py.
 *
 *     npx tsx scripts/build-story-speech.ts [course…]
 *
 * Reads  src/content/courses/<course>/story/story.json
 * Writes .audio-cache/story/<course>.json  [{ i, who, voice, pitch, rate, speech }]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toSpeech } from '../src/engine/speech/reading';

const root = join(import.meta.dirname, '..');
const all = readdirSync(join(root, 'src/content/courses')).filter((c) => existsSync(join(root, 'src/content/courses', c, 'story/story.json')));
const want = process.argv.slice(2);
mkdirSync(join(root, '.audio-cache/story'), { recursive: true });
for (const c of want.length ? want : all) {
  const def = JSON.parse(readFileSync(join(root, 'src/content/courses', c, 'story/story.json'), 'utf8'));
  const out = def.lines.map((l: { who: string; text: string }, i: number) => {
    const v = def.voices[l.who];
    if (!v) throw new Error(`${c}: no voice for ${l.who}`);
    return { i, who: l.who, voice: v[0], pitch: v[1], rate: v[2], speech: toSpeech(l.text) };
  });
  writeFileSync(join(root, '.audio-cache/story', `${c}.json`), JSON.stringify(out, null, 1));
  console.log(c, out.length, 'lines');
}
