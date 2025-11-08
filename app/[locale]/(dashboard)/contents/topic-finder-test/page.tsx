'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function TopicFinderTestPage() {
    const { data: session, status } = useSession()
    const [logs, setLogs] = useState<string[]>(['Page loaded'])

    const addLog = (message: string) => {
        console.log('[TopicFinderTest]', message)
        setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
    }

    useEffect(() => {
        addLog(`Session status: ${status}`)
        if (session) {
            addLog(`User: ${session.user?.email}`)
            addLog(`User ID: ${session.user?.id}`)
        }
    }, [session, status])

    if (status === 'loading') {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Loading...</h1>
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Not authenticated</h1>
                <button
                    onClick={() => window.location.href = '/signin'}
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
                    Go to Sign In
                </button>
            </div>
        )
    }

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#f0f0f0',
            minHeight: '100vh'
        }}>
            <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
                Dashboard Test Page
            </h1>

            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Session Info:</h2>
                <p><strong>Email:</strong> {session?.user?.email}</p>
                <p><strong>Name:</strong> {session?.user?.name}</p>
                <p><strong>ID:</strong> {session?.user?.id}</p>
                <p><strong>Provider:</strong> {(session?.user as any)?.provider}</p>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Logs:</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflow: 'auto' }}>
                    {logs.map((log, index) => (
                        <li key={index} style={{
                            padding: '5px 0',
                            borderBottom: '1px solid #eee',
                            fontSize: '11px'
                        }}>
                            {log}
                        </li>
                    ))}
                </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => addLog('Button clicked')}
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
                    Test Log
                </button>

                <button
                    onClick={() => window.location.href = '/contents/topic-finder'}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Go to Real Dashboard
                </button>

                <button
                    onClick={() => window.location.href = '/signin'}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Back to Sign In
                </button>

                <button
                    onClick={async () => {
                        addLog('Signing out...')
                        const { signOut } = await import('next-auth/react')
                        await signOut({ redirect: false })
                        addLog('Signed out')
                        window.location.href = '/signin'
                    }}
                    style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Sign Out
                </button>
            </div>

            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                border: '1px solid #2196f3'
            }}>
                <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Instructions:</h3>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>
                    1. If you see this page, authentication is working
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>
                    2. Click "Go to Real Dashboard" to test the actual dashboard
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>
                    3. If that crashes, the problem is in the dashboard components
                </p>
            </div>
        </div>
    )
}
