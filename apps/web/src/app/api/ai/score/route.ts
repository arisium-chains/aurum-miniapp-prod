import { NextRequest, NextResponse } from 'next/server'
import { aiMiddleware } from '@/middleware/aiProtection'

interface ScoreResult {
  attractiveness: number
  authenticity: number
  photo_quality: number
  style_rating: number
  composite_score: number
  confidence: number
  processing_time: number
  golden_ratio_analysis?: {
    overall_adherence: number
    dominant_ratio: string
    measurements: {
      facial_thirds: number
      face_ratio: number
      eye_spacing: number
      nose_ratio: number
      lip_nose_ratio: number
      eye_brow_ratio: number
      lower_face_ratio: number
    }
    improvements: string[]
    confidence: number
  }
}

// Golden ratio constant (φ = 1.618...)
const GOLDEN_RATIO = 1.618033988749895

// Simulate basic image analysis based on file characteristics
function analyzeImageCharacteristics(imageBase64: string) {
  // Simple heuristics based on image data patterns
  const imageSize = imageBase64.length
  const hasHighEntropy = imageBase64.includes('JFIF') || imageSize > 50000
  const hasLowEntropy = imageSize < 10000
  const hasComplexPatterns = (imageBase64.match(/[A-Z]/g) || []).length > imageBase64.length * 0.3
  
  return {
    estimatedQuality: hasHighEntropy ? 'high' : hasLowEntropy ? 'low' : 'medium',
    estimatedComplexity: hasComplexPatterns ? 'high' : 'low',
    fileSize: imageSize,
    hasArtifacts: imageSize < 5000, // Very small files likely have compression artifacts
    goldenRatioAnalysis: simulateGoldenRatioAnalysis(imageBase64)
  }
}

// Hard rejection layer for abnormal facial structures
function checkFacialPlausibility(goldenRatioAnalysis: any): { valid: boolean, reason?: string } {
  const measurements = goldenRatioAnalysis.measurements
  
  // Very relaxed thresholds - only reject completely impossible measurements
  const EXTREME_THRESHOLDS = {
    facialThirds: { min: 5, max: 99 },      // Extremely wide tolerance
    faceRatio: { min: 3, max: 99 },         // Extremely wide tolerance
    eyeSpacing: { min: 5, max: 99 },        // Extremely wide tolerance
    noseRatio: { min: 2, max: 99 },         // Extremely wide tolerance
    lipNoseRatio: { min: 5, max: 99 },      // Extremely wide tolerance
    eyeBrowRatio: { min: 5, max: 99 },      // Extremely wide tolerance
    lowerFaceRatio: { min: 5, max: 99 },    // Extremely wide tolerance
    jawToTempleRatio: { min: 5, max: 99 },  // Extremely wide tolerance
    irisToEyeRatio: { min: 2, max: 99 },    // Extremely wide tolerance
    verticalSymmetry: { min: 10, max: 100 }, // Allow perfect symmetry
    cheekboneRatio: { min: 5, max: 99 }     // Extremely wide tolerance
  }
  
  // Check for extreme distortions
  for (const [measurement, value] of Object.entries(measurements)) {
    const threshold = EXTREME_THRESHOLDS[measurement as keyof typeof EXTREME_THRESHOLDS]
    if (threshold && (value < threshold.min || value > threshold.max)) {
      return { 
        valid: false, 
        reason: `Facial structure outside scoring bounds: ${measurement} deviation too extreme (${value.toFixed(1)}%)` 
      }
    }
  }
  
  // Check for multiple poor measurements (extremely rare cases only)
  const poorMeasurements = Object.values(measurements).filter((value: any) => value < 10).length
  if (poorMeasurements >= 8) { // Almost impossible to trigger
    return { 
      valid: false, 
      reason: "Multiple facial proportions severely distorted - likely corrupted image data" 
    }
  }
  
  // Essentially disable perfect measurement rejection for high-quality photos
  const perfectMeasurements = Object.values(measurements).filter((value: any) => value >= 99).length
  if (perfectMeasurements >= 11) { // All measurements must be exactly 99%+ (impossible with our scoring)
    return { 
      valid: false, 
      reason: "Facial proportions unrealistically perfect - likely synthetic image" 
    }
  }
  
  return { valid: true }
}

// Simulate golden ratio facial proportion analysis
function simulateGoldenRatioAnalysis(imageBase64: string) {
  // Generate realistic golden ratio measurements with variance
  const baseAccuracy = 0.75 + Math.random() * 0.2 // 75-95% base accuracy
  
  // Key facial proportions based on golden ratio + additional geometric ratios
  const measurements = {
    // Facial thirds (forehead:mid-face:lower-face should approach 1:φ:1)
    facialThirds: generateProportionScore(1.4, 1.8, GOLDEN_RATIO), // Target φ
    
    // Face width to height ratio (ideal ~1.618)
    faceRatio: generateProportionScore(1.3, 2.0, GOLDEN_RATIO),
    
    // Eye width ratio (distance between eyes should be one eye width)
    eyeSpacing: generateProportionScore(0.8, 1.4, 1.0), // Target 1:1:1
    
    // Nose width to face width (ideal ~1/5 of face width)
    noseRatio: generateProportionScore(0.15, 0.25, 0.2), // Target 1/5
    
    // Lip width to nose width (ideal φ ratio)
    lipNoseRatio: generateProportionScore(1.2, 2.0, GOLDEN_RATIO),
    
    // Eye to eyebrow distance vs eye height (ideal φ)
    eyeBrowRatio: generateProportionScore(1.2, 2.2, GOLDEN_RATIO),
    
    // Chin to lip vs lip to nose (ideal φ)
    lowerFaceRatio: generateProportionScore(1.3, 2.0, GOLDEN_RATIO),
    
    // Additional geometric ratios for better distortion detection
    jawToTempleRatio: generateProportionScore(0.6, 1.0, 0.8), // Jaw width vs temple width
    irisToEyeRatio: generateProportionScore(0.3, 0.5, 0.4),   // Iris width vs eye width
    verticalSymmetry: generateProportionScore(0.85, 1.0, 0.95), // Left vs right face symmetry
    cheekboneRatio: generateProportionScore(1.1, 1.5, 1.3)   // Cheekbone width vs jaw width
  }
  
  // Calculate overall golden ratio adherence
  const ratioScores = Object.values(measurements)
  const averageAdherence = ratioScores.reduce((sum, score) => sum + score, 0) / ratioScores.length
  
  return {
    measurements,
    overallAdherence: averageAdherence,
    confidence: baseAccuracy,
    dominantRatio: getBestRatio(measurements),
    improvement: getSuggestedImprovements(measurements)
  }
}

// Generate proportion score with realistic distribution across image types
function generateProportionScore(minRange: number, maxRange: number, idealRatio: number): number {
  // Realistic variance for natural scoring distribution
  const measuredRatio = idealRatio + (Math.random() - 0.5) * 0.5 // ±0.25 variance
  
  // Calculate deviation from ideal ratio
  const deviation = Math.abs(measuredRatio - idealRatio) / idealRatio
  const rawScore = (1 - deviation) * 100
  
  // Natural curve - no artificial amplification
  let score = rawScore
  
  // Slight boost for very good ratios, but keep it realistic
  if (rawScore > 85) {
    score = rawScore + (rawScore - 85) * 0.3 // Small boost for excellent ratios
  }
  
  // Full range scoring: 25-92% to create proper differentiation
  return Math.round(Math.max(25, Math.min(92, score)) * 10) / 10
}

// Determine which facial proportion best follows golden ratio
function getBestRatio(measurements: any): string {
  const ratioNames = Object.keys(measurements)
  const ratioScores = Object.values(measurements) as number[]
  
  const maxScore = Math.max(...ratioScores)
  const bestRatioIndex = ratioScores.indexOf(maxScore)
  
  const ratioDescriptions: {[key: string]: string} = {
    facialThirds: 'Facial thirds harmony',
    faceRatio: 'Face width-to-height proportion',
    eyeSpacing: 'Eye spacing symmetry', 
    noseRatio: 'Nose width proportion',
    lipNoseRatio: 'Lip-to-nose ratio',
    eyeBrowRatio: 'Eye-to-eyebrow spacing',
    lowerFaceRatio: 'Lower face proportions'
  }
  
  return ratioDescriptions[ratioNames[bestRatioIndex]] || 'Overall facial harmony'
}

// Generate improvement suggestions based on golden ratio analysis
function getSuggestedImprovements(measurements: any): string[] {
  const suggestions: string[] = []
  
  if (measurements.facialThirds < 70) {
    suggestions.push('Consider angles that better showcase facial thirds')
  }
  if (measurements.eyeSpacing < 65) {
    suggestions.push('Eye spacing could benefit from different camera angle')
  }
  if (measurements.faceRatio < 60) {
    suggestions.push('Face proportions might improve with portrait orientation')
  }
  if (measurements.lipNoseRatio < 65) {
    suggestions.push('Lower face proportions could be enhanced with better lighting')
  }
  
  return suggestions.length > 0 ? suggestions : ['Excellent golden ratio adherence across all measurements']
}

// Enhanced scoring algorithm with realistic variance patterns
function generateMockScore(imageBase64: string, scenario?: string): ScoreResult {
  const analysis = analyzeImageCharacteristics(imageBase64)
  
  // Check facial plausibility before scoring
  const plausibilityCheck = checkFacialPlausibility(analysis.goldenRatioAnalysis)
  if (!plausibilityCheck.valid) {
    console.log('Facial plausibility rejection:', plausibilityCheck.reason, 'Measurements:', analysis.goldenRatioAnalysis.measurements)
    throw new Error(plausibilityCheck.reason || "Facial structure outside scoring bounds")
  }
  
  // Different scoring profiles based on image characteristics and scenario
  const scoreProfile = getScoreProfile(analysis, scenario)
  
  // Generate base scores with golden ratio integration
  const attractiveness = generateAttractivenessScore(analysis, scoreProfile.attractiveness)
  const photo_quality = generateQualityScore(analysis, scoreProfile.quality)
  const authenticity = generateAuthenticityScore(analysis, scoreProfile.authenticity)
  const style_rating = generateCorrelatedScore(scoreProfile.style, 15, 80, attractiveness * 0.3)
  
  // Rebalanced weights: prioritize natural structure over style
  let composite_score = (
    attractiveness * 0.50 +  // Increased from 35% to 50%
    authenticity * 0.30 +    // Increased from 25% to 30%
    photo_quality * 0.15 +   // Decreased from 25% to 15%
    style_rating * 0.05      // Decreased from 15% to 5%
  )
  
  // Very minimal score caps - only for extremely poor images
  if (photo_quality < 15 || authenticity < 30) {
    composite_score = Math.min(composite_score, 75) // Higher cap, only for very poor images
  }
  
  // Cap only obvious fake/generated images
  if (authenticity < 25 && style_rating > 90) {
    composite_score = Math.min(composite_score, 65) // Cap only obvious fakes
  }
  
  // More generous confidence calculation
  const scoreVariance = calculateScoreVariance([attractiveness, photo_quality, style_rating])
  const confidence = Math.max(0.75, Math.min(0.98, 0.90 - (scoreVariance / 120))) // Higher base, lower variance impact
  
  const processing_time = 1.2 + Math.random() * 2.5 + (analysis.fileSize / 100000) // Larger files take longer

  return {
    attractiveness: Math.round(attractiveness * 10) / 10,
    authenticity: Math.round(authenticity * 10) / 10,
    photo_quality: Math.round(photo_quality * 10) / 10,
    style_rating: Math.round(style_rating * 10) / 10,
    composite_score: Math.round(composite_score * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    processing_time: Math.round(processing_time * 100) / 100,
    golden_ratio_analysis: {
      overall_adherence: Math.round(analysis.goldenRatioAnalysis.overallAdherence * 10) / 10,
      dominant_ratio: analysis.goldenRatioAnalysis.dominantRatio,
      measurements: {
        facial_thirds: Math.round(analysis.goldenRatioAnalysis.measurements.facialThirds * 10) / 10,
        face_ratio: Math.round(analysis.goldenRatioAnalysis.measurements.faceRatio * 10) / 10,
        eye_spacing: Math.round(analysis.goldenRatioAnalysis.measurements.eyeSpacing * 10) / 10,
        nose_ratio: Math.round(analysis.goldenRatioAnalysis.measurements.noseRatio * 10) / 10,
        lip_nose_ratio: Math.round(analysis.goldenRatioAnalysis.measurements.lipNoseRatio * 10) / 10,
        eye_brow_ratio: Math.round(analysis.goldenRatioAnalysis.measurements.eyeBrowRatio * 10) / 10,
        lower_face_ratio: Math.round(analysis.goldenRatioAnalysis.measurements.lowerFaceRatio * 10) / 10,
        jaw_temple_ratio: Math.round(analysis.goldenRatioAnalysis.measurements.jawToTempleRatio * 10) / 10,
        iris_eye_ratio: Math.round(analysis.goldenRatioAnalysis.measurements.irisToEyeRatio * 10) / 10,
        vertical_symmetry: Math.round(analysis.goldenRatioAnalysis.measurements.verticalSymmetry * 10) / 10,
        cheekbone_ratio: Math.round(analysis.goldenRatioAnalysis.measurements.cheekboneRatio * 10) / 10
      },
      improvements: analysis.goldenRatioAnalysis.improvement,
      confidence: Math.round(analysis.goldenRatioAnalysis.confidence * 100) / 100
    }
  }
}

function getScoreProfile(analysis: any, scenario?: string) {
  // Enhanced high-quality profile to push excellent photos to 95-98%
  if (scenario === 'high_quality') {
    return {
      attractiveness: { base: 82, variance: 10 },  // Higher base for professional photos
      quality: { base: 92, variance: 6 },          // Very high technical quality
      authenticity: { base: 94, variance: 5 },     // Very high authenticity
      style: { base: 86, variance: 8 }             // High professional styling
    }
  } else if (scenario === 'low_quality') {
    return {
      attractiveness: { base: 25, variance: 15 },  // Much lower for poor photos
      quality: { base: 20, variance: 15 },         // Very poor technical quality
      authenticity: { base: 60, variance: 20 },    // Lower authenticity
      style: { base: 20, variance: 15 }            // Poor styling
    }
  } else if (scenario === 'filtered') {
    return {
      attractiveness: { base: 80, variance: 15 },
      quality: { base: 60, variance: 20 },
      authenticity: { base: 45, variance: 30 }, // Lower authenticity for filtered
      style: { base: 85, variance: 15 }
    }
  } else if (scenario === 'group_photo') {
    return {
      attractiveness: { base: 55, variance: 35 },
      quality: { base: 50, variance: 30 },
      authenticity: { base: 85, variance: 15 },
      style: { base: 60, variance: 25 }
    }
  }
  
  // Default profile based on image analysis (more discriminating)
  const qualityMultiplier = analysis.estimatedQuality === 'high' ? 1.4 : 
                           analysis.estimatedQuality === 'low' ? 0.5 : 0.8  // More harsh for low quality
  
  return {
    attractiveness: { base: 45 * qualityMultiplier, variance: 25 },
    quality: { base: 50 * qualityMultiplier, variance: 25 },
    authenticity: { base: 75, variance: 20 },
    style: { base: 50 * qualityMultiplier, variance: 25 }
  }
}

// Golden ratio-based attractiveness scoring (optimized for high-quality photos)
function generateAttractivenessScore(analysis: any, profile: {base: number, variance: number}): number {
  const goldenRatioAnalysis = analysis.goldenRatioAnalysis
  
  // Enhanced golden ratio bonuses for professional photos
  const goldenRatioBonus = (goldenRatioAnalysis.overallAdherence - 45) * 0.8 // More generous bonus
  let attractivenessScore = profile.base + goldenRatioBonus
  
  // Generous bonuses for good ratios (favoring professional photos)
  const measurements = goldenRatioAnalysis.measurements
  if (measurements.facialThirds > 75) attractivenessScore += 8  // Lower threshold, higher bonus
  if (measurements.faceRatio > 80) attractivenessScore += 7     // Lower threshold, higher bonus
  if (measurements.eyeSpacing > 75) attractivenessScore += 6    // Lower threshold, higher bonus
  if (measurements.verticalSymmetry > 80) attractivenessScore += 5 // Lower threshold, higher bonus
  
  // More significant penalties for poor ratios
  if (measurements.facialThirds < 40) attractivenessScore -= 12 // Stronger penalty
  if (measurements.faceRatio < 35) attractivenessScore -= 10    // Stronger penalty
  if (measurements.eyeSpacing < 40) attractivenessScore -= 8    // New penalty
  if (measurements.verticalSymmetry < 50) attractivenessScore -= 6 // Asymmetry penalty
  
  // Minimal randomness for more consistent high scores
  const randomComponent = (Math.random() - 0.5) * (profile.variance * 0.5) // Further reduced randomness
  attractivenessScore += randomComponent
  
  // Enhanced quality multiplier favoring professional photos
  const qualityMultiplier = analysis.estimatedQuality === 'high' ? 1.25 :  // Higher bonus for high quality
                           analysis.estimatedQuality === 'medium' ? 0.85 : // Penalty for medium
                           0.65  // Strong penalty for low quality
  attractivenessScore *= qualityMultiplier
  
  // Higher ceiling for professional photos
  return Math.min(98, Math.max(12, Math.round(attractivenessScore * 10) / 10))
}

function generateCorrelatedScore(profile: {base: number, variance: number}, min: number = 5, max: number = 95, correlation: number = 0): number {
  const randomComponent = (Math.random() - 0.5) * profile.variance
  const correlatedComponent = correlation || 0
  const score = profile.base + randomComponent + correlatedComponent
  return Math.min(max, Math.max(min, score))
}

function generateQualityScore(analysis: any, profile: {base: number, variance: number}): number {
  let qualityScore = profile.base
  
  // Enhanced quality bonuses for professional photos
  if (analysis.hasArtifacts) qualityScore -= 20  // Stronger penalty for artifacts
  if (analysis.estimatedQuality === 'high') qualityScore += 4   // Bonus for high quality
  if (analysis.estimatedQuality === 'low') qualityScore -= 30   // Stronger penalty
  
  // Better bonuses for large file sizes (professional photo indicators)
  if (analysis.fileSize > 60000) qualityScore += 2  // Professional file size
  if (analysis.fileSize > 100000) qualityScore += 3 // Very large professional file
  if (analysis.fileSize > 150000) qualityScore += 2 // Exceptional file size
  
  const randomComponent = (Math.random() - 0.5) * profile.variance
  return Math.min(98, Math.max(10, qualityScore + randomComponent))
}

function generateAuthenticityScore(analysis: any, profile: {base: number, variance: number}): number {
  let authScore = profile.base
  
  // Enhanced authenticity scoring favoring professional photos
  if (analysis.fileSize < 8000) authScore -= 15  // Penalty for small files
  if (analysis.fileSize > 60000) authScore += 2  // Professional file size
  if (analysis.fileSize > 100000) authScore += 4 // Large professional file
  if (analysis.fileSize > 150000) authScore += 3 // Very large professional file
  
  // Stronger quality correlation
  if (analysis.estimatedQuality === 'high') authScore += 4  // Higher bonus
  if (analysis.estimatedQuality === 'low') authScore -= 12  // Stronger penalty
  
  const randomComponent = (Math.random() - 0.5) * profile.variance
  return Math.min(98, Math.max(15, authScore + randomComponent))
}

function calculateScoreVariance(scores: number[]): number {
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
  return Math.sqrt(variance)
}

// Simulate processing delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  // Apply AI protection middleware
  const middlewareResponse = await aiMiddleware(request);
  if (middlewareResponse) {
    return middlewareResponse;
  }
  
  try {
    const body = await request.json()
    const { image, format, scenario } = body

    // Validate request
    if (!image) {
      return NextResponse.json({
        success: false,
        message: 'No image provided'
      }, { status: 400 })
    }

    // Basic image validation (check if it looks like base64)
    if (!image.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid image format'
      }, { status: 400 })
    }

    // Simulate face detection failure for very small images
    if (image.length < 1000) {
      return NextResponse.json({
        success: false,
        message: 'No face detected in image. Please upload a clearer portrait photo.'
      }, { status: 400 })
    }

    // Generate scores based on image characteristics and scenario
    let scoreResult: ScoreResult
    try {
      scoreResult = generateMockScore(image, scenario)
    } catch (error: any) {
      // Handle facial plausibility rejection
      console.error('Scoring error:', error.message, 'Image size:', image.length, 'Scenario:', scenario)
      return NextResponse.json({
        success: false,
        message: error.message || 'Facial analysis failed'
      }, { status: 400 })
    }
    
    // Simulate processing time based on "complexity"
    const processingDelay = scoreResult.processing_time * 1000
    await delay(processingDelay)

    // Confidence-based rejection (relaxed threshold)
    if (scoreResult.confidence < 0.65) {
      return NextResponse.json({
        success: false,
        message: 'Image quality too low for reliable scoring. Please try a clearer photo.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: scoreResult,
      message: 'Image scored successfully',
      debug: {
        imageSize: image.length,
        detectedScenario: scenario || 'auto',
        processingTime: scoreResult.processing_time
      }
    })

  } catch (error) {
    console.error('AI scoring error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during scoring'
    }, { status: 500 })
  }
}