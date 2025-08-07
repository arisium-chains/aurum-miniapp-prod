#!/bin/bash

# Script to optimize ML models for faster upload
# This script compresses model files to reduce upload size

echo "Optimizing ML models..."

# Navigate to the models directory
cd public/models

# Compress ArcFace models
echo "Compressing ArcFace models..."
cd arcface
for file in *.onnx; do
  if [ -f "$file" ]; then
    echo "Compressing $file..."
    gzip -c "$file" > "${file}.gz"
    # Keep original for compatibility, but note compressed version is available
  fi
done

# Compress face detection model
echo "Compressing face detection model..."
cd ../face_detection
if [ -f "model.tflite" ]; then
  echo "Compressing model.tflite..."
  gzip -c "model.tflite" > "model.tflite.gz"
fi

echo "Model compression completed."

# Return to project root
cd ../../..

echo "Optimization complete. Models are now compressed and ready for faster upload."