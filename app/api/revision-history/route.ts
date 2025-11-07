import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    console.log('📝 [API /revision-history] POST request received');

    try {
        // NextAuth 세션 확인
        console.log('📝 [API /revision-history] Getting NextAuth session...');
        const session = await getServerSession(authOptions);
        console.log('📝 [API /revision-history] Session check:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id
        });

        if (!session?.user?.id) {
            console.error('❌ [API /revision-history] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('📝 [API /revision-history] Request body:', {
            hasContentId: !!body.contentId,
            contentId: body.contentId,
            aiContentLength: body.aiContent?.length,
            finalContentLength: body.finalContent?.length,
            isScheduled: body.isScheduled
        });

        const {
            contentId,
            aiContent,
            finalContent,
            isScheduled,
            generationParams,
            metadata
        } = body;

        // 서버 사이드 Supabase 클라이언트 생성
        console.log('📝 [API /revision-history] Creating Supabase server client...');
        const supabase = await createClient();
        const userId = session.user.id;

        // user_profiles에서 user_profiles_id 조회
        console.log('📝 [API /revision-history] Querying user_profiles with userId:', userId);
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_profiles_id')
            .eq('user_id', userId)
            .single();

        console.log('📝 [API /revision-history] Profile query result:', {
            hasProfile: !!profile,
            userProfilesId: profile?.user_profiles_id,
            hasError: !!profileError,
            error: profileError?.message,
            errorCode: profileError?.code
        });

        if (profileError || !profile) {
            console.error('❌ [API /revision-history] User profile not found');
            return NextResponse.json(
                { error: 'User profile not found', details: profileError?.message },
                { status: 404 }
            );
        }

        // 편집 거리 계산
        const calculateEditDistance = (str1: string, str2: string): number => {
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
        };

        // 단어 수 차이 계산
        const calculateWordCountDiff = (str1: string, str2: string): number => {
            const count1 = str1.trim().split(/\s+/).length;
            const count2 = str2.trim().split(/\s+/).length;
            return count2 - count1;
        };

        const edit_distance = calculateEditDistance(aiContent, finalContent);
        const word_count_diff = calculateWordCountDiff(aiContent, finalContent);

        console.log('📝 [API /revision-history] Calculated metrics:', {
            edit_distance,
            word_count_diff
        });

        // content_id가 임시 ID인지 확인 (temp_로 시작하면 임시 ID)
        const isValidUuid = contentId && !contentId.startsWith('temp_');
        const validContentId = isValidUuid ? contentId : null;

        console.log('📝 [API /revision-history] Content ID validation:', {
            originalContentId: contentId,
            isValidUuid,
            validContentId
        });

        // revision_history 테이블에 삽입
        console.log('📝 [API /revision-history] Inserting into revision_history...');
        const { data: revision, error: insertError } = await supabase
            .from('revision_history')
            .insert({
                user_profiles_id: profile.user_profiles_id,
                content_id: validContentId,
                ai_generated_content: aiContent,
                ai_generated_metadata: metadata || {},
                user_final_content: finalContent,
                user_final_metadata: metadata || {},
                revision_type: isScheduled ? 'scheduled' : 'published',
                edit_distance,
                word_count_diff,
                generation_params: generationParams || {},
                tags: []
            })
            .select()
            .single();

        if (insertError) {
            console.error('❌ [API /revision-history] Insert error:', {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details
            });
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        console.log('✅ [API /revision-history] Successfully saved:', {
            id: revision.id,
            user_profiles_id: revision.user_profiles_id
        });

        return NextResponse.json({
            success: true,
            data: revision
        });

    } catch (error) {
        console.error('❌ [API /revision-history] Unexpected error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
