import mongoose from 'mongoose';

// Migration mirrors of the Flutter Hive models. strict:false lets the client stay
// the source of truth for fields; we only pin owner + eventId for scoping.
// ponytail: flexible schema instead of re-declaring every field per model.
function ownedSchema() {
  return new mongoose.Schema(
    {
      owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      eventId: { type: String, index: true },
      clientId: { type: String, index: true }, // original Hive id, for idempotent sync
    },
    { timestamps: true, strict: false }
  );
}

export const Ticket = mongoose.model('Ticket', ownedSchema());
export const Attendee = mongoose.model('Attendee', ownedSchema());
export const Expense = mongoose.model('Expense', ownedSchema());
export const Reminder = mongoose.model('Reminder', ownedSchema());
export const Booking = mongoose.model('Booking', ownedSchema());
