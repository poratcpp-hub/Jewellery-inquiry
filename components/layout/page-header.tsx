import * as React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 animate-rise-in">
      <div>
        <h1 className="font-display text-[1.7rem] leading-tight font-semibold text-ink">{title}</h1>
        <div className="mt-1.5 mb-1 h-0.5 w-10 rounded-full bg-gradient-to-l from-gold-400 to-gold-600" />
        {description && (
          <p className="text-sm text-clay mt-1.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
