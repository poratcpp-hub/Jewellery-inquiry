import type { Metadata, Viewport } from 'next'
import { Heebo, Frank_Ruhl_Libre } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { RegisterServiceWorker } from '@/components/pwa/register-sw'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
})

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-frank-ruhl',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PORAT Private Jeweler | CRM',
  description: 'מערכת ניהול CRM לעסק PORAT Private Jeweler',
  applicationName: 'PORAT',
  appleWebApp: {
    capable: true,
    title: 'PORAT',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/apple-icon-180.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#e9e0cf',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frankRuhl.variable}`}>
      <body className="min-h-screen bg-cream antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  )
}
