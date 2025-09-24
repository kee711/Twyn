import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.SUPABASE_URL!
// const supabaseKey = process.env.SUPABASE_ANON_KEY!
// const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    // const body = await request.json()
    // const { inviteCode, inviteCodeId } = body

    // // Validate invite code
    // if (inviteCode && inviteCodeId) {
    //   const { data: inviteCodeData, error: inviteError } = await supabase
    //     .from('invite_codes')
    //     .select('*')
    //     .eq('id', inviteCodeId)
    //     .eq('code', inviteCode)
    //     .single()

    //   if (inviteError || !inviteCodeData) {
    //     return NextResponse.json(
    //       { error: '유효하지 않은 초대 코드입니다', success: false },
    //       { status: 400 }
    //     )
    //   }

    //   if (inviteCodeData.is_used) {
    //     return NextResponse.json(
    //       { error: '이미 사용된 초대 코드입니다', success: false },
    //       { status: 400 }
    //     )
    //   }
    // }

    // Set a cookie to mark this as a signup attempt
    const response = NextResponse.json({
      success: true,
      message: '회원가입 준비가 완료되었습니다'
    })

    // Set cookies for the signup flow with proper settings for OAuth
    const isProduction = process.env.NODE_ENV === 'production'

    response.cookies.set('signup_intent', 'true', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // 'none' for production, 'lax' for localhost
      path: '/', // Explicitly set path to root
      maxAge: 60 * 30 // Extended to 30 minutes for OAuth flow
    })

    // if (inviteCode && inviteCodeId) {
    //   response.cookies.set('signup_invite_code', inviteCode, {
    //     httpOnly: true,
    //     secure: isProduction,
    //     sameSite: isProduction ? 'none' : 'lax',
    //     path: '/',
    //     maxAge: 60 * 30
    //   })

    //   response.cookies.set('signup_invite_code_id', inviteCodeId, {
    //     httpOnly: true,
    //     secure: isProduction,
    //     sameSite: isProduction ? 'none' : 'lax',
    //     path: '/',
    //     maxAge: 60 * 30
    //   })
    // }

    return response

  } catch (error) {
    console.error('Signup preparation error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', success: false },
      { status: 500 }
    )
  }
}
