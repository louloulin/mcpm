"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

const ToastContext = React.createContext<{
  toast: (props: ToastProps) => void
}>({
  toast: () => {}
})

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(
    (props: ToastProps) => {
      setToasts((prevToasts) => [...prevToasts, props])
      
      // 3秒后自动移除
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.slice(1))
      }, 3000)
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-0 right-0 p-4 z-50 flex flex-col gap-2">
        {toasts.map((toast, index) => (
          <div
            key={index}
            className={cn(
              "pointer-events-auto rounded-md p-4 max-w-md border shadow-lg transition-all",
              "bg-white text-foreground dark:bg-gray-800 dark:text-gray-100",
              toast.variant === "destructive" && "bg-destructive text-destructive-foreground dark:border-destructive"
            )}
          >
            {toast.title && (
              <div className="font-semibold">{toast.title}</div>
            )}
            {toast.description && (
              <div className="text-sm opacity-90 mt-1">{toast.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
} 