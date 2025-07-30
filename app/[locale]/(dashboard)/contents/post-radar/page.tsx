'use client';

import { ContentList } from "@/components/contents-helper/ContentList";
import { useLocaleContext } from '@/components/providers/LocaleProvider';

export default function PostRadarPage() {
    const { t } = useLocaleContext();

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6">{t('pages.contents.postRadar.title')}</h1>
            <ContentList category="external" title={t('pages.contents.postRadar.title')} />
        </div>
    );
} 