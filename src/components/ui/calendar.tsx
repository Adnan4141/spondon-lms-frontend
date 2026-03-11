"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  mode?: "single" | "multiple" | "range"
  initialFocus?: boolean
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function buildMonthGrid(month: Date): Array<Date | null> {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const firstWeekday = firstDay.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function isSameDay(a?: Date, b?: Date) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(() =>
    selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  )

  React.useEffect(() => {
    if (selected) {
      setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
    }
  }, [selected])

  const grid = buildMonthGrid(month)
  const monthLabel = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
  const today = new Date()

  return (
    <div className={cn("p-2", className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "h-7 w-7")}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </button>
        <p className="text-sm font-medium">{monthLabel}</p>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "h-7 w-7")}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs text-muted-foreground">
            {label}
          </div>
        ))}
        {grid.map((dateCell, idx) => {
          if (!dateCell) {
            return <div key={`blank-${idx}`} className="h-8 w-8" />
          }

          const isSelected = isSameDay(dateCell, selected)
          const isToday = isSameDay(dateCell, today)

          return (
            <button
              key={dateCell.toISOString()}
              type="button"
              onClick={() => onSelect?.(dateCell)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "h-8 w-8 rounded-md text-sm",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                !isSelected && isToday && "border border-border"
              )}
            >
              {dateCell.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
