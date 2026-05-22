'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge, getStatusBadgeVariant } from './badge'
import { ChevronDown, Loader2 } from 'lucide-react'

interface InlineStatusSelectProps {
  value: string
  options: readonly string[]
  onChange: (newValue: string) => Promise<void>
  disabled?: boolean
}

export function InlineStatusSelect({ value, options, onChange, disabled }: InlineStatusSelectProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = async (option: string) => {
    setOpen(false)
    if (option === value) return
    setSaving(true)
    try {
      await onChange(option)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => { if (!disabled && !saving) setOpen(v => !v) }}
        disabled={disabled || saving}
        className="flex items-center gap-1 group cursor-pointer disabled:cursor-default"
      >
        {saving ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#f0ebe0] text-[#7a6a52]">
            <Loader2 size={10} className="animate-spin" />
            {value}
          </span>
        ) : (
          <Badge variant={getStatusBadgeVariant(value)}>{value}</Badge>
        )}
        {!disabled && !saving && (
          <ChevronDown
            size={11}
            className="text-[#9a8a72] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          />
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white rounded-xl border border-[#e5ddd0] shadow-lg z-50 py-1 min-w-[160px]">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className="w-full text-right px-3 py-1.5 text-sm hover:bg-[#faf8f5] transition-colors flex items-center gap-2"
            >
              <Badge variant={getStatusBadgeVariant(opt)}>{opt}</Badge>
              {opt === value && <span className="mr-auto text-[#b8934a] text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
