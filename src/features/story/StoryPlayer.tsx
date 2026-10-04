import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bindCtx, CL, g, H, W } from '../../engine/story/kit';
import { buildTimeline, lineAt, sceneAt, subAt } from '../../engine/story/timeline';
import type { StoryModule } from '../../engine/story/types';
import { fmtT } from '../../engine/svg';
import { useProgress, useStore } from '../../state/hooks';
import { useWakeLock } from '../../app/useWakeLock';

/** progress key in the store's animation stats */
export const STORY_KEY = 'story';
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
/** the learner's music setting for story anime (on/off and volume), shared by all stories */
const BGM_KEY = 'medstudy:story-bgm';

/**
 * Canvas player for a story anime: picture and voice lines share one clock.
 * While a line is speaking the picture follows the audio clock, so they never drift apart.
 */
export default function StoryPlayer({ story, assetBase, startAt }: { story: StoryModule; assetBase: string; startAt?: number }) {
  const { def, draw } = story;
  const store = useStore();
  const { settings } = useProgress();
  const tl = useMemo(() => buildTimeline(def.lines), [def]);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const audios = useRef<Map<number, HTMLAudioElement>>(new Map());
  // all voices of a story are one MP3; each line plays its own byte range of it
  const buf = useRef<ArrayBuffer | null>(null);
  const bufP = useRef<Promise<ArrayBuffer | null> | null>(null);
  const [loading, setLoading] = useState(false);
  const st = useRef({ now: 0, playing: false, lastTs: 0, cur: -1, sound: true, audioOk: true, started: 0, speed: settings.animSpeed || 1, vol: settings.volume ?? 1 });
  const [playing, setPlaying] = useState(false);
  // keep the screen on while playing
  useWakeLock(playing);
  const [started, setStarted] = useState(false);
  const [subs, setSubsState] = useState(settings.subtitles);
  const subsRef = useRef(subs); subsRef.current = subs;
  const setSubs = (v: boolean) => { setSubsState(v); store.setSettings({ subtitles: v }); };
  const [speed, setSpeedState] = useState(settings.animSpeed || 1);
  const [vol, setVolState] = useState(settings.volume ?? 1);
  const [sound, setSound] = useState(true);
  const [fs, setFs] = useState(false);
  const [ui, setUi] = useState({ now: 0, scene: def.scenes[0].id, line: -1 });
  // the sound bed (effects, ambience — and music when it is not a track of its own) and the music track follow the
  // film clock; voices stay line by line. The learner can switch the music off and set its volume (remembered).
  const tracks = useRef<{ bed?: HTMLAudioElement; music?: HTMLAudioElement }>({});
  const [bgm, setBgm] = useState<{ on: boolean; vol: number }>(() => { try { return { on: true, vol: 1, ...JSON.parse(localStorage.getItem(BGM_KEY) || '{}') }; } catch { return { on: true, vol: 1 }; } });
  const bgmRef = useRef(bgm);
  const bedFor = useCallback(() => {
    const mk = (file: string, vol: number) => { const a = new Audio(`${assetBase}story/${file}`); a.preload = 'auto'; a.volume = vol; return a; };
    if (def.bed && !tracks.current.bed) tracks.current.bed = mk(def.bed, def.bedVolume ?? 0.6);
    if (def.music && !tracks.current.music) tracks.current.music = mk(def.music, CL((def.musicVolume ?? 0.6) * bgmRef.current.vol));
  }, [assetBase, def]);
  const syncBed = useCallback((force = false) => {
    const s = st.current;
    for (const [k, b] of Object.entries(tracks.current) as [string, HTMLAudioElement | undefined][]) {
      if (!b) continue;
      const on = s.playing && s.sound && (k !== 'music' || bgmRef.current.on);
      if (!on) { if (!b.paused) b.pause(); continue; }
      if (force || Math.abs(b.currentTime - s.now) > 0.3) { try { b.currentTime = s.now; } catch { /* not seekable yet */ } }
      if (b.playbackRate !== s.speed) b.playbackRate = s.speed;
      if (b.paused) b.play().catch(() => {});
    }
  }, []);
  const setMusic = useCallback((v: { on: boolean; vol: number }) => {
    bgmRef.current = v; setBgm(v);
    try { localStorage.setItem(BGM_KEY, JSON.stringify(v)); } catch { /* private mode */ }
    const m = tracks.current.music; if (m) m.volume = CL((def.musicVolume ?? 0.6) * v.vol);
    syncBed(true);
  }, [def, syncBed]);

  const setSpeed = useCallback((v: number) => {
    st.current.speed = v; setSpeedState(v); store.setSettings({ animSpeed: v });
    audios.current.forEach((x) => { x.playbackRate = v; });
    Object.values(tracks.current).forEach((b) => { if (b) b.playbackRate = v; });
  }, [store]);
  const setVol = useCallback((v: number) => {
    st.current.vol = v; setVolState(v); store.setSettings({ volume: v });
    audios.current.forEach((x) => { x.volume = v; });
  }, [store]);

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
    a.playbackRate = s.speed; a.volume = s.vol;
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
    s.playing = false; stopAudio(); syncBed(); setPlaying(false); record();
  }, [record, syncBed]);

  const frame = useCallback((ts: number) => {
    const s = st.current; if (!s.playing) return;
    const dt = s.lastTs ? Math.min(0.1, (ts - s.lastTs) / 1000) : 0; s.lastTs = ts;
    const li = lineAt(tl, s.now);
    const a = li >= 0 ? audios.current.get(li) : undefined;
    if (a && s.sound && s.audioOk && !a.paused) s.now = tl.lines[li].t0 + a.currentTime; else s.now += dt * s.speed;
    const ni = lineAt(tl, s.now);
    if (ni !== s.cur) { s.cur = ni; if (ni >= 0) speak(ni); }
    if (s.now >= tl.total) {
      s.now = tl.total - 0.001; s.playing = false; stopAudio(); syncBed(); setPlaying(false); record(true); render(); return;
    }
    syncBed();
    render();
    requestAnimationFrame(frame);
  }, [render, speak, tl, record, syncBed]);

  const play = useCallback(async () => {
    const s = st.current; if (s.playing) return;
    if (!buf.current && s.sound) { setLoading(true); await loadVoices(); setLoading(false); if (s.playing) return; }
    if (s.now >= tl.total - 0.05) s.now = 0;
    if (s.now < 0.05) store.animationProgress(STORY_KEY, 0, { play: true });
    s.playing = true; s.lastTs = 0; s.started = performance.now(); s.cur = lineAt(tl, s.now);
    setPlaying(true); setStarted(true);
    if (s.cur >= 0) speak(s.cur);
    bedFor(); syncBed(true);
    requestAnimationFrame(frame);
  }, [frame, speak, store, tl, bedFor, syncBed]);

  const seek = useCallback((t: number) => {
    const s = st.current; const was = s.playing;
    if (was) { s.playing = false; stopAudio(); }
    s.now = Math.max(0, Math.min(tl.total - 0.01, t)); s.cur = -1; render();
    if (was) { s.playing = true; s.lastTs = 0; syncBed(true); requestAnimationFrame(frame); } else syncBed();
  }, [frame, render, tl, syncBed]);

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
    return () => { s.playing = false; map.forEach((a) => { a.pause(); URL.revokeObjectURL(a.src); a.src = ''; }); map.clear(); Object.values(tracks.current).forEach((b) => { if (b) { b.pause(); b.src = ''; } }); tracks.current = {}; };
  }, [def, render, tl, loadVoices, startAt]);

  useEffect(() => () => record(), [record]);

  // fullscreen: browser fullscreen when available, CSS fullscreen always
  const toggleSound = useCallback(() => {
    const v = !st.current.sound; setSound(v); st.current.sound = v; st.current.audioOk = true;
    if (!v) stopAudio(); else if (st.current.playing && st.current.cur >= 0) speak(st.current.cur);
    syncBed(true);
  }, [speak, syncBed]);
  // previous / next scene
  const sceneJump = useCallback((d: number) => {
    const s = st.current, ids = def.scenes.map((x) => x.id), cur = sceneAt(tl, def.scenes, s.now).id;
    let i = ids.indexOf(cur);
    if (d < 0 && s.now - tl.start[cur] > 3) i += 1; // first press goes back to the start of this scene
    const to = ids[Math.max(0, Math.min(ids.length - 1, i + d))];
    seek(tl.start[to] + 0.01);
  }, [def, tl, seek]);
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
      else if (e.key === 'k') { e.preventDefault(); (st.current.playing ? pause : play)(); }
      else if (e.key === 'c') setSubs(!subsRef.current);
      else if (e.key === 'm') toggleSound();
      else if (e.key === '>' || e.key === '.') { const i = SPEEDS.indexOf(st.current.speed); if (i < SPEEDS.length - 1) setSpeed(SPEEDS[i + 1]); }
      else if (e.key === '<' || e.key === ',') { const i = SPEEDS.indexOf(st.current.speed); if (i > 0) setSpeed(SPEEDS[i - 1]); }
    };
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('fullscreenchange', onFs); window.removeEventListener('keydown', onKey); };
  }, [pause, play, seek, toggleFs, toggleSound, setSpeed]);
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
        <button type="button" onClick={() => sceneJump(-1)} aria-label="前の場面" title="前の場面">⏮</button>
        <button type="button" onClick={() => seek(ui.now - 10)} aria-label="10秒戻る" title="10秒戻る（←）">−10秒</button>
        <button type="button" onClick={() => seek(ui.now + 10)} aria-label="10秒進む" title="10秒進む（→）">＋10秒</button>
        <button type="button" onClick={() => sceneJump(1)} aria-label="次の場面" title="次の場面">⏭</button>
        <div
          className="story-bar" role="slider" tabIndex={0} aria-label="再生位置" aria-valuemin={0} aria-valuemax={Math.round(tl.total)} aria-valuenow={Math.round(ui.now)}
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * tl.total); }}
        >
          <i style={{ width: `${pct}%` }} />
        </div>
        <span className="story-tm">{fmtT(ui.now)} / {fmtT(tl.total)}</span>
        <span className="story-spd" role="radiogroup" aria-label="再生速度">
          {SPEEDS.map((x) => <button type="button" key={x} className={x === speed ? 'on' : ''} role="radio" aria-checked={x === speed} onClick={() => setSpeed(x)}>{x}×</button>)}
        </span>
        <button type="button" aria-pressed={subs} onClick={() => setSubs(!subs)} title="字幕（C）">字幕</button>
        <button
          type="button" aria-pressed={sound}
          onClick={toggleSound} title="音声（M）"
        >音声</button>
        <input className="story-vol" type="range" min={0} max={1} step={0.05} value={vol} aria-label="声の音量" disabled={!sound} onChange={(e) => setVol(Number(e.target.value))} />
        {def.music && (
          <span className="story-bgm">
            <button type="button" aria-pressed={bgm.on} onClick={() => setMusic({ ...bgm, on: !bgm.on })}>BGM</button>
            <input type="range" min={0} max={1} step={0.05} value={bgm.vol} aria-label="BGMの音量" disabled={!bgm.on} onChange={(e) => setMusic({ ...bgm, vol: Number(e.target.value) })} />
          </span>
        )}
        <button type="button" onClick={toggleFs} title="全画面（F）">{fs ? '全画面を終了' : '全画面'}</button>
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
