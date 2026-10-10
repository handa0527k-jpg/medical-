import '../style.css';
import './film.css';
import { Stage } from '../core/stage';
import { loadDnaTemplate } from '../core/dna';
import { Clock, Overlays, type Timing } from './kit';
import { buildSanger } from './sanger';

/**
 * 授業動画の再生ページ（film.html）
 *   film.html?id=sanger            ブラウザで再生（音声つき・シーク可）
 *   film.html?id=sanger&render=1   書き出し用：window.__film.seek(t) で任意の時刻を描画
 * Every frame is computed from the clock alone, so playback and the rendered
 * MP4 show exactly the same thing.
 */
const BASE = import.meta.env.BASE_URL;
const q = new URLSearchParams(location.search);
const id = q.get('id') ?? 'sanger';
const rendering = q.get('render') === '1';
const W = +(q.get('w') ?? 1920), H = +(q.get('h') ?? 1080);

const root = document.getElementById('film')!;
root.classList.toggle('rendering', rendering);
const frame = document.createElement('div');
frame.className = 'film-frame';
const view = document.createElement('div');
view.className = 'film-view';
const ovHost = document.createElement('div');
ovHost.className = 'film-ov';
frame.append(view, ovHost);
root.append(frame);
if (rendering) {
  frame.style.width = W + 'px';
  frame.style.height = H + 'px';
}

async function boot() {
  const [timing] = await Promise.all([
    fetch(`${BASE}film/${id}/timing.json`).then((r) => r.json() as Promise<Timing>),
    loadDnaTemplate(BASE),
    document.fonts.ready,
  ]);
  const stage = new Stage(view, { manual: true, film: true, pixelRatio: rendering ? 1 : Math.min(devicePixelRatio, 1.5) });
  stage.controls.enabled = false;
  const clock = new Clock(timing);
  const ov = new Overlays(ovHost);
  const film = await buildSanger(stage, clock, ov);
  document.title = `${timing.title}｜授業動画 — GENE LAB 3D`;

  const draw = (t: number) => {
    film.update(t);
    stage.renderFrame(t);
  };

  if (rendering) {
    (window as unknown as { __film: unknown }).__film = {
      duration: timing.duration,
      seek: async (t: number) => {
        draw(t);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      },
    };
    draw(0);
    document.body.dataset.ready = '1';
    return;
  }

  // ---------------------------------------------------------------- player
  const audio = new Audio(`${BASE}film/${id}/narration.mp3`);
  audio.preload = 'auto';
  const bar = document.createElement('div');
  bar.className = 'film-controls';
  bar.innerHTML = `<button class="play" aria-label="再生">▶</button><input type="range" min="0" max="${timing.duration}" step="0.05" value="0" aria-label="再生位置"><span class="time">0:00 / ${fmt(timing.duration)}</span><div class="chapters"></div>`;
  root.append(bar);
  const play = bar.querySelector('.play') as HTMLButtonElement;
  const seek = bar.querySelector('input') as HTMLInputElement;
  const time = bar.querySelector('.time') as HTMLElement;
  const chapters = bar.querySelector('.chapters') as HTMLElement;
  for (const s of timing.scenes) {
    const b = document.createElement('button');
    b.textContent = s.label;
    b.onclick = () => { audio.currentTime = s.start; draw(s.start); };
    chapters.append(b);
  }
  play.onclick = () => (audio.paused ? audio.play() : audio.pause());
  audio.onplay = () => (play.textContent = '❚❚');
  audio.onpause = () => (play.textContent = '▶');
  seek.oninput = () => { audio.currentTime = +seek.value; draw(+seek.value); };
  addEventListener('keydown', (e) => { if (e.key === ' ') { e.preventDefault(); play.click(); } });
  let last = -1;
  const loop = () => {
    requestAnimationFrame(loop);
    const t = audio.currentTime;
    if (t === last && audio.paused) return;
    last = t;
    draw(t);
    seek.value = String(t);
    time.textContent = `${fmt(t)} / ${fmt(timing.duration)}`;
  };
  draw(0);
  loop();
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

boot().catch((e) => {
  console.error(e);
  root.insertAdjacentHTML('beforeend', `<p class="film-error">読み込みに失敗しました：${String(e)}</p>`);
});
