'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Plus, Send } from 'lucide-react';

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInputBar({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Ask anything…',
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!disabled) {
          onSubmit();
        }
      }
    },
    [disabled, onSubmit]
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const resize = () => {
      if (!textareaRef.current) return;
      const target = textareaRef.current;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
      const lineHeight = parseInt(window.getComputedStyle(target).lineHeight || '24', 10);
      setIsExpanded(target.scrollHeight > lineHeight + 4);
    };

    resize();
  }, [value]);

  const containerStyles = useMemo(
    () =>
      cn(
        'p-2 flex w-full gap-3 border border-border/60 rounded-[28px] bg-white shadow-sm transition-all',
        isExpanded ? 'items-end' : 'items-center'
      ),
    [isExpanded]
  );

  return (
    <div className="border-border/60 bg-background/95 px-4 py-12 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full max-w-3xl">
        <div className={containerStyles}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors',
              disabled ? 'cursor-not-allowed opacity-50' : 'hover:text-foreground'
            )}
            aria-label="Add attachment"
          >
            <Plus className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          />

          <div className="flex items-center gap-2 self-end">
            {/* <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors',
                disabled ? 'cursor-not-allowed opacity-50' : 'hover:text-foreground'
              )}
              aria-label="Record voice"
            >
              <Mic className="h-5 w-5" />
            </button> */}
            <Button
              type="button"
              size="icon"
              disabled={disabled || value.trim().length === 0}
              onClick={onSubmit}
              className="h-11 w-11 rounded-full bg-black text-white transition-colors hover:bg-black/90"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
