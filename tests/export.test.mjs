import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbookData } from '../src/export.js';

test('createWorkbookData creates routing and summary sheets', () => {
  const result = createWorkbookData({
    rows: [{ polo: 'CUIABÁ', uc: '10', livro: 1, rota: '1', localidade: '', nomeLocalidade: '', latitude: -15, longitude: -56, assignedRouteId: 'r1' }],
    routes: [{ id: 'r1', leiturista: 'Ana', livroNovo: 9, rotaNova: '2', modo: 'WALK', ucIds: ['10'] }],
  });
  assert.equal(result.roteirizacao[0].UC, '10');
  assert.deepEqual(result.resumo, [{ LEITURISTA: 'Ana', LIVRO_NOVO: 9, ROTA_NOVA: '2', UCS: 1 }]);
});
