import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '../ui/button';
import { Dices, Sparkles, Trash } from 'lucide-react';
import { useState } from 'react';
import { on } from 'node:events';
import { hash } from 'node:crypto';
import { X } from 'lucide-react';
import { Alert } from '../ui/alert';
import { useTranslations } from 'next-intl';

interface HeadlineButtonsProps {
  onCreateDetails: () => void;
  onGenerateTopics: () => void;
  IsIdeasLoading?: boolean;
  IsCreateDetailsLoading?: boolean;
  hasHeadline?: boolean;
}

export function HeadlineButtons({ onCreateDetails, onGenerateTopics, IsIdeasLoading, IsCreateDetailsLoading, hasHeadline }: HeadlineButtonsProps) {
  const t = useTranslations('pages.contents.topicFinder');

  return (
    <div className="w-full max-w-3xl flex justify-between items-center mt-3 flex-wrap">
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