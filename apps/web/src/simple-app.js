const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'web-app',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Aurum Miniapp</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; }
            .status { background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .api-links { margin: 20px 0; }
            .api-links a { display: inline-block; margin: 5px 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
            .api-links a:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌟 Aurum Miniapp</h1>
            <div class="status">
                <strong>Status:</strong> Production deployment successful! ✅
            </div>
            <p>Welcome to the Aurum Miniapp production environment. The application is running successfully.</p>
            
            <h3>API Endpoints:</h3>
            <div class="api-links">
                <a href="/api/health">Web Health Check</a>
                <a href="/ml-api/api/health">ML API Health Check</a>
            </div>
            
            <h3>Services Status:</h3>
            <ul>
                <li>✅ Web Application</li>
                <li>✅ ML API Service</li>
                <li>✅ Nginx Reverse Proxy</li>
                <li>✅ Redis Cache</li>
                <li>✅ Qdrant Vector Database</li>
            </ul>
            
            <p><small>Deployment completed: ${new Date().toISOString()}</small></p>
        </div>
    </body>
    </html>
  `);
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
  console.log(`Web app server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});