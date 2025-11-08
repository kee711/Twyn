'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function TopicFinderSimple() {
    const { data: session } = useSession()
    const [message, setMessage] = useState('')

    return (
        <div style={{
            padding: '40px 20px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '20px'
            }}>
                <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#333' }}>
                    Topic Finder
                </h1>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    Welcome, {session?.user?.name || session?.user?.email}!
                </p>

                <div style={{
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Quick Start</h2>
                    <p style={{ color: '#666', marginBottom: '15px' }}>
                        The full Topic Finder is being optimized for Base mini app.
                        For now, you can use the basic features below.
                    </p>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What would you like to create content about?"
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px',
                            fontSize: '14px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                        }}
                    />

                    <button
                        onClick={() => {
                            if (message.trim()) {
                                alert(`Topic saved: ${message}\n\nFull AI features coming soon!`)
                                setMessage('')
                            }
                        }}
                        style={{
                            marginTop: '10px',
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
                        Generate Ideas
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px',
                    marginTop: '30px'
                }}>
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        border: '1px solid #2196f3'
                    }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#1976d2' }}>
                            📝 Draft
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                            Create and edit your content
                        </p>
                        <button
                            onClick={() => window.location.href = '/contents/draft'}
                            style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                backgroundColor: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Go to Draft
                        </button>
                    </div>

                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f3e5f5',
                        borderRadius: '8px',
                        border: '1px solid #9c27b0'
                    }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#7b1fa2' }}>
                            📅 Schedule
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                            Plan your content calendar
                        </p>
                        <button
                            onClick={() => window.location.href = '/schedule'}
                            style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                backgroundColor: '#9c27b0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Go to Schedule
                        </button>
                    </div>

                    <div style={{
                        padding: '20px',
                        backgroundColor: '#fff3e0',
                        borderRadius: '8px',
                        border: '1px solid #ff9800'
                    }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#f57c00' }}>
                            ⚙️ Settings
                        </h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                            Manage your account
                        </p>
                        <button
                            onClick={() => window.location.href = '/settings'}
                            style={{
                                padding: '8px 16px',
                                fontSize: '13px',
                                backgroundColor: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Go to Settings
                        </button>
                    </div>
                </div>
            </div>

            <div style={{
                backgroundColor: '#fff8e1',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #ffc107'
            }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#f57f17' }}>
                    ℹ️ Note
                </h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                    This is a simplified version of Topic Finder optimized for Base mini app.
                    The full AI-powered features are being optimized and will be available soon.
                </p>
            </div>
        </div>
    )
}
