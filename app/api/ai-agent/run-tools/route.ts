import { openai } from '@ai-sdk/openai'
import { generateText, tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { topic } = await req.json()

  const supabase = await createClient()

  const result = await generateText({
    model: openai.responses('gpt-4o-mini'),
    // multi-step not strictly needed; keep single-step for simplicity
    tools: {
      web_search_preview: openai.tools.webSearchPreview({}),
      templateChooser: tool({
        description: 'Template selection and formatting parameters',
        inputSchema: z.object({ items_count: z.number().default(5), cta_style: z.string().default('질문형') }),
        execute: async ({ items_count, cta_style }: { items_count: number; cta_style: string }) => ({ items_count, cta_style }),
      }),
      myPreviousPosts: tool({
        description: 'Return previous post samples',
        inputSchema: z.object({ limit: z.number().default(5) }),
        execute: async ({ limit }: { limit: number }) => {
          const { data } = await supabase
            .from('my_contents')
            .select('content')
            .order('created_at', { ascending: false })
            .limit(limit)
          return { samples: (data ?? []).map((d: any) => d.content).filter(Boolean) }
        },
      }),
      hookGenerator: tool({
        description: 'Generate hook lines',
        inputSchema: z.object({ base: z.string() }),
        execute: async ({ base }: { base: string }) => ({ hook: base.slice(0, 100) }),
      }),
    },
    prompt: `다음 토픽으로 Threads용 포스트 초안을 생성하세요. 형식 규칙: 1) 첫 줄 제목(평문), 2) 다음 2~3줄 강한 훅, 3) 번호형 리스트 5개(각 2줄: 결론/실행 팁), 4) 마무리 질문형 한 줄, 5) 해시태그는 있을 때만 마지막 줄. 한국어로 간결하고 구체적으로.\n토픽: ${topic}`,
  })

  return Response.json({ draft: result.text })
}

