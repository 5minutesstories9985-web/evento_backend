import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './event.service.js';
import * as recs from '../recommendations/recommendation.service.js';

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createEvent(req.user.id, req.body));
});

export const list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const mine = req.query.mine === 'true';
  res.json(await service.listEvents({ page, limit, owner: mine ? req.user.id : undefined }));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json(await service.getEvent(req.params.id));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await service.updateEvent(req.user.id, req.params.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteEvent(req.user.id, req.params.id);
  res.status(204).end();
});

export const nearbyServices = asyncHandler(async (req, res) => {
  const event = await service.getEvent(req.params.id);
  res.json(await recs.nearbyServices(event, req.query.category));
});

export const recommendations = asyncHandler(async (req, res) => {
  const event = await service.getEvent(req.params.id);
  res.json(await recs.recommend(event, req.query.category));
});
