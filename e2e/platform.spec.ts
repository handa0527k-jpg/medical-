import { test, expect, type Page } from '@playwright/test';

function watchErrors(page: Page) {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/fonts\.(googleapis|gstatic)|ERR_CERT|net::ERR_/.test(t + (m.location().url || ''))) return;
    errs.push('console: ' + t);
  });
  return errs;
}

const FIELDS = ['組織学', '人体発生学', '遺伝学', '細胞生物学', '生化学', '生理学', '解剖学', '免疫学', '病理学', '薬理学', '微生物学', 'その他'];

test('home: every medical field as a card with description, course count, progress and a 学習する button', async ({ page }) => {
  const errs = watchErrors(page);
  await page.goto('/#/');
  const cards = page.locator('.cat-card');
  await expect(cards).toHaveCount(FIELDS.length);
  await expect(cards.locator('h3')).toHaveText(FIELDS);
  const histo = cards.filter({ hasText: '組織学' }).first();
  await expect(histo).toContainText('上皮組織・結合組織・細胞・核など');
  await expect(histo).toContainText('2教材');
  await expect(histo).toContainText('進捗');
  await expect(histo).toContainText('学習する');
  await expect(cards.filter({ hasText: '薬理学' })).toContainText('準備中');
  // phones: one column; desktop: several
  const vw = page.viewportSize()!.width;
  const xs = new Set(await cards.evaluateAll((els) => els.slice(0, 4).map((e) => Math.round(e.getBoundingClientRect().left))));
  if (vw < 600) expect(xs.size).toBe(1); else expect(xs.size).toBeGreaterThan(1);
  expect(errs).toEqual([]);
});

test('field → course → lecture: opens the course in place, with lecture status chips', async ({ page }) => {
  const errs = watchErrors(page);
  // learner history: embryology lecture 1 finished, lecture 2 half watched
  await page.addInitScript(() => {
    if (localStorage.getItem('seeded')) return;
    localStorage.setItem('seeded', '1');
    localStorage.setItem('medstudy:course', JSON.stringify('histology-cytoplasm'));
    const now = Date.now();
    localStorage.setItem('medstudy:progress:embryology-early:v1', JSON.stringify({
      version: 1, courseId: 'embryology-early', read: {}, pages: {}, answers: [], questions: {}, animations: {}, reviews: [], studyLog: {}, recent: [], settings: {},
      lectures: { 1: { position: 700, maxPosition: 700, total: 700, completed: true, seconds: 700, lastAt: now }, 2: { position: 400, maxPosition: 400, total: 800, completed: false, seconds: 400, lastAt: now } },
    }));
  });
  await page.goto('/#/');
  await page.locator('.cat-card', { hasText: '人体発生学' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '人体発生学' })).toBeVisible();
  const rows = page.locator('.lec-row');
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(0)).toContainText('完了');
  await expect(rows.nth(1)).toContainText('学習中');
  await expect(rows.nth(2)).toContainText('未視聴');
  await expect(page.locator('.cblock .st-chip').first()).toContainText('学習中');
  // the other tabs
  await page.getByRole('tab', { name: /講義資料/ }).click();
  await expect(page.locator('.mat-tiles')).toContainText('教科書');
  await page.getByRole('tab', { name: /確認問題/ }).click();
  await expect(page.locator('.lec-row').first()).toContainText('5択');
  await page.getByRole('tab', { name: /復習/ }).click();
  await expect(page.locator('.mat-tiles')).toContainText('弱点復習');
  await page.getByRole('tab', { name: /授業動画/ }).click();
  // open lecture 3 of a course that is not the open one — no page reload
  await page.evaluate(() => { (window as unknown as { marker: number }).marker = 1; });
  await page.locator('.lec-row').nth(2).click();
  await expect(page).toHaveURL(/#\/lecture\/3$/);
  await expect(page.locator('.lecp .lhd')).toContainText('第3講');
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('medstudy:course')!))).toBe('embryology-early');
  await expect(page.locator('.lec-side')).toContainText('講義一覧');
  expect(errs).toEqual([]);
});

test('lecture full screen: fills the window, hides the lecture list, controls auto-hide, Esc returns', async ({ page }) => {
  const errs = watchErrors(page);
  await page.route('**/audio/**', (r) => r.abort());
  await page.addInitScript(() => localStorage.setItem('medstudy:course', JSON.stringify('embryology-early')));
  await page.goto('/#/lecture/2');
  await page.getByRole('button', { name: /授業を始める/ }).click();
  await page.getByRole('button', { name: '全画面', exact: true }).click();
  const box = page.locator('.lecp.fs');
  await expect(box).toBeVisible();
  const vp = page.viewportSize()!;
  const r = (await box.boundingBox())!;
  expect(Math.round(r.width)).toBe(vp.width);
  expect(Math.round(r.height)).toBe(vp.height);
  // 16:9 lecture screen centred (portrait phones use the whole screen)
  const f = (await page.locator('.fs-frame').boundingBox())!;
  if (vp.width > vp.height) expect(Math.abs(f.width / f.height - 16 / 9)).toBeLessThan(0.02);
  await expect(page.locator('.lec-side')).toBeHidden();
  const ui = page.locator('.fsui');
  for (const name of ['一時停止', '10秒戻る', '10秒進む', '再生速度 1倍', '字幕', '全画面を終了']) await expect(ui.getByRole('button', { name })).toBeVisible();
  await expect(ui.getByRole('slider', { name: '音量' })).toBeAttached();
  await expect(ui.getByRole('slider', { name: '授業の再生位置' })).toBeVisible();
  // speed menu
  await ui.getByRole('button', { name: '再生速度 1倍' }).click();
  await ui.getByRole('menuitemradio', { name: '1.5×' }).click();
  await expect(ui.getByRole('button', { name: '再生速度 1.5倍' })).toBeVisible();
  // controls hide while playing and the pointer rests
  await page.waitForTimeout(3200);
  await expect(ui).not.toHaveClass(/\bon\b/);
  await page.mouse.move(200, 200);
  await page.mouse.move(220, 210);
  await expect(ui).toHaveClass(/\bon\b/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.lecp.fs')).toHaveCount(0);
  await expect(page.locator('.lec-side')).toBeVisible();
  expect(errs).toEqual([]);
});
