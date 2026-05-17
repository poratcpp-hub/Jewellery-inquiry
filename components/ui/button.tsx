'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          {
            'bg-[#b8934a] text-white hover:bg-[#9a7535] focus:ring-[#b8934a] shadow-sm': variant === 'default',
            'border border-[#e5ddd0] bg-white text-[#4a3728] hover:bg-[#f5efe0] hover:border-[#b8934a] focus:ring-[#b8934a]': variant === 'outline',
            'text-[#4a3728] hover:bg-[#f5efe0] focus:ring-[#b8934a]': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm': variant === 'destructive',
            'bg-[#f5efe0] text-[#4a3728] hover:bg-[#e8d5a3] focus:ring-[#b8934a]': variant === 'secondary',
            'text-[#b8934a] underline-offset-4 hover:underline p-0': variant === 'link',
          },
          {
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
            'p-2 h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
