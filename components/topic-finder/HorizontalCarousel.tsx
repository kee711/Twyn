import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PropsWithChildren } from 'react';

interface HorizontalCarouselProps extends PropsWithChildren {
  title?: string;
  className?: string;
}

export function HorizontalCarousel({ title, className, children }: HorizontalCarouselProps) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-full"
    >
      {title && (
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/70 mb-2 ml-1">
          {title}
        </h3>
      )}
      <div
        className={cn(
          'flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory',
          'scrollbar-thin scrollbar-thumb-muted/60 scrollbar-track-transparent',
          className
        )}
      >
        {children}
      </div>
    </motion.section>
  );
}
