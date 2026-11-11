import test from 'node:test';
import assert from 'node:assert/strict';
import { appendRows } from '../src/import.js';

test('appendRows supports a TXT with more than 200 thousand records', () => {
  const target = [];
  const rows = Array.from({ length: 224731 }, (_, index) => ({ uc: String(index) }));
  appendRows(target, rows);
  assert.equal(target.length, 224731);
  assert.equal(target.at(-1).uc, '224730');
});
