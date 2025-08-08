process.env.API_KEY_SECRET = 'test';

import express from 'express';
import request from 'supertest';

jest.mock('../../services/ml', () => ({
  mlService: {
    processImage: jest.fn().mockResolvedValue({
      score: 0.5,
      confidence: 0.9,
      processingTime: 1,
      faceDetected: true,
      faceCount: 1,
    }),
    isHealthy: true,
    initialize: jest.fn(),
  },
}));

import healthRoutes from '../health';
import scoringRoutes from '../scoring';

const app = express();
app.use(express.json());
app.use('/api', healthRoutes);
app.use('/api', scoringRoutes);

describe('ml-face-score-api-nodejs', () => {
  it('responds to /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('returns 400 when no image provided', async () => {
    const res = await request(app).post('/api/score');
    expect(res.status).toBe(400);
  });

  it('processes image on /api/score', async () => {
    const res = await request(app)
      .post('/api/score')
      .attach('image', Buffer.from('test'), { filename: 'test.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
