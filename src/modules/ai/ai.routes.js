import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import { aiLimiter } from '../../middlewares/rateLimit.js';
import * as controller from './ai.controller.js';

const router = Router();

router.use(aiLimiter);

const budgetSchema = z.object({
  category: z.string().optional(),
  totalBudget: z.number().positive('totalBudget must be positive'),
});

const chatSchema = z.object({
  eventId: z.string().min(1, 'eventId required'),
  message: z.string().min(1, 'message required'),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .optional(),
});

router.post('/budget', validate(budgetSchema), controller.budget);
router.post('/chat', validate(chatSchema), controller.chat);

export default router;
