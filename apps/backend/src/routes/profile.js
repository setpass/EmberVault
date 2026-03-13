import { Router } from 'express';
import { getCollection, updateCollection } from '../services/dataService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await getCollection('profile'));
  } catch (error) {
    next(error);
  }
});

router.put('/', async (req, res, next) => {
  try {
    res.json(await updateCollection('profile', req.body));
  } catch (error) {
    next(error);
  }
});

export default router;
