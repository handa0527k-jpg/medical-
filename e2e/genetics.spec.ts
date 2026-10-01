import { test, expect, type Page } from '@playwright/test';

/** Blackboard lecture course (遺伝子の基礎). */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('medstudy:course', JSON.stringify('genetics-basics')));
});

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

/** share of canvas pixels that differ from the slate colour → chalk has been drawn */
const chalkShare = (page: Page, sel = '.bbcv') => page.locator(sel).first().evaluate((c: HTMLCanvasElement) => {
  const g = c.getContext('2d')!;
  const { data } = g.getImageData(0, 0, c.width, c.height);
  let bright = 0;
  for (let i = 0; i < data.length; i += 16) if (data[i] + data[i + 1] + data[i + 2] > 420) bright++;
  return bright / (data.length / 16);
});

const ROUTES = ['/', '/book', '/chapter/1', '/chapter/3', '/chapter/6', '/lectures', '/lecture/1', '/lecture/2/board', '/review5/4', '/figures', '/figures/gene', '/animations', '/animations/meiosis', '/zukan', '/quiz', '/quiz/play?chapter=5', '/review', '/stats'];

test('every genetics screen renders without errors or horizontal scrolling', async ({ page }) => {
  const errs = watchErrors(page);
  for (const r of ROUTES) {
    await page.goto('/#' + r);
    await expect(page.locator('main')).not.toBeEmpty();
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${r}`).toBeLessThanOrEqual(1);
  }
  expect(errs).toEqual([]);
});

test('home shows today\'s lecture with board and 5-minute review shortcuts', async ({ page }) => {
  await page.goto('/#/');
  const card = page.locator('.today-lec');
  await expect(card).toContainText('今日の授業：第1講');
  await expect(card.getByRole('link', { name: '板書だけを見る' })).toBeVisible();
  await card.getByRole('link', { name: '5分復習' }).click();
  await expect(page.getByRole('heading', { name: /5分復習/ })).toBeVisible();
});

test('blackboard lecture: chalk accumulates on the board as the lecture runs', async ({ page }) => {
  await page.route('**/audio/**', (r) => r.abort());
  const errs = watchErrors(page);
  await page.goto('/#/lecture/1?t=60');
  await expect(page.locator('.lbb .bbcv')).toBeVisible();
  await page.waitForTimeout(600);
  const early = await chalkShare(page);
  await page.goto('/#/lecture/1?t=560');
  await expect(page.locator('.lbb .bbcv')).toBeVisible();
  await page.waitForTimeout(600);
  const late = await chalkShare(page);
  expect(early).toBeGreaterThan(0.001);
  expect(late).toBeGreaterThan(early);
  // the player offers the required controls
  for (const s of ['0.75×', '1×', '1.25×', '1.5×', '2×']) await expect(page.getByRole('button', { name: s, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '重要ポイントだけ' })).toBeVisible();
  await expect(page.getByRole('link', { name: '板書だけを見る' })).toBeVisible();
  expect(errs).toEqual([]);
});

test('blackboard lecture: quiz explanation shows the matching place on the board', async ({ page }) => {
  await page.route('**/audio/**', (r) => r.abort());
  await page.goto('/#/lecture/1');
  await page.getByRole('button', { name: /授業を始める/ }).click();
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.locator('.lscr summary').click();
  await page.locator('.lsl2 button', { hasText: '正解はBの転写です' }).first().click();
  await expect(page.locator('.qpanel')).toBeVisible();
  // on phones the stage is too small for an inset; it is shown from tablet width up
  test.skip(page.viewportSize()!.width < 700, 'inset hidden on phones');
  await expect(page.locator('.qboard canvas')).toBeVisible();
  await page.waitForTimeout(400);
  expect(await chalkShare(page, '.qboard canvas')).toBeGreaterThan(0.002);
});

test('finished-board viewer: panels, key points and write-order replay', async ({ page }) => {
  const errs = watchErrors(page);
  await page.goto('/#/lecture/3/board');
  await expect(page.getByText('完成した黒板')).toBeVisible();
  await page.waitForTimeout(500);
  expect(await chalkShare(page)).toBeGreaterThan(0.01);
  await page.getByRole('button', { name: '試験ポイント' }).click();
  await page.locator('.bvk').first().click();
  await expect(page.getByRole('link', { name: /授業のこの場面/ }).first()).toBeVisible();
  await page.getByRole('button', { name: /書き順で再生/ }).click();
  await expect(page.getByText('書き順を再生中')).toBeVisible();
  await page.getByRole('button', { name: '■ 停止' }).click();
  expect(errs).toEqual([]);
});

test('5-minute review: board → key points → figure → 5 questions → mistakes', async ({ page }) => {
  const errs = watchErrors(page);
  await page.goto('/#/review5/2');
  await expect(page.locator('.qr-board canvas')).toBeVisible();
  await page.getByRole('button', { name: /次へ：今日の重要事項/ }).click();
  await page.locator('.bvk').first().click();
  await expect(page.locator('.qr-board.sm canvas')).toBeVisible();
  await page.getByRole('button', { name: /次へ：重要図解/ }).click();
  await expect(page.locator('.ifig')).toBeVisible();
  await page.getByRole('button', { name: /次へ：5問確認/ }).click();
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.opts .op')).toHaveCount(5);
    await page.locator('.opts .op').first().click();
    await page.getByRole('button', { name: /次の問題|間違えたポイントへ/ }).click();
  }
  await expect(page.getByText('今回の5問')).toBeVisible();
  expect(errs).toEqual([]);
});

test('analysis explains why answers were wrong', async ({ page }) => {
  await page.goto('/#/quiz/play?chapter=1');
  for (let i = 0; i < 12; i++) {
    await page.locator('.opts .op').first().click();
    const why = page.locator('.qres .why');
    if (await why.count()) await expect(why).toContainText('つまずきのタイプ');
    const next = page.getByRole('button', { name: /次の問題|結果を見る/ });
    await next.click();
    if (await page.getByText('RESULT').isVisible()) break;
  }
  await page.goto('/#/stats');
  await expect(page.getByRole('heading', { name: /なぜ間違えたのか/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /テーマ別の理解度/ })).toBeVisible();
});

test('blackboard lecture uses the recorded neural narration', async ({ page }) => {
  const errs = watchErrors(page);
  await page.goto('/#/lecture/4');
  await expect(page.locator('.voice-src.audio')).toContainText('Nanami', { timeout: 20_000 });
  const total = (await page.locator('.tm').textContent())!.split('/')[1].trim();
  const min = Number(total.split(':')[0]);
  expect(min).toBeGreaterThanOrEqual(5);
  expect(min).toBeLessThanOrEqual(16);
  await page.getByRole('button', { name: /授業を始める/ }).click();
  await expect(page.locator('.lsub .s')).toContainText('第4講');
  await page.waitForTimeout(4000);
  expect(await page.locator('.tm').textContent()).not.toMatch(/^00:0[0-1] /);
  expect(errs).toEqual([]);
});
