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
export declare function processImage(imagePath: string): Promise<{
    score: number;
    vibe: string;
    rank: number;
}>;
//# sourceMappingURL=scorer.d.ts.map