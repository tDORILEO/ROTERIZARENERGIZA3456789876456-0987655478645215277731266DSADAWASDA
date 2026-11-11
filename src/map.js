const COLORS = ['#0284c7', '#16a34a', '#9333ea', '#ea580c', '#dc2626', '#0891b2', '#ca8a04', '#4f46e5'];

export function selectablePoints(rows) {
  return rows.filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
}

export function colorForRoute(route) {
  const text = String(route || 'SEM ROTA');
  let hash = 0;
  for (const char of text) hash = ((hash << 5) - hash) + char.charCodeAt(0);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function pointInPolygon([longitude, latitude], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]; const [xj, yj] = polygon[j];
    const crosses = ((yi > latitude) !== (yj > latitude))
      && (longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi);
    if (crosses) inside = !inside;
  }
  return inside;
}

export function buildSequenceLine(rows, selected) {
  const byUc = new Map(selectablePoints(rows).map((row) => [row.uc, row]));
  const coordinates = [...selected].map((uc) => byUc.get(uc)).filter(Boolean)
    .map((row) => [row.longitude, row.latitude]);
  return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } };
}

export function nextSequencePoint(rows, selected) {
  const byUc = new Map(selectablePoints(rows).map((row) => [row.uc, row]));
  const next = byUc.get([...selected][1]);
  if (!next) return { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [] } };
  return { type: 'Feature', properties: { uc: next.uc }, geometry: { type: 'Point', coordinates: [next.longitude, next.latitude] } };
}

export function createMap(container, onPointClick, onPolygonSelected = () => {}) {
  let pendingRows = [];
  let pendingSelected = new Set();
  let shouldFit = false;
  let popup;
  let draw;
  const updateSource = () => {
    const features = selectablePoints(pendingRows).map((row) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [row.longitude, row.latitude] },
      properties: { uc: row.uc, livro: row.livro, rota: row.rota || 'Sem rota', localidade: row.nomeLocalidade || row.localidade || '—', color: colorForRoute(row.assignedRouteId || row.rota), selected: pendingSelected.has(row.uc), assigned: Boolean(row.assignedRouteId) },
    }));
    const source = map.getSource('ucs');
    if (!source) return;
    source.setData({ type: 'FeatureCollection', features });
    map.getSource('selection-line')?.setData(buildSequenceLine(pendingRows, pendingSelected));
    map.getSource('next-stop')?.setData(nextSequencePoint(pendingRows, pendingSelected));
    if (shouldFit && features.length) map.fitBounds(features.reduce((bounds, item) => bounds.extend(item.geometry.coordinates), new maplibregl.LngLatBounds(features[0].geometry.coordinates, features[0].geometry.coordinates)), { padding: 50, maxZoom: 14 });
    shouldFit = false;
  };
  const map = new maplibregl.Map({
    container,
    style: { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] },
    center: [-56.1, -15.6], zoom: 5,
  });
  map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
  map.on('load', () => {
    map.addSource('ucs', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterMaxZoom: 14, clusterRadius: 48 });
    map.addSource('selection-line', { type: 'geojson', data: buildSequenceLine([], new Set()) });
    map.addSource('next-stop', { type: 'geojson', data: nextSequencePoint([], new Set()) });
    map.addLayer({ id: 'selection-line-shadow', type: 'line', source: 'selection-line', paint: { 'line-color': '#0f172a', 'line-width': 7, 'line-opacity': 0.72 } });
    map.addLayer({ id: 'selection-line', type: 'line', source: 'selection-line', paint: { 'line-color': '#f59e0b', 'line-width': 4, 'line-opacity': 0.95, 'line-dasharray': [1.4, 1.2] } });
    map.addLayer({ id: 'sequence-arrows', type: 'symbol', source: 'selection-line', layout: { 'symbol-placement': 'line', 'symbol-spacing': 55, 'text-field': '▶', 'text-size': 15, 'text-rotation-alignment': 'map', 'text-keep-upright': false, 'text-ignore-placement': true }, paint: { 'text-color': '#fef3c7', 'text-halo-color': '#92400e', 'text-halo-width': 1.2 } });
    map.addLayer({ id: 'next-stop-ring', type: 'circle', source: 'next-stop', paint: { 'circle-radius': 12, 'circle-color': '#22c55e', 'circle-opacity': 0.28, 'circle-stroke-color': '#dcfce7', 'circle-stroke-width': 2 } });
    map.addLayer({ id: 'next-stop-label', type: 'symbol', source: 'next-stop', layout: { 'text-field': 'PRÓXIMA', 'text-size': 10, 'text-offset': [0, 1.8] }, paint: { 'text-color': '#166534', 'text-halo-color': '#f0fdf4', 'text-halo-width': 1.5 } });
    map.addLayer({ id: 'clusters', type: 'circle', source: 'ucs', filter: ['has', 'point_count'], paint: { 'circle-color': '#0369a1', 'circle-radius': ['step', ['get', 'point_count'], 18, 100, 24, 1000, 32], 'circle-stroke-color': '#7dd3fc', 'circle-stroke-width': 2 } });
    map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'ucs', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 11 }, paint: { 'text-color': '#fff' } });
    map.addLayer({ id: 'ucs', type: 'circle', source: 'ucs', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': ['case', ['get', 'selected'], '#f59e0b', ['get', 'color']], 'circle-radius': 7, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } });
    map.on('click', 'clusters', async (event) => { const feature = event.features[0]; map.easeTo({ center: feature.geometry.coordinates, zoom: await map.getSource('ucs').getClusterExpansionZoom(feature.properties.cluster_id) }); });
    map.on('click', 'ucs', (event) => onPointClick(event.features[0].properties.uc));
    map.on('mouseenter', 'ucs', (event) => {
      map.getCanvas().style.cursor = 'pointer';
      const point = event.features[0]; const p = point.properties;
      popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 }).setLngLat(point.geometry.coordinates).setHTML(`<b>UC ${p.uc}</b><br>Livro: ${p.livro}<br>Rota: ${p.rota}<br>Localidade: ${p.localidade}`).addTo(map);
    });
    map.on('mouseleave', 'ucs', () => { map.getCanvas().style.cursor = ''; popup?.remove(); popup = null; });
    if (window.MapboxDraw) {
      draw = new MapboxDraw({ displayControlsDefault: false, controls: {} });
      map.addControl(draw, 'top-left');
      map.on('draw.create', (event) => {
        const ring = event.features[0]?.geometry?.coordinates?.[0];
        if (!ring) return;
        const ids = selectablePoints(pendingRows).filter((row) => pointInPolygon([row.longitude, row.latitude], ring)).map((row) => row.uc);
        onPolygonSelected(ids);
        draw.deleteAll();
      });
    }
    updateSource();
  });
  return {
    render(rows, selected, fit = false) { pendingRows = rows; pendingSelected = selected; shouldFit = fit; updateSource(); },
    startDrawing() {
      if (!draw) return false;
      draw.changeMode('draw_polygon');
      return true;
    },
  };
}
