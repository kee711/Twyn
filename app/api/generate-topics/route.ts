import { NextRequest, NextResponse } from 'next/server';
import { COMMON_SETTINGS, USER_SETTINGS, INSTRUCTIONS } from '@/lib/prompts';
import { handleOptions, handleCors } from '@/lib/utils/cors';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

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
        console.log(`[generate-topics][${reqId}] calling model`, { model: 'gpt-5', temperature: 0.7, maxTokens: 1200 });
        const { text } = await generateText({
            model: ai('gpt-5-nano-2025-08-07') as any,
            // AI SDK v5: prompt 또는 messages가 반드시 필요
            prompt,
            temperature: 0.7,
            maxTokens: 1200
        } as any);
        console.log(`[generate-topics][${reqId}] model responded`, {
            textLen: text?.length ?? 0,
            textHead: (text || '').slice(0, 300)
        });

        // JSON만 추출해서 반환
        try {
            const json = JSON.parse(text);
            console.log(`[generate-topics][${reqId}] json parse OK`, {
                isArray: Array.isArray(json),
                length: Array.isArray(json) ? json.length : undefined,
            });
            const response = NextResponse.json(json);
            return handleCors(response);
        } catch (e: any) {
            console.error(`[generate-topics][${reqId}] json parse FAILED`, {
                message: e?.message,
                textHead: (text || '').slice(0, 500)
            });
            const response = NextResponse.json({ error: 'Invalid JSON from model', raw: text }, { status: 500 });
            return handleCors(response);
        }
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
