import { Router } from 'express';
import { CoachAssignment } from '../models/CoachAssignment';
import { normalizeId, normalizeIds } from '../utils/normalize';

const router = Router();

router.get('/', async (req, res) => {
  const filter: Record<string, string> = {};
  if (req.query.coachId)   filter.coachId   = req.query.coachId as string;
  if (req.query.athleteId) filter.athleteId = req.query.athleteId as string;
  const items = await CoachAssignment.find(filter).lean();
  res.json(normalizeIds(items));
});

router.get('/:id', async (req, res) => {
  const item = await CoachAssignment.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(normalizeId(item));
});

router.post('/', async (req, res) => {
  try {
    const item = await CoachAssignment.create(req.body);
    res.status(201).json(normalizeId(item.toObject()));
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'Assignment already exists' });
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const item = await CoachAssignment.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
