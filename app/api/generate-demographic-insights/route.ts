import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ageData, genderData, locale = 'en' } = await request.json();

        const buildFallbackInsights = (ageDataParam?: any[], genderDataParam?: any[], localeParam: string = 'en') => {
            const insights: { age?: string; gender?: string } = {};

            if (Array.isArray(ageDataParam) && ageDataParam.length > 0) {
                const sorted = [...ageDataParam].sort((a: any, b: any) => (b.percentage ?? 0) - (a.percentage ?? 0));
                const top = sorted[0];
                const second = sorted[1];
                insights.age = localeParam === 'ko'
                    ? `${top?.name} 연령대 비중이 가장 높아요(${top?.percentage ?? 0}%). ${second?.name ? `다음은 ${second.name} (${second.percentage ?? 0}%)` : ''} 중심의 톤과 관심사를 반영하면 도달과 반응이 좋아집니다.`.trim()
                    : `Your top age group is ${top?.name} (${top?.percentage ?? 0}%). ${second?.name ? `Next is ${second.name} (${second.percentage ?? 0}%). ` : ''}Lean into their interests and tone for better reach and engagement.`.trim();
            }

            if (Array.isArray(genderDataParam) && genderDataParam.length > 0) {
                const male = genderDataParam.find((g: any) => `${g.name}`.toLowerCase().includes('male') || `${g.name}`.includes('남성'));
                const female = genderDataParam.find((g: any) => `${g.name}`.toLowerCase().includes('female') || `${g.name}`.includes('여성'));
                const malePct = male?.percentage ?? 0;
                const femalePct = female?.percentage ?? 0;
                insights.gender = localeParam === 'ko'
                    ? `성별 분포는 남성 ${malePct}%, 여성 ${femalePct}% 수준이에요. 타깃 성별의 관심 주제와 사례 중심 포맷을 늘리면 전환 효율이 개선됩니다.`
                    : `Gender split is Male ${malePct}% and Female ${femalePct}%. Tailor topics and examples toward the leading segment to improve conversion.`;
            }

            return insights;
        };

        const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
            // 폴백 코멘트로 성공 응답 반환 (UI가 항상 표시되도록)
            return NextResponse.json({ insights: buildFallbackInsights(ageData, genderData, locale) }, { status: 200 });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        if (!ageData && !genderData) {
            return NextResponse.json({ error: 'No demographic data provided' }, { status: 400 });
        }

        const insights: { age?: string; gender?: string } = {};

        // Generate age insight
        if (ageData && ageData.length > 0) {
            const topAge = ageData.sort((a: any, b: any) => b.percentage - a.percentage)[0];
            const secondAge = ageData[1];

            const agePrompt = `Write a witty and insightful comment about this age distribution data.
                   Give insightful ideas about how to target the top age group.
                   Top age group: ${topAge.name} (${topAge.percentage}%)
                   Second age group: ${secondAge?.name} (${secondAge?.percentage}%)
                   
                   Rules:
                   - 3 short sentences max
                   - Trendy and casual tone
                   - Include practical insight
                   - No emojis
                   - Structure : 
                   First sentence: Explain the top age group, 
                   Second sentence: Explain their characteristics & traits, 
                   Third sentence: Practical advice for targeting them
                `;

            try {
                const ageMessages = locale === 'ko'
                    ? [
                        { role: 'system', content: 'Answer in Korean only.' },
                        { role: 'user', content: agePrompt }
                    ]
                    : [
                        { role: 'user', content: agePrompt }
                    ];
                const ageResponse = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: ageMessages as any,
                    temperature: 0.8,
                    max_tokens: 120,
                });
                insights.age = ageResponse.choices?.[0]?.message?.content || '';
            } catch (e) {
                // 폴백 코멘트
                insights.age = buildFallbackInsights(ageData, undefined, locale).age || '';
            }
        }

        // Generate gender insight
        if (genderData && genderData.length > 0) {
            const maleData = genderData.find((g: any) => g.name.includes('Male') || g.name.includes('남성'));
            const femaleData = genderData.find((g: any) => g.name.includes('Female') || g.name.includes('여성'));

            const genderPrompt = `Write a witty and insightful comment about this gender distribution.
                   Give insightful ideas about how to target the top gender group.
                   Male: ${maleData?.percentage || 0}%, Female: ${femaleData?.percentage || 0}%
                   
                   Rules:
                   - 3 short sentences max
                   - Insight about gender balance or preference
                   - Include content strategy suggestion
                   - No emojis
                   - Structure : 
                   First sentence: Explain the top gender group, 
                   Second sentence: Explain their characteristics & traits, 
                   Third sentence: Practical advice for targeting them
                   `;

            try {
                const genderMessages = locale === 'ko'
                    ? [
                        { role: 'system', content: 'Answer in Korean only.' },
                        { role: 'user', content: genderPrompt }
                    ]
                    : [
                        { role: 'user', content: genderPrompt }
                    ];
                const genderResponse = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: genderMessages as any,
                    temperature: 0.8,
                    max_tokens: 120,
                });
                insights.gender = genderResponse.choices?.[0]?.message?.content || '';
            } catch (e) {
                // 폴백 코멘트
                insights.gender = buildFallbackInsights(undefined, genderData, locale).gender || '';
            }
        }

        return NextResponse.json({ insights });
    } catch (error) {
        console.error('Error generating demographic insights:', error);
        // 최종 폴백: 안전하게 비어있는 결과 반환 (클라이언트는 표시를 생략)
        return NextResponse.json({ insights: {} }, { status: 200 });
    }
}