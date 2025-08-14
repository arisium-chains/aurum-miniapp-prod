"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

interface ScoringResult {
  score: number
  percentile: number
  vibeTags: string[]
  timestamp: string
  metadata: {
    faceQuality: number
    frontality: number
    symmetry: number
    resolution: number
    totalUsers: number
    userRank: number
    confidence: number
  }
  distribution?: {
    mean: number
    std: number
    percentiles: {
      p10: number
      p25: number
      p50: number
      p75: number
      p90: number
      p95: number
      p99: number
    }
  }
}

interface LeaderboardEntry {
  userId: string
  score: number
  percentile: number
  vibeTags: string[]
  rank: number
  timestamp: string
}

export default function AttractivenessDemoPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [userId, setUserId] = useState("")
  const [isScoring, setIsScoring] = useState(false)
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      if (file.size > 3 * 1024 * 1024) {
        setError('Image must be less than 3MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setError(null)
        setScoringResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleScore = async () => {
    if (!selectedImage || !userId.trim()) {
      setError('Please provide both an image and user ID')
      return
    }

    setIsScoring(true)
    setError(null)

    try {
      const base64Image = selectedImage.split(',')[1]
      
      const response = await fetch('/api/attractiveness/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId.trim(),
          image: base64Image,
          nftVerified: true, // Demo mode
          wldVerified: true  // Demo mode
        })
      })

      const result = await response.json()

      if (result.success) {
        setScoringResult(result.data)
        await loadLeaderboard() // Refresh leaderboard
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

  const loadLeaderboard = async () => {
    try {
      // Use full URL for server-side compatibility
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
      const response = await fetch(`${baseUrl}/api/attractiveness/leaderboard?limit=10`)
      const result = await response.json()
      
      if (result.success) {
        setLeaderboard(result.data.users)
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setScoringResult(null)
    setError(null)
    setUserId("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Load leaderboard on component mount
  useState(() => {
    loadLeaderboard()
  })

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-purple-400'
    if (score >= 80) return 'text-blue-400'
    if (score >= 70) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getVibeColor = (vibe: string) => {
    const colors = {
      'Mystic': 'bg-purple-500/20 text-purple-300',
      'Radiant': 'bg-yellow-500/20 text-yellow-300',
      'Bold': 'bg-red-500/20 text-red-300',
      'Ethereal': 'bg-blue-500/20 text-blue-300',
      'Classic': 'bg-amber-500/20 text-amber-300',
      'Artistic': 'bg-indigo-500/20 text-indigo-300',
      'Luminous': 'bg-cyan-500/20 text-cyan-300',
      'Refined': 'bg-emerald-500/20 text-emerald-300',
      'Magnetic': 'bg-pink-500/20 text-pink-300',
      'Gentle': 'bg-green-500/20 text-green-300'
    }
    return colors[vibe as keyof typeof colors] || 'bg-gray-500/20 text-gray-300'
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-text-primary font-playfair">
            ✨ Aurum Circle Attractiveness Engine
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Relative percentile-based facial scoring with embedding similarity
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Scoring Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            🎯 Score Your Portrait
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  User ID (Demo)
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter unique user ID"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  disabled={isScoring}
                />
              </div>

              {!selectedImage ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📷</span>
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Upload Portrait
                  </h3>
                  <p className="text-text-muted mb-4">
                    Clear frontal photo, max 3MB
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-accent hover:bg-accent/90"
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
                  <div className="relative w-full max-w-sm mx-auto">
                    <Image
                      src={selectedImage}
                      alt="Selected image"
                      width={300}
                      height={400}
                      className="w-full h-auto rounded-lg shadow-lg object-cover"
                    />
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      disabled={isScoring}
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleScore}
                      disabled={isScoring || !userId.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isScoring ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Analyzing...
                        </div>
                      ) : (
                        '🧠 Calculate Score'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">❌ {error}</p>
                </div>
              )}
            </div>

            {/* Results Section */}
            {scoringResult && (
              <div className="space-y-4">
                {/* Main Score */}
                <div className="text-center p-6 bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg border border-accent/20">
                  <div className="text-4xl font-bold mb-2">
                    <span className={getScoreColor(scoringResult.score)}>
                      {scoringResult.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-text-primary font-semibold">
                    Rank #{scoringResult.metadata.userRank} of {scoringResult.metadata.totalUsers}
                  </div>
                  <div className="text-text-muted text-sm">
                    {(scoringResult.percentile * 100).toFixed(1)}th percentile
                  </div>
                </div>

                {/* Vibe Tags */}
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">✨ Vibe Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {scoringResult.vibeTags.map((vibe, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getVibeColor(vibe)}`}
                      >
                        {vibe}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Face Quality Metrics */}
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">📊 Face Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span className="font-medium">{(scoringResult.metadata.faceQuality * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frontality:</span>
                      <span className="font-medium">{(scoringResult.metadata.frontality * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Symmetry:</span>
                      <span className="font-medium">{(scoringResult.metadata.symmetry * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolution:</span>
                      <span className="font-medium">{(scoringResult.metadata.resolution * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span>Confidence:</span>
                      <span className="font-medium text-accent">{(scoringResult.metadata.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">
                🏆 Current Leaderboard
              </h2>
              <Button
                onClick={loadLeaderboard}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
            
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    entry.userId === userId ? 'border-accent bg-accent/5' : 'border-border bg-card-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index < 3 ? 'bg-gradient-to-br from-accent to-primary text-white' : 'bg-border text-text-muted'
                    }`}>
                      {entry.rank}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">
                        {entry.userId}
                        {entry.userId === userId && <span className="text-accent ml-2">(You)</span>}
                      </div>
                      <div className="flex gap-1">
                        {entry.vibeTags.slice(0, 2).map((vibe, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-xs ${getVibeColor(vibe)}`}
                          >
                            {vibe}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(entry.score)}`}>
                      {entry.score.toFixed(1)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {(entry.percentile * 100).toFixed(1)}th %ile
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* How It Works */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            🔬 How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-text-muted">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-accent-foreground">1</span>
                </div>
                <div>
                  <strong className="text-text-primary">Face Detection:</strong> MTCNN-style detection identifies facial landmarks and crops the face region for analysis.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-accent-foreground">2</span>
                </div>
                <div>
                  <strong className="text-text-primary">Embedding Extraction:</strong> ArcFace-style 512D embeddings capture facial features for similarity comparison.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-accent-foreground">3</span>
                </div>
                <div>
                  <strong className="text-text-primary">Similarity Analysis:</strong> Cosine similarity computed against all existing users in the vector database.
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-accent-foreground">4</span>
                </div>
                <div>
                  <strong className="text-text-primary">Percentile Ranking:</strong> Score calculated as percentile rank relative to current user population (not fixed thresholds).
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-accent-foreground">5</span>
                </div>
                <div>
                  <strong className="text-text-primary">Vibe Clustering:</strong> PCA + K-means style clustering generates personality tags from embedding patterns.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-accent-foreground">6</span>
                </div>
                <div>
                  <strong className="text-text-primary">One-Time Scoring:</strong> Each user can only be scored once, ensuring fairness and preventing gaming.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Technical Details */}
        <Card className="p-6 border-dashed">
          <h3 className="font-semibold text-text-primary mb-3">
            🛠️ Technical Stack
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-muted">
            <div>
              <div><strong>Face Detection:</strong> Simulated MTCNN pipeline</div>
              <div><strong>Embeddings:</strong> 512D ArcFace-style vectors</div>
              <div><strong>Vector Store:</strong> In-memory FAISS-like similarity search</div>
              <div><strong>Clustering:</strong> Custom PCA + K-means for vibe tags</div>
            </div>
            <div>
              <div><strong>Backend:</strong> Next.js 14 API routes</div>
              <div><strong>Deployment:</strong> Fly.io with persistent volumes</div>
              <div><strong>Performance:</strong> Sub-5s scoring latency target</div>
              <div><strong>Capacity:</strong> 10,000 user maximum for demo</div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}