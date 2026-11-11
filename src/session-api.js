function asNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasCoordinates(row) {
  return asNumber(row.latitude) !== null && asNumber(row.longitude) !== null;
}

function clone(value) {
  return structuredClone(value);
}

/**
 * Substitui a API FastAPI no GitHub Pages. Os dados vivem somente nesta aba.
 */
export class LocalSession {
  constructor(rows = []) {
    this.rows = rows.map((row, index) => ({ ...row, id: row.id ?? `${row.uc}-${index}` }));
    this.plans = [];
    this.versions = new Map();
    this.nextPlanId = 1;
    this.nextVersionId = 1;
  }

  polos() {
    return [...new Set(this.rows.map((row) => String(row.polo || '').trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, 'pt-BR'));
  }

  livros(polo) {
    return [...new Set(this.rows
      .filter((row) => !polo || row.polo === polo)
      .map((row) => asNumber(row.livro))
      .filter((book) => book !== null))]
      .sort((left, right) => left - right);
  }

  workspace(polo, livros = []) {
    const selectedBooks = new Set((livros || []).map(Number));
    const rows = this.rows.filter((row) => (
      (!polo || row.polo === polo)
      && (!selectedBooks.size || selectedBooks.has(Number(row.livro)))
    ));
    const mapped = rows.filter(hasCoordinates);
    const noCoord = rows.filter((row) => !hasCoordinates(row));
    return {
      total: rows.length,
      with_coord: mapped.length,
      without_coord: noCoord.length,
      ucs: {
        type: 'FeatureCollection',
        features: mapped.map((row) => ({
          type: 'Feature',
          properties: { ...row },
          geometry: { type: 'Point', coordinates: [Number(row.longitude), Number(row.latitude)] },
        })),
      },
      no_coord: clone(noCoord),
      rows: clone(rows),
    };
  }

  createPlan(input) {
    const plan = {
      id: String(this.nextPlanId++),
      name: String(input.name || 'Plano sem nome').trim(),
      polo: input.polo || '',
      livros: [...new Set((input.livros || []).map(Number))],
      planned_date: input.planned_date || '',
      routes: [],
      demarcations: [],
      created_at: new Date().toISOString(),
    };
    this.plans.push(plan);
    return clone(plan);
  }

  listPlans() {
    return clone(this.plans);
  }

  getPlan(planId) {
    const plan = this.plans.find((item) => item.id === String(planId));
    return plan ? clone(plan) : null;
  }

  updatePlan(planId, patch) {
    const plan = this.plans.find((item) => item.id === String(planId));
    if (!plan) throw new Error('Plano não encontrado.');
    Object.assign(plan, clone(patch));
    return clone(plan);
  }

  createVersion(planId, name = 'Versão') {
    const plan = this.plans.find((item) => item.id === String(planId));
    if (!plan) throw new Error('Plano não encontrado.');
    const version = { id: String(this.nextVersionId++), name, created_at: new Date().toISOString(), plan: clone(plan) };
    const entries = this.versions.get(plan.id) || [];
    entries.unshift(version);
    this.versions.set(plan.id, entries);
    return clone(version);
  }

  listVersions(planId) {
    return clone(this.versions.get(String(planId)) || []);
  }
}
