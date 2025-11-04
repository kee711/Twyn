'use client';

import { useMiniAppReady } from '@/hooks/useMiniAppReady';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { featureFlags, getSupportedPlatforms } from '@/lib/config/web3';
import { SocialConnectRequired } from '@/components/dashboard/SocialConnectRequired';
import { startTransition, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { useTranslations, useLocale } from 'next-intl';
import useThreadChainStore from '@/stores/useThreadChainStore';
import { ThreadContent } from '@/components/contents-helper/types';
import { useTopicResultsStore } from '@/stores/useTopicResultsStore';
import { fetchAndSaveComments, fetchAndSaveMentions } from '@/app/actions/fetchComment';
import { getAllCommentsWithRootPosts, getAllMentionsWithRootPosts } from '@/app/actions/comment';
import { statisticsKeys } from '@/lib/queries/statisticsKeys';
import { fetchUserInsights, fetchTopPosts } from '@/lib/queries/statisticsQueries';
import { useContentGenerationStore } from '@/lib/stores/content-generation';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import useAiContentStore from '@/stores/useAiContentStore';
import { trackEvent, trackUserAction } from '@/lib/analytics/mixpanel';
import { useSession } from 'next-auth/react';
import { CreatePreferenceModal } from '@/components/topic-finder/CreatePreferenceModal';
import { ChatInputBar } from '@/components/topic-finder/ChatInputBar';
import type {
    NormalizedSocialContent,
    ReferenceAnalysis,
    KeywordIntelligenceData,
    EngagementOverviewData,
    ContentOpportunitiesData,
} from '@/components/topic-finder/types';
import { TopicFinderPreChat } from '@/components/topic-finder/TopicFinderPreChat';
import { TopicFinderChatView } from '@/components/topic-finder/TopicFinderChatView';
import { AddOnOption } from '@/components/topic-finder/AddOnCard';
import { PreferenceOption } from '@/components/topic-finder/PreferenceCard';
import { Button } from '@/components/ui/button';
import type { RecommendedTopic } from '@/lib/topic-finder/recommendations';
import type { AudienceAnalysis } from '@/lib/topic-finder/audience';
import { useProfileAnalytics } from '@/hooks/useProfileAnalytics';
import { buildAudienceAnalysis, buildAudienceSummaryText } from '@/lib/topic-finder/audience';
import { buildProfileSummaryText } from '@/lib/topic-finder/analytics';
import type { AssistantBlock, AssistantMessage, ConversationMessage, ThinkingProcessStep, UserMessage } from '@/components/topic-finder/conversationTypes';

const DEFAULT_LANGGRAPH_TOPIC = 'social media marketing strategy for AI startups';

// Base URL for LangGraph FastAPI server
// Prefer client-exposed env var if available; fallback to server env at build time.
const LANGGRAPH_API_BASE = (process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || process.env.LANGGRAPH_API_URL || 'http://localhost:8000').replace(/\/$/, '');

interface SubmittedContext {
    headline: string;
    persona?: PreferenceOption | null;
    audience?: PreferenceOption | null;
    objective?: PreferenceOption | null;
    addOns: AddOnOption[];
}

interface LanggraphEvent {
    event: string;
    data: unknown;
}

const createId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
};

const isRecord = (value: unknown): value is Record<string, any> => {
    return typeof value === 'object' && value !== null;
};

const normalizeTextContent = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item : JSON.stringify(item, null, 2)))
            .join('\n\n');
    }
    if (isRecord(value)) {
        return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    return '';
};

const normalizeSocialContent = (items: unknown[]): NormalizedSocialContent[] => {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) => {
            if (!isRecord(item)) return null;

            const title =
                typeof item.title === 'string'
                    ? item.title
                    : isRecord(item.headline) && typeof item.headline.text === 'string'
                        ? item.headline.text
                        : undefined;

            const text =
                typeof item.text === 'string'
                    ? item.text
                    : typeof item.content === 'string'
                        ? item.content
                        : typeof item.body === 'string'
                            ? item.body
                            : '';

            const combinedText =
                title && text ? `${title}\n\n${text}` : title ? title : text ? text : '';

            if (!combinedText) return null;

            const authorName =
                typeof item.author === 'string'
                    ? item.author
                    : isRecord(item.author) && typeof item.author.name === 'string'
                        ? item.author.name
                        : typeof item.username === 'string'
                            ? item.username
                            : undefined;

            const handle =
                typeof item.handle === 'string'
                    ? item.handle.replace('@', '')
                    : typeof item.username === 'string'
                        ? item.username.replace('@', '')
                        : undefined;

            const avatarUrl =
                typeof item.profile_image_url === 'string'
                    ? item.profile_image_url
                    : typeof item.avatar === 'string'
                        ? item.avatar
                        : undefined;

            const link =
                typeof item.url === 'string'
                    ? item.url
                    : typeof item.permalink === 'string'
                        ? item.permalink
                        : undefined;

            const mediaUrls = Array.isArray(item.media_urls)
                ? item.media_urls.filter((media) => typeof media === 'string')
                : Array.isArray(item.media)
                    ? item.media.filter((media) => typeof media === 'string')
                    : undefined;

            const metrics = isRecord(item.metrics)
                ? {
                    replies: typeof item.metrics.replies === 'number' ? item.metrics.replies : undefined,
                    likes: typeof item.metrics.likes === 'number' ? item.metrics.likes : undefined,
                    reposts: typeof item.metrics.reposts === 'number' ? item.metrics.reposts : undefined,
                }
                : undefined;

            const createdAt =
                typeof item.created_at === 'string'
                    ? item.created_at
                    : typeof item.timestamp === 'string'
                        ? item.timestamp
                        : undefined;

            const rawBody = typeof item.content === 'string' ? item.content : typeof item.body === 'string' ? item.body : undefined;
            const platform = typeof item.platform === 'string'
                ? (item.platform.toLowerCase() as 'threads' | 'x' | 'external')
                : undefined;

            return {
                id: typeof item.id === 'string' ? item.id : createId(),
                authorName,
                handle,
                avatarUrl,
                createdAt,
                text: combinedText,
                link,
                mediaUrls,
                metrics,
                rawBody,
                platform,
            } as NormalizedSocialContent;
        })
        .filter((item): item is NormalizedSocialContent => !!item);
};

const extractContents = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value;
    if (isRecord(value) && Array.isArray(value.contents)) return value.contents;
    if (isRecord(value) && Array.isArray(value.results)) return value.results;
    return [];
};

const extractSocialItems = (value: unknown, platform: 'threads' | 'x'): NormalizedSocialContent[] => {
    if (!isRecord(value)) {
        return normalizeSocialContent(extractContents(value));
    }

    const searchResults = value.search_results;
    if (isRecord(searchResults)) {
        const platformKey = platform === 'threads' ? 'threads' : 'x';
        const platformResults = searchResults[platformKey];
        if (Array.isArray(platformResults)) {
            return normalizeSocialContent(platformResults);
        }
    }

    if (Array.isArray(value.contents)) {
        return normalizeSocialContent(value.contents);
    }

    if (Array.isArray(value.results)) {
        return normalizeSocialContent(value.results);
    }

    return normalizeSocialContent(extractContents(value));
};

const mergeRecordValues = (existing: unknown, incoming: unknown): unknown => {
    if (existing === undefined || existing === null) return incoming;
    if (incoming === undefined || incoming === null) return existing;

    if (Array.isArray(existing) && Array.isArray(incoming)) {
        return [...existing, ...incoming];
    }

    if (Array.isArray(existing)) {
        return [...existing, incoming];
    }

    if (Array.isArray(incoming)) {
        return [existing, ...incoming];
    }

    if (isRecord(existing) && isRecord(incoming)) {
        const merged: Record<string, unknown> = { ...existing };
        Object.entries(incoming).forEach(([key, value]) => {
            merged[key] = mergeRecordValues(merged[key], value);
        });
        return merged;
    }

    return incoming;
};

const normalizeUrl = (value?: string | null) => value ? value.replace(/\/$/, '').toLowerCase() : undefined;
const aggregateLanggraphPayload = (events: LanggraphEvent[]): Record<string, unknown> | null => {
    const aggregated: Record<string, unknown> = {};
    const metadataList: unknown[] = [];

    for (const chunk of events) {
        if (!chunk || !isRecord(chunk.data)) continue;

        if (chunk.event === 'metadata') {
            metadataList.push(chunk.data);
            continue;
        }

        Object.entries(chunk.data).forEach(([key, value]) => {
            if (!key) return;
            aggregated[key] = mergeRecordValues(aggregated[key], value);
        });
    }

    if (metadataList.length > 0) {
        aggregated._metadata = metadataList;
    }

    return Object.keys(aggregated).length > 0 ? aggregated : null;
};

const buildAssistantBlocks = (result: Record<string, unknown>): AssistantBlock[] => {
    const blocks: AssistantBlock[] = [];
    const handled = new Set<string>();

    const audienceAnalyzer = result['Audience Analyzer'];
    let audienceInsights: AudienceAnalysis | null = null;
    if (isRecord(audienceAnalyzer) && isRecord(audienceAnalyzer.audience_profile)) {
        const profile = audienceAnalyzer.audience_profile as Record<string, unknown>;
        const personaText = typeof profile.persona === 'string' ? profile.persona.trim() : '';

        const toSegments = (text: string): string[] =>
            text
                .split(/(?<=[.!?])\s+|\n+/)
                .map((segment) => segment.replace(/\s+/g, ' ').trim())
                .filter((segment) => segment.length > 0);

        const dedupeList = (items: string[]): string[] => {
            const seen = new Set<string>();
            const result: string[] = [];
            items.forEach((item) => {
                const key = item.toLowerCase();
                if (!key || seen.has(key)) {
                    return;
                }
                seen.add(key);
                result.push(item);
            });
            return result;
        };

        const personaSegments = personaText ? toSegments(personaText) : [];
        const profileSummary = typeof profile.summary === 'string' ? profile.summary.trim() : '';

        const personaDescription =
            personaSegments[0] ||
            profileSummary ||
            personaText ||
            'Audience insight unavailable.';

        let motivationsList = dedupeList(
            personaSegments.length > 1 ? personaSegments.slice(1) : personaSegments.slice(0, 3),
        ).slice(0, 3);
        if (!motivationsList.length && profileSummary) {
            motivationsList = dedupeList(toSegments(profileSummary)).slice(0, 3);
        }
        if (!motivationsList.length && personaSegments.length) {
            motivationsList = dedupeList(personaSegments).slice(0, 3);
        }

        const normalizeKey = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

        const filterDistinct = (items: unknown): string[] => {
            if (!Array.isArray(items)) return [];
            const prepared = items
                .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                .map((item) => item.trim());
            const deduped = dedupeList(prepared);
            const filtered = deduped.filter((item) => normalizeKey(item) !== normalizeKey(personaDescription));
            return (filtered.length ? filtered : deduped).slice(0, 4);
        };

        const dos = filterDistinct(profile.dos);
        const donts = filterDistinct(profile.donts);
        const toneGuidelines = filterDistinct(profile.tone_guidelines);

        const personaNameValue =
            (typeof profile.title === 'string' && profile.title.trim()) ||
            (typeof profile.name === 'string' && profile.name.trim()) ||
            (typeof profile.persona_name === 'string' && profile.persona_name.trim()) ||
            (motivationsList[0] ? motivationsList[0].slice(0, 60) : '') ||
            'Audience Persona';

        audienceInsights = {
            personaName: personaNameValue,
            personaDescription,
            motivations: motivationsList,
            dos,
            donts,
            toneGuidelines,
            summary: [personaDescription, ...motivationsList].join(' ').trim(),
        };

        blocks.push({
            id: createId(),
            type: 'widget',
            widgetType: 'audience',
            data: audienceInsights,
        });
        handled.add('Audience Analyzer');
    }

    const summarizerKey =
        result['Enhanced Summarizer'] !== undefined
            ? 'Enhanced Summarizer'
            : result['Summarize'] !== undefined
                ? 'Summarize'
                : null;
    const rawSummarizeValue = summarizerKey ? result[summarizerKey] : null;
    const summarizeValue = isRecord(rawSummarizeValue) ? rawSummarizeValue : null;

    const parseTopicText = (value: string | undefined) => {
        if (!value) {
            return { title: '', rationale: '' };
        }
        const cleaned = value.trim();
        if (!cleaned) {
            return { title: '', rationale: '' };
        }
        const parts = cleaned
            .split(/\s+—\s+|\s+-\s+|\u2014/)
            .map((part) => part.trim())
            .filter(Boolean);
        if (parts.length >= 2) {
            const [primary, ...rest] = parts;
            return { title: primary.trim(), rationale: rest.join(' — ').trim() };
        }
        return { title: cleaned, rationale: '' };
    };

    const recommendedTopicsData = (() => {
        const source = result['Recommended Topics']
            ?? result['Recommended topics']
            ?? result['recommended_topics']
            ?? summarizeValue?.recommended_topics;
        if (!source) return [] as RecommendedTopic[];

        const rawArray = Array.isArray(source)
            ? source
            : isRecord(source) && Array.isArray(source.topics)
                ? (source.topics as unknown[])
                : isRecord(source) && Array.isArray((source as Record<string, unknown>).recommended_topics)
                    ? ((source as Record<string, unknown>).recommended_topics as unknown[])
                    : [];

        return rawArray
            .map((item, index) => {
                if (typeof item === 'string') {
                    const parsed = parseTopicText(item);
                    return {
                        id: createId(),
                        title: parsed.title || item,
                        description: '',
                        expectedScore: 7,
                        rationale: parsed.rationale || 'Suggested by LangGraph agent.',
                    };
                }
                if (isRecord(item)) {
                    const topicText = typeof item.topic === 'string' ? item.topic : undefined;
                    const parsed = parseTopicText(topicText);
                    const title =
                        typeof item.title === 'string' && item.title.trim().length > 0
                            ? item.title
                            : parsed.title || topicText || `Topic ${index + 1}`;
                    const rawDescription = typeof item.description === 'string' ? item.description : '';
                    const rawRationale = typeof item.rationale === 'string' ? item.rationale : '';
                    const description = rawDescription || '';
                    const rationale = rawRationale || parsed.rationale || '';
                    const expectedRaw = typeof item.expected_score === 'number'
                        ? item.expected_score
                        : typeof item.expected_score === 'string'
                            ? parseFloat(item.expected_score)
                            : typeof item.expected_viral_score === 'number'
                                ? item.expected_viral_score
                                : typeof item.expected_viral_score === 'string'
                                    ? parseFloat(item.expected_viral_score)
                                    : typeof item.score === 'number'
                                        ? item.score
                                        : undefined;
                    return {
                        id: createId(),
                        title,
                        description,
                        expectedScore: Number.isFinite(expectedRaw) ? Number(expectedRaw) : 7,
                        rationale,
                    };
                }
                return null;
            })
            .filter((topic): topic is RecommendedTopic => Boolean(topic));
    })();

    if (recommendedTopicsData.length > 0) {
        blocks.push({
            id: createId(),
            type: 'widget',
            widgetType: 'topics',
            data: recommendedTopicsData,
        });
        handled.add('Recommended Topics');
        handled.add('recommended_topics');
    }

    const getNodeData = (key: string): Record<string, unknown> | null => {
        const value = result[key];
        return isRecord(value) ? (value as Record<string, unknown>) : null;
    };

    const getProp = (source: Record<string, unknown> | null, key: string): unknown => {
        if (!source) return undefined;
        return source[key];
    };

    const toNumber = (value: unknown): number | undefined => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
    };

    const toStringValue = (value: unknown): string | undefined => {
        if (typeof value !== 'string') return undefined;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    };

    const toStringArray = (value: unknown): string[] => {
        if (!Array.isArray(value)) return [];
        return value
            .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
            .filter((entry) => entry.length > 0);
    };

    const parseMainKeyword = (value: unknown): KeywordIntelligenceData['mainKeyword'] => {
        if (!isRecord(value)) return null;
        const keyword = toStringValue(value.keyword);
        if (!keyword) return null;
        return {
            keyword,
            searchVolume: toNumber(value.search_volume),
            competitionLevel: toStringValue(value.competition_level),
            trendScore: toNumber(value.trend_score),
            relevanceScore: toNumber(value.relevance_score),
            cpcRange: isRecord(value.cpc_range)
                ? {
                    min: toNumber(value.cpc_range.min),
                    max: toNumber(value.cpc_range.max),
                }
                : undefined,
        };
    };

    const parseKeywordBreakdown = (value: unknown): KeywordIntelligenceData['keywordBreakdown'] => {
        if (!Array.isArray(value)) return [];
        const items: KeywordIntelligenceData['keywordBreakdown'] = [];
        value.forEach((entry) => {
            if (!isRecord(entry)) return;
            const keyword = toStringValue(entry.keyword);
            if (!keyword) return;
            items.push({
                keyword,
                type: toStringValue(entry.type),
                relevance: toNumber(entry.relevance),
            });
        });
        return items;
    };

    const parseSubKeywords = (value: unknown): KeywordIntelligenceData['selectedSubKeywords'] => {
        if (!Array.isArray(value)) return [];
        const items: KeywordIntelligenceData['selectedSubKeywords'] = [];
        value.forEach((entry) => {
            if (!isRecord(entry)) return;
            const keyword = toStringValue(entry.keyword);
            if (!keyword) return;
            items.push({
                keyword,
                finalScore: toNumber(entry.final_score),
                engagementPotential: toNumber(entry.engagement_potential),
                trendMomentum: toNumber(entry.trend_momentum),
                competitionAdvantage: toNumber(entry.competition_advantage),
                commercialValue: toNumber(entry.commercial_value),
                topicCoherenceScore: toNumber(entry.topic_coherence_score),
                selectionReason: toStringValue(entry.selection_reason),
            });
        });
        return items;
    };

    const parseSearchQueries = (value: unknown): Record<string, string> => {
        if (!isRecord(value)) return {};
        const entries: Array<[string, string]> = [];
        Object.entries(value).forEach(([key, raw]) => {
            if (typeof raw !== 'string') return;
            const trimmed = raw.trim();
            if (!trimmed) return;
            entries.push([key, trimmed]);
        });
        return Object.fromEntries(entries);
    };

    const mergeRecords = (...sources: unknown[]): Record<string, unknown> | undefined => {
        const merged: Record<string, unknown> = {};
        let hasValue = false;
        sources.forEach((source) => {
            if (!isRecord(source)) return;
            Object.entries(source).forEach(([key, value]) => {
                merged[key] = value;
                hasValue = true;
            });
        });
        return hasValue ? merged : undefined;
    };

    const parseEngagementMetrics = (value: unknown): EngagementOverviewData | null => {
        if (!isRecord(value)) return null;
        const platformPerformanceRaw = isRecord(value.platform_performance) ? value.platform_performance : null;
        const platformPerformanceEntries: EngagementOverviewData['platformPerformance'] = [];
        if (platformPerformanceRaw) {
            Object.entries(platformPerformanceRaw).forEach(([platformKey, metrics]) => {
                if (!isRecord(metrics)) return;
                platformPerformanceEntries.push({
                    platform: platformKey,
                    contentCount: toNumber(metrics.content_count),
                    averageQuality: toNumber(metrics.average_quality),
                    topQualityScore: toNumber(metrics.top_quality_score),
                });
            });
        }

        const sentimentRaw = isRecord(value.sentiment_distribution) ? value.sentiment_distribution : null;

        return {
            totalContentAnalyzed: toNumber(value.total_content_analyzed) ?? 0,
            averageQualityScore: toNumber(value.average_quality_score) ?? 0,
            platformPerformance: platformPerformanceEntries,
            sentimentDistribution: {
                positive: toNumber(sentimentRaw?.positive) ?? 0,
                neutral: toNumber(sentimentRaw?.neutral) ?? 0,
                negative: toNumber(sentimentRaw?.negative) ?? 0,
            },
        };
    };

    const parseRecommendations = (value: unknown): ContentOpportunitiesData['recommendations'] => {
        if (!Array.isArray(value)) return [];
        const items: ContentOpportunitiesData['recommendations'] = [];
        value.forEach((entry) => {
            if (!isRecord(entry)) return;
            const keyword = toStringValue(entry.keyword);
            if (!keyword) return;
            items.push({
                keyword,
                recommendedContentType: toStringValue(entry.recommended_content_type),
                expectedEngagement: toNumber(entry.expected_engagement),
                priority: toStringValue(entry.priority),
            });
        });
        return items;
    };

    const parseCompetitiveAnalysis = (value: unknown): ContentOpportunitiesData['competitiveAnalysis'] => {
        if (!isRecord(value)) return null;
        return {
            marketSaturation: toStringValue(value.market_saturation),
            contentGapOpportunities: toStringArray(value.content_gap_opportunities),
            differentiationStrategies: toStringArray(value.differentiation_strategies),
        };
    };

    const mainKeywordNode = getNodeData('Main Keyword Extractor');
    const keywordBreakdownNode = getNodeData('Keyword Breakdown');
    const subKeywordNode = getNodeData('Sub Keyword Evaluator');
    const advancedQueryNode = getNodeData('Advanced Query Generator');
    const engagementNode = getNodeData('Engagement Analyzer');
    const strategyNode = getNodeData('Strategy Generator');

    if (mainKeywordNode) handled.add('Main Keyword Extractor');
    if (keywordBreakdownNode) handled.add('Keyword Breakdown');
    if (subKeywordNode) handled.add('Sub Keyword Evaluator');
    if (advancedQueryNode) handled.add('Advanced Query Generator');
    if (engagementNode) handled.add('Engagement Analyzer');
    if (strategyNode) handled.add('Strategy Generator');

    const keywordIntelligence: KeywordIntelligenceData = {
        mainKeyword: null,
        keywordBreakdown: [],
        selectedSubKeywords: [],
        searchQueries: {},
    };

    const primaryMainKeyword = parseMainKeyword(getProp(mainKeywordNode, 'main_keyword'));
    const fallbackMainKeyword = parseMainKeyword(result['main_keyword']);
    if (primaryMainKeyword) {
        keywordIntelligence.mainKeyword = primaryMainKeyword;
    } else if (fallbackMainKeyword) {
        keywordIntelligence.mainKeyword = fallbackMainKeyword;
    }
    if (result['main_keyword'] !== undefined) {
        handled.add('main_keyword');
    }

    const primaryBreakdown = parseKeywordBreakdown(getProp(keywordBreakdownNode, 'keyword_breakdown'));
    const fallbackBreakdown = parseKeywordBreakdown(result['keyword_breakdown']);
    const combinedBreakdown = primaryBreakdown.length > 0 ? primaryBreakdown : fallbackBreakdown;
    keywordIntelligence.keywordBreakdown = combinedBreakdown.slice(0, 8);
    if (result['keyword_breakdown'] !== undefined) {
        handled.add('keyword_breakdown');
    }

    const primarySubKeywords = parseSubKeywords(getProp(subKeywordNode, 'selected_sub_keywords'));
    const fallbackSubKeywords = parseSubKeywords(result['selected_sub_keywords']);
    keywordIntelligence.selectedSubKeywords =
        primarySubKeywords.length > 0 ? primarySubKeywords : fallbackSubKeywords;
    if (result['selected_sub_keywords'] !== undefined) {
        handled.add('selected_sub_keywords');
    }

    const mergedSearchQueries = {
        ...parseSearchQueries(result['search_queries']),
        ...parseSearchQueries(getProp(advancedQueryNode, 'search_queries')),
    };
    keywordIntelligence.searchQueries = mergedSearchQueries;
    if (result['search_queries'] !== undefined) {
        handled.add('search_queries');
    }

    const keywordStrategy = mergeRecords(
        getProp(mainKeywordNode, 'keyword_strategy'),
        getProp(keywordBreakdownNode, 'keyword_strategy'),
        getProp(subKeywordNode, 'keyword_strategy'),
        getProp(advancedQueryNode, 'keyword_strategy'),
        getProp(strategyNode, 'keyword_strategy'),
        result['keyword_strategy'],
    );
    if (keywordStrategy) {
        handled.add('keyword_strategy');
    }

    const engagementOverviewData =
        parseEngagementMetrics(getProp(engagementNode, 'engagement_metrics'))
        ?? parseEngagementMetrics(result['engagement_metrics']);
    let engagementOverview: EngagementOverviewData | null = null;
    if (engagementOverviewData) {
        engagementOverview = {
            ...engagementOverviewData,
            keywordStrategy,
        };
    }
    if (result['engagement_metrics'] !== undefined) {
        handled.add('engagement_metrics');
    }

    const actionableInsightsPrimary = toStringArray(getProp(strategyNode, 'actionable_insights'));
    const actionableInsightsFallback = toStringArray(result['actionable_insights']);
    const seenInsight = new Set<string>();
    const actionableInsights = [...actionableInsightsPrimary, ...actionableInsightsFallback].filter((insight) => {
        const key = insight.toLowerCase();
        if (seenInsight.has(key)) return false;
        seenInsight.add(key);
        return true;
    });
    if (result['actionable_insights'] !== undefined) {
        handled.add('actionable_insights');
    }

    const recommendationsPrimary = parseRecommendations(getProp(strategyNode, 'content_recommendations'));
    const recommendationsFallback = parseRecommendations(result['content_recommendations']);
    const recommendationMap = new Map<string, ContentOpportunitiesData['recommendations'][number]>();
    [...recommendationsPrimary, ...recommendationsFallback].forEach((item) => {
        if (!item.keyword) return;
        if (!recommendationMap.has(item.keyword)) {
            recommendationMap.set(item.keyword, item);
        }
    });
    const recommendations = Array.from(recommendationMap.values());
    if (result['content_recommendations'] !== undefined) {
        handled.add('content_recommendations');
    }

    const competitiveAnalysis =
        parseCompetitiveAnalysis(getProp(strategyNode, 'competitive_analysis'))
        ?? parseCompetitiveAnalysis(result['competitive_analysis']);
    if (result['competitive_analysis'] !== undefined) {
        handled.add('competitive_analysis');
    }

    const hasKeywordInsights =
        keywordIntelligence.mainKeyword !== null
        || keywordIntelligence.keywordBreakdown.length > 0
        || keywordIntelligence.selectedSubKeywords.length > 0
        || Object.keys(keywordIntelligence.searchQueries).length > 0;
    if (hasKeywordInsights) {
        blocks.push({
            id: createId(),
            type: 'widget',
            widgetType: 'keyword-intelligence',
            data: keywordIntelligence,
        });
    }

    if (engagementOverview) {
        blocks.push({
            id: createId(),
            type: 'widget',
            widgetType: 'engagement-overview',
            data: engagementOverview,
        });
    }

    const hasCompetitiveInsights =
        actionableInsights.length > 0 || recommendations.length > 0 || competitiveAnalysis;
    if (hasCompetitiveInsights) {
        const opportunities: ContentOpportunitiesData = {
            actionableInsights,
            recommendations,
            competitiveAnalysis: competitiveAnalysis ?? null,
        };
        blocks.push({
            id: createId(),
            type: 'widget',
            widgetType: 'content-opportunities',
            data: opportunities,
        });
    }

    const referenceIndex = new Map<
        string,
        { id?: string; url?: string; title?: string; snippet?: string; platform?: string }
    >();
    const referenceIdToUrl = new Map<string, string>();
    if (summarizeValue && Array.isArray(summarizeValue.references)) {
        summarizeValue.references.forEach((ref) => {
            if (!isRecord(ref)) return;
            const url = typeof ref.url === 'string' ? ref.url : undefined;
            if (!url) return;
            const normalized = normalizeUrl(url);
            if (!normalized) return;
            const platform = typeof ref.platform === 'string' ? ref.platform.toLowerCase() : undefined;
            const snippet = typeof ref.snippet === 'string' ? ref.snippet : undefined;
            const title = typeof ref.title === 'string' ? ref.title : undefined;
            const id = typeof ref.id === 'string' ? ref.id : undefined;
            if (id) {
                referenceIdToUrl.set(id, normalized);
            }
            referenceIndex.set(normalized, { id, url, title, snippet, platform });
        });
    }

    type ReferenceFit = {
        id?: string;
        platform: 'threads' | 'x';
        score: number;
        reaction: string;
    };

    const normalizePlatformKey = (value?: string): 'threads' | 'x' | undefined => {
        if (!value) return undefined;
        const lower = value.toLowerCase();
        if (lower.includes('thread')) return 'threads';
        if (lower === 'x' || lower.includes('twitter')) return 'x';
        return undefined;
    };

    const analysisByUrl = new Map<string, ReferenceFit>();
    const analysisById = new Map<string, ReferenceFit>();

    const referenceAnalyzer = result['Reference Analyzer'];
    const rawReferenceAnalysis: unknown[] = Array.isArray(referenceAnalyzer)
        ? referenceAnalyzer
        : isRecord(referenceAnalyzer) && Array.isArray(referenceAnalyzer.reference_analysis)
            ? referenceAnalyzer.reference_analysis
            : isRecord(referenceAnalyzer) && Array.isArray(referenceAnalyzer.references)
                ? referenceAnalyzer.references
                : [];

    rawReferenceAnalysis.forEach((entry) => {
        if (!isRecord(entry)) return;
        const id = typeof entry.id === 'string' ? entry.id : undefined;
        const platformKey = normalizePlatformKey(typeof entry.platform === 'string' ? entry.platform : undefined);
        const reaction =
            typeof entry.audience_reaction === 'string' ? entry.audience_reaction.trim() : '';
        const scoreRaw =
            typeof entry.audience_fit_score === 'number'
                ? entry.audience_fit_score
                : typeof entry.audience_fit_score === 'string'
                    ? parseFloat(entry.audience_fit_score)
                    : undefined;
        if (!platformKey || !reaction || !Number.isFinite(scoreRaw ?? NaN)) return;
        const score = Math.max(0, Math.min(10, Number(scoreRaw)));
        const analysisEntry: ReferenceFit = { id, platform: platformKey, score, reaction };
        if (id) {
            analysisById.set(id, analysisEntry);
            const urlFromId = referenceIdToUrl.get(id);
            if (urlFromId) {
                analysisByUrl.set(urlFromId, analysisEntry);
            }
        }
    });
    if (rawReferenceAnalysis.length > 0) {
        handled.add('Reference Analyzer');
    }

    const buildReferenceContextForItems = (
        items: NormalizedSocialContent[],
        platform: 'threads' | 'x',
    ) => {
        const referenceMap: Record<string, { url?: string; title?: string; snippet?: string }> = {};
        const analysisMap: Record<string, ReferenceAnalysis> = {};
        const platformAliases = platform === 'threads' ? ['threads', 'thread'] : ['x', 'twitter'];
        items.forEach((item) => {
            const normalizedLink = normalizeUrl(item.link);
            const entry = normalizedLink ? referenceIndex.get(normalizedLink) : undefined;
            if (normalizedLink && entry) {
                if (!entry.platform || platformAliases.includes(entry.platform)) {
                    referenceMap[item.id] = {
                        url: entry.url,
                        title: entry.title,
                        snippet: entry.snippet,
                    };
                }
            }

            let analysisEntry: ReferenceFit | undefined;
            if (normalizedLink) {
                analysisEntry = analysisByUrl.get(normalizedLink);
            }
            if (!analysisEntry && entry?.id) {
                analysisEntry = analysisById.get(entry.id);
            }
            if (!analysisEntry) {
                analysisEntry = analysisById.get(item.id);
            }
            if (analysisEntry && analysisEntry.platform === platform) {
                const title =
                    entry?.title ||
                    item.authorName ||
                    item.handle ||
                    item.text.slice(0, 80).trim();
                analysisMap[item.id] = {
                    id: analysisEntry.id || item.id,
                    title,
                    url: entry?.url || item.link,
                    score: analysisEntry.score,
                    metrics: {},
                    source: 'model',
                    audienceComment: analysisEntry.reaction,
                    snippet: entry?.snippet,
                };
            }
        });
        return { referenceMap, analysisMap };
    };

    const searchResultsAggregate = isRecord(result['search_results'])
        ? (result['search_results'] as Record<string, unknown>)
        : null;
    if (searchResultsAggregate) {
        handled.add('search_results');
    }

    const extractErrors = (value: unknown): string[] => {
        if (!isRecord(value) || !Array.isArray(value.errors)) return [];
        return (value.errors as unknown[])
            .filter((error): error is string => typeof error === 'string' && error.trim().length > 0)
            .map((error) => error.trim());
    };

    type CollectedSearch = {
        items: NormalizedSocialContent[];
        attempted: boolean;
        errors: string[];
    };

    const collectSearchResult = (platform: 'threads' | 'x'): CollectedSearch => {
        const enhancedKey = platform === 'threads' ? 'Enhanced Threads Search' : 'Enhanced X Search';
        const legacyKey = platform === 'threads' ? 'Threads Search' : 'X Search';

        let attempted = false;
        const errors: string[] = [];

        const considerValue = (value: unknown, key?: string) => {
            if (key) {
                handled.add(key);
            }
            if (value !== undefined) {
                attempted = true;
                errors.push(...extractErrors(value));
                const items = extractSocialItems(value, platform);
                if (items.length > 0) {
                    return items;
                }
            }
            return null;
        };

        const enhancedValue = result[enhancedKey];
        const enhancedItems = considerValue(enhancedValue, enhancedValue !== undefined ? enhancedKey : undefined);
        if (enhancedItems) {
            return { items: enhancedItems, attempted: true, errors };
        }

        const legacyValue = result[legacyKey];
        const legacyItems = considerValue(legacyValue, legacyValue !== undefined ? legacyKey : undefined);
        if (legacyItems) {
            return { items: legacyItems, attempted: true, errors };
        }

        if (searchResultsAggregate) {
            const aggregatedValue = searchResultsAggregate[platform];
            const aggregatedItems = considerValue(aggregatedValue);
            if (aggregatedItems) {
                return { items: aggregatedItems, attempted, errors };
            }
        }

        if (summarizeValue) {
            const summaryItems = extractSocialItems(summarizeValue, platform);
            if (summaryItems.length > 0) {
                return {
                    items: summaryItems,
                    attempted: attempted || summaryItems.length > 0,
                    errors,
                };
            }
        }

        return { items: [], attempted, errors };
    };

    const threadsResult = collectSearchResult('threads');
    if (threadsResult.attempted || threadsResult.items.length > 0) {
        let referenceMap: Record<string, { url?: string; title?: string; snippet?: string }> | undefined;
        let analysisMap: Record<string, ReferenceAnalysis> | undefined;
        if (threadsResult.items.length > 0) {
            const context = buildReferenceContextForItems(threadsResult.items, 'threads');
            referenceMap = context.referenceMap;
            analysisMap = context.analysisMap;
        }
        blocks.push({
            id: createId(),
            type: 'threads',
            title: 'Threads Search',
            items: threadsResult.items,
            referenceData: referenceMap,
            referenceAnalysis: analysisMap,
            audienceAnalysis: audienceInsights,
            emptyMessage:
                threadsResult.items.length === 0
                    ? threadsResult.errors[0] ?? 'No Threads conversations met the quality threshold.'
                    : undefined,
        });
    }

    const xResult = collectSearchResult('x');
    if (xResult.attempted || xResult.items.length > 0) {
        let referenceMap: Record<string, { url?: string; title?: string; snippet?: string }> | undefined;
        let analysisMap: Record<string, ReferenceAnalysis> | undefined;
        if (xResult.items.length > 0) {
            const context = buildReferenceContextForItems(xResult.items, 'x');
            referenceMap = context.referenceMap;
            analysisMap = context.analysisMap;
        }
        blocks.push({
            id: createId(),
            type: 'x',
            title: 'X Search',
            items: xResult.items,
            referenceData: referenceMap,
            referenceAnalysis: analysisMap,
            audienceAnalysis: audienceInsights,
            emptyMessage:
                xResult.items.length === 0
                    ? xResult.errors[0] ?? 'No X conversations matched the search intent.'
                    : undefined,
        });
    }

    const keywordPlanner = result['Keyword Planner'];
    if (isRecord(keywordPlanner)) {
        const plannerParts: string[] = [];
        if (typeof keywordPlanner.topic === 'string' && keywordPlanner.topic.trim().length > 0) {
            plannerParts.push(`Topic: ${keywordPlanner.topic.trim()}`);
        }
        if (Array.isArray(keywordPlanner.keywords) && keywordPlanner.keywords.length > 0) {
            plannerParts.push(`Keywords: ${keywordPlanner.keywords.join(', ')}`);
        }
        if (isRecord(keywordPlanner.search_queries)) {
            const queries: string[] = [];
            if (typeof keywordPlanner.search_queries.threads === 'string') {
                queries.push(`Threads: ${keywordPlanner.search_queries.threads}`);
            }
            if (typeof keywordPlanner.search_queries.x === 'string') {
                queries.push(`X: ${keywordPlanner.search_queries.x}`);
            }
            if (queries.length > 0) {
                plannerParts.push(['Search Queries:', ...queries.map((line) => `- ${line}`)].join('\n'));
            }
        }

        const plannerContent = plannerParts.join('\n\n');
        if (plannerContent) {
            blocks.push({
                id: createId(),
                type: 'text',
                title: 'Keyword Planner',
                content: plannerContent,
            });
        }
        handled.add('Keyword Planner');
    }

    if (summarizeValue) {
        const summaryParts: string[] = [];
        if (typeof summarizeValue.summary === 'string' && summarizeValue.summary.trim().length > 0) {
            summaryParts.push(summarizeValue.summary.trim());
        }
        if (Array.isArray(summarizeValue.keywords) && summarizeValue.keywords.length > 0) {
            summaryParts.push(`Keywords: ${summarizeValue.keywords.join(', ')}`);
        }
        if (isRecord(summarizeValue.search_queries)) {
            const queries: string[] = [];
            if (typeof summarizeValue.search_queries.threads === 'string') {
                queries.push(`Threads: ${summarizeValue.search_queries.threads}`);
            }
            if (typeof summarizeValue.search_queries.x === 'string') {
                queries.push(`X: ${summarizeValue.search_queries.x}`);
            }
            if (queries.length > 0) {
                summaryParts.push(['Search Queries:', ...queries.map((line) => `- ${line}`)].join('\n'));
            }
        }

        const linkRefs: Array<{ id: string; label: string; url: string }> = [];
        const seenLinks = new Set<string>();
        if (Array.isArray(summarizeValue.references) && summarizeValue.references.length > 0) {
            summarizeValue.references.forEach((ref) => {
                if (!isRecord(ref)) return;
                const url = typeof ref.url === 'string' ? ref.url : undefined;
                if (!url) return;
                const platform = typeof ref.platform === 'string' ? ref.platform.toLowerCase() : '';
                const isPostPlatform = ['threads', 'thread', 'x', 'twitter', 'farcaster'].includes(platform);
                if (isPostPlatform) {
                    return;
                }

                const normalizedUrl = url.trim();
                if (!normalizedUrl || seenLinks.has(normalizedUrl)) return;
                seenLinks.add(normalizedUrl);

                const label = typeof ref.title === 'string' && ref.title.trim().length > 0
                    ? ref.title.trim()
                    : normalizedUrl.replace(/^https?:\/\//, '');

                linkRefs.push({
                    id: createId(),
                    label,
                    url: normalizedUrl,
                });
            });
        }

        const summaryContent = summaryParts.join('\n\n');
        if (summaryContent || linkRefs.length > 0) {
            blocks.push({
                id: createId(),
                type: 'text',
                title: 'Summary',
                content: summaryContent || 'Additional references provided.',
                links: linkRefs,
            });
        }
        if (summarizerKey) {
            handled.add(summarizerKey);
        }
    }

    Object.entries(result).forEach(([key, value]) => {
        if (handled.has(key) || key.startsWith('_')) return;
        const text = normalizeTextContent(value);
        if (!text) return;
        blocks.push({
            id: createId(),
            type: 'text',
            title: key,
            content: text,
        });
    });

    if (blocks.length === 0) {
        blocks.push({
            id: createId(),
            type: 'text',
            content: JSON.stringify(result, null, 2),
        });
    }

    return blocks;
};

const mapSubmittedContextToStructured = (context: SubmittedContext | null) => {
    if (!context) {
        return {
            addOns: [] as { id: string; name: string; description: string }[],
        };
    }

    return {
        persona: context.persona
            ? {
                id: context.persona.id,
                name: context.persona.name,
                description: context.persona.description || '',
            }
            : null,
        audience: context.audience
            ? {
                id: context.audience.id,
                name: context.audience.name,
                description: context.audience.description || '',
            }
            : null,
        objective: context.objective
            ? {
                id: context.objective.id,
                name: context.objective.name,
                description: context.objective.description || '',
            }
            : null,
        addOns: context.addOns.map((addOn) => ({
            id: addOn.id,
            name: addOn.name,
            description: addOn.description || '',
        })),
    };
};

const summarizeContextFromSelections = (
    persona?: PreferenceOption | null,
    audience?: PreferenceOption | null,
    objective?: PreferenceOption | null,
    addOns: AddOnOption[] = [],
): string => {
    const segments: string[] = [];
    if (persona) {
        segments.push(`Persona: ${persona.name}` + (persona.description ? `\n${persona.description}` : ''));
    }
    if (audience) {
        segments.push(`Audience: ${audience.name}` + (audience.description ? `\n${audience.description}` : ''));
    }
    if (objective) {
        segments.push(`Objective: ${objective.name}` + (objective.description ? `\n${objective.description}` : ''));
    }
    if (addOns.length > 0) {
        const addOnSummary = addOns
            .map(item => `${item.name}${item.description ? ` - ${item.description}` : ''}`)
            .join('\n');
        segments.push(`Add-ons:\n${addOnSummary}`);
    }
    return segments.join('\n\n');
};

const summarizeSubmittedContext = (context: SubmittedContext | null): string => {
    if (!context) return '';
    return summarizeContextFromSelections(context.persona, context.audience, context.objective, context.addOns);
};
export default function TopicFinderPage() {
    // Initialize Farcaster Mini App
    useMiniAppReady();

    const t = useTranslations('pages.contents.topicFinder');
    const locale = useLocale();
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { setPendingThreadChain, setGenerationStatus, clearGenerationPreview, threadChain, setThreadChain, ensureThreadCount, setThreadContentAt } = useThreadChainStore();
    const { openRightSidebar, isRightSidebarOpen } = useMobileSidebar();
    const queryClient = useQueryClient();

    const { data: session } = useSession();
    const userId = session?.user?.id || null;

    const { currentSocialId, currentUsername, accounts } = useSocialAccountStore()
    const [selectedHeadline, setSelectedHeadline] = useState<string>('');
    const [givenInstruction, setGivenInstruction] = useState<string>('');
    const [personas, setPersonas] = useState<PreferenceOption[]>([]);
    const [audiences, setAudiences] = useState<PreferenceOption[]>([]);
    const [objectives, setObjectives] = useState<PreferenceOption[]>([]);
    const [addOns, setAddOns] = useState<AddOnOption[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
    const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
    const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [isPreferenceLoading, setIsPreferenceLoading] = useState(false);
    const [modalState, setModalState] = useState<{
        type: 'persona' | 'audience' | 'objective' | 'addOn' | null;
        open: boolean;
        mode: 'create' | 'edit';
        item: (PreferenceOption | AddOnOption) | null;
    }>({ type: null, open: false, mode: 'create', item: null });
    const [modalSaving, setModalSaving] = useState(false);
    const { postType, language, setPostType, setLanguage } = useContentGenerationStore();
    const { setOriginalAiContent } = useAiContentStore();
    const [submittedContext, setSubmittedContext] = useState<SubmittedContext | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    // Memoize Supabase client to prevent creating new instances
    const supabase = useMemo(() => createClient(), []);

    const selectedPersona = useMemo(() => personas.find(item => item.id === selectedPersonaId) || null, [personas, selectedPersonaId]);
    const selectedAudience = useMemo(() => audiences.find(item => item.id === selectedAudienceId) || null, [audiences, selectedAudienceId]);
    const selectedObjective = useMemo(() => objectives.find(item => item.id === selectedObjectiveId) || null, [objectives, selectedObjectiveId]);
    const selectedAddOnsList = useMemo(() => addOns.filter(item => selectedAddOnIds.includes(item.id)), [addOns, selectedAddOnIds]);
    const contextSummary = useMemo(
        () => summarizeContextFromSelections(selectedPersona, selectedAudience, selectedObjective, selectedAddOnsList),
        [selectedPersona, selectedAudience, selectedObjective, selectedAddOnsList]
    );
    const contextBadges = useMemo(() => {
        if (!submittedContext) return [];
        const badges: { label: string; value: string }[] = [];
        if (submittedContext.persona) {
            badges.push({ label: 'Persona', value: submittedContext.persona.name });
        }
        if (submittedContext.audience) {
            badges.push({ label: 'Audience', value: submittedContext.audience.name });
        }
        if (submittedContext.objective) {
            badges.push({ label: 'Objective', value: submittedContext.objective.name });
        }
        if (submittedContext.addOns.length > 0) {
            submittedContext.addOns.forEach((addOn) => {
                badges.push({ label: 'Add-on', value: addOn.name });
            });
        }
        return badges;
    }, [submittedContext]);
    const profileAnalytics = useProfileAnalytics(currentSocialId, 7);
    const profileSummaryText = useMemo(() => buildProfileSummaryText(profileAnalytics), [profileAnalytics]);
    const requestAudienceAnalysis = useMemo(
        () => buildAudienceAnalysis(selectedPersona, selectedAudience, selectedObjective, selectedAddOnsList),
        [selectedPersona, selectedAudience, selectedObjective, selectedAddOnsList]
    );
    const audienceSummaryText = useMemo(
        () => buildAudienceSummaryText(requestAudienceAnalysis),
        [requestAudienceAnalysis]
    );
    const displayedHeadline = submittedContext?.headline ?? '';
    const isChatActive = submittedContext !== null;
    const isPreChatReady = Boolean(
        selectedPersona &&
        selectedAudience &&
        selectedObjective &&
        selectedHeadline.trim().length > 0 &&
        contextSummary.trim().length > 0
    );

    const ensurePreference = useCallback(async () => {
        if (!userId) return null;
        if (preferenceId) return preferenceId;

        const { data, error } = await supabase
            .from('topic_finder_preferences')
            .insert({ user_account_id: userId })
            .select('id')
            .single();

        if (error) {
            toast.error('Failed to initialize preferences');
            console.error('Failed to initialize preferences', error);
            return null;
        }

        setPreferenceId(data.id);
        return data.id;
    }, [preferenceId, supabase, userId]);

    const loadPreferenceSelections = useCallback(async () => {
        if (!userId) return;
        setIsPreferenceLoading(true);
        try {
            const { data: preferenceData, error } = await supabase
                .from('topic_finder_preferences')
                .select('id, persona_id, audience_id, objective_id')
                .eq('user_account_id', userId)
                .maybeSingle();

            if (!error && preferenceData) {
                setPreferenceId(preferenceData.id);
                setSelectedPersonaId(preferenceData.persona_id || null);
                setSelectedAudienceId(preferenceData.audience_id || null);
                setSelectedObjectiveId(preferenceData.objective_id || null);

                const { data: addOnSelections, error: addOnError } = await supabase
                    .from('topic_finder_preference_add_ons')
                    .select('add_on_id')
                    .eq('preference_id', preferenceData.id);

                if (!addOnError && addOnSelections) {
                    setSelectedAddOnIds(addOnSelections.map(item => item.add_on_id));
                }
            }
        } catch (error) {
            console.error('Failed to load preferences', error);
        } finally {
            setIsPreferenceLoading(false);
        }
    }, [supabase, userId]);

    const loadPreferenceOptions = useCallback(async () => {
        if (!userId) return;
        try {
            const [personaRes, audienceRes, objectiveRes, addOnRes] = await Promise.all([
                supabase
                    .from('personas')
                    .select('id, name, description, is_public')
                    .or(`is_public.eq.true,user_account_id.eq.${userId}`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('audiences')
                    .select('id, name, description, is_public')
                    .or(`is_public.eq.true,user_account_id.eq.${userId}`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('objectives')
                    .select('id, name, description, is_public')
                    .or(`is_public.eq.true,user_account_id.eq.${userId}`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('add_ons')
                    .select('id, name, description, is_public')
                    .or(`is_public.eq.true,user_account_id.eq.${userId},user_account_id.is.null`)
                    .order('created_at', { ascending: false }),
            ]);

            if (!personaRes.error && personaRes.data) setPersonas(personaRes.data as PreferenceOption[]);
            if (!audienceRes.error && audienceRes.data) setAudiences(audienceRes.data as PreferenceOption[]);
            if (!objectiveRes.error && objectiveRes.data) setObjectives(objectiveRes.data as PreferenceOption[]);
            if (!addOnRes.error && addOnRes.data) setAddOns(addOnRes.data as AddOnOption[]);

            if (personaRes.error) console.error('Failed to load personas', personaRes.error);
            if (audienceRes.error) console.error('Failed to load audiences', audienceRes.error);
            if (objectiveRes.error) console.error('Failed to load objectives', objectiveRes.error);
            if (addOnRes.error) console.error('Failed to load add-ons', addOnRes.error);
        } catch (error) {
            console.error('Failed to load preference options', error);
        }
    }, [supabase, userId]);

    const modalConfig = useMemo(() => {
        switch (modalState.type) {
            case 'persona':
                return {
                    title: t('personaTitle'),
                    namePlaceholder: t('personaNamePlaceholder'),
                    descriptionPlaceholder: t('personaDescriptionPlaceholder'),
                    includePublicToggle: false,
                };
            case 'audience':
                return {
                    title: t('audienceTitle'),
                    namePlaceholder: t('audienceNamePlaceholder'),
                    descriptionPlaceholder: t('audienceDescriptionPlaceholder'),
                    includePublicToggle: false,
                };
            case 'objective':
                return {
                    title: t('objectiveTitle'),
                    namePlaceholder: t('objectiveNamePlaceholder'),
                    descriptionPlaceholder: t('objectiveDescriptionPlaceholder'),
                    includePublicToggle: false,
                };
            case 'addOn':
                return {
                    title: t('addOnTitle'),
                    namePlaceholder: t('addOnNamePlaceholder'),
                    descriptionPlaceholder: t('addOnDescriptionPlaceholder'),
                    includePublicToggle: true,
                };
            default:
                return {
                    title: '',
                    namePlaceholder: '',
                    descriptionPlaceholder: '',
                    includePublicToggle: false,
                };
        }
    }, [modalState.type, t]);

    const structuredContext = useMemo(() => ({
        persona: selectedPersona ? { id: selectedPersona.id, name: selectedPersona.name, description: selectedPersona.description || '' } : null,
        audience: selectedAudience ? { id: selectedAudience.id, name: selectedAudience.name, description: selectedAudience.description || '' } : null,
        objective: selectedObjective ? { id: selectedObjective.id, name: selectedObjective.name, description: selectedObjective.description || '' } : null,
        addOns: selectedAddOnsList.map(addOn => ({ id: addOn.id, name: addOn.name, description: addOn.description || '' })),
        sourceReference: null as null | {
            id: string;
            link?: string;
            platform: 'threads' | 'x';
            excerpt: string;
        },
    }), [selectedAddOnsList, selectedAudience, selectedObjective, selectedPersona]);

    const updatePreference = useCallback(
        async (payload: Partial<{ persona_id: string | null; audience_id: string | null; objective_id: string | null }>) => {
            if (!userId) {
                toast.error('Please sign in to manage preferences.');
                return null;
            }
            const id = await ensurePreference();
            if (!id) return null;

            const { data, error } = await supabase
                .from('topic_finder_preferences')
                .update(payload)
                .eq('id', id)
                .select('persona_id, audience_id, objective_id')
                .single();

            if (error) {
                toast.error('Failed to save preference.');
                console.error('Failed to update preferences', error);
                return null;
            }

            if (payload.persona_id !== undefined) setSelectedPersonaId(data.persona_id || null);
            if (payload.audience_id !== undefined) setSelectedAudienceId(data.audience_id || null);
            if (payload.objective_id !== undefined) setSelectedObjectiveId(data.objective_id || null);

            return data;
        },
        [ensurePreference, supabase, userId]
    );

    const handlePersonaSelect = useCallback(
        async (option: PreferenceOption) => {
            setIsPreferenceLoading(true);
            try {
                await updatePreference({ persona_id: option.id });
            } finally {
                setIsPreferenceLoading(false);
            }
        },
        [updatePreference]
    );

    const handleAudienceSelect = useCallback(
        async (option: PreferenceOption) => {
            setIsPreferenceLoading(true);
            try {
                await updatePreference({ audience_id: option.id });
            } finally {
                setIsPreferenceLoading(false);
            }
        },
        [updatePreference]
    );

    const handleObjectiveSelect = useCallback(
        async (option: PreferenceOption) => {
            setIsPreferenceLoading(true);
            try {
                await updatePreference({ objective_id: option.id });
            } finally {
                setIsPreferenceLoading(false);
            }
        },
        [updatePreference]
    );

    const handleToggleAddOn = useCallback(
        async (option: AddOnOption) => {
            if (!userId) {
                toast.error('Please sign in to manage preferences.');
                return;
            }
            const id = await ensurePreference();
            if (!id) return;

            const isActive = selectedAddOnIds.includes(option.id);
            setIsPreferenceLoading(true);
            try {
                if (isActive) {
                    const { error } = await supabase
                        .from('topic_finder_preference_add_ons')
                        .delete()
                        .eq('preference_id', id)
                        .eq('add_on_id', option.id);
                    if (error) {
                        toast.error('Failed to remove add-on.');
                        console.error('Failed to remove add-on', error);
                        return;
                    }
                    setSelectedAddOnIds(prev => prev.filter(addOnId => addOnId !== option.id));
                } else {
                    const { error } = await supabase
                        .from('topic_finder_preference_add_ons')
                        .upsert({ preference_id: id, add_on_id: option.id, last_selected_at: new Date().toISOString() }, { onConflict: 'preference_id,add_on_id' });
                    if (error) {
                        toast.error('Failed to add add-on.');
                        console.error('Failed to add add-on', error);
                        return;
                    }
                    setSelectedAddOnIds(prev => [...prev, option.id]);
                }
            } finally {
                setIsPreferenceLoading(false);
            }
        },
        [ensurePreference, selectedAddOnIds, supabase, userId]
    );

    const openCreateModal = useCallback((type: 'persona' | 'audience' | 'objective' | 'addOn') => {
        setModalState({ type, open: true, mode: 'create', item: null });
    }, []);

    const openEditModal = useCallback((type: 'persona' | 'audience' | 'objective' | 'addOn', option: PreferenceOption | AddOnOption) => {
        setModalState({ type, open: true, mode: 'edit', item: option });
    }, []);

    const closeCreateModal = useCallback(() => {
        setModalState({ type: null, open: false, mode: 'create', item: null });
    }, []);

    const handleSavePreferenceItem = useCallback(
        async ({ name, description, isPublic }: { name: string; description: string; isPublic?: boolean }) => {
            if (!modalState.type || !userId) {
                toast.error('Please sign in to manage preferences.');
                return;
            }

            const tableMap = {
                persona: 'personas',
                audience: 'audiences',
                objective: 'objectives',
                addOn: 'add_ons'
            } as const;

            const titleMap = {
                persona: 'Persona',
                audience: 'Audience',
                objective: 'Objective',
                addOn: 'Add-on'
            } as const;

            const table = tableMap[modalState.type];
            setModalSaving(true);

            try {
                if (modalState.mode === 'edit' && modalState.item) {
                    const updatePayload: Record<string, any> = {
                        name,
                        description: description || null,
                    };

                    if (modalState.type === 'addOn') {
                        updatePayload.is_public = !!isPublic;
                    }

                    const { data, error } = await supabase
                        .from(table)
                        .update(updatePayload)
                        .eq('id', modalState.item.id)
                        .select('id, name, description, is_public')
                        .single();

                    if (error) {
                        throw error;
                    }

                    if (modalState.type === 'persona') {
                        const updated = data as PreferenceOption;
                        setPersonas(prev => prev.map(item => (item.id === updated.id ? updated : item)));
                        if (selectedPersonaId === updated.id) {
                            setSelectedPersonaId(updated.id);
                        }
                    } else if (modalState.type === 'audience') {
                        const updated = data as PreferenceOption;
                        setAudiences(prev => prev.map(item => (item.id === updated.id ? updated : item)));
                        if (selectedAudienceId === updated.id) {
                            setSelectedAudienceId(updated.id);
                        }
                    } else if (modalState.type === 'objective') {
                        const updated = data as PreferenceOption;
                        setObjectives(prev => prev.map(item => (item.id === updated.id ? updated : item)));
                        if (selectedObjectiveId === updated.id) {
                            setSelectedObjectiveId(updated.id);
                        }
                    } else if (modalState.type === 'addOn') {
                        const updated = data as AddOnOption;
                        setAddOns(prev => prev.map(item => (item.id === updated.id ? updated : item)));
                    }

                    toast.success(`${titleMap[modalState.type]} updated.`);
                    closeCreateModal();
                    return;
                }

                const payload: Record<string, any> = {
                    name,
                    description: description || null,
                    user_account_id: userId,
                };

                if (modalState.type === 'addOn') {
                    payload.is_public = !!isPublic;
                } else {
                    payload.is_public = false;
                }

                const { data, error } = await supabase
                    .from(table)
                    .insert(payload)
                    .select('id, name, description, is_public')
                    .single();

                if (error) {
                    throw error;
                }

                if (modalState.type === 'persona') {
                    setPersonas(prev => [data as PreferenceOption, ...prev]);
                    await handlePersonaSelect(data as PreferenceOption);
                } else if (modalState.type === 'audience') {
                    setAudiences(prev => [data as PreferenceOption, ...prev]);
                    await handleAudienceSelect(data as PreferenceOption);
                } else if (modalState.type === 'objective') {
                    setObjectives(prev => [data as PreferenceOption, ...prev]);
                    await handleObjectiveSelect(data as PreferenceOption);
                } else if (modalState.type === 'addOn') {
                    setAddOns(prev => [data as AddOnOption, ...prev]);
                    await handleToggleAddOn(data as AddOnOption);
                }

                toast.success(`${titleMap[modalState.type]} created.`);
                closeCreateModal();
            } catch (error) {
                console.error('Failed to create preference item', error);
                toast.error('Failed to create item.');
            } finally {
                setModalSaving(false);
            }
        },
        [closeCreateModal, handleAudienceSelect, handleObjectiveSelect, handlePersonaSelect, handleToggleAddOn, modalState.item, modalState.mode, modalState.type, selectedAudienceId, selectedObjectiveId, selectedPersonaId, supabase, userId]
    );

    const handleDeletePreferenceItem = useCallback(async () => {
        if (!modalState.type || modalState.mode !== 'edit' || !modalState.item || !userId) {
            toast.error('Unable to delete this item.');
            return;
        }

        const tableMap = {
            persona: 'personas',
            audience: 'audiences',
            objective: 'objectives',
            addOn: 'add_ons'
        } as const;

        const titleMap = {
            persona: 'Persona',
            audience: 'Audience',
            objective: 'Objective',
            addOn: 'Add-on'
        } as const;

        const table = tableMap[modalState.type];

        setModalSaving(true);

        try {
            const { error } = await supabase.from(table).delete().eq('id', modalState.item.id);
            if (error) {
                throw error;
            }

            if (modalState.type === 'persona') {
                setPersonas(prev => prev.filter(item => item.id !== modalState.item?.id));
                if (selectedPersonaId === modalState.item.id) {
                    await updatePreference({ persona_id: null });
                }
            } else if (modalState.type === 'audience') {
                setAudiences(prev => prev.filter(item => item.id !== modalState.item?.id));
                if (selectedAudienceId === modalState.item.id) {
                    await updatePreference({ audience_id: null });
                }
            } else if (modalState.type === 'objective') {
                setObjectives(prev => prev.filter(item => item.id !== modalState.item?.id));
                if (selectedObjectiveId === modalState.item.id) {
                    await updatePreference({ objective_id: null });
                }
            } else if (modalState.type === 'addOn') {
                setAddOns(prev => prev.filter(item => item.id !== modalState.item?.id));
                setSelectedAddOnIds(prev => prev.filter(id => id !== modalState.item?.id));
                const preferenceIdValue = preferenceId || (await ensurePreference());
                if (preferenceIdValue) {
                    await supabase
                        .from('topic_finder_preference_add_ons')
                        .delete()
                        .eq('preference_id', preferenceIdValue)
                        .eq('add_on_id', modalState.item.id);
                }
            }

            toast.success(`${titleMap[modalState.type]} deleted.`);
            closeCreateModal();
        } catch (error) {
            console.error('Failed to delete preference item', error);
            toast.error('Failed to delete item.');
        } finally {
            setModalSaving(false);
        }
    }, [closeCreateModal, ensurePreference, modalState.item, modalState.mode, modalState.type, preferenceId, selectedAudienceId, selectedObjectiveId, selectedPersonaId, setSelectedAddOnIds, supabase, updatePreference, userId]);

    // topicResults zustand store
    const {
        topicResults,
        addTopicResults,
        updateTopicResult,
        setTopicLoading,
        setTopicDetail,
        removeTopicResult,
    } = useTopicResultsStore();

    // Mount 상태 설정 - hydration 오류 방지
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!userId) return;
        loadPreferenceOptions();
    }, [userId, loadPreferenceOptions]);

    useEffect(() => {
        if (!userId) return;
        loadPreferenceSelections();
    }, [userId, loadPreferenceSelections]);

    useEffect(() => {
        if (!isChatActive) return;
        const container = chatContainerRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    }, [conversation, isChatActive]);

    // 토픽 변경 핸들러
    const handleTopicChange = (idx: number, newVal: string) => {
        updateTopicResult(idx, newVal);
    };
    // instruction 변경 핸들러
    const handleInstructionChange = (v: string) => {
        setGivenInstruction(v);
    };

    // Intelligent prefetch on user interaction (hover/focus)
    const handleUserEngagement = useCallback(() => {
        // 사용자가 페이지와 상호작용할 때 추가 prefetch
        if (!currentSocialId) return;


        startTransition(() => {
            // 사용자가 활동할 때만 나머지 데이터 prefetch
            queryClient.prefetchQuery({
                queryKey: statisticsKeys.userInsights(currentSocialId, 30), // 30일 데이터
                queryFn: () => fetchUserInsights(currentSocialId, 30),
                staleTime: 10 * 60 * 1000,
            });
        });
    }, [currentSocialId, queryClient]);

    // 디테일 생성 핸들러 - Stream UI Message Protocol 소비로 전환
    const handleGenerateDetail = async () => {
        if (!selectedHeadline) {
            toast.error(t('writeOrAddTopic'));
            return;
        }
        if (!selectedPersona || !selectedAudience || !selectedObjective) {
            toast.error('Select persona, audience, and objective first.');
            return;
        }

        const contextInfo = contextSummary.trim();
        if (!contextInfo) {
            toast.error('Please provide context before generating.');
            return;
        }

        const headline = selectedHeadline;
        setTopicLoading(headline, true);
        setIsGeneratingDetails(true);
        try {
            const threads = await executeGenerationRequest({
                topic: headline,
                accountInfo: contextInfo,
                instruction: givenInstruction,
                context: structuredContext,
            });

            setTopicDetail(headline, threads.join('\n\n'));
            toast.success(t('threadsGenerated', { count: threads.length }));

            trackUserAction.aiContentGenerated({
                topic: headline,
                postType: postType as 'single' | 'thread',
                language,
                threadCount: threads.length,
            });
        } catch (e) {
            toast.error(t('failedToGenerateChain'));
            setTopicLoading(headline, false);
            setGenerationStatus(null);
            clearGenerationPreview();
        } finally {
            setIsGeneratingDetails(false);
        }
    };


    // 백그라운드 my_contents 동기화 (페이지 로드 시 한 번만 실행)
    useEffect(() => {
        const syncMyContents = async () => {
            try {
                const response = await fetch('/api/my-contents/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ limit: 30 }),
                });

                if (response.ok) {
                    const data = await response.json();
                    // 선택적으로 성공 메시지 표시 (사용자에게 방해가 되지 않도록 주석 처리)
                    // toast.success(`${data.synchronized}개 게시물이 동기화되었습니다.`);
                }
            } catch (error) {
                // 백그라운드 작업이므로 에러가 발생해도 사용자 경험에 영향을 주지 않음
            }
        };

        // 페이지 로드 시 한 번만 실행
        syncMyContents();
    }, []); // 빈 의존성 배열로 마운트 시에만 실행

    // Optimized background prefetch with priority control
    useEffect(() => {
        if (!currentSocialId) return;

        const accountId = currentSocialId;
        const dateRange = 7;

        // 지연된 백그라운드 prefetch - UI 블로킹 방지
        const delayedPrefetch = async () => {
            try {
                // 1단계: 가장 중요한 데이터만 먼저 prefetch (우선도 높음)
                await Promise.allSettled([
                    queryClient.prefetchQuery({
                        queryKey: ['comments', currentSocialId],
                        queryFn: async () => {
                            await fetchAndSaveComments();
                            const result = await getAllCommentsWithRootPosts();
                            return result;
                        },
                        staleTime: 1000 * 60 * 5,
                    })
                ]);

                // 2단계: 중요도 중간 데이터 (1초 지연)
                setTimeout(async () => {
                    await Promise.allSettled([
                        queryClient.prefetchQuery({
                            queryKey: ['mentions', currentSocialId],
                            queryFn: async () => {
                                await fetchAndSaveMentions();
                                const result = await getAllMentionsWithRootPosts();
                                return result;
                            },
                            staleTime: 1000 * 60 * 5,
                        })
                    ]);
                }, 1000);

                // 3단계: 통계 데이터 (2초 지연 - 백그라운드에서 조용히)
                setTimeout(async () => {
                    await Promise.allSettled([
                        queryClient.prefetchQuery({
                            queryKey: statisticsKeys.userInsights(accountId, dateRange),
                            queryFn: () => fetchUserInsights(accountId, dateRange),
                            staleTime: 5 * 60 * 1000,
                        }),
                        queryClient.prefetchQuery({
                            queryKey: statisticsKeys.topPosts(accountId),
                            queryFn: () => fetchTopPosts(accountId),
                            staleTime: 10 * 60 * 1000,
                        })
                    ]);
                }, 2000);

            } catch (error) {
                // prefetch 실패는 사용자 경험에 영향주지 않음
            }
        };

        // startTransition으로 래핑하여 더 낮은 우선도로 실행
        startTransition(() => {
            // 추가로 50ms 지연으로 초기 렌더링 완전히 완료 후 실행
            setTimeout(delayedPrefetch, 50);
        });

    }, [currentSocialId, queryClient]);

    // 사용자 상호작용 감지로 추가 prefetch 트리거
    useEffect(() => {
        let interactionTimer: NodeJS.Timeout;
        let hasTriggered = false;

        const handleInteraction = () => {
            if (hasTriggered) return;

            // 디바운스: 1초 후에 실행
            clearTimeout(interactionTimer);
            interactionTimer = setTimeout(() => {
                handleUserEngagement();
                hasTriggered = true;
            }, 1000);
        };

        // 다양한 사용자 상호작용 이벤트 리스닝
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, handleInteraction, { passive: true, once: true });
        });

        return () => {
            clearTimeout(interactionTimer);
            events.forEach(event => {
                document.removeEventListener(event, handleInteraction);
            });
        };
    }, [handleUserEngagement]);

    // 토픽 생성 함수
    const generateTopics = async () => {
        if (!selectedPersona || !selectedAudience || !selectedObjective) {
            toast.error('Select persona, audience, and objective first.');
            return;
        }

        if (!contextSummary.trim()) {
            toast.error('Please provide context before generating topics.');
            return;
        }
        setIsGeneratingTopics(true);
        setIsLoading(true);
        try {
            const res = await fetch('/api/generate-topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona: structuredContext.persona,
                    audience: structuredContext.audience,
                    objective: structuredContext.objective,
                    addOns: structuredContext.addOns,
                    contextSummary,
                    language
                })
            });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const newTopics = Array.isArray(data) ? data : data.topics;

            if (!Array.isArray(newTopics)) {
                toast.error('Invalid topic result format');
                return;
            }

            // 데이터 구조 단순화
            addTopicResults(
                newTopics.map((topic: any) => ({
                    topic: typeof topic === 'string' ? topic : topic.topic || '',
                    detail: undefined,
                    loading: false,
                    dialogOpen: false
                }))
            );
        } catch (e) {
            toast.error(t('failedToGenerateTopics'));
        } finally {
            setIsGeneratingTopics(false);
            setIsLoading(false);
        }
    };

    const executeGenerationRequest = useCallback(
        async ({
            topic,
            accountInfo,
            instruction,
            context,
            statusLabel = 'thinking how to write...',
            mode = 'default',
        }: {
            topic: string;
            accountInfo: string;
            instruction?: string;
            context: ReturnType<typeof mapSubmittedContextToStructured> & {
                sourceReference?: {
                    id: string;
                    link?: string;
                    platform: 'threads' | 'x';
                    excerpt: string;
                    body?: string;
                } | null;
            };
            statusLabel?: string;
            mode?: 'default' | 'repurpose';
        }): Promise<string[]> => {
            if (!topic) {
                throw new Error('Missing topic for generation');
            }

            if (!isRightSidebarOpen) {
                openRightSidebar();
            }

            setGenerationStatus(statusLabel);
            clearGenerationPreview();

            if (threadChain.length === 0) {
                setThreadChain([{ content: '', media_urls: [], media_type: 'TEXT' }]);
            }

            const response = await fetch('/api/generate-detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountInfo,
                    topic,
                    instruction,
                    postType,
                    language,
                    context,
                    mode,
                }),
            });

            if (!response.ok) {
                throw new Error('API error');
            }

            const finalizeThreads = (finalThreads: string[]): string[] => {
                if (!finalThreads || finalThreads.length === 0) {
                    throw new Error('No threads received');
                }

                const normalizedThreads: ThreadContent[] = finalThreads.map((content: string) => ({
                    content,
                    media_urls: [],
                    media_type: 'TEXT' as const,
                }));

                setPendingThreadChain(normalizedThreads);
                setOriginalAiContent(normalizedThreads);
                setGenerationStatus(null);
                clearGenerationPreview();

                return finalThreads;
            };

            const isUIStream = response.headers.get('x-vercel-ai-ui-message-stream') === 'v1';
            const contentType = response.headers.get('content-type') || '';

            if (isUIStream || contentType.includes('text/event-stream')) {
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('No readable stream');
                }

                const decoder = new TextDecoder();
                let buffer = '';
                let finalThreads: string[] | null = null;
                let singleBuffer = '';
                let arrayStarted = false;
                let insideString = false;
                let escapeNext = false;
                let builtItems: string[] = [];
                let currentItem = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });

                    const events = buffer.split('\n\n');
                    buffer = events.pop() || '';

                    for (const evt of events) {
                        const lines = evt.split('\n');
                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            const jsonStr = line.slice(6).trim();
                            if (jsonStr === '' || jsonStr === '[DONE]') continue;

                            let dataPart: any;
                            try {
                                dataPart = JSON.parse(jsonStr);
                            } catch {
                                continue;
                            }

                            if (dataPart.type === 'data-status') {
                                const msg = dataPart.data?.message || '';
                                if (typeof msg === 'string' && msg) {
                                    const lower = msg.toLowerCase();
                                    if (lower.includes('preparing')) setGenerationStatus(statusLabel);
                                    else if (lower.includes('generating')) setGenerationStatus(t('writingDraft'));
                                    else if (lower.includes('completed')) setGenerationStatus('finalizing...');
                                    else setGenerationStatus(msg);
                                }
                            }

                            if (dataPart.type === 'data-threads') {
                                const threads = (dataPart.data?.threads || []) as string[];
                                if (Array.isArray(threads) && threads.length > 0) {
                                    finalThreads = threads;
                                }
                            }

                            if (dataPart.type === 'text-delta' && typeof dataPart.delta === 'string') {
                                const delta: string = dataPart.delta;
                                if (postType === 'single') {
                                    singleBuffer += delta;
                                    const normalized = singleBuffer.replace(/\\n/g, '\n');
                                    ensureThreadCount(1);
                                    setThreadContentAt(0, normalized);
                                } else {
                                    for (let i = 0; i < delta.length; i++) {
                                        const ch = delta[i];
                                        if (!arrayStarted) {
                                            if (ch === '[') arrayStarted = true;
                                            continue;
                                        }
                                        if (!insideString) {
                                            if (ch === '"') {
                                                insideString = true;
                                                escapeNext = false;
                                                currentItem = '';
                                                ensureThreadCount(builtItems.length + 1);
                                            } else if (ch === ']') {
                                                arrayStarted = false;
                                            }
                                        } else {
                                            if (escapeNext) {
                                                if (ch === 'n') currentItem += '\n';
                                                else if (ch === 'r') currentItem += '\r';
                                                else if (ch === 't') currentItem += '\t';
                                                else if (ch === '"') currentItem += '"';
                                                else if (ch === '\\') currentItem += '\\';
                                                else if (ch === '/') currentItem += '/';
                                                else currentItem += ch;
                                                escapeNext = false;
                                            } else if (ch === '\\') {
                                                escapeNext = true;
                                            } else if (ch === '"') {
                                                builtItems.push(currentItem);
                                                const normalized = currentItem;
                                                ensureThreadCount(builtItems.length);
                                                setThreadContentAt(builtItems.length - 1, normalized);
                                                insideString = false;
                                                currentItem = '';
                                            } else {
                                                currentItem += ch;
                                                const normalized = currentItem;
                                                ensureThreadCount(builtItems.length + 1);
                                                setThreadContentAt(builtItems.length, normalized);
                                            }
                                        }
                                    }
                                }
                            }

                            if (dataPart.type === 'finish' && !finalThreads) {
                                if (postType === 'single') {
                                    finalThreads = [singleBuffer.replace(/\\n/g, '\n').trim()];
                                } else {
                                    if (insideString && currentItem.trim().length > 0) {
                                        builtItems.push(currentItem);
                                        const normalized = currentItem.replace(/\\n/g, '\n');
                                        ensureThreadCount(builtItems.length);
                                        setThreadContentAt(builtItems.length - 1, normalized);
                                    }
                                    finalThreads = builtItems.length > 0 ? builtItems.map((s) => s.replace(/\\n/g, '\n')) : null;
                                }
                            }
                        }
                    }
                }

                if (finalThreads && finalThreads.length > 0) {
                    return finalizeThreads(finalThreads);
                }

                throw new Error('No threads received');
            }

            const data = await response.json();
            if (!Array.isArray(data?.threads)) {
                throw new Error('No threads received');
            }

            return finalizeThreads(data.threads);
        },
        [
            clearGenerationPreview,
            ensureThreadCount,
            isRightSidebarOpen,
            language,
            openRightSidebar,
            postType,
            setGenerationStatus,
            setOriginalAiContent,
            setPendingThreadChain,
            setThreadChain,
            setThreadContentAt,
            t,
            threadChain.length,
        ]
    );

    const submitChatMessage = useCallback(async (messageOverride?: string) => {
        const rawMessage = (typeof messageOverride === 'string' ? messageOverride : chatInput) ?? '';
        const trimmed = rawMessage.trim();
        if (trimmed.length === 0) return;

        if (!submittedContext) {
            if (!selectedHeadline.trim()) {
                toast.error('Provide a headline before starting the conversation.');
                return;
            }
            if (!selectedPersona || !selectedAudience || !selectedObjective) {
                toast.error('Select persona, audience, and objective first.');
                return;
            }
            if (!contextSummary.trim()) {
                toast.error('Please provide context before chatting.');
                return;
            }
        }

        let lockedContext = submittedContext;
        if (!lockedContext) {
            lockedContext = {
                headline: selectedHeadline,
                persona: selectedPersona,
                audience: selectedAudience,
                objective: selectedObjective,
                addOns: selectedAddOnsList,
            };
            setSubmittedContext(lockedContext);
        }

        const userMessage: UserMessage = {
            id: createId(),
            role: 'user',
            createdAt: Date.now(),
            content: trimmed,
        };

        const assistantId = createId();
        const initialThinkingSteps: ThinkingProcessStep[] = [
            { id: 'keywords', label: 'Mapping keyword intelligence', status: 'in_progress' },
            { id: 'search', label: 'Collecting high-signal conversations', status: 'pending' },
            { id: 'analysis', label: 'Evaluating engagement dynamics', status: 'pending' },
            { id: 'insights', label: 'Packaging actionable insights', status: 'pending' },
        ];
        const placeholderAssistant: AssistantMessage = {
            id: assistantId,
            role: 'assistant',
            createdAt: Date.now(),
            status: 'loading',
            blocks: [],
            thinkingProcess: initialThinkingSteps,
        };
        const stepAutoTimeouts: Array<ReturnType<typeof setTimeout>> = [];
        const clearStepTimeouts = () => {
            stepAutoTimeouts.forEach(clearTimeout);
            stepAutoTimeouts.length = 0;
        };
        const updateThinkingProcess = (mutator: (steps: ThinkingProcessStep[]) => ThinkingProcessStep[]) => {
            setConversation((prev) =>
                prev.map((entry) =>
                    entry.id === assistantId && entry.role === 'assistant'
                        ? {
                            ...entry,
                            thinkingProcess: mutator(entry.thinkingProcess ?? []),
                        }
                        : entry
                )
            );
        };
        const scheduleAutoThinkingProgress = () => {
            initialThinkingSteps.forEach((_, index) => {
                const timeout = setTimeout(() => {
                    updateThinkingProcess((steps) => {
                        if (!steps.length) return steps;
                        return steps.map((step, idx) => {
                            if (idx < index + 1) {
                                if (step.status !== 'complete') {
                                    return { ...step, status: 'complete' };
                                }
                                return step;
                            }
                            if (idx === index + 1 && step.status === 'pending') {
                                return { ...step, status: 'in_progress' };
                            }
                            return step;
                        });
                    });
                }, (index + 1) * 5000);
                stepAutoTimeouts.push(timeout);
            });
        };

        const historyPayload = [...conversation, userMessage].map((entry) => {
            if (entry.role === 'user') {
                return { role: 'user', content: entry.content };
            }
            const textFragments = entry.blocks.map((block) => {
                if (block.type === 'text') return block.content;
                if ('title' in block) return `${block.title} (${block.type})`;
                return `${block.type}`;
            });
            return { role: 'assistant', content: textFragments.join('\n\n') };
        });

        setConversation((prev) => [...prev, userMessage, placeholderAssistant]);
        if (typeof messageOverride !== 'string') {
            setChatInput('');
        }
        scheduleAutoThinkingProgress();
        setIsSubmittingMessage(true);
        setIsLoading(true);
        trackEvent('topic_finder_langgraph_submit', {
            persona: lockedContext?.persona?.id,
            audience: lockedContext?.audience?.id,
            objective: lockedContext?.objective?.id,
        });

        try {
            const structuredForRequest = mapSubmittedContextToStructured(lockedContext);
            const summaryForRequest = summarizeSubmittedContext(lockedContext) || contextSummary;
            const profileNarrative = profileSummaryText ? `Profile insights:\n${profileSummaryText}` : '';
            const audienceNarrative = audienceSummaryText ? `Audience deep dive:\n${audienceSummaryText}` : '';
            const dynamicContext = [
                summaryForRequest,
                profileNarrative,
                audienceNarrative,
                trimmed ? `Latest user message:\n${trimmed}` : '',
            ]
                .filter(Boolean)
                .join('\n\n');
            const resolvedTopic = trimmed || lockedContext.headline || DEFAULT_LANGGRAPH_TOPIC;
            const response = await fetch(`${LANGGRAPH_API_BASE}/research/enhanced`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: resolvedTopic }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message =
                    typeof payload?.error === 'string' && payload.error.trim().length > 0
                        ? payload.error
                        : 'Failed to run LangGraph workflow.';
                throw new Error(message);
            }

            const events: LanggraphEvent[] = Array.isArray(payload?.events) ? payload.events : [];
            let aggregated = aggregateLanggraphPayload(events);
            if (!aggregated && payload && typeof payload === 'object') {
                aggregated = payload as Record<string, unknown>;
            }
            const blocks = aggregated
                ? buildAssistantBlocks(aggregated)
                : [
                    {
                        id: createId(),
                        type: 'text' as const,
                        content:
                            events.length > 0
                                ? events
                                    .map((event) => `${event.event.toUpperCase()}\n${JSON.stringify(event.data, null, 2)}`)
                                    .join('\n\n')
                                : 'No structured result returned.',
                    },
                ];
            const hasAudienceWidget = blocks.some((block) => block.type === 'widget' && block.widgetType === 'audience');
            const hasReferenceBlocks = blocks.some((block) => block.type === 'threads' || block.type === 'x');
            const hasRecommendationWidget = blocks.some((block) => block.type === 'widget' && block.widgetType === 'topics');

            updateThinkingProcess((steps) =>
                steps.map((step) => {
                    if (step.id === 'audience') {
                        return { ...step, status: 'complete' };
                    }
                    if (step.id === 'references') {
                        return { ...step, status: 'in_progress' };
                    }
                    if (step.id === 'recommendations') {
                        return { ...step, status: 'in_progress' };
                    }
                    return step;
                })
            );

            setConversation((prev) =>
                prev.map((entry) =>
                    entry.id === assistantId
                        ? {
                            ...entry,
                            status: 'complete',
                            blocks,
                            raw: aggregated ?? events,
                        }
                        : entry
                )
            );
            clearStepTimeouts();

            updateThinkingProcess((steps) =>
                steps.map((step) => {
                    if (step.id === 'references' || step.id === 'recommendations') {
                        return { ...step, status: 'complete' };
                    }
                    return step;
                })
            );
        } catch (error) {
            clearStepTimeouts();
            const message = error instanceof Error ? error.message : 'Failed to run LangGraph workflow.';
            updateThinkingProcess((steps) =>
                steps.map((step) => {
                    if (step.id === 'recommendations') {
                        return { ...step, status: 'error' };
                    }
                    if (step.id === 'references') {
                        return { ...step, status: 'complete' };
                    }
                    if (step.id === 'audience') {
                        return { ...step, status: 'complete' };
                    }
                    return step;
                })
            );
            setConversation((prev) =>
                prev.map((entry) =>
                    entry.id === assistantId
                        ? {
                            ...entry,
                            status: 'error',
                            error: message,
                            blocks: [
                                {
                                    id: createId(),
                                    type: 'text',
                                    content: message,
                                },
                            ],
                        }
                        : entry
                )
            );
            toast.error(message);
        } finally {
            clearStepTimeouts();
            setIsSubmittingMessage(false);
            setIsLoading(false);
        }
    }, [
        chatInput,
        submittedContext,
        selectedHeadline,
        selectedPersona,
        selectedAudience,
        selectedObjective,
        selectedAddOnsList,
        conversation,
        contextSummary,
        language,
        profileAnalytics,
        profileSummaryText,
        requestAudienceAnalysis,
        audienceSummaryText,
    ]);

    const handleInitialSend = useCallback(async () => {
        if (!isPreChatReady) {
            toast.error('Select persona, audience, objective, and provide a headline before starting.');
            return;
        }

        const initialMessage = selectedHeadline.trim();
        if (!initialMessage) {
            toast.error('Provide a headline before starting the conversation.');
            return;
        }

        await submitChatMessage(initialMessage);
    }, [isPreChatReady, selectedHeadline, submitChatMessage]);

    const handleRepurposeContent = useCallback(
        async (item: NormalizedSocialContent, platform: 'threads' | 'x') => {
            const text = item.text?.trim();
            if (!text) {
                toast.error('Unable to repurpose empty content.');
                return;
            }
            if (!selectedPersona || !selectedAudience || !selectedObjective) {
                toast.error('Select persona, audience, and objective first.');
                return;
            }
            const contextInfo = contextSummary.trim();
            if (!contextInfo) {
                toast.error('Please provide context before repurposing.');
                return;
            }

            try {
                const repurposeInstruction = [
                    'Repurpose the provided source content into a fresh and original piece aligned with the current persona, audience, objective, and add-ons.',
                    'Preserve the key idea while introducing a novel hook or perspective that fits the configured settings.',
                    'Use the verbatim source transcript when grounding claims, then rewrite to feel tailored for the configured persona and audience.',
                    `Source (${platform.toUpperCase()}):`,
                    item.rawBody?.trim() && item.rawBody.trim().length > 0
                        ? item.rawBody.trim()
                        : text,
                ]
                    .filter(Boolean)
                    .join('\n\n');

                const repurposedTopic =
                    selectedHeadline?.trim() && selectedHeadline.trim().length > 0
                        ? `${selectedHeadline.trim()} (repurposed)`
                        : `Repurposed ${platform.toUpperCase()} insight`;

                const threads = await executeGenerationRequest({
                    topic: repurposedTopic,
                    accountInfo: contextInfo,
                    instruction: repurposeInstruction,
                    context: {
                        ...structuredContext,
                        sourceReference: {
                            id: item.id,
                            link: item.link,
                            platform,
                            excerpt: text,
                            body: item.rawBody?.trim() && item.rawBody.trim().length > 0 ? item.rawBody.trim() : text,
                        },
                    },
                    statusLabel: `Repurposing from ${platform.toUpperCase()}...`,
                    mode: 'repurpose',
                });

                toast.success(t('threadsGenerated', { count: threads.length }));

                trackEvent('topic_finder_repurpose', {
                    platform,
                    sourceId: item.id,
                    threadCount: threads.length,
                    postType,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to repurpose content';
                toast.error(message);
                setGenerationStatus(null);
                clearGenerationPreview();
            }
        },
        [
            contextSummary,
            executeGenerationRequest,
            postType,
            selectedAudience,
            selectedHeadline,
            selectedObjective,
            selectedPersona,
            structuredContext,
            clearGenerationPreview,
            setGenerationStatus,
            t,
        ]
    );
    const handleUseRecommendedTopic = useCallback(
        (topic: RecommendedTopic) => {
            setSelectedHeadline(topic.title);
            toast.success('Topic loaded into the headline field.');
        },
        [setSelectedHeadline]
    );

    useEffect(() => {
        // 필요시 topicResults 변경 추적
    }, [topicResults]);

    // Web3 모드에서 Farcaster 계정 연결 체크
    const needsAccountConnection = useMemo(() => {
        if (!featureFlags.showOnlyFarcasterAuth()) {
            // 일반 모드에서는 기존 로직 사용 (threads 계정 체크)
            return !currentSocialId;
        }

        // Web3 모드에서는 Farcaster 계정 체크
        const supportedPlatforms = getSupportedPlatforms();
        const farcasterAccount = accounts.find(account =>
            account.platform === 'farcaster' && supportedPlatforms.includes('farcaster')
        );
        return !farcasterAccount;
    }, [currentSocialId, accounts]);

    // 계정 연결이 필요한 경우 연결 화면 표시
    if (needsAccountConnection) {
        return <SocialConnectRequired />;
    }

    return (
        <div className="flex h-screen flex-col bg-gradient-to-b from-background via-background to-muted/40">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full items-center max-w-6xl flex-col gap-12 px-4 pb-32 pt-24 md:pt-28">
                    {!isChatActive ? (
                        <TopicFinderPreChat
                            mounted={mounted}
                            currentSocialId={currentSocialId}
                            currentUsername={currentUsername}
                            t={t as any}
                            personas={personas}
                            audiences={audiences}
                            objectives={objectives}
                            addOns={addOns}
                            selectedPersonaId={selectedPersonaId}
                            selectedAudienceId={selectedAudienceId}
                            selectedObjectiveId={selectedObjectiveId}
                            selectedAddOnIds={selectedAddOnIds}
                            isPreferenceLoading={isPreferenceLoading}
                            userId={userId}
                            onPersonaSelect={handlePersonaSelect}
                            onAudienceSelect={handleAudienceSelect}
                            onObjectiveSelect={handleObjectiveSelect}
                            onAddOnToggle={handleToggleAddOn}
                            onOpenCreateModal={openCreateModal}
                            onOpenEditModal={openEditModal}
                            headline={selectedHeadline}
                            onHeadlineChange={setSelectedHeadline}
                            postType={postType}
                            onPostTypeChange={setPostType}
                            language={language}
                            onLanguageChange={(value) => setLanguage(value as any)}
                            onInitialSend={handleInitialSend}
                            isPreChatReady={isPreChatReady}
                            isSubmittingMessage={isSubmittingMessage}
                            onGenerateTopics={generateTopics}
                            topicResults={topicResults}
                            onTopicChange={handleTopicChange}
                            onInstructionChange={handleInstructionChange}
                            isGeneratingTopics={isGeneratingTopics}
                            selectedHeadline={selectedHeadline}
                            onSelectHeadline={setSelectedHeadline}
                            onRemoveTopics={removeTopicResult}
                        />
                    ) : (
                        <TopicFinderChatView
                            conversation={conversation}
                            contextBadges={contextBadges}
                            displayedHeadline={displayedHeadline}
                            isChatActive={isChatActive}
                            hasSubmittedContext={submittedContext !== null}
                            profileAnalytics={profileAnalytics}
                            currentSocialId={currentSocialId}
                            onRepurposeContent={handleRepurposeContent}
                            onUseTopic={handleUseRecommendedTopic}
                        />
                    )}
                </div>
            </div>
            {isChatActive && (
                <ChatInputBar
                    value={chatInput}
                    onChange={(value) => setChatInput(value)}
                    onSubmit={() => {
                        void submitChatMessage();
                    }}
                    disabled={isSubmittingMessage}
                    placeholder="Ask anything…"
                />
            )}
            <CreatePreferenceModal
                open={modalState.open}
                title={modalConfig.title}
                onOpenChange={open => {
                    if (!open) {
                        closeCreateModal();
                    }
                }}
                onSave={handleSavePreferenceItem}
                loading={modalSaving}
                includePublicToggle={modalConfig.includePublicToggle}
                namePlaceholder={modalConfig.namePlaceholder}
                descriptionPlaceholder={modalConfig.descriptionPlaceholder}
                initialValues={modalState.item ? {
                    name: modalState.item.name,
                    description: modalState.item.description || '',
                    isPublic: 'is_public' in modalState.item ? (modalState.item as AddOnOption).is_public ?? false : false,
                } : undefined}
                mode={modalState.mode}
                onDelete={modalState.mode === 'edit' ? handleDeletePreferenceItem : undefined}
            />
        </div>
    );
}
