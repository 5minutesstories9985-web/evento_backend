import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { Vendor } from './modules/vendors/vendor.model.js';
import { Event } from './modules/events/event.model.js';

// Ensure the 2dsphere geo indexes exist — $near/$geoNear (nearby & recommendations)
// hard-fail without them, and autoIndex won't add them to a pre-existing collection.
async function ensureIndexes() {
  try {
    await Promise.all([Vendor.syncIndexes(), Event.syncIndexes()]);
    console.log('[db] indexes synced');
  } catch (e) {
    console.warn('[db] index sync failed:', e.message);
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
