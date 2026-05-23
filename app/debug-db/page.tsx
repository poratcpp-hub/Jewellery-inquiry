'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface QueryResult {
  table: string
  ok: boolean
  rowCount: number | null
  error: {
    message: string
    code: string
    details: string
    hint: string
    status: number | string
    name: string
    raw: string
  } | null
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-500 w-20 shrink-0">{label}:</span>
      <span className="font-mono break-all">{value || '(empty)'}</span>
    </div>
  )
}

export default function DebugDbPage() {
  const [results, setResults] = useState<QueryResult[]>([])
  const [envInfo, setEnvInfo] = useState({ url: '', keyType: '' })
  const [done, setDone] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    const keyType = key.startsWith('eyJ')
      ? 'JWT anon ✅'
      : key.startsWith('sb_publishable_')
      ? 'PUBLISHABLE ⚠️ (host allowlist required)'
      : key
      ? 'unknown format'
      : '(missing)'
    setEnvInfo({ url, keyType })

    async function run() {
      console.log('[DEBUG-DB] ─── Starting minimal DB test (no joins, no filters) ───')
      console.log('[DEBUG-DB] URL:', url)
      console.log('[DEBUG-DB] Key type:', keyType)

      const makeResult = (
        table: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any[] | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: any,
      ): QueryResult => {
        if (error) {
          const raw = (() => {
            try { return JSON.stringify(error) } catch { return String(error) }
          })()
          console.error(`[DEBUG-DB] ❌ ${table} FAILED`, {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
            status: error?.status,
            name: error?.name,
            raw: error,
          })
          console.error(`[DEBUG-DB] ❌ ${table} raw string:`, raw)
          return {
            table, ok: false, rowCount: null,
            error: {
              message: String(error?.message ?? ''),
              code: String(error?.code ?? ''),
              details: String(error?.details ?? ''),
              hint: String(error?.hint ?? ''),
              status: error?.status ?? '',
              name: String(error?.name ?? ''),
              raw,
            },
          }
        }
        console.log(`[DEBUG-DB] ✅ ${table} OK — ${data?.length ?? 0} row(s)`, data)
        return { table, ok: true, rowCount: data?.length ?? 0, error: null }
      }

      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id')
        .limit(1)

      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id')
        .limit(1)

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .limit(1)

      setResults([
        makeResult('customers', customers, customersError),
        makeResult('quotes', quotes, quotesError),
        makeResult('orders', orders, ordersError),
      ])
      setDone(true)
      console.log('[DEBUG-DB] ─── Done ───')
    }

    run()
  }, [])

  return (
    <div dir="ltr" style={{ fontFamily: 'monospace', padding: 32, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>DB Debug — Minimal Query Test</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 13 }}>
        Open DevTools → Console for full raw error objects.
      </p>

      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 24, fontSize: 12 }}>
        <div><strong>Supabase URL:</strong> {envInfo.url || '(missing)'}</div>
        <div><strong>Key type:</strong> {envInfo.keyType}</div>
      </div>

      {!done && <p style={{ color: '#0066cc' }}>⏳ Running queries...</p>}

      {results.map(r => (
        <div
          key={r.table}
          style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 8,
            border: `2px solid ${r.ok ? '#22c55e' : '#ef4444'}`,
            background: r.ok ? '#f0fdf4' : '#fef2f2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{r.ok ? '✅' : '❌'}</span>
            <strong style={{ fontSize: 15 }}>{r.table}</strong>
            <span style={{ color: r.ok ? '#15803d' : '#dc2626' }}>
              {r.ok ? `OK — ${r.rowCount} row(s)` : 'FAILED'}
            </span>
          </div>

          {r.error && (
            <div style={{ fontSize: 12, color: '#991b1b', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Row label="message" value={r.error.message} />
              <Row label="code" value={r.error.code} />
              <Row label="details" value={r.error.details} />
              <Row label="hint" value={r.error.hint} />
              <Row label="status" value={String(r.error.status)} />
              <Row label="name" value={r.error.name} />
              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>raw JSON:</div>
                <pre style={{ background: '#fee2e2', padding: 8, borderRadius: 4, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {r.error.raw}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}

      {done && (
        <div style={{ marginTop: 24, padding: 12, background: '#f0f9ff', borderRadius: 6, fontSize: 12, color: '#0369a1' }}>
          <strong>Next step:</strong>
          {results.every(r => r.ok)
            ? ' ✅ All 3 tables accessible. Issue is in dashboard query logic, not permissions.'
            : ' ❌ One or more tables failed. Fix Supabase RLS/permissions before touching dashboard code. Run supabase/security_cleanup.sql in Supabase SQL Editor.'}
        </div>
      )}
    </div>
  )
}
