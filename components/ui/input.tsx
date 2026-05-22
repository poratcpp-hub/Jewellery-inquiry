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
        'flex h-10 w-full rounded-lg border border-[#e5ddd0] bg-white px-3 py-2 text-sm text-[#1a1209] placeholder:text-[#7a6a52]/60 focus:outline-none focus:ring-2 focus:ring-[#b8934a] focus:ring-offset-0 focus:border-[#b8934a] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        error && 'border-red-400 focus:ring-red-400 focus:border-red-400',
        className
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
