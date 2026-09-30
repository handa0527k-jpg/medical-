import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { Rich } from '../../components/Rich';
import { Icon } from '../../components/Icon';
import { SourceChips } from '../../components/Slide';
import { AnimationStage, stepAt, timeScript, type TimedStep } from '../../engine/animation/stage';
import { CL, fmtT } from '../../engine/svg';
import { useStore } from '../../state/hooks';
import { Timeline } from '../../components/Timeline';
import { FiveChoice } from '../quiz/FiveChoice';

const SPEEDS = [0.5, 1, 1.5, 2];
const pad = (n: number) => String(n).padStart(2, '0');

type Overlay = 'start' | 'ask' | 'end' | null;

/** Scripted mechanism animation with full playback controls. */
export default function AnimationPlayer({ id, compact }: { id: string; compact?: boolean }) {
  const course = useCourse();
  const store = useStore();
  const A = course.animations[id];
  const { steps, groups, total } = useMemo(() => timeScript(A.script), [A]);
  const reduced = useMemo(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<Record<string, HTMLDivElement | null>>({});
  const tlRef = useRef<{ set: (f: number) => void } | null>(null);
  const tmRef = useRef<HTMLSpanElement>(null);

  const [cur, setCur] = useState<TimedStep>(steps[0]);
  const [playing, setPlaying] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>('start');
  const [reveal, setReveal] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fac, setFac] = useState(true);
  const [quiz, setQuiz] = useState(false);

  // mutable playback state lives in a ref so the rAF loop never re-renders React
  const P = useRef({ T: 0, play: false, last: 0, raf: 0, speed: 1, cur: -1, asked: new Set<number>(), stage: null as AnimationStage | null, started: 0 });

  const fx = useCallback((s: TimedStep) => {
    if (reduced) return;
    (s.fx || []).forEach((f) => {
      const el = f === 'shake' ? camRef.current : fxRef.current[f];
      if (!el) return;
      const cls = f === 'shake' ? 'shake' : 'go';
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    });
  }, [reduced]);

  const render = useCallback(() => {
    const p = P.current, st = p.stage;
    if (!st) return;
    const s = stepAt(steps, p.T), prog = CL((p.T - s.s0) / s.d);
    if (s.i !== p.cur) {
      p.cur = s.i;
      setCur(s);
      if (capRef.current) { capRef.current.classList.remove('in'); void capRef.current.offsetWidth; capRef.current.classList.add('in'); }
      if (p.play) fx(s);
    }
    st.draw(s, prog, performance.now() / 1000);
    if (hudRef.current) {
      hudRef.current.style.opacity = st.hud.visible ? '1' : '0';
      hudRef.current.querySelector('b')!.textContent = st.hud.value;
      hudRef.current.querySelector('small')!.textContent = st.hud.label;
    }
    tlRef.current?.set(p.T / total);
    if (tmRef.current) tmRef.current.textContent = `${fmtT(p.T)} / ${fmtT(total)}`;
  }, [steps, total, fx]);

  const pause = useCallback(() => {
    const p = P.current;
    if (p.play && p.started) { store.animationProgress(id, p.T / total, { seconds: (performance.now() - p.started) / 1000 }); p.started = 0; }
    p.play = false; cancelAnimationFrame(p.raf); setPlaying(false);
  }, [id, store, total]);

  const loop = useCallback((ts: number) => {
    const p = P.current;
    if (!p.play) return;
    const dt = p.last ? Math.min(0.1, (ts - p.last) / 1000) : 0;
    p.last = ts;
    const s = stepAt(steps, p.T), nT = p.T + dt * p.speed;
    if (s.ask && !p.asked.has(s.i) && nT >= s.s1) {
      p.T = s.s1 - 1e-3; render(); pause(); setReveal(false); setOverlay('ask'); return;
    }
    p.T = Math.min(total, nT);
    render();
    if (p.T >= total) { pause(); store.animationProgress(id, 1, { completed: true }); setOverlay('end'); return; }
    p.raf = requestAnimationFrame(loop);
  }, [steps, total, render, pause, id, store]);

  const start = useCallback(() => {
    const p = P.current;
    setOverlay(null); setQuiz(false);
    if (p.T >= total) { p.T = 0; p.asked.clear(); p.cur = -1; }
    if (p.T < 0.05) store.animationProgress(id, 0, { play: true });
    p.play = true; p.last = 0; p.started = performance.now(); setPlaying(true);
    const s = stepAt(steps, p.T);
    if (Math.abs(p.T - s.s0) < 0.05) fx(s);
    p.raf = requestAnimationFrame(loop);
  }, [total, steps, fx, loop, id, store]);

  const jump = useCallback((t: number, keep = true) => {
    const p = P.current, was = p.play;
    pause(); setOverlay(null);
    p.T = CL(t / total) * total; p.cur = -1; render();
    if (was && keep) start();
  }, [pause, render, start, total]);

  // mount the imperative stage
  useEffect(() => {
    const host = stageRef.current!;
    P.current.stage = new AnimationStage(host, A.def, A.script, course.macroSvg(), A.meta.modes);
    P.current.T = 0; P.current.cur = -1;
    render();
    const ro = new ResizeObserver(() => { if (!P.current.play) render(); });
    ro.observe(host);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting && P.current.play) pause(); }));
    io.observe(host);
    const p = P.current;
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(p.raf); p.play = false; p.stage = null; host.innerHTML = ''; };
  }, [A, course, render, pause]);

  useEffect(() => { P.current.speed = speed; }, [speed]);

  const toggle = () => (P.current.play ? pause() : start());
  const prev = () => { const s = stepAt(steps, P.current.T); jump(P.current.T - s.s0 > 1 || s.i === 0 ? s.s0 : steps[s.i - 1].s0); };
  const next = () => { const s = stepAt(steps, P.current.T); jump(s.i < steps.length - 1 ? steps[s.i + 1].s0 : total - 1e-3); };
  const restart = () => { pause(); P.current.T = 0; P.current.asked.clear(); P.current.cur = -1; render(); start(); };
  const keyOnly = () => { const g = groups.find((x) => x.name === 'REPLAY') || groups.find((x) => x.name === 'EXAM POINT'); if (g) { setOverlay(null); jump(steps[g.first].s0, false); start(); hostRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); } };
  const cont = () => { const i = cur.i; P.current.asked.add(i); P.current.T = steps[i].s1; setOverlay(null); render(); start(); };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('button,input,select')) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); jump(P.current.T + 5); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); jump(P.current.T - 5); }
  };

  const exam = cur.g === 'EXAM POINT';
  const ticks = groups.slice(1).map((g) => ({ at: steps[g.first].s0 / total, label: g.name }));

  return (
    <div className="card anim" ref={hostRef} tabIndex={-1} onKeyDown={onKey}>
      <div className="anim-h">
        <div className="kick">{A.meta.en}</div>
        <div className="anim-t">{A.meta.title}<span className="muted">　約{fmtT(total)}・全{groups.length}章</span></div>
      </div>
      <div className={'astage' + (playing ? ' cine' : '')}>
        <div className="acam" ref={camRef}><div className="stage-host" ref={stageRef} /></div>
        <div className="vig" />
        <div className="dimov" style={{ opacity: cur.dim || 0 }} />
        <div className="zfx" ref={(e) => { fxRef.current.zoom = e; }} />
        <div className="lbx t" /><div className="lbx b" />
        <div className="ttl" ref={(e) => { fxRef.current.ttl = e; }}><span>{A.meta.en}</span><b>{A.meta.title}</b></div>
        {cur.badge && <div className={'abadge on' + (cur.slow ? ' slow' : '')}>{cur.badge}</div>}
        <div className="hud" ref={hudRef}><small /><b /></div>
        <div className="cap" ref={capRef} style={{ visibility: exam ? 'hidden' : undefined }}>
          <small>[{pad(cur.gn)}] {cur.g}</small>
          <Rich as="span" html={cur.t} />
        </div>
        <div className={'xpov' + (exam ? ' on' : '')}><span>EXAM POINT</span><Rich as="b" html={cur.t} /></div>
        <div className="flashov" ref={(e) => { fxRef.current.flash = e; }} />

        {overlay === 'start' && (
          <div className="aov on"><div className="box neutral">
            <div className="kick">{A.meta.en}</div>
            <b className="bt">{A.meta.title}</b>
            <p>主人公：<Rich html={A.script.hero} /><br />全{groups.length}章・約{fmtT(total)}　ステップごとに止めて進められます</p>
            <div className="bb"><button className="btn eosin" onClick={start}>▶ 再生する</button></div>
          </div></div>
        )}
        {overlay === 'ask' && cur.ask && (
          <div className="aov on" role="dialog" aria-label="チェックポイント"><div className="box">
            <div className="kick">CHECK POINT</div>
            <b className="bt">ここで何が起こった？</b>
            <Rich as="p" html={cur.ask[0]} />
            {reveal && <Rich as="p" className="aa1" html={cur.ask[1]} />}
            <div className="bb">
              {!reveal && <button className="btn" onClick={() => setReveal(true)}>答えを見る</button>}
              <button className="btn eosin" onClick={cont}>続ける ▶</button>
            </div>
          </div></div>
        )}
        {overlay === 'end' && (
          <div className="aov on"><div className="box">
            <div className="kick">COMPLETE</div>
            <b className="bt">今見た流れを確認しよう</b>
            <p>何が・どこで・どの順番で・なぜ・どう変化したか、説明できますか？</p>
            <div className="bb">
              <button className="btn eosin" onClick={() => { setOverlay(null); setQuiz(true); }}>今見た流れを確認（5択）</button>
              <button className="btn" onClick={keyOnly}>重要部分だけ見る</button>
              <button className="btn" onClick={restart}>↻ もう一度見る</button>
            </div>
          </div></div>
        )}
      </div>

      <div className="actl">
        <Timeline total={total} ticks={ticks} onSeek={(f) => jump(f * total)} bind={(api) => { tlRef.current = api; }} label="アニメーションの再生位置" />
        <div className="arow">
          <button onClick={restart} aria-label="最初から"><Icon name="replay" /></button>
          <button onClick={prev} aria-label="前のステップ"><Icon name="prev" /></button>
          <button className="pl2" onClick={toggle} aria-label={playing ? '一時停止' : '再生'}>
            <Icon name={playing ? 'pause' : 'play'} /> {playing ? '一時停止' : P.current.T >= total ? 'もう一度' : '再生'}
          </button>
          <button onClick={next} aria-label="次のステップ"><Icon name="next" /></button>
          <span className="spd" role="group" aria-label="再生速度">
            {SPEEDS.map((v) => <button key={v} className={v === speed ? 'on' : ''} onClick={() => setSpeed(v)} aria-pressed={v === speed}>{v}×</button>)}
          </span>
          <button className={'fct' + (fac ? ' on' : '')} onClick={() => setFac((f) => !f)} aria-pressed={fac}>工場メタファー</button>
          <span className="tm" ref={tmRef}>0:00 / {fmtT(total)}</span>
        </div>
        <div className="achips" role="group" aria-label="重要ポイントへジャンプ">
          {groups.map((g) => (
            <button key={g.first} className={(g.n === cur.gn ? 'on' : '') + (g.n < cur.gn ? ' done' : '')} onClick={() => jump(steps[g.first].s0)}>
              <span className="en">[{pad(g.n)}]</span> {g.name}
            </button>
          ))}
        </div>
      </div>

      <div className="apan" aria-live="polite">
        <div className="ah1"><span className="an">[{pad(cur.gn)}] {cur.g}</span><Rich as="b" html={cur.t} /></div>
        <div className={'afac' + (fac ? '' : ' off')}>
          <div><span>MEDICAL</span><Rich as="p" html={cur.tx} /></div>
          <div className="ff"><span>FACTORY</span><Rich as="p" html={cur.fac || ''} /></div>
        </div>
        {cur.xp && <ul className="axp">{cur.xp.map((x, i) => <Rich as="li" key={i} html={x} />)}</ul>}
      </div>

      {quiz && (
        <div className="aqz">
          <div className="aqh"><span className="en">CHECK ／ 今見た流れを確認</span></div>
          {A.script.quiz.map((q, i) => (
            <FiveChoice
              key={i}
              qid={`anim:${id}:${i}`}
              label={`Q${i + 1}`}
              meta={A.meta.title}
              stem={q.q}
              options={q.o.map((o, k) => ({ text: o, correct: k === q.a, explanation: '' }))}
              explanation={q.x}
              onAnswer={(ok, k) => store.answer(`anim:${id}:${i}`, 'animation', ok, [k])}
            />
          ))}
          <div className="btnrow">
            <button className="btn" onClick={restart}>↻ アニメーションをもう一度</button>
            <button className="btn" onClick={keyOnly}>重要部分だけ見る</button>
            <Link className="btn eosin" to={`/quiz/play?chapter=${A.meta.chapter}`}>第{A.meta.chapter}章の5択問題へ</Link>
          </div>
        </div>
      )}

      {!compact && (
        <div className="adesc">
          <Rich html={A.meta.description} />
          <SourceChips slides={A.meta.sources} />
        </div>
      )}
    </div>
  );
}
