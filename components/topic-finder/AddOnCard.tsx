'use client';

import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckCircle2, Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface AddOnOption {
    id: string;
    name: string;
    description?: string | null;
    is_public?: boolean;
}

interface AddOnCardProps {
    title?: string;
    options: AddOnOption[];
    selectedIds: string[];
    onToggle: (option: AddOnOption) => void;
    onCreateNew: () => void;
    onEdit?: (option: AddOnOption) => void;
    disabled?: boolean;
    loading?: boolean;
}

export function AddOnCard({
    title,
    options,
    selectedIds,
    onToggle,
    onCreateNew,
    onEdit,
    disabled,
    loading,
}: AddOnCardProps) {
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.contents.topicFinder');
    const activatedCount = selectedIds.length;
    const cardTitle = title ?? t('addOnTitle');

    const description = useMemo(() => {
        if (loading) return t('loading');
        if (activatedCount === 0) return t('selectAddOn');
        if (activatedCount === 1) return t('activatedSingle');
        return t('activatedMultiple', { count: activatedCount });
    }, [activatedCount, loading, t]);

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
                        {/* Do not show icon on mobile */}
                        <CheckCircle2 className={cn('h-3 w-3', selectedIds.length > 0 ? 'text-neutral-900' : 'text-neutral-300')} />
                        {cardTitle}
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-neutral-100/80 sm:px-3 px-2 py-2 text-xs font-medium text-neutral-700">
                        <span className="truncate">{description}</span>
                        <div className="items-center gap-2 hidden sm:flex">
                            <Plus className="h-4 w-4 text-neutral-500" />
                        </div>
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <div className="max-h-72 overflow-y-auto p-3">
                    {options.length === 0 && !loading ? (
                        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
                            {t('noAddOns')}
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {options.map(option => {
                                const active = selectedIds.includes(option.id);
                                return (
                                    <div
                                        key={option.id}
                                        className={cn(
                                            'relative flex h-full flex-col rounded-xl border px-3 py-3 text-left transition pr-10',
                                            active
                                                ? 'border-neutral-500 bg-neutral-800 text-white shadow-lg'
                                                : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onToggle(option)}
                                            className="flex w-full flex-col items-start text-left"
                                        >
                                            <span className="text-sm font-semibold">{option.name}</span>
                                            {option.description ? (
                                                <span className={cn('mt-1 text-xs', active ? 'text-neutral-200' : 'text-neutral-500 line-clamp-3')}>
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
                                                className={cn(
                                                    'absolute right-2 top-2 rounded-full p-1 text-neutral-300 transition focus:outline-none',
                                                    active
                                                        ? 'hover:bg-neutral-700/80 hover:text-white'
                                                        : 'text-neutral-400 hover:bg-neutral-200/80 hover:text-neutral-700'
                                                )}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
