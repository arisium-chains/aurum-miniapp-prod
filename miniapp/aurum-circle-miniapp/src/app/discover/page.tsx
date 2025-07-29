"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SwipeStack } from "@/components/discovery/SwipeStack"
import { useMiniKit } from "@/components/providers/minikit-provider"

// Mock profiles for demonstration
const MOCK_PROFILES = [
  {
    id: "1",
    name: "Aria",
    age: 21,
    university: "cu",
    photos: ["/placeholder-profile.svg"],
    bio: "Third-year Architecture student passionate about sustainable design and late-night coffee. Love exploring hidden cafes around Bangkok and sketching urban landscapes. Looking for someone who appreciates both deep conversations and spontaneous adventures. 🏛️☕",
    vibes: ["academic", "creative", "chill"],
    score: 92,
    isBlurred: true,
    hasSignal: false
  },
  {
    id: "2", 
    name: "Luna",
    age: 20,
    university: "bu",
    photos: ["/placeholder-profile.svg"],
    bio: "Psychology major with a passion for understanding human behavior. When I'm not studying, you'll find me practicing yoga, reading philosophy, or trying new restaurants in Thonglor. Seeking genuine connections and meaningful conversations. 🧠✨",
    vibes: ["academic", "social", "mysterious"],
    score: 88,
    isBlurred: false,
    hasSignal: true
  },
  {
    id: "3",
    name: "Kai",
    age: 22,
    university: "tu",
    photos: ["/placeholder-profile.svg"],
    bio: "Business student by day, music producer by night. Love creating beats and discovering underground artists. Always up for concerts, art galleries, or late-night food adventures. Let's vibe together! 🎵🎨",
    vibes: ["creative", "social", "entrepreneur"],
    score: 85,
    isBlurred: true,
    hasSignal: false
  },
  {
    id: "4",
    name: "Sage",
    age: 23,
    university: "ku",
    photos: ["/placeholder-profile.svg"],
    bio: "Environmental Science graduate student researching sustainable agriculture. Weekends you'll find me rock climbing, camping, or volunteering at local farms. Looking for someone who shares my love for nature and making a positive impact. 🌱🧗‍♀️",
    vibes: ["academic", "athletic", "adventurous"],
    score: 90,
    isBlurred: false,
    hasSignal: false
  },
  {
    id: "5",
    name: "Nova",
    age: 21,
    university: "mu",
    photos: ["/placeholder-profile.svg"],
    bio: "Medical student with a secret love for street photography and vintage vinyl records. Balancing the intensity of med school with creative outlets. Appreciate both intellectual debates and quiet moments with good music. 📷🎶",
    vibes: ["academic", "creative", "mysterious"],
    score: 94,
    isBlurred: true,
    hasSignal: true
  }
]

export default function DiscoverPage() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [profiles, setProfiles] = useState(MOCK_PROFILES)
  const [isLoading, setIsLoading] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [swipeStats, setSwipeStats] = useState({
    likes: 0,
    passes: 0,
    superLikes: 0,
    signals: 0
  })
  
  const router = useRouter()
  const { isInstalled } = useMiniKit()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          router.push('/auth')
          return
        }
        
        const data = await response.json()
        if (!data.data.profileCompleted) {
          router.push('/onboarding/profile')
          return
        }
        
        setSessionData(data.data)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSwipe = async (profileId: string, direction: 'left' | 'right' | 'up') => {
    console.log(`Swiped ${direction} on profile ${profileId}`)
    
    // Update stats
    setSwipeStats(prev => ({
      ...prev,
      likes: direction === 'right' ? prev.likes + 1 : prev.likes,
      passes: direction === 'left' ? prev.passes + 1 : prev.passes,
      superLikes: direction === 'up' ? prev.superLikes + 1 : prev.superLikes
    }))

    // TODO: Send to API
    try {
      const response = await fetch('/api/discovery/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          action: direction === 'left' ? 'pass' : direction === 'right' ? 'like' : 'super_like'
        })
      })
      
      if (!response.ok) {
        console.error('Failed to record swipe action')
      }
    } catch (error) {
      console.error('Swipe action error:', error)
    }
  }

  const handleSignal = async (profileId: string, signalType: string) => {
    console.log(`Sent ${signalType} signal to profile ${profileId}`)
    
    // Update stats
    setSwipeStats(prev => ({
      ...prev,
      signals: prev.signals + 1
    }))

    // TODO: Send to API
    try {
      const response = await fetch('/api/signals/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          signalType
        })
      })
      
      if (!response.ok) {
        console.error('Failed to send signal')
      }
    } catch (error) {
      console.error('Signal error:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading your matches...</p>
        </div>
      </div>
    )
  }

  if (!isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            World App Required
          </h1>
          <p className="text-text-muted">
            Please open this app in World App to continue
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary font-playfair">
              Aurum Circle
            </h1>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowStats(!showStats)}
              variant="ghost"
              size="sm"
              className="text-text-muted hover:text-text-primary"
            >
              📊
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-text-muted hover:text-text-primary"
            >
              ⏻
            </Button>
          </div>
        </div>
        
        {/* Stats Bar */}
        {showStats && (
          <div className="max-w-md mx-auto px-4 pb-4">
            <div className="bg-card rounded-lg p-3 flex justify-between text-sm">
              <div className="text-center">
                <div className="text-green-400 font-bold">{swipeStats.likes}</div>
                <div className="text-text-muted">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold">{swipeStats.passes}</div>
                <div className="text-text-muted">Passes</div>
              </div>
              <div className="text-center">
                <div className="text-accent font-bold">{swipeStats.superLikes}</div>
                <div className="text-text-muted">Super</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-bold">{swipeStats.signals}</div>
                <div className="text-text-muted">Signals</div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Discovery Area */}
      <main className="max-w-md mx-auto h-[calc(100vh-80px)] p-4">
        <SwipeStack
          profiles={profiles}
          onSwipe={handleSwipe}
          onSignal={handleSignal}
          className="h-full"
        />
      </main>

      {/* Floating Action Menu */}
      <div className="fixed bottom-6 right-6 z-10">
        <Button
          onClick={() => router.push('/matches')}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          size="sm"
        >
          <span className="text-xl">💬</span>
        </Button>
      </div>
    </div>
  )
}