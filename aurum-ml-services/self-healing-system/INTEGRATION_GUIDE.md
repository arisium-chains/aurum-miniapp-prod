# Integration Guide: Self-Healing System

This guide provides step-by-step instructions for integrating the self-healing system with your existing CI/CD pipeline and the Aurum ML Services ecosystem.

## 🎯 Integration Overview

The self-healing system is designed to seamlessly integrate with:

- **Build Monitor** - Receives failure notifications
- **Test Case Generator** - Validates patches with generated tests
- **Face Detection/Embedding Services** - Uses same infrastructure patterns
- **Existing CI/CD Pipelines** - GitHub Actions, GitLab CI, Jenkins

## 🔗 Integration Points

### 1. Build Monitor Integration

#### Configuration

```yaml
# build-monitor/config.toml
[integrations.self_healing]
enabled = true
webhook_url = "http://localhost:8080/api/webhooks/build-failure"
auth_token = "your-webhook-token"
```

#### Webhook Payload

```json
{
  "build_id": "12345",
  "project": "aurum-ml-services",
  "failure_type": "compilation_error",
  "error_details": {
    "file": "src/main.rs",
    "line": 42,
    "message": "expected struct, found enum"
  },
  "git_info": {
    "commit": "abc123",
    "branch": "feature/new-feature",
    "repository": "https://github.com/your-org/aurum-ml-services"
  }
}
```

### 2. Test Case Generator Integration

#### Patch Validation

```rust
// test-case-generator/src/validators/patch_validator.rs
use self_healing_system::patch_validator::PatchValidator;

async fn validate_patch_with_generated_tests(patch: &Patch) -> Result<bool> {
    let validator = PatchValidator::new();

    // Generate test cases for the patch
    let test_cases = generate_test_cases_for_patch(patch).await?;

    // Validate patch with generated tests
    validator.validate_with_tests(patch, test_cases).await
}
```

### 3. GitHub Actions Integration

#### Workflow Example

```yaml
# .github/workflows/self-healing.yml
name: Self-Healing CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-heal:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true

      - name: Build Project
        id: build
        run: cargo build --release
        continue-on-error: true

      - name: Self-Healing Analysis
        if: steps.build.outcome == 'failure'
        uses: ./.github/actions/self-healing
        with:
          build-id: ${{ github.run_id }}
          project-path: ${{ github.workspace }}
          webhook-url: ${{ secrets.SELF_HEALING_WEBHOOK }}

      - name: Apply Patches
        if: steps.build.outcome == 'failure'
        run: |
          # Apply generated patches
          cargo run -- apply --build-id ${{ github.run_id }}
```

### 4. GitLab CI Integration

#### .gitlab-ci.yml

```yaml
stages:
  - build
  - analyze
  - heal

build:
  stage: build
  script:
    - cargo build --release
  allow_failure: true

self-healing:
  stage: heal
  script:
    - |
      if [ "$CI_JOB_STATUS" == "failed" ]; then
        curl -X POST "$SELF_HEALING_WEBHOOK" \
          -H "Content-Type: application/json" \
          -d '{
            "build_id": "'"$CI_JOB_ID"'",
            "project": "'"$CI_PROJECT_NAME"'",
            "failure_type": "build_failure",
            "git_info": {
              "commit": "'"$CI_COMMIT_SHA"'",
              "branch": "'"$CI_COMMIT_REF_NAME"'"
            }
          }'
      fi
  when: on_failure
```

## 🚀 Deployment

### Docker Deployment

#### Dockerfile

```dockerfile
FROM rust:1.75-slim as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/self-healing-system /usr/local/bin/
COPY --from=builder /app/migrations /migrations

EXPOSE 8080
CMD ["self-healing-system", "server"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  self-healing:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=sqlite:///data/self_healing.db
      - RUST_LOG=info
    volumes:
      - ./data:/data
      - ./config:/config
    depends_on:
      - redis
      - prometheus

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./monitoring/grafana:/etc/grafana/provisioning
```

### Kubernetes Deployment

#### Deployment

```yaml
# k8s/self-healing-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: self-healing-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: self-healing-system
  template:
    metadata:
      labels:
        app: self-healing-system
    spec:
      containers:
        - name: self-healing
          image: your-registry/self-healing-system:latest
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: self-healing-secrets
                  key: database-url
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: self-healing-secrets
                  key: openai-api-key
```

## 🔧 Configuration Management

### Environment-Specific Configs

#### Development

```bash
# .env.development
RUST_LOG=debug
DATABASE_URL=sqlite://dev.db
LLM_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434
```

#### Production

```bash
# .env.production
RUST_LOG=info
DATABASE_URL=postgresql://user:pass@localhost/self_healing
LLM_PROVIDER=openai
OPENAI_API_KEY=${OPENAI_API_KEY}
```

### Secrets Management

#### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: self-healing-secrets
type: Opaque
stringData:
  database-url: "postgresql://user:pass@localhost/self_healing"
  openai-api-key: "your-openai-key"
  anthropic-api-key: "your-anthropic-key"
```

## 📊 Monitoring Setup

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "self-healing"
    static_configs:
      - targets: ["self-healing:8080"]
    metrics_path: "/metrics"
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Self-Healing System",
    "panels": [
      {
        "title": "Build Failures",
        "type": "stat",
        "targets": [
          {
            "expr": "build_failures_total"
          }
        ]
      },
      {
        "title": "Patch Success Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(patches_applied_total[5m])"
          }
        ]
      }
    ]
  }
}
```

## 🧪 Testing Integration

### Test Configuration

```yaml
# tests/integration/config.yml
test_project:
  path: "./test-projects/sample-rust-project"
  expected_failures:
    - type: "compilation_error"
      file: "src/main.rs"
      line: 42
  expected_patches:
    - type: "edition_2024_migration"
      confidence: 0.95
```

### CI Test Pipeline

```yaml
# .github/workflows/integration-test.yml
name: Integration Tests

on:
  pull_request:
    branches: [main]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Run Integration Tests
        run: |
          cargo test --test integration_tests
          cargo test --test e2e_tests
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check logs
docker logs self-healing-system

# Verify configuration
cargo run -- config validate

# Check database connectivity
cargo run -- db check
```

#### LLM Integration Issues

```bash
# Test LLM connection
cargo run -- test llm --provider openai

# Check API keys
cargo run -- config show
```

#### Performance Issues

```bash
# Monitor resource usage
docker stats self-healing-system

# Check metrics
curl http://localhost:8080/metrics
```

## 📞 Support Channels

- **Slack**: #self-healing-system
- **Email**: support@aurum-ml-services.com
- **Issues**: GitHub Issues
- **Documentation**: https://docs.aurum-ml-services.com

## 🔗 Useful Links

- [Build Monitor Integration](https://github.com/your-org/build-monitor)
- [Test Case Generator](https://github.com/your-org/test-case-generator)
- [Face Detection Service](https://github.com/your-org/face-detection)
- [Face Embedding Service](https://github.com/your-org/face-embedding)
