# Troubleshooting Docker Compose Issues

This guide provides steps to troubleshoot common issues when using Docker Compose.

## General Troubleshooting Steps

1.  **Check Docker Engine Status:**

    - Ensure Docker Engine is running.
    - Run `docker info` to check Docker Engine status and configuration.

2.  **Verify Docker Compose Installation:**

    - Ensure Docker Compose is installed correctly.
    - Run `docker-compose version` to check the installed version.

3.  **Check Docker Compose File Syntax:**

    - Ensure the `docker-compose.yml` file is valid YAML.
    - Use a YAML validator to check for syntax errors.

4.  **Check Docker Compose File Path:**

    - Ensure you are running `docker-compose` commands from the directory containing the `docker-compose.yml` file.

5.  **Check for Port Conflicts:**

    - Ensure no other applications are using the ports exposed by your Docker containers.
    - Use `netstat -tulnp` (Linux) or `lsof -i :<port>` (macOS) to check for port conflicts.

6.  **Check Container Logs:**

    - Inspect container logs for errors or warnings.
    - Run `docker-compose logs <service_name>` to view logs for a specific service.

7.  **Check Container Status:**

    - Ensure all containers are running.
    - Run `docker-compose ps` to check the status of all services.

8.  **Check Docker Image Build Errors:**

    - If a service fails to build, inspect the Dockerfile for errors.
    - Check the build context and ensure all necessary files are included.

9.  **Check Volume Mounts:**

    - Ensure volume mounts are configured correctly.
    - Verify that the host directories exist and have the correct permissions.

10. **Check Network Configuration:**
    - Ensure all services are connected to the correct network.
    - Verify that services can communicate with each other using their service names.

## Specific Troubleshooting Scenarios

### 1. Rust-based Application Still Running After Migration to Node.js

**Problem:** The `docker-compose.yml` file is still attempting to run the Rust-based application after migrating the ML service to Node.js.

**Possible Causes:**

- **Outdated `docker-compose.yml` File:** The `docker-compose.yml` file in the root of the `aurum-miniapp-prod` repository still contains configurations for the Rust-based services.
- **Docker Image Caching:** Docker is using a cached image of the Rust-based application.
- **Incorrect Build Context:** The build context is pointing to the old Rust-based code.

**Troubleshooting Steps:**

1.  **Verify `docker-compose.yml` File:**

    - Ensure the `docker-compose.yml` file in the root of the `aurum-miniapp-prod` repository does not contain configurations for the Rust-based `face-detection-service` and `face-embedding-service`.
    - Ensure the `docker-compose.yml` file is using the correct `Dockerfile` for the Node.js application.

2.  **Remove Rust-based Service Configurations:**

    - Remove the service configurations for the Rust-based `face-detection-service` and `face-embedding-service` from the `docker-compose.yml` file.
    - Remove the dependencies on these services from the `app` and `ml-api` services.

3.  **Clear Docker Image Cache:**

    - Remove the cached images of the Rust-based application.
    - Run `docker rmi <image_id>` to remove the images.
    - You can find the image IDs by running `docker images`.

4.  **Rebuild Docker Images:**

    - Rebuild the Docker images for the Node.js application.
    - Run `docker-compose build --no-cache` to rebuild the images without using the cache.

5.  **Verify Build Context:**

    - Ensure the build context in the `docker-compose.yml` file is pointing to the correct directory containing the Node.js application code.

6.  **Run `docker-compose up --build`:**
    - Run `docker-compose up --build` to rebuild and start the application.

### 2. Application Fails to Start

**Problem:** The application fails to start after running `docker-compose up --build`.

**Possible Causes:**

- **Port Conflicts:** Another application is using the same port as the Docker container.
- **Missing Environment Variables:** The application requires environment variables that are not set in the `docker-compose.yml` file.
- **Incorrect Volume Mounts:** The volume mounts are not configured correctly.
- **Application Errors:** The application code contains errors that prevent it from starting.

**Troubleshooting Steps:**

1.  **Check Container Logs:**

    - Inspect container logs for errors or warnings.
    - Run `docker-compose logs <service_name>` to view logs for a specific service.

2.  **Check Port Conflicts:**

    - Ensure no other applications are using the ports exposed by your Docker containers.
    - Use `netstat -tulnp` (Linux) or `lsof -i :<port>` (macOS) to check for port conflicts.

3.  **Check Environment Variables:**

    - Ensure all required environment variables are set in the `docker-compose.yml` file.
    - Verify that the environment variables have the correct values.

4.  **Check Volume Mounts:**

    - Ensure volume mounts are configured correctly.
    - Verify that the host directories exist and have the correct permissions.

5.  **Check Application Code:**
    - Inspect the application code for errors or warnings.
    - Run the application locally to test for errors.

### 3. Other Common Issues

- **DNS Resolution Issues:** Ensure that containers can resolve each other's hostnames.
- **Resource Limits:** Ensure that containers have sufficient resources (CPU, memory).
- **File Permissions:** Ensure that containers have the correct file permissions.

By following these troubleshooting steps, you should be able to identify and resolve most common Docker and Docker Compose issues.
