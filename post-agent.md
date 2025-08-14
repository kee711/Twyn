# Post Generator Agent PRD

## 1. 개요
Post Generator Agent는 사용자가 지정한 설정에 따라 자동 또는 수동으로 Threads용 게시물을 생성, 편집, 확정, 스케줄링하는 AI Agent입니다.  
Next.js(App Router) + Tailwind CSS + shadcn UI를 사용하며, AI 생성 로직은 `ai-sdk v5` 기반으로 구현됩니다.  
초안 상태 및 변경(diff) 데이터는 Supabase 테이블에 저장합니다.

---

## 2. 주요 목표
1. **자동/수동 게시물 생성**  
   - 주제 생성 → 사용자 선택 → 도구 기반 AI 생성 → 초안 저장 → 편집/확정 → 스케줄링
2. **에이전트 설정 UI 제공**  
   - Agents 페이지에서 자동 생성 관련 토글 설정 가능
3. **포스트 리스트 & 수정 인터페이스**  
   - 생성된 게시물 목록 출력
   - 클릭 시 Right Sidebar에서 수정 가능
4. **도구 기반 생성 품질 강화**  
   - Web search, Template Chooser, My previous posts, Hook generator 등 모듈화된 Tool 사용

---

## 3. 작동 흐름

### 3.1 Flow
1. **Trigger**  
   - Manual 클릭  
   - Scheduler 자동 실행 토글 (현재 돌아가는 cron 코드 기반으로 돌아갈 수 있도록 한다)
     - 자동 실행이 활성화돼있다면, account마다 설정되어있는 시간에 cron에 의해 agent가 자동 실행될 수 있도록 trigger 한다. 모든 계정들의 agent 실행 default 시간은 10pm이고, 이 시간은 사용자에 의해 변경 가능하다.
2. **Topic Generator (LLM)**  
   - LLM이 다수의 토픽 생성
3. **사용자 선택 or 자동 선택**  
   - `Handpick topic` → `Generate post` 클릭  
   - 또는 자동 선택 옵션 활성 시 바로 Tool call
4. **Tool call**  
   - Web search (소재·세부내용)  
   - Template Chooser (형식 규칙 선택)  
   - My previous posts (기존 Threads 데이터 활용)  
   - Hook generator / Quality enhancer
5. **AI post draft 생성**
6. **알림 발송**  
   - Email / Slack notification (현재 Slack은 주석 처리, 추후 MCP + API route로 연결 예정)
7. **사용자 편집 & 확정**  
   - UI에서 실시간 편집  
   - `Confirm` 버튼 클릭 시 최종 확정
8. **저장**  
   - 초안 상태 저장 (`save state`)  
   - 확정본과 비교 후 diff 저장 (`Save Diff`)
9. **스케줄러 등록**  
   - 확정된 게시물 스케줄링 처리

---

## 4. UI/UX 구조

### 4.1 Sidebar - Agents 페이지
- **토글 옵션**
  1. 포스트 자동 생성 활성화
  2. 토픽 자동 선택 활성화
  3. 자동 Confirm 활성화
- 에이전트 설명/가이드 툴팁

### 4.2 Main Content
- 생성된 게시물 리스트
- 각 게시물 카드: 제목, 생성일, 상태 표시 (Draft / Confirmed / Scheduled)

### 4.3 Right Sidebar (Post Editor)
- 선택한 게시물 내용 표시
- 실시간 수정 가능
- `Confirm` 버튼
- 변경사항 자동 diff 저장

---

## 5. Tools 상세

### 5.1 Web search
- 소재와 세부 내용을 수집
- API 기반 검색 결과 요약 후 AI 입력

### 5.2 Template Chooser
- 사전 정의된 3개 템플릿 중 하나를 선택
- 각 템플릿은 형식 규칙에 따라 작성
#### 형식 규칙 예시:
1) 첫 줄: 제목(굵게 처리 지시 없이 평문)  
2) 다음 2~3줄: 강한 훅(공감+문제 인식)  
3) 번호형 리스트 {{items_count}}개  
   - 각 번호는 2줄 구조:  
     ① 한 줄 결론(핵심 조언을 명사/동사로 단단하게)  
     ② 실행 팁(바로 적용 가능한 행동 1~2개, 도구/예시 포함 가능)  
4) 마무리: {{cta_style}} 한 줄  
5) 해시태그: 값이 있을 때만 마지막 줄에 출력  
6) 문단은 1~2줄 단위, 군더더기·과장 금지, 구체 예시 선호

### 5.3 My previous posts
- 기존 Threads API 통계 코드 재활용
- 과거 게시물 문체·주제 참고

### 5.4 Hook generator / Quality enhancer
- 훅 문장 생성, 글의 문체·가독성 향상

---

## 6. 데이터베이스 (Supabase)

### 6.1 테이블: `post_diffs`
| 컬럼명        | 타입        | 설명 |
|--------------|------------|------|
| id           | uuid (PK)  | Diff ID |
| draft_content| text       | AI 생성 초안 |
| final_content| text       | 최종 확정 내용 |
| diff_content | jsonb      | 변경된 부분 기록 |
| created_at   | timestamp  | 생성일 |

---

## 7. AI 구현 (ai-sdk v5)
- **모델**: OpenAI GPT-4o / gpt-4o-mini 선택
- **stopWhen**: Tool call이 완료될 때 또는 설정된 단계 수 초과 시 중단
- **prepareStep**: 각 Tool 실행 전 파라미터 세팅
- **Tool 연결**:
  - web-search
  - template-chooser
  - my-previous-posts
  - hook-generator

---

## 8. 향후 확장 계획
- Slack notification → MCP 연결 후 `/api/slack-notify` route 추가
- Template Chooser에 템플릿 추가
- Agent 설정값 Supabase에 저장 후 UI 반영
- AI tone/style 프리셋 설정 기능 추가

---

## 9. 페이지 구조 (Next.js App Router)
/app
├─ /agents
│   ├─ page.tsx           # Agents 페이지
│   ├─ components
│   │   ├─ AgentSettings.tsx
│   │   ├─ PostList.tsx
│   │   ├─ RightSidebarEditor.tsx
│   └─ actions
│       ├─ generatePost.ts
│       ├─ saveDraft.ts
│       ├─ confirmPost.ts
│       ├─ saveDiff.ts
│       ├─ getPosts.ts
├─ /api
│   ├─ /ai-agent
│   │   ├─ topic-generator.ts
│   │   ├─ run-tools.ts
│   ├─ /slack-notify (주석처리)

---

## 10. 권한 & 인증
- Next auth로 로그인한 사용자만 접근
- 작성/수정 권한은 작성자 본인에게만 허용