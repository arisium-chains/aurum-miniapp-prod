#!/bin/bash

echo "Current directory: $(pwd)"
echo "Checking if path exists:"
if [ -d "miniapp/aurum-circle-miniapp/ml-face-score-api" ]; then
    echo "Path exists"
    echo "Contents of the directory:"
    ls -la miniapp/aurum-circle-miniapp/ml-face-score-api
else
    echo "Path does not exist"
fi

echo "Checking Dockerfile specifically:"
if [ -f "miniapp/aurum-circle-miniapp/ml-face-score-api/Dockerfile" ]; then
    echo "Dockerfile exists"
else
    echo "Dockerfile does not exist"
fi