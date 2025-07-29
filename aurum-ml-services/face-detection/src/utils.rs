//! Utility functions for face detection service

use image::DynamicImage;
use base64::{Engine as _, engine::general_purpose};

/// Validate and decode base64 image data
pub fn decode_base64_image(encoded: &str) -> Result<DynamicImage, String> {
    let bytes = general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| format!("Invalid base64: {}", e))?;
    
    image::load_from_memory(&bytes)
        .map_err(|e| format!("Image decoding failed: {}", e))
}

/// Convert image to RGB8 format if needed
pub fn ensure_rgb8(image: DynamicImage) -> DynamicImage {
    image.to_rgb8().into()
}