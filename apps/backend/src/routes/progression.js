import { Router } from 'express';
import { getProgressionState, claimTierReward } from '../services/progressionEngine.js';

const router = Router();

/** GET /api/progression */
router.get('/', async (req, res, next) => {
  try { res.json(await getProgressionState()); }
  catch (err) { next(err); }
});

/** POST /api/progression/claim */
router.post('/claim', async (req, res, next) => {
  try {
    const { tier, track } = req.body ?? {};
    if (!tier || !track) return res.status(400).json({ message: 'tier and track required.' });
    const result = await claimTierReward(Number(tier), track);
    const state  = await getProgressionState();
    res.json({ ...result, progression: state });
  } catch (err) {
    if (err.message.includes('already claimed') || err.message.includes('not yet') || err.message.includes('not unlocked')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
});

export default router;
