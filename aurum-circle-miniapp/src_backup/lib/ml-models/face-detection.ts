/**
 * Real Face Detection using TensorFlow.js and MediaPipe
 * Production-ready face detection and landmark extraction
 */

import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

export interface RealFaceDetection {
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
  landmarks: {
    leftEye: [number, number]
    rightEye: [number, number]
    nose: [number, number]
    leftMouth: [number, number]
    rightMouth: [number, number]
  }
  confidence: number
  keypoints?: Array<{x: number, y: number, name: string}>
}

export interface ProcessedImage {
  originalWidth: number
  originalHeight: number
  tensor: tf.Tensor
  faces: RealFaceDetection[]
}

/**
 * Real face detection using MediaPipe Face Detection
 */
export class RealFaceDetector {
  private model: tf.GraphModel | null = null
  private isInitialized = false
  
  // MediaPipe Face Detection model URLs
  private readonly MODEL_URLS = {
    detection: 'https://tfhub.dev/mediapipe/tfjs-model/face_detection/short/1',
    landmarks: 'https://tfhub.dev/mediapipe/tfjs-model/face_landmarks_detection/1'
  }
  
  /**
   * Initialize the face detection models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      console.log('Loading MediaPipe Face Detection model...')
      
      // Set TensorFlow.js backend
      await tf.setBackend('webgl')
      await tf.ready()
      
      // Load the face detection model
      this.model = await tf.loadGraphModel(this.MODEL_URLS.detection)
      
      console.log('Face detection model loaded successfully')
      this.isInitialized = true
      
    } catch (error) {
      console.error('Failed to initialize face detection:', error)
      throw new Error('Face detection model initialization failed')
    }
  }
  
  /**
   * Detect faces in an image
   */
  async detectFaces(imageData: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<RealFaceDetection[]> {
    if (!this.isInitialized || !this.model) {
      await this.initialize()
    }
    
    try {
      // Convert image to tensor
      const imageTensor = this.preprocessImage(imageData)
      
      // Run inference
      const predictions = await this.model.executeAsync(imageTensor) as tf.Tensor[]
      
      // Process predictions
      const faces = await this.processPredictions(predictions, imageTensor.shape)
      
      // Cleanup tensors
      imageTensor.dispose()
      predictions.forEach(tensor => tensor.dispose())
      
      return faces
      
    } catch (error) {
      console.error('Face detection failed:', error)
      throw new Error('Face detection inference failed')
    }
  }
  
  /**
   * Preprocess image for model input
   */
  private preprocessImage(imageData: ImageData | HTMLImageElement | HTMLCanvasElement): tf.Tensor {
    let tensor: tf.Tensor
    
    if (imageData instanceof ImageData) {
      // Convert ImageData to tensor
      tensor = tf.browser.fromPixels(imageData)
    } else {
      // Convert HTML element to tensor
      tensor = tf.browser.fromPixels(imageData)
    }
    
    // Resize to model input size (typically 128x128 or 192x192)
    const resized = tf.image.resizeBilinear(tensor, [192, 192])
    
    // Normalize pixel values to [0, 1]
    const normalized = resized.div(255.0)
    
    // Add batch dimension
    const batched = normalized.expandDims(0)
    
    // Cleanup intermediate tensors
    tensor.dispose()
    resized.dispose()
    normalized.dispose()
    
    return batched
  }
  
  /**
   * Process model predictions into face detections
   */
  private async processPredictions(predictions: tf.Tensor[], imageShape: number[]): Promise<RealFaceDetection[]> {
    const faces: RealFaceDetection[] = []
    
    // MediaPipe Face Detection typically returns:
    // - Bounding boxes
    // - Confidence scores
    // - Key facial landmarks
    
    const [bboxes, scores, landmarks] = predictions
    
    const bboxData = await bboxes.data()
    const scoreData = await scores.data()
    const landmarkData = landmarks ? await landmarks.data() : null
    
    const imageHeight = imageShape[1]
    const imageWidth = imageShape[2]
    
    // Process each detected face
    for (let i = 0; i < scoreData.length; i++) {
      const confidence = scoreData[i]
      
      // Filter by confidence threshold
      if (confidence < 0.7) continue
      
      // Extract bounding box (normalized coordinates)
      const x = bboxData[i * 4] * imageWidth
      const y = bboxData[i * 4 + 1] * imageHeight
      const width = bboxData[i * 4 + 2] * imageWidth
      const height = bboxData[i * 4 + 3] * imageHeight
      
      // Extract landmarks if available
      let faceLandmarks = {
        leftEye: [x + width * 0.3, y + height * 0.35] as [number, number],
        rightEye: [x + width * 0.7, y + height * 0.35] as [number, number],
        nose: [x + width * 0.5, y + height * 0.55] as [number, number],
        leftMouth: [x + width * 0.4, y + height * 0.75] as [number, number],
        rightMouth: [x + width * 0.6, y + height * 0.75] as [number, number]
      }
      
      if (landmarkData) {
        // Use actual landmark predictions
        const landmarkOffset = i * 10 // 5 landmarks * 2 coordinates
        faceLandmarks = {
          leftEye: [
            landmarkData[landmarkOffset] * imageWidth,
            landmarkData[landmarkOffset + 1] * imageHeight
          ],
          rightEye: [
            landmarkData[landmarkOffset + 2] * imageWidth,
            landmarkData[landmarkOffset + 3] * imageHeight
          ],
          nose: [
            landmarkData[landmarkOffset + 4] * imageWidth,
            landmarkData[landmarkOffset + 5] * imageHeight
          ],
          leftMouth: [
            landmarkData[landmarkOffset + 6] * imageWidth,
            landmarkData[landmarkOffset + 7] * imageHeight
          ],
          rightMouth: [
            landmarkData[landmarkOffset + 8] * imageWidth,
            landmarkData[landmarkOffset + 9] * imageHeight
          ]
        }
      }
      
      faces.push({
        bbox: { x, y, width, height },
        landmarks: faceLandmarks,
        confidence
      })
    }
    
    return faces
  }
  
  /**
   * Extract face crop from image
   */
  async extractFaceCrop(
    imageData: ImageData | HTMLImageElement | HTMLCanvasElement,
    face: RealFaceDetection,
    outputSize: number = 112
  ): Promise<tf.Tensor> {
    try {
      // Convert image to tensor
      const imageTensor = tf.browser.fromPixels(imageData)
      
      // Calculate crop box with padding
      const padding = 0.2 // 20% padding around face
      const { x, y, width, height } = face.bbox
      
      const cropX = Math.max(0, x - width * padding)
      const cropY = Math.max(0, y - height * padding)
      const cropWidth = Math.min(imageTensor.shape[1] - cropX, width * (1 + 2 * padding))
      const cropHeight = Math.min(imageTensor.shape[0] - cropY, height * (1 + 2 * padding))
      
      // Crop face region
      const cropped = tf.image.cropAndResize(
        imageTensor.expandDims(0),
        [[cropY / imageTensor.shape[0], cropX / imageTensor.shape[1], 
          (cropY + cropHeight) / imageTensor.shape[0], (cropX + cropWidth) / imageTensor.shape[1]]],
        [0],
        [outputSize, outputSize]
      )
      
      // Remove batch dimension
      const faceCrop = cropped.squeeze([0])
      
      // Cleanup
      imageTensor.dispose()
      cropped.dispose()
      
      return faceCrop
      
    } catch (error) {
      console.error('Face crop extraction failed:', error)
      throw new Error('Failed to extract face crop')
    }
  }
  
  /**
   * Calculate face quality metrics
   */
  calculateFaceQuality(face: RealFaceDetection, imageWidth: number, imageHeight: number): {
    quality: number
    frontality: number
    symmetry: number
    resolution: number
  } {
    const { bbox, landmarks, confidence } = face
    
    // Base quality from detection confidence
    let quality = confidence
    
    // Resolution score based on face size
    const faceArea = bbox.width * bbox.height
    const imageArea = imageWidth * imageHeight
    const faceRatio = faceArea / imageArea
    const resolution = Math.min(1.0, faceRatio * 10) // Faces should be at least 10% of image
    
    // Frontality from eye alignment
    const eyeY1 = landmarks.leftEye[1]
    const eyeY2 = landmarks.rightEye[1]
    const eyeAlignment = 1 - Math.abs(eyeY1 - eyeY2) / bbox.height
    const frontality = Math.max(0.1, eyeAlignment)
    
    // Symmetry from landmark positions
    const faceCenterX = bbox.x + bbox.width / 2
    const noseCenterX = landmarks.nose[0]
    const noseDeviation = Math.abs(noseCenterX - faceCenterX) / bbox.width
    const symmetry = Math.max(0.1, 1 - noseDeviation * 2)
    
    // Adjust quality based on other metrics
    quality *= (frontality + symmetry + resolution) / 3
    
    return {
      quality: Math.min(1.0, quality),
      frontality,
      symmetry,
      resolution
    }
  }
  
  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose()
      this.model = null
    }
    this.isInitialized = false
  }
}

// Singleton instance
export const realFaceDetector = new RealFaceDetector()