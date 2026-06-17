import { Router } from 'express';
import { aiLimiter } from '../../middlewares/rateLimit.js';
import * as controller from './maps.controller.js';

const router = Router();

router.use(aiLimiter);
router.get('/geocode', controller.geocodeCtrl);
router.get('/directions', controller.directions);
router.get('/nearby', controller.nearby);

export default router;
