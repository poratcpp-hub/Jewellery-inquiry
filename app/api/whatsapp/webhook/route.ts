// WhatsApp Business Cloud API webhook.
// GET  — Meta's one-time endpoint verification handshake.
// POST — incoming messages; each becomes a CRM lead (see lib/whatsapp-agent).
import { NextRequest, NextResponse } from 'next/server'
import { verifyWhatsAppSignature, parseWhatsAppWebhook } from '@/lib/whatsapp'
import { handleIncomingMessage } from '@/lib/whatsapp-agent'

export const dynamic = 'force-dynamic'

// Meta retries deliveries; a small in-memory LRU absorbs duplicates within a
// warm serverless instance. Cross-instance duplicates are further defused by
// the open-lead dedupe in the agent itself.
const seen = new Set<string>()
const remember = (id: string) => {
  seen.add(id)
  if (seen.size > 500) {
    const first = seen.values().next().value
    if (first) seen.delete(first)
  }
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  const raw = await req.text()

  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.error('[whatsapp] WHATSAPP_APP_SECRET is not configured')
    return new NextResponse('Not configured', { status: 503 })
  }
  if (!verifyWhatsAppSignature(raw, req.headers.get('x-hub-signature-256'), appSecret)) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return new NextResponse('Bad payload', { status: 400 })
  }

  const messages = parseWhatsAppWebhook(payload).filter(m => !seen.has(m.id))
  messages.forEach(m => remember(m.id))

  // Process before responding — serverless instances may freeze after the
  // response is returned, so fire-and-forget work can be lost.
  await Promise.allSettled(messages.map(handleIncomingMessage))

  return NextResponse.json({ received: true })
}
