import { Router } from 'express';
import { getMLStatus } from '../services/scorer';

const router = Router();

// GET /api/ml-status - Returns ML model status
router.get('/', async (req, res) => {
  try {
    const status = await getMLStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting ML status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;