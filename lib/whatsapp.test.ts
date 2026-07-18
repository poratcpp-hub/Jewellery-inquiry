import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { verifyWhatsAppSignature, parseWhatsAppWebhook, toLocalPhone, samePhone } from './whatsapp'

const sign = (body: string, secret: string) =>
  'sha256=' + crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex')

describe('verifyWhatsAppSignature', () => {
  it('accepts a valid signature', () => {
    const body = '{"a":1}'
    expect(verifyWhatsAppSignature(body, sign(body, 'secret'), 'secret')).toBe(true)
  })
  it('rejects a wrong signature', () => {
    expect(verifyWhatsAppSignature('{"a":1}', sign('{"a":2}', 'secret'), 'secret')).toBe(false)
  })
  it('rejects a wrong secret', () => {
    const body = '{"a":1}'
    expect(verifyWhatsAppSignature(body, sign(body, 'other'), 'secret')).toBe(false)
  })
  it('rejects missing header or secret', () => {
    expect(verifyWhatsAppSignature('x', null, 'secret')).toBe(false)
    expect(verifyWhatsAppSignature('x', 'sha256=abc', '')).toBe(false)
  })
  it('rejects malformed header without throwing', () => {
    expect(verifyWhatsAppSignature('x', 'not-a-signature', 'secret')).toBe(false)
  })
})

describe('parseWhatsAppWebhook', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: '1',
      changes: [{
        field: 'messages',
        value: {
          messaging_product: 'whatsapp',
          metadata: { phone_number_id: '999' },
          contacts: [{ wa_id: '972521234567', profile: { name: 'דנה לוי' } }],
          messages: [
            { id: 'wamid.1', from: '972521234567', type: 'text', timestamp: '1', text: { body: ' שלום, מתעניינת בטבעת ' } },
            { id: 'wamid.2', from: '972521234567', type: 'image', timestamp: '2' },
          ],
        },
      }],
    }],
  }

  it('extracts text messages with profile name and trims whitespace', () => {
    const msgs = parseWhatsAppWebhook(payload)
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toMatchObject({
      id: 'wamid.1',
      from: '972521234567',
      profileName: 'דנה לוי',
      text: 'שלום, מתעניינת בטבעת',
    })
  })

  it('ignores status-update payloads', () => {
    const statuses = {
      entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.x', status: 'delivered' }] } }] }],
    }
    expect(parseWhatsAppWebhook(statuses)).toHaveLength(0)
  })

  it('never throws on malformed input', () => {
    expect(parseWhatsAppWebhook(null)).toEqual([])
    expect(parseWhatsAppWebhook({})).toEqual([])
    expect(parseWhatsAppWebhook({ entry: [{}, { changes: [{}, { value: { messages: [{}] } }] }] })).toEqual([])
    expect(parseWhatsAppWebhook('garbage')).toEqual([])
  })
})

describe('toLocalPhone / samePhone', () => {
  it('converts wa_id international form to local form', () => {
    expect(toLocalPhone('972521234567')).toBe('0521234567')
    expect(toLocalPhone('+972 52-123-4567')).toBe('0521234567')
  })
  it('keeps local form as-is', () => {
    expect(toLocalPhone('052-1234567')).toBe('0521234567')
  })
  it('handles empty values', () => {
    expect(toLocalPhone('')).toBe('')
    expect(toLocalPhone(undefined)).toBe('')
  })
  it('matches CRM-stored local numbers against wa_ids', () => {
    expect(samePhone('052-1234567', '972521234567')).toBe(true)
    expect(samePhone('0521234567', '972521234568')).toBe(false)
    expect(samePhone('', '972521234567')).toBe(false)
  })
})
