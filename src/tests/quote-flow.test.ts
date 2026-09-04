/**
 * E2E simulation: Quote sending flow
 *
 * Simulates the full lifecycle of a quote:
 *   Freelancer builds quote → sends → client views → client accepts/declines
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { calcTotal, STATUS_LABELS, formatCurrency } from '@/lib/utils'
import type { QuoteItem, QuoteStatus } from '@/lib/types'

const publicPageSrc = readFileSync(
  resolve(__dirname, '../app/q/[token]/page.tsx'),
  'utf-8'
)

// --- Helpers that mirror the app's runtime logic ---

const isPending = (status: QuoteStatus) => ['sent', 'viewed'].includes(status)
const isAccepted = (status: QuoteStatus) => status === 'accepted'
const isDeclined = (status: QuoteStatus) => status === 'declined'

// Minimal in-memory quote that tracks state across the test flow
interface MockQuote {
  status: QuoteStatus
  public_token: string | null
  viewed_at: string | null
  accepted_at: string | null
  declined_at: string | null
  items: QuoteItem[]
  discount: number
  include_vat: boolean
}

function makeItem(name: string, qty: number, price: number, i = 0): QuoteItem {
  return { id: String(i), quote_id: 'q1', service_id: null, name, description: null, quantity: qty, unit_price: price, sort_order: i, item_type: 'one_time', recurring_interval: null }
}

// Simulates the server action that sends a quote
function sendQuote(quote: MockQuote): MockQuote {
  if (quote.status !== 'draft') throw new Error('Only draft quotes can be sent')
  return { ...quote, status: 'sent', public_token: 'tok_abc123' }
}

// Simulates what happens when a client opens the public link
function clientViewsQuote(quote: MockQuote): MockQuote {
  if (quote.status !== 'sent') return quote // already viewed/resolved
  return { ...quote, status: 'viewed', viewed_at: new Date().toISOString() }
}

// Simulates client accepting
function clientAccepts(quote: MockQuote): MockQuote {
  if (!isPending(quote.status)) throw new Error('Quote is not pending')
  return { ...quote, status: 'accepted', accepted_at: new Date().toISOString() }
}

// Simulates client declining
function clientDeclines(quote: MockQuote): MockQuote {
  if (!isPending(quote.status)) throw new Error('Quote is not pending')
  return { ...quote, status: 'declined', declined_at: new Date().toISOString() }
}

// --- Tests ---

describe('Quote flow - e2e simulation', () => {
  let quote: MockQuote

  beforeEach(() => {
    quote = {
      status: 'draft',
      public_token: null,
      viewed_at: null,
      accepted_at: null,
      declined_at: null,
      discount: 0,
      include_vat: true,
      items: [
        makeItem('עיצוב לוגו', 1, 2000, 0),
        makeItem('בניית אתר', 1, 8000, 1),
      ],
    }
  })

  // Step 1 - Freelancer builds the quote
  describe('Step 1: building the quote', () => {
    it('calculates subtotal correctly', () => {
      const { subtotal } = calcTotal(quote.items, 0, 18, true)
      expect(subtotal).toBe(10000)
    })

    it('adds 18% VAT correctly', () => {
      const { vatAmount, total } = calcTotal(quote.items, 0, 18, true)
      expect(vatAmount).toBe(1800)
      expect(total).toBe(11800)
    })

    it('applies discount before VAT', () => {
      const { discountAmount, vatAmount, total } = calcTotal(quote.items, 10, 18, true)
      expect(discountAmount).toBe(1000)
      expect(vatAmount).toBeCloseTo(1620)
      expect(total).toBeCloseTo(10620)
    })

    it('עוסק זעיר: no VAT even when include_vat is true', () => {
      const { vatAmount, total, subtotal } = calcTotal(quote.items, 0, 0, true)
      expect(vatAmount).toBe(0)
      expect(total).toBe(subtotal)
    })

    it('formats total as Hebrew currency', () => {
      const { total } = calcTotal(quote.items, 0, 18, true)
      const formatted = formatCurrency(total, 'ILS')
      expect(formatted).toContain('11,800')
      expect(formatted).toContain('₪')
    })

    it('draft quote has no public token', () => {
      expect(quote.status).toBe('draft')
      expect(quote.public_token).toBeNull()
    })
  })

  // Step 2 - Freelancer sends the quote
  describe('Step 2: sending the quote', () => {
    it('status changes from draft → sent', () => {
      quote = sendQuote(quote)
      expect(quote.status).toBe('sent')
    })

    it('public token is generated on send', () => {
      quote = sendQuote(quote)
      expect(quote.public_token).toBeTruthy()
    })

    it('sent quote is pending', () => {
      quote = sendQuote(quote)
      expect(isPending(quote.status)).toBe(true)
    })

    it('cannot send a non-draft quote', () => {
      quote = sendQuote(quote)
      expect(() => sendQuote(quote)).toThrow()
    })
  })

  // Step 3 - Client opens the link
  describe('Step 3: client views the quote', () => {
    beforeEach(() => { quote = sendQuote(quote) })

    it('status changes from sent → viewed', () => {
      quote = clientViewsQuote(quote)
      expect(quote.status).toBe('viewed')
    })

    it('viewed_at is recorded', () => {
      quote = clientViewsQuote(quote)
      expect(quote.viewed_at).toBeTruthy()
    })

    it('viewing again does not reset status', () => {
      quote = clientViewsQuote(quote)
      quote = clientViewsQuote(quote) // second visit
      expect(quote.status).toBe('viewed')
    })

    it('viewed quote is still pending (can still accept/decline)', () => {
      quote = clientViewsQuote(quote)
      expect(isPending(quote.status)).toBe(true)
    })
  })

  // Step 4a - Client accepts
  describe('Step 4a: client accepts the quote', () => {
    beforeEach(() => {
      quote = sendQuote(quote)
      quote = clientViewsQuote(quote)
    })

    it('status changes to accepted', () => {
      quote = clientAccepts(quote)
      expect(quote.status).toBe('accepted')
    })

    it('accepted_at is recorded', () => {
      quote = clientAccepts(quote)
      expect(quote.accepted_at).toBeTruthy()
    })

    it('accepted quote is no longer pending', () => {
      quote = clientAccepts(quote)
      expect(isPending(quote.status)).toBe(false)
      expect(isAccepted(quote.status)).toBe(true)
    })

    it('accepted status has green color', () => {
      expect(STATUS_LABELS.accepted.color).toContain('green')
    })

    it('cannot accept an already-accepted quote', () => {
      quote = clientAccepts(quote)
      expect(() => clientAccepts(quote)).toThrow()
    })
  })

  // Step 4b - Client declines
  describe('Step 4b: client declines the quote', () => {
    beforeEach(() => {
      quote = sendQuote(quote)
      quote = clientViewsQuote(quote)
    })

    it('status changes to declined', () => {
      quote = clientDeclines(quote)
      expect(quote.status).toBe('declined')
    })

    it('declined_at is recorded', () => {
      quote = clientDeclines(quote)
      expect(quote.declined_at).toBeTruthy()
    })

    it('declined quote is no longer pending', () => {
      quote = clientDeclines(quote)
      expect(isPending(quote.status)).toBe(false)
      expect(isDeclined(quote.status)).toBe(true)
    })

    it('declined status has red color', () => {
      expect(STATUS_LABELS.declined.color).toContain('red')
    })
  })
})
