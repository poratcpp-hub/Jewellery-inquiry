'use client'

import * as React from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextValue {
  toasts: ToastMessage[]
  toast: (msg: Omit<ToastMessage, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = React.useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...msg, id }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return React.useContext(ToastContext)
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-emerald-600 shrink-0" />,
  error:   <XCircle    size={18} className="text-red-600 shrink-0" />,
  warning: <AlertCircle size={18} className="text-amber-600 shrink-0" />,
  info:    <Info       size={18} className="text-blue-600 shrink-0" />,
}

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-200/70 bg-emerald-50/85',
  error:   'border-red-200/70 bg-red-50/85',
  warning: 'border-amber-200/70 bg-amber-50/85',
  info:    'border-blue-200/70 bg-blue-50/85',
}

function ToastContainer({ toasts, dismiss }: { toasts: ToastMessage[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2 max-w-sm w-full" dir="rtl">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 p-3.5 rounded-xl border shadow-pop backdrop-blur-xl animate-toast-in',
            STYLES[t.type]
          )}
        >
          {ICONS[t.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#2c1810]">{t.title}</p>
            {t.description && (
              <p className="text-xs text-[#7a6a52] mt-0.5">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-[#7a6a52] hover:text-[#2c1810] shrink-0 p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
