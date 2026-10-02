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
    await expect(page.locator('.story-sub')).toBeVisible({ timeout: 8000 });
    // jump to the third scene
    const chip = page.locator('.story-chips button').nth(2);
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
  const bed = await request.get('/courses/histology-nucleus/story/bed.m4a');
  expect(bed.ok()).toBe(true);
});
