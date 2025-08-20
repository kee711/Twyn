import { NextRequest, NextResponse } from 'next/server';
import { USER_SETTINGS, GIVEN_TOPIC, GIVEN_INSTRUCTIONS, THREAD_CHAIN_SETTINGS, THREAD_CHAIN_EXAMPLES, SINGLE_THREAD_SETTINGS } from '@/lib/prompts';
import { handleOptions, handleCors } from '@/lib/utils/cors';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export const runtime = 'edge';

const ai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    const { accountInfo, topic, instruction, postType = 'thread', language = 'en' }: {
        accountInfo?: string;
        topic: string;
        instruction?: string;
        postType?: string;
        language?: string
    } = await req.json();

    // Language mapping for prompts
    const languageInstruction: Record<string, string> = {
        'en': 'Generate content in English.',
        'ko': 'Generate content in Korean (한국어로 콘텐츠를 생성하세요).',
        'ja': 'Generate content in Japanese (日本語でコンテンツを生成してください).',
        'zh': 'Generate content in Chinese (用中文生成内容).',
        'es': 'Generate content in Spanish (Genera contenido en español).',
        'fr': 'Generate content in French (Générez du contenu en français).',
        'de': 'Generate content in German (Generieren Sie Inhalte auf Deutsch).'
    };

    // Generate based on postType - single post or thread chain
    const promptSettings = postType === 'single' ? SINGLE_THREAD_SETTINGS : THREAD_CHAIN_SETTINGS;
    const promptExamples = postType === 'single' ? '' : THREAD_CHAIN_EXAMPLES.map(example => `Example: ${example}`).join('\n');

    const promptParts = [
        promptSettings,
        accountInfo ? USER_SETTINGS(accountInfo) : '',
        GIVEN_TOPIC(topic),
        instruction ? GIVEN_INSTRUCTIONS(instruction) : '',
        languageInstruction[language] || languageInstruction['en'],
        promptExamples
    ].filter(Boolean).join('\n\n');

    if (postType === 'single') {
        const { text } = await generateText({
            model: ai('gpt-5-nano-2025-08-07') as any,
            prompt: promptParts,
            temperature: 0.7,
            maxTokens: 800,
        } as any);
        const response = NextResponse.json({ threads: [text] });
        return handleCors(response);
    }

    try {
        const { text } = await generateText({
            model: ai('gpt-5') as any,
            prompt: promptParts + '\n\nReturn your response strictly as a JSON array of strings only.',
            temperature: 0.7,
            maxTokens: 1200,
        } as any);
        try {
            const parsedThreads = JSON.parse(text);
            const threads = Array.isArray(parsedThreads) ? parsedThreads : [String(parsedThreads)];
            const response = NextResponse.json({ threads });
            return handleCors(response);
        } catch {
            const threads = text
                .split('\n\n')
                .map(t => t.trim())
                .filter(t => t.length > 0);
            const response = NextResponse.json({ threads });
            return handleCors(response);
        }
    } catch (error) {
        const response = NextResponse.json({ error: 'Failed to generate threads' }, { status: 500 });
        return handleCors(response);
    }
}

export async function OPTIONS() {
    return handleOptions();
} 