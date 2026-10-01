import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { Rich } from '../../components/Rich';
import { Icon } from '../../components/Icon';
import { Timeline } from '../../components/Timeline';
import { cueAt, timeLecture } from '../../engine/lecture/timing';
import type { AudioManifest, Lecture, TimedCue } from '../../engine/lecture/types';
import { AudioFileNarrator, WebSpeechNarrator, japaneseVoices, loadAudioManifest, webSpeechAvailable, type Narrator } from '../../engine/speech/narrator';
import { CL } from '../../engine/svg';
import { useProgress, useStore } from '../../state/hooks';
import { FrameContext, Visual, type FrameFn } from './Visuals';
import { QuizContext, type LectureQuizApi } from './PrepVisuals';
import { LectureReport } from './LectureReport';
import { BoardContext, useBoard } from './Blackboard';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const LSN = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
export const fm2 = (s: number) => { s = Math.max(0, Math.floor(s + 0.001)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

type Overlay = 'start' | 'pause' | 'end' | null;

export function LecturePlayer({ lecture, chapter, startAt }: { lecture: Lecture; chapter: number; startAt?: number }) {
  const course = useCourse();
  const store = useStore();
  const progress = useProgress();
  const { settings } = progress;
  const ch = course.chapters.find((c) => c.id === chapter)!;

  /* ---------- audio source (honest) ---------- */
  const [manifest, setManifest] = useState<AudioManifest | null | undefined>(undefined);
  const [recorded, setRecorded] = useState<AudioFileNarrator | null>(null);
  useEffect(() => {
    let live = true;
    const dir = `${course.assetBase}audio/lecture-${String(chapter).padStart(2, '0')}/`;
    loadAudioManifest(`${dir}manifest.json`).then(async (m) => {
      if (!live) return;
      if (!m || m.version !== lecture.version) { setManifest(null); return; }
      const n = new AudioFileNarrator(m, dir);
      const ok = await n.load();
      if (!live) { n.dispose(); return; }
      if (ok) { setRecorded(n); setManifest(m); } else { n.dispose(); setManifest(null); }
    });
    return () => { live = false; };
  }, [course, chapter, lecture.version]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => japaneseVoices());
  useEffect(() => {
    if (!webSpeechAvailable()) return;
    const f = () => setVoices(japaneseVoices());
    speechSynthesis.addEventListener('voiceschanged', f);
    return () => speechSynthesis.removeEventListener('voiceschanged', f);
  }, []);
  const narrator: Narrator | null = useMemo(() => {
    if (manifest === undefined) return null;
    if (manifest && recorded) return recorded;
    if (webSpeechAvailable()) return new WebSpeechNarrator(voices.find((v) => v.voiceURI === settings.voiceURI) || voices[0] || null);
    return null;
  }, [manifest, recorded, voices, settings.voiceURI]);
  useEffect(() => () => narrator?.dispose(), [narrator]);

  const tl = useMemo(() => timeLecture(lecture, manifest || null), [lecture, manifest]);
  const { shots, cues, total, chapters } = tl;
  const { r: board, version: boardVersion } = useBoard(lecture, tl);
  const hasDigest = useMemo(() => cues.some((c) => c.dig), [cues]);

  /* ---------- UI state ---------- */
  const [cue, setCue] = useState<TimedCue>(cues[0]);
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>('start');
  const [reveal, setReveal] = useState(false);
  const [speed, setSpeed] = useState(settings.lectureSpeed || 1);
  const [subs, setSubs] = useState(settings.subtitles);
  const [narr, setNarr] = useState(settings.narration);
  const [autoPause, setAutoPause] = useState(settings.autoPause);
  const [volume, setVolume] = useState(settings.volume);
  const [note, setNote] = useState('');
  const [theater, setTheater] = useState(false);
  const [digest, setDigest] = useState(false);
  const saved = progress.lectures[chapter];
  const resumeAt = saved && !saved.completed && saved.position > 10 && saved.position < total - 10 ? saved.position : 0;

  /* ---------- playback engine (refs; no per-frame React renders) ---------- */
  const frame = useRef<FrameFn | null>(null);
  const tlApi = useRef<{ set: (f: number) => void } | null>(null);
  const tmRef = useRef<HTMLSpanElement>(null);
  const R = useRef({ T: 0, play: false, last: 0, raf: 0, cue: -1, speaking: false, spoken: '', spEnd: 0, done: new Set<string>(), watched: 0, savedAt: 0 });
  const cfg = useRef({ speed, narr, autoPause, volume, narrator, digest });
  cfg.current = { speed, narr: narr && !!narrator, autoPause, volume, narrator, digest };
  const boardCtx = useMemo(() => (board ? { r: board, T: () => R.current.T, version: boardVersion } : null), [board, boardVersion]);
  /** digest mode: the next "important" cue at or after t (null = none left) */
  const nextDig = useCallback((t: number) => cues.find((c) => c.dig && c.t1 > t + 0.02) || null, [cues]);

  const speak = useCallback((c: TimedCue) => {
    const r = R.current, n = cfg.current.narrator;
    if (!cfg.current.narr || !n || !c.speech) return; // silent cue (thinking time)
    r.speaking = true; r.spoken = c.id;
    const started = performance.now();
    n.speak(c, { rate: cfg.current.speed, volume: cfg.current.volume }, (ok) => {
      if (r.spoken !== c.id) return;
      r.speaking = false; r.spEnd = performance.now();
      // the engine refused instantly → fall back to subtitles, and say so
      if (!ok && performance.now() - started < 400 && r.play && c.speech.length > 6) {
        setNarr(false);
        setNote('この端末では音声を再生できないため、字幕で進行します。');
      }
    });
  }, []);
  const hush = useCallback(() => { const r = R.current; r.speaking = false; r.spoken = ''; cfg.current.narrator?.stop(); }, []);

  const saveProgress = useCallback((force = false) => {
    const r = R.current, now = performance.now();
    if (!force && now - r.savedAt < 5000) return;
    const secs = r.watched; r.watched = 0; r.savedAt = now;
    store.lectureProgress(chapter, r.T, total, secs);
  }, [store, chapter, total]);

  const render = useCallback(() => {
    const r = R.current;
    const c = cueAt(tl, r.T);
    const i = cues.indexOf(c);
    if (i !== r.cue) {
      r.cue = i;
      setCue(c);
      if (r.play && cfg.current.narr) speak(c);
    }
    frame.current?.(r.T);
    tlApi.current?.set(r.T / total);
    if (tmRef.current) tmRef.current.textContent = `${fm2(r.T)} / ${fm2(total)}`;
  }, [tl, cues, total, speak]);

  const pause = useCallback(() => {
    const r = R.current;
    r.play = false; cancelAnimationFrame(r.raf); hush(); setPlaying(false); saveProgress(true);
  }, [hush, saveProgress]);

  const loop = useCallback((ts: number) => {
    const r = R.current;
    if (!r.play) return;
    const dt = r.last ? Math.min(0.1, (ts - r.last) / 1000) : 0;
    r.last = ts;
    const x = cues[Math.max(0, r.cue)] || cues[0];
    const sp = cfg.current.speed;
    let nT = r.T + dt * sp;
    if (cfg.current.narr && r.spoken === x.id) {
      if (r.speaking) nT = Math.min(nT, x.t1 - 0.05);
      else {
        // speech finished early → skip ahead to where the pause begins, then breathe for `gap`
        // (but never hurry the chalk: the board work of this cue plays at normal speed)
        const speechEnd = x.t1 - x.gap;
        const chalkEnd = x.t0 + (x.write || 0);
        if (nT < speechEnd && r.T >= chalkEnd) nT = Math.min(speechEnd, r.T + dt * sp * 5);
        if (nT >= x.t1 - 0.05 && (performance.now() - r.spEnd) / 1000 < x.gap / Math.sqrt(sp)) nT = x.t1 - 0.05;
      }
    }
    if (x.pause && cfg.current.autoPause && !r.done.has(x.id) && nT >= x.t1 - 0.05 && !(cfg.current.narr && r.speaking)) {
      r.T = x.t1 - 0.06; render(); pause(); r.done.add(x.id); setReveal(false); setOverlay('pause'); return;
    }
    if (cfg.current.digest) {
      const c = cueAt(tl, Math.min(total, nT));
      if (!c.dig) {
        const n = nextDig(nT);
        if (!n) nT = total;
        else { hush(); nT = Math.max(nT, n.t0 + 0.001); }
      }
    }
    r.watched += dt;
    r.T = Math.min(total, nT);
    render();
    saveProgress();
    if (r.T >= total) {
      pause();
      store.lectureProgress(chapter, total, total, 0, true);
      setOverlay('end');
      return;
    }
    r.raf = requestAnimationFrame(loop);
  }, [cues, total, render, pause, saveProgress, store, chapter, tl, nextDig, hush]);

  const start = useCallback(() => {
    const r = R.current;
    setOverlay(null);
    if (r.T >= total - 0.01) { r.T = 0; r.done.clear(); r.cue = -1; }
    if (cfg.current.digest && !cueAt(tl, r.T).dig) { const n = nextDig(r.T); if (n) { r.T = n.t0 + 0.001; r.cue = -1; } }
    const c = cueAt(tl, r.T);
    // resuming mid-sentence: restart that sentence so voice and subtitles stay in sync
    if (cfg.current.narr) r.T = Math.max(r.T - 0.001, c.t0 + 0.001);
    r.play = true; r.last = 0; setPlaying(true);
    r.cue = cues.indexOf(c);
    render();
    if (cfg.current.narr) speak(c);
    r.raf = requestAnimationFrame(loop);
  }, [total, tl, cues, render, speak, loop, nextDig]);

  const jump = useCallback((t: number, keep = true) => {
    const r = R.current, was = r.play;
    if (was) { r.play = false; cancelAnimationFrame(r.raf); hush(); }
    setOverlay(null);
    r.T = CL(t / total) * total; r.cue = -1;
    render();
    if (was && keep) start(); else { setPlaying(false); saveProgress(true); }
  }, [total, render, start, hush, saveProgress]);

  // initial frame / resume position
  useEffect(() => {
    R.current.T = startAt !== undefined ? CL(startAt / total) * total : 0; R.current.cue = -1;
    if (startAt !== undefined) setOverlay(null);
    render();
    const r = R.current;
    return () => { r.play = false; cancelAnimationFrame(r.raf); cfg.current.narrator?.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tl, startAt]);

  // a newly mounted visual registers its frame callback after commit: draw it once even while paused
  useEffect(() => { const id = requestAnimationFrame(() => frame.current?.(R.current.T)); return () => cancelAnimationFrame(id); }, [cue]);

  // re-speak on speed change; live volume for recorded audio
  useEffect(() => { const r = R.current; if (r.play && cfg.current.narr) speak(cues[Math.max(0, r.cue)]); }, [speed, speak, cues]);
  useEffect(() => { narrator?.setVolume(volume); }, [volume, narrator]);
  useEffect(() => { if (!narr) hush(); else if (R.current.play) speak(cues[Math.max(0, R.current.cue)]); }, [narr, hush, speak, cues]);

  // pause when scrolled away / tab hidden
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting && R.current.play && !theater) pause(); }));
    if (stageRef.current) io.observe(stageRef.current);
    const vis = () => { if (document.visibilityState === 'hidden' && R.current.play) pause(); };
    document.addEventListener('visibilitychange', vis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [pause, theater]);
  useEffect(() => {
    const ro = new ResizeObserver(() => { if (!R.current.play) frame.current?.(R.current.T); });
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  const toggle = () => (R.current.play ? pause() : start());
  const shotIdx = () => cue.shot;
  const prevScene = () => { const s = shots[shotIdx()]; const i = shots.indexOf(s); jump(R.current.T - s.t0 > 1.5 || i === 0 ? s.t0 + 0.001 : (shots.slice(0, i).reverse().find((x) => x.cues.length)?.t0 ?? 0) + 0.001); };
  const nextScene = () => { const i = shotIdx(); const n = shots.slice(i + 1).find((x) => x.cues.length); jump(n ? n.t0 + 0.001 : total - 0.01); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input,select,textarea') || (t.closest('button') && e.key === ' ')) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); if (R.current.play) pause(); else start(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); jump(R.current.T + 10); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); jump(R.current.T - 10); }
      if (e.key === 'c') setSubs((v) => !v);
      if (e.key === 'm') setNarr((v) => !v);
      if (e.key === 'Escape') setTheater(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [pause, start, jump]);

  /* ---------- in-lecture questions ---------- */
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const quizApi: LectureQuizApi = useMemo(() => ({
    answerOf: (qid) => answers[qid],
    answer: (qid, k) => {
      if (answers[qid] !== undefined) return;
      const q = course.questions.find((x) => x.id === qid);
      if (!q) return;
      setAnswers((a) => ({ ...a, [qid]: k }));
      store.answer(qid, 'single', q.options[k].correct, [k]);
    },
    toExplanation: () => {
      const i = shots.findIndex((s, j) => j > cues[Math.max(0, R.current.cue)].shot && s.visual.kind === 'quiz' && s.visual.phase === 'explain');
      if (i >= 0) jump(shots[i].t0 + 0.001);
    },
  }), [answers, course, store, shots, cues, jump]);

  const shot = shots[cue.shot];
  const v = shot.visual;
  const key = v.kind === 'bb' ? 'bb' : v.kind === 'anim' ? `anim:${v.anim}` : v.kind === 'figure' ? `fig:${v.figure}` : `shot:${cue.shot}`;
  const srcKind = manifest ? 'audio' : narrator ? 'device' : 'none';
  const srcLabel = manifest ? narrator?.label : narrator ? narrator.label : '音声なし（字幕で進行）';
  const P = cue.pause;

  return (
    <div className={'card lecp' + (theater ? ' theater' : '')}>
      <div className="lhd">
        <div><div className="kick">LECTURE {String(chapter).padStart(2, '0')}</div><b>第{chapter}講　{ch.name}</b></div>
        <span className={'voice-src ' + srcKind} title="ナレーションの音源">
          <span className={'lsp' + (playing && narr && srcKind !== 'none' ? ' on' : '')}><i /><i /><i /><i /></span>
          {manifest === undefined ? '音声を読み込み中…' : srcLabel}
        </span>
      </div>

      <div className={'lstage' + (playing ? ' cine' : '') + (shot.visual.kind === 'quiz' ? ' is-quiz' : '')} ref={stageRef}>
        <FrameContext.Provider value={frame}>
          <QuizContext.Provider value={quizApi}>
            <BoardContext.Provider value={boardCtx}>
              <Visual key={key} shot={shot} cue={cue} />
            </BoardContext.Provider>
          </QuizContext.Provider>
        </FrameContext.Provider>
        <div className="lsec" key={'sec' + shot.section}><span>{LSN[shot.section]}</span>{lecture.sections[shot.section]?.name}</div>
        {P && <div className="lpt">{P.tag}</div>}
        {digest && <div className="ldig">重要ポイントだけ再生中</div>}
        {subs && cue.text && (
          <div className={'lsub in'} key={cue.id} aria-live="polite">
            <span className="s"><Rich html={cue.text} />{note && <> <small className="lnote">（{note}）</small></>}</span>
          </div>
        )}
        <div className="lbx t" /><div className="lbx b" />

        {overlay === 'start' && (
          <div className="aov on"><div className="box neutral">
            <div className="kick">LECTURE {String(chapter).padStart(2, '0')}</div>
            <b className="bt">第{chapter}講　{ch.name}</b>
            <p>約{Math.round(total / 60)}分・{chapters.length}パート構成。{manifest === undefined ? '音声を読み込んでいます…' : srcKind === 'audio' ? '収録した自然な音声（ニューラル音声）でナレーションします。' : srcKind === 'device' ? '端末の音声合成でナレーションします（音量を上げてください）。' : 'この端末では音声が使えないため、字幕で進行します。'}</p>
            <div className="bb">
              {resumeAt > 0 && <button className="btn eosin" disabled={manifest === undefined} onClick={() => { R.current.T = resumeAt; R.current.cue = -1; render(); start(); }}>▶ 続きから（{fm2(resumeAt)}）</button>}
              <button className={'btn' + (resumeAt ? '' : ' eosin')} disabled={manifest === undefined} onClick={() => { R.current.T = 0; R.current.cue = -1; start(); }}>{manifest === undefined ? '音声を読み込み中…' : `▶ ${resumeAt ? '最初から' : '授業を始める'}`}</button>
            </div>
          </div></div>
        )}
        {overlay === 'pause' && P && (
          <div className="aov on lpause" role="dialog" aria-label={P.tag}><div className="box warn">
            <div className="kick">{P.tag}</div>
            {P.q ? (
              <>
                <Rich as="b" className="bt" html={P.q} />
                {reveal && <Rich as="p" className="aa1" html={P.a || ''} />}
              </>
            ) : P.list ? (
              <>
                <b className="bt">{P.tag === '試験ポイント' ? 'ここが狙われる' : 'ここを覚える'}</b>
                <ul>{P.list.map((x, i) => <Rich as="li" key={i} html={x} />)}</ul>
              </>
            ) : <Rich as="p" html={P.html || ''} />}
            <div className="bb">
              {P.q && !reveal && <button className="btn" onClick={() => setReveal(true)}>答えを見る</button>}
              <button className="btn eosin" onClick={() => { R.current.T = cue.t1 + 0.001; R.current.cue = -1; setOverlay(null); start(); }}>続ける ▶</button>
            </div>
          </div></div>
        )}
        {overlay === 'end' && (
          <div className="aov on lend"><div className="box">
            <div className="kick">END OF LECTURE</div>
            <b className="bt">第{chapter}講はここまでです</b>
            <LectureReport lecture={lecture} chapter={chapter} answers={answers} sectionStart={(i) => chapters.find((c) => c.index === i)?.t0 ?? 0} onJump={(t) => jump(t + 0.001)} />
            <div className="bb">
              <Link className="btn eosin" to={`/quiz/play?chapter=${chapter}`}>この章の5択問題へ ▶</Link>
              <button className="btn" onClick={() => { R.current.T = 0; R.current.done.clear(); R.current.cue = -1; start(); }}>↻ もう一度見る</button>
              {chapter < course.chapters.length && <Link className="btn" to={`/lecture/${chapter + 1}`}>第{chapter + 1}講へ</Link>}
            </div>
          </div></div>
        )}
      </div>

      <div className="lctl">
        <Timeline total={total} ticks={chapters.slice(1).map((c) => ({ at: c.t0 / total, label: c.name }))} onSeek={(f) => jump(f * total)} bind={(api) => { tlApi.current = api; }} label="授業の再生位置" />
        <div className="arow">
          <button onClick={() => { R.current.done.clear(); jump(0); }} aria-label="最初から"><Icon name="replay" /></button>
          <button onClick={prevScene} aria-label="前の場面"><Icon name="prev" /></button>
          <button onClick={() => jump(R.current.T - 10)} aria-label="10秒戻る"><Icon name="rew" /><span className="en" style={{ fontSize: 13 }}>10</span></button>
          <button className="pl2" onClick={toggle} aria-label={playing ? '一時停止' : '再生'}><Icon name={playing ? 'pause' : 'play'} /> {playing ? '一時停止' : '再生'}</button>
          <button onClick={() => jump(R.current.T + 10)} aria-label="10秒進む"><span className="en" style={{ fontSize: 13 }}>10</span><Icon name="fwd" /></button>
          <button onClick={nextScene} aria-label="次の場面"><Icon name="next" /></button>
          <button onClick={() => setTheater((t) => !t)} aria-label={theater ? '通常表示' : '大きく表示'} aria-pressed={theater}><Icon name="full" /></button>
          <span className="tm" ref={tmRef}>00:00 / {fm2(total)}</span>
        </div>
        <div className="arow">
          <span className="spd" role="group" aria-label="再生速度">
            {SPEEDS.map((s) => <button key={s} className={s === speed ? 'on' : ''} aria-pressed={s === speed} onClick={() => { setSpeed(s); store.setSettings({ lectureSpeed: s }); }}>{s}×</button>)}
          </span>
          <button className={'fct' + (subs ? ' on' : '')} aria-pressed={subs} onClick={() => { setSubs(!subs); store.setSettings({ subtitles: !subs }); }}><Icon name="cc" /> 字幕</button>
          <button className={'fct' + (narr && narrator ? ' on' : '')} aria-pressed={narr && !!narrator} disabled={!narrator} onClick={() => { setNote(''); setNarr(!narr); store.setSettings({ narration: !narr }); }}><Icon name={narr && narrator ? 'vol' : 'mute'} /> 音声</button>
          <label className="vol" title={srcKind === 'device' ? '端末の音声合成では、次の文から音量が反映されます' : '音量'}>
            <span className="visually-hidden">音量</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} disabled={!narrator} onChange={(e) => { const x = Number(e.target.value); setVolume(x); store.setSettings({ volume: x }); }} aria-label="音量" />
          </label>
          <button className={'fct' + (autoPause ? ' on' : '')} aria-pressed={autoPause} onClick={() => { setAutoPause(!autoPause); store.setSettings({ autoPause: !autoPause }); }}>自動一時停止</button>
          {hasDigest && <button className={'fct' + (digest ? ' on' : '')} aria-pressed={digest} onClick={() => setDigest(!digest)}>重要ポイントだけ</button>}
          {board && <Link className="fct" to={`/lecture/${chapter}/board`}>板書だけを見る</Link>}
          {board && <Link className="fct" to={`/review5/${chapter}`}>5分復習</Link>}
        </div>
        {srcKind === 'device' && voices.length > 1 && (
          <div className="lvrow">
            <label htmlFor="lv">声</label>
            <select id="lv" className="sel" value={settings.voiceURI ?? ''} onChange={(e) => store.setSettings({ voiceURI: e.target.value || null })}>
              <option value="">自動（いちばん自然な声）</option>
              {voices.map((x) => <option key={x.voiceURI} value={x.voiceURI}>{x.name}</option>)}
            </select>
            <Link to="/settings" className="muted">自然な声の追加方法 →</Link>
          </div>
        )}
      </div>

      <div className="lextra">
        <div className="ltoc" role="group" aria-label="授業のチャプター">
          {chapters.map((c) => (
            <button key={c.index} className={shot.section === c.index ? 'on' : ''} onClick={() => jump(c.t0 + 0.001)}>
              <span className="en">{fm2(c.t0)}</span><b>{LSN[c.index]} {c.name}</b>
            </button>
          ))}
        </div>
        <details className="lscr">
          <summary>講義台本（ナレーション全文・{cues.length}文・タイムスタンプ付き）</summary>
          <div className="lsl2">
            {chapters.map((c) => (
              <div key={c.index}>
                <h4>{LSN[c.index]} {c.name}</h4>
                {cues.filter((q) => shots[q.shot].section === c.index).map((q) => (
                  <button key={q.id} className={q.id === cue.id ? 'on' : ''} onClick={() => jump(q.t0 + 0.001)}>
                    <span className="en">{fm2(q.t0)}</span><Rich html={q.text} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </details>
        <p className="lvh">
          {srcKind === 'audio' && 'ニューラル音声合成（Microsoft Nanami）で事前に収録した講義音声を再生しています。'}
          {srcKind === 'device' && '音声はこの端末の音声合成で生成しています（収録音声ではありません）。声の質は端末にインストールされている日本語音声によって変わります。'}
          {srcKind === 'none' && 'この環境では音声を再生できません。台本・字幕・タイムスタンプで授業が進行します。'}
          　キーボード：スペース 再生／停止・←→ 10秒・C 字幕・M 音声
        </p>
      </div>
    </div>
  );
}
