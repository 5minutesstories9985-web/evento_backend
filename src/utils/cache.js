import mongoose from 'mongoose';

// Geo/HTTP response cache (the "Locations" collection). Keyed by an opaque string.
// TTL index auto-expires documents, so the free OSM servers aren't hammered.
const locationSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, index: true },
    value: mongoose.Schema.Types.Mixed,
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true, collection: 'locations' }
);

export const Location = mongoose.model('Location', locationSchema);

/**
 * Return cached value for `key`, else run `producer()`, cache it for `ttlSec`, return it.
 */
export async function cached(key, ttlSec, producer) {
  const hit = await Location.findOne({ key }).lean();
  if (hit) return hit.value;
  const value = await producer();
  await Location.updateOne(
    { key },
    { key, value, expiresAt: new Date(Date.now() + ttlSec * 1000) },
    { upsert: true }
  );
  return value;
}
