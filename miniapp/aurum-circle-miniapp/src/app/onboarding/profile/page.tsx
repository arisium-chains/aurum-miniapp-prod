"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useMiniKit } from "@/components/providers/minikit-provider"

const UNIVERSITY_OPTIONS = [
  { id: 'bu', name: 'Bangkok University', emoji: '🏛️' },
  { id: 'cu', name: 'Chulalongkorn University', emoji: '🎓' },
  { id: 'tu', name: 'Thammasat University', emoji: '📚' },
  { id: 'ku', name: 'Kasetsart University', emoji: '🌱' },
  { id: 'mu', name: 'Mahidol University', emoji: '⚕️' },
  { id: 'kmutt', name: 'KMUTT', emoji: '🔧' }
]

const VIBE_OPTIONS = [
  { id: 'academic', name: 'Academic Scholar', emoji: '📖', description: 'Love deep conversations and intellectual pursuits' },
  { id: 'creative', name: 'Creative Soul', emoji: '🎨', description: 'Express yourself through art, music, or design' },
  { id: 'adventurous', name: 'Adventure Seeker', emoji: '🗺️', description: 'Always ready for the next exciting experience' },
  { id: 'social', name: 'Social Butterfly', emoji: '🦋', description: 'Thrive in social settings and love meeting new people' },
  { id: 'athletic', name: 'Fitness Enthusiast', emoji: '💪', description: 'Stay active and love sports or fitness activities' },
  { id: 'entrepreneur', name: 'Future Leader', emoji: '🚀', description: 'Building the next big thing or leading initiatives' },
  { id: 'chill', name: 'Laid-back Vibe', emoji: '😌', description: 'Enjoy simple pleasures and peaceful moments' },
  { id: 'mystery', name: 'Mysterious Aura', emoji: '🎭', description: 'Keep some secrets and love intriguing conversations' }
]

export default function ProfileSetupPage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    year: '',
    faculty: '',
    primaryVibe: '',
    secondaryVibes: [] as string[],
    bio: ''
  })
  const router = useRouter()
  const { isInstalled } = useMiniKit()

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          router.push('/auth')
          return
        }
        
        const data = await response.json()
        if (!data.data.walletAddress) {
          router.push('/auth/wallet')
          return
        }
        
        setSessionData(data.data)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      }
    }

    checkAuth()
  }, [router])

  const handleVibeToggle = (vibeId: string) => {
    if (formData.primaryVibe === vibeId) {
      setFormData(prev => ({ ...prev, primaryVibe: '' }))
    } else if (formData.primaryVibe === '') {
      setFormData(prev => ({ ...prev, primaryVibe: vibeId }))
    } else {
      // Switch primary vibe
      setFormData(prev => ({ ...prev, primaryVibe: vibeId }))
    }
  }

  const handleSecondaryVibeToggle = (vibeId: string) => {
    if (formData.secondaryVibes.includes(vibeId)) {
      setFormData(prev => ({
        ...prev,
        secondaryVibes: prev.secondaryVibes.filter(id => id !== vibeId)
      }))
    } else if (formData.secondaryVibes.length < 2) {
      setFormData(prev => ({
        ...prev,
        secondaryVibes: [...prev.secondaryVibes, vibeId]
      }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.university || !formData.primaryVibe) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/profile/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Profile created successfully, redirect to main app
        router.push('/discover')
      } else {
        throw new Error('Failed to create profile')
      }
    } catch (error) {
      console.error('Profile creation error:', error)
      alert('Failed to create profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            World App Required
          </h1>
        </Card>
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Basic Information
        </h2>
        <p className="text-text-muted text-sm">
          Tell us about yourself
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Display Name *
          </label>
          <Input
            type="text"
            placeholder="How should others see you?"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            University *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {UNIVERSITY_OPTIONS.map((uni) => (
              <button
                key={uni.id}
                onClick={() => setFormData(prev => ({ ...prev, university: uni.id }))}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  formData.university === uni.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card-muted hover:border-primary/50'
                }`}
              >
                <div className="text-lg mb-1">{uni.emoji}</div>
                <div className="text-xs font-medium">{uni.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Year
            </label>
            <Input
              type="text"
              placeholder="e.g. 2nd year"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Faculty
            </label>
            <Input
              type="text"
              placeholder="e.g. Engineering"
              value={formData.faculty}
              onChange={(e) => setFormData(prev => ({ ...prev, faculty: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={() => setStep(2)}
        disabled={!formData.name || !formData.university}
        className="w-full"
        size="lg"
      >
        Next: Choose Your Vibe
      </Button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Your Vibe
        </h2>
        <p className="text-text-muted text-sm">
          Choose your primary vibe and up to 2 secondary vibes
        </p>
      </div>

      <div>
        <h3 className="font-medium text-text-primary mb-3">Primary Vibe *</h3>
        <div className="grid grid-cols-2 gap-3">
          {VIBE_OPTIONS.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => handleVibeToggle(vibe.id)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                formData.primaryVibe === vibe.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card-muted hover:border-primary/50'
              }`}
            >
              <div className="text-2xl mb-2">{vibe.emoji}</div>
              <div className="text-sm font-medium mb-1">{vibe.name}</div>
              <div className="text-xs text-text-muted">{vibe.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-text-primary mb-3">
          Secondary Vibes (optional - max 2)
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {VIBE_OPTIONS.filter(v => v.id !== formData.primaryVibe).map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => handleSecondaryVibeToggle(vibe.id)}
              disabled={!formData.secondaryVibes.includes(vibe.id) && formData.secondaryVibes.length >= 2}
              className={`p-3 rounded-lg border text-center transition-colors ${
                formData.secondaryVibes.includes(vibe.id)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-card-muted hover:border-accent/50 disabled:opacity-50'
              }`}
            >
              <div className="text-lg mb-1">{vibe.emoji}</div>
              <div className="text-xs font-medium">{vibe.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={() => setStep(3)}
          disabled={!formData.primaryVibe}
          className="flex-1"
        >
          Final Step
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Personal Touch
        </h2>
        <p className="text-text-muted text-sm">
          Add a bio to tell your story
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Bio (optional)
        </label>
        <textarea
          placeholder="Share something interesting about yourself... Your secret signals will help others find you 🤫"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary placeholder:text-text-muted resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <p className="text-xs text-text-muted mt-1">
          {formData.bio.length}/300 characters
        </p>
      </div>

      {/* Profile Preview */}
      <div className="p-4 bg-card-muted rounded-lg">
        <h3 className="font-medium text-text-primary mb-3">Profile Preview</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Name:</strong> {formData.name}</div>
          <div><strong>University:</strong> {UNIVERSITY_OPTIONS.find(u => u.id === formData.university)?.name}</div>
          {formData.year && <div><strong>Year:</strong> {formData.year}</div>}
          {formData.faculty && <div><strong>Faculty:</strong> {formData.faculty}</div>}
          <div><strong>Primary Vibe:</strong> {VIBE_OPTIONS.find(v => v.id === formData.primaryVibe)?.name}</div>
          {formData.secondaryVibes.length > 0 && (
            <div><strong>Secondary Vibes:</strong> {formData.secondaryVibes.map(id => VIBE_OPTIONS.find(v => v.id === id)?.name).join(', ')}</div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setStep(2)}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Creating...
            </div>
          ) : (
            'Enter Aurum Circle'
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Welcome to Aurum Circle
          </h1>
          <p className="text-text-muted">
            Step {step} of 3
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-border text-text-muted'
                }`}
              >
                {i}
              </div>
            ))}
          </div>
          <div className="w-full bg-border h-2 rounded-full">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </Card>
    </div>
  )
}