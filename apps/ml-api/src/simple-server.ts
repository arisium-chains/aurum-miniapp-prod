import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ml-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic ML endpoints (mock responses for now)
app.post('/api/score', (req, res) => {
  res.json({
    success: true,
    data: {
      score: 0.75,
      confidence: 0.85,
      metadata: {
        model: 'mock-model',
        timestamp: new Date().toISOString()
      }
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ready',
      models_loaded: true,
      queue_status: 'healthy',
      uptime: process.uptime()
    }
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ML API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});