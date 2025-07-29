use crate::config::DockerConfig;
use crate::config::Service as ServiceConfig;
use crate::models::{BuildStatus, BuildResult};
use bollard::Docker;
use bollard::container::{Config as ContainerConfig, CreateContainerOptions, StartContainerOptions};
use bollard::image::{BuildImageOptions, BuildImageResults};
use bollard::models::{BuildInfo, BuildResult as DockerBuildResult};
use bollard::exec::{CreateExecOptions, StartExecOptions};
use futures::StreamExt;
use std::collections::HashMap;
use std::path::Path;
use tokio::fs;
use tokio::time::{timeout, Duration};
use tracing::{info, error, debug};

pub struct DockerManager {
    docker: Docker,
    config: DockerConfig,
}

impl DockerManager {
    pub async fn new(config: DockerConfig) -> Result<Self, anyhow::Error> {
        let docker = Docker::connect_with_local_defaults()?;
        
        info!("Successfully connected to Docker daemon");
        
        Ok(Self { docker, config })
    }

    pub async fn build_service(
        &self,
        service: &ServiceConfig,
    ) -> Result<BuildResult, anyhow::Error> {
        info!("Starting build for service: {}", service.name);
        
        let start_time = std::time::Instant::now();
        
        // Prepare build context
        let build_context = self.prepare_build_context(service).await?;
        
        // Build the Docker image
        let build_result = self.build_image(&service.name, &build_context).await?;
        
        let duration = start_time.elapsed();
        
        match build_result {
            BuildStatus::Success => {
                info!("Successfully built service: {}", service.name);
                Ok(BuildResult {
                    service_name: service.name.clone(),
                    status: BuildStatus::Success,
                    commit_hash: "latest".to_string(), // This should be actual commit hash
                    duration: Some(duration),
                    error: None,
                    timestamp: chrono::Utc::now(),
                    build_number: 0,
                })
            }
            BuildStatus::Failure => {
                error!("Failed to build service: {}", service.name);
                Ok(BuildResult {
                    service_name: service.name.clone(),
                    status: BuildStatus::Failure,
                    commit_hash: "latest".to_string(),
                    duration: Some(duration),
                    error: Some("Build failed".to_string()),
                    timestamp: chrono::Utc::now(),
                    build_number: 0,
                })
            }
            status => {
                Ok(BuildResult {
                    service_name: service.name.clone(),
                    status,
                    commit_hash: "latest".to_string(),
                    duration: Some(duration),
                    error: None,
                    timestamp: chrono::Utc::now(),
                    build_number: 0,
                })
            }
        }
    }

    async fn prepare_build_context(
        &self,
        service: &ServiceConfig,
    ) -> Result<String, anyhow::Error> {
        let context_path = Path::new(&service.context);
        
        if !context_path.exists() {
            return Err(anyhow::anyhow!("Context path does not exist: {:?}", context_path));
        }
        
        // Create temporary build directory
        let temp_dir = tempfile::tempdir()?;
        let temp_path = temp_dir.path();
        
        // Copy context to temporary directory
        self.copy_directory(context_path, temp_path).await?;
        
        // Generate Dockerfile if not exists
        let dockerfile_path = temp_path.join("Dockerfile");
        if !dockerfile_path.exists() {
            self.generate_dockerfile(service, &dockerfile_path).await?;
        }
        
        Ok(temp_path.to_string_lossy().to_string())
    }

    async fn copy_directory(
        &self,
        src: &Path,
        dst: &Path,
    ) -> Result<(), anyhow::Error> {
        if !dst.exists() {
            fs::create_dir_all(dst).await?;
        }
        
        let mut entries = fs::read_dir(src).await?;
        
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            let dest_path = dst.join(entry.file_name());
            
            if path.is_dir() {
                self.copy_directory(&path, &dest_path).await?;
            } else {
                fs::copy(&path, &dest_path).await?;
            }
        }
        
        Ok(())
    }

    async fn generate_dockerfile(
        &self,
        service: &ServiceConfig,
        dockerfile_path: &Path,
    ) -> Result<(), anyhow::Error> {
        let dockerfile_content = format!(
            r#"
FROM rust:1.82-slim as builder

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy source code
COPY . .

# Build the application
RUN cargo build --release --bin {}

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder stage
COPY --from=builder /app/target/release/{} /app/

# Set environment variables
ENV RUST_LOG=info

# Expose port
EXPOSE {}

# Run the application
CMD ["./{}"]
            "#,
            service.name,
            service.name,
            service.port,
            service.name
        );
        
        fs::write(dockerfile_path, dockerfile_content).await?;
        
        Ok(())
    }

    async fn build_image(
        &self,
        service_name: &str,
        context_path: &str,
    ) -> Result<BuildStatus, anyhow::Error> {
        let build_options = BuildImageOptions {
            dockerfile: "Dockerfile".to_string(),
            t: format!("{}:latest", service_name),
            rm: true,
            forcerm: true,
            ..Default::default()
        };
        
        let context_path = Path::new(context_path);
        let mut build_context = Vec::new();
        
        // Create tar archive of build context
        let tar_path = context_path.join("build.tar");
        self.create_tar_archive(context_path, &tar_path).await?;
        
        let tar_data = fs::read(&tar_path).await?;
        
        let mut build_stream = self.docker.build_image(
            build_options,
            None,
            Some(tar_data.into()),
        );
        
        let mut build_status = BuildStatus::Unknown;
        
        while let Some(result) = build_stream.next().await {
            match result {
                Ok(build_info) => {
                    match build_info {
                        BuildImageResults::BuildInfo(info) => {
                            if let Some(stream) = info.stream {
                                debug!("Build stream: {}", stream.trim());
                            }
                            if let Some(error) = info.error {
                                error!("Build error: {}", error);
                                build_status = BuildStatus::Failure;
                            }
                        }
                        BuildImageResults::BuildResult(result) => {
                            if result.error.is_none() {
                                build_status = BuildStatus::Success;
                            } else {
                                build_status = BuildStatus::Failure;
                            }
                        }
                    }
                }
                Err(e) => {
                    error!("Build failed: {}", e);
                    build_status = BuildStatus::Failure;
                    break;
                }
            }
        }
        
        // Clean up temporary tar file
        let _ = fs::remove_file(&tar_path).await;
        
        Ok(build_status)
    }

    async fn create_tar_archive(
        &self,
        source_dir: &Path,
        tar_path: &Path,
    ) -> Result<(), anyhow::Error> {
        use std::process::Command;
        
        let status = Command::new("tar")
            .arg("-cf")
            .arg(tar_path)
            .arg("-C")
            .arg(source_dir)
            .arg(".")
            .status()?;
        
        if !status.success() {
            return Err(anyhow::anyhow!("Failed to create tar archive"));
        }
        
        Ok(())
    }

    pub async fn run_container(
        &self,
        service_name: &str,
        image_name: &str,
        port: u16,
    ) -> Result<String, anyhow::Error> {
        let container_config = ContainerConfig {
            image: Some(format!("{}:latest", image_name)),
            exposed_ports: Some({
                let mut ports = HashMap::new();
                ports.insert(format!("{}/tcp", port), HashMap::new());
                ports
            }),
            host_config: Some(bollard::models::HostConfig {
                port_bindings: Some({
                    let mut bindings = HashMap::new();
                    bindings.insert(
                        format!("{}/tcp", port),
                        vec![bollard::models::PortBinding {
                            host_ip: Some("0.0.0.0".to_string()),
                            host_port: Some(port.to_string()),
                        }],
                    );
                    bindings
                }),
                ..Default::default()
            }),
            ..Default::default()
        };
        
        let create_options = CreateContainerOptions {
            name: format!("{}-test", service_name),
            ..Default::default()
        };
        
        let container = self.docker.create_container(
            Some(create_options),
            container_config,
        ).await?;
        
        self.docker.start_container(
            &container.id,
            None::<StartContainerOptions<String>>,
        ).await?;
        
        info!("Started container {} for service {}", container.id, service_name);
        
        Ok(container.id)
    }

    pub async fn stop_container(&self, container_id: &str) -> Result<(), anyhow::Error> {
        self.docker.stop_container(container_id, None).await?;
        self.docker.remove_container(container_id, None).await?;
        
        info!("Stopped and removed container {}", container_id);
        Ok(())
    }

    pub async fn run_health_check(
        &self,
        container_id: &str,
        port: u16,
    ) -> Result<bool, anyhow::Error> {
        let exec_config = CreateExecOptions {
            cmd: Some(vec![
                "curl",
                "-f",
                &format!("http://localhost:{}", port),
                "||",
                "exit",
                "1",
            ]),
            attach_stdout: Some(true),
            attach_stderr: Some(true),
            ..Default::default()
        };
        
        let exec = self.docker.create_exec(container_id, exec_config).await?;
        
        let result = timeout(
            Duration::from_secs(30),
            self.docker.start_exec(&exec.id, None::<StartExecOptions>)
        ).await?;
        
        match result {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    pub async fn get_container_logs(
        &self,
        container_id: &str,
        tail: usize,
    ) -> Result<String, anyhow::Error> {
        let logs = self.docker.logs(
            container_id,
            Some(bollard::container::LogsOptions {
                stdout: true,
                stderr: true,
                tail: tail.to_string(),
                ..Default::default()
            }),
        );
        
        let mut log_output = String::new();
        
        let mut logs_stream = logs;
        while let Some(log_result) = logs_stream.next().await {
            match log_result {
                Ok(log) => {
                    log_output.push_str(&log.to_string());
                }
                Err(e) => {
                    error!("Error getting logs: {}", e);
                }
            }
        }
        
        Ok(log_output)
    }

    pub async fn cleanup_resources(&self) -> Result<(), anyhow::Error> {
        // Clean up any test containers
        let containers = self.docker.list_containers::<String>(None).await?;
        
        for container in containers {
            if let Some(names) = container.names {
                for name in names {
                    if name.contains("-test") {
                        let _ = self.stop_container(&name.trim_start_matches('/')).await;
                    }
                }
            }
        }
        
        // Clean up unused images
        let images = self.docker.list_images::<String>(None).await?;
        
        for image in images {
            if let Some(repo_tags) = image.repo_tags {
                for tag in repo_tags {
                    if tag.contains(":latest") && tag.contains("face-") {
                        let _ = self.docker.remove_image(&tag, None, None).await;
                    }
                }
            }
        }
        
        info!("Cleaned up Docker resources");
        Ok(())
    }
}