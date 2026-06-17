import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';

// Generic owner-scoped CRUD router for a mongoose model.
// GET /            -> list (optional ?eventId= filter, paginated)
// GET /:id         -> one
// POST /           -> create (upsert by clientId if provided → idempotent sync)
// PUT /:id         -> update
// DELETE /:id      -> remove
export function ownedCrud(Model) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const filter = { owner: req.user.id };
      if (req.query.eventId) filter.eventId = req.query.eventId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const [items, total] = await Promise.all([
        Model.find(filter).skip((page - 1) * limit).limit(limit).lean(),
        Model.countDocuments(filter),
      ]);
      res.json({ items, total, page, limit });
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await Model.findOne({ _id: req.params.id, owner: req.user.id }).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const data = { ...req.body, owner: req.user.id };
      // Idempotent: same clientId updates instead of duplicating (offline sync replays).
      if (data.clientId) {
        const doc = await Model.findOneAndUpdate(
          { owner: req.user.id, clientId: data.clientId },
          data,
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return res.status(201).json(doc);
      }
      res.status(201).json(await Model.create(data));
    })
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await Model.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.id },
        req.body,
        { new: true }
      );
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await Model.deleteOne({ _id: req.params.id, owner: req.user.id });
      res.status(204).end();
    })
  );

  return router;
}
