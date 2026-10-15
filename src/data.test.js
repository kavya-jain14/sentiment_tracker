import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMockData } from './data.js';

const old = {value: '20', timestamp: '1700000000'};
const recent = {value: '78', timestamp: '1700086400'};
test('live and fallback readings always put the newest reading last', () => {
  for (const rows of [[old, recent], [recent, old]]) {
    assert.deepEqual(generateMockData(rows).map(row => row.fearGreedScore), [20, 78]);
  }
});
test('malformed, empty and duplicate upstream readings are handled', () => {
  assert.equal(generateMockData([old, old, null, {value: 150, timestamp: 1}, {value: '', timestamp: 1}]).length, 1);
  assert.throws(() => generateMockData([]), /No valid/);
  assert.throws(() => generateMockData({}), /Invalid/);
});
