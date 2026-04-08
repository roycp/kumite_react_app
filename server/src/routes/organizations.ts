import { Router } from 'express';
import { Organization } from '../models/Organization';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(await Organization.find().lean());
});

router.get('/:id', async (req, res) => {
  const item = await Organization.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', async (req, res) => {
  try {
    const item = await Organization.create(req.body);
    res.status(201).json(item.toObject());
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const item = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  const item = await Organization.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
