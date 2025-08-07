"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rustMLClient = void 0;
const axios_1 = __importDefault(require("axios"));
class RustMLClient {
    constructor() {
        this.faceDetectionService =
            process.env.FACE_DETECTION_SERVICE || "http://localhost:8001";
        this.faceEmbeddingService =
            process.env.FACE_EMBEDDING_SERVICE || "http://localhost:8002";
        this.timeout = parseInt(process.env.ML_SERVICE_TIMEOUT || "5000");
    }
    async detectFaces(imageBase64) {
        try {
            const response = await axios_1.default.post(`${this.faceDetectionService}/detect`, {
                image_base64: imageBase64,
            }, {
                timeout: this.timeout,
            });
            if (response.data.faces) {
                return response.data.faces;
            }
            else {
                throw new Error(response.data.message || "Face detection failed");
            }
        }
        catch (error) {
            console.error("Face detection error:", error.message);
            throw error;
        }
    }
    async extractEmbedding(imageBase64, aligned = false) {
        try {
            // For now, we'll use the same endpoint but this should be updated to use the face-embedding service
            const response = await axios_1.default.post(`${this.faceDetectionService}/detect`, // This should be updated to the face-embedding service URL
            {
                image_base64: imageBase64,
                aligned: aligned,
            }, {
                timeout: this.timeout,
            });
            if (response.data.faces && response.data.faces.length > 0) {
                // In a real implementation, this would return actual embedding data
                // For now, we'll return mock data with the structure we expect
                return {
                    embedding: Array(512)
                        .fill(0)
                        .map(() => Math.random()),
                    quality: 0.95,
                    confidence: 0.98,
                };
            }
            else {
                throw new Error(response.data.message || "Embedding extraction failed");
            }
        }
        catch (error) {
            console.error("Embedding extraction error:", error.message);
            throw error;
        }
    }
    async healthCheck() {
        try {
            const detectionHealth = await axios_1.default.get(`${this.faceDetectionService}/health`);
            // For now, we'll assume the embedding service is at the same location
            // This should be updated to use the actual face-embedding service
            const embeddingHealth = await axios_1.default.get(`${this.faceDetectionService}/health` // This should be updated to the face-embedding service URL
            );
            return {
                status: "healthy",
                services: {
                    faceDetection: detectionHealth.data,
                    faceEmbedding: embeddingHealth.data,
                },
            };
        }
        catch (error) {
            return {
                status: "unhealthy",
                error: error.message,
            };
        }
    }
}
exports.rustMLClient = new RustMLClient();
//# sourceMappingURL=rust-ml-client.js.map