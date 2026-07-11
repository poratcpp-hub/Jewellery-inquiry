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
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer active:translate-y-0 active:scale-[0.99]',
          {
            'bg-gradient-to-b from-gold-400 to-gold-500 text-white shadow-gold hover:shadow-gold-hover hover:-translate-y-px hover:from-gold-300 hover:to-gold-500 focus:ring-gold-500 [text-shadow:0_1px_1px_rgba(90,64,20,0.25)]': variant === 'default',
            'border border-sand bg-white text-ink-soft shadow-card hover:bg-champagne hover:border-gold-400 hover:-translate-y-px hover:shadow-card-hover focus:ring-gold-500': variant === 'outline',
            'text-ink-soft hover:bg-champagne focus:ring-gold-500': variant === 'ghost',
            'bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500 shadow-sm hover:-translate-y-px': variant === 'destructive',
            'bg-champagne text-ink-soft hover:bg-gold-100 focus:ring-gold-500': variant === 'secondary',
            'text-gold-600 underline-offset-4 hover:underline p-0': variant === 'link',
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
