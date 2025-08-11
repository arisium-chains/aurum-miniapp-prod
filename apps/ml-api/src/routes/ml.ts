import { Router } from 'express';
import multer from 'multer';
import { config } from '../config';
import { mlService } from '../services/mlService';
import { ApiResponse, LegacyApiResponse } from '@shared/types';
import { ScoringResult } from '@shared/types';
import {
  logger,
  ValidationError,
  ProcessingError,
  formatErrorResponse,
} from '@shared/utils';

const router = Router();

/**
 * @description Configure multer for image uploads with enhanced validation
 * Migrated from nested API with improved security and error handling
 */
const upload = multer({
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.ml.batchSize,
  },
  fileFilter: (req, file, cb) => {
    // Enhanced MIME type validation
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/bmp',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`
        )
      );
    }
  },
  storage: multer.memoryStorage(),
});

/**
 * @description Advanced single image scoring endpoint with ONNX processing
 * POST /api/ml/score
 */
router.post('/score', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      const error = new ValidationError('No image file provided');
      return res.status(400).json(formatErrorResponse(error));
    }

    const userId = req.body.userId as string | undefined;
    const sessionId = req.body.sessionId as string | undefined;

    logger.info('Processing advanced ML scoring request', {
      userId: userId || 'anonymous',
      sessionId,
      imageSize: req.file.size,
      mimeType: req.file.mimetype,
      service: 'advanced-ml-api',
    });

    const result = await mlService.processImage(req.file.buffer);

    // Standardized API response following project conventions
    const response: ApiResponse<ScoringResult> = {
      status: 'success',
      message: 'Face score calculated successfully using advanced ONNX models',
      data: result,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error in advanced ML scoring:', error);

    if (error instanceof ValidationError || error instanceof ProcessingError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }

    const processingError = new ProcessingError(
      error instanceof Error ? error.message : 'Unknown processing error'
    );
    const errorResponse = formatErrorResponse(processingError);
    return res.status(500).json(errorResponse);
  }
});

/**
 * @description Advanced batch image scoring endpoint
 * POST /api/ml/score/batch
 * Processes multiple images in parallel with BullMQ queuing
 */
router.post(
  '/score/batch',
  upload.array('images', config.ml.batchSize),
  async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        const error = new ValidationError(
          'No image files provided for batch processing'
        );
        return res.status(400).json(formatErrorResponse(error));
      }

      if (req.files.length > config.ml.batchSize) {
        const error = new ValidationError(
          `Batch size exceeds limit. Maximum ${config.ml.batchSize} images allowed`
        );
        return res.status(400).json(formatErrorResponse(error));
      }

      const userId = req.body.userId as string | undefined;
      const sessionId = req.body.sessionId as string | undefined;

      logger.info('Processing batch ML scoring request', {
        userId: userId || 'anonymous',
        sessionId,
        imageCount: req.files.length,
        totalSize: req.files.reduce((sum, file) => sum + file.size, 0),
        service: 'advanced-ml-api',
      });

      const startTime = Date.now();
      const results: ScoringResult[] = [];
      const errors: string[] = [];

      // Process images in parallel with error handling
      const processingPromises = req.files.map(async (file, index) => {
        try {
          logger.debug(
            `Processing batch image ${index + 1}/${req.files.length}`,
            {
              filename: file.originalname,
              size: file.size,
            }
          );

          const result = await mlService.processImage(file.buffer);
          return { index, result, error: null };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error processing batch image ${index + 1}:`, error);
          return { index, result: null, error: errorMessage };
        }
      });

      const processingResults = await Promise.all(processingPromises);

      // Collect results and errors
      processingResults.forEach(({ index, result, error }) => {
        if (result) {
          results.push(result);
        } else {
          errors.push(`Image ${index + 1}: ${error}`);
        }
      });

      const totalProcessingTime = Date.now() - startTime;

      // Enhanced batch response with metadata
      const response: ApiResponse<{
        results: ScoringResult[];
        summary: {
          totalImages: number;
          successfulImages: number;
          failedImages: number;
          totalProcessingTime: number;
          averageProcessingTime: number;
          errors: string[];
        };
      }> = {
        status: results.length > 0 ? 'success' : 'error',
        message: `Batch processing completed: ${results.length}/${req.files.length} images processed successfully`,
        data: {
          results,
          summary: {
            totalImages: req.files.length,
            successfulImages: results.length,
            failedImages: errors.length,
            totalProcessingTime,
            averageProcessingTime:
              results.length > 0 ? totalProcessingTime / results.length : 0,
            errors: errors.slice(0, 5), // Limit error messages
          },
        },
      };

      logger.info('Batch ML processing completed', {
        totalImages: req.files.length,
        successfulImages: results.length,
        failedImages: errors.length,
        totalProcessingTime,
      });

      res.json(response);
    } catch (error) {
      logger.error('Error in batch ML processing:', error);

      if (
        error instanceof ValidationError ||
        error instanceof ProcessingError
      ) {
        const errorResponse = formatErrorResponse(error);
        return res.status(error.statusCode).json(errorResponse);
      }

      const processingError = new ProcessingError(
        error instanceof Error
          ? error.message
          : 'Unknown batch processing error'
      );
      const errorResponse = formatErrorResponse(processingError);
      return res.status(500).json(errorResponse);
    }
  }
);

/**
 * @description ML models status endpoint
 * GET /api/ml/models/status
 */
router.get('/models/status', async (req, res) => {
  try {
    const modelInfo = mlService.modelInfo;
    const isHealthy = mlService.isHealthy;

    const statusResponse = {
      service: 'advanced-ml-api',
      overall: isHealthy ? 'healthy' : 'unhealthy',
      models: {
        loaded: modelInfo.length,
        available: modelInfo.map(model => ({
          name: model.name,
          inputShape: model.inputShape,
          outputShape: model.outputShape,
        })),
      },
      capabilities: {
        faceDetection: modelInfo.some(m => m.name === 'face_detection'),
        faceEmbedding: modelInfo.some(m => m.name === 'face_embedding'),
        attractivenessScoring: modelInfo.some(m => m.name === 'attractiveness'),
        batchProcessing: true,
        maxBatchSize: config.ml.batchSize,
      },
      timestamp: new Date().toISOString(),
    };

    const response: ApiResponse<typeof statusResponse> = {
      status: 'success',
      message: 'ML models status retrieved successfully',
      data: statusResponse,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error retrieving ML models status:', error);

    const processingError = new ProcessingError(
      'Failed to retrieve models status'
    );
    const errorResponse = formatErrorResponse(processingError);
    return res.status(500).json(errorResponse);
  }
});

/**
 * @description ML service health check endpoint
 * GET /api/ml/health
 */
router.get('/health', async (req, res) => {
  try {
    const healthData = {
      status: mlService.isHealthy ? 'healthy' : 'unhealthy',
      service: 'advanced-ml-api',
      version: '2.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      models: {
        initialized: mlService.isHealthy,
        count: mlService.modelInfo.length,
      },
      timestamp: new Date().toISOString(),
    };

    const response: ApiResponse<typeof healthData> = {
      status: 'success',
      message: 'Advanced ML API is operational',
      data: healthData,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error in ML health check:', error);

    const errorResponse: ApiResponse<null> = {
      status: 'error',
      message: 'Health check failed',
      data: null,
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * @description Legacy compatibility endpoint for backward compatibility
 * POST /api/ml/face-score (legacy format)
 */
router.post('/face-score', async (req, res) => {
  try {
    const { imageUrl, imageBase64 } = req.body;

    if (!imageUrl && !imageBase64) {
      const error = new ValidationError(
        'Either imageUrl or imageBase64 is required'
      );
      const errorResponse = formatErrorResponse(error);
      return res.status(400).json(errorResponse);
    }

    logger.info('Processing legacy face score request', {
      hasImageUrl: !!imageUrl,
      hasImageBase64: !!imageBase64,
      service: 'legacy-compatibility',
    });

    // Convert base64 to buffer if provided
    let imageBuffer: Buffer;
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // For imageUrl, this would require fetching the image
      // For now, return an error suggesting to use the new endpoint
      const error = new ValidationError(
        'imageUrl processing not implemented. Please use imageBase64 or the new /api/ml/score endpoint with file upload'
      );
      const errorResponse = formatErrorResponse(error);
      return res.status(400).json(errorResponse);
    }

    const result = await mlService.processImage(imageBuffer);

    // Convert to legacy response format
    const legacyResponse: LegacyApiResponse<ScoringResult> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.json(legacyResponse);
  } catch (error) {
    logger.error('Error in legacy face score processing:', error);

    const legacyErrorResponse: LegacyApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(legacyErrorResponse);
  }
});

export default router;
