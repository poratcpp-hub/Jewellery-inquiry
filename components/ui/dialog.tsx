'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir="rtl">
      <div
        className="absolute inset-0 bg-[#1a1209]/50 backdrop-blur-sm animate-overlay-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 bg-white rounded-2xl shadow-pop ring-1 ring-sand/60 w-full max-h-[90vh] overflow-y-auto animate-dialog-in',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  title: string
  onClose: () => void
}

export function DialogHeader({ title, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-sand-soft">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-[#7a6a52] hover:bg-[#f5efe0] hover:text-[#2c1810] transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}

export function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  )
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 p-6 border-t border-sand-soft bg-cream rounded-b-2xl">
      {children}
    </div>
  )
}
