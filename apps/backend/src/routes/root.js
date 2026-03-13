import { Router } from 'express';
import { getAllData } from '../services/dataService.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'embervault-api' });
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const data = await getAllData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
