'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [errorDetails, setErrorDetails] = useState({
        message: '',
        stack: '',
        digest: '',
        url: '',
        userAgent: '',
        timestamp: ''
    })

    useEffect(() => {
        // Capture error details safely
        const details = {
            message: error?.message || 'Unknown error',
            stack: error?.stack || 'No stack trace available',
            digest: error?.digest || 'N/A',
            url: typeof window !== 'undefined' ? window.location.href : 'N/A',
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
            timestamp: new Date().toISOString()
        }

        setErrorDetails(details)

        // Log the error to console
        console.error('[Dashboard Error]:', error)
        console.error('[Error Stack]:', error?.stack)
        console.error('[Error Digest]:', error?.digest)
        console.error('[Error Details]:', details)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-2xl space-y-6 rounded-lg border bg-white p-8 shadow-lg">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold text-red-600">Dashboard Error</h1>
                    <p className="text-lg text-gray-600">
                        Something went wrong in the dashboard!
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Error Details */}
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <h3 className="text-sm font-semibold mb-2 text-red-800">
                            Error Details:
                        </h3>
                        <div className="space-y-2 text-xs font-mono">
                            <div className="bg-white p-3 rounded border overflow-auto max-h-96">
                                <pre className="whitespace-pre-wrap break-words text-red-600">
                                    {errorDetails.message}
                                </pre>
                                {errorDetails.stack && errorDetails.stack !== 'No stack trace available' && (
                                    <pre className="whitespace-pre-wrap break-words text-gray-600 mt-4 text-[10px]">
                                        {errorDetails.stack}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={reset}
                            size="lg"
                            className="w-full"
                        >
                            🔄 Try Again
                        </Button>

                        <Button
                            onClick={() => {
                                window.location.href = '/contents/topic-finder'
                            }}
                            variant="outline"
                            size="lg"
                            className="w-full"
                        >
                            🏠 Go to Topic Finder
                        </Button>

                        <Button
                            onClick={() => {
                                // Clear all storage
                                if (typeof window !== 'undefined') {
                                    localStorage.clear()
                                    sessionStorage.clear()
                                    // Reload the page
                                    window.location.href = '/signin'
                                }
                            }}
                            variant="outline"
                            size="lg"
                            className="w-full"
                        >
                            🗑️ Clear Storage & Go to Sign In
                        </Button>

                        <Button
                            onClick={() => {
                                const errorText = `Error: ${errorDetails.message}\n\nStack: ${errorDetails.stack}\n\nDigest: ${errorDetails.digest}\n\nURL: ${errorDetails.url}\n\nTimestamp: ${errorDetails.timestamp}`
                                navigator.clipboard.writeText(errorText)
                                alert('Error details copied to clipboard!')
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            📋 Copy Error Details
                        </Button>
                    </div>

                    {/* Debug Info */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <h3 className="text-sm font-semibold mb-2 text-blue-800">
                            Debug Information:
                        </h3>
                        <div className="text-xs space-y-1 font-mono break-all">
                            <p><strong>URL:</strong> {errorDetails.url}</p>
                            <p><strong>User Agent:</strong> {errorDetails.userAgent}</p>
                            <p><strong>Timestamp:</strong> {errorDetails.timestamp}</p>
                            {errorDetails.digest && errorDetails.digest !== 'N/A' && (
                                <p><strong>Error Digest:</strong> {errorDetails.digest}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
