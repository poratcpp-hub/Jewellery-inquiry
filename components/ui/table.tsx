import * as React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-[#e5ddd0]', className)} {...props} />
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0 [&_tr]:border-b [&_tr]:border-[#f0ebe0]', className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors hover:bg-[#faf8f5] data-[state=selected]:bg-[#f5efe0]', className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-right text-xs font-semibold text-[#7a6a52] uppercase tracking-wide align-middle bg-[#faf8f5]',
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 text-sm text-[#2c1810] align-middle', className)}
      {...props}
    />
  )
}

interface SortableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey?: string
  activeSortKey?: string | null
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
}

export function SortableHead({ children, sortKey, activeSortKey, sortDir, onSort, className, ...props }: SortableHeadProps) {
  const isActive = sortKey && activeSortKey === sortKey
  const Icon = !isActive ? ChevronsUpDown : sortDir === 'asc' ? ChevronUp : ChevronDown
  return (
    <th
      className={cn(
        'h-10 px-4 text-right text-xs font-semibold text-[#7a6a52] uppercase tracking-wide align-middle bg-[#faf8f5]',
        sortKey && 'cursor-pointer select-none hover:text-[#2c1810]',
        className
      )}
      onClick={() => sortKey && onSort?.(sortKey)}
      {...props}
    >
      <span className="flex items-center gap-1 justify-end">
        {children}
        {sortKey && <Icon size={12} className={isActive ? 'text-[#b8934a]' : 'text-[#c5b8a0]'} />}
      </span>
    </th>
  )
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption className={cn('mt-4 text-sm text-[#7a6a52]', className)} {...props} />
  )
}
