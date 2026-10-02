// dev: screenshot pages that set window.ready.  node tools/shot.mjs out.png "url" [more pairs...]
import { chromium } from '@playwright/test';
const args = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
for (let i = 0; i < args.length; i += 2) {
  await p.goto(args[i + 1]);
  await p.waitForFunction(() => window.ready === true, null, { timeout: 30000 }).catch(() => errs.push('not ready: ' + args[i + 1]));
  await p.waitForTimeout(150);
  await p.screenshot({ path: args[i] });
}
if (errs.length) console.log(errs.join('\n'));
await b.close();
