import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 User logging out')

    const responseObj = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the session cookie
    responseObj.cookies.set('worldid-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return responseObj

  } catch (error) {
    console.error('💥 Logout error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Logout failed',
        error: 'SERVER_ERROR' 
      },
      { status: 500 }
    )
  }
}