# Next Actions: Nginx Reverse Proxy Fix

This document outlines the immediate next steps to resolve the Nginx reverse proxy configuration and ensure it's the sole entry point for the application.

## Recommended Immediate Actions

### 1. Prioritize Configuration Correction (Highest Priority)

The most critical step is to address the Nginx configuration structure identified in `ANALYZE_AND_FIX_NGINX_PROXY_EXPANDED.md`.

- **Action**: Refactor Nginx configuration files as detailed in **Phase 2.1** of the expanded task.
  - Modify `aurum-miniapp-prod/nginx/Dockerfile`:
    - Change `COPY nginx.conf /etc/nginx/conf.d/default.conf` to:
      ```
      COPY nginx.conf /etc/nginx/nginx.conf
      COPY conf/default.conf /etc/nginx/conf.d/default.conf
      ```
  - Update `aurum-miniapp-prod/nginx/nginx.conf` with the main Nginx config (provided in the expanded task).
  - Update `aurum-miniapp-prod/nginx/conf/default.conf` with the server block configuration (provided in the expanded task).
- **Reasoning**: This directly targets the likely root cause of the `events` directive error and misconfiguration.
- **Est. Time**: 1-2 hours

### 2. Review and Adjust Docker Compose

- **Action**: Scrutinize `aurum-miniapp-prod/docker-compose.yml`.
  - Confirm that `app` and `ml-api` services have **no** host port mappings (e.g., `ports: - "3000:3000"` should be removed for `app`).
  - Confirm `nginx` service correctly maps port `80` (e.g., `ports: - "80:80"`).
  - Assess if `qdrant` and `redis` port exposures are necessary for production or can be removed.
- **Reasoning**: Ensures no internal services are directly accessible from the host, bypassing Nginx.
- **Est. Time**: 0.5 - 1 hour

### 3. Initial Service Restart and Basic Verification

- **Action**:
  1.  Stop all services: `docker compose down`
  2.  Rebuild and start services: `docker compose up --build -d`
  3.  Check running services: `docker ps`
  4.  Check Nginx logs: `docker logs aurum-miniapp-prod-nginx-1`
  5.  Check app logs: `docker logs aurum-miniapp-prod-app-1`
- **Reasoning**: To apply the configuration changes and identify any immediate startup errors.
- **Est. Time**: 0.5 hours

### 4. Conduct Functional Testing

- **Action**: Perform the tests outlined in **Phase 3.2** of the expanded task.
  - Test frontend access via Nginx (`http://<server-ip>:80`).
  - Attempt direct access to app and ml-api ports (`http://<server-ip>:3000`, `http://<server-ip>:3001`) - these should fail.
  - Test API access via Nginx (`http://<server-ip>:80/ml-api/...`).
- **Reasoning**: To confirm Nginx is routing correctly and is the sole entry point.
- **Est. Time**: 1 hour

## Subsequent Actions (If Issues Persist or for Further Hardening)

### 5. Deep Dive Analysis (If Step 4 Fails)

If the basic fix doesn't work, proceed with the detailed analysis from **Phase 1** of the expanded task:

- In-depth review of all Nginx configs.
- Check application environment variables for hardcoded URLs.
- Investigate host firewall or network settings.

### 6. Application Code Review

- **Action**: If suspected, scan Next.js and ML API code for hardcoded base URLs and refactor.
- **Reasoning**: Applications might not be fully reverse-proxy-aware.
- **Est. Time**: 1-3 hours (highly variable)

### 7. Advanced Testing and Hardening

- **Action**: Implement **Phase 3.3** from the expanded task (SSL/TLS, load testing, header inspection).
- **Reasoning**: For production readiness and robustness.

### 8. Documentation and Deployment

- **Action**: Update documentation, commit all changes, and create a deployment script/checklist.
- **Est. Time**: 0.5 - 1 hour

## Decision Point

After completing actions 1-4:

- **If successful**: The core issue is resolved. Proceed with actions 7 (optional) and 8.
- **If unsuccessful**: Re-evaluate based on logs and errors, then proceed to action 5 (Deep Dive Analysis).

## Overall Priority

1.  **Configuration Correction (Action 1)**
2.  **Docker Compose Review (Action 2)**
3.  **Initial Restart & Verification (Action 3)**
4.  **Functional Testing (Action 4)**
5.  **Deeper Analysis / Code Review (Actions 5 & 6 - if needed)**
6.  **Advanced Testing & Documentation (Actions 7 & 8)**
