import { NextRequest, NextResponse } from 'next/server';
import { COMMON_SETTINGS, USER_SETTINGS, INSTRUCTIONS } from '@/lib/prompts';
import { handleOptions, handleCors } from '@/lib/utils/cors';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const { profileDescription, language = 'en' }: { profileDescription: string; language?: string } = await req.json();
    console.log('profileDescription', profileDescription);

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
        USER_SETTINGS(profileDescription),
        INSTRUCTIONS,
        languageInstruction[language] || languageInstruction['en']
    ].join('\n\n');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
                { role: 'system', content: prompt }
            ],
            max_tokens: 512,
            temperature: 0.7,
        })
    });

    if (!openaiRes.ok) {
        return NextResponse.json({ error: 'OpenAI API error' }, { status: 500 });
    }

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content || '';

    // JSON만 추출해서 반환
    try {
        const json = JSON.parse(text);
        const response = NextResponse.json(json);
        return handleCors(response);
    } catch {
        const response = NextResponse.json({ error: 'Invalid JSON from OpenAI', raw: text }, { status: 500 });
        return handleCors(response);
    }
}

export async function OPTIONS() {
    return handleOptions();
} 