"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { ProfileCard } from "./ProfileCard"
import { SwipeActions } from "./SwipeActions"

interface Profile {
  id: string
  name: string
  age: number
  university: string
  photos: string[]
  bio: string
  vibes: string[]
  score: number
  isBlurred: boolean
  hasSignal: boolean
}

interface SwipeStackProps {
  profiles: Profile[]
  onSwipe: (profileId: string, direction: 'left' | 'right' | 'up') => void
  onSignal: (profileId: string, signalType: string) => void
  className?: string
}

export function SwipeStack({ profiles, onSwipe, onSignal, className = "" }: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | 'up' | null>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-15, 15])
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 0.5, 1, 0.5, 0])
  
  const containerRef = useRef<HTMLDivElement>(null)
  
  const currentProfile = profiles[currentIndex]
  const nextProfile = profiles[currentIndex + 1]
  const hasMoreProfiles = currentIndex < profiles.length

  useEffect(() => {
    // Preload next few profile images
    profiles.slice(currentIndex, currentIndex + 3).forEach(profile => {
      if (profile.photos[0]) {
        const img = new Image()
        img.src = profile.photos[0]
      }
    })
  }, [currentIndex, profiles])

  const handleDragStart = () => {
    setIsAnimating(true)
  }

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    const isHorizontal = Math.abs(info.offset.x) > Math.abs(info.offset.y)
    
    if (isHorizontal) {
      if (info.offset.x > threshold) {
        setDragDirection('right')
      } else if (info.offset.x < -threshold) {
        setDragDirection('left')
      } else {
        setDragDirection(null)
      }
    } else {
      if (info.offset.y < -threshold) {
        setDragDirection('up')
      } else {
        setDragDirection(null)
      }
    }
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 150
    const velocity = Math.abs(info.velocity.x) > Math.abs(info.velocity.y) ? info.velocity.x : info.velocity.y
    const isHorizontal = Math.abs(info.offset.x) > Math.abs(info.offset.y)
    
    let direction: 'left' | 'right' | 'up' | null = null
    
    if (isHorizontal) {
      if (info.offset.x > threshold || info.velocity.x > 500) {
        direction = 'right'
      } else if (info.offset.x < -threshold || info.velocity.x < -500) {
        direction = 'left'
      }
    } else {
      if (info.offset.y < -threshold || info.velocity.y < -500) {
        direction = 'up'
      }
    }
    
    if (direction && currentProfile) {
      // Animate card out
      const exitX = direction === 'right' ? 1000 : direction === 'left' ? -1000 : 0
      const exitY = direction === 'up' ? -1000 : 0
      
      x.set(exitX)
      y.set(exitY)
      
      // Trigger swipe callback
      onSwipe(currentProfile.id, direction)
      
      // Move to next card after animation
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        x.set(0)
        y.set(0)
        setIsAnimating(false)
        setDragDirection(null)
      }, 300)
    } else {
      // Snap back to center
      x.set(0)
      y.set(0)
      setIsAnimating(false)
      setDragDirection(null)
    }
  }

  const handleActionSwipe = (direction: 'left' | 'right' | 'up') => {
    if (!currentProfile || isAnimating) return
    
    setIsAnimating(true)
    
    // Animate card out
    const exitX = direction === 'right' ? 1000 : direction === 'left' ? -1000 : 0
    const exitY = direction === 'up' ? -1000 : 0
    
    x.set(exitX)
    y.set(exitY)
    
    // Trigger swipe callback
    onSwipe(currentProfile.id, direction)
    
    // Move to next card
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      x.set(0)
      y.set(0)
      setIsAnimating(false)
    }, 300)
  }

  const handleSignalSend = (signalType: string) => {
    if (!currentProfile) return
    onSignal(currentProfile.id, signalType)
  }

  if (!hasMoreProfiles) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className}`}>
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            You've explored everyone!
          </h2>
          <p className="text-text-muted mb-6">
            Check back later for new members joining Aurum Circle
          </p>
          <button 
            onClick={() => setCurrentIndex(0)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Review Profiles Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* Cards Stack */}
      <div className="relative w-full h-full">
        {/* Next card (behind) */}
        {nextProfile && (
          <div className="absolute inset-0 transform scale-95 opacity-50">
            <ProfileCard
              profile={nextProfile}
              onSignal={handleSignalSend}
              isActive={false}
            />
          </div>
        )}
        
        {/* Current card (top) */}
        {currentProfile && (
          <motion.div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            style={{
              x,
              y,
              rotate,
              opacity,
            }}
            drag
            dragConstraints={containerRef}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 1.05 }}
            animate={{
              scale: isAnimating ? 1.05 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <ProfileCard
              profile={currentProfile}
              onSignal={handleSignalSend}
              isActive={true}
              dragDirection={dragDirection}
            />
          </motion.div>
        )}
      </div>
      
      {/* Swipe Actions */}
      <SwipeActions
        onPass={() => handleActionSwipe('left')}
        onLike={() => handleActionSwipe('right')}
        onSuperLike={() => handleActionSwipe('up')}
        disabled={isAnimating}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
      />
      
      {/* Swipe Indicators */}
      {dragDirection && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`
              px-8 py-4 rounded-2xl font-bold text-2xl transform rotate-12
              ${dragDirection === 'left' ? 'bg-red-500 text-white' : ''}
              ${dragDirection === 'right' ? 'bg-green-500 text-white' : ''}
              ${dragDirection === 'up' ? 'bg-accent text-accent-foreground' : ''}
            `}
          >
            {dragDirection === 'left' && 'PASS'}
            {dragDirection === 'right' && 'LIKE'}
            {dragDirection === 'up' && 'SUPER LIKE'}
          </motion.div>
        </div>
      )}
      
      {/* Progress Indicator */}
      <div className="absolute top-4 left-4 right-4">
        <div className="flex justify-between items-center text-sm text-text-muted">
          <span>{currentIndex + 1} of {profiles.length}</span>
          <div className="flex-1 mx-4 bg-border rounded-full h-1">
            <div 
              className="bg-accent h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / profiles.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}