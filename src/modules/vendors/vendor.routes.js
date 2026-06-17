import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from './vendor.controller.js';

const router = Router();

const nearbySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  category: z.string().optional(),
});

router.get('/search', controller.search);
router.get('/nearby', validate(nearbySchema, 'query'), controller.nearby);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
