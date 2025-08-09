import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { faceScoringQueue } from '../index';
import path from 'path';
import fs from 'fs';

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
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// POST /api/score - Accepts image and returns jobId
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Validate input
    if (!req.file && !req.body.image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Generate a unique job ID
    const jobId = uuidv4();
    
    // Add job to queue
    const job = await faceScoringQueue.add('faceScoringJob', {
      image: req.file ? req.file.path : req.body.image, // Path or base64
      isBase64: !req.file
    }, {
      jobId
    });
    
    // Return job ID
    res.status(202).json({ jobId: job.id });
  } catch (error) {
    console.error('Error queuing face scoring job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;