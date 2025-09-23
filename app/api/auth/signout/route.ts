import { NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = isProduction ? '.twyn.sh' : undefined;

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, url: '/' }, { status: 200 });

    const sessionCookies = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      '__Host-next-auth.csrf-token',
    ];

    const baseOptions = {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: isProduction,
    };

    for (const name of sessionCookies) {
      response.cookies.set({
        name,
        value: '',
        ...baseOptions,
      });

      if (cookieDomain) {
        response.cookies.set({
          name,
          value: '',
          ...baseOptions,
          domain: cookieDomain,
        });
      }
    }

    const customCookies = [
      'signup_intent',
      'signup_invite_code',
      'signup_invite_code_id',
    ];

    for (const name of customCookies) {
      response.cookies.set({
        name,
        value: '',
        path: '/',
        expires: new Date(0),
      });

      if (cookieDomain) {
        response.cookies.set({
          name,
          value: '',
          path: '/',
          expires: new Date(0),
          domain: cookieDomain,
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear cookies' }, { status: 500 });
  }
}
