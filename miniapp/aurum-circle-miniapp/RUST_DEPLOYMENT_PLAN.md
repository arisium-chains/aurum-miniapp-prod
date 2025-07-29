# Rust ML Services Deployment Plan for Ubuntu Server Environments

## Overview

This document outlines the detailed deployment architecture for running Rust-based ML services on Ubuntu server environments. The plan covers system requirements, installation procedures, configuration management, and operational best practices.

## System Requirements

### 1. Ubuntu Server Specifications

- **Minimum OS**: Ubuntu 20.04 LTS or later
- **CPU**: 4+ cores (8+ cores recommended for production)
- **RAM**: 8GB+ (16GB+ recommended for production)
- **Storage**: 50GB+ SSD storage
- **Network**: 100Mbps+ network connectivity

### 2. Software Dependencies

```bash
# Required system packages
sudo apt update
sudo apt install -y \
  curl \
  build-essential \
  pkg-config \
  libssl-dev \
  libclang-dev \
  cmake \
  git \
  ca-certificates \
  gnupg \
  lsb-release

# Docker installation (if using containerized deployment)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 3. Rust Toolchain Installation

```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

## Deployment Architecture

### 1. Service Layout

```
/opt/aurum-circle/
├── rust-ml-services/
│   ├── face-detection-service/
│   │   ├── target/release/face-detection-service
│   │   ├── models/blazeface.onnx
│   │   ├── config/
│   │   └── logs/
│   ├── face-embedding-service/
│   │   ├── target/release/face-embedding-service
│   │   ├── models/arcface_resnet100.onnx
│   │   ├── config/
│   │   └── logs/
│   └── shared/
│       ├── models/
│       └── config/
├── logs/
└── scripts/
```

### 2. Systemd Service Configuration

```ini
# /etc/systemd/system/face-detection-service.service
[Unit]
Description=Face Detection Service
After=network.target

[Service]
Type=simple
User=aurum
Group=aurum
WorkingDirectory=/opt/aurum-circle/rust-ml-services/face-detection-service
ExecStart=/opt/aurum-circle/rust-ml-services/face-detection-service/target/release/face-detection-service
Restart=always
RestartSec=10
Environment=PORT=8001
Environment=MODEL_PATH=/opt/aurum-circle/rust-ml-services/face-detection-service/models/blazeface.onnx
Environment=RUST_LOG=info
Environment=LOG_LEVEL=info

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/face-embedding-service.service
[Unit]
Description=Face Embedding Service
After=network.target

[Service]
Type=simple
User=aurum
Group=aurum
WorkingDirectory=/opt/aurum-circle/rust-ml-services/face-embedding-service
ExecStart=/opt/aurum-circle/rust-ml-services/face-embedding-service/target/release/face-embedding-service
Restart=always
RestartSec=10
Environment=PORT=8002
Environment=MODEL_PATH=/opt/aurum-circle/rust-ml-services/face-embedding-service/models/arcface_resnet100.onnx
Environment=RUST_LOG=info
Environment=LOG_LEVEL=info

[Install]
WantedBy=multi-user.target
```

## Installation Procedure

### 1. User and Directory Setup

```bash
# Create dedicated user
sudo useradd -r -s /bin/false aurum

# Create directory structure
sudo mkdir -p /opt/aurum-circle/rust-ml-services/{face-detection-service,face-embedding-service,shared}
sudo mkdir -p /opt/aurum-circle/logs
sudo mkdir -p /opt/aurum-circle/scripts

# Set ownership
sudo chown -R aurum:aurum /opt/aurum-circle
```

### 2. Service Installation

```bash
# Build services (as aurum user)
sudo -u aurum bash << 'EOF'
cd /opt/aurum-circle/rust-ml-services/face-detection-service
cargo build --release

cd /opt/aurum-circle/rust-ml-services/face-embedding-service
cargo build --release
EOF
```

### 3. Model Deployment

```bash
# Download and place models
sudo -u aurum mkdir -p /opt/aurum-circle/rust-ml-services/shared/models

# Copy models to appropriate directories
sudo -u aurum cp /opt/aurum-circle/rust-ml-services/shared/models/blazeface.onnx \
  /opt/aurum-circle/rust-ml-services/face-detection-service/models/

sudo -u aurum cp /opt/aurum-circle/rust-ml-services/shared/models/arcface_resnet100.onnx \
  /opt/aurum-circle/rust-ml-services/face-embedding-service/models/
```

### 4. Service Registration

```bash
# Copy systemd service files
sudo cp face-detection-service.service /etc/systemd/system/
sudo cp face-embedding-service.service /etc/systemd/system/

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable face-detection-service
sudo systemctl enable face-embedding-service
sudo systemctl start face-detection-service
sudo systemctl start face-embedding-service
```

## Configuration Management

### 1. Environment Variables

```bash
# /opt/aurum-circle/rust-ml-services/config/.env
PORT=8001
MODEL_PATH=/opt/aurum-circle/rust-ml-services/face-detection-service/models/blazeface.onnx
RUST_LOG=info
LOG_LEVEL=info
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=5000
```

### 2. Configuration Loading

```rust
// src/config.rs
use std::env;
use std::fs;

pub struct Config {
    pub port: u16,
    pub model_path: String,
    pub log_level: String,
    pub max_concurrent_requests: usize,
    pub request_timeout: u64,
}

impl Config {
    pub fn from_env() -> Self {
        let env_file = "/opt/aurum-circle/rust-ml-services/config/.env";
        if let Ok(contents) = fs::read_to_string(env_file) {
            for line in contents.lines() {
                if let Some((key, value)) = line.split_once('=') {
                    env::set_var(key.trim(), value.trim());
                }
            }
        }

        Config {
            port: env::var("PORT").unwrap_or_else(|_| "8001".to_string()).parse().unwrap_or(8001),
            model_path: env::var("MODEL_PATH").unwrap_or_else(|_| "./models/model.onnx".to_string()),
            log_level: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
            max_concurrent_requests: env::var("MAX_CONCURRENT_REQUESTS")
                .unwrap_or_else(|_| "100".to_string())
                .parse()
                .unwrap_or(100),
            request_timeout: env::var("REQUEST_TIMEOUT")
                .unwrap_or_else(|_| "5000".to_string())
                .parse()
                .unwrap_or(5000),
        }
    }
}
```

## Monitoring and Logging

### 1. Systemd Journal Integration

```bash
# View service logs
sudo journalctl -u face-detection-service -f
sudo journalctl -u face-embedding-service -f

# View recent logs
sudo journalctl -u face-detection-service --since "1 hour ago"
```

### 2. Log Rotation

```bash
# /etc/logrotate.d/aurum-circle-rust
/opt/aurum-circle/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 aurum aurum
    postrotate
        systemctl reload face-detection-service >/dev/null 2>&1 || true
        systemctl reload face-embedding-service >/dev/null 2>&1 || true
    endscript
}
```

### 3. Health Monitoring Script

```bash
#!/bin/bash
# /opt/aurum-circle/scripts/health-check.sh

# Check if services are running
if ! systemctl is-active --quiet face-detection-service; then
    echo "Face detection service is not running"
    exit 1
fi

if ! systemctl is-active --quiet face-embedding-service; then
    echo "Face embedding service is not running"
    exit 1
fi

# Check service health endpoints
FD_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/health)
FE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/api/health)

if [ "$FD_HEALTH" != "200" ]; then
    echo "Face detection service health check failed"
    exit 1
fi

if [ "$FE_HEALTH" != "200" ]; then
    echo "Face embedding service health check failed"
    exit 1
fi

echo "All services are healthy"
exit 0
```

## Security Considerations

### 1. Firewall Configuration

```bash
# UFW configuration
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 8001/tcp  # Face detection service
sudo ufw allow 8002/tcp  # Face embedding service
sudo ufw enable
```

### 2. Service Isolation

```bash
# Create restricted service user
sudo useradd -r -s /usr/sbin/nologin -d /opt/aurum-circle -c "Aurum Circle Rust Services" aurum

# Set restrictive permissions
sudo chmod 750 /opt/aurum-circle/rust-ml-services
sudo chmod 640 /opt/aurum-circle/rust-ml-services/*/models/*.onnx
```

### 3. TLS Configuration (Optional)

```nginx
# Nginx reverse proxy with TLS termination
server {
    listen 443 ssl;
    server_name rust-ml-services.example.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Performance Tuning

### 1. CPU Affinity

```bash
# Set CPU affinity for services
sudo systemctl edit face-detection-service
```

```ini
[Service]
ExecStart=
ExecStart=/usr/bin/taskset -c 0-1 /opt/aurum-circle/rust-ml-services/face-detection-service/target/release/face-detection-service
```

### 2. Memory Limits

```bash
# Set memory limits in systemd service files
sudo systemctl edit face-detection-service
```

```ini
[Service]
MemoryLimit=2G
```

### 3. Kernel Parameters

```bash
# /etc/sysctl.d/99-aurum-circle.conf
# Increase file descriptor limits
fs.file-max = 100000

# Network tuning
net.core.somaxconn = 65535
net.ipv4.ip_local_port_range = 1024 65535
```

## Backup and Recovery

### 1. Backup Script

```bash
#!/bin/bash
# /opt/aurum-circle/scripts/backup.sh

BACKUP_DIR="/opt/aurum-circle/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup service binaries
tar -czf $BACKUP_DIR/rust-services-$DATE.tar.gz \
  /opt/aurum-circle/rust-ml-services/*/target/release/

# Backup configuration
tar -czf $BACKUP_DIR/config-$DATE.tar.gz \
  /opt/aurum-circle/rust-ml-services/*/config/

# Backup logs (optional)
tar -czf $BACKUP_DIR/logs-$DATE.tar.gz \
  /opt/aurum-circle/logs/

echo "Backup completed: $BACKUP_DIR/rust-services-$DATE.tar.gz"
```

### 2. Recovery Procedure

```bash
#!/bin/bash
# /opt/aurum-circle/scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

# Stop services
sudo systemctl stop face-detection-service
sudo systemctl stop face-embedding-service

# Restore backup
tar -xzf $BACKUP_FILE -C /

# Start services
sudo systemctl start face-detection-service
sudo systemctl start face-embedding-service

echo "Restore completed"
```

## Update and Maintenance

### 1. Update Script

```bash
#!/bin/bash
# /opt/aurum-circle/scripts/update.sh

# Pull latest code
cd /opt/aurum-circle/rust-ml-services/face-detection-service
git pull origin main

cd /opt/aurum-circle/rust-ml-services/face-embedding-service
git pull origin main

# Rebuild services
sudo -u aurum bash << 'EOF'
cd /opt/aurum-circle/rust-ml-services/face-detection-service
cargo build --release

cd /opt/aurum-circle/rust-ml-services/face-embedding-service
cargo build --release
EOF

# Restart services
sudo systemctl restart face-detection-service
sudo systemctl restart face-embedding-service

echo "Services updated and restarted"
```

### 2. Maintenance Windows

```bash
# Schedule maintenance using cron
# Add to crontab: crontab -e
0 2 * * 0 /opt/aurum-circle/scripts/update.sh >> /opt/aurum-circle/logs/update.log 2>&1
```

## Ubuntu-Specific Considerations

### 1. Package Management

```bash
# Ensure system is up to date
sudo apt update && sudo apt upgrade -y

# Install security updates automatically
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2. Resource Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop iftop

# System monitoring script
#!/bin/bash
echo "=== System Status ==="
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"
echo "Service Status:"
systemctl is-active face-detection-service
systemctl is-active face-embedding-service
```

### 3. Log Management

```bash
# Install log management tools
sudo apt install -y logrotate rsyslog

# Configure application-specific logging
sudo tee /etc/rsyslog.d/aurum-circle.conf << 'EOF'
# Log Rust service messages to separate files
:programname, isequal, "face-detection-service" /var/log/aurum-circle/face-detection.log
:programname, isequal, "face-embedding-service" /var/log/aurum-circle/face-embedding.log
& stop
EOF

# Create log directory
sudo mkdir -p /var/log/aurum-circle
sudo chown aurum:aurum /var/log/aurum-circle
```

## Deployment Validation

### 1. Health Check Script

```bash
#!/bin/bash
# /opt/aurum-circle/scripts/deploy-validation.sh

echo "Validating Rust ML Services Deployment..."

# Check if services are running
echo "Checking service status..."
systemctl is-active face-detection-service >/dev/null 2>&1
FD_STATUS=$?
systemctl is-active face-embedding-service >/dev/null 2>&1
FE_STATUS=$?

if [ $FD_STATUS -ne 0 ] || [ $FE_STATUS -ne 0 ]; then
    echo "ERROR: Services are not running"
    exit 1
fi

# Check health endpoints
echo "Checking health endpoints..."
FD_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/health)
FE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/api/health)

if [ "$FD_HEALTH" != "200" ]; then
    echo "ERROR: Face detection service health check failed"
    exit 1
fi

if [ "$FE_HEALTH" != "200" ]; then
    echo "ERROR: Face embedding service health check failed"
    exit 1
fi

# Test API endpoints
echo "Testing API endpoints..."
TEST_IMAGE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAH4gLSu68YkwAAAABJRU5ErkJggg=="

FD_RESPONSE=$(curl -s -X POST http://localhost:8001/api/detect-face \
  -H "Content-Type: application/json" \
  -d "{\"image\":\"$TEST_IMAGE\"}")

echo "Face detection response: $FD_RESPONSE"

echo "Deployment validation completed successfully"
```

## Scaling Considerations

### 1. Horizontal Scaling

For high-traffic environments, consider running multiple instances:

```bash
# Run multiple instances on different ports
PORT=8001 ./target/release/face-detection-service &
PORT=8003 ./target/release/face-detection-service &
PORT=8005 ./target/release/face-detection-service &
```

### 2. Load Balancer Configuration

```nginx
# Nginx load balancer configuration
upstream face-detection-backend {
    server localhost:8001;
    server localhost:8003;
    server localhost:8005;
}

server {
    listen 80;
    location / {
        proxy_pass http://face-detection-backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

This deployment plan ensures that the Rust ML services can be reliably deployed and maintained on Ubuntu server environments while providing the performance and stability benefits of the Rust implementation.
