import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTimeline, GAP, LEAD, lineAt, sceneAt, TAIL } from '../src/engine/story/timeline';
import type { StoryModule } from '../src/engine/story/types';

const stories = import.meta.glob<{ default: StoryModule }>('../src/content/courses/*/story/index.ts', { eager: true });

describe('story timeline', () => {
  const lines = [
    { scene: 'a', who: 'N', text: 'x', dur: 2, bytes: [0, 1] as [number, number] },
    { scene: 'a', who: 'N', text: 'y', dur: 3, bytes: [1, 1] as [number, number] },
    { scene: 'b', who: 'N', text: 'z', dur: 1, bytes: [2, 1] as [number, number] },
  ];
  const tl = buildTimeline(lines);
  it('lays lines end to end with lead-in, gaps and a tail per scene', () => {
    expect(tl.lines[0].t0).toBe(LEAD);
    expect(tl.lines[1].t0).toBeCloseTo(LEAD + 2 + GAP);
    expect(tl.end.a).toBeCloseTo(LEAD + 2 + GAP + 3 + GAP + TAIL);
    expect(tl.start.b).toBe(tl.end.a);
    expect(tl.total).toBeCloseTo(tl.end.b);
  });
  it('finds the line and scene at a time', () => {
    expect(lineAt(tl, 0)).toBe(-1);
    expect(lineAt(tl, LEAD + 0.5)).toBe(0);
    const scenes = [{ id: 'a', title: '', plot: '', struct: '' }, { id: 'b', title: '', plot: '', struct: '' }];
    expect(sceneAt(tl, scenes, tl.start.b + 0.1).id).toBe('b');
  });
});

describe('story anime content', () => {
  const entries = Object.entries(stories);
  it('every course has a story', () => expect(entries.length).toBe(5));
  for (const [path, mod] of entries) {
    const course = path.split('/')[4];
    const { def, draw } = mod.default;
    it(`${course}: scenes, drawings, voices and audio line up`, () => {
      const ids = def.scenes.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(typeof draw[id], `draw ${id}`).toBe('function');
        expect(def.lines.some((l) => l.scene === id), `lines for ${id}`).toBe(true);
      }
      // lines keep scene order
      const order = def.lines.map((l) => ids.indexOf(l.scene));
      expect(order.every((v, i) => v >= 0 && (i === 0 || v >= order[i - 1]))).toBe(true);
      const mp3 = join('public/courses', course, 'story/story.mp3');
      expect(existsSync(mp3)).toBe(true);
      const size = statSync(mp3).size;
      let end = 0;
      for (const l of def.lines) {
        expect(def.voices[l.who], `voice ${l.who}`).toBeTruthy();
        expect(l.dur).toBeGreaterThan(0.5);
        // lines are packed back to back
        expect(l.bytes[0]).toBe(end);
        end = l.bytes[0] + l.bytes[1];
      }
      expect(end).toBe(size);
      expect(def.lines.length).toBeGreaterThanOrEqual(50);
      expect(def.cast.length).toBeGreaterThanOrEqual(5);
      expect(def.points.rows.every((r) => r.length === def.points.head.length)).toBe(true);
    });
  }
});

describe('genetics opening (cinematic prototype)', () => {
  it('cuts follow the recorded lines and the opening lasts 30–50 s', async () => {
    const mod = stories['../src/content/courses/genetics-basics/story/index.ts'].default;
    const tl = buildTimeline(mod.def.lines);
    expect(mod.def.scenes[0].id).toBe('opening');
    const len = tl.end.opening - tl.start.opening;
    expect(len).toBeGreaterThan(30); expect(len).toBeLessThan(50);
    const { OPENING_SHOTS } = await import('../src/content/courses/genetics-basics/story/opening');
    const cuts = [OPENING_SHOTS.B, OPENING_SHOTS.C, OPENING_SHOTS.D1, OPENING_SHOTS.D2, OPENING_SHOTS.E1, OPENING_SHOTS.E2, OPENING_SHOTS.F];
    cuts.forEach((c, i) => { expect(c).toBeGreaterThan(i ? cuts[i - 1] + 0.8 : 1); expect(c).toBeLessThan(len); });
    // the silent beat before Deo's last line holds the falling page
    const last = tl.lines.filter((l) => l.scene === 'opening').at(-1)!;
    expect(last.wait).toBeGreaterThan(2);
  });
  it('a held beat (wait) adds silence before a line', () => {
    const a = buildTimeline([{ scene: 's', who: 'N', text: 'x', dur: 1, bytes: [0, 1] }, { scene: 's', who: 'N', text: 'y', dur: 1, bytes: [1, 1], wait: 2 }]);
    expect(a.lines[1].t0).toBeCloseTo(LEAD + 1 + GAP + 2);
  });
});

describe('subtitle pieces (subChunks)', async () => {
  const { subPieces, subAt } = await import('../src/engine/story/timeline');
  it('cuts a long line into sentences and comma pieces, keeping every character', () => {
    const s = '別のアミノ酸に替われば、ミスセンス変異。GACからGAAへ、アスパラギン酸からグルタミン酸へと、性質の似たものに替わる保存的置換もあれば、CGAからGGAへ、アルギニンからグリシンへと、性質の違うものに替わる非保存的置換もある。終止コドンに変われば、ナンセンス変異だ。';
    const ps = subPieces(s);
    expect(ps.join('')).toBe(s);
    expect(ps.length).toBeGreaterThan(3);
    ps.forEach((p) => expect(p.length).toBeLessThanOrEqual(44));
    expect(subAt(s, 0, 10, 0)).toBe(ps[0]);
    expect(subAt(s, 0, 10, 9.99)).toBe(ps[ps.length - 1]);
  });
  it('leaves a short line whole', () => {
    expect(subPieces('……済。間に合ったな。')).toEqual(['……済。間に合ったな。']);
  });
});
