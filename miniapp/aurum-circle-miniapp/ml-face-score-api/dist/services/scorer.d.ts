import { SimulatedMLResult } from "../types";
export declare function loadModels(): Promise<boolean>;
export declare function getMLStatus(): Promise<{
    status: string;
    models: {
        arcface: string;
        faceDetection: string;
    };
    timestamp: string;
    error?: undefined;
} | {
    status: string;
    error: any;
    timestamp: string;
    models?: undefined;
}>;
export declare function processImage(imagePath: string): Promise<SimulatedMLResult>;
export declare function processImageBase64(imageBase64: string): Promise<import("../types").ProcessedFaceResult | SimulatedMLResult>;
//# sourceMappingURL=scorer.d.ts.map