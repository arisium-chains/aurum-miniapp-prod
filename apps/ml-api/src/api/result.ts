import { Router, Request, Response } from 'express';
import { getFaceScoringQueue, isQueueAvailable } from '../services/queue';
import {
  logger,
  ValidationError,
  NotFoundError,
  NetworkError,
  ProcessingError,
  formatErrorResponse,
} from '@shared/utils';

const router = Router();

// GET /api/result/:jobId - Returns result
router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // [DEPRECATED: 2025-08-11] Old validation pattern preserved for reference
    // if (!jobId) {
    //   return res.status(400).json({ error: 'Job ID is required' });
    // }

    if (!jobId) {
      throw new ValidationError('Job ID is required');
    }

    // Check if queue is available
    if (!isQueueAvailable()) {
      throw new NetworkError('Queue service unavailable', {
        details: 'Redis/Queue is not available in this deployment',
      });
    }

    // Get job from queue
    const queue = getFaceScoringQueue();
    if (!queue) {
      throw new NetworkError('Queue not available');
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Check if job is completed
    const state = await job.getState();

    if (state !== 'completed') {
      throw new ProcessingError('Job not completed yet', {
        jobId,
        currentStatus: state,
      });
    }

    // Return result with standardized response format
    return res.json({
      status: 'success',
      message: 'Job result retrieved successfully',
      data: {
        jobId,
        result: job.returnvalue,
      },
    });
  } catch (error) {
    // [DEPRECATED: 2025-08-11] Old error pattern preserved for reference
    // logger.error('Error getting job result:', error);
    // return res.status(500).json({ error: 'Internal server error' });

    logger.error('Job result API error:', error);

    const errorResponse = formatErrorResponse(error as Error);
    const statusCode =
      error instanceof ValidationError
        ? 400
        : error instanceof NotFoundError
          ? 404
          : error instanceof ProcessingError
            ? 422
            : error instanceof NetworkError
              ? 503
              : 500;

    return res.status(statusCode).json(errorResponse);
  }
});

export default router;
