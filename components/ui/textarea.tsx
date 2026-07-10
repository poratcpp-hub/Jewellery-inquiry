'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink-deep shadow-[inset_0_1px_2px_rgba(26,18,9,0.03)] placeholder:text-clay/50 focus:outline-none focus:ring-2 focus:ring-gold-500/35 focus:border-gold-500 disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow] duration-200 resize-none',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
