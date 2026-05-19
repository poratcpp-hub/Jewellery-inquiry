'use client'

import { Dialog, DialogHeader, DialogBody, DialogFooter } from './dialog'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'אישור פעולה',
  description = 'האם אתה בטוח שברצונך להמשיך?',
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  variant = 'destructive',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm mx-4">
      <DialogBody className="text-center pt-8 pb-2">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-[#2c1810] mb-2">{title}</h3>
        <p className="text-sm text-[#7a6a52]">{description}</p>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={variant === 'destructive' ? 'destructive' : 'default'} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
