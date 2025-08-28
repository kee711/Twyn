import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { DropdownTime } from "@/components/ui/dropdown-time"
import { DropdownDate } from "@/components/ui/dropdown-date"
import { useTranslations } from 'next-intl'
import { format } from "date-fns"

interface SelectPublishTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (dateTime: string) => void
  currentScheduledTime?: string | null
}

export function SelectPublishTimeDialog({
  open,
  onOpenChange,
  onConfirm,
  currentScheduledTime
}: SelectPublishTimeDialogProps) {
  const t = useTranslations('components.selectPublishTime')

  // Initialize with current time
  const now = new Date()
  const [selectedDate, setSelectedDate] = useState(format(now, 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState(
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  )

  // Popular preset times (9:00 AM, 12:00 PM, 7:00 PM)
  const presetTimes = [
    { label: t('morningTime'), time: '09:00' },
    { label: t('lunchTime'), time: '12:00' },
    { label: t('eveningTime'), time: '19:00' }
  ]

  useEffect(() => {
    // If there's a current scheduled time, parse and set it
    if (currentScheduledTime) {
      try {
        const date = new Date(currentScheduledTime)
        setSelectedDate(format(date, 'yyyy-MM-dd'))
        setSelectedTime(
          `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        )
      } catch (error) {
        console.error("Error parsing scheduled time:", error)
      }
    } else {
      // Reset to current time when dialog opens
      const now = new Date()
      setSelectedDate(format(now, 'yyyy-MM-dd'))
      setSelectedTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      )
    }
  }, [open, currentScheduledTime])

  const handlePresetTimeClick = (time: string) => {
    setSelectedTime(time)
    // If selected date is in the past, move it to today
    const today = format(new Date(), 'yyyy-MM-dd')
    if (selectedDate < today) {
      setSelectedDate(today)
    }
  }

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      // Combine date and time into ISO string
      const dateTime = new Date(`${selectedDate}T${selectedTime}:00`)
      onConfirm(dateTime.toISOString())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('selectPublishTime')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preset time buttons */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('popularTimes')}</p>
            <div className="grid grid-cols-3 gap-2">
              {presetTimes.map((preset) => (
                <Button
                  key={preset.time}
                  variant={selectedTime === preset.time ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetTimeClick(preset.time)}
                  className="w-full"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-3">{t('scheduledFor')}</p>
            <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
              <DropdownDate
                value={selectedDate}
                onValueChange={setSelectedDate}
                placeholder={t('selectDate')}
                disabledDates={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />

              <span className="text-muted-foreground">at</span>

              <DropdownTime
                value={selectedTime}
                onValueChange={setSelectedTime}
                placeholder={t('timePlaceholder')}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
          >
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}