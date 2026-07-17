'use client'

import { useEffect } from 'react'

/** Registers the offline-fallback service worker (production only). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => { /* PWA is progressive enhancement — never break the app */ })
  }, [])
  return null
}
