'use client'

import { useState, useTransition } from "react";
import { OembedList } from "@/components/contents/OembedList";
import { saveOembedContentFromUrl } from '@/app/actions/oembed';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function SavedPage() {
    const t = useTranslations('pages.contents.saved');
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const [url, setUrl] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const { currentSocialId } = useSocialAccountStore();

    function isValidThreadsUrl(url: string): boolean {
        const regex = /^https:\/\/www\.threads\.net\/@[\w.-]+\/post\/[\w-]+$/;
        return regex.test(url);
    }

    const handleAddUrl = () => {
        if (!isValidThreadsUrl(url)) {
            setError(t('invalidThreadsUrl'));
            return;
        }

        if (!currentSocialId) {
            setError(t('selectSocialAccount'));
            return;
        }

        setError(""); // 이전 에러 지우기
        startTransition(async () => {
            try {
                await saveOembedContentFromUrl(url, currentSocialId);
                setUrl("");
                setRefreshKey(prev => prev + 1); // 리렌더링 유도
                toast.success(t('successfullySaved'));
            } catch (err) {
                console.error(err);
                toast.error(t('errorSaving'));
            }
        });
    };

    return (
        <div className="h-full w-full overflow-hidden flex flex-col p-6">
            <h1 className="text-3xl font-bold text-zinc-700 mb-6">{t('title')}</h1>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-gray-50 rounded-[32px] p-6 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-[20px]">
                        <div className="flex gap-2 items-center">
                            <div className="text-lg font-bold">{t('addByUrl')}</div>
                            <p className="text-sm text-muted-foreground">
                                {t('addThreadsContentByUrl')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="url"
                                placeholder={t('urlPlaceholder')}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                            <Button onClick={handleAddUrl} disabled={isPending}>
                                {isPending ? t('saving') : t('addByUrl')}
                            </Button>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <OembedList key={refreshKey} />
                    </div>
                </div>
            </div>
        </div>
    );
} 