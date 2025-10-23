'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import type { ContentOpportunitiesData } from '@/components/topic-finder/types';

interface ContentOpportunitiesCardProps {
    data: ContentOpportunitiesData | null;
}

const formatPercent = (value?: number) => {
    if (value === undefined || Number.isNaN(value)) return '—';
    return `${Math.round(value * 100)}%`;
};

const capitalize = (value?: string) => {
    if (!value) return '';
    const lower = value.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const ContentOpportunitiesCard = ({ data }: ContentOpportunitiesCardProps) => {
    if (!data) return null;

    const { actionableInsights, recommendations, competitiveAnalysis } = data;
    const hasContent =
        actionableInsights.length > 0 || recommendations.length > 0 || competitiveAnalysis !== null;
    if (!hasContent) return null;

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
                        Content Opportunities
                    </span>
                    <h3 className="text-xl font-semibold text-foreground">
                        Immediate actions to outperform the feed
                    </h3>
                </header>

                {actionableInsights.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Actionable insights
                        </h4>
                        <ul className="grid gap-2 text-sm text-muted-foreground/90 md:grid-cols-2">
                            {actionableInsights.map((insight) => (
                                <li
                                    key={insight}
                                    className="rounded-xl border border-border/60 bg-background/70 p-3 leading-snug"
                                >
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {recommendations.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Recommended plays
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2">
                            {recommendations.map((item) => (
                                <div
                                    key={item.keyword}
                                    className="flex h-full flex-col gap-2 rounded-xl border border-border/60 bg-background/60 p-4 text-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-foreground">{item.keyword}</span>
                                        {item.priority && (
                                            <span className="text-xs uppercase tracking-[0.2em] text-primary">
                                                {item.priority}
                                            </span>
                                        )}
                                    </div>
                                    {item.recommendedContentType && (
                                        <p className="text-xs text-muted-foreground/80">
                                            {item.recommendedContentType}
                                        </p>
                                    )}
                                    <div className="text-xs text-muted-foreground/70">
                                        Expected engagement · {formatPercent(item.expectedEngagement)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {competitiveAnalysis && (
                    <section className="flex flex-col gap-4 rounded-2xl border border-dashed border-border/60 bg-background/50 p-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Competitive edge
                            </h4>
                            {competitiveAnalysis.marketSaturation && (
                                <span className="rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground/90">
                                    Market saturation · {capitalize(competitiveAnalysis.marketSaturation)}
                                </span>
                            )}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2 text-sm">
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Content gap opportunities
                                </span>
                                <ul className="list-disc space-y-1 pl-4 text-muted-foreground/90">
                                    {competitiveAnalysis.contentGapOpportunities.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex flex-col gap-2 text-sm">
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Differentiation plays
                                </span>
                                <ul className="list-disc space-y-1 pl-4 text-muted-foreground/90">
                                    {competitiveAnalysis.differentiationStrategies.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>
                )}
            </motion.div>
        </Card>
    );
};
