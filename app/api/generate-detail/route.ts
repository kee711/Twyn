import { NextRequest, NextResponse } from 'next/server';
import { COMMON_DETAIL_SETTINGS, USER_SETTINGS, GIVEN_TOPIC, GIVEN_INSTRUCTIONS, THREAD_CHAIN_SETTINGS } from '@/lib/prompts';
import { handleOptions, handleCors } from '@/lib/utils/cors';

export const runtime = 'edge';

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
    const promptSettings = postType === 'single' ? COMMON_DETAIL_SETTINGS : THREAD_CHAIN_SETTINGS;
    
    const promptParts = [
        promptSettings,
        accountInfo ? USER_SETTINGS(accountInfo) : '',
        GIVEN_TOPIC(topic),
        instruction ? GIVEN_INSTRUCTIONS(instruction) : '',
        languageInstruction[language] || languageInstruction['en']
    ].filter(Boolean).join('\n\n');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4-1106-preview',
            messages: [
                { role: 'system', content: promptParts }
            ],
            max_tokens: 800, // Increased for multiple threads
            temperature: 0.7,
        })
    });

    if (!openaiRes.ok) {
        return NextResponse.json({ error: 'OpenAI API error' }, { status: 500 });
    }

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content || '';

    try {
        if (postType === 'single') {
            // For single post, return as is
            const response = NextResponse.json({ threads: [text] });
            return handleCors(response);
        } else {
            // Parse the JSON response to get thread chain
            const parsedThreads = JSON.parse(text);

            // Ensure it's an array
            const threads = Array.isArray(parsedThreads) ? parsedThreads : [parsedThreads];

            const response = NextResponse.json({ threads });
            return handleCors(response);
        }
    } catch (error) {
        // Fallback: split the text into threads if JSON parsing fails
        const threads = postType === 'single' 
            ? [text]
            : text.split('\n\n').filter((t: string) => t.trim()).map((t: string) => t.trim());
        const response = NextResponse.json({ threads });
        return handleCors(response);
    }
}

export async function OPTIONS() {
    return handleOptions();
} 