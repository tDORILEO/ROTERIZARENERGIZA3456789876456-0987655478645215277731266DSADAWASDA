import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSequenceLine, colorForRoute, nextSequencePoint, pointInPolygon, selectablePoints } from '../src/map.js';

test('selectablePoints omits rows without valid coordinates', () => {
  assert.deepEqual(selectablePoints([
    { uc: '1', latitude: -15, longitude: -56 },
    { uc: '2', latitude: null, longitude: -56 },
  ]).map((row) => row.uc), ['1']);
});

test('colorForRoute is stable and distinguishes route labels', () => {
  assert.equal(colorForRoute('1'), colorForRoute('1'));
  assert.notEqual(colorForRoute('1'), colorForRoute('2'));
});

test('pointInPolygon finds a point inside a drawn area', () => {
  const polygon = [[-59, -12], [-58, -12], [-58, -11], [-59, -11], [-59, -12]];
  assert.equal(pointInPolygon([-58.5, -11.5], polygon), true);
  assert.equal(pointInPolygon([-57.5, -11.5], polygon), false);
});

test('buildSequenceLine connects selected UCs in click order', () => {
  const line = buildSequenceLine([
    { uc: 'A', latitude: -11, longitude: -58 },
    { uc: 'B', latitude: -11.1, longitude: -58.1 },
  ], new Set(['B', 'A']));
  assert.deepEqual(line.geometry.coordinates, [[-58.1, -11.1], [-58, -11]]);
});

test('nextSequencePoint returns the next stop after the route start', () => {
  const rows = [{ uc: 'A', latitude: -11, longitude: -58 }, { uc: 'B', latitude: -11.1, longitude: -58.1 }];
  assert.equal(nextSequencePoint(rows, new Set(['A', 'B'])).properties.uc, 'B');
});

