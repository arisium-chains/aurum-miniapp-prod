#!/bin/bash

# ML Model Setup Script for Aurum Circle Attractiveness Engine
set -e

echo "🤖 Setting up ML models for facial analysis..."

# Create models directory
mkdir -p public/models
cd public/models

echo "📦 Downloading face detection models..."

# Download MediaPipe Face Detection (TFJS format)
if [ ! -d "face_detection" ]; then
    echo "Downloading MediaPipe Face Detection model..."
    mkdir -p face_detection
    
    # Download model files (you'll need to host these or use CDN)
    curl -L "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" \
         -o face_detection/model.tflite
    
    # Convert TFLITE to TFJS format (requires tensorflowjs converter)
    if command -v tensorflowjs_converter &> /dev/null; then
        tensorflowjs_converter \
            --input_format=tflite \
            --output_format=tfjs_graph_model \
            face_detection/model.tflite \
            face_detection/
    else
        echo "⚠️  tensorflowjs_converter not found. Please install: pip install tensorflowjs"
        echo "   Or download pre-converted model from TensorFlow Hub"
    fi
fi

echo "🧠 Downloading face embedding models..."

# Download ArcFace model (you'll need to convert from ONNX or find TFJS version)
if [ ! -d "arcface" ]; then
    echo "Setting up ArcFace embedding model..."
    mkdir -p arcface
    
    # Option 1: Use pre-converted model (you'll need to host this)
    # curl -L "https://your-cdn.com/arcface_r100_tfjs.tar.gz" | tar -xz -C arcface/
    
    # Option 2: Download ONNX model and convert
    echo "Downloading ArcFace ONNX model..."
    curl -L "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" \
         -o arcface/buffalo_l.zip
    
    cd arcface
    unzip buffalo_l.zip
    cd ..
    
    echo "⚠️  ONNX model downloaded. You'll need to convert to TFJS format:"
    echo "   1. Install onnx-tf: pip install onnx-tf"
    echo "   2. Convert: onnx-tf convert -i arcface/buffalo_l/w600k_r50.onnx -o arcface/saved_model"
    echo "   3. Convert to TFJS: tensorflowjs_converter --input_format=tf_saved_model arcface/saved_model arcface/tfjs"
fi

echo "📋 Creating model configuration..."

cat > model_config.json << EOF
{
  "face_detection": {
    "model_path": "/models/face_detection/model.json",
    "input_size": [192, 192],
    "confidence_threshold": 0.7,
    "backend": "webgl"
  },
  "face_embedding": {
    "model_path": "/models/arcface/model.json",
    "input_size": [112, 112],
    "output_size": 512,
    "backend": "webgl"
  },
  "version": "1.0.0",
  "last_updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "🔧 Creating Next.js configuration for models..."

cat > ../../next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable WASM support for ONNX Runtime
  webpack: (config, { isServer }) => {
    // Handle .wasm files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    
    // Handle ONNX Runtime
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    }
    
    // Copy model files to output
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@tensorflow/tfjs-node': '@tensorflow/tfjs',
      }
    }
    
    return config
  },
  
  // Serve model files as static assets
  async rewrites() {
    return [
      {
        source: '/models/:path*',
        destination: '/api/models/:path*',
      },
    ]
  },
  
  // Enable experimental features
  experimental: {
    esmExternals: false,
  },
}

export default nextConfig
EOF

echo "📝 Creating model loading utilities..."

cat > ../../src/lib/ml-models/model-loader.ts << 'EOF'
/**
 * Model Loading Utilities
 * Handles downloading and caching of ML models
 */

interface ModelConfig {
  face_detection: {
    model_path: string
    input_size: [number, number]
    confidence_threshold: number
    backend: string
  }
  face_embedding: {
    model_path: string
    input_size: [number, number]
    output_size: number
    backend: string
  }
  version: string
  last_updated: string
}

export class ModelLoader {
  private static config: ModelConfig | null = null
  
  static async loadConfig(): Promise<ModelConfig> {
    if (this.config) return this.config
    
    try {
      const response = await fetch('/models/model_config.json')
      if (!response.ok) {
        throw new Error('Failed to load model configuration')
      }
      
      this.config = await response.json()
      return this.config
    } catch (error) {
      console.error('Model configuration loading failed:', error)
      
      // Fallback configuration
      this.config = {
        face_detection: {
          model_path: 'https://tfhub.dev/mediapipe/tfjs-model/face_detection/short/1',
          input_size: [192, 192],
          confidence_threshold: 0.7,
          backend: 'webgl'
        },
        face_embedding: {
          model_path: 'https://tfhub.dev/tensorflow/tfjs-model/facenet/1',
          input_size: [160, 160],
          output_size: 128,
          backend: 'webgl'
        },
        version: '1.0.0-fallback',
        last_updated: new Date().toISOString()
      }
      
      return this.config
    }
  }
  
  static async checkModelAvailability(): Promise<{
    face_detection: boolean
    face_embedding: boolean
    overall: boolean
  }> {
    const config = await this.loadConfig()
    
    const results = {
      face_detection: false,
      face_embedding: false,
      overall: false
    }
    
    try {
      // Check face detection model
      const detectionResponse = await fetch(config.face_detection.model_path, { method: 'HEAD' })
      results.face_detection = detectionResponse.ok
      
      // Check face embedding model
      const embeddingResponse = await fetch(config.face_embedding.model_path, { method: 'HEAD' })
      results.face_embedding = embeddingResponse.ok
      
      results.overall = results.face_detection && results.face_embedding
    } catch (error) {
      console.error('Model availability check failed:', error)
    }
    
    return results
  }
}
EOF

echo "✅ ML model setup completed!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Install dependencies:"
echo "   cd ../../ && npm install"
echo ""
echo "2. Install TensorFlow.js converter (if not already installed):"
echo "   pip install tensorflowjs"
echo ""
echo "3. Convert ONNX models to TFJS format:"
echo "   # Follow the conversion instructions above"
echo ""
echo "4. Start the development server:"
echo "   npm run dev"
echo ""
echo "5. Test model loading:"
echo "   curl http://localhost:3002/models/model_config.json"
echo ""
echo "📁 Model Structure:"
echo "   public/models/face_detection/ - MediaPipe face detection"
echo "   public/models/arcface/         - ArcFace embeddings"
echo "   public/models/model_config.json - Configuration file"
echo ""
echo "⚠️  Important Notes:"
echo "   - Models require ~50-100MB of storage"
echo "   - First load will be slower due to model downloading"
echo "   - WebGL backend recommended for performance"
echo "   - Models are cached in browser after first load"