import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getPosts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('my_contents')
    .select('my_contents_id, content, created_at, publish_status')
    .order('created_at', { ascending: false })
    .limit(30)
  return data ?? []
}

export default async function PostList() {
  const posts = await getPosts()
  return (
    <div className="grid gap-3">
      {posts.map((p) => (
        <Card key={p.my_contents_id} className="p-4 flex items-start justify-between">
          <div className="text-sm whitespace-pre-wrap max-w-[80%]">{p.content}</div>
          <Badge variant="secondary">{p.publish_status}</Badge>
        </Card>
      ))}
    </div>
  )
}

