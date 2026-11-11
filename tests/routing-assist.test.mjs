import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestAvailableUc, optimizeNearestSequence, routeCapacity } from '../src/routing-assist.js';

const rows = [
  { uc: 'A', latitude: -11, longitude: -58 },
  { uc: 'B', latitude: -11.01, longitude: -58.01 },
  { uc: 'C', latitude: -12, longitude: -59 },
];

test('nearestAvailableUc recommends the closest unselected point', () => {
  assert.equal(nearestAvailableUc(rows, new Set(['A'])), 'B');
});

test('optimizeNearestSequence builds from the closest segment before extending the route', () => {
  const simple = optimizeNearestSequence(rows, new Set(['A', 'C', 'B']));
  assert.equal(simple[1], 'B');
  const distributed = [
    { uc: 'A', latitude: 0, longitude: 0 }, { uc: 'B', latitude: 0, longitude: 0.01 },
    { uc: 'C', latitude: 10, longitude: 10 }, { uc: 'D', latitude: 10, longitude: 10.01 },
  ];
  const result = optimizeNearestSequence(distributed, new Set(['A', 'C', 'B', 'D']));
  assert.equal(Math.abs(result.indexOf('A') - result.indexOf('B')), 1);
  assert.equal(Math.abs(result.indexOf('C') - result.indexOf('D')), 1);
});

test('optimizeNearestSequence keeps UCs with the same coordinates together', () => {
  const duplicatedLocation = [
    { uc: 'A', latitude: -11, longitude: -58 }, { uc: 'A2', latitude: -11, longitude: -58 },
    { uc: 'B', latitude: -11.02, longitude: -58.02 }, { uc: 'C', latitude: -11.04, longitude: -58.04 },
  ];
  const result = optimizeNearestSequence(duplicatedLocation, new Set(['A', 'B', 'A2', 'C']));
  assert.equal(Math.abs(result.indexOf('A') - result.indexOf('A2')), 1);
  assert.equal(new Set(result).size, result.length);
});

test('routeCapacity applies the requested book limits', () => {
  assert.equal(routeCapacity(1), 450);
  assert.equal(routeCapacity(19), 450);
  assert.equal(routeCapacity(41), 200);
  assert.equal(routeCapacity(57), 200);
});
