import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import { z } from 'zod'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ALCHEMY_URL), // Assumes ALCHEMY_URL is in .env
})

const erc721Abi = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

const nftVerifySchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  collections: z.array(z.string())
})

const ELIGIBLE_NFTS = [
  {
    name: "Bangkok University Student ID",
    contractAddress: "0x1234567890123456789012345678901234567890", // Replace with actual address
    description: "Official Bangkok University NFT Student ID",
    requiredAmount: 1
  },
  {
    name: "Chulalongkorn University Pass",
    contractAddress: "0x2345678901234567890123456789012345678901", // Replace with actual address
    description: "Chulalongkorn University Alumni/Student NFT",
    requiredAmount: 1
  },
  {
    name: "Thammasat Gold Member",
    contractAddress: "0x3456789012345678901234567890123456789012", // Replace with actual address
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

    // Check NFT holdings for each eligible collection
    let hasAccess = false
    let accessGrantedBy: typeof ELIGIBLE_NFTS[0] | undefined;

    for (const nft of ELIGIBLE_NFTS) {
      try {
        const balance = await publicClient.readContract({
          address: nft.contractAddress as `0x${string}`,
          abi: erc721Abi,
          functionName: 'balanceOf',
          args: [validatedData.walletAddress as `0x${string}`],
        })

        if (balance >= nft.requiredAmount) {
          hasAccess = true
          accessGrantedBy = nft
          break // Exit loop once access is confirmed
        }
      } catch (err) {
        console.warn(`Could not check balance for ${nft.name}:`, err)
        // Continue to the next NFT collection
      }
    }
    console.log('🎯 NFT Access:', hasAccess ? 'GRANTED' : 'DENIED')

    if (hasAccess) {
      // Update session with NFT verification
      const updatedToken = await new SignJWT({
        ...payload,
        nftVerified: true,
        nftVerifiedAt: new Date().toISOString(),
        eligibleNFT: accessGrantedBy?.name,
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
          eligibleNFT: accessGrantedBy,
        },
      })

      responseObj.cookies.set('worldid-session', updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      })

      return responseObj
    } else {
      return NextResponse.json({
        success: false,
        message: 'No eligible NFTs found',
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