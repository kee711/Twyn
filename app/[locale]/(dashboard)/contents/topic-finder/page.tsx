'use client';

import { ProfileDescriptionDropdown } from '@/components/contents-helper/ProfileDescriptionDropdown';
import { HeadlineInput } from '@/components/contents-helper/HeadlineInput';
import useSocialAccountStore from '@/stores/useSocialAccountStore';
import { ThreadsProfilePicture } from '@/components/ThreadsProfilePicture';
import { startTransition, useEffect, useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { useTranslations } from 'next-intl';
import useThreadChainStore from '@/stores/useThreadChainStore';
import { ThreadContent } from '@/components/contents-helper/types';
import { HeadlineButtons } from '@/components/contents-helper/HeadlineButtons';
import { useTopicResultsStore } from '@/stores/useTopicResultsStore';
import { fetchAndSaveComments, fetchAndSaveMentions } from '@/app/actions/fetchComment';
import { getAllCommentsWithRootPosts, getAllMentionsWithRootPosts } from '@/app/actions/comment';
import { statisticsKeys } from '@/lib/queries/statisticsKeys';
import { fetchUserInsights, fetchTopPosts } from '@/lib/queries/statisticsQueries';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogTitle, AlertDialogContent, AlertDialogHeader, AlertDialogTrigger, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useContentGenerationStore } from '@/lib/stores/content-generation';
// removed duplicate import
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import useAiContentStore from '@/stores/useAiContentStore';
import { trackUserAction } from '@/lib/analytics/mixpanel';

export default function TopicFinderPage() {
    const t = useTranslations('pages.contents.topicFinder');
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { setPendingThreadChain, setGenerationStatus, setGenerationPreview, clearGenerationPreview, threadChain, setThreadChain, ensureThreadCount, setThreadContentAt } = useThreadChainStore();
    const { openRightSidebar, isRightSidebarOpen } = useMobileSidebar();
    const queryClient = useQueryClient();

    const { currentSocialId, currentUsername } = useSocialAccountStore()
    const [profileDescription, setProfileDescription] = useState('')
    const [selectedHeadline, setSelectedHeadline] = useState<string>('');
    const [givenInstruction, setGivenInstruction] = useState<string>('');
    const { postType, language } = useContentGenerationStore();
    const { setOriginalAiContent } = useAiContentStore();

    // Memoize Supabase client to prevent creating new instances
    const supabase = useMemo(() => createClient(), []);

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
        const headline = selectedHeadline;
        setTopicLoading(headline, true);
        setIsGeneratingDetails(true);
        // 사이드바 열기 및 초기화
        if (!isRightSidebarOpen) openRightSidebar();
        setGenerationStatus('thinking how to write...');
        clearGenerationPreview();
        // 첫 번째 스레드가 없다면 초기화
        if (threadChain.length === 0) {
            setThreadChain([{ content: '', media_urls: [], media_type: 'TEXT' }]);
        }
        try {
            const res = await fetch('/api/generate-detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountInfo: profileDescription,
                    topic: headline,
                    instruction: givenInstruction,
                    postType,
                    language
                })
            });
            if (!res.ok) throw new Error('API error');

            const isUIStream = res.headers.get('x-vercel-ai-ui-message-stream') === 'v1';
            const contentType = res.headers.get('content-type') || '';

            // 스트림 소비 (권장 경로)
            if (isUIStream || contentType.includes('text/event-stream')) {
                const reader = res.body?.getReader();
                if (!reader) throw new Error('No readable stream');
                const decoder = new TextDecoder();
                let buffer = '';
                let finalThreads: string[] | null = null;
                // single-post 누적 버퍼
                let singleBuffer = '';
                // thread(JSON array) 인크리멘탈 파서 상태
                let arrayStarted = false;
                let insideString = false;
                let escapeNext = false;
                let builtItems: string[] = [];
                let currentItem = '';

                // 진행상황을 토스트로 안내
                setGenerationStatus('thinking how to write...');

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });

                    // 이벤트 경계 처리: \n\n 로 분리
                    const events = buffer.split('\n\n');
                    buffer = events.pop() || '';

                    for (const evt of events) {
                        const lines = evt.split('\n');
                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            const jsonStr = line.slice(6).trim();
                            if (jsonStr === '' || jsonStr === '[DONE]') continue;
                            let dataPart: any;
                            try { dataPart = JSON.parse(jsonStr); } catch { continue; }

                            // 데이터 파트 처리
                            if (dataPart.type === 'data-status') {
                                const msg = dataPart.data?.message || '';
                                if (typeof msg === 'string' && msg) {
                                    // 상태 메시지를 헤더 자리에 반영
                                    const lower = msg.toLowerCase();
                                    if (lower.includes('preparing')) setGenerationStatus('thinking how to write...');
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
                            // 텍스트 델타 처리: postType 별 분기
                            if (dataPart.type === 'text-delta' && typeof dataPart.delta === 'string') {
                                const delta: string = dataPart.delta;
                                if (postType === 'single') {
                                    // 단일 포스트: 토큰 그대로 1개 카드에만 스트리밍
                                    singleBuffer += delta;
                                    const normalized = singleBuffer.replace(/\\n/g, '\n');
                                    ensureThreadCount(1);
                                    setThreadContentAt(0, normalized);
                                } else {
                                    // 스레드 체인: JSON 배열을 인크리멘탈 파싱하여 즉시 카드 분할
                                    for (let i = 0; i < delta.length; i++) {
                                        const ch = delta[i];
                                        if (!arrayStarted) {
                                            if (ch === '[') arrayStarted = true;
                                            continue; // '[' 이전 토큰 무시
                                        }
                                        if (!insideString) {
                                            if (ch === '"') {
                                                insideString = true;
                                                escapeNext = false;
                                                currentItem = '';
                                                // 새 카드 시작 보장
                                                ensureThreadCount(builtItems.length + 1);
                                            } else if (ch === ']') {
                                                // 배열 종료
                                                arrayStarted = false;
                                            } else {
                                                // 콤마/공백 등 무시
                                            }
                                        } else {
                                            // inside string
                                            if (escapeNext) {
                                                // Handle common JSON escapes so UI shows real newlines instead of 'n'
                                                if (ch === 'n') currentItem += '\n';
                                                else if (ch === 'r') currentItem += '\r';
                                                else if (ch === 't') currentItem += '\t';
                                                else if (ch === '"') currentItem += '"';
                                                else if (ch === '\\') currentItem += '\\';
                                                else if (ch === '/') currentItem += '/';
                                                else currentItem += ch; // fallback
                                                escapeNext = false;
                                            } else if (ch === '\\') {
                                                escapeNext = true;
                                            } else if (ch === '"') {
                                                // 문자열 종료 → 아이템 확정
                                                builtItems.push(currentItem);
                                                // 확정된 아이템을 해당 카드에 반영
                                                const normalized = currentItem;
                                                ensureThreadCount(builtItems.length);
                                                setThreadContentAt(builtItems.length - 1, normalized);
                                                insideString = false;
                                                currentItem = '';
                                            } else {
                                                currentItem += ch;
                                                // 진행 중 아이템 내용을 현재 카드에 스트리밍 반영
                                                const normalized = currentItem;
                                                ensureThreadCount(builtItems.length + 1);
                                                setThreadContentAt(builtItems.length, normalized);
                                            }
                                        }
                                    }
                                }
                            }
                            // 스트림 종료 시점 처리 (백업 경로 최소화)
                            if (dataPart.type === 'finish' && !finalThreads) {
                                if (postType === 'single') {
                                    finalThreads = [singleBuffer.replace(/\\n/g, '\n').trim()];
                                } else {
                                    // 남아있는 진행 중 아이템 마무리
                                    if (insideString && currentItem.trim().length > 0) {
                                        builtItems.push(currentItem);
                                        const normalized = currentItem.replace(/\\n/g, '\n');
                                        ensureThreadCount(builtItems.length);
                                        setThreadContentAt(builtItems.length - 1, normalized);
                                    }
                                    finalThreads = builtItems.length > 0 ? builtItems.map(s => s.replace(/\\n/g, '\n')) : null;
                                }
                            }
                        }
                    }
                }

                // 최종 결과 적용
                if (finalThreads && finalThreads.length > 0) {
                    const threadChain: ThreadContent[] = finalThreads.map((content: string) => ({
                        content,
                        media_urls: [],
                        media_type: 'TEXT' as const
                    }));
                    setPendingThreadChain(threadChain);
                    setOriginalAiContent(threadChain); // Store original AI content
                    setTopicDetail(headline, finalThreads.join('\n\n'));
                    setGenerationStatus(null);
                    clearGenerationPreview();
                    toast.success(t('threadsGenerated', { count: threadChain.length }));
                    
                    // Track AI content generation
                    trackUserAction.aiContentGenerated({
                        topic: headline,
                        postType: postType as 'single' | 'thread',
                        language,
                        threadCount: threadChain.length
                    });
                } else {
                    throw new Error('No threads received');
                }
            } else {
                // 하위 호환: JSON 경로
                const data = await res.json();
                const threadChain: ThreadContent[] = data.threads.map((content: string) => ({
                    content,
                    media_urls: [],
                    media_type: 'TEXT' as const
                }));
                setPendingThreadChain(threadChain);
                setOriginalAiContent(threadChain); // Store original AI content
                setTopicDetail(headline, data.threads.join('\n\n'));
                setGenerationStatus(null);
                clearGenerationPreview();
                toast.success(t('threadsGenerated', { count: threadChain.length }));
                
                // Track AI content generation
                trackUserAction.aiContentGenerated({
                    topic: headline,
                    postType: postType as 'single' | 'thread',
                    language,
                    threadCount: threadChain.length
                });
            }
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

    // 계정 정보 로드
    useEffect(() => {
        if (!currentSocialId) return

        const fetchAccountDetails = async () => {
            setIsLoading(true)
            try {
                const { data: accountData, error: accountError } = await supabase
                    .from('social_accounts')
                    .select('account_type, profile_description')
                    .eq('social_id', currentSocialId)
                    .single()

                if (!accountError && accountData) {
                    setProfileDescription(accountData.profile_description || '')
                } else {
                    setProfileDescription('')
                }
            } catch (error) {
                toast.error('계정 정보를 불러오는 중 오류가 발생했습니다.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchAccountDetails()
    }, [currentSocialId, supabase])

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
        if (!profileDescription) {
            toast.error(t('noProfileDescription'));
            return;
        }
        setIsGeneratingTopics(true);
        setIsLoading(true);
        try {
            const res = await fetch('/api/generate-topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileDescription, language })
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

    useEffect(() => {
        // 필요시 topicResults 변경 추적
    }, [topicResults]);

    return (
        <div className="p-4 md:p-6 h-screen">
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-full mx-auto pt-32 pb-48 flex flex-col items-center overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {/* 중앙 정렬 인사말 */}
                    <div className="px-6 md:px-4 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-2 mb-1">
                            {/* 프로필 이미지 - 동적으로 가져오기 */}
                            {mounted && (
                                <ThreadsProfilePicture
                                    socialId={currentSocialId}
                                    alt="Profile picture"
                                    className="w-8 h-8 rounded-full"
                                />
                            )}
                            <h2 className="text-xl md:text-2xl font-semibold text-center md:text-left">
                                {t('greeting', { username: mounted ? (currentUsername || t('defaultUser')) : t('defaultUser') })}
                            </h2>
                        </div>
                        <h2 className="text-xl md:text-2xl font-semibold text-center md:text-left whitespace-normal break-keep">{t('question')}</h2>
                    </div>
                    {/* Headline 입력 및 태그 */}
                    <div className="w-full max-w-3xl">
                        {/* Profile Description Dropdown */}
                        {mounted && currentSocialId && (
                            <div className="w-full px-4 md:px-6 mt-3 flex justify-between transition-all duration-300">
                                <ProfileDescriptionDropdown
                                    accountId={currentSocialId}
                                    initialDescription={profileDescription || ''}
                                    // profileDescription 업데이트 핸들러 전달
                                    onSave={(newDescription) => setProfileDescription(newDescription)}
                                />
                            </div>
                        )}
                        <HeadlineInput value={selectedHeadline} onChange={setSelectedHeadline} />
                    </div>

                    {/* Headline Buttons */}
                    <div className="w-full max-w-3xl flex-1">
                        <HeadlineButtons
                            onCreateDetails={handleGenerateDetail}
                            onGenerateTopics={generateTopics}
                            IsIdeasLoading={isGeneratingTopics}
                            IsCreateDetailsLoading={isGeneratingDetails}
                            hasHeadline={!!selectedHeadline}
                        />
                    </div>

                    {/* Topics Section */}
                    <div className="w-full max-w-3xl mt-6 flex-1">
                        <div className="space-y-4">
                            {/* 토픽 결과 */}
                            <div className="flex flex-col gap-4 mb-6">
                                {topicResults.length > 0 && topicResults.map((t, i) => (
                                    <div key={i} className="relative">
                                        <HeadlineInput
                                            value={t.topic || ''}
                                            onChange={v => handleTopicChange(i, v)}
                                            inline
                                            ellipsis
                                            isSelected={selectedHeadline === t.topic}
                                            onClick={() => setSelectedHeadline(t.topic)}
                                            onInstructionChange={handleInstructionChange}
                                        />
                                    </div>
                                ))}
                                {isGeneratingTopics && (
                                    <div className="flex flex-col gap-4 max-w-3xl">
                                        <div className="w-3/4 h-[48px] rounded-[20px] bg-gray-300 animate-pulse" />
                                        <div className="w-1/2 h-[48px] rounded-[20px] bg-gray-300 animate-pulse" />
                                    </div>
                                )}
                                {topicResults.length > 0 && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className='text-muted-foreground'
                                            >
                                                {t('deleteAllTopicsButton')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>{t('deleteAllTopics')}</DialogTitle>
                                                <DialogDescription>
                                                    {t('deleteAllTopicsDescription')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter className='gap-2'>
                                                <DialogClose className='text-muted-foreground mb-[-8px]'>{t('cancel')}</DialogClose>
                                                <Button variant="destructive" onClick={() => removeTopicResult()}>{t('delete')}</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}