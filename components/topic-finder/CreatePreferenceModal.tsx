'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

interface CreatePreferenceModalProps {
    open: boolean;
    title: string;
    onOpenChange: (open: boolean) => void;
    onSave: (values: { name: string; description: string; isPublic?: boolean }) => Promise<void> | void;
    loading?: boolean;
    includePublicToggle?: boolean;
    namePlaceholder?: string;
    descriptionPlaceholder?: string;
    initialValues?: {
        name?: string;
        description?: string;
        isPublic?: boolean;
    } | null;
    mode?: 'create' | 'edit';
    onDelete?: () => Promise<void> | void;
}

export function CreatePreferenceModal({
    open,
    title,
    onOpenChange,
    onSave,
    loading,
    includePublicToggle,
    namePlaceholder,
    descriptionPlaceholder,
    initialValues,
    mode = 'create',
    onDelete,
}: CreatePreferenceModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const t = useTranslations('pages.contents.topicFinder');

    useEffect(() => {
        if (open) {
            setName(initialValues?.name ?? '');
            setDescription(initialValues?.description ?? '');
            setIsPublic(initialValues?.isPublic ?? false);
        } else {
            setName('');
            setDescription('');
            setIsPublic(false);
        }
    }, [initialValues?.description, initialValues?.isPublic, initialValues?.name, open]);

    const handleSave = async () => {
        if (!name.trim()) return;
        await onSave({ name: name.trim(), description: description.trim(), isPublic });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl p-6 sm:p-8">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-2xl font-semibold text-neutral-900">
                        {mode === 'edit' ? t('editTitle', { title }) : t('createTitle', { title })}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="preference-name" className="text-sm font-medium text-neutral-700">
                            {t('nameLabel')}
                        </Label>
                        <Input
                            id="preference-name"
                            value={name}
                            onChange={event => setName(event.target.value)}
                            placeholder={namePlaceholder || t('namePlaceholder', { title })}
                            disabled={loading}
                            className="rounded-2xl border-neutral-200 bg-neutral-50/80 px-4 py-3 text-neutral-800 focus-visible:ring-neutral-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="preference-description" className="text-sm font-medium text-neutral-700">
                            {t('descriptionLabel')}
                        </Label>
                        <Textarea
                            id="preference-description"
                            value={description}
                            onChange={event => setDescription(event.target.value)}
                            placeholder={descriptionPlaceholder || t('descriptionPlaceholder', { title })}
                            disabled={loading}
                            className="min-h-[120px] rounded-2xl border-neutral-200 bg-neutral-50/80 px-4 py-3 text-neutral-800 focus-visible:ring-neutral-400"
                        />
                    </div>
                    {includePublicToggle ? (
                        <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-neutral-800">{t('makePublic')}</p>
                                <p className="text-xs text-neutral-500">{t('makePublicDescription')}</p>
                            </div>
                            <Switch
                                checked={isPublic}
                                onCheckedChange={checked => setIsPublic(checked)}
                                disabled={loading}
                            />
                        </div>
                    ) : null}
                </div>
                <DialogFooter className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    {mode === 'edit' && onDelete ? (
                        <div className="w-full text-left sm:w-auto sm:mr-auto">
                            <button
                                type="button"
                                onClick={onDelete}
                                className="text-sm font-medium text-destructive transition hover:text-destructive/80 focus:outline-none disabled:opacity-60"
                                disabled={loading}
                            >
                                {t('delete')}
                            </button>
                        </div>
                    ) : null}
                    <div className="flex items-center justify-end gap-3 sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full px-5"
                            disabled={loading}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="rounded-full bg-neutral-900 px-6 hover:bg-neutral-800"
                            disabled={loading || !name.trim()}
                        >
                            {loading ? t('saving') : mode === 'edit' ? t('update') : t('save')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
