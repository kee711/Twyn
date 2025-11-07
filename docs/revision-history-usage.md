# AI 퇴고 이력 관리 (Revision History)

## 개요

사용자가 AI로 생성한 콘텐츠를 어떻게 수정하는지 추적하여, 추후 개인화된 AI 모델 학습 데이터로 활용하기 위한 기능입니다.

## 데이터베이스 스키마

### revision_history 테이블

- **id**: UUID (Primary Key)
- **user_id**: UUID (FK to auth.users) - RLS로 보호
- **content_id**: UUID (FK to my_contents, nullable)
- **ai_generated_content**: text - AI가 생성한 최초 결과물
- **ai_generated_metadata**: jsonb - AI 생성 시 메타데이터
- **user_final_content**: text - 사용자가 최종 수정한 콘텐츠
- **user_final_metadata**: jsonb - 최종 콘텐츠 메타데이터
- **revision_type**: enum ('published', 'scheduled', 'draft')
- **edit_distance**: integer - 편집 거리 (자동 계산)
- **word_count_diff**: integer - 단어 수 차이 (자동 계산)
- **generation_params**: jsonb - AI 생성 파라미터 (모델명, 온도, 프롬프트 등)
- **ai_generated_at**: timestamptz
- **user_finalized_at**: timestamptz
- **created_at**: timestamptz
- **notes**: text - 사용자 메모
- **tags**: text[] - 분류용 태그

### RLS 정책

모든 CRUD 작업은 `user_id = auth.uid()` 조건으로 보호됩니다.

## 사용 방법

### 1. 마이그레이션 실행

```bash
# Supabase CLI로 마이그레이션 실행
supabase db push

# 또는 Supabase Dashboard에서 SQL Editor로 실행
```

### 2. 코드에서 사용

#### 퇴고 이력 저장 (콘텐츠 발행 시)

```typescript
import { saveRevisionOnPublish } from '@/lib/supabase/revision-history';

// 콘텐츠 발행/예약 시 자동 저장
const result = await saveRevisionOnPublish({
  contentId: 'uuid-of-content',
  aiContent: '원본 AI 생성 텍스트...',
  finalContent: '사용자가 수정한 최종 텍스트...',
  isScheduled: false, // true면 'scheduled', false면 'published'
  generationParams: {
    model: 'gpt-4',
    temperature: 0.7,
    persona_id: 'uuid',
    audience_id: 'uuid'
  },
  metadata: {
    platform: 'threads',
    category: 'tech',
    language: 'ko'
  }
});

if (result.success) {
  console.log('퇴고 이력 저장 완료');
}
```

#### 수동으로 퇴고 이력 생성

```typescript
import { createRevisionHistory } from '@/lib/supabase/revision-history';

const { data, error } = await createRevisionHistory({
  ai_generated_content: 'AI가 생성한 원본 텍스트',
  user_final_content: '사용자가 수정한 최종 텍스트',
  revision_type: 'published',
  generation_params: {
    model: 'gpt-4',
    temperature: 0.7
  },
  tags: ['tech', 'tutorial']
});
```

#### 퇴고 이력 조회

```typescript
import { getRevisionHistory } from '@/lib/supabase/revision-history';

// 페이지네이션과 필터링
const { data, error, count } = await getRevisionHistory(
  1, // page
  20, // pageSize
  {
    revision_type: 'published',
    tags: ['tech']
  }
);
```

#### 통계 조회

```typescript
import { getRevisionStatistics } from '@/lib/supabase/revision-history';

const { data, error } = await getRevisionStatistics();
// data: {
//   total_revisions: 150,
//   avg_word_count_diff: 12.5,
//   avg_edit_distance: 45.2,
//   published_count: 120,
//   scheduled_count: 30,
//   ...
// }
```

## 통합 예시

### 콘텐츠 발행 플로우에 통합

```typescript
// app/api/content/publish/route.ts
import { saveRevisionOnPublish } from '@/lib/supabase/revision-history';

export async function POST(request: Request) {
  const { contentId, aiGeneratedText, userEditedText, scheduleTime } = await request.json();
  
  // 1. 콘텐츠 발행 로직
  const publishResult = await publishContent({
    content: userEditedText,
    scheduleTime
  });
  
  // 2. 퇴고 이력 자동 저장
  await saveRevisionOnPublish({
    contentId,
    aiContent: aiGeneratedText,
    finalContent: userEditedText,
    isScheduled: !!scheduleTime,
    generationParams: {
      // AI 생성 시 사용한 파라미터들
    }
  });
  
  return Response.json({ success: true });
}
```

## 데이터 활용

저장된 퇴고 이력은 다음과 같이 활용될 수 있습니다:

1. **개인화 AI 모델 학습**: 사용자별 수정 패턴 학습
2. **스타일 분석**: 사용자의 선호 문체, 톤 파악
3. **개선 제안**: 자주 수정되는 부분 분석하여 AI 개선
4. **A/B 테스트**: 다양한 생성 파라미터 효과 측정

## 주의사항

- 편집 거리(edit_distance)와 단어 수 차이(word_count_diff)는 자동으로 계산됩니다
- RLS가 활성화되어 있어 사용자는 자신의 데이터만 접근 가능합니다
- JSONB 필드에는 인덱스가 설정되어 있어 빠른 검색이 가능합니다
