'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({ value: '', onChange: () => {} })

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onChange: onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center bg-[#f5efe0] rounded-lg p-1 gap-1',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: activeValue, onChange } = React.useContext(TabsContext)
  const isActive = activeValue === value

  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer',
        isActive
          ? 'bg-white text-[#2c1810] shadow-sm'
          : 'text-[#7a6a52] hover:text-[#4a3728]',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: activeValue } = React.useContext(TabsContext)
  if (activeValue !== value) return null
  return <div className={cn('mt-4', className)}>{children}</div>
}
