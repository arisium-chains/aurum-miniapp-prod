# Self-Healing CI/CD System

A comprehensive Rust-based self-healing CI/CD pipeline system that uses static analysis and LLM assistance to automatically detect, generate, and apply fixes for build failures.

## 🚀 Features

- **Automated Failure Detection**: Static analysis engine using Rust's `syn` crate
- **Intelligent Patch Generation**: LLM-powered code fixes with safety validation
- **Multi-Provider LLM Support**: OpenAI GPT-4, Claude, and local models
- **Comprehensive Validation**: Docker-based testing and security scanning
- **Real-time Monitoring**: Prometheus metrics and alerting
- **Git Integration**: Automated branch management and rollback
- **Security-First**: Pattern blocking and security analysis

## 📋 Quick Start

### Prerequisites

- Rust 1.75+ (for Edition 2024 support)
- Docker
- SQLite

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd aurum-ml-services/self-healing-system

# Install dependencies
cargo build --release

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
cargo run -- migrate

# Start the system
cargo run -- server
```

## 🔧 Configuration

### Environment Variables

```bash
# LLM Configuration
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OLLAMA_API_URL=http://localhost:11434

# Database
DATABASE_URL=sqlite://self_healing.db

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Security
MAX_PATCH_SIZE=5000
ENABLE_SECURITY_SCAN=true
```

### CLI Usage

```bash
# Analyze a project
cargo run -- analyze --project-path ./my-project

# Generate patches for failures
cargo run -- generate --build-id 12345

# Validate patches
cargo run -- validate --patch-id patch-123

# Apply patches
cargo run -- apply --patch-id patch-123 --dry-run

# Monitor system
cargo run -- monitor
```

## 🏗️ Architecture

### Core Components

1. **Static Analysis Engine** (`src/static_analysis.rs`)

   - AST-based code analysis
   - Pattern detection
   - Edition 2024 compatibility checks

2. **LLM Integration** (`src/llm_integration.rs`)

   - Multi-provider support
   - Prompt engineering
   - Response validation

3. **Patch Generator** (`src/patch_generator.rs`)

   - Intelligent code generation
   - Safety analysis
   - Confidence scoring

4. **Patch Validator** (`src/patch_validator.rs`)

   - Docker-based testing
   - Security scanning
   - Build validation

5. **Database Layer** (`src/database.rs`)
   - SQLite persistence
   - Migration support
   - Query optimization

## 🔍 API Endpoints

### REST API

- `POST /api/analyze` - Analyze project for failures
- `POST /api/generate` - Generate patches
- `POST /api/validate` - Validate patches
- `POST /api/apply` - Apply patches
- `GET /api/status` - System status
- `GET /api/metrics` - Prometheus metrics

### WebSocket API

- `/ws/monitor` - Real-time monitoring
- `/ws/patches` - Patch status updates

## 📊 Monitoring

### Prometheus Metrics

- `build_failures_total` - Total build failures
- `patches_generated_total` - Patches generated
- `patches_applied_total` - Patches successfully applied
- `patch_validation_duration` - Validation time
- `system_health_score` - Overall system health

### Grafana Dashboards

- System Overview
- Patch Generation Pipeline
- Security Scanning Results
- Performance Metrics

## 🧪 Testing

### Unit Tests

```bash
cargo test
```

### Integration Tests

```bash
cargo test --test integration_tests
```

### End-to-End Tests

```bash
./scripts/e2e-test.sh
```

## 🔒 Security

### Patch Security

- **Pattern Blocking**: Prevents dangerous code patterns
- **Security Scanning**: Uses `cargo-audit` and `cargo-geiger`
- **Sandbox Validation**: Docker-based testing
- **Rollback Support**: Automatic rollback on failure

### Access Control

- API key authentication
- Role-based permissions
- Audit logging

## 📈 Performance

### Optimization Features

- **Caching**: Redis-based caching for LLM responses
- **Parallel Processing**: Multi-threaded patch generation
- **Incremental Analysis**: Only re-analyze changed files
- **Resource Limits**: Configurable resource constraints

## 🔄 Integration

### Existing Services

- **Build Monitor**: Receives failure notifications
- **Test Case Generator**: Validates patches with generated tests
- **Face Detection**: Uses same infrastructure patterns

### CI/CD Integration

- GitHub Actions
- GitLab CI
- Jenkins
- Custom webhooks

## 🛠️ Development

### Project Structure

```
self-healing-system/
├── src/
│   ├── main.rs              # CLI interface
│   ├── config.rs            # Configuration
│   ├── static_analysis.rs   # Analysis engine
│   ├── llm_integration.rs   # LLM layer
│   ├── patch_generator.rs   # Patch generation
│   ├── patch_validator.rs   # Validation
│   ├── database.rs          # Database layer
│   ├── git_operations.rs    # Git integration
│   └── monitoring.rs        # Monitoring
├── tests/
│   ├── integration_tests.rs # Integration tests
│   └── e2e_tests.rs         # End-to-end tests
├── migrations/              # Database migrations
├── monitoring/              # Grafana dashboards
└── scripts/                 # Utility scripts
```

### Development Setup

```bash
# Install development dependencies
cargo install cargo-watch
cargo install cargo-audit
cargo install sqlx-cli

# Run in development mode
cargo watch -x run -- server --dev

# Run with hot reload
cargo watch -x check -x test
```

## 📝 Examples

### Basic Usage

```rust
use self_healing_system::*;

#[tokio::main]
async fn main() -> Result<()> {
    let config = Config::from_env()?;
    let analyzer = StaticAnalyzer::new(config);

    let results = analyzer.analyze_project("./my-project").await?;

    for failure in results.failures {
        let patches = analyzer.generate_patches(&failure).await?;
        for patch in patches {
            if analyzer.validate_patch(&patch).await? {
                analyzer.apply_patch(&patch).await?;
            }
        }
    }

    Ok(())
}
```

### Custom Analysis

```rust
use self_healing_system::static_analysis::*;

struct CustomAnalyzer {
    // Custom implementation
}

impl StaticAnalyzer for CustomAnalyzer {
    fn analyze(&self, ast: &syn::File) -> Vec<AnalysisResult> {
        // Custom analysis logic
    }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🆘 Support

- [Issues](https://github.com/your-org/aurum-ml-services/issues)
- [Discussions](https://github.com/your-org/aurum-ml-services/discussions)
- [Documentation](https://docs.aurum-ml-services.com)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
