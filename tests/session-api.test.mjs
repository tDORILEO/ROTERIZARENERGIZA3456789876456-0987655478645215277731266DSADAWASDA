import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalSession } from '../src/session-api.js';

const rows = [
  { polo: 'JUINA', uc: '1', livro: 1, rota: 'A', localidade: '1', nomeLocalidade: 'Centro', latitude: -11.3, longitude: -58.7 },
  { polo: 'JUINA', uc: '2', livro: 2, rota: 'B', localidade: '2', nomeLocalidade: 'Bairro', latitude: null, longitude: null },
];

test('LocalSession exposes polos, multiple books and workspace statistics', () => {
  const local = new LocalSession(rows);
  assert.deepEqual(local.polos(), ['JUINA']);
  assert.deepEqual(local.livros('JUINA'), [1, 2]);
  const workspace = local.workspace('JUINA', [1, 2]);
  assert.equal(workspace.total, 2);
  assert.equal(workspace.with_coord, 1);
  assert.equal(workspace.without_coord, 1);
  assert.equal(workspace.ucs.features.length, 1);
  assert.equal(workspace.no_coord.length, 1);
});

test('LocalSession keeps plans and versions only in the session', () => {
  const local = new LocalSession(rows);
  const plan = local.createPlan({ name: 'Teste', polo: 'JUINA', livros: [1, 2], planned_date: '2026-11-11' });
  local.createVersion(plan.id, 'Inicial');
  assert.equal(local.listPlans().length, 1);
  assert.equal(local.listVersions(plan.id).length, 1);
});
