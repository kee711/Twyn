'use client'

import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export function SocialConnectRequired() {
    const t = useTranslations('components.socialConnectRequired')

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