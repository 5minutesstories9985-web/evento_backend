import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import { aiLimiter } from '../../middlewares/rateLimit.js';
import { requireRole } from '../../middlewares/auth.js';
import * as controller from './event.controller.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, 'name required'),
  description: z.string().optional(),
  category: z.string().optional(),
  venue: z.string().optional(),
  dateTime: z.coerce.date(),
  endDateTime: z.coerce.date().optional(),
  attendeeLimit: z.number().optional(),
  organizerName: z.string().optional(),
  organizerEmail: z.string().optional(),
  ticketPrice: z.number().optional(),
  totalBudget: z.number().optional(),
  tags: z.array(z.string()).optional(),
  ticketTypes: z.array(z.string()).optional(),
  ticketPrices: z.array(z.number()).optional(),
}).passthrough();

const categoryQuery = z.object({ category: z.string().min(1, 'category required') });

router.post('/', requireRole('vendor'), validate(createSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.put('/:id', requireRole('vendor'), controller.update);
router.delete('/:id', requireRole('vendor'), controller.remove);
router.get('/:id/nearby-services', validate(categoryQuery, 'query'), aiLimiter, controller.nearbyServices);
router.get('/:id/recommendations', validate(categoryQuery, 'query'), aiLimiter, controller.recommendations);

export default router;
