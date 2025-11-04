'use client';

import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle2, ChevronDown, Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface PreferenceOption {
    id: string;
    name: string;
    description?: string | null;
    is_public?: boolean;
}

interface PreferenceCardProps {
    title: string;
    options: PreferenceOption[];
    selectedId: string | null;
    onSelect: (option: PreferenceOption) => void;
    onCreateNew: () => void;
    onEdit?: (option: PreferenceOption) => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
}

export function PreferenceCard({
    title,
    options,
    selectedId,
    onSelect,
    onCreateNew,
    onEdit,
    placeholder,
    disabled,
    loading,
}: PreferenceCardProps) {
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.contents.topicFinder');
    const selectedOption = useMemo(() => options.find(option => option.id === selectedId), [options, selectedId]);

    const handleSelect = (option: PreferenceOption) => {
        onSelect(option);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled || loading}
                    className={cn(
                        'w-full rounded-[20px] border border-neutral-200 bg-white/70 sm:px-3 sm:py-3 px-1.5 py-2 text-left shadow-sm transition hover:shadow-md focus:outline-none disabled:cursor-not-allowed disabled:opacity-70',
                        'flex flex-col sm:gap-2 gap-1'
                    )}
                >
                    <div className="flex items-center sm:gap-1.5 gap-0.5 text-[11px] sm:text-xs font-medium text-neutral-600">
                        <CheckCircle2 className={cn('h-3 w-3', selectedId ? 'text-neutral-900' : 'text-neutral-300')} />
                        {title}
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-neutral-100/80 sm:px-3 px-2 py-2 text-xs font-medium text-neutral-700">
                        <span className="!truncate">
                            {loading
                                ? t('loading')
                                : selectedOption?.name || placeholder || t('selectOption', { title })}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 hidden sm:block" />
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 rounded-2xl" align="start">
                <div className="max-h-64 overflow-y-auto p-2">
                    {options.length === 0 && !loading && (
                        <div className="px-3 py-4 text-sm text-muted-foreground">{t('noOptions')}</div>
                    )}
                    {options.map(option => (
                        <div
                            key={option.id}
                            className={cn(
                                'relative mb-1 flex w-full flex-col rounded-xl transition hover:bg-neutral-50',
                                selectedId === option.id && 'bg-neutral-100'
                            )}
                        >
                            <button
                                type="button"
                                onClick={() => handleSelect(option)}
                                className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left pr-10"
                            >
                                <span className="text-xs font-medium text-neutral-800">{option.name}</span>
                                {option.description ? (
                                    <span className="text-xs font-light text-neutral-400 line-clamp-1">
                                        {option.description}
                                    </span>
                                ) : null}
                            </button>
                            {onEdit ? (
                                <button
                                    type="button"
                                    onClick={event => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setOpen(false);
                                        onEdit(option);
                                    }}
                                    className="absolute right-2 top-2 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-200/80 hover:text-neutral-700 focus:outline-none"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            ) : null}
                        </div>
                    ))}
                </div>
                <div className="pb-3">
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            onCreateNew();
                        }}
                        className="flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1 text-xs text-neutral-400 font-medium transition hover:text-neutral-700"
                    >
                        <Plus className="h-4 w-4" />
                        {t('createNew')}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
