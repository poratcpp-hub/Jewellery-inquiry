/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Browsers must always fetch the freshest service worker so PWA
        // installs pick up new deploys immediately
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
