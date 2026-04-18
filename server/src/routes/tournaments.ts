import { Router } from 'express';
import { Tournament } from '../models/Tournament';
import { normalizeId, normalizeIds } from '../utils/normalize';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(normalizeIds(await Tournament.find().lean()));
});

router.get('/:id', async (req, res) => {
  const item = await Tournament.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(normalizeId(item));
});

router.post('/', async (req, res) => {
  try {
    const item = await Tournament.create(req.body);
    res.status(201).json(normalizeId(item.toObject()));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const item = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(normalizeId(item));
});

router.delete('/:id', async (req, res) => {
  const item = await Tournament.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
