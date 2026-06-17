import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'conference' },
    venue: { type: String, default: '' },
    venueAddress: { type: String, default: '' },
    location: { type: pointSchema, default: undefined },
    dateTime: { type: Date, required: true },
    endDateTime: { type: Date },
    attendeeLimit: { type: Number, default: 100 },
    organizerName: { type: String, default: '' },
    organizerEmail: { type: String, default: '' },
    bannerImagePath: { type: String },
    ticketPrice: { type: Number, default: 0 },
    colorValue: { type: Number, default: 0xff6c63ff },
    isRecurring: { type: Boolean, default: false },
    recurringPattern: { type: String },
    totalTicketsSold: { type: Number, default: 0 },
    totalCheckedIn: { type: Number, default: 0 },
    status: { type: String, default: 'upcoming' },
    tags: { type: [String], default: [] },
    totalBudget: { type: Number, default: 0 },
    ticketTypes: { type: [String], default: ['General'] },
    ticketPrices: { type: [Number], default: [0] },
  },
  { timestamps: true }
);

eventSchema.index({ location: '2dsphere' });

export const Event = mongoose.model('Event', eventSchema);
