import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.js';
import * as controller from './auth.controller.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, 'name required'),
  email: z.string().email('valid email required'),
  password: z.string().min(6, 'password must be at least 6 chars'),
});

const loginSchema = z.object({
  email: z.string().email('valid email required'),
  password: z.string().min(1, 'password required'),
});

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);

export default router;
