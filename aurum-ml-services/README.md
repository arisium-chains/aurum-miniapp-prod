# Aurum Circle Rust ML Services

Production deployment guide for Rust-based ML services (face detection and face embedding).

## System Requirements

- **OS**: Ubuntu 20.04 LTS or later
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB+ (16GB+ recommended)
- **Storage**: 50GB+ SSD
- **Network**: 100Mbps+

## Installation

### 1. Install Dependencies

```bash
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

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Setup Environment

```bash
# Create service user
sudo useradd -r -s /bin/false aurum

# Create directories
sudo mkdir -p /opt/aurum-circle/rust-ml-services/{face-detection-service,face-embedding-service,shared}
sudo mkdir -p /opt/aurum-circle/{logs,scripts}
sudo chown -R aurum:aurum /opt/aurum-circle
```

### 3. Build Services

```bash
sudo -u aurum bash << 'EOF'
cd /opt/aurum-circle/rust-ml-services/face-detection-service
cargo build --release

cd /opt/aurum-circle/rust-ml-services/face-embedding-service
cargo build --release
EOF
```

## Service Management

### Start Services

```bash
# Copy systemd service files from deployment directory
sudo cp face-detection-service.service /etc/systemd/system/
sudo cp face-embedding-service.service /etc/systemd/system/

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable --now face-detection-service
sudo systemctl enable --now face-embedding-service
```

### Check Status

```bash
sudo systemctl status face-detection-service
sudo systemctl status face-embedding-service
```

### View Logs

```bash
sudo journalctl -u face-detection-service -f
sudo journalctl -u face-embedding-service -f
```

## Configuration

Environment variables can be set in `/opt/aurum-circle/rust-ml-services/config/.env`:

```bash
PORT=8001
MODEL_PATH=/opt/aurum-circle/rust-ml-services/face-detection-service/models/blazeface.onnx
RUST_LOG=info
LOG_LEVEL=info
```

## Health Checks

```bash
# Check service health
curl http://localhost:8001/api/health
curl http://localhost:8002/api/health

# Run comprehensive health check
/opt/aurum-circle/scripts/health-check.sh
```

## Troubleshooting

### Common Issues

1. **Service fails to start**:

   - Check logs: `journalctl -u face-detection-service`
   - Verify model files exist in correct locations
   - Check permissions: `sudo chown -R aurum:aurum /opt/aurum-circle`

2. **High CPU/Memory usage**:

   - Adjust systemd resource limits
   - Consider horizontal scaling

3. **Connection issues**:
   - Verify firewall rules: `sudo ufw status`
   - Check service ports are open

## Maintenance

### Update Services

```bash
cd /opt/aurum-circle/rust-ml-services/face-detection-service
git pull origin main
cargo build --release
sudo systemctl restart face-detection-service
```

### Backup

```bash
/opt/aurum-circle/scripts/backup.sh
```

For detailed deployment instructions, see [RUST_DEPLOYMENT_PLAN.md](../miniapp/aurum-circle-miniapp/RUST_DEPLOYMENT_PLAN.md)
