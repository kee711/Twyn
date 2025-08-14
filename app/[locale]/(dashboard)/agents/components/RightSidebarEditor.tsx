"use client"
import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { saveDraft, confirmPost, saveDiff, generatePostFromAgent } from '../actions'

export default function RightSidebarEditor() {
  const [content, setContent] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [topics, setTopics] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('agent-editor')
    if (saved) setContent(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('agent-editor', content)
  }, [content])

  return (
    <Card className="p-3 h-full flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            const res = await fetch('/api/ai-agent/topic-generator', {
              method: 'POST',
              body: JSON.stringify({ profileDescription: '', language: 'ko' })
            })
            const data = await res.json()
            setTopics(data.topics ?? [])
          }}
        >
          토픽 생성
        </Button>
        <Button
          disabled={!selectedTopic || isGenerating}
          onClick={async () => {
            if (!selectedTopic) return
            setIsGenerating(true)
            try {
              const res = await generatePostFromAgent({ topic: selectedTopic })
              setContent(res.draft)
            } finally {
              setIsGenerating(false)
            }
          }}
        >
          {isGenerating ? '생성중…' : 'Generate Post'}
        </Button>
      </div>
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t}
              className={`text-xs px-2 py-1 rounded border ${selectedTopic === t ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setSelectedTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <Textarea
        className="min-h-[240px]"
        placeholder="생성된 초안이 여기에 표시됩니다."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={async () => {
            const res = await saveDraft(content)
            setDraftId(res?.id ?? null)
          }}
        >
          Save Draft
        </Button>
        <Button
          onClick={async () => {
            const finalContent = content
            const res = await confirmPost(finalContent)
            if (res?.id) {
              await saveDiff({ draft: content, final: finalContent })
            }
          }}
        >
          Confirm
        </Button>
      </div>
    </Card>
  )
}

