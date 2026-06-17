import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  res.status(201).json(await service.register(req.body));
});

export const login = asyncHandler(async (req, res) => {
  res.json(await service.login(req.body));
});
