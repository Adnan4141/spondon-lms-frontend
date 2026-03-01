import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes intelligently.
 * Uses clsx for conditional classes and twMerge to resolve conflicts.
 * This is the standard utility used by all shadcn/ui components for customization.
 * 
 * @example
 * cn("px-2 py-1", "px-4") // Returns "py-1 px-4" (px-2 is overridden by px-4)
 * cn("bg-red-500", isActive && "bg-blue-500") // Conditionally applies classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
