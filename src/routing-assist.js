function validRows(rows) {
  return rows.filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
}

function distance(left, right) {
  const latitude = left.latitude - right.latitude;
  const longitude = (left.longitude - right.longitude) * Math.cos(((left.latitude + right.latitude) / 2) * Math.PI / 180);
  return (latitude * latitude) + (longitude * longitude);
}

export function routeCapacity(book) {
  const number = Number(book);
  if (number >= 41 && number <= 57) return 200;
  return 450;
}

export function nearestAvailableUc(rows, selected) {
  const ordered = [...selected];
  const last = validRows(rows).find((row) => row.uc === ordered.at(-1));
  if (!last) return null;
  return validRows(rows)
    .filter((row) => !selected.has(row.uc) && !row.assignedRouteId)
    .sort((left, right) => distance(last, left) - distance(last, right))[0]?.uc ?? null;
}

export function optimizeNearestSequence(rows, selected) {
  const byUc = new Map(validRows(rows).map((row) => [row.uc, row]));
  const pending = [...selected].map((uc) => byUc.get(uc)).filter(Boolean);
  if (pending.length < 3) return pending.map((row) => row.uc);
  // Parte da extremidade oeste/sul e segue continuamente para o vizinho mais próximo.
  pending.sort((left, right) => left.longitude - right.longitude || left.latitude - right.latitude);
  const route = [pending.shift()];
  while (pending.length) {
    const current = route.at(-1);
    let closest = 0;
    for (let index = 1; index < pending.length; index += 1) {
      if (distance(current, pending[index]) < distance(current, pending[closest])) closest = index;
    }
    route.push(pending.splice(closest, 1)[0]);
  }

  // 2-opt remove cruzamentos: se dois segmentos ficam menores ao inverter o trecho entre eles, inverte.
  for (let pass = 0; pass < 6; pass += 1) {
    let improved = false;
    for (let start = 0; start < route.length - 3; start += 1) {
      for (let end = start + 2; end < route.length - 1; end += 1) {
        const current = distance(route[start], route[start + 1]) + distance(route[end], route[end + 1]);
        const replacement = distance(route[start], route[end]) + distance(route[start + 1], route[end + 1]);
        if (replacement + 0.0000000001 < current) {
          const reversed = route.slice(start + 1, end + 1).reverse();
          route.splice(start + 1, reversed.length, ...reversed);
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return route.map((row) => row.uc);
}
