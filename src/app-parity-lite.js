import { decodeFile, parseTxt } from './parser.js';
import { appendRows } from './import.js';
import { LocalSession } from './session-api.js';
import { createMap } from './map.js?v=20261111-17';
import { nearestAvailableUc, optimizeNearestSequence, routeCapacity } from './routing-assist.js?v=20261111-16';
import { downloadWorkbook } from './export.js';
import { assignRoute, createSession } from './model.js';

const $ = (id) => document.getElementById(id);
let local; let routing; let map; let selected = new Set(); let routeIndex = 1; let currentPlan = null; let activeBooks = [];
const toast = (message) => { $('toast').textContent = message; $('toast').classList.add('show'); setTimeout(() => $('toast').classList.remove('show'), 3200); };
const selectedBooks = () => [...document.querySelectorAll('#booksOptions input:checked')].map((box) => Number(box.value));
const workspaceBooks = () => activeBooks.length ? activeBooks : ['__nenhum_livro__'];
const visibleRows = () => routing?.rows.filter((row) => (
  row.polo === $('poloSelect').value && activeBooks.includes(Number(row.livro))
)) || [];
const capacity = () => routeCapacity(Number($('newBookInput').value) || (activeBooks.length === 1 ? activeBooks[0] : 1));
function addUc(uc) {
  if (selected.has(uc)) { selected.delete(uc); return true; }
  if (selected.size >= capacity()) { toast(`Limite de ${capacity()} UCs atingido para este livro.`); return false; }
  selected.add(uc); return true;
}

function setStats() {
  const workspace = local.workspace($('poloSelect').value, workspaceBooks());
  const assigned = routing.rows.filter((row) => row.assignedRouteId).length;
  $('statBooks').textContent = activeBooks.length;
  $('statTotal').textContent = workspace.total;
  $('statGps').textContent = workspace.with_coord;
  $('statNoGps').textContent = workspace.without_coord;
  $('statAssigned').textContent = assigned;
  $('statPending').textContent = workspace.total - assigned;
  const minutes = Number($('minutesPerUcInput').value) || 0;
  const margin = 1 + ((Number($('marginPctInput').value) || 0) / 100);
  const estimate = routing.routes.map((route) => `${route.nome || route.leiturista || 'Rota'}: ${Math.ceil(route.ucIds.length * minutes * margin)} min`).join(' · ');
  $('balanceBox').textContent = estimate || 'Salve rotas para ver a duração estimada.';
  $('noCoordBox').textContent = workspace.without_coord ? `${workspace.without_coord} UC(s) sem coordenada: ${workspace.no_coord.slice(0, 12).map((row) => row.uc).join(', ')}${workspace.without_coord > 12 ? '…' : ''}` : 'Todas as UCs selecionadas têm coordenada.';
}
function renderSequence() {
  $('seqCount').textContent = `${selected.size} UCs`;
  $('sequenceList').innerHTML = selected.size ? [...selected].map((uc) => `<li>${uc}</li>`).join('') : '<li class="empty">Clique nas UCs no mapa.</li>';
}
function renderRoutes() {
  $('plannedRoutes').innerHTML = routing.routes.length ? routing.routes.map((route) => `<article class="planned-route"><b>${route.nome || route.leiturista || 'Rota'}</b><span>${route.ucIds.length} UCs · Livro ${route.livroNovo || '—'} · Rota ${route.rotaNova || '—'}</span></article>`).join('') : 'Nenhuma rota salva neste planejamento.';
}
function renderMap(fit = false) {
  if (!map) return;
  map.render(visibleRows(), selected, fit);
  setStats(); renderSequence(); renderRoutes();
}
function renderBooks() {
  const books = local.livros($('poloSelect').value);
  $('booksOptions').innerHTML = books.map((book) => `<label class="book-option"><span><input type="checkbox" value="${book}" ${activeBooks.includes(book) ? 'checked' : ''}>Livro ${book}</span></label>`).join('') || 'Nenhum livro neste polo.';
  $('booksButton').textContent = activeBooks.length ? `${activeBooks.length} livro(s)` : 'Selecione';
  renderMap(true);
}
function createPlan() {
  const polo = $('poloSelect').value;
  if (!polo) return toast('Importe os TXT e escolha um polo primeiro.');
  const plan = local.createPlan({ name: `Planejamento ${$('dateInput').value || new Date().toLocaleDateString('pt-BR')}`, polo, livros: activeBooks, planned_date: $('dateInput').value });
  currentPlan = plan.id;
  $('planSelect').insertAdjacentHTML('beforeend', `<option value="${plan.id}" selected>${plan.name}</option>`);
  toast('Planejamento criado nesta sessão.');
}
async function importFiles(files) {
  const rows = [];
  for (const file of files) { const data = parseTxt(decodeFile(await file.arrayBuffer()), file.name); appendRows(rows, data.rows); }
  if (!rows.length) throw new Error('Nenhuma UC válida foi encontrada nos arquivos enviados.');
  local = new LocalSession(rows); routing = createSession(rows); currentPlan = null; activeBooks = []; selected.clear();
  $('poloSelect').innerHTML = '<option value="">Selecione</option>' + local.polos().map((polo) => `<option value="${polo}">${polo}</option>`).join('');
  $('poloSelect').value = local.polos()[0] || '';
  if (!map) map = createMap(
    'map',
    (uc) => { addUc(uc); renderMap(); },
    (ucIds) => { const before = selected.size; ucIds.forEach(addUc); renderMap(); toast(`${selected.size - before} UC(s) adicionada(s) pela área desenhada.`); },
  );
  renderBooks(); $('statusPill').textContent = `${routing.rows.length.toLocaleString('pt-BR')} UCs carregadas`; toast('Base importada. Crie um planejamento para começar.');
}
function saveRoute() {
  try {
    const route = assignRoute(routing, { id: `route-${routeIndex++}`, leiturista: $('readerInput').value.trim(), livroNovo: Number($('newBookInput').value), rotaNova: $('newRouteInput').value.trim(), modo: $('modeSelect').value, nome: $('routeNameInput').value.trim() }, [...selected]);
    if (currentPlan) { const plan = local.getPlan(currentPlan); plan.routes.push(route); local.updatePlan(currentPlan, plan); }
    selected.clear(); renderMap(); toast('Rota salva somente nesta aba.');
  } catch (error) { toast(error.message); }
}
function addImportInput() { const input = document.createElement('input'); input.type = 'file'; input.accept = '.txt,text/plain'; input.multiple = true; input.hidden = true; input.addEventListener('change', async () => { try { $('statusPill').textContent = 'Importando…'; await importFiles([...input.files]); } catch (error) { $('statusPill').textContent = 'Falha na importação'; toast(error.message); } }); document.body.append(input); return input; }
const importInput = addImportInput();
$('importBtn').addEventListener('click', () => importInput.click());
$('newPlanBtn').addEventListener('click', createPlan);
$('poloSelect').addEventListener('change', () => { activeBooks = []; selected.clear(); renderBooks(); });
$('planSelect').addEventListener('change', () => { currentPlan = $('planSelect').value || null; });
$('booksButton').addEventListener('click', () => $('booksMenu').classList.toggle('hidden'));
$('booksApplyBtn').addEventListener('click', () => { activeBooks = selectedBooks(); $('booksMenu').classList.add('hidden'); selected.clear(); $('booksButton').textContent = activeBooks.length ? `${activeBooks.length} livro(s)` : 'Selecione'; renderMap(); });
$('saveRouteBtn').addEventListener('click', saveRoute);
$('newRouteBtn').addEventListener('click', () => { selected.clear(); $('routeNameInput').value = ''; $('newRouteInput').value = ''; renderMap(); });
$('undoBtn').addEventListener('click', () => { const ids = [...selected]; selected.delete(ids.at(-1)); renderMap(); });
$('reverseBtn').addEventListener('click', () => { selected = new Set([...selected].reverse()); renderMap(); });
$('recommendBtn').addEventListener('click', () => {
  const uc = nearestAvailableUc(visibleRows(), selected);
  if (!uc) return toast(selected.size ? 'Não há outra UC disponível nesta seleção.' : 'Selecione a primeira UC para recomendar a próxima.');
  if (addUc(uc)) { renderMap(); toast(`UC ${uc} adicionada como próxima recomendada.`); }
});
$('optimizeBtn').addEventListener('click', () => {
  if (selected.size < 2) return toast('Selecione ao menos duas UCs para traçar a rota.');
  if (selected.size > capacity()) return toast(`A rota aceita no máximo ${capacity()} UCs para este livro.`);
  selected = new Set(optimizeNearestSequence(visibleRows(), selected)); renderMap(); toast('Sequência organizada por proximidade.');
});
function startAreaDrawing() {
  if (!map?.startDrawing()) return toast('O recurso de desenho ainda não está pronto. Aguarde o mapa carregar.');
  toast('Clique no mapa para formar a área e clique novamente no primeiro ponto para concluir.');
}
$('drawAreaBtn').addEventListener('click', startAreaDrawing);
$('drawAreaMapBtn').addEventListener('click', startAreaDrawing);
$('clearSeqBtn').addEventListener('click', () => { selected.clear(); renderMap(); });
$('ucSearchBtn').addEventListener('click', () => { const uc = $('ucSearchInput').value.trim(); const row = routing?.rows.find((item) => item.uc === uc); if (!row) return toast('UC não encontrada na base importada.'); selected.add(row.uc); renderMap(); toast(`UC ${uc} selecionada.`); });
$('manualVersionBtn').addEventListener('click', () => { if (!currentPlan) return toast('Crie um planejamento antes de gerar uma versão.'); local.createVersion(currentPlan, `Versão ${new Date().toLocaleString('pt-BR')}`); toast('Versão registrada na sessão.'); });
$('minutesPerUcInput').addEventListener('input', setStats);
$('marginPctInput').addEventListener('input', setStats);
$('historyBtn').addEventListener('click', () => { const list = currentPlan ? local.listVersions(currentPlan) : []; $('historyBody').textContent = list.length ? list.map((item) => `${item.name} — ${new Date(item.created_at).toLocaleString('pt-BR')}`).join('\n') : 'Ainda não há versões.'; $('historyModal').classList.remove('hidden'); $('modalBackdrop').classList.remove('hidden'); });
$('exportBtn').addEventListener('click', (event) => { event.preventDefault(); try { downloadWorkbook(routing); } catch (error) { toast(error.message); } });
document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.modal').forEach((modal) => modal.classList.add('hidden')); $('modalBackdrop').classList.add('hidden'); }));
