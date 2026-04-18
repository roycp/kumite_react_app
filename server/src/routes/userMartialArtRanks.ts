import { Router } from 'express';
import { UserMartialArtRank } from '../models/UserMartialArtRank';
import { normalizeId, normalizeIds } from '../utils/normalize';

const router = Router();

router.get('/', async (req, res) => {
  const filter: Record<string, string> = {};
  if (req.query.userId)       filter.userId       = req.query.userId as string;
  if (req.query.martialArtId) filter.martialArtId = req.query.martialArtId as string;
  const items = await UserMartialArtRank.find(filter).lean();
  res.json(normalizeIds(items));
});

router.get('/:id', async (req, res) => {
  const item = await UserMartialArtRank.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(normalizeId(item));
});

// Upsert: find by userId+martialArtId, update rankSystemId; create if missing
router.post('/', async (req, res) => {
  try {
    const { userId, martialArtId, rankSystemId } = req.body;
    if (!userId || !martialArtId || !rankSystemId) {
      return res.status(400).json({ error: 'userId, martialArtId, and rankSystemId are required' });
    }
    const item = await UserMartialArtRank.findOneAndUpdate(
      { userId, martialArtId },
      { userId, martialArtId, rankSystemId },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    res.status(201).json(normalizeId(item));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const item = await UserMartialArtRank.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
