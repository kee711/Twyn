import { useEffect, useState } from "react"
import { updatePublishTimes } from '@/app/actions/user'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Edit, Plus, Check } from "lucide-react"
import { DropdownTime } from "@/components/ui/dropdown-time"
import { utcTimeToLocalTime, localTimeToUTCTime, isUTCISOString } from "@/lib/utils/time"
import { useTranslations } from 'next-intl'

interface ChangePublishTimeDialogProps {
  variant?: 'default' | 'icon'
  onPublishTimeChange?: () => void
  ondisabled?: boolean
}

export function ChangePublishTimeDialog({ variant = 'default', onPublishTimeChange, ondisabled }: ChangePublishTimeDialogProps) {
  const t = useTranslations('components.rightSidebar');
  const [publishTimes, setPublishTimes] = useState<string[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newTime, setNewTime] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getDBPublishTimes()
  }, [])

  const getDBPublishTimes = async () => {
    const response = await fetch('/api/user/get-publish-times')
    if (!response.ok) {
      console.error('Failed to fetch publish times')
      return
    }

    const dbTimes = await response.json()

    if (!dbTimes || !Array.isArray(dbTimes)) {
      setPublishTimes([])
      return
    }

    const localTimes = dbTimes.map(time => {
      try {
        if (typeof time === 'string' && isUTCISOString(time)) {
          // UTC ISO 문자열인 경우 (예: "2024-01-01T14:30:00.000Z")
          const date = new Date(time)
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        } else if (typeof time === 'string' && time.includes(':')) {
          // UTC HH:MM 형태인 경우 (예: "14:30")
          return utcTimeToLocalTime(time)
        }
        return time
      } catch (error) {
        console.error("Time conversion error:", error, "for time:", time);
        return '00:00';
      }
    })

    setPublishTimes(localTimes)
  }

  const addTime = () => {
    if (newTime) {
      setPublishTimes([...publishTimes, newTime])
      setNewTime('')
    }
  }

  const editTime = (index: number) => {
    setEditingIndex(index)
    setNewTime(publishTimes[index])
  }

  const saveTime = (index: number) => {
    const updatedTimes = [...publishTimes]
    updatedTimes[index] = newTime
    setPublishTimes(updatedTimes)
    setEditingIndex(null)
    setNewTime('')
  }

  const removeTime = (index: number) => {
    setPublishTimes(publishTimes.filter((_, i: number) => i !== index))
  }

  const saveToDatabase = async () => {
    try {
      const utcTimes = publishTimes.map(localTime => {
        try {
          return localTimeToUTCTime(localTime)
        } catch (error) {
          console.error("Time conversion error:", error, "for time:", localTime);
          return '00:00';
        }
      })

      const response = await updatePublishTimes(utcTimes)

      if (!response.success) {
        throw new Error('Failed to save publish times')
      }

      setOpen(false)
      onPublishTimeChange?.()
    } catch (error) {
      console.error('Error saving publish times:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant === 'icon' ? 'default' : 'outline'} disabled={ondisabled} className={`flex items-center gap-2 ${variant === 'icon' ? 'h-full w-8 p-0 rounded-l-sm rounded-r-xl bg-black text-white hover:bg-black/90' : 'text-muted-foreground rounded-xl'}`}>
          {variant === 'icon' ? (
            <Clock className="h-full w-4" />
          ) : (
            <>
              <Clock className="h-4 w-4" />
              <span>게시 시간 변경</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('publishTime')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground mb-2">
            {t('publishTimeDescription')}
          </div>

          {publishTimes.length > 0 ? (
            <div className="space-y-2">
              {publishTimes.map((time: string, index: number) => (
                <div key={index} className="rounded-xl flex items-center justify-between px-4 py-2 bg-muted">
                  {editingIndex === index ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1">
                        <DropdownTime
                          value={newTime}
                          onValueChange={setNewTime}
                          className="w-full"
                        />
                      </div>
                      <Button variant='outline' size='icon' onClick={() => saveTime(index)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant='ghost' size='icon' onClick={() => editTime(index)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant='ghost' size='icon' onClick={() => removeTime(index)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('noSchedule')}
            </div>
          )}

          <div className="flex items-center gap-2 w-full mt-4">
            <div className="flex-1">
              <DropdownTime
                value={newTime}
                onValueChange={setNewTime}
                className="w-full"
              />
            </div>
            <Button variant="outline" onClick={addTime} disabled={!newTime}>
              <Plus className="h-4 w-4 mr-2" />
              <span>{t('add')}</span>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={saveToDatabase} className="w-full">{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 