import { buildExportRows } from './model.js';

export function createWorkbookData(session) {
  const roteirizacao = buildExportRows(session);
  const groups = new Map();
  roteirizacao.forEach((row) => {
    const key = `${row.LEITURISTA}|${row.LIVRO_NOVO}|${row.ROTA_NOVA}`;
    const current = groups.get(key) ?? { LEITURISTA: row.LEITURISTA, LIVRO_NOVO: row.LIVRO_NOVO, ROTA_NOVA: row.ROTA_NOVA, UCS: 0 };
    current.UCS += 1;
    groups.set(key, current);
  });
  return { roteirizacao, resumo: [...groups.values()] };
}

export function downloadWorkbook(session) {
  const data = createWorkbookData(session);
  if (!data.roteirizacao.length) throw new Error('Crie ao menos uma rota antes de exportar.');
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.roteirizacao), 'ROTEIRIZACAO');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.resumo), 'RESUMO');
  XLSX.writeFile(workbook, 'roteirizacao.xlsx');
}
