# Build Monitor Service

A comprehensive build failure detection and automated rollback system for Rust ML services in the Aurum Circle ecosystem.

## Overview

The Build Monitor service provides:

- **Real-time build monitoring** for Rust ML services
- **Automated failure detection** using commit isolation
- **Binary search rollback** to identify breaking commits
- **Docker-based build environments** with consistent tooling
- **Multi-channel notifications** (Slack, Discord, Email)
- **Web dashboard** with real-time status updates
- **GitHub/GitLab webhook integration**

## Features

### 🔍 Build Monitoring

- Continuous monitoring of Rust ML services
- Health checks and build status tracking
- Service-specific configuration
- Timeout and retry mechanisms

### 🔄 Automated Rollback

- Binary search algorithm for commit isolation
- Emergency rollback capabilities
- Rollback verification and testing
- Commit history analysis

### 🐳 Docker Integration

- Containerized build environments
- Multi-stage builds for optimization
- Registry integration
- Resource management and cleanup

### 📊 Dashboard & API

- Real-time web dashboard
- REST API endpoints
- Build history and metrics
- Service status visualization

### 🔔 Notifications

- Slack webhook integration
- Discord notifications
- Email alerts
- Custom notification channels

## Quick Start

### Prerequisites

- Rust 1.82+ with edition2024
- Docker and Docker Compose
- Git repository access

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd aurum-ml-services/build-monitor
```

2. Install dependencies:

```bash
cargo build --release
```

3. Configure the service:

```bash
cp config.toml.example config.toml
# Edit config.toml with your settings
```

4. Start the service:

```bash
cargo run -- start
```

### Docker Deployment

```bash
# Build the image
docker build -t aurum-build-monitor .

# Run with Docker Compose
docker-compose up -d
```

## Configuration

### Environment Variables

```bash
# Basic configuration
export BUILD_MONITOR_HOST=0.0.0.0
export BUILD_MONITOR_PORT=8080
export RUST_LOG=info

# Notification channels
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
export DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Configuration File (config.toml)

See `config.toml` for comprehensive configuration options including:

- Service definitions
- Docker settings
- Notification channels
- Environment-specific configurations

## Usage

### CLI Commands

```bash
# Start the service
cargo run -- start

# Check service status
cargo run -- status

# List monitored services
cargo run -- list

# Get build history
cargo run -- history face-detection --limit 20

# Trigger manual rollback
cargo run -- rollback face-detection abc123 "Fix breaking change"

# Emergency rollback
cargo run -- emergency-rollback face-detection

# Test notifications
cargo run -- test-notification --channel slack --message "Test alert"
```

### API Endpoints

| Endpoint                        | Method | Description      |
| ------------------------------- | ------ | ---------------- |
| `/api/health`                   | GET    | Health check     |
| `/api/dashboard`                | GET    | Dashboard data   |
| `/api/services`                 | GET    | List services    |
| `/api/services/{name}`          | GET    | Service status   |
| `/api/services/{name}/builds`   | GET    | Build history    |
| `/api/services/{name}/rollback` | POST   | Trigger rollback |
| `/api/webhooks/github`          | POST   | GitHub webhook   |
| `/api/webhooks/gitlab`          | POST   | GitLab webhook   |

### Web Dashboard

Access the web dashboard at `http://localhost:8080` for:

- Real-time service status
- Build history visualization
- Manual rollback triggers
- Configuration management

## Architecture

### Components

1. **BuildMonitor**: Core monitoring service
2. **GitManager**: Git operations and commit isolation
3. **DockerManager**: Containerized build environment
4. **RollbackManager**: Automated rollback system
5. **NotificationManager**: Multi-channel notifications
6. **WebServer**: REST API and dashboard

### Data Flow

```
Git Push → Webhook → BuildMonitor → Docker Build → Status Check → Notification
```

### Commit Isolation Algorithm

The service uses a binary search algorithm to isolate breaking commits:

1. Identify the range of commits between last known good and first bad
2. Use binary search to find the exact breaking commit
3. Provide detailed failure analysis
4. Trigger automated rollback if configured

## Development

### Project Structure

```
build-monitor/
├── src/
│   ├── config.rs          # Configuration management
│   ├── models.rs          # Data structures
│   ├── monitor.rs         # Main monitoring service
│   ├── git.rs            # Git operations
│   ├── docker.rs         # Docker integration
│   ├── rollback.rs       # Rollback system
│   ├── notifications.rs  # Notification channels
│   ├── web.rs           # Web server and API
│   └── main.rs          # CLI application
├── config.toml          # Configuration file
├── Dockerfile          # Container image
└── docker-compose.yml  # Docker deployment
```

### Testing

```bash
# Run unit tests
cargo test

# Run integration tests
cargo test --test integration

# Run with specific features
cargo test --features docker-tests
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Troubleshooting

### Common Issues

**Build failures due to dependency conflicts:**

- Check `Cargo.lock` for version conflicts
- Use `cargo tree` to analyze dependencies
- Update to compatible versions

**Docker build failures:**

- Ensure Docker daemon is running
- Check Dockerfile syntax
- Verify base image availability

**Webhook delivery failures:**

- Check webhook URL configuration
- Verify GitHub/GitLab webhook settings
- Check firewall and network connectivity

### Debug Mode

Enable debug logging:

```bash
RUST_LOG=debug cargo run -- start
```

## License

MIT License - see LICENSE file for details

## Support

- GitHub Issues: [Create an issue](https://github.com/aurum-circle/build-monitor/issues)
- Documentation: [Wiki](https://github.com/aurum-circle/build-monitor/wiki)
- Discord: [Aurum Circle Discord](https://discord.gg/aurum-circle)
