import { ProcessedFaceResult, SimulatedMLResult } from "../types";
export declare class HybridScorer {
    private useRealML;
    constructor();
    processImage(imageBase64: string): Promise<ProcessedFaceResult | SimulatedMLResult>;
    private calculateFrontality;
    private calculateSymmetry;
    private calculateResolution;
}
export declare const hybridScorer: HybridScorer;
//# sourceMappingURL=hybrid-scorer.d.ts.map