'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface HeadlineInputProps {
    value?: string;
    readOnly?: boolean;
    onChange?: (v: string) => void;
    inline?: boolean;
    ellipsis?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    onInstructionChange?: (v: string) => void;
}

export function HeadlineInput({ value, readOnly, onChange, inline, ellipsis, isSelected, onClick, onInstructionChange }: HeadlineInputProps) {
    const t = useTranslations('pages.contents.topicFinder.headlineInput');
    const [headline, setHeadline] = useState<string>(typeof value === 'string' ? value : '');
    const [instruction, setInstruction] = useState<string>('');
    const [placeholder, setPlaceholder] = useState(t('placeholder'));

    useEffect(() => {
        if (value !== undefined) setHeadline(value);
    }, [value]);

    const handleChange = (v: string) => {
        setHeadline(v);
        onChange?.(v);
    };

    if (inline) {
        const shouldTruncate = ellipsis && !isSelected;

        return (
            <div
                onClick={onClick}
                className={cn(
                    'w-full rounded-[20px] px-5 py-3 text-left shadow-sm transition-all duration-300 cursor-pointer',
                    'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
                    isSelected ? 'border border-gray-200 bg-gray-200' : 'border border-transparent bg-gray-50'
                )}
            >
                <div
                    className={cn(
                        'text-base font-medium text-gray-600 sm:text-lg',
                        isSelected && 'text-gray-700',
                        shouldTruncate ? 'truncate' : 'whitespace-pre-line break-words'
                    )}
                >
                    {headline}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl">
            <div className={`w-full h-fit bg-white rounded-[20px] border border-[#E5E5E5] px-3 md:px-4 py-3 flex flex-col gap-1 shadow-sm`}>
                <textarea
                    value={headline}
                    onChange={e => handleChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full min-h-[32px] resize-none overflow-hidden bg-transparent text-lg font-medium placeholder-[#B0B0B0] outline-none px-1 md:px-2"
                    readOnly={readOnly}
                    onClick={onClick}
                    rows={1}
                    ref={(textarea) => {
                        if (textarea) {
                            textarea.style.height = 'auto';
                            textarea.style.height = `${textarea.scrollHeight}px`;
                        }
                    }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                />
                <input
                    type="text"
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    placeholder={t('instructionPlaceholder')}
                    className="w-full bg-transparent text-base font-medium text-gray-500 placeholder-[#B0B0B0] outline-none px-1 md:px-2 md:text-sm"
                    readOnly={readOnly}
                />

            </div>

        </div>
    );
} 
