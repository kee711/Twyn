'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { MetricTrend, ProfileAnalytics } from '@/lib/topic-finder/analytics';
import { cn } from '@/lib/utils';

interface ProfileAnalyzerCardProps {
    analytics: ProfileAnalytics;
}

const getTrendIcon = (direction: MetricTrend['direction']) => {
    switch (direction) {
        case 'up':
            return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
        case 'down':
            return <ArrowDownRight className="h-4 w-4 text-rose-500" />;
        default:
            return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
};

const formatNumberCompact = (value: number) =>
    Intl.NumberFormat('en', { notation: 'compact' }).format(value);

const formatDeltaText = (trend: MetricTrend) => {
    if (trend.percent !== null) {
        return `${trend.percent > 0 ? '+' : ''}${trend.percent}%`;
    }
    if (trend.delta !== 0) {
        return `${trend.delta > 0 ? '+' : ''}${trend.delta}`;
    }
    return '0';
};

const buildPoints = (series: Array<{ value: number }>, width: number, height: number) => {
    if (series.length === 0) return '';
    const values = series.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return series
        .map((point, index) => {
            const x = (index / Math.max(series.length - 1, 1)) * width;
            const y = height - ((point.value - min) / range) * height;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
};

export const ProfileAnalyzerCard = ({ analytics }: ProfileAnalyzerCardProps) => {
    const chartWidth = 220;
    const chartHeight = 96;
    const followerPoints = buildPoints(analytics.followerSeries, chartWidth, chartHeight);
    const viewPoints = buildPoints(analytics.viewSeries ?? [], chartWidth, chartHeight);
    const viewTrend = analytics.metrics.find((metric) => metric.key === 'views') ?? null;

    return (
        <Card className="w-full overflow-hidden border border-border/70 bg-white/60 shadow-sm backdrop-blur-sm">
            <motion.div
                className="flex flex-col gap-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
            >
                <header className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Profile Analyzer
                    </span>
                    <h2 className="text-xl font-semibold text-foreground">
                        {analytics.followerTrend.current.toLocaleString()} followers
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {analytics.summary}
                    </p>
                </header>

                <section className="grid gap-4 rounded-2xl bg-muted/30 p-4 md:grid-cols-2">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                7-day follower trend
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                {getTrendIcon(analytics.followerTrend.direction)}
                                <span
                                    className={cn(
                                        'text-sm font-semibold',
                                        analytics.followerTrend.direction === 'up' && 'text-emerald-600',
                                        analytics.followerTrend.direction === 'down' && 'text-rose-500',
                                    )}
                                >
                                    {formatDeltaText(analytics.followerTrend)}
                                </span>
                            </div>
                        </div>
                        <svg
                            width={chartWidth}
                            height={chartHeight}
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            className="w-full"
                        >
                            <defs>
                                <linearGradient id="followerGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(30,64,175,0.15)" />
                                    <stop offset="100%" stopColor="rgba(30,64,175,0)" />
                                </linearGradient>
                            </defs>
                            <polyline
                                fill="none"
                                stroke="rgba(30,64,175,0.35)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                points={followerPoints}
                            />
                            <polygon
                                fill="url(#followerGradient)"
                                points={`${followerPoints} ${chartWidth},${chartHeight} 0,${chartHeight}`}
                            />
                        </svg>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                7-day views trend
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                {viewTrend ? getTrendIcon(viewTrend.direction) : <Minus className="h-4 w-4 text-muted-foreground" />}
                                <span
                                    className={cn(
                                        'text-sm font-semibold',
                                        viewTrend?.direction === 'up' && 'text-emerald-600',
                                        viewTrend?.direction === 'down' && 'text-rose-500',
                                    )}
                                >
                                    {viewTrend ? formatDeltaText(viewTrend) : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <svg
                            width={chartWidth}
                            height={chartHeight}
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            className="w-full"
                        >
                            <defs>
                                <linearGradient id="viewsGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(16,185,129,0.2)" />
                                    <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                                </linearGradient>
                            </defs>
                            <polyline
                                fill="none"
                                stroke="rgba(16,185,129,0.45)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                points={viewPoints}
                            />
                            <polygon
                                fill="url(#viewsGradient)"
                                points={`${viewPoints} ${chartWidth},${chartHeight} 0,${chartHeight}`}
                            />
                        </svg>
                    </div>
                </section>

                <section className="grid gap-3 md:grid-cols-3">
                    {analytics.metrics.slice(0, 3).map((metric) => (
                        <div
                            key={metric.key}
                            className="rounded-xl border border-border/60 bg-background/70 p-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</span>
                                {getTrendIcon(metric.direction)}
                            </div>
                            <div className="mt-2 text-lg font-semibold text-foreground">
                                {formatNumberCompact(metric.current)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {metric.delta === 0
                                    ? 'No change vs previous period'
                                    : `${formatDeltaText(metric)} vs previous`}
                            </div>
                        </div>
                    ))}
                </section>
            </motion.div>
        </Card>
    );
};
