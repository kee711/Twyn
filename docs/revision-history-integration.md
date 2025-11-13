# AI 퇴고 이력 통합 가이드

## 빠른 시작

### 1. 데이터베이스 마이그레이션

```bash
# Supabase CLI 사용
supabase db push

# 또는 Supabase Dashboard SQL Editor에서 실행
# supabase/migrations/20251107000000_create_revision_history.sql
```

### 2. 기존 콘텐츠 발행 플로우에 통합

#### 예시 1: API Route에서 사용

```typescript
// app/api/content/publish/route.ts
import { saveRevisionOnPublish } from '@/lib/supabase/revision-history';

export async function POST(request: Request) {
  const { 
    contentId, 
    aiGeneratedText, 
    userEditedText, 
    scheduleTime,
    generationParams 
  } = await request.json();
  
  try {
    // 1. 콘텐츠 발행
    const result = await publishToSocialMedia(userEditedText, scheduleTime);
    
    // 2. 퇴고 이력 저장 (백그라운드에서 실행, 실패해도 발행은 성공)
    saveRevisionOnPublish({
      contentId,
      aiContent: aiGeneratedText,
      finalContent: userEditedText,
      isScheduled: !!scheduleTime,
      generationParams,
      metadata: {
        platform: 'threads',
        result_id: result.id
      }
    }).catch(err => {
      console.error('Failed to save revision history:', err);
      // 로깅만 하고 에러는 무시 (발행 성공이 우선)
    });
    
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: 'Failed to publish' }, { status: 500 });
  }
}
```

#### 예시 2: Client Component에서 사용

```typescript
// components/ContentEditor.tsx
'use client';

import { useState } from 'react';
import { useRevisionHistory } from '@/hooks/useRevisionHistory';

export function ContentEditor({ initialAiContent }: { initialAiContent: string }) {
  const [content, setContent] = useState(initialAiContent);
  const { saveOnPublish, loading } = useRevisionHistory();
  
  const handlePublish = async () => {
    // 발행 API 호출
    const response = await fetch('/api/content/publish', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    
    if (response.ok) {
      // 퇴고 이력 저장
      await saveOnPublish({
        aiContent: initialAiContent,
        finalContent: content,
        isScheduled: false,
        generationParams: {
          model: 'gpt-4',
          temperature: 0.7
        }
      });
    }
  };
  
  return (
    <div>
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={handlePublish} disabled={loading}>
        발행하기
      </button>
    </div>
  );
}
```

### 3. LangGraph 워크플로우에 통합

```typescript
// langgraph/nodes/publish-node.ts
import { saveRevisionOnPublish } from '@/lib/supabase/revision-history';

export async function publishNode(state: GraphState) {
  const { aiGeneratedContent, userEditedContent, userId } = state;
  
  // 발행 로직
  const publishResult = await publishContent(userEditedContent);
  
  // 퇴고 이력 저장
  if (publishResult.success) {
    await saveRevisionOnPublish({
      aiContent: aiGeneratedContent,
      finalContent: userEditedContent,
      isScheduled: false,
      generationParams: state.generationParams,
      metadata: {
        workflow: 'langgraph',
        node: 'publish',
        session_id: state.sessionId
      }
    });
  }
  
  return {
    ...state,
    publishResult
  };
}
```

## 고급 사용법

### 실시간 편집 추적

사용자가 편집하는 동안 변경사항을 추적하려면:

```typescript
import { useState, useEffect, useRef } from 'react';

export function RealTimeRevisionTracker({ aiContent }: { aiContent: string }) {
  const [content, setContent] = useState(aiContent);
  const [editCount, setEditCount] = useState(0);
  const lastSavedRef = useRef(aiContent);
  
  useEffect(() => {
    // 5초마다 변경사항 체크
    const interval = setInterval(() => {
      if (content !== lastSavedRef.current) {
        setEditCount(prev => prev + 1);
        lastSavedRef.current = content;
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [content]);
  
  return (
    <div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <p>편집 횟수: {editCount}</p>
    </div>
  );
}
```

### 배치 저장

여러 콘텐츠를 한 번에 발행할 때:

```typescript
import { createRevisionHistory } from '@/lib/supabase/revision-history';

export async function batchPublishWithRevision(items: Array<{
  aiContent: string;
  finalContent: string;
  contentId?: string;
}>) {
  const results = await Promise.allSettled(
    items.map(item => 
      createRevisionHistory({
        content_id: item.contentId,
        ai_generated_content: item.aiContent,
        user_final_content: item.finalContent,
        revision_type: 'published'
      })
    )
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  console.log(`${successful}/${items.length} revision histories saved`);
  
  return results;
}
```

### 분석 및 인사이트

```typescript
import { getRevisionStatistics, getRevisionHistory } from '@/lib/supabase/revision-history';

export async function analyzeUserEditingPatterns() {
  // 통계 가져오기
  const { data: stats } = await getRevisionStatistics();
  
  // 최근 100개 이력 가져오기
  const { data: history } = await getRevisionHistory(1, 100);
  
  if (!history) return null;
  
  // 패턴 분석
  const patterns = {
    avgEditDistance: stats?.avg_edit_distance || 0,
    avgWordCountChange: stats?.avg_word_count_diff || 0,
    mostEditedPlatform: getMostEditedPlatform(history),
    commonTags: getCommonTags(history),
    editingTrend: calculateEditingTrend(history)
  };
  
  return patterns;
}

function getMostEditedPlatform(history: any[]) {
  const platforms = history
    .map(h => h.ai_generated_metadata?.platform)
    .filter(Boolean);
  
  return platforms.reduce((acc, platform) => {
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
```

## 주의사항

1. **성능**: 퇴고 이력 저장은 비동기로 처리하여 발행 속도에 영향을 주지 않도록 합니다.
2. **에러 처리**: 이력 저장 실패가 발행 실패로 이어지지 않도록 try-catch로 감싸세요.
3. **프라이버시**: 민감한 정보는 `generation_params`나 `metadata`에 저장하지 마세요.
4. **용량**: 매우 긴 콘텐츠는 저장 전에 요약하거나 샘플링을 고려하세요.

## 데이터 활용 예시

저장된 데이터는 다음과 같이 활용할 수 있습니다:

```typescript
// 사용자별 AI 모델 파인튜닝 데이터 추출
export async function exportTrainingData(userId: string) {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('revision_history')
    .select('ai_generated_content, user_final_content, generation_params')
    .eq('user_id', userId)
    .eq('revision_type', 'published')
    .order('created_at', { ascending: false })
    .limit(1000);
  
  // JSONL 형식으로 변환 (OpenAI fine-tuning 형식)
  const trainingData = data?.map(item => ({
    messages: [
      { role: 'system', content: 'You are a content editor.' },
      { role: 'user', content: item.ai_generated_content },
      { role: 'assistant', content: item.user_final_content }
    ]
  }));
  
  return trainingData;
}
```
