'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, Bell, LogOut, User, ChevronDown, Plus, AlertTriangle, Clock, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getLeads, getQuotes } from '@/lib/data'

const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

interface Alert {
  id: string
  type: 'overdue' | 'expiring' | 'delivery'
  title: string
  subtitle: string
  href: string
}

interface TopbarProps {
  onMenuClick: () => void
  title?: string
  onNewInquiry?: () => void
}

export function Topbar({ onMenuClick, title, onNewInquiry }: TopbarProps) {
  const today = formatDate(new Date().toISOString())
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (IS_DEMO) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => setUserEmail(data.user?.email ?? null))
  }, [])

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    Promise.all([getLeads(), getQuotes()]).then(([leads, quotes]) => {
      const newAlerts: Alert[] = []

      leads.forEach(l => {
        if (!l.follow_up_date || l.lead_status === 'נסגר להזמנה' || l.lead_status === 'לא רלוונטי') return
        const d = new Date(l.follow_up_date)
        d.setHours(0, 0, 0, 0)
        if (d <= today) {
          newAlerts.push({
            id: `lead-${l.id}`,
            type: 'overdue',
            title: `מעקב באיחור: ${l.full_name || '—'}`,
            subtitle: `ליד · תאריך: ${formatDate(l.follow_up_date)}`,
            href: `/leads/${l.id}`,
          })
        }
      })

      quotes.forEach(q => {
        if (!q.valid_until || q.quote_status !== 'נשלחה ללקוח') return
        const d = new Date(q.valid_until)
        d.setHours(0, 0, 0, 0)
        if (d >= today && d <= in7Days) {
          newAlerts.push({
            id: `quote-${q.id}`,
            type: 'expiring',
            title: `הצעה פגה בקרוב: ${q.quote_number}`,
            subtitle: `${q.customers?.full_name || '—'} · ${formatDate(q.valid_until)}`,
            href: `/quotes/${q.id}`,
          })
        }
      })

      setAlerts(newAlerts)
    }).catch(() => {/* silent */})
  }, [])

  useEffect(() => {
    if (!menuOpen && !bellOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen, bellOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const alertIcon = (type: Alert['type']) => {
    if (type === 'overdue') return <AlertTriangle size={13} className="text-red-500 shrink-0" />
    if (type === 'expiring') return <FileText size={13} className="text-amber-500 shrink-0" />
    return <Clock size={13} className="text-blue-500 shrink-0" />
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
        <div className="lg:hidden">
          <Image src="/porat-logo.svg" alt="PORAT Private Jeweler" width={110} height={44} priority />
        </div>
        {title && (
          <h1 className="text-base font-semibold text-[#2c1810] hidden lg:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3 mr-auto">
        {onNewInquiry && (
          <button
            onClick={onNewInquiry}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b8934a] text-white text-sm font-medium hover:bg-[#a07840] transition-colors shadow-sm"
          >
            <Plus size={15} />
            + ליד חדש
          </button>
        )}
        {IS_DEMO && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
            Demo
          </span>
        )}
        <span className="text-sm text-[#7a6a52] hidden sm:block">{today}</span>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(v => !v)}
            className="relative p-2 rounded-lg text-[#4a3728] hover:bg-[#f5efe0] transition-colors"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute left-0 mt-1 w-80 bg-white rounded-xl border border-[#e5ddd0] shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#f0ebe0] flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2c1810]">התראות</p>
                {alerts.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">{alerts.length}</span>
                )}
              </div>
              {alerts.length === 0 ? (
                <div className="py-6 text-center text-sm text-[#7a6a52]">אין התראות 🎉</div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {alerts.map(alert => (
                    <Link key={alert.id} href={alert.href} onClick={() => setBellOpen(false)}>
                      <div className="flex items-start gap-2.5 px-4 py-3 hover:bg-[#faf8f5] transition-colors border-b border-[#f0ebe0] last:border-0">
                        {alertIcon(alert.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2c1810] truncate">{alert.title}</p>
                          <p className="text-xs text-[#7a6a52] mt-0.5">{alert.subtitle}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
