import { NextRequest, NextResponse } from 'next/server';
import { aiMiddleware } from '@/middleware/aiProtection';

interface RawScoreResult {
  attractiveness: number;
  authenticity: number;
  photo_quality: number;
  style_rating: number;
  composite_score: number;
  confidence: number;
  processing_time: number;
  golden_ratio_analysis?: {
    overall_adherence: number;
    dominant_ratio: string;
    measurements: Record<string, number>;
    improvements: string[];
    confidence: number;
  };
}

interface InterpreterResult extends RawScoreResult {
  interpreter_analysis: {
    ai_detection: {
      is_ai_generated: boolean;
      confidence: number;
      indicators: string[];
      detection_method: string;
    };
    filter_detection: {
      filter_level: 'none' | 'light' | 'moderate' | 'heavy';
      confidence: number;
      detected_filters: string[];
      authenticity_impact: number;
    };
    geometric_analysis: {
      distortion_detected: boolean;
      distortion_type?: string;
      severity: number;
      affected_regions: string[];
    };
    texture_analysis: {
      skin_smoothing: number;
      artificial_enhancement: number;
      texture_consistency: number;
    };
    human_perception_adjustments: {
      raw_composite: number;
      adjusted_composite: number;
      adjustment_reason: string;
      confidence_modifier: number;
    };
    final_verdict: {
      should_adjust: boolean;
      adjustment_factor: number;
      reasoning: string[];
    };
  };
}

// AI Detection using statistical analysis
function detectAIGeneration(
  imageBase64: string,
  rawScores: RawScoreResult
): {
  is_ai_generated: boolean;
  confidence: number;
  indicators: string[];
  detection_method: string;
} {
  const indicators: string[] = [];
  let aiScore = 0;
  const imageSize = imageBase64.length;

  // Statistical impossibility detection
  if (rawScores.golden_ratio_analysis) {
    const measurements = Object.values(
      rawScores.golden_ratio_analysis.measurements
    );
    const perfectCount = measurements.filter(m => m > 95).length;
    const veryGoodCount = measurements.filter(m => m > 85).length;

    // Too many perfect measurements
    if (perfectCount >= 6) {
      aiScore += 40;
      indicators.push('Unrealistically perfect facial proportions');
    } else if (veryGoodCount >= 8) {
      aiScore += 25;
      indicators.push('Suspiciously high proportion scores');
    }

    // Uniform distribution (AI tends to generate consistent quality)
    const variance =
      measurements.reduce((acc, val, _, arr) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return acc + Math.pow(val - mean, 2);
      }, 0) / measurements.length;

    if (variance < 50) {
      // Very low variance
      aiScore += 20;
      indicators.push('Unusually uniform facial measurements');
    }
  }

  // File characteristics analysis
  if (imageSize < 15000) {
    aiScore += 15;
    indicators.push('Suspiciously small file size for quality');
  }

  // Score pattern analysis
  if (rawScores.style_rating > 85 && rawScores.authenticity > 90) {
    aiScore += 30;
    indicators.push('Impossible combination: high style + high authenticity');
  }

  // Confidence vs quality mismatch
  if (rawScores.confidence > 0.95 && rawScores.photo_quality < 60) {
    aiScore += 25;
    indicators.push('High confidence despite poor quality (AI artifact)');
  }

  const isAI = aiScore > 60;
  const confidence = Math.min(0.95, aiScore / 100);

  return {
    is_ai_generated: isAI,
    confidence: Math.round(confidence * 100) / 100,
    indicators,
    detection_method: 'statistical_analysis',
  };
}

// Filter Detection using authenticity correlation
function detectFilters(
  imageBase64: string,
  rawScores: RawScoreResult
): {
  filter_level: 'none' | 'light' | 'moderate' | 'heavy';
  confidence: number;
  detected_filters: string[];
  authenticity_impact: number;
} {
  const detectedFilters: string[] = [];
  let filterScore = 0;

  // Authenticity vs attractiveness mismatch
  const authAttrRatio = rawScores.authenticity / rawScores.attractiveness;
  if (authAttrRatio < 0.7) {
    filterScore += 30;
    detectedFilters.push('Beauty enhancement filters');
  } else if (authAttrRatio < 0.8) {
    filterScore += 15;
    detectedFilters.push('Light smoothing filters');
  }

  // Style vs authenticity mismatch
  if (rawScores.style_rating > 75 && rawScores.authenticity < 70) {
    filterScore += 25;
    detectedFilters.push('Style enhancement filters');
  }

  // Golden ratio too perfect
  if (rawScores.golden_ratio_analysis) {
    const overallAdherence = rawScores.golden_ratio_analysis.overall_adherence;
    if (overallAdherence > 85 && rawScores.authenticity < 75) {
      filterScore += 20;
      detectedFilters.push('Facial proportion enhancement');
    }
  }

  // Quality vs authenticity analysis
  if (rawScores.photo_quality > 80 && rawScores.authenticity < 60) {
    filterScore += 20;
    detectedFilters.push('Artificial quality enhancement');
  }

  let filterLevel: 'none' | 'light' | 'moderate' | 'heavy' = 'none';
  if (filterScore > 60) filterLevel = 'heavy';
  else if (filterScore > 40) filterLevel = 'moderate';
  else if (filterScore > 20) filterLevel = 'light';

  const confidence = Math.min(0.95, filterScore / 70);
  const authenticityImpact = filterScore * 0.5; // How much to reduce authenticity

  return {
    filter_level: filterLevel,
    confidence: Math.round(confidence * 100) / 100,
    detected_filters: detectedFilters,
    authenticity_impact: Math.round(authenticityImpact * 10) / 10,
  };
}

// Geometric Distortion Detection
function detectGeometricDistortion(rawScores: RawScoreResult): {
  distortion_detected: boolean;
  distortion_type?: string;
  severity: number;
  affected_regions: string[];
} {
  const affectedRegions: string[] = [];
  let distortionScore = 0;
  let distortionType: string | undefined;

  if (rawScores.golden_ratio_analysis) {
    const measurements = rawScores.golden_ratio_analysis.measurements;

    // Check for wide-angle lens distortion
    if (measurements.face_ratio && measurements.face_ratio < 30) {
      distortionScore += 40;
      distortionType = 'wide_angle_distortion';
      affectedRegions.push('overall_face_shape');
    }

    // Check for perspective distortion
    if (measurements.jaw_temple_ratio && measurements.jaw_temple_ratio > 90) {
      distortionScore += 30;
      distortionType = 'perspective_distortion';
      affectedRegions.push('jaw_line');
    }

    // Check for eye asymmetry indicating camera angle issues
    if (measurements.vertical_symmetry && measurements.vertical_symmetry < 40) {
      distortionScore += 25;
      if (!distortionType) distortionType = 'camera_angle_distortion';
      affectedRegions.push('eye_region');
    }

    // Nose distortion from close-up shots
    if (measurements.nose_ratio && measurements.nose_ratio > 85) {
      distortionScore += 20;
      if (!distortionType) distortionType = 'close_up_distortion';
      affectedRegions.push('nose_region');
    }
  }

  const distortionDetected = distortionScore > 30;
  const severity = Math.min(100, distortionScore) / 100;

  return {
    distortion_detected: distortionDetected,
    distortion_type: distortionType,
    severity: Math.round(severity * 100) / 100,
    affected_regions: affectedRegions,
  };
}

// Texture Analysis
function analyzeTexture(
  imageBase64: string,
  rawScores: RawScoreResult
): {
  skin_smoothing: number;
  artificial_enhancement: number;
  texture_consistency: number;
} {
  const imageSize = imageBase64.length;

  // Skin smoothing detection based on quality vs authenticity
  let skinSmoothing = 0;
  if (rawScores.photo_quality > 70 && rawScores.authenticity < 60) {
    skinSmoothing = (rawScores.photo_quality - rawScores.authenticity) * 1.2;
  }

  // Artificial enhancement based on style vs authenticity
  let artificialEnhancement = 0;
  if (rawScores.style_rating > rawScores.authenticity + 20) {
    artificialEnhancement =
      (rawScores.style_rating - rawScores.authenticity) * 0.8;
  }

  // Texture consistency based on file size and quality correlation
  let textureConsistency = 75; // Base consistency
  if (imageSize < 20000 && rawScores.photo_quality > 80) {
    textureConsistency -= 30; // Small file + high quality = suspicious
  }
  if (rawScores.confidence < 0.8) {
    textureConsistency -= 20; // Low confidence indicates texture issues
  }

  return {
    skin_smoothing: Math.min(
      100,
      Math.max(0, Math.round(skinSmoothing * 10) / 10)
    ),
    artificial_enhancement: Math.min(
      100,
      Math.max(0, Math.round(artificialEnhancement * 10) / 10)
    ),
    texture_consistency: Math.min(
      100,
      Math.max(0, Math.round(textureConsistency * 10) / 10)
    ),
  };
}

// Human Perception Adjustments
function calculateHumanPerceptionAdjustments(
  rawScores: RawScoreResult,
  aiDetection: any,
  filterDetection: any,
  geometricAnalysis: any,
  textureAnalysis: any
): {
  raw_composite: number;
  adjusted_composite: number;
  adjustment_reason: string;
  confidence_modifier: number;
} {
  let adjustedScore = rawScores.composite_score;
  let confidenceModifier = 0;
  const reasons: string[] = [];

  // AI Detection penalties
  if (aiDetection.is_ai_generated && aiDetection.confidence > 0.7) {
    adjustedScore *= 0.6; // Heavy penalty for AI
    confidenceModifier -= 0.2;
    reasons.push('AI-generated content detected');
  }

  // Filter Detection adjustments
  switch (filterDetection.filter_level) {
    case 'heavy':
      adjustedScore *= 0.7;
      confidenceModifier -= 0.15;
      reasons.push('Heavy filtering detected');
      break;
    case 'moderate':
      adjustedScore *= 0.85;
      confidenceModifier -= 0.1;
      reasons.push('Moderate filtering detected');
      break;
    case 'light':
      adjustedScore *= 0.95;
      confidenceModifier -= 0.05;
      reasons.push('Light filtering detected');
      break;
  }

  // Geometric distortion penalties
  if (
    geometricAnalysis.distortion_detected &&
    geometricAnalysis.severity > 0.3
  ) {
    adjustedScore *= 1 - geometricAnalysis.severity * 0.3;
    confidenceModifier -= geometricAnalysis.severity * 0.1;
    reasons.push(`Geometric distortion: ${geometricAnalysis.distortion_type}`);
  }

  // Texture analysis adjustments
  if (textureAnalysis.skin_smoothing > 50) {
    adjustedScore *= 0.9;
    reasons.push('Excessive skin smoothing detected');
  }

  if (textureAnalysis.artificial_enhancement > 60) {
    adjustedScore *= 0.85;
    reasons.push('Artificial enhancement detected');
  }

  // Edge case: Professional photo protection
  if (
    rawScores.composite_score > 90 &&
    rawScores.authenticity > 85 &&
    rawScores.photo_quality > 85 &&
    !aiDetection.is_ai_generated
  ) {
    // Protect high-quality authentic photos from over-adjustment
    const protectionFactor = Math.min(
      1.1,
      adjustedScore / rawScores.composite_score + 0.1
    );
    adjustedScore = rawScores.composite_score * protectionFactor;
    reasons.push('Professional photo protection applied');
  }

  // Bounds checking
  adjustedScore = Math.min(98, Math.max(5, adjustedScore));
  confidenceModifier = Math.max(-0.3, Math.min(0.1, confidenceModifier));

  return {
    raw_composite: rawScores.composite_score,
    adjusted_composite: Math.round(adjustedScore * 10) / 10,
    adjustment_reason: reasons.join('; ') || 'No adjustments needed',
    confidence_modifier: Math.round(confidenceModifier * 100) / 100,
  };
}

// Main interpreter function
async function interpretFacialScore(
  imageBase64: string
): Promise<InterpreterResult> {
  // Import and use the raw scoring function directly to avoid HTTP calls
  const { POST: rawScoreHandler } = await import('../score/route');

  // Create a mock request object
  const mockRequest = {
    json: async () => ({ image: imageBase64, scenario: null }),
  } as NextRequest;

  const rawResponse = await rawScoreHandler(mockRequest);
  const rawResult = await rawResponse.json();

  if (!rawResult.success) {
    throw new Error(rawResult.message || 'Raw scoring failed');
  }

  const rawScores: RawScoreResult = rawResult.data;

  // Run interpreter analysis
  const aiDetection = detectAIGeneration(imageBase64, rawScores);
  const filterDetection = detectFilters(imageBase64, rawScores);
  const geometricAnalysis = detectGeometricDistortion(rawScores);
  const textureAnalysis = analyzeTexture(imageBase64, rawScores);

  // Calculate human perception adjustments
  const humanAdjustments = calculateHumanPerceptionAdjustments(
    rawScores,
    aiDetection,
    filterDetection,
    geometricAnalysis,
    textureAnalysis
  );

  // Determine final verdict
  const shouldAdjust =
    Math.abs(
      humanAdjustments.adjusted_composite - humanAdjustments.raw_composite
    ) > 2;
  const adjustmentFactor =
    humanAdjustments.adjusted_composite / humanAdjustments.raw_composite;

  const reasoning: string[] = [];
  if (aiDetection.is_ai_generated) reasoning.push('AI generation detected');
  if (filterDetection.filter_level !== 'none')
    reasoning.push(`${filterDetection.filter_level} filtering`);
  if (geometricAnalysis.distortion_detected)
    reasoning.push('Geometric distortion');
  if (textureAnalysis.skin_smoothing > 40)
    reasoning.push('Texture manipulation');

  // Apply adjustments to raw scores
  const finalResult: InterpreterResult = {
    ...rawScores,
    composite_score: humanAdjustments.adjusted_composite,
    authenticity: Math.max(
      5,
      rawScores.authenticity - filterDetection.authenticity_impact
    ),
    confidence: Math.max(
      0.5,
      Math.min(
        0.98,
        rawScores.confidence + humanAdjustments.confidence_modifier
      )
    ),
    interpreter_analysis: {
      ai_detection: aiDetection,
      filter_detection: filterDetection,
      geometric_analysis: geometricAnalysis,
      texture_analysis: textureAnalysis,
      human_perception_adjustments: humanAdjustments,
      final_verdict: {
        should_adjust: shouldAdjust,
        adjustment_factor: Math.round(adjustmentFactor * 100) / 100,
        reasoning:
          reasoning.length > 0 ? reasoning : ['No significant issues detected'],
      },
    },
  };

  return finalResult;
}

export async function POST(request: NextRequest) {
  // Apply AI protection middleware
  const middlewareResponse = await aiMiddleware(request);
  if (middlewareResponse) {
    return middlewareResponse;
  }

  try {
    const body = await request.json();
    const { image, format } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          message: 'No image provided',
        },
        { status: 400 }
      );
    }

    // Validate base64 format
    if (!image.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid image format',
        },
        { status: 400 }
      );
    }

    // Size validation
    if (image.length < 1000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Image too small for analysis',
        },
        { status: 400 }
      );
    }

    if (image.length > 2000000) {
      // ~2MB limit for base64
      return NextResponse.json(
        {
          success: false,
          message: 'Image too large for processing',
        },
        { status: 400 }
      );
    }

    // Process with interpreter
    const interpreterResult = await interpretFacialScore(image);

    return NextResponse.json({
      success: true,
      data: interpreterResult,
      message: 'Image analyzed with interpreter layer',
      debug: {
        imageSize: image.length,
        interpreter_version: '1.0.0',
        processing_pipeline:
          'raw_scoring -> ai_detection -> filter_analysis -> geometric_check -> texture_analysis -> human_adjustment',
      },
    });
  } catch (error: any) {
    console.error('Interpreter error:', error);

    // Handle specific error types
    if (error.message.includes('Raw scoring failed')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to analyze image. Please try a different photo.',
          error_type: 'raw_scoring_failure',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error during interpretation',
        error_type: 'interpreter_failure',
      },
      { status: 500 }
    );
  }
}
