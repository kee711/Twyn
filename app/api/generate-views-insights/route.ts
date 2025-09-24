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

    const { chartData = [], topPosts = [], locale = 'en' } = await request.json();

    const buildFallback = (localeParam: string) => {
      const tip = localeParam === 'ko'
        ? '최근 상승 구간의 포스팅 시간대를 재활용하고, 썸네일/첫 문장에 후킹 요소를 강화하세요. 해시태그는 2~3개로 줄이고 키워드를 직접 문장에 녹이면 조회수 효율이 올라갑니다.'
        : 'Reuse the posting times during recent upticks and strengthen hooks in thumbnails/first lines. Reduce hashtags to 2–3 and weave keywords into sentences for better reach.';
      return { insight: tip };
    };

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(buildFallback(locale), { status: 200 });
    }

    const openai = new OpenAI({ apiKey });

    // Keep user prompt in English; enforce output language via system when ko
    const series = chartData.map((d: any) => `${d.name}:${d.views}`).join(', ');
    const posts = topPosts.slice(0, 3).map((p: any, i: number) => `#${i + 1} text: ${p.content?.slice(0, 160) || ''} | views:${p.viewCount ?? 0} | likes:${p.likeCount ?? 0}`).join('\n');
    const prompt = `You are a growth analyst.
      Analyze the time-series of views and the last 3 top posts, and propose concrete, high-impact actions to grow views next.
      Time series (day:views): ${series}
      Top posts:\n${posts}

      Rules:
      - YOU MUST INCLUDE keywords from the top posts.
      - Keep the sentences short and concise.
      - DO NOT generate more than 2-3 sentences, crisp and tactical.
      - Use line breaks for paragraphs.
      - DO NOT Print special characters for formatting like '**'
      - Mention posting timing, content angle/hooks, and distribution using the keywords from the top posts.
      - No emojis.`;

    const messages = locale === 'ko'
      ? [
        { role: 'system', content: 'Answer in Korean only.' },
        { role: 'user', content: prompt }
      ]
      : [
        { role: 'user', content: prompt }
      ];

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 120,
    });

    const insight = resp.choices?.[0]?.message?.content?.trim() || '';
    if (!insight) return NextResponse.json(buildFallback(locale), { status: 200 });

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Error generating views insights:', error);
    return NextResponse.json({ insight: '' }, { status: 200 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}


