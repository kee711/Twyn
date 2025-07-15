'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  placeholder = "시간 선택",
  className,
  disabled = false
}: DropdownTimeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const validateTime = (timeString: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    return timeRegex.test(timeString)
  }

  const formatTime = (timeString: string): string => {
    const parts = timeString.split(':')
    if (parts.length === 2) {
      const hour = parseInt(parts[0], 10)
      const minute = parseInt(parts[1], 10)
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    }
    return timeString
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    if (validateTime(newValue)) {
      const formattedTime = formatTime(newValue)
      onValueChange(formattedTime)
    }
  }

  const handleInputBlur = () => {
    if (validateTime(inputValue)) {
      const formattedTime = formatTime(inputValue)
      setInputValue(formattedTime)
      onValueChange(formattedTime)
    } else if (inputValue && !validateTime(inputValue)) {
      // 잘못된 형식이면 원래 값으로 되돌림
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
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn("w-[120px] pr-8")}
          disabled={disabled}
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          type="button"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-[60] w-full mt-1 bg-popover border border-border rounded-md shadow-md">
          <div className="max-h-[200px] overflow-y-auto">
            {timeOptions.map((timeString) => (
              <button
                key={timeString}
                className="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-md last:rounded-b-md"
                onClick={() => handleTimeSelect(timeString)}
                type="button"
              >
                {timeString}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}