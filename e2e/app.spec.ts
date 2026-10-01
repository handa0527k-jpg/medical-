import { test, expect, type Page } from '@playwright/test';

/** Collect page errors / console errors, ignoring the web-font request (blocked in some CI sandboxes). */
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

/** Deterministic fake speech engine: speaks at ~12 chars/s and fires onend. */
async function mockSpeech(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    const spoken: string[] = [];
    w.__spoken = spoken;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cur: { onend?: () => void } | null = null;
    const synth = {
      speaking: false,
      pending: false,
      getVoices: () => [{ name: 'Kyoko (Enhanced)', lang: 'ja-JP', voiceURI: 'kyoko', localService: true, default: true }],
      addEventListener() {},
      removeEventListener() {},
      cancel() { if (timer) clearTimeout(timer); synth.speaking = false; const c = cur; cur = null; c?.onend?.(); },
      speak(u: { text: string; onend?: () => void }) {
        spoken.push(u.text);
        synth.speaking = true;
        cur = u;
        timer = setTimeout(() => { synth.speaking = false; if (cur === u) { cur = null; u.onend?.(); } }, Math.max(400, (u.text.length / 12) * 1000));
      },
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function (this: { text: string }, t: string) { this.text = t; }, configurable: true });
  });
}

const ROUTES = ['/', '/book', '/chapter/1', '/chapter/8', '/lectures', '/lecture/1', '/figures', '/figures/cell', '/animations', '/animations/sec', '/zukan', '/quiz', '/quiz/play?chapter=1', '/quiz/judge?chapter=2', '/review', '/stats', '/settings'];

test('every screen renders without errors or horizontal scrolling', async ({ page }) => {
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

const NUC_ROUTES = ['/', '/book', '/chapter/3', '/lectures', '/figures', '/figures/nuc', '/figures/chr', '/animations', '/animations/mitosis', '/animations/ribo', '/animations/renew', '/zukan', '/quiz/play?chapter=5', '/quiz/judge?chapter=4', '/stats'];

test('second course (核・細胞周期): every screen renders, with its own metaphor and recorded lectures', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('medstudy:course', JSON.stringify('histology-nucleus')));
  const errs = watchErrors(page);
  for (const r of NUC_ROUTES) {
    await page.goto('/#' + r);
    await expect(page.locator('main')).not.toBeEmpty();
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${r}`).toBeLessThanOrEqual(1);
  }
  await page.goto('/#/');
  await expect(page.locator('h1')).toContainText('本社');
  await expect(page.locator('h1')).not.toContainText('工場');
  await page.goto('/#/quiz/play?chapter=5');
  await expect(page.locator('.opts .op')).toHaveCount(5);
  await page.goto('/#/lecture/5');
  await expect(page.locator('.voice-src.audio')).toContainText('Nanami', { timeout: 20_000 });
  await page.getByRole('button', { name: /授業を始める/ }).click();
  await expect(page.locator('.lsub .s')).toContainText('第5講');
  expect(errs).toEqual([]);
});

test('5-choice question: A–E, explanations, persistence, review', async ({ page }) => {
  const errs = watchErrors(page);
  await page.goto('/#/quiz/play?chapter=1');
  const opts = page.locator('.opts .op');
  await expect(opts).toHaveCount(5);
  await expect(page.locator('.opts .op .L')).toHaveText(['A', 'B', 'C', 'D', 'E']);
  await expect(page.getByRole('button', { name: /出典：PDF スライド/ })).toHaveCount(0);
  // choose a wrong option deliberately: find one not marked correct after answering is impossible beforehand → answer A
  await opts.first().click();
  await expect(page.locator('.verdict')).toBeVisible();
  await expect(page.locator('.op .nt')).toHaveCount(5); // every option has its explanation
  await expect(page.locator('.xpl')).toContainText('解説');
  await expect(page.locator('.trap')).toContainText('重要ポイント');
  await page.getByRole('button', { name: /出典：PDF スライド/ }).click();
  await expect(page.locator('.src-drawer img')).toBeVisible();
  // answer the remaining questions (always option A) until the result screen
  for (let i = 0; i < 20; i++) {
    const next = page.getByRole('button', { name: /次の問題|結果を見る/ });
    await next.click();
    if (await page.locator('.bignum').isVisible()) break;
    await page.locator('.opts .op').first().click();
  }
  await expect(page.getByText('RESULT')).toBeVisible();
  // persisted
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('medstudy:progress:histology-cytoplasm:v1') || '{"answers":[]}'));
  await expect.poll(async () => (await read()).answers.length).toBeGreaterThanOrEqual(12);
  const stored = await read();
  // survives reload and feeds analytics / review
  await page.reload();
  await page.goto('/#/stats');
  await expect(page.locator('.stat').first()).toContainText('%');
  await page.goto('/#/review');
  await expect(page.getByRole('heading', { name: '弱点復習' })).toBeVisible();
  const wrong = stored.answers.filter((a: { correct: boolean }) => !a.correct).length;
  if (wrong) {
    await page.getByRole('link', { name: /弱点復習を始める/ }).click();
    await expect(page.locator('.opts .op')).toHaveCount(5);
    await expect(page.locator('.qhead')).toContainText('弱点復習');
  }
  expect(errs).toEqual([]);
});

test('judgement quiz (choose all) grades and shows notes', async ({ page }) => {
  await page.goto('/#/quiz/judge?chapter=1');
  const card = page.locator('.jc').first();
  await expect(card.locator('.op')).toHaveCount(5);
  await card.locator('.op').nth(0).click();
  await card.getByRole('button', { name: '解答する' }).click();
  await expect(card.locator('.verdict')).toBeVisible();
  await expect(card.locator('.ex')).toHaveCount(5);
  await card.getByRole('button', { name: 'スライドで確認' }).click();
  await expect(card.locator('.src-drawer img')).toBeVisible();
});

test('textbook: red sheet, self-check, read state', async ({ page }) => {
  await page.goto('/#/chapter/1');
  const hide = page.getByRole('button', { name: '隠して確認' }).first();
  await hide.click();
  const fig = page.locator('figure.sf').first();
  await expect(fig.locator('.frame.test')).toHaveCount(1);
  await fig.locator('.m').first().click();
  await expect(fig.locator('.m.open')).toHaveCount(1);
  const qa = page.locator('.check .qa').first();
  await qa.click();
  await expect(qa).toHaveClass(/open/);
  await page.getByRole('button', { name: 'この章を読了にする' }).click();
  await expect(page.getByRole('button', { name: /読了済み/ })).toBeVisible();
  await page.goto('/#/book');
  await expect(page.locator('.clist a').first()).toContainText('読了');
});

test('interactive figure explains a tapped structure', async ({ page }) => {
  await page.goto('/#/figures/cell');
  await page.locator('g.hs[data-k="gol"]').click();
  await expect(page.locator('.panel .m1')).toContainText('ゴルジ');
  await expect(page.locator('.panel .m2')).toBeVisible();
});

test('animation player: play, pause, speed, jump to key point, check quiz', async ({ page }) => {
  const errs = watchErrors(page);
  await page.goto('/#/animations/cent');
  await page.getByRole('button', { name: '▶ 再生する' }).click();
  await page.waitForTimeout(1200);
  const t1 = await page.locator('.tm').textContent();
  expect(t1).not.toMatch(/^0:00 /);
  await page.getByRole('button', { name: '2×' }).click();
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  // jump to the EXAM POINT chapter chip
  await page.locator('.achips button', { hasText: 'EXAM POINT' }).click();
  await expect(page.locator('.xpov.on')).toBeVisible();
  await expect(page.locator('.apan .an')).toContainText('EXAM POINT');
  // svg scene actually drew something
  expect(await page.locator('.stage-main circle').count()).toBeGreaterThan(10);
  // seek to the end → completion overlay → 5-choice check
  const box = await page.locator('.actl .atl').boundingBox();
  await page.mouse.click(box!.x + box!.width - 1, box!.y + box!.height / 2);
  await page.getByRole('button', { name: '再生', exact: false }).first().click();
  await expect(page.getByText('今見た流れを確認しよう')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /今見た流れを確認（5択）/ }).click();
  await expect(page.locator('.aqz .qcard').first().locator('.op')).toHaveCount(5);
  expect(errs).toEqual([]);
});

test('lecture: recorded neural narration is used and drives the timeline', async ({ page }) => {
  const errs = watchErrors(page);
  await page.goto('/#/lecture/1');
  await expect(page.locator('.voice-src.audio')).toContainText('Nanami', { timeout: 20_000 });
  // timeline uses the real recording lengths (lecture 1 ≈ 16 min + pauses)
  const total = (await page.locator('.tm').textContent())!.split('/')[1].trim();
  expect(Number(total.split(':')[0])).toBeGreaterThanOrEqual(15);
  await page.getByRole('button', { name: /授業を始める/ }).click();
  await expect(page.locator('.lsub .s')).toContainText('第1講');
  await page.waitForTimeout(6000);
  expect(await page.locator('.tm').textContent()).not.toMatch(/^00:0[0-2] /);
  await expect(page.locator('.lsub .s')).not.toContainText('を始めます');
  expect(errs).toEqual([]);
});

test('lecture: narration drives subtitles and timeline (device voice)', async ({ page }) => {
  await page.route('**/audio/**', (r) => r.abort());
  await mockSpeech(page);
  const errs = watchErrors(page);
  await page.goto('/#/lecture/1');
  await expect(page.locator('.voice-src')).toContainText('端末の音声合成');
  await page.getByRole('button', { name: /授業を始める/ }).click();
  const sub = page.locator('.lsub .s');
  await expect(sub).toContainText('第1講');
  await page.waitForTimeout(4500);
  const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
  expect(spoken.length).toBeGreaterThanOrEqual(2);
  expect(spoken[0]).toContain('第1講');
  // subtitle follows the voice
  await expect(sub).not.toContainText('を始めます');
  // 10s forward, subtitles off/on, speed
  const before = await page.locator('.tm').textContent();
  await page.getByRole('button', { name: '10秒進む' }).click();
  await expect(page.locator('.tm')).not.toHaveText(before!);
  await page.getByRole('button', { name: /字幕/ }).click();
  await expect(page.locator('.lsub')).toHaveCount(0);
  await page.getByRole('button', { name: /字幕/ }).click();
  await page.getByRole('button', { name: '1.5×' }).click();
  // jump to a slide scene via the script and check the slide camera is active
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.locator('.lscr summary').click();
  await page.locator('.lsl2 button', { hasText: /スライド3で確認/ }).first().click();
  await expect(page.locator('.lsw img')).toBeVisible();
  // chapters on the timeline
  expect(await page.locator('.lctl .atl .tick').count()).toBeGreaterThanOrEqual(5);
  expect(errs).toEqual([]);
});

test('lecture: on-stage 5-choice check with thinking time, explanation and end report', async ({ page }) => {
  await page.route('**/audio/**', (r) => r.abort());
  await mockSpeech(page);
  const errs = watchErrors(page);
  await page.goto('/#/lecture/1');
  await page.getByRole('button', { name: /授業を始める/ }).click();
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.locator('.lscr summary').click();
  // jump to the check question: options are tappable, the answer is not shown yet
  await page.locator('.lsl2 button', { hasText: /ここまで大丈夫ですか？では/ }).first().click();
  const panel = page.locator('.qpanel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.qops button')).toHaveCount(5);
  await expect(panel.getByText('正解です')).toHaveCount(0);
  await page.locator('.lsl2 button', { hasText: '考える時間' }).first().click();
  await expect(page.locator('.qtimer')).toBeVisible();
  await panel.locator('.qops button').nth(2).click(); // C
  await page.locator('.qgo').click();
  await expect(panel.getByText('解説で確かめましょう')).toBeVisible();
  await expect(panel.getByText('◎ 正解です')).toHaveCount(0);
  // the verdict appears only once the lecturer reaches the correct option
  await page.locator('.lsl2 button', { hasText: '正解はCです' }).first().click();
  await expect(panel.getByText('◎ 正解です')).toBeVisible();
  // seek to the end → report with understanding, accuracy and review links
  await page.locator('.lctl .atl').scrollIntoViewIfNeeded();
  const box = await page.locator('.lctl .atl').boundingBox();
  await page.mouse.click(box!.x + box!.width - 1, box!.y + box!.height / 2);
  await page.getByRole('button', { name: '再生', exact: true }).click();
  await expect(page.locator('.lrep')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.lrep')).toContainText('理解度');
  await expect(page.locator('.lrep-list li').first()).toBeVisible();
  await expect(page.locator('.lrep').getByText('解き直す').first()).toBeVisible();
  expect(errs).toEqual([]);
});

test('lecture without any speech engine says so and runs on subtitles', async ({ page }) => {
  await page.route('**/audio/**', (r) => r.abort());
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
    delete (window as unknown as Record<string, unknown>).speechSynthesis;
  });
  await page.goto('/#/lecture/2');
  await expect(page.locator('.voice-src')).toContainText('音声なし');
  await expect(page.getByText('字幕で進行します').first()).toBeVisible();
  await page.getByRole('button', { name: /授業を始める/ }).click();
  await page.waitForTimeout(1500);
  expect(await page.locator('.tm').textContent()).not.toMatch(/^00:00 /);
});

test('navigation works from the menu / tab bar', async ({ page, isMobile }) => {
  await page.goto('/#/');
  const vw = page.viewportSize()!.width;
  if (vw < 900) {
    await page.getByRole('button', { name: 'メニュー' }).click();
    await page.getByRole('dialog').getByRole('link', { name: /役割図鑑/ }).click();
    await expect(page.getByRole('heading', { name: '役割図鑑' })).toBeVisible();
    await page.locator('.tabbar').getByRole('link', { name: '授業' }).click();
  } else {
    await page.locator('.topnav').getByRole('link', { name: '授業' }).click();
  }
  await expect(page.getByRole('heading', { name: '授業を受ける' })).toBeVisible();
  void isMobile;
});
