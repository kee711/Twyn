'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ErrorUIProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ErrorUI({
  title,
  description,
  icon,
  className = ""
}: ErrorUIProps) {
  const t = useTranslations('errors');

  const defaultTitle = t('serverError');
  const defaultDescription = t('serverErrorDescription');

  return (
    <div className={`flex items-center justify-center flex-1 ${className}`}>
      <div className="bg-muted rounded-[20px] w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="rounded-full flex items-center justify-center">
            {icon || <AlertCircle className="w-8 h-8 text-muted-foreground/30" />}
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <h2 className="text-zinc-700 text-xl font-semibold text-center">
              {title || defaultTitle}
            </h2>
            <p className="text-zinc-500 text-sm font-normal text-center max-w-md whitespace-pre-line">
              {description || defaultDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}