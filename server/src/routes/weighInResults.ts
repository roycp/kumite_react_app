import { Router } from 'express';
import { WeighInResult } from '../models/WeighInResult';
import { normalizeId, normalizeIds } from '../utils/normalize';

const router = Router();

router.get('/', async (req, res) => {
  const filter: Record<string, string> = {};
  if (req.query.tournamentId)   filter.tournamentId   = req.query.tournamentId as string;
  if (req.query.registrationId) filter.registrationId = req.query.registrationId as string;
  const items = await WeighInResult.find(filter).lean();
  res.json(normalizeIds(items));
});

router.get('/:id', async (req, res) => {
  const item = await WeighInResult.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(normalizeId(item));
});

router.post('/', async (req, res) => {
  try {
    const item = await WeighInResult.create(req.body);
    res.status(201).json(normalizeId(item.toObject()));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const item = await WeighInResult.findByIdAndUpdate(
    req.params.id, req.body, { new: true, runValidators: true },
  ).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(normalizeId(item));
});

export default router;
