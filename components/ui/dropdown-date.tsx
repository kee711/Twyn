'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DropdownDateProps {
  value: string | undefined
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
}

export function DropdownDate({
  value,
  onValueChange,
  placeholder = "Select date",
  className,
  disabled = false,
  disabledDates
}: DropdownDateProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal h-10 px-3",
            "border-gray-300 bg-gray-100 hover:border-gray-400 hover:bg-gray-200",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {value ? (
            format(new Date(value), "MMMM d, yyyy")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[9999]" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => {
            if (date) {
              onValueChange(format(date, 'yyyy-MM-dd'))
              setOpen(false) // Close the popover after selection
            }
          }}
          disabled={disabledDates}
        />
      </PopoverContent>
    </Popover>
  )
}