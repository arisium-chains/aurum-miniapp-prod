import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { config } from './config';
import { mlService } from './services/mlService';
import { faceScoreService } from './services/faceScoreService';
import {
  faceScoringQueue,
  redisClient,
  initializeQueue,
  isQueueAvailable,
  isRedisClientAvailable,
} from './services/queue';

// Import shared utilities
import { logger, logRequest } from '@shared/utils';
import {
  formatErrorResponse,
  ValidationError,
  ProcessingError,
  AppError,
} from '@shared/utils';
import { ApiResponse } from './types';

// Load environment variables
dotenv.config();

// Set service name for logger
process.env.SERVICE_NAME = config.serviceName;

const app = express();
const PORT = Number(config.port);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.security.corsOrigin,
    credentials: true,
  })
);
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// [DEPRECATED: 2025-08-11] Old logging middleware preserved for reference
// app.use((req: Request, res: Response, next: NextFunction) => {
//   logger.info(`${req.method} ${req.path} - ${req.ip}`);
//   next();
// });

// Standardized logging middleware using shared utilities
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req.method, req.path, req.ip || 'unknown', duration);
  });

  next();
});

// Import ML routes
import mlRoutes from './routes/ml';

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Advanced ML Face Score API',
    version: '2.0.0',
    status: 'running',
    features: [
      'ONNX Model Processing',
      'Batch Processing',
      'Face Detection',
      'Embedding Extraction',
      'Attractiveness Scoring',
      'Queue Management',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Mount ML routes
app.use('/api/ml', mlRoutes);

/**
 * @description Face scoring endpoint with standardized error handling
 * @param req - Express request object
 * @param res - Express response object
 */
app.post('/api/face-score', async (req: Request, res: Response) => {
  try {
    const { imageUrl, imageBase64 } = req.body;

    // Validation using shared error classes
    if (!imageUrl && !imageBase64) {
      throw new ValidationError('Either imageUrl or imageBase64 is required', {
        received: { imageUrl: !!imageUrl, imageBase64: !!imageBase64 },
      });
    }

    const result = await faceScoreService.scoreFace(imageUrl || imageBase64);

    // Standardized API response format
    const response: ApiResponse = {
      status: 'success',
      message: 'Face score calculated successfully',
      data: result,
    };

    return res.json(response);
  } catch (error) {
    logger.error('Error processing face score:', error);

    // Use shared error formatting
    if (error instanceof AppError) {
      const errorResponse = formatErrorResponse(error);
      return res.status(error.statusCode).json(errorResponse);
    }

    // Handle unknown errors
    const processingError = new ProcessingError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
    const errorResponse = formatErrorResponse(processingError);
    return res.status(processingError.statusCode).json(errorResponse);
  }
});

/**
 * @description Health check endpoint with service status
 */
app.get('/api/health', (req: Request, res: Response) => {
  const healthResponse = {
    status: 'healthy' as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {
      redis: isRedisClientAvailable(),
      queue: isQueueAvailable(),
      models: true, // ML models status
    },
  };

  res.json(healthResponse);
});

// Standardized 404 handler
app.use('*', (req: Request, res: Response) => {
  const notFoundError = new ValidationError(
    'The requested resource was not found',
    {
      path: req.path,
      method: req.method,
    }
  );
  const errorResponse = formatErrorResponse(notFoundError);
  res.status(404).json(errorResponse);
});

// [DEPRECATED: 2025-08-11] Old error handler preserved for reference
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   logger.error("Unhandled error:", err);
//   res.status(500).json({
//     error: "Internal server error",
//     message: err instanceof Error ? err.message : "Unknown error",
//   });
// });

// Standardized error handler using shared utilities
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);

  // Use shared error handling
  if (err instanceof AppError) {
    const errorResponse = formatErrorResponse(err);
    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle unknown errors with shared utilities
  const internalError = new ProcessingError(
    err instanceof Error ? err.message : 'Unknown internal error'
  );
  const errorResponse = formatErrorResponse(internalError);
  return res.status(500).json(errorResponse);
});

// Initialize services and start server
async function startServer() {
  try {
    logger.info('Starting Advanced ML API server...');

    // Initialize ML service
    await mlService.initialize();
    logger.info('ML service initialized successfully');

    // Initialize queue with error handling
    await initializeQueue();
    logger.info('Queue service initialized successfully');

    // Start server
    app.listen(PORT, config.host, () => {
      logger.info(
        `Advanced ML API server running on http://${config.host}:${PORT}`
      );
      logger.info(`Environment: ${config.env}`);
      logger.info('Available endpoints:');
      logger.info('  - POST /api/ml/score (single image processing)');
      logger.info('  - POST /api/ml/score/batch (batch image processing)');
      logger.info('  - GET /api/ml/models/status (model status)');
      logger.info('  - GET /api/ml/health (service health)');
      logger.info('  - POST /api/ml/face-score (legacy compatibility)');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await mlService.shutdown();
    logger.info('ML service shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;
