"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface SignalButtonProps {
  onSignal: (signalType: string) => void
  disabled?: boolean
  className?: string
}

const SIGNAL_TYPES = [
  {
    id: 'rose',
    name: 'Rose',
    emoji: '🌹',
    description: 'Romantic interest',
    rarity: 'common',
    color: 'bg-rose-500'
  },
  {
    id: 'lightning', 
    name: 'Lightning',
    emoji: '⚡',
    description: 'Instant attraction',
    rarity: 'rare',
    color: 'bg-yellow-500'
  },
  {
    id: 'mask',
    name: 'Mystery',
    emoji: '🎭',
    description: 'Mysterious intrigue',
    rarity: 'legendary',
    color: 'bg-purple-500'
  },
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    description: 'Intense chemistry',
    rarity: 'rare',
    color: 'bg-orange-500'
  }
]

export function SignalButton({ onSignal, disabled = false, className = "" }: SignalButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const handleSignalSelect = async (signalType: string) => {
    if (disabled || isSending) return
    
    setSelectedSignal(signalType)
    setIsSending(true)
    
    try {
      await onSignal(signalType)
      
      // Show success animation
      setTimeout(() => {
        setIsOpen(false)
        setSelectedSignal(null)
        setIsSending(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to send signal:', error)
      setIsSending(false)
      setSelectedSignal(null)
    }
  }

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400'
      case 'rare': return 'border-blue-400 shadow-blue-400/20'
      case 'legendary': return 'border-purple-400 shadow-purple-400/30 shadow-lg'
      default: return 'border-gray-400'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isSending}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className={`
          w-12 h-12 bg-accent/90 backdrop-blur-sm rounded-full 
          flex items-center justify-center text-xl
          shadow-lg hover:shadow-xl transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isSending ? 'animate-pulse' : ''}
        `}
        aria-label="Send secret signal"
      >
        {isSending ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ✨
          </motion.div>
        ) : (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🌟
          </motion.div>
        )}
      </motion.button>

      {/* Signal Selection Modal */}
      <AnimatePresence>
        {isOpen && !isSending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-full right-0 mb-2 z-50"
          >
            <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl backdrop-blur-sm min-w-[280px]">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-text-primary font-playfair">
                  Send Secret Signal
                </h3>
                <p className="text-sm text-text-muted">
                  Choose your mysterious message
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SIGNAL_TYPES.map((signal) => (
                  <motion.button
                    key={signal.id}
                    onClick={() => handleSignalSelect(signal.id)}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    className={`
                      p-3 rounded-xl border-2 transition-all duration-200
                      hover:shadow-lg backdrop-blur-sm
                      ${getRarityStyle(signal.rarity)}
                      ${selectedSignal === signal.id 
                        ? 'bg-accent/20 border-accent' 
                        : 'bg-card-muted hover:bg-card-muted/80'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">{signal.emoji}</div>
                      <div className="text-sm font-medium text-text-primary">
                        {signal.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {signal.description}
                      </div>
                      <div className={`
                        text-xs mt-1 px-2 py-0.5 rounded-full
                        ${signal.rarity === 'common' ? 'bg-gray-500/20 text-gray-400' : ''}
                        ${signal.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' : ''}
                        ${signal.rarity === 'legendary' ? 'bg-purple-500/20 text-purple-400' : ''}
                      `}>
                        {signal.rarity}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {selectedSignal && isSending && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 1 }}
              className="text-2xl"
            >
              {SIGNAL_TYPES.find(s => s.id === selectedSignal)?.emoji}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}