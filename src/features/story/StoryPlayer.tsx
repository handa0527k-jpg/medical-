import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bindCtx, CL, g, H, W } from '../../engine/story/kit';
import { buildTimeline, lineAt, sceneAt, subAt } from '../../engine/story/timeline';
import type { StoryModule } from '../../engine/story/types';
import { fmtT } from '../../engine/svg';
import { useStore } from '../../state/hooks';

/** progress key in the store's animation stats */
export const STORY_KEY = 'story';

/**
 * Canvas player for a story anime: picture and voice lines share one clock.
 * While a line is speaking the picture follows the audio clock, so they never drift apart.
 */
export default function StoryPlayer({ story, assetBase, startAt }: { story: StoryModule; assetBase: string; startAt?: number }) {
  const { def, draw } = story;
  const store = useStore();
  const tl = useMemo(() => buildTimeline(def.lines), [def]);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const audios = useRef<Map<number, HTMLAudioElement>>(new Map());
  // all voices of a story are one MP3; each line plays its own byte range of it
  const buf = useRef<ArrayBuffer | null>(null);
  const bufP = useRef<Promise<ArrayBuffer | null> | null>(null);
  const [loading, setLoading] = useState(false);
  const st = useRef({ now: 0, playing: false, lastTs: 0, cur: -1, sound: true, audioOk: true, started: 0 });
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [subs, setSubs] = useState(true);
  const [sound, setSound] = useState(true);
  const [fs, setFs] = useState(false);
  const [ui, setUi] = useState({ now: 0, scene: def.scenes[0].id, line: -1 });

  const audioFor = useCallback((i: number) => {
    let a = audios.current.get(i);
    if (!a && buf.current) {
      const [start, len] = tl.lines[i].bytes;
      a = new Audio(URL.createObjectURL(new Blob([buf.current.slice(start, start + len)], { type: 'audio/mpeg' })));
      a.preload = 'auto'; audios.current.set(i, a);
    }
    return a;
  }, [tl]);
  const loadVoices = useCallback(() => {
    bufP.current ??= fetch(`${assetBase}story/story.mp3?v=${def.audio}`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (buf.current = b))
      .catch(() => null);
    return bufP.current;
  }, [assetBase, def]);

  const render = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    bindCtx(ctx);
    const s = st.current;
    const sc = sceneAt(tl, def.scenes, s.now);
    const t = s.now - tl.start[sc.id];
    g.save();
    try { draw[sc.id]?.(t, tl.end[sc.id] - tl.start[sc.id]); } catch (e) { console.error(e); }
    g.restore();
    const fade = 1 - Math.min(CL(t / 0.8), CL((tl.end[sc.id] - s.now) / 0.8));
    if (fade > 0) { g.fillStyle = `rgba(10,14,12,${fade})`; g.fillRect(0, 0, W, H); }
    setUi((u) => {
      const line = lineAt(tl, s.now);
      return Math.abs(u.now - s.now) < 0.2 && u.scene === sc.id && u.line === line ? u : { now: s.now, scene: sc.id, line };
    });
  }, [def, draw, tl]);

  const stopAudio = () => audios.current.forEach((a) => a.pause());
  const speak = useCallback((i: number) => {
    const s = st.current; stopAudio();
    if (!s.sound || !s.audioOk || i < 0) return;
    const a = audioFor(i);
    if (!a) return;
    a.currentTime = Math.max(0, s.now - tl.lines[i].t0);
    a.play().catch(() => { s.audioOk = false; });
    if (i + 1 < tl.lines.length) audioFor(i + 1);
  }, [audioFor, tl]);

  const record = useCallback((done = false) => {
    const s = st.current;
    if (s.started) store.animationProgress(STORY_KEY, s.now / tl.total, { seconds: (performance.now() - s.started) / 1000, completed: done });
    s.started = 0;
  }, [store, tl]);

  const pause = useCallback(() => {
    const s = st.current; if (!s.playing) return;
    s.playing = false; stopAudio(); setPlaying(false); record();
  }, [record]);

  const frame = useCallback((ts: number) => {
    const s = st.current; if (!s.playing) return;
    const dt = s.lastTs ? Math.min(0.1, (ts - s.lastTs) / 1000) : 0; s.lastTs = ts;
    const li = lineAt(tl, s.now);
    const a = li >= 0 ? audios.current.get(li) : undefined;
    if (a && s.sound && s.audioOk && !a.paused) s.now = tl.lines[li].t0 + a.currentTime; else s.now += dt;
    const ni = lineAt(tl, s.now);
    if (ni !== s.cur) { s.cur = ni; if (ni >= 0) speak(ni); }
    if (s.now >= tl.total) {
      s.now = tl.total - 0.001; s.playing = false; stopAudio(); setPlaying(false); record(true); render(); return;
    }
    render();
    requestAnimationFrame(frame);
  }, [render, speak, tl, record]);

  const play = useCallback(async () => {
    const s = st.current; if (s.playing) return;
    if (!buf.current && s.sound) { setLoading(true); await loadVoices(); setLoading(false); if (s.playing) return; }
    if (s.now >= tl.total - 0.05) s.now = 0;
    if (s.now < 0.05) store.animationProgress(STORY_KEY, 0, { play: true });
    s.playing = true; s.lastTs = 0; s.started = performance.now(); s.cur = lineAt(tl, s.now);
    setPlaying(true); setStarted(true);
    if (s.cur >= 0) speak(s.cur);
    requestAnimationFrame(frame);
  }, [frame, speak, store, tl]);

  const seek = useCallback((t: number) => {
    const s = st.current; const was = s.playing;
    if (was) { s.playing = false; stopAudio(); }
    s.now = Math.max(0, Math.min(tl.total - 0.01, t)); s.cur = -1; render();
    if (was) { s.playing = true; s.lastTs = 0; requestAnimationFrame(frame); }
  }, [frame, render, tl]);

  // poster frame, and redraw once the handwriting font has arrived
  useEffect(() => {
    const s = st.current;
    const [pid, pt] = def.poster || [def.scenes[0].id, 3];
    const show = () => {
      // a requested position is shown and playback continues from it; otherwise a poster frame, then 0
      if (startAt != null) { if (!s.playing) { s.now = Math.max(0, Math.min(tl.total - 0.01, startAt)); render(); } return; }
      if (s.playing || s.now > 0) return render();
      s.now = (tl.start[pid] ?? 0) + pt; render(); s.now = 0; setUi((u) => ({ ...u, now: 0 }));
    };
    show();
    document.fonts?.ready.then(show).catch(() => {});
    const map = audios.current;
    loadVoices();
    return () => { s.playing = false; map.forEach((a) => { a.pause(); URL.revokeObjectURL(a.src); a.src = ''; }); map.clear(); };
  }, [def, render, tl, loadVoices, startAt]);

  useEffect(() => () => record(), [record]);

  // fullscreen: browser fullscreen when available, CSS fullscreen always
  const toggleFs = useCallback(() => {
    const on = !fs; setFs(on);
    if (on) boxRef.current?.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [fs]);
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setFs(false); };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') setFs(false);
      else if (e.key === ' ') { e.preventDefault(); (st.current.playing ? pause : play)(); }
      else if (e.key === 'ArrowRight') seek(st.current.now + 10);
      else if (e.key === 'ArrowLeft') seek(st.current.now - 10);
      else if (e.key === 'f') toggleFs();
    };
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('fullscreenchange', onFs); window.removeEventListener('keydown', onKey); };
  }, [pause, play, seek, toggleFs]);
  useEffect(() => {
    document.body.classList.toggle('lec-fs', fs);
    return () => document.body.classList.remove('lec-fs');
  }, [fs]);

  const line = ui.line >= 0 ? tl.lines[ui.line] : null;
  const pct = (ui.now / tl.total) * 100;
  return (
    <div className={`story-player${fs ? ' fs' : ''}`} ref={boxRef}>
      <div className="story-screen">
        <canvas ref={cvRef} width={W} height={H} aria-label={`アニメ「${def.title}」`} onClick={() => (playing ? pause() : play())} />
        {subs && line && (
          <div className="story-sub" aria-live="polite"><span>{line.who !== 'N' && <b>{line.who}</b>}{def.subChunks ? subAt(line.text, line.t0, line.t1, ui.now) : line.text}</span></div>
        )}
        {!started && (
          <div className="story-start"><button type="button" onClick={play} disabled={loading}>{loading ? '音声を読み込み中…' : '▶ 上映をはじめる'}</button></div>
        )}
      </div>
      <div className="story-ctl">
        <button type="button" className="pri" onClick={() => (playing ? pause() : play())} disabled={loading}>{loading ? '読み込み中…' : playing ? '❚❚ 一時停止' : '▶ 再生'}</button>
        <button type="button" onClick={() => seek(ui.now - 10)} aria-label="10秒戻る">−10秒</button>
        <button type="button" onClick={() => seek(ui.now + 10)} aria-label="10秒進む">＋10秒</button>
        <div
          className="story-bar" role="slider" tabIndex={0} aria-label="再生位置" aria-valuemin={0} aria-valuemax={Math.round(tl.total)} aria-valuenow={Math.round(ui.now)}
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * tl.total); }}
        >
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="story-tm">{fmtT(ui.now)} / {fmtT(tl.total)}</span>
        <button type="button" aria-pressed={subs} onClick={() => setSubs(!subs)}>字幕</button>
        <button
          type="button" aria-pressed={sound}
          onClick={() => { const v = !sound; setSound(v); st.current.sound = v; st.current.audioOk = true; if (!v) stopAudio(); else if (st.current.playing && st.current.cur >= 0) speak(st.current.cur); }}
        >音声</button>
        <button type="button" onClick={toggleFs}>{fs ? '全画面を終了' : '全画面'}</button>
      </div>
      <div className="story-chips">
        {def.scenes.map((s, i) => (
          <button type="button" key={s.id} className={ui.scene === s.id ? 'on' : ''} onClick={() => { seek(tl.start[s.id] + 0.01); if (!st.current.playing) play(); }}>
            {i + 1} {s.title}
          </button>
        ))}
      </div>
    </div>
  );
}
