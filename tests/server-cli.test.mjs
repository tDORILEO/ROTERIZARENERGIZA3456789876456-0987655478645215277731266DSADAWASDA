import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

test('server.mjs starts when invoked directly', async () => {
  const child = spawn(process.execPath, ['server.mjs'], { cwd: process.cwd(), env: { ...process.env, PORT: '8099' } });
  const output = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Servidor não iniciou')), 3000);
    child.stdout.once('data', (chunk) => { clearTimeout(timer); resolve(String(chunk)); });
    child.once('error', reject);
  });
  child.kill();
  assert.match(output, /http:\/\/localhost:8099/);
});
