import { Recommendation } from './recommendation.model.js';
import * as vendors from '../vendors/vendor.service.js';
import { nearbyPois, haversineKm } from '../../utils/osm.js';
import { rankVendors } from '../../utils/score.js';
import { groqEnabled, groqJson } from '../../utils/groqClient.js';

function eventPoint(event) {
  const c = event.location?.coordinates;
  if (!c) {
    const err = new Error('Event has no geocoded location (set a recognizable venue)');
    err.status = 422;
    throw err;
  }
  return { lng: c[0], lat: c[1] };
}

// Merge owned Vendors + OSM POIs for a category, each annotated with distanceKm.
async function gatherCandidates(event, category) {
  const point = eventPoint(event);
  const [owned, pois] = await Promise.all([
    vendors.nearby({ lat: point.lat, lng: point.lng, category }).catch(() => []),
    nearbyPois(point.lat, point.lng, category).catch(() => []),
  ]);

  const fromOwned = owned
    .filter((v) => v.location?.coordinates?.length)
    .map((v) => ({
    name: v.name,
    category: v.category,
    phone: v.phone,
    whatsapp: v.whatsapp || v.phone,
    rating: v.rating,
    reviewCount: v.reviewCount,
    startingPrice: v.startingPrice,
    popularity: v.popularity,
    address: v.address,
    lat: v.location.coordinates[1],
    lng: v.location.coordinates[0],
    source: 'owned',
    distanceKm: haversineKm(point, {
      lat: v.location.coordinates[1],
      lng: v.location.coordinates[0],
    }),
  }));

  const fromOsm = pois.map((p) => ({
    name: p.name,
    category: p.category,
    phone: p.phone,
    whatsapp: p.phone,
    rating: 0,
    reviewCount: 0,
    startingPrice: 0,
    popularity: 0,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    source: 'osm',
    estimated: true, // no real rating/price — UI flags this
    distanceKm: haversineKm(point, { lat: p.lat, lng: p.lng }),
  }));

  // De-dupe by name (owned wins).
  const seen = new Set(fromOwned.map((v) => v.name.toLowerCase()));
  return [...fromOwned, ...fromOsm.filter((p) => !seen.has(p.name.toLowerCase()))];
}

// /events/:id/nearby-services — distance-sorted candidates for the category chips.
export async function nearbyServices(event, category) {
  const candidates = await gatherCandidates(event, category);
  return candidates.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 30);
}

// One Groq call → { name: reason } justifications for the ranked list.
async function justify(event, ranked) {
  if (!groqEnabled() || !ranked.length) return {};
  const list = ranked.map((v) => ({
    name: v.name,
    distanceKm: v.distanceKm,
    rating: v.rating,
    startingPrice: v.startingPrice,
  }));
  const out = await groqJson([
    {
      role: 'system',
      content:
        'You are an event planning assistant. For each vendor, write a one-sentence reason ' +
        'it is recommended for the event. Reply as JSON: {"reasons":[{"name":"..","reason":".."}]}.',
    },
    {
      role: 'user',
      content: `Event: ${event.name} (${event.category}) at ${event.venue}.\nVendors: ${JSON.stringify(list)}`,
    },
  ]);
  const map = {};
  for (const r of out?.reasons || []) map[r.name] = r.reason;
  return map;
}

// /events/:id/recommendations — cached top-10 with AI justifications.
export async function recommend(event, category) {
  const cacheHit = await Recommendation.findOne({ event: event._id, category }).lean();
  if (cacheHit) return cacheHit.items;

  const candidates = await gatherCandidates(event, category);
  const ranked = rankVendors(candidates);
  const reasons = await justify(event, ranked);
  const items = ranked.map((v) => ({ ...v, reason: reasons[v.name] || '' }));

  await Recommendation.updateOne(
    { event: event._id, category },
    { event: event._id, category, items, expiresAt: new Date(Date.now() + 6 * 3600 * 1000) },
    { upsert: true }
  );
  return items;
}
