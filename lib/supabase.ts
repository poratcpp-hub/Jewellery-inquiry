import { createClient } from './supabase/client'

if (typeof window !== 'undefined') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || url === 'https://placeholder.supabase.co') {
    console.error('[Supabase] ❌ NEXT_PUBLIC_SUPABASE_URL is missing or is placeholder')
  } else {
    console.log('[Supabase] URL:', url)
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
  } else if (key.startsWith('eyJ')) {
    console.log('[Supabase] Key type: JWT anon — no host restrictions ✅')
  }
  // Version marker — if you see this line, the cache-bust build is running
  console.log('[Supabase] data layer v2 — no embedded joins ✅')
}

export const supabase = createClient()
