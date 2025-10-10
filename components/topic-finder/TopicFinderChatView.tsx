'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { ConversationHeader } from '@/components/topic-finder/ConversationHeader';
import { HorizontalCarousel } from '@/components/topic-finder/HorizontalCarousel';
import { TextResponse } from '@/components/topic-finder/TextResponse';
import { NormalizedSocialContent, ThreadsCard, XCard } from '@/components/topic-finder/SocialCards';
import { Skeleton } from '@/components/ui/skeleton';

import type { ConversationMessage } from './conversationTypes';

interface TopicFinderChatViewProps {
    conversation: ConversationMessage[];
    contextBadges: { label: string; value: string }[];
    displayedHeadline: string;
    isChatActive: boolean;
    hasSubmittedContext: boolean;
    onRepurposeContent: (item: NormalizedSocialContent, platform: 'threads' | 'x') => void;
}

export const TopicFinderChatView = ({
    conversation,
    contextBadges,
    displayedHeadline,
    isChatActive,
    hasSubmittedContext,
    onRepurposeContent,
}: TopicFinderChatViewProps) => {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
            {hasSubmittedContext && (
                <motion.div
                    key="conversation-header"
                    layout
                    transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                    className="flex flex-col items-start gap-4 text-left"
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
                        ) : (
                            conversation.map((message) => (
                                <motion.div key={message.id} layout className="w-full">
                                    {message.role === 'user' ? (
                                        <div className="flex justify-end">
                                            <div className="max-w-[85%] rounded-3xl bg-primary px-4 py-3 text-sm font-medium leading-relaxed text-primary-foreground shadow">
                                                {message.content}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start ">
                                            {message.status === 'loading' ? (
                                                <div className="flex w-full flex-col gap-2">
                                                    <Skeleton className="h-4 w-48 rounded-full" />
                                                    <Skeleton className="h-4 w-80 rounded-full" />
                                                    <Skeleton className="h-4 w-64 rounded-full" />
                                                </div>
                                            ) : (
                                                <div className="flex w-full flex-col gap-8">
                                                    {message.blocks.map((block) => {
                                                        if (block.type === 'text') {
                                                            return (
                                                                <TextResponse
                                                                    key={block.id}
                                                                    title={block.title}
                                                                    content={block.content}
                                                                    links={block.links}
                                                                />
                                                            );
                                                        }
                                                        if (block.type === 'threads') {
                                                            return (
                                                                <HorizontalCarousel key={block.id} title={block.title}>
                                                                    {block.items.map((item) => (
                                                                        <ThreadsCard
                                                                            key={item.id}
                                                                            item={item}
                                                                            onRepurpose={(content) => onRepurposeContent(content, 'threads')}
                                                                        />
                                                                    ))}
                                                                </HorizontalCarousel>
                                                            );
                                                        }
                                                        if (block.type === 'x') {
                                                            return (
                                                                <HorizontalCarousel key={block.id} title={block.title}>
                                                                    {block.items.map((item) => (
                                                                        <XCard
                                                                            key={item.id}
                                                                            item={item}
                                                                            onRepurpose={(content) => onRepurposeContent(content, 'x')}
                                                                        />
                                                                    ))}
                                                                </HorizontalCarousel>
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
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
