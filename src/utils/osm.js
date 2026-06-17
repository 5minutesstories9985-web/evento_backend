import { env } from '../config/env.js';
import { cached } from './cache.js';

// --- Simple 1 req/s queue so we respect Nominatim/Overpass usage policy ---
let chain = Promise.resolve();
function throttle(fn) {
  const run = chain.then(() => fn());
  chain = run.then(() => new Promise((r) => setTimeout(r, 1100)), () => {});
  return run;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': env.geoUserAgent } });
  if (!res.ok) throw new Error(`geo upstream ${res.status} for ${url}`);
  return res.json();
}

// Our service categories → OSM Overpass tag filters.
const OSM_TAGS = {
  caterer: ['node["amenity"="restaurant"]', 'node["shop"="caterer"]', 'node["amenity"="fast_food"]'],
  photographer: ['node["shop"="photo"]', 'node["craft"="photographer"]'],
  hotel: ['node["tourism"="hotel"]', 'node["tourism"="guest_house"]', 'node["tourism"="motel"]'],
  decorator: ['node["shop"="florist"]', 'node["shop"="interior_decoration"]'],
  vehicle: ['node["amenity"="car_rental"]', 'node["shop"="car"]'],
  makeup: ['node["shop"="beauty"]', 'node["shop"="hairdresser"]'],
  // dj, organizer, entertainment have no reliable OSM tags → Vendors collection only
};

export function osmSupports(category) {
  return Boolean(OSM_TAGS[category]);
}

/** Geocode a free-text venue → { lat, lng, address } (cached 30 days). */
export async function geocode(query) {
  const q = query.trim();
  if (!q) return null;
  return cached(`geocode:${q.toLowerCase()}`, 60 * 60 * 24 * 30, () =>
    throttle(async () => {
      const url = `${env.nominatimUrl}/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
      const data = await getJson(url);
      if (!data.length) return null;
      const top = data[0];
      return { lat: parseFloat(top.lat), lng: parseFloat(top.lon), address: top.display_name };
    })
  );
}

/** Nearby POIs from OSM Overpass for a supported category (cached 1 day). */
export async function nearbyPois(lat, lng, category, radiusM = 15000) {
  const filters = OSM_TAGS[category];
  if (!filters) return [];
  const key = `poi:${category}:${lat.toFixed(3)}:${lng.toFixed(3)}:${radiusM}`;
  return cached(key, 60 * 60 * 24, () =>
    throttle(async () => {
      const body =
        `[out:json][timeout:25];(` +
        filters.map((f) => `${f}(around:${radiusM},${lat},${lng});`).join('') +
        `);out body 40;`;
      const res = await fetch(env.overpassUrl, {
        method: 'POST',
        headers: { 'User-Agent': env.geoUserAgent, 'Content-Type': 'text/plain' },
        body,
      });
      if (!res.ok) throw new Error(`overpass ${res.status}`);
      const data = await res.json();
      return (data.elements || [])
        .filter((e) => e.lat && e.lon && e.tags?.name)
        .map((e) => ({
          name: e.tags.name,
          category,
          phone: e.tags.phone || e.tags['contact:phone'] || '',
          lat: e.lat,
          lng: e.lon,
          address: [e.tags['addr:street'], e.tags['addr:city']].filter(Boolean).join(', '),
          source: 'osm',
        }));
    })
  );
}

/** Route between two points via OSRM → { distanceKm, etaMin, polyline:[[lat,lng]...] }. */
export async function route(from, to) {
  const key = `route:${from.lat.toFixed(4)},${from.lng.toFixed(4)}:${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
  return cached(key, 60 * 60 * 6, async () => {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${env.osrmUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const data = await getJson(url);
    const r = data.routes?.[0];
    if (!r) return null;
    return {
      distanceKm: +(r.distance / 1000).toFixed(2),
      etaMin: Math.round(r.duration / 60),
      polyline: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    };
  });
}

/** Haversine straight-line distance in km (used for ranking when no route needed). */
export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return +(2 * R * Math.asin(Math.sqrt(h))).toFixed(2);
}
