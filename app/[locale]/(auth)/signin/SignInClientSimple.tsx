'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SignInClientSimple() {
    const [logs, setLogs] = useState<string[]>(['SignIn page loaded'])

    const addLog = (message: string) => {
        console.log('[SignIn]', message)
        setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
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
                Sign In Page (Simple)
            </h1>

            <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Logs:</h2>
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
            </div>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
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
                    onClick={() => {
                        addLog('Going back to test page')
                        window.location.href = '/ko/test-base'
                    }}
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
                    Back to Test Page
                </button>
            </div>

            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffc107'
            }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                    ℹ️ This is a simplified sign-in page for debugging.
                    If this loads, the problem is in the original SignInClient component.
                </p>
            </div>
        </div>
    )
}
