import { Router } from "express";
import multer from "multer";
import { config } from "../config";
import { mlService } from "../services/ml";
import { ApiResponse, ScoringResult } from "../types";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router = Router();

const upload = multer({
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post(
  "/score",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
        timestamp: new Date().toISOString(),
      });
    }

    const userId = req.body.userId as string | undefined;
    const sessionId = req.body.sessionId as string | undefined;

    logger.info(
      `Processing scoring request for user: ${userId || "anonymous"}`
    );

    const result = await mlService.processImage(req.file.buffer);

    const response: ApiResponse<ScoringResult> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

router.post(
  "/score/batch",
  upload.array("images", 10),
  asyncHandler(async (req, res) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No image files provided",
        timestamp: new Date().toISOString(),
      });
    }

    const userId = req.body.userId as string | undefined;
    const sessionId = req.body.sessionId as string | undefined;

    logger.info(
      `Processing batch scoring request for ${req.files.length} images`
    );

    const results: ScoringResult[] = [];

    for (const file of req.files) {
      const result = await mlService.processImage(file.buffer);
      results.push(result);
    }

    const response: ApiResponse<ScoringResult[]> = {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

router.get(
  "/models/status",
  asyncHandler(async (req, res) => {
    const status = {
      faceDetection: mlService.isHealthy,
      faceEmbedding: mlService.isHealthy,
      attractiveness: mlService.isHealthy,
      overall: mlService.isHealthy,
    };

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;
