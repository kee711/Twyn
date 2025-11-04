'use client'

import { useEffect, useRef } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

/**
 * MiniAppInitializer Component
 * 
 * This component handles the initialization of the Farcaster Mini App SDK.
 * It ensures that sdk.actions.ready() is called when the app is fully loaded.
 */
export function MiniAppInitializer() {
    const initializationAttempted = useRef(false)
    const readyCallMade = useRef(false)

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

    // This component doesn't render anything
    return null
}