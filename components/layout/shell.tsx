'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { InquiryForm } from '@/components/inquiry/inquiry-form'

export function Shell({ children, title }: { children: React.ReactNode; title?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8f5]" dir="rtl">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewInquiry={() => setInquiryOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} onNewInquiry={() => setInquiryOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
      <InquiryForm open={inquiryOpen} onClose={() => setInquiryOpen(false)} />
    </div>
  )
}
