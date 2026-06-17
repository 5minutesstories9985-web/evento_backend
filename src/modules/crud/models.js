import mongoose from 'mongoose';

// Strict Schemas for EventSphere Core entities

const ticketSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: String, required: true, index: true },
    clientId: { type: String, index: true },
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, default: '' },
    ticketType: { type: String, default: 'General' },
    price: { type: Number, default: 0.0 },
    bookingDate: { type: Date, default: Date.now },
    qrData: { type: String, required: true },
    seatNumber: { type: String, default: null },
    status: { type: String, enum: ['booked', 'checked_in', 'cancelled'], default: 'booked' },
    isScanned: { type: Boolean, default: false },
    scannedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const attendeeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: String, required: true, index: true },
    clientId: { type: String, index: true },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    ticketType: { type: String, default: 'General' },
    status: { type: String, enum: ['pending', 'checked_in'], default: 'pending' },
    checkInTime: { type: Date, default: null },
  },
  { timestamps: true }
);

const expenseSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: String, required: true, index: true },
    clientId: { type: String, index: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const reminderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: String, required: true, index: true },
    clientId: { type: String, index: true },
    title: { type: String, required: true },
    notes: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: String, index: true },
    clientId: { type: String, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    vendorName: { type: String, default: '' },
    venueName: { type: String, default: '' },
    bookingDate: { type: Date, default: Date.now },
    price: { type: Number, default: 0.0 },
    status: { type: String, enum: ['pending', 'confirmed', 'paid', 'cancelled'], default: 'pending' },
    paymentId: { type: String, default: null },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
export const Attendee = mongoose.model('Attendee', attendeeSchema);
export const Expense = mongoose.model('Expense', expenseSchema);
export const Reminder = mongoose.model('Reminder', reminderSchema);
export const Booking = mongoose.model('Booking', bookingSchema);
