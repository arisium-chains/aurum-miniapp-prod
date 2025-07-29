use ort::{
    session::Session,
    value::{Value, Tensor},
    memory::Allocator,
    inputs,
    Error as OrtError,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use image::{DynamicImage};
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
        let embedding_data = self.run_inference(input_tensor)?;
        let embedding = self.postprocess_embedding(embedding_data)?;
        
        Ok(embedding)
    }

    pub fn extract_embedding_from_base64(&self, base64_image: &str) -> Result<FaceEmbedding, EmbeddingError> {
        let image_data = general_purpose::STANDARD
            .decode(base64_image)
            .map_err(|e| EmbeddingError::Base64Error(e.to_string()))?;
            
        let image = image::load_from_memory(&image_data)
            .map_err(|e| EmbeddingError::ImageError(e.to_string()))?;
            
        self.extract_embedding(&image)
    }

    fn preprocess_image(&self, image: &DynamicImage) -> Result<Value, EmbeddingError> {
        let rgb_image = image.to_rgb8();
        
        let resized = image::imageops::resize(
            &rgb_image,
            112,
            112,
            image::imageops::FilterType::Triangle
        );

        let mut tensor_data = Vec::with_capacity(112 * 112 * 3);
        for pixel in resized.pixels() {
            tensor_data.push(pixel[0] as f32 / 255.0);
            tensor_data.push(pixel[1] as f32 / 255.0);
            tensor_data.push(pixel[2] as f32 / 255.0);
        }

        let tensor = Tensor::from_array(&[1, 3, 112, 112], &tensor_data)?;
        Ok(Value::from_tensor(tensor))
    }

    fn run_inference(&self, input_tensor: Value) -> Result<Vec<f32>, EmbeddingError> {
        let session = self.session.lock().unwrap();
        let outputs = session.run(inputs![input_tensor]?)?;
        
        let output_tensor = outputs[0].try_extract::<f32>()?;
        let embedding = output_tensor.view().to_slice().unwrap().to_vec();
        
        Ok(embedding)
    }

    fn postprocess_embedding(&self, embedding_data: Vec<f32>) -> Result<FaceEmbedding, EmbeddingError> {
        let quality = 0.95; // Placeholder quality score
        let confidence = 0.98; // Placeholder confidence score
        
        Ok(FaceEmbedding {
            embedding: embedding_data,
            quality,
            confidence,
        })
    }
}