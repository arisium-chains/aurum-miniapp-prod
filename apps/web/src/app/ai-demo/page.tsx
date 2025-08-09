"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

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
      jaw_temple_ratio: number
      iris_eye_ratio: number
      vertical_symmetry: number
      cheekbone_ratio: number
    }
    improvements: string[]
    confidence: number
  }
  interpreter_analysis?: {
    ai_detection: {
      is_ai_generated: boolean
      confidence: number
      indicators: string[]
      detection_method: string
    }
    filter_detection: {
      filter_level: 'none' | 'light' | 'moderate' | 'heavy'
      confidence: number
      detected_filters: string[]
      authenticity_impact: number
    }
    geometric_analysis: {
      distortion_detected: boolean
      distortion_type?: string
      severity: number
      affected_regions: string[]
    }
    texture_analysis: {
      skin_smoothing: number
      artificial_enhancement: number
      texture_consistency: number
    }
    human_perception_adjustments: {
      raw_composite: number
      adjusted_composite: number
      adjustment_reason: string
      confidence_modifier: number
    }
    final_verdict: {
      should_adjust: boolean
      adjustment_factor: number
      reasoning: string[]
    }
  }
}

interface HistoryEntry extends ScoreResult {
  timestamp: number
}

type TestScenario = 'high_quality' | 'low_quality' | 'group_photo' | 'filtered' | null

export default function AIScoringDemoPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testScenario, setTestScenario] = useState<TestScenario>(null)
  const [useInterpreter, setUseInterpreter] = useState(false)
  const [scoringHistory, setScoringHistory] = useState<HistoryEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getScenarioDescription = (scenario: TestScenario): string => {
    switch (scenario) {
      case 'high_quality':
        return '📸 High Quality Portrait - Professional lighting, clear focus, good composition'
      case 'low_quality':
        return '📱 Casual Selfie - Phone camera, natural lighting, informal setting'
      case 'group_photo':
        return '👥 Group Photo - Multiple faces, different lighting conditions'
      case 'filtered':
        return '✨ Filtered Image - Beauty filters, enhanced colors, smoothing effects'
      default:
        return ''
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setError(null)
        setScoreResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleScoreImage = async () => {
    if (!selectedImage) return

    setIsScoring(true)
    setError(null)

    try {
      // Convert image to base64 (remove data URL prefix)
      const base64Image = selectedImage.split(',')[1]
      
      const apiEndpoint = useInterpreter ? '/api/ai/score-interpreter' : '/api/ai/score'
      const requestBody = useInterpreter 
        ? { image: base64Image, format: 'jpeg' }
        : { image: base64Image, format: 'jpeg', scenario: testScenario }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (result.success) {
        setScoreResult(result.data)
        // Add to history
        const historyEntry: HistoryEntry = {
          ...result.data,
          timestamp: Date.now()
        }
        setScoringHistory(prev => [...prev, historyEntry])
      } else {
        setError(result.message || 'Scoring failed')
      }
    } catch (error) {
      console.error('Scoring error:', error)
      setError('Failed to score image. Please try again.')
    } finally {
      setIsScoring(false)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setScoreResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const ScoreBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-sm font-bold text-text-primary">{score.toFixed(1)}</span>
      </div>
      <div className="w-full bg-border rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-text-primary font-playfair">
            🤖 AI Scoring Demo
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Test the ONNX-powered attractiveness scoring system
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Upload Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">
              📸 Upload Photo for Scoring
            </h2>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={useInterpreter}
                  onChange={(e) => setUseInterpreter(e.target.checked)}
                  className="rounded"
                />
                🧠 Advanced Interpreter
              </label>
            </div>
          </div>
          
          {useInterpreter && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-sm text-blue-400">
                <strong>🔬 Interpreter Mode:</strong> Advanced analysis with AI detection, filter analysis, geometric checks, and human perception adjustments.
              </div>
            </div>
          )}
          
          {!selectedImage ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📷</span>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Select a photo to analyze
              </h3>
              <p className="text-text-muted mb-4">
                Upload a clear portrait photo (JPG, PNG, max 5MB)
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Choose Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative w-full max-w-md mx-auto">
                <Image
                  src={selectedImage}
                  alt="Selected image"
                  width={400}
                  height={500}
                  className="w-full h-auto rounded-lg shadow-lg object-cover"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isScoring}
                >
                  Choose Different Image
                </Button>
                <Button
                  onClick={handleScoreImage}
                  disabled={isScoring}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isScoring ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    '🧠 Analyze Photo'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">❌ {error}</p>
            </div>
          )}
        </Card>

        {/* Results Section */}
        {scoreResult && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-6">
              📊 AI Analysis Results
            </h2>

            {/* Composite Score */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {scoreResult.composite_score.toFixed(0)}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-text-primary">
                Overall Score: {scoreResult.composite_score.toFixed(1)}/100
              </h3>
              <p className="text-text-muted">
                Confidence: {(scoreResult.confidence * 100).toFixed(1)}% • 
                Processed in {scoreResult.processing_time.toFixed(2)}s
              </p>
            </div>

            {/* Detailed Scores */}
            <div className="space-y-4">
              <ScoreBar 
                label="💄 Attractiveness" 
                score={scoreResult.attractiveness} 
                color="bg-gradient-to-r from-pink-500 to-rose-500"
              />
              <ScoreBar 
                label="🛡️ Authenticity" 
                score={scoreResult.authenticity} 
                color="bg-gradient-to-r from-blue-500 to-cyan-500"
              />
              <ScoreBar 
                label="📸 Photo Quality" 
                score={scoreResult.photo_quality} 
                color="bg-gradient-to-r from-green-500 to-emerald-500"
              />
              <ScoreBar 
                label="✨ Style Rating" 
                score={scoreResult.style_rating} 
                color="bg-gradient-to-r from-purple-500 to-violet-500"
              />
            </div>

            {/* Dynamic Score Interpretation */}
            <div className="mt-6 p-4 bg-card-muted rounded-lg">
              <h4 className="font-semibold text-text-primary mb-2">
                🎯 AI Analysis Insights
              </h4>
              <div className="text-sm text-text-muted space-y-2">
                {scoreResult.composite_score >= 80 && (
                  <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <strong className="text-green-400">Exceptional Score:</strong> High-quality image with strong aesthetic appeal and technical excellence.
                  </div>
                )}
                {scoreResult.composite_score >= 60 && scoreResult.composite_score < 80 && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                    <strong className="text-blue-400">Good Score:</strong> Well-balanced image with solid technical and aesthetic qualities.
                  </div>
                )}
                {scoreResult.composite_score < 60 && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <strong className="text-yellow-400">Room for Improvement:</strong> Consider better lighting, composition, or image quality.
                  </div>
                )}
                
                <div className="space-y-1 mt-3">
                  <div>
                    <strong>Attractiveness ({scoreResult.attractiveness.toFixed(1)}):</strong> {
                      scoreResult.attractiveness >= 70 ? 'Strong facial aesthetics and symmetry' :
                      scoreResult.attractiveness >= 50 ? 'Moderate aesthetic appeal' :
                      'Focus on better angles and lighting'
                    }
                  </div>
                  <div>
                    <strong>Authenticity ({scoreResult.authenticity.toFixed(1)}):</strong> {
                      scoreResult.authenticity >= 80 ? 'High confidence in natural photo' :
                      scoreResult.authenticity >= 60 ? 'Moderate processing detected' :
                      'Significant filtering or editing detected'
                    }
                  </div>
                  <div>
                    <strong>Photo Quality ({scoreResult.photo_quality.toFixed(1)}):</strong> {
                      scoreResult.photo_quality >= 70 ? 'Excellent technical quality' :
                      scoreResult.photo_quality >= 50 ? 'Good image clarity and lighting' :
                      'Consider higher resolution or better lighting'
                    }
                  </div>
                  <div>
                    <strong>Style Rating ({scoreResult.style_rating.toFixed(1)}):</strong> {
                      scoreResult.style_rating >= 70 ? 'Strong presentation and styling' :
                      scoreResult.style_rating >= 50 ? 'Good overall presentation' :
                      'Consider styling and presentation improvements'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Golden Ratio Analysis */}
            {scoreResult.golden_ratio_analysis && (
              <div className="mt-6 p-4 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 border border-amber-500/20 rounded-lg">
                <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  ✨ Golden Ratio Analysis (φ = 1.618)
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                    {scoreResult.golden_ratio_analysis.overall_adherence.toFixed(1)}% adherence
                  </span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-text-primary mb-2">Facial Proportions</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Facial Thirds</span>
                        <span className={`font-medium ${
                          scoreResult.golden_ratio_analysis.measurements.facial_thirds > 75 ? 'text-green-400' :
                          scoreResult.golden_ratio_analysis.measurements.facial_thirds > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {scoreResult.golden_ratio_analysis.measurements.facial_thirds.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Face Ratio</span>
                        <span className={`font-medium ${
                          scoreResult.golden_ratio_analysis.measurements.face_ratio > 75 ? 'text-green-400' :
                          scoreResult.golden_ratio_analysis.measurements.face_ratio > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {scoreResult.golden_ratio_analysis.measurements.face_ratio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Eye Spacing</span>
                        <span className={`font-medium ${
                          scoreResult.golden_ratio_analysis.measurements.eye_spacing > 75 ? 'text-green-400' :
                          scoreResult.golden_ratio_analysis.measurements.eye_spacing > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {scoreResult.golden_ratio_analysis.measurements.eye_spacing.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-text-primary mb-2">Feature Ratios</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Nose Proportion</span>
                        <span className={`font-medium ${
                          scoreResult.golden_ratio_analysis.measurements.nose_ratio > 75 ? 'text-green-400' :
                          scoreResult.golden_ratio_analysis.measurements.nose_ratio > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {scoreResult.golden_ratio_analysis.measurements.nose_ratio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Lip-Nose Ratio</span>
                        <span className={`font-medium ${
                          scoreResult.golden_ratio_analysis.measurements.lip_nose_ratio > 75 ? 'text-green-400' :
                          scoreResult.golden_ratio_analysis.measurements.lip_nose_ratio > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {scoreResult.golden_ratio_analysis.measurements.lip_nose_ratio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Lower Face</span>
                        <span className={`font-medium ${
                          scoreResult.golden_ratio_analysis.measurements.lower_face_ratio > 75 ? 'text-green-400' :
                          scoreResult.golden_ratio_analysis.measurements.lower_face_ratio > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {scoreResult.golden_ratio_analysis.measurements.lower_face_ratio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Jaw Structure</span>
                        <span className={`font-medium ${
                          scoreResult.golden_ratio_analysis.measurements.jaw_temple_ratio > 75 ? 'text-green-400' :
                          scoreResult.golden_ratio_analysis.measurements.jaw_temple_ratio > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {scoreResult.golden_ratio_analysis.measurements.jaw_temple_ratio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Vertical Symmetry</span>
                        <span className={`font-medium ${
                          scoreResult.golden_ratio_analysis.measurements.vertical_symmetry > 75 ? 'text-green-400' :
                          scoreResult.golden_ratio_analysis.measurements.vertical_symmetry > 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {scoreResult.golden_ratio_analysis.measurements.vertical_symmetry.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <div className="text-xs font-medium text-amber-300 mb-1">
                    🏆 Best Feature: {scoreResult.golden_ratio_analysis.dominant_ratio}
                  </div>
                  <div className="text-xs text-text-muted">
                    <strong>Suggestions:</strong>
                  </div>
                  <ul className="text-xs text-text-muted mt-1 space-y-0.5">
                    {scoreResult.golden_ratio_analysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-amber-400">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Interpreter Analysis */}
            {scoreResult?.interpreter_analysis && (
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-lg">
                <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  🧠 Advanced Interpreter Analysis
                  {scoreResult.interpreter_analysis.final_verdict.should_adjust && (
                    <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                      Score Adjusted
                    </span>
                  )}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI Detection */}
                  <div className="p-3 bg-card-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">🤖 AI Detection</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        scoreResult.interpreter_analysis.ai_detection.is_ai_generated 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {scoreResult.interpreter_analysis.ai_detection.is_ai_generated ? 'AI Generated' : 'Human Photo'}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      Confidence: {(scoreResult.interpreter_analysis.ai_detection.confidence * 100).toFixed(1)}%
                    </div>
                    {scoreResult.interpreter_analysis.ai_detection.indicators.length > 0 && (
                      <div className="mt-2 text-xs text-text-muted">
                        <div className="font-medium">Indicators:</div>
                        <ul className="space-y-0.5 mt-1">
                          {scoreResult.interpreter_analysis.ai_detection.indicators.map((indicator, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-orange-400">•</span>
                              <span>{indicator}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Filter Detection */}
                  <div className="p-3 bg-card-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">✨ Filter Analysis</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        scoreResult.interpreter_analysis.filter_detection.filter_level === 'none' 
                          ? 'bg-green-500/20 text-green-300'
                          : scoreResult.interpreter_analysis.filter_detection.filter_level === 'light'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {scoreResult.interpreter_analysis.filter_detection.filter_level}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted">
                      Confidence: {(scoreResult.interpreter_analysis.filter_detection.confidence * 100).toFixed(1)}%
                    </div>
                    {scoreResult.interpreter_analysis.filter_detection.detected_filters.length > 0 && (
                      <div className="mt-2 text-xs text-text-muted">
                        <div className="font-medium">Detected:</div>
                        <ul className="space-y-0.5 mt-1">
                          {scoreResult.interpreter_analysis.filter_detection.detected_filters.map((filter, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-purple-400">•</span>
                              <span>{filter}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Geometric Analysis */}
                  <div className="p-3 bg-card-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">📐 Geometric Check</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        scoreResult.interpreter_analysis.geometric_analysis.distortion_detected
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {scoreResult.interpreter_analysis.geometric_analysis.distortion_detected ? 'Distortion' : 'Normal'}
                      </span>
                    </div>
                    {scoreResult.interpreter_analysis.geometric_analysis.distortion_detected && (
                      <div className="text-xs text-text-muted">
                        <div>Type: {scoreResult.interpreter_analysis.geometric_analysis.distortion_type}</div>
                        <div>Severity: {(scoreResult.interpreter_analysis.geometric_analysis.severity * 100).toFixed(1)}%</div>
                        <div className="mt-1">
                          Affected: {scoreResult.interpreter_analysis.geometric_analysis.affected_regions.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Texture Analysis */}
                  <div className="p-3 bg-card-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">🎨 Texture Analysis</span>
                    </div>
                    <div className="space-y-1 text-xs text-text-muted">
                      <div className="flex justify-between">
                        <span>Skin Smoothing:</span>
                        <span className={scoreResult.interpreter_analysis.texture_analysis.skin_smoothing > 50 ? 'text-orange-400' : 'text-green-400'}>
                          {scoreResult.interpreter_analysis.texture_analysis.skin_smoothing.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Enhancement:</span>
                        <span className={scoreResult.interpreter_analysis.texture_analysis.artificial_enhancement > 60 ? 'text-orange-400' : 'text-green-400'}>
                          {scoreResult.interpreter_analysis.texture_analysis.artificial_enhancement.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Consistency:</span>
                        <span className={scoreResult.interpreter_analysis.texture_analysis.texture_consistency < 50 ? 'text-orange-400' : 'text-green-400'}>
                          {scoreResult.interpreter_analysis.texture_analysis.texture_consistency.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Human Perception Adjustments */}
                {scoreResult.interpreter_analysis.final_verdict.should_adjust && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg">
                    <div className="text-sm font-medium text-text-primary mb-2">
                      🎯 Human Perception Adjustments
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-text-muted">
                      <div>
                        <div className="flex justify-between">
                          <span>Raw Score:</span>
                          <span>{scoreResult.interpreter_analysis.human_perception_adjustments.raw_composite.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Adjusted Score:</span>
                          <span className="text-text-primary font-medium">{scoreResult.interpreter_analysis.human_perception_adjustments.adjusted_composite.toFixed(1)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Adjustment Factor:</span>
                          <span>{scoreResult.interpreter_analysis.final_verdict.adjustment_factor}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence Change:</span>
                          <span className={scoreResult.interpreter_analysis.human_perception_adjustments.confidence_modifier >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {scoreResult.interpreter_analysis.human_perception_adjustments.confidence_modifier >= 0 ? '+' : ''}{(scoreResult.interpreter_analysis.human_perception_adjustments.confidence_modifier * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-text-muted">
                      <strong>Reasoning:</strong> {scoreResult.interpreter_analysis.human_perception_adjustments.adjustment_reason}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* How It Works */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            🔬 How AI Scoring Works
          </h2>
          <div className="space-y-4 text-sm text-text-muted">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent-foreground">1</span>
              </div>
              <div>
                <strong className="text-text-primary">Image Processing:</strong> Your photo is preprocessed to detect faces, normalize lighting, and resize to optimal dimensions for analysis.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent-foreground">2</span>
              </div>
              <div>
                <strong className="text-text-primary">Golden Ratio Analysis:</strong> Facial proportions are measured against the golden ratio (φ = 1.618) including facial thirds, eye spacing, and feature ratios for mathematical beauty assessment.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent-foreground">3</span>
              </div>
              <div>
                <strong className="text-text-primary">Multi-Factor Analysis:</strong> Attractiveness (50%) and authenticity (30%) dominate scoring, with photo quality (15%) and style (5%) as supporting factors for natural beauty assessment.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent-foreground">4</span>
              </div>
              <div>
                <strong className="text-text-primary">Privacy Protection:</strong> Images are processed locally and immediately deleted after scoring. No data is stored permanently.
              </div>
            </div>
          </div>
        </Card>

        {/* Test Scenarios */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            🧪 Test Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={testScenario === 'high_quality' ? 'default' : 'outline'}
              className={`h-auto p-4 text-left flex flex-col items-start gap-2 ${
                testScenario === 'high_quality' ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => setTestScenario('high_quality')}
            >
              <div className="text-sm font-semibold">📸 High Quality Portrait</div>
              <div className="text-xs opacity-70">
                Professional lighting, clear focus, good composition
              </div>
            </Button>
            
            <Button
              variant={testScenario === 'low_quality' ? 'default' : 'outline'}
              className={`h-auto p-4 text-left flex flex-col items-start gap-2 ${
                testScenario === 'low_quality' ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => setTestScenario('low_quality')}
            >
              <div className="text-sm font-semibold">📱 Casual Selfie</div>
              <div className="text-xs opacity-70">
                Phone camera, natural lighting, informal setting
              </div>
            </Button>
            
            <Button
              variant={testScenario === 'group_photo' ? 'default' : 'outline'}
              className={`h-auto p-4 text-left flex flex-col items-start gap-2 ${
                testScenario === 'group_photo' ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => setTestScenario('group_photo')}
            >
              <div className="text-sm font-semibold">👥 Group Photo</div>
              <div className="text-xs opacity-70">
                Multiple faces, different lighting conditions
              </div>
            </Button>
            
            <Button
              variant={testScenario === 'filtered' ? 'default' : 'outline'}
              className={`h-auto p-4 text-left flex flex-col items-start gap-2 ${
                testScenario === 'filtered' ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => setTestScenario('filtered')}
            >
              <div className="text-sm font-semibold">✨ Filtered Image</div>
              <div className="text-xs opacity-70">
                Beauty filters, enhanced colors, smoothing effects
              </div>
            </Button>
          </div>
          
          {testScenario && (
            <div className="mt-4 p-4 bg-accent/10 rounded-lg">
              <div className="text-sm text-text-primary">
                <strong>Selected Scenario:</strong> {getScenarioDescription(testScenario)}
              </div>
              <div className="text-xs text-text-muted mt-1">
                Upload an image matching this scenario to see how the AI responds to different photo types.
              </div>
            </div>
          )}
        </Card>

        {/* Scoring History */}
        {scoringHistory.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              📈 Scoring History
            </h2>
            <div className="space-y-3">
              {scoringHistory.slice(-3).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📊</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        Score: {entry.composite_score.toFixed(1)}/100
                      </div>
                      <div className="text-xs text-text-muted">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-text-primary">
                      {entry.processing_time.toFixed(2)}s
                    </div>
                    <div className="text-xs text-text-muted">
                      {(entry.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => setScoringHistory([])}
            >
              Clear History
            </Button>
          </Card>
        )}

        {/* Technical Info */}
        <Card className="p-6 border-dashed">
          <h3 className="font-semibold text-text-primary mb-3">
            🔧 Technical Implementation
          </h3>
          <div className="text-sm text-text-muted space-y-2">
            <div><strong>Backend:</strong> Next.js API with mock scoring algorithm</div>
            <div><strong>Model:</strong> Simulated CNN with realistic variance patterns</div>
            <div><strong>Processing:</strong> Client-side demo with 1.5-3.5s delay simulation</div>
            <div><strong>Security:</strong> Base64 validation, file size limits, type checking</div>
            <div><strong>Performance:</strong> Instant local processing in production</div>
          </div>
        </Card>
      </main>
    </div>
  )
}