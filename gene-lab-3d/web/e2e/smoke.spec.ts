import { expect, test } from '@playwright/test';

const LABS = ['restriction', 'cloning', 'pcr', 'sanger', 'crispr', 'gallery'];

test.beforeEach(async ({ page }) => {
  // software WebGL in CI: keep the light rendering path
  await page.addInitScript(() => localStorage.setItem('genelab:quality', 'low'));
});

test('home lists every lab and the model viewer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.lab-card')).toHaveCount(LABS.length);
  await expect(page.locator('a[href="#/models"]').first()).toBeVisible();
});

for (const id of LABS) {
  test(`lab ${id} loads its models without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/#/lab/${id}`);
    await expect(page.locator('.loading')).toHaveCount(0, { timeout: 60_000 });
    await expect(page.locator('.stage-canvas')).toBeVisible();
    await expect(page.locator('.manip button')).toHaveCount(4);
    await expect(page.locator('.hud-status')).not.toHaveText(/失敗/);
    expect(errors).toEqual([]);
  });
}

test('model viewer: switch model and grab-rotate it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/#/models/1EMA');
  await expect(page.locator('.viewer-info h2')).toContainText('GFP', { timeout: 60_000 });
  // the structure really arrived: a mesh with thousands of vertices is in the scene
  const verts = await page.evaluate(() => {
    let n = 0;
    (window as any).__stage.world.traverse((o: any) => { if (o.isMesh && !o.isInstancedMesh) n += o.geometry.attributes.position.count; });
    return n;
  });
  expect(verts).toBeGreaterThan(5000);
  await page.locator('.manip button', { hasText: '回転' }).click();
  const before = await page.evaluate(() => (window as any).__stage.world.children.at(-1).quaternion.toArray().join());
  const b = (await page.locator('.viewport').boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 150, b.y + b.height / 2 + 40, { steps: 6 });
  await page.mouse.up();
  const after = await page.evaluate(() => (window as any).__stage.world.children.at(-1).quaternion.toArray().join());
  expect(after).not.toBe(before);
  expect(errors).toEqual([]);
});
