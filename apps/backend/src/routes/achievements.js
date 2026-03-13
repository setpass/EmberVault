import { Router } from 'express';
import { getAchievementsState, processAchievementsAfterAction } from '../services/achievementsEngine.js';

const router = Router();

/** GET /api/achievements — full achievements state */
router.get('/', async (req, res, next) => {
  try { res.json(await getAchievementsState()); }
  catch (err) { next(err); }
});

/** POST /api/achievements/check — manually trigger achievement check (called after forge actions) */
router.post('/check', async (req, res, next) => {
  try {
    const { forge } = req.body ?? {};
    if (!forge) return res.status(400).json({ message: 'forge state is required.' });
    const newAchievements = await processAchievementsAfterAction(forge);
    const state = await getAchievementsState();
    res.json({ newAchievements, ...state });
  } catch (err) { next(err); }
});

export default router;
