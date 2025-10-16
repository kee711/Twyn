import { MouseEvent, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { NormalizedSocialContent, ReferenceAnalysis } from './types';

interface SocialCardProps {
  item: NormalizedSocialContent;
  onRepurpose: (item: NormalizedSocialContent) => void;
  variant: 'threads' | 'x';
  referenceAnalysis?: ReferenceAnalysis;
  analysisLoading?: boolean;
}

const platformStyles = {
  threads: {
    accent: 'text-[#16181C]',
    background: 'bg-white',
    badge: 'text-[#8E8E8E]',
  },
  x: {
    accent: 'text-black',
    background: 'bg-white',
    badge: 'text-[#4B5563]',
  },
} as const;

function SocialCard({
  item,
  onRepurpose,
  variant,
  referenceAnalysis,
  analysisLoading,
}: SocialCardProps) {
  const styles = platformStyles[variant];
  const relativeTime = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
    : undefined;

  const handleRepurposeClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (item.link) {
      event.preventDefault();
    }
    onRepurpose(item);
  };

  const [expanded, setExpanded] = useState(false);

  const cardContent = useMemo(() => {
    if (!item.text) return { display: '', overflowed: false };
    const trimmed = item.text.trim();
    if (trimmed.length <= 220) {
      return { display: trimmed, overflowed: false };
    }
    if (expanded) {
      return { display: trimmed, overflowed: true };
    }
    return { display: `${trimmed.slice(0, 220)}…`, overflowed: true };
  }, [item.text, expanded]);

  const CardBody = (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        {item.avatarUrl ? (
          <Image
            src={item.avatarUrl}
            alt={item.authorName || item.handle || 'Author avatar'}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <MessageCircle className="h-5 w-5 text-muted-foreground/70" />
          </div>
        )}
        <div className="flex flex-col">
          <span className={cn('text-sm font-semibold', styles.accent)}>
            {item.authorName || 'Unknown'}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {item.handle ? `@${item.handle}` : relativeTime || 'Just now'}
          </span>
        </div>
      </div>

      {cardContent.display && (
        <div className="flex flex-col gap-1">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {cardContent.display}
          </p>
          {cardContent.overflowed && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="self-start text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {item.mediaUrls && item.mediaUrls.length > 0 && (
        <div className="grid gap-2">
          {item.mediaUrls.map((mediaUrl) => (
            <div key={mediaUrl} className="overflow-hidden rounded-lg border border-border/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl} alt="" className="h-32 w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
          {item.metrics?.likes !== undefined && <span>♥ {item.metrics.likes}</span>}
          {item.metrics?.reposts !== undefined && <span>↻ {item.metrics.reposts}</span>}
          {item.metrics?.replies !== undefined && <span>💬 {item.metrics.replies}</span>}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
        {analysisLoading ? (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ) : referenceAnalysis ? (
          <>
            <span className="font-semibold text-foreground/70">
              {(referenceAnalysis.source === 'model' ? 'Audience fit' : 'Viral score')}{' '}
              {referenceAnalysis.score.toFixed(1)} / 10 (
              {referenceAnalysis.source === 'synced'
                ? 'insights synced'
                : referenceAnalysis.source === 'estimated'
                  ? 'estimated'
                  : 'agent predicted'}
              )
            </span>
            {referenceAnalysis.snippet && (
              <span className="line-clamp-2 text-muted-foreground/80">{referenceAnalysis.snippet}</span>
            )}
            <span>{referenceAnalysis.audienceComment}</span>
          </>
        ) : (
          <span>Analysis unavailable.</span>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="gap-1 text-sm font-medium text-foreground/80"
          onClick={handleRepurposeClick}
        >
          Repurpose
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (item.link) {
    return (
      <motion.a
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15 }}
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'snap-center min-w-[280px] max-w-[320px] rounded-xl border border-border/60 shadow-sm transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          styles.background,
        )}
      >
        {CardBody}
      </motion.a>
    );
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'snap-center min-w-[280px] max-w-[320px] rounded-xl border border-border/60 shadow-sm',
        styles.background,
      )}
    >
      {CardBody}
    </motion.article>
  );
}

interface PlatformCardProps {
  item: NormalizedSocialContent;
  onRepurpose: (item: NormalizedSocialContent) => void;
  referenceAnalysis?: ReferenceAnalysis;
  analysisLoading?: boolean;
}

export function ThreadsCard({
  item,
  onRepurpose,
  referenceAnalysis,
  analysisLoading,
}: PlatformCardProps) {
  return (
    <SocialCard
      item={item}
      onRepurpose={onRepurpose}
      variant="threads"
      referenceAnalysis={referenceAnalysis}
      analysisLoading={analysisLoading}
    />
  );
}

export function XCard({
  item,
  onRepurpose,
  referenceAnalysis,
  analysisLoading,
}: PlatformCardProps) {
  return (
    <SocialCard
      item={item}
      onRepurpose={onRepurpose}
      variant="x"
      referenceAnalysis={referenceAnalysis}
      analysisLoading={analysisLoading}
    />
  );
}
