import { NextResponse } from 'next/server'

export default function DebugEnvPage() {
    const envVars = {
        NEXT_PUBLIC_WEB3_MODE: process.env.NEXT_PUBLIC_WEB3_MODE,
        NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
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
                <p className="text-lg">
                    <strong>Web3 Mode: </strong>
                    <span className={`px-2 py-1 rounded ${process.env.NEXT_PUBLIC_WEB3_MODE === 'true'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                        {process.env.NEXT_PUBLIC_WEB3_MODE === 'true' ? 'ENABLED' : 'DISABLED'}
                    </span>
                </p>
            </div>

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