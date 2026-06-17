import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // caterer, dj, photographer, decorator, organizer, entertainment, vehicle, makeup, hotel
    category: { type: String, required: true, index: true },
    subCategory: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    rating: { type: Number, default: 0 }, // 0..5
    reviewCount: { type: Number, default: 0 },
    startingPrice: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 }, // 0..100
    address: { type: String, default: '' },
    location: { type: pointSchema, required: true },
    source: { type: String, enum: ['owned', 'osm'], default: 'owned' },
    // Set when a vendor self-registers this listing (null for seeded data).
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

vendorSchema.index({ location: '2dsphere' });

export const Vendor = mongoose.model('Vendor', vendorSchema);
