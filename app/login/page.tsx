'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (IS_DEMO) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (IS_DEMO) {
      router.push('/')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        console.error(
          '[Auth] signInWithPassword failed' +
          ` | message: ${authError.message}` +
          ` | status: ${authError.status}` +
          ` | name: ${authError.name}`
        )
        // 400 = wrong credentials or email not confirmed
        if (authError.status === 400 || authError.message?.toLowerCase().includes('invalid')) {
          setError('אימייל או סיסמה שגויים. אנא נסה שוב.')
        } else if (authError.message?.toLowerCase().includes('confirm')) {
          setError('יש לאמת את האימייל לפני הכניסה. בדוק את תיבת הדואר שלך.')
        } else {
          setError(`ההתחברות נכשלה: ${authError.message}`)
        }
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('אירעה שגיאה. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md">
        {/* Demo mode banner */}
        {IS_DEMO && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-center text-sm font-medium"
            style={{
              backgroundColor: '#f9edcf',
              color: '#7a5a26',
              border: '1px solid #e8be5e',
            }}
          >
            מצב Demo פעיל — כניסה אוטומטית
          </div>
        )}

        {/* Card */}
        <div className="glass-card rounded-2xl px-8 py-10 animate-rise-in">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-28 h-16 mb-4">
              <Image
                src="/porat-logo.svg"
                alt="PORAT Private Jeweler"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <h1
              className="font-display text-2xl font-semibold tracking-wide"
              style={{ color: '#2c1810' }}
            >
              כניסה למערכת
            </h1>
            <p className="text-sm mt-1" style={{ color: '#7a5a26' }}>
              PORAT Private Jeweler CRM
            </p>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-8"
            style={{ background: 'linear-gradient(to left, transparent, #e8be5e, transparent)' }}
          />

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium"
                style={{ color: '#2c1810' }}
              >
                דואר אלקטרוני
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={IS_DEMO}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#faf8f5',
                  border: '1.5px solid #e8d5b0',
                  color: '#2c1810',
                  direction: 'ltr',
                  textAlign: 'right',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#b8934a'
                  e.target.style.boxShadow = '0 0 0 3px rgba(184, 147, 74, 0.12)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e8d5b0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: '#2c1810' }}
              >
                סיסמה
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={IS_DEMO}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#faf8f5',
                    border: '1.5px solid #e8d5b0',
                    color: '#2c1810',
                    paddingLeft: '2.75rem',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#b8934a'
                    e.target.style.boxShadow = '0 0 0 3px rgba(184, 147, 74, 0.12)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#e8d5b0'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: '#9a7535' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || IS_DEMO}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wide transition-all mt-2"
              style={{
                backgroundColor: loading ? '#d4a96a' : '#b8934a',
                color: '#ffffff',
                cursor: loading || IS_DEMO ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                boxShadow: '0 2px 8px rgba(184, 147, 74, 0.30)',
              }}
              onMouseEnter={e => {
                if (!loading && !IS_DEMO) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#9a7535'
                }
              }}
              onMouseLeave={e => {
                if (!loading && !IS_DEMO) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#b8934a'
                }
              }}
            >
              {loading ? 'מתחבר...' : IS_DEMO ? 'מצב Demo פעיל' : 'כניסה למערכת'}
            </button>
          </form>

          {/* Divider */}
          <div
            className="h-px my-6"
            style={{ background: 'linear-gradient(to left, transparent, #e8be5e, transparent)' }}
          />

          {/* Register link */}
          <p className="text-center text-sm" style={{ color: '#7a5a26' }}>
            אין לך חשבון?{' '}
            <Link
              href="/register"
              className="font-semibold underline underline-offset-2 transition-colors"
              style={{ color: '#b8934a' }}
            >
              צור חשבון חדש
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
