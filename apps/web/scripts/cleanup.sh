#!/bin/bash

# Cleanup script to remove unnecessary files for faster upload
# This script removes build artifacts, logs, and other non-essential files

echo "Cleaning up project for faster upload..."

# Remove Next.js build artifacts
echo "Removing Next.js build directory..."
rm -rf .next

# Remove node_modules (will be reinstalled on deployment)
echo "Removing node_modules directory..."
rm -rf node_modules

# Remove any log files
echo "Removing log files..."
find . -name "*.log" -type f -delete

# Remove any temporary files
echo "Removing temporary files..."
find . -name "*.tmp" -type f -delete
find . -name "*~" -type f -delete

# Remove any OS-specific files
echo "Removing OS-specific files..."
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete

echo "Cleanup complete. Project is now optimized for faster upload."