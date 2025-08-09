#!/bin/bash

# Deployment preparation script
# This script prepares the project for deployment by optimizing and cleaning up

echo "Preparing project for deployment..."

# Run the preupload script (optimize and cleanup)
echo "Running cleanup..."
npm run cleanup

# Create a deployment package
echo "Creating deployment package..."
tar -czf aurum-circle-deployment.tar.gz \
  --exclude='*.tar.gz' \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='*.log' \
  .

echo "Deployment package created: aurum-circle-deployment.tar.gz"

# Show the size of the deployment package
echo "Package size:"
du -h aurum-circle-deployment.tar.gz

echo "Deployment preparation complete."