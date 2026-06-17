import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './ai.service.js';
import * as events from '../events/event.service.js';

export const budget = asyncHandler(async (req, res) => {
  const { category = 'event', totalBudget } = req.body;
  res.json(await service.suggestBudget(category, totalBudget));
});

export const chat = asyncHandler(async (req, res) => {
  const { eventId, message, history } = req.body;
  const event = await events.getEvent(eventId);
  res.json(await service.chat(event, message, history));
});
