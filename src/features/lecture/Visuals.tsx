import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame } from './frame';
import { CellMap, Chalk, Card, Compare, Roadmap, StageQuiz } from './PrepVisuals';
import { BlackboardShot } from './Blackboard';
export { FrameContext, type FrameFn } from './frame';
import { useCourse } from '../../app/course';
import { Rich } from '../../components/Rich';
import { slideSrc } from '../../components/Slide';
import { AnimationStage } from '../../engine/animation/stage';
import { CL, EZ, L, lerpC } from '../../engine/svg';
import type { TimedCue, TimedShot } from '../../engine/lecture/types';
import { sentences } from '../../engine/speech/reading';

interface VP { shot: TimedShot; cue: TimedCue }

const focusOf = (cue: TimedCue) => cue.focus;

export function Visual({ shot, cue }: VP) {
  const course = useCourse();
  const v = shot.visual;
  switch (v.kind) {
    case 'title':
      return <div className="ly in"><div className="lt"><div className="kick">LECTURE {String(v.chapter).padStart(2, '0')} ／ SLIDE {v.slides[0]}–{v.slides[v.slides.length - 1]}</div><div className="ln">第{v.chapter}講</div><h2>{v.name}</h2><p>{course.metaphorLabel ? `${course.metaphorLabel.name}：` : '比喩：'}{v.role}</p><i className="lline" /></div></div>;
    case 'end':
      return <div className="ly in"><div className="lt"><div className="kick">END OF LECTURE</div><div className="ln">第{v.chapter}講</div><h2>{v.name}</h2><p>次は5択確認問題です</p><i className="lline" /></div></div>;
    case 'head':
      return <div className="ly in"><div className="lhead"><span className="en">SECTION {String(v.no).padStart(2, '0')}</span><Rich as="h3" html={v.text} /><i className="lline" /></div></div>;
    case 'board': {
      const f = focusOf(cue);
      const ss = v.sentences.length ? v.sentences : sentences(v.html);
      return (
        <div className="ly in">
          <div className={'lbd ' + (v.style || '') + (f === 'terms' ? ' terms' : '')}>
            <Rich className="lbt" as="div" html={v.title} />
            <div className="lbp">{ss.map((x, i) => <Rich key={i} as="span" className={typeof f === 'number' ? (i === f ? 'cur' : i < f ? 'past' : '') : ''} html={x} />)}</div>
          </div>
        </div>
      );
    }
    case 'list': {
      const f = typeof cue.focus === 'number' ? cue.focus : -1;
      return (
        <div className="ly in">
          <div className={'lls ' + (v.style || '')}>
            <Rich className="lbt" as="div" html={v.title} />
            <ol>{v.items.map((x, i) => <li key={i} className={(i <= f || cue.pause ? 'show' : '') + (i === f ? ' cur' : '')}><Rich html={x} /></li>)}</ol>
          </div>
        </div>
      );
    }
    case 'flow': {
      const f = typeof cue.focus === 'number' ? cue.focus : -1;
      return (
        <div className="ly in">
          <div className="lfl">
            <Rich className="lbt" as="div" html={v.title} />
            <div className="lfr">
              {v.items.map((x, i) => (
                <span key={i} style={{ display: 'contents' }}>
                  {i > 0 && <i className={'la' + (v.move && i === f ? ' go' : '')} key={`a${i}-${i === f ? cue.id : ''}`} />}
                  <div className={'lfi' + (i === f ? ' cur' : i < f ? ' past' : '')}><span className="en">{String(i + 1).padStart(2, '0')}</span><Rich html={x} /></div>
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case 'table': {
      const f = typeof cue.focus === 'number' ? cue.focus : -1;
      return (
        <div className="ly in">
          <div className="lbd">
            <Rich className="lbt" as="div" html={v.title} />
            <table className="ltb"><tbody>{v.rows.map((r, i) => <tr key={i} className={i === f && i > 0 ? 'cur' : ''}>{r.map((x, j) => (i ? <td key={j}><Rich html={x} /></td> : <th key={j}><Rich html={x} /></th>))}</tr>)}</tbody></table>
          </div>
        </div>
      );
    }
    case 'cast': {
      const f = typeof cue.focus === 'number' ? cue.focus : -1;
      return (
        <div className="ly in">
          <div className="lbd">
            <div className="lbt">図解：{course.metaphorLabel?.role ?? '工場の役割'}で見る登場人物</div>
            <div className="lcs">{v.items.map((x, i) => <div key={i} className={(i <= f ? 'show' : '') + (i === f ? ' cur' : '')}><Rich as="b" html={x[0]} /><Rich html={x[1]} /><Rich as="small" html={x[2]} /></div>)}</div>
          </div>
        </div>
      );
    }
    case 'slide':
      return <SlideShot shot={shot} n={v.slide} tour={v.tour === true} focus={typeof cue.focus === 'string' && /^m\d+$/.test(cue.focus) ? Number(cue.focus.slice(1)) - 1 : -1} cueT0={cue.t0} />;
    case 'chalk':
      return <Chalk v={v} shot={shot} cue={cue} />;
    case 'cellmap':
      return <CellMap v={v} shot={shot} cue={cue} />;
    case 'roadmap':
      return <Roadmap v={v} cue={cue} />;
    case 'compare':
      return <Compare v={v} cue={cue} />;
    case 'card':
      return <Card v={v} />;
    case 'quiz':
      return <StageQuiz v={v} shot={shot} cue={cue} />;
    case 'figure':
      return <FigureShot shot={shot} figure={v.figure} fkey={v.key} />;
    case 'bb':
      return <BlackboardShot />;
    case 'anim':
      return <AnimShot shot={shot} id={v.anim} step={v.step} hold={!!v.hold} />;
  }
}

/** Slide with a camera that visits each highlight box in turn, then pulls back. */
function SlideShot({ shot, n, tour, focus, cueT0 }: { shot: TimedShot; n: number; tour: boolean; focus: number; cueT0: number }) {
  const course = useCourse();
  const s = course.slides[n];
  const host = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const camRef = useRef<{ key: number; from: [number, number, number]; cur: [number, number, number]; t0: number }>({ key: -1, from: [1, 0.5, 0.5], cur: [1, 0.5, 0.5], t0: 0 });
  useFrame((T) => {
    const el = host.current, w = win.current, im = img.current;
    if (!el || !w || !im) return;
    const W = el.clientWidth, H = el.clientHeight;
    const a = im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 4 / 3;
    const iw = Math.min(W * 0.96, H * 0.92 * a), ih = iw / a;
    w.style.width = iw + 'px'; w.style.height = ih + 'px';
    const B = s.masks;
    if (!tour) {
      // authored lecture: glide to the mask the lecturer is talking about
      const cam = camRef.current;
      const target: [number, number, number] = focus >= 0 && B[focus] ? (() => { const r = B[focus], bw = (r[2] - r[0]) * iw, bh = (r[3] - r[1]) * ih; return [Math.max(1.35, Math.min(2.1, (W * 0.42) / bw, (H * 0.34) / bh)), (r[0] + r[2]) / 2, (r[1] + r[3]) / 2] as [number, number, number]; })() : [1, 0.5, 0.5];
      if (cam.key !== focus) { cam.from = cam.cur.slice() as [number, number, number]; cam.key = focus; cam.t0 = cueT0; }
      const u = EZ(CL((T - cam.t0) / 0.9));
      const z = L(cam.from[0], target[0], u), cx = L(cam.from[1], target[1], u), cy = L(cam.from[2], target[2], u);
      cam.cur = [z, cx, cy];
      const tx = z <= 1.001 ? (W - iw) / 2 : W / 2 - cx * iw * z, ty = z <= 1.001 ? (H - ih) / 2 : H / 2 - cy * ih * z;
      w.style.transform = `translate(${tx}px,${ty}px) scale(${z})`;
      w.querySelectorAll('i').forEach((b, j) => { b.classList.toggle('on', j === focus); b.classList.remove('v'); });
      return;
    }
    // the camera tour starts after the introductory sentence
    const ts = shot.cues[0]?.t1 ?? shot.t0, tp = CL((T - ts) / Math.max(0.1, shot.t1 - ts));
    let z = 1, cx = 0.5, cy = 0.5, act = -1;
    if (B.length && T >= ts) {
      const nB = B.length, k = Math.min(nB - 1, Math.floor(tp * nB)), mv = EZ(CL((tp * nB - k) / 0.35));
      act = k;
      const tg = (j: number): [number, number, number] => {
        if (j < 0) return [1, 0.5, 0.5];
        const r = B[j], bw = (r[2] - r[0]) * iw, bh = (r[3] - r[1]) * ih;
        return [Math.max(1.2, Math.min(1.9, (W * 0.4) / bw, (H * 0.3) / bh)), (r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
      };
      const A0 = tg(k - 1), A1 = tg(k);
      z = L(A0[0], A1[0], mv); cx = L(A0[1], A1[1], mv); cy = L(A0[2], A1[2], mv);
      if (tp > 0.9) { const o = EZ((tp - 0.9) / 0.1); z = L(z, 1, o); cx = L(cx, 0.5, o); cy = L(cy, 0.5, o); }
    }
    // translate so (cx,cy) of the scaled slide sits at the stage centre, clamped to stay on screen
    let tx = W / 2 - cx * iw * z, ty = H / 2 - cy * ih * z;
    if (z <= 1.001) { tx = (W - iw) / 2; ty = (H - ih) / 2; }
    w.style.transform = `translate(${tx}px,${ty}px) scale(${z})`;
    w.querySelectorAll('i').forEach((b, j) => { b.classList.toggle('on', j === act); b.classList.toggle('v', j < act); });
  });
  return (
    <div className="ly lsl" ref={host} aria-label={`スライド${n}　${s.title}`}>
      <div className="lsw" ref={win}>
        <img ref={img} src={slideSrc(course.assetBase, s.image)} alt="" />
        {s.masks.map((r, i) => <i key={i} style={{ left: `${r[0] * 100}%`, top: `${r[1] * 100}%`, width: `${(r[2] - r[0]) * 100}%`, height: `${(r[3] - r[1]) * 100}%` }} />)}
      </div>
    </div>
  );
}

/** Interactive figure; the camera glides to the highlighted structure. */
function FigureShot({ shot, figure, fkey }: { shot: TimedShot; figure: string; fkey: string | null }) {
  const course = useCourse();
  const F = course.figures[figure];
  const D = course.figureDetails[F.set];
  const box = useRef<HTMLDivElement>(null);
  const cam = useRef<{ vb0: number[]; vb: number[]; from: number[]; to: number[]; bb: Record<string, number[] | null> }>({ vb0: [], vb: [], from: [], to: [], bb: {} });

  useLayoutEffect(() => {
    const svg = box.current?.querySelector('svg');
    if (!svg) return;
    const c = cam.current;
    if (!c.vb0.length) { c.vb0 = (svg.getAttribute('viewBox') || '0 0 1000 640').split(/\s+/).map(Number); c.vb = c.vb0.slice(); }
    svg.classList.toggle('dim', !!fkey);
    svg.querySelectorAll<SVGGElement>('g.hs').forEach((g) => g.classList.toggle('on', g.dataset.k === fkey));
    c.from = c.vb.slice();
    let to = c.vb0;
    if (fkey) {
      if (c.bb[fkey] === undefined) {
        const g = svg.querySelector<SVGGElement>(`g.hs[data-k="${fkey}"]`);
        try { const b = g!.getBBox(); c.bb[fkey] = [b.x, b.y, b.width, b.height]; } catch { c.bb[fkey] = null; }
      }
      const b = c.bb[fkey];
      if (b) { const pad = 80, w = Math.max(b[2] + pad * 2, c.vb0[2] * 0.42), h = Math.max(b[3] + pad * 2, w * 0.5625); to = [b[0] + b[2] / 2 - w / 2, b[1] + b[3] / 2 - h / 2, w, h]; }
    }
    c.to = to;
  }, [fkey]);

  useFrame((T) => {
    const svg = box.current?.querySelector('svg');
    const c = cam.current;
    if (!svg || !c.to.length) return;
    const u = EZ(CL((T - shot.t0) / Math.max(0.1, (shot.t1 - shot.t0) * 0.3)));
    c.vb = lerpC(c.from, c.to, u);
    svg.setAttribute('viewBox', c.vb.map((n) => n.toFixed(1)).join(' '));
  });

  return (
    <div className="ly lfg">
      <div className="fsvg" ref={box} dangerouslySetInnerHTML={{ __html: F.svg }} />
      <Rich className="lfgt" as="div" html={fkey ? D[fkey].name : F.title} />
    </div>
  );
}

/** Mechanism animation step driven by lecture time. */
function AnimShot({ shot, id, step, hold }: { shot: TimedShot; id: string; step: number; hold: boolean }) {
  const course = useCourse();
  const A = course.animations[id];
  const host = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const stage = useRef<AnimationStage | null>(null);
  useEffect(() => {
    const h = host.current!;
    stage.current = new AnimationStage(h, A.def, A.script, course.macroSvg(), A.meta.modes);
    return () => { stage.current = null; h.innerHTML = ''; };
  }, [A, course]);
  useFrame((T) => {
    const st = stage.current;
    if (!st) return;
    const s = A.script.steps[step];
    const p = hold ? 1 : CL((T - shot.t0) / Math.max(0.1, shot.t1 - shot.t0));
    st.draw(s, p, performance.now() / 1000);
    if (hud.current) {
      hud.current.style.opacity = st.hud.visible ? '1' : '0';
      hud.current.querySelector('b')!.textContent = st.hud.value;
      hud.current.querySelector('small')!.textContent = st.hud.label;
    }
  });
  return (
    <div className="ly lan">
      <div className="stage-host" ref={host} />
      <div className="rhud" ref={hud}><small /><b /></div>
    </div>
  );
}
