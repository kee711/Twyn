import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Delete all NextAuth related cookies
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.csrf-token',
    ];

    // Delete cookies with various domain configurations
    for (const name of cookieNames) {
      // Delete cookie without domain
      cookieStore.delete({
        name,
        path: '/',
      });
      
      // Delete cookie with domain
      cookieStore.set({
        name,
        value: '',
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: '.twyn.sh'
      });
      
      // Also try without domain specification
      cookieStore.set({
        name,
        value: '',
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    // Clear any custom signup-related cookies
    const customCookies = [
      'signup_intent',
      'signup_invite_code',
      'signup_invite_code_id'
    ];

    for (const name of customCookies) {
      cookieStore.delete({
        name,
        path: '/',
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear cookies' }, { status: 500 });
  }
}