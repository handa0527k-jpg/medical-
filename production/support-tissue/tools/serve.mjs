// 静的ファイルサーバ（制作フォルダを配信）。node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };
export function serve(port = 0) {
  return new Promise((res) => {
    const s = createServer(async (req, rsp) => {
      try {
        const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        const f = join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
        if (!f.startsWith(ROOT)) throw new Error('bad path');
        const b = await readFile(f);
        rsp.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
        rsp.end(b);
      } catch { rsp.writeHead(404); rsp.end('not found'); }
    });
    s.listen(port, '127.0.0.1', () => res(s));
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = await serve(+process.argv[2] || 8765);
  console.log(`http://127.0.0.1:${s.address().port}/render/index.html`);
}
