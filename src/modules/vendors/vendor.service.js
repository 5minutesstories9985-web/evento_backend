import { Vendor } from './vendor.model.js';
import { geocode } from '../../utils/osm.js';

// Resolve a location from an explicit lat/lng or by geocoding a free-text address.
async function resolveLocation({ lat, lng, address }) {
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { location: { type: 'Point', coordinates: [lng, lat] }, address: address || '' };
  }
  if (address) {
    const geo = await geocode(address);
    if (geo) {
      return {
        location: { type: 'Point', coordinates: [geo.lng, geo.lat] },
        address: geo.address,
      };
    }
  }
  const err = new Error('Provide a recognizable address or lat/lng for the listing');
  err.status = 422;
  throw err;
}

export async function search({ q, category, page = 1, limit = 20 }) {
  const filter = {};
  if (category) filter.category = category;
  if (q) filter.name = { $regex: q, $options: 'i' };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Vendor.find(filter).skip(skip).limit(limit).lean(),
    Vendor.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

/** Owned vendors near a point, optionally filtered by category. */
export async function nearby({ lat, lng, category, radiusM = 25000, limit = 50 }) {
  const filter = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusM,
      },
    },
  };
  if (category) filter.category = category;
  return Vendor.find(filter).limit(limit).lean();
}

// --- Vendor self-management (owner-scoped, address geocoded) ---

export async function createForOwner(owner, data) {
  const loc = await resolveLocation(data);
  return Vendor.create({ ...data, ...loc, owner, source: 'owned' });
}

export function listMine(owner) {
  return Vendor.find({ owner }).sort({ createdAt: -1 }).lean();
}

export async function updateOwned(owner, id, data) {
  const patch = { ...data };
  if (data.address || (typeof data.lat === 'number' && typeof data.lng === 'number')) {
    Object.assign(patch, await resolveLocation(data));
  }
  const vendor = await Vendor.findOneAndUpdate({ _id: id, owner }, patch, { new: true });
  if (!vendor) {
    const err = new Error('Listing not found');
    err.status = 404;
    throw err;
  }
  return vendor;
}

export const removeOwned = (owner, id) => Vendor.deleteOne({ _id: id, owner });
