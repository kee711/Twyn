import type { NormalizedSocialContent, ReferenceAnalysis } from '@/components/topic-finder/types';

export type ThinkingProcessStatus = 'pending' | 'in_progress' | 'complete' | 'error';

export interface ThinkingProcessStep {
    id: string;
    label: string;
    status: ThinkingProcessStatus;
    description?: string;
}

export type TextBlock = {
    id: string;
    type: 'text';
    title?: string;
    content: string;
    links?: Array<{ id: string; label: string; url: string }>;
};

export type ReferenceMetadata = {
    url?: string;
    title?: string;
    snippet?: string;
};

export type WidgetBlock = {
    id: string;
    type: 'widget';
    widgetType: 'reference-analysis' | 'topics' | 'audience' | string;
    data?: unknown;
};

export type ThreadsBlock = {
    id: string;
    type: 'threads';
    title: string;
    items: NormalizedSocialContent[];
    referenceData?: Record<string, ReferenceMetadata>;
    referenceAnalysis?: Record<string, ReferenceAnalysis>;
    audienceAnalysis?: unknown;
    emptyMessage?: string;
};

export type XBlock = {
    id: string;
    type: 'x';
    title: string;
    items: NormalizedSocialContent[];
    referenceData?: Record<string, ReferenceMetadata>;
    referenceAnalysis?: Record<string, ReferenceAnalysis>;
    audienceAnalysis?: unknown;
    emptyMessage?: string;
};

export type AssistantBlock = TextBlock | ThreadsBlock | XBlock | WidgetBlock;

export type AssistantMessage = {
    id: string;
    role: 'assistant';
    createdAt: number;
    status: 'loading' | 'complete' | 'error';
    blocks: AssistantBlock[];
    raw?: unknown;
    error?: string;
    thinkingProcess?: ThinkingProcessStep[];
};

export type UserMessage = {
    id: string;
    role: 'user';
    createdAt: number;
    content: string;
};

export type ConversationMessage = AssistantMessage | UserMessage;
