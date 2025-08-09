# Aurum Circle - Environment Variables

## Required Environment Variables

```env
# World ID Configuration
WORLD_ID_APP_ID=app_...
WORLD_ID_ACTION=verify-human

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Qdrant Configuration
QDRANT_HOST=localhost
QDRANT_PORT=6333

# AI Services (Optional)
AI_API_KEY=your_secret_api_key

# Node Environment
NODE_ENV=development
```

## Development Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your World ID credentials from https://developer.worldcoin.org/

3. For production deployment, set `NODE_ENV=production`

## Docker Deployment

When using Docker, the services will automatically connect through the internal network:
- Redis will be available at `redis://redis:6379`
- Qdrant will be available at `qdrant:6333`

## Security Notes

- Never commit actual credentials to version control
- Use strong, random values for `AI_API_KEY` in production
- The `AI_API_KEY` is required to access AI endpoints in production