import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { Vendor } from './modules/vendors/vendor.model.js';
import { Event } from './modules/events/event.model.js';

// Ensure the 2dsphere geo indexes exist — $near/$geoNear (nearby & recommendations)
// hard-fail without them, and autoIndex won't add them to a pre-existing collection.
// Build each independently so one bad collection can't block the other (syncIndexes
// is all-or-nothing and silently aborts if any doc has a malformed location).
async function ensureIndexes() {
  for (const Model of [Vendor, Event]) {
    try {
      await Model.collection.createIndex({ location: '2dsphere' });
      console.log(`[db] ${Model.collection.name}.location 2dsphere ready`);
    } catch (e) {
      console.warn(`[db] ${Model.collection.name} index failed:`, e.message);
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
