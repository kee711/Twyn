-- AI 퇴고 이력 테이블 생성
-- 사용자가 AI 생성 결과물을 어떻게 수정하는지 추적하여 개인화된 AI 모델 학습에 활용

CREATE TABLE IF NOT EXISTS revision_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profiles_id uuid NOT NULL REFERENCES user_profiles(user_profiles_id) ON DELETE CASCADE,
    
    -- 연관된 콘텐츠 정보
    content_id uuid REFERENCES my_contents(id) ON DELETE SET NULL,
    
    -- AI 생성 원본 (최초 결과물)
    ai_generated_content text NOT NULL,
    ai_generated_metadata jsonb DEFAULT '{}'::jsonb,
    
    -- 사용자 최종 수정본 (발행/예약된 최종 산출물)
    user_final_content text NOT NULL,
    user_final_metadata jsonb DEFAULT '{}'::jsonb,
    
    -- 수정 메타데이터
    revision_type text CHECK (revision_type IN ('published', 'scheduled', 'draft')) DEFAULT 'published',
    edit_distance integer, -- 편집 거리 (선택적)
    word_count_diff integer, -- 단어 수 차이
    
    -- AI 생성 시 사용된 파라미터 (추후 모델 개선에 활용)
    generation_params jsonb DEFAULT '{}'::jsonb,
    
    -- 타임스탬프
    ai_generated_at timestamptz NOT NULL DEFAULT now(),
    user_finalized_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- 추가 메타데이터
    notes text, -- 사용자 메모나 추가 정보
    tags text[] DEFAULT '{}' -- 분류를 위한 태그
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_revision_history_user_profiles_id ON revision_history(user_profiles_id);
CREATE INDEX IF NOT EXISTS idx_revision_history_content_id ON revision_history(content_id);
CREATE INDEX IF NOT EXISTS idx_revision_history_created_at ON revision_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revision_history_revision_type ON revision_history(revision_type);
CREATE INDEX IF NOT EXISTS idx_revision_history_user_created ON revision_history(user_profiles_id, created_at DESC);

-- GIN 인덱스 for JSONB 검색
CREATE INDEX IF NOT EXISTS idx_revision_history_ai_metadata ON revision_history USING GIN (ai_generated_metadata);
CREATE INDEX IF NOT EXISTS idx_revision_history_user_metadata ON revision_history USING GIN (user_final_metadata);
CREATE INDEX IF NOT EXISTS idx_revision_history_generation_params ON revision_history USING GIN (generation_params);

-- RLS 정책 설정
ALTER TABLE revision_history ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 퇴고 이력만 조회 가능
CREATE POLICY "Users can view their own revision history" ON revision_history
    FOR SELECT USING (
        user_profiles_id IN (
            SELECT user_profiles_id FROM user_profiles WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- 사용자는 자신의 퇴고 이력만 삽입 가능
CREATE POLICY "Users can insert their own revision history" ON revision_history
    FOR INSERT WITH CHECK (
        user_profiles_id IN (
            SELECT user_profiles_id FROM user_profiles WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- 사용자는 자신의 퇴고 이력만 업데이트 가능
CREATE POLICY "Users can update their own revision history" ON revision_history
    FOR UPDATE USING (
        user_profiles_id IN (
            SELECT user_profiles_id FROM user_profiles WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- 사용자는 자신의 퇴고 이력만 삭제 가능
CREATE POLICY "Users can delete their own revision history" ON revision_history
    FOR DELETE USING (
        user_profiles_id IN (
            SELECT user_profiles_id FROM user_profiles WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- 통계 조회를 위한 뷰 생성 (선택적)
CREATE OR REPLACE VIEW revision_statistics AS
SELECT 
    user_profiles_id,
    COUNT(*) as total_revisions,
    AVG(word_count_diff) as avg_word_count_diff,
    AVG(edit_distance) as avg_edit_distance,
    COUNT(CASE WHEN revision_type = 'published' THEN 1 END) as published_count,
    COUNT(CASE WHEN revision_type = 'scheduled' THEN 1 END) as scheduled_count,
    MIN(created_at) as first_revision_at,
    MAX(created_at) as last_revision_at
FROM revision_history
GROUP BY user_profiles_id;

-- 뷰에도 RLS 적용
ALTER VIEW revision_statistics SET (security_invoker = true);

-- 코멘트 추가
COMMENT ON TABLE revision_history IS 'AI 생성 콘텐츠와 사용자 최종 수정본을 페어로 저장하여 개인화 AI 모델 학습 데이터로 활용';
COMMENT ON COLUMN revision_history.ai_generated_content IS 'AI가 생성한 최초 결과물';
COMMENT ON COLUMN revision_history.user_final_content IS '사용자가 최종 수정하여 발행/예약한 콘텐츠';
COMMENT ON COLUMN revision_history.generation_params IS 'AI 생성 시 사용된 파라미터 (모델명, 온도, 프롬프트 등)';

-- 권한 부여
GRANT ALL ON TABLE revision_history TO anon;
GRANT ALL ON TABLE revision_history TO authenticated;
GRANT ALL ON TABLE revision_history TO service_role;
