import { NextRequest } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { profileDescription, language = 'ko' } = await req.json()
  const schema = z.object({ topics: z.array(z.string()) })
  const result = await generateObject({
    model: openai.responses('gpt-4o-mini'),
    schema,
    prompt: `사용자 프로필 설명을 바탕으로 Threads 포스트 주제 10개를 ${language}로 생성해 주세요. 간결하고 실행 가능한 주제만.\n프로필 설명: ${profileDescription}`,
  })
  return Response.json(result.object)
}

