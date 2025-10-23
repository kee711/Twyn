import { NextRequest } from 'next/server';
import { USER_SETTINGS, GIVEN_TOPIC, GIVEN_INSTRUCTIONS, THREAD_CHAIN_SETTINGS, THREAD_CHAIN_EXAMPLES, SINGLE_THREAD_SETTINGS } from '@/lib/prompts';
import { handleOptions, corsHeaders } from '@/lib/utils/cors';
import { streamText, createUIMessageStreamResponse, createUIMessageStream, generateId } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'edge';
export const maxDuration = 60;

const ai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

type PreferenceContext = {
    id?: string;
    name: string;
    description?: string;
};

type DetailContextPayload = {
    persona?: PreferenceContext | null;
    audience?: PreferenceContext | null;
    objective?: PreferenceContext | null;
    addOns?: PreferenceContext[];
    sourceReference?: {
        id: string;
        link?: string;
        platform: 'threads' | 'x';
        excerpt: string;
        body?: string;
    } | null;
};

export async function POST(req: NextRequest) {
    const { accountInfo, topic, instruction, postType = 'thread', language = 'en', context, mode = 'default' }: {
        accountInfo?: string;
        topic: string;
        instruction?: string;
        postType?: string;
        language?: string;
        context?: DetailContextPayload;
        mode?: 'default' | 'repurpose';
    } = await req.json();

    const buildSection = (label: string, value?: PreferenceContext | null) => {
        if (!value) return null;
        const details = [value.name];
        if (value.description) details.push(value.description);
        return `${label}:\n${details.join('\n')}`;
    };

    const fallbackContextParts = [
        buildSection('Persona', context?.persona),
        buildSection('Audience', context?.audience),
        buildSection('Objective', context?.objective),
    ];

    if (Array.isArray(context?.addOns) && context?.addOns.length) {
        fallbackContextParts.push(
            `Add-ons:\n${context.addOns
                .map(addOn => `${addOn.name}${addOn.description ? ` - ${addOn.description}` : ''}`)
                .join('\n')}`
        );
    }

    const fallbackAccountInfo = fallbackContextParts.filter(Boolean).join('\n\n').trim();
    const effectiveAccountInfo = accountInfo?.trim() ? accountInfo.trim() : fallbackAccountInfo;

    const languageInstruction: Record<string, string> = {
        'en': 'Generate content in English.',
        'ko': 'Generate content in Korean (한국어로 콘텐츠를 생성하세요).',
        'ja': 'Generate content in Japanese (日本語でコンテンツを生成してください).',
        'zh': 'Generate content in Chinese (用中文生成内容).',
        'es': 'Generate content in Spanish (Genera contenido en español).',
        'fr': 'Generate content in French (Générez du contenu en français).',
        'de': 'Generate content in German (Generieren Sie Inhalte auf Deutsch).'
    };

    const promptSettings = postType === 'single' ? SINGLE_THREAD_SETTINGS : THREAD_CHAIN_SETTINGS;
    const promptExamples = postType === 'single' ? '' : THREAD_CHAIN_EXAMPLES.map(example => `Example: ${example}`).join('\n');

    const referenceBody = context?.sourceReference?.body || context?.sourceReference?.excerpt;

    const repurposeGuidelines = mode === 'repurpose'
        ? `# Repurpose Rules
- The following reference content is the single source of truth.
- Rephrase and reorganize it for the configured persona, audience, objective, and add-ons.
- Do not invent facts beyond the reference or the structured context.
- Highlight the core insight from the reference before adding any new framing.
- Credit the original voice subtly; keep tone aligned with persona but retain factual details.
`
        : '';

    const promptParts = [
        promptSettings,
        repurposeGuidelines,
        context?.sourceReference
            ? `Reference (${context.sourceReference.platform.toUpperCase()}):\n${referenceBody}`
            : '',
        context?.sourceReference?.link ? `Reference Link: ${context.sourceReference.link}` : '',
        effectiveAccountInfo ? USER_SETTINGS(effectiveAccountInfo) : '',
        GIVEN_TOPIC(topic),
        instruction ? GIVEN_INSTRUCTIONS(instruction) : '',
        languageInstruction[language] || languageInstruction['en'],
        promptExamples
    ].filter(Boolean).join('\n\n');

    const statusId = generateId();

    const stream = createUIMessageStream({
        execute: ({ writer }) => {
            // 초기 상태 전송
            writer.write({
                type: 'data-status',
                id: statusId,
                data: { stage: 'initializing', message: 'Preparing prompt...' },
            });

            const result = streamText({
                model: ai(postType === 'single' ? 'gpt-4o-mini' : 'gpt-4o-mini') as any,
                prompt: postType === 'single'
                    ? promptParts
                    : promptParts + '\n\nReturn your response strictly as a JSON array of strings only.',
                temperature: mode === 'repurpose' ? 0.3 : 0.5,
                maxTokens: postType === 'single' ? 120 : 1200,
                onChunk() {
                    writer.write({
                        type: 'data-status',
                        id: statusId,
                        data: { stage: 'generating', message: 'Generating content...' },
                    });
                },
                onFinish() {
                    writer.write({
                        type: 'data-status',
                        id: statusId,
                        data: { stage: 'done', message: 'Completed.' },
                    });
                },
            } as any);

            // LLM 스트림 병합
            writer.merge(result.toUIMessageStream());
        },
    });

    return createUIMessageStreamResponse({ stream, headers: corsHeaders() });
}

export async function OPTIONS() {
    return handleOptions();
} 
