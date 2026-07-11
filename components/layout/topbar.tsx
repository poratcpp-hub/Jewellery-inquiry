'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Target, FileText, ShoppingBag, TrendingUp,
  Truck, Calendar, Settings, Bell, LogOut, User, Plus, AlertTriangle, Clock,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getLeads, getQuotes } from '@/lib/data'

const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

const navItems = [
  { href: '/', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/customers', label: 'לקוחות', icon: Users },
  { href: '/leads', label: 'לידים', icon: Target },
  { href: '/quotes', label: 'הצעות מחיר', icon: FileText },
  { href: '/orders', label: 'הזמנות', icon: ShoppingBag },
  { href: '/financials', label: 'כספים', icon: TrendingUp },
  { href: '/suppliers', label: 'ספקים', icon: Truck },
  { href: '/calendar', label: 'מסירות', icon: Calendar },
  { href: '/settings', label: 'הגדרות', icon: Settings },
]

interface Alert {
  id: string
  type: 'overdue' | 'expiring' | 'delivery'
  title: string
  subtitle: string
  href: string
}

interface TopbarProps {
  title?: string
  onNewInquiry?: () => void
}

/**
 * Floating dark pill navigation — the whole menu lives in one rounded
 * capsule at the top; the active page is a gold pill with its label,
 * inactive pages collapse to icon chips on narrower screens.
 */
export function Topbar({ onNewInquiry }: TopbarProps) {
  const pathname = usePathname()
  const today = formatDate(new Date().toISOString())
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const activeNavRef = useRef<HTMLAnchorElement>(null)

  // Keep the active pill visible when the nav overflows on small screens
  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [pathname])

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
    <header className="sticky top-0 z-30 border-b border-sand/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="hidden shrink-0 sm:block">
          <Image src="/porat-logo.svg" alt="PORAT Private Jeweler" width={104} height={42} priority />
        </Link>

        {/* Floating dark pill menu */}
        <nav className="no-scrollbar min-w-0 flex-1 overflow-x-auto py-2">
          <div className="mx-auto flex w-max items-center gap-0.5 rounded-full bg-gradient-to-b from-[#2c1810] to-[#1d0f07] p-1.5 shadow-pop ring-1 ring-white/10">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={isActive ? activeNavRef : undefined}
                  title={item.label}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-b from-gold-400 to-gold-500 text-white shadow-gold [text-shadow:0_1px_1px_rgba(90,64,20,0.3)]'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className={cn(!isActive && 'hidden xl:inline')}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Action cluster — round chips like the reference */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {IS_DEMO && (
            <span className="hidden items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 lg:inline-flex">
              Demo
            </span>
          )}
          <span className="hidden text-sm text-clay 2xl:block">{today}</span>

          {onNewInquiry && (
            <button
              onClick={onNewInquiry}
              title="ליד חדש"
              className="flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-b from-gold-400 to-gold-600 px-3 text-sm font-medium text-white shadow-gold transition-all duration-200 hover:-translate-y-px hover:shadow-gold-hover active:translate-y-0 sm:px-4 [text-shadow:0_1px_1px_rgba(90,64,20,0.3)]"
            >
              <Plus size={16} />
              <span className="hidden md:inline">ליד חדש</span>
            </button>
          )}

          {/* Notification bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(v => !v)}
              title="התראות"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-white text-ink-soft shadow-card transition-all duration-200 hover:border-gold-300 hover:text-gold-600"
            >
              <Bell size={17} />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white ring-2 ring-cream">
                  {alerts.length > 9 ? '9+' : alerts.length}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute left-0 mt-2 w-80 overflow-hidden rounded-xl border border-sand bg-white shadow-pop animate-dialog-in z-50">
                <div className="flex items-center justify-between border-b border-[#f0ebe0] px-4 py-2.5">
                  <p className="text-sm font-semibold text-[#2c1810]">התראות</p>
                  {alerts.length > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{alerts.length}</span>
                  )}
                </div>
                {alerts.length === 0 ? (
                  <div className="py-6 text-center text-sm text-[#7a6a52]">אין התראות 🎉</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {alerts.map(alert => (
                      <Link key={alert.id} href={alert.href} onClick={() => setBellOpen(false)}>
                        <div className="flex items-start gap-2.5 border-b border-[#f0ebe0] px-4 py-3 transition-colors last:border-0 hover:bg-[#faf8f5]">
                          {alertIcon(alert.type)}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#2c1810]">{alert.title}</p>
                            <p className="mt-0.5 text-xs text-[#7a6a52]">{alert.subtitle}</p>
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
              title="חשבון"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 ring-2 ring-gold-200/70 transition-transform duration-200 hover:scale-105"
            >
              <User size={15} className="text-white" />
            </button>

            {menuOpen && !IS_DEMO && (
              <div className="absolute left-0 mt-2 w-52 overflow-hidden rounded-xl border border-sand bg-white py-1 shadow-pop animate-dialog-in z-50">
                {userEmail && (
                  <div className="border-b border-[#f0ebe0] px-4 py-2.5">
                    <p className="text-xs text-[#7a6a52]">מחובר כ</p>
                    <p className="truncate text-sm font-medium text-[#2c1810]">{userEmail}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={15} />
                  יציאה מהמערכת
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
