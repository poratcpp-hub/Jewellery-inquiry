// WhatsApp Business Cloud API helpers — server-side only.
// Pure parsing/normalization functions are kept separate from I/O so they
// can be unit-tested without network access.
import crypto from 'crypto'

export interface IncomingWhatsAppMessage {
  id: string
  /** Sender wa_id, e.g. "972521234567" */
  from: string
  /** Sender's WhatsApp profile name, if provided */
  profileName?: string
  /** Text body — only text messages are parsed */
  text: string
  timestamp?: string
}

/**
 * Verifies Meta's X-Hub-Signature-256 header (HMAC-SHA256 over the raw body).
 * Uses timingSafeEqual to avoid signature-timing leaks.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Extracts text messages from a WhatsApp Cloud API webhook payload.
 * Status updates (delivered/read receipts) and non-text messages are skipped.
 * Never throws on malformed payloads — returns whatever it could parse.
 */
export function parseWhatsAppWebhook(payload: unknown): IncomingWhatsAppMessage[] {
  const messages: IncomingWhatsAppMessage[] = []
  const entries = (payload as { entry?: unknown[] })?.entry
  if (!Array.isArray(entries)) return messages

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes
    if (!Array.isArray(changes)) continue
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value
      if (!value || typeof value !== 'object') continue
      const rawMessages = value.messages
      if (!Array.isArray(rawMessages)) continue

      const contacts = Array.isArray(value.contacts) ? value.contacts as Array<{ wa_id?: string; profile?: { name?: string } }> : []
      const nameByWaId = new Map<string, string>()
      for (const c of contacts) {
        if (c?.wa_id && c?.profile?.name) nameByWaId.set(c.wa_id, c.profile.name)
      }

      for (const raw of rawMessages) {
        const m = raw as { id?: string; from?: string; type?: string; timestamp?: string; text?: { body?: string } }
        if (!m?.id || !m?.from) continue
        if (m.type !== 'text' || typeof m.text?.body !== 'string' || !m.text.body.trim()) continue
        messages.push({
          id: m.id,
          from: m.from,
          profileName: nameByWaId.get(m.from),
          text: m.text.body.trim(),
          timestamp: m.timestamp,
        })
      }
    }
  }
  return messages
}

/**
 * Converts a phone in any common form (WhatsApp wa_id "972521234567",
 * "+972 52-123-4567", "052-1234567") to the local Israeli digits form
 * the CRM stores: "0521234567". Non-Israeli numbers keep their digits as-is.
 */
export function toLocalPhone(value: string | null | undefined): string {
  const digits = (value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('972')) return '0' + digits.slice(3)
  return digits
}

/** True when both values refer to the same phone number (local-form compare). */
export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const la = toLocalPhone(a)
  const lb = toLocalPhone(b)
  return !!la && !!lb && la === lb
}

/**
 * Sends a WhatsApp text message via the Cloud API. Best-effort: returns false
 * (and logs) on failure instead of throwing, so a reply failure never breaks
 * the webhook processing that already persisted CRM data.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return false
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body },
      }),
    })
    if (!res.ok) {
      console.error('[whatsapp] send failed', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('[whatsapp] send error', err)
    return false
  }
}
