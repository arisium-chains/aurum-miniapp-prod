import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { getFaceScoringQueue, isQueueAvailable } from '../services/queue';
import { faceScoreService } from '../services/faceScoreService';
import path from 'path';
import fs from 'fs';
import { logger } from '@shared/utils';
import {
  ValidationError,
  ProcessingError,
  formatErrorResponse,
  withErrorHandling,
} from '@shared/utils';

const router = Router();

// Multer setup for file uploads (moved here to avoid circular dependency)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

// POST /api/score - Accepts image and returns jobId or direct result
router.post(
  '/',
  upload.single('image'),
  withErrorHandling(async (req, res) => {
    // [DEPRECATED: 2025-08-11] Old untyped validation pattern
    // if (!req.file && !req.body.image) {
    //   return res.status(400).json({ error: 'Image is required' });
    // }

    // Validate input using standardized error handling
    if (!req.file && !req.body.image) {
      throw new ValidationError('Image is required');
    }

    const imageData = req.file ? req.file.path : req.body.image;

    // Check if queue is available for async processing
    if (isQueueAvailable()) {
      // Generate a unique job ID
      const jobId = uuidv4();

      // Add job to queue
      const queue = getFaceScoringQueue();
      if (queue) {
        const job = await queue.add(
          'faceScoringJob',
          {
            image: imageData,
            isBase64: !req.file,
          },
          {
            jobId,
          }
        );

        // Return job ID for async processing
        return res.status(202).json({
          status: 'success',
          message: 'Job queued for processing',
          data: { jobId: job.id },
        });
      }
    }

    // Fallback to direct processing when queue unavailable
    logger.warn('⚠️  Queue unavailable, processing directly');

    // For file uploads, read the file content
    let processData = imageData;
    if (req.file) {
      // Convert file path to base64 for direct processing
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64 = fileBuffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';
      processData = `data:${mimeType};base64,${base64}`;

      // Clean up uploaded file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temporary file:', cleanupError);
      }
    }

    try {
      // Process directly using face score service
      const result = await faceScoreService.scoreFace(processData);

      // Return direct result with success status
      return res.status(200).json({
        status: 'success',
        message: 'Face score calculated directly (queue unavailable)',
        data: result,
        mode: 'direct',
      });
    } catch (processingError) {
      // Convert processing errors to standardized format
      if (processingError instanceof Error) {
        throw new ProcessingError(
          `Face scoring failed: ${processingError.message}`,
          { originalError: processingError.message }
        );
      }
      throw new ProcessingError('Face scoring failed');
    }
  })
);

// Error handling middleware for this router
router.use((error: any, req: any, res: any, next: any) => {
  logger.error('Face scoring API error:', error);

  const errorResponse = formatErrorResponse(error);
  const statusCode =
    error instanceof ValidationError
      ? 400
      : error instanceof ProcessingError
        ? 422
        : 500;

  return res.status(statusCode).json(errorResponse);
});

export default router;
