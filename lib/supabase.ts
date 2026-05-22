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
      '  If you see "Host not in allowlist" errors, go to:\n' +
      '  Supabase Dashboard → Project Settings → API → API Keys\n' +
      '  Add your domain to the publishable key allowlist,\n' +
      '  OR copy the "anon public" JWT key (starts with eyJ...) into .env.local'
    )
  } else if (key.startsWith('eyJ')) {
    console.log('[Supabase] Key type: JWT anon (no host restrictions) ✅')
  }
}

export const supabase = createClient()
