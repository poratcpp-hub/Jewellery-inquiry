'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, error, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink-deep shadow-[inset_0_1px_2px_rgba(26,18,9,0.03)] focus:outline-none focus:ring-2 focus:ring-gold-500/35 focus:border-gold-500 disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow] duration-200 cursor-pointer',
        error && 'border-red-400 focus:ring-red-400 focus:border-red-400',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = 'Select'

export { Select }
