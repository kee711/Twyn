import { NextRequest, NextResponse } from 'next/server';
import { COMMON_SETTINGS, USER_SETTINGS, INSTRUCTIONS } from '@/lib/prompts';
import { handleOptions, handleCors } from '@/lib/utils/cors';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export const runtime = 'edge';

const ai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

type PreferenceContext = {
    id?: string;
    name: string;
    description?: string;
};

export async function POST(req: NextRequest) {
    const {
        persona,
        audience,
        objective,
        addOns = [],
        contextSummary,
        language = 'en',
    }: {
        persona?: PreferenceContext | null;
        audience?: PreferenceContext | null;
        objective?: PreferenceContext | null;
        addOns?: PreferenceContext[];
        contextSummary?: string;
        language?: string;
    } = await req.json();

    const buildSection = (label: string, context?: PreferenceContext | null) => {
        if (!context) return null;
        const details = [context.name];
        if (context.description) details.push(context.description);
        return `${label}:\n${details.join('\n')}`;
    };

    const contextParts = [
        buildSection('Persona', persona),
        buildSection('Audience', audience),
        buildSection('Objective', objective),
    ];

    if (Array.isArray(addOns) && addOns.length > 0) {
        const addOnDescription = addOns
            .map(addOn => `${addOn.name}${addOn.description ? ` - ${addOn.description}` : ''}`)
            .join('\n');
        contextParts.push(`Add-ons:\n${addOnDescription}`);
    }

    if (contextSummary) {
        contextParts.push(`Additional Context:\n${contextSummary}`);
    }

    const composedContext = contextParts.filter(Boolean).join('\n\n').trim();

    if (!composedContext) {
        const response = NextResponse.json({ error: 'Missing topic finder context' }, { status: 400 });
        return handleCors(response);
    }

    const reqId = Math.random().toString(36).slice(2, 8) + '-' + Date.now();
    console.log(`[generate-topics][${reqId}] start`, {
        hasContext: !!composedContext,
        contextLen: composedContext.length,
        language,
        edgeRuntime: true,
        openaiKeySet: !!process.env.OPENAI_API_KEY
    });

    // Language mapping for prompts
    const languageInstruction: Record<string, string> = {
        'en': 'Generate all topics and headlines in English.',
        'ko': 'Generate all topics and headlines in Korean (모든 주제와 헤드라인을 한국어로 생성하세요).',
        'ja': 'Generate all topics and headlines in Japanese (すべてのトピックと見出しを日本語で生成してください).',
        'zh': 'Generate all topics and headlines in Chinese (用中文生成所有主题和标题).',
        'es': 'Generate all topics and headlines in Spanish (Genera todos los temas y titulares en español).',
        'fr': 'Generate all topics and headlines in French (Générez tous les sujets et titres en français).',
        'de': 'Generate all topics and headlines in German (Generieren Sie alle Themen und Überschriften auf Deutsch).'
    };

    const prompt = [
        COMMON_SETTINGS,
        USER_SETTINGS(composedContext),
        INSTRUCTIONS,
        languageInstruction[language] || languageInstruction['en']
    ].join('\n\n');

    console.log(`[generate-topics][${reqId}] prompt built`, {
        promptLen: prompt.length,
        promptHead: prompt.slice(0, 200).replace(/\n/g, '\\n')
    });

    try {
        console.log(`[generate-topics][${reqId}] calling model`, { model: 'gpt-4o-mini', temperature: 0.5, maxTokens: 300 });

        // 정확히 5개의 주제를 강제하는 구조화 출력 스키마 (문자열 또는 { topic } 객체 허용)
        const TopicsSchema = z.object({
            topics: z.array(
                z.union([
                    z.string().min(1),
                    z.object({ topic: z.string().min(1) })
                ])
            ).length(5)
        });

        const result = await generateObject({
            model: ai('gpt-4o-mini') as any,
            prompt,
            temperature: 0.5,
            maxTokens: 300,
            schema: TopicsSchema
        } as any);

        const raw = result.object as z.infer<typeof TopicsSchema>;
        const topics = (raw.topics || []).map((item: any) => typeof item === 'string' ? item : item.topic);
        console.log(`[generate-topics][${reqId}] object normalized`, { count: topics.length });

        const response = NextResponse.json({ topics });
        return handleCors(response);
    } catch (error: any) {
        console.error(`[generate-topics][${reqId}] model call FAILED`, {
            message: error?.message,
            name: error?.name,
            stack: error?.stack,
            cause: error?.cause
        });
        const response = NextResponse.json({ error: 'Failed to generate topics', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
        return handleCors(response);
    }
}

export async function OPTIONS() {
    return handleOptions();
} 
