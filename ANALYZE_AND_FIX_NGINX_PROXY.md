# Nginx Reverse Proxy Analysis and Fix

## Objective

1.  **Analyze Root Cause**: Determine why the application might still be accessible or behave unexpectedly on port 80, or identify any misconfigurations preventing Nginx from being the sole, effective reverse proxy.
2.  **Implement Nginx Management**: Ensure Nginx is the definitive entry point for all external traffic, routing requests correctly to internal services and ensuring no services bypass Nginx.

## Current Understanding

The goal is for Nginx (listening on port 80) to be the only point of access for the entire application. Internal services (like the Next.js `app` on port 3000 and `ml-api` on port 3000) should not be directly exposed to the host machine.

## Areas for Analysis

### 1. Docker Compose Configuration (`aurum-miniapp-prod/docker-compose.yml`)

- **Service Port Exposures**:
  - `app` service: Confirm port `3000` is _not_ mapped to a host port.
  - `ml-api` service: Confirm port `3001` is _not_ mapped to a host port (or if it is, understand why and assess if it's intentional and secure).
  - `nginx` service: Confirm port `80` is correctly mapped to the host.
- **Service Dependencies (`depends_on`)**:
  - Verify that `nginx` depends on `app` and `ml-api` correctly, and that `app` depends on `redis` with the `service_healthy` condition.
- **Networks**:
  - Confirm all services are on the same custom network (`aurum-network`) to allow internal communication via service names (e.g., `app:3000`).

### 2. Nginx Configuration

- **Main Nginx Config (`aurum-miniapp-prod/nginx/nginx.conf`)**:
  - Verify `upstream` definitions for `app` and `ml-api` point to the correct internal service names and ports (e.g., `server app:3000;`).
  - Confirm `include /etc/nginx/conf.d/*.conf;` is present to load server block configurations.
- **Server Block Config (`aurum-miniapp-prod/nginx/conf/default.conf`)**:
  - **`listen` Directives**: Ensure Nginx listens on `80` (and potentially `443` if SSL is configured, though not indicated yet).
  - **`server_name`**: Should be appropriate (e.g., `localhost` or a domain).
  - **`location` Blocks**:
    - Check if all necessary paths are covered (e.g., `/`, `/api/ml/`, `/api/face-detection/`, etc.).
    - Verify `proxy_pass` directives correctly point to the defined upstreams (e.g., `http://app;`, `http://ml-api;`).
    - Ensure proxy headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `Upgrade`, `Connection`) are correctly set.
  - **Default Proxy Behavior**: Ensure there's a default `location /` or `location / { ... }` to catch requests not matching other specific paths.

### 3. Application Service Configurations

- **Next.js App (`app` service)**:
  - `package.json`: Confirm `start` script is `node .next/standalone/server.js`.
  - `next.config.mjs`: Verify `output: 'standalone'` is set.
  - Environment variables: Check if `NEXT_PUBLIC_APP_URL` or similar variables might be hardcoding `http://localhost:3000` or similar, which could cause issues if the app generates absolute URLs incorrectly. The app should rely on the `Host` header passed by Nginx.
- **ML API (`ml-api` service)**:
  - Check for any hardcoded base URLs that might not respect the reverse proxy environment.

### 4. Potential Misconfigurations or Issues

- **Host Network Mode**: Ensure `docker-compose.yml` or individual service definitions are not using `network_mode: "host"`, which would bypass Docker's networking and make internal ports directly available.
- **Firewall/Host Machine Port Forwarding**: Check if host-level firewall rules or other port forwarding mechanisms might be exposing internal services.
- **Nginx Default Configuration**: The base `nginx:alpine` image might have a default `default.conf` in `/etc/nginx/conf.d/`. The `Dockerfile` for the custom Nginx (`aurum-miniapp-prod/nginx/Dockerfile`) currently removes it (`RUN rm /etc/nginx/conf.d/default.conf`) and then copies `nginx.conf` to `/etc/nginx/conf.d/default.conf`. This needs to be verified.
  - `COPY nginx.conf /etc/nginx/conf.d/default.conf`: This means the content of `aurum-miniapp-prod/nginx/nginx.conf` (which should be the main http context including upstreams and includes) becomes the `default.conf` inside the container. This is a bit unconventional. Typically, `nginx.conf` would be the main file, and `default.conf` would contain server blocks.
- **Stale Docker Images/Containers**: Old builds or containers might have different port mappings.

## Action Plan

1.  **Review `docker-compose.yml`**:
    - Ensure no direct host port exposure for `app` and `ml-api` services.
    - Confirm `nginx` service exposes port `80`.
2.  **Review Nginx `Dockerfile`**:
    - The `COPY nginx.conf /etc/nginx/conf.d/default.conf` is critical. The source `nginx.conf` should be structured correctly to be a `default.conf` (i.e., it should contain `server` blocks, not just `http` context with `upstream` and `include`). This might be the core issue.
    - If `aurum-miniapp-prod/nginx/nginx.conf` is intended to be the main Nginx config, it should be copied to `/etc/nginx/nginx.conf` inside the container, and `aurum-miniapp-prod/nginx/conf/default.conf` (containing server blocks) should be copied to `/etc/nginx/conf.d/default.conf`.
3.  **Correct Nginx Configuration Structure (Likely needed)**:

    - **Option A (Recommended Standard Structure)**:

      - `aurum-miniapp-prod/nginx/Dockerfile`:
        - `COPY nginx.conf /etc/nginx/nginx.conf` (This file contains `events`, `http`, `upstream`, `include /etc/nginx/conf.d/*.conf;`)
        - `COPY conf/default.conf /etc/nginx/conf.d/default.conf` (This file contains `server { ... }` blocks)
      - `aurum-miniapp-prod/nginx/nginx.conf` (to be renamed or created as the main config):

        ```nginx
        events {
            worker_connections 1024;
        }

        http {
            upstream app {
                server app:3000;
            }
            upstream ml_api {
                server ml-api:3000;
            }
            # Potentially other upstreams

            include /etc/nginx/conf.d/*.conf;
        }
        ```

      - `aurum-miniapp-prod/nginx/conf/default.conf` (current content is mostly fine, ensure `proxy_pass` uses upstream names):

        ```nginx
        server {
            listen 80;
            server_name localhost;

            location / {
                proxy_pass http://app; # Use upstream name
                # ... other proxy headers
            }

            location /api/ml/ {
                proxy_pass http://ml_api; # Use upstream name
                # ... other proxy headers
            }
            # ... other locations
        }
        ```

    - **Option B (Keep current `Dockerfile` COPY target, adjust source file)**:
      - Rename `aurum-miniapp-prod/nginx/nginx.conf` to something like `aurum-miniapp-prod/nginx/nginx_main.conf`.
      - Create a new `aurum-miniapp-prod/nginx/nginx.conf` that is a valid `default.conf` (i.e., contains `server` blocks).
      - This new `nginx.conf` would need to `include` any other necessary files or define `upstream` blocks itself if not included from elsewhere.

4.  **Verify Application Behavior**:
    - After fixing Nginx, run `docker compose up --build --force-recreate`.
    - Test access:
      - `http://<your-server-ip>:80` should work and serve the Next.js app.
      - `http://<your-server-ip>:3000` should **not** work (or should be blocked by firewall/Nginx if it somehow maps).
      - API calls via Nginx (e.g., `http://<your-server-ip>:80/api/ml/...`) should work.
5.  **Commit and Push Changes**:
    - Once verified, commit all configuration changes.

## Verification Steps

1.  Execute `docker compose down` to stop all services.
2.  Execute `docker compose up --build -d` to build and run services in detached mode.
3.  Use `docker ps` to verify port mappings. Only `nginx` should show a port mapping for `80`.
4.  Use `curl -I http://localhost:80` (or server IP) to check if Nginx responds.
5.  Use `curl -I http://localhost:3000` (or server IP) to confirm it's not accessible or returns an error/connection refused.
6.  Check Nginx logs: `docker logs aurum-miniapp-prod-nginx-1`.
7.  Check application logs for any errors related to proxying or URLs.

## Conclusion

The primary suspect for Nginx not behaving as expected is the structure of the Nginx configuration files and how they are copied into the Docker image. The `Dockerfile` currently copies what seems like a main `nginx.conf` file to the location of a `default.conf` server block file. This needs to be standardized.
