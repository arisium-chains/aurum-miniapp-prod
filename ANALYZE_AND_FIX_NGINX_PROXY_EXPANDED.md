# Nginx Reverse Proxy Analysis and Fix - Expanded Task

## Objective

1.  **Analyze Root Cause**: Determine why the application might still be accessible or behave unexpectedly on port 80, or identify any misconfigurations preventing Nginx from being the sole, effective reverse proxy.
2.  **Implement Nginx Management**: Ensure Nginx is the definitive entry point for all external traffic, routing requests correctly to internal services and ensuring no services bypass Nginx.

## Current Understanding

The goal is for Nginx (listening on port 80) to be the only point of access for the entire application. Internal services (like the Next.js `app` on port 3000 and `ml-api` on port 3000) should not be directly exposed to the host machine.

## Expanded Task Breakdown

### Phase 1: Deep Dive Analysis & Verification

#### 1.1 Docker Compose Configuration (`aurum-miniapp-prod/docker-compose.yml`)

- **Service Port Exposures**:
  - `app` service: Confirm port `3000` is _not_ mapped to a host port.
  - `ml-api` service: Confirm port `3001` is _not_ mapped to a host port (or if it is, understand why and assess if it's intentional and secure).
  - `nginx` service: Confirm port `80` is correctly mapped to the host.
  - `qdrant`, `redis`: Assess if their port exposures (`6333`, `6380`) are intentional for external access or purely for debugging. For production, these should typically be internal only.
- **Service Dependencies (`depends_on`)**:
  - Verify that `nginx` depends on `app` and `ml-api` correctly.
  - Confirm `app` depends on `redis` with the `service_healthy` condition.
  - Confirm `app` depends on `qdrant` with `service_started`.
- **Networks**:
  - Confirm all services are on the same custom network (`aurum-network`).
  - Check for any `network_mode: "host"` usage.
- **Volumes & Build Contexts**:
  - Verify build contexts are correct.
  - Check volume mounts, especially for `models` and `temp` directories, to ensure they don't inadvertently expose data or cause permission issues.

#### 1.2 Nginx Configuration Deep Dive

- **Main Nginx Config (`aurum-miniapp-prod/nginx/nginx.conf`)**:
  - **Current Structure**: Critically evaluate if the current structure (where `nginx.conf` content is copied to `/etc/nginx/conf.d/default.conf` by the `Dockerfile`) is the source of the problem.
  - **`upstream` Definitions**: Verify `upstream` definitions for `app` and `ml-api` point to the correct internal service names and ports.
  - **`include` Directives**: Confirm `include /etc/nginx/conf.d/*.conf;` is present and correctly loads server block configurations.
- **Server Block Config (`aurum-miniapp-prod/nginx/conf/default.conf`)**:
  - **`listen` Directives**: Ensure Nginx listens only on `80` (and `443` if SSL is configured).
  - **`server_name`**: Should be appropriate (e.g., `localhost` or a domain).
  - **`location` Blocks**:
    - **Comprehensive Coverage**: Meticulously check if all necessary application paths are covered (e.g., `/`, `/api/ml/`, `/api/face-detection/`, `/api/face-embedding/`, static file paths, API health checks).
    - **`proxy_pass` Directives**: Verify `proxy_pass` directives correctly point to the defined upstreams (e.g., `http://app;`, `http://ml_api;`). Ensure trailing slashes are handled correctly.
    - **Proxy Headers**: Ensure all necessary proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `Upgrade`, `Connection`, `X-Forwarded-Host`) are correctly set.
  - **Default Proxy Behavior**: Ensure there's a default `location /` or `location / { ... }` to catch requests not matching other specific paths.
  - **Error Pages**: Consider adding custom error pages.
  - **Logging**: Review Nginx access and error log configurations.
- **Nginx `Dockerfile` (`aurum-miniapp-prod/nginx/Dockerfile`)**:
  - **Configuration Copy Logic**: The `COPY nginx.conf /etc/nginx/conf.d/default.conf` is the primary suspect. Analyze if the source `aurum-miniapp-prod/nginx/nginx.conf` is structured as a main config file (with `events`, `http`, `upstream`, `include`) or as a server block file.
  - **Base Image Configuration**: Understand what the base `nginx:alpine` image provides and how the custom `Dockerfile` modifies it (e.g., `RUN rm /etc/nginx/conf.d/default.conf`).

#### 1.3 Application Service Configurations

- **Next.js App (`app` service)**:
  - **`package.json`**: Confirm `start` script is `node .next/standalone/server.js`.
  - **`next.config.mjs`**: Verify `output: 'standalone'` is set. Check for other relevant Next.js configurations (e.g., `basePath`, `trailingSlash`).
  - **Environment Variables**:
    - Check for `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, or similar variables that might hardcode `http://localhost:3000` or similar. These should ideally be dynamic or rely on the `Host` header.
    - Ensure other environment variables (`REDIS_URL`, `QDRANT_HOST`) are correctly set for the internal Docker network.
  - **Application Code**: Scan for any hardcoded base URLs in API calls, fetch requests, or link generation within the Next.js app. The app should be agnostic to its public URL and rely on Nginx-provided headers.
- **ML API (`ml-api` service)**:
  - **Configuration**: Check for any hardcoded base URLs in the ML API service.
  - **Dependencies**: Ensure all its dependencies (like Redis) are correctly referenced via service names.

#### 1.4 Potential Misconfigurations or External Factors

- **Host Machine Firewall/Security Groups**: Check if host-level firewall rules (e.g., `ufw`, `iptables`) or cloud provider security groups are exposing internal services (like port 3000) to the public internet.
- **Reverse Proxy on Host**: If the server itself is behind another reverse proxy (e.g., Apache, another Nginx instance, a cloud load balancer), its configuration could interfere.
- **Stale Docker Images/Containers**: Ensure no old containers with different port mappings are running.
- **Docker Network Issues**: Verify that the `aurum-network` is correctly set up and services can resolve each other by name.

### Phase 2: Implementation & Configuration Correction

#### 2.1 Adopt Standard Nginx Configuration Structure (High Likelihood)

Based on the analysis, refactor the Nginx setup to a more standard and maintainable structure.

- **`aurum-miniapp-prod/nginx/Dockerfile` Modifications**:
  - `COPY nginx.conf /etc/nginx/nginx.conf` (This file will be the main Nginx config)
  - `COPY conf/default.conf /etc/nginx/conf.d/default.conf` (This file will contain server blocks)
- **`aurum-miniapp-prod/nginx/nginx.conf` (Main Config)**:

  ```nginx
  user nginx;
  worker_processes auto;

  error_log /var/log/nginx/error.log warn;
  pid /var/run/nginx.pid;

  events {
      worker_connections 1024;
      use epoll;
      multi_accept on;
  }

  http {
      include /etc/nginx/mime.types;
      default_type application/octet-stream;

      log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

      access_log /var/log/nginx/access.log main;

      sendfile on;
      tcp_nopush on;
      tcp_nodelay on;
      keepalive_timeout 65;
      types_hash_max_size 2048;
      server_tokens off; # Hide Nginx version

      upstream app {
          server app:3000;
      }
      upstream ml_api {
          server ml-api:3000;
      }
      # Add other upstreams if necessary

      include /etc/nginx/conf.d/*.conf;
  }
  ```

- **`aurum-miniapp-prod/nginx/conf/default.conf` (Server Blocks)**:

  ```nginx
  server {
      listen 80;
      server_name _; # Default catch-all server name

      # Security headers
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header Referrer-Policy "no-referrer-when-downgrade" always;
      add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

      # Gzip compression
      gzip on;
      gzip_vary on;
      gzip_min_length 1024;
      gzip_proxied any;
      gzip_comp_level 6;
      gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

      # Main app proxy
      location / {
          proxy_pass http://app;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_set_header X-Forwarded-Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_read_timeout 86400;
      }

      # ML API proxy
      location /api/ml/ {
          proxy_pass http://ml_api;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          proxy_set_header X-Forwarded-Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_read_timeout 86400;
      }

      # Face detection service proxy (if it's part of the ml-api or needs separate handling)
      # location /api/face-detection/ {
      #     proxy_pass http://face-detection-service:8001;
      #     # ... similar proxy headers
      # }

      # Face embedding service proxy
      # location /api/face-embedding/ {
      #     proxy_pass http://face-embedding-service:8002;
      #     # ... similar proxy headers
      # }

      # Health check endpoint for the app
      location /health {
          access_log off;
          proxy_pass http://app/api/health; # Assuming app has this endpoint
          proxy_set_header Host $host;
      }

      # Direct Nginx health check
      location /nginx-health {
          access_log off;
          return 200 "healthy\n";
          add_header Content-Type text/plain;
      }

      # Static file handling (if not handled by Next.js directly)
      # location /static/ {
      #     alias /app/.next/static/;
      #     expires 1y;
      #     add_header Cache-Control "public, immutable";
      # }
  }
  ```

#### 2.2 Docker Compose Adjustments

- Ensure `app` and `ml-api` services have no host port mappings.
- Consider if `qdrant` and `redis` need host port mappings for external access or debugging. If not, remove them.
- Add `healthcheck` sections to `docker-compose.yml` for all critical services for better `depends_on` behavior.

#### 2.3 Application Code Review (If Necessary)

- If hardcoded URLs are found in the Next.js app or ML API, refactor them to be relative or use environment variables that Nginx can set or that are derived from request headers.

### Phase 3: Verification & Testing

#### 3.1 Service Restart & Initial Checks

1.  Execute `docker compose down`.
2.  Execute `docker compose up --build -d`.
3.  Use `docker ps` to verify port mappings. Only `nginx` (and potentially `qdrant`/`redis` if intentionally exposed) should show host port mappings.
4.  Check `docker logs <service_name>` for any startup errors in `app`, `ml-api`, `nginx`.

#### 3.2 Functional Testing

- **Frontend Access**:
  - `curl -I http://<your-server-ip>:80` -> Should return 200 OK from Nginx, proxied to the Next.js app.
  - Browser access to `http://<your-server-ip>:80` -> Should render the Next.js app.
- **Direct Service Access (Should Fail)**:
  - `curl -I http://<your-server-ip>:3000` -> Should return Connection Refused or similar.
  - `curl -I http://<your-server-ip>:3001` -> Should return Connection Refused or similar.
- **API Access via Nginx**:
  - `curl -I http://<your-server-ip>:80/api/ml/...` -> Should work, proxied to `ml-api`.
  - `curl -I http://<your-server-ip>:80/api/health` -> Should work, proxied to `app`.
- **Nginx Logs**: `docker logs aurum-miniapp-prod-nginx-1` - Check for access patterns and errors.
- **Application Logs**: `docker logs aurum-miniapp-prod-app-1` and `docker logs aurum-miniapp-prod-ml-api-1` - Check for any errors related to proxying, URLs, or connections.

#### 3.3 Advanced Testing (Optional but Recommended)

- **SSL/TLS**: If planning to use HTTPS, test SSL termination at Nginx.
- **Load Testing**: Use a tool like `wrk` or `ab` to simulate traffic.
- **Header Inspection**: Use a tool like `curl -I -v http://...` or browser dev tools to verify that `X-Forwarded-*` headers are correctly passed.

### Phase 4: Documentation & Deployment

- Update any relevant documentation with the new Nginx setup.
- Commit and push all changes.
- Create a deployment checklist or script.

---

## Task Complexity Estimation

### Overall Complexity: **Medium**

#### Rationale:

- **Low Effort Aspect**: The core problem is likely a configuration misalignment (Nginx file structure and Docker Compose port mappings). Correcting these is well-trodden ground.
- **Medium Effort Aspects**:
  - **Analysis**: Requires careful review of multiple interdependent files (`docker-compose.yml`, Nginx configs, app configs).
  - **Potential Application Code Changes**: If hardcoded URLs exist in the Next.js or ML API code, finding and refactoring them can be time-consuming.
  - **Testing & Verification**: Ensuring comprehensive test coverage to confirm Nginx is the _only_ entry point and all routing works as expected requires diligence.
  - **External Factors**: Diagnosing issues related to host firewalls or network configurations can add unpredictability.
- **High Effort Aspect (Unlikely but Possible)**:
  - If the application itself has fundamental issues with reverse proxying (e.g., incorrect handling of `X-Forwarded-*` headers leading to broken links or functionality), deeper application-level fixes would be needed, increasing complexity.

#### Breakdown by Area:

- **Docker Compose Configuration**: **Low**
  - Primarily involves checking and modifying port mappings and dependencies.
- **Nginx Configuration**: **Medium**
  - Involves understanding Nginx's configuration hierarchy, correcting file structures, and ensuring all `location` blocks and `proxy_pass` directives are correctly defined.
- **Application Configuration (Next.js/ML API)**: **Low to Medium**
  - Checking environment variables and potentially finding/hardcoded URLs. The "standalone" Next.js output adds a specific configuration detail.
- **Testing & Verification**: **Medium**
  - Requires a systematic approach to test all access points and functionalities.
- **Documentation & Cleanup**: **Low**
  - Updating files and committing changes.

#### Estimated Time Investment:

- **Initial Analysis & Identification**: 1-2 hours
- **Configuration Changes**: 2-3 hours
- **Application Code Review (if needed)**: 1-3 hours (highly variable)
- **Testing & Verification**: 1-2 hours
- **Documentation & Commit**: 0.5-1 hour
- **Total Estimated Time**: **5.5 - 11 hours** (Highly dependent on the need for application code changes and the depth of testing required).

This expanded plan provides a comprehensive roadmap to ensure Nginx correctly and robustly manages all project traffic.
