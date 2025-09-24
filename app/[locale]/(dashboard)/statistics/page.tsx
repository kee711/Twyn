"use client";

import { useState, useEffect, startTransition } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/PostCard";
import useSocialAccountStore from "@/stores/useSocialAccountStore";
import {
    useStatisticsWithChanges,
    useTopPosts,
    useRefreshStatistics,
    fetchUserInsights,
    fetchTopPosts,
    useDemographicData,
    useDemographicInsights
} from "@/lib/queries/statisticsQueries";
import { statisticsKeys } from "@/lib/queries/statisticsKeys";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart,
    BarChart,
    Bar
} from "recharts";
import {
    Users,
    Heart,
    MessageCircle,
    Repeat,
    Eye,
    RefreshCw,
    Loader2,
    Quote,
    MapPin,
    UserCheck
} from "lucide-react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
    Marker,
    Annotation
} from "react-simple-maps";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles } from 'lucide-react';


// 타입 정의는 store에서 import

interface TopPost {
    id: string;
    content: string;
    username: string;
    avatar: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    repostCount?: number;
    shareCount?: number;
    engagementRate?: number;
}

interface DateRange {
    label: string;
    days: number;
}

export default function StatisticsPage() {
    const t = useTranslations('components.statistics');
    const locale = useLocale();
    const { data: session } = useSession();
    const { currentSocialId, getSelectedAccount } = useSocialAccountStore();
    const queryClient = useQueryClient();

    const dateRanges: DateRange[] = [
        { label: t('dateRanges.7days'), days: 7 },
        { label: t('dateRanges.30days'), days: 30 },
        { label: t('dateRanges.90days'), days: 90 },
    ];

    // 로컬 상태
    const [selectedMetric] = useState('views');
    const [selectedTopPostMetric] = useState('views');
    const [selectedDateRange, setSelectedDateRange] = useState(7);
    const [isClient, setIsClient] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    // React Query hooks
    const {
        currentInsights: userInsights = [],
        changes,
        isLoading: isLoadingInsights
    } = useStatisticsWithChanges(
        selectedAccount?.social_id || '',
        selectedDateRange
    );

    const {
        data: topPosts = [],
        isLoading: isLoadingPosts,
        isFetching: isFetchingPosts
    } = useTopPosts(selectedAccount?.social_id || '');

    const refreshMutation = useRefreshStatistics();

    // Demographic data hooks
    const { data: ageData } = useDemographicData(selectedAccount?.social_id || '', 'age');
    const { data: genderData } = useDemographicData(selectedAccount?.social_id || '', 'gender');
    const { data: countryData } = useDemographicData(selectedAccount?.social_id || '', 'country');
    const { data: cityData } = useDemographicData(selectedAccount?.social_id || '', 'city');

    // 캐시에서 데이터가 있는지 확인
    const isFromCache = queryClient.getQueryData(
        statisticsKeys.userInsights(selectedAccount?.social_id || '', selectedDateRange)
    ) !== undefined;

    // 클라이언트 마운트 후 계정 정보 설정
    useEffect(() => {
        setIsClient(true);
        setSelectedAccount(getSelectedAccount());
    }, [currentSocialId]);

    // 30일, 90일 데이터 prefetching
    useEffect(() => {
        if (selectedAccount?.social_id && isClient) {
            startTransition(() => {
                const accountId = selectedAccount.social_id;

                // 현재 선택되지 않은 날짜 범위들을 prefetch
                const dateRangesToPrefetch = [7, 30, 90].filter(range => range !== selectedDateRange);

                dateRangesToPrefetch.forEach(dateRange => {
                    queryClient.prefetchQuery({
                        queryKey: statisticsKeys.userInsights(accountId, dateRange),
                        queryFn: () => fetchUserInsights(accountId, dateRange),
                        staleTime: 5 * 60 * 1000,
                    });
                });

                // TopPosts도 prefetch (이미 로드되지 않은 경우)
                queryClient.prefetchQuery({
                    queryKey: statisticsKeys.topPosts(accountId),
                    queryFn: () => fetchTopPosts(accountId),
                    staleTime: 10 * 60 * 1000,
                });
            });
        }
    }, [selectedAccount?.social_id, isClient, selectedDateRange, queryClient]);

    const handleRefresh = async () => {
        if (!selectedAccount?.social_id) return;

        try {
            await refreshMutation.mutateAsync({
                accountId: selectedAccount.social_id,
                dateRange: selectedDateRange
            });
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    // 로딩 상태 계산
    const isLoading = isLoadingInsights || isLoadingPosts;
    const isRefreshing = refreshMutation.isPending || isFetchingPosts;

    // 인사이트 데이터에서 값 추출
    const getInsightValue = (metricName: string): number => {
        const insight = userInsights.find((item: any) => item.name === metricName);
        if (!insight) return 0;

        if (insight.total_value) {
            return insight.total_value.value;
        }

        if (insight.values && insight.values.length > 0) {
            return insight.values.reduce((sum: number, item: any) => sum + item.value, 0);
        }

        return 0;
    };

    // 실제 API 데이터에서 차트 데이터 생성
    const generateChartData = () => {
        // views는 Time Series 메트릭이므로 일별 데이터가 있음
        const viewsInsight = userInsights.find((item: any) => item.name === 'views');

        // likes, replies, reposts, quotes는 Total Value 메트릭이므로 총합만 있음
        const totalLikes = getInsightValue('likes');
        const totalReplies = getInsightValue('replies');
        const totalReposts = getInsightValue('reposts');
        const totalQuotes = getInsightValue('quotes');

        // Time Series 데이터에서 차트 데이터 생성
        const chartData = viewsInsight?.values?.map((viewData: any, index: number) => {
            // API에서 받은 end_time을 파싱
            const date = viewData.end_time ? new Date(viewData.end_time) : new Date(Date.now() - (viewsInsight.values!.length - 1 - index) * 24 * 60 * 60 * 1000);

            // MM/DD 형식으로 날짜 표시
            const formattedDate = `${(date.getMonth() + 1)}/${date.getDate()}`;

            // Total Value 메트릭은 일별로 분산해서 표시 (근사값)
            const dailyLikes = Math.round(totalLikes / viewsInsight.values!.length);
            const dailyReplies = Math.round(totalReplies / viewsInsight.values!.length);
            const dailyReposts = Math.round(totalReposts / viewsInsight.values!.length);
            const dailyQuotes = Math.round(totalQuotes / viewsInsight.values!.length);
            const dailyEngagement = dailyLikes + dailyReplies + dailyReposts + dailyQuotes;

            return {
                name: formattedDate,
                views: viewData.value,
                likes: dailyLikes,
                replies: dailyReplies,
                reposts: dailyReposts,
                quotes: dailyQuotes,
                engagement: dailyEngagement,
            };
        });

        // Time Range에 따른 데이터 포인트 조정
        if (selectedDateRange === 7) {
            // 7일: 모든 날짜 표시
            return chartData;
        } else if (selectedDateRange === 30) {
            // 30일: 5일 간격으로 표시
            return chartData?.filter((_: any, index: number) => index % 5 === 0 || index === chartData.length - 1);
        } else if (selectedDateRange === 90) {
            // 90일: 주간 단위로 표시 (7일 간격)
            return chartData?.filter((_: any, index: number) => index % 7 === 0 || index === chartData.length - 1);
        }

        return chartData;
    };

    // Process demographic data for charts
    const processAgeDemographics = () => {
        if (!ageData?.values || ageData.values.length === 0) {
            return [];
        }

        // Normalize possible shapes: direct array, nested array in first.value, or object map in first.value
        let items: Array<{ name: string; value: number }> = [];
        const first = ageData.values[0];

        if (Array.isArray(first?.value)) {
            items = first.value.map((v: any) => ({
                name: v.name || v.age_range || v.key || String(v.label || 'Unknown'),
                value: typeof v.value === 'number' ? v.value : (typeof v.count === 'number' ? v.count : 0)
            }));
        } else if (first && typeof first.value === 'object' && first.value !== null) {
            items = Object.entries(first.value).map(([k, v]: [string, any]) => ({
                name: k,
                value: typeof v === 'number' ? v : 0
            }));
        } else if (Array.isArray(ageData.values)) {
            items = ageData.values.map((v: any) => ({
                name: v.name || v.age_range || 'Unknown',
                value: typeof v.value === 'number' ? v.value : 0
            }));
        }

        items = items.filter((it) => typeof it.value === 'number' && it.value > 0);
        const total = items.reduce((sum: number, it) => sum + it.value, 0);
        if (total <= 0) return [];

        return items.map((item, index) => ({
            name: item.name,
            value: item.value,
            percentage: Math.round((item.value / total) * 100),
            fill: `hsl(217, 91%, ${70 - index * 10}%)`
        }));
    };

    const processGenderDemographics = () => {
        if (!genderData?.values || genderData.values.length === 0) {
            return [];
        }

        // Normalize possible shapes
        let items: Array<{ name: string; value: number }> = [];
        const first = genderData.values[0];

        if (Array.isArray(first?.value)) {
            items = first.value.map((v: any) => ({
                name: v.name || v.gender || v.key || 'Unknown',
                value: typeof v.value === 'number' ? v.value : (typeof v.count === 'number' ? v.count : 0)
            }));
        } else if (first && typeof first.value === 'object' && first.value !== null) {
            items = Object.entries(first.value).map(([k, v]: [string, any]) => ({
                name: k,
                value: typeof v === 'number' ? v : 0
            }));
        } else if (Array.isArray(genderData.values)) {
            items = genderData.values.map((v: any) => ({
                name: v.name || v.gender || 'Unknown',
                value: typeof v.value === 'number' ? v.value : 0
            }));
        }

        items = items.filter((it) => typeof it.value === 'number' && it.value > 0);
        const total = items.reduce((sum: number, it) => sum + it.value, 0);
        if (total <= 0) return [];

        return items.map((item, index) => ({
            name: item.name === 'M' ? t('demographics.male') :
                item.name === 'F' ? t('demographics.female') :
                    t('demographics.unknown'),
            value: item.value,
            percentage: Math.round((item.value / total) * 100),
            fill: `hsl(270, 70%, ${65 - index * 15}%)`
        }));
    };

    // Process geographic data for map
    const processGeographicData = () => {
        if (!countryData?.values || countryData.values.length === 0) {
            return [];
        }

        // Normalize possible shapes for country breakdown
        let items: Array<{ name: string; value: number }> = [];
        const first = countryData.values[0];

        if (Array.isArray(first?.value)) {
            items = first.value.map((v: any) => ({
                name: v.name || v.country || v.key || 'Unknown',
                value: typeof v.value === 'number' ? v.value : (typeof v.count === 'number' ? v.count : 0)
            }));
        } else if (first && typeof first.value === 'object' && first.value !== null) {
            items = Object.entries(first.value).map(([k, v]: [string, any]) => ({
                name: k,
                value: typeof v === 'number' ? v : 0
            }));
        } else if (Array.isArray(countryData.values)) {
            items = countryData.values.map((v: any) => ({
                name: v.name || v.country || 'Unknown',
                value: typeof v.value === 'number' ? v.value : 0
            }));
        }

        items = items.filter((it) => typeof it.value === 'number' && it.value > 0);
        if (items.length === 0) return [];

        return items.map((item) => ({
            country: item.name,
            value: item.value
        }));
    };

    // Generate insights based on normalized demographics
    const generateDemographicInsights = () => {
        const insights: string[] = [];

        // Gender insight from normalized genderPieData
        if (genderPieData.length > 0) {
            const total = genderPieData.reduce((sum: number, g: any) => sum + (g.value || 0), 0);
            const sortedGender = [...genderPieData].sort((a: any, b: any) => b.value - a.value);
            const topGender = sortedGender[0];
            const percentage = total > 0 ? Math.round((topGender.value / total) * 100) : 0;

            if ((topGender.name === t('demographics.male') || topGender.name === 'M') && percentage > 55) {
                insights.push(t('demographics.insights.malePopular', { percentage }));
            } else if ((topGender.name === t('demographics.female') || topGender.name === 'F') && percentage > 55) {
                insights.push(t('demographics.insights.femalePopular', { percentage }));
            } else {
                insights.push(t('demographics.insights.balancedGender'));
            }
        }

        // Age insight from normalized agePieData
        if (agePieData.length > 0) {
            const sortedAge = [...agePieData].sort((a: any, b: any) => b.value - a.value);
            const topAge = sortedAge[0];
            insights.push(t('demographics.insights.topAgeGroup', { ageGroup: topAge.name }));
        }

        // Country insight from normalized geographicData
        if (geographicData.length > 0) {
            const sortedCountry = [...geographicData].sort((a: any, b: any) => b.value - a.value);
            const topCountry = sortedCountry[0];
            insights.push(t('demographics.insights.topCountry', { country: topCountry.country }));
        }

        return insights;
    };

    // 차트와 demographic 데이터 생성
    const chartData = generateChartData();
    const agePieData = processAgeDemographics();
    const genderPieData = processGenderDemographics();
    const geographicData = processGeographicData();
    const demographicInsights = generateDemographicInsights();

    // Calculate geographic totals for use in map and list
    const totalGeographicFollowers = geographicData.reduce((sum: number, d: any) => sum + d.value, 0);
    const maxGeographicValue = geographicData.length > 0 ? Math.max(...geographicData.map((d: any) => d.value)) : 0;

    // Fetch AI insights for demographics
    const { data: aiComments, isLoading: isLoadingAIComments } = useDemographicInsights(
        agePieData,
        genderPieData,
        locale
    );

    // Use real AI comments when available, no mock comments needed
    const displayAIComments = aiComments;

    // 메트릭 카드 데이터
    const metricCards = [
        {
            title: t('metrics.totalViews'),
            value: getInsightValue('views') || t('metrics.noData'),
            change: changes?.views?.change || 'N/A',
            changeType: changes?.views?.changeType || 'neutral' as const,
            icon: <Eye className="w-5 h-5" />,
            description: t('metrics.trendInPeriod')
        },
        {
            title: t('metrics.totalFollowers'),
            value: getInsightValue('followers_count') || t('metrics.noData'),
            icon: <Users className="w-5 h-5" />,
            description: t('metrics.currentCount')
        },
        {
            title: t('metrics.totalLikes'),
            value: getInsightValue('likes') || t('metrics.noData'),
            change: changes?.likes?.change || '',
            changeType: changes?.likes?.changeType || 'neutral' as const,
            icon: <Heart className="w-5 h-5" />,
            description: t('metrics.fromPreviousPeriod')
        },
        {
            title: t('metrics.totalReplies'),
            value: getInsightValue('replies') || t('metrics.noData'),
            change: changes?.replies?.change || 'N/A',
            changeType: changes?.replies?.changeType || 'neutral' as const,
            icon: <MessageCircle className="w-5 h-5" />,
            description: t('metrics.fromPreviousPeriod')
        },
        {
            title: t('metrics.totalReposts'),
            value: getInsightValue('reposts') || t('metrics.noData'),
            change: changes?.reposts?.change || 'N/A',
            changeType: changes?.reposts?.changeType || 'neutral' as const,
            icon: <Repeat className="w-5 h-5" />,
            description: t('metrics.fromPreviousPeriod')
        },
        {
            title: t('metrics.totalQuotes'),
            value: getInsightValue('quotes') || t('metrics.noData'),
            change: changes?.quotes?.change || 'N/A',
            changeType: changes?.quotes?.changeType || 'neutral' as const,
            icon: <Quote className="w-5 h-5" />,
            description: t('metrics.fromPreviousPeriod')
        },
    ];

    // 탑 포스트 정렬
    const getDisplayTopPosts = (): TopPost[] => {
        // 실제 API 데이터를 TopPost 형태로 변환
        return topPosts.map(post => ({
            id: post.id,
            content: post.text || t('noContentAvailable'),
            username: post.username,
            avatar: '/avatars/01.png', // 기본 아바타
            viewCount: post.viewCount,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            repostCount: post.repostCount,
            shareCount: post.shareCount,
            engagementRate: post.engagementRate,
        }));
    };

    const sortedTopPosts = getDisplayTopPosts().sort((a, b) => {
        if (selectedTopPostMetric === 'views') {
            return (b.viewCount || 0) - (a.viewCount || 0);
        } else {
            return (b.engagementRate || 0) - (a.engagementRate || 0);
        }
    }).slice(0, 3); // Top 3만 선택

    // 초기 로딩 중이거나 클라이언트가 아직 마운트되지 않은 경우
    if (!isClient) {
        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }


    if (!session) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">{t('noAuth.title')}</h1>
                    <p className="text-muted-foreground">{t('noAuth.description')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto space-y-4 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
                        <div className="text-muted-foreground text-sm font-semibold rounded-full bg-muted px-2 py-1 w-fit">
                            @{selectedAccount.username}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                    {/* Date Range Selector */}
                    <div className="flex border rounded-lg bg-muted p-1 w-full sm:w-auto">
                        {dateRanges.map((range) => (
                            <button
                                key={range.days}
                                onClick={() => setSelectedDateRange(range.days)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-1 sm:flex-none",
                                    selectedDateRange === range.days
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <div className="flex border rounded-lg bg-muted p-1 w-fit sm:w-auto">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-1 sm:flex-none text-muted-foreground hover:text-foreground disabled:opacity-50 flex items-center gap-2"
                        >
                            {isRefreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">{t('refresh')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && !isFromCache ? (
                /* Loading State */
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-gray-200 rounded-lg h-80 animate-pulse" />
                        <div className="bg-gray-200 rounded-lg h-80 animate-pulse" />
                    </div>
                </div>
            ) : (
                <>
                    {/* Metrics Cards */}
                    <div className="space-y-4">
                        {/* First row: 2 cards on lg+ screens */}
                        <div className="grid grid-cols-2 gap-4">
                            {metricCards.slice(0, 2).map((card, index) => (
                                <Card key={index} className="bg-muted">
                                    <CardContent>
                                        <div className="flex flex-col space-y-1 items-center">
                                            <div className="flex items-center justify-between w-full">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    {card.title}
                                                </p>
                                                <div className="h-6 w-6 text-muted-foreground">
                                                    {card.icon}
                                                </div>
                                            </div>
                                            <div className="space-y-1 flex flex-col md:flex-row items-start md:justify-between md:items-end text-right w-full">
                                                <div className="text-xl md:text-2xl font-bold">
                                                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <span className={`font-medium ${card.changeType === 'positive' ? 'text-green-600' :
                                                        card.changeType === 'negative' ? 'text-red-600' :
                                                            'text-muted-foreground'
                                                        }`}>
                                                        {card.change}
                                                    </span>
                                                    <span className="text-muted-foreground ml-1">
                                                        {card.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Second row: 4 columns on lg+ screens */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {metricCards.slice(2).map((card, index) => (
                                <Card key={index + 2}>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1 w-full">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        {card.title}
                                                    </p>
                                                    <div className="h-6 w-6 text-muted-foreground flex items-center">
                                                        {card.icon}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-xl md:text-2xl font-bold">
                                                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <span className={`font-medium ${card.changeType === 'positive' ? 'text-green-600' :
                                                            card.changeType === 'negative' ? 'text-red-600' :
                                                                'text-muted-foreground'
                                                            }`}>
                                                            {card.change}
                                                        </span>
                                                        <span className="text-muted-foreground ml-1">
                                                            {card.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Line Chart */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">{t('charts.viewsPerformance')}</CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    {t('charts.forLastDays', { days: selectedDateRange })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 md:h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#6b7280"
                                                fontSize={12}
                                            />
                                            <YAxis
                                                stroke="#6b7280"
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e0e4e7',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey={selectedMetric}
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                fill="url(#colorGradient)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Demographics Section */}
                        <div className="space-y-4">
                            {/* Age & Gender Charts */}
                            <div className="grid grid-cols-1 h-full md:grid-cols-2 gap-4">
                                {/* Age Distribution */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            {t('demographics.ageDistribution')}
                                        </CardTitle>
                                        <CardDescription className="text-sm text-muted-foreground">
                                            {t('charts.forLastDays', { days: selectedDateRange })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-48 relative">
                                            {agePieData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={agePieData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                        <XAxis
                                                            dataKey="name"
                                                            tick={{ fontSize: 12 }}
                                                            stroke="#6b7280"
                                                        />
                                                        <YAxis
                                                            tick={{ fontSize: 12 }}
                                                            stroke="#6b7280"
                                                            tickFormatter={(value) => `${value}%`}
                                                        />
                                                        <Tooltip
                                                            formatter={(value: any) => `${value}%`}
                                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                                                        />
                                                        <Bar
                                                            dataKey="percentage"
                                                            radius={[8, 8, 0, 0]}
                                                        >
                                                            {agePieData.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <>
                                                    <div className="h-full blur-sm">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={[
                                                                { name: '18-24', percentage: 25, fill: `hsl(217, 91%, 70%)` },
                                                                { name: '25-34', percentage: 35, fill: `hsl(217, 91%, 60%)` },
                                                                { name: '35-44', percentage: 20, fill: `hsl(217, 91%, 50%)` },
                                                                { name: '45-54', percentage: 15, fill: `hsl(217, 91%, 40%)` },
                                                                { name: '55+', percentage: 5, fill: `hsl(217, 91%, 30%)` }
                                                            ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                                <XAxis
                                                                    dataKey="name"
                                                                    tick={{ fontSize: 12 }}
                                                                    stroke="#6b7280"
                                                                />
                                                                <YAxis
                                                                    tick={{ fontSize: 12 }}
                                                                    stroke="#6b7280"
                                                                    tickFormatter={(value) => `${value}%`}
                                                                />
                                                                <Bar
                                                                    dataKey="percentage"
                                                                    radius={[8, 8, 0, 0]}
                                                                >
                                                                    {[0, 1, 2, 3, 4].map((index) => (
                                                                        <Cell key={`cell-${index}`} fill={`hsl(217, 91%, ${70 - index * 10}%)`} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80">
                                                        <div className="text-center px-4">
                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                {t('demographics.requiresFollowers')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {/* AI Insight for Age */}
                                        {agePieData.length > 0 && (
                                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                                {isLoadingAIComments ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            {t('generatingInsight')}
                                                        </p>
                                                    </div>
                                                ) : displayAIComments?.age ? (
                                                    <div className="flex gap-2">
                                                        <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {displayAIComments.age}
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Gender Distribution */}
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <UserCheck className="w-4 h-4" />
                                            {t('demographics.genderDistribution')}
                                        </CardTitle>
                                        <CardDescription className="text-sm text-muted-foreground">
                                            {t('charts.forLastDays', { days: selectedDateRange })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-48 relative">
                                            {genderPieData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={genderPieData}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={60}
                                                            fill="#8884d8"
                                                            dataKey="percentage"
                                                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                                                            labelLine={false}
                                                        >
                                                            {genderPieData.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value: any) => `${value}%`}
                                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <>
                                                    <div className="h-full blur-sm">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={[
                                                                        { name: 'Male', percentage: 56, fill: `hsl(270, 70%, 65%)` },
                                                                        { name: 'Female', percentage: 44, fill: `hsl(270, 70%, 50%)` }
                                                                    ]}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    outerRadius={60}
                                                                    fill="#8884d8"
                                                                    dataKey="percentage"
                                                                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                                                                    labelLine={false}
                                                                >
                                                                    <Cell fill={`hsl(270, 70%, 65%)`} />
                                                                    <Cell fill={`hsl(270, 70%, 50%)`} />
                                                                </Pie>
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80">
                                                        <div className="text-center px-4">
                                                            <p className="text-sm font-medium text-muted-foreground">
                                                                {t('demographics.requiresFollowers')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {/* AI Insight for Gender */}
                                        {genderPieData.length > 0 && (
                                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                                {isLoadingAIComments ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                        <p className="text-sm text-muted-foreground">
                                                            {t('generatingInsight')}
                                                        </p>
                                                    </div>
                                                ) : displayAIComments?.gender ? (
                                                    <div className="flex gap-2">
                                                        <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {displayAIComments.gender}
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Insights */}
                            {demographicInsights.length > 0 && (
                                <Card className="bg-muted/50">
                                    <CardContent className="pt-6">
                                        <div className="space-y-2">
                                            {demographicInsights.map((insight, index) => (
                                                <p key={index} className="text-sm text-muted-foreground">
                                                    💡 {insight}
                                                </p>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Geographic Distribution Map */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                {t('demographics.geographicDistribution')}
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                {t('demographics.followersByCountry')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-hidden">
                            {geographicData.length > 0 ? (
                                <>
                                    <div className="h-[350px] w-full relative">
                                        <ComposableMap
                                            projection="geoNaturalEarth1"
                                            projectionConfig={{
                                                scale: 155,
                                                center: [20, 0],
                                                rotate: [-20, 0, 0]
                                            }}
                                            width={800}
                                            height={350}
                                            style={{
                                                width: "100%",
                                                height: "100%"
                                            }}
                                        >
                                            <ZoomableGroup
                                                zoom={1}
                                                center={[0, 0]}
                                                minZoom={1}
                                                maxZoom={1}
                                            >
                                                <Geographies geography="/world-110m.json">
                                                    {({ geographies }: { geographies: any[] }) => {
                                                        return geographies.map((geo: any) => {
                                                            const geoName = geo.properties?.NAME;
                                                            const iso2 = (geo.properties?.ISO_A2 || geo.properties?.ISO_A2_EH || '').toUpperCase();
                                                            const countryData = geographicData.find(
                                                                (d: any) => d.country === geoName || d.country === iso2
                                                            );
                                                            const percentage = countryData ? Math.round((countryData.value / totalGeographicFollowers) * 100) : 0;
                                                            const intensity = countryData ? countryData.value / maxGeographicValue : 0;

                                                            // Generate color based on intensity
                                                            const getColor = (intensity: number) => {
                                                                if (intensity === 0) return "#e5e7eb";
                                                                if (intensity < 0.2) return "#dbeafe";
                                                                if (intensity < 0.4) return "#93c5fd";
                                                                if (intensity < 0.6) return "#60a5fa";
                                                                if (intensity < 0.8) return "#3b82f6";
                                                                return "#2563eb";
                                                            };

                                                            return (
                                                                <Geography
                                                                    key={geo.rsmKey}
                                                                    geography={geo}
                                                                    fill={getColor(intensity)}
                                                                    stroke="#fff"
                                                                    strokeWidth={0.5}
                                                                    style={{
                                                                        default: {
                                                                            outline: "none"
                                                                        },
                                                                        hover: {
                                                                            fill: countryData ? "#1d4ed8" : "#d1d5db",
                                                                            outline: "none",
                                                                            cursor: countryData ? "pointer" : "default"
                                                                        },
                                                                        pressed: {
                                                                            fill: "#1e40af",
                                                                            outline: "none"
                                                                        }
                                                                    }}
                                                                />
                                                            );
                                                        });
                                                    }}
                                                </Geographies>
                                                {/* Add percentage labels for countries with data */}
                                                {geographicData.map((country: any) => {
                                                    const percentage = Math.round((country.value / totalGeographicFollowers) * 100);
                                                    // Define coordinates for each country (approximate centers)
                                                    const countryCoordinates: { [key: string]: [number, number] } = {
                                                        'United States': [-95, 37],
                                                        'South Korea': [127.5, 37],
                                                        'Japan': [138, 36],
                                                        'United Kingdom': [-3, 55],
                                                        'Germany': [10, 51],
                                                        'France': [2, 46],
                                                        'Canada': [-106, 56],
                                                        'Australia': [133, -27],
                                                        'Brazil': [-47, -15],
                                                        'India': [78, 20],
                                                        'China': [104, 35],
                                                        'Mexico': [-102, 23]
                                                    };

                                                    const coordinates = countryCoordinates[country.country];
                                                    if (!coordinates || percentage < 5) return null; // Only show label for countries > 5%

                                                    return (
                                                        <Marker key={country.country} coordinates={coordinates}>
                                                            <text
                                                                textAnchor="middle"
                                                                style={{
                                                                    fontFamily: "system-ui",
                                                                    fontSize: "14px",
                                                                    fontWeight: "bold",
                                                                    fill: "#000",
                                                                    stroke: "#fff",
                                                                    strokeWidth: 2,
                                                                    paintOrder: "stroke"
                                                                }}
                                                            >
                                                                {percentage}%
                                                            </text>
                                                        </Marker>
                                                    );
                                                })}
                                            </ZoomableGroup>
                                        </ComposableMap>
                                    </div>
                                    {/* Top Countries List */}
                                    <div className="mt-4 space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">{t('demographics.topCountries')}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            {geographicData
                                                .sort((a: any, b: any) => b.value - a.value)
                                                .slice(0, 6)
                                                .map((country: any, index: number) => {
                                                    const percentage = Math.round((country.value / totalGeographicFollowers) * 100);
                                                    return (
                                                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                                            <span className="text-sm font-medium">{country.country}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-muted-foreground">{country.value.toLocaleString()}</span>
                                                                <span className="text-xs font-semibold text-primary">({percentage}%)</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="relative">
                                    <div className="blur-sm">
                                        <div className="h-[350px] w-full overflow-hidden relative">
                                            <ComposableMap
                                                projection="geoNaturalEarth1"
                                                projectionConfig={{
                                                    scale: 155,
                                                    center: [20, 0],
                                                    rotate: [-20, 0, 0]
                                                }}
                                                width={800}
                                                height={350}
                                                style={{
                                                    width: "100%",
                                                    height: "100%"
                                                }}
                                            >
                                                <ZoomableGroup
                                                    zoom={1}
                                                    center={[0, 0]}
                                                    minZoom={1}
                                                    maxZoom={1}
                                                >
                                                    <Geographies geography="/world-110m.json">
                                                        {({ geographies }: { geographies: any[] }) =>
                                                            geographies.map((geo: any) => {
                                                                const mockCountries = ['United States', 'Korea, South', 'Japan', 'United Kingdom', 'Germany'];
                                                                const isMockCountry = mockCountries.includes(geo.properties.NAME);
                                                                return (
                                                                    <Geography
                                                                        key={geo.rsmKey}
                                                                        geography={geo}
                                                                        fill={isMockCountry ? "#3b82f6" : "#e5e7eb"}
                                                                        stroke="#fff"
                                                                        strokeWidth={0.5}
                                                                        style={{
                                                                            default: {
                                                                                outline: "none",
                                                                                opacity: isMockCountry ? 0.7 : 1
                                                                            }
                                                                        }}
                                                                    />
                                                                );
                                                            })
                                                        }
                                                    </Geographies>
                                                </ZoomableGroup>
                                            </ComposableMap>
                                        </div>
                                        {/* Top Countries List - Blurred */}
                                        <div className="mt-4 space-y-2">
                                            <p className="text-sm font-medium text-muted-foreground">{t('demographics.topCountries')}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                {[
                                                    { country: 'United States', value: 2500 },
                                                    { country: 'South Korea', value: 1800 },
                                                    { country: 'Japan', value: 1200 },
                                                    { country: 'United Kingdom', value: 800 },
                                                    { country: 'Germany', value: 600 },
                                                    { country: 'France', value: 400 }
                                                ].map((country, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                                        <span className="text-sm font-medium">{country.country}</span>
                                                        <span className="text-sm text-muted-foreground">{country.value.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 rounded-lg">
                                        <div className="text-center px-4">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {t('demographics.requiresFollowers')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Posts Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('topPosts.title')}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {t('topPosts.description', { days: selectedDateRange })}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {topPosts.length > 0 ? (
                                <div className="space-y-4">
                                    {sortedTopPosts.map((post, index) => (
                                        <div key={index} className="w-full">
                                            <PostCard
                                                variant="compact"
                                                avatar={'/avatars/01.png'}
                                                username={post.username || selectedAccount.username}
                                                content={post.content || ''}
                                                likeCount={post.likeCount}
                                                commentCount={post.commentCount}
                                                repostCount={post.repostCount}
                                                viewCount={post.viewCount}
                                                timestamp={new Date().toISOString()}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        {t('topPosts.noData')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
} 