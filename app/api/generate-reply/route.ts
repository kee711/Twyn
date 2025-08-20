import { NextRequest, NextResponse } from 'next/server';
import { COMMENT_REPLY_SYSTEM_PROMPT, COMMENT_REPLY_USER_PROMPT, COMMENT_REPLY_FALLBACK } from '@/lib/prompts';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const ai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { commentText, postContent } = await request.json();

    if (!commentText) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const prompt = COMMENT_REPLY_USER_PROMPT(commentText, postContent);
    try {
      const { text } = await generateText({
        model: ai('gpt-5-nano-2025-08-07') as any,
        prompt: `${COMMENT_REPLY_SYSTEM_PROMPT}\n\n${prompt}`,
        temperature: 0.7,
        maxTokens: 180,
      } as any);
      const reply = text?.trim() || COMMENT_REPLY_FALLBACK;
      return NextResponse.json({ reply });
    } catch (e) {
      console.error('AI SDK error:', e);
      return NextResponse.json(
        { error: 'Failed to generate reply' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
} 