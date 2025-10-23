export interface ViralMetrics {
    views?: number;
    likes?: number;
    replies?: number;
    reposts?: number;
    shares?: number;
}

export interface ReferenceAnalysis {
    id: string;
    title: string;
    url?: string;
    score: number;
    metrics: ViralMetrics;
    source: 'synced' | 'estimated' | 'model';
    audienceComment: string;
    snippet?: string;
}

export interface NormalizedSocialContent {
    id: string;
    authorName?: string;
    handle?: string;
    avatarUrl?: string;
    createdAt?: string;
    text: string;
    link?: string;
    mediaUrls?: string[];
    metrics?: {
        replies?: number;
        likes?: number;
        reposts?: number;
    };
    rawBody?: string;
    platform?: 'threads' | 'x' | 'external';
}
