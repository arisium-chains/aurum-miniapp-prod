import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { faceScoreService } from "./services/faceScoreService";
import { logger } from "./utils/logger";
import Bull from "bull";
import { createRedisClient } from "./utils/redis";

// Load environment variables
dotenv.config();

// Create Redis client and Bull queue
const redisClient = createRedisClient();
const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const faceScoringQueue = new Bull("faceScoring", redisUrl);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "ML Face Score API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/face-score", async (req: Request, res: Response) => {
  try {
    const { imageUrl, imageBase64 } = req.body;

    if (!imageUrl && !imageBase64) {
      return res.status(400).json({
        error: "Either imageUrl or imageBase64 is required",
      });
    }

    const result = await faceScoreService.scoreFace(imageUrl || imageBase64);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error processing face score:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found",
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err instanceof Error ? err.message : "Unknown error",
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
export { faceScoringQueue };
