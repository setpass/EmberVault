import { Router } from 'express';
import { getLeaderboardState } from '../services/leaderboardEngine.js';

const router = Router();

/** GET /api/leaderboard — full leaderboard state */
router.get('/', async (req, res, next) => {
  try { res.json(await getLeaderboardState()); }
  catch (err) { next(err); }
});

export default router;
