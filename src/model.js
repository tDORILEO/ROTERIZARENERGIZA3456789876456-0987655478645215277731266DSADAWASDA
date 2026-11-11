function routeId(route) {
  return String(route.id);
}

export function createSession(rows) {
  const seen = new Set();
  const uniqueRows = rows.filter((row) => {
    if (seen.has(row.uc)) return false;
    seen.add(row.uc);
    return true;
  }).map((row) => ({ ...row, assignedRouteId: null }));
  return { rows: uniqueRows, routes: [] };
}

export function getPolos(session) {
  return [...new Set(session.rows.map((row) => row.polo).filter(Boolean))].sort();
}

export function getBooks(session, polo) {
  return [...new Set(session.rows.filter((row) => row.polo === polo).map((row) => row.livro))].sort((a, b) => a - b);
}

export function getVisibleRows(session, polo, livro) {
  return session.rows.filter((row) => row.polo === polo && (livro === '' || Number(row.livro) === Number(livro)));
}

export function assignRoute(session, route, ucIds) {
  const id = routeId(route);
  const selected = session.rows.filter((row) => ucIds.includes(row.uc));
  if (!selected.length) throw new Error('Selecione ao menos uma UC.');
  const conflict = selected.find((row) => row.assignedRouteId && row.assignedRouteId !== id);
  if (conflict) throw new Error(`A UC ${conflict.uc} já pertence a outra rota.`);

  const normalized = { ...route, id, ucIds: [...ucIds] };
  session.routes = session.routes.filter((item) => item.id !== id);
  session.routes.push(normalized);
  selected.forEach((row) => { row.assignedRouteId = id; });
  return normalized;
}

export function buildExportRows(session) {
  const routeById = new Map(session.routes.map((route) => [route.id, route]));
  return session.rows.filter((row) => row.assignedRouteId).map((row) => {
    const route = routeById.get(row.assignedRouteId);
    return {
      POLO: row.polo, UC: row.uc, LIVRO_ATUAL: row.livro, ROTA_ATUAL: row.rota,
      LOCALIDADE: row.localidade, NOME_LOCALIDADE: row.nomeLocalidade,
      LATITUDE: row.latitude, LONGITUDE: row.longitude, LEITURISTA: route.leiturista,
      LIVRO_NOVO: route.livroNovo, ROTA_NOVA: route.rotaNova, MODO: route.modo,
      ORDEM: route.ucIds.indexOf(row.uc) + 1,
    };
  }).sort((left, right) => left.LEITURISTA.localeCompare(right.LEITURISTA) || left.ORDEM - right.ORDEM);
}
