import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTxt } from '../src/parser.js';

test('parseTxt normalizes semicolon rows, CDC and decimal commas', () => {
  const input = [
    'POLO;CDC;LIVRO;ROTA;LATITUDE;LONGITUDE',
    'CUIABÁ;123;7;42;-15,601;-56,097',
  ].join('\n');

  const result = parseTxt(input, 'cuiaba.txt');

  assert.equal(result.rejected.length, 0);
  assert.deepEqual(result.rows[0], {
    polo: 'CUIABÁ', uc: '123', livro: 7, rota: '42', localidade: '',
    nomeLocalidade: '', latitude: -15.601, longitude: -56.097,
    sourceFile: 'cuiaba.txt',
  });
});

test('parseTxt rejects a file without UC or CDC header', () => {
  assert.throws(
    () => parseTxt('POLO;LIVRO\nCUIABÁ;7', 'invalido.txt'),
    /UC ou CDC/,
  );
});

test('parseTxt keeps a UC without coordinates for export and marks it as unmapped', () => {
  const result = parseTxt('POLO;UC;LIVRO;ROTA;LATITUDE;LONGITUDE\nJUINA;2138;0;0;;', 'juina.txt');
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].uc, '2138');
  assert.equal(result.rows[0].latitude, null);
  assert.equal(result.rows[0].longitude, null);
  assert.equal(result.rejected.length, 0);
});
