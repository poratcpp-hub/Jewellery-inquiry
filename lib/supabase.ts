import { createClient } from './supabase/client'

// Surface Supabase misconfiguration early in the browser console.
// Success paths stay silent — only real problems are reported.
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || url === 'https://placeholder.supabase.co') {
    console.error('[Supabase] ❌ NEXT_PUBLIC_SUPABASE_URL is missing or is placeholder')
  }
  if (!key || key === 'placeholder-key') {
    console.error('[Supabase] ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or is placeholder')
  } else if (key.startsWith('sb_publishable_')) {
    console.warn(
      '[Supabase] ⚠️  Key type: PUBLISHABLE — this key requires a host allowlist.\n' +
      '  Fix: copy the "anon public" JWT key (starts with eyJ...) from\n' +
      '  Supabase → Project Settings → API → API Keys\n' +
      '  and set it as NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local\n' +
      '  (or Vercel environment variables for deployed instances)'
    )
  }
}

export const supabase = createClient()
