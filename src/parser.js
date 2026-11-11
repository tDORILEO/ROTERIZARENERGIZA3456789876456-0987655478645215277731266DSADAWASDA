const REQUIRED_ID = ['UC', 'CDC'];

function normalizeHeader(value) {
  return String(value ?? '').trim().toUpperCase();
}

function asNumber(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function asInteger(value) {
  const number = asNumber(value);
  return number === null ? 0 : Math.trunc(number);
}

export function decodeFile(buffer) {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  return utf8.includes('�')
    ? new TextDecoder('windows-1252').decode(buffer)
    : utf8;
}

export function parseTxt(text, sourceName = 'arquivo.txt') {
  const lines = String(text ?? '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) throw new Error('O arquivo está vazio.');

  const headers = lines[0].split(';').map(normalizeHeader);
  if (!REQUIRED_ID.some((name) => headers.includes(name))) {
    throw new Error('O arquivo precisa ter a coluna UC ou CDC.');
  }

  const index = (name) => headers.indexOf(name);
  const valueAt = (fields, ...names) => {
    const position = names.map(index).find((item) => item >= 0);
    return position === undefined ? '' : String(fields[position] ?? '').trim();
  };
  const rows = [];
  const rejected = [];

  lines.slice(1).forEach((line, rowIndex) => {
    const fields = line.split(';');
    const uc = valueAt(fields, 'UC', 'CDC');
    const latitude = asNumber(valueAt(fields, 'LATITUDE'));
    const longitude = asNumber(valueAt(fields, 'LONGITUDE'));
    if (!uc) {
      rejected.push({ row: rowIndex + 2, reason: 'UC ausente' });
      return;
    }
    rows.push({
      polo: valueAt(fields, 'POLO').toUpperCase(),
      uc,
      livro: asInteger(valueAt(fields, 'LIVRO')),
      rota: valueAt(fields, 'ROTA'),
      localidade: valueAt(fields, 'LOCALIDADE'),
      nomeLocalidade: valueAt(fields, 'NOME_LOCALIDADE'),
      latitude,
      longitude,
      sourceFile: sourceName,
    });
  });

  return { rows, rejected, columns: headers };
}
