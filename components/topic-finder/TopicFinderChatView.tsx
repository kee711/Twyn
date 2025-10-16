'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { AudienceAnalyzerCard } from '@/components/topic-finder/AudienceAnalyzerCard';
import { ConversationHeader } from '@/components/topic-finder/ConversationHeader';
import { HorizontalCarousel } from '@/components/topic-finder/HorizontalCarousel';
import { ProfileAnalyzerCard } from '@/components/topic-finder/ProfileAnalyzerCard';
import { RecommendedTopicsGrid } from '@/components/topic-finder/RecommendedTopicsGrid';
import { ReferenceAnalyzerPanel } from '@/components/topic-finder/ReferenceAnalyzerPanel';
import { TextResponse } from '@/components/topic-finder/TextResponse';
import { ThreadsCard, XCard } from '@/components/topic-finder/SocialCards';
import { ThinkingProcessTimeline } from '@/components/topic-finder/ThinkingProcessTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import type { AudienceAnalysis } from '@/lib/topic-finder/audience';
import type { ProfileAnalytics } from '@/lib/topic-finder/analytics';
import type { RecommendedTopic } from '@/lib/topic-finder/recommendations';
import type { NormalizedSocialContent, ReferenceAnalysis } from '@/components/topic-finder/types';

import type { ConversationMessage, ReferenceMetadata } from './conversationTypes';

interface TopicFinderChatViewProps {
    conversation: ConversationMessage[];
    contextBadges: { label: string; value: string }[];
    displayedHeadline: string;
    isChatActive: boolean;
    hasSubmittedContext: boolean;
    profileAnalytics: ProfileAnalytics | null;
    currentSocialId: string | null;
    onRepurposeContent: (item: NormalizedSocialContent, platform: 'threads' | 'x') => void;
    onUseTopic: (topic: RecommendedTopic) => void;
}

export const TopicFinderChatView = ({
    conversation,
    contextBadges,
    displayedHeadline,
    isChatActive,
    hasSubmittedContext,
    profileAnalytics,
    currentSocialId,
    onRepurposeContent,
    onUseTopic,
}: TopicFinderChatViewProps) => {
    const renderReferencePanel = (
        key: string,
        options: {
            title?: string;
            platform: 'threads' | 'x';
            items: NormalizedSocialContent[];
            referenceData?: Record<string, ReferenceMetadata>;
            referenceAnalysis?: Record<string, ReferenceAnalysis>;
            audienceAnalysis?: AudienceAnalysis | null;
        },
    ) => (
        <ReferenceAnalyzerPanel
            key={key}
            platform={options.platform}
            items={options.items}
            ownerUserId={options.platform === 'threads' ? currentSocialId : null}
            audienceAnalysis={options.audienceAnalysis}
            referenceData={options.referenceData}
            initialAnalysis={options.referenceAnalysis}
        >
            {(analysisMap, loading) => (
                <HorizontalCarousel title={options.title}>
                    {options.items.map((item) => {
                        const CardComponent = options.platform === 'threads' ? ThreadsCard : XCard;
                        return (
                            <CardComponent
                                key={item.id}
                                item={item}
                                onRepurpose={(content) => onRepurposeContent(content, options.platform)}
                                referenceAnalysis={analysisMap[item.id]}
                                analysisLoading={loading}
                            />
                        );
                    })}
                </HorizontalCarousel>
            )}
        </ReferenceAnalyzerPanel>
    );

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
            {hasSubmittedContext && (
                <motion.div
                    key="conversation-header"
                    layout
                    transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                    className="flex flex-col items-start text-left"
                >
                    <ConversationHeader headline={displayedHeadline} badges={contextBadges} isActive={isChatActive} />
                </motion.div>
            )}

            <AnimatePresence initial={false}>
                {isChatActive && (
                    <motion.div
                        key="chat-log"
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-8"
                    >
                        {conversation.length === 0 ? (
                            <div className="w-full rounded-3xl border border-dashed border-border/60 bg-background/90 px-6 py-10 text-center text-sm text-muted-foreground">
                                Start the conversation to see LangGraph insights here.
                            </div>
                        ) : (() => {
                            let profileCardRendered = false;
                            return conversation.map((message) => {
                                const shouldRenderProfileCard = Boolean(profileAnalytics && !profileCardRendered && message.role === 'assistant');
                                if (shouldRenderProfileCard) {
                                    profileCardRendered = true;
                                }

                                return (
                                    <motion.div key={message.id} layout className="w-full">
                                        {message.role === 'user' ? (
                                            <div className="flex justify-end">
                                                <div className="max-w-[85%] rounded-3xl bg-primary px-4 py-3 text-sm font-medium leading-relaxed text-primary-foreground shadow">
                                                    {message.content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start gap-6">
                                                {message.status === 'loading' &&
                                                    Array.isArray(message.thinkingProcess) &&
                                                    message.thinkingProcess.length > 0 && (
                                                    <ThinkingProcessTimeline steps={message.thinkingProcess} />
                                                )}
                                                {shouldRenderProfileCard && (
                                                    <ProfileAnalyzerCard analytics={profileAnalytics} />
                                                )}

                                                {message.status === 'loading' ? (
                                                    <div className="flex w-full flex-col gap-2">
                                                        <Skeleton className="h-4 w-48 rounded-full" />
                                                        <Skeleton className="h-4 w-80 rounded-full" />
                                                        <Skeleton className="h-4 w-64 rounded-full" />
                                                    </div>
                                                ) : (
                                                    <div className="flex w-full flex-col gap-8">
                                                        <div className="flex flex-col gap-8">
                                                            {message.blocks.map((block) => {
                                                                if (block.type === 'widget' && block.widgetType === 'topics') {
                                                                    return null;
                                                                }
                                                                switch (block.type) {
                                                                    case 'text':
                                                                        return (
                                                                            <TextResponse
                                                                                key={block.id}
                                                                                title={block.title}
                                                                                content={block.content}
                                                                                links={block.links}
                                                                            />
                                                                        );
                                                                    case 'threads':
                                                                        return renderReferencePanel(block.id, {
                                                                            title: block.title,
                                                                            platform: 'threads',
                                                                            items: block.items,
                                                                            referenceData: block.referenceData,
                                                                            referenceAnalysis: block.referenceAnalysis,
                                                                            audienceAnalysis: block.audienceAnalysis as AudienceAnalysis | undefined,
                                                                        });
                                                                    case 'x':
                                                                        return renderReferencePanel(block.id, {
                                                                            title: block.title,
                                                                            platform: 'x',
                                                                            items: block.items,
                                                                            referenceData: block.referenceData,
                                                                            referenceAnalysis: block.referenceAnalysis,
                                                                            audienceAnalysis: block.audienceAnalysis as AudienceAnalysis | undefined,
                                                                        });
                                                                    case 'widget': {
                                                                        if (block.widgetType === 'reference-analysis') {
                                                                            const data = block.data as {
                                                                                title?: string;
                                                                                platform?: 'threads' | 'x';
                                                                                items?: NormalizedSocialContent[];
                                                                                referenceData?: Record<string, ReferenceMetadata>;
                                                                                referenceAnalysis?: Record<string, ReferenceAnalysis>;
                                                                                audienceAnalysis?: AudienceAnalysis | null;
                                                                            } | null;
                                                                            if (!data?.platform || !Array.isArray(data.items)) {
                                                                                return null;
                                                                            }
                                                                            return renderReferencePanel(block.id, {
                                                                                title: data.title,
                                                                                platform: data.platform,
                                                                                items: data.items,
                                                                                referenceData: data.referenceData,
                                                                                referenceAnalysis: data.referenceAnalysis,
                                                                                audienceAnalysis: data.audienceAnalysis ?? undefined,
                                                                            });
                                                                        }
                                                                        if (block.widgetType === 'audience') {
                                                                            const analysis = block.data as AudienceAnalysis | undefined;
                                                                            if (!analysis) return null;
                                                                            return (
                                                                                <AudienceAnalyzerCard key={block.id} analysis={analysis} />
                                                                            );
                                                                        }
                                                                        return null;
                                                                    }
                                                                    default:
                                                                        return null;
                                                                }
                                                            })}
                                                        </div>
                                                        {message.blocks.map((block) => {
                                                            if (block.type === 'widget' && block.widgetType === 'topics') {
                                                                const topics = Array.isArray(block.data)
                                                                    ? (block.data as RecommendedTopic[])
                                                                    : [];
                                                                if (topics.length === 0) return null;
                                                                return (
                                                                    <RecommendedTopicsGrid
                                                                        key={block.id}
                                                                        topics={topics}
                                                                        onUseTopic={onUseTopic}
                                                                    />
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                )}
                                                {message.status === 'error' && message.error && (
                                                    <div className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                                        {message.error}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            });
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
