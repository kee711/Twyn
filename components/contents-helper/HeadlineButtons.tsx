import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '../ui/button';
import { Dices, Sparkles, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { on } from 'node:events';
import { hash } from 'node:crypto';
import { X } from 'lucide-react';
import { Alert } from '../ui/alert';
import { useTranslations } from 'next-intl';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentGenerationStore } from '@/lib/stores/content-generation';

interface HeadlineButtonsProps {
  onCreateDetails: () => void;
  onGenerateTopics: () => void;
  IsIdeasLoading?: boolean;
  IsCreateDetailsLoading?: boolean;
  hasHeadline?: boolean;
}

export function HeadlineButtons({ onCreateDetails, onGenerateTopics, IsIdeasLoading, IsCreateDetailsLoading, hasHeadline }: HeadlineButtonsProps) {
  const t = useTranslations('pages.contents.topicFinder');
  const { postType, language, setPostType, setLanguage } = useContentGenerationStore();

  return (
    <div className="w-full max-w-3xl flex justify-between items-center mt-3 flex-wrap gap-2">

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full gap-2 h-full p-3">
              <Settings2 className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-2xl">
            <DropdownMenuLabel>{t('generationSettings')}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <div className="px-2 py-3">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="post-type" className="text-sm font-medium">
                  {t('postType')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {postType === 'single' ? t('single') : t('thread')}
                  </span>
                  <Switch
                    id="post-type"
                    checked={postType === 'thread'}
                    onCheckedChange={(checked) => setPostType(checked ? 'thread' : 'single')}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between space-y-2">
                <label htmlFor="language" className="text-sm font-medium">
                  {t('language')}
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" className="w-30 h-6 rounded-full">
                    <SelectValue placeholder={t('selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onGenerateTopics}
          disabled={IsIdeasLoading}
          className={`
            bg-black rounded-full py-2 px-3 flex justify-center gap-1.5 cursor-pointer relative overflow-hidden
            ${IsIdeasLoading ? 'animate-pulse' : ''}
          `}
        >
          <Dices className="w-4 h-4 text-white" />
          <span className="font-semibold text-sm text-white">
            {t('ideas')}
          </span>
        </Button>
        <Button
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full text-white font-semibold text-sm relative overflow-hidden
            ${IsCreateDetailsLoading ? 'animate-pulse' : ''} ${!hasHeadline ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'}
          `}
          onClick={onCreateDetails}
          disabled={!hasHeadline || IsCreateDetailsLoading}
        >
          <Sparkles className="w-4 h-4" />
          {t('createDetails')}
        </Button>
      </div>
    </div>
  );
}