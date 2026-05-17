import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'מערכת ניהול תכשיטים | יהלומי פרמיום',
  description: 'מערכת ניהול עסקי לתכשיטי יהלומים',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-[#faf8f5] antialiased">{children}</body>
    </html>
  )
}
