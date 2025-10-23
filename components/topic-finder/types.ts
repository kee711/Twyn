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

export interface KeywordBreakdownItem {
    keyword: string;
    type?: string;
    relevance?: number;
}

export interface SubKeywordInsight {
    keyword: string;
    finalScore?: number;
    engagementPotential?: number;
    trendMomentum?: number;
    competitionAdvantage?: number;
    commercialValue?: number;
    topicCoherenceScore?: number;
    selectionReason?: string;
}

export interface KeywordIntelligenceData {
    mainKeyword: {
        keyword: string;
        searchVolume?: number;
        competitionLevel?: string;
        trendScore?: number;
        relevanceScore?: number;
        cpcRange?: {
            min?: number;
            max?: number;
        };
    } | null;
    keywordBreakdown: KeywordBreakdownItem[];
    selectedSubKeywords: SubKeywordInsight[];
    searchQueries: Record<string, string>;
}

export interface PlatformPerformance {
    platform: string;
    contentCount?: number;
    averageQuality?: number;
    topQualityScore?: number;
}

export interface EngagementOverviewData {
    totalContentAnalyzed: number;
    averageQualityScore: number;
    platformPerformance: PlatformPerformance[];
    sentimentDistribution: {
        positive: number;
        neutral: number;
        negative: number;
    };
    keywordStrategy?: Record<string, unknown>;
}

export interface ContentRecommendation {
    keyword: string;
    recommendedContentType?: string;
    expectedEngagement?: number;
    priority?: string;
}

export interface CompetitiveAnalysisData {
    marketSaturation?: string;
    contentGapOpportunities: string[];
    differentiationStrategies: string[];
}

export interface ContentOpportunitiesData {
    actionableInsights: string[];
    recommendations: ContentRecommendation[];
    competitiveAnalysis: CompetitiveAnalysisData | null;
}
