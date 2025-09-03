import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const isSignupIntent = cookieStore.get('signup_intent')?.value === 'true'
  
  // Clear signup cookies after checking
  if (isSignupIntent) {
    const response = NextResponse.json({ isSignupIntent: true })
    response.cookies.delete('signup_intent')
    response.cookies.delete('signup_invite_code')
    response.cookies.delete('signup_invite_code_id')
    return response
  }
  
  return NextResponse.json({ isSignupIntent: false })
}