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

        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
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
            
            const agePrompt = locale === 'ko' 
                ? `다음 연령대 분포 데이터를 보고 위트있고 인사이트 있는 한국어 코멘트를 작성해주세요. 
                   최고 연령대: ${topAge.name} (${topAge.percentage}%)
                   두번째 연령대: ${secondAge?.name} (${secondAge?.percentage}%)
                   
                   규칙:
                   - 2-3문장으로 간결하게
                   - 트렌디하고 캐주얼한 톤
                   - 인사이트와 함께 실용적인 조언 포함
                   - 이모지 사용 금지
                   - 예시: "25-34살 연령대 분들에게 인기가 많으시네요! 젊은 트렌드를 빠르게 캐치하고 있다는 뜻이에요"`
                : `Write a witty and insightful comment about this age distribution data.
                   Top age group: ${topAge.name} (${topAge.percentage}%)
                   Second age group: ${secondAge?.name} (${secondAge?.percentage}%)
                   
                   Rules:
                   - 2-3 sentences max
                   - Trendy and casual tone
                   - Include practical insight
                   - No emojis
                   - Example: "Your content resonates most with the 25-34 crowd! They're the sweet spot for engagement and growth potential."`;

            const ageResponse = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [{ role: 'user', content: agePrompt }],
                temperature: 0.8,
                max_tokens: 150,
            });

            insights.age = ageResponse.choices[0].message.content || '';
        }

        // Generate gender insight
        if (genderData && genderData.length > 0) {
            const maleData = genderData.find((g: any) => g.name.includes('Male') || g.name.includes('남성'));
            const femaleData = genderData.find((g: any) => g.name.includes('Female') || g.name.includes('여성'));
            
            const genderPrompt = locale === 'ko'
                ? `다음 성별 분포 데이터를 보고 위트있고 인사이트 있는 한국어 코멘트를 작성해주세요.
                   남성: ${maleData?.percentage || 0}%, 여성: ${femaleData?.percentage || 0}%
                   
                   규칙:
                   - 2-3문장으로 간결하게
                   - 성별 균형이나 특정 성별 선호도에 대한 인사이트
                   - 콘텐츠 전략 제안 포함
                   - 이모지 사용 금지`
                : `Write a witty and insightful comment about this gender distribution.
                   Male: ${maleData?.percentage || 0}%, Female: ${femaleData?.percentage || 0}%
                   
                   Rules:
                   - 2-3 sentences max
                   - Insight about gender balance or preference
                   - Include content strategy suggestion
                   - No emojis`;

            const genderResponse = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [{ role: 'user', content: genderPrompt }],
                temperature: 0.8,
                max_tokens: 150,
            });

            insights.gender = genderResponse.choices[0].message.content || '';
        }

        return NextResponse.json({ insights });
    } catch (error) {
        console.error('Error generating demographic insights:', error);
        return NextResponse.json(
            { error: 'Failed to generate insights' },
            { status: 500 }
        );
    }
}