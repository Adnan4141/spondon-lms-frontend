"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addYears, subYears, setMonth, setYear } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MonthPickerProps {
  value?: string // YYYY-MM
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export function MonthPicker({ value, onChange, placeholder = "Pick a month", className, disabled }: MonthPickerProps) {
  const [date, setDate] = React.useState<Date>(() => {
    if (value) {
      const [year, month] = value.split("-").map(Number)
      return new Date(year, month - 1, 1)
    }
    return new Date()
  })

  const [viewDate, setViewDate] = React.useState<Date>(date)

  React.useEffect(() => {
    if (value) {
      const [year, month] = value.split("-").map(Number)
      setDate(new Date(year, month - 1, 1))
      setViewDate(new Date(year, month - 1, 1))
    }
  }, [value])

  const handleMonthSelect = (monthIdx: number) => {
    const newDate = setMonth(viewDate, monthIdx)
    setDate(newDate)
    onChange(format(newDate, "yyyy-MM"))
  }

  const handleYearChange = (offset: number) => {
    setViewDate(addYears(viewDate, offset))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner",
            !value && "text-slate-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
          {value ? format(date, "MMMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4 rounded-[24px] border-slate-200 shadow-2xl" align="start">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => handleYearChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-black text-sm uppercase tracking-widest text-indigo-600">
            {format(viewDate, "yyyy")}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => handleYearChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, idx) => {
            const isSelected = date.getMonth() === idx && date.getFullYear() === viewDate.getFullYear() && !!value
            return (
              <Button
                key={month}
                variant="ghost"
                className={cn(
                  "h-10 rounded-xl font-bold text-xs uppercase tracking-tighter transition-all",
                  isSelected 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                )}
                onClick={() => handleMonthSelect(idx)}
              >
                {month}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
