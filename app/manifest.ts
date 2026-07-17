import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PORAT Private Jeweler — CRM',
    short_name: 'PORAT',
    description: 'מערכת ניהול לקוחות, הצעות מחיר, הזמנות וכספים — PORAT Private Jeweler',
    lang: 'he',
    dir: 'rtl',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#e9e0cf',
    theme_color: '#e9e0cf',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
