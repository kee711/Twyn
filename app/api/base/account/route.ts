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
            console.log('[Base Account API] Created new Base Account user:', user.user_id)

            // Create social_accounts entry for Farcaster platform
            const socialId = address.toLowerCase();
            const { data: socialAccount, error: socialError } = await supabase
                .from('social_accounts')
                .insert({
                    owner: user.user_id,
                    platform: 'farcaster',
                    social_id: socialId,
                    username: `${address.slice(0, 6)}...${address.slice(-4)}`,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (socialError) {
                console.error('[Base Account API] Failed to create social_accounts entry:', socialError);
            } else if (socialAccount) {
                console.log('[Base Account API] Created social_accounts entry:', socialAccount.id);

                // Set as selected account
                const { error: selectionError } = await supabase
                    .from('user_selected_accounts')
                    .insert({
                        user_id: user.user_id,
                        platform: 'farcaster',
                        social_account_id: socialAccount.id,
                        updated_at: new Date().toISOString(),
                    });

                if (selectionError) {
                    console.error('[Base Account API] Failed to set selected account:', selectionError);
                } else {
                    console.log('[Base Account API] Set as selected Farcaster account');
                }
            }
        } else {
            console.log('[Base Account API] Existing Base Account user found:', user.user_id)

            // Check if social_accounts entry exists
            const socialId = address.toLowerCase();
            const { data: existingSocialAccount } = await supabase
                .from('social_accounts')
                .select('id')
                .eq('owner', user.user_id)
                .eq('platform', 'farcaster')
                .eq('social_id', socialId)
                .maybeSingle();

            if (!existingSocialAccount) {
                console.log('[Base Account API] Creating missing social_accounts entry for existing user');

                const { data: socialAccount, error: socialError } = await supabase
                    .from('social_accounts')
                    .insert({
                        owner: user.user_id,
                        platform: 'farcaster',
                        social_id: socialId,
                        username: `${address.slice(0, 6)}...${address.slice(-4)}`,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (socialError) {
                    console.error('[Base Account API] Failed to create social_accounts entry:', socialError);
                } else if (socialAccount) {
                    console.log('[Base Account API] Created social_accounts entry:', socialAccount.id);

                    // Set as selected account
                    const { error: selectionError } = await supabase
                        .from('user_selected_accounts')
                        .upsert({
                            user_id: user.user_id,
                            platform: 'farcaster',
                            social_account_id: socialAccount.id,
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'user_id,platform' });

                    if (selectionError) {
                        console.error('[Base Account API] Failed to set selected account:', selectionError);
                    } else {
                        console.log('[Base Account API] Set as selected Farcaster account');
                    }
                }
            } else {
                console.log('[Base Account API] Social account already exists:', existingSocialAccount.id);
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.user_id,
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