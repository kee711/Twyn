'use client'

import { ContentList } from "@/components/contents-helper/ContentList";
import { useTranslations } from 'next-intl';

export default function PostRadarPage() {
    const t = useTranslations('pages.contents.postRadar');
    
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
            <ContentList category="external" title={t('title')} />
        </div>
    );
} 