'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Badge, getStatusBadgeVariant } from './badge'
import { ChevronDown, Loader2 } from 'lucide-react'

interface InlineStatusSelectProps {
  value: string
  options: readonly string[]
  onChange: (newValue: string) => Promise<void>
  disabled?: boolean
}

const MENU_HEIGHT_ESTIMATE = 240 // px — used to decide whether to open up or down

export function InlineStatusSelect({ value, options, onChange, disabled }: InlineStatusSelectProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0, openUp: false })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const openMenu = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < MENU_HEIGHT_ESTIMATE && rect.top > MENU_HEIGHT_ESTIMATE
    setPos({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUp,
    })
    setOpen(true)
  }

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    const closeOnScroll = () => setOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
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

  const menu = open ? (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        zIndex: 9999,
        right: pos.right,
        ...(pos.openUp
          ? { bottom: window.innerHeight - pos.top }
          : { top: pos.top }),
      }}
      className="glass-pop rounded-xl py-1 min-w-[160px]"
    >
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
  ) : null

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        onClick={() => { if (!disabled && !saving) open ? setOpen(false) : openMenu() }}
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
          <ChevronDown size={11} className="text-[#9a8a72] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </button>
      {typeof document !== 'undefined' && menu && createPortal(menu, document.body)}
    </div>
  )
}
