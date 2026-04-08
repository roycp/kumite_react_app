import { Router } from 'express';
import { RoleDefinition } from '../models/RoleDefinition';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(await RoleDefinition.find().lean());
});

router.get('/:id', async (req, res) => {
  const item = await RoleDefinition.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.post('/', async (req, res) => {
  try {
    const item = await RoleDefinition.create(req.body);
    res.status(201).json(item.toObject());
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'Role name already exists' });
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const item = await RoleDefinition.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  const item = await RoleDefinition.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

export default router;
