"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMiniKit } from "@/components/providers/minikit-provider"

interface Invite {
  id: string
  code: string
  claimedAt: string | null
  createdAt: string
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const { isInstalled } = useMiniKit()

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const response = await fetch('/api/invites')
        if (response.ok) {
          const data = await response.json()
          setInvites(data.data)
        } else {
          // Handle error, maybe redirect
          router.push('/discover')
        }
      } catch (error) {
        console.error('Failed to fetch invites:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvites()
  }, [router])

  const generateInvite = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/invites/generate', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        setInvites(prev => [data.data, ...prev])
      } else {
        const error = await response.json()
        alert(`Failed to generate invite: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to generate invite:', error)
      alert('An unexpected error occurred.')
    } finally {
      setIsGenerating(false)
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
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="max-w-md mx-auto p-4">
        <header className="py-4">
          <h1 className="text-2xl font-bold font-playfair">Your Invites</h1>
          <p className="text-text-secondary">Invite others to join the circle.</p>
        </header>

        <main className="space-y-4">
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Generate New Invite</h2>
              <Button onClick={generateInvite} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </Card>

          {isLoading ? (
            <p>Loading invites...</p>
          ) : (
            <div className="space-y-3">
              {invites.map(invite => (
                <Card key={invite.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-mono text-lg">{invite.code}</p>
                    <p className="text-xs text-text-muted">
                      Created: {new Date(invite.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {invite.claimedAt ? (
                    <span className="text-sm font-semibold text-green-500">Claimed</span>
                  ) : (
                    <span className="text-sm font-semibold text-yellow-500">Available</span>
                  )}
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
