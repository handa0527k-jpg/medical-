/**
 * Narrators speak one lecture cue at a time. Three honest sources:
 *
 *  - AudioFileNarrator  : pre-recorded audio files listed in an AudioManifest
 *  - WebSpeechNarrator  : the device's own speech synthesizer (real audio,
 *                         quality depends on installed voices)
 *  - (none)             : subtitles only — the UI says so explicitly
 *
 * The UI always shows which source is active; nothing pretends audio exists.
 */
import type { AudioManifest, LectureCue } from '../lecture/types';

export type NarratorKind = 'audio' | 'device';

export interface Narrator {
  readonly kind: NarratorKind;
  readonly label: string;
  /** start speaking; onEnd fires once when finished, interrupted or failed */
  speak(cue: LectureCue, opts: { rate: number; volume: number }, onEnd: (ok: boolean) => void): void;
  stop(): void;
  setVolume(v: number): void;
  dispose(): void;
}

/* ---------------- recorded audio ---------------- */
export class AudioFileNarrator implements Narrator {
  readonly kind = 'audio' as const;
  readonly label: string;
  private el = new Audio();
  private done: ((ok: boolean) => void) | null = null;
  constructor(private manifest: AudioManifest, private base: string) {
    this.label = `収録音声（${manifest.voice}）`;
    this.el.preload = 'auto';
    this.el.onended = () => this.finish(true);
    this.el.onerror = () => this.finish(false);
  }
  has(cueId: string) { return !!this.manifest.cues[cueId]; }
  private finish(ok: boolean) { const d = this.done; this.done = null; d?.(ok); }
  speak(cue: LectureCue, { rate, volume }: { rate: number; volume: number }, onEnd: (ok: boolean) => void) {
    this.stop();
    const rec = this.manifest.cues[cue.id];
    if (!rec) { onEnd(false); return; }
    this.done = onEnd;
    this.el.src = this.base + rec.src;
    this.el.playbackRate = rate;
    this.el.volume = volume;
    this.el.play().catch(() => this.finish(false));
  }
  stop() { if (!this.el.paused) this.el.pause(); this.finish(false); }
  setVolume(v: number) { this.el.volume = v; }
  dispose() { this.stop(); this.el.removeAttribute('src'); }
}

/* ---------------- device speech synthesis ---------------- */
export const webSpeechAvailable = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';

/** Higher = more natural. Neural/online/premium voices first; robotic engines last. */
export function voiceScore(v: SpeechSynthesisVoice): number {
  const n = v.name;
  let s = 0;
  if (/premium|プレミアム/i.test(n)) s += 60;
  if (/enhanced|拡張|高品質/i.test(n)) s += 45;
  if (/natural|neural|online/i.test(n)) s += 55;
  if (/siri/i.test(n)) s += 40;
  if (/google/i.test(n)) s += 30;
  if (/nanami|keita|o-ren|kyoko|hattori|otoya/i.test(n)) s += 10;
  if (/compact|eloquence|espeak/i.test(n)) s -= 40;
  if (!v.localService) s += 5;
  return s;
}

export function japaneseVoices(): SpeechSynthesisVoice[] {
  if (!webSpeechAvailable()) return [];
  return speechSynthesis
    .getVoices()
    .filter((x) => /^ja/i.test(x.lang) || /japan|日本/i.test(x.name))
    .sort((a, b) => voiceScore(b) - voiceScore(a));
}

export class WebSpeechNarrator implements Narrator {
  readonly kind = 'device' as const;
  private current: SpeechSynthesisUtterance | null = null;
  private done: ((ok: boolean) => void) | null = null;
  private started = 0;
  constructor(public voice: SpeechSynthesisVoice | null) {}
  get label() { return this.voice ? `端末の音声合成（${this.voice.name}）` : '端末の音声合成'; }
  /** Standard device voices sound rushed and flat — slow them slightly; natural voices stay ~1×. */
  private baseRate() { const q = this.voice ? voiceScore(this.voice) : 0; return q >= 40 ? 0.98 : q >= 10 ? 0.93 : 0.9; }
  speak(cue: LectureCue, { rate, volume }: { rate: number; volume: number }, onEnd: (ok: boolean) => void) {
    this.stop();
    if (!cue.speech) { onEnd(true); return; }
    const u = new SpeechSynthesisUtterance(cue.speech);
    u.lang = 'ja-JP';
    if (this.voice) u.voice = this.voice;
    u.rate = Math.max(0.5, Math.min(2, this.baseRate() * rate));
    u.pitch = 1;
    u.volume = volume;
    this.done = onEnd;
    this.current = u;
    const fin = () => {
      if (this.current !== u) return;
      this.current = null;
      // an utterance that "ends" instantly means the engine could not speak it
      const ok = performance.now() - this.started > Math.min(900, cue.dur * 150) || cue.speech.length <= 6;
      const d = this.done; this.done = null; d?.(ok);
    };
    u.onend = fin;
    u.onerror = fin;
    this.started = performance.now();
    speechSynthesis.speak(u);
  }
  stop() {
    const d = this.done;
    this.done = null;
    this.current = null;
    try { if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); } catch { /* ignore */ }
    d?.(false);
  }
  /** Web Speech cannot change volume mid-utterance; it applies from the next sentence. */
  setVolume() {}
  dispose() { this.stop(); }
}

export async function loadAudioManifest(url: string): Promise<AudioManifest | null> {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) return null;
    const m = (await r.json()) as AudioManifest;
    return m && m.cues && Object.keys(m.cues).length ? m : null;
  } catch {
    return null;
  }
}
