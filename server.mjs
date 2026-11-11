import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const TYPES = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

export function startServer(port = 8080) {
  const server = createServer(async (request, response) => {
    const rawPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relativePath = rawPath === '/' ? 'index.html' : rawPath.replace(/^[/\\]+/, '');
    const target = resolve(normalize(join(ROOT, relativePath)));
    if (!target.startsWith(ROOT)) { response.writeHead(403); response.end('Acesso negado'); return; }
    try {
      const content = await readFile(target);
      response.writeHead(200, { 'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(content);
    } catch { response.writeHead(404); response.end('Arquivo não encontrado'); }
  });
  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      resolveServer({ port: address.port, close: () => new Promise((done) => server.close(done)) });
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  startServer(Number(process.env.PORT || 8080)).then(({ port }) => {
    console.log(`Teste local disponível em http://localhost:${port}`);
    console.log('Pressione Ctrl+C para encerrar.');
  }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
