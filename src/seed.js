// Seed a starter set of vendors around Chennai so nearby/recommendations return
// real, ranked data out of the box. Run: npm run seed
import { connectDB } from './config/db.js';
import { Vendor } from './modules/vendors/vendor.model.js';
import mongoose from 'mongoose';

const CHENNAI = { lat: 13.0827, lng: 80.2707 };

// Spread vendors a few km around the centre.
function near(i) {
  return [CHENNAI.lng + (Math.random() - 0.5) * 0.15, CHENNAI.lat + (Math.random() - 0.5) * 0.15];
}

const CATEGORIES = {
  caterer: ['Sri Krishna Caterers', 'Annapoorna Catering', 'Royal Feast', 'Sangamam Catering'],
  dj: ['DJ Pulse Events', 'Beatbox DJ', 'SoundWave DJ', 'Rhythm Nights'],
  photographer: ['Candid Clicks', 'Wedding Frames', 'Moments Studio', 'Drone Shoot Co'],
  decorator: ['Floral Dreams Decor', 'Stage Magic', 'LED Lights Decor', 'Mandap Designers'],
  organizer: ['Grand Wedding Planners', 'EventPro Coordinators', 'Celebration Crew'],
  entertainment: ['Magic Moments', 'Live Orchestra Group', 'Kids Fun Zone', 'Dance Crew'],
  vehicle: ['Luxury Car Rentals', 'Wedding Cars Chennai', 'Royal Travels Bus'],
  makeup: ['Bridal Glow Makeup', 'Glam Studio', 'Groom Style'],
  hotel: ['Hotel Grand Palace', 'Comfort Lodge', 'GRT Guest House'],
};

async function main() {
  await connectDB();
  await Vendor.deleteMany({ source: 'owned' });

  const docs = [];
  let i = 0;
  for (const [category, names] of Object.entries(CATEGORIES)) {
    for (const name of names) {
      docs.push({
        name,
        category,
        phone: `+9198${String(40000000 + i).slice(0, 8)}`,
        whatsapp: `+9198${String(40000000 + i).slice(0, 8)}`,
        rating: +(3.5 + Math.random() * 1.5).toFixed(1),
        reviewCount: Math.floor(20 + Math.random() * 800),
        startingPrice: Math.floor((1 + Math.random() * 9)) * 10000,
        popularity: Math.floor(30 + Math.random() * 70),
        address: 'Chennai, Tamil Nadu',
        location: { type: 'Point', coordinates: near(i) },
        source: 'owned',
      });
      i++;
    }
  }

  await Vendor.insertMany(docs);
  console.log(`[seed] inserted ${docs.length} vendors around Chennai`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
