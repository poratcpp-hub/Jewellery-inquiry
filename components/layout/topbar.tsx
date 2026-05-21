'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

interface TopbarProps {
  onMenuClick: () => void
  title?: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const today = formatDate(new Date().toISOString())
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (IS_DEMO) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="h-16 bg-white border-b border-[#e5ddd0] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-[0_1px_4px_rgba(26,18,9,0.04)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-[#4a3728] hover:bg-[#f5efe0] transition-colors"
        >
          <Menu size={20} />
        </button>
        {/* Logo on mobile (sidebar hidden) */}
        <div className="lg:hidden">
          <Image src="/porat-logo.svg" alt="PORAT Private Jeweler" width={110} height={44} priority />
        </div>
        {title && (
          <h1 className="text-base font-semibold text-[#2c1810] hidden lg:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3 mr-auto">
        {IS_DEMO && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
            Demo
          </span>
        )}
        <span className="text-sm text-[#7a6a52] hidden sm:block">{today}</span>
        <button className="relative p-2 rounded-lg text-[#4a3728] hover:bg-[#f5efe0] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#b8934a] rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f5efe0] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#b8934a] flex items-center justify-center shrink-0">
              <User size={14} className="text-white" />
            </div>
            {!IS_DEMO && userEmail && (
              <span className="text-xs text-[#4a3728] hidden md:block max-w-[120px] truncate">{userEmail}</span>
            )}
            {!IS_DEMO && <ChevronDown size={14} className="text-[#7a6a52] hidden md:block" />}
          </button>

          {menuOpen && !IS_DEMO && (
            <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl border border-[#e5ddd0] shadow-lg z-50 py-1 overflow-hidden">
              {userEmail && (
                <div className="px-4 py-2.5 border-b border-[#f0ebe0]">
                  <p className="text-xs text-[#7a6a52]">מחובר כ</p>
                  <p className="text-sm font-medium text-[#2c1810] truncate">{userEmail}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                יציאה מהמערכת
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
