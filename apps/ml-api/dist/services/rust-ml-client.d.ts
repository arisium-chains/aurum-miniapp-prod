import { FaceDetectionResult, FaceEmbeddingResult, HealthCheckResult } from "../types";
declare class RustMLClient {
    private faceDetectionService;
    private faceEmbeddingService;
    private timeout;
    constructor();
    detectFaces(imageBase64: string): Promise<FaceDetectionResult[]>;
    extractEmbedding(imageBase64: string, aligned?: boolean): Promise<FaceEmbeddingResult>;
    healthCheck(): Promise<HealthCheckResult>;
}
export declare const rustMLClient: RustMLClient;
export {};
//# sourceMappingURL=rust-ml-client.d.ts.map