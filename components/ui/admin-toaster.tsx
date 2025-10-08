"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function AdminToaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="text-sm p-3 min-h-[40px]">
            <div className="grid gap-0.5">
              {title && <ToastTitle className="text-sm font-medium">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs opacity-90">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="h-3 w-3" />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex max-h-screen w-full flex-col-reverse p-2 sm:w-auto sm:max-w-[320px]" />
    </ToastProvider>
  )
}
