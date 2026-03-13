import { Router } from 'express';
import {
  processAction, getForgeState,
  ARTIFACT_CATALOG, ACTION_HEAT, SEASONAL_TRIALS,
  COMBO_WINDOW_MS, DECAY_PER_HOUR, COMBO_RESET_HEAT,
} from '../services/forgeEngine.js';
import { processAchievementsAfterAction } from '../services/achievementsEngine.js';
import { updateQuestProgress } from '../services/questEngine.js';
import { resolveDrops, addItemsToInventory } from '../services/inventoryEngine.js';
import { awardActionXP } from '../services/progressionEngine.js';

const router = Router();

/** GET /api/forge — full state */
router.get('/', async (req, res, next) => {
  try { res.json(await getForgeState()); }
  catch (err) { next(err); }
});

/** GET /api/forge/tick — lightweight tick for realtime polling (no auth needed) */
router.get('/tick', async (req, res, next) => {
  try {
    const state = await getForgeState();
    const f = state.forge;
    res.json({
      heat: f.heat,
      rank: f.rank,
      comboCount: f.comboCount,
      comboChain: f.comboChain,
      comboActive: f.comboActive,
      comboWindowRemainingMs: f.comboWindowRemainingMs,
      heatHint: f.heatHint,
      comboHint: f.comboHint,
      lastActionAt: f.lastActionAt,
      // expose constants so frontend can compute decay preview
      decayPerHour: DECAY_PER_HOUR,
      comboWindowMs: COMBO_WINDOW_MS,
      comboResetHeat: COMBO_RESET_HEAT,
    });
  } catch (err) { next(err); }
});

/** GET /api/forge/catalog */
router.get('/catalog', async (req, res, next) => {
  try {
    const state = await getForgeState();
    res.json({ catalog: state.catalog, totalUnlocked: state.totalUnlocked, total: state.totalArtifacts });
  } catch (err) { next(err); }
});

/** GET /api/forge/trials */
router.get('/trials', async (req, res, next) => {
  try {
    const state = await getForgeState();
    res.json(state.trials);
  } catch (err) { next(err); }
});

/** GET /api/forge/actions */
router.get('/actions', (req, res) => res.json(ACTION_HEAT));

/**
 * POST /api/forge/action
 * Body: { actionType, title?, description? }
 */
router.post('/action', async (req, res, next) => {
  try {
    const { actionType, title, description } = req.body ?? {};
    if (!actionType) return res.status(400).json({ message: 'actionType is required.' });
    if (!(actionType in ACTION_HEAT)) {
      return res.status(400).json({
        message: `Invalid actionType "${actionType}". Valid: ${Object.keys(ACTION_HEAT).join(', ')}`,
      });
    }
    const result = await processAction(actionType, { title, description });
    const state  = await getForgeState();
    // Resolve item drops from this action
    const dropIds = resolveDrops(actionType, result.forge);
    // Check & persist achievements + quest progress + inventory drops in parallel
    const [newAchievements, newQuestCompletions, droppedItems, xpResult] = await Promise.all([
      processAchievementsAfterAction(result.forge),
      updateQuestProgress(result.forge, actionType),
      addItemsToInventory(dropIds),
      awardActionXP(result.forge, actionType),
    ]);
    res.json({
      ...result,
      catalog: state.catalog,
      trials: state.trials,
      comboWindowRemainingMs: state.forge.comboWindowRemainingMs,
      newAchievements,
      newQuestCompletions,
      droppedItems,
      xpResult,
    });
  } catch (err) { next(err); }
});

export default router;
