import test from 'node:test';
import assert from 'node:assert/strict';
import { assignRoute, createSession, getBooks } from '../src/model.js';

const rows = [
  { id: 'a', polo: 'CUIABÁ', uc: '10', livro: 1, latitude: -15, longitude: -56 },
  { id: 'b', polo: 'CUIABÁ', uc: '10', livro: 1, latitude: -15, longitude: -56 },
  { id: 'c', polo: 'CUIABÁ', uc: '11', livro: 2, latitude: -15.1, longitude: -56.1 },
];

test('createSession deduplicates UCs and lists books by polo', () => {
  const session = createSession(rows);
  assert.equal(session.rows.length, 2);
  assert.deepEqual(getBooks(session, 'CUIABÁ'), [1, 2]);
});

test('assignRoute refuses a UC already assigned to another route', () => {
  const session = createSession(rows);
  assignRoute(session, { id: 'r1', leiturista: 'Ana', livroNovo: 10, rotaNova: '1', modo: 'WALK' }, ['10']);
  assert.throws(
    () => assignRoute(session, { id: 'r2', leiturista: 'Bia', livroNovo: 10, rotaNova: '2', modo: 'WALK' }, ['10']),
    /já pertence/,
  );
});
