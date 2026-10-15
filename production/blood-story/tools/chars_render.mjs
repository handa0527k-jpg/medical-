// Render a web page canvas (#c) to PNG with Playwright + Chromium.
// usage: node chars_render.mjs <html path> <out png> [query]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PW = '/tmp/claude-0/-home-user-medical-/cabe129b-da88-56c0-b315-974d7937f506/scratchpad/pw/node_modules/playwright';
const { chromium } = require(process.env.PW_PATH || PW);
import path from 'path';
const [,, html, out, query] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--allow-file-access-from-files', '--headless=new'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); else console.log('[page]', m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto('file://' + path.resolve(html) + (query ? '?' + query : ''));
await page.waitForFunction('window.__ready === true', null, { timeout: 15000 }).catch(() => errs.push('timeout'));
const el = await page.$('#c');
await el.screenshot({ path: out });
if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
await browser.close();
