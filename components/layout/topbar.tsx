'use client'

import { Menu, Bell, Gem } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TopbarProps {
  onMenuClick: () => void
  title?: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const today = formatDate(new Date().toISOString())

  return (
    <header className="h-16 bg-white border-b border-[#e5ddd0] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-[0_1px_4px_rgba(26,18,9,0.04)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-[#4a3728] hover:bg-[#f5efe0] transition-colors"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-[#2c1810] hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3 mr-auto">
        <span className="text-sm text-[#7a6a52] hidden sm:block">{today}</span>
        <button className="relative p-2 rounded-lg text-[#4a3728] hover:bg-[#f5efe0] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#b8934a] rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#b8934a] flex items-center justify-center">
            <Gem size={14} className="text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}
