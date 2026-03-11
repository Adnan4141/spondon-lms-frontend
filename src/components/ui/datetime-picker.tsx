"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({ date, setDate, placeholder = "Pick date and time", className }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>(date ? format(date, "HH:mm") : "00:00")

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setTimeValue(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d)
    if (d) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      const newDateTime = new Date(d)
      newDateTime.setHours(hours)
      newDateTime.setMinutes(minutes)
      setDate(newDateTime)
    } else {
      setDate(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours)
      newDateTime.setMinutes(minutes)
      setDate(newDateTime)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-12 rounded-2xl border-slate-200 bg-slate-50/50 px-4 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/40 transition-all shadow-inner",
            !date && "text-slate-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
          {date ? format(date, "PPP p") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-[24px] border-slate-200 shadow-2xl" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="p-4 border-t border-slate-100 flex items-center gap-3">
          <Clock className="h-4 w-4 text-slate-400" />
          <div className="flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Select Time</p>
             <Input
               type="time"
               value={timeValue}
               onChange={handleTimeChange}
               className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold"
             />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
