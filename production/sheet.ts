/** dev: rows of poses from mocap clips (?clips=a,b,c&n=12&face=0.6&from=0&to=end) */
import { bindCtx, g } from '../src/engine/story/kit';
import { camera, clip, perform } from '../src/engine/story/mocap';
import { drawActor } from '../src/engine/story/body';
import { TAG } from '../src/content/courses/histology-nucleus/story/cast';

const q = new URLSearchParams(location.search);
const ids = (q.get('clips') || 'walk').split(',');
const n = +(q.get('n') || 12), face = +(q.get('face') || 0.6);
const cv = document.getElementById('c') as HTMLCanvasElement; bindCtx(cv.getContext('2d')!);
g.fillStyle = '#3a3f4a'; g.fillRect(0, 0, 1280, 720);
const rows = ids.length, rh = 720 / rows, dist = 10, f = (rh * 0.78 * dist) / 1.75;
const cam = camera({ x: 0, y: 0.88, z: dist, tx: 0, ty: 0.88, tz: 0, f });
const halfW = (600 * dist) / f;
ids.forEach((id, r) => {
  const c = clip(id), dur = c.frames.length / c.fps;
  const a = +(q.get('from') || 0), b = Math.min(dur, +(q.get('to') || dur));
  g.save(); g.translate(0, r * rh + rh / 2 - 360 - rh * 0.04);
  for (let i = 0; i < n; i++) {
    const t = a + ((b - a) * i) / (n - 1) * 0.999, x = -halfW + (2 * halfW * i) / (n - 1);
    drawActor(cam, { look: TAG, pose: perform([{ clip: id, at: 0, from: t, x, z: 0, face }], 0), face: { blink: 0 }, t });
    g.fillStyle = '#fff'; g.font = '700 13px sans-serif'; g.textAlign = 'center'; g.fillText(t.toFixed(1), cam.proj([x, 0, 0]).x, cam.proj([0, 0, 0]).y + 16);
  }
  g.restore();
  g.fillStyle = '#ffd36b'; g.font = '700 16px sans-serif'; g.textAlign = 'left'; g.fillText(`${id} ${dur.toFixed(1)}s`, 6, r * rh + 18);
});
(window as unknown as { ready: boolean }).ready = true;
