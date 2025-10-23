'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import type { EngagementOverviewData } from '@/components/topic-finder/types';

interface EngagementOverviewCardProps {
    data: EngagementOverviewData | null;
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const EngagementOverviewCard = ({ data }: EngagementOverviewCardProps) => {
    if (!data) return null;

    const totalAnalyzed = data.totalContentAnalyzed;
    const averageQuality = data.averageQualityScore;

    const sortedPlatforms = [...data.platformPerformance].sort((a, b) => {
        const aScore = a.averageQuality ?? 0;
        const bScore = b.averageQuality ?? 0;
        return bScore - aScore;
    });

    const sentimentTotals = data.sentimentDistribution;
    const sentimentSum = sentimentTotals.positive + sentimentTotals.neutral + sentimentTotals.negative || 1;

    const sentimentEntries = [
        { label: 'Positive', value: sentimentTotals.positive, tone: 'text-emerald-600', bar: 'bg-emerald-400' },
        { label: 'Neutral', value: sentimentTotals.neutral, tone: 'text-muted-foreground', bar: 'bg-muted-foreground/60' },
        { label: 'Negative', value: sentimentTotals.negative, tone: 'text-rose-600', bar: 'bg-rose-500/80' },
    ].map((entry) => ({
        ...entry,
        percent: Math.round((entry.value / sentimentSum) * 100),
    }));

    const strategyHighlights: string[] = [];
    if (data.keywordStrategy) {
        const rawPhase = data.keywordStrategy.phase;
        if (typeof rawPhase === 'string' && rawPhase.trim()) {
            strategyHighlights.push(`Phase · ${rawPhase.replace(/_/g, ' ')}`);
        }
        const rawConfidence = data.keywordStrategy.confidence;
        if (typeof rawConfidence === 'number' && Number.isFinite(rawConfidence)) {
            strategyHighlights.push(`Confidence · ${formatPercent(rawConfidence)}`);
        }
        const rawSelected = data.keywordStrategy.selected_count;
        if (typeof rawSelected === 'number' && Number.isFinite(rawSelected)) {
            strategyHighlights.push(`Selected keywords · ${rawSelected}`);
        }
    }

    return (
        <Card className="w-full border border-border/60 bg-white/70 shadow-sm backdrop-blur">
            <motion.div
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
            >
                <header className="flex flex-col gap-2">
                    <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                        Engagement Overview
                    </span>
                    <h3 className="text-xl font-semibold text-foreground">
                        Content quality signals across platforms
                    </h3>
                </header>

                <section className="grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground/90 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                            Total content analysed
                        </span>
                        <span className="text-lg font-semibold text-foreground">{totalAnalyzed}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
                            Average quality score
                        </span>
                        <span className="text-lg font-semibold text-foreground">
                            {formatPercent(averageQuality)}
                        </span>
                    </div>
                </section>

                {sortedPlatforms.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Platform performance
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2">
                            {sortedPlatforms.map((platform) => (
                                <div
                                    key={platform.platform}
                                    className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/70 p-4 text-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-foreground">
                                            {platform.platform.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-muted-foreground/70">
                                            {platform.contentCount ?? 0} posts
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground/80">
                                        <span>Avg quality · {formatPercent(platform.averageQuality ?? 0)}</span>
                                        <span>Top score · {formatPercent(platform.topQualityScore ?? 0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Sentiment mix
                    </h4>
                    <div className="space-y-3">
                        {sentimentEntries.map((entry) => (
                            <div key={entry.label} className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground/80">
                                    <span className={entry.tone}>{entry.label}</span>
                                    <span>{entry.percent}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/80">
                                    <div
                                        className={`h-full rounded-full ${entry.bar}`}
                                        style={{ width: `${entry.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {strategyHighlights.length > 0 && (
                    <section className="flex flex-wrap gap-2">
                        {strategyHighlights.map((item) => (
                            <span
                                key={item}
                                className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground/90"
                            >
                                {item}
                            </span>
                        ))}
                    </section>
                )}
            </motion.div>
        </Card>
    );
};
