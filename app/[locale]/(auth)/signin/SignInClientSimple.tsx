'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'

export default function SignInClientSimple() {
    const [logs, setLogs] = useState<string[]>(['SignIn page loaded'])
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { data: session, status } = useSession()

    const addLog = (message: string) => {
        console.log('[SignIn]', message)
        setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
    }

    useEffect(() => {
        addLog(`Session status: ${status}`)
        if (session) {
            addLog(`User logged in: ${session.user?.email}`)
        }
    }, [session, status])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        addLog(`Attempting login with: ${email}`)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            addLog(`Login result: ${JSON.stringify(result)}`)

            if (result?.ok) {
                addLog('Login successful! Redirecting...')
                window.location.href = '/contents/topic-finder-test'
            } else {
                addLog(`Login failed: ${result?.error}`)
            }
        } catch (error) {
            addLog(`Login error: ${error}`)
        }
    }

    const handleGoogleLogin = async () => {
        addLog('Starting Google login...')
        try {
            await signIn('google', {
                callbackUrl: '/contents/topic-finder',
                redirect: true
            })
        } catch (error) {
            addLog(`Google login error: ${error}`)
        }
    }

    if (status === 'authenticated') {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Already logged in!</h1>
                <p>Email: {session?.user?.email}</p>
                <button
                    onClick={() => window.location.href = '/contents/topic-finder-test'}
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
                    Go to Dashboard
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
                Sign In Page (Working Version)
            </h1>

            {/* Login Form */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '20px',
                maxWidth: '400px'
            }}>
                <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Login</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '10px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            padding: '10px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                    <button
                        type="submit"
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
                        Sign In with Email
                    </button>
                </form>

                <div style={{ margin: '15px 0', textAlign: 'center', color: '#999' }}>or</div>

                <button
                    onClick={handleGoogleLogin}
                    style={{
                        width: '100%',
                        padding: '10px 20px',
                        fontSize: '14px',
                        backgroundColor: '#fff',
                        color: '#333',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Sign In with Google
                </button>

                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <button
                        onClick={() => window.location.href = '/signup'}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#2196f3',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '14px'
                        }}
                    >
                        Don't have an account? Sign up
                    </button>
                </div>
            </div>

            {/* Logs */}
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

            <button
                onClick={() => window.location.href = '/ko/test-base'}
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
    )
}
