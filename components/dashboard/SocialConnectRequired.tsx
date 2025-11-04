'use client'

import { useState, useCallback, useRef } from 'react'
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { featureFlags } from '@/lib/config/web3'
import { useSignIn, QRCode } from '@farcaster/auth-kit'
import type { StatusAPIResponse } from '@farcaster/auth-client'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Image from 'next/image'

export function SocialConnectRequired() {
    const t = useTranslations('components.socialConnectRequired')
    const { data: session } = useSession()
    const [isFarcasterModalOpen, setIsFarcasterModalOpen] = useState(false)
    const hasProcessedSignInRef = useRef(false)
    const lastProcessedFidRef = useRef<number | null>(null)

    // Farcaster authentication handlers
    const handleFarcasterStatus = useCallback(async (status?: StatusAPIResponse) => {
        if (!status) return;
        const { state, fid, username } = status;
        if (!fid) return;

        if (state && state !== 'completed') {
            return;
        }

        if (hasProcessedSignInRef.current && lastProcessedFidRef.current === fid) {
            return;
        }

        hasProcessedSignInRef.current = true;
        lastProcessedFidRef.current = fid;

        try {
            const response = await fetch('/api/farcaster/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fid, username }),
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Failed to persist Farcaster account');
                throw new Error(errorText);
            }

            toast.success('Farcaster account connected successfully!');

            // Refresh the page to update the account state
            window.location.reload();
        } catch (error) {
            console.error('Farcaster account link failed:', error);
            toast.error('Failed to connect Farcaster account');
        } finally {
            setIsFarcasterModalOpen(false);
        }
    }, []);

    const handleFarcasterError = useCallback((error?: Error) => {
        console.error('Farcaster error:', error);
        toast.error('Farcaster authentication failed');
        setIsFarcasterModalOpen(false);
    }, []);

    const {
        connect: connectFarcaster,
        signIn: signInFarcaster,
        reconnect: reconnectFarcaster,
        isError: isFarcasterError,
        url: farcasterUrl,
        isPolling: isFarcasterPolling,
    } = useSignIn({
        onSuccess: handleFarcasterStatus,
        onStatusResponse: handleFarcasterStatus,
        onError: handleFarcasterError,
    });

    const handleFarcasterConnect = useCallback(async () => {
        try {
            hasProcessedSignInRef.current = false;
            lastProcessedFidRef.current = null;
            setIsFarcasterModalOpen(true);

            if (isFarcasterError) {
                reconnectFarcaster();
            }

            await connectFarcaster();
            signInFarcaster();
        } catch (error) {
            console.error('Farcaster connect failed:', error);
            toast.error('Failed to start Farcaster authentication');
            setIsFarcasterModalOpen(false);
        }
    }, [connectFarcaster, isFarcasterError, reconnectFarcaster, signInFarcaster]);

    // Web3 모드에서는 Farcaster 연결 UI 표시
    if (featureFlags.showOnlyFarcasterAuth()) {
        return (
            <div className="space-y-6 p-4 md:p-6 bg-white w-full h-full rounded-xl shadow-sm flex items-center justify-center">
                <div className="flex flex-col items-center justify-center py-12 text-center max-w-md">
                    {isFarcasterModalOpen && farcasterUrl ? (
                        // QR 코드 표시 상태
                        <div className="flex flex-col items-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                                <Image src="/farcaster-logo.svg" alt="Farcaster" width={32} height={32} />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Connect Your Farcaster Account</h2>
                            <p className="text-muted-foreground mb-6">
                                Scan the QR code with Warpcast to connect your Farcaster account and start using the app.
                            </p>
                            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                                <QRCode uri={farcasterUrl} size={200} />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-medium text-gray-900">
                                    Scan with Warpcast
                                </p>
                                <p className="text-xs text-gray-500">
                                    Open Warpcast app and scan this QR code to connect
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsFarcasterModalOpen(false)}
                                className="mt-4"
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        // 연결 버튼 상태
                        <div className="flex flex-col items-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                                <Image src="/farcaster-logo.svg" alt="Farcaster" width={32} height={32} />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Connect Your Farcaster Account</h2>
                            <p className="text-muted-foreground mb-6">
                                To use this app, you need to connect your Farcaster account. This allows you to create and manage content for your Farcaster profile.
                            </p>
                            <Button
                                onClick={handleFarcasterConnect}
                                size="lg"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={isFarcasterPolling}
                            >
                                {isFarcasterPolling ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Image src="/farcaster-logo.svg" alt="Farcaster" width={20} height={20} className="mr-2" />
                                        Connect with Farcaster
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-gray-500 mt-4">
                                You'll need the Warpcast app to complete the connection
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // 일반 모드에서는 기존 Threads 연결 UI 표시
    return (
        <div className="space-y-6 p-4 md:p-6 bg-white w-full h-full rounded-xl shadow-sm flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">{t('title')}</h2>
                <p className="text-muted-foreground mb-4">
                    {t('noAccount.description')}
                </p>
                <Button onClick={() => window.location.href = "/api/threads/oauth"}>
                    {t('noAccount.connectButton')}
                </Button>
            </div>
        </div>
    )
}