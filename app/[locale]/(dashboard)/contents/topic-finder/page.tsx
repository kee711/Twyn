'use client';

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
import { useSession } from 'next-auth/react';
import { PreferenceCard, PreferenceOption } from '@/components/topic-finder/PreferenceCard';
import { CreatePreferenceModal } from '@/components/topic-finder/CreatePreferenceModal';
import { AddOnCard, AddOnOption } from '@/components/topic-finder/AddOnCard';

export default function TopicFinderPage() {
    const t = useTranslations('pages.contents.topicFinder');
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { setPendingThreadChain, setGenerationStatus, setGenerationPreview, clearGenerationPreview, threadChain, setThreadChain, ensureThreadCount, setThreadContentAt } = useThreadChainStore();
    const { openRightSidebar, isRightSidebarOpen } = useMobileSidebar();
    const queryClient = useQueryClient();

    const { data: session } = useSession();
    const userId = session?.user?.id || null;

    const { currentSocialId, currentUsername } = useSocialAccountStore()
    const [selectedHeadline, setSelectedHeadline] = useState<string>('');
    const [givenInstruction, setGivenInstruction] = useState<string>('');
    const [personas, setPersonas] = useState<PreferenceOption[]>([]);
    const [audiences, setAudiences] = useState<PreferenceOption[]>([]);
    const [objectives, setObjectives] = useState<PreferenceOption[]>([]);
    const [addOns, setAddOns] = useState<AddOnOption[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
    const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
    const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [isPreferenceLoading, setIsPreferenceLoading] = useState(false);
    const [modalState, setModalState] = useState<{ type: 'persona' | 'audience' | 'objective' | 'addOn' | null; open: boolean }>({ type: null, open: false });
    const [modalSaving, setModalSaving] = useState(false);
    const { postType, language } = useContentGenerationStore();
    const { setOriginalAiContent } = useAiContentStore();

    // Memoize Supabase client to prevent creating new instances
    const supabase = useMemo(() => createClient(), []);

    const selectedPersona = useMemo(() => personas.find(item => item.id === selectedPersonaId) || null, [personas, selectedPersonaId]);
    const selectedAudience = useMemo(() => audiences.find(item => item.id === selectedAudienceId) || null, [audiences, selectedAudienceId]);
    const selectedObjective = useMemo(() => objectives.find(item => item.id === selectedObjectiveId) || null, [objectives, selectedObjectiveId]);
    const selectedAddOnsList = useMemo(() => addOns.filter(item => selectedAddOnIds.includes(item.id)), [addOns, selectedAddOnIds]);

    const ensurePreference = useCallback(async () => {
        if (!userId) return null;
        if (preferenceId) return preferenceId;

        const { data, error } = await supabase
            .from('topic_finder_preferences')
            .insert({ user_account_id: userId })
            .select('id')
            .single();

        if (error) {
            toast.error('Failed to initialize preferences');
            console.error('Failed to initialize preferences', error);
            return null;
        }

        setPreferenceId(data.id);
        return data.id;
    }, [preferenceId, supabase, userId]);

    const loadPreferenceSelections = useCallback(async () => {
        if (!userId) return;
        setIsPreferenceLoading(true);
        try {
            const { data: preferenceData, error } = await supabase
                .from('topic_finder_preferences')
                .select('id, persona_id, audience_id, objective_id')
                .eq('user_account_id', userId)
                .maybeSingle();

            if (!error && preferenceData) {
                setPreferenceId(preferenceData.id);
                setSelectedPersonaId(preferenceData.persona_id || null);
                setSelectedAudienceId(preferenceData.audience_id || null);
                setSelectedObjectiveId(preferenceData.objective_id || null);

                const { data: addOnSelections, error: addOnError } = await supabase
                    .from('topic_finder_preference_add_ons')
                    .select('add_on_id')
                    .eq('preference_id', preferenceData.id);

                if (!addOnError && addOnSelections) {
                    setSelectedAddOnIds(addOnSelections.map(item => item.add_on_id));
                }
            }
        } catch (error) {
            console.error('Failed to load preferences', error);
        } finally {
            setIsPreferenceLoading(false);
        }
    }, [supabase, userId]);

    const loadPreferenceOptions = useCallback(async () => {
        if (!userId) return;
        try {
            const [personaRes, audienceRes, objectiveRes, addOnRes] = await Promise.all([
                supabase
                    .from('personas')
                    .select('id, name, description, is_public')
                    .or(`is_public.eq.true,user_account_id.eq.${userId}`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('audiences')
                    .select('id, name, description, is_public')
                    .or(`is_public.eq.true,user_account_id.eq.${userId}`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('objectives')
                    .select('id, name, description, is_public')
                    .or(`is_public.eq.true,user_account_id.eq.${userId}`)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('add_ons')
                    .select('id, name, description, is_public')
                    .or(`is_public.eq.true,user_account_id.eq.${userId},user_account_id.is.null`)
                    .order('created_at', { ascending: false }),
            ]);

            if (!personaRes.error && personaRes.data) setPersonas(personaRes.data as PreferenceOption[]);
            if (!audienceRes.error && audienceRes.data) setAudiences(audienceRes.data as PreferenceOption[]);
            if (!objectiveRes.error && objectiveRes.data) setObjectives(objectiveRes.data as PreferenceOption[]);
            if (!addOnRes.error && addOnRes.data) setAddOns(addOnRes.data as AddOnOption[]);

            if (personaRes.error) console.error('Failed to load personas', personaRes.error);
            if (audienceRes.error) console.error('Failed to load audiences', audienceRes.error);
            if (objectiveRes.error) console.error('Failed to load objectives', objectiveRes.error);
            if (addOnRes.error) console.error('Failed to load add-ons', addOnRes.error);
        } catch (error) {
            console.error('Failed to load preference options', error);
        }
    }, [supabase, userId]);

    const contextSummary = useMemo(() => {
        const segments: string[] = [];
        if (selectedPersona) {
            segments.push(`Persona: ${selectedPersona.name}` + (selectedPersona.description ? `\n${selectedPersona.description}` : ''));
        }
        if (selectedAudience) {
            segments.push(`Audience: ${selectedAudience.name}` + (selectedAudience.description ? `\n${selectedAudience.description}` : ''));
        }
        if (selectedObjective) {
            segments.push(`Objective: ${selectedObjective.name}` + (selectedObjective.description ? `\n${selectedObjective.description}` : ''));
        }
        if (selectedAddOnsList.length > 0) {
            const addOnSummary = selectedAddOnsList
                .map(item => `${item.name}${item.description ? ` - ${item.description}` : ''}`)
                .join('\n');
            segments.push(`Add-ons:\n${addOnSummary}`);
        }
        return segments.join('\n\n');
    }, [selectedPersona, selectedAudience, selectedObjective, selectedAddOnsList]);

    const modalConfig = useMemo(() => {
        switch (modalState.type) {
            case 'persona':
                return {
                    title: 'Persona',
                    namePlaceholder: 'e.g. Insightful marketing expert',
                    descriptionPlaceholder: 'Describe the persona voice, experience, and tone.',
                    includePublicToggle: false,
                };
            case 'audience':
                return {
                    title: 'Audience',
                    namePlaceholder: 'e.g. Aspiring SaaS founders',
                    descriptionPlaceholder: 'Who are you writing for? Mention goals, pain points, and preferences.',
                    includePublicToggle: false,
                };
            case 'objective':
                return {
                    title: 'Objective',
                    namePlaceholder: 'e.g. Drive sign-ups for beta launch',
                    descriptionPlaceholder: 'Clarify the campaign goal, CTA, and success metrics.',
                    includePublicToggle: false,
                };
            case 'addOn':
                return {
                    title: 'Add-on',
                    namePlaceholder: 'e.g. Include storytelling hook',
                    descriptionPlaceholder: 'Explain how this add-on should influence the generated content.',
                    includePublicToggle: true,
                };
            default:
                return {
                    title: '',
                    namePlaceholder: '',
                    descriptionPlaceholder: '',
                    includePublicToggle: false,
                };
        }
    }, [modalState.type]);

    const structuredContext = useMemo(() => ({
        persona: selectedPersona ? { id: selectedPersona.id, name: selectedPersona.name, description: selectedPersona.description || '' } : null,
        audience: selectedAudience ? { id: selectedAudience.id, name: selectedAudience.name, description: selectedAudience.description || '' } : null,
        objective: selectedObjective ? { id: selectedObjective.id, name: selectedObjective.name, description: selectedObjective.description || '' } : null,
        addOns: selectedAddOnsList.map(addOn => ({ id: addOn.id, name: addOn.name, description: addOn.description || '' })),
    }), [selectedAddOnsList, selectedAudience, selectedObjective, selectedPersona]);

    const updatePreference = useCallback(
        async (payload: Partial<{ persona_id: string | null; audience_id: string | null; objective_id: string | null }>) => {
            if (!userId) {
                toast.error('Please sign in to manage preferences.');
                return null;
            }
            const id = await ensurePreference();
            if (!id) return null;

            const { data, error } = await supabase
                .from('topic_finder_preferences')
                .update(payload)
                .eq('id', id)
                .select('persona_id, audience_id, objective_id')
                .single();

            if (error) {
                toast.error('Failed to save preference.');
                console.error('Failed to update preferences', error);
                return null;
            }

            if (payload.persona_id !== undefined) setSelectedPersonaId(data.persona_id || null);
            if (payload.audience_id !== undefined) setSelectedAudienceId(data.audience_id || null);
            if (payload.objective_id !== undefined) setSelectedObjectiveId(data.objective_id || null);

            return data;
        },
        [ensurePreference, supabase, userId]
    );

    const handlePersonaSelect = useCallback(
        async (option: PreferenceOption) => {
            setIsPreferenceLoading(true);
            try {
                await updatePreference({ persona_id: option.id });
            } finally {
                setIsPreferenceLoading(false);
            }
        },
        [updatePreference]
    );

    const handleAudienceSelect = useCallback(
        async (option: PreferenceOption) => {
            setIsPreferenceLoading(true);
            try {
                await updatePreference({ audience_id: option.id });
            } finally {
                setIsPreferenceLoading(false);
            }
        },
        [updatePreference]
    );

    const handleObjectiveSelect = useCallback(
        async (option: PreferenceOption) => {
            setIsPreferenceLoading(true);
            try {
                await updatePreference({ objective_id: option.id });
            } finally {
                setIsPreferenceLoading(false);
            }
        },
        [updatePreference]
    );

    const handleToggleAddOn = useCallback(
        async (option: AddOnOption) => {
            if (!userId) {
                toast.error('Please sign in to manage preferences.');
                return;
            }
            const id = await ensurePreference();
            if (!id) return;

            const isActive = selectedAddOnIds.includes(option.id);
            setIsPreferenceLoading(true);
            try {
                if (isActive) {
                    const { error } = await supabase
                        .from('topic_finder_preference_add_ons')
                        .delete()
                        .eq('preference_id', id)
                        .eq('add_on_id', option.id);
                    if (error) {
                        toast.error('Failed to remove add-on.');
                        console.error('Failed to remove add-on', error);
                        return;
                    }
                    setSelectedAddOnIds(prev => prev.filter(addOnId => addOnId !== option.id));
                } else {
                    const { error } = await supabase
                        .from('topic_finder_preference_add_ons')
                        .upsert({ preference_id: id, add_on_id: option.id, last_selected_at: new Date().toISOString() }, { onConflict: 'preference_id,add_on_id' });
                    if (error) {
                        toast.error('Failed to add add-on.');
                        console.error('Failed to add add-on', error);
                        return;
                    }
                    setSelectedAddOnIds(prev => [...prev, option.id]);
                }
            } finally {
                setIsPreferenceLoading(false);
            }
        },
        [ensurePreference, selectedAddOnIds, supabase, userId]
    );

    const openCreateModal = useCallback((type: 'persona' | 'audience' | 'objective' | 'addOn') => {
        setModalState({ type, open: true });
    }, []);

    const closeCreateModal = useCallback(() => {
        setModalState({ type: null, open: false });
    }, []);

    const handleCreatePreferenceItem = useCallback(
        async ({ name, description, isPublic }: { name: string; description: string; isPublic?: boolean }) => {
            if (!modalState.type || !userId) {
                toast.error('Please sign in to manage preferences.');
                return;
            }

            const tableMap = {
                persona: 'personas',
                audience: 'audiences',
                objective: 'objectives',
                addOn: 'add_ons'
            } as const;

            const titleMap = {
                persona: 'Persona',
                audience: 'Audience',
                objective: 'Objective',
                addOn: 'Add-on'
            } as const;

            const table = tableMap[modalState.type];
            setModalSaving(true);

            try {
                const payload: Record<string, any> = {
                    name,
                    description: description || null,
                    user_account_id: userId,
                };

                if (modalState.type === 'addOn') {
                    payload.is_public = !!isPublic;
                } else {
                    payload.is_public = false;
                }

                const { data, error } = await supabase
                    .from(table)
                    .insert(payload)
                    .select('id, name, description, is_public')
                    .single();

                if (error) {
                    throw error;
                }

                if (modalState.type === 'persona') {
                    setPersonas(prev => [data as PreferenceOption, ...prev]);
                    await handlePersonaSelect(data as PreferenceOption);
                } else if (modalState.type === 'audience') {
                    setAudiences(prev => [data as PreferenceOption, ...prev]);
                    await handleAudienceSelect(data as PreferenceOption);
                } else if (modalState.type === 'objective') {
                    setObjectives(prev => [data as PreferenceOption, ...prev]);
                    await handleObjectiveSelect(data as PreferenceOption);
                } else if (modalState.type === 'addOn') {
                    setAddOns(prev => [data as AddOnOption, ...prev]);
                    await handleToggleAddOn(data as AddOnOption);
                }

                toast.success(`${titleMap[modalState.type]} created.`);
                closeCreateModal();
            } catch (error) {
                console.error('Failed to create preference item', error);
                toast.error('Failed to create item.');
            } finally {
                setModalSaving(false);
            }
        },
        [closeCreateModal, handleAudienceSelect, handleObjectiveSelect, handlePersonaSelect, handleToggleAddOn, modalState.type, supabase, userId]
    );

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

    useEffect(() => {
        if (!userId) return;
        loadPreferenceOptions();
    }, [userId, loadPreferenceOptions]);

    useEffect(() => {
        if (!userId) return;
        loadPreferenceSelections();
    }, [userId, loadPreferenceSelections]);

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
        if (!selectedPersona || !selectedAudience || !selectedObjective) {
            toast.error('Select persona, audience, and objective first.');
            return;
        }

        const contextInfo = contextSummary.trim();
        if (!contextInfo) {
            toast.error('Please provide context before generating.');
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
                    accountInfo: contextInfo,
                    topic: headline,
                    instruction: givenInstruction,
                    postType,
                    language,
                    context: structuredContext
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
        if (!selectedPersona || !selectedAudience || !selectedObjective) {
            toast.error('Select persona, audience, and objective first.');
            return;
        }

        if (!contextSummary.trim()) {
            toast.error('Please provide context before generating topics.');
            return;
        }
        setIsGeneratingTopics(true);
        setIsLoading(true);
        try {
            const res = await fetch('/api/generate-topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona: structuredContext.persona,
                    audience: structuredContext.audience,
                    objective: structuredContext.objective,
                    addOns: structuredContext.addOns,
                    contextSummary,
                    language
                })
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
                    <div className="font-headline px-6 mb-6 md:px-4 text-center">
                        <div className="flex flex-row items-center justify-center gap-2 mb-1">
                            {/* 프로필 이미지 - 동적으로 가져오기 */}
                            {mounted && (
                                <ThreadsProfilePicture
                                    socialId={currentSocialId}
                                    alt="Profile picture"
                                    className="w-8 h-8 rounded-full"
                                />
                            )}
                            <h2 className="text-xl md:text-2xl font-medium text-center">
                                {t('greeting', { username: mounted ? (currentUsername || t('defaultUser')) : t('defaultUser') })}
                            </h2>
                        </div>
                        <h2 className="text-xl md:text-2xl font-medium text-center md:text-left whitespace-normal break-keep">{t('question')}</h2>
                    </div>
                    {/* Headline 입력 및 태그 */}
                    <div className="w-full max-w-3xl space-y-3">
                        <div className="grid w-full grid-cols-4 gap-2 md:grid-cols-2 xl:grid-cols-4">
                            <PreferenceCard
                                title="Persona"
                                options={personas}
                                selectedId={selectedPersonaId}
                                onSelect={handlePersonaSelect}
                                onCreateNew={() => openCreateModal('persona')}
                                placeholder="Select persona"
                                disabled={!userId}
                                loading={isPreferenceLoading && personas.length === 0}
                            />
                            <PreferenceCard
                                title="Audience"
                                options={audiences}
                                selectedId={selectedAudienceId}
                                onSelect={handleAudienceSelect}
                                onCreateNew={() => openCreateModal('audience')}
                                placeholder="Select audience"
                                disabled={!userId}
                                loading={isPreferenceLoading && audiences.length === 0}
                            />
                            <PreferenceCard
                                title="Objective"
                                options={objectives}
                                selectedId={selectedObjectiveId}
                                onSelect={handleObjectiveSelect}
                                onCreateNew={() => openCreateModal('objective')}
                                placeholder="Select objective"
                                disabled={!userId}
                                loading={isPreferenceLoading && objectives.length === 0}
                            />
                            <AddOnCard
                                options={addOns}
                                selectedIds={selectedAddOnIds}
                                onToggle={handleToggleAddOn}
                                onCreateNew={() => openCreateModal('addOn')}
                                disabled={!userId}
                                loading={isPreferenceLoading && addOns.length === 0}
                            />
                        </div>
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
                    <CreatePreferenceModal
                        open={modalState.open}
                        title={modalConfig.title}
                        onOpenChange={open => {
                            if (!open) {
                                closeCreateModal();
                            }
                        }}
                        onSave={handleCreatePreferenceItem}
                        loading={modalSaving}
                        includePublicToggle={modalConfig.includePublicToggle}
                        namePlaceholder={modalConfig.namePlaceholder}
                        descriptionPlaceholder={modalConfig.descriptionPlaceholder}
                    />
                </div>
            </div>
        </div>
    );
}
