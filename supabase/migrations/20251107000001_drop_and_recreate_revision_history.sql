-- 기존 revision_history 테이블이 있다면 삭제
DROP TABLE IF EXISTS revision_history CASCADE;
DROP VIEW IF EXISTS revision_statistics CASCADE;

-- AI 퇴고 이력 테이블 생성
CREATE TABLE revision_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profiles_id uuid NOT NULL REFERENCES user_profiles(user_profiles_id) ON DELETE CASCADE,
    
    -- 연관된 콘텐츠 정보 (FK는 나중에 추가)
    content_id uuid,
    
    -- AI 생성 원본 (최초 결과물)
    ai_generated_content text NOT NULL,
    ai_generated_metadata jsonb DEFAULT '{}'::jsonb,
    
    -- 사용자 최종 수정본 (발행/예약된 최종 산출물)
    user_final_content text NOT NULL,
    user_final_metadata jsonb DEFAULT '{}'::jsonb,
    
    -- 수정 메타데이터
    revision_type text CHECK (revision_type IN ('published', 'scheduled', 'draft')) DEFAULT 'published',
    edit_distance integer,
    word_count_diff integer,
    
    -- AI 생성 시 사용된 파라미터
    generation_params jsonb DEFAULT '{}'::jsonb,
    
    -- 타임스탬프
    ai_generated_at timestamptz NOT NULL DEFAULT now(),
    user_finalized_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- 추가 메타데이터
    notes text,
    tags text[] DEFAULT '{}'
);

-- 인덱스 생성
CREATE INDEX idx_revision_history_user_profiles_id ON revision_history(user_profiles_id);
CREATE INDEX idx_revision_history_content_id ON revision_history(content_id);
CREATE INDEX idx_revision_history_created_at ON revision_history(created_at DESC);
CREATE INDEX idx_revision_history_revision_type ON revision_history(revision_type);
CREATE INDEX idx_revision_history_user_created ON revision_history(user_profiles_id, created_at DESC);

-- GIN 인덱스 for JSONB 검색
CREATE INDEX idx_revision_history_ai_metadata ON revision_history USING GIN (ai_generated_metadata);
CREATE INDEX idx_revision_history_user_metadata ON revision_history USING GIN (user_final_metadata);
CREATE INDEX idx_revision_history_generation_params ON revision_history USING GIN (generation_params);

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

-- 통계 조회를 위한 뷰 생성
CREATE VIEW revision_statistics AS
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

-- my_contents FK 추가
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'my_contents' AND column_name = 'my_contents_id'
    ) THEN
        ALTER TABLE revision_history 
        ADD CONSTRAINT fk_revision_history_content 
        FOREIGN KEY (content_id) REFERENCES my_contents(my_contents_id) ON DELETE SET NULL;
    END IF;
END $$;
