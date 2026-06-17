import { Router } from 'express';
import { Booking } from '../crud/models.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Simulated Stripe checkout payment processing
router.post(
  '/checkout',
  asyncHandler(async (req, res) => {
    const { bookingId, amount, paymentMethod = 'card' } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    const booking = await Booking.findOne({ _id: bookingId, owner: req.user.id });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Process simulated Stripe transaction
    const txnId = `ch_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

    booking.status = 'paid';
    booking.paymentId = txnId;
    booking.price = amount || booking.price || 0.0;
    await booking.save();

    res.json({
      success: true,
      transactionId: txnId,
      amount: amount || booking.price,
      currency: 'INR',
      status: 'paid',
      message: 'Simulated payment processing successful. Booking updated to paid.',
    });
  })
);

export default router;
