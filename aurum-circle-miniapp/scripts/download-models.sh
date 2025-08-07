#!/bin/sh

# Script to download ML models for the Aurum Circle miniapp
# This script downloads the required ML models from reliable sources

set -e

echo "🤖 Downloading ML models for Aurum Circle..."

# Create directories if they don't exist
mkdir -p public/models/arcface
mkdir -p public/models/face_detection

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl is required but not installed"
    exit 1
fi

# Download face detection model (MediaPipe Face Detection)
echo "📥 Downloading MediaPipe Face Detection model..."
cd public/models/face_detection

# Download the TFLite model
if [ ! -f "model.tflite" ]; then
    echo "Downloading MediaPipe Face Detection model..."
    curl -L -o model.tflite "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
    echo "✅ Face detection model downloaded successfully"
else
    echo "✅ Face detection model already exists"
fi

# Download ArcFace model (InsightFace Buffalo L)
echo "📥 Downloading ArcFace embedding model..."
cd ../arcface

if [ ! -f "buffalo_l.zip" ]; then
    echo "Downloading ArcFace Buffalo L model..."
    curl -L -o buffalo_l.zip "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip"
    
    if [ -f "buffalo_l.zip" ]; then
        echo "Extracting ArcFace model..."
        unzip -q buffalo_l.zip
        echo "✅ ArcFace model downloaded and extracted successfully"
    else
        echo "❌ Failed to download ArcFace model"
    fi
else
    echo "✅ ArcFace model already exists"
fi

# Create model configuration
echo "📋 Creating model configuration..."
cd ../..

cat > public/models/model_config.json << EOF
{
  "face_detection": {
    "model_path": "/models/face_detection/model.tflite",
    "input_size": [192, 192],
    "confidence_threshold": 0.7,
    "backend": "webgl"
  },
  "face_embedding": {
    "model_path": "/models/arcface/buffalo_l.onnx",
    "input_size": [112, 112],
    "output_size": 512,
    "backend": "webgl"
  },
  "version": "1.0.0",
  "last_updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ ML model download completed successfully!"
echo ""
echo "📁 Model Structure:"
echo "   public/models/face_detection/model.tflite - MediaPipe face detection"
echo "   public/models/arcface/ - ArcFace embedding model files"
echo "   public/models/model_config.json - Model configuration"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Convert ONNX models to TensorFlow.js format if needed"
echo "   2. Test model loading in the application"
echo "   3. Update model paths in application code if necessary"