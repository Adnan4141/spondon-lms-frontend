"use client"

import { useState, useCallback } from "react"
import type { ToastProps } from "@/components/ui/toast"

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback(
    ({ title, description, variant = "default" }: Omit<ToastProps, "id" | "onClose">) => {
      const id = Math.random().toString(36).substring(7)
      const newToast: ToastProps = { id, title, description, variant }

      setToasts((prev) => [...prev, newToast])

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)

      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toast, toasts, removeToast }
}
