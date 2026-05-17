'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-[#e5ddd0] bg-white px-3 py-2 text-sm text-[#1a1209] placeholder:text-[#7a6a52]/60 focus:outline-none focus:ring-2 focus:ring-[#b8934a] focus:border-[#b8934a] disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
