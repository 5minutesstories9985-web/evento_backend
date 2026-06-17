// Deterministic vendor ranking (the spec formula). AI does language, not this math.
// score = wD*distInv + wR*rating + wRev*reviews + wPop*popularity   (each normalized 0..1)

export const WEIGHTS = { distance: 0.35, rating: 0.3, reviews: 0.2, popularity: 0.15 };

// Normalize an array of numbers to 0..1. If all equal, everyone gets 1.
function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 1);
  return values.map((v) => (v - min) / (max - min));
}

/**
 * @param {Array<{distanceKm:number, rating:number, reviewCount:number, popularity:number}>} candidates
 * @param {object} weights
 * @returns {Array} candidates sorted desc by `score`, top 10, each with `score`.
 */
export function rankVendors(candidates, weights = WEIGHTS) {
  if (!candidates.length) return [];

  // distance is "lower is better" → invert so larger normalized = closer
  const distInv = normalize(candidates.map((c) => -(c.distanceKm ?? 0)));
  const rating = normalize(candidates.map((c) => c.rating ?? 0));
  const reviews = normalize(candidates.map((c) => c.reviewCount ?? 0));
  const popularity = normalize(candidates.map((c) => c.popularity ?? 0));

  return candidates
    .map((c, i) => ({
      ...c,
      score:
        weights.distance * distInv[i] +
        weights.rating * rating[i] +
        weights.reviews * reviews[i] +
        weights.popularity * popularity[i],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
