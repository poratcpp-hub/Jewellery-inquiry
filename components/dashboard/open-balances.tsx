import Link from 'next/link'
import { CheckCircle2, ChevronLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Order } from '@/lib/types'

/**
 * Dark "unpaid balances" panel — deep-brown surface with gold accents,
 * listing the orders with the largest outstanding balance.
 */
export function OpenBalances({ orders }: { orders: Order[] }) {
  const open = orders
    .filter(o => o.balance_due > 0 && o.payment_status !== 'שולם במלואו' && o.order_status !== 'בוטל')
    .sort((a, b) => b.balance_due - a.balance_due)
  const total = open.reduce((s, o) => s + o.balance_due, 0)
  const top = open.slice(0, 5)

  return (
    <div className="glass-dark relative flex h-full flex-col overflow-hidden rounded-2xl p-5">
      {/* faint gold glow in the corner */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-gold-500/15 blur-3xl" />

      <div className="relative mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">יתרות פתוחות</h3>
          <p className="mt-0.5 text-xs text-white/50">תשלומים שממתינים לגביה</p>
        </div>
        <div className="text-left">
          <p className="bg-gradient-to-l from-gold-200 to-gold-400 bg-clip-text text-xl font-bold tabular-nums text-transparent">
            {formatCurrency(total)}
          </p>
          <p className="text-[11px] text-white/40">{open.length} הזמנות</p>
        </div>
      </div>

      {top.length === 0 ? (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <CheckCircle2 size={28} className="text-gold-300" />
          <p className="text-sm font-medium text-white/80">הכל שולם במלואו</p>
          <p className="text-xs text-white/40">אין יתרות פתוחות לגביה</p>
        </div>
      ) : (
        <div className="relative flex-1 space-y-1.5">
          {top.map(o => (
            <Link key={o.id} href={`/orders/${o.id}`} className="block">
              <div className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.04] px-3.5 py-2.5 transition-all duration-200 hover:border-gold-500/40 hover:bg-white/[0.08]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/90">{o.customers?.full_name || o.order_number}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-gold-300/80">{o.order_number} · {o.payment_status}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-gold-200">{formatCurrency(o.balance_due)}</span>
                  <ChevronLeft size={14} className="text-white/30 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-gold-300" />
                </div>
              </div>
            </Link>
          ))}
          {open.length > top.length && (
            <Link href="/orders" className="block pt-1 text-center text-xs text-gold-300/80 transition-colors hover:text-gold-200">
              עוד {open.length - top.length} הזמנות עם יתרה ←
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
