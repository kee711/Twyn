'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function SimpleDashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()

    useEffect(() => {
        console.log('[SimpleDashboardLayout] Status:', status)
        console.log('[SimpleDashboardLayout] Session:', session)
    }, [session, status])

    if (status === 'loading') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                fontFamily: 'system-ui'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e0e0e0',
                        borderTop: '4px solid #2196f3',
                        borderRadius: '50%',
                        margin: '0 auto 15px'
                    }} />
                    <p style={{ color: '#666' }}>Loading...</p>
                </div>
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                fontFamily: 'system-ui',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '15px', color: '#d32f2f' }}>
                        Not Authenticated
                    </h2>
                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        Please sign in to access the dashboard.
                    </p>
                    <button
                        onClick={() => window.location.href = '/signin'}
                        style={{
                            padding: '12px 24px',
                            fontSize: '14px',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Go to Sign In
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            {/* Simple Sidebar */}
            <div style={{
                width: '250px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
                    Twyn
                </h1>

                <nav style={{ flex: 1 }}>
                    <a
                        href="/contents/topic-finder"
                        style={{
                            display: 'block',
                            padding: '12px 16px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'white',
                            backgroundColor: '#333'
                        }}
                    >
                        🔍 Topic Finder
                    </a>
                    <a
                        href="/contents/draft"
                        style={{
                            display: 'block',
                            padding: '12px 16px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'white'
                        }}
                    >
                        📝 Draft
                    </a>
                    <a
                        href="/schedule"
                        style={{
                            display: 'block',
                            padding: '12px 16px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'white'
                        }}
                    >
                        📅 Schedule
                    </a>
                    <a
                        href="/debug"
                        style={{
                            display: 'block',
                            padding: '12px 16px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'white'
                        }}
                    >
                        🔍 Debug
                    </a>
                </nav>

                <div style={{
                    borderTop: '1px solid #333',
                    paddingTop: '20px'
                }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                        {session?.user?.name || session?.user?.email}
                    </div>
                    <button
                        onClick={async () => {
                            const { signOut } = await import('next-auth/react')
                            await signOut({ redirect: false })
                            window.location.href = '/signin'
                        }}
                        style={{
                            width: '100%',
                            padding: '8px 16px',
                            fontSize: '14px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                backgroundColor: '#f5f5f5'
            }}>
                {children}
            </div>
        </div>
    )
}
