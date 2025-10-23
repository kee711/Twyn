"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link2 } from 'lucide-react';

interface TextResponseProps {
  title?: string;
  content: string;
  links?: Array<{ id: string; label: string; url: string }>;
}

export function TextResponse({ title, content, links = [] }: TextResponseProps) {
  const hasLinks = links.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="w-full space-y-2 text-left"
    >
      {title && (
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/70">
          {title}
        </h3>
      )}
      <p className={cn('text-base leading-relaxed text-foreground/90 whitespace-pre-wrap break-words')}>
        {content}
      </p>
      {hasLinks && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              aria-label={`Open ${link.label} in a new tab`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/70 hover:text-primary"
            >
              <Link2 className="h-4 w-4" />
            </a>
          ))}
        </div>
      )}
    </motion.section>
  );
}
