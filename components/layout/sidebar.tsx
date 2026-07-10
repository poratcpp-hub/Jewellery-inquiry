'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Target,
  FileText,
  ShoppingBag,
  TrendingUp,
  Truck,
  Settings,
  Calendar,
  X,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/customers', label: 'לקוחות', icon: Users },
  { href: '/leads', label: 'לידים', icon: Target },
  { href: '/quotes', label: 'הצעות מחיר', icon: FileText },
  { href: '/orders', label: 'הזמנות', icon: ShoppingBag },
  { href: '/financials', label: 'הכנסות והוצאות', icon: TrendingUp },
  { href: '/suppliers', label: 'ספקים', icon: Truck },
  { href: '/calendar', label: 'לוח מסירות', icon: Calendar },
  { href: '/settings', label: 'הגדרות', icon: Settings },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  onNewInquiry?: () => void
}

export function Sidebar({ open, onClose, onNewInquiry }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-64 bg-gradient-to-b from-[#231208] via-[#2c1810] to-[#1d0f07] z-40 flex flex-col transition-transform duration-300 border-l border-white/[0.06]',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="relative flex items-center justify-between px-5 py-5 border-b border-white/[0.07]">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold-500/50 to-transparent" />
          <div className="flex-1 flex justify-center">
            <Image
              src="/porat-logo.svg"
              alt="PORAT Private Jeweler"
              width={160}
              height={64}
              className="brightness-0 invert"
              priority
            />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white p-1 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {onNewInquiry && (
            <button
              onClick={() => { onNewInquiry(); onClose?.() }}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 mb-4 rounded-xl bg-gradient-to-b from-gold-400 to-gold-600 text-white font-semibold text-sm shadow-gold hover:shadow-gold-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200 [text-shadow:0_1px_1px_rgba(90,64,20,0.3)]"
            >
              <Plus size={18} className="shrink-0" />
              + ליד חדש
            </button>
          )}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-l from-gold-500/90 to-gold-600/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.25)]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.07] hover:translate-x-[-2px]'
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="mr-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.07]">
          <div className="text-[11px] text-white/35 text-center tracking-[0.2em] uppercase">
            Porat · Private Jeweler
          </div>
        </div>
      </aside>
    </>
  )
}
