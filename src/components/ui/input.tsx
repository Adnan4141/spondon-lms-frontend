import * as React from "react"

import { cn } from "@/lib/utils"
import {
  clampNumberInput,
  formatNumberInputValue,
  isDecimalNumberStep,
  normalizeDecimalInput,
  normalizeIntegerInput,
  patchInputEventValue,
} from "@/lib/number-input"

const inputClassName =
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"

function Input({
  className,
  type,
  onWheel,
  onChange,
  onBlur,
  value,
  step,
  min,
  max,
  ...props
}: React.ComponentProps<"input">) {
  const isNumber = type === "number"
  const allowNegative = min !== undefined && min !== "" && Number(min) < 0
  const isDecimal = isNumber && isDecimalNumberStep(step)

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return
    const normalized = isDecimal
      ? normalizeDecimalInput(event.target.value, allowNegative)
      : normalizeIntegerInput(event.target.value, allowNegative)
    onChange(patchInputEventValue(event, normalized))
  }

  const handleNumberBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onChange && (min !== undefined || max !== undefined)) {
      const clamped = clampNumberInput(event.target.value, { min, max, isDecimal })
      if (clamped !== event.target.value) {
        onChange(patchInputEventValue(event as unknown as React.ChangeEvent<HTMLInputElement>, clamped))
      }
    }
    onBlur?.(event)
  }

  if (!isNumber) {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(inputClassName, className)}
        onWheel={onWheel}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        step={step}
        min={min}
        max={max}
        {...props}
      />
    )
  }

  return (
    <input
      type="text"
      inputMode={isDecimal ? "decimal" : "numeric"}
      data-slot="input"
      data-number-input="true"
      className={cn(inputClassName, className)}
      onChange={handleNumberChange}
      onBlur={handleNumberBlur}
      value={formatNumberInputValue(value)}
      step={step}
      min={min}
      max={max}
      {...props}
    />
  )
}

function NumberInput(props: Omit<React.ComponentProps<typeof Input>, "type">) {
  return <Input type="number" {...props} />
}

export { Input, NumberInput }
