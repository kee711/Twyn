'use client'

import { useEffect, useState } from 'react'

export default function TestBasePage() {
    const [logs, setLogs] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    const addLog = (message: string) => {
        console.log('[TestBase]', message)
        setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
    }

    useEffect(() => {
        addLog('Page mounted')

        try {
            addLog('Checking window object...')
            addLog(`Window exists: ${typeof window !== 'undefined'}`)

            if (typeof window !== 'undefined') {
                addLog(`Location: ${window.location.href}`)
                addLog(`User Agent: ${window.navigator.userAgent}`)

                // Check for Base mini app context
                addLog('Checking for Base context...')
                const hasBase = window.location.hostname.includes('base.eth') ||
                    window.navigator.userAgent.includes('Base')
                addLog(`Is Base mini app: ${hasBase}`)
            }

            addLog('All checks passed!')
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            addLog(`ERROR: ${errorMsg}`)
            setError(errorMsg)
        }
    }, [])

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#f0f0f0',
            minHeight: '100vh'
        }}>
            <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
                Base Mini App Test Page
            </h1>

            {error && (
                <div style={{
                    padding: '10px',
                    backgroundColor: '#ffebee',
                    border: '1px solid #f44336',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    color: '#c62828'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd'
            }}>
                <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Logs:</h2>
                {logs.length === 0 ? (
                    <p style={{ color: '#999' }}>No logs yet...</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {logs.map((log, index) => (
                            <li key={index} style={{
                                padding: '5px 0',
                                borderBottom: '1px solid #eee'
                            }}>
                                {log}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                border: '1px solid #2196f3'
            }}>
                <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Instructions:</h3>
                <p style={{ margin: '5px 0' }}>
                    1. If you see this page, the app is loading successfully
                </p>
                <p style={{ margin: '5px 0' }}>
                    2. Check the logs above for any errors
                </p>
                <p style={{ margin: '5px 0' }}>
                    3. Take a screenshot and share if there are issues
                </p>
            </div>

            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={() => {
                        addLog('Button clicked!')
                        alert('Button works!')
                    }}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Test Button
                </button>

                <button
                    onClick={() => {
                        window.location.href = '/signin'
                    }}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: '10px'
                    }}
                >
                    Go to Sign In
                </button>
            </div>
        </div>
    )
}
