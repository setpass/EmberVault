import { Router } from 'express';
import { createCollectionItem, getCollection, updateCollection } from '../services/dataService.js';

export function createCollectionRouter(key) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      res.json(await getCollection(key));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await createCollectionItem(key, req.body));
    } catch (error) {
      next(error);
    }
  });

  router.put('/', async (req, res, next) => {
    try {
      res.json(await updateCollection(key, req.body));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
