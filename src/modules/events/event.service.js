import { Event } from './event.model.js';
import { geocode } from '../../utils/osm.js';

// Geocode the venue (best-effort) and persist a GeoJSON Point.
async function withLocation(data) {
  if (!data.venue) return data;
  try {
    const geo = await geocode(data.venue);
    if (geo) {
      return {
        ...data,
        venueAddress: geo.address,
        location: { type: 'Point', coordinates: [geo.lng, geo.lat] },
      };
    }
  } catch (e) {
    console.warn('[events] geocode failed:', e.message);
  }
  return data;
}

export async function createEvent(owner, data) {
  return Event.create({ ...(await withLocation(data)), owner });
}

export async function listEvents({ page = 1, limit = 50, owner } = {}) {
  const skip = (page - 1) * limit;
  const filter = owner ? { owner } : {};
  const [items, total] = await Promise.all([
    Event.find(filter).sort({ dateTime: 1 }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export async function getEvent(id) {
  const event = await Event.findById(id);
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
  // Self-heal: events saved before geocoding worked have no location.
  // Geocode once on read and persist so the map/assistant work next time.
  if (!event.location?.coordinates?.length && event.venue) {
    const healed = await withLocation({ venue: event.venue });
    if (healed.location) {
      event.location = healed.location;
      event.venueAddress = healed.venueAddress;
      await event.save();
    }
  }
  return event;
}

export async function updateEvent(owner, id, data) {
  const patch = data.venue ? await withLocation(data) : data;
  const event = await Event.findOneAndUpdate({ _id: id, owner }, patch, { new: true });
  if (!event) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
  return event;
}

export async function deleteEvent(owner, id) {
  await Event.deleteOne({ _id: id, owner });
}
