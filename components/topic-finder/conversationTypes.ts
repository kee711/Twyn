import type { NormalizedSocialContent } from '@/components/topic-finder/SocialCards';

export type TextBlock = {
    id: string;
    type: 'text';
    title?: string;
    content: string;
    links?: Array<{ id: string; label: string; url: string }>;
};

export type ThreadsBlock = {
    id: string;
    type: 'threads';
    title: string;
    items: NormalizedSocialContent[];
};

export type XBlock = {
    id: string;
    type: 'x';
    title: string;
    items: NormalizedSocialContent[];
};

export type AssistantBlock = TextBlock | ThreadsBlock | XBlock;

export type AssistantMessage = {
    id: string;
    role: 'assistant';
    createdAt: number;
    status: 'loading' | 'complete' | 'error';
    blocks: AssistantBlock[];
    raw?: unknown;
    error?: string;
};

export type UserMessage = {
    id: string;
    role: 'user';
    createdAt: number;
    content: string;
};

export type ConversationMessage = AssistantMessage | UserMessage;
