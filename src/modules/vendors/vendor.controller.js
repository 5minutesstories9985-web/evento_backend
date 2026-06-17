import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './vendor.service.js';

export const search = asyncHandler(async (req, res) => {
  res.json(await service.search(req.query));
});

export const nearby = asyncHandler(async (req, res) => {
  const { lat, lng, category } = req.query;
  res.json(
    await service.nearby({ lat: parseFloat(lat), lng: parseFloat(lng), category })
  );
});

export const mine = asyncHandler(async (req, res) => {
  res.json(await service.listMine(req.user.id));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createForOwner(req.user.id, req.body));
});

export const update = asyncHandler(async (req, res) => {
  res.json(await service.updateOwned(req.user.id, req.params.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  await service.removeOwned(req.user.id, req.params.id);
  res.status(204).end();
});
