import { formatCurrency } from '@/lib/utils'

export interface CashflowMonth {
  label: string
  income: number
  expense: number
}

/**
 * Grouped bar chart: income vs expenses per month over the last 6 months.
 * Pure CSS bars — no chart library.
 */
export function CashflowChart({ data }: { data: CashflowMonth[] }) {
  const max = Math.max(1, ...data.map(d => Math.max(d.income, d.expense)))
  const h = (v: number) => `${Math.max((v / max) * 100, v > 0 ? 3 : 0)}%`

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">תזרים מזומנים</h3>
          <p className="mt-0.5 text-xs text-clay">הכנסות מול הוצאות · 6 חודשים אחרונים</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-gold-400 to-gold-600" />
            הכנסות
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-taupe" />
            הוצאות
          </span>
        </div>
      </div>

      <div className="flex h-44 items-end gap-2 border-b border-sand-soft pb-px sm:gap-4">
        {data.map(m => (
          <div key={m.label} className="group flex h-full flex-1 flex-col justify-end">
            <div className="flex h-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t-md bg-gradient-to-b from-gold-400 to-gold-600 opacity-90 transition-all duration-300 group-hover:opacity-100 sm:w-4"
                style={{ height: h(m.income) }}
                title={`הכנסות ${m.label}: ${formatCurrency(m.income)}`}
              />
              <div
                className="w-3 rounded-t-md bg-taupe/70 transition-all duration-300 group-hover:bg-taupe sm:w-4"
                style={{ height: h(m.expense) }}
                title={`הוצאות ${m.label}: ${formatCurrency(m.expense)}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {data.map(m => (
          <div key={m.label} className="flex-1 text-center text-[11px] font-medium text-clay">{m.label}</div>
        ))}
      </div>
    </div>
  )
}
