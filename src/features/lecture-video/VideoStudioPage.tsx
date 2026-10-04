/**
 * 遺伝学 › 🎬 授業動画 — the lecture-film studio.
 *
 * MEDSTUDY is the director here: it reads the genetics material, recommends the first theme, plans the
 * scenes, writes the timecoded script, draws the exact figures and previews the gekiga animatic in sync
 * with the lecturer's voice. ComfyUI / Wan 2.2 / Kokoro / FFmpeg run on the Windows side from the
 * package this page exports — this page never pretends to run them.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { categoryById } from '../../content/categories';
import { coursesIn, loadCourse } from '../../content/registry';
import type { Course } from '../../content/types';
import type { Lecture } from '../../engine/lecture/types';
import { NotFound } from '../../app/NotFound';
import { useStudyPage } from '../../state/hooks';
import { filmTheme, recommendTheme, themesOf } from '../../engine/lecture-video/analyze';
import { buildPlan, isCurated, isFilm, voiceKey } from '../../engine/lecture-video/plan';
import { filmsOf } from '../../engine/lecture-video/directions/films';
import { buildTiming, lengthsFromKokoro, tc, at, type KokoroTiming } from '../../engine/lecture-video/timing';
import { INTENSITY_LABEL, STYLE_LABEL, type Duration, type Intensity, type LessonStyle, type Plan, type Timing } from '../../engine/lecture-video/types';
import { renderFrame, sceneAt, activeShot, type Layer } from '../../engine/lecture-video/render';
import { sceneEvents, describeSrc, plainText, shows, subtitleLines } from '../../engine/lecture-video/edit';
import { packageFiles, wanJobs, diagramSvg } from '../../engine/lecture-video/package';
import { WAN_PROFILES, type WanProfile } from '../../engine/lecture-video/wan';
import { zip, type ZipInput } from '../../engine/lecture-video/zip';
import { playSfx } from './sfx';
import '../../styles/studio.css';

const W = 1280, H = 720, FPS = 24;
const BASE = `${import.meta.env.BASE_URL}lecture-video/`;
interface AssetIndex { voices: Record<string, { audio: string; timing: string }>; videos: Record<string, { file: string; wanShots: number; shots: number; built: string; seconds: number }> }

/**
 * The lettering faces (擬音 = Dela Gothic One, 筆文字 = Yuji Syuku; SIL OFL) are self-hosted subsets
 * (public/fonts) so the film letters the same everywhere, also in headless rendering.
 */
let letteringReady: Promise<boolean> | null = null;
export function loadLettering(): Promise<boolean> {
  return (letteringReady ??= Promise.all([
    ['LV Dela', 'DelaGothicOne-lv.woff2'],
    ['LV Brush', 'YujiSyuku-lv.woff2'],
  ].map(([fam, file]) => new FontFace(fam, `url(${import.meta.env.BASE_URL}fonts/${file})`).load().then((f) => { document.fonts.add(f); return true; }).catch(() => false)))
    .then((r) => r.every(Boolean)));
}
function useLetteringFonts() { useEffect(() => { void loadLettering(); }, []); }

function download(name: string, data: Blob | string, type = 'text/plain') {
  const b = typeof data === 'string' ? new Blob([data], { type: `${type};charset=utf-8` }) : data;
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const dataUrlBytes = (u: string) => Uint8Array.from(atob(u.split(',')[1]), (c) => c.charCodeAt(0));

export function VideoStudioPage() {
  const id = useParams().id ?? '';
  const cat = categoryById(id);
  useStudyPage(null, `video:${id}`);
  useLetteringFonts();
  const [q, setQ] = useSearchParams();
  const courses = coursesIn(id);
  const courseId = q.get('course') ?? courses[0]?.id ?? '';
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [index, setIndex] = useState<AssetIndex>({ voices: {}, videos: {} });
  const [imported, setImported] = useState<KokoroTiming | null>(null);
  const [localVideo, setLocalVideo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const durationQ = (Number(q.get('d')) === 60 ? 60 : 30) as Duration;
  const styleQ = (['board', 'documentary', 'exam'].includes(q.get('style') ?? '') ? q.get('style') : 'board') as LessonStyle;
  const intensity = (['standard', 'gekiga', 'ultra'].includes(q.get('k') ?? '') ? q.get('k') : 'gekiga') as Intensity;
  const profile = (q.get('wan') === 'i2v-14b' ? 'i2v-14b' : 'ti2v-5b') as WanProfile;
  const set = (k: string, v: string) => { const n = new URLSearchParams(q); n.set(k, v); setQ(n, { replace: true }); };

  // automation: scripts/lecture-video/render-layers.mjs hands over the measured Kokoro timing
  useEffect(() => { (window as unknown as Record<string, unknown>).__lvImport = (j: KokoroTiming) => setImported(j); }, []);
  useEffect(() => { fetch(`${BASE}index.json`).then((r) => (r.ok ? r.json() : null)).then((j) => j && setIndex(j)).catch(() => {}); }, []);
  useEffect(() => {
    if (!courseId) return;
    let live = true;
    setCourse(null); setLectures([]);
    loadCourse(courseId).then(async (c) => {
      const ls = await Promise.all(c.chapters.map((ch) => c.loadLecture(ch.id).catch(() => null)));
      if (live) { setCourse(c); setLectures(ls.filter(Boolean) as Lecture[]); }
    });
    return () => { live = false; };
  }, [courseId]);

  const sections = useMemo(() => lectures.flatMap((l) => themesOf(courseId, l)), [lectures, courseId]);
  // 完成版: whole lectures (hand-directed) are offered first when the course has them
  const films = useMemo(() => filmsOf(courseId).flatMap((f) => { const l = lectures.find((x) => x.chapter === f.lecture); return l ? [filmTheme(courseId, l, f.key)] : []; }), [lectures, courseId]);
  const film = films[0] ?? null;
  const themes = useMemo(() => [...films, ...sections], [films, sections]);
  const rec = useMemo(() => recommendTheme(sections), [sections]);
  const themeKey = q.get('theme') && themes.some((t) => t.key === q.get('theme')) ? q.get('theme')! : film?.key ?? rec?.theme.key ?? themes[0]?.key;
  const theme = themes.find((t) => t.key === themeKey);
  const lecture = lectures.find((l) => l.chapter === theme?.lecture);
  const filmMode = !!theme && isFilm(theme.key);
  const duration: Duration = filmMode ? 'full' : durationQ;
  const style: LessonStyle = filmMode ? 'board' : styleQ;

  const plan = useMemo<Plan | null>(() => (course && lecture && theme ? buildPlan({ course: course.id, courseTitle: course.title, lecture, theme, slides: course.slides, questions: course.questions }, { duration, style, intensity }) : null), [course, lecture, theme, duration, style, intensity]);
  const vk = theme ? voiceKey(theme.key, { duration, style }) : '';
  const shipped = index.voices[vk];
  const [shippedTiming, setShippedTiming] = useState<KokoroTiming | null>(null);
  useEffect(() => { setShippedTiming(null); if (shipped) fetch(BASE + shipped.timing).then((r) => r.json()).then(setShippedTiming).catch(() => {}); }, [shipped]);
  const kokoro = imported && imported.plan === vk ? imported : shippedTiming;
  const timing = useMemo<Timing | null>(() => (plan ? buildTiming(plan, kokoro ? lengthsFromKokoro(kokoro) : undefined) : null), [plan, kokoro]);
  const video = plan ? index.videos[plan.key] : undefined;

  if (!cat) return <NotFound />;
  if (id !== 'genetics') return (
    <div className="card cat-empty"><h2>授業動画（劇画アニメーション）は、まず遺伝学で試作中です</h2><p>30秒プロトタイプが完成したら、ほかの分野に広げます。</p><Link className="btn" to="/category/genetics/video">遺伝学の授業動画へ</Link></div>
  );

  const exportPackage = async (withLayers: boolean) => {
    if (!plan || !timing) return;
    setBusy(withLayers ? 'レイヤーを書き出し中…' : 'パッケージを作成中…');
    try {
      const files: ZipInput = packageFiles(plan, timing, profile, vk);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d')!;
      await document.fonts.ready;
      for (const j of wanJobs(plan, timing, profile)) { renderFrame(g, plan, timing, j.t0 + 0.02, 'plate'); files[j.keyframe] = dataUrlBytes(cv.toDataURL('image/png')); }
      if (withLayers) {
        const n = Math.round(timing.total * FPS);
        for (let f = 0; f < n; f++) {
          const t = f / FPS;
          renderFrame(g, plan, timing, t, 'overlay'); files[`layers/overlay_${String(f).padStart(5, '0')}.png`] = dataUrlBytes(cv.toDataURL('image/png'));
          renderFrame(g, plan, timing, t, 'plate'); files[`layers/plate_${String(f).padStart(5, '0')}.jpg`] = dataUrlBytes(cv.toDataURL('image/jpeg', 0.9));
          if (f % 24 === 0) { setBusy(`レイヤーを書き出し中… ${Math.round((f / n) * 100)}%`); await new Promise((r) => setTimeout(r, 0)); }
        }
      }
      download(`medstudy_${vk}_${intensity}${withLayers ? '_layers' : ''}.zip`, zip(files));
    } finally { setBusy(null); }
  };

  return (
    <div className="lv">
      <nav className="crumb" aria-label="パンくず"><Link to="/">ホーム</Link><span aria-hidden="true">／</span><Link to={`/category/${id}`}>{cat.name}</Link><span aria-hidden="true">／</span><span>授業動画</span></nav>
      <header className="lv-head">
        <div className="kick">LECTURE FILM STUDIO</div>
        <h1><span aria-hidden="true">🎬</span> 授業動画 <small>劇画アニメーション</small></h1>
        <p>遺伝学の教材（講義・板書・スライド・確認問題）だけを台本の源にして、医学的に正確な図と劇画的なカメラ・演出で、講師の声と同期した授業映像を設計します。</p>
      </header>

      <section className="lv-pipe" aria-label="制作の流れと役割">
        {[
          ['MEDSTUDY', '教材理解・授業設計・医学図・管理', 'このページ', 'here'],
          ['Kokoro', '日本語講師音声（WAV）', 'Windows（CPU可）', 'win'],
          ['ComfyUI', '動画生成ワークフロー管理', 'Windows（GPU）', 'win'],
          ['Wan 2.2', '映像生成（文字・正確な構造は描かせない）', 'Windows（GPU）', 'win'],
          ['FFmpeg', '映像・音声・字幕・効果音の統合', 'Windows', 'win'],
        ].map(([n, r, w, k]) => (
          <div key={n} className={'lv-role ' + k}><b>{n}</b><span>{r}</span><small>{w}</small></div>
        ))}
        <p className="lv-honest">このページは ComfyUI・Wan 2.2・Kokoro・FFmpeg を実行しません（ブラウザからは動かせません）。それぞれに渡す設定・台本・医学図・編集情報を作り、Windows 側のツールがそれを実行します。</p>
      </section>

      <section className="lv-form card" aria-label="動画の設定">
        <label><span>教材を選択</span>
          <select value={courseId} onChange={(e) => { const n = new URLSearchParams(q); n.set('course', e.target.value); n.delete('theme'); setQ(n, { replace: true }); }}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title.split('｜').pop()}</option>)}
          </select>
        </label>
        <label className="wide"><span>テーマを選択</span>
          <select value={themeKey ?? ''} onChange={(e) => set('theme', e.target.value)} disabled={!themes.length}>
            {films.length > 0 && <optgroup label="完成版">{films.map((f) => <option key={f.key} value={f.key}>第{f.lecture}講「{f.lectureTitle}」まるごと（完成版・監修済み演出）</option>)}</optgroup>}
            {lectures.map((l) => (
              <optgroup key={l.chapter} label={`第${l.chapter}講　${l.title}`}>
                {sections.filter((t) => t.lecture === l.chapter).map((t) => (
                  <option key={t.key} value={t.key}>{t.name}{t.key === rec?.theme.key ? '　★推奨' : ''}{isCurated(t.key) ? '（監修済み演出）' : t.substantive ? '（自動下書き）' : '（導入・まとめ）'}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <fieldset><legend>動画時間</legend>
          {filmMode ? <button type="button" aria-pressed="true" disabled>完成版（講義まるごと）</button>
            : ([30, 60] as Duration[]).map((d) => <button key={d} type="button" aria-pressed={duration === d} onClick={() => set('d', String(d))}>{d}秒{d === 30 ? '（プロトタイプ）' : ''}</button>)}
        </fieldset>
        <fieldset><legend>授業スタイル</legend>
          {(filmMode ? (['board'] as LessonStyle[]) : (['board', 'documentary', 'exam'] as LessonStyle[])).map((s) => <button key={s} type="button" aria-pressed={style === s} disabled={filmMode} onClick={() => set('style', s)}>{STYLE_LABEL[s]}</button>)}
          {filmMode && <small>完成版は講義の黒板に沿って進むため、黒板講義型です。</small>}
        </fieldset>
        <fieldset><legend>アニメーション強度</legend>
          {(['standard', 'gekiga', 'ultra'] as Intensity[]).map((k) => <button key={k} type="button" aria-pressed={intensity === k} className={'k-' + k} onClick={() => set('k', k)}>{INTENSITY_LABEL[k]}</button>)}
          <small>医学図・台詞はすべての強度で同一。変わるのはカメラと効果だけです。</small>
        </fieldset>
        <label><span>Wan 2.2 モデル</span>
          <select value={profile} onChange={(e) => set('wan', e.target.value)}>
            {(Object.keys(WAN_PROFILES) as WanProfile[]).map((p) => <option key={p} value={p}>{WAN_PROFILES[p].label}</option>)}
          </select>
        </label>
      </section>

      {rec && (
        <section className="lv-rec card">
          <div className="kick">最初に動画化するテーマ（教材から自動判定）</div>
          <h2>第{rec.theme.lecture}講 {rec.theme.name}</h2>
          <p>{rec.why}</p>
          {plan?.curated && <ul>{plan.rationale.map((r) => <li key={r}>{r}</li>)}</ul>}
        </section>
      )}

      {!plan || !timing ? <div className="card lv-loading">教材を読み込み中…</div> : (
        <>
          <Preview plan={plan} timing={timing} audio={kokoro && shipped && kokoro === shippedTiming ? BASE + shipped.audio : null} />
          <div className="lv-status">
            <span className={timing.source === 'kokoro' ? 'ok' : 'warn'}>{timing.source === 'kokoro' ? `音声：Kokoro ${plan.voice.kokoro}（生成済み・実測タイミング ${timing.total.toFixed(1)} 秒）` : `音声：未生成（推定タイミング ${timing.total.toFixed(1)} 秒）— Kokoro で生成するとタイミングが確定します`}</span>
            <span className={plan.curated ? 'ok' : 'warn'}>{plan.curated ? '演出：監修済み（台詞はすべて講義の原文・その一部、または用語を変えない要約）' : '演出：自動下書き（要監修）'}</span>
            <span className="warn">Wan 2.2 映像：未生成（プレビューの背景は MEDSTUDY のアニマティック）</span>
          </div>

          <section className="lv-final card" aria-label="完成動画">
            <div className="sec-h"><span className="en">FINISHED FILM</span><h2>完成動画</h2></div>
            {video ? (
              <>
                <video src={BASE + video.file} controls playsInline preload="metadata" className="lv-video" />
                <p className="lv-note">FFmpeg で統合した {video.seconds.toFixed(1)} 秒の授業動画です（Kokoro 音声・字幕・効果音・医学図レイヤー）。Wan 2.2 映像は {video.wanShots}/{video.shots} ショット — 未生成のショットの背景は MEDSTUDY のアニマティックで、画面右上にその旨を表示しています。</p>
              </>
            ) : <p className="lv-note">この設定の完成動画はまだありません。下の手順で Windows 側で作ると、ここで再生できます。</p>}
            <label className="btn sm lv-file">Windows で作った完成動画（MP4）を再生
              <input type="file" accept="video/mp4,video/webm" onChange={(e) => { const f = e.target.files?.[0]; if (f) setLocalVideo(URL.createObjectURL(f)); }} />
            </label>
            {localVideo && <video src={localVideo} controls playsInline className="lv-video" />}
          </section>

          <section aria-label="シーン">
            <div className="sec-h"><span className="en">SCENES</span><h2>シーン構成と同期台本（{plan.scenes.length}シーン）</h2></div>
            {plan.scenes.map((sc) => <SceneCard key={sc.id} plan={plan} timing={timing} id={sc.id} profile={profile} />)}
          </section>

          <section className="lv-export card" aria-label="書き出し">
            <div className="sec-h"><span className="en">EXPORT</span><h2>Windows 側へ渡す</h2></div>
            <div className="btnrow">
              <button type="button" className="btn eosin" disabled={!!busy} onClick={() => exportPackage(false)}>制作パッケージ（ZIP）</button>
              <button type="button" className="btn" disabled={!!busy} onClick={() => exportPackage(true)}>パッケージ＋医学図レイヤー（PNG連番）</button>
              <button type="button" className="btn" onClick={() => download(`script_${vk}.md`, packageFiles(plan, timing, profile, vk)['script.md'] as string, 'text/markdown')}>台本（Markdown）</button>
              <label className="btn lv-file">Kokoro タイミングを読み込む
                <input type="file" accept="application/json" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const j = JSON.parse(await f.text()) as KokoroTiming; setImported(j); if (j.plan !== vk) alert(`この設定（${vk}）用のタイミングではありません（${j.plan}）`); } catch { alert('kokoro_timing.json を選んでください'); } }} />
              </label>
            </div>
            {busy && <p className="lv-busy" role="status">{busy}</p>}
            <ol className="lv-steps">
              <li><b>MEDSTUDY</b>：「制作パッケージ（ZIP）」を保存して展開する。</li>
              <li><b>Kokoro</b>：<code>python tools\lecture-video\medstudy_video.py tts &lt;パッケージ&gt;</code> → <code>audio\S01.wav…</code> と <code>audio\kokoro_timing.json</code></li>
              <li><b>MEDSTUDY</b>：「Kokoro タイミングを読み込む」→ 映像の出来事が実際の発話時刻に合わさる → 「パッケージ＋医学図レイヤー」を同じフォルダに上書き展開（キーフレーム・Wan のフレーム数・字幕・編集表が確定）。</li>
              <li><b>ComfyUI × Wan 2.2</b>：ComfyUI を起動し <code>python tools\lecture-video\medstudy_video.py comfy &lt;パッケージ&gt;</code>（<code>comfy\*.api.json</code> を自動投入 → <code>wan\S01_a.webm…</code>）</li>
              <li><b>FFmpeg</b>：<code>python tools\lecture-video\medstudy_video.py sfx &lt;パッケージ&gt;</code> → <code>… assemble &lt;パッケージ&gt;</code> → <code>out\lecture.mp4</code></li>
              <li><b>MEDSTUDY</b>：「完成動画（MP4）を再生」で確認。</li>
            </ol>
            <p className="lv-note">音声を先に確定させるのは、「DNAを加えたときだけ」と言った瞬間に皿へ急接近する、といった同期を実測の発話時刻で取るためです。詳しくは <code>tools/lecture-video/README.md</code>。</p>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------- preview player ---------- */
function Preview({ plan, timing, audio }: { plan: Plan; timing: Timing; audio: string | null }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const au = useRef<HTMLAudioElement>(null);
  const st = useRef({ t: 0, playing: false, last: 0 });
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [layer, setLayer] = useState<Layer>('full');
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => { void loadLettering().then(() => setFontTick((x) => x + 1)); }, []);
  const [sfxOn, setSfxOn] = useState(true);
  const draw = useCallback((tt: number) => { const g = cv.current?.getContext('2d'); if (g) renderFrame(g, plan, timing, Math.min(tt, timing.total - 0.001), layer); }, [plan, timing, layer]);
  useEffect(() => { draw(st.current.t); document.fonts.ready.then(() => draw(st.current.t)); }, [draw, fontTick]);
  // automation hook (scripts/lecture-video/render-layers.mjs): draw any frame / layer and read it back
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__lv = {
      fonts: () => loadLettering().then((ok) => Promise.all(['900 40px "Zen Kaku Gothic New"', '600 40px "Klee One"'].map((f) => document.fonts.load(f, 'あア字1A').catch(() => []))).then(() => document.fonts.ready).then(() => ok)),
      info: () => ({ total: timing.total, source: timing.source, key: plan.key, jobs: wanJobs(plan, timing, 'ti2v-5b').map((j) => ({ name: j.name, t0: j.t0 })) }),
      frame: (tt: number, l: Layer, type = 'image/png', q = 0.9) => { const c = document.createElement('canvas'); c.width = W; c.height = H; renderFrame(c.getContext('2d')!, plan, timing, tt, l); return c.toDataURL(type, q); },
    };
  }, [plan, timing]);
  const sfx = useMemo(() => plan.scenes.flatMap((sc) => { const ts = timing.scenes.find((x) => x.id === sc.id)!; return sc.sfx.filter((s) => !s.min || shows(s.min, plan.intensity)).map((s) => ({ t: at(ts, s.at), kind: s.kind, gain: s.gain ?? 1 })).filter((s) => Number.isFinite(s.t)); }), [plan, timing]);
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const s = st.current;
      if (s.playing) {
        const prev = s.t;
        const a = au.current;
        s.t = a && audio && !a.paused ? a.currentTime : s.t + (s.last ? (now - s.last) / 1000 : 0);
        s.last = now;
        if (sfxOn) for (const x of sfx) if (x.t > prev && x.t <= s.t) playSfx(x.kind, x.gain);
        if (s.t >= timing.total) { s.t = timing.total; s.playing = false; setPlaying(false); au.current?.pause(); }
        draw(s.t); setT(s.t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw, sfx, sfxOn, timing, audio]);
  const play = () => {
    const s = st.current; if (s.t >= timing.total - 0.05) s.t = 0;
    s.playing = true; s.last = 0; setPlaying(true);
    if (audio && au.current) { au.current.currentTime = s.t; void au.current.play().catch(() => {}); }
  };
  const pause = () => { st.current.playing = false; setPlaying(false); au.current?.pause(); };
  const seek = (tt: number) => { st.current.t = Math.max(0, Math.min(timing.total, tt)); if (au.current) au.current.currentTime = st.current.t; draw(st.current.t); setT(st.current.t); };
  useEffect(() => { pause(); seek(0); }, [plan, timing]); // eslint-disable-line react-hooks/exhaustive-deps

  const sub = subtitleLines(timing).find((l) => t >= l.t0 && t < l.t1);
  const si = sceneAt(timing, t), sc = plan.scenes[si];
  const shot = activeShot(sc, timing.scenes[si], t);
  return (
    <section className="lv-player" aria-label="プレビュー">
      <div className={'lv-screen layer-' + layer}>
        <canvas ref={cv} width={W} height={H} onClick={() => (playing ? pause() : play())} aria-label="授業動画のプレビュー" />
        {layer !== 'plate' && sub && <div className="lv-sub" aria-live="polite"><span>{sub.text.split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <em key={i}>{x}</em> : x))}</span></div>}
        <div className="lv-hud"><b>{sc.id}</b> {sc.title}<span>{shot.mode === 'feature' ? `Wan主役ショット ${sc.id}_${shot.id}` : `Wan背景ショット ${sc.id}_${shot.id}`}</span></div>
      </div>
      {audio && <audio ref={au} src={audio} preload="auto" />}
      <div className="lv-ctl">
        <button type="button" className="btn sm pri" onClick={() => (playing ? pause() : play())}>{playing ? '❚❚ 一時停止' : '▶ 再生'}</button>
        <input type="range" min={0} max={timing.total} step={1 / FPS} value={t} onChange={(e) => seek(Number(e.target.value))} aria-label="再生位置" />
        <span className="lv-tc">{tc(t)} / {tc(timing.total)}</span>
        <span className="lv-layers" role="radiogroup" aria-label="表示レイヤー">
          {([['full', '完成イメージ'], ['plate', 'Wan層（キーフレーム）'], ['overlay', '医学図層']] as [Layer, string][]).map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={layer === k} onClick={() => setLayer(k)}>{l}</button>)}
        </span>
        <button type="button" className="btn sm" aria-pressed={sfxOn} onClick={() => setSfxOn(!sfxOn)}>効果音</button>
      </div>
      <div className="lv-marks" aria-hidden="true">{timing.scenes.map((s) => <i key={s.id} style={{ left: `${(s.t0 / timing.total) * 100}%`, width: `${((s.t1 - s.t0) / timing.total) * 100}%` }}>{s.id}</i>)}</div>
    </section>
  );
}

/* ---------- scene sheet ---------- */
function SceneCard({ plan, timing, id, profile }: { plan: Plan; timing: Timing; id: string; profile: WanProfile }) {
  const sc = plan.scenes.find((s) => s.id === id)!, ts = timing.scenes.find((s) => s.id === id)!;
  const segs = timing.segs.filter((x) => x.scene === id);
  const evs = sceneEvents(sc, timing, plan.intensity);
  const jobs = wanJobs(plan, timing, profile).filter((j) => j.scene === id);
  const svg = useMemo(() => diagramSvg(sc), [sc]);
  const rows = [...segs.map((x) => ({ t: x.speech0, k: 'say', s: `${tc(x.speech0)}–${tc(x.speech1)}`, v: plainText(x.seg.text), say: x.seg.say })), ...evs.map((e) => ({ t: e.t, k: e.kind, s: tc(e.t), v: e.text, say: '' }))].sort((a, b) => a.t - b.t);
  const copy = (s: string) => { void navigator.clipboard?.writeText(s); };
  return (
    <article className="lv-scene card">
      <header><b className="lv-sid">{sc.id}</b><span className="lv-tc">{tc(ts.t0)}–{tc(ts.t1)}</span><h3>{sc.title}</h3></header>
      <dl className="lv-dl">
        <dt>教材との対応</dt><dd>{[...new Set(sc.beats.map((b) => describeSrc(b.src)))].join(' ／ ')}</dd>
        <dt>映像内容</dt><dd>{sc.picture}</dd>
        <dt>医学図</dt><dd>{sc.diagram.title} — {sc.diagram.note}</dd>
      </dl>
      {svg && <div className="lv-svg" dangerouslySetInnerHTML={{ __html: svg }} />}
      <h4>講師台本・字幕と同期（タイムコード）</h4>
      <ul className="lv-sync">
        {rows.map((r, i) => <li key={i} className={r.k}><span className="lv-tc">{r.s}</span>{r.k === 'say' ? <>「{r.v}」{r.say !== r.v && <small>Kokoro：{r.say}</small>}</> : <>▶ {r.v}</>}</li>)}
      </ul>
      <h4>Kokoro 音声</h4>
      <p className="lv-small">声 {plan.voice.kokoro}・話速 {plan.voice.speed} → <code>audio/{sc.id}.wav</code>（区間ごとに前後の間・重要語の話速を指定）</p>
      <h4>Wan 2.2（{WAN_PROFILES[profile].label}）</h4>
      {jobs.map((j) => (
        <details key={j.name} className="lv-wan">
          <summary><b>{j.name}</b> {j.mode === 'feature' ? '主役' : '背景'}・{tc(j.t0)}〜 {j.dur.toFixed(2)}秒・{j.frames}フレーム — {j.desc}</summary>
          <div className="lv-prompt"><span>PROMPT</span><button type="button" onClick={() => copy(j.prompt)}>コピー</button><p>{j.prompt}</p></div>
          <div className="lv-prompt neg"><span>NEGATIVE</span><button type="button" onClick={() => copy(j.negative)}>コピー</button><p>{j.negative}</p></div>
          <p className="lv-small">開始画像：<code>{j.keyframe}</code>（MEDSTUDY の Wan 層・文字なし）／ ComfyUI：<code>comfy/{profile}/{j.name}.api.json</code>／ seed {j.seed}</p>
        </details>
      ))}
      <h4>カメラ・効果音</h4>
      <p className="lv-small">{sc.cams.map((c) => c.note).join(' → ')}</p>
      <p className="lv-small">効果音：{sc.sfx.filter((s) => (!s.min || shows(s.min, plan.intensity)) && Number.isFinite(at(ts, s.at))).map((s) => `${tc(at(ts, s.at))} ${s.kind}`).join('、')}</p>
    </article>
  );
}

export default VideoStudioPage;
