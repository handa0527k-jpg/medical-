import { test, expect } from '@playwright/test';

test('genetics: 🎬 授業動画 studio — material, recommended theme, controls, synced preview, scene sheets', async ({ page }) => {
  test.setTimeout(240_000); // whole-lecture films are planned and timed in this one test
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  // entry from the 遺伝学 page; other fields are untouched
  await page.goto('/#/category/genetics');
  await expect(page.locator('.cat-film')).toContainText('授業動画');
  await expect(page.locator('.cblock').first()).toBeVisible();
  await page.goto('/#/category/histology');
  await expect(page.locator('.cat-film')).toHaveCount(0);

  // opens on the finished film (第1講まるごと)
  await page.goto('/#/category/genetics/video');
  await expect(page.locator('.lv-head h1')).toContainText('授業動画');
  await expect(page.locator('.lv-scene')).toHaveCount(18, { timeout: 20000 });
  await expect(page.locator('.lv-form select').nth(1)).toHaveValue('genetics-basics:1:film');
  await expect(page.locator('.lv-status')).toContainText('Kokoro', { timeout: 15000 });
  await expect(page.locator('.lv-scene').nth(9)).toContainText('RNAポリメラーゼ');
  // every lecture of the unit (第1〜6講まるごと) is offered as a finished film
  await expect(page.locator('.lv-form select').nth(1).locator('optgroup[label="完成版"] option')).toHaveCount(6);
  await page.goto('/#/category/genetics/video?theme=genetics-basics:2:film');
  await expect(page.locator('.lv-scene')).toHaveCount(20, { timeout: 20000 });
  await expect(page.locator('.lv-status')).toContainText('Kokoro', { timeout: 15000 });
  await expect(page.locator('.lv-scene').nth(4)).toContainText('シドはリン酸なし');
  await expect(page.locator('.lv-scene').nth(11)).toContainText('c02-0067');
  // the 30 s prototype theme
  await page.goto('/#/category/genetics/video?theme=genetics-basics:1:2');
  // honest about what runs where
  await expect(page.locator('.lv-honest')).toContainText('実行しません');
  // the theme comes from the material: 第1講 テーマ1, with slide 14 and question g14b
  await expect(page.locator('.lv-rec h2')).toContainText('設計図の正体はDNA');
  await expect(page.locator('.lv-rec')).toContainText('g14b');
  // the five selectors
  for (const l of ['教材を選択', 'テーマを選択', '動画時間', '授業スタイル', 'アニメーション強度']) await expect(page.locator('.lv-form')).toContainText(l);
  await expect(page.locator('.lv-form fieldset').nth(2).locator('button')).toHaveText(['標準', '劇画', '超劇画']);
  // shipped Kokoro voice → measured timing
  await expect(page.locator('.lv-status')).toContainText('Kokoro', { timeout: 15000 });
  // the canvas draws
  const painted = async () => page.locator('.lv-screen canvas').evaluate((c: HTMLCanvasElement) => { const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] + d[i + 1] + d[i + 2] > 40) n++; return n; });
  expect(await painted()).toBeGreaterThan(20);
  // scene sheets: source, Wan prompt, timecoded script with events
  await expect(page.locator('.lv-scene')).toHaveCount(5);
  await expect(page.locator('.lv-scene').first()).toContainText('c01-0026');
  await expect(page.locator('.lv-scene').nth(3)).toContainText('DNAを加えたときだけでした');
  await expect(page.locator('.lv-scene').nth(3)).toContainText('▶ カメラ急接近');
  await expect(page.locator('.lv-scene').first().locator('.lv-svg svg')).toHaveCount(1);
  // play a moment
  await page.locator('.lv-ctl .pri').click();
  await expect(page.locator('.lv-ctl .pri')).toContainText('一時停止');
  await page.waitForTimeout(800);
  await page.locator('.lv-ctl .pri').click();
  // intensity changes effects, not the words
  const words = await page.locator('.lv-sync li.say').allTextContents();
  await page.locator('.lv-form fieldset').nth(2).locator('button', { hasText: '超劇画' }).click();
  await expect(page).toHaveURL(/k=ultra/);
  expect(await page.locator('.lv-sync li.say').allTextContents()).toEqual(words);
  // 60 s adds the question scene
  await page.locator('.lv-form fieldset').first().locator('button', { hasText: '60秒' }).click();
  await expect(page.locator('.lv-scene')).toHaveCount(6);
  await expect(page.locator('.lv-scene').last()).toContainText('g14b');
  expect(errs).toEqual([]);
});

test('授業動画: the production package downloads with every file the Windows side needs', async ({ page }) => {
  await page.goto('/#/category/genetics/video?theme=genetics-basics:1:2&d=30&style=board&k=gekiga');
  await expect(page.locator('.lv-scene')).toHaveCount(5);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '制作パッケージ（ZIP）' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^medstudy_genetics-basics-1-2_30s_board_gekiga\.zip$/);
  const buf = await (await dl.createReadStream()).toArray().then((c) => Buffer.concat(c));
  const s = buf.toString('latin1');
  for (const f of ['medstudy_video.json', 'script.md', 'kokoro/script.json', 'edit.json', 'subtitles.ass', 'comfy/ti2v-5b/S04_b.api.json', 'keyframes/S01_a.png', 'diagrams/S02_strains.svg']) expect(s, f).toContain(f);
});

test('授業動画: the finished 30 s prototype film is served and plays in MEDSTUDY', async ({ page, request }) => {
  const idx = await (await request.get('/lecture-video/index.json')).json();
  const v = idx.videos['genetics-basics:1:2|30|board|gekiga'];
  expect(v).toBeTruthy();
  expect(v.seconds).toBeGreaterThan(27);
  expect(v.seconds).toBeLessThan(34);
  const film = idx.videos['genetics-basics:1:film|full|board|gekiga'];
  expect(film).toBeTruthy();
  expect(film.seconds).toBeGreaterThan(200);
  expect((await request.get(`/lecture-video/${film.file}`)).status()).toBe(200);
  const film2 = idx.videos['genetics-basics:2:film|full|board|gekiga'];
  expect(film2).toBeTruthy();
  expect(film2.seconds).toBeGreaterThan(300);
  expect((await request.get(`/lecture-video/${film2.file}`)).status()).toBe(200);
  for (const n of [3, 4, 5, 6]) {
    const f = idx.videos[`genetics-basics:${n}:film|full|board|gekiga`];
    expect(f, `第${n}講`).toBeTruthy();
    expect(f.seconds).toBeGreaterThan(300);
    expect((await request.get(`/lecture-video/${f.file}`)).status()).toBe(200);
  }
  const r = await request.get(`/lecture-video/${v.file}`);
  expect(r.status()).toBe(200);
  await page.goto('/#/category/genetics/video?theme=genetics-basics:1:2&d=30&style=board&k=gekiga');
  await expect(page.locator('.lv-final video')).toHaveCount(1);
  await expect(page.locator('.lv-final .lv-note').first()).toContainText('Wan 2.2 映像は 0/8 ショット');
  // the duration is read where the browser can decode H.264 (Playwright's open-source Chromium cannot)
  const h264 = await page.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"'));
  if (h264) {
    const dur = await page.locator('.lv-final video').evaluate((el: HTMLVideoElement) => new Promise<number>((res) => { if (el.readyState >= 1) res(el.duration); else el.addEventListener('loadedmetadata', () => res(el.duration)); }));
    expect(dur).toBeGreaterThan(27);
  }
});
