import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Clear all signup-related cookies
  response.cookies.delete('signup_intent')
  response.cookies.delete('signup_invite_code')
  response.cookies.delete('signup_invite_code_id')
  
  return response
}