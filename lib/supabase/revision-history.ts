// AI 퇴고 이력 관리 유틸리티

import { createClient } from '@/utils/supabase/client';
import type {
    RevisionHistory,
    CreateRevisionHistoryInput,
    RevisionStatistics,
    RevisionType
} from '@/types/revision-history';

/**
 * 편집 거리 계산 (Levenshtein Distance)
 */
function calculateEditDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const dp: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + 1
                );
            }
        }
    }

    return dp[len1][len2];
}

/**
 * 단어 수 차이 계산
 */
function calculateWordCountDiff(str1: string, str2: string): number {
    const count1 = str1.trim().split(/\s+/).length;
    const count2 = str2.trim().split(/\s+/).length;
    return count2 - count1;
}

/**
 * 현재 사용자의 user_profiles_id 가져오기
 */
async function getUserProfileId(): Promise<{ id: string | null; error: Error | null }> {
    console.log('👤 [getUserProfileId] Starting...');
    const supabase = createClient();

    console.log('👤 [getUserProfileId] Getting session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('👤 [getUserProfileId] Session result:', {
        hasSession: !!session,
        userId: session?.user?.id,
        hasError: !!sessionError,
        error: sessionError?.message
    });

    if (sessionError || !session?.user) {
        console.error('❌ [getUserProfileId] No active session');
        return { id: null, error: new Error('User not authenticated') };
    }

    const userId = session.user.id;
    console.log('👤 [getUserProfileId] Querying user_profiles table with user_id:', userId);

    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_profiles_id')
        .eq('user_id', userId)
        .single();

    console.log('👤 [getUserProfileId] Profile query result:', {
        hasProfile: !!profile,
        userProfilesId: profile?.user_profiles_id,
        hasError: !!profileError,
        error: profileError?.message,
        errorCode: profileError?.code,
        errorDetails: profileError?.details
    });

    if (profileError || !profile) {
        console.error('❌ [getUserProfileId] User profile not found');
        return { id: null, error: new Error('User profile not found') };
    }

    console.log('✅ [getUserProfileId] Success:', profile.user_profiles_id);
    return { id: profile.user_profiles_id, error: null };
}

/**
 * 퇴고 이력 생성
 */
export async function createRevisionHistory(
    input: CreateRevisionHistoryInput
): Promise<{ data: RevisionHistory | null; error: Error | null }> {
    console.log('🔧 [createRevisionHistory] Starting with input:', {
        hasUserProfilesId: !!input.user_profiles_id,
        userProfilesId: input.user_profiles_id,
        hasContentId: !!input.content_id,
        contentId: input.content_id,
        aiContentLength: input.ai_generated_content?.length,
        finalContentLength: input.user_final_content?.length,
        revisionType: input.revision_type
    });

    try {
        console.log('🔧 [createRevisionHistory] Creating Supabase client...');
        const supabase = createClient();

        let userProfilesId = input.user_profiles_id;

        // user_profiles_id가 제공되지 않은 경우에만 조회
        if (!userProfilesId) {
            console.log('🔧 [createRevisionHistory] user_profiles_id not provided, fetching...');
            const { id, error: profileError } = await getUserProfileId();
            console.log('🔧 [createRevisionHistory] User profile result:', {
                userProfilesId: id,
                hasError: !!profileError,
                error: profileError?.message
            });

            if (profileError || !id) {
                console.error('❌ [createRevisionHistory] Failed to get user profile:', profileError);
                return { data: null, error: profileError || new Error('Failed to get user profile') };
            }
            userProfilesId = id;
        } else {
            console.log('🔧 [createRevisionHistory] Using provided user_profiles_id:', userProfilesId);
        }

        // 편집 거리와 단어 수 차이 자동 계산
        console.log('🔧 [createRevisionHistory] Calculating edit distance and word count diff...');
        const edit_distance = calculateEditDistance(
            input.ai_generated_content,
            input.user_final_content
        );
        const word_count_diff = calculateWordCountDiff(
            input.ai_generated_content,
            input.user_final_content
        );
        console.log('🔧 [createRevisionHistory] Metrics:', { edit_distance, word_count_diff });

        const insertData = {
            user_profiles_id: userProfilesId,
            content_id: input.content_id,
            ai_generated_content: input.ai_generated_content,
            ai_generated_metadata: input.ai_generated_metadata || {},
            user_final_content: input.user_final_content,
            user_final_metadata: input.user_final_metadata || {},
            revision_type: input.revision_type || 'published',
            edit_distance,
            word_count_diff,
            generation_params: input.generation_params || {},
            notes: input.notes,
            tags: input.tags || []
        };

        console.log('🔧 [createRevisionHistory] Inserting data:', {
            user_profiles_id: insertData.user_profiles_id,
            content_id: insertData.content_id,
            revision_type: insertData.revision_type,
            edit_distance: insertData.edit_distance,
            word_count_diff: insertData.word_count_diff
        });

        const { data, error } = await supabase
            .from('revision_history')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('❌ [createRevisionHistory] Supabase insert error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            return { data: null, error };
        }

        console.log('✅ [createRevisionHistory] Successfully inserted:', {
            id: data.id,
            user_profiles_id: data.user_profiles_id
        });
        return { data, error: null };
    } catch (error) {
        console.error('❌ [createRevisionHistory] Exception:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return { data: null, error: error as Error };
    }
}

/**
 * 퇴고 이력 조회 (페이지네이션)
 */
export async function getRevisionHistory(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
        revision_type?: RevisionType;
        content_id?: string;
        tags?: string[];
    }
): Promise<{ data: RevisionHistory[] | null; error: Error | null; count: number }> {
    try {
        const supabase = createClient();

        // user_profiles_id 가져오기
        const { id: userProfilesId, error: profileError } = await getUserProfileId();
        if (profileError || !userProfilesId) {
            return { data: null, error: profileError || new Error('Failed to get user profile'), count: 0 };
        }

        let query = supabase
            .from('revision_history')
            .select('*', { count: 'exact' })
            .eq('user_profiles_id', userProfilesId)
            .order('created_at', { ascending: false });

        // 필터 적용
        if (filters?.revision_type) {
            query = query.eq('revision_type', filters.revision_type);
        }
        if (filters?.content_id) {
            query = query.eq('content_id', filters.content_id);
        }
        if (filters?.tags && filters.tags.length > 0) {
            query = query.contains('tags', filters.tags);
        }

        // 페이지네이션
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            return { data: null, error, count: 0 };
        }

        return { data, error: null, count: count || 0 };
    } catch (error) {
        return { data: null, error: error as Error, count: 0 };
    }
}

/**
 * 특정 퇴고 이력 조회
 */
export async function getRevisionById(
    id: string
): Promise<{ data: RevisionHistory | null; error: Error | null }> {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('revision_history')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
}

/**
 * 퇴고 이력 업데이트
 */
export async function updateRevisionHistory(
    id: string,
    updates: Partial<CreateRevisionHistoryInput>
): Promise<{ data: RevisionHistory | null; error: Error | null }> {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('revision_history')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
}

/**
 * 퇴고 이력 삭제
 */
export async function deleteRevisionHistory(
    id: string
): Promise<{ error: Error | null }> {
    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('revision_history')
            .delete()
            .eq('id', id);

        if (error) {
            return { error };
        }

        return { error: null };
    } catch (error) {
        return { error: error as Error };
    }
}

/**
 * 사용자 퇴고 통계 조회
 */
export async function getRevisionStatistics(): Promise<{
    data: RevisionStatistics | null;
    error: Error | null;
}> {
    try {
        const supabase = createClient();

        // user_profiles_id 가져오기
        const { id: userProfilesId, error: profileError } = await getUserProfileId();
        if (profileError || !userProfilesId) {
            return { data: null, error: profileError || new Error('Failed to get user profile') };
        }

        const { data, error } = await supabase
            .from('revision_statistics')
            .select('*')
            .eq('user_profiles_id', userProfilesId)
            .single();

        if (error) {
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
}

/**
 * 콘텐츠 발행/예약 시 자동으로 퇴고 이력 저장
 */
export async function saveRevisionOnPublish(params: {
    userProfilesId?: string;
    contentId?: string;
    aiContent: string;
    finalContent: string;
    isScheduled: boolean;
    generationParams?: any;
    metadata?: any;
}): Promise<{ success: boolean; error?: Error }> {
    console.log('📝 [saveRevisionOnPublish] Called with params:', {
        hasUserProfilesId: !!params.userProfilesId,
        userProfilesId: params.userProfilesId,
        contentId: params.contentId,
        aiContentLength: params.aiContent?.length,
        finalContentLength: params.finalContent?.length,
        isScheduled: params.isScheduled,
        hasGenerationParams: !!params.generationParams,
        hasMetadata: !!params.metadata
    });

    console.log('📝 [saveRevisionOnPublish] Calling createRevisionHistory...');
    const { data, error } = await createRevisionHistory({
        user_profiles_id: params.userProfilesId,
        content_id: params.contentId,
        ai_generated_content: params.aiContent,
        user_final_content: params.finalContent,
        revision_type: params.isScheduled ? 'scheduled' : 'published',
        generation_params: params.generationParams,
        ai_generated_metadata: params.metadata,
        user_final_metadata: params.metadata
    });

    if (error) {
        console.error('❌ [saveRevisionOnPublish] Failed to save revision history:', error);
        return { success: false, error };
    }

    console.log('✅ [saveRevisionOnPublish] Successfully saved revision history:', {
        revisionId: data?.id,
        userProfilesId: data?.user_profiles_id
    });
    return { success: true };
}
