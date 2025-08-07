# Aurum Circle ML Model API - Production Deployment

This guide explains how to deploy the ML Model API for public access.

## Prerequisites

- A server with Docker and Docker Compose installed
- Git installed
- At least 2GB RAM recommended
- Public IP address or domain name

## Deployment Options

### Option 1: Automated Deployment (Recommended)

1. Copy the `deploy.sh` script to your server
2. Make it executable: `chmod +x deploy.sh`
3. Run with sudo: `sudo ./deploy.sh`

### Option 2: Manual Deployment

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/aurum-circle.git
   cd aurum-circle/aurum-circle-miniapp/ml-face-score-api
   ```

2. Build and start the services:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. Check the status:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

## API Endpoints

Once deployed, the following endpoints will be available:

- `POST /api/score` - Submit an image for scoring
- `GET /api/status/:jobId` - Check job status
- `GET /api/result/:jobId` - Get job result
- `GET /api/ml-status` - Check ML model status
- `GET /health` - Health check endpoint

## Scaling

To scale the worker processes, you can run:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale ml-worker=3
```

This will start 3 worker processes to handle image processing jobs in parallel.

## Security Considerations

For production use, consider:

1. Adding rate limiting
2. Using HTTPS with Let's Encrypt
3. Restricting access by IP if needed
4. Implementing authentication for sensitive endpoints
5. Setting up monitoring and alerting

## Updating the Deployment

To update after making changes:

```bash
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

Check logs:

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

Restart services:

```bash
docker-compose -f docker-compose.prod.yml restart
```

View running containers:

```bash
docker-compose -f docker-compose.prod.yml ps
```
