import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { Vendor } from './modules/vendors/vendor.model.js';
import { Event } from './modules/events/event.model.js';

// Ensure the 2dsphere geo indexes exist — $near/$geoNear (nearby & recommendations)
// hard-fail without them, and autoIndex won't add them to a pre-existing collection.
// Build each independently so one bad collection can't block the other (syncIndexes
// is all-or-nothing and silently aborts if any doc has a malformed location).
// A present-but-malformed `location` (coords not length-2 or out of WGS84 range) blocks the
// 2dsphere build — and then every $near query 500s. A *missing* location is fine (skipped).
// So on failure, unset only the broken locations (non-destructive) and retry once.
async function repairBadLocations(Model) {
  const bad = {
    location: { $exists: true, $ne: null },
    $or: [
      { 'location.coordinates': { $not: { $size: 2 } } },
      { 'location.coordinates.0': { $not: { $gte: -180, $lte: 180 } } },
      { 'location.coordinates.1': { $not: { $gte: -90, $lte: 90 } } },
    ],
  };
  const res = await Model.collection.updateMany(bad, { $unset: { location: '' } });
  if (res.modifiedCount) {
    console.warn(`[db] ${Model.collection.name}: cleared ${res.modifiedCount} malformed location(s)`);
  }
  return res.modifiedCount;
}

async function ensureIndexes() {
  for (const Model of [Vendor, Event]) {
    try {
      await Model.collection.createIndex({ location: '2dsphere' });
      console.log(`[db] ${Model.collection.name}.location 2dsphere ready`);
    } catch (e) {
      console.warn(`[db] ${Model.collection.name} index failed:`, e.message, '— repairing');
      try {
        await repairBadLocations(Model);
        await Model.collection.createIndex({ location: '2dsphere' });
        console.log(`[db] ${Model.collection.name}.location 2dsphere ready (after repair)`);
      } catch (e2) {
        console.error(`[db] ${Model.collection.name} index still failing:`, e2.message);
      }
    }
  }
}

async function main() {
  await connectDB();
  await ensureIndexes();
  createApp().listen(env.port, () => {
    console.log(`[server] listening on :${env.port}`);
  });
}

main().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
