import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { requireAuth, requireRole } from './middlewares/auth.js';
import { errorHandler, notFound } from './middlewares/error.js';

import authRoutes from './modules/auth/auth.routes.js';
import eventRoutes from './modules/events/event.routes.js';
import vendorRoutes from './modules/vendors/vendor.routes.js';
import mapsRoutes from './modules/maps/maps.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import { ownedCrud } from './modules/crud/ownedCrud.js';
import { Ticket, Attendee, Expense, Reminder, Booking } from './modules/crud/models.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/health', (req, res) => res.json({ ok: true }));

  // Public
  app.use('/api/auth', authRoutes);

  // Everything below requires a valid JWT
  app.use('/api', requireAuth);
  app.use('/api/events', eventRoutes);
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/maps', mapsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/tickets', ownedCrud(Ticket));
  app.use('/api/attendees', ownedCrud(Attendee));
  app.use('/api/expenses', ownedCrud(Expense));
  app.use('/api/reminders', ownedCrud(Reminder));
  app.use('/api/bookings', requireRole('user'), ownedCrud(Booking));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
