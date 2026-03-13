import { Router } from 'express';
import { getQuestState } from '../services/questEngine.js';

const router = Router();

/** GET /api/quests — full quest state */
router.get('/', async (req, res, next) => {
  try { res.json(await getQuestState()); }
  catch (err) { next(err); }
});

export default router;
