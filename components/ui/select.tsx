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
        'flex h-10 w-full rounded-lg border border-[#e5ddd0] bg-white px-3 py-2 text-sm text-[#1a1209] focus:outline-none focus:ring-2 focus:ring-[#b8934a] focus:border-[#b8934a] disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer',
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
