'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
    const { data: session, status } = useSession()
    const [logs, setLogs] = useState<string[]>([])
    const [envInfo, setEnvInfo] = useState<Record<string, any>>({})

    useEffect(() => {
        // Collect environment info
        const info = {
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            sessionStatus: status,
            hasSession: !!session,
        }
        setEnvInfo(info)

        // Add log
        addLog('Debug page loaded')
        addLog(`Session status: ${status}`)
        if (session) {
            addLog(`User: ${session.user?.email}`)
        }
    }, [session, status])

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString()
        setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    }

    const testFetch = async (endpoint: string) => {
        addLog(`Testing fetch: ${endpoint}`)
        try {
            const response = await fetch(endpoint)
            const data = await response.json()
            addLog(`✅ Success: ${endpoint} - Status: ${response.status}`)
            addLog(`Response: ${JSON.stringify(data).substring(0, 100)}...`)
        } catch (error) {
            addLog(`❌ Error: ${endpoint} - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    const clearLogs = () => {
        setLogs([])
        addLog('Logs cleared')
    }

    const copyLogs = () => {
        const logText = logs.join('\n')
        navigator.clipboard.writeText(logText)
        addLog('Logs copied to clipboard')
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-4">🔍 Debug Dashboard</h1>
                <p className="text-gray-600">
                    이 페이지는 미니앱 환경에서 문제를 진단하기 위한 디버그 도구입니다.
                </p>
            </div>

            {/* Environment Info */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">환경 정보</h2>
                <div className="space-y-2 text-sm font-mono">
                    {Object.entries(envInfo).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                            <span className="font-semibold text-blue-600">{key}:</span>
                            <span className="text-gray-700">{String(value)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Session Info */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">세션 정보</h2>
                <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm font-semibold mb-2">Status: {status}</p>
                        {session && (
                            <pre className="text-xs overflow-auto">
                                {JSON.stringify(session, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            </div>

            {/* API Tests */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">API 테스트</h2>
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => testFetch('/api/auth/session')} variant="outline">
                        Test Auth Session
                    </Button>
                    <Button onClick={() => testFetch('/api/user/get-publish-times')} variant="outline">
                        Test Publish Times
                    </Button>
                    <Button onClick={() => testFetch('/api/contents/scheduled')} variant="outline">
                        Test Scheduled Contents
                    </Button>
                    <Button onClick={() => testFetch('/api/farcaster/account')} variant="outline">
                        Test Farcaster Account
                    </Button>
                </div>
            </div>

            {/* Logs */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">로그</h2>
                    <div className="flex gap-2">
                        <Button onClick={copyLogs} size="sm" variant="outline">
                            📋 Copy
                        </Button>
                        <Button onClick={clearLogs} size="sm" variant="outline">
                            🗑️ Clear
                        </Button>
                    </div>
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs h-96 overflow-auto">
                    {logs.length === 0 ? (
                        <p className="text-gray-500">No logs yet...</p>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">네비게이션</h2>
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => window.location.href = '/contents/topic-finder'}>
                        Go to Topic Finder
                    </Button>
                    <Button onClick={() => window.location.href = '/contents/topic-finder-test'}>
                        Go to Topic Finder Test
                    </Button>
                    <Button onClick={() => window.location.href = '/signin'} variant="outline">
                        Go to Sign In
                    </Button>
                    <Button onClick={() => window.location.href = '/'} variant="outline">
                        Go to Home
                    </Button>
                </div>
            </div>
        </div>
    )
}
