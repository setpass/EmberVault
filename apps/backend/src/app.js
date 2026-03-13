import cors from 'cors';
import express from 'express';
import rootRouter from './routes/root.js';
import profileRouter from './routes/profile.js';
import forgeRouter from './routes/forge.js';
import achievementsRouter from './routes/achievements.js';
import leaderboardRouter from './routes/leaderboard.js';
import questsRouter from './routes/quests.js';
import inventoryRouter from './routes/inventory.js';
import progressionRouter from './routes/progression.js';
import { createCollectionRouter } from './routes/collectionFactory.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length === 0 || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked for origin: ' + origin));
  },
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(authMiddleware);

app.use('/api', rootRouter);
app.use('/api/profile', profileRouter);
app.use('/api/forge', forgeRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/quests', questsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/progression', progressionRouter);
app.use('/api/credentials', createCollectionRouter('credentials'));
app.use('/api/permissions', createCollectionRouter('permissions'));
app.use('/api/activity', createCollectionRouter('activity'));
app.use('/api/vault-records', createCollectionRouter('vaultRecords'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found: ' + req.method + ' ' + req.originalUrl });
});
app.use(errorHandler);

export default app;
