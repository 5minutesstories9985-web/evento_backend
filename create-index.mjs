// One-off: build the geo indexes the $near/$geoNear queries need, directly on
// the live DB. Run WITH Railway's env injected so MONGODB_URI is available:
//
//   railway run node create-index.mjs
//
// Idempotent — safe to run more than once.
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set. Run via: railway run node create-index.mjs');
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
console.log('[idx] connected:', mongoose.connection.host);

// Build each index independently so one bad collection can't block the other.
for (const coll of ['vendors', 'events']) {
  try {
    const name = await db.collection(coll).createIndex({ location: '2dsphere' });
    console.log(`[idx] ${coll}.location 2dsphere → ${name}`);
  } catch (e) {
    console.warn(`[idx] ${coll} failed: ${e.message}`);
  }
}

await mongoose.disconnect();
console.log('[idx] done');
process.exit(0);
