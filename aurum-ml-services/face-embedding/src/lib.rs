use ort::{
    session::Session,
    value::{Value, Tensor},
    memory::Allocator,
    inputs,
    Error as OrtError,
    session::SessionOutputs
};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use image::{DynamicImage, ImageBuffer, Rgb};
use base64::{Engine as _, engine::general_purpose};
use std::sync::Mutex;

#[derive(Error, Debug)]
pub enum EmbeddingError {
    #[error("ONNX runtime error: {0}")]
    OrtError(#[from] OrtError),
    #[error("Invalid input shape")]
    InvalidInputShape,
    #[error("Invalid output")]
    InvalidOutput,
    #[error("Image processing error: {0}")]
    ImageError(String),
    #[error("Base64 decode error: {0}")]
    Base64Error(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FaceEmbedding {
    pub embedding: Vec<f32>,
    pub quality: f32,
    pub confidence: f32,
}

pub struct FaceEmbeddingModel {
    session: Mutex<Session>,
}

impl FaceEmbeddingModel {
    pub fn new(model_path: &str) -> Result<Self, EmbeddingError> {
        let session = Session::builder()?
            .commit_from_file(model_path)?;
            
        Ok(Self { session: Mutex::new(session) })
    }

    pub fn extract_embedding(&self, image: &DynamicImage) -> Result<FaceEmbedding, EmbeddingError> {
        let input_tensor = self.preprocess_image(image)?;
        let outputs = self.run_inference(input_tensor)?;
        let embedding = self.postprocess_embedding(outputs)?;
        
        Ok(embedding)
    }

    pub fn extract_embedding_from_base64(&self, base64_image: &str) -> Result<FaceEmbedding, EmbeddingError> {
        // Decode base64 image
        let image_data = general_purpose::STANDARD
            .decode(base64_image)
            .map_err(|e| EmbeddingError::Base64Error(e.to_string()))?;
            
        let image = image::load_from_memory(&image_data)
            .map_err(|e| EmbeddingError::ImageError(e.to_string()))?;
            
        self.extract_embedding(&image)
    }

    fn preprocess_image(&self, image: &DynamicImage) -> Result<Value, EmbeddingError> {
        // Convert to RGB if needed
        let rgb_image = image.to_rgb8();
        
        // Resize to model input dimensions (typically 112x112 for ArcFace)
        let resized = image::imageops::resize(
            &rgb_image,
            112,  // width
            112,  // height
            image::imageops::FilterType::Triangle
        );

        // Convert to normalized float tensor [0-1] range
        let mut tensor_data = Vec::with_capacity(3 * 112 * 112);
        for pixel in resized.pixels() {
            tensor_data.push(pixel[0] as f32 / 255.0);  // R
            tensor_data.push(pixel[1] as f32 / 255.0);  // G
            tensor_data.push(pixel[2] as f32 / 255.0);  // B
        }

        // Create ONNX tensor with shape [1, 3, height, width]
        let tensor_data: Vec<f32> = tensor_data; // Ensure correct type
        let tensor = Tensor::from_array(([1, 3, 112, 112], tensor_data))
            .map_err(EmbeddingError::from)?;
        let value = Value::from(tensor);

        Ok(value)
    }

    fn run_inference(&self, input: Value) -> Result<SessionOutputs<'_>, EmbeddingError> {
        let mut session = self.session.lock().unwrap();
        Ok(session.run(inputs![input])?)
    }

    fn postprocess_embedding(&self, outputs: SessionOutputs) -> Result<FaceEmbedding, EmbeddingError> {
        // Use first output tensor (adjust index if your model differs)
        let embedding_tensor: &Value = &outputs[0];
        
        // Convert tensor to vector
        let embedding_data = embedding_tensor.view().as_slice().unwrap();
        
        // Normalize embedding (L2 normalization)
        let norm: f32 = embedding_data.iter().map(|&x| x * x).sum::<f32>().sqrt();
        let normalized_embedding: Vec<f32> = embedding_data.iter().map(|&x| x / norm).collect();
        
        // Create FaceEmbedding with quality and confidence metrics
        // In a real implementation, these would be calculated based on the image quality
        let quality = 0.95; // Placeholder value
        let confidence = 0.98; // Placeholder value
        
        Ok(FaceEmbedding {
            embedding: normalized_embedding,
            quality,
            confidence,
        })
    }

    pub fn allocator(&self) -> Allocator {
        let session = self.session.lock().unwrap();
        session.allocator().clone()
    }
}