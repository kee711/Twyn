"use server"
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { openai } from '@ai-sdk/openai'
import { generateText, tool } from 'ai'
import { z } from 'zod'

export async function generatePostFromAgent(params?: { topic?: string }) {
  const result = await generateText({
    model: openai.responses('gpt-4o-mini'),
    tools: {
      web_search_preview: openai.tools.webSearchPreview({}),
      templateChooser: tool({
        description: 'Select post template and render with formatting rules',
        inputSchema: z.object({
          items_count: z.number().min(3).max(8).default(5),
          cta_style: z.string().default('질문형'),
          hashtags: z.array(z.string()).optional(),
          topic: z.string().optional(),
        }),
        execute: async ({ items_count, cta_style, hashtags, topic }: { items_count: number; cta_style: string; hashtags?: string[]; topic?: string }) => {
          return { items_count, cta_style, hashtags: hashtags ?? [], topic }
        }
      }),
      myPreviousPosts: tool({
        description: 'Fetch style cues from previous posts',
        inputSchema: z.object({ limit: z.number().default(10) }),
        execute: async ({ limit }: { limit: number }) => {
          const supabase = await createClient()
          const { data } = await supabase
            .from('my_contents')
            .select('content')
            .order('created_at', { ascending: false })
            .limit(limit)
          return { samples: (data ?? []).map((d) => d.content).filter(Boolean) }
        },
      }),
      hookGenerator: tool({
        description: 'Generate hook lines and improve readability',
        inputSchema: z.object({ base: z.string() }),
        execute: async ({ base }: { base: string }) => {
          return { hook: base.slice(0, 100) }
        },
      }),
    },
    prompt: `Create a Threads post draft. Follow the formatting rules.
Topic: ${params?.topic ?? 'AI/웹 개발 생산성'}
Rules: 1) 첫 줄 제목(평문). 2) 다음 2~3줄 강한 훅. 3) 번호형 리스트 5개(각 2줄: 결론/실행팁). 4) 마무리 한 줄(질문형). 5) 해시태그는 있을 때만 마지막 줄.
Avoid fluff; keep concrete examples. Korean.`,
  })

  return { draft: result.text }
}

export async function saveDraft(content: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('my_contents')
    .insert({ content, publish_status: 'draft' })
    .select('my_contents_id')
    .single()
  if (error) throw error
  revalidatePath('/agents')
  return { id: data?.my_contents_id }
}

export async function confirmPost(content: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('my_contents')
    .insert({ content, publish_status: 'ready_to_publish' })
    .select('my_contents_id')
    .single()
  if (error) throw error
  revalidatePath('/agents')
  return { id: data?.my_contents_id }
}

export async function saveDiff({ draft, final }: { draft: string; final: string }) {
  const supabase = await createClient()
  const diff = createLineDiff(draft, final)
  await supabase.from('post_diffs').insert({
    draft_content: draft,
    final_content: final,
    diff_content: diff,
  })
  return { ok: true }
}

function createLineDiff(a: string, b: string) {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const max = Math.max(aLines.length, bLines.length)
  const changes: Array<{ index: number; before?: string; after?: string }> = []
  for (let i = 0; i < max; i++) {
    if ((aLines[i] ?? '') !== (bLines[i] ?? '')) {
      changes.push({ index: i, before: aLines[i], after: bLines[i] })
    }
  }
  return { type: 'line-diff', changes }
}

