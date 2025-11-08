'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function SidebarSimple({ className }: { className?: string }) {
    const { data: session, status } = useSession()
    const pathname = usePathname()

    useEffect(() => {
        console.log('[SidebarSimple] Session status:', status)
        console.log('[SidebarSimple] Session data:', session)
    }, [session, status])

    const navItems = [
        { name: 'Topic Finder', href: '/contents/topic-finder', icon: '🔍' },
        { name: 'Draft', href: '/contents/draft', icon: '📝' },
        { name: 'Schedule', href: '/schedule', icon: '📅' },
        { name: 'Settings', href: '/settings', icon: '⚙️' },
    ]

    const isActive = (href: string) => pathname?.includes(href)

    // Show loading state
    if (status === 'loading') {
        return (
            <div className={className} style={{
                width: '250px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{ fontSize: '14px', color: '#999' }}>Loading...</div>
            </div>
        )
    }

    // Show error state if not authenticated
    if (status === 'unauthenticated') {
        return (
            <div className={className} style={{
                width: '250px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{ fontSize: '14px', color: '#ff6b6b', textAlign: 'center' }}>
                    Not authenticated
                </div>
                <button
                    onClick={() => window.location.href = '/signin'}
                    style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Go to Sign In
                </button>
            </div>
        )
    }

    return (
        <div className={className} style={{
            width: '250px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
        }}>
            {/* Logo */}
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Twyn</h1>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1 }}>
                {navItems.map((item) => (
                    <a
                        key={item.href}
                        href={item.href}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'white',
                            backgroundColor: isActive(item.href) ? '#333' : 'transparent',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive(item.href)) {
                                e.currentTarget.style.backgroundColor = '#2a2a2a'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(item.href)) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                            }
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <span>{item.name}</span>
                    </a>
                ))}
            </nav>

            {/* User Info */}
            <div style={{
                borderTop: '1px solid #333',
                paddingTop: '20px',
                marginTop: '20px'
            }}>
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        {session?.user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {session?.user?.email}
                    </div>
                </div>

                <button
                    onClick={async () => {
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
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#444'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#333'
                    }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    )
}
