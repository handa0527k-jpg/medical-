// 静止画を書き出す：node tools/shot.mjs <page.html?query> <out.png> [...]
import { chromium } from '@playwright/test';
import { serve } from './serve.mjs';
const args = process.argv.slice(2);
const srv = await serve(0);
const base = `http://127.0.0.1:${srv.address().port}/render/`;
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('console:', m.text()); });
for (let i = 0; i < args.length; i += 2) {
  await page.goto(base + args[i]);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  await page.locator('canvas').screenshot({ path: args[i + 1] });
  console.log('wrote', args[i + 1]);
}
await b.close(); srv.close();
