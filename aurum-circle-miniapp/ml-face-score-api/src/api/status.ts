import { Router } from 'express';
import { faceScoringQueue } from '../index';

const router = Router();

// GET /api/status/:jobId - Returns job state
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }
    
    // Get job from queue
    const job = await faceScoringQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Return job status
    res.json({ status: job.getState() });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;