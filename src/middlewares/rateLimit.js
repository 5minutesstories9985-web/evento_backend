import rateLimit from 'express-rate-limit';

// Tighter limit for the expensive AI + geo proxy routes.
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});
