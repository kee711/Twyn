import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { parentMediaId, aiGenerated } = await request.json();
    
    if (!parentMediaId) {
      return NextResponse.json({ error: 'Missing parentMediaId' }, { status: 400 });
    }

    const supabase = await createClient();
    const userId = session.user.id;

    // If aiGenerated is an array of thread contents, update each thread individually
    if (Array.isArray(aiGenerated)) {
      // Get all threads in the chain to update them
      const { data: threads, error: fetchError } = await supabase
        .from('my_contents')
        .select('id, thread_sequence')
        .eq('user_id', userId)
        .eq('parent_media_id', parentMediaId)
        .order('thread_sequence', { ascending: true });

      if (fetchError || !threads) {
        console.error('Error fetching threads:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
      }

      // Update each thread with its corresponding AI-generated content
      for (const thread of threads) {
        if (thread.thread_sequence < aiGenerated.length) {
          const aiContent = aiGenerated[thread.thread_sequence];
          const contentText = typeof aiContent === 'object' && aiContent.content 
            ? aiContent.content 
            : aiContent;

          const { error: updateError } = await supabase
            .from('my_contents')
            .update({ ai_generated: contentText })
            .eq('id', thread.id)
            .eq('user_id', userId);

          if (updateError) {
            console.error(`Error updating thread ${thread.id}:`, updateError);
          }
        }
      }
    } else {
      // Fallback: update all threads with the same content (shouldn't happen with new implementation)
      const { error } = await supabase
        .from('my_contents')
        .update({ ai_generated: aiGenerated })
        .eq('user_id', userId)
        .eq('parent_media_id', parentMediaId);

      if (error) {
        console.error('Error updating ai_generated:', error);
        return NextResponse.json({ error: 'Failed to update ai_generated' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update-ai-generated:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}