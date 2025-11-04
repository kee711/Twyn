'use client'

import { isWeb3Mode } from '@/lib/config/web3'
import { useEffect, useState } from 'react'

export default function DebugEnvPage() {
    const [clientInfo, setClientInfo] = useState<any>(null)

    useEffect(() => {
        setClientInfo({
            hostname: window.location.hostname,
            href: window.location.href,
            userAgent: navigator.userAgent,
            isWeb3Mode: isWeb3Mode(),
        })
    }, [])

    const envVars = {
        NEXT_PUBLIC_WEB3_MODE: process.env.NEXT_PUBLIC_WEB3_MODE,
        NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>

            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">Current Environment Variables:</h2>
                <pre className="text-sm">
                    {JSON.stringify(envVars, null, 2)}
                </pre>
            </div>

            <div className="bg-blue-100 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">Web3 Mode Status:</h2>
                <div className="space-y-2">
                    <p className="text-lg">
                        <strong>Environment Variable: </strong>
                        <span className={`px-2 py-1 rounded ${process.env.NEXT_PUBLIC_WEB3_MODE === 'true'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                            }`}>
                            {process.env.NEXT_PUBLIC_WEB3_MODE || 'undefined'}
                        </span>
                    </p>
                    {clientInfo && (
                        <p className="text-lg">
                            <strong>Final Web3 Mode: </strong>
                            <span className={`px-2 py-1 rounded ${clientInfo.isWeb3Mode
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                                }`}>
                                {clientInfo.isWeb3Mode ? 'ENABLED' : 'DISABLED'}
                            </span>
                        </p>
                    )}
                </div>
            </div>

            {clientInfo && (
                <div className="bg-purple-100 p-4 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold mb-4">Client Information:</h2>
                    <pre className="text-sm">
                        {JSON.stringify(clientInfo, null, 2)}
                    </pre>
                </div>
            )}

            <div className="bg-yellow-100 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Required Environment Variables for Web3 Mode:</h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>NEXT_PUBLIC_WEB3_MODE=true</li>
                    <li>NEXT_PUBLIC_DOMAIN=app.twyn.sh</li>
                    <li>NEXT_PUBLIC_FARCASTER_SIWE_URI=https://app.twyn.sh/login</li>
                    <li>NEXT_PUBLIC_FARCASTER_OPTIMISM_RPC_URL=https://mainnet.optimism.io</li>
                    <li>NEXT_PUBLIC_FARCASTER_RELAY_URL=https://relay.farcaster.xyz</li>
                    <li>NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=0d3fbf60fb6ff25889dd0cbd248793b4</li>
                </ul>
            </div>
        </div>
    )
}