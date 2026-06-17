import assert from 'node:assert';
import { rankVendors } from './score.js';

// A close, highly-rated, popular vendor must outrank a far, low-rated one.
const out = rankVendors([
  { id: 'good', distanceKm: 1, rating: 4.8, reviewCount: 500, popularity: 90 },
  { id: 'bad', distanceKm: 40, rating: 2.5, reviewCount: 5, popularity: 5 },
  { id: 'mid', distanceKm: 10, rating: 4.0, reviewCount: 100, popularity: 40 },
]);

assert.strictEqual(out[0].id, 'good', 'best vendor should rank first');
assert.strictEqual(out[out.length - 1].id, 'bad', 'worst vendor should rank last');
assert.ok(out.length <= 10, 'returns at most 10');
assert.ok(out[0].score > out[1].score, 'scores strictly ordered');

// Empty input is safe.
assert.deepStrictEqual(rankVendors([]), []);

console.log('score.test.js OK');
