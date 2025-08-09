import { Router } from "express";
import { redisService } from "@/services/redis";
import { mlService } from "@/services/ml";
import { HealthCheckResponse } from "@/types";
import { asyncHandler } from "@/middleware/errorHandler";

const router = Router();

router.get(
  "/health",
  asyncHandler(async (req, res) => {
    const healthCheck: HealthCheckResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        redis: redisService.isHealthy,
        queue: true, // TODO: Add queue health check
        models: mlService.isHealthy,
      },
      version: "1.0.0",
    };

    const isHealthy = healthCheck.services.redis && healthCheck.services.models;
    healthCheck.status = isHealthy ? "healthy" : "unhealthy";

    res.status(isHealthy ? 200 : 503).json(healthCheck);
  })
);

router.get(
  "/ready",
  asyncHandler(async (req, res) => {
    const isReady = redisService.isHealthy && mlService.isHealthy;

    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      timestamp: new Date().toISOString(),
    });
  })
);

router.get(
  "/metrics",
  asyncHandler(async (req, res) => {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };

    res.json(metrics);
  })
);

export default router;
