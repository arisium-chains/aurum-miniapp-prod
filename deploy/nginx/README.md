# Nginx Configuration for Aurum Circle

This directory contains the nginx configuration for the Aurum Circle application.

## Configuration Files

- `conf/default.conf` - Main nginx configuration file that sets up reverse proxy for all services

## Setup

The nginx service is configured to:

1. Listen on port 80 for HTTP traffic
2. Proxy requests to the main Next.js application on port 3000
3. Proxy requests to the ML API service on port 3001
4. Proxy requests to the Rust ML services on ports 8001 and 8002
5. Provide health check endpoints

## Health Checks

- `/health` - Proxies to the main application's health check endpoint
- `/nginx-health` - Direct nginx health check

## SSL Configuration

To enable SSL, you can:

1. Place your SSL certificates in the `certs` directory
2. Update the nginx configuration to listen on port 443
3. Configure SSL certificates in the server block

Example SSL configuration:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/certs/your-cert.pem;
    ssl_certificate_key /etc/nginx/certs/your-key.pem;

    # Rest of your configuration...
}
```
