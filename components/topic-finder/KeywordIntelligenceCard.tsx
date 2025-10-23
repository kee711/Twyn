'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { KeywordIntelligenceData } from '@/components/topic-finder/types';

interface KeywordIntelligenceCardProps {
    data: KeywordIntelligenceData | null;
}

const formatNumber = (value?: number) => {
    if (value === undefined || Number.isNaN(value)) return '—';
    return Math.round(value).toLocaleString();
};

const formatScore = (value?: number, options?: { asPercent?: boolean; fractionDigits?: number }) => {
    if (value === undefined || Number.isNaN(value)) return '—';
    if (options?.asPercent) {
        return `${Math.round(value * 100)}%`;
    }
    const digits = options?.fractionDigits ?? 2;
    return value.toFixed(digits);
};

const formatCompetition = (value?: string) => {
    if (!value) return 'Unknown';
    const lower = value.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const KeywordIntelligenceCard = ({ data }: KeywordIntelligenceCardProps) => {
    if (!data) return null;

    const mainKeyword = data.mainKeyword;
    const subKeywords = data.selectedSubKeywords.slice(0, 3);
    const breakdown = data.keywordBreakdown.slice(0, 8);
    const queryEntries = Object.entries(data.searchQueries ?? {}).filter(([, value]) => value.trim().length > 0);

    const hasContent =
        mainKeyword !== null || subKeywords.length > 0 || breakdown.length > 0 || queryEntries.length > 0;

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
                        Keyword Intelligence
                    </span>
                    <h3 className="text-xl font-semibold text-foreground">
                        Search dynamics and viable angles
                    </h3>
                </header>

                {mainKeyword && (
                    <section className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                                Primary keyword
                            </span>
                            <p className="text-lg font-semibold text-foreground">{mainKeyword.keyword}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-border/70 bg-background/80 text-xs">
                                Volume · {formatNumber(mainKeyword.searchVolume)}
                            </Badge>
                            <Badge variant="outline" className="border-border/70 bg-background/80 text-xs">
                                Trend · {formatNumber(mainKeyword.trendScore)}
                            </Badge>
                            <Badge variant="outline" className="border-border/70 bg-background/80 text-xs">
                                Relevance · {formatScore(mainKeyword.relevanceScore, { fractionDigits: 2 })}
                            </Badge>
                            <Badge variant="outline" className="border-border/70 bg-background/80 text-xs">
                                Competition · {formatCompetition(mainKeyword.competitionLevel)}
                            </Badge>
                        </div>
                    </section>
                )}

                {subKeywords.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Priority sub-keywords
                            </h4>
                            <span className="text-xs text-muted-foreground/80">Top {subKeywords.length}</span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {subKeywords.map((item) => (
                                <div
                                    key={item.keyword}
                                    className="flex h-full flex-col gap-2 rounded-xl border border-border/60 bg-background/60 p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-foreground">{item.keyword}</span>
                                            {item.selectionReason && (
                                                <p className="text-xs text-muted-foreground/80">{item.selectionReason}</p>
                                            )}
                                        </div>
                                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                                            Score · {formatScore(item.finalScore, { fractionDigits: 2 })}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground/80">
                                        <span>
                                            Engagement · {formatScore(item.engagementPotential, { asPercent: true })}
                                        </span>
                                        <span>
                                            Trend · {formatScore(item.trendMomentum, { asPercent: true })}
                                        </span>
                                        <span>
                                            Coherence · {formatScore(item.topicCoherenceScore, { asPercent: true })}
                                        </span>
                                        <span>
                                            Advantage · {formatScore(item.competitionAdvantage, { asPercent: true })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {queryEntries.length > 0 && (
                    <section className="flex flex-col gap-2">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Search queries deployed
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2">
                            {queryEntries.map(([platform, query]) => (
                                <div
                                    key={platform}
                                    className="rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-foreground/90"
                                >
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                        {platform}
                                    </span>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-snug">{query}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {breakdown.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Supporting keyword graph
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {breakdown.map((item) => (
                                <Badge
                                    key={`${item.keyword}-${item.type ?? 'generic'}`}
                                    variant="outline"
                                    className="border-border/60 bg-background/60 text-xs"
                                >
                                    {item.keyword}
                                    {item.type && <span className="ml-1 text-muted-foreground/70">({item.type})</span>}
                                </Badge>
                            ))}
                        </div>
                    </section>
                )}
            </motion.div>
        </Card>
    );
};
