import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default("0.0.0.0"),

  // Redis Configuration
  REDIS_URL: Joi.string().default("redis://redis:6379"),
  REDIS_HOST: Joi.string().default("localhost"),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow("").default(""),
  REDIS_DB: Joi.number().default(0),

  // BullMQ Configuration
  BULLMQ_QUEUE_NAME: Joi.string().default("ml-scoring"),
  BULLMQ_CONCURRENCY: Joi.number().default(5),

  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info"),
  LOG_DIR: Joi.string().default("./logs"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // File Upload Configuration
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  UPLOAD_DIR: Joi.string().default("./uploads"),

  // Model Configuration
  MODEL_PATH: Joi.string().default("./models"),
  FACE_DETECTION_MODEL: Joi.string().default("face_detection.onnx"),
  FACE_EMBEDDING_MODEL: Joi.string().default("face_embedding.onnx"),
  ATTRACTIVENESS_MODEL: Joi.string().default("attractiveness_model.onnx"),

  // Security Configuration
  API_KEY_HEADER: Joi.string().default("x-api-key"),
  API_KEY_SECRET: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default("http://localhost:3000"),

  // Health Check Configuration
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
});

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,

  redis: {
    url: envVars.REDIS_URL,
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
  },

  bullmq: {
    queueName: envVars.BULLMQ_QUEUE_NAME,
    concurrency: envVars.BULLMQ_CONCURRENCY,
  },

  logging: {
    level: envVars.LOG_LEVEL,
    dir: envVars.LOG_DIR,
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },

  upload: {
    maxFileSize: envVars.MAX_FILE_SIZE,
    uploadDir: envVars.UPLOAD_DIR,
  },

  models: {
    path: envVars.MODEL_PATH,
    faceDetection: envVars.FACE_DETECTION_MODEL,
    faceEmbedding: envVars.FACE_EMBEDDING_MODEL,
    attractiveness: envVars.ATTRACTIVENESS_MODEL,
  },

  security: {
    apiKeyHeader: envVars.API_KEY_HEADER,
    apiKeySecret: envVars.API_KEY_SECRET,
    corsOrigin: envVars.CORS_ORIGIN,
  },

  healthCheck: {
    interval: envVars.HEALTH_CHECK_INTERVAL,
  },
};
