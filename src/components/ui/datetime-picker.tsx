"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock, ChevronDown } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({ date, setDate, placeholder = "Pick date and time", className }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  
  const hour = date ? format(date, "HH") : "00"
  const minute = date ? format(date, "mm") : "00"

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
    }
  }, [date])

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d)
    if (d) {
      const newDateTime = new Date(d)
      newDateTime.setHours(parseInt(hour))
      newDateTime.setMinutes(parseInt(minute))
      setDate(newDateTime)
    } else {
      setDate(undefined)
    }
  }

  const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
    if (selectedDate) {
      const newDateTime = new Date(selectedDate)
      if (type === 'hour') {
        newDateTime.setHours(parseInt(value))
      } else {
        newDateTime.setMinutes(parseInt(value))
      }
      setDate(newDateTime)
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

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
        <div className="p-4 border-t border-slate-100 flex items-center gap-4">
          <Clock className="h-4 w-4 text-slate-400" />
          <div className="flex items-center gap-2">
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hour</p>
                <Select value={hour} onValueChange={(v) => handleTimeChange('hour', v)}>
                   <SelectTrigger className="h-9 w-[70px] rounded-xl border-slate-200 bg-slate-50 font-bold">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="max-h-[200px] rounded-xl border-slate-200 shadow-xl">
                      {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
             <span className="mt-4 font-black text-slate-300">:</span>
             <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Min</p>
                <Select value={minute} onValueChange={(v) => handleTimeChange('minute', v)}>
                   <SelectTrigger className="h-9 w-[70px] rounded-xl border-slate-200 bg-slate-50 font-bold">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="max-h-[200px] rounded-xl border-slate-200 shadow-xl">
                      {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                   </SelectContent>
                </Select>
             </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
