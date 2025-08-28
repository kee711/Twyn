'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Clock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DropdownTimeProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DropdownTime({
  value,
  onValueChange,
  placeholder = "Select time",
  className,
  disabled = false
}: DropdownTimeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Scroll to selected time when dropdown opens
  useEffect(() => {
    if (isOpen && scrollContainerRef.current && value) {
      // Small delay to ensure the popover is fully rendered
      setTimeout(() => {
        const buttons = scrollContainerRef.current?.querySelectorAll('button')
        buttons?.forEach((button) => {
          if (button.textContent === value) {
            button.scrollIntoView({ behavior: 'instant', block: 'center' })
          }
        })
      }, 0)
    }
  }, [isOpen, value])

  const validateTime = (timeString: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    return timeRegex.test(timeString)
  }

  const formatTime = (timeString: string): string => {
    const parts = timeString.split(':')
    if (parts.length === 2) {
      const hour = parseInt(parts[0], 10)
      const minute = parseInt(parts[1], 10)
      if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      }
    }
    return timeString
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Allow only numbers and single colon
    if (!/^[\d:]*$/.test(newValue)) {
      return
    }

    // Prevent multiple colons
    const colonCount = (newValue.match(/:/g) || []).length
    if (colonCount > 1) {
      return
    }

    // Limit to reasonable length (e.g., "23:59" is 5 characters)
    if (newValue.length > 5) {
      return
    }

    // Just update the input value, no formatting or validation during typing
    setInputValue(newValue)
  }

  const handleInputBlur = () => {
    setIsFocused(false)

    if (!inputValue) {
      return
    }

    // Only format and validate on blur
    if (validateTime(inputValue)) {
      const formattedTime = formatTime(inputValue)
      setInputValue(formattedTime)
      onValueChange(formattedTime)
    } else {
      // Reset to original value if invalid format
      setInputValue(value || '')
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  const handleTimeSelect = (selectedTime: string) => {
    setInputValue(selectedTime)
    onValueChange(selectedTime)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const timeOptions = Array.from({ length: 24 }).flatMap((_, hour) =>
    Array.from({ length: 4 }).map((_, minuteIndex) => {
      const minute = minuteIndex * 15
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      return timeString
    })
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "relative inline-flex items-center h-10 px-3 border rounded-xl",
            "border-gray-300 bg-gray-100 hover:border-gray-400 hover:bg-gray-200",
            isFocused && "border-gray-400 bg-gray-200",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground font-normal",
              !inputValue && "text-muted-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation()
              if (!disabled) {
                setIsOpen(true)
              }
            }}
          />
          <ChevronDown className={cn(
            "ml-2 h-4 w-4 flex-shrink-0 text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0 z-[9999]"
        align="start"
        sideOffset={4}
      >
        <div
          ref={scrollContainerRef}
          className="max-h-[200px] overflow-y-auto"
        >
          {timeOptions.map((timeString) => (
            <button
              key={timeString}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground",
                timeString === value && "bg-accent text-accent-foreground font-medium"
              )}
              onClick={() => handleTimeSelect(timeString)}
              type="button"
            >
              {timeString}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}