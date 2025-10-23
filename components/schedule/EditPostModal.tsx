'use client'

import { useState, useEffect, useRef } from 'react'
import useSocialAccountStore from '@/stores/useSocialAccountStore'
import { Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/PostCard'
import { ThreadChain } from '@/components/ThreadChain'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownTime } from '@/components/ui/dropdown-time'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Event } from './types'
import { ThreadContent, getThreadChainByParentId } from '@/app/actions/threadChain'
import { localTimeToUTCISO } from '@/lib/utils/time'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { DropdownDate } from '../ui/dropdown-date'

interface EditPostModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  event: Event | null
  onEventUpdate: (updatedEvent: Event) => void
  onEventDelete: (eventId: string) => void
}

export function EditPostModal({
  isOpen,
  onOpenChange,
  event,
  onEventUpdate,
  onEventDelete,
}: EditPostModalProps) {
  const t = useTranslations('editPostModal');
  const [editContent, setEditContent] = useState('')
  const [editThreads, setEditThreads] = useState<ThreadContent[]>([])
  const [editTime, setEditTime] = useState('')
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false)
  const timeSectionRef = useRef<HTMLDivElement>(null)
  const { currentUsername } = useSocialAccountStore()

  useEffect(() => {
    async function loadThreadChainData() {
      if (!event) {
        setEditContent('')
        setEditThreads([])
        setEditTime('')
        setEditDate(undefined)
        return
      }

      setEditContent(event.title)
      setEditTime(event.time)
      setEditDate(event.date)

      // Load complete thread chain data if this is a thread chain
      if (event.is_thread_chain) {
        setIsLoadingThreads(true)
        try {
          // For thread chains, use parent_media_id if available, or the event's own id if it's the first thread
          const parentId = event.parent_media_id || event.id
          console.log('Loading thread chain for parentId:', parentId, 'event:', event)
          const { data: threadChainData, error } = await getThreadChainByParentId(parentId)
          console.log('Thread chain data received:', threadChainData, 'error:', error)

          if (error) {
            console.error('Error loading thread chain:', error)
            // Fallback to single thread
            setEditThreads([{
              content: event.title,
              media_urls: event.media_urls || [],
              media_type: event.media_type
            }])
          } else if (threadChainData && threadChainData.length > 0) {
            // Convert database records to ThreadContent format
            const threads: ThreadContent[] = threadChainData.map(thread => ({
              content: thread.content,
              media_urls: thread.media_urls || [],
              media_type: thread.media_type || 'TEXT'
            }))
            setEditThreads(threads)
          } else {
            // Fallback to single thread
            setEditThreads([{
              content: event.title,
              media_urls: event.media_urls || [],
              media_type: event.media_type
            }])
          }
        } catch (error) {
          console.error('Error loading thread chain:', error)
          // Fallback to single thread
          setEditThreads([{
            content: event.title,
            media_urls: event.media_urls || [],
            media_type: event.media_type
          }])
        } finally {
          setIsLoadingThreads(false)
        }
      } else {
        // Single post
        setEditThreads([{
          content: event.title,
          media_urls: event.media_urls || [],
          media_type: event.media_type
        }])
      }
    }

    loadThreadChainData()
  }, [event])

  useEffect(() => {
    if (isOpen && timeSectionRef.current) {
      setTimeout(() => {
        timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isOpen]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!event) return false

    // Check time change
    if (editTime !== event.time) return true

    // Check date change
    if (editDate && event.date) {
      if (editDate.getTime() !== event.date.getTime()) return true
    } else if (editDate !== event.date) {
      return true
    }

    // Check content changes
    if (event.is_thread_chain) {
      // For thread chains, check if any thread content changed
      const originalThreads = event.threads || [{
        content: event.title,
        media_urls: event.media_urls || [],
        media_type: event.media_type
      }]

      if (editThreads.length !== originalThreads.length) return true

      for (let i = 0; i < editThreads.length; i++) {
        if (editThreads[i].content !== originalThreads[i]?.content) return true
      }
    } else {
      // For single posts, check content change
      if (editContent !== event.title) return true
    }

    return false
  }

  // Handle modal close with unsaved changes check
  const handleModalClose = (open: boolean) => {
    if (!open && hasUnsavedChanges()) {
      // If trying to close and there are unsaved changes, show confirmation dialog
      setIsUnsavedChangesDialogOpen(true)
      return // Don't close the modal
    }

    // If no changes or opening modal, proceed normally
    onOpenChange(open)
  }


  const handleSaveChanges = async () => {
    if (!event || !editDate) return

    if (!editTime || typeof editTime !== 'string') {
      console.error("Invalid edit time format:", editTime);
      return;
    }

    const timeParts = editTime.split(':');
    if (timeParts.length !== 2) {
      console.error("Invalid edit time format:", editTime);
      return;
    }

    const utcDateTime = localTimeToUTCISO(editTime, new Date(editDate))
    const newDate = new Date(utcDateTime)

    const currentTime = new Date()
    if (newDate <= currentTime) {
      toast.error(t('futureTimeRequired'))
      return
    }

    const updatedEvent: Event = {
      ...event,
      title: event.is_thread_chain ? editThreads[0]?.content || '' : editContent,
      time: editTime,
      date: newDate,
      threads: event.is_thread_chain ? editThreads : undefined
    }

    try {
      await onEventUpdate(updatedEvent)
      toast.success(t('scheduleUpdated'))
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Update failed.')
    }
  }

  // Thread chain handlers
  const updateThreadContent = (index: number, content: string) => {
    setEditThreads(prev => prev.map((thread, i) =>
      i === index ? { ...thread, content } : thread
    ))
    // Update editContent for single posts
    if (index === 0) {
      setEditContent(content)
    }
  }

  const updateThreadMedia = (index: number, media_urls: string[]) => {
    setEditThreads(prev => prev.map((thread, i) =>
      i === index ? {
        ...thread,
        media_urls,
        media_type: media_urls.length > 1 ? 'CAROUSEL' : media_urls.length === 1 ? 'IMAGE' : 'TEXT'
      } : thread
    ))
  }

  const addNewThread = () => {
    setEditThreads(prev => [...prev, { content: '', media_urls: [], media_type: 'TEXT' }])
  }

  const removeThread = (index: number) => {
    if (editThreads.length <= 1) return
    setEditThreads(prev => prev.filter((_, i) => i !== index))
  }

  const handleDelete = () => {
    if (!event) return
    onEventDelete(event.id) // 삭제 요청
  }

  if (!event) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              {t('title')}
              {event.status === 'failed' && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  {t('failedStatus')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>



          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="py-4">
              {isLoadingThreads ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">{t('loadingThreadChain')}</div>
                </div>
              ) : event?.is_thread_chain ? (
                <ThreadChain
                  threads={editThreads}
                  variant="writing"
                  username={currentUsername || t('fallbackUsername')}
                  onThreadContentChange={updateThreadContent}
                  onThreadMediaChange={updateThreadMedia}
                  onAddThread={addNewThread}
                  onRemoveThread={removeThread}
                />
              ) : (
                <PostCard
                  variant="writing"
                  username={currentUsername || t('fallbackUsername')}
                  content={editContent}
                  onContentChange={setEditContent}
                />
              )}
            </div>
          </div>

          <DialogFooter className="justify-between items-center pt-4 border-t flex-shrink-0">
            <div className="flex-col gap-2 w-full">

              {/* Preview */}
              <div className="w-2/3 mb-3 ml-auto">
                {/* <p className="text-sm text-muted-foreground mb-3">{t('scheduledFor')}</p> */}
                <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                  <DropdownDate
                    className="w-full bg-transparent"
                    value={editDate ? format(editDate, 'yyyy-MM-dd') : undefined}
                    onValueChange={(date) => setEditDate(date ? new Date(date) : undefined)}
                    placeholder={t('selectDate')}
                    disabledDates={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />

                  <span className="text-muted-foreground">at</span>

                  <DropdownTime
                    className="bg-transparent"
                    value={editTime}
                    onValueChange={setEditTime}
                    placeholder={t('timePlaceholder')}
                  />
                </div>
              </div>
              <div className="flex justify-between w-full">
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('deleteSchedule')}
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleModalClose(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnsavedChangesDialogOpen} onOpenChange={setIsUnsavedChangesDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('unsavedChanges')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {t('unsavedChangesMessage')}
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsUnsavedChangesDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={() => {
              setIsUnsavedChangesDialogOpen(false)
              onOpenChange(false)
            }}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
