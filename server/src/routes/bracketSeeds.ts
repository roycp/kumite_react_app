import { Router } from 'express';
import { BracketSeed } from '../models/BracketSeed';

const router = Router();

router.get('/:tournamentId', async (req, res) => {
  const doc = await BracketSeed.findOne({ tournamentId: req.params.tournamentId }).lean();
  if (!doc) return res.json({ tournamentId: req.params.tournamentId, seeds: {} });
  // Convert Map to plain object for JSON serialization
  const seeds = doc.seeds instanceof Map
    ? Object.fromEntries(doc.seeds)
    : (doc.seeds ?? {});
  res.json({ tournamentId: doc.tournamentId, seeds });
});

// PUT = upsert the entire seeds record for a tournament
router.put('/:tournamentId', async (req, res) => {
  const { seeds } = req.body;
  if (!seeds || typeof seeds !== 'object') {
    return res.status(400).json({ error: 'seeds object is required' });
  }
  const doc = await BracketSeed.findOneAndUpdate(
    { tournamentId: req.params.tournamentId },
    { tournamentId: req.params.tournamentId, seeds },
    { upsert: true, new: true },
  ).lean();
  const outSeeds = (doc as any).seeds instanceof Map
    ? Object.fromEntries((doc as any).seeds)
    : ((doc as any).seeds ?? {});
  res.json({ tournamentId: (doc as any).tournamentId, seeds: outSeeds });
});

export default router;
