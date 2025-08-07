"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMiniKit } from "@/components/providers/minikit-provider"

interface NFTCollection {
  name: string
  contractAddress: string
  description: string
  requiredAmount: number
}

const ELIGIBLE_NFTS: NFTCollection[] = [
  {
    name: "Bangkok University Student ID",
    contractAddress: "0x1234567890123456789012345678901234567890", // Mock address
    description: "Official Bangkok University NFT Student ID",
    requiredAmount: 1
  },
  {
    name: "Chulalongkorn University Pass",
    contractAddress: "0x2345678901234567890123456789012345678901", // Mock address
    description: "Chulalongkorn University Alumni/Student NFT",
    requiredAmount: 1
  },
  {
    name: "Thammasat Gold Member",
    contractAddress: "0x3456789012345678901234567890123456789012", // Mock address
    description: "Thammasat University Premium Member NFT",
    requiredAmount: 1
  }
]

export default function NFTGatePage() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    ownedNFTs: any[]
    eligibleNFT?: NFTCollection
  } | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const router = useRouter()
  const { isInstalled } = useMiniKit()

  useEffect(() => {
    // Check session and wallet connection
    const checkSession = async () => {
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
        console.error('Session check failed:', error)
        router.push('/auth')
      }
    }

    checkSession()
  }, [router])

  const verifyNFTs = async () => {
    if (!sessionData?.walletAddress) {
      alert('Wallet not connected')
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch('/api/auth/nft-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: sessionData.walletAddress,
          collections: ELIGIBLE_NFTS.map(nft => nft.contractAddress)
        })
      })

      const result = await response.json()
      setVerificationResult(result.data)

      if (result.success && result.data.success) {
        // NFT verification successful, proceed to profile setup
        setTimeout(() => {
          router.push('/onboarding/profile')
        }, 2000)
      }
    } catch (error) {
      console.error('NFT verification error:', error)
      setVerificationResult({
        success: false,
        ownedNFTs: [],
        eligibleNFT: undefined
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const skipForDemo = () => {
    // For demo purposes, allow skipping NFT gate
    router.push('/onboarding/profile')
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
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            NFT Access Gate
          </h1>
          <p className="text-text-muted">
            Verify your Bangkok university NFT for exclusive access
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <div className="w-8 h-1 bg-accent"></div>
            <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <div className="w-8 h-1 bg-accent"></div>
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
          </div>
        </div>

        {/* NFT Verification */}
        <div className="space-y-6">
          {verificationResult ? (
            <div className="text-center">
              {verificationResult.success ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl text-white">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary">
                    Access Granted!
                  </h3>
                  <p className="text-text-muted">
                    Found eligible NFT: {verificationResult.eligibleNFT?.name}
                  </p>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Redirecting to profile setup...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl text-white">✗</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary">
                    Access Denied
                  </h3>
                  <p className="text-text-muted">
                    No eligible Bangkok university NFTs found in your wallet
                  </p>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      You need one of the eligible university NFTs to access Aurum Circle
                    </p>
                  </div>
                  <Button
                    onClick={skipForDemo}
                    variant="outline"
                    className="w-full"
                  >
                    Skip for Demo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Eligible NFTs List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-text-primary">Eligible NFTs:</h3>
                {ELIGIBLE_NFTS.map((nft, index) => (
                  <div key={index} className="bg-card-muted p-3 rounded-lg">
                    <h4 className="font-medium text-text-primary text-sm">{nft.name}</h4>
                    <p className="text-xs text-text-muted">{nft.description}</p>
                  </div>
                ))}
              </div>

              {/* Wallet Info */}
              {sessionData?.walletAddress && (
                <div className="p-3 bg-accent/10 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">Checking wallet:</p>
                  <p className="font-mono text-sm text-text-primary">
                    {sessionData.walletAddress.slice(0, 6)}...{sessionData.walletAddress.slice(-4)}
                  </p>
                </div>
              )}

              {/* Verify Button */}
              <Button
                onClick={verifyNFTs}
                disabled={isVerifying || !sessionData?.walletAddress}
                className="w-full"
                size="lg"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Verifying NFTs...
                  </div>
                ) : (
                  "Verify NFT Access"
                )}
              </Button>

              {/* Demo Skip */}
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={skipForDemo}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  Skip for Demo (Development Only)
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Back button */}
        <div className="mt-6 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => router.push('/auth/wallet')}
            className="w-full"
          >
            ← Back to Wallet
          </Button>
        </div>
      </Card>
    </div>
  )
}