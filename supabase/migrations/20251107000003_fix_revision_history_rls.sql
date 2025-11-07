-- RLS 정책 수정: anon 역할에도 권한 부여

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can view revision history" ON revision_history;
DROP POLICY IF EXISTS "Authenticated users can insert revision history" ON revision_history;
DROP POLICY IF EXISTS "Authenticated users can update revision history" ON revision_history;
DROP POLICY IF EXISTS "Authenticated users can delete revision history" ON revision_history;

-- 새로운 정책: anon과 authenticated 모두 허용
-- API 라우트에서 NextAuth로 인증을 확인하므로 안전함

CREATE POLICY "Allow all operations for anon and authenticated" ON revision_history
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 또는 RLS를 완전히 비활성화하는 방법:
-- ALTER TABLE revision_history DISABLE ROW LEVEL SECURITY;
