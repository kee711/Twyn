import { Suspense } from 'react'
import AgentSettings from '@/app/[locale]/(dashboard)/agents/components/AgentSettings'
import PostList from '@/app/[locale]/(dashboard)/agents/components/PostList'
import RightSidebarEditor from '@/app/[locale]/(dashboard)/agents/components/RightSidebarEditor'

export default function AgentsPage() {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 p-3">
      <div className="flex flex-col gap-4 min-h-0">
        <AgentSettings />
        <Suspense>
          <PostList />
        </Suspense>
      </div>
      <div className="min-h-0">
        <RightSidebarEditor />
      </div>
    </div>
  )
}

