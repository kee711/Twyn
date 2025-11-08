'use client'

import { useEffect, useRef } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useSession } from 'next-auth/react'

/**
 * MiniAppInitializer Component
 * 
 * This component handles the initialization of the Farcaster Mini App SDK.
 * It ensures that sdk.actions.ready() is called when the app is fully loaded
 * and automatically links Farcaster account with signer approval.
 */
export function MiniAppInitializer() {
    const initializationAttempted = useRef(false)
    const readyCallMade = useRef(false)
    const farcasterLinked = useRef(false)
    const { data: session } = useSession()

    useEffect(() => {
        // Prevent multiple initialization attempts
        if (initializationAttempted.current) {
            return
        }

        initializationAttempted.current = true

        const initializeMiniApp = async () => {
            // Only run in browser environment
            if (typeof window === 'undefined') {
                return
            }

            // Multiple attempts with different timing strategies
            const attempts = [
                { delay: 0, name: 'immediate' },
                { delay: 100, name: 'short delay' },
                { delay: 500, name: 'medium delay' },
                { delay: 1000, name: 'long delay' }
            ]

            for (const attempt of attempts) {
                if (readyCallMade.current) {
                    break
                }

                await new Promise(resolve => setTimeout(resolve, attempt.delay))

                try {
                    console.log(`[MiniApp] Attempting ready call (${attempt.name})...`)

                    // Call ready to notify the Farcaster client that the app is loaded
                    await sdk.actions.ready()
                    console.log('[MiniApp] ✅ Ready notification sent successfully')
                    readyCallMade.current = true
                    break

                } catch (error) {
                    console.log(`[MiniApp] Ready call failed (${attempt.name}):`, error)
                    console.error('[MiniApp] Error details:', {
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        type: typeof error,
                        error
                    })

                    // If this is the last attempt, log final status
                    if (attempt === attempts[attempts.length - 1]) {
                        console.log('[MiniApp] ℹ️ All ready call attempts failed - likely not in Farcaster mini app environment')
                    }
                }
            }
        }

        // Initialize with a small delay to ensure DOM is ready
        const timeoutId = setTimeout(initializeMiniApp, 50)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [])

    // Auto-link Farcaster account when user is authenticated
    useEffect(() => {
        if (!session?.user?.id || farcasterLinked.current || !readyCallMade.current) {
            return
        }

        const linkFarcasterAccount = async () => {
            try {
                console.log('[MiniApp] Attempting to get Farcaster context...')

                // Get Farcaster context from Base App
                const context = await sdk.context
                console.log('[MiniApp] Context received:', context)

                if (context?.user?.fid) {
                    console.log('[MiniApp] Farcaster FID found:', context.user.fid)
                    farcasterLinked.current = true

                    // Link Farcaster account with auto-approved signer
                    const response = await fetch('/api/farcaster/account', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fid: context.user.fid,
                            username: context.user.username || `fid-${context.user.fid}`,
                            autoApproveSigner: true, // Flag to auto-approve signer
                        }),
                    })

                    const data = await response.json()

                    if (data.ok) {
                        console.log('[MiniApp] ✅ Farcaster account linked with auto-approved signer')
                    } else {
                        console.error('[MiniApp] Failed to link Farcaster account:', data.error)
                    }
                } else {
                    console.log('[MiniApp] No Farcaster FID in context')
                }
            } catch (error) {
                console.error('[MiniApp] Error linking Farcaster account:', error)
            }
        }

        // Wait a bit for ready call to complete
        const timeoutId = setTimeout(linkFarcasterAccount, 1500)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [session, readyCallMade.current])

    // This component doesn't render anything
    return null
}