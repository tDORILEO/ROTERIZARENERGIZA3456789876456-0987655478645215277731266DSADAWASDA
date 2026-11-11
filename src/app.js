import { decodeFile, parseTxt } from './parser.js';
import { appendRows } from './import.js';
import { assignRoute, createSession, getBooks, getPolos, getVisibleRows } from './model.js';
import { downloadWorkbook } from './export.js';
import { createMap } from './map.js';

const $ = (id) => document.getElementById(id);
let session = null;
let map = null;
let selected = new Set();
let routeNumber = 1;

function toast(message) { const node = $('toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 3000); }
function currentRows() { return getVisibleRows(session, $('poloSelect').value, $('bookSelect').value); }
function render() {
  if (!session) return;
  const rows = currentRows();
  map.render(rows, selected);
  $('selectionStatus').textContent = `${selected.size} UC(s) selecionada(s).`;
  $('routeList').innerHTML = session.routes.map((route) => `<div class="route"><strong>${route.leiturista || 'Sem nome'}</strong><br>${route.ucIds.length} UCs · Livro ${route.livroNovo} · Rota ${route.rotaNova}</div>`).join('') || '<p class="muted">Nenhuma rota criada.</p>';
}
function refreshBooks() {
  const books = getBooks(session, $('poloSelect').value);
  $('bookSelect').innerHTML = '<option value="">Todos os livros</option>' + books.map((book) => `<option value="${book}">${book}</option>`).join('');
  selected.clear(); render();
}
async function importFiles(files) {
  const allRows = []; const errors = [];
  for (const file of files) {
    try { const text = decodeFile(await file.arrayBuffer()); const result = parseTxt(text, file.name); appendRows(allRows, result.rows); appendRows(errors, result.rejected.map((item) => `${file.name}: linha ${item.row} (${item.reason})`)); }
    catch (error) { errors.push(`${file.name}: ${error.message}`); }
  }
  if (!allRows.length) throw new Error('Nenhuma UC válida foi encontrada nos arquivos enviados.');
  session = createSession(allRows);
  const mapped = session.rows.filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude)).length;
  $('poloSelect').innerHTML = getPolos(session).map((polo) => `<option value="${polo}">${polo}</option>`).join('');
  $('uploadScreen').hidden = true; $('workspace').hidden = false;
  map = createMap('map', (uc) => { selected.has(uc) ? selected.delete(uc) : selected.add(uc); render(); });
  refreshBooks();
  $('uploadStatus').textContent = `${session.rows.length} UCs importadas; ${mapped} com coordenadas para o mapa.`;
  toast(errors.length ? `${session.rows.length} UCs importadas; ${errors.length} linhas ignoradas.` : `${session.rows.length} UCs importadas; ${mapped} mapeáveis.`);
}

$('fileInput').addEventListener('change', async (event) => { try { $('uploadStatus').textContent = 'Importando e validando arquivos…'; await new Promise(requestAnimationFrame); await importFiles([...event.target.files]); } catch (error) { $('uploadStatus').textContent = error.message; } });
$('poloSelect').addEventListener('change', refreshBooks);
$('bookSelect').addEventListener('change', () => { selected.clear(); render(); });
$('saveRoute').addEventListener('click', () => {
  try {
    assignRoute(session, { id: `route-${routeNumber++}`, leiturista: $('readerInput').value.trim(), livroNovo: Number($('newBookInput').value), rotaNova: $('newRouteInput').value.trim(), modo: $('modeInput').value }, [...selected]);
    selected.clear(); $('newRouteInput').value = ''; render(); toast('Rota salva na sessão atual.');
  } catch (error) { toast(error.message); }
});
$('exportButton').addEventListener('click', () => { try { downloadWorkbook(session); } catch (error) { toast(error.message); } });
$('newImport').addEventListener('click', () => { session = null; selected.clear(); $('workspace').hidden = true; $('uploadScreen').hidden = false; $('fileInput').value = ''; });
