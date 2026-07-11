'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[App error boundary]', error)
  }, [error])

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center animate-rise-in">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50/90 ring-1 ring-red-100">
          <AlertTriangle size={26} className="text-red-500" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">משהו השתבש</h1>
        <p className="mt-2 text-sm text-clay">
          אירעה שגיאה לא צפויה. הנתונים שלך בטוחים — נסה לרענן את העמוד.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-taupe">קוד שגיאה: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => unstable_retry()}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-gold transition-all duration-200 hover:-translate-y-px hover:shadow-gold-hover active:translate-y-0"
          >
            <RotateCcw size={15} />
            נסה שוב
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-5 py-2.5 text-sm font-medium text-ink-soft backdrop-blur-md transition-colors hover:text-ink"
          >
            <Home size={15} />
            לדשבורד
          </Link>
        </div>
      </div>
    </div>
  )
}
