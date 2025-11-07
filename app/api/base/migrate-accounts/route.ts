import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Base Account Migration Handler
 * 
 * This endpoint migrates existing Base Account users to have social_accounts entries
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[Base Account Migration] Starting migration...')

        // Check environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            console.error('[Base Account Migration] Missing NEXT_PUBLIC_SUPABASE_URL');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Use Service Role Key for admin operations
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseKey || supabaseKey.includes('YourActual')) {
            console.error('[Base Account Migration] No valid Supabase service role key available');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            supabaseKey
        )

        console.log('[Base Account Migration] Supabase client created successfully');

        // Find all users with base_account_address but no social_accounts
        const { data: baseUsers, error: fetchError } = await supabase
            .from('user_profiles')
            .select('user_id, base_account_address')
            .not('base_account_address', 'is', null)

        if (fetchError) {
            console.error('[Base Account Migration] Error fetching base users:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        if (!baseUsers || baseUsers.length === 0) {
            console.log('[Base Account Migration] No Base Account users found');
            return NextResponse.json({
                success: true,
                message: 'No users to migrate',
                migrated: 0
            });
        }

        console.log(`[Base Account Migration] Found ${baseUsers.length} Base Account users`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const user of baseUsers) {
            try {
                const { user_id, base_account_address } = user;

                if (!base_account_address) {
                    skippedCount++;
                    continue;
                }

                // Check if social_accounts entry already exists
                const socialId = base_account_address.toLowerCase();
                const { data: existingSocialAccount } = await supabase
                    .from('social_accounts')
                    .select('id')
                    .eq('owner', user_id)
                    .eq('platform', 'farcaster')
                    .eq('social_id', socialId)
                    .maybeSingle();

                if (existingSocialAccount) {
                    console.log(`[Base Account Migration] User ${user_id} already has social account`);
                    skippedCount++;
                    continue;
                }

                // Create social_accounts entry
                const { data: socialAccount, error: socialError } = await supabase
                    .from('social_accounts')
                    .insert({
                        owner: user_id,
                        platform: 'farcaster',
                        social_id: socialId,
                        username: `${base_account_address.slice(0, 6)}...${base_account_address.slice(-4)}`,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (socialError) {
                    console.error(`[Base Account Migration] Failed to create social account for ${user_id}:`, socialError);
                    errorCount++;
                    continue;
                }

                console.log(`[Base Account Migration] Created social account for ${user_id}:`, socialAccount.id);

                // Set as selected account
                const { error: selectionError } = await supabase
                    .from('user_selected_accounts')
                    .upsert({
                        user_id: user_id,
                        platform: 'farcaster',
                        social_account_id: socialAccount.id,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id,platform' });

                if (selectionError) {
                    console.error(`[Base Account Migration] Failed to set selected account for ${user_id}:`, selectionError);
                    // Don't count as error since social account was created
                }

                migratedCount++;
                console.log(`[Base Account Migration] Successfully migrated user ${user_id}`);

            } catch (error) {
                console.error(`[Base Account Migration] Error processing user ${user.user_id}:`, error);
                errorCount++;
            }
        }

        console.log('[Base Account Migration] Migration completed', {
            total: baseUsers.length,
            migrated: migratedCount,
            skipped: skippedCount,
            errors: errorCount,
        });

        return NextResponse.json({
            success: true,
            message: 'Migration completed',
            stats: {
                total: baseUsers.length,
                migrated: migratedCount,
                skipped: skippedCount,
                errors: errorCount,
            }
        });

    } catch (error) {
        console.error('[Base Account Migration] Migration error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
