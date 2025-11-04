'use client'

import { useEffect, useRef } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

/**
 * useMiniAppReady Hook
 * 
 * This hook ensures that sdk.actions.ready() is called when a page component mounts.
 * It provides an additional layer of ready notification for critical pages.
 */
export function useMiniAppReady() {
    const readyAttempted = useRef(false)

    useEffect(() => {
        if (readyAttempted.current) {
            return
        }

        readyAttempted.current = true

        const notifyReady = async () => {
            if (typeof window === 'undefined') {
                return
            }

            try {
                console.log('[useMiniAppReady] Sending ready notification...')
                await sdk.actions.ready()
                console.log('[useMiniAppReady] ✅ Ready notification sent')
            } catch (error) {
                console.log('[useMiniAppReady] ℹ️ Ready call failed (expected in browser):', error)
            }
        }

        // Small delay to ensure page is loaded
        const timeoutId = setTimeout(notifyReady, 200)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [])
}