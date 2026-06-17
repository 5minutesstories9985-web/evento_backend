import { Vendor } from './vendor.model.js';

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

export const create = (data) => Vendor.create(data);
export const update = (id, data) => Vendor.findByIdAndUpdate(id, data, { new: true });
export const remove = (id) => Vendor.deleteOne({ _id: id });
