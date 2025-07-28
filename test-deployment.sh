#!/bin/bash

# Test script to verify Aurum Circle deployment

echo "Testing Aurum Circle Deployment"
echo "==============================="

# Test nginx health check
echo "1. Testing nginx health check..."
curl -s http://localhost/nginx-health
if [ $? -eq 0 ]; then
    echo "   ✓ Nginx is running"
else
    echo "   ✗ Nginx is not responding"
fi

# Test main application health check
echo "2. Testing main application health check..."
curl -s http://localhost/health
if [ $? -eq 0 ]; then
    echo "   ✓ Main application is running"
else
    echo "   ✗ Main application is not responding"
fi

# Test ML API service
echo "3. Testing ML API service..."
curl -s http://localhost/api/ml/health
if [ $? -eq 0 ]; then
    echo "   ✓ ML API service is running"
else
    echo "   ✗ ML API service is not responding"
fi

# Test Face Detection service
echo "4. Testing Face Detection service..."
curl -s http://localhost/api/face-detection/health
if [ $? -eq 0 ]; then
    echo "   ✓ Face Detection service is running"
else
    echo "   ✗ Face Detection service is not responding"
fi

# Test Face Embedding service
echo "5. Testing Face Embedding service..."
curl -s http://localhost/api/face-embedding/health
if [ $? -eq 0 ]; then
    echo "   ✓ Face Embedding service is running"
else
    echo "   ✗ Face Embedding service is not responding"
fi

echo ""
echo "Deployment test completed."