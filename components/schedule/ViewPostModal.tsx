'use client'

import { useState, useEffect } from 'react'
import useSocialAccountStore from '@/stores/useSocialAccountStore'
import { Eye, Heart, MessageCircle, Repeat2, Share2, X } from 'lucide-react'
import { format } from 'date-fns'
import { PostCard } from '@/components/PostCard'
import { ThreadChain } from '@/components/ThreadChain'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Event } from './types'
import { ThreadContent, getThreadChainByParentId } from '@/app/actions/threadChain'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MediaInsights {
  views?: number
  likes?: number
  replies?: number
  reposts?: number
  shares?: number
}

interface ViewPostModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  event: Event | null
}

export function ViewPostModal({
  isOpen,
  onOpenChange,
  event,
}: ViewPostModalProps) {
  const t = useTranslations('viewPostModal')
  const [content, setContent] = useState('')
  const [threads, setThreads] = useState<ThreadContent[]>([])
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [insights, setInsights] = useState<MediaInsights | null>(null)
  const { currentUsername, currentSocialId } = useSocialAccountStore()

  useEffect(() => {
    async function loadData() {
      if (!event) {
        setContent('')
        setThreads([])
        setInsights(null)
        return
      }

      setContent(event.title)

      // Load complete thread chain data if this is a thread chain
      if (event.is_thread_chain) {
        setIsLoadingThreads(true)
        try {
          const parentId = event.parent_media_id || event.id
          const { data: threadChainData, error } = await getThreadChainByParentId(parentId)

          if (error) {
            console.error('Error loading thread chain:', error)
            setThreads([{
              content: event.title,
              media_urls: event.media_urls || [],
              media_type: event.media_type
            }])
          } else if (threadChainData && threadChainData.length > 0) {
            const threads: ThreadContent[] = threadChainData.map(thread => ({
              content: thread.content,
              media_urls: thread.media_urls || [],
              media_type: thread.media_type || 'TEXT'
            }))
            setThreads(threads)
          } else {
            setThreads([{
              content: event.title,
              media_urls: event.media_urls || [],
              media_type: event.media_type
            }])
          }
        } catch (error) {
          console.error('Error loading thread chain:', error)
          setThreads([{
            content: event.title,
            media_urls: event.media_urls || [],
            media_type: event.media_type
          }])
        } finally {
          setIsLoadingThreads(false)
        }
      } else {
        setThreads([])
      }

      // Load media insights if the post is posted
      console.log('ViewPostModal: Checking if should load insights', {
        status: event.status,
        parent_media_id: event.parent_media_id,
        currentSocialId
      })
      
      if (event.status === 'posted' && event.parent_media_id) {
        console.log('ViewPostModal: Loading insights for media ID:', event.parent_media_id)
        setIsLoadingInsights(true)
        try {
          const response = await fetch(`/api/threads/insights/${event.parent_media_id}`, {
            headers: {
              'x-social-id': currentSocialId || ''
            }
          })

          console.log('ViewPostModal: Insights API response status:', response.status)

          if (response.ok) {
            const data = await response.json()
            console.log('ViewPostModal: Insights data received:', data)
            setInsights(data.insights)
          } else {
            const errorText = await response.text()
            console.error('ViewPostModal: Insights API error response:', errorText)
          }
        } catch (error) {
          console.error('ViewPostModal: Error loading insights:', error)
        } finally {
          setIsLoadingInsights(false)
        }
      } else {
        console.log('ViewPostModal: Not loading insights - conditions not met', {
          isPosted: event.status === 'posted',
          hasMediaId: !!event.parent_media_id
        })
      }
    }

    loadData()
  }, [event, currentSocialId])

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{t('title', { defaultMessage: 'Post Insights' })}</DialogTitle>
            {/* Post Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{format(event.date, 'PPP')}</span>
              <span className="font-medium">{event.time}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Insights Section - Always show for posted content */}
          {event.status === 'posted' && (
            <div className="bg-muted/50 rounded-lg p-4">
              {isLoadingInsights ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="flex flex-col items-center p-2 bg-background rounded-lg">
                    <Eye className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">{insights?.views?.toLocaleString() || '0'}</span>
                    <span className="text-xs text-muted-foreground">{t('views', { defaultMessage: 'Views' })}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-background rounded-lg">
                    <Heart className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">{insights?.likes?.toLocaleString() || '0'}</span>
                    <span className="text-xs text-muted-foreground">{t('likes', { defaultMessage: 'Likes' })}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-background rounded-lg">
                    <MessageCircle className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">{insights?.replies?.toLocaleString() || '0'}</span>
                    <span className="text-xs text-muted-foreground">{t('replies', { defaultMessage: 'Replies' })}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-background rounded-lg">
                    <Repeat2 className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">{insights?.reposts?.toLocaleString() || '0'}</span>
                    <span className="text-xs text-muted-foreground">{t('reposts', { defaultMessage: 'Reposts' })}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-background rounded-lg">
                    <Share2 className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-semibold">{insights?.shares?.toLocaleString() || '0'}</span>
                    <span className="text-xs text-muted-foreground">{t('shares', { defaultMessage: 'Shares' })}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Display */}
          <div className="space-y-4">
            {isLoadingThreads ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : event.is_thread_chain && threads.length > 0 ? (
              <ThreadChain
                threads={threads}
                username={currentUsername || ''}
                readOnly={true}
              />
            ) : (
              <PostCard
                content={content}
                media={event.media_urls || []}
                username={currentUsername || ''}
                onContentChange={() => { }}
                readOnly={true}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}