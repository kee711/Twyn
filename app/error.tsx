'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to console
        console.error('[Global Error]:', error)
        console.error('[Error Stack]:', error.stack)
        console.error('[Error Digest]:', error.digest)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-2xl space-y-6 rounded-lg border bg-white p-8 shadow-lg">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold text-red-600">Application Error</h1>
                    <p className="text-lg text-gray-600">
                        Something went wrong!
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
                                    {error.message}
                                </pre>
                                {error.stack && (
                                    <pre className="whitespace-pre-wrap break-words text-gray-600 mt-4 text-[10px]">
                                        {error.stack}
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
                                navigator.clipboard.writeText(
                                    `Error: ${error.message}\n\nStack: ${error.stack}\n\nDigest: ${error.digest}`
                                )
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
                        <div className="text-xs space-y-1 font-mono">
                            <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
                            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                            {error.digest && <p><strong>Error Digest:</strong> {error.digest}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
