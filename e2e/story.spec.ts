import { test, expect } from '@playwright/test';

const COURSES: [string, string][] = [
  ['histology-epithelium', 'コウと揺れる街'],
  ['histology-nucleus', '午前二時の本社ビル'],
  ['histology-cytoplasm', '十二分間の旅'],
  ['genetics-basics', '設計図の図書館'],
  ['embryology-early', '生命史線の夜行列車'],
];

for (const [id, title] of COURSES) {
  test(`story anime (${id}): listed first on アニメ, plays with voice and subtitles, scene chips, fullscreen`, async ({ page }) => {
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`/#/open/${id}/animations`);
    const hero = page.locator('.story-hero');
    await expect(hero).toContainText(title);
    await expect(page.locator('.anim-sec')).toContainText('機序アニメ');
    await hero.click();
    await expect(page.locator('.story-page h1')).toHaveText(title);
    await expect(page.locator('.story-who').first()).toBeVisible();
    await expect(page.locator('.story-table').first().locator('tbody tr').first()).toBeVisible();
    // the canvas has drawn something before playback
    const painted = await page.locator('.story-screen canvas').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] + d[i + 1] + d[i + 2] > 30) n++; return n;
    });
    expect(painted).toBeGreaterThan(50);
    await page.locator('.story-start button').click();
    await expect(page.locator('.story-ctl .pri')).toContainText('一時停止');
    // from the beginning the opening plays first, with a skip button on the picture
    await expect(page.locator('.story-tm')).toContainText('OP');
    await page.locator('.story-skip').click();
    await expect(page.locator('.story-skip')).toHaveCount(0);
    await expect(page.locator('.story-sub')).toBeVisible({ timeout: 8000 });
    // jump to the third scene (the first chip is the OP)
    const chip = page.locator('.story-chips button').nth(3);
    await chip.click();
    await expect(chip).toHaveClass(/on/);
    // fullscreen and Esc back
    await page.getByRole('button', { name: '全画面', exact: true }).click();
    await expect(page.locator('.story-player')).toHaveClass(/fs/);
    const box = await page.locator('.story-screen').boundingBox();
    const vp = page.viewportSize()!;
    expect(box!.width).toBeGreaterThan(vp.width * 0.5);
    await page.keyboard.press('Escape');
    await expect(page.locator('.story-player')).not.toHaveClass(/fs/);
    await page.locator('.story-ctl .pri').click();
    await expect(page.locator('.story-ctl .pri')).toContainText('再生');
    expect(errs).toEqual([]);
  });
}

test('genetics opening: any playback position draws its frame (?t=), across all six cuts', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  for (const t of [3, 12, 20, 27, 32, 34, 36, 37.9, 42]) {
    await page.goto(`/#/open/genetics-basics/animations/story?t=${t}`);
    await expect(page.locator('.story-tm')).toContainText(`0:${String(Math.floor(t)).padStart(2, '0')}`);
    const painted = await page.locator('.story-screen canvas').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] + d[i + 1] + d[i + 2] > 40) n++; return n;
    });
    expect(painted, `frame at ${t}s`).toBeGreaterThan(40);
  }
  // playback continues from the requested position
  await page.locator('.story-start button').click();
  await expect(page.locator('.story-ctl .pri')).toContainText('一時停止');
  await expect(page.locator('.story-sub')).toContainText('おかしいな', { timeout: 8000 });
  expect(errs).toEqual([]);
});

test('genetics full film: a frame from every scene draws without errors (?t=)', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  // library, letters, pack, meiosis, read, typo, jump, notes, close
  for (const t of [70, 160, 280, 380, 470, 580, 660, 750, 845]) {
    await page.goto(`/#/open/genetics-basics/animations/story?t=${t}`);
    await expect(page.locator('.story-tm')).toContainText(`${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
    const painted = await page.locator('.story-screen canvas').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] + d[i + 1] + d[i + 2] > 40) n++; return n;
    });
    expect(painted, `frame at ${t}s`).toBeGreaterThan(40);
  }
  expect(errs).toEqual([]);
});

test('nucleus film (午前二時の本社ビル): a frame from every scene draws (?t=), and the sound bed is served', async ({ page, request }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  // hq, gate, archive, nucleolus, split, branch, dawn
  for (const t of [20, 110, 230, 320, 420, 520, 600]) {
    await page.goto(`/#/open/histology-nucleus/animations/story?t=${t}`);
    await expect(page.locator('.story-tm')).toContainText(`${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
    const painted = await page.locator('.story-screen canvas').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] + d[i + 1] + d[i + 2] > 40) n++; return n;
    });
    expect(painted, `frame at ${t}s`).toBeGreaterThan(40);
  }
  expect(errs).toEqual([]);
  const bed = await request.get('/courses/histology-nucleus/story/bed.mp3');
  expect(bed.ok()).toBe(true);
});

test('transcription film (写字室の朝): every scene draws, music and effects are served, the BGM control works', async ({ page, request }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  // morning, mirror, annex, reception, edit, ncrna, noon
  for (const t of [40, 110, 230, 380, 480, 560, 650]) {
    await page.goto(`/#/open/genetics-transcription/animations/story?t=${t}`);
    await expect(page.locator('.story-tm')).toContainText(`${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
    const painted = await page.locator('.story-screen canvas').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] + d[i + 1] + d[i + 2] > 40) n++; return n;
    });
    expect(painted, `frame at ${t}s`).toBeGreaterThan(40);
  }
  // music on/off and volume, remembered across visits
  const bgm = page.locator('.story-bgm button');
  await expect(bgm).toHaveAttribute('aria-pressed', 'true');
  await bgm.click();
  await expect(bgm).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.locator('.story-bgm button')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('.story-bgm button').click();
  await page.locator('.story-bgm input').fill('0.4');
  expect(errs).toEqual([]);
  for (const f of ['story.mp3', 'bgm.mp3', 'fx.mp3']) expect((await request.get(`/courses/genetics-transcription/story/${f}`)).ok(), f).toBe(true);
});

test('transcription course: every mechanism animation plays its steps; links to the textbook and questions', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('/#/open/genetics-transcription/animations');
  await expect(page.locator('.story-hero')).toContainText('写字室の朝');
  await expect(page.locator('.story-rel')).toContainText('設計図の図書館');
  for (const id of ['template', 'bacteria', 'lac', 'euinit', 'clock', 'splice', 'mirna']) {
    await page.goto(`/#/open/genetics-transcription/animations/${id}?t=30`);
    await expect(page.locator('.astage .stage-host svg').first()).toBeAttached();
    await expect(page.locator('.anim-t')).toBeVisible();
    await expect(page.getByRole('link', { name: /章の問題/ })).toBeVisible();
  }
  expect(errs).toEqual([]);
});

test('the screen is kept on while a film plays and released on pause (Screen Wake Lock)', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __wl: { req: number; rel: number } };
    w.__wl = { req: 0, rel: 0 };
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => { w.__wl.req++; const s = { released: false, release: async () => { s.released = true; w.__wl.rel++; } }; return s; } } });
  });
  await page.goto('/#/open/genetics-transcription/animations/story?t=20');
  await page.locator('.story-start button').click();
  await expect(page.locator('.story-ctl .pri')).toContainText('一時停止');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __wl: { req: number } }).__wl.req)).toBeGreaterThan(0);
  await page.locator('.story-ctl .pri').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __wl: { rel: number } }).__wl.rel)).toBeGreaterThan(0);
  // mechanism animation player too
  await page.goto('/#/open/genetics-transcription/animations/lac');
  const before = await page.evaluate(() => (window as unknown as { __wl: { req: number } }).__wl.req);
  await page.getByRole('button', { name: /再生/ }).first().click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __wl: { req: number } }).__wl.req)).toBeGreaterThan(before);
});

test('animations have the lecture controls: speed (remembered), scene / 10 s skips, full screen', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const sec = async () => { const s = (await page.locator('.story-tm').textContent()) || ''; const [m, x] = s.split('/')[0].trim().split(':').map(Number); return m * 60 + x; };
  // story anime: 2× plays about twice as fast
  await page.goto('/#/open/genetics-transcription/animations/story?t=20');
  await page.locator('.story-spd button', { hasText: '2×' }).click();
  await expect(page.locator('.story-spd button', { hasText: '2×' })).toHaveAttribute('aria-checked', 'true');
  await page.locator('.story-start button').click();
  await expect(page.locator('.story-ctl .pri')).toContainText('一時停止');
  const t0 = await sec(); await page.waitForTimeout(4000); const t1 = await sec();
  expect(t1 - t0, 'film seconds advanced in 4 s at 2×').toBeGreaterThanOrEqual(6);
  await page.locator('.story-ctl .pri').click();
  // next / previous scene
  await page.getByRole('button', { name: '次の場面' }).click();
  await expect(page.locator('.story-chips button.on')).toContainText('鏡の向きで写す');
  await page.getByRole('button', { name: '前の場面' }).click();
  await expect(page.locator('.story-chips button.on')).toContainText('朝の閲覧票');
  // the speed is remembered and shared with the mechanism animations
  await page.goto('/#/open/genetics-transcription/animations/lac');
  await expect(page.locator('.actl .spd button', { hasText: '2×' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.actl .spd button', { hasText: '1.25×' }).click();
  await page.reload();
  await expect(page.locator('.actl .spd button', { hasText: '1.25×' })).toHaveAttribute('aria-pressed', 'true');
  // 10 s skip and full screen
  await page.getByRole('button', { name: '10秒進む' }).click();
  await expect(page.locator('.actl .tm')).toContainText('0:10');
  await page.getByRole('button', { name: '全画面', exact: true }).click();
  await expect(page.locator('.anim.fs')).toBeVisible();
  await page.getByRole('button', { name: '全画面を終了' }).click();
  await expect(page.locator('.anim.fs')).toHaveCount(0);
  expect(errs).toEqual([]);
});

test('opening and ending: OP first with a skip button, songs served, every shot draws, ED after the film', async ({ page, request }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  for (const f of ['op-shining-star.mp3', 'ed-the-milky-way.mp3']) {
    const r = await request.get(`/music/${f}`);
    expect(r.status(), f).toBe(200);
    expect((await r.body()).length).toBeGreaterThan(500_000);
  }
  // a frame of every OP / ED section draws (?op= / ?ed= open the player there)
  const blank = (c: HTMLCanvasElement) => { const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4000) if (d[i] + d[i + 1] + d[i + 2] > 30) n++; return n; };
  for (const [k, ts] of [['op', [3, 8, 12, 25, 40, 50, 60, 66, 72, 84]], ['ed', [5, 20, 60, 90, 104]]] as const) {
    for (const t of ts) {
      await page.goto(`/#/open/genetics-transcription/animations/story?${k}=${t}`);
      await expect(page.locator('.story-skip')).toContainText(k === 'op' ? 'OPをスキップ' : 'EDをスキップ');
      await expect(page.locator('.story-tm')).toContainText(k.toUpperCase());
      expect(await page.locator('.story-screen canvas').evaluate(blank), `${k}=${t}`).toBeGreaterThan(50);
    }
  }
  // the ED's skip finishes the film; the ED chip brings it back
  await page.locator('.story-skip').click();
  await expect(page.locator('.story-skip')).toHaveCount(0);
  await page.locator('.story-chips button', { hasText: 'ED' }).click();
  await expect(page.locator('.story-skip')).toContainText('EDをスキップ');
  await expect(page.locator('.story-ctl .pri')).toContainText('一時停止');
  // the end of the film rolls into the ending
  await page.goto('/#/open/genetics-basics/animations/story?t=99999');
  await page.locator('.story-start button').click();
  await expect(page.locator('.story-skip')).toContainText('EDをスキップ', { timeout: 10000 });
  expect(errs).toEqual([]);
});
