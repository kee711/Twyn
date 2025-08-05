'use client'

import { ContentList } from "@/components/contents-helper/ContentList";
import { useTranslations } from 'next-intl';

export default function DraftPage() {
  const t = useTranslations('pages.contents.draft');
  
  return (
    <div className="h-full w-full overflow-hidden flex flex-col p-6">
      <h1 className="text-3xl font-bold text-zinc-700 mb-6">{t('title')}</h1>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 rounded-[32px] p-6 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ContentList category="saved" title={t('title')} />
        </div>
      </div>
    </div>
  );
} 