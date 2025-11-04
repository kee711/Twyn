'use client'

import { useEffect, useState, useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

/**
 * useBaseAccount Hook
 * 
 * This hook handles Base Account detection and authentication according to Base documentation.
 * It automatically detects if the user has a Base Account and provides authentication methods.
 */
export function useBaseAccount() {
    const [account, setAccount] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Check for Base Account on mount
    useEffect(() => {
        const checkBaseAccount = async () => {
            if (typeof window === 'undefined') {
                setIsLoading(false)
                return
            }

            try {
                console.log('[useBaseAccount] Checking for Base Account...')

                // Check if we're in a mini app environment
                const inMiniApp = await sdk.isInMiniApp()
                if (!inMiniApp) {
                    console.log('[useBaseAccount] Not in mini app environment')
                    setIsLoading(false)
                    return
                }

                // Get Base Account information
                const accountInfo = await sdk.account.getAccount()

                if (accountInfo && accountInfo.address) {
                    console.log('[useBaseAccount] Base Account detected:', accountInfo.address)
                    setAccount(accountInfo.address)
                    setIsConnected(true)
                } else {
                    console.log('[useBaseAccount] No Base Account found')
                }

            } catch (error) {
                console.log('[useBaseAccount] Error checking Base Account:', error)
                setError(error instanceof Error ? error.message : 'Unknown error')
            } finally {
                setIsLoading(false)
            }
        }

        checkBaseAccount()
    }, [])

    // Connect to Base Account
    const connect = useCallback(async () => {
        if (typeof window === 'undefined') {
            throw new Error('Cannot connect in server environment')
        }

        try {
            setIsLoading(true)
            setError(null)

            console.log('[useBaseAccount] Requesting Base Account connection...')

            // Request Base Account connection
            const result = await sdk.account.requestAccount()

            if (result && result.address) {
                console.log('[useBaseAccount] Base Account connected:', result.address)
                setAccount(result.address)
                setIsConnected(true)
                return result.address
            } else {
                throw new Error('Failed to connect Base Account')
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect Base Account'
            console.error('[useBaseAccount] Connection failed:', error)
            setError(errorMessage)
            throw error
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Disconnect Base Account
    const disconnect = useCallback(() => {
        setAccount(null)
        setIsConnected(false)
        setError(null)
    }, [])

    return {
        account,
        isConnected,
        isLoading,
        error,
        connect,
        disconnect,
    }
}