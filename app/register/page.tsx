'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (IS_DEMO) {
      router.push('/')
      return
    }
    setError(null)

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות. אנא נסה שוב.')
      return
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים.')
      return
    }

    setLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          setError('כתובת האימייל כבר רשומה במערכת. אנא היכנס או השתמש בכתובת אחרת.')
        } else {
          setError('אירעה שגיאה בהרשמה. אנא נסה שוב.')
        }
      } else {
        setSuccess(true)
      }
    } catch {
      setError('אירעה שגיאה. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: '#faf8f5',
    border: '1.5px solid #e8d5b0',
    color: '#2c1810',
  }

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = '#b8934a'
      e.target.style.boxShadow = '0 0 0 3px rgba(184, 147, 74, 0.12)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = '#e8d5b0'
      e.target.style.boxShadow = 'none'
    },
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#faf8f5' }}
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
        <div
          className="rounded-2xl px-8 py-10"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 32px rgba(44, 24, 16, 0.10), 0 1px 4px rgba(184, 147, 74, 0.08)',
          }}
        >
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
              className="text-xl font-semibold tracking-wide"
              style={{ color: '#2c1810' }}
            >
              יצירת חשבון חדש
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

          {/* Success message */}
          {success ? (
            <div className="space-y-6">
              <div
                className="px-4 py-4 rounded-xl text-sm text-center"
                style={{
                  backgroundColor: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div className="text-2xl mb-2">✓</div>
                <p className="font-semibold mb-1">ההרשמה הצליחה!</p>
                <p>נשלח מייל אימות לכתובתך</p>
                <p className="text-xs mt-1 opacity-75">{email}</p>
              </div>
              <p className="text-center text-sm" style={{ color: '#7a5a26' }}>
                לאחר אימות האימייל תוכל{' '}
                <Link
                  href="/login"
                  className="font-semibold underline underline-offset-2"
                  style={{ color: '#b8934a' }}
                >
                  להיכנס למערכת
                </Link>
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full name field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium"
                  style={{ color: '#2c1810' }}
                >
                  שם מלא
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  disabled={IS_DEMO}
                  placeholder="ישראל ישראלי"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  {...focusHandlers}
                />
              </div>

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
                    ...inputStyle,
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                  {...focusHandlers}
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
                      ...inputStyle,
                      paddingLeft: '2.75rem',
                      direction: 'ltr',
                      textAlign: 'right',
                    }}
                    {...focusHandlers}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
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

              {/* Confirm password field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium"
                  style={{ color: '#2c1810' }}
                >
                  אימות סיסמה
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    disabled={IS_DEMO}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      ...inputStyle,
                      paddingLeft: '2.75rem',
                      direction: 'ltr',
                      textAlign: 'right',
                    }}
                    {...focusHandlers}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#9a7535' }}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  >
                    {showConfirmPassword ? (
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
                {loading ? 'יוצר חשבון...' : IS_DEMO ? 'מצב Demo פעיל' : 'יצירת חשבון'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div
            className="h-px my-6"
            style={{ background: 'linear-gradient(to left, transparent, #e8be5e, transparent)' }}
          />

          {/* Login link */}
          <p className="text-center text-sm" style={{ color: '#7a5a26' }}>
            יש לך חשבון?{' '}
            <Link
              href="/login"
              className="font-semibold underline underline-offset-2 transition-colors"
              style={{ color: '#b8934a' }}
            >
              כניסה
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
