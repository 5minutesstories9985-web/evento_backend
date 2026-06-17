import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    category: { type: String, index: true },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true }
);

recommendationSchema.index({ event: 1, category: 1 }, { unique: true });

export const Recommendation = mongoose.model('Recommendation', recommendationSchema);
