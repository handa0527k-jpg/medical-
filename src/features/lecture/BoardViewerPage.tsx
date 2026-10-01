/**
 * 「板書だけを見る」: the finished blackboard of one lecture. Pan / zoom,
 * jump to a panel, replay the writing in order (fast, silent), tap a key
 * point to see where it is on the board, or jump back into the lecture at
 * the moment it was written.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse } from '../../app/course';
import { NotFound } from '../../app/NotFound';
import { Rich } from '../../components/Rich';
import { BoardRenderer } from '../../engine/board/render';
import { BOARD_H, BOARD_W, type BoardCam } from '../../engine/board/types';
import { timeLecture } from '../../engine/lecture/timing';
import type { Lecture } from '../../engine/lecture/types';
import { useStudyPage } from '../../state/hooks';
import { useBoard } from './Blackboard';
import { fm2 } from './LecturePlayer';

const REPLAY_SPEEDS = [4, 8, 16];

export default function BoardViewerPage() {
  const course = useCourse();
  const id = Number(useParams().id);
  const ch = course.chapters.find((c) => c.id === id);
  const [lec, setLec] = useState<Lecture | null>(null);
  const [err, setErr] = useState(false);
  useStudyPage(ch ? { kind: 'lecture', id: String(id), label: `第${id}講 板書` } : null, `board:${id}`);
  useEffect(() => {
    if (!ch) return;
    let live = true;
    course.loadLecture(id).then((l) => live && setLec(l)).catch(() => live && setErr(true));
    return () => { live = false; };
  }, [course, id, ch]);
  if (!ch || err) return <NotFound />;
  if (!lec) return <div className="empty">板書を読み込み中…</div>;
  if (!lec.board) return <div className="empty">この講義には板書がありません。<Link to={`/lecture/${id}`}>授業へ</Link></div>;
  return <Viewer lecture={lec} chapter={id} name={ch.name} />;
}

export function Viewer({ lecture, chapter, name }: { lecture: Lecture; chapter: number; name: string }) {
  const tl = useMemo(() => timeLecture(lecture, null), [lecture]);
  const { r, version } = useBoard(lecture, tl);
  const renderer = r!;
  const end = useMemo(() => renderer.end + 0.5, [renderer, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const cv = useRef<HTMLCanvasElement>(null);
  const [T, setT] = useState(end);
  const [cam, setCam] = useState<BoardCam>([BOARD_W / 2, BOARD_H / 2, BOARD_W]);
  const [hl, setHl] = useState<string[] | undefined>(undefined);
  const [replay, setReplay] = useState(0);
  const panels = lecture.board!.panels || [];
  const firstCue = (ids: string[]) => {
    const op = lecture.board!.ops.find((o) => o.id && ids.includes(o.id));
    return op ? tl.cues[op.cue]?.t0 ?? 0 : null;
  };

  // draw
  useEffect(() => {
    const el = cv.current;
    if (!el) return;
    let raf = 0;
    const draw = () => renderer.draw(el, T, cam, { highlight: hl, hand: replay > 0 });
    draw();
    if (hl?.length) { const loop = () => { draw(); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [renderer, T, cam, hl, replay, version]);

  // replay the writing (silent, fast; the camera follows the lecture's own camera)
  useEffect(() => {
    if (!replay) return;
    let raf = 0, last = 0, t = T >= end - 0.6 ? 0 : T;
    const step = (ts: number) => {
      const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
      last = ts;
      t = Math.min(end, t + dt * replay);
      setT(t);
      setCam(renderer.camAt(t));
      if (t >= end) { setReplay(0); setCam([BOARD_W / 2, BOARD_H / 2, BOARD_W]); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [replay]); // eslint-disable-line react-hooks/exhaustive-deps

  // drag to pan, wheel / buttons to zoom
  const drag = useRef<{ x: number; y: number; cam: BoardCam } | null>(null);
  const zoom = (f: number) => setCam(([x, y, w]) => [x, y, Math.max(700, Math.min(BOARD_W, w * f))]);
  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, cam }; (e.target as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, el = cv.current;
    if (!d || !el) return;
    const k = d.cam[2] / el.clientWidth;
    setCam([d.cam[0] - (e.clientX - d.x) * k, d.cam[1] - (e.clientY - d.y) * k, d.cam[2]]);
  };
  const onUp = () => { drag.current = null; };
  useEffect(() => {
    const el = cv.current;
    if (!el) return;
    const h = (e: WheelEvent) => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12); };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  const show = (ids: string[]) => {
    setReplay(0); setT(end); setHl(ids);
    const b = renderer.boxOf(ids);
    if (b) setCam(BoardRenderer.frame(b, 1300));
  };
  const texts = useMemo(() => lecture.board!.ops.flatMap((o) => (o.prims || []).filter((p) => p.p === 'text').map((p) => (p.p === 'text' ? p.segs.map((g) => g.t).join('') : ''))), [lecture]);

  return (
    <>
      <div className="btnrow" style={{ marginTop: 0, marginBottom: 14 }}>
        <Link className="btn sm" to={`/lecture/${chapter}`} style={{ flex: '0 0 auto' }}>← 授業に戻る</Link>
        <Link className="btn sm" to={`/review5/${chapter}`} style={{ flex: '0 0 auto' }}>5分復習</Link>
      </div>
      <div className="card bview">
        <div className="lhd">
          <div><div className="kick">BLACKBOARD {String(chapter).padStart(2, '0')}</div><b>第{chapter}講　{name} ― 完成した黒板</b></div>
        </div>
        <div className="bvstage">
          <canvas ref={cv} className="bbcv" role="img" aria-label={`第${chapter}講の板書`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: 'none', cursor: drag.current ? 'grabbing' : 'grab' }} />
          {replay > 0 && <div className="ldig">書き順を再生中（{replay}倍速）</div>}
        </div>
        <div className="bvctl">
          <div className="chips" role="group" aria-label="黒板の場所">
            <button className="chip" onClick={() => { setHl(undefined); setCam([BOARD_W / 2, BOARD_H / 2, BOARD_W]); }}>全体</button>
            {panels.map((p) => (
              <button key={p.id} className="chip" onClick={() => { setHl(undefined); setCam(BoardRenderer.frame(p.box, 1400)); }}>{p.name}</button>
            ))}
            <button className="chip" onClick={() => zoom(1 / 1.25)} aria-label="拡大">＋</button>
            <button className="chip" onClick={() => zoom(1.25)} aria-label="縮小">－</button>
          </div>
          <div className="bvrep">
            <button className="btn sm eosin" onClick={() => { setHl(undefined); setReplay(replay ? 0 : 8); }}>{replay ? '■ 停止' : '▶ 書き順で再生'}</button>
            {replay > 0 && REPLAY_SPEEDS.map((s) => <button key={s} className={'chip' + (s === replay ? ' on' : '')} onClick={() => setReplay(s)}>{s}×</button>)}
            <input type="range" min={0} max={end} step={0.1} value={T} onChange={(e) => { setReplay(0); setT(Number(e.target.value)); setCam(renderer.camAt(Number(e.target.value))); }} aria-label="板書の時点" />
            <span className="tm">{fm2(T)} / {fm2(end)}</span>
          </div>
        </div>
      </div>

      {lecture.keyPoints && (
        <div className="card">
          <div className="kick">KEY POINTS</div>
          <h3 style={{ margin: '4px 0 10px' }}>今日の重要ポイント（タップで黒板の場所へ）</h3>
          <ol className="bvkeys">
            {lecture.keyPoints.map((k, i) => {
              const at = k.ref ? firstCue(k.ref) : null;
              return (
                <li key={i}>
                  <button className="bvk" onClick={() => k.ref && show(k.ref)} disabled={!k.ref}><Rich html={k.text} /></button>
                  {at !== null && <Link className="chip" to={`/lecture/${chapter}?t=${Math.floor(at)}`}>授業のこの場面 ▶ {fm2(at)}</Link>}
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <details className="card">
        <summary>板書のテキスト（{texts.length}行）</summary>
        <ul className="bvtext">{texts.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </details>
    </>
  );
}
