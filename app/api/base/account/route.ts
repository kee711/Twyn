import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Base Account Authentication Handler
 * 
 * This endpoint handles Base Account authentication and user creation/login.
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

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Check if user already exists with this Base Account address
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('base_account_address', address)
            .single()

        if (userError && userError.code !== 'PGRST116') {
            console.error('Database error:', userError)
            return NextResponse.json(
                { error: 'Database error' },
                { status: 500 }
            )
        }

        let user = existingUser

        if (!user) {
            // Create new user with Base Account address
            const userData = {
                email: `${address.toLowerCase()}@base.account`,
                name: `Base User ${address.slice(0, 6)}...${address.slice(-4)}`,
                base_account_address: address,
                email_verified: new Date().toISOString(),
            }

            const { data: newUser, error: createError } = await supabase
                .from('users')
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

            // Create user profile
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: user.id,
                    selected_social_id: null,
                })

            if (profileError) {
                console.warn('Failed to create user profile:', profileError)
            }

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