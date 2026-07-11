'use client' // Global error boundary — replaces the root layout when it crashes

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, background: '#e9e0cf', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 16, padding: 32, boxShadow: '0 16px 40px rgba(26,18,9,0.12)' }}>
            <h1 style={{ margin: 0, fontSize: 22, color: '#1a1209' }}>משהו השתבש</h1>
            <p style={{ marginTop: 8, fontSize: 14, color: '#7a6a52' }}>
              אירעה שגיאה כללית במערכת. הנתונים שלך בטוחים.
            </p>
            {error?.digest && (
              <p style={{ marginTop: 8, fontSize: 11, color: '#c5b8a0', fontFamily: 'monospace' }}>קוד שגיאה: {error.digest}</p>
            )}
            <button
              onClick={() => unstable_retry()}
              style={{ marginTop: 20, padding: '10px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 500, background: 'linear-gradient(to bottom, #d4a96a, #9a7535)' }}
            >
              נסה שוב
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
