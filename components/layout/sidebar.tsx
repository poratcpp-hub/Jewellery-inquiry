'use client'

import Link from 'next/link'
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
  Gem,
  X,
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
  { href: '/settings', label: 'הגדרות', icon: Settings },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
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
          'fixed top-0 right-0 h-full w-64 bg-[#2c1810] z-40 flex flex-col transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#b8934a] rounded-lg flex items-center justify-center">
              <Gem size={16} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">יהלומי פרמיום</div>
              <div className="text-[#b8934a] text-xs">ניהול עסקי</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
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
                        ? 'bg-[#b8934a] text-white shadow-sm'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
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
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-xs text-white/40 text-center">
            © 2025 מערכת ניהול תכשיטים
          </div>
        </div>
      </aside>
    </>
  )
}
