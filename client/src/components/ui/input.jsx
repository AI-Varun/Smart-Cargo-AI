import { cn } from "../../lib/utils"

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300", // Changed border color
        "px-3 py-2 text-sm text-gray-900 bg-white", // Changed text and background color
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}