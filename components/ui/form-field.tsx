import * as React from 'react'
import { Label } from './label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
  htmlFor?: string
}

export function FormField({ label, required, error, children, className, htmlFor }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-red-500 mr-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={cn('grid gap-4', cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3')}>
      {children}
    </div>
  )
}

export function FormSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-sm font-semibold text-[#b8934a] border-b border-[#e5ddd0] pb-2">{title}</h3>
      )}
      {children}
    </div>
  )
}
