import { Router, Request, Response } from 'express';
import { getMLStatus } from '../services/scorer';
import { logger, ProcessingError, formatErrorResponse } from '@shared/utils';

const router = Router();

// GET /api/ml-status - Returns ML model status
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = await getMLStatus();

    // Return with standardized response format
    res.json({
      status: 'success',
      message: 'ML status retrieved successfully',
      data: status,
    });
  } catch (error) {
    // [DEPRECATED: 2025-08-11] Old error pattern preserved for reference
    // logger.error('Error getting ML status:', error);
    // res.status(500).json({ error: 'Internal server error' });

    logger.error('ML status API error:', error);

    const errorResponse = formatErrorResponse(error as Error);
    const statusCode = error instanceof ProcessingError ? 422 : 500;

    res.status(statusCode).json(errorResponse);
  }
});

export default router;
