// The WhatsApp → CRM agent. Server-side only.
//
// Two flows:
//   • Customer flow — an unknown/customer number writes in: a lead is opened
//     automatically (or the message is appended to the already-open lead).
//     Works without an Anthropic key — no AI needed to capture an inquiry.
//   • Owner flow — the owner texts free-form customer details to the bot:
//     Claude extracts structured fields and the agent creates the customer +
//     lead in the CRM, then replies with a confirmation.
import Anthropic from '@anthropic-ai/sdk'
import { getLeads, upsertLead, findOrCreateCustomerFromLead } from './data'
import { CLOSED_LEAD_STATUSES, JEWELRY_TYPES, GOLD_TYPES, GOLD_COLORS } from './constants'
import { toLocalPhone, samePhone, sendWhatsAppText, type IncomingWhatsAppMessage } from './whatsapp'
import type { Lead } from './types'

export interface ExtractedInquiry {
  full_name: string | null
  phone: string | null
  email: string | null
  jewelry_type: string | null
  diamond_type: string | null
  gold_type: string | null
  gold_color: string | null
  carat: number | null
  ring_size: string | null
  budget: number | null
  notes: string | null
}

const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'full_name', 'phone', 'email', 'jewelry_type', 'diamond_type',
    'gold_type', 'gold_color', 'carat', 'ring_size', 'budget', 'notes',
  ],
  properties: {
    full_name: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'שם הלקוח המלא' },
    phone: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'מספר טלפון של הלקוח, ספרות בלבד' },
    email: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    jewelry_type: { anyOf: [{ type: 'string', enum: [...JEWELRY_TYPES] }, { type: 'null' }] },
    diamond_type: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'צורת חיתוך היהלום באנגלית (Round, Oval...) אם צוינה' },
    gold_type: { anyOf: [{ type: 'string', enum: [...GOLD_TYPES] }, { type: 'null' }] },
    gold_color: { anyOf: [{ type: 'string', enum: [...GOLD_COLORS] }, { type: 'null' }] },
    carat: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'משקל היהלום בקראט' },
    ring_size: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    budget: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'תקציב בשקלים' },
    notes: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'כל פרט רלוונטי נוסף שלא נכנס לשדות האחרים' },
  },
} as const

/**
 * Extracts structured customer/inquiry details from the owner's free-form
 * Hebrew message. Returns null when no ANTHROPIC_API_KEY is configured or
 * the call fails — callers fall back to storing the raw message.
 */
export async function extractInquiry(text: string): Promise<ExtractedInquiry | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system:
        'אתה מחלץ פרטי לקוח ופנייה מהודעה חופשית של בעל עסק תכשיטים. ' +
        'חלץ רק מידע שמופיע בהודעה במפורש — אל תמציא ואל תנחש. ' +
        'שדה שאין לו מידע בהודעה יקבל null.',
      messages: [{ role: 'user', content: text }],
      output_config: { format: { type: 'json_schema', schema: EXTRACTION_SCHEMA } },
    })
    if (response.stop_reason === 'refusal') return null
    const block = response.content.find(b => b.type === 'text')
    if (!block || block.type !== 'text') return null
    return JSON.parse(block.text) as ExtractedInquiry
  } catch (err) {
    console.error('[whatsapp-agent] extraction failed', err)
    return null
  }
}

async function findOpenLeadByPhone(phone: string): Promise<Lead | undefined> {
  if (!phone) return undefined
  const leads = await getLeads()
  return leads.find(l => samePhone(l.phone, phone) && !CLOSED_LEAD_STATUSES.has(l.lead_status))
}

const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

/**
 * Customer flow: a message from a customer number becomes a lead.
 * If an open lead already exists for this phone, the message is appended to
 * its notes instead of opening a duplicate.
 */
export async function handleCustomerMessage(msg: IncomingWhatsAppMessage): Promise<void> {
  const phone = toLocalPhone(msg.from)
  const existing = await findOpenLeadByPhone(phone)

  if (existing) {
    const appended = `${existing.notes ? existing.notes + '\n' : ''}[וואטסאפ ${stamp()}] ${msg.text}`
    await upsertLead({ id: existing.id, notes: appended })
    return
  }

  await upsertLead({
    full_name: msg.profileName || phone,
    phone,
    source: 'וואטסאפ',
    original_message: msg.text,
    lead_status: 'חדש',
    priority: 'בינוני',
  })
}

/**
 * Owner flow: parse the owner's free-form message, create customer + lead,
 * and reply on WhatsApp with what was created.
 */
export async function handleOwnerMessage(msg: IncomingWhatsAppMessage): Promise<void> {
  const extracted = await extractInquiry(msg.text)

  const lead = await upsertLead({
    full_name: extracted?.full_name || undefined,
    phone: extracted?.phone ? toLocalPhone(extracted.phone) : undefined,
    email: extracted?.email || undefined,
    jewelry_type: extracted?.jewelry_type || undefined,
    diamond_type: extracted?.diamond_type || undefined,
    gold_type: extracted?.gold_type || undefined,
    gold_color: extracted?.gold_color || undefined,
    carat: extracted?.carat ?? undefined,
    ring_size: extracted?.ring_size || undefined,
    budget: extracted?.budget ?? undefined,
    notes: extracted?.notes || undefined,
    source: 'וואטסאפ',
    original_message: msg.text,
    lead_status: 'חדש',
    priority: 'בינוני',
  })

  // Link (or create) the customer when we have contact details to match on
  let customerName: string | undefined
  if (lead.phone || lead.email) {
    try {
      const { customer } = await findOrCreateCustomerFromLead(lead)
      customerName = customer.full_name
      await upsertLead({ id: lead.id, customer_id: customer.id })
    } catch (err) {
      console.error('[whatsapp-agent] customer link failed', err)
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const parts = [
    extracted
      ? `✓ נקלט במערכת: ${customerName || extracted.full_name || 'ליד חדש'}`
      : '✓ נשמר כליד חדש (ללא פענוח אוטומטי — ההודעה נשמרה כלשונה)',
    extracted?.jewelry_type ? `תכשיט: ${extracted.jewelry_type}` : null,
    extracted?.budget ? `תקציב: ₪${extracted.budget.toLocaleString()}` : null,
    appUrl ? `${appUrl}/leads/${lead.id}` : null,
  ].filter(Boolean)
  await sendWhatsAppText(msg.from, parts.join('\n'))
}

/** True when the sender is one of the owner numbers (WHATSAPP_OWNER_NUMBERS, comma-separated). */
export function isOwnerNumber(from: string): boolean {
  const owners = (process.env.WHATSAPP_OWNER_NUMBERS || '')
    .split(',')
    .map(s => toLocalPhone(s))
    .filter(Boolean)
  return owners.some(o => samePhone(o, from))
}

/** Routes one incoming message to the right flow. Never throws. */
export async function handleIncomingMessage(msg: IncomingWhatsAppMessage): Promise<void> {
  try {
    if (isOwnerNumber(msg.from)) await handleOwnerMessage(msg)
    else await handleCustomerMessage(msg)
  } catch (err) {
    console.error('[whatsapp-agent] failed to process message', msg.id, err)
  }
}
