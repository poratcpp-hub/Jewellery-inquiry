import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// /api/whatsapp is called by Meta's servers (signature-verified in the route
// itself) — it must not be redirected to the login page.
const PUBLIC_PATHS = ['/login', '/register', '/api/whatsapp']
const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (IS_DEMO || PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|porat-logo.svg).*)'],
}
