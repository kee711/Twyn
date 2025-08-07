'use client';

import { useState, useEffect } from 'react';
import { BadgeInfo, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface ProfileDescriptionDropdownProps {
    accountId: string;
    initialDescription: string;
    onSave?: (newDescription: string) => void;
}

export function ProfileDescriptionDropdown({ accountId, initialDescription, onSave }: ProfileDescriptionDropdownProps) {
    const t = useTranslations('pages.contents.topicFinder');
    const [open, setOpen] = useState(false);
    const [desc, setDesc] = useState(initialDescription);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDesc(initialDescription);
    }, [initialDescription]);

    useEffect(() => {
        // Check if description has changed from initial
        setHasChanges(desc !== initialDescription && desc.trim() !== initialDescription.trim());
    }, [desc, initialDescription]);

    const handleSave = async () => {
        if (!hasChanges || saving) return;

        setSaving(true);
        const trimmedDesc = desc.trim();
        const supabase = createClient();
        const { error } = await supabase
            .from('social_accounts')
            .update({ profile_description: trimmedDesc })
            .eq('social_id', accountId);

        if (error) {
            toast.error(t('profileDescriptionSaveFailed'));
            console.error('Error saving profile description:', error);
        } else {
            toast.success(t('profileDescriptionSaved'));
            setOpen(false); // Close dropdown after successful save
            setHasChanges(false);

            // Call parent callback with the new description
            if (onSave) {
                onSave(trimmedDesc);
            }
        }

        setSaving(false);
    };

    return (
        <div
            className="w-full rounded-t-2xl bg-[#F8F8F8] border-b border-[#E5E5E5] px-5 md:px-6 pt-3 pb-1 md:pt-4 md:pb-2 relative transition-all duration-300"
        >
            <div
                onClick={() => setOpen(v => !v)}
                className="flex items-center justify-between cursor-pointer"
            >
                <span className="font-semibold text-gray-500 text-md">
                    {t('profileDescription')}
                </span>
                {hasChanges ? (
                    <Button
                        size="sm"
                        className="rounded-full p-1 px-3"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span>{t('save')}</span>
                        )}
                    </Button>
                ) : (
                    <div>
                        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                )}
            </div>
            <div
                className={`
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${open ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
                `}
            >
                <textarea
                    className="w-full bg-transparent border-none text-sm text-gray-800 focus:outline-none resize-none min-h-[60px] max-h-[120px]"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={1}
                    placeholder="Describe your profile..."
                />
                <div className="flex justify-start mt-1 items-center">
                    <div className="rounded-full py-1 text-sm text-gray-400">
                        <BadgeInfo className="inline-block mr-1 w-4 h-4" />
                        {t('profileDescriptionDescription')}
                    </div>
                </div>
            </div>
        </div>
    );
}