import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import path from 'path';
import fs from 'fs';

import scoreRouter from './api/score';
import statusRouter from './api/status';
import resultRouter from './api/result';
import mlStatusRouter from './api/ml-status';

const app = express();
const port = process.env.PORT || 3000;

// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null
});

// Create queue
export const faceScoringQueue = new Queue('faceScoring', { connection: redis });

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Multer setup for file uploads (we'll keep this for potential future use, but it's not exported)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Routes
app.use('/api/score', scoreRouter);
app.use('/api/status', statusRouter);
app.use('/api/result', resultRouter);
app.use('/api/ml-status', mlStatusRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Face scoring API listening on port ${port}`);
});

// Auto-cleanup processed temp files every 24h
setInterval(() => {
  const tempDir = path.join(__dirname, '../temp');
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.mtime.getTime() < oneDayAgo) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old temp file: ${file}`);
      }
    });
  }
}, 24 * 60 * 60 * 1000); // Every 24 hours

export default app;