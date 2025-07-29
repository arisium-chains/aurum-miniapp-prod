"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { initializeMiniKit, isInWorldApp } from '@/lib/minikit'

interface MiniKitContextType {
  isInstalled: boolean
  isInitialized: boolean
  user: any | null
}

const MiniKitContext = createContext<MiniKitContextType>({
  isInstalled: false,
  isInitialized: false,
  user: null
})

export function MiniKitProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Initialize MiniKit when component mounts
    const minikit = initializeMiniKit()
    
    if (minikit) {
      setIsInitialized(true)
      setIsInstalled(isInWorldApp())
      
      // Listen for user changes
      const handleUserChange = (userData: any) => {
        setUser(userData)
      }

      // Set up event listeners if available
      // Note: This depends on the actual MiniKit API
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('minikit:user', handleUserChange)
        
        return () => {
          window.removeEventListener('minikit:user', handleUserChange)
        }
      }
    }
  }, [])

  return (
    <MiniKitContext.Provider value={{ isInstalled, isInitialized, user }}>
      {children}
    </MiniKitContext.Provider>
  )
}

export const useMiniKit = () => {
  const context = useContext(MiniKitContext)
  if (!context) {
    throw new Error('useMiniKit must be used within a MiniKitProvider')
  }
  return context
}