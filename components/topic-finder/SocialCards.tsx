import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MouseEvent } from 'react';

export interface NormalizedSocialContent {
  id: string;
  authorName?: string;
  handle?: string;
  avatarUrl?: string;
  createdAt?: string;
  text: string;
  link?: string;
  mediaUrls?: string[];
  metrics?: {
    replies?: number;
    likes?: number;
    reposts?: number;
  };
}

interface SocialCardProps {
  item: NormalizedSocialContent;
  onRepurpose: (item: NormalizedSocialContent) => void;
  variant: 'threads' | 'x';
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

function SocialCard({ item, onRepurpose, variant }: SocialCardProps) {
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

        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {item.text}
        </p>
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
            {item.metrics?.likes !== undefined && (
              <span>♥ {item.metrics.likes}</span>
            )}
            {item.metrics?.reposts !== undefined && (
              <span>↻ {item.metrics.reposts}</span>
            )}
            {item.metrics?.replies !== undefined && (
              <span>💬 {item.metrics.replies}</span>
            )}
          </div>
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
          styles.background
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
        styles.background
      )}
    >
      {CardBody}
    </motion.article>
  );
}

interface PlatformCardProps {
  item: NormalizedSocialContent;
  onRepurpose: (item: NormalizedSocialContent) => void;
}

export function ThreadsCard({ item, onRepurpose }: PlatformCardProps) {
  return <SocialCard item={item} onRepurpose={onRepurpose} variant="threads" />;
}

export function XCard({ item, onRepurpose }: PlatformCardProps) {
  return <SocialCard item={item} onRepurpose={onRepurpose} variant="x" />;
}
