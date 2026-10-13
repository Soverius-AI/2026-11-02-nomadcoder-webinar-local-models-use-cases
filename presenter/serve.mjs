import './build.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/soverius-ai-logo.png', ['soverius-ai-logo.png', 'image/png']],
  ['/reference.md', ['reference.md', 'text/plain; charset=utf-8']],
  ['/sources.md', ['sources.md', 'text/plain; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/presenter-data.js', ['presenter-data.js', 'text/javascript; charset=utf-8']],
]);
createServer(async (request, response) => {
  const route = routes.get(new URL(request.url, 'http://localhost').pathname);
  if (!route || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end('Not found'); return;
  }
  try {
    const body = await readFile(new URL(route[0], import.meta.url));
    response.writeHead(200, { 'content-type': route[1], 'cache-control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500).end('Unable to load presenter notes');
  }
}).listen(4412, '127.0.0.1', () => console.log('Local LLMs presenter desk: http://localhost:4412'));
