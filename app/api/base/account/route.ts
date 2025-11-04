import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Base Account Authentication Handler
 * 
 * This endpoint handles Base Account authentication and user creation/login using CDP.
 */
export async function POST(request: NextRequest) {
    try {
        const { address, isSignIn } = await request.json()

        if (!address) {
            return NextResponse.json(
                { error: 'Base Account address is required' },
                { status: 400 }
            )
        }

        // Validate address format
        if (!address.startsWith('0x') || address.length !== 42) {
            return NextResponse.json(
                { error: 'Invalid Base Account address format' },
                { status: 400 }
            )
        }

        console.log('[Base Account API] Processing authentication for address:', address)

        // Check environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            console.error('[Base Account API] Missing NEXT_PUBLIC_SUPABASE_URL');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Try to use Service Role Key, fallback to anon key for development
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY &&
            !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YourActual')
            ? process.env.SUPABASE_SERVICE_ROLE_KEY
            : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseKey) {
            console.error('[Base Account API] No valid Supabase key available');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            supabaseKey
        )

        console.log('[Base Account API] Supabase client created successfully');

        // Check if user already exists with this Base Account address
        const { data: existingUser, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('base_account_address', address)
            .single()

        if (userError && userError.code !== 'PGRST116') {
            console.error('[Base Account API] Database error:', userError);

            // Check if the error is due to missing column
            if (userError.message?.includes('base_account_address')) {
                console.error('[Base Account API] base_account_address column does not exist in user_profiles table');
                return NextResponse.json(
                    { error: 'Database schema not updated. Please add base_account_address column to user_profiles table.' },
                    { status: 500 }
                );
            }

            return NextResponse.json(
                { error: 'Database error', details: userError.message },
                { status: 500 }
            )
        }

        let user = existingUser

        if (!user) {
            // Create new user with Base Account address (user_profiles table structure)
            const userData = {
                email: `${address.toLowerCase()}@base.account`,
                name: `Base User ${address.slice(0, 6)}...${address.slice(-4)}`,
                base_account_address: address,
                email_verified: true,
                provider: 'base_account',
                provider_type: 'web3',
                user_id: `base_${address.toLowerCase()}`,
            }

            const { data: newUser, error: createError } = await supabase
                .from('user_profiles')
                .insert(userData)
                .select()
                .single()

            if (createError) {
                console.error('Failed to create user:', createError)
                return NextResponse.json(
                    { error: 'Failed to create user account' },
                    { status: 500 }
                )
            }

            user = newUser
            // user_profiles 테이블에 직접 생성되므로 별도 프로필 생성 불필요

            console.log('Created new Base Account user:', user.id)
        } else {
            console.log('Existing Base Account user found:', user.id)
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                address: user.base_account_address,
            },
        })

    } catch (error) {
        console.error('Base Account authentication error:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}