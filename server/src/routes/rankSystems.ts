import { Router } from 'express';
import { RankSystem } from '../models/RankSystem';
import { normalizeId, normalizeIds } from '../utils/normalize';

const router = Router();

router.get('/', async (req, res) => {
  const filter: Record<string, string> = {};
  if (req.query.martialArtId) filter.martialArtId = req.query.martialArtId as string;
  const items = await RankSystem.find(filter).lean();
  res.json(normalizeIds(items));
});

router.get('/:id', async (req, res) => {
  const item = await RankSystem.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(normalizeId(item));
});

router.post('/', async (req, res) => {
  try {
    const item = await RankSystem.create(req.body);
    res.status(201).json(normalizeId(item.toObject()));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const item = await RankSystem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(normalizeId(item));
});

router.delete('/:id', async (req, res) => {
  const item = await RankSystem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
