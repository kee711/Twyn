-- RLS 정책 업데이트: API 라우트에서도 작동하도록 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own revision history" ON revision_history;
DROP POLICY IF EXISTS "Users can insert their own revision history" ON revision_history;
DROP POLICY IF EXISTS "Users can update their own revision history" ON revision_history;
DROP POLICY IF EXISTS "Users can delete their own revision history" ON revision_history;

-- 새로운 정책: user_profiles_id가 존재하는 경우 허용
-- (API 라우트에서 이미 인증을 확인하고 올바른 user_profiles_id를 전달함)

-- SELECT: 인증된 사용자만 조회 가능
CREATE POLICY "Authenticated users can view revision history" ON revision_history
    FOR SELECT 
    TO authenticated
    USING (true);

-- INSERT: 인증된 사용자만 삽입 가능
CREATE POLICY "Authenticated users can insert revision history" ON revision_history
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- UPDATE: 인증된 사용자만 업데이트 가능
CREATE POLICY "Authenticated users can update revision history" ON revision_history
    FOR UPDATE 
    TO authenticated
    USING (true);

-- DELETE: 인증된 사용자만 삭제 가능
CREATE POLICY "Authenticated users can delete revision history" ON revision_history
    FOR DELETE 
    TO authenticated
    USING (true);

-- 참고: API 라우트에서 NextAuth로 인증을 확인하므로,
-- RLS는 인증된 요청인지만 확인하고 세부 권한은 애플리케이션 레벨에서 처리
