'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink-deep shadow-[inset_0_1px_2px_rgba(26,18,9,0.03)] placeholder:text-clay/50 focus:outline-none focus:ring-2 focus:ring-gold-500/35 focus:ring-offset-0 focus:border-gold-500 disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow] duration-200',
        error && 'border-red-400 focus:ring-red-400 focus:border-red-400',
        className
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
