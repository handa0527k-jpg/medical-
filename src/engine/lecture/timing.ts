import type { AudioManifest, Lecture, TimedCue, TimedLecture, TimedShot } from './types';

/**
 * Lay a lecture out on a timeline. Cue length = recorded audio duration when
 * available, otherwise the generator's estimate. Each cue is followed by its
 * natural pause (`gap`). Shots are stretched to their minimum on-screen time.
 */
export function timeLecture(lecture: Lecture, audio?: AudioManifest | null): TimedLecture {
  const shots: TimedShot[] = lecture.shots.map((s, index) => ({ ...s, index, t0: 0, t1: 0, cues: [] }));
  const byShot = new Map<number, TimedCue[]>();
  for (const c of lecture.cues) {
    const rec = audio && audio.version === lecture.version ? audio.cues[c.id] : undefined;
    const d = (rec ? rec.duration : c.dur) + c.gap;
    const tc: TimedCue = { ...c, t0: 0, t1: 0, d };
    if (!byShot.has(c.shot)) byShot.set(c.shot, []);
    byShot.get(c.shot)!.push(tc);
  }
  let t = 0;
  const cues: TimedCue[] = [];
  for (const s of shots) {
    s.cues = byShot.get(s.index) || [];
    const sum = s.cues.reduce((a, q) => a + q.d, 0);
    if (s.min && sum < s.min && s.cues.length) s.cues[s.cues.length - 1].d += s.min - sum;
    s.t0 = t;
    for (const q of s.cues) { q.t0 = t; t += q.d; q.t1 = t; cues.push(q); }
    s.t1 = t;
  }
  const chapters = lecture.sections
    .map((sec) => { const s = shots.find((x) => x.section === sec.index && x.cues.length); return s ? { index: sec.index, name: sec.name, t0: s.t0 } : null; })
    .filter((x): x is NonNullable<typeof x> => !!x);
  // shots keep their original index so cue.shot can index this array directly
  return { lecture, shots, cues, total: t, chapters };
}

export function cueAt(tl: TimedLecture, t: number): TimedCue {
  const cs = tl.cues;
  let lo = 0, hi = cs.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (t < cs[mid].t1) hi = mid; else lo = mid + 1; }
  return cs[lo];
}
