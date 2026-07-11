import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center animate-rise-in">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-champagne/90 ring-1 ring-gold-200/60">
          <Compass size={26} className="text-gold-600" />
        </div>
        <p className="font-display text-4xl font-bold text-gold-500">404</p>
        <h1 className="mt-1 font-display text-xl font-semibold text-ink">העמוד לא נמצא</h1>
        <p className="mt-2 text-sm text-clay">
          הקישור שהגעת אליו לא קיים או שהועבר למקום אחר.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-b from-gold-400 to-gold-600 px-5 py-2.5 text-sm font-medium text-white shadow-gold transition-all duration-200 hover:-translate-y-px hover:shadow-gold-hover active:translate-y-0"
          >
            <Home size={15} />
            חזרה לדשבורד
          </Link>
        </div>
      </div>
    </div>
  )
}
