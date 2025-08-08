import express from 'express';
import request from 'supertest';

const mockQueue = {
  add: jest.fn(),
  getJob: jest.fn(),
};

jest.mock('../../index', () => ({
  faceScoringQueue: mockQueue,
}));

import scoreRouter from '../score';
import statusRouter from '../status';
import resultRouter from '../result';

const app = express();
app.use(express.json());
app.use('/api/score', scoreRouter);
app.use('/api/status', statusRouter);
app.use('/api/result', resultRouter);

describe('face scoring queue API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queues job on /api/score', async () => {
    mockQueue.add.mockResolvedValue({ id: 'job123' });
    const res = await request(app)
      .post('/api/score')
      .send({ image: 'data' });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ jobId: 'job123' });
    expect(mockQueue.add).toHaveBeenCalled();
  });

  it('returns 400 when no image provided', async () => {
    const res = await request(app).post('/api/score').send({});
    expect(res.status).toBe(400);
  });

  it('returns job status', async () => {
    const job = { getState: jest.fn().mockResolvedValue('completed') };
    mockQueue.getJob.mockResolvedValue(job);
    const res = await request(app).get('/api/status/job123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'completed' });
  });

  it('returns 404 when job missing', async () => {
    mockQueue.getJob.mockResolvedValue(null);
    const res = await request(app).get('/api/status/unknown');
    expect(res.status).toBe(404);
  });

  it('returns job result when completed', async () => {
    const job = {
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: { score: 0.9 },
    };
    mockQueue.getJob.mockResolvedValue(job);
    const res = await request(app).get('/api/result/job123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ score: 0.9 });
  });

  it('returns 400 if job not completed', async () => {
    const job = { getState: jest.fn().mockResolvedValue('waiting') };
    mockQueue.getJob.mockResolvedValue(job);
    const res = await request(app).get('/api/result/job123');
    expect(res.status).toBe(400);
  });
});
