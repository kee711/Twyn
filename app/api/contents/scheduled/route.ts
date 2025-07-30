import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/authOptions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    const userId = session.user.id
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('my_contents')
      .select('*')
      .eq('owner', userId)
      .or('publish_status.eq.scheduled,publish_status.eq.posted')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching contents:', error);  // 이건 콘솔에 찍힘
      return NextResponse.json({ error }, { status: 500 }); // 이건 브라우저 응답으로 보여짐
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/contents/scheduled:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : error }, { status: 500 });
  }
}