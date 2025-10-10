'use client';

import { motion } from 'framer-motion';
import { Settings2, Send } from 'lucide-react';

import { HeadlineInput } from '@/components/contents-helper/HeadlineInput';
import { ThreadsProfilePicture } from '@/components/ThreadsProfilePicture';
import { AddOnCard, AddOnOption } from '@/components/topic-finder/AddOnCard';
import { PreferenceCard, PreferenceOption } from '@/components/topic-finder/PreferenceCard';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { TopicResult } from '@/stores/useTopicResultsStore';

type TranslationFn = (key: string, values?: Record<string, unknown>) => string;

interface TopicFinderPreChatProps {
    mounted: boolean;
    currentSocialId: string | null;
    currentUsername?: string | null;
    t: TranslationFn;
    personas: PreferenceOption[];
    audiences: PreferenceOption[];
    objectives: PreferenceOption[];
    addOns: AddOnOption[];
    selectedPersonaId: string | null;
    selectedAudienceId: string | null;
    selectedObjectiveId: string | null;
    selectedAddOnIds: string[];
    isPreferenceLoading: boolean;
    userId: string | null;
    onPersonaSelect: (option: PreferenceOption) => void | Promise<void>;
    onAudienceSelect: (option: PreferenceOption) => void | Promise<void>;
    onObjectiveSelect: (option: PreferenceOption) => void | Promise<void>;
    onAddOnToggle: (option: AddOnOption) => void | Promise<void>;
    onOpenCreateModal: (type: 'persona' | 'audience' | 'objective' | 'addOn') => void;
    headline: string;
    onHeadlineChange: (value: string) => void;
    postType: 'single' | 'thread';
    onPostTypeChange: (value: 'single' | 'thread') => void;
    language: string;
    onLanguageChange: (value: string) => void;
    onInitialSend: () => void | Promise<void>;
    isPreChatReady: boolean;
    isSubmittingMessage: boolean;
    topicResults: TopicResult[];
    onTopicChange: (idx: number, value: string) => void;
    onInstructionChange: (value: string) => void;
    isGeneratingTopics: boolean;
    selectedHeadline: string;
    onSelectHeadline: (headline: string) => void;
    onRemoveTopics: () => void;
}

export const TopicFinderPreChat = ({
    mounted,
    currentSocialId,
    currentUsername,
    t,
    personas,
    audiences,
    objectives,
    addOns,
    selectedPersonaId,
    selectedAudienceId,
    selectedObjectiveId,
    selectedAddOnIds,
    isPreferenceLoading,
    userId,
    onPersonaSelect,
    onAudienceSelect,
    onObjectiveSelect,
    onAddOnToggle,
    onOpenCreateModal,
    headline,
    onHeadlineChange,
    postType,
    onPostTypeChange,
    language,
    onLanguageChange,
    onInitialSend,
    isPreChatReady,
    isSubmittingMessage,
    topicResults,
    onTopicChange,
    onInstructionChange,
    isGeneratingTopics,
    selectedHeadline,
    onSelectHeadline,
    onRemoveTopics,
}: TopicFinderPreChatProps) => {
    return (
        <>
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                className="flex flex-col items-center gap-4 text-center md:gap-6"
            >
                <motion.div layout className="flex items-center justify-center gap-3 text-sm md:items-start md:text-xl">
                    {mounted && (
                        <ThreadsProfilePicture
                            socialId={currentSocialId}
                            alt="Profile picture"
                            className="h-10 w-10 rounded-full"
                        />
                    )}
                    <motion.div layout className="flex flex-col items-center gap-1 md:items-start">
                        <motion.h1 layout className="text-xl font-semibold md:text-2xl">
                            {t('greeting', { username: mounted ? (currentUsername || t('defaultUser')) : t('defaultUser') })}
                        </motion.h1>
                        <motion.h1 layout className="text-center text-xl font-semibold md:text-2xl">
                            {t('question')}
                        </motion.h1>
                    </motion.div>
                </motion.div>
            </motion.div>

            <motion.div
                key="pre-chat"
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="flex w-full max-w-3xl flex-col gap-6"
            >
                <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <PreferenceCard
                        title="Persona"
                        options={personas}
                        selectedId={selectedPersonaId}
                        onSelect={onPersonaSelect}
                        onCreateNew={() => onOpenCreateModal('persona')}
                        placeholder="Select persona"
                        disabled={!userId}
                        loading={isPreferenceLoading && personas.length === 0}
                    />
                    <PreferenceCard
                        title="Audience"
                        options={audiences}
                        selectedId={selectedAudienceId}
                        onSelect={onAudienceSelect}
                        onCreateNew={() => onOpenCreateModal('audience')}
                        placeholder="Select audience"
                        disabled={!userId}
                        loading={isPreferenceLoading && audiences.length === 0}
                    />
                    <PreferenceCard
                        title="Objective"
                        options={objectives}
                        selectedId={selectedObjectiveId}
                        onSelect={onObjectiveSelect}
                        onCreateNew={() => onOpenCreateModal('objective')}
                        placeholder="Select objective"
                        disabled={!userId}
                        loading={isPreferenceLoading && objectives.length === 0}
                    />
                    <AddOnCard
                        options={addOns}
                        selectedIds={selectedAddOnIds}
                        onToggle={onAddOnToggle}
                        onCreateNew={() => onOpenCreateModal('addOn')}
                        disabled={!userId}
                        loading={isPreferenceLoading && addOns.length === 0}
                    />
                </div>

                <HeadlineInput value={headline} onChange={onHeadlineChange} />

                <div className="flex items-center justify-between gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-full px-3"
                                aria-label="Open generation settings"
                            >
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 rounded-2xl">
                            <DropdownMenuLabel>{t('generationSettings')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="space-y-4 px-2 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <label htmlFor="post-type" className="text-sm font-medium">
                                        {t('postType')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {postType === 'single' ? t('single') : t('thread')}
                                        </span>
                                        <Switch
                                            id="post-type"
                                            checked={postType === 'thread'}
                                            onCheckedChange={(checked) => onPostTypeChange(checked ? 'thread' : 'single')}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <label htmlFor="language" className="text-sm font-medium">
                                        {t('language')}
                                    </label>
                                    <Select value={language} onValueChange={onLanguageChange}>
                                        <SelectTrigger id="language" className="h-9 w-32 rounded-full">
                                            <SelectValue placeholder={t('selectLanguage')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="ko">Korean</SelectItem>
                                            <SelectItem value="ja">Japanese</SelectItem>
                                            <SelectItem value="zh">Chinese</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        type="button"
                        size="icon"
                        className="h-12 w-12 rounded-full bg-black text-white hover:bg-black/85"
                        onClick={onInitialSend}
                        disabled={!isPreChatReady || isSubmittingMessage}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>

                <div className="w-full max-w-3xl">
                    <div className="space-y-4">
                        <div className="mb-6 flex flex-col gap-4">
                            {topicResults.length > 0 &&
                                topicResults.map((topic, index) => (
                                    <div key={index} className="relative">
                                        <HeadlineInput
                                            value={topic.topic || ''}
                                            onChange={(value) => onTopicChange(index, value)}
                                            inline
                                            ellipsis
                                            isSelected={selectedHeadline === topic.topic}
                                            onClick={() => onSelectHeadline(topic.topic)}
                                            onInstructionChange={onInstructionChange}
                                        />
                                    </div>
                                ))}
                            {isGeneratingTopics && (
                                <div className="flex max-w-3xl flex-col gap-4">
                                    <div className="h-[48px] w-3/4 rounded-[20px] bg-gray-300 animate-pulse" />
                                    <div className="h-[48px] w-1/2 rounded-[20px] bg-gray-300 animate-pulse" />
                                </div>
                            )}
                            {topicResults.length > 0 && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="text-muted-foreground">
                                            {t('deleteAllTopicsButton')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('deleteAllTopics')}</DialogTitle>
                                            <DialogDescription>{t('deleteAllTopicsDescription')}</DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="gap-2">
                                            <DialogClose className="mb-[-8px] text-muted-foreground">
                                                {t('cancel')}
                                            </DialogClose>
                                            <Button variant="destructive" onClick={onRemoveTopics}>
                                                {t('delete')}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};
