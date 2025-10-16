import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ContextBadge {
  label: string;
  value: string;
}

interface ConversationHeaderProps {
  headline: string;
  badges: ContextBadge[];
  isActive: boolean;
}

export function ConversationHeader({ headline, badges, isActive }: ConversationHeaderProps) {
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      animate={isActive ? { scale: 0.92, opacity: 0.95 } : { scale: 1, opacity: 1 }}
      style={{ originX: 0, originY: 0 }}
      className={cn(
        'flex flex-col gap-3',
        isActive ? 'text-left' : 'text-center items-start mx-auto'
      )}
    >
      {headline && (
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className={cn(
            'rounded-3xl px-4 py-3 font-semibold text-base md:text-lg text-foreground/90 bg-muted/60',
            isActive ? 'text-left shadow-sm' : 'text-center shadow-sm'
          )}
        >
          {headline}
        </motion.div>
      )}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className={cn(
          'flex flex-wrap gap-2',
          isActive ? 'justify-start' : 'justify-center'
        )}
      >
        {badges.map((badge) => (
          <Badge
            key={`${badge.label}-${badge.value}`}
            variant="secondary"
            className="rounded-full bg-background/80 border-border/60 text-sm font-medium px-3 py-1 text-muted-foreground"
          >
            <span className="text-muted-foreground/70 mr-1">{badge.label}</span>
            <span className="text-foreground/90">{badge.value}</span>
          </Badge>
        ))}
      </motion.div>
    </motion.div>
  );
}
