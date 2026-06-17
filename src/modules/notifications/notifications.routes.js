import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

// Define schema inline for simplicity of the module
const notificationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    eventId: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

// Get all notifications for user
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await Notification.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(list);
  })
);

// Trigger a new notification
router.post(
  '/trigger',
  asyncHandler(async (req, res) => {
    const { title, message, eventId, userId } = req.body;
    // Notify specified user, fallback to currently logged-in user
    const recipient = userId || req.user.id;

    const notif = await Notification.create({
      owner: recipient,
      title,
      message,
      eventId: eventId || null,
    });

    res.status(201).json(notif);
  })
);

// Mark all as read
router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ owner: req.user.id }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  })
);

export default router;
