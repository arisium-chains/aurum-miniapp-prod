# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS and add non-root user
RUN apk --no-cache add ca-certificates && \
    addgroup -g 1001 -S aurum && \
    adduser -S aurum -u 1001

WORKDIR /app

# Copy the pre-built binary from the host
COPY ./api-gateway .

# Copy example env file if it exists
COPY ./.env.example .env.example

# Change ownership of the app directory to the aurum user
RUN chown -R aurum:aurum /app && chmod +x /app/api-gateway

# Switch to non-root user
USER aurum

# Expose the port the app runs on
EXPOSE 8081

# Command to run the application
CMD ["./api-gateway"]
