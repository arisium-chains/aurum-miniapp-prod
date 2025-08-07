"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMiniKit } from "@/components/providers/minikit-provider"
import { isInWorldApp } from "@/lib/minikit"

export default function WalletConnectionPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const router = useRouter()
  const { isInstalled } = useMiniKit()

  useEffect(() => {
    // Check if user has World ID session
    const checkWorldIDSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          // No valid World ID session, redirect back to World ID
          router.push('/auth')
          return
        }
      } catch (error) {
        console.error('Session check failed:', error)
        router.push('/auth')
      }
    }

    checkWorldIDSession()
  }, [router])

  const connectWallet = async () => {
    if (!isInstalled || !isInWorldApp()) {
      alert('Please open this app in World App to connect your wallet')
      return
    }

    setIsConnecting(true)

    try {
      // Import MiniKit dynamically to avoid issues
      const { MiniKit } = await import('@worldcoin/minikit-js')
      
      // Request wallet connection
      const result = await MiniKit.commandsAsync.walletAuth({
        message: "Connect your wallet to Aurum Circle",
        requestId: crypto.randomUUID()
      })

      if (result.status === 'success' && result.address) {
        setWalletAddress(result.address)
        
        // Store wallet connection on server
        const response = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address: result.address,
            signature: result.signature
          })
        })

        if (response.ok) {
          // Proceed to NFT gate
          router.push('/auth/nft-gate')
        } else {
          throw new Error('Failed to store wallet connection')
        }
      } else {
        throw new Error('Wallet connection failed')
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  if (!isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              World App Required
            </h1>
            <p className="text-text-muted">
              Please open this link in the World App to connect your wallet
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌟</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Connect Your Wallet
          </h1>
          <p className="text-text-muted">
            We need to verify your NFT holdings for exclusive access
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <div className="w-8 h-1 bg-accent"></div>
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div className="w-8 h-1 bg-border"></div>
            <div className="w-8 h-8 bg-border text-text-muted rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
          </div>
        </div>

        {/* Wallet connection */}
        <div className="space-y-4">
          {walletAddress ? (
            <div className="text-center">
              <div className="p-4 bg-accent/20 rounded-lg mb-4">
                <p className="text-sm text-text-muted mb-1">Connected Wallet:</p>
                <p className="font-mono text-sm text-text-primary">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
              <Button
                onClick={() => router.push('/auth/nft-gate')}
                className="w-full"
                size="lg"
              >
                Continue to NFT Verification
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-card-muted p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2 text-text-primary">Why do we need your wallet?</h3>
                <ul className="text-sm text-text-muted space-y-1">
                  <li>• Verify exclusive NFT holdings</li>
                  <li>• Enable blockchain features</li>
                  <li>• Secure your profile</li>
                </ul>
              </div>

              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Connecting Wallet...
                  </div>
                ) : (
                  "Connect Wallet"
                )}
              </Button>

              <p className="text-xs text-text-muted text-center mt-4">
                Your wallet will be used to verify NFT ownership only. We never store your private keys.
              </p>
            </>
          )}
        </div>

        {/* Back button */}
        <div className="mt-6 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => router.push('/auth')}
            className="w-full"
          >
            ← Back to World ID
          </Button>
        </div>
      </Card>
    </div>
  )
}