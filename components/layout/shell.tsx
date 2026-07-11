'use client'

import { useState } from 'react'
import { Topbar } from './topbar'
import { InquiryForm } from '@/components/inquiry/inquiry-form'

export function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
  const [inquiryOpen, setInquiryOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden" dir="rtl">
      <Topbar title={title} onNewInquiry={() => setInquiryOpen(true)} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {children}
      </main>
      <InquiryForm open={inquiryOpen} onClose={() => setInquiryOpen(false)} />
    </div>
  )
}
