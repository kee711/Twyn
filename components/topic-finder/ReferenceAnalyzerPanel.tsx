'use client';

import { ReactNode, useEffect, useState } from 'react';

import type { AudienceAnalysis } from '@/lib/topic-finder/audience';

import type { NormalizedSocialContent, ReferenceAnalysis, ViralMetrics } from './types';

interface ReferenceAnalyzerPanelProps {
    platform: 'threads' | 'x';
    items: NormalizedSocialContent[];
    ownerUserId: string | null;
    audienceAnalysis?: AudienceAnalysis | null;
    referenceData?: Record<string, { url?: string; title?: string; snippet?: string }>;
    initialAnalysis?: Record<string, ReferenceAnalysis>;
    children: (analysis: Record<string, ReferenceAnalysis>, loading: boolean) => ReactNode;
}

const metricWeights: Record<keyof ViralMetrics, number> = {
    shares: 0.4,
    replies: 0.3,
    likes: 0.2,
    reposts: 0.2,
    views: 0.1,
};

const computeScore = (metrics: ViralMetrics): number => {
    const raw =
        (metrics.shares ?? 0) * metricWeights.shares +
        (metrics.replies ?? 0) * metricWeights.replies +
        (metrics.likes ?? 0) * metricWeights.likes +
        (metrics.reposts ?? 0) * metricWeights.reposts +
        (metrics.views ?? 0) * metricWeights.views;

    const score = Math.log10(1 + raw) * 9;
    return Number(Math.max(1, Math.min(10, score)).toFixed(1));
};

const normaliseFromContent = (item: NormalizedSocialContent): ViralMetrics => ({
    likes: item.metrics?.likes,
    replies: item.metrics?.replies,
    reposts: item.metrics?.reposts,
});

const extractMetricsFromResponse = (data: any): ViralMetrics => {
    if (!data?.data) return {};
    const metrics: ViralMetrics = {};
    for (const entry of data.data) {
        const name = entry?.name;
        const total = entry?.total_value?.value ?? entry?.values?.[0]?.value;
        if (typeof total !== 'number') continue;
        switch (name) {
            case 'views':
                metrics.views = total;
                break;
            case 'likes':
                metrics.likes = total;
                break;
            case 'replies':
                metrics.replies = total;
                break;
            case 'reposts':
                metrics.reposts = total;
                break;
            case 'shares':
            case 'quotes':
                metrics.shares = total;
                break;
            default:
                break;
        }
    }
    return metrics;
};

const buildAudienceComment = (score: number, analysis?: AudienceAnalysis | null): string => {
    const personaName = analysis?.personaName ?? 'your audience';
    const motivation = analysis?.motivations?.[0] ?? analysis?.dos?.[0] ?? 'core motivations';
    const caution = analysis?.donts?.[0] ?? 'generic messaging';

    if (score >= 7.5) {
        return `Strong fit for ${personaName}. Amplify ${motivation.toLowerCase()}.`;
    }
    if (score >= 6) {
        return `Moderate resonance with ${personaName}. Reinforce ${motivation.toLowerCase()}.`;
    }
    return `Needs refinement for ${personaName}. Avoid ${caution.toLowerCase()}.`;
};

const normalizeUrl = (value?: string | null) =>
    value ? value.replace(/\/$/, '').toLowerCase() : undefined;

export const ReferenceAnalyzerPanel = ({
    platform,
    items,
    ownerUserId,
    audienceAnalysis,
    referenceData,
    initialAnalysis,
    children,
}: ReferenceAnalyzerPanelProps) => {
    const [analysisMap, setAnalysisMap] = useState<Record<string, ReferenceAnalysis>>(initialAnalysis ?? {});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setAnalysisMap(initialAnalysis ?? {});
    }, [initialAnalysis]);

    useEffect(() => {
        let cancelled = false;

        if (!items.length) {
            setAnalysisMap(initialAnalysis ?? {});
            setLoading(false);
            return;
        }

        const itemsNeedingFetch = items.filter((item) => !(initialAnalysis && initialAnalysis[item.id]));
        if (itemsNeedingFetch.length === 0) {
            setAnalysisMap(initialAnalysis ?? {});
            setLoading(false);
            return;
        }

        const run = async () => {
            setLoading(true);
            const next: Record<string, ReferenceAnalysis> = { ...(initialAnalysis ?? {}) };
            const referenceEntries = referenceData
                ? Object.values(referenceData).map((ref) => ({
                    ...ref,
                    normalized: normalizeUrl(ref.url),
                }))
                : [];

            for (const item of items) {
                if (initialAnalysis && initialAnalysis[item.id]) {
                    next[item.id] = initialAnalysis[item.id];
                    continue;
                }

                const baseMetrics = normaliseFromContent(item);
                let mergedMetrics: ViralMetrics = { ...baseMetrics };
                let fetched = false;

                if (platform === 'threads' && ownerUserId && item.id) {
                    try {
                        const response = await fetch(
                            `/api/insights?type=media&media_id=${encodeURIComponent(item.id)}&owner_user_id=${encodeURIComponent(ownerUserId)}&metric=views,likes,replies,reposts,shares`,
                        );
                        if (response.ok) {
                            const data = await response.json();
                            const remoteMetrics = extractMetricsFromResponse(data);
                            mergedMetrics = { ...mergedMetrics, ...remoteMetrics };
                            fetched = true;
                        }
                    } catch (error) {
                        console.warn('Failed to fetch media insights', error);
                    }
                }

                const score = computeScore(mergedMetrics);
                const itemUrl = normalizeUrl(item.link);
                const matchedReference = referenceEntries.find(
                    (entry) => entry.normalized && entry.normalized === itemUrl,
                );

                next[item.id] = {
                    id: item.id,
                    title: matchedReference?.title || item.authorName || item.handle || item.text.slice(0, 40),
                    url: item.link || matchedReference?.url,
                    score,
                    metrics: mergedMetrics,
                    source: fetched ? 'synced' : 'estimated',
                    audienceComment: buildAudienceComment(score, audienceAnalysis),
                    snippet: matchedReference?.snippet,
                };
            }

            if (!cancelled) {
                setAnalysisMap(next);
                setLoading(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [items, ownerUserId, platform, audienceAnalysis, referenceData, initialAnalysis]);

    if (!items.length) {
        return <>{children({}, false)}</>;
    }

    return <>{children(analysisMap, loading)}</>;
};
