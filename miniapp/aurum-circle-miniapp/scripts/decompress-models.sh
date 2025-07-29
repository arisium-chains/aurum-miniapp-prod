#!/bin/bash

# Script to decompress ML models on app startup
# This script decompresses the gzipped model files for use by the application

echo "Decompressing ML models..."

# Navigate to the models directory
cd public/models

# Decompress ArcFace models
echo "Decompressing ArcFace models..."
cd arcface
for file in *.onnx.gz; do
  if [ -f "$file" ]; then
    echo "Decompressing $file..."
    gunzip -c "$file" > "${file%.gz}"
  fi
done

# Decompress face detection model
echo "Decompressing face detection model..."
cd ../face_detection
if [ -f "model.tflite.gz" ]; then
  echo "Decompressing model.tflite.gz..."
  gunzip -c "model.tflite.gz" > "model.tflite"
fi

echo "Model decompression completed."

# Return to project root
cd ../../..

echo "Models are now ready for use."