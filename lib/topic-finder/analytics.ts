import { InsightsData } from '@/lib/queries/statisticsQueries';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface MetricTrend {
    key: string;
    label: string;
    current: number;
    previous: number | null;
    delta: number;
    percent: number | null;
    direction: TrendDirection;
}

export interface ProfileAnalytics {
    followerSeries: Array<{ date: string; value: number }>;
    viewSeries: Array<{ date: string; value: number }>;
    followerTrend: MetricTrend;
    metrics: MetricTrend[];
    topMetric: MetricTrend | null;
    summary: string;
    rawInsights: InsightsData[];
}

type SeriesPoint = { date: string; value: number };

const metricLabels: Record<string, string> = {
    followers_count: 'Followers',
    likes: 'Likes',
    replies: 'Replies',
    reposts: 'Reposts',
    quotes: 'Quotes',
    shares: 'Shares',
    views: 'Views',
};

const formatNumber = (value: number): number => Number.isFinite(value) ? Number(value) : 0;

const formatPercent = (value: number | null): number | null => {
    if (value === null || !Number.isFinite(value)) return null;
    return Math.round(value * 10) / 10;
};

const getSeries = (insights: InsightsData[], metric: string): SeriesPoint[] => {
    const entry = insights.find((item) => item.name === metric);
    if (!entry) return [];

    if (Array.isArray(entry.values) && entry.values.length > 0) {
        return entry.values
            .map((point, index) => ({
                date: point.end_time || `Point ${index + 1}`,
                value: formatNumber(point.value),
            }))
            .filter((point) => Number.isFinite(point.value));
    }

    if (entry.total_value?.value !== undefined) {
        return [{ date: 'Total', value: formatNumber(entry.total_value.value) }];
    }

    return [];
};

const getLatestValue = (series: SeriesPoint[]): number | null => {
    if (!series.length) return null;
    return formatNumber(series[series.length - 1].value);
};

const getPreviousValue = (
    currentSeries: SeriesPoint[],
    previousSeries: SeriesPoint[],
): number | null => {
    if (previousSeries.length > 0) {
        return formatNumber(previousSeries[previousSeries.length - 1].value);
    }
    if (currentSeries.length > 1) {
        return formatNumber(currentSeries[currentSeries.length - 2].value);
    }
    return null;
};

const buildTrend = (
    key: string,
    label: string,
    currentSeries: SeriesPoint[],
    previousSeries: SeriesPoint[],
): MetricTrend => {
    const current = getLatestValue(currentSeries) ?? 0;
    const previous = getPreviousValue(currentSeries, previousSeries);
    const delta = previous !== null ? current - previous : 0;
    const percent = previous !== null && previous !== 0 ? (delta / previous) * 100 : null;
    const direction: TrendDirection = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    return {
        key,
        label,
        current,
        previous,
        delta,
        percent: formatPercent(percent),
        direction,
    };
};

const summariseMetric = (trend: MetricTrend): string => {
    const change =
        trend.percent !== null
            ? `${trend.percent > 0 ? '+' : ''}${trend.percent}%`
            : trend.delta !== 0
                ? `${trend.delta > 0 ? '+' : ''}${trend.delta}`
                : 'no change';
    return `${trend.label}: ${trend.current}${trend.percent === null && trend.delta === 0 ? '' : ` (${change})`}`;
};

export const computeProfileAnalytics = (
    currentInsights: InsightsData[] | undefined,
    previousInsights: InsightsData[] | undefined = [],
): ProfileAnalytics | null => {
    if (!currentInsights || currentInsights.length === 0) {
        return null;
    }

    const followerSeries = getSeries(currentInsights, 'followers_count');
    if (followerSeries.length === 0) {
        return null;
    }

    const followerTrend = buildTrend(
        'followers_count',
        metricLabels.followers_count,
        followerSeries,
        getSeries(previousInsights, 'followers_count'),
    );
    const viewSeries = getSeries(currentInsights, 'views');

    const trackedMetrics = ['likes', 'replies', 'reposts', 'quotes', 'views'];
    const metricTrends: MetricTrend[] = trackedMetrics
        .map((metric) => {
            const currentSeries = getSeries(currentInsights, metric);
            if (!currentSeries.length) return null;
            return buildTrend(metric, metricLabels[metric] ?? metric, currentSeries, getSeries(previousInsights, metric));
        })
        .filter((entry): entry is MetricTrend => entry !== null);

    const topMetric =
        metricTrends
            .filter((trend) => trend.delta !== 0)
            .sort((a, b) => (b.delta || 0) - (a.delta || 0))[0] ?? null;

    const summarySegments = [
        summariseMetric(followerTrend),
        ...metricTrends.slice(0, 3).map(summariseMetric),
    ];

    return {
        followerSeries,
        viewSeries,
        followerTrend,
        metrics: metricTrends,
        topMetric,
        summary: summarySegments.join(' | '),
        rawInsights: currentInsights,
    };
};

export const buildProfileSummaryText = (analytics: ProfileAnalytics | null): string => {
    if (!analytics) return '';
    const segments = [
        `Followers: ${analytics.followerTrend.current}${analytics.followerTrend.delta !== 0 ? ` (${analytics.followerTrend.delta > 0 ? '+' : ''}${analytics.followerTrend.delta})` : ''}`,
    ];

    analytics.metrics.slice(0, 3).forEach((metric) => {
        segments.push(
            `${metric.label}: ${metric.current}${metric.delta !== 0 ? ` (${metric.delta > 0 ? '+' : ''}${metric.delta})` : ''}`,
        );
    });

    return segments.join(', ');
};
