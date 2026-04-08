import { Router } from 'express';
import { Registration } from '../models/Registration';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await Registration.find().lean();
  res.json(items);
});

router.get('/:id', async (req, res) => {
  const item = await Registration.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', async (req, res) => {
  try {
    const item = await Registration.create(req.body);
    res.status(201).json(item.toObject());
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const item = await Registration.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  const item = await Registration.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
