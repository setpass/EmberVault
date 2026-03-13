import { Router } from 'express';
import {
  getInventoryState,
  useConsumable,
  equipItem,
  unequipSlot,
} from '../services/inventoryEngine.js';

const router = Router();

/** GET /api/inventory */
router.get('/', async (req, res, next) => {
  try { res.json(await getInventoryState()); }
  catch (err) { next(err); }
});

/** POST /api/inventory/use — use a consumable */
router.post('/use', async (req, res, next) => {
  try {
    const { itemId, slotIndex } = req.body ?? {};
    if (!itemId) return res.status(400).json({ message: 'itemId required.' });
    const result = await useConsumable(itemId, slotIndex ?? 0);
    const state  = await getInventoryState();
    res.json({ ...result, inventory: state });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('not a consumable') || err.message.includes('not own')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
});

/** POST /api/inventory/equip — equip an item */
router.post('/equip', async (req, res, next) => {
  try {
    const { itemId } = req.body ?? {};
    if (!itemId) return res.status(400).json({ message: 'itemId required.' });
    const equipped = await equipItem(itemId);
    const state    = await getInventoryState();
    res.json({ equipped, inventory: state });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('not own') || err.message.includes('cannot be equipped')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
});

/** POST /api/inventory/unequip — unequip a slot */
router.post('/unequip', async (req, res, next) => {
  try {
    const { slot } = req.body ?? {};
    if (!slot) return res.status(400).json({ message: 'slot required.' });
    const equipped = await unequipSlot(slot);
    const state    = await getInventoryState();
    res.json({ equipped, inventory: state });
  } catch (err) { next(err); }
});

export default router;
