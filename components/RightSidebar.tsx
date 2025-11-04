"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ThreadChain } from "@/components/ThreadChain";
import { cn } from "@/lib/utils";
import { debugFetch } from "@/lib/utils/debug-fetch";
import useThreadChainStore, { PLATFORM_KEYS, type PlatformKey } from "@/stores/useThreadChainStore";
import { TextSearch, FileText, PanelRightClose, PanelLeftClose, ChevronDown, Bookmark, Plus, Check, X, Link, Unlink } from "lucide-react";
import { createContent } from "@/app/actions/content";
import { toast } from "sonner";
import { postThreadChain, scheduleThreadChain, ThreadContent } from "@/app/actions/threadChain";
import { formatLocalDateTime } from "@/lib/utils/time";
import { AutoPublishTimeDialog } from "./schedule/AutoPublishTimeDialog";
import { SelectPublishTimeDialog } from "./schedule/SelectPublishTimeDialog";
import useSocialAccountStore from "@/stores/useSocialAccountStore";
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { useThreadsProfilePicture } from "@/hooks/useThreadsProfilePicture";
import { useTranslations } from 'next-intl';
import useAiContentStore from '@/stores/useAiContentStore';
import { trackUserAction } from '@/lib/analytics/mixpanel';
import { useOwnershipFlow } from '@/hooks/useOwnershipFlow';
import { buildOwnershipMetadataFromThreads } from '@/lib/ownership';

// 문자열이 아닐 수도 있는 content를 안전하게 문자열로 변환
function getContentString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

interface PlatformButtonConfig {
  key: PlatformKey;
  imageSrc: string;
  alt: string;
}

interface PlatformPublishPayload {
  platform: PlatformKey;
  threads: ThreadContent[];
}

const PLATFORM_DISPLAY_NAMES: Record<PlatformKey, string> = {
  threads: 'Threads',
  x: 'X',
  farcaster: 'Farcaster'
};

const SUPPORTED_IMMEDIATE_PLATFORMS: PlatformKey[] = ['threads', 'farcaster', 'x'];
const SUPPORTED_SCHEDULE_PLATFORMS: PlatformKey[] = ['threads'];

const cloneThreadsForPayload = (threads: ThreadContent[]): ThreadContent[] =>
  threads.map((thread) => ({
    ...thread,
    media_urls: thread.media_urls ? [...thread.media_urls] : [],
    media_type: thread.media_type || (thread.media_urls && thread.media_urls.length > 1
      ? 'CAROUSEL'
      : thread.media_urls && thread.media_urls.length === 1
        ? 'IMAGE'
        : 'TEXT')
  }));

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  const t = useTranslations('components.rightSidebar');
  const tNav = useTranslations('navigation');
  const [showAiInput, setShowAiInput] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number>(0);
  const { accounts, currentSocialId, getSelectedAccount } = useSocialAccountStore();
  const { isRightSidebarOpen, openRightSidebar, closeRightSidebar, isMobile } = useMobileSidebar();
  const pathname = usePathname();
  const { originalAiContent } = useAiContentStore();

  // Use global thread chain store
  const {
    threadChain,
    setThreadChain,
    updateThreadContent,
    updateThreadMedia,
    addThread,
    removeThread,
    clearThreadChain,
    pendingThreadChain,
    applyPendingThreadChain,
    generationStatus,
  platformMode,
  setPlatformMode,
  activePlatforms,
  togglePlatformActive,
  setPlatformActive,
  platformContents,
    setPlatformThreads,
    updatePlatformThreadContent,
    updatePlatformThreadMedia,
    addPlatformThread,
    removePlatformThread
  } = useThreadChainStore();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('threads');
  const isUnlinked = platformMode === 'unlinked';
  const { runOwnershipFlow, OwnershipModal } = useOwnershipFlow();

  useEffect(() => {
    if (!isUnlinked) {
      setSelectedPlatform('threads');
      return;
    }

    if (!activePlatforms[selectedPlatform]) {
      const fallback = PLATFORM_KEYS.find(platform => activePlatforms[platform]) || 'threads';
      setSelectedPlatform(fallback);
    }
  }, [isUnlinked, activePlatforms, selectedPlatform]);

  useEffect(() => {
    const activeCount = PLATFORM_KEYS.reduce(
      (count, platform) => count + (activePlatforms[platform] ? 1 : 0),
      0,
    );

    if (activeCount === 0) {
      setPlatformActive('threads', true);
    }
  }, [activePlatforms, setPlatformActive]);

  const handleUnlinkToggle = () => {
    setPlatformMode(isUnlinked ? 'linked' : 'unlinked');
  };

  const handlePlatformSelect = (platform: PlatformKey) => {
    if (isUnlinked) {
      setSelectedPlatform(platform);
    }
  };

  const platformButtons: PlatformButtonConfig[] = [
    {
      key: 'threads',
      imageSrc: '/threads_logo_blk.svg',
      alt: 'Threads logo'
    },
    {
      key: 'x',
      imageSrc: '/x-logo.jpg',
      alt: 'X logo'
    },
    {
      key: 'farcaster',
      imageSrc: '/farcaster-logo.svg',
      alt: 'Farcaster logo'
    }
  ];

  const handlePlatformToggle = (platform: PlatformKey) => {
    togglePlatformActive(platform);
  };

  const getThreadsForPlatform = (platform: PlatformKey): ThreadContent[] => {
    const sourceThreads = platformMode === 'linked'
      ? threadChain
      : platformContents[platform] || [];

    return cloneThreadsForPayload(sourceThreads || []);
  };

  const threadHasContent = (thread: ThreadContent) => {
    const contentValue = getContentString(thread.content).trim();
    return contentValue.length > 0 || (thread.media_urls && thread.media_urls.length > 0);
  };

  const buildActivePlatformPayloads = (): PlatformPublishPayload[] => {
    return PLATFORM_KEYS.reduce<PlatformPublishPayload[]>((acc, platform) => {
      if (!activePlatforms[platform]) {
        return acc;
      }

      const threads = getThreadsForPlatform(platform).filter(threadHasContent);
      if (threads.length === 0) {
        return acc;
      }

      acc.push({ platform, threads });
      return acc;
    }, []);
  };

  const getAccountForPlatform = (platform: PlatformKey) => {
    return accounts.find(account => account.platform?.toLowerCase?.() === platform && account.is_active);
  };

  const ensureAccountsForPlatforms = (platforms: PlatformKey[]) => {
    const missing = platforms.filter(platform => {
      if (platform === 'farcaster') return false;
      return !getAccountForPlatform(platform);
    });
    if (missing.length > 0) {
      const names = missing.map(platform => PLATFORM_DISPLAY_NAMES[platform]).join(', ');
      toast.error(t('accountConnectionRequired'), {
        description: t('connectAccountsList', { platforms: names })
      });
      return false;
    }
    return true;
  };

  const notifyUnsupportedPlatforms = (platforms: PlatformKey[], action: 'publish' | 'schedule') => {
    if (platforms.length === 0) return;
    const names = platforms.map(platform => PLATFORM_DISPLAY_NAMES[platform]).join(', ');
    const message = action === 'publish'
      ? `Publishing to ${names} is not implemented yet.`
      : `Scheduling for ${names} is not implemented yet.`;
    toast.info(message);
  };

  const buildFarcasterText = (threads: ThreadContent[]) => {
    const parts = threads
      .map(thread => getContentString(thread.content).trim())
      .filter(Boolean);
    if (parts.length === 0) return '';
    const combined = parts.join('\n\n');
    return combined.length > 280 ? combined.slice(0, 277) + '...' : combined;
  };

  const publishToFarcaster = async (threads: ThreadContent[]) => {
    const text = buildFarcasterText(threads);
    if (!text) {
      return { ok: false, error: 'EMPTY_CONTENT' };
    }

    try {
      const response = await fetch('/api/farcaster/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) {
        const error = data?.error || `HTTP ${response.status}`;
        return { ok: false, error };
      }

      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' };
    }
  };

  const buildXText = (threads: ThreadContent[]) => {
    const parts = threads
      .map(thread => getContentString(thread.content).trim())
      .filter(Boolean);
    if (parts.length === 0) return '';
    return parts.join('\n\n');
  };

  const publishToX = async (threads: ThreadContent[]) => {
    const text = buildXText(threads);
    if (!text) {
      return { ok: false, error: 'EMPTY_CONTENT' };
    }

    try {
      const response = await fetch('/api/x/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) {
        const error = data?.error || `HTTP ${response.status}`;
        return { ok: false, error };
      }

      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' };
    }
  };

  // Schedule data
  const [publishTimes, setPublishTimes] = useState<string[]>([]);
  const [reservedTimes, setReservedTimes] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState<string | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // 모바일에서는 isRightSidebarOpen 상태 사용, 데스크톱에서는 기존 isCollapsed 사용
  const toggleSidebar = isMobile ?
    (isRightSidebarOpen ? closeRightSidebar : openRightSidebar) :
    () => setIsCollapsed(prev => !prev);

  // threadChain이 추가될때만 사이드바 펼치기
  useEffect(() => {
    const hasContent = threadChain.some(thread => getContentString(thread.content).trim() !== '');
    if (isMobile) {
      if ((hasContent || generationStatus) && !isRightSidebarOpen) {
        toggleSidebar();
      }
    } else if ((hasContent || generationStatus) && isCollapsed) {
      toggleSidebar();
    }
  }, [threadChain.length, threadChain, generationStatus]);

  // 모바일에서 오버레이 클릭 시 사이드바 닫기
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isMobile) {
      toggleSidebar();
    }
  };

  // Load draft content from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedContent = localStorage.getItem("draftContent");
      if (savedContent && threadChain[0]?.content === '') {
        setThreadChain([{ content: savedContent, media_urls: [], media_type: 'TEXT' }]);
      }
    } catch (error) {
      console.warn('localStorage access failed:', error);
    }
  }, []);

  // Save draft content to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const content = getContentString(threadChain[0]?.content) || '';
    try {
      if (content) {
        localStorage.setItem("draftContent", content);
      } else {
        localStorage.removeItem("draftContent");
      }
    } catch (error) {
      console.warn('localStorage save failed:', error);
    }
  }, [threadChain]);

  // 컴포넌트 mount 될 때만 자동으로 처음 한번 실행
  useEffect(() => {
    fetchPublishTimes();
    fetchScheduledTimes();
  }, []);

  // publishTimes와 reservedTimes가 모두 있을 때 예약 가능한 시간 찾기
  useEffect(() => {
    // publishTimes와 reservedTimes가 null 또는 undefined일 수 있으므로 확인
    if (publishTimes?.length > 0 && reservedTimes) {
      const nextAvailableTime = findAvailablePublishTime(
        publishTimes,
        reservedTimes
      );
      console.log("nextAvailableTime:", nextAvailableTime);
      setScheduleTime(nextAvailableTime);
    } else {
      setScheduleTime(null); // 데이터가 없으면 null로 설정
    }
  }, [publishTimes, reservedTimes]);



  // Handle pending thread chain from topic finder
  useEffect(() => {
    if (pendingThreadChain && pendingThreadChain.length > 0) {
      applyPendingThreadChain();

      // Open sidebar if on mobile
      if (isMobile && !isRightSidebarOpen) {
        openRightSidebar();
      } else if (!isMobile && isCollapsed) {
        setIsCollapsed(false);
      }
    }
  }, [pendingThreadChain]);




  // 모바일에서 실제 viewport 높이 계산
  useEffect(() => {
    if (!isMobile) return;

    const updateViewportHeight = () => {
      // Visual Viewport API 사용 (지원되는 경우)
      if (window.visualViewport) {
        setMobileViewportHeight(window.visualViewport.height);
      } else {
        // fallback: window.innerHeight 사용
        setMobileViewportHeight(window.innerHeight);
      }
    };

    // 초기 설정
    updateViewportHeight();

    // viewport 변화 감지
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
      }
    };
  }, [isMobile]);


  function findAvailablePublishTime(
    publishTimes: string[],
    reservedTimes: string[]
  ): string | null {
    const now = new Date();
    const reservedSet = new Set(reservedTimes || []);
    console.log("reservedSet:", reservedSet);
    console.log("publishTimes:", publishTimes);

    // 현재 시간 이후의 가장 가까운 예약 가능 시간 찾기
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      // 최대 30일 후까지 검색
      // 각 publishTime에 대해 오늘+dayOffset 날짜에 해당하는 시간 생성
      const datesToCheck = publishTimes
        .map((time) => {
          // HH:MM 형식인지 확인
          if (time.includes("T")) {
            console.log("publishTime에 날짜 정보가 포함되어 있습니다:", time);
            return null; // 잘못된 형식은 건너뜀
          }

          // 시간 문자열 분석 (시간은 DB에 UTC로 저장되어 있음)
          if (!time || typeof time !== 'string') {
            console.error("Invalid time format:", time);
            return null;
          }

          const timeParts = time.split(":");
          if (timeParts.length !== 2) {
            console.error("Invalid time format:", time);
            return null;
          }

          const [utcHours, utcMinutes] = timeParts.map(Number);

          // 현재 날짜 + dayOffset에 해당하는 날짜 생성
          const date = new Date();
          date.setDate(date.getDate() + dayOffset);

          // UTC 시간 설정 (DB에 저장된 시간은 UTC)
          date.setUTCHours(utcHours, utcMinutes, 0, 0);

          return date;
        })
        .filter((date) => date !== null && date > now) // 현재 시간 이후만 필터링
        .sort((a, b) => a!.getTime() - b!.getTime()); // 시간순 정렬

      console.log("availableDates:", datesToCheck);
      const reservedTimestamps = new Set(
        reservedTimes.map((time) => new Date(time).getTime())
      );

      // 각 날짜에 대해 이미 예약된 시간인지 확인
      for (const date of datesToCheck) {
        if (!date) continue;

        const timestamp = date.getTime();
        if (!reservedTimestamps.has(timestamp)) {
          console.log(
            "사용 가능한 시간 찾음:",
            date.toISOString(),
            "로컬 시간:",
            date.toLocaleString()
          );
          return date.toISOString();
        }
      }
    }

    return null; // 가능한 시간 없음
  }

  // Scheule
  // user_profiles 테이블에서 publish_times를 배열로 가져와 publishTimes에 저장
  // 사용자가 설정한 선호 예약시간 가져오기
  const fetchPublishTimes = async () => {
    console.log("[fetchPublishTimes] Current URL:", window.location.href);
    console.log("[fetchPublishTimes] Current pathname:", window.location.pathname);
    console.log("[fetchPublishTimes] Fetching from:", "/api/user/get-publish-times");

    try {
      const response = await debugFetch("/api/user/get-publish-times");
      console.log("[fetchPublishTimes] Response status:", response.status);
      console.log("[fetchPublishTimes] Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error("[fetchPublishTimes] Response not OK:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
      }

      const data = await response.json();
      console.log("publishTimes 함수 내 실행:", data);
      if (data === null) {
        setPublishTimes([]);
      } else {
        setPublishTimes(data);
      }
    } catch (error) {
      console.error("[fetchPublishTimes] Error:", error);
      setPublishTimes([]);
    }
  };

  // publish_status가 scheduled인 포스트들의 시간을 전부 배열로 가져와 reservedTimes에 저장
  // 현재 예약되어있는 시간들 가져오기
  const fetchScheduledTimes = async () => {
    console.log("[fetchScheduledTimes] Current URL:", window.location.href);
    console.log("[fetchScheduledTimes] Fetching from:", "/api/contents/scheduled");

    try {
      const response = await debugFetch("/api/contents/scheduled");
      console.log("[fetchScheduledTimes] Response status:", response.status);
      console.log("[fetchScheduledTimes] Response URL:", response.url);

      const data = await response.json();
      console.log("fetchScheduledTimes 함수 내 실행:", data);
      if (data === null) {
        setReservedTimes([]);
      } else {
        const reservedTimes = data.map(
          (item: { scheduled_at: string }) => item.scheduled_at
        );
        setReservedTimes(reservedTimes);
      }
    } catch (error) {
      console.error("[fetchScheduledTimes] Error:", error);
      setReservedTimes([]);
    }
  };

  // Save Draft
  const handleSaveToDraft = async () => {
    try {
      const { error } = await createContent({
        content: getContentString(threadChain[0]?.content) || '',
        publish_status: "draft",
        social_id: currentSocialId,
        ai_generated: originalAiContent ? originalAiContent : undefined,
      });

      if (error) throw error;

      // DB 저장 성공 시 localStorage 초기화
      localStorage.removeItem("draftContent");
      toast.success(t('draftSaved'));

      // Track content saved
      trackUserAction.contentSaved({
        type: 'draft',
        isAiGenerated: !!originalAiContent,
        threadCount: 1
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error(t('draftSaveFailed'));
    }
  };


  // Check if social account is connected
  const checkSocialAccountConnection = (platforms: PlatformKey[]) => {
    if (platforms.length === 0) return false;
    return ensureAccountsForPlatforms(platforms);
  };

  // Post 예약발행 - Open modal instead of direct scheduling
  const handleSchedule = () => {
    const payloads = buildActivePlatformPayloads();
    if (payloads.length === 0) {
      toast.error(t('noContentToSchedule'));
      return;
    }

    const activePlatformsList = payloads.map(payload => payload.platform);
    if (!checkSocialAccountConnection(activePlatformsList)) {
      return;
    }

    const schedulablePayloads = payloads.filter(payload => SUPPORTED_SCHEDULE_PLATFORMS.includes(payload.platform));
    const unsupported = payloads
      .filter(payload => !SUPPORTED_SCHEDULE_PLATFORMS.includes(payload.platform))
      .map(payload => payload.platform);

    notifyUnsupportedPlatforms(unsupported, 'schedule');

    if (schedulablePayloads.length === 0) {
      toast.error(t('threadsOnlySchedule'));
      return;
    }

    setShowScheduleDialog(true);
  };

  // Handle actual scheduling when time is selected
  const handleConfirmSchedule = async (selectedDateTime: string) => {
    try {
      const payloads = buildActivePlatformPayloads();
      const threadPayload = payloads.find((payload) => payload.platform === 'threads');
      const unsupportedPlatforms = payloads
        .filter((payload) => !SUPPORTED_SCHEDULE_PLATFORMS.includes(payload.platform))
        .map((payload) => payload.platform);

      if (!threadPayload) {
        toast.error(t('threadsScheduleMissing'));
        return;
      }

      const preservedPlatforms: Partial<Record<PlatformKey, ThreadContent[]>> = {};
      unsupportedPlatforms.forEach((platform) => {
        preservedPlatforms[platform] = getThreadsForPlatform(platform);
      });

      const metadata = buildOwnershipMetadataFromThreads(
        threadPayload.threads,
        'schedule',
        selectedDateTime,
      );

      await runOwnershipFlow(metadata, async () => {
        const message =
          threadPayload.threads.length > 1 ? t('threadChainScheduled') : t('postScheduled');
        toast.success(message);

        const result = await scheduleThreadChain(
          threadPayload.threads,
          selectedDateTime,
          originalAiContent,
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        clearThreadChain();
        localStorage.removeItem('draftContent');
        fetchScheduledTimes();
        setScheduleTime(null);

        Object.entries(preservedPlatforms).forEach(([platform, threads]) => {
          if (threads && threads.length > 0) {
            setPlatformThreads(platform as PlatformKey, threads);
          }
        });

        trackUserAction.contentScheduled({
          scheduledTime: selectedDateTime,
          threadCount: threadPayload.threads.length,
          isAiGenerated: !!originalAiContent,
        });
      });
    } catch (error) {
      console.error('Error scheduling:', error);
      toast.error(t('scheduleFailed'));
    }
  };

  // Post 즉시 발행
  const handlePublish = async () => {
    const payloads = buildActivePlatformPayloads();
    if (payloads.length === 0) {
      toast.error(t('noContentToPublish'));
      return;
    }

    const activePlatformsList = payloads.map(payload => payload.platform);
    if (!checkSocialAccountConnection(activePlatformsList)) {
      return;
    }

    const unsupported = payloads
      .filter(payload => !SUPPORTED_IMMEDIATE_PLATFORMS.includes(payload.platform))
      .map(payload => payload.platform);

    notifyUnsupportedPlatforms(unsupported, 'publish');

    const threadPayload = payloads.find(payload => payload.platform === 'threads');
    if (!threadPayload) {
      toast.error(t('threadsOnlyPublish'));
      return;
    }

    const preservedPlatforms: Partial<Record<PlatformKey, ThreadContent[]>> = {};
    unsupported.forEach(platform => {
      preservedPlatforms[platform] = getThreadsForPlatform(platform);
    });

    const farcasterPayload = payloads.find(payload => payload.platform === 'farcaster');
    const xPayload = payloads.find(payload => payload.platform === 'x');

    const metadata = buildOwnershipMetadataFromThreads(threadPayload.threads, 'publish');

    try {
      await runOwnershipFlow(metadata, async () => {
        try {
          const message =
            threadPayload.threads.length > 1 ? t('threadChainPublishing') : t('postPublished');
          toast.success(message);

          clearThreadChain();
          localStorage.removeItem('draftContent');

          const result = await postThreadChain(threadPayload.threads);

          if (!result.success) {
            console.error('❌ Publish error:', result.error);
          } else {
            console.log('✅ Published:', result.threadIds);

            trackUserAction.contentPublished({
              threadCount: threadPayload.threads.length,
              isAiGenerated: !!originalAiContent,
              publishType: 'immediate',
            });

            if (originalAiContent && result.parentThreadId) {
              try {
                const response = await fetch('/api/contents/update-ai-generated', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    parentMediaId: result.parentThreadId,
                    aiGenerated: originalAiContent,
                  }),
                });
                if (!response.ok) {
                  console.error('Failed to update ai_generated field');
                }
              } catch (error) {
                console.error('Error updating ai_generated field:', error);
              }
            }

            if (farcasterPayload) {
              const farcasterResult = await publishToFarcaster(farcasterPayload.threads);
              if (farcasterResult.ok) {
                toast.success(t('farcasterPostSuccess'));
              } else if (farcasterResult.error !== 'EMPTY_CONTENT') {
                toast.error(t('farcasterPostFailure'));
                console.error('Farcaster post failed:', farcasterResult.error);
              }
            }

            if (xPayload) {
              const xResult = await publishToX(xPayload.threads);
              if (xResult.ok) {
                toast.success(t('xPostSuccess'));
              } else if (xResult.error !== 'EMPTY_CONTENT') {
                toast.error(t('xPostFailure'));
                console.error('X post failed:', xResult.error);
              }
            }
          }
        } finally {
          Object.entries(preservedPlatforms).forEach(([platform, threads]) => {
            if (threads && threads.length > 0) {
              setPlatformThreads(platform as PlatformKey, threads);
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ handlePublish error:', error);
    }
  };

  return (
    <>
      {/* 데스크톱 RightSidebar */}
      <div className={cn(
        "bg-muted h-full rounded-l-xl transition-all duration-300 ease-in-out overflow-hidden hidden md:block",
        !isCollapsed ? "w-[380px]" : "w-[50px]",
        className
      )}>
        {isCollapsed ? (
          /* Collapsed state - show only toggle button */
          <div className="flex flex-col h-full p-2 cursor-pointer" onClick={() => setIsCollapsed(false)}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <PanelLeftClose className="h-6 w-6 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <RightSidebarContent
            showAiInput={showAiInput}
            setShowAiInput={setShowAiInput}
            pathname={pathname}
            scheduleTime={scheduleTime}
            handleSaveToDraft={handleSaveToDraft}
            handleSchedule={handleSchedule}
            handlePublish={handlePublish}
            fetchPublishTimes={fetchPublishTimes}
            toggleSidebar={() => setIsCollapsed(true)}
            isMobile={false}
            currentSocialId={currentSocialId}
            getSelectedAccount={getSelectedAccount}
            mobileViewportHeight={mobileViewportHeight}
            // Thread chain props
            threadChain={threadChain}
            addNewThread={addThread}
            removeThread={removeThread}
            updateThreadContent={updateThreadContent}
            updateThreadMedia={updateThreadMedia}
            platformButtons={platformButtons}
            activePlatforms={activePlatforms}
            isUnlinked={isUnlinked}
            selectedPlatform={selectedPlatform}
            onToggleUnlink={handleUnlinkToggle}
            onSelectPlatform={handlePlatformSelect}
            onTogglePlatformActive={handlePlatformToggle}
            platformContents={platformContents}
            onPlatformThreadContentChange={updatePlatformThreadContent}
            onPlatformThreadMediaChange={updatePlatformThreadMedia}
            onPlatformAddThread={addPlatformThread}
            onPlatformRemoveThread={removePlatformThread}
          />
        )}
      </div>

      {/* 모바일 바텀시트 */}
      {isMobile && (
        <>
          {/* 오버레이 */}
          {isRightSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={handleOverlayClick}
            />
          )}

          {/* 바텀시트 */}
          <div
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 transform bg-background transition-transform duration-300 ease-in-out md:hidden",
              "rounded-t-xl border-t shadow-lg",
              isRightSidebarOpen ? "translate-y-0" : "translate-y-full"
            )}
            style={{
              maxHeight: mobileViewportHeight > 0
                ? `${Math.min(mobileViewportHeight * 0.85, mobileViewportHeight - 60)}px`
                : '85dvh'
            }}
          >
            <RightSidebarContent
              showAiInput={showAiInput}
              setShowAiInput={setShowAiInput}
              pathname={pathname}
              scheduleTime={scheduleTime}
              handleSaveToDraft={handleSaveToDraft}
              handleSchedule={handleSchedule}
              handlePublish={handlePublish}
              fetchPublishTimes={fetchPublishTimes}
              toggleSidebar={closeRightSidebar}
              isMobile={true}
              currentSocialId={currentSocialId}
              getSelectedAccount={getSelectedAccount}
              mobileViewportHeight={mobileViewportHeight}
              // Thread chain props
              threadChain={threadChain}
              addNewThread={addThread}
              removeThread={removeThread}
              updateThreadContent={updateThreadContent}
              updateThreadMedia={updateThreadMedia}
              platformButtons={platformButtons}
              activePlatforms={activePlatforms}
              isUnlinked={isUnlinked}
              selectedPlatform={selectedPlatform}
              onToggleUnlink={handleUnlinkToggle}
              onSelectPlatform={handlePlatformSelect}
              onTogglePlatformActive={handlePlatformToggle}
              platformContents={platformContents}
              onPlatformThreadContentChange={updatePlatformThreadContent}
              onPlatformThreadMediaChange={updatePlatformThreadMedia}
              onPlatformAddThread={addPlatformThread}
              onPlatformRemoveThread={removePlatformThread}
            />
          </div>

          {/* 모바일 토글 버튼 (우측 하단) */}
          {!isRightSidebarOpen && (
            <Button
              variant="default"
              size="icon"
              onClick={openRightSidebar}
              className="fixed bottom-5 text-md right-4 z-30 h-fit w-fit py-3.5 px-4 rounded-full shadow-lg flex items-center gap-1.5"
            >
              <Plus className="h-6 w-6 text-white" />
              <span className="text-white">New Post</span>
            </Button>
          )}
        </>
      )}

      {/* Schedule Time Selection Dialog */}
      <SelectPublishTimeDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onConfirm={handleConfirmSchedule}
        currentScheduledTime={scheduleTime}
      />
      <OwnershipModal />
    </>
  );
}

// RightSidebar 콘텐츠 분리 컴포넌트
function RightSidebarContent({
  showAiInput,
  setShowAiInput,
  pathname,
  scheduleTime,
  handleSaveToDraft,
  handleSchedule,
  handlePublish,
  fetchPublishTimes,
  toggleSidebar,
  isMobile,
  currentSocialId,
  getSelectedAccount,
  mobileViewportHeight,
  // Thread chain props
  threadChain,
  addNewThread,
  removeThread,
  updateThreadContent,
  updateThreadMedia,
  platformButtons,
  activePlatforms,
  isUnlinked,
  selectedPlatform,
  onToggleUnlink,
  onSelectPlatform,
  onTogglePlatformActive,
  platformContents,
  onPlatformThreadContentChange,
  onPlatformThreadMediaChange,
  onPlatformAddThread,
  onPlatformRemoveThread,
}: {
  showAiInput: boolean;
  setShowAiInput: (show: boolean) => void;
  pathname: string;
  scheduleTime: string | null;
  handleSaveToDraft: () => void;
  handleSchedule: () => void;
  handlePublish: () => void;
  fetchPublishTimes: () => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  currentSocialId: string;
  getSelectedAccount: () => any;
  mobileViewportHeight: number;
  // Thread chain props
  threadChain: ThreadContent[];
  addNewThread: () => void;
  removeThread: (index: number) => void;
  updateThreadContent: (index: number, content: string) => void;
  updateThreadMedia: (index: number, media_urls: string[]) => void;
  platformButtons: PlatformButtonConfig[];
  activePlatforms: Record<PlatformKey, boolean>;
  isUnlinked: boolean;
  selectedPlatform: PlatformKey;
  onToggleUnlink: () => void;
  onSelectPlatform: (platform: PlatformKey) => void;
  onTogglePlatformActive: (platform: PlatformKey) => void;
  platformContents: Record<PlatformKey, ThreadContent[]>;
  onPlatformThreadContentChange: (platform: PlatformKey, index: number, content: string) => void;
  onPlatformThreadMediaChange: (platform: PlatformKey, index: number, media_urls: string[]) => void;
  onPlatformAddThread: (platform: PlatformKey) => void;
  onPlatformRemoveThread: (platform: PlatformKey, index: number) => void;
}) {
  const t = useTranslations('components.rightSidebar');
  const tNav = useTranslations('navigation');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { generationStatus } = useThreadChainStore();

  const isThinking = typeof generationStatus === 'string' && generationStatus.toLowerCase().includes('thinking');

  // Animated thinking status (cycles every 3s) and dots
  const [animatedStatus, setAnimatedStatus] = useState<string | null>(null);
  const [dots, setDots] = useState<string>('');

  const renderPlatformButton = ({ key, imageSrc, alt }: PlatformButtonConfig) => {
    const isActive = activePlatforms[key];
    const isSelected = selectedPlatform === key && isUnlinked;

    return (
      <div
        key={key}
        className={cn(
          'flex items-center gap-1 rounded-full border px-1 py-0 transition-colors',
          'bg-muted border-border/40',
          !isActive && 'opacity-60'
        )}
      >
        <button
          type="button"
          onClick={() => onSelectPlatform(key)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
            isSelected ? 'border-primary bg-primary/10' : 'border-transparent'
          )}
        >
          <NextImage
            src={imageSrc}
            alt={alt}
            width={24}
            height={24}
            className={cn('h-5 w-5 object-contain', !isActive && 'opacity-50')}
          />
        </button>
        <button
          type="button"
          onClick={() => onTogglePlatformActive(key)}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full bg-muted-foreground/80 text-background transition-colors',
            !isActive && 'bg-muted text-muted-foreground'
          )}
        >
          {isActive ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  };

  const displayedThreads = isUnlinked
    ? platformContents[selectedPlatform] || [{ content: '', media_urls: [], media_type: 'TEXT' }]
    : threadChain;

  const handleThreadContentChange = (index: number, content: string) => {
    if (isUnlinked) {
      onPlatformThreadContentChange(selectedPlatform, index, content);
    } else {
      updateThreadContent(index, content);
    }
  };

  const handleThreadMediaChange = (index: number, media_urls: string[]) => {
    if (isUnlinked) {
      onPlatformThreadMediaChange(selectedPlatform, index, media_urls);
    } else {
      updateThreadMedia(index, media_urls);
    }
  };

  const handleAddThread = () => {
    if (isUnlinked) {
      onPlatformAddThread(selectedPlatform);
    } else {
      addNewThread();
    }
  };

  const handleRemoveThread = (index: number) => {
    if (isUnlinked) {
      onPlatformRemoveThread(selectedPlatform, index);
    } else {
      removeThread(index);
    }
  };

  useEffect(() => {
    let phraseTimer: ReturnType<typeof setInterval> | null = null;
    let dotsTimer: ReturnType<typeof setInterval> | null = null;

    if (isThinking) {
      const phrases = [
        t('thinkingHowToWrite'),
        t('researchingAngles'),
        t('findingRightHook'),
        t('structuringIdeas'),
        t('choosingTheTone'),
      ];
      let idx = 0;
      setAnimatedStatus(phrases[idx]);
      phraseTimer = setInterval(() => {
        idx = (idx + 1) % phrases.length;
        setAnimatedStatus(phrases[idx]);
      }, 5000);
      dotsTimer = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
    } else {
      setAnimatedStatus(null);
      setDots('');
    }

    return () => {
      if (phraseTimer) clearInterval(phraseTimer);
      if (dotsTimer) clearInterval(dotsTimer);
    };
  }, [generationStatus, isThinking, t]);

  const thinkingPlaceholder = isThinking && animatedStatus ? `${animatedStatus}${dots}` : null;

  // Check if any thread exceeds character limit
  const hasCharacterLimitViolation = () => {
    return displayedThreads.some(thread => getContentString(thread.content).length > 500);
  };

  const { profilePictureUrl } = useThreadsProfilePicture(currentSocialId);

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-xl border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-background">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleUnlink}
            className={cn(
              'flex items-center gap-2 rounded-full border p-2 transition-colors',
              'bg-muted border-border/40 text-muted-foreground',
              isUnlinked && 'border-primary bg-primary/10 text-primary'
            )}
          >
            {isUnlinked ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
            {/* <span className="text-xs font-medium uppercase tracking-wide">
              {isUnlinked ? t('unlinkMode') : t('linkMode')}
            </span> */}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {platformButtons.map(renderPlatformButton)}
          </div>
        </div>

        {/* 모바일에서는 아래로 내리기 버튼, 데스크톱에서는 닫기 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 shrink-0 ml-auto"
        >
          {isMobile ? (
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          ) : (
            <PanelRightClose className="h-6 w-6 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 bg-background [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        )}
        style={{
          maxHeight: isMobile && mobileViewportHeight > 0
            ? `${mobileViewportHeight * 0.65}px`
            : isMobile
              ? '65dvh'
              : undefined
        }}
      >
        {/* Thread Chain Section */}
        <div className="space-y-4">
          {/* Always render thread chain */}
          <ThreadChain
            threads={displayedThreads}
            variant="writing"
            avatar={profilePictureUrl || ''}
            username={getSelectedAccount()?.username}
            onThreadContentChange={handleThreadContentChange}
            onThreadMediaChange={handleThreadMediaChange}
            onAddThread={handleAddThread}
            onRemoveThread={handleRemoveThread}
            onAiClick={() => setShowAiInput(!showAiInput)}
            thinkingPlaceholder={thinkingPlaceholder}
          />
          {/* Divider with Text */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-gray-400">{tNav('addContentsFrom')}</span>
            </div>
          </div> */}

          {/* Navigation Buttons */}
          {/* <div className="grid gap-2 grid-cols-3">
            <Link
              href="/contents/topic-finder"
              onClick={() => toggleSidebar()}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl transition-colors",
                pathname === "/contents/topic-finder"
                  ? "bg-gray-300 text-gray-900"
                  : "bg-gray-100 hover:bg-gray-200 text-muted-foreground"
              )}
            >
              <TextSearch className={cn(
                "w-6 h-6 mb-2",
                pathname === "/contents/topic-finder"
                  ? "text-gray-900"
                  : "text-muted-foreground"
              )} />
              <span className="text-xs">{tNav('topicFinder')}</span>
            </Link>
            <Link
              href="/contents/draft"
              onClick={() => toggleSidebar()}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl transition-colors",
                pathname === "/contents/draft"
                  ? "bg-gray-300 text-gray-900"
                  : "bg-gray-100 hover:bg-gray-200 text-muted-foreground"
              )}
            >
              <FileText className={cn(
                "w-6 h-6 mb-2",
                pathname === "/contents/draft"
                  ? "text-gray-900"
                  : "text-muted-foreground"
              )} />
              <span className="text-xs">{tNav('draft')}</span>
            </Link>
            <Link
              href="/contents/saved"
              onClick={() => toggleSidebar()}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl transition-colors",
                pathname === "/contents/saved"
                  ? "bg-gray-300 text-gray-900"
                  : "bg-gray-100 hover:bg-gray-200 text-muted-foreground"
              )}
            >
              <Bookmark className={cn(
                "w-6 h-6 mb-2",
                pathname === "/contents/saved"
                  ? "text-gray-900"
                  : "text-muted-foreground"
              )} />
              <span className="text-xs">{tNav('saved')}</span>
            </Link>

          </div> */}
        </div>
      </div>

      {/* Bottom Buttons - Default */}
      <div className="p-4 space-y-2 border-t bg-background">
        <Button
          variant="outline"
          size="xl"
          className="w-full"
          onClick={() => {
            handleSaveToDraft();
            toggleSidebar();
          }}
          disabled={!displayedThreads.some(thread => getContentString(thread.content).trim() !== '') || hasCharacterLimitViolation()}
        >
          {tNav('saveToDraft')}
        </Button>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 relative">
            <Button
              variant="default"
              size="xl"
              className="!p-0 w-full bg-black text-white hover:bg-black/90 rounded-xl"
              onClick={handleSchedule}
              disabled={!displayedThreads.some(thread => getContentString(thread.content).trim() !== '') || hasCharacterLimitViolation()}
            >
              <div className="flex-col">
                <div>{tNav('schedulePost')}</div>
              </div>
            </Button>
            {/* <div className="absolute right-0 h-full">
              <AutoPublishTimeDialog
                variant="icon"
                onPublishTimeChange={() => fetchPublishTimes()}
                ondisabled={!threadChain.some(thread => getContentString(thread.content).trim() !== '') || hasCharacterLimitViolation()}
              />
            </div> */}
          </div>
          <Button
            variant="default"
            size="xl"
            className="bg-black text-white hover:bg-black/90"
            onClick={handlePublish}
            disabled={!displayedThreads.some(thread => getContentString(thread.content).trim() !== '') || hasCharacterLimitViolation()}
          >
            {tNav('postNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
