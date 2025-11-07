// AI 퇴고 이력 타입 정의

export type RevisionType = 'published' | 'scheduled' | 'draft';

export interface RevisionMetadata {
    platform?: string; // 'threads', 'x', 'farcaster' etc.
    category?: string;
    sentiment?: string;
    language?: string;
    [key: string]: any;
}

export interface GenerationParams {
    model?: string;
    temperature?: number;
    prompt?: string;
    persona_id?: string;
    audience_id?: string;
    objective_id?: string;
    [key: string]: any;
}

export interface RevisionHistory {
    id: string;
    user_profiles_id: string; // uuid type - references user_profiles(user_profiles_id)
    content_id?: string;

    // AI 생성 원본
    ai_generated_content: string;
    ai_generated_metadata?: RevisionMetadata;

    // 사용자 최종본
    user_final_content: string;
    user_final_metadata?: RevisionMetadata;

    // 메타데이터
    revision_type: RevisionType;
    edit_distance?: number;
    word_count_diff?: number;
    generation_params?: GenerationParams;

    // 타임스탬프
    ai_generated_at: string;
    user_finalized_at: string;
    created_at: string;

    // 추가 정보
    notes?: string;
    tags?: string[];
}

export interface CreateRevisionHistoryInput {
    user_profiles_id?: string; // Optional - will be fetched if not provided
    content_id?: string;
    ai_generated_content: string;
    ai_generated_metadata?: RevisionMetadata;
    user_final_content: string;
    user_final_metadata?: RevisionMetadata;
    revision_type?: RevisionType;
    generation_params?: GenerationParams;
    notes?: string;
    tags?: string[];
}

export interface RevisionStatistics {
    user_profiles_id: string;
    total_revisions: number;
    avg_word_count_diff: number;
    avg_edit_distance: number;
    published_count: number;
    scheduled_count: number;
    first_revision_at: string;
    last_revision_at: string;
}
