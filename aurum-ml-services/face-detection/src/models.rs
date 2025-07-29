use std::sync::Mutex;
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

#[derive(Error, Debug)]
pub enum ModelError {
    #[error("ONNX runtime error: {0}")]
    OrtError(#[from] OrtError),
    #[error("Invalid input shape")]
    InvalidInputShape,
    #[error("Invalid output")]
    InvalidOutput,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FaceDetection {
    pub score: f32,
    pub bounding_box: [f32; 4],
    pub landmarks: [[f32; 2]; 5],
    pub golden_ratio_analysis: GoldenRatioAnalysis,
    pub ai_detection: AiDetection,
    pub filter_detection: FilterDetection,
    pub geometric_analysis: GeometricAnalysis,
    pub texture_analysis: TextureAnalysis,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoldenRatioAnalysis {
    pub score: f32,
    pub symmetry_score: f32,
    pub facial_proportions: [f32; 6],
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AiDetection {
    pub score: f32,
    pub confidence: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FilterDetection {
    pub score: f32,
    pub confidence: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeometricAnalysis {
    pub score: f32,
    pub symmetry_score: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TextureAnalysis {
    pub score: f32,
    pub confidence: f32,
}

pub struct FaceDetectionModel {
    session: Mutex<Session>,
}

impl FaceDetectionModel {
    pub fn new(model_path: &str) -> Result<Self, ModelError> {
        let session = Session::builder()?
            .commit_from_file(model_path)?;
            
        Ok(Self { session: Mutex::new(session) })
    }

    pub fn run_inference(&self, input: Value) -> Result<SessionOutputs<'_>, ModelError> {
        let mut session = self.session.lock().unwrap();
        Ok(session.run(inputs![input])?)
    }

    pub fn allocator(&self) -> Allocator {
        let session = self.session.lock().unwrap();
        session.allocator().clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ort::value::{Value as Tensor};
    use ndarray::ArrayD;
    use base64::{Engine as _, engine::general_purpose};

    #[test]
    fn test_model_error_conversion() {
        let ort_error = OrtError::new("test error".to_string());
        let model_error: ModelError = ort_error.into();
        assert!(matches!(model_error, ModelError::OrtError(_)));
    }

    #[test]
    fn test_base64_validation() {
        // Test valid base64
        let valid_base64 = general_purpose::STANDARD.encode("test data");
        assert!(general_purpose::STANDARD.decode(&valid_base64).is_ok());

        // Test invalid base64
        let invalid_base64 = "not_base64!";
        assert!(general_purpose::STANDARD.decode(invalid_base64).is_err());
    }

    #[test]
    fn test_invalid_tensor_shapes() {
        let model = FaceDetectionModel::new("test.onnx").unwrap();
        let invalid_shape = ArrayD::<f32>::zeros(vec![1, 3, 100, 100]);
        let tensor = Tensor::from_array(([1, 3, 100, 100], invalid_shape.into_raw_vec())).unwrap();
        
        match model.run_inference(tensor.into()) {
            Err(ModelError::InvalidInputShape) => (),
            _ => panic!("Expected InvalidInputShape error"),
        }
    }

    #[test]
    fn test_tensor_dimensions() {
        let invalid_shape = ArrayD::<f32>::zeros(vec![1, 3, 100, 100]);
        let tensor = Tensor::from_array(([1, 3, 100, 100], invalid_shape.into_raw_vec())).unwrap();
        let value = Value::from(tensor);
        assert_eq!(value.tensor_type_and_shape().unwrap().dimensions(), &[1, 3, 100, 100]);
    }

    #[test]
    fn test_image_to_tensor_conversion() {
        // Load test image
        let img = image::open("Paiiinntt.jpeg")
            .expect("Failed to load test image")
            .to_rgb8();

        // Resize to expected dimensions
        let img = image::imageops::resize(
            &img,
            640,  // width
            480,  // height
            image::imageops::FilterType::Triangle
        );

        // Convert to tensor data
        let mut tensor_data = Vec::with_capacity(1 * 3 * 480 * 640);
        for pixel in img.pixels() {
            tensor_data.push(pixel[0] as f32 / 255.0);
            tensor_data.push(pixel[1] as f32 / 255.0);
            tensor_data.push(pixel[2] as f32 / 255.0);
        }

        // Create tensor and verify shape
        let tensor = Tensor::from_array(([1, 3, 480, 640], tensor_data))
            .expect("Failed to create tensor");
        
        assert_eq!(tensor.dimensions(), &[1, 3, 480, 640]);
    }
}