/**
 * Timing: when every scene, spoken segment and visual event happens.
 *
 * A scene's length is its speech: Σ (pre + speech + post) over its segments, plus a short tail.
 * Before Kokoro has run, speech lengths are estimated from the reading; after the Windows side has
 * rendered the WAVs, `kokoro_tts.py` writes timing.json with the measured lengths and the same
 * layout, so the picture, the board and the subtitles move exactly when the lecturer says the word.
 */
import type { Plan, Segment, TimedScene, TimedSeg, Timing } from './types';

export const SCENE_TAIL = 0.15;

/** rough mora count of a reading (kana = 1, kanji ≈ 1.8, digits / latin letters by their Japanese reading) */
export function moraOf(say: string): number {
  let m = 0;
  for (const ch of say) {
    if (/[ゃゅょぁぃぅぇぉャュョァィゥェォ]/.test(ch)) continue;
    if (/[぀-ヿ]/.test(ch)) m += 1;
    else if (/[一-鿿]/.test(ch)) m += 1.8;
    else if (/[0-9０-９]/.test(ch)) m += 2.2;
    else if (/[A-Za-zＡ-Ｚａ-ｚ]/.test(ch)) m += 2.4;
  }
  return m;
}
/** pauses the voice makes by itself at punctuation */
const punct = (say: string) => (say.match(/[、，,]/g)?.length ?? 0) * 0.22 + (say.match(/[。！？!?]/g)?.length ?? 0) * 0.3;

/** speaking rate of the Kokoro Japanese voices at speed 1 (mora / s), measured on this material */
export const MORA_PER_S = 8.4;

export function estimateSpeech(seg: Segment, speed = 1): number {
  return Math.max(0.35, moraOf(seg.say) / (MORA_PER_S * speed * (seg.speed ?? 1)) + punct(seg.say) * 0.6);
}

/** measured lengths, keyed `${scene}/${beat}/${i}` (seconds of speech, without pre / post) */
export type SpeechLengths = Record<string, number>;

/** the Kokoro timing file written by tools/lecture-video/medstudy_video.py */
export interface KokoroTiming {
  plan: string;
  voice: string;
  speed: number;
  scenes: { id: string; file: string; duration: number; segs: { beat: string; i: number; speech: number }[] }[];
}
export function lengthsFromKokoro(k: KokoroTiming): SpeechLengths {
  const out: SpeechLengths = {};
  for (const s of k.scenes) for (const x of s.segs) out[`${s.id}/${x.beat}/${x.i}`] = x.speech;
  return out;
}

export function buildTiming(plan: Plan, measured?: SpeechLengths): Timing {
  let t = 0;
  const scenes: TimedScene[] = [], segs: TimedSeg[] = [];
  let usedMeasured = !!measured;
  for (const sc of plan.scenes) {
    const t0 = t, events: Record<string, number> = { start: t0 };
    for (const b of sc.beats) {
      b.segs.forEach((seg, i) => {
        const key = `${sc.id}/${b.id}/${i}`;
        const m = measured?.[key];
        if (measured && m == null) usedMeasured = false;
        const len = m ?? estimateSpeech(seg, plan.voice.speed);
        const s0 = t + (seg.pre ?? 0), s1 = s0 + len;
        segs.push({ scene: sc.id, beat: b.id, i, seg, t0: t, t1: s1 + (seg.post ?? 0), speech0: s0, speech1: s1 });
        if (seg.cue) events[seg.cue] = s0 + (seg.at ?? 0) * len;
        t = s1 + (seg.post ?? 0);
      });
    }
    t += SCENE_TAIL;
    scenes.push({ id: sc.id, t0, t1: t, events });
  }
  return { source: usedMeasured ? 'kokoro' : 'estimate', total: t, scenes, segs };
}

/** resolve 'start' / 'eventId' / 'eventId+0.4' to an absolute time; an event this variant of the script
 *  does not have resolves to Infinity (the effect simply never fires) */
export function at(ts: TimedScene, ref: string): number {
  const m = /^(.*?)([+-]\d+(?:\.\d+)?)?$/.exec(ref)!;
  const base = ts.events[m[1]] ?? Infinity;
  return base + (m[2] ? Number(m[2]) : 0);
}

export const tc = (s: number) => { const m = Math.floor(s / 60), x = s - m * 60; return `${String(m).padStart(2, '0')}:${x.toFixed(1).padStart(4, '0')}`; };
export const tcShort = (s: number) => { const m = Math.floor(s / 60), x = Math.floor(s - m * 60); return `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
