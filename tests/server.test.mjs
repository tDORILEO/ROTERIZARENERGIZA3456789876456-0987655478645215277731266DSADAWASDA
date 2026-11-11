import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server.mjs';

test('startServer serves index and JavaScript modules over HTTP', async () => {
  const server = await startServer(0);
  try {
    const root = await fetch(`http://127.0.0.1:${server.port}/`);
    const module = await fetch(`http://127.0.0.1:${server.port}/src/app.js`);
    assert.equal(root.status, 200);
    assert.match(root.headers.get('content-type'), /text\/html/);
    assert.equal(module.status, 200);
    assert.match(module.headers.get('content-type'), /javascript/);
  } finally {
    await server.close();
  }
});
