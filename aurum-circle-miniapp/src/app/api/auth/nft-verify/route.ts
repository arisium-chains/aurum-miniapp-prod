import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { z } from 'zod'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const nftVerifySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  collections: z.array(z.string())
})

// Mock NFT data for demo purposes
const MOCK_NFT_HOLDINGS: Record<string, Array<{
  contractAddress: string
  tokenId: string
  name: string
  description: string
}>> = {
  // Mock some addresses with NFTs for testing
  '0x742d35cc3bf21f1bd4d5b8e9b7c1ad25c1a3c5a8': [
    {
      contractAddress: '0x1234567890123456789012345678901234567890',
      tokenId: '1',
      name: 'Bangkok University Student ID #1',
      description: 'Official Bangkok University NFT Student ID'
    }
  ],
  '0x8ba1f109551bd432803012645hac136c5d05c9a8': [
    {
      contractAddress: '0x2345678901234567890123456789012345678901',
      tokenId: '42',
      name: 'Chulalongkorn University Pass #42',
      description: 'Chulalongkorn University Alumni NFT'
    }
  ]
}

const ELIGIBLE_NFTS = [
  {
    name: "Bangkok University Student ID",
    contractAddress: "0x1234567890123456789012345678901234567890",
    description: "Official Bangkok University NFT Student ID",
    requiredAmount: 1
  },
  {
    name: "Chulalongkorn University Pass",
    contractAddress: "0x2345678901234567890123456789012345678901",
    description: "Chulalongkorn University Alumni/Student NFT",
    requiredAmount: 1
  },
  {
    name: "Thammasat Gold Member",
    contractAddress: "0x3456789012345678901234567890123456789012",
    description: "Thammasat University Premium Member NFT",
    requiredAmount: 1
  }
]

export async function POST(request: NextRequest) {
  try {
    // Verify session
    const sessionCookie = request.cookies.get('worldid-session')
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: 'Session required' },
        { status: 401 }
      )
    }

    const { payload } = await jwtVerify(sessionCookie.value, secret)
    if (!payload.walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet connection required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = nftVerifySchema.parse(body)

    console.log('🎓 Verifying NFT holdings:', {
      wallet: validatedData.walletAddress.substring(0, 6) + '...',
      collections: validatedData.collections.length
    })

    // TODO: Replace with real blockchain NFT verification
    // For now, using mock data for demo
    
    const ownedNFTs = MOCK_NFT_HOLDINGS[validatedData.walletAddress] || []
    console.log('📝 Found NFTs:', ownedNFTs.length)

    // Check if user owns any eligible NFTs
    const eligibleNFT = ELIGIBLE_NFTS.find(eligible => 
      ownedNFTs.some(owned => owned.contractAddress.toLowerCase() === eligible.contractAddress.toLowerCase())
    )

    const hasAccess = !!eligibleNFT
    console.log('🎯 NFT Access:', hasAccess ? 'GRANTED' : 'DENIED')

    if (hasAccess) {
      // Update session with NFT verification
      const updatedToken = await new SignJWT({
        ...payload,
        nftVerified: true,
        nftVerifiedAt: new Date().toISOString(),
        eligibleNFT: eligibleNFT.name
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret)

      const responseObj = NextResponse.json({
        success: true,
        message: 'NFT verification successful',
        data: {
          success: true,
          ownedNFTs,
          eligibleNFT
        }
      })

      responseObj.cookies.set('worldid-session', updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      })

      return responseObj
    } else {
      return NextResponse.json({
        success: true,
        message: 'No eligible NFTs found',
        data: {
          success: false,
          ownedNFTs,
          eligibleNFT: null
        }
      })
    }

  } catch (error) {
    console.error('💥 NFT verification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request data',
          errors: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'NFT verification failed',
        error: 'SERVER_ERROR' 
      },
      { status: 500 }
    )
  }
}