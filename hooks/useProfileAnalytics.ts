import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { statisticsKeys } from '@/lib/queries/statisticsKeys';
import { fetchUserInsights, fetchPreviousPeriodInsights, InsightsData } from '@/lib/queries/statisticsQueries';
import { computeProfileAnalytics, ProfileAnalytics } from '@/lib/topic-finder/analytics';

export const useProfileAnalytics = (
    accountId: string | null,
    dateRange = 7,
): ProfileAnalytics | null => {
    const enabled = Boolean(accountId);

    const { data: current } = useQuery<InsightsData[]>({
        queryKey: accountId ? statisticsKeys.userInsights(accountId, dateRange) : ['profile', 'insights', 'current'],
        queryFn: () => fetchUserInsights(accountId!, dateRange),
        enabled,
        staleTime: 5 * 60 * 1000,
    });

    const { data: previous } = useQuery<InsightsData[]>({
        queryKey: accountId ? [...statisticsKeys.userInsights(accountId, dateRange), 'previous'] : ['profile', 'insights', 'previous'],
        queryFn: () => fetchPreviousPeriodInsights(accountId!, dateRange),
        enabled,
        staleTime: 10 * 60 * 1000,
    });

    return useMemo(
        () => computeProfileAnalytics(current, previous),
        [current, previous],
    );
};
